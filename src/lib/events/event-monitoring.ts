// Event Monitoring and Logging
// Comprehensive monitoring system for the event bus

import { BaseEvent, EventType, EventPriority } from './event-types';
import { EventBus } from './event-bus';
import { EventPersistence } from './event-persistence';

export interface EventMonitoringConfig {
  enableMetrics: boolean;
  enableHealthChecks: boolean;
  enableAlerts: boolean;
  metricsIntervalMs: number;
  healthCheckIntervalMs: number;
  alertThresholds: {
    errorRate: number; // percentage
    processingTimeMs: number;
    queueSize: number;
    memoryUsageMB: number;
  };
  retentionDays: number;
}

export interface EventMetrics {
  timestamp: Date;
  totalEvents: number;
  eventsByType: Record<EventType, number>;
  eventsByPriority: Record<EventPriority, number>;
  averageProcessingTime: number;
  errorRate: number;
  retryCount: number;
  queueSize: number;
  activeSubscriptions: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
}

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  checks: {
    eventBus: boolean;
    persistence: boolean;
    memory: boolean;
    performance: boolean;
  };
  metrics: {
    uptime: number;
    responseTime: number;
    errorRate: number;
    queueSize: number;
  };
  issues: string[];
}

export interface EventAlert {
  id: string;
  type: 'error_rate' | 'performance' | 'queue_size' | 'memory' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  data: Record<string, any>;
  resolved: boolean;
  resolvedAt?: Date;
}

export class EventMonitoring {
  private config: EventMonitoringConfig;
  private eventBus: EventBus;
  private persistence: EventPersistence;
  private metrics: EventMetrics[] = [];
  private alerts: EventAlert[] = [];
  private metricsInterval: NodeJS.Timeout | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private startTime: Date;
  private logger: Console;

  constructor(
    eventBus: EventBus,
    persistence: EventPersistence,
    config?: Partial<EventMonitoringConfig>
  ) {
    this.eventBus = eventBus;
    this.persistence = persistence;
    this.startTime = new Date();
    this.logger = console;

    this.config = {
      enableMetrics: true,
      enableHealthChecks: true,
      enableAlerts: true,
      metricsIntervalMs: 30000, // 30 seconds
      healthCheckIntervalMs: 60000, // 1 minute
      alertThresholds: {
        errorRate: 5.0, // 5%
        processingTimeMs: 5000, // 5 seconds
        queueSize: 1000,
        memoryUsageMB: 512
      },
      retentionDays: 7,
      ...config
    };

    this.initializeMonitoring();
  }

  startMonitoring(): void {
    if (this.config.enableMetrics) {
      this.startMetricsCollection();
    }

    if (this.config.enableHealthChecks) {
      this.startHealthChecks();
    }

    this.logger.info('Event monitoring started');
  }

  stopMonitoring(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    this.logger.info('Event monitoring stopped');
  }

  recordEvent(event: BaseEvent, processingTime: number, error?: Error): void {
    if (!this.config.enableMetrics) {
      return;
    }

    try {
      // Log event details
      this.logger.info('Event processed', {
        eventId: event.id,
        type: event.type,
        userId: event.userId,
        processingTime,
        success: !error,
        error: error?.message
      });

      // Check for alerts
      if (this.config.enableAlerts) {
        this.checkEventAlerts(event, processingTime, error);
      }
    } catch (monitoringError) {
      this.logger.error('Failed to record event monitoring data:', monitoringError);
    }
  }

  getMetrics(limit = 100): EventMetrics[] {
    return this.metrics.slice(-limit);
  }

  getCurrentMetrics(): EventMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  getAlerts(resolved = false): EventAlert[] {
    return this.alerts.filter(alert => alert.resolved === resolved);
  }

