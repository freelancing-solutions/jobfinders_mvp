'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/components/design-system/theme/theme-context'
import { PageLayout } from './page-layout'

interface SectionLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  description?: string
  className?: string
  spacing?: 'sm' | 'md' | 'lg' | 'xl'
  background?: 'default' | 'muted' | 'primary' | 'secondary' | 'gradient' | 'subtle'
  container?: boolean
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | '4xl' | '5xl' | '6xl' | '7xl'
  centered?: boolean
  id?: string
}

const spacingClasses = {
  sm: 'py-section-sm',
  md: 'py-section-md',
  lg: 'py-section-lg',
  xl: 'py-section-xl',
}

const backgroundClasses = {
  default: 'bg-background',
  muted: 'bg-muted',
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  gradient: 'gradient-primary',
  subtle: 'bg-gradient-subtle',
}

const titleColorClasses = {
  default: 'text-foreground',
  muted: 'text-foreground',
  primary: 'text-primary-foreground',
  secondary: 'text-secondary-foreground',
  gradient: 'text-white',
  subtle: 'text-foreground',
}

const textColorClasses = {
  default: 'text-muted-foreground',
  muted: 'text-muted-foreground',
  primary: 'text-primary-foreground/80',
  secondary: 'text-secondary-foreground/80',
  gradient: 'text-white/90',
  subtle: 'text-muted-foreground',
}

export function SectionLayout({
  children,
  title,
  subtitle,
  description,
  className,
  spacing = 'lg',
  background = 'default',
  container = true,
  maxWidth = '7xl',
  centered = false,
  id,
}: SectionLayoutProps) {
  const { resolvedTheme } = useTheme()

  const sectionClasses = cn(
    'w-full',
    spacingClasses[spacing],
    backgroundClasses[background],
    className
  )

  const contentClasses = cn(
    'space-y-6',
    {
      'text-center': centered,
      'text-left': !centered,
    }
  )

  const TitleComponent = title ? (
    <h2 className={cn(
      'text-3xl-fluid font-bold tracking-tight',
      titleColorClasses[background],
      centered && 'mx-auto'
    )}>
      {title}
      {subtitle && (
        <span className="block text-xl-fluid font-normal mt-2 text-current/70">
          {subtitle}
        </span>
      )}
    </h2>
  ) : null

  const DescriptionComponent = description ? (
    <p className={cn(
      'text-lg-fluid max-w-3xl',
      textColorClasses[background],
      centered && 'mx-auto'
    )}>
      {description}
    </p>
  ) : null

  const HeaderComponent = (TitleComponent || DescriptionComponent) ? (
    <div className={cn('space-y-4', centered ? 'text-center' : 'text-left')}>
      {TitleComponent}
      {DescriptionComponent}
    </div>
  ) : null

  const content = (
    <div className={contentClasses}>
      {HeaderComponent}
      {children}
    </div>
  )

  return (
    <section
      className={sectionClasses}
      id={id}
      data-theme={resolvedTheme}
    >
      {container ? (
        <PageLayout
          maxWidth={maxWidth}
          padding="none"
          background="default"
          centered={centered}
        >
          {content}
        </PageLayout>
      ) : (
        content
      )}
    </section>
  )
}