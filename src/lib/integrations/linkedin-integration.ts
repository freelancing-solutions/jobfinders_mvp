import { logger } from '@/lib/logger'
import { JobBoardJob, JobBoardConfig } from '@/services/matching/job-board-sync'

export interface LinkedInConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  scope: string[]
  environment: 'production' | 'sandbox'
  version: string // API version
  rateLimit: {
    requestsPerDay: number
    requestsPerMinute: number
    requestsPerHour: number
  }
  authConfig: {
    accessToken?: string
    refreshToken?: string
    tokenExpiresAt?: Date
  }
}

export interface LinkedInJob {
  id: string
  company: string
  entityUrn: string
  formattedLocation: string
  jobPostings?: {
    elements: Array<{
      id: string
      title: string
      description: {
        text: string
      }
      companyDetails: {
        company: {
          name: string
          logo: string
        }
      }
      formattedLocation: string
      listedAt: number
      listedAtText: string
      jobPostingState: string
      applicationMethod: string
      applyMethod: string
      remote: boolean
      salary: {
        minCompensation: {
          amount: number
          currencyCode: string
        }
        maxCompensation: {
          amount: number
          currencyCode: string
        }
        compensationType: string
      }
      workRemoteAllowed: boolean
      skills: Array<{
        name: string
        skillUrn: string
      }>
      company: {
        name: string
        logo: string
      }
      employmentType: string
      experienceLevel: string
      industries: Array<{
        id: string
        name: string
      }>
      benefits: string[]
      requirements?: {
        items: Array<{
          skill: string
          skillUrn: string
          required: boolean
        }>
      }
    }>
  }
}

export interface LinkedInJobDetails extends LinkedInJob {
  description: string
  requirements: string[]
  qualifications: string[]
  benefits: string[]
  jobType: string
  experienceLevel: string
  industry: string
  remote: boolean
  applyMethod: string
  contactInfo?: {
    email?: string
    phone?: string
    website?: string
  }
  salary?: {
    min?: number
    max?: number
    currency: string
    type: string
  }
}

export class LinkedInIntegration {
  private config: LinkedInConfig
  private baseUrl: string

  constructor(config: LinkedInConfig) {
    this.config = config
    this.baseUrl = config.environment === 'production'
      ? 'https://api.linkedin.com/v2'
      : 'https://api.linkedin.com/v2'
  }

  /**
   * Search jobs on LinkedIn
   */
  async searchJobs(searchParams: {
    keywords?: string
    location?: string
    jobType?: string
    experienceLevel?: string
    remote?: boolean
    count?: number
    start?: number
  }): Promise<LinkedInJob[]> {
    try {
      logger.info('Searching jobs on LinkedIn', { searchParams })

      // Ensure we have access token
      await this.ensureValidToken()

      // Build search parameters
      const params = new URLSearchParams()

      if (searchParams.keywords) {
        params.append('keywords', searchParams.keywords)
      }

      if (searchParams.location) {
        params.append('location', searchParams.location)
      }

      if (searchParams.jobType) {
        params.append('jobType', searchParams.jobType)
      }

      if (searchParams.experienceLevel) {
        params.append('experienceLevel', searchParams.experienceLevel)
      }

      if (searchParams.remote !== undefined) {
        params.append('remote', searchParams.remote.toString())
      }

      params.append('count', (searchParams.count || 25).toString())
      params.append('start', (searchParams.start || 0).toString())

      // Make API request
      const response = await this.makeAPIRequest('/jobSearch', params.toString())

      const jobs = response.elements || []

      logger.info('LinkedIn search completed', {
        jobsFound: jobs.length
      })

      return jobs

    } catch (error) {
      logger.error('Error searching jobs on LinkedIn', { error, searchParams })
      throw new Error('Failed to search jobs on LinkedIn')
    }
  }

