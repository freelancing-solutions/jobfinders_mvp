import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { RateLimiter } from '@/lib/rate-limit-utils';

// Rate limiting configurations
const MATCHING_RATE_LIMITS = {
  // Profile operations - more restrictive
  profile: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // 50 requests per 15 minutes
    message: 'Too many profile requests, please try again later.'
  },
  // Search operations - less restrictive
  search: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // 200 requests per 15 minutes
    message: 'Too many search requests, please try again later.'
  },
  // Analysis operations - very restrictive
  analysis: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 requests per hour
    message: 'Too many analysis requests, please try again later.'
  }
};

// Role-based access control
export const ROLE_PERMISSIONS = {
  seeker: {
    // Can manage their own profiles
    'POST:/api/matching/profiles/candidates': true,
    'PUT:/api/matching/profiles/candidates': true,
    'DELETE:/api/matching/profiles/candidates': true,
    'GET:/api/matching/profiles/candidates': true,
    // Can search for jobs
    'GET:/api/matching/profiles/jobs': true,
    // Can analyze their own profiles
    'POST:/api/matching/analysis/candidate': true,
    // Cannot access employer-specific endpoints
    'POST:/api/matching/profiles/jobs': false,
    'PUT:/api/matching/profiles/jobs': false,
    'DELETE:/api/matching/profiles/jobs': false,
  },
  employer: {
    // Can manage job profiles
    'POST:/api/matching/profiles/jobs': true,
    'PUT:/api/matching/profiles/jobs': true,
    'DELETE:/api/matching/profiles/jobs': true,
    'GET:/api/matching/profiles/jobs': true,
    // Can search for candidates
    'GET:/api/matching/profiles/candidates': true,
    // Can analyze job profiles
    'POST:/api/matching/analysis/job': true,
    // Cannot access seeker-specific endpoints
    'POST:/api/matching/profiles/candidates': false,
    'PUT:/api/matching/profiles/candidates': false,
    'DELETE:/api/matching/profiles/candidates': false,
  },
  admin: {
    // Can access all endpoints
    'POST:/api/matching/profiles/candidates': true,
    'PUT:/api/matching/profiles/candidates': true,
    'DELETE:/api/matching/profiles/candidates': true,
    'GET:/api/matching/profiles/candidates': true,
    'POST:/api/matching/profiles/jobs': true,
    'PUT:/api/matching/profiles/jobs': true,
    'DELETE:/api/matching/profiles/jobs': true,
    'GET:/api/matching/profiles/jobs': true,
    'POST:/api/matching/analysis/candidate': true,
    'POST:/api/matching/analysis/job': true,
  }
} as const;

interface MatchingAuthOptions {
  requireRole?: 'seeker' | 'employer' | 'admin';
  requireSubscription?: boolean;
  rateLimitType?: 'profile' | 'search' | 'analysis';
  skipRateLimit?: boolean;
}

/**
 * Enhanced authentication middleware for matching API endpoints
 */
