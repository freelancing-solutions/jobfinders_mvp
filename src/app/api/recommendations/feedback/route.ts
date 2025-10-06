import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      recommendationType,
      itemId,
      itemType,
      action,
      rating,
      feedback,
      context,
      metadata
    } = body

    if (!recommendationType || !itemId || !itemType || !action) {
      return NextResponse.json(
        { error: 'Recommendation type, item ID, item type, and action are required' },
        { status: 400 }
      )
    }

    logger.info('Recording recommendation feedback', {
      userId: session.user.id,
      recommendationType,
      itemId,
      itemType,
      action,
      rating,
      hasFeedback: !!feedback,
      hasContext: !!context
    })

    // Record the feedback in the database
    const feedbackRecord = await prisma?.recommendationFeedback.create({
      data: {
        userId: session.user.id,
        recommendationType,
        itemId,
        itemType,
        action,
        rating,
        feedback,
        context: context || {},
        metadata: metadata || {},
        timestamp: new Date()
      }
    })

    // Update recommendation model weights based on feedback
    await updateRecommendationModel(recommendationType, action, rating, session.user.id)

    return NextResponse.json({
      success: true,
      message: 'Feedback recorded successfully',
      feedbackId: feedbackRecord?.id
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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const recommendationType = searchParams.get('type')
    const itemType = searchParams.get('itemType')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const whereClause: any = {
      userId: session.user.id
    }

    if (recommendationType) {
      whereClause.recommendationType = recommendationType
    }

    if (itemType) {
      whereClause.itemType = itemType
    }

    const feedback = await prisma?.recommendationFeedback.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
      include: {
        // Include related data if needed
      }
    })

    const total = await prisma?.recommendationFeedback.count({
      where: whereClause
    })

    return NextResponse.json({
      success: true,
      data: feedback,
      pagination: {
        total,
        limit,
        offset,
        hasMore: (offset + limit) < (total || 0)
      },
      filters: {
        recommendationType,
        itemType
      }
    })
  } catch (error) {
    logger.error('Error getting recommendation feedback', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: session?.user?.id
    })

    return NextResponse.json(
      { error: 'Failed to get feedback' },
      { status: 500 }
    )
  }
}

/**
 * Update recommendation model weights based on feedback
 */
async function updateRecommendationModel(
  recommendationType: string,
  action: string,
  rating: number | undefined,
  userId: string
): Promise<void> {
  try {
    // This would integrate with ML services to update model weights
    // For now, we'll just log the update

    logger.info('Updating recommendation model', {
      recommendationType,
      action,
      rating,
      userId
    })

    // In a real implementation, this would:
    // 1. Send feedback to ML pipeline
    // 2. Update user preference weights
    // 3. Retrain models if sufficient feedback is collected
    // 4. Update recommendation strategies

    // Example integration:
    // await mlPipeline.updateModelWeights({
    //   recommendationType,
    //   feedback: { action, rating },
    //   userId
    // })
  } catch (error) {
    logger.error('Error updating recommendation model', {
      error: error instanceof Error ? error.message : 'Unknown error',
      recommendationType,
      action,
      userId
    })
  }
}