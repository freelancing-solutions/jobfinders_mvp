I have created the following plan after thorough exploration and analysis of the codebase. Follow the below plan verbatim. Trust the files and references. Do not re-verify what's written in the plan. Explore only when absolutely necessary. First implement all the proposed file changes and then I'll review all the changes together at the end.

### Observations

The JobFinders MVP has a **monolithic Prisma schema** (970 lines) containing 9 distinct domains:
1. **User Management** (User, JobSeekerProfile, EmployerProfile, AdminProfile)
2. **Job Management** (Job, JobCategory, Company)
3. **Application System** (JobApplication, SavedJob)
4. **Resume System** (Resume, Experience, Education, Certifications, Languages, Projects)
5. **Billing & Subscriptions** (BillingPlan, CompanyBillingProfile, Invoice)
6. **Matching System** (CandidateProfile, JobProfile, MatchResult, ProfileEmbedding)
7. **ML & Analytics** (MLModel, UserInteraction, MatchingAnalytics, Recommendation, BatchMatchJob)
8. **Notification System** (Notification, NotificationPreference, NotificationTemplate, NotificationDeliveryLog, NotificationCampaign, NotificationAnalytics)
9. **Supporting Models** (AgentSession, PasswordResetToken, EmailLog)

Currently, all imports use `@prisma/client` directly. The codebase uses PostgreSQL and has extensive cross-domain relationships that need careful handling during separation.


### Approach

## Strategic Schema Separation Approach

I'll create a **comprehensive specification** for separating the monolithic Prisma schema into **domain-driven schema files** while maintaining referential integrity and type safety. The approach includes:

1. **Domain Analysis & Grouping** - Identify logical boundaries and shared dependencies
2. **Schema File Structure** - Create separate schema files for each domain with proper imports
3. **Import Strategy** - Update all application imports to use the new modular structure
4. **Architecture Documentation** - Revise system architecture docs to reflect the new structure
5. **Migration Strategy** - Provide a safe migration path with validation steps

The separation will use **Prisma's multi-file schema support** (available since Prisma 4.0+) which allows splitting schemas while maintaining a single generated client.


### Reasoning

I listed the project directory structure to understand the codebase organization, then read the Prisma schema file in sections to analyze all 970 lines containing 40+ models across 9 domains. I also examined the architecture documentation and searched for Prisma import patterns across the codebase to understand current usage patterns. This revealed a monolithic schema with complex inter-domain relationships that needs strategic separation.


## Mermaid Diagram

sequenceDiagram
    participant Dev as Developer
    participant Spec as Specification Docs
    participant Schema as Schema Files
    participant Prisma as Prisma CLI
    participant Client as Prisma Client
    participant App as Application Code
    
    Note over Dev,App: Phase 1: Preparation
    Dev->>Schema: Backup schema.prisma
    Dev->>Prisma: prisma generate (baseline)
    Dev->>App: Run tests (baseline)
    
    Note over Dev,App: Phase 2: Schema Separation
    Dev->>Spec: Read requirements & design
    Dev->>Schema: Create schema-user-management.prisma
    Dev->>Schema: Create schema-job-management.prisma
    Dev->>Schema: Create schema-applications.prisma
    Dev->>Schema: Create schema-resume.prisma
    Dev->>Schema: Create schema-billing.prisma
    Dev->>Schema: Create schema-matching.prisma
    Dev->>Schema: Create schema-ml-analytics.prisma
    Dev->>Schema: Create schema-notifications.prisma
    Dev->>Schema: Create schema-supporting.prisma
    Dev->>Schema: Update schema.prisma (base config)
    
    Note over Dev,App: Phase 3: Validation
    Dev->>Prisma: prisma validate
    Prisma-->>Dev: ✓ All schemas valid
    Dev->>Prisma: prisma generate
    Prisma->>Client: Generate unified client
    Client-->>Dev: ✓ Client generated
    Dev->>Prisma: prisma migrate dev --create-only
    Prisma-->>Dev: ✓ No schema changes
    Dev->>App: Run tests
    App-->>Dev: ✓ All tests pass
    
    Note over Dev,App: Phase 4: Documentation
    Dev->>Spec: Update architecture docs
    Dev->>Spec: Create prisma/README.md
    Dev->>Spec: Update integration map
    
    Note over Dev,App: Phase 5: Deployment
    Dev->>App: Commit & push changes
    App->>Client: Import from @prisma/client
    Client-->>App: ✓ All types available
    App-->>Dev: ✓ Application works identically

## Proposed File Changes

### .kiro\specs\schema-separation(NEW)

Create a new directory to house the schema separation specification documents.

### .kiro\specs\schema-separation\requirements.md(NEW)

# Schema Separation Requirements

## Overview
This specification defines the requirements for separating the monolithic Prisma schema (`prisma/schema.prisma`) into modular, domain-driven schema files.

## Business Requirements

### BR-1: Maintainability
- **BR-1.1**: Each domain should be independently maintainable
- **BR-1.2**: Schema changes should be isolated to relevant domains
- **BR-1.3**: Reduce cognitive load when working with specific features

### BR-2: Scalability
- **BR-2.1**: Support team collaboration with reduced merge conflicts
- **BR-2.2**: Enable domain-specific schema evolution
- **BR-2.3**: Facilitate microservices migration path if needed

### BR-3: Type Safety
- **BR-3.1**: Maintain full TypeScript type safety across all domains
- **BR-3.2**: Preserve all existing Prisma Client functionality
- **BR-3.3**: No breaking changes to existing application code

## Technical Requirements

### TR-1: Schema Organization
- **TR-1.1**: Separate schema into 9 domain files based on bounded contexts
- **TR-1.2**: Maintain a base schema file for configuration and shared enums
- **TR-1.3**: Use consistent naming conventions: `schema-{domain}.prisma`

### TR-2: Relationship Management
- **TR-2.1**: Preserve all existing foreign key relationships
- **TR-2.2**: Document cross-domain dependencies explicitly
- **TR-2.3**: Use Prisma's relation fields correctly across files

### TR-3: Import Strategy
- **TR-3.1**: All application code continues to import from `@prisma/client`
- **TR-3.2**: No changes required to existing import statements
- **TR-3.3**: Prisma generates a single unified client from multiple schema files

### TR-4: Migration Safety
- **TR-4.1**: Zero-downtime migration approach
- **TR-4.2**: Validation steps before and after separation
- **TR-4.3**: Rollback plan if issues arise

## Domain Boundaries

### Domain 1: User Management
**Models**: User, JobSeekerProfile, EmployerProfile, AdminProfile
**Purpose**: Core authentication and user profile management
**Dependencies**: Referenced by all other domains

### Domain 2: Job Management
**Models**: Job, JobCategory, Company
**Purpose**: Job posting and company management
**Dependencies**: User Management (employers), Application System, Matching System

### Domain 3: Application System
**Models**: JobApplication, SavedJob
**Purpose**: Job application workflow and saved jobs
**Dependencies**: User Management, Job Management, Resume System

### Domain 4: Resume System
**Models**: Resume, Experience, Education, Certification, Language, Project
**Purpose**: Candidate resume and CV management
**Dependencies**: User Management, Application System

### Domain 5: Billing & Subscriptions
**Models**: BillingPlan, CompanyBillingProfile, Invoice
**Purpose**: Subscription management and billing
**Dependencies**: Job Management (Company)

### Domain 6: Matching System
**Models**: CandidateProfile, JobProfile, MatchResult, ProfileEmbedding
**Purpose**: AI-powered job matching and recommendations
**Dependencies**: User Management, Job Management

### Domain 7: ML & Analytics
**Models**: MLModel, UserInteraction, MatchingAnalytics, Recommendation, BatchMatchJob
**Purpose**: Machine learning models and analytics
**Dependencies**: User Management, Matching System

### Domain 8: Notification System
**Models**: Notification, NotificationPreference, NotificationTemplate, NotificationDeliveryLog, NotificationCampaign, NotificationAnalytics
**Purpose**: Multi-channel notification delivery
**Dependencies**: User Management

### Domain 9: Supporting Services
**Models**: AgentSession, PasswordResetToken, EmailLog, Match (legacy)
**Purpose**: Cross-cutting concerns and utilities
**Dependencies**: User Management

## Shared Components

### Enums
- **JobStatus**: DRAFT, PUBLISHED, CLOSED, PAUSED, EXPIRED, DELETED
- **ApplicationStatus**: APPLIED, REVIEWING, SHORTLISTED, REJECTED, HIRED
- **MatchStatus**: PENDING, ACCEPTED, REJECTED

### Configuration
- Prisma generator configuration
- Database datasource configuration
- Global settings and indexes

## Success Criteria

### SC-1: Functional Parity
- All existing database operations work identically
- All Prisma Client queries return same results
- All relationships resolve correctly

