import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { MatchingCoreService } from '@/services/matching/core-service';
import { logger } from '@/lib/logging/logger';
import { rateLimitMiddleware } from '@/middleware/rate-limit';
import { errorHandler } from '@/middleware/error-handler';
import { z } from 'zod';

const updateMatchSchema = z.object({
  feedback: z.object({
    rating: z.number().min(1).max(5).optional(),
    comment: z.string().max(1000).optional(),
    helpful: z.boolean().optional(),
    relevant: z.boolean().optional(),
    contacted: z.boolean().optional(),
    status: z.enum(['viewed', 'interested', 'applied', 'rejected', 'hired']).optional(),
    notes: z.string().max(2000).optional()
  }).optional(),
  bookmarked: z.boolean().optional(),
  archived: z.boolean().optional()
});

/**
 * GET /api/matching/matches/[id] - Get match details by ID
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

    // Initialize matching service
    const matchingService = new MatchingCoreService();

    // Get match details
    const match = await matchingService.getMatch(matchId);

    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to view this match
    const hasPermission = await checkMatchViewPermission(
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

    // Increment view count if this is the owner
    await incrementMatchViewCount(matchId, session.user.id);

    logger.info('Match details retrieved', {
      matchId,
      userId: session.user.id,
      candidateId: match.candidateId,
      jobId: match.jobId
    });

    return NextResponse.json({
      success: true,
      data: match
    });

  } catch (error) {
    return errorHandler(error, request, 'match-details');
  }
}

/**
 * PUT /api/matching/matches/[id] - Update match details or add feedback
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
    const validation = updateMatchSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validation.error.errors
        },
        { status: 400 }
      );
    }

    const updateData = validation.data;

    // Initialize matching service
    const matchingService = new MatchingCoreService();

    // Get existing match
    const existingMatch = await matchingService.getMatch(matchId);
    if (!existingMatch) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to update this match
    const hasPermission = await checkMatchUpdatePermission(
      session.user.id,
      existingMatch,
      session.user.role
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // Update match with new data
    const updatedMatch = await updateMatch(matchId, updateData, session.user.id);

    logger.info('Match updated successfully', {
      matchId,
      userId: session.user.id,
      updateType: Object.keys(updateData).join(', ')
    });

    return NextResponse.json({
      success: true,
      data: updatedMatch,
      message: 'Match updated successfully'
    });

  } catch (error) {
    return errorHandler(error, request, 'match-update');
  }
}

/**
 * DELETE /api/matching/matches/[id] - Delete or archive a match
 */
export async function DELETE(
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
    const action = searchParams.get('action') || 'delete';

    // Initialize matching service
    const matchingService = new MatchingCoreService();

    // Get existing match
    const existingMatch = await matchingService.getMatch(matchId);
    if (!existingMatch) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to delete this match
    const hasPermission = await checkMatchDeletePermission(
      session.user.id,
      existingMatch,
      session.user.role
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    if (action === 'archive') {
      // Archive the match
      await archiveMatch(matchId, session.user.id);

      logger.info('Match archived', {
        matchId,
        userId: session.user.id
      });

      return NextResponse.json({
        success: true,
        message: 'Match archived successfully'
      });
    } else {
      // Delete the match
      await deleteMatch(matchId, session.user.id);

      logger.info('Match deleted', {
        matchId,
        userId: session.user.id
      });

      return NextResponse.json({
        success: true,
        message: 'Match deleted successfully'
      });
    }

  } catch (error) {
    return errorHandler(error, request, 'match-delete');
  }
}

/**
 * Check if user has permission to view a match
 */
