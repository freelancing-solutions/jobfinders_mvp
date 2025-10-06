import { logger } from '@/lib/logger'

export interface JobBoardConfig {
  id: string
  name: string
  type: 'api' | 'rss' | 'scraping' | 'partner'
  apiEndpoint?: string
  apiKey?: string
  rateLimit: {
    requestsPerHour: number
    requestsPerMinute: number
    currentWindow: number[]
  }
  fieldMappings: FieldMapping[]
  filters: JobBoardFilters
  syncFrequency: 'real_time' | 'hourly' | 'daily' | 'weekly'
  isActive: boolean
  lastSync?: Date
  authConfig?: AuthConfig
}

export interface FieldMapping {
  sourceField: string
  targetField: string
  transform?: string | ((value: any) => any)
  required: boolean
  defaultValue?: any
}

export interface JobBoardFilters {
  locations?: string[]
  industries?: string[]
  jobTypes?: string[]
  experienceLevels?: string[]
  salaryRanges?: Array<{ min: number; max: number }>
  keywords?: string[]
  excludeKeywords?: string[]
  postedWithin?: number // days
}

export interface AuthConfig {
  type: 'oauth2' | 'api_key' | 'basic' | 'bearer'
  credentials: Record<string, string>
  tokenEndpoint?: string
  refreshEndpoint?: string
  scopes?: string[]
}

export interface JobBoardJob {
  id: string
  boardId: string
  externalId: string
  title: string
  description: string
  company: string
  location: string
  salary?: {
    min?: number
    max?: number
    currency?: string
    type?: 'hourly' | 'yearly' | 'contract'
  }
  requirements?: string[]
  qualifications?: string[]
  benefits?: string[]
  jobType: string
  experienceLevel?: string
  industry?: string
  remoteWork?: boolean
  postedDate: Date
  applicationUrl?: string
  applyMethod: 'internal' | 'external' | 'email'
  contactInfo?: {
    email?: string
    phone?: string
    website?: string
  }
  tags?: string[]
  metadata: Record<string, any>
}

export interface SyncResult {
  boardId: string
  boardName: string
  jobsProcessed: number
  jobsAdded: number
  jobsUpdated: number
  jobsRemoved: number
  errors: SyncError[]
  startTime: Date
  endTime: Date
  duration: number
  nextSyncTime: Date
}

export interface SyncError {
  type: 'api_error' | 'parsing_error' | 'validation_error' | 'rate_limit' | 'auth_error'
  message: string
  details?: any
  jobId?: string
  timestamp: Date
}

export interface JobSyncStats {
  totalJobs: number
  activeJobs: number
  jobsByBoard: Record<string, number>
  jobsByLocation: Record<string, number>
  jobsByIndustry: Record<string, number>
  averageSalary: number
  syncHealth: 'healthy' | 'warning' | 'critical'
  lastSyncTime: Date
  nextSyncTime: Date
}

export interface SyncQueue {
  pending: Array<{
    boardId: string
    priority: 'high' | 'medium' | 'low'
    scheduledTime: Date
    retryCount: number
  }>
  processing: string[]
  completed: Array<{
    boardId: string
    completedTime: Date
    result: SyncResult
  }>
  failed: Array<{
    boardId: string
    failedTime: Date
    error: SyncError
    retryCount: number
    nextRetry?: Date
  }>
}

export interface SyncMetrics {
  boardsConfigured: number
  boardsActive: number
  totalSyncs: number
  successfulSyncs: number
  failedSyncs: number
  averageSyncDuration: number
  totalJobsSynchronized: number
  errorRate: number
  lastUpdateTime: Date
}

class JobBoardSyncService {
  private configs: Map<string, JobBoardConfig> = new Map()
  private syncQueue: SyncQueue
  private syncStats: Map<string, JobSyncStats> = new Map()
  private isProcessing: boolean = false
  private processingInterval?: NodeJS.Timeout

  constructor() {
    this.syncQueue = {
      pending: [],
      processing: [],
      completed: [],
      failed: []
    }

    // Initialize with default job board configurations
    this.initializeDefaultConfigs()
  }

