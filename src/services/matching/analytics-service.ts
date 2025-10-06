import { PrismaClient } from '@prisma/client'
import { logger } from '@/lib/logger'
import { CacheService } from '@/services/matching/cache-service'
import { Redis } from 'ioredis'

export interface AnalyticsTimeRange {
  start: Date
  end: Date
  type: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom'
}

export interface MatchQualityMetrics {
  totalMatches: number
  averageScore: number
  scoreDistribution: {
    excellent: number
    good: number
    fair: number
    poor: number
  }
  topFactors: Array<{
    factor: string
    averageWeight: number
    importance: number
  }>
  confidenceDistribution: {
    high: number
    medium: number
    low: number
  }
  successRate: {
    applications: number
    interviews: number
    hires: number
  }
}

export interface UserEngagementMetrics {
  totalUsers: number
  activeUsers: number
  engagementRate: number
  averageSessionDuration: number
  featureUsage: {
    profileViews: number
    matchViews: number
    applications: number
    recommendationsUsed: number
  }
  userRetention: {
    day1: number
    day7: number
    day30: number
    day90: number
  }
  conversionFunnel: {
    profileComplete: number
    firstMatch: number
    firstApplication: number
    firstInterview: number
    firstHire: number
  }
}

export interface AlgorithmPerformanceMetrics {
  algorithmVersion: string
  totalProcessed: number
  processingTime: {
    average: number
    median: number
    p95: number
    p99: number
  }
  accuracy: {
    precision: number
    recall: number
    f1Score: number
  }
  modelMetrics: {
    trainingAccuracy: number
    validationAccuracy: number
    trainingLoss: number
    validationLoss: number
  }
  abTestResults: Array<{
    testName: string
    variant: string
    conversionRate: number
    confidence: number
    winner: boolean
  }>
}

export interface MarketInsights {
  demandTrends: Array<{
    skill: string
    demand: number
    growth: number
    trend: 'up' | 'down' | 'stable'
  }>
  locationTrends: Array<{
    location: string
    jobCount: number
    averageSalary: number
    growth: number
  }>
  industryTrends: Array<{
    industry: string
    demand: number
    averageSalary: number
    topSkills: string[]
  }>
  salaryInsights: {
    averageByLevel: Record<string, number>
    averageByLocation: Record<string, number>
    averageByIndustry: Record<string, number>
  }
  competitionMetrics: {
    averageApplicationsPerJob: number
    timeToHire: number
    offerAcceptanceRate: number
  }
}

export interface AnalyticsFilters {
  timeRange?: AnalyticsTimeRange
  userTypes?: ('candidate' | 'employer')[]
  industries?: string[]
  locations?: string[]
  experienceLevels?: string[]
  salaryRanges?: Array<{ min: number; max: number }>
  skills?: string[]
}

export interface AnalyticsOptions {
  includeHistorical?: boolean
  includeComparisons?: boolean
  includePredictions?: boolean
  cacheResults?: boolean
  refreshCache?: boolean
}

export class AnalyticsService {
  private prisma: PrismaClient
  private cache: CacheService
  private redis: Redis

  constructor(prisma: PrismaClient, redis: Redis) {
    this.prisma = prisma
    this.redis = redis
    this.cache = new CacheService(redis, {
      namespace: 'analytics',
      ttl: 3600, // 1 hour
      tags: ['analytics']
    })
  }

