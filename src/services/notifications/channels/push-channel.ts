import { EventEmitter } from 'events'
import * as admin from 'firebase-admin'
import { db } from '@/lib/db'
import { redis } from '@/lib/redis'
import { logger } from '@/lib/logger'

/**
 * Push notification payload
 */
export interface PushNotificationPayload {
  to: string | string[] // Device tokens or topic names
  title: string
  body: string
  data?: Record<string, string>
  imageUrl?: string
  icon?: string
  badge?: number
  sound?: string
  clickAction?: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  scheduledFor?: Date
  metadata?: Record<string, any>
  tags?: string[]
  templateId?: string
  templateData?: Record<string, any>
  platform?: 'ios' | 'android' | 'web' | 'all'
  collapseKey?: string
  timeToLive?: number
}

/**
 * Push delivery result
 */
export interface PushDeliveryResult {
  success: boolean
  messageId?: string
  error?: string
  deliveredAt: Date
  metadata?: Record<string, any>
  failedTokens?: string[]
  successCount?: number
  failureCount?: number
}

/**
 * Push template data
 */
interface PushTemplate {
  id: string
  name: string
  title: string
  body: string
  data?: Record<string, string>
  variables: string[]
  category: string
  isActive: boolean
  platform: 'ios' | 'android' | 'web' | 'all'
}

/**
 * Push delivery options
 */
interface PushDeliveryOptions {
  retryAttempts?: number
  retryDelay?: number
  dryRun?: boolean
  validateOnly?: boolean
  restrictedPackageName?: string
  mutableContent?: boolean
  contentAvailable?: boolean
}

/**
 * Device token info
 */
interface DeviceToken {
  token: string
  platform: 'ios' | 'android' | 'web'
  userId: string
  isActive: boolean
  lastUsed: Date
  appVersion?: string
  deviceInfo?: Record<string, any>
}

/**
 * FCM message response
 */
interface FCMResponse {
  messageId?: string
  error?: {
    code: string
    message: string
  }
}

/**
 * Push Notification Service
 * 
 * Handles push notifications with Firebase Cloud Messaging (FCM) and 
 * Apple Push Notification Service (APNS) integration for mobile and web push.
 */
export class PushChannelService extends EventEmitter {
  private static instance: PushChannelService
  private fcmApp: admin.app.App | null = null
  private isInitialized = false
  
  // Template cache
  private templateCache = new Map<string, PushTemplate>()
  private templateCacheExpiry = new Map<string, number>()
  
  // Rate limiting
  private rateLimitKey = 'push_rate_limit'
  private defaultRateLimit = 1000 // push notifications per minute
  
  // Delivery tracking
  private deliveryMetrics = {
    sent: 0,
    delivered: 0,
    failed: 0,
    clicked: 0,
    dismissed: 0,
    invalidTokens: 0
  }

  // Token management
  private tokenCleanupInterval: NodeJS.Timeout | null = null

  private constructor() {
    super()
  }

  public static getInstance(): PushChannelService {
    if (!PushChannelService.instance) {
      PushChannelService.instance = new PushChannelService()
    }
    return PushChannelService.instance
  }

