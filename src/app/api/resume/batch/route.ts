import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { batchProcessor, BatchJobRequest } from '@/services/resume-builder/batch-processor';
import { jobQueueManager } from '@/lib/job-queue';
import { rateLimit } from '@/lib/rate-limiter';
import { z } from 'zod';

// Request schemas for validation
const CreateBatchJobSchema = z.object({
  type: z.enum(['resume_analysis', 'ats_scoring', 'keyword_optimization', 'batch_export']),
  resumeIds: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
  priority: z.number().min(0).max(100).optional(),
  emailNotification: z.boolean().optional(),
});

const GetJobsSchema = z.object({
  status: z.enum(['queued', 'processing', 'completed', 'failed', 'cancelled']).optional(),
  type: z.enum(['resume_analysis', 'ats_scoring', 'keyword_optimization', 'batch_export']).optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
});

const CancelJobSchema = z.object({
  jobId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Rate limiting
    const ip = request.ip || 'unknown';
    const rateLimitResult = await rateLimit(`batch-processing:${ip}`, 5, 60000); // 5 requests per minute

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create':
        return handleCreateJob(session.user.id, body);
      case 'cancel':
        return handleCancelJob(session.user.id, body);
      case 'get':
        return handleGetJobs(session.user.id, body);
      case 'stats':
        return handleGetStats(session.user.id);
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in batch processing API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'get';

    switch (action) {
      case 'get':
        return handleGetJobs(session.user.id, Object.fromEntries(searchParams));
      case 'stats':
        return handleGetStats(session.user.id);
      case 'queues':
        return handleGetQueues();
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in batch processing GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleCreateJob(userId: string, body: any) {
  try {
    const { type, resumeIds, metadata, priority, emailNotification } =
      CreateBatchJobSchema.parse(body);

    const jobRequest: BatchJobRequest = {
      type,
      resumeIds,
      userId,
      metadata: metadata || {},
      priority: priority || 0,
      emailNotification: emailNotification || false,
    };

    // Add job to queue
    const queuedJob = await jobQueueManager.addJob(jobRequest);

    return NextResponse.json({
      success: true,
      data: {
        jobId: queuedJob.id,
        type: queuedJob.type,
        status: queuedJob.status,
        queueId: queuedJob.queueId,
        totalItems: queuedJob.totalItems,
        priority: queuedJob.metadata.priority,
        createdAt: queuedJob.createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating batch job:', error);
    return NextResponse.json(
      { error: 'Failed to create batch job' },
      { status: 500 }
    );
  }
}

async function handleCancelJob(userId: string, body: any) {
  try {
    const { jobId } = CancelJobSchema.parse(body);

    const success = await jobQueueManager.cancelQueuedJob(jobId, userId);

    if (!success) {
      return NextResponse.json(
        { error: 'Job not found or cannot be cancelled' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Job cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling batch job:', error);
    return NextResponse.json(
      { error: 'Failed to cancel job' },
      { status: 500 }
    );
  }
}

async function handleGetJobs(userId: string, params: any) {
  try {
    const { status, type, limit = 20, offset = 0 } =
      GetJobsSchema.parse(params);

    // Get user's batch jobs
    const batchJobs = await batchProcessor.getUserJobs(userId);

    // Get user's queued jobs
    const queuedJobs = jobQueueManager.getUserQueuedJobs(userId);

    // Combine and filter jobs
    const allJobs = [...batchJobs, ...queuedJobs];

    // Apply filters
    let filteredJobs = allJobs;

    if (status) {
      filteredJobs = filteredJobs.filter(job => job.status === status);
    }

    if (type) {
      filteredJobs = filteredJobs.filter(job => job.type === type);
    }

    // Sort by creation date (newest first)
    filteredJobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Apply pagination
    const paginatedJobs = filteredJobs.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: {
        jobs: paginatedJobs.map(job => ({
          id: job.id,
          type: job.type,
          status: job.status,
          progress: job.progress,
          totalItems: job.totalItems,
          processedItems: job.processedItems,
          failedItems: job.failedItems,
          createdAt: job.createdAt,
          startedAt: job.startedAt,
          completedAt: job.completedAt,
          error: job.error,
          metadata: job.metadata,
        })),
        pagination: {
          total: filteredJobs.length,
          limit,
          offset,
          hasMore: offset + limit < filteredJobs.length,
        },
      },
    });
  } catch (error) {
    console.error('Error getting batch jobs:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve jobs' },
      { status: 500 }
    );
  }
}

async function handleGetStats(userId: string) {
  try {
    // Get user's batch jobs
    const batchJobs = await batchProcessor.getUserJobs(userId);

    // Get user's queued jobs
    const queuedJobs = jobQueueManager.getUserQueuedJobs(userId);

    // Combine all jobs
    const allJobs = [...batchJobs, ...queuedJobs];

    // Calculate statistics
    const stats = {
      total: allJobs.length,
      queued: allJobs.filter(job => job.status === 'queued').length,
      processing: allJobs.filter(job => job.status === 'processing').length,
      completed: allJobs.filter(job => job.status === 'completed').length,
      failed: allJobs.filter(job => job.status === 'failed').length,
      cancelled: allJobs.filter(job => job.status === 'cancelled').length,
      byType: {
        resume_analysis: allJobs.filter(job => job.type === 'resume_analysis').length,
        ats_scoring: allJobs.filter(job => job.type === 'ats_scoring').length,
        keyword_optimization: allJobs.filter(job => job.type === 'keyword_optimization').length,
        batch_export: allJobs.filter(job => job.type === 'batch_export').length,
      },
      averageProcessingTime: calculateAverageProcessingTime(allJobs),
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error getting batch job stats:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve statistics' },
      { status: 500 }
    );
  }
}

async function handleGetQueues() {
  try {
    const queues = jobQueueManager.getAllQueues();

    const queueStats = queues.map(queue => {
      const stats = jobQueueManager.getQueueStats(queue.id);
      return {
        id: queue.id,
        name: queue.name,
        description: queue.description,
        isActive: queue.isActive,
        processingEnabled: queue.processingEnabled,
        maxConcurrentJobs: queue.maxConcurrentJobs,
        priority: queue.priority,
        stats,
      };
    });

    return NextResponse.json({
      success: true,
      data: queueStats,
    });
  } catch (error) {
    console.error('Error getting queue information:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve queue information' },
      { status: 500 }
    );
  }
}

function calculateAverageProcessingTime(jobs: any[]): number {
  const completedJobs = jobs.filter(job =>
    job.status === 'completed' &&
    job.startedAt &&
    job.completedAt
  );

  if (completedJobs.length === 0) {
    return 0;
  }

  const totalTime = completedJobs.reduce((sum, job) => {
    const processingTime = job.completedAt!.getTime() - job.startedAt!.getTime();
    return sum + processingTime;
  }, 0);

  return Math.round(totalTime / completedJobs.length / 1000); // Return in seconds
}