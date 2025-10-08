import { renderHook, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useToast } from '@/hooks/use-toast'
import { useSavedJobs } from '@/hooks/use-saved-jobs'
import { act } from 'react'

// Mock dependencies
jest.mock('next-auth/react')
jest.mock('@/hooks/use-toast')

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

// Mock fetch
global.fetch = jest.fn()

describe('useSavedJobs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useSession as jest.Mock).mockReturnValue(mockSession)
    ;(useToast as jest.Mock).mockReturnValue(mockToast)
  })

  it('should fetch saved jobs on mount when user is a seeker', async () => {
    const mockJobs = [
      {
        id: '1',
        title: 'Test Job',
        company: 'Test Company',
        location: 'Test Location',
        savedAt: '2023-01-01T00:00:00Z'
      }
    ]

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: mockJobs })
    })

    const { result } = renderHook(() => useSavedJobs())

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.savedJobs).toEqual(mockJobs)
    })

    expect(fetch).toHaveBeenCalledWith('/api/saved-jobs')
  })

  it('should not fetch saved jobs when user is not a seeker', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          id: 'test-user-id',
          role: 'employer'
        }
      },
      status: 'authenticated'
    })

    const { result } = renderHook(() => useSavedJobs())

    expect(result.current.savedJobs).toEqual([])
    expect(fetch).not.toHaveBeenCalled()
  })

  it('should handle save job correctly', async () => {
    const mockJob = {
      id: '1',
      title: 'Test Job',
      company: 'Test Company',
      location: 'Test Location',
      savedAt: '2023-01-01T00:00:00Z'
    }

    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [mockJob] })
      })

    const { result } = renderHook(() => useSavedJobs())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.toggleSave('1')
    })

    expect(fetch).toHaveBeenCalledWith('/api/saved-jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ jobId: '1' })
    })

    expect(mockToast.toast).toHaveBeenCalledWith({
      title: 'Job Saved',
      description: 'The job has been added to your saved list.'
    })
  })

  it('should handle unsave job correctly', async () => {
    const mockJobs = [
      {
        id: '1',
        title: 'Test Job',
        company: 'Test Company',
        location: 'Test Location',
        savedAt: '2023-01-01T00:00:00Z'
      }
    ]

    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockJobs })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      })

    const { result } = renderHook(() => useSavedJobs())

    await waitFor(() => {
      expect(result.current.savedJobs).toEqual(mockJobs)
    })

    await act(async () => {
      await result.current.toggleSave('1')
    })

    expect(fetch).toHaveBeenCalledWith('/api/saved-jobs/1', {
      method: 'DELETE'
    })

    expect(mockToast.toast).toHaveBeenCalledWith({
      title: 'Job Removed',
      description: 'The job has been removed from your saved list.'
    })
  })

  it('should check if job is saved', async () => {
    const mockJobs = [
      {
        id: '1',
        title: 'Test Job',
        company: 'Test Company',
        location: 'Test Location',
        savedAt: '2023-01-01T00:00:00Z'
      }
    ]

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: mockJobs })
    })

    const { result } = renderHook(() => useSavedJobs())

    await waitFor(() => {
      expect(result.current.savedJobs).toEqual(mockJobs)
    })

    expect(result.current.isJobSaved('1')).toBe(true)
    expect(result.current.isJobSaved('2')).toBe(false)
  })

  it('should update saved job details', async () => {
    const mockJobs = [
      {
        id: '1',
        title: 'Test Job',
        company: 'Test Company',
        location: 'Test Location',
        savedAt: '2023-01-01T00:00:00Z'
      }
    ]

    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockJobs })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      })

    const { result } = renderHook(() => useSavedJobs())

    await waitFor(() => {
      expect(result.current.savedJobs).toEqual(mockJobs)
    })

    await act(async () => {
      await result.current.updateSavedJob('1', { notes: 'Test notes' })
    })

    expect(fetch).toHaveBeenCalledWith('/api/saved-jobs/1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ notes: 'Test notes' })
    })

    expect(mockToast.toast).toHaveBeenCalledWith({
      title: 'Job Updated',
      description: 'Your changes have been saved.'
    })
  })

  it('should handle API errors gracefully', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Failed to fetch' })
    })

    const { result } = renderHook(() => useSavedJobs())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Failed to fetch')
    expect(mockToast.toast).not.toHaveBeenCalled()
  })

  it('should export saved jobs', async () => {
    const mockJobs = [
      {
        id: '1',
        title: 'Test Job',
        company: 'Test Company',
        location: 'Test Location',
        savedAt: '2023-01-01T00:00:00Z'
      }
    ]

    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockJobs })
      })
      .mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(new Blob())
      })

    // Mock URL.createObjectURL and download
    global.URL.createObjectURL = jest.fn(() => 'mock-url')
    global.URL.revokeObjectURL = jest.fn()
    const mockCreateElement = jest.fn(() => ({
      href: '',
      download: '',
      click: jest.fn()
    }))
    global.document.createElement = mockCreateElement as any
    global.document.body.appendChild = jest.fn()
    global.document.body.removeChild = jest.fn()

    const { result } = renderHook(() => useSavedJobs())

    await waitFor(() => {
      expect(result.current.savedJobs).toEqual(mockJobs)
    })

    await act(async () => {
      await result.current.exportSavedJobs('csv')
    })

    expect(fetch).toHaveBeenCalledWith('/api/saved-jobs/export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ format: 'csv', jobIds: ['1'] })
    })
  })
})