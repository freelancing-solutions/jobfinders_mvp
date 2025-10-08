import { LLMProvider, LLMRequest, LLMResponse, ProviderConfig, ModelInfo } from '@/types/llm';
import { Logger } from '@/lib/logger';
import { RateLimiter } from '@/lib/rate-limiter';

export class ClaudeProvider implements LLMProvider {
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
    this.logger = new Logger('ClaudeProvider');
  }

  async generateCompletion(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();

    try {
      await this.rateLimiter.check();

      const payload = this.buildRequestPayload(request);
      const response = await this.makeRequest(payload);
      const processingTime = Date.now() - startTime;

      this.logger.debug(`Claude request completed in ${processingTime}ms`);
      this.healthy = true;

      return {
        ...response,
        provider: 'claude',
        processingTime
      };

    } catch (error) {
      this.healthy = false;
      this.logger.error('Claude request failed:', error);
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

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.config.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
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
              if (parsed.type === 'content_block_delta') {
                const content = parsed.delta?.text;
                if (content) {
                  yield content;
                }
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
      this.logger.error('Claude streaming request failed:', error);
      throw error;
    }
  }

  supportsStreaming(): boolean {
    return true;
  }

  getName(): string {
    return 'Claude (Anthropic)';
  }

  getAvailableModels(): string[] {
    return [
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
      'claude-2.1',
      'claude-2.0',
      'claude-instant-1.2'
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
      'claude-3-opus-20240229': {
        name: 'Claude 3 Opus',
        maxTokens: 4096,
        contextWindow: 200000,
        supportsStreaming: true,
        supportsFunctionCalling: false,
        costPer1KTokens: {
          input: 0.015,
          output: 0.075
        },
        capabilities: ['text-generation', 'analysis', 'writing', 'coding']
      },
      'claude-3-sonnet-20240229': {
        name: 'Claude 3 Sonnet',
        maxTokens: 4096,
        contextWindow: 200000,
        supportsStreaming: true,
        supportsFunctionCalling: false,
        costPer1KTokens: {
          input: 0.003,
          output: 0.015
        },
        capabilities: ['text-generation', 'analysis', 'writing', 'coding']
      },
      'claude-3-haiku-20240307': {
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
      'claude-2.1': {
        name: 'Claude 2.1',
        maxTokens: 4096,
        contextWindow: 200000,
        supportsStreaming: true,
        supportsFunctionCalling: false,
        costPer1KTokens: {
          input: 0.008,
          output: 0.024
        },
        capabilities: ['text-generation', 'analysis', 'long-context']
      },
      'claude-2.0': {
        name: 'Claude 2.0',
        maxTokens: 4096,
        contextWindow: 100000,
        supportsStreaming: true,
        supportsFunctionCalling: false,
        costPer1KTokens: {
          input: 0.008,
          output: 0.024
        },
        capabilities: ['text-generation', 'analysis']
      },
      'claude-instant-1.2': {
        name: 'Claude Instant',
        maxTokens: 4096,
        contextWindow: 100000,
        supportsStreaming: true,
        supportsFunctionCalling: false,
        costPer1KTokens: {
          input: 0.0008,
          output: 0.0024
        },
        capabilities: ['text-generation', 'fast-response']
      }
    };

    return modelInfoMap[model] || {
      name: model,
      maxTokens: 4096,
      contextWindow: 100000,
      supportsStreaming: true,
      supportsFunctionCalling: false,
      costPer1KTokens: {
        input: 0.008,
        output: 0.024
      },
      capabilities: ['text-generation']
    };
  }

  async checkHealth(): Promise<boolean> {
    try {
      // Simple health check using a minimal message
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.config.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.config.models.primary,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }]
        }),
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
    this.logger.info('Claude provider shutting down...');
    // No specific cleanup needed for HTTP-based provider
  }

  private buildRequestPayload(request: LLMRequest): any {
    const payload: any = {
      model: request.model || this.config.models.primary,
      max_tokens: request.maxTokens ?? 1000,
      messages: this.convertMessages(request.messages)
    };

    if (request.systemPrompt) {
      payload.system = request.systemPrompt;
    }

    if (request.temperature !== undefined) {
      payload.temperature = Math.max(0, Math.min(1, request.temperature));
    }

    if (request.topP !== undefined) {
      payload.top_p = Math.max(0, Math.min(1, request.topP));
    }

    if (request.stop) {
      payload.stop_sequences = Array.isArray(request.stop) ? request.stop : [request.stop];
    }

    return payload;
  }

  private convertMessages(messages: any[]): any[] {
    const converted: any[] = [];

    for (const message of messages) {
      if (message.role === 'system') {
        // System messages are handled separately in Claude API
        continue;
      }

      converted.push({
        role: message.role === 'assistant' ? 'assistant' : 'user',
        content: message.content
      });
    }

    return converted;
  }

  private async makeRequest(payload: any): Promise<any> {
    const maxRetries = this.config.retryAttempts || 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': this.config.apiKey,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(this.config.timeout || 30000)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(
            `Claude API error: ${response.status} ${response.statusText} - ${errorData?.error?.message || 'Unknown error'}`
          );
        }

        const data = await response.json();
        return this.convertResponse(data);

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

  private convertResponse(claudeResponse: any): any {
    const content = claudeResponse.content?.[0]?.text || '';

    return {
      id: claudeResponse.id,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: claudeResponse.model,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: content
        },
        finishReason: claudeResponse.stop_reason === 'end_turn' ? 'stop' : claudeResponse.stop_reason
      }],
      usage: claudeResponse.usage ? {
        promptTokens: claudeResponse.usage.input_tokens,
        completionTokens: claudeResponse.usage.output_tokens,
        totalTokens: claudeResponse.usage.input_tokens + claudeResponse.usage.output_tokens
      } : undefined
    };
  }
}