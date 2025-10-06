import { renderHook, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { useCurrentUser, useCurrentUserSync, CurrentUser, JobSeekerProfile, EmployerProfile } from '@/hooks/useCurrentUser'

// Mock the dependencies
jest.mock('next-auth/react')
jest.mock('@tanstack/react-query')

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>
const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>

describe('useCurrentUser', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset fetch mock
    ;(global.fetch as jest.Mock).mockClear()
  })

  describe('Authentication States', () => {
    it('should return loading state when session is loading', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
        update: jest.fn(),
      })

      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn(),
        isRefetching: false,
      } as any)

      const { result } = renderHook(() => useCurrentUser())

      expect(result.current.isLoading).toBe(true)
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isUnauthenticated).toBe(false)
    })

    it('should return unauthenticated state when no session', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      })

      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn(),
        isRefetching: false,
      } as any)

      const { result } = renderHook(() => useCurrentUser())

      expect(result.current.isLoading).toBe(false)
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isUnauthenticated).toBe(true)
    })

    it('should return authenticated state when session exists', () => {
      const mockSession = {
        user: { email: 'test@example.com', name: 'Test User' },
        expires: '2024-12-31',
      }

      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
        update: jest.fn(),
      })

      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn(),
        isRefetching: false,
      } as any)

      const { result } = renderHook(() => useCurrentUser())

      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.isUnauthenticated).toBe(false)
    })
  })

  describe('User Data Loading', () => {
    it('should fetch user data when authenticated', () => {
      const mockSession = {
        user: { email: 'test@example.com', name: 'Test User' },
        expires: '2024-12-31',
      }

      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
        update: jest.fn(),
      })

      const mockUser: CurrentUser = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'SEEKER',
        image: null,
        subscription: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }

      mockUseQuery.mockReturnValue({
        data: mockUser,
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn(),
        isRefetching: false,
      } as any)

      const { result } = renderHook(() => useCurrentUser())

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.isError).toBe(false)
    })

    it('should handle loading state during user data fetch', () => {
      const mockSession = {
        user: { email: 'test@example.com', name: 'Test User' },
        expires: '2024-12-31',
      }

      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
        update: jest.fn(),
      })

      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
        refetch: jest.fn(),
        isRefetching: false,
      } as any)

      const { result } = renderHook(() => useCurrentUser())

      expect(result.current.isLoading).toBe(true)
      expect(result.current.user).toBeUndefined()
    })

    it('should handle error state during user data fetch', () => {
      const mockSession = {
        user: { email: 'test@example.com', name: 'Test User' },
        expires: '2024-12-31',
      }

      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
        update: jest.fn(),
      })

      const mockError = new Error('Failed to fetch user data')

      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: mockError,
        refetch: jest.fn(),
        isRefetching: false,
      } as any)

      const { result } = renderHook(() => useCurrentUser())

      expect(result.current.isError).toBe(true)
      expect(result.current.error).toBe(mockError)
    })
  })

  describe('Role-based Helpers', () => {
    it('should correctly identify job seeker role', () => {
      const mockSession = {
        user: { email: 'seeker@example.com', name: 'Job Seeker' },
        expires: '2024-12-31',
      }

      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
        update: jest.fn(),
      })

      const mockUser: CurrentUser = {
        id: '1',
        name: 'Job Seeker',
        email: 'seeker@example.com',
        role: 'SEEKER',
        profile: {
          type: 'jobSeeker',
          professionalTitle: 'Software Developer',
          location: 'Cape Town',
        } as JobSeekerProfile,
      }

      mockUseQuery.mockReturnValue({
        data: mockUser,
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn(),
        isRefetching: false,
      } as any)

      const { result } = renderHook(() => useCurrentUser())

      expect(result.current.isJobSeeker).toBe(true)
      expect(result.current.isEmployer).toBe(false)
      expect(result.current.isAdmin).toBe(false)
      expect(result.current.jobSeekerProfile).toEqual(mockUser.profile)
      expect(result.current.employerProfile).toBeNull()
    })

    it('should correctly identify employer role', () => {
      const mockSession = {
        user: { email: 'employer@example.com', name: 'Employer' },
        expires: '2024-12-31',
      }

      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
        update: jest.fn(),
      })

      const mockUser: CurrentUser = {
        id: '2',
        name: 'Employer',
        email: 'employer@example.com',
        role: 'EMPLOYER',
        profile: {
          type: 'employer',
          companyName: 'Tech Corp',
          industry: 'Technology',
        } as EmployerProfile,
      }

      mockUseQuery.mockReturnValue({
        data: mockUser,
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn(),
        isRefetching: false,
      } as any)

      const { result } = renderHook(() => useCurrentUser())

      expect(result.current.isJobSeeker).toBe(false)
      expect(result.current.isEmployer).toBe(true)
      expect(result.current.isAdmin).toBe(false)
      expect(result.current.employerProfile).toEqual(mockUser.profile)
      expect(result.current.jobSeekerProfile).toBeNull()
    })

    it('should correctly identify admin role', () => {
      const mockSession = {
        user: { email: 'admin@example.com', name: 'Admin' },
        expires: '2024-12-31',
      }

      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
        update: jest.fn(),
      })

      const mockUser: CurrentUser = {
        id: '3',
        name: 'Admin',
        email: 'admin@example.com',
        role: 'ADMIN',
      }

      mockUseQuery.mockReturnValue({
        data: mockUser,
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn(),
        isRefetching: false,
      } as any)

      const { result } = renderHook(() => useCurrentUser())

      expect(result.current.isJobSeeker).toBe(false)
      expect(result.current.isEmployer).toBe(false)
      expect(result.current.isAdmin).toBe(true)
    })
  })

  describe('Display Helpers', () => {
    it('should return display name from user name', () => {
      const mockSession = {
        user: { email: 'test@example.com', name: 'John Doe' },
        expires: '2024-12-31',
      }

      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
        update: jest.fn(),
      })

      const mockUser: CurrentUser = {
        id: '1',
        name: 'John Doe',
        email: 'test@example.com',
        role: 'SEEKER',
      }

      mockUseQuery.mockReturnValue({
        data: mockUser,
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn(),
        isRefetching: false,
      } as any)

      const { result } = renderHook(() => useCurrentUser())

      expect(result.current.displayName).toBe('John Doe')
    })

    it('should fallback to email username when no name', () => {
      const mockSession = {
        user: { email: 'john.doe@example.com', name: null },
        expires: '2024-12-31',
      }

      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
        update: jest.fn(),
      })

      const mockUser: CurrentUser = {
        id: '1',
        name: null,
        email: 'john.doe@example.com',
        role: 'SEEKER',
      }

      mockUseQuery.mockReturnValue({
        data: mockUser,
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn(),
        isRefetching: false,
      } as any)

      const { result } = renderHook(() => useCurrentUser())

      expect(result.current.displayName).toBe('john.doe')
    })

    it('should fallback to "User" when no name or email', () => {
      const mockSession = {
        user: { email: 'test@example.com', name: null },
        expires: '2024-12-31',
      }

      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
        update: jest.fn(),
      })

      const mockUser: CurrentUser = {
        id: '1',
        name: null,
        email: null,
        role: 'SEEKER',
      }

      mockUseQuery.mockReturnValue({
        data: mockUser,
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn(),
        isRefetching: false,
      } as any)

      const { result } = renderHook(() => useCurrentUser())

      expect(result.current.displayName).toBe('User')
    })

    it('should generate correct initials from name', () => {
      const mockSession = {
        user: { email: 'test@example.com', name: 'John Doe Smith' },
        expires: '2024-12-31',
      }

      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
        update: jest.fn(),
      })

      const mockUser: CurrentUser = {
        id: '1',
        name: 'John Doe Smith',
        email: 'test@example.com',
        role: 'SEEKER',
      }

      mockUseQuery.mockReturnValue({
        data: mockUser,
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn(),
        isRefetching: false,
      } as any)

      const { result } = renderHook(() => useCurrentUser())

      expect(result.current.initials).toBe('JD')
    })

    it('should generate initials from email when no name', () => {
      const mockSession = {
        user: { email: 'john@example.com', name: null },
        expires: '2024-12-31',
      }

      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
        update: jest.fn(),
      })

      const mockUser: CurrentUser = {
        id: '1',
        name: null,
        email: 'john@example.com',
        role: 'SEEKER',
      }

      mockUseQuery.mockReturnValue({
        data: mockUser,
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn(),
        isRefetching: false,
      } as any)

      const { result } = renderHook(() => useCurrentUser())

      expect(result.current.initials).toBe('J')
    })
  })

  describe('Query Configuration', () => {
    it('should not enable query when not authenticated', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      })

      const mockQueryFn = jest.fn()
      mockUseQuery.mockImplementation(({ enabled }) => {
        expect(enabled).toBe(false)
        return {
          data: undefined,
          isLoading: false,
          isError: false,
          error: null,
          refetch: jest.fn(),
          isRefetching: false,
        } as any
      })

      renderHook(() => useCurrentUser())

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: false,
        })
      )
    })

    it('should enable query when authenticated', () => {
      const mockSession = {
        user: { email: 'test@example.com', name: 'Test User' },
        expires: '2024-12-31',
      }

      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
        update: jest.fn(),
      })

      mockUseQuery.mockImplementation(({ enabled }) => {
        expect(enabled).toBe(true)
        return {
          data: undefined,
          isLoading: false,
          isError: false,
          error: null,
          refetch: jest.fn(),
          isRefetching: false,
        } as any
      })

      renderHook(() => useCurrentUser())

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: true,
        })
      )
    })

    it('should use correct query key with user email', () => {
      const mockSession = {
        user: { email: 'test@example.com', name: 'Test User' },
        expires: '2024-12-31',
      }

      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
        update: jest.fn(),
      })

      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn(),
        isRefetching: false,
      } as any)

      renderHook(() => useCurrentUser())

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['currentUser', 'test@example.com'],
        })
      )
    })
  })

  describe('useCurrentUserSync', () => {
    it('should return user when authenticated', () => {
      const mockSession = {
        user: { email: 'test@example.com', name: 'Test User' },
        expires: '2024-12-31',
      }

      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
        update: jest.fn(),
      })

      const mockUser: CurrentUser = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'SEEKER',
      }

      mockUseQuery.mockReturnValue({
        data: mockUser,
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn(),
        isRefetching: false,
      } as any)

      const { result } = renderHook(() => useCurrentUserSync())

      expect(result.current).toEqual(mockUser)
    })

    it('should return null when not authenticated', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      })

      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn(),
        isRefetching: false,
      } as any)

      const { result } = renderHook(() => useCurrentUserSync())

      expect(result.current).toBeNull()
    })
  })
})