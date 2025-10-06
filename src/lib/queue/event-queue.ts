import { EventEmitter } from 'events'
import { Queue, Job, QueueOptions, Worker, WorkerOptions } from 'bullmq'
import { Redis } from 'ioredis'
import { logger } from '@/lib/logger'
import { RealtimeEvent } from '@/services/matching/realtime-processor'

export interface EventQueueOptions {
  redis: Redis | { host: string; port: number; password?: string }
  defaultJobOptions?: QueueOptions['defaultJobOptions']
  concurrency?: number
  maxRetries?: number
  retryDelay?: number
  removeOnComplete?: number
  removeOnFail?: number
}

export interface QueuedEvent extends RealtimeEvent {
  queueName: string
  priority: number
  delay?: number
  attempts: number
  maxAttempts: number
}

export interface EventJobData {
  event: QueuedEvent
  processingOptions: {
    timeout?: number
    retries?: number
    backoff?: 'fixed' | 'exponential'
  }
}

export class EventQueueManager extends EventEmitter {
  private queues: Map<string, Queue> = new Map()
  private workers: Map<string, Worker> = new Map()
  private redis: Redis
  private options: Required<EventQueueOptions>
  private isShuttingDown: boolean = false

  constructor(options: EventQueueOptions) {
    super()

    this.options = {
      concurrency: 10,
      maxRetries: 3,
      retryDelay: 5000,
      removeOnComplete: 100,
      removeOnFail: 50,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: 'exponential'
      },
      ...options
    }

    this.redis = options.redis instanceof Redis
      ? options.redis
      : new Redis(options.redis)

