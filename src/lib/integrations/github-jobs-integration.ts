import { logger } from '@/lib/logger'
import { JobBoardJob, JobBoardConfig } from '@/services/matching/job-board-sync'

export interface GitHubJobsConfig {
  searchTerms: string[]
  locations: string[]
  languages: string[]
  sort?: 'relevance' | 'date'
  order?: 'desc' | 'asc'
  limit?: number
  customParams?: Record<string, string>
}

export interface GitHubJobEntry {
  id: string
  type: string
  url: string
  created_at: string
  company: string
  company_url?: string
  location: string
  title: string
  description: string
  how_to_apply: string
  company_logo?: string
}

export interface GitHubJobsResponse {
  jobs: GitHubJobEntry[]
  message?: string
}

export class GitHubJobsIntegration {
  private config: GitHubJobsConfig
  private rssUrl: string
  private baseUrl: string

  constructor(config: GitHubJobsConfig) {
    this.config = config
    this.rssUrl = 'https://jobs.github.com/positions.json'
    this.baseUrl = 'https://jobs.github.com'
  }

  /**
   * Search jobs on GitHub Jobs
   */
  async searchJobs(searchParams: Partial<GitHubJobsConfig> = {}): Promise<GitHubJobEntry[]> {
    try {
      logger.info('Searching jobs on GitHub Jobs', { searchParams })

      // Merge config with search params
      const mergedConfig = {
        ...this.config,
        ...searchParams,
        limit: searchParams.limit || this.config.limit || 50
      }

      // Build search URL
      let url = this.rssUrl + '?'

      const params: string[] = []

      if (mergedConfig.searchTerms && mergedConfig.searchTerms.length > 0) {
        const searchTerms = mergedConfig.searchTerms.join(' ')
        params.push(`search=${encodeURIComponent(searchTerms)}`)
      }

      if (mergedConfig.locations && mergedConfig.locations.length > 0) {
        const locations = mergedConfig.locations.join('+')
        params.push(`location=${encodeURIComponent(locations)}`)
      }

      if (mergedConfig.languages && mergedConfig.languages.length > 0) {
        const languages = mergedConfig.languages.join(',')
        params.push(`language=${languages}`)
      }

      if (mergedConfig.sort) {
        params.push(`sort=${mergedConfig.sort}`)
      }

      if (mergedConfig.order) {
        params.push(`order=${mergedConfig.order}`)
      }

      url += params.join('&')

      if (mergedConfig.limit) {
        url += `&count=${mergedConfig.limit}`
      }

      // Add custom parameters
      if (mergedConfig.customParams) {
        Object.entries(mergedConfig.customParams).forEach(([key, value]) => {
          url += `&${key}=${encodeURIComponent(value)}`
        })
      }

      // Fetch jobs
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'JobFinders-API/1.0',
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data: GitHubJobsResponse = await response.json()

      if (data.message) {
        logger.warn('GitHub Jobs API message', { message: data.message })
      }

      const jobs = data.jobs || []

      logger.info('GitHub Jobs search completed', {
        jobsFound: jobs.length,
        searchParams: mergedConfig
      })

      return jobs

    } catch (error) {
      logger.error('Error searching jobs on GitHub Jobs', { error, searchParams })
      throw new Error('Failed to search jobs on GitHub Jobs')
    }
  }

  /**
   * Get detailed job information
   */
  async getJobDetails(jobId: string): Promise<GitHubJobEntry | null> {
    try {
      logger.info('Getting job details from GitHub Jobs', { jobId })

      // Get all jobs and find the specific one
      const allJobs = await this.searchJobs({})

      const job = allJobs.find(job => job.id === jobId)
      if (!job) {
        logger.warn('Job not found', { jobId })
        return null
      }

      // GitHub Jobs doesn't have detailed endpoints, so we return the basic job info
      return job

    } catch (error) {
      logger.error('Error getting job details from GitHub Jobs', { error, jobId })
      return null
    }
  }

