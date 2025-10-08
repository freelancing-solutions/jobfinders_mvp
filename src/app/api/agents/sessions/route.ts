import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { AgentRouter } from '@/services/agents/orchestration/agent-router';
import { SessionManager } from '@/services/agents/orchestration/session-manager';
import { ContextManager } from '@/services/agents/orchestration/context-manager';
import { LLMService } from '@/services/agents/llm/llm-service';
import { AgentType } from '@/types/agents';

// Initialize services
const sessionManager = new SessionManager();
const contextManager = new ContextManager();
const llmService = new LLMService();
const agentRouter = new AgentRouter(sessionManager, contextManager);

// Request schema validation
const CreateSessionSchema = z.object({
  agentType: z.nativeEnum(AgentType).optional(),
  initialMessage: z.string().optional(),
  context: z.record(z.any()).optional(),
  preferences: z.object({
    communicationStyle: z.enum(['formal', 'casual', 'friendly']).optional(),
    responseLength: z.enum(['concise', 'detailed', 'comprehensive']).optional(),
    language: z.string().optional(),
    timezone: z.string().optional()
  }).optional()
});

/**
 * POST /api/agents/sessions - Create a new agent session
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = CreateSessionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: validation.error.errors
        },
        { status: 400 }
      );
    }

    const { agentType, initialMessage, context, preferences } = validation.data;

    // Get user ID from session (in a real implementation, you'd get this from your user store)
    const userId = session.user.email; // Simplified - should use actual user ID

    // Create session
    const agentSession = await sessionManager.createSession(userId, {
      agentType,
      initialContext: context,
      preferences
    });

    // If there's an initial message, process it
    let initialResponse;
    if (initialMessage && agentType) {
      try {
        initialResponse = await agentRouter.routeRequest({
          userId,
          message: initialMessage,
          sessionId: agentSession.sessionId,
          context,
          preferences
        });
      } catch (error) {
        console.error('Error processing initial message:', error);
        // Continue without initial response if it fails
      }
    }

    // Get available agents for this user
    const availableAgents = await agentRouter.getAvailableAgents(userId);

    return NextResponse.json({
      sessionId: agentSession.sessionId,
      agentType: agentSession.agentType,
      status: agentSession.status,
      startTime: agentSession.startTime,
      initialResponse: initialResponse?.response,
      availableAgents,
      suggestions: initialResponse?.suggestions,
      actions: initialResponse?.actions
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating agent session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agents/sessions - Get user's active sessions
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.email; // Simplified - should use actual user ID

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const includeHistory = searchParams.get('includeHistory') === 'true';
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get user sessions
    const userSessions = await sessionManager.getUserSessions(userId);

    // Enrich sessions with additional data
    const enrichedSessions = await Promise.all(
      userSessions.slice(0, limit).map(async (agentSession) => {
        const sessionData: any = {
          sessionId: agentSession.sessionId,
          agentType: agentSession.agentType,
          status: agentSession.status,
          startTime: agentSession.startTime,
          lastActivity: agentSession.lastActivity,
          messageCount: agentSession.conversationHistory.length
        };

        // Include conversation history if requested
        if (includeHistory) {
          sessionData.conversationHistory = agentSession.conversationHistory.slice(-10); // Last 10 messages
        }

        // Get agent status
        if (agentSession.agentType) {
          try {
            const agentStatus = await agentRouter.getAgentStatus(agentSession.agentType);
            sessionData.agentStatus = agentStatus[agentSession.agentType];
          } catch (error) {
            console.error('Error getting agent status:', error);
          }
        }

        return sessionData;
      })
    );

    return NextResponse.json({
      sessions: enrichedSessions,
      total: userSessions.length
    });

  } catch (error) {
    console.error('Error getting agent sessions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}