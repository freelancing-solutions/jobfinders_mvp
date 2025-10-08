'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useToast } from '@/hooks/use-toast'

interface SavedJob {
  id: string
  title: string
  company: string
  location: string
  salaryMin?: number
  salaryMax?: number
  currency?: string
  positionType?: string
  remotePolicy?: string
  savedAt: string
  status?: 'saved' | 'applied' | 'interviewing' | 'follow-up' | 'archived'
  notes?: string
  tags?: string[]
  collectionId?: string
}

export function useSavedJobs() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch saved jobs
  const fetchSavedJobs = useCallback(async () => {
    if (!session?.user || session.user.role !== 'seeker') return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/saved-jobs')
      if (!response.ok) {
        throw new Error('Failed to fetch saved jobs')
      }

      const data = await response.json()
      setSavedJobs(data.data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch saved jobs'
      setError(errorMessage)
      console.error('Error fetching saved jobs:', err)
    } finally {
      setLoading(false)
    }
  }, [session])

  // Toggle save status of a job
  const toggleSave = useCallback(async (jobId: string) => {
    if (!session?.user || session.user.role !== 'seeker') {
      toast({
        title: "Authentication Required",
        description: "Please sign in as a job seeker to save jobs.",
        variant: "destructive"
      })
      return
    }

    const isCurrentlySaved = savedJobs.some(job => job.id === jobId)

    try {
      const method = isCurrentlySaved ? 'DELETE' : 'POST'
      const url = isCurrentlySaved ? `/api/saved-jobs/${jobId}` : '/api/saved-jobs'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        ...(method === 'POST' && { body: JSON.stringify({ jobId }) })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save job')
      }

      if (isCurrentlySaved) {
        setSavedJobs(prev => prev.filter(job => job.id !== jobId))
        toast({
          title: "Job Removed",
          description: "The job has been removed from your saved list."
        })
      } else {
        // For newly saved jobs, we need to add them to our local state
        // Since the API doesn't return the full job object, we'll refetch
        await fetchSavedJobs()
        toast({
          title: "Job Saved",
          description: "The job has been added to your saved list."
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save job'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
      console.error('Error toggling save:', err)
    }
  }, [session, savedJobs, toast, fetchSavedJobs])

  // Check if a job is saved
  const isJobSaved = useCallback((jobId: string) => {
    return savedJobs.some(job => job.id === jobId)
  }, [savedJobs])

  // Get array of saved job IDs
  const getSavedJobIds = useCallback(() => {
    return savedJobs.map(job => job.id)
  }, [savedJobs])

  // Update saved job details
  const updateSavedJob = useCallback(async (jobId: string, updates: Partial<SavedJob>) => {
    if (!session?.user || session.user.role !== 'seeker') return

    try {
      const response = await fetch(`/api/saved-jobs/${jobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update saved job')
      }

      setSavedJobs(prev => prev.map(job =>
        job.id === jobId ? { ...job, ...updates } : job
      ))

      toast({
        title: "Job Updated",
        description: "Your changes have been saved."
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update saved job'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
      console.error('Error updating saved job:', err)
    }
  }, [session, toast])

  // Remove saved job
  const removeSavedJob = useCallback(async (jobId: string) => {
    if (!session?.user || session.user.role !== 'seeker') return

    try {
      const response = await fetch(`/api/saved-jobs/${jobId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to remove saved job')
      }

      setSavedJobs(prev => prev.filter(job => job.id !== jobId))
      toast({
        title: "Job Removed",
        description: "The job has been removed from your saved list."
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove saved job'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
      console.error('Error removing saved job:', err)
    }
  }, [session, toast])

  // Export saved jobs
  const exportSavedJobs = useCallback(async (format: 'csv' | 'json', jobIds?: string[]) => {
    if (!session?.user || session.user.role !== 'seeker') return

    try {
      const response = await fetch('/api/saved-jobs/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ format, jobIds })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to export saved jobs')
      }

      if (format === 'csv') {
        // Create blob and download
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `saved-jobs-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      } else {
        // JSON format - return data for handling by caller
        const data = await response.json()
        return data.data
      }

      toast({
        title: "Export Successful",
        description: `Saved jobs exported as ${format.toUpperCase()}.`
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export saved jobs'
      toast({
        title: "Export Failed",
        description: errorMessage,
        variant: "destructive"
      })
      console.error('Error exporting saved jobs:', err)
    }
  }, [session, toast])

  // Load saved jobs on mount
  useEffect(() => {
    if (session?.user?.role === 'seeker') {
      fetchSavedJobs()
    }
  }, [session, fetchSavedJobs])

  return {
    savedJobs,
    loading,
    error,
    toggleSave,
    isJobSaved,
    getSavedJobIds,
    updateSavedJob,
    removeSavedJob,
    exportSavedJobs,
    refetch: fetchSavedJobs
  }
}