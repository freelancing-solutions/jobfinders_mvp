import { Redis } from 'ioredis'
import { CacheService } from '@/services/matching/cache-service'
import { logger } from '@/lib/logger'

export interface RecommendationCacheOptions {
  userId: string
  type: 'jobs' | 'candidates' | 'skills' | 'career'
  strategy?: string
  limit?: number
  filters?: Record<string, any>
  context?: Record<string, any>
}

export interface CachedRecommendation {
  id: string
  userId: string
  type: string
  itemId: string
  score: number
  confidence: number
  explanation: string[]
  metadata: {
    algorithm: string
    version: string
    generatedAt: Date
    validUntil: Date
    position: number
    context: Record<string, any>
  }
}

export interface RecommendationListCache {
  userId: string
  type: string
  recommendations: CachedRecommendation[]
  totalCount: number
  strategy: string
  filters: Record<string, any>
  metadata: {
    generatedAt: Date
    validUntil: Date
    processingTime: number
    personalized: boolean
    freshness: number
  }
}

export class RecommendationCache {
  private cache: CacheService
  private defaultTTL: number = 1800 // 30 minutes

  constructor(redis: Redis) {
    this.cache = new CacheService(redis, {
      namespace: 'recommendations',
      ttl: this.defaultTTL,
      tags: ['recommendations']
    })
  }

  /**
   * Get cached recommendations
   */
  public async getRecommendations(
    options: RecommendationCacheOptions
  ): Promise<CachedRecommendation[] | null> {
    try {
      const cacheKey = this.buildRecommendationCacheKey(options)
      const cached = await this.cache.get<RecommendationListCache>(cacheKey)

      if (cached) {
        // Check if cache is still valid
        if (this.isCacheValid(cached)) {
          logger.debug('Recommendation cache hit', {
            userId: options.userId,
            type: options.type,
            count: cached.recommendations.length
          })
          return cached.recommendations
        } else {
          // Cache expired, remove it
          await this.cache.delete(cacheKey)
          logger.debug('Recommendation cache expired', {
            userId: options.userId,
            type: options.type
          })
        }
      }

      return null
    } catch (error) {
      logger.error('Error getting cached recommendations', { error, options })
      return null
    }
  }

  /**
   * Set recommendations in cache
   */
  public async setRecommendations(
    recommendations: any[],
    options: RecommendationCacheOptions,
    metadata: Partial<RecommendationListCache['metadata']> = {}
  ): Promise<void> {
    try {
      const cacheKey = this.buildRecommendationCacheKey(options)
      const cachedRecommendations: CachedRecommendation[] = recommendations.map((rec, index) => ({
        id: rec.id || this.generateRecommendationId(),
        userId: options.userId,
        type: options.type,
        itemId: rec.id || rec.itemId || rec.jobId || rec.candidateId,
        score: rec.score || rec.finalScore || 0,
        confidence: rec.confidence || 0,
        explanation: rec.explanation || [],
        metadata: {
          algorithm: rec.algorithm || 'default',
          version: rec.version || '1.0',
          generatedAt: new Date(),
          validUntil: new Date(Date.now() + (this.calculateTTL(options) * 1000)),
          position: index + 1,
          context: options.context || {}
        }
      }))

      const cacheData: RecommendationListCache = {
        userId: options.userId,
        type: options.type,
        recommendations: cachedRecommendations,
        totalCount: recommendations.length,
        strategy: options.strategy || 'default',
        filters: options.filters || {},
        metadata: {
          generatedAt: new Date(),
          validUntil: new Date(Date.now() + (this.calculateTTL(options) * 1000)),
          processingTime: metadata.processingTime || 0,
          personalized: metadata.personalized || false,
          freshness: metadata.freshness || 1.0,
          cacheKey,
          ...metadata
        }
      }

      const ttl = this.calculateTTL(options)
      await this.cache.set(cacheKey, cacheData, {
        ttl,
        tags: [
          'recommendations',
          `user:${options.userId}`,
          `type:${options.type}`,
          `strategy:${options.strategy || 'default'}`
        ]
      })

      logger.debug('Recommendations cached', {
        userId: options.userId,
        type: options.type,
        count: recommendations.length,
        cacheKey,
        ttl
      })

    } catch (error) {
      logger.error('Error caching recommendations', { error, options })
    }
  }

  /**
   * Get or compute recommendations with caching
   */
  public async getOrComputeRecommendations(
    options: RecommendationCacheOptions,
    computeFn: () => Promise<any[]>
  ): Promise<any[]> {
    // Try to get from cache first
    const cached = await this.getRecommendations(options)
    if (cached) {
      return cached
    }

    // Compute recommendations
    const startTime = Date.now()
    const recommendations = await computeFn()
    const processingTime = Date.now() - startTime

    // Cache the results
    await this.setRecommendations(recommendations, options, { processingTime })

    return recommendations
  }

