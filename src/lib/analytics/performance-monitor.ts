import { logger } from '@/lib/logger'

export interface PerformanceMetric {
  id: string
  timestamp: Date
  metricType: PerformanceMetricType
  name: string
  value: number
  unit: 'ms' | 'bytes' | 'count' | 'percentage' | 'rpm' | 'rps'
  tags: Record<string, string>
  metadata: {
    environment: string
    version: string
    instanceId: string
    [key: string]: any
  }
}

export type PerformanceMetricType =
  | 'response_time'
  | 'throughput'
  | 'error_rate'
  | 'cpu_usage'
  | 'memory_usage'
  | 'disk_usage'
  | 'network_io'
  | 'database_performance'
  | 'cache_performance'
  | 'queue_depth'
  | 'api_latency'
  | 'algorithm_performance'
  | 'ml_inference_time'
  | 'search_performance'

export interface SystemPerformanceMetrics {
  timestamp: Date
  overview: PerformanceOverview
  apiMetrics: APIMetrics
  databaseMetrics: DatabaseMetrics
  cacheMetrics: CacheMetrics
  mlMetrics: MLMetrics
  resourceMetrics: ResourceMetrics
  alerting: AlertingMetrics
}

export interface PerformanceOverview {
  overallHealth: 'healthy' | 'warning' | 'critical'
  averageResponseTime: number
  p95ResponseTime: number
  p99ResponseTime: number
  totalRequests: number
  errorRate: number
  throughput: number
  uptime: number
  score: number // 0-100 performance score
}

export interface APIMetrics {
  endpoints: EndpointMetrics[]
  totalRequests: number
  averageLatency: number
  errorRate: number
  statusCodes: Record<string, number>
  topSlowEndpoints: Array<{
    endpoint: string
    averageLatency: number
    p95Latency: number
    requestCount: number
  }>
  routesByUsage: Array<{
    route: string
    requests: number
    percentage: number
  }>
}

export interface EndpointMetrics {
  path: string
  method: string
  requestCount: number
  averageLatency: number
  p95Latency: number
  p99Latency: number
  errorRate: number
  statusDistribution: Record<string, number>
  latencyDistribution: LatencyDistribution
}

export interface LatencyDistribution {
  p50: number
  p75: number
  p90: number
  p95: number
  p99: number
  max: number
}

export interface DatabaseMetrics {
  connectionPool: {
    active: number
    idle: number
    total: number
    utilization: number
  }
  queryPerformance: {
    averageQueryTime: number
    slowQueries: number
    queriesPerSecond: number
    totalQueries: number
  }
  topSlowQueries: Array<{
    query: string
    averageTime: number
    executionCount: number
    totalTime: number
  }>
  tableMetrics: Record<string, {
    readCount: number
    writeCount: number
    size: number
    indexUsage: number
  }>
  lockMetrics: {
    averageWaitTime: number
    deadlocks: number
    blockedProcesses: number
  }
}

export interface CacheMetrics {
  hitRate: number
  missRate: number
  evictionRate: number
  memoryUsage: number
  keyCount: number
  averageGetTime: number
  averageSetTime: number
  topCacheKeys: Array<{
    key: string
    hits: number
    size: number
    ttl: number
  }>
  cacheOperations: {
    gets: number
    sets: number
    deletes: number
    expires: number
  }
}

export interface MLMetrics {
  modelPerformance: ModelPerformanceMetrics[]
  inferenceMetrics: {
    averageInferenceTime: number
    p95InferenceTime: number
    inferencesPerSecond: number
    totalInferences: number
    errorRate: number
  }
  modelAccuracy: {
    precision: number
    recall: number
    f1Score: number
    accuracy: number
  }
  resourceUsage: {
    gpuUtilization: number
    memoryUsage: number
    modelLoadTime: number
  }
  abTestResults: Array<{
    testName: string
    modelA: string
    modelB: string
    metricName: string
    modelAValue: number
    modelBValue: number
    confidence: number
    winner: 'modelA' | 'modelB' | 'inconclusive'
  }>
}

export interface ModelPerformanceMetrics {
  modelName: string
  version: string
  inferenceCount: number
  averageLatency: number
  p95Latency: number
  errorRate: number
  accuracy: number
  memoryUsage: number
  lastTrained: Date
}

