# Database Schema Architecture

## Overview

The JobFinders platform uses a modular database schema architecture that separates concerns into domain-specific modules. This approach provides better maintainability, team collaboration, and code organization compared to a traditional monolithic schema file.

## Architecture Evolution

### Before: Monolithic Schema
- Single 1350+ line `schema.prisma` file
- Difficult to navigate and maintain
- Frequent merge conflicts in team environments
- Poor separation of concerns

### After: Modular Schema Architecture
- 11 domain-specific schema modules
- Clear separation of concerns
- Improved maintainability and collaboration
- Automated build process for complete schema

## Schema Modules

### 1. Base Schema (`prisma/schema/base.prisma`)

**Purpose**: Core configuration, enums, and foundational User model

**Key Components**:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum JobStatus {
  DRAFT
  PUBLISHED
  CLOSED
  PAUSED
  EXPIRED
  DELETED
}

enum ApplicationStatus {
  APPLIED
  REVIEWING
  SHORTLISTED
  REJECTED
  HIRED
}

enum MatchStatus {
  PENDING
  ACCEPTED
  REJECTED
}

model User {
  uid              String   @id @default(cuid())
  email           String   @unique
  role            String   @default("seeker")
  // ... other user fields

  // Relationships to all domain modules
  jobSeekerProfile JobSeekerProfile?
  employerProfile  EmployerProfile?
  // ... other relationships
}
```

### 2. Authentication Schema (`prisma/schema/auth.prisma`)

**Purpose**: Authentication, security, and email verification models

**Key Components**:
```prisma
model PasswordResetToken {
  id          String   @id @default(cuid())
  token       String   @unique
  userId      String   @map("user_uid")
  user        User     @relation(fields: [userId], references: [uid])
  expiresAt   DateTime @map("expires_at")
  // ... other fields
}

model EmailLog {
  id          String   @id @default(cuid())
  to          String
  subject     String
  type        String   // 'password_reset', 'welcome', etc.
  status      String   // 'sent', 'failed', 'pending'
  // ... other fields
}
```

### 3. Jobs Schema (`prisma/schema/jobs.prisma`)

**Purpose**: Job posting, categories, and basic matching

**Key Components**:
```prisma
model Job {
  jobId         String   @id @default(cuid())
  title         String
  companyId     String   @map("company_id")
  employerId    String   @map("employer_id")
  categoryId    String?  @map("category_id")
  description   String
  requirements  Json
  status        JobStatus
  // ... other job fields

  // Relationships
  company       Company        @relation(fields: [companyId], references: [companyId])
  employer      EmployerProfile @relation(fields: [employerId], references: [employerId])
  applications  JobApplication[]
}

model JobCategory {
  categoryId      String   @id @default(cuid())
  name            String   @unique
  description     String?
  slug            String   @unique
  // ... other category fields
}
```

### 4. Applications Schema (`prisma/schema/applications.prisma`)

**Purpose**: Job application tracking and management

**Key Components**:
```prisma
model JobApplication {
  applicationId   String   @id @default(cuid())
  jobId           String   @map("job_id")
  jobSeekerProfileId String @map("jobseeker_profile_id")
  resumeId        String?  @map("resume_id")
  status          ApplicationStatus @default(APPLIED)
  appliedAt       DateTime @default(now())
  // ... other application fields

  // Timeline and activity tracking
  timeline        ApplicationTimeline[]
  attachments     ApplicationAttachment[]
  notes           ApplicationNote[]
  interviews      InterviewSchedule[]
}

model ApplicationTimeline {
  timelineId      String   @id @default(cuid())
  applicationId   String   @map("application_id")
  status          ApplicationStatus
  notes           String?
  createdBy       String?  @map("created_by")
  // ... other timeline fields
}
```

### 5. Resumes Schema (`prisma/schema/resumes.prisma`)

**Purpose**: Resume/CV management and related entities

**Key Components**:
```prisma
model Resume {
  resumeId        String   @id @default(cuid())
  userUid         String   @map("user_uid")
  isPrimary       Boolean  @default(false)
  professionalTitle String
  summary         String?
  skills          Json?
  // ... other resume fields

  // Template integration
  templateId              String?  @map("template_id")
  templateCustomizationId String?  @map("template_customization_id")

  // Related experience and education
  experience      Experience[]
  education       Education[]
  certifications  Certification[]
  languages       Language[]
  projects        Project[]
}

