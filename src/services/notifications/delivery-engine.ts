import { EventEmitter } from 'events'
import { db } from '@/lib/db'
import { redis } from '@/lib/redis'
import { EventQueueManager } from '@/lib/queue/event-queue'
import { logger } from '@/lib/logger'

/**
 * Delivery job structure
 */
export interface DeliveryJob {
  id: string
  notificationId: string
  userId: string
  channel: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  payload: Record<string, any>
  attempts: number
  maxAttempts: number
  scheduledFor?: Date
  createdAt: Date
  metadata?: Record<string, any>
}

/**
 * Batch delivery configuration
 */
interface BatchConfig {
  size: number
  timeoutMs: number
  channel: string
  priority: string
}

/**
 * Delivery result
 */
export interface DeliveryResult {
  jobId: string
  success: boolean
  messageId?: string
  error?: string
  deliveredAt: Date
  metadata?: Record<string, any>
}

/**
 * Performance metrics
 */
interface PerformanceMetrics {
  totalJobs: number
  successfulJobs: number
  failedJobs: number
  averageDeliveryTime: number
  throughputPerSecond: number
  queueDepth: number
  activeWorkers: number
}

/**
 * Delivery Engine Service
 * 
 * High-performance delivery execution engine with batch processing,
 * real-time delivery, load balancing, and comprehensive monitoring.
 */
export class DeliveryEngine extends EventEmitter {
  private static instance: DeliveryEngine
  private queueManager: EventQueueManager
  private isInitialized = false
  private isRunning = false
  
  // Batch processing
  private batchQueues: Map<string, DeliveryJob[]> = new Map()
  private batchTimers: Map<string, NodeJS.Timeout> = new Map()
  private batchConfigs: Map<string, BatchConfig> = new Map()
  
  // Performance tracking
  private metrics: PerformanceMetrics = {
    totalJobs: 0,
    successfulJobs: 0,
    failedJobs: 0,
    averageDeliveryTime: 0,
    throughputPerSecond: 0,
    queueDepth: 0,
    activeWorkers: 0
  }
  
  private deliveryTimes: number[] = []
  private lastMetricsUpdate = Date.now()
  private activeJobs = new Set<string>()

