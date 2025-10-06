import { logger } from '@/lib/logger'

export interface SkillVerificationConfig {
  platforms: SkillAssessmentPlatform[]
  verificationMethods: {
    automatic: boolean
    manual: boolean
    peer: boolean
    thirdParty: boolean
  }
  verificationLevel: 'basic' | 'intermediate' | 'advanced' | 'expert'
  retryConfig: {
    maxRetries: number
    retryDelay: number
    backoffMultiplier: number
  }
  webhooks: {
    enabled: boolean
    endpoints: string[]
    secret?: string
  }
}

export interface SkillAssessmentPlatform {
  id: string
  name: string
  type: 'coding' | 'technical' | 'language' | 'certification' | 'assessment' | 'quiz'
  apiEndpoint?: string
  apiKey?: string
  webhookUrl?: string
  authConfig?: AuthConfig
  rateLimit: {
    requestsPerDay: number
    requestsPerMinute: number
    currentWindow: number[]
  }
  supportedSkills: string[]
  supportedLanguages: string[]
  scoring: {
    minScore: number
    maxScore: number
    passingScore: number
    timeLimit?: number // in minutes
  }
  features: PlatformFeatures
  isActive: boolean
}

export interface AuthConfig {
  type: 'oauth2' | 'api_key' | 'basic' | 'bearer'
  credentials: Record<string, string>
  tokenEndpoint?: string
  refreshEndpoint?: string
  scopes?: string[]
}

export interface PlatformFeatures {
  timeLimit: boolean
  automaticGrading: boolean
  detailedReports: boolean
  certificateGeneration: boolean
  questionBank: boolean
  customQuestions: boolean
  proctoring: boolean
  multipleLanguages: boolean
  mobileSupport: boolean
  apiAccess: boolean
}

export interface SkillVerificationRequest {
  id: string
  userId: string
  skillId: string
  platformId: string
  verificationMethod: 'automatic' | 'manual' | 'peer' | 'thirdParty'
  assessmentConfig: AssessmentConfig
  candidateProfile: CandidateProfile
  metadata: {
    source: string
    sessionId?: string
    userAgent?: string
    ip?: string
    [key: string]: any
  }
  createdAt: Date
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
  completedAt?: Date
}

export interface AssessmentConfig {
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  questionCount: number
  timeLimit?: number
  passingScore?: number
  allowRetries: boolean
  maxRetries?: number
  customQuestions?: AssessmentQuestion[]
  language?: string
  proctoring: boolean
  randomizeQuestions: boolean
}

export interface AssessmentQuestion {
  id: string
  type: 'multiple_choice' | 'coding' | 'essay' | 'practical' | 'quiz'
  question: string
  options?: string[]
  correctAnswer?: string | string[]
  timeLimit?: number
  points: number
  tags?: string[]
  explanation?: string
}

export interface CandidateProfile {
  userId: string
  skills: CandidateSkill[]
  experience: WorkExperience[]
  education: Education[]
  certifications: Certification[]
  preferences: {
    languages: string[]
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'
    timeAvailability: number
  }
}

export interface CandidateSkill {
  skillId: string
  skillName: string
  proficiency: number // 0-10 scale
  yearsOfExperience: number
  verified: boolean
  verificationSource?: string
  verificationScore?: number
  lastVerified?: Date
}

export interface WorkExperience {
  company: string
  position: string
  startDate: Date
  endDate?: Date
  description: string
  skills: string[]
}

export interface Education {
  institution: string
  degree: string
  field: string
  startDate: Date
  endDate?: Date
  }

  interface Certification {
    name: string
    issuer: string
    issuedDate: Date
    expiryDate?: Date
    credentialId: string
  }

export interface SkillVerificationResult {
  id: string
  requestId: string
  userId: string
  skillId: string
  platformId: string
  platformName: string
  score: number
  maxScore: number
  passingScore: number
  status: 'passed' | 'failed' | 'incomplete'
  assessmentDetails: AssessmentDetails
  certificateUrl?: string
  reportUrl?: string
  verificationDate: Date
  validityPeriod?: number // in days
  metadata: {
    assessmentDuration?: number
    questionCount?: number
    retryCount?: number
    proctoringEnabled?: boolean
    [key: string]: any
  }
  createdAt: Date
  updatedAt: Date
}

export interface AssessmentDetails {
  questionResults: QuestionResult[]
  totalQuestions: number
  correctAnswers: number
  timeSpent: number
  averageTimePerQuestion: number
  scoreByCategory: Record<string, number>
  feedback: string[]
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
}

export interface QuestionResult {
  questionId: string
  question: string
  type: string
  userAnswer: string | string[]
  correctAnswer: string | string[]
  isCorrect: boolean
  timeSpent: number
  points: number
  feedback?: string
}

