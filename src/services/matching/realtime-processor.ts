import { EventEmitter } from 'events'
import { WebSocketServer, WebSocket } from 'ws'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { MatchingCoreService } from '@/services/matching/matching-core'
import { RecommendationEngine } from '@/services/matching/recommendation-engine'
import { EmbeddingService } from '@/services/matching/embedding-service'

export interface RealtimeEvent {
  id: string
  type: 'profile_update' | 'job_posted' | 'application_submitted' | 'match_created' | 'feedback_received'
  userId: string
  data: any
  timestamp: Date
  priority: 'low' | 'medium' | 'high' | 'critical'
  metadata?: Record<string, any>
}

export interface RealtimeNotification {
  id: string
  userId: string
  type: 'new_match' | 'application_update' | 'profile_view' | 'recommendation_update'
  title: string
  message: string
  data: any
  read: boolean
  createdAt: Date
  expiresAt?: Date
  metadata?: Record<string, any>
}

export interface RealtimeProcessingOptions {
  enableWebSocket: boolean
  batchSize: number
  processingInterval: number
  maxRetries: number
  enablePersistence: boolean
  priorityQueues: boolean
}

export class RealtimeProcessor extends EventEmitter {
  private wsServer: WebSocketServer | null = null
  private clientConnections: Map<string, WebSocket[]> = new Map()
  private eventQueue: RealtimeEvent[] = []
  private processingQueue: RealtimeEvent[] = []
  private priorityQueues: Map<string, RealtimeEvent[]> = new Map()
  private isProcessing: boolean = false
  private options: RealtimeProcessingOptions
  private matchingCore: MatchingCoreService
  private recommendationEngine: RecommendationEngine
  private embeddingService: EmbeddingService

  constructor(options: Partial<RealtimeProcessingOptions> = {}) {
    super()

    this.options = {
      enableWebSocket: true,
      batchSize: 100,
      processingInterval: 1000, // 1 second
      maxRetries: 3,
      enablePersistence: true,
      priorityQueues: true,
      ...options
    }

    this.matchingCore = new MatchingCoreService()
    this.recommendationEngine = new RecommendationEngine()
    this.embeddingService = new EmbeddingService()

    this.setupPriorityQueues()
    this.startProcessing()

    if (this.options.enableWebSocket) {
      this.setupWebSocketServer()
    }
  }

  /**
   * Initialize priority queues
   */
  private setupPriorityQueues(): void {
    if (this.options.priorityQueues) {
      this.priorityQueues.set('critical', [])
      this.priorityQueues.set('high', [])
      this.priorityQueues.set('medium', [])
      this.priorityQueues.set('low', [])
    }
  }

  /**
   * Setup WebSocket server for real-time communication
   */
  private setupWebSocketServer(): void {
    try {
      this.wsServer = new WebSocketServer({
        port: parseInt(process.env.REALTIME_WS_PORT || '8080'),
        path: '/realtime'
      })

      this.wsServer.on('connection', (ws: WebSocket, req) => {
        this.handleNewConnection(ws, req)
      })

      this.wsServer.on('error', (error) => {
        logger.error('WebSocket server error', { error })
      })

      logger.info('Real-time WebSocket server started', {
        port: process.env.REALTIME_WS_PORT || 8080
      })
    } catch (error) {
      logger.error('Failed to start WebSocket server', { error })
    }
  }

  /**
   * Handle new WebSocket connection
   */
  private handleNewConnection(ws: WebSocket, req: any): void {
    const userId = this.extractUserIdFromRequest(req)

    if (!userId) {
      ws.close(1008, 'Authentication required')
      return
    }

    // Add connection to user's connection pool
    if (!this.clientConnections.has(userId)) {
      this.clientConnections.set(userId, [])
    }
    this.clientConnections.get(userId)!.push(ws)

    // Setup connection handlers
    ws.on('message', (data) => {
      this.handleClientMessage(userId, data)
    })

    ws.on('close', () => {
      this.handleConnectionClose(userId, ws)
    })

    ws.on('error', (error) => {
      logger.error('WebSocket connection error', { userId, error })
      this.handleConnectionClose(userId, ws)
    })

    // Send initial connection confirmation
    this.sendToClient(userId, {
      type: 'connection_established',
      timestamp: new Date(),
      userId
    })

    logger.info('New WebSocket connection established', { userId })
  }

