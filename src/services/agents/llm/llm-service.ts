import { Logger } from '@/lib/logger';
import { OpenRouterProvider } from './providers/openai-provider';
import { ClaudeProvider } from './providers/claude-provider';
import { GeminiProvider } from './providers/gemini-provider';
import { LLMRequest, LLMResponse, LLMProvider, ModelConfiguration } from '@/types/llm';

export class LLMService {
  private providers: Map<string, LLMProvider> = new Map();
  private defaultProvider: string;
  private fallbackProviders: string[];
  private logger: Logger;

  constructor() {
    this.logger = new Logger('LLMService');
    this.initializeProviders();
  }

  /**
   * Initialize all available LLM providers
   */
  private initializeProviders(): void {
    try {
      // Initialize OpenAI/OpenRouter provider
      const openRouterProvider = new OpenRouterProvider({
        apiKey: process.env.OPENROUTER_API_KEY!,
        baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
        models: {
          primary: 'openai/gpt-4',
          fallback: ['anthropic/claude-3-haiku', 'google/gemini-pro']
        },
        rateLimit: {
          requests: 100,
          window: 60000 // 1 minute
        }
      });

      this.providers.set('openrouter', openRouterProvider);

      // Initialize Claude provider
      const claudeProvider = new ClaudeProvider({
        apiKey: process.env.ANTHROPIC_API_KEY!,
        models: {
          primary: 'claude-3-opus-20240229',
          fallback: ['claude-3-sonnet-20240229', 'claude-3-haiku-20240307']
        },
        rateLimit: {
          requests: 50,
          window: 60000
        }
      });

      this.providers.set('claude', claudeProvider);

      // Initialize Gemini provider
      const geminiProvider = new GeminiProvider({
        apiKey: process.env.GOOGLE_AI_API_KEY!,
        models: {
          primary: 'gemini-1.5-pro',
          fallback: ['gemini-1.0-pro']
        },
        rateLimit: {
          requests: 60,
          window: 60000
        }
      });

      this.providers.set('gemini', geminiProvider);

      // Set default and fallback providers
      this.defaultProvider = process.env.DEFAULT_LLM_PROVIDER || 'openrouter';
      this.fallbackProviders = ['claude', 'gemini'];

      this.logger.info(`Initialized ${this.providers.size} LLM providers`);

    } catch (error) {
      this.logger.error('Error initializing LLM providers:', error);
      throw error;
    }
  }

  /**
   * Generate text completion
   */
  async generateCompletion(request: LLMRequest): Promise<LLMResponse> {
    const provider = request.provider || this.defaultProvider;

    try {
      return await this.executeWithFallback(provider, request);
    } catch (error) {
      this.logger.error(`Error generating completion with provider ${provider}:`, error);

      // Try fallback providers
      for (const fallbackProvider of this.fallbackProviders) {
        if (fallbackProvider !== provider && this.providers.has(fallbackProvider)) {
          try {
            this.logger.info(`Trying fallback provider: ${fallbackProvider}`);
            return await this.executeWithFallback(fallbackProvider, request);
          } catch (fallbackError) {
            this.logger.error(`Fallback provider ${fallbackProvider} also failed:`, fallbackError);
          }
        }
      }

      throw new Error('All LLM providers failed to generate completion');
    }
  }

  /**
   * Generate streaming completion
   */
  async *generateCompletionStream(request: LLMRequest): AsyncGenerator<string, void, unknown> {
    const provider = request.provider || this.defaultProvider;

    try {
      const llmProvider = this.providers.get(provider);
      if (!llmProvider) {
        throw new Error(`Provider ${provider} not found`);
      }

      if (!llmProvider.supportsStreaming()) {
        throw new Error(`Provider ${provider} does not support streaming`);
      }

      yield* llmProvider.generateCompletionStream(request);

    } catch (error) {
      this.logger.error(`Error generating streaming completion with provider ${provider}:`, error);

      // For streaming, we'll try one fallback provider
      for (const fallbackProvider of this.fallbackProviders) {
        if (fallbackProvider !== provider && this.providers.has(fallbackProvider)) {
          const llmProvider = this.providers.get(fallbackProvider);
          if (llmProvider?.supportsStreaming()) {
            try {
              this.logger.info(`Trying fallback provider for streaming: ${fallbackProvider}`);
              yield* llmProvider.generateCompletionStream(request);
              return;
            } catch (fallbackError) {
              this.logger.error(`Fallback provider ${fallbackProvider} streaming also failed:`, fallbackError);
            }
          }
        }
      }

      throw new Error('All LLM providers failed to generate streaming completion');
    }
  }

