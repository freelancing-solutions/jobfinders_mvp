import { NotificationAnalyticsEngine } from '../analytics-engine'
import { SystemHealthStatus, HealthCheckResult } from './health-check'
import { PrismaClient } from '@prisma/client'
import { EventQueue } from '../../../lib/queue/event-queue'

export interface AlertRule {
  id: string
  name: string
  description: string
  type: 'threshold' | 'anomaly' | 'health' | 'rate'
  severity: 'low' | 'medium' | 'high' | 'critical'
  enabled: boolean
  conditions: AlertCondition[]
  actions: AlertAction[]
  cooldownMinutes: number
  createdAt: Date
  updatedAt: Date
}

export interface AlertCondition {
  metric: string
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'contains' | 'not_contains'
  value: number | string
  timeWindow?: number // minutes
}

export interface AlertAction {
  type: 'email' | 'webhook' | 'slack' | 'pagerduty'
  target: string
  template?: string
}

export interface Alert {
  id: string
  ruleId: string
  ruleName: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  details: Record<string, any>
  status: 'active' | 'resolved' | 'suppressed'
  triggeredAt: Date
  resolvedAt?: Date
  acknowledgedAt?: Date
  acknowledgedBy?: string
}

export class NotificationAlertManager {
  private prisma: PrismaClient
  private analytics: NotificationAnalyticsEngine
  private eventQueue: EventQueue
  private alertRules: Map<string, AlertRule> = new Map()
  private activeAlerts: Map<string, Alert> = new Map()
  private alertCooldowns: Map<string, Date> = new Map()

  constructor(
    prisma: PrismaClient,
    analytics: NotificationAnalyticsEngine,
    eventQueue: EventQueue
  ) {
    this.prisma = prisma
    this.analytics = analytics
    this.eventQueue = eventQueue
    this.initializeDefaultRules()
  }

