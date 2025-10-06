import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { logger } from '@/lib/logging/logger';
import { rateLimitMiddleware } from '@/middleware/rate-limit';
import { errorHandler } from '@/middleware/error-handler';
import { z } from 'zod';

const feedbackSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().max(1000).optional(),
  helpful: z.boolean().optional(),
  relevant: z.boolean().optional(),
  contactStatus: z.enum(['not_contacted', 'contacted', 'responded', 'interview_scheduled', 'rejected', 'hired']).optional(),
  recommendationAccuracy: z.number().min(1).max(5).optional(),
  wouldRecommend: z.boolean().optional(),
  improvementSuggestions: z.string().max(2000).optional(),
  additionalContext: z.string().max(2000).optional(),
  tags: z.array(z.string().max(50)).max(10).optional()
});

/**
 * POST /api/matching/matches/[id]/feedback - Add feedback to a match
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimitMiddleware(request, 'api');
    if (rateLimitResponse) return rateLimitResponse;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const matchId = params.id;

    if (!matchId) {
      return NextResponse.json(
        { error: 'Match ID is required' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = feedbackSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid feedback data',
          details: validation.error.errors
        },
        { status: 400 }
      );
    }

    const feedbackData = validation.data;

    // Check if match exists and user has permission
    const { prisma } = await import('@/lib/prisma');
    const match = await prisma.matchResult.findUnique({
      where: { id: matchId },
      include: {
        candidate: {
          select: { userId: true }
        },
        job: {
          select: { userId: true }
        }
      }
    });

    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to provide feedback
    const hasPermission = await checkFeedbackPermission(
      session.user.id,
      match,
      session.user.role
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // Check if user already provided feedback for this match
    const existingFeedback = await prisma.matchFeedback.findFirst({
      where: {
        matchId,
        userId: session.user.id
      }
    });

    if (existingFeedback) {
      return NextResponse.json(
        { error: 'Feedback already provided for this match' },
        { status: 409 }
      );
    }

    // Create feedback record
    const feedback = await prisma.matchFeedback.create({
      data: {
        matchId,
        userId: session.user.id,
        rating: feedbackData.rating,
        comment: feedbackData.comment,
        helpful: feedbackData.helpful,
        relevant: feedbackData.relevant,
        contactStatus: feedbackData.contactStatus,
        recommendationAccuracy: feedbackData.recommendationAccuracy,
        wouldRecommend: feedbackData.wouldRecommend,
        improvementSuggestions: feedbackData.improvementSuggestions,
        additionalContext: feedbackData.additionalContext,
        tags: feedbackData.tags || [],
        feedbackDate: new Date(),
        metadata: {
          userAgent: request.headers.get('user-agent'),
          ipAddress: request.ip || 'unknown'
        }
      }
    });

    // Update match with feedback summary
    await updateMatchFeedbackSummary(matchId);

    // Record user interaction
    await prisma.userInteraction.create({
      data: {
        userId: session.user.id,
        matchId,
        type: 'feedback',
        timestamp: new Date(),
        metadata: {
          feedbackId: feedback.id,
          rating: feedbackData.rating
        }
      }
    });

    logger.info('Feedback submitted successfully', {
      matchId,
      feedbackId: feedback.id,
      userId: session.user.id,
      rating: feedbackData.rating
    });

    return NextResponse.json({
      success: true,
      data: {
        id: feedback.id,
        matchId,
        rating: feedbackData.rating,
        feedbackDate: feedback.feedbackDate
      },
      message: 'Feedback submitted successfully'
    });

  } catch (error) {
    return errorHandler(error, request, 'match-feedback');
  }
}

/**
 * GET /api/matching/matches/[id]/feedback - Get feedback for a match
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimitMiddleware(request, 'api');
    if (rateLimitResponse) return rateLimitResponse;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const matchId = params.id;

    if (!matchId) {
      return NextResponse.json(
        { error: 'Match ID is required' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const includeUserDetails = searchParams.get('includeUserDetails') === 'true';

    // Check if match exists and user has permission
    const { prisma } = await import('@/lib/prisma');
    const match = await prisma.matchResult.findUnique({
      where: { id: matchId },
      include: {
        candidate: {
          select: { userId: true }
        },
        job: {
          select: { userId: true }
        }
      }
    });

    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to view feedback
    const hasPermission = await checkFeedbackViewPermission(
      session.user.id,
      match,
      session.user.role
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    if (action === 'summary') {
      // Get feedback summary
      const summary = await getFeedbackSummary(matchId);

      return NextResponse.json({
        success: true,
        data: summary
      });
    } else if (action === 'analytics') {
      // Get detailed feedback analytics (admin only)
      if (session.user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }

      const analytics = await getFeedbackAnalytics(matchId);

      return NextResponse.json({
        success: true,
        data: analytics
      });
    } else {
      // Get all feedback for the match
      const feedbackQuery: any = {
        where: { matchId },
        orderBy: { feedbackDate: 'desc' }
      };

      if (includeUserDetails && session.user.role === 'ADMIN') {
        feedbackQuery.include = {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true
            }
          }
        };
      } else {
        feedbackQuery.select = {
          id: true,
          rating: true,
          comment: true,
          helpful: true,
          relevant: true,
          contactStatus: true,
          recommendationAccuracy: true,
          wouldRecommend: true,
          tags: true,
          feedbackDate: true,
          // Exclude userId for non-admin users
          userId: session.user.role === 'ADMIN' ? true : false
        };
      }

      const feedbackList = await prisma.matchFeedback.findMany(feedbackQuery);

      return NextResponse.json({
        success: true,
        data: {
          feedback: feedbackList,
          total: feedbackList.length
        }
      });
    }

  } catch (error) {
    return errorHandler(error, request, 'match-feedback-get');
  }
}

/**
 * PUT /api/matching/matches/[id]/feedback - Update existing feedback
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimitMiddleware(request, 'api');
    if (rateLimitResponse) return rateLimitResponse;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const matchId = params.id;

    if (!matchId) {
      return NextResponse.json(
        { error: 'Match ID is required' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = feedbackSchema.partial().safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid feedback data',
          details: validation.error.errors
        },
        { status: 400 }
      );
    }

    const updateData = validation.data;

    // Find existing feedback
    const { prisma } = await import('@/lib/prisma');
    const existingFeedback = await prisma.matchFeedback.findFirst({
      where: {
        matchId,
        userId: session.user.id
      }
    });

    if (!existingFeedback) {
      return NextResponse.json(
        { error: 'Feedback not found' },
        { status: 404 }
      );
    }

    // Update feedback
    const updatedFeedback = await prisma.matchFeedback.update({
      where: { id: existingFeedback.id },
      data: {
        ...updateData,
        updatedAt: new Date(),
        metadata: {
          ...existingFeedback.metadata,
          updated: true,
          updatedAt: new Date().toISOString()
        }
      }
    });

    // Update match feedback summary
    await updateMatchFeedbackSummary(matchId);

    logger.info('Feedback updated successfully', {
      matchId,
      feedbackId: existingFeedback.id,
      userId: session.user.id
    });

    return NextResponse.json({
      success: true,
      data: updatedFeedback,
      message: 'Feedback updated successfully'
    });

  } catch (error) {
    return errorHandler(error, request, 'match-feedback-put');
  }
}

/**
 * Check if user has permission to provide feedback
 */
