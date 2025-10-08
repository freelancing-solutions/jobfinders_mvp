'use client'

import { useEffect, useRef, useState } from 'react'
import { announceToScreenReader } from '@/lib/accessibility'

interface AccessibilityProps {
  children: React.ReactNode
  onSearchComplete?: (resultCount: number) => void
  onFilterChange?: (activeFilters: string[]) => void
}

interface LiveRegionProps {
  politeness: 'polite' | 'assertive' | 'off'
  children: React.ReactNode
  className?: string
}

// Live region component for screen reader announcements
function LiveRegion({ politeness, children, className = '' }: LiveRegionProps) {
  return (
    <div
      aria-live={politeness}
      aria-atomic="true"
      className={`sr-only ${className}`}
    >
      {children}
    </div>
  )
}

// Skip link component for keyboard navigation
function SkipLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50 focus:outline-none focus:ring-2 focus:ring-ring"
    >
      {children}
    </a>
  )
}

// Focus management hook
function useFocusManagement() {
  const previousFocusRef = useRef<HTMLElement | null>(null)

  const saveFocus = () => {
    previousFocusRef.current = document.activeElement as HTMLElement
  }

  const restoreFocus = () => {
    if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
      previousFocusRef.current.focus()
    }
  }

  const trapFocus = (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>

    const first = focusableElements[0]
    const last = focusableElements[focusableElements.length - 1]

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === first) {
          last.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === last) {
          first.focus()
          e.preventDefault()
        }
      }
    }

    container.addEventListener('keydown', handleTabKey)
    return () => container.removeEventListener('keydown', handleTabKey)
  }

  return { saveFocus, restoreFocus, trapFocus }
}

// Keyboard navigation utilities
function useKeyboardNavigation(
  items: Array<{ id: string; element?: HTMLElement }>,
  onSelect?: (id: string) => void
) {
  const [focusedIndex, setFocusedIndex] = useState(0)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex(prev => (prev + 1) % items.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex(prev => (prev - 1 + items.length) % items.length)
        break
      case 'Home':
        e.preventDefault()
        setFocusedIndex(0)
        break
      case 'End':
        e.preventDefault()
        setFocusedIndex(items.length - 1)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (onSelect && items[focusedIndex]) {
          onSelect(items[focusedIndex].id)
        }
        break
      case 'Escape':
        // Let parent component handle escape
        break
    }
  }

  useEffect(() => {
    const focusedItem = items[focusedIndex]
    if (focusedItem?.element && typeof focusedItem.element.focus === 'function') {
      focusedItem.element.focus()
    }
  }, [focusedIndex, items])

  return { focusedIndex, handleKeyDown, setFocusedIndex }
}

// Accessibility enhancements for the jobs page
export function JobsAccessibility({ children, onSearchComplete, onFilterChange }: AccessibilityProps) {
  const [announcement, setAnnouncement] = useState('')
  const [filterCount, setFilterCount] = useState(0)
  const { saveFocus, restoreFocus, trapFocus } = useFocusManagement()
  const filtersRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Announce search results to screen readers
  useEffect(() => {
    if (onSearchComplete && typeof onSearchComplete === 'function') {
      const originalOnSearchComplete = onSearchComplete
      onSearchComplete = (resultCount: number) => {
        originalOnSearchComplete(resultCount)
        const message = resultCount === 0
          ? 'No jobs found. Try adjusting your search filters.'
          : `${resultCount} jobs found. Use Tab key to navigate through results.`
        setAnnouncement(message)
        announceToScreenReader(message)
      }
    }
  }, [onSearchComplete])

  // Announce filter changes
  useEffect(() => {
    if (onFilterChange && typeof onFilterChange === 'function') {
      const originalOnFilterChange = onFilterChange
      onFilterChange = (activeFilters: string[]) => {
        originalOnFilterChange(activeFilters)
        setFilterCount(activeFilters.length)
        const message = activeFilters.length === 0
          ? 'All filters cleared.'
          : `${activeFilters.length} filter${activeFilters.length === 1 ? '' : 's'} applied.`
        setAnnouncement(message)
        announceToScreenReader(message)
      }
    }
  }, [onFilterChange])

  // Focus management for mobile filters
  const openMobileFilters = () => {
    saveFocus()
    if (filtersRef.current) {
      filtersRef.current.focus()
      const cleanup = trapFocus(filtersRef.current)
      return cleanup
    }
  }

  const closeMobileFilters = () => {
    restoreFocus()
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K for search focus
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }

      // Escape to close mobile filters
      if (e.key === 'Escape' && filtersRef.current) {
        closeMobileFilters()
      }
    }

    document.addEventListener('keydown', handleGlobalKeyDown)
    return () => document.removeEventListener('keydown', handleGlobalKeyDown)
  }, [])

  return (
    <div className="relative">
      {/* Skip links */}
      <SkipLink href="#search">Skip to search</SkipLink>
      <SkipLink href="#filters">Skip to filters</SkipLink>
      <SkipLink href="#results">Skip to job results</SkipLink>

      {/* Live regions for announcements */}
      <LiveRegion politeness="polite">
        {announcement}
      </LiveRegion>

      <LiveRegion politeness="polite">
        {filterCount > 0 && `${filterCount} filter${filterCount === 1 ? '' : 's'} active`}
      </LiveRegion>

      {/* Enhanced children with accessibility props */}
      <div
        role="main"
        aria-label="Jobs listing page"
      >
        {children}
      </div>
    </div>
  )
}

