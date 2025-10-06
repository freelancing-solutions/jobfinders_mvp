import { prisma } from '@/lib/prisma';
import { aiAnalyzer } from './ai-analyzer';
import { notificationService } from '@/services/notifications';

export interface BatchJob {
  id: string;
  type: 'resume_analysis' | 'ats_scoring' | 'keyword_optimization' | 'batch_export';
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  totalItems: number;
  processedItems: number;
  failedItems: number;
  results?: any;
  error?: string;
  createdBy: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  metadata: Record<string, any>;
}

export interface BatchJobRequest {
  type: BatchJob['type'];
  resumeIds?: string[];
  userId?: string;
  metadata?: Record<string, any>;
  priority?: number;
  emailNotification?: boolean;
}

export class BatchProcessor {
  private activeJobs: Map<string, BatchJob> = new Map();
  private processing = false;

  /**
   * Create a new batch job
   */
  async createJob(request: BatchJobRequest): Promise<BatchJob> {
    const jobId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    let totalItems = 0;
    let items: any[] = [];

    // Determine items to process based on job type
    switch (request.type) {
      case 'resume_analysis':
      case 'ats_scoring':
      case 'keyword_optimization':
        if (request.resumeIds) {
          items = await prisma.resume.findMany({
            where: {
              resumeId: { in: request.resumeIds },
              userUid: request.userId,
            },
          });
        } else if (request.userId) {
          items = await prisma.resume.findMany({
            where: { userUid: request.userId },
          });
        }
        totalItems = items.length;
        break;

      case 'batch_export':
        // Handle export jobs
        totalItems = request.resumeIds?.length || 0;
        break;
    }

    const job: BatchJob = {
      id: jobId,
      type: request.type,
      status: 'queued',
      progress: 0,
      totalItems,
      processedItems: 0,
      failedItems: 0,
      createdBy: request.userId || 'system',
      createdAt: new Date(),
      metadata: {
        ...request.metadata,
        resumeIds: request.resumeIds,
        priority: request.priority || 0,
        emailNotification: request.emailNotification || false,
      },
    };

    // Save job to database
    await this.saveJobToDatabase(job);

    // Add to active jobs
    this.activeJobs.set(jobId, job);

    // Start processing if not already running
    this.startProcessing();

    return job;
  }

  /**
   * Get job status and details
   */
  async getJob(jobId: string): Promise<BatchJob | null> {
    // Check active jobs first
    if (this.activeJobs.has(jobId)) {
      return this.activeJobs.get(jobId)!;
    }

    // Check database
    const dbJob = await prisma.batchMatchJob.findUnique({
      where: { id: jobId },
    });

    if (!dbJob) {
      return null;
    }

    return {
      id: dbJob.id,
      type: dbJob.type as BatchJob['type'],
      status: dbJob.status as BatchJob['status'],
      progress: dbJob.progress,
      totalItems: dbJob.totalProfiles,
      processedItems: dbJob.processedProfiles,
      failedItems: 0, // We'll track this separately if needed
      results: dbJob.results,
      error: dbJob.error,
      createdBy: dbJob.createdBy,
      createdAt: dbJob.createdAt,
      startedAt: dbJob.startedAt,
      completedAt: dbJob.completedAt,
      metadata: dbJob.metadata || {},
    };
  }

  /**
   * Get all jobs for a user
   */
  async getUserJobs(userId: string): Promise<BatchJob[]> {
    const dbJobs = await prisma.batchMatchJob.findMany({
      where: { createdBy: userId },
      orderBy: { createdAt: 'desc' },
    });

    return dbJobs.map(job => ({
      id: job.id,
      type: job.type as BatchJob['type'],
      status: job.status as BatchJob['status'],
      progress: job.progress,
      totalItems: job.totalProfiles,
      processedItems: job.processedProfiles,
      failedItems: 0,
      results: job.results,
      error: job.error,
      createdBy: job.createdBy,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      metadata: job.metadata || {},
    }));
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string, userId: string): Promise<boolean> {
    const job = this.activeJobs.get(jobId);
    if (!job || job.createdBy !== userId) {
      return false;
    }

    if (job.status === 'processing') {
      job.status = 'cancelled';
      await this.updateJobInDatabase(job);
      this.activeJobs.delete(jobId);
      return true;
    }

    if (job.status === 'queued') {
      job.status = 'cancelled';
      await this.updateJobInDatabase(job);
      this.activeJobs.delete(jobId);
      return true;
    }

    return false;
  }

