'use client'

import { useCallback, useMemo, useRef, useEffect, useState } from 'react'
import { debounce, throttle } from 'lodash'
import { SearchFilters } from '@/types/jobs'

interface UseJobOptimizationsOptions {
  debounceTime?: number
  throttleTime?: number
  enableVirtualScrolling?: boolean
  itemHeight?: number
  containerHeight?: number
  prefetchDistance?: number
}

interface OptimizedSearchState {
  debouncedUpdateFilters: (filters: Partial<SearchFilters>) => void
  throttledSearch: () => void
  visibleItemIndices: { start: number; end: number }
  scrollToItem: (index: number) => void
  prefetchNextPage: () => void
  optimizeImageLoading: () => void
  trackSearchPerformance: (searchType: string, duration: number) => void
  getPerformanceMetrics: () => SearchPerformanceMetrics
}

interface SearchPerformanceMetrics {
  averageSearchTime: number
  totalSearches: number
  cacheHitRate: number
  errorRate: number
  lastSearchTime: number
  slowSearchCount: number
}

export function useJobOptimizations(options: UseJobOptimizationsOptions = {}): OptimizedSearchState {
  const {
    debounceTime = 300,
    throttleTime = 1000,
    enableVirtualScrolling = false,
    itemHeight = 200,
    containerHeight = 600,
    prefetchDistance = 200
  } = options

  // Performance tracking
  const searchMetricsRef = useRef<SearchPerformanceMetrics>({
    averageSearchTime: 0,
    totalSearches: 0,
    cacheHitRate: 0,
    errorRate: 0,
    lastSearchTime: 0,
    slowSearchCount: 0
  })

  const searchTimesRef = useRef<number[]>([])
  const cacheHitsRef = useRef(0)
  const cacheMissesRef = useRef(0)
  const errorCountRef = useRef(0)
  const searchStartTimeRef = useRef<number>(0)

  // Virtual scrolling
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [visibleItemIndices, setVisibleItemIndices] = useState({ start: 0, end: 10 })

  // Debounced filter updates
  const debouncedUpdateFilters = useCallback(
    debounce((filters: Partial<SearchFilters>) => {
      // This will be called by the consuming component
      // The actual implementation should be passed in
      return filters
    }, debounceTime),
    [debounceTime]
  )

  // Throttled search execution
  const throttledSearch = useCallback(
    throttle(() => {
      // This will be called by the consuming component
      // The actual implementation should be passed in
      return true
    }, throttleTime),
    [throttleTime]
  )

  // Virtual scrolling implementation
  useEffect(() => {
    if (!enableVirtualScrolling || !scrollContainerRef.current) return

    const container = scrollContainerRef.current
    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollTop = container.scrollTop
          const start = Math.floor(scrollTop / itemHeight)
          const visibleCount = Math.ceil(containerHeight / itemHeight)
          const end = Math.min(start + visibleCount + 5, 1000) // +5 for buffer

          setVisibleItemIndices({ start, end })
          ticking = false
        })
        ticking = true
      }
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [enableVirtualScrolling, itemHeight, containerHeight])

  // Scroll to specific item
  const scrollToItem = useCallback((index: number) => {
    if (!scrollContainerRef.current) return

    const scrollTop = index * itemHeight
    scrollContainerRef.current.scrollTo({
      top: scrollTop,
      behavior: 'smooth'
    })
  }, [itemHeight])

  // Prefetch next page when approaching bottom
  const prefetchNextPage = useCallback(() => {
    if (!scrollContainerRef.current) return

    const container = scrollContainerRef.current
    const scrollTop = container.scrollTop
    const scrollHeight = container.scrollHeight
    const clientHeight = container.clientHeight

    if (scrollTop + clientHeight >= scrollHeight - prefetchDistance) {
      // Trigger prefetch - implementation should be provided by consuming component
      return true
    }
    return false
  }, [prefetchDistance])

  // Image loading optimization
  const optimizeImageLoading = useCallback(() => {
    // Lazy load images when they come into view
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement
              if (img.dataset.src) {
                img.src = img.dataset.src
                img.removeAttribute('data-src')
                imageObserver.unobserve(img)
              }
            }
          })
        },
        { rootMargin: '50px' }
      )

      // Observe all images with data-src attribute
      document.querySelectorAll('img[data-src]').forEach((img) => {
        imageObserver.observe(img)
      })

      return () => imageObserver.disconnect()
    }
  }, [])

  // Performance tracking
  const trackSearchPerformance = useCallback((searchType: string, duration: number) => {
    const metrics = searchMetricsRef.current
    searchTimesRef.current.push(duration)

    // Keep only last 50 search times for average calculation
    if (searchTimesRef.current.length > 50) {
      searchTimesRef.current = searchTimesRef.current.slice(-50)
    }

    // Update metrics
    metrics.totalSearches++
    metrics.lastSearchTime = duration
    metrics.averageSearchTime = searchTimesRef.current.reduce((a, b) => a + b, 0) / searchTimesRef.current.length

    if (duration > 2000) {
      metrics.slowSearchCount++
    }

    // Log slow searches for debugging
    if (duration > 3000) {
      console.warn(`Slow search detected: ${searchType} took ${duration}ms`)
    }
  }, [])

  // Cache performance tracking
  const trackCacheHit = useCallback(() => {
    cacheHitsRef.current++
  }, [])

  const trackCacheMiss = useCallback(() => {
    cacheMissesRef.current++
  }, [])

  const trackError = useCallback(() => {
    errorCountRef.current++
  }, [])

  // Update cache hit rate
  useEffect(() => {
    const total = cacheHitsRef.current + cacheMissesRef.current
    if (total > 0) {
      searchMetricsRef.current.cacheHitRate = cacheHitsRef.current / total
    }
    searchMetricsRef.current.errorRate = errorCountRef.current / Math.max(searchMetricsRef.current.totalSearches, 1)
  })

  // Get performance metrics
  const getPerformanceMetrics = useCallback((): SearchPerformanceMetrics => {
    return { ...searchMetricsRef.current }
  }, [])

  // Start search timer
  const startSearchTimer = useCallback(() => {
    searchStartTimeRef.current = performance.now()
  }, [])

  // End search timer and track performance
  const endSearchTimer = useCallback((searchType: string) => {
    if (searchStartTimeRef.current > 0) {
      const duration = performance.now() - searchStartTimeRef.current
      trackSearchPerformance(searchType, duration)
      searchStartTimeRef.current = 0
    }
  }, [trackSearchPerformance])

  return {
    debouncedUpdateFilters,
    throttledSearch,
    visibleItemIndices,
    scrollToItem,
    prefetchNextPage,
    optimizeImageLoading,
    trackSearchPerformance,
    getPerformanceMetrics,
    startSearchTimer,
    endSearchTimer,
    trackCacheHit,
    trackCacheMiss,
    trackError,
    scrollContainerRef
  }
}