  /**
   * Get detailed job information
   */
  async getJobDetails(jobId: string): Promise<LinkedInJobDetails | null> {
    try {
      logger.info('Getting job details from LinkedIn', { jobId })

      await this.ensureValidToken()

      // Get job posting details
      const jobDetails = await this.makeAPIRequest(`/jobPostings/${jobId}`, '')

      if (!jobDetails) {
        return null
      }

      // Enhance with additional details
      const enhancedJob: LinkedInJobDetails = {
        ...jobDetails,
        description: jobDetails.jobPostings?.elements[0]?.description?.text || '',
        requirements: this.extractRequirements(jobDetails),
        qualifications: this.extractQualifications(jobDetails),
        benefits: jobDetails.jobPostings?.elements[0]?.benefits || [],
        jobType: jobDetails.jobPostings?.elements[0]?.employmentType || 'Full-time',
        experienceLevel: jobDetails.jobPostings?.elements[0]?.experienceLevel || 'Not specified',
        industry: this.extractIndustry(jobDetails),
        remote: jobDetails.jobPostings?.elements[0]?.workRemoteAllowed || false,
        applyMethod: jobDetails.jobPostings?.elements[0]?.applicationMethod || 'external',
        salary: this.parseSalary(jobDetails.jobPostings?.elements[0]?.salary)
      }

      return enhancedJob

    } catch (error) {
      logger.error('Error getting job details from LinkedIn', { error, jobId })
      return null
    }
  }

