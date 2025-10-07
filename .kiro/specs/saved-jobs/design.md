# Saved Jobs - Technical Design

**Version**: 1.0
**Last Updated**: 2025-10-07
**Status**: Active
**Owner**: Development Team
**Reviewers**: Product Team, UX Team

## Architecture Overview

The Saved Jobs feature follows a component-based architecture that integrates with the existing job board infrastructure:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Saved Jobs    │    │   Jobs API      │    │ Notification    │
│   Page/Components │◄──►│   Endpoints     │◄──►│   System        │
│                 │    │                 │    │                 │
│ - JobGrid       │    │ - GET /api/jobs │    │ - Deadline      │
│ - CollectionMgr │    │ - POST /api/saved│    │   Alerts        │
│ - FilterPanel   │    │ - PUT /api/saved│    │ - Updates       │
│ - BulkActions   │    │ - DELETE        │    │ - Recommendations│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   State Mgmt    │    │   Database      │    │   Cache Layer   │
│                 │    │                 │    │                 │
│ - TanStack Query│    │ - SavedJob      │    │ - Job Data      │
│ - Local State   │    │ - User          │    │ - Collections   │
│ - Optimistic    │    │ - Job           │    │ - Filters       │
│   Updates       │    │ - Collections   │    │ - Search Index  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Component Design

### 1. SavedJobsPage Component
**Location**: `src/app/saved-jobs/page.tsx`
**Purpose**: Main container for saved jobs functionality
**Responsibilities**:
- Manage overall page layout and state
- Handle authentication and user data fetching
- Coordinate between child components
- Manage responsive layout

**Props**: None (route-based component)
**State**:
- User saved jobs data
- Collections/folders data
- Current view mode (grid/list)
- Filter and sort state

### 2. SavedJobCard Component
**Location**: `src/components/saved-jobs/SavedJobCard.tsx`
**Purpose**: Display individual saved job with actions
**Responsibilities**:
- Display job information (title, company, location, salary)
- Show save status and collection membership
- Provide quick actions (unsave, apply, share)
- Display application status and deadlines
- Show last update information

**Props**:
```typescript
interface SavedJobCardProps {
  job: SavedJob;
  collections: Collection[];
  onUpdate: (job: SavedJob) => void;
  onUnsave: (jobId: string) => void;
  onApply: (jobId: string) => void;
}
```

### 3. CollectionManager Component
**Location**: `src/components/saved-jobs/CollectionManager.tsx`
**Purpose**: Manage job collections/folders
**Responsibilities**:
- Display user collections
- Create, rename, delete collections
- Add/remove jobs from collections
- Show collection statistics

**Props**:
```typescript
interface CollectionManagerProps {
  collections: Collection[];
  selectedJobs: string[];
  onCreateCollection: (name: string) => void;
  onUpdateCollection: (id: string, data: Partial<Collection>) => void;
  onMoveJobs: (jobIds: string[], collectionId: string) => void;
}
```

### 4. FilterPanel Component
**Location**: `src/components/saved-jobs/FilterPanel.tsx`
**Purpose**: Provide filtering and search functionality
**Responsibilities**:
- Search saved jobs by multiple criteria
- Filter by collections, status, date ranges
- Sort options (date, salary, relevance)
- Save filter presets

**Props**:
```typescript
interface FilterPanelProps {
  jobs: SavedJob[];
  onFilterChange: (filters: FilterState) => void;
  onSortChange: (sort: SortState) => void;
  filters: FilterState;
  sort: SortState;
}
```

### 5. BulkActions Component
**Location**: `src/components/saved-jobs/BulkActions.tsx`
**Purpose**: Handle operations on multiple selected jobs
**Responsibilities**:
- Select/deselect all jobs
- Bulk move to collections
- Bulk delete unsave
- Bulk export operations
- Bulk status updates

**Props**:
```typescript
interface BulkActionsProps {
  selectedJobs: string[];
  jobs: SavedJob[];
  collections: Collection[];
  onBulkAction: (action: BulkAction, jobIds: string[]) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
}
```

