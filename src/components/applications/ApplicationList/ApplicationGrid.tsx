'use client'

import React from 'react'
import { ApplicationCard } from '../application-card'
import { Application } from '@/types/applications'

interface ApplicationGridProps {
  applications: Application[]
  onApplicationSelect?: (application: Application) => void
  onApplicationEdit?: (application: Application) => void
  onStatusUpdate?: (applicationId: string, status: Application['status']) => void
  className?: string
}

export function ApplicationGrid({
  applications,
  onApplicationSelect,
  onApplicationEdit,
  onStatusUpdate,
  className,
}: ApplicationGridProps) {
  return (
    <div className={`grid gap-6 md:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {applications.map((application) => (
        <ApplicationCard
          key={application.id}
          application={application}
          onView={() => onApplicationSelect?.(application)}
          onEdit={onApplicationEdit}
          onStatusUpdate={onStatusUpdate}
          className="h-full"
        />
      ))}
    </div>
  )
}