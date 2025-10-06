import { Router } from 'express'
import { z } from 'zod'
import { ChannelOrchestrator } from '../channel-orchestrator'
import { NotificationAnalyticsEngine } from '../analytics-engine'
import { NotificationHealthChecker } from '../monitoring/health-check'
import { validateRequest } from '../middleware/validation'
import { rateLimitMiddleware } from '../middleware/rate-limit'
import { authMiddleware } from '../middleware/auth'

// Request schemas
const SendNotificationSchema = z.object({
  userId: z.string(),
  type: z.enum(['email', 'sms', 'push', 'inApp']),
  template: z.string(),
  data: z.record(z.any()).optional(),
  channels: z.array(z.enum(['email', 'sms', 'push', 'inApp'])).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  scheduledAt: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional(),
})

const BulkNotificationSchema = z.object({
  notifications: z.array(SendNotificationSchema),
  batchSize: z.number().min(1).max(1000).default(100),
})

const TemplateSchema = z.object({
  name: z.string(),
  type: z.enum(['email', 'sms', 'push', 'inApp']),
  subject: z.string().optional(),
  content: z.string(),
  variables: z.array(z.string()).default([]),
  metadata: z.record(z.any()).optional(),
})

const AnalyticsQuerySchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  channels: z.array(z.enum(['email', 'sms', 'push', 'inApp'])).optional(),
  userId: z.string().optional(),
  template: z.string().optional(),
  groupBy: z.enum(['channel', 'template', 'user', 'day', 'hour']).optional(),
})

/**
 * Create notification API routes
 */
