// Core EventBus Implementation
// Centralized event bus system for cross-system communication

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import {
  BaseEvent,
  EventType,
  EventPriority,
  EventHandler,
  EventSubscription,
  EventFilter,
  EventBusConfig,
  EventMetrics,
  AppEvent
} from './event-types';

export class EventBus {
  private emitter: EventEmitter;
  private subscriptions: Map<string, EventSubscription> = new Map();
  private config: EventBusConfig;
  private metrics: EventMetrics;
  private eventBuffer: BaseEvent[] = [];
  private processingQueue: Promise<void> = Promise.resolve();
  private logger: Console;

  constructor(config?: Partial<EventBusConfig>) {
    this.emitter = new EventEmitter();
    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 5000,
      maxConcurrentEvents: 100,
      enablePersistence: true,
      enableMonitoring: true,
      bufferSize: 1000,
      batchProcessing: true,
      batchSize: 50,
      batchTimeout: 100,
      ...config
    };

    this.metrics = {
      totalEvents: 0,
      eventsByType: {} as Record<EventType, number>,
      eventsByPriority: {} as Record<EventPriority, number>,
      averageProcessingTime: 0,
      failureRate: 0,
      retryCount: 0,
      bufferSize: 0,
      activeSubscriptions: 0
    };

    this.logger = console;
    this.setupErrorHandling();
    this.startBatchProcessor();
  }

  // Event Publishing
  async publish<T extends BaseEvent>(event: T): Promise<void> {
    try {
      const startTime = Date.now();

      // Validate event
      this.validateEvent(event);

      // Add metadata
      const enrichedEvent = this.enrichEvent(event);

      // Add to buffer if batch processing is enabled
      if (this.config.batchProcessing) {
        this.eventBuffer.push(enrichedEvent);
        if (this.eventBuffer.length >= this.config.batchSize) {
          this.processBatch();
        }
      } else {
        await this.processEvent(enrichedEvent);
      }

      // Update metrics
      this.updateMetrics(enrichedEvent, Date.now() - startTime);

      this.logger.debug(`Event published: ${enrichedEvent.type}`, {
        eventId: enrichedEvent.id,
        eventType: enrichedEvent.type,
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      this.logger.error('Failed to publish event:', error);
      this.metrics.failureRate = (this.metrics.failureRate + 1) / this.metrics.totalEvents;
      throw error;
    }
  }

  // Event Subscription
  subscribe<T extends BaseEvent>(
    eventType: EventType,
    handler: EventHandler<T>['handler'],
    options?: EventHandler<T>['options']
  ): string {
    const subscriptionId = uuidv4();
    const subscription: EventSubscription = {
      id: subscriptionId,
      eventTypes: [eventType],
      handler: {
        eventType,
        handler,
        options
      },
      isActive: true,
      createdAt: new Date()
    };

    this.subscriptions.set(subscriptionId, subscription);
    this.emitter.on(eventType, this.createHandlerWrapper(subscription));

    this.metrics.activeSubscriptions++;

    this.logger.debug(`Subscription created: ${eventType}`, {
      subscriptionId,
      eventType
    });

    return subscriptionId;
  }

  subscribeMultiple(
    eventTypes: EventType[],
    handler: EventHandler['handler'],
    options?: EventHandler['options']
  ): string {
    const subscriptionId = uuidv4();
    const subscription: EventSubscription = {
      id: subscriptionId,
      eventTypes,
      handler: {
        eventType: eventTypes[0], // Use first type for default
        handler,
        options
      },
      isActive: true,
      createdAt: new Date()
    };

    this.subscriptions.set(subscriptionId, subscription);

    // Subscribe to all event types
    eventTypes.forEach(eventType => {
      this.emitter.on(eventType, this.createHandlerWrapper(subscription));
    });

    this.metrics.activeSubscriptions++;

    this.logger.debug(`Multiple subscriptions created`, {
      subscriptionId,
      eventTypes
    });

    return subscriptionId;
  }

  subscribeWithFilter(
    eventType: EventType,
    filter: EventFilter,
    handler: EventHandler['handler'],
    options?: EventHandler['options']
  ): string {
    const subscriptionId = uuidv4();
    const subscription: EventSubscription = {
      id: subscriptionId,
      eventTypes: [eventType],
      filter,
      handler: {
        eventType,
        handler,
        options
      },
      isActive: true,
      createdAt: new Date()
    };

    this.subscriptions.set(subscriptionId, subscription);
    this.emitter.on(eventType, this.createHandlerWrapper(subscription));

    this.metrics.activeSubscriptions++;

    this.logger.debug(`Subscription with filter created: ${eventType}`, {
      subscriptionId,
      eventType,
      filter
    });

    return subscriptionId;
  }

  // Unsubscribe
  unsubscribe(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return false;
    }

    subscription.eventTypes.forEach(eventType => {
      this.emitter.off(eventType, this.createHandlerWrapper(subscription));
    });

    this.subscriptions.delete(subscriptionId);
    this.metrics.activeSubscriptions--;

    this.logger.debug(`Subscription removed`, { subscriptionId });

    return true;
  }

  // Event Querying
  async getEvents(filter?: EventFilter): Promise<BaseEvent[]> {
    // This would integrate with event persistence
    // For now, return empty array
    return [];
  }

  async getEventById(eventId: string): Promise<BaseEvent | null> {
    // This would integrate with event persistence
    return null;
  }

  // Metrics and Monitoring
  getMetrics(): EventMetrics {
    return { ...this.metrics };
  }

  getActiveSubscriptions(): EventSubscription[] {
    return Array.from(this.subscriptions.values());
  }

  clearMetrics(): void {
    this.metrics = {
      totalEvents: 0,
      eventsByType: {} as Record<EventType, number>,
      eventsByPriority: {} as Record<EventPriority, number>,
      averageProcessingTime: 0,
      failureRate: 0,
      retryCount: 0,
      bufferSize: this.eventBuffer.length,
      activeSubscriptions: this.subscriptions.size
    };
  }

  // Configuration
  updateConfig(newConfig: Partial<EventBusConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.info('EventBus configuration updated', { config: this.config });
  }

  getConfig(): EventBusConfig {
    return { ...this.config };
  }

  // Lifecycle
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down EventBus...');

    // Process remaining events in buffer
    if (this.eventBuffer.length > 0) {
      await this.processBatch();
    }

    // Remove all subscriptions
    this.subscriptions.clear();
    this.emitter.removeAllListeners();

    this.logger.info('EventBus shutdown complete');
  }

  // Private Methods
  private validateEvent(event: BaseEvent): void {
    if (!event.id) {
      throw new Error('Event must have an id');
    }
    if (!event.type) {
      throw new Error('Event must have a type');
    }
    if (!event.timestamp) {
      throw new Error('Event must have a timestamp');
    }
    if (!Object.values(EventType).includes(event.type)) {
      throw new Error(`Invalid event type: ${event.type}`);
    }
  }

  private enrichEvent(event: BaseEvent): BaseEvent {
    return {
      ...event,
      timestamp: event.timestamp instanceof Date ? event.timestamp : new Date(event.timestamp),
      priority: event.priority || EventPriority.NORMAL,
      source: event.source || 'unknown',
      correlationId: event.correlationId || uuidv4()
    };
  }

  private createHandlerWrapper(subscription: EventSubscription) {
    return async (event: BaseEvent) => {
      if (!subscription.isActive) {
        return;
      }

      // Apply filter if present
      if (subscription.filter && !this.matchesFilter(event, subscription.filter)) {
        return;
      }

      try {
        const options = subscription.handler.options || {};
        const timeout = options.timeout || this.config.timeout;

        await Promise.race([
          this.executeHandler(subscription.handler.handler, event),
          this.createTimeoutPromise(timeout)
        ]);

        subscription.lastTriggered = new Date();

      } catch (error) {
        this.logger.error(`Handler failed for event ${event.type}:`, error);
        await this.handleFailedEvent(subscription, event, error);
      }
    };
  }

  private async executeHandler(handler: EventHandler['handler'], event: BaseEvent): Promise<void> {
    await handler(event as AppEvent);
  }

  private createTimeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Handler timeout')), timeout);
    });
  }

  private matchesFilter(event: BaseEvent, filter: EventFilter): boolean {
    if (filter.eventTypes && !filter.eventTypes.includes(event.type)) {
      return false;
    }

    if (filter.userId && event.userId !== filter.userId) {
      return false;
    }

    if (filter.dateRange) {
      const eventTime = event.timestamp.getTime();
      const startTime = filter.dateRange.start.getTime();
      const endTime = filter.dateRange.end.getTime();

      if (eventTime < startTime || eventTime > endTime) {
        return false;
      }
    }

    if (filter.priority && !filter.priority.includes(event.priority)) {
      return false;
    }

    if (filter.source && event.source !== filter.source) {
      return false;
    }

    if (filter.customFilter && !filter.customFilter(event)) {
      return false;
    }

    return true;
  }

  private async handleFailedEvent(
    subscription: EventSubscription,
    event: BaseEvent,
    error: Error
  ): Promise<void> {
    const options = subscription.handler.options || {};
    const retryAttempts = options.retryAttempts || this.config.maxRetries;

    if (retryAttempts > 0) {
      this.metrics.retryCount++;

      // Schedule retry with exponential backoff
      const delay = this.config.retryDelay * Math.pow(2, this.config.maxRetries - retryAttempts);

      setTimeout(async () => {
        try {
          await this.executeHandler(subscription.handler.handler, event);
        } catch (retryError) {
          this.logger.error(`Retry failed for event ${event.type}:`, retryError);
        }
      }, delay);
    }
  }

  private updateMetrics(event: BaseEvent, processingTime: number): void {
    this.metrics.totalEvents++;
    this.metrics.eventsByType[event.type] = (this.metrics.eventsByType[event.type] || 0) + 1;
    this.metrics.eventsByPriority[event.priority] = (this.metrics.eventsByPriority[event.priority] || 0) + 1;

    // Update average processing time
    const totalTime = this.metrics.averageProcessingTime * (this.metrics.totalEvents - 1) + processingTime;
    this.metrics.averageProcessingTime = totalTime / this.metrics.totalEvents;

    this.metrics.bufferSize = this.eventBuffer.length;
  }

  private async processEvent(event: BaseEvent): Promise<void> {
    this.processingQueue = this.processingQueue.then(async () => {
      this.emitter.emit(event.type, event);
    });

    await this.processingQueue;
  }

  private startBatchProcessor(): void {
    if (!this.config.batchProcessing) {
      return;
    }

    setInterval(() => {
      if (this.eventBuffer.length > 0) {
        this.processBatch();
      }
    }, this.config.batchTimeout);
  }

  private async processBatch(): Promise<void> {
    if (this.eventBuffer.length === 0) {
      return;
    }

    const batch = this.eventBuffer.splice(0, this.config.batchSize);

    try {
      await Promise.all(batch.map(event => this.processEvent(event)));

      this.logger.debug(`Processed batch of ${batch.length} events`);
    } catch (error) {
      this.logger.error('Failed to process event batch:', error);

      // Re-add failed events to buffer for retry
      this.eventBuffer.unshift(...batch);
    }
  }

  private setupErrorHandling(): void {
    this.emitter.on('error', (error) => {
      this.logger.error('EventBus error:', error);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled rejection in EventBus:', reason);
    });
  }
}

// Singleton instance
export const eventBus = new EventBus();

// Utility functions
export function createEvent<T extends BaseEvent>(
  type: T['type'],
  payload: T['payload'],
  metadata?: Partial<BaseEvent>
): T {
  return {
    id: uuidv4(),
    type,
    timestamp: new Date(),
    priority: EventPriority.NORMAL,
    source: 'application',
    ...metadata,
    payload
  } as T;
}

export function publishEvent<T extends BaseEvent>(event: T): Promise<void> {
  return eventBus.publish(event);
}

export function subscribeToEvent<T extends BaseEvent>(
  eventType: EventType,
  handler: EventHandler<T>['handler'],
  options?: EventHandler<T>['options']
): string {
  return eventBus.subscribe(eventType, handler, options);
}