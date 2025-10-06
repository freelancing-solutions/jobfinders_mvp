import { EventStream, StreamEvent } from './event-stream'
import { logger } from '@/lib/logger'
import { RealtimeProcessor } from '@/services/matching/realtime-processor'

export interface MatchEvent {
  type: 'match_created' | 'match_updated' | 'match_expired' | 'match_accepted' | 'match_rejected'
  matchId: string
  candidateId: string
  employerId: string
  jobId: string
  score: number
  confidence: number
  previousScore?: number
  metadata: {
    matchFactors: Record<string, number>
    explanation: string[]
    algorithm: string
    version: string
    timestamp: Date
  }
}

export interface ApplicationEvent {
  type: 'application_submitted' | 'application_viewed' | 'application_shortlisted' | 'application_rejected' | 'application_interview_scheduled'
  applicationId: string
  candidateId: string
  employerId: string
  jobId: string
  status: string
  previousStatus?: string
  metadata: {
    appliedAt: Date
    source: string
    userAgent?: string
    ipAddress?: string
    notes?: string
  }
}

export interface ProfileUpdateEvent {
  type: 'profile_created' | 'profile_updated' | 'profile_completed' | 'skill_added' | 'experience_added' | 'education_added'
  userId: string
  userType: 'candidate' | 'employer'
  changes: {
    field: string
    oldValue?: any
    newValue: any
    changeType: 'create' | 'update' | 'delete'
  }[]
  metadata: {
    completionPercentage: number
    completenessScore: number
    lastActiveAt: Date
    source: 'manual' | 'import' | 'api'
  }
}

export interface JobEvent {
  type: 'job_posted' | 'job_updated' | 'job_closed' | 'job_filled' | 'job_reposted'
  jobId: string
  employerId: string
  title: string
  status: string
  previousStatus?: string
  metadata: {
    postedAt: Date
    expiresAt?: Date
    applicationCount: number
    viewCount: number
    location: string
    isRemote: boolean
    salaryRange?: {
      min: number
      max: number
      currency: string
    }
  }
}

export interface FeedbackEvent {
  type: 'match_feedback' | 'recommendation_feedback' | 'profile_feedback' | 'application_feedback'
  userId: string
  itemType: 'job' | 'candidate' | 'recommendation'
  itemId: string
  feedback: {
    action: 'like' | 'dislike' | 'apply' | 'save' | 'hide' | 'report'
    rating?: number
    comment?: string
    reason?: string
  }
  context?: {
    source?: string
    sessionId?: string
    searchQuery?: string
    position?: number
  }
  metadata: {
    timestamp: Date
    userAgent?: string
    ipAddress?: string
  }
}

export class MatchEventProcessor {
  private eventStream: EventStream
  private realtimeProcessor: RealtimeProcessor
  private eventHandlers: Map<string, Function[]> = new Map()

  constructor(eventStream: EventStream, realtimeProcessor: RealtimeProcessor) {
    this.eventStream = eventStream
    this.realtimeProcessor = realtimeProcessor
    this.setupEventHandlers()
    this.subscribeToEvents()
  }

  /**
   * Process a match event
   */
  public async processMatchEvent(event: MatchEvent): Promise<void> {
    const streamEvent: StreamEvent = {
      type: `match_${event.type}`,
      data: event,
      source: 'matching_system',
      version: '1.0',
      metadata: {
        candidateId: event.candidateId,
        employerId: event.employerId,
        jobId: event.jobId,
        score: event.score
      }
    }

    this.eventStream.publish(streamEvent)

    // Trigger real-time processing
    await this.handleMatchEvent(event)
  }

