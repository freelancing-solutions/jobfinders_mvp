import { z } from 'zod'

// Environment-specific configuration schema
const NotificationConfigSchema = z.object({
  // Environment
  environment: z.enum(['development', 'staging', 'production']),
  
  // Database
  database: z.object({
    url: z.string(),
    maxConnections: z.number().default(20),
    connectionTimeout: z.number().default(30000),
    queryTimeout: z.number().default(60000),
  }),
  
  // Redis/Queue Configuration
  queue: z.object({
    redis: z.object({
      host: z.string(),
      port: z.number().default(6379),
      password: z.string().optional(),
      db: z.number().default(0),
      maxRetriesPerRequest: z.number().default(3),
      retryDelayOnFailover: z.number().default(100),
    }),
    concurrency: z.object({
      default: z.number().default(10),
      email: z.number().default(20),
      sms: z.number().default(5),
      push: z.number().default(15),
      inApp: z.number().default(50),
    }),
    batchSizes: z.object({
      default: z.number().default(100),
      email: z.number().default(50),
      sms: z.number().default(25),
      push: z.number().default(100),
      inApp: z.number().default(200),
    }),
    retryConfig: z.object({
      attempts: z.number().default(3),
      backoff: z.enum(['fixed', 'exponential']).default('exponential'),
      delay: z.number().default(1000),
    }),
  }),
  
  // Channel Configurations
  channels: z.object({
    email: z.object({
      provider: z.enum(['resend', 'sendgrid', 'ses']).default('resend'),
      resend: z.object({
        apiKey: z.string(),
        fromAddress: z.string().default('noreply@jobfinders.com'),
        fromName: z.string().default('JobFinders'),
      }).optional(),
      rateLimit: z.object({
        perSecond: z.number().default(10),
        perMinute: z.number().default(300),
        perHour: z.number().default(10000),
      }),
      webhookSecret: z.string().optional(),
    }),
    
    sms: z.object({
      provider: z.enum(['twilio', 'aws-sns']).default('twilio'),
      twilio: z.object({
        accountSid: z.string(),
        authToken: z.string(),
        fromNumber: z.string(),
      }).optional(),
      rateLimit: z.object({
        perSecond: z.number().default(5),
        perMinute: z.number().default(100),
        perHour: z.number().default(1000),
      }),
      webhookSecret: z.string().optional(),
    }),
    
    push: z.object({
      fcm: z.object({
        projectId: z.string(),
        privateKey: z.string(),
        clientEmail: z.string(),
      }).optional(),
      apns: z.object({
        keyId: z.string(),
        teamId: z.string(),
        privateKey: z.string(),
        production: z.boolean().default(false),
      }).optional(),
      rateLimit: z.object({
        perSecond: z.number().default(20),
        perMinute: z.number().default(1000),
        perHour: z.number().default(50000),
      }),
    }),
    
    inApp: z.object({
      websocket: z.object({
        port: z.number().default(3001),
        path: z.string().default('/notifications'),
        cors: z.object({
          origin: z.array(z.string()).default(['http://localhost:3000']),
          credentials: z.boolean().default(true),
        }),
      }),
      rateLimit: z.object({
        perSecond: z.number().default(50),
        perMinute: z.number().default(2000),
      }),
    }),
  }),
  
  // Analytics & Monitoring
  analytics: z.object({
    enabled: z.boolean().default(true),
    retentionDays: z.number().default(90),
    aggregationIntervals: z.array(z.enum(['1m', '5m', '15m', '1h', '1d'])).default(['5m', '1h', '1d']),
  }),
  
  // Health Checks & Alerts
  monitoring: z.object({
    healthCheck: z.object({
      enabled: z.boolean().default(true),
      interval: z.number().default(60000), // 1 minute
      timeout: z.number().default(30000), // 30 seconds
    }),
    alerts: z.object({
      enabled: z.boolean().default(true),
      checkInterval: z.number().default(300000), // 5 minutes
      webhookUrl: z.string().optional(),
      emailRecipients: z.array(z.string()).default([]),
    }),
  }),
  
  // Security
  security: z.object({
    encryption: z.object({
      algorithm: z.string().default('aes-256-gcm'),
      keyRotationDays: z.number().default(90),
    }),
    rateLimit: z.object({
      windowMs: z.number().default(900000), // 15 minutes
      maxRequests: z.number().default(1000),
    }),
    webhookSecurity: z.object({
      verifySignatures: z.boolean().default(true),
      allowedIps: z.array(z.string()).default([]),
    }),
  }),
  
  // Performance
  performance: z.object({
    caching: z.object({
      templates: z.object({
        ttl: z.number().default(3600), // 1 hour
        maxSize: z.number().default(1000),
      }),
      preferences: z.object({
        ttl: z.number().default(1800), // 30 minutes
        maxSize: z.number().default(10000),
      }),
    }),
    compression: z.object({
      enabled: z.boolean().default(true),
      level: z.number().min(1).max(9).default(6),
    }),
  }),
})