  /**
   * Start processing queued jobs
   */
  private async startProcessing(): Promise<void> {
    if (this.processing) {
      return;
    }

    this.processing = true;
    this.processJobs();
  }

  /**
   * Process jobs in order of priority
   */
  private async processJobs(): Promise<void> {
    while (this.processing && this.activeJobs.size > 0) {
      // Get jobs sorted by priority and creation date
      const queuedJobs = Array.from(this.activeJobs.values())
        .filter(job => job.status === 'queued')
        .sort((a, b) => {
          const priorityDiff = (b.metadata.priority || 0) - (a.metadata.priority || 0);
          if (priorityDiff !== 0) return priorityDiff;
          return a.createdAt.getTime() - b.createdAt.getTime();
        });

      if (queuedJobs.length === 0) {
        break;
      }

      const job = queuedJobs[0];
      await this.processJob(job);
    }

    this.processing = false;
  }

  /**
   * Process a single job
   */
  private async processJob(job: BatchJob): Promise<void> {
    try {
      job.status = 'processing';
      job.startedAt = new Date();
      await this.updateJobInDatabase(job);

      const results = [];

      switch (job.type) {
        case 'resume_analysis':
          results = await this.processResumeAnalysis(job);
          break;
        case 'ats_scoring':
          results = await this.processAtsScoring(job);
          break;
        case 'keyword_optimization':
          results = await this.processKeywordOptimization(job);
          break;
        case 'batch_export':
          results = await this.processBatchExport(job);
          break;
      }

      job.status = 'completed';
      job.completedAt = new Date();
      job.progress = 100;
      job.results = results;
      await this.updateJobInDatabase(job);

      // Send notification if requested
      if (job.metadata.emailNotification) {
        await this.sendCompletionNotification(job);
      }

    } catch (error) {
      console.error(`Error processing job ${job.id}:`, error);
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      job.completedAt = new Date();
      await this.updateJobInDatabase(job);

      // Send error notification
      if (job.metadata.emailNotification) {
        await this.sendErrorNotification(job);
      }
    } finally {
      this.activeJobs.delete(job.id);
    }
  }

  /**
   * Process resume analysis batch job
   */
  private async processResumeAnalysis(job: BatchJob): Promise<any[]> {
    const resumeIds = job.metadata.resumeIds as string[] || [];
    const results = [];

    for (let i = 0; i < resumeIds.length; i++) {
      const resumeId = resumeIds[i];

      try {
        // Get resume data
        const resume = await prisma.resume.findUnique({
          where: { resumeId },
          include: {
            experience: true,
            education: true,
            certifications: true,
            languages: true,
            projects: true,
          },
        });

        if (!resume) {
          job.failedItems++;
          continue;
        }

        // Perform AI analysis
        const analysis = await aiAnalyzer.analyzeResume(resume);

        results.push({
          resumeId,
          analysis,
          processedAt: new Date(),
        });

        job.processedItems++;
        job.progress = Math.round((job.processedItems / job.totalItems) * 100);

        // Update progress every 10 items
        if (i % 10 === 0) {
          await this.updateJobInDatabase(job);
        }

      } catch (error) {
        console.error(`Error analyzing resume ${resumeId}:`, error);
        job.failedItems++;
        results.push({
          resumeId,
          error: error instanceof Error ? error.message : 'Analysis failed',
        });
      }
    }

    return results;
  }

  /**
   * Process ATS scoring batch job
   */
  private async processAtsScoring(job: BatchJob): Promise<any[]> {
    const resumeIds = job.metadata.resumeIds as string[] || [];
    const results = [];

    for (let i = 0; i < resumeIds.length; i++) {
      const resumeId = resumeIds[i];

      try {
        // Get resume and perform ATS scoring
        const resume = await prisma.resume.findUnique({
          where: { resumeId },
          include: { experience: true, education: true, skills: true },
        });

        if (!resume) {
          job.failedItems++;
          continue;
        }

        // Use ATS scorer
        const atsScore = await aiAnalyzer.calculateATSScore(resume);

        results.push({
          resumeId,
          atsScore,
          processedAt: new Date(),
        });

        job.processedItems++;
        job.progress = Math.round((job.processedItems / job.totalItems) * 100);

      } catch (error) {
        console.error(`Error scoring resume ${resumeId}:`, error);
        job.failedItems++;
      }
    }

    return results;
  }

