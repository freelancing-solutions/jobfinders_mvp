import React from 'react'
import { cn } from '@/lib/utils'

interface BrandSectionProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'gradient' | 'subtle'
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function BrandSection({
  children,
  className,
  variant = 'default',
  size = 'md'
}: BrandSectionProps) {
  const baseClasses = cn(
    'rounded-lg',
    {
      'bg-white border border-gray-200 shadow-sm': variant === 'default',
      'bg-gradient-to-r from-brand-600 to-brand-700 text-white': variant === 'gradient',
      'bg-gray-50 border border-gray-200': variant === 'subtle',
    }
  )

  const sizeClasses = cn({
    'p-4': size === 'sm',
    'p-6': size === 'md',
    'p-8': size === 'lg',
    'p-12': size === 'xl',
  })

  return (
    <section className={cn(baseClasses, sizeClasses, className)}>
      {children}
    </section>
  )
}