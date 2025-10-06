import { EventEmitter } from 'events'
import { Server as SocketIOServer, Socket } from 'socket.io'
import { db } from '@/lib/db'
import { redis } from '@/lib/redis'
import { logger } from '@/lib/logger'

/**
 * In-app notification payload
 */
export interface InAppNotificationPayload {
  userId: string | string[]
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error' | 'system' | 'job_alert' | 'message' | 'reminder'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  category?: string
  actionUrl?: string
  actionText?: string
  imageUrl?: string
  icon?: string
  data?: Record<string, any>
  expiresAt?: Date
  scheduledFor?: Date
  metadata?: Record<string, any>
  tags?: string[]
  templateId?: string
  templateData?: Record<string, any>
  persistent?: boolean // Whether to store in database for offline users
  realtime?: boolean // Whether to send via WebSocket immediately
}

/**
 * In-app delivery result
 */
export interface InAppDeliveryResult {
  success: boolean
  notificationId?: string
  deliveredAt: Date
  onlineUsers: number
  offlineUsers: number
  totalUsers: number
  error?: string
  metadata?: Record<string, any>
}

/**
 * In-app notification template
 */
interface InAppTemplate {
  id: string
  name: string
  title: string
  message: string
  type: string
  variables: string[]
  category: string
  isActive: boolean
  styling?: {
    backgroundColor?: string
    textColor?: string
    borderColor?: string
    icon?: string
  }
}

/**
 * User connection info
 */
interface UserConnection {
  userId: string
  socketId: string
  connectedAt: Date
  lastActivity: Date
  userAgent?: string
  ipAddress?: string
  metadata?: Record<string, any>
}

/**
 * Notification display options
 */
interface NotificationDisplayOptions {
  autoHide?: boolean
  hideAfter?: number // milliseconds
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center'
  showProgress?: boolean
  allowDismiss?: boolean
  sound?: boolean
  vibrate?: boolean
}

/**
 * In-App Notification Service
 * 
 * Handles real-time in-app notifications with WebSocket delivery,
 * offline storage, and comprehensive user engagement tracking.
 */
export class InAppChannelService extends EventEmitter {
  private static instance: InAppChannelService
  private io: SocketIOServer | null = null
  private isInitialized = false
  
  // User connections tracking
  private userConnections = new Map<string, UserConnection[]>()
  private socketToUser = new Map<string, string>()
  
  // Template cache
  private templateCache = new Map<string, InAppTemplate>()
  private templateCacheExpiry = new Map<string, number>()
  
  // Rate limiting
  private rateLimitKey = 'inapp_rate_limit'
  private defaultRateLimit = 500 // notifications per minute per user
  
  // Delivery tracking
  private deliveryMetrics = {
    sent: 0,
    delivered: 0,
    read: 0,
    clicked: 0,
    dismissed: 0,
    expired: 0
  }

  // Cleanup intervals
  private cleanupInterval: NodeJS.Timeout | null = null
  private metricsInterval: NodeJS.Timeout | null = null

  private constructor() {
    super()
  }

  public static getInstance(): InAppChannelService {
    if (!InAppChannelService.instance) {
      InAppChannelService.instance = new InAppChannelService()
    }
    return InAppChannelService.instance
  }

  /**
   * Initialize the in-app channel service
   */
  public async initialize(socketServer?: SocketIOServer): Promise<void> {
    if (this.isInitialized) return

    try {
      // Setup WebSocket server
      if (socketServer) {
        this.io = socketServer
        this.setupSocketHandlers()
      }

      // Load templates into cache
      await this.loadTemplates()

      // Setup cleanup tasks
      this.setupCleanupTasks()

      // Setup metrics collection
      this.setupMetricsCollection()

      this.isInitialized = true
      logger.info('In-App Channel Service initialized successfully')
    } catch (error) {
      logger.error('Failed to initialize In-App Channel Service:', error)
      throw error
    }
  }

