# Coding Standards & Best Practices - JobFinders Platform

## Overview
This document establishes strict coding standards to prevent bugs, improve maintainability, and ensure type safety across the JobFinders platform. All code MUST adhere to these standards.

**Last Updated**: 2025-01-07
**Enforcement Level**: MANDATORY
**Review Requirement**: All PRs must pass standards checklist

---

## 1. Type Safety & Enums

### ❌ NEVER Use String Literals for Types
```typescript
// ❌ BAD - Magic strings prone to typos
if (user.role === "admin") { }
if (status === "pending") { }
job.type = "full-time"

// ❌ BAD - String unions without const assertion
type UserRole = "admin" | "employer" | "seeker"
```

### ✅ ALWAYS Use Enums or Const Objects
```typescript
// ✅ GOOD - Type-safe enums
export enum UserRole {
  ADMIN = "ADMIN",
  EMPLOYER = "EMPLOYER",
  SEEKER = "SEEKER"
}

export enum ApplicationStatus {
  PENDING = "PENDING",
  REVIEWED = "REVIEWED",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED"
}

export enum JobType {
  FULL_TIME = "FULL_TIME",
  PART_TIME = "PART_TIME",
  CONTRACT = "CONTRACT",
  INTERNSHIP = "INTERNSHIP"
}

// Usage
if (user.role === UserRole.ADMIN) { }
application.status = ApplicationStatus.PENDING
```

### ✅ Const Objects for Config
```typescript
// ✅ GOOD - Const object with as const assertion
export const EVENT_TYPES = {
  USER_CREATED: "USER_CREATED",
  JOB_POSTED: "JOB_POSTED",
  APPLICATION_SUBMITTED: "APPLICATION_SUBMITTED"
} as const

export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES]

// Usage
eventBus.emit(EVENT_TYPES.USER_CREATED, data)
```

---

## 2. Required Type Definitions

### ✅ All Functions Must Have Explicit Return Types
```typescript
// ❌ BAD - No return type
function getUserById(id: string) {
  return db.user.findUnique({ where: { id } })
}

// ✅ GOOD - Explicit return type
async function getUserById(id: string): Promise<User | null> {
  return db.user.findUnique({ where: { id } })
}
```

### ✅ All API Routes Must Have Response Types
```typescript
// ❌ BAD - No type safety
export async function GET(req: Request) {
  return Response.json({ data: jobs })
}

// ✅ GOOD - Typed responses
type GetJobsResponse = {
  data: Job[]
  pagination: PaginationInfo
  meta: ResponseMeta
}

export async function GET(
  req: Request
): Promise<Response<GetJobsResponse>> {
  return Response.json({ data: jobs, pagination, meta })
}
```

### ✅ All Event Handlers Must Have Typed Payloads
```typescript
// ❌ BAD - Untyped event data
eventBus.on('user.created', (data) => {
  sendEmail(data.email) // No type safety!
})

// ✅ GOOD - Fully typed events
interface UserCreatedEvent {
  userId: string
  email: string
  role: UserRole
  timestamp: Date
}

eventBus.on<UserCreatedEvent>('user.created', (data) => {
  sendEmail(data.email) // Type-safe!
})
```

---

## 3. Error Handling Standards

### ✅ Use Custom Error Classes
```typescript
// ❌ BAD - Generic errors
throw new Error("User not found")
throw new Error("Invalid input")

// ✅ GOOD - Typed error classes
export class NotFoundError extends Error {
  constructor(
    public resource: string,
    public id: string
  ) {
    super(`${resource} not found: ${id}`)
    this.name = "NotFoundError"
  }
}

export class ValidationError extends Error {
  constructor(
    public field: string,
    public reason: string
  ) {
    super(`Validation failed for ${field}: ${reason}`)
    this.name = "ValidationError"
  }
}

// Usage
throw new NotFoundError("User", userId)
throw new ValidationError("email", "Invalid format")
```

