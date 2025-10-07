// Real-Time Stream Processing
// Event ingestion and stream processing for analytics

import { EventEmitter } from 'events';
import { eventBus, EventType, EventPriority } from '../events';
import { EventPersistence } from '../events/event-persistence';
import { logger } from '../lib/logger';

const streamLogger = logger.module('StreamProcessor');

export interface StreamProcessorConfig {
  batchSize: number;
  batchTimeout: number; // milliseconds
  maxRetries: number;
  retryDelay: number;
  enableBackpressure: boolean;
  backpressureThreshold: number;
  enableDeadLetterQueue: boolean;
  enableMetrics: boolean;
  metricsInterval: number;
}

export interface StreamEvent {
  id: string;
  type: EventType;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  payload: any;
  metadata: {
    source: string;
    priority: EventPriority;
    correlationId?: string;
    version: string;
  };
  processing: {
    attempts: number;
    lastAttempt: Date;
    nextRetry?: Date;
    errors: ProcessingError[];
    status: ProcessingStatus;
  };
}

export enum ProcessingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  RETRYING = 'retrying',
  DEAD_LETTER = 'dead_letter'
}

export interface ProcessingError {
  timestamp: Date;
  error: string;
  stack?: string;
  retryable: boolean;
}

export interface StreamMetrics {
  totalEvents: number;
  processedEvents: number;
  failedEvents: number;
  deadLetterEvents: number;
  averageProcessingTime: number;
  eventsPerSecond: number;
  batchSize: number;
  queueSize: number;
  backpressureActive: boolean;
  uptime: number;
  lastProcessed: Date;
}

export interface AggregationRule {
  id: string;
  name: string;
  eventType: EventType;
  aggregationType: AggregationType;
  timeWindow: TimeWindow;
  groupBy?: string[];
  filters?: EventFilter[];
  outputFormat: OutputFormat;
  destination: string;
  enabled: boolean;
}

export enum AggregationType {
  COUNT = 'count',
  SUM = 'sum',
  AVERAGE = 'average',
  MIN = 'min',
  MAX = 'max',
  DISTINCT_COUNT = 'distinct_count',
  PERCENTILE = 'percentile'
}

export enum TimeWindow {
  MINUTE = '1m',
  FIVE_MINUTES = '5m',
  FIFTEEN_MINUTES = '15m',
  HOUR = '1h',
  DAY = '1d',
  WEEK = '1w',
  MONTH = '1m'
}

export interface EventFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'exists';
  value: any;
}

export enum OutputFormat {
  JSON = 'json',
  CSV = 'csv',
  PARQUET = 'parquet',
  AVRO = 'avro'
}

export class StreamProcessor extends EventEmitter {
  private config: StreamProcessorConfig;
  private eventQueue: StreamEvent[] = [];
  private processingQueue: Promise<void> = Promise.resolve();
  private aggregationRules = new Map<string, AggregationRule>();
  private deadLetterQueue: StreamEvent[] = [];
  private metrics: StreamMetrics;
  private startTime: Date;
  private batchTimer: NodeJS.Timeout | null = null;
  private metricsInterval: NodeJS.Timeout | null = null;
  private persistence: EventPersistence;

  constructor(
    persistence: EventPersistence,
    config?: Partial<StreamProcessorConfig>
  ) {
    super();
    this.persistence = persistence;
    this.startTime = new Date();

    this.config = {
      batchSize: 100,
      batchTimeout: 5000, // 5 seconds
      maxRetries: 3,
      retryDelay: 1000,
      enableBackpressure: true,
      backpressureThreshold: 10000,
      enableDeadLetterQueue: true,
      enableMetrics: true,
      metricsInterval: 30000, // 30 seconds
      ...config
    };

    this.metrics = {
      totalEvents: 0,
      processedEvents: 0,
      failedEvents: 0,
      deadLetterEvents: 0,
      averageProcessingTime: 0,
      eventsPerSecond: 0,
      batchSize: 0,
      queueSize: 0,
      backpressureActive: false,
      uptime: 0,
      lastProcessed: new Date()
    };

    this.setupEventBusIntegration();
    this.startMetricsCollection();
  }

