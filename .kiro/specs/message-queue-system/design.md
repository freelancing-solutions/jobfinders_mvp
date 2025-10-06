# Message Queue System - Design Specification

## Architecture Overview

The Message Queue System implements a high-performance, scalable messaging infrastructure using Redis Streams as the primary message broker with PostgreSQL for persistence and state management. The system follows a producer-consumer pattern with multiple queue types, priority-based processing, and comprehensive monitoring.

### Core Design Principles
- **High Throughput:** Optimized for 50,000+ messages per minute processing
- **Fault Tolerant:** At-least-once delivery with automatic retry and dead letter queues
- **Horizontally Scalable:** Support for 100+ consumer instances with load balancing
- **Observable:** Comprehensive monitoring, tracing, and alerting
- **Flexible:** Configurable routing, filtering, and transformation capabilities

## System Components

### 1. MessageQueueManager (Core Service)
**Purpose:** Central management service for queue operations and coordination

**Key Responsibilities:**
- Manage multiple queue types and priorities
- Coordinate producer and consumer registration
- Handle queue configuration and routing rules
- Monitor queue health and performance metrics
- Implement circuit breaker patterns for failing consumers

**Key Methods:**
```typescript
interface MessageQueueManager {
  enqueue(message: QueueMessage, options: EnqueueOptions): Promise<string>
  dequeue(queueName: string, consumerGroup: string): Promise<QueueMessage[]>
  scheduleMessage(message: QueueMessage, deliveryTime: Date): Promise<string>
  acknowledgeMessage(messageId: string, consumerGroup: string): Promise<void>
  rejectMessage(messageId: string, reason: string, requeue: boolean): Promise<void>
}
```

### 2. QueueProducer
**Purpose:** Handles message publishing with routing and priority management

**Key Responsibilities:**
- Validate and serialize messages before publishing
- Implement message routing based on type and priority
- Handle message scheduling and delayed delivery
- Provide batch publishing capabilities for bulk operations
- Track message publishing metrics and errors

**Message Types:**
- **Immediate:** High-priority messages requiring immediate processing
- **Standard:** Normal priority messages for regular processing
- **Bulk:** Low-priority messages for batch processing
- **Scheduled:** Messages with specific delivery times
- **Recurring:** Messages with recurring delivery patterns

### 3. QueueConsumer
**Purpose:** Handles message consumption with processing coordination

**Key Responsibilities:**
- Register with consumer groups for load balancing
- Implement message processing with acknowledgment handling
- Handle processing failures with retry logic
- Support graceful shutdown and message redelivery
- Track consumer performance and health metrics

**Consumer Types:**
- **EmailConsumer:** Processes email notification messages
- **SMSConsumer:** Processes SMS notification messages
- **PushConsumer:** Processes push notification messages
- **OrchestrationConsumer:** Processes orchestration coordination messages

### 4. MessageScheduler
**Purpose:** Manages scheduled and recurring message delivery

**Key Responsibilities:**
- Store and manage scheduled messages with precise timing
- Handle timezone-aware scheduling for global users
- Support recurring message patterns (daily, weekly, monthly)
- Provide scheduling cancellation and modification
- Implement efficient scheduling algorithms for large volumes

**Scheduling Features:**
- **Cron-like Expressions:** Support for complex recurring patterns
- **Timezone Handling:** Per-user timezone scheduling
- **Bulk Scheduling:** Efficient scheduling for campaign messages
- **Schedule Modification:** Update or cancel scheduled messages
- **Schedule Analytics:** Track scheduling effectiveness and patterns

### 5. DeadLetterQueueHandler
**Purpose:** Manages failed messages and poison message detection

**Key Responsibilities:**
- Route failed messages to appropriate dead letter queues
- Implement poison message detection and isolation
- Provide manual intervention capabilities for failed messages
- Support message replay and reprocessing
- Track failure patterns and generate alerts

**Failure Categories:**
- **Transient Failures:** Temporary issues requiring retry
- **Permanent Failures:** Messages that cannot be processed
- **Poison Messages:** Messages causing consumer failures
- **Expired Messages:** Messages that exceeded processing time limits

### 6. QueueMonitor
**Purpose:** Provides comprehensive monitoring and alerting capabilities

**Key Responsibilities:**
- Collect and aggregate queue metrics and performance data
- Implement real-time monitoring with configurable alerts
- Provide health check endpoints for service monitoring
- Generate performance reports and optimization recommendations
- Support distributed tracing for message flow analysis