### ✅ Comprehensive Error Handling
```typescript
// ❌ BAD - Swallowing errors
try {
  await saveUser(user)
} catch (e) {
  console.log("Error") // Lost context!
}

// ✅ GOOD - Proper error handling
import { logger } from "@/lib/logger"
import { captureException } from "@/lib/monitoring"

try {
  await saveUser(user)
} catch (error) {
  if (error instanceof ValidationError) {
    logger.warn("Validation failed", { error, user })
    return { success: false, error: error.message }
  }
  
  logger.error("Failed to save user", { error, user })
  captureException(error)
  throw error
}
```

---

## 4. Validation Standards

### ✅ Use Zod for All Input Validation
```typescript
// ❌ BAD - Manual validation
function createJob(data: any) {
  if (!data.title || data.title.length < 3) {
    throw new Error("Invalid title")
  }
  if (!data.salary || data.salary < 0) {
    throw new Error("Invalid salary")
  }
}

// ✅ GOOD - Zod schemas
import { z } from "zod"

export const CreateJobSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(50),
  salary: z.number().min(0).optional(),
  type: z.nativeEnum(JobType),
  location: z.string(),
  companyId: z.string().uuid(),
  requirements: z.array(z.string()).min(1),
  benefits: z.array(z.string()).optional()
})

export type CreateJobInput = z.infer<typeof CreateJobSchema>

function createJob(input: CreateJobInput): Promise<Job> {
  const validated = CreateJobSchema.parse(input)
  return db.job.create({ data: validated })
}
```

### ✅ Validation Middleware
```typescript
// ✅ Reusable validation middleware
export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return async (req: Request): Promise<T> => {
    const body = await req.json()
    
    try {
      return schema.parse(body)
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(
          "request",
          error.errors.map(e => e.message).join(", ")
        )
      }
      throw error
    }
  }
}

// Usage in API routes
export async function POST(req: Request) {
  const data = await validateRequest(CreateJobSchema)(req)
  // data is now fully typed and validated
}
```

---

## 5. Database Query Standards

### ✅ Always Use Typed Prisma Queries
```typescript
// ❌ BAD - Raw queries or untyped
const users = await db.$queryRaw`SELECT * FROM users`

// ✅ GOOD - Typed Prisma queries
const users = await db.user.findMany({
  where: { role: UserRole.EMPLOYER },
  include: { company: true },
  orderBy: { createdAt: "desc" }
})

// ✅ GOOD - Type-safe select
const userEmails = await db.user.findMany({
  select: { email: true, name: true }
})
// Type is: { email: string, name: string }[]
```

### ✅ Transaction Management
```typescript
// ❌ BAD - No transaction
await db.job.create({ data: jobData })
await db.application.create({ data: appData })
// Risk of partial failure!

// ✅ GOOD - Atomic transactions
await db.$transaction(async (tx) => {
  const job = await tx.job.create({ data: jobData })
  const application = await tx.application.create({
    data: { ...appData, jobId: job.id }
  })
  
  await tx.notification.create({
    data: { userId: job.employerId, type: "NEW_APPLICATION" }
  })
  
  return { job, application }
})
```

---

## 6. Async/Await Standards

### ✅ Always Handle Promises Correctly
```typescript
// ❌ BAD - Unhandled promise
function loadData() {
  fetchUser(id) // Promise not awaited!
  return "loading"
}

// ✅ GOOD - Proper async/await
async function loadData(): Promise<string> {
  await fetchUser(id)
  return "loaded"
}

// ✅ GOOD - Parallel execution when possible
async function loadDashboard(): Promise<Dashboard> {
  const [jobs, applications, analytics] = await Promise.all([
    fetchJobs(),
    fetchApplications(),
    fetchAnalytics()
  ])
  
  return { jobs, applications, analytics }
}
```

### ✅ Error Handling in Async Code
```typescript
// ❌ BAD - Silent failures
async function saveData() {
  await db.save(data).catch(() => {}) // Swallowed!
}

// ✅ GOOD - Proper error handling
async function saveData(): Promise<SaveResult> {
  try {
    await db.save(data)
    return { success: true }
  } catch (error) {
    logger.error("Save failed", { error, data })
    return { success: false, error: toErrorMessage(error) }
  }
}
```