async function checkFeedbackPermission(
  userId: string,
  match: any,
  userRole: string
): Promise<boolean> {
  try {
    // Admin can provide feedback on any match
    if (userRole === 'ADMIN') {
      return true;
    }

    // Users can provide feedback on matches involving their own profiles
    return match.candidate?.userId === userId || match.job?.userId === userId;
  } catch (error) {
    logger.error('Error checking feedback permission', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return false;
  }
}

/**
 * Check if user has permission to view feedback
 */
async function checkFeedbackViewPermission(
  userId: string,
  match: any,
  userRole: string
): Promise<boolean> {
  // Same permissions as providing feedback
  return checkFeedbackPermission(userId, match, userRole);
}

/**
 * Update match feedback summary
 */
async function updateMatchFeedbackSummary(matchId: string): Promise<void> {
  try {
    const { prisma } = await import('@/lib/prisma');

    // Calculate feedback summary
    const feedbackStats = await prisma.matchFeedback.groupBy({
      by: ['rating'],
      where: { matchId },
      _count: { rating: true }
    });

    const totalFeedback = feedbackStats.reduce((sum, stat) => sum + stat._count.rating, 0);
    const averageRating = feedbackStats.reduce((sum, stat) => sum + stat.rating * stat._count.rating, 0) / totalFeedback;

    // Update match record
    await prisma.matchResult.update({
      where: { id: matchId },
      data: {
        feedbackCount: totalFeedback,
        averageRating: averageRating || 0,
        lastFeedbackAt: new Date()
      }
    });
  } catch (error) {
    logger.error('Error updating match feedback summary', {
      matchId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get feedback summary for a match
 */
async function getFeedbackSummary(matchId: string) {
  try {
    const { prisma } = await import('@/lib/prisma');

    const feedbackStats = await prisma.matchFeedback.aggregate({
      where: { matchId },
      _count: { id: true },
      _avg: { rating: true, recommendationAccuracy: true },
      _sum: { helpful: true, relevant: true, wouldRecommend: true }
    });

    const ratingDistribution = await prisma.matchFeedback.groupBy({
      by: ['rating'],
      where: { matchId },
      _count: { rating: true },
      orderBy: { rating: 'asc' }
    });

    const contactStatusDistribution = await prisma.matchFeedback.groupBy({
      by: ['contactStatus'],
      where: {
        matchId,
        contactStatus: { not: null }
      },
      _count: { contactStatus: true }
    });

    return {
      totalFeedback: feedbackStats._count.id,
      averageRating: feedbackStats._avg.rating || 0,
      averageRecommendationAccuracy: feedbackStats._avg.recommendationAccuracy || 0,
      helpfulCount: feedbackStats._sum.helpful || 0,
      relevantCount: feedbackStats._sum.relevant || 0,
      wouldRecommendCount: feedbackStats._sum.wouldRecommend || 0,
      ratingDistribution: ratingDistribution.map(stat => ({
        rating: stat.rating,
        count: stat._count.rating
      })),
      contactStatusDistribution: contactStatusDistribution.map(stat => ({
        status: stat.contactStatus,
        count: stat._count.contactStatus
      }))
    };
  } catch (error) {
    logger.error('Error getting feedback summary', {
      matchId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * Get detailed feedback analytics (admin only)
 */
async function getFeedbackAnalytics(matchId: string) {
  try {
    const { prisma } = await import('@/lib/prisma');

    // Get all feedback with full details
    const feedback = await prisma.matchFeedback.findMany({
      where: { matchId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: { feedbackDate: 'desc' }
    });

    // Get tag analytics
    const tagAnalytics = await prisma.matchFeedback.findMany({
      where: {
        matchId,
        tags: { not: [] }
      },
      select: { tags: true }
    });

    const allTags = tagAnalytics.flatMap(f => f.tags);
    const tagFrequency = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get time-based analytics
    const feedbackByMonth = await prisma.$queryRaw`
      SELECT
        DATE_TRUNC('month', feedback_date) as month,
        COUNT(*) as count,
        AVG(rating) as avg_rating
      FROM match_feedback
      WHERE match_id = ${matchId}
      GROUP BY DATE_TRUNC('month', feedback_date)
      ORDER BY month DESC
    `;

    return {
      feedback,
      tagFrequency,
      feedbackByMonth,
      totalFeedback: feedback.length
    };
  } catch (error) {
    logger.error('Error getting feedback analytics', {
      matchId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}