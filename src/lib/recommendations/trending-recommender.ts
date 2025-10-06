import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export interface TrendingRecommendation {
  id: string
  type: 'job' | 'skill' | 'company' | 'industry'
  trendScore: number
  trendDirection: 'up' | 'down' | 'stable'
  timeWindow: string
  metrics: {
    views: number
    applications: number
    engagement: number
    growth: number
    velocity: number
  }
  details: {
    title?: string
    company?: string
    location?: string
    category?: string
    description?: string
  }
  insights: string[]
  recommendation: {
    action: string
    priority: 'high' | 'medium' | 'low'
    reasoning: string
  }
}

export interface TrendingRequest {
  type: 'job' | 'skill' | 'company' | 'industry'
  timeWindow?: 'day' | 'week' | 'month' | 'quarter'
  limit?: number
  filters?: {
    location?: string[]
    industry?: string[]
    experienceLevel?: string[]
    salaryRange?: {
      min: number
      max: number
    }
    remoteOnly?: boolean
  }
  context?: {
    userId?: string
    userRole?: 'seeker' | 'employer'
    userSkills?: string[]
    userLocation?: string
    userIndustry?: string
  }
}

export class TrendingRecommender {
  /**
   * Get trending recommendations
   */
  async getTrendingRecommendations(request: TrendingRequest): Promise<TrendingRecommendation[]> {
    try {
      const { type, timeWindow = 'week', limit = 10, filters = {}, context = {} } = request

      logger.info('Generating trending recommendations', {
        type,
        timeWindow,
        limit,
        hasFilters: Object.keys(filters).length > 0,
        hasContext: Object.keys(context).length > 0
      })

      const timeRange = this.getTimeRange(timeWindow)

      switch (type) {
        case 'job':
          return this.getTrendingJobs(timeRange, limit, filters, context)
        case 'skill':
          return this.getTrendingSkills(timeRange, limit, filters, context)
        case 'company':
          return this.getTrendingCompanies(timeRange, limit, filters, context)
        case 'industry':
          return this.getTrendingIndustries(timeRange, limit, filters, context)
        default:
          throw new Error(`Unknown trending type: ${type}`)
      }
    } catch (error) {
      logger.error('Error generating trending recommendations', {
        error,
        type: request.type,
        timeWindow: request.timeWindow
      })
      throw error
    }
  }

  /**
   * Get trending jobs
   */
  private async getTrendingJobs(
    timeRange: { start: Date; end: Date; previousStart: Date; previousEnd: Date },
    limit: number,
    filters: TrendingRequest['filters'],
    context: TrendingRequest['context']
  ): Promise<TrendingRecommendation[]> {
    // Get current period metrics
    const currentMetrics = await this.getJobMetrics(timeRange.start, timeRange.end, filters)

    // Get previous period metrics for comparison
    const previousMetrics = await this.getJobMetrics(timeRange.previousStart, timeRange.previousEnd, filters)

    // Calculate trends and scores
    const trendingJobs = currentMetrics.map(current => {
      const previous = previousMetrics.find(p => p.jobId === current.jobId)
      const growth = this.calculateGrowth(current, previous)
      const velocity = this.calculateVelocity(current, previous, timeRange)

      return {
        ...current,
        growth,
        velocity,
        trendScore: this.calculateTrendScore(current, growth, velocity)
      }
    })

    // Sort by trend score
    trendingJobs.sort((a, b) => b.trendScore - a.trendScore)

    // Get detailed job information
    const jobDetails = await prisma.job.findMany({
      where: {
        id: { in: trendingJobs.slice(0, limit * 2).map(j => j.jobId) }
      },
      include: {
        company: true,
        skills: true,
        requirements: true
      }
    })

    // Create recommendations
    const recommendations = await Promise.all(
      trendingJobs.slice(0, limit).map(async (trendingJob, index) => {
        const job = jobDetails.find(j => j.id === trendingJob.jobId)
        if (!job) return null

        const personalizedScore = this.calculatePersonalizationScore(job, context)
        const insights = await this.generateJobInsights(trendingJob, job, context)
        const recommendation = this.generateJobRecommendation(trendingJob, job, index, context)

        return {
          id: job.id,
          type: 'job' as const,
          trendScore: trendingJob.trendScore,
          trendDirection: this.getTrendDirection(trendingJob.growth),
          timeWindow: this.formatTimeWindow(timeRange),
          metrics: {
            views: trendingJob.views,
            applications: trendingJob.applications,
            engagement: trendingJob.engagement,
            growth: trendingJob.growth,
            velocity: trendingJob.velocity
          },
          details: {
            title: job.title,
            company: job.company.name,
            location: job.location,
            category: this.getJobCategory(job),
            description: job.description.substring(0, 200) + '...'
          },
          insights,
          recommendation
        }
      })
    )

    return recommendations.filter(rec => rec !== null) as TrendingRecommendation[]
  }

