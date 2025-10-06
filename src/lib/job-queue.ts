import { BatchJob, BatchJobRequest, batchProcessor } from '@/services/resume-builder/batch-processor';

export interface JobQueue {
  id: string;
  name: string;
  description: string;
  maxConcurrentJobs: number;
  priority: number;
  isActive: boolean;
  processingEnabled: boolean;
}

export interface QueuedJob extends BatchJob {
  queueId: string;
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: Date;
}

export class JobQueueManager {
  private queues: Map<string, JobQueue> = new Map();
  private queuedJobs: Map<string, QueuedJob[]> = new Map();
  private processingQueues: Set<string> = new Set();

  constructor() {
    this.initializeDefaultQueues();
  }

  /**
   * Initialize default job queues
   */
  private initializeDefaultQueues(): void {
    // High priority queue for urgent jobs
    this.createQueue({
      id: 'high-priority',
      name: 'High Priority',
      description: 'Urgent batch jobs',
      maxConcurrentJobs: 1,
      priority: 100,
      isActive: true,
      processingEnabled: true,
    });

    // Normal priority queue for regular jobs
    this.createQueue({
      id: 'normal',
      name: 'Normal Priority',
      description: 'Standard batch processing jobs',
      maxConcurrentJobs: 3,
      priority: 50,
      isActive: true,
      processingEnabled: true,
    });

    // Low priority queue for background jobs
    this.createQueue({
      id: 'low-priority',
      name: 'Low Priority',
      description: 'Background processing jobs',
      maxConcurrentJobs: 2,
      priority: 10,
      isActive: true,
      processingEnabled: true,
    });

    // Export queue for batch export jobs
    this.createQueue({
      id: 'exports',
      name: 'Export Jobs',
      description: 'Batch export and file generation jobs',
      maxConcurrentJobs: 1,
      priority: 30,
      isActive: true,
      processingEnabled: true,
    });
  }

  /**
   * Create a new job queue
   */
  createQueue(queue: Omit<JobQueue, 'id'>): JobQueue {
    const id = queue.name.toLowerCase().replace(/\s+/g, '-');
    const newQueue: JobQueue = {
      id,
      ...queue,
    };

    this.queues.set(id, newQueue);
    this.queuedJobs.set(id, []);

    return newQueue;
  }

  /**
   * Get queue by ID
   */
  getQueue(queueId: string): JobQueue | undefined {
    return this.queues.get(queueId);
  }

  /**
   * Get all queues
   */
  getAllQueues(): JobQueue[] {
    return Array.from(this.queues.values());
  }

