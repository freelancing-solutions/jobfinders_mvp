import { NextApiRequest, NextApiResponse } from 'next'
import { EnhancedNotificationService } from './enhanced-notification-service'
import { NotificationPreferencesManager } from './notification-preferences'
import { TemplateManager } from './email/template-manager'

const enhancedService = EnhancedNotificationService.getInstance()
const preferencesManager = new NotificationPreferencesManager()
const templateManager = new TemplateManager()

/**
 * API handler for notification operations
 */
export async function handleNotificationAPI(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req
  const { action } = req.query

  try {
    switch (method) {
      case 'GET':
        return await handleGetRequest(req, res, action as string)
      case 'POST':
        return await handlePostRequest(req, res, action as string)
      case 'PUT':
        return await handlePutRequest(req, res, action as string)
      case 'DELETE':
        return await handleDeleteRequest(req, res, action as string)
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Notification API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * Handle GET requests
 */
async function handleGetRequest(req: NextApiRequest, res: NextApiResponse, action: string) {
  const { userId } = req.query

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'User ID is required' })
  }

  switch (action) {
    case 'notifications':
      const { page = '1', limit = '20', unreadOnly = 'false', type } = req.query
      const result = await enhancedService.getUserNotifications(userId, {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        unreadOnly: unreadOnly === 'true',
        type: type as string
      })
      return res.status(200).json(result)

    case 'preferences':
      const preferences = await preferencesManager.getUserPreferences(userId)
      return res.status(200).json(preferences)

    case 'templates':
      const templates = await templateManager.getAllTemplates()
      return res.status(200).json(templates)

    default:
      return res.status(400).json({ error: 'Invalid action' })
  }
}

/**
 * Handle POST requests
 */
async function handlePostRequest(req: NextApiRequest, res: NextApiResponse, action: string) {
  switch (action) {
    case 'send':
      const { userId, type, title, message, data, channels, priority, templateId } = req.body
      
      if (!userId || !type || !title || !message) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      const notificationId = await enhancedService.sendNotification({
        id: `notif_${Date.now()}_${Math.random()}`,
        type,
        title,
        message,
        data,
        timestamp: new Date(),
        userId,
        read: false,
        channels: channels || ['websocket'],
        priority: priority || 'medium',
        templateId
      })

      return res.status(201).json({ notificationId })

    case 'bulk-send':
      const { userIds, notification, campaignId } = req.body
      
      if (!userIds || !Array.isArray(userIds) || !notification) {
        return res.status(400).json({ error: 'Invalid bulk send data' })
      }

      const notificationIds = await enhancedService.sendBulkNotifications(
        userIds,
        notification,
        campaignId
      )

      return res.status(201).json({ notificationIds })

    case 'template':
      const { name, subject, htmlContent, textContent, variables } = req.body
      
      if (!name || !subject || !htmlContent) {
        return res.status(400).json({ error: 'Missing required template fields' })
      }

      const template = await templateManager.createTemplate({
        name,
        subject,
        htmlContent,
        textContent: textContent || '',
        variables: variables || []
      })

      return res.status(201).json(template)

    default:
      return res.status(400).json({ error: 'Invalid action' })
  }
}

/**
 * Handle PUT requests
 */
async function handlePutRequest(req: NextApiRequest, res: NextApiResponse, action: string) {
  const { userId } = req.query

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'User ID is required' })
  }

  switch (action) {
    case 'mark-read':
      const { notificationId } = req.body
      
      if (!notificationId) {
        return res.status(400).json({ error: 'Notification ID is required' })
      }

      await enhancedService.markAsRead(notificationId, userId)
      return res.status(200).json({ success: true })

    case 'preferences':
      const { preferences } = req.body
      
      if (!preferences) {
        return res.status(400).json({ error: 'Preferences data is required' })
      }

      const updated = await preferencesManager.updatePreferences(userId, preferences)
      return res.status(200).json(updated)

    case 'template':
      const { templateId } = req.query
      const { name, subject, htmlContent, textContent, variables } = req.body
      
      if (!templateId || typeof templateId !== 'string') {
        return res.status(400).json({ error: 'Template ID is required' })
      }

      const updatedTemplate = await templateManager.updateTemplate(templateId, {
        name,
        subject,
        htmlContent,
        textContent,
        variables
      })

      return res.status(200).json(updatedTemplate)

    default:
      return res.status(400).json({ error: 'Invalid action' })
  }
}

