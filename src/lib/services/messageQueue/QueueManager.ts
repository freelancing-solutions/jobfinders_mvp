import Redis from 'ioredis';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

// Types for message queue system
export interface Message {
  id: string;
  type: string;
  payload: any;
  priority: 'high' | 'normal' | 'low';
  queue: string;
  timestamp: number;
  attempts: number;
  maxAttempts: number;
  delayUntil?: number;
  metadata: Record<string, any>;
  correlationId?: string;
  replyTo?: string;
  expiresAt?: number;
}

export interface QueueConfig {
  name: string;
  priority: number;
  maxLength?: number;
  consumerGroup?: string;
  consumerName?: string;
  batchSize: number;
  processingTimeout: number;
  retryPolicy: RetryPolicy;
  deadLetterQueue?: string;
  persistent: boolean;
  visibilityTimeout: number;
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffType: 'exponential' | 'linear' | 'fixed';
  initialDelay: number;
  maxDelay: number;
  multiplier?: number;
  jitter?: boolean;
}

export interface ConsumerConfig {
  queueName: string;
  groupName: string;
  consumerName: string;
  batchSize: number;
  processingTimeout: number;
  concurrency: number;
  retryPolicy: RetryPolicy;
  handler: (message: Message) => Promise<MessageHandlerResult>;
}

export interface MessageHandlerResult {
  success: boolean;
  error?: Error;
  retry?: boolean;
  requeue?: boolean;
  metadata?: Record<string, any>;
}

export interface QueueMetrics {
  queueName: string;
  depth: number;
  processingRate: number;
  errorRate: number;
  averageLatency: number;
  consumerCount: number;
  lastProcessed: Date;
}

export class QueueManager {
  private static instance: QueueManager;
  private redis: Redis;
  private redisSubscriber: Redis;
  private queues: Map<string, QueueConfig> = new Map();
  private consumers: Map<string, ConsumerConfig> = new Map();
  private processors: Map<string, NodeJS.Timeout[]> = new Map();
  private metrics: Map<string, QueueMetrics> = new Map();
  private isShuttingDown = false;

  static getInstance(): QueueManager {
    if (!QueueManager.instance) {
      QueueManager.instance = new QueueManager();
    }
    return QueueManager.instance;
  }

