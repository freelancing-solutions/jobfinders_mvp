dateimport { EventEmitter } from 'events'
import { db } from '@/lib/db'
import { redis } from '@/lib/redis'
import { EventQueueManager } from '@/lib/queue/event-queue'
import { NotificationPreferencesManager } from '@/lib/notification-preferences'
import { logger } from '@/lib/logger'

/**
 * Notification request structure for the orchestrator
 */
export interface NotificationRequest {
  id?: string
  userId: string
  type: string
  title: string
  message: string
  data?: Record<string, any>
  channels?: ('email' | 'sms' | 'push' | 'in_app' | 'web')[]
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  templateId?: string
  campaignId?: string
  scheduledFor?: Date
  expiresAt?: Date
  metadata?: Record<string, any>
}

/**
 * Channel routing configuration
 */
interface ChannelConfig {
  name: string
  enabled: boolean
  priority: number
  fallbackChannels?: string[]
  rateLimits?: {
    perMinute?: number
    perHour?: number
    perDay?: number
  }
  retryPolicy?: {
    maxAttempts: number
    backoffMultiplier: number
    initialDelay: number
  }
}

/**
 * Delivery result from a channel
 */
export interface ChannelDeliveryResult {
  channel: string
  success: boolean
  messageId?: string
  error?: string
  metadata?: Record<string, any>
  deliveredAt?: Date
}

/**
 * Channel Orchestrator Service
 * 
 * Central coordination and routing service for multi-channel notifications.
 * Handles channel selection, load balancing, fallback routing, and delivery tracking.
 */
export class ChannelOrchestrator extends EventEmitter {
  private static instance: ChannelOrchestrator
  private preferencesManager: NotificationPreferencesManager
  private queueManager: EventQueueManager
  private channelConfigs: Map<string, ChannelConfig> = new Map()
  private channelServices: Map<string, any> = new Map()
  private isInitialized = false

