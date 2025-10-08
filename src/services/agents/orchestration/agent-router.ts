import { AgentType, AgentIntent, AgentCapabilities } from '@/types/agents';
import { BaseAgent } from '../base/base-agent';
import { SessionManager } from './session-manager';
import { ContextManager } from './context-manager';
import { Logger } from '@/lib/logger';

export interface AgentRequest {
  userId: string;
  message: string;
  sessionId?: string;
  context?: Record<string, any>;
  preferences?: Record<string, any>;
}

export interface AgentResponse {
  agentId: string;
  agentType: AgentType;
  response: string;
  suggestions?: string[];
  actions?: AgentAction[];
  metadata?: Record<string, any>;
}

export interface AgentAction {
  type: string;
  payload: Record<string, any>;
  description: string;
}

export class AgentRouter {
  private agents: Map<AgentType, BaseAgent> = new Map();
  private sessionManager: SessionManager;
  private contextManager: ContextManager;
  private logger: Logger;

  constructor(
    sessionManager: SessionManager,
    contextManager: ContextManager
  ) {
    this.sessionManager = sessionManager;
    this.contextManager = contextManager;
    this.logger = new Logger('AgentRouter');
  }

  /**
   * Register an agent with the router
   */
  registerAgent(agent: BaseAgent): void {
    this.agents.set(agent.getAgentType(), agent);
    this.logger.info(`Registered agent: ${agent.getAgentType()}`);
  }

  /**
   * Route a request to the appropriate agent(s)
   */
  async routeRequest(request: AgentRequest): Promise<AgentResponse> {
    try {
      // Get or create session
      const session = request.sessionId
        ? await this.sessionManager.getSession(request.sessionId)
        : await this.sessionManager.createSession(request.userId);

      if (!session) {
        throw new Error('Failed to create or retrieve session');
      }

      // Analyze user intent
      const intent = await this.analyzeIntent(request.message, session.context);

      // Select appropriate agent(s)
      const selectedAgents = await this.selectAgents(intent, request.userId);

      if (selectedAgents.length === 0) {
        throw new Error('No suitable agent found for request');
      }

      // For now, use the first selected agent (can be extended for multi-agent coordination)
      const agent = selectedAgents[0];

      // Get user context
      const userContext = await this.contextManager.getUserContext(request.userId);

      // Process request through agent
      const response = await agent.processRequest({
        message: request.message,
        context: { ...session.context, ...userContext, ...request.context },
        sessionId: session.sessionId,
        userId: request.userId,
        preferences: request.preferences
      });

      // Update session
      await this.sessionManager.updateSession(session.sessionId, {
        lastActivity: new Date(),
        context: { ...session.context, lastIntent: intent }
      });

      // Update context if needed
      if (response.metadata?.contextUpdate) {
        await this.contextManager.updateUserContext(
          request.userId,
          response.metadata.contextUpdate
        );
      }

      return {
        agentId: agent.getAgentId(),
        agentType: agent.getAgentType(),
        response: response.content,
        suggestions: response.suggestions,
        actions: response.actions,
        metadata: response.metadata
      };

    } catch (error) {
      this.logger.error('Error routing request:', error);
      throw error;
    }
  }

  /**
   * Analyze user intent from message
   */
  private async analyzeIntent(message: string, context: Record<string, any>): Promise<AgentIntent> {
    const normalizedMessage = message.toLowerCase().trim();

    // Career-related intents
    if (normalizedMessage.includes('career') || normalizedMessage.includes('path') ||
        normalizedMessage.includes('job') || normalizedMessage.includes('skills')) {
      if (normalizedMessage.includes('advice') || normalizedMessage.includes('guidance')) {
        return AgentIntent.CAREER_GUIDANCE;
      }
      if (normalizedMessage.includes('skills') || normalizedMessage.includes('learn')) {
        return AgentIntent.SKILL_ANALYSIS;
      }
      if (normalizedMessage.includes('market') || normalizedMessage.includes('trends')) {
        return AgentIntent.MARKET_INTELLIGENCE;
      }
      return AgentIntent.CAREER_GUIDANCE;
    }

    // Interview-related intents
    if (normalizedMessage.includes('interview') || normalizedMessage.includes('mock') ||
        normalizedMessage.includes('practice') || normalizedMessage.includes('question')) {
      if (normalizedMessage.includes('mock') || normalizedMessage.includes('practice')) {
        return AgentIntent.MOCK_INTERVIEW;
      }
      if (normalizedMessage.includes('prepare') || normalizedMessage.includes('tips')) {
        return AgentIntent.INTERVIEW_PREPARATION;
      }
      return AgentIntent.INTERVIEW_PREPARATION;
    }

    // Application-related intents
    if (normalizedMessage.includes('application') || normalizedMessage.includes('apply') ||
        normalizedMessage.includes('resume') || normalizedMessage.includes('cover')) {
      if (normalizedMessage.includes('optimize') || normalizedMessage.includes('improve')) {
        return AgentIntent.APPLICATION_OPTIMIZATION;
      }
      if (normalizedMessage.includes('track') || normalizedMessage.includes('status')) {
        return AgentIntent.APPLICATION_TRACKING;
      }
      return AgentIntent.APPLICATION_ASSISTANCE;
    }

    // Employer-related intents
    if (normalizedMessage.includes('candidate') || normalizedMessage.includes('screen') ||
        normalizedMessage.includes('hire') || normalizedMessage.includes('posting')) {
      if (normalizedMessage.includes('screen') || normalizedMessage.includes('review')) {
        return AgentIntent.CANDIDATE_SCREENING;
      }
      if (normalizedMessage.includes('posting') || normalizedMessage.includes('job')) {
        return AgentIntent.JOB_POSTING_OPTIMIZATION;
      }
      return AgentIntent.EMPLOYER_ASSISTANCE;
    }

    // Networking-related intents
    if (normalizedMessage.includes('network') || normalizedMessage.includes('connect') ||
        normalizedMessage.includes('contact') || normalizedMessage.includes('linkedin')) {
      if (normalizedMessage.includes('connect') || normalizedMessage.includes('recommend')) {
        return AgentIntent.CONNECTION_RECOMMENDATIONS;
      }
      return AgentIntent.NETWORKING_ASSISTANCE;
    }

    // Default to general assistance
    return AgentIntent.GENERAL_ASSISTANCE;
  }