// Hook for optimizing filter state management
export function useOptimizedFilters(initialFilters: SearchFilters = {}) {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters)
  const [filterHistory, setFilterHistory] = useState<SearchFilters[]>([])

  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)

    // Add to history for undo functionality
    setFilterHistory(prev => [...prev.slice(-9), filters]) // Keep last 10 states
  }, [filters])

  const clearFilters = useCallback(() => {
    setFilters({})
    setFilterHistory(prev => [...prev.slice(-9), filters])
  }, [filters])

  const undoFilters = useCallback(() => {
    if (filterHistory.length > 0) {
      const previousFilters = filterHistory[filterHistory.length - 1]
      setFilters(previousFilters)
      setFilterHistory(prev => prev.slice(0, -1))
    }
  }, [filterHistory])

  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(value => value !== undefined && value !== null && value !== '')
  }, [filters])

  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter(value =>
      value !== undefined && value !== null && value !== ''
    ).length
  }, [filters])

  return {
    filters,
    updateFilters,
    clearFilters,
    undoFilters,
    filterHistory,
    hasActiveFilters,
    activeFilterCount
  }
}

// Hook for optimizing pagination
export function useOptimizedPagination(totalItems: number, itemsPerPage: number = 12) {
  const [currentPage, setCurrentPage] = useState(1)
  const [prefetchedPages, setPrefetchedPages] = useState<Set<number>>(new Set())

  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems)

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }, [totalPages])

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1)
  }, [currentPage, goToPage])

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1)
  }, [currentPage, goToPage])

  const prefetchPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages && !prefetchedPages.has(page)) {
      setPrefetchedPages(prev => new Set(prev).add(page))
      // Prefetch logic should be implemented by consuming component
      return true
    }
    return false
  }, [totalPages, prefetchedPages])

  // Auto-prefetch next page when approaching current page end
  useEffect(() => {
    if (currentPage < totalPages) {
      prefetchPage(currentPage + 1)
    }
  }, [currentPage, totalPages, prefetchPage])

  const visiblePages = useMemo(() => {
    const delta = 2 // Number of pages to show around current page
    const range = []
    const rangeWithDots = []

    for (let i = Math.max(2, currentPage - delta);
         i <= Math.min(totalPages - 1, currentPage + delta);
         i++) {
      range.push(i)
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...')
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages)
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages)
    }

    return rangeWithDots
  }, [currentPage, totalPages])

  return {
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    visiblePages,
    goToPage,
    nextPage,
    prevPage,
    prefetchPage,
    prefetchedPages
  }
}