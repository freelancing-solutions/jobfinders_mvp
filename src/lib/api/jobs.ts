import { Job, JobSearchResponse, SearchFilters } from '@/types/jobs'

export interface JobsAPIConfig {
  baseUrl?: string
  timeout?: number
  retries?: number
  enableCache?: boolean
  cacheTimeout?: number
}

export interface JobsAPIClient {
  searchJobs: (filters: SearchFilters & { page?: number; limit?: number }) => Promise<JobSearchResponse>
  getJobById: (id: string) => Promise<Job | null>
  getSimilarJobs: (id: string, limit?: number) => Promise<Job[]>
  getJobSuggestions: (query: string) => Promise<string[]>
  saveJob: (jobId: string) => Promise<void>
  unsaveJob: (jobId: string) => Promise<void>
  getSavedJobs: () => Promise<Job[]>
  applyToJob: (jobId: string, data: ApplicationData) => Promise<ApplicationResponse>
  getApplicationStatus: (applicationId: string) => Promise<ApplicationStatus>
}

export interface ApplicationData {
  coverLetter?: string
  resumeId?: string
  answers?: Record<string, string>
  portfolioUrls?: string[]
}

export interface ApplicationResponse {
  success: boolean
  applicationId: string
  message: string
}

export interface ApplicationStatus {
  id: string
  status: 'pending' | 'viewed' | 'shortlisted' | 'rejected' | 'accepted'
  appliedAt: string
  updatedAt: string
  employerNote?: string
}

class Cache {
  private cache = new Map<string, { data: any; timestamp: number }>()
  private timeout: number

  constructor(timeout = 5 * 60 * 1000) { // 5 minutes default
    this.timeout = timeout
  }

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  get(key: string): any | null {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() - item.timestamp > this.timeout) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  clear(): void {
    this.cache.clear()
  }

  delete(key: string): void {
    this.cache.delete(key)
  }
}

class JobsAPIClientImpl implements JobsAPIClient {
  private baseUrl: string
  private timeout: number
  private retries: number
  private cache: Cache

  constructor(config: JobsAPIConfig = {}) {
    this.baseUrl = config.baseUrl || ''
    this.timeout = config.timeout || 10000
    this.retries = config.retries || 3
    this.cache = new Cache(config.cacheTimeout)
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    useCache = false
  ): Promise<T> {
    const cacheKey = `${endpoint}:${JSON.stringify(options)}`
    
    if (useCache) {
      const cached = this.cache.get(cacheKey)
      if (cached) return cached
    }

    const url = `${this.baseUrl}${endpoint}`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    let lastError: Error | null = null

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(
            errorData.error || `HTTP ${response.status}: ${response.statusText}`
          )
        }

        const data = await response.json()
        
        if (useCache) {
          this.cache.set(cacheKey, data)
        }

