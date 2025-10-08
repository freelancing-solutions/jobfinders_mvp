import React from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  text?: string
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12'
}

export function LoadingSpinner({ className, size = 'md', text }: LoadingSpinnerProps) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <Loader2 className={cn('animate-spin text-brand-600', sizeClasses[size])} />
      {text && (
        <span className={cn(
          'ml-2 text-sm text-muted-foreground',
          size === 'lg' && 'text-base',
          size === 'xl' && 'text-lg'
        )}>
          {text}
        </span>
      )}
    </div>
  )
}