import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { EmbeddingService } from '@/services/matching/embedding-service'
import { CareerPathRecommender } from '@/lib/recommendations/career-path-recommender'

export interface SkillGapAnalysis {
  userId: string
  targetRole: string
  currentSkills: Array<{
    name: string
    level: number
    relevance: number
    lastUsed?: Date
    verified: boolean
  }>
  targetSkills: Array<{
    name: string
    requiredLevel: number
    importance: 'critical' | 'important' | 'nice-to-have'
    marketDemand: 'high' | 'medium' | 'low'
    trendDirection: 'growing' | 'stable' | 'declining'
  }>
  skillGaps: Array<{
    skill: string
    currentLevel: number
    requiredLevel: number
    gap: number
    priority: 'high' | 'medium' | 'low'
    estimatedTimeToBridge: string
    learningPath: string[]
    resources: Array<{
      type: 'course' | 'certification' | 'project' | 'book' | 'tutorial'
      title: string
      provider: string
      estimatedHours: number
      difficulty: 'beginner' | 'intermediate' | 'advanced'
      rating?: number
      cost?: {
        amount: number
        currency: string
      }
    }>
  }>
  overallReadiness: {
    percentage: number
    readinessLevel: 'not-ready' | 'somewhat-ready' | 'ready' | 'well-qualified'
    strengths: string[]
    improvementAreas: string[]
  }
  marketInsights: {
    roleDemand: 'low' | 'medium' | 'high' | 'very-high'
    salaryRange: {
      min: number
      max: number
      currency: string
    }
    growthProjection: number // percentage
    competitionLevel: 'low' | 'medium' | 'high'
    topHiringCompanies: string[]
    geographicHotspots: string[]
  }
  recommendations: {
    immediate: string[]
    shortTerm: string[]
    longTerm: string[]
    strategic: string[]
  }
}

export interface SkillGapRequest {
  userId: string
  targetRole: string
  currentRole?: string
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'expert'
  location?: string
  industry?: string
  salaryGoal?: number
  timeHorizon?: '3months' | '6months' | '1year' | '2years'
  learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'reading'
  budget?: {
    min: number
    max: number
    currency: string
  }
}

export class SkillGapAnalyzer {
  private embeddingService: EmbeddingService
  private careerPathRecommender: CareerPathRecommender

  constructor() {
    this.embeddingService = new EmbeddingService()
    this.careerPathRecommender = new CareerPathRecommender()
  }

  /**
   * Perform comprehensive skill gap analysis
   */
  async analyzeSkillGaps(request: SkillGapRequest): Promise<SkillGapAnalysis> {
    try {
      const { userId, targetRole, experienceLevel } = request

      logger.info('Starting skill gap analysis', {
        userId,
        targetRole,
        experienceLevel
      })

      // Get user's current profile and skills
      const userProfile = await this.getUserProfile(userId)
      const currentSkills = await this.analyzeCurrentSkills(userProfile)

      // Determine target skills for the role
      const targetSkills = await this.determineTargetSkills(targetRole, experienceLevel, request)

      // Calculate skill gaps
      const skillGaps = await this.calculateSkillGaps(currentSkills, targetSkills, request)

      // Assess overall readiness
      const overallReadiness = this.assessOverallReadiness(currentSkills, targetSkills, skillGaps)

      // Get market insights
      const marketInsights = await this.getMarketInsights(targetRole, request)

      // Generate recommendations
      const recommendations = await this.generateRecommendations(
        skillGaps,
        overallReadiness,
        marketInsights,
        request
      )

      const analysis: SkillGapAnalysis = {
        userId,
        targetRole,
        currentSkills,
        targetSkills,
        skillGaps,
        overallReadiness,
        marketInsights,
        recommendations
      }

      // Store analysis for tracking
      await this.storeSkillGapAnalysis(analysis)

      logger.info('Completed skill gap analysis', {
        userId,
        targetRole,
        readinessPercentage: overallReadiness.percentage,
        skillGapsCount: skillGaps.length
      })

      return analysis
    } catch (error) {
      logger.error('Error in skill gap analysis', {
        error,
        userId: request.userId,
        targetRole: request.targetRole
      })
      throw error
    }
  }

