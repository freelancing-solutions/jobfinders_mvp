import React from 'react'
import { cn } from '@/lib/utils'

interface PageContainerProps {
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  fluid?: boolean
}

export function PageContainer({
  children,
  className,
  size = 'md',
  fluid = false
}: PageContainerProps) {
  const containerClasses = cn(
    'mx-auto px-4 sm:px-6 lg:px-8',
    {
      'max-w-2xl': size === 'sm' && !fluid,
      'max-w-4xl': size === 'md' && !fluid,
      'max-w-6xl': size === 'lg' && !fluid,
      'max-w-7xl': size === 'xl' && !fluid,
      'w-full': fluid,
    }
  )

  return (
    <div className={cn(containerClasses, className)}>
      {children}
    </div>
  )
}