# Development Workflow Guide

## Overview

This guide outlines the development workflow for the JobFinders platform, including setup processes, coding standards, and best practices for working with the modular database schema architecture.

## Prerequisites

### Required Tools
- **Node.js** 18+
- **npm** or **yarn**
- **PostgreSQL** (or preferred database)
- **Git** for version control
- **VS Code** (recommended) with TypeScript extensions

### Environment Setup
```bash
# Clone the repository
git clone <repository-url>
cd jobfinders-mvp

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Configure database URL in .env.local
DATABASE_URL="postgresql://username:password@localhost:5432/jobfinders"
```

## Getting Started

### 1. Initial Setup

```bash
# Build database schema from separated modules
npm run schema:build

# Set up database
npm run schema:dev

# Generate Prisma client
npx prisma generate

# (Optional) Seed database with sample data
npm run db:seed
```

### 2. Start Development Server

```bash
# Start development server with hot reload
npm run dev

# Server runs on http://localhost:3010
# App available at http://localhost:3000
```

## Schema Development Workflow

### Working with Modular Schemas

The database schema is separated into 11 domain-specific modules in `prisma/schema/`. Here's the workflow for making schema changes:

#### Step 1: Identify the Correct Module

| Domain | Schema File | Contents |
|--------|-------------|----------|
| Core | `base.prisma` | User model, enums, configuration |
| Authentication | `auth.prisma` | Password tokens, email logs |
| Jobs | `jobs.prisma` | Job postings, categories, matching |
| Applications | `applications.prisma` | Job applications, timeline |
| Resumes | `resumes.prisma` | Resumes, experience, education |
| Company | `company.prisma` | Company profiles, employers |
| Billing | `billing.prisma` | Subscriptions, invoices |
| Notifications | `notifications.prisma` | Notification system |
| Analytics | `analytics.prisma` | Analytics, tracking |
| Templates | `templates.prisma` | Resume templates |
| Matching | `matching.prisma` | AI matching system |

#### Step 2: Make Schema Changes

Edit the appropriate schema file:

```prisma
// Example: Adding a new field to jobs.prisma
model Job {
  jobId         String   @id @default(cuid())
  title         String
  // ... existing fields

  // New field
  isRemote      Boolean  @default(false) @map("is_remote")
  workType      String?  @default("hybrid") // remote, hybrid, onsite

  @@index([isRemote])
  @@index([workType])
}
```

#### Step 3: Build and Test

```bash
# Build complete schema from modules
npm run schema:build

# Test the schema build
node scripts/test-schema.js

# Validate with Prisma
npx prisma validate
```

#### Step 4: Create Migration

```bash
# Generate and apply migration
npx prisma migrate dev --name "add-work-type-field"

# Update Prisma client
npx prisma generate
```

#### Step 5: Update Types

Update TypeScript types to reflect schema changes:

```typescript
// src/types/jobs.ts
export interface JobCreateInput {
  title: string;
  description: string;
  isRemote?: boolean;
  workType?: 'remote' | 'hybrid' | 'onsite';
}
```

### Schema Commands Reference

```bash
# Build complete schema
npm run schema:build

# Development workflow
npm run schema:dev    # Build + database push

# Production workflow
npm run schema:prod   # Build + client generation

# Validate schema
npx prisma validate

# Generate client
npx prisma generate

# Create migration
npx prisma migrate dev --name "migration-name"

# Reset database
npx prisma migrate reset

# Push to database (development only)
npx prisma db push
```

## Type Safety Development

### Working with Enums

Follow the type-safe enum pattern throughout the application:

```typescript
// src/types/roles.ts
export enum UserRole {
  EMPLOYER = 'EMPLOYER',
  JOB_SEEKER = 'JOB_SEEKER',
  ADMIN = 'ADMIN'
}

export const RoleDisplayText = {
  [UserRole.EMPLOYER]: 'employer',
  [UserRole.JOB_SEEKER]: 'job seeker',
  [UserRole.ADMIN]: 'administrator'
} as const;

// Usage in components
function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span className="badge">
      {RoleDisplayText[role]}
    </span>
  );
}
```

