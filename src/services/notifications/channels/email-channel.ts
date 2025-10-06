import { EventEmitter } from 'events'
import { Resend } from 'resend'
import { db } from '@/lib/db'
import { redis } from '@/lib/redis'
import { logger } from '@/lib/logger'
import { sendEmail, EmailType } from '@/lib/email/service'

/**
 * Email notification payload
 */
export interface EmailNotificationPayload {
  to: string | string[]
  subject: string
  templateId?: string
  templateData?: Record<string, any>
  html?: string
  text?: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  scheduledFor?: Date
  metadata?: Record<string, any>
  tags?: string[]
  attachments?: EmailAttachment[]
}

/**
 * Email attachment
 */
interface EmailAttachment {
  filename: string
  content: Buffer | string
  contentType: string
  disposition?: 'attachment' | 'inline'
  cid?: string
}

/**
 * Email delivery result
 */
export interface EmailDeliveryResult {
  success: boolean
  messageId?: string
  error?: string
  deliveredAt: Date
  metadata?: Record<string, any>
}

/**
 * Email template data
 */
interface EmailTemplate {
  id: string
  name: string
  subject: string
  htmlContent: string
  textContent?: string
  variables: string[]
  category: string
  isActive: boolean
}

/**
 * Email delivery options
 */
interface DeliveryOptions {
  retryAttempts?: number
  retryDelay?: number
  trackOpens?: boolean
  trackClicks?: boolean
  suppressionList?: string[]
  customHeaders?: Record<string, string>
}

/**
 * Email Channel Service
 * 
 * Handles email notifications with Resend integration, template management,
 * delivery tracking, and advanced features like scheduling and analytics.
 */
export class EmailChannelService extends EventEmitter {
  private static instance: EmailChannelService
  private resend: Resend
  private isInitialized = false
  
  // Template cache
  private templateCache = new Map<string, EmailTemplate>()
  private templateCacheExpiry = new Map<string, number>()
  
  // Rate limiting
  private rateLimitKey = 'email_rate_limit'
  private defaultRateLimit = 100 // emails per minute
  
  // Delivery tracking
  private deliveryMetrics = {
    sent: 0,
    delivered: 0,
    failed: 0,
    bounced: 0,
    opened: 0,
    clicked: 0
  }

  private constructor() {
    super()
    this.resend = new Resend(process.env.RESEND_API_KEY)
  }

  public static getInstance(): EmailChannelService {
    if (!EmailChannelService.instance) {
      EmailChannelService.instance = new EmailChannelService()
    }
    return EmailChannelService.instance
  }

  /**
   * Initialize the email channel service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Verify Resend API key
      if (!process.env.RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY environment variable is required')
      }

      // Load templates into cache
      await this.loadTemplates()

      // Setup webhook handlers for delivery tracking
      this.setupWebhookHandlers()

      this.isInitialized = true
      logger.info('Email Channel Service initialized successfully')
    } catch (error) {
      logger.error('Failed to initialize Email Channel Service:', error)
      throw error
    }
  }

  /**
   * Send email notification
   */
  public async sendNotification(
    payload: EmailNotificationPayload,
    options: DeliveryOptions = {}
  ): Promise<EmailDeliveryResult> {
    if (!this.isInitialized) {
      throw new Error('Email Channel Service must be initialized before sending')
    }

    const startTime = Date.now()

    try {
      // Check rate limits
      await this.checkRateLimit()

      // Prepare email content
      const emailContent = await this.prepareEmailContent(payload)

      // Check suppression list
      const recipients = await this.filterSuppressedRecipients(
        Array.isArray(payload.to) ? payload.to : [payload.to],
        options.suppressionList
      )

      if (recipients.length === 0) {
        throw new Error('All recipients are suppressed')
      }

      // Send email via Resend
      const result = await this.sendViaResend(emailContent, recipients, options)

      // Record delivery attempt
      await this.recordDeliveryAttempt(payload, result, 'sent')

      // Update metrics
      this.deliveryMetrics.sent++

      const deliveryResult: EmailDeliveryResult = {
        success: true,
        messageId: result.id,
        deliveredAt: new Date(),
        metadata: {
          recipients: recipients.length,
          deliveryTime: Date.now() - startTime,
          templateId: payload.templateId,
          priority: payload.priority
        }
      }

      this.emit('email_sent', { payload, result: deliveryResult })
      
      logger.info(`Email sent successfully: ${result.id}`, {
        recipients: recipients.length,
        templateId: payload.templateId,
        deliveryTime: Date.now() - startTime
      })

      return deliveryResult

    } catch (error) {
      logger.error('Failed to send email notification:', error)

      // Record failed delivery
      await this.recordDeliveryAttempt(payload, null, 'failed', error.message)

      // Update metrics
      this.deliveryMetrics.failed++

      const deliveryResult: EmailDeliveryResult = {
        success: false,
        error: error.message,
        deliveredAt: new Date(),
        metadata: {
          deliveryTime: Date.now() - startTime,
          templateId: payload.templateId,
          priority: payload.priority
        }
      }

      this.emit('email_failed', { payload, error, result: deliveryResult })

      // Retry logic if configured
      if (options.retryAttempts && options.retryAttempts > 0) {
        return this.retryDelivery(payload, options, error)
      }

      throw error
    }
  }

