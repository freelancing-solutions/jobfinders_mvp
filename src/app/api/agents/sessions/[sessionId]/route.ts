import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { SessionManager } from '@/services/agents/orchestration/session-manager';
import { AgentStatus } from '@/types/agents';

// Initialize services
const sessionManager = new SessionManager();

// Request schema validation for updating session
const UpdateSessionSchema = z.object({
  status: z.enum(['active', 'paused', 'completed']).optional(),
  context: z.record(z.any()).optional(),
  preferences: z.object({
    communicationStyle: z.enum(['formal', 'casual', 'friendly']).optional(),
    responseLength: z.enum(['concise', 'detailed', 'comprehensive']).optional(),
    language: z.string().optional(),
    timezone: z.string().optional(),
    enableSuggestions: z.boolean().optional(),
    enableActions: z.boolean().optional()
  }).optional()
});

/**
 * GET /api/agents/sessions/[sessionId] - Get session details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const sessionId = params.sessionId;
    const userId = session.user.email; // Simplified - should use actual user ID

    // Get session
    const agentSession = await sessionManager.getSession(sessionId);
    if (!agentSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Verify session belongs to user
    if (agentSession.userId !== userId) {
      return NextResponse.json(
        { error: 'Session does not belong to user' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const includeMetrics = searchParams.get('includeMetrics') === 'true';

    const sessionData: any = {
      sessionId: agentSession.sessionId,
      agentType: agentSession.agentType,
      status: agentSession.status,
      startTime: agentSession.startTime,
      lastActivity: agentSession.lastActivity,
      preferences: agentSession.preferences,
      context: agentSession.context,
      messageCount: agentSession.conversationHistory.length
    };

    // Include session metrics if requested
    if (includeMetrics) {
      const now = new Date();
      const sessionDuration = now.getTime() - new Date(agentSession.startTime).getTime();

      sessionData.metrics = {
        sessionDuration,
        averageResponseTime: agentSession.context.sessionMetrics?.averageResponseTime || 0,
        messageCount: agentSession.context.sessionMetrics?.messageCount || 0,
        taskCompletionRate: agentSession.context.sessionMetrics?.taskCompletionRate || 0
      };
    }

    return NextResponse.json(sessionData);

  } catch (error) {
    console.error('Error getting session details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/agents/sessions/[sessionId] - Update session
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const sessionId = params.sessionId;
    const userId = session.user.email; // Simplified - should use actual user ID

    // Validate session exists and belongs to user
    const agentSession = await sessionManager.getSession(sessionId);
    if (!agentSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (agentSession.userId !== userId) {
      return NextResponse.json(
        { error: 'Session does not belong to user' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = UpdateSessionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: validation.error.errors
        },
        { status: 400 }
      );
    }

    const { status, context, preferences } = validation.data;

    // Update session
    const updatedSession = await sessionManager.updateSession(sessionId, {
      status: status as any,
      context: context ? { ...agentSession.context, ...context } : undefined,
      preferences: preferences ? { ...agentSession.preferences, ...preferences } : undefined
    });

    if (!updatedSession) {
      return NextResponse.json(
        { error: 'Failed to update session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      sessionId: updatedSession.sessionId,
      status: updatedSession.status,
      lastActivity: updatedSession.lastActivity,
      context: updatedSession.context,
      preferences: updatedSession.preferences,
      updated: true
    });

  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/agents/sessions/[sessionId] - Delete session
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const sessionId = params.sessionId;
    const userId = session.user.email; // Simplified - should use actual user ID

    // Validate session exists and belongs to user
    const agentSession = await sessionManager.getSession(sessionId);
    if (!agentSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (agentSession.userId !== userId) {
      return NextResponse.json(
        { error: 'Session does not belong to user' },
        { status: 403 }
      );
    }

    // Delete session
    const deleted = await sessionManager.deleteSession(sessionId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      sessionId,
      deleted: true,
      message: 'Session deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agents/sessions/[sessionId]/pause - Pause session
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const sessionId = params.sessionId;
    const userId = session.user.email; // Simplified - should use actual user ID

    // Validate session exists and belongs to user
    const agentSession = await sessionManager.getSession(sessionId);
    if (!agentSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (agentSession.userId !== userId) {
      return NextResponse.json(
        { error: 'Session does not belong to user' },
        { status: 403 }
      );
    }

    // Get the action from the URL
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (pathname.endsWith('/pause')) {
      // Pause session
      const paused = await sessionManager.pauseSession(sessionId);

      if (!paused) {
        return NextResponse.json(
          { error: 'Failed to pause session' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        sessionId,
        status: 'paused',
        message: 'Session paused successfully'
      });

    } else if (pathname.endsWith('/resume')) {
      // Resume session
      const resumed = await sessionManager.resumeSession(sessionId);

      if (!resumed) {
        return NextResponse.json(
          { error: 'Failed to resume session' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        sessionId,
        status: 'active',
        message: 'Session resumed successfully'
      });

    } else if (pathname.endsWith('/complete')) {
      // Complete session
      const completed = await sessionManager.completeSession(sessionId);

      if (!completed) {
        return NextResponse.json(
          { error: 'Failed to complete session' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        sessionId,
        status: 'completed',
        message: 'Session completed successfully'
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error managing session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}