import { Request, Response, NextFunction } from 'express'
import { Redis } from 'ioredis'
import { notificationConfig } from '../config/deployment'

interface RateLimitOptions {
  windowMs: number
  maxRequests: number
  keyGenerator?: (req: Request) => string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  message?: string
  headers?: boolean
}

/**
 * Redis-based rate limiter
 */
class RedisRateLimiter {
  private redis: Redis
  private options: Required<RateLimitOptions>

  constructor(redis: Redis, options: RateLimitOptions) {
    this.redis = redis
    this.options = {
      keyGenerator: (req) => req.ip,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      message: 'Too many requests, please try again later',
      headers: true,
      ...options,
    }
  }

  /**
   * Create rate limit middleware
   */
  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const key = `rate_limit:${this.options.keyGenerator(req)}`
        const now = Date.now()
        const window = this.options.windowMs

        // Use sliding window log algorithm
        const pipeline = this.redis.pipeline()
        
        // Remove expired entries
        pipeline.zremrangebyscore(key, 0, now - window)
        
        // Count current requests in window
        pipeline.zcard(key)
        
        // Add current request
        pipeline.zadd(key, now, `${now}-${Math.random()}`)
        
        // Set expiration
        pipeline.expire(key, Math.ceil(window / 1000))
        
        const results = await pipeline.exec()
        
        if (!results) {
          throw new Error('Redis pipeline execution failed')
        }

        const count = results[1][1] as number
        const remaining = Math.max(0, this.options.maxRequests - count - 1)
        const resetTime = new Date(now + window)

        // Add rate limit headers
        if (this.options.headers) {
          res.set({
            'X-RateLimit-Limit': this.options.maxRequests.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': resetTime.toISOString(),
            'X-RateLimit-Window': this.options.windowMs.toString(),
          })
        }

        // Check if rate limit exceeded
        if (count >= this.options.maxRequests) {
          res.set('Retry-After', Math.ceil(window / 1000).toString())
          
          return res.status(429).json({
            success: false,
            error: this.options.message,
            retryAfter: Math.ceil(window / 1000),
          })
        }

        // Store rate limit info for potential cleanup
        res.on('finish', () => {
          const shouldSkip = 
            (this.options.skipSuccessfulRequests && res.statusCode < 400) ||
            (this.options.skipFailedRequests && res.statusCode >= 400)

          if (shouldSkip) {
            // Remove the request we just added
            this.redis.zrem(key, `${now}-${Math.random()}`)
          }
        })

        next()
      } catch (error) {
        console.error('Rate limiting error:', error)
        // Fail open - allow request if rate limiting fails
        next()
      }
    }
  }
}

/**
 * In-memory rate limiter (fallback)
 */
class MemoryRateLimiter {
  private store = new Map<string, { count: number; resetTime: number }>()
  private options: Required<RateLimitOptions>

  constructor(options: RateLimitOptions) {
    this.options = {
      keyGenerator: (req) => req.ip,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      message: 'Too many requests, please try again later',
      headers: true,
      ...options,
    }

    // Cleanup expired entries every minute
    setInterval(() => this.cleanup(), 60000)
  }

  private cleanup() {
    const now = Date.now()
    for (const [key, value] of this.store.entries()) {
      if (value.resetTime <= now) {
        this.store.delete(key)
      }
    }
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const key = this.options.keyGenerator(req)
        const now = Date.now()
        const resetTime = now + this.options.windowMs

        let entry = this.store.get(key)
        
        if (!entry || entry.resetTime <= now) {
          entry = { count: 0, resetTime }
          this.store.set(key, entry)
        }

        entry.count++
        const remaining = Math.max(0, this.options.maxRequests - entry.count)

        // Add rate limit headers
        if (this.options.headers) {
          res.set({
            'X-RateLimit-Limit': this.options.maxRequests.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': new Date(entry.resetTime).toISOString(),
            'X-RateLimit-Window': this.options.windowMs.toString(),
          })
        }

        // Check if rate limit exceeded
        if (entry.count > this.options.maxRequests) {
          res.set('Retry-After', Math.ceil((entry.resetTime - now) / 1000).toString())
          
          return res.status(429).json({
            success: false,
            error: this.options.message,
            retryAfter: Math.ceil((entry.resetTime - now) / 1000),
          })
        }

        // Handle cleanup on response
        res.on('finish', () => {
          const shouldSkip = 
            (this.options.skipSuccessfulRequests && res.statusCode < 400) ||
            (this.options.skipFailedRequests && res.statusCode >= 400)

          if (shouldSkip && entry) {
            entry.count--
          }
        })

        next()
      } catch (error) {
        console.error('Memory rate limiting error:', error)
        // Fail open - allow request if rate limiting fails
        next()
      }
    }
  }
}

