import { EventEmitter } from 'events'
import { Twilio } from 'twilio'
import { db } from '@/lib/db'
import { redis } from '@/lib/redis'
import { logger } from '@/lib/logger'

/**
 * SMS notification payload
 */
export interface SMSNotificationPayload {
  to: string | string[]
  message: string
  templateId?: string
  templateData?: Record<string, any>
  priority: 'low' | 'normal' | 'high' | 'urgent'
  scheduledFor?: Date
  metadata?: Record<string, any>
  tags?: string[]
  mediaUrls?: string[]
  shortenUrls?: boolean
}

/**
 * SMS delivery result
 */
export interface SMSDeliveryResult {
  success: boolean
  messageId?: string
  error?: string
  deliveredAt: Date
  metadata?: Record<string, any>
}

/**
 * SMS template data
 */
interface SMSTemplate {
  id: string
  name: string
  content: string
  variables: string[]
  category: string
  isActive: boolean
  maxLength: number
}

/**
 * SMS delivery options
 */
interface SMSDeliveryOptions {
  retryAttempts?: number
  retryDelay?: number
  validatePhoneNumber?: boolean
  suppressionList?: string[]
  customSenderId?: string
  deliveryReceiptUrl?: string
}

/**
 * Phone number validation result
 */
interface PhoneValidationResult {
  isValid: boolean
  formattedNumber?: string
  country?: string
  carrier?: string
  type?: 'mobile' | 'landline' | 'voip'
  error?: string
}

/**
 * SMS delivery status from Twilio
 */
type SMSStatus = 'queued' | 'sent' | 'delivered' | 'failed' | 'undelivered'

/**
 * SMS Channel Service
 * 
 * Handles SMS notifications with Twilio integration, global delivery support,
 * phone number validation, template management, and delivery tracking.
 */
export class SMSChannelService extends EventEmitter {
  private static instance: SMSChannelService
  private twilioClient: Twilio
  private isInitialized = false
  
  // Configuration
  private twilioAccountSid: string
  private twilioAuthToken: string
  private twilioPhoneNumber: string
  private twilioMessagingServiceSid?: string
  
  // Template cache
  private templateCache = new Map<string, SMSTemplate>()
  private templateCacheExpiry = new Map<string, number>()
  
  // Rate limiting
  private rateLimitKey = 'sms_rate_limit'
  private defaultRateLimit = 100 // SMS per minute
  
  // Delivery tracking
  private deliveryMetrics = {
    sent: 0,
    delivered: 0,
    failed: 0,
    queued: 0,
    undelivered: 0
  }

  // Country-specific configurations
  private countryConfigs = new Map<string, {
    maxLength: number
    allowsAlphanumericSender: boolean
    requiresOptIn: boolean
    timeRestrictions?: { start: number; end: number }
  }>()

  private constructor() {
    super()
    this.twilioAccountSid = process.env.TWILIO_ACCOUNT_SID || ''
    this.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN || ''
    this.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || ''
    this.twilioMessagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID
    
    if (this.twilioAccountSid && this.twilioAuthToken) {
      this.twilioClient = new Twilio(this.twilioAccountSid, this.twilioAuthToken)
    }
    
    this.setupCountryConfigs()
  }

  public static getInstance(): SMSChannelService {
    if (!SMSChannelService.instance) {
      SMSChannelService.instance = new SMSChannelService()
    }
    return SMSChannelService.instance
  }

