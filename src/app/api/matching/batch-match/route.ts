import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { MatchingCoreService } from '@/services/matching/core-service';
import { BatchProcessor } from '@/lib/matching/batch-processor';
import { BatchMatchRequest } from '@/types/matching';
import { batchMatchSchema } from '@/lib/validation/matching-schemas';
import { logger } from '@/lib/logging/logger';
import { rateLimitMiddleware } from '@/middleware/rate-limit';
import { errorHandler } from '@/middleware/error-handler';

// Global batch processor instance
let batchProcessor: BatchProcessor | null = null;

/**
 * POST /api/matching/batch-match - Start a batch matching job
 */
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting (more restrictive for batch operations)
    const rateLimitResponse = await rateLimitMiddleware(request, 'api', {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5 // 5 batch requests per 15 minutes
    });
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
    const validation = batchMatchSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validation.error.errors
        },
        { status: 400 }
      );
    }

    const batchRequest = validation.data;

    // Validate user permissions for the batch request
    const permissionCheck = await validateBatchPermissions(
      session.user.id,
      batchRequest,
      session.user.role
    );

    if (!permissionCheck.allowed) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: 403 }
      );
    }

    // Initialize batch processor
    if (!batchProcessor) {
      const matchingService = new MatchingCoreService();
      batchProcessor = new BatchProcessor(matchingService);
    }

    // Parse batch processing options
    const options = parseBatchOptions(body.options);

    // Start batch job
    const jobId = await batchProcessor.startBatchJob(batchRequest, {
      ...options,
      progressCallback: (progress) => {
        logger.info('Batch job progress', {
          jobId,
          progress: progress.percentage,
          processed: progress.processed,
          total: progress.total
        });
      }
    });

    logger.info('Batch job started', {
      jobId,
      type: batchRequest.type,
      userId: session.user.id,
      totalOperations: calculateTotalOperations(batchRequest)
    });

    return NextResponse.json({
      success: true,
      data: {
        jobId,
        type: batchRequest.type,
        estimatedOperations: calculateTotalOperations(batchRequest),
        status: 'started'
      },
      message: 'Batch matching job started successfully'
    });

  } catch (error) {
    return errorHandler(error, request, 'batch-match');
  }
}

/**
 * GET /api/matching/batch-match - Get batch job status or list active jobs
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
    const jobId = searchParams.get('jobId');
    const action = searchParams.get('action');

    // Initialize batch processor
    if (!batchProcessor) {
      const matchingService = new MatchingCoreService();
      batchProcessor = new BatchProcessor(matchingService);
    }

    if (jobId) {
      // Get specific job status
      const job = batchProcessor.getJobStatus(jobId);

      if (!job) {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        );
      }

      // Check if user has permission to view this job
      const hasPermission = await checkJobViewPermission(
        session.user.id,
        job,
        session.user.role
      );

      if (!hasPermission) {
        return NextResponse.json(
          { error: 'Permission denied' },
          { status: 403 }
        );
      }

      return NextResponse.json({
        success: true,
        data: job
      });
    } else if (action === 'list') {
      // List all active jobs (admin only or user's own jobs)
      const activeJobs = batchProcessor.getActiveJobs();

      let filteredJobs = activeJobs;
      if (session.user.role !== 'ADMIN') {
        // Filter to show only user's own jobs
        filteredJobs = activeJobs.filter(job =>
          isJobOwnedByUser(job, session.user.id)
        );
      }

      // Add statistics
      const statistics = batchProcessor.getStatistics();

      return NextResponse.json({
        success: true,
        data: {
          jobs: filteredJobs,
          statistics,
          total: filteredJobs.length
        }
      });
    } else if (action === 'statistics') {
      // Get batch processing statistics
      const statistics = batchProcessor.getStatistics();

      return NextResponse.json({
        success: true,
        data: statistics
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid request. Provide jobId or action parameter' },
        { status: 400 }
      );
    }

  } catch (error) {
    return errorHandler(error, request, 'batch-match-status');
  }
}

/**
 * DELETE /api/matching/batch-match - Cancel a batch job or clean up completed jobs
 */