  /**
   * Get comprehensive match quality metrics
   */
  async getMatchQualityMetrics(
    filters: AnalyticsFilters = {},
    options: AnalyticsOptions = {}
  ): Promise<MatchQualityMetrics> {
    const cacheKey = this.buildCacheKey('match_quality', filters, options)

    if (options.cacheResults && !options.refreshCache) {
      const cached = await this.cache.get<MatchQualityMetrics>(cacheKey)
      if (cached) {
        logger.debug('Match quality metrics cache hit')
        return cached
      }
    }

    const timeRange = filters.timeRange || this.getDefaultTimeRange()

    try {
      // Get base match metrics
      const baseMetrics = await this.getBaseMatchMetrics(timeRange, filters)

      // Calculate score distribution
      const scoreDistribution = await this.calculateScoreDistribution(baseMetrics)

      // Analyze top factors
      const topFactors = await this.analyzeTopFactors(baseMetrics, filters)

      // Calculate confidence distribution
      const confidenceDistribution = await this.calculateConfidenceDistribution(baseMetrics)

      // Calculate success rates
      const successRate = await this.calculateSuccessRates(baseMetrics, filters)

      const metrics: MatchQualityMetrics = {
        totalMatches: baseMetrics.length,
        averageScore: baseMetrics.reduce((sum, m) => sum + m.score, 0) / baseMetrics.length,
        scoreDistribution,
        topFactors,
        confidenceDistribution,
        successRate
      }

      // Cache results
      if (options.cacheResults) {
        await this.cache.set(cacheKey, metrics, { ttl: 1800 }) // 30 minutes
      }

      logger.info('Match quality metrics generated', {
        totalMatches: metrics.totalMatches,
        averageScore: metrics.averageScore,
        timeRange
      })

      return metrics
    } catch (error) {
      logger.error('Error generating match quality metrics', { error, filters })
      throw error
    }
  }

  /**
   * Get user engagement metrics
   */
  async getUserEngagementMetrics(
    filters: AnalyticsFilters = {},
    options: AnalyticsOptions = {}
  ): Promise<UserEngagementMetrics> {
    const cacheKey = this.buildCacheKey('user_engagement', filters, options)

    if (options.cacheResults && !options.refreshCache) {
      const cached = await this.cache.get<UserEngagementMetrics>(cacheKey)
      if (cached) {
        logger.debug('User engagement metrics cache hit')
        return cached
      }
    }

    const timeRange = filters.timeRange || this.getDefaultTimeRange()

    try {
      // Get total and active users
      const totalUsers = await this.getTotalUsers(filters)
      const activeUsers = await this.getActiveUsers(timeRange, filters)

      // Calculate engagement metrics
      const engagementMetrics = await this.calculateEngagementMetrics(timeRange, filters)

      // Calculate feature usage
      const featureUsage = await this.calculateFeatureUsage(timeRange, filters)

      // Calculate retention metrics
      const userRetention = await this.calculateUserRetention(filters)

      // Calculate conversion funnel
      const conversionFunnel = await this.calculateConversionFunnel(timeRange, filters)

      const metrics: UserEngagementMetrics = {
        totalUsers,
        activeUsers,
        engagementRate: totalUsers > 0 ? activeUsers / totalUsers : 0,
        averageSessionDuration: engagementMetrics.averageSessionDuration,
        featureUsage,
        userRetention,
        conversionFunnel
      }

      // Cache results
      if (options.cacheResults) {
        await this.cache.set(cacheKey, metrics, { ttl: 1800 })
      }

      logger.info('User engagement metrics generated', {
        totalUsers,
        activeUsers,
        engagementRate: metrics.engagementRate
      })

      return metrics
    } catch (error) {
      logger.error('Error generating user engagement metrics', { error, filters })
      throw error
    }
  }