  /**
   * Process an application event
   */
  public async processApplicationEvent(event: ApplicationEvent): Promise<void> {
    const streamEvent: StreamEvent = {
      type: `application_${event.type}`,
      data: event,
      source: 'application_system',
      version: '1.0',
      metadata: {
        applicationId: event.applicationId,
        candidateId: event.candidateId,
        employerId: event.employerId,
        jobId: event.jobId,
        status: event.status
      }
    }

    this.eventStream.publish(streamEvent)

    // Trigger real-time processing
    await this.handleApplicationEvent(event)
  }

  /**
   * Process a profile update event
   */
  public async processProfileUpdateEvent(event: ProfileUpdateEvent): Promise<void> {
    const streamEvent: StreamEvent = {
      type: `profile_${event.type}`,
      data: event,
      source: 'profile_system',
      version: '1.0',
      metadata: {
        userId: event.userId,
        userType: event.userType,
        completionPercentage: event.metadata.completionPercentage
      }
    }

    this.eventStream.publish(streamEvent)

    // Trigger real-time processing
    await this.handleProfileUpdateEvent(event)
  }

  /**
   * Process a job event
   */
  public async processJobEvent(event: JobEvent): Promise<void> {
    const streamEvent: StreamEvent = {
      type: `job_${event.type}`,
      data: event,
      source: 'job_system',
      version: '1.0',
      metadata: {
        jobId: event.jobId,
        employerId: event.employerId,
        status: event.status,
        applicationCount: event.metadata.applicationCount
      }
    }

    this.eventStream.publish(streamEvent)

    // Trigger real-time processing
    await this.handleJobEvent(event)
  }

  /**
   * Process a feedback event
   */
  public async processFeedbackEvent(event: FeedbackEvent): Promise<void> {
    const streamEvent: StreamEvent = {
      type: `feedback_${event.type}`,
      data: event,
      source: 'feedback_system',
      version: '1.0',
      metadata: {
        userId: event.userId,
        itemType: event.itemType,
        itemId: event.itemId,
        action: event.feedback.action
      }
    }

    this.eventStream.publish(streamEvent)

    // Trigger real-time processing
    await this.handleFeedbackEvent(event)
  }

