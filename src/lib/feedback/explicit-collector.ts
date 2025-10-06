import { logger } from '@/lib/logger'

export interface ExplicitFeedbackRequest {
  id: string
  userId: string
  type: FeedbackType
  trigger: FeedbackTrigger
  context: FeedbackContext
  config: FeedbackConfig
  createdAt: Date
  expiresAt?: Date
  status: 'pending' | 'responded' | 'expired' | 'dismissed'
  responses?: FeedbackResponse[]
}

export type FeedbackType =
  | 'match_rating'
  | 'recommendation_quality'
  | 'search_satisfaction'
  | 'profile_completion'
  | 'application_experience'
  | 'ui_usability'
  | 'feature_feedback'
  | 'bug_report'
  | 'general_satisfaction'
  | 'nps_survey' // Net Promoter Score
  | 'customer_effort'

export type FeedbackTrigger =
  | 'post_match'
  | 'post_application'
  | 'post_search'
  | 'session_end'
  | 'feature_first_use'
  | 'milestone_reached'
  | 'error_occurred'
  | 'scheduled'
  | 'manual_request'

export interface FeedbackContext {
  entityType: 'match' | 'job' | 'candidate' | 'recommendation' | 'search' | 'session' | 'general'
  entityId?: string
  metadata: {
    source: 'web' | 'mobile' | 'email' | 'api'
    sessionId?: string
    userAgent?: string
    referrer?: string
    previousActions?: string[]
    [key: string]: any
  }
}

export interface FeedbackConfig {
  title: string
  description?: string
  questions: FeedbackQuestion[]
  requiredFields?: string[]
  allowSkip?: boolean
  allowAnonymous?: boolean
  showProgress?: boolean
  timeEstimate?: number // in seconds
  incentives?: FeedbackIncentive
  branding?: FeedbackBranding
  followUp?: FollowUpConfig
}

export interface FeedbackQuestion {
  id: string
  type: QuestionType
  question: string
  description?: string
  required: boolean
  options?: QuestionOption[]
  validation?: QuestionValidation
  conditionalLogic?: ConditionalLogic
  metadata?: Record<string, any>
}

export type QuestionType =
  | 'rating' // 1-5 stars
  | 'nps' // 0-10 scale
  | 'ces' // Customer Effort Score 1-7
  | 'multiple_choice'
  | 'checkbox'
  | 'text'
  | 'textarea'
  | 'boolean'
  | 'scale' // custom scale
  | 'matrix'
  | 'ranking'

export interface QuestionOption {
  id: string
  text: string
  value: string | number
  description?: string
  icon?: string
  metadata?: Record<string, any>
}

export interface QuestionValidation {
  minLength?: number
  maxLength?: number
  pattern?: string
  min?: number
  max?: number
  custom?: (value: any) => boolean | string
}

export interface ConditionalLogic {
  if: {
    questionId: string
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains'
    value: any
  }
  then: {
    action: 'show' | 'hide' | 'require' | 'optional'
    targetQuestionId: string
  }
}

export interface FeedbackIncentive {
  type: 'discount' | 'premium_access' | 'points' | 'entry' | 'donation'
  value: string | number
  description: string
  terms?: string
}

export interface FeedbackBranding {
  logo?: string
  primaryColor?: string
  backgroundColor?: string
  fontFamily?: string
  customCSS?: string
}

export interface FollowUpConfig {
  enabled: boolean
  delay: number // in seconds
  conditions: FollowUpCondition[]
  message: string
  action?: {
    type: 'email' | 'notification' | 'task'
    target: string
  }
}

export interface FollowUpCondition {
  questionId: string
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than'
  value: any
}

export interface FeedbackResponse {
  request_id: string
  user_id: string
  responses: Record<string, any>
  metadata: {
    responseTime: number // in milliseconds
    deviceInfo: string
    sessionId: string
    userAgent: string
    completedAt: Date
    skippedQuestions?: string[]
    [key: string]: any
  }
  createdAt: Date
}

