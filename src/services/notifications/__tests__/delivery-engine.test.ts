import { DeliveryEngine } from '../delivery-engine'
import { ChannelOrchestrator } from '../channel-orchestrator'
import { NotificationAnalyticsEngine } from '../analytics-engine'
import { PrismaClient } from '@prisma/client'
import { EventQueue } from '../../../lib/queue/event-queue'

// Mock dependencies
jest.mock('../channel-orchestrator')
jest.mock('../analytics-engine')
jest.mock('@prisma/client')
jest.mock('../../../lib/queue/event-queue')

describe('DeliveryEngine', () => {
  let deliveryEngine: DeliveryEngine
  let mockOrchestrator: jest.Mocked<ChannelOrchestrator>
  let mockPrisma: jest.Mocked<PrismaClient>
  let mockEventQueue: jest.Mocked<EventQueue>
  let mockAnalytics: jest.Mocked<NotificationAnalyticsEngine>

  beforeEach(() => {
    mockOrchestrator = {
      processDeliveryJob: jest.fn(),
    } as any

    mockPrisma = {
      notification: {
        findMany: jest.fn(),
        update: jest.fn(),
      },
      notificationDeliveryLog: {
        create: jest.fn(),
        updateMany: jest.fn(),
      },
    } as any

    mockEventQueue = {
      addJob: jest.fn(),
      process: jest.fn(),
      on: jest.fn(),
    } as any

    mockAnalytics = {
      trackEvent: jest.fn(),
      incrementMetric: jest.fn(),
      recordLatency: jest.fn(),
    } as any

    deliveryEngine = new DeliveryEngine(
      mockOrchestrator,
      mockPrisma,
      mockEventQueue,
      mockAnalytics
    )
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      expect(deliveryEngine).toBeDefined()
      expect(deliveryEngine['config'].batchSize).toBe(100)
      expect(deliveryEngine['config'].batchTimeout).toBe(5000)
      expect(deliveryEngine['config'].maxConcurrency).toBe(10)
    })

    it('should initialize with custom configuration', () => {
      const customConfig = {
        batchSize: 50,
        batchTimeout: 3000,
        maxConcurrency: 5,
        retryAttempts: 5,
        retryDelay: 2000,
      }

      const customEngine = new DeliveryEngine(
        mockOrchestrator,
        mockPrisma,
        mockEventQueue,
        mockAnalytics,
        customConfig
      )

      expect(customEngine['config'].batchSize).toBe(50)
      expect(customEngine['config'].batchTimeout).toBe(3000)
      expect(customEngine['config'].maxConcurrency).toBe(5)
    })
  })

  describe('Job Processing', () => {
    it('should process single delivery job successfully', async () => {
      const job = {
        notificationId: 'notif-123',
        userId: 'user-123',
        channels: ['email'],
        content: {
          title: 'Test',
          body: 'Test message',
        },
        priority: 'medium' as const,
        metadata: {},
      }

      mockOrchestrator.processDeliveryJob.mockResolvedValue({
        success: true,
        results: [
          {
            channel: 'email',
            success: true,
            messageId: 'msg-123',
            deliveredAt: new Date(),
          },
        ],
      })

      const result = await deliveryEngine.processJob(job)

      expect(result.success).toBe(true)
      expect(mockOrchestrator.processDeliveryJob).toHaveBeenCalledWith(job)
      expect(mockAnalytics.trackEvent).toHaveBeenCalledWith(
        'delivery_completed',
        expect.objectContaining({
          notificationId: 'notif-123',
          success: true,
        })
      )
    })

    it('should handle job processing failures', async () => {
      const job = {
        notificationId: 'notif-123',
        userId: 'user-123',
        channels: ['email'],
        content: {
          title: 'Test',
          body: 'Test message',
        },
        priority: 'medium' as const,
        metadata: {},
      }

      mockOrchestrator.processDeliveryJob.mockRejectedValue(new Error('Processing failed'))

      const result = await deliveryEngine.processJob(job)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Processing failed')
      expect(mockAnalytics.trackEvent).toHaveBeenCalledWith(
        'delivery_failed',
        expect.objectContaining({
          notificationId: 'notif-123',
          error: 'Processing failed',
        })
      )
    })
  })

  describe('Batch Processing', () => {
    it('should process batch of jobs successfully', async () => {
      const jobs = [
        {
          notificationId: 'notif-1',
          userId: 'user-1',
          channels: ['email'],
          content: { title: 'Test 1', body: 'Message 1' },
          priority: 'medium' as const,
          metadata: {},
        },
        {
          notificationId: 'notif-2',
          userId: 'user-2',
          channels: ['sms'],
          content: { title: 'Test 2', body: 'Message 2' },
          priority: 'high' as const,
          metadata: {},
        },
      ]

      mockOrchestrator.processDeliveryJob
        .mockResolvedValueOnce({
          success: true,
          results: [{ channel: 'email', success: true, messageId: 'msg-1', deliveredAt: new Date() }],
        })
        .mockResolvedValueOnce({
          success: true,
          results: [{ channel: 'sms', success: true, messageId: 'msg-2', deliveredAt: new Date() }],
        })

      const results = await deliveryEngine.processBatch(jobs)

      expect(results).toHaveLength(2)
      expect(results.every(r => r.success)).toBe(true)
      expect(mockOrchestrator.processDeliveryJob).toHaveBeenCalledTimes(2)
    })

    it('should handle partial batch failures', async () => {
      const jobs = [
        {
          notificationId: 'notif-1',
          userId: 'user-1',
          channels: ['email'],
          content: { title: 'Test 1', body: 'Message 1' },
          priority: 'medium' as const,
          metadata: {},
        },
        {
          notificationId: 'notif-2',
          userId: 'user-2',
          channels: ['sms'],
          content: { title: 'Test 2', body: 'Message 2' },
          priority: 'high' as const,
          metadata: {},
        },
      ]

      mockOrchestrator.processDeliveryJob
        .mockResolvedValueOnce({
          success: true,
          results: [{ channel: 'email', success: true, messageId: 'msg-1', deliveredAt: new Date() }],
        })
        .mockRejectedValueOnce(new Error('SMS delivery failed'))

      const results = await deliveryEngine.processBatch(jobs)

      expect(results).toHaveLength(2)
      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(false)
    })

    it('should respect concurrency limits', async () => {
      const jobs = Array.from({ length: 20 }, (_, i) => ({
        notificationId: `notif-${i}`,
        userId: `user-${i}`,
        channels: ['email'],
        content: { title: `Test ${i}`, body: `Message ${i}` },
        priority: 'medium' as const,
        metadata: {},
      }))

      let concurrentCalls = 0
      let maxConcurrentCalls = 0

      mockOrchestrator.processDeliveryJob.mockImplementation(async () => {
        concurrentCalls++
        maxConcurrentCalls = Math.max(maxConcurrentCalls, concurrentCalls)
        
        await new Promise(resolve => setTimeout(resolve, 100))
        
        concurrentCalls--
        return {
          success: true,
          results: [{ channel: 'email', success: true, messageId: 'msg-123', deliveredAt: new Date() }],
        }
      })

      await deliveryEngine.processBatch(jobs)

      expect(maxConcurrentCalls).toBeLessThanOrEqual(10) // Default max concurrency
    })
  })

  describe('Retry Logic', () => {
    it('should retry failed jobs with exponential backoff', async () => {
      const job = {
        notificationId: 'notif-123',
        userId: 'user-123',
        channels: ['email'],
        content: { title: 'Test', body: 'Test message' },
        priority: 'medium' as const,
        metadata: {},
      }

      // Mock first two attempts to fail, third to succeed
      mockOrchestrator.processDeliveryJob
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({
          success: true,
          results: [{ channel: 'email', success: true, messageId: 'msg-123', deliveredAt: new Date() }],
        })

      const result = await deliveryEngine.processJobWithRetry(job)

      expect(result.success).toBe(true)
      expect(mockOrchestrator.processDeliveryJob).toHaveBeenCalledTimes(3)
    })

    it('should fail after max retry attempts', async () => {
      const job = {
        notificationId: 'notif-123',
        userId: 'user-123',
        channels: ['email'],
        content: { title: 'Test', body: 'Test message' },
        priority: 'medium' as const,
        metadata: {},
      }

      mockOrchestrator.processDeliveryJob.mockRejectedValue(new Error('Persistent failure'))

      const result = await deliveryEngine.processJobWithRetry(job)

      expect(result.success).toBe(false)
      expect(mockOrchestrator.processDeliveryJob).toHaveBeenCalledTimes(3) // Default max attempts
    })
  })

  describe('Performance Metrics', () => {
    it('should track processing latency', async () => {
      const job = {
        notificationId: 'notif-123',
        userId: 'user-123',
        channels: ['email'],
        content: { title: 'Test', body: 'Test message' },
        priority: 'medium' as const,
        metadata: {},
      }

      mockOrchestrator.processDeliveryJob.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
        return {
          success: true,
          results: [{ channel: 'email', success: true, messageId: 'msg-123', deliveredAt: new Date() }],
        }
      })

      await deliveryEngine.processJob(job)

      expect(mockAnalytics.recordLatency).toHaveBeenCalledWith(
        'delivery_processing_time',
        expect.any(Number)
      )
    })

    it('should increment success/failure metrics', async () => {
      const job = {
        notificationId: 'notif-123',
        userId: 'user-123',
        channels: ['email'],
        content: { title: 'Test', body: 'Test message' },
        priority: 'medium' as const,
        metadata: {},
      }

      mockOrchestrator.processDeliveryJob.mockResolvedValue({
        success: true,
        results: [{ channel: 'email', success: true, messageId: 'msg-123', deliveredAt: new Date() }],
      })

      await deliveryEngine.processJob(job)

      expect(mockAnalytics.incrementMetric).toHaveBeenCalledWith('deliveries_successful')
    })
  })

  describe('Graceful Shutdown', () => {
    it('should handle shutdown gracefully', async () => {
      const shutdownPromise = deliveryEngine.shutdown()

      // Should complete without hanging
      await expect(shutdownPromise).resolves.toBeUndefined()
    })

    it('should wait for active jobs to complete during shutdown', async () => {
      const job = {
        notificationId: 'notif-123',
        userId: 'user-123',
        channels: ['email'],
        content: { title: 'Test', body: 'Test message' },
        priority: 'medium' as const,
        metadata: {},
      }

      let jobCompleted = false

      mockOrchestrator.processDeliveryJob.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 200))
        jobCompleted = true
        return {
          success: true,
          results: [{ channel: 'email', success: true, messageId: 'msg-123', deliveredAt: new Date() }],
        }
      })

      // Start processing job
      const jobPromise = deliveryEngine.processJob(job)

      // Start shutdown
      const shutdownPromise = deliveryEngine.shutdown()

      // Wait for both to complete
      await Promise.all([jobPromise, shutdownPromise])

      expect(jobCompleted).toBe(true)
    })
  })
})