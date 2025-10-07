import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { logger } from '@/lib/logging/logger'
import { rateLimitMiddleware } from '@/middleware/rate-limit'
import { errorHandler } from '@/middleware/error-handler'

// Notification service configuration
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3001'

interface SendNotificationRequest {
  userId: string
  type: 'job_match' | 'application_update' | 'profile_view' | 'system' | 'marketing'
  channel: 'email' | 'sms' | 'push' | 'in_app' | 'all'
  subject: string
  content: string
  data?: Record<string, any>
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  scheduledFor?: Date
}

/**
 * GET /api/notifications - Get user notifications
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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const type = searchParams.get('type')
    const channel = searchParams.get('channel')

    // Build query parameters for notification service
    const params = new URLSearchParams({
      userId: session.user.id,
      page: page.toString(),
      limit: limit.toString(),
    })

    if (unreadOnly) params.append('unreadOnly', 'true')
    if (type) params.append('type', type)
    if (channel) params.append('channel', channel)

    // Fetch notifications from notification service
    const response = await fetch(`${NOTIFICATION_SERVICE_URL}/api/notifications/user?${params}`, {
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

    logger.info('Notifications retrieved successfully', {
      userId: session.user.id,
      count: data.notifications?.length || 0,
      page,
      limit,
      unreadOnly,
    })

    return NextResponse.json({
      success: true,
      data: data.notifications || [],
      pagination: data.pagination || {
        page,
        limit,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    })

  } catch (error) {
    return errorHandler(error, request, 'notifications-get')
  }
}

/**
 * POST /api/notifications - Send a notification
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

    const body: SendNotificationRequest = await request.json()

    // Validate request body
    if (!body.userId || !body.type || !body.channel || !body.subject || !body.content) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, type, channel, subject, content' },
        { status: 400 }
      )
    }

    // Validate user permissions (users can only send notifications to themselves unless admin)
    if (session.user.role !== 'ADMIN' && body.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      )
    }

    // Send notification to notification service
    const response = await fetch(`${NOTIFICATION_SERVICE_URL}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NOTIFICATION_SERVICE_API_KEY}`,
      },
      body: JSON.stringify({
        ...body,
        sentBy: session.user.id,
        timestamp: new Date().toISOString(),
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Notification service error: ${errorData.error || response.status}`)
    }

    const data = await response.json()

    logger.info('Notification sent successfully', {
      notificationId: data.notificationId,
      userId: body.userId,
      type: body.type,
      channel: body.channel,
      sentBy: session.user.id,
    })

    return NextResponse.json({
      success: true,
      data: {
        notificationId: data.notificationId,
        status: data.status,
        scheduledFor: data.scheduledFor,
      },
    })

  } catch (error) {
    return errorHandler(error, request, 'notifications-send')
  }
}

/**
 * PUT /api/notifications - Batch update notifications
 */
export async function PUT(request: NextRequest) {
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
    const { notificationIds, action } = body

    // Validate request body
    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json(
        { error: 'notificationIds array is required' },
        { status: 400 }
      )
    }

    if (!action || !['mark_read', 'mark_unread', 'archive', 'delete'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be one of: mark_read, mark_unread, archive, delete' },
        { status: 400 }
      )
    }

    // Batch update notifications
    const response = await fetch(`${NOTIFICATION_SERVICE_URL}/api/notifications/batch`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NOTIFICATION_SERVICE_API_KEY}`,
      },
      body: JSON.stringify({
        notificationIds,
        action,
        userId: session.user.id, // Ensure user can only update their own notifications
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Notification service error: ${errorData.error || response.status}`)
    }

    const data = await response.json()

    logger.info('Batch notification update completed', {
      userId: session.user.id,
      action,
      notificationCount: notificationIds.length,
      updated: data.updated || 0,
    })

    return NextResponse.json({
      success: true,
      data: {
        updated: data.updated || 0,
        failed: data.failed || 0,
        action,
      },
    })

  } catch (error) {
    return errorHandler(error, request, 'notifications-batch')
  }
}