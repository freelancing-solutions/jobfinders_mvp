'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/components/design-system/theme/theme-context'

interface PageLayoutProps {
  children: React.ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | '4xl' | '5xl' | '6xl' | '7xl'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  background?: 'default' | 'muted' | 'subtle' | 'gradient'
  centered?: boolean
  fullHeight?: boolean
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-full',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
}

const paddingClasses = {
  none: '',
  sm: 'px-4 py-6',
  md: 'px-6 py-8',
  lg: 'px-8 py-12',
  xl: 'px-12 py-16',
}

const backgroundClasses = {
  default: 'bg-background',
  muted: 'bg-muted',
  subtle: 'bg-gradient-subtle',
  gradient: 'gradient-hero',
}

export function PageLayout({
  children,
  className,
  maxWidth = '7xl',
  padding = 'md',
  background = 'default',
  centered = false,
  fullHeight = false,
}: PageLayoutProps) {
  const { resolvedTheme } = useTheme()

  const containerClasses = cn(
    'w-full',
    maxWidthClasses[maxWidth],
    paddingClasses[padding],
    backgroundClasses[background],
    {
      'mx-auto': centered || maxWidth !== 'full',
      'min-h-screen': fullHeight,
    },
    className
  )

  return (
    <div className={containerClasses} data-theme={resolvedTheme}>
      {children}
    </div>
  )
}