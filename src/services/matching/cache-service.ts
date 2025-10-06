import { Redis } from 'ioredis'
import { logger } from '@/lib/logger'

export interface CacheOptions {
  ttl?: number // Time to live in seconds
  prefix?: string
  namespace?: string
  compress?: boolean
  serialize?: boolean
  tags?: string[]
}

export interface CacheEntry<T = any> {
  data: T
  timestamp: number
  ttl?: number
  tags?: string[]
  metadata?: Record<string, any>
}

export interface CacheStats {
  hits: number
  misses: number
  sets: number
  deletes: number
  size: number
  hitRate: number
}

export class CacheService {
  private redis: Redis
  private defaultOptions: CacheOptions
  private stats: Map<string, CacheStats> = new Map()
  private tagIndex: Map<string, Set<string>> = new Map()
  private compressionEnabled: boolean

  constructor(redis: Redis, options: Partial<CacheOptions> = {}) {
    this.redis = redis
    this.compressionEnabled = process.env.CACHE_COMPRESSION === 'true'

    this.defaultOptions = {
      ttl: 3600, // 1 hour default
      prefix: 'matching_cache',
      namespace: 'default',
      compress: this.compressionEnabled,
      serialize: true,
      tags: [],
      ...options
    }

    this.initializeStats()
    this.setupErrorHandling()
  }

  /**
   * Get value from cache
   */
  public async get<T = any>(key: string, options?: CacheOptions): Promise<T | null> {
    try {
      const fullKey = this.buildKey(key, options)
      const cached = await this.redis.get(fullKey)

      if (cached) {
        const entry = this.deserialize<CacheEntry<T>>(cached)

        // Check if entry is expired
        if (this.isExpired(entry)) {
          await this.delete(key, options)
          this.updateStats(options?.namespace || this.defaultOptions.namespace!, 'miss')
          return null
        }

        this.updateStats(options?.namespace || this.defaultOptions.namespace!, 'hit')
        logger.debug('Cache hit', { key: fullKey })
        return entry.data
      } else {
        this.updateStats(options?.namespace || this.defaultOptions.namespace!, 'miss')
        logger.debug('Cache miss', { key: fullKey })
        return null
      }
    } catch (error) {
      logger.error('Cache get error', { key, error })
      this.updateStats(options?.namespace || this.defaultOptions.namespace!, 'miss')
      return null
    }
  }

  /**
   * Set value in cache
   */
  public async set<T = any>(
    key: string,
    value: T,
    options?: CacheOptions
  ): Promise<void> {
    try {
      const fullKey = this.buildKey(key, options)
      const ttl = options?.ttl || this.defaultOptions.ttl
      const tags = options?.tags || this.defaultOptions.tags || []

      const entry: CacheEntry<T> = {
        data: value,
        timestamp: Date.now(),
        ttl: ttl,
        tags,
        metadata: {
          namespace: options?.namespace || this.defaultOptions.namespace,
          compressed: options?.compress || this.defaultOptions.compress
        }
      }

      const serialized = this.serialize(entry)

      if (ttl && ttl > 0) {
        await this.redis.setex(fullKey, ttl, serialized)
      } else {
        await this.redis.set(fullKey, serialized)
      }

      // Update tag index
      if (tags.length > 0) {
        this.updateTagIndex(fullKey, tags)
      }

      this.updateStats(options?.namespace || this.defaultOptions.namespace!, 'set')
      logger.debug('Cache set', { key: fullKey, ttl, tags })

    } catch (error) {
      logger.error('Cache set error', { key, error })
    }
  }