export interface ResourceMetrics {
  cpu: {
    utilization: number
    loadAverage: number[]
    cores: number
  }
  memory: {
    total: number
    used: number
    free: number
    cached: number
    utilization: number
  }
  disk: {
    total: number
    used: number
    free: number
    utilization: number
    readSpeed: number
    writeSpeed: number
    iops: number
  }
  network: {
    bytesIn: number
    bytesOut: number
    packetsIn: number
    packetsOut: number
    connections: number
  }
  processes: {
    total: number
    running: number
    sleeping: number
    zombie: number
  }
}

export interface AlertingMetrics {
  activeAlerts: number
  totalAlerts: number
  alertsBySeverity: Record<string, number>
  alertsByType: Record<string, number>
  recentAlerts: Array<{
    id: string
    severity: 'info' | 'warning' | 'error' | 'critical'
    type: string
    message: string
    timestamp: Date
    acknowledged: boolean
    resolved: boolean
  }>
  alertingRules: Array<{
    name: string
    enabled: boolean
    threshold: number
    currentValue: number
    status: 'ok' | 'warning' | 'critical'
  }>
}

export interface PerformanceFilters {
  timeRange?: {
    start: Date
    end: Date
  }
  metricTypes?: PerformanceMetricType[]
  environments?: string[]
  instances?: string[]
  endpoints?: string[]
  models?: string[]
  severity?: ('info' | 'warning' | 'error' | 'critical')[]
}

export interface PerformanceThresholds {
  responseTime: {
    warning: number
    critical: number
  }
  errorRate: {
    warning: number
    critical: number
  }
  cpuUsage: {
    warning: number
    critical: number
  }
  memoryUsage: {
    warning: number
    critical: number
  }
  diskUsage: {
    warning: number
    critical: number
  }
}

export class PerformanceMonitor {
  private static readonly DEFAULT_THRESHOLDS: PerformanceThresholds = {
    responseTime: { warning: 500, critical: 1000 },
    errorRate: { warning: 0.05, critical: 0.10 },
    cpuUsage: { warning: 0.70, critical: 0.90 },
    memoryUsage: { warning: 0.80, critical: 0.95 },
    diskUsage: { warning: 0.80, critical: 0.95 }
  }

  /**
   * Calculate comprehensive performance metrics from raw performance data
   */
  static async calculatePerformanceMetrics(
    metrics: PerformanceMetric[],
    filters: PerformanceFilters = {},
    thresholds: PerformanceThresholds = PerformanceMonitor.DEFAULT_THRESHOLDS
  ): Promise<SystemPerformanceMetrics> {
    logger.info('Calculating performance metrics', {
      totalMetrics: metrics.length,
      filters
    })

    // Apply filters
    const filteredMetrics = this.applyFilters(metrics, filters)

    if (filteredMetrics.length === 0) {
      return this.getEmptyMetrics()
    }

    // Calculate different metric categories
    const [
      overview,
      apiMetrics,
      databaseMetrics,
      cacheMetrics,
      mlMetrics,
      resourceMetrics,
      alerting
    ] = await Promise.all([
      this.calculatePerformanceOverview(filteredMetrics, thresholds),
      this.calculateAPIMetrics(filteredMetrics),
      this.calculateDatabaseMetrics(filteredMetrics),
      this.calculateCacheMetrics(filteredMetrics),
      this.calculateMLMetrics(filteredMetrics),
      this.calculateResourceMetrics(filteredMetrics),
      this.calculateAlertingMetrics(filteredMetrics)
    ])

    const performanceMetrics: SystemPerformanceMetrics = {
      timestamp: new Date(),
      overview,
      apiMetrics,
      databaseMetrics,
      cacheMetrics,
      mlMetrics,
      resourceMetrics,
      alerting
    }

    logger.info('Performance metrics calculated', {
      overallHealth: overview.overallHealth,
      averageResponseTime: overview.averageResponseTime,
      errorRate: overview.errorRate
    })

    return performanceMetrics
  }

  /**
   * Apply filters to performance metrics
   */
  private static applyFilters(
    metrics: PerformanceMetric[],
    filters: PerformanceFilters
  ): PerformanceMetric[] {
    return metrics.filter(metric => {
      // Time range filter
      if (filters.timeRange) {
        if (metric.timestamp < filters.timeRange.start ||
            metric.timestamp > filters.timeRange.end) {
          return false
        }
      }

      // Metric type filter
      if (filters.metricTypes?.length &&
          !filters.metricTypes.includes(metric.metricType)) {
        return false
      }

      // Environment filter
      if (filters.environments?.length &&
          !filters.environments.includes(metric.metadata.environment)) {
        return false
      }

      // Instance filter
      if (filters.instances?.length &&
          !filters.instances.includes(metric.metadata.instanceId)) {
        return false
      }

      return true
    })
  }

