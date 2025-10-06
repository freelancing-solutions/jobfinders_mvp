import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { EmbeddingService } from '@/services/matching/embedding-service'
import { SimilarityRecommender } from '@/lib/recommendations/similarity-recommender'

export interface CareerPathRecommendation {
  careerPath: {
    title: string
    description: string
    requiredSkills: string[]
    experienceLevel: string
    salaryRange: {
      min: number
      max: number
      currency: string
    }
    growthPotential: 'low' | 'medium' | 'high'
    marketDemand: 'declining' | 'stable' | 'growing' | 'booming'
  }
  currentAssessment: {
    skillMatch: number
    experienceMatch: number
    readinessScore: number
    gaps: string[]
    strengths: string[]
  }
  nextSteps: {
    immediate: string[]
    shortTerm: string[]
    longTerm: string[]
  }
  timeline: {
    estimatedMonths: number
    milestones: Array<{
      title: string
      description: string
      estimatedMonths: number
      requiredActions: string[]
    }>
  }
  learningResources: Array<{
    type: 'course' | 'certification' | 'book' | 'project' | 'mentorship'
    title: string
    provider?: string
    duration?: string
    difficulty: 'beginner' | 'intermediate' | 'advanced'
    relevanceScore: number
  }>
  marketInsights: {
    demandTrend: 'declining' | 'stable' | 'growing' | 'booming'
    competitionLevel: 'low' | 'medium' | 'high'
    geographicOpportunities: string[]
    topCompanies: string[]
    salaryGrowth: number
  }
}

export interface SkillGapRecommendation {
  skill: string
  currentLevel: number
  targetLevel: number
  gap: number
  priority: 'high' | 'medium' | 'low'
  timeToAcquire: string
  learningResources: Array<{
    type: 'course' | 'certification' | 'project' | 'tutorial'
    title: string
    provider: string
    estimatedHours: number
    difficulty: string
    rating?: number
  }>
  careerRelevance: number
  marketDemand: number
}

export interface CareerPathRequest {
  userId: string
  currentRole?: string
  targetRoles?: string[]
  timeHorizon?: 'immediate' | '6months' | '1year' | '2years' | '5years'
  location?: string
  industry?: string
  salaryGoal?: number
  workStyle?: 'remote' | 'hybrid' | 'onsite'
  learningStyle?: 'self-paced' | 'structured' | 'bootcamp' | 'mentorship'
}

export class CareerPathRecommender {
  private embeddingService: EmbeddingService
  private similarityRecommender: SimilarityRecommender

  constructor() {
    this.embeddingService = new EmbeddingService()
    this.similarityRecommender = new SimilarityRecommender()
  }

  /**
   * Get comprehensive career path recommendations
   */
  async getCareerPathRecommendations(request: CareerPathRequest): Promise<CareerPathRecommendation[]> {
    try {
      const { userId, targetRoles, timeHorizon = '1year' } = request

      logger.info('Generating career path recommendations', {
        userId,
        targetRoles,
        timeHorizon
      })

      // Get user's current profile and skills
      const userProfile = await this.getUserProfile(userId)

      // Identify potential career paths
      const careerPaths = await this.identifyCareerPaths(userProfile, targetRoles, request)

      // Analyze each career path
      const recommendations = await Promise.all(
        careerPaths.map(async (path) => {
          return this.analyzeCareerPath(path, userProfile, request)
        })
      )

      // Sort by overall suitability and potential
      const sortedRecommendations = recommendations.sort((a, b) => {
        const scoreA = this.calculateOverallScore(a, userProfile, request)
        const scoreB = this.calculateOverallScore(b, userProfile, request)
        return scoreB - scoreA
      })

      logger.info('Generated career path recommendations', {
        userId,
        count: sortedRecommendations.length,
        topPath: sortedRecommendations[0]?.careerPath.title
      })

      return sortedRecommendations
    } catch (error) {
      logger.error('Error generating career path recommendations', {
        error,
        userId: request.userId
      })
      throw error
    }
  }