---

## 7. Component Standards (React)

### ✅ Explicit Props Types
```typescript
// ❌ BAD - Implicit any
function JobCard({ job, onClick }) { }

// ✅ GOOD - Explicit types
interface JobCardProps {
  job: Job
  onClick: (jobId: string) => void
  className?: string
  featured?: boolean
}

function JobCard({ 
  job, 
  onClick, 
  className, 
  featured = false 
}: JobCardProps): JSX.Element {
  return <div>...</div>
}
```

### ✅ Custom Hook Types
```typescript
// ❌ BAD - No return type
function useJobs(filters) {
  const [jobs, setJobs] = useState([])
  return { jobs, loading }
}

// ✅ GOOD - Explicit types
interface UseJobsResult {
  jobs: Job[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

interface UseJobsFilters {
  type?: JobType
  location?: string
  minSalary?: number
}

function useJobs(filters: UseJobsFilters): UseJobsResult {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  // Implementation...
  
  return { jobs, loading, error, refetch }
}
```

---

## 8. Event System Standards

### ✅ Typed Event Definitions
```typescript
// ❌ BAD - String-based events
eventBus.emit("user-created", userData)

// ✅ GOOD - Typed event system
export enum EventType {
  USER_CREATED = "USER_CREATED",
  JOB_POSTED = "JOB_POSTED",
  APPLICATION_SUBMITTED = "APPLICATION_SUBMITTED"
}

export interface EventPayloads {
  [EventType.USER_CREATED]: {
    userId: string
    email: string
    role: UserRole
  }
  [EventType.JOB_POSTED]: {
    jobId: string
    employerId: string
    title: string
  }
  [EventType.APPLICATION_SUBMITTED]: {
    applicationId: string
    jobId: string
    seekerId: string
  }
}

// Type-safe emit
eventBus.emit<EventType.USER_CREATED>(
  EventType.USER_CREATED,
  { userId, email, role }
)

// Type-safe listener
eventBus.on<EventType.USER_CREATED>(
  EventType.USER_CREATED,
  (payload) => {
    // payload is fully typed!
  }
)
```

---

## 9. API Response Standards

### ✅ Consistent Response Format
```typescript
// Define standard response types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: ApiError
  meta?: ResponseMeta
}

export interface ApiError {
  code: ErrorCode
  message: string
  details?: Record<string, unknown>
}

export interface ResponseMeta {
  timestamp: string
  requestId: string
  version: string
}

export enum ErrorCode {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  NOT_FOUND = "NOT_FOUND",
  UNAUTHORIZED = "UNAUTHORIZED",
  INTERNAL_ERROR = "INTERNAL_ERROR"
}

// ✅ Usage
export async function GET(req: Request): Promise<Response> {
  try {
    const jobs = await fetchJobs()
    
    return Response.json<ApiResponse<Job[]>>({
      success: true,
      data: jobs,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: generateId(),
        version: "1.0"
      }
    })
  } catch (error) {
    return Response.json<ApiResponse>({
      success: false,
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: "Failed to fetch jobs",
        details: { error: String(error) }
      }
    }, { status: 500 })
  }
}
```

---

## 10. Testing Standards

### ✅ Type-Safe Test Data
```typescript
// ❌ BAD - Untyped test data
const testUser = { name: "Test", email: "test@test.com" }

// ✅ GOOD - Factory functions
export function createTestUser(
  overrides?: Partial<User>
): User {
  return {
    id: generateId(),
    email: "test@example.com",
    name: "Test User",
    role: UserRole.SEEKER,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }
}

// ✅ Usage
const admin = createTestUser({ role: UserRole.ADMIN })
const employer = createTestUser({ role: UserRole.EMPLOYER })
```

---

## 11. Configuration Standards