  /**
   * Select appropriate agents based on intent and user context
   */
  private async selectAgents(intent: AgentIntent, userId: string): Promise<BaseAgent[]> {
    const availableAgents: BaseAgent[] = [];

    for (const [agentType, agent] of this.agents) {
      if (await this.agentCanHandleIntent(agent, intent, userId)) {
        availableAgents.push(agent);
      }
    }

    // Sort by agent capability confidence (could be enhanced with ML-based scoring)
    return availableAgents.sort((a, b) => {
      const aCapability = this.getAgentCapabilityScore(a, intent);
      const bCapability = this.getAgentCapabilityScore(b, intent);
      return bCapability - aCapability;
    });
  }

  /**
   * Check if an agent can handle a specific intent
   */
  private async agentCanHandleIntent(
    agent: BaseAgent,
    intent: AgentIntent,
    userId: string
  ): Promise<boolean> {
    const capabilities = agent.getCapabilities();
    const userPreferences = await this.contextManager.getUserPreferences(userId);

    // Check if agent is enabled for this user
    if (userPreferences?.agentPreferences?.[agent.getAgentType()]?.enabled === false) {
      return false;
    }

    // Check if agent supports this intent
    return capabilities.supportedIntents.includes(intent);
  }

  /**
   * Get agent capability score for an intent
   */
  private getAgentCapabilityScore(agent: BaseAgent, intent: AgentIntent): number {
    const capabilities = agent.getCapabilities();

    // Higher score for primary capabilities
    if (capabilities.primaryIntents.includes(intent)) {
      return 100;
    }

    // Medium score for supported intents
    if (capabilities.supportedIntents.includes(intent)) {
      return 70;
    }

    // Lower score for general capabilities
    return 30;
  }

  /**
   * Get available agents for a user
   */
  async getAvailableAgents(userId: string): Promise<AgentType[]> {
    const userPreferences = await this.contextManager.getUserPreferences(userId);
    const availableAgents: AgentType[] = [];

    for (const [agentType, agent] of this.agents) {
      // Check if agent is enabled for this user
      if (userPreferences?.agentPreferences?.[agentType]?.enabled !== false) {
        availableAgents.push(agentType);
      }
    }

    return availableAgents;
  }

  /**
   * Get agent status and health information
   */
  async getAgentStatus(agentType?: AgentType): Promise<Record<string, any>> {
    const status: Record<string, any> = {};

    for (const [type, agent] of this.agents) {
      if (!agentType || type === agentType) {
        status[type] = {
          agentId: agent.getAgentId(),
          status: await agent.getHealthStatus(),
          capabilities: agent.getCapabilities(),
          activeSessions: await this.sessionManager.getActiveSessionCount(type),
          lastActivity: agent.getLastActivity()
        };
      }
    }

    return status;
  }

  /**
   * Graceful shutdown of all agents
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down AgentRouter...');

    const shutdownPromises = Array.from(this.agents.values()).map(agent =>
      agent.shutdown().catch(error =>
        this.logger.error(`Error shutting down agent ${agent.getAgentId()}:`, error)
      )
    );

    await Promise.all(shutdownPromises);
    this.logger.info('AgentRouter shutdown complete');
  }
}