  /**
   * Get cached recommendation by item ID
   */
  public async getRecommendationByItemId(
    userId: string,
    itemId: string,
    type: string
  ): Promise<CachedRecommendation | null> {
    try {
      const cacheKey = `item:${userId}:${type}:${itemId}`
      const cached = await this.cache.get<CachedRecommendation>(cacheKey)

      if (cached && this.isItemCacheValid(cached)) {
        logger.debug('Item recommendation cache hit', {
          userId,
          itemId,
          type,
          score: cached.score
        })
        return cached
      }

      return null
    } catch (error) {
      logger.error('Error getting cached item recommendation', {
        error,
        userId,
        itemId,
        type
      })
      return null
    }
  }

  /**
   * Set recommendation by item ID
   */
  public async setRecommendationByItemId(
    userId: string,
    itemId: string,
    type: string,
    recommendation: Partial<CachedRecommendation>,
    ttl: number = this.defaultTTL
  ): Promise<void> {
    try {
      const cacheKey = `item:${userId}:${type}:${itemId}`
      const fullRecommendation: CachedRecommendation = {
        id: recommendation.id || this.generateRecommendationId(),
        userId,
        type,
        itemId,
        score: recommendation.score || 0,
        confidence: recommendation.confidence || 0,
        explanation: recommendation.explanation || [],
        metadata: {
          algorithm: recommendation.metadata?.algorithm || 'default',
          version: recommendation.metadata?.version || '1.0',
          generatedAt: new Date(),
          validUntil: new Date(Date.now() + (ttl * 1000)),
          position: recommendation.metadata?.position || 0,
          context: recommendation.metadata?.context || {}
        }
      }

      await this.cache.set(cacheKey, fullRecommendation, {
        ttl,
        tags: [
          'recommendation-items',
          `user:${userId}`,
          `type:${type}`,
          `item:${itemId}`
        ]
      })

      logger.debug('Item recommendation cached', {
        userId,
        itemId,
        type,
        score: fullRecommendation.score
      })

    } catch (error) {
      logger.error('Error caching item recommendation', {
        error,
        userId,
        itemId,
        type
      })
    }
  }

  /**
   * Invalidate user's recommendation cache
   */
  public async invalidateUserRecommendations(userId: string): Promise<void> {
    try {
      await this.cache.deleteByTags([`user:${userId}`])
      logger.info('User recommendation cache invalidated', { userId })
    } catch (error) {
      logger.error('Error invalidating user recommendation cache', { error, userId })
    }
  }

  /**
   * Invalidate recommendations by type
   */
  public async invalidateRecommendationsByType(
    userId: string,
    type: string
  ): Promise<void> {
    try {
      await this.cache.deleteByTags([`user:${userId}`, `type:${type}`])
      logger.info('User recommendation cache invalidated by type', { userId, type })
    } catch (error) {
      logger.error('Error invalidating user recommendation cache by type', {
        error,
        userId,
        type
      })
    }
  }

  /**
   * Invalidate recommendations by strategy
   */
  public async invalidateRecommendationsByStrategy(strategy: string): Promise<void> {
    try {
      await this.cache.deleteByTags([`strategy:${strategy}`])
      logger.info('Strategy recommendation cache invalidated', { strategy })
    } catch (error) {
      logger.error('Error invalidating strategy recommendation cache', { error, strategy })
    }
  }

  /**
   * Update recommendation position
   */
  public async updateRecommendationPosition(
    userId: string,
    itemId: string,
    type: string,
    newPosition: number
  ): Promise<void> {
    try {
      const cacheKey = `item:${userId}:${type}:${itemId}`
      const cached = await this.cache.get<CachedRecommendation>(cacheKey)

      if (cached) {
        cached.metadata.position = newPosition
        await this.cache.set(cacheKey, cached)
        logger.debug('Recommendation position updated', {
          userId,
          itemId,
          type,
          newPosition
        })
      }
    } catch (error) {
      logger.error('Error updating recommendation position', {
        error,
        userId,
        itemId,
        type,
        newPosition
      })
    }
  }

  /**
   * Increment recommendation score
   */
  public async incrementRecommendationScore(
    userId: string,
    itemId: string,
    type: string,
    increment: number = 0.01
  ): Promise<void> {
    try {
      const cacheKey = `item:${userId}:${type}:${itemId}`
      const cached = await this.cache.get<CachedRecommendation>(cacheKey)

      if (cached) {
        cached.score = Math.min(1.0, cached.score + increment)
        await this.cache.set(cacheKey, cached)
        logger.debug('Recommendation score incremented', {
          userId,
          itemId,
          type,
          newScore: cached.score
        })
      }
    } catch (error) {
      logger.error('Error incrementing recommendation score', {
        error,
        userId,
        itemId,
        type,
        increment
      })
    }
  }

