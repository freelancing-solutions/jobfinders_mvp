'use client'

import { useState, useEffect } from 'react'
import { Job } from '@/types/jobs'

interface JobDetailsResponse {
  success: boolean
  data: Job
  message?: string
}

export function useJobDetails(jobId: string) {
  const [job, setJob] = useState<Job | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchJobDetails() {
      if (!jobId) {
        setError('Job ID is required')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`/api/jobs/${jobId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Job not found')
          } else {
            throw new Error(`Failed to fetch job details: ${response.statusText}`)
          }
          return
        }

        const result: JobDetailsResponse = await response.json()
        
        if (!result.success) {
          throw new Error(result.message || 'Failed to fetch job details')
        }

        setJob(result.data)
      } catch (err) {
        console.error('Error fetching job details:', err)
        setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchJobDetails()
  }, [jobId])

  return { job, isLoading, error }
}