import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useSavedJobs } from '@/hooks/use-saved-jobs'
import SavedJobsPage from '@/app/saved/page'

// Mock dependencies
jest.mock('next-auth/react')
jest.mock('@/hooks/use-saved-jobs')
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn()
  })
}))

const mockSession = {
  data: {
    user: {
      id: 'test-user-id',
      role: 'seeker'
    }
  },
  status: 'authenticated'
}

const mockSavedJobs = [
  {
    id: '1',
    title: 'Software Developer',
    company: 'Tech Company',
    location: 'Johannesburg, South Africa',
    salaryMin: 500000,
    salaryMax: 800000,
    currency: 'ZAR',
    positionType: 'Full-time',
    savedAt: '2023-01-01T00:00:00Z',
    status: 'saved',
    notes: 'Interesting position'
  },
  {
    id: '2',
    title: 'Data Analyst',
    company: 'Data Corp',
    location: 'Cape Town, South Africa',
    salaryMin: 400000,
    salaryMax: 600000,
    currency: 'ZAR',
    positionType: 'Full-time',
    savedAt: '2023-01-02T00:00:00Z',
    status: 'applied'
  }
]

const mockUseSavedJobs = {
  savedJobs: mockSavedJobs,
  loading: false,
  error: null,
  updateSavedJob: jest.fn(),
  removeSavedJob: jest.fn(),
  exportSavedJobs: jest.fn()
}