### ✅ Environment Variable Types
```typescript
// ❌ BAD - Untyped env vars
const apiKey = process.env.API_KEY

// ✅ GOOD - Typed and validated config
import { z } from "zod"

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
  OPENROUTER_API_KEY: z.string(),
  PAYPAL_CLIENT_ID: z.string(),
  PAYPAL_CLIENT_SECRET: z.string(),
  NODE_ENV: z.enum(["development", "production", "test"])
})

export type Env = z.infer<typeof envSchema>

export const env: Env = envSchema.parse(process.env)

// Usage - fully typed!
const apiKey = env.OPENROUTER_API_KEY
```

---

## 12. Import Organization

### ✅ Consistent Import Order
```typescript
// 1. External dependencies
import { useState, useEffect } from "react"
import { z } from "zod"

// 2. Internal utilities
import { logger } from "@/lib/logger"
import { db } from "@/lib/db"

// 3. Types and enums
import type { User, Job } from "@/types"
import { UserRole, JobType } from "@/types/enums"

// 4. Components
import { Button } from "@/components/ui/button"
import { JobCard } from "@/components/jobs/job-card"

// 5. Styles
import styles from "./styles.module.css"
```

---

## 13. Documentation Standards

### ✅ JSDoc for Public APIs
```typescript
/**
 * Creates a new job posting with validation and event emission
 * 
 * @param input - Job creation data validated against CreateJobSchema
 * @param employerId - UUID of the employer creating the job
 * @returns Newly created job with all relations
 * @throws {ValidationError} If input validation fails
 * @throws {NotFoundError} If employer doesn't exist
 * 
 * @example
 * ```typescript
 * const job = await createJob({
 *   title: "Senior Engineer",
 *   type: JobType.FULL_TIME,
 *   salary: 120000
 * }, employerId)
 * ```
 */
export async function createJob(
  input: CreateJobInput,
  employerId: string
): Promise<Job> {
  // Implementation
}
```

---

## Enforcement Checklist

### Pre-Commit Requirements
- [ ] All TypeScript errors resolved
- [ ] All Zod schemas defined for inputs
- [ ] No magic strings for types/status
- [ ] All functions have return types
- [ ] All errors properly typed
- [ ] All API responses follow standard format
- [ ] All database queries use Prisma types
- [ ] All components have explicit prop types
- [ ] All events properly typed

### PR Review Requirements
- [ ] No `any` types without justification
- [ ] No `as` type assertions without comment
- [ ] All new enums added to central location
- [ ] Error handling comprehensive
- [ ] Tests include type checking
- [ ] Documentation updated

---

## Tools Configuration

### tsconfig.json
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### ESLint Rules
```json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/await-thenable": "error"
  }
}
```

---

## Migration Guide

### Converting Existing Code

#### 1. Replace String Literals
```typescript
// Before
if (user.role === "admin") { }

// After
if (user.role === UserRole.ADMIN) { }
```

#### 2. Add Return Types
```typescript
// Before
async function getUser(id) {
  return db.user.findUnique({ where: { id } })
}

// After
async function getUser(id: string): Promise<User | null> {
  return db.user.findUnique({ where: { id } })
}
```

#### 3. Validate Inputs
```typescript
// Before
function createJob(data) {
  if (!data.title) throw new Error("Title required")
}

// After
const schema = z.object({ title: z.string().min(1) })
function createJob(data: z.infer<typeof schema>) {
  const validated = schema.parse(data)
}
```

---

## Integration with Architecture Documents

### References in System Architecture
- All enum definitions MUST be documented in `system-overview.md`
- Event types MUST align with `integration-map.md` event bus section
- API response formats MUST follow patterns in `integration-map.md`

### Navigation Standards
- Route enums defined in `navigation-structure.md`
- All route references use enum values, not strings
- Navigation state uses typed status enums

### Database Standards
- Prisma schema enums match TypeScript enums exactly
- All status fields use enum types
- No string-based role/status checks in code

---

**Version**: 1.0.0
**Last Updated**: 2025-01-07
**Status**: MANDATORY for all new code
**Enforcement**: Automated + PR reviews + Architecture docs alignment