  /**
   * Send bulk email notifications
   */
  public async sendBulkNotifications(
    payloads: EmailNotificationPayload[],
    options: DeliveryOptions = {}
  ): Promise<EmailDeliveryResult[]> {
    const results: EmailDeliveryResult[] = []
    const batchSize = 50 // Resend batch limit
    
    logger.info(`Sending bulk emails: ${payloads.length} notifications`)

    for (let i = 0; i < payloads.length; i += batchSize) {
      const batch = payloads.slice(i, i + batchSize)
      
      // Process batch in parallel with concurrency control
      const batchPromises = batch.map(payload => 
        this.sendNotification(payload, options).catch(error => ({
          success: false,
          error: error.message,
          deliveredAt: new Date(),
          metadata: { templateId: payload.templateId }
        } as EmailDeliveryResult))
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

    logger.info(`Bulk email sending completed: ${results.filter(r => r.success).length}/${results.length} successful`)
    
    return results
  }

  /**
   * Create or update email template
   */
  public async createTemplate(template: Omit<EmailTemplate, 'id'>): Promise<string> {
    const templateId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const newTemplate: EmailTemplate = {
      ...template,
      id: templateId
    }

    // Save to database
    await db.notificationTemplate.create({
      data: {
        id: templateId,
        name: template.name,
        type: 'email',
        subject: template.subject,
        content: {
          html: template.htmlContent,
          text: template.textContent,
          variables: template.variables
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

    logger.info(`Email template created: ${templateId}`)
    return templateId
  }

  /**
   * Get email template
   */
  public async getTemplate(templateId: string): Promise<EmailTemplate | null> {
    // Check cache first
    if (this.templateCache.has(templateId)) {
      const expiry = this.templateCacheExpiry.get(templateId)
      if (expiry && expiry > Date.now()) {
        return this.templateCache.get(templateId)!
      }
    }

    // Load from database
    const dbTemplate = await db.notificationTemplate.findUnique({
      where: { id: templateId, type: 'email' }
    })

    if (!dbTemplate) return null

    const template: EmailTemplate = {
      id: dbTemplate.id,
      name: dbTemplate.name,
      subject: dbTemplate.subject,
      htmlContent: (dbTemplate.content as any).html,
      textContent: (dbTemplate.content as any).text,
      variables: (dbTemplate.content as any).variables || [],
      category: (dbTemplate.metadata as any)?.category || 'general',
      isActive: (dbTemplate.metadata as any)?.isActive ?? true
    }

    // Update cache
    this.templateCache.set(templateId, template)
    this.templateCacheExpiry.set(templateId, Date.now() + 3600000)

    return template
  }

  /**
   * Prepare email content from template or direct content
   */
  private async prepareEmailContent(payload: EmailNotificationPayload): Promise<{
    subject: string
    html: string
    text?: string
  }> {
    if (payload.templateId) {
      const template = await this.getTemplate(payload.templateId)
      if (!template) {
        throw new Error(`Email template not found: ${payload.templateId}`)
      }

      if (!template.isActive) {
        throw new Error(`Email template is inactive: ${payload.templateId}`)
      }

      // Render template with data
      const renderedContent = this.renderTemplate(template, payload.templateData || {})
      
      return {
        subject: payload.subject || renderedContent.subject,
        html: renderedContent.html,
        text: renderedContent.text
      }
    }

    if (!payload.html) {
      throw new Error('Either templateId or html content must be provided')
    }

    return {
      subject: payload.subject,
      html: payload.html,
      text: payload.text
    }
  }

  /**
   * Render template with data
   */
  private renderTemplate(template: EmailTemplate, data: Record<string, any>): {
    subject: string
    html: string
    text?: string
  } {
    // Simple template rendering (in production, use a proper template engine)
    let subject = template.subject
    let html = template.htmlContent
    let text = template.textContent

    // Replace variables
    Object.entries(data).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`
      const stringValue = String(value)
      
      subject = subject.replace(new RegExp(placeholder, 'g'), stringValue)
      html = html.replace(new RegExp(placeholder, 'g'), stringValue)
      if (text) {
        text = text.replace(new RegExp(placeholder, 'g'), stringValue)
      }
    })

    return { subject, html, text }
  }

  /**
   * Send email via Resend
   */
  private async sendViaResend(
    content: { subject: string; html: string; text?: string },
    recipients: string[],
    options: DeliveryOptions
  ): Promise<{ id: string }> {
    const emailData: any = {
      from: `${process.env.RESEND_FROM_NAME || 'JobFinders'} <${process.env.RESEND_FROM_EMAIL || 'noreply@jobfinders.com'}>`,
      to: recipients,
      subject: content.subject,
      html: content.html,
      replyTo: process.env.RESEND_REPLY_TO || 'support@jobfinders.com'
    }

    if (content.text) {
      emailData.text = content.text
    }

    if (options.customHeaders) {
      emailData.headers = options.customHeaders
    }

    const { data, error } = await this.resend.emails.send(emailData)

    if (error) {
      throw new Error(`Resend API error: ${error.message}`)
    }

    return { id: data!.id }
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
      throw new Error('Email rate limit exceeded')
    }
  }

  /**
   * Filter suppressed recipients
   */
  private async filterSuppressedRecipients(
    recipients: string[],
    suppressionList?: string[]
  ): Promise<string[]> {
    const suppressed = new Set(suppressionList || [])
    
    // Add database suppression list
    const dbSuppressed = await db.notificationPreference.findMany({
      where: {
        user: { email: { in: recipients } },
        emailEnabled: false
      },
      select: { user: { select: { email: true } } }
    })

    dbSuppressed.forEach(pref => {
      if (pref.user.email) {
        suppressed.add(pref.user.email)
      }
    })

    return recipients.filter(email => !suppressed.has(email))
  }

  /**
   * Record delivery attempt
   */
  private async recordDeliveryAttempt(
    payload: EmailNotificationPayload,
    result: { id: string } | null,
    status: 'sent' | 'failed',
    error?: string
  ): Promise<void> {
    try {
      // Find or create notification record
      const recipients = Array.isArray(payload.to) ? payload.to : [payload.to]
      
      for (const recipient of recipients) {
        await db.notificationDeliveryLog.create({
          data: {
            notificationId: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            channel: 'email',
            status: status === 'sent' ? 'delivered' : 'failed',
            providerMessageId: result?.id,
            errorMessage: error,
            attemptedAt: new Date(),
            deliveredAt: status === 'sent' ? new Date() : null,
            metadata: {
              recipient,
              subject: payload.subject,
              templateId: payload.templateId,
              priority: payload.priority,
              tags: payload.tags
            }
          }
        })
      }
    } catch (logError) {
      logger.error('Failed to record email delivery attempt:', logError)
    }
  }

  /**
   * Retry delivery with exponential backoff
   */
  private async retryDelivery(
    payload: EmailNotificationPayload,
    options: DeliveryOptions,
    originalError: any
  ): Promise<EmailDeliveryResult> {
    const retryOptions = {
      ...options,
      retryAttempts: (options.retryAttempts || 1) - 1
    }

    const delay = options.retryDelay || 5000
    
    logger.info(`Retrying email delivery in ${delay}ms`, {
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
        where: { type: 'email' }
      })

      templates.forEach(dbTemplate => {
        const template: EmailTemplate = {
          id: dbTemplate.id,
          name: dbTemplate.name,
          subject: dbTemplate.subject,
          htmlContent: (dbTemplate.content as any).html,
          textContent: (dbTemplate.content as any).text,
          variables: (dbTemplate.content as any).variables || [],
          category: (dbTemplate.metadata as any)?.category || 'general',
          isActive: (dbTemplate.metadata as any)?.isActive ?? true
        }

        this.templateCache.set(template.id, template)
        this.templateCacheExpiry.set(template.id, Date.now() + 3600000)
      })

      logger.info(`Loaded ${templates.length} email templates into cache`)
    } catch (error) {
      logger.error('Failed to load email templates:', error)
    }
  }

  /**
   * Setup webhook handlers for delivery tracking
   */
  private setupWebhookHandlers(): void {
    // This would be implemented as Express middleware or API routes
    // to handle Resend webhooks for delivery, bounce, and engagement tracking
    
    this.on('webhook_delivery', this.handleDeliveryWebhook.bind(this))
    this.on('webhook_bounce', this.handleBounceWebhook.bind(this))
    this.on('webhook_open', this.handleOpenWebhook.bind(this))
    this.on('webhook_click', this.handleClickWebhook.bind(this))
  }

  /**
   * Handle delivery webhook
   */
  private async handleDeliveryWebhook(data: any): Promise<void> {
    try {
      await db.notificationDeliveryLog.updateMany({
        where: { providerMessageId: data.messageId },
        data: {
          status: 'delivered',
          deliveredAt: new Date(data.timestamp)
        }
      })

      this.deliveryMetrics.delivered++
      this.emit('email_delivered', data)
    } catch (error) {
      logger.error('Failed to handle delivery webhook:', error)
    }
  }

  /**
   * Handle bounce webhook
   */
  private async handleBounceWebhook(data: any): Promise<void> {
    try {
      await db.notificationDeliveryLog.updateMany({
        where: { providerMessageId: data.messageId },
        data: {
          status: 'bounced',
          errorMessage: data.reason
        }
      })

      this.deliveryMetrics.bounced++
      this.emit('email_bounced', data)
    } catch (error) {
      logger.error('Failed to handle bounce webhook:', error)
    }
  }

  /**
   * Handle open webhook
   */
  private async handleOpenWebhook(data: any): Promise<void> {
    try {
      // Record email open event
      await db.notificationAnalytics.upsert({
        where: {
          notificationId_event: {
            notificationId: data.messageId,
            event: 'opened'
          }
        },
        update: {
          count: { increment: 1 },
          lastEventAt: new Date(data.timestamp)
        },
        create: {
          notificationId: data.messageId,
          event: 'opened',
          count: 1,
          lastEventAt: new Date(data.timestamp),
          metadata: data
        }
      })

      this.deliveryMetrics.opened++
      this.emit('email_opened', data)
    } catch (error) {
      logger.error('Failed to handle open webhook:', error)
    }
  }

  /**
   * Handle click webhook
   */
  private async handleClickWebhook(data: any): Promise<void> {
    try {
      // Record email click event
      await db.notificationAnalytics.upsert({
        where: {
          notificationId_event: {
            notificationId: data.messageId,
            event: 'clicked'
          }
        },
        update: {
          count: { increment: 1 },
          lastEventAt: new Date(data.timestamp)
        },
        create: {
          notificationId: data.messageId,
          event: 'clicked',
          count: 1,
          lastEventAt: new Date(data.timestamp),
          metadata: data
        }
      })

      this.deliveryMetrics.clicked++
      this.emit('email_clicked', data)
    } catch (error) {
      logger.error('Failed to handle click webhook:', error)
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
      rateLimit: this.defaultRateLimit
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
    
    logger.info('Email Channel Service shutdown complete')
  }
}

export default EmailChannelService