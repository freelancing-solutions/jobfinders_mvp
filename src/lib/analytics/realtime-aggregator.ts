// Real-Time Analytics Aggregator
// Real-time analytics calculations and aggregations for dashboard updates

import { EventEmitter } from 'events';
import { logger } from '../lib/logger';
import { EventType, EventPriority } from '../events';

export interface AggregationConfig {
  timeWindows: TimeWindow[];
  retentionPeriod: number; // hours
  enableCompression: boolean;
  enablePersistency: boolean;
  persistenceInterval: number; // seconds
}

export interface RealTimeMetric {
  id: string;
  name: string;
  type: MetricType;
  value: number;
  previousValue?: number;
  changePercent?: number;
  timestamp: Date;
  timeWindow: TimeWindow;
  metadata: Record<string, any>;
}

export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  RATE = 'rate',
  AVERAGE = 'average',
  PERCENTILE = 'percentile'
}

export enum TimeWindow {
  REAL_TIME = 'real_time',
  ONE_MINUTE = '1m',
  FIVE_MINUTES = '5m',
  FIFTEEN_MINUTES = '15m',
  ONE_HOUR = '1h',
  SIX_HOURS = '6h',
  ONE_DAY = '1d',
  ONE_WEEK = '1w'
}

export interface MetricDefinition {
  id: string;
  name: string;
  description: string;
  type: MetricType;
  eventType: EventType;
  valuePath?: string;
  aggregationFunction: AggregationFunction;
  timeWindows: TimeWindow[];
  tags?: string[];
  enabled: boolean;
}

export enum AggregationFunction {
  COUNT = 'count',
  SUM = 'sum',
  AVERAGE = 'average',
  MIN = 'min',
  MAX = 'max',
  RATE = 'rate',
  PERCENTILE = 'percentile',
  DISTINCT_COUNT = 'distinct_count'
}

export interface TimeSeriesDataPoint {
  timestamp: Date;
  value: number;
  metadata?: Record<string, any>;
}

export interface MetricTimeSeries {
  metricId: string;
  timeWindow: TimeWindow;
  data: TimeSeriesDataPoint[];
  lastUpdated: Date;
  compressionEnabled: boolean;
}

export class RealTimeAggregator extends EventEmitter {
  private config: AggregationConfig;
  private metrics = new Map<string, MetricDefinition>();
  private timeSeries = new Map<string, MetricTimeSeries>();
  private realTimeBuffers = new Map<string, TimeSeriesDataPoint[]>();
  private persistenceInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private aggregationLogger = logger.module('RealTimeAggregator');

  constructor(config?: Partial<AggregationConfig>) {
    super();

    this.config = {
      timeWindows: [
        TimeWindow.ONE_MINUTE,
        TimeWindow.FIVE_MINUTES,
        TimeWindow.FIFTEEN_MINUTES,
        TimeWindow.ONE_HOUR,
        TimeWindow.ONE_DAY
      ],
      retentionPeriod: 24 * 7, // 1 week
      enableCompression: true,
      enablePersistency: true,
      persistenceInterval: 60, // 1 minute
      ...config
    };

    this.initializeDefaultMetrics();
    this.startPersistenceTimer();
    this.startCleanupTimer();
  }