  /**
   * Send in-app notification
   */
  public async sendNotification(
    payload: InAppNotificationPayload,
    displayOptions: NotificationDisplayOptions = {}
  ): Promise<InAppDeliveryResult> {
    if (!this.isInitialized) {
      throw new Error('In-App Channel Service must be initialized before sending')
    }

    const startTime = Date.now()
    const notificationId = `inapp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    try {
      // Prepare notification content
      const notificationContent = await this.prepareNotificationContent(payload)

      // Get target users
      const userIds = Array.isArray(payload.userId) ? payload.userId : [payload.userId]

      // Check rate limits for each user
      await this.checkRateLimits(userIds)

      // Determine online and offline users
      const { onlineUsers, offlineUsers } = this.categorizeUsers(userIds)

      let deliveredCount = 0
      let totalUsers = userIds.length

      // Send to online users via WebSocket (if realtime enabled)
      if (payload.realtime !== false && this.io) {
        deliveredCount += await this.sendRealtimeNotifications(
          onlineUsers,
          notificationContent,
          displayOptions,
          notificationId
        )
      }

      // Store persistent notifications for offline users or if persistent flag is set
      if (payload.persistent !== false || offlineUsers.length > 0) {
        await this.storePersistentNotifications(
          userIds,
          notificationContent,
          notificationId,
          payload
        )
      }

      // Record delivery attempt
      await this.recordDeliveryAttempt(payload, notificationId, 'delivered')

      // Update metrics
      this.deliveryMetrics.sent += totalUsers
      this.deliveryMetrics.delivered += deliveredCount

      const deliveryResult: InAppDeliveryResult = {
        success: true,
        notificationId,
        deliveredAt: new Date(),
        onlineUsers: onlineUsers.length,
        offlineUsers: offlineUsers.length,
        totalUsers,
        metadata: {
          deliveryTime: Date.now() - startTime,
          templateId: payload.templateId,
          priority: payload.priority,
          type: payload.type,
          realtime: payload.realtime !== false,
          persistent: payload.persistent !== false
        }
      }

      this.emit('notification_sent', { payload, result: deliveryResult })
      
      logger.info(`In-app notification sent: ${deliveredCount}/${totalUsers} delivered immediately`, {
        notificationId,
        deliveryTime: Date.now() - startTime,
        type: payload.type
      })

      return deliveryResult

    } catch (error) {
      logger.error('Failed to send in-app notification:', error)

      // Record failed delivery
      await this.recordDeliveryAttempt(payload, notificationId, 'failed', error.message)

      // Update metrics
      this.deliveryMetrics.sent++

      const deliveryResult: InAppDeliveryResult = {
        success: false,
        error: error.message,
        deliveredAt: new Date(),
        onlineUsers: 0,
        offlineUsers: 0,
        totalUsers: Array.isArray(payload.userId) ? payload.userId.length : 1,
        metadata: {
          deliveryTime: Date.now() - startTime,
          templateId: payload.templateId,
          priority: payload.priority,
          type: payload.type
        }
      }

      this.emit('notification_failed', { payload, error, result: deliveryResult })
      throw error
    }
  }

  /**
   * Send bulk in-app notifications
   */
  public async sendBulkNotifications(
    payloads: InAppNotificationPayload[],
    displayOptions: NotificationDisplayOptions = {}
  ): Promise<InAppDeliveryResult[]> {
    const results: InAppDeliveryResult[] = []
    const batchSize = 100 // Process in batches
    
    logger.info(`Sending bulk in-app notifications: ${payloads.length} notifications`)

    for (let i = 0; i < payloads.length; i += batchSize) {
      const batch = payloads.slice(i, i + batchSize)
      
      // Process batch in parallel with concurrency control
      const batchPromises = batch.map(payload => 
        this.sendNotification(payload, displayOptions).catch(error => ({
          success: false,
          error: error.message,
          deliveredAt: new Date(),
          onlineUsers: 0,
          offlineUsers: 0,
          totalUsers: Array.isArray(payload.userId) ? payload.userId.length : 1,
          metadata: { templateId: payload.templateId, type: payload.type }
        } as InAppDeliveryResult))
      )

      const batchResults = await Promise.allSettled(batchPromises)
      
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(result.value)
        } else {
          results.push({
            success: false,
            error: result.reason?.message || 'Unknown error',
            deliveredAt: new Date(),
            onlineUsers: 0,
            offlineUsers: 0,
            totalUsers: 0
          })
        }
      })

      // Rate limiting between batches
      if (i + batchSize < payloads.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    logger.info(`Bulk in-app sending completed: ${results.filter(r => r.success).length}/${results.length} successful`)
    
    return results
  }

  /**
   * Get user's unread notifications
   */
  public async getUserNotifications(
    userId: string,
    options: {
      limit?: number
      offset?: number
      type?: string
      category?: string
      unreadOnly?: boolean
    } = {}
  ): Promise<{
    notifications: any[]
    total: number
    unreadCount: number
  }> {
    const {
      limit = 50,
      offset = 0,
      type,
      category,
      unreadOnly = false
    } = options

    const whereClause: any = {
      userId,
      expiresAt: {
        OR: [
          { gt: new Date() },
          { equals: null }
        ]
      }
    }

    if (type) whereClause.type = type
    if (category) whereClause.category = category
    if (unreadOnly) whereClause.readAt = null

    const [notifications, total, unreadCount] = await Promise.all([
      db.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          title: true,
          message: true,
          type: true,
          category: true,
          priority: true,
          actionUrl: true,
          actionText: true,
          imageUrl: true,
          icon: true,
          data: true,
          readAt: true,
          createdAt: true,
          expiresAt: true
        }
      }),
      db.notification.count({ where: whereClause }),
      db.notification.count({
        where: {
          userId,
          readAt: null,
          expiresAt: {
            OR: [
              { gt: new Date() },
              { equals: null }
            ]
          }
        }
      })
    ])

    return { notifications, total, unreadCount }
  }

  /**
   * Mark notification as read
   */
  public async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      await db.notification.updateMany({
        where: {
          id: notificationId,
          userId,
          readAt: null
        },
        data: {
          readAt: new Date()
        }
      })

      // Update metrics
      this.deliveryMetrics.read++

      // Emit read event via WebSocket
      if (this.io) {
        const userSockets = this.userConnections.get(userId) || []
        userSockets.forEach(conn => {
          this.io!.to(conn.socketId).emit('notification_read', { notificationId })
        })
      }

      this.emit('notification_read', { notificationId, userId })
      
      logger.debug(`Notification marked as read: ${notificationId}`)
    } catch (error) {
      logger.error('Failed to mark notification as read:', error)
      throw error
    }
  }

  /**
   * Mark all notifications as read for user
   */
  public async markAllAsRead(userId: string): Promise<number> {
    try {
      const result = await db.notification.updateMany({
        where: {
          userId,
          readAt: null,
          expiresAt: {
            OR: [
              { gt: new Date() },
              { equals: null }
            ]
          }
        },
        data: {
          readAt: new Date()
        }
      })

      // Update metrics
      this.deliveryMetrics.read += result.count

      // Emit read event via WebSocket
      if (this.io) {
        const userSockets = this.userConnections.get(userId) || []
        userSockets.forEach(conn => {
          this.io!.to(conn.socketId).emit('notifications_all_read')
        })
      }

      this.emit('notifications_all_read', { userId, count: result.count })
      
      logger.info(`Marked ${result.count} notifications as read for user ${userId}`)
      return result.count
    } catch (error) {
      logger.error('Failed to mark all notifications as read:', error)
      throw error
    }
  }

  /**
   * Dismiss notification
   */
  public async dismissNotification(notificationId: string, userId: string): Promise<void> {
    try {
      await db.notification.updateMany({
        where: {
          id: notificationId,
          userId
        },
        data: {
          dismissedAt: new Date()
        }
      })

      // Update metrics
      this.deliveryMetrics.dismissed++

      // Emit dismiss event via WebSocket
      if (this.io) {
        const userSockets = this.userConnections.get(userId) || []
        userSockets.forEach(conn => {
          this.io!.to(conn.socketId).emit('notification_dismissed', { notificationId })
        })
      }

      this.emit('notification_dismissed', { notificationId, userId })
      
      logger.debug(`Notification dismissed: ${notificationId}`)
    } catch (error) {
      logger.error('Failed to dismiss notification:', error)
      throw error
    }
  }

  /**
   * Track notification click
   */
  public async trackClick(notificationId: string, userId: string): Promise<void> {
    try {
      await db.notification.updateMany({
        where: {
          id: notificationId,
          userId
        },
        data: {
          clickedAt: new Date()
        }
      })

      // Update metrics
      this.deliveryMetrics.clicked++

      this.emit('notification_clicked', { notificationId, userId })
      
      logger.debug(`Notification clicked: ${notificationId}`)
    } catch (error) {
      logger.error('Failed to track notification click:', error)
    }
  }

  /**
   * Create or update in-app template
   */
  public async createTemplate(template: Omit<InAppTemplate, 'id'>): Promise<string> {
    const templateId = `inapp_template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const newTemplate: InAppTemplate = {
      ...template,
      id: templateId
    }

    // Save to database
    await db.notificationTemplate.create({
      data: {
        id: templateId,
        name: template.name,
        type: 'in_app',
        content: {
          title: template.title,
          message: template.message,
          type: template.type,
          variables: template.variables,
          styling: template.styling
        },
        metadata: {
          category: template.category,
          isActive: template.isActive
        }
      }
    })

    // Update cache
    this.templateCache.set(templateId, newTemplate)
    this.templateCacheExpiry.set(templateId, Date.now() + 3600000) // 1 hour

    logger.info(`In-app template created: ${templateId}`)
    return templateId
  }

