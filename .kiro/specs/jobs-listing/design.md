# Design: Jobs Listing Page

## Architecture Context

### System Position
```
Home Page
    ↓
→ Jobs Listing Page ←
    ↓
  Job Details Page
```

### Existing Components to Reuse
- `JobCard` - Located in `/src/components/jobs/job-card.tsx`
- `JobSearch` - Located in `/src/components/jobs/job-search.tsx`
- `JobGrid` - Located in `/src/components/jobs/job-grid.tsx`
- `AppLayout` - Main layout wrapper with navigation

### Existing Patterns to Follow
- **API Integration**: Follow pattern from dashboard page with Promise.all for parallel requests
- **Loading States**: Use skeleton components from existing dashboard implementation
- **Error Handling**: Follow Alert component pattern from dashboard
- **Responsive Design**: Use existing Tailwind CSS classes and breakpoints

## Component Design

### New Components

#### JobsListingPage
**File:** `src/app/jobs/page.tsx`

**Responsibilities:**
- Main page container with search and filters
- State management for search parameters
- API integration for job data
- URL synchronization for shareable searches

**Props Interface:**
```typescript
interface JobsListingPageProps {
  searchParams: {
    q?: string;
    location?: string;
    category?: string;
    salaryMin?: string;
    salaryMax?: string;
    experience?: string;
    type?: string;
    remote?: string;
    sort?: string;
    page?: string;
  }
}
```

**Integration:**
- Used by: Next.js page router
- Uses: JobSearch, JobGrid, FilterPanel
- Triggers: Search API calls, filter updates
- Consumes: Job search API, categories API

**Styling:**
- Follows: Existing page layout patterns
- Classes: Tailwind utility classes, responsive design

#### FilterPanel
**File:** `src/components/jobs/filter-panel.tsx`

**Responsibilities:**
- Comprehensive filtering interface
- State management for filter values
- URL parameter synchronization
- Mobile-responsive collapsible design

**Props Interface:**
```typescript
interface FilterPanelProps {
  filters: JobFilters;
  categories: JobCategory[];
  onFiltersChange: (filters: JobFilters) => void;
  isOpen: boolean;
  onToggle: () => void;
}

interface JobFilters {
  query: string;
  location: string;
  categories: string[];
  salaryMin: number;
  salaryMax: number;
  experience: string;
  employmentType: string;
  remoteWork: boolean;
  datePosted: string;
}
```

**Integration:**
- Used by: JobsListingPage
- Uses: Button, Input, Select, Checkbox components
- Triggers: Filter change events
- Consumes: Job categories data

#### SearchHeader
**File:** `src/components/jobs/search-header.tsx`

**Responsibilities:**
- Search input and quick filters
- Results count and sorting options
- View mode toggle (grid/list)
- Mobile search toggle

**Props Interface:**
```typescript
interface SearchHeaderProps {
  query: string;
  resultCount: number;
  viewMode: 'grid' | 'list';
  sortBy: string;
  onQueryChange: (query: string) => void;
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onSortChange: (sort: string) => void;
  onMobileSearchToggle: () => void;
}
```

**Integration:**
- Used by: JobsListingPage
- Uses: Input, Button, Select components
- Triggers: Search events, sort changes
- Consumes: Search state

### Modified Components
- **JobCard**: Enhance with quick actions (save, apply)
- **JobSearch**: Integrate with page-level search state
- **AppLayout**: Add breadcrumbs for jobs navigation

## Data Models

### New Types
```typescript
interface JobSearchResult {
  jobs: Job[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  facets: {
    categories: CategoryFacet[];
    locations: LocationFacet[];
    companies: CompanyFacet[];
    salaryRanges: SalaryFacet[];
  };
}

interface CategoryFacet {
  id: string;
  name: string;
  count: number;
  selected: boolean;
}

interface SearchFilters {
  query: string;
  location: string;
  categoryIds: string[];
  salaryMin?: number;
  salaryMax?: number;
  experienceLevel?: string;
  employmentType?: string;
  remoteWork?: boolean;
  datePosted?: string;
  sortBy: 'relevance' | 'date' | 'salary';
  page: number;
  limit: number;
}
```

### Extended Types
```typescript
// Extending existing Job interface
interface EnhancedJob extends Job {
  isSaved: boolean;
  hasApplied: boolean;
  matchScore?: number;
  isNew: boolean;
  isUrgent: boolean;
  companyLogo?: string;
  companyRating?: number;
}
```

## State Management

### Local State
- **Search Query**: Current search string
- **Filters**: Active filter configuration
- **Results**: Job listings and metadata
- **Loading**: Various loading states
- **View Mode**: Grid vs list display
- **Mobile States**: Filter panel open/close

### Global State
**Store/Context:** No global state needed for this feature
```typescript
// Local component state using useState and useEffect
const [searchState, setSearchState] = useState<SearchState>({
  query: '',
  filters: defaultFilters,
  results: [],
  loading: false,
  viewMode: 'grid'
});
```

**Integration with existing state:**
- Reads from: URL search parameters
- Updates: URL history for shareable links
- Triggers: API calls for data fetching

## Routing

### New Routes
```typescript
{
  path: '/jobs',
  component: JobsListingPage,
  auth: false, // Public access
  layout: 'main',
  searchParams: {
    q: string,
    location: string,
    category: string,
    // ... other filter parameters
  }
}
```