export type NotificationConfig = z.infer<typeof NotificationConfigSchema>

// Environment-specific configurations
export const configurations: Record<string, Partial<NotificationConfig>> = {
  development: {
    environment: 'development',
    database: {
      maxConnections: 5,
    },
    queue: {
      concurrency: {
        default: 2,
        email: 3,
        sms: 1,
        push: 2,
        inApp: 5,
      },
      batchSizes: {
        default: 10,
        email: 5,
        sms: 3,
        push: 10,
        inApp: 20,
      },
    },
    channels: {
      email: {
        rateLimit: {
          perSecond: 2,
          perMinute: 50,
          perHour: 1000,
        },
      },
      sms: {
        rateLimit: {
          perSecond: 1,
          perMinute: 10,
          perHour: 100,
        },
      },
      push: {
        rateLimit: {
          perSecond: 5,
          perMinute: 100,
          perHour: 5000,
        },
      },
    },
    monitoring: {
      healthCheck: {
        interval: 30000, // 30 seconds
      },
      alerts: {
        checkInterval: 60000, // 1 minute
      },
    },
  },
  
  staging: {
    environment: 'staging',
    database: {
      maxConnections: 10,
    },
    queue: {
      concurrency: {
        default: 5,
        email: 10,
        sms: 3,
        push: 8,
        inApp: 20,
      },
      batchSizes: {
        default: 50,
        email: 25,
        sms: 15,
        push: 50,
        inApp: 100,
      },
    },
    channels: {
      email: {
        rateLimit: {
          perSecond: 5,
          perMinute: 150,
          perHour: 5000,
        },
      },
      sms: {
        rateLimit: {
          perSecond: 2,
          perMinute: 50,
          perHour: 500,
        },
      },
      push: {
        rateLimit: {
          perSecond: 10,
          perMinute: 500,
          perHour: 25000,
        },
      },
    },
  },
  
  production: {
    environment: 'production',
    database: {
      maxConnections: 20,
    },
    queue: {
      concurrency: {
        default: 10,
        email: 20,
        sms: 5,
        push: 15,
        inApp: 50,
      },
      batchSizes: {
        default: 100,
        email: 50,
        sms: 25,
        push: 100,
        inApp: 200,
      },
    },
    channels: {
      email: {
        rateLimit: {
          perSecond: 10,
          perMinute: 300,
          perHour: 10000,
        },
      },
      sms: {
        rateLimit: {
          perSecond: 5,
          perMinute: 100,
          perHour: 1000,
        },
      },
      push: {
        rateLimit: {
          perSecond: 20,
          perMinute: 1000,
          perHour: 50000,
        },
      },
    },
    monitoring: {
      alerts: {
        enabled: true,
        emailRecipients: ['alerts@jobfinders.com', 'oncall@jobfinders.com'],
      },
    },
  },
}

/**
 * Load and validate configuration for the current environment
 */