  /**
   * Initialize the SMS channel service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Verify Twilio credentials
      if (!this.twilioAccountSid || !this.twilioAuthToken) {
        throw new Error('TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables are required')
      }

      if (!this.twilioPhoneNumber && !this.twilioMessagingServiceSid) {
        throw new Error('Either TWILIO_PHONE_NUMBER or TWILIO_MESSAGING_SERVICE_SID must be provided')
      }

      // Test Twilio connection
      await this.testTwilioConnection()

      // Load templates into cache
      await this.loadTemplates()

      // Setup webhook handlers for delivery tracking
      this.setupWebhookHandlers()

      this.isInitialized = true
      logger.info('SMS Channel Service initialized successfully')
    } catch (error) {
      logger.error('Failed to initialize SMS Channel Service:', error)
      throw error
    }
  }

  /**
   * Send SMS notification
   */
  public async sendNotification(
    payload: SMSNotificationPayload,
    options: SMSDeliveryOptions = {}
  ): Promise<SMSDeliveryResult> {
    if (!this.isInitialized) {
      throw new Error('SMS Channel Service must be initialized before sending')
    }

    const startTime = Date.now()

    try {
      // Check rate limits
      await this.checkRateLimit()

      // Prepare SMS content
      const smsContent = await this.prepareSMSContent(payload)

      // Validate and format phone numbers
      const recipients = await this.validateAndFormatPhoneNumbers(
        Array.isArray(payload.to) ? payload.to : [payload.to],
        options
      )

      if (recipients.length === 0) {
        throw new Error('No valid phone numbers found')
      }

      // Check suppression list and opt-in status
      const validRecipients = await this.filterValidRecipients(recipients, options.suppressionList)

      if (validRecipients.length === 0) {
        throw new Error('All recipients are suppressed or have not opted in')
      }

      // Send SMS via Twilio
      const results = await this.sendViaTwilio(smsContent, validRecipients, options)

      // Record delivery attempts
      await Promise.all(results.map(result => 
        this.recordDeliveryAttempt(payload, result, 'sent')
      ))

      // Update metrics
      this.deliveryMetrics.sent += results.length

      const deliveryResult: SMSDeliveryResult = {
        success: true,
        messageId: results.map(r => r.sid).join(','),
        deliveredAt: new Date(),
        metadata: {
          recipients: validRecipients.length,
          deliveryTime: Date.now() - startTime,
          templateId: payload.templateId,
          priority: payload.priority,
          messageLength: smsContent.message.length
        }
      }

      this.emit('sms_sent', { payload, result: deliveryResult })
      
      logger.info(`SMS sent successfully to ${validRecipients.length} recipients`, {
        templateId: payload.templateId,
        deliveryTime: Date.now() - startTime,
        messageLength: smsContent.message.length
      })

      return deliveryResult

    } catch (error) {
      logger.error('Failed to send SMS notification:', error)

      // Record failed delivery
      await this.recordDeliveryAttempt(payload, null, 'failed', error.message)

      // Update metrics
      this.deliveryMetrics.failed++

      const deliveryResult: SMSDeliveryResult = {
        success: false,
        error: error.message,
        deliveredAt: new Date(),
        metadata: {
          deliveryTime: Date.now() - startTime,
          templateId: payload.templateId,
          priority: payload.priority
        }
      }

      this.emit('sms_failed', { payload, error, result: deliveryResult })

      // Retry logic if configured
      if (options.retryAttempts && options.retryAttempts > 0) {
        return this.retryDelivery(payload, options, error)
      }

      throw error
    }
  }