  /**
   * Get in-app template
   */
  public async getTemplate(templateId: string): Promise<InAppTemplate | null> {
    // Check cache first
    if (this.templateCache.has(templateId)) {
      const expiry = this.templateCacheExpiry.get(templateId)
      if (expiry && expiry > Date.now()) {
        return this.templateCache.get(templateId)!
      }
    }

    // Load from database
    const dbTemplate = await db.notificationTemplate.findUnique({
      where: { id: templateId, type: 'in_app' }
    })

    if (!dbTemplate) return null

    const template: InAppTemplate = {
      id: dbTemplate.id,
      name: dbTemplate.name,
      title: (dbTemplate.content as any).title,
      message: (dbTemplate.content as any).message,
      type: (dbTemplate.content as any).type,
      variables: (dbTemplate.content as any).variables || [],
      category: (dbTemplate.metadata as any)?.category || 'general',
      isActive: (dbTemplate.metadata as any)?.isActive ?? true,
      styling: (dbTemplate.content as any).styling
    }

    // Update cache
    this.templateCache.set(templateId, template)
    this.templateCacheExpiry.set(templateId, Date.now() + 3600000)

    return template
  }

  /**
   * Get online users count
   */
  public getOnlineUsersCount(): number {
    return this.userConnections.size
  }

