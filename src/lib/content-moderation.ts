import { auditLog, AuditAction, AuditResource } from './audit-logger'

// Content types that require moderation
export enum ContentType {
  JOB_LISTING = 'job_listing',
  USER_PROFILE = 'user_profile',
  CV_CONTENT = 'cv_content',
  COVER_LETTER = 'cover_letter',
  COMPANY_DESCRIPTION = 'company_description',
  USER_MESSAGE = 'user_message',
  REVIEW_COMMENT = 'review_comment',
  FORUM_POST = 'forum_post'
}

// Moderation actions
export enum ModerationAction {
  APPROVE = 'approve',
  REJECT = 'reject',
  FLAG = 'flag',
  QUARANTINE = 'quarantine',
  AUTO_APPROVE = 'auto_approve',
  AUTO_REJECT = 'auto_reject'
}

// Moderation reasons
export enum ModerationReason {
  SPAM = 'spam',
  INAPPROPRIATE_LANGUAGE = 'inappropriate_language',
  DISCRIMINATORY_CONTENT = 'discriminatory_content',
  MISLEADING_INFORMATION = 'misleading_information',
  PERSONAL_INFORMATION = 'personal_information',
  EXTERNAL_LINKS = 'external_links',
  DUPLICATE_CONTENT = 'duplicate_content',
  POLICY_VIOLATION = 'policy_violation',
  SECURITY_THREAT = 'security_threat',
  COPYRIGHT_VIOLATION = 'copyright_violation'
}

// Risk levels
export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Moderation result interface
export interface ModerationResult {
  contentId: string
  contentType: ContentType
  action: ModerationAction
  riskLevel: RiskLevel
  confidence: number
  reasons: ModerationReason[]
  flaggedTerms: string[]
  suggestions: string[]
  requiresHumanReview: boolean
  autoModerated: boolean
  timestamp: Date
}

// Content analysis interface
export interface ContentAnalysis {
  textLength: number
  wordCount: number
  sentenceCount: number
  languageDetected: string
  readabilityScore: number
  sentimentScore: number
  toxicityScore: number
  spamScore: number
  personalInfoDetected: boolean
  externalLinksCount: number
  suspiciousPatterns: string[]
}

// Prohibited terms and patterns
const PROHIBITED_TERMS = [
  // Discriminatory language
  'discriminat', 'racist', 'sexist', 'homophobic', 'xenophobic',
  // Inappropriate content
  'explicit', 'adult content', 'inappropriate',
  // Spam indicators
  'guaranteed income', 'work from home guaranteed', 'easy money',
  'no experience required high pay', 'pyramid scheme',
  // Security threats
  'phishing', 'malware', 'virus', 'hack',
  // Personal info patterns (will be detected by regex)
]

const SUSPICIOUS_PATTERNS = [
  // Email patterns
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  // Phone patterns
  /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
  // Credit card patterns
  /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
  // Social security patterns
  /\b\d{3}-\d{2}-\d{4}\b/g,
  // URL patterns
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g
]

// Job-specific validation rules
const JOB_LISTING_RULES = {
  minTitleLength: 10,
  maxTitleLength: 100,
  minDescriptionLength: 50,
  maxDescriptionLength: 5000,
  requiredFields: ['title', 'description', 'location', 'salary_range'],
  prohibitedInTitle: ['urgent', 'immediate start', 'no experience'],
  salaryValidation: {
    minSalary: 1000,
    maxSalary: 1000000,
    requiresCurrency: true
  }
}

// Content moderation class
export class ContentModerator {
  private static instance: ContentModerator
  private moderationHistory: Map<string, ModerationResult[]> = new Map()

  static getInstance(): ContentModerator {
    if (!ContentModerator.instance) {
      ContentModerator.instance = new ContentModerator()
    }
    return ContentModerator.instance
  }

