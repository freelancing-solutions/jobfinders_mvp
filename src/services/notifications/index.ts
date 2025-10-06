import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { PrismaClient } from '@prisma/client'
import { EventQueue } from '../queue/event-queue'
import { ChannelOrchestrator } from './channel-orchestrator'
import { DeliveryEngine } from './delivery-engine'
import { EmailChannelService } from './channels/email-channel'
import { SMSChannelService } from './channels/sms-channel'
import { PushChannelService } from './channels/push-channel'
import { InAppChannelService } from './channels/in-app-channel'
import { NotificationAnalyticsEngine } from './analytics-engine'
import { NotificationHealthChecker } from './monitoring/health-check'
import { NotificationAlertManager } from './monitoring/alerts'
import { notificationConfig, validateEnvironmentVariables } from './config/deployment'
import { createNotificationRoutes } from './routes'
import { setupWebSocketHandlers } from './websocket'

/**
 * Main notification service application
 */
class NotificationService {
  private app: express.Application
  private server: any
  private io: SocketIOServer
  private prisma: PrismaClient
  private eventQueue: EventQueue
  private orchestrator: ChannelOrchestrator
  private deliveryEngine: DeliveryEngine
  private analyticsEngine: NotificationAnalyticsEngine
  private healthChecker: NotificationHealthChecker
  private alertManager: NotificationAlertManager
  private channels: {
    email: EmailChannelService
    sms: SMSChannelService
    push: PushChannelService
    inApp: InAppChannelService
  }