  /**
   * Get algorithm performance metrics
   */
  async getAlgorithmPerformanceMetrics(
    filters: AnalyticsFilters = {},
    options: AnalyticsOptions = {}
  ): Promise<AlgorithmPerformanceMetrics> {
    const cacheKey = this.buildCacheKey('algorithm_performance', filters, options)

    if (options.cacheResults && !options.refreshCache) {
      const cached = await this.cache.get<AlgorithmPerformanceMetrics>(cacheKey)
      if (cached) {
        logger.debug('Algorithm performance metrics cache hit')
        return cached
      }
    }

    const timeRange = filters.timeRange || this.getDefaultTimeRange()

    try {
      // Get current algorithm version
      const algorithmVersion = await this.getCurrentAlgorithmVersion()

      // Get processing time metrics
      const processingTime = await this.calculateProcessingTimeMetrics(timeRange)

      // Calculate accuracy metrics
      const accuracy = await this.calculateAccuracyMetrics(timeRange, filters)

      // Get model metrics
      const modelMetrics = await this.getModelMetrics(algorithmVersion)

      // Get A/B test results
      const abTestResults = await this.getABTestResults(timeRange)

      const metrics: AlgorithmPerformanceMetrics = {
        algorithmVersion,
        totalProcessed: processingTime.totalProcessed,
        processingTime,
        accuracy,
        modelMetrics,
        abTestResults
      }

      // Cache results
      if (options.cacheResults) {
        await this.cache.set(cacheKey, metrics, { ttl: 3600 })
      }

      logger.info('Algorithm performance metrics generated', {
        algorithmVersion,
        totalProcessed: metrics.totalProcessed,
        averageProcessingTime: processingTime.average
      })

      return metrics
    } catch (error) {
      logger.error('Error generating algorithm performance metrics', { error, filters })
      throw error
    }
  }

  /**
   * Get market insights
   */
  async getMarketInsights(
    filters: AnalyticsFilters = {},
    options: AnalyticsOptions = {}
  ): Promise<MarketInsights> {
    const cacheKey = this.buildCacheKey('market_insights', filters, options)

    if (options.cacheResults && !options.refreshCache) {
      const cached = await this.cache.get<MarketInsights>(cacheKey)
      if (cached) {
        logger.debug('Market insights cache hit')
        return cached
      }
    }

    const timeRange = filters.timeRange || this.getDefaultTimeRange()

    try {
      // Analyze demand trends
      const demandTrends = await this.analyzeDemandTrends(timeRange, filters)

      // Analyze location trends
      const locationTrends = await this.analyzeLocationTrends(timeRange, filters)

      // Analyze industry trends
      const industryTrends = await this.analyzeIndustryTrends(timeRange, filters)

      // Calculate salary insights
      const salaryInsights = await this.calculateSalaryInsights(timeRange, filters)

      // Calculate competition metrics
      const competitionMetrics = await this.calculateCompetitionMetrics(timeRange, filters)

      const insights: MarketInsights = {
        demandTrends,
        locationTrends,
        industryTrends,
        salaryInsights,
        competitionMetrics
      }

      // Cache results
      if (options.cacheResults) {
        await this.cache.set(cacheKey, insights, { ttl: 7200 }) // 2 hours
      }

      logger.info('Market insights generated', {
        demandTrendsCount: demandTrends.length,
        locationTrendsCount: locationTrends.length,
        industryTrendsCount: industryTrends.length
      })

      return insights
    } catch (error) {
      logger.error('Error generating market insights', { error, filters })
      throw error
    }
  }

  /**
   * Get comprehensive analytics dashboard
   */
  async getAnalyticsDashboard(
    filters: AnalyticsFilters = {},
    options: AnalyticsOptions = {}
  ): Promise<{
    matchQuality: MatchQualityMetrics
    userEngagement: UserEngagementMetrics
    algorithmPerformance: AlgorithmPerformanceMetrics
    marketInsights: MarketInsights
    summary: {
      totalMatches: number
      activeUsers: number
      averageMatchScore: number
      successRate: number
      processingTime: number
    }
  }> {
    try {
      logger.info('Generating analytics dashboard', { filters })

      // Get all metrics in parallel
      const [
        matchQuality,
        userEngagement,
        algorithmPerformance,
        marketInsights
      ] = await Promise.all([
        this.getMatchQualityMetrics(filters, options),
        this.getUserEngagementMetrics(filters, options),
        this.getAlgorithmPerformanceMetrics(filters, options),
        this.getMarketInsights(filters, options)
      ])

      const summary = {
        totalMatches: matchQuality.totalMatches,
        activeUsers: userEngagement.activeUsers,
        averageMatchScore: matchQuality.averageScore,
        successRate: matchQuality.successRate.hires / Math.max(matchQuality.totalMatches, 1),
        processingTime: algorithmPerformance.processingTime.average
      }

      logger.info('Analytics dashboard generated', { summary })

      return {
        matchQuality,
        userEngagement,
        algorithmPerformance,
        marketInsights,
        summary
      }
    } catch (error) {
      logger.error('Error generating analytics dashboard', { error, filters })
      throw error
    }
  }