  /**
   * Analyze content for potential issues
   */
  private analyzeContent(content: string): ContentAnalysis {
    const words = content.trim().split(/\s+/)
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
    
    // Detect external links
    const externalLinks = content.match(SUSPICIOUS_PATTERNS[3]) || []
    
    // Detect personal information
    const personalInfoDetected = SUSPICIOUS_PATTERNS.some(pattern => 
      pattern.test(content)
    )

    // Calculate basic scores (simplified implementation)
    const toxicityScore = this.calculateToxicityScore(content)
    const spamScore = this.calculateSpamScore(content)
    const sentimentScore = this.calculateSentimentScore(content)

    // Detect suspicious patterns
    const suspiciousPatterns: string[] = []
    SUSPICIOUS_PATTERNS.forEach((pattern, index) => {
      if (pattern.test(content)) {
        suspiciousPatterns.push(`Pattern ${index + 1} detected`)
      }
    })

    return {
      textLength: content.length,
      wordCount: words.length,
      sentenceCount: sentences.length,
      languageDetected: 'en', // Simplified - would use actual language detection
      readabilityScore: Math.min(100, Math.max(0, 100 - (words.length / sentences.length) * 2)),
      sentimentScore,
      toxicityScore,
      spamScore,
      personalInfoDetected,
      externalLinksCount: externalLinks.length,
      suspiciousPatterns
    }
  }

  /**
   * Calculate toxicity score based on prohibited terms
   */
  private calculateToxicityScore(content: string): number {
    const lowerContent = content.toLowerCase()
    let score = 0
    
    PROHIBITED_TERMS.forEach(term => {
      if (lowerContent.includes(term)) {
        score += 20
      }
    })

    return Math.min(100, score)
  }

  /**
   * Calculate spam score based on spam indicators
   */
  private calculateSpamScore(content: string): number {
    const lowerContent = content.toLowerCase()
    let score = 0

    // Check for spam indicators
    const spamIndicators = [
      'guaranteed', 'easy money', 'work from home', 'no experience required',
      'immediate start', 'urgent', 'limited time', 'act now'
    ]

    spamIndicators.forEach(indicator => {
      if (lowerContent.includes(indicator)) {
        score += 15
      }
    })

    // Check for excessive capitalization
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length
    if (capsRatio > 0.3) {
      score += 25
    }

    // Check for excessive punctuation
    const punctuationRatio = (content.match(/[!?]{2,}/g) || []).length
    if (punctuationRatio > 0) {
      score += 20
    }

    return Math.min(100, score)
  }

  /**
   * Calculate sentiment score (simplified implementation)
   */
  private calculateSentimentScore(content: string): number {
    const positiveWords = ['great', 'excellent', 'amazing', 'wonderful', 'fantastic']
    const negativeWords = ['terrible', 'awful', 'horrible', 'disgusting', 'hate']
    
    const lowerContent = content.toLowerCase()
    let score = 50 // Neutral baseline

    positiveWords.forEach(word => {
      if (lowerContent.includes(word)) score += 10
    })

    negativeWords.forEach(word => {
      if (lowerContent.includes(word)) score -= 10
    })

    return Math.min(100, Math.max(0, score))
  }

  /**
   * Validate job listing specific requirements
   */
  private validateJobListing(jobData: any): { valid: boolean; issues: string[] } {
    const issues: string[] = []

    // Check required fields
    JOB_LISTING_RULES.requiredFields.forEach(field => {
      if (!jobData[field] || jobData[field].toString().trim().length === 0) {
        issues.push(`Missing required field: ${field}`)
      }
    })

    // Validate title
    if (jobData.title) {
      if (jobData.title.length < JOB_LISTING_RULES.minTitleLength) {
        issues.push('Job title too short')
      }
      if (jobData.title.length > JOB_LISTING_RULES.maxTitleLength) {
        issues.push('Job title too long')
      }

      const lowerTitle = jobData.title.toLowerCase()
      JOB_LISTING_RULES.prohibitedInTitle.forEach(term => {
        if (lowerTitle.includes(term)) {
          issues.push(`Prohibited term in title: ${term}`)
        }
      })
    }

    // Validate description
    if (jobData.description) {
      if (jobData.description.length < JOB_LISTING_RULES.minDescriptionLength) {
        issues.push('Job description too short')
      }
      if (jobData.description.length > JOB_LISTING_RULES.maxDescriptionLength) {
        issues.push('Job description too long')
      }
    }

    // Validate salary
    if (jobData.salary_min && jobData.salary_max) {
      if (jobData.salary_min < JOB_LISTING_RULES.salaryValidation.minSalary) {
        issues.push('Minimum salary too low')
      }
      if (jobData.salary_max > JOB_LISTING_RULES.salaryValidation.maxSalary) {
        issues.push('Maximum salary too high')
      }
      if (jobData.salary_min > jobData.salary_max) {
        issues.push('Minimum salary cannot be higher than maximum salary')
      }
    }

    return {
      valid: issues.length === 0,
      issues
    }
  }