  /**
   * Get skill gap analysis for multiple roles
   */
  async compareSkillGapsAcrossRoles(
    userId: string,
    targetRoles: string[],
    options: Partial<SkillGapRequest> = {}
  ): Promise<{
    comparisons: Array<{
      role: string
      analysis: SkillGapAnalysis
      matchScore: number
      effortRequired: 'low' | 'medium' | 'high'
      timeToReadiness: string
    }>
    recommendation: {
      bestMatch: string
      reasoning: string
      alternative: string
    }
  }> {
    const analyses = await Promise.all(
      targetRoles.map(async (role) => {
        const analysis = await this.analyzeSkillGaps({
          userId,
          targetRole: role,
          ...options
        })

        const matchScore = analysis.overallReadiness.percentage
        const effortRequired = this.calculateEffortRequired(analysis.skillGaps)
        const timeToReadiness = this.estimateTimeToReadiness(analysis.skillGaps)

        return {
          role,
          analysis,
          matchScore,
          effortRequired,
          timeToReadiness
        }
      })
    )

    // Sort by match score and effort required
    const sortedAnalyses = analyses.sort((a, b) => {
      const scoreA = a.matchScore - (a.effortRequired === 'high' ? 20 : a.effortRequired === 'medium' ? 10 : 0)
      const scoreB = b.matchScore - (b.effortRequired === 'high' ? 20 : b.effortRequired === 'medium' ? 10 : 0)
      return scoreB - scoreA
    })

    return {
      comparisons: sortedAnalyses,
      recommendation: {
        bestMatch: sortedAnalyses[0]?.role || targetRoles[0],
        reasoning: this.generateRoleRecommendationReasoning(sortedAnalyses[0]),
        alternative: sortedAnalyses[1]?.role || targetRoles[1] || targetRoles[0]
      }
    }
  }

  /**
   * Track skill development progress
   */
  async trackSkillProgress(
    userId: string,
    skillUpdates: Array<{
      skillName: string
      newLevel: number
      learningActivity: string
      completedAt: Date
    }>
  ): Promise<{
    progressSummary: {
      skillsImproved: number
      averageImprovement: number
      readinessChange: number
      timeToReadinessChange: string
    }
    updatedAnalysis: SkillGapAnalysis
    achievements: Array<{
      type: 'milestone' | 'certification' | 'project' | 'level-up'
      title: string
      description: string
      achievedAt: Date
    }>
  }> {
    // Update user skills in database
    await this.updateUserSkills(userId, skillUpdates)

    // Get previous analysis for comparison
    const previousAnalysis = await this.getLatestSkillGapAnalysis(userId)

    // Generate new analysis
    const targetRole = previousAnalysis?.targetRole || 'Software Engineer' // Default fallback
    const updatedAnalysis = await this.analyzeSkillGaps({
      userId,
      targetRole
    })

    // Calculate progress
    const progressSummary = this.calculateProgressSummary(previousAnalysis, updatedAnalysis)

    // Identify achievements
    const achievements = await this.identifyAchievements(userId, skillUpdates, progressSummary)

    return {
      progressSummary,
      updatedAnalysis,
      achievements
    }
  }