  // Initialize default metrics
  private initializeDefaultMetrics(): void {
    const defaultMetrics: MetricDefinition[] = [
      // Notification metrics
      {
        id: 'notifications_sent_total',
        name: 'Total Notifications Sent',
        description: 'Total number of notifications sent',
        type: MetricType.COUNTER,
        eventType: EventType.NOTIFICATION_SENT,
        aggregationFunction: AggregationFunction.COUNT,
        timeWindows: this.config.timeWindows,
        tags: ['notifications', 'total'],
        enabled: true
      },
      {
        id: 'notifications_delivered_total',
        name: 'Total Notifications Delivered',
        description: 'Total number of notifications delivered',
        type: MetricType.COUNTER,
        eventType: EventType.NOTIFICATION_DELIVERED,
        aggregationFunction: AggregationFunction.COUNT,
        timeWindows: this.config.timeWindows,
        tags: ['notifications', 'delivery'],
        enabled: true
      },
      {
        id: 'notifications_read_total',
        name: 'Total Notifications Read',
        description: 'Total number of notifications read',
        type: MetricType.COUNTER,
        eventType: EventType.NOTIFICATION_READ,
        aggregationFunction: AggregationFunction.COUNT,
        timeWindows: this.config.timeWindows,
        tags: ['notifications', 'engagement'],
        enabled: true
      },
      {
        id: 'notification_delivery_rate',
        name: 'Notification Delivery Rate',
        description: 'Percentage of notifications successfully delivered',
        type: MetricType.RATE,
        eventType: EventType.NOTIFICATION_CREATED,
        aggregationFunction: AggregationFunction.RATE,
        timeWindows: this.config.timeWindows,
        tags: ['notifications', 'rate', 'delivery'],
        enabled: true
      },
      {
        id: 'notification_read_rate',
        name: 'Notification Read Rate',
        description: 'Percentage of delivered notifications that were read',
        type: MetricType.RATE,
        eventType: EventType.NOTIFICATION_DELIVERED,
        aggregationFunction: AggregationFunction.RATE,
        timeWindows: this.config.timeWindows,
        tags: ['notifications', 'rate', 'engagement'],
        enabled: true
      },

      // Application metrics
      {
        id: 'applications_submitted_total',
        name: 'Total Applications Submitted',
        description: 'Total number of job applications submitted',
        type: MetricType.COUNTER,
        eventType: EventType.APPLICATION_SUBMITTED,
        aggregationFunction: AggregationFunction.COUNT,
        timeWindows: this.config.timeWindows,
        tags: ['applications', 'total'],
        enabled: true
      },
      {
        id: 'application_conversion_rate',
        name: 'Application Conversion Rate',
        description: 'Rate of successful applications',
        type: MetricType.RATE,
        eventType: EventType.APPLICATION_SUBMITTED,
        aggregationFunction: AggregationFunction.RATE,
        timeWindows: this.config.timeWindows,
        tags: ['applications', 'rate', 'conversion'],
        enabled: true
      },

      // Match metrics
      {
        id: 'matches_created_total',
        name: 'Total Matches Created',
        description: 'Total number of candidate-job matches created',
        type: MetricType.COUNTER,
        eventType: EventType.MATCH_CREATED,
        aggregationFunction: AggregationFunction.COUNT,
        timeWindows: this.config.timeWindows,
        tags: ['matches', 'total'],
        enabled: true
      },
      {
        id: 'match_average_score',
        name: 'Average Match Score',
        description: 'Average score of all matches',
        type: MetricType.AVERAGE,
        eventType: EventType.MATCH_CREATED,
        valuePath: 'payload.score',
        aggregationFunction: AggregationFunction.AVERAGE,
        timeWindows: this.config.timeWindows,
        tags: ['matches', 'quality', 'average'],
        enabled: true
      },
      {
        id: 'high_quality_matches_total',
        name: 'High Quality Matches',
        description: 'Number of matches with score > 0.8',
        type: MetricType.COUNTER,
        eventType: EventType.MATCH_CREATED,
        aggregationFunction: AggregationFunction.COUNT,
        timeWindows: this.config.timeWindows,
        tags: ['matches', 'high_quality'],
        enabled: true
      },

      // User metrics
      {
        id: 'users_registered_total',
        name: 'Total Users Registered',
        description: 'Total number of registered users',
        type: MetricType.COUNTER,
        eventType: EventType.USER_REGISTERED,
        aggregationFunction: AggregationFunction.COUNT,
        timeWindows: this.config.timeWindows,
        tags: ['users', 'registration', 'total'],
        enabled: true
      },
      {
        id: 'user_profile_updates_total',
        name: 'User Profile Updates',
        description: 'Total number of user profile updates',
        type: MetricType.COUNTER,
        eventType: EventType.USER_PROFILE_UPDATED,
        aggregationFunction: AggregationFunction.COUNT,
        timeWindows: this.config.timeWindows,
        tags: ['users', 'profile', 'updates'],
        enabled: true
      },

      // Recommendation metrics
      {
        id: 'recommendations_generated_total',
        name: 'Total Recommendations Generated',
        description: 'Total number of recommendations generated',
        type: MetricType.COUNTER,
        eventType: EventType.RECOMMENDATION_GENERATED,
        aggregationFunction: AggregationFunction.COUNT,
        timeWindows: this.config.timeWindows,
        tags: ['recommendations', 'total'],
        enabled: true
      },
      {
        id: 'recommendation_click_rate',
        name: 'Recommendation Click Rate',
        description: 'Percentage of recommendations that were clicked',
        type: MetricType.RATE,
        eventType: EventType.RECOMMENDATION_GENERATED,
        aggregationFunction: AggregationFunction.RATE,
        timeWindows: this.config.timeWindows,
        tags: ['recommendations', 'rate', 'engagement'],
        enabled: true
      }
    ];

    for (const metric of defaultMetrics) {
      this.addMetric(metric);
    }

    this.aggregationLogger.info('Default metrics initialized', {
      count: defaultMetrics.length
    });
  }

