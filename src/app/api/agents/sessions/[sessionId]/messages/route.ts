import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { AgentRouter } from '@/services/agents/orchestration/agent-router';
import { SessionManager } from '@/services/agents/orchestration/session-manager';
import { ContextManager } from '@/services/agents/orchestration/context-manager';
import { LLMService } from '@/services/agents/llm/llm-service';
import { MessageType } from '@/types/agents';

// Initialize services
const sessionManager = new SessionManager();
const contextManager = new ContextManager();
const llmService = new LLMService();
const agentRouter = new AgentRouter(sessionManager, contextManager);

// Request schema validation
const SendMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  messageType: z.nativeEnum(MessageType).default(MessageType.TEXT),
  context: z.record(z.any()).optional(),
  attachments: z.array(z.object({
    id: z.string(),
    type: z.enum(['file', 'image', 'document', 'link']),
    name: z.string(),
    url: z.string().optional(),
    data: z.string().optional(),
    metadata: z.record(z.any()).optional()
  })).optional(),
  stream: z.boolean().default(false)
});

/**
 * POST /api/agents/sessions/[sessionId]/messages - Send a message to agent
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

    // Parse and validate request body
    const body = await request.json();
    const validation = SendMessageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: validation.error.errors
        },
        { status: 400 }
      );
    }

    const { message, messageType, context, attachments, stream } = validation.data;

    // Add user message to session history
    await sessionManager.addMessage(
      sessionId,
      'user',
      message,
      {
        messageType,
        attachments,
        ...context
      },
      agentSession.agentType || undefined
    );

    // Check if streaming is requested
    if (stream) {
      // Return streaming response
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            const requestContext = {
              ...agentSession.context,
              ...context
            };

            for await (const chunk of agentRouter.processRequestStream({
              message,
              context: requestContext,
              sessionId,
              userId,
              preferences: agentSession.preferences,
              messageType,
              attachments: attachments || []
            })) {
              // Send chunk to client
              const data = JSON.stringify({
                type: 'content',
                content: chunk,
                sessionId
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }

            // Send completion signal
            const completionData = JSON.stringify({
              type: 'complete',
              sessionId
            });
            controller.enqueue(encoder.encode(`data: ${completionData}\n\n`));

            // Add agent response to session history
            await sessionManager.addMessage(
              sessionId,
              'agent',
              '[Streaming response]',
              {
                messageType,
                attachments,
                streaming: true
              },
              agentSession.agentType || undefined
            );

          } catch (error) {
            console.error('Error in streaming response:', error);

            // Send error to client
            const errorData = JSON.stringify({
              type: 'error',
              error: error instanceof Error ? error.message : 'Unknown error',
              sessionId
            });
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          } finally {
            controller.close();
          }
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });

    } else {
      // Non-streaming response
      const requestContext = {
        ...agentSession.context,
        ...context
      };

      const response = await agentRouter.routeRequest({
        message,
        context: requestContext,
        sessionId,
        userId,
        preferences: agentSession.preferences,
        messageType,
        attachments: attachments || []
      });

      // Add agent response to session history
      await sessionManager.addMessage(
        sessionId,
        'agent',
        response.response,
        {
          suggestions: response.suggestions,
          actions: response.actions,
          metadata: response.metadata,
          messageType
        },
        response.agentType || undefined
      );

      return NextResponse.json({
        messageId: `msg_${Date.now()}`,
        sessionId,
        agentId: response.agentId,
        agentType: response.agentType,
        response: response.response,
        suggestions: response.suggestions,
        actions: response.actions,
        metadata: response.metadata,
        confidence: response.confidence,
        timestamp: new Date()
      });

    }

  } catch (error) {
    console.error('Error sending message to agent:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agents/sessions/[sessionId]/messages - Get session message history
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const includeSystem = searchParams.get('includeSystem') === 'true';

    // Get conversation history
    const history = await sessionManager.getConversationHistory(sessionId, limit + offset);

    // Filter system messages if not requested
    let filteredHistory = history;
    if (!includeSystem) {
      filteredHistory = history.filter(msg => msg.role !== 'system');
    }

    // Apply pagination
    const paginatedHistory = filteredHistory.slice(offset, offset + limit);

    return NextResponse.json({
      sessionId,
      messages: paginatedHistory.map(msg => ({
        messageId: msg.messageId,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        messageType: msg.messageType,
        metadata: msg.metadata,
        agentType: msg.agentType
      })),
      total: filteredHistory.length,
      hasMore: offset + limit < filteredHistory.length,
      sessionInfo: {
        agentType: agentSession.agentType,
        status: agentSession.status,
        startTime: agentSession.startTime,
        lastActivity: agentSession.lastActivity,
        messageCount: agentSession.conversationHistory.length
      }
    });

  } catch (error) {
    console.error('Error getting session messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}