  /**
   * Get trending skills
   */
  private async getTrendingSkills(
    timeRange: { start: Date; end: Date; previousStart: Date; previousEnd: Date },
    limit: number,
    filters: TrendingRequest['filters'],
    context: TrendingRequest['context']
  ): Promise<TrendingRecommendation[]> {
    // Get skill metrics from current period
    const currentSkillMetrics = await this.getSkillMetrics(timeRange.start, timeRange.end, filters)

    // Get previous period metrics
    const previousSkillMetrics = await this.getSkillMetrics(timeRange.previousStart, timeRange.previousEnd, filters)

    // Calculate trends
    const trendingSkills = currentSkillMetrics.map(current => {
      const previous = previousSkillMetrics.find(p => p.skill === current.skill)
      const growth = this.calculateSkillGrowth(current, previous)
      const velocity = this.calculateSkillVelocity(current, previous, timeRange)

      return {
        ...current,
        growth,
        velocity,
        trendScore: this.calculateSkillTrendScore(current, growth, velocity)
      }
    })

    // Sort by trend score
    trendingSkills.sort((a, b) => b.trendScore - a.trendScore)

    // Create recommendations
    const recommendations = await Promise.all(
      trendingSkills.slice(0, limit).map(async (trendingSkill, index) => {
        const insights = await this.generateSkillInsights(trendingSkill, context)
        const recommendation = this.generateSkillRecommendation(trendingSkill, index, context)

        return {
          id: trendingSkill.skill,
          type: 'skill' as const,
          trendScore: trendingSkill.trendScore,
          trendDirection: this.getTrendDirection(trendingSkill.growth),
          timeWindow: this.formatTimeWindow(timeRange),
          metrics: {
            views: trendingSkill.mentions,
            applications: trendingSkill.demand,
            engagement: trendingSkill.engagement,
            growth: trendingSkill.growth,
            velocity: trendingSkill.velocity
          },
          details: {
            title: trendingSkill.skill,
            category: this.getSkillCategory(trendingSkill.skill),
            description: this.getSkillDescription(trendingSkill.skill)
          },
          insights,
          recommendation
        }
      })
    )

    return recommendations
  }

  /**
   * Get trending companies
   */
  private async getTrendingCompanies(
    timeRange: { start: Date; end: Date; previousStart: Date; previousEnd: Date },
    limit: number,
    filters: TrendingRequest['filters'],
    context: TrendingRequest['context']
  ): Promise<TrendingRecommendation[]> {
    // Get company metrics
    const currentCompanyMetrics = await this.getCompanyMetrics(timeRange.start, timeRange.end, filters)
    const previousCompanyMetrics = await this.getCompanyMetrics(timeRange.previousStart, timeRange.previousEnd, filters)

    // Calculate trends
    const trendingCompanies = currentCompanyMetrics.map(current => {
      const previous = previousCompanyMetrics.find(p => p.companyId === current.companyId)
      const growth = this.calculateCompanyGrowth(current, previous)
      const velocity = this.calculateCompanyVelocity(current, previous, timeRange)

      return {
        ...current,
        growth,
        velocity,
        trendScore: this.calculateCompanyTrendScore(current, growth, velocity)
      }
    })

    // Sort by trend score
    trendingCompanies.sort((a, b) => b.trendScore - a.trendScore)

    // Get company details
    const companyDetails = await prisma.company.findMany({
      where: {
        id: { in: trendingCompanies.slice(0, limit).map(c => c.companyId) }
      },
      include: {
        jobs: {
          where: {
            createdAt: { gte: timeRange.start }
          }
        }
      }
    })

    // Create recommendations
    const recommendations = await Promise.all(
      trendingCompanies.slice(0, limit).map(async (trendingCompany, index) => {
        const company = companyDetails.find(c => c.id === trendingCompany.companyId)
        if (!company) return null

        const insights = await this.generateCompanyInsights(trendingCompany, company, context)
        const recommendation = this.generateCompanyRecommendation(trendingCompany, company, index, context)

        return {
          id: company.id,
          type: 'company' as const,
          trendScore: trendingCompany.trendScore,
          trendDirection: this.getTrendDirection(trendingCompany.growth),
          timeWindow: this.formatTimeWindow(timeRange),
          metrics: {
            views: trendingCompany.profileViews,
            applications: trendingCompany.applications,
            engagement: trendingCompany.engagement,
            growth: trendingCompany.growth,
            velocity: trendingCompany.velocity
          },
          details: {
            title: company.name,
            location: company.location,
            category: company.industry,
            description: company.description?.substring(0, 200) + '...'
          },
          insights,
          recommendation
        }
      })
    )

    return recommendations.filter(rec => rec !== null) as TrendingRecommendation[]
  }