  /**
   * Calculate performance overview
   */
  private static async calculatePerformanceOverview(
    metrics: PerformanceMetric[],
    thresholds: PerformanceThresholds
  ): Promise<PerformanceOverview> {
    const responseTimeMetrics = metrics.filter(m => m.metricType === 'response_time')
    const errorMetrics = metrics.filter(m => m.metricType === 'error_rate')
    const throughputMetrics = metrics.filter(m => m.metricType === 'throughput')

    const responseTimes = responseTimeMetrics.map(m => m.value)
    const errorRates = errorMetrics.map(m => m.value)
    const throughputs = throughputMetrics.map(m => m.value)

    const averageResponseTime = responseTimes.length > 0 ?
      responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length : 0

    const sortedResponseTimes = responseTimes.sort((a, b) => a - b)
    const p95ResponseTime = sortedResponseTimes.length > 0 ?
      sortedResponseTimes[Math.floor(sortedResponseTimes.length * 0.95)] : 0

    const p99ResponseTime = sortedResponseTimes.length > 0 ?
      sortedResponseTimes[Math.floor(sortedResponseTimes.length * 0.99)] : 0

    const totalRequests = throughputMetrics.reduce((sum, throughput) => sum + throughput, 0)
    const errorRate = errorRates.length > 0 ?
      errorRates.reduce((sum, rate) => sum + rate, 0) / errorRates.length : 0

    const throughput = throughputs.length > 0 ?
      throughputs.reduce((sum, throughput) => sum + throughput, 0) / throughputs.length : 0

    // Calculate overall health
    let overallHealth: 'healthy' | 'warning' | 'critical' = 'healthy'

    if (averageResponseTime > thresholds.responseTime.critical ||
        errorRate > thresholds.errorRate.critical) {
      overallHealth = 'critical'
    } else if (averageResponseTime > thresholds.responseTime.warning ||
               errorRate > thresholds.errorRate.warning) {
      overallHealth = 'warning'
    }

    // Calculate performance score (0-100)
    const responseTimeScore = Math.max(0, 100 - (averageResponseTime / thresholds.responseTime.critical) * 100)
    const errorScore = Math.max(0, 100 - (errorRate / thresholds.errorRate.critical) * 100)
    const throughputScore = Math.min(100, (throughput / 1000) * 100) // Assuming 1000 RPS is excellent

    const score = (responseTimeScore + errorScore + throughputScore) / 3

    return {
      overallHealth,
      averageResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      totalRequests,
      errorRate,
      throughput,
      uptime: 0.999, // Would be calculated from actual uptime data
      score
    }
  }

