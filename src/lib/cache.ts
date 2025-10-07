import { Redis } from '@/lib/redis';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
  namespace?: string;
}

export interface CacheResult<T> {
  data: T | null;
  hit: boolean;
  key: string;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  hitRate: number;
}

class CacheManager {
  private redis: Redis;
  private memoryCache: Map<string, { data: any; expiry: number }>;
  private defaultTTL: number;
  private prefix: string;
  private stats: CacheStats;
  private fallbackToMemory: boolean;

  constructor(options: {
    defaultTTL?: number;
    prefix?: string;
    fallbackToMemory?: boolean;
  } = {}) {
    this.redis = new Redis();
    this.memoryCache = new Map();
    this.defaultTTL = options.defaultTTL || 3600; // 1 hour default
    this.prefix = options.prefix || 'jobfinders:';
    this.fallbackToMemory = options.fallbackToMemory ?? true;

    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      hitRate: 0,
    };

    // Cleanup expired memory cache entries periodically
    setInterval(() => this.cleanupMemoryCache(), 60000); // Every minute
  }

  private getKey(key: string, options?: CacheOptions): string {
    const parts = [this.prefix];

    if (options?.namespace) {
      parts.push(options.namespace);
    }

    parts.push(key);

    return parts.join(':');
  }

  private cleanupMemoryCache(): void {
    const now = Date.now();
    for (const [key, value] of this.memoryCache.entries()) {
      if (value.expiry < now) {
        this.memoryCache.delete(key);
      }
    }
  }

  private updateStats(hit: boolean): void {
    if (hit) {
      this.stats.hits++;
    } else {
      this.stats.misses++;
    }

    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  async get<T>(key: string, options?: CacheOptions): Promise<CacheResult<T>> {
    const fullKey = this.getKey(key, options);

    try {
      // Try Redis first
      const cached = await this.redis.get(fullKey);

      if (cached !== null) {
        this.updateStats(true);
        return {
          data: JSON.parse(cached),
          hit: true,
          key: fullKey,
        };
      }
    } catch (error) {
      console.warn('Redis cache read failed, trying memory cache:', error);
    }

    // Fallback to memory cache
    if (this.fallbackToMemory) {
      const memoryData = this.memoryCache.get(fullKey);
      if (memoryData && memoryData.expiry > Date.now()) {
        this.updateStats(true);
        return {
          data: memoryData.data,
          hit: true,
          key: fullKey,
        };
      }
    }

    this.updateStats(false);
    return {
      data: null,
      hit: false,
      key: fullKey,
    };
  }

  async set<T>(key: string, data: T, options?: CacheOptions): Promise<void> {
    const fullKey = this.getKey(key, options);
    const ttl = options?.ttl || this.defaultTTL;
    const serialized = JSON.stringify(data);

    try {
      // Set in Redis
      if (ttl > 0) {
        await this.redis.setex(fullKey, ttl, serialized);
      } else {
        await this.redis.set(fullKey, serialized);
      }
    } catch (error) {
      console.warn('Redis cache write failed, using memory cache:', error);

      // Fallback to memory cache
      if (this.fallbackToMemory) {
        this.memoryCache.set(fullKey, {
          data,
          expiry: Date.now() + (ttl * 1000),
        });
      }
    }

    this.stats.sets++;
  }

  async delete(key: string, options?: CacheOptions): Promise<boolean> {
    const fullKey = this.getKey(key, options);
    let deleted = false;

    try {
      // Delete from Redis
      const result = await this.redis.del(fullKey);
      deleted = result > 0;
    } catch (error) {
      console.warn('Redis cache delete failed:', error);
    }

    // Delete from memory cache
    if (this.memoryCache.has(fullKey)) {
      this.memoryCache.delete(fullKey);
      deleted = true;
    }

    if (deleted) {
      this.stats.deletes++;
    }

    return deleted;
  }

  async exists(key: string, options?: CacheOptions): Promise<boolean> {
    const fullKey = this.getKey(key, options);

    try {
      // Check Redis
      const exists = await this.redis.exists(fullKey);
      if (exists > 0) return true;
    } catch (error) {
      console.warn('Redis cache exists check failed:', error);
    }

    // Check memory cache
    if (this.fallbackToMemory) {
      const memoryData = this.memoryCache.get(fullKey);
      return memoryData !== undefined && memoryData.expiry > Date.now();
    }

    return false;
  }

  async clear(namespace?: string): Promise<void> {
    if (namespace) {
      const pattern = this.getKey('*', { namespace });

      try {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } catch (error) {
        console.warn('Redis cache clear failed:', error);
      }

      // Clear memory cache entries for namespace
      const namespacePrefix = this.getKey('', { namespace });
      for (const [key] of this.memoryCache.entries()) {
        if (key.startsWith(namespacePrefix)) {
          this.memoryCache.delete(key);
        }
      }
    } else {
      try {
        // Clear all keys with our prefix
        const pattern = this.getKey('*');
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } catch (error) {
        console.warn('Redis cache clear failed:', error);
      }

      // Clear all memory cache entries with our prefix
      const prefix = this.getKey('');
      for (const [key] of this.memoryCache.entries()) {
        if (key.startsWith(prefix)) {
          this.memoryCache.delete(key);
        }
      }
    }
  }

  async getMultiple<T>(keys: string[], options?: CacheOptions): Promise<CacheResult<T>[]> {
    const promises = keys.map(key => this.get<T>(key, options));
    return Promise.all(promises);
  }

  async setMultiple<T>(entries: Array<{ key: string; data: T }>, options?: CacheOptions): Promise<void> {
    const promises = entries.map(entry => this.set(entry.key, entry.data, options));
    await Promise.all(promises);
  }

  // Cache with automatic TTL based on data size
  async setSmart<T>(key: string, data: T, baseOptions?: CacheOptions): Promise<void> {
    const dataSize = JSON.stringify(data).length;

    // Determine TTL based on data size
    let ttl: number;
    if (dataSize < 1024) {
      ttl = 3600; // 1 hour for small data
    } else if (dataSize < 10240) {
      ttl = 1800; // 30 minutes for medium data
    } else {
      ttl = 900; // 15 minutes for large data
    }

    await this.set(key, data, { ...baseOptions, ttl });
  }

  // Get or set pattern (useful for caching expensive operations)
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    const cached = await this.get<T>(key, options);

    if (cached.hit && cached.data !== null) {
      return cached.data;
    }

    const data = await factory();
    await this.set(key, data, options);
    return data;
  }

  // Increment counter
  async increment(key: string, amount: number = 1, options?: CacheOptions): Promise<number> {
    const fullKey = this.getKey(key, options);

    try {
      return await this.redis.incrby(fullKey, amount);
    } catch (error) {
      console.warn('Redis increment failed:', error);

      // Fallback to memory
      const current = this.memoryCache.get(fullKey)?.data || 0;
      const newValue = current + amount;
      this.memoryCache.set(fullKey, {
        data: newValue,
        expiry: Date.now() + (this.defaultTTL * 1000),
      });
      return newValue;
    }
  }

  // Get cache statistics
  getStats(): CacheStats {
    return { ...this.stats };
  }

  // Reset statistics
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      hitRate: 0,
    };
  }

  // Warm up cache with predefined data
  async warmUp(entries: Array<{ key: string; data: any; ttl?: number }>, options?: CacheOptions): Promise<void> {
    const promises = entries.map(entry =>
      this.set(entry.key, entry.data, { ...options, ttl: entry.ttl })
    );
    await Promise.all(promises);
  }

  // Health check
  async healthCheck(): Promise<{ redis: boolean; memory: boolean; stats: CacheStats }> {
    let redis = false;

    try {
      await this.redis.ping();
      redis = true;
    } catch (error) {
      console.warn('Redis health check failed:', error);
    }

    const memory = this.memoryCache.size > 0;

    return {
      redis,
      memory,
      stats: this.getStats(),
    };
  }
}

