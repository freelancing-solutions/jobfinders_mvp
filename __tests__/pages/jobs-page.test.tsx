import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { JobsPage } from '@/app/jobs/page'
import { useJobSearch } from '@/hooks/use-job-search'
import { jobsAPI } from '@/lib/api/jobs'
import { Job } from '@/types/jobs'

// Mock Next.js router
jest.mock('next/navigation')
const mockPush = jest.fn()
const mockReplace = jest.fn()
const mockBack = jest.fn()
const mockForward = jest.fn()

const mockRouter = {
  push: mockPush,
  replace: mockReplace,
  back: mockBack,
  forward: mockForward,
  refresh: jest.fn(),
  prefetch: jest.fn(),
}

const mockSearchParams = new URLSearchParams('')
const mockPathname = '/jobs'

// Mock hooks
jest.mock('@/hooks/use-job-search')
jest.mock('@/lib/api/jobs')

// Mock components that are not directly tested
jest.mock('@/components/layout/app-layout', () => ({
  AppLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

jest.mock('@/components/jobs/job-grid', () => ({
  JobGrid: ({ jobs, viewMode }: { jobs: Job[]; viewMode?: string }) => (
    <div data-testid="job-grid" data-view-mode={viewMode}>
      {jobs.map((job) => (
        <div key={job.id} data-testid={`job-card-${job.id}`}>
          {job.title}
        </div>
      ))}
    </div>
  )
}))

jest.mock('@/components/jobs/search-history', () => ({
  SearchHistory: ({ onSelect }: { onSelect: Function }) => (
    <div data-testid="search-history">
      <button
        onClick={() => onSelect({ query: 'test job' })}
        data-testid="history-item"
      >
        Test Search History
      </button>
    </div>
  )
}))

const createMockJob = (id: string): Job => ({
  id,
  title: `Software Engineer ${id}`,
  company: {
    id: `company-${id}`,
    name: `Tech Company ${id}`,
    logo: null,
    isVerified: true
  },
  location: 'Cape Town, South Africa',
  description: 'A great software engineering opportunity.',
  requirements: {
    essential: ['JavaScript', 'React'],
    preferred: ['TypeScript']
  },
  salary: {
    min: 500000,
    max: 800000,
    currency: 'ZAR'
  },
  type: 'full-time',
  experience: 'mid',
  remote: true,
  verified: true,
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
  applicationCount: 5,
  tags: ['engineering', 'javascript']
})

const mockJobs: Job[] = [
  createMockJob('1'),
  createMockJob('2'),
  createMockJob('3')
]

const mockSearchResponse = {
  jobs: mockJobs,
  pagination: {
    page: 1,
    limit: 12,
    total: 3,
    totalPages: 1
  },
  facets: {
    categories: [],
    locations: [],
    types: [],
    experience: []
  },
  suggestions: []
}

const mockJobSearchHook = {
  searchState: {
    filters: {
      query: '',
      location: '',
      category: '',
      sortBy: 'relevance',
      sortOrder: 'desc'
    },
    pagination: {
      page: 1,
      limit: 12,
      total: 0,
      totalPages: 0
    },
    view: 'grid',
    isLoading: false,
    error: null,
    results: [],
    hasSearched: false
  },
  hasActiveFilters: false,
  activeFilterCount: 0,
  updateFilters: jest.fn(),
  clearFilters: jest.fn(),
  updatePagination: jest.fn(),
  setView: jest.fn(),
  search: jest.fn(),
  resetSearch: jest.fn(),
  error: null
}

// Setup test environment
beforeEach(() => {
  jest.clearAllMocks()

  ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
  ;(useSearchParams as jest.Mock).mockReturnValue(mockSearchParams)
  ;(usePathname as jest.Mock).mockReturnValue(mockPathname)
  ;(useJobSearch as jest.Mock).mockReturnValue(mockJobSearchHook)
})

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('JobsPage', () => {
  describe('Basic Rendering', () => {
    it('renders the jobs listing page with main elements', () => {
      renderWithQueryClient(<JobsPage />)

      expect(screen.getByText('Find Your Next Opportunity')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Search jobs by title, company, or keywords...')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument()
    })

    it('renders the view toggle buttons', () => {
      renderWithQueryClient(<JobsPage />)

      expect(screen.getByRole('button', { name: '' })).toBeInTheDocument() // Grid view button
      expect(screen.getByRole('button', { name: '' })).toBeInTheDocument() // List view button
    })

    it('renders filters sidebar', () => {
      renderWithQueryClient(<JobsPage />)

      expect(screen.getByText('Filters')).toBeInTheDocument()
      expect(screen.getByText('Location')).toBeInTheDocument()
      expect(screen.getByText('Category')).toBeInTheDocument()
      expect(screen.getByText('Salary Range (ZAR)')).toBeInTheDocument()
      expect(screen.getByText('Experience Level')).toBeInTheDocument()
      expect(screen.getByText('Employment Type')).toBeInTheDocument()
      expect(screen.getByText('Remote work only')).toBeInTheDocument()
      expect(screen.getByText('Sort By')).toBeInTheDocument()
    })

    it('renders search history component', () => {
      renderWithQueryClient(<JobsPage />)

      expect(screen.getByTestId('search-history')).toBeInTheDocument()
    })
  })

  describe('Search Functionality', () => {
    it('allows users to type in the search input', () => {
      renderWithQueryClient(<JobsPage />)

      const searchInput = screen.getByPlaceholderText('Search jobs by title, company, or keywords...')

      fireEvent.change(searchInput, { target: { value: 'Software Engineer' } })
      expect(searchInput).toHaveValue('Software Engineer')
    })

    it('triggers search when Enter key is pressed', () => {
      renderWithQueryClient(<JobsPage />)

      const searchInput = screen.getByPlaceholderText('Search jobs by title, company, or keywords...')

      fireEvent.change(searchInput, { target: { value: 'Software Engineer' } })
      fireEvent.keyDown(searchInput, { key: 'Enter' })

      expect(mockJobSearchHook.search).toHaveBeenCalledWith(true)
    })

    it('triggers search when search button is clicked', () => {
      renderWithQueryClient(<JobsPage />)

      const searchButton = screen.getByRole('button', { name: 'Search' })
      fireEvent.click(searchButton)

      expect(mockJobSearchHook.search).toHaveBeenCalledWith(true)
    })

    it('displays loading state during search', () => {
      ;(useJobSearch as jest.Mock).mockReturnValue({
        ...mockJobSearchHook,
        searchState: {
          ...mockJobSearchHook.searchState,
          isLoading: true
        }
      })

      renderWithQueryClient(<JobsPage />)

      // Check for loading skeleton elements
      expect(document.querySelectorAll('.animate-pulse')).toHaveLength(6)
    })
  })

  describe('Filter Functionality', () => {
    it('allows users to set location filter', () => {
      renderWithQueryClient(<JobsPage />)

      const locationInput = screen.getByPlaceholderText('City or province')
      fireEvent.change(locationInput, { target: { value: 'Cape Town' } })

      expect(mockJobSearchHook.updateFilters).toHaveBeenCalledWith({
        location: 'Cape Town'
      })
    })

    it('allows users to select category filter', () => {
      renderWithQueryClient(<JobsPage />)

      const categorySelect = screen.getByDisplayValue('All Categories')
      fireEvent.change(categorySelect, { target: { value: 'Engineering' } })

      expect(mockJobSearchHook.updateFilters).toHaveBeenCalledWith({
        category: 'Engineering'
      })
    })

    it('allows users to set salary range', () => {
      renderWithQueryClient(<JobsPage />)

      const minSalaryInput = screen.getByPlaceholderText('Min salary')
      const maxSalaryInput = screen.getByPlaceholderText('Max salary')

      fireEvent.change(minSalaryInput, { target: { value: '300000' } })
      fireEvent.change(maxSalaryInput, { target: { value: '600000' } })

      expect(mockJobSearchHook.updateFilters).toHaveBeenCalledWith({
        salaryMin: 300000
      })
      expect(mockJobSearchHook.updateFilters).toHaveBeenCalledWith({
        salaryMax: 600000
      })
    })

    it('allows users to select experience level', () => {
      renderWithQueryClient(<JobsPage />)

      const experienceSelect = screen.getByDisplayValue('All Levels')
      fireEvent.change(experienceSelect, { target: { value: 'mid' } })

      expect(mockJobSearchHook.updateFilters).toHaveBeenCalledWith({
        experience: 'mid'
      })
    })

    it('allows users to toggle remote work filter', () => {
      renderWithQueryClient(<JobsPage />)

      const remoteCheckbox = screen.getByLabelText('Remote work only')
      fireEvent.click(remoteCheckbox)

      expect(mockJobSearchHook.updateFilters).toHaveBeenCalledWith({
        remote: true
      })
    })

    it('allows users to clear all filters', () => {
      renderWithQueryClient(<JobsPage />)

      const clearButton = screen.getByText('Clear all')
      fireEvent.click(clearButton)

      expect(mockJobSearchHook.clearFilters).toHaveBeenCalled()
    })
  })

  describe('Results Display', () => {
    it('displays jobs when search results are available', () => {
      ;(useJobSearch as jest.Mock).mockReturnValue({
        ...mockJobSearchHook,
        searchState: {
          ...mockJobSearchHook.searchState,
          results: mockJobs,
          hasSearched: true,
          pagination: {
            page: 1,
            limit: 12,
            total: 3,
            totalPages: 1
          }
        }
      })

      renderWithQueryClient(<JobsPage />)

      expect(screen.getByTestId('job-grid')).toBeInTheDocument()
      expect(screen.getByTestId('job-card-1')).toBeInTheDocument()
      expect(screen.getByTestId('job-card-2')).toBeInTheDocument()
      expect(screen.getByTestId('job-card-3')).toBeInTheDocument()
    })

    it('displays empty state when no jobs found', () => {
      ;(useJobSearch as jest.Mock).mockReturnValue({
        ...mockJobSearchHook,
        searchState: {
          ...mockJobSearchHook.searchState,
          results: [],
          hasSearched: true
        }
      })

      renderWithQueryClient(<JobsPage />)

      expect(screen.getByText('No jobs found')).toBeInTheDocument()
      expect(screen.getByText('Try adjusting your search filters or browse all available positions.')).toBeInTheDocument()
    })

    it('displays error state when search fails', () => {
      ;(useJobSearch as jest.Mock).mockReturnValue({
        ...mockJobSearchHook,
        error: new Error('Search failed')
      })

      renderWithQueryClient(<JobsPage />)

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(screen.getByText('Search failed')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument()
    })

    it('displays pagination when multiple pages exist', () => {
      ;(useJobSearch as jest.Mock).mockReturnValue({
        ...mockJobSearchHook,
        searchState: {
          ...mockJobSearchHook.searchState,
          results: mockJobs,
          hasSearched: true,
          pagination: {
            page: 1,
            limit: 12,
            total: 50,
            totalPages: 5
          }
        }
      })

      renderWithQueryClient(<JobsPage />)

      expect(screen.getByText('Showing 1 to 3 of 50 jobs')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Previous' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument()
    })
  })

  describe('View Modes', () => {
    it('allows users to switch between grid and list views', () => {
      renderWithQueryClient(<JobsPage />)

      const gridButton = screen.getAllByRole('button')[0] // First button should be grid view
      const listButton = screen.getAllByRole('button')[1] // Second button should be list view

      fireEvent.click(listButton)
      expect(mockJobSearchHook.setView).toHaveBeenCalledWith('list')

      fireEvent.click(gridButton)
      expect(mockJobSearchHook.setView).toHaveBeenCalledWith('grid')
    })
  })

  describe('Search History Integration', () => {
    it('allows users to select from search history', () => {
      renderWithQueryClient(<JobsPage />)

      const historyItem = screen.getByTestId('history-item')
      fireEvent.click(historyItem)

      expect(mockJobSearchHook.updateFilters).toHaveBeenCalledWith({ query: 'test job' })
      expect(mockJobSearchHook.search).toHaveBeenCalledWith(true)
    })
  })

  describe('Active Filters Display', () => {
    it('displays active filter badges', () => {
      ;(useJobSearch as jest.Mock).mockReturnValue({
        ...mockJobSearchHook,
        searchState: {
          ...mockJobSearchHook.searchState,
          filters: {
            query: 'Software Engineer',
            location: 'Cape Town',
            remote: true
          }
        },
        hasActiveFilters: true,
        activeFilterCount: 3
      })

      renderWithQueryClient(<JobsPage />)

      expect(screen.getByText('3 filters active')).toBeInTheDocument()
      expect(screen.getByText('Cape Town')).toBeInTheDocument()
      expect(screen.getByText('Remote')).toBeInTheDocument()
    })

    it('allows users to remove individual filters', () => {
      ;(useJobSearch as jest.Mock).mockReturnValue({
        ...mockJobSearchHook,
        searchState: {
          ...mockJobSearchHook.searchState,
          filters: {
            location: 'Cape Town'
          }
        },
        hasActiveFilters: true,
        activeFilterCount: 1
      })

      renderWithQueryClient(<JobsPage />)

      const removeButton = screen.getByText('×')
      fireEvent.click(removeButton)

      expect(mockJobSearchHook.updateFilters).toHaveBeenCalledWith({ location: undefined })
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      renderWithQueryClient(<JobsPage />)

      const searchInput = screen.getByRole('textbox')
      expect(searchInput).toHaveAccessibleName()

      const searchButton = screen.getByRole('button', { name: 'Search' })
      expect(searchButton).toBeInTheDocument()

      const filtersButton = screen.getByRole('button', { name: /filters/i })
      expect(filtersButton).toBeInTheDocument()
    })

    it('supports keyboard navigation', () => {
      renderWithQueryClient(<JobsPage />)

      const searchInput = screen.getByPlaceholderText('Search jobs by title, company, or keywords...')

      searchInput.focus()
      expect(searchInput).toHaveFocus()

      fireEvent.keyDown(searchInput, { key: 'Enter' })
      expect(mockJobSearchHook.search).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('handles API errors gracefully', () => {
      ;(useJobSearch as jest.Mock).mockReturnValue({
        ...mockJobSearchHook,
        error: new Error('API Error: Failed to fetch jobs')
      })

      renderWithQueryClient(<JobsPage />)

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(screen.getByText('API Error: Failed to fetch jobs')).toBeInTheDocument()
    })

    it('allows retry after error', () => {
      ;(useJobSearch as jest.Mock).mockReturnValue({
        ...mockJobSearchHook,
        error: new Error('Network error')
      })

      renderWithQueryClient(<JobsPage />)

      const retryButton = screen.getByRole('button', { name: 'Try Again' })
      fireEvent.click(retryButton)

      expect(mockJobSearchHook.search).toHaveBeenCalled()
    })
  })

  describe('Responsive Design', () => {
    it('shows mobile filters button on small screens', () => {
      // Mock window.innerWidth to simulate mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 640,
      })

      renderWithQueryClient(<JobsPage />)

      expect(screen.getByText('Filters')).toBeInTheDocument()
    })
  })
})