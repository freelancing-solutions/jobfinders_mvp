import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { logger } from '@/lib/logging/logger'
import { rateLimitMiddleware } from '@/middleware/rate-limit'
import { errorHandler } from '@/middleware/error-handler'

// Notification service configuration
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3001'

/**
 * GET /api/notifications/unread-count - Get unread notification count
 */
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting (more lenient for this endpoint as it's called frequently)
    const rateLimitResponse = await rateLimitMiddleware(request, 'api', { requests: 100, windowMs: 60000 })
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
    const type = searchParams.get('type') // Optional: filter by notification type

    // Build query parameters for notification service
    const params = new URLSearchParams({
      userId: session.user.id,
    })

    if (type) params.append('type', type)

    // Fetch unread count from notification service
    const response = await fetch(`${NOTIFICATION_SERVICE_URL}/api/notifications/unread-count?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NOTIFICATION_SERVICE_API_KEY}`,
        // Add cache control for better performance
        'Cache-Control': 'no-cache',
      },
    })

    if (!response.ok) {
      throw new Error(`Notification service error: ${response.status}`)
    }

    const data = await response.json()

    logger.debug('Unread count retrieved successfully', {
      userId: session.user.id,
      count: data.count || 0,
      type,
    })

    return NextResponse.json({
      success: true,
      data: {
        unreadCount: data.count || 0,
        type: type || 'all',
        lastUpdated: data.lastUpdated || new Date().toISOString(),
      },
    })

  } catch (error) {
    return errorHandler(error, request, 'notifications-unread-count')
  }
}