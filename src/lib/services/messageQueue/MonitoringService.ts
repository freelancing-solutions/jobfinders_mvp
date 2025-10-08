import { QueueManager } from './QueueManager';
import { PriorityProcessor } from './PriorityProcessor';

export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  checks: Array<{
    name: string;
    status: 'pass' | 'fail' | 'warn';
    message?: string;
    responseTime?: number;
    details?: any;
  }>;
  overallResponseTime: number;
}

export interface QueueHealthMetrics {
  queueName: string;
  status: 'healthy' | 'warning' | 'critical';
  depth: number;
  depthThreshold: number;
  processingRate: number;
  errorRate: number;
  errorThreshold: number;
  averageLatency: number;
  latencyThreshold: number;
  consumerCount: number;
  lastProcessed: Date;
  stalenessThreshold: number;
}

export interface SystemMetrics {
  timestamp: Date;
  queues: Array<{
    name: string;
    depth: number;
    processingRate: number;
    errorRate: number;
    averageLatency: number;
    consumerCount: number;
  }>;
  system: {
    totalMessages: number;
    totalProcessingRate: number;
    totalErrorRate: number;
    averageLatency: number;
    activeConsumers: number;
    memoryUsage: number;
    cpuUsage: number;
    redisMemoryUsage: number;
    redisConnections: number;
  };
  alerts: Array<{
    id: string;
    type: 'queue_depth' | 'error_rate' | 'latency' | 'consumer_health' | 'system_health';
    severity: 'info' | 'warning' | 'critical';
    queue?: string;
    message: string;
    timestamp: Date;
    resolved: boolean;
  }>;
}

export interface AlertRule {
  id: string;
  name: string;
  type: 'queue_depth' | 'error_rate' | 'latency' | 'consumer_health' | 'system_health';
  condition: string;
  threshold: number;
  comparison: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  severity: 'info' | 'warning' | 'critical';
  enabled: boolean;
  queueFilter?: string;
  cooldownPeriod: number; // seconds
  notificationChannels: string[];
  lastTriggered?: Date;
  createdAt: Date;
}

export interface PerformanceSnapshot {
  timestamp: Date;
  throughput: {
    messagesPerSecond: number;
    messagesPerMinute: number;
    messagesPerHour: number;
  };
  latency: {
    p50: number;
    p95: number;
    p99: number;
    max: number;
    average: number;
  };
  errors: {
    errorRate: number;
    errorTypes: Record<string, number>;
    retryRate: number;
    deadLetterRate: number;
  };
  resources: {
    memoryUsage: number;
    cpuUsage: number;
    redisMemory: number;
    redisConnections: number;
  };
}

export class MonitoringService {
  private static instance: MonitoringService;
  private queueManager: QueueManager;
  private priorityProcessor: PriorityProcessor;
  private alertRules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, any> = new Map();
  private metricsHistory: SystemMetrics[] = [];
  private performanceSnapshots: PerformanceSnapshot[] = [];
  private healthCheckInterval: NodeJS.Timeout;
  private metricsCollectionInterval: NodeJS.Timeout;
  private alertCheckInterval: NodeJS.Timeout;
  private maxHistorySize = 1000;

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  constructor() {
    this.queueManager = QueueManager.getInstance();
    this.priorityProcessor = PriorityProcessor.getInstance();
    this.initializeDefaultAlertRules();
    this.startMonitoring();
  }

