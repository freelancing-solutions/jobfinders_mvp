import {
  BatchMatchRequest,
  BatchMatchResult,
  MatchResult,
  MatchingConfig,
  MatchMode
} from '@/types/matching';
import { MatchingCoreService } from '@/services/matching/core-service';
import { logger } from '@/lib/logging/logger';
import { EventEmitter } from 'events';

/**
 * Batch processing options
 */
export interface BatchProcessingOptions {
  batchSize?: number;
  concurrency?: number;
  progressCallback?: (progress: BatchProgress) => void;
  errorHandling?: 'fail' | 'skip' | 'retry';
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}

/**
 * Batch processing progress
 */
export interface BatchProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  percentage: number;
  estimatedTimeRemaining?: number;
  currentBatch?: number;
  totalBatches?: number;
}

/**
 * Batch job status
 */
export interface BatchJob {
  id: string;
  request: BatchMatchRequest;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: BatchProgress;
  result?: BatchMatchResult;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  options: BatchProcessingOptions;
}

/**
 * Advanced batch processor for large-scale matching operations
 */
export class BatchProcessor extends EventEmitter {
  private coreService: MatchingCoreService;
  private activeJobs: Map<string, BatchJob> = new Map();
  private defaultOptions: Required<BatchProcessingOptions> = {
    batchSize: 100,
    concurrency: 5,
    progressCallback: () => {},
    errorHandling: 'skip',
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 300000 // 5 minutes
  };

  constructor(coreService: MatchingCoreService) {
    super();
    this.coreService = coreService;
  }

  /**
   * Start a new batch processing job
   */
  async startBatchJob(
    request: BatchMatchRequest,
    options: BatchProcessingOptions = {}
  ): Promise<string> {
    const jobId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const mergedOptions = { ...this.defaultOptions, ...options };

    const job: BatchJob = {
      id: jobId,
      request,
      status: 'pending',
      progress: {
        total: this.calculateTotalOperations(request),
        processed: 0,
        successful: 0,
        failed: 0,
        percentage: 0
      },
      createdAt: new Date(),
      options: mergedOptions
    };

    this.activeJobs.set(jobId, job);

    // Start processing asynchronously
    this.processBatchJob(job).catch(error => {
      logger.error('Batch job processing failed', {
        jobId,
        error: error.message
      });
      job.status = 'failed';
      job.error = error.message;
      job.completedAt = new Date();
      this.emit('jobFailed', { jobId, error });
    });

    this.emit('jobStarted', { jobId });
    return jobId;
  }

  /**
   * Process a batch job
   */
  private async processBatchJob(job: BatchJob): Promise<void> {
    try {
      job.status = 'running';
      job.startedAt = new Date();
      this.emit('jobProgress', { jobId: job.id, progress: job.progress });

      const startTime = Date.now();
      const results: MatchResult[] = [];

      // Determine processing strategy based on request type
      switch (job.request.type) {
        case 'candidate-to-jobs':
          await this.processCandidateToJobs(job, results);
          break;
        case 'job-to-candidates':
          await this.processJobToCandidates(job, results);
          break;
        case 'cross-match':
          await this.processCrossMatch(job, results);
          break;
        default:
          throw new Error(`Unknown batch match type: ${job.request.type}`);
      }

      const endTime = Date.now();

      job.result = {
        id: job.id,
        type: job.request.type,
        totalProcessed: job.progress.processed,
        successful: job.progress.successful,
        failed: job.progress.failed,
        duration: endTime - startTime,
        results,
        timestamp: new Date()
      };

      job.status = 'completed';
      job.completedAt = new Date();
      job.progress.percentage = 100;

      this.emit('jobCompleted', { jobId: job.id, result: job.result });
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      job.completedAt = new Date();
      throw error;
    }
  }

