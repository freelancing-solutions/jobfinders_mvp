import { Redis } from 'ioredis'
import { CacheService } from '@/services/matching/cache-service'
import { logger } from '@/lib/logger'
import { MatchingScoreService } from '@/services/matching/matching-score'

export interface MatchCacheOptions {
  userId: string
  jobId?: string
  candidateId?: string
  filters?: Record<string, any>
  limit?: number
  strategy?: string
}

export interface CachedMatch {
  id: string
  userId: string
  targetId: string
  targetType: 'job' | 'candidate'
  score: number
  confidence: number
  factors: Record<string, number>
  explanation: string[]
  metadata: {
    algorithm: string
    version: string
    generatedAt: Date
    validUntil: Date
    refreshCount: number
  }
}

export interface MatchListCache {
  userId: string
  matches: CachedMatch[]
  totalCount: number
  filters: Record<string, any>
  strategy: string
  metadata: {
    generatedAt: Date
    validUntil: Date
    processingTime: number
    cacheKey: string
  }
}

export class MatchCache {
  private cache: CacheService
  private matchingScoreService: MatchingScoreService
  private defaultTTL: number = 1800 // 30 minutes

  constructor(redis: Redis) {
    this.cache = new CacheService(redis, {
      namespace: 'matches',
      ttl: this.defaultTTL,
      tags: ['matching']
    })
    this.matchingScoreService = new MatchingScoreService()
  }

  /**
   * Get cached matches for a user
   */
  public async getMatches(options: MatchCacheOptions): Promise<CachedMatch[] | null> {
    try {
      const cacheKey = this.buildMatchCacheKey(options)
      const cached = await this.cache.get<MatchListCache>(cacheKey)

      if (cached) {
        // Check if cache is still valid
        if (this.isCacheValid(cached)) {
          logger.debug('Match cache hit', { userId: options.userId, count: cached.matches.length })
          return cached.matches
        } else {
          // Cache expired, remove it
          await this.cache.delete(cacheKey)
          logger.debug('Match cache expired', { userId: options.userId })
        }
      }

      return null
    } catch (error) {
      logger.error('Error getting cached matches', { error, options })
      return null
    }
  }

  /**
   * Set matches in cache
   */
  public async setMatches(
    matches: any[],
    options: MatchCacheOptions,
    metadata: Partial<MatchListCache['metadata']> = {}
  ): Promise<void> {
    try {
      const cacheKey = this.buildMatchCacheKey(options)
      const cachedMatches: CachedMatch[] = matches.map(match => ({
        id: match.id || this.generateMatchId(),
        userId: options.userId,
        targetId: options.jobId || options.candidateId || match.targetId,
        targetType: options.jobId ? 'job' : 'candidate',
        score: match.score || match.finalScore,
        confidence: match.confidence || 0,
        factors: match.factors || match.matchingFactors || {},
        explanation: match.explanation || [],
        metadata: {
          algorithm: match.algorithm || 'default',
          version: match.version || '1.0',
          generatedAt: new Date(),
          validUntil: new Date(Date.now() + (this.defaultTTL * 1000)),
          refreshCount: 0
        }
      }))

      const cacheData: MatchListCache = {
        userId: options.userId,
        matches: cachedMatches,
        totalCount: matches.length,
        filters: options.filters || {},
        strategy: options.strategy || 'default',
        metadata: {
          generatedAt: new Date(),
          validUntil: new Date(Date.now() + (this.defaultTTL * 1000)),
          processingTime: metadata.processingTime || 0,
          cacheKey,
          ...metadata
        }
      }

      const ttl = this.calculateTTL(options)
      await this.cache.set(cacheKey, cacheData, {
        ttl,
        tags: ['matches', `user:${options.userId}`, `strategy:${options.strategy}`]
      })

      logger.debug('Matches cached', {
        userId: options.userId,
        count: matches.length,
        cacheKey,
        ttl
      })

    } catch (error) {
      logger.error('Error caching matches', { error, options })
    }
  }

  /**
   * Get cached match score
   */
  public async getMatchScore(
    userId: string,
    targetId: string,
    targetType: 'job' | 'candidate'
  ): Promise<number | null> {
    try {
      const cacheKey = `score:${userId}:${targetType}:${targetId}`
      const cached = await this.cache.get<number>(cacheKey)

      if (cached !== null) {
        logger.debug('Match score cache hit', { userId, targetId, targetType, score: cached })
        return cached
      }

      return null
    } catch (error) {
      logger.error('Error getting cached match score', { error, userId, targetId, targetType })
      return null
    }
  }

  /**
   * Set match score in cache
   */
  public async setMatchScore(
    userId: string,
    targetId: string,
    targetType: 'job' | 'candidate',
    score: number,
    ttl: number = this.defaultTTL
  ): Promise<void> {
    try {
      const cacheKey = `score:${userId}:${targetType}:${targetId}`
      await this.cache.set(cacheKey, score, {
        ttl,
        tags: ['match-scores', `user:${userId}`, `${targetType}:${targetId}`]
      })

      logger.debug('Match score cached', {
        userId,
        targetId,
        targetType,
        score,
        cacheKey
      })

    } catch (error) {
      logger.error('Error caching match score', { error, userId, targetId, targetType })
    }
  }

