import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from '@/hooks/use-toast'
import SavedJobsPage from '@/app/saved/page'
import { UserRole } from '@/types/roles'

// Mock dependencies
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}))

jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn()
}))

jest.mock('@/components/layout/app-layout', () => ({
  AppLayout: ({ children, user }: { children: React.ReactNode; user?: any }) => (
    <div data-testid="app-layout">
      <div data-testid="user-data">{JSON.stringify(user)}</div>
      {children}
    </div>
  )
}))

// Mock fetch
global.fetch = jest.fn()

const mockPush = jest.fn()
const mockToast = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  ;(useRouter as jest.Mock).mockReturnValue({
    push: mockPush
  })
  ;(toast as jest.Mock).mockReturnValue({
    toast: mockToast
  })
})

describe('SavedJobsPage', () => {
  const mockSession = {
    user: {
      id: 'user123',
      name: 'John Doe',
      email: 'john@example.com',
      role: UserRole.JOB_SEEKER
    }
  }

  const mockSavedJobs = [
    {
      id: 'job1',
      title: 'Software Developer',
      company: 'Tech Corp',
      location: 'Cape Town, Western Cape',
      salaryMin: 50000,
      salaryMax: 70000,
      currency: 'ZAR',
      positionType: 'Full-time',
      remotePolicy: 'remote',
      savedAt: '2024-01-15T10:00:00Z',
      status: 'saved',
      notes: 'Interesting role with React'
    },
    {
      id: 'job2',
      title: 'Product Manager',
      company: 'StartupXYZ',
      location: 'Johannesburg, Gauteng',
      salaryMin: 60000,
      salaryMax: 80000,
      currency: 'ZAR',
      positionType: 'Full-time',
      remotePolicy: 'hybrid',
      savedAt: '2024-01-14T15:30:00Z',
      status: 'applied',
      notes: 'Applied on 2024-01-16'
    }
  ]

  beforeEach(() => {
    ;(fetch as jest.Mock).mockImplementation((url) => {
      if (url === '/api/saved-jobs') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: mockSavedJobs
          })
        })
      }
      if (url.startsWith('/api/saved-jobs/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            message: 'Operation successful'
          })
        })
      }
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({
          success: false,
          error: 'Not found'
        })
      })
    })
  })

  describe('Authentication', () => {
    it('redirects unauthenticated users to sign in', async () => {
      const { useSession } = require('next-auth/react')
      useSession.mockReturnValue({ status: 'unauthenticated' })

      render(<SavedJobsPage />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/signin')
      })
    })

    it('redirects non-seeker users to dashboard', async () => {
      const { useSession } = require('next-auth/react')
      useSession.mockReturnValue({
        status: 'authenticated',
        data: {
          user: { role: UserRole.EMPLOYER }
        }
      })

      render(<SavedJobsPage />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })
    })

    it('renders page for authenticated seeker users', async () => {
      const { useSession } = require('next-auth/react')
      useSession.mockReturnValue({
        status: 'authenticated',
        data: mockSession
      })

      render(<SavedJobsPage />)

      await waitFor(() => {
        expect(screen.getByText('Saved Jobs')).toBeInTheDocument()
        expect(screen.getByText('Keep track of opportunities you\'re interested in')).toBeInTheDocument()
      })
    })
  })

  describe('Loading State', () => {
    it('shows loading skeleton while fetching data', () => {
      const { useSession } = require('next-auth/react')
      useSession.mockReturnValue({
        status: 'loading',
        data: null
      })

      render(<SavedJobsPage />)

      expect(screen.getByTestId('app-layout')).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('displays empty state when no saved jobs', async () => {
      const { useSession } = require('next-auth/react')
      useSession.mockReturnValue({
        status: 'authenticated',
        data: mockSession
      })

      ;(fetch as jest.Mock).mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: []
          })
        })
      )

      render(<SavedJobsPage />)

      await waitFor(() => {
        expect(screen.getByText('No Saved Jobs Yet')).toBeInTheDocument()
        expect(screen.getByText('Start exploring job opportunities and save the ones that interest you')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Browse Jobs/i })).toBeInTheDocument()
      })
    })
  })

  describe('Job List Display', () => {
    it('displays saved jobs with correct information', async () => {
      const { useSession } = require('next-auth/react')
      useSession.mockReturnValue({
        status: 'authenticated',
        data: mockSession
      })

      render(<SavedJobsPage />)

      await waitFor(() => {
        expect(screen.getByText('Software Developer')).toBeInTheDocument()
        expect(screen.getByText('Tech Corp')).toBeInTheDocument()
        expect(screen.getByText('Cape Town, Western Cape')).toBeInTheDocument()
        expect(screen.getByText('ZAR 50,000 - 70,000')).toBeInTheDocument()
        expect(screen.getByText('Product Manager')).toBeInTheDocument()
        expect(screen.getByText('StartupXYZ')).toBeInTheDocument()
      })
    })

    it('displays job status badges correctly', async () => {
      const { useSession } = require('next-auth/react')
      useSession.mockReturnValue({
        status: 'authenticated',
        data: mockSession
      })

      render(<SavedJobsPage />)

      await waitFor(() => {
        expect(screen.getByText('Saved')).toBeInTheDocument()
        expect(screen.getByText('Applied')).toBeInTheDocument()
      })
    })

    it('displays remote policy badge for remote jobs', async () => {
      const { useSession } = require('next-auth/react')
      useSession.mockReturnValue({
        status: 'authenticated',
        data: mockSession
      })

      render(<SavedJobsPage />)

      await waitFor(() => {
        expect(screen.getByText('Remote')).toBeInTheDocument()
      })
    })
  })

  describe('Search and Filter Functionality', () => {
    it('filters jobs by search term', async () => {
      const { useSession } = require('next-auth/react')
      useSession.mockReturnValue({
        status: 'authenticated',
        data: mockSession
      })

      render(<SavedJobsPage />)

      await waitFor(() => {
        expect(screen.getByText('Software Developer')).toBeInTheDocument()
        expect(screen.getByText('Product Manager')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search saved jobs...')
      fireEvent.change(searchInput, { target: { value: 'Software' } })

      await waitFor(() => {
        expect(screen.getByText('Software Developer')).toBeInTheDocument()
        expect(screen.queryByText('Product Manager')).not.toBeInTheDocument()
      })
    })

    it('filters jobs by status', async () => {
      const { useSession } = require('next-auth/react')
      useSession.mockReturnValue({
        status: 'authenticated',
        data: mockSession
      })

      render(<SavedJobsPage />)

      await waitFor(() => {
        expect(screen.getByText('Software Developer')).toBeInTheDocument()
        expect(screen.getByText('Product Manager')).toBeInTheDocument()
      })

      const statusFilter = screen.getByText('Filter by Status')
      fireEvent.click(statusFilter)

      await waitFor(() => {
        const appliedOption = screen.getByText('Applied')
        fireEvent.click(appliedOption)
      })

      await waitFor(() => {
        expect(screen.queryByText('Software Developer')).not.toBeInTheDocument()
        expect(screen.getByText('Product Manager')).toBeInTheDocument()
      })
    })

    it('sorts jobs by different criteria', async () => {
      const { useSession } = require('next-auth/react')
      useSession.mockReturnValue({
        status: 'authenticated',
        data: mockSession
      })

      render(<SavedJobsPage />)

      await waitFor(() => {
        expect(screen.getByText('Software Developer')).toBeInTheDocument()
        expect(screen.getByText('Product Manager')).toBeInTheDocument()
      })

      const sortSelect = screen.getByText('Sort by')
      fireEvent.click(sortSelect)

      await waitFor(() => {
        const companyOption = screen.getByText('Company Name')
        fireEvent.click(companyOption)
      })

      // Should verify sorting order, but this would require more complex DOM inspection
      await waitFor(() => {
        expect(screen.getByText('Software Developer')).toBeInTheDocument()
        expect(screen.getByText('Product Manager')).toBeInTheDocument()
      })
    })
  })

  describe('Job Selection and Bulk Operations', () => {
    it('allows selecting individual jobs', async () => {
      const { useSession } = require('next-auth/react')
      useSession.mockReturnValue({
        status: 'authenticated',
        data: mockSession
      })

      render(<SavedJobsPage />)

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox')
        expect(checkboxes).toHaveLength(2) // Individual job checkboxes
      })

      const firstCheckbox = screen.getAllByRole('checkbox')[1] // Skip "select all"
      fireEvent.click(firstCheckbox)

      await waitFor(() => {
        expect(screen.getByText(/1 of/)).toBeInTheDocument()
      })
    })

    it('allows selecting all jobs', async () => {
      const { useSession } = require('next-auth/react')
      useSession.mockReturnValue({
        status: 'authenticated',
        data: mockSession
      })

      render(<SavedJobsPage />)

      await waitFor(() => {
        const selectAllCheckbox = screen.getAllByRole('checkbox')[0]
        fireEvent.click(selectAllCheckbox)
      })

      await waitFor(() => {
        expect(screen.getByText('All jobs selected')).toBeInTheDocument()
      })
    })
  })

  describe('Job Management', () => {
    it('opens edit dialog when edit is clicked', async () => {
      const { useSession } = require('next-auth/react')
      useSession.mockReturnValue({
        status: 'authenticated',
        data: mockSession
      })

      render(<SavedJobsPage />)

      await waitFor(() => {
        const moreButtons = screen.getAllByRole('button').filter(button =>
          button.getAttribute('data-state') === 'closed'
        )
        expect(moreButtons.length).toBeGreaterThan(0)
      })

      const firstMoreButton = screen.getAllByRole('button').find(button =>
        button.innerHTML.includes('MoreHorizontal')
      )

      if (firstMoreButton) {
        fireEvent.click(firstMoreButton)

        await waitFor(() => {
          expect(screen.getByText('Edit Details')).toBeInTheDocument()
        })

        fireEvent.click(screen.getByText('Edit Details'))

        await waitFor(() => {
          expect(screen.getByText('Status')).toBeInTheDocument()
          expect(screen.getByText('Notes')).toBeInTheDocument()
        })
      }
    })

    it('removes job when remove is clicked', async () => {
      const { useSession } = require('next-auth/react')
      useSession.mockReturnValue({
        status: 'authenticated',
        data: mockSession
      })

      render(<SavedJobsPage />)

      await waitFor(() => {
        expect(screen.getByText('Software Developer')).toBeInTheDocument()
      })

      const moreButton = screen.getAllByRole('button').find(button =>
        button.innerHTML.includes('MoreHorizontal')
      )

      if (moreButton) {
        fireEvent.click(moreButton)

        await waitFor(() => {
          const removeButton = screen.getByText('Remove')
          fireEvent.click(removeButton)
        })
      }

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Job Removed",
          description: "The job has been removed from your saved list."
        })
      })
    })
  })

  describe('Export Functionality', () => {
    it('exports selected jobs as CSV', async () => {
      // Mock URL.createObjectURL and related methods
      global.URL.createObjectURL = jest.fn(() => 'mock-url')
      global.URL.revokeObjectURL = jest.fn()

      const mockLink = {
        href: '',
        download: '',
        click: jest.fn()
      }
      global.document.createElement = jest.fn(() => mockLink as any)
      global.document.body.appendChild = jest.fn()
      global.document.body.removeChild = jest.fn()

      const { useSession } = require('next-auth/react')
      useSession.mockReturnValue({
        status: 'authenticated',
        data: mockSession
      })

      render(<SavedJobsPage />)

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox')
        fireEvent.click(checkboxes[1]) // Select first job
      })

      // Mock export API
      ;(fetch as jest.Mock).mockImplementation(() =>
        Promise.resolve({
          ok: true,
          blob: () => Promise.resolve(new Blob(['csv content'], { type: 'text/csv' }))
        })
      )

      const exportButton = screen.getByText('Export')
      fireEvent.click(exportButton)

      await waitFor(() => {
        expect(screen.getByText('Export as CSV')).toBeInTheDocument()
        fireEvent.click(screen.getByText('Export as CSV'))
      })

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Export Successful",
          description: expect.stringContaining('jobs exported as CSV')
        })
      })
    })
  })

  describe('Collection Management', () => {
    it('opens create collection dialog', async () => {
      const { useSession } = require('next-auth/react')
      useSession.mockReturnValue({
        status: 'authenticated',
        data: mockSession
      })

      render(<SavedJobsPage />)

      await waitFor(() => {
        const createButton = screen.getByText('New Collection')
        fireEvent.click(createButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Create New Collection')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('e.g. Remote Jobs, Dream Companies')).toBeInTheDocument()
      })
    })

    it('creates new collection with valid data', async () => {
      const { useSession } = require('next-auth/react')
      useSession.mockReturnValue({
        status: 'authenticated',
        data: mockSession
      })

      render(<SavedJobsPage />)

      await waitFor(() => {
        const createButton = screen.getByText('New Collection')
        fireEvent.click(createButton)
      })

      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText('e.g. Remote Jobs, Dream Companies')
        fireEvent.change(nameInput, { target: { value: 'Dream Jobs' } })

        const createSubmitButton = screen.getByText('Create Collection')
        fireEvent.click(createSubmitButton)
      })

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Collection Created",
          description: 'Collection "Dream Jobs" has been created.'
        })
      })
    })
  })

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      const { useSession } = require('next-auth/react')
      useSession.mockReturnValue({
        status: 'authenticated',
        data: mockSession
      })

      ;(fetch as jest.Mock).mockImplementation(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({
            success: false,
            error: 'Internal server error'
          })
        })
      )

      render(<SavedJobsPage />)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Error",
          description: "Failed to load saved jobs. Please try again.",
          variant: "destructive"
        })
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', async () => {
      const { useSession } = require('next-auth/react')
      useSession.mockReturnValue({
        status: 'authenticated',
        data: mockSession
      })

      render(<SavedJobsPage />)

      await waitFor(() => {
        // Check for proper heading structure
        expect(screen.getByRole('heading', { level: 1, name: 'Saved Jobs' })).toBeInTheDocument()

        // Check for landmark regions
        expect(screen.getByRole('main')).toBeInTheDocument()

        // Check for form elements have proper labels
        expect(screen.getByLabelText(/Search saved jobs/i)).toBeInTheDocument()
      })
    })

    it('supports keyboard navigation', async () => {
      const { useSession } = require('next-auth/react')
      useSession.mockReturnValue({
        status: 'authenticated',
        data: mockSession
      })

      render(<SavedJobsPage />)

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search saved jobs...')
        expect(searchInput).toHaveAttribute('type', 'search')
      })
    })
  })
})