  /**
   * Get personalized learning path
   */
  async getPersonalizedLearningPath(
    userId: string,
    targetRole: string,
    preferences: {
      learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'reading'
      timeCommitment?: number // hours per week
      budget?: number
      duration?: string // months
      preferredProviders?: string[]
    } = {}
  ): Promise<{
    phases: Array<{
      title: string
      duration: string
      skills: string[]
      activities: Array<{
        type: 'course' | 'project' | 'reading' | 'practice' | 'certification'
        title: string
        description: string
        estimatedHours: number
        resources: Array<{
          type: string
          title: string
          provider: string
          url?: string
          cost?: number
          rating?: number
        }>
      }>
      milestones: string[]
    }>
    totalDuration: string
    estimatedCost: {
      min: number
      max: number
      currency: string
    }
    successMetrics: string[]
  }> {
    const analysis = await this.analyzeSkillGaps({ userId, targetRole })

    // Group skill gaps by priority and dependencies
    const skillGroups = this.groupSkillsByDependencies(analysis.skillGaps)

    // Create learning phases
    const phases = await this.createLearningPhases(
      skillGroups,
      analysis.targetSkills,
      preferences
    )

    // Calculate total duration and cost
    const totalDuration = this.calculateTotalDuration(phases)
    const estimatedCost = this.calculateEstimatedCost(phases, preferences.budget)

    return {
      phases,
      totalDuration,
      estimatedCost,
      successMetrics: this.generateSuccessMetrics(analysis, targetRole)
    }
  }

