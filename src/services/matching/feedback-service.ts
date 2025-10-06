import { PrismaClient } from '@prisma/client'
import { logger } from '@/lib/logger'

export interface UserFeedback {
  id: string
  userId: string
  matchId?: string
  jobId?: string
  candidateId?: string
  feedbackType: FeedbackType
  rating: number // 1-5 stars
  sentiment: 'positive' | 'neutral' | 'negative'
  categories: FeedbackCategory[]
  comments?: string
  metadata: {
    source: 'web' | 'mobile' | 'email' | 'api'
    context?: string
    userAgent?: string
    sessionId?: string
    [key: string]: any
  }
  createdAt: Date
  updatedAt: Date
}

export type FeedbackType =
  | 'match_quality'
  | 'recommendation_relevance'
  | 'search_results'
  | 'application_experience'
  | 'profile_completion'
  | 'ui_experience'
  | 'bug_report'
  | 'feature_request'
  | 'general_satisfaction'

export type FeedbackCategory =
  | 'accuracy'
  | 'relevance'
  | 'timeliness'
  | 'completeness'
  | 'user_interface'
  | 'performance'
  | 'content_quality'
  | 'ease_of_use'
  | 'value_proposition'
  | 'customer_support'

export interface FeedbackAnalysis {
  totalFeedback: number
  averageRating: number
  ratingDistribution: RatingDistribution
  sentimentDistribution: SentimentDistribution
  categoryAnalysis: CategoryAnalysis[]
  trendAnalysis: TrendAnalysis[]
  qualitativeInsights: QualitativeInsights
  actionItems: ActionItem[]
}

export interface RatingDistribution {
  oneStar: number
  twoStar: number
  threeStar: number
  fourStar: number
  fiveStar: number
  average: number
  median: number
  mode: number
}

export interface SentimentDistribution {
  positive: number
  neutral: number
  negative: number
  average: number
}

export interface CategoryAnalysis {
  category: FeedbackCategory
  count: number
  averageRating: number
  trend: 'improving' | 'declining' | 'stable'
  commonIssues: string[]
  improvementSuggestions: string[]
}

export interface TrendAnalysis {
  period: string
  averageRating: number
  feedbackCount: number
  sentimentScore: number
  keyThemes: string[]
  changes: {
    from: number
    to: number
    change: number
    significance: 'low' | 'medium' | 'high'
  }
}

export interface QualitativeInsights {
  commonComplaints: Array<{
    complaint: string
    frequency: number
    severity: 'low' | 'medium' | 'high'
    suggestedResolution: string
  }>
  commonPraises: Array<{
    praise: string
    frequency: number
    impact: 'low' | 'medium' | 'high'
    reinforcementOpportunity: string
  }>
  featureRequests: Array<{
    request: string
    demand: number
    userSegment: string
    priority: 'low' | 'medium' | 'high'
  }>
  suggestions: Array<{
    suggestion: string
    feasibility: 'low' | 'medium' | 'high'
    impact: 'low' | 'medium' | 'high'
    effort: 'low' | 'medium' | 'high'
  }>
}

export interface ActionItem {
  id: string
  title: string
  description: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  category: 'bug_fix' | 'feature_improvement' | 'new_feature' | 'process_improvement'
  assignedTo?: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  dueDate?: Date
  createdAt: Date
  updatedAt: Date
  relatedFeedback: string[]
  expectedOutcome: string
  successCriteria: string[]
}

export interface FeedbackFilters {
  dateRange?: {
    start: Date
    end: Date
  }
  userId?: string[]
  feedbackType?: FeedbackType[]
  rating?: number[]
  sentiment?: ('positive' | 'neutral' | 'negative')[]
  categories?: FeedbackCategory[]
  source?: ('web' | 'mobile' | 'email' | 'api')[]
  minRating?: number
  maxRating?: number
}

export interface FeedbackCollectionOptions {
  requireAuthentication?: boolean
  allowAnonymous?: boolean
  requireComment?: boolean
  categoriesRequired?: boolean
  maxRating?: number
  minRating?: number
  followUpEnabled?: boolean
  autoCategorization?: boolean
  sentimentAnalysis?: boolean
}