  /**
   * Delete value from cache
   */
  public async delete(key: string, options?: CacheOptions): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, options)
      const result = await this.redis.del(fullKey)

      // Remove from tag index
      await this.removeFromTagIndex(fullKey)

      this.updateStats(options?.namespace || this.defaultOptions.namespace!, 'delete')
      logger.debug('Cache delete', { key: fullKey })

      return result > 0
    } catch (error) {
      logger.error('Cache delete error', { key, error })
      return false
    }
  }

  /**
   * Check if key exists
   */
  public async exists(key: string, options?: CacheOptions): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, options)
      const result = await this.redis.exists(fullKey)
      return result > 0
    } catch (error) {
      logger.error('Cache exists error', { key, error })
      return false
    }
  }

  /**
   * Get multiple values
   */
  public async mget<T = any>(
    keys: string[],
    options?: CacheOptions
  ): Promise<Array<T | null>> {
    try {
      const fullKeys = keys.map(key => this.buildKey(key, options))
      const values = await this.redis.mget(...fullKeys)

      return values.map(value => {
        if (value) {
          try {
            const entry = this.deserialize<CacheEntry<T>>(value)
            if (this.isExpired(entry)) {
              // Delete expired entry
              const keyIndex = fullKeys.indexOf(this.buildKey(entry.data as any, options))
              if (keyIndex >= 0) {
                this.delete(keys[keyIndex], options)
              }
              return null
            }
            return entry.data
          } catch {
            return null
          }
        }
        return null
      })
    } catch (error) {
      logger.error('Cache mget error', { keys, error })
      return new Array(keys.length).fill(null)
    }
  }

  /**
   * Set multiple values
   */
  public async mset<T = any>(
    entries: Array<{ key: string; value: T }>,
    options?: CacheOptions
  ): Promise<void> {
    try {
      const pipeline = this.redis.pipeline()
      const ttl = options?.ttl || this.defaultOptions.ttl
      const tags = options?.tags || this.defaultOptions.tags || []

      entries.forEach(({ key, value }) => {
        const fullKey = this.buildKey(key, options)
        const entry: CacheEntry<T> = {
          data: value,
          timestamp: Date.now(),
          ttl,
          tags,
          metadata: {
            namespace: options?.namespace || this.defaultOptions.namespace,
            compressed: options?.compress || this.defaultOptions.compress
          }
        }

        const serialized = this.serialize(entry)

        if (ttl && ttl > 0) {
          pipeline.setex(fullKey, ttl, serialized)
        } else {
          pipeline.set(fullKey, serialized)
        }

        // Update tag index
        if (tags.length > 0) {
          this.updateTagIndex(fullKey, tags)
        }
      })

      await pipeline.exec()

      entries.forEach(() => {
        this.updateStats(options?.namespace || this.defaultOptions.namespace!, 'set')
      })

      logger.debug('Cache mset', { count: entries.length })
    } catch (error) {
      logger.error('Cache mset error', { entries, error })
    }
  }

  /**
   * Get or set pattern - get from cache or compute and set
   */
  public async getOrSet<T = any>(
    key: string,
    computeFn: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    const cached = await this.get<T>(key, options)
    if (cached !== null) {
      return cached
    }

    const value = await computeFn()
    await this.set(key, value, options)
    return value
  }

  /**
   * Increment numeric value
   */
  public async increment(
    key: string,
    amount: number = 1,
    options?: CacheOptions
  ): Promise<number> {
    try {
      const fullKey = this.buildKey(key, options)
      const result = await this.redis.incrby(fullKey, amount)

      // Update expiration if TTL is set
      const ttl = options?.ttl || this.defaultOptions.ttl
      if (ttl && ttl > 0) {
        await this.redis.expire(fullKey, ttl)
      }

      logger.debug('Cache increment', { key: fullKey, amount, result })
      return result
    } catch (error) {
      logger.error('Cache increment error', { key, error })
      throw error
    }
  }

  /**
   * Get TTL of key
   */
  public async ttl(key: string, options?: CacheOptions): Promise<number> {
    try {
      const fullKey = this.buildKey(key, options)
      return await this.redis.ttl(fullKey)
    } catch (error) {
      logger.error('Cache TTL error', { key, error })
      return -1
    }
  }

  /**
   * Set TTL of key
   */
  public async expire(
    key: string,
    ttl: number,
    options?: CacheOptions
  ): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, options)
      const result = await this.redis.expire(fullKey, ttl)
      logger.debug('Cache expire set', { key: fullKey, ttl })
      return result > 0
    } catch (error) {
      logger.error('Cache expire error', { key, error })
      return false
    }
  }

  /**
   * Clear all cache or by namespace
   */
  public async clear(namespace?: string): Promise<number> {
    try {
      let pattern: string
      if (namespace) {
        pattern = `${this.defaultOptions.prefix}:${namespace}:*`
      } else {
        pattern = `${this.defaultOptions.prefix}:*`
      }

      const keys = await this.redis.keys(pattern)
      if (keys.length === 0) {
        return 0
      }

      const result = await this.redis.del(...keys)

      // Clear tag index for cleared keys
      if (namespace) {
        this.clearTagIndexByNamespace(namespace)
      } else {
        this.tagIndex.clear()
      }

      // Reset stats
      if (namespace) {
        this.stats.delete(namespace)
      } else {
        this.stats.clear()
      }

      logger.info('Cache cleared', { namespace, keysCleared: result })
      return result
    } catch (error) {
      logger.error('Cache clear error', { namespace, error })
      return 0
    }
  }

  /**
   * Delete by tags
   */
  public async deleteByTags(tags: string[]): Promise<number> {
    try {
      const keysToDelete = new Set<string>()

      tags.forEach(tag => {
        const taggedKeys = this.tagIndex.get(tag)
        if (taggedKeys) {
          taggedKeys.forEach(key => keysToDelete.add(key))
        }
      })

      if (keysToDelete.size === 0) {
        return 0
      }

      const result = await this.redis.del(...Array.from(keysToDelete))

      // Remove from tag index
      keysToDelete.forEach(key => {
        this.removeFromTagIndexByKey(key)
      })

      logger.info('Cache deleted by tags', { tags, keysDeleted: result })
      return result
    } catch (error) {
      logger.error('Cache delete by tags error', { tags, error })
      return 0
    }
  }

  /**
   * Get cache statistics
   */
  public getStats(namespace?: string): CacheStats | Record<string, CacheStats> {
    if (namespace) {
      return this.stats.get(namespace) || this.getDefaultStats()
    }
    return Object.fromEntries(this.stats)
  }

  /**
   * Reset statistics
   */
  public resetStats(namespace?: string): void {
    if (namespace) {
      this.stats.set(namespace, this.getDefaultStats())
    } else {
      this.stats.clear()
      this.initializeStats()
    }
  }

  /**
   * Warm up cache with predefined data
   */
  public async warmUp(
    entries: Array<{ key: string; value: any; options?: CacheOptions }>
  ): Promise<void> {
    logger.info('Warming up cache', { entryCount: entries.length })

    const promises = entries.map(async ({ key, value, options }) => {
      try {
        await this.set(key, value, options)
      } catch (error) {
        logger.error('Cache warm up error', { key, error })
      }
    })

    await Promise.all(promises)
    logger.info('Cache warm up complete')
  }

  /**
   * Build full cache key
   */
  private buildKey(key: string, options?: CacheOptions): string {
    const prefix = options?.prefix || this.defaultOptions.prefix
    const namespace = options?.namespace || this.defaultOptions.namespace
    return `${prefix}:${namespace}:${key}`
  }

  /**
   * Serialize data for storage
   */
  private serialize(data: any): string {
    const shouldCompress = this.defaultOptions.compress || false
    const shouldSerialize = this.defaultOptions.serialize || true

    let serialized = shouldSerialize ? JSON.stringify(data) : String(data)

    if (shouldCompress && serialized.length > 1000) {
      // In a real implementation, you would use compression here
      // For now, just return the serialized data
    }

    return serialized
  }

  /**
   * Deserialize data from storage
   */
  private deserialize<T>(data: string): T {
    try {
      return JSON.parse(data)
    } catch {
      return data as unknown as T
    }
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    if (!entry.ttl) return false
    const elapsed = Date.now() - entry.timestamp
    return elapsed > (entry.ttl * 1000)
  }

  /**
   * Update tag index
   */
  private updateTagIndex(key: string, tags: string[]): void {
    tags.forEach(tag => {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set())
      }
      this.tagIndex.get(tag)!.add(key)
    })
  }

  /**
   * Remove from tag index
   */
  private async removeFromTagIndex(key: string): Promise<void> {
    for (const [tag, keys] of this.tagIndex.entries()) {
      if (keys.has(key)) {
        keys.delete(key)
        if (keys.size === 0) {
          this.tagIndex.delete(tag)
        }
      }
    }
  }

  /**
   * Remove from tag index by key
   */
  private removeFromTagIndexByKey(key: string): void {
    for (const keys of this.tagIndex.values()) {
      keys.delete(key)
    }
  }

  /**
   * Clear tag index by namespace
   */
  private clearTagIndexByNamespace(namespace: string): void {
    const prefix = `${this.defaultOptions.prefix}:${namespace}:`

    for (const [tag, keys] of this.tagIndex.entries()) {
      const keysToDelete = Array.from(keys).filter(key => key.startsWith(prefix))
      keysToDelete.forEach(key => keys.delete(key))

      if (keys.size === 0) {
        this.tagIndex.delete(tag)
      }
    }
  }

  /**
   * Update statistics
   */
  private updateStats(namespace: string, operation: 'hit' | 'miss' | 'set' | 'delete'): void {
    if (!this.stats.has(namespace)) {
      this.stats.set(namespace, this.getDefaultStats())
    }

    const stats = this.stats.get(namespace)!

    switch (operation) {
      case 'hit':
        stats.hits++
        break
      case 'miss':
        stats.misses++
        break
      case 'set':
        stats.sets++
        break
      case 'delete':
        stats.deletes++
        break
    }

    // Calculate hit rate
    const total = stats.hits + stats.misses
    stats.hitRate = total > 0 ? stats.hits / total : 0
  }

  /**
   * Get default statistics
   */
  private getDefaultStats(): CacheStats {
    return {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      size: 0,
      hitRate: 0
    }
  }

  /**
   * Initialize statistics for default namespace
   */
  private initializeStats(): void {
    this.stats.set(this.defaultOptions.namespace!, this.getDefaultStats())
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    this.redis.on('error', (error) => {
      logger.error('Redis connection error', { error })
    })

    this.redis.on('connect', () => {
      logger.info('Redis connected for cache service')
    })

    this.redis.on('disconnect', () => {
      logger.warn('Redis disconnected for cache service')
    })
  }

  /**
   * Health check
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy'
    details: any
  }> {
    try {
      // Test Redis connection
      await this.redis.ping()

      // Test cache operations
      const testKey = 'health_check'
      await this.set(testKey, 'test_value', { ttl: 10 })
      const value = await this.get(testKey)
      await this.delete(testKey)

      const isHealthy = value === 'test_value'

      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        details: {
          redis: 'connected',
          testOperation: isHealthy ? 'passed' : 'failed',
          stats: this.getStats(),
          tagIndexSize: this.tagIndex.size
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