  /**
   * Register event handler
   */
  public registerEventHandler(eventType: string, handler: Function): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, [])
    }
    this.eventHandlers.get(eventType)!.push(handler)
  }

  /**
   * Remove event handler
   */
  public removeEventHandler(eventType: string, handler: Function): void {
    const handlers = this.eventHandlers.get(eventType)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    // Match event handlers
    this.registerEventHandler('match_created', this.handleMatchCreated.bind(this))
    this.registerEventHandler('match_updated', this.handleMatchUpdated.bind(this))
    this.registerEventHandler('match_accepted', this.handleMatchAccepted.bind(this))
    this.registerEventHandler('match_rejected', this.handleMatchRejected.bind(this))

    // Application event handlers
    this.registerEventHandler('application_submitted', this.handleApplicationSubmitted.bind(this))
    this.registerEventHandler('application_shortlisted', this.handleApplicationShortlisted.bind(this))

    // Profile event handlers
    this.registerEventHandler('profile_updated', this.handleProfileUpdated.bind(this))
    this.registerEventHandler('profile_completed', this.handleProfileCompleted.bind(this))

    // Job event handlers
    this.registerEventHandler('job_posted', this.handleJobPosted.bind(this))
    this.registerEventHandler('job_closed', this.handleJobClosed.bind(this))

    // Feedback event handlers
    this.registerEventHandler('match_feedback', this.handleMatchFeedback.bind(this))
    this.registerEventHandler('recommendation_feedback', this.handleRecommendationFeedback.bind(this))
  }

  /**
   * Subscribe to event stream
   */
  private subscribeToEvents(): void {
    this.eventStream.subscribe(
      { types: [] }, // Subscribe to all events
      (event: StreamEvent) => {
        this.handleStreamEvent(event)
      }
    )
  }

  /**
   * Handle events from stream
   */
  private handleStreamEvent(event: StreamEvent): void {
    const handlers = this.eventHandlers.get(event.type)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event.data)
        } catch (error) {
          logger.error('Error in event handler', {
            eventType: event.type,
            error
          })
        }
      })
    }
  }

  /**
   * Handle match events in real-time processor
   */
  private async handleMatchEvent(event: MatchEvent): Promise<void> {
    const realtimeEvent = {
      type: event.type as any,
      userId: event.candidateId,
      data: {
        matchId: event.matchId,
        candidateId: event.candidateId,
        employerId: event.employerId,
        jobId: event.jobId,
        score: event.score,
        confidence: event.confidence,
        matchFactors: event.metadata.matchFactors,
        explanation: event.metadata.explanation
      },
      priority: this.determineEventPriority(event.type, event.score),
      metadata: {
        source: 'match_events',
        version: event.metadata.version
      }
    }

    this.realtimeProcessor.queueEvent(realtimeEvent)

    // Also queue for employer if high-priority event
    if (['match_created', 'match_accepted'].includes(event.type)) {
      this.realtimeProcessor.queueEvent({
        ...realtimeEvent,
        userId: event.employerId
      })
    }
  }

  /**
   * Handle application events in real-time processor
   */
  private async handleApplicationEvent(event: ApplicationEvent): Promise<void> {
    const realtimeEvent = {
      type: 'application_submitted' as any,
      userId: event.employerId,
      data: {
        applicationId: event.applicationId,
        candidateId: event.candidateId,
        employerId: event.employerId,
        jobId: event.jobId,
        status: event.status,
        appliedAt: event.metadata.appliedAt
      },
      priority: this.determineEventPriority(event.type),
      metadata: {
        source: 'application_events'
      }
    }

    this.realtimeProcessor.queueEvent(realtimeEvent)
  }

  /**
   * Handle profile update events in real-time processor
   */
  private async handleProfileUpdateEvent(event: ProfileUpdateEvent): Promise<void> {
    const realtimeEvent = {
      type: 'profile_update' as any,
      userId: event.userId,
      data: {
        userType: event.userType,
        changes: event.changes,
        completionPercentage: event.metadata.completionPercentage,
        completenessScore: event.metadata.completenessScore
      },
      priority: this.determineEventPriority(event.type, event.metadata.completionPercentage),
      metadata: {
        source: 'profile_events'
      }
    }

    this.realtimeProcessor.queueEvent(realtimeEvent)
  }

  /**
   * Handle job events in real-time processor
   */
  private async handleJobEvent(event: JobEvent): Promise<void> {
    const realtimeEvent = {
      type: 'job_posted' as any,
      userId: event.employerId,
      data: {
        jobId: event.jobId,
        title: event.title,
        status: event.status,
        postedAt: event.metadata.postedAt,
        location: event.metadata.location,
        isRemote: event.metadata.isRemote,
        salaryRange: event.metadata.salaryRange
      },
      priority: this.determineEventPriority(event.type),
      metadata: {
        source: 'job_events'
      }
    }

    this.realtimeProcessor.queueEvent(realtimeEvent)
  }

  /**
   * Handle feedback events in real-time processor
   */
  private async handleFeedbackEvent(event: FeedbackEvent): Promise<void> {
    const realtimeEvent = {
      type: 'feedback_received' as any,
      userId: event.userId,
      data: {
        itemType: event.itemType,
        itemId: event.itemId,
        feedback: event.feedback,
        context: event.context
      },
      priority: 'medium',
      metadata: {
        source: 'feedback_events'
      }
    }

    this.realtimeProcessor.queueEvent(realtimeEvent)
  }

  /**
   * Determine event priority based on type and data
   */
  private determineEventPriority(eventType: string, score?: number): 'low' | 'medium' | 'high' | 'critical' {
    // High priority events
    if (['match_created', 'match_accepted', 'application_shortlisted'].includes(eventType)) {
      return 'high'
    }

    // Critical events
    if (['match_rejected', 'application_rejected'].includes(eventType)) {
      return 'critical'
    }

    // Score-based priority for matches
    if (score !== undefined) {
      if (score >= 0.9) return 'critical'
      if (score >= 0.7) return 'high'
      if (score >= 0.5) return 'medium'
    }

    // Default priorities
    if (['profile_completed', 'job_posted'].includes(eventType)) {
      return 'medium'
    }

    return 'low'
  }

  // Individual event handlers
  private async handleMatchCreated(event: MatchEvent): Promise<void> {
    logger.info('New match created', {
      matchId: event.matchId,
      candidateId: event.candidateId,
      employerId: event.employerId,
      score: event.score
    })

    // Trigger recommendation updates
    // This would integrate with your recommendation engine
  }

  private async handleMatchUpdated(event: MatchEvent): Promise<void> {
    logger.info('Match updated', {
      matchId: event.matchId,
      previousScore: event.previousScore,
      newScore: event.score
    })
  }

  private async handleMatchAccepted(event: MatchEvent): Promise<void> {
    logger.info('Match accepted', {
      matchId: event.matchId,
      candidateId: event.candidateId,
      employerId: event.employerId
    })

    // Update matching algorithms based on successful match
  }

  private async handleMatchRejected(event: MatchEvent): Promise<void> {
    logger.info('Match rejected', {
      matchId: event.matchId,
      candidateId: event.candidateId,
      employerId: event.employerId
    })

    // Update matching algorithms to avoid similar mismatches
  }

  private async handleApplicationSubmitted(event: ApplicationEvent): Promise<void> {
    logger.info('Application submitted', {
      applicationId: event.applicationId,
      candidateId: event.candidateId,
      jobId: event.jobId
    })
  }

  private async handleApplicationShortlisted(event: ApplicationEvent): Promise<void> {
    logger.info('Application shortlisted', {
      applicationId: event.applicationId,
      candidateId: event.candidateId,
      employerId: event.employerId
    })
  }

  private async handleProfileUpdated(event: ProfileUpdateEvent): Promise<void> {
    logger.info('Profile updated', {
      userId: event.userId,
      userType: event.userType,
      changeCount: event.changes.length,
      completionPercentage: event.metadata.completionPercentage
    })
  }

  private async handleProfileCompleted(event: ProfileUpdateEvent): Promise<void> {
    logger.info('Profile completed', {
      userId: event.userId,
      userType: event.userType,
      completenessScore: event.metadata.completenessScore
    })

    // Trigger immediate matching for completed profiles
  }

  private async handleJobPosted(event: JobEvent): Promise<void> {
    logger.info('Job posted', {
      jobId: event.jobId,
      employerId: event.employerId,
      title: event.title
    })
  }

  private async handleJobClosed(event: JobEvent): Promise<void> {
    logger.info('Job closed', {
      jobId: event.jobId,
      employerId: event.employerId,
      status: event.status
    })
  }

  private async handleMatchFeedback(event: FeedbackEvent): Promise<void> {
    logger.info('Match feedback received', {
      userId: event.userId,
      itemId: event.itemId,
      action: event.feedback.action,
      rating: event.feedback.rating
    })

    // Update recommendation algorithm weights
  }

  private async handleRecommendationFeedback(event: FeedbackEvent): Promise<void> {
    logger.info('Recommendation feedback received', {
      userId: event.userId,
      itemId: event.itemId,
      action: event.feedback.action,
      context: event.context
    })

    // Update recommendation algorithm based on feedback
  }

  /**
   * Get event statistics
   */
  public getEventStats(): {
    handlerCount: number
    subscribedEventTypes: string[]
    streamStats: any
  } {
    return {
      handlerCount: Array.from(this.eventHandlers.values())
        .reduce((total, handlers) => total + handlers.length, 0),
      subscribedEventTypes: Array.from(this.eventHandlers.keys()),
      streamStats: this.eventStream.getStats()
    }
  }
}