  constructor() {
    this.app = express()
    this.server = createServer(this.app)
    this.io = new SocketIOServer(this.server, {
      cors: notificationConfig.channels.inApp.websocket.cors,
      path: notificationConfig.channels.inApp.websocket.path,
    })
    
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: notificationConfig.database.url,
        },
      },
    })
  }

  /**
   * Initialize all services and dependencies
   */
  async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing Notification Service...')

      // Validate environment variables
      const envValidation = validateEnvironmentVariables()
      if (!envValidation.valid) {
        throw new Error(`Missing required environment variables: ${envValidation.missing.join(', ')}`)
      }

      // Initialize core services
      await this.initializeCoreServices()
      
      // Initialize channels
      await this.initializeChannels()
      
      // Initialize orchestrator and delivery engine
      await this.initializeOrchestration()
      
      // Initialize monitoring
      await this.initializeMonitoring()
      
      // Setup middleware and routes
      this.setupMiddleware()
      this.setupRoutes()
      this.setupWebSocket()
      
      // Setup graceful shutdown
      this.setupGracefulShutdown()

      console.log('✅ Notification Service initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize Notification Service:', error)
      throw error
    }
  }

  /**
   * Initialize core services (database, queue, analytics)
   */
  private async initializeCoreServices(): Promise<void> {
    console.log('📊 Initializing core services...')

    // Connect to database
    await this.prisma.$connect()
    console.log('✅ Database connected')

    // Initialize event queue
    this.eventQueue = new EventQueue({
      redis: notificationConfig.queue.redis,
      defaultJobOptions: {
        attempts: notificationConfig.queue.retryConfig.attempts,
        backoff: {
          type: notificationConfig.queue.retryConfig.backoff,
          delay: notificationConfig.queue.retryConfig.delay,
        },
      },
    })
    await this.eventQueue.initialize()
    console.log('✅ Event queue initialized')

    // Initialize analytics engine
    this.analyticsEngine = new NotificationAnalyticsEngine(this.prisma)
    await this.analyticsEngine.initialize()
    console.log('✅ Analytics engine initialized')
  }

  /**
   * Initialize notification channels
   */
  private async initializeChannels(): Promise<void> {
    console.log('📧 Initializing notification channels...')

    // Email channel
    this.channels = {} as any
    this.channels.email = new EmailChannelService(
      this.prisma,
      this.analyticsEngine,
      notificationConfig.channels.email
    )
    await this.channels.email.initialize()
    console.log('✅ Email channel initialized')

    // SMS channel
    this.channels.sms = new SMSChannelService(
      this.prisma,
      this.analyticsEngine,
      notificationConfig.channels.sms
    )
    await this.channels.sms.initialize()
    console.log('✅ SMS channel initialized')

    // Push notification channel
    this.channels.push = new PushChannelService(
      this.prisma,
      this.analyticsEngine,
      notificationConfig.channels.push
    )
    await this.channels.push.initialize()
    console.log('✅ Push notification channel initialized')

    // In-app notification channel
    this.channels.inApp = new InAppChannelService(
      this.prisma,
      this.analyticsEngine,
      this.io,
      notificationConfig.channels.inApp
    )
    await this.channels.inApp.initialize()
    console.log('✅ In-app notification channel initialized')
  }

  /**
   * Initialize orchestration services
   */
  private async initializeOrchestration(): Promise<void> {
    console.log('🎯 Initializing orchestration services...')

    // Channel orchestrator
    this.orchestrator = new ChannelOrchestrator(
      this.prisma,
      this.eventQueue,
      this.analyticsEngine
    )

    // Register channels
    this.orchestrator.registerChannel('email', this.channels.email)
    this.orchestrator.registerChannel('sms', this.channels.sms)
    this.orchestrator.registerChannel('push', this.channels.push)
    this.orchestrator.registerChannel('inApp', this.channels.inApp)

    await this.orchestrator.initialize()
    console.log('✅ Channel orchestrator initialized')

    // Delivery engine
    this.deliveryEngine = new DeliveryEngine(
      this.orchestrator,
      this.analyticsEngine,
      this.prisma,
      this.eventQueue,
      {
        batchSize: notificationConfig.queue.batchSizes.default,
        batchTimeout: 30000,
        concurrency: notificationConfig.queue.concurrency.default,
        retryAttempts: notificationConfig.queue.retryConfig.attempts,
        retryDelay: notificationConfig.queue.retryConfig.delay,
      }
    )
    await this.deliveryEngine.initialize()
    console.log('✅ Delivery engine initialized')
  }

  /**
   * Initialize monitoring services
   */
  private async initializeMonitoring(): Promise<void> {
    console.log('📊 Initializing monitoring services...')

    // Health checker
    this.healthChecker = new NotificationHealthChecker(
      this.prisma,
      this.eventQueue,
      this.channels,
      this.analyticsEngine,
      notificationConfig.monitoring.healthCheck
    )
    await this.healthChecker.initialize()
    console.log('✅ Health checker initialized')

    // Alert manager
    this.alertManager = new NotificationAlertManager(
      this.analyticsEngine,
      this.healthChecker,
      notificationConfig.monitoring.alerts
    )
    await this.alertManager.initialize()
    console.log('✅ Alert manager initialized')
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet())
    
    // CORS
    this.app.use(cors({
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://jobfinders.com', 'https://app.jobfinders.com']
        : ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true,
    }))
    
    // Compression
    if (notificationConfig.performance.compression.enabled) {
      this.app.use(compression({
        level: notificationConfig.performance.compression.level,
      }))
    }
    
    // Body parsing
    this.app.use(express.json({ limit: '10mb' }))
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }))
    
    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} ${req.method} ${req.path}`)
      next()
    })
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', async (req, res) => {
      try {
        const health = await this.healthChecker.checkHealth()
        res.status(health.status === 'healthy' ? 200 : 503).json(health)
      } catch (error) {
        res.status(503).json({
          status: 'unhealthy',
          error: 'Health check failed',
        })
      }
    })

    // Notification API routes
    const notificationRoutes = createNotificationRoutes(
      this.orchestrator,
      this.analyticsEngine,
      this.healthChecker
    )
    this.app.use('/api/notifications', notificationRoutes)

    // Webhook routes for channels
    this.app.use('/webhooks/email', this.channels.email.getWebhookHandler())
    this.app.use('/webhooks/sms', this.channels.sms.getWebhookHandler())
    this.app.use('/webhooks/push', this.channels.push.getWebhookHandler())

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({ error: 'Not found' })
    })

    // Error handler
    this.app.use((error: any, req: any, res: any, next: any) => {
      console.error('Unhandled error:', error)
      res.status(500).json({ error: 'Internal server error' })
    })
  }

  /**
   * Setup WebSocket handlers
   */
  private setupWebSocket(): void {
    setupWebSocketHandlers(this.io, this.channels.inApp, this.prisma)
  }

  /**
   * Setup graceful shutdown
   */
  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`)
      
      try {
        // Stop accepting new connections
        this.server.close(() => {
          console.log('✅ HTTP server closed')
        })

        // Close WebSocket connections
        this.io.close(() => {
          console.log('✅ WebSocket server closed')
        })

        // Shutdown services
        await this.deliveryEngine.shutdown()
        console.log('✅ Delivery engine shutdown')

        await this.eventQueue.close()
        console.log('✅ Event queue closed')

        await this.prisma.$disconnect()
        console.log('✅ Database disconnected')

        console.log('✅ Graceful shutdown completed')
        process.exit(0)
      } catch (error) {
        console.error('❌ Error during shutdown:', error)
        process.exit(1)
      }
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'))
    process.on('SIGINT', () => shutdown('SIGINT'))
  }

  /**
   * Start the notification service
   */
  async start(): Promise<void> {
    const port = process.env.PORT || 3000
    
    this.server.listen(port, () => {
      console.log(`🚀 Notification Service running on port ${port}`)
      console.log(`📡 WebSocket server running on port ${notificationConfig.channels.inApp.websocket.port}`)
      console.log(`🌍 Environment: ${notificationConfig.environment}`)
    })
  }
}

/**
 * Bootstrap the notification service
 */
async function bootstrap(): Promise<void> {
  try {
    const service = new NotificationService()
    await service.initialize()
    await service.start()
  } catch (error) {
    console.error('❌ Failed to start Notification Service:', error)
    process.exit(1)
  }
}

// Start the service if this file is run directly
if (require.main === module) {
  bootstrap()
}

export { NotificationService, bootstrap }