  /**
   * Get user connection status
   */
  public isUserOnline(userId: string): boolean {
    return this.userConnections.has(userId)
  }

  /**
   * Get user's active connections
   */
  public getUserConnections(userId: string): UserConnection[] {
    return this.userConnections.get(userId) || []
  }

  /**
   * Setup WebSocket handlers
   */
  private setupSocketHandlers(): void {
    if (!this.io) return

    this.io.on('connection', (socket: Socket) => {
      logger.debug(`Socket connected: ${socket.id}`)

      // Handle user authentication
      socket.on('authenticate', async (data: { userId: string, token?: string }) => {
        try {
          // Validate user token if provided
          if (data.token) {
            // Add token validation logic here
          }

          const userId = data.userId
          const connection: UserConnection = {
            userId,
            socketId: socket.id,
            connectedAt: new Date(),
            lastActivity: new Date(),
            userAgent: socket.handshake.headers['user-agent'],
            ipAddress: socket.handshake.address
          }

          // Add to user connections
          if (!this.userConnections.has(userId)) {
            this.userConnections.set(userId, [])
          }
          this.userConnections.get(userId)!.push(connection)
          this.socketToUser.set(socket.id, userId)

          // Join user-specific room
          socket.join(`user:${userId}`)

          // Send pending notifications
          await this.sendPendingNotifications(userId, socket)

          socket.emit('authenticated', { success: true })
          
          logger.info(`User authenticated: ${userId} (${socket.id})`)
        } catch (error) {
          logger.error('Authentication failed:', error)
          socket.emit('authentication_error', { error: error.message })
        }
      })

      // Handle activity tracking
      socket.on('activity', () => {
        const userId = this.socketToUser.get(socket.id)
        if (userId) {
          const connections = this.userConnections.get(userId) || []
          const connection = connections.find(c => c.socketId === socket.id)
          if (connection) {
            connection.lastActivity = new Date()
          }
        }
      })

      // Handle notification interactions
      socket.on('notification_read', async (data: { notificationId: string }) => {
        const userId = this.socketToUser.get(socket.id)
        if (userId) {
          await this.markAsRead(data.notificationId, userId)
        }
      })

      socket.on('notification_clicked', async (data: { notificationId: string }) => {
        const userId = this.socketToUser.get(socket.id)
        if (userId) {
          await this.trackClick(data.notificationId, userId)
        }
      })

      socket.on('notification_dismissed', async (data: { notificationId: string }) => {
        const userId = this.socketToUser.get(socket.id)
        if (userId) {
          await this.dismissNotification(data.notificationId, userId)
        }
      })

      // Handle disconnection
      socket.on('disconnect', () => {
        const userId = this.socketToUser.get(socket.id)
        if (userId) {
          const connections = this.userConnections.get(userId) || []
          const updatedConnections = connections.filter(c => c.socketId !== socket.id)
          
          if (updatedConnections.length === 0) {
            this.userConnections.delete(userId)
          } else {
            this.userConnections.set(userId, updatedConnections)
          }
          
          this.socketToUser.delete(socket.id)
          
          logger.debug(`User disconnected: ${userId} (${socket.id})`)
        }
      })
    })
  }

