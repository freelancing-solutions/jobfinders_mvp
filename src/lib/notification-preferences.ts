import { db } from './db'
import { NotificationPreference } from '@prisma/client'

/**
 * User notification preferences management
 * Handles channel preferences, notification types, and delivery settings
 */
export class NotificationPreferencesManager {
  /**
   * Get user notification preferences
   * Creates default preferences if none exist
   */
  async getUserPreferences(userId: string): Promise<NotificationPreference> {
    try {
      let preferences = await db.notificationPreference.findUnique({
        where: { userId }
      })

      // Create default preferences if none exist
      if (!preferences) {
        preferences = await this.createDefaultPreferences(userId)
      }

      return preferences
    } catch (error) {
      console.error('Failed to get user preferences:', error)
      throw error
    }
  }

  /**
   * Create default notification preferences for a user
   */
  async createDefaultPreferences(userId: string): Promise<NotificationPreference> {
    try {
      return await db.notificationPreference.create({
        data: {
          userId,
          // Channel preferences - email and in-app enabled by default
          emailEnabled: true,
          smsEnabled: false,
          pushEnabled: true,
          inAppEnabled: true,
          
          // Notification type preferences - important ones enabled
          applicationUpdates: true,
          newJobAlerts: true,
          jobMatches: true,
          applicationReceived: true,
          systemAnnouncements: true,
          marketingEmails: false,
          
          // Delivery timing - immediate by default
          timezone: 'UTC',
          frequency: 'immediate'
        }
      })
    } catch (error) {
      console.error('Failed to create default preferences:', error)
      throw error
    }
  }

