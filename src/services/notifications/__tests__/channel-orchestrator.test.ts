import { ChannelOrchestrator } from '../channel-orchestrator'
import { EmailChannelService } from '../channels/email-channel'
import { SMSChannelService } from '../channels/sms-channel'
import { PushChannelService } from '../channels/push-channel'
import { InAppChannelService } from '../channels/in-app-channel'
import { NotificationAnalyticsEngine } from '../analytics-engine'
import { PrismaClient } from '@prisma/client'
import { EventQueueManager } from '../../../lib/queue/event-queue'

// Mock dependencies
jest.mock('../channels/email-channel')
jest.mock('../channels/sms-channel')
jest.mock('../channels/push-channel')
jest.mock('../channels/in-app-channel')
jest.mock('../analytics-engine')
jest.mock('@prisma/client')
jest.mock('../../../lib/queue/event-queue')

describe('ChannelOrchestrator', () => {
  let orchestrator: ChannelOrchestrator
  let mockPrisma: jest.Mocked<PrismaClient>
  let mockEventQueue: jest.Mocked<EventQueueManager>
  let mockAnalytics: jest.Mocked<NotificationAnalyticsEngine>

  beforeEach(() => {
    mockPrisma = {
      notification: {
        create: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
      },
      notificationPreference: {
        findFirst: jest.fn(),
      },
      notificationDeliveryLog: {
        create: jest.fn(),
      },
    } as any

    mockEventQueue = {
      addJob: jest.fn(),
      on: jest.fn(),
    } as any

    mockAnalytics = {
      trackEvent: jest.fn(),
      incrementMetric: jest.fn(),
    } as any

    // Mock the singleton getInstance method
    jest.spyOn(ChannelOrchestrator, 'getInstance').mockReturnValue({
      initialize: jest.fn(),
      registerChannel: jest.fn(),
      sendNotification: jest.fn(),
      getChannelStatus: jest.fn(),
      on: jest.fn(),
      emit: jest.fn(),
    } as any)

    orchestrator = ChannelOrchestrator.getInstance()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Channel Registration', () => {
    it('should register email channel successfully', () => {
      const emailChannel = new EmailChannelService({} as any, {} as any, {} as any)
      
      orchestrator.registerChannel('email', emailChannel)
      
      expect(orchestrator['channels'].has('email')).toBe(true)
    })

    it('should register multiple channels', () => {
      const emailChannel = new EmailChannelService({} as any, {} as any, {} as any)
      const smsChannel = new SMSChannelService({} as any, {} as any, {} as any)
      
      orchestrator.registerChannel('email', emailChannel)
      orchestrator.registerChannel('sms', smsChannel)
      
      expect(orchestrator['channels'].size).toBe(2)
    })
  })

  describe('Single Notification Sending', () => {
    beforeEach(() => {
      const emailChannel = new EmailChannelService({} as any, {} as any, {} as any)
      orchestrator.registerChannel('email', emailChannel)
    })

    it('should send notification successfully', async () => {
      const request = {
        userId: 'user-123',
        type: 'welcome',
        channels: ['email'],
        priority: 'medium' as const,
        content: {
          title: 'Welcome!',
          body: 'Welcome to our platform',
        },
        metadata: {},
      }

      mockPrisma.notification.create.mockResolvedValue({
        id: 'notif-123',
        ...request,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)

      mockPrisma.notificationPreference.findFirst.mockResolvedValue({
        emailEnabled: true,
        smsEnabled: false,
        pushEnabled: true,
      } as any)

      const result = await orchestrator.sendNotification(request)

      expect(result.success).toBe(true)
      expect(result.notificationId).toBe('notif-123')
      expect(mockPrisma.notification.create).toHaveBeenCalled()
      expect(mockEventQueue.addJob).toHaveBeenCalled()
    })

    it('should handle validation errors', async () => {
      const invalidRequest = {
        userId: '',
        type: 'welcome',
        channels: [],
        priority: 'medium' as const,
        content: {
          title: '',
          body: '',
        },
        metadata: {},
      }

      const result = await orchestrator.sendNotification(invalidRequest)

      expect(result.success).toBe(false)
      expect(result.error).toContain('validation')
    })

    it('should respect user preferences', async () => {
      const request = {
        userId: 'user-123',
        type: 'marketing',
        channels: ['email', 'sms'],
        priority: 'low' as const,
        content: {
          title: 'Special Offer',
          body: 'Check out our latest deals',
        },
        metadata: {},
      }

      mockPrisma.notification.create.mockResolvedValue({
        id: 'notif-123',
        ...request,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)

      mockPrisma.notificationPreference.findFirst.mockResolvedValue({
        emailEnabled: false,
        smsEnabled: true,
        pushEnabled: false,
      } as any)

      await orchestrator.sendNotification(request)

      // Should only queue SMS since email is disabled
      expect(mockEventQueue.addJob).toHaveBeenCalledWith(
        'notification-delivery',
        expect.objectContaining({
          channels: ['sms'],
        }),
        expect.any(Object)
      )
    })
  })

  describe('Bulk Notification Sending', () => {
    it('should send bulk notifications successfully', async () => {
      const requests = [
        {
          userId: 'user-1',
          type: 'announcement',
          channels: ['email'],
          priority: 'medium' as const,
          content: { title: 'News 1', body: 'Content 1' },
          metadata: {},
        },
        {
          userId: 'user-2',
          type: 'announcement',
          channels: ['email'],
          priority: 'medium' as const,
          content: { title: 'News 2', body: 'Content 2' },
          metadata: {},
        },
      ]

      mockPrisma.notification.create
        .mockResolvedValueOnce({ id: 'notif-1' } as any)
        .mockResolvedValueOnce({ id: 'notif-2' } as any)

      mockPrisma.notificationPreference.findFirst.mockResolvedValue({
        emailEnabled: true,
      } as any)

      const results = await orchestrator.sendBulkNotifications(requests)

      expect(results).toHaveLength(2)
      expect(results.every(r => r.success)).toBe(true)
      expect(mockPrisma.notification.create).toHaveBeenCalledTimes(2)
    })

    it('should handle partial failures in bulk sending', async () => {
      const requests = [
        {
          userId: 'user-1',
          type: 'announcement',
          channels: ['email'],
          priority: 'medium' as const,
          content: { title: 'News 1', body: 'Content 1' },
          metadata: {},
        },
        {
          userId: '', // Invalid user ID
          type: 'announcement',
          channels: ['email'],
          priority: 'medium' as const,
          content: { title: 'News 2', body: 'Content 2' },
          metadata: {},
        },
      ]

      mockPrisma.notification.create.mockResolvedValueOnce({ id: 'notif-1' } as any)
      mockPrisma.notificationPreference.findFirst.mockResolvedValue({
        emailEnabled: true,
      } as any)

      const results = await orchestrator.sendBulkNotifications(requests)

      expect(results).toHaveLength(2)
      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(false)
    })
  })

  describe('Scheduled Notifications', () => {
    it('should schedule notification for future delivery', async () => {
      const request = {
        userId: 'user-123',
        type: 'reminder',
        channels: ['email'],
        priority: 'medium' as const,
        content: {
          title: 'Reminder',
          body: 'Don\'t forget!',
        },
        metadata: {},
        scheduledFor: new Date(Date.now() + 3600000), // 1 hour from now
      }

      mockPrisma.notification.create.mockResolvedValue({
        id: 'notif-123',
        ...request,
        status: 'SCHEDULED',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)

      const result = await orchestrator.sendNotification(request)

      expect(result.success).toBe(true)
      expect(mockEventQueue.addJob).toHaveBeenCalledWith(
        'notification-delivery',
        expect.any(Object),
        expect.objectContaining({
          delay: expect.any(Number),
        })
      )
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const request = {
        userId: 'user-123',
        type: 'welcome',
        channels: ['email'],
        priority: 'medium' as const,
        content: {
          title: 'Welcome!',
          body: 'Welcome to our platform',
        },
        metadata: {},
      }

      mockPrisma.notification.create.mockRejectedValue(new Error('Database error'))

      const result = await orchestrator.sendNotification(request)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Database error')
    })

    it('should handle queue errors gracefully', async () => {
      const request = {
        userId: 'user-123',
        type: 'welcome',
        channels: ['email'],
        priority: 'medium' as const,
        content: {
          title: 'Welcome!',
          body: 'Welcome to our platform',
        },
        metadata: {},
      }

      mockPrisma.notification.create.mockResolvedValue({
        id: 'notif-123',
        ...request,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)

      mockEventQueue.addJob.mockRejectedValue(new Error('Queue error'))

      const result = await orchestrator.sendNotification(request)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Queue error')
    })
  })

  describe('Analytics Integration', () => {
    it('should track notification events', async () => {
      const request = {
        userId: 'user-123',
        type: 'welcome',
        channels: ['email'],
        priority: 'medium' as const,
        content: {
          title: 'Welcome!',
          body: 'Welcome to our platform',
        },
        metadata: {},
      }

      mockPrisma.notification.create.mockResolvedValue({
        id: 'notif-123',
        ...request,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)

      await orchestrator.sendNotification(request)

      expect(mockAnalytics.trackEvent).toHaveBeenCalledWith(
        'notification_created',
        expect.objectContaining({
          notificationId: 'notif-123',
          type: 'welcome',
          channels: ['email'],
        })
      )
    })
  })
})