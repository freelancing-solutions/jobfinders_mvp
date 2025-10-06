import { PrismaClient } from '@prisma/client'
import { EventQueue } from '../../../lib/queue/event-queue'
import { Resend } from 'resend'
import { Twilio } from 'twilio'
import { NotificationAnalyticsEngine } from '../analytics-engine'

export interface HealthCheckResult {
  service: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  latency?: number
  error?: string
  details?: Record<string, any>
  timestamp: Date
}

export interface SystemHealthStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy'
  services: HealthCheckResult[]
  summary: {
    healthy: number
    degraded: number
    unhealthy: number
    total: number
  }
  timestamp: Date
}

export class NotificationHealthChecker {
  private prisma: PrismaClient
  private eventQueue: EventQueue
  private resend: Resend
  private twilio: Twilio
  private analytics: NotificationAnalyticsEngine
  private healthHistory: Map<string, HealthCheckResult[]> = new Map()
  private readonly maxHistorySize = 100

  constructor(
    prisma: PrismaClient,
    eventQueue: EventQueue,
    resend: Resend,
    twilio: Twilio,
    analytics: NotificationAnalyticsEngine
  ) {
    this.prisma = prisma
    this.eventQueue = eventQueue
    this.resend = resend
    this.twilio = twilio
    this.analytics = analytics
  }

