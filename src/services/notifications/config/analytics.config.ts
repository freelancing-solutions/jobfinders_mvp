import { z } from 'zod'

/**
 * Analytics Configuration Schema
 * Defines the structure and validation for analytics service configuration
 */
export const AnalyticsConfigSchema = z.object({
  // Redis Configuration for real-time metrics
  redis: z.object({
    host: z.string().default('localhost'),
    port: z.number().default(6379),
    password: z.string().optional(),
    db: z.number().default(0),
    keyPrefix: z.string().default('analytics:'),
    ttl: z.number().default(86400), // 24 hours in seconds
  }),

  // Database Configuration
  database: z.object({
    batchSize: z.number().default(100),
    flushInterval: z.number().default(5000), // 5 seconds
    maxRetries: z.number().default(3),
    retryDelay: z.number().default(1000), // 1 second
  }),

  // Event Processing Configuration
  events: z.object({
    enableRealtime: z.boolean().default(true),
    enableBatching: z.boolean().default(true),
    maxBatchSize: z.number().default(1000),
    batchTimeout: z.number().default(10000), // 10 seconds
    enableCompression: z.boolean().default(true),
  }),

  // Metrics Configuration
  metrics: z.object({
    enableAggregation: z.boolean().default(true),
    aggregationInterval: z.number().default(60000), // 1 minute
    retentionPeriod: z.number().default(2592000), // 30 days in seconds
    enableAlerts: z.boolean().default(false),
    alertThresholds: z.object({
      failureRate: z.number().default(0.05), // 5%
      deliveryTime: z.number().default(30000), // 30 seconds
      bounceRate: z.number().default(0.02), // 2%
    }),
  }),

  // Dashboard Configuration
  dashboard: z.object({
    refreshInterval: z.number().default(30000), // 30 seconds
    maxDataPoints: z.number().default(100),
    enableRealTimeUpdates: z.boolean().default(true),
    cacheTimeout: z.number().default(300000), // 5 minutes
  }),

  // Performance Configuration
  performance: z.object({
    enableCaching: z.boolean().default(true),
    cacheSize: z.number().default(1000),
    enableIndexing: z.boolean().default(true),
    queryTimeout: z.number().default(10000), // 10 seconds
  }),

  // Security Configuration
  security: z.object({
    enableEncryption: z.boolean().default(false),
    encryptionKey: z.string().optional(),
    enableAuditLog: z.boolean().default(true),
    maxAuditLogSize: z.number().default(10000),
  }),
})

export type AnalyticsConfig = z.infer<typeof AnalyticsConfigSchema>

/**
 * Default Analytics Configuration
 */
export const defaultAnalyticsConfig: AnalyticsConfig = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_ANALYTICS_DB || '1'),
    keyPrefix: 'analytics:',
    ttl: 86400,
  },
  database: {
    batchSize: parseInt(process.env.ANALYTICS_BATCH_SIZE || '100'),
    flushInterval: parseInt(process.env.ANALYTICS_FLUSH_INTERVAL || '5000'),
    maxRetries: parseInt(process.env.ANALYTICS_MAX_RETRIES || '3'),
    retryDelay: parseInt(process.env.ANALYTICS_RETRY_DELAY || '1000'),
  },
  events: {
    enableRealtime: process.env.ANALYTICS_ENABLE_REALTIME !== 'false',
    enableBatching: process.env.ANALYTICS_ENABLE_BATCHING !== 'false',
    maxBatchSize: parseInt(process.env.ANALYTICS_MAX_BATCH_SIZE || '1000'),
    batchTimeout: parseInt(process.env.ANALYTICS_BATCH_TIMEOUT || '10000'),
    enableCompression: process.env.ANALYTICS_ENABLE_COMPRESSION !== 'false',
  },
  metrics: {
    enableAggregation: process.env.ANALYTICS_ENABLE_AGGREGATION !== 'false',
    aggregationInterval: parseInt(process.env.ANALYTICS_AGGREGATION_INTERVAL || '60000'),
    retentionPeriod: parseInt(process.env.ANALYTICS_RETENTION_PERIOD || '2592000'),
    enableAlerts: process.env.ANALYTICS_ENABLE_ALERTS === 'true',
    alertThresholds: {
      failureRate: parseFloat(process.env.ANALYTICS_FAILURE_RATE_THRESHOLD || '0.05'),
      deliveryTime: parseInt(process.env.ANALYTICS_DELIVERY_TIME_THRESHOLD || '30000'),
      bounceRate: parseFloat(process.env.ANALYTICS_BOUNCE_RATE_THRESHOLD || '0.02'),
    },
  },
  dashboard: {
    refreshInterval: parseInt(process.env.ANALYTICS_DASHBOARD_REFRESH || '30000'),
    maxDataPoints: parseInt(process.env.ANALYTICS_MAX_DATA_POINTS || '100'),
    enableRealTimeUpdates: process.env.ANALYTICS_ENABLE_REALTIME_UPDATES !== 'false',
    cacheTimeout: parseInt(process.env.ANALYTICS_CACHE_TIMEOUT || '300000'),
  },
  performance: {
    enableCaching: process.env.ANALYTICS_ENABLE_CACHING !== 'false',
    cacheSize: parseInt(process.env.ANALYTICS_CACHE_SIZE || '1000'),
    enableIndexing: process.env.ANALYTICS_ENABLE_INDEXING !== 'false',
    queryTimeout: parseInt(process.env.ANALYTICS_QUERY_TIMEOUT || '10000'),
  },
  security: {
    enableEncryption: process.env.ANALYTICS_ENABLE_ENCRYPTION === 'true',
    encryptionKey: process.env.ANALYTICS_ENCRYPTION_KEY,
    enableAuditLog: process.env.ANALYTICS_ENABLE_AUDIT_LOG !== 'false',
    maxAuditLogSize: parseInt(process.env.ANALYTICS_MAX_AUDIT_LOG_SIZE || '10000'),
  },
}