### API Development

Create type-safe API routes:

```typescript
// src/app/api/jobs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { JobCreateInput } from '@/types/jobs';

const createJobSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(50),
  companyId: z.string(),
  // ... other fields
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createJobSchema.parse(body);

    // Process with type safety
    const job = await jobService.create(validated);

    return NextResponse.json(job);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { errors: error.errors },
        { status: 400 }
      );
    }
    throw error;
  }
}
```

### Component Development

Create type-safe React components:

```typescript
// src/components/job-card.tsx
import type { JobResponse } from '@/types/jobs';

interface JobCardProps {
  job: JobResponse;
  onApply?: (jobId: string) => void;
  onSave?: (jobId: string) => void;
  variant?: 'default' | 'compact';
}

export function JobCard({
  job,
  onApply,
  onSave,
  variant = 'default'
}: JobCardProps) {
  return (
    <div className="job-card">
      <h3>{job.title}</h3>
      <p>{job.company.name}</p>

      <div className="actions">
        <button onClick={() => onApply?.(job.jobId)}>
          Apply
        </button>
        <button onClick={() => onSave?.(job.jobId)}>
          Save
        </button>
      </div>
    </div>
  );
}
```

## Testing Workflow

### Unit Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Type-Only Tests

Create type-only tests to verify type safety:

```typescript
// src/types/__tests__/roles.test.ts
import type { UserRole } from '@/types/roles';

// These tests run at compile-time
type TestUserRoleAssignment = () => {
  const role: UserRole = 'EMPLOYER'; // ✅ Valid
  // const invalid: UserRole = 'INVALID'; // ❌ Compile-time error
};
```

### Integration Testing

Test database operations with the modular schema:

```typescript
// src/__tests__/jobs.test.ts
import { describe, it, expect, beforeEach } from '@jest/globals';
import { prisma } from '@/lib/db';

describe('Job Management', () => {
  beforeEach(async () => {
    await prisma.job.deleteMany();
    await prisma.company.deleteMany();
  });

  it('should create a job with valid data', async () => {
    const company = await prisma.company.create({
      data: {
        name: 'Test Company',
        description: 'Test Description'
      }
    });

    const job = await prisma.job.create({
      data: {
        title: 'Software Engineer',
        description: 'Job description',
        companyId: company.companyId,
        employerId: 'test-employer-id',
        status: 'PUBLISHED'
      }
    });

    expect(job.title).toBe('Software Engineer');
    expect(job.status).toBe('PUBLISHED');
  });
});
```

## Code Quality Workflow

### TypeScript Configuration

The project uses strict TypeScript configuration:

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### ESLint Configuration

Run linting before commits:

```bash
# Run linter
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

### Pre-commit Hooks

Recommended Husky configuration:

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run lint && npm run type-check && npm run test",
      "pre-push": "npm run schema:build && npm run test:coverage"
    }
  }
}
```

## Git Workflow

### Branching Strategy

```
main                    # Production-ready code
├── develop            # Integration branch
├── feature/*          # Feature branches
├── bugfix/*           # Bug fix branches
├── hotfix/*           # Critical fixes
└── release/*          # Release preparation
```

### Commit Convention

Use conventional commits for better tracking:

```bash
# Format: <type>(<scope>): <description>

# Examples
feat(jobs): add remote work filtering
fix(auth): resolve password reset issue
docs(schema): update module documentation
refactor(database): implement schema separation
test(jobs): add integration tests for job creation
```

### Pull Request Process

1. **Create Feature Branch**: `git checkout -b feature/job-search-filtering`
2. **Make Changes**: Follow development workflow
3. **Test Changes**: Run tests and linting
4. **Build Schema**: `npm run schema:build`
5. **Submit PR**: With clear description and testing notes

