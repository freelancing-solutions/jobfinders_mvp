import { logger } from '@/lib/logger'
import { JobBoardJob, JobBoardConfig } from '@/services/matching/job-board-sync'

export interface IndeedConfig {
  publisherId: string
  apiKey?: string
  environment: 'production' | 'sandbox'
  version: string // API version
  rateLimit: {
    requestsPerDay: number
    requestsPerSecond: number
  }
  searchParams: {
    q?: string
    l?: string
    latlong?: string
    radius?: number
    limit?: number
    sort?: 'relevance' | 'date'
    fromage?: number // days
    highlight?: boolean
    filter?: string[]
    userip?: string
    userAgent?: string
  }
}

export interface IndeedSearchResult {
  totalResults: string
  start: number
  end: number
  results: IndeedJob[]
  statusCode: number
  error?: string
}

export interface IndeedJob {
  jobtitle: string
  company: string
  formattedLocation: string
  snippet: string
  url: string
  source: string
  date: string
  formattedRelativeTime: string
  formattedLocationFull: string
  latitude?: number
  longitude?: number
  jobkey: string
  expired: boolean
  indeedApply: boolean
  formattedSalary?: string
  salary?: string
  snippetHighlight?: {
    jobtitle?: string
    company?: string
    formattedLocation?: string
  }
  relatedLinks?: Array<{
    url: string
    text: string
  }>
}

export interface IndeedJobDetails extends IndeedJob {
  description?: string
  requirements?: string[]
  qualifications?: string[]
  benefits?: string[]
  jobType?: string
  experienceLevel?: string
  education?: string
  industry?: string
  remote?: boolean
  applyMethod?: 'indeed' | 'external' | 'email'
  contactInfo?: {
    email?: string
    phone?: string
    website?: string
  }
}

export class IndeedIntegration {
  private config: IndeedConfig
  private baseUrl: string

  constructor(config: IndeedConfig) {
    this.config = config
    this.baseUrl = config.environment === 'production'
      ? 'https://api.indeed.com/ads/apisearch'
      : 'https://api.indeed.com/apisearch'
  }

  /**
   * Search jobs on Indeed
   */
  async searchJobs(searchParams: Partial<IndeedConfig['searchParams']>): Promise<IndeedJob[]> {
    try {
      logger.info('Searching jobs on Indeed', { searchParams })

      // Build search parameters
      const params = {
        ...this.config.searchParams,
        ...searchParams,
        publisher: this.config.publisherId,
        v: this.config.version,
        format: 'json'
      }

      // Make API request
      const response = await this.makeAPIRequest('/apisearch', params)

      if (response.error) {
        throw new Error(`Indeed API error: ${response.error}`)
      }

      const jobs = response.results || []

      logger.info('Indeed search completed', {
        totalResults: response.totalResults,
        jobsFound: jobs.length
      })

      return jobs

    } catch (error) {
      logger.error('Error searching jobs on Indeed', { error, searchParams })
      throw new Error('Failed to search jobs on Indeed')
    }
  }

  /**
   * Get detailed job information
   */
  async getJobDetails(jobKey: string): Promise<IndeedJobDetails | null> {
    try {
      logger.info('Getting job details from Indeed', { jobKey })

      const params = {
        publisher: this.config.publisherId,
        v: this.config.version,
        format: 'json',
        jobkeys: jobKey
      }

      const response = await this.makeAPIRequest('/apisearch', params)

      if (response.error) {
        throw new Error(`Indeed API error: ${response.error}`)
      }

      const jobs = response.results || []
      return jobs.length > 0 ? { ...jobs[0], description: '' } : null

    } catch (error) {
      logger.error('Error getting job details from Indeed', { error, jobKey })
      return null
    }
  }

  /**
   * Convert Indeed job to standard format
   */
  convertToStandardJob(indeedJob: IndeedJob): JobBoardJob {
    return {
      id: `indeed-${indeedJob.jobkey}`,
      boardId: 'indeed',
      externalId: indeedJob.jobkey,
      title: indeedJob.jobtitle,
      description: indeedJob.snippet,
      company: indeedJob.company,
      location: indeedJob.formattedLocationFull || indeedJob.formattedLocation,
      salary: this.parseSalary(indeedJob.salary, indeedJob.formattedSalary),
      requirements: [],
      qualifications: [],
      benefits: [],
      jobType: this.inferJobType(indeedJob.snippet, indeedJob.jobtitle),
      experienceLevel: this.inferExperienceLevel(indeedJob.snippet, indeedJob.jobtitle),
      industry: this.inferIndustry(indeedJob.company),
      remoteWork: this.inferRemoteWork(indeedJob.snippet, indeedJob.formattedLocation),
      postedDate: this.parseDate(indeedJob.date, indeedJob.formattedRelativeTime),
      applicationUrl: indeedJob.url,
      applyMethod: indeedJob.indeedApply ? 'external' : 'external',
      tags: this.extractTags(indeedJob.snippet, indeedJob.jobtitle),
      metadata: {
        source: 'indeed',
        expired: indeedJob.expired,
        indeedApply: indeedJob.indeedApply,
        latitude: indeedJob.latitude,
        longitude: indeedJob.longitude,
        searchUrl: indeedJob.url,
        formattedLocation: indeedJob.formattedLocation,
        formattedRelativeTime: indeedJob.formattedRelativeTime,
        snippetHighlight: indeedJob.snippetHighlight,
        relatedLinks: indeedJob.relatedLinks
      }
    }
  }

