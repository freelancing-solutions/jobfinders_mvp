import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { logger } from '@/lib/logging/logger'
import { rateLimitMiddleware } from '@/middleware/rate-limit'
import { errorHandler } from '@/middleware/error-handler'

// Notification service configuration
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3001'

interface UpdateNotificationRequest {
  read?: boolean
  archived?: boolean
}

/**
 * GET /api/notifications/[id] - Get a specific notification
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      )
    }

    // Fetch notification from notification service
    const response = await fetch(`${NOTIFICATION_SERVICE_URL}/api/notifications/${id}?userId=${session.user.id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NOTIFICATION_SERVICE_API_KEY}`,
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 }
        )
      }
      throw new Error(`Notification service error: ${response.status}`)
    }

    const data = await response.json()

    logger.info('Notification retrieved successfully', {
      notificationId: id,
      userId: session.user.id,
    })

    return NextResponse.json({
      success: true,
      data: data.notification,
    })

  } catch (error) {
    return errorHandler(error, request, 'notification-get')
  }
}

/**
 * PUT /api/notifications/[id] - Update a specific notification
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params
    const body: UpdateNotificationRequest = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      )
    }

    // Update notification in notification service
    const response = await fetch(`${NOTIFICATION_SERVICE_URL}/api/notifications/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NOTIFICATION_SERVICE_API_KEY}`,
      },
      body: JSON.stringify({
        ...body,
        userId: session.user.id, // Ensure user can only update their own notifications
        updatedAt: new Date().toISOString(),
      }),
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 }
        )
      }
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Notification service error: ${errorData.error || response.status}`)
    }

    const data = await response.json()

    logger.info('Notification updated successfully', {
      notificationId: id,
      userId: session.user.id,
      updates: body,
    })

    return NextResponse.json({
      success: true,
      data: data.notification,
    })

  } catch (error) {
    return errorHandler(error, request, 'notification-update')
  }
}

/**
 * DELETE /api/notifications/[id] - Delete a specific notification
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      )
    }

    // Delete notification from notification service
    const response = await fetch(`${NOTIFICATION_SERVICE_URL}/api/notifications/${id}?userId=${session.user.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NOTIFICATION_SERVICE_API_KEY}`,
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 }
        )
      }
      throw new Error(`Notification service error: ${response.status}`)
    }

    logger.info('Notification deleted successfully', {
      notificationId: id,
      userId: session.user.id,
    })

    return NextResponse.json({
      success: true,
      message: 'Notification deleted successfully',
    })

  } catch (error) {
    return errorHandler(error, request, 'notification-delete')
  }
}