  /**
   * Update user notification preferences
   */
  async updatePreferences(
    userId: string,
    updates: Partial<Omit<NotificationPreference, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<NotificationPreference> {
    try {
      // Ensure preferences exist
      await this.getUserPreferences(userId)

      return await db.notificationPreference.update({
        where: { userId },
        data: {
          ...updates,
          updatedAt: new Date()
        }
      })
    } catch (error) {
      console.error('Failed to update preferences:', error)
      throw error
    }
  }

  /**
   * Check if user should receive notification based on preferences
   */
  async shouldReceiveNotification(
    userId: string,
    notificationType: string,
    channel: string
  ): Promise<boolean> {
    try {
      const preferences = await this.getUserPreferences(userId)

      // Check channel preference
      switch (channel) {
        case 'email':
          if (!preferences.emailEnabled) return false
          break
        case 'sms':
          if (!preferences.smsEnabled) return false
          break
        case 'push':
          if (!preferences.pushEnabled) return false
          break
        case 'in_app':
          if (!preferences.inAppEnabled) return false
          break
      }

      // Check notification type preference
      switch (notificationType) {
        case 'application_status':
          return preferences.applicationUpdates
        case 'new_job':
          return preferences.newJobAlerts
        case 'job_match':
          return preferences.jobMatches
        case 'application_received':
          return preferences.applicationReceived
        case 'system_announcement':
          return preferences.systemAnnouncements
        case 'marketing':
          return preferences.marketingEmails
        default:
          return true // Allow unknown types by default
      }
    } catch (error) {
      console.error('Failed to check notification preferences:', error)
      return false // Fail safe - don't send if we can't check
    }
  }

  /**
   * Check if notification should be sent based on quiet hours
   */
  async isWithinQuietHours(userId: string): Promise<boolean> {
    try {
      const preferences = await this.getUserPreferences(userId)

      if (!preferences.quietHoursStart || !preferences.quietHoursEnd) {
        return false // No quiet hours set
      }

      const now = new Date()
      const userTimezone = preferences.timezone || 'UTC'
      
      // Convert current time to user's timezone
      const userTime = new Date(now.toLocaleString('en-US', { timeZone: userTimezone }))
      const currentHour = userTime.getHours()
      const currentMinute = userTime.getMinutes()
      const currentTimeInMinutes = currentHour * 60 + currentMinute

      // Parse quiet hours
      const [startHour, startMinute] = preferences.quietHoursStart.split(':').map(Number)
      const [endHour, endMinute] = preferences.quietHoursEnd.split(':').map(Number)
      const startTimeInMinutes = startHour * 60 + startMinute
      const endTimeInMinutes = endHour * 60 + endMinute

      // Handle overnight quiet hours (e.g., 22:00 to 08:00)
      if (startTimeInMinutes > endTimeInMinutes) {
        return currentTimeInMinutes >= startTimeInMinutes || currentTimeInMinutes <= endTimeInMinutes
      } else {
        return currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes <= endTimeInMinutes
      }
    } catch (error) {
      console.error('Failed to check quiet hours:', error)
      return false
    }
  }

  /**
   * Get delivery frequency for user
   */
  async getDeliveryFrequency(userId: string): Promise<string> {
    try {
      const preferences = await this.getUserPreferences(userId)
      return preferences.frequency || 'immediate'
    } catch (error) {
      console.error('Failed to get delivery frequency:', error)
      return 'immediate'
    }
  }

  /**
   * Update contact information
   */
  async updateContactInfo(
    userId: string,
    contactInfo: {
      phoneNumber?: string
      alternateEmail?: string
    }
  ): Promise<NotificationPreference> {
    try {
      return await this.updatePreferences(userId, contactInfo)
    } catch (error) {
      console.error('Failed to update contact info:', error)
      throw error
    }
  }

  /**
   * Bulk update preferences for multiple users
   */
  async bulkUpdatePreferences(
    updates: Array<{
      userId: string
      preferences: Partial<Omit<NotificationPreference, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
    }>
  ): Promise<void> {
    try {
      const updatePromises = updates.map(({ userId, preferences }) =>
        this.updatePreferences(userId, preferences)
      )

      await Promise.all(updatePromises)
    } catch (error) {
      console.error('Failed to bulk update preferences:', error)
      throw error
    }
  }

  /**
   * Get users who should receive a specific notification type
   */
  async getUsersForNotificationType(
    notificationType: string,
    channel: string
  ): Promise<string[]> {
    try {
      const whereClause: any = {}

      // Build where clause based on channel
      switch (channel) {
        case 'email':
          whereClause.emailEnabled = true
          break
        case 'sms':
          whereClause.smsEnabled = true
          break
        case 'push':
          whereClause.pushEnabled = true
          break
        case 'in_app':
          whereClause.inAppEnabled = true
          break
      }

      // Add notification type filter
      switch (notificationType) {
        case 'application_status':
          whereClause.applicationUpdates = true
          break
        case 'new_job':
          whereClause.newJobAlerts = true
          break
        case 'job_match':
          whereClause.jobMatches = true
          break
        case 'application_received':
          whereClause.applicationReceived = true
          break
        case 'system_announcement':
          whereClause.systemAnnouncements = true
          break
        case 'marketing':
          whereClause.marketingEmails = true
          break
      }

      const preferences = await db.notificationPreference.findMany({
        where: whereClause,
        select: { userId: true }
      })

      return preferences.map(p => p.userId)
    } catch (error) {
      console.error('Failed to get users for notification type:', error)
      return []
    }
  }

  /**
   * Export user preferences (for GDPR compliance)
   */
  async exportUserPreferences(userId: string): Promise<NotificationPreference | null> {
    try {
      return await db.notificationPreference.findUnique({
        where: { userId }
      })
    } catch (error) {
      console.error('Failed to export user preferences:', error)
      return null
    }
  }

  /**
   * Delete user preferences (for GDPR compliance)
   */
  async deleteUserPreferences(userId: string): Promise<void> {
    try {
      await db.notificationPreference.delete({
        where: { userId }
      })
    } catch (error) {
      console.error('Failed to delete user preferences:', error)
      throw error
    }
  }
}

// Singleton instance
let preferencesManagerInstance: NotificationPreferencesManager | null = null

/**
 * Get notification preferences manager instance
 */
export const getNotificationPreferencesManager = (): NotificationPreferencesManager => {
  if (!preferencesManagerInstance) {
    preferencesManagerInstance = new NotificationPreferencesManager()
  }
  return preferencesManagerInstance
}

/**
 * Utility functions for common preference operations
 */
export const NotificationPreferencesUtils = {
  /**
   * Quick check if user accepts email notifications
   */
  async canSendEmail(userId: string): Promise<boolean> {
    const manager = getNotificationPreferencesManager()
    return await manager.shouldReceiveNotification(userId, 'application_status', 'email')
  },

  /**
   * Quick check if user accepts SMS notifications
   */
  async canSendSMS(userId: string): Promise<boolean> {
    const manager = getNotificationPreferencesManager()
    return await manager.shouldReceiveNotification(userId, 'application_status', 'sms')
  },

  /**
   * Quick check if user accepts push notifications
   */
  async canSendPush(userId: string): Promise<boolean> {
    const manager = getNotificationPreferencesManager()
    return await manager.shouldReceiveNotification(userId, 'application_status', 'push')
  },

  /**
   * Get user's preferred contact method
   */
  async getPreferredChannel(userId: string): Promise<string> {
    const manager = getNotificationPreferencesManager()
    const preferences = await manager.getUserPreferences(userId)

    if (preferences.emailEnabled) return 'email'
    if (preferences.pushEnabled) return 'push'
    if (preferences.inAppEnabled) return 'in_app'
    if (preferences.smsEnabled) return 'sms'

    return 'in_app' // Fallback
  }
}