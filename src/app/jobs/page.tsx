'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { JobGrid } from '@/components/jobs/job-grid'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { SearchHistory } from '@/components/search/search-history'
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  MapPin, 
  Briefcase, 
  Building2, 
  Calendar,
  DollarSign,
  Clock,
  Loader2,
  AlertCircle,
  X
} from 'lucide-react'
import { useJobSearch } from '@/hooks/use-job-search'
import { 
  JOB_CATEGORIES, 
  JOB_TYPES, 
  EXPERIENCE_LEVELS, 
  SORT_OPTIONS,
  formatSalary,
  formatDate,
  getLocationString,
  getJobTypeLabel,
  getExperienceLabel
} from '@/lib/search-utils'
import { useState, Suspense } from 'react'
import Link from 'next/link'

function JobsPageContent() {
  const {
    searchState,
    hasActiveFilters,
    activeFilterCount,
    updateFilters,
    clearFilters,
    updatePagination,
    setView,
    search,
    resetSearch,
  } = useJobSearch()

  const [filtersVisible, setFiltersVisible] = useState(false)

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="p-6">
          <div className="space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )

  const EmptyState = () => (
    <Card className="text-center py-12">
      <CardContent>
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Search className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs found</h3>
        <p className="text-gray-600 mb-6">
          Try adjusting your search filters or browse all available positions.
        </p>
        <div className="space-y-2">
          <Button 
            variant="outline" 
            onClick={() => updateFilters({ query: '', location: '', category: '' })}
            className="w-full"
          >
            Clear all filters
          </Button>
          <Button asChild className="w-full">
            <Link href="/employer/post">Post a job</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const ErrorState = () => (
    <Card className="text-center py-12">
      <CardContent>
        <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
        <p className="text-gray-600 mb-6">
          {searchState.error || 'Failed to load jobs. Please try again.'}
        </p>
        <Button onClick={() => search()} className="w-full">
          Try Again
        </Button>
      </CardContent>
    </Card>
  )

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header Section */}
        <section className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Find Your Next Opportunity</h1>
                <p className="text-gray-600 mt-1">
                  Discover {searchState.pagination.total || 0}+ opportunities across South Africa
                  {hasActiveFilters && (
                    <span className="ml-2">
                      <Badge variant="secondary" className="ml-2">
                        {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
                      </Badge>
                    </span>
                  )}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  variant={searchState.view === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setView('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={searchState.view === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setView('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFiltersVisible(!filtersVisible)}
                  className="lg:hidden"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Search Section */}
        <section className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="max-w-4xl mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search jobs by title, company, or keywords..."
                  value={searchState.filters.query || ''}
                  onChange={(e) => updateFilters({ query: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      search(true);
                    }
                  }}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Button
                  onClick={() => search(true)}
                  disabled={searchState.isLoading}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  size="sm"
                >
                  {searchState.isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Search'
                  )}
                </Button>
              </div>
            </div>
            
            {/* Quick Filters */}
            <div className="max-w-4xl mx-auto mt-4 flex flex-wrap gap-2">
              {searchState.filters.location && (
                <Badge variant="secondary" className="gap-1">
                  <MapPin className="h-3 w-3" />
                  {searchState.filters.location}
                  <button 
                    onClick={() => updateFilters({ location: undefined })}
                    className="ml-1 hover:bg-gray-200 rounded"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {searchState.filters.category && (
                <Badge variant="secondary" className="gap-1">
                  <Briefcase className="h-3 w-3" />
                  {searchState.filters.category}
                  <button 
                    onClick={() => updateFilters({ category: undefined })}
                    className="ml-1 hover:bg-gray-200 rounded"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {searchState.filters.remote && (
                <Badge variant="secondary" className="gap-1">
                  <Clock className="h-3 w-3" />
                  Remote
                  <button 
                    onClick={() => updateFilters({ remote: undefined })}
                    className="ml-1 hover:bg-gray-200 rounded"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear all
                </Button>
              )}
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar - Desktop */}
            <aside className={`lg:w-80 ${filtersVisible ? 'block' : 'hidden lg:block'}`}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filters
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="ml-auto"
                      >
                        Clear all
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Location Filter */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Location</label>
                    <input
                      type="text"
                      placeholder="City or province"
                      value={searchState.filters.location || ''}
                      onChange={(e) => updateFilters({ location: e.target.value || undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Category Filter */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Category</label>
                    <select
                      value={searchState.filters.category || ''}
                      onChange={(e) => updateFilters({ category: e.target.value || undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Categories</option>
                      {JOB_CATEGORIES.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  {/* Salary Range */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Salary Range (ZAR)</label>
                    <div className="space-y-2">
                      <input
                        type="number"
                        placeholder="Min salary"
                        value={searchState.filters.salaryMin || ''}
                        onChange={(e) => updateFilters({ 
                          salaryMin: e.target.value ? parseInt(e.target.value) : undefined 
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        placeholder="Max salary"
                        value={searchState.filters.salaryMax || ''}
                        onChange={(e) => updateFilters({ 
                          salaryMax: e.target.value ? parseInt(e.target.value) : undefined 
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Experience Level */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Experience Level</label>
                    <select
                      value={searchState.filters.experience || ''}
                      onChange={(e) => updateFilters({ experience: e.target.value as any || undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Levels</option>
                      {EXPERIENCE_LEVELS.map(level => (
                        <option key={level.value} value={level.value}>{level.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Employment Type */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Employment Type</label>
                    <select
                      value={searchState.filters.type || ''}
                      onChange={(e) => updateFilters({ type: e.target.value as any || undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Types</option>
                      {JOB_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Remote Work */}
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={searchState.filters.remote || false}
                        onChange={(e) => updateFilters({ remote: e.target.checked || undefined })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium">Remote work only</span>
                    </label>
                  </div>

                  {/* Sort Options */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Sort By</label>
                    <select
                      value={`${searchState.filters.sortBy}-${searchState.filters.sortOrder}`}
                      onChange={(e) => {
                        const [sortBy, sortOrder] = e.target.value.split('-');
                        updateFilters({ 
                          sortBy: sortBy as any,
                          sortOrder: sortOrder as any
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {SORT_OPTIONS.map(option => (
                        <option key={option.value} value={`${option.value}-desc`}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Search History */}
                  <SearchHistory 
                    onSelect={(filters) => {
                      updateFilters(filters);
                      search(true);
                    }}
                  />
                </CardContent>
              </Card>
            </aside>

            {/* Main Content */}
            <main className="flex-1">
              {searchState.error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{searchState.error}</AlertDescription>
                </Alert>
              )}

              {searchState.isLoading && <LoadingSkeleton />}
              
              {!searchState.isLoading && searchState.error && <ErrorState />}
              
              {!searchState.isLoading && !searchState.error && searchState.results.length === 0 && searchState.hasSearched && (
                <EmptyState />
              )}
              
              {!searchState.isLoading && !searchState.error && searchState.results.length > 0 && (
                <>
                  <div className="mb-6 flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      Showing {((searchState.pagination.page - 1) * searchState.pagination.limit) + 1} to{' '}
                      {Math.min(searchState.pagination.page * searchState.pagination.limit, searchState.pagination.total)} of{' '}
                      {searchState.pagination.total} jobs
                    </p>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">View:</span>
                      <Button
                        variant={searchState.view === 'grid' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setView('grid')}
                      >
                        <Grid className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={searchState.view === 'list' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setView('list')}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <JobGrid 
                    jobs={searchState.results} 
                    viewMode={searchState.view}
                  />

                  {/* Pagination */}
                  {searchState.pagination.totalPages > 1 && (
                    <div className="mt-8 flex justify-center">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={searchState.pagination.page <= 1}
                          onClick={() => updatePagination({ page: searchState.pagination.page - 1 })}
                        >
                          Previous
                        </Button>
                        
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, searchState.pagination.totalPages) }, (_, i) => {
                            const pageNum = i + 1;
                            const isActive = pageNum === searchState.pagination.page;
                            
                            return (
                              <Button
                                key={pageNum}
                                variant={isActive ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => updatePagination({ page: pageNum })}
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                          
                          {searchState.pagination.totalPages > 5 && (
                            <>
                              <span className="px-2 text-sm text-gray-500">...</span>
                              <Button
                                variant={searchState.pagination.page === searchState.pagination.totalPages ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => updatePagination({ page: searchState.pagination.totalPages })}
                              >
                                {searchState.pagination.totalPages}
                              </Button>
                            </>
                          )}
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={searchState.pagination.page >= searchState.pagination.totalPages}
                          onClick={() => updatePagination({ page: searchState.pagination.page + 1 })}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </main>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

export default function JobsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <JobsPageContent />
    </Suspense>
  )
}