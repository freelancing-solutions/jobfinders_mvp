'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'

// TypeScript interfaces for user data
export interface JobSeekerProfile {
  type: 'jobSeeker'
  professionalTitle?: string
  location?: string
  phone?: string
  experienceYears?: number
  availability?: string
  remoteWorkPreference?: boolean
  salaryExpectationMin?: number
  salaryExpectationMax?: number
  currency?: string
}

export interface EmployerProfile {
  type: 'employer'
  companyName?: string
  companySize?: string
  industry?: string
  website?: string
  location?: string
  phone?: string
}

export interface CurrentUser {
  id: string
  name?: string | null
  email?: string | null
  role?: string
  image?: string | null
  subscription?: string | null
  createdAt?: string
  updatedAt?: string
  profile?: JobSeekerProfile | EmployerProfile
}

/**
 * Custom hook for fetching current user data
 * Integrates with NextAuth session and TanStack Query for optimal caching
 * Only fetches when user is authenticated to avoid unnecessary API calls
 */
export function useCurrentUser() {
  const { data: session, status } = useSession()
  
  // Only enable query when user is authenticated
  const isAuthenticated = status === 'authenticated' && !!session?.user?.email

  const {
    data: user,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching
  } = useQuery<CurrentUser>({
    queryKey: ['currentUser', session?.user?.email],
    queryFn: async (): Promise<CurrentUser> => {
      const response = await fetch('/api/user/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for session
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required')
        }
        if (response.status === 404) {
          throw new Error('User not found')
        }
        throw new Error(`Failed to fetch user data: ${response.statusText}`)
      }

      return response.json()
    },
    enabled: isAuthenticated, // Only run query when authenticated
    staleTime: 5 * 60 * 1000, // 5 minutes - user data doesn't change frequently
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache longer
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error instanceof Error && error.message.includes('Authentication required')) {
        return false
      }
      // Retry up to 2 times for other errors
      return failureCount < 2
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  })

  // Return comprehensive state
  return {
    // User data
    user,
    
    // Loading states
    isLoading: status === 'loading' || (isAuthenticated && isLoading),
    isRefetching,
    
    // Authentication states
    isAuthenticated,
    isUnauthenticated: status === 'unauthenticated',
    
    // Error states
    isError,
    error,
    
    // Actions
    refetch,
    
    // Convenience getters
    isJobSeeker: user?.role === 'SEEKER',
    isEmployer: user?.role === 'EMPLOYER',
    isAdmin: user?.role === 'ADMIN',
    
    // Profile helpers
    jobSeekerProfile: user?.profile?.type === 'jobSeeker' ? user.profile : null,
    employerProfile: user?.profile?.type === 'employer' ? user.profile : null,
    
    // Display helpers
    displayName: user?.name || user?.email?.split('@')[0] || 'User',
    avatarUrl: user?.image,
    initials: user?.name 
      ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
      : user?.email?.[0]?.toUpperCase() || 'U'
  }
}

/**
 * Hook for getting user data synchronously (returns null if not loaded)
 * Useful for components that need to render immediately without loading states
 */
export function useCurrentUserSync() {
  const { user, isAuthenticated } = useCurrentUser()
  return isAuthenticated ? user : null
}