'use client'

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { jobsAPI, ApplicationData, ApplicationResponse } from '@/lib/api/jobs'
import { Job, JobSearchResponse, SearchFilters } from '@/types/jobs'

// Query keys
export const jobsKeys = {
  all: ['jobs'] as const,
  search: (filters: SearchFilters) => [...jobsKeys.all, 'search', filters] as const,
  details: (id: string) => [...jobsKeys.all, 'detail', id] as const,
  similar: (id: string) => [...jobsKeys.all, 'similar', id] as const,
  suggestions: (query: string) => [...jobsKeys.all, 'suggestions', query] as const,
  saved: () => [...jobsKeys.all, 'saved'] as const,
  applications: () => [...jobsKeys.all, 'applications'] as const,
  application: (id: string) => [...jobsKeys.applications(), id] as const,
}

// Hook for searching jobs
export function useSearchJobs(
  filters: SearchFilters & { page?: number; limit?: number },
  options?: Omit<UseQueryOptions<JobSearchResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: jobsKeys.search(filters),
    queryFn: () => jobsAPI.searchJobs(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

// Hook for getting job details
export function useJob(id: string, options?: Omit<UseQueryOptions<Job | null>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: jobsKeys.details(id),
    queryFn: () => jobsAPI.getJobById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  })
}

// Hook for getting similar jobs
export function useSimilarJobs(id: string, limit = 5, options?: Omit<UseQueryOptions<Job[]>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: jobsKeys.similar(id),
    queryFn: () => jobsAPI.getSimilarJobs(id, limit),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    ...options,
  })
}

// Hook for getting job suggestions
export function useJobSuggestions(query: string, options?: Omit<UseQueryOptions<string[]>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: jobsKeys.suggestions(query),
    queryFn: () => jobsAPI.getJobSuggestions(query),
    enabled: !!query && query.length > 2,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    ...options,
  })
}

// Hook for getting saved jobs
export function useSavedJobs(options?: Omit<UseQueryOptions<Job[]>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: jobsKeys.saved(),
    queryFn: () => jobsAPI.getSavedJobs(),
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

// Hook for saving a job
export function useSaveJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (jobId: string) => jobsAPI.saveJob(jobId),
    onSuccess: () => {
      // Invalidate saved jobs query
      queryClient.invalidateQueries({ queryKey: jobsKeys.saved() })
    },
    onError: (error) => {
      console.error('Failed to save job:', error)
    },
  })
}

// Hook for unsaving a job
export function useUnsaveJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (jobId: string) => jobsAPI.unsaveJob(jobId),
    onSuccess: () => {
      // Invalidate saved jobs query
      queryClient.invalidateQueries({ queryKey: jobsKeys.saved() })
    },
    onError: (error) => {
      console.error('Failed to unsave job:', error)
    },
  })
}

// Hook for applying to a job
export function useApplyToJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ jobId, data }: { jobId: string; data: ApplicationData }) =>
      jobsAPI.applyToJob(jobId, data),
    onSuccess: (_, { jobId }) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: jobsKeys.details(jobId) })
      queryClient.invalidateQueries({ queryKey: jobsKeys.applications() })
    },
    onError: (error) => {
      console.error('Failed to apply to job:', error)
    },
  })
}

// Hook for getting application status
export function useApplicationStatus(
  applicationId: string,
  options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: jobsKeys.application(applicationId),
    queryFn: () => jobsAPI.getApplicationStatus(applicationId),
    enabled: !!applicationId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

// Hook for prefetching job details
export function usePrefetchJob() {
  const queryClient = useQueryClient()

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: jobsKeys.details(id),
      queryFn: () => jobsAPI.getJobById(id),
      staleTime: 5 * 60 * 1000, // 5 minutes
    })
  }
}

// Hook for prefetching similar jobs
export function usePrefetchSimilarJobs() {
  const queryClient = useQueryClient()

  return (id: string, limit = 5) => {
    queryClient.prefetchQuery({
      queryKey: jobsKeys.similar(id),
      queryFn: () => jobsAPI.getSimilarJobs(id, limit),
      staleTime: 10 * 60 * 1000, // 10 minutes
    })
  }
}

// Hook for clearing jobs cache
export function useClearJobsCache() {
  const queryClient = useQueryClient()

  return () => {
    // Clear all jobs-related queries
    queryClient.invalidateQueries({ queryKey: jobsKeys.all })
    // Also clear the API cache
    jobsAPI.clearCache()
  }
}

// Hook for getting search analytics (for admin/insights)
export function useSearchAnalytics(filters: SearchFilters) {
  return useQuery({
    queryKey: [...jobsKeys.search(filters), 'analytics'],
    queryFn: async () => {
      // This would call an analytics endpoint if available
      // For now, return basic analytics from the search response
      const response = await jobsAPI.searchJobs({ ...filters, limit: 1 })
      return {
        totalResults: response.pagination.total,
        availableFilters: response.facets,
        searchPerformed: new Date().toISOString(),
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Combined hook for job search with suggestions
export function useJobSearchWithSuggestions(
  filters: SearchFilters & { page?: number; limit?: number }
) {
  const searchQuery = useSearchJobs(filters)
  const suggestionsQuery = useJobSuggestions(filters.query || '')

  return {
    search: searchQuery,
    suggestions: suggestionsQuery,
    isLoading: searchQuery.isLoading || suggestionsQuery.isLoading,
    error: searchQuery.error || suggestionsQuery.error,
  }
}