/**
 * Handle DELETE requests
 */
async function handleDeleteRequest(req: NextApiRequest, res: NextApiResponse, action: string) {
  switch (action) {
    case 'template':
      const { templateId } = req.query
      
      if (!templateId || typeof templateId !== 'string') {
        return res.status(400).json({ error: 'Template ID is required' })
      }

      await templateManager.deactivateTemplate(templateId)
      return res.status(200).json({ success: true })

    case 'cleanup':
      const deletedCount = await enhancedService.cleanupExpiredNotifications()
      return res.status(200).json({ deletedCount })

    default:
      return res.status(400).json({ error: 'Invalid action' })
  }
}

/**
 * Utility functions for common notification operations
 */
export class NotificationAPIUtils {
  /**
   * Send a welcome notification to a new user
   */
  static async sendWelcomeNotification(userId: string, userName: string) {
    return await enhancedService.sendNotification({
      id: `welcome_${userId}_${Date.now()}`,
      type: 'application_status', // Using existing type for compatibility
      title: 'Welcome to JobFinders!',
      message: `Welcome ${userName}! Your account has been successfully created.`,
      data: { welcomeMessage: true },
      timestamp: new Date(),
      userId,
      read: false,
      channels: ['websocket', 'email'],
      priority: 'low',
      templateId: 'welcome_email'
    })
  }

  /**
   * Send application status update notification
   */
  static async sendApplicationStatusUpdate(
    userId: string,
    applicationId: string,
    newStatus: string,
    jobTitle: string,
    company: string
  ) {
    return await enhancedService.sendNotification({
      id: `app_status_${applicationId}_${Date.now()}`,
      type: 'application_status',
      title: 'Application Status Updated',
      message: `Your application for ${jobTitle} at ${company} has been ${newStatus.toLowerCase()}`,
      data: {
        applicationId,
        newStatus,
        jobTitle,
        company
      },
      timestamp: new Date(),
      userId,
      read: false,
      channels: ['websocket', 'email'],
      priority: newStatus === 'accepted' ? 'high' : 'medium',
      templateId: 'application_status_update'
    })
  }

  /**
   * Send job match notification
   */
  static async sendJobMatchNotification(
    userId: string,
    jobId: string,
    jobTitle: string,
    company: string,
    matchScore: number
  ) {
    return await enhancedService.sendNotification({
      id: `job_match_${jobId}_${userId}_${Date.now()}`,
      type: 'job_match',
      title: 'New Job Match Found!',
      message: `We found a ${matchScore}% match: ${jobTitle} at ${company}`,
      data: {
        jobId,
        jobTitle,
        company,
        matchScore
      },
      timestamp: new Date(),
      userId,
      read: false,
      channels: ['websocket', 'email'],
      priority: matchScore >= 80 ? 'high' : 'medium',
      templateId: 'new_job_match'
    })
  }

  /**
   * Send application received notification to employer
   */
  static async sendApplicationReceivedNotification(
    employerId: string,
    jobId: string,
    jobTitle: string,
    applicantName: string,
    applicationId: string
  ) {
    return await enhancedService.sendNotification({
      id: `app_received_${applicationId}_${Date.now()}`,
      type: 'application_received',
      title: 'New Application Received',
      message: `${applicantName} has applied for your ${jobTitle} position`,
      data: {
        jobId,
        jobTitle,
        applicantName,
        applicationId
      },
      timestamp: new Date(),
      userId: employerId,
      read: false,
      channels: ['websocket', 'email'],
      priority: 'medium',
      templateId: 'application_received'
    })
  }
}

export default handleNotificationAPI