model Experience {
  experienceId    String   @id @default(cuid())
  resumeId        String   @map("resume_id")
  company         String
  position        String
  startDate       DateTime @map("start_date")
  endDate         DateTime? @map("end_date")
  isCurrent       Boolean  @default(false)
  // ... other experience fields
}
```

### 6. Company Schema (`prisma/schema/company.prisma`)

**Purpose**: Company and employer profile management

**Key Components**:
```prisma
model Company {
  companyId       String   @id @default(cuid())
  name            String   @unique
  description     String?
  industry        String?
  website         String?
  logoUrl         String?  @map("logo_url")
  // ... other company fields

  // Relationships
  employers       EmployerProfile[]
  jobs            Job[]
  billingProfiles  CompanyBillingProfile[]
}

model EmployerProfile {
  employerId      String   @id @default(cuid())
  userUid         String   @unique @map("user_uid")
  companyId       String   @map("company_id")
  isVerified      Boolean  @default(false)
  fullName        String?  @map("full_name")
  jobTitle        String?  @map("job_title")
  // ... other employer fields
}
```

### 7. Billing Schema (`prisma/schema/billing.prisma`)

**Purpose**: Subscription management and billing

**Key Components**:
```prisma
model BillingPlan {
  planId          String   @id @default(cuid())
  name            String
  description     String?
  price           Float
  currency        String   @default("ZAR")
  durationDays    Int      @default(30)
  // Features
  maxOpenJobs     Int?     @map("max_open_jobs")
  maxUsers        Int?     @map("max_users")
  // ... other plan fields
}

model CompanyBillingProfile {
  profileId       String   @id @default(cuid())
  companyId       String   @map("company_id")
  planId          String   @map("plan_id")
  isActive        Boolean  @default(true)
  subscriptionStart DateTime @map("subscription_start")
  subscriptionEnd DateTime @map("subscription_end")
  // ... other billing profile fields
}
```

### 8. Notifications Schema (`prisma/schema/notifications.prisma`)

**Purpose**: Comprehensive notification system

**Key Components**:
```prisma
model Notification {
  id              String   @id @default(cuid())
  userId          String   @map("user_id")
  type            String   // application_status, new_job, etc.
  channel         String   @default("in_app")
  title           String
  message         String
  priority        String   @default("normal")
  status          String   @default("pending")
  // Delivery tracking
  deliveryLogs    NotificationDeliveryLog[]
}

model NotificationPreference {
  id                    String   @id @default(cuid())
  userId                String   @unique @map("user_id")
  emailEnabled          Boolean  @default(true)
  smsEnabled            Boolean  @default(false)
  pushEnabled           Boolean  @default(true)
  // ... other preference fields
}
```

### 9. Analytics Schema (`prisma/schema/analytics.prisma`)

**Purpose**: Analytics, tracking, and AI session management

**Key Components**:
```prisma
model AgentSession {
  sessionId       String   @id @default(cuid())
  agentName       String   @map("agent_name")
  contextData    Json?    @map("context_data")
  userId          String?  @map("user_id")
  // ... other session fields
}

model AnalyticsEvent {
  id              String   @id @default(cuid())
  eventType       String   @map("event_type")
  notificationId  String   @map("notification_id")
  userId          String   @map("user_id")
  channel         String   // email, sms, push, in_app
  timestamp       DateTime @default(now())
  // ... other analytics fields
}
```

### 10. Templates Schema (`prisma/schema/templates.prisma`)

**Purpose**: Resume template system and customization

**Key Components**:
```prisma
model ResumeTemplate {
  templateId      String   @id @default(cuid())
  name            String
  description     String
  category        String   // professional, modern, academic
  previewUrl      String   @map("preview_url")
  // Template configuration
  layout          Json     // TemplateLayout config
  styling         Json     // TemplateStyling config
  sections        Json     // TemplateSection[] config
  // Usage analytics
  downloadCount   Int      @default(0)
  rating          Float    @default(0)
}

