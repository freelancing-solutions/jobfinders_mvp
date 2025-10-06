import { EventEmitter } from 'events'
import { Readable, Transform, Writable } from 'stream'
import { logger } from '@/lib/logger'

export interface EventStreamOptions {
  maxBufferSize: number
  flushInterval: number
  compressionEnabled: boolean
  persistenceEnabled: boolean
  retryAttempts: number
  retryDelay: number
}

export interface StreamEvent {
  id: string
  type: string
  data: any
  timestamp: Date
  source: string
  version: string
  metadata?: Record<string, any>
}

export interface EventFilter {
  types?: string[]
  sources?: string[]
  timeRange?: {
    start: Date
    end: Date
  }
  dataFilters?: Record<string, any>
}

export interface StreamSubscription {
  id: string
  filter: EventFilter
  callback: (event: StreamEvent) => void
  active: boolean
  createdAt: Date
  lastEventTime?: Date
}

export class EventStream extends EventEmitter {
  private buffer: StreamEvent[] = []
  private subscriptions: Map<string, StreamSubscription> = new Map()
  private persistenceQueue: StreamEvent[] = []
  private isProcessing: boolean = false
  private options: EventStreamOptions
  private flushTimer: NodeJS.Timeout | null = null

  constructor(options: Partial<EventStreamOptions> = {}) {
    super()

    this.options = {
      maxBufferSize: 10000,
      flushInterval: 5000, // 5 seconds
      compressionEnabled: true,
      persistenceEnabled: true,
      retryAttempts: 3,
      retryDelay: 1000,
      ...options
    }

    this.startFlushTimer()
    this.setupErrorHandling()
  }

  /**
   * Publish an event to the stream
   */
  public publish(event: Omit<StreamEvent, 'id' | 'timestamp'>): string {
    const fullEvent: StreamEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: new Date(),
      version: '1.0'
    }

    // Add to buffer
    this.buffer.push(fullEvent)

    // Check buffer size
    if (this.buffer.length >= this.options.maxBufferSize) {
      this.flushBuffer().catch(error => {
        logger.error('Error flushing buffer on max size', { error })
      })
    }

    // Process subscriptions
    this.processSubscriptions(fullEvent)

    // Queue for persistence
    if (this.options.persistenceEnabled) {
      this.persistenceQueue.push(fullEvent)
    }

