import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { MatchingCoreService } from '@/services/matching/core-service';
import { MatchFilters, SortOptions } from '@/types/matching';
import { findMatchesSchema } from '@/lib/validation/matching-schemas';
import { logger } from '@/lib/logging/logger';
import { rateLimitMiddleware } from '@/middleware/rate-limit';
import { errorHandler } from '@/middleware/error-handler';

/**
 * POST /api/matching/find-matches - Find matches for candidates or jobs
 */
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimitMiddleware(request, 'api');
    if (rateLimitResponse) return rateLimitResponse;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = findMatchesSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validation.error.errors
        },
        { status: 400 }
      );
    }

    const { type, id, filters, sort, limit, offset } = validation.data;

    // Initialize matching service
    const matchingService = new MatchingCoreService();

    let result;

    if (type === 'candidates-for-job') {
      // Check if user has permission to view candidates for this job
      const hasPermission = await checkJobViewPermission(session.user.id, id, session.user.role);
      if (!hasPermission) {
        return NextResponse.json(
          { error: 'Permission denied' },
          { status: 403 }
        );
      }

      result = await matchingService.findCandidatesForJob(
        id,
        filters,
        sort,
        limit,
        offset
      );
    } else if (type === 'jobs-for-candidate') {
      // Check if user has permission to view jobs for this candidate
      const hasPermission = await checkCandidateViewPermission(session.user.id, id, session.user.role);
      if (!hasPermission) {
        return NextResponse.json(
          { error: 'Permission denied' },
          { status: 403 }
        );
      }

      result = await matchingService.findJobsForCandidate(
        id,
        filters,
        sort,
        limit,
        offset
      );
    } else {
      return NextResponse.json(
        { error: 'Invalid match type. Must be "candidates-for-job" or "jobs-for-candidate"' },
        { status: 400 }
      );
    }

    logger.info('Matches found successfully', {
      type,
      id,
      userId: session.user.id,
      total: result.total,
      returned: result.data.length
    });

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        type,
        id,
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
        hasMore: result.hasMore,
        filters,
        sort
      }
    });

  } catch (error) {
    return errorHandler(error, request, 'find-matches');
  }
}

/**
 * GET /api/matching/find-matches - Get match statistics and available options
 */
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimitMiddleware(request, 'api');
    if (rateLimitResponse) return rateLimitResponse;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'stats') {
      // Get matching statistics
      const matchingService = new MatchingCoreService();
      const filters = parseStatsFilters(searchParams);
      const stats = await matchingService.getMatchStats(filters);

      return NextResponse.json({
        success: true,
        data: stats
      });
    } else if (action === 'options') {
      // Get available filter and sort options
      const options = getMatchingOptions();

      return NextResponse.json({
        success: true,
        data: options
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "stats" or "options"' },
        { status: 400 }
      );
    }

  } catch (error) {
    return errorHandler(error, request, 'find-matches');
  }
}

/**
 * Check if user has permission to view candidates for a job
 */
async function checkJobViewPermission(
  userId: string,
  jobId: string,
  userRole: string
): Promise<boolean> {
  try {
    const { prisma } = await import('@/lib/prisma');

    // Admin can view all
    if (userRole === 'ADMIN') {
      return true;
    }

    // Check if user owns the job
    const job = await prisma.jobProfile.findUnique({
      where: { id: jobId },
      select: { userId: true }
    });

    if (!job) {
      return false;
    }

    return job.userId === userId;
  } catch (error) {
    logger.error('Error checking job view permission', {
      userId,
      jobId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return false;
  }
}

/**
 * Check if user has permission to view jobs for a candidate
 */
async function checkCandidateViewPermission(
  userId: string,
  candidateId: string,
  userRole: string
): Promise<boolean> {
  try {
    const { prisma } = await import('@/lib/prisma');

    // Admin can view all
    if (userRole === 'ADMIN') {
      return true;
    }

    // Check if user owns the candidate profile
    const candidate = await prisma.candidateProfile.findUnique({
      where: { id: candidateId },
      select: { userId: true }
    });

    if (!candidate) {
      return false;
    }

    return candidate.userId === userId;
  } catch (error) {
    logger.error('Error checking candidate view permission', {
      userId,
      candidateId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return false;
  }
}

/**
 * Parse statistics filters from search params
 */
function parseStatsFilters(searchParams: URLSearchParams): any {
  const filters: any = {};

  const startDate = searchParams.get('startDate');
  if (startDate) {
    filters.startDate = new Date(startDate);
  }

  const endDate = searchParams.get('endDate');
  if (endDate) {
    filters.endDate = new Date(endDate);
  }

  const minScore = searchParams.get('minScore');
  if (minScore) {
    const score = parseFloat(minScore);
    if (!isNaN(score)) {
      filters.minScore = score;
    }
  }

  const candidateId = searchParams.get('candidateId');
  if (candidateId) {
    filters.candidateId = candidateId;
  }

  const jobId = searchParams.get('jobId');
  if (jobId) {
    filters.jobId = jobId;
  }

  return filters;
}

/**
 * Get available matching options
 */
function getMatchingOptions() {
  return {
    types: [
      { value: 'candidates-for-job', label: 'Candidates for Job' },
      { value: 'jobs-for-candidate', label: 'Jobs for Candidate' }
    ],
    filterFields: [
      {
        name: 'skills',
        type: 'array',
        label: 'Skills',
        description: 'Filter by required skills'
      },
      {
        name: 'location',
        type: 'string',
        label: 'Location',
        description: 'Filter by location'
      },
      {
        name: 'experienceLevel',
        type: 'array',
        label: 'Experience Level',
        options: ['entry', 'junior', 'mid', 'senior', 'lead', 'principal', 'executive']
      },
      {
        name: 'educationLevel',
        type: 'string',
        label: 'Education Level',
        options: ['high-school', 'associate', 'bachelor', 'master', 'phd', 'postdoc']
      },
      {
        name: 'minSalary',
        type: 'number',
        label: 'Minimum Salary',
        description: 'Minimum salary expectation'
      },
      {
        name: 'maxSalary',
        type: 'number',
        label: 'Maximum Salary',
        description: 'Maximum salary expectation'
      },
      {
        name: 'industry',
        type: 'array',
        label: 'Industry',
        description: 'Filter by industry'
      },
      {
        name: 'jobType',
        type: 'array',
        label: 'Job Type',
        options: ['full-time', 'part-time', 'contract', 'internship', 'temporary']
      },
      {
        name: 'remoteWorkPolicy',
        type: 'boolean',
        label: 'Remote Work',
        description: 'Filter by remote work policy'
      },
      {
        name: 'minScore',
        type: 'number',
        label: 'Minimum Match Score',
        description: 'Minimum match score (0-100)',
        min: 0,
        max: 100
      }
    ],
    sortFields: [
      { value: 'matchScore', label: 'Match Score' },
      { value: 'matchConfidence', label: 'Match Confidence' },
      { value: 'lastMatched', label: 'Last Matched' }
    ],
    sortOrders: [
      { value: 'asc', label: 'Ascending' },
      { value: 'desc', label: 'Descending' }
    ],
    defaultLimits: [10, 25, 50, 100],
    maxLimit: 100
  };
}