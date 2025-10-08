import React from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  centered?: boolean
}

export function PageHeader({
  title,
  description,
  children,
  className,
  size = 'md',
  centered = false
}: PageHeaderProps) {
  const sizeClasses = {
    sm: 'py-6',
    md: 'py-8',
    lg: 'py-12',
    xl: 'py-16'
  }

  const titleSizeClasses = {
    sm: 'text-2xl md:text-3xl',
    md: 'text-3xl md:text-4xl',
    lg: 'text-4xl md:text-5xl',
    xl: 'text-5xl md:text-6xl'
  }

  return (
    <header className={cn(
      'border-b bg-background',
      sizeClasses[size],
      className
    )}>
      <div className="container">
        <div className={cn(
          'flex flex-col gap-4',
          centered && 'items-center text-center',
          !centered && 'items-start justify-between'
        )}>
          <div className={cn(
            'flex flex-col gap-2',
            centered && 'items-center',
            !centered && 'items-start'
          )}>
            <h1 className={cn(
              'font-bold tracking-tight text-foreground',
              titleSizeClasses[size]
            )}>
              {title}
            </h1>
            {description && (
              <p className={cn(
                'text-muted-foreground max-w-2xl',
                size === 'lg' && 'text-lg',
                size === 'xl' && 'text-xl',
                centered && 'mx-auto text-center'
              )}>
                {description}
              </p>
            )}
          </div>
          {children && (
            <div className={cn(
              'flex items-center gap-4',
              centered && 'w-full justify-center'
            )}>
              {children}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}