  /**
   * Get skill gap recommendations
   */
  async getSkillGapRecommendations(userId: string, targetRole?: string): Promise<SkillGapRecommendation[]> {
    try {
      logger.info('Generating skill gap recommendations', { userId, targetRole })

      const userProfile = await this.getUserProfile(userId)
      const targetSkills = await this.getTargetRoleSkills(targetRole, userProfile)

      const skillGaps = await Promise.all(
        targetSkills.map(async (targetSkill) => {
          return this.analyzeSkillGap(userProfile, targetSkill)
        })
      )

      // Sort by priority and gap size
      const sortedGaps = skillGaps
        .filter(gap => gap.gap > 0.1) // Only show meaningful gaps
        .sort((a, b) => {
          // Sort by priority first, then by gap size
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
          if (priorityDiff !== 0) return priorityDiff
          return b.gap - a.gap
        })

      return sortedGaps
    } catch (error) {
      logger.error('Error generating skill gap recommendations', {
        error,
        userId,
        targetRole
      })
      throw error
    }
  }

  /**
   * Get career progression suggestions
   */
  async getCareerProgressionSuggestions(userId: string): Promise<{
    nextRole: string
    timeline: string
    requiredSkills: string[]
    readinessPercentage: number
    actionPlan: string[]
  }> {
    try {
      const userProfile = await this.getUserProfile(userId)
      const currentRole = userProfile.profile?.experience?.[0]?.title || 'Unknown'

      // Find logical next roles
      const nextRoles = await this.findNextRoles(currentRole, userProfile)
      const recommendedNextRole = nextRoles[0]

      if (!recommendedNextRole) {
        throw new Error('Could not determine career progression path')
      }

      const requiredSkills = await this.getTargetRoleSkills(recommendedNextRole.title, userProfile)
      const readinessPercentage = this.calculateReadinessPercentage(userProfile, requiredSkills)

      const actionPlan = await this.generateActionPlan(userProfile, recommendedNextRole.title)

      return {
        nextRole: recommendedNextRole.title,
        timeline: recommendedNextRole.timeline,
        requiredSkills: requiredSkills.map(s => s.name),
        readinessPercentage,
        actionPlan
      }
    } catch (error) {
      logger.error('Error generating career progression suggestions', {
        error,
        userId
      })
      throw error
    }
  }

  /**
   * Get user profile with skills and experience
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
                company: true,
                skills: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    })
  }

  /**
   * Identify potential career paths
   */
  private async identifyCareerPaths(
    userProfile: any,
    targetRoles: string[] | undefined,
    request: CareerPathRequest
  ): Promise<any[]> {
    if (targetRoles && targetRoles.length > 0) {
      // Use user-specified target roles
      return targetRoles.map(role => ({ title: role, userSpecified: true }))
    }

    // Suggest career paths based on current skills and experience
    const currentSkills = userProfile.profile?.skills?.map((ps: any) => ps.skill.name) || []
    const currentExperience = userProfile.profile?.experience?.[0]?.title || ''

    const careerPaths = []

    // Path 1: Progression in current field
    if (currentExperience) {
      const nextRoles = await this.findNextRoles(currentExperience, userProfile)
      careerPaths.push(...nextRoles)
    }

    // Path 2: Transition to related fields
    const similarRoles = await this.findSimilarRoles(currentSkills, userProfile)
    careerPaths.push(...similarRoles)

    // Path 3: Emerging opportunities based on skills
    const emergingRoles = await this.findEmergingRoles(currentSkills, userProfile)
    careerPaths.push(...emergingRoles)

    return careerPaths
  }

