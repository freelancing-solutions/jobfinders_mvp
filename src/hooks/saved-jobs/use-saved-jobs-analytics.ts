'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useToast } from '@/hooks/use-toast'

interface SavedJobsAnalytics {
  totalSaved: number
  statusBreakdown: Record<string, number>
  companyStats: Array<{ name: string; count: number; averageSalary: number }>
  locationStats: Array<{ location: string; count: number }>
  salaryInsights: { averageMin: number; median: number; marketRate: number }
  timeBasedStats: Array<{ month: string; saved: number; applied: number; interviewing: number }>
  topSkills: Array<{ skill: string; count: number; applicationRate: number }>
  applicationConversionRate: number
  averageResponseTime: number
  positionTypeStats: Record<string, number>
  remotePolicyStats: Record<string, number>
  lastUpdated: string
}

export function useSavedJobsAnalytics() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [analytics, setAnalytics] = useState<SavedJobsAnalytics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = useCallback(async () => {
    if (!session?.user || session.user.role !== 'seeker') return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/saved-jobs/analytics')
      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }

      const data = await response.json()
      if (data.success) {
        setAnalytics(data.data)
      } else {
        throw new Error(data.error || 'Failed to fetch analytics')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analytics'
      setError(errorMessage)
      console.error('Error fetching analytics:', err)
    } finally {
      setLoading(false)
    }
  }, [session])

  // Auto-fetch analytics on mount
  useEffect(() => {
    if (session?.user?.role === 'seeker') {
      fetchAnalytics()
    }
  }, [session, fetchAnalytics])

  const refreshAnalytics = useCallback(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  return {
    analytics,
    loading,
    error,
    refreshAnalytics,
    refetch: fetchAnalytics
  }
}