model ResumeTemplateCustomization {
  id              String   @id @default(cuid())
  userUid         String   @map("user_uid")
  templateId      String   @map("template_id")
  colorScheme     Json     // Color customization
  typography      Json     // Font customization
  layout          Json     // Layout customization
  // ... other customization fields
}
```

### 11. Matching Schema (`prisma/schema/matching.prisma`)

**Purpose**: AI-powered candidate matching system

**Key Components**:
```prisma
model CandidateProfile {
  id                    String   @id @default(cuid())
  userId                String   @unique @map("user_id")
  personalInfo          Json     @map("personal_info")
  professionalSummary   String?  @map("professional_summary")
  skills                Json     @default("[]")
  experience            Json     @default("[]")
  // AI matching data
  completionScore       Int      @default(0)
  searchRanking         Float    @default(0.0)
  profileEmbeddings     ProfileEmbedding[]
}

model MatchResult {
  id                    String   @id @default(cuid())
  candidateId           String   @map("candidate_id")
  jobId                 String   @map("job_id")
  score                 Float
  breakdown             Json     // ScoreBreakdown
  explanation           Json     // MatchExplanation
  confidence            Float
  // ... other matching fields
}

model ProfileEmbedding {
  id                    String   @id @default(cuid())
  profileId             String   @map("profile_id")
  profileType           String   @map("profile_type") // 'candidate' or 'job'
  embedding             Float[]  // Vector representation
  model                 String   // Model used for embedding
  dimensions            Int
  // ... other embedding fields
}
```

## Schema Dependencies

The modules are ordered by dependency to ensure proper compilation:

```
base.prisma (Core)
├── auth.prisma (depends on User)
├── jobs.prisma (depends on User, Company)
├── applications.prisma (depends on Jobs, Users)
├── resumes.prisma (depends on Users)
├── company.prisma (independent)
├── billing.prisma (depends on Company)
├── notifications.prisma (depends on Users)
├── analytics.prisma (depends on Users, Notifications)
├── templates.prisma (depends on Users)
└── matching.prisma (depends on Users, Jobs)
```

## Build Process

### Automated Schema Concatenation

The `scripts/build-schema.js` script automatically concatenates all schema modules in dependency order:

```javascript
const schemaFiles = [
  'base.prisma',
  'auth.prisma',
  'jobs.prisma',
  'applications.prisma',
  'resumes.prisma',
  'company.prisma',
  'billing.prisma',
  'notifications.prisma',
  'analytics.prisma',
  'templates.prisma',
  'matching.prisma'
];
```

### Development Workflow

```bash
# Build complete schema from modules
npm run schema:build

# Development workflow (build + database push)
npm run schema:dev

# Production workflow (build + client generation)
npm run schema:prod

# Test schema separation
node scripts/test-schema.js
```

## Type Safety Integration

### Prisma-Generated Types

The modular schema generates the same comprehensive types as the monolithic approach:

```typescript
import type { User, Job, JobApplication } from '@prisma/client';

// Type-safe database operations
async function getUserWithProfile(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: { jobSeekerProfile: true }
  });
}
```

### Domain-Specific Types

Create types that align with schema modules:

```typescript
// src/types/database/jobs.ts
import type { Job as PrismaJob, JobCategory } from '@prisma/client';

export interface Job extends PrismaJob {
  category?: JobCategory;
  applicationCount: number;
  averageSalary?: number;
}

export interface CreateJobInput extends Omit<Job, 'jobId' | 'createdAt' | 'updatedAt' | 'applicationCount'> {
  // Only fields needed for creation
}
```

## Schema Evolution

### Adding New Models

1. **Identify the Domain**: Determine which schema module the model belongs to
2. **Add to Schema**: Add the model to the appropriate schema file
3. **Update Build Script**: If creating a new module, update the build script
4. **Generate Types**: Run `npm run schema:build` then `npx prisma generate`
5. **Create Migration**: `npx prisma migrate dev`

### Modifying Existing Models

1. **Locate Schema**: Find the appropriate schema module
2. **Make Changes**: Modify the model in the separated schema
3. **Build and Test**: `npm run schema:build` and test locally
4. **Generate Migration**: `npx prisma migrate dev`

### Schema Validation

Use the test script to validate schema separation:

```javascript
// scripts/test-schema.js
const schemaFiles = [
  'base.prisma', 'auth.prisma', 'jobs.prisma', // ...
];

