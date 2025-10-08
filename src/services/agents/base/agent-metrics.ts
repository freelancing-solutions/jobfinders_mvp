import { Logger } from '@/lib/logger';
import { AgentMetrics, AgentAnalytics, AgentType } from '@/types/agents';

export interface MetricsSnapshot {
  timestamp: Date;
  agentId: string;
  agentType: AgentType;
  metrics: AgentMetrics;
}

export interface PerformanceAlert {
  agentId: string;
  agentType: AgentType;
  alertType: 'high_response_time' | 'high_error_rate' | 'low_success_rate' | 'resource_usage';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
}

export class AgentMetricsCollector {
  private logger: Logger;
  private metrics: Map<string, AgentMetrics> = new Map();
  private snapshots: MetricsSnapshot[] = [];
  private alerts: PerformanceAlert[] = [];
  private thresholds: Map<string, number> = new Map();

  constructor() {
    this.logger = new Logger('AgentMetricsCollector');
    this.initializeThresholds();
  }

  /**
   * Initialize default thresholds for alerts
   */
  private initializeThresholds(): void {
    this.thresholds.set('max_response_time', 5000); // 5 seconds
    this.thresholds.set('max_error_rate', 0.1); // 10%
    this.thresholds.set('min_success_rate', 0.9); // 90%
    this.thresholds.set('max_cpu_usage', 80); // 80%
    this.thresholds.set('max_memory_usage', 80); // 80%
  }

  /**
   * Update metrics for an agent
   */
  updateMetrics(agentId: string, agentType: AgentType, updates: Partial<AgentMetrics>): void {
    const currentMetrics = this.metrics.get(agentId) || this.createEmptyMetrics();
    const updatedMetrics = { ...currentMetrics, ...updates };

    this.metrics.set(agentId, updatedMetrics);

    // Check for performance alerts
    this.checkPerformanceAlerts(agentId, agentType, updatedMetrics);

    this.logger.debug(`Updated metrics for agent ${agentId}`);
  }

  /**
   * Record a request completion
   */
  recordRequestCompletion(
    agentId: string,
    agentType: AgentType,
    responseTime: number,
    success: boolean,
    tokenUsage?: number
  ): void {
    const currentMetrics = this.metrics.get(agentId) || this.createEmptyMetrics();

    // Update basic metrics
    currentMetrics.totalRequests++;
    if (success) {
      currentMetrics.successfulRequests++;
    }

    // Update average response time
    const totalSuccessful = currentMetrics.successfulRequests;
    const currentAverage = currentMetrics.averageResponseTime;
    currentMetrics.averageResponseTime =
      (currentAverage * (totalSuccessful - 1) + responseTime) / totalSuccessful;

    // Update error rate
    currentMetrics.errorRate =
      (currentMetrics.totalRequests - currentMetrics.successfulRequests) / currentMetrics.totalRequests;

    // Update resource usage
    if (tokenUsage) {
      currentMetrics.resourceUsage.tokens += tokenUsage;
    }

    // Simulate CPU and memory usage (in real implementation, these would be measured)
    currentMetrics.resourceUsage.cpu = Math.min(100, currentMetrics.resourceUsage.cpu + Math.random() * 10);
    currentMetrics.resourceUsage.memory = Math.min(100, currentMetrics.resourceUsage.memory + Math.random() * 5);

    this.metrics.set(agentId, currentMetrics);

    // Check for performance alerts
    this.checkPerformanceAlerts(agentId, agentType, currentMetrics);
  }

  /**
   * Get metrics for a specific agent
   */
  getMetrics(agentId: string): AgentMetrics | null {
    return this.metrics.get(agentId) || null;
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Map<string, AgentMetrics> {
    return new Map(this.metrics);
  }

  /**
   * Get metrics by agent type
   */
  getMetricsByType(agentType: AgentType): Map<string, AgentMetrics> {
    const filtered = new Map<string, AgentMetrics>();

    for (const [agentId, metrics] of this.metrics) {
      // In a real implementation, you'd need to track agent type separately
      // For now, return all metrics
      filtered.set(agentId, metrics);
    }

    return filtered;
  }

  /**
   * Take a snapshot of current metrics
   */
  takeSnapshot(agentId: string, agentType: AgentType): void {
    const metrics = this.metrics.get(agentId);
    if (!metrics) {
      this.logger.warn(`No metrics found for agent ${agentId}`);
      return;
    }

    const snapshot: MetricsSnapshot = {
      timestamp: new Date(),
      agentId,
      agentType,
      metrics: { ...metrics }
    };

    this.snapshots.push(snapshot);

    // Keep only last 1000 snapshots to prevent memory issues
    if (this.snapshots.length > 1000) {
      this.snapshots = this.snapshots.slice(-1000);
    }

    this.logger.debug(`Taken metrics snapshot for agent ${agentId}`);
  }

  /**
   * Get metrics history for an agent
   */
  getMetricsHistory(agentId: string, hours: number = 24): MetricsSnapshot[] {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - hours);

    return this.snapshots.filter(
      snapshot => snapshot.agentId === agentId && snapshot.timestamp >= cutoff
    );
  }

