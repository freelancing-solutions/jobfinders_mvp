# Type Safety Guide

## Overview

This guide outlines the type safety patterns and best practices used throughout the JobFinders platform. We prioritize type safety to catch errors at compile-time, improve developer experience, and ensure code reliability.

## Core Principles

### 1. Strong Typing Everywhere
- **Database to UI**: End-to-end type safety
- **No `any` Types**: Avoid `any` unless absolutely necessary
- **Generated Types**: Use Prisma-generated types consistently

### 2. Enum over String Literals
Use type-safe enums instead of magic strings or conditional expressions.

### 3. Type Inference
Leverage TypeScript's type inference while maintaining explicit typing where beneficial.

## Type-Safe Enum Patterns

### ✅ Recommended Pattern

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

export const RolePermissions = {
  [UserRole.EMPLOYER]: ['post_jobs', 'view_applications', 'manage_company'],
  [UserRole.JOB_SEEKER]: ['apply_jobs', 'manage_resume', 'view_jobs'],
  [UserRole.ADMIN]: ['manage_users', 'system_config', 'view_analytics']
} as const;

// Usage examples
const roleText = RoleDisplayText[user.role]; // Fully type-safe!
const permissions = RolePermissions[user.role]; // Type-safe array
```

### ❌ Avoid This Pattern

```typescript
// Bad practice - magic strings and conditional logic
const roleText = role === 'EMPLOYER' ? 'employer' : 'job seeker';

// Bad practice - untyped strings
function getUserRole(role: string) {
  // What values can role have? Unclear!
}
```

## Database Type Safety

### Prisma Generated Types

Always use Prisma-generated types for database operations:

```typescript
import type { User, Job, JobApplication } from '@prisma/client';

// ✅ Type-safe database operations
async function getUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

// ✅ Type-safe input validation
async function createJob(data: Omit<Job, 'jobId' | 'createdAt' | 'updatedAt'>): Promise<Job> {
  return prisma.job.create({ data });
}

// ✅ Type-safe relationships
async function getJobWithApplications(jobId: string): Promise<(Job & { applications: JobApplication[] }) | null> {
  return prisma.job.findUnique({
    where: { jobId },
    include: { applications: true }
  });
}
```

### Custom Type Extensions

Create types that extend Prisma types for specific use cases:

```typescript
// src/types/database.ts
import type { User as PrismaUser } from '@prisma/client';

export interface User extends PrismaUser {
  // Add computed properties
  displayName: string;
  profileCompletion: number;
}

export interface CreateUserInput extends Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'displayName' | 'profileCompletion'> {
  // Only include fields needed for creation
}

// Type-safe repository pattern
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: CreateUserInput): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User>;
}
```

## API Type Safety

### Request/Response Types

Define explicit types for API endpoints:

```typescript
// src/types/api.ts
export interface CreateJobRequest {
  title: string;
  description: string;
  requirements: string[];
  location?: string;
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
}

export interface JobResponse {
  jobId: string;
  title: string;
  description: string;
  company: {
    name: string;
    logo?: string;
  };
  createdAt: string;
  applicationCount: number;
}

// Type-safe API routes
export async function POST(request: Request): Promise<NextResponse<JobResponse>> {
  const body: CreateJobRequest = await request.json();

  // Validate with Zod
  const validated = createJobSchema.parse(body);

  // Process with type safety
  const job = await jobService.create(validated);

  return NextResponse.json(job);
}
```

### Zod Schema Validation

Use Zod for runtime type validation:

```typescript
// src/schemas/jobs.ts
import { z } from 'zod';

export const createJobSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(50),
  requirements: z.array(z.string()).min(1),
  location: z.string().optional(),
  salary: z.object({
    min: z.number().positive(),
    max: z.number().positive(),
    currency: z.string().length(3)
  }).optional()
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
```

## React Component Type Safety

### Props Typing

Define explicit prop types for components:

```typescript
// src/components/job-card.tsx
interface JobCardProps {
  job: JobResponse;
  onApply?: (jobId: string) => void;
  onSave?: (jobId: string) => void;
  showActions?: boolean;
  variant?: 'default' | 'compact' | 'featured';
}

export function JobCard({
  job,
  onApply,
  onSave,
  showActions = true,
  variant = 'default'
}: JobCardProps) {
  // Component implementation
}
```

### Hook Typing

Create typed custom hooks:

```typescript
// src/hooks/use-jobs.ts
interface UseJobsOptions {
  category?: string;
  location?: string;
  salaryRange?: [number, number];
  page?: number;
  limit?: number;
}

interface UseJobsReturn {
  jobs: JobResponse[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refetch: () => void;
}

export function useJobs(options: UseJobsOptions = {}): UseJobsReturn {
  // Hook implementation
}
```

## State Management Type Safety

### Zustand Store Typing

```typescript
// src/stores/user-store.ts
import { create } from 'zustand';
import type { User } from '@/types/database';

interface UserStore {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
  logout: () => void;
}

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  isLoading: false,

  setUser: (user) => set({ user }),