export interface SkillVerificationStats {
  totalVerifications: number
  verificationsByPlatform: Record<string, number>
  verificationsBySkill: Record<string, number>
  averageScore: number
  passingRate: number
  averageTimeSpent: number
  verificationTrends: Array<{
    period: string
    verifications: number
    averageScore: number
    passingRate: number
  }>
  skillMasteryLevels: Record<string, {
  beginner: number
    intermediate: number
    advanced: number
    expert: number
  }>
  improvementOpportunities: Array<{
    skill: string
      currentLevel: string
      targetLevel: string
      recommendation: string
      resources: string[]
    }>
}

export interface VerificationRecommendation {
  userId: string
  skillId: string
  currentLevel: string
  recommendedLevel: string
  recommendedPlatforms: Array<{
    platformId: string
    platformName: string
    reason: string
    difficulty: string
    estimatedTime: number
  }>
  learningResources: Array<{
    title: string
    type: 'course' | 'book' | 'tutorial' | 'practice' | 'documentation'
    provider: string
    url: string
    duration: number
    difficulty: string
    rating?: number
    tags: string[]
  }>
  actionPlan: Array<{
    step: number
    action: string
    resource?: string
    estimatedTime: number
    deadline?: Date
  }>
}

export class SkillVerificationService {
  private config: SkillVerificationConfig
  private platforms: Map<string, SkillAssessmentPlatform> = new Map()
  private verificationHistory: Map<string, SkillVerificationResult[]> = new Map()
  private pendingRequests: Map<string, SkillVerificationRequest> = new Map()
  private verificationQueue: VerificationQueue

  constructor(config: Partial<SkillVerificationConfig> = {}) {
    this.config = {
      platforms: [],
      verificationMethods: {
        automatic: true,
        manual: false,
        peer: false,
        thirdParty: false
      },
      verificationLevel: 'intermediate',
      retryConfig: {
        maxRetries: 3,
        retryDelay: 5000,
        backoffMultiplier: 2
      },
      webhooks: {
        enabled: false,
        endpoints: []
      },
      ...config
    }

    this.verificationQueue = {
      pending: [],
      processing: [],
      completed: [],
      failed: []
    }

    this.initializeDefaultPlatforms()
  }

  /**
   * Add or update a skill assessment platform
   */
  async addPlatform(platform: SkillAssessmentPlatform): Promise<void> {
    try {
      logger.info('Adding skill assessment platform', {
        platformId: platform.id,
        name: platform.name,
        type: platform.type
      })

      // Validate platform configuration
      this.validatePlatform(platform)

      // Store platform configuration
      this.platforms.set(platform.id, platform)

      // Test platform connectivity
      if (platform.isActive) {
        await this.testPlatformConnectivity(platform)
      }

      logger.info('Skill assessment platform added successfully', {
        platformId: platform.id,
        totalPlatforms: this.platforms.size
      })

    } catch (error) {
      logger.error('Error adding skill assessment platform', { error, platform })
      throw new Error('Failed to add skill assessment platform')
    }
  }

  /**
   * Remove a skill assessment platform
   */
  async removePlatform(platformId: string): Promise<boolean> {
    try {
      const platform = this.platforms.get(platformId)
      if (!platform) {
        return false
      }

      // Cancel pending verifications for this platform
      this.cancelPendingVerifications(platformId)

      // Remove platform
      this.platforms.delete(platformId)

      // Clean up verification history for this platform
      for (const [userId, results] of this.verificationHistory.entries()) {
        const filteredResults = results.filter(result => result.platformId !== platformId)
        if (filteredResults.length === 0) {
          this.verificationHistory.delete(userId)
        } else {
          this.verificationHistory.set(userId, filteredResults)
        }
      }

      logger.info('Skill assessment platform removed', {
        platformId,
        platformName: platform.name
      })

      return true

    } catch (error) {
      logger.error('Error removing skill assessment platform', { error, platformId })
      return false
    }
  }

  /**
   * Get all configured platforms
   */
  getPlatforms(): SkillAssessmentPlatform[] {
    return Array.from(this.platforms.values())
  }

  /**
   * Get platform by ID
   */
  getPlatform(platformId: string): SkillAssessmentPlatform | undefined {
    return this.platforms.get(platformId)
  }