  /**
   * Get trending industries
   */
  private async getTrendingIndustries(
    timeRange: { start: Date; end: Date; previousStart: Date; previousEnd: Date },
    limit: number,
    filters: TrendingRequest['filters'],
    context: TrendingRequest['context']
  ): Promise<TrendingRecommendation[]> {
    // Get industry metrics
    const currentIndustryMetrics = await this.getIndustryMetrics(timeRange.start, timeRange.end, filters)
    const previousIndustryMetrics = await this.getIndustryMetrics(timeRange.previousStart, timeRange.previousEnd, filters)

    // Calculate trends
    const trendingIndustries = currentIndustryMetrics.map(current => {
      const previous = previousIndustryMetrics.find(p => p.industry === current.industry)
      const growth = this.calculateIndustryGrowth(current, previous)
      const velocity = this.calculateIndustryVelocity(current, previous, timeRange)

      return {
        ...current,
        growth,
        velocity,
        trendScore: this.calculateIndustryTrendScore(current, growth, velocity)
      }
    })

    // Sort by trend score
    trendingIndustries.sort((a, b) => b.trendScore - a.trendScore)

    // Create recommendations
    const recommendations = await Promise.all(
      trendingIndustries.slice(0, limit).map(async (trendingIndustry, index) => {
        const insights = await this.generateIndustryInsights(trendingIndustry, context)
        const recommendation = this.generateIndustryRecommendation(trendingIndustry, index, context)

        return {
          id: trendingIndustry.industry,
          type: 'industry' as const,
          trendScore: trendingIndustry.trendScore,
          trendDirection: this.getTrendDirection(trendingIndustry.growth),
          timeWindow: this.formatTimeWindow(timeRange),
          metrics: {
            views: trendingIndustry.jobViews,
            applications: trendingIndustry.applications,
            engagement: trendingIndustry.engagement,
            growth: trendingIndustry.growth,
            velocity: trendingIndustry.velocity
          },
          details: {
            title: trendingIndustry.industry,
            category: 'Industry',
            description: this.getIndustryDescription(trendingIndustry.industry)
          },
          insights,
          recommendation
        }
      })
    )

    return recommendations
  }

  /**
   * Get job metrics for time period
   */
  private async getJobMetrics(startDate: Date, endDate: Date, filters: TrendingRequest['filters'] = {}): Promise<any[]> {
    const whereClause: any = {
      createdAt: { gte: startDate, lte: endDate },
      isActive: true
    }

    if (filters.location?.length > 0) {
      whereClause.location = { in: filters.location }
    }

    if (filters.industry?.length > 0) {
      whereClause.company = { industry: { in: filters.industry } }
    }

    if (filters.remoteOnly) {
      whereClause.isRemote = true
    }

    if (filters.salaryRange) {
      whereClause.OR = [
        { salaryMin: { gte: filters.salaryRange.min } },
        { salaryMax: { lte: filters.salaryRange.max } }
      ]
    }

    const jobs = await prisma.job.findMany({
      where: whereClause,
      include: {
        company: true,
        views: {
          where: { viewedAt: { gte: startDate, lte: endDate } }
        },
        applications: {
          where: { createdAt: { gte: startDate, lte: endDate } }
        }
      }
    })

    return jobs.map(job => ({
      jobId: job.id,
      views: job.views.length,
      applications: job.applications.length,
      engagement: this.calculateEngagement(job.views.length, job.applications.length),
      company: job.company.name,
      location: job.location,
      isRemote: job.isRemote
    }))
  }

