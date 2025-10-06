import { Server } from 'socket.io'
import { db } from './db'
import { EmailService } from './email/email-service'
import { NotificationPreferencesManager } from './notification-preferences'
import { NotificationData } from './notifications'

export interface EnhancedNotificationData extends NotificationData {
  channels?: ('websocket' | 'email' | 'sms')[]
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  templateId?: string
  campaignId?: string
  scheduledFor?: Date
  expiresAt?: Date
}

export class EnhancedNotificationService {
  private static instance: EnhancedNotificationService
  private io: Server | null = null
  private emailService: EmailService
  private preferencesManager: NotificationPreferencesManager

  private constructor() {
    this.emailService = EmailService.getInstance()
    this.preferencesManager = new NotificationPreferencesManager()
  }

  public static getInstance(): EnhancedNotificationService {
    if (!EnhancedNotificationService.instance) {
      EnhancedNotificationService.instance = new EnhancedNotificationService()
    }
    return EnhancedNotificationService.instance
  }

  public setSocketIO(io: Server) {
    this.io = io
  }

  /**
   * Send a notification through multiple channels with database persistence
   */
  public async sendNotification(notification: EnhancedNotificationData): Promise<string> {
    try {
      // Generate unique ID if not provided
      const notificationId = notification.id || `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Store notification in database
      const savedNotification = await db.notification.create({
        data: {
          id: notificationId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data ? JSON.stringify(notification.data) : null,
          userId: notification.userId,
          priority: notification.priority || 'medium',
          channels: notification.channels || ['websocket'],
          templateId: notification.templateId,
          campaignId: notification.campaignId,
          scheduledFor: notification.scheduledFor,
          expiresAt: notification.expiresAt,
          read: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      // Get user preferences
      const preferences = await this.preferencesManager.getUserPreferences(notification.userId)
      
      // Check if user should receive this notification
      const channels = notification.channels || ['websocket']
      const deliveryPromises: Promise<void>[] = []

      for (const channel of channels) {
        if (await this.preferencesManager.shouldReceiveNotification(notification.userId, notification.type, channel)) {
          switch (channel) {
            case 'websocket':
              deliveryPromises.push(this.sendWebSocketNotification(notification))
              break
            case 'email':
              deliveryPromises.push(this.sendEmailNotification(notification, preferences))
              break
            case 'sms':
              // SMS implementation would go here
              console.log('SMS delivery not yet implemented')
              break
          }
        }
      }

      // Execute all deliveries in parallel
      await Promise.allSettled(deliveryPromises)

      // Log analytics
      await this.logNotificationAnalytics(notificationId, notification.type, channels)

      return notificationId
    } catch (error) {
      console.error('Error sending enhanced notification:', error)
      throw error
    }
  }

  /**
   * Send WebSocket notification (maintains compatibility with existing system)
   */
  private async sendWebSocketNotification(notification: EnhancedNotificationData): Promise<void> {
    if (!this.io) {
      console.warn('Socket.IO not initialized, skipping WebSocket notification')
      return
    }

    const wsNotification: NotificationData = {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      timestamp: notification.timestamp,
      userId: notification.userId,
      read: notification.read
    }

    this.io.to(`user_${notification.userId}`).emit('notification', wsNotification)
    
    // Log delivery attempt
    await this.logDeliveryAttempt(notification.id, 'websocket', 'sent')
  }

  /**
   * Send email notification using templates
   */
  private async sendEmailNotification(notification: EnhancedNotificationData, preferences: any): Promise<void> {
    try {
      // Get user email
      const user = await db.user.findUnique({
        where: { uid: notification.userId },
        select: { email: true, firstName: true, lastName: true }
      })

      if (!user?.email) {
        await this.logDeliveryAttempt(notification.id, 'email', 'failed', 'No email address')
        return
      }

      // Use template if specified, otherwise create dynamic content
      let emailContent
      if (notification.templateId) {
        const template = await db.notificationTemplate.findUnique({
          where: { id: notification.templateId }
        })
        
        if (template) {
          emailContent = {
            subject: this.processTemplate(template.subject, notification, user),
            html: this.processTemplate(template.htmlContent, notification, user),
            text: this.processTemplate(template.textContent, notification, user)
          }
        }
      }

      // Fallback to dynamic content
      if (!emailContent) {
        emailContent = {
          subject: notification.title,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">${notification.title}</h2>
              <p style="color: #666; line-height: 1.6;">${notification.message}</p>
              ${notification.data ? `<div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <strong>Additional Details:</strong><br>
                ${Object.entries(notification.data).map(([key, value]) => `${key}: ${value}`).join('<br>')}
              </div>` : ''}
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              <p style="color: #999; font-size: 12px;">
                This notification was sent from JobFinders. 
                <a href="#" style="color: #007bff;">Manage your notification preferences</a>
              </p>
            </div>
          `,
          text: `${notification.title}\n\n${notification.message}${notification.data ? '\n\nAdditional Details:\n' + Object.entries(notification.data).map(([key, value]) => `${key}: ${value}`).join('\n') : ''}`
        }
      }