  /**
   * Moderate content and return moderation result
   */
  async moderateContent(
    contentId: string,
    content: string,
    contentType: ContentType,
    userId?: string,
    metadata?: any
  ): Promise<ModerationResult> {
    try {
      // Analyze content
      const analysis = this.analyzeContent(content)
      
      // Initialize moderation result
      const result: ModerationResult = {
        contentId,
        contentType,
        action: ModerationAction.APPROVE,
        riskLevel: RiskLevel.LOW,
        confidence: 0,
        reasons: [],
        flaggedTerms: [],
        suggestions: [],
        requiresHumanReview: false,
        autoModerated: true,
        timestamp: new Date()
      }

      // Determine risk level and action based on analysis
      let riskScore = 0

      // Check toxicity
      if (analysis.toxicityScore > 80) {
        result.reasons.push(ModerationReason.INAPPROPRIATE_LANGUAGE)
        riskScore += 40
      } else if (analysis.toxicityScore > 50) {
        result.reasons.push(ModerationReason.POLICY_VIOLATION)
        riskScore += 20
      }

      // Check spam score
      if (analysis.spamScore > 70) {
        result.reasons.push(ModerationReason.SPAM)
        riskScore += 30
      }

      // Check personal information
      if (analysis.personalInfoDetected) {
        result.reasons.push(ModerationReason.PERSONAL_INFORMATION)
        riskScore += 25
      }

      // Check external links
      if (analysis.externalLinksCount > 2) {
        result.reasons.push(ModerationReason.EXTERNAL_LINKS)
        riskScore += 15
      }

      // Job listing specific validation
      if (contentType === ContentType.JOB_LISTING && metadata) {
        const validation = this.validateJobListing(metadata)
        if (!validation.valid) {
          result.reasons.push(ModerationReason.POLICY_VIOLATION)
          result.suggestions.push(...validation.issues)
          riskScore += 20
        }
      }

      // Determine final risk level and action
      if (riskScore >= 80) {
        result.riskLevel = RiskLevel.CRITICAL
        result.action = ModerationAction.REJECT
        result.requiresHumanReview = true
      } else if (riskScore >= 60) {
        result.riskLevel = RiskLevel.HIGH
        result.action = ModerationAction.QUARANTINE
        result.requiresHumanReview = true
      } else if (riskScore >= 30) {
        result.riskLevel = RiskLevel.MEDIUM
        result.action = ModerationAction.FLAG
      } else {
        result.riskLevel = RiskLevel.LOW
        result.action = ModerationAction.AUTO_APPROVE
      }

      result.confidence = Math.min(100, Math.max(0, 100 - riskScore))

      // Store moderation history
      if (!this.moderationHistory.has(contentId)) {
        this.moderationHistory.set(contentId, [])
      }
      this.moderationHistory.get(contentId)!.push(result)

      // Log moderation action
      await auditLog({
        userId: userId || 'system',
        action: AuditAction.CONTENT_MODERATION,
        resource: AuditResource.CONTENT,
        resourceId: contentId,
        details: {
          contentType,
          moderationAction: result.action,
          riskLevel: result.riskLevel,
          reasons: result.reasons,
          autoModerated: result.autoModerated,
          confidence: result.confidence
        },
        ipAddress: '127.0.0.1', // Would be actual IP in real implementation
        userAgent: 'Content Moderation System'
      })

      return result

    } catch (error) {
      console.error('Content moderation error:', error)
      
      // Return safe default on error
      return {
        contentId,
        contentType,
        action: ModerationAction.QUARANTINE,
        riskLevel: RiskLevel.HIGH,
        confidence: 0,
        reasons: [ModerationReason.SECURITY_THREAT],
        flaggedTerms: [],
        suggestions: ['Content moderation failed - manual review required'],
        requiresHumanReview: true,
        autoModerated: false,
        timestamp: new Date()
      }
    }
  }

