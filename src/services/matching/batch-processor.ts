import { EventEmitter } from 'events'
import { PrismaClient } from '@prisma/client'
import { logger } from '@/lib/logger'
import { MatchingCoreService } from '@/services/matching/matching-core'
import { RecommendationEngine } from '@/services/matching/recommendation-engine'
import { EmbeddingService } from '@/services/matching/embedding-service'

export interface BatchJob {
  id: string
  type: 'matching' | 'recommendations' | 'embeddings' | 'cleanup' | 'analytics'
  name: string
  description?: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  progress: {
    current: number
    total: number
    percentage: number
  }
  parameters: Record<string, any>
  results: {
    processed: number
    successful: number
    failed: number
    errors: Array<{ item: string; error: string }>
    warnings: string[]
  }
  timing: {
    createdAt: Date
    startedAt?: Date
    completedAt?: Date
    estimatedDuration?: number
    actualDuration?: number
  }
  metadata: {
    createdBy?: string
    tags?: string[]
    retryCount?: number
    maxRetries?: number
  }
}

export interface BatchProcessingOptions {
  maxConcurrentJobs: number
  batchSize: number
  retryAttempts: number
  retryDelay: number
  progressUpdateInterval: number
  enablePersistence: boolean
  jobTimeout: number
}

export interface BatchJobDefinition {
  type: BatchJob['type']
  name: string
  description?: string
  defaultPriority?: BatchJob['priority']
  defaultParameters?: Record<string, any>
  estimatedDuration?: number
  handler: (job: BatchJob) => Promise<BatchJob['results']>
}

export class BatchProcessor extends EventEmitter {
  private prisma: PrismaClient
  private matchingCore: MatchingCoreService
  private recommendationEngine: RecommendationEngine
  private embeddingService: EmbeddingService
  private options: BatchProcessingOptions
  private jobQueue: BatchJob[] = []
  private runningJobs: Map<string, BatchJob> = new Map()
  private completedJobs: Map<string, BatchJob> = new Map()
  private jobDefinitions: Map<string, BatchJobDefinition> = new Map()
  private isProcessing: boolean = false
  private processingInterval: NodeJS.Timeout | null = null

  constructor(
    prisma: PrismaClient,
    options: Partial<BatchProcessingOptions> = {}
  ) {
    super()

    this.prisma = prisma
    this.matchingCore = new MatchingCoreService()
    this.recommendationEngine = new RecommendationEngine()
    this.embeddingService = new EmbeddingService()

    this.options = {
      maxConcurrentJobs: 5,
      batchSize: 1000,
      retryAttempts: 3,
      retryDelay: 5000,
      progressUpdateInterval: 10000, // 10 seconds
      enablePersistence: true,
      jobTimeout: 3600000, // 1 hour
      ...options
    }

    this.registerDefaultJobDefinitions()
    this.startProcessing()
    this.setupErrorHandling()
  }

  /**
   * Create a new batch job
   */
  public async createJob(
    type: BatchJob['type'],
    name: string,
    parameters: Record<string, any> = {},
    options: {
      priority?: BatchJob['priority']
      description?: string
      tags?: string[]
      maxRetries?: number
      createdBy?: string
    } = {}
  ): Promise<string> {
    const job: BatchJob = {
      id: this.generateJobId(),
      type,
      name,
      description: options.description,
      priority: options.priority || 'medium',
      status: 'pending',
      progress: { current: 0, total: 0, percentage: 0 },
      parameters,
      results: {
        processed: 0,
        successful: 0,
        failed: 0,
        errors: [],
        warnings: []
      },
      timing: {
        createdAt: new Date()
      },
      metadata: {
        createdBy: options.createdBy,
        tags: options.tags,
        retryCount: 0,
        maxRetries: options.maxRetries || this.options.retryAttempts
      }
    }

    // Add to queue
    this.jobQueue.push(job)
    this.sortJobQueue()

    // Persist job if enabled
    if (this.options.enablePersistence) {
      await this.persistJob(job)
    }

    this.emit('job_created', job)
    logger.info('Batch job created', {
      jobId: job.id,
      type,
      name,
      priority: job.priority
    })

    return job.id
  }

  /**
   * Get job status
   */
  public getJob(jobId: string): BatchJob | null {
    // Check running jobs first
    const running = this.runningJobs.get(jobId)
    if (running) return running

    // Check queue
    const queued = this.jobQueue.find(job => job.id === jobId)
    if (queued) return queued

    // Check completed jobs
    const completed = this.completedJobs.get(jobId)
    if (completed) return completed

    return null
  }

  /**
   * Get all jobs
   */
  public getAllJobs(): {
    pending: BatchJob[]
    running: BatchJob[]
    completed: BatchJob[]
  } {
    return {
      pending: [...this.jobQueue],
      running: Array.from(this.runningJobs.values()),
      completed: Array.from(this.completedJobs.values())
    }
  }