    this.emit('event_published', fullEvent)
    return fullEvent.id
  }

  /**
   * Subscribe to event stream with filter
   */
  public subscribe(filter: EventFilter, callback: (event: StreamEvent) => void): string {
    const subscription: StreamSubscription = {
      id: this.generateSubscriptionId(),
      filter,
      callback,
      active: true,
      createdAt: new Date()
    }

    this.subscriptions.set(subscription.id, subscription)

    logger.debug('New subscription created', {
      subscriptionId: subscription.id,
      filter
    })

    this.emit('subscription_created', subscription)
    return subscription.id
  }

  /**
   * Unsubscribe from event stream
   */
  public unsubscribe(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) {
      return false
    }

    subscription.active = false
    this.subscriptions.delete(subscriptionId)

    logger.debug('Subscription removed', { subscriptionId })
    this.emit('subscription_removed', subscription)
    return true
  }

  /**
   * Create readable stream for events
   */
  public createReadableStream(filter?: EventFilter): Readable {
    let eventIndex = 0

    const stream = new Readable({
      objectMode: true,
      highWaterMark: 1000,
      read() {
        // This function will be called when the stream is ready for more data
        this.pushEvents()
      }
    })

    // Store reference to push events
    ;(stream as any).pushEvents = () => {
      const events = filter ? this.getFilteredEvents(filter) : this.buffer.slice(eventIndex)

      for (const event of events.slice(eventIndex)) {
        if (!stream.push(event)) {
          // Stream is full, stop pushing
          return
        }
        eventIndex++
      }
    }

    // Subscribe to new events
    const subscriptionId = this.subscribe(filter || {}, (event) => {
      if (!stream.push(event)) {
        // Stream is full, unsubscribe temporarily
        this.unsubscribe(subscriptionId)
      }
    })

    // Clean up on stream end
    stream.on('end', () => {
      this.unsubscribe(subscriptionId)
    })

    stream.on('error', (error) => {
      logger.error('Readable stream error', { error })
      this.unsubscribe(subscriptionId)
    })

    return stream
  }

  /**
   * Create writable stream for events
   */
  public createWritableStream(): Writable {
    const stream = new Writable({
      objectMode: true,
      highWaterMark: 1000,
      write(event: any, encoding, callback) {
        try {
          this.publish(event)
          callback()
        } catch (error) {
          callback(error as Error)
        }
      }
    })

    return stream
  }

  /**
   * Create transform stream for event processing
   */
  public createTransformStream(
    transformFn: (event: StreamEvent) => StreamEvent | Promise<StreamEvent>
  ): Transform {
    return new Transform({
      objectMode: true,
      async transform(event: StreamEvent, encoding, callback) {
        try {
          const transformedEvent = await transformFn(event)
          callback(null, transformedEvent)
        } catch (error) {
          callback(error as Error)
        }
      }
    })
  }

  /**
   * Process subscriptions for an event
   */
  private processSubscriptions(event: StreamEvent): void {
    for (const subscription of this.subscriptions.values()) {
      if (!subscription.active) continue

      if (this.eventMatchesFilter(event, subscription.filter)) {
        try {
          subscription.callback(event)
          subscription.lastEventTime = event.timestamp
        } catch (error) {
          logger.error('Error in subscription callback', {
            subscriptionId: subscription.id,
            error
          })
        }
      }
    }
  }

  /**
   * Check if event matches filter
   */
  private eventMatchesFilter(event: StreamEvent, filter: EventFilter): boolean {
    // Check type filter
    if (filter.types && !filter.types.includes(event.type)) {
      return false
    }

    // Check source filter
    if (filter.sources && !filter.sources.includes(event.source)) {
      return false
    }

    // Check time range filter
    if (filter.timeRange) {
      const eventTime = event.timestamp.getTime()
      const startTime = filter.timeRange.start.getTime()
      const endTime = filter.timeRange.end.getTime()

      if (eventTime < startTime || eventTime > endTime) {
        return false
      }
    }

    // Check data filters
    if (filter.dataFilters) {
      for (const [key, value] of Object.entries(filter.dataFilters)) {
        if (event.data[key] !== value) {
          return false
        }
      }
    }

    return true
  }

  /**
   * Get filtered events from buffer
   */
  private getFilteredEvents(filter: EventFilter): StreamEvent[] {
    return this.buffer.filter(event => this.eventMatchesFilter(event, filter))
  }

  /**
   * Flush buffer to persistence
   */
  private async flushBuffer(): Promise<void> {
    if (this.isProcessing || this.buffer.length === 0) {
      return
    }

    this.isProcessing = true

    try {
      const eventsToFlush = this.buffer.splice(0)

      if (this.options.persistenceEnabled && eventsToFlush.length > 0) {
        await this.persistEvents(eventsToFlush)
      }

      this.emit('buffer_flushed', eventsToFlush.length)
    } catch (error) {
      logger.error('Error flushing buffer', { error })
      // Re-add events to buffer on failure
      this.buffer.unshift(...this.buffer.splice(0))
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Persist events to storage
   */
  private async persistEvents(events: StreamEvent[]): Promise<void> {
    const retryPromises = events.map(event =>
      this.persistEventWithRetry(event)
    )

    await Promise.allSettled(retryPromises)
  }

  /**
   * Persist single event with retry logic
   */
  private async persistEventWithRetry(event: StreamEvent, attempt: number = 1): Promise<void> {
    try {
      // This would integrate with your persistence layer
      // For now, we'll simulate persistence
      await this.simulatePersistence(event)
    } catch (error) {
      if (attempt < this.options.retryAttempts) {
        logger.warn('Event persistence failed, retrying', {
          eventId: event.id,
          attempt,
          error
        })

        await new Promise(resolve =>
          setTimeout(resolve, this.options.retryDelay * attempt)
        )

        return this.persistEventWithRetry(event, attempt + 1)
      } else {
        logger.error('Event persistence failed after max retries', {
          eventId: event.id,
          error
        })
        throw error
      }
    }
  }

  /**
   * Simulate event persistence (replace with actual implementation)
   */
  private async simulatePersistence(event: StreamEvent): Promise<void> {
    // This would integrate with your database, event store, or message queue
    // For demonstration, we'll just log the event
    logger.debug('Persisting event', {
      eventId: event.id,
      type: event.type,
      source: event.source
    })

    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 10))
  }

  /**
   * Start flush timer
   */
  private startFlushTimer(): void {
    if (this.options.flushInterval > 0) {
      this.flushTimer = setInterval(() => {
        this.flushBuffer().catch(error => {
          logger.error('Error in scheduled flush', { error })
        })
      }, this.options.flushInterval)
    }
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    this.on('error', (error) => {
      logger.error('Event stream error', { error })
    })

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception in event stream', { error })
    })

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection in event stream', { reason, promise })
    })
  }

  /**
   * Get stream statistics
   */
  public getStats(): {
    bufferSize: number
    subscriptionCount: number
    isProcessing: boolean
    persistenceQueueSize: number
  } {
    return {
      bufferSize: this.buffer.length,
      subscriptionCount: this.subscriptions.size,
      isProcessing: this.isProcessing,
      persistenceQueueSize: this.persistenceQueue.length
    }
  }

  /**
   * Get subscription information
   */
  public getSubscription(subscriptionId: string): StreamSubscription | undefined {
    return this.subscriptions.get(subscriptionId)
  }

  /**
   * Get all active subscriptions
   */
  public getActiveSubscriptions(): StreamSubscription[] {
    return Array.from(this.subscriptions.values()).filter(sub => sub.active)
  }

  /**
   * Clear buffer
   */
  public clearBuffer(): number {
    const clearedCount = this.buffer.length
    this.buffer = []
    return clearedCount
  }

  /**
   * Pause event processing
   */
  public pause(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }
    this.emit('paused')
  }

  /**
   * Resume event processing
   */
  public resume(): void {
    this.startFlushTimer()
    this.emit('resumed')
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Generate unique subscription ID
   */
  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Graceful shutdown
   */
  public async shutdown(): Promise<void> {
    logger.info('Shutting down event stream')

    // Pause processing
    this.pause()

    // Clear all subscriptions
    this.subscriptions.clear()

    // Flush remaining events
    await this.flushBuffer()

    // Clear timers
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }

    // Remove all listeners
    this.removeAllListeners()

    logger.info('Event stream shutdown complete')
  }
}

/**
 * Event stream factory for creating different types of streams
 */
export class EventStreamFactory {
  private static streams: Map<string, EventStream> = new Map()

  /**
   * Get or create an event stream
   */
  public static getStream(name: string, options?: Partial<EventStreamOptions>): EventStream {
    if (!this.streams.has(name)) {
      this.streams.set(name, new EventStream(options))
    }
    return this.streams.get(name)!
  }

  /**
   * Get all active streams
   */
  public static getAllStreams(): Map<string, EventStream> {
    return new Map(this.streams)
  }

  /**
   * Close a specific stream
   */
  public static async closeStream(name: string): Promise<void> {
    const stream = this.streams.get(name)
    if (stream) {
      await stream.shutdown()
      this.streams.delete(name)
    }
  }

  /**
   * Close all streams
   */
  public static async closeAllStreams(): Promise<void> {
    const closePromises = Array.from(this.streams.entries()).map(
      async ([name, stream]) => {
        await stream.shutdown()
        this.streams.delete(name)
      }
    )

    await Promise.all(closePromises)
  }
}