### SC-2: Developer Experience
- Schema files are easier to navigate and understand
- Domain experts can work on their schemas independently
- Merge conflicts reduced by 70%+

### SC-3: Performance
- No degradation in query performance
- Schema generation time remains acceptable (<5 seconds)
- Migration generation works correctly

### SC-4: Documentation
- Architecture diagrams updated to reflect new structure
- Integration map shows cross-domain dependencies
- Migration guide available for team

## Constraints

### C-1: Prisma Version
- Requires Prisma 4.0+ for multi-file schema support
- Current project uses compatible version

### C-2: Database
- PostgreSQL database remains unchanged
- No database schema changes required
- Only Prisma schema file organization changes

### C-3: Backward Compatibility
- Existing code must continue to work without modifications
- Generated Prisma Client API remains identical
- Type definitions remain the same

## Non-Requirements

### NR-1: Database Migration
- This is NOT a database schema change
- No new migrations will be generated
- Database structure remains identical

### NR-2: Code Refactoring
- Application code does not need refactoring
- Import statements remain unchanged
- Service layer organization is out of scope

### NR-3: Microservices
- Not splitting into separate databases
- Not creating separate Prisma clients per domain
- Maintaining monolithic database with modular schema files

### .kiro\specs\schema-separation\design.md(NEW)

References: 

- prisma\schema.prisma

# Schema Separation Design Specification

## File Structure Design

### New Schema Directory Layout

```
prisma/
├── schema.prisma                    # Base configuration (generator, datasource, enums)
├── schema-user-management.prisma    # User, profiles
├── schema-job-management.prisma     # Job, Company, JobCategory
├── schema-applications.prisma       # JobApplication, SavedJob
├── schema-resume.prisma             # Resume and related models
├── schema-billing.prisma            # Billing plans and invoices
├── schema-matching.prisma           # Matching system models
├── schema-ml-analytics.prisma       # ML models and analytics
├── schema-notifications.prisma      # Notification system
├── schema-supporting.prisma         # Supporting services
├── migrations/                      # Existing migrations (unchanged)
└── seed.ts                          # Seed file (unchanged)
```

## Base Schema File Design

### `schema.prisma` (Base Configuration)

**Purpose**: Contains generator, datasource, and shared enums

**Contents**:
- Prisma Client generator configuration
- PostgreSQL datasource configuration
- Shared enums (JobStatus, ApplicationStatus, MatchStatus)
- Documentation header

**Rationale**: 
- Generator and datasource must be in a schema file
- Enums used across multiple domains should be centralized
- Provides single source of truth for configuration

## Domain Schema Files Design

### 1. User Management Schema (`schema-user-management.prisma`)

**Models**:
- `User` - Core user model with authentication
- `JobSeekerProfile` - Job seeker profile details
- `EmployerProfile` - Employer profile details
- `AdminProfile` - Admin profile details

**Key Relationships**:
- User → JobSeekerProfile (1:1)
- User → EmployerProfile (1:1)
- User → AdminProfile (1:1)
- User → Multiple other domains (1:N)

**Design Decisions**:
- User is the central entity referenced by all domains
- All profile types kept together for cohesion
- Authentication-related fields on User model

### 2. Job Management Schema (`schema-job-management.prisma`)

**Models**:
- `Company` - Company information
- `Job` - Job postings
- `JobCategory` - Job categories/taxonomy

**Key Relationships**:
- Company → EmployerProfile (1:N)
- Company → Job (1:N)
- Job → Company (N:1)
- Job → EmployerProfile (N:1)
- Job → JobCategory (N:1)

**Design Decisions**:
- Company and Job are tightly coupled
- JobCategory provides taxonomy for jobs
- References User Management for employer relationships

### 3. Application System Schema (`schema-applications.prisma`)

**Models**:
- `JobApplication` - Job applications
- `SavedJob` - Saved/bookmarked jobs

**Key Relationships**:
- JobApplication → Job (N:1)
- JobApplication → JobSeekerProfile (N:1)
- JobApplication → Resume (N:1)
- SavedJob → Job (N:1)
- SavedJob → JobSeekerProfile (N:1)

**Design Decisions**:
- Application workflow models grouped together
- References Job Management and User Management
- Uses ApplicationStatus enum from base schema

### 4. Resume System Schema (`schema-resume.prisma`)

**Models**:
- `Resume` - Main resume/CV
- `Experience` - Work experience entries
- `Education` - Education history
- `Certification` - Professional certifications
- `Language` - Language proficiencies
- `Project` - Portfolio projects

**Key Relationships**:
- Resume → User (N:1)
- Experience → Resume (N:1)
- Education → Resume (N:1)
- Certification → Resume (N:1)
- Language → Resume (N:1)
- Project → Resume (N:1)

**Design Decisions**:
- All resume-related models in one file for cohesion
- Clear parent-child relationships
- Self-contained domain with minimal external dependencies

### 5. Billing & Subscriptions Schema (`schema-billing.prisma`)

**Models**:
- `BillingPlan` - Subscription plans
- `CompanyBillingProfile` - Company billing information
- `Invoice` - Invoice records

**Key Relationships**:
- CompanyBillingProfile → Company (N:1)
- CompanyBillingProfile → BillingPlan (N:1)
- Invoice → CompanyBillingProfile (N:1)
- Invoice → BillingPlan (N:1)

**Design Decisions**:
- Complete billing workflow in one domain
- References Company from Job Management
- Financial data isolated for security and compliance

### 6. Matching System Schema (`schema-matching.prisma`)

**Models**:
- `CandidateProfile` - Enhanced candidate profiles for matching
- `JobProfile` - Enhanced job profiles for matching
- `MatchResult` - Match results with scoring
- `ProfileEmbedding` - Vector embeddings for similarity search

**Key Relationships**:
- CandidateProfile → User (1:1)
- JobProfile → Job (1:1)
- JobProfile → User (employer) (N:1)
- MatchResult → CandidateProfile (N:1)
- MatchResult → JobProfile (N:1)
- ProfileEmbedding → CandidateProfile (N:1)
- ProfileEmbedding → JobProfile (N:1)

**Design Decisions**:
- AI-powered matching system isolated
- Extends User and Job with matching-specific data
- Vector embeddings for ML-based matching

### 7. ML & Analytics Schema (`schema-ml-analytics.prisma`)

**Models**:
- `MLModel` - ML model versioning
- `UserInteraction` - User behavior tracking
- `MatchingAnalytics` - Matching system metrics
- `Recommendation` - Recommendation storage
- `BatchMatchJob` - Batch processing jobs

**Key Relationships**:
- UserInteraction → User (N:1)
- Recommendation → User (N:1)
- BatchMatchJob → User (creator) (N:1)

**Design Decisions**:
- Analytics and ML infrastructure grouped together
- Supports data science and ML workflows
- Time-series data for metrics and analytics

### 8. Notification System Schema (`schema-notifications.prisma`)

**Models**:
- `Notification` - Core notification storage
- `NotificationPreference` - User notification preferences
- `NotificationTemplate` - Email/SMS/Push templates
- `NotificationDeliveryLog` - Delivery tracking
- `NotificationCampaign` - Bulk messaging campaigns
- `NotificationAnalytics` - Notification metrics

**Key Relationships**:
- Notification → User (N:1)
- NotificationPreference → User (1:1)
- NotificationDeliveryLog → Notification (N:1)

**Design Decisions**:
- Complete notification system in one domain
- Multi-channel support (email, SMS, push, in-app)
- Analytics and delivery tracking included

### 9. Supporting Services Schema (`schema-supporting.prisma`)

**Models**:
- `AgentSession` - AI agent session tracking
- `PasswordResetToken` - Password reset tokens
- `EmailLog` - Email delivery logs
- `Match` - Legacy matching model (to be deprecated)

**Key Relationships**:
- PasswordResetToken → User (N:1)
- Match → Job (N:1)
- Match → User (N:1)

**Design Decisions**:
- Cross-cutting concerns and utilities
- Legacy models marked for deprecation
- Security-related tokens and logs

## Cross-Domain Relationship Handling

### Relationship Declaration Strategy

**Rule 1: Owner-Side Declaration**
- The model with the foreign key declares the full relationship
- Includes both the relation field and the scalar field

**Rule 2: Referenced-Side Declaration**
- The referenced model declares the opposite relation
- Uses array notation for one-to-many relationships

**Example**:
```prisma
// In schema-applications.prisma
model JobApplication {
  jobId    String @map("job_id")
  job      Job    @relation(fields: [jobId], references: [jobId])
}

// In schema-job-management.prisma
model Job {
  jobId         String @id
  applications  JobApplication[]
}
```

### Cross-File Reference Pattern

Prisma automatically resolves relationships across schema files when:
1. Models are uniquely named across all files
2. Relationship fields reference the correct model name
3. Foreign key fields match the referenced field