  /**
   * Initialize the push channel service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Initialize Firebase Admin SDK
      await this.initializeFirebase()

      // Load templates into cache
      await this.loadTemplates()

      // Setup token cleanup
      this.setupTokenCleanup()

      // Setup webhook handlers for delivery tracking
      this.setupWebhookHandlers()

      this.isInitialized = true
      logger.info('Push Channel Service initialized successfully')
    } catch (error) {
      logger.error('Failed to initialize Push Channel Service:', error)
      throw error
    }
  }

  /**
   * Send push notification
   */
  public async sendNotification(
    payload: PushNotificationPayload,
    options: PushDeliveryOptions = {}
  ): Promise<PushDeliveryResult> {
    if (!this.isInitialized) {
      throw new Error('Push Channel Service must be initialized before sending')
    }

    const startTime = Date.now()

    try {
      // Check rate limits
      await this.checkRateLimit()

      // Prepare push content
      const pushContent = await this.preparePushContent(payload)

      // Get valid device tokens
      const tokens = await this.getValidTokens(payload.to, payload.platform)

      if (tokens.length === 0) {
        throw new Error('No valid device tokens found')
      }

      // Send push notification via FCM
      const result = await this.sendViaFCM(pushContent, tokens, options)

      // Record delivery attempts
      await this.recordDeliveryAttempt(payload, result, 'sent')

      // Clean up invalid tokens
      if (result.failedTokens && result.failedTokens.length > 0) {
        await this.markTokensAsInvalid(result.failedTokens)
      }

      // Update metrics
      this.deliveryMetrics.sent += result.successCount || 0
      this.deliveryMetrics.failed += result.failureCount || 0
      this.deliveryMetrics.invalidTokens += result.failedTokens?.length || 0

      const deliveryResult: PushDeliveryResult = {
        success: (result.successCount || 0) > 0,
        messageId: result.messageId,
        deliveredAt: new Date(),
        successCount: result.successCount,
        failureCount: result.failureCount,
        failedTokens: result.failedTokens,
        metadata: {
          totalTokens: tokens.length,
          deliveryTime: Date.now() - startTime,
          templateId: payload.templateId,
          priority: payload.priority,
          platform: payload.platform
        }
      }

      this.emit('push_sent', { payload, result: deliveryResult })
      
      logger.info(`Push notification sent: ${result.successCount}/${tokens.length} successful`, {
        templateId: payload.templateId,
        deliveryTime: Date.now() - startTime,
        platform: payload.platform
      })

      return deliveryResult

    } catch (error) {
      logger.error('Failed to send push notification:', error)

      // Record failed delivery
      await this.recordDeliveryAttempt(payload, null, 'failed', error.message)

      // Update metrics
      this.deliveryMetrics.failed++

      const deliveryResult: PushDeliveryResult = {
        success: false,
        error: error.message,
        deliveredAt: new Date(),
        metadata: {
          deliveryTime: Date.now() - startTime,
          templateId: payload.templateId,
          priority: payload.priority,
          platform: payload.platform
        }
      }

      this.emit('push_failed', { payload, error, result: deliveryResult })

      // Retry logic if configured
      if (options.retryAttempts && options.retryAttempts > 0) {
        return this.retryDelivery(payload, options, error)
      }

      throw error
    }
  }

  /**
   * Send push notification to topic
   */
  public async sendToTopic(
    topic: string,
    payload: Omit<PushNotificationPayload, 'to'>,
    options: PushDeliveryOptions = {}
  ): Promise<PushDeliveryResult> {
    return this.sendNotification({ ...payload, to: topic }, options)
  }

