import { RateLimiter } from './rate-limiter';

// Default rate limiter for general API endpoints
export const defaultRateLimit = new RateLimiter({
  maxRequests: 100,
  windowMs: 15 * 60 * 1000, // 15 minutes
  keyPrefix: 'api_default'
});

// Strict rate limiter for sensitive endpoints
export const strictRateLimit = new RateLimiter({
  maxRequests: 10,
  windowMs: 15 * 60 * 1000, // 15 minutes
  keyPrefix: 'api_strict'
});

// Lenient rate limiter for public endpoints
export const lenientRateLimit = new RateLimiter({
  maxRequests: 1000,
  windowMs: 15 * 60 * 1000, // 15 minutes
  keyPrefix: 'api_lenient'
});

// Incidents-specific rate limiter
export const incidentsRateLimit = new RateLimiter({
  maxRequests: 50,
  windowMs: 15 * 60 * 1000, // 15 minutes
  keyPrefix: 'incidents'
});

// Export the main rate limit function for convenience
export const rateLimit = defaultRateLimit.limit.bind(defaultRateLimit);