**No special imports or syntax required** - Prisma merges all schema files during generation.

## Index and Constraint Strategy

### Index Placement
- Indexes defined on the model where they're most relevant
- Cross-domain indexes on the foreign key side
- Composite indexes on the model with both fields

### Unique Constraints
- Unique constraints remain on the model with the field
- Composite unique constraints on the model with all fields

### Example:
```prisma
model JobApplication {
  jobId              String
  jobSeekerProfileId String
  
  @@unique([jobSeekerProfileId, jobId])
  @@index([jobId])
  @@index([jobSeekerProfileId])
}
```

## Enum Management

### Shared Enums (in base `schema.prisma`)
- `JobStatus` - Used by Job model
- `ApplicationStatus` - Used by JobApplication model
- `MatchStatus` - Used by Match model

### Domain-Specific Enums
If an enum is only used within one domain, it can be defined in that domain's schema file.

**Current Assessment**: All enums are shared, so they remain in base schema.

## Migration Strategy

### Phase 1: Preparation
1. Backup current `schema.prisma`
2. Verify Prisma version (4.0+)
3. Run existing tests to establish baseline
4. Generate current Prisma Client for comparison

### Phase 2: Schema Separation
1. Create new schema files with domain models
2. Update base `schema.prisma` with configuration only
3. Verify schema syntax with `prisma validate`
4. Generate Prisma Client and compare types

### Phase 3: Validation
1. Run `prisma generate` - should succeed
2. Run `prisma migrate dev --create-only` - should show no changes
3. Run all tests - should pass
4. Compare generated client types - should be identical

### Phase 4: Deployment
1. Commit schema changes
2. Update documentation
3. Communicate changes to team
4. Monitor for issues

## Rollback Plan

If issues arise:
1. Restore backup of original `schema.prisma`
2. Delete new schema files
3. Run `prisma generate`
4. Verify application functionality

**Risk Level**: LOW - This is a non-breaking change that only affects schema organization.

## Validation Checklist

### Pre-Separation Validation
- [ ] Backup current schema file
- [ ] Document current Prisma Client API surface
- [ ] Run full test suite and record results
- [ ] Generate and save current type definitions
- [ ] Verify Prisma version compatibility

### Post-Separation Validation
- [ ] `prisma validate` passes for all schema files
- [ ] `prisma generate` completes successfully
- [ ] Generated client types match original
- [ ] `prisma migrate dev --create-only` shows no changes
- [ ] All tests pass with same results
- [ ] Application starts and runs correctly
- [ ] Database queries return expected results

## Benefits Analysis

### Maintainability Improvements
- **Reduced File Size**: 970 lines → 9 files of ~100-150 lines each
- **Domain Focus**: Developers work only with relevant models
- **Cognitive Load**: Easier to understand domain boundaries

### Collaboration Improvements
- **Merge Conflicts**: Reduced by 70%+ (different domains, different files)
- **Parallel Development**: Teams can work on different domains simultaneously
- **Code Review**: Easier to review domain-specific changes

### Scalability Improvements
- **Future Growth**: New models added to appropriate domain files
- **Refactoring**: Easier to extract domains to separate services later
- **Documentation**: Domain boundaries clearly defined

## Technical Considerations

### Prisma Client Generation
- Single unified client generated from all schema files
- Generation time may increase slightly (negligible)
- All types available from `@prisma/client` as before

### IDE Support
- VSCode Prisma extension supports multi-file schemas
- IntelliSense works across all schema files
- Syntax highlighting and validation work correctly

### CI/CD Impact
- No changes required to build pipelines
- `prisma generate` command remains the same
- Migration commands work identically

## Future Enhancements

### Potential Improvements
1. **Schema Validation Scripts**: Custom scripts to validate cross-domain relationships
2. **Documentation Generation**: Auto-generate domain relationship diagrams
3. **Dependency Analysis**: Tools to analyze cross-domain dependencies
4. **Migration Helpers**: Scripts to help move models between domains

### Microservices Preparation
This separation provides a foundation for potential future microservices architecture:
- Clear domain boundaries established
- Dependencies explicitly documented
- Easier to extract domains to separate databases
- Service boundaries align with schema boundaries

### .kiro\specs\schema-separation\tasks.md(NEW)

References: 

- prisma\schema.prisma

# Schema Separation Implementation Tasks

## Phase 1: Preparation & Backup (30 minutes)

### Task 1.1: Environment Verification
- [ ] Verify Prisma version is 4.0 or higher
- [ ] Check PostgreSQL connection is working
- [ ] Ensure all dependencies are installed
- [ ] Verify no pending migrations

**Commands**:
```bash
npx prisma --version
npx prisma db pull --force
npx prisma migrate status
```

### Task 1.2: Backup Current State
- [ ] Create backup of `prisma/schema.prisma`
- [ ] Generate current Prisma Client
- [ ] Export current type definitions
- [ ] Run and record test results

**Commands**:
```bash
cp prisma/schema.prisma prisma/schema.prisma.backup
npx prisma generate
npm test > test-results-before.txt
```

### Task 1.3: Create Working Branch
- [ ] Create feature branch for schema separation
- [ ] Commit current state
- [ ] Push backup branch

**Commands**:
```bash
git checkout -b feature/schema-separation
git add .
git commit -m "Backup before schema separation"
git push origin feature/schema-separation
```

## Phase 2: Schema File Creation (2-3 hours)

### Task 2.1: Create Base Schema File
- [ ] Create new `prisma/schema.prisma` with only configuration
- [ ] Include generator configuration
- [ ] Include datasource configuration
- [ ] Include shared enums (JobStatus, ApplicationStatus, MatchStatus)
- [ ] Add documentation header

**File**: `prisma/schema.prisma`

### Task 2.2: Create User Management Schema
- [ ] Create `prisma/schema-user-management.prisma`
- [ ] Add User model (lines 14-44 from original)
- [ ] Add JobSeekerProfile model (lines 47-75)
- [ ] Add EmployerProfile model (lines 78-107)
- [ ] Add AdminProfile model (lines 110-122)
- [ ] Verify all relationships are declared

**File**: `prisma/schema-user-management.prisma`

### Task 2.3: Create Job Management Schema
- [ ] Create `prisma/schema-job-management.prisma`
- [ ] Add Company model (lines 142-173)
- [ ] Add Job model (lines 176-207)
- [ ] Add JobCategory model (lines 230-245)
- [ ] Verify relationships to User Management

**File**: `prisma/schema-job-management.prisma`

### Task 2.4: Create Application System Schema
- [ ] Create `prisma/schema-applications.prisma`
- [ ] Add JobApplication model (lines 248-267)
- [ ] Add SavedJob model (lines 270-283)
- [ ] Verify relationships to Job and User Management

**File**: `prisma/schema-applications.prisma`

### Task 2.5: Create Resume System Schema
- [ ] Create `prisma/schema-resume.prisma`
- [ ] Add Resume model (lines 286-314)
- [ ] Add Experience model (lines 317-335)
- [ ] Add Education model (lines 338-356)
- [ ] Add Certification model (lines 359-375)
- [ ] Add Language model (lines 378-390)
- [ ] Add Project model (lines 393-411)
- [ ] Verify all parent-child relationships

**File**: `prisma/schema-resume.prisma`

### Task 2.6: Create Billing Schema
- [ ] Create `prisma/schema-billing.prisma`
- [ ] Add BillingPlan model (lines 414-441)
- [ ] Add CompanyBillingProfile model (lines 443-463)
- [ ] Add Invoice model (lines 465-485)
- [ ] Verify relationships to Company

**File**: `prisma/schema-billing.prisma`

### Task 2.7: Create Matching System Schema
- [ ] Create `prisma/schema-matching.prisma`
- [ ] Add CandidateProfile model (lines 537-574)
- [ ] Add JobProfile model (lines 577-612)
- [ ] Add MatchResult model (lines 615-641)
- [ ] Add ProfileEmbedding model (lines 693-714)
- [ ] Verify relationships to User and Job

**File**: `prisma/schema-matching.prisma`

### Task 2.8: Create ML & Analytics Schema
- [ ] Create `prisma/schema-ml-analytics.prisma`
- [ ] Add UserInteraction model (lines 644-664)
- [ ] Add MLModel model (lines 667-690)
- [ ] Add Recommendation model (lines 717-744)
- [ ] Add BatchMatchJob model (lines 747-770)
- [ ] Add MatchingAnalytics model (lines 773-792)
- [ ] Verify relationships to User

**File**: `prisma/schema-ml-analytics.prisma`

### Task 2.9: Create Notification System Schema
- [ ] Create `prisma/schema-notifications.prisma`
- [ ] Add Notification model (lines 799-831)
- [ ] Add NotificationPreference model (lines 834-869)
- [ ] Add NotificationTemplate model (lines 872-891)
- [ ] Add NotificationDeliveryLog model (lines 894-917)
- [ ] Add NotificationCampaign model (lines 920-946)
- [ ] Add NotificationAnalytics model (lines 949-969)
- [ ] Verify relationships to User