  // Add new metric definition
  addMetric(definition: MetricDefinition): void {
    this.metrics.set(definition.id, definition);

    // Initialize time series for each time window
    for (const timeWindow of definition.timeWindows) {
      const seriesKey = `${definition.id}:${timeWindow}`;
      this.timeSeries.set(seriesKey, {
        metricId: definition.id,
        timeWindow,
        data: [],
        lastUpdated: new Date(),
        compressionEnabled: this.config.enableCompression
      });

      // Initialize real-time buffer
      if (timeWindow === TimeWindow.REAL_TIME) {
        this.realTimeBuffers.set(definition.id, []);
      }
    }

    this.aggregationLogger.info('Metric added', {
      metricId: definition.id,
      name: definition.name,
      type: definition.type
    });
  }

  // Remove metric definition
  removeMetric(metricId: string): void {
    this.metrics.delete(metricId);

    // Remove associated time series
    const keysToDelete = Array.from(this.timeSeries.keys())
      .filter(key => key.startsWith(`${metricId}:`));

    for (const key of keysToDelete) {
      this.timeSeries.delete(key);
    }

    // Remove real-time buffer
    this.realTimeBuffers.delete(metricId);

    this.aggregationLogger.info('Metric removed', { metricId });
  }

  // Process event and update metrics
  async processEvent(event: any): Promise<RealTimeMetric[]> {
    const updatedMetrics: RealTimeMetric[] = [];
    const timestamp = new Date();

    for (const [metricId, definition] of this.metrics.entries()) {
      if (!definition.enabled) continue;
      if (definition.eventType !== event.type) continue;

      try {
        const metricValue = this.extractMetricValue(event, definition);

        if (metricValue !== null && metricValue !== undefined) {
          const metric = await this.updateMetric(definition, metricValue, timestamp, event);
          updatedMetrics.push(metric);
        }
      } catch (error) {
        this.aggregationLogger.error('Failed to update metric', {
          metricId,
          error: error.message,
          eventType: event.type
        });
      }
    }

    if (updatedMetrics.length > 0) {
      this.emit('metricsUpdated', updatedMetrics);
    }

    return updatedMetrics;
  }

  // Extract value from event based on metric definition
  private extractMetricValue(event: any, definition: MetricDefinition): number | null {
    switch (definition.aggregationFunction) {
      case AggregationFunction.COUNT:
        return 1; // Each event counts as 1

      case AggregationFunction.SUM:
        return this.extractValueByPath(event, definition.valuePath) || 0;

      case AggregationFunction.AVERAGE:
        return this.extractValueByPath(event, definition.valuePath) || 0;

      case AggregationFunction.MIN:
        return this.extractValueByPath(event, definition.valuePath) || 0;

      case AggregationFunction.MAX:
        return this.extractValueByPath(event, definition.valuePath) || 0;

      case AggregationFunction.RATE:
        // Rate is calculated differently in updateMetric
        return 1;

      case AggregationFunction.PERCENTILE:
        return this.extractValueByPath(event, definition.valuePath) || 0;

      case AggregationFunction.DISTINCT_COUNT:
        return event.userId ? 1 : 0; // Count unique users

      default:
        return null;
    }
  }

  // Extract value from object path
  private extractValueByPath(obj: any, path?: string): number | null {
    if (!path) return null;

    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  }

