import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { AnalyticsService } from '@/services/matching/analytics-service'
import { MatchMetricsCalculator } from '@/lib/analytics/match-metrics'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const timeRange = searchParams.get('timeRange')
    const industries = searchParams.get('industries')?.split(',')
    const locations = searchParams.get('locations')?.split(',')
    const experienceLevels = searchParams.get('experienceLevels')?.split(',')
    const limit = parseInt(searchParams.get('limit') || '100')

    // Parse time range
    let parsedTimeRange
    if (timeRange) {
      const [start, end] = timeRange.split(',')
      parsedTimeRange = {
        start: new Date(start),
        end: new Date(end),
        type: 'custom' as const
      }
    }

    const filters = {
      timeRange: parsedTimeRange,
      industries: industries?.filter(Boolean),
      locations: locations?.filter(Boolean),
      experienceLevels: experienceLevels?.filter(Boolean)
    }

    const options = {
      includeHistorical: searchParams.get('includeHistorical') === 'true',
      includeComparisons: searchParams.get('includeComparisons') === 'true',
      cacheResults: searchParams.get('cache') !== 'false'
    }

    // Initialize analytics service
    const analyticsService = new AnalyticsService(/* prisma, redis */)

    // Get comprehensive matching analytics
    const matchQualityMetrics = await analyticsService.getMatchQualityMetrics(filters, options)

    return NextResponse.json({
      success: true,
      data: {
        matchQuality: matchQualityMetrics,
        filters,
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    logger.error('Error in matching analytics API', { error })
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to generate matching analytics'
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
    const { matchEvents, filters = {} } = body

    if (!matchEvents || !Array.isArray(matchEvents)) {
      return NextResponse.json(
        { error: 'Invalid request: matchEvents array is required' },
        { status: 400 }
      )
    }

    // Calculate match metrics from raw events
    const matchMetrics = await MatchMetricsCalculator.calculateMatchMetrics(
      matchEvents,
      filters
    )

    return NextResponse.json({
      success: true,
      data: matchMetrics,
      processedEvents: matchEvents.length,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    logger.error('Error in match metrics calculation API', { error })
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to calculate match metrics'
      },
      { status: 500 }
    )
  }
}