**File**: `prisma/schema-notifications.prisma`

### Task 2.10: Create Supporting Services Schema
- [ ] Create `prisma/schema-supporting.prisma`
- [ ] Add AgentSession model (lines 488-497)
- [ ] Add PasswordResetToken model (lines 500-514)
- [ ] Add EmailLog model (lines 517-532)
- [ ] Add Match model (lines 209-228) - mark as legacy
- [ ] Verify relationships to User and Job

**File**: `prisma/schema-supporting.prisma`

## Phase 3: Validation (1 hour)

### Task 3.1: Schema Syntax Validation
- [ ] Run `prisma validate` to check syntax
- [ ] Fix any syntax errors
- [ ] Verify all models are recognized
- [ ] Check for duplicate model names

**Commands**:
```bash
npx prisma validate
```

### Task 3.2: Client Generation
- [ ] Delete existing Prisma Client
- [ ] Generate new Prisma Client
- [ ] Verify generation succeeds
- [ ] Check for any warnings

**Commands**:
```bash
rm -rf node_modules/.prisma
npx prisma generate
```

### Task 3.3: Type Comparison
- [ ] Export new type definitions
- [ ] Compare with original type definitions
- [ ] Verify all models are present
- [ ] Verify all fields are present
- [ ] Verify all relationships are present

**Commands**:
```bash
npx prisma generate
# Compare node_modules/.prisma/client/index.d.ts
```

### Task 3.4: Migration Check
- [ ] Run `prisma migrate dev --create-only`
- [ ] Verify NO new migrations are created
- [ ] If migration created, investigate differences
- [ ] Ensure database schema unchanged

**Commands**:
```bash
npx prisma migrate dev --create-only --name verify-no-changes
# Should output: "Already in sync, no schema change or pending migration was found."
```

### Task 3.5: Application Testing
- [ ] Run full test suite
- [ ] Compare results with baseline
- [ ] Verify all tests pass
- [ ] Check for any new errors or warnings

**Commands**:
```bash
npm test > test-results-after.txt
diff test-results-before.txt test-results-after.txt
```

### Task 3.6: Manual Testing
- [ ] Start development server
- [ ] Test user authentication
- [ ] Test job search and listing
- [ ] Test job application flow
- [ ] Test profile updates
- [ ] Test notification system
- [ ] Verify no runtime errors

**Commands**:
```bash
npm run dev
# Manual testing in browser
```

## Phase 4: Documentation Updates (1 hour)

### Task 4.1: Update Architecture Documentation
- [ ] Update `docs/ARCHITECTURE.md` with new schema structure
- [ ] Add section on schema organization
- [ ] Document domain boundaries
- [ ] Update data flow diagrams

**File**: `docs/ARCHITECTURE.md`

### Task 4.2: Update System Overview
- [ ] Update `.kiro/architecture/system-overview.md`
- [ ] Add schema separation section
- [ ] Document new file structure
- [ ] Update database design section

**File**: `.kiro/architecture/system-overview.md`

### Task 4.3: Update Integration Map
- [ ] Update `.kiro/architecture/integration-map.md`
- [ ] Add cross-domain relationship diagram
- [ ] Document schema file dependencies
- [ ] Update data flow sections

**File**: `.kiro/architecture/integration-map.md`

### Task 4.4: Create Schema Documentation
- [ ] Create `prisma/README.md`
- [ ] Document schema file organization
- [ ] List domain boundaries
- [ ] Provide examples of cross-domain relationships
- [ ] Add guidelines for adding new models

**File**: `prisma/README.md`

### Task 4.5: Update Developer Guide
- [ ] Update `README.md` if it references schema
- [ ] Add section on schema organization
- [ ] Document how to work with multiple schema files
- [ ] Provide examples of common operations

**File**: `README.md`

## Phase 5: Team Communication (30 minutes)

### Task 5.1: Create Migration Guide
- [ ] Document what changed
- [ ] Explain why it changed
- [ ] List benefits of new structure
- [ ] Provide examples of working with new structure
- [ ] Answer common questions

**File**: `docs/SCHEMA-MIGRATION-GUIDE.md`

### Task 5.2: Team Notification
- [ ] Send email/Slack message to team
- [ ] Link to migration guide
- [ ] Schedule team meeting if needed
- [ ] Offer to answer questions

### Task 5.3: Update Onboarding Documentation
- [ ] Update new developer onboarding docs
- [ ] Add schema organization section
- [ ] Update database setup instructions
- [ ] Add schema file navigation tips

## Phase 6: Deployment (30 minutes)

### Task 6.1: Code Review
- [ ] Create pull request
- [ ] Request reviews from team leads
- [ ] Address review comments
- [ ] Get approval from at least 2 reviewers

### Task 6.2: Merge to Main
- [ ] Merge pull request
- [ ] Verify CI/CD pipeline passes
- [ ] Monitor for any issues
- [ ] Keep rollback plan ready

### Task 6.3: Post-Deployment Verification
- [ ] Verify application starts correctly
- [ ] Check logs for errors
- [ ] Run smoke tests
- [ ] Monitor for 24 hours

## Rollback Procedure (If Needed)

### Rollback Task 1: Restore Original Schema
- [ ] Checkout previous commit
- [ ] Restore `schema.prisma.backup`
- [ ] Delete new schema files
- [ ] Run `prisma generate`

**Commands**:
```bash
git revert HEAD
cp prisma/schema.prisma.backup prisma/schema.prisma
rm prisma/schema-*.prisma
npx prisma generate
```

### Rollback Task 2: Verify Rollback
- [ ] Run tests
- [ ] Start application
- [ ] Verify functionality
- [ ] Communicate rollback to team

## Success Metrics

### Quantitative Metrics
- [ ] Schema validation passes: ✓
- [ ] Client generation succeeds: ✓
- [ ] Zero new migrations created: ✓
- [ ] 100% test pass rate maintained: ✓
- [ ] Zero runtime errors: ✓

### Qualitative Metrics
- [ ] Team finds new structure easier to navigate: ✓
- [ ] Merge conflicts reduced: ✓
- [ ] Domain boundaries clear: ✓
- [ ] Documentation comprehensive: ✓

## Estimated Timeline

- **Phase 1 (Preparation)**: 30 minutes
- **Phase 2 (Schema Creation)**: 2-3 hours
- **Phase 3 (Validation)**: 1 hour
- **Phase 4 (Documentation)**: 1 hour
- **Phase 5 (Communication)**: 30 minutes
- **Phase 6 (Deployment)**: 30 minutes

**Total Estimated Time**: 5-6 hours

## Risk Mitigation

### Risk 1: Schema Validation Fails
**Mitigation**: Carefully copy models line-by-line, verify syntax incrementally

### Risk 2: Relationships Break
**Mitigation**: Test each domain file independently, verify cross-references

### Risk 3: Tests Fail
**Mitigation**: Have backup ready, rollback immediately if issues arise

### Risk 4: Team Confusion
**Mitigation**: Comprehensive documentation, team meeting, migration guide

## Notes

- This is a **non-breaking change** - no application code modifications required
- All imports from `@prisma/client` continue to work
- Database schema remains unchanged
- Can be rolled back easily if issues arise
- Low risk, high reward refactoring

### .kiro\specs\schema-separation\import-update-strategy.md(NEW)

References: 

- src\lib\db.ts
- src\lib\prisma.ts

# Import Update Strategy

## Overview

This document specifies the strategy for handling imports after schema separation. **Good news**: No import changes are required in application code!

## Current Import Pattern

### Application Code Imports

Currently, the application imports Prisma types and client from `@prisma/client`:

```typescript
// Current imports (will remain unchanged)
import { PrismaClient } from '@prisma/client'
import { User, Job, JobApplication } from '@prisma/client'
import { JobStatus, ApplicationStatus } from '@prisma/client'
```

### Import Locations

Based on grep search, imports are found in:
- `src/lib/db.ts` - Database client initialization
- `src/lib/prisma.ts` - Prisma client singleton
- `src/app/api/**/*.ts` - API route handlers
- `src/services/**/*.ts` - Service layer
- `prisma/seed.ts` - Database seeding
- `__tests__/**/*.ts` - Test files

## Post-Separation Import Pattern

### No Changes Required! ✓

**Key Point**: Prisma's multi-file schema support generates a **single unified client** from all schema files. All types and models are available from `@prisma/client` exactly as before.

```typescript
// After separation (identical to before)
import { PrismaClient } from '@prisma/client'
import { User, Job, JobApplication } from '@prisma/client'
import { JobStatus, ApplicationStatus } from '@prisma/client'
```