  // Update metric value
  private async updateMetric(
    definition: MetricDefinition,
    value: number,
    timestamp: Date,
    event: any
  ): Promise<RealTimeMetric> {
    const metrics: RealTimeMetric[] = [];

    for (const timeWindow of definition.timeWindows) {
      const seriesKey = `${definition.id}:${timeWindow}`;
      const series = this.timeSeries.get(seriesKey);

      if (!series) continue;

      let calculatedValue: number;
      let previousValue: number | undefined;

      // Get previous value for calculating change
      if (series.data.length > 0) {
        previousValue = series.data[series.data.length - 1].value;
      }

      // Calculate value based on aggregation function
      switch (definition.aggregationFunction) {
        case AggregationFunction.COUNT:
          calculatedValue = previousValue ? previousValue + 1 : 1;
          break;

        case AggregationFunction.SUM:
          calculatedValue = previousValue ? previousValue + value : value;
          break;

        case AggregationFunction.AVERAGE:
          calculatedValue = this.calculateRollingAverage(series, value);
          break;

        case AggregationFunction.MIN:
          calculatedValue = previousValue ? Math.min(previousValue, value) : value;
          break;

        case AggregationFunction.MAX:
          calculatedValue = previousValue ? Math.max(previousValue, value) : value;
          break;

        case AggregationFunction.RATE:
          calculatedValue = this.calculateRate(series, event, timeWindow);
          break;

        case AggregationFunction.PERCENTILE:
          calculatedValue = this.calculatePercentile(series, value, 95);
          break;

        case AggregationFunction.DISTINCT_COUNT:
          calculatedValue = this.calculateDistinctCount(series, event.userId);
          break;

        default:
          calculatedValue = value;
      }

      // Create data point
      const dataPoint: TimeSeriesDataPoint = {
        timestamp,
        value: calculatedValue,
        metadata: {
          eventType: event.type,
          userId: event.userId,
          eventId: event.id
        }
      };

      // Add to series
      series.data.push(dataPoint);
      series.lastUpdated = timestamp;

      // Maintain window size
      this.maintainWindowSize(series, timeWindow);

      // Create metric object
      const metric: RealTimeMetric = {
        id: `${definition.id}:${timeWindow}`,
        name: `${definition.name} (${timeWindow})`,
        type: definition.type,
        value: calculatedValue,
        previousValue,
        changePercent: previousValue ? ((calculatedValue - previousValue) / previousValue) * 100 : 0,
        timestamp,
        timeWindow,
        metadata: {
          definition: definition,
          tags: definition.tags,
          eventId: event.id
        }
      };

      metrics.push(metric);

      // Add to real-time buffer
      if (timeWindow === TimeWindow.REAL_TIME) {
        const buffer = this.realTimeBuffers.get(definition.id);
        if (buffer) {
          buffer.push(dataPoint);
          // Maintain buffer size
          if (buffer.length > 1000) {
            buffer.splice(0, buffer.length - 1000);
          }
        }
      }
    }

    // Return the primary metric (usually the shortest time window)
    return metrics[0] || metrics.find(m => m.timeWindow === TimeWindow.REAL_TIME) || metrics[0];
  }

  // Calculate rolling average
  private calculateRollingAverage(series: MetricTimeSeries, newValue: number): number {
    const windowSize = this.getWindowSize(series.timeWindow);
    const recentValues = series.data.slice(-windowSize).map(dp => dp.value);
    recentValues.push(newValue);
    return recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;
  }

  // Calculate rate
  private calculateRate(series: MetricTimeSeries, event: any, timeWindow: TimeWindow): number {
    const windowSizeMs = this.getTimeWindowMs(timeWindow);
    const now = Date.now();

    // Count events in the window
    const eventsInWindow = series.data.filter(dp =>
      (now - dp.timestamp.getTime()) <= windowSizeMs
    ).length;

    // Convert to rate per second
    return (eventsInWindow / windowSizeMs) * 1000;
  }

  // Calculate percentile
  private calculatePercentile(series: MetricTimeSeries, newValue: number, percentile: number): number {
    const windowSize = this.getWindowSize(series.timeWindow);
    const values = series.data.slice(-windowSize).map(dp => dp.value);
    values.push(newValue);
    values.sort((a, b) => a - b);

    const index = Math.ceil((percentile / 100) * values.length) - 1;
    return values[Math.max(0, index)];
  }

  // Calculate distinct count
  private calculateDistinctCount(series: MetricTimeSeries, userId?: string): number {
    const windowSize = this.getWindowSize(series.timeWindow);
    const recentEvents = series.data.slice(-windowSize);

    const uniqueUsers = new Set(recentEvents.map(dp => dp.metadata?.userId).filter(Boolean));
    if (userId) {
      uniqueUsers.add(userId);
    }

    return uniqueUsers.size;
  }