  /**
   * Send bulk SMS notifications
   */
  public async sendBulkNotifications(
    payloads: SMSNotificationPayload[],
    options: SMSDeliveryOptions = {}
  ): Promise<SMSDeliveryResult[]> {
    const results: SMSDeliveryResult[] = []
    const batchSize = 20 // Conservative batch size for SMS
    
    logger.info(`Sending bulk SMS: ${payloads.length} notifications`)

    for (let i = 0; i < payloads.length; i += batchSize) {
      const batch = payloads.slice(i, i + batchSize)
      
      // Process batch in parallel with concurrency control
      const batchPromises = batch.map(payload => 
        this.sendNotification(payload, options).catch(error => ({
          success: false,
          error: error.message,
          deliveredAt: new Date(),
          metadata: { templateId: payload.templateId }
        } as SMSDeliveryResult))
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
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    logger.info(`Bulk SMS sending completed: ${results.filter(r => r.success).length}/${results.length} successful`)
    
    return results
  }

  /**
   * Validate phone number
   */
  public async validatePhoneNumber(phoneNumber: string): Promise<PhoneValidationResult> {
    try {
      const lookup = await this.twilioClient.lookups.v1.phoneNumbers(phoneNumber).fetch({
        type: ['carrier']
      })

      return {
        isValid: true,
        formattedNumber: lookup.phoneNumber,
        country: lookup.countryCode,
        carrier: lookup.carrier?.name,
        type: lookup.carrier?.type as 'mobile' | 'landline' | 'voip'
      }
    } catch (error) {
      return {
        isValid: false,
        error: error.message
      }
    }
  }

  /**
   * Create or update SMS template
   */
  public async createTemplate(template: Omit<SMSTemplate, 'id'>): Promise<string> {
    const templateId = `sms_template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const newTemplate: SMSTemplate = {
      ...template,
      id: templateId
    }

    // Save to database
    await db.notificationTemplate.create({
      data: {
        id: templateId,
        name: template.name,
        type: 'sms',
        content: {
          message: template.content,
          variables: template.variables,
          maxLength: template.maxLength
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

    logger.info(`SMS template created: ${templateId}`)
    return templateId
  }

  /**
   * Get SMS template
   */
  public async getTemplate(templateId: string): Promise<SMSTemplate | null> {
    // Check cache first
    if (this.templateCache.has(templateId)) {
      const expiry = this.templateCacheExpiry.get(templateId)
      if (expiry && expiry > Date.now()) {
        return this.templateCache.get(templateId)!
      }
    }

    // Load from database
    const dbTemplate = await db.notificationTemplate.findUnique({
      where: { id: templateId, type: 'sms' }
    })

    if (!dbTemplate) return null

    const template: SMSTemplate = {
      id: dbTemplate.id,
      name: dbTemplate.name,
      content: (dbTemplate.content as any).message,
      variables: (dbTemplate.content as any).variables || [],
      category: (dbTemplate.metadata as any)?.category || 'general',
      isActive: (dbTemplate.metadata as any)?.isActive ?? true,
      maxLength: (dbTemplate.content as any).maxLength || 160
    }

    // Update cache
    this.templateCache.set(templateId, template)
    this.templateCacheExpiry.set(templateId, Date.now() + 3600000)

    return template
  }

  /**
   * Test Twilio connection
   */
  private async testTwilioConnection(): Promise<void> {
    try {
      await this.twilioClient.api.accounts(this.twilioAccountSid).fetch()
      logger.info('Twilio connection test successful')
    } catch (error) {
      throw new Error(`Twilio connection failed: ${error.message}`)
    }
  }

  /**
   * Prepare SMS content from template or direct content
   */
  private async prepareSMSContent(payload: SMSNotificationPayload): Promise<{
    message: string
    mediaUrls?: string[]
  }> {
    let message = payload.message

    if (payload.templateId) {
      const template = await this.getTemplate(payload.templateId)
      if (!template) {
        throw new Error(`SMS template not found: ${payload.templateId}`)
      }

      if (!template.isActive) {
        throw new Error(`SMS template is inactive: ${payload.templateId}`)
      }

      // Render template with data
      message = this.renderTemplate(template, payload.templateData || {})
    }

    // Validate message length
    if (message.length > 1600) { // Twilio's max length
      throw new Error(`SMS message too long: ${message.length} characters (max 1600)`)
    }

    // Shorten URLs if requested
    if (payload.shortenUrls) {
      message = await this.shortenUrls(message)
    }

    return {
      message,
      mediaUrls: payload.mediaUrls
    }
  }

  /**
   * Render template with data
   */
  private renderTemplate(template: SMSTemplate, data: Record<string, any>): string {
    let message = template.content

    // Replace variables
    Object.entries(data).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`
      const stringValue = String(value)
      message = message.replace(new RegExp(placeholder, 'g'), stringValue)
    })

    return message
  }

  /**
   * Validate and format phone numbers
   */
  private async validateAndFormatPhoneNumbers(
    phoneNumbers: string[],
    options: SMSDeliveryOptions
  ): Promise<string[]> {
    const validNumbers: string[] = []

    for (const phoneNumber of phoneNumbers) {
      if (options.validatePhoneNumber !== false) {
        const validation = await this.validatePhoneNumber(phoneNumber)
        if (validation.isValid && validation.formattedNumber) {
          validNumbers.push(validation.formattedNumber)
        } else {
          logger.warn(`Invalid phone number: ${phoneNumber}`, { error: validation.error })
        }
      } else {
        // Basic formatting without validation
        const formatted = this.formatPhoneNumber(phoneNumber)
        if (formatted) {
          validNumbers.push(formatted)
        }
      }
    }

    return validNumbers
  }