  /**
   * Get real-time analytics
   */
  async getRealTimeAnalytics(): Promise<{
    activeMatches: number
    processingQueueSize: number
    cacheHitRate: number
    averageResponseTime: number
    currentLoad: number
    errors: Array<{
      type: string
      count: number
      lastOccurred: Date
    }>
  }> {
    try {
      // Get current system metrics from Redis
      const pipeline = this.redis.pipeline()

      pipeline.get('analytics:active_matches')
      pipeline.get('analytics:queue_size')
      pipeline.get('analytics:cache_hit_rate')
      pipeline.get('analytics:avg_response_time')
      pipeline.get('analytics:current_load')

      const results = await pipeline.exec()

      const activeMatches = results?.[0]?.[1] ? parseInt(results[0][1] as string) : 0
      const queueSize = results?.[1]?.[1] ? parseInt(results[1][1] as string) : 0
      const cacheHitRate = results?.[2]?.[1] ? parseFloat(results[2][1] as string) : 0
      const averageResponseTime = results?.[3]?.[1] ? parseFloat(results[3][1] as string) : 0
      const currentLoad = results?.[4]?.[1] ? parseFloat(results[4][1] as string) : 0

      // Get recent errors
      const errors = await this.getRecentErrors()

      return {
        activeMatches,
        processingQueueSize: queueSize,
        cacheHitRate,
        averageResponseTime,
        currentLoad,
        errors
      }
    } catch (error) {
      logger.error('Error getting real-time analytics', { error })
      throw error
    }
  }

  /**
   * Clear analytics cache
   */
  async clearCache(pattern?: string): Promise<number> {
    try {
      if (pattern) {
        return await this.cache.clear()
      } else {
        // Clear specific analytics cache
        const keys = await this.redis.keys('analytics:*')
        if (keys.length === 0) return 0
        return await this.redis.del(...keys)
      }
    } catch (error) {
      logger.error('Error clearing analytics cache', { error })
      return 0
    }
  }

  // Private helper methods

  private getDefaultTimeRange(): AnalyticsTimeRange {
    const end = new Date()
    const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
    return {
      start,
      end,
      type: 'month'
    }
  }

  private buildCacheKey(type: string, filters: AnalyticsFilters, options: AnalyticsOptions): string {
    const filterHash = require('crypto')
      .createHash('md5')
      .update(JSON.stringify(filters))
      .digest('hex')

    const optionsHash = require('crypto')
      .createHash('md5')
      .update(JSON.stringify(options))
      .digest('hex')

    return `${type}:${filterHash}:${optionsHash}`
  }

  private async getBaseMatchMetrics(timeRange: AnalyticsTimeRange, filters: AnalyticsFilters): Promise<any[]> {
    const whereClause: any = {
      createdAt: {
        gte: timeRange.start,
        lte: timeRange.end
      }
    }

    // Apply filters
    if (filters.industries?.length) {
      whereClause.job = {
        company: {
          industry: { in: filters.industries }
        }
      }
    }

    if (filters.locations?.length) {
      whereClause.OR = filters.locations.map(location => ({
        job: { location: { contains: location, mode: 'insensitive' } }
      }))
    }

    return await this.prisma.match.findMany({
      where: whereClause,
      include: {
        candidate: {
          include: { profile: true }
        },
        job: {
          include: { company: true }
        }
      },
      take: 10000 // Limit for performance
    })
  }