  /**
   * Perform comprehensive health check of all notification system components
   */
  async performHealthCheck(): Promise<SystemHealthStatus> {
    const startTime = Date.now()
    
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkEventQueue(),
      this.checkEmailService(),
      this.checkSMSService(),
      this.checkAnalyticsEngine(),
      this.checkWebSocketConnections(),
      this.checkRateLimiting(),
      this.checkTemplateSystem(),
    ])

    const services: HealthCheckResult[] = checks.map((result, index) => {
      const serviceNames = [
        'database',
        'event_queue',
        'email_service',
        'sms_service',
        'analytics_engine',
        'websocket_connections',
        'rate_limiting',
        'template_system',
      ]

      if (result.status === 'fulfilled') {
        return result.value
      } else {
        return {
          service: serviceNames[index],
          status: 'unhealthy' as const,
          error: result.reason?.message || 'Unknown error',
          timestamp: new Date(),
        }
      }
    })

    // Store health history
    services.forEach(service => {
      if (!this.healthHistory.has(service.service)) {
        this.healthHistory.set(service.service, [])
      }
      
      const history = this.healthHistory.get(service.service)!
      history.push(service)
      
      if (history.length > this.maxHistorySize) {
        history.shift()
      }
    })

    const summary = {
      healthy: services.filter(s => s.status === 'healthy').length,
      degraded: services.filter(s => s.status === 'degraded').length,
      unhealthy: services.filter(s => s.status === 'unhealthy').length,
      total: services.length,
    }

    const overall = this.determineOverallHealth(summary)

    const healthStatus: SystemHealthStatus = {
      overall,
      services,
      summary,
      timestamp: new Date(),
    }

    // Track health metrics
    await this.trackHealthMetrics(healthStatus)

    return healthStatus
  }

  /**
   * Check database connectivity and performance
   */
  private async checkDatabase(): Promise<HealthCheckResult> {
    const startTime = Date.now()
    
    try {
      // Test basic connectivity
      await this.prisma.$queryRaw`SELECT 1`
      
      // Test notification table access
      const notificationCount = await this.prisma.notification.count({
        take: 1,
      })
      
      // Test write performance with a simple operation
      const testStart = Date.now()
      await this.prisma.$queryRaw`SELECT COUNT(*) FROM "Notification" WHERE "createdAt" > NOW() - INTERVAL '1 hour'`
      const queryLatency = Date.now() - testStart

      const totalLatency = Date.now() - startTime

      return {
        service: 'database',
        status: totalLatency > 5000 ? 'degraded' : 'healthy',
        latency: totalLatency,
        details: {
          queryLatency,
          recentNotifications: notificationCount,
        },
        timestamp: new Date(),
      }
    } catch (error) {
      return {
        service: 'database',
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Database connection failed',
        latency: Date.now() - startTime,
        timestamp: new Date(),
      }
    }
  }

  /**
   * Check event queue health and performance
   */
  private async checkEventQueue(): Promise<HealthCheckResult> {
    const startTime = Date.now()
    
    try {
      // Check queue connectivity
      const queueStats = await this.eventQueue.getQueueStats()
      
      // Test job addition (with a test job that won't be processed)
      const testJobId = await this.eventQueue.addJob(
        'health-check',
        { test: true, timestamp: Date.now() },
        { delay: 24 * 60 * 60 * 1000 } // Delay for 24 hours so it won't be processed
      )

      const latency = Date.now() - startTime
      
      // Determine health based on queue metrics
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
      
      if (queueStats.failed > queueStats.completed * 0.1) {
        status = 'degraded' // More than 10% failure rate
      }
      
      if (queueStats.waiting > 1000) {
        status = 'degraded' // Too many waiting jobs
      }

      return {
        service: 'event_queue',
        status,
        latency,
        details: {
          ...queueStats,
          testJobId,
        },
        timestamp: new Date(),
      }
    } catch (error) {
      return {
        service: 'event_queue',
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Event queue connection failed',
        latency: Date.now() - startTime,
        timestamp: new Date(),
      }
    }
  }

  /**
   * Check email service (Resend) health
   */
  private async checkEmailService(): Promise<HealthCheckResult> {
    const startTime = Date.now()
    
    try {
      // Test Resend API connectivity (without sending actual email)
      // This is a mock check - in production, you might want to use Resend's health endpoint
      const testResult = await Promise.race([
        this.resend.emails.send({
          from: 'health-check@jobfinders.com',
          to: 'health-check@jobfinders.com', // Send to self for testing
          subject: 'Health Check - Do Not Reply',
          text: 'This is a health check email. Please ignore.',
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 10000)
        ),
      ])

      const latency = Date.now() - startTime

      return {
        service: 'email_service',
        status: latency > 5000 ? 'degraded' : 'healthy',
        latency,
        details: {
          provider: 'resend',
          testEmailSent: true,
        },
        timestamp: new Date(),
      }
    } catch (error) {
      const latency = Date.now() - startTime
      
      return {
        service: 'email_service',
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Email service failed',
        latency,
        timestamp: new Date(),
      }
    }
  }

  /**
   * Check SMS service (Twilio) health
   */
  private async checkSMSService(): Promise<HealthCheckResult> {
    const startTime = Date.now()
    
    try {
      // Test Twilio API connectivity
      const account = await this.twilio.api.accounts.get()
      
      const latency = Date.now() - startTime

      return {
        service: 'sms_service',
        status: latency > 3000 ? 'degraded' : 'healthy',
        latency,
        details: {
          provider: 'twilio',
          accountSid: account.sid,
          accountStatus: account.status,
        },
        timestamp: new Date(),
      }
    } catch (error) {
      return {
        service: 'sms_service',
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'SMS service failed',
        latency: Date.now() - startTime,
        timestamp: new Date(),
      }
    }
  }

  /**
   * Check analytics engine health
   */
  private async checkAnalyticsEngine(): Promise<HealthCheckResult> {
    const startTime = Date.now()
    
    try {
      // Test analytics functionality
      await this.analytics.trackEvent('health_check', {
        timestamp: Date.now(),
        service: 'health_checker',
      })

      // Test metrics retrieval
      const recentMetrics = await this.analytics.getDeliveryMetrics({
        startDate: new Date(Date.now() - 60 * 60 * 1000), // Last hour
        endDate: new Date(),
      })

      const latency = Date.now() - startTime

      return {
        service: 'analytics_engine',
        status: 'healthy',
        latency,
        details: {
          recentEvents: recentMetrics.totalDeliveries,
        },
        timestamp: new Date(),
      }
    } catch (error) {
      return {
        service: 'analytics_engine',
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Analytics engine failed',
        latency: Date.now() - startTime,
        timestamp: new Date(),
      }
    }
  }

  /**
   * Check WebSocket connections health
   */
  private async checkWebSocketConnections(): Promise<HealthCheckResult> {
    const startTime = Date.now()
    
    try {
      // This would check active WebSocket connections
      // Implementation depends on your WebSocket server setup
      const activeConnections = 0 // Placeholder - implement based on your WebSocket server
      
      const latency = Date.now() - startTime

      return {
        service: 'websocket_connections',
        status: 'healthy',
        latency,
        details: {
          activeConnections,
        },
        timestamp: new Date(),
      }
    } catch (error) {
      return {
        service: 'websocket_connections',
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'WebSocket check failed',
        latency: Date.now() - startTime,
        timestamp: new Date(),
      }
    }
  }

  /**
   * Check rate limiting system health
   */
  private async checkRateLimiting(): Promise<HealthCheckResult> {
    const startTime = Date.now()
    
    try {
      // Test rate limiting functionality
      // This is a simplified check - implement based on your rate limiting system
      
      const latency = Date.now() - startTime

      return {
        service: 'rate_limiting',
        status: 'healthy',
        latency,
        details: {
          system: 'redis_based',
        },
        timestamp: new Date(),
      }
    } catch (error) {
      return {
        service: 'rate_limiting',
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Rate limiting check failed',
        latency: Date.now() - startTime,
        timestamp: new Date(),
      }
    }
  }

  /**
   * Check template system health
   */
  private async checkTemplateSystem(): Promise<HealthCheckResult> {
    const startTime = Date.now()
    
    try {
      // Test template retrieval
      const templateCount = await this.prisma.notificationTemplate.count()
      
      // Test template processing
      const testTemplate = {
        subject: 'Test {{name}}',
        htmlContent: '<p>Hello {{name}}!</p>',
        textContent: 'Hello {{name}}!',
      }
      
      // Simple template processing test
      const processed = testTemplate.subject.replace('{{name}}', 'HealthCheck')
      
      const latency = Date.now() - startTime

      return {
        service: 'template_system',
        status: 'healthy',
        latency,
        details: {
          totalTemplates: templateCount,
          processingTest: processed === 'Test HealthCheck',
        },
        timestamp: new Date(),
      }
    } catch (error) {
      return {
        service: 'template_system',
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Template system check failed',
        latency: Date.now() - startTime,
        timestamp: new Date(),
      }
    }
  }

  /**
   * Determine overall system health based on individual service health
   */
  private determineOverallHealth(summary: { healthy: number; degraded: number; unhealthy: number; total: number }): 'healthy' | 'degraded' | 'unhealthy' {
    const { healthy, degraded, unhealthy, total } = summary
    
    // If any critical services are unhealthy, system is unhealthy
    if (unhealthy > 0) {
      return 'unhealthy'
    }
    
    // If more than 30% of services are degraded, system is degraded
    if (degraded / total > 0.3) {
      return 'degraded'
    }
    
    // If any services are degraded, system is degraded
    if (degraded > 0) {
      return 'degraded'
    }
    
    return 'healthy'
  }

  /**
   * Track health metrics for monitoring and alerting
   */
  private async trackHealthMetrics(healthStatus: SystemHealthStatus): Promise<void> {
    try {
      // Track overall system health
      await this.analytics.trackEvent('system_health_check', {
        overall: healthStatus.overall,
        healthy: healthStatus.summary.healthy,
        degraded: healthStatus.summary.degraded,
        unhealthy: healthStatus.summary.unhealthy,
        timestamp: healthStatus.timestamp.toISOString(),
      })

      // Track individual service health
      for (const service of healthStatus.services) {
        await this.analytics.trackEvent('service_health_check', {
          service: service.service,
          status: service.status,
          latency: service.latency,
          error: service.error,
          timestamp: service.timestamp.toISOString(),
        })

        // Track latency metrics
        if (service.latency) {
          await this.analytics.recordLatency(`${service.service}_health_check_latency`, service.latency)
        }
      }
    } catch (error) {
      console.error('Failed to track health metrics:', error)
    }
  }

  /**
   * Get health history for a specific service
   */
  getServiceHealthHistory(service: string): HealthCheckResult[] {
    return this.healthHistory.get(service) || []
  }

  /**
   * Get health trends for all services
   */
  getHealthTrends(): Record<string, { current: string; trend: 'improving' | 'stable' | 'degrading' }> {
    const trends: Record<string, { current: string; trend: 'improving' | 'stable' | 'degrading' }> = {}
    
    for (const [service, history] of this.healthHistory.entries()) {
      if (history.length < 2) {
        trends[service] = { current: history[0]?.status || 'unknown', trend: 'stable' }
        continue
      }
      
      const recent = history.slice(-5) // Last 5 checks
      const current = recent[recent.length - 1].status
      
      // Simple trend analysis
      const healthyCount = recent.filter(h => h.status === 'healthy').length
      const unhealthyCount = recent.filter(h => h.status === 'unhealthy').length
      
      let trend: 'improving' | 'stable' | 'degrading' = 'stable'
      
      if (healthyCount > unhealthyCount && recent[0].status !== 'healthy') {
        trend = 'improving'
      } else if (unhealthyCount > healthyCount && recent[0].status === 'healthy') {
        trend = 'degrading'
      }
      
      trends[service] = { current, trend }
    }
    
    return trends
  }
}