// Create Redis connection for rate limiting
let redis: Redis | null = null
try {
  redis = new Redis({
    host: notificationConfig.queue.redis.host,
    port: notificationConfig.queue.redis.port,
    password: notificationConfig.queue.redis.password,
    db: notificationConfig.queue.redis.db + 1, // Use different DB for rate limiting
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  })
} catch (error) {
  console.warn('Failed to create Redis connection for rate limiting, falling back to memory store')
}

/**
 * Create rate limit middleware
 */
function createRateLimiter(options: RateLimitOptions) {
  if (redis) {
    return new RedisRateLimiter(redis, options).middleware()
  } else {
    return new MemoryRateLimiter(options).middleware()
  }
}

/**
 * General API rate limiting
 */
export const rateLimitMiddleware = createRateLimiter({
  windowMs: notificationConfig.security.rateLimit.windowMs,
  maxRequests: notificationConfig.security.rateLimit.maxRequests,
  message: 'Too many API requests, please try again later',
})

/**
 * Strict rate limiting for sensitive endpoints
 */
export const strictRateLimitMiddleware = createRateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 10,
  message: 'Too many requests to sensitive endpoint, please try again later',
})

/**
 * Bulk operation rate limiting
 */
export const bulkRateLimitMiddleware = createRateLimiter({
  windowMs: 300000, // 5 minutes
  maxRequests: 5,
  message: 'Too many bulk operations, please try again later',
})

/**
 * User-specific rate limiting
 */
export const userRateLimitMiddleware = createRateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 100,
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise fall back to IP
    return (req as any).user?.id || req.ip
  },
  message: 'Too many requests from this user, please try again later',
})

/**
 * Webhook rate limiting
 */
export const webhookRateLimitMiddleware = createRateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 1000, // Higher limit for webhooks
  keyGenerator: (req) => {
    // Use webhook source if available, otherwise IP
    const source = req.headers['x-webhook-source'] || req.headers['user-agent'] || req.ip
    return `webhook:${source}`
  },
  message: 'Too many webhook requests, please try again later',
})

/**
 * Dynamic rate limiting based on user tier
 */
export function createTieredRateLimiter(tiers: {
  [tier: string]: { windowMs: number; maxRequests: number }
}) {
  const limiters = Object.entries(tiers).reduce((acc, [tier, options]) => {
    acc[tier] = createRateLimiter(options)
    return acc
  }, {} as Record<string, any>)

  return (req: Request, res: Response, next: NextFunction) => {
    const userTier = (req as any).user?.tier || 'free'
    const limiter = limiters[userTier] || limiters['free']
    
    if (limiter) {
      return limiter(req, res, next)
    }
    
    next()
  }
}

/**
 * Rate limiting for notification sending
 */
export const notificationSendRateLimiter = createTieredRateLimiter({
  free: { windowMs: 3600000, maxRequests: 100 }, // 100 per hour
  pro: { windowMs: 3600000, maxRequests: 1000 }, // 1000 per hour
  enterprise: { windowMs: 3600000, maxRequests: 10000 }, // 10000 per hour
})

/**
 * Adaptive rate limiting based on system load
 */
export function createAdaptiveRateLimiter(baseOptions: RateLimitOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Get system metrics (simplified example)
    const cpuUsage = process.cpuUsage()
    const memoryUsage = process.memoryUsage()
    
    // Calculate load factor (0-1, where 1 is high load)
    const loadFactor = Math.min(1, (memoryUsage.heapUsed / memoryUsage.heapTotal) * 0.7 + 0.3)
    
    // Adjust rate limit based on load
    const adjustedMaxRequests = Math.floor(baseOptions.maxRequests * (1 - loadFactor * 0.5))
    
    const adaptedOptions = {
      ...baseOptions,
      maxRequests: Math.max(1, adjustedMaxRequests),
    }
    
    const limiter = createRateLimiter(adaptedOptions)
    return limiter(req, res, next)
  }
}

/**
 * Rate limiting with custom key and bypass conditions
 */
export function createCustomRateLimiter(options: RateLimitOptions & {
  bypass?: (req: Request) => boolean
  customKey?: (req: Request) => string
}) {
  const limiter = createRateLimiter(options)
  
  return (req: Request, res: Response, next: NextFunction) => {
    // Check bypass condition
    if (options.bypass && options.bypass(req)) {
      return next()
    }
    
    // Apply custom key if provided
    if (options.customKey) {
      const originalKeyGenerator = options.keyGenerator
      options.keyGenerator = options.customKey
    }
    
    return limiter(req, res, next)
  }
}

/**
 * Export rate limiting utilities
 */
export {
  RedisRateLimiter,
  MemoryRateLimiter,
  createRateLimiter,
  createTieredRateLimiter,
  createAdaptiveRateLimiter,
  createCustomRateLimiter,
}