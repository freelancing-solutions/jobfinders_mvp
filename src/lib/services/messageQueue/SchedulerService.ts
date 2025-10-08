import { QueueManager } from './QueueManager';
import { CronJob } from 'cron';
import { prisma } from '@/lib/prisma';

export interface ScheduledMessage {
  id: string;
  name: string;
  description?: string;
  queue: string;
  type: string;
  payload: any;
  schedule: string; // Cron expression
  timezone?: string;
  isActive: boolean;
  maxOccurrences?: number;
  occurrenceCount: number;
  nextRun: Date;
  lastRun?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface RecurringSchedule {
  id: string;
  name: string;
  description?: string;
  queueName: string;
  type: string;
  payload: any;
  cronExpression: string;
  timezone?: string;
  isActive: boolean;
  maxOccurrences?: number;
  occurrenceCount: number;
  nextRun: Date;
  lastRun?: Date;
  createdAt: Date;
  updatedAt: Date;
  options?: {
    correlationId?: string;
    replyTo?: string;
    metadata?: Record<string, any>;
    priority?: 'high' | 'normal' | 'low';
    delay?: number;
    expiresAt?: Date;
  };
}

export interface ScheduleResult {
  success: boolean;
  messageId?: string;
  error?: Error;
  nextRun?: Date;
  occurrenceCount: number;
  remainingOccurrences?: number;
}

export interface SchedulerStats {
  totalSchedules: number;
  activeSchedules: number;
  completedToday: number;
  failedToday: number;
  averageExecutionTime: number;
  nextScheduledRun: Date;
  schedulesByType: Record<string, number>;
  executionHistory: Array<{
    scheduleId: string;
    executedAt: Date;
    success: boolean;
    executionTime: number;
    error?: string;
  }>;
}

export class SchedulerService {
  private static instance: SchedulerService;
  private queueManager: QueueManager;
  private cronJobs: Map<string, CronJob> = new Map();
  private schedules: Map<string, ScheduledMessage> = new Map();
  private executionHistory: Map<string, Array<any>> = new Map();
  private maxHistorySize = 1000;
  private isRunning = false;
  private stats: SchedulerStats;

  static getInstance(): SchedulerService {
    if (!SchedulerService.instance) {
      SchedulerService.instance = new SchedulerService();
    }
    return SchedulerService.instance;
  }

  constructor() {
    this.queueManager = QueueManager.getInstance();
    this.stats = {
      totalSchedules: 0,
      activeSchedules: 0,
      completedToday: 0,
      failedToday: 0,
      averageExecutionTime: 0,
      nextScheduledRun: new Date(),
      schedulesByType: {},
      executionHistory: []
    };
  }

  async initialize(): Promise<void> {
    try {
      // Load existing schedules from database
      await this.loadSchedulesFromDatabase();

      // Start the scheduler
      this.startScheduler();

      console.log('SchedulerService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SchedulerService:', error);
      throw error;
    }
  }

  private async loadSchedulesFromDatabase(): Promise<void> {
    try {
      const recurringSchedules = await prisma.recurringSchedule.findMany({
        where: { isActive: true }
      });

      for (const dbSchedule of recurringSchedules) {
        const schedule: ScheduledMessage = {
          id: dbSchedule.id,
          name: dbSchedule.id, // Use ID as name for now
          description: dbSchedule.options?.metadata?.description,
          queue: dbSchedule.queueName,
          type: dbSchedule.type,
          payload: dbSchedule.payload,
          schedule: dbSchedule.cronExpression,
          timezone: dbSchedule.options?.metadata?.timezone,
          isActive: dbSchedule.isActive,
          maxOccurrences: dbSchedule.maxOccurrences,
          occurrenceCount: dbSchedule.occurrenceCount,
          nextRun: dbSchedule.nextRun ? new Date(dbSchedule.nextRun) : new Date(),
          lastRun: dbSchedule.lastRun ? new Date(dbSchedule.lastRun) : undefined,
          createdAt: dbSchedule.createdAt,
          updatedAt: dbSchedule.updatedAt,
          metadata: dbSchedule.options?.metadata
        };

        this.schedules.set(schedule.id, schedule);
        this.updateStats();
      }

      console.log(`Loaded ${this.schedules.size} schedules from database`);
    } catch (error) {
      console.error('Failed to load schedules from database:', error);
    }
  }

