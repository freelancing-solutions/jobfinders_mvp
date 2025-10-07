'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { CandidateRecommendation, MatchFilters, MatchSortOptions } from '@/types/matching';

interface UseCandidateSuggestionsOptions {
  filters?: MatchFilters;
  sort?: MatchSortOptions;
  pageSize?: number;
}

interface UseCandidateSuggestionsReturn {
  suggestions: CandidateRecommendation[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  hasMore: boolean;
  total: number;
  page: number;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  nextPage: () => void;
  prevPage: () => void;
  updateFilters: (filters: MatchFilters) => void;
  updateSort: (sort: MatchSortOptions) => void;
}

export function useCandidateSuggestions(
  jobId: string,
  options: UseCandidateSuggestionsOptions = {}
): UseCandidateSuggestionsReturn {
  const { data: session } = useSession();
  const [suggestions, setSuggestions] = useState<CandidateRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);

  const {
    filters = {},
    sort = { field: 'matchScore', order: 'desc' },
    pageSize = 10
  } = options;

  const fetchSuggestions = useCallback(async (
    pageNum: number,
    refresh: boolean = false
  ) => {
    if (!session?.user?.id) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    if (refresh) {
      setRefreshing(true);
    } else if (pageNum === 0) {
      setLoading(true);
    }

    setError(null);

    try {
      const params = new URLSearchParams({
        type: 'candidates-for-job',
        id: jobId,
        limit: pageSize.toString(),
        offset: (pageNum * pageSize).toString(),
        filters: JSON.stringify(filters),
        sort: JSON.stringify(sort)
      });

      const response = await fetch(`/api/matching/find-matches?${params}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const newSuggestions = data.data.data;

        if (refresh || pageNum === 0) {
          setSuggestions(newSuggestions);
        } else {
          setSuggestions(prev => [...prev, ...newSuggestions]);
        }

        setTotal(data.data.total);
        setHasMore(data.data.hasMore);
        setPage(pageNum);
      } else {
        throw new Error(data.error?.message || 'Failed to fetch suggestions');
      }
    } catch (err) {
      console.error('Error fetching candidate suggestions:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.user?.id, jobId, filters, sort, pageSize]);

  // Initial load
  useEffect(() => {
    fetchSuggestions(0);
  }, [fetchSuggestions]);

  // Refresh when filters or sort change
  useEffect(() => {
    if (page === 0 && !loading) {
      fetchSuggestions(0, true);
    }
  }, [filters, sort, fetchSuggestions, page, loading]);

  const refetch = useCallback(async () => {
    await fetchSuggestions(0, true);
  }, [fetchSuggestions]);

  const loadMore = useCallback(async () => {
    if (!loading && hasMore) {
      await fetchSuggestions(page + 1);
    }
  }, [loading, hasMore, page, fetchSuggestions]);

  const nextPage = useCallback(() => {
    if (hasMore) {
      fetchSuggestions(page + 1);
    }
  }, [hasMore, page, fetchSuggestions]);

  const prevPage = useCallback(() => {
    if (page > 0) {
      fetchSuggestions(page - 1);
    }
  }, [page, fetchSuggestions]);

  const updateFilters = useCallback((newFilters: MatchFilters) => {
    setPage(0);
    setSuggestions([]);
    // The effect will handle the refetch
  }, []);

  const updateSort = useCallback((newSort: MatchSortOptions) => {
    setPage(0);
    setSuggestions([]);
    // The effect will handle the refetch
  }, []);

  return {
    suggestions,
    loading,
    error,
    refreshing,
    hasMore,
    total,
    page,
    refetch,
    loadMore,
    nextPage,
    prevPage,
    updateFilters,
    updateSort
  };
}