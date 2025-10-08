import React from 'react'
import { cn } from '@/lib/utils'

interface PageSectionProps {
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  background?: 'default' | 'muted' | 'accent' | 'gradient'
  padding?: boolean
}

export function PageSection({
  children,
  className,
  size = 'md',
  background = 'default',
  padding = true
}: PageSectionProps) {
  const sizeClasses = {
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-16',
    xl: 'py-20',
    '2xl': 'py-24'
  }

  const backgroundClasses = {
    default: 'bg-background',
    muted: 'bg-muted',
    accent: 'bg-accent',
    gradient: 'bg-gradient-to-br from-brand-50 to-accent/50 dark:from-brand-950 dark:to-accent/10'
  }

  return (
    <section className={cn(
      'w-full',
      backgroundClasses[background],
      padding && sizeClasses[size],
      className
    )}>
      <PageContainer>
        {children}
      </PageContainer>
    </section>
  )
}