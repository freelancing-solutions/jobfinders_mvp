'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { JobRecommendation, MatchFilters, MatchSortOptions } from '@/types/matching';

interface UseJobRecommendationsOptions {
  filters?: MatchFilters;
  sort?: MatchSortOptions;
  pageSize?: number;
}

interface UseJobRecommendationsReturn {
  recommendations: JobRecommendation[];
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

export function useJobRecommendations(
  userId: string,
  options: UseJobRecommendationsOptions = {}
): UseJobRecommendationsReturn {
  const { data: session } = useSession();
  const [recommendations, setRecommendations] = useState<JobRecommendation[]>([]);
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

  const fetchRecommendations = useCallback(async (
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
        type: 'jobs-for-candidate',
        id: userId,
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
        const newRecommendations = data.data.data;

        if (refresh || pageNum === 0) {
          setRecommendations(newRecommendations);
        } else {
          setRecommendations(prev => [...prev, ...newRecommendations]);
        }

        setTotal(data.data.total);
        setHasMore(data.data.hasMore);
        setPage(pageNum);
      } else {
        throw new Error(data.error?.message || 'Failed to fetch recommendations');
      }
    } catch (err) {
      console.error('Error fetching job recommendations:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.user?.id, userId, filters, sort, pageSize]);

  // Initial load
  useEffect(() => {
    fetchRecommendations(0);
  }, [fetchRecommendations]);

  // Refresh when filters or sort change
  useEffect(() => {
    if (page === 0 && !loading) {
      fetchRecommendations(0, true);
    }
  }, [filters, sort, fetchRecommendations, page, loading]);

  const refetch = useCallback(async () => {
    await fetchRecommendations(0, true);
  }, [fetchRecommendations]);

  const loadMore = useCallback(async () => {
    if (!loading && hasMore) {
      await fetchRecommendations(page + 1);
    }
  }, [loading, hasMore, page, fetchRecommendations]);

  const nextPage = useCallback(() => {
    if (hasMore) {
      fetchRecommendations(page + 1);
    }
  }, [hasMore, page, fetchRecommendations]);

  const prevPage = useCallback(() => {
    if (page > 0) {
      fetchRecommendations(page - 1);
    }
  }, [page, fetchRecommendations]);

  const updateFilters = useCallback((newFilters: MatchFilters) => {
    setPage(0);
    setRecommendations([]);
    // The effect will handle the refetch
  }, []);

  const updateSort = useCallback((newSort: MatchSortOptions) => {
    setPage(0);
    setRecommendations([]);
    // The effect will handle the refetch
  }, []);

  return {
    recommendations,
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