  /**
   * Initiate skill verification
   */
  async initiateVerification(
    userId: string,
    skillId: string,
    platformId: string,
    verificationMethod: 'automatic' | 'manual' | 'peer' | 'thirdParty' = 'automatic',
    assessmentConfig?: AssessmentConfig,
    candidateProfile?: CandidateProfile
  ): Promise<SkillVerificationRequest> {
    try {
      logger.info('Initiating skill verification', {
        userId,
        skillId,
        platformId,
        verificationMethod
      })

      const platform = this.platforms.get(platformId)
      if (!platform) {
        throw new Error(`Platform not found: ${platformId}`)
      }

      if (!platform.isActive) {
        throw new Error(`Platform is not active: ${platformId}`)
      }

      if (!platform.supportedSkills.includes(skillId)) {
        throw new Error(`Skill not supported by platform: ${skillId}`)
      }

      // Create verification request
      const request: SkillVerificationRequest = {
        id: this.generateRequestId(),
        userId,
        skillId,
        platformId,
        verificationMethod,
        assessmentConfig: assessmentConfig || this.createDefaultAssessmentConfig(skillId),
        candidateProfile: candidateProfile || this.createDefaultProfile(),
        metadata: {
          source: 'skill_verification_service',
          sessionId: this.generateSessionId()
        },
        createdAt: new Date(),
        status: 'pending'
      }

      // Store request
      this.pendingRequests.set(request.id, request)
      this.verificationQueue.pending.push({
        requestId: request.id,
        priority: this.calculatePriority(request),
        scheduledTime: new Date(),
        retryCount: 0
      })

      logger.info('Skill verification initiated', {
        requestId: request.id,
        userId,
        skillId,
        platformId
      })

      return request

    } catch (error) {
      logger.error('Error initiating skill verification', { error, userId, skillId, platformId })
      throw new Error('Failed to initiate skill verification')
    }
  }

  /**
   * Get verification request status
   */
  async getVerificationStatus(requestId: string): Promise<SkillVerificationRequest | null> {
    const request = this.pendingRequests.get(requestId)
    if (request) {
      return request
    }

    // Check if request has been processed
    const userId = request.userId
    const history = this.verificationHistory.get(userId) || []
    const result = history.find(r => r.requestId === requestId)

    if (result) {
      // Create a status object from the result
      return {
        id: requestId,
        userId: result.userId,
        skillId: result.skillId,
        platformId: result.platformId,
        verificationMethod: 'automatic',
        assessmentConfig: {},
        candidateProfile: {},
        metadata: {},
        createdAt: new Date(),
        status: result.status === 'passed' || result.status === 'failed' ? 'completed' : 'in_progress',
        completedAt: result.verificationDate
      }
    }

    return null
  }

  /**
   * Get verification results for a user
   */
  async getVerificationResults(
    userId: string,
    skillId?: string,
    platformId?: string,
    filters?: {
      dateRange?: { start: Date; end: Date }
      status?: string[]
      minScore?: number
      maxScore?: number
    }
  ): Promise<SkillVerificationResult[]> {
    try {
      let results = this.verificationHistory.get(userId) || []

      // Apply filters
      if (skillId) {
        results = results.filter(result => result.skillId === skillId)
      }

      if (platformId) {
        results = results.filter(result => result.platformId === platformId)
      }

      if (filters?.dateRange) {
        results = results.filter(result =>
          result.verificationDate >= filters.dateRange.start &&
          result.verificationDate <= filters.dateRange.end
        )
      }

      if (filters?.status?.length) {
        results = results.filter(result => filters.status.includes(result.status))
      }

      if (filters?.minScore !== undefined) {
        results = results.filter(result => result.score >= filters.minScore)
      }

      if (filters?.maxScore !== undefined) {
        results = results.filter(result => result.score <= filters.maxScore)
      }

      return results.sort((a, b) => b.verificationDate.getTime() - a.verificationDate.getTime())

    } catch (error) {
      logger.error('Error getting verification results', { error, userId, filters })
      throw new Error('Failed to get verification results')
    }
  }