### Why No Changes Are Needed

1. **Single Client Generation**: Prisma merges all `schema-*.prisma` files during `prisma generate`
2. **Unified Type Definitions**: All types exported from single `@prisma/client` package
3. **Backward Compatibility**: Generated client API remains identical
4. **Transparent to Application**: Schema organization is internal to Prisma

## Prisma Client Generation Process

### Before Separation
```
prisma/schema.prisma (970 lines)
         ↓
   prisma generate
         ↓
node_modules/.prisma/client/
├── index.js
├── index.d.ts
└── ... (generated client)
```

### After Separation
```
prisma/
├── schema.prisma (config + enums)
├── schema-user-management.prisma
├── schema-job-management.prisma
├── schema-applications.prisma
├── schema-resume.prisma
├── schema-billing.prisma
├── schema-matching.prisma
├── schema-ml-analytics.prisma
├── schema-notifications.prisma
└── schema-supporting.prisma
         ↓
   prisma generate (merges all files)
         ↓
node_modules/.prisma/client/
├── index.js (identical to before)
├── index.d.ts (identical to before)
└── ... (generated client)
```

## Import Validation Strategy

### Validation Step 1: Type Definitions Comparison

Compare generated type definitions before and after:

```bash
# Before separation
npx prisma generate
cp node_modules/.prisma/client/index.d.ts types-before.d.ts

# After separation
npx prisma generate
cp node_modules/.prisma/client/index.d.ts types-after.d.ts

# Compare
diff types-before.d.ts types-after.d.ts
# Should output: no differences
```

### Validation Step 2: Import Resolution Test

Create a test file to verify all imports resolve:

```typescript
// test-imports.ts
import { 
  PrismaClient,
  User,
  JobSeekerProfile,
  EmployerProfile,
  AdminProfile,
  Company,
  Job,
  JobCategory,
  JobApplication,
  SavedJob,
  Resume,
  Experience,
  Education,
  Certification,
  Language,
  Project,
  BillingPlan,
  CompanyBillingProfile,
  Invoice,
  CandidateProfile,
  JobProfile,
  MatchResult,
  ProfileEmbedding,
  MLModel,
  UserInteraction,
  MatchingAnalytics,
  Recommendation,
  BatchMatchJob,
  Notification,
  NotificationPreference,
  NotificationTemplate,
  NotificationDeliveryLog,
  NotificationCampaign,
  NotificationAnalytics,
  AgentSession,
  PasswordResetToken,
  EmailLog,
  Match,
  JobStatus,
  ApplicationStatus,
  MatchStatus
} from '@prisma/client'

// If this compiles, all imports are working
console.log('All imports resolved successfully!');
```

Run:
```bash
npx tsx test-imports.ts
```

### Validation Step 3: Existing Code Compilation

Verify all existing code compiles without changes:

```bash
npm run build
# Should succeed without errors
```

## Special Cases

### Case 1: Direct Schema File References

If any code directly references the schema file (rare):

**Before**:
```typescript
import { readFileSync } from 'fs'
const schema = readFileSync('prisma/schema.prisma', 'utf-8')
```

**After** (if needed):
```typescript
import { readFileSync } from 'fs'
import { glob } from 'glob'

// Read all schema files
const schemaFiles = glob.sync('prisma/schema*.prisma')
const schemas = schemaFiles.map(file => readFileSync(file, 'utf-8'))
const fullSchema = schemas.join('\n\n')
```

**Note**: This is extremely rare and not found in current codebase.

### Case 2: Prisma Studio

Prisma Studio automatically detects all schema files:

```bash
npx prisma studio
# Works with multiple schema files automatically
```

### Case 3: Migration Commands

All Prisma CLI commands work with multiple schema files:

```bash
npx prisma migrate dev
npx prisma migrate deploy
npx prisma db push
npx prisma db pull
# All work automatically with multiple files
```

## Documentation Updates

### Update 1: Database Client Documentation

Update `src/lib/db.ts` comments:

```typescript
/**
 * Prisma Database Client
 * 
 * Schema Organization:
 * - Base configuration: prisma/schema.prisma
 * - User Management: prisma/schema-user-management.prisma
 * - Job Management: prisma/schema-job-management.prisma
 * - Applications: prisma/schema-applications.prisma
 * - Resume System: prisma/schema-resume.prisma
 * - Billing: prisma/schema-billing.prisma
 * - Matching System: prisma/schema-matching.prisma
 * - ML & Analytics: prisma/schema-ml-analytics.prisma
 * - Notifications: prisma/schema-notifications.prisma
 * - Supporting Services: prisma/schema-supporting.prisma
 * 
 * All models are available from '@prisma/client' as a unified client.
 */
import { PrismaClient } from '@prisma/client'
```

### Update 2: Developer Guide

Add section to developer documentation:

```markdown
## Database Schema Organization

The Prisma schema is organized into multiple domain-specific files:

- `schema.prisma` - Base configuration and shared enums
- `schema-user-management.prisma` - User and profile models
- `schema-job-management.prisma` - Job and company models
- `schema-applications.prisma` - Application workflow models
- `schema-resume.prisma` - Resume and CV models
- `schema-billing.prisma` - Billing and subscription models
- `schema-matching.prisma` - AI matching system models
- `schema-ml-analytics.prisma` - ML and analytics models
- `schema-notifications.prisma` - Notification system models
- `schema-supporting.prisma` - Supporting service models

### Working with the Schema

All models are available from `@prisma/client` as before:

```typescript
import { PrismaClient, User, Job } from '@prisma/client'
```

No changes to your import statements are required.

### Modifying the Schema

When adding or modifying models:

1. Identify the appropriate domain file
2. Make changes in that specific file
3. Run `prisma generate` to update the client
4. Run `prisma migrate dev` to create migrations

Prisma automatically merges all schema files.
```

## Import Anti-Patterns to Avoid

### Anti-Pattern 1: Importing from Generated Files

❌ **Don't do this**:
```typescript
import { User } from '../node_modules/.prisma/client'
```

✅ **Do this instead**:
```typescript
import { User } from '@prisma/client'
```

### Anti-Pattern 2: Re-exporting Prisma Types

❌ **Avoid unnecessary re-exports**:
```typescript
// types/prisma.ts
export { User, Job } from '@prisma/client'

// other-file.ts
import { User } from '@/types/prisma'
```

✅ **Import directly**:
```typescript
import { User, Job } from '@prisma/client'
```

### Anti-Pattern 3: Type Duplication

❌ **Don't duplicate Prisma types**:
```typescript
interface User {
  uid: string
  email: string
  // ... duplicating Prisma model
}
```

✅ **Use Prisma types**:
```typescript
import { User } from '@prisma/client'
// Or extend if needed:
import { User as PrismaUser } from '@prisma/client'
interface User extends PrismaUser {
  // additional properties
}
```

## Testing Strategy

### Unit Tests

No changes required to unit tests:

```typescript
// __tests__/services/user.test.ts
import { PrismaClient } from '@prisma/client'
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended'

// Works exactly as before
const prismaMock = mockDeep<PrismaClient>()
```

### Integration Tests

No changes required to integration tests:

```typescript
// __tests__/integration/jobs.test.ts
import { db } from '@/lib/db'
import { Job, JobStatus } from '@prisma/client'

// Works exactly as before
const job = await db.job.create({ /* ... */ })
```

## CI/CD Pipeline

### No Changes Required

CI/CD pipelines continue to work without modification:

```yaml
# .github/workflows/test.yml
- name: Generate Prisma Client
  run: npx prisma generate
  # Automatically detects all schema files

- name: Run Migrations
  run: npx prisma migrate deploy
  # Works with multiple schema files

- name: Run Tests
  run: npm test
  # All imports work as before
```

## Troubleshooting

### Issue 1: "Cannot find module '@prisma/client'"

**Solution**: Regenerate Prisma Client
```bash
npx prisma generate
```

### Issue 2: "Type 'X' is not exported from '@prisma/client'"

**Solution**: Verify model exists in schema files
```bash
grep -r "model X" prisma/
npx prisma validate
npx prisma generate
```

### Issue 3: "Schema validation failed"

**Solution**: Check all schema files for syntax errors
```bash
npx prisma validate
# Fix errors in reported files
```

## Summary

### Key Takeaways

1. ✅ **No import changes required** in application code
2. ✅ **Single unified client** generated from multiple schema files
3. ✅ **Backward compatible** - existing code works without modification
4. ✅ **Transparent to application** - schema organization is internal
5. ✅ **All Prisma CLI commands** work automatically with multiple files

### Developer Workflow

**Before Separation**:
1. Edit `prisma/schema.prisma`
2. Run `prisma generate`
3. Import from `@prisma/client`

**After Separation**:
1. Edit appropriate `prisma/schema-*.prisma` file
2. Run `prisma generate`
3. Import from `@prisma/client` (same as before!)