  /**
   * Basic phone number formatting
   */
  private formatPhoneNumber(phoneNumber: string): string | null {
    // Remove all non-digit characters
    const digits = phoneNumber.replace(/\D/g, '')
    
    // Must have at least 10 digits
    if (digits.length < 10) return null
    
    // Add + if not present and has country code
    if (digits.length > 10 && !phoneNumber.startsWith('+')) {
      return `+${digits}`
    }
    
    // Add US country code if 10 digits
    if (digits.length === 10) {
      return `+1${digits}`
    }
    
    return phoneNumber.startsWith('+') ? phoneNumber : `+${digits}`
  }

  /**
   * Filter valid recipients based on suppression and opt-in
   */
  private async filterValidRecipients(
    recipients: string[],
    suppressionList?: string[]
  ): Promise<string[]> {
    const suppressed = new Set(suppressionList || [])
    
    // Add database suppression list and check opt-in status
    const dbPreferences = await db.notificationPreference.findMany({
      where: {
        user: { phone: { in: recipients } },
        OR: [
          { smsEnabled: false },
          { smsOptIn: false }
        ]
      },
      select: { user: { select: { phone: true } } }
    })

    dbPreferences.forEach(pref => {
      if (pref.user.phone) {
        suppressed.add(pref.user.phone)
      }
    })

    return recipients.filter(phone => !suppressed.has(phone))
  }

  /**
   * Send SMS via Twilio
   */
  private async sendViaTwilio(
    content: { message: string; mediaUrls?: string[] },
    recipients: string[],
    options: SMSDeliveryOptions
  ): Promise<Array<{ sid: string; to: string }>> {
    const results: Array<{ sid: string; to: string }> = []

    for (const recipient of recipients) {
      try {
        const messageData: any = {
          body: content.message,
          to: recipient
        }

        // Use messaging service or phone number
        if (this.twilioMessagingServiceSid) {
          messageData.messagingServiceSid = this.twilioMessagingServiceSid
        } else {
          messageData.from = this.twilioPhoneNumber
        }

        // Add media URLs if provided
        if (content.mediaUrls && content.mediaUrls.length > 0) {
          messageData.mediaUrl = content.mediaUrls
        }

        // Add custom sender ID if provided and supported
        if (options.customSenderId) {
          messageData.from = options.customSenderId
        }

        // Add delivery receipt URL
        if (options.deliveryReceiptUrl) {
          messageData.statusCallback = options.deliveryReceiptUrl
        }

        const message = await this.twilioClient.messages.create(messageData)
        
        results.push({
          sid: message.sid,
          to: recipient
        })

        logger.debug(`SMS queued for ${recipient}: ${message.sid}`)

      } catch (error) {
        logger.error(`Failed to send SMS to ${recipient}:`, error)
        // Continue with other recipients
      }
    }

    return results
  }