export async function withMatchingAuth(
  request: NextRequest,
  options: MatchingAuthOptions = {}
) {
  const {
    requireRole,
    requireSubscription = false,
    rateLimitType = 'search',
    skipRateLimit = false
  } = options;

  try {
    // 1. Check session authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    // 2. Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        uid: true,
        email: true,
        role: true,
        isActive: true,
        employerProfile: {
          select: {
            companyId: true,
            isVerified: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is inactive', code: 'ACCOUNT_INACTIVE' },
        { status: 403 }
      );
    }

    // 3. Role-based access control
    const userRole = user.role as keyof typeof ROLE_PERMISSIONS;
    const endpoint = `${request.method}:${request.nextUrl.pathname}`;

    if (requireRole && userRole !== requireRole) {
      return NextResponse.json(
        { error: `Access denied. Required role: ${requireRole}`, code: 'ROLE_REQUIRED' },
        { status: 403 }
      );
    }

    if (ROLE_PERMISSIONS[userRole] && ROLE_PERMISSIONS[userRole][endpoint as keyof typeof ROLE_PERMISSIONS[typeof userRole]] === false) {
      return NextResponse.json(
        { error: 'Access denied. Insufficient permissions', code: 'PERMISSION_DENIED' },
        { status: 403 }
      );
    }

    // 4. Rate limiting
    if (!skipRateLimit) {
      const rateLimitConfig = MATCHING_RATE_LIMITS[rateLimitType];
      const limiter = new RateLimiter(rateLimitConfig);

      const clientId = request.ip || session.user.email || 'unknown';
      const isAllowed = await limiter.isAllowed(clientId);

      if (!isAllowed) {
        return NextResponse.json(
          {
            error: rateLimitConfig.message,
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: Math.ceil(rateLimitConfig.windowMs / 1000)
          },
          {
            status: 429,
            headers: {
              'Retry-After': Math.ceil(rateLimitConfig.windowMs / 1000).toString(),
              'X-RateLimit-Limit': rateLimitConfig.max.toString(),
              'X-RateLimit-Remaining': '0'
            }
          }
        );
      }
    }

    // 5. Subscription check (if required)
    if (requireSubscription) {
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId: user.uid,
          status: 'ACTIVE',
          endDate: { gt: new Date() },
        },
        include: { plan: true }
      });

      if (!subscription) {
        return NextResponse.json(
          { error: 'Active subscription required', code: 'SUBSCRIPTION_REQUIRED' },
          { status: 403 }
        );
      }

      // Check if subscription includes matching features
      const hasMatchingFeature = subscription.plan.features.includes('matching');
      if (!hasMatchingFeature) {
        return NextResponse.json(
          {
            error: 'Your subscription does not include matching features',
            code: 'FEATURE_NOT_INCLUDED',
            requiredFeature: 'matching'
          },
          { status: 403 }
        );
      }
    }

    // 6. Return user context for downstream handlers
    return {
      user: {
        id: user.uid,
        email: user.email,
        role: user.role,
        employerProfile: user.employerProfile
      },
      session
    };

  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * Owner verification middleware - ensures users can only access their own resources
 */
export async function verifyResourceOwnership(
  userId: string,
  resourceType: 'candidate_profile' | 'job_profile',
  resourceId: string
): Promise<boolean> {
  try {
    switch (resourceType) {
      case 'candidate_profile':
        const candidateProfile = await prisma.candidateProfile.findUnique({
          where: { id: resourceId },
          select: { userId: true }
        });
        return candidateProfile?.userId === userId;

      case 'job_profile':
        const jobProfile = await prisma.jobProfile.findUnique({
          where: { id: resourceId },
          select: { employerId: true }
        });
        return jobProfile?.employerId === userId;

      default:
        return false;
    }
  } catch (error) {
    console.error('Ownership verification error:', error);
    return false;
  }
}

/**
 * Rate limiting helper for specific endpoints
 */
export function createRateLimiter(type: 'profile' | 'search' | 'analysis') {
  const config = MATCHING_RATE_LIMITS[type];
  return new RateLimiter(config);
}

/**
 * Validate user can perform operation on resource
 */
export async function canAccessResource(
  user: { id: string; role: string },
  operation: 'read' | 'write' | 'delete',
  resourceType: 'candidate_profile' | 'job_profile',
  resourceId: string
): Promise<{ allowed: boolean; reason?: string }> {
  // Admin can access everything
  if (user.role === 'admin') {
    return { allowed: true };
  }

  // Check ownership for write and delete operations
  if (operation !== 'read') {
    const isOwner = await verifyResourceOwnership(user.id, resourceType, resourceId);
    if (!isOwner) {
      return {
        allowed: false,
        reason: 'You can only modify your own resources'
      };
    }
  }

  // Role-based access for read operations
  if (operation === 'read') {
    if (resourceType === 'candidate_profile' && user.role === 'employer') {
      // Employers can search candidate profiles
      return { allowed: true };
    }
    if (resourceType === 'job_profile' && user.role === 'seeker') {
      // Seekers can search job profiles
      return { allowed: true };
    }
  }

  return { allowed: true };
}