describe('SavedJobsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useSession as jest.Mock).mockReturnValue(mockSession)
    ;(useSavedJobs as jest.Mock).mockReturnValue(mockUseSavedJobs)
  })

  it('should render saved jobs page correctly', () => {
    render(<SavedJobsPage />)

    expect(screen.getByText('Saved Jobs')).toBeInTheDocument()
    expect(screen.getByText('2 Saved Jobs')).toBeInTheDocument()
    expect(screen.getByText('4 Collections')).toBeInTheDocument()
    expect(screen.getByText('2 Companies')).toBeInTheDocument()
  })

  it('should display saved jobs', () => {
    render(<SavedJobsPage />)

    expect(screen.getByText('Software Developer')).toBeInTheDocument()
    expect(screen.getByText('Tech Company')).toBeInTheDocument()
    expect(screen.getByText('Data Analyst')).toBeInTheDocument()
    expect(screen.getByText('Data Corp')).toBeInTheDocument()
  })

  it('should show empty state when no saved jobs', () => {
    ;(useSavedJobs as jest.Mock).mockReturnValue({
      ...mockUseSavedJobs,
      savedJobs: []
    })

    render(<SavedJobsPage />)

    expect(screen.getByText('No Saved Jobs Yet')).toBeInTheDocument()
    expect(screen.getByText('Browse Jobs')).toBeInTheDocument()
  })

  it('should show loading state', () => {
    ;(useSavedJobs as jest.Mock).mockReturnValue({
      ...mockUseSavedJobs,
      loading: true
    })

    render(<SavedJobsPage />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('should show error state', () => {
    ;(useSavedJobs as jest.Mock).mockReturnValue({
      ...mockUseSavedJobs,
      error: 'Failed to load saved jobs'
    })

    render(<SavedJobsPage />)

    expect(screen.getByText('Failed to load saved jobs. Please try again later.')).toBeInTheDocument()
    expect(screen.getByText('Try Again')).toBeInTheDocument()
  })

  it('should filter jobs by search term', () => {
    render(<SavedJobsPage />)

    const searchInput = screen.getByPlaceholderText('Search saved jobs...')
    fireEvent.change(searchInput, { target: { value: 'Software' } })

    expect(screen.getByText('Software Developer')).toBeInTheDocument()
    expect(screen.queryByText('Data Analyst')).not.toBeInTheDocument()
  })

  it('should filter jobs by status', () => {
    render(<SavedJobsPage />)

    const statusFilter = screen.getByRole('combobox')
    fireEvent.change(statusFilter, { target: { value: 'applied' } })

    expect(screen.queryByText('Software Developer')).not.toBeInTheDocument()
    expect(screen.getByText('Data Analyst')).toBeInTheDocument()
  })

  it('should sort jobs', () => {
    render(<SavedJobsPage />)

    const sortSelect = screen.getAllByRole('combobox')[1]
    fireEvent.change(sortSelect, { target: { value: 'title' } })

    // Should sort by title
    expect(screen.getByText('Data Analyst')).toBeInTheDocument()
    expect(screen.getByText('Software Developer')).toBeInTheDocument()
  })

  it('should select jobs for bulk operations', () => {
    render(<SavedJobsPage />)

    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[1]) // First job checkbox

    expect(screen.getByText('1 of 2 selected')).toBeInTheDocument()
  })

  it('should select all jobs', () => {
    render(<SavedJobsPage />)

    const selectAllCheckbox = screen.getAllByRole('checkbox')[0]
    fireEvent.click(selectAllCheckbox)

    expect(screen.getByText('All jobs selected')).toBeInTheDocument()
  })

  it('should handle job removal', async () => {
    const mockRemoveJob = jest.fn()
    ;(useSavedJobs as jest.Mock).mockReturnValue({
      ...mockUseSavedJobs,
      removeSavedJob: mockRemoveJob
    })

    render(<SavedJobsPage />)

    const moreButton = screen.getAllByRole('button')[3] // More options button for first job
    fireEvent.click(moreButton)

    const removeButton = screen.getByText('Remove')
    fireEvent.click(removeButton)

    await waitFor(() => {
      expect(mockRemoveJob).toHaveBeenCalledWith('1')
    })
  })

  it('should handle job editing', async () => {
    const mockUpdateJob = jest.fn()
    ;(useSavedJobs as jest.Mock).mockReturnValue({
      ...mockUseSavedJobs,
      updateSavedJob: mockUpdateJob
    })

    render(<SavedJobsPage />)

    const moreButton = screen.getAllByRole('button')[3] // More options button for first job
    fireEvent.click(moreButton)

    const editButton = screen.getByText('Edit Details')
    fireEvent.click(editButton)

    expect(screen.getByText('Save Changes')).toBeInTheDocument()

    const notesTextarea = screen.getByPlaceholderText('Add your notes about this job...')
    fireEvent.change(notesTextarea, { target: { value: 'Updated notes' } })

    const saveButton = screen.getByText('Save Changes')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockUpdateJob).toHaveBeenCalledWith('1', {
        status: 'saved',
        notes: 'Updated notes'
      })
    })
  })

  it('should export jobs', async () => {
    const mockExport = jest.fn()
    ;(useSavedJobs as jest.Mock).mockReturnValue({
      ...mockUseSavedJobs,
      exportSavedJobs: mockExport
    })

    render(<SavedJobsPage />)

    // Select a job first
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[1])

    // Click export dropdown
    const exportButton = screen.getByText('Export')
    fireEvent.click(exportButton)

    const csvOption = screen.getByText('Export as CSV')
    fireEvent.click(csvOption)

    await waitFor(() => {
      expect(mockExport).toHaveBeenCalledWith('csv', ['1'])
    })
  })

  it('should create new collection', () => {
    render(<SavedJobsPage />)

    const newCollectionButton = screen.getByText('New Collection')
    fireEvent.click(newCollectionButton)

    expect(screen.getByText('Create New Collection')).toBeInTheDocument()

    const nameInput = screen.getByPlaceholderText('e.g. Remote Jobs, Dream Companies')
    fireEvent.change(nameInput, { target: { value: 'Test Collection' } })

    const createButton = screen.getByText('Create Collection')
    fireEvent.click(createButton)

    expect(screen.getByText('Collection Created')).toBeInTheDocument()
  })

  it('should redirect non-seeker users', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          id: 'test-user-id',
          role: 'employer'
        }
      },
      status: 'authenticated'
    })

    const mockPush = jest.fn()
    jest.mock('next/router', () => ({
      useRouter: () => ({
        push: mockPush
      })
    }))

    render(<SavedJobsPage />)

    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })

  it('should redirect unauthenticated users', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated'
    })

    const mockPush = jest.fn()
    jest.mock('next/router', () => ({
      useRouter: () => ({
        push: mockPush
      })
    }))

    render(<SavedJobsPage />)

    expect(mockPush).toHaveBeenCalledWith('/auth/signin')
  })

  it('should display job status badges', () => {
    render(<SavedJobsPage />)

    expect(screen.getByText('Saved')).toBeInTheDocument()
    expect(screen.getByText('Applied')).toBeInTheDocument()
  })

  it('should display job notes', () => {
    render(<SavedJobsPage />)

    expect(screen.getByText('Interesting position')).toBeInTheDocument()
  })

  it('should clear filters', () => {
    render(<SavedJobsPage />)

    const searchInput = screen.getByPlaceholderText('Search saved jobs...')
    fireEvent.change(searchInput, { target: { value: 'Software' } })

    const clearButton = screen.getByText('Clear Filters')
    fireEvent.click(clearButton)

    expect(searchInput).toHaveValue('')
  })

  it('should have responsive design', () => {
    render(<SavedJobsPage />)

    // Check that main layout elements are present
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })
})