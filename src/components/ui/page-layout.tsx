import React from 'react'
import { cn } from '@/lib/utils'
import { PageHeader } from './page-header'
import { PageContainer } from './page-container'
import { PageSection } from './page-section'

interface PageLayoutProps {
  children: React.ReactNode
  header?: {
    title: string
    description?: string
    actions?: React.ReactNode
    size?: 'sm' | 'md' | 'lg' | 'xl'
  }
  className?: string
  containerSize?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  fluid?: boolean
  sections?: Array<{
    id: string
    title?: string
    description?: string
    background?: 'default' | 'muted' | 'accent' | 'gradient'
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
    padding?: boolean
    component?: React.ReactNode
  }>
}

export function PageLayout({
  children,
  header,
  className,
  containerSize,
  fluid,
  sections
}: PageLayoutProps) {
  return (
    <div className={cn('min-h-screen bg-background', className)}>
      {header && (
        <PageHeader
          title={header.title}
          description={header.description}
          size={header.size}
        >
          {header.actions}
        </PageHeader>
      )}

      {sections?.map((section) => (
        <PageSection
          key={section.id}
          size={section.size}
          background={section.background}
          padding={section.padding}
          id={section.id}
        >
          {section.component}
        </PageSection>
      ))}

      {!sections && (
        <PageSection size="lg" padding>
          <PageContainer size={containerSize} fluid={fluid}>
            {children}
          </PageContainer>
        </PageSection>
      )}

      {sections && children && (
        <PageSection size="lg" padding>
          <PageContainer size={containerSize} fluid={fluid}>
            {children}
          </PageContainer>
        </PageSection>
      )}
    </div>
  )
}