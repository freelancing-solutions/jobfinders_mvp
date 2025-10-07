'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ApplicationCard } from '../application-card'
import { ApplicationFilters } from '../filter-panel'
import { ApplicationStats } from '../ApplicationStats/ApplicationStats'
import {
  useApplications,
  useApplicationSelection,
  useApplicationFilters
} from '@/hooks/applications/use-applications'
import { Application, ApplicationStatus } from '@/types/applications'
import {
  Search,
  Filter,
  MoreHorizontal,
  Grid,
  List,
  Archive,
  Download,
  RefreshCw,
  ChevronDown,
  Eye,
  EyeOff,
  Calendar,
  Building,
  Star,
  AlertCircle,
  Check,
  X,
} from 'lucide-react'

interface ApplicationListProps {
  className?: string
  showFilters?: boolean
  showStats?: boolean
  compact?: boolean
  selectable?: boolean
  pageSize?: number
  onApplicationSelect?: (application: Application) => void
  onApplicationEdit?: (application: Application) => void
  onStatusUpdate?: (applicationId: string, status: ApplicationStatus) => void
}

export function ApplicationList({
  className,
  showFilters = true,
  showStats = true,
  compact = false,
  selectable = false,
  pageSize = 20,
  onApplicationSelect,
  onApplicationEdit,
  onStatusUpdate,
}: ApplicationListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showFiltersPanel, setShowFiltersPanel] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const {
    applications,
    isLoading,
    isLoadingMore,
    error,
    totalApplications,
    hasMore,
    config,
    loadMore,
    refresh,
    updateConfig,
    setFilters,
  } = useApplications({
    config: { pageSize },
    autoFetch: true,
  })

  const {
    selectedApplications,
    selectedApps,
    count: selectedCount,
    isAllSelected,
    toggleSelection,
    selectAll,
    clear,
    bulkUpdate,
    bulkArchive,
    bulkDelete,
  } = useApplicationSelection()

  const { filters, updateFilter, clearFilters, hasActiveFilters } = useApplicationFilters()

  // Handle infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || isLoadingMore) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    observerRef.current.observe(loadMoreRef.current)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasMore, isLoadingMore, loadMore])

  // Search functionality
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    updateFilter('search', query || undefined)
  }, [updateFilter])

  // Handle status filter
  const handleStatusFilter = useCallback((status: ApplicationStatus | 'all') => {
    if (status === 'all') {
      updateFilter('status', undefined)
    } else {
      updateFilter('status', [status])
    }
  }, [updateFilter])

  // Handle sort change
  const handleSortChange = useCallback((sortBy: string) => {
    updateConfig({ sortBy: sortBy as any })
  }, [updateConfig])

  // Handle view mode change
  const handleViewModeChange = useCallback((mode: 'list' | 'grid') => {
    updateConfig({ viewMode: mode })
  }, [updateConfig])

  // Handle selection
  const handleApplicationSelect = useCallback((application: Application) => {
    if (selectable) {
      toggleSelection(application.id)
    }
    onApplicationSelect?.(application)
  }, [selectable, toggleSelection, onApplicationSelect])

  // Handle bulk actions
  const handleBulkStatusUpdate = useCallback(async (status: ApplicationStatus) => {
    await bulkUpdate(status)
  }, [bulkUpdate])

  // Filter out archived applications if not shown
  const filteredApplications = showArchived
    ? applications
    : applications.filter(app => app.status !== 'archived')

  // Get status counts for quick filters
  const statusCounts = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1
    return acc
  }, {} as Record<ApplicationStatus, number>)

  if (error && applications.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Applications</h3>
          <p className="text-gray-600 text-center mb-4">{error}</p>
          <Button onClick={refresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (isLoading && applications.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4" />
          <p className="text-gray-600">Loading applications...</p>
        </CardContent>
      </Card>
    )
  }

  if (applications.length === 0 && !isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Building className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Applications Found</h3>
          <p className="text-gray-600 text-center mb-4">
            You haven't applied to any jobs yet. Start browsing and applying to positions that match your skills.
          </p>
          <Button asChild>
            <a href="/jobs">Browse Jobs</a>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Stats */}
      {showStats && (
        <ApplicationStats
          total={totalApplications}
          counts={statusCounts}
          compact={compact}
        />
      )}

      {/* Controls Bar */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search applications..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <Select onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="applied">Applied</SelectItem>
                <SelectItem value="reviewing">Under Review</SelectItem>
                <SelectItem value="shortlisted">Shortlisted</SelectItem>
                <SelectItem value="interview_scheduled">Interview</SelectItem>
                <SelectItem value="offered">Offer</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select onValueChange={handleSortChange}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date Applied</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="company">Company</SelectItem>
                <SelectItem value="matchScore">Match Score</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode */}
            <div className="flex items-center border rounded-md">
              <Button
                variant={config.viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleViewModeChange('list')}
                className="rounded-r-none"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={config.viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleViewModeChange('grid')}
                className="rounded-l-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                className={hasActiveFilters ? 'border-blue-500 text-blue-600' : ''}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                    {Object.keys(filters).length}
                  </Badge>
                )}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={refresh}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowArchived(!showArchived)}>
                    {showArchived ? (
                      <EyeOff className="mr-2 h-4 w-4" />
                    ) : (
                      <Eye className="mr-2 h-4 w-4" />
                    )}
                    {showArchived ? 'Hide Archived' : 'Show Archived'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled={selectedCount === 0}>
                    <Archive className="mr-2 h-4 w-4" />
                    Archive Selected
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={selectedCount === 0}>
                    <Download className="mr-2 h-4 w-4" />
                    Export Selected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Bulk Selection Controls */}
          {selectable && selectedCount > 0 && (
            <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      selectAll()
                    } else {
                      clear()
                    }
                  }}
                />
                <span className="text-sm font-medium">
                  {selectedCount} application{selectedCount !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Update Status
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleBulkStatusUpdate('applied')}>
                      Applied
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkStatusUpdate('reviewing')}>
                      Under Review
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkStatusUpdate('shortlisted')}>
                      Shortlisted
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkStatusUpdate('interview_scheduled')}>
                      Interview Scheduled
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkStatusUpdate('offered')}>
                      Offer
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkStatusUpdate('rejected')}>
                      Rejected
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => bulkArchive()}
                  className="text-yellow-600 hover:text-yellow-700"
                >
                  <Archive className="h-4 w-4 mr-1" />
                  Archive
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => bulkDelete()}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Filters Panel */}
      {showFilters && showFiltersPanel && (
        <ApplicationFilters
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={clearFilters}
          className="w-full"
        />
      )}

      {/* Applications List/Grid */}
      <div className={config.viewMode === 'grid' ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
        {selectable && (
          <div className="flex items-center p-4 border rounded-lg bg-gray-50">
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={(checked) => {
                if (checked) {
                  selectAll()
                } else {
                  clear()
                }
              }}
              className="mr-3"
            />
            <span className="text-sm font-medium text-gray-600">
              Select all {filteredApplications.length} applications
            </span>
          </div>
        )}

        {filteredApplications.map((application) => (
          <div key={application.id} className="relative">
            {selectable && (
              <div className="absolute top-4 left-4 z-10">
                <Checkbox
                  checked={selectedApplications.includes(application.id)}
                  onCheckedChange={() => toggleSelection(application.id)}
                  className="bg-white shadow-sm"
                />
              </div>
            )}
            <ApplicationCard
              application={application}
              className={selectable ? 'ml-8' : ''}
              onView={() => handleApplicationSelect(application)}
              onEdit={onApplicationEdit}
              onStatusUpdate={onStatusUpdate}
              showAnalytics={config.showAnalytics}
              showTimeline={config.showTimeline}
            />
          </div>
        ))}
      </div>

      {/* Load More Trigger */}
      {hasMore && (
        <div ref={loadMoreRef} className="flex justify-center py-8">
          {isLoadingMore ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
              <span className="text-sm text-gray-600">Loading more applications...</span>
            </div>
          ) : (
            <Button variant="outline" onClick={loadMore}>
              Load More Applications
            </Button>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          Showing {filteredApplications.length} of {totalApplications} applications
        </span>
        <span>
          Last updated: {new Date().toLocaleString()}
        </span>
      </div>
    </div>
  )
}