// Accessible search input component
export function AccessibleSearchInput({
  value,
  onChange,
  onSubmit,
  placeholder,
  suggestions = [],
  ...props
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  placeholder: string
  suggestions?: string[]
  [key: string]: any
}) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeSuggestion, setActiveSuggestion] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const suggestionItems = suggestions.map((suggestion, index) => ({
    id: suggestion,
    element: document.getElementById(`suggestion-${index}`)
  }))

  const { focusedIndex, handleKeyDown } = useKeyboardNavigation(
    suggestionItems,
    (id) => {
      onChange(id)
      setShowSuggestions(false)
      onSubmit()
    }
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
    setShowSuggestions(e.target.value.length > 0)
    setActiveSuggestion(0)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestions && suggestions.length > 0) {
      // Handle suggestion navigation
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveSuggestion(prev => (prev + 1) % suggestions.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveSuggestion(prev => (prev - 1 + suggestions.length) % suggestions.length)
      } else if (e.key === 'Enter' && activeSuggestion > 0) {
        e.preventDefault()
        onChange(suggestions[activeSuggestion - 1])
        setShowSuggestions(false)
        onSubmit()
      } else if (e.key === 'Escape') {
        setShowSuggestions(false)
      } else {
        // Use keyboard navigation hook for other keys
        handleKeyDown(e)
      }
    } else {
      handleKeyDown(e)
    }
  }

  return (
    <div className="relative">
      <label htmlFor="job-search" className="sr-only">
        Search jobs
      </label>
      <input
        ref={inputRef}
        id="job-search"
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-describedby="search-description"
        aria-expanded={showSuggestions}
        aria-autocomplete="list"
        aria-activedescendant={activeSuggestion > 0 ? `suggestion-${activeSuggestion - 1}` : undefined}
        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        {...props}
      />

      <div id="search-description" className="sr-only">
        Search for jobs by title, company, or keywords. Use arrow keys to navigate suggestions.
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <ul
          role="listbox"
          aria-label="Search suggestions"
          className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion}
              id={`suggestion-${index}`}
              role="option"
              aria-selected={index === activeSuggestion - 1}
              className={`px-4 py-2 cursor-pointer ${
                index === activeSuggestion - 1 ? 'bg-blue-100' : 'hover:bg-gray-100'
              }`}
              onClick={() => {
                onChange(suggestion)
                setShowSuggestions(false)
                onSubmit()
              }}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// Accessible filter panel component
export function AccessibleFilterPanel({
  isOpen,
  onClose,
  children,
  title = 'Job Filters'
}: {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const { trapFocus, restoreFocus } = useFocusManagement()

  useEffect(() => {
    if (isOpen && panelRef.current) {
      const cleanup = trapFocus(panelRef.current)
      return cleanup
    }
  }, [isOpen, trapFocus])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
        restoreFocus()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose, restoreFocus])

  if (!isOpen) return null

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="filter-panel-title"
      className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 id="filter-panel-title" className="text-lg font-semibold">
              {title}
            </h2>
            <button
              onClick={onClose}
              aria-label="Close filters"
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              ×
            </button>
          </div>
          <div className="space-y-4">
            {children}
          </div>
          <div className="mt-6 flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
            >
              Apply Filters
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Accessible job card component
export function AccessibleJobCard({
  job,
  onSelect,
  index,
  totalJobs
}: {
  job: any
  onSelect: () => void
  index: number
  totalJobs: number
}) {
  const cardRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={cardRef}
      role="article"
      aria-label={`Job: ${job.title} at ${job.company.name}`}
      aria-setsize={totalJobs}
      aria-posinset={index + 1}
      tabIndex={0}
      className="p-6 border border-gray-200 rounded-lg hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
    >
      <h3 className="font-semibold text-lg mb-2">{job.title}</h3>
      <p className="text-gray-600 mb-2">{job.company.name}</p>
      <p className="text-sm text-gray-500 mb-2">{job.location}</p>
      {job.salary && (
        <p className="text-sm font-medium mb-2">
          {job.salary.currency} {job.salary.min.toLocaleString()} - {job.salary.max.toLocaleString()}
        </p>
      )}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">
          {job.remote && 'Remote • '}
          {job.type}
        </span>
        <span className="text-sm text-gray-500">
          {job.applicationCount} applicants
        </span>
      </div>
    </div>
  )
}