**Monitoring Metrics:**
- **Queue Depth:** Number of pending messages per queue
- **Processing Rate:** Messages processed per second/minute
- **Latency:** End-to-end message processing time
- **Error Rate:** Percentage of failed message processing
- **Consumer Health:** Individual consumer performance and status

## Data Models

### QueueMessage
```typescript
interface QueueMessage {
  id: string
  type: MessageType
  priority: MessagePriority
  payload: any
  metadata: MessageMetadata
  routing: RoutingInfo
  scheduling?: SchedulingInfo
  retryPolicy: RetryPolicy
  createdAt: Date
  expiresAt?: Date
}

interface MessageMetadata {
  correlationId: string
  userId?: string
  source: string
  version: string
  contentType: string
  encoding?: string
  headers: Record<string, string>
}
```

### QueueConfiguration
```typescript
interface QueueConfiguration {
  name: string
  type: QueueType
  priority: number
  maxSize: number
  ttl: number
  retryPolicy: RetryPolicy
  deadLetterQueue: string
  consumerGroups: ConsumerGroupConfig[]
  routing: RoutingConfig
}

interface RetryPolicy {
  maxAttempts: number
  backoffStrategy: 'exponential' | 'linear' | 'fixed'
  initialDelay: number
  maxDelay: number
  multiplier: number
}
```

### ConsumerGroup
```typescript
interface ConsumerGroup {
  name: string
  queueName: string
  consumers: ConsumerInstance[]
  loadBalancing: 'round_robin' | 'least_connections' | 'weighted'
  maxConcurrency: number
  processingTimeout: number
  healthCheck: HealthCheckConfig
}

interface ConsumerInstance {
  id: string
  status: 'active' | 'inactive' | 'failed'
  lastHeartbeat: Date
  processedCount: number
  errorCount: number
  averageProcessingTime: number
}
```

## Database Schema Extensions

### message_queues
```sql
CREATE TABLE message_queues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  type VARCHAR(50) NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  configuration JSONB NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_message_queues_type ON message_queues(type);
CREATE INDEX idx_message_queues_priority ON message_queues(priority);
```

### queue_messages
```sql
CREATE TABLE queue_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_name VARCHAR(255) NOT NULL,
  message_id VARCHAR(255) NOT NULL UNIQUE,
  type VARCHAR(100) NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  payload JSONB NOT NULL,
  metadata JSONB NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  scheduled_at TIMESTAMP,
  processed_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_queue_messages_queue_name ON queue_messages(queue_name);
CREATE INDEX idx_queue_messages_status ON queue_messages(status);
CREATE INDEX idx_queue_messages_scheduled_at ON queue_messages(scheduled_at);
CREATE INDEX idx_queue_messages_priority ON queue_messages(priority DESC);
```

### consumer_groups
```sql
CREATE TABLE consumer_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  queue_name VARCHAR(255) NOT NULL,
  configuration JSONB NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(name, queue_name)
);
```

### consumer_instances
```sql
CREATE TABLE consumer_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_group_id UUID NOT NULL REFERENCES consumer_groups(id),
  instance_id VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  last_heartbeat TIMESTAMP DEFAULT NOW(),
  processed_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  average_processing_time_ms INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_consumer_instances_group_id ON consumer_instances(consumer_group_id);
CREATE INDEX idx_consumer_instances_status ON consumer_instances(status);
```

### queue_analytics
```sql
CREATE TABLE queue_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  queue_name VARCHAR(255) NOT NULL,
  consumer_group VARCHAR(255),
  messages_enqueued INTEGER DEFAULT 0,
  messages_processed INTEGER DEFAULT 0,
  messages_failed INTEGER DEFAULT 0,
  average_processing_time_ms INTEGER DEFAULT 0,
  peak_queue_depth INTEGER DEFAULT 0,
  throughput_per_minute DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_queue_analytics_unique 
ON queue_analytics(date, queue_name, consumer_group);
```

## Redis Streams Configuration

### Stream Structure
```typescript
// Redis Streams for different queue types
const queueStreams = {
  'notifications:high': 'high-priority-notifications',
  'notifications:normal': 'normal-priority-notifications', 
  'notifications:bulk': 'bulk-notifications',
  'notifications:scheduled': 'scheduled-notifications',
  'notifications:dlq': 'dead-letter-queue'
};

// Consumer Groups for load balancing
const consumerGroups = {
  'email-processors': ['notifications:high', 'notifications:normal', 'notifications:bulk'],
  'sms-processors': ['notifications:high', 'notifications:normal'],
  'push-processors': ['notifications:high', 'notifications:normal', 'notifications:bulk'],
  'orchestration-processors': ['notifications:high', 'notifications:normal']
};
```

