// API Rate Limiting
// Comprehensive rate limiting system for API endpoints

import { NextRequest, NextResponse } from 'next/server';
import { createRateLimitError } from './error-handler';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
  statusCode?: number;
  headers?: boolean;
  onLimitReached?: (req: NextRequest, res: NextResponse) => void;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
}

export interface RateLimitStore {
  get(key: string): Promise<RateLimitEntry | null>;
  set(key: string, entry: RateLimitEntry): Promise<void>;
  increment(key: string): Promise<RateLimitEntry>;
  reset(key: string): Promise<void>;
  cleanup(): Promise<void>;
}

export interface RateLimitEntry {
  count: number;
  resetTime: Date;
  windowMs: number;
}

// Memory-based store (for development/small deployments)
export class MemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  async get(key: string): Promise<RateLimitEntry | null> {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() > entry.resetTime.getTime()) {
      this.store.delete(key);
      return null;
    }

    return entry;
  }

  async set(key: string, entry: RateLimitEntry): Promise<void> {
    this.store.set(key, entry);
  }

  async increment(key: string): Promise<RateLimitEntry> {
    const now = Date.now();
    const existing = await this.get(key);

    if (existing) {
      // Existing entry, increment count
      existing.count++;
      return existing;
    } else {
      // New entry
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: new Date(now + 60000), // 1 minute window
        windowMs: 60000
      };
      await this.set(key, newEntry);
      return newEntry;
    }
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }

  async cleanup(): Promise<void> {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime.getTime()) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

// Redis-based store (for production)
export class RedisRateLimitStore implements RateLimitStore {
  private redis: any; // Redis client

  constructor(redisClient: any) {
    this.redis = redisClient;
  }

  async get(key: string): Promise<RateLimitEntry | null> {
    try {
      const data = await this.redis.get(key);
      if (!data) {
        return null;
      }

      const entry = JSON.parse(data) as RateLimitEntry;

      // Check if entry has expired
      if (Date.now() > entry.resetTime.getTime()) {
        await this.redis.del(key);
        return null;
      }

      return entry;
    } catch (error) {
      console.error('Redis rate limit get error:', error);
      return null;
    }
  }

  async set(key: string, entry: RateLimitEntry): Promise<void> {
    try {
      const ttl = Math.ceil((entry.resetTime.getTime() - Date.now()) / 1000);
      await this.redis.setex(key, ttl, JSON.stringify(entry));
    } catch (error) {
      console.error('Redis rate limit set error:', error);
    }
  }

  async increment(key: string): Promise<RateLimitEntry> {
    try {
      const pipeline = this.redis.pipeline();
      const now = Date.now();

      pipeline.incr(key);
      pipeline.expire(key, 60); // 1 minute TTL

      const results = await pipeline.exec();
      const count = results[0][1] as number;

      const entry: RateLimitEntry = {
        count,
        resetTime: new Date(now + 60000),
        windowMs: 60000
      };

      return entry;
    } catch (error) {
      console.error('Redis rate limit increment error:', error);
      // Fallback to memory store
      return this.fallbackIncrement(key);
    }
  }

  async reset(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Redis rate limit reset error:', error);
    }
  }

  async cleanup(): Promise<void> {
    // Redis handles cleanup automatically with TTL
  }

  private async fallbackIncrement(key: string): Promise<RateLimitEntry> {
    const memoryStore = new MemoryRateLimitStore();
    return memoryStore.increment(key);
  }
}

export class RateLimiter {
  private store: RateLimitStore;
  private config: RateLimitConfig;

  constructor(store: RateLimitStore, config: RateLimitConfig) {
    this.store = store;
    this.config = {
      message: 'Too many requests, please try again later.',
      statusCode: 429,
      headers: true,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...config
    };
  }

  async checkLimit(req: NextRequest): Promise<RateLimitResult> {
    const key = this.getKey(req);
    const entry = await this.store.increment(key);

    const now = Date.now();
    const resetTime = new Date(entry.resetTime);
    const retryAfter = Math.ceil((resetTime.getTime() - now) / 1000);

    const result: RateLimitResult = {
      success: entry.count <= this.config.maxRequests,
      limit: this.config.maxRequests,
      remaining: Math.max(0, this.config.maxRequests - entry.count),
      resetTime,
      retryAfter: retryAfter > 0 ? retryAfter : undefined
    };

    return result;
  }