  /**
   * Cancel a job
   */
  public async cancelJob(jobId: string): Promise<boolean> {
    // Check if job is in queue
    const queueIndex = this.jobQueue.findIndex(job => job.id === jobId)
    if (queueIndex >= 0) {
      const job = this.jobQueue.splice(queueIndex, 1)[0]
      job.status = 'cancelled'
      job.timing.completedAt = new Date()
      this.completedJobs.set(jobId, job)

      if (this.options.enablePersistence) {
        await this.updatePersistedJob(job)
      }

      this.emit('job_cancelled', job)
      logger.info('Batch job cancelled', { jobId, name: job.name })
      return true
    }

    // Check if job is running
    const running = this.runningJobs.get(jobId)
    if (running) {
      running.status = 'cancelled'
      // Note: Actually stopping a running job would require more complex implementation
      this.emit('job_cancelled', running)
      logger.info('Running batch job cancelled', { jobId, name: running.name })
      return true
    }

    return false
  }

  /**
   * Retry a failed job
   */
  public async retryJob(jobId: string): Promise<boolean> {
    const job = this.completedJobs.get(jobId)
    if (job && job.status === 'failed') {
      job.status = 'pending'
      job.progress = { current: 0, total: 0, percentage: 0 }
      job.results = {
        processed: 0,
        successful: 0,
        failed: 0,
        errors: [],
        warnings: []
      }
      job.timing.startedAt = undefined
      job.timing.completedAt = undefined
      job.metadata.retryCount = (job.metadata.retryCount || 0) + 1

      // Move back to queue
      this.completedJobs.delete(jobId)
      this.jobQueue.push(job)
      this.sortJobQueue()

      if (this.options.enablePersistence) {
        await this.updatePersistedJob(job)
      }

      this.emit('job_retried', job)
      logger.info('Batch job retried', { jobId, retryCount: job.metadata.retryCount })
      return true
    }

    return false
  }

  /**
   * Get processing statistics
   */
  public getStats(): {
    queueSize: number
    runningJobs: number
    completedJobs: number
    successRate: number
    averageProcessingTime: number
    jobsByType: Record<string, number>
    jobsByStatus: Record<string, number>
  } {
    const allJobs = [
      ...this.jobQueue,
      ...Array.from(this.runningJobs.values()),
      ...Array.from(this.completedJobs.values())
    ]

    const completedJobs = allJobs.filter(job => job.status === 'completed')
    const failedJobs = allJobs.filter(job => job.status === 'failed')
    const totalFinished = completedJobs.length + failedJobs.length

    const jobsByType: Record<string, number> = {}
    const jobsByStatus: Record<string, number> = {}

    allJobs.forEach(job => {
      jobsByType[job.type] = (jobsByType[job.type] || 0) + 1
      jobsByStatus[job.status] = (jobsByStatus[job.status] || 0) + 1
    })

    const averageProcessingTime = completedJobs.length > 0
      ? completedJobs.reduce((sum, job) => {
          const duration = job.timing.actualDuration || 0
          return sum + duration
        }, 0) / completedJobs.length
      : 0

    return {
      queueSize: this.jobQueue.length,
      runningJobs: this.runningJobs.size,
      completedJobs: this.completedJobs.size,
      successRate: totalFinished > 0 ? completedJobs.length / totalFinished : 0,
      averageProcessingTime,
      jobsByType,
      jobsByStatus
    }
  }

  /**
   * Register custom job definition
   */
  public registerJobDefinition(definition: BatchJobDefinition): void {
    this.jobDefinitions.set(`${definition.type}:${definition.name}`, definition)
    logger.info('Job definition registered', {
      type: definition.type,
      name: definition.name
    })
  }

  /**
   * Process large-scale matching job
   */
  public async processLargeScaleMatching(parameters: {
    candidateIds?: string[]
    jobIds?: string[]
    filters?: Record<string, any>
    batchSize?: number
    priority?: BatchJob['priority']
  }): Promise<string> {
    return this.createJob('matching', 'Large Scale Matching', parameters, {
      priority: parameters.priority || 'high',
      description: 'Process matches for large volume of candidates and jobs'
    })
  }

  /**
   * Process batch recommendation generation
   */
  public async processBatchRecommendations(parameters: {
    userIds: string[]
    recommendationTypes: string[]
    priority?: BatchJob['priority']
  }): Promise<string> {
    return this.createJob('recommendations', 'Batch Recommendations', parameters, {
      priority: parameters.priority || 'medium',
      description: 'Generate recommendations for multiple users'
    })
  }