  /**
   * Get job board configuration for Indeed
   */
  static getConfig(): JobBoardConfig {
    return {
      id: 'indeed',
      name: 'Indeed',
      type: 'api',
      apiEndpoint: 'https://api.indeed.com/ads/apisearch',
      rateLimit: {
        requestsPerHour: 1000,
        requestsPerMinute: 100,
        currentWindow: []
      },
      fieldMappings: [
        { sourceField: 'jobkey', targetField: 'externalId', required: true },
        { sourceField: 'jobtitle', targetField: 'title', required: true },
        { sourceField: 'snippet', targetField: 'description', required: true },
        { sourceField: 'company', targetField: 'company', required: true },
        { sourceField: 'formattedLocationFull', targetField: 'location', required: true },
        { sourceField: 'formattedLocation', targetField: 'location', required: false },
        { sourceField: 'formattedRelativeTime', targetField: 'postedDate', required: false, transform: 'parse_date' },
        { sourceField: 'date', targetField: 'postedDate', required: false, transform: 'parse_date' },
        { sourceField: 'url', targetField: 'applicationUrl', required: true },
        { sourceField: 'indeedApply', targetField: 'applyMethod', required: false, transform: (value: boolean) => value ? 'external' : 'external' }
      ],
      filters: {},
      syncFrequency: 'daily',
      isActive: false
    }
  }

  // Private helper methods