  private startScheduler(): void {
    this.isRunning = true;

    for (const schedule of this.schedules.values()) {
      if (schedule.isActive) {
        this.createCronJob(schedule);
      }
    }

    console.log(`Scheduler started with ${this.cronJobs.size} active cron jobs`);
  }

  private createCronJob(schedule: ScheduledMessage): void {
    try {
      const job = new CronJob(
        schedule.schedule,
        () => this.executeScheduledMessage(schedule.id),
        () => this.onJobComplete(schedule.id),
        null, // onComplete
        true, // start
        schedule.timezone || 'UTC'
      );

      this.cronJobs.set(schedule.id, job);
      console.log(`Created cron job for schedule: ${schedule.name} (${schedule.schedule})`);
    } catch (error) {
      console.error(`Failed to create cron job for schedule ${schedule.id}:`, error);
    }
  }

  private async executeScheduledMessage(scheduleId: string): Promise<void> {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      console.error(`Schedule not found: ${scheduleId}`);
      return;
    }

    const startTime = Date.now();

    try {
      // Check if max occurrences reached
      if (schedule.maxOccurrences && schedule.occurrenceCount >= schedule.maxOccurrences) {
        console.log(`Schedule ${schedule.name} reached max occurrences, deactivating`);
        await this.deactivateSchedule(scheduleId);
        return;
      }

      // Send message to queue
      const messageId = await this.queueManager.sendMessage(
        schedule.queue,
        schedule.type,
        schedule.payload,
        {
          priority: schedule.metadata?.priority,
          correlationId: schedule.metadata?.correlationId,
          replyTo: schedule.metadata?.replyTo,
          metadata: {
            ...schedule.metadata,
            scheduledMessageId: schedule.id,
            scheduledAt: new Date(),
            occurrenceCount: schedule.occurrenceCount + 1
          }
        }
      );

      const executionTime = Date.now() - startTime;

      // Update schedule
      schedule.occurrenceCount++;
      schedule.lastRun = new Date();
      schedule.nextRun = this.calculateNextRun(schedule.schedule, schedule.timezone);

      // Update in database
      await this.updateScheduleInDatabase(schedule);

      // Record execution
      this.recordExecution(scheduleId, {
        executedAt: new Date(),
        success: true,
        executionTime,
        messageId
      });

      // Update stats
      this.stats.completedToday++;

      console.log(`Executed scheduled message: ${schedule.name} (ID: ${messageId})`);

    } catch (error) {
      const executionTime = Date.now() - startTime;

      // Record failed execution
      this.recordExecution(scheduleId, {
        executedAt: new Date(),
        success: false,
        executionTime,
        error: (error as Error).message
      });

      // Update stats
      this.stats.failedToday++;

      console.error(`Failed to execute scheduled message ${schedule.name}:`, error);
    }
  }

  private onJobComplete(scheduleId: string): void {
    // This is called when the cron job completes its execution
    // Can be used for cleanup or logging
  }

  private calculateNextRun(cronExpression: string, timezone?: string): Date {
    try {
      const job = new CronJob(cronExpression, null, null, true, timezone || 'UTC');
      const nextDate = job.nextDate();
      return nextDate.toDate();
    } catch (error) {
      console.error('Error calculating next run time:', error);
      // Add 1 hour as fallback
      return new Date(Date.now() + 3600000);
    }
  }