for (const file of schemaFiles) {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} - ${sizeKB} KB`);
  } else {
    console.log(`❌ ${file} - MISSING`);
  }
}
```

## Performance Considerations

### Database Indexing

Each schema module includes appropriate indexes:

```prisma
model Job {
  // ... fields

  @@index([companyId])
  @@index([employerId])
  @@index([status])
  @@index([createdAt])
}

model CandidateProfile {
  // ... fields

  @@index([userId])
  @@index([completionScore])
  @@index([searchRanking])
}
```

### Query Optimization

Schema separation enables optimized queries per domain:

```typescript
// Job domain - optimized job queries
async function findJobsByCategory(categoryId: string) {
  return prisma.job.findMany({
    where: { categoryId, status: 'PUBLISHED' },
    include: { company: true, category: true },
    orderBy: { createdAt: 'desc' }
  });
}

// Matching domain - optimized matching queries
async function findMatchingCandidates(jobId: string) {
  return prisma.matchResult.findMany({
    where: { jobId, score: { gte: 0.7 } },
    include: { candidateProfile: true },
    orderBy: { score: 'desc' }
  });
}
```

## Benefits of Modular Schema

### 1. **Improved Maintainability**
- Smaller, focused files (50-150 lines vs 1350+ lines)
- Easier to navigate and understand
- Reduced cognitive load

### 2. **Better Team Collaboration**
- Fewer merge conflicts
- Clear domain ownership
- Parallel development possible

### 3. **Enhanced Development Experience**
- Faster IDE loading
- Better code navigation
- Clear separation of concerns

### 4. **Scalability**
- Easy to add new domains
- Modular migration strategy
- Supports microservice evolution

### 5. **Code Organization**
- Related models grouped together
- Clear dependency relationships
- Better onboarding for new developers

## Best Practices

### Schema Development

1. **Keep Models Focused**: Each model should belong to a clear domain
2. **Maintain Dependencies**: Respect the dependency order
3. **Use Proper Indexing**: Add indexes for frequently queried fields
4. **Document Relationships**: Clear relationship definitions
5. **Test Regularly**: Use the build script to validate changes

### Team Workflow

1. **Work in Modules**: Make changes to specific schema files
2. **Build Before Commit**: Always run `npm run schema:build` before committing
3. **Test Database Operations**: Verify database operations work correctly
4. **Update Documentation**: Keep documentation in sync with schema changes

### Migration Strategy

1. **Incremental Changes**: Make small, incremental schema changes
2. **Test Migrations**: Always test migrations in development
3. **Backup Data**: Ensure data backup before major schema changes
4. **Rollback Plan**: Have rollback strategy for failed migrations

## Future Enhancements

### Potential Improvements

1. **Schema Validation**: Automated validation rules for schema files
2. **Visual Documentation**: Auto-generated ER diagrams from modules
3. **Modular Migrations**: Separate migration files per domain
4. **API Generation**: Auto-generated API endpoints from schema modules
5. **Performance Monitoring**: Query performance tracking per domain

### Tooling Enhancements

1. **IDE Extensions**: Custom schema navigation tools
2. **Build Integration**: Enhanced CI/CD integration
3. **Schema Diff Tools**: Advanced schema comparison utilities
4. **Documentation Generation**: Auto-generated documentation from schemas

## Conclusion

The modular database schema architecture represents a significant improvement in code organization and maintainability. By separating concerns into domain-specific modules, we've created a more scalable, collaborative, and maintainable database layer that supports the complex needs of the JobFinders platform while maintaining full compatibility with existing Prisma workflows.

This architecture provides a solid foundation for future growth and enables the development team to work more efficiently on different aspects of the platform without interfering with each other's work.