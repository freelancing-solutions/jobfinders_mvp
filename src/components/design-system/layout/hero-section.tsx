'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/components/design-system/theme/theme-context'
import { PageLayout } from './page-layout'

interface HeroSectionProps {
  title: string
  subtitle?: string
  description?: string
  actions?: React.ReactNode
  backgroundImage?: string
  background?: 'gradient' | 'image' | 'color' | 'primary' | 'secondary' | 'subtle'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  alignment?: 'left' | 'center' | 'right'
  overlay?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'py-section-lg',
  md: 'py-section-lg sm:py-section-xl',
  lg: 'py-section-xl sm:py-section-xl lg:py-section-xl',
  xl: 'py-section-xl sm:py-section-xl lg:py-section-xl xl:py-section-xl',
}

const alignmentClasses = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

const backgroundClasses = {
  gradient: 'gradient-hero',
  image: '',
  color: 'bg-primary',
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  subtle: 'bg-gradient-subtle',
}

const titleSizeClasses = {
  sm: 'text-4xl-fluid',
  md: 'text-5xl-fluid',
  lg: 'text-5xl-fluid sm:text-6xl-fluid',
  xl: 'text-6xl-fluid sm:text-7xl-fluid lg:text-8xl-fluid',
}

const descriptionSizeClasses = {
  sm: 'text-base-fluid',
  md: 'text-lg-fluid',
  lg: 'text-lg-fluid sm:text-xl-fluid',
  xl: 'text-xl-fluid sm:text-2xl-fluid',
}

const titleColorClasses = {
  gradient: 'text-white',
  image: 'text-foreground',
  color: 'text-primary-foreground',
  primary: 'text-primary-foreground',
  secondary: 'text-secondary-foreground',
  subtle: 'text-foreground',
}

const descriptionColorClasses = {
  gradient: 'text-white/90',
  image: 'text-muted-foreground',
  color: 'text-primary-foreground/80',
  primary: 'text-primary-foreground/80',
  secondary: 'text-secondary-foreground/80',
  subtle: 'text-muted-foreground',
}

export function HeroSection({
  title,
  subtitle,
  description,
  actions,
  backgroundImage,
  background = 'gradient',
  size = 'lg',
  alignment = 'center',
  overlay = false,
  className,
}: HeroSectionProps) {
  const { resolvedTheme } = useTheme()

  const heroClasses = cn(
    'relative w-full overflow-hidden',
    sizeClasses[size],
    backgroundClasses[background],
    className
  )

  const containerClasses = cn(
    'relative z-10',
    alignmentClasses[alignment]
  )

  const contentClasses = cn(
    'space-y-6 max-w-4xl',
    {
      'mx-auto': alignment === 'center',
      'ml-0 mr-auto': alignment === 'left',
      'ml-auto mr-0': alignment === 'right',
    }
  )

  const heroStyle = backgroundImage && background === 'image' ? {
    backgroundImage: `linear-gradient(rgba(0, 0, 0, ${overlay ? 0.5 : 0.3}), rgba(0, 0, 0, ${overlay ? 0.5 : 0.3})), url(${backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  } : {}

  return (
    <section
      className={heroClasses}
      style={heroStyle}
      data-theme={resolvedTheme}
    >
      {backgroundImage && overlay && (
        <div className="absolute inset-0 bg-black/20 z-0" />
      )}

      <PageLayout
        maxWidth="7xl"
        padding="none"
        background="transparent"
        centered={alignment === 'center'}
      >
        <div className={containerClasses}>
          <div className={contentClasses}>
            <div className="space-y-4">
              <h1 className={cn(
                'font-bold tracking-tight',
                titleSizeClasses[size],
                titleColorClasses[background]
              )}>
                {title}
                {subtitle && (
                  <span className="block text-current/70 font-normal">
                    {subtitle}
                  </span>
                )}
              </h1>

              {description && (
                <p className={cn(
                  'max-w-3xl',
                  descriptionSizeClasses[size],
                  descriptionColorClasses[background],
                  {
                    'mx-auto': alignment === 'center',
                  }
                )}>
                  {description}
                </p>
              )}
            </div>

            {actions && (
              <div className={cn(
                'flex flex-col sm:flex-row gap-4',
                {
                  'justify-center': alignment === 'center',
                  'justify-start': alignment === 'left',
                  'justify-end': alignment === 'right',
                }
              )}>
                {actions}
              </div>
            )}
          </div>
        </div>
      </PageLayout>
    </section>
  )
}