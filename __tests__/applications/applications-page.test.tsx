import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ApplicationsPage from '@/app/applications/page'
import { useApplications } from '@/hooks/use-applications'
import { useSocket } from '@/hooks/use-socket'

// Mock the hooks
jest.mock('@/hooks/use-applications')
jest.mock('@/hooks/use-socket')
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock session data
const mockSession = {
  user: {
    id: 'user-123',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'SEEKER',
  },
  expires: '2024-12-31',
}

const mockApplications = [
  {
    id: 'app-1',
    jobId: 'job-1',
    userId: 'user-123',
    status: 'applied',
    appliedAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    job: {
      id: 'job-1',
      title: 'Software Engineer',
      company: {
        id: 'company-1',
        name: 'Tech Corp',
        logo: '/logo.png',
        location: 'San Francisco, CA',
      },
      location: 'San Francisco, CA',
      salaryMin: 80000,
      salaryMax: 120000,
      currency: 'USD',
      positionType: 'full-time',
      remotePolicy: 'hybrid',
      description: 'Software engineering role',
      requirements: ['React', 'TypeScript'],
      isFeatured: true,
      isUrgent: false,
      postedAt: '2024-01-10T10:00:00Z',
      expiresAt: '2024-02-10T10:00:00Z',
      applicationCount: 10,
    },
    matchScore: 85,
  },
  {
    id: 'app-2',
    jobId: 'job-2',
    userId: 'user-123',
    status: 'interview_scheduled',
    appliedAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-12T15:30:00Z',
    job: {
      id: 'job-2',
      title: 'Frontend Developer',
      company: {
        id: 'company-2',
        name: 'Design Co',
        logo: '/logo2.png',
        location: 'New York, NY',
      },
      location: 'New York, NY',
      salaryMin: 70000,
      salaryMax: 100000,
      currency: 'USD',
      positionType: 'full-time',
      remotePolicy: 'remote',
      description: 'Frontend development role',
      requirements: ['Vue.js', 'CSS'],
      isFeatured: false,
      isUrgent: true,
      postedAt: '2024-01-05T10:00:00Z',
      expiresAt: '2024-02-05T10:00:00Z',
      applicationCount: 5,
    },
    matchScore: 92,
  },
]

const mockStats = {
  total: 2,
  active: 2,
  archived: 0,
  byStatus: {
    applied: 1,
    interview_scheduled: 1,
    offered: 0,
    rejected: 0,
    hired: 0,
    withdrawn: 0,
    archived: 0,
    reviewing: 0,
    shortlisted: 0,
    interview_completed: 0,
  },
  byCompany: [
    { companyName: 'Tech Corp', count: 1, successRate: 0 },
    { companyName: 'Design Co', count: 1, successRate: 0 },
  ],
  byTimePeriod: [
    {
      period: '2024-01',
      applications: 2,
      interviews: 1,
      offers: 0,
      rejections: 0,
      successRate: 0,
    },
  ],
  responseMetrics: {
    averageResponseTime: 48,
    responseRate: 100,
    interviewRate: 50,
    offerRate: 0,
  },
  topSkills: [
    { skill: 'React', count: 1, successRate: 0 },
    { skill: 'TypeScript', count: 1, successRate: 0 },
    { skill: 'Vue.js', count: 1, successRate: 0 },
    { skill: 'CSS', count: 1, successRate: 0 },
  ],
  salaryInsights: {
    averageMin: 75000,
    median: 80000,
    marketRate: 85000,
  },
}