  /**
   * Get user profile with skills
   */
  private async getUserProfile(userId: string): Promise<any> {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: {
            skills: {
              include: { skill: true }
            },
            education: true,
            experience: true,
            preferences: true
          }
        },
        applications: {
          include: {
            job: {
              include: {
                skills: true,
                company: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    })
  }

  /**
   * Analyze current skills
   */
  private async analyzeCurrentSkills(userProfile: any): Promise<SkillGapAnalysis['currentSkills']> {
    const profileSkills = userProfile.profile?.skills || []

    return profileSkills.map((ps: any) => ({
      name: ps.skill.name,
      level: ps.level || 5,
      relevance: this.calculateSkillRelevance(ps.skill, userProfile),
      lastUsed: ps.lastUsed,
      verified: ps.verified || false
    }))
  }

  /**
   * Determine target skills for a role
   */
  private async determineTargetSkills(
    targetRole: string,
    experienceLevel?: string,
    request?: SkillGapRequest
  ): Promise<SkillGapAnalysis['targetSkills']> {
    // Look at recent job postings for this role
    const jobs = await prisma.job.findMany({
      where: {
        title: { contains: targetRole, mode: 'insensitive' },
        ...(request?.location && {
          location: { contains: request.location, mode: 'insensitive' }
        }),
        ...(request?.industry && {
          company: { industry: { contains: request.industry, mode: 'insensitive' } }
        })
      },
      include: {
        skills: {
          include: { skill: true }
        }
      },
      take: 20,
      orderBy: { createdAt: 'desc' }
    })

    // Analyze skill frequency and importance
    const skillAnalysis = new Map<string, {
      count: number
      totalLevel: number
      avgLevel: number
      importance: number
    }>()

    jobs.forEach(job => {
      job.skills.forEach(js => {
        const skillName = js.skill.name
        const current = skillAnalysis.get(skillName) || {
          count: 0,
          totalLevel: 0,
          avgLevel: 0,
          importance: 0
        }

        skillAnalysis.set(skillName, {
          count: current.count + 1,
          totalLevel: current.totalLevel + js.level,
          avgLevel: (current.totalLevel + js.level) / (current.count + 1),
          importance: current.importance + js.importance
        })
      })
    })

    // Convert to target skills array
    const targetSkills: SkillGapAnalysis['targetSkills'] = Array.from(skillAnalysis.entries())
      .map(([name, data]) => ({
        name,
        requiredLevel: Math.round(data.avgLevel),
        importance: this.determineSkillImportance(data.count, jobs.length),
        marketDemand: this.getMarketDemand(name),
        trendDirection: this.getSkillTrendDirection(name)
      }))
      .sort((a, b) => {
        // Sort by importance first, then by market demand
        const importanceOrder = { critical: 3, important: 2, 'nice-to-have': 1 }
        const importanceDiff = importanceOrder[b.importance] - importanceOrder[a.importance]
        if (importanceDiff !== 0) return importanceDiff

        const demandOrder = { high: 3, medium: 2, low: 1 }
        return demandOrder[b.marketDemand] - demandOrder[a.marketDemand]
      })
      .slice(0, 15) // Top 15 skills

    return targetSkills
  }

  /**
   * Calculate skill gaps
   */
  private async calculateSkillGaps(
    currentSkills: SkillGapAnalysis['currentSkills'],
    targetSkills: SkillGapAnalysis['targetSkills'],
    request: SkillGapRequest
  ): Promise<SkillGapAnalysis['skillGaps']> {
    const skillGaps: SkillGapAnalysis['skillGaps'] = []

    targetSkills.forEach(targetSkill => {
      const currentSkill = currentSkills.find(cs => cs.name.toLowerCase() === targetSkill.name.toLowerCase())
      const currentLevel = currentSkill?.level || 0
      const gap = Math.max(0, targetSkill.requiredLevel - currentLevel)

      if (gap > 0) {
        skillGaps.push({
          skill: targetSkill.name,
          currentLevel,
          requiredLevel: targetSkill.requiredLevel,
          gap,
          priority: this.determineGapPriority(targetSkill.importance, gap),
          estimatedTimeToBridge: this.estimateTimeToBridge(gap, targetSkill),
          learningPath: await this.generateLearningPath(targetSkill.name, currentLevel, targetSkill.requiredLevel),
          resources: await this.findLearningResources(targetSkill.name, currentLevel, targetSkill.requiredLevel, request)
        })
      }
    })

    // Sort by priority and gap size
    return skillGaps.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      if (priorityDiff !== 0) return priorityDiff
      return b.gap - a.gap
    })
  }

  /**
   * Assess overall readiness
   */
  private assessOverallReadiness(
    currentSkills: SkillGapAnalysis['currentSkills'],
    targetSkills: SkillGapAnalysis['targetSkills'],
    skillGaps: SkillGapAnalysis['skillGaps']
  ): SkillGapAnalysis['overallReadiness'] {
    const totalTargetSkills = targetSkills.length
    const skillsWithGaps = skillGaps.length
    const skillsMet = totalTargetSkills - skillsWithGaps

    const percentage = totalTargetSkills > 0 ? Math.round((skillsMet / totalTargetSkills) * 100) : 0

    const readinessLevel = percentage >= 80 ? 'well-qualified' :
                          percentage >= 60 ? 'ready' :
                          percentage >= 40 ? 'somewhat-ready' : 'not-ready'

    const strengths = currentSkills
      .filter(cs => targetSkills.some(ts => ts.name.toLowerCase() === cs.name.toLowerCase()))
      .map(cs => cs.name)
      .slice(0, 5)

    const improvementAreas = skillGaps
      .filter(sg => sg.priority === 'high')
      .map(sg => sg.skill)
      .slice(0, 5)

    return {
      percentage,
      readinessLevel,
      strengths,
      improvementAreas
    }
  }

  /**
   * Get market insights for the role
   */
  private async getMarketInsights(
    targetRole: string,
    request: SkillGapRequest
  ): Promise<SkillGapAnalysis['marketInsights']> {
    const recentJobs = await prisma.job.findMany({
      where: {
        title: { contains: targetRole, mode: 'insensitive' },
        createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }, // Last 90 days
        ...(request.location && {
          location: { contains: request.location, mode: 'insensitive' }
        })
      },
      include: { company: true },
      take: 100
    })

    const roleDemand = recentJobs.length > 50 ? 'very-high' :
                      recentJobs.length > 25 ? 'high' :
                      recentJobs.length > 10 ? 'medium' : 'low'

    // Calculate salary range
    const salaries = recentJobs
      .filter(job => job.salaryMin && job.salaryMax)
      .map(job => ({ min: job.salaryMin!, max: job.salaryMax! }))

    const salaryRange = salaries.length > 0 ? {
      min: Math.min(...salaries.map(s => s.min)),
      max: Math.max(...salaries.map(s => s.max)),
      currency: 'USD'
    } : { min: 60000, max: 120000, currency: 'USD' }

    // Get top hiring companies
    const companyCounts = recentJobs.reduce((acc, job) => {
      acc[job.company.name] = (acc[job.company.name] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const topHiringCompanies = Object.entries(companyCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name)

    // Get geographic hotspots
    const locationCounts = recentJobs.reduce((acc, job) => {
      if (job.location) {
        acc[job.location] = (acc[job.location] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    const geographicHotspots = Object.entries(locationCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([location]) => location)

    return {
      roleDemand,
      salaryRange,
      growthProjection: 12.5, // Mock percentage
      competitionLevel: roleDemand === 'very-high' ? 'high' : roleDemand === 'low' ? 'low' : 'medium',
      topHiringCompanies,
      geographicHotspots
    }
  }

  /**
   * Generate recommendations
   */
  private async generateRecommendations(
    skillGaps: SkillGapAnalysis['skillGaps'],
    overallReadiness: SkillGapAnalysis['overallReadiness'],
    marketInsights: SkillGapAnalysis['marketInsights'],
    request: SkillGapRequest
  ): Promise<SkillGapAnalysis['recommendations']> {
    const immediate: string[] = []
    const shortTerm: string[] = []
    const longTerm: string[] = []
    const strategic: string[] = []

    // Immediate actions based on high-priority gaps
    const highPriorityGaps = skillGaps.filter(sg => sg.priority === 'high')
    if (highPriorityGaps.length > 0) {
      immediate.push(`Focus on critical skills: ${highPriorityGaps.slice(0, 3).map(sg => sg.skill).join(', ')}`)
      immediate.push('Create structured learning schedule')
    }

    // Short-term recommendations
    const mediumPriorityGaps = skillGaps.filter(sg => sg.priority === 'medium')
    if (mediumPriorityGaps.length > 0) {
      shortTerm.push(`Develop important skills: ${mediumPriorityGaps.slice(0, 3).map(sg => sg.skill).join(', ')}`)
      shortTerm.push('Build portfolio projects showcasing new skills')
    }

    // Long-term recommendations
    if (overallReadiness.readinessLevel === 'not-ready') {
      longTerm.push('Consider entry-level positions to gain experience')
      longTerm.push('Seek mentorship from industry professionals')
    } else if (overallReadiness.readinessLevel === 'ready') {
      longTerm.push('Prepare for technical interviews')
      longTerm.push('Network with target companies')
    }

    // Strategic recommendations based on market insights
    if (marketInsights.growthProjection > 15) {
      strategic.push(`${request.targetRole} field has strong growth potential - prioritize skill development`)
    }

    if (marketInsights.topHiringCompanies.length > 0) {
      strategic.push(`Target top employers: ${marketInsights.topHiringCompanies.slice(0, 3).join(', ')}`)
    }

    return {
      immediate,
      shortTerm,
      longTerm,
      strategic
    }
  }

  /**
   * Helper methods
   */
  private calculateSkillRelevance(skill: any, userProfile: any): number {
    // Calculate relevance based on recent usage and applications
    const recentApplications = userProfile.applications || []
    const skillInApplications = recentApplications.filter((app: any) =>
      app.job.skills.some((js: any) => js.skillId === skill.id)
    ).length

    return Math.min(skillInApplications / 5, 1) // Normalize to 0-1
  }

  private determineSkillImportance(count: number, totalJobs: number): 'critical' | 'important' | 'nice-to-have' {
    const percentage = (count / totalJobs) * 100
    if (percentage >= 60) return 'critical'
    if (percentage >= 30) return 'important'
    return 'nice-to-have'
  }

  private getMarketDemand(skillName: string): 'high' | 'medium' | 'low' {
    // Mock implementation - would typically query job market data
    const highDemandSkills = ['JavaScript', 'Python', 'React', 'AWS', 'Docker', 'Kubernetes']
    const mediumDemandSkills = ['Java', 'C#', 'Angular', 'Vue.js', 'MongoDB']

    if (highDemandSkills.some(skill => skillName.toLowerCase().includes(skill.toLowerCase()))) {
      return 'high'
    }
    if (mediumDemandSkills.some(skill => skillName.toLowerCase().includes(skill.toLowerCase()))) {
      return 'medium'
    }
    return 'low'
  }

  private getSkillTrendDirection(skillName: string): 'growing' | 'stable' | 'declining' {
    // Mock implementation - would typically analyze trend data
    const growingSkills = ['AI', 'Machine Learning', 'Cloud Computing', 'Cybersecurity', 'DevOps']
    const decliningSkills = ['Flash', 'jQuery', 'Internet Explorer']

    if (growingSkills.some(skill => skillName.toLowerCase().includes(skill.toLowerCase()))) {
      return 'growing'
    }
    if (decliningSkills.some(skill => skillName.toLowerCase().includes(skill.toLowerCase()))) {
      return 'declining'
    }
    return 'stable'
  }

  private determineGapPriority(importance: string, gap: number): 'high' | 'medium' | 'low' {
    if (importance === 'critical' && gap > 3) return 'high'
    if (importance === 'critical' && gap > 1) return 'medium'
    if (importance === 'important' && gap > 4) return 'high'
    if (importance === 'important' && gap > 2) return 'medium'
    return 'low'
  }

  private estimateTimeToBridge(gap: number, targetSkill: any): string {
    const baseTime = gap * 2 // months
    const difficultyMultiplier = targetSkill.requiredLevel > 7 ? 1.5 : 1
    const adjustedTime = baseTime * difficultyMultiplier

    if (adjustedTime <= 2) return '1-2 months'
    if (adjustedTime <= 4) return '3-4 months'
    if (adjustedTime <= 8) return '5-8 months'
    return '9+ months'
  }

  private async generateLearningPath(skillName: string, currentLevel: number, targetLevel: number): Promise<string[]> {
    const path: string[] = []

    if (currentLevel === 0) {
      path.push(`Learn ${skillName} fundamentals`)
      path.push('Complete beginner tutorials')
    }

    if (targetLevel >= 5 && currentLevel < 5) {
      path.push(`Develop intermediate ${skillName} skills`)
      path.push('Build practice projects')
    }

    if (targetLevel >= 8 && currentLevel < 8) {
      path.push(`Master advanced ${skillName} concepts`)
      path.push('Contribute to open source projects')
    }

    return path
  }

  private async findLearningResources(
    skillName: string,
    currentLevel: number,
    targetLevel: number,
    request: SkillGapRequest
  ): Promise<SkillGapAnalysis['skillGaps'][0]['resources']> {
    // Mock implementation - would integrate with real learning platforms
    const resources: SkillGapAnalysis['skillGaps'][0]['resources'] = []

    // Add course
    resources.push({
      type: 'course',
      title: `Complete ${skillName} Bootcamp`,
      provider: 'Tech Academy',
      estimatedHours: 40,
      difficulty: currentLevel < 3 ? 'beginner' : currentLevel < 7 ? 'intermediate' : 'advanced',
      rating: 4.5,
      cost: {
        amount: 99,
        currency: 'USD'
      }
    })

    // Add project
    resources.push({
      type: 'project',
      title: `${skillName} Portfolio Project`,
      provider: 'Project Platform',
      estimatedHours: 20,
      difficulty: 'intermediate',
      rating: 4.2
    })

    // Filter by budget if specified
    if (request.budget) {
      return resources.filter(r =>
        !r.cost ||
        (r.cost.amount >= request.budget!.min && r.cost.amount <= request.budget!.max)
      )
    }

    return resources
  }

  private async storeSkillGapAnalysis(analysis: SkillGapAnalysis): Promise<void> {
    // Store in database for tracking and historical comparison
    await prisma.skillGapAnalysis.create({
      data: {
        userId: analysis.userId,
        targetRole: analysis.targetRole,
        readinessPercentage: analysis.overallReadiness.percentage,
        skillGaps: analysis.skillGaps,
        recommendations: analysis.recommendations,
        createdAt: new Date()
      }
    })
  }

  private calculateEffortRequired(skillGaps: SkillGapAnalysis['skillGaps']): 'low' | 'medium' | 'high' {
    const totalGap = skillGaps.reduce((sum, gap) => sum + gap.gap, 0)
    const highPriorityCount = skillGaps.filter(gap => gap.priority === 'high').length

    if (totalGap > 20 || highPriorityCount > 5) return 'high'
    if (totalGap > 10 || highPriorityCount > 2) return 'medium'
    return 'low'
  }

  private estimateTimeToReadiness(skillGaps: SkillGapAnalysis['skillGaps']): string {
    const totalTime = skillGaps.reduce((sum, gap) => {
      const months = parseInt(gap.estimatedTimeToBridge) || 1
      return sum + months
    }, 0)

    if (totalTime <= 3) return '3 months or less'
    if (totalTime <= 6) return '3-6 months'
    if (totalTime <= 12) return '6-12 months'
    return 'Over 1 year'
  }

  private generateRoleRecommendationReasoning(comparison: any): string {
    if (!comparison) return 'No sufficient data for comparison'

    return `${comparison.role} offers the best match with ${comparison.matchScore}% readiness and ${comparison.effortRequired} effort required. Estimated time to readiness: ${comparison.timeToReadiness}.`
  }

  private async updateUserSkills(userId: string, skillUpdates: any[]): Promise<void> {
    for (const update of skillUpdates) {
      const skill = await prisma.skill.findFirst({
        where: { name: { contains: update.skillName, mode: 'insensitive' } }
      })

      if (skill) {
        await prisma.userSkill.upsert({
          where: {
            userId_skillId: {
              userId,
              skillId: skill.id
            }
          },
          update: {
            level: update.newLevel,
            lastUsed: new Date(),
            verified: true
          },
          create: {
            userId,
            skillId: skill.id,
            level: update.newLevel,
            verified: true
          }
        })
      }
    }
  }

  private async getLatestSkillGapAnalysis(userId: string): Promise<SkillGapAnalysis | null> {
    const analysis = await prisma.skillGapAnalysis.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })

    return analysis as SkillGapAnalysis | null
  }

  private calculateProgressSummary(
    previous: SkillGapAnalysis | null,
    current: SkillGapAnalysis
  ): SkillGapAnalysis['progressSummary'] {
    if (!previous) {
      return {
        skillsImproved: current.currentSkills.length,
        averageImprovement: 0,
        readinessChange: current.overallReadiness.percentage,
        timeToReadinessChange: this.estimateTimeToReadiness(current.skillGaps)
      }
    }

    const skillsImproved = current.overallReadiness.percentage - previous.overallReadiness.percentage
    const readinessChange = current.overallReadiness.percentage - previous.overallReadiness.percentage

    return {
      skillsImproved: Math.max(0, skillsImproved),
      averageImprovement: readinessChange,
      readinessChange,
      timeToReadinessChange: this.estimateTimeToReadiness(current.skillGaps)
    }
  }

  private async identifyAchievements(
    userId: string,
    skillUpdates: any[],
    progressSummary: any
  ): Promise<any[]> {
    const achievements: any[] = []

    for (const update of skillUpdates) {
      if (update.newLevel >= 8) {
        achievements.push({
          type: 'level-up',
          title: `Mastered ${update.skillName}`,
          description: `Achieved advanced level in ${update.skillName}`,
          achievedAt: update.completedAt
        })
      }
    }

    if (progressSummary.skillsImproved >= 5) {
      achievements.push({
        type: 'milestone',
        title: 'Rapid Skill Development',
        description: 'Improved 5 or more skills',
        achievedAt: new Date()
      })
    }

    return achievements
  }

  private groupSkillsByDependencies(skillGaps: SkillGapAnalysis['skillGaps']): any[] {
    // Group skills by logical dependencies and difficulty
    const groups = [
      {
        name: 'Foundation Skills',
        skills: skillGaps.filter(sg => sg.requiredLevel <= 4),
        priority: 'high'
      },
      {
        name: 'Core Skills',
        skills: skillGaps.filter(sg => sg.requiredLevel > 4 && sg.requiredLevel <= 7),
        priority: 'medium'
      },
      {
        name: 'Advanced Skills',
        skills: skillGaps.filter(sg => sg.requiredLevel > 7),
        priority: 'low'
      }
    ]

    return groups.filter(group => group.skills.length > 0)
  }

  private async createLearningPhases(
    skillGroups: any[],
    targetSkills: any[],
    preferences: any
  ): Promise<any[]> {
    return skillGroups.map((group, index) => ({
      title: group.name,
      duration: this.calculatePhaseDuration(group.skills, preferences.timeCommitment),
      skills: group.skills.map((sg: any) => sg.skill),
      activities: await this.createPhaseActivities(group.skills, preferences),
      milestones: this.generatePhaseMilestones(group.skills)
    }))
  }

  private calculatePhaseDuration(skills: any[], timeCommitment?: number): string {
    const totalHours = skills.reduce((sum, skill) => sum + skill.gap * 10, 0) // 10 hours per gap level
    const weeklyHours = timeCommitment || 10
    const weeks = Math.ceil(totalHours / weeklyHours)

    if (weeks <= 4) return `${weeks} weeks`
    if (weeks <= 12) return `${Math.round(weeks / 4)} months`
    return `${Math.round(weeks / 4)}+ months`
  }

  private async createPhaseActivities(skills: any[], preferences: any): Promise<any[]> {
    return skills.map((skill: any) => ({
      type: 'course',
      title: `${skill.skill} Development`,
      description: `Build ${skill.skill} skills from level ${skill.currentLevel} to ${skill.requiredLevel}`,
      estimatedHours: skill.gap * 10,
      resources: skill.resources.slice(0, 3) // Top 3 resources
    }))
  }

  private generatePhaseMilestones(skills: any[]): string[] {
    return [
      `Complete ${skills.length} skill development activities`,
      'Build portfolio project demonstrating new skills',
      'Pass skill assessment tests'
    ]
  }

  private calculateTotalDuration(phases: any[]): string {
    // Simple addition of phase durations
    return '6-12 months' // Mock implementation
  }

  private calculateEstimatedCost(phases: any[], budget?: number): { min: number; max: number; currency: string } {
    const costs = phases.flatMap(phase =>
      phase.activities.flatMap((activity: any) =>
        activity.resources
          .filter((r: any) => r.cost)
          .map((r: any) => r.cost.amount)
      )
    )

    if (costs.length === 0) {
      return { min: 0, max: 0, currency: 'USD' }
    }

    return {
      min: Math.min(...costs),
      max: Math.max(...costs),
      currency: 'USD'
    }
  }

  private generateSuccessMetrics(analysis: SkillGapAnalysis, targetRole: string): string[] {
    return [
      `Achieve ${analysis.overallReadiness.percentage + 20}% readiness for ${targetRole}`,
      'Complete all critical skill gaps',
      'Build portfolio of 3+ relevant projects',
      'Pass technical interviews with target companies'
    ]
  }
}