  /**
   * Get aggregated analytics for a time period
   */
  getAnalytics(agentType?: AgentType, hours: number = 24): AgentAnalytics {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - hours);

    const relevantSnapshots = this.snapshots.filter(
      snapshot => snapshot.timestamp >= cutoff && (!agentType || snapshot.agentType === agentType)
    );

    if (relevantSnapshots.length === 0) {
      return this.createEmptyAnalytics(agentType || 'unknown' as AgentType, hours);
    }

    // Aggregate metrics across all snapshots
    const totalRequests = relevantSnapshots.reduce(
      (sum, snapshot) => sum + snapshot.metrics.totalRequests, 0
    );

    const successfulRequests = relevantSnapshots.reduce(
      (sum, snapshot) => sum + snapshot.metrics.successfulRequests, 0
    );

    const averageResponseTime = relevantSnapshots.reduce(
      (sum, snapshot) => sum + snapshot.metrics.averageResponseTime, 0
    ) / relevantSnapshots.length;

    const errorRate = totalRequests > 0 ? (totalRequests - successfulRequests) / totalRequests : 0;

    const totalTokens = relevantSnapshots.reduce(
      (sum, snapshot) => sum + snapshot.metrics.resourceUsage.tokens, 0
    );

    const costEstimate = this.calculateCostEstimate(totalTokens);

