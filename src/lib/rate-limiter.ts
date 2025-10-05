export interface RateLimiterConfig {
  maxRequests: number;
  windowMs: number;
  keyPrefix?: string;
}

export class RateLimiter {
  private config: RateLimiterConfig;
  private requests: Map<string, number[]>;

  constructor(config: RateLimiterConfig) {
    this.config = config;
    this.requests = new Map();
  }

  async check(key: string = 'default'): Promise<void> {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    const fullKey = `${this.config.keyPrefix || ''}:${key}`;

    // Get current requests in window
    let timestamps = this.requests.get(fullKey) || [];
    timestamps = timestamps.filter(time => time > windowStart);

    if (timestamps.length >= this.config.maxRequests) {
      throw new Error('Rate limit exceeded');
    }

    timestamps.push(now);
    this.requests.set(fullKey, timestamps);
  }

  async reset(key: string = 'default'): Promise<void> {
    const fullKey = `${this.config.keyPrefix || ''}:${key}`;
    this.requests.delete(fullKey);
  }
}
