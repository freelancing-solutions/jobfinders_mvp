import { OpenRouterConfig } from '@/types/ai';

export const openRouterConfig: OpenRouterConfig = {
  apiKey: process.env.OPENROUTER_API_KEY!,
  models: {
    primary: 'claude-2',
    fallback: 'gpt-3.5-turbo',
  },
  endpoints: {
    chat: `${process.env.OPENROUTER_API_URL}/chat/completions`,
    completions: `${process.env.OPENROUTER_API_URL}/completions`,
  },
  rateLimit: {
    requests: 50,
    window: 60000, // 1 minute
  },
};
