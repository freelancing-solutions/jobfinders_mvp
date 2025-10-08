import React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from './loading-spinner'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive'
  }
  className?: string
  loading?: boolean
}

const defaultIcons = {
  noData: (
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
      <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </div>
  ),
  search: (
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
      <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>
  ),
  error: (
    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
      <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  loading = false
}: EmptyStateProps) {
  if (loading) {
    return (
      <Card className={cn('flex flex-col items-center justify-center py-12', className)}>
        <CardContent className="flex flex-col items-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('flex flex-col items-center justify-center py-12', className)}>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
          {icon || defaultIcons.noData}
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && (
          <p className="text-muted-foreground mt-2 max-w-md">
            {description}
          </p>
        )}
      </CardHeader>
      {action && (
        <CardContent className="pt-0">
          <Button onClick={action.onClick} variant={action.variant}>
            {action.label}
          </Button>
        </CardContent>
      )}
    </Card>
  )
}