### Stream Commands
```typescript
// Enqueue message
await redis.xadd(
  streamName,
  '*',
  'type', message.type,
  'priority', message.priority,
  'payload', JSON.stringify(message.payload),
  'metadata', JSON.stringify(message.metadata)
);

// Dequeue messages
const messages = await redis.xreadgroup(
  'GROUP', consumerGroup, consumerId,
  'COUNT', batchSize,
  'BLOCK', blockTime,
  'STREAMS', streamName, '>'
);

// Acknowledge message
await redis.xack(streamName, consumerGroup, messageId);
```

## Configuration Management

### Environment Variables
```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_MAX_CONNECTIONS=100

# Queue Configuration
QUEUE_DEFAULT_TTL=86400
QUEUE_MAX_RETRIES=3
QUEUE_BATCH_SIZE=10
QUEUE_PROCESSING_TIMEOUT=30000
QUEUE_HEARTBEAT_INTERVAL=5000

# Consumer Configuration
CONSUMER_MAX_CONCURRENCY=10
CONSUMER_PROCESSING_TIMEOUT=30000
CONSUMER_HEARTBEAT_INTERVAL=5000
CONSUMER_HEALTH_CHECK_INTERVAL=10000

# Monitoring Configuration
MONITORING_METRICS_INTERVAL=60000
MONITORING_ALERT_THRESHOLDS='{"queue_depth": 1000, "error_rate": 0.05}'
MONITORING_RETENTION_DAYS=30

# Scheduling Configuration
SCHEDULER_PRECISION_MINUTES=1
SCHEDULER_MAX_FUTURE_DAYS=365
SCHEDULER_CLEANUP_INTERVAL=3600000
```

### Queue Configurations
```typescript
const queueConfigurations: QueueConfiguration[] = [
  {
    name: 'notifications:high',
    type: 'priority',
    priority: 100,
    maxSize: 10000,
    ttl: 3600, // 1 hour
    retryPolicy: {
      maxAttempts: 5,
      backoffStrategy: 'exponential',
      initialDelay: 1000,
      maxDelay: 30000,
      multiplier: 2
    },
    deadLetterQueue: 'notifications:dlq',
    consumerGroups: ['email-processors', 'sms-processors', 'push-processors'],
    routing: {
      rules: [
        { condition: 'type == "urgent"', target: 'notifications:high' },
        { condition: 'priority > 80', target: 'notifications:high' }
      ]
    }
  },
  {
    name: 'notifications:normal',
    type: 'standard',
    priority: 50,
    maxSize: 50000,
    ttl: 86400, // 24 hours
    retryPolicy: {
      maxAttempts: 3,
      backoffStrategy: 'exponential',
      initialDelay: 5000,
      maxDelay: 300000,
      multiplier: 2
    },
    deadLetterQueue: 'notifications:dlq',
    consumerGroups: ['email-processors', 'sms-processors', 'push-processors'],
    routing: {
      rules: [
        { condition: 'type == "standard"', target: 'notifications:normal' },
        { condition: 'priority <= 80 && priority > 20', target: 'notifications:normal' }
      ]
    }
  }
];
```

## Integration Points

### 1. Producer Integration (Notification Orchestrator)
```typescript
// Orchestrator publishes messages to queue
const messageId = await messageQueueManager.enqueue({
  type: 'email_notification',
  priority: notification.priority,
  payload: {
    userId: notification.userId,
    templateId: notification.templateId,
    data: notification.data
  },
  metadata: {
    correlationId: notification.id,
    source: 'orchestrator',
    version: '1.0'
  },
  routing: {
    targetQueue: 'notifications:normal',
    consumerGroup: 'email-processors'
  }
}, {
  scheduledAt: notification.scheduledAt,
  expiresAt: notification.expiresAt
});
```

### 2. Consumer Integration (Notification Services)
```typescript
// Email service consumes messages from queue
class EmailQueueConsumer extends QueueConsumer {
  async processMessage(message: QueueMessage): Promise<void> {
    try {
      const emailData = message.payload;
      await this.emailService.sendEmail(emailData);
      await this.acknowledgeMessage(message.id);
    } catch (error) {
      await this.rejectMessage(message.id, error.message, true);
    }
  }
}
```

### 3. Monitoring Integration
```typescript
// Integration with monitoring systems
const queueMetrics = await queueMonitor.getMetrics();
await prometheusClient.register.metrics();

// Health check endpoint
app.get('/health/queue', async (req, res) => {
  const health = await queueMonitor.getHealthStatus();
  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});
```

## Error Handling and Resilience