  /**
   * Process embedding updates
   */
  public async processEmbeddingUpdates(parameters: {
    itemIds: string[]
    itemType: 'candidate' | 'job'
    updateType: 'create' | 'update' | 'delete'
    priority?: BatchJob['priority']
  }): Promise<string> {
    return this.createJob('embeddings', 'Embedding Updates', parameters, {
      priority: parameters.priority || 'medium',
      description: 'Update embeddings for candidates or jobs'
    })
  }

  /**
   * Process data cleanup
   */
  public async processDataCleanup(parameters: {
    cleanupType: 'expired' | 'orphaned' | 'duplicate'
    dryRun?: boolean
    priority?: BatchJob['priority']
  }): Promise<string> {
    return this.createJob('cleanup', `Data Cleanup - ${parameters.cleanupType}`, parameters, {
      priority: parameters.priority || 'low',
      description: `Clean up ${parameters.cleanupType} data`
    })
  }

  /**
   * Process analytics generation
   */
  public async processAnalyticsGeneration(parameters: {
    analyticsType: 'matching' | 'recommendations' | 'user_behavior' | 'system_performance'
    dateRange: { start: Date; end: Date }
    priority?: BatchJob['priority']
  }): Promise<string> {
    return this.createJob('analytics', `Analytics - ${parameters.analyticsType}`, parameters, {
      priority: parameters.priority || 'low',
      description: `Generate ${parameters.analyticsType} analytics`
    })
  }

  /**
   * Start processing jobs
   */
  private startProcessing(): void {
    this.processingInterval = setInterval(async () => {
      if (!this.isProcessing && this.canProcessMoreJobs()) {
        await this.processNextJobs()
      }
    }, 1000) // Check every second
  }