  /**
   * Get or compute matches with caching
   */
  public async getOrComputeMatches(
    options: MatchCacheOptions,
    computeFn: () => Promise<any[]>
  ): Promise<any[]> {
    // Try to get from cache first
    const cached = await this.getMatches(options)
    if (cached) {
      return cached
    }

    // Compute matches
    const startTime = Date.now()
    const matches = await computeFn()
    const processingTime = Date.now() - startTime

    // Cache the results
    await this.setMatches(matches, options, { processingTime })

    return matches
  }

  /**
   * Invalidate user's match cache
   */
  public async invalidateUserMatches(userId: string): Promise<void> {
    try {
      await this.cache.deleteByTags([`user:${userId}`])
      logger.info('User match cache invalidated', { userId })
    } catch (error) {
      logger.error('Error invalidating user match cache', { error, userId })
    }
  }

  /**
   * Invalidate matches for specific target
   */
  public async invalidateTargetMatches(
    targetId: string,
    targetType: 'job' | 'candidate'
  ): Promise<void> {
    try {
      await this.cache.deleteByTags([`${targetType}:${targetId}`])
      logger.info('Target match cache invalidated', { targetId, targetType })
    } catch (error) {
      logger.error('Error invalidating target match cache', { error, targetId, targetType })
    }
  }

  /**
   * Invalidate matches by strategy
   */
  public async invalidateStrategyMatches(strategy: string): Promise<void> {
    try {
      await this.cache.deleteByTags([`strategy:${strategy}`])
      logger.info('Strategy match cache invalidated', { strategy })
    } catch (error) {
      logger.error('Error invalidating strategy match cache', { error, strategy })
    }
  }

  /**
   * Refresh cached matches
   */
  public async refreshMatches(
    options: MatchCacheOptions,
    computeFn: () => Promise<any[]>
  ): Promise<any[]> {
    // Invalidate existing cache
    await this.invalidateUserMatches(options.userId)

    // Compute fresh matches
    return this.getOrComputeMatches(options, computeFn)
  }

  /**
   * Get cache statistics
   */
  public async getStats(): Promise<{
    hits: number
    misses: number
    hitRate: number
    size: number
    tagDistribution: Record<string, number>
  }> {
    const stats = this.cache.getStats('matches')
    const tagDistribution = await this.getTagDistribution()

    return {
      ...stats,
      tagDistribution
    }
  }

  /**
   * Warm up cache for active users
   */
  public async warmUpForUsers(
    userIds: string[],
    computeFn: (userId: string) => Promise<any[]>
  ): Promise<void> {
    logger.info('Warming up match cache for users', { userCount: userIds.length })

    const promises = userIds.map(async (userId) => {
      try {
        const options: MatchCacheOptions = { userId, limit: 20 }
        await this.getOrComputeMatches(options, () => computeFn(userId))
      } catch (error) {
        logger.error('Error warming up cache for user', { userId, error })
      }
    })

    await Promise.all(promises)
    logger.info('Match cache warm up complete')
  }

  /**
   * Clean up expired cache entries
   */
  public async cleanup(): Promise<number> {
    try {
      // This would typically be handled by Redis TTL, but we can implement
      // additional cleanup logic here if needed
      const stats = await this.getStats()
      logger.info('Match cache cleanup', { stats })
      return 0
    } catch (error) {
      logger.error('Error during match cache cleanup', { error })
      return 0
    }
  }

  /**
   * Build cache key for match options
   */
  private buildMatchCacheKey(options: MatchCacheOptions): string {
    const parts = [
      'matches',
      options.userId,
      options.jobId ? `job:${options.jobId}` : '',
      options.candidateId ? `candidate:${options.candidateId}` : '',
      options.strategy || 'default',
      options.limit ? `limit:${options.limit}` : '',
      options.filters ? this.serializeFilters(options.filters) : ''
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
   * Check if cache is still valid
   */
  private isCacheValid(cached: MatchListCache): boolean {
    return new Date() < cached.metadata.validUntil
  }

  /**
   * Calculate TTL based on options
   */
  private calculateTTL(options: MatchCacheOptions): number {
    // Adjust TTL based on user activity and match type
    let baseTTL = this.defaultTTL

    // Longer TTL for job matches (less frequent changes)
    if (options.jobId) {
      baseTTL = 3600 // 1 hour
    }

    // Shorter TTL for candidate matches (more frequent updates)
    if (options.candidateId) {
      baseTTL = 900 // 15 minutes
    }

    // Adjust based on strategy
    if (options.strategy === 'realtime') {
      baseTTL = 300 // 5 minutes
    }

    return baseTTL
  }

  /**
   * Get tag distribution statistics
   */
  private async getTagDistribution(): Promise<Record<string, number>> {
    // This would typically require Redis commands to scan keys by tags
    // For now, return a placeholder
    return {
      'matches': 0,
      'match-scores': 0
    }
  }

  /**
   * Generate match ID
   */
  private generateMatchId(): string {
    return `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
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
      const testOptions: MatchCacheOptions = { userId: testUserId, limit: 5 }

      // Test cache set/get
      const testMatches = [
        {
          id: 'test_match_1',
          score: 0.85,
          confidence: 0.9,
          factors: { skills: 0.8, experience: 0.9 },
          explanation: ['Good match']
        }
      ]

      await this.setMatches(testMatches, testOptions)
      const cached = await this.getMatches(testOptions)

      // Cleanup
      await this.invalidateUserMatches(testUserId)

      const isHealthy = cached && cached.length > 0

      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        details: {
          cacheOperation: isHealthy ? 'passed' : 'failed',
          stats: await this.getStats()
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