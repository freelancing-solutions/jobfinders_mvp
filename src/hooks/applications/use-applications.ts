/**
 * Custom hooks for application management
 * Provides convenient hooks for common application operations
 */

import { useEffect, useCallback, useMemo } from 'react'
import { useApplicationStore } from '@/stores/applications'
import { Application, ApplicationFilters, ApplicationListConfig } from '@/types/applications'

/**
 * Hook for fetching and managing applications
 */
export function useApplications(request?: {
  filters?: ApplicationFilters
  config?: Partial<ApplicationListConfig>
  autoFetch?: boolean
}) {
  const {
    applications,
    isLoading,
    isLoadingMore,
    isRefreshing,
    error,
    currentPage,
    totalApplications,
    hasMore,
    config,
    fetchApplications,
    fetchMoreApplications,
    refreshApplications,
    updateConfig,
    setFilters,
    clearError,
  } = useApplicationStore()

  // Apply custom config on mount
  useEffect(() => {
    if (request?.config) {
      updateConfig(request.config)
    }
    if (request?.filters) {
      setFilters(request.filters)
    }
  }, [request?.config, request?.filters, updateConfig, setFilters])

  // Auto-fetch on mount
  useEffect(() => {
    if (request?.autoFetch !== false) {
      fetchApplications()
    }
  }, [fetchApplications, request?.autoFetch])

  const loadMore = useCallback(() => {
    if (hasMore && !isLoadingMore) {
      fetchMoreApplications()
    }
  }, [hasMore, isLoadingMore, fetchMoreApplications])

  const retry = useCallback(() => {
    clearError()
    refreshApplications()
  }, [clearError, refreshApplications])

  return {
    applications,
    isLoading,
    isLoadingMore,
    isRefreshing,
    error,
    currentPage,
    totalApplications,
    hasMore,
    config,
    loadMore,
    refresh: refreshApplications,
    retry,
    updateConfig,
    setFilters,
  }
}

/**
 * Hook for a single application
 */
export function useApplication(id: string) {
  const {
    selectedApplication,
    applications,
    isLoading,
    error,
    fetchApplication,
    updateApplicationStatus,
    addNote,
    uploadAttachment,
    deleteApplication,
    archiveApplication,
    withdrawApplication,
  } = useApplicationStore()

  const application = useMemo(() => {
    if (selectedApplication?.id === id) {
      return selectedApplication
    }
    return applications.find(app => app.id === id)
  }, [selectedApplication, applications, id])

  // Fetch application if not available
  useEffect(() => {
    if (id && !application && !isLoading) {
      fetchApplication(id)
    }
  }, [id, application, isLoading, fetchApplication])

  const updateStatus = useCallback(async (
    status: Application['status'],
    note?: string
  ) => {
    await updateApplicationStatus(id, status, note)
  }, [updateApplicationStatus, id])

  const addApplicationNote = useCallback(async (
    content: string,
    isPrivate: boolean = false
  ) => {
    await addNote(id, content, isPrivate)
  }, [addNote, id])

  const uploadFile = useCallback(async (
    file: File,
    description?: string
  ) => {
    await uploadAttachment(id, file, description)
  }, [uploadAttachment, id])

  const removeApplication = useCallback(async () => {
    await deleteApplication(id)
  }, [deleteApplication, id])

  const archive = useCallback(async () => {
    await archiveApplication(id)
  }, [archiveApplication, id])

  const withdraw = useCallback(async (reason?: string) => {
    await withdrawApplication(id, reason)
  }, [withdrawApplication, id])

  return {
    application,
    isLoading,
    error,
    updateStatus,
    addNote: addApplicationNote,
    uploadFile,
    delete: removeApplication,
    archive,
    withdraw,
    refresh: () => fetchApplication(id),
  }
}

/**
 * Hook for application statistics
 */
export function useApplicationStats(filters?: ApplicationFilters) {
  const { stats, fetchStats, isLoading } = useApplicationStore()

  useEffect(() => {
    fetchStats(filters)
  }, [fetchStats, filters])

  return { stats, isLoading, refresh: () => fetchStats(filters) }
}

/**
 * Hook for application selection
 */
