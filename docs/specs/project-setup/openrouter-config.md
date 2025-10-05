# OpenRouter API Configuration

## Setup
```typescript
interface OpenRouterConfig {
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
```

## Environment Variables
```env
OPENROUTER_API_KEY=your_api_key
OPENROUTER_API_URL=https://api.openrouter.ai/api/v1
OPENROUTER_ORGANIZATION=your_org_id
```

## Rate Limiting
```typescript
interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
    keyPrefix: string;
}
```