export interface FeedbackCampaign {
  id: string
  name: string
  description: string
  type: FeedbackType
  targetAudience: {
    userSegments?: string[]
    userProperties?: Record<string, any>
    userActions?: string[]
    sampleSize?: number
  }
  schedule: CampaignSchedule
  config: FeedbackConfig
  status: 'draft' | 'active' | 'paused' | 'completed'
  createdAt: Date
  updatedAt: Date
  metrics: CampaignMetrics
}

export interface CampaignSchedule {
  start: Date
  end?: Date
  triggers: FeedbackTrigger[]
  frequency?: 'once' | 'daily' | 'weekly' | 'monthly'
  maxRequests?: number
  minInterval?: number // in hours
  timezone?: string
}

export interface CampaignMetrics {
  sent: number
  opened: number
  started: number
  completed: number
  dismissed: number
  averageResponseTime: number
  completionRate: number
  averageRating?: number
  responses: Record<string, any>
}

export interface FeedbackCollectionConfig {
  defaultConfig: Partial<FeedbackConfig>
  enabledTriggers: FeedbackTrigger[]
  rateLimits: {
    perUser: number // max requests per user per day
    perSession: number // max requests per session
    global: number // max requests globally per hour
  }
  sampling: {
    enabled: boolean
    rate: number // 0-1, percentage of users to sample
    criteria: SamplingCriteria[]
  }
  privacy: {
    anonymizeData: boolean
    retentionPeriod: number // in days
    consentRequired: boolean
    dataUsage: string[]
  }
}

export interface SamplingCriteria {
  property: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than'
  value: any
  weight?: number
}

export class ExplicitFeedbackCollector {
  private config: FeedbackCollectionConfig
  private activeRequests: Map<string, ExplicitFeedbackRequest> = new Map()
  private campaigns: Map<string, FeedbackCampaign> = new Map()
  private responseHistory: Map<string, FeedbackResponse[]> = new Map()

  constructor(config: Partial<FeedbackCollectionConfig> = {}) {
    this.config = {
      defaultConfig: {
        allowSkip: true,
        showProgress: true,
        timeEstimate: 60
      },
      enabledTriggers: [
        'post_match',
        'post_application',
        'session_end',
        'feature_first_use'
      ],
      rateLimits: {
        perUser: 5,
        perSession: 3,
        global: 1000
      },
      sampling: {
        enabled: true,
        rate: 0.1, // 10% sampling rate
        criteria: []
      },
      privacy: {
        anonymizeData: false,
        retentionPeriod: 365,
        consentRequired: true,
        dataUsage: ['product_improvement', 'analytics', 'support']
      },
      ...config
    }
  }

  /**
   * Create a feedback request
   */
  async createRequest(
    userId: string,
    type: FeedbackType,
    trigger: FeedbackTrigger,
    context: FeedbackContext,
    configOverride?: Partial<FeedbackConfig>
  ): Promise<ExplicitFeedbackRequest> {
    try {
      // Check rate limits
      if (!this.checkRateLimits(userId)) {
        throw new Error('Rate limit exceeded')
      }

      // Check sampling criteria
      if (!this.shouldSampleUser(userId)) {
        throw new Error('User not in sample')
      }

      // Merge configuration
      const config = {
        ...this.config.defaultConfig,
        ...this.getDefaultConfigForType(type),
        ...configOverride
      }

      const request: ExplicitFeedbackRequest = {
        id: this.generateRequestId(),
        userId,
        type,
        trigger,
        context,
        config: config as FeedbackConfig,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        status: 'pending'
      }

      // Store request
      this.activeRequests.set(request.id, request)

      logger.info('Feedback request created', {
        requestId: request.id,
        userId,
        type,
        trigger
      })

      return request

    } catch (error) {
      logger.error('Error creating feedback request', { error, userId, type })
      throw error
    }
  }

