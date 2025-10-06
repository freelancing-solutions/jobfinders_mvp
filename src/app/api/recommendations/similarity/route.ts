import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SimilarityRecommender } from '@/lib/recommendations/similarity-recommender'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type') as 'job' | 'candidate'

    if (!id || !type) {
      return NextResponse.json(
        { error: 'ID and type are required' },
        { status: 400 }
      )
    }

    const limit = parseInt(searchParams.get('limit') || '10')
    const filters = {
      similarityThreshold: searchParams.get('threshold') ? parseFloat(searchParams.get('threshold')!) : undefined,
      excludeApplied: searchParams.get('excludeApplied') === 'true',
      excludeViewed: searchParams.get('excludeViewed') === 'true',
      industries: searchParams.get('industries')?.split(',').map(s => s.trim()).filter(Boolean),
      locations: searchParams.get('locations')?.split(',').map(s => s.trim()).filter(Boolean),
      experienceLevel: searchParams.get('experience')?.split(',').map(s => s.trim()).filter(Boolean)
    }

    logger.info('Getting similarity recommendations', {
      userId: session.user.id,
      id,
      type,
      limit,
      hasFilters: Object.keys(filters).some(key => filters[key as keyof typeof filters] !== undefined)
    })

    const similarityRecommender = new SimilarityRecommender()
    const recommendations = await similarityRecommender.getSimilarItems({
      id,
      type,
      limit,
      filters,
      context: {
        userId: session.user.id,
        sessionId: searchParams.get('sessionId') || undefined,
        searchQuery: searchParams.get('query') || undefined
      }
    })

    return NextResponse.json({
      success: true,
      data: recommendations,
      count: recommendations.length,
      source: { id, type },
      filters
    })
  } catch (error) {
    logger.error('Error getting similarity recommendations', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: session?.user?.id
    })

    return NextResponse.json(
      { error: 'Failed to get similarity recommendations' },
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
    const { sourceId, sourceType, targetId, targetType, feedback } = body

    if (!sourceId || !sourceType || !targetId || !targetType) {
      return NextResponse.json(
        { error: 'Source and target IDs and types are required' },
        { status: 400 }
      )
    }

    logger.info('Recording similarity feedback', {
      userId: session.user.id,
      sourceId,
      sourceType,
      targetId,
      targetType,
      feedback
    })

    // Record similarity feedback for learning
    await prisma?.similarityFeedback.create({
      data: {
        userId: session.user.id,
        sourceId,
        sourceType,
        targetId,
        targetType,
        feedback: feedback || 'neutral',
        timestamp: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Similarity feedback recorded successfully'
    })
  } catch (error) {
    logger.error('Error recording similarity feedback', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: session?.user?.id
    })

    return NextResponse.json(
      { error: 'Failed to record similarity feedback' },
      { status: 500 }
    )
  }
}