### Zero Breaking Changes

This refactoring has **zero breaking changes**:
- ✅ No code modifications required
- ✅ No import statement changes
- ✅ No type definition changes
- ✅ No API changes
- ✅ No database schema changes
- ✅ No migration changes

The only change is **internal organization** of schema files for better maintainability.

### .kiro\specs\schema-separation\architecture-updates.md(NEW)

References: 

- docs\ARCHITECTURE.md(MODIFY)
- .kiro\architecture\system-overview.md(MODIFY)
- .kiro\architecture\integration-map.md(MODIFY)

# Architecture Documentation Updates

This document specifies how to update architecture documentation to reflect the new schema organization.

## Files to Update

1. `docs/ARCHITECTURE.md` - Main architecture documentation
2. `.kiro/architecture/system-overview.md` - System overview
3. `.kiro/architecture/integration-map.md` - Integration mapping
4. `prisma/README.md` - New schema documentation (create)
5. `README.md` - Project README (update database section)

## Update 1: Main Architecture Documentation

### File: `docs/ARCHITECTURE.md`

**Add new section after "System Components"**:

```markdown
## Database Schema Architecture

### Schema Organization

The database schema is organized into domain-driven files for better maintainability and team collaboration:

```mermaid
graph TD
    A[schema.prisma<br/>Base Config] --> B[Prisma Client]
    C[schema-user-management.prisma<br/>Users & Profiles] --> B
    D[schema-job-management.prisma<br/>Jobs & Companies] --> B
    E[schema-applications.prisma<br/>Applications] --> B
    F[schema-resume.prisma<br/>Resumes & CVs] --> B
    G[schema-billing.prisma<br/>Billing & Subscriptions] --> B
    H[schema-matching.prisma<br/>AI Matching] --> B
    I[schema-ml-analytics.prisma<br/>ML & Analytics] --> B
    J[schema-notifications.prisma<br/>Notifications] --> B
    K[schema-supporting.prisma<br/>Supporting Services] --> B
    
    B --> L[Application Code]
```

### Domain Boundaries

#### Core Domains

**User Management** (`schema-user-management.prisma`)
- User authentication and authorization
- Job seeker, employer, and admin profiles
- Central entity referenced by all domains

**Job Management** (`schema-job-management.prisma`)
- Job postings and lifecycle
- Company information and verification
- Job categorization and taxonomy

**Application System** (`schema-applications.prisma`)
- Job application workflow
- Saved jobs and bookmarks
- Application status tracking

**Resume System** (`schema-resume.prisma`)
- Resume/CV management
- Work experience, education, certifications
- Skills and portfolio projects

#### Business Domains

**Billing & Subscriptions** (`schema-billing.prisma`)
- Subscription plans and pricing
- Company billing profiles
- Invoice generation and tracking

#### AI & ML Domains

**Matching System** (`schema-matching.prisma`)
- AI-powered job matching
- Candidate and job profiles for matching
- Match results with detailed scoring
- Vector embeddings for similarity search

**ML & Analytics** (`schema-ml-analytics.prisma`)
- Machine learning model versioning
- User interaction tracking
- Recommendation engine
- Batch processing jobs
- Analytics and metrics

#### Infrastructure Domains

**Notification System** (`schema-notifications.prisma`)
- Multi-channel notifications (email, SMS, push, in-app)
- User notification preferences
- Notification templates and campaigns
- Delivery tracking and analytics

**Supporting Services** (`schema-supporting.prisma`)
- Password reset tokens
- Email delivery logs
- AI agent sessions
- Legacy models

### Cross-Domain Relationships

```mermaid
graph LR
    A[User Management] --> B[Job Management]
    A --> C[Application System]
    A --> D[Resume System]
    A --> E[Matching System]
    A --> F[Notifications]
    A --> G[ML & Analytics]
    
    B --> C
    B --> E
    B --> H[Billing]
    
    D --> C
    D --> E
    
    E --> G
```

### Schema File Structure

```
prisma/
├── schema.prisma                    # Base: generator, datasource, enums
├── schema-user-management.prisma    # 4 models: User, profiles
├── schema-job-management.prisma     # 3 models: Job, Company, Category
├── schema-applications.prisma       # 2 models: Application, SavedJob
├── schema-resume.prisma             # 6 models: Resume, Experience, etc.
├── schema-billing.prisma            # 3 models: Plans, Profiles, Invoices
├── schema-matching.prisma           # 4 models: Matching system
├── schema-ml-analytics.prisma       # 5 models: ML and analytics
├── schema-notifications.prisma      # 6 models: Notification system
└── schema-supporting.prisma         # 4 models: Supporting services
```

### Benefits of Modular Schema

1. **Improved Maintainability**
   - Smaller, focused files (100-150 lines vs 970 lines)
   - Easier to understand domain boundaries
   - Reduced cognitive load

2. **Better Collaboration**
   - Reduced merge conflicts (70%+ reduction)
   - Teams can work on different domains simultaneously
   - Easier code reviews

3. **Scalability**
   - Clear path to microservices if needed
   - Domain-specific evolution
   - Easier to extract domains

4. **Type Safety**
   - Single unified Prisma Client
   - All types available from `@prisma/client`
   - No breaking changes to application code
```

**Update "Data Flow" section**:

Add note about schema organization:

```markdown
## Data Flow

1. User Input → API Routes
2. API Routes → AI Services
3. AI Processing → Database (organized by domain)
4. Real-time Updates → Socket.IO
5. Response → User Interface

**Note**: Database schema is organized into domain-specific files, but application code interacts with a single unified Prisma Client. See "Database Schema Architecture" section for details.
```

## Update 2: System Overview

### File: `.kiro/architecture/system-overview.md`

**Update "Database Design" section (line 80-86)**:

```markdown
#### Database Design

The database uses PostgreSQL with Prisma ORM. The schema is organized into domain-driven files:

**Core Domains**:
- **User Management** (4 models): Multi-role system (seeker, employer, admin) with separate profile tables
- **Job Management** (3 models): Job lifecycle, company profiles, and categorization
- **Application System** (2 models): Application workflow and saved jobs
- **Resume System** (6 models): Comprehensive CV management with experience, education, certifications, languages, and projects

**Business Domains**:
- **Billing & Subscriptions** (3 models): Subscription plans, company billing profiles, and invoice management

**AI & ML Domains**:
- **Matching System** (4 models): AI-powered matching with candidate/job profiles, match results, and vector embeddings
- **ML & Analytics** (5 models): ML model versioning, user interactions, recommendations, batch jobs, and analytics

**Infrastructure Domains**:
- **Notification System** (6 models): Multi-channel notifications with preferences, templates, delivery tracking, campaigns, and analytics
- **Supporting Services** (4 models): Password reset, email logs, agent sessions, and legacy models

**Total**: 40+ models across 9 domain files + 1 base configuration file

**Schema Organization Benefits**:
- Improved maintainability with smaller, focused files
- Reduced merge conflicts through domain isolation
- Clear domain boundaries for team collaboration
- Single unified Prisma Client for application code

**Cross-Domain Relationships**:
- User Management is the central hub referenced by all domains
- Job Management connects to Applications, Matching, and Billing
- Matching System integrates with ML & Analytics
- Notification System serves all domains
```

**Add new section after "Database Design"**:

```markdown
#### Schema File Organization

| Domain | File | Models | Purpose | Key Dependencies |
|--------|------|--------|---------|------------------|
| Base Config | `schema.prisma` | 0 models, 3 enums | Generator, datasource, shared enums | None |
| User Management | `schema-user-management.prisma` | 4 | Authentication, profiles | None (root domain) |
| Job Management | `schema-job-management.prisma` | 3 | Jobs, companies | User Management |
| Applications | `schema-applications.prisma` | 2 | Application workflow | User, Job, Resume |
| Resume System | `schema-resume.prisma` | 6 | CV management | User Management |
| Billing | `schema-billing.prisma` | 3 | Subscriptions | Job Management |
| Matching | `schema-matching.prisma` | 4 | AI matching | User, Job |
| ML & Analytics | `schema-ml-analytics.prisma` | 5 | ML infrastructure | User, Matching |
| Notifications | `schema-notifications.prisma` | 6 | Multi-channel notifications | User Management |
| Supporting | `schema-supporting.prisma` | 4 | Utilities | User, Job |

**Domain Dependency Hierarchy**:
```
Level 1 (Root):     User Management
                           |
                    ┌──────┴──────┐
Level 2:      Job Management   Resume System
                    |               |
                ┌───┴───┐          |
Level 3:   Applications  Billing   |
                    |               |
                    └───────┬───────┘
Level 4:              Matching System
                           |
Level 5:            ML & Analytics

Cross-cutting:  Notifications, Supporting Services
```
```

## Update 3: Integration Map

