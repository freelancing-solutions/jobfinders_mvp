import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { AgentRouter } from '@/services/agents/orchestration/agent-router';
import { SessionManager } from '@/services/agents/orchestration/session-manager';
import { ContextManager } from '@/services/agents/orchestration/context-manager';
import { LLMService } from '@/services/agents/llm/llm-service';

// Initialize services
const sessionManager = new SessionManager();
const contextManager = new ContextManager();
const llmService = new LLMService();
const agentRouter = new AgentRouter(sessionManager, contextManager);

/**
 * GET /api/agents/available - Get available agents for user
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
    const includeStatus = searchParams.get('includeStatus') === 'true';
    const agentType = searchParams.get('agentType');

    // Get available agents for user
    const availableAgents = await agentRouter.getAvailableAgents(userId);

    // Get user preferences
    const userPreferences = await contextManager.getUserPreferences(userId);

    // Build response
    const response: any = {
      availableAgents,
      userPreferences,
      timestamp: new Date()
    };

    // Include agent status if requested
    if (includeStatus) {
      const agentStatus = await agentRouter.getAgentStatus(
        agentType as any || undefined
      );
      response.agentStatus = agentStatus;
    }

    // Get LLM service status
    try {
      const llmHealth = await llmService.getHealthStatus();
      response.llmServiceHealth = llmHealth;
    } catch (error) {
      console.error('Error getting LLM service health:', error);
      response.llmServiceHealth = { error: 'Failed to get LLM service health' };
    }

    // Get user's active sessions
    try {
      const userSessions = await sessionManager.getUserSessions(userId);
      response.activeSessions = userSessions.map(sess => ({
        sessionId: sess.sessionId,
        agentType: sess.agentType,
        status: sess.status,
        startTime: sess.startTime,
        lastActivity: sess.lastActivity,
        messageCount: sess.conversationHistory.length
      }));
    } catch (error) {
      console.error('Error getting user sessions:', error);
      response.activeSessions = [];
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error getting available agents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}