  /**
   * Find next logical roles in career progression
   */
  private async findNextRoles(currentRole: string, userProfile: any): Promise<Array<{ title: string; timeline: string }>> {
    const roleProgression: Record<string, Array<{ title: string; timeline: string }>> = {
      'Junior Developer': [
        { title: 'Mid-Level Developer', timeline: '1-2 years' },
        { title: 'Senior Developer', timeline: '3-5 years' },
        { title: 'Tech Lead', timeline: '5-7 years' }
      ],
      'Mid-Level Developer': [
        { title: 'Senior Developer', timeline: '2-3 years' },
        { title: 'Tech Lead', timeline: '3-5 years' },
        { title: 'Engineering Manager', timeline: '5-7 years' }
      ],
      'Senior Developer': [
        { title: 'Tech Lead', timeline: '1-2 years' },
        { title: 'Engineering Manager', timeline: '3-4 years' },
        { title: 'Principal Engineer', timeline: '4-6 years' }
      ],
      'Junior Designer': [
        { title: 'Mid-Level Designer', timeline: '1-2 years' },
        { title: 'Senior Designer', timeline: '3-4 years' },
        { title: 'Design Lead', timeline: '5-7 years' }
      ],
      'Product Manager': [
        { title: 'Senior Product Manager', timeline: '2-3 years' },
        { title: 'Principal Product Manager', timeline: '4-6 years' },
        { title: 'Director of Product', timeline: '6-8 years' }
      ]
    }

    // Normalize the current role to find progression
    const normalizedRole = this.normalizeRole(currentRole)
    return roleProgression[normalizedRole] || []
  }

  /**
   * Find similar roles based on skills
   */
  private async findSimilarRoles(currentSkills: string[], userProfile: any): Promise<Array<{ title: string }>> {
    // Look for jobs that match current skills but are in different domains
    const similarJobs = await prisma.job.findMany({
      where: {
        skills: {
          some: {
            skill: {
              name: { in: currentSkills }
            }
          }
        },
        title: {
          notIn: userProfile.profile?.experience?.map((exp: any) => exp.title) || []
        }
      },
      include: {
        skills: {
          include: { skill: true }
        }
      },
      take: 20,
      orderBy: { createdAt: 'desc' }
    })

    // Group by job title and calculate similarity
    const titleGroups = similarJobs.reduce((groups, job) => {
      const normalizedTitle = this.normalizeJobTitle(job.title)
      if (!groups[normalizedTitle]) {
        groups[normalizedTitle] = []
      }
      groups[normalizedTitle].push(job)
      return groups
    }, {} as Record<string, any[]>)

    // Return unique role titles
    return Object.keys(titleGroups).map(title => ({ title }))
  }

  /**
   * Find emerging roles based on market trends
   */
  private async findEmergingRoles(currentSkills: string[], userProfile: any): Promise<Array<{ title: string }>> {
    // Look for recently posted jobs that require a subset of current skills
    const recentJobs = await prisma.job.findMany({
      where: {
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
        OR: currentSkills.map(skill => ({
          skills: {
            some: {
              skill: { name: skill }
            }
          }
        }))
      },
      select: { title: true },
      distinct: ['title'],
      take: 15
    })

    return recentJobs.map(job => ({ title: job.title }))
  }

  /**
   * Analyze a specific career path
   */
  private async analyzeCareerPath(
    careerPath: any,
    userProfile: any,
    request: CareerPathRequest
  ): Promise<CareerPathRecommendation> {
    const targetSkills = await this.getTargetRoleSkills(careerPath.title, userProfile)

    // Assess current readiness
    const currentAssessment = await this.assessCurrentReadiness(userProfile, targetSkills)

    // Generate next steps
    const nextSteps = this.generateNextSteps(currentAssessment, request.timeHorizon)

    // Create timeline with milestones
    const timeline = this.createTimeline(currentAssessment, request.timeHorizon)

    // Find learning resources
    const learningResources = await this.findLearningResources(targetSkills, currentAssessment.gaps, request)

    // Get market insights
    const marketInsights = await this.getMarketInsights(careerPath.title, request)

    return {
      careerPath: {
        title: careerPath.title,
        description: await this.generateCareerDescription(careerPath.title, targetSkills),
        requiredSkills: targetSkills.map(s => s.name),
        experienceLevel: this.determineExperienceLevel(careerPath.title),
        salaryRange: await this.getSalaryRange(careerPath.title, request.location),
        growthPotential: this.assessGrowthPotential(careerPath.title, targetSkills),
        marketDemand: marketInsights.demandTrend
      },
      currentAssessment,
      nextSteps,
      timeline,
      learningResources,
      marketInsights
    }
  }