  /**
   * Get skill metrics
   */
  private async getSkillMetrics(startDate: Date, endDate: Date, filters: TrendingRequest['filters'] = {}): Promise<any[]> {
    // Aggregate skill mentions in job postings
    const jobSkills = await prisma.jobSkill.groupBy({
      by: ['skillId'],
      where: {
        job: {
          createdAt: { gte: startDate, lte: endDate },
          isActive: true,
          ...(filters.industry?.length > 0 && {
            company: { industry: { in: filters.industry } }
          })
        }
      },
      _count: {
        skillId: true
      }
    })

    // Get skill details
    const skillIds = jobSkills.map(js => js.skillId)
    const skills = await prisma.skill.findMany({
      where: { id: { in: skillIds } }
    })

    // Count applications requiring these skills
    const applicationCounts = await Promise.all(
      skillIds.map(async skillId => {
        const count = await prisma.application.count({
          where: {
            createdAt: { gte: startDate, lte: endDate },
            job: {
              skills: { some: { skillId } }
            }
          }
        })
        return { skillId, count }
      })
    )

    return jobSkills.map(js => {
      const skill = skills.find(s => s.id === js.skillId)
      const appCount = applicationCounts.find(ac => ac.skillId === js.skillId)?.count || 0

      return {
        skill: skill?.name || 'Unknown',
        mentions: js._count.skillId,
        demand: appCount,
        engagement: this.calculateSkillEngagement(js._count.skillId, appCount)
      }
    })
  }

  /**
   * Get company metrics
   */
  private async getCompanyMetrics(startDate: Date, endDate: Date, filters: TrendingRequest['filters'] = {}): Promise<any[]> {
    const whereClause: any = {
      jobs: {
        some: {
          createdAt: { gte: startDate, lte: endDate },
          isActive: true,
          ...(filters.industry?.length > 0 && {
            company: { industry: { in: filters.industry } }
          })
        }
      }
    }

    if (filters.location?.length > 0) {
      whereClause.location = { in: filters.location }
    }

    const companies = await prisma.company.findMany({
      where: whereClause,
      include: {
        jobs: {
          where: { createdAt: { gte: startDate, lte: endDate } },
          include: {
            views: true,
            applications: true
          }
        },
        profileViews: {
          where: { viewedAt: { gte: startDate, lte: endDate } }
        }
      }
    })

    return companies.map(company => {
      const totalViews = company.jobs.reduce((sum, job) => sum + job.views.length, 0)
      const totalApplications = company.jobs.reduce((sum, job) => sum + job.applications.length, 0)

      return {
        companyId: company.id,
        profileViews: company.profileViews.length,
        jobViews: totalViews,
        applications: totalApplications,
        engagement: this.calculateEngagement(totalViews, totalApplications),
        jobCount: company.jobs.length
      }
    })
  }

  /**
   * Get industry metrics
   */
  private async getIndustryMetrics(startDate: Date, endDate: Date, filters: TrendingRequest['filters'] = {}): Promise<any[]> {
    const industries = await prisma.company.groupBy({
      by: ['industry'],
      where: {
        ...(filters.location?.length > 0 && {
          location: { in: filters.location }
        })
      }
    })

    const industryMetrics = await Promise.all(
      industries.map(async (industry) => {
        const companies = await prisma.company.findMany({
          where: { industry: industry.industry },
          include: {
            jobs: {
              where: { createdAt: { gte: startDate, lte: endDate } },
              include: {
                views: true,
                applications: true
              }
            }
          }
        })

        const totalViews = companies.reduce((sum, company) =>
          sum + company.jobs.reduce((jobSum, job) => jobSum + job.views.length, 0), 0
        )
        const totalApplications = companies.reduce((sum, company) =>
          sum + company.jobs.reduce((jobSum, job) => jobSum + job.applications.length, 0), 0
        )

        return {
          industry: industry.industry,
          jobViews: totalViews,
          applications: totalApplications,
          engagement: this.calculateEngagement(totalViews, totalApplications),
          companyCount: companies.length,
          jobCount: companies.reduce((sum, company) => sum + company.jobs.length, 0)
        }
      })
    )

    return industryMetrics
  }