  async middleware(req: NextRequest): Promise<NextResponse | null> {
    const result = await this.checkLimit(req);

    if (!result.success) {
      const response = createRateLimitError(
        this.config.message || 'Rate limit exceeded',
        {
          limit: result.limit,
          remaining: result.remaining,
          resetTime: result.resetTime,
          retryAfter: result.retryAfter
        }
      );

      const errorResponse = NextResponse.json(
        {
          success: false,
          error: {
            code: response.code,
            message: response.message,
            details: response.details
          }
        },
        { status: response.statusCode }
      );

      // Add rate limit headers
      if (this.config.headers) {
        errorResponse.headers.set('X-RateLimit-Limit', result.limit.toString());
        errorResponse.headers.set('X-RateLimit-Remaining', result.remaining.toString());
        errorResponse.headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime.getTime() / 1000).toString());

        if (result.retryAfter) {
          errorResponse.headers.set('Retry-After', result.retryAfter.toString());
        }
      }

      // Call onLimitReached callback if provided
      if (this.config.onLimitReached) {
        this.config.onLimitReached(req, errorResponse);
      }

      return errorResponse;
    }

    return null; // Allow request to proceed
  }

  private getKey(req: NextRequest): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(req);
    }

    // Default key generation
    const ip = req.headers.get('x-forwarded-for') ||
               req.headers.get('x-real-ip') ||
               req.ip ||
               'unknown';

    const userAgent = req.headers.get('user-agent') || 'unknown';
    const url = req.url || 'unknown';

    return `rate_limit:${ip}:${Buffer.from(userAgent).toString('base64').substring(0, 16)}:${url}`;
  }
}

// Predefined rate limit configurations
export const RateLimitConfigs = {
  // General API limits
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  },

  // Authentication endpoints (more restrictive)
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many authentication attempts, please try again after 15 minutes.'
  },

  // File upload endpoints
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    message: 'Too many file uploads, please try again after 1 hour.'
  },

  // Search endpoints
  search: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 30,
    message: 'Too many search requests, please try again after 1 minute.'
  },

  // Job application endpoints
  application: {
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    maxRequests: 50,
    message: 'Too many job applications, please try again after 24 hours.'
  },

  // Resume parsing endpoints
  resumeParsing: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20,
    message: 'Too many resume parsing requests, please try again after 1 hour.'
  },

  // Matching system endpoints
  matching: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 60,
    message: 'Too many matching requests, please try again after 1 minute.'
  },

  // Notification endpoints
  notifications: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 30,
    message: 'Too many notification requests, please try again after 1 minute.'
  },

  // Analytics endpoints
  analytics: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 20,
    message: 'Too many analytics requests, please try again after 5 minutes.'
  }
};

// Factory functions
export function createRateLimiter(
  config: RateLimitConfig,
  store?: RateLimitStore
): RateLimiter {
  const rateLimitStore = store || new MemoryRateLimitStore();
  return new RateLimiter(rateLimitStore, config);
}

export function createRateLimitMiddleware(
  config: RateLimitConfig,
  store?: RateLimitStore
) {
  const limiter = createRateLimiter(config, store);

  return async (req: NextRequest): Promise<NextResponse | null> => {
    return limiter.middleware(req);
  };
}

// User-based rate limiting (for authenticated users)
export function createUserRateLimiter(
  userId: string,
  config: RateLimitConfig,
  store?: RateLimitStore
): RateLimiter {
  const userConfig = {
    ...config,
    keyGenerator: (req: NextRequest) => `user_rate_limit:${userId}:${req.url}`
  };

  return createRateLimiter(userConfig, store);
}

// Higher-order function for API routes
export function withRateLimit(
  config: RateLimitConfig,
  store?: RateLimitStore
) {
  const middleware = createRateLimitMiddleware(config, store);

  return function<T extends any[]>(
    handler: (...args: T) => Promise<NextResponse>
  ) {
    return async (...args: T): Promise<NextResponse> => {
      const req = args.find(arg => arg instanceof Request) as NextRequest;

      if (req) {
        const rateLimitResponse = await middleware(req);
        if (rateLimitResponse) {
          return rateLimitResponse;
        }
      }

      return handler(...args);
    };
  };
}