  /**
   * Get moderation history for content
   */
  getModerationHistory(contentId: string): ModerationResult[] {
    return this.moderationHistory.get(contentId) || []
  }

  /**
   * Manual moderation override by admin
   */
  async manualModeration(
    contentId: string,
    action: ModerationAction,
    reason: string,
    adminUserId: string
  ): Promise<void> {
    const result: ModerationResult = {
      contentId,
      contentType: ContentType.USER_MESSAGE, // Would be determined from context
      action,
      riskLevel: action === ModerationAction.APPROVE ? RiskLevel.LOW : RiskLevel.HIGH,
      confidence: 100,
      reasons: [ModerationReason.POLICY_VIOLATION],
      flaggedTerms: [],
      suggestions: [reason],
      requiresHumanReview: false,
      autoModerated: false,
      timestamp: new Date()
    }

    // Store manual moderation
    if (!this.moderationHistory.has(contentId)) {
      this.moderationHistory.set(contentId, [])
    }
    this.moderationHistory.get(contentId)!.push(result)

    // Log manual moderation
    await auditLog({
      userId: adminUserId,
      action: AuditAction.ADMIN_ACTION,
      resource: AuditResource.CONTENT,
      resourceId: contentId,
      details: {
        manualModeration: true,
        action,
        reason,
        timestamp: new Date().toISOString()
      },
      ipAddress: '127.0.0.1', // Would be actual IP
      userAgent: 'Admin Panel'
    })
  }

  /**
   * Get moderation statistics
   */
  getModerationStats(timeframe: 'day' | 'week' | 'month' = 'day'): any {
    const now = new Date()
    const startDate = new Date()
    
    switch (timeframe) {
      case 'day':
        startDate.setDate(now.getDate() - 1)
        break
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
    }

    const allResults: ModerationResult[] = []
    this.moderationHistory.forEach(results => {
      allResults.push(...results.filter(r => r.timestamp >= startDate))
    })

    return {
      totalModerated: allResults.length,
      autoApproved: allResults.filter(r => r.action === ModerationAction.AUTO_APPROVE).length,
      flagged: allResults.filter(r => r.action === ModerationAction.FLAG).length,
      quarantined: allResults.filter(r => r.action === ModerationAction.QUARANTINE).length,
      rejected: allResults.filter(r => r.action === ModerationAction.REJECT).length,
      requiresReview: allResults.filter(r => r.requiresHumanReview).length,
      averageConfidence: allResults.reduce((sum, r) => sum + r.confidence, 0) / allResults.length || 0,
      riskDistribution: {
        low: allResults.filter(r => r.riskLevel === RiskLevel.LOW).length,
        medium: allResults.filter(r => r.riskLevel === RiskLevel.MEDIUM).length,
        high: allResults.filter(r => r.riskLevel === RiskLevel.HIGH).length,
        critical: allResults.filter(r => r.riskLevel === RiskLevel.CRITICAL).length
      }
    }
  }
}

// Export singleton instance
export const contentModerator = ContentModerator.getInstance()

// Utility functions for easy access
export async function moderateJobListing(
  jobId: string,
  jobData: any,
  userId: string
): Promise<ModerationResult> {
  const content = `${jobData.title} ${jobData.description} ${jobData.requirements || ''}`
  return contentModerator.moderateContent(
    jobId,
    content,
    ContentType.JOB_LISTING,
    userId,
    jobData
  )
}

export async function moderateUserProfile(
  profileId: string,
  profileData: any,
  userId: string
): Promise<ModerationResult> {
  const content = `${profileData.bio || ''} ${profileData.skills || ''} ${profileData.experience || ''}`
  return contentModerator.moderateContent(
    profileId,
    content,
    ContentType.USER_PROFILE,
    userId,
    profileData
  )
}

export async function moderateMessage(
  messageId: string,
  messageContent: string,
  userId: string
): Promise<ModerationResult> {
  return contentModerator.moderateContent(
    messageId,
    messageContent,
    ContentType.USER_MESSAGE,
    userId
  )
}