  /**
   * Process candidate-to-jobs batch matching
   */
  private async processCandidateToJobs(job: BatchJob, results: MatchResult[]): Promise<void> {
    const { request, options } = job;
    if (!request.candidateId || !request.jobIds) {
      throw new Error('Candidate ID and Job IDs are required for candidate-to-jobs matching');
    }

    const batches = this.createBatches(request.jobIds, options.batchSize);
    job.progress.totalBatches = batches.length;

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      if (job.status === 'cancelled') {
        logger.info('Batch job cancelled', { jobId: job.id });
        return;
      }

      const batch = batches[batchIndex];
      job.progress.currentBatch = batchIndex + 1;

      const batchResults = await this.processBatchWithConcurrency(
        batch,
        (jobId: string) =>
          this.coreService.scoreCandidate(request.candidateId!, jobId, {
            candidateId: request.candidateId!,
            jobId,
            mode: request.mode || MatchMode.HYBRID
          }),
        options
      );

      results.push(...batchResults.successful);
      job.progress.processed += batchResults.total;
      job.progress.successful += batchResults.successful.length;
      job.progress.failed += batchResults.failed.length;
      job.progress.percentage = (job.progress.processed / job.progress.total) * 100;

      // Update estimated time remaining
      const elapsed = Date.now() - (job.startedAt?.getTime() || Date.now());
      const avgTimePerItem = elapsed / job.progress.processed;
      const remaining = job.progress.total - job.progress.processed;
      job.progress.estimatedTimeRemaining = remaining * avgTimePerItem;

      job.options.progressCallback(job.progress);
      this.emit('jobProgress', { jobId: job.id, progress: job.progress });

      // Add delay between batches to prevent overwhelming the system
      if (batchIndex < batches.length - 1) {
        await this.delay(100);
      }
    }
  }

  /**
   * Process job-to-candidates batch matching
   */
  private async processJobToCandidates(job: BatchJob, results: MatchResult[]): Promise<void> {
    const { request, options } = job;
    if (!request.jobId || !request.candidateIds) {
      throw new Error('Job ID and Candidate IDs are required for job-to-candidates matching');
    }

    const batches = this.createBatches(request.candidateIds, options.batchSize);
    job.progress.totalBatches = batches.length;

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      if (job.status === 'cancelled') {
        logger.info('Batch job cancelled', { jobId: job.id });
        return;
      }

      const batch = batches[batchIndex];
      job.progress.currentBatch = batchIndex + 1;

      const batchResults = await this.processBatchWithConcurrency(
        batch,
        (candidateId: string) =>
          this.coreService.scoreCandidate(candidateId, request.jobId!, {
            candidateId,
            jobId: request.jobId!,
            mode: request.mode || MatchMode.HYBRID
          }),
        options
      );

      results.push(...batchResults.successful);
      job.progress.processed += batchResults.total;
      job.progress.successful += batchResults.successful.length;
      job.progress.failed += batchResults.failed.length;
      job.progress.percentage = (job.progress.processed / job.progress.total) * 100;

      // Update estimated time remaining
      const elapsed = Date.now() - (job.startedAt?.getTime() || Date.now());
      const avgTimePerItem = elapsed / job.progress.processed;
      const remaining = job.progress.total - job.progress.processed;
      job.progress.estimatedTimeRemaining = remaining * avgTimePerItem;

      job.options.progressCallback(job.progress);
      this.emit('jobProgress', { jobId: job.id, progress: job.progress });

      // Add delay between batches
      if (batchIndex < batches.length - 1) {
        await this.delay(100);
      }
    }
  }

  /**
   * Process cross-match batch matching
   */
  private async processCrossMatch(job: BatchJob, results: MatchResult[]): Promise<void> {
    const { request, options } = job;
    if (!request.candidateIds || !request.jobIds) {
      throw new Error('Candidate IDs and Job IDs are required for cross-match');
    }

    const totalOperations = request.candidateIds.length * request.jobIds.length;
    job.progress.total = totalOperations;

    // Create operation pairs
    const operations: Array<{ candidateId: string; jobId: string }> = [];
    for (const candidateId of request.candidateIds) {
      for (const jobId of request.jobIds) {
        operations.push({ candidateId, jobId });
      }
    }

    const batches = this.createBatches(operations, options.batchSize);
    job.progress.totalBatches = batches.length;

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      if (job.status === 'cancelled') {
        logger.info('Batch job cancelled', { jobId: job.id });
        return;
      }

      const batch = batches[batchIndex];
      job.progress.currentBatch = batchIndex + 1;

      const batchResults = await this.processBatchWithConcurrency(
        batch,
        (operation: { candidateId: string; jobId: string }) =>
          this.coreService.scoreCandidate(operation.candidateId, operation.jobId, {
            candidateId: operation.candidateId,
            jobId: operation.jobId,
            mode: request.mode || MatchMode.HYBRID
          }),
        options
      );

      results.push(...batchResults.successful);
      job.progress.processed += batchResults.total;
      job.progress.successful += batchResults.successful.length;
      job.progress.failed += batchResults.failed.length;
      job.progress.percentage = (job.progress.processed / job.progress.total) * 100;

      // Update estimated time remaining
      const elapsed = Date.now() - (job.startedAt?.getTime() || Date.now());
      const avgTimePerItem = elapsed / job.progress.processed;
      const remaining = job.progress.total - job.progress.processed;
      job.progress.estimatedTimeRemaining = remaining * avgTimePerItem;

      job.options.progressCallback(job.progress);
      this.emit('jobProgress', { jobId: job.id, progress: job.progress });

      // Add delay between batches
      if (batchIndex < batches.length - 1) {
        await this.delay(100);
      }
    }
  }

  /**
   * Process a batch with concurrency control
   */
  private async processBatchWithConcurrency<T, R>(
    batch: T[],
    processor: (item: T) => Promise<R>,
    options: Required<BatchProcessingOptions>
  ): Promise<{
    total: number;
    successful: R[];
    failed: Array<{ item: T; error: string }>;
  }> {
    const successful: R[] = [];
    const failed: Array<{ item: T; error: string }> = [];

    // Process items with concurrency control
    const chunks = this.createChunks(batch, options.concurrency);

    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async (item) => {
        try {
          const result = await this.processWithRetry(
            () => processor(item),
            options.maxRetries,
            options.retryDelay,
            options.timeout
          );
          return { success: true, result, item };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';

          if (options.errorHandling === 'fail') {
            throw error;
          } else {
            return { success: false, error: errorMessage, item };
          }
        }
      });

      const chunkResults = await Promise.all(chunkPromises);

      chunkResults.forEach(result => {
        if (result.success) {
          successful.push(result.result);
        } else {
          failed.push({ item: result.item, error: result.error });
        }
      });
    }

    return {
      total: batch.length,
      successful,
      failed
    };
  }

  /**
   * Process an item with retry logic
   */
  private async processWithRetry<T>(
    processor: () => Promise<T>,
    maxRetries: number,
    retryDelay: number,
    timeout: number
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Add timeout to the processor
        const result = await Promise.race([
          processor(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Operation timeout')), timeout)
          )
        ]);
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        if (attempt < maxRetries) {
          logger.warn('Processing attempt failed, retrying', {
            attempt: attempt + 1,
            maxRetries: maxRetries + 1,
            error: lastError.message
          });
          await this.delay(retryDelay * Math.pow(2, attempt)); // Exponential backoff
        }
      }
    }

    throw lastError!;
  }

  /**
   * Calculate total operations for a batch request
   */
  private calculateTotalOperations(request: BatchMatchRequest): number {
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
   * Create batches from an array
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Create chunks for concurrent processing
   */
  private createChunks<T>(items: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += chunkSize) {
      chunks.push(items.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get job status
   */
  getJobStatus(jobId: string): BatchJob | null {
    return this.activeJobs.get(jobId) || null;
  }

  /**
   * Cancel a running job
   */
  cancelJob(jobId: string): boolean {
    const job = this.activeJobs.get(jobId);
    if (job && (job.status === 'pending' || job.status === 'running')) {
      job.status = 'cancelled';
      job.completedAt = new Date();
      this.emit('jobCancelled', { jobId });
      return true;
    }
    return false;
  }

  /**
   * Get all active jobs
   */
  getActiveJobs(): BatchJob[] {
    return Array.from(this.activeJobs.values());
  }

  /**
   * Clean up completed jobs
   */
  cleanupCompletedJobs(olderThanHours: number = 24): number {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    let cleaned = 0;

    for (const [jobId, job] of this.activeJobs.entries()) {
      if (
        job.completedAt &&
        job.completedAt < cutoffTime &&
        (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled')
      ) {
        this.activeJobs.delete(jobId);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Get processing statistics
   */
  getStatistics(): {
    activeJobs: number;
    completedJobs: number;
    failedJobs: number;
    totalProcessed: number;
    averageProcessingTime: number;
  } {
    const jobs = Array.from(this.activeJobs.values());

    const activeJobs = jobs.filter(job => job.status === 'running').length;
    const completedJobs = jobs.filter(job => job.status === 'completed').length;
    const failedJobs = jobs.filter(job => job.status === 'failed').length;

    const totalProcessed = jobs.reduce((sum, job) => sum + (job.progress.processed || 0), 0);

    const completedJobsWithDuration = jobs.filter(job =>
      job.status === 'completed' && job.startedAt && job.completedAt
    );

    const averageProcessingTime = completedJobsWithDuration.length > 0
      ? completedJobsWithDuration.reduce((sum, job) =>
          sum + (job.completedAt!.getTime() - job.startedAt!.getTime()), 0
        ) / completedJobsWithDuration.length
      : 0;

    return {
      activeJobs,
      completedJobs,
      failedJobs,
      totalProcessed,
      averageProcessingTime
    };
  }
}

export default BatchProcessor;