export function loadNotificationConfig(): NotificationConfig {
  const env = process.env.NODE_ENV || 'development'
  
  // Base configuration
  const baseConfig: Partial<NotificationConfig> = {
    database: {
      url: process.env.DATABASE_URL!,
    },
    queue: {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      },
    },
    channels: {
      email: {
        resend: {
          apiKey: process.env.RESEND_API_KEY!,
          fromAddress: process.env.EMAIL_FROM_ADDRESS || 'noreply@jobfinders.com',
          fromName: process.env.EMAIL_FROM_NAME || 'JobFinders',
        },
        webhookSecret: process.env.RESEND_WEBHOOK_SECRET,
      },
      sms: {
        twilio: {
          accountSid: process.env.TWILIO_ACCOUNT_SID!,
          authToken: process.env.TWILIO_AUTH_TOKEN!,
          fromNumber: process.env.TWILIO_FROM_NUMBER!,
        },
        webhookSecret: process.env.TWILIO_WEBHOOK_SECRET,
      },
      push: {
        fcm: {
          projectId: process.env.FCM_PROJECT_ID!,
          privateKey: process.env.FCM_PRIVATE_KEY!,
          clientEmail: process.env.FCM_CLIENT_EMAIL!,
        },
        apns: {
          keyId: process.env.APNS_KEY_ID!,
          teamId: process.env.APNS_TEAM_ID!,
          privateKey: process.env.APNS_PRIVATE_KEY!,
          production: env === 'production',
        },
      },
    },
    monitoring: {
      alerts: {
        webhookUrl: process.env.ALERT_WEBHOOK_URL,
        emailRecipients: process.env.ALERT_EMAIL_RECIPIENTS?.split(',') || [],
      },
    },
  }
  
  // Merge with environment-specific configuration
  const envConfig = configurations[env] || {}
  const mergedConfig = mergeDeep(baseConfig, envConfig)
  
  // Validate configuration
  try {
    return NotificationConfigSchema.parse(mergedConfig)
  } catch (error) {
    console.error('Invalid notification configuration:', error)
    throw new Error('Failed to load notification configuration')
  }
}

/**
 * Deep merge two objects
 */
function mergeDeep(target: any, source: any): any {
  const result = { ...target }
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = mergeDeep(result[key] || {}, source[key])
    } else {
      result[key] = source[key]
    }
  }
  
  return result
}

/**
 * Get scaling recommendations based on current metrics
 */
export function getScalingRecommendations(metrics: {
  queueDepth: number
  processingLatency: number
  errorRate: number
  throughput: number
}): {
  recommendations: string[]
  suggestedConfig: Partial<NotificationConfig>
} {
  const recommendations: string[] = []
  const suggestedConfig: Partial<NotificationConfig> = {}

  // High queue depth
  if (metrics.queueDepth > 1000) {
    recommendations.push('Increase queue concurrency to handle backlog')
    suggestedConfig.queue = {
      concurrency: {
        default: 20,
        email: 40,
        sms: 10,
        push: 30,
        inApp: 100,
      },
    } as any
  }

  // High processing latency
  if (metrics.processingLatency > 30000) {
    recommendations.push('Increase batch sizes to improve throughput')
    suggestedConfig.queue = {
      ...suggestedConfig.queue,
      batchSizes: {
        default: 200,
        email: 100,
        sms: 50,
        push: 200,
        inApp: 400,
      },
    } as any
  }

  // High error rate
  if (metrics.errorRate > 0.05) {
    recommendations.push('Reduce concurrency and batch sizes to improve reliability')
    recommendations.push('Increase retry attempts and delays')
    suggestedConfig.queue = {
      ...suggestedConfig.queue,
      retryConfig: {
        attempts: 5,
        backoff: 'exponential',
        delay: 2000,
      },
    } as any
  }

  // High throughput
  if (metrics.throughput > 10000) {
    recommendations.push('Consider horizontal scaling with multiple instances')
    recommendations.push('Increase database connection pool size')
    suggestedConfig.database = {
      maxConnections: 50,
    } as any
  }

  return { recommendations, suggestedConfig }
}

/**
 * Validate environment variables
 */
export function validateEnvironmentVariables(): { valid: boolean; missing: string[] } {
  const required = [
    'DATABASE_URL',
    'REDIS_HOST',
    'RESEND_API_KEY',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_FROM_NUMBER',
    'FCM_PROJECT_ID',
    'FCM_PRIVATE_KEY',
    'FCM_CLIENT_EMAIL',
    'APNS_KEY_ID',
    'APNS_TEAM_ID',
    'APNS_PRIVATE_KEY',
  ]

  const missing = required.filter(key => !process.env[key])

  return {
    valid: missing.length === 0,
    missing,
  }
}

// Export the loaded configuration as default
export const notificationConfig = loadNotificationConfig()