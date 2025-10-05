import { createClient } from 'redis'

export interface RateLimiterConfig {
  maxRequests: number;
  windowMs: number;
  keyPrefix?: string;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
}

export class RateLimiter {
  private config: RateLimiterConfig;
  private requests: Map<string, number[]>;
  private redisClient?: any;

  constructor(config: RateLimiterConfig) {
    this.config = config;
    this.requests = new Map();
    
    // Initialize Redis client if URL is available
    if (process.env.REDIS_URL) {
      this.redisClient = createClient({
        url: process.env.REDIS_URL
      });
      this.redisClient.connect().catch(console.error);
    }
  }

  async limit(key: string = 'default'): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    const fullKey = `${this.config.keyPrefix || 'rate_limit'}:${key}`;

    if (this.redisClient) {
      return this.limitWithRedis(fullKey, now, windowStart);
    } else {
      return this.limitInMemory(fullKey, now, windowStart);
    }
  }

  private async limitWithRedis(key: string, now: number, windowStart: number): Promise<RateLimitResult> {
    try {
      // Remove expired entries
      await this.redisClient.zremrangebyscore(key, 0, windowStart);
      
      // Count current requests
      const currentCount = await this.redisClient.zcard(key);
      
      if (currentCount >= this.config.maxRequests) {
        const oldestRequest = await this.redisClient.zrange(key, 0, 0, { WITHSCORES: true });
        const resetTime = oldestRequest.length > 0 ? 
          new Date(Number(oldestRequest[1]) + this.config.windowMs) : 
          new Date(now + this.config.windowMs);
          
        return {
          success: false,
          limit: this.config.maxRequests,
          remaining: 0,
          reset: resetTime
        };
      }

      // Add current request
      await this.redisClient.zadd(key, now, `${now}-${Math.random()}`);
      await this.redisClient.expire(key, Math.ceil(this.config.windowMs / 1000));

      return {
        success: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests - currentCount - 1,
        reset: new Date(now + this.config.windowMs)
      };
    } catch (error) {
      console.error('Redis rate limiting error:', error);
      // Fallback to in-memory
      return this.limitInMemory(key, now, windowStart);
    }
  }

  private async limitInMemory(key: string, now: number, windowStart: number): Promise<RateLimitResult> {
    // Get current requests in window
    let timestamps = this.requests.get(key) || [];
    timestamps = timestamps.filter(time => time > windowStart);

    if (timestamps.length >= this.config.maxRequests) {
      const resetTime = new Date(timestamps[0] + this.config.windowMs);
      return {
        success: false,
        limit: this.config.maxRequests,
        remaining: 0,
        reset: resetTime
      };
    }

    timestamps.push(now);
    this.requests.set(key, timestamps);

    return {
      success: true,
      limit: this.config.maxRequests,
      remaining: this.config.maxRequests - timestamps.length,
      reset: new Date(now + this.config.windowMs)
    };
  }

  async check(key: string = 'default'): Promise<void> {
    const result = await this.limit(key);
    if (!result.success) {
      throw new Error('Rate limit exceeded');
    }
  }

  async reset(key: string = 'default'): Promise<void> {
    const fullKey = `${this.config.keyPrefix || 'rate_limit'}:${key}`;
    
    if (this.redisClient) {
      try {
        await this.redisClient.del(fullKey);
      } catch (error) {
        console.error('Redis reset error:', error);
      }
    }
    
    this.requests.delete(fullKey);
  }
}

// Pre-configured rate limiter for password reset requests
export const passwordResetLimiter = new RateLimiter({
  maxRequests: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
  keyPrefix: 'password_reset'
});