### Retry Strategies
```typescript
class RetryHandler {
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    retryPolicy: RetryPolicy
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= retryPolicy.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === retryPolicy.maxAttempts) {
          break;
        }
        
        const delay = this.calculateDelay(attempt, retryPolicy);
        await this.sleep(delay);
      }
    }
    
    throw lastError;
  }
  
  private calculateDelay(attempt: number, policy: RetryPolicy): number {
    switch (policy.backoffStrategy) {
      case 'exponential':
        return Math.min(
          policy.initialDelay * Math.pow(policy.multiplier, attempt - 1),
          policy.maxDelay
        );
      case 'linear':
        return Math.min(
          policy.initialDelay * attempt,
          policy.maxDelay
        );
      case 'fixed':
        return policy.initialDelay;
    }
  }
}
```

### Circuit Breaker Implementation
```typescript
class QueueCircuitBreaker {
  private failureCount = 0;
  private lastFailureTime?: Date;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (this.shouldAttemptReset()) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open - queue unavailable');
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
}
```

## Performance Optimization

### Connection Pooling
```typescript
class RedisConnectionPool {
  private pool: Redis[] = [];
  private readonly maxConnections: number;
  
  constructor(maxConnections: number = 100) {
    this.maxConnections = maxConnections;
    this.initializePool();
  }
  
  async getConnection(): Promise<Redis> {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    
    if (this.activeConnections < this.maxConnections) {
      return this.createConnection();
    }
    
    // Wait for available connection
    return this.waitForConnection();
  }
  
  releaseConnection(connection: Redis): void {
    if (this.pool.length < this.maxConnections / 2) {
      this.pool.push(connection);
    } else {
      connection.disconnect();
    }
  }
}
```

### Batch Processing Optimization
```typescript
class BatchProcessor {
  private batchSize: number = 100;
  private batchTimeout: number = 5000;
  private pendingMessages: QueueMessage[] = [];
  
  async processBatch(messages: QueueMessage[]): Promise<void> {
    const batches = this.createBatches(messages, this.batchSize);
    
    await Promise.all(
      batches.map(batch => this.processSingleBatch(batch))
    );
  }
  
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }
}
```

## Security Considerations

### Message Encryption
```typescript
class MessageEncryption {
  private encryptionKey: string;
  
  encryptMessage(message: QueueMessage): QueueMessage {
    if (this.requiresEncryption(message)) {
      return {
        ...message,
        payload: this.encrypt(JSON.stringify(message.payload)),
        metadata: {
          ...message.metadata,
          encrypted: true
        }
      };
    }
    return message;
  }
  
  decryptMessage(message: QueueMessage): QueueMessage {
    if (message.metadata.encrypted) {
      return {
        ...message,
        payload: JSON.parse(this.decrypt(message.payload)),
        metadata: {
          ...message.metadata,
          encrypted: false
        }
      };
    }
    return message;
  }
}
```

### Access Control
```typescript
class QueueAccessControl {
  async checkPermission(
    userId: string,
    operation: 'read' | 'write' | 'admin',
    queueName: string
  ): Promise<boolean> {
    const userRoles = await this.getUserRoles(userId);
    const queuePermissions = await this.getQueuePermissions(queueName);
    
    return this.evaluatePermission(userRoles, queuePermissions, operation);
  }
}
```

## Monitoring and Observability

### Metrics Collection
```typescript
class QueueMetricsCollector {
  private metrics = {
    messagesEnqueued: new Counter('queue_messages_enqueued_total'),
    messagesProcessed: new Counter('queue_messages_processed_total'),
    processingLatency: new Histogram('queue_processing_duration_seconds'),
    queueDepth: new Gauge('queue_depth'),
    consumerHealth: new Gauge('consumer_health_status')
  };
  
  recordMessageEnqueued(queueName: string, messageType: string): void {
    this.metrics.messagesEnqueued
      .labels({ queue: queueName, type: messageType })
      .inc();
  }
  
  recordProcessingLatency(duration: number, queueName: string): void {
    this.metrics.processingLatency
      .labels({ queue: queueName })
      .observe(duration / 1000);
  }
}
```

### Health Monitoring
```typescript
class QueueHealthMonitor {
  async getHealthStatus(): Promise<HealthStatus> {
    const checks = await Promise.all([
      this.checkRedisConnection(),
      this.checkDatabaseConnection(),
      this.checkConsumerHealth(),
      this.checkQueueDepth()
    ]);
    
    const overallStatus = checks.every(check => check.healthy) ? 'healthy' : 'unhealthy';
    
    return {
      status: overallStatus,
      timestamp: new Date(),
      checks: checks,
      version: process.env.APP_VERSION
    };
  }
}
```