  /**
   * Initialize default alert rules
   */
  private initializeDefaultRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'high-failure-rate',
        name: 'High Delivery Failure Rate',
        description: 'Alert when delivery failure rate exceeds 10% in the last hour',
        type: 'threshold',
        severity: 'high',
        enabled: true,
        conditions: [
          {
            metric: 'delivery_failure_rate',
            operator: 'gt',
            value: 0.1,
            timeWindow: 60,
          },
        ],
        actions: [
          {
            type: 'email',
            target: 'alerts@jobfinders.com',
            template: 'high-failure-rate',
          },
          {
            type: 'slack',
            target: '#alerts',
          },
        ],
        cooldownMinutes: 30,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'queue-backlog',
        name: 'Queue Backlog Alert',
        description: 'Alert when notification queue has more than 1000 pending jobs',
        type: 'threshold',
        severity: 'medium',
        enabled: true,
        conditions: [
          {
            metric: 'queue_pending_jobs',
            operator: 'gt',
            value: 1000,
          },
        ],
        actions: [
          {
            type: 'email',
            target: 'ops@jobfinders.com',
          },
        ],
        cooldownMinutes: 15,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'system-unhealthy',
        name: 'System Health Critical',
        description: 'Alert when overall system health is unhealthy',
        type: 'health',
        severity: 'critical',
        enabled: true,
        conditions: [
          {
            metric: 'system_health',
            operator: 'eq',
            value: 'unhealthy',
          },
        ],
        actions: [
          {
            type: 'email',
            target: 'oncall@jobfinders.com',
          },
          {
            type: 'pagerduty',
            target: 'notification-system',
          },
        ],
        cooldownMinutes: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'high-latency',
        name: 'High Delivery Latency',
        description: 'Alert when average delivery latency exceeds 30 seconds',
        type: 'threshold',
        severity: 'medium',
        enabled: true,
        conditions: [
          {
            metric: 'avg_delivery_latency',
            operator: 'gt',
            value: 30000, // 30 seconds in milliseconds
            timeWindow: 15,
          },
        ],
        actions: [
          {
            type: 'email',
            target: 'performance@jobfinders.com',
          },
        ],
        cooldownMinutes: 20,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'email-bounce-rate',
        name: 'High Email Bounce Rate',
        description: 'Alert when email bounce rate exceeds 5% in the last hour',
        type: 'threshold',
        severity: 'medium',
        enabled: true,
        conditions: [
          {
            metric: 'email_bounce_rate',
            operator: 'gt',
            value: 0.05,
            timeWindow: 60,
          },
        ],
        actions: [
          {
            type: 'email',
            target: 'deliverability@jobfinders.com',
          },
        ],
        cooldownMinutes: 60,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    defaultRules.forEach(rule => {
      this.alertRules.set(rule.id, rule)
    })
  }

  /**
   * Check all alert rules against current metrics
   */
  async checkAlerts(): Promise<Alert[]> {
    const triggeredAlerts: Alert[] = []

    for (const rule of this.alertRules.values()) {
      if (!rule.enabled) continue

      // Check cooldown
      const lastTriggered = this.alertCooldowns.get(rule.id)
      if (lastTriggered && Date.now() - lastTriggered.getTime() < rule.cooldownMinutes * 60 * 1000) {
        continue
      }

      try {
        const isTriggered = await this.evaluateRule(rule)
        
        if (isTriggered) {
          const alert = await this.createAlert(rule)
          triggeredAlerts.push(alert)
          this.alertCooldowns.set(rule.id, new Date())
        }
      } catch (error) {
        console.error(`Error evaluating alert rule ${rule.id}:`, error)
      }
    }

    return triggeredAlerts
  }

  /**
   * Evaluate a single alert rule
   */
  private async evaluateRule(rule: AlertRule): Promise<boolean> {
    for (const condition of rule.conditions) {
      const isConditionMet = await this.evaluateCondition(condition)
      if (!isConditionMet) {
        return false // All conditions must be met
      }
    }
    return true
  }

  /**
   * Evaluate a single alert condition
   */
  private async evaluateCondition(condition: AlertCondition): Promise<boolean> {
    let actualValue: number | string

    switch (condition.metric) {
      case 'delivery_failure_rate':
        actualValue = await this.getDeliveryFailureRate(condition.timeWindow || 60)
        break
      
      case 'queue_pending_jobs':
        actualValue = await this.getQueuePendingJobs()
        break
      
      case 'system_health':
        actualValue = await this.getSystemHealthStatus()
        break
      
      case 'avg_delivery_latency':
        actualValue = await this.getAverageDeliveryLatency(condition.timeWindow || 15)
        break
      
      case 'email_bounce_rate':
        actualValue = await this.getEmailBounceRate(condition.timeWindow || 60)
        break
      
      default:
        console.warn(`Unknown metric: ${condition.metric}`)
        return false
    }

    return this.compareValues(actualValue, condition.operator, condition.value)
  }

  /**
   * Compare values based on operator
   */
  private compareValues(actual: number | string, operator: string, expected: number | string): boolean {
    switch (operator) {
      case 'gt':
        return Number(actual) > Number(expected)
      case 'lt':
        return Number(actual) < Number(expected)
      case 'eq':
        return actual === expected
      case 'gte':
        return Number(actual) >= Number(expected)
      case 'lte':
        return Number(actual) <= Number(expected)
      case 'contains':
        return String(actual).includes(String(expected))
      case 'not_contains':
        return !String(actual).includes(String(expected))
      default:
        return false
    }
  }

  /**
   * Get delivery failure rate for the specified time window
   */
  private async getDeliveryFailureRate(timeWindowMinutes: number): Promise<number> {
    const startTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000)
    
    const metrics = await this.analytics.getDeliveryMetrics({
      startDate: startTime,
      endDate: new Date(),
    })

    if (metrics.totalDeliveries === 0) return 0
    
    return metrics.failedDeliveries / metrics.totalDeliveries
  }

  /**
   * Get number of pending jobs in the queue
   */
  private async getQueuePendingJobs(): Promise<number> {
    const queueStats = await this.eventQueue.getQueueStats()
    return queueStats.waiting || 0
  }

  /**
   * Get current system health status
   */
  private async getSystemHealthStatus(): Promise<string> {
    // This would integrate with your health check system
    // For now, return a placeholder
    return 'healthy'
  }

  /**
   * Get average delivery latency for the specified time window
   */
  private async getAverageDeliveryLatency(timeWindowMinutes: number): Promise<number> {
    const startTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000)
    
    const result = await this.prisma.notificationDeliveryLog.aggregate({
      where: {
        createdAt: {
          gte: startTime,
        },
        deliveredAt: {
          not: null,
        },
      },
      _avg: {
        latency: true,
      },
    })

    return result._avg.latency || 0
  }

  /**
   * Get email bounce rate for the specified time window
   */
  private async getEmailBounceRate(timeWindowMinutes: number): Promise<number> {
    const startTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000)
    
    const totalEmails = await this.prisma.notificationDeliveryLog.count({
      where: {
        channel: 'EMAIL',
        createdAt: {
          gte: startTime,
        },
      },
    })

    if (totalEmails === 0) return 0

    const bouncedEmails = await this.prisma.notificationDeliveryLog.count({
      where: {
        channel: 'EMAIL',
        status: 'BOUNCED',
        createdAt: {
          gte: startTime,
        },
      },
    })

    return bouncedEmails / totalEmails
  }

  /**
   * Create an alert from a triggered rule
   */
  private async createAlert(rule: AlertRule): Promise<Alert> {
    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      message: await this.generateAlertMessage(rule),
      details: await this.gatherAlertDetails(rule),
      status: 'active',
      triggeredAt: new Date(),
    }

    this.activeAlerts.set(alert.id, alert)

    // Execute alert actions
    await this.executeAlertActions(alert, rule.actions)

    // Track alert in analytics
    await this.analytics.trackEvent('alert_triggered', {
      alertId: alert.id,
      ruleId: rule.id,
      severity: rule.severity,
      message: alert.message,
    })

    return alert
  }

  /**
   * Generate alert message based on rule and current conditions
   */
  private async generateAlertMessage(rule: AlertRule): Promise<string> {
    const details = await this.gatherAlertDetails(rule)
    
    switch (rule.id) {
      case 'high-failure-rate':
        return `High delivery failure rate detected: ${(details.failureRate * 100).toFixed(2)}% in the last hour`
      
      case 'queue-backlog':
        return `Queue backlog alert: ${details.pendingJobs} pending jobs`
      
      case 'system-unhealthy':
        return `System health is critical: ${details.healthStatus}`
      
      case 'high-latency':
        return `High delivery latency detected: ${details.avgLatency}ms average`
      
      case 'email-bounce-rate':
        return `High email bounce rate: ${(details.bounceRate * 100).toFixed(2)}% in the last hour`
      
      default:
        return `Alert triggered for rule: ${rule.name}`
    }
  }

  /**
   * Gather detailed information for the alert
   */
  private async gatherAlertDetails(rule: AlertRule): Promise<Record<string, any>> {
    const details: Record<string, any> = {}

    for (const condition of rule.conditions) {
      switch (condition.metric) {
        case 'delivery_failure_rate':
          details.failureRate = await this.getDeliveryFailureRate(condition.timeWindow || 60)
          break
        
        case 'queue_pending_jobs':
          details.pendingJobs = await this.getQueuePendingJobs()
          break
        
        case 'system_health':
          details.healthStatus = await this.getSystemHealthStatus()
          break
        
        case 'avg_delivery_latency':
          details.avgLatency = await this.getAverageDeliveryLatency(condition.timeWindow || 15)
          break
        
        case 'email_bounce_rate':
          details.bounceRate = await this.getEmailBounceRate(condition.timeWindow || 60)
          break
      }
    }

    return details
  }

  /**
   * Execute alert actions (send notifications, webhooks, etc.)
   */
  private async executeAlertActions(alert: Alert, actions: AlertAction[]): Promise<void> {
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'email':
            await this.sendEmailAlert(alert, action)
            break
          
          case 'webhook':
            await this.sendWebhookAlert(alert, action)
            break
          
          case 'slack':
            await this.sendSlackAlert(alert, action)
            break
          
          case 'pagerduty':
            await this.sendPagerDutyAlert(alert, action)
            break
        }
      } catch (error) {
        console.error(`Failed to execute alert action ${action.type}:`, error)
      }
    }
  }

  /**
   * Send email alert
   */
  private async sendEmailAlert(alert: Alert, action: AlertAction): Promise<void> {
    // Queue email alert for sending
    await this.eventQueue.addJob('send-alert-email', {
      to: action.target,
      subject: `[${alert.severity.toUpperCase()}] ${alert.message}`,
      template: action.template || 'default-alert',
      data: {
        alert,
        timestamp: new Date().toISOString(),
      },
    })
  }

  /**
   * Send webhook alert
   */
  private async sendWebhookAlert(alert: Alert, action: AlertAction): Promise<void> {
    // Queue webhook for sending
    await this.eventQueue.addJob('send-webhook', {
      url: action.target,
      method: 'POST',
      data: {
        alert,
        timestamp: new Date().toISOString(),
      },
    })
  }

  /**
   * Send Slack alert
   */
  private async sendSlackAlert(alert: Alert, action: AlertAction): Promise<void> {
    // Queue Slack message for sending
    await this.eventQueue.addJob('send-slack-message', {
      channel: action.target,
      message: `🚨 *${alert.severity.toUpperCase()}*: ${alert.message}`,
      alert,
    })
  }

  /**
   * Send PagerDuty alert
   */
  private async sendPagerDutyAlert(alert: Alert, action: AlertAction): Promise<void> {
    // Queue PagerDuty incident for creation
    await this.eventQueue.addJob('create-pagerduty-incident', {
      service: action.target,
      summary: alert.message,
      severity: alert.severity,
      alert,
    })
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId)
    if (alert) {
      alert.acknowledgedAt = new Date()
      alert.acknowledgedBy = acknowledgedBy
      
      await this.analytics.trackEvent('alert_acknowledged', {
        alertId,
        acknowledgedBy,
      })
    }
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId)
    if (alert) {
      alert.status = 'resolved'
      alert.resolvedAt = new Date()
      
      await this.analytics.trackEvent('alert_resolved', {
        alertId,
        duration: alert.resolvedAt.getTime() - alert.triggeredAt.getTime(),
      })
    }
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values()).filter(alert => alert.status === 'active')
  }

  /**
   * Add or update an alert rule
   */
  setAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule)
  }

  /**
   * Remove an alert rule
   */
  removeAlertRule(ruleId: string): void {
    this.alertRules.delete(ruleId)
  }

  /**
   * Get all alert rules
   */
  getAlertRules(): AlertRule[] {
    return Array.from(this.alertRules.values())
  }
}