  /**
   * Submit feedback response
   */
  async submitResponse(
    requestId: string,
    userId: string,
    responses: Record<string, any>,
    metadata: Partial<FeedbackResponse['metadata']> = {}
  ): Promise<FeedbackResponse> {
    try {
      const request = this.activeRequests.get(requestId)
      if (!request) {
        throw new Error('Feedback request not found')
      }

      if (request.userId !== userId) {
        throw new Error('Unauthorized feedback submission')
      }

      if (request.status !== 'pending') {
        throw new Error('Feedback request is no longer active')
      }

      // Validate responses
      this.validateResponses(request.config.questions, responses)

      // Create response
      const feedbackResponse: FeedbackResponse = {
        request_id: requestId,
        user_id: userId,
        responses,
        metadata: {
          responseTime: 0, // Would be calculated from request creation time
          deviceInfo: '',
          sessionId: '',
          userAgent: '',
          completedAt: new Date(),
          ...metadata
        },
        createdAt: new Date()
      }

      // Update request status
      request.status = 'responded'
      request.responses = [feedbackResponse]

      // Store response
      if (!this.responseHistory.has(userId)) {
        this.responseHistory.set(userId, [])
      }
      this.responseHistory.get(userId)!.push(feedbackResponse)

      // Clean up expired request
      this.activeRequests.delete(requestId)

      // Trigger follow-up if configured
      if (request.config.followUp?.enabled) {
        this.scheduleFollowUp(request, feedbackResponse)
      }

      logger.info('Feedback response submitted', {
        requestId,
        userId,
        responseCount: Object.keys(responses).length
      })

      return feedbackResponse

    } catch (error) {
      logger.error('Error submitting feedback response', { error, requestId, userId })
      throw error
    }
  }

  /**
   * Get active feedback requests for a user
   */
  async getActiveRequests(userId: string): Promise<ExplicitFeedbackRequest[]> {
    const userRequests = Array.from(this.activeRequests.values())
      .filter(request => request.userId === userId && request.status === 'pending')

    // Filter out expired requests
    const now = new Date()
    const validRequests = userRequests.filter(request =>
      !request.expiresAt || request.expiresAt > now
    )

    // Clean up expired requests
    userRequests.forEach(request => {
      if (request.expiresAt && request.expiresAt <= now) {
        request.status = 'expired'
        this.activeRequests.delete(request.id)
      }
    })

    return validRequests
  }

  /**
   * Dismiss a feedback request
   */
  async dismissRequest(requestId: string, userId: string): Promise<boolean> {
    try {
      const request = this.activeRequests.get(requestId)
      if (!request || request.userId !== userId) {
        return false
      }

      request.status = 'dismissed'
      this.activeRequests.delete(requestId)

      logger.info('Feedback request dismissed', { requestId, userId })
      return true

    } catch (error) {
      logger.error('Error dismissing feedback request', { error, requestId, userId })
      return false
    }
  }

  /**
   * Create a feedback campaign
   */
  async createCampaign(campaign: Omit<FeedbackCampaign, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'metrics'>): Promise<FeedbackCampaign> {
    try {
      const newCampaign: FeedbackCampaign = {
        ...campaign,
        id: this.generateCampaignId(),
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
        metrics: {
          sent: 0,
          opened: 0,
          started: 0,
          completed: 0,
          dismissed: 0,
          averageResponseTime: 0,
          completionRate: 0,
          responses: {}
        }
      }

      this.campaigns.set(newCampaign.id, newCampaign)

      logger.info('Feedback campaign created', {
        campaignId: newCampaign.id,
        name: newCampaign.name,
        type: newCampaign.type
      })

      return newCampaign

    } catch (error) {
      logger.error('Error creating feedback campaign', { error, campaign })
      throw new Error('Failed to create feedback campaign')
    }
  }

  /**
   * Start a feedback campaign
   */
  async startCampaign(campaignId: string): Promise<boolean> {
    try {
      const campaign = this.campaigns.get(campaignId)
      if (!campaign) {
        throw new Error('Campaign not found')
      }

      if (campaign.status !== 'draft') {
        throw new Error('Campaign is not in draft status')
      }

      campaign.status = 'active'
      campaign.updatedAt = new Date()

      // Schedule campaign triggers
      this.scheduleCampaignTriggers(campaign)

      logger.info('Feedback campaign started', { campaignId, name: campaign.name })
      return true

    } catch (error) {
      logger.error('Error starting feedback campaign', { error, campaignId })
      return false
    }
  }