        return data
      } catch (error) {
        lastError = error as Error
        
        if (attempt === this.retries) {
          break
        }

        // Exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        )
      }
    }

    clearTimeout(timeoutId)
    throw lastError || new Error('Request failed')
  }

  async searchJobs(filters: SearchFilters & { page?: number; limit?: number }): Promise<JobSearchResponse> {
    const params = new URLSearchParams()
    
    // Map filters to API parameters
    if (filters.query) params.set('query', filters.query)
    if (filters.location) params.set('location', filters.location)
    if (filters.category) params.set('categoryId', filters.category)
    if (filters.salaryMin) params.set('salaryMin', filters.salaryMin.toString())
    if (filters.salaryMax) params.set('salaryMax', filters.salaryMax.toString())
    if (filters.experience) params.set('experienceLevel', filters.experience)
    if (filters.type) params.set('employmentType', filters.type)
    if (filters.remote) params.set('isRemote', 'true')
    if (filters.sortBy) {
      // Map sortBy to API ordering
      switch (filters.sortBy) {
        case 'date':
          params.set('sortBy', 'updatedAt')
          break
        case 'salary':
          params.set('sortBy', 'salary')
          break
        case 'popularity':
          params.set('sortBy', 'applicantCount')
          break
        default:
          params.set('sortBy', 'relevance')
      }
    }
    if (filters.sortOrder) params.set('sortOrder', filters.sortOrder)
    
    params.set('page', (filters.page || 1).toString())
    params.set('limit', (filters.limit || 12).toString())

    const response = await this.request<any>(`/api/jobs/search?${params.toString()}`)
    
    // Transform API response to match our interface
    return {
      jobs: response.data || [],
      pagination: response.pagination || {
        page: 1,
        limit: 12,
        total: 0,
        totalPages: 0
      },
      facets: response.facets || {
        categories: [],
        locations: [],
        types: [],
        experience: []
      },
      suggestions: response.suggestions || []
    }
  }

  async getJobById(id: string): Promise<Job | null> {
    try {
      const job = await this.request<Job>(`/api/jobs/${id}`, {}, true)
      return job
    } catch (error) {
      console.error(`Failed to fetch job ${id}:`, error)
      return null
    }
  }

  async getSimilarJobs(id: string, limit = 5): Promise<Job[]> {
    try {
      const response = await this.request<{ jobs: Job[] }>(
        `/api/jobs/${id}/similar?limit=${limit}`,
        {},
        true
      )
      return response.jobs || []
    } catch (error) {
      console.error(`Failed to fetch similar jobs for ${id}:`, error)
      return []
    }
  }

  async getJobSuggestions(query: string): Promise<string[]> {
    try {
      const response = await this.request<{ suggestions: string[] }>(
        `/api/jobs/suggestions?q=${encodeURIComponent(query)}`,
        {},
        true
      )
      return response.suggestions || []
    } catch (error) {
      console.error(`Failed to fetch job suggestions for "${query}":`, error)
      return []
    }
  }

  async saveJob(jobId: string): Promise<void> {
    await this.request('/api/jobs/saved', {
      method: 'POST',
      body: JSON.stringify({ jobId })
    })
    
    // Clear relevant cache entries
    this.cache.delete('/api/jobs/saved')
  }

  async unsaveJob(jobId: string): Promise<void> {
    await this.request(`/api/jobs/saved/${jobId}`, {
      method: 'DELETE'
    })
    
    // Clear relevant cache entries
    this.cache.delete('/api/jobs/saved')
  }

  async getSavedJobs(): Promise<Job[]> {
    try {
      const response = await this.request<{ jobs: Job[] }>(
        '/api/jobs/saved',
        {},
        true
      )
      return response.jobs || []
    } catch (error) {
      console.error('Failed to fetch saved jobs:', error)
      return []
    }
  }

  async applyToJob(jobId: string, data: ApplicationData): Promise<ApplicationResponse> {
    const response = await this.request<ApplicationResponse>('/api/applications', {
      method: 'POST',
      body: JSON.stringify({
        jobId,
        ...data
      })
    })
    
    // Clear relevant cache entries
    this.cache.delete(`/api/jobs/${jobId}`)
    this.cache.delete('/api/applications')
    
    return response
  }

  async getApplicationStatus(applicationId: string): Promise<ApplicationStatus> {
    try {
      const status = await this.request<ApplicationStatus>(
        `/api/applications/${applicationId}`,
        {},
        true
      )
      return status
    } catch (error) {
      console.error(`Failed to fetch application status for ${applicationId}:`, error)
      throw error
    }
  }

  // Utility methods
  clearCache(): void {
    this.cache.clear()
  }

  getCacheSize(): number {
    return (this.cache as any).cache.size
  }
}

// Create singleton instance
export const jobsAPI = new JobsAPIClientImpl({
  timeout: 10000,
  retries: 2,
  enableCache: true,
  cacheTimeout: 5 * 60 * 1000 // 5 minutes
})

// Export factory function for testing
export function createJobsAPIClient(config: JobsAPIConfig = {}): JobsAPIClient {
  return new JobsAPIClientImpl(config)
}

// Export types
export type { JobsAPIClient }