  /**
   * Add or update a job board configuration
   */
  async addJobBoardConfig(config: JobBoardConfig): Promise<void> {
    try {
      logger.info('Adding job board configuration', {
        boardId: config.id,
        name: config.name,
        type: config.type
      })

      // Validate configuration
      this.validateConfig(config)

      // Store configuration
      this.configs.set(config.id, config)

      // Initialize sync stats
      this.syncStats.set(config.id, {
        totalJobs: 0,
        activeJobs: 0,
        jobsByBoard: {},
        jobsByLocation: {},
        jobsByIndustry: {},
        averageSalary: 0,
        syncHealth: 'healthy',
        lastSyncTime: new Date(),
        nextSyncTime: this.calculateNextSyncTime(config)
      })

      // Schedule initial sync if active
      if (config.isActive) {
        this.scheduleSync(config.id, 'medium')
      }

      logger.info('Job board configuration added successfully', {
        boardId: config.id,
        totalConfigs: this.configs.size
      })

    } catch (error) {
      logger.error('Error adding job board configuration', { error, config })
      throw new Error('Failed to add job board configuration')
    }
  }

  /**
   * Remove a job board configuration
   */
  async removeJobBoardConfig(boardId: string): Promise<boolean> {
    try {
      const config = this.configs.get(boardId)
      if (!config) {
        return false
      }

      // Remove from active configs
      this.configs.delete(boardId)
      this.syncStats.delete(boardId)

      // Remove from sync queue
      this.syncQueue.pending = this.syncQueue.pending.filter(item => item.boardId !== boardId)

      logger.info('Job board configuration removed', { boardId })
      return true

    } catch (error) {
      logger.error('Error removing job board configuration', { error, boardId })
      return false
    }
  }

  /**
   * Get all job board configurations
   */
  getJobBoardConfigs(): JobBoardConfig[] {
    return Array.from(this.configs.values())
  }

  /**
   * Get sync metrics
   */
  getSyncMetrics(): SyncMetrics {
    const configs = Array.from(this.configs.values())
    const activeConfigs = configs.filter(c => c.isActive)
    const stats = Array.from(this.syncStats.values())

    const completedSyncs = this.syncQueue.completed.length
    const failedSyncs = this.syncQueue.failed.length
    const totalSyncs = completedSyncs + failedSyncs

    const averageDuration = completedSyncs > 0
      ? this.syncQueue.completed.reduce((sum, item) => sum + item.result.duration, 0) / completedSyncs
      : 0

    const totalJobs = stats.reduce((sum, stat) => sum + stat.totalJobs, 0)
    const errorRate = totalSyncs > 0 ? failedSyncs / totalSyncs : 0

    return {
      boardsConfigured: configs.length,
      boardsActive: activeConfigs.length,
      totalSyncs,
      successfulSyncs: completedSyncs,
      failedSyncs,
      averageSyncDuration: Math.round(averageDuration * 100) / 100,
      totalJobsSynchronized: totalJobs,
      errorRate: Math.round(errorRate * 100) / 100,
      lastUpdateTime: new Date()
    }
  }

  /**
   * Start the sync service
   */
  start(): void {
    if (this.isProcessing) {
      logger.warn('Sync service is already running')
      return
    }

    this.isProcessing = true
    logger.info('Starting job board sync service')

    // Process queue every minute
    this.processingInterval = setInterval(() => {
      this.processSyncQueue()
    }, 60 * 1000)

    // Schedule initial syncs for active boards
    this.configs.forEach(config => {
      if (config.isActive) {
        this.scheduleSync(config.id, 'low')
      }
    })
  }

  /**
   * Stop the sync service
   */
  stop(): void {
    if (!this.isProcessing) {
      return
    }

    this.isProcessing = false
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
    }