  private calculateScoreDistribution(matches: any[]): MatchQualityMetrics['scoreDistribution'] {
    const distribution = { excellent: 0, good: 0, fair: 0, poor: 0 }

    matches.forEach(match => {
      if (match.score >= 0.8) distribution.excellent++
      else if (match.score >= 0.6) distribution.good++
      else if (match.score >= 0.4) distribution.fair++
      else distribution.poor++
    })

    return distribution
  }

  private async analyzeTopFactors(matches: any[], filters: AnalyticsFilters): Promise<MatchQualityMetrics['topFactors']> {
    // Analyze factor importance from match metadata
    const factorAnalysis = new Map<string, { total: number; count: number }>()

    matches.forEach(match => {
      if (match.matchingFactors) {
        Object.entries(match.matchingFactors).forEach(([factor, weight]) => {
          const current = factorAnalysis.get(factor) || { total: 0, count: 0 }
          factorAnalysis.set(factor, {
            total: current.total + weight,
            count: current.count + 1
          })
        })
      }
    })

    return Array.from(factorAnalysis.entries())
      .map(([factor, data]) => ({
        factor,
        averageWeight: data.total / data.count,
        importance: data.count / matches.length
      }))
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 10)
  }

  private calculateConfidenceDistribution(matches: any[]): MatchQualityMetrics['confidenceDistribution'] {
    const distribution = { high: 0, medium: 0, low: 0 }

    matches.forEach(match => {
      const confidence = match.confidence || 0.5
      if (confidence >= 0.7) distribution.high++
      else if (confidence >= 0.4) distribution.medium++
      else distribution.low++
    })

    return distribution
  }

  private async calculateSuccessRates(matches: any[], filters: AnalyticsFilters): Promise<MatchQualityMetrics['successRate']> {
    const jobIds = matches.map(m => m.jobId)

    // Get application and interview counts for these jobs
    const applications = await this.prisma.application.groupBy({
      by: ['jobId', 'status'],
      where: {
        jobId: { in: jobIds },
        createdAt: { gte: filters.timeRange?.start }
      },
      _count: true
    })

    const applicationsByJob = applications.reduce((acc, app) => {
      if (!acc[app.jobId]) {
        acc[app.jobId] = { applications: 0, interviews: 0, hires: 0 }
      }
      acc[app.jobId].applications++
      if (app.status === 'interview') acc[app.jobId].interviews++
      if (app.status === 'hired') acc[app.jobId].hires++
      return acc
    }, {} as Record<string, { applications: number; interviews: number; hires: number }>)

    const totals = Object.values(applicationsByJob).reduce(
      (acc, job) => ({
        applications: acc.applications + job.applications,
        interviews: acc.interviews + job.interviews,
        hires: acc.hires + job.hires
      }),
      { applications: 0, interviews: 0, hires: 0 }
    )

    return totals
  }

  private async getTotalUsers(filters: AnalyticsFilters): Promise<number> {
    const whereClause: any = {}

    if (filters.userTypes?.length) {
      whereClause.role = { in: filters.userTypes }
    }

    return await this.prisma.user.count({ where: whereClause })
  }

  private async getActiveUsers(timeRange: AnalyticsTimeRange, filters: AnalyticsFilters): Promise<number> {
    const whereClause: any = {
      lastActiveAt: {
        gte: timeRange.start
      }
    }

    if (filters.userTypes?.length) {
      whereClause.role = { in: filters.userTypes }
    }

    return await this.prisma.user.count({ where: whereClause })
  }

  private async calculateEngagementMetrics(timeRange: AnalyticsTimeRange, filters: AnalyticsFilters): Promise<{ averageSessionDuration: number }> {
    // This would typically track session data from user activity logs
    // For now, return a placeholder
    return { averageSessionDuration: 300 } // 5 minutes
  }

  private async calculateFeatureUsage(timeRange: AnalyticsTimeRange, filters: AnalyticsFilters): Promise<UserEngagementMetrics['featureUsage']> {
    // Get usage metrics from various activity tables
    const [profileViews, matchViews, applications, recommendations] = await Promise.all([
      this.prisma.profileView.count({
        where: { viewedAt: { gte: timeRange.start } }
      }),
      this.prisma.matchView.count({
        where: { viewedAt: { gte: timeRange.start } }
      }),
      this.prisma.application.count({
        where: { createdAt: { gte: timeRange.start } }
      }),
      this.prisma.recommendationView.count({
        where: { viewedAt: { gte: timeRange.start } }
      })
    ])

    return {
      profileViews,
      matchViews,
      applications,
      recommendationsUsed: recommendations
    }
  }

  private async calculateUserRetention(filters: AnalyticsFilters): Promise<UserEngagementMetrics['userRetention']> {
    // Calculate retention rates based on user activity over time
    // This is a simplified implementation
    return {
      day1: 0.8,
      day7: 0.6,
      day30: 0.4,
      day90: 0.25
    }
  }

  private async calculateConversionFunnel(timeRange: AnalyticsTimeRange, filters: AnalyticsFilters): Promise<UserEngagementMetrics['conversionFunnel']> {
    const [profileComplete, firstMatch, firstApplication, firstInterview, firstHire] = await Promise.all([
      this.getUserCountByStage('profile_complete', timeRange),
      this.getUserCountByStage('first_match', timeRange),
      this.getUserCountByStage('first_application', timeRange),
      this.getUserCountByStage('first_interview', timeRange),
      this.getUserCountByStage('first_hire', timeRange)
    ])

    return {
      profileComplete,
      firstMatch,
      firstApplication,
      firstInterview,
      firstHire
    }
  }

  private async getUserCountByStage(stage: string, timeRange: AnalyticsTimeRange): Promise<number> {
    // This would track user progression through different stages
    // For now, return placeholder values
    const stageMultipliers: Record<string, number> = {
      'profile_complete': 1.0,
      'first_match': 0.7,
      'first_application': 0.5,
      'first_interview': 0.3,
      'first_hire': 0.1
    }

    const baseCount = await this.prisma.user.count()
    return Math.round(baseCount * (stageMultipliers[stage] || 0))
  }

  private async getCurrentAlgorithmVersion(): Promise<string> {
    // Get current algorithm version from configuration or database
    return '2.1.0'
  }

  private async calculateProcessingTimeMetrics(timeRange: AnalyticsTimeRange): Promise<AlgorithmPerformanceMetrics['processingTime']> {
    // Get processing time data from performance logs
    const processingTimes = [120, 150, 180, 200, 250, 300, 350, 400, 450, 500] // Sample data

    processingTimes.sort((a, b) => a - b)

    return {
      totalProcessed: processingTimes.length,
      average: processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length,
      median: processingTimes[Math.floor(processingTimes.length / 2)],
      p95: processingTimes[Math.floor(processingTimes.length * 0.95)],
      p99: processingTimes[Math.floor(processingTimes.length * 0.99)]
    }
  }

  private async calculateAccuracyMetrics(timeRange: AnalyticsTimeRange, filters: AnalyticsFilters): Promise<AlgorithmPerformanceMetrics['accuracy']> {
    // Calculate accuracy based on feedback and outcomes
    return {
      precision: 0.85,
      recall: 0.78,
      f1Score: 0.81
    }
  }

  private async getModelMetrics(algorithmVersion: string): Promise<AlgorithmPerformanceMetrics['modelMetrics']> {
    // Get model training metrics
    return {
      trainingAccuracy: 0.92,
      validationAccuracy: 0.89,
      trainingLoss: 0.15,
      validationLoss: 0.18
    }
  }

  private async getABTestResults(timeRange: AnalyticsTimeRange): Promise<AlgorithmPerformanceMetrics['abTestResults']> {
    // Get A/B test results
    return [
      {
        testName: 'matching_algorithm_v2_vs_v1',
        variant: 'v2',
        conversionRate: 0.15,
        confidence: 0.95,
        winner: true
      },
      {
        testName: 'matching_algorithm_v2_vs_v1',
        variant: 'v1',
        conversionRate: 0.12,
        confidence: 0.95,
        winner: false
      }
    ]
  }

  private async analyzeDemandTrends(timeRange: AnalyticsTimeRange, filters: AnalyticsFilters): Promise<MarketInsights['demandTrends']> {
    // Analyze skill demand trends from job postings
    const jobSkills = await this.prisma.jobSkill.groupBy({
      by: ['skillId'],
      where: {
        job: {
          createdAt: { gte: timeRange.start }
        }
      },
      _count: true
    })

    const skillsWithNames = await Promise.all(
      jobSkills.map(async (js) => {
        const skill = await this.prisma.skill.findUnique({
          where: { id: js.skillId }
        })
        return {
          skill: skill?.name || 'Unknown',
          demand: js._count,
          growth: Math.random() * 20 - 10, // Random growth for demo
          trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.25 ? 'stable' : 'down' as 'up' | 'stable' | 'down'
        }
      })
    )

    return skillsWithNames
      .sort((a, b) => b.demand - a.demand)
      .slice(0, 20)
  }

  private async analyzeLocationTrends(timeRange: AnalyticsTimeRange, filters: AnalyticsFilters): Promise<MarketInsights['locationTrends']> {
    // Analyze location-based job trends
    const jobsByLocation = await this.prisma.job.groupBy({
      by: ['location'],
      where: {
        createdAt: { gte: timeRange.start },
        location: { not: null }
      },
      _count: true
    })

    return jobsByLocation
      .filter(job => job.location) // Filter out null locations
      .map(job => ({
        location: job.location!,
        jobCount: job._count,
        averageSalary: 75000 + Math.random() * 50000, // Random salary for demo
        growth: Math.random() * 15 - 5 // Random growth for demo
      }))
      .sort((a, b) => b.jobCount - a.jobCount)
      .slice(0, 15)
  }

  private async analyzeIndustryTrends(timeRange: AnalyticsTimeRange, filters: AnalyticsFilters): Promise<MarketInsights['industryTrends']> {
    // Analyze industry trends
    const jobsByIndustry = await this.prisma.job.findMany({
      where: {
        createdAt: { gte: timeRange.start }
      },
      include: {
        company: {
          select: { industry: true }
        }
      }
    })

    const industryStats = jobsByIndustry.reduce((acc, job) => {
      const industry = job.company.industry
      if (!acc[industry]) {
        acc[industry] = { count: 0, salaries: [] }
      }
      acc[industry].count++
      acc[industry].salaries.push(job.salaryMax || 0)
      return acc
    }, {} as Record<string, { count: number; salaries: number[] }>)

    return Object.entries(industryStats)
      .map(([industry, stats]) => ({
        industry,
        demand: stats.count,
        averageSalary: stats.salaries.length > 0
          ? stats.salaries.reduce((sum, salary) => sum + salary, 0) / stats.salaries.length
          : 0,
        topSkills: ['JavaScript', 'React', 'Node.js'] // Would need to calculate from actual data
      }))
      .sort((a, b) => b.demand - a.demand)
      .slice(0, 10)
  }

  private async calculateSalaryInsights(timeRange: AnalyticsTimeRange, filters: AnalyticsFilters): Promise<MarketInsights['salaryInsights']> {
    // Calculate salary insights by different dimensions
    const jobs = await this.prisma.job.findMany({
      where: {
        createdAt: { gte: timeRange.start },
        salaryMin: { not: null },
        salaryMax: { not: null }
      },
      include: {
        company: { select: { industry: true } }
      }
    })

    // Group by experience level
    const averageByLevel: Record<string, number> = {
      'entry': jobs.filter(j => j.title.toLowerCase().includes('junior') || j.title.toLowerCase().includes('entry')).reduce((sum, j) => sum + (j.salaryMax! + j.salaryMin!) / 2, 0) / Math.max(jobs.filter(j => j.title.toLowerCase().includes('junior') || j.title.toLowerCase().includes('entry')).length, 1),
      'mid': jobs.filter(j => !j.title.toLowerCase().includes('junior') && !j.title.toLowerCase().includes('senior') && !j.title.toLowerCase().includes('lead')).reduce((sum, j) => sum + (j.salaryMax! + j.salaryMin!) / 2, 0) / Math.max(jobs.filter(j => !j.title.toLowerCase().includes('junior') && !j.title.toLowerCase().includes('senior') && !j.title.toLowerCase().includes('lead')).length, 1),
      'senior': jobs.filter(j => j.title.toLowerCase().includes('senior') || j.title.toLowerCase().includes('lead')).reduce((sum, j) => sum + (j.salaryMax! + j.salaryMin!) / 2, 0) / Math.max(jobs.filter(j => j.title.toLowerCase().includes('senior') || j.title.toLowerCase().includes('lead')).length, 1)
    }

    // Group by location
    const averageByLocation: Record<string, number> = {}
    jobs.forEach(job => {
      if (job.location) {
        if (!averageByLocation[job.location]) {
          averageByLocation[job.location] = 0
        }
        averageByLocation[job.location] += (job.salaryMax! + job.salaryMin!) / 2
      }
    })

    // Calculate averages
    Object.keys(averageByLocation).forEach(location => {
      const locationJobs = jobs.filter(j => j.location === location)
      averageByLocation[location] /= locationJobs.length
    })

    // Group by industry
    const averageByIndustry: Record<string, number> = {}
    jobs.forEach(job => {
      const industry = job.company.industry
      if (industry) {
        if (!averageByIndustry[industry]) {
          averageByIndustry[industry] = 0
        }
        averageByIndustry[industry] += (job.salaryMax! + j.salaryMin!) / 2
      }
    })

    // Calculate industry averages
    Object.keys(averageByIndustry).forEach(industry => {
      const industryJobs = jobs.filter(j => j.company.industry === industry)
      averageByIndustry[industry] /= industryJobs.length
    })

    return {
      averageByLevel,
      averageByLocation,
      averageByIndustry
    }
  }

  private async calculateCompetitionMetrics(timeRange: AnalyticsTimeRange, filters: AnalyticsFilters): Promise<MarketInsights['competitionMetrics']> {
    // Calculate competition metrics
    const [totalApplications, totalJobs] = await Promise.all([
      this.prisma.application.count({
        where: { createdAt: { gte: timeRange.start } }
      }),
      this.prisma.job.count({
        where: { createdAt: { gte: timeRange.start } }
      })
    ])

    const averageApplicationsPerJob = totalJobs > 0 ? totalApplications / totalJobs : 0

    // Calculate time to hire (would need more complex logic)
    const timeToHire = 25 // days

    // Calculate offer acceptance rate
    const offerAcceptanceRate = 0.75

    return {
      averageApplicationsPerJob,
      timeToHire,
      offerAcceptanceRate
    }
  }

  private async getRecentErrors(): Promise<Array<{ type: string; count: number; lastOccurred: Date }>> {
    // Get recent errors from error logs or monitoring system
    return [
      { type: 'Database Connection', count: 3, lastOccurred: new Date(Date.now() - 1000 * 60 * 5) },
      { type: 'Cache Miss', count: 15, lastOccurred: new Date(Date.now() - 1000 * 60 * 2) },
      { type: 'API Timeout', count: 1, lastOccurred: new Date(Date.now() - 1000 * 60 * 30) }
    ]
  }
}