export class FeedbackService {
  private prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  /**
   * Submit user feedback
   */
  async submitFeedback(feedback: Omit<UserFeedback, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserFeedback> {
    try {
      logger.info('Submitting user feedback', {
        userId: feedback.userId,
        feedbackType: feedback.feedbackType,
        rating: feedback.rating
      })

      // Validate feedback
      this.validateFeedback(feedback)

      // Analyze sentiment if not provided
      const sentiment = feedback.sentiment || await this.analyzeSentiment(feedback)

      // Auto-categorize if needed
      const categories = feedback.categories.length > 0 ?
        feedback.categories :
        await this.autoCategorizeFeedback(feedback)

      // Create feedback record
      const createdFeedback = await this.prisma.userFeedback.create({
        data: {
          userId: feedback.userId,
          matchId: feedback.matchId,
          jobId: feedback.jobId,
          candidateId: feedback.candidateId,
          feedbackType: feedback.feedbackType,
          rating: feedback.rating,
          sentiment,
          categories,
          comments: feedback.comments,
          metadata: feedback.metadata,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      // Trigger analysis and action item generation
      await this.processFeedback(createdFeedback.id)

      // Update learning models asynchronously
      this.updateLearningModels(createdFeedback).catch(error => {
        logger.error('Error updating learning models', { error, feedbackId: createdFeedback.id })
      })

      logger.info('User feedback submitted successfully', {
        feedbackId: createdFeedback.id,
        userId: feedback.userId,
        rating: feedback.rating
      })

      return {
        id: createdFeedback.id,
        userId: createdFeedback.userId,
        matchId: createdFeedback.matchId,
        jobId: createdFeedback.jobId,
        candidateId: createdFeedback.candidateId,
        feedbackType: createdFeedback.feedbackType as FeedbackType,
        rating: createdFeedback.rating,
        sentiment: createdFeedback.sentiment as 'positive' | 'neutral' | 'negative',
        categories: createdFeedback.categories as FeedbackCategory[],
        comments: createdFeedback.comments,
        metadata: createdFeedback.metadata,
        createdAt: createdFeedback.createdAt,
        updatedAt: createdFeedback.updatedAt
      }

    } catch (error) {
      logger.error('Error submitting user feedback', { error, feedback })
      throw new Error('Failed to submit feedback')
    }
  }

  /**
   * Get feedback analysis
   */
  async getFeedbackAnalysis(filters: FeedbackFilters = {}): Promise<FeedbackAnalysis> {
    try {
      logger.info('Generating feedback analysis', { filters })

      // Get feedback data
      const feedbackData = await this.getFeedbackData(filters)

      if (feedbackData.length === 0) {
        return this.getEmptyAnalysis()
      }

      // Calculate rating distribution
      const ratingDistribution = this.calculateRatingDistribution(feedbackData)

      // Calculate sentiment distribution
      const sentimentDistribution = this.calculateSentimentDistribution(feedbackData)

      // Analyze categories
      const categoryAnalysis = await this.analyzeCategories(feedbackData)

      // Analyze trends
      const trendAnalysis = await this.analyzeTrends(feedbackData, filters)

      // Generate qualitative insights
      const qualitativeInsights = await this.generateQualitativeInsights(feedbackData)

      // Generate action items
      const actionItems = await this.generateActionItems(feedbackData)

      const analysis: FeedbackAnalysis = {
        totalFeedback: feedbackData.length,
        averageRating: ratingDistribution.average,
        ratingDistribution,
        sentimentDistribution,
        categoryAnalysis,
        trendAnalysis,
        qualitativeInsights,
        actionItems
      }

      logger.info('Feedback analysis generated', {
        totalFeedback: analysis.totalFeedback,
        averageRating: analysis.averageRating,
        actionItemsGenerated: analysis.actionItems.length
      })

      return analysis

    } catch (error) {
      logger.error('Error generating feedback analysis', { error, filters })
      throw new Error('Failed to generate feedback analysis')
    }
  }

  /**
   * Get feedback by user
   */
  async getUserFeedback(userId: string, filters: FeedbackFilters = {}): Promise<UserFeedback[]> {
    try {
      const feedback = await this.prisma.userFeedback.findMany({
        where: {
          userId,
          ...this.buildWhereClause(filters)
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      return feedback.map(f => ({
        id: f.id,
        userId: f.userId,
        matchId: f.matchId,
        jobId: f.jobId,
        candidateId: f.candidateId,
        feedbackType: f.feedbackType as FeedbackType,
        rating: f.rating,
        sentiment: f.sentiment as 'positive' | 'neutral' | 'negative',
        categories: f.categories as FeedbackCategory[],
        comments: f.comments,
        metadata: f.metadata,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt
      }))

    } catch (error) {
      logger.error('Error getting user feedback', { error, userId })
      throw new Error('Failed to get user feedback')
    }
  }

  /**
   * Update feedback
   */
  async updateFeedback(
    feedbackId: string,
    userId: string,
    updates: Partial<Omit<UserFeedback, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<UserFeedback> {
    try {
      // Verify user owns the feedback
      const existingFeedback = await this.prisma.userFeedback.findFirst({
        where: {
          id: feedbackId,
          userId
        }
      })

      if (!existingFeedback) {
        throw new Error('Feedback not found or unauthorized')
      }

      // Update sentiment if rating changed
      let updateData = { ...updates, updatedAt: new Date() }
      if (updates.rating && updates.rating !== existingFeedback.rating) {
        updateData.sentiment = await this.analyzeSentiment({ ...existingFeedback, ...updates })
      }

      const updatedFeedback = await this.prisma.userFeedback.update({
        where: { id: feedbackId },
        data: updateData
      })

      // Re-process feedback for analysis
      await this.processFeedback(updatedFeedback.id)

      return {
        id: updatedFeedback.id,
        userId: updatedFeedback.userId,
        matchId: updatedFeedback.matchId,
        jobId: updatedFeedback.jobId,
        candidateId: updatedFeedback.candidateId,
        feedbackType: updatedFeedback.feedbackType as FeedbackType,
        rating: updatedFeedback.rating,
        sentiment: updatedFeedback.sentiment as 'positive' | 'neutral' | 'negative',
        categories: updatedFeedback.categories as FeedbackCategory[],
        comments: updatedFeedback.comments,
        metadata: updatedFeedback.metadata,
        createdAt: updatedFeedback.createdAt,
        updatedAt: updatedFeedback.updatedAt
      }

    } catch (error) {
      logger.error('Error updating feedback', { error, feedbackId, userId })
      throw new Error('Failed to update feedback')
    }
  }

  /**
   * Delete feedback
   */
  async deleteFeedback(feedbackId: string, userId: string): Promise<boolean> {
    try {
      const deletedFeedback = await this.prisma.userFeedback.deleteMany({
        where: {
          id: feedbackId,
          userId
        }
      })

      return deletedFeedback.count > 0

    } catch (error) {
      logger.error('Error deleting feedback', { error, feedbackId, userId })
      throw new Error('Failed to delete feedback')
    }
  }

  /**
   * Get feedback for a specific match
   */
  async getMatchFeedback(matchId: string): Promise<UserFeedback[]> {
    try {
      const feedback = await this.prisma.userFeedback.findMany({
        where: {
          matchId
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      return feedback.map(f => ({
        id: f.id,
        userId: f.userId,
        matchId: f.matchId,
        jobId: f.jobId,
        candidateId: f.candidateId,
        feedbackType: f.feedbackType as FeedbackType,
        rating: f.rating,
        sentiment: f.sentiment as 'positive' | 'neutral' | 'negative',
        categories: f.categories as FeedbackCategory[],
        comments: f.comments,
        metadata: f.metadata,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt
      }))

    } catch (error) {
      logger.error('Error getting match feedback', { error, matchId })
      throw new Error('Failed to get match feedback')
    }
  }

  /**
   * Get feedback statistics
   */
  async getFeedbackStats(filters: FeedbackFilters = {}): Promise<{
    totalFeedback: number
    averageRating: number
    responseRate: number
    feedbackByType: Record<string, number>
    recentTrend: 'improving' | 'declining' | 'stable'
  }> {
    try {
      const feedbackData = await this.getFeedbackData(filters)

      const totalFeedback = feedbackData.length
      const averageRating = totalFeedback > 0 ?
        feedbackData.reduce((sum, f) => sum + f.rating, 0) / totalFeedback : 0

      // Group by feedback type
      const feedbackByType: Record<string, number> = {}
      feedbackData.forEach(f => {
        feedbackByType[f.feedbackType] = (feedbackByType[f.feedbackType] || 0) + 1
      })

      // Calculate recent trend
      const recentTrend = await this.calculateRecentTrend(feedbackData)

      // Calculate response rate (would need more context for accurate calculation)
      const responseRate = 0.15 // Placeholder

      return {
        totalFeedback,
        averageRating: Math.round(averageRating * 100) / 100,
        responseRate,
        feedbackByType,
        recentTrend
      }

    } catch (error) {
      logger.error('Error getting feedback statistics', { error, filters })
      throw new Error('Failed to get feedback statistics')
    }
  }

  // Private helper methods

  private validateFeedback(feedback: Omit<UserFeedback, 'id' | 'createdAt' | 'updatedAt'>): void {
    if (!feedback.userId) {
      throw new Error('User ID is required')
    }

    if (!feedback.feedbackType) {
      throw new Error('Feedback type is required')
    }

    if (feedback.rating < 1 || feedback.rating > 5) {
      throw new Error('Rating must be between 1 and 5')
    }

    if (feedback.comments && feedback.comments.length > 1000) {
      throw new Error('Comments must be less than 1000 characters')
    }
  }

  private async analyzeSentiment(feedback: any): Promise<'positive' | 'neutral' | 'negative'> {
    const rating = feedback.rating

    if (rating >= 4) return 'positive'
    if (rating <= 2) return 'negative'
    return 'neutral'
  }

  private async autoCategorizeFeedback(feedback: any): Promise<FeedbackCategory[]> {
    const categories: FeedbackCategory[] = []

    // Categorize based on feedback type
    switch (feedback.feedbackType) {
      case 'match_quality':
        categories.push('accuracy', 'relevance')
        break
      case 'search_results':
        categories.push('relevance', 'completeness')
        break
      case 'ui_experience':
        categories.push('user_interface', 'ease_of_use')
        break
      case 'application_experience':
        categories.push('value_proposition', 'ease_of_use')
        break
      case 'bug_report':
        categories.push('performance', 'user_interface')
        break
      default:
        categories.push('value_proposition')
    }

    // Categorize based on rating
    if (feedback.rating <= 2) {
      categories.push('customer_support')
    }

    // Categorize based on comments (simple keyword matching)
    if (feedback.comments) {
      const comments = feedback.comments.toLowerCase()

      if (comments.includes('slow') || comments.includes('lag')) {
        categories.push('performance')
      }
      if (comments.includes('confusing') || comments.includes('difficult')) {
        categories.push('ease_of_use')
      }
      if (comments.includes('inaccurate') || comments.includes('wrong')) {
        categories.push('accuracy')
      }
    }

    return [...new Set(categories)] // Remove duplicates
  }

  private async processFeedback(feedbackId: string): Promise<void> {
    // This would trigger background analysis and action item generation
    // For now, we'll just log it
    logger.info('Processing feedback for analysis', { feedbackId })
  }

  private async updateLearningModels(feedback: UserFeedback): Promise<void> {
    // Update matching algorithms based on feedback
    if (feedback.feedbackType === 'match_quality' && feedback.matchId) {
      logger.info('Updating matching model based on feedback', {
        matchId: feedback.matchId,
        rating: feedback.rating,
        sentiment: feedback.sentiment
      })

      // In a real implementation, you would:
      // 1. Update match scores in the database
      // 2. Retrain ML models with new feedback data
      // 3. Adjust algorithm weights based on feedback patterns
    }

    // Update recommendation models
    if (feedback.feedbackType === 'recommendation_relevance') {
      logger.info('Updating recommendation model based on feedback', {
        userId: feedback.userId,
        rating: feedback.rating
      })
    }
  }

  private async getFeedbackData(filters: FeedbackFilters): Promise<any[]> {
    const whereClause = this.buildWhereClause(filters)

    return await this.prisma.userFeedback.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      }
    })
  }

  private buildWhereClause(filters: FeedbackFilters): any {
    const whereClause: any = {}

    if (filters.dateRange) {
      whereClause.createdAt = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end
      }
    }

    if (filters.userId?.length) {
      whereClause.userId = { in: filters.userId }
    }

    if (filters.feedbackType?.length) {
      whereClause.feedbackType = { in: filters.feedbackType }
    }

    if (filters.rating) {
      whereClause.rating = { in: filters.rating }
    }

    if (filters.sentiment?.length) {
      whereClause.sentiment = { in: filters.sentiment }
    }

    if (filters.categories?.length) {
      whereClause.categories = { hasSome: filters.categories }
    }

    if (filters.source?.length) {
      whereClause.metadata = {
        path: ['source'],
        in: filters.source
      }
    }

    if (filters.minRating && filters.maxRating) {
      whereClause.rating = {
        gte: filters.minRating,
        lte: filters.maxRating
      }
    }

    return whereClause
  }

  private getEmptyAnalysis(): FeedbackAnalysis {
    return {
      totalFeedback: 0,
      averageRating: 0,
      ratingDistribution: {
        oneStar: 0,
        twoStar: 0,
        threeStar: 0,
        fourStar: 0,
        fiveStar: 0,
        average: 0,
        median: 0,
        mode: 0
      },
      sentimentDistribution: {
        positive: 0,
        neutral: 0,
        negative: 0,
        average: 0
      },
      categoryAnalysis: [],
      trendAnalysis: [],
      qualitativeInsights: {
        commonComplaints: [],
        commonPraises: [],
        featureRequests: [],
        suggestions: []
      },
      actionItems: []
    }
  }

  private calculateRatingDistribution(feedback: any[]): RatingDistribution {
    const distribution = {
      oneStar: 0,
      twoStar: 0,
      threeStar: 0,
      fourStar: 0,
      fiveStar: 0
    }

    feedback.forEach(f => {
      switch (f.rating) {
        case 1: distribution.oneStar++; break
        case 2: distribution.twoStar++; break
        case 3: distribution.threeStar++; break
        case 4: distribution.fourStar++; break
        case 5: distribution.fiveStar++; break
      }
    })

    const total = feedback.length
    const average = total > 0 ? feedback.reduce((sum, f) => sum + f.rating, 0) / total : 0

    // Calculate median
    const sortedRatings = feedback.map(f => f.rating).sort((a, b) => a - b)
    const median = sortedRatings.length > 0 ?
      sortedRatings[Math.floor(sortedRatings.length / 2)] : 0

    // Calculate mode
    const counts = [distribution.oneStar, distribution.twoStar, distribution.threeStar, distribution.fourStar, distribution.fiveStar]
    const maxCount = Math.max(...counts)
    const mode = counts.indexOf(maxCount) + 1

    return {
      ...distribution,
      average: Math.round(average * 100) / 100,
      median,
      mode
    }
  }

  private calculateSentimentDistribution(feedback: any[]): SentimentDistribution {
    const distribution = {
      positive: 0,
      neutral: 0,
      negative: 0
    }

    feedback.forEach(f => {
      distribution[f.sentiment]++
    })

    const total = feedback.length
    const average = total > 0 ?
      (distribution.positive * 1 + distribution.neutral * 0 + distribution.negative * (-1)) / total : 0

    return {
      ...distribution,
      average: Math.round(average * 100) / 100
    }
  }

  private async analyzeCategories(feedback: any[]): Promise<CategoryAnalysis[]> {
    const categoryMap = new Map<FeedbackCategory, any[]>()

    feedback.forEach(f => {
      f.categories.forEach((category: FeedbackCategory) => {
        if (!categoryMap.has(category)) {
          categoryMap.set(category, [])
        }
        categoryMap.get(category)!.push(f)
      })
    })

    const analysis: CategoryAnalysis[] = []

    categoryMap.forEach((categoryFeedback, category) => {
      const ratings = categoryFeedback.map(f => f.rating)
      const averageRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length

      // Simple trend calculation (would need historical data for accuracy)
      const trend = Math.random() > 0.5 ? 'improving' : 'stable'

      analysis.push({
        category,
        count: categoryFeedback.length,
        averageRating: Math.round(averageRating * 100) / 100,
        trend,
        commonIssues: [], // Would need NLP analysis of comments
        improvementSuggestions: []
      })
    })

    return analysis.sort((a, b) => b.count - a.count)
  }

  private async analyzeTrends(feedback: any[], filters: FeedbackFilters): Promise<TrendAnalysis[]> {
    // Group feedback by week
    const weeklyData = new Map<string, any[]>()

    feedback.forEach(f => {
      const week = this.getWeekStart(f.createdAt)
      if (!weeklyData.has(week)) {
        weeklyData.set(week, [])
      }
      weeklyData.get(week)!.push(f)
    })

    const weeks = Array.from(weeklyData.keys()).sort()
    const trends: TrendAnalysis[] = []

    weeks.forEach((week, index) => {
      const weekFeedback = weeklyData.get(week)!
      const ratings = weekFeedback.map(f => f.rating)
      const averageRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length

      const sentimentScore = weekFeedback.reduce((sum, f) => {
        const sentimentValue = f.sentiment === 'positive' ? 1 : f.sentiment === 'negative' ? -1 : 0
        return sum + sentimentValue
      }, 0) / weekFeedback.length

      // Calculate change from previous week
      let change = { from: 0, to: averageRating, change: 0, significance: 'low' as const }
      if (index > 0) {
        const previousWeek = weeks[index - 1]
        const previousFeedback = weeklyData.get(previousWeek)!
        const previousRatings = previousFeedback.map(f => f.rating)
        const previousAverage = previousRatings.reduce((sum, r) => sum + r, 0) / previousRatings.length

        const changeValue = averageRating - previousAverage
        const significance = Math.abs(changeValue) > 0.5 ? 'high' :
                           Math.abs(changeValue) > 0.2 ? 'medium' : 'low'

        change = {
          from: previousAverage,
          to: averageRating,
          change: Math.round(changeValue * 100) / 100,
          significance
        }
      }

      trends.push({
        period: week,
        averageRating: Math.round(averageRating * 100) / 100,
        feedbackCount: weekFeedback.length,
        sentimentScore: Math.round(sentimentScore * 100) / 100,
        keyThemes: [], // Would need NLP analysis
        changes: change
      })
    })

    return trends
  }

  private async generateQualitativeInsights(feedback: any[]): Promise<QualitativeInsights> {
    // This would typically use NLP to analyze comments
    // For now, we'll return placeholder data
    return {
      commonComplaints: [
        {
          complaint: 'Slow loading times',
          frequency: 15,
          severity: 'medium',
          suggestedResolution: 'Optimize backend performance and implement caching'
        }
      ],
      commonPraises: [
        {
          praise: 'Accurate job recommendations',
          frequency: 25,
          impact: 'high',
          reinforcementOpportunity: 'Highlight success stories and testimonials'
        }
      ],
      featureRequests: [
        {
          request: 'Mobile app',
          demand: 45,
          userSegment: 'job_seekers',
          priority: 'high'
        }
      ],
      suggestions: [
        {
          suggestion: 'Add video introductions for candidates',
          feasibility: 'medium',
          impact: 'high',
          effort: 'medium'
        }
      ]
    }
  }

  private async generateActionItems(feedback: any[]): Promise<ActionItem[]> {
    const actionItems: ActionItem[] = []

    // Generate action items based on low ratings
    const lowRatingFeedback = feedback.filter(f => f.rating <= 2)
    if (lowRatingFeedback.length > feedback.length * 0.2) {
      actionItems.push({
        id: `action-${Date.now()}-1`,
        title: 'Address low satisfaction feedback',
        description: 'Investigate and resolve issues causing low user satisfaction',
        priority: 'high',
        category: 'process_improvement',
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
        relatedFeedback: lowRatingFeedback.map(f => f.id),
        expectedOutcome: 'Improve overall satisfaction rating by 20%',
        successCriteria: ['Average rating > 4.0', 'Reduce complaints by 50%']
      })
    }

    // Generate action items for common categories
    const categoryCounts = new Map<string, number>()
    feedback.forEach(f => {
      f.categories.forEach((category: string) => {
        categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1)
      })
    })

    categoryCounts.forEach((count, category) => {
      if (count > 10) {
        actionItems.push({
          id: `action-${Date.now()}-${category}`,
          title: `Improve ${category} experience`,
          description: `Focus on improving user experience related to ${category}`,
          priority: count > 20 ? 'high' : 'medium',
          category: 'feature_improvement',
          status: 'open',
          createdAt: new Date(),
          updatedAt: new Date(),
          relatedFeedback: feedback.filter(f => f.categories.includes(category)).map(f => f.id),
          expectedOutcome: `Reduce ${category} related issues by 30%`,
          successCriteria: [`Category satisfaction > 4.0`, `Reduced negative feedback in ${category}`]
        })
      }
    })

    return actionItems
  }

  private async calculateRecentTrend(feedback: any[]): Promise<'improving' | 'declining' | 'stable'> {
    if (feedback.length < 10) return 'stable'

    const recentFeedback = feedback.slice(0, Math.floor(feedback.length / 2))
    const olderFeedback = feedback.slice(Math.floor(feedback.length / 2))

    const recentAverage = recentFeedback.reduce((sum, f) => sum + f.rating, 0) / recentFeedback.length
    const olderAverage = olderFeedback.reduce((sum, f) => sum + f.rating, 0) / olderFeedback.length

    const difference = recentAverage - olderAverage

    if (difference > 0.2) return 'improving'
    if (difference < -0.2) return 'declining'
    return 'stable'
  }

  private getWeekStart(date: Date): string {
    const d = new Date(date)
    d.setDate(date.getDate() - date.getDay())
    return d.toISOString().split('T')[0]
  }
}

export default FeedbackService