  /**
   * Process next batch of jobs
   */
  private async processNextJobs(): Promise<void> {
    if (this.isProcessing) return

    this.isProcessing = true

    try {
      const jobsToProcess = this.getJobsToProcess()

      for (const job of jobsToProcess) {
        // Move job from queue to running
        const queueIndex = this.jobQueue.findIndex(j => j.id === job.id)
        if (queueIndex >= 0) {
          this.jobQueue.splice(queueIndex, 1)
        }

        this.runningJobs.set(job.id, job)
        job.status = 'running'
        job.timing.startedAt = new Date()

        // Process job in background
        this.processJob(job).catch(error => {
          logger.error('Job processing error', {
            jobId: job.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        })
      }
    } catch (error) {
      logger.error('Error in job processing loop', { error })
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Process individual job
   */
  private async processJob(job: BatchJob): Promise<void> {
    const startTime = Date.now()

    try {
      logger.info('Processing batch job', {
        jobId: job.id,
        type: job.type,
        name: job.name
      })

      // Get job definition
      const definition = this.jobDefinitions.get(`${job.type}:${job.name}`)
      if (!definition) {
        throw new Error(`No job definition found for ${job.type}:${job.name}`)
      }

      // Set up progress tracking
      const progressInterval = setInterval(() => {
        this.updateJobProgress(job)
      }, this.options.progressUpdateInterval)

      // Set timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Job timeout')), this.options.jobTimeout)
      })

      // Process job
      const processingPromise = definition.handler(job)
      const results = await Promise.race([processingPromise, timeoutPromise])

      clearInterval(progressInterval)

      // Update job with results
      job.results = results
      job.status = 'completed'
      job.timing.completedAt = new Date()
      job.timing.actualDuration = Date.now() - startTime
      job.progress.percentage = 100

      // Move to completed
      this.runningJobs.delete(job.id)
      this.completedJobs.set(job.id, job)

      if (this.options.enablePersistence) {
        await this.updatePersistedJob(job)
      }

      this.emit('job_completed', job)
      logger.info('Batch job completed', {
        jobId: job.id,
        duration: job.timing.actualDuration,
        processed: results.processed,
        successful: results.successful,
        failed: results.failed
      })

    } catch (error) {
      // Handle job failure
      job.status = 'failed'
      job.timing.completedAt = new Date()
      job.timing.actualDuration = Date.now() - startTime
      job.results.errors.push({
        item: 'job',
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      // Check if should retry
      if ((job.metadata.retryCount || 0) < (job.metadata.maxRetries || 0)) {
        logger.info('Job failed, scheduling retry', {
          jobId: job.id,
          retryCount: job.metadata.retryCount,
          maxRetries: job.metadata.maxRetries
        })

        // Schedule retry
        setTimeout(() => {
          this.retryJob(job.id).catch(err => {
            logger.error('Error retrying job', { jobId: job.id, error: err })
          })
        }, this.options.retryDelay)
      } else {
        logger.error('Job failed permanently', {
          jobId: job.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }

      // Move to completed
      this.runningJobs.delete(job.id)
      this.completedJobs.set(job.id, job)

      if (this.options.enablePersistence) {
        await this.updatePersistedJob(job)
      }

      this.emit('job_failed', job)
    }
  }

  /**
   * Get jobs to process
   */
  private getJobsToProcess(): BatchJob[] {
    const availableSlots = this.options.maxConcurrentJobs - this.runningJobs.size
    if (availableSlots <= 0) return []

    return this.jobQueue.slice(0, availableSlots)
  }

  /**
   * Check if more jobs can be processed
   */
  private canProcessMoreJobs(): boolean {
    return this.jobQueue.length > 0 && this.runningJobs.size < this.options.maxConcurrentJobs
  }

  /**
   * Sort job queue by priority
   */
  private sortJobQueue(): void {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
    this.jobQueue.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      if (priorityDiff !== 0) return priorityDiff
      return a.timing.createdAt.getTime() - b.timing.createdAt.getTime()
    })
  }

  /**
   * Update job progress
   */
  private updateJobProgress(job: BatchJob): void {
    if (job.status === 'running') {
      this.emit('job_progress', job)

      if (this.options.enablePersistence) {
        this.updatePersistedJob(job).catch(error => {
          logger.error('Error updating persisted job progress', {
            jobId: job.id,
            error
          })
        })
      }
    }
  }

  /**
   * Persist job to database
   */
  private async persistJob(job: BatchJob): Promise<void> {
    try {
      await this.prisma.batchJob.create({
        data: {
          id: job.id,
          type: job.type,
          name: job.name,
          description: job.description,
          priority: job.priority,
          status: job.status,
          parameters: job.parameters,
          results: job.results,
          timing: job.timing,
          metadata: job.metadata,
          createdAt: job.timing.createdAt
        }
      })
    } catch (error) {
      logger.error('Error persisting job', { jobId: job.id, error })
    }
  }

  /**
   * Update persisted job
   */
  private async updatePersistedJob(job: BatchJob): Promise<void> {
    try {
      await this.prisma.batchJob.update({
        where: { id: job.id },
        data: {
          status: job.status,
          results: job.results,
          timing: job.timing,
          metadata: job.metadata,
          updatedAt: new Date()
        }
      })
    } catch (error) {
      logger.error('Error updating persisted job', { jobId: job.id, error })
    }
  }

  /**
   * Register default job definitions
   */
  private registerDefaultJobDefinitions(): void {
    // Large Scale Matching
    this.registerJobDefinition({
      type: 'matching',
      name: 'Large Scale Matching',
      description: 'Process matches for large volume of candidates and jobs',
      handler: async (job) => {
        const { candidateIds, jobIds, filters, batchSize = 100 } = job.parameters
        const results = { processed: 0, successful: 0, failed: 0, errors: [], warnings: [] }

        // Implementation would depend on your specific matching logic
        // This is a placeholder for the actual implementation

        job.progress.total = (candidateIds?.length || 0) * (jobIds?.length || 0)
        job.progress.current = 0

        // Process in batches
        // ... implementation here

        return results
      }
    })

    // Batch Recommendations
    this.registerJobDefinition({
      type: 'recommendations',
      name: 'Batch Recommendations',
      description: 'Generate recommendations for multiple users',
      handler: async (job) => {
        const { userIds, recommendationTypes } = job.parameters
        const results = { processed: 0, successful: 0, failed: 0, errors: [], warnings: [] }

        job.progress.total = userIds.length * recommendationTypes.length
        job.progress.current = 0

        // Implementation would depend on your recommendation logic
        // ... implementation here

        return results
      }
    })

    // Embedding Updates
    this.registerJobDefinition({
      type: 'embeddings',
      name: 'Embedding Updates',
      description: 'Update embeddings for candidates or jobs',
      handler: async (job) => {
        const { itemIds, itemType, updateType } = job.parameters
        const results = { processed: 0, successful: 0, failed: 0, errors: [], warnings: [] }

        job.progress.total = itemIds.length
        job.progress.current = 0

        // Implementation would depend on your embedding service
        // ... implementation here

        return results
      }
    })
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception in BatchProcessor', { error })
    })

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection in BatchProcessor', { reason, promise })
    })
  }

  /**
   * Generate unique job ID
   */
  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Graceful shutdown
   */
  public async shutdown(): Promise<void> {
    logger.info('Shutting down BatchProcessor')

    // Stop processing new jobs
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = null
    }

    // Wait for running jobs to complete or timeout
    const shutdownTimeout = 30000 // 30 seconds
    const startTime = Date.now()

    while (this.runningJobs.size > 0 && Date.now() - startTime < shutdownTimeout) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // Cancel any remaining running jobs
    for (const [jobId, job] of this.runningJobs.entries()) {
      job.status = 'cancelled'
      job.timing.completedAt = new Date()
      this.completedJobs.set(jobId, job)
      logger.warn('Job cancelled due to shutdown', { jobId, name: job.name })
    }

    this.runningJobs.clear()

    logger.info('BatchProcessor shutdown complete')
  }
}