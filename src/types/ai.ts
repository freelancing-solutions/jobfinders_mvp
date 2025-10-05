export interface OpenRouterConfig {
  apiKey: string;
  models: {
    primary: 'claude-2';
    fallback: 'gpt-3.5-turbo';
  };
  endpoints: {
    chat: string;
    completions: string;
  };
  rateLimit: {
    requests: number;
    window: number;
  };
}

export interface OpenRouterResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