## Data Model

### Database Schema (Existing)
Based on Prisma schema verification:

```prisma
model SavedJob {
  savedJobId      String   @id @default(cuid()) @map("saved_job_id")
  jobSeekerProfileId String @map("jobseeker_profile_id")
  jobId           String   @map("job_id")
  savedAt         DateTime @default(now()) @map("saved_at")
  notes           String?

  // Relationships
  jobSeekerProfile JobSeekerProfile @relation(fields: [jobSeekerProfileId], references: [userUid])
  job             Job              @relation(fields: [jobId], references: [jobId])
}
```

### Extended Data Structures (Client-side)

```typescript
interface Collection {
  id: string;
  name: string;
  description?: string;
  color?: string;
  jobIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface SavedJobWithDetails extends SavedJob {
  job: Job;
  collections: Collection[];
  status: ApplicationStatus;
  notes: string;
  deadline?: Date;
  salaryExpectation?: number;
  tags: string[];
  lastViewedAt?: Date;
}

interface FilterState {
  search: string;
  collections: string[];
  status: ApplicationStatus[];
  dateRange: {
    start: Date;
    end: Date;
  };
  salaryRange: {
    min: number;
    max: number;
  };
  tags: string[];
}

interface SortState {
  field: 'savedAt' | 'deadline' | 'salary' | 'company' | 'title';
  direction: 'asc' | 'desc';
}
```

## API Design

### GET /api/saved-jobs
Retrieve user's saved jobs with optional filtering and pagination.

**Request**:
```typescript
GET /api/saved-jobs?page=1&limit=20&search=engineer&sort=savedAt&direction=desc
```

**Response**:
```typescript
{
  "jobs": SavedJobWithDetails[],
  "collections": Collection[],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  },
  "filters": {
    "availableCollections": Collection[],
    "availableTags": string[]
  }
}
```

### POST /api/saved-jobs
Save a job to user's collection.

**Request**:
```typescript
POST /api/saved-jobs
{
  "jobId": string,
  "collectionId"?: string,
  "notes"?: string,
  "deadline"?: string,
  "status"?: ApplicationStatus,
  "tags"?: string[]
}
```

**Response**:
```typescript
{
  "success": boolean,
  "savedJob": SavedJobWithDetails
}
```

### PUT /api/saved-jobs/[id]
Update saved job details.

**Request**:
```typescript
PUT /api/saved-jobs/[id]
{
  "notes"?: string,
  "status"?: ApplicationStatus,
  "deadline"?: string,
  "tags"?: string[],
  "salaryExpectation"?: number
}
```

### DELETE /api/saved-jobs/[id]
Remove job from saved jobs.

**Response**:
```typescript
{
  "success": boolean
}
```

### Collections API

#### GET /api/saved-jobs/collections
Retrieve user's collections.

#### POST /api/saved-jobs/collections
Create new collection.

#### PUT /api/saved-jobs/collections/[id]
Update collection details.

#### DELETE /api/saved-jobs/collections/[id]
Delete collection.

## State Management

### Global State (TanStack Query)
```typescript
// Saved jobs queries
const useSavedJobs = (filters: FilterState, sort: SortState) =>
  useQuery(['saved-jobs', filters, sort], fetchSavedJobs);

const useCollections = () =>
  useQuery(['collections'], fetchCollections);

// Mutations
const useSaveJob = () =>
  useMutation(saveJob, {
    onSuccess: () => {
      queryClient.invalidateQueries(['saved-jobs']);
    }
  });

const useUpdateSavedJob = () =>
  useMutation(updateSavedJob, {
    onSuccess: () => {
      queryClient.invalidateQueries(['saved-jobs']);
    }
  });
```

### Local State (useState/useReducer)
```typescript
interface SavedJobsState {
  selectedJobs: string[];
  viewMode: 'grid' | 'list';
  showFilters: boolean;
  bulkActionMode: boolean;
  activeFilters: FilterState;
  activeSort: SortState;
}
```

## UI/UX Design