  /**
   * Assess current readiness for career path
   */
  private async assessCurrentReadiness(
    userProfile: any,
    targetSkills: any[]
  ): Promise<CareerPathRecommendation['currentAssessment']> {
    const userSkills = userProfile.profile?.skills || []
    const userSkillNames = userSkills.map((us: any) => us.skill.name.toLowerCase())
    const targetSkillNames = targetSkills.map(ts => ts.name.toLowerCase())

    // Calculate skill match
    const matchingSkills = targetSkillNames.filter(skill => userSkillNames.includes(skill))
    const skillMatch = targetSkillNames.length > 0 ? matchingSkills.length / targetSkillNames.length : 0

    // Calculate experience match
    const userExperience = userProfile.profile?.totalExperience || 0
    const requiredExperience = this.getRequiredExperience(targetSkills)
    const experienceMatch = Math.min(userExperience / requiredExperience, 1)

    // Overall readiness score
    const readinessScore = (skillMatch * 0.7) + (experienceMatch * 0.3)

    // Identify gaps and strengths
    const gaps = targetSkillNames.filter(skill => !userSkillNames.includes(skill))
    const strengths = matchingSkills

    return {
      skillMatch,
      experienceMatch,
      readinessScore,
      gaps,
      strengths
    }
  }

  /**
   * Analyze skill gap for a specific skill
   */
  private async analyzeSkillGap(
    userProfile: any,
    targetSkill: any
  ): Promise<SkillGapRecommendation> {
    const userSkill = userProfile.profile?.skills?.find(
      (us: any) => us.skill.name.toLowerCase() === targetSkill.name.toLowerCase()
    )

    const currentLevel = userSkill?.level || 0
    const targetLevel = targetSkill.level || 5 // Assuming 1-10 scale
    const gap = Math.max(0, targetLevel - currentLevel)

    const priority = this.determineSkillPriority(targetSkill, gap)
    const timeToAcquire = this.estimateTimeToAcquire(gap, targetSkill)
    const learningResources = await this.findSkillLearningResources(targetSkill, currentLevel, targetLevel)

    return {
      skill: targetSkill.name,
      currentLevel,
      targetLevel,
      gap,
      priority,
      timeToAcquire,
      learningResources,
      careerRelevance: targetSkill.relevance || 0.8,
      marketDemand: await this.getSkillMarketDemand(targetSkill.name)
    }
  }

  /**
   * Get target role skills
   */
  private async getTargetRoleSkills(role: string, userProfile: any): Promise<any[]> {
    // Look at recent job postings for this role to extract required skills
    const jobs = await prisma.job.findMany({
      where: {
        title: { contains: role, mode: 'insensitive' }
      },
      include: {
        skills: {
          include: { skill: true }
        }
      },
      take: 10
    })

    // Aggregate and score skills by frequency
    const skillFrequency = new Map<string, { count: number; avgLevel: number }>()

    jobs.forEach(job => {
      job.skills.forEach(js => {
        const skillName = js.skill.name
        const current = skillFrequency.get(skillName) || { count: 0, avgLevel: 0 }
        skillFrequency.set(skillName, {
          count: current.count + 1,
          avgLevel: (current.avgLevel + js.level) / 2
        })
      })
    })

    // Convert to array and sort by frequency
    const targetSkills = Array.from(skillFrequency.entries())
      .map(([name, data]) => ({
        name,
        relevance: data.count / jobs.length,
        level: data.avgLevel
      }))
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 15) // Top 15 skills