  /**
   * Get feedback analytics for campaigns
   */
  async getCampaignAnalytics(campaignId?: string): Promise<{
    totalCampaigns: number
    activeCampaigns: number
    totalRequests: number
    totalResponses: number
    averageCompletionRate: number
    campaignMetrics: Array<{
      id: string
      name: string
      status: string
      metrics: CampaignMetrics
    }>
  }> {
    try {
      const campaigns = campaignId
        ? [this.campaigns.get(campaignId)].filter(Boolean) as FeedbackCampaign[]
        : Array.from(this.campaigns.values())

      const activeCampaigns = campaigns.filter(c => c.status === 'active').length

      const totalRequests = campaigns.reduce((sum, c) => sum + c.metrics.sent, 0)
      const totalResponses = campaigns.reduce((sum, c) => sum + c.metrics.completed, 0)

      const averageCompletionRate = totalRequests > 0
        ? totalResponses / totalRequests
        : 0

      const campaignMetrics = campaigns.map(campaign => ({
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        metrics: campaign.metrics
      }))

      return {
        totalCampaigns: campaigns.length,
        activeCampaigns,
        totalRequests,
        totalResponses,
        averageCompletionRate: Math.round(averageCompletionRate * 100) / 100,
        campaignMetrics
      }

    } catch (error) {
      logger.error('Error getting campaign analytics', { error, campaignId })
      throw new Error('Failed to get campaign analytics')
    }
  }

