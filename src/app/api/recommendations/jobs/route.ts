import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { RecommendationEngine } from '@/services/matching/recommendation-engine'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const strategy = searchParams.get('strategy') || 'balanced'
    const filters = {
      location: searchParams.get('location') || undefined,
      remote: searchParams.get('remote') === 'true',
      salaryMin: searchParams.get('salaryMin') ? parseInt(searchParams.get('salaryMin')!) : undefined,
      salaryMax: searchParams.get('salaryMax') ? parseInt(searchParams.get('salaryMax')!) : undefined,
      industry: searchParams.get('industry') || undefined,
      experience: searchParams.get('experience') || undefined
    }

    logger.info('Getting job recommendations', {
      userId: session.user.id,
      limit,
      strategy,
      hasFilters: Object.keys(filters).some(key => filters[key as keyof typeof filters] !== undefined)
    })

    const recommendationEngine = new RecommendationEngine()
    const recommendations = await recommendationEngine.getJobRecommendations({
      userId: session.user.id,
      limit,
      strategy: strategy as any,
      filters
    })

    return NextResponse.json({
      success: true,
      data: recommendations,
      count: recommendations.length,
      strategy,
      filters
    })
  } catch (error) {
    logger.error('Error getting job recommendations', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: session?.user?.id
    })

    return NextResponse.json(
      { error: 'Failed to get job recommendations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { jobId, action, reason } = body

    if (!jobId || !action) {
      return NextResponse.json(
        { error: 'Job ID and action are required' },
        { status: 400 }
      )
    }

    logger.info('Recording recommendation feedback', {
      userId: session.user.id,
      jobId,
      action,
      reason
    })

    const recommendationEngine = new RecommendationEngine()
    await recommendationEngine.recordFeedback({
      userId: session.user.id,
      itemId: jobId,
      itemType: 'job',
      action,
      reason,
      timestamp: new Date()
    })

    return NextResponse.json({
      success: true,
      message: 'Feedback recorded successfully'
    })
  } catch (error) {
    logger.error('Error recording recommendation feedback', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: session?.user?.id
    })

    return NextResponse.json(
      { error: 'Failed to record feedback' },
      { status: 500 }
    )
  }
}