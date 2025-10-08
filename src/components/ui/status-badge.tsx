import React from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface StatusBadgeProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'default'
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
}

const statusConfig = {
  success: {
    className: 'bg-success-50 text-success-700 border-success-200 hover:bg-success-100',
    variant: 'default' as const
  },
  warning: {
    className: 'bg-warning-50 text-warning-700 border-warning-200 hover:bg-warning-100',
    variant: 'default' as const
  },
  error: {
    className: 'bg-error-50 text-error-700 border-error-200 hover:bg-error-100',
    variant: 'default' as const
  },
  info: {
    className: 'bg-brand-50 text-brand-700 border-brand-200 hover:bg-brand-100',
    variant: 'default' as const
  },
  default: {
    className: 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100',
    variant: 'default' as const
  }
}

export function StatusBadge({
  status,
  children,
  className,
  variant
}: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <Badge
      variant={variant || config.variant}
      className={cn(config.className, className)}
    >
      {children}
    </Badge>
  )
}