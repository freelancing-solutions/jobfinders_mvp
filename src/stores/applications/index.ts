/**
 * Application Store for JobFinders MVP
 * Zustand store for managing application state with real-time updates
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import {
  Application,
  ApplicationFilters,
  ApplicationListConfig,
  ApplicationStats,
  ApplicationStatus,
  ApplicationUpdateEvent,
  GetApplicationsRequest,
  GetApplicationsResponse,
} from '@/types/applications'
import { applicationService } from '@/services/applications'

/**
 * Application Store State Interface
 */
interface ApplicationStoreState {
  // Core data
  applications: Application[]
  selectedApplication: Application | null
  stats: ApplicationStats | null

  // Loading states
  isLoading: boolean
  isLoadingMore: boolean
  isRefreshing: boolean

  // Pagination
  currentPage: number
  totalPages: number
  totalApplications: number
  hasMore: boolean

  // List configuration
  config: ApplicationListConfig

  // Real-time updates
  isWebSocketConnected: boolean
  lastUpdated: string | null

  // Error handling
  error: string | null

  // UI state
  sidebarOpen: boolean
  filtersOpen: boolean
  viewMode: 'list' | 'grid' | 'compact'
  selectedApplications: string[]
}

/**
 * Application Store Actions Interface
 */
interface ApplicationStoreActions {
  // Data fetching
  fetchApplications: (request?: GetApplicationsRequest) => Promise<void>
  fetchMoreApplications: () => Promise<void>
  refreshApplications: () => Promise<void>
  fetchApplication: (id: string) => Promise<void>
  fetchStats: (filters?: ApplicationFilters) => Promise<void>

  // Application management
  createApplication: (data: any) => Promise<Application>
  updateApplication: (id: string, data: any) => Promise<Application>
  updateApplicationStatus: (id: string, status: ApplicationStatus, note?: string) => Promise<void>
  deleteApplication: (id: string) => Promise<void>
  archiveApplication: (id: string) => Promise<void>
  withdrawApplication: (id: string, reason?: string) => Promise<void>

  // Application interactions
  addNote: (id: string, content: string, isPrivate?: boolean) => Promise<void>
  uploadAttachment: (id: string, file: File, description?: string) => Promise<void>

  // List configuration
  updateConfig: (config: Partial<ApplicationListConfig>) => void
  setFilters: (filters: Partial<ApplicationFilters>) => void
  setViewMode: (mode: 'list' | 'grid' | 'compact') => void
  resetFilters: () => void

  // Selection
  selectApplication: (id: string | null) => void
  toggleApplicationSelection: (id: string) => void
  selectAllApplications: () => void
  clearSelection: () => void

  // Bulk actions
  bulkUpdateStatus: (ids: string[], status: ApplicationStatus) => Promise<void>
  bulkArchive: (ids: string[]) => Promise<void>
  bulkDelete: (ids: string[]) => Promise<void>

  // Search and filtering
  searchApplications: (query: string) => Promise<void>
  applyQuickFilter: (filter: 'active' | 'archived' | 'interviews' | 'offers') => void

  // UI state
  setSidebarOpen: (open: boolean) => void
  setFiltersOpen: (open: boolean) => void

  // WebSocket handling
  handleRealtimeUpdate: (event: ApplicationUpdateEvent) => void

  // Error handling
  setError: (error: string | null) => void
  clearError: () => void

  // Reset store
  reset: () => void
}

/**
 * Default list configuration
 */
const defaultConfig: ApplicationListConfig = {
  viewMode: 'list',
  sortBy: 'date',
  sortOrder: 'desc',
  pageSize: 20,
  showAnalytics: true,
  showTimeline: false,
  showMatchScore: true,
  showNotes: false,
  filters: {},
}

/**
 * Create the application store
 */
