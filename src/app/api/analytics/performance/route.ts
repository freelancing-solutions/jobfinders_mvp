import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PerformanceMonitor } from '@/lib/analytics/performance-monitor'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const timeRange = searchParams.get('timeRange')
    const metricTypes = searchParams.get('metricTypes')?.split(',')
    const environments = searchParams.get('environments')?.split(',')
    const instances = searchParams.get('instances')?.split(',')
    const severity = searchParams.get('severity')?.split(',')

    // Parse time range
    let parsedTimeRange
    if (timeRange) {
      const [start, end] = timeRange.split(',')
      parsedTimeRange = {
        start: new Date(start),
        end: new Date(end)
      }
    }

    const filters = {
      timeRange: parsedTimeRange,
      metricTypes: metricTypes?.filter(Boolean),
      environments: environments?.filter(Boolean),
      instances: instances?.filter(Boolean),
      severity: severity?.filter(Boolean) as any
    }

    // In a real implementation, you would fetch actual performance metrics from your monitoring system
    // For now, we'll generate sample data
    const sampleMetrics = generateSamplePerformanceMetrics(parsedTimeRange)

    // Calculate comprehensive performance metrics
    const performanceMetrics = await PerformanceMonitor.calculatePerformanceMetrics(
      sampleMetrics,
      filters
    )

    return NextResponse.json({
      success: true,
      data: {
        performance: performanceMetrics,
        filters,
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    logger.error('Error in performance analytics API', { error })
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to generate performance analytics'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { metrics, filters = {}, thresholds } = body

    if (!metrics || !Array.isArray(metrics)) {
      return NextResponse.json(
        { error: 'Invalid request: metrics array is required' },
        { status: 400 }
      )
    }

    // Calculate performance metrics from raw data
    const performanceMetrics = await PerformanceMonitor.calculatePerformanceMetrics(
      metrics,
      filters,
      thresholds
    )

    return NextResponse.json({
      success: true,
      data: performanceMetrics,
      processedMetrics: metrics.length,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    logger.error('Error in performance metrics calculation API', { error })
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to calculate performance metrics'
      },
      { status: 500 }
    )
  }
}

// Helper function to generate sample performance metrics
function generateSamplePerformanceMetrics(timeRange?: { start: Date; end: Date }) {
  const now = new Date()
  const start = timeRange?.start || new Date(now.getTime() - 24 * 60 * 60 * 1000) // 24 hours ago
  const end = timeRange?.end || now

  const metrics = []

  // Generate sample metrics every 5 minutes
  let currentTime = new Date(start)
  while (currentTime <= end) {
    // Response time metrics
    metrics.push({
      id: `metric-${currentTime.getTime()}-response-time`,
      timestamp: new Date(currentTime),
      metricType: 'response_time' as const,
      name: 'api_response_time',
      value: 200 + Math.random() * 300, // 200-500ms
      unit: 'ms' as const,
      tags: {
        endpoint: '/api/matching/find-matches',
        method: 'POST',
        statusCode: '200'
      },
      metadata: {
        environment: 'production',
        version: '1.2.0',
        instanceId: 'instance-1'
      }
    })

    // Throughput metrics
    metrics.push({
      id: `metric-${currentTime.getTime()}-throughput`,
      timestamp: new Date(currentTime),
      metricType: 'throughput' as const,
      name: 'requests_per_second',
      value: 50 + Math.random() * 100, // 50-150 RPS
      unit: 'rps' as const,
      tags: {
        endpoint: 'all'
      },
      metadata: {
        environment: 'production',
        version: '1.2.0',
        instanceId: 'instance-1'
      }
    })

    // Error rate metrics
    metrics.push({
      id: `metric-${currentTime.getTime()}-error-rate`,
      timestamp: new Date(currentTime),
      metricType: 'error_rate' as const,
      name: 'error_rate',
      value: Math.random() * 0.05, // 0-5%
      unit: 'percentage' as const,
      tags: {
        endpoint: 'all'
      },
      metadata: {
        environment: 'production',
        version: '1.2.0',
        instanceId: 'instance-1'
      }
    })

    // CPU usage metrics
    metrics.push({
      id: `metric-${currentTime.getTime()}-cpu`,
      timestamp: new Date(currentTime),
      metricType: 'cpu_usage' as const,
      name: 'cpu_utilization',
      value: 0.3 + Math.random() * 0.4, // 30-70%
      unit: 'percentage' as const,
      tags: {},
      metadata: {
        environment: 'production',
        version: '1.2.0',
        instanceId: 'instance-1'
      }
    })

    // Memory usage metrics
    metrics.push({
      id: `metric-${currentTime.getTime()}-memory`,
      timestamp: new Date(currentTime),
      metricType: 'memory_usage' as const,
      name: 'memory_utilization',
      value: 0.5 + Math.random() * 0.3, // 50-80%
      unit: 'percentage' as const,
      tags: {},
      metadata: {
        environment: 'production',
        version: '1.2.0',
        instanceId: 'instance-1'
      }
    })

    currentTime = new Date(currentTime.getTime() + 5 * 60 * 1000) // Add 5 minutes
  }

  return metrics
}