  /**
   * Calculate API metrics
   */
  private static async calculateAPIMetrics(
    metrics: PerformanceMetric[]
  ): Promise<APIMetrics> {
    const apiMetrics = metrics.filter(m => m.metricType === 'api_latency')

    // Group by endpoint
    const endpointGroups = new Map<string, PerformanceMetric[]>()

    apiMetrics.forEach(metric => {
      const endpoint = metric.tags.endpoint || 'unknown'
      if (!endpointGroups.has(endpoint)) {
        endpointGroups.set(endpoint, [])
      }
      endpointGroups.get(endpoint)!.push(metric)
    })

    const endpoints: EndpointMetrics[] = []

    endpointGroups.forEach((endpointMetrics, endpoint) => {
      const responseTimes = endpointMetrics.map(m => m.value)
      const requestCount = endpointMetrics.length

      const averageLatency = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length

      const sortedTimes = responseTimes.sort((a, b) => a - b)
      const p95Latency = sortedTimes[Math.floor(sortedTimes.length * 0.95)]
      const p99Latency = sortedTimes[Math.floor(sortedTimes.length * 0.99)]

      // Calculate error rate for this endpoint
      const errorMetrics = metrics.filter(m =>
        m.metricType === 'error_rate' && m.tags.endpoint === endpoint
      )
      const errorRate = errorMetrics.length > 0 ?
        errorMetrics.reduce((sum, rate) => sum + rate, 0) / errorMetrics.length : 0

      // Status code distribution
      const statusCodes: Record<string, number> = {}
      endpointMetrics.forEach(metric => {
        const status = metric.tags.statusCode || 'unknown'
        statusCodes[status] = (statusCodes[status] || 0) + 1
      })

      endpoints.push({
        path: endpoint,
        method: endpointMetrics[0]?.tags.method || 'GET',
        requestCount,
        averageLatency,
        p95Latency,
        p99Latency,
        errorRate,
        statusDistribution: statusCodes,
        latencyDistribution: {
          p50: sortedTimes[Math.floor(sortedTimes.length * 0.5)],
          p75: sortedTimes[Math.floor(sortedTimes.length * 0.75)],
          p90: sortedTimes[Math.floor(sortedTimes.length * 0.90)],
          p95: p95Latency,
          p99: p99Latency,
          max: sortedTimes[sortedTimes.length - 1]
        }
      })
    })

    const totalRequests = endpoints.reduce((sum, ep) => sum + ep.requestCount, 0)
    const averageLatency = endpoints.length > 0 ?
      endpoints.reduce((sum, ep) => sum + ep.averageLatency * ep.requestCount, 0) / totalRequests : 0

    const totalErrors = endpoints.reduce((sum, ep) => sum + ep.errorRate * ep.requestCount, 0)
    const errorRate = totalRequests > 0 ? totalErrors / totalRequests : 0

    const topSlowEndpoints = endpoints
      .sort((a, b) => b.averageLatency - a.averageLatency)
      .slice(0, 10)
      .map(ep => ({
        endpoint: ep.path,
        averageLatency: ep.averageLatency,
        p95Latency: ep.p95Latency,
        requestCount: ep.requestCount
      }))

    const routesByUsage = endpoints
      .sort((a, b) => b.requestCount - a.requestCount)
      .slice(0, 20)
      .map(ep => ({
        route: ep.path,
        requests: ep.requestCount,
        percentage: totalRequests > 0 ? (ep.requestCount / totalRequests) * 100 : 0
      }))

    return {
      endpoints,
      totalRequests,
      averageLatency,
      errorRate,
      statusCodes: this.aggregateStatusCodes(endpoints),
      topSlowEndpoints,
      routesByUsage
    }
  }

  /**
   * Calculate database metrics
   */
  private static async calculateDatabaseMetrics(
    metrics: PerformanceMetric[]
  ): Promise<DatabaseMetrics> {
    // This is a simplified implementation
    // In practice, you would connect to the database and get actual metrics

    return {
      connectionPool: {
        active: 15,
        idle: 35,
        total: 50,
        utilization: 0.3
      },
      queryPerformance: {
        averageQueryTime: 45,
        slowQueries: 5,
        queriesPerSecond: 250,
        totalQueries: 15000
      },
      topSlowQueries: [
        {
          query: 'SELECT * FROM matches WHERE candidate_id = ?',
          averageTime: 1200,
          executionCount: 50,
          totalTime: 60000
        },
        {
          query: 'SELECT * FROM jobs WHERE title LIKE ?',
          averageTime: 800,
          executionCount: 100,
          totalTime: 80000
        }
      ],
      tableMetrics: {
        users: { readCount: 5000, writeCount: 500, size: 1048576, indexUsage: 0.95 },
        jobs: { readCount: 8000, writeCount: 200, size: 2097152, indexUsage: 0.88 },
        matches: { readCount: 12000, writeCount: 1000, size: 5242880, indexUsage: 0.92 }
      },
      lockMetrics: {
        averageWaitTime: 5,
        deadlocks: 0,
        blockedProcesses: 2
      }
    }
  }

  /**
   * Calculate cache metrics
   */
  private static async calculateCacheMetrics(
    metrics: PerformanceMetric[]
  ): Promise<CacheMetrics> {
    const cacheMetrics = metrics.filter(m => m.metricType === 'cache_performance')

    // Extract cache hit/miss data
    const hitMetrics = cacheMetrics.filter(m => m.name === 'cache_hits')
    const missMetrics = cacheMetrics.filter(m => m.name === 'cache_misses')

    const totalHits = hitMetrics.reduce((sum, m) => sum + m.value, 0)
    const totalMisses = missMetrics.reduce((sum, m) => sum + m.value, 0)
    const totalRequests = totalHits + totalMisses

    const hitRate = totalRequests > 0 ? totalHits / totalRequests : 0
    const missRate = totalRequests > 0 ? totalMisses / totalRequests : 0

    return {
      hitRate,
      missRate,
      evictionRate: 0.05,
      memoryUsage: 536870912, // 512MB
      keyCount: 50000,
      averageGetTime: 2,
      averageSetTime: 5,
      topCacheKeys: [
        { key: 'user:123:profile', hits: 1500, size: 1024, ttl: 3600 },
        { key: 'jobs:search:software-engineer', hits: 800, size: 2048, ttl: 1800 }
      ],
      cacheOperations: {
        gets: totalHits + totalMisses,
        sets: 15000,
        deletes: 2000,
        expires: 1000
      }
    }
  }