  /**
   * Extract user ID from request
   */
  private extractUserIdFromRequest(req: any): string | null {
    // Extract from query parameters, headers, or auth token
    const url = new URL(req.url || '', `http://${req.headers.host}`)
    return url.searchParams.get('userId') ||
           req.headers['x-user-id'] as string ||
           null
  }

  /**
   * Handle client messages
   */
  private handleClientMessage(userId: string, data: Buffer): void {
    try {
      const message = JSON.parse(data.toString())

      switch (message.type) {
        case 'subscribe':
          this.handleSubscription(userId, message.channels || [])
          break
        case 'unsubscribe':
          this.handleUnsubscription(userId, message.channels || [])
          break
        case 'ping':
          this.sendToClient(userId, { type: 'pong', timestamp: new Date() })
          break
        default:
          logger.warn('Unknown message type from client', { userId, type: message.type })
      }
    } catch (error) {
      logger.error('Error processing client message', { userId, error })
    }
  }

  /**
   * Handle connection close
   */
  private handleConnectionClose(userId: string, ws: WebSocket): void {
    const connections = this.clientConnections.get(userId)
    if (connections) {
      const index = connections.indexOf(ws)
      if (index > -1) {
        connections.splice(index, 1)
      }

      if (connections.length === 0) {
        this.clientConnections.delete(userId)
      }
    }

    logger.info('WebSocket connection closed', { userId })
  }

  /**
   * Handle subscription requests
   */
  private handleSubscription(userId: string, channels: string[]): void {
    // Store user subscriptions for targeted notifications
    logger.info('User subscribed to channels', { userId, channels })
  }

  /**
   * Handle unsubscription requests
   */
  private handleUnsubscription(userId: string, channels: string[]): void {
    // Remove user subscriptions
    logger.info('User unsubscribed from channels', { userId, channels })
  }

  /**
   * Start event processing loop
   */
  private startProcessing(): void {
    setInterval(async () => {
      if (!this.isProcessing) {
        await this.processEvents()
      }
    }, this.options.processingInterval)

    logger.info('Real-time processing started', {
      interval: this.options.processingInterval,
      batchSize: this.options.batchSize
    })
  }

