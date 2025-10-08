'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { ApplicationStatus } from '@/components/applications/status-badge'

export interface Application {
  id: string
  jobId: string
  userId: string
  status: ApplicationStatus
  appliedAt: string
  updatedAt: string
  job: {
    id: string
    title: string
    company: {
      id: string
      name: string
      logo?: string
      location?: string
    }
    location: string
    salaryMin?: number
    salaryMax?: number
    currency: string
    positionType: string
    remotePolicy: string
    description: string
    requirements: string[]
    isFeatured: boolean
    isUrgent: boolean
    postedAt: string
    expiresAt?: string
    applicationCount: number
  }
  resume?: {
    id: string
    title: string
    fileUrl: string
  }
  coverLetter?: string
  notes?: string
  matchScore?: number
  viewCount?: number
  timeline?: Array<{
    status: ApplicationStatus
    timestamp: string
    note?: string
    updatedBy: string
    updatedByRole?: string
  }>
}

export interface ApplicationFilters {
  search?: string
  status?: string[]
  startDate?: string
  endDate?: string
  companies?: string[]
  locations?: string[]
  positionTypes?: string[]
  salaryRanges?: string[]
  remotePolicies?: string[]
  hasMatchScore?: boolean | null
  archived?: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface UseApplicationsOptions {
  autoFetch?: boolean
  pageSize?: number
}

export interface ApplicationStats {
  total: number
  active: number
  archived: number
  byStatus: Record<string, number>
  byCompany: Array<{
    companyName: string
    count: number
    successRate: number
  }>
  byTimePeriod: Array<{
    period: string
    applications: number
    interviews: number
    offers: number
    rejections: number
    successRate: number
  }>
  responseMetrics: {
    averageResponseTime: number
    responseRate: number
    interviewRate: number
    offerRate: number
  }
  topSkills: Array<{
    skill: string
    count: number
    successRate: number
  }>
  salaryInsights: {
    averageMin: number
    median: number
    marketRate: number
  }
}

export interface UseApplicationsReturn {
  applications: Application[]
  stats: ApplicationStats | null
  loading: boolean
  error: string | null
  hasActiveFilters: boolean
  activeFilterCount: number
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  filters: ApplicationFilters
  updateFilters: (filters: Partial<ApplicationFilters>) => void
  clearFilters: () => void
  updatePagination: (page: number) => void
  setView: (view: string) => void
  refresh: () => void
  search: () => void
  fetchMore: () => void
  updateApplicationStatus: (id: string, status: ApplicationStatus) => Promise<void>
  withdrawApplication: (id: string) => Promise<void>
  archiveApplication: (id: string) => Promise<void>
  deleteApplication: (id: string) => Promise<void>
  addNote: (id: string, note: string) => Promise<void>
  exportApplications: (format: 'csv' | 'json') => Promise<void>
}

const defaultFilters: ApplicationFilters = {
  search: '',
  status: [],
  companies: [],
  locations: [],
  positionTypes: [],
  salaryRanges: [],
  remotePolicies: [],
  hasMatchScore: null,
  archived: false,
  sortBy: 'appliedAt',
  sortOrder: 'desc',
}

export function useApplications(options: UseApplicationsOptions = {}): UseApplicationsReturn {
  const { data: session } = useSession()
  const { autoFetch = true, pageSize = 20 } = options

  const [applications, setApplications] = useState<Application[]>([])
  const [stats, setStats] = useState<ApplicationStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: pageSize,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })
  const [filters, setFilters] = useState<ApplicationFilters>(defaultFilters)

  // Build query parameters for API
  const buildQueryParams = useCallback((page: number = 1) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: pagination.limit.toString(),
    })

    if (filters.sortBy) params.append('sortBy', filters.sortBy)
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder)
    if (filters.search) params.append('search', filters.search)
    if (filters.status && filters.status.length > 0) params.append('status', filters.status.join(','))
    if (filters.startDate) params.append('startDate', filters.startDate)
    if (filters.endDate) params.append('endDate', filters.endDate)
    if (filters.companies && filters.companies.length > 0) params.append('companies', filters.companies.join(','))
    if (filters.locations && filters.locations.length > 0) params.append('locations', filters.locations.join(','))
    if (filters.positionTypes && filters.positionTypes.length > 0) params.append('positionTypes', filters.positionTypes.join(','))
    if (filters.salaryRanges && filters.salaryRanges.length > 0) params.append('salaryRanges', filters.salaryRanges.join(','))
    if (filters.remotePolicies && filters.remotePolicies.length > 0) params.append('remotePolicies', filters.remotePolicies.join(','))
    if (filters.hasMatchScore !== null && filters.hasMatchScore !== undefined) params.append('hasMatchScore', filters.hasMatchScore.toString())
    if (filters.archived) params.append('archived', 'true')

    return params
  }, [filters, pagination.limit])

  // Fetch application stats
  const fetchStats = useCallback(async () => {
    if (!session?.user?.id) return

    try {
      const response = await fetch('/api/applications/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch application stats')
      }

      const data = await response.json()

      if (data.success) {
        setStats(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err)
      // Don't set error for stats failure to avoid blocking the main functionality
    }
  }, [session?.user?.id])

  // Fetch applications
  const fetchApplications = useCallback(async (page: number = 1, append: boolean = false) => {
    if (!session?.user?.id) return

    try {
      setLoading(true)
      setError(null)

      const params = buildQueryParams(page)
      const response = await fetch(`/api/applications?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch applications')
      }

      const data = await response.json()

      if (data.success) {
        const newApplications = data.data || []
        setApplications(prev => append ? [...prev, ...newApplications] : newApplications)
        setPagination(data.pagination || pagination)

        // Fetch stats when we get applications
        if (!append) {
          fetchStats()
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch applications')
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id, buildQueryParams, pagination, fetchStats])

  // Update application status
  const updateApplicationStatus = useCallback(async (id: string, status: ApplicationStatus) => {
    if (!session?.user?.id) return

    try {
      const response = await fetch(`/api/applications/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        throw new Error('Failed to update application status')
      }

      const data = await response.json()

      if (data.success) {
        setApplications(prev =>
          prev.map(app =>
            app.id === id ? { ...app, ...data.data } : app
          )
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update application status')
      throw err
    }
  }, [session?.user?.id])

  // Withdraw application
  const withdrawApplication = useCallback(async (id: string) => {
    if (!session?.user?.id) return

    try {
      const response = await fetch(`/api/applications/${id}/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to withdraw application')
      }

      const data = await response.json()

      if (data.success) {
        setApplications(prev =>
          prev.map(app =>
            app.id === id ? { ...app, ...data.data } : app
          )
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to withdraw application')
      throw err
    }
  }, [session?.user?.id])

  // Archive application
  const archiveApplication = useCallback(async (id: string) => {
    if (!session?.user?.id) return

    try {
      const response = await fetch(`/api/applications/${id}/archive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to archive application')
      }

      const data = await response.json()

      if (data.success) {
        setApplications(prev =>
          prev.map(app =>
            app.id === id ? { ...app, ...data.data } : app
          )
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive application')
      throw err
    }
  }, [session?.user?.id])

  // Delete application
  const deleteApplication = useCallback(async (id: string) => {
    if (!session?.user?.id) return

    try {
      const response = await fetch(`/api/applications/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete application')
      }

      setApplications(prev => prev.filter(app => app.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete application')
      throw err
    }
  }, [session?.user?.id])

  // Add note to application
  const addNote = useCallback(async (id: string, note: string) => {
    if (!session?.user?.id || !note.trim()) return

    try {
      const response = await fetch(`/api/applications/${id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ note: note.trim() }),
      })

      if (!response.ok) {
        throw new Error('Failed to add note')
      }

      const data = await response.json()

      if (data.success) {
        setApplications(prev =>
          prev.map(app =>
            app.id === id ? { ...app, ...data.data } : app
          )
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add note')
      throw err
    }
  }, [session?.user?.id])

  // Export applications
  const exportApplications = useCallback(async (format: 'csv' | 'json') => {
    if (!session?.user?.id) return

    try {
      const params = buildQueryParams()
      params.append('format', format)

      const response = await fetch(`/api/applications?${params}`, {
        method: 'GET',
      })

      if (!response.ok) {
        throw new Error('Failed to export applications')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `applications-${format}-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export applications')
      throw err
    }
  }, [session?.user?.id, buildQueryParams])

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<ApplicationFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page when filters change
  }, [])

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters(defaultFilters)
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [])

  // Update pagination
  const updatePagination = useCallback((page: number) => {
    fetchApplications(page, false)
  }, [fetchApplications])

  // Set view
  const setView = useCallback((view: string) => {
    // Placeholder for view switching functionality
    console.log('Setting view to:', view)
  }, [])

  // Search
  const search = useCallback(() => {
    fetchApplications(1, false)
  }, [fetchApplications])

  // Refresh applications
  const refresh = useCallback(() => {
    fetchApplications(1, false)
    fetchStats()
  }, [fetchApplications, fetchStats])

  // Fetch more applications
  const fetchMore = useCallback(() => {
    if (pagination.hasNext && !loading) {
      fetchApplications(pagination.page + 1, true)
    }
  }, [fetchApplications, pagination.hasNext, pagination.page, loading])

  // Calculate active filters count
  const hasActiveFilters = Object.keys(defaultFilters).some(key => {
    const defaultValue = defaultFilters[key as keyof ApplicationFilters]
    const currentValue = filters[key as keyof ApplicationFilters]

    if (Array.isArray(defaultValue) && Array.isArray(currentValue)) {
      return currentValue.length > 0
    }

    if (typeof defaultValue === 'boolean' && typeof currentValue === 'boolean') {
      return currentValue !== defaultValue
    }

    return currentValue !== defaultValue && currentValue !== '' && currentValue !== undefined
  })

  const activeFilterCount = Object.keys(filters).filter(key => {
    const value = filters[key as keyof ApplicationFilters]
    return value !== undefined && value !== '' &&
           (Array.isArray(value) ? value.length > 0 : true)
  }).length

  // Auto-fetch applications when filters change
  useEffect(() => {
    if (autoFetch && session?.user?.id) {
      refresh()
    }
  }, [autoFetch, session?.user?.id, refresh])

  return {
    applications,
    stats,
    loading,
    error,
    hasActiveFilters,
    activeFilterCount,
    pagination,
    filters,
    updateFilters,
    clearFilters,
    updatePagination,
    setView,
    refresh,
    search,
    fetchMore,
    updateApplicationStatus,
    withdrawApplication,
    archiveApplication,
    deleteApplication,
    addNote,
    exportApplications,
  }
}