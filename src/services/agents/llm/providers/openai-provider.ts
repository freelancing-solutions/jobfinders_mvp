import { LLMProvider, LLMRequest, LLMResponse, ProviderConfig, ModelInfo } from '@/types/llm';
import { Logger } from '@/lib/logger';
import { RateLimiter } from '@/lib/rate-limiter';

export class OpenRouterProvider implements LLMProvider {
  private config: ProviderConfig;
  private rateLimiter: RateLimiter;
  private logger: Logger;
  private healthy: boolean = true;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.rateLimiter = new RateLimiter({
      maxRequests: config.rateLimit.requests,
      windowMs: config.rateLimit.window,
    });
    this.logger = new Logger('OpenRouterProvider');
  }

  async generateCompletion(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();

    try {
      await this.rateLimiter.check();

      const payload = this.buildRequestPayload(request);
      const response = await this.makeRequest(payload);
      const processingTime = Date.now() - startTime;

      this.logger.debug(`OpenRouter request completed in ${processingTime}ms`);
      this.healthy = true;

      return {
        ...response,
        provider: 'openrouter',
        processingTime
      };

    } catch (error) {
      this.healthy = false;
      this.logger.error('OpenRouter request failed:', error);
      throw error;
    }
  }

  async *generateCompletionStream(request: LLMRequest): AsyncGenerator<string, void, unknown> {
    try {
      await this.rateLimiter.check();

      const payload = {
        ...this.buildRequestPayload(request),
        stream: true
      };

      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.APP_URL || 'https://jobfinders.app',
          'X-Title': 'JobFinders AI Agents'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                yield content;
              }
            } catch (e) {
              // Skip malformed JSON
            }
          }
        }
      }

      this.healthy = true;

    } catch (error) {
      this.healthy = false;
      this.logger.error('OpenRouter streaming request failed:', error);
      throw error;
    }
  }

  supportsStreaming(): boolean {
    return true;
  }

  getName(): string {
    return 'OpenRouter';
  }

  getAvailableModels(): string[] {
    return [
      'openai/gpt-4',
      'openai/gpt-4-turbo-preview',
      'openai/gpt-3.5-turbo',
      'anthropic/claude-3-opus-20240229',
      'anthropic/claude-3-sonnet-20240229',
      'anthropic/claude-3-haiku-20240307',
      'google/gemini-pro',
      'google/gemini-pro-vision',
      'meta-llama/llama-3-70b-instruct',
      'meta-llama/llama-3-8b-instruct'
    ];
  }

  getPrimaryModel(): string {
    return this.config.models.primary;
  }

  getFallbackModels(): string[] {
    return this.config.models.fallback;
  }

  getModelInfo(model: string): ModelInfo {
    const modelInfoMap: Record<string, ModelInfo> = {
      'openai/gpt-4': {
        name: 'GPT-4',
        maxTokens: 8192,
        contextWindow: 8192,
        supportsStreaming: true,
        supportsFunctionCalling: true,
        costPer1KTokens: {
          input: 0.03,
          output: 0.06
        },
        capabilities: ['text-generation', 'function-calling', 'code-generation']
      },
      'openai/gpt-4-turbo-preview': {
        name: 'GPT-4 Turbo',
        maxTokens: 128000,
        contextWindow: 128000,
        supportsStreaming: true,
        supportsFunctionCalling: true,
        costPer1KTokens: {
          input: 0.01,
          output: 0.03
        },
        capabilities: ['text-generation', 'function-calling', 'code-generation', 'vision']
      },
      'openai/gpt-3.5-turbo': {
        name: 'GPT-3.5 Turbo',
        maxTokens: 4096,
        contextWindow: 4096,
        supportsStreaming: true,
        supportsFunctionCalling: true,
        costPer1KTokens: {
          input: 0.0005,
          output: 0.0015
        },
        capabilities: ['text-generation', 'function-calling']
      },
      'anthropic/claude-3-opus-20240229': {
        name: 'Claude 3 Opus',
        maxTokens: 4096,
        contextWindow: 200000,
        supportsStreaming: true,
        supportsFunctionCalling: false,
        costPer1KTokens: {
          input: 0.015,
          output: 0.075
        },
        capabilities: ['text-generation', 'analysis', 'writing']
      },
      'anthropic/claude-3-sonnet-20240229': {
        name: 'Claude 3 Sonnet',
        maxTokens: 4096,
        contextWindow: 200000,
        supportsStreaming: true,
        supportsFunctionCalling: false,
        costPer1KTokens: {
          input: 0.003,
          output: 0.015
        },
        capabilities: ['text-generation', 'analysis', 'writing']
      },
      'anthropic/claude-3-haiku-20240307': {
        name: 'Claude 3 Haiku',
        maxTokens: 4096,
        contextWindow: 200000,
        supportsStreaming: true,
        supportsFunctionCalling: false,
        costPer1KTokens: {
          input: 0.00025,
          output: 0.00125
        },
        capabilities: ['text-generation', 'fast-response']
      },
      'google/gemini-pro': {
        name: 'Gemini Pro',
        maxTokens: 8192,
        contextWindow: 32768,
        supportsStreaming: true,
        supportsFunctionCalling: true,
        costPer1KTokens: {
          input: 0.0005,
          output: 0.0015
        },
        capabilities: ['text-generation', 'multimodal', 'function-calling']
      }
    };

    return modelInfoMap[model] || {
      name: model,
      maxTokens: 4096,
      contextWindow: 4096,
      supportsStreaming: true,
      supportsFunctionCalling: false,
      costPer1KTokens: {
        input: 0.001,
        output: 0.002
      },
      capabilities: ['text-generation']
    };
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        signal: AbortSignal.timeout(5000)
      });

      this.healthy = response.ok;
      return this.healthy;

    } catch (error) {
      this.healthy = false;
      this.logger.error('Health check failed:', error);
      return false;
    }
  }

  isHealthy(): boolean {
    return this.healthy;
  }

  async shutdown(): Promise<void> {
    this.logger.info('OpenRouter provider shutting down...');
    // No specific cleanup needed for HTTP-based provider
  }

  private buildRequestPayload(request: LLMRequest): any {
    const payload: any = {
      model: request.model || this.config.models.primary,
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 1000,
    };

    if (request.topP !== undefined) payload.top_p = request.topP;
    if (request.frequencyPenalty !== undefined) payload.frequency_penalty = request.frequencyPenalty;
    if (request.presencePenalty !== undefined) payload.presence_penalty = request.presencePenalty;
    if (request.stop) payload.stop = request.stop;

    // Add system prompt if provided
    if (request.systemPrompt) {
      payload.messages.unshift({
        role: 'system',
        content: request.systemPrompt
      });
    }

    return payload;
  }

  private async makeRequest(payload: any): Promise<any> {
    const maxRetries = this.config.retryAttempts || 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.APP_URL || 'https://jobfinders.app',
            'X-Title': 'JobFinders AI Agents'
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(this.config.timeout || 30000)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(
            `OpenRouter API error: ${response.status} ${response.statusText} - ${errorData?.error?.message || 'Unknown error'}`
          );
        }

        return await response.json();

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        if (attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          this.logger.warn(`Request failed, retrying in ${delay}ms...`, lastError);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }
}