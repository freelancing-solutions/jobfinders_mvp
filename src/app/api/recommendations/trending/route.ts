import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TrendingRecommender } from '@/lib/recommendations/trending-recommender'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as 'job' | 'skill' | 'company' | 'industry'

    if (!type) {
      return NextResponse.json(
        { error: 'Type is required' },
        { status: 400 }
      )
    }

    const timeWindow = searchParams.get('timeWindow') as 'day' | 'week' | 'month' | 'quarter' || 'week'
    const limit = parseInt(searchParams.get('limit') || '10')
    const filters = {
      location: searchParams.get('location')?.split(',').map(s => s.trim()).filter(Boolean),
      industry: searchParams.get('industry')?.split(',').map(s => s.trim()).filter(Boolean),
      experienceLevel: searchParams.get('experience')?.split(',').map(s => s.trim()).filter(Boolean),
      salaryRange: searchParams.get('salaryRange') ? {
        min: parseInt(searchParams.get('salaryMin') || '0'),
        max: parseInt(searchParams.get('salaryMax') || '999999')
      } : undefined,
      remoteOnly: searchParams.get('remoteOnly') === 'true'
    }

    const context = {
      userId: session.user.id,
      userRole: session.user.role as 'seeker' | 'employer',
      userSkills: searchParams.get('userSkills')?.split(',').map(s => s.trim()).filter(Boolean),
      userLocation: searchParams.get('userLocation'),
      userIndustry: searchParams.get('userIndustry')
    }

    logger.info('Getting trending recommendations', {
      userId: session.user.id,
      type,
      timeWindow,
      limit,
      hasFilters: Object.keys(filters).some(key => filters[key as keyof typeof filters] !== undefined),
      hasContext: Object.keys(context).some(key => context[key as keyof typeof context] !== undefined)
    })

    const trendingRecommender = new TrendingRecommender()
    const recommendations = await trendingRecommender.getTrendingRecommendations({
      type,
      timeWindow,
      limit,
      filters,
      context
    })

    return NextResponse.json({
      success: true,
      data: recommendations,
      count: recommendations.length,
      type,
      timeWindow,
      filters,
      context
    })
  } catch (error) {
    logger.error('Error getting trending recommendations', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: session?.user?.id
    })

    return NextResponse.json(
      { error: 'Failed to get trending recommendations' },
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
    const { type, itemId, action, engagement } = body

    if (!type || !itemId || !action) {
      return NextResponse.json(
        { error: 'Type, item ID, and action are required' },
        { status: 400 }
      )
    }

    logger.info('Recording trending recommendation engagement', {
      userId: session.user.id,
      type,
      itemId,
      action,
      engagement
    })

    // Record user engagement with trending items
    await prisma?.trendingEngagement.create({
      data: {
        userId: session.user.id,
        type,
        itemId,
        action,
        engagement: engagement || {},
        timestamp: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Engagement recorded successfully'
    })
  } catch (error) {
    logger.error('Error recording trending engagement', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: session?.user?.id
    })

    return NextResponse.json(
      { error: 'Failed to record engagement' },
      { status: 500 }
    )
  }
}