  /**
   * Convert LinkedIn job to standard format
   */
  convertToStandardJob(linkedInJob: LinkedInJob): JobBoardJob {
    const jobPosting = linkedInJob.jobPostings?.elements[0]
    if (!jobPosting) {
      throw new Error('No job posting data available')
    }

    return {
      id: `linkedin-${jobPosting.id}`,
      boardId: 'linkedin',
      externalId: jobPosting.id,
      title: jobPosting.title,
      description: jobPosting.description.text,
      company: jobPosting.company?.name || linkedInJob.company,
      location: jobPosting.formattedLocation,
      salary: this.parseSalary(jobPosting.salary),
      requirements: this.extractRequirements({ jobPostings: { elements: [jobPosting] } }),
      qualifications: this.extractQualifications({ jobPostings: { elements: [jobPosting] } }),
      benefits: jobPosting.benefits || [],
      jobType: jobPosting.employmentType || 'Full-time',
      experienceLevel: jobPosting.experienceLevel || 'Not specified',
      industry: this.extractIndustry({ jobPostings: { elements: [jobPosting] } }),
      remoteWork: jobPosting.workRemoteAllowed || false,
      postedDate: new Date(jobPosting.listedAt),
      applicationUrl: this.buildApplicationUrl(jobPosting),
      applyMethod: this.determineApplyMethod(jobPosting),
      tags: this.extractTags(jobPosting),
      metadata: {
        source: 'linkedin',
        entityUrn: linkedInJob.entityUrn,
        formattedLocation: jobPosting.formattedLocation,
        listedAtText: jobPosting.listedAtText,
        jobPostingState: jobPosting.jobPostingState,
        applicationMethod: jobPosting.applicationMethod,
        applyMethod: jobPosting.applyMethod,
        workRemoteAllowed: jobPosting.workRemoteAllowed,
        logo: jobPosting.companyDetails?.company?.logo,
        employmentType: jobPosting.employmentType,
        skills: jobPosting.skills?.map(skill => skill.name),
        industries: jobPosting.industries?.map(industry => industry.name)
      }
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<void> {
    try {
      logger.info('Refreshing LinkedIn access token')

      if (!this.config.authConfig.refreshToken) {
        throw new Error('No refresh token available')
      }

      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.config.authConfig.refreshToken,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret
      })

      const response = await fetch(`${this.baseUrl}/oauth/v2/accessToken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      })

      if (!response.ok) {
        throw new Error(`Failed to refresh token: ${response.statusText}`)
      }

      const tokenData = await response.json()

      this.config.authConfig.accessToken = tokenData.access_token
      this.config.authConfig.refreshToken = tokenData.refresh_token
      this.config.authConfig.tokenExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000)

      logger.info('LinkedIn access token refreshed successfully')

    } catch (error) {
      logger.error('Error refreshing LinkedIn access token', { error })
      throw new Error('Failed to refresh LinkedIn access token')
    }
  }

  /**
   * Get job board configuration for LinkedIn
   */
  static getConfig(): JobBoardConfig {
    return {
      id: 'linkedin',
      name: 'LinkedIn',
      type: 'api',
      apiEndpoint: 'https://api.linkedin.com/v2',
      rateLimit: {
        requestsPerHour: 1000,
        requestsPerMinute: 100,
        currentWindow: []
      },
      fieldMappings: [
        { sourceField: 'id', targetField: 'externalId', required: true },
        { sourceField: 'title', targetField: 'title', required: true },
        { sourceField: 'description.text', targetField: 'description', required: true },
        { sourceField: 'company.name', targetField: 'company', required: true },
        { sourceField: 'formattedLocation', targetField: 'location', required: true },
        { sourceField: 'listedAt', targetField: 'postedDate', required: true, transform: 'parse_date' },
        { sourceField: 'remote', targetField: 'remoteWork', required: false },
        { sourceField: 'skills', targetField: 'tags', required: false, transform: (skills: any[]) => skills.map((s: any) => s.name) }
      ],
      filters: {},
      syncFrequency: 'daily',
      isActive: false
    }
  }

  // Private helper methods

  private async ensureValidToken(): Promise<void> {
    // Check if token exists and is not expired
    if (!this.config.authConfig.accessToken) {
      throw new Error('No access token available. Please authenticate first.')
    }

    if (this.config.authConfig.tokenExpiresAt && this.config.authConfig.tokenExpiresAt <= new Date()) {
      await this.refreshToken()
    }
  }

  private async makeAPIRequest(endpoint: string, params: string): Promise<any> {
    const url = `${this.baseUrl}${endpoint}${params ? '?' + params : ''}`

    await this.checkRateLimit()

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.authConfig.accessToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'JobFinders-API/1.0'
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          // Token might be expired, try refreshing
          await this.refreshToken()
          // Retry request with new token
          return this.makeAPIRequest(endpoint, params)
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()

    } catch (error) {
      logger.error('LinkedIn API request failed', { url, error })
      throw error
    }
  }

  private async checkRateLimit(): Promise<void> {
    // LinkedIn has strict rate limits
    const delay = 60000 / this.config.rateLimit.requestsPerMinute // 60 seconds / requests per minute
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  private parseSalary(salary?: any): { min?: number; max?: number; currency?: string; type?: string } | undefined {
    if (!salary) {
      return undefined
    }

    let min: number | undefined
    let max: number | undefined
    let currency = salary.currencyCode || 'USD'
    let type = salary.compensationType || 'yearly'

    if (salary.minCompensation) {
      min = salary.minCompensation.amount
    }

    if (salary.maxCompensation) {
      max = salary.maxCompensation.amount
    }

    // If only one value is provided, use it for both min and max
    if (min !== undefined && max === undefined) {
      max = min
    } else if (min === undefined && max !== undefined) {
      min = max
    }

    if (min !== undefined && max !== undefined) {
      return { min, max, currency, type }
    }

    return undefined
  }

  private extractRequirements(job: LinkedInJob): string[] {
    const jobPosting = job.jobPostings?.elements[0]
    if (!jobPosting?.requirements?.items) {
      return []
    }

    return jobPosting.requirements.items
      .filter(item => item.required)
      .map(item => item.skill)
  }

  private extractQualifications(job: LinkedInJob): string[] {
    const jobPosting = job.jobPostings?.elements[0]
    if (!jobPosting?.requirements?.items) {
      return []
    }

    return jobPosting.requirements.items
      .filter(item => !item.required)
      .map(item => item.skill)
  }

  private extractIndustry(job: LinkedInJob): string {
    const jobPosting = job.jobPostings?.elements[0]
    if (!jobPosting?.industries || jobPosting.industries.length === 0) {
      return 'Not specified'
    }

    return jobPosting.industries[0].name
  }

  private buildApplicationUrl(jobPosting: any): string {
    // LinkedIn doesn't provide direct application URLs in their API
    // You would need to build this based on the job posting URN
    if (jobPosting.entityUrn) {
      return `https://www.linkedin.com/jobs/view/${jobPosting.id}`
    }

    return '#'
  }

  private determineApplyMethod(jobPosting: any): 'internal' | 'external' | 'email' {
    switch (jobPosting.applyMethod?.toLowerCase()) {
      case 'easy_apply':
      case 'indeed_apply':
        return 'external'
      case 'email':
        return 'email'
      default:
        return 'external'
    }
  }

  private extractTags(jobPosting: any): string[] {
    const tags: string[] = []

    // Extract skills
    if (jobPosting.skills) {
      tags.push(...jobPosting.skills.map((skill: any) => skill.name))
    }

    // Extract industries
    if (jobPosting.industries) {
      tags.push(...jobPosting.industries.map((industry: any) => industry.name))
    }

    // Extract benefits
    if (jobPosting.benefits) {
      tags.push(...jobPosting.benefits)
    }

    // Extract job type and experience level
    if (jobPosting.employmentType) {
      tags.push(jobPosting.employmentType)
    }

    if (jobPosting.experienceLevel) {
      tags.push(jobPosting.experienceLevel)
    }

    if (jobPosting.workRemoteAllowed) {
      tags.push('remote')
    }

    return [...new Set(tags)] // Remove duplicates
  }
}

export default LinkedInIntegration