  updateUser: (updates) => set((state) => ({
    user: state.user ? { ...state.user, ...updates } : null
  })),

  logout: () => set({ user: null })
}));
```

## Enum Patterns for Different Domains

### Job Status Enums

```typescript
// src/types/jobs.ts
export enum JobStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  CLOSED = 'CLOSED',
  PAUSED = 'PAUSED',
  EXPIRED = 'EXPIRED',
  DELETED = 'DELETED'
}

export const JobStatusConfig = {
  [JobStatus.DRAFT]: {
    label: 'Draft',
    color: 'gray',
    description: 'Job is being edited and not yet published'
  },
  [JobStatus.PUBLISHED]: {
    label: 'Published',
    color: 'green',
    description: 'Job is live and accepting applications'
  },
  // ... other configurations
} as const;

export type JobStatusConfig = typeof JobStatusConfig[JobStatus];
```

### Application Status Enums

```typescript
// src/types/applications.ts
export enum ApplicationStatus {
  APPLIED = 'APPLIED',
  REVIEWING = 'REVIEWING',
  SHORTLISTED = 'SHORTLISTED',
  REJECTED = 'REJECTED',
  HIRED = 'HIRED'
}

export const ApplicationStatusFlow = {
  [ApplicationStatus.APPLIED]: [ApplicationStatus.REVIEWING, ApplicationStatus.REJECTED],
  [ApplicationStatus.REVIEWING]: [ApplicationStatus.SHORTLISTED, ApplicationStatus.REJECTED],
  [ApplicationStatus.SHORTLISTED]: [ApplicationStatus.HIRED, ApplicationStatus.REJECTED],
  [ApplicationStatus.REJECTED]: [], // Terminal state
  [ApplicationStatus.HIRED]: [] // Terminal state
} as const;

export function getNextStatuses(current: ApplicationStatus): ApplicationStatus[] {
  return ApplicationStatusFlow[current];
}
```

## Type Safety in Forms

### React Hook Form with Zod

```typescript
// src/components/create-job-form.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createJobSchema, type CreateJobInput } from '@/schemas/jobs';

export function CreateJobForm() {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<CreateJobInput>({
    resolver: zodResolver(createJobSchema)
  });

  const onSubmit = (data: CreateJobInput) => {
    // Type-safe form data
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('title')} />
      {errors.title && <span>{errors.title.message}</span>}

      <textarea {...register('description')} />
      {errors.description && <span>{errors.description.message}</span>}

      <button type="submit">Create Job</button>
    </form>
  );
}
```

## Error Handling Type Safety

### Custom Error Types

```typescript
// src/types/errors.ts
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public field: string) {
    super(ErrorCode.VALIDATION_ERROR, message, { field });
    this.name = 'ValidationError';
  }
}

// Type-safe error handling
function handleError(error: unknown): never {
  if (error instanceof AppError) {
    throw error;
  }

  if (error instanceof Error) {
    throw new AppError(ErrorCode.INTERNAL_ERROR, error.message);
  }

  throw new AppError(ErrorCode.INTERNAL_ERROR, 'Unknown error occurred');
}
```

## Best Practices Checklist

### ✅ Do's
- Use enum patterns instead of magic strings
- Leverage Prisma-generated types
- Create explicit interface definitions
- Use Zod for runtime validation
- Type all function parameters and return values
- Use `as const` for readonly objects
- Create utility types for common patterns

### ❌ Don'ts
- Use `any` type unless absolutely necessary
- Use magic strings or numbers
- Skip type definitions for API responses
- Ignore TypeScript errors with `@ts-ignore`
- Use loose typing in critical paths

## Testing Type Safety

### Type-Only Tests

```typescript
// src/types/__tests__/roles.test.ts
import type { UserRole } from '@/types/roles';

// These tests run at compile-time
type TestUserRoleAssignment = () => {
  const role: UserRole = 'EMPLOYER'; // ✅ Valid
  // const invalid: UserRole = 'INVALID'; // ❌ Compile-time error
};

type TestRoleDisplay = () => {
  const role: UserRole = UserRole.EMPLOYER;
  const display = RoleDisplayText[role]; // Type: 'employer'
  // const invalid = RoleDisplayText['INVALID']; // ❌ Compile-time error
};
```

## Type Safety Tools

### Recommended VS Code Extensions
- TypeScript Importer
- Auto Rename Tag
- TypeScript Hero
- Prisma

### ESLint Configuration
```json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/prefer-nullish-coalescing": "error",
    "@typescript-eslint/prefer-optional-chain": "error",
    "@typescript-eslint/no-unused-vars": "error"
  }
}
```

## Conclusion

Type safety is a fundamental aspect of the JobFinders platform's architecture. By following these patterns and practices, we ensure:

- **Fewer Runtime Errors**: Catch issues at compile-time
- **Better Developer Experience**: Improved IntelliSense and autocomplete
- **Code Reliability**: Type contracts that prevent bugs
- **Maintainability**: Self-documenting code through types

Remember: if it can be typed, it should be typed!