  // Get window size in data points
  private getWindowSize(timeWindow: TimeWindow): number {
    switch (timeWindow) {
      case TimeWindow.REAL_TIME: return 1000;
      case TimeWindow.ONE_MINUTE: return 60;
      case TimeWindow.FIVE_MINUTES: return 300;
      case TimeWindow.FIFTEEN_MINUTES: return 900;
      case TimeWindow.ONE_HOUR: return 3600;
      case TimeWindow.SIX_HOURS: return 21600;
      case TimeWindow.ONE_DAY: return 86400;
      case TimeWindow.ONE_WEEK: return 604800;
      default: return 100;
    }
  }

  // Get time window in milliseconds
  private getTimeWindowMs(timeWindow: TimeWindow): number {
    switch (timeWindow) {
      case TimeWindow.REAL_TIME: return 5000; // 5 seconds
      case TimeWindow.ONE_MINUTE: return 60000;
      case TimeWindow.FIVE_MINUTES: return 300000;
      case TimeWindow.FIFTEEN_MINUTES: return 900000;
      case TimeWindow.ONE_HOUR: return 3600000;
      case TimeWindow.SIX_HOURS: return 21600000;
      case TimeWindow.ONE_DAY: return 86400000;
      case TimeWindow.ONE_WEEK: return 604800000;
      default: return 60000;
    }
  }

  // Maintain window size
  private maintainWindowSize(series: MetricTimeSeries, timeWindow: TimeWindow): void {
    const windowSizeMs = this.getTimeWindowMs(timeWindow);
    const now = Date.now();
    const cutoffTime = new Date(now - windowSizeMs);

    // Remove old data points
    series.data = series.data.filter(dp => dp.timestamp >= cutoffTime);

    // Apply compression if enabled and data is old
    if (this.config.enableCompression && series.compressionEnabled) {
      this.compressTimeSeries(series);
    }
  }

  // Compress time series data
  private compressTimeSeries(series: MetricTimeSeries): void {
    const now = Date.now();
    const compressionThreshold = this.getTimeWindowMs(series.timeWindow) * 2;

    // Compress data older than 2x the window size
    series.data = series.data.map(dp => {
      if ((now - dp.timestamp.getTime()) > compressionThreshold) {
        return {
          ...dp,
          compressed: true,
          // Downsample by keeping only every nth point
          downsampled: true
        };
      }
      return dp;
    });
  }

  // Get metric value
  getMetricValue(metricId: string, timeWindow: TimeWindow): RealTimeMetric | null {
    const seriesKey = `${metricId}:${timeWindow}`;
    const series = this.timeSeries.get(seriesKey);

    if (!series || series.data.length === 0) {
      return null;
    }

    const definition = this.metrics.get(metricId);
    if (!definition) return null;

    const latestDataPoint = series.data[series.data.length - 1];

    return {
      id: seriesKey,
      name: `${definition.name} (${timeWindow})`,
      type: definition.type,
      value: latestDataPoint.value,
      timestamp: latestDataPoint.timestamp,
      timeWindow,
      metadata: {
        definition: definition,
        tags: definition.tags,
        dataPoints: series.data.length
      }
    };
  }

  // Get time series data
  getTimeSeries(metricId: string, timeWindow: TimeWindow, limit?: number): TimeSeriesDataPoint[] {
    const seriesKey = `${metricId}:${timeWindow}`;
    const series = this.timeSeries.get(seriesKey);

    if (!series) {
      return [];
    }

    const data = series.data.slice();
    if (limit) {
      return data.slice(-limit);
    }

    return data;
  }

  // Get real-time data
  getRealTimeData(metricId: string, limit?: number): TimeSeriesDataPoint[] {
    const buffer = this.realTimeBuffers.get(metricId);
    if (!buffer) {
      return [];
    }

    const data = buffer.slice();
    if (limit) {
      return data.slice(-limit);
    }

    return data;
  }