  async getHealthCheck(): Promise<HealthCheckResult> {
    const timestamp = new Date();
    const issues: string[] = [];
    const checks = {
      eventBus: await this.checkEventBusHealth(),
      persistence: await this.checkPersistenceHealth(),
      memory: this.checkMemoryHealth(),
      performance: await this.checkPerformanceHealth()
    };

    const busMetrics = this.eventBus.getMetrics();
    const uptime = Date.now() - this.startTime.getTime();

    const metrics = {
      uptime,
      responseTime: busMetrics.averageProcessingTime,
      errorRate: busMetrics.failureRate,
      queueSize: busMetrics.bufferSize
    };

    // Determine overall status
    const allChecksPass = Object.values(checks).every(check => check);
    const hasCriticalIssues = issues.some(issue => issue.includes('critical'));

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (allChecksPass && !hasCriticalIssues) {
      status = 'healthy';
    } else if (hasCriticalIssues) {
      status = 'unhealthy';
    } else {
      status = 'degraded';
    }

    return {
      status,
      timestamp,
      checks,
      metrics,
      issues
    };
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      this.logger.info(`Alert resolved: ${alertId}`);
      return true;
    }
    return false;
  }

  generateReport(): any {
    const currentMetrics = this.getCurrentMetrics();
    const healthCheck = this.getHealthCheck();
    const activeAlerts = this.getAlerts(false);

    return {
      timestamp: new Date(),
      uptime: Date.now() - this.startTime.getTime(),
      currentMetrics,
      healthCheck,
      activeAlerts: activeAlerts.length,
      totalAlerts: this.alerts.length,
      metricsHistory: this.getMetrics(24), // Last 24 data points
      topEventTypes: this.getTopEventTypes(),
      recentErrors: this.getRecentErrors()
    };
  }

  // Private Methods
  private initializeMonitoring(): void {
    // Setup event listeners for monitoring
    this.eventBus.getMetrics(); // Initialize metrics
  }

  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(async () => {
      try {
        const metrics = await this.collectMetrics();
        this.metrics.push(metrics);

        // Cleanup old metrics
        const retentionMs = this.config.retentionDays * 24 * 60 * 60 * 1000;
        const cutoffTime = Date.now() - retentionMs;
        this.metrics = this.metrics.filter(m => m.timestamp.getTime() > cutoffTime);

        // Check for metric-based alerts
        if (this.config.enableAlerts) {
          this.checkMetricsAlerts(metrics);
        }
      } catch (error) {
        this.logger.error('Failed to collect metrics:', error);
      }
    }, this.config.metricsIntervalMs);
  }

  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        const healthCheck = await this.getHealthCheck();

        if (healthCheck.status !== 'healthy') {
          this.logger.warn('Health check failed:', {
            status: healthCheck.status,
            issues: healthCheck.issues
          });

          if (this.config.enableAlerts) {
            this.createAlert({
              type: 'system',
              severity: healthCheck.status === 'unhealthy' ? 'critical' : 'medium',
              message: `System health check: ${healthCheck.status}`,
              data: healthCheck
            });
          }
        }
      } catch (error) {
        this.logger.error('Health check failed:', error);
      }
    }, this.config.healthCheckIntervalMs);
  }

  private async collectMetrics(): Promise<EventMetrics> {
    const busMetrics = this.eventBus.getMetrics();

    return {
      timestamp: new Date(),
      totalEvents: busMetrics.totalEvents,
      eventsByType: { ...busMetrics.eventsByType },
      eventsByPriority: { ...busMetrics.eventsByPriority },
      averageProcessingTime: busMetrics.averageProcessingTime,
      errorRate: busMetrics.failureRate,
      retryCount: busMetrics.retryCount,
      queueSize: busMetrics.bufferSize,
      activeSubscriptions: busMetrics.activeSubscriptions,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    };
  }

  private async checkEventBusHealth(): Promise<boolean> {
    try {
      // Simple health check - can we get metrics?
      this.eventBus.getMetrics();
      return true;
    } catch (error) {
      this.logger.error('Event bus health check failed:', error);
      return false;
    }
  }

  private async checkPersistenceHealth(): Promise<boolean> {
    try {
      // Try to query recent events
      await this.persistence.getEvents({}, 1);
      return true;
    } catch (error) {
      this.logger.error('Persistence health check failed:', error);
      return false;
    }
  }

  private checkMemoryHealth(): boolean {
    const memoryUsage = process.memoryUsage();
    const memoryMB = memoryUsage.heapUsed / 1024 / 1024;

    return memoryMB < this.config.alertThresholds.memoryUsageMB;
  }

  private async checkPerformanceHealth(): Promise<boolean> {
    try {
      const metrics = this.eventBus.getMetrics();
      return (
        metrics.averageProcessingTime < this.config.alertThresholds.processingTimeMs &&
        metrics.failureRate < this.config.alertThresholds.errorRate / 100
      );
    } catch (error) {
      this.logger.error('Performance health check failed:', error);
      return false;
    }
  }

  private checkEventAlerts(event: BaseEvent, processingTime: number, error?: Error): void {
    if (error) {
      this.createAlert({
        type: 'error_rate',
        severity: 'high',
        message: `Event processing failed: ${event.type}`,
        data: {
          eventId: event.id,
          eventType: event.type,
          error: error.message,
          processingTime
        }
      });
    }

    if (processingTime > this.config.alertThresholds.processingTimeMs) {
      this.createAlert({
        type: 'performance',
        severity: 'medium',
        message: `Slow event processing: ${event.type}`,
        data: {
          eventId: event.id,
          eventType: event.type,
          processingTime,
          threshold: this.config.alertThresholds.processingTimeMs
        }
      });
    }
  }

  private checkMetricsAlerts(metrics: EventMetrics): void {
    // Error rate alert
    if (metrics.errorRate > this.config.alertThresholds.errorRate / 100) {
      this.createAlert({
        type: 'error_rate',
        severity: 'high',
        message: `High error rate detected: ${(metrics.errorRate * 100).toFixed(2)}%`,
        data: {
          errorRate: metrics.errorRate,
          threshold: this.config.alertThresholds.errorRate
        }
      });
    }

    // Performance alert
    if (metrics.averageProcessingTime > this.config.alertThresholds.processingTimeMs) {
      this.createAlert({
        type: 'performance',
        severity: 'medium',
        message: `Slow processing detected: ${metrics.averageProcessingTime}ms`,
        data: {
          averageProcessingTime: metrics.averageProcessingTime,
          threshold: this.config.alertThresholds.processingTimeMs
        }
      });
    }

    // Queue size alert
    if (metrics.queueSize > this.config.alertThresholds.queueSize) {
      this.createAlert({
        type: 'queue_size',
        severity: 'medium',
        message: `Large queue size detected: ${metrics.queueSize} events`,
        data: {
          queueSize: metrics.queueSize,
          threshold: this.config.alertThresholds.queueSize
        }
      });
    }

    // Memory alert
    const memoryMB = metrics.memoryUsage.heapUsed / 1024 / 1024;
    if (memoryMB > this.config.alertThresholds.memoryUsageMB) {
      this.createAlert({
        type: 'memory',
        severity: 'high',
        message: `High memory usage detected: ${memoryMB.toFixed(2)}MB`,
        data: {
          memoryUsage: memoryMB,
          threshold: this.config.alertThresholds.memoryUsageMB
        }
      });
    }
  }

  private createAlert(alertData: Omit<EventAlert, 'id' | 'timestamp' | 'resolved'>): void {
    const alert: EventAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      resolved: false,
      ...alertData
    };

    this.alerts.push(alert);

    // Cleanup old alerts
    const retentionMs = this.config.retentionDays * 24 * 60 * 60 * 1000;
    const cutoffTime = Date.now() - retentionMs;
    this.alerts = this.alerts.filter(a => a.timestamp.getTime() > cutoffTime);

    this.logger.warn('Alert created', {
      alertId: alert.id,
      type: alert.type,
      severity: alert.severity,
      message: alert.message
    });
  }

  private getTopEventTypes(): Array<{ type: EventType; count: number }> {
    if (this.metrics.length === 0) return [];

    const latestMetrics = this.getCurrentMetrics();
    if (!latestMetrics) return [];

    return Object.entries(latestMetrics.eventsByType)
      .map(([type, count]) => ({ type: type as EventType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private getRecentErrors(): Array<{ timestamp: Date; error: string }> {
    // This would typically query the persistence layer for recent errors
    // For now, return empty array
    return [];
  }
}

// Factory function
export function createEventMonitoring(
  eventBus: EventBus,
  persistence: EventPersistence,
  config?: Partial<EventMonitoringConfig>
): EventMonitoring {
  return new EventMonitoring(eventBus, persistence, config);
}