## Performance Development

### Database Query Optimization

```typescript
// Good: Efficient queries with proper includes
async function getJobsWithCompany(limit: number = 10) {
  return prisma.job.findMany({
    take: limit,
    where: { status: 'PUBLISHED' },
    include: {
      company: { select: { name: true, logoUrl: true } },
      category: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
}

// Bad: N+1 queries
async function getJobsWithCompanyBad(limit: number = 10) {
  const jobs = await prisma.job.findMany({ take: limit });

  // This creates N+1 queries!
  for (const job of jobs) {
    job.company = await prisma.company.findUnique({
      where: { companyId: job.companyId }
    });
  }

  return jobs;
}
```

### React Performance

```typescript
// Good: Memoized components
const JobCard = React.memo(function JobCard({ job }: JobCardProps) {
  return <div>{job.title}</div>;
});

// Good: Optimized hooks
export function useJobs(filters: JobFilters) {
  return useMemo(() => {
    return fetchJobs(filters);
  }, [filters.category, filters.location]); // Specific dependencies
}
```

## Debugging Workflow

### Database Debugging

```typescript
// Enable query logging in development
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Use Prisma Studio for visual inspection
npx prisma studio
```

### Server-Side Debugging

```typescript
// Add debug logging
import { createLogger } from '@/lib/logger';

const logger = createLogger('jobs-service');

export async function createJob(data: JobCreateInput) {
  logger.info('Creating job', { data });

  try {
    const job = await prisma.job.create({ data });
    logger.info('Job created successfully', { jobId: job.jobId });
    return job;
  } catch (error) {
    logger.error('Failed to create job', { error, data });
    throw error;
  }
}
```

### Client-Side Debugging

Use React DevTools and Redux DevTools (if applicable).

## Deployment Workflow

### Build Process

```bash
# Build schema for production
npm run schema:prod

# Build application
npm run build

# Test production build
npm start
```

### Environment Variables

Ensure all required environment variables are set:

```bash
# Production environment
NODE_ENV=production
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://your-domain.com
OPENAI_API_KEY=...
```

### Database Migration in Production

```bash
# Deploy database migrations
npx prisma migrate deploy

# Generate production client
npx prisma generate
```

## Troubleshooting

### Common Issues

#### Schema Build Fails
```bash
# Check all schema files exist
node scripts/test-schema.js

# Validate schema syntax
npx prisma validate

# Check for circular dependencies
# Review model relationships across schema files
```

#### Migration Conflicts
```bash
# Reset migration history
npx prisma migrate reset

# Or resolve conflicts manually
npx prisma migrate dev --name "fix-conflict"
```

#### Type Errors
```bash
# Regenerate types
npx prisma generate

# Check TypeScript configuration
npx tsc --noEmit

# Clear build cache
rm -rf .next
npm run build
```

### Getting Help

1. **Check Documentation**: Review relevant architecture docs
2. **Search Issues**: Look for similar problems in existing issues
3. **Debug Logs**: Enable debug logging for detailed information
4. **Team Communication**: Reach out to team members for domain-specific issues

## Best Practices Summary

### Development Practices
- **Always build schema** before database operations
- **Use type-safe patterns** for enums and data structures
- **Write tests** for new features and bug fixes
- **Follow commit conventions** for better tracking
- **Test database migrations** in development first

### Code Quality
- **Maintain strict TypeScript** configuration
- **Use ESLint and Prettier** for consistent code
- **Write descriptive commit messages**
- **Document complex logic** with comments
- **Review code changes** before merging

### Performance
- **Optimize database queries** with proper includes and selects
- **Use React.memo** for expensive components
- **Implement proper caching** strategies
- **Monitor performance** regularly
- **Test at scale** before deployment

This workflow ensures consistent, high-quality development while leveraging the benefits of the modular schema architecture and type-safe development patterns.