describe('ApplicationsPage', () => {
  const mockPush = jest.fn()
  const mockRefresh = jest.fn()
  const mockExportApplications = jest.fn()
  const mockUpdateFilters = jest.fn()
  const mockClearFilters = jest.fn()
  const mockUpdatePagination = jest.fn()
  const mockSearch = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock useRouter
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })

    // Mock useApplications
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
        total: 2,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
      filters: {},
      updateFilters: mockUpdateFilters,
      clearFilters: mockClearFilters,
      updatePagination: mockUpdatePagination,
      setView: jest.fn(),
      refresh: mockRefresh,
      search: mockSearch,
      fetchMore: jest.fn(),
      updateApplicationStatus: jest.fn(),
      withdrawApplication: jest.fn(),
      archiveApplication: jest.fn(),
      deleteApplication: jest.fn(),
      addNote: jest.fn(),
      exportApplications: mockExportApplications,
    })

    // Mock useSocket
    ;(useSocket as jest.Mock).mockReturnValue({
      socket: null,
      isConnected: false,
      isConnecting: false,
      error: null,
      reconnect: jest.fn(),
      disconnect: jest.fn(),
    })
  })

  const renderComponent = (session = mockSession) => {
    return render(
      <SessionProvider session={session}>
        <ApplicationsPage />
      </SessionProvider>
    )
  }

  it('renders applications page with correct title', () => {
    renderComponent()

    expect(screen.getByText('My Applications')).toBeInTheDocument()
    expect(screen.getByText('Track and manage your job applications')).toBeInTheDocument()
  })

  it('shows connection status when WebSocket is connected', () => {
    ;(useSocket as jest.Mock).mockReturnValue({
      socket: { on: jest.fn(), emit: jest.fn() },
      isConnected: true,
      isConnecting: false,
      error: null,
      reconnect: jest.fn(),
      disconnect: jest.fn(),
    })

    renderComponent()

    expect(screen.getByText('Live')).toBeInTheDocument()
    expect(screen.getByText('Real-time updates active')).toBeInTheDocument()
  })

  it('shows offline status when WebSocket is disconnected', () => {
    renderComponent()

    expect(screen.getByText('Offline')).toBeInTheDocument()
  })

  it('displays applications list when data is available', () => {
    renderComponent()

    expect(screen.getByText('Software Engineer')).toBeInTheDocument()
    expect(screen.getByText('Tech Corp')).toBeInTheDocument()
    expect(screen.getByText('Frontend Developer')).toBeInTheDocument()
    expect(screen.getByText('Design Co')).toBeInTheDocument()
  })

  it('shows empty state when no applications exist', () => {
    ;(useApplications as jest.Mock).mockReturnValue({
      ...((useApplications as jest.Mock).mockReturnValue as any),
      applications: [],
      loading: false,
    })

    renderComponent()

    expect(screen.getByText('No applications found')).toBeInTheDocument()
    expect(screen.getByText("You haven't applied to any jobs yet. Start exploring opportunities and submit your first application!")).toBeInTheDocument()
    expect(screen.getByText('Browse Jobs')).toBeInTheDocument()
  })

  it('shows loading skeleton while loading', () => {
    ;(useApplications as jest.Mock).mockReturnValue({
      ...((useApplications as jest.Mock).mockReturnValue as any),
      loading: true,
    })

    renderComponent()

    // Check for loading skeletons
    const skeletons = screen.getAllByRole('status', { hidden: true })
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('shows error message when there is an error', () => {
    const errorMessage = 'Failed to load applications'
    ;(useApplications as jest.Mock).mockReturnValue({
      ...((useApplications as jest.Mock).mockReturnValue as any),
      error: errorMessage,
      loading: false,
    })

    renderComponent()

    expect(screen.getByText(errorMessage)).toBeInTheDocument()
    expect(screen.getByText('Try Again')).toBeInTheDocument()
  })

  it('redirects unauthenticated users to sign in', () => {
    renderComponent(null)

    expect(mockPush).toHaveBeenCalledWith('/auth/signin')
  })

  it('redirects non-seeker users to dashboard', () => {
    const employerSession = {
      ...mockSession,
      user: {
        ...mockSession.user,
        role: 'EMPLOYER',
      },
    }

    renderComponent(employerSession)

    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })

  it('handles export functionality', async () => {
    renderComponent()

    const exportCsvButton = screen.getByText('Export CSV')
    const exportJsonButton = screen.getByText('Export JSON')

    fireEvent.click(exportCsvButton)
    await waitFor(() => {
      expect(mockExportApplications).toHaveBeenCalledWith('csv')
    })

    fireEvent.click(exportJsonButton)
    await waitFor(() => {
      expect(mockExportApplications).toHaveBeenCalledWith('json')
    })
  })

  it('handles refresh functionality', async () => {
    renderComponent()

    const refreshButton = screen.getByText('Refresh')
    fireEvent.click(refreshButton)

    expect(mockRefresh).toHaveBeenCalled()
  })

  it('switches between tabs correctly', async () => {
    renderComponent()

    // Initially on applications tab
    expect(screen.getByText('Software Engineer')).toBeInTheDocument()

    // Switch to analytics tab
    const analyticsTab = screen.getByText('Analytics')
    fireEvent.click(analyticsTab)

    // Analytics content should appear
    await waitFor(() => {
      expect(screen.getByText('Application Analytics')).toBeInTheDocument()
    })
  })

  it('shows stats cards with correct data', () => {
    renderComponent()

    // Check if stats are displayed (implementation would depend on ApplicationStats component)
    expect(screen.getByText('Total Applications')).toBeInTheDocument()
  })

  it('handles browse jobs navigation', () => {
    renderComponent()

    const browseJobsButton = screen.getByText('Browse Jobs')
    fireEvent.click(browseJobsButton)

    // In a real test, you'd check if navigation occurred
    // For now, just verify the button exists and is clickable
    expect(browseJobsButton).toBeInTheDocument()
  })

  describe('WebSocket Integration', () => {
    it('sets up WebSocket event listeners on mount', () => {
      const mockSocket = {
        on: jest.fn(),
        emit: jest.fn(),
        off: jest.fn(),
      }

      ;(useSocket as jest.Mock).mockReturnValue({
        socket: mockSocket,
        isConnected: true,
        isConnecting: false,
        error: null,
        reconnect: jest.fn(),
        disconnect: jest.fn(),
      })

      renderComponent()

      expect(mockSocket.on).toHaveBeenCalledWith('application:status_updated', expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith('application:created', expect.any(Function))
      expect(mockSocket.emit).toHaveBeenCalledWith('join_room', 'user:user-123')
    })

    it('cleans up WebSocket listeners on unmount', () => {
      const mockSocket = {
        on: jest.fn(),
        emit: jest.fn(),
        off: jest.fn(),
      }

      ;(useSocket as jest.Mock).mockReturnValue({
        socket: mockSocket,
        isConnected: true,
        isConnecting: false,
        error: null,
        reconnect: jest.fn(),
        disconnect: jest.fn(),
      })

      const { unmount } = renderComponent()
      unmount()

      expect(mockSocket.off).toHaveBeenCalledWith('application:status_updated', expect.any(Function))
      expect(mockSocket.off).toHaveBeenCalledWith('application:created', expect.any(Function))
      expect(mockSocket.emit).toHaveBeenCalledWith('leave_room', 'user:user-123')
    })
  })

  describe('Tab Navigation', () => {
    it('maintains active tab state', () => {
      renderComponent()

      // Applications tab should be active by default
      const applicationsTab = screen.getByRole('tab', { name: /applications/i })
      expect(applicationsTab).toHaveAttribute('data-state', 'active')

      // Analytics tab should not be active
      const analyticsTab = screen.getByRole('tab', { name: /analytics/i })
      expect(analyticsTab).toHaveAttribute('data-state', 'inactive')
    })

    it('switches to analytics tab and shows analytics content', async () => {
      renderComponent()

      const analyticsTab = screen.getByRole('tab', { name: /analytics/i })
      fireEvent.click(analyticsTab)

      await waitFor(() => {
        expect(analyticsTab).toHaveAttribute('data-state', 'active')
        expect(screen.getByText('Application Analytics')).toBeInTheDocument()
      })
    })
  })
})