  /**
   * Get verification statistics
   */
  async getVerificationStats(
    userId?: string,
    skillId?: string,
    platformId?: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<SkillVerificationStats> {
    try {
      let allResults: SkillVerificationResult[] = []

      if (userId) {
        allResults = this.verificationHistory.get(userId) || []
      } else {
        // Get all results from all users
        for (const results of this.verificationHistory.values()) {
          allResults.push(...results)
        }
      }

      // Apply filters
      if (skillId) {
        allResults = allResults.filter(result => result.skillId === skillId)
      }

      if (platformId) {
        allResults = allResults.filter(result => result.platformId === platformId)
      }

      if (dateRange) {
        allResults = allResults.filter(result =>
          result.verificationDate >= dateRange.start &&
          result.verificationDate <= dateRange.end
        )
      }

      // Calculate statistics
      const totalVerifications = allResults.length
      const verificationsByPlatform: Record<string, number> = {}
      const verificationsBySkill: Record<string, number> = {}

      allResults.forEach(result => {
        verificationsByPlatform[result.platformId] = (verificationsByPlatform[result.platformId] || 0) + 1
        verificationsBySkill[result.skillId] = (verificationsBySkill[result.skillId] || 0) + 1
      })

      const totalScore = allResults.reduce((sum, result) => sum + result.score, 0)
      const averageScore = totalVerifications > 0 ? totalScore / totalVerifications : 0

      const passedCount = allResults.filter(result => result.status === 'passed').length
      const passingRate = totalVerifications > 0 ? passedCount / totalVerifications : 0

      const totalTimeSpent = allResults.reduce((sum, result) => sum + (result.metadata.assessmentDuration || 0), 0)
      const averageTimeSpent = totalVerifications > 0 ? totalTimeSpent / totalVerifications : 0

      // Calculate trends
      const trends = this.calculateVerificationTrends(allResults)

      // Calculate skill mastery levels
      const skillMasteryLevels = this.calculateSkillMasteryLevels(allResults)

      // Generate improvement opportunities
      const improvementOpportunities = this.generateImprovementOpportunities(allResults)

      return {
        totalVerifications,
        verificationsByPlatform,
        verificationsBySkill,
        averageScore: Math.round(averageScore * 100) / 100,
        passingRate: Math.round(passingRate * 100) / 100,
        averageTimeSpent: Math.round(averageTimeSpent),
        verificationTrends: trends,
        skillMasteryLevels,
        improvementOpportunities
      }

    } catch (error) {
      logger.error('Error getting verification statistics', { error, userId, skillId, platformId, dateRange })
      throw new Error('Failed to get verification statistics')
    }
  }

  /**
   * Process verification queue
   */
  async processVerificationQueue(): Promise<void> {
    if (this.verificationQueue.pending.length === 0) {
      return
    }

    // Get next request from queue
    const queueItem = this.verificationQueue.pending.shift()
    if (!queueItem) {
      return
    }

    this.verificationQueue.processing.push(queueItem.requestId)

    try {
      const request = this.pendingRequests.get(queueItem.requestId)
      if (!request) {
        throw new Error('Request not found')
      }

      // Update request status
      request.status = 'in_progress'

      // Process verification
      const result = await this.processVerification(request)

      // Store result
      if (!this.verificationHistory.has(request.userId)) {
        this.verificationHistory.set(request.userId, [])
      }
      this.verificationHistory.get(request.userId)!.push(result)

      // Update request status
      request.status = result.status === 'passed' || result.status === 'failed' ? 'completed' : 'in_progress'
      request.completedAt = result.verificationDate

      // Move to completed queue
      this.verificationQueue.completed.push({
        requestId: request.id,
        completedTime: new Date(),
        result
      })

      // Send webhook notification if configured
      if (this.config.webhooks.enabled) {
        await this.sendWebhookNotification('verification_completed', result)
      }

      logger.info('Verification processed successfully', {
        requestId: request.id,
        userId: request.userId,
        score: result.score,
        status: result.status
      })

    } catch (error) {
      logger.error('Error processing verification', { error, queueItem })

      // Handle error and retry logic
      const request = this.pendingRequests.get(queueItem.requestId)!
      request.status = 'failed'

      // Check if we should retry
      if (queueItem.retryCount < this.config.retryConfig.maxRetries) {
        const retryDelay = this.config.retryConfig.retryDelay *
                      Math.pow(this.config.retryConfig.backoffMultiplier, queueItem.retryCount)

        // Schedule retry
        this.verificationQueue.pending.push({
          requestId: queueItem.requestId,
          priority: queueItem.priority,
          scheduledTime: new Date(Date.now() + retryDelay),
          retryCount: queueItem.retryCount + 1
        })

        logger.info('Verification retry scheduled', {
          requestId: queueItem.requestId,
          retryCount: queueItem.retryCount + 1,
          retryDelay
        })
      } else {
        // Max retries reached, move to failed queue
        this.verificationQueue.failed.push({
          requestId: queueItem.requestId,
          failedTime: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error',
          retryCount: queueItem.queueItem.retryCount
        })
      }
    } finally {
      // Remove from processing queue
      const index = this.verificationQueue.processing.indexOf(queueItem.requestId)
      if (index > -1) {
        this.verificationQueue.processing.splice(index, 1)
      }
    }
  }

  /**
   * Get verification recommendations for a user
   */
  async getVerificationRecommendations(
    userId: string,
    skillId?: string
  ): Promise<VerificationRecommendation[]> {
    try {
      const candidateProfile = this.createDefaultProfile()
      const verificationResults = this.verificationHistory.get(userId) || []

      // Filter results by skill if specified
      const relevantResults = skillId
        ? verificationResults.filter(result => result.skillId === skillId)
        : verificationResults

      const recommendations: VerificationRecommendation[] = []

      // Group by skill
      const skillResults = new Map<string, SkillVerificationResult[]>()

      relevantResults.forEach(result => {
        if (!skillResults.has(result.skillId)) {
          skillResults.set(result.skillId, [])
        }
        skillResults.get(result.skillId)!.push(result)
      })

      // Generate recommendations for each skill
      skillResults.forEach((results, skillId) => {
        if (results.length === 0) return

        // Calculate current level
        const averageScore = results.reduce((sum, result) => sum + result.score, 0) / results.length
        const currentLevel = this.determineSkillLevel(averageScore)

        // Find better platforms for this skill
        const betterPlatforms = this.findBetterPlatforms(skillId, currentLevel)

        if (betterPlatforms.length > 0) {
          const recommendation: VerificationRecommendation = {
            userId,
            skillId,
            currentLevel,
            recommendedLevel: this.getRecommendedLevel(currentLevel),
            recommendedPlatforms: betterPlatforms,
            learningResources: this.findLearningResources(skillId, currentLevel),
            actionPlan: this.createActionPlan(skillId, currentLevel, betterPlatforms)
          }

          recommendations.push(recommendation)
        }
      })

      return recommendations

    } catch (error) {
      logger.error('Error getting verification recommendations', { error, userId, skillId })
      return []
    }
  }

  /**
   * Clean up old data
   */
  async cleanup(retentionPeriod: number = 365): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - retentionPeriod * 24 * 60 * 60 * 1000)

