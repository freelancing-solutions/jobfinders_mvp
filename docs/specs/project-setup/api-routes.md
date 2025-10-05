# API Routes Structure

## Base Routes
```typescript
const API_ROUTES = {
    auth: '/api/auth',
    subscriptions: '/api/subscriptions',
    resume: '/api/resume',
    jobs: '/api/jobs',
    matching: '/api/matching',
    agents: '/api/agents',
    ats: '/api/ats',
} as const;
```

## Middleware Configuration
```typescript
import { withAuth } from 'next-auth/middleware';
import { RateLimiter } from '@/lib/rate-limiter';

export default withAuth({
    callbacks: {
        authorized: ({ token }) => !!token
    },
    pages: {
        signIn: '/auth/signin',
    }
});
```