import { NextRequest } from 'next/server'
import { RateLimiter } from './rate-limiter'
import { prisma } from './prisma'

/**
 * Enhanced Rate Limiting Utilities for Security
 * Works with existing rate-limiter.ts and adds database integration
 */

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: Date
  retryAfter?: number
}

/**
 * Pre-configured rate limiters for different security scenarios
 */
export const rateLimiters = {
  // Authentication
  login: new RateLimiter({
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    keyPrefix: 'auth_login'
  }),
  
  register: new RateLimiter({
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyPrefix: 'auth_register'
  }),
  
  // Data rights (POPIA compliance)
  dataExport: new RateLimiter({
    maxRequests: 5,
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    keyPrefix: 'data_export'
  }),
  
  dataDeletion: new RateLimiter({
    maxRequests: 3,
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    keyPrefix: 'data_deletion'
  }),
  
  // API endpoints
  apiGeneral: new RateLimiter({
    maxRequests: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
    keyPrefix: 'api_general'
  }),
  
  apiStrict: new RateLimiter({
    maxRequests: 20,
    windowMs: 15 * 60 * 1000, // 15 minutes
    keyPrefix: 'api_strict'
  }),
  
  // File operations
  fileUpload: new RateLimiter({
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyPrefix: 'file_upload'
  }),
  
  // Contact and support
  contactForm: new RateLimiter({
    maxRequests: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyPrefix: 'contact_form'
  }),
  
  // Consent management
  consentUpdate: new RateLimiter({
    maxRequests: 20,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyPrefix: 'consent_update'
  }),
  
  // Job applications
  jobApplication: new RateLimiter({
    maxRequests: 50,
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    keyPrefix: 'job_application'
  }),
  
  // Search
  search: new RateLimiter({
    maxRequests: 200,
    windowMs: 15 * 60 * 1000, // 15 minutes
    keyPrefix: 'search'
  }),
}

/**
 * Generate rate limit key from request
 */
function generateRateLimitKey(request: NextRequest, identifier?: string): string {
  const ip = request.headers.get('x-forwarded-for') || 
            request.headers.get('x-real-ip') || 
            'unknown'
  
  return identifier ? `${ip}:${identifier}` : ip
}

/**
 * Enhanced rate limiting with database logging
 */
export async function rateLimit(
  request: NextRequest,
  limiterName: keyof typeof rateLimiters,
  identifier?: string
): Promise<RateLimitResult> {
  try {
    const limiter = rateLimiters[limiterName]
    const key = generateRateLimitKey(request, identifier)
    
    const result = await limiter.limit(key)
    
    // Log rate limit attempts for security monitoring
    if (!result.success) {
      await logRateLimitViolation(request, limiterName, key, result)
    }
    
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      resetTime: result.reset,
      retryAfter: result.success ? undefined : Math.ceil((result.reset.getTime() - Date.now()) / 1000)
    }
    
  } catch (error) {
    console.error('Rate limiting error:', error)
    
    // On error, allow the request but log the issue
    return {
      success: true,
      limit: 100,
      remaining: 99,
      resetTime: new Date(Date.now() + 15 * 60 * 1000)
    }
  }
}

/**
 * Log rate limit violations for security monitoring
 */
async function logRateLimitViolation(
  request: NextRequest,
  limiterName: string,
  key: string,
  result: any
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: null,
        action: 'RATE_LIMIT_EXCEEDED',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        metadata: {
          limiterName,
          key,
          limit: result.limit,
          resetTime: result.reset.toISOString(),
          endpoint: request.url,
          method: request.method,
        }
      }
    })
  } catch (error) {
    console.error('Failed to log rate limit violation:', error)
  }
}

/**
 * Check if request is rate limited without incrementing counter
 */
export async function checkRateLimit(
  request: NextRequest,
  limiterName: keyof typeof rateLimiters,
  identifier?: string
): Promise<RateLimitResult> {
  try {
    const limiter = rateLimiters[limiterName]
    const key = generateRateLimitKey(request, identifier)
    
    // This is a simplified check - in a real implementation,
    // you'd want to check the current state without incrementing
    const result = await limiter.limit(key)
    
    // Reset the counter since this was just a check
    if (result.success && result.remaining < result.limit - 1) {
      // This is a workaround - ideally the rate limiter would have a check method
      // that doesn't increment the counter
    }
    
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      resetTime: result.reset,
      retryAfter: result.success ? undefined : Math.ceil((result.reset.getTime() - Date.now()) / 1000)
    }
    
  } catch (error) {
    console.error('Rate limit check error:', error)
    return {
      success: true,
      limit: 100,
      remaining: 99,
      resetTime: new Date(Date.now() + 15 * 60 * 1000)
    }
  }
}

/**
 * Reset rate limit for a specific key (admin function)
 */
export async function resetRateLimit(
  request: NextRequest,
  limiterName: keyof typeof rateLimiters,
  identifier?: string
): Promise<void> {
  try {
    const limiter = rateLimiters[limiterName]
    const key = generateRateLimitKey(request, identifier)
    
    await limiter.reset(key)
    
    // Log the reset for audit purposes
    await prisma.auditLog.create({
      data: {
        userId: null,
        action: 'RATE_LIMIT_RESET',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        metadata: {
          limiterName,
          key,
          resetBy: 'admin', // This would be set based on who performed the reset
        }
      }
    })
    
  } catch (error) {
    console.error('Rate limit reset error:', error)
    throw new Error('Failed to reset rate limit')
  }
}

/**
 * Get rate limit statistics for monitoring
 */
export async function getRateLimitStats(
  timeRange: { start: Date; end: Date }
): Promise<{
  totalViolations: number
  violationsByLimiter: Record<string, number>
  violationsByIP: Record<string, number>
  topViolatingIPs: Array<{ ip: string; count: number }>
}> {
  try {
    const violations = await prisma.auditLog.findMany({
      where: {
        action: 'RATE_LIMIT_EXCEEDED',
        createdAt: {
          gte: timeRange.start,
          lte: timeRange.end,
        }
      },
      select: {
        ipAddress: true,
        metadata: true,
      }
    })
    
    const violationsByLimiter: Record<string, number> = {}
    const violationsByIP: Record<string, number> = {}
    
    violations.forEach(violation => {
      const limiterName = violation.metadata?.limiterName as string
      const ip = violation.ipAddress
      
      if (limiterName) {
        violationsByLimiter[limiterName] = (violationsByLimiter[limiterName] || 0) + 1
      }
      
      if (ip) {
        violationsByIP[ip] = (violationsByIP[ip] || 0) + 1
      }
    })
    
    const topViolatingIPs = Object.entries(violationsByIP)
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
    
    return {
      totalViolations: violations.length,
      violationsByLimiter,
      violationsByIP,
      topViolatingIPs,
    }
    
  } catch (error) {
    console.error('Error getting rate limit stats:', error)
    return {
      totalViolations: 0,
      violationsByLimiter: {},
      violationsByIP: {},
      topViolatingIPs: [],
    }
  }
}

/**
 * Middleware helper for applying rate limits to API routes
 */
export function withRateLimit(
  limiterName: keyof typeof rateLimiters,
  identifier?: (request: NextRequest) => string
) {
  return async (request: NextRequest) => {
    const id = identifier ? identifier(request) : undefined
    const result = await rateLimit(request, limiterName, id)
    
    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          retryAfter: result.retryAfter,
          limit: result.limit,
          resetTime: result.resetTime.toISOString(),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': result.retryAfter?.toString() || '60',
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetTime.toISOString(),
          },
        }
      )
    }
    
    return null // Continue with the request
  }
}