import { v4 as uuidv4 } from 'uuid';
import {
  AgentType,
  AgentRequest,
  AgentResponse,
  AgentCapabilities,
  AgentStatus,
  AgentHealth,
  AgentMetrics,
  AgentConfiguration,
  ModelConfiguration,
  BehaviorSettings
} from '@/types/agents';
import { LLMService } from '../llm/llm-service';
import { Logger } from '@/lib/logger';

export abstract class BaseAgent {
  protected agentId: string;
  protected agentType: AgentType;
  protected configuration: AgentConfiguration;
  protected llmService: LLMService;
  protected logger: Logger;
  protected status: AgentStatus;
  protected lastActivity: Date;
  protected metrics: AgentMetrics;
  protected startTime: Date;

  constructor(
    agentType: AgentType,
    configuration: AgentConfiguration,
    llmService: LLMService
  ) {
    this.agentId = configuration.agentId;
    this.agentType = agentType;
    this.configuration = configuration;
    this.llmService = llmService;
    this.logger = new Logger(`${agentType}-agent`);
    this.status = AgentStatus.INACTIVE;
    this.lastActivity = new Date();
    this.startTime = new Date();

    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      averageResponseTime: 0,
      userSatisfactionScore: 0,
      errorRate: 0,
      uptime: 0,
      concurrentSessions: 0,
      resourceUsage: {
        cpu: 0,
        memory: 0,
        tokens: 0
      }
    };
  }

  /**
   * Get the agent ID
   */
  getAgentId(): string {
    return this.agentId;
  }

  /**
   * Get the agent type
   */
  getAgentType(): AgentType {
    return this.agentType;
  }

  /**
   * Get agent capabilities
   */
  getCapabilities(): AgentCapabilities {
    return this.configuration.capabilities;
  }

  /**
   * Process a user request
   */
  async processRequest(request: AgentRequest): Promise<AgentResponse> {
    const startTime = Date.now();
    this.status = AgentStatus.BUSY;
    this.metrics.totalRequests++;
    this.lastActivity = new Date();

    try {
      this.logger.info(`Processing request for user ${request.userId}`);

      // Validate request
      await this.validateRequest(request);

      // Pre-process request
      const processedRequest = await this.preProcessRequest(request);

      // Generate response using LLM
      const llmResponse = await this.generateLLMResponse(processedRequest);

      // Post-process response
      const response = await this.postProcessResponse(llmResponse, request);

      // Update metrics
      const processingTime = Date.now() - startTime;
      this.updateMetrics(processingTime, true);

      this.status = AgentStatus.ACTIVE;

      this.logger.debug(`Request processed successfully in ${processingTime}ms`);
      return response;

    } catch (error) {
      this.status = AgentStatus.ERROR;
      const processingTime = Date.now() - startTime;
      this.updateMetrics(processingTime, false);

      this.logger.error('Error processing request:', error);

      return this.handleError(error, request);
    }
  }

  /**
   * Generate streaming response
   */
  async *processRequestStream(request: AgentRequest): AsyncGenerator<string, void, unknown> {
    this.status = AgentStatus.BUSY;
    this.metrics.totalRequests++;
    this.lastActivity = new Date();

    try {
      this.logger.info(`Processing streaming request for user ${request.userId}`);

      // Validate request
      await this.validateRequest(request);

      // Pre-process request
      const processedRequest = await this.preProcessRequest(request);

      // Generate streaming response
      const llmRequest = this.buildLLMRequest(processedRequest);
      yield* this.llmService.generateCompletionStream(llmRequest);

      this.status = AgentStatus.ACTIVE;

    } catch (error) {
      this.status = AgentStatus.ERROR;
      this.logger.error('Error processing streaming request:', error);
      throw error;
    }
  }

  /**
   * Start the agent
   */
  async start(): Promise<void> {
    try {
      this.logger.info(`Starting agent ${this.agentId}`);

      // Perform agent-specific initialization
      await this.initialize();

      this.status = AgentStatus.ACTIVE;
      this.startTime = new Date();

      this.logger.info(`Agent ${this.agentId} started successfully`);

    } catch (error) {
      this.status = AgentStatus.ERROR;
      this.logger.error(`Failed to start agent ${this.agentId}:`, error);
      throw error;
    }
  }

  /**
   * Stop the agent
   */
  async stop(): Promise<void> {
    try {
      this.logger.info(`Stopping agent ${this.agentId}`);

      // Perform agent-specific cleanup
      await this.cleanup();

      this.status = AgentStatus.INACTIVE;

      this.logger.info(`Agent ${this.agentId} stopped successfully`);

    } catch (error) {
      this.status = AgentStatus.ERROR;
      this.logger.error(`Failed to stop agent ${this.agentId}:`, error);
      throw error;
    }
  }

  /**
   * Pause the agent
   */
  async pause(): Promise<void> {
    if (this.status === AgentStatus.ACTIVE) {
      this.status = AgentStatus.INACTIVE;
      this.logger.info(`Agent ${this.agentId} paused`);
    }
  }

  /**
   * Resume the agent
   */
  async resume(): Promise<void> {
    if (this.status === AgentStatus.INACTIVE) {
      this.status = AgentStatus.ACTIVE;
      this.logger.info(`Agent ${this.agentId} resumed`);
    }
  }

  /**
   * Get agent health status
   */
  async getHealthStatus(): Promise<AgentHealth> {
    const uptime = Date.now() - this.startTime.getTime();

    // Check LLM service health
    const llmHealth = await this.llmService.getHealthStatus();

    // Check agent-specific health
    const agentHealth = await this.checkAgentHealth();

    return {
      status: this.status,
      lastCheck: new Date(),
      responseTime: this.metrics.averageResponseTime,
      errorCount: this.metrics.totalRequests - this.metrics.successfulRequests,
      uptime: uptime,
      memoryUsage: this.metrics.resourceUsage.memory,
      cpuUsage: this.metrics.resourceUsage.cpu,
      activeConnections: this.metrics.concurrentSessions,
      llmHealth: llmHealth,
      agentHealth: agentHealth
    };
  }

  /**
   * Get agent metrics
   */
  getMetrics(): AgentMetrics {
    // Update uptime
    this.metrics.uptime = Date.now() - this.startTime.getTime();

    return { ...this.metrics };
  }

  /**
   * Get last activity time
   */
  getLastActivity(): Date {
    return this.lastActivity;
  }

  /**
   * Update agent configuration
   */
  async updateConfiguration(newConfig: Partial<AgentConfiguration>): Promise<void> {
    try {
      this.configuration = { ...this.configuration, ...newConfig };
      this.logger.info('Agent configuration updated');

      // Apply configuration changes
      await this.applyConfigurationChanges(newConfig);

    } catch (error) {
      this.logger.error('Failed to update agent configuration:', error);
      throw error;
    }
  }

  /**
   * Shutdown the agent
   */
  async shutdown(): Promise<void> {
    try {
      this.logger.info(`Shutting down agent ${this.agentId}`);
      await this.stop();
      await this.cleanup();
      this.logger.info(`Agent ${this.agentId} shutdown complete`);
    } catch (error) {
      this.logger.error(`Error during agent shutdown:`, error);
      throw error;
    }
  }

  // Abstract methods to be implemented by specific agents

  /**
   * Initialize agent-specific resources
   */
  protected abstract initialize(): Promise<void>;

  /**
   * Cleanup agent-specific resources
   */
  protected abstract cleanup(): Promise<void>;

  /**
   * Validate incoming request
   */
  protected abstract validateRequest(request: AgentRequest): Promise<void>;

  /**
   * Pre-process request before sending to LLM
   */
  protected abstract preProcessRequest(request: AgentRequest): Promise<AgentRequest>;

  /**
   * Build LLM request from agent request
   */
  protected abstract buildLLMRequest(request: AgentRequest): any;

  /**
   * Post-process LLM response
   */
  protected abstract postProcessResponse(
    llmResponse: any,
    originalRequest: AgentRequest
  ): Promise<AgentResponse>;

  /**
   * Handle errors during request processing
   */
  protected abstract handleError(error: any, request: AgentRequest): AgentResponse;

  /**
   * Check agent-specific health
   */
  protected abstract checkAgentHealth(): Promise<Record<string, any>>;

  /**
   * Apply configuration changes
   */
  protected abstract applyConfigurationChanges(
    configChanges: Partial<AgentConfiguration>
  ): Promise<void>;

  // Helper methods

  /**
   * Update agent metrics
   */
  private updateMetrics(responseTime: number, success: boolean): void {
    if (success) {
      this.metrics.successfulRequests++;
    }

    // Update average response time
    const totalResponses = this.metrics.successfulRequests;
    const currentAverage = this.metrics.averageResponseTime;
    this.metrics.averageResponseTime =
      (currentAverage * (totalResponses - 1) + responseTime) / totalResponses;

    // Update error rate
    this.metrics.errorRate =
      (this.metrics.totalRequests - this.metrics.successfulRequests) / this.metrics.totalRequests;

    // Update uptime
    this.metrics.uptime = Date.now() - this.startTime.getTime();
  }

  /**
   * Generate LLM response
   */
  private async generateLLMResponse(request: AgentRequest): Promise<any> {
    const llmRequest = this.buildLLMRequest(request);

    // Add system prompt from configuration
    if (this.configuration.modelConfig.systemPrompt) {
      llmRequest.systemPrompt = this.configuration.modelConfig.systemPrompt;
    }

    // Add model configuration
    llmRequest.temperature = this.configuration.modelConfig.temperature;
    llmRequest.maxTokens = this.configuration.modelConfig.maxTokens;

    return await this.llmService.generateCompletion(llmRequest);
  }

  /**
   * Get system prompt based on agent type and context
   */
  protected getSystemPrompt(context?: Record<string, any>): string {
    const basePrompt = this.configuration.modelConfig.systemPrompt;
    const behaviorSettings = this.configuration.behaviorSettings;

    let prompt = basePrompt;

    // Add behavior-specific instructions
    if (behaviorSettings) {
      prompt += `\n\nCommunication Style: ${behaviorSettings.personality}`;
      prompt += `\nResponse Style: ${behaviorSettings.responseStyle}`;
      prompt += `\nProactivity Level: ${behaviorSettings.proactivity}`;

      if (behaviorSettings.customInstructions) {
        prompt += `\n\nCustom Instructions:\n${behaviorSettings.customInstructions}`;
      }
    }

    // Add context-specific instructions
    if (context) {
      prompt += `\n\nContext: ${JSON.stringify(context, null, 2)}`;
    }

    return prompt;
  }

  /**
   * Format response based on agent capabilities
   */
  protected formatResponse(content: string, metadata?: Record<string, any>): AgentResponse {
    return {
      content,
      suggestions: this.generateSuggestions(content),
      actions: this.generateActions(content, metadata),
      metadata: {
        agentId: this.agentId,
        agentType: this.agentType,
        timestamp: new Date(),
        ...metadata
      },
      confidence: this.calculateConfidence(content)
    };
  }

  /**
   * Generate suggestions based on response content
   */
  protected generateSuggestions(content: string): string[] {
    // Default implementation - can be overridden by specific agents
    return [];
  }

  /**
   * Generate suggested actions based on response content
   */
  protected generateActions(content: string, metadata?: Record<string, any>): any[] {
    // Default implementation - can be overridden by specific agents
    return [];
  }

  /**
   * Calculate confidence score for the response
   */
  protected calculateConfidence(content: string): number {
    // Simple confidence calculation based on content length and completeness
    if (!content || content.length < 10) return 0.3;
    if (content.length < 100) return 0.6;
    return 0.9;
  }
}