// Rate limiting by user role
export function createRoleBasedRateLimiter(role: string): RateLimiter {
  const configs = {
    admin: RateLimitConfigs.general,
    employer: {
      ...RateLimitConfigs.general,
      maxRequests: 200 // Employers get higher limits
    },
    seeker: RateLimitConfigs.general
  };

  const config = configs[role as keyof typeof configs] || RateLimitConfigs.general;

  return createRateLimiter(config);
}

// Adaptive rate limiting based on system load
export class AdaptiveRateLimiter extends RateLimiter {
  private systemLoadThreshold = 0.8; // 80% CPU/memory usage

  async checkLimit(req: NextRequest): Promise<RateLimitResult> {
    const systemLoad = await this.getSystemLoad();

    if (systemLoad > this.systemLoadThreshold) {
      // Reduce limits during high load
      const originalMax = this.config.maxRequests;
      this.config.maxRequests = Math.floor(originalMax * 0.5); // 50% reduction

      const result = await super.checkLimit(req);

      // Restore original limit
      this.config.maxRequests = originalMax;

      return result;
    }

    return super.checkLimit(req);
  }

  private async getSystemLoad(): Promise<number> {
    try {
      const memUsage = process.memoryUsage();
      const totalMem = memUsage.heapTotal;
      const usedMem = memUsage.heapUsed;

      return usedMem / totalMem;
    } catch (error) {
      console.error('Failed to get system load:', error);
      return 0; // Assume low load on error
    }
  }
}

// Rate limiting for WebSocket connections
export class WebSocketRateLimiter {
  private store: RateLimitStore;
  private config: RateLimitConfig;

  constructor(store: RateLimitStore, config: RateLimitConfig) {
    this.store = store;
    this.config = config;
  }

  async checkConnectionLimit(ip: string): Promise<boolean> {
    const key = `ws_connections:${ip}`;
    const entry = await this.store.get(key);

    if (!entry) {
      await this.store.set(key, {
        count: 1,
        resetTime: new Date(Date.now() + this.config.windowMs),
        windowMs: this.config.windowMs
      });
      return true;
    }

    if (entry.count >= this.config.maxRequests) {
      return false;
    }

    entry.count++;
    await this.store.set(key, entry);
    return true;
  }

  async removeConnection(ip: string): Promise<void> {
    const key = `ws_connections:${ip}`;
    const entry = await this.store.get(key);

    if (entry && entry.count > 0) {
      entry.count--;
      await this.store.set(key, entry);
    }
  }
}

// Initialize default stores
export const memoryStore = new MemoryRateLimitStore();

// Default rate limiters
export const defaultRateLimiter = createRateLimiter(RateLimitConfigs.general, memoryStore);
export const authRateLimiter = createRateLimiter(RateLimitConfigs.auth, memoryStore);
export const uploadRateLimiter = createRateLimiter(RateLimitConfigs.upload, memoryStore);
export const searchRateLimiter = createRateLimiter(RateLimitConfigs.search, memoryStore);
export const applicationRateLimiter = createRateLimiter(RateLimitConfigs.application, memoryStore);
export const resumeParsingRateLimiter = createRateLimiter(RateLimitConfigs.resumeParsing, memoryStore);
export const matchingRateLimiter = createRateLimiter(RateLimitConfigs.matching, memoryStore);
export const notificationsRateLimiter = createRateLimiter(RateLimitConfigs.notifications, memoryStore);
export const analyticsRateLimiter = createRateLimiter(RateLimitConfigs.analytics, memoryStore);

export default {
  RateLimiter,
  MemoryRateLimitStore,
  RedisRateLimitStore,
  AdaptiveRateLimiter,
  WebSocketRateLimiter,
  createRateLimiter,
  createRateLimitMiddleware,
  withRateLimit,
  createUserRateLimiter,
  createRoleBasedRateLimiter,
  RateLimitConfigs,
  memoryStore,
  defaultRateLimiter,
  authRateLimiter,
  uploadRateLimiter,
  searchRateLimiter,
  applicationRateLimiter,
  resumeParsingRateLimiter,
  matchingRateLimiter,
  notificationsRateLimiter,
  analyticsRateLimiter
};