  /**
   * Process keyword optimization batch job
   */
  private async processKeywordOptimization(job: BatchJob): Promise<any[]> {
    const resumeIds = job.metadata.resumeIds as string[] || [];
    const targetJobDescription = job.metadata.targetJobDescription as string;
    const results = [];

    for (let i = 0; i < resumeIds.length; i++) {
      const resumeId = resumeIds[i];

      try {
        const resume = await prisma.resume.findUnique({
          where: { resumeId },
        });

        if (!resume) {
          job.failedItems++;
          continue;
        }

        // Analyze keywords
        const keywordAnalysis = await aiAnalyzer.analyzeKeywords(
          resume,
          targetJobDescription
        );

        results.push({
          resumeId,
          keywordAnalysis,
          processedAt: new Date(),
        });

        job.processedItems++;
        job.progress = Math.round((job.processedItems / job.totalItems) * 100);

      } catch (error) {
        console.error(`Error analyzing keywords for resume ${resumeId}:`, error);
        job.failedItems++;
      }
    }

    return results;
  }

  /**
   * Process batch export job
   */
  private async processBatchExport(job: BatchJob): Promise<any[]> {
    const resumeIds = job.metadata.resumeIds as string[] || [];
    const exportFormat = job.metadata.exportFormat as string || 'pdf';
    const results = [];

    for (let i = 0; i < resumeIds.length; i++) {
      const resumeId = resumeIds[i];

      try {
        // Export resume in specified format
        const exportResult = await this.exportResume(resumeId, exportFormat);

        results.push({
          resumeId,
          exportUrl: exportResult.url,
          format: exportFormat,
          processedAt: new Date(),
        });

        job.processedItems++;
        job.progress = Math.round((job.processedItems / job.totalItems) * 100);

      } catch (error) {
        console.error(`Error exporting resume ${resumeId}:`, error);
        job.failedItems++;
      }
    }

    return results;
  }

  /**
   * Export resume in specified format
   */
  private async exportResume(resumeId: string, format: string): Promise<{ url: string }> {
    // This would integrate with the export service
    // For now, return a placeholder
    return { url: `/exports/${resumeId}.${format}` };
  }

  /**
   * Save job to database
   */
  private async saveJobToDatabase(job: BatchJob): Promise<void> {
    await prisma.batchMatchJob.create({
      data: {
        id: job.id,
        type: job.type,
        profileIds: job.metadata.resumeIds || [],
        status: job.status,
        progress: job.progress,
        totalProfiles: job.totalItems,
        processedProfiles: job.processedItems,
        results: job.results,
        error: job.error,
        priority: job.metadata.priority || 0,
        createdBy: job.createdBy,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        metadata: job.metadata,
      },
    });
  }

  /**
   * Update job in database
   */
  private async updateJobInDatabase(job: BatchJob): Promise<void> {
    await prisma.batchMatchJob.update({
      where: { id: job.id },
      data: {
        status: job.status,
        progress: job.progress,
        processedProfiles: job.processedItems,
        results: job.results,
        error: job.error,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
      },
    });
  }

  /**
   * Send completion notification
   */
  private async sendCompletionNotification(job: BatchJob): Promise<void> {
    await notificationService.sendNotification({
      userId: job.createdBy,
      type: 'batch_job_completed',
      title: 'Batch Job Completed',
      message: `Your ${job.type.replace('_', ' ')} job has been completed successfully.`,
      data: {
        jobId: job.id,
        jobType: job.type,
        totalItems: job.totalItems,
        processedItems: job.processedItems,
        failedItems: job.failedItems,
      },
    });
  }

  /**
   * Send error notification
   */
  private async sendErrorNotification(job: BatchJob): Promise<void> {
    await notificationService.sendNotification({
      userId: job.createdBy,
      type: 'batch_job_failed',
      title: 'Batch Job Failed',
      message: `Your ${job.type.replace('_', ' ')} job has failed. Please check the error details.`,
      data: {
        jobId: job.id,
        jobType: job.type,
        error: job.error,
      },
    });
  }
}

// Singleton instance
export const batchProcessor = new BatchProcessor();