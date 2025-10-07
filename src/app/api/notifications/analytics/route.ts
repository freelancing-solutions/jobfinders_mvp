import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { logger } from '@/lib/logging/logger'
import { rateLimitMiddleware } from '@/middleware/rate-limit'
import { errorHandler } from '@/middleware/error-handler'

// Notification service configuration
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3001'

interface AnalyticsQuery {
  startDate?: string
  endDate?: string
  type?: string
  channel?: string
  groupBy?: 'hour' | 'day' | 'week' | 'month' | 'type' | 'channel'
}

/**
 * GET /api/notifications/analytics - Get notification analytics
 */
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimitMiddleware(request, 'api')
    if (rateLimitResponse) return rateLimitResponse

    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const query: AnalyticsQuery = {
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      type: searchParams.get('type') || undefined,
      channel: searchParams.get('channel') || undefined,
      groupBy: (searchParams.get('groupBy') as any) || 'day',
    }

    // Build query parameters for notification service
    const params = new URLSearchParams({
      userId: session.user.id,
    })

    if (query.startDate) params.append('startDate', query.startDate)
    if (query.endDate) params.append('endDate', query.endDate)
    if (query.type) params.append('type', query.type)
    if (query.channel) params.append('channel', query.channel)
    if (query.groupBy) params.append('groupBy', query.groupBy)

    // Fetch analytics from notification service
    const response = await fetch(`${NOTIFICATION_SERVICE_URL}/api/notifications/analytics?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NOTIFICATION_SERVICE_API_KEY}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Notification service error: ${response.status}`)
    }

    const data = await response.json()

    logger.info('Analytics retrieved successfully', {
      userId: session.user.id,
      query,
    })

    return NextResponse.json({
      success: true,
      data: data.analytics || {},
      meta: {
        query,
        generatedAt: new Date().toISOString(),
      },
    })

  } catch (error) {
    return errorHandler(error, request, 'notifications-analytics')
  }
}

/**
 * POST /api/notifications/analytics - Track notification event
 */
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimitMiddleware(request, 'api')
    if (rateLimitResponse) return rateLimitResponse

    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { notificationId, eventType, metadata } = body

    // Validate request body
    if (!notificationId || !eventType) {
      return NextResponse.json(
        { error: 'notificationId and eventType are required' },
        { status: 400 }
      )
    }

    const validEventTypes = ['opened', 'clicked', 'dismissed', 'converted']
    if (!validEventTypes.includes(eventType)) {
      return NextResponse.json(
        { error: `Invalid eventType. Must be one of: ${validEventTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Track event in notification service
    const response = await fetch(`${NOTIFICATION_SERVICE_URL}/api/notifications/analytics/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NOTIFICATION_SERVICE_API_KEY}`,
      },
      body: JSON.stringify({
        notificationId,
        eventType,
        userId: session.user.id,
        metadata: metadata || {},
        timestamp: new Date().toISOString(),
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Notification service error: ${errorData.error || response.status}`)
    }

    const data = await response.json()

    logger.info('Analytics event tracked successfully', {
      notificationId,
      userId: session.user.id,
      eventType,
    })

    return NextResponse.json({
      success: true,
      data: {
        eventId: data.eventId,
        tracked: true,
      },
    })

  } catch (error) {
    return errorHandler(error, request, 'notifications-analytics-track')
  }
}