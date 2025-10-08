import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';

// Types for AI Agent System
export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  category: 'analysis' | 'generation' | 'optimization' | 'coordination' | 'communication';
  enabled: boolean;
  confidence: number;
  requiredData: string[];
  outputFormat: 'text' | 'json' | 'structured';
  maxTokens?: number;
  temperature?: number;
}

export interface AgentContext {
  userId: string;
  sessionId: string;
  conversationHistory: AgentMessage[];
  userProfile?: any;
  currentJob?: any;
  previousInteractions: any[];
  userPreferences: UserPreferences;
  metadata: Record<string, any>;
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  agentType?: string;
  confidence?: number;
  metadata?: Record<string, any>;
}

export interface UserPreferences {
  communicationStyle: 'professional' | 'casual' | 'friendly' | 'formal';
  responseLength: 'concise' | 'detailed' | 'comprehensive';
  language: string;
  timezone: string;
  notifications: {
    frequency: 'immediate' | 'daily' | 'weekly' | 'never';
    channels: string[];
  };
  privacy: {
    dataSharing: boolean;
    analytics: boolean;
    personalization: boolean;
  };
  agents: {
    [agentType: string]: {
      enabled: boolean;
      personality: string;
      frequency: 'proactive' | 'reactive';
      customization: Record<string, any>;
    };
  };
}

export interface AgentResponse {
  content: string;
  agentType: string;
  confidence: number;
  reasoning?: string;
  data?: any;
  actions?: AgentAction[];
  followUpQuestions?: string[];
  metadata?: Record<string, any>;
}

export interface AgentAction {
  type: 'recommendation' | 'analysis' | 'generation' | 'coordination' | 'notification';
  description: string;
  data?: any;
  priority: 'low' | 'medium' | 'high';
  requiresConfirmation: boolean;
}

export interface AgentMetrics {
  agentType: string;
  totalInteractions: number;
  averageResponseTime: number;
  satisfactionScore: number;
  accuracyScore: number;
  taskCompletionRate: number;
  lastActivity: Date;
  errorRate: number;
  popularCapabilities: Array<{
    capability: string;
    usage: number;
  }>;
}

export abstract class BaseAgent {
  protected openai: OpenAI;
  protected agentType: string;
  protected capabilities: AgentCapability[];
  protected systemPrompt: string;
  protected modelConfig: {
    model: string;
    temperature: number;
    maxTokens: number;
    topP: number;
    frequencyPenalty: number;
    presencePenalty: number;
  };