  /**
   * Process events from queues
   */
  private async processEvents(): Promise<void> {
    if (this.isProcessing) return

    this.isProcessing = true

    try {
      // Process priority queues first
      if (this.options.priorityQueues) {
        await this.processPriorityQueues()
      }

      // Process regular queue
      if (this.eventQueue.length > 0) {
        const batch = this.eventQueue.splice(0, this.options.batchSize)
        await this.processEventBatch(batch)
      }

      // Process persistent events from database
      if (this.options.enablePersistence) {
        await this.processPersistentEvents()
      }
    } catch (error) {
      logger.error('Error processing events', { error })
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Process priority queues
   */
  private async processPriorityQueues(): Promise<void> {
    const priorities = ['critical', 'high', 'medium', 'low']

    for (const priority of priorities) {
      const queue = this.priorityQueues.get(priority)
      if (queue && queue.length > 0) {
        const batch = queue.splice(0, Math.min(this.options.batchSize, queue.length))
        await this.processEventBatch(batch)
      }
    }
  }

  /**
   * Process a batch of events
   */
  private async processEventBatch(events: RealtimeEvent[]): Promise<void> {
    logger.debug('Processing event batch', { count: events.length })

    for (const event of events) {
      try {
        await this.processSingleEvent(event)
        this.emit('event_processed', event)
      } catch (error) {
        logger.error('Error processing event', { eventId: event.id, error })
        await this.handleEventError(event, error)
      }
    }
  }

  /**
   * Process a single event
   */
  private async processSingleEvent(event: RealtimeEvent): Promise<void> {
    switch (event.type) {
      case 'profile_update':
        await this.handleProfileUpdate(event)
        break
      case 'job_posted':
        await this.handleJobPosted(event)
        break
      case 'application_submitted':
        await this.handleApplicationSubmitted(event)
        break
      case 'match_created':
        await this.handleMatchCreated(event)
        break
      case 'feedback_received':
        await this.handleFeedbackReceived(event)
        break
      default:
        logger.warn('Unknown event type', { type: event.type, eventId: event.id })
    }
  }

  /**
   * Handle profile update events
   */
  private async handleProfileUpdate(event: RealtimeEvent): Promise<void> {
    const { userId, data } = event

    logger.info('Processing profile update', { userId, eventId: event.id })

    // Update embeddings for the user
    await this.embeddingService.updateUserEmbedding(userId)

    // Find new matches based on updated profile
    if (data.role === 'seeker') {
      const matches = await this.matchingCore.findMatches({
        candidateId: userId,
        limit: 10,
        filters: {}
      })

      // Send real-time notifications about new matches
      for (const match of matches) {
        await this.sendNotification(userId, {
          type: 'new_match',
          title: 'New Job Match',
          message: `Found a matching position: ${match.job.title}`,
          data: match,
          metadata: { eventId: event.id }
        })
      }
    }

    // Update recommendations
    await this.updateRecommendations(userId, data.role)
  }

  /**
   * Handle job posted events
   */
  private async handleJobPosted(event: RealtimeEvent): Promise<void> {
    const { data } = event
    const { jobId, employerId } = data

    logger.info('Processing new job posting', { jobId, employerId, eventId: event.id })

    // Update embeddings for the job
    await this.embeddingService.updateJobEmbedding(jobId)

    // Find matching candidates for the new job
    const matches = await this.matchingCore.findMatches({
      jobId,
      limit: 50,
      filters: {}
    })

    // Send notifications to matching candidates
    for (const match of matches) {
      await this.sendNotification(match.candidateId, {
        type: 'new_match',
        title: 'New Job Opportunity',
        message: `New position matching your profile: ${data.jobTitle}`,
        data: match,
        metadata: { eventId: event.id, jobId }
      })
    }

    // Update employer recommendations
    await this.updateRecommendations(employerId, 'employer')
  }

  /**
   * Handle application submitted events
   */
  private async handleApplicationSubmitted(event: RealtimeEvent): Promise<void> {
    const { data } = event
    const { candidateId, employerId, jobId } = data

    logger.info('Processing application submission', {
      candidateId,
      employerId,
      jobId,
      eventId: event.id
    })

    // Send notification to employer
    await this.sendNotification(employerId, {
      type: 'application_update',
      title: 'New Application Received',
      message: `New application for your position`,
      data: { candidateId, jobId },
      metadata: { eventId: event.id }
    })

    // Update matching algorithms based on application
    await this.updateMatchingData(candidateId, jobId)
  }

  /**
   * Handle match created events
   */
  private async handleMatchCreated(event: RealtimeEvent): Promise<void> {
    const { data } = event
    const { candidateId, employerId, matchScore } = data

    logger.info('Processing new match', {
      candidateId,
      employerId,
      matchScore,
      eventId: event.id
    })

    // Send notifications to both parties
    await Promise.all([
      this.sendNotification(candidateId, {
        type: 'new_match',
        title: 'New Match Found',
        message: `You've been matched with a great opportunity!`,
        data: { matchScore, employerId },
        metadata: { eventId: event.id }
      }),
      this.sendNotification(employerId, {
        type: 'new_match',
        title: 'New Candidate Match',
        message: `Found a qualified candidate for your position!`,
        data: { matchScore, candidateId },
        metadata: { eventId: event.id }
      })
    ])
  }

  /**
   * Handle feedback received events
   */
  private async handleFeedbackReceived(event: RealtimeEvent): Promise<void> {
    const { data } = event
    const { userId, itemId, itemType, feedback } = data

    logger.info('Processing user feedback', {
      userId,
      itemId,
      itemType,
      feedback,
      eventId: event.id
    })

    // Update recommendation algorithms
    await this.recommendationEngine.recordFeedback({
      userId,
      itemId,
      itemType,
      action: feedback.action,
      rating: feedback.rating,
      timestamp: event.timestamp
    })

    // Update matching weights based on feedback
    await this.updateMatchingWeights(userId, feedback)
  }

  /**
   * Handle event processing errors
   */
  private async handleEventError(event: RealtimeEvent, error: any): Promise<void> {
    const retryCount = event.metadata?.retryCount || 0

    if (retryCount < this.options.maxRetries) {
      // Retry the event with incremented retry count
      const retryEvent = {
        ...event,
        metadata: {
          ...event.metadata,
          retryCount: retryCount + 1,
          lastError: error.message
        }
      }

      // Add back to appropriate queue
      if (this.options.priorityQueues) {
        const queue = this.priorityQueues.get(event.priority)
        if (queue) {
          queue.unshift(retryEvent)
        }
      } else {
        this.eventQueue.unshift(retryEvent)
      }

      logger.info('Event queued for retry', {
        eventId: event.id,
        retryCount: retryCount + 1
      })
    } else {
      // Max retries exceeded, log error and optionally store in dead letter queue
      logger.error('Event processing failed after max retries', {
        eventId: event.id,
        error
      })

      await this.storeFailedEvent(event, error)
    }
  }

  /**
   * Store failed events for later analysis
   */
  private async storeFailedEvent(event: RealtimeEvent, error: any): Promise<void> {
    try {
      await prisma.failedEvent.create({
        data: {
          eventId: event.id,
          eventType: event.type,
          userId: event.userId,
          eventData: event.data,
          error: error.message,
          stackTrace: error.stack,
          createdAt: new Date()
        }
      })
    } catch (storeError) {
      logger.error('Failed to store failed event', {
        eventId: event.id,
        storeError
      })
    }
  }

  /**
   * Process persistent events from database
   */
  private async processPersistentEvents(): Promise<void> {
    try {
      // Get unprocessed events from database
      const persistentEvents = await prisma.eventQueue.findMany({
        where: { processed: false },
        orderBy: { createdAt: 'asc' },
        take: this.options.batchSize
      })

      if (persistentEvents.length > 0) {
        const events: RealtimeEvent[] = persistentEvents.map(pe => ({
          id: pe.id,
          type: pe.eventType as any,
          userId: pe.userId,
          data: pe.eventData as any,
          timestamp: pe.createdAt,
          priority: pe.priority as any,
          metadata: { persistent: true }
        }))

        await this.processEventBatch(events)

        // Mark events as processed
        await prisma.eventQueue.updateMany({
          where: { id: { in: events.map(e => e.id) } },
          data: { processed: true, processedAt: new Date() }
        })
      }
    } catch (error) {
      logger.error('Error processing persistent events', { error })
    }
  }

  /**
   * Queue an event for processing
   */
  public queueEvent(event: Omit<RealtimeEvent, 'id' | 'timestamp'>): string {
    const fullEvent: RealtimeEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: new Date()
    }

    if (this.options.priorityQueues) {
      const queue = this.priorityQueues.get(event.priority)
      if (queue) {
        queue.push(fullEvent)
      } else {
        this.eventQueue.push(fullEvent)
      }
    } else {
      this.eventQueue.push(fullEvent)
    }

    // Store persistent event if enabled
    if (this.options.enablePersistence) {
      this.storePersistentEvent(fullEvent).catch(error => {
        logger.error('Failed to store persistent event', {
          eventId: fullEvent.id,
          error
        })
      })
    }

    this.emit('event_queued', fullEvent)
    return fullEvent.id
  }

  /**
   * Store event in database for persistence
   */
  private async storePersistentEvent(event: RealtimeEvent): Promise<void> {
    await prisma.eventQueue.create({
      data: {
        id: event.id,
        eventType: event.type,
        userId: event.userId,
        eventData: event.data,
        priority: event.priority,
        processed: false,
        createdAt: event.timestamp
      }
    })
  }

  /**
   * Send notification to user
   */
  public async sendNotification(
    userId: string,
    notification: Omit<RealtimeNotification, 'id' | 'userId' | 'createdAt' | 'read'>
  ): Promise<string> {
    const fullNotification: RealtimeNotification = {
      ...notification,
      id: this.generateEventId(),
      userId,
      read: false,
      createdAt: new Date()
    }

    // Store notification in database
    try {
      await prisma.notification.create({
        data: {
          id: fullNotification.id,
          userId: fullNotification.userId,
          type: fullNotification.type,
          title: fullNotification.title,
          message: fullNotification.message,
          data: fullNotification.data,
          read: fullNotification.read,
          createdAt: fullNotification.createdAt,
          expiresAt: fullNotification.expiresAt,
          metadata: fullNotification.metadata || {}
        }
      })
    } catch (error) {
      logger.error('Failed to store notification', {
        notificationId: fullNotification.id,
        error
      })
    }

    // Send real-time notification via WebSocket
    this.sendToClient(userId, {
      type: 'notification',
      notification: fullNotification
    })

    this.emit('notification_sent', fullNotification)
    return fullNotification.id
  }

  /**
   * Send message to specific client
   */
  private sendToClient(userId: string, message: any): void {
    const connections = this.clientConnections.get(userId)
    if (connections && connections.length > 0) {
      const messageStr = JSON.stringify(message)

      connections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          try {
            ws.send(messageStr)
          } catch (error) {
            logger.error('Failed to send message to client', { userId, error })
          }
        }
      })
    }
  }

  /**
   * Update recommendations for user
   */
  private async updateRecommendations(userId: string, userRole: string): Promise<void> {
    try {
      if (userRole === 'seeker') {
        await this.recommendationEngine.getJobRecommendations({
          userId,
          limit: 10,
          strategy: 'balanced',
          filters: {}
        })
      } else if (userRole === 'employer') {
        // Update employer recommendations
        await this.recommendationEngine.getCandidateRecommendations({
          employerId: userId,
          filters: {}
        })
      }
    } catch (error) {
      logger.error('Failed to update recommendations', { userId, userRole, error })
    }
  }

  /**
   * Update matching data based on interactions
   */
  private async updateMatchingData(candidateId: string, jobId: string): Promise<void> {
    try {
      // Update interaction data for learning algorithms
      await prisma.interaction.create({
        data: {
          userId: candidateId,
          itemType: 'job',
          itemId: jobId,
          interactionType: 'application',
          timestamp: new Date()
        }
      })
    } catch (error) {
      logger.error('Failed to update matching data', { candidateId, jobId, error })
    }
  }

  /**
   * Update matching weights based on feedback
   */
  private async updateMatchingWeights(userId: string, feedback: any): Promise<void> {
    try {
      // Store feedback for ML model updates
      await prisma.feedback.create({
        data: {
          userId,
          itemType: feedback.itemType,
          itemId: feedback.itemId,
          feedbackType: feedback.action,
          rating: feedback.rating,
          metadata: feedback,
          timestamp: new Date()
        }
      })
    } catch (error) {
      logger.error('Failed to update matching weights', { userId, feedback, error })
    }
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get system statistics
   */
  public getStats(): {
    queueSizes: Record<string, number>
    activeConnections: number
    isProcessing: boolean
  } {
    const queueSizes: Record<string, number> = {
      regular: this.eventQueue.length
    }

    if (this.options.priorityQueues) {
      this.priorityQueues.forEach((queue, priority) => {
        queueSizes[priority] = queue.length
      })
    }

    return {
      queueSizes,
      activeConnections: this.clientConnections.size,
      isProcessing: this.isProcessing
    }
  }

  /**
   * Graceful shutdown
   */
  public async shutdown(): Promise<void> {
    logger.info('Shutting down real-time processor')

    // Close WebSocket server
    if (this.wsServer) {
      this.wsServer.close()
    }

    // Close all client connections
    this.clientConnections.forEach((connections, userId) => {
      connections.forEach(ws => {
        ws.close(1001, 'Server shutting down')
      })
    })
    this.clientConnections.clear()

    // Wait for current processing to complete
    while (this.isProcessing) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    logger.info('Real-time processor shutdown complete')
  }
}