  private async updateScheduleInDatabase(schedule: ScheduledMessage): Promise<void> {
    try {
      await prisma.recurringSchedule.update({
        where: { id: schedule.id },
        data: {
          occurrenceCount: schedule.occurrenceCount,
          lastRun: schedule.lastRun,
          nextRun: schedule.nextRun,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error(`Failed to update schedule in database: ${schedule.id}`, error);
    }
  }

  private recordExecution(scheduleId: string, execution: any): void {
    if (!this.executionHistory.has(scheduleId)) {
      this.executionHistory.set(scheduleId, []);
    }

    const history = this.executionHistory.get(scheduleId)!;
    history.push(execution);

    // Keep only recent history
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }

    // Update global stats
    this.stats.executionHistory.push({
      scheduleId,
      executedAt: execution.executedAt,
      success: execution.success,
      executionTime: execution.executionTime,
      error: execution.error
    });

    // Keep global history limited
    if (this.stats.executionHistory.length > this.maxHistorySize) {
      this.stats.executionHistory = this.stats.executionHistory.slice(-this.maxHistorySize);
    }

    this.updateStats();
  }

  private updateStats(): void {
    this.stats.totalSchedules = this.schedules.size;
    this.stats.activeSchedules = Array.from(this.schedules.values()).filter(s => s.isActive).length;

    // Calculate schedules by type
    this.stats.schedulesByType = {};
    for (const schedule of this.schedules.values()) {
      this.stats.schedulesByType[schedule.type] = (this.stats.schedulesByType[schedule.type] || 0) + 1;
    }

    // Find next scheduled run
    const activeSchedules = Array.from(this.schedules.values()).filter(s => s.isActive);
    if (activeSchedules.length > 0) {
      this.stats.nextScheduledRun = activeSchedules.reduce((earliest, schedule) =>
        schedule.nextRun < earliest ? schedule.nextRun : earliest,
        activeSchedules[0].nextRun
      );
    }

    // Calculate average execution time
    const recentExecutions = this.stats.executionHistory.slice(-100);
    if (recentExecutions.length > 0) {
      const totalTime = recentExecutions.reduce((sum, exec) => sum + exec.executionTime, 0);
      this.stats.averageExecutionTime = totalTime / recentExecutions.length;
    }
  }

  // Public API methods

  async createSchedule(scheduleData: {
    name: string;
    description?: string;
    queue: string;
    type: string;
    payload: any;
    schedule: string;
    timezone?: string;
    maxOccurrences?: number;
    metadata?: Record<string, any>;
  }): Promise<ScheduledMessage> {
    const schedule: ScheduledMessage = {
      id: `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...scheduleData,
      isActive: true,
      occurrenceCount: 0,
      nextRun: this.calculateNextRun(scheduleData.schedule, scheduleData.timezone),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save to database
    try {
      await prisma.recurringSchedule.create({
        data: {
          id: schedule.id,
          name: schedule.name,
          queueName: schedule.queue,
          type: schedule.type,
          payload: schedule.payload,
          cronExpression: schedule.schedule,
          timezone: schedule.timezone,
          isActive: schedule.isActive,
          maxOccurrences: schedule.maxOccurrences,
          occurrenceCount: schedule.occurrenceCount,
          nextRun: schedule.nextRun,
          options: {
            metadata: schedule.metadata
          },
          createdAt: schedule.createdAt,
          updatedAt: schedule.updatedAt
        }
      });
    } catch (error) {
      console.error('Failed to save schedule to database:', error);
      throw error;
    }

    // Add to memory
    this.schedules.set(schedule.id, schedule);

    // Create cron job if active
    if (schedule.isActive) {
      this.createCronJob(schedule);
    }

    this.updateStats();
    console.log(`Created schedule: ${schedule.name} (${schedule.schedule})`);

    return schedule;
  }

  async updateSchedule(scheduleId: string, updates: Partial<ScheduledMessage>): Promise<boolean> {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) return false;

    // Update in memory
    Object.assign(schedule, updates, { updatedAt: new Date() });

    // Update in database
    try {
      await prisma.recurringSchedule.update({
        where: { id: scheduleId },
        data: {
          name: schedule.name,
          queueName: schedule.queue,
          type: schedule.type,
          payload: schedule.payload,
          cronExpression: schedule.schedule,
          timezone: schedule.timezone,
          isActive: schedule.isActive,
          maxOccurrences: schedule.maxOccurrences,
          updatedAt: schedule.updatedAt
        }
      });
    } catch (error) {
      console.error(`Failed to update schedule in database: ${scheduleId}`, error);
      return false;
    }

    // Recreate cron job if schedule expression changed
    if (updates.schedule || updates.timezone || updates.isActive !== undefined) {
      // Stop existing job
      const existingJob = this.cronJobs.get(scheduleId);
      if (existingJob) {
        existingJob.stop();
        this.cronJobs.delete(scheduleId);
      }

      // Create new job if active
      if (schedule.isActive) {
        this.createCronJob(schedule);
      }
    }

    this.updateStats();
    console.log(`Updated schedule: ${schedule.name}`);

    return true;
  }

  async deleteSchedule(scheduleId: string): Promise<boolean> {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) return false;

    // Stop cron job
    const job = this.cronJobs.get(scheduleId);
    if (job) {
      job.stop();
      this.cronJobs.delete(scheduleId);
    }

    // Delete from database
    try {
      await prisma.recurringSchedule.delete({
        where: { id: scheduleId }
      });
    } catch (error) {
      console.error(`Failed to delete schedule from database: ${scheduleId}`, error);
      return false;
    }

    // Remove from memory
    this.schedules.delete(scheduleId);
    this.executionHistory.delete(scheduleId);

    this.updateStats();
    console.log(`Deleted schedule: ${schedule.name}`);

    return true;
  }

  async activateSchedule(scheduleId: string): Promise<boolean> {
    return this.updateSchedule(scheduleId, { isActive: true });
  }

  async deactivateSchedule(scheduleId: string): Promise<boolean> {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) return false;

    // Stop cron job
    const job = this.cronJobs.get(scheduleId);
    if (job) {
      job.stop();
      this.cronJobs.delete(scheduleId);
    }

    return this.updateSchedule(scheduleId, { isActive: false });
  }

  async executeNow(scheduleId: string): Promise<ScheduleResult> {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      throw new Error(`Schedule not found: ${scheduleId}`);
    }

    const startTime = Date.now();

    try {
      const messageId = await this.queueManager.sendMessage(
        schedule.queue,
        schedule.type,
        schedule.payload,
        {
          priority: schedule.metadata?.priority,
          correlationId: schedule.metadata?.correlationId,
          replyTo: schedule.metadata?.replyTo,
          metadata: {
            ...schedule.metadata,
            scheduledMessageId: schedule.id,
            scheduledAt: new Date(),
            manualExecution: true,
            occurrenceCount: schedule.occurrenceCount + 1
          }
        }
      );

      const executionTime = Date.now() - startTime;

      // Update schedule
      schedule.occurrenceCount++;
      schedule.lastRun = new Date();

      // Record execution
      this.recordExecution(scheduleId, {
        executedAt: new Date(),
        success: true,
        executionTime,
        messageId,
        manualExecution: true
      });

      // Update in database
      await this.updateScheduleInDatabase(schedule);

      return {
        success: true,
        messageId,
        executionTime,
        occurrenceCount: schedule.occurrenceCount,
        remainingOccurrences: schedule.maxOccurrences ?
          schedule.maxOccurrences - schedule.occurrenceCount : undefined
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;

      // Record failed execution
      this.recordExecution(scheduleId, {
        executedAt: new Date(),
        success: false,
        executionTime,
        error: (error as Error).message,
        manualExecution: true
      });

      return {
        success: false,
        error: error as Error,
        executionTime,
        occurrenceCount: schedule.occurrenceCount
      };
    }
  }

  getSchedule(scheduleId: string): ScheduledMessage | undefined {
    return this.schedules.get(scheduleId);
  }

  getSchedules(filter?: {
    active?: boolean;
    queue?: string;
    type?: string;
  }): ScheduledMessage[] {
    let schedules = Array.from(this.schedules.values());

    if (filter) {
      if (filter.active !== undefined) {
        schedules = schedules.filter(s => s.isActive === filter.active);
      }
      if (filter.queue) {
        schedules = schedules.filter(s => s.queue === filter.queue);
      }
      if (filter.type) {
        schedules = schedules.filter(s => s.type === filter.type);
      }
    }

    return schedules.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getExecutionHistory(scheduleId: string, limit: number = 50): any[] {
    const history = this.executionHistory.get(scheduleId) || [];
    return history.slice(-limit);
  }

  getStats(): SchedulerStats {
    this.updateStats();
    return { ...this.stats };
  }

  async validateCronExpression(cronExpression: string): Promise<{ valid: boolean; error?: string; nextRuns?: Date[] }> {
    try {
      const job = new CronJob(cronExpression, null, null, true, 'UTC');

      // Get next 5 run times
      const nextRuns: Date[] = [];
      for (let i = 0; i < 5; i++) {
        const nextDate = job.nextDate();
        nextRuns.push(nextDate.toDate());
      }

      return {
        valid: true,
        nextRuns
      };
    } catch (error) {
      return {
        valid: false,
        error: (error as Error).message
      };
    }
  }

  async getUpcomingExecutions(limit: number = 10): Promise<Array<{
    scheduleId: string;
    scheduleName: string;
    nextRun: Date;
    queue: string;
    type: string;
  }>> {
    const upcoming = Array.from(this.schedules.values())
      .filter(s => s.isActive && s.nextRun > new Date())
      .sort((a, b) => a.nextRun.getTime() - b.nextRun.getTime())
      .slice(0, limit)
      .map(s => ({
        scheduleId: s.id,
        scheduleName: s.name,
        nextRun: s.nextRun,
        queue: s.queue,
        type: s.type
      }));

    return upcoming;
  }

  async getExecutionReport(timeRange?: { start: Date; end: Date }): Promise<{
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
    executionsByType: Record<string, { total: number; successful: number; failed: number; avgTime: number }>;
    errorBreakdown: Record<string, number>;
  }> {
    let executions = this.stats.executionHistory;

    if (timeRange) {
      executions = executions.filter(exec =>
        exec.executedAt >= timeRange.start && exec.executedAt <= timeRange.end
      );
    }

    const totalExecutions = executions.length;
    const successfulExecutions = executions.filter(e => e.success).length;
    const failedExecutions = totalExecutions - successfulExecutions;
    const averageExecutionTime = totalExecutions > 0 ?
      executions.reduce((sum, e) => sum + e.executionTime, 0) / totalExecutions : 0;

    // Group by type
    const executionsByType: Record<string, any> = {};
    executions.forEach(exec => {
      const schedule = this.schedules.get(exec.scheduleId);
      const type = schedule?.type || 'unknown';

      if (!executionsByType[type]) {
        executionsByType[type] = { total: 0, successful: 0, failed: 0, totalTime: 0 };
      }

      executionsByType[type].total++;
      executionsByType[type].totalTime += exec.executionTime;

      if (exec.success) {
        executionsByType[type].successful++;
      } else {
        executionsByType[type].failed++;
      }
    });

    // Calculate averages
    Object.keys(executionsByType).forEach(type => {
      executionsByType[type].avgTime = executionsByType[type].totalTime / executionsByType[type].total;
    });

    // Error breakdown
    const errorBreakdown: Record<string, number> = {};
    executions.filter(e => !e.success && e.error).forEach(exec => {
      const errorType = exec.error.split(':')[0]; // Simple categorization
      errorBreakdown[errorType] = (errorBreakdown[errorType] || 0) + 1;
    });

    return {
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      averageExecutionTime,
      executionsByType,
      errorBreakdown
    };
  }

  async cleanup(): Promise<void> {
    // Stop all cron jobs
    for (const [scheduleId, job] of this.cronJobs) {
      job.stop();
      console.log(`Stopped cron job for schedule: ${scheduleId}`);
    }

    this.cronJobs.clear();
    this.schedules.clear();
    this.executionHistory.clear();
    this.isRunning = false;

    console.log('SchedulerService cleaned up');
  }
}