      // Clean up old verification results
      for (const [userId, results] of this.verificationHistory.entries()) {
        const filteredResults = results.filter(result => result.verificationDate > cutoffDate)
        if (filteredResults.length === 0) {
          this.verificationHistory.delete(userId)
        } else {
          this.verificationHistory.set(userId, filteredResults)
        }
      }

      // Clean up old completed items
      this.verificationQueue.completed = this.verificationQueue.completed.filter(
        item => item.completedTime > cutoffDate
      )

      // Clean up old failed items
      this.verificationQueue.failed = this.verificationQueue.failed.filter(
        item => item.failedTime > cutoffDate
      )

      logger.info('Skill verification cleanup completed', {
        retentionPeriod
      })

    } catch (error) {
      logger.error('Error during cleanup', { error })
    }
  }

  // Private helper methods

  private initializeDefaultPlatforms(): void {
    // Add default coding platforms
    this.config.platforms.push({
      id: 'hacker_rank',
      name: 'HackerRank',
      type: 'coding',
      apiEndpoint: 'https://www.hackerrank.com/api/v3',
      rateLimit: {
        requestsPerDay: 1000,
        requestsPerMinute: 100,
        currentWindow: []
      },
      supportedSkills: [
        'javascript', 'python', 'java', 'c++', 'ruby', 'php', 'go', 'rust', 'scala',
        'react', 'vue', 'angular', 'node.js', 'django', 'rails', 'laravel', 'spring'
      ],
      supportedLanguages: ['javascript', 'python', 'java', 'c++', 'ruby', 'php', 'go'],
      scoring: {
        minScore: 0,
        maxScore: 100,
        passingScore: 80,
        timeLimit: 60
      },
      features: {
        timeLimit: true,
        automaticGrading: true,
        detailedReports: true,
        certificateGeneration: true,
        questionBank: true,
        customQuestions: false,
        proctoring: true,
        multipleLanguages: true,
        mobileSupport: true,
        apiAccess: true
      },
      isActive: false
    })

    // Add default technical assessment platform
    this.config.platforms.push({
      id: 'codility',
      name: 'Codility',
      type: 'coding',
      apiEndpoint: 'https://codility.com/api/v1',
      rateLimit: {
        requestsPerDay: 500,
        requestsPerMinute: 50,
        currentWindow: []
      },
      supportedSkills: [
        'javascript', 'python', 'java', 'c#', 'c++', 'php', 'sql', 'algorithms', 'data structures',
        'react', 'angular', 'node.js', 'git', 'docker'
      ],
      supportedLanguages: ['javascript', 'python', 'java', 'c#', 'c++', 'php'],
      scoring: {
        minScore: 0,
        maxScore: 100,
        passingScore: 75,
        timeLimit: 90
      },
      features: {
        timeLimit: true,
        automaticGrading: true,
        detailedReports: true,
        certificateGeneration: true,
        questionBank: true,
        customQuestions: true,
        proctoring: true,
        multipleLanguages: true,
        mobileSupport: true,
        apiAccess: true
      },
      isActive: false
    })

    // Add default language assessment platform
    this.config.platforms.push({
      id: 'duolingo_english_test',
      name: 'Duolingo English Test',
      type: 'language',
      apiEndpoint: 'https://www.duolingo.com/api/1',
      rateLimit: {
        requestsPerDay: 200,
        requestsPerMinute: 50,
        currentWindow: []
      },
      supportedSkills: ['english', 'spanish', 'french', 'german', 'italian', 'portuguese'],
      supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt'],
      scoring: {
        minScore: 0,
        maxScore: 100,
        passingScore: 60,
        timeLimit: 30
      },
      features: {
        timeLimit: true,
        automaticGrading: true,
        detailedReports: true,
        certificateGeneration: true,
        questionBank: true,
        customQuestions: false,
        proctoring: true,
        multipleLanguages: true,
        mobileSupport: true,
        apiAccess: false
      },
      isActive: false
    })

    // Store platforms in map
    this.config.platforms.forEach(platform => {
      this.platforms.set(platform.id, platform)
    })
  }

  private validatePlatform(platform: SkillAssessmentPlatform): void {
    if (!platform.id || !platform.name) {
      throw new Error('Platform ID and name are required')
    }

    if (!['coding', 'technical', 'language', 'certification', 'assessment', 'quiz'].includes(platform.type)) {
      throw new Error('Invalid platform type')
    }

    if (!platform.supportedSkills || platform.supportedSkills.length === 0) {
      throw new Error('Supported skills are required')
    }

    if (platform.scoring.minScore < 0 || platform.scoring.maxScore <= 0 ||
        platform.scoring.passingScore < platform.scoring.minScore ||
        platform.scoring.passingScore > platform.scoring.maxScore) {
      throw new Error('Invalid scoring configuration')
    }
  }

  private async testPlatformConnectivity(platform: SkillAssessmentPlatform): Promise<void> {
    if (!platform.apiEndpoint) {
      logger.debug(`Platform ${platform.id} does not have API endpoint, skipping connectivity test`)
      return
    }

    try {
      // Make a simple request to test connectivity
      const response = await fetch(`${platform.apiEndpoint}/health`, {
        method: 'GET',
        headers: platform.authConfig ? {
          'Authorization': `Bearer ${platform.authConfig.credentials.token || platform.authConfig.credentials.apiKey}`
        } : {},
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })

      if (response.ok) {
        logger.debug(`Platform ${platform.id} connectivity test passed`)
      } else {
        logger.warn(`Platform ${platform.id} connectivity test failed: ${response.status}`)
      }
    } catch (error) {
      logger.warn(`Platform ${platform.id} connectivity test failed: ${error}`)
      throw new Error(`Platform connectivity test failed: ${error}`)
    }
  }

  private async processVerification(request: SkillVerificationRequest): Promise<SkillVerificationResult> {
    const platform = this.platforms.get(request.platformId)
    if (!platform) {
      throw new Error(`Platform not found: ${request.platformId}`)
    }

    try {
      // Different processing based on platform type
      let result: SkillVerificationResult

      switch (platform.type) {
        case 'coding':
          result = await this.processCodingVerification(request, platform)
          break
        case 'technical':
          result = await this.processTechnicalVerification(request, platform)
          break
        case 'language':
          result = await this.processLanguageVerification(request, platform)
          break
        case 'certification':
          result = await this.processCertificationVerification(request, platform)
          break
        case 'assessment':
        case 'quiz':
          result = await this.processQuizVerification(request, platform)
          break
        default:
          throw new Error(`Unsupported platform type: ${platform.type}`)
      }

      return result

    } catch (error) {
      logger.error('Error processing verification', {
        error,
        requestId: request.id,
        platformId: platform.id,
        userId: request.userId,
        skillId: request.skillId
      })
      throw error
    }
  }

  private async processCodingVerification(
    request: SkillVerificationRequest,
    platform: SkillAssessmentPlatform
  ): Promise<SkillVerificationResult> {
    // This would integrate with the actual platform's API
    // For now, we'll return a mock result
    logger.info('Processing coding verification', {
      requestId: request.id,
      platformId: platform.id
    })

    return {
      id: this.generateVerificationId(),
      requestId: request.id,
      userId: request.userId,
      skillId: request.skillId,
      platformId: platform.id,
      platformName: platform.name,
      score: 85,
      maxScore: 100,
      passingScore: platform.scoring.passingScore,
      status: Math.random() > 0.8 ? 'passed' : 'failed',
      assessmentDetails: {
        questionResults: [],
        totalQuestions: 5,
        correctAnswers: 4,
        timeSpent: 120000, // 2 minutes
        averageTimePerQuestion: 24000,
        scoreByCategory: {},
        feedback: ['Good problem-solving skills', 'Clear code structure'],
        strengths: ['Algorithm implementation', 'Test coverage'],
        weaknesses: ['Edge cases'],
        recommendations: ['Practice more algorithms']
      },
      verificationDate: new Date(),
      metadata: {
        assessmentDuration: 120000,
        questionCount: 5,
        retryCount: 0,
        proctoringEnabled: false
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  private async processTechnicalVerification(
    request: SkillVerificationRequest,
    platform: SkillAssessmentPlatform
  ): Promise<SkillVerificationResult> {
    // Implementation for technical assessment platforms
    return this.processCodingVerification(request, platform)
  }

  private async processLanguageVerification(
    request: SkillVerificationRequest,
    platform: SkillAssessmentPlatform
  ): Promise<SkillVerificationResult> {
    // Implementation for language assessment platforms
    return this.processCodingVerification(request, platform)
  }

  private async processCertificationVerification(
    request: SkillVerificationRequest,
    platform: SkillAssessmentPlatform
  ): Promise<SkillVerificationResult> {
    // Implementation for certification verification
    return this.processCodingVerification(request, platform)
  }

  private async processQuizVerification(
    request: SkillVerificationRequest,
    platform: SkillAssessmentPlatform
  ): Promise<SkillVerificationResult> {
    // Implementation for quiz-based assessments
    return this.processCodingVerification(request, platform)
  }

  private createDefaultAssessmentConfig(skillId: string): AssessmentConfig {
    return {
      difficulty: 'intermediate',
      questionCount: 5,
      timeLimit: 60,
      passingScore: 75,
      allowRetries: true,
      maxRetries: 2,
      randomizeQuestions: true,
      language: 'en'
    }
  }

  private createDefaultProfile(): CandidateProfile {
    return {
      userId: '',
      skills: [],
      experience: [],
      education: [],
      certifications: [],
      preferences: {
        languages: ['en'],
        difficulty: 'intermediate',
        timeAvailability: 60
      }
    }
  }

  private calculatePriority(request: SkillVerificationRequest): 'high' | 'medium' | 'low' {
    // Calculate priority based on verification method and skill importance
    let priority = 'medium'

    if (request.verificationMethod === 'automatic') {
      priority = 'high'
    } else if (request.verificationMethod === 'manual') {
      priority = 'low'
    }

    // Could also consider skill priority from candidate profile
    // For now, keep it simple
    return priority
  }

  private cancelPendingVerifications(platformId: string): void {
    // Remove pending requests for this platform
    const pendingRequests = Array.from(this.pendingRequests.values())
      .filter(request => request.platformId === platformId)

    pendingRequests.forEach(request => {
      request.status = 'cancelled'
    })

    // Also remove from queue
    this.verificationQueue.pending = this.verificationQueue.pending.filter(
      item => !this.pendingRequests.has(item.requestId)
    )
  }

  private async sendWebhookNotification(eventType: string, data: any): Promise<void> {
    if (!this.config.webhooks.enabled) {
      return
    }

    for (const endpoint of this.config.webhooks.endpoints) {
      try {
        await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': this.config.webhooks.secret ? `Bearer ${this.config.webhooks.secret}` : ''
          },
          body: JSON.stringify({
            event: eventType,
            data,
            timestamp: new Date().toISOString()
          })
        })
      } catch (error) {
        logger.error('Webhook notification failed', { error, endpoint, eventType })
      }
    }
  }

  private calculateVerificationTrends(results: SkillVerificationResult[]): Array<{
    period: string
    verifications: number
    averageScore: number
    passingRate: number
  }> {
    // Group by month
    const monthlyData = new Map<string, SkillVerificationResult[]>()

    results.forEach(result => {
      const month = result.verificationDate.toISOString().slice(0, 7) // YYYY-MM
      if (!monthlyData.has(month)) {
        monthlyData.set(month, [])
      }
      monthlyData.get(month)!.push(result)
    })

    return Array.from(monthlyData.entries()).map(([period, monthResults]) => ({
      period,
      verifications: monthResults.length,
      averageScore: monthResults.reduce((sum, r) => sum + r.score, 0) / monthResults.length,
      passingRate: monthResults.filter(r => r.status === 'passed').length / monthResults.length
    }))
  }

  private calculateSkillMasteryLevels(results: SkillVerificationResult[]): Record<string, {
    beginner: number
    intermediate: number
    advanced: number
    expert: number
  }> {
    const masteryLevels: Record<string, {
      beginner: number
      intermediate: number
      advanced: number
      expert: number
    }> = {}

    results.forEach(result => {
      const level = this.determineSkillLevel(result.score)
      masteryLevels[result.skillId] = {
        beginner: level === 'beginner' ? (masteryLevels[result.skillId]?.beginner || 0) + 1) : masteryLevels[result.skillId]?.beginner || 0,
        intermediate: level === 'intermediate' ? (masteryLevels[result.skillId]?.intermediate || 0) + 1) : masteryLevels[result.skillId]?.intermediate || 0,
        advanced: level === 'advanced' ? (masteryLevels[result.skillId]?.advanced || 0) + 1) : masteryLevels[result.skillId]?.advanced || 0,
        expert: level === 'expert' ? (masteryLevels[result.skillId]?.expert || 0) + 1) : masteryLevels[result.skillId]?.expert || 0
      }
    })

    return masteryLevels
  }

  private generateImprovementOpportunities(results: SkillVerificationResult[]): Array<{
    skill: string
    currentLevel: string
    targetLevel: string
    recommendation: string
    resources: string[]
  }> {
    const opportunities: VerificationRecommendation['improvementOpportunities'] = []

    results.forEach(result => {
      const score = result.score
      const currentLevel = this.determineSkillLevel(score)
      let targetLevel = currentLevel
      let recommendation = ''

      // Determine if improvement is needed
      if (score < this.getPassingScore(result.platformId)) {
        targetLevel = this.getRecommendedLevel(currentLevel)
        recommendation = this.getImprovementRecommendation(currentLevel, targetLevel)
      }

      if (targetLevel !== currentLevel) {
        opportunities.push({
          skill: result.skillId,
          currentLevel,
          targetLevel,
          recommendation,
          resources: this.findLearningResources(result.skillId, currentLevel)
        })
      }
    })

    return opportunities
  }

  private findBetterPlatforms(skillId: string, currentLevel: string): Array<{
    platformId: string
    platformName: string
    reason: string
    difficulty: string
    estimatedTime: number
  }> {
    const platforms = Array.from(this.platforms.values()).filter(platform =>
      platform.isActive && platform.supportedSkills.includes(skillId)
    )

    return platforms
      .map(platform => ({
        platformId: platform.id,
        platformName: platform.name,
        reason: `Platform supports ${skillId} assessment`,
        difficulty: this.mapDifficultyToLevel(currentLevel),
        estimatedTime: 30 // Default estimate
      }))
      .sort((a, b) => b.estimatedTime - a.estimatedTime)
  }

  private findLearningResources(skillId: string, currentLevel: string): Array<{
    title: string
    type: 'course' | 'book' | 'tutorial' | 'practice' | 'documentation'
    provider: string
    url: string
    duration: number
    difficulty: string
    rating?: number
    tags: string[]
  }> {
    // This would integrate with learning resource APIs
    // For now, return placeholder data
    const resources = [
      {
        title: `${skillId} Mastery Course`,
        type: 'course',
        provider: 'Online Learning Platform',
        url: `https://example.com/learn/${skillId}`,
        duration: 40 * 60, // 40 hours
        difficulty: currentLevel,
        rating: 4.5,
        tags: [skillId, 'course', 'learning']
      },
      {
        title: `${skillId} Practice Problems`,
        type: 'practice',
        provider: 'Practice Platform',
        url: `https://example.com/practice/${skillId}`,
        duration: 20 * 60, // 20 hours
        difficulty: currentLevel,
        rating: 4.3,
        tags: [skillId, 'practice', 'coding']
      }
    ]

    return resources
  }

  private createActionPlan(
    skillId: string,
    currentLevel: string,
    betterPlatforms: Array<{
      platformId: string
      platformName: string
      difficulty: string
      estimatedTime: number
    }>
  ): Array<{
    step: number
    action: string
    resource?: string
    estimatedTime: number
    deadline?: Date
  }> {
    const actionPlan: Array<{
      step: number
      action: string
      resource?: string
      estimatedTime: number
    }> = []

    actionPlan.push({
      step: 1,
      action: `Take assessment on ${betterPlatforms[0].name} for ${skillId}`,
      resource: betterPlatforms[0].name,
      estimatedTime: betterPlatforms[0].estimatedTime * 60
    })

    actionPlan.push({
      step: 2,
      action: `Review assessment results and create improvement plan`,
      estimatedTime: 30
    })

    actionPlan.push({
      step: 3,
      action: `Practice and strengthen ${skillId} skills`,
      estimatedTime: 20 * 60
    })

    return actionPlan
  }

  private determineSkillLevel(score: number): string {
    if (score >= 90) return 'expert'
    if (score >= 75) return 'advanced'
    if (score >= 60) return 'intermediate'
    return 'beginner'
  }

  private getRecommendedLevel(currentLevel: string): string {
    switch (currentLevel) {
      case 'beginner': return 'intermediate'
      case 'intermediate': return 'advanced'
      case 'advanced': return 'expert'
      default: 'intermediate'
    }
  }

  private getImprovementRecommendation(currentLevel: string, targetLevel: string): string {
    const recommendations: Record<string, string> = {
      'beginner': 'Start with fundamentals and practice regularly',
      'intermediate': 'Work on more complex problems and algorithms',
      'advanced': 'Focus on architectural patterns and best practices',
      'expert': 'Consider mentoring and sharing knowledge'
    }
    return recommendations[targetLevel] || recommendations[currentLevel]
  }

  private getPassingScore(platformId: string): number {
    const platform = this.platforms.get(platformId)
    return platform?.scoring.passingScore || 75
  }

  private mapDifficultyToLevel(level: string): string {
    const mapping: Record<string, string> = {
      'beginner': 'beginner',
      'intermediate': 'intermediate',
      'advanced': 'advanced',
      'expert': 'expert'
    }
    return mapping[level] || 'intermediate'
  }

  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private generateVerificationId(): string {
    return `ver-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

interface VerificationQueue {
  pending: Array<{
    requestId: string
    priority: 'high' | 'medium' | 'low'
    scheduledTime: Date
    retryCount: number
  }>
  processing: string[]
  completed: Array<{
    requestId: string
    completedTime: Date
    result: SkillVerificationResult
  }>
  failed: Array<{
    requestId: string
    failedTime: Date
    error: any
    retryCount: number
  }>
}

export default SkillVerificationService