export async function DELETE(request: NextRequest) {
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
    const jobId = searchParams.get('jobId');
    const action = searchParams.get('action') || 'cancel';

    // Initialize batch processor
    if (!batchProcessor) {
      const matchingService = new MatchingCoreService();
      batchProcessor = new BatchProcessor(matchingService);
    }

    if (jobId && action === 'cancel') {
      // Cancel specific job
      const job = batchProcessor.getJobStatus(jobId);

      if (!job) {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        );
      }

      // Check if user has permission to cancel this job
      const hasPermission = await checkJobCancelPermission(
        session.user.id,
        job,
        session.user.role
      );

      if (!hasPermission) {
        return NextResponse.json(
          { error: 'Permission denied' },
          { status: 403 }
        );
      }

      const cancelled = batchProcessor.cancelJob(jobId);

      if (cancelled) {
        logger.info('Batch job cancelled', {
          jobId,
          userId: session.user.id
        });

        return NextResponse.json({
          success: true,
          message: 'Job cancelled successfully'
        });
      } else {
        return NextResponse.json(
          { error: 'Job cannot be cancelled' },
          { status: 400 }
        );
      }
    } else if (action === 'cleanup') {
      // Clean up completed jobs (admin only)
      if (session.user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }

      const olderThanHours = parseInt(searchParams.get('olderThan') || '24');
      const cleaned = batchProcessor.cleanupCompletedJobs(olderThanHours);

      logger.info('Batch job cleanup completed', {
        userId: session.user.id,
        cleaned,
        olderThanHours
      });

      return NextResponse.json({
        success: true,
        data: {
          cleaned,
          olderThanHours
        },
        message: `Cleaned up ${cleaned} completed jobs`
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid request. Provide jobId for cancellation or action=cleanup' },
        { status: 400 }
      );
    }

  } catch (error) {
    return errorHandler(error, request, 'batch-match-delete');
  }
}

/**
 * Validate user permissions for batch request
 */
async function validateBatchPermissions(
  userId: string,
  request: BatchMatchRequest,
  userRole: string
): Promise<{ allowed: boolean; error?: string }> {
  try {
    const { prisma } = await import('@/lib/prisma');

    // Admin can do anything
    if (userRole === 'ADMIN') {
      return { allowed: true };
    }

    // Check permissions based on request type
    if (request.type === 'candidate-to-jobs' && request.candidateId) {
      // Check if user owns the candidate profile
      const candidate = await prisma.candidateProfile.findUnique({
        where: { id: request.candidateId },
        select: { userId: true }
      });

      if (!candidate || candidate.userId !== userId) {
        return { allowed: false, error: 'You do not own this candidate profile' };
      }
    } else if (request.type === 'job-to-candidates' && request.jobId) {
      // Check if user owns the job profile
      const job = await prisma.jobProfile.findUnique({
        where: { id: request.jobId },
        select: { userId: true }
      });

      if (!job || job.userId !== userId) {
        return { allowed: false, error: 'You do not own this job profile' };
      }
    } else if (request.type === 'cross-match') {
      // For cross-match, user must own all resources
      if (request.candidateIds) {
        const candidates = await prisma.candidateProfile.findMany({
          where: { id: { in: request.candidateIds } },
          select: { id: true, userId: true }
        });

        const ownedCandidates = candidates.filter(c => c.userId === userId);
        if (ownedCandidates.length !== request.candidateIds.length) {
          return { allowed: false, error: 'You do not own all candidate profiles' };
        }
      }

      if (request.jobIds) {
        const jobs = await prisma.jobProfile.findMany({
          where: { id: { in: request.jobIds } },
          select: { id: true, userId: true }
        });

        const ownedJobs = jobs.filter(j => j.userId === userId);
        if (ownedJobs.length !== request.jobIds.length) {
          return { allowed: false, error: 'You do not own all job profiles' };
        }
      }
    }

    // Check if user has batch processing permissions
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { permissions: true }
    });

    if (user?.permissions && !user.permissions.includes('BATCH_MATCHING')) {
      return { allowed: false, error: 'Batch matching permission required' };
    }

    return { allowed: true };
  } catch (error) {
    logger.error('Error validating batch permissions', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return { allowed: false, error: 'Permission validation failed' };
  }
}

/**
 * Parse batch processing options
 */
function parseBatchOptions(options?: any) {
  return {
    batchSize: options?.batchSize || 50,
    concurrency: options?.concurrency || 3,
    errorHandling: options?.errorHandling || 'skip',
    maxRetries: options?.maxRetries || 2,
    retryDelay: options?.retryDelay || 1000,
    timeout: options?.timeout || 300000
  };
}

/**
 * Calculate total operations for a batch request
 */
function calculateTotalOperations(request: BatchMatchRequest): number {
  switch (request.type) {
    case 'candidate-to-jobs':
      return request.jobIds?.length || 0;
    case 'job-to-candidates':
      return request.candidateIds?.length || 0;
    case 'cross-match':
      return (request.candidateIds?.length || 0) * (request.jobIds?.length || 0);
    default:
      return 0;
  }
}

/**
 * Check if user has permission to view job status
 */
async function checkJobViewPermission(
  userId: string,
  job: any,
  userRole: string
): Promise<boolean> {
  // Admin can view all
  if (userRole === 'ADMIN') {
    return true;
  }

  // Check if job is owned by user
  return isJobOwnedByUser(job, userId);
}

/**
 * Check if user has permission to cancel job
 */
async function checkJobCancelPermission(
  userId: string,
  job: any,
  userRole: string
): Promise<boolean> {
  // Same as view permission for now
  return checkJobViewPermission(userId, job, userRole);
}

/**
 * Check if job is owned by user
 */
function isJobOwnedByUser(job: any, userId: string): boolean {
  // This is a simplified check - in a real implementation,
  // you'd need to store the userId who created the batch job
  // and check against that
  return true; // Placeholder
}