    logger.info('Job board sync service stopped')
  }

  /**
   * Manually trigger sync for a specific board
   */
  async triggerSync(boardId: string, priority: 'high' | 'medium' | 'low' = 'medium'): Promise<void> {
    try {
      const config = this.configs.get(boardId)
      if (!config) {
        throw new Error(`Job board configuration not found: ${boardId}`)
      }

      if (!config.isActive) {
        throw new Error(`Job board is not active: ${boardId}`)
      }

      this.scheduleSync(boardId, priority)
      logger.info('Manual sync triggered', { boardId, priority })

    } catch (error) {
      logger.error('Error triggering manual sync', { error, boardId })
      throw error
    }
  }

  /**
   * Get jobs from a specific job board
   */
  async getJobsFromBoard(
    boardId: string,
    filters?: JobBoardFilters,
    limit?: number
  ): Promise<JobBoardJob[]> {
    try {
      const config = this.configs.get(boardId)
      if (!config) {
        throw new Error(`Job board configuration not found: ${boardId}`)
      }

      // Check rate limits
      if (!this.checkRateLimit(config)) {
        throw new Error('Rate limit exceeded')
      }

      // Fetch jobs based on board type
      let jobs: JobBoardJob[]

      switch (config.type) {
        case 'api':
          jobs = await this.fetchJobsFromAPI(config, filters, limit)
          break
        case 'rss':
          jobs = await this.fetchJobsFromRSS(config, filters, limit)
          break
        case 'scraping':
          jobs = await this.fetchJobsFromScraping(config, filters, limit)
          break
        case 'partner':
          jobs = await this.fetchJobsFromPartner(config, filters, limit)
          break
        default:
          throw new Error(`Unsupported job board type: ${config.type}`)
      }

      // Apply field mappings
      jobs = jobs.map(job => this.applyFieldMappings(job, config.fieldMappings))

      // Apply filters
      if (filters) {
        jobs = this.applyFilters(jobs, filters)
      }

      logger.info('Jobs fetched from board', {
        boardId,
        boardName: config.name,
        jobsCount: jobs.length
      })

      return jobs

    } catch (error) {
      logger.error('Error fetching jobs from board', { error, boardId })
      throw error
    }
  }

  // Private methods

  private initializeDefaultConfigs(): void {
    // LinkedIn configuration (placeholder)
    this.configs.set('linkedin', {
      id: 'linkedin',
      name: 'LinkedIn',
      type: 'api',
      apiEndpoint: 'https://api.linkedin.com/v2/jobPostings',
      rateLimit: {
        requestsPerHour: 1000,
        requestsPerMinute: 100,
        currentWindow: []
      },
      fieldMappings: [
        { sourceField: 'id', targetField: 'externalId', required: true },
        { sourceField: 'title', targetField: 'title', required: true },
        { sourceField: 'description.text', targetField: 'description', required: true },
        { sourceField: 'company.name', targetField: 'company', required: true },
        { sourceField: 'location', targetField: 'location', required: true },
        { sourceField: 'salary', targetField: 'salary', required: false }
      ],
      filters: {},
      syncFrequency: 'daily',
      isActive: false
    })

    // Indeed configuration (placeholder)
    this.configs.set('indeed', {
      id: 'indeed',
      name: 'Indeed',
      type: 'api',
      apiEndpoint: 'https://api.indeed.com/ads/apisearch',
      rateLimit: {
        requestsPerHour: 1000,
        requestsPerMinute: 100,
        currentWindow: []
      },
      fieldMappings: [
        { sourceField: 'jobkey', targetField: 'externalId', required: true },
        { sourceField: 'jobtitle', targetField: 'title', required: true },
        { sourceField: 'snippet', targetField: 'description', required: true },
        { sourceField: 'company', targetField: 'company', required: true },
        { sourceField: 'formattedLocation', targetField: 'location', required: true },
        { sourceField: 'formattedRelativeTime', targetField: 'postedDate', required: false }
      ],
      filters: {},
      syncFrequency: 'daily',
      isActive: false
    })

    // Add default RSS feed
    this.configs.set('github_jobs', {
      id: 'github_jobs',
      name: 'GitHub Jobs',
      type: 'rss',
      rateLimit: {
        requestsPerHour: 100,
        requestsPerMinute: 10,
        currentWindow: []
      },
      fieldMappings: [
        { sourceField: 'title', targetField: 'title', required: true },
        { sourceField: 'description', targetField: 'description', required: true },
        { sourceField: 'link', targetField: 'applicationUrl', required: true },
        { sourceField: 'pubDate', targetField: 'postedDate', required: true }
      ],
      filters: {},
      syncFrequency: 'hourly',
      isActive: false
    })
  }

  private validateConfig(config: JobBoardConfig): void {
    if (!config.id || !config.name) {
      throw new Error('Job board ID and name are required')
    }

    if (!['api', 'rss', 'scraping', 'partner'].includes(config.type)) {
      throw new Error('Invalid job board type')
    }

    if (config.type === 'api' && !config.apiEndpoint) {
      throw new Error('API endpoint is required for API type job boards')
    }

    if (!config.fieldMappings || config.fieldMappings.length === 0) {
      throw new Error('Field mappings are required')
    }

    // Validate required mappings
    const requiredFields = ['title', 'description']
    const hasRequiredMappings = requiredFields.every(field =>
      config.fieldMappings.some(mapping => mapping.targetField === field && mapping.required)
    )

    if (!hasRequiredMappings) {
      throw new Error('Missing required field mappings for title and description')
    }
  }

  private scheduleSync(boardId: string, priority: 'high' | 'medium' | 'low'): void {
    // Remove existing pending sync for this board
    this.syncQueue.pending = this.syncQueue.pending.filter(item => item.boardId !== boardId)

    // Add new sync to queue
    this.syncQueue.pending.push({
      boardId,
      priority,
      scheduledTime: new Date(),
      retryCount: 0
    })

    // Sort queue by priority and scheduled time
    this.syncQueue.pending.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      if (priorityDiff !== 0) return priorityDiff
      return a.scheduledTime.getTime() - b.scheduledTime.getTime()
    })

    logger.debug('Sync scheduled', { boardId, priority })
  }

  private processSyncQueue(): void {
    if (!this.isProcessing || this.syncQueue.pending.length === 0) {
      return
    }

    // Process up to 3 syncs concurrently
    const maxConcurrent = 3
    const toProcess = this.syncQueue.pending.splice(0, maxConcurrent)

    toProcess.forEach(syncItem => {
      this.syncQueue.processing.push(syncItem.boardId)
      this.processSync(syncItem.boardId)
        .then(result => {
          this.syncQueue.completed.push({
            boardId: syncItem.boardId,
            completedTime: new Date(),
            result
          })
          this.updateSyncStats(syncItem.boardId, result)
        })
        .catch(error => {
          this.handleSyncError(syncItem, error)
        })
        .finally(() => {
          // Remove from processing
          const index = this.syncQueue.processing.indexOf(syncItem.boardId)
          if (index > -1) {
            this.syncQueue.processing.splice(index, 1)
          }
        })
    })

    // Clean up old completed items
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours
    this.syncQueue.completed = this.syncQueue.completed.filter(
      item => item.completedTime > cutoffTime
    )
  }

  private async processSync(boardId: string): Promise<SyncResult> {
    const startTime = new Date()
    const config = this.configs.get(boardId)

    if (!config) {
      throw new Error(`Job board configuration not found: ${boardId}`)
    }

    logger.info('Processing job board sync', {
      boardId,
      boardName: config.name,
      startTime
    })

    try {
      // Fetch jobs from board
      const jobs = await this.getJobsFromBoard(boardId, config.filters)

      // Process jobs (add/update in database)
      const { added, updated, removed } = await this.processJobs(boardId, jobs)

      const endTime = new Date()
      const duration = endTime.getTime() - startTime.getTime()

      const result: SyncResult = {
        boardId,
        boardName: config.name,
        jobsProcessed: jobs.length,
        jobsAdded: added,
        jobsUpdated: updated,
        jobsRemoved: removed,
        errors: [],
        startTime,
        endTime,
        duration,
        nextSyncTime: this.calculateNextSyncTime(config)
      }

      // Update last sync time
      config.lastSync = endTime

      logger.info('Sync completed successfully', {
        boardId,
        jobsProcessed: result.jobsProcessed,
        jobsAdded: result.jobsAdded,
        jobsUpdated: result.jobsUpdated,
        duration: result.duration
      })

      return result

    } catch (error) {
      const endTime = new Date()
      const duration = endTime.getTime() - startTime.getTime()

      const result: SyncResult = {
        boardId,
        boardName: config.name,
        jobsProcessed: 0,
        jobsAdded: 0,
        jobsUpdated: 0,
        jobsRemoved: 0,
        errors: [{
          type: 'api_error',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        }],
        startTime,
        endTime,
        duration,
        nextSyncTime: this.calculateNextSyncTime(config)
      }

      logger.error('Sync failed', {
        boardId,
        error,
        duration: result.duration
      })

      return result
    }
  }

  private async processJobs(boardId: string, jobs: JobBoardJob[]): Promise<{
    added: number
    updated: number
    removed: number
  }> {
    // This would integrate with your database
    // For now, we'll return placeholder values
    return {
      added: jobs.length,
      updated: 0,
      removed: 0
    }
  }

  private handleSyncError(syncItem: any, error: any): void {
    logger.error('Sync failed', {
      boardId: syncItem.boardId,
      error,
      retryCount: syncItem.retryCount
    })

    const syncError: SyncError = {
      type: error.type || 'api_error',
      message: error.message || 'Unknown error',
      details: error,
      timestamp: new Date()
    }

    // Check if we should retry
    const maxRetries = 3
    if (syncItem.retryCount < maxRetries) {
      // Calculate retry delay with exponential backoff
      const retryDelay = Math.pow(2, syncItem.retryCount) * 60 * 1000 // 1, 2, 4 minutes
      const nextRetry = new Date(Date.now() + retryDelay)

      this.syncQueue.failed.push({
        boardId: syncItem.boardId,
        failedTime: new Date(),
        error: syncError,
        retryCount: syncItem.retryCount + 1,
        nextRetry
      })
    } else {
      // Max retries reached, mark as failed permanently
      this.syncQueue.failed.push({
        boardId: syncItem.boardId,
        failedTime: new Date(),
        error: syncError,
        retryCount: syncItem.retryCount
      })
    }
  }

  private updateSyncStats(boardId: string, result: SyncResult): void {
    const stats = this.syncStats.get(boardId)
    if (!stats) {
      return
    }

    stats.totalJobs += result.jobsProcessed
    stats.activeJobs = stats.totalJobs - result.jobsRemoved
    stats.lastSyncTime = result.endTime
    stats.nextSyncTime = result.nextSyncTime

    // Update sync health
    if (result.errors.length > 0) {
      stats.syncHealth = 'critical'
    } else if (result.jobsProcessed === 0) {
      stats.syncHealth = 'warning'
    } else {
      stats.syncHealth = 'healthy'
    }
  }

  private calculateNextSyncTime(config: JobBoardConfig): Date {
    const now = new Date()
    let intervalMs = 0

    switch (config.syncFrequency) {
      case 'real_time':
        intervalMs = 5 * 60 * 1000 // 5 minutes
        break
      case 'hourly':
        intervalMs = 60 * 60 * 1000 // 1 hour
        break
      case 'daily':
        intervalMs = 24 * 60 * 60 * 1000 // 24 hours
        break
      case 'weekly':
        intervalMs = 7 * 24 * 60 * 60 * 1000 // 7 days
        break
      default:
        intervalMs = 24 * 60 * 60 * 1000 // Default to daily
    }

    return new Date(now.getTime() + intervalMs)
  }

  private checkRateLimit(config: JobBoardConfig): boolean {
    const now = Date.now()
    const oneMinuteAgo = now - 60 * 1000
    const oneHourAgo = now - 60 * 60 * 1000

    // Clean old requests from window
    config.rateLimit.currentWindow = config.rateLimit.currentWindow.filter(
      timestamp => timestamp > oneHourAgo
    )

    // Check minute limit
    const requestsInLastMinute = config.rateLimit.currentWindow.filter(
      timestamp => timestamp > oneMinuteAgo
    ).length

    if (requestsInLastMinute >= config.rateLimit.requestsPerMinute) {
      return false
    }

    // Check hourly limit
    if (config.rateLimit.currentWindow.length >= config.rateLimit.requestsPerHour) {
      return false
    }

    // Add current request to window
    config.rateLimit.currentWindow.push(now)
    return true
  }

  private applyFieldMappings(job: JobBoardJob, mappings: FieldMapping[]): JobBoardJob {
    const mappedJob = { ...job }

    mappings.forEach(mapping => {
      if (job[mapping.sourceField as keyof JobBoardJob] !== undefined) {
        let value = job[mapping.sourceField as keyof JobBoardJob]

        // Apply transform if provided
        if (mapping.transform) {
          if (typeof mapping.transform === 'function') {
            value = mapping.transform(value)
          } else if (typeof mapping.transform === 'string') {
            // Simple string transformations
            switch (mapping.transform) {
              case 'lowercase':
                value = String(value).toLowerCase()
                break
              case 'uppercase':
                value = String(value).toUpperCase()
                break
              case 'trim':
                value = String(value).trim()
                break
              case 'parse_date':
                value = new Date(String(value))
                break
            }
          }
        }

        (mappedJob as any)[mapping.targetField] = value
      } else if (mapping.defaultValue !== undefined) {
        (mappedJob as any)[mapping.targetField] = mapping.defaultValue
      }
    })

    return mappedJob
  }

  private applyFilters(jobs: JobBoardJob[], filters: JobBoardFilters): JobBoardJob[] {
    return jobs.filter(job => {
      // Location filter
      if (filters.locations && filters.locations.length > 0) {
        if (!filters.locations.some(location =>
          job.location.toLowerCase().includes(location.toLowerCase())
        )) {
          return false
        }
      }

      // Keywords filter
      if (filters.keywords && filters.keywords.length > 0) {
        const searchText = `${job.title} ${job.description}`.toLowerCase()
        if (!filters.keywords.some(keyword =>
          searchText.includes(keyword.toLowerCase())
        )) {
          return false
        }
      }

      // Exclude keywords filter
      if (filters.excludeKeywords && filters.excludeKeywords.length > 0) {
        const searchText = `${job.title} ${job.description}`.toLowerCase()
        if (filters.excludeKeywords.some(keyword =>
          searchText.includes(keyword.toLowerCase())
        )) {
          return false
        }
      }

      // Posted within filter
      if (filters.postedWithin) {
        const cutoffDate = new Date(Date.now() - filters.postedWithin * 24 * 60 * 60 * 1000)
        if (job.postedDate < cutoffDate) {
          return false
        }
      }

      return true
    })
  }

  // Placeholder methods for different job board types
  private async fetchJobsFromAPI(
    config: JobBoardConfig,
    filters?: JobBoardFilters,
    limit?: number
  ): Promise<JobBoardJob[]> {
    // In a real implementation, you would make HTTP requests to the job board API
    logger.debug('Fetching jobs from API', { boardId: config.id })
    return []
  }

  private async fetchJobsFromRSS(
    config: JobBoardConfig,
    filters?: JobBoardFilters,
    limit?: number
  ): Promise<JobBoardJob[]> {
    // In a real implementation, you would parse RSS feeds
    logger.debug('Fetching jobs from RSS', { boardId: config.id })
    return []
  }

  private async fetchJobsFromScraping(
    config: JobBoardConfig,
    filters?: JobBoardFilters,
    limit?: number
  ): Promise<JobBoardJob[]> {
    // In a real implementation, you would use web scraping
    logger.debug('Fetching jobs from scraping', { boardId: config.id })
    return []
  }

  private async fetchJobsFromPartner(
    config: JobBoardConfig,
    filters?: JobBoardFilters,
    limit?: number
  ): Promise<JobBoardJob[]> {
    // In a real implementation, you would fetch from partner data feeds
    logger.debug('Fetching jobs from partner', { boardId: config.id })
    return []
  }
}

export default JobBoardSyncService