  private constructor() {
    super()
    this.preferencesManager = new NotificationPreferencesManager()
    this.queueManager = new EventQueueManager({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD
      }
    })
    this.setupChannelConfigs()
  }

  public static getInstance(): ChannelOrchestrator {
    if (!ChannelOrchestrator.instance) {
      ChannelOrchestrator.instance = new ChannelOrchestrator()
    }
    return ChannelOrchestrator.instance
  }

  /**
   * Initialize the orchestrator with channel services
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Initialize queue manager
      await this.queueManager.initialize()

      // Setup event listeners
      this.setupEventListeners()

      this.isInitialized = true
      logger.info('Channel Orchestrator initialized successfully')
    } catch (error) {
      logger.error('Failed to initialize Channel Orchestrator:', error)
      throw error
    }
  }

  /**
   * Register a channel service
   */
  public registerChannelService(channelName: string, service: any): void {
    this.channelServices.set(channelName, service)
    logger.info(`Channel service registered: ${channelName}`)
  }

  /**
   * Send notification through optimal channels
   */
  public async sendNotification(request: NotificationRequest): Promise<string> {
    try {
      // Generate notification ID if not provided
      const notificationId = request.id || `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Validate request
      await this.validateRequest(request)

      // Store notification in database
      const notification = await this.persistNotification({
        ...request,
        id: notificationId
      })

      // Determine optimal channels
      const selectedChannels = await this.selectChannels(request)

      if (selectedChannels.length === 0) {
        logger.warn('No channels selected for notification', { notificationId, userId: request.userId })
        await this.updateNotificationStatus(notificationId, 'failed', 'No channels available')
        return notificationId
      }

      // Route to channels based on priority and scheduling
      if (request.scheduledFor && request.scheduledFor > new Date()) {
        await this.scheduleNotification(notificationId, request, selectedChannels)
      } else {
        await this.routeToChannels(notificationId, request, selectedChannels)
      }

      // Emit orchestration event
      this.emit('notification_orchestrated', {
        notificationId,
        userId: request.userId,
        channels: selectedChannels,
        priority: request.priority
      })

      return notificationId
    } catch (error) {
      logger.error('Error orchestrating notification:', error)
      throw error
    }
  }

  /**
   * Send bulk notifications efficiently
   */
  public async sendBulkNotifications(
    userIds: string[],
    notification: Omit<NotificationRequest, 'userId' | 'id'>,
    options?: {
      batchSize?: number
      delayBetweenBatches?: number
      campaignId?: string
    }
  ): Promise<string[]> {
    const batchSize = options?.batchSize || 100
    const delay = options?.delayBetweenBatches || 1000
    const notificationIds: string[] = []

    // Process in batches to avoid overwhelming the system
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize)
      
      const batchPromises = batch.map(userId => 
        this.sendNotification({
          ...notification,
          userId,
          campaignId: options?.campaignId
        })
      )

      const batchResults = await Promise.allSettled(batchPromises)
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          notificationIds.push(result.value)
        } else {
          logger.error(`Failed to send notification to user ${batch[index]}:`, result.reason)
        }
      })

      // Add delay between batches if not the last batch
      if (i + batchSize < userIds.length && delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    logger.info(`Bulk notification sent to ${notificationIds.length}/${userIds.length} users`)
    return notificationIds
  }

  /**
   * Validate notification request
   */
  private async validateRequest(request: NotificationRequest): Promise<void> {
    if (!request.userId) {
      throw new Error('User ID is required')
    }

    if (!request.title || !request.message) {
      throw new Error('Title and message are required')
    }

    if (!request.type) {
      throw new Error('Notification type is required')
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { uid: request.userId }
    })

    if (!user) {
      throw new Error(`User not found: ${request.userId}`)
    }

    // Validate expiration
    if (request.expiresAt && request.expiresAt <= new Date()) {
      throw new Error('Notification expiration date must be in the future')
    }

    // Validate scheduling
    if (request.scheduledFor && request.scheduledFor <= new Date()) {
      throw new Error('Scheduled date must be in the future')
    }
  }

  /**
   * Persist notification to database
   */
  private async persistNotification(request: NotificationRequest): Promise<any> {
    return await db.notification.create({
      data: {
        id: request.id!,
        userId: request.userId,
        type: request.type,
        channel: request.channels?.join(',') || 'in_app',
        title: request.title,
        message: request.message,
        data: request.data ? JSON.stringify(request.data) : null,
        priority: request.priority || 'normal',
        status: 'pending',
        scheduledFor: request.scheduledFor,
        expiresAt: request.expiresAt,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
  }

  /**
   * Select optimal channels for notification delivery
   */
  private async selectChannels(request: NotificationRequest): Promise<string[]> {
    // Get user preferences
    const preferences = await this.preferencesManager.getUserPreferences(request.userId)
    
    // Start with requested channels or default channels
    let candidateChannels = request.channels || ['in_app', 'email']
    
    // Filter based on user preferences
    const enabledChannels = candidateChannels.filter(channel => {
      return this.preferencesManager.shouldReceiveNotification(
        request.userId,
        request.type,
        channel
      )
    })

    // Apply channel-specific logic based on priority and type
    const selectedChannels = this.applyChannelSelectionLogic(
      enabledChannels,
      request.priority || 'normal',
      request.type
    )

    // Ensure at least one channel is selected if possible
    if (selectedChannels.length === 0 && candidateChannels.includes('in_app')) {
      selectedChannels.push('in_app')
    }

    return selectedChannels
  }

  /**
   * Apply channel selection logic based on priority and type
   */
  private applyChannelSelectionLogic(
    channels: string[],
    priority: string,
    type: string
  ): string[] {
    const selectedChannels = [...channels]

    // High priority notifications should use multiple channels
    if (priority === 'urgent' || priority === 'high') {
      // Ensure email is included for important notifications
      if (!selectedChannels.includes('email') && channels.includes('email')) {
        selectedChannels.push('email')
      }
      
      // Add push notifications for urgent items
      if (priority === 'urgent' && !selectedChannels.includes('push') && channels.includes('push')) {
        selectedChannels.push('push')
      }
    }

    // Type-specific channel selection
    switch (type) {
      case 'password_reset':
      case 'email_verification':
        // Security-related notifications should always use email
        if (!selectedChannels.includes('email')) {
          selectedChannels.push('email')
        }
        break
      
      case 'job_match':
      case 'new_job':
        // Job-related notifications benefit from multiple channels
        if (!selectedChannels.includes('push') && channels.includes('push')) {
          selectedChannels.push('push')
        }
        break
    }

    return selectedChannels
  }

  /**
   * Route notification to selected channels
   */
  private async routeToChannels(
    notificationId: string,
    request: NotificationRequest,
    channels: string[]
  ): Promise<void> {
    const deliveryPromises = channels.map(channel => 
      this.deliverToChannel(notificationId, request, channel)
    )

    const results = await Promise.allSettled(deliveryPromises)
    
    // Process results and handle failures
    let successCount = 0
    let failureCount = 0

    results.forEach((result, index) => {
      const channel = channels[index]
      
      if (result.status === 'fulfilled') {
        successCount++
        logger.debug(`Notification ${notificationId} delivered to ${channel}`)
      } else {
        failureCount++
        logger.error(`Failed to deliver notification ${notificationId} to ${channel}:`, result.reason)
        
        // Handle fallback channels
        this.handleChannelFailure(notificationId, request, channel, result.reason)
      }
    })

    // Update notification status
    const status = successCount > 0 ? 'sent' : 'failed'
    await this.updateNotificationStatus(notificationId, status)

    logger.info(`Notification ${notificationId} routing complete`, {
      successCount,
      failureCount,
      totalChannels: channels.length
    })
  }

  /**
   * Deliver notification to a specific channel
   */
  private async deliverToChannel(
    notificationId: string,
    request: NotificationRequest,
    channel: string
  ): Promise<ChannelDeliveryResult> {
    const channelService = this.channelServices.get(channel)
    
    if (!channelService) {
      throw new Error(`Channel service not found: ${channel}`)
    }

    // Check rate limits
    await this.checkRateLimit(request.userId, channel)

    // Log delivery attempt
    await this.logDeliveryAttempt(notificationId, channel, 'attempting')

    try {
      // Call channel-specific delivery method
      const result = await channelService.deliver(request)
      
      // Log successful delivery
      await this.logDeliveryAttempt(notificationId, channel, 'sent', null, result.messageId)
      
      return {
        channel,
        success: true,
        messageId: result.messageId,
        deliveredAt: new Date(),
        metadata: result.metadata
      }
    } catch (error) {
      // Log failed delivery
      await this.logDeliveryAttempt(notificationId, channel, 'failed', error.message)
      
      throw error
    }
  }

  /**
   * Schedule notification for future delivery
   */
  private async scheduleNotification(
    notificationId: string,
    request: NotificationRequest,
    channels: string[]
  ): Promise<void> {
    const delay = request.scheduledFor!.getTime() - Date.now()
    
    await this.queueManager.queueEvent({
      type: 'scheduled_notification',
      data: {
        notificationId,
        request,
        channels
      },
      priority: request.priority || 'normal',
      delay
    })

    await this.updateNotificationStatus(notificationId, 'scheduled')
    
    logger.info(`Notification ${notificationId} scheduled for ${request.scheduledFor}`)
  }

  /**
   * Handle channel delivery failure with fallback logic
   */
  private async handleChannelFailure(
    notificationId: string,
    request: NotificationRequest,
    failedChannel: string,
    error: any
  ): Promise<void> {
    const channelConfig = this.channelConfigs.get(failedChannel)
    
    if (channelConfig?.fallbackChannels) {
      for (const fallbackChannel of channelConfig.fallbackChannels) {
        if (this.channelServices.has(fallbackChannel)) {
          try {
            await this.deliverToChannel(notificationId, request, fallbackChannel)
            logger.info(`Notification ${notificationId} delivered via fallback channel: ${fallbackChannel}`)
            break
          } catch (fallbackError) {
            logger.error(`Fallback channel ${fallbackChannel} also failed:`, fallbackError)
          }
        }
      }
    }
  }

  /**
   * Check rate limits for user and channel
   */
  private async checkRateLimit(userId: string, channel: string): Promise<void> {
    const channelConfig = this.channelConfigs.get(channel)
    if (!channelConfig?.rateLimits) return

    const rateLimits = channelConfig.rateLimits
    const now = Date.now()
    
    // Check per-minute limit
    if (rateLimits.perMinute) {
      const key = `rate_limit:${userId}:${channel}:minute:${Math.floor(now / 60000)}`
      const count = await redis.get(key)
      
      if (count && parseInt(count) >= rateLimits.perMinute) {
        throw new Error(`Rate limit exceeded for ${channel}: ${rateLimits.perMinute}/minute`)
      }
      
      await redis.set(key, (parseInt(count || '0') + 1).toString(), 'EX', 60)
    }

    // Similar checks for hourly and daily limits...
  }

  /**
   * Log delivery attempt to database
   */
  private async logDeliveryAttempt(
    notificationId: string,
    channel: string,
    status: string,
    error?: string,
    messageId?: string
  ): Promise<void> {
    try {
      await db.notificationDeliveryLog.create({
        data: {
          notificationId,
          channel,
          status,
          errorMessage: error,
          providerMessageId: messageId,
          attemptedAt: new Date(),
          deliveredAt: status === 'sent' ? new Date() : null
        }
      })
    } catch (logError) {
      logger.error('Failed to log delivery attempt:', logError)
    }
  }

  /**
   * Update notification status
   */
  private async updateNotificationStatus(
    notificationId: string,
    status: string,
    failureReason?: string
  ): Promise<void> {
    try {
      await db.notification.update({
        where: { id: notificationId },
        data: {
          status,
          failureReason,
          updatedAt: new Date()
        }
      })
    } catch (error) {
      logger.error('Failed to update notification status:', error)
    }
  }

  /**
   * Setup default channel configurations
   */
  private setupChannelConfigs(): void {
    const configs: ChannelConfig[] = [
      {
        name: 'email',
        enabled: true,
        priority: 1,
        fallbackChannels: ['in_app'],
        rateLimits: {
          perMinute: 10,
          perHour: 100,
          perDay: 500
        },
        retryPolicy: {
          maxAttempts: 3,
          backoffMultiplier: 2,
          initialDelay: 1000
        }
      },
      {
        name: 'sms',
        enabled: true,
        priority: 2,
        fallbackChannels: ['email', 'in_app'],
        rateLimits: {
          perMinute: 5,
          perHour: 50,
          perDay: 200
        },
        retryPolicy: {
          maxAttempts: 2,
          backoffMultiplier: 3,
          initialDelay: 2000
        }
      },
      {
        name: 'push',
        enabled: true,
        priority: 3,
        fallbackChannels: ['in_app'],
        rateLimits: {
          perMinute: 20,
          perHour: 200,
          perDay: 1000
        },
        retryPolicy: {
          maxAttempts: 2,
          backoffMultiplier: 2,
          initialDelay: 500
        }
      },
      {
        name: 'in_app',
        enabled: true,
        priority: 4,
        rateLimits: {
          perMinute: 50,
          perHour: 500,
          perDay: 2000
        },
        retryPolicy: {
          maxAttempts: 1,
          backoffMultiplier: 1,
          initialDelay: 0
        }
      },
      {
        name: 'web',
        enabled: true,
        priority: 5,
        fallbackChannels: ['in_app'],
        rateLimits: {
          perMinute: 30,
          perHour: 300,
          perDay: 1500
        },
        retryPolicy: {
          maxAttempts: 2,
          backoffMultiplier: 2,
          initialDelay: 1000
        }
      }
    ]

    configs.forEach(config => {
      this.channelConfigs.set(config.name, config)
    })
  }

  /**
   * Setup event listeners for queue events
   */
  private setupEventListeners(): void {
    this.queueManager.on('job_completed', async (data) => {
      if (data.job.name === 'scheduled_notification') {
        const { notificationId, request, channels } = data.job.data.event.data
        await this.routeToChannels(notificationId, request, channels)
      }
    })

    this.queueManager.on('job_failed', async (data) => {
      logger.error('Queue job failed:', data.error)
    })
  }

  /**
   * Get orchestrator statistics
   */
  public async getStats(): Promise<Record<string, any>> {
    const queueStats = await this.queueManager.getQueueStats()
    
    return {
      channels: {
        registered: Array.from(this.channelServices.keys()),
        configured: Array.from(this.channelConfigs.keys())
      },
      queues: queueStats,
      isInitialized: this.isInitialized
    }
  }

  /**
   * Shutdown the orchestrator gracefully
   */
  public async shutdown(): Promise<void> {
    logger.info('Shutting down Channel Orchestrator...')
    
    await this.queueManager.shutdown()
    
    this.removeAllListeners()
    this.isInitialized = false
    
    logger.info('Channel Orchestrator shutdown complete')
  }
}

export default ChannelOrchestrator