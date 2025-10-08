'use client'

import React from 'react'
import { ApplicationCard } from '../application-card'
import { Pagination } from '@/components/ui/pagination'
import { Skeleton } from '@/components/ui/skeleton'
import { Application } from '@/hooks/use-applications'

interface ApplicationGridProps {
  applications: Application[]
  loading?: boolean
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  onPageChange?: (page: number) => void
  onApplicationSelect?: (application: Application) => void
  onApplicationEdit?: (application: Application) => void
  onStatusUpdate?: (applicationId: string, status: Application['status']) => void
  onWithdraw?: (applicationId: string) => void
  onArchive?: (applicationId: string) => void
  onDelete?: (applicationId: string) => void
  onAddNote?: (applicationId: string, note: string) => void
  className?: string
}

export function ApplicationGrid({
  applications,
  loading = false,
  pagination,
  onPageChange,
  onApplicationSelect,
  onApplicationEdit,
  onStatusUpdate,
  onWithdraw,
  onArchive,
  onDelete,
  onAddNote,
  className,
}: ApplicationGridProps) {
  const LoadingSkeleton = () => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      ))}
    </div>
  )

  if (loading && applications.length === 0) {
    return <LoadingSkeleton />
  }

  if (applications.length === 0 && !loading) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No applications found</h3>
        <p className="text-gray-600">
          No applications match your current filters. Try adjusting your search criteria.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className={`grid gap-6 md:grid-cols-2 lg:grid-cols-3 ${className}`}>
        {applications.map((application) => (
          <ApplicationCard
            key={application.id}
            application={application}
            onView={() => onApplicationSelect?.(application)}
            onEdit={onApplicationEdit}
            onStatusUpdate={onStatusUpdate}
            onWithdraw={onWithdraw}
            onArchive={onArchive}
            onDelete={onDelete}
            onAddNote={onAddNote}
            className="h-full"
          />
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={onPageChange || (() => {})}
            showPreviousNext={true}
            showFirstLast={false}
            disabled={loading}
          />
        </div>
      )}

      {/* Loading more indicator */}
      {loading && applications.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            Loading more applications...
          </div>
        </div>
      )}
    </div>
  )
}