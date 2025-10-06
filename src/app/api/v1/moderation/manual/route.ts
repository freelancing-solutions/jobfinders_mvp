import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limiter'
import { verifyAuth } from '@/lib/auth'
import { 
  contentModerator, 
  ModerationAction 
} from '@/lib/content-moderation'

// POST /api/v1/moderation/manual - Manual moderation by admin
export async function POST(request: NextRequest) {
  try {
    // Rate limiting for admin actions
    const rateLimitResult = await rateLimit('admin-actions', 20, 60000) // 20 requests per minute
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    // Authentication required
    const authResult = await verifyAuth(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Admin privileges required
    if (authResult.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { 
      contentId, 
      action, 
      reason 
    } = body

    // Validate required fields
    if (!contentId || !action || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: contentId, action, reason' },
        { status: 400 }
      )
    }

    // Validate moderation action
    if (!Object.values(ModerationAction).includes(action)) {
      return NextResponse.json(
        { error: 'Invalid moderation action' },
        { status: 400 }
      )
    }

    // Validate reason length
    if (reason.length < 10 || reason.length > 500) {
      return NextResponse.json(
        { error: 'Reason must be between 10 and 500 characters' },
        { status: 400 }
      )
    }

    // Perform manual moderation
    await contentModerator.manualModeration(
      contentId,
      action as ModerationAction,
      reason,
      authResult.user.id
    )

    // Get updated moderation history
    const history = contentModerator.getModerationHistory(contentId)

    return NextResponse.json({
      success: true,
      data: {
        contentId,
        action,
        reason,
        moderatedBy: authResult.user.id,
        timestamp: new Date().toISOString(),
        history
      }
    })

  } catch (error) {
    console.error('Manual moderation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/v1/moderation/manual - Get pending manual reviews
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit('api-general', 30, 60000) // 30 requests per minute
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    // Authentication required
    const authResult = await verifyAuth(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Admin privileges required
    if (authResult.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const riskLevel = searchParams.get('riskLevel')
    const contentType = searchParams.get('contentType')

    // This would typically query a database for pending reviews
    // For now, we'll return a mock response structure
    const pendingReviews = {
      items: [
        // Mock data structure - would be replaced with actual database query
        {
          contentId: 'content_123',
          contentType: 'job_listing',
          riskLevel: 'high',
          reasons: ['spam', 'misleading_information'],
          flaggedAt: new Date().toISOString(),
          content: 'Sample content that needs review...',
          metadata: {
            userId: 'user_456',
            title: 'Sample Job Title'
          }
        }
      ],
      pagination: {
        page,
        limit,
        total: 1,
        totalPages: 1
      },
      filters: {
        riskLevel,
        contentType
      }
    }

    return NextResponse.json({
      success: true,
      data: pendingReviews
    })

  } catch (error) {
    console.error('Manual moderation GET API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}