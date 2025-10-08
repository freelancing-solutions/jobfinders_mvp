import { render, screen, waitFor } from '@testing-library/react'
import { ApplicationsPage } from '@/app/applications/page'
import { useApplications } from '@/hooks/use-applications'
import { useSession } from 'next-auth/react'

// Mock the hooks
jest.mock('@/hooks/use-applications')
jest.mock('next-auth/react')
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

// Mock the child components
jest.mock('@/components/applications/ApplicationList/ApplicationGrid', () => ({
  ApplicationGrid: ({ applications, loading }: any) => (
    <div data-testid="application-grid">
      {loading ? 'Loading...' : `${applications.length} applications`}
    </div>
  ),
}))

jest.mock('@/components/applications/application-stats', () => ({
  ApplicationStats: ({ stats, loading }: any) => (
    <div data-testid="application-stats">
      {loading ? 'Loading stats...' : `Total: ${stats?.total || 0}`}
    </div>
  ),
}))

const mockSession = {
  data: {
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      role: 'SEEKER',
    },
  },
  status: 'authenticated',
}

const mockApplications = [
  {
    id: '1',
    jobId: 'job-1',
    userId: 'test-user-id',
    status: 'applied',
    appliedAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    job: {
      id: 'job-1',
      title: 'Software Engineer',
      company: {
        id: 'company-1',
        name: 'Tech Corp',
        logo: 'logo.png',
        location: 'San Francisco, CA',
      },
      location: 'San Francisco, CA',
      salaryMin: 80000,
      salaryMax: 120000,
      currency: 'USD',
      positionType: 'Full-time',
      remotePolicy: 'Remote',
      description: 'Test job description',
      requirements: ['React', 'TypeScript'],
      isFeatured: false,
      isUrgent: false,
      postedAt: '2024-01-10T10:00:00Z',
      expiresAt: '2024-02-10T10:00:00Z',
      applicationCount: 5,
    },
    coverLetter: 'Test cover letter',
    matchScore: 85,
  },
]

const mockStats = {
  total: 1,
  active: 1,
  archived: 0,
  byStatus: {
    applied: 1,
    reviewing: 0,
    shortlisted: 0,
    interview_scheduled: 0,
    interview_completed: 0,
    offered: 0,
    rejected: 0,
    withdrawn: 0,
    hired: 0,
    archived: 0,
  },
  byCompany: [],
  byTimePeriod: [],
  responseMetrics: {
    averageResponseTime: 0,
    responseRate: 0,
    interviewRate: 0,
    offerRate: 0,
  },
  topSkills: [],
  salaryInsights: {
    averageMin: 0,
    median: 0,
    marketRate: 0,
  },
}

describe('ApplicationsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useSession as jest.Mock).mockReturnValue(mockSession)
    ;(useApplications as jest.Mock).mockReturnValue({
      applications: mockApplications,
      stats: mockStats,
      loading: false,
      error: null,
      hasActiveFilters: false,
      activeFilterCount: 0,
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
      filters: {},
      updateFilters: jest.fn(),
      clearFilters: jest.fn(),
      updatePagination: jest.fn(),
      setView: jest.fn(),
      refresh: jest.fn(),
      search: jest.fn(),
      exportApplications: jest.fn(),
    })
  })

  it('renders the applications page correctly', async () => {
    render(<ApplicationsPage />)

    await waitFor(() => {
      expect(screen.getByText('My Applications')).toBeInTheDocument()
      expect(screen.getByText('Track and manage your job applications')).toBeInTheDocument()
    })
  })

  it('displays application stats', async () => {
    render(<ApplicationsPage />)

    await waitFor(() => {
      expect(screen.getByTestId('application-stats')).toBeInTheDocument()
      expect(screen.getByText('Total: 1')).toBeInTheDocument()
    })
  })

  it('displays application grid', async () => {
    render(<ApplicationsPage />)

    await waitFor(() => {
      expect(screen.getByTestId('application-grid')).toBeInTheDocument()
      expect(screen.getByText('1 applications')).toBeInTheDocument()
    })
  })

  it('shows loading state', async () => {
    ;(useApplications as jest.Mock).mockReturnValue({
      ...((useApplications as jest.Mock).getMockImplementation()()),
      loading: true,
      applications: [],
    })

    render(<ApplicationsPage />)

    await waitFor(() => {
      expect(screen.getByTestId('application-grid')).toHaveTextContent('Loading...')
    })
  })

  it('shows empty state when no applications', async () => {
    ;(useApplications as jest.Mock).mockReturnValue({
      ...((useApplications as jest.Mock).getMockImplementation()()),
      applications: [],
      loading: false,
    })

    render(<ApplicationsPage />)

    await waitFor(() => {
      expect(screen.getByText('No applications found')).toBeInTheDocument()
      expect(screen.getByText("You haven't applied to any jobs yet")).toBeInTheDocument()
    })
  })

  it('shows error state when there is an error', async () => {
    ;(useApplications as jest.Mock).mockReturnValue({
      ...((useApplications as jest.Mock).getMockImplementation()()),
      error: 'Failed to load applications',
      loading: false,
    })

    render(<ApplicationsPage />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load applications. Please try again later.')).toBeInTheDocument()
    })
  })

  it('redirects non-authenticated users to signin', () => {
    const mockPush = jest.fn()
    jest.doMock('next/router', () => ({
      useRouter: () => ({
        push: mockPush,
      }),
    }))

    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    render(<ApplicationsPage>)

    expect(mockPush).toHaveBeenCalledWith('/auth/signin')
  })

  it('redirects non-seeker users to dashboard', () => {
    const mockPush = jest.fn()
    jest.doMock('next/router', () => ({
      useRouter: () => ({
        push: mockPush,
      }),
    }))

    ;(useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          id: 'test-user-id',
          role: 'EMPLOYER',
        },
      },
      status: 'authenticated',
    })

    render(<ApplicationsPage>)

    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })
})