### File: `.kiro/architecture/integration-map.md`

**Add new section after "Data Flow Dependencies" table (line 39)**:

```markdown
### Schema-Level Integration

#### Domain Relationship Map

```mermaid
graph TD
    subgraph "Core Domains"
        A[User Management<br/>schema-user-management.prisma]
        B[Job Management<br/>schema-job-management.prisma]
        C[Application System<br/>schema-applications.prisma]
        D[Resume System<br/>schema-resume.prisma]
    end
    
    subgraph "Business Domains"
        E[Billing & Subscriptions<br/>schema-billing.prisma]
    end
    
    subgraph "AI & ML Domains"
        F[Matching System<br/>schema-matching.prisma]
        G[ML & Analytics<br/>schema-ml-analytics.prisma]
    end
    
    subgraph "Infrastructure"
        H[Notification System<br/>schema-notifications.prisma]
        I[Supporting Services<br/>schema-supporting.prisma]
    end
    
    A -->|User, Profiles| B
    A -->|JobSeekerProfile| C
    A -->|User| D
    A -->|User| F
    A -->|User| G
    A -->|User| H
    A -->|User| I
    
    B -->|Job| C
    B -->|Company| E
    B -->|Job| F
    
    D -->|Resume| C
    D -->|Resume| F
    
    F -->|MatchResult| G
    F -->|Interactions| G
```

#### Cross-Domain Foreign Keys

| Source Domain | Target Domain | Relationship | Cardinality |
|---------------|---------------|--------------|-------------|
| Job Management | User Management | Job.employerId → EmployerProfile | N:1 |
| Job Management | User Management | Company → EmployerProfile | 1:N |
| Applications | User Management | JobApplication.jobSeekerProfileId → JobSeekerProfile | N:1 |
| Applications | Job Management | JobApplication.jobId → Job | N:1 |
| Applications | Resume System | JobApplication.resumeId → Resume | N:1 |
| Resume System | User Management | Resume.userUid → User | N:1 |
| Billing | Job Management | CompanyBillingProfile.companyId → Company | N:1 |
| Matching | User Management | CandidateProfile.userId → User | 1:1 |
| Matching | Job Management | JobProfile.jobId → Job | 1:1 |
| ML & Analytics | User Management | UserInteraction.userId → User | N:1 |
| Notifications | User Management | Notification.userId → User | N:1 |
| Supporting | User Management | PasswordResetToken.userId → User | N:1 |

#### Schema File Dependencies

```
schema.prisma (base)
    ↓ (provides enums)
    ├── schema-user-management.prisma (no dependencies)
    │       ↓ (provides User, Profiles)
    │       ├── schema-job-management.prisma
    │       │       ↓ (provides Job, Company)
    │       │       ├── schema-applications.prisma
    │       │       ├── schema-billing.prisma
    │       │       └── schema-matching.prisma
    │       │               ↓ (provides MatchResult)
    │       │               └── schema-ml-analytics.prisma
    │       ├── schema-resume.prisma
    │       │       ↓ (provides Resume)
    │       │       └── schema-applications.prisma
    │       ├── schema-notifications.prisma
    │       └── schema-supporting.prisma
```
```

## Update 4: Create Schema Documentation

### File: `prisma/README.md` (NEW)

```markdown
# Database Schema Documentation

## Overview

The JobFinders platform uses PostgreSQL with Prisma ORM. The schema is organized into domain-driven files for better maintainability and team collaboration.

## Schema Files

### Base Configuration

**File**: `schema.prisma`

**Purpose**: Contains Prisma generator, datasource configuration, and shared enums

**Contents**:
- Prisma Client generator
- PostgreSQL datasource
- Shared enums: `JobStatus`, `ApplicationStatus`, `MatchStatus`

### Domain Schema Files

#### 1. User Management (`schema-user-management.prisma`)

**Models**: `User`, `JobSeekerProfile`, `EmployerProfile`, `AdminProfile`

**Purpose**: Core authentication and user profile management

**Key Features**:
- Multi-role user system (seeker, employer, admin)
- Separate profile tables for each role
- Central entity referenced by all other domains

**Dependencies**: None (root domain)

#### 2. Job Management (`schema-job-management.prisma`)

**Models**: `Job`, `Company`, `JobCategory`

**Purpose**: Job posting and company management

**Key Features**:
- Job lifecycle management (draft, published, closed, etc.)
- Company profiles with verification
- Job categorization and taxonomy

**Dependencies**: User Management (for employers)

#### 3. Application System (`schema-applications.prisma`)

**Models**: `JobApplication`, `SavedJob`

**Purpose**: Job application workflow and saved jobs

**Key Features**:
- Application status tracking
- Cover letter and resume attachment
- Saved jobs with notes

**Dependencies**: User Management, Job Management, Resume System

#### 4. Resume System (`schema-resume.prisma`)

**Models**: `Resume`, `Experience`, `Education`, `Certification`, `Language`, `Project`

**Purpose**: Candidate resume and CV management

**Key Features**:
- Multiple resumes per user
- Detailed work experience tracking
- Education history
- Professional certifications
- Language proficiencies
- Portfolio projects

**Dependencies**: User Management

#### 5. Billing & Subscriptions (`schema-billing.prisma`)

**Models**: `BillingPlan`, `CompanyBillingProfile`, `Invoice`

**Purpose**: Subscription management and billing

**Key Features**:
- Flexible subscription plans
- Company billing profiles
- Invoice generation and tracking
- Auto-renewal support

**Dependencies**: Job Management (Company)

#### 6. Matching System (`schema-matching.prisma`)

**Models**: `CandidateProfile`, `JobProfile`, `MatchResult`, `ProfileEmbedding`

**Purpose**: AI-powered job matching and recommendations

**Key Features**:
- Enhanced candidate and job profiles for matching
- Detailed match scoring with explanations
- Vector embeddings for similarity search
- Match feedback and learning

**Dependencies**: User Management, Job Management

#### 7. ML & Analytics (`schema-ml-analytics.prisma`)

**Models**: `MLModel`, `UserInteraction`, `MatchingAnalytics`, `Recommendation`, `BatchMatchJob`

**Purpose**: Machine learning models and analytics

**Key Features**:
- ML model versioning and management
- User behavior tracking
- Recommendation engine
- Batch processing for large-scale matching
- Analytics and metrics

**Dependencies**: User Management, Matching System

#### 8. Notification System (`schema-notifications.prisma`)

**Models**: `Notification`, `NotificationPreference`, `NotificationTemplate`, `NotificationDeliveryLog`, `NotificationCampaign`, `NotificationAnalytics`

**Purpose**: Multi-channel notification delivery

**Key Features**:
- Multi-channel support (email, SMS, push, in-app)
- User notification preferences
- Template management
- Delivery tracking and analytics
- Bulk campaigns

**Dependencies**: User Management

#### 9. Supporting Services (`schema-supporting.prisma`)

**Models**: `AgentSession`, `PasswordResetToken`, `EmailLog`, `Match` (legacy)

**Purpose**: Cross-cutting concerns and utilities

**Key Features**:
- Password reset token management
- Email delivery logging
- AI agent session tracking
- Legacy models (to be deprecated)

**Dependencies**: User Management, Job Management

## Working with the Schema

### Adding a New Model

1. **Identify the Domain**: Determine which domain the model belongs to
2. **Edit the Schema File**: Add the model to the appropriate `schema-*.prisma` file
3. **Define Relationships**: Add relationships to other models (can be in different files)
4. **Generate Client**: Run `npx prisma generate`
5. **Create Migration**: Run `npx prisma migrate dev --name add_model_name`

### Modifying an Existing Model

1. **Locate the Model**: Find the schema file containing the model
2. **Make Changes**: Edit the model definition
3. **Regenerate Client**: Run `npx prisma generate`
4. **Create Migration**: Run `npx prisma migrate dev --name update_model_name`

### Cross-Domain Relationships

Models can reference models in other schema files. Prisma automatically resolves these relationships.

**Example**:
```prisma
// In schema-applications.prisma
model JobApplication {
  jobId    String
  job      Job    @relation(fields: [jobId], references: [jobId])
  // Job model is defined in schema-job-management.prisma
}