  /**
   * Convert GitHub job to standard format
   */
  convertToStandardJob(githubJob: GitHubJobEntry): JobBoardJob {
    return {
      id: `github-${githubJob.id}`,
      boardId: 'github_jobs',
      externalId: githubJob.id,
      title: githubJob.title,
      description: githubJob.description,
      company: githubJob.company,
      location: githubJob.location,
      salary: undefined, // GitHub Jobs doesn't include salary information
      requirements: this.extractRequirements(githubJob.description),
      qualifications: this.extractQualifications(githubJob.description),
      benefits: this.extractBenefits(githubJob.description),
      jobType: this.inferJobType(githubJob.description, githubJob.title),
      experienceLevel: this.inferExperienceLevel(githubJob.description, githubJob.title),
      industry: this.inferIndustry(githubJob.company, githubJob.description),
      remoteWork: this.inferRemoteWork(githubJob.description, githubJob.location),
      postedDate: new Date(githubJob.created_at),
      applicationUrl: githubJob.url,
      applyMethod: this.determineApplyMethod(githubJob.how_to_apply),
      tags: this.extractTags(githubJob.description, githubJob.title),
      metadata: {
        source: 'github_jobs',
        type: githubJob.type,
        companyUrl: githubJob.company_url,
        companyLogo: githubJob.company_logo,
        howToApply: githubJob.how_to_apply,
        createdAt: githubJob.created_at
      }
    }
  }

  /**
   * Get RSS feed URL for custom RSS readers
   */
  getRSSFeedUrl(searchParams?: Partial<GitHubJobsConfig>): string {
    if (!searchParams || Object.keys(searchParams).length === 0) {
      return this.rssUrl
    }

    let url = this.rssUrl + '?'

    const params: string[] = []

    const mergedConfig = { ...this.config, ...searchParams }

    if (mergedConfig.searchTerms && mergedConfig.searchTerms.length > 0) {
      const searchTerms = mergedConfig.searchTerms.join(' ')
      params.push(`search=${encodeURIComponent(searchTerms)}`)
    }

    if (mergedConfig.locations && mergedConfig.locations.length > 0) {
      const locations = mergedConfig.locations.join('+')
      params.push(`location=${encodeURIComponent(locations)}`)
    }

    if (mergedConfig.languages && mergedConfig.languages.length > 0) {
      const languages = mergedConfig.languages.join(',')
      params.push(`language=${languages}`)
    }

    if (mergedConfig.sort) {
      params.push(`sort=${mergedConfig.sort}`)
    }

    if (mergedConfig.order) {
      params.push(`order=${mergedConfig.order}`)
    }

    url += params.join('&')
    return url
  }

  /**
   * Get job board configuration for GitHub Jobs
   */
  static getConfig(): JobBoardConfig {
    return {
      id: 'github_jobs',
      name: 'GitHub Jobs',
      type: 'rss',
      apiEndpoint: 'https://jobs.github.com/positions.json',
      rateLimit: {
        requestsPerHour: 1000,
        requestsPerMinute: 60,
        currentWindow: []
      },
      fieldMappings: [
        { sourceField: 'id', targetField: 'externalId', required: true },
        { sourceField: 'title', targetField: 'title', required: true },
        { sourceField: 'description', targetField: 'description', required: true },
        { sourceField: 'company', targetField: 'company', required: true },
        { sourceField: 'location', targetField: 'location', required: true },
        { sourceField: 'created_at', targetField: 'postedDate', required: true, transform: 'parse_date' },
        { sourceField: 'url', targetField: 'applicationUrl', required: true },
        { sourceField: 'how_to_apply', targetField: 'applyMethod', required: false },
        { sourceField: 'company_logo', targetField: 'metadata.companyLogo', required: false }
      ],
      filters: {},
      syncFrequency: 'hourly',
      isActive: false
    }
  }

  // Private helper methods