  /**
   * Add job to appropriate queue
   */
  async addJob(request: BatchJobRequest): Promise<QueuedJob> {
    // Determine queue based on job type and priority
    const queueId = this.determineQueue(request);
    const queue = this.queues.get(queueId);

    if (!queue || !queue.isActive) {
      throw new Error(`Queue ${queueId} is not available`);
    }

    // Create batch job
    const batchJob = await batchProcessor.createJob(request);

    // Create queued job
    const queuedJob: QueuedJob = {
      ...batchJob,
      queueId,
      retryCount: 0,
      maxRetries: 3,
    };

    // Add to queue
    const jobs = this.queuedJobs.get(queueId) || [];
    jobs.push(queuedJob);
    this.queuedJobs.set(queueId, jobs);

    // Sort jobs by priority and creation time
    jobs.sort((a, b) => {
      const priorityDiff = (b.metadata.priority || 0) - (a.metadata.priority || 0);
      if (priorityDiff !== 0) return priorityDiff;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    // Start processing if queue is enabled
    if (queue.processingEnabled && !this.processingQueues.has(queueId)) {
      this.processQueue(queueId);
    }

    return queuedJob;
  }

  /**
   * Determine appropriate queue for job
   */
  private determineQueue(request: BatchJobRequest): string {
    const priority = request.priority || 0;

    if (priority >= 80) {
      return 'high-priority';
    } else if (request.type === 'batch_export') {
      return 'exports';
    } else if (priority >= 40) {
      return 'normal';
    } else {
      return 'low-priority';
    }
  }

  /**
   * Process jobs in a queue
   */
  private async processQueue(queueId: string): Promise<void> {
    if (this.processingQueues.has(queueId)) {
      return;
    }

    this.processingQueues.add(queueId);

    try {
      const queue = this.queues.get(queueId);
      if (!queue || !queue.processingEnabled) {
        return;
      }

      const jobs = this.queuedJobs.get(queueId) || [];
      const activeJobs = jobs.filter(job => job.status === 'processing');

      // Process jobs up to concurrency limit
      while (activeJobs.length < queue.maxConcurrentJobs) {
        const nextJob = jobs.find(job => job.status === 'queued');
        if (!nextJob) {
          break;
        }

        // Start processing the job
        nextJob.status = 'processing';
        await this.processQueuedJob(nextJob);
        activeJobs.push(nextJob);
      }

      // Wait for all jobs to complete
      await Promise.all(
        activeJobs.map(job => this.waitForJobCompletion(job))
      );

    } finally {
      this.processingQueues.delete(queueId);
    }
  }

  /**
   * Process a single queued job
   */
  private async processQueuedJob(job: QueuedJob): Promise<void> {
    try {
      // The actual processing is handled by the batch processor
      // We just monitor the job status here
      await this.monitorJobProgress(job);
    } catch (error) {
      console.error(`Error processing queued job ${job.id}:`, error);
      await this.handleJobFailure(job, error);
    }
  }

  /**
   * Monitor job progress
   */
  private async monitorJobProgress(job: QueuedJob): Promise<void> {
    const pollInterval = setInterval(async () => {
      try {
        const currentJob = await batchProcessor.getJob(job.id);
        if (!currentJob) {
          clearInterval(pollInterval);
          return;
        }

        // Update job status
        job.status = currentJob.status;
        job.progress = currentJob.progress;
        job.processedItems = currentJob.processedItems;
        job.failedItems = currentJob.failedItems;
        job.error = currentJob.error;

        // Check if job is completed
        if (currentJob.status === 'completed' || currentJob.status === 'failed') {
          clearInterval(pollInterval);
        }

      } catch (error) {
        console.error(`Error monitoring job ${job.id}:`, error);
        clearInterval(pollInterval);
      }
    }, 2000); // Poll every 2 seconds

    // Clean up interval after 10 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 10 * 60 * 1000);
  }

  /**
   * Wait for job completion
   */
  private async waitForJobCompletion(job: QueuedJob): Promise<void> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(async () => {
        const currentJob = await batchProcessor.getJob(job.id);
        if (!currentJob ||
            currentJob.status === 'completed' ||
            currentJob.status === 'failed' ||
            currentJob.status === 'cancelled') {
          clearInterval(checkInterval);
          resolve();
        }
      }, 1000);
    });
  }

  /**
   * Handle job failure
   */
  private async handleJobFailure(job: QueuedJob, error: any): Promise<void> {
    job.retryCount++;
    job.error = error instanceof Error ? error.message : 'Unknown error';

    if (job.retryCount < job.maxRetries) {
      // Schedule retry with exponential backoff
      const retryDelay = Math.pow(2, job.retryCount) * 60000; // 1min, 2min, 4min
      job.nextRetryAt = new Date(Date.now() + retryDelay);
      job.status = 'queued';

      // Add back to queue for retry
      setTimeout(() => {
        this.processQueue(job.queueId);
      }, retryDelay);

    } else {
      // Max retries exceeded, mark as failed
      job.status = 'failed';
      job.error = `Job failed after ${job.maxRetries} retries: ${job.error}`;
    }
  }

  /**
   * Get queued jobs for a user
   */
  getUserQueuedJobs(userId: string): QueuedJob[] {
    const allJobs: QueuedJob[] = [];

    for (const jobs of this.queuedJobs.values()) {
      allJobs.push(...jobs.filter(job => job.createdBy === userId));
    }

    return allJobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get queue statistics
   */
  getQueueStats(queueId: string): {
    total: number;
    queued: number;
    processing: number;
    completed: number;
    failed: number;
    averageWaitTime: number;
  } {
    const jobs = this.queuedJobs.get(queueId) || [];

    const stats = {
      total: jobs.length,
      queued: jobs.filter(job => job.status === 'queued').length,
      processing: jobs.filter(job => job.status === 'processing').length,
      completed: jobs.filter(job => job.status === 'completed').length,
      failed: jobs.filter(job => job.status === 'failed').length,
      averageWaitTime: 0,
    };

    if (stats.queued > 0) {
      const now = Date.now();
      const totalWaitTime = jobs
        .filter(job => job.status === 'queued')
        .reduce((sum, job) => sum + (now - job.createdAt.getTime()), 0);
      stats.averageWaitTime = totalWaitTime / stats.queued;
    }

    return stats;
  }

  /**
   * Enable/disable queue processing
   */
  setQueueProcessing(queueId: string, enabled: boolean): boolean {
    const queue = this.queues.get(queueId);
    if (!queue) {
      return false;
    }

    queue.processingEnabled = enabled;
    return true;
  }

  /**
   * Cancel queued job
   */
  async cancelQueuedJob(jobId: string, userId: string): Promise<boolean> {
    // Find the job in any queue
    for (const [queueId, jobs] of this.queuedJobs.entries()) {
      const jobIndex = jobs.findIndex(job => job.id === jobId && job.createdBy === userId);
      if (jobIndex !== -1) {
        const job = jobs[jobIndex];

        if (job.status === 'queued') {
          job.status = 'cancelled';
          jobs.splice(jobIndex, 1);
          return true;
        } else if (job.status === 'processing') {
          // Try to cancel through batch processor
          return await batchProcessor.cancelJob(jobId, userId);
        }
      }
    }

    return false;
  }

  /**
   * Clean up completed jobs older than specified time
   */
  async cleanupCompletedJobs(olderThanHours: number = 24): Promise<number> {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    let cleanedCount = 0;

    for (const [queueId, jobs] of this.queuedJobs.entries()) {
      const originalLength = jobs.length;

      // Remove completed, failed, or cancelled jobs older than cutoff time
      const filteredJobs = jobs.filter(job => {
        const isOld = job.createdAt < cutoffTime;
        const isFinished = ['completed', 'failed', 'cancelled'].includes(job.status);
        return !(isOld && isFinished);
      });

      this.queuedJobs.set(queueId, filteredJobs);
      cleanedCount += originalLength - filteredJobs.length;
    }

    return cleanedCount;
  }
}

// Singleton instance
export const jobQueueManager = new JobQueueManager();