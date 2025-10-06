import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit-utils'
import { getAuditStatistics } from '@/lib/audit-logger'

/**
 * POST /api/v1/audit/statistics - Get audit statistics
 * Requires admin authentication and rate limiting
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, 'api-general')
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    // Authentication check
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Admin privilege check
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { timeframe } = body

    // Validate timeframe
    if (!['day', 'week', 'month'].includes(timeframe)) {
      return NextResponse.json(
        { error: 'Invalid timeframe. Must be day, week, or month' },
        { status: 400 }
      )
    }

    // Get audit statistics
    const statistics = await getAuditStatistics(timeframe)

    return NextResponse.json({
      success: true,
      data: statistics,
      meta: {
        timeframe,
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Audit statistics error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve audit statistics' },
      { status: 500 }
    )
  }
}