  private constructor() {
    super()
    this.queueManager = new EventQueueManager({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD
      }
    })
    this.setupBatchConfigs()
  }

  public static getInstance(): DeliveryEngine {
    if (!DeliveryEngine.instance) {
      DeliveryEngine.instance = new DeliveryEngine()
    }
    return DeliveryEngine.instance
  }

  /**
   * Initialize the delivery engine
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Initialize queue manager
      await this.queueManager.initialize()

      // Setup event listeners
      this.setupEventListeners()

      // Start metrics collection
      this.startMetricsCollection()

      this.isInitialized = true
      logger.info('Delivery Engine initialized successfully')
    } catch (error) {
      logger.error('Failed to initialize Delivery Engine:', error)
      throw error
    }
  }

  /**
   * Start the delivery engine
   */
  public async start(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Delivery Engine must be initialized before starting')
    }

    if (this.isRunning) return

    this.isRunning = true
    logger.info('Delivery Engine started')

    // Emit start event
    this.emit('engine_started')
  }

  /**
   * Stop the delivery engine
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) return

    this.isRunning = false

    // Clear all batch timers
    this.batchTimers.forEach(timer => clearTimeout(timer))
    this.batchTimers.clear()

    // Wait for active jobs to complete
    await this.waitForActiveJobs()

    logger.info('Delivery Engine stopped')
    this.emit('engine_stopped')
  }

  /**
   * Queue a delivery job for processing
   */
  public async queueDelivery(job: Omit<DeliveryJob, 'id' | 'createdAt'>): Promise<string> {
    const deliveryJob: DeliveryJob = {
      ...job,
      id: `delivery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    }

    // Determine processing strategy based on priority and channel
    if (this.shouldUseBatchProcessing(deliveryJob)) {
      await this.addToBatch(deliveryJob)
    } else {
      await this.processImmediately(deliveryJob)
    }

    this.metrics.totalJobs++
    this.updateQueueDepth()

    logger.debug(`Delivery job queued: ${deliveryJob.id}`, {
      channel: deliveryJob.channel,
      priority: deliveryJob.priority,
      userId: deliveryJob.userId
    })

    return deliveryJob.id
  }

  /**
   * Process multiple delivery jobs in batch
   */
  public async queueBatchDelivery(jobs: Omit<DeliveryJob, 'id' | 'createdAt'>[]): Promise<string[]> {
    const deliveryJobs = jobs.map(job => ({
      ...job,
      id: `delivery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    }))

    // Group jobs by channel and priority for optimal batch processing
    const groupedJobs = this.groupJobsForBatching(deliveryJobs)

    const jobIds: string[] = []

    for (const [key, jobGroup] of groupedJobs) {
      const [channel, priority] = key.split(':')
      
      if (this.shouldUseBatchProcessing(jobGroup[0])) {
        // Add to batch queue
        for (const job of jobGroup) {
          await this.addToBatch(job)
          jobIds.push(job.id)
        }
      } else {
        // Process immediately
        const immediatePromises = jobGroup.map(job => this.processImmediately(job))
        await Promise.allSettled(immediatePromises)
        jobIds.push(...jobGroup.map(job => job.id))
      }
    }

    this.metrics.totalJobs += deliveryJobs.length
    this.updateQueueDepth()

    logger.info(`Batch delivery queued: ${jobIds.length} jobs`)
    return jobIds
  }

  /**
   * Get delivery job status
   */
  public async getJobStatus(jobId: string): Promise<any> {
    // Check if job is in active processing
    if (this.activeJobs.has(jobId)) {
      return { status: 'processing', jobId }
    }

    // Check batch queues
    for (const [batchKey, jobs] of this.batchQueues) {
      const job = jobs.find(j => j.id === jobId)
      if (job) {
        return { status: 'batched', jobId, batchKey, position: jobs.indexOf(job) }
      }
    }

    // Check database for completed jobs
    const deliveryLog = await db.notificationDeliveryLog.findFirst({
      where: { 
        OR: [
          { providerMessageId: jobId },
          { metadata: { path: ['jobId'], equals: jobId } }
        ]
      }
    })

    if (deliveryLog) {
      return {
        status: deliveryLog.status,
        jobId,
        deliveredAt: deliveryLog.deliveredAt,
        error: deliveryLog.errorMessage
      }
    }

    return { status: 'not_found', jobId }
  }

  /**
   * Determine if job should use batch processing
   */
  private shouldUseBatchProcessing(job: DeliveryJob): boolean {
    // High priority jobs are processed immediately
    if (job.priority === 'urgent' || job.priority === 'high') {
      return false
    }

    // Scheduled jobs are processed immediately when their time comes
    if (job.scheduledFor && job.scheduledFor > new Date()) {
      return false
    }

    // Email and SMS can benefit from batch processing
    return ['email', 'sms'].includes(job.channel)
  }

  /**
   * Add job to batch queue
   */
  private async addToBatch(job: DeliveryJob): Promise<void> {
    const batchKey = `${job.channel}:${job.priority}`
    
    if (!this.batchQueues.has(batchKey)) {
      this.batchQueues.set(batchKey, [])
    }

    const batch = this.batchQueues.get(batchKey)!
    batch.push(job)

    const config = this.batchConfigs.get(batchKey)
    if (!config) return

    // Check if batch is ready for processing
    if (batch.length >= config.size) {
      await this.processBatch(batchKey)
    } else {
      // Set or reset batch timer
      if (this.batchTimers.has(batchKey)) {
        clearTimeout(this.batchTimers.get(batchKey)!)
      }

      const timer = setTimeout(() => {
        this.processBatch(batchKey)
      }, config.timeoutMs)

      this.batchTimers.set(batchKey, timer)
    }
  }

  /**
   * Process a batch of jobs
   */
  private async processBatch(batchKey: string): Promise<void> {
    const batch = this.batchQueues.get(batchKey)
    if (!batch || batch.length === 0) return

    // Clear timer
    if (this.batchTimers.has(batchKey)) {
      clearTimeout(this.batchTimers.get(batchKey)!)
      this.batchTimers.delete(batchKey)
    }

    // Take all jobs from batch
    const jobs = batch.splice(0)
    
    logger.info(`Processing batch: ${batchKey}`, { jobCount: jobs.length })

    // Process jobs in parallel with concurrency control
    const concurrency = this.getConcurrencyLimit(batchKey)
    await this.processJobsConcurrently(jobs, concurrency)

    this.emit('batch_processed', { batchKey, jobCount: jobs.length })
  }

  /**
   * Process jobs with controlled concurrency
   */
  private async processJobsConcurrently(jobs: DeliveryJob[], concurrency: number): Promise<void> {
    const results: Promise<void>[] = []
    
    for (let i = 0; i < jobs.length; i += concurrency) {
      const batch = jobs.slice(i, i + concurrency)
      const batchPromises = batch.map(job => this.executeDeliveryJob(job))
      
      results.push(...batchPromises)
      
      // Wait for this batch to complete before starting the next
      await Promise.allSettled(batchPromises)
    }

    await Promise.allSettled(results)
  }

  /**
   * Process job immediately
   */
  private async processImmediately(job: DeliveryJob): Promise<void> {
    if (job.scheduledFor && job.scheduledFor > new Date()) {
      // Schedule for future processing
      const delay = job.scheduledFor.getTime() - Date.now()
      
      await this.queueManager.queueEvent({
        type: 'scheduled_delivery',
        data: { job },
        priority: job.priority,
        delay
      })
      
      return
    }

    await this.executeDeliveryJob(job)
  }

  /**
   * Execute a single delivery job
   */
  private async executeDeliveryJob(job: DeliveryJob): Promise<void> {
    const startTime = Date.now()
    this.activeJobs.add(job.id)
    this.metrics.activeWorkers++

    try {
      logger.debug(`Executing delivery job: ${job.id}`)

      // Get channel service from orchestrator or registry
      const result = await this.deliverToChannel(job)

      // Record successful delivery
      await this.recordDeliveryResult(job, result)
      
      this.metrics.successfulJobs++
      this.recordDeliveryTime(Date.now() - startTime)

      this.emit('job_completed', { job, result })
      
      logger.debug(`Delivery job completed: ${job.id}`, { 
        channel: job.channel,
        deliveryTime: Date.now() - startTime
      })

    } catch (error) {
      logger.error(`Delivery job failed: ${job.id}`, error)

      // Handle retry logic
      if (job.attempts < job.maxAttempts) {
        await this.retryJob(job, error)
      } else {
        await this.recordDeliveryFailure(job, error)
        this.metrics.failedJobs++
        this.emit('job_failed', { job, error })
      }
    } finally {
      this.activeJobs.delete(job.id)
      this.metrics.activeWorkers--
    }
  }

  /**
   * Deliver to specific channel (placeholder - would integrate with channel services)
   */
  private async deliverToChannel(job: DeliveryJob): Promise<DeliveryResult> {
    // This would integrate with the actual channel services
    // For now, simulate delivery
    
    const deliveryTime = Math.random() * 1000 + 100 // 100-1100ms
    await new Promise(resolve => setTimeout(resolve, deliveryTime))

    // Simulate occasional failures
    if (Math.random() < 0.05) { // 5% failure rate
      throw new Error(`Simulated delivery failure for channel: ${job.channel}`)
    }

    return {
      jobId: job.id,
      success: true,
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      deliveredAt: new Date(),
      metadata: {
        channel: job.channel,
        deliveryTime
      }
    }
  }

  /**
   * Retry failed job with exponential backoff
   */
  private async retryJob(job: DeliveryJob, error: any): Promise<void> {
    const retryJob: DeliveryJob = {
      ...job,
      attempts: job.attempts + 1,
      scheduledFor: new Date(Date.now() + this.calculateBackoffDelay(job.attempts))
    }

    await this.queueDelivery(retryJob)
    
    logger.info(`Job ${job.id} scheduled for retry ${job.attempts + 1}/${job.maxAttempts}`)
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoffDelay(attempts: number): number {
    const baseDelay = 1000 // 1 second
    const maxDelay = 300000 // 5 minutes
    const delay = Math.min(baseDelay * Math.pow(2, attempts), maxDelay)
    
    // Add jitter to prevent thundering herd
    return delay + Math.random() * 1000
  }

  /**
   * Record successful delivery result
   */
  private async recordDeliveryResult(job: DeliveryJob, result: DeliveryResult): Promise<void> {
    try {
      await db.notificationDeliveryLog.create({
        data: {
          notificationId: job.notificationId,
          channel: job.channel,
          status: 'delivered',
          providerMessageId: result.messageId,
          attemptedAt: job.createdAt,
          deliveredAt: result.deliveredAt,
          metadata: {
            jobId: job.id,
            attempts: job.attempts,
            ...result.metadata
          }
        }
      })
    } catch (error) {
      logger.error('Failed to record delivery result:', error)
    }
  }

  /**
   * Record delivery failure
   */
  private async recordDeliveryFailure(job: DeliveryJob, error: any): Promise<void> {
    try {
      await db.notificationDeliveryLog.create({
        data: {
          notificationId: job.notificationId,
          channel: job.channel,
          status: 'failed',
          errorMessage: error.message,
          attemptedAt: job.createdAt,
          metadata: {
            jobId: job.id,
            attempts: job.attempts,
            maxAttempts: job.maxAttempts
          }
        }
      })
    } catch (logError) {
      logger.error('Failed to record delivery failure:', logError)
    }
  }

  /**
   * Group jobs for optimal batch processing
   */
  private groupJobsForBatching(jobs: DeliveryJob[]): Map<string, DeliveryJob[]> {
    const groups = new Map<string, DeliveryJob[]>()

    jobs.forEach(job => {
      const key = `${job.channel}:${job.priority}`
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(job)
    })

    return groups
  }

  /**
   * Get concurrency limit for batch processing
   */
  private getConcurrencyLimit(batchKey: string): number {
    const [channel] = batchKey.split(':')
    
    const limits: Record<string, number> = {
      email: 10,
      sms: 5,
      push: 20,
      in_app: 50,
      web: 30
    }

    return limits[channel] || 10
  }

  /**
   * Setup batch configurations
   */
  private setupBatchConfigs(): void {
    const configs: BatchConfig[] = [
      { channel: 'email', priority: 'normal', size: 50, timeoutMs: 30000 },
      { channel: 'email', priority: 'low', size: 100, timeoutMs: 60000 },
      { channel: 'sms', priority: 'normal', size: 20, timeoutMs: 15000 },
      { channel: 'sms', priority: 'low', size: 50, timeoutMs: 30000 },
      { channel: 'push', priority: 'normal', size: 100, timeoutMs: 10000 },
      { channel: 'push', priority: 'low', size: 200, timeoutMs: 30000 }
    ]

    configs.forEach(config => {
      const key = `${config.channel}:${config.priority}`
      this.batchConfigs.set(key, config)
    })
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    this.queueManager.on('job_completed', async (data) => {
      if (data.job.name === 'scheduled_delivery') {
        const { job } = data.job.data.event.data
        await this.executeDeliveryJob(job)
      }
    })
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    setInterval(() => {
      this.updateMetrics()
    }, 10000) // Update every 10 seconds
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(): void {
    const now = Date.now()
    const timeDiff = (now - this.lastMetricsUpdate) / 1000

    // Calculate throughput
    this.metrics.throughputPerSecond = this.metrics.totalJobs / timeDiff

    // Calculate average delivery time
    if (this.deliveryTimes.length > 0) {
      this.metrics.averageDeliveryTime = 
        this.deliveryTimes.reduce((sum, time) => sum + time, 0) / this.deliveryTimes.length
      
      // Keep only recent delivery times (last 1000)
      if (this.deliveryTimes.length > 1000) {
        this.deliveryTimes = this.deliveryTimes.slice(-1000)
      }
    }

    this.updateQueueDepth()
    this.lastMetricsUpdate = now

    this.emit('metrics_updated', this.metrics)
  }

  /**
   * Update queue depth metric
   */
  private updateQueueDepth(): void {
    let totalDepth = 0
    this.batchQueues.forEach(batch => {
      totalDepth += batch.length
    })
    this.metrics.queueDepth = totalDepth + this.activeJobs.size
  }

  /**
   * Record delivery time for metrics
   */
  private recordDeliveryTime(time: number): void {
    this.deliveryTimes.push(time)
  }

  /**
   * Wait for all active jobs to complete
   */
  private async waitForActiveJobs(timeoutMs = 30000): Promise<void> {
    const startTime = Date.now()
    
    while (this.activeJobs.size > 0 && (Date.now() - startTime) < timeoutMs) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    if (this.activeJobs.size > 0) {
      logger.warn(`Timeout waiting for ${this.activeJobs.size} active jobs to complete`)
    }
  }

  /**
   * Get engine performance metrics
   */
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  /**
   * Get detailed engine status
   */
  public async getStatus(): Promise<Record<string, any>> {
    const queueStats = await this.queueManager.getQueueStats()
    
    return {
      isInitialized: this.isInitialized,
      isRunning: this.isRunning,
      metrics: this.metrics,
      batchQueues: Object.fromEntries(
        Array.from(this.batchQueues.entries()).map(([key, jobs]) => [key, jobs.length])
      ),
      activeJobs: this.activeJobs.size,
      queueStats
    }
  }

  /**
   * Shutdown the delivery engine gracefully
   */
  public async shutdown(): Promise<void> {
    logger.info('Shutting down Delivery Engine...')
    
    await this.stop()
    await this.queueManager.shutdown()
    
    this.removeAllListeners()
    this.isInitialized = false
    
    logger.info('Delivery Engine shutdown complete')
  }
}

export default DeliveryEngine