// Create default cache instance
export const cache = new CacheManager({
  defaultTTL: 3600,
  prefix: 'jobfinders:',
  fallbackToMemory: true,
});

// Export convenience functions
export const getCache = <T>(key: string, options?: CacheOptions) => cache.get<T>(key, options);
export const setCache = <T>(key: string, data: T, options?: CacheOptions) => cache.set(key, data, options);
export const deleteCache = (key: string, options?: CacheOptions) => cache.delete(key, options);
export const cacheExists = (key: string, options?: CacheOptions) => cache.exists(key, options);
export const clearCache = (namespace?: string) => cache.clear(namespace);

// Export CacheManager for custom instances
export { CacheManager };

// Named cache instances for different use cases
export const sessionCache = new CacheManager({
  prefix: 'session:',
  defaultTTL: 1800, // 30 minutes
});

export const apiCache = new CacheManager({
  prefix: 'api:',
  defaultTTL: 300, // 5 minutes
});

export const userCache = new CacheManager({
  prefix: 'user:',
  defaultTTL: 1800, // 30 minutes
});

export const searchCache = new CacheManager({
  prefix: 'search:',
  defaultTTL: 900, // 15 minutes
});

// Utility functions for specific patterns
export const cacheApiResponse = async <T>(
  endpoint: string,
  data: T,
  ttl: number = 300
): Promise<void> => {
  await apiCache.set(endpoint, data, { ttl });
};

export const getCachedApiResponse = async <T>(endpoint: string): Promise<T | null> => {
  const result = await apiCache.get<T>(endpoint);
  return result.hit ? result.data : null;
};

export const cacheUserSession = async (userId: string, sessionData: any): Promise<void> => {
  await sessionCache.set(userId, sessionData, { namespace: 'user' });
};

export const getCachedUserSession = async (userId: string): Promise<any | null> => {
  const result = await sessionCache.get(userId, { namespace: 'user' });
  return result.hit ? result.data : null;
};

export const invalidateUserCache = async (userId: string): Promise<void> => {
  await Promise.all([
    userCache.delete(userId),
    sessionCache.delete(userId, { namespace: 'user' }),
    cache.clear(`user:${userId}`),
  ]);
};