  /**
   * Shorten URLs in message
   */
  private async shortenUrls(message: string): Promise<string> {
    // Simple URL shortening implementation
    // In production, integrate with a URL shortening service
    const urlRegex = /(https?:\/\/[^\s]+)/g
    
    return message.replace(urlRegex, (url) => {
      // For now, just return the original URL
      // In production, call URL shortening service
      return url
    })
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
      throw new Error('SMS rate limit exceeded')
    }
  }

  /**
   * Record delivery attempt
   */
  private async recordDeliveryAttempt(
    payload: SMSNotificationPayload,
    result: { sid: string; to: string } | null,
    status: 'sent' | 'failed',
    error?: string
  ): Promise<void> {
    try {
      const recipients = Array.isArray(payload.to) ? payload.to : [payload.to]
      
      for (const recipient of recipients) {
        await db.notificationDeliveryLog.create({
          data: {
            notificationId: `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            channel: 'sms',
            status: status === 'sent' ? 'queued' : 'failed',
            providerMessageId: result?.sid,
            errorMessage: error,
            attemptedAt: new Date(),
            metadata: {
              recipient,
              message: payload.message.substring(0, 100), // Store first 100 chars
              templateId: payload.templateId,
              priority: payload.priority,
              tags: payload.tags
            }
          }
        })
      }
    } catch (logError) {
      logger.error('Failed to record SMS delivery attempt:', logError)
    }
  }

  /**
   * Retry delivery with exponential backoff
   */
  private async retryDelivery(
    payload: SMSNotificationPayload,
    options: SMSDeliveryOptions,
    originalError: any
  ): Promise<SMSDeliveryResult> {
    const retryOptions = {
      ...options,
      retryAttempts: (options.retryAttempts || 1) - 1
    }

    const delay = options.retryDelay || 10000 // 10 seconds default for SMS
    
    logger.info(`Retrying SMS delivery in ${delay}ms`, {
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
        where: { type: 'sms' }
      })

      templates.forEach(dbTemplate => {
        const template: SMSTemplate = {
          id: dbTemplate.id,
          name: dbTemplate.name,
          content: (dbTemplate.content as any).message,
          variables: (dbTemplate.content as any).variables || [],
          category: (dbTemplate.metadata as any)?.category || 'general',
          isActive: (dbTemplate.metadata as any)?.isActive ?? true,
          maxLength: (dbTemplate.content as any).maxLength || 160
        }

        this.templateCache.set(template.id, template)
        this.templateCacheExpiry.set(template.id, Date.now() + 3600000)
      })

      logger.info(`Loaded ${templates.length} SMS templates into cache`)
    } catch (error) {
      logger.error('Failed to load SMS templates:', error)
    }
  }

  /**
   * Setup webhook handlers for delivery tracking
   */
  private setupWebhookHandlers(): void {
    this.on('webhook_status', this.handleStatusWebhook.bind(this))
  }

  /**
   * Handle Twilio status webhook
   */
  private async handleStatusWebhook(data: any): Promise<void> {
    try {
      const status = data.MessageStatus as SMSStatus
      
      await db.notificationDeliveryLog.updateMany({
        where: { providerMessageId: data.MessageSid },
        data: {
          status: this.mapTwilioStatus(status),
          deliveredAt: status === 'delivered' ? new Date() : null,
          errorMessage: data.ErrorMessage
        }
      })

      // Update metrics
      switch (status) {
        case 'delivered':
          this.deliveryMetrics.delivered++
          break
        case 'failed':
        case 'undelivered':
          this.deliveryMetrics.failed++
          break
        case 'queued':
          this.deliveryMetrics.queued++
          break
      }

      this.emit('sms_status_updated', data)
    } catch (error) {
      logger.error('Failed to handle SMS status webhook:', error)
    }
  }

  /**
   * Map Twilio status to our internal status
   */
  private mapTwilioStatus(twilioStatus: SMSStatus): string {
    const statusMap: Record<SMSStatus, string> = {
      queued: 'queued',
      sent: 'sent',
      delivered: 'delivered',
      failed: 'failed',
      undelivered: 'failed'
    }
    
    return statusMap[twilioStatus] || 'unknown'
  }

  /**
   * Setup country-specific configurations
   */
  private setupCountryConfigs(): void {
    // US
    this.countryConfigs.set('US', {
      maxLength: 1600,
      allowsAlphanumericSender: false,
      requiresOptIn: true,
      timeRestrictions: { start: 8, end: 21 } // 8 AM to 9 PM
    })

    // UK
    this.countryConfigs.set('GB', {
      maxLength: 160,
      allowsAlphanumericSender: true,
      requiresOptIn: true
    })

    // Canada
    this.countryConfigs.set('CA', {
      maxLength: 1600,
      allowsAlphanumericSender: false,
      requiresOptIn: true,
      timeRestrictions: { start: 8, end: 21 }
    })

    // Add more countries as needed
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
      twilioConfigured: !!this.twilioClient
    }
  }

  /**
   * Shutdown the service
   */
  public async shutdown(): Promise<void> {
    this.templateCache.clear()
    this.templateCacheExpiry.clear()
    this.removeAllListeners()
    this.isInitialized = false
    
    logger.info('SMS Channel Service shutdown complete')
  }
}

export default SMSChannelService