  /**
   * Helper methods for calculations
   */
  private getTimeRange(timeWindow: string): { start: Date; end: Date; previousStart: Date; previousEnd: Date } {
    const now = new Date()
    let start: Date, previousStart: Date, previousEnd: Date

    switch (timeWindow) {
      case 'day':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        previousStart = new Date(start.getTime() - 24 * 60 * 60 * 1000)
        previousEnd = start
        break
      case 'week':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        previousStart = new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000)
        previousEnd = start
        break
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
        previousStart = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate())
        previousEnd = start
        break
      case 'quarter':
        start = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
        previousStart = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
        previousEnd = start
        break
      default:
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        previousStart = new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000)
        previousEnd = start
    }

    return {
      start,
      end: now,
      previousStart,
      previousEnd
    }
  }

  private calculateGrowth(current: any, previous: any | undefined): number {
    if (!previous || previous.views === 0) return current.views > 0 ? 100 : 0
    return ((current.views - previous.views) / previous.views) * 100
  }

  private calculateVelocity(current: any, previous: any | undefined, timeRange: any): number {
    const daysDiff = (timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24)
    return current.views / Math.max(daysDiff, 1)
  }

  private calculateTrendScore(current: any, growth: number, velocity: number): number {
    const normalizedGrowth = Math.min(Math.max(growth / 100, 0), 1)
    const normalizedVelocity = Math.min(velocity / 10, 1)
    const normalizedEngagement = Math.min(current.engagement / 100, 1)

    return (normalizedGrowth * 0.4) + (normalizedVelocity * 0.3) + (normalizedEngagement * 0.3)
  }

  private calculateEngagement(views: number, applications: number): number {
    if (views === 0) return 0
    return (applications / views) * 100
  }

  private getTrendDirection(growth: number): 'up' | 'down' | 'stable' {
    if (growth > 10) return 'up'
    if (growth < -10) return 'down'
    return 'stable'
  }

  private formatTimeWindow(timeRange: any): string {
    const daysDiff = (timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24)
    if (daysDiff <= 1) return 'Last 24 hours'
    if (daysDiff <= 7) return 'Last week'
    if (daysDiff <= 30) return 'Last month'
    return 'Last quarter'
  }

  // Additional helper methods for different types
  private calculateSkillGrowth(current: any, previous: any | undefined): number {
    if (!previous || previous.mentions === 0) return current.mentions > 0 ? 100 : 0
    return ((current.mentions - previous.mentions) / previous.mentions) * 100
  }

  private calculateSkillVelocity(current: any, previous: any | undefined, timeRange: any): number {
    const daysDiff = (timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24)
    return current.mentions / Math.max(daysDiff, 1)
  }

  private calculateSkillTrendScore(current: any, growth: number, velocity: number): number {
    const normalizedGrowth = Math.min(Math.max(growth / 100, 0), 1)
    const normalizedVelocity = Math.min(velocity / 5, 1)
    const normalizedDemand = Math.min(current.demand / 50, 1)

    return (normalizedGrowth * 0.4) + (normalizedVelocity * 0.3) + (normalizedDemand * 0.3)
  }

  private calculateCompanyGrowth(current: any, previous: any | undefined): number {
    if (!previous || previous.applications === 0) return current.applications > 0 ? 100 : 0
    return ((current.applications - previous.applications) / previous.applications) * 100
  }

  private calculateCompanyVelocity(current: any, previous: any | undefined, timeRange: any): number {
    const daysDiff = (timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24)
    return current.applications / Math.max(daysDiff, 1)
  }

  private calculateCompanyTrendScore(current: any, growth: number, velocity: number): number {
    const normalizedGrowth = Math.min(Math.max(growth / 100, 0), 1)
    const normalizedVelocity = Math.min(velocity / 5, 1)
    const normalizedEngagement = Math.min(current.engagement / 50, 1)

    return (normalizedGrowth * 0.4) + (normalizedVelocity * 0.3) + (normalizedEngagement * 0.3)
  }

  private calculateIndustryGrowth(current: any, previous: any | undefined): number {
    if (!previous || previous.applications === 0) return current.applications > 0 ? 100 : 0
    return ((current.applications - previous.applications) / previous.applications) * 100
  }

  private calculateIndustryVelocity(current: any, previous: any | undefined, timeRange: any): number {
    const daysDiff = (timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24)
    return current.applications / Math.max(daysDiff, 1)
  }

  private calculateIndustryTrendScore(current: any, growth: number, velocity: number): number {
    const normalizedGrowth = Math.min(Math.max(growth / 100, 0), 1)
    const normalizedVelocity = Math.min(velocity / 20, 1)
    const normalizedEngagement = Math.min(current.engagement / 30, 1)

    return (normalizedGrowth * 0.4) + (normalizedVelocity * 0.3) + (normalizedEngagement * 0.3)
  }

  private calculateSkillEngagement(mentions: number, demand: number): number {
    if (mentions === 0) return 0
    return (demand / mentions) * 100
  }

  private calculatePersonalizationScore(job: any, context: TrendingRequest['context']): number {
    if (!context.userId || !context.userSkills) return 0.5

    const jobSkills = job.skills?.map((s: any) => s.name.toLowerCase()) || []
    const userSkills = context.userSkills.map(s => s.toLowerCase())
    const matchingSkills = jobSkills.filter(skill => userSkills.includes(skill))

    const skillMatch = jobSkills.length > 0 ? matchingSkills.length / jobSkills.length : 0
    const locationMatch = context.userLocation && job.location === context.userLocation ? 0.2 : 0
    const industryMatch = context.userIndustry && job.company?.industry === context.userIndustry ? 0.2 : 0

    return Math.min(skillMatch + locationMatch + industryMatch, 1)
  }

  // Insight and recommendation generation methods
  private async generateJobInsights(trendingJob: any, job: any, context: TrendingRequest['context']): Promise<string[]> {
    const insights: string[] = []

    if (trendingJob.growth > 50) {
      insights.push(`Rapidly growing interest with ${Math.round(trendingJob.growth)}% increase in views`)
    }

    if (trendingJob.engagement > 10) {
      insights.push(`High engagement rate at ${Math.round(trendingJob.engagement)}% application conversion`)
    }

    if (trendingJob.velocity > 5) {
      insights.push('Fast-moving opportunity with high daily activity')
    }

    if (job.isRemote) {
      insights.push('Remote work option increases accessibility')
    }

    if (context.userSkills) {
      const matchingSkills = job.skills?.filter((skill: any) =>
        context.userSkills!.some(userSkill =>
          userSkill.toLowerCase() === skill.name.toLowerCase()
        )
      ) || []

      if (matchingSkills.length > 0) {
        insights.push(`You have ${matchingSkills.length} of the required skills`)
      }
    }

    return insights
  }

  private generateJobRecommendation(trendingJob: any, job: any, index: number, context: TrendingRequest['context']) {
    const priority = index < 3 ? 'high' : index < 7 ? 'medium' : 'low'
    let action = 'Apply now'
    let reasoning = ''

    if (trendingJob.growth > 100) {
      action = 'Apply immediately - high competition expected'
      reasoning = 'Job popularity is exploding rapidly'
    } else if (trendingJob.engagement > 15) {
      action = 'Apply with strong application'
      reasoning = 'High applicant-to-interview ratio - stand out required'
    } else if (index < 3) {
      action = 'Priority application recommended'
      reasoning = 'Top trending opportunity in your field'
    }

    return { action, priority, reasoning }
  }

  private async generateSkillInsights(trendingSkill: any, context: TrendingRequest['context']): Promise<string[]> {
    const insights: string[] = []

    if (trendingSkill.growth > 50) {
      insights.push(`Hot skill with ${Math.round(trendingSkill.growth)}% growth in demand`)
    }

    if (trendingSkill.demand > 20) {
      insights.push(`High demand - featured in ${trendingSkill.demand} recent applications`)
    }

    if (context.userSkills?.includes(trendingSkill.skill)) {
      insights.push('You already have this valuable skill')
    } else {
      insights.push('Learning this skill could boost your marketability')
    }

    return insights
  }

  private generateSkillRecommendation(trendingSkill: any, index: number, context: TrendingRequest['context']) {
    const priority = index < 3 ? 'high' : index < 7 ? 'medium' : 'low'
    const hasSkill = context.userSkills?.includes(trendingSkill.skill)

    let action = hasSkill ? 'Highlight in profile' : 'Consider learning'
    let reasoning = hasSkill
      ? 'Leverage this in-demand skill in your applications'
      : 'High-demand skill that could improve job prospects'

    return { action, priority, reasoning }
  }

  private async generateCompanyInsights(trendingCompany: any, company: any, context: TrendingRequest['context']): Promise<string[]> {
    const insights: string[] = []

    if (trendingCompany.growth > 50) {
      insights.push(`Growing company with ${Math.round(trendingCompany.growth)}% increase in applications`)
    }

    if (trendingCompany.jobCount > 5) {
      insights.push(`Actively hiring - ${trendingCompany.jobCount} open positions`)
    }

    if (company.industry) {
      insights.push(`Leader in ${company.industry} industry`)
    }

    return insights
  }

  private generateCompanyRecommendation(trendingCompany: any, company: any, index: number, context: TrendingRequest['context']) {
    const priority = index < 3 ? 'high' : index < 7 ? 'medium' : 'low'
    let action = 'Follow company'
    let reasoning = ''

    if (trendingCompany.jobCount > 3) {
      action = 'Browse all open positions'
      reasoning = 'Multiple opportunities available'
    } else {
      reasoning = 'Growing company with future opportunities'
    }

    return { action, priority, reasoning }
  }

  private async generateIndustryInsights(trendingIndustry: any, context: TrendingRequest['context']): Promise<string[]> {
    const insights: string[] = []

    if (trendingIndustry.growth > 30) {
      insights.push(`Booming industry with ${Math.round(trendingIndustry.growth)}% growth`)
    }

    if (trendingIndustry.jobCount > 50) {
      insights.push(`${trendingIndustry.jobCount} active job opportunities`)
    }

    return insights
  }

  private generateIndustryRecommendation(trendingIndustry: any, index: number, context: TrendingRequest['context']) {
    const priority = index < 3 ? 'high' : index < 7 ? 'medium' : 'low'
    let action = 'Explore industry jobs'
    let reasoning = 'Growing sector with expanding opportunities'

    return { action, priority, reasoning }
  }

  // Category and description helpers
  private getJobCategory(job: any): string {
    const title = job.title.toLowerCase()

    if (title.includes('engineer') || title.includes('developer')) return 'Engineering'
    if (title.includes('designer')) return 'Design'
    if (title.includes('manager') || title.includes('director')) return 'Management'
    if (title.includes('sales')) return 'Sales'
    if (title.includes('marketing')) return 'Marketing'

    return 'General'
  }

  private getSkillCategory(skill: string): string {
    const techSkills = ['javascript', 'python', 'react', 'nodejs', 'aws', 'docker']
    const designSkills = ['figma', 'sketch', 'photoshop', 'illustrator']
    const businessSkills = ['project management', 'analytics', 'strategy']

    const lowerSkill = skill.toLowerCase()

    if (techSkills.some(tech => lowerSkill.includes(tech))) return 'Technology'
    if (designSkills.some(design => lowerSkill.includes(design))) return 'Design'
    if (businessSkills.some(business => lowerSkill.includes(business))) return 'Business'

    return 'General'
  }

  private getSkillDescription(skill: string): string {
    const descriptions: Record<string, string> = {
      'javascript': 'Programming language for web development',
      'python': 'Versatile programming language for data science and web development',
      'react': 'JavaScript library for building user interfaces',
      'project management': 'Skill for planning and executing projects',
      'analytics': 'Data analysis and interpretation skills'
    }

    return descriptions[skill.toLowerCase()] || `Professional skill: ${skill}`
  }

  private getIndustryDescription(industry: string): string {
    const descriptions: Record<string, string> = {
      'technology': 'Software, hardware, and IT services',
      'healthcare': 'Medical services and health technology',
      'finance': 'Banking, investment, and financial services',
      'education': 'Learning and educational services',
      'retail': 'Sales of goods and services to consumers'
    }

    return descriptions[industry.toLowerCase()] || `${industry} sector`
  }
}