  // Event ingestion
  async ingestEvent(eventData: any): Promise<void> {
    try {
      const streamEvent: StreamEvent = {
        id: this.generateEventId(),
        type: eventData.type,
        timestamp: eventData.timestamp || new Date(),
        userId: eventData.userId,
        sessionId: eventData.sessionId,
        payload: eventData.payload,
        metadata: {
          source: eventData.source || 'unknown',
          priority: eventData.priority || EventPriority.NORMAL,
          correlationId: eventData.correlationId,
          version: '1.0'
        },
        processing: {
          attempts: 0,
          lastAttempt: new Date(),
          errors: [],
          status: ProcessingStatus.PENDING
        }
      };

      // Check backpressure
      if (this.config.enableBackpressure && this.isBackpressureActive()) {
        await this.handleBackpressure(streamEvent);
        return;
      }

      this.eventQueue.push(streamEvent);
      this.metrics.totalEvents++;
      this.metrics.queueSize = this.eventQueue.length;

      // Start batch processing if needed
      this.scheduleBatchProcessing();

      this.emit('eventIngested', streamEvent);

      streamLogger.debug('Event ingested', {
        eventId: streamEvent.id,
        type: streamEvent.type,
        queueSize: this.eventQueue.length
      });

    } catch (error) {
      streamLogger.error('Failed to ingest event:', error);
      this.metrics.failedEvents++;
      throw error;
    }
  }

  async ingestBatch(events: any[]): Promise<void> {
    try {
      const batchSize = Math.min(events.length, this.config.batchSize);
      const batch = events.slice(0, batchSize);

      for (const eventData of batch) {
        await this.ingestEvent(eventData);
      }

      logger.info(`Batch ingestion completed`, {
        batchSize: batch.length,
        queueSize: this.eventQueue.length
      });

    } catch (error) {
      logger.error('Failed to ingest batch:', error);
      throw error;
    }
  }

  // Batch processing
  private async processBatch(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }

    const batch = this.eventQueue.splice(0, this.config.batchSize);
    this.metrics.batchSize = batch.length;

