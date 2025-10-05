'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Job, SearchFilters, SearchState, SearchAction, JobSearchResponse } from '@/types/jobs';
import { useSearchJobs } from './use-jobs-api';

const DEFAULT_LIMIT = 12;

export function useJobSearch() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Initialize search state from URL parameters
  const initialFilters: SearchFilters = useMemo(() => ({
    query: searchParams.get('q') || undefined,
    location: searchParams.get('location') || undefined,
    category: searchParams.get('category') || undefined,
    salaryMin: searchParams.get('salaryMin') ? parseInt(searchParams.get('salaryMin')!) : undefined,
    salaryMax: searchParams.get('salaryMax') ? parseInt(searchParams.get('salaryMax')!) : undefined,
    experience: searchParams.get('experience') as any || undefined,
    type: searchParams.get('type') as any || undefined,
    remote: searchParams.get('remote') === 'true',
    sortBy: (searchParams.get('sortBy') as any) || 'relevance',
    sortOrder: (searchParams.get('sortOrder') as any) || 'desc',
  }), [searchParams]);

  const [searchState, setSearchState] = useState<SearchState>({
    filters: initialFilters,
    pagination: {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || DEFAULT_LIMIT.toString()),
      total: 0,
      totalPages: 0,
    },
    view: (searchParams.get('view') as 'grid' | 'list') || 'grid',
    isLoading: false,
    error: null,
    results: [],
    hasSearched: false,
  });

  // Update URL when search state changes
  const updateURL = useCallback((state: SearchState) => {
    const params = new URLSearchParams();
    
    // Add filters to URL
    if (state.filters.query) params.set('q', state.filters.query);
    if (state.filters.location) params.set('location', state.filters.location);
    if (state.filters.category) params.set('category', state.filters.category);
    if (state.filters.salaryMin) params.set('salaryMin', state.filters.salaryMin.toString());
    if (state.filters.salaryMax) params.set('salaryMax', state.filters.salaryMax.toString());
    if (state.filters.experience) params.set('experience', state.filters.experience);
    if (state.filters.type) params.set('type', state.filters.type);
    if (state.filters.remote !== undefined) params.set('remote', state.filters.remote.toString());
    if (state.filters.sortBy) params.set('sortBy', state.filters.sortBy);
    if (state.filters.sortOrder) params.set('sortOrder', state.filters.sortOrder);
    
    // Add pagination to URL
    if (state.pagination.page > 1) params.set('page', state.pagination.page.toString());
    if (state.pagination.limit !== DEFAULT_LIMIT) params.set('limit', state.pagination.limit.toString());
    
    // Add view preference
    if (state.view !== 'grid') params.set('view', state.view);

    const queryString = params.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
    
    router.push(newUrl, { scroll: false });
  }, [router, pathname]);

  // Search reducer function
  const searchReducer = useCallback((state: SearchState, action: SearchAction): SearchState => {
    switch (action.type) {
      case 'SET_FILTER':
        return {
          ...state,
          filters: { ...state.filters, ...action.payload },
          pagination: { ...state.pagination, page: 1 }, // Reset to first page when filters change
        };
      
      case 'CLEAR_FILTERS':
        return {
          ...state,
          filters: {},
          pagination: { ...state.pagination, page: 1 },
        };
      
      case 'SET_PAGINATION':
        return {
          ...state,
          pagination: { ...state.pagination, ...action.payload },
        };
      
      case 'SET_VIEW':
        return {
          ...state,
          view: action.payload,
        };
      
      case 'SET_LOADING':
        return {
          ...state,
          isLoading: action.payload,
        };
      
      case 'SET_ERROR':
        return {
          ...state,
          error: action.payload,
          isLoading: false,
        };
      
      case 'SET_RESULTS':
        return {
          ...state,
          results: action.payload.jobs,
          pagination: { ...state.pagination, ...action.payload.pagination },
          isLoading: false,
          error: null,
          hasSearched: true,
        };
      
      case 'RESET_SEARCH':
        return {
          ...state,
          results: [],
          hasSearched: false,
          error: null,
          pagination: { ...state.pagination, page: 1, total: 0, totalPages: 0 },
        };
      
      default:
        return state;
    }
  }, []);

  // Dispatch function for state updates
  const dispatch = useCallback((action: SearchAction) => {
    setSearchState(prev => {
      const newState = searchReducer(prev, action);
      updateURL(newState);
      return newState;
    });
  }, [searchReducer, updateURL]);

  // Update filters
  const updateFilters = useCallback((filters: Partial<SearchFilters>) => {
    dispatch({ type: 'SET_FILTER', payload: filters });
  }, [dispatch]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    dispatch({ type: 'CLEAR_FILTERS' });
  }, [dispatch]);

  // Update pagination
  const updatePagination = useCallback((pagination: Partial<typeof searchState.pagination>) => {
    dispatch({ type: 'SET_PAGINATION', payload: pagination });
  }, [dispatch]);

  // Change view
  const setView = useCallback((view: 'grid' | 'list') => {
    dispatch({ type: 'SET_VIEW', payload: view });
  }, [dispatch]);

  // Use the enhanced API hook for searching
  const searchQuery = useSearchJobs({
    ...searchState.filters,
    page: searchState.pagination.page,
    limit: searchState.pagination.limit,
  }, {
    enabled: searchState.hasSearched || Object.keys(searchState.filters).some(key => 
      searchState.filters[key as keyof SearchFilters] !== undefined && 
      searchState.filters[key as keyof SearchFilters] !== ''
    ),
    onSuccess: (data) => {
      setSearchState(prev => ({
        ...prev,
        results: data.jobs,
        pagination: { ...prev.pagination, ...data.pagination },
        isLoading: false,
        error: null,
        hasSearched: true,
      }));
    },
    onError: (error) => {
      setSearchState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Search failed',
      }));
    },
  });

  // Update loading state based on query status
  useEffect(() => {
    setSearchState(prev => ({
      ...prev,
      isLoading: searchQuery.isLoading,
    }));
  }, [searchQuery.isLoading]);

  // Perform search - now handled by React Query automatically
  const search = useCallback(async (resetPage = false) => {
    if (resetPage) {
      dispatch({ type: 'SET_PAGINATION', payload: { page: 1 } });
    }
    
    // Mark as searched to trigger the query
    setSearchState(prev => ({ ...prev, hasSearched: true }));
  }, [dispatch]);

  // Reset search
  const resetSearch = useCallback(() => {
    dispatch({ type: 'RESET_SEARCH' });
  }, [dispatch]);

  // Get facets and suggestions from the search query data
  const facets = useMemo(() => {
    return searchQuery.data?.facets || {
      categories: [],
      locations: [],
      types: [],
      experience: []
    };
  }, [searchQuery.data]);

  const suggestions = useMemo(() => {
    return searchQuery.data?.suggestions || [];
  }, [searchQuery.data]);

  // Memoized computed values
  const hasActiveFilters = useMemo(() => {
    return Object.values(searchState.filters).some(value => 
      value !== undefined && value !== null && value !== ''
    );
  }, [searchState.filters]);

  const activeFilterCount = useMemo(() => {
    return Object.values(searchState.filters).filter(value => 
      value !== undefined && value !== null && value !== ''
    ).length;
  }, [searchState.filters]);

  return {
    // State
    searchState,
    
    // Enhanced data from API
    facets,
    suggestions,
    
    // Computed values
    hasActiveFilters,
    activeFilterCount,
    
    // Loading states
    isLoading: searchQuery.isLoading,
    isFetching: searchQuery.isFetching,
    error: searchQuery.error,
    
    // Actions
    updateFilters,
    clearFilters,
    updatePagination,
    setView,
    search,
    resetSearch,
    
    // Direct dispatch access for advanced usage
    dispatch,
    
    // Access to raw query for advanced usage
    searchQuery,
  };
}