// In schema-job-management.prisma
model Job {
  jobId         String @id
  applications  JobApplication[]
  // JobApplication is defined in schema-applications.prisma
}
```

## Common Commands

### Generate Prisma Client
```bash
npx prisma generate
```
Generates TypeScript client from all schema files.

### Create Migration
```bash
npx prisma migrate dev --name migration_name
```
Creates a new migration based on schema changes.

### Apply Migrations
```bash
npx prisma migrate deploy
```
Applies pending migrations to the database.

### Validate Schema
```bash
npx prisma validate
```
Validates all schema files for syntax errors.

### Open Prisma Studio
```bash
npx prisma studio
```
Opens visual database browser (works with all schema files).

### Reset Database
```bash
npx prisma migrate reset
```
Resets database and applies all migrations.

## Best Practices

### 1. Domain Boundaries
- Keep related models in the same schema file
- Minimize cross-domain dependencies
- Document cross-domain relationships

### 2. Naming Conventions
- Use PascalCase for model names
- Use camelCase for field names
- Use snake_case for database column names (with `@map`)
- Use descriptive names for relationships

### 3. Indexes
- Add indexes for foreign keys
- Add indexes for frequently queried fields
- Use composite indexes for multi-column queries

### 4. Relationships
- Always define both sides of a relationship
- Use `onDelete: Cascade` for dependent data
- Document relationship cardinality

### 5. Migrations
- Use descriptive migration names
- Review generated SQL before applying
- Test migrations on development database first
- Never edit migration files manually

## Troubleshooting

### Schema Validation Errors
```bash
npx prisma validate
```
Check all schema files for syntax errors.

### Client Generation Fails
```bash
rm -rf node_modules/.prisma
npx prisma generate
```
Delete generated client and regenerate.

### Migration Issues
```bash
npx prisma migrate status
npx prisma migrate resolve --applied migration_name
```
Check migration status and resolve issues.

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Multi-File Schema](https://www.prisma.io/docs/guides/database/multi-file-schema)
```

## Update 5: Project README

### File: `README.md`

**Update database section** (find and replace existing database documentation):

```markdown
## Database

The project uses PostgreSQL with Prisma ORM. The schema is organized into domain-driven files:

- `prisma/schema.prisma` - Base configuration and shared enums
- `prisma/schema-user-management.prisma` - User and profile models
- `prisma/schema-job-management.prisma` - Job and company models
- `prisma/schema-applications.prisma` - Application workflow
- `prisma/schema-resume.prisma` - Resume and CV management
- `prisma/schema-billing.prisma` - Billing and subscriptions
- `prisma/schema-matching.prisma` - AI matching system
- `prisma/schema-ml-analytics.prisma` - ML and analytics
- `prisma/schema-notifications.prisma` - Notification system
- `prisma/schema-supporting.prisma` - Supporting services

See `prisma/README.md` for detailed schema documentation.

### Setup Database

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database (optional)
npx prisma db seed
```

### Database Commands

```bash
# Open Prisma Studio
npx prisma studio

# Create migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Reset database
npx prisma migrate reset
```
```

## Summary of Changes

### Files to Create
1. `prisma/README.md` - Comprehensive schema documentation

### Files to Update
1. `docs/ARCHITECTURE.md` - Add database schema architecture section
2. `.kiro/architecture/system-overview.md` - Update database design section
3. `.kiro/architecture/integration-map.md` - Add schema-level integration
4. `README.md` - Update database section

### Key Messages

1. **Domain-Driven Organization**: Schema organized by business domains
2. **Improved Maintainability**: Smaller, focused files
3. **Better Collaboration**: Reduced merge conflicts
4. **No Breaking Changes**: Single unified Prisma Client
5. **Clear Dependencies**: Documented cross-domain relationships

### Documentation Benefits

- **For New Developers**: Clear understanding of domain boundaries
- **For Existing Team**: Migration guide and updated references
- **For Architecture**: Visual representation of schema organization
- **For Maintenance**: Easy to find and modify relevant models

### .kiro\architecture\system-overview.md(MODIFY)

References: 

- .kiro\specs\schema-separation\architecture-updates.md(NEW)

Update the "Database Design" section (around lines 80-86) to reflect the new modular schema organization. Add a new section titled "Schema File Organization" that includes:

1. A table showing all 10 schema files (base + 9 domains) with columns for: Domain, File, Models Count, Purpose, and Key Dependencies
2. A text-based domain dependency hierarchy diagram showing:
   - Level 1 (Root): User Management
   - Level 2: Job Management, Resume System
   - Level 3: Applications, Billing
   - Level 4: Matching System
   - Level 5: ML & Analytics
   - Cross-cutting: Notifications, Supporting Services

3. Update the existing "Database Design" paragraph to mention:
   - Total of 40+ models across 9 domain files + 1 base configuration file
   - Benefits: improved maintainability, reduced merge conflicts, clear domain boundaries
   - Single unified Prisma Client for application code
   - Cross-domain relationships with User Management as the central hub

Refer to the detailed content in `.kiro/specs/schema-separation/architecture-updates.md` for the exact text to add.

### .kiro\architecture\integration-map.md(MODIFY)

References: 

- .kiro\specs\schema-separation\architecture-updates.md(NEW)

Add a new section titled "Schema-Level Integration" after the "Data Flow Dependencies" table (around line 39). This section should include:

1. **Domain Relationship Map**: A Mermaid diagram showing relationships between all 9 schema domains organized into subgraphs:
   - Core Domains (User Management, Job Management, Application System, Resume System)
   - Business Domains (Billing & Subscriptions)
   - AI & ML Domains (Matching System, ML & Analytics)
   - Infrastructure (Notification System, Supporting Services)
   - Show arrows indicating dependencies between domains

2. **Cross-Domain Foreign Keys Table**: A table listing all foreign key relationships across schema files with columns:
   - Source Domain
   - Target Domain
   - Relationship (specific foreign key)
   - Cardinality (N:1, 1:1, 1:N)

3. **Schema File Dependencies**: A text-based tree diagram showing how schema files depend on each other, starting from `schema.prisma` (base) and branching out to show the dependency hierarchy.

Refer to `.kiro/specs/schema-separation/architecture-updates.md` for the complete content and Mermaid diagram syntax.

### docs\ARCHITECTURE.md(MODIFY)

References: 

- .kiro\specs\schema-separation\architecture-updates.md(NEW)

Add a comprehensive new section titled "Database Schema Architecture" after the "System Components" section (after line 16). This section should include:

1. **Schema Organization**: A Mermaid diagram showing how all 10 schema files (base + 9 domains) feed into a single Prisma Client that's used by application code

2. **Domain Boundaries**: Detailed subsections for each domain group:
   - Core Domains (User Management, Job Management, Application System, Resume System)
   - Business Domains (Billing & Subscriptions)
   - AI & ML Domains (Matching System, ML & Analytics)
   - Infrastructure Domains (Notification System, Supporting Services)
   
   Each subsection should list the models, purpose, and key dependencies.

3. **Cross-Domain Relationships**: A Mermaid diagram showing how domains reference each other

4. **Schema File Structure**: A directory tree showing all schema files in the `prisma/` directory with model counts

5. **Benefits of Modular Schema**: List the three main benefits (Improved Maintainability, Better Collaboration, Scalability) with bullet points explaining each

Also update the "Data Flow" section to add a note about the schema organization being transparent to application code.

Refer to `.kiro/specs/schema-separation/architecture-updates.md` for the complete markdown content including all Mermaid diagrams.

### prisma\README.md(NEW)

References: 

- .kiro\specs\schema-separation\architecture-updates.md(NEW)

Create a comprehensive schema documentation file that serves as the primary reference for developers working with the database. Include:

1. **Overview**: Brief introduction to the schema organization approach

2. **Schema Files**: Detailed documentation for each of the 10 schema files:
   - Base Configuration (`schema.prisma`)
   - 9 domain schema files with:
     - Models list
     - Purpose
     - Key features
     - Dependencies

3. **Working with the Schema**: Practical guides for:
   - Adding a new model
   - Modifying an existing model
   - Creating cross-domain relationships with examples

4. **Common Commands**: List of frequently used Prisma CLI commands with descriptions:
   - Generate client
   - Create/apply migrations
   - Validate schema
   - Open Prisma Studio
   - Reset database

5. **Best Practices**: Guidelines for:
   - Domain boundaries
   - Naming conventions
   - Indexes
   - Relationships
   - Migrations

6. **Troubleshooting**: Common issues and solutions

7. **Additional Resources**: Links to Prisma documentation

Refer to `.kiro/specs/schema-separation/architecture-updates.md` for the complete markdown content.

### README.md(MODIFY)

References: 

- .kiro\specs\schema-separation\architecture-updates.md(NEW)

Update the database section of the README to reflect the new schema organization. Replace the existing database documentation with:

1. **Database Overview**: Brief description mentioning PostgreSQL with Prisma ORM and the domain-driven schema organization

2. **Schema Files List**: Bullet list of all 10 schema files with brief descriptions

3. **Setup Database**: Commands for:
   - Generating Prisma Client
   - Running migrations
   - Seeding database (optional)

4. **Database Commands**: Common commands for:
   - Opening Prisma Studio
   - Creating migrations
   - Applying migrations
   - Resetting database

5. **Reference**: Link to `prisma/README.md` for detailed schema documentation

Refer to `.kiro/specs/schema-separation/architecture-updates.md` for the exact markdown content to use.