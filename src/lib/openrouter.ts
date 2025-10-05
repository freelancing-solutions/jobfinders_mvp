import { OpenRouterConfig } from '@/types/ai';
import { RateLimiter } from './rate-limiter';

export class OpenRouterError extends Error {
  constructor(
    message: string, 
    public statusCode?: number,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'OpenRouterError';
  }
}

export class OpenRouterClient {
  private config: OpenRouterConfig;
  private rateLimit: RateLimiter;

  constructor(config: OpenRouterConfig) {
    this.config = config;
    this.rateLimit = new RateLimiter({
      maxRequests: config.rateLimit.requests,
      windowMs: config.rateLimit.window,
    });
  }

  async chatCompletion(params: {
    model?: 'claude-2' | 'gpt-3.5-turbo';
    messages: Array<{ role: string; content: string }>;
    temperature?: number;
    maxRetries?: number;
  }) {
    const model = params.model || this.config.models.primary;
    const maxRetries = params.maxRetries ?? 2;
    let retries = 0;

    while (retries <= maxRetries) {
      try {
        await this.rateLimit.check();
        
        const response = await fetch(this.config.endpoints.chat, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...params,
            model,
          }),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => null);
          throw new OpenRouterError(
            error?.message || 'OpenRouter API error',
            response.status,
            response.status >= 500 || response.status === 429
          );
        }

        return await response.json();
      } catch (error) {
        if (error instanceof OpenRouterError) {
          // Try fallback model on specific errors
          if (model === this.config.models.primary && 
              (error.statusCode === 429 || error.statusCode >= 500)) {
            return this.chatCompletion({
              ...params,
              model: this.config.models.fallback,
              maxRetries: 1, // Limited retries for fallback
            });
          }

          // Retry on retryable errors
          if (error.retryable && retries < maxRetries) {
            retries++;
            await new Promise(resolve => setTimeout(resolve, 1000 * retries));
            continue;
          }
        }
        throw error instanceof OpenRouterError ? error : 
          new OpenRouterError('Failed to complete chat request');
      }
    }

    throw new OpenRouterError('Max retries exceeded');
  }
}