  /**
   * Send bulk push notifications
   */
  public async sendBulkNotifications(
    payloads: PushNotificationPayload[],
    options: PushDeliveryOptions = {}
  ): Promise<PushDeliveryResult[]> {
    const results: PushDeliveryResult[] = []
    const batchSize = 500 // FCM batch limit
    
    logger.info(`Sending bulk push notifications: ${payloads.length} notifications`)

    for (let i = 0; i < payloads.length; i += batchSize) {
      const batch = payloads.slice(i, i + batchSize)
      
      // Process batch in parallel with concurrency control
      const batchPromises = batch.map(payload => 
        this.sendNotification(payload, options).catch(error => ({
          success: false,
          error: error.message,
          deliveredAt: new Date(),
          metadata: { templateId: payload.templateId }
        } as PushDeliveryResult))
      )

      const batchResults = await Promise.allSettled(batchPromises)
      
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(result.value)
        } else {
          results.push({
            success: false,
            error: result.reason?.message || 'Unknown error',
            deliveredAt: new Date()
          })
        }
      })

      // Rate limiting between batches
      if (i + batchSize < payloads.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    logger.info(`Bulk push sending completed: ${results.filter(r => r.success).length}/${results.length} successful`)
    
    return results
  }

  /**
   * Register device token
   */
  public async registerDeviceToken(
    userId: string,
    token: string,
    platform: 'ios' | 'android' | 'web',
    deviceInfo?: Record<string, any>
  ): Promise<void> {
    try {
      // Validate token format
      if (!this.isValidToken(token, platform)) {
        throw new Error('Invalid device token format')
      }

      // Store or update device token
      await db.deviceToken.upsert({
        where: { token },
        update: {
          userId,
          platform,
          isActive: true,
          lastUsed: new Date(),
          deviceInfo
        },
        create: {
          token,
          userId,
          platform,
          isActive: true,
          lastUsed: new Date(),
          deviceInfo
        }
      })

      logger.info(`Device token registered for user ${userId}`, { platform, token: token.substring(0, 20) + '...' })
    } catch (error) {
      logger.error('Failed to register device token:', error)
      throw error
    }
  }

  /**
   * Unregister device token
   */
  public async unregisterDeviceToken(token: string): Promise<void> {
    try {
      await db.deviceToken.update({
        where: { token },
        data: { isActive: false }
      })

      logger.info(`Device token unregistered: ${token.substring(0, 20)}...`)
    } catch (error) {
      logger.error('Failed to unregister device token:', error)
      throw error
    }
  }

  /**
   * Subscribe to topic
   */
  public async subscribeToTopic(tokens: string[], topic: string): Promise<void> {
    if (!this.fcmApp) {
      throw new Error('Firebase not initialized')
    }

    try {
      await admin.messaging(this.fcmApp).subscribeToTopic(tokens, topic)
      logger.info(`Subscribed ${tokens.length} tokens to topic: ${topic}`)
    } catch (error) {
      logger.error(`Failed to subscribe to topic ${topic}:`, error)
      throw error
    }
  }

  /**
   * Unsubscribe from topic
   */
  public async unsubscribeFromTopic(tokens: string[], topic: string): Promise<void> {
    if (!this.fcmApp) {
      throw new Error('Firebase not initialized')
    }

    try {
      await admin.messaging(this.fcmApp).unsubscribeFromTopic(tokens, topic)
      logger.info(`Unsubscribed ${tokens.length} tokens from topic: ${topic}`)
    } catch (error) {
      logger.error(`Failed to unsubscribe from topic ${topic}:`, error)
      throw error
    }
  }

  /**
   * Create or update push template
   */
  public async createTemplate(template: Omit<PushTemplate, 'id'>): Promise<string> {
    const templateId = `push_template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const newTemplate: PushTemplate = {
      ...template,
      id: templateId
    }

    // Save to database
    await db.notificationTemplate.create({
      data: {
        id: templateId,
        name: template.name,
        type: 'push',
        content: {
          title: template.title,
          body: template.body,
          data: template.data,
          variables: template.variables,
          platform: template.platform
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

    logger.info(`Push template created: ${templateId}`)
    return templateId
  }

  /**
   * Get push template
   */
  public async getTemplate(templateId: string): Promise<PushTemplate | null> {
    // Check cache first
    if (this.templateCache.has(templateId)) {
      const expiry = this.templateCacheExpiry.get(templateId)
      if (expiry && expiry > Date.now()) {
        return this.templateCache.get(templateId)!
      }
    }

    // Load from database
    const dbTemplate = await db.notificationTemplate.findUnique({
      where: { id: templateId, type: 'push' }
    })

    if (!dbTemplate) return null

    const template: PushTemplate = {
      id: dbTemplate.id,
      name: dbTemplate.name,
      title: (dbTemplate.content as any).title,
      body: (dbTemplate.content as any).body,
      data: (dbTemplate.content as any).data,
      variables: (dbTemplate.content as any).variables || [],
      category: (dbTemplate.metadata as any)?.category || 'general',
      isActive: (dbTemplate.metadata as any)?.isActive ?? true,
      platform: (dbTemplate.content as any).platform || 'all'
    }

    // Update cache
    this.templateCache.set(templateId, template)
    this.templateCacheExpiry.set(templateId, Date.now() + 3600000)

    return template
  }

  /**
   * Initialize Firebase Admin SDK
   */
  private async initializeFirebase(): Promise<void> {
    try {
      const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      const projectId = process.env.FIREBASE_PROJECT_ID

      if (!serviceAccountKey || !projectId) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY and FIREBASE_PROJECT_ID environment variables are required')
      }

      const serviceAccount = JSON.parse(serviceAccountKey)

      // Initialize Firebase Admin if not already initialized
      if (admin.apps.length === 0) {
        this.fcmApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: projectId
        })
      } else {
        this.fcmApp = admin.apps[0]
      }

      logger.info('Firebase Admin SDK initialized successfully')
    } catch (error) {
      throw new Error(`Firebase initialization failed: ${error.message}`)
    }
  }

  /**
   * Prepare push content from template or direct content
   */
  private async preparePushContent(payload: PushNotificationPayload): Promise<{
    title: string
    body: string
    data?: Record<string, string>
    imageUrl?: string
    icon?: string
    badge?: number
    sound?: string
    clickAction?: string
  }> {
    let content = {
      title: payload.title,
      body: payload.body,
      data: payload.data,
      imageUrl: payload.imageUrl,
      icon: payload.icon,
      badge: payload.badge,
      sound: payload.sound,
      clickAction: payload.clickAction
    }

    if (payload.templateId) {
      const template = await this.getTemplate(payload.templateId)
      if (!template) {
        throw new Error(`Push template not found: ${payload.templateId}`)
      }

      if (!template.isActive) {
        throw new Error(`Push template is inactive: ${payload.templateId}`)
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
  private renderTemplate(template: PushTemplate, data: Record<string, any>): {
    title: string
    body: string
    data?: Record<string, string>
  } {
    let title = template.title
    let body = template.body
    let templateData = { ...template.data }

    // Replace variables
    Object.entries(data).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`
      const stringValue = String(value)
      
      title = title.replace(new RegExp(placeholder, 'g'), stringValue)
      body = body.replace(new RegExp(placeholder, 'g'), stringValue)
      
      // Replace in data object
      if (templateData) {
        Object.keys(templateData).forEach(dataKey => {
          templateData[dataKey] = templateData[dataKey].replace(new RegExp(placeholder, 'g'), stringValue)
        })
      }
    })

    return { title, body, data: templateData }
  }

  /**
   * Get valid device tokens
   */
  private async getValidTokens(
    to: string | string[],
    platform?: 'ios' | 'android' | 'web' | 'all'
  ): Promise<string[]> {
    // If 'to' is a topic name (starts with '/topics/')
    if (typeof to === 'string' && to.startsWith('/topics/')) {
      return [to] // Return topic name as is
    }

    // If 'to' is already device tokens
    if (Array.isArray(to)) {
      return to.filter(token => this.isValidToken(token, platform))
    }

    if (typeof to === 'string' && this.isValidToken(to, platform)) {
      return [to]
    }

    // If 'to' is user IDs, get their device tokens
    const userIds = Array.isArray(to) ? to : [to]
    
    const whereClause: any = {
      userId: { in: userIds },
      isActive: true
    }

    if (platform && platform !== 'all') {
      whereClause.platform = platform
    }

    const deviceTokens = await db.deviceToken.findMany({
      where: whereClause,
      select: { token: true }
    })

    return deviceTokens.map(dt => dt.token)
  }

  /**
   * Validate device token format
   */
  private isValidToken(token: string, platform?: 'ios' | 'android' | 'web' | 'all'): boolean {
    if (!token || typeof token !== 'string') return false

    // Topic names are valid
    if (token.startsWith('/topics/')) return true

    // Basic token validation
    if (token.length < 50) return false

    // Platform-specific validation could be added here
    return true
  }

  /**
   * Send push notification via FCM
   */
  private async sendViaFCM(
    content: any,
    tokens: string[],
    options: PushDeliveryOptions
  ): Promise<{
    messageId?: string
    successCount: number
    failureCount: number
    failedTokens: string[]
  }> {
    if (!this.fcmApp) {
      throw new Error('Firebase not initialized')
    }

    const messaging = admin.messaging(this.fcmApp)
    
    // Handle single topic
    if (tokens.length === 1 && tokens[0].startsWith('/topics/')) {
      const message: admin.messaging.Message = {
        topic: tokens[0].replace('/topics/', ''),
        notification: {
          title: content.title,
          body: content.body,
          imageUrl: content.imageUrl
        },
        data: content.data,
        android: {
          priority: this.mapPriorityToAndroid(content.priority),
          notification: {
            icon: content.icon,
            sound: content.sound,
            clickAction: content.clickAction,
            imageUrl: content.imageUrl
          }
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: content.title,
                body: content.body
              },
              badge: content.badge,
              sound: content.sound || 'default',
              'content-available': options.contentAvailable ? 1 : 0,
              'mutable-content': options.mutableContent ? 1 : 0
            }
          }
        },
        webpush: {
          notification: {
            title: content.title,
            body: content.body,
            icon: content.icon,
            image: content.imageUrl
          }
        }
      }

      const response = await messaging.send(message, options.dryRun)
      
      return {
        messageId: response,
        successCount: 1,
        failureCount: 0,
        failedTokens: []
      }
    }

    // Handle multiple tokens
    const messages: admin.messaging.MulticastMessage = {
      tokens,
      notification: {
        title: content.title,
        body: content.body,
        imageUrl: content.imageUrl
      },
      data: content.data,
      android: {
        priority: this.mapPriorityToAndroid(content.priority),
        notification: {
          icon: content.icon,
          sound: content.sound,
          clickAction: content.clickAction,
          imageUrl: content.imageUrl
        }
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: content.title,
              body: content.body
            },
            badge: content.badge,
            sound: content.sound || 'default',
            'content-available': options.contentAvailable ? 1 : 0,
            'mutable-content': options.mutableContent ? 1 : 0
          }
        }
      },
      webpush: {
        notification: {
          title: content.title,
          body: content.body,
          icon: content.icon,
          image: content.imageUrl
        }
      }
    }

    const response = await messaging.sendMulticast(messages, options.dryRun)
    
    // Collect failed tokens
    const failedTokens: string[] = []
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        failedTokens.push(tokens[idx])
      }
    })

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      failedTokens
    }
  }

  /**
   * Map priority to Android priority
   */
  private mapPriorityToAndroid(priority: string): 'normal' | 'high' {
    return ['high', 'urgent'].includes(priority) ? 'high' : 'normal'
  }

  /**
   * Mark tokens as invalid
   */
  private async markTokensAsInvalid(tokens: string[]): Promise<void> {
    try {
      await db.deviceToken.updateMany({
        where: { token: { in: tokens } },
        data: { isActive: false }
      })

      logger.info(`Marked ${tokens.length} tokens as invalid`)
    } catch (error) {
      logger.error('Failed to mark tokens as invalid:', error)
    }
  }

  /**
   * Check rate limits
   */
  private async checkRateLimit(): Promise<void> {
    const key = `${this.rateLimitKey}:${Math.floor(Date.now() / 60000)}`
    const current = await redis.incr(key)
    
    if (current === 1) {
      await redis.expire(key, 60) // Expire after 1 minute
    }

    if (current > this.defaultRateLimit) {
      throw new Error('Push notification rate limit exceeded')
    }
  }

  /**
   * Record delivery attempt
   */
  private async recordDeliveryAttempt(
    payload: PushNotificationPayload,
    result: any | null,
    status: 'sent' | 'failed',
    error?: string
  ): Promise<void> {
    try {
      await db.notificationDeliveryLog.create({
        data: {
          notificationId: `push_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          channel: 'push',
          status: status === 'sent' ? 'delivered' : 'failed',
          providerMessageId: result?.messageId,
          errorMessage: error,
          attemptedAt: new Date(),
          deliveredAt: status === 'sent' ? new Date() : null,
          metadata: {
            title: payload.title,
            body: payload.body.substring(0, 100),
            templateId: payload.templateId,
            priority: payload.priority,
            platform: payload.platform,
            tags: payload.tags,
            successCount: result?.successCount,
            failureCount: result?.failureCount
          }
        }
      })
    } catch (logError) {
      logger.error('Failed to record push delivery attempt:', logError)
    }
  }

  /**
   * Retry delivery with exponential backoff
   */
  private async retryDelivery(
    payload: PushNotificationPayload,
    options: PushDeliveryOptions,
    originalError: any
  ): Promise<PushDeliveryResult> {
    const retryOptions = {
      ...options,
      retryAttempts: (options.retryAttempts || 1) - 1
    }

    const delay = options.retryDelay || 5000
    
    logger.info(`Retrying push delivery in ${delay}ms`, {
      templateId: payload.templateId,
      attemptsLeft: retryOptions.retryAttempts
    })

    await new Promise(resolve => setTimeout(resolve, delay))
    
    return this.sendNotification(payload, retryOptions)
  }

  /**
   * Load templates from database into cache
   */
  private async loadTemplates(): Promise<void> {
    try {
      const templates = await db.notificationTemplate.findMany({
        where: { type: 'push' }
      })

      templates.forEach(dbTemplate => {
        const template: PushTemplate = {
          id: dbTemplate.id,
          name: dbTemplate.name,
          title: (dbTemplate.content as any).title,
          body: (dbTemplate.content as any).body,
          data: (dbTemplate.content as any).data,
          variables: (dbTemplate.content as any).variables || [],
          category: (dbTemplate.metadata as any)?.category || 'general',
          isActive: (dbTemplate.metadata as any)?.isActive ?? true,
          platform: (dbTemplate.content as any).platform || 'all'
        }

        this.templateCache.set(template.id, template)
        this.templateCacheExpiry.set(template.id, Date.now() + 3600000)
      })

      logger.info(`Loaded ${templates.length} push templates into cache`)
    } catch (error) {
      logger.error('Failed to load push templates:', error)
    }
  }

  /**
   * Setup token cleanup
   */
  private setupTokenCleanup(): void {
    // Clean up inactive tokens every 24 hours
    this.tokenCleanupInterval = setInterval(async () => {
      try {
        const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
        
        const result = await db.deviceToken.deleteMany({
          where: {
            OR: [
              { isActive: false },
              { lastUsed: { lt: cutoffDate } }
            ]
          }
        })

        logger.info(`Cleaned up ${result.count} inactive device tokens`)
      } catch (error) {
        logger.error('Failed to cleanup device tokens:', error)
      }
    }, 24 * 60 * 60 * 1000) // 24 hours
  }

  /**
   * Setup webhook handlers for delivery tracking
   */
  private setupWebhookHandlers(): void {
    this.on('webhook_delivery', this.handleDeliveryWebhook.bind(this))
    this.on('webhook_click', this.handleClickWebhook.bind(this))
    this.on('webhook_dismiss', this.handleDismissWebhook.bind(this))
  }

  /**
   * Handle delivery webhook
   */
  private async handleDeliveryWebhook(data: any): Promise<void> {
    try {
      this.deliveryMetrics.delivered++
      this.emit('push_delivered', data)
    } catch (error) {
      logger.error('Failed to handle delivery webhook:', error)
    }
  }

  /**
   * Handle click webhook
   */
  private async handleClickWebhook(data: any): Promise<void> {
    try {
      this.deliveryMetrics.clicked++
      this.emit('push_clicked', data)
    } catch (error) {
      logger.error('Failed to handle click webhook:', error)
    }
  }

  /**
   * Handle dismiss webhook
   */
  private async handleDismissWebhook(data: any): Promise<void> {
    try {
      this.deliveryMetrics.dismissed++
      this.emit('push_dismissed', data)
    } catch (error) {
      logger.error('Failed to handle dismiss webhook:', error)
    }
  }

  /**
   * Get delivery metrics
   */
  public getMetrics(): typeof this.deliveryMetrics {
    return { ...this.deliveryMetrics }
  }

  /**
   * Get service status
   */
  public getStatus(): Record<string, any> {
    return {
      isInitialized: this.isInitialized,
      templatesLoaded: this.templateCache.size,
      metrics: this.deliveryMetrics,
      rateLimit: this.defaultRateLimit,
      firebaseConfigured: !!this.fcmApp
    }
  }

  /**
   * Shutdown the service
   */
  public async shutdown(): Promise<void> {
    if (this.tokenCleanupInterval) {
      clearInterval(this.tokenCleanupInterval)
    }
    
    this.templateCache.clear()
    this.templateCacheExpiry.clear()
    this.removeAllListeners()
    this.isInitialized = false
    
    logger.info('Push Channel Service shutdown complete')
  }
}

export default PushChannelService