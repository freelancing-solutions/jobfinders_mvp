/**
 * Export Manager
 * High-level export management with batching, scheduling, and tracking
 */

import { ExportService, ExportRequest, ExportResult } from './export-service';
import { ResumeTemplate, TemplateCustomization, ExportFormat, ExportOptions } from '@/types/template';
import { TemplateEngineError, TemplateErrorType } from '../errors';

export interface BatchExportJob {
  id: string;
  name: string;
  requests: ExportRequest[];
  options: {
    notifyOnComplete?: boolean;
    email?: string;
    compress?: boolean;
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  results: ExportResult[];
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface ExportHistory {
  id: string;
  templateId: string;
  templateName: string;
  format: ExportFormat;
  filename: string;
  size: number;
  createdAt: Date;
  atsScore?: number;
  downloadCount: number;
  lastDownloaded?: Date;
}

export interface ExportSchedule {
  id: string;
  name: string;
  request: ExportRequest;
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string; // HH:MM format
    enabled: boolean;
  };
  nextRun: Date;
  lastRun?: Date;
  active: boolean;
}

export class ExportManager {
  private static exportHistory: ExportHistory[] = [];
  private static batchJobs: Map<string, BatchExportJob> = new Map();
  private static scheduledExports: Map<string, ExportSchedule> = new Map();
  private static processingQueue: ExportRequest[] = [];
  private static isProcessing = false;

  /**
   * Export with history tracking
   */
  static async exportWithHistory(request: ExportRequest): Promise<ExportResult> {
    const result = await ExportService.export(request);

    if (result.success && result.metadata) {
      const historyEntry: ExportHistory = {
        id: this.generateId(),
        templateId: request.template.id,
        templateName: request.template.name,
        format: request.format,
        filename: result.filename || 'export',
        size: result.metadata.size,
        createdAt: new Date(),
        atsScore: result.metadata.atsScore,
        downloadCount: 0
      };

      this.exportHistory.unshift(historyEntry);
      this.saveHistoryToStorage();
    }

    return result;
  }

  /**
   * Create batch export job
   */
  static createBatchJob(
    name: string,
    requests: Omit<ExportRequest, 'format'> & { formats: ExportFormat[] },
    options: BatchExportJob['options'] = {}
  ): BatchExportJob {
    const job: BatchExportJob = {
      id: this.generateId(),
      name,
      requests: requests.formats.map(format => ({ ...requests, format })),
      options,
      status: 'pending',
      progress: 0,
      results: [],
      createdAt: new Date()
    };

    this.batchJobs.set(job.id, job);
    this.saveBatchJobsToStorage();

    return job;
  }

