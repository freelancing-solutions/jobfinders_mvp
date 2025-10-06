import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limiter'
import { verifyAuth } from '@/lib/auth'
import { 
  contentModerator, 
  ContentType, 
  ModerationAction,
  ModerationReason 
} from '@/lib/content-moderation'

// POST /api/v1/moderation - Moderate content
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { 
      contentId, 
      content, 
      contentType, 
      metadata 
    } = body

    // Validate required fields
    if (!contentId || !content || !contentType) {
      return NextResponse.json(
        { error: 'Missing required fields: contentId, content, contentType' },
        { status: 400 }
      )
    }

    // Validate content type
    if (!Object.values(ContentType).includes(contentType)) {
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      )
    }

    // Moderate content
    const result = await contentModerator.moderateContent(
      contentId,
      content,
      contentType as ContentType,
      authResult.user.id,
      metadata
    )

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Content moderation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/v1/moderation - Get moderation history and stats
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit('api-general', 60, 60000) // 60 requests per minute
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

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const contentId = searchParams.get('contentId')
    const timeframe = searchParams.get('timeframe') as 'day' | 'week' | 'month' || 'day'

    if (action === 'history' && contentId) {
      // Get moderation history for specific content
      const history = contentModerator.getModerationHistory(contentId)
      
      return NextResponse.json({
        success: true,
        data: {
          contentId,
          history
        }
      })
    }

    if (action === 'stats') {
      // Get moderation statistics
      const stats = contentModerator.getModerationStats(timeframe)
      
      return NextResponse.json({
        success: true,
        data: {
          timeframe,
          stats
        }
      })
    }

    // Default: return available actions
    return NextResponse.json({
      success: true,
      data: {
        availableActions: ['history', 'stats'],
        contentTypes: Object.values(ContentType),
        moderationActions: Object.values(ModerationAction),
        moderationReasons: Object.values(ModerationReason)
      }
    })

  } catch (error) {
    console.error('Moderation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}