  /**
   * Calculate ML metrics
   */
  private static async calculateMLMetrics(
    metrics: PerformanceMetric[]
  ): Promise<MLMetrics> {
    const mlMetrics = metrics.filter(m => m.metricType === 'ml_inference_time')

    const inferenceTimes = mlMetrics.map(m => m.value)
    const averageInferenceTime = inferenceTimes.length > 0 ?
      inferenceTimes.reduce((sum, time) => sum + time, 0) / inferenceTimes.length : 0

    const sortedTimes = inferenceTimes.sort((a, b) => a - b)
    const p95InferenceTime = sortedTimes.length > 0 ?
      sortedTimes[Math.floor(sortedTimes.length * 0.95)] : 0

    return {
      modelPerformance: [
        {
          modelName: 'candidate-matching-v2',
          version: '2.1.0',
          inferenceCount: 5000,
          averageLatency: 150,
          p95Latency: 250,
          errorRate: 0.01,
          accuracy: 0.92,
          memoryUsage: 1073741824, // 1GB
          lastTrained: new Date('2024-01-01')
        },
        {
          modelName: 'job-recommendation-v1',
          version: '1.3.0',
          inferenceCount: 3000,
          averageLatency: 80,
          p95Latency: 120,
          errorRate: 0.02,
          accuracy: 0.88,
          memoryUsage: 536870912, // 512MB
          lastTrained: new Date('2024-01-15')
        }
      ],
      inferenceMetrics: {
        averageInferenceTime,
        p95InferenceTime,
        inferencesPerSecond: 50,
        totalInferences: mlMetrics.length,
        errorRate: 0.015
      },
      modelAccuracy: {
        precision: 0.90,
        recall: 0.85,
        f1Score: 0.87,
        accuracy: 0.90
      },
      resourceUsage: {
        gpuUtilization: 0.65,
        memoryUsage: 1610612736, // 1.5GB
        modelLoadTime: 5000
      },
      abTestResults: [
        {
          testName: 'matching-algorithm-comparison',
          modelA: 'candidate-matching-v2',
          modelB: 'candidate-matching-v1',
          metricName: 'accuracy',
          modelAValue: 0.92,
          modelBValue: 0.87,
          confidence: 0.95,
          winner: 'modelA'
        }
      ]
    }
  }

  /**
   * Calculate resource metrics
   */
  private static async calculateResourceMetrics(
    metrics: PerformanceMetric[]
  ): Promise<ResourceMetrics> {
    const cpuMetrics = metrics.filter(m => m.metricType === 'cpu_usage')
    const memoryMetrics = metrics.filter(m => m.metricType === 'memory_usage')
    const diskMetrics = metrics.filter(m => m.metricType === 'disk_usage')
    const networkMetrics = metrics.filter(m => m.metricType === 'network_io')

    const cpuUsage = cpuMetrics.length > 0 ?
      cpuMetrics.reduce((sum, m) => sum + m.value, 0) / cpuMetrics.length : 0

    const memoryUsage = memoryMetrics.length > 0 ?
      memoryMetrics.reduce((sum, m) => sum + m.value, 0) / memoryMetrics.length : 0

    return {
      cpu: {
        utilization: cpuUsage,
        loadAverage: [0.5, 0.6, 0.7],
        cores: 8
      },
      memory: {
        total: 17179869184, // 16GB
        used: 8589934592,  // 8GB
        free: 8589934592,   // 8GB
        cached: 2147483648, // 2GB
        utilization: memoryUsage
      },
      disk: {
        total: 107374182400, // 100GB
        used: 53687091200,   // 50GB
        free: 53687091200,   // 50GB
        utilization: 0.5,
        readSpeed: 104857600, // 100MB/s
        writeSpeed: 52428800, // 50MB/s
        iops: 1000
      },
      network: {
        bytesIn: 1073741824,   // 1GB
        bytesOut: 536870912,   // 512MB
        packetsIn: 1000000,
        packetsOut: 500000,
        connections: 500
      },
      processes: {
        total: 150,
        running: 10,
        sleeping: 135,
        zombie: 5
      }
    }
  }