  /**
   * Execute request with a specific provider including its own fallback models
   */
  private async executeWithFallback(providerName: string, request: LLMRequest): Promise<LLMResponse> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Provider ${providerName} not found`);
    }

    try {
      return await provider.generateCompletion(request);
    } catch (error) {
      // Try provider's internal fallback models
      const fallbackModels = provider.getFallbackModels();
      for (const fallbackModel of fallbackModels) {
        try {
          this.logger.info(`Trying fallback model ${fallbackModel} for provider ${providerName}`);
          return await provider.generateCompletion({
            ...request,
            model: fallbackModel
          });
        } catch (fallbackError) {
          this.logger.error(`Fallback model ${fallbackModel} failed:`, fallbackError);
        }
      }
      throw error;
    }
  }

  /**
   * Get available providers and their models
   */
  getAvailableProviders(): Record<string, any> {
    const providers: Record<string, any> = {};

    for (const [name, provider] of this.providers) {
      providers[name] = {
        name: provider.getName(),
        models: provider.getAvailableModels(),
        supportsStreaming: provider.supportsStreaming(),
        isHealthy: provider.isHealthy()
      };
    }

    return providers;
  }

  /**
   * Get health status of all providers
   */
  async getHealthStatus(): Promise<Record<string, any>> {
    const healthStatus: Record<string, any> = {};

    for (const [name, provider] of this.providers) {
      try {
        const isHealthy = await provider.checkHealth();
        healthStatus[name] = {
          healthy: isHealthy,
          lastCheck: new Date(),
          error: null
        };
      } catch (error) {
        healthStatus[name] = {
          healthy: false,
          lastCheck: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    return healthStatus;
  }

  /**
   * Get model information and capabilities
   */
  getModelInfo(providerName: string, modelName: string): any {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Provider ${providerName} not found`);
    }

    return provider.getModelInfo(modelName);
  }

  /**
   * Estimate token count for text
   */
  estimateTokens(text: string, model?: string): number {
    // Simple token estimation (rough approximation)
    // In production, you'd use proper tokenizers like tiktoken
    const words = text.split(/\s+/).length;
    const characters = text.length;

    // Rough estimation: ~1.3 tokens per word or ~4 characters per token
    return Math.ceil(Math.max(words * 1.3, characters / 4));
  }

  /**
   * Get optimal model for request based on requirements
   */
  getOptimalModel(request: {
    taskType: string;
    complexity: 'low' | 'medium' | 'high';
    maxTokens?: number;
    latencyRequirement?: 'fast' | 'normal' | 'slow';
    costConstraint?: 'low' | 'medium' | 'high';
  }): { provider: string; model: string; reason: string } {
    const { taskType, complexity, maxTokens, latencyRequirement, costConstraint } = request;

    // Define model selection logic based on requirements
    if (taskType === 'code_generation' && complexity === 'high') {
      return {
        provider: 'openrouter',
        model: 'openai/gpt-4',
        reason: 'Best for complex code generation with high accuracy'
      };
    }

    if (taskType === 'creative_writing' && complexity === 'medium') {
      return {
        provider: 'claude',
        model: 'claude-3-opus-20240229',
        reason: 'Excellent for creative tasks with good context handling'
      };
    }

    if (latencyRequirement === 'fast' && complexity === 'low') {
      return {
        provider: 'claude',
        model: 'claude-3-haiku-20240307',
        reason: 'Fast response time for simple tasks'
      };
    }

    if (costConstraint === 'low') {
      return {
        provider: 'openrouter',
        model: 'openai/gpt-3.5-turbo',
        reason: 'Cost-effective for general tasks'
      };
    }

    if (maxTokens && maxTokens > 32000) {
      return {
        provider: 'gemini',
        model: 'gemini-1.5-pro',
        reason: 'Large context window for long content'
      };
    }

    // Default selection
    return {
      provider: this.defaultProvider,
      model: this.providers.get(this.defaultProvider)?.getPrimaryModel() || 'gpt-4',
      reason: 'Default balanced choice'
    };
  }

  /**
   * Validate request parameters
   */
  validateRequest(request: LLMRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.messages || request.messages.length === 0) {
      errors.push('Messages array is required and cannot be empty');
    }

    if (request.messages) {
      for (const [index, message] of request.messages.entries()) {
        if (!message.role || !['system', 'user', 'assistant'].includes(message.role)) {
          errors.push(`Message ${index}: Invalid role "${message.role}"`);
        }
        if (!message.content || typeof message.content !== 'string') {
          errors.push(`Message ${index}: Content is required and must be a string`);
        }
      }
    }

    if (request.temperature !== undefined && (request.temperature < 0 || request.temperature > 2)) {
      errors.push('Temperature must be between 0 and 2');
    }

    if (request.maxTokens !== undefined && request.maxTokens <= 0) {
      errors.push('Max tokens must be greater than 0');
    }

    if (request.provider && !this.providers.has(request.provider)) {
      errors.push(`Provider "${request.provider}" is not available`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Shutdown all providers
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down LLMService...');

    const shutdownPromises = Array.from(this.providers.values()).map(provider =>
      provider.shutdown().catch(error =>
        this.logger.error('Error shutting down provider:', error)
      )
    );

    await Promise.all(shutdownPromises);
    this.logger.info('LLMService shutdown complete');
  }
}