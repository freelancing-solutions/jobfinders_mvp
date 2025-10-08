/**
 * Notification System Integration Service
 * Integrates the notification system with the main Next.js application
 */

import { NotificationService } from '@/lib/notifications/notification-service';
import { Logger } from '@/lib/logger';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  channels: NotificationChannel[];
  status: 'pending' | 'sent' | 'failed' | 'read';
  createdAt: Date;
  readAt?: Date;
  scheduledFor?: Date;
  expiresAt?: Date;
}

export interface NotificationChannel {
  type: 'in_app' | 'email' | 'sms' | 'push' | 'webhook';
  status: 'pending' | 'sent' | 'failed';
  sentAt?: Date;
  error?: string;
  metadata?: any;
}

export interface NotificationPreferences {
  userId: string;
  channels: {
    in_app: boolean;
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string;   // HH:mm format
    timezone: string;
  };
  categories: {
    [category: string]: {
      enabled: boolean;
      channels: string[];
      frequency: 'immediate' | 'daily' | 'weekly' | 'never';
    };
  };
}

export interface NotificationTemplate {
  id: string;
  name: string;
  category: string;
  type: string;
  subject?: string;
  content: string;
  variables: string[];
  channels: string[];
  isActive: boolean;
}

export interface EventTrigger {
  event: string;
  conditions?: any;
  template: string;
  channels: string[];
  delay?: number; // seconds
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export class NotificationIntegrationService {
  private notificationService: NotificationService;
  private logger: Logger;

  constructor() {
    this.notificationService = new NotificationService();
    this.logger = new Logger('NotificationIntegration');
  }

  /**
   * Send a notification
   */
  async sendNotification(params: {
    userId: string;
    type: string;
    title: string;
    message: string;
    data?: any;
    channels?: string[];
    scheduledFor?: Date;
    priority?: 'low' | 'medium' | 'high' | 'critical';
  }): Promise<Notification> {
    try {
      // Get user preferences
      const preferences = await this.getUserPreferences(params.userId);

      // Check if user should receive this notification
      const canSend = await this.canSendNotification(params, preferences);
      if (!canSend.allowed) {
        this.logger.info(`Notification blocked: ${canSend.reason}`);
        throw new Error(canSend.reason);
      }

      // Determine channels to use
      const channels = await this.determineChannels(params, preferences);

      // Create notification
      const notification = await this.notificationService.createNotification({
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        data: params.data,
        channels,
        scheduledFor: params.scheduledFor,
        priority: params.priority || 'medium'
      });

      // Send notification immediately if not scheduled
      if (!params.scheduledFor || params.scheduledFor <= new Date()) {
        await this.processNotification(notification.id);
      }

      return notification;

    } catch (error) {
      this.logger.error('Error sending notification:', error);
      throw error;
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
      category?: string;
    } = {}
  ): Promise<Notification[]> {
    try {
      return await this.notificationService.getUserNotifications(userId, options);

    } catch (error) {
      this.logger.error('Error getting user notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(userId: string, notificationId: string): Promise<void> {
    try {
      await this.notificationService.markAsRead(userId, notificationId);

    } catch (error) {
      this.logger.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      await this.notificationService.markAllAsRead(userId);

    } catch (error) {
      this.logger.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Get user notification preferences
   */
  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      return await this.notificationService.getUserPreferences(userId);

    } catch (error) {
      this.logger.error('Error getting user preferences:', error);
      // Return default preferences
      return this.getDefaultPreferences(userId);
    }
  }

  /**
   * Update user notification preferences
   */
  async updatePreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    try {
      await this.notificationService.updateUserPreferences(userId, preferences);

    } catch (error) {
      this.logger.error('Error updating user preferences:', error);
      throw error;
    }
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotifications(
    params: {
      userIds: string[];
      type: string;
      title: string;
      message: string;
      data?: any;
      channels?: string[];
    }
  ): Promise<{ successful: string[]; failed: string[] }> {
    const successful: string[] = [];
    const failed: string[] = [];

    // Process in batches to avoid overwhelming the system
    const batchSize = 50;
    const batches = Math.ceil(params.userIds.length / batchSize);

    for (let i = 0; i < batches; i++) {
      const batch = params.userIds.slice(i * batchSize, (i + 1) * batchSize);

      const results = await Promise.allSettled(
        batch.map(async (userId) => {
          try {
            await this.sendNotification({
              userId,
              type: params.type,
              title: params.title,
              message: params.message,
              data: params.data,
              channels: params.channels
            });
            return userId;
          } catch (error) {
            this.logger.error(`Failed to send notification to ${userId}:`, error);
            throw error;
          }
        })
      );

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successful.push(result.value);
        } else {
          failed.push(batch[index]);
        }
      });

      // Add delay between batches
      if (i < batches - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return { successful, failed };
  }

  /**
   * Set up event-based notifications
   */
  async setupEventTriggers(triggers: EventTrigger[]): Promise<void> {
    try {
      await this.notificationService.setupEventTriggers(triggers);

    } catch (error) {
      this.logger.error('Error setting up event triggers:', error);
      throw error;
    }
  }

  /**
   * Process event-based notification
   */
  async processEventNotification(
    event: string,
    data: any,
    userId?: string
  ): Promise<void> {
    try {
      await this.notificationService.processEventTrigger(event, data, userId);

    } catch (error) {
      this.logger.error(`Error processing event notification for ${event}:`, error);
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(
    userId: string,
    timeframe: '7d' | '30d' | '90d' = '30d'
  ): Promise<{
    total: number;
    sent: number;
    read: number;
    failed: number;
    byCategory: Record<string, number>;
    byChannel: Record<string, number>;
  }> {
    try {
      return await this.notificationService.getNotificationStats(userId, timeframe);

    } catch (error) {
      this.logger.error('Error getting notification stats:', error);
      throw error;
    }
  }

  /**
   * Create custom notification template
   */
  async createTemplate(template: Omit<NotificationTemplate, 'id'>): Promise<NotificationTemplate> {
    try {
      return await this.notificationService.createTemplate(template);

    } catch (error) {
      this.logger.error('Error creating notification template:', error);
      throw error;
    }
  }

  /**
   * Send notification using template
   */
  async sendTemplateNotification(
    templateId: string,
    userId: string,
    variables: Record<string, any>,
    options?: {
      channels?: string[];
      scheduledFor?: Date;
    }
  ): Promise<Notification> {
    try {
      return await this.notificationService.sendFromTemplate(
        templateId,
        userId,
        variables,
        options
      );

    } catch (error) {
      this.logger.error('Error sending template notification:', error);
      throw error;
    }
  }

  // Private methods
  private async canSendNotification(
    params: any,
    preferences: NotificationPreferences
  ): Promise<{ allowed: boolean; reason?: string }> {
    // Check quiet hours
    if (preferences.quietHours.enabled) {
      const now = new Date();
      const currentTime = this.getTimeInTimezone(now, preferences.quietHours.timezone);
      const [startHour, startMin] = preferences.quietHours.start.split(':').map(Number);
      const [endHour, endMin] = preferences.quietHours.end.split(':').map(Number);

      const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
        return { allowed: false, reason: 'Quiet hours active' };
      }
    }

    // Check category preferences
    const categoryPrefs = preferences.categories[params.type];
    if (categoryPrefs && !categoryPrefs.enabled) {
      return { allowed: false, reason: 'Category disabled' };
    }

    return { allowed: true };
  }

  private async determineChannels(
    params: any,
    preferences: NotificationPreferences
  ): Promise<string[]> {
    // If channels specified, filter by user preferences
    if (params.channels) {
      return params.channels.filter(channel => {
        const channelKey = channel as keyof typeof preferences.channels;
        return preferences.channels[channelKey];
      });
    }

    // Use default channels based on notification type
    const defaultChannels = ['in_app', 'email'];
    return defaultChannels.filter(channel => {
      const channelKey = channel as keyof typeof preferences.channels;
      return preferences.channels[channelKey];
    });
  }

  private getTimeInTimezone(date: Date, timezone: string): Date {
    // This would use a proper timezone library like date-fns-tz or luxon
    // For now, return the date as-is
    return date;
  }

  private getDefaultPreferences(userId: string): NotificationPreferences {
    return {
      userId,
      channels: {
        in_app: true,
        email: true,
        sms: false,
        push: true
      },
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
        timezone: 'UTC'
      },
      categories: {
        job_matches: {
          enabled: true,
          channels: ['in_app', 'email'],
          frequency: 'immediate'
        },
        application_updates: {
          enabled: true,
          channels: ['in_app', 'email'],
          frequency: 'immediate'
        },
        resume_analysis: {
          enabled: true,
          channels: ['in_app'],
          frequency: 'immediate'
        },
        marketing: {
          enabled: false,
          channels: ['email'],
          frequency: 'weekly'
        }
      }
    };
  }

  private async processNotification(notificationId: string): Promise<void> {
    try {
      await this.notificationService.processNotification(notificationId);
    } catch (error) {
      this.logger.error(`Error processing notification ${notificationId}:`, error);
    }
  }
}