  private initializeDefaultAlertRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'high-queue-depth',
        name: 'High Queue Depth',
        type: 'queue_depth',
        condition: 'depth',
        threshold: 1000,
        comparison: 'gt',
        severity: 'warning',
        enabled: true,
        cooldownPeriod: 300,
        notificationChannels: ['email', 'slack'],
        createdAt: new Date()
      },
      {
        id: 'critical-queue-depth',
        name: 'Critical Queue Depth',
        type: 'queue_depth',
        condition: 'depth',
        threshold: 5000,
        comparison: 'gt',
        severity: 'critical',
        enabled: true,
        cooldownPeriod: 60,
        notificationChannels: ['email', 'slack', 'sms'],
        createdAt: new Date()
      },
      {
        id: 'high-error-rate',
        name: 'High Error Rate',
        type: 'error_rate',
        condition: 'errorRate',
        threshold: 0.05, // 5%
        comparison: 'gt',
        severity: 'warning',
        enabled: true,
        cooldownPeriod: 300,
        notificationChannels: ['email'],
        createdAt: new Date()
      },
      {
        id: 'critical-error-rate',
        name: 'Critical Error Rate',
        type: 'error_rate',
        condition: 'errorRate',
        threshold: 0.10, // 10%
        comparison: 'gt',
        severity: 'critical',
        enabled: true,
        cooldownPeriod: 60,
        notificationChannels: ['email', 'slack', 'sms'],
        createdAt: new Date()
      },
      {
        id: 'high-latency',
        name: 'High Processing Latency',
        type: 'latency',
        condition: 'averageLatency',
        threshold: 5000, // 5 seconds
        comparison: 'gt',
        severity: 'warning',
        enabled: true,
        cooldownPeriod: 300,
        notificationChannels: ['email'],
        createdAt: new Date()
      },
      {
        id: 'no-consumers',
        name: 'No Active Consumers',
        type: 'consumer_health',
        condition: 'consumerCount',
        threshold: 0,
        comparison: 'eq',
        severity: 'critical',
        enabled: true,
        cooldownPeriod: 120,
        notificationChannels: ['email', 'slack'],
        createdAt: new Date()
      },
      {
        id: 'stale-queue',
        name: 'Stale Queue (No Processing)',
        type: 'queue_depth',
        condition: 'staleness',
        threshold: 300000, // 5 minutes
        comparison: 'gt',
        severity: 'warning',
        enabled: true,
        cooldownPeriod: 600,
        notificationChannels: ['email'],
        createdAt: new Date()
      }
    ];

    defaultRules.forEach(rule => this.alertRules.set(rule.id, rule));
  }

  private startMonitoring(): void {
    // Health checks every 30 seconds
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, 30000);

    // Metrics collection every 10 seconds
    this.metricsCollectionInterval = setInterval(() => {
      this.collectMetrics();
    }, 10000);

    // Alert checking every 60 seconds
    this.alertCheckInterval = setInterval(() => {
      this.checkAlerts();
    }, 60000);
  }

  async performHealthChecks(): Promise<HealthCheck> {
    const startTime = Date.now();
    const checks = [];

    try {
      // Redis connection check
      const redisStart = Date.now();
      const redisPing = await this.queueManager['redis'].ping();
      const redisResponseTime = Date.now() - redisStart;

      checks.push({
        name: 'redis_connection',
        status: redisPing === 'PONG' ? 'pass' : 'fail',
        message: redisPing === 'PONG' ? 'Redis responding normally' : 'Redis not responding',
        responseTime: redisResponseTime
      });
    } catch (error) {
      checks.push({
        name: 'redis_connection',
        status: 'fail',
        message: `Redis connection error: ${(error as Error).message}`,
        responseTime: Date.now() - startTime
      });
    }

    try {
      // Queue depth checks
      const queueMetrics = await this.queueManager.getQueueMetrics();
      const criticalQueues = queueMetrics.filter(q => q.depth > 1000);

      checks.push({
        name: 'queue_depths',
        status: criticalQueues.length === 0 ? 'pass' : criticalQueues.length > 5 ? 'fail' : 'warn',
        message: `${criticalQueues.length} queues with high depth (>1000)`,
        details: { criticalQueues: criticalQueues.map(q => q.queueName) }
      });
    } catch (error) {
      checks.push({
        name: 'queue_depths',
        status: 'fail',
        message: `Failed to check queue depths: ${(error as Error).message}`
      });
    }

    try {
      // Error rate check
      const processingStats = this.priorityProcessor.getProcessingStats();
      const highErrorRateQueues = processingStats.filter(s => s.errorRate > 0.05);

      checks.push({
        name: 'error_rates',
        status: highErrorRateQueues.length === 0 ? 'pass' : highErrorRateQueues.length > 3 ? 'fail' : 'warn',
        message: `${highErrorRateQueues.length} queues with high error rate (>5%)`,
        details: { highErrorRateQueues: highErrorRateQueues.map(s => ({ queue: s.queueName, errorRate: s.errorRate })) }
      });
    } catch (error) {
      checks.push({
        name: 'error_rates',
        status: 'fail',
        message: `Failed to check error rates: ${(error as Error).message}`
      });
    }

    try {
      // System resource checks
      const memUsage = process.memoryUsage();
      const memoryUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

      checks.push({
        name: 'memory_usage',
        status: memoryUsagePercent < 80 ? 'pass' : memoryUsagePercent < 95 ? 'warn' : 'fail',
        message: `Memory usage: ${memoryUsagePercent.toFixed(1)}%`,
        details: { memoryUsage: memUsage }
      });
    } catch (error) {
      checks.push({
        name: 'memory_usage',
        status: 'fail',
        message: `Failed to check memory usage: ${(error as Error).message}`
      });
    }

    const overallResponseTime = Date.now() - startTime;
    const failedChecks = checks.filter(c => c.status === 'fail');
    const warningChecks = checks.filter(c => c.status === 'warn');

    const overallStatus = failedChecks.length > 0 ? 'unhealthy' :
                         warningChecks.length > 0 ? 'degraded' : 'healthy';

    const healthCheck: HealthCheck = {
      status: overallStatus,
      timestamp: new Date(),
      checks,
      overallResponseTime
    };

    // Store health check for historical analysis
    this.storeHealthCheck(healthCheck);

    return healthCheck;
  }

  private async collectMetrics(): Promise<SystemMetrics> {
    try {
      const queueMetrics = await this.queueManager.getQueueMetrics();
      const processingStats = this.priorityProcessor.getProcessingStats();

      // Get system resource metrics
      const memUsage = process.memoryUsage();
      const redisInfo = await this.getRedisInfo();

      const totalMessages = queueMetrics.reduce((sum, q) => sum + q.depth, 0);
      const totalProcessingRate = processingStats.reduce((sum, s) => sum + s.throughputPerSecond, 0);
      const totalErrorRate = processingStats.length > 0 ?
        processingStats.reduce((sum, s) => sum + s.errorRate, 0) / processingStats.length : 0;
      const averageLatency = processingStats.length > 0 ?
        processingStats.reduce((sum, s) => sum + s.averageProcessingTime, 0) / processingStats.length : 0;
      const activeConsumers = processingStats.reduce((sum, s) => sum + s.consumerCount, 0);

      const metrics: SystemMetrics = {
        timestamp: new Date(),
        queues: queueMetrics.map(q => ({
          name: q.queueName,
          depth: q.depth,
          processingRate: q.processingRate,
          errorRate: q.errorRate,
          averageLatency: q.averageLatency,
          consumerCount: q.consumerCount
        })),
        system: {
          totalMessages,
          totalProcessingRate,
          totalErrorRate,
          averageLatency,
          activeConsumers,
          memoryUsage: memUsage.heapUsed,
          cpuUsage: 0, // Would need CPU monitoring library
          redisMemoryUsage: redisInfo.used_memory,
          redisConnections: redisInfo.connected_clients
        },
        alerts: Array.from(this.activeAlerts.values()).filter(alert => !alert.resolved)
      };

      // Store metrics for historical analysis
      this.storeMetrics(metrics);

      return metrics;
    } catch (error) {
      console.error('Error collecting metrics:', error);
      throw error;
    }
  }

  private async getRedisInfo(): Promise<any> {
    try {
      const info = await this.queueManager['redis'].info('memory', 'clients');
      const parsed: any = {};

      info.split('\r\n').forEach(line => {
        const [key, value] = line.split(':');
        if (key && value) {
          if (key.includes('memory')) {
            parsed[key] = parseInt(value);
          } else {
            parsed[key] = value;
          }
        }
      });

      return parsed;
    } catch (error) {
      return { used_memory: 0, connected_clients: 0 };
    }
  }

  private async checkAlerts(): Promise<void> {
    try {
      const metrics = await this.collectMetrics();
      const now = Date.now();

      for (const rule of this.alertRules.values()) {
        if (!rule.enabled) continue;

        // Check cooldown period
        if (rule.lastTriggered && (now - rule.lastTriggered.getTime()) < rule.cooldownPeriod * 1000) {
          continue;
        }

        // Apply queue filter if specified
        const relevantQueues = rule.queueFilter ?
          metrics.queues.filter(q => q.name.includes(rule.queueFilter!)) :
          metrics.queues;

        for (const queue of relevantQueues) {
          const shouldAlert = this.evaluateAlertCondition(rule, queue, metrics.system);

          if (shouldAlert) {
            await this.triggerAlert(rule, queue, metrics);
          }
        }

        // System-wide alerts
        if (!rule.queueFilter) {
          const shouldAlert = this.evaluateAlertCondition(rule, null, metrics.system);
          if (shouldAlert) {
            await this.triggerAlert(rule, null, metrics);
          }
        }
      }
    } catch (error) {
      console.error('Error checking alerts:', error);
    }
  }

  private evaluateAlertCondition(rule: AlertRule, queue: any, system: any): boolean {
    let value: number;

    if (queue) {
      value = queue[rule.condition] || 0;
    } else {
      value = system[rule.condition] || 0;
    }

    switch (rule.comparison) {
      case 'gt': return value > rule.threshold;
      case 'lt': return value < rule.threshold;
      case 'eq': return value === rule.threshold;
      case 'gte': return value >= rule.threshold;
      case 'lte': return value <= rule.threshold;
      default: return false;
    }
  }

  private async triggerAlert(rule: AlertRule, queue: any, metrics: SystemMetrics): Promise<void> {
    const alertId = `${rule.id}-${queue?.name || 'system'}-${Date.now()}`;
    const now = new Date();

    const alert = {
      id: alertId,
      ruleId: rule.id,
      type: rule.type,
      severity: rule.severity,
      queue: queue?.name,
      message: this.generateAlertMessage(rule, queue, metrics),
      timestamp: now,
      resolved: false,
      data: { rule, queue, metrics }
    };

    this.activeAlerts.set(alertId, alert);
    rule.lastTriggered = now;

    // Send notifications
    await this.sendAlertNotifications(alert);

    console.warn(`Alert triggered: ${alert.message}`);
  }

  private generateAlertMessage(rule: AlertRule, queue: any, metrics: SystemMetrics): string {
    const queueName = queue ? `queue ${queue.name}` : 'system';
    const value = queue ? queue[rule.condition] : metrics.system[rule.condition as keyof typeof metrics.system];

    switch (rule.type) {
      case 'queue_depth':
        return `High queue depth in ${queueName}: ${value} messages (threshold: ${rule.threshold})`;
      case 'error_rate':
        return `High error rate in ${queueName}: ${(value * 100).toFixed(2)}% (threshold: ${(rule.threshold * 100).toFixed(2)}%)`;
      case 'latency':
        return `High processing latency in ${queueName}: ${value}ms (threshold: ${rule.threshold}ms)`;
      case 'consumer_health':
        return `No active consumers for ${queueName}`;
      case 'system_health':
        return `System health issue: ${rule.condition} is ${value} (threshold: ${rule.threshold})`;
      default:
        return `Alert triggered for ${queueName}: ${rule.name}`;
    }
  }

  private async sendAlertNotifications(alert: any): Promise<void> {
    // This would integrate with notification channels
    // For now, just log the alert
    console.log(`ALERT [${alert.severity.toUpperCase()}]: ${alert.message}`);

    // In production, this would:
    // - Send email notifications
    // - Send Slack/webhook notifications
    // - Send SMS for critical alerts
    // - Store in database for audit trail
  }

  private storeHealthCheck(healthCheck: HealthCheck): void {
    // Store health check for historical analysis
    // In production, this would go to a time-series database
  }

  private storeMetrics(metrics: SystemMetrics): void {
    this.metricsHistory.push(metrics);

    // Keep only recent metrics
    if (this.metricsHistory.length > this.maxHistorySize) {
      this.metricsHistory = this.metricsHistory.slice(-this.maxHistorySize);
    }
  }

  private capturePerformanceSnapshot(): void {
    const now = Date.now();
    const recentMetrics = this.metricsHistory.slice(-60); // Last 10 minutes (assuming 10s intervals)

    if (recentMetrics.length < 2) return;

    const oldestMetrics = recentMetrics[0];
    const newestMetrics = recentMetrics[recentMetrics.length - 1];
    const timeDiffMinutes = (newestMetrics.timestamp.getTime() - oldestMetrics.timestamp.getTime()) / 60000;

    const totalMessages = newestMetrics.system.totalMessages - oldestMetrics.system.totalMessages;
    const messagesPerMinute = totalMessages / timeDiffMinutes;

    // Calculate latency percentiles (simplified)
    const latencies = recentMetrics.map(m => m.system.averageLatency).filter(l => l > 0);
    latencies.sort((a, b) => a - b);

    const snapshot: PerformanceSnapshot = {
      timestamp: new Date(now),
      throughput: {
        messagesPerSecond: messagesPerMinute / 60,
        messagesPerMinute,
        messagesPerHour: messagesPerMinute * 60
      },
      latency: {
        p50: this.percentile(latencies, 0.5),
        p95: this.percentile(latencies, 0.95),
        p99: this.percentile(latencies, 0.99),
        max: Math.max(...latencies, 0),
        average: newestMetrics.system.averageLatency
      },
      errors: {
        errorRate: newestMetrics.system.totalErrorRate,
        errorTypes: {}, // Would be calculated from error logs
        retryRate: 0, // Would be calculated from retry metrics
        deadLetterRate: 0 // Would be calculated from DLQ metrics
      },
      resources: {
        memoryUsage: newestMetrics.system.memoryUsage,
        cpuUsage: newestMetrics.system.cpuUsage,
        redisMemory: newestMetrics.system.redisMemoryUsage,
        redisConnections: newestMetrics.system.redisConnections
      }
    };

    this.performanceSnapshots.push(snapshot);

    // Keep only recent snapshots
    if (this.performanceSnapshots.length > 100) {
      this.performanceSnapshots = this.performanceSnapshots.slice(-100);
    }
  }

  private percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    const index = Math.ceil(values.length * p) - 1;
    return values[Math.max(0, index)];
  }

  // Public API methods
  async getHealthStatus(): Promise<HealthCheck> {
    return this.performHealthChecks();
  }

  async getMetrics(timeRange?: { start: Date; end: Date }): Promise<SystemMetrics[]> {
    if (!timeRange) {
      return this.metricsHistory;
    }

    return this.metricsHistory.filter(m =>
      m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
    );
  }

  async getPerformanceMetrics(timeRange?: { start: Date; end: Date }): Promise<PerformanceSnapshot[]> {
    if (!timeRange) {
      return this.performanceSnapshots;
    }

    return this.performanceSnapshots.filter(s =>
      s.timestamp >= timeRange.start && s.timestamp <= timeRange.end
    );
  }

  getQueueHealthMetrics(): Promise<QueueHealthMetrics[]> {
    return this.queueManager.getQueueMetrics().then(metrics =>
      metrics.map(metric => ({
        queueName: metric.queueName,
        status: this.determineQueueStatus(metric),
        depth: metric.depth,
        depthThreshold: 1000,
        processingRate: metric.processingRate,
        errorRate: metric.errorRate,
        errorThreshold: 0.05,
        averageLatency: metric.averageLatency,
        latencyThreshold: 5000,
        consumerCount: metric.consumerCount,
        lastProcessed: metric.lastProcessed,
        stalenessThreshold: 300000
      }))
    );
  }

  private determineQueueStatus(metric: any): 'healthy' | 'warning' | 'critical' {
    if (metric.depth > 5000 || metric.errorRate > 0.1 || metric.consumerCount === 0) {
      return 'critical';
    }
    if (metric.depth > 1000 || metric.errorRate > 0.05 || metric.averageLatency > 5000) {
      return 'warning';
    }
    return 'healthy';
  }

  getActiveAlerts(): any[] {
    return Array.from(this.activeAlerts.values()).filter(alert => !alert.resolved);
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      return true;
    }
    return false;
  }

  addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
  }

  removeAlertRule(id: string): boolean {
    return this.alertRules.delete(id);
  }

  updateAlertRule(id: string, updates: Partial<AlertRule>): boolean {
    const rule = this.alertRules.get(id);
    if (!rule) return false;

    Object.assign(rule, updates);
    return true;
  }

  getAlertRules(): AlertRule[] {
    return Array.from(this.alertRules.values());
  }

  async getSystemOverview(): Promise<{
    health: HealthCheck;
    metrics: SystemMetrics;
    alerts: any[];
    performance: PerformanceSnapshot | null;
  }> {
    const [health, metrics, alerts] = await Promise.all([
      this.getHealthStatus(),
      this.collectMetrics(),
      Promise.resolve(this.getActiveAlerts())
    ]);

    // Capture performance snapshot
    this.capturePerformanceSnapshot();
    const performance = this.performanceSnapshots[this.performanceSnapshots.length - 1] || null;

    return {
      health,
      metrics,
      alerts,
      performance
    };
  }

  async cleanup(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.metricsCollectionInterval) {
      clearInterval(this.metricsCollectionInterval);
    }
    if (this.alertCheckInterval) {
      clearInterval(this.alertCheckInterval);
    }

    this.metricsHistory = [];
    this.performanceSnapshots = [];
    this.activeAlerts.clear();
  }
}