  private extractRequirements(description: string): string[] {
    const requirements: string[] = []
    const text = description.toLowerCase()

    // Look for common requirement patterns
    const requirementPatterns = [
      /(?:requirements|qualifications|skills|experience):\s*([^.\n]*)/i,
      /(?:you have|you're|must have|required):\s*([^.\n]*)/i,
      /(?:familiar with|experience with|knowledge of):\s*([^.\n]*)/i
    ]

    requirementPatterns.forEach(pattern => {
      const match = description.match(pattern)
      if (match && match[1]) {
        const requirementText = match[1].trim()
        // Split by common separators
        const items = requirementText.split(/(?:,|\n|;|•|–|—)/)
        items.forEach(item => {
          const trimmed = item.trim()
          if (trimmed && trimmed.length > 0) {
            requirements.push(trimmed)
          }
        })
      }
    })

    // Look for specific skills and technologies
    const skills = [
      'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'ruby', 'php',
      'react', 'vue', 'angular', 'node.js', 'express', 'django', 'flask', 'rails',
      'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ansible',
      'git', 'github', 'gitlab', 'bitbucket',
      'sql', 'mongodb', 'postgresql', 'mysql', 'redis',
      'rest', 'graphql', 'api', 'microservices',
      'linux', 'ubuntu', 'centos', 'windows',
      'testing', 'jest', 'cypress', 'selenium', 'playwright',
      'ci/cd', 'jenkins', 'travis', 'circleci', 'github actions'
    ]

    skills.forEach(skill => {
      if (text.includes(skill) && !requirements.includes(skill)) {
        requirements.push(skill)
      }
    })

    return [...new Set(requirements)]
  }

  private extractQualifications(description: string): string[] {
    const qualifications: string[] = []
    const text = description.toLowerCase()

    // Look for qualification patterns
    const qualificationPatterns = [
      /(?:education|degree|bachelor|master|phd|bsc|msc|phd):\s*([^.\n]*)/i,
      /(?:certified|certification):\s*([^.\n]*)/i,
      /(?:years of experience|(\d+)\s*(?:years?|yrs?)):\s*([^.\n]*)/i
    ]

    qualificationPatterns.forEach(pattern => {
      const match = description.match(pattern)
      if (match) {
        const qualificationText = match[2] || match[1]
        qualifications.push(qualificationText.trim())
      }
    })

    return [...new Set(qualifications)]
  }

  private extractBenefits(description: string): string[] {
    const benefits: string[] = []
    const text = description.toLowerCase()

    // Look for benefit keywords
    const benefitKeywords = [
      'remote', 'work from home', 'flexible hours', 'flexible schedule',
      'health insurance', 'dental insurance', 'vision insurance',
      '401k', 'retirement plan', 'pension',
      'unlimited pto', 'unlimited vacation', 'paid time off',
      'stock options', 'equity', 'bonus', 'signing bonus',
      'tuition reimbursement', 'education assistance',
      'gym membership', 'fitness',
      'free lunch', 'meals', 'snacks',
      'casual dress code', 'casual fridays',
      'pet friendly', 'dog friendly',
      'parental leave', 'maternity leave', 'paternity leave',
      'sabbatical', 'career development', 'training',
      'equipment budget', 'home office stipend'
    ]

    benefitKeywords.forEach(benefit => {
      if (text.includes(benefit)) {
        benefits.push(benefit)
      }
    })

    return [...new Set(benefits)]
  }

  private inferJobType(description: string, title: string): string {
    const text = `${description} ${title}`.toLowerCase()

    if (text.includes('contract') || text.includes('temporary') || text.includes('freelance')) {
      return 'contract'
    } else if (text.includes('part-time') || text.includes('part time')) {
      return 'part-time'
    } else if (text.includes('full-time') || text.includes('full time')) {
      return 'full-time'
    } else if (text.includes('intern') || text.includes('internship')) {
      return 'internship'
    } else if (text.includes('apprenticeship')) {
      return 'apprenticeship'
    } else if (text.includes('volunteer')) {
      return 'volunteer'
    } else {
      return 'full-time' // Default assumption
    }
  }

  private inferExperienceLevel(description: string, title: string): string {
    const text = `${description} ${title}`.toLowerCase()

    if (text.includes('entry level') || text.includes('junior') || text.includes('associate')) {
      return 'Entry'
    } else if (text.includes('mid-level') || text.includes('mid level') || text.includes('experienced')) {
      return 'Mid'
    } else if (text.includes('senior') || text.includes('lead') || text.includes('principal')) {
      return 'Senior'
    } else if (text.includes('director') || text.includes('manager') || text.includes('vp') || text.includes('head')) {
      return 'Executive'
    } else if (text.includes('intern')) {
      return 'Intern'
    } else {
      return 'Not specified'
    }
  }

  private inferIndustry(company: string, description: string): string {
    const text = `${company} ${description}`.toLowerCase()

    // Technology/Software industry
    if (text.includes('software') || text.includes('technology') || text.includes('tech')) {
      return 'Technology'
    }

    // Healthcare
    if (text.includes('health') || text.includes('medical') || text.includes('pharma')) {
      return 'Healthcare'
    }

    // Finance
    if (text.includes('finance') || text.includes('banking') || text.includes('financial')) {
      return 'Finance'
    }

    // Education
    if (text.includes('education') || text.includes('learning') || text.includes('teaching')) {
      return 'Education'
    }

    // Retail
    if (text.includes('retail') || text.includes('store') || text.includes('shop')) {
      return 'Retail'
    }

    // Manufacturing
    if (text.includes('manufacturing') || text.includes('production') || text.includes('factory')) {
      return 'Manufacturing'
    }

    // Consulting
    if (text.includes('consulting') || text.includes('consultancy')) {
      return 'Consulting'
    }

    // Media
    if (text.includes('media') || text.includes('publishing') || text.includes('content')) {
      return 'Media'
    }

    // Government
    if (text.includes('government') || text.includes('public sector')) {
      return 'Government'
    }

    // Non-profit
    if (text.includes('non-profit') || text.includes('nonprofit') || text.includes('charity')) {
      return 'Non-profit'
    }

    return 'Not specified'
  }

  private inferRemoteWork(description: string, location: string): boolean {
    const text = `${description} ${location}`.toLowerCase()

    return text.includes('remote') ||
           text.includes('work from home') ||
           text.includes('wfh') ||
           text.includes('telecommute') ||
           text.includes('distributed team') ||
           location.toLowerCase().includes('remote')
  }

  private determineApplyMethod(howToApply: string): 'internal' | 'external' | 'email' {
    const text = howToApply.toLowerCase()

    if (text.includes('github.com') || text.includes('apply via')) {
      return 'external'
    } else if (text.includes('email') || text.includes('@')) {
      return 'email'
    } else {
      return 'external'
    }
  }

  private extractTags(description: string, title: string): string[] {
    const text = `${description} ${title}`.toLowerCase()
    const tags: string[] = []

    // Technology tags
    const techTags = [
      'javascript', 'typescript', 'python', 'java', 'ruby', 'php', 'go', 'rust', 'swift',
      'react', 'vue', 'angular', 'svelte', 'next.js', 'gatsby', 'nuxt',
      'node.js', 'express', 'koa', 'fastify', 'nest',
      'django', 'flask', 'rails', 'laravel', 'symfony',
      'docker', 'kubernetes', 'terraform', 'ansible', 'puppet', 'chef',
      'aws', 'azure', 'gcp', 'digitalocean', 'heroku', 'netlify',
      'git', 'github', 'gitlab', 'bitbucket', 'sourcehut',
      'sql', 'nosql', 'mongodb', 'postgresql', 'mysql', 'redis', 'cassandra',
      'rest', 'graphql', 'api', 'restful', 'microservices',
      'linux', 'ubuntu', 'debian', 'centos', 'windows', 'macos',
      'testing', 'tdd', 'bdd', 'unit testing', 'integration testing',
      'ci/cd', 'devops', 'sre', 'infrastructure', 'deployment',
      'agile', 'scrum', 'kanban', 'lean', 'waterfall'
    ]

    techTags.forEach(tag => {
      if (text.includes(tag) && !tags.includes(tag)) {
        tags.push(tag)
      }
    })

    // Remote work tags
    if (this.inferRemoteWork(description, '')) {
      tags.push('remote')
    }

    // Experience level tags
    const experienceLevel = this.inferExperienceLevel(description, title)
    if (experienceLevel !== 'Not specified') {
      tags.push(experienceLevel.toLowerCase())
    }

    // Job type tags
    const jobType = this.inferJobType(description, title)
    if (jobType !== 'full-time') {
      tags.push(jobType)
    }

    return [...new Set(tags)]
  }
}

export default GitHubJobsIntegration