  /**
   * Get user feedback history
   */
  async getUserFeedbackHistory(userId: string, limit: number = 50): Promise<FeedbackResponse[]> {
    const userHistory = this.responseHistory.get(userId) || []
    return userHistory
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)
  }

  /**
   * Clean up old data
   */
  async cleanup(): Promise<void> {
    try {
      const now = new Date()
      const retentionDate = new Date(now.getTime() - this.config.privacy.retentionPeriod * 24 * 60 * 60 * 1000)

      // Clean up expired requests
      for (const [id, request] of this.activeRequests.entries()) {
        if (request.expiresAt && request.expiresAt <= now) {
          request.status = 'expired'
          this.activeRequests.delete(id)
        }
      }

      // Clean up old response history
      for (const [userId, responses] of this.responseHistory.entries()) {
        const filteredResponses = responses.filter(response => response.createdAt > retentionDate)
        if (filteredResponses.length === 0) {
          this.responseHistory.delete(userId)
        } else {
          this.responseHistory.set(userId, filteredResponses)
        }
      }

      logger.info('Feedback collector cleanup completed')

    } catch (error) {
      logger.error('Error during feedback cleanup', { error })
    }
  }

  // Private helper methods

  private checkRateLimits(userId: string): boolean {
    // In a real implementation, you would check against persistent storage
    // For now, we'll use basic in-memory tracking
    return true
  }

  private shouldSampleUser(userId: string): boolean {
    if (!this.config.sampling.enabled) {
      return true
    }

    // Simple random sampling based on user ID hash
    const hash = this.hashString(userId)
    const normalizedHash = hash / 2147483647 // Normalize to 0-1
    return normalizedHash <= this.config.sampling.rate
  }

  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  private getDefaultConfigForType(type: FeedbackType): Partial<FeedbackConfig> {
    const configs: Record<FeedbackType, Partial<FeedbackConfig>> = {
      match_rating: {
        title: 'Rate this match',
        description: 'How relevant is this match for you?',
        questions: [
          {
            id: 'rating',
            type: 'rating',
            question: 'How would you rate this match?',
            required: true
          }
        ]
      },
      recommendation_quality: {
        title: 'Recommendation Feedback',
        description: 'Help us improve our recommendations',
        questions: [
          {
            id: 'relevance',
            type: 'rating',
            question: 'How relevant are these recommendations?',
            required: true
          },
          {
            id: 'comments',
            type: 'textarea',
            question: 'Any additional feedback?',
            required: false
          }
        ]
      },
      nps_survey: {
        title: 'How likely are you to recommend us?',
        description: 'On a scale of 0-10, how likely are you to recommend our platform?',
        questions: [
          {
            id: 'nps',
            type: 'nps',
            question: 'How likely are you to recommend us to a friend or colleague?',
            required: true
          },
          {
            id: 'reason',
            type: 'text',
            question: 'What is the main reason for your score?',
            required: false,
            conditionalLogic: {
              if: { questionId: 'nps', operator: 'less_than', value: 9 },
              then: { action: 'require', targetQuestionId: 'reason' }
            }
          }
        ]
      },
      customer_effort: {
        title: 'Customer Effort Score',
        description: 'How easy was it to accomplish your goal?',
        questions: [
          {
            id: 'ces',
            type: 'ces',
            question: 'How easy was it to accomplish your goal today?',
            required: true
          }
        ]
      }
    }

    return configs[type] || {}
  }

  private validateResponses(questions: FeedbackQuestion[], responses: Record<string, any>): void {
    for (const question of questions) {
      const response = responses[question.id]

      // Check required fields
      if (question.required && (response === undefined || response === null || response === '')) {
        throw new Error(`Question "${question.question}" is required`)
      }

      // Skip validation if no response
      if (response === undefined || response === null) {
        continue
      }

      // Type-specific validation
      switch (question.type) {
        case 'text':
        case 'textarea':
          if (typeof response !== 'string') {
            throw new Error(`Question "${question.question}" must be a string`)
          }
          if (question.validation?.minLength && response.length < question.validation.minLength) {
            throw new Error(`Response must be at least ${question.validation.minLength} characters`)
          }
          if (question.validation?.maxLength && response.length > question.validation.maxLength) {
            throw new Error(`Response must be no more than ${question.validation.maxLength} characters`)
          }
          break

        case 'rating':
        case 'nps':
        case 'ces':
          const numValue = Number(response)
          if (isNaN(numValue)) {
            throw new Error(`Question "${question.question}" must be a number`)
          }
          if (question.validation?.min !== undefined && numValue < question.validation.min) {
            throw new Error(`Response must be at least ${question.validation.min}`)
          }
          if (question.validation?.max !== undefined && numValue > question.validation.max) {
            throw new Error(`Response must be no more than ${question.validation.max}`)
          }
          break

        case 'multiple_choice':
          if (question.options && !question.options.some(option => option.value === response)) {
            throw new Error(`Invalid option selected for question "${question.question}"`)
          }
          break

        case 'checkbox':
          if (!Array.isArray(response)) {
            throw new Error(`Question "${question.question}" must be an array`)
          }
          if (question.options && !response.every(value =>
            question.options!.some(option => option.value === value)
          )) {
            throw new Error(`Invalid options selected for question "${question.question}"`)
          }
          break

        case 'boolean':
          if (typeof response !== 'boolean') {
            throw new Error(`Question "${question.question}" must be true or false`)
          }
          break

        default:
          // Custom validation
          if (question.validation?.custom) {
            const result = question.validation.custom(response)
            if (result !== true) {
              throw new Error(typeof result === 'string' ? result : `Invalid response for question "${question.question}"`)
            }
          }
      }
    }
  }

  private scheduleFollowUp(request: ExplicitFeedbackRequest, response: FeedbackResponse): void {
    // In a real implementation, you would schedule follow-up actions
    logger.info('Follow-up scheduled', {
      requestId: request.id,
      userId: request.userId,
      delay: request.config.followUp?.delay
    })
  }

  private scheduleCampaignTriggers(campaign: FeedbackCampaign): void {
    // In a real implementation, you would schedule campaign triggers
    logger.info('Campaign triggers scheduled', {
      campaignId: campaign.id,
      triggers: campaign.schedule.triggers
    })
  }

  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private generateCampaignId(): string {
    return `campaign-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

export default ExplicitFeedbackCollector