export const useApplicationStore = create<ApplicationStoreState & ApplicationStoreActions>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    applications: [],
    selectedApplication: null,
    stats: null,
    isLoading: false,
    isLoadingMore: false,
    isRefreshing: false,
    currentPage: 1,
    totalPages: 1,
    totalApplications: 0,
    hasMore: true,
    config: defaultConfig,
    isWebSocketConnected: false,
    lastUpdated: null,
    error: null,
    sidebarOpen: true,
    filtersOpen: false,
    viewMode: 'list',
    selectedApplications: [],

    // Data fetching actions
    fetchApplications: async (request) => {
      const state = get()

      if (request?.query?.page === 1) {
        set({ isLoading: true, error: null })
      }

      try {
        const response = await applicationService.getApplications({
          query: {
            page: request?.query?.page || state.currentPage,
            pageSize: state.config.pageSize,
            status: state.config.filters.status,
            dateFrom: state.config.filters.dateFrom,
            dateTo: state.config.filters.dateTo,
            company: state.config.filters.company?.join(','),
            jobTitle: state.config.filters.jobTitle,
            search: state.config.filters.search,
            sortBy: state.config.sortBy,
            sortOrder: state.config.sortOrder,
            includeAnalytics: state.config.showAnalytics,
            includeNotes: state.config.showNotes,
            ...request?.query,
          },
        })

        set({
          applications: request?.query?.page && request.query.page > 1
            ? [...state.applications, ...response.applications]
            : response.applications,
          totalApplications: response.total,
          currentPage: response.page,
          totalPages: Math.ceil(response.total / state.config.pageSize),
          hasMore: response.hasMore,
          stats: response.stats || state.stats,
          isLoading: false,
          isLoadingMore: false,
          isRefreshing: false,
          lastUpdated: new Date().toISOString(),
        })
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to fetch applications',
          isLoading: false,
          isLoadingMore: false,
          isRefreshing: false,
        })
      }
    },

    fetchMoreApplications: async () => {
      const state = get()
      if (!state.hasMore || state.isLoadingMore) return

      set({ isLoadingMore: true })
      await state.fetchApplications({
        query: { page: state.currentPage + 1 },
      })
    },

    refreshApplications: async () => {
      set({ isRefreshing: true })
      const state = get()
      await state.fetchApplications({
        query: { page: 1 },
      })
    },

    fetchApplication: async (id) => {
      try {
        const application = await applicationService.getApplication(id)
        set(state => ({
          selectedApplication: application,
          applications: state.applications.map(app =>
            app.id === id ? application : app
          ),
        }))
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to fetch application',
        })
      }
    },

    fetchStats: async (filters) => {
      try {
        const stats = await applicationService.getApplicationStats(filters)
        set({ stats })
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      }
    },

    // Application management actions
    createApplication: async (data) => {
      try {
        const application = await applicationService.createApplication(data)
        set(state => ({
          applications: [application, ...state.applications],
          totalApplications: state.totalApplications + 1,
        }))
        return application
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to create application',
        })
        throw error
      }
    },

    updateApplication: async (id, data) => {
      try {
        const application = await applicationService.updateApplication(id, data)
        set(state => ({
          selectedApplication: state.selectedApplication?.id === id ? application : state.selectedApplication,
          applications: state.applications.map(app =>
            app.id === id ? application : app
          ),
        }))
        return application
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to update application',
        })
        throw error
      }
    },

    updateApplicationStatus: async (id, status, note) => {
      try {
        await applicationService.updateApplicationStatus(id, status, note)
        get().fetchApplications() // Refresh to get updated data
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to update application status',
        })
      }
    },

    deleteApplication: async (id) => {
      try {
        await applicationService.deleteApplication(id)
        set(state => ({
          applications: state.applications.filter(app => app.id !== id),
          selectedApplication: state.selectedApplication?.id === id ? null : state.selectedApplication,
          selectedApplications: state.selectedApplications.filter(selectedId => selectedId !== id),
          totalApplications: state.totalApplications - 1,
        }))
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to delete application',
        })
      }
    },

    archiveApplication: async (id) => {
      try {
        await applicationService.archiveApplication(id)
        get().fetchApplications() // Refresh to get updated data
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to archive application',
        })
      }
    },

    withdrawApplication: async (id, reason) => {
      try {
        await applicationService.withdrawApplication(id, reason)
        get().fetchApplications() // Refresh to get updated data
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to withdraw application',
        })
      }
    },

    // Application interactions
    addNote: async (id, content, isPrivate = false) => {
      try {
        await applicationService.addApplicationNote(id, {
          content,
          isPrivate,
          tags: [],
          createdBy: 'current-user', // This would come from auth context
        })
        get().fetchApplication(id) // Refresh application data
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to add note',
        })
      }
    },

    uploadAttachment: async (id, file, description) => {
      try {
        await applicationService.uploadAttachment(id, file, description)
        get().fetchApplication(id) // Refresh application data
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to upload attachment',
        })
      }
    },

    // List configuration actions
    updateConfig: (configUpdate) => {
      set(state => ({
        config: { ...state.config, ...configUpdate },
      }))
    },

    setFilters: (filters) => {
      set(state => ({
        config: {
          ...state.config,
          filters: { ...state.config.filters, ...filters },
        },
      }))
    },

    setViewMode: (mode) => {
      set(state => ({
        config: { ...state.config, viewMode: mode },
        viewMode: mode,
      }))
    },

    resetFilters: () => {
      set(state => ({
        config: {
          ...state.config,
          filters: {},
        },
      }))
    },

    // Selection actions
    selectApplication: (id) => {
      const application = id ? get().applications.find(app => app.id === id) || null : null
      set({ selectedApplication: application })
    },

    toggleApplicationSelection: (id) => {
      set(state => ({
        selectedApplications: state.selectedApplications.includes(id)
          ? state.selectedApplications.filter(selectedId => selectedId !== id)
          : [...state.selectedApplications, id],
      }))
    },

    selectAllApplications: () => {
      const allIds = get().applications.map(app => app.id)
      set({ selectedApplications: allIds })
    },

    clearSelection: () => {
      set({ selectedApplications: [] })
    },

    // Bulk actions
    bulkUpdateStatus: async (ids, status) => {
      try {
        await applicationService.performBulkAction({
          type: 'update_status',
          applicationIds: ids,
          data: { status },
        })
        get().fetchApplications()
        get().clearSelection()
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to update applications',
        })
      }
    },

    bulkArchive: async (ids) => {
      try {
        await applicationService.performBulkAction({
          type: 'archive',
          applicationIds: ids,
        })
        get().fetchApplications()
        get().clearSelection()
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to archive applications',
        })
      }
    },

    bulkDelete: async (ids) => {
      try {
        await applicationService.performBulkAction({
          type: 'delete',
          applicationIds: ids,
          confirmRequired: true,
        })
        get().fetchApplications()
        get().clearSelection()
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to delete applications',
        })
      }
    },

    // Search and filtering
    searchApplications: async (query) => {
      try {
        const results = await applicationService.searchApplications(query)
        set({
          applications: results,
          totalApplications: results.length,
          currentPage: 1,
        })
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to search applications',
        })
      }
    },

    applyQuickFilter: (filter) => {
      const state = get()
      let filters: Partial<ApplicationFilters> = {}

      switch (filter) {
        case 'active':
          filters.isArchived = false
          break
        case 'archived':
          filters.isArchived = true
          break
        case 'interviews':
          filters.status = ['interview_scheduled', 'interview_completed']
          break
        case 'offers':
          filters.status = ['offered']
          break
      }

      state.setFilters(filters)
      state.fetchApplications()
    },

    // UI state actions
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    setFiltersOpen: (open) => set({ filtersOpen: open }),

    // WebSocket handling
    handleRealtimeUpdate: (event) => {
      const state = get()

      switch (event.type) {
        case 'status_changed':
          // Update the application with new status
          set(state => ({
            applications: state.applications.map(app =>
              app.id === event.applicationId
                ? { ...app, status: event.data.status, updatedAt: event.timestamp }
                : app
            ),
            selectedApplication: state.selectedApplication?.id === event.applicationId
              ? { ...state.selectedApplication, status: event.data.status, updatedAt: event.timestamp }
              : state.selectedApplication,
          }))
          break

        case 'view_count_updated':
          // Update view count
          set(state => ({
            applications: state.applications.map(app =>
              app.id === event.applicationId
                ? { ...app, viewCount: event.data.viewCount }
                : app
            ),
          }))
          break

        case 'feedback_added':
          // Refresh application to get new feedback
          if (state.selectedApplication?.id === event.applicationId) {
            state.fetchApplication(event.applicationId)
          }
          break

        default:
          // For other events, refresh the data
          state.refreshApplications()
      }
    },

    // Error handling
    setError: (error) => set({ error }),
    clearError: () => set({ error: null }),

    // Reset store
    reset: () => set({
      applications: [],
      selectedApplication: null,
      stats: null,
      isLoading: false,
      isLoadingMore: false,
      isRefreshing: false,
      currentPage: 1,
      totalPages: 1,
      totalApplications: 0,
      hasMore: true,
      config: defaultConfig,
      isWebSocketConnected: false,
      lastUpdated: null,
      error: null,
      sidebarOpen: true,
      filtersOpen: false,
      viewMode: 'list',
      selectedApplications: [],
    }),
  }))
)