  private constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });

    this.redisSubscriber = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });

    this.setupErrorHandling();
    this.setupGracefulShutdown();
  }

  private setupErrorHandling(): void {
    this.redis.on('error', (error) => {
      console.error('Redis connection error:', error);
    });

    this.redis.on('connect', () => {
      console.log('Redis connected successfully');
    });

    this.redisSubscriber.on('error', (error) => {
      console.error('Redis subscriber error:', error);
    });
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      console.log(`Received ${signal}, shutting down gracefully...`);
      this.isShuttingDown = true;

      // Stop all processors
      for (const [queueName, timers] of this.processors) {
        timers.forEach(timer => clearTimeout(timer));
        this.processors.set(queueName, []);
      }

      // Wait for ongoing operations to complete
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Close Redis connections
      await this.redis.quit();
      await this.redisSubscriber.quit();

      console.log('Graceful shutdown completed');
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  async initialize(): Promise<void> {
    try {
      await this.redis.connect();
      await this.redisSubscriber.connect();
      await this.initializeDefaultQueues();
      console.log('QueueManager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize QueueManager:', error);
      throw error;
    }
  }

  private async initializeDefaultQueues(): Promise<void> {
    const defaultQueues: QueueConfig[] = [
      {
        name: 'notifications:high',
        priority: 100,
        maxLength: 10000,
        batchSize: 10,
        processingTimeout: 30000,
        retryPolicy: {
          maxAttempts: 5,
          backoffType: 'exponential',
          initialDelay: 1000,
          maxDelay: 60000,
          multiplier: 2,
          jitter: true
        },
        deadLetterQueue: 'notifications:dead',
        persistent: true,
        visibilityTimeout: 30000
      },
      {
        name: 'notifications:normal',
        priority: 50,
        maxLength: 50000,
        batchSize: 50,
        processingTimeout: 60000,
        retryPolicy: {
          maxAttempts: 3,
          backoffType: 'exponential',
          initialDelay: 2000,
          maxDelay: 30000,
          multiplier: 2,
          jitter: true
        },
        deadLetterQueue: 'notifications:dead',
        persistent: true,
        visibilityTimeout: 60000
      },
      {
        name: 'notifications:low',
        priority: 10,
        maxLength: 100000,
        batchSize: 100,
        processingTimeout: 120000,
        retryPolicy: {
          maxAttempts: 2,
          backoffType: 'fixed',
          initialDelay: 5000,
          maxDelay: 5000
        },
        deadLetterQueue: 'notifications:dead',
        persistent: true,
        visibilityTimeout: 120000
      },
      {
        name: 'notifications:scheduled',
        priority: 0,
        maxLength: 50000,
        batchSize: 20,
        processingTimeout: 30000,
        retryPolicy: {
          maxAttempts: 3,
          backoffType: 'exponential',
          initialDelay: 1000,
          maxDelay: 30000,
          multiplier: 2
        },
        persistent: true,
        visibilityTimeout: 30000
      },
      {
        name: 'notifications:dead',
        priority: -1,
        maxLength: 10000,
        batchSize: 1,
        processingTimeout: 60000,
        retryPolicy: {
          maxAttempts: 0,
          backoffType: 'fixed',
          initialDelay: 0,
          maxDelay: 0
        },
        persistent: true,
        visibilityTimeout: 60000
      }
    ];

    for (const queueConfig of defaultQueues) {
      await this.createQueue(queueConfig);
    }
  }

  async createQueue(config: QueueConfig): Promise<void> {
    try {
      // Create stream if it doesn't exist
      await this.redis.xadd(config.name, '*', 'INIT', 'true', 'MKSTREAM');

      // Create consumer group if it doesn't exist
      if (config.consumerGroup) {
        try {
          await this.redis.xgroup('CREATE', config.name, config.consumerGroup, '0', 'MKSTREAM');
        } catch (error: any) {
          if (!error.message.includes('BUSYGROUP')) {
            throw error;
          }
        }
      }

      this.queues.set(config.name, config);
      this.metrics.set(config.name, {
        queueName: config.name,
        depth: 0,
        processingRate: 0,
        errorRate: 0,
        averageLatency: 0,
        consumerCount: 0,
        lastProcessed: new Date()
      });

      console.log(`Queue ${config.name} created successfully`);
    } catch (error) {
      console.error(`Failed to create queue ${config.name}:`, error);
      throw error;
    }
  }

  async sendMessage(
    queueName: string,
    type: string,
    payload: any,
    options: {
      priority?: 'high' | 'normal' | 'low';
      delay?: number;
      correlationId?: string;
      replyTo?: string;
      expiresAt?: number;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<string> {
    const message: Message = {
      id: uuidv4(),
      type,
      payload,
      priority: options.priority || 'normal',
      queue: queueName,
      timestamp: Date.now(),
      attempts: 0,
      maxAttempts: this.queues.get(queueName)?.retryPolicy.maxAttempts || 3,
      delayUntil: options.delay ? Date.now() + options.delay : undefined,
      metadata: options.metadata || {},
      correlationId: options.correlationId,
      replyTo: options.replyTo,
      expiresAt: options.expiresAt
    };

    try {
      const streamName = message.delayUntil ? 'notifications:scheduled' : queueName;
      const messageId = await this.redis.xadd(
        streamName,
        '*',
        'id', message.id,
        'type', message.type,
        'payload', JSON.stringify(message.payload),
        'priority', message.priority,
        'queue', message.queue,
        'timestamp', message.timestamp.toString(),
        'attempts', message.attempts.toString(),
        'maxAttempts', message.maxAttempts.toString(),
        'delayUntil', (message.delayUntil || '').toString(),
        'metadata', JSON.stringify(message.metadata),
        'correlationId', message.correlationId || '',
        'replyTo', message.replyTo || '',
        'expiresAt', (message.expiresAt || '').toString()
      );

      // Update metrics
      await this.updateQueueMetrics(queueName);

      // Store message metadata in database for audit
      await this.storeMessageMetadata(message);

      return messageId;
    } catch (error) {
      console.error(`Failed to send message to queue ${queueName}:`, error);
      throw error;
    }
  }

  async sendBatch(
    queueName: string,
    messages: Array<{
      type: string;
      payload: any;
      options?: any;
    }>
  ): Promise<string[]> {
    const messageIds: string[] = [];

    try {
      // Use Redis pipeline for batch operations
      const pipeline = this.redis.pipeline();

      for (const { type, payload, options } of messages) {
        const message: Message = {
          id: uuidv4(),
          type,
          payload,
          priority: options?.priority || 'normal',
          queue: queueName,
          timestamp: Date.now(),
          attempts: 0,
          maxAttempts: this.queues.get(queueName)?.retryPolicy.maxAttempts || 3,
          delayUntil: options?.delay ? Date.now() + options.delay : undefined,
          metadata: options?.metadata || {},
          correlationId: options?.correlationId,
          replyTo: options?.replyTo,
          expiresAt: options?.expiresAt
        };

        const streamName = message.delayUntil ? 'notifications:scheduled' : queueName;
        pipeline.xadd(
          streamName,
          '*',
          'id', message.id,
          'type', message.type,
          'payload', JSON.stringify(message.payload),
          'priority', message.priority,
          'queue', message.queue,
          'timestamp', message.timestamp.toString(),
          'attempts', message.attempts.toString(),
          'maxAttempts', message.maxAttempts.toString(),
          'delayUntil', (message.delayUntil || '').toString(),
          'metadata', JSON.stringify(message.metadata),
          'correlationId', message.correlationId || '',
          'replyTo', message.replyTo || '',
          'expiresAt', (message.expiresAt || '').toString()
        );
      }

      const results = await pipeline.exec();
      results?.forEach(([err, messageId]) => {
        if (!err && messageId) {
          messageIds.push(messageId as string);
        }
      });

      // Update metrics
      await this.updateQueueMetrics(queueName);

      return messageIds;
    } catch (error) {
      console.error(`Failed to send batch messages to queue ${queueName}:`, error);
      throw error;
    }
  }

  async scheduleMessage(
    queueName: string,
    type: string,
    payload: any,
    scheduleTime: Date,
    options: {
      correlationId?: string;
      replyTo?: string;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<string> {
    const delay = scheduleTime.getTime() - Date.now();
    if (delay <= 0) {
      return this.sendMessage(queueName, type, payload, options);
    }

    return this.sendMessage(queueName, type, payload, {
      ...options,
      delay,
      priority: 'normal'
    });
  }

  async scheduleRecurringMessage(
    queueName: string,
    type: string,
    payload: any,
    cronExpression: string,
    options: {
      correlationId?: string;
      replyTo?: string;
      metadata?: Record<string, any>;
      maxOccurrences?: number;
    } = {}
  ): Promise<string> {
    const scheduleId = uuidv4();

    try {
      // Store recurring schedule in database
      await prisma.recurringSchedule.create({
        data: {
          id: scheduleId,
          queueName,
          type,
          payload,
          cronExpression,
          options,
          isActive: true,
          createdAt: new Date()
        }
      });

      console.log(`Recurring schedule ${scheduleId} created for queue ${queueName}`);
      return scheduleId;
    } catch (error) {
      console.error(`Failed to create recurring schedule:`, error);
      throw error;
    }
  }

  async createConsumer(config: ConsumerConfig): Promise<void> {
    try {
      // Create consumer group if it doesn't exist
      try {
        await this.redis.xgroup('CREATE', config.queueName, config.groupName, '0', 'MKSTREAM');
      } catch (error: any) {
        if (!error.message.includes('BUSYGROUP')) {
          throw error;
        }
      }

      this.consumers.set(`${config.groupName}:${config.consumerName}`, config);

      // Start message processing
      this.startMessageProcessing(config);

      console.log(`Consumer ${config.consumerName} created for queue ${config.queueName}`);
    } catch (error) {
      console.error(`Failed to create consumer ${config.consumerName}:`, error);
      throw error;
    }
  }

  private startMessageProcessing(config: ConsumerConfig): void {
    const processorKey = `${config.groupName}:${config.consumerName}`;
    this.processors.set(processorKey, []);

    const processMessages = async () => {
      if (this.isShuttingDown) return;

      try {
        // Check for scheduled messages
        await this.processScheduledMessages();

        // Read messages from queue
        const messages = await this.redis.xreadgroup(
          'GROUP', config.groupName, config.consumerName,
          'COUNT', config.batchSize.toString(),
          'BLOCK', '1000',
          'STREAMS', config.queueName, '>'
        );

        if (messages && messages.length > 0) {
          const [, streamMessages] = messages[0];

          // Process messages concurrently
          const processingPromises = streamMessages.map(async ([messageId, fields]) => {
            const message = this.parseMessage(fields);

            try {
              const startTime = Date.now();
              const result = await config.handler(message);
              const processingTime = Date.now() - startTime;

              if (result.success) {
                // Acknowledge successful processing
                await this.redis.xack(config.queueName, config.groupName, messageId);
                await this.updateProcessingMetrics(config.queueName, true, processingTime);
              } else if (result.retry && message.attempts < message.maxAttempts) {
                // Retry logic
                await this.retryMessage(config, messageId, message, result.error);
              } else if (result.requeue) {
                // Requeue message
                await this.requeueMessage(config, messageId, message);
              } else {
                // Send to dead letter queue
                await this.sendToDeadLetterQueue(config, messageId, message, result.error);
              }
            } catch (error) {
              // Handle processing errors
              await this.handleProcessingError(config, messageId, message, error as Error);
            }
          });

          await Promise.allSettled(processingPromises);
        }
      } catch (error) {
        console.error(`Error in message processing for ${config.consumerName}:`, error);
      }

      // Schedule next processing cycle
      const timer = setTimeout(processMessages, 100);
      const timers = this.processors.get(processorKey) || [];
      timers.push(timer);
      this.processors.set(processorKey, timers);
    };

    // Start processing
    processMessages();
  }

  private async processScheduledMessages(): Promise<void> {
    try {
      const now = Date.now();
      const messages = await this.redis.xrange(
        'notifications:scheduled',
        '-',
        '+',
        'COUNT', 100
      );

      for (const [messageId, fields] of messages) {
        const message = this.parseMessage(fields);

        if (message.delayUntil && message.delayUntil <= now) {
          // Move message to target queue
          await this.redis.xadd(
            message.queue,
            '*',
            ...Object.entries(fields).flat()
          );

          // Remove from scheduled queue
          await this.redis.xdel('notifications:scheduled', messageId);
        }
      }
    } catch (error) {
      console.error('Error processing scheduled messages:', error);
    }
  }

  private parseMessage(fields: string[]): Message {
    const fieldMap = new Map();
    for (let i = 0; i < fields.length; i += 2) {
      fieldMap.set(fields[i], fields[i + 1]);
    }

    return {
      id: fieldMap.get('id') || '',
      type: fieldMap.get('type') || '',
      payload: JSON.parse(fieldMap.get('payload') || '{}'),
      priority: (fieldMap.get('priority') || 'normal') as 'high' | 'normal' | 'low',
      queue: fieldMap.get('queue') || '',
      timestamp: parseInt(fieldMap.get('timestamp') || '0'),
      attempts: parseInt(fieldMap.get('attempts') || '0'),
      maxAttempts: parseInt(fieldMap.get('maxAttempts') || '3'),
      delayUntil: fieldMap.get('delayUntil') ? parseInt(fieldMap.get('delayUntil')) : undefined,
      metadata: JSON.parse(fieldMap.get('metadata') || '{}'),
      correlationId: fieldMap.get('correlationId'),
      replyTo: fieldMap.get('replyTo'),
      expiresAt: fieldMap.get('expiresAt') ? parseInt(fieldMap.get('expiresAt')) : undefined
    };
  }

  private async retryMessage(
    config: ConsumerConfig,
    messageId: string,
    message: Message,
    error?: Error
  ): Promise<void> {
    const retryDelay = this.calculateRetryDelay(message.attempts, config.retryPolicy);

    // Update message with new attempt count
    message.attempts++;

    // Add delay for retry
    if (retryDelay > 0) {
      message.delayUntil = Date.now() + retryDelay;
    }

    // Re-add message to queue
    await this.redis.xadd(
      message.queue,
      '*',
      'id', message.id,
      'type', message.type,
      'payload', JSON.stringify(message.payload),
      'priority', message.priority,
      'queue', message.queue,
      'timestamp', message.timestamp.toString(),
      'attempts', message.attempts.toString(),
      'maxAttempts', message.maxAttempts.toString(),
      'delayUntil', (message.delayUntil || '').toString(),
      'metadata', JSON.stringify(message.metadata),
      'correlationId', message.correlationId || '',
      'replyTo', message.replyTo || '',
      'expiresAt', (message.expiresAt || '').toString()
    );

    // Acknowledge original message
    await this.redis.xack(config.queueName, config.groupName, messageId);

    // Log retry
    console.log(`Message ${message.id} retried (attempt ${message.attempts}/${message.maxAttempts})`);
  }

  private async requeueMessage(
    config: ConsumerConfig,
    messageId: string,
    message: Message
  ): Promise<void> {
    // Re-add message to queue without incrementing attempts
    await this.redis.xadd(
      message.queue,
      '*',
      ...Object.entries({
        'id': message.id,
        'type': message.type,
        'payload': JSON.stringify(message.payload),
        'priority': message.priority,
        'queue': message.queue,
        'timestamp': message.timestamp.toString(),
        'attempts': message.attempts.toString(),
        'maxAttempts': message.maxAttempts.toString(),
        'metadata': JSON.stringify(message.metadata),
        'correlationId': message.correlationId || '',
        'replyTo': message.replyTo || '',
        'expiresAt': (message.expiresAt || '').toString()
      }).flat()
    );

    // Acknowledge original message
    await this.redis.xack(config.queueName, config.groupName, messageId);
  }

  private async sendToDeadLetterQueue(
    config: ConsumerConfig,
    messageId: string,
    message: Message,
    error?: Error
  ): Promise<void> {
    try {
      const deadLetterQueue = this.queues.get(config.queueName)?.deadLetterQueue || 'notifications:dead';

      // Add error information to metadata
      message.metadata.lastError = error?.message || 'Unknown error';
      message.metadata.failedAt = Date.now();
      message.metadata.originalQueue = config.queueName;

      await this.redis.xadd(
        deadLetterQueue,
        '*',
        'id', message.id,
        'type', message.type,
        'payload', JSON.stringify(message.payload),
        'priority', message.priority,
        'queue', message.queue,
        'timestamp', message.timestamp.toString(),
        'attempts', message.attempts.toString(),
        'maxAttempts', message.maxAttempts.toString(),
        'metadata', JSON.stringify(message.metadata),
        'correlationId', message.correlationId || '',
        'replyTo', message.replyTo || '',
        'expiresAt', (message.expiresAt || '').toString()
      );

      // Acknowledge original message
      await this.redis.xack(config.queueName, config.groupName, messageId);

      console.error(`Message ${message.id} sent to dead letter queue: ${error?.message}`);
    } catch (dlqError) {
      console.error(`Failed to send message to dead letter queue:`, dlqError);
    }
  }

  private async handleProcessingError(
    config: ConsumerConfig,
    messageId: string,
    message: Message,
    error: Error
  ): Promise<void> {
    console.error(`Processing error for message ${message.id}:`, error);

    if (message.attempts < message.maxAttempts) {
      await this.retryMessage(config, messageId, message, error);
    } else {
      await this.sendToDeadLetterQueue(config, messageId, message, error);
    }
  }

  private calculateRetryDelay(attempt: number, policy: RetryPolicy): number {
    let delay = policy.initialDelay;

    switch (policy.backoffType) {
      case 'exponential':
        delay = policy.initialDelay * Math.pow(policy.multiplier || 2, attempt - 1);
        break;
      case 'linear':
        delay = policy.initialDelay * attempt;
        break;
      case 'fixed':
        delay = policy.initialDelay;
        break;
    }

    // Apply maximum delay limit
    delay = Math.min(delay, policy.maxDelay);

    // Add jitter if enabled
    if (policy.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }

    return Math.floor(delay);
  }

  private async storeMessageMetadata(message: Message): Promise<void> {
    try {
      await prisma.messageMetadata.create({
        data: {
          id: message.id,
          type: message.type,
          queue: message.queue,
          priority: message.priority,
          status: 'queued',
          createdAt: new Date(message.timestamp),
          attempts: message.attempts,
          metadata: message.metadata,
          correlationId: message.correlationId,
          expiresAt: message.expiresAt ? new Date(message.expiresAt) : null
        }
      });
    } catch (error) {
      // Log error but don't fail the message sending
      console.error('Failed to store message metadata:', error);
    }
  }

  private async updateQueueMetrics(queueName: string): Promise<void> {
    try {
      const length = await this.redis.xlen(queueName);
      const metrics = this.metrics.get(queueName);

      if (metrics) {
        metrics.depth = length;
        this.metrics.set(queueName, metrics);
      }
    } catch (error) {
      console.error(`Failed to update metrics for queue ${queueName}:`, error);
    }
  }

  private async updateProcessingMetrics(
    queueName: string,
    success: boolean,
    processingTime: number
  ): Promise<void> {
    try {
      const metrics = this.metrics.get(queueName);

      if (metrics) {
        // Update processing rate (simplified - would use sliding window in production)
        metrics.processingRate = metrics.processingRate * 0.9 + (success ? 1 : 0) * 0.1;

        // Update error rate
        metrics.errorRate = metrics.errorRate * 0.9 + (success ? 0 : 1) * 0.1;

        // Update average latency
        metrics.averageLatency = metrics.averageLatency * 0.9 + processingTime * 0.1;

        metrics.lastProcessed = new Date();

        this.metrics.set(queueName, metrics);
      }
    } catch (error) {
      console.error(`Failed to update processing metrics for queue ${queueName}:`, error);
    }
  }

  async getQueueMetrics(queueName?: string): Promise<QueueMetrics[]> {
    if (queueName) {
      const metrics = this.metrics.get(queueName);
      return metrics ? [metrics] : [];
    }

    return Array.from(this.metrics.values());
  }

  async getQueueInfo(queueName: string): Promise<{
    config: QueueConfig;
    metrics: QueueMetrics;
    consumerGroups: string[];
  } | null> {
    const config = this.queues.get(queueName);
    const metrics = this.metrics.get(queueName);

    if (!config || !metrics) {
      return null;
    }

    try {
      const groups = await this.redis.xinfo('GROUPS', queueName);
      const consumerGroups = groups.map(group => group.name as string);

      return {
        config,
        metrics,
        consumerGroups
      };
    } catch (error) {
      console.error(`Failed to get queue info for ${queueName}:`, error);
      return null;
    }
  }

  async purgeQueue(queueName: string): Promise<void> {
    try {
      await this.redis.del(queueName);
      await this.updateQueueMetrics(queueName);
      console.log(`Queue ${queueName} purged successfully`);
    } catch (error) {
      console.error(`Failed to purge queue ${queueName}:`, error);
      throw error;
    }
  }

  async pauseQueue(queueName: string): Promise<void> {
    // Implementation would stop message processing for the queue
    console.log(`Queue ${queueName} paused`);
  }

  async resumeQueue(queueName: string): Promise<void> {
    // Implementation would resume message processing for the queue
    console.log(`Queue ${queueName} resumed`);
  }

  async deleteQueue(queueName: string): Promise<void> {
    try {
      // Stop all processors for this queue
      for (const [key, timers] of this.processors) {
        if (key.includes(queueName)) {
          timers.forEach(timer => clearTimeout(timer));
          this.processors.delete(key);
        }
      }

      // Delete queue from Redis
      await this.redis.del(queueName);

      // Clean up local data
      this.queues.delete(queueName);
      this.metrics.delete(queueName);

      console.log(`Queue ${queueName} deleted successfully`);
    } catch (error) {
      console.error(`Failed to delete queue ${queueName}:`, error);
      throw error;
    }
  }
}