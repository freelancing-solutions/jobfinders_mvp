/**
 * Template Cache System
 *
 * High-performance caching system for template data, rendered content,
 * and frequently accessed resources with intelligent eviction policies.
 */

import {
  ResumeTemplate,
  RenderedTemplate,
  TemplateCache as ITemplateCache,
  CacheStats
} from '@/types/template';
import { logger } from '@/lib/logger';
import { eventBus } from '@/lib/events/event-bus';

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  ttl?: number; // Time to live in milliseconds
  size: number; // Estimated size in bytes
}

interface CacheOptions {
  maxSize: number; // Maximum cache size in bytes
  maxEntries: number; // Maximum number of entries
  defaultTTL: number; // Default TTL in milliseconds
  evictionPolicy: 'lru' | 'lfu' | 'ttl' | 'size';
  enableMetrics: boolean;
  enableCompression: boolean;
}

export class TemplateCache implements ITemplateCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private currentSize: number = 0;
  private stats: CacheStats;
  private options: CacheOptions;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(maxSize: number = 100 * 1024 * 1024) { // Default 100MB
    this.options = {
      maxSize,
      maxEntries: 1000,
      defaultTTL: 30 * 60 * 1000, // 30 minutes
      evictionPolicy: 'lru',
      enableMetrics: true,
      enableCompression: false
    };

    this.stats = {
      hits: 0,
      misses: 0,
      size: 0,
      hitRate: 0
    };

    this.startCleanupInterval();
    logger.info('Template cache initialized', { maxSize, maxEntries: this.options.maxEntries });
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const entry = this.cache.get(key);

      if (!entry) {
        this.stats.misses++;
        this.updateHitRate();
        return null;
      }

      // Check TTL
      if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        this.currentSize -= entry.size;
        this.stats.misses++;
        this.updateHitRate();
        return null;
      }

      // Update access tracking
      entry.accessCount++;
      entry.lastAccessed = Date.now();

      this.stats.hits++;
      this.updateHitRate();

      logger.debug('Cache hit', { key, accessCount: entry.accessCount });
      return entry.value;

    } catch (error) {
      logger.error('Cache get error', { key, error: error instanceof Error ? error.message : 'Unknown error' });
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const size = this.estimateSize(value);
      const entry: CacheEntry<T> = {
        value,
        timestamp: Date.now(),
        accessCount: 1,
        lastAccessed: Date.now(),
        ttl: ttl || this.options.defaultTTL,
        size
      };

      // Check if we need to evict entries
      await this.ensureCapacity(size);

      // Remove existing entry if present
      const existingEntry = this.cache.get(key);
      if (existingEntry) {
        this.currentSize -= existingEntry.size;
      }

      // Add new entry
      this.cache.set(key, entry);
      this.currentSize += size;
      this.stats.size = this.cache.size;

      logger.debug('Cache set', { key, size, ttl });

      // Emit cache event
      eventBus.emit('template_cache_set', {
        key,
        size,
        timestamp: new Date()
      });

    } catch (error) {
      logger.error('Cache set error', { key, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    try {
      const entry = this.cache.get(key);
      if (entry) {
        this.cache.delete(key);
        this.currentSize -= entry.size;
        this.stats.size = this.cache.size;

        logger.debug('Cache delete', { key, size: entry.size });

        // Emit cache event
        eventBus.emit('template_cache_delete', {
          key,
          timestamp: new Date()
        });
      }

    } catch (error) {
      logger.error('Cache delete error', { key, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    try {
      const entryCount = this.cache.size;
      this.cache.clear();
      this.currentSize = 0;
      this.stats.size = 0;

      logger.info('Cache cleared', { entryCount });

      // Emit cache event
      eventBus.emit('template_cache_cleared', {
        entryCount,
        timestamp: new Date()
      });

    } catch (error) {
      logger.error('Cache clear error', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * Get cache statistics
   */
  stats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get detailed cache information
   */
  getDetailedStats() {
    const entries = Array.from(this.cache.entries());
    const now = Date.now();

    return {
      ...this.stats,
      currentSize: this.currentSize,
      maxSize: this.options.maxSize,
      maxEntries: this.options.maxEntries,
      entryCount: this.cache.size,
      oldestEntry: entries.length > 0 ? Math.min(...entries.map(([_, entry]) => entry.timestamp)) : null,
      newestEntry: entries.length > 0 ? Math.max(...entries.map(([_, entry]) => entry.timestamp)) : null,
      averageAccessCount: entries.length > 0
        ? entries.reduce((sum, [_, entry]) => sum + entry.accessCount, 0) / entries.length
        : 0,
      expiredEntries: entries.filter(([_, entry]) =>
        entry.ttl && now - entry.timestamp > entry.ttl
      ).length,
      memoryUsage: this.currentSize,
      evictionPolicy: this.options.evictionPolicy
    };
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check TTL
    if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.currentSize -= entry.size;
      return false;
    }

    return true;
  }

  /**
   * Get cache keys (optional filter)
   */
  keys(filter?: (key: string, entry: CacheEntry<any>) => boolean): string[] {
    const entries = Array.from(this.cache.entries());

    if (filter) {
      return entries
        .filter(([key, entry]) => filter(key, entry))
        .map(([key]) => key);
    }

    return entries.map(([key]) => key);
  }

  /**
   * Get specific cache entry information
   */
  getEntryInfo(key: string) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    return {
      key,
      size: entry.size,
      timestamp: new Date(entry.timestamp),
      lastAccessed: new Date(entry.lastAccessed),
      accessCount: entry.accessCount,
      ttl: entry.ttl,
      expired: entry.ttl ? Date.now() - entry.timestamp > entry.ttl : false,
      age: Date.now() - entry.timestamp,
      timeSinceLastAccess: Date.now() - entry.lastAccessed
    };
  }

  /**
   * Set cache options
   */
  setOptions(options: Partial<CacheOptions>): void {
    this.options = { ...this.options, ...options };

    logger.info('Cache options updated', { options });

    // Apply new size limit if needed
    if (options.maxSize !== undefined && this.currentSize > options.maxSize) {
      this.ensureCapacity(this.currentSize - options.maxSize);
    }
  }

  /**
   * Warm cache with frequently used templates
   */
  async warmCache(templates: ResumeTemplate[]): Promise<void> {
    logger.info('Warming cache with templates', { count: templates.length });

    for (const template of templates) {
      try {
        await this.set(`template:${template.id}`, template);
      } catch (error) {
        logger.error('Failed to warm cache for template', {
          templateId: template.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    logger.info('Cache warming completed', {
      cachedTemplates: templates.length,
      cacheSize: this.currentSize
    });
  }

  /**
   * Export cache data (for backup/restore)
   */
  export() {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      value: entry.value,
      timestamp: entry.timestamp,
      ttl: entry.ttl
    }));

    return {
      entries,
      stats: this.getDetailedStats(),
      options: this.options,
      exportedAt: new Date()
    };
  }

  /**
   * Import cache data (for backup/restore)
   */
  async import(data: { entries: any[], stats?: any, options?: Partial<CacheOptions> }): Promise<void> {
    try {
      // Clear current cache
      await this.clear();

      // Apply options if provided
      if (data.options) {
        this.setOptions(data.options);
      }

      // Import entries
      for (const entryData of data.entries) {
        await this.set(entryData.key, entryData.value, entryData.ttl);
      }

      logger.info('Cache import completed', {
        entryCount: data.entries.length,
        cacheSize: this.currentSize
      });

    } catch (error) {
      logger.error('Cache import failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  // Private methods

  /**
   * Ensure cache has capacity for new entry
   */
  private async ensureCapacity(requiredSize: number): Promise<void> {
    // Check if we have enough capacity
    if (this.currentSize + requiredSize <= this.options.maxSize &&
        this.cache.size < this.options.maxEntries) {
      return;
    }

    // Remove expired entries first
    await this.removeExpiredEntries();

    // Still need capacity? Apply eviction policy
    if (this.currentSize + requiredSize > this.options.maxSize ||
        this.cache.size >= this.options.maxEntries) {
      await this.applyEvictionPolicy(requiredSize);
    }
  }

  /**
   * Remove expired entries
   */
  private async removeExpiredEntries(): Promise<void> {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.ttl && now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      const entry = this.cache.get(key);
      if (entry) {
        this.cache.delete(key);
        this.currentSize -= entry.size;
      }
    }

    if (expiredKeys.length > 0) {
      logger.debug('Removed expired entries', { count: expiredKeys.length });
    }
  }

  /**
   * Apply eviction policy
   */
  private async applyEvictionPolicy(requiredSize: number): Promise<void> {
    const entries = Array.from(this.cache.entries());
    let toEvict: string[] = [];

    switch (this.options.evictionPolicy) {
      case 'lru':
        // Least Recently Used
        toEvict = entries
          .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)
          .map(([key]) => key);
        break;

      case 'lfu':
        // Least Frequently Used
        toEvict = entries
          .sort((a, b) => a[1].accessCount - b[1].accessCount)
          .map(([key]) => key);
        break;

      case 'ttl':
        // Shortest TTL remaining
        const now = Date.now();
        toEvict = entries
          .filter(([_, entry]) => entry.ttl)
          .sort((a, b) => {
            const remainingA = a[1].ttl! - (now - a[1].timestamp);
            const remainingB = b[1].ttl! - (now - b[1].timestamp);
            return remainingA - remainingB;
          })
          .map(([key]) => key);
        break;

      case 'size':
        // Largest entries first
        toEvict = entries
          .sort((a, b) => b[1].size - a[1].size)
          .map(([key]) => key);
        break;
    }

    // Evict entries until we have enough capacity
    let freedSpace = 0;
    const targetSize = this.options.maxSize - requiredSize;
    const targetEntries = this.options.maxEntries - 1;

    for (const key of toEvict) {
      if (this.currentSize <= targetSize && this.cache.size <= targetEntries) {
        break;
      }

      const entry = this.cache.get(key);
      if (entry) {
        this.cache.delete(key);
        this.currentSize -= entry.size;
        freedSpace += entry.size;
      }
    }

    if (freedSpace > 0) {
      logger.debug('Cache eviction completed', {
        policy: this.options.evictionPolicy,
        entriesEvicted: toEvict.length,
        freedSpace,
        currentSize: this.currentSize
      });
    }
  }

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * Estimate size of value in bytes
   */
  private estimateSize(value: any): number {
    try {
      // Rough estimation - in production, you'd want more accurate sizing
      if (value === null || value === undefined) return 0;
      if (typeof value === 'string') return value.length * 2; // UTF-16
      if (typeof value === 'number') return 8;
      if (typeof value === 'boolean') return 4;
      if (typeof value === 'object') {
        // For objects, estimate based on serialized size
        return JSON.stringify(value).length * 2;
      }
      return 64; // Default estimate
    } catch {
      return 1024; // Fallback estimate
    }
  }

  /**
   * Start cleanup interval
   */
  private startCleanupInterval(): void {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.removeExpiredEntries();
    }, 5 * 60 * 1000);
  }

  /**
   * Stop cleanup interval
   */
  private stopCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Destroy cache instance
   */
  destroy(): void {
    this.stopCleanupInterval();
    this.clear();
    logger.info('Template cache destroyed');
  }
}

// Create singleton instance
export const templateCache = new TemplateCache();

// Export types
export type { CacheOptions, CacheEntry };