  private async makeAPIRequest(endpoint: string, params: Record<string, any>): Promise<IndeedSearchResult> {
    const url = new URL(`${this.baseUrl}${endpoint}`)

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value))
      }
    })

    // Check rate limits
    await this.checkRateLimit()

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'User-Agent': this.config.userAgent || 'JobFinders-API/1.0',
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data

    } catch (error) {
      logger.error('Indeed API request failed', { url: url.toString(), error })
      throw error
    }
  }

  private async checkRateLimit(): Promise<void> {
    // In a real implementation, you would track request timestamps
    // For now, we'll add a small delay to respect rate limits
    const delay = 1000 / this.config.rateLimit.requestsPerSecond
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  private parseSalary(salary?: string, formattedSalary?: string): { min?: number; max?: number; type?: string } | undefined {
    if (!salary && !formattedSalary) {
      return undefined
    }

    const salaryText = salary || formattedSalary || ''

    // Common salary patterns
    const patterns = [
      /\$(\d+(?:,\d{3})*(?:\.\d{2})?)\s*-\s*\$(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:per\s*year|annually|yr)/i,
      /\$(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:per\s*year|annually|yr)/i,
      /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*-\s*(\d+(?:,\d{3})*(?:\.\d{2})?)\s*k\s*(?:per\s*year|annually|yr)/i,
      /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*k\s*(?:per\s*year|annually|yr)/i,
      /\$(\d+(?:,\d{3})*(?:\.\d{2})?)\s*-\s*\$(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:per\s*hour|hr)/i,
      /\$(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:per\s*hour|hr)/i,
      /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*-\s*(\d+(?:,\d{3})*(?:\.\d{2})?)\s*k\s*(?:per\s*hour|hr)/i,
      /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*k\s*(?:per\s*hour|hr)/i
    ]

    for (const pattern of patterns) {
      const match = salaryText.match(pattern)
      if (match) {
        const parseNumber = (str: string) => {
          const num = str.replace(/[$,k]/g, '').replace(/,/g, '')
          const parsed = parseFloat(num)
          return str.includes('k') ? parsed * 1000 : parsed
        }

        if (match[1] && match[2]) {
          // Range format
          const min = parseNumber(match[1])
          const max = parseNumber(match[2])
          const type = this.determineSalaryType(salaryText)
          return { min, max, type }
        } else if (match[1]) {
          // Single value format
          const value = parseNumber(match[1])
          const type = this.determineSalaryType(salaryText)
          return { min: value, max: value, type }
        }
      }
    }

    return undefined
  }

  private determineSalaryType(salaryText: string): 'hourly' | 'yearly' | 'contract' {
    if (/hour|hr/i.test(salaryText)) {
      return 'hourly'
    } else if (/year|annually|yr/i.test(salaryText)) {
      return 'yearly'
    } else {
      // Default to yearly for professional jobs
      return 'yearly'
    }
  }

  private inferJobType(snippet: string, title: string): string {
    const text = `${snippet} ${title}`.toLowerCase()

    if (text.includes('contract') || text.includes('temporary') || text.includes('temp')) {
      return 'contract'
    } else if (text.includes('part-time') || text.includes('part time')) {
      return 'part-time'
    } else if (text.includes('full-time') || text.includes('full time')) {
      return 'full-time'
    } else if (text.includes('intern') || text.includes('internship')) {
      return 'internship'
    } else {
      return 'full-time' // Default assumption
    }
  }

  private inferExperienceLevel(snippet: string, title: string): string {
    const text = `${snippet} ${title}`.toLowerCase()

    if (text.includes('entry level') || text.includes('junior') || text.includes('associate')) {
      return 'entry'
    } else if (text.includes('mid-level') || text.includes('mid level') || text.includes('experienced')) {
      return 'mid'
    } else if (text.includes('senior') || text.includes('lead') || text.includes('principal')) {
      return 'senior'
    } else if (text.includes('director') || text.includes('manager') || text.includes('vp')) {
      return 'executive'
    } else {
      return 'not specified'
    }
  }

  private inferIndustry(company: string): string {
    // Simple industry inference based on company name
    const industryMap: Record<string, string> = {
      'google': 'Technology',
      'microsoft': 'Technology',
      'apple': 'Technology',
      'amazon': 'Technology',
      'facebook': 'Technology',
      'jp morgan': 'Finance',
      'goldman sachs': 'Finance',
      'bank of america': 'Finance',
      'wells fargo': 'Finance',
      'johnson & johnson': 'Healthcare',
      'pfizer': 'Healthcare',
      'unitedhealth': 'Healthcare',
      'mckesson': 'Healthcare',
      'general motors': 'Automotive',
      'ford': 'Automotive',
      'toyota': 'Automotive',
      'walmart': 'Retail',
      'target': 'Retail',
      'costco': 'Retail',
      'home depot': 'Retail'
    }

    const companyName = company.toLowerCase()
    for (const [key, industry] of Object.entries(industryMap)) {
      if (companyName.includes(key)) {
        return industry
      }
    }

    return 'not specified'
  }

  private inferRemoteWork(snippet: string, location: string): boolean {
    const text = `${snippet} ${location}`.toLowerCase()

    return text.includes('remote') ||
           text.includes('work from home') ||
           text.includes('wfh') ||
           text.includes('telecommute') ||
           location.toLowerCase().includes('remote')
  }

  private parseDate(date?: string, relativeTime?: string): Date {
    if (!date && !relativeTime) {
      return new Date()
    }

    if (date) {
      // Try parsing ISO date or other formats
      const parsedDate = new Date(date)
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate
      }
    }

    if (relativeTime) {
      // Parse relative time like "30 days ago"
      const match = relativeTime.match(/(\d+)\s*(hour|day|week|month|year)s?\s*ago/i)
      if (match) {
        const value = parseInt(match[1])
        const unit = match[2].toLowerCase()

        const now = new Date()
        switch (unit) {
          case 'hour':
            return new Date(now.getTime() - value * 60 * 60 * 1000)
          case 'day':
            return new Date(now.getTime() - value * 24 * 60 * 60 * 1000)
          case 'week':
            return new Date(now.getTime() - value * 7 * 24 * 60 * 60 * 1000)
          case 'month':
            return new Date(now.getTime() - value * 30 * 24 * 60 * 60 * 1000)
          case 'year':
            return new Date(now.getTime() - value * 365 * 24 * 60 * 60 * 1000)
          default:
            return now
        }
      }
    }

    return new Date()
  }

  private extractTags(snippet: string, title: string): string[] {
    const text = `${snippet} ${title}`.toLowerCase()
    const tags: string[] = []

    // Common skill/technology tags
    const skillTags = [
      'javascript', 'python', 'java', 'react', 'nodejs', 'aws', 'azure', 'docker',
      'kubernetes', 'sql', 'nosql', 'mongodb', 'postgresql', 'mysql', 'redis',
      'microservices', 'api', 'rest', 'graphql', 'machine learning', 'ai',
      'artificial intelligence', 'data science', 'analytics', 'devops', 'cicd',
      'agile', 'scrum', 'saas', 'cloud', 'security', 'cybersecurity',
      'mobile', 'ios', 'android', 'frontend', 'backend', 'full-stack',
      'ui', 'ux', 'design', 'product management', 'marketing', 'sales'
    ]

    skillTags.forEach(tag => {
      if (text.includes(tag)) {
        tags.push(tag)
      }
    })

    // Common benefit tags
    const benefitTags = [
      'remote', 'work from home', 'health insurance', '401k', 'flexible hours',
      'unlimited pto', 'stock options', 'bonus', 'signing bonus',
      'tuition reimbursement', 'gym membership', 'free lunch', 'casual dress'
    ]

    benefitTags.forEach(tag => {
      if (text.includes(tag)) {
        tags.push(tag)
      }
    })

    return [...new Set(tags)] // Remove duplicates
  }
}

export default IndeedIntegration