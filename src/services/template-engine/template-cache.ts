/**
 * Template Cache Service
 *
 * Provides caching functionality for resume templates to improve performance
 * and reduce redundant template loading operations.
 */

import { ResumeTemplate } from '@/types/template';

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheStats {
  size: number;
  maxSize: number;
  hitRate: number;
  totalHits: number;
  totalMisses: number;
  oldestEntry?: number;
  newestEntry?: number;
}

export class TemplateCache {
  private cache: Map<string, CacheEntry<ResumeTemplate>> = new Map();
  private maxSize: number;
  private hits: number = 0;
  private misses: number = 0;
  private defaultTTL: number = 1000 * 60 * 30; // 30 minutes

  constructor(maxSize: number = 100, ttl?: number) {
    this.maxSize = maxSize;
    if (ttl) {
      this.defaultTTL = ttl;
    }
  }

  /**
   * Get a template from cache
   */
  get(templateId: string): ResumeTemplate | null {
    const entry = this.cache.get(templateId);
    
    if (!entry) {
      this.misses++;
      return null;
    }

    // Check if entry has expired
    const now = Date.now();
    if (now - entry.timestamp > this.defaultTTL) {
      this.cache.delete(templateId);
      this.misses++;
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;
    this.hits++;

    return entry.value;
  }

  /**
   * Set a template in cache
   */
  set(templateId: string, template: ResumeTemplate): void {
    const now = Date.now();

    // If cache is at max size, remove least recently used entry
    if (this.cache.size >= this.maxSize && !this.cache.has(templateId)) {
      this.evictLRU();
    }

    const entry: CacheEntry<ResumeTemplate> = {
      value: template,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now
    };

    this.cache.set(templateId, entry);
  }

  /**
   * Check if template exists in cache
   */
  has(templateId: string): boolean {
    const entry = this.cache.get(templateId);
    if (!entry) {
      return false;
    }

    // Check if entry has expired
    const now = Date.now();
    if (now - entry.timestamp > this.defaultTTL) {
      this.cache.delete(templateId);
      return false;
    }

    return true;
  }

  /**
   * Remove a template from cache
   */
  delete(templateId: string): boolean {
    return this.cache.delete(templateId);
  }

  /**
   * Clear all entries from cache
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const timestamps = entries.map(e => e.timestamp);
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.hits + this.misses > 0 ? this.hits / (this.hits + this.misses) : 0,
      totalHits: this.hits,
      totalMisses: this.misses,
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : undefined,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : undefined
    };
  }

  /**
   * Get all cached template IDs
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get all cached templates
   */
  values(): ResumeTemplate[] {
    return Array.from(this.cache.values()).map(entry => entry.value);
  }

  /**
   * Set cache TTL (time to live)
   */
  setTTL(ttl: number): void {
    this.defaultTTL = ttl;
  }

  /**
   * Get cache TTL
   */
  getTTL(): number {
    return this.defaultTTL;
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let removedCount = 0;

    for (const [templateId, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.defaultTTL) {
        this.cache.delete(templateId);
        removedCount++;
      }
    }

    return removedCount;
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [templateId, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = templateId;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}

export default TemplateCache;