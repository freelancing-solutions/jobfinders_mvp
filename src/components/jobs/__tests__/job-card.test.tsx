import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useToast } from '@/hooks/use-toast'
import { JobCard } from '@/components/jobs/job-card'
import { Job } from '@/types/jobs'

// Mock dependencies
jest.mock('next-auth/react')
jest.mock('@/hooks/use-toast')
jest.mock('next/link', () => {
  return ({ children, href }: any) => <a href={href}>{children}</a>
})
jest.mock('next/image', () => {
  return ({ alt, ...props }: any) => <img alt={alt} {...props} />
})

// Mock fetch
global.fetch = jest.fn()

const mockJob: Job = {
  id: '1',
  title: 'Software Developer',
  company: {
    name: 'Tech Company',
    logo: null,
    isVerified: true
  },
  location: 'Johannesburg, South Africa',
  type: 'Full-time',
  remote: true,
  description: 'A great software developer role',
  salary: {
    min: 500000,
    max: 800000,
    currency: 'ZAR'
  },
  createdAt: '2023-01-01T00:00:00Z',
  category: {
    name: 'Engineering',
    color: '#3b82f6',
    icon: '💻'
  },
  experience: 'Mid-level',
  applicantCount: 15
}

const mockSession = {
  data: {
    user: {
      id: 'test-user-id',
      role: 'seeker'
    }
  },
  status: 'authenticated'
}

const mockToast = {
  toast: jest.fn()
}

describe('JobCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useSession as jest.Mock).mockReturnValue(mockSession)
    ;(useToast as jest.Mock).mockReturnValue(mockToast)
  })

  it('should render job information correctly', () => {
    render(<JobCard job={mockJob} />)

    expect(screen.getByText('Software Developer')).toBeInTheDocument()
    expect(screen.getByText('Tech Company')).toBeInTheDocument()
    expect(screen.getByText('Johannesburg, South Africa')).toBeInTheDocument()
    expect(screen.getByText('Full-time')).toBeInTheDocument()
    expect(screen.getByText('Remote')).toBeInTheDocument()
    expect(screen.getByText('15 applicants')).toBeInTheDocument()
    expect(screen.getByText('Mid-level')).toBeInTheDocument()
    expect(screen.getByText('500,000 - 800,000 ZAR')).toBeInTheDocument()
  })

  it('should show bookmark button', () => {
    render(<JobCard job={mockJob} />)

    const bookmarkButton = screen.getByRole('button', { name: '' })
    expect(bookmarkButton).toBeInTheDocument()
  })

  it('should show filled bookmark when job is saved', () => {
    render(<JobCard job={mockJob} isSaved={true} />)

    const bookmarkButton = screen.getByRole('button')
    expect(bookmarkButton).toHaveClass('text-blue-600')
  })

  it('should call onToggleSave when bookmark button is clicked', () => {
    const mockToggleSave = jest.fn()
    render(<JobCard job={mockJob} isSaved={false} onToggleSave={mockToggleSave} />)

    const bookmarkButton = screen.getByRole('button')
    fireEvent.click(bookmarkButton)

    expect(mockToggleSave).toHaveBeenCalledWith('1')
  })

  it('should handle save functionality when no onToggleSave provided', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({})
    })

    render(<JobCard job={mockJob} isSaved={false} />)

    const bookmarkButton = screen.getByRole('button')
    fireEvent.click(bookmarkButton)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/saved-jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ jobId: '1' })
      })
    })

    expect(mockToast.toast).toHaveBeenCalledWith({
      title: 'Job Saved',
      description: 'The job has been added to your saved list.'
    })
  })

  it('should handle unsave functionality when no onToggleSave provided', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({})
    })

    render(<JobCard job={mockJob} isSaved={true} />)

    const bookmarkButton = screen.getByRole('button')
    fireEvent.click(bookmarkButton)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/saved-jobs/1', {
        method: 'DELETE'
      })
    })

    expect(mockToast.toast).toHaveBeenCalledWith({
      title: 'Job Removed',
      description: 'The job has been removed from your saved list.'
    })
  })

  it('should show authentication error when user is not authenticated', async () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated'
    })

    render(<JobCard job={mockJob} />)

    const bookmarkButton = screen.getByRole('button')
    fireEvent.click(bookmarkButton)

    await waitFor(() => {
      expect(mockToast.toast).toHaveBeenCalledWith({
        title: 'Authentication Required',
        description: 'Please sign in to save jobs.',
        variant: 'destructive'
      })
    })
  })

  it('should show access error when user is not a seeker', async () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          id: 'test-user-id',
          role: 'employer'
        }
      },
      status: 'authenticated'
    })

    render(<JobCard job={mockJob} />)

    const bookmarkButton = screen.getByRole('button')
    fireEvent.click(bookmarkButton)

    await waitFor(() => {
      expect(mockToast.toast).toHaveBeenCalledWith({
        title: 'Access Denied',
        description: 'Only job seekers can save jobs.',
        variant: 'destructive'
      })
    })
  })

  it('should handle save errors gracefully', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Failed to save job' })
    })

    render(<JobCard job={mockJob} />)

    const bookmarkButton = screen.getByRole('button')
    fireEvent.click(bookmarkButton)

    await waitFor(() => {
      expect(mockToast.toast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Failed to save job',
        variant: 'destructive'
      })
    })
  })

  it('should disable bookmark button while saving', async () => {
    ;(fetch as jest.Mock).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

    render(<JobCard job={mockJob} />)

    const bookmarkButton = screen.getByRole('button')
    fireEvent.click(bookmarkButton)

    expect(bookmarkButton).toBeDisabled()
  })

  it('should show loading spinner while saving', async () => {
    ;(fetch as jest.Mock).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

    render(<JobCard job={mockJob} />)

    const bookmarkButton = screen.getByRole('button')
    fireEvent.click(bookmarkButton)

    expect(bookmarkButton.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('should have apply now link', () => {
    render(<JobCard job={mockJob} />)

    const applyButton = screen.getByRole('link', { name: 'Apply Now' })
    expect(applyButton).toHaveAttribute('href', '/jobs/1/apply')
  })

  it('should have job details link', () => {
    render(<JobCard job={mockJob} />)

    const jobTitleLink = screen.getByRole('link', { name: 'Software Developer' })
    expect(jobTitleLink).toHaveAttribute('href', '/jobs/1')
  })

  it('should show verified badge when company is verified', () => {
    render(<JobCard job={mockJob} />)

    expect(screen.getByText('Verified')).toBeInTheDocument()
  })

  it('should not show salary when not provided', () => {
    const jobWithoutSalary = {
      ...mockJob,
      salary: undefined
    }

    render(<JobCard job={jobWithoutSalary} />)

    expect(screen.queryByText(/ZAR/)).not.toBeInTheDocument()
  })
})