export function createNotificationRoutes(
  orchestrator: ChannelOrchestrator,
  analyticsEngine: NotificationAnalyticsEngine,
  healthChecker: NotificationHealthChecker
): Router {
  const router = Router()

  // Apply middleware
  router.use(authMiddleware)
  router.use(rateLimitMiddleware)

  /**
   * Send a single notification
   */
  router.post('/send', validateRequest(SendNotificationSchema), async (req, res) => {
    try {
      const request = req.body
      
      const result = await orchestrator.sendNotification({
        userId: request.userId,
        type: request.type,
        template: request.template,
        data: request.data || {},
        channels: request.channels,
        priority: request.priority,
        scheduledAt: request.scheduledAt ? new Date(request.scheduledAt) : undefined,
        metadata: request.metadata || {},
      })

      res.json({
        success: true,
        notificationId: result.id,
        message: 'Notification queued successfully',
      })
    } catch (error) {
      console.error('Error sending notification:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to send notification',
      })
    }
  })

  /**
   * Send bulk notifications
   */
  router.post('/send/bulk', validateRequest(BulkNotificationSchema), async (req, res) => {
    try {
      const { notifications, batchSize } = req.body
      
      const results = await orchestrator.sendBulkNotifications(
        notifications.map(n => ({
          userId: n.userId,
          type: n.type,
          template: n.template,
          data: n.data || {},
          channels: n.channels,
          priority: n.priority,
          scheduledAt: n.scheduledAt ? new Date(n.scheduledAt) : undefined,
          metadata: n.metadata || {},
        })),
        { batchSize }
      )

      res.json({
        success: true,
        results,
        message: `${results.length} notifications queued successfully`,
      })
    } catch (error) {
      console.error('Error sending bulk notifications:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to send bulk notifications',
      })
    }
  })

  /**
   * Get notification status
   */
  router.get('/status/:notificationId', async (req, res) => {
    try {
      const { notificationId } = req.params
      
      // Get notification from database
      const notification = await orchestrator['prisma'].notification.findUnique({
        where: { id: notificationId },
        include: {
          deliveryAttempts: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      })

      if (!notification) {
        return res.status(404).json({
          success: false,
          error: 'Notification not found',
        })
      }

      res.json({
        success: true,
        notification: {
          id: notification.id,
          status: notification.status,
          channels: notification.channels,
          createdAt: notification.createdAt,
          scheduledAt: notification.scheduledAt,
          deliveredAt: notification.deliveredAt,
          deliveryAttempts: notification.deliveryAttempts.map(attempt => ({
            id: attempt.id,
            channel: attempt.channel,
            status: attempt.status,
            error: attempt.error,
            createdAt: attempt.createdAt,
          })),
        },
      })
    } catch (error) {
      console.error('Error getting notification status:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get notification status',
      })
    }
  })

  /**
   * Get user notifications (for in-app display)
   */
  router.get('/user/:userId', async (req, res) => {
    try {
      const { userId } = req.params
      const { page = '1', limit = '20', unreadOnly = 'false' } = req.query
      
      const pageNum = parseInt(page as string)
      const limitNum = parseInt(limit as string)
      const skip = (pageNum - 1) * limitNum

      const where: any = { userId }
      if (unreadOnly === 'true') {
        where.readAt = null
      }

      const [notifications, total] = await Promise.all([
        orchestrator['prisma'].notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limitNum,
          select: {
            id: true,
            type: true,
            template: true,
            data: true,
            status: true,
            createdAt: true,
            readAt: true,
            clickedAt: true,
          },
        }),
        orchestrator['prisma'].notification.count({ where }),
      ])

      res.json({
        success: true,
        notifications,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      })
    } catch (error) {
      console.error('Error getting user notifications:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get user notifications',
      })
    }
  })

  /**
   * Mark notification as read
   */
  router.patch('/read/:notificationId', async (req, res) => {
    try {
      const { notificationId } = req.params
      
      await orchestrator['prisma'].notification.update({
        where: { id: notificationId },
        data: { readAt: new Date() },
      })

      res.json({
        success: true,
        message: 'Notification marked as read',
      })
    } catch (error) {
      console.error('Error marking notification as read:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to mark notification as read',
      })
    }
  })

  /**
   * Mark all user notifications as read
   */
  router.patch('/read-all/:userId', async (req, res) => {
    try {
      const { userId } = req.params
      
      await orchestrator['prisma'].notification.updateMany({
        where: { 
          userId,
          readAt: null,
        },
        data: { readAt: new Date() },
      })

      res.json({
        success: true,
        message: 'All notifications marked as read',
      })
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to mark all notifications as read',
      })
    }
  })

  /**
   * Get notification templates
   */
  router.get('/templates', async (req, res) => {
    try {
      const { type, search } = req.query
      
      const where: any = {}
      if (type) {
        where.type = type
      }
      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { content: { contains: search as string, mode: 'insensitive' } },
        ]
      }

      const templates = await orchestrator['prisma'].notificationTemplate.findMany({
        where,
        orderBy: { name: 'asc' },
      })

      res.json({
        success: true,
        templates,
      })
    } catch (error) {
      console.error('Error getting templates:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get templates',
      })
    }
  })

  /**
   * Create notification template
   */
  router.post('/templates', validateRequest(TemplateSchema), async (req, res) => {
    try {
      const template = await orchestrator['prisma'].notificationTemplate.create({
        data: req.body,
      })

      res.status(201).json({
        success: true,
        template,
        message: 'Template created successfully',
      })
    } catch (error) {
      console.error('Error creating template:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to create template',
      })
    }
  })

  /**
   * Update notification template
   */
  router.put('/templates/:templateId', validateRequest(TemplateSchema), async (req, res) => {
    try {
      const { templateId } = req.params
      
      const template = await orchestrator['prisma'].notificationTemplate.update({
        where: { id: templateId },
        data: req.body,
      })

      res.json({
        success: true,
        template,
        message: 'Template updated successfully',
      })
    } catch (error) {
      console.error('Error updating template:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to update template',
      })
    }
  })

  /**
   * Delete notification template
   */
  router.delete('/templates/:templateId', async (req, res) => {
    try {
      const { templateId } = req.params
      
      await orchestrator['prisma'].notificationTemplate.delete({
        where: { id: templateId },
      })

      res.json({
        success: true,
        message: 'Template deleted successfully',
      })
    } catch (error) {
      console.error('Error deleting template:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to delete template',
      })
    }
  })

  /**
   * Get analytics data
   */
  router.get('/analytics/delivery', validateRequest(AnalyticsQuerySchema, 'query'), async (req, res) => {
    try {
      const query = req.query as any
      
      const analytics = await analyticsEngine.getDeliveryAnalytics({
        startDate: new Date(query.startDate),
        endDate: new Date(query.endDate),
        channels: query.channels,
        userId: query.userId,
        template: query.template,
        groupBy: query.groupBy,
      })

      res.json({
        success: true,
        analytics,
      })
    } catch (error) {
      console.error('Error getting delivery analytics:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get delivery analytics',
      })
    }
  })

  /**
   * Get engagement analytics
   */
  router.get('/analytics/engagement', validateRequest(AnalyticsQuerySchema, 'query'), async (req, res) => {
    try {
      const query = req.query as any
      
      const analytics = await analyticsEngine.getEngagementAnalytics({
        startDate: new Date(query.startDate),
        endDate: new Date(query.endDate),
        channels: query.channels,
        userId: query.userId,
        template: query.template,
        groupBy: query.groupBy,
      })

      res.json({
        success: true,
        analytics,
      })
    } catch (error) {
      console.error('Error getting engagement analytics:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get engagement analytics',
      })
    }
  })

  /**
   * Get performance metrics
   */
  router.get('/analytics/performance', async (req, res) => {
    try {
      const { timeRange = '24h' } = req.query
      
      const metrics = await analyticsEngine.getPerformanceMetrics(timeRange as string)

      res.json({
        success: true,
        metrics,
      })
    } catch (error) {
      console.error('Error getting performance metrics:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get performance metrics',
      })
    }
  })

  /**
   * Get dashboard data
   */
  router.get('/analytics/dashboard', async (req, res) => {
    try {
      const dashboard = await analyticsEngine.getDashboardData()

      res.json({
        success: true,
        dashboard,
      })
    } catch (error) {
      console.error('Error getting dashboard data:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get dashboard data',
      })
    }
  })

  /**
   * Get system health
   */
  router.get('/health/detailed', async (req, res) => {
    try {
      const health = await healthChecker.checkHealth()
      res.json({
        success: true,
        health,
      })
    } catch (error) {
      console.error('Error getting system health:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get system health',
      })
    }
  })

  return router
}