    try {
      const startTime = Date.now();

      // Process events in parallel
      const processingPromises = batch.map(event => this.processEvent(event));
      await Promise.allSettled(processingPromises);

      const processingTime = Date.now() - startTime;
      this.updateProcessingMetrics(processingTime, batch.length);

      // Apply aggregations
      await this.applyAggregations(batch);

      // Persist events
      await this.persistBatch(batch);

      this.metrics.lastProcessed = new Date();
      this.metrics.queueSize = this.eventQueue.length;

      logger.debug('Batch processed', {
        batchSize: batch.length,
        processingTime,
        queueSize: this.eventQueue.length
      });

      this.emit('batchProcessed', {
        batchSize: batch.length,
        processingTime,
        queueSize: this.eventQueue.length
      });

    } catch (error) {
      logger.error('Batch processing failed:', error);
      this.handleBatchError(batch, error);
    }
  }

  private async processEvent(event: StreamEvent): Promise<void> {
    try {
      event.processing.status = ProcessingStatus.PROCESSING;
      event.processing.attempts++;
      event.processing.lastAttempt = new Date();

      // Validate event
      this.validateEvent(event);

      // Transform event
      const transformedEvent = await this.transformEvent(event);

      // Apply business logic
      await this.applyBusinessLogic(transformedEvent);

      event.processing.status = ProcessingStatus.COMPLETED;
      this.metrics.processedEvents++;

      this.emit('eventProcessed', event);

    } catch (error) {
      this.handleEventError(event, error);
    }
  }

  // Event validation
  private validateEvent(event: StreamEvent): void {
    if (!event.id || !event.type || !event.timestamp) {
      throw new Error('Invalid event: missing required fields');
    }

    if (!Object.values(EventType).includes(event.type)) {
      throw new Error(`Invalid event type: ${event.type}`);
    }

    if (event.timestamp > new Date()) {
      throw new Error('Event timestamp cannot be in the future');
    }
  }

  // Event transformation
  private async transformEvent(event: StreamEvent): Promise<StreamEvent> {
    // Add enrichment data
    const enrichedEvent = { ...event };

    // Add timestamp fields
    enrichedEvent.metadata.processedAt = new Date();

    // Add geolocation data if available
    if (event.payload.location) {
      enrichedEvent.metadata.geolocation = await this.enrichGeolocation(event.payload.location);
    }

    // Add user agent analysis
    if (event.metadata.userAgent) {
      enrichedEvent.metadata.deviceInfo = this.parseUserAgent(event.metadata.userAgent);
    }

    return enrichedEvent;
  }

  // Business logic application
  private async applyBusinessLogic(event: StreamEvent): Promise<void> {
    switch (event.type) {
      case EventType.APPLICATION_SUBMITTED:
        await this.processApplicationEvent(event);
        break;

      case.EventType.MATCH_CREATED:
        await this.processMatchEvent(event);
        break;

      case EventType.NOTIFICATION_CREATED:
        await this.processNotificationEvent(event);
        break;

      case EventType.USER_REGISTERED:
        await this.processUserEvent(event);
        break;

      default:
        // Default processing for other event types
        await this.processGenericEvent(event);
    }
  }

  // Specific event processors
  private async processApplicationEvent(event: StreamEvent): Promise<void> {
    const { jobId, jobSeekerProfileId } = event.payload;

    // Update job application counts
    await this.updateJobApplicationCount(jobId);

    // Trigger matching updates
    await this.triggerCandidateMatching(jobSeekerProfileId);

    // Update analytics
    await this.updateApplicationAnalytics(event);
  }

  private async processMatchEvent(event: StreamEvent): Promise<void> {
    const { candidateId, jobId, score } = event.payload;

    // Update matching analytics
    await this.updateMatchingAnalytics(event);

    // Trigger notification if high-quality match
    if (score > 0.8) {
      await this.triggerHighValueMatchNotification(event);
    }
  }

  private async processNotificationEvent(event: StreamEvent): Promise<void> {
    const { userId, type, channel } = event.payload;

    // Update notification analytics
    await this.updateNotificationAnalytics(event);

    // Track delivery
    await this.trackNotificationDelivery(event);
  }

  private async processUserEvent(event: StreamEvent): Promise<void> {
    const { userId, role } = event.payload;

    // Update user analytics
    await this.updateUserAnalytics(event);

    // Trigger onboarding flow
    await this.triggerOnboardingFlow(userId, role);
  }

  private async processGenericEvent(event: StreamEvent): Promise<void> {
    // Default processing for generic events
    await this.updateGenericAnalytics(event);
  }

  // Aggregation rules
  addAggregationRule(rule: AggregationRule): void {
    this.aggregationRules.set(rule.id, rule);
    logger.info('Aggregation rule added', { ruleId: rule.id, name: rule.name });
  }

  removeAggregationRule(ruleId: string): void {
    this.aggregationRules.delete(ruleId);
    logger.info('Aggregation rule removed', { ruleId });
  }

  getAggregationRules(): AggregationRule[] {
    return Array.from(this.aggregationRules.values());
  }

  private async applyAggregations(events: StreamEvent[]): Promise<void> {
    for (const rule of this.aggregationRules.values()) {
      if (!rule.enabled) continue;

      try {
        const filteredEvents = this.filterEventsForRule(events, rule);
        if (filteredEvents.length === 0) continue;

        const aggregationResult = await this.calculateAggregation(filteredEvents, rule);
        await this.outputAggregationResult(rule, aggregationResult);

      } catch (error) {
        logger.error('Aggregation rule failed', { ruleId: rule.id, error });
      }
    }
  }

  private filterEventsForRule(events: StreamEvent[], rule: AggregationRule): StreamEvent[] {
    return events.filter(event => {
      // Filter by event type
      if (event.type !== rule.eventType) return false;

      // Apply custom filters
      if (rule.filters) {
        for (const filter of rule.filters) {
          if (!this.applyEventFilter(event, filter)) {
            return false;
          }
        }
      }

      return true;
    });
  }

  private applyEventFilter(event: StreamEvent, filter: EventFilter): boolean {
    const value = this.getNestedValue(event, filter.field);

    switch (filter.operator) {
      case 'eq':
        return value === filter.value;
      case 'ne':
        return value !== filter.value;
      case 'gt':
        return value > filter.value;
      case 'gte':
        return value >= filter.value;
      case 'lt':
        return value < filter.value;
      case 'lte':
        return value <= filter.value;
      case 'in':
        return Array.isArray(filter.value) && filter.value.includes(value);
      case 'nin':
        return Array.isArray(filter.value) && !filter.value.includes(value);
      case 'exists':
        return value !== undefined && value !== null;
      default:
        return true;
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private async calculateAggregation(events: StreamEvent[], rule: AggregationRule): Promise<any> {
    const values = events.map(event => this.extractAggregationValue(event, rule));

    switch (rule.aggregationType) {
      case AggregationType.COUNT:
        return events.length;

      case AggregationType.SUM:
        return values.reduce((sum, val) => sum + (val || 0), 0);

      case AggregationType.AVERAGE:
        return values.reduce((sum, val) => sum + (val || 0), 0) / values.length;

      case AggregationType.MIN:
        return Math.min(...values.filter(val => val !== undefined));

      case AggregationType.MAX:
        return Math.max(...values.filter(val => val !== undefined));

      case AggregationType.DISTINCT_COUNT:
        return new Set(events.map(e => e.userId)).size;

      case AggregationType.PERCENTILE:
        // Simple percentile calculation (95th percentile)
        const sorted = values.sort((a, b) => a - b);
        const index = Math.floor(sorted.length * 0.95);
        return sorted[index];

      default:
        return null;
    }
  }

  private extractAggregationValue(event: StreamEvent, rule: AggregationRule): number {
    // Extract value based on aggregation configuration
    switch (rule.eventType) {
      case EventType.APPLICATION_SUBMITTED:
        return event.payload.matchScore || 0;

      case EventType.MATCH_CREATED:
        return event.payload.score || 0;

      default:
        return 1; // Default to count
    }
  }

  private async outputAggregationResult(rule: AggregationRule, result: any): Promise<void> {
    const output = {
      ruleId: rule.id,
      ruleName: rule.name,
      aggregationType: rule.aggregationType,
      timeWindow: rule.timeWindow,
      result,
      timestamp: new Date(),
      eventCount: result.count || 1
    };

    this.emit('aggregationResult', output);

    // Store result based on destination
    if (rule.destination === 'database') {
      await this.persistAggregationResult(output);
    } else if (rule.destination === 'websocket') {
      this.broadcastAggregationResult(output);
    }

    logger.debug('Aggregation result', output);
  }

  // Error handling
  private handleEventError(event: StreamEvent, error: Error): void {
    const processingError: ProcessingError = {
      timestamp: new Date(),
      error: error.message,
      stack: error.stack,
      retryable: this.isRetryableError(error)
    };

    event.processing.errors.push(processingError);

    if (processingError.retryable && event.processing.attempts < this.config.maxRetries) {
      event.processing.status = ProcessingStatus.RETRYING;
      event.processing.nextRetry = new Date(Date.now() + this.config.retryDelay);
      this.eventQueue.push(event); // Re-queue for retry
    } else {
      event.processing.status = ProcessingStatus.FAILED;
      this.metrics.failedEvents++;

      if (this.config.enableDeadLetterQueue) {
        this.deadLetterQueue.push(event);
        this.metrics.deadLetterEvents++;
      }
    }

    this.emit('eventError', { event, error });
    logger.error('Event processing failed', {
      eventId: event.id,
      error: error.message,
      attempts: event.processing.attempts
    });
  }

  private handleBatchError(batch: StreamEvent[], error: Error): void {
    // Re-queue the entire batch for retry
    for (const event of batch) {
      this.handleEventError(event, error);
    }

    this.emit('batchError', { batch, error });
  }

  private isRetryableError(error: Error): boolean {
    // Define which errors are retryable
    const retryableErrors = [
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'ECONNREFUSED'
    ];

    return retryableErrors.some(code => error.message.includes(code));
  }

  // Backpressure handling
  private isBackpressureActive(): boolean {
    return this.eventQueue.length > this.config.backpressureThreshold;
  }

  private async handleBackpressure(event: StreamEvent): Promise<void> {
    logger.warn('Backpressure active', {
      queueSize: this.eventQueue.length,
      threshold: this.config.backpressureThreshold
    });

    // Drop oldest events if queue is too large
    if (this.eventQueue.length > this.config.backpressureThreshold * 2) {
      const droppedEvents = this.eventQueue.splice(0, this.eventQueue.length - this.config.backpressureThreshold);

      for (const droppedEvent of droppedEvents) {
        droppedEvent.processing.status = ProcessingStatus.DEAD_LETTER;
        this.deadLetterQueue.push(droppedEvent);
        this.metrics.deadLetterEvents++;
      }

      logger.warn('Events dropped due to backpressure', {
        droppedCount: droppedEvents.length
      });
    }

    // Emit backpressure event
    this.emit('backpressure', {
      queueSize: this.eventQueue.length,
      threshold: this.config.backpressureThreshold,
      droppedEvents: this.deadLetterQueue.length
    });
  }

  // Metrics and monitoring
  private updateProcessingMetrics(processingTime: number, batchSize: number): void {
    const totalProcessingTime = this.metrics.averageProcessingTime * this.metrics.processedEvents;
    const newTotalProcessingTime = totalProcessingTime + processingTime;
    const totalProcessed = this.metrics.processedEvents + batchSize;

    this.metrics.averageProcessingTime = newTotalProcessingTime / totalProcessed;
    this.metrics.eventsPerSecond = batchSize / (processingTime / 1000);
  }

  private startMetricsCollection(): void {
    if (!this.config.enableMetrics) return;

    this.metricsInterval = setInterval(() => {
      this.updateMetrics();
      this.emit('metrics', this.metrics);
    }, this.config.metricsInterval);
  }

  private updateMetrics(): void {
    this.metrics.uptime = Date.now() - this.startTime.getTime();
    this.metrics.queueSize = this.eventQueue.length;
    this.metrics.backpressureActive = this.isBackpressureActive();
  }

  // Persistence
  private async persistBatch(events: StreamEvent[]): Promise<void> {
    try {
      // Persist to event storage
      for (const event of events) {
        if (event.processing.status === ProcessingStatus.COMPLETED) {
          await this.persistence.saveEvent(event as any);
        }
      }
    } catch (error) {
      logger.error('Failed to persist batch:', error);
      // Don't fail the processing, just log the error
    }
  }

  private async persistAggregationResult(result: any): Promise<void> {
    // Implementation would depend on your storage system
    logger.debug('Persisting aggregation result', result);
  }

  // Utilities
  private scheduleBatchProcessing(): void {
    if (this.batchTimer) return;

    this.batchTimer = setTimeout(() => {
      this.processBatch();
      this.batchTimer = null;
    }, this.config.batchTimeout);
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async enrichGeolocation(location: any): Promise<any> {
    // Implementation would integrate with a geolocation service
    return location;
  }

  private parseUserAgent(userAgent: string): any {
    // Implementation would parse user agent string
    return { userAgent, parsed: true };
  }

  private broadcastAggregationResult(result: any): void {
    // Implementation would broadcast via WebSocket
    this.emit('broadcast', result);
  }

  private setupEventBusIntegration(): void {
    // Subscribe to relevant event types
    const relevantEventTypes = [
      EventType.APPLICATION_SUBMITTED,
      EventType.MATCH_CREATED,
      EventType.NOTIFICATION_CREATED,
      EventType.USER_REGISTERED,
      EventType.USER_PROFILE_UPDATED,
      EventType.JOB_POSTED,
      EventType.RECOMMENDATION_GENERATED
    ];

    for (const eventType of relevantEventTypes) {
      eventBus.subscribe(eventType, async (event) => {
        await this.ingestEvent(event);
      });
    }

    logger.info('Event bus integration setup complete');
  }

  // Placeholder methods for specific analytics functions
  private async updateJobApplicationCount(jobId: string): Promise<void> {
    // Implementation would update job application analytics
  }

  private async triggerCandidateMatching(candidateId: string): Promise<void> {
    // Implementation would trigger matching process
  }

  private async updateApplicationAnalytics(event: StreamEvent): Promise<void> {
    // Implementation would update application analytics
  }

  private async updateMatchingAnalytics(event: StreamEvent): Promise<void> {
    // Implementation would update matching analytics
  }

  private async triggerHighValueMatchNotification(event: StreamEvent): Promise<void> {
    // Implementation would trigger notification for high-value matches
  }

  private async updateNotificationAnalytics(event: StreamEvent): Promise<void> {
    // Implementation would update notification analytics
  }

  private async trackNotificationDelivery(event: StreamEvent): Promise<void> {
    // Implementation would track notification delivery
  }

  private async updateUserAnalytics(event: StreamEvent): Promise<void> {
    // Implementation would update user analytics
  }

  private async triggerOnboardingFlow(userId: string, role: string): Promise<void> {
    // Implementation would trigger onboarding flow
  }

  private async updateGenericAnalytics(event: StreamEvent): Promise<void> {
    // Implementation would update generic analytics
  }

  // Public API
  getMetrics(): StreamMetrics {
    return { ...this.metrics };
  }

  getQueueSize(): number {
    return this.eventQueue.length;
  }

  getDeadLetterQueue(): StreamEvent[] {
    return [...this.deadLetterQueue];
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down stream processor...');

    // Clear timers
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }

    // Process remaining events
    if (this.eventQueue.length > 0) {
      await this.processBatch();
    }

    // Clear event bus subscriptions
    this.removeAllListeners();

    logger.info('Stream processor shutdown complete');
  }
}

export default StreamProcessor;