    return targetSkills
  }

  /**
   * Generate career description
   */
  private async generateCareerDescription(role: string, skills: any[]): Promise<string> {
    const descriptions: Record<string, string> = {
      'Software Engineer': 'Design, develop, and maintain software applications and systems.',
      'Product Manager': 'Lead product strategy, development, and launch of new products.',
      'Data Scientist': 'Analyze complex data to help organizations make better decisions.',
      'UX Designer': 'Create user-centered designs for digital products and experiences.',
      'DevOps Engineer': 'Bridge development and operations to improve software delivery.',
      'Full Stack Developer': 'Work on both frontend and backend development of applications.',
      'Mobile Developer': 'Create applications for mobile devices and platforms.',
      'Machine Learning Engineer': 'Build and deploy machine learning models and systems.'
    }

    const baseDescription = descriptions[role] || `Professional role in ${role} field.`

    // Add skill context
    const topSkills = skills.slice(0, 3).map(s => s.name).join(', ')
    return `${baseDescription} Key skills include: ${topSkills}.`
  }

  /**
   * Helper methods
   */
  private normalizeRole(role: string): string {
    const normalizations: Record<string, string> = {
      'Software Developer': 'Junior Developer',
      'Web Developer': 'Junior Developer',
      'Frontend Developer': 'Junior Developer',
      'Backend Developer': 'Junior Developer',
      'Full Stack Engineer': 'Mid-Level Developer',
      'Senior Software Engineer': 'Senior Developer',
      'Lead Developer': 'Tech Lead',
      'Engineering Manager': 'Engineering Manager',
      'UI Designer': 'Junior Designer',
      'UX Designer': 'Junior Designer',
      'Product Owner': 'Product Manager'
    }

    return normalizations[role] || role
  }

  private normalizeJobTitle(title: string): string {
    // Remove common qualifiers and normalize
    return title
      .replace(/Senior|Lead|Principal|Junior|Mid-Level/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  private determineExperienceLevel(role: string): string {
    const levelPatterns: Record<string, string> = {
      'junior': 'entry',
      'associate': 'entry',
      'mid': 'mid',
      'senior': 'senior',
      'lead': 'senior',
      'principal': 'expert',
      'director': 'expert',
      'manager': 'senior'
    }

    const lowerRole = role.toLowerCase()
    for (const [pattern, level] of Object.entries(levelPatterns)) {
      if (lowerRole.includes(pattern)) {
        return level
      }
    }

    return 'mid' // default
  }

  private getRequiredExperience(skills: any[]): number {
    // Estimate required years of experience based on skill requirements
    const avgSkillLevel = skills.reduce((sum, skill) => sum + (skill.level || 5), 0) / skills.length
    return Math.max(1, Math.round(avgSkillLevel * 1.5)) // Rough estimate
  }

  private determineSkillPriority(skill: any, gap: number): 'high' | 'medium' | 'low' {
    if (gap > 5) return 'high'
    if (gap > 2) return 'medium'
    return 'low'
  }

  private estimateTimeToAcquire(gap: number, skill: any): string {
    if (gap <= 2) return '1-2 months'
    if (gap <= 4) return '3-6 months'
    if (gap <= 6) return '6-12 months'
    return '1+ years'
  }

  private async findLearningResources(
    targetSkills: any[],
    gaps: string[],
    request: CareerPathRequest
  ): Promise<CareerPathRecommendation['learningResources']> {
    // This would typically integrate with external learning platforms
    // For now, return mock data
    const resources: CareerPathRecommendation['learningResources'] = []

    gaps.forEach(skill => {
      resources.push({
        type: 'course',
        title: `Complete ${skill} Course`,
        provider: 'Tech Academy',
        duration: '8 weeks',
        difficulty: 'intermediate',
        relevanceScore: 0.9
      })

      resources.push({
        type: 'certification',
        title: `${skill} Professional Certification`,
        provider: 'Tech Institute',
        duration: '3 months',
        difficulty: 'advanced',
        relevanceScore: 0.8
      })
    })

    return resources.slice(0, 8) // Limit to top 8 resources
  }

  private async findSkillLearningResources(
    skill: any,
    currentLevel: number,
    targetLevel: number
  ): Promise<SkillGapRecommendation['learningResources']> {
    // Mock implementation - would integrate with real learning platforms
    return [
      {
        type: 'course',
        title: `Complete ${skill.name} Guide`,
        provider: 'Tech Platform',
        estimatedHours: 40,
        difficulty: currentLevel < 3 ? 'beginner' : currentLevel < 7 ? 'intermediate' : 'advanced',
        rating: 4.5
      },
      {
        type: 'project',
        title: `${skill.name} Practice Project`,
        provider: 'Code Practice',
        estimatedHours: 20,
        difficulty: 'intermediate',
        rating: 4.2
      }
    ]
  }

  private async getMarketInsights(role: string, request: CareerPathRequest): Promise<CareerPathRecommendation['marketInsights']> {
    // Analyze job market data for this role
    const recentJobs = await prisma.job.findMany({
      where: {
        title: { contains: role, mode: 'insensitive' },
        createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } // Last 90 days
      },
      include: { company: true },
      take: 100
    })

    const demandTrend = recentJobs.length > 50 ? 'booming' :
                      recentJobs.length > 20 ? 'growing' :
                      recentJobs.length > 10 ? 'stable' : 'declining'

    const topCompanies = recentJobs
      .reduce((acc, job) => {
        acc[job.company.name] = (acc[job.company.name] || 0) + 1
        return acc
      }, {} as Record<string, number>)

    const sortedCompanies = Object.entries(topCompanies)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name)

    return {
      demandTrend,
      competitionLevel: recentJobs.length > 30 ? 'high' : recentJobs.length > 15 ? 'medium' : 'low',
      geographicOpportunities: await this.getGeographicOpportunities(role),
      topCompanies: sortedCompanies,
      salaryGrowth: 8.5 // Mock percentage
    }
  }

  private async getGeographicOpportunities(role: string): Promise<string[]> {
    const jobs = await prisma.job.findMany({
      where: {
        title: { contains: role, mode: 'insensitive' },
        location: { not: null }
      },
      select: { location: true },
      distinct: ['location'],
      take: 10
    })

    return jobs.map(job => job.location!).filter(Boolean)
  }

  private async getSalaryRange(role: string, location?: string): Promise<{ min: number; max: number; currency: string }> {
    // Mock salary data - would typically integrate with salary APIs
    const salaryRanges: Record<string, { min: number; max: number }> = {
      'Software Engineer': { min: 80000, max: 150000 },
      'Product Manager': { min: 90000, max: 170000 },
      'Data Scientist': { min: 95000, max: 160000 },
      'UX Designer': { min: 75000, max: 130000 },
      'DevOps Engineer': { min: 90000, max: 160000 }
    }

    const baseRange = salaryRanges[role] || { min: 60000, max: 120000 }

    // Adjust for location (mock adjustment)
    if (location?.toLowerCase().includes('new york') || location?.toLowerCase().includes('san francisco')) {
      return {
        min: Math.round(baseRange.min * 1.4),
        max: Math.round(baseRange.max * 1.4),
        currency: 'USD'
      }
    }

    return { ...baseRange, currency: 'USD' }
  }

  private assessGrowthPotential(role: string, skills: any[]): 'low' | 'medium' | 'high' {
    // Assess based on skill demand and career trajectory
    const highGrowthSkills = ['AI', 'Machine Learning', 'Cloud Computing', 'Cybersecurity', 'Data Science']
    const hasHighGrowthSkills = skills.some(skill =>
      highGrowthSkills.some(hgs => skill.name.toLowerCase().includes(hgs.toLowerCase()))
    )

    if (hasHighGrowthSkills) return 'high'
    if (skills.length > 8) return 'medium'
    return 'low'
  }

  private generateNextSteps(
    assessment: CareerPathRecommendation['currentAssessment'],
    timeHorizon: string
  ): CareerPathRecommendation['nextSteps'] {
    const immediate: string[] = []
    const shortTerm: string[] = []
    const longTerm: string[] = []

    if (assessment.readinessScore < 0.3) {
      immediate.push('Focus on fundamental skill development')
      immediate.push('Complete online courses for core skills')
      shortTerm.push('Build portfolio projects')
      shortTerm.push('Seek mentorship opportunities')
      longTerm.push('Consider specialized certifications')
    } else if (assessment.readinessScore < 0.7) {
      immediate.push('Address skill gaps identified')
      immediate.push('Update resume and LinkedIn profile')
      shortTerm.push('Apply for entry-level positions')
      shortTerm.push('Network with industry professionals')
      longTerm.push('Pursue advanced specializations')
    } else {
      immediate.push('Start applying for target roles')
      immediate.push('Prepare for technical interviews')
      shortTerm.push('Negotiate compensation packages')
      shortTerm.push('Build professional network')
      longTerm.push('Develop leadership skills')
    }

    return { immediate, shortTerm, longTerm }
  }

  private createTimeline(
    assessment: CareerPathRecommendation['currentAssessment'],
    timeHorizon: string
  ): CareerPathRecommendation['timeline'] {
    const months = this.getTimeHorizonMonths(timeHorizon)
    const estimatedMonths = Math.round(months * (1.2 - assessment.readinessScore)) // Adjust based on readiness

    const milestones = [
      {
        title: 'Skill Development',
        description: 'Complete core skill training',
        estimatedMonths: Math.round(estimatedMonths * 0.4),
        requiredActions: ['Online courses', 'Practice projects', 'Skill assessment']
      },
      {
        title: 'Portfolio Building',
        description: 'Create professional portfolio',
        estimatedMonths: Math.round(estimatedMonths * 0.3),
        requiredActions: ['Build projects', 'Create GitHub profile', 'Write case studies']
      },
      {
        title: 'Job Search',
        description: 'Begin active job search',
        estimatedMonths: Math.round(estimatedMonths * 0.3),
        requiredActions: ['Resume optimization', 'Networking', 'Interview preparation']
      }
    ]

    return {
      estimatedMonths,
      milestones
    }
  }

  private getTimeHorizonMonths(timeHorizon: string): number {
    const horizons: Record<string, number> = {
      'immediate': 3,
      '6months': 6,
      '1year': 12,
      '2years': 24,
      '5years': 60
    }

    return horizons[timeHorizon] || 12
  }

  private calculateOverallScore(
    recommendation: CareerPathRecommendation,
    userProfile: any,
    request: CareerPathRequest
  ): number {
    const readinessScore = recommendation.currentAssessment.readinessScore
    const growthScore = recommendation.careerPath.growthPotential === 'high' ? 1 :
                       recommendation.careerPath.growthPotential === 'medium' ? 0.7 : 0.4
    const marketScore = recommendation.marketInsights.demandTrend === 'booming' ? 1 :
                       recommendation.marketInsights.demandTrend === 'growing' ? 0.8 :
                       recommendation.marketInsights.demandTrend === 'stable' ? 0.6 : 0.3

    return (readinessScore * 0.4) + (growthScore * 0.3) + (marketScore * 0.3)
  }

  private calculateReadinessPercentage(userProfile: any, targetSkills: any[]): number {
    const userSkills = userProfile.profile?.skills || []
    const userSkillNames = userSkills.map((us: any) => us.skill.name.toLowerCase())
    const targetSkillNames = targetSkills.map(ts => ts.name.toLowerCase())

    const matchingSkills = targetSkillNames.filter(skill => userSkillNames.includes(skill))
    return targetSkillNames.length > 0 ? Math.round((matchingSkills.length / targetSkillNames.length) * 100) : 0
  }

  private async generateActionPlan(userProfile: any, targetRole: string): Promise<string[]> {
    const targetSkills = await this.getTargetRoleSkills(targetRole, userProfile)
    const assessment = await this.assessCurrentReadiness(userProfile, targetSkills)

    const actionPlan: string[] = []

    if (assessment.gaps.length > 0) {
      actionPlan.push(`Learn missing skills: ${assessment.gaps.slice(0, 3).join(', ')}`)
    }

    if (assessment.experienceMatch < 0.8) {
      actionPlan.push('Gain relevant experience through projects or freelance work')
    }

    actionPlan.push('Update professional profiles with target role keywords')
    actionPlan.push('Network with professionals in target role')
    actionPlan.push('Prepare technical interview questions')

    return actionPlan
  }

  private async getSkillMarketDemand(skillName: string): Promise<number> {
    // Count recent job postings requiring this skill
    const recentJobs = await prisma.job.findMany({
      where: {
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        skills: {
          some: {
            skill: { name: { contains: skillName, mode: 'insensitive' } }
          }
        }
      },
      take: 100
    })

    // Normalize to 0-1 scale
    return Math.min(recentJobs.length / 50, 1)
  }
}