    this.setupQueues()
    this.setupWorkers()
    this.setupErrorHandling()
  }

  /**
   * Setup standard queues
   */
  private setupQueues(): void {
    const queueConfigs = [
      {
        name: 'high-priority-events',
        defaultJobOptions: { ...this.options.defaultJobOptions, priority: 10 }
      },
      {
        name: 'normal-events',
        defaultJobOptions: { ...this.options.defaultJobOptions, priority: 5 }
      },
      {
        name: 'low-priority-events',
        defaultJobOptions: { ...this.options.defaultJobOptions, priority: 1 }
      },
      {
        name: 'scheduled-events',
        defaultJobOptions: { ...this.options.defaultJobOptions, delay: 0 }
      },
      {
        name: 'failed-events',
        defaultJobOptions: { ...this.options.defaultJobOptions, attempts: 1 }
      }
    ]

    queueConfigs.forEach(config => {
      const queue = new Queue(config.name, {
        connection: this.redis,
        defaultJobOptions: config.defaultJobOptions
      })

      this.queues.set(config.name, queue)

      // Setup queue event listeners
      queue.on('error', (error) => {
        logger.error(`Queue ${config.name} error`, { error })
      })

      queue.on('waiting', (job) => {
        logger.debug(`Job ${job.id} waiting in queue ${config.name}`)
      })

      queue.on('active', (job) => {
        logger.debug(`Job ${job.id} active in queue ${config.name}`)
      })

      queue.on('completed', (job) => {
        logger.debug(`Job ${job.id} completed in queue ${config.name}`)
        this.emit('job_completed', { queueName: config.name, job })
      })

      queue.on('failed', (job, error) => {
        logger.error(`Job ${job.id} failed in queue ${config.name}`, { error })
        this.emit('job_failed', { queueName: config.name, job, error })
      })

      queue.on('stalled', (job) => {
        logger.warn(`Job ${job.id} stalled in queue ${config.name}`)
        this.emit('job_stalled', { queueName: config.name, job })
      })
    })

    logger.info('Event queues setup complete', {
      queueCount: this.queues.size,
      queueNames: Array.from(this.queues.keys())
    })
  }

  /**
   * Setup workers for processing queues
   */
  private setupWorkers(): void {
    const workerOptions: WorkerOptions = {
      connection: this.redis,
      concurrency: this.options.concurrency,
      removeOnComplete: this.options.removeOnComplete,
      removeOnFail: this.options.removeOnFail
    }

    // Create workers for each queue
    this.queues.forEach((queue, queueName) => {
      const worker = new Worker(
        queueName,
        async (job: Job<EventJobData>) => {
          return this.processJob(job)
        },
        workerOptions
      )

      this.workers.set(queueName, worker)

      // Setup worker event listeners
      worker.on('error', (error) => {
        logger.error(`Worker for ${queueName} error`, { error })
      })

      worker.on('completed', (job) => {
        logger.debug(`Worker completed job ${job.id} for ${queueName}`)
      })

      worker.on('failed', (job, error) => {
        logger.error(`Worker failed job ${job.id} for ${queueName}`, { error })
      })
    })

    logger.info('Event workers setup complete', {
      workerCount: this.workers.size,
      workerNames: Array.from(this.workers.keys())
    })
  }

  /**
   * Process a job from the queue
   */
  private async processJob(job: Job<EventJobData>): Promise<any> {
    const { event, processingOptions } = job.data

    logger.info('Processing queued event', {
      jobId: job.id,
      eventId: event.id,
      eventType: event.type,
      queueName: job.queueName,
      attempt: job.attemptsMade + 1
    })

    try {
      // Set processing timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Job timeout')), processingOptions.timeout || 30000)
      })

      // Process the event
      const processingPromise = this.processEvent(event)

      // Race between processing and timeout
      const result = await Promise.race([processingPromise, timeoutPromise])

      logger.info('Event processed successfully', {
        eventId: event.id,
        jobId: job.id,
        processingTime: Date.now() - job.timestamp
      })

      return result
    } catch (error) {
      logger.error('Event processing failed', {
        eventId: event.id,
        jobId: job.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        attempt: job.attemptsMade + 1
      })

      // Decide whether to retry or move to failed queue
      if (job.attemptsMade < event.maxAttempts) {
        throw error // Let BullMQ handle retry
      } else {
        // Move to failed queue
        await this.moveToFailedQueue(event, error)
        return { success: false, error: error.message }
      }
    }
  }

  /**
   * Process the actual event
   */
  private async processEvent(event: QueuedEvent): Promise<any> {
    // This would integrate with your event processing logic
    switch (event.type) {
      case 'profile_update':
        return this.processProfileUpdate(event)
      case 'job_posted':
        return this.processJobPosted(event)
      case 'application_submitted':
        return this.processApplicationSubmitted(event)
      case 'match_created':
        return this.processMatchCreated(event)
      case 'feedback_received':
        return this.processFeedbackReceived(event)
      default:
        logger.warn('Unknown event type in queue', {
          eventId: event.id,
          eventType: event.type
        })
        return { success: false, error: 'Unknown event type' }
    }
  }

  /**
   * Queue an event for processing
   */
  public async queueEvent(
    event: Omit<RealtimeEvent, 'id'>,
    options: {
      priority?: 'high' | 'normal' | 'low'
      delay?: number
      queueName?: string
    } = {}
  ): Promise<string> {
    const queuedEvent: QueuedEvent = {
      ...event,
      id: this.generateEventId(),
      queueName: options.queueName || this.getQueueName(options.priority || 'normal'),
      priority: this.getPriorityValue(options.priority || 'normal'),
      delay: options.delay,
      attempts: 0,
      maxAttempts: this.options.maxRetries
    }

    const queue = this.queues.get(queuedEvent.queueName)
    if (!queue) {
      throw new Error(`Queue ${queuedEvent.queueName} not found`)
    }

    const job = await queue.add(
      'process-event',
      {
        event: queuedEvent,
        processingOptions: {
          timeout: 30000,
          retries: this.options.maxRetries,
          backoff: 'exponential'
        }
      },
      {
        priority: queuedEvent.priority,
        delay: queuedEvent.delay,
        attempts: queuedEvent.maxAttempts
      }
    )

    logger.info('Event queued', {
      eventId: queuedEvent.id,
      jobId: job.id,
      queueName: queuedEvent.queueName,
      priority: queuedEvent.priority,
      delay: queuedEvent.delay
    })

    this.emit('event_queued', { event: queuedEvent, jobId: job.id })
    return job.id!
  }

  /**
   * Get queue name based on priority
   */
  private getQueueName(priority: string): string {
    switch (priority) {
      case 'high':
        return 'high-priority-events'
      case 'low':
        return 'low-priority-events'
      default:
        return 'normal-events'
    }
  }

  /**
   * Get numeric priority value
   */
  private getPriorityValue(priority: string): number {
    switch (priority) {
      case 'high':
        return 10
      case 'low':
        return 1
      default:
        return 5
    }
  }

  /**
   * Move failed event to failed queue
   */
  private async moveToFailedQueue(event: QueuedEvent, error: any): Promise<void> {
    const failedQueue = this.queues.get('failed-events')
    if (!failedQueue) return

    await failedQueue.add(
      'failed-event',
      {
        event: { ...event, attempts: event.maxAttempts },
        processingOptions: { timeout: 10000 },
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date()
        }
      },
      {
        priority: 0,
        attempts: 1
      }
    )

    logger.error('Event moved to failed queue', {
      eventId: event.id,
      error: error.message
    })
  }

  /**
   * Schedule delayed event
   */
  public async scheduleEvent(
    event: Omit<RealtimeEvent, 'id'>,
    delayMs: number
  ): Promise<string> {
    return this.queueEvent(event, {
      delay: delayMs,
      queueName: 'scheduled-events'
    })
  }

  /**
   * Get queue statistics
   */
  public async getQueueStats(): Promise<Record<string, any>> {
    const stats: Record<string, any> = {}

    for (const [queueName, queue] of this.queues) {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaiting(),
        queue.getActive(),
        queue.getCompleted(),
        queue.getFailed(),
        queue.getDelayed()
      ])

      stats[queueName] = {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
        total: waiting.length + active.length + completed.length + failed.length + delayed.length
      }
    }

    return stats
  }

  /**
   * Get worker statistics
   */
  public getWorkerStats(): Record<string, any> {
    const stats: Record<string, any> = {}

    for (const [queueName, worker] of this.workers) {
      stats[queueName] = {
        running: worker.isRunning(),
        concurrency: worker.opts.concurrency || 0
      }
    }

    return stats
  }

  /**
   * Pause a queue
   */
  public async pauseQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName)
    if (queue) {
      await queue.pause()
      logger.info(`Queue ${queueName} paused`)
    }
  }

  /**
   * Resume a queue
   */
  public async resumeQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName)
    if (queue) {
      await queue.resume()
      logger.info(`Queue ${queueName} resumed`)
    }
  }

  /**
   * Clear a queue
   */
  public async clearQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName)
    if (queue) {
      await queue.drain()
      logger.info(`Queue ${queueName} cleared`)
    }
  }

  /**
   * Retry failed events
   */
  public async retryFailedEvents(limit: number = 100): Promise<number> {
    const failedQueue = this.queues.get('failed-events')
    if (!failedQueue) return 0

    const failedJobs = await failedQueue.getFailed(0, limit - 1)
    let retriedCount = 0

    for (const job of failedJobs) {
      try {
        const eventData = job.data.event
        await this.queueEvent(eventData, {
          priority: eventData.priority > 7 ? 'high' : 'normal'
        })
        await job.remove()
        retriedCount++
      } catch (error) {
        logger.error('Error retrying failed event', {
          jobId: job.id,
          error
        })
      }
    }

    logger.info('Retried failed events', { retriedCount, total: failedJobs.length })
    return retriedCount
  }

  // Event processing methods
  private async processProfileUpdate(event: QueuedEvent): Promise<any> {
    logger.info('Processing profile update event', { eventId: event.id })
    // Implement your profile update processing logic
    return { success: true, processedAt: new Date() }
  }

  private async processJobPosted(event: QueuedEvent): Promise<any> {
    logger.info('Processing job posted event', { eventId: event.id })
    // Implement your job posting processing logic
    return { success: true, processedAt: new Date() }
  }

  private async processApplicationSubmitted(event: QueuedEvent): Promise<any> {
    logger.info('Processing application submitted event', { eventId: event.id })
    // Implement your application processing logic
    return { success: true, processedAt: new Date() }
  }

  private async processMatchCreated(event: QueuedEvent): Promise<any> {
    logger.info('Processing match created event', { eventId: event.id })
    // Implement your match processing logic
    return { success: true, processedAt: new Date() }
  }

  private async processFeedbackReceived(event: QueuedEvent): Promise<any> {
    logger.info('Processing feedback received event', { eventId: event.id })
    // Implement your feedback processing logic
    return { success: true, processedAt: new Date() }
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception in EventQueueManager', { error })
    })

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection in EventQueueManager', { reason, promise })
    })

    // Handle Redis connection errors
    this.redis.on('error', (error) => {
      logger.error('Redis connection error', { error })
    })

    this.redis.on('connect', () => {
      logger.info('Redis connected')
    })

    this.redis.on('disconnect', () => {
      logger.warn('Redis disconnected')
    })
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Graceful shutdown
   */
  public async shutdown(): Promise<void> {
    if (this.isShuttingDown) return

    this.isShuttingDown = true
    logger.info('Shutting down EventQueueManager')

    try {
      // Close all workers
      const workerClosePromises = Array.from(this.workers.values()).map(worker =>
        worker.close().catch(error => {
          logger.error('Error closing worker', { error })
        })
      )

      await Promise.all(workerClosePromises)
      logger.info('All workers closed')

      // Close all queues
      const queueClosePromises = Array.from(this.queues.values()).map(queue =>
        queue.close().catch(error => {
          logger.error('Error closing queue', { error })
        })
      )

      await Promise.all(queueClosePromises)
      logger.info('All queues closed')

      // Close Redis connection
      await this.redis.quit()
      logger.info('Redis connection closed')

    } catch (error) {
      logger.error('Error during shutdown', { error })
    } finally {
      this.removeAllListeners()
      logger.info('EventQueueManager shutdown complete')
    }
  }

  /**
   * Health check
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy'
    details: Record<string, any>
  }> {
    try {
      const queueStats = await this.getQueueStats()
      const workerStats = this.getWorkerStats()

      // Check Redis connection
      await this.redis.ping()

      const details = {
        redis: 'connected',
        queues: queueStats,
        workers: workerStats,
        uptime: process.uptime()
      }

      return {
        status: 'healthy',
        details
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }
  }
}