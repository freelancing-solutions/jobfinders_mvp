import { LLMProvider, LLMRequest, LLMResponse, ProviderConfig, ModelInfo } from '@/types/llm';
import { Logger } from '@/lib/logger';
import { RateLimiter } from '@/lib/rate-limiter';

export class GeminiProvider implements LLMProvider {
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
    this.logger = new Logger('GeminiProvider');
  }

  async generateCompletion(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();

    try {
      await this.rateLimiter.check();

      const payload = this.buildRequestPayload(request);
      const response = await this.makeRequest(payload);
      const processingTime = Date.now() - startTime;

      this.logger.debug(`Gemini request completed in ${processingTime}ms`);
      this.healthy = true;

      return {
        ...response,
        provider: 'gemini',
        processingTime
      };

    } catch (error) {
      this.healthy = false;
      this.logger.error('Gemini request failed:', error);
      throw error;
    }
  }

  async *generateCompletionStream(request: LLMRequest): AsyncGenerator<string, void, unknown> {
    try {
      await this.rateLimiter.check();

      const payload = this.buildRequestPayload(request);
      payload.generationConfig?.streamResponse = true;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${request.model || this.config.models.primary}:streamGenerateContent?key=${this.config.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
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
          if (line.trim()) {
            try {
              const parsed = JSON.parse(line);
              const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
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
      this.logger.error('Gemini streaming request failed:', error);
      throw error;
    }
  }

  supportsStreaming(): boolean {
    return true;
  }

  getName(): string {
    return 'Google Gemini';
  }

  getAvailableModels(): string[] {
    return [
      'gemini-1.5-pro-latest',
      'gemini-1.5-flash-latest',
      'gemini-1.0-pro-latest',
      'gemini-pro-vision',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-1.0-pro'
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
      'gemini-1.5-pro': {
        name: 'Gemini 1.5 Pro',
        maxTokens: 8192,
        contextWindow: 1048576, // 1M tokens
        supportsStreaming: true,
        supportsFunctionCalling: true,
        costPer1KTokens: {
          input: 0.0025,
          output: 0.0075
        },
        capabilities: ['text-generation', 'multimodal', 'function-calling', 'long-context']
      },
      'gemini-1.5-flash': {
        name: 'Gemini 1.5 Flash',
        maxTokens: 8192,
        contextWindow: 1048576, // 1M tokens
        supportsStreaming: true,
        supportsFunctionCalling: true,
        costPer1KTokens: {
          input: 0.00015,
          output: 0.0006
        },
        capabilities: ['text-generation', 'multimodal', 'function-calling', 'fast-response']
      },
      'gemini-1.0-pro': {
        name: 'Gemini 1.0 Pro',
        maxTokens: 8192,
        contextWindow: 32768,
        supportsStreaming: true,
        supportsFunctionCalling: true,
        costPer1KTokens: {
          input: 0.0005,
          output: 0.0015
        },
        capabilities: ['text-generation', 'multimodal', 'function-calling']
      },
      'gemini-pro-vision': {
        name: 'Gemini Pro Vision',
        maxTokens: 4096,
        contextWindow: 16384,
        supportsStreaming: false,
        supportsFunctionCalling: false,
        costPer1KTokens: {
          input: 0.00025,
          output: 0.0005
        },
        capabilities: ['text-generation', 'vision', 'multimodal']
      }
    };

    return modelInfoMap[model] || {
      name: model,
      maxTokens: 8192,
      contextWindow: 32768,
      supportsStreaming: true,
      supportsFunctionCalling: true,
      costPer1KTokens: {
        input: 0.0005,
        output: 0.0015
      },
      capabilities: ['text-generation']
    };
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${this.config.apiKey}`, {
        method: 'GET',
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
    this.logger.info('Gemini provider shutting down...');
    // No specific cleanup needed for HTTP-based provider
  }

  private buildRequestPayload(request: LLMRequest): any {
    const contents = this.convertMessages(request.messages);

    const payload: any = {
      contents: contents,
      generationConfig: {
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.maxTokens ?? 1000,
        topP: request.topP,
        stopSequences: request.stop
      },
      safetySettings: this.getDefaultSafetySettings()
    };

    if (request.systemPrompt) {
      payload.systemInstruction = {
        parts: [{ text: request.systemPrompt }]
      };
    }

    return payload;
  }

  private convertMessages(messages: any[]): any[] {
    const contents: any[] = [];

    for (const message of messages) {
      if (message.role === 'system') {
        // System messages are handled separately in Gemini API
        continue;
      }

      const role = message.role === 'assistant' ? 'model' : 'user';

      contents.push({
        role: role,
        parts: [{ text: message.content }]
      });
    }

    return contents;
  }

  private getDefaultSafetySettings(): any[] {
    return [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      }
    ];
  }

  private async makeRequest(payload: any): Promise<any> {
    const model = payload.model || this.config.models.primary;
    const maxRetries = this.config.retryAttempts || 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.config.apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(this.config.timeout || 30000)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(
            `Gemini API error: ${response.status} ${response.statusText} - ${errorData?.error?.message || 'Unknown error'}`
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

  private convertResponse(geminiResponse: any): any {
    const candidate = geminiResponse.candidates?.[0];
    const content = candidate?.content?.parts?.[0]?.text || '';

    return {
      id: `gemini-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: geminiResponse.modelVersion || 'gemini-pro',
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: content
        },
        finishReason: this.convertFinishReason(candidate?.finishReason)
      }],
      usage: geminiResponse.usageMetadata ? {
        promptTokens: geminiResponse.usageMetadata.promptTokenCount,
        completionTokens: geminiResponse.usageMetadata.candidatesTokenCount,
        totalTokens: geminiResponse.usageMetadata.totalTokenCount
      } : undefined
    };
  }

  private convertFinishReason(finishReason?: string): string {
    const reasonMap: Record<string, string> = {
      'FINISH_REASON_STOP': 'stop',
      'FINISH_REASON_MAX_TOKENS': 'length',
      'FINISH_REASON_SAFETY': 'content_filter',
      'FINISH_REASON_RECITATION': 'content_filter',
      'FINISH_REASON_OTHER': 'stop'
    };

    return reasonMap[finishReason || ''] || 'stop';
  }
}