async function checkMatchViewPermission(
  userId: string,
  match: any,
  userRole: string
): Promise<boolean> {
  try {
    const { prisma } = await import('@/lib/prisma');

    // Admin can view all
    if (userRole === 'ADMIN') {
      return true;
    }

    // Check if user owns the candidate profile
    const candidate = await prisma.candidateProfile.findUnique({
      where: { id: match.candidateId },
      select: { userId: true }
    });

    if (candidate?.userId === userId) {
      return true;
    }

    // Check if user owns the job profile
    const job = await prisma.jobProfile.findUnique({
      where: { id: match.jobId },
      select: { userId: true }
    });

    if (job?.userId === userId) {
      return true;
    }

    return false;
  } catch (error) {
    logger.error('Error checking match view permission', {
      userId,
      matchId: match.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return false;
  }
}

/**
 * Check if user has permission to update a match
 */
async function checkMatchUpdatePermission(
  userId: string,
  match: any,
  userRole: string
): Promise<boolean> {
  // Same permissions as view for now
  return checkMatchViewPermission(userId, match, userRole);
}

/**
 * Check if user has permission to delete a match
 */
async function checkMatchDeletePermission(
  userId: string,
  match: any,
  userRole: string
): Promise<boolean> {
  // Same permissions as view for now
  return checkMatchViewPermission(userId, match, userRole);
}

/**
 * Increment match view count
 */
async function incrementMatchViewCount(matchId: string, userId: string): Promise<void> {
  try {
    const { prisma } = await import('@/lib/prisma');

    // Record the view interaction
    await prisma.userInteraction.create({
      data: {
        userId,
        matchId,
        type: 'view',
        timestamp: new Date(),
        metadata: {
          userAgent: 'api'
        }
      }
    });

    // Update match view count
    await prisma.matchResult.update({
      where: { id: matchId },
      data: {
        viewCount: {
          increment: 1
        },
        lastViewedAt: new Date()
      }
    });
  } catch (error) {
    logger.error('Error incrementing match view count', {
      matchId,
      userId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Update match with feedback or other data
 */
async function updateMatch(
  matchId: string,
  updateData: any,
  userId: string
): Promise<any> {
  try {
    const { prisma } = await import('@/lib/prisma');

    // Update match result
    const updatedMatch = await prisma.matchResult.update({
      where: { id: matchId },
      data: {
        ...(updateData.feedback && {
          feedback: updateData.feedback,
          feedbackDate: new Date()
        }),
        ...(updateData.bookmarked !== undefined && {
          bookmarked: updateData.bookmarked,
          bookmarkedAt: updateData.bookmarked ? new Date() : null
        }),
        ...(updateData.archived !== undefined && {
          archived: updateData.archived,
          archivedAt: updateData.archived ? new Date() : null
        }),
        updatedAt: new Date()
      }
    });

    // Record interaction if feedback provided
    if (updateData.feedback) {
      await prisma.userInteraction.create({
        data: {
          userId,
          matchId,
          type: 'feedback',
          timestamp: new Date(),
          metadata: updateData.feedback
        }
      });
    }

    return updatedMatch;
  } catch (error) {
    logger.error('Error updating match', {
      matchId,
      userId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * Archive a match
 */
async function archiveMatch(matchId: string, userId: string): Promise<void> {
  try {
    const { prisma } = await import('@/lib/prisma');

    await prisma.matchResult.update({
      where: { id: matchId },
      data: {
        archived: true,
        archivedAt: new Date(),
        archivedBy: userId
      }
    });

    // Record interaction
    await prisma.userInteraction.create({
      data: {
        userId,
        matchId,
        type: 'archive',
        timestamp: new Date()
      }
    });
  } catch (error) {
    logger.error('Error archiving match', {
      matchId,
      userId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * Delete a match
 */
async function deleteMatch(matchId: string, userId: string): Promise<void> {
  try {
    const { prisma } = await import('@/lib/prisma');

    // Record interaction before deletion
    await prisma.userInteraction.create({
      data: {
        userId,
        matchId,
        type: 'delete',
        timestamp: new Date()
      }
    });

    // Delete the match
    await prisma.matchResult.delete({
      where: { id: matchId }
    });
  } catch (error) {
    logger.error('Error deleting match', {
      matchId,
      userId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}