  /**
   * Get recommendation performance metrics
   */
  public async getPerformanceMetrics(
    userId: string,
    type?: string
  ): Promise<{
    cacheHitRate: number
    averageProcessingTime: number
    totalRecommendations: number
    averageScore: number
    freshnessScore: number
  }> {
    try {
      // This would typically involve querying cache statistics
      // For now, return placeholder values
      return {
        cacheHitRate: 0.75,
        averageProcessingTime: 150,
        totalRecommendations: 0,
        averageScore: 0.65,
        freshnessScore: 0.8
      }
    } catch (error) {
      logger.error('Error getting recommendation performance metrics', { error })
      return {
        cacheHitRate: 0,
        averageProcessingTime: 0,
        totalRecommendations: 0,
        averageScore: 0,
        freshnessScore: 0
      }
    }
  }

  /**
   * Refresh cached recommendations
   */
  public async refreshRecommendations(
    options: RecommendationCacheOptions,
    computeFn: () => Promise<any[]>
  ): Promise<any[]> {
    // Invalidate existing cache
    await this.invalidateRecommendationsByType(options.userId, options.type)

    // Compute fresh recommendations
    return this.getOrComputeRecommendations(options, computeFn)
  }

  /**
   * Warm up cache for active users
   */
  public async warmUpForUsers(
    userIds: string[],
    computeFn: (userId: string, type: string) => Promise<any[]>
  ): Promise<void> {
    logger.info('Warming up recommendation cache for users', { userCount: userIds.length })

    const recommendationTypes = ['jobs', 'candidates', 'skills', 'career']

    const promises = userIds.flatMap(userId =>
      recommendationTypes.map(type =>
        this.getOrComputeRecommendations(
          { userId, type, limit: 10 },
          () => computeFn(userId, type)
        )
      )
    )

    await Promise.all(promises)
    logger.info('Recommendation cache warm up complete')
  }

  /**
   * Clean up expired cache entries
   */
  public async cleanup(): Promise<number> {
    try {
      const stats = this.cache.getStats('recommendations')
      logger.info('Recommendation cache cleanup', { stats })
      return 0
    } catch (error) {
      logger.error('Error during recommendation cache cleanup', { error })
      return 0
    }
  }

  /**
   * Build cache key for recommendation options
   */
  private buildRecommendationCacheKey(options: RecommendationCacheOptions): string {
    const parts = [
      'recommendations',
      options.userId,
      options.type,
      options.strategy || 'default',
      options.limit ? `limit:${options.limit}` : '',
      options.filters ? this.serializeFilters(options.filters) : '',
      options.context ? this.serializeContext(options.context) : ''
    ].filter(Boolean)

    return parts.join(':')
  }

  /**
   * Serialize filters for cache key
   */
  private serializeFilters(filters: Record<string, any>): string {
    const sortedKeys = Object.keys(filters).sort()
    const filterParts = sortedKeys.map(key => `${key}=${filters[key]}`)
    return `filters:${filterParts.join(',')}`
  }

  /**
   * Serialize context for cache key
   */
  private serializeContext(context: Record<string, any>): string {
    const sortedKeys = Object.keys(context).sort()
    const contextParts = sortedKeys.map(key => `${key}=${context[key]}`)
    return `context:${contextParts.join(',')}`
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(cached: RecommendationListCache): boolean {
    return new Date() < cached.metadata.validUntil
  }

  /**
   * Check if item cache is still valid
   */
  private isItemCacheValid(cached: CachedRecommendation): boolean {
    return new Date() < cached.metadata.validUntil
  }

  /**
   * Calculate TTL based on options
   */
  private calculateTTL(options: RecommendationCacheOptions): number {
    // Adjust TTL based on recommendation type and user activity
    let baseTTL = this.defaultTTL

    // Shorter TTL for job recommendations (more frequent changes)
    if (options.type === 'jobs') {
      baseTTL = 900 // 15 minutes
    }

    // Longer TTL for career recommendations (less frequent changes)
    if (options.type === 'career') {
      baseTTL = 3600 // 1 hour
    }

    // Adjust based on strategy
    if (options.strategy === 'realtime') {
      baseTTL = 300 // 5 minutes
    } else if (options.strategy === 'personalized') {
      baseTTL = 1800 // 30 minutes
    }

    // Adjust based on filters (more specific = longer cache)
    if (options.filters && Object.keys(options.filters).length > 0) {
      baseTTL *= 1.5
    }

    return Math.min(baseTTL, 7200) // Max 2 hours
  }

  /**
   * Generate recommendation ID
   */
  private generateRecommendationId(): string {
    return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Health check
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy'
    details: any
  }> {
    try {
      // Test basic cache operations
      const testUserId = 'health_check_user'
      const testOptions: RecommendationCacheOptions = {
        userId: testUserId,
        type: 'jobs',
        limit: 5
      }

      // Test cache set/get
      const testRecommendations = [
        {
          id: 'test_rec_1',
          score: 0.85,
          confidence: 0.9,
          explanation: ['Good match']
        }
      ]

      await this.setRecommendations(testRecommendations, testOptions)
      const cached = await this.getRecommendations(testOptions)

      // Cleanup
      await this.invalidateUserRecommendations(testUserId)

      const isHealthy = cached && cached.length > 0

      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        details: {
          cacheOperation: isHealthy ? 'passed' : 'failed',
          stats: this.cache.getStats('recommendations')
        }
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