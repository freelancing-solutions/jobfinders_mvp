# JobFinders Build Fix Specification

## Problem Analysis

The build is failing due to three main issues:

1. **Missing Module**: `./src/components/query-provider` not found
2. **Syntax Error**: Unexpected token `div` in pricing-plans.tsx
3. **Missing Modules**: `@/lib/redis` and `@/lib/vector-store` not found

## Solution Specification

### 1. Fix Missing Query Provider

**File**: `src/components/providers.tsx`

**Issue**: The import statement is trying to import from `./query-provider` but the file doesn't exist.

**Solution**:
Create the missing query provider component:

```typescript
// src/components/query-provider.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

interface QueryProviderProps {
  children: ReactNode;
}

export default function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

### 2. Fix Syntax Error in Pricing Plans

**File**: `src/components/subscription/pricing-plans.tsx`

**Issue**: JSX syntax error around line 158 - unexpected token `div`

**Solution**:
Check for missing JSX elements, unclosed tags, or incorrect syntax:

```typescript
// Before (problematic code)
return (
  <div className="space-y-8">
    {/* Plan Type Selector */}
    <div className="flex justify-center gap-4">
      <Button
      // ... rest of component
```

**Fix**: Ensure all JSX elements are properly closed and syntax is correct:

```typescript
// After (fixed code)
return (
  <div className="space-y-8">
    {/* Plan Type Selector */}
    <div className="flex justify-center gap-4">
      <Button variant={isEmployer ? "default" : "outline"} onClick={() => setIsEmployer(true)}>
        For Employers
      </Button>
      <Button variant={!isEmployer ? "default" : "outline"} onClick={() => setIsEmployer(false)}>
        For Job Seekers
      </Button>
    </div>
    {/* Rest of the component */}
  </div>
);
```

### 3. Create Missing Library Modules

**File**: `src/lib/redis.ts`

**Issue**: Module not found

**Solution**:
Create Redis client utility:

```typescript
// src/lib/redis.ts
import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export default redis;
```

**File**: `src/lib/vector-store.ts`

**Issue**: Module not found

**Solution**:
Create vector store utility:

```typescript
// src/lib/vector-store.ts
import { Pinecone } from '@pinecone-database/pinecone';

export const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

export default pinecone;
```

### 4. Environment Variables Setup

**File**: `.env.local` (or Vercel environment variables)

**Required Variables**:
```
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
PINECONE_API_KEY=your_pinecone_api_key
```

### 5. Package Dependencies

**File**: `package.json`

**Required Dependencies**:
```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.0.0",
    "@upstash/redis": "^1.0.0",
    "@pinecone-database/pinecone": "^2.0.0"
  }
}
```

## Implementation Steps

1. **Create missing files**:
   - `src/components/query-provider.tsx`
   - `src/lib/redis.ts`
   - `src/lib/vector-store.ts`

2. **Fix syntax error** in `src/components/subscription/pricing-plans.tsx`

3. **Install required dependencies**:
   ```bash
   npm install @tanstack/react-query @upstash/redis @pinecone-database/pinecone
   ```

4. **Set up environment variables** in Vercel dashboard

5. **Test the build locally**:
   ```bash
   npm run build
   ```

## Verification

After implementing the fixes:

1. **Build should complete successfully** without module not found errors
2. **No syntax errors** should be reported
3. **All imports should resolve** correctly
4. **Production build** should be created without issues

## Rollback Plan

If issues persist:
1. Revert changes to individual files
2. Check for any additional missing dependencies
3. Verify environment variables are properly set
4. Review build logs for any new errors

This specification addresses all the build failures identified in the error logs and provides a clear path to fix the JobFinders project build.