  // Get all metrics for a time window
  getMetricsForTimeWindow(timeWindow: TimeWindow): RealTimeMetric[] {
    const metrics: RealTimeMetric[] = [];

    for (const [metricId, definition] of this.metrics.entries()) {
      if (!definition.enabled) continue;
      if (!definition.timeWindows.includes(timeWindow)) continue;

      const metric = this.getMetricValue(metricId, timeWindow);
      if (metric) {
        metrics.push(metric);
      }
    }

    return metrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Get metrics by tags
  getMetricsByTag(tag: string, timeWindow?: TimeWindow): RealTimeMetric[] {
    const metrics: RealTimeMetric[] = [];

    for (const [metricId, definition] of this.metrics.entries()) {
      if (!definition.enabled) continue;
      if (!definition.tags?.includes(tag)) continue;

      if (timeWindow) {
        if (!definition.timeWindows.includes(timeWindow)) continue;
        const metric = this.getMetricValue(metricId, timeWindow);
        if (metric) {
          metrics.push(metric);
        }
      } else {
        // Get all time windows for this metric
        for (const tw of definition.timeWindows) {
          const metric = this.getMetricValue(metricId, tw);
          if (metric) {
            metrics.push(metric);
          }
        }
      }
    }

    return metrics;
  }

  // Get metric definitions
  getMetricDefinitions(): MetricDefinition[] {
    return Array.from(this.metrics.values());
  }

  // Get aggregation statistics
  getAggregationStats(): {
    totalMetrics: number;
    enabledMetrics: number;
    timeSeriesCount: number;
    realTimeBuffersCount: number;
    memoryUsage: {
      timeSeriesDataPoints: number;
      realTimeDataPoints: number;
    };
  } {
    const totalMetrics = this.metrics.size;
    const enabledMetrics = Array.from(this.metrics.values()).filter(m => m.enabled).length;
    const timeSeriesCount = this.timeSeries.size;
    const realTimeBuffersCount = this.realTimeBuffers.size;

    let timeSeriesDataPoints = 0;
    let realTimeDataPoints = 0;

    for (const series of this.timeSeries.values()) {
      timeSeriesDataPoints += series.data.length;
    }

    for (const buffer of this.realTimeBuffers.values()) {
      realTimeDataPoints += buffer.length;
    }

    return {
      totalMetrics,
      enabledMetrics,
      timeSeriesCount,
      realTimeBuffersCount,
      memoryUsage: {
        timeSeriesDataPoints,
        realTimeDataPoints
      }
    };
  }

  // Start persistence timer
  private startPersistenceTimer(): void {
    if (!this.config.enablePersistency) return;

    this.persistenceInterval = setInterval(async () => {
      await this.persistMetrics();
    }, this.config.persistenceInterval * 1000);
  }

  // Start cleanup timer
  private startCleanupTimer(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Every minute
  }

  // Persist metrics
  private async persistMetrics(): Promise<void> {
    try {
      // Implementation would persist metrics to database
      this.aggregationLogger.debug('Metrics persisted', {
        timeSeriesCount: this.timeSeries.size,
        stats: this.getAggregationStats()
      });
    } catch (error) {
      this.aggregationLogger.error('Failed to persist metrics', error);
    }
  }

  // Cleanup old data
  private cleanup(): void {
    try {
      const cutoffTime = new Date(Date.now() - (this.config.retentionPeriod * 60 * 60 * 1000));
      let removedCount = 0;

      for (const [key, series] of this.timeSeries.entries()) {
        const originalLength = series.data.length;
        series.data = series.data.filter(dp => dp.timestamp >= cutoffTime);
        removedCount += originalLength - series.data.length;
      }

      if (removedCount > 0) {
        this.aggregationLogger.debug('Old data cleaned up', {
          removedDataPoints: removedCount,
          cutoffTime: cutoffTime.toISOString()
        });
      }
    } catch (error) {
      this.aggregationLogger.error('Failed to cleanup old data', error);
    }
  }

  // Shutdown
  async shutdown(): Promise<void> {
    this.aggregationLogger.info('Shutting down real-time aggregator...');

    if (this.persistenceInterval) {
      clearInterval(this.persistenceInterval);
      this.persistenceInterval = null;
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Final persistence
    if (this.config.enablePersistency) {
      await this.persistMetrics();
    }

    // Clear data
    this.metrics.clear();
    this.timeSeries.clear();
    this.realTimeBuffers.clear();

    this.removeAllListeners();

    this.aggregationLogger.info('Real-time aggregator shutdown complete');
  }
}

export default RealTimeAggregator;