/**
 * Validate and create analytics configuration
 */
export function createAnalyticsConfig(config?: Partial<AnalyticsConfig>): AnalyticsConfig {
  const mergedConfig = {
    ...defaultAnalyticsConfig,
    ...config,
  }

  try {
    return AnalyticsConfigSchema.parse(mergedConfig)
  } catch (error) {
    console.error('Invalid analytics configuration:', error)
    throw new Error('Failed to create analytics configuration')
  }
}

/**
 * Environment Variables Documentation
 * 
 * Redis Configuration:
 * - REDIS_HOST: Redis server hostname (default: localhost)
 * - REDIS_PORT: Redis server port (default: 6379)
 * - REDIS_PASSWORD: Redis server password (optional)
 * - REDIS_ANALYTICS_DB: Redis database number for analytics (default: 1)
 * 
 * Database Configuration:
 * - ANALYTICS_BATCH_SIZE: Number of events to batch before writing (default: 100)
 * - ANALYTICS_FLUSH_INTERVAL: Interval to flush batched events in ms (default: 5000)
 * - ANALYTICS_MAX_RETRIES: Maximum retry attempts for failed operations (default: 3)
 * - ANALYTICS_RETRY_DELAY: Delay between retry attempts in ms (default: 1000)
 * 
 * Event Processing:
 * - ANALYTICS_ENABLE_REALTIME: Enable real-time event processing (default: true)
 * - ANALYTICS_ENABLE_BATCHING: Enable event batching (default: true)
 * - ANALYTICS_MAX_BATCH_SIZE: Maximum events per batch (default: 1000)
 * - ANALYTICS_BATCH_TIMEOUT: Batch timeout in ms (default: 10000)
 * - ANALYTICS_ENABLE_COMPRESSION: Enable event compression (default: true)
 * 
 * Metrics Configuration:
 * - ANALYTICS_ENABLE_AGGREGATION: Enable metrics aggregation (default: true)
 * - ANALYTICS_AGGREGATION_INTERVAL: Aggregation interval in ms (default: 60000)
 * - ANALYTICS_RETENTION_PERIOD: Data retention period in seconds (default: 2592000)
 * - ANALYTICS_ENABLE_ALERTS: Enable alerting system (default: false)
 * - ANALYTICS_FAILURE_RATE_THRESHOLD: Failure rate alert threshold (default: 0.05)
 * - ANALYTICS_DELIVERY_TIME_THRESHOLD: Delivery time alert threshold in ms (default: 30000)
 * - ANALYTICS_BOUNCE_RATE_THRESHOLD: Bounce rate alert threshold (default: 0.02)
 * 
 * Dashboard Configuration:
 * - ANALYTICS_DASHBOARD_REFRESH: Dashboard refresh interval in ms (default: 30000)
 * - ANALYTICS_MAX_DATA_POINTS: Maximum data points to display (default: 100)
 * - ANALYTICS_ENABLE_REALTIME_UPDATES: Enable real-time dashboard updates (default: true)
 * - ANALYTICS_CACHE_TIMEOUT: Dashboard cache timeout in ms (default: 300000)
 * 
 * Performance Configuration:
 * - ANALYTICS_ENABLE_CACHING: Enable query result caching (default: true)
 * - ANALYTICS_CACHE_SIZE: Maximum cache entries (default: 1000)
 * - ANALYTICS_ENABLE_INDEXING: Enable database indexing (default: true)
 * - ANALYTICS_QUERY_TIMEOUT: Query timeout in ms (default: 10000)
 * 
 * Security Configuration:
 * - ANALYTICS_ENABLE_ENCRYPTION: Enable data encryption (default: false)
 * - ANALYTICS_ENCRYPTION_KEY: Encryption key for sensitive data (optional)
 * - ANALYTICS_ENABLE_AUDIT_LOG: Enable audit logging (default: true)
 * - ANALYTICS_MAX_AUDIT_LOG_SIZE: Maximum audit log entries (default: 10000)
 */