      await this.emailService.sendNotificationEmail(
        user.email,
        emailContent.subject,
        emailContent.html,
        emailContent.text,
        notification.id
      )

      await this.logDeliveryAttempt(notification.id, 'email', 'sent')
    } catch (error) {
      console.error('Error sending email notification:', error)
      await this.logDeliveryAttempt(notification.id, 'email', 'failed', error.message)
    }
  }

  /**
   * Process template variables
   */
  private processTemplate(template: string, notification: EnhancedNotificationData, user: any): string {
    return template
      .replace(/\{\{title\}\}/g, notification.title)
      .replace(/\{\{message\}\}/g, notification.message)
      .replace(/\{\{userName\}\}/g, `${user.firstName} ${user.lastName}`.trim())
      .replace(/\{\{userEmail\}\}/g, user.email)
      .replace(/\{\{timestamp\}\}/g, notification.timestamp.toLocaleString())
      .replace(/\{\{data\.(\w+)\}\}/g, (match, key) => {
        return notification.data?.[key] || ''
      })
  }

  /**
   * Mark notification as read
   */
  public async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      await db.notification.updateMany({
        where: {
          id: notificationId,
          userId: userId
        },
        data: {
          read: true,
          readAt: new Date(),
          updatedAt: new Date()
        }
      })

      // Emit to WebSocket if available
      if (this.io) {
        this.io.to(`user_${userId}`).emit('notification_marked_read', { notificationId })
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
      throw error
    }
  }

  /**
   * Get user notifications with pagination
   */
  public async getUserNotifications(
    userId: string, 
    options: {
      page?: number
      limit?: number
      unreadOnly?: boolean
      type?: string
    } = {}
  ) {
    const { page = 1, limit = 20, unreadOnly = false, type } = options
    const skip = (page - 1) * limit

    const where: any = { userId }
    if (unreadOnly) where.read = false
    if (type) where.type = type

    const [notifications, total] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      db.notification.count({ where })
    ])

    return {
      notifications: notifications.map(n => ({
        ...n,
        data: n.data ? JSON.parse(n.data) : null
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  /**
   * Log delivery attempt
   */
  private async logDeliveryAttempt(
    notificationId: string, 
    channel: string, 
    status: 'sent' | 'failed' | 'delivered' | 'bounced',
    error?: string
  ): Promise<void> {
    try {
      await db.notificationDeliveryLog.create({
        data: {
          notificationId,
          channel,
          status,
          attemptedAt: new Date(),
          error
        }
      })
    } catch (error) {
      console.error('Error logging delivery attempt:', error)
    }
  }

  /**
   * Log notification analytics
   */
  private async logNotificationAnalytics(
    notificationId: string,
    type: string,
    channels: string[]
  ): Promise<void> {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Update or create analytics record
      await db.notificationAnalytics.upsert({
        where: {
          date_type: {
            date: today,
            type: type
          }
        },
        update: {
          sent: { increment: 1 },
          channels: channels,
          updatedAt: new Date()
        },
        create: {
          date: today,
          type: type,
          sent: 1,
          delivered: 0,
          opened: 0,
          clicked: 0,
          channels: channels,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
    } catch (error) {
      console.error('Error logging analytics:', error)
    }
  }

  /**
   * Send bulk notifications (for campaigns)
   */
  public async sendBulkNotifications(
    userIds: string[],
    notification: Omit<EnhancedNotificationData, 'userId' | 'id'>,
    campaignId?: string
  ): Promise<string[]> {
    const notificationIds: string[] = []

    for (const userId of userIds) {
      try {
        const id = await this.sendNotification({
          ...notification,
          userId,
          campaignId
        })
        notificationIds.push(id)
      } catch (error) {
        console.error(`Error sending notification to user ${userId}:`, error)
      }
    }

    return notificationIds
  }

  /**
   * Clean up expired notifications
   */
  public async cleanupExpiredNotifications(): Promise<number> {
    try {
      const result = await db.notification.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      })
      return result.count
    } catch (error) {
      console.error('Error cleaning up expired notifications:', error)
      return 0
    }
  }
}

export default EnhancedNotificationService