    return {
      agentId: agentType || 'aggregated',
      agentType: agentType || 'unknown' as AgentType,
      period: this.getPeriodString(hours),
      metrics: {
        totalRequests,
        averageResponseTime,
        successRate: totalRequests > 0 ? successfulRequests / totalRequests : 0,
        errorRate,
        providerUsage: {}, // Would be populated by LLM service
        modelUsage: {}, // Would be populated by LLM service
        costEstimate,
        errorsByType: this.getErrorBreakdown(relevantSnapshots)
      },
      timestamp: new Date()
    };
  }

  /**
   * Get performance alerts
   */
  getAlerts(severity?: 'low' | 'medium' | 'high' | 'critical'): PerformanceAlert[] {
    return severity
      ? this.alerts.filter(alert => alert.severity === severity)
      : this.alerts;
  }

  /**
   * Get recent alerts for an agent
   */
  getAgentAlerts(agentId: string, hours: number = 24): PerformanceAlert[] {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - hours);

    return this.alerts.filter(
      alert => alert.agentId === agentId && alert.timestamp >= cutoff
    );
  }

  /**
   * Clear alerts for an agent
   */
  clearAgentAlerts(agentId: string): void {
    this.alerts = this.alerts.filter(alert => alert.agentId !== agentId);
    this.logger.info(`Cleared alerts for agent ${agentId}`);
  }

  /**
   * Set custom threshold
   */
  setThreshold(thresholdName: string, value: number): void {
    this.thresholds.set(thresholdName, value);
    this.logger.info(`Set threshold ${thresholdName} to ${value}`);
  }

  /**
   * Reset metrics for an agent
   */
  resetMetrics(agentId: string): void {
    this.metrics.set(agentId, this.createEmptyMetrics());
    this.clearAgentAlerts(agentId);
    this.logger.info(`Reset metrics for agent ${agentId}`);
  }

  /**
   * Export metrics data
   */
  exportData(format: 'json' | 'csv'): string {
    if (format === 'json') {
      return JSON.stringify({
        metrics: Object.fromEntries(this.metrics),
        snapshots: this.snapshots,
        alerts: this.alerts,
        timestamp: new Date()
      }, null, 2);
    } else {
      // CSV export
      const headers = [
        'agentId', 'agentType', 'timestamp', 'totalRequests', 'successfulRequests',
        'averageResponseTime', 'errorRate', 'uptime', 'cpuUsage', 'memoryUsage', 'tokens'
      ];

      const rows = [headers.join(',')];

      for (const [agentId, metrics] of this.metrics) {
        rows.push([
          agentId,
          'unknown', // Would need to track agent type
          new Date().toISOString(),
          metrics.totalRequests,
          metrics.successfulRequests,
          metrics.averageResponseTime.toFixed(2),
          metrics.errorRate.toFixed(4),
          metrics.uptime,
          metrics.resourceUsage.cpu.toFixed(2),
          metrics.resourceUsage.memory.toFixed(2),
          metrics.resourceUsage.tokens
        ].join(','));
      }

      return rows.join('\n');
    }
  }

  /**
   * Check for performance alerts
   */
  private checkPerformanceAlerts(agentId: string, agentType: AgentType, metrics: AgentMetrics): void {
    const alerts: PerformanceAlert[] = [];

    // Check response time
    const maxResponseTime = this.thresholds.get('max_response_time') || 5000;
    if (metrics.averageResponseTime > maxResponseTime) {
      alerts.push({
        agentId,
        agentType,
        alertType: 'high_response_time',
        severity: this.getSeverity(metrics.averageResponseTime, maxResponseTime),
        message: `Average response time (${metrics.averageResponseTime}ms) exceeds threshold (${maxResponseTime}ms)`,
        value: metrics.averageResponseTime,
        threshold: maxResponseTime,
        timestamp: new Date()
      });
    }

    // Check error rate
    const maxErrorRate = this.thresholds.get('max_error_rate') || 0.1;
    if (metrics.errorRate > maxErrorRate) {
      alerts.push({
        agentId,
        agentType,
        alertType: 'high_error_rate',
        severity: this.getSeverity(metrics.errorRate, maxErrorRate),
        message: `Error rate (${(metrics.errorRate * 100).toFixed(2)}%) exceeds threshold (${(maxErrorRate * 100).toFixed(2)}%)`,
        value: metrics.errorRate,
        threshold: maxErrorRate,
        timestamp: new Date()
      });
    }

    // Check success rate
    const minSuccessRate = this.thresholds.get('min_success_rate') || 0.9;
    const successRate = metrics.totalRequests > 0 ? metrics.successfulRequests / metrics.totalRequests : 0;
    if (successRate < minSuccessRate) {
      alerts.push({
        agentId,
        agentType,
        alertType: 'low_success_rate',
        severity: this.getSeverity(minSuccessRate - successRate, 0),
        message: `Success rate (${(successRate * 100).toFixed(2)}%) below threshold (${(minSuccessRate * 100).toFixed(2)}%)`,
        value: successRate,
        threshold: minSuccessRate,
        timestamp: new Date()
      });
    }

    // Check resource usage
    const maxCpuUsage = this.thresholds.get('max_cpu_usage') || 80;
    if (metrics.resourceUsage.cpu > maxCpuUsage) {
      alerts.push({
        agentId,
        agentType,
        alertType: 'resource_usage',
        severity: this.getSeverity(metrics.resourceUsage.cpu, maxCpuUsage),
        message: `CPU usage (${metrics.resourceUsage.cpu.toFixed(2)}%) exceeds threshold (${maxCpuUsage}%)`,
        value: metrics.resourceUsage.cpu,
        threshold: maxCpuUsage,
        timestamp: new Date()
      });
    }

    const maxMemoryUsage = this.thresholds.get('max_memory_usage') || 80;
    if (metrics.resourceUsage.memory > maxMemoryUsage) {
      alerts.push({
        agentId,
        agentType,
        alertType: 'resource_usage',
        severity: this.getSeverity(metrics.resourceUsage.memory, maxMemoryUsage),
        message: `Memory usage (${metrics.resourceUsage.memory.toFixed(2)}%) exceeds threshold (${maxMemoryUsage}%)`,
        value: metrics.resourceUsage.memory,
        threshold: maxMemoryUsage,
        timestamp: new Date()
      });
    }

    // Add new alerts
    this.alerts.push(...alerts);

    // Keep only last 1000 alerts
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000);
    }

    // Log alerts
    for (const alert of alerts) {
      this.logger.warn(`Performance alert for agent ${agentId}: ${alert.message}`, {
        alertType: alert.alertType,
        severity: alert.severity,
        value: alert.value,
        threshold: alert.threshold
      });
    }
  }

  /**
   * Get severity level based on value vs threshold
   */
  private getSeverity(value: number, threshold: number): 'low' | 'medium' | 'high' | 'critical' {
    const ratio = value / threshold;

    if (ratio >= 2) return 'critical';
    if (ratio >= 1.5) return 'high';
    if (ratio >= 1.2) return 'medium';
    return 'low';
  }

  /**
   * Create empty metrics object
   */
  private createEmptyMetrics(): AgentMetrics {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      averageResponseTime: 0,
      userSatisfactionScore: 0,
      errorRate: 0,
      uptime: 0,
      concurrentSessions: 0,
      resourceUsage: {
        cpu: 0,
        memory: 0,
        tokens: 0
      }
    };
  }

  /**
   * Create empty analytics object
   */
  private createEmptyAnalytics(agentType: AgentType, hours: number): AgentAnalytics {
    return {
      agentId: agentType,
      agentType,
      period: this.getPeriodString(hours),
      metrics: {
        totalRequests: 0,
        averageResponseTime: 0,
        successRate: 0,
        errorRate: 0,
        providerUsage: {},
        modelUsage: {},
        costEstimate: 0,
        errorsByType: {}
      },
      timestamp: new Date()
    };
  }

  /**
   * Get period string for analytics
   */
  private getPeriodString(hours: number): string {
    if (hours === 1) return 'hourly';
    if (hours === 24) return 'daily';
    if (hours === 168) return 'weekly'; // 7 days
    if (hours === 720) return 'monthly'; // 30 days
    return 'custom';
  }

  /**
   * Calculate cost estimate based on token usage
   */
  private calculateCostEstimate(tokens: number): number {
    // Rough cost estimation - would use actual pricing from providers
    const averageCostPer1KTokens = 0.002; // $0.002 per 1K tokens
    return (tokens / 1000) * averageCostPer1KTokens;
  }

  /**
   * Get error breakdown from snapshots
   */
  private getErrorBreakdown(snapshots: MetricsSnapshot[]): Record<string, number> {
    // In a real implementation, this would track specific error types
    return {
      'network_error': 0,
      'llm_error': 0,
      'validation_error': 0,
      'timeout_error': 0,
      'unknown_error': 0
    };
  }
}