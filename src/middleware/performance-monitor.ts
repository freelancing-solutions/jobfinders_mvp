import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export interface PerformanceMetrics {
  requestId: string
  method: string
  url: string
  userAgent: string
  ip: string
  startTime: number
  endTime?: number
  duration?: number
  memoryUsage?: NodeJS.MemoryUsage
  cpuUsage?: NodeJS.CpuUsage
  statusCode?: number
  responseSize?: number
  cacheHit?: boolean
  dbQueries?: number
  errors?: string[]
  warnings?: string[]
}

export interface PerformanceThresholds {
  maxResponseTime: number
  maxMemoryUsage: number
  maxCpuUsage: number
  maxDbQueries: number
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, PerformanceMetrics> = new Map()
  private thresholds: PerformanceThresholds
  private alertCallbacks: Array<(metrics: PerformanceMetrics) => void> = []

  private constructor() {
    this.thresholds = {
      maxResponseTime: 2000, // 2 seconds
      maxMemoryUsage: 500 * 1024 * 1024, // 500MB
      maxCpuUsage: 80, // 80%
      maxDbQueries: 50
    }

    this.startMonitoring()
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  /**
   * Start monitoring a request
   */
  public startRequest(request: NextRequest): string {
    const requestId = this.generateRequestId()
    const metrics: PerformanceMetrics = {
      requestId,
      method: request.method,
      url: request.url,
      userAgent: request.headers.get('user-agent') || 'unknown',
      ip: this.getClientIP(request),
      startTime: Date.now(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      errors: [],
      warnings: []
    }

    this.metrics.set(requestId, metrics)
    return requestId
  }

  /**
   * End monitoring a request
   */
  public endRequest(
    requestId: string,
    response: NextResponse,
    additionalMetrics: Partial<PerformanceMetrics> = {}
  ): PerformanceMetrics | null {
    const metrics = this.metrics.get(requestId)
    if (!metrics) {
      return null
    }

    metrics.endTime = Date.now()
    metrics.duration = metrics.endTime - metrics.startTime
    metrics.statusCode = response.status
    metrics.responseSize = this.getResponseSize(response)

    // Merge additional metrics
    Object.assign(metrics, additionalMetrics)

    // Check for performance issues
    this.checkPerformanceIssues(metrics)

    // Log metrics
    this.logMetrics(metrics)

    // Clean up
    this.metrics.delete(requestId)

    return metrics
  }

  /**
   * Add error to request metrics
   */
  public addError(requestId: string, error: string): void {
    const metrics = this.metrics.get(requestId)
    if (metrics) {
      metrics.errors?.push(error)
    }
  }

  /**
   * Add warning to request metrics
   */
  public addWarning(requestId: string, warning: string): void {
    const metrics = this.metrics.get(requestId)
    if (metrics) {
      metrics.warnings?.push(warning)
    }
  }

  /**
   * Set cache hit status
   */
  public setCacheHit(requestId: string, hit: boolean): void {
    const metrics = this.metrics.get(requestId)
    if (metrics) {
      metrics.cacheHit = hit
    }
  }

  /**
   * Increment database query count
   */
  public incrementDbQueries(requestId: string): void {
    const metrics = this.metrics.get(requestId)
    if (metrics) {
      metrics.dbQueries = (metrics.dbQueries || 0) + 1
    }
  }

  /**
   * Get performance summary
   */
  public getSummary(timeRange: number = 3600000): { // 1 hour default
    now: number
    timeRange: number
    totalRequests: number
    averageResponseTime: number
    slowestRequest: PerformanceMetrics | null
    fastestRequest: PerformanceMetrics | null
    errorRate: number
    cacheHitRate: number
    averageMemoryUsage: number
    topErrors: Array<{ error: string; count: number }>
    topSlowEndpoints: Array<{ url: string; avgDuration: number; count: number }>
  } {
    const now = Date.now()
    const cutoff = now - timeRange
    const allMetrics = Array.from(this.metrics.values())
      .filter(m => m.startTime >= cutoff)

    if (allMetrics.length === 0) {
      return {
        now,
        timeRange,
        totalRequests: 0,
        averageResponseTime: 0,
        slowestRequest: null,
        fastestRequest: null,
        errorRate: 0,
        cacheHitRate: 0,
        averageMemoryUsage: 0,
        topErrors: [],
        topSlowEndpoints: []
      }
    }

    const completedMetrics = allMetrics.filter(m => m.duration !== undefined)
    const requestsWithDuration = completedMetrics.length

    const averageResponseTime = requestsWithDuration > 0
      ? completedMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / requestsWithDuration
      : 0

    const slowestRequest = requestsWithDuration > 0
      ? completedMetrics.reduce((slowest, current) =>
          (current.duration || 0) > (slowest.duration || 0) ? current : slowest
        )
      : null

    const fastestRequest = requestsWithDuration > 0
      ? completedMetrics.reduce((fastest, current) =>
          (current.duration || 0) < (fastest.duration || 0) ? current : fastest
        )
      : null

    const errorCount = allMetrics.filter(m => m.errors && m.errors.length > 0).length
    const errorRate = allMetrics.length > 0 ? errorCount / allMetrics.length : 0

    const cacheHits = allMetrics.filter(m => m.cacheHit === true).length
    const cacheHitRate = allMetrics.length > 0 ? cacheHits / allMetrics.length : 0

    const averageMemoryUsage = allMetrics.length > 0
      ? allMetrics.reduce((sum, m) => sum + (m.memoryUsage?.heapUsed || 0), 0) / allMetrics.length
      : 0

    // Top errors
    const errorCounts = new Map<string, number>()
    allMetrics.forEach(m => {
      m.errors?.forEach(error => {
        errorCounts.set(error, (errorCounts.get(error) || 0) + 1)
      })
    })

    const topErrors = Array.from(errorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([error, count]) => ({ error, count }))

    // Top slow endpoints
    const endpointStats = new Map<string, { totalDuration: number; count: number }>()
    allMetrics.forEach(m => {
      if (m.duration) {
        const url = this.sanitizeUrl(m.url)
        const current = endpointStats.get(url) || { totalDuration: 0, count: 0 }
        endpointStats.set(url, {
          totalDuration: current.totalDuration + m.duration,
          count: current.count + 1
        })
      }
    })

    const topSlowEndpoints = Array.from(endpointStats.entries())
      .map(([url, stats]) => ({
        url,
        avgDuration: stats.totalDuration / stats.count,
        count: stats.count
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 5)

    return {
      now,
      timeRange,
      totalRequests: allMetrics.length,
      averageResponseTime,
      slowestRequest,
      fastestRequest,
      errorRate,
      cacheHitRate,
      averageMemoryUsage,
      topErrors,
      topSlowEndpoints
    }
  }

  /**
   * Set performance thresholds
   */
  public setThresholds(thresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds }
  }

  /**
   * Add alert callback
   */
  public addAlertCallback(callback: (metrics: PerformanceMetrics) => void): void {
    this.alertCallbacks.push(callback)
  }

  /**
   * Get current metrics
   */
  public getCurrentMetrics(): PerformanceMetrics[] {
    return Array.from(this.metrics.values())
  }

  /**
   * Clear old metrics
   */
  public clearOldMetrics(maxAge: number = 3600000): void { // 1 hour default
    const cutoff = Date.now() - maxAge
    for (const [requestId, metrics] of this.metrics.entries()) {
      if (metrics.startTime < cutoff) {
        this.metrics.delete(requestId)
      }
    }
  }

  /**
   * Check for performance issues
   */
  private checkPerformanceIssues(metrics: PerformanceMetrics): void {
    const issues: string[] = []

    if (metrics.duration && metrics.duration > this.thresholds.maxResponseTime) {
      issues.push(`Slow response time: ${metrics.duration}ms`)
    }

    if (metrics.memoryUsage && metrics.memoryUsage.heapUsed > this.thresholds.maxMemoryUsage) {
      issues.push(`High memory usage: ${Math.round(metrics.memoryUsage.heapUsed / 1024 / 1024)}MB`)
    }

    if (metrics.dbQueries && metrics.dbQueries > this.thresholds.maxDbQueries) {
      issues.push(`Too many database queries: ${metrics.dbQueries}`)
    }

    if (metrics.errors && metrics.errors.length > 0) {
      issues.push(`Request had ${metrics.errors.length} errors`)
    }

    if (issues.length > 0) {
      logger.warn('Performance issues detected', {
        requestId: metrics.requestId,
        url: metrics.url,
        duration: metrics.duration,
        issues
      })

      // Trigger alert callbacks
      this.alertCallbacks.forEach(callback => {
        try {
          callback(metrics)
        } catch (error) {
          logger.error('Error in performance alert callback', { error })
        }
      })
    }
  }

  /**
   * Log metrics
   */
  private logMetrics(metrics: PerformanceMetrics): void {
    const logLevel = this.getLogLevel(metrics)
    const logData = {
      requestId: metrics.requestId,
      method: metrics.method,
      url: this.sanitizeUrl(metrics.url),
      statusCode: metrics.statusCode,
      duration: metrics.duration,
      memoryUsage: metrics.memoryUsage ? Math.round(metrics.memoryUsage.heapUsed / 1024 / 1024) : undefined,
      dbQueries: metrics.dbQueries,
      cacheHit: metrics.cacheHit,
      errors: metrics.errors?.length || 0,
      warnings: metrics.warnings?.length || 0
    }

    if (logLevel === 'error') {
      logger.error('Request performance metrics', logData)
    } else if (logLevel === 'warn') {
      logger.warn('Request performance metrics', logData)
    } else {
      logger.info('Request performance metrics', logData)
    }
  }

  /**
   * Get log level based on metrics
   */
  private getLogLevel(metrics: PerformanceMetrics): 'info' | 'warn' | 'error' {
    if (metrics.errors && metrics.errors.length > 0) {
      return 'error'
    }

    if (metrics.duration && metrics.duration > this.thresholds.maxResponseTime) {
      return 'warn'
    }

    if (metrics.statusCode && metrics.statusCode >= 500) {
      return 'error'
    }

    if (metrics.statusCode && metrics.statusCode >= 400) {
      return 'warn'
    }

    return 'info'
  }

  /**
   * Start background monitoring
   */
  private startMonitoring(): void {
    // Cleanup old metrics every 5 minutes
    setInterval(() => {
      this.clearOldMetrics()
    }, 300000)

    // Log performance summary every 10 minutes
    setInterval(() => {
      const summary = this.getSummary()
      logger.info('Performance summary', summary)
    }, 600000)

    // Monitor memory usage
    setInterval(() => {
      const memUsage = process.memoryUsage()
      if (memUsage.heapUsed > this.thresholds.maxMemoryUsage) {
        logger.warn('High memory usage detected', {
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
          external: Math.round(memUsage.external / 1024 / 1024)
        })
      }
    }, 30000) // Every 30 seconds
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get client IP from request
   */
  private getClientIP(request: NextRequest): string {
    return request.headers.get('x-forwarded-for') ||
           request.headers.get('x-real-ip') ||
           request.ip ||
           'unknown'
  }

  /**
   * Get response size
   */
  private getResponseSize(response: NextResponse): number {
    const contentLength = response.headers.get('content-length')
    return contentLength ? parseInt(contentLength) : 0
  }

  /**
   * Sanitize URL for logging
   */
  private sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url)
      return `${urlObj.pathname}${urlObj.search}`
    } catch {
      return url
    }
  }
}

/**
 * Performance monitoring middleware
 */
export function performanceMonitor() {
  const monitor = PerformanceMonitor.getInstance()

  return async (request: NextRequest, next: () => Promise<NextResponse>) => {
    const requestId = monitor.startRequest(request)

    try {
      const response = await next()

      // Add performance headers
      response.headers.set('X-Request-ID', requestId)
      response.headers.set('X-Response-Time', `${Date.now() - parseInt(requestId.split('_')[1])}ms`)

      monitor.endRequest(requestId, response)

      return response
    } catch (error) {
      monitor.addError(requestId, error instanceof Error ? error.message : 'Unknown error')

      const errorResponse = NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )

      errorResponse.headers.set('X-Request-ID', requestId)
      monitor.endRequest(requestId, errorResponse)

      throw error
    }
  }
}

/**
 * Performance monitoring decorator for functions
 */
export function monitorPerformance(name?: string) {
  const monitor = PerformanceMonitor.getInstance()

  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now()
      const functionName = name || `${target.constructor.name}.${propertyName}`

      try {
        const result = await method.apply(this, args)
        const duration = Date.now() - startTime

        logger.debug('Function performance', {
          function: functionName,
          duration,
          success: true
        })

        return result
      } catch (error) {
        const duration = Date.now() - startTime

        logger.error('Function performance', {
          function: functionName,
          duration,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })

        throw error
      }
    }

    return descriptor
  }
}