  /**
   * Prepare notification content from template or direct content
   */
  private async prepareNotificationContent(payload: InAppNotificationPayload): Promise<{
    title: string
    message: string
    type: string
    category?: string
    actionUrl?: string
    actionText?: string
    imageUrl?: string
    icon?: string
    data?: Record<string, any>
    styling?: any
  }> {
    let content = {
      title: payload.title,
      message: payload.message,
      type: payload.type,
      category: payload.category,
      actionUrl: payload.actionUrl,
      actionText: payload.actionText,
      imageUrl: payload.imageUrl,
      icon: payload.icon,
      data: payload.data,
      styling: undefined as any
    }

    if (payload.templateId) {
      const template = await this.getTemplate(payload.templateId)
      if (!template) {
        throw new Error(`In-app template not found: ${payload.templateId}`)
      }

      if (!template.isActive) {
        throw new Error(`In-app template is inactive: ${payload.templateId}`)
      }

      // Render template with data
      const rendered = this.renderTemplate(template, payload.templateData || {})
      content = { ...content, ...rendered }
    }

    return content
  }

  /**
   * Render template with data
   */
  private renderTemplate(template: InAppTemplate, data: Record<string, any>): {
    title: string
    message: string
    type: string
    styling?: any
  } {
    let title = template.title
    let message = template.message

    // Replace variables
    Object.entries(data).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`
      const stringValue = String(value)
      
      title = title.replace(new RegExp(placeholder, 'g'), stringValue)
      message = message.replace(new RegExp(placeholder, 'g'), stringValue)
    })

    return {
      title,
      message,
      type: template.type,
      styling: template.styling
    }
  }

  /**
   * Categorize users into online and offline
   */
  private categorizeUsers(userIds: string[]): {
    onlineUsers: string[]
    offlineUsers: string[]
  } {
    const onlineUsers: string[] = []
    const offlineUsers: string[] = []

    userIds.forEach(userId => {
      if (this.userConnections.has(userId)) {
        onlineUsers.push(userId)
      } else {
        offlineUsers.push(userId)
      }
    })

    return { onlineUsers, offlineUsers }
  }

  /**
   * Send realtime notifications via WebSocket
   */
  private async sendRealtimeNotifications(
    userIds: string[],
    content: any,
    displayOptions: NotificationDisplayOptions,
    notificationId: string
  ): Promise<number> {
    if (!this.io) return 0

    let deliveredCount = 0

    for (const userId of userIds) {
      const connections = this.userConnections.get(userId) || []
      
      if (connections.length > 0) {
        const notificationData = {
          id: notificationId,
          ...content,
          displayOptions,
          timestamp: new Date().toISOString()
        }

        // Send to all user's connections
        connections.forEach(conn => {
          this.io!.to(conn.socketId).emit('notification', notificationData)
        })

        deliveredCount++
      }
    }

    return deliveredCount
  }

  /**
   * Store persistent notifications in database
   */
  private async storePersistentNotifications(
    userIds: string[],
    content: any,
    notificationId: string,
    payload: InAppNotificationPayload
  ): Promise<void> {
    const notifications = userIds.map(userId => ({
      id: `${notificationId}_${userId}`,
      userId,
      title: content.title,
      message: content.message,
      type: content.type,
      category: content.category,
      priority: payload.priority,
      actionUrl: content.actionUrl,
      actionText: content.actionText,
      imageUrl: content.imageUrl,
      icon: content.icon,
      data: content.data,
      expiresAt: payload.expiresAt,
      scheduledFor: payload.scheduledFor,
      metadata: {
        ...payload.metadata,
        templateId: payload.templateId,
        tags: payload.tags,
        styling: content.styling
      }
    }))

    await db.notification.createMany({
      data: notifications,
      skipDuplicates: true
    })
  }

  /**
   * Send pending notifications to newly connected user
   */
  private async sendPendingNotifications(userId: string, socket: Socket): Promise<void> {
    try {
      const pendingNotifications = await db.notification.findMany({
        where: {
          userId,
          readAt: null,
          dismissedAt: null,
          scheduledFor: {
            OR: [
              { lte: new Date() },
              { equals: null }
            ]
          },
          expiresAt: {
            OR: [
              { gt: new Date() },
              { equals: null }
            ]
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 50 // Limit to recent notifications
      })

      if (pendingNotifications.length > 0) {
        socket.emit('pending_notifications', pendingNotifications)
        logger.debug(`Sent ${pendingNotifications.length} pending notifications to user ${userId}`)
      }
    } catch (error) {
      logger.error('Failed to send pending notifications:', error)
    }
  }

  /**
   * Check rate limits for users
   */
  private async checkRateLimits(userIds: string[]): Promise<void> {
    const minute = Math.floor(Date.now() / 60000)
    
    for (const userId of userIds) {
      const key = `${this.rateLimitKey}:${userId}:${minute}`
      const current = await redis.incr(key)
      
      if (current === 1) {
        await redis.expire(key, 60) // Expire after 1 minute
      }

      if (current > this.defaultRateLimit) {
        throw new Error(`In-app notification rate limit exceeded for user ${userId}`)
      }
    }
  }

  /**
   * Record delivery attempt
   */
  private async recordDeliveryAttempt(
    payload: InAppNotificationPayload,
    notificationId: string,
    status: 'delivered' | 'failed',
    error?: string
  ): Promise<void> {
    try {
      await db.notificationDeliveryLog.create({
        data: {
          notificationId,
          channel: 'in_app',
          status: status === 'delivered' ? 'delivered' : 'failed',
          errorMessage: error,
          attemptedAt: new Date(),
          deliveredAt: status === 'delivered' ? new Date() : null,
          metadata: {
            title: payload.title,
            message: payload.message.substring(0, 100),
            type: payload.type,
            templateId: payload.templateId,
            priority: payload.priority,
            tags: payload.tags,
            userCount: Array.isArray(payload.userId) ? payload.userId.length : 1
          }
        }
      })
    } catch (logError) {
      logger.error('Failed to record in-app delivery attempt:', logError)
    }
  }

  /**
   * Load templates from database into cache
   */
  private async loadTemplates(): Promise<void> {
    try {
      const templates = await db.notificationTemplate.findMany({
        where: { type: 'in_app' }
      })

      templates.forEach(dbTemplate => {
        const template: InAppTemplate = {
          id: dbTemplate.id,
          name: dbTemplate.name,
          title: (dbTemplate.content as any).title,
          message: (dbTemplate.content as any).message,
          type: (dbTemplate.content as any).type,
          variables: (dbTemplate.content as any).variables || [],
          category: (dbTemplate.metadata as any)?.category || 'general',
          isActive: (dbTemplate.metadata as any)?.isActive ?? true,
          styling: (dbTemplate.content as any).styling
        }

        this.templateCache.set(template.id, template)
        this.templateCacheExpiry.set(template.id, Date.now() + 3600000)
      })

      logger.info(`Loaded ${templates.length} in-app templates into cache`)
    } catch (error) {
      logger.error('Failed to load in-app templates:', error)
    }
  }

  /**
   * Setup cleanup tasks
   */
  private setupCleanupTasks(): void {
    // Clean up expired notifications every hour
    this.cleanupInterval = setInterval(async () => {
      try {
        const result = await db.notification.deleteMany({
          where: {
            expiresAt: { lt: new Date() }
          }
        })

        this.deliveryMetrics.expired += result.count
        
        if (result.count > 0) {
          logger.info(`Cleaned up ${result.count} expired notifications`)
        }
      } catch (error) {
        logger.error('Failed to cleanup expired notifications:', error)
      }
    }, 60 * 60 * 1000) // 1 hour
  }

  /**
   * Setup metrics collection
   */
  private setupMetricsCollection(): void {
    // Collect metrics every 5 minutes
    this.metricsInterval = setInterval(async () => {
      try {
        // Store metrics in Redis for analytics
        const metrics = {
          ...this.deliveryMetrics,
          onlineUsers: this.userConnections.size,
          timestamp: new Date().toISOString()
        }

        await redis.lpush('inapp_metrics', JSON.stringify(metrics))
        await redis.ltrim('inapp_metrics', 0, 287) // Keep 24 hours of 5-minute intervals

        logger.debug('In-app metrics collected', metrics)
      } catch (error) {
        logger.error('Failed to collect metrics:', error)
      }
    }, 5 * 60 * 1000) // 5 minutes
  }

  /**
   * Get delivery metrics
   */
  public getMetrics(): typeof this.deliveryMetrics & { onlineUsers: number } {
    return {
      ...this.deliveryMetrics,
      onlineUsers: this.userConnections.size
    }
  }

  /**
   * Get service status
   */
  public getStatus(): Record<string, any> {
    return {
      isInitialized: this.isInitialized,
      templatesLoaded: this.templateCache.size,
      onlineUsers: this.userConnections.size,
      totalConnections: Array.from(this.userConnections.values()).reduce((sum, conns) => sum + conns.length, 0),
      metrics: this.deliveryMetrics,
      rateLimit: this.defaultRateLimit,
      websocketConfigured: !!this.io
    }
  }

  /**
   * Shutdown the service
   */
  public async shutdown(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval)
    }
    
    this.userConnections.clear()
    this.socketToUser.clear()
    this.templateCache.clear()
    this.templateCacheExpiry.clear()
    this.removeAllListeners()
    this.isInitialized = false
    
    logger.info('In-App Channel Service shutdown complete')
  }
}

export default InAppChannelService