### Route Guards
- No authentication required for basic browsing
- Enhanced features for authenticated users
- Rate limiting for search requests

## API Integration

### Existing API Service
**Service:** `/src/app/api/jobs/search/route.ts`

**New Methods:**
```typescript
// Enhanced search with faceted navigation
async searchJobs(params: SearchFilters): Promise<JobSearchResult>

// Autocomplete suggestions
async getSearchSuggestions(query: string): Promise<string[]>

// Popular searches
async getPopularSearches(): Promise<string[]>
```

### Error Handling
- Follow pattern in: Dashboard component error handling
- Error states: Network errors, no results, invalid parameters
- Loading states: Skeletons, spinners, progress indicators
- Retry logic: Failed search requests

## Navigation Integration

### Menu Entry
**File:** `/src/components/layout/navigation-header.tsx`
```typescript
{
  href: '/jobs',
  label: 'Find Jobs',
  icon: FileText,
  order: 2,
  condition: null // Public access
}
```

### Breadcrumbs
**File:** `src/components/jobs/job-breadcrumbs.tsx` (new)
```typescript
interface BreadcrumbItem {
  label: string;
  href?: string;
}

const breadcrumbs: BreadcrumbItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Jobs', href: '/jobs' },
  // Dynamic breadcrumbs for filters
];
```

## Performance Considerations

### Lazy Loading Strategy
- **Job Cards**: Virtual scrolling for large result sets
- **Images**: Lazy loading for company logos
- **Filters**: Load categories on demand
- **Search Suggestions**: Debounced API calls

### Caching Approach
- **Search Results**: Cache for 5 minutes
- **Categories**: Cache for 1 hour
- **Popular Searches**: Cache for 30 minutes
- **User Preferences**: Local storage

### Optimization Techniques
- **Debounced Search**: 300ms delay for search input
- **Virtual Scrolling**: For large result sets
- **Image Optimization**: WebP format, responsive images
- **Bundle Splitting**: Lazy load filter components

## Security Considerations

### Authentication Flow
- Public access for basic browsing
- Enhanced features require authentication
- User preferences saved per authenticated user

### Authorization Checks
- Save job functionality requires login
- Application history for authenticated users
- Personalized recommendations for logged-in users

### Data Validation
- Search query sanitization
- Filter parameter validation
- URL parameter parsing safety
- XSS prevention in search results

## Testing Strategy

### Unit Tests
- **Search Component**: Input handling, debouncing
- **Filter Panel**: State management, validation
- **Job Card**: Rendering, interactions
- **API Integration**: Mock responses, error handling

### Integration Tests
- **Search Workflow**: End-to-end search flow
- **Filter Combinations**: Multiple filter scenarios
- **URL Synchronization**: Search parameters in URL
- **Authentication Integration**: Enhanced features

### E2E Tests
- **User Journeys**: Search → Filter → Apply
- **Mobile Experience**: Responsive design testing
- **Performance**: Load time, interaction speed
- **Accessibility**: Screen reader, keyboard navigation

## Migration/Compatibility

### Backward Compatibility
- Existing API endpoints remain unchanged
- Current job components enhanced, not replaced
- Navigation structure maintained
- User data preserved

### Data Migration
- No database schema changes required
- Existing job data compatible
- User preferences storage (new feature)
- Search analytics collection (new feature)

### Feature Flags
- Gradual rollout of new features
- A/B testing capability
- Performance monitoring
- User feedback collection

## Responsive Design

### Mobile (< 768px)
- Full-width job cards
- Collapsible filter panel
- Bottom search bar
- Swipe gestures for filters
- Touch-optimized interactions

### Tablet (768px - 1024px)
- Side-by-side layout
- Persistent filter panel
- Grid view default
- Touch and mouse interactions
- Optimized spacing

### Desktop (> 1024px)
- Three-column layout
- Sticky filter sidebar
- Grid/list view toggle
- Hover states and tooltips
- Keyboard shortcuts

## Accessibility Features

### Screen Reader Support
- Semantic HTML5 structure
- ARIA labels and descriptions
- Live regions for search results
- Focus management
- Skip navigation links

### Keyboard Navigation
- Tab order logical
- Enter/space for actions
- Escape to close filters
- Arrow keys for list navigation
- Shortcuts for power users

### Visual Accessibility
- High contrast mode
- Text scaling support
- Color blindness friendly
- Clear visual hierarchy
- Consistent spacing

---

## Component Hierarchy

```
JobsListingPage
├── SearchHeader
│   ├── SearchInput
│   ├── QuickFilters
│   └── ViewControls
├── FilterPanel (collapsible)
│   ├── LocationFilter
│   ├── CategoryFilter
│   ├── SalaryFilter
│   ├── ExperienceFilter
│   └── EmploymentTypeFilter
├── ResultsHeader
│   ├── ResultsCount
│   ├── SortOptions
│   └── Pagination
├── JobGrid
│   └── JobCard[]
│       ├── JobInfo
│       ├── CompanyInfo
│       ├── SalaryInfo
│       └── ActionButtons
└── Pagination
    ├── PreviousButton
    ├── PageNumbers
    └── NextButton
```

## State Flow Diagram

```
URL Parameters
    ↓
Search State
    ↓
API Request
    ↓
Search Results
    ↓
Job Grid Render
    ↓
User Interactions
    ↓
State Update
    ↓
URL Update
```