  /**
   * Process batch export job
   */
  static async processBatchJob(jobId: string): Promise<BatchExportJob> {
    const job = this.batchJobs.get(jobId);
    if (!job) {
      throw new TemplateEngineError(
        TemplateErrorType.NOT_FOUND,
        `Batch job ${jobId} not found`,
        { jobId }
      );
    }

    if (job.status === 'processing') {
      throw new TemplateEngineError(
        TemplateErrorType.INVALID_STATE,
        `Batch job ${jobId} is already processing`,
        { jobId }
      );
    }

    job.status = 'processing';
    job.progress = 0;
    job.results = [];

    try {
      for (let i = 0; i < job.requests.length; i++) {
        const request = job.requests[i];
        const result = await ExportService.export(request);

        job.results.push(result);
        job.progress = Math.round(((i + 1) / job.requests.length) * 100);

        // Add small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      job.status = 'completed';
      job.completedAt = new Date();

      // Send notification if enabled
      if (job.options.notifyOnComplete) {
        await this.sendCompletionNotification(job);
      }

      // Compress results if enabled
      if (job.options.compress) {
        await this.compressBatchResults(job);
      }

    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
    }

    this.saveBatchJobsToStorage();
    return job;
  }

  /**
   * Get batch job status
   */
  static getBatchJob(jobId: string): BatchExportJob | null {
    return this.batchJobs.get(jobId) || null;
  }

  /**
   * Get all batch jobs
   */
  static getAllBatchJobs(): BatchExportJob[] {
    return Array.from(this.batchJobs.values()).sort((a, b) =>
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  /**
   * Cancel batch job
   */
  static cancelBatchJob(jobId: string): boolean {
    const job = this.batchJobs.get(jobId);
    if (!job || job.status === 'completed') {
      return false;
    }

    job.status = 'failed';
    job.error = 'Cancelled by user';
    job.completedAt = new Date();

    this.saveBatchJobsToStorage();
    return true;
  }

  /**
   * Delete batch job
   */
  static deleteBatchJob(jobId: string): boolean {
    return this.batchJobs.delete(jobId);
  }

  /**
   * Create scheduled export
   */
  static createScheduledExport(
    name: string,
    request: ExportRequest,
    schedule: ExportSchedule['schedule']
  ): ExportSchedule {
    const scheduledExport: ExportSchedule = {
      id: this.generateId(),
      name,
      request,
      schedule,
      nextRun: this.calculateNextRun(schedule),
      active: true
    };

    this.scheduledExports.set(scheduledExport.id, scheduledExport);
    this.saveScheduledExportsToStorage();
    this.scheduleNextRun();

    return scheduledExport;
  }

  /**
   * Get scheduled export
   */
  static getScheduledExport(id: string): ExportSchedule | null {
    return this.scheduledExports.get(id) || null;
  }

  /**
   * Get all scheduled exports
   */
  static getAllScheduledExports(): ExportSchedule[] {
    return Array.from(this.scheduledExports.values());
  }

  /**
   * Update scheduled export
   */
  static updateScheduledExport(id: string, updates: Partial<ExportSchedule>): boolean {
    const scheduled = this.scheduledExports.get(id);
    if (!scheduled) return false;

    Object.assign(scheduled, updates);
    if (updates.schedule) {
      scheduled.nextRun = this.calculateNextRun(updates.schedule);
    }

    this.saveScheduledExportsToStorage();
    this.scheduleNextRun();
    return true;
  }

  /**
   * Delete scheduled export
   */
  static deleteScheduledExport(id: string): boolean {
    return this.scheduledExports.delete(id);
  }

  /**
   * Process scheduled exports
   */
  static async processScheduledExports(): Promise<void> {
    const now = new Date();
    const dueExports = Array.from(this.scheduledExports.values())
      .filter(export => export.active && export.schedule.enabled && export.nextRun <= now);

    for (const scheduled of dueExports) {
      try {
        await ExportService.export(scheduled.request);

        scheduled.lastRun = now;
        scheduled.nextRun = this.calculateNextRun(scheduled.schedule);

        this.saveScheduledExportsToStorage();
      } catch (error) {
        console.error(`Failed to process scheduled export ${scheduled.id}:`, error);
      }
    }
  }

  /**
   * Get export history
   */
  static getExportHistory(options: {
    templateId?: string;
    format?: ExportFormat;
    limit?: number;
    offset?: number;
  } = {}): {
    history: ExportHistory[];
    total: number;
    hasMore: boolean;
  } {
    let filtered = [...this.exportHistory];

    if (options.templateId) {
      filtered = filtered.filter(entry => entry.templateId === options.templateId);
    }

    if (options.format) {
      filtered = filtered.filter(entry => entry.format === options.format);
    }

    const total = filtered.length;
    const offset = options.offset || 0;
    const limit = options.limit || 20;

    const paginated = filtered.slice(offset, offset + limit);

    return {
      history: paginated,
      total,
      hasMore: offset + limit < total
    };
  }

  /**
   * Search export history
   */
  static searchExportHistory(query: string): ExportHistory[] {
    const lowerQuery = query.toLowerCase();
    return this.exportHistory.filter(entry =>
      entry.templateName.toLowerCase().includes(lowerQuery) ||
      entry.filename.toLowerCase().includes(lowerQuery) ||
      entry.format.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Record download
   */
  static recordDownload(historyId: string): boolean {
    const entry = this.exportHistory.find(h => h.id === historyId);
    if (!entry) return false;

    entry.downloadCount++;
    entry.lastDownloaded = new Date();
    this.saveHistoryToStorage();
    return true;
  }

  /**
   * Clear export history
   */
  static clearHistory(olderThan?: Date): number {
    const cutoff = olderThan || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const initialLength = this.exportHistory.length;

    this.exportHistory = this.exportHistory.filter(entry => entry.createdAt > cutoff);
    this.saveHistoryToStorage();

    return initialLength - this.exportHistory.length;
  }

  /**
   * Get export statistics
   */
  static getExportStatistics(): {
    totalExports: number;
    exportsByFormat: Record<ExportFormat, number>;
    exportsByTemplate: Record<string, number>;
    averageSize: number;
    totalSize: number;
    popularFormats: Array<{ format: ExportFormat; count: number; percentage: number }>;
    recentActivity: ExportHistory[];
  } {
    const exportsByFormat = {} as Record<ExportFormat, number>;
    const exportsByTemplate = {} as Record<string, number>;
    let totalSize = 0;

    this.exportHistory.forEach(entry => {
      exportsByFormat[entry.format] = (exportsByFormat[entry.format] || 0) + 1;
      exportsByTemplate[entry.templateId] = (exportsByTemplate[entry.templateId] || 0) + 1;
      totalSize += entry.size;
    });

    const popularFormats = Object.entries(exportsByFormat)
      .map(([format, count]) => ({
        format: format as ExportFormat,
        count,
        percentage: Math.round((count / this.exportHistory.length) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalExports: this.exportHistory.length,
      exportsByFormat,
      exportsByTemplate,
      averageSize: this.exportHistory.length > 0 ? Math.round(totalSize / this.exportHistory.length) : 0,
      totalSize,
      popularFormats,
      recentActivity: this.exportHistory.slice(0, 10)
    };
  }

  /**
   * Validate export request
   */
  static validateRequest(request: ExportRequest): {
    valid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
  } {
    const baseValidation = ExportService.validateExportRequest(request);
    const suggestions: string[] = [];

    // Add intelligent suggestions
    if (request.format === 'PDF' && !request.options?.quality) {
      suggestions.push('Consider setting quality to "high" for better ATS compatibility');
    }

    if (request.template.atsScore < 90 && request.format !== 'TXT') {
      suggestions.push('Consider using TXT format for maximum ATS compatibility');
    }

    if (!request.options?.metadata) {
      suggestions.push('Enable metadata to track export information');
    }

    // Check for recent similar exports
    const recentSimilar = this.exportHistory.filter(entry =>
      entry.templateId === request.template.id &&
      entry.format === request.format &&
      entry.createdAt > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
    );

    if (recentSimilar.length > 0) {
      suggestions.push(`You recently exported this template as ${request.format}. Check if you need a new version.`);
    }

    return {
      ...baseValidation,
      suggestions
    };
  }

  // Private helper methods
  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private static calculateNextRun(schedule: ExportSchedule['schedule']): Date {
    const now = new Date();
    const [hours, minutes] = schedule.time.split(':').map(Number);

    let nextRun = new Date(now);
    nextRun.setHours(hours, minutes, 0, 0);

    if (nextRun <= now) {
      switch (schedule.frequency) {
        case 'daily':
          nextRun.setDate(nextRun.getDate() + 1);
          break;
        case 'weekly':
          nextRun.setDate(nextRun.getDate() + 7);
          break;
        case 'monthly':
          nextRun.setMonth(nextRun.getMonth() + 1);
          break;
      }
    }

    return nextRun;
  }

  private static scheduleNextRun(): void {
    // In a real implementation, you would use a job scheduler like node-cron
    // For now, we'll just set a timeout for the next due export
    const nextExports = Array.from(this.scheduledExports.values())
      .filter(export => export.active && export.schedule.enabled)
      .sort((a, b) => a.nextRun.getTime() - b.nextRun.getTime());

    if (nextExports.length > 0) {
      const nextRun = nextExports[0].nextRun.getTime() - Date.now();
      if (nextRun > 0) {
        setTimeout(() => this.processScheduledExports(), nextRun);
      }
    }
  }

  private static async sendCompletionNotification(job: BatchExportJob): Promise<void> {
    // In a real implementation, you would send an email or notification
    console.log(`Batch job "${job.name}" completed with ${job.results.filter(r => r.success).length} successful exports`);
  }

  private static async compressBatchResults(job: BatchExportJob): Promise<void> {
    // In a real implementation, you would create a ZIP file
    console.log(`Compressing ${job.results.length} export results for job "${job.name}"`);
  }

  // Storage methods
  private static saveHistoryToStorage(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('export-history', JSON.stringify(this.exportHistory));
      }
    } catch (error) {
      console.error('Failed to save export history:', error);
    }
  }

  private static loadHistoryFromStorage(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('export-history');
        if (stored) {
          this.exportHistory = JSON.parse(stored).map((entry: any) => ({
            ...entry,
            createdAt: new Date(entry.createdAt),
            lastDownloaded: entry.lastDownloaded ? new Date(entry.lastDownloaded) : undefined
          }));
        }
      }
    } catch (error) {
      console.error('Failed to load export history:', error);
    }
  }

  private static saveBatchJobsToStorage(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const jobs = Array.from(this.batchJobs.entries()).map(([id, job]) => ({
          ...job,
          createdAt: job.createdAt.toISOString(),
          completedAt: job.completedAt?.toISOString()
        }));
        localStorage.setItem('batch-export-jobs', JSON.stringify(jobs));
      }
    } catch (error) {
      console.error('Failed to save batch jobs:', error);
    }
  }

  private static loadBatchJobsFromStorage(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('batch-export-jobs');
        if (stored) {
          const jobs = JSON.parse(stored);
          jobs.forEach((job: any) => {
            job.createdAt = new Date(job.createdAt);
            job.completedAt = job.completedAt ? new Date(job.completedAt) : undefined;
            this.batchJobs.set(job.id, job);
          });
        }
      }
    } catch (error) {
      console.error('Failed to load batch jobs:', error);
    }
  }

  private static saveScheduledExportsToStorage(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const exports = Array.from(this.scheduledExports.values()).map(export_ => ({
          ...export_,
          nextRun: export_.nextRun.toISOString(),
          lastRun: export_.lastRun?.toISOString()
        }));
        localStorage.setItem('scheduled-exports', JSON.stringify(exports));
      }
    } catch (error) {
      console.error('Failed to save scheduled exports:', error);
    }
  }

  private static loadScheduledExportsFromStorage(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('scheduled-exports');
        if (stored) {
          const exports = JSON.parse(stored);
          exports.forEach((export_: any) => {
            export_.nextRun = new Date(export_.nextRun);
            export_.lastRun = export_.lastRun ? new Date(export_.lastRun) : undefined;
            this.scheduledExports.set(export_.id, export_);
          });
        }
      }
    } catch (error) {
      console.error('Failed to load scheduled exports:', error);
    }
  }
}

// Initialize storage on module load
ExportManager['loadHistoryFromStorage']();
ExportManager['loadBatchJobsFromStorage']();
ExportManager['loadScheduledExportsFromStorage']();