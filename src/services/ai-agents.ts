import { OpenRouterClient } from '@/lib/openrouter';
import { Redis } from '@/lib/redis';

export class AIAgentSystem {
  private ai: OpenRouterClient;
  private redis: Redis;

  constructor() {
    this.ai = new OpenRouterClient({
      apiKey: process.env.OPENROUTER_API_KEY!
    });
    this.redis = new Redis();
  }

  async getCareerAdvice(params: {
    userId: string;
    context: string;
    history: Array<{ role: string; content: string }>;
  }) {
    const contextKey = `career:${params.userId}`;
    const savedContext = await this.redis.get(contextKey);

    const response = await this.ai.chatCompletion({
      model: 'claude-2',
      messages: [
        { role: 'system', content: savedContext },
        ...params.history,
        { role: 'user', content: params.context }
      ]
    });

    await this.redis.set(contextKey, JSON.stringify(response));
    return response;
  }
}