// Subscribe to config changes and refetch data
useApplicationStore.subscribe(
  (state) => state.config,
  (config, previousConfig) => {
    // Only refetch if filters, sort, or page size changed
    if (
      config.filters !== previousConfig.filters ||
      config.sortBy !== previousConfig.sortBy ||
      config.sortOrder !== previousConfig.sortOrder ||
      config.pageSize !== previousConfig.pageSize
    ) {
      const store = useApplicationStore.getState()
      store.fetchApplications({ query: { page: 1 } })
    }
  },
  {
    equalityFn: (a, b) =>
      JSON.stringify(a.filters) === JSON.stringify(b.filters) &&
      a.sortBy === b.sortBy &&
      a.sortOrder === b.sortOrder &&
      a.pageSize === b.pageSize
  }
)

// Set up WebSocket listeners
if (typeof window !== 'undefined') {
  applicationService.addEventListener('application:status_changed', (event) => {
    useApplicationStore.getState().handleRealtimeUpdate(event)
  })

  applicationService.addEventListener('application:view_updated', (event) => {
    useApplicationStore.getState().handleRealtimeUpdate(event)
  })

  applicationService.addEventListener('application:feedback_added', (event) => {
    useApplicationStore.getState().handleRealtimeUpdate(event)
  })
}

export default useApplicationStore