  constructor(config: {
    agentType: string;
    systemPrompt: string;
    capabilities: AgentCapability[];
    modelConfig?: any;
  }) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.agentType = config.agentType;
    this.systemPrompt = config.systemPrompt;
    this.capabilities = config.capabilities;
    this.modelConfig = {
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 2000,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
      ...config.modelConfig
    };
  }

  abstract async processMessage(
    message: string,
    context: AgentContext
  ): Promise<AgentResponse>;

  protected async callLLM(
    messages: Array<{ role: string; content: string }>,
    options: {
      temperature?: number;
      maxTokens?: number;
      model?: string;
    } = {}
  ): Promise<{ content: string; usage: any }> {
    try {
      const response = await this.openai.chat.completions.create({
        model: options.model || this.modelConfig.model,
        messages,
        temperature: options.temperature ?? this.modelConfig.temperature,
        max_tokens: options.maxTokens ?? this.modelConfig.maxTokens,
        top_p: this.modelConfig.topP,
        frequency_penalty: this.modelConfig.frequencyPenalty,
        presence_penalty: this.modelConfig.presencePenalty,
        user: context.userId,
      });

      return {
        content: response.choices[0]?.message?.content || '',
        usage: response.usage
      };
    } catch (error) {
      console.error(`Error calling LLM for ${this.agentType}:`, error);
      throw new Error(`Failed to process with ${this.agentType}: ${error.message}`);
    }
  }

  protected buildMessages(
    userMessage: string,
    context: AgentContext
  ): Array<{ role: string; content: string }> {
    const messages = [
      {
        role: 'system',
        content: this.systemPrompt
      }
    ];

    // Add context information
    if (context.userProfile) {
      messages.push({
        role: 'system',
        content: `User Profile: ${JSON.stringify(context.userProfile, null, 2)}`
      });
    }

    if (context.currentJob) {
      messages.push({
        role: 'system',
        content: `Current Job Context: ${JSON.stringify(context.currentJob, null, 2)}`
      });
    }

    // Add recent conversation history (last 10 messages)
    const recentHistory = context.conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    }

    // Add current message
    messages.push({
      role: 'user',
      content: userMessage
    });

    return messages;
  }

  protected async validateAndSanitizeInput(input: string): Promise<string> {
    // Remove potentially harmful content
    const sanitized = input
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/data:text\/html/gi, '');

    // Check for appropriate length
    if (sanitized.length > 10000) {
      throw new Error('Input too long');
    }

    return sanitized.trim();
  }

  protected generateFollowUpQuestions(
    context: AgentContext,
    response: string
  ): string[] {
    // Extract potential follow-up questions from the response
    const questions: string[] = [];

    // Look for question patterns in the response
    const questionMatches = response.match(/([^?!.]+\?)/g);
    if (questionMatches) {
      questions.push(...questionMatches.slice(0, 3)); // Max 3 questions
    }

    return questions;
  }

  protected async logInteraction(
    context: AgentContext,
    input: string,
    response: AgentResponse
  ): Promise<void> {
    try {
      await prisma.agentInteraction.create({
        data: {
          userId: context.userId,
          sessionId: context.sessionId,
          agentType: this.agentType,
          input,
          response: response.content,
          confidence: response.confidence,
          metadata: {
            capabilities: this.capabilities.map(c => c.name),
            responseTime: Date.now(),
            ...response.metadata
          },
          createdAt: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to log agent interaction:', error);
    }
  }

  protected async updateMetrics(
    context: AgentContext,
    responseTime: number,
    success: boolean
  ): Promise<void> {
    try {
      await prisma.agentMetrics.upsert({
        where: {
          agentType_userId: {
            agentType: this.agentType,
            userId: context.userId
          }
        },
        update: {
          totalInteractions: {
            increment: 1
          },
          averageResponseTime: {
            // Calculate new average
            // In production, this would use a proper averaging algorithm
            responseTime
          },
          errorRate: success ? 0 : {
            increment: 0.01
          },
          lastActivity: new Date()
        },
        create: {
          agentType: this.agentType,
          userId: context.userId,
          totalInteractions: 1,
          averageResponseTime: responseTime,
          satisfactionScore: 0,
          accuracyScore: 0,
          taskCompletionRate: 0,
          lastActivity: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to update agent metrics:', error);
    }
  }

  protected formatResponse(
    content: string,
    context: AgentContext,
    confidence: number,
    data?: any,
    actions?: AgentAction[],
    followUpQuestions?: string[]
  ): AgentResponse {
    // Apply user preferences to formatting
    const formattedContent = this.applyUserPreferences(content, context.userPreferences);

    return {
      content: formattedContent,
      agentType: this.agentType,
      confidence,
      data,
      actions,
      followUpQuestions
    };
  }

  private applyUserPreferences(
    content: string,
    preferences: UserPreferences
  ): string {
    let formatted = content;

    // Adjust response length based on preference
    switch (preferences.responseLength) {
      case 'concise':
        formatted = content
          .split('\n')
          .filter(line => line.trim().length > 0)
          .slice(0, 3)
          .join('\n');
        break;
      case 'comprehensive':
        // Keep full content, maybe add more details
        break;
      case 'detailed':
        formatted = content
          .split('\n')
          .filter(line => line.trim().length > 0)
          .slice(0, 7)
          .join('\n');
        break;
    }

    // Adjust communication style
    switch (preferences.communicationStyle) {
      case 'professional':
        formatted = formatted.replace(/\b(hey|hi|yo)\b/gi, 'Hello');
        formatted = formatted.replace(/\b(thanks|thx)\b/gi, 'Thank you');
        break;
      case 'casual':
        formatted = formatted.replace(/\b(Good day|Dear)\b/gi, 'Hi there');
        break;
      case 'friendly':
        formatted = formatted.replace(/\b(Yours sincerely|Best regards)\b/gi, 'Best wishes');
        break;
    }

    return formatted;
  }

  getCapabilities(): AgentCapability[] {
    return this.capabilities;
  }

  isCapabilityEnabled(capabilityId: string): boolean {
    const capability = this.capabilities.find(c => c.id === capabilityId);
    return capability?.enabled ?? false;
  }

  async getMetrics(userId?: string): Promise<AgentMetrics[]> {
    try {
      const whereClause = userId ? { userId } : {};

      const metrics = await prisma.agentMetrics.findMany({
        where: {
          ...whereClause,
          agentType: this.agentType
        },
        orderBy: { lastActivity: 'desc' },
        take: 100
      });

      // In a real implementation, this would include more detailed metrics
      return metrics.map(metric => ({
        agentType: metric.agentType,
        totalInteractions: metric.totalInteractions,
        averageResponseTime: metric.averageResponseTime,
        satisfactionScore: metric.satisfactionScore || 0,
        accuracyScore: metric.accuracyScore || 0,
        taskCompletionRate: metric.taskCompletionRate || 0,
        lastActivity: metric.lastActivity,
        errorRate: metric.errorRate || 0,
        popularCapabilities: []
      }));
    } catch (error) {
      console.error('Failed to get agent metrics:', error);
      return [];
    }
  }

  abstract getRequiredData(): string[];
  abstract getEstimatedTokens(input: string): number;
}

export class AgentCoordinator {
  private static instance: AgentCoordinator;
  private agents: Map<string, BaseAgent> = new Map();
  private agentCapabilities: Map<string, AgentCapability[]> = new Map();
  private agentMetrics: Map<string, AgentMetrics[]> = new Map();

  static getInstance(): AgentCoordinator {
    if (!AgentCoordinator.instance) {
      AgentCoordinator.instance = new AgentCoordinator();
    }
    return AgentCoordinator.instance;
  }

  registerAgent(agentType: string, agent: BaseAgent): void {
    this.agents.set(agentType, agent);
    this.agentCapabilities.set(agentType, agent.getCapabilities());
    console.log(`Registered agent: ${agentType}`);
  }

  getAgent(agentType: string): BaseAgent | undefined {
    return this.agents.get(agentType);
  }

  getAllAgents(): Map<string, BaseAgent> {
    return this.agents;
  }

  getAvailableCapabilities(): Map<string, AgentCapability[]> {
    return this.agentCapabilities;
  }

  async routeMessage(
    message: string,
    context: AgentContext,
    preferredAgent?: string
  ): Promise<AgentResponse> {
    const startTime = Date.now();

    try {
      let agentType = preferredAgent;

      // If no preferred agent, try to determine the best agent
      if (!agentType) {
        agentType = this.determineBestAgent(message, context);
      }

      const agent = this.agents.get(agentType);
      if (!agent) {
        throw new Error(`Agent not found: ${agentType}`);
      }

      // Validate and sanitize input
      const sanitizedMessage = await agent['validateAndSanitizeInput'](message);

      // Process the message
      const response = await agent.processMessage(sanitizedMessage, context);

      // Log the interaction
      await agent['logInteraction'](context, sanitizedMessage, response);

      // Update metrics
      const responseTime = Date.now() - startTime;
      await agent['updateMetrics'](context, responseTime, true);

      return response;

    } catch (error) {
      console.error('Error in AgentCoordinator.routeMessage:', error);

      // Return a fallback response
      return {
        content: "I apologize, but I'm having trouble processing your request right now. Please try again later.",
        agentType: 'system',
        confidence: 0,
        metadata: { error: error.message }
      };
    }
  }

  private determineBestAgent(message: string, context: AgentContext): string {
    // Analyze the message to determine which agent should handle it
    const messageLower = message.toLowerCase();

    // Priority mapping based on keywords and context
    const agentScores = new Map<string, number>();

    for (const [agentType, agent] of this.agents) {
      let score = 0;

      // Check if user has preference for this agent
      if (context.userPreferences.agents[agentType]?.enabled) {
        score += 10;
      }

      // Check for relevant keywords
      if (agentType === 'career-guidance') {
        if (messageLower.includes('career') || messageLower.includes('path') ||
            messageLower.includes('skills') || messageLower.includes('transition')) {
          score += 20;
        }
      }

      if (agentType === 'interview-preparation') {
        if (messageLower.includes('interview') || messageLower.includes('mock') ||
            messageLower.includes('prepare') || messageLower.includes('question')) {
          score += 20;
        }
      }

      if (agentType === 'application-assistant') {
        if (messageLower.includes('application') || messageLower.includes('resume') ||
            messageLower.includes('cover letter') || messageLower.includes('apply')) {
          score += 20;
        }
      }

      if (agentType === 'employer-assistant') {
        if (messageLower.includes('candidate') || messageLower.includes('screen') ||
            messageLower.includes('hire') || messageLower.includes('posting')) {
          score += 20;
        }
      }

      if (agentType === 'networking-assistant') {
        if (messageLower.includes('network') || messageLower.includes('connect') ||
            messageLower.includes('linkedin') || messageLower.includes('contact')) {
          score += 20;
        }
      }

      agentScores.set(agentType, score);
    }

    // Find the agent with the highest score
    let bestAgent = 'career-guidance'; // Default fallback
    let highestScore = 0;

    for (const [agentType, score] of agentScores) {
      if (score > highestScore) {
        highestScore = score;
        bestAgent = agentType;
      }
    }

    return bestAgent;
  }

  async coordinateAgents(
    task: string,
    context: AgentContext,
    involvedAgents: string[]
  ): Promise<{
    results: Map<string, AgentResponse>;
    summary: AgentResponse;
  }> {
    const results = new Map<string, AgentResponse>();
    const responses: AgentResponse[] = [];

    // Process with each involved agent
    for (const agentType of involvedAgents) {
      try {
        const agent = this.agents.get(agentType);
        if (agent) {
          const response = await agent.processMessage(task, context);
          results.set(agentType, response);
          responses.push(response);
        }
      } catch (error) {
        console.error(`Error in coordinated call to ${agentType}:`, error);
      }
    }

    // Generate summary response
    const summary = await this.generateSummary(task, context, responses);

    return {
      results,
      summary
    };
  }

  private async generateSummary(
    task: string,
    context: AgentContext,
    responses: AgentResponse[]
  ): Promise<AgentResponse> {
    // Use a simple agent to generate a summary
    const summaryAgent = this.agents.get('career-guidance');
    if (!summaryAgent) {
      return {
        content: 'I apologize, but I cannot generate a summary at this time.',
        agentType: 'system',
        confidence: 0
      };
    }

    const combinedResponses = responses
      .map(r => `[${r.agentType}]: ${r.content}`)
      .join('\n\n');

    const summaryMessage = `
      Task: ${task}

      Agent Responses:
      ${combinedResponses}

      Please provide a comprehensive summary that combines insights from all responses and provides a unified recommendation.
    `;

    try {
      return await summaryAgent.processMessage(summaryMessage, context);
    } catch (error) {
      return {
        content: 'I apologize, but I cannot generate a summary at this time.',
        agentType: 'system',
        confidence: 0
      };
    }
  }

  async getSystemMetrics(): Promise<{
    totalAgents: number;
    totalInteractions: number;
    averageResponseTime: number;
    overallSatisfaction: number;
    agentMetrics: Map<string, AgentMetrics[]>;
  }> {
    const totalAgents = this.agents.size;
    const agentMetrics = new Map<string, AgentMetrics[]>();
    let totalInteractions = 0;
    let totalResponseTime = 0;
    let totalSatisfaction = 0;
    let metricCount = 0;

    for (const [agentType, agent] of this.agents) {
      const metrics = await agent.getMetrics();
      agentMetrics.set(agentType, metrics);

      for (const metric of metrics) {
        totalInteractions += metric.totalInteractions;
        totalResponseTime += metric.averageResponseTime;
        totalSatisfaction += metric.satisfactionScore;
        metricCount++;
      }
    }

    return {
      totalAgents,
      totalInteractions,
      averageResponseTime: metricCount > 0 ? totalResponseTime / metricCount : 0,
      overallSatisfaction: metricCount > 0 ? totalSatisfaction / metricCount : 0,
      agentMetrics
    };
  }
}