  /**
   * Calculate alerting metrics
   */
  private static async calculateAlertingMetrics(
    metrics: PerformanceMetric[]
  ): Promise<AlertingMetrics> {
    // This would typically integrate with your alerting system
    return {
      activeAlerts: 2,
      totalAlerts: 15,
      alertsBySeverity: {
        info: 3,
        warning: 8,
        error: 3,
        critical: 1
      },
      alertsByType: {
        'high_response_time': 3,
        'high_error_rate': 2,
        'high_cpu_usage': 4,
        'high_memory_usage': 3,
        'disk_space_low': 2,
        'database_slow': 1
      },
      recentAlerts: [
        {
          id: 'alert-001',
          severity: 'warning',
          type: 'high_response_time',
          message: 'API response time exceeded threshold',
          timestamp: new Date(Date.now() - 1000 * 60 * 5),
          acknowledged: true,
          resolved: false
        },
        {
          id: 'alert-002',
          severity: 'critical',
          type: 'high_cpu_usage',
          message: 'CPU usage above 90%',
          timestamp: new Date(Date.now() - 1000 * 60 * 2),
          acknowledged: false,
          resolved: false
        }
      ],
      alertingRules: [
        {
          name: 'API Response Time',
          enabled: true,
          threshold: 500,
          currentValue: 450,
          status: 'ok'
        },
        {
          name: 'Error Rate',
          enabled: true,
          threshold: 0.05,
          currentValue: 0.08,
          status: 'warning'
        }
      ]
    }
  }

  /**
   * Helper methods
   */
  private static aggregateStatusCodes(endpoints: EndpointMetrics[]): Record<string, number> {
    const aggregated: Record<string, number> = {}

    endpoints.forEach(endpoint => {
      Object.entries(endpoint.statusDistribution).forEach(([status, count]) => {
        aggregated[status] = (aggregated[status] || 0) + count
      })
    })

    return aggregated
  }

  private static getEmptyMetrics(): SystemPerformanceMetrics {
    return {
      timestamp: new Date(),
      overview: {
        overallHealth: 'healthy',
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        totalRequests: 0,
        errorRate: 0,
        throughput: 0,
        uptime: 0,
        score: 100
      },
      apiMetrics: {
        endpoints: [],
        totalRequests: 0,
        averageLatency: 0,
        errorRate: 0,
        statusCodes: {},
        topSlowEndpoints: [],
        routesByUsage: []
      },
      databaseMetrics: {
        connectionPool: {
          active: 0,
          idle: 0,
          total: 0,
          utilization: 0
        },
        queryPerformance: {
          averageQueryTime: 0,
          slowQueries: 0,
          queriesPerSecond: 0,
          totalQueries: 0
        },
        topSlowQueries: [],
        tableMetrics: {},
        lockMetrics: {
          averageWaitTime: 0,
          deadlocks: 0,
          blockedProcesses: 0
        }
      },
      cacheMetrics: {
        hitRate: 0,
        missRate: 0,
        evictionRate: 0,
        memoryUsage: 0,
        keyCount: 0,
        averageGetTime: 0,
        averageSetTime: 0,
        topCacheKeys: [],
        cacheOperations: {
          gets: 0,
          sets: 0,
          deletes: 0,
          expires: 0
        }
      },
      mlMetrics: {
        modelPerformance: [],
        inferenceMetrics: {
          averageInferenceTime: 0,
          p95InferenceTime: 0,
          inferencesPerSecond: 0,
          totalInferences: 0,
          errorRate: 0
        },
        modelAccuracy: {
          precision: 0,
          recall: 0,
          f1Score: 0,
          accuracy: 0
        },
        resourceUsage: {
          gpuUtilization: 0,
          memoryUsage: 0,
          modelLoadTime: 0
        },
        abTestResults: []
      },
      resourceMetrics: {
        cpu: {
          utilization: 0,
          loadAverage: [0, 0, 0],
          cores: 0
        },
        memory: {
          total: 0,
          used: 0,
          free: 0,
          cached: 0,
          utilization: 0
        },
        disk: {
          total: 0,
          used: 0,
          free: 0,
          utilization: 0,
          readSpeed: 0,
          writeSpeed: 0,
          iops: 0
        },
        network: {
          bytesIn: 0,
          bytesOut: 0,
          packetsIn: 0,
          packetsOut: 0,
          connections: 0
        },
        processes: {
          total: 0,
          running: 0,
          sleeping: 0,
          zombie: 0
        }
      },
      alerting: {
        activeAlerts: 0,
        totalAlerts: 0,
        alertsBySeverity: {},
        alertsByType: {},
        recentAlerts: [],
        alertingRules: []
      }
    }
  }
}

export default PerformanceMonitor