export function useApplicationSelection() {
  const {
    applications,
    selectedApplications,
    selectApplication,
    toggleApplicationSelection,
    selectAllApplications,
    clearSelection,
    bulkUpdateStatus,
    bulkArchive,
    bulkDelete,
  } = useApplicationStore()

  const selectedApps = useMemo(() => {
    return applications.filter(app => selectedApplications.includes(app.id))
  }, [applications, selectedApplications])

  const toggleSelection = useCallback((id: string) => {
    toggleApplicationSelection(id)
  }, [toggleApplicationSelection])

  const selectAll = useCallback(() => {
    selectAllApplications()
  }, [selectAllApplications])

  const clear = useCallback(() => {
    clearSelection()
  }, [clearSelection])

  const bulkUpdate = useCallback(async (status: Application['status']) => {
    await bulkUpdateStatus(selectedApplications, status)
  }, [selectedApplications, bulkUpdateStatus])

  const bulkArchiveApps = useCallback(async () => {
    await bulkArchive(selectedApplications)
  }, [selectedApplications, bulkArchive])

  const bulkDeleteApps = useCallback(async () => {
    await bulkDelete(selectedApplications)
  }, [selectedApplications, bulkDelete])

  return {
    selectedApplications,
    selectedApps,
    count: selectedApplications.length,
    isAllSelected: applications.length > 0 && selectedApplications.length === applications.length,
    toggleSelection,
    selectAll,
    clear,
    bulkUpdate,
    bulkArchive: bulkArchiveApps,
    bulkDelete: bulkDeleteApps,
  }
}

/**
 * Hook for application filters
 */
export function useApplicationFilters() {
  const { config, setFilters, resetFilters } = useApplicationStore()

  const updateFilter = useCallback((key: keyof ApplicationFilters, value: any) => {
    setFilters({ [key]: value })
  }, [setFilters])

  const clearFilters = useCallback(() => {
    resetFilters()
  }, [resetFilters])

  const hasActiveFilters = useMemo(() => {
    return Object.keys(config.filters).length > 0
  }, [config.filters])

  const activeFilterCount = useMemo(() => {
    return Object.keys(config.filters).length
  }, [config.filters])

  return {
    filters: config.filters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    activeFilterCount,
  }
}

/**
 * Hook for application search
 */
export function useApplicationSearch() {
  const { searchApplications } = useApplicationStore()
  const [isSearching, setIsSearching] = React.useState(false)
  const [searchResults, setSearchResults] = React.useState<Application[]>([])
  const [searchError, setSearchError] = React.useState<string | null>(null)

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    setSearchError(null)

    try {
      const results = await searchApplications(query)
      setSearchResults(results)
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'Search failed')
    } finally {
      setIsSearching(false)
    }
  }, [searchApplications])

  const clearSearch = useCallback(() => {
    setSearchResults([])
    setSearchError(null)
  }, [])

  return {
    isSearching,
    searchResults,
    searchError,
    search,
    clearSearch,
  }
}

/**
 * Hook for application real-time updates
 */
export function useApplicationRealtime() {
  const [isConnected, setIsConnected] = React.useState(false)
  const [lastUpdate, setLastUpdate] = React.useState<string | null>(null)

  useEffect(() => {
    // Check WebSocket connection status
    const checkConnection = () => {
      const state = useApplicationStore.getState()
      setIsConnected(state.isWebSocketConnected)
      setLastUpdate(state.lastUpdated)
    }

    checkConnection()

    // Set up interval to check connection status
    const interval = setInterval(checkConnection, 1000)

    return () => clearInterval(interval)
  }, [])

  return { isConnected, lastUpdate }
}

/**
 * Hook for application quick filters
 */
export function useApplicationQuickFilters() {
  const { applyQuickFilter } = useApplicationStore()

  const applyFilter = useCallback((filter: 'active' | 'archived' | 'interviews' | 'offers') => {
    applyQuickFilter(filter)
  }, [applyQuickFilter])

  return { applyFilter }
}

/**
 * Hook for application export
 */
export function useApplicationExport() {
  const [isExporting, setIsExporting] = React.useState(false)
  const [exportError, setExportError] = React.useState<string | null>(null)

  const exportApplications = useCallback(async (
    format: 'pdf' | 'excel' | 'csv' | 'json',
    applicationIds: string[]
  ) => {
    setIsExporting(true)
    setExportError(null)

    try {
      // This would integrate with the export service
      // For now, just return the export config
      const exportConfig = {
        format,
        fields: ['id', 'status', 'appliedAt', 'job', 'company', 'matchScore'],
        filters: { id: applicationIds },
        includeAnalytics: true,
        includeTimeline: true,
        includeAttachments: false,
      }

      // TODO: Implement actual export functionality
      console.log('Export config:', exportConfig)

      return exportConfig
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Export failed')
      throw error
    } finally {
      setIsExporting(false)
    }
  }, [])

  return {
    isExporting,
    exportError,
    exportApplications,
  }
}

// Import React for useState hook
import React from 'react'