### Layout Structure
```
┌─────────────────────────────────────────────────────────┐
│ Header (Page Title, View Toggle, Bulk Actions)          │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────────────────────────────┐ │
│ │   Filters   │ │                                     │ │
│ │   Panel     │ │          Jobs Grid/List            │ │
│ │             │ │                                     │ │
│ │ - Search    │ │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐    │ │
│ │ - Collections│ │  │Job1 │ │Job2 │ │Job3 │ │Job4 │    │ │
│ │ - Status    │ │  └─────┘ └─────┘ └─────┘ └─────┘    │ │
│ │ - Date      │ │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐    │ │
│ │ - Salary    │ │  │Job5 │ │Job6 │ │Job7 │ │Job8 │    │ │
│ │ - Tags      │ │  └─────┘ └─────┘ └─────┘ └─────┘    │ │
│ │             │ │                                     │ │
│ │ - Sort      │ │            Pagination              │ │
│ └─────────────┘ └─────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Responsive Design Approach
- **Desktop (1024px+)**: Two-column layout with persistent filter panel
- **Tablet (768px-1023px)**: Collapsible filters, 2-3 column job grid
- **Mobile (<768px)**: Single column, filters in modal, list view default

### Loading and Error States
- **Loading**: Skeleton cards for job items, loading spinners for actions
- **Error**: Error boundaries with retry options, empty state illustrations
- **Empty State**: Helpful messaging when no saved jobs exist

## Integration Points

### Jobs Listing Integration
- "Save Job" button in job cards
- Quick save from job details modal
- Navigate to saved jobs from job listing

### Notification System Integration
- Deadline reminders (lines 830-1090 in schema.prisma)
- Job update notifications
- Weekly saved jobs digest
- Application status updates

### Search Integration
- Leverage existing job search infrastructure
- Saved job-specific search filters
- Integration with global search

### Analytics Integration
- Track save/unsave actions
- Collection usage statistics
- Search behavior analytics
- Export usage metrics

## Performance Considerations

### Caching Strategy
- **TanStack Query**: Automatic caching with stale-while-revalidate
- **Local Storage**: Persist filter preferences and view settings
- **Image Optimization**: Lazy loading for company logos
- **Virtual Scrolling**: For large saved job lists (>100 items)

### Optimization Techniques
- **Pagination**: Limit initial load to 20 jobs
- **Selective Refetching**: Only invalidate relevant queries
- **Memoization**: Expensive calculations in useMemo/useCallback
- **Code Splitting**: Lazy load filter panel and bulk actions

## Security Design

### Access Control
- User-specific saved jobs (rows in SavedJob table)
- Collection privacy settings
- Secure API endpoints with session validation

### Data Protection
- Input sanitization for notes and tags
- XSS prevention in job content display
- CSRF protection for API mutations
- Rate limiting for save/unsave actions

## Error Handling and Resilience

### Error Scenarios
- Network failures during save/unsave operations
- Invalid job IDs or deleted jobs
- Collection conflicts or naming issues
- Export generation failures

### Recovery Strategies
- Optimistic updates with rollback on failure
- Retry mechanisms for failed operations
- Graceful degradation for missing data
- User-friendly error messages

## Testing Strategy

### Unit Testing
- Component rendering and interaction
- API client functions
- Filter and sort logic
- State management hooks

### Integration Testing
- API endpoint responses
- Component integration
- Data flow integration
- Error handling flows

### End-to-End Testing
- Complete user workflows
- Critical user paths
- Cross-browser compatibility
- Mobile responsiveness

## Deployment Strategy

### Feature Flags
- Enable/disable saved jobs feature
- New UI components rollout
- Advanced features (collections, bulk actions)
- Analytics and reporting features

### Monitoring
- Component performance metrics
- API response times
- User interaction tracking
- Error rate monitoring

## Open Questions

1. Should collections be shared between users?
2. How to handle deleted jobs that are saved?
3. Should there be a limit on saved jobs per user?
4. Integration with external job boards?
5. Advanced analytics and ML recommendations?