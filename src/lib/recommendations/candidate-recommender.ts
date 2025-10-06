import { RecommendationEngine } from '@/services/matching/recommendation-engine'
import { CollaborativeFilteringService } from '@/services/matching/collaborative-filter'
import { EmbeddingService } from '@/services/matching/embedding-service'
import { MatchingCoreService } from '@/services/matching/matching-core'
import { MatchingScoreService } from '@/services/matching/matching-score'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export interface CandidateRecommendation {
  candidateId: string
  jobId: string
  score: number
  confidence: number
  explanation: string[]
  matchingFactors: {
    skills: number
    experience: number
    education: number
    location: number
    salary: number
    culturalFit: number
    growthPotential: number
  }
  recommendations: {
    shouldInterview: boolean
    interviewPriority: 'high' | 'medium' | 'low'
    suggestedNextSteps: string[]
    potentialConcerns: string[]
  }
}

export interface CandidateRecommendationRequest {
  jobId: string
  employerId: string
  limit?: number
  filters?: {
    experience?: {
      min?: number
      max?: number
    }
    location?: {
      radius?: number
      remoteOnly?: boolean
    }
    salary?: {
      min?: number
      max?: number
    }
    skills?: string[]
    education?: {
      level?: string
      field?: string
    }
  }
  strategy?: 'skills-first' | 'experience-first' | 'potential-first' | 'balanced'
}

export class CandidateRecommender {
  private recommendationEngine: RecommendationEngine
  private collaborativeFilter: CollaborativeFilteringService
  private embeddingService: EmbeddingService
  private matchingCore: MatchingCoreService
  private scoreService: MatchingScoreService

  constructor() {
    this.recommendationEngine = new RecommendationEngine()
    this.collaborativeFilter = new CollaborativeFilteringService()
    this.embeddingService = new EmbeddingService()
    this.matchingCore = new MatchingCoreService()
    this.scoreService = new MatchingScoreService()
  }

  /**
   * Get candidate recommendations for a job
   */
  async getCandidateRecommendations(
    request: CandidateRecommendationRequest
  ): Promise<CandidateRecommendation[]> {
    try {
      const {
        jobId,
        employerId,
        limit = 20,
        filters = {},
        strategy = 'balanced'
      } = request

      logger.info('Generating candidate recommendations', {
        jobId,
        employerId,
        limit,
        strategy,
        hasFilters: Object.keys(filters).length > 0
      })

      // Get job details
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: {
          company: true,
          skills: true,
          requirements: true
        }
      })

      if (!job) {
        throw new Error('Job not found')
      }

      // Get initial candidate pool using multiple strategies
      const candidatePool = await this.getCandidatePool(job, filters, strategy)

      // Score and rank candidates
      const scoredCandidates = await this.scoreAndRankCandidates(
        candidatePool,
        job,
        employerId,
        strategy
      )

      // Apply business rules and filters
      const filteredCandidates = await this.applyBusinessRules(scoredCandidates, job, employerId)

      // Generate recommendations and next steps
      const recommendations = await this.generateRecommendations(
        filteredCandidates.slice(0, limit),
        job,
        employerId
      )

      // Track recommendations for learning
      await this.trackRecommendations(jobId, employerId, recommendations)

      logger.info('Generated candidate recommendations', {
        jobId,
        count: recommendations.length,
        avgScore: recommendations.reduce((sum, r) => sum + r.score, 0) / recommendations.length
      })

      return recommendations
    } catch (error) {
      logger.error('Error generating candidate recommendations', {
        error,
        jobId: request.jobId,
        employerId: request.employerId
      })
      throw error
    }
  }

  /**
   * Get candidate pool using multiple strategies
   */
  private async getCandidatePool(
    job: any,
    filters: CandidateRecommendationRequest['filters'],
    strategy: string
  ): Promise<any[]> {
    const candidateIds = new Set<string>()

    // Strategy 1: Skills-based matching
    const skillsBased = await this.getSkillsBasedCandidates(job, filters)
    skillsBased.forEach(candidate => candidateIds.add(candidate.id))

    // Strategy 2: Experience matching
    const experienceBased = await this.getExperienceBasedCandidates(job, filters)
    experienceBased.forEach(candidate => candidateIds.add(candidate.id))

    // Strategy 3: Location matching
    const locationBased = await this.getLocationBasedCandidates(job, filters)
    locationBased.forEach(candidate => candidateIds.add(candidate.id))

    // Strategy 4: Collaborative filtering
    const collaborativeBased = await this.getCollaborativeBasedCandidates(job, strategy)
    collaborativeBased.forEach(candidate => candidateIds.add(candidate.id))

    // Strategy 5: Similar job preferences
    const similarJobBased = await this.getSimilarJobBasedCandidates(job, filters)
    similarJobBased.forEach(candidate => candidateIds.add(candidate.id))

    // Get full candidate details
    const candidates = await prisma.user.findMany({
      where: {
        id: { in: Array.from(candidateIds) },
        role: 'seeker',
        isActive: true,
        profile: {
          isPublic: true
        }
      },
      include: {
        profile: {
          include: {
            skills: true,
            education: true,
            experience: true,
            preferences: true
          }
        },
        applications: {
          where: {
            jobId: job.id
          }
        }
      }
    })

    return candidates
  }

  /**
   * Get skills-based candidates
   */
  private async getSkillsBasedCandidates(job: any, filters: CandidateRecommendationRequest['filters']): Promise<any[]> {
    const jobSkills = job.skills.map((s: any) => s.name.toLowerCase())
    const requiredSkills = filters?.skills || jobSkills

    const candidates = await prisma.user.findMany({
      where: {
        role: 'seeker',
        isActive: true,
        profile: {
          isPublic: true,
          skills: {
            some: {
              name: { in: requiredSkills }
            }
          }
        }
      },
      include: {
        profile: {
          include: {
            skills: true
          }
        }
      }
    })

    // Calculate skill match percentage
    return candidates
      .map(candidate => {
        const candidateSkills = candidate.profile.skills.map((s: any) => s.name.toLowerCase())
        const matchingSkills = candidateSkills.filter(skill => jobSkills.includes(skill))
        const matchPercentage = matchingSkills.length / Math.max(jobSkills.length, candidateSkills.length)

        return {
          ...candidate,
          skillMatch: matchPercentage,
          matchingSkills
        }
      })
      .filter(candidate => candidate.skillMatch >= 0.3) // Minimum 30% skill match
  }

  /**
   * Get experience-based candidates
   */
  private async getExperienceBasedCandidates(job: any, filters: CandidateRecommendationRequest['filters']): Promise<any[]> {
    const whereClause: any = {
      role: 'seeker',
      isActive: true,
      profile: {
        isPublic: true
      }
    }

    if (filters?.experience) {
      whereClause.profile = {
        ...whereClause.profile,
        totalExperience: {
          gte: filters.experience.min || 0,
          lte: filters.experience.max || 50
        }
      }
    }

    const candidates = await prisma.user.findMany({
      where: whereClause,
      include: {
        profile: true
      }
    })

    return candidates.filter(candidate => {
      const experience = candidate.profile.totalExperience || 0
      const jobLevel = this.extractExperienceLevel(job.description)

      return this.isExperienceMatch(experience, jobLevel)
    })
  }

  /**
   * Get location-based candidates
   */
  private async getLocationBasedCandidates(job: any, filters: CandidateRecommendationRequest['filters']): Promise<any[]> {
    const whereClause: any = {
      role: 'seeker',
      isActive: true,
      profile: {
        isPublic: true
      }
    }

    if (filters?.location?.remoteOnly && job.isRemote) {
      // Candidates open to remote work
      whereClause.profile.preferences = {
        isRemote: true
      }
    } else if (job.location) {
      // Location-based matching
      const radius = filters?.location?.radius || 50 // 50 miles default
      whereClause.profile = {
        ...whereClause.profile,
        location: {
          near: {
            latitude: job.latitude,
            longitude: job.longitude,
            radius: radius * 1609.34 // Convert miles to meters
          }
        }
      }
    }

    return prisma.user.findMany({
      where: whereClause,
      include: {
        profile: true
      }
    })
  }

  /**
   * Get collaborative filtering based candidates
   */
  private async getCollaborativeBasedCandidates(job: any, strategy: string): Promise<any[]> {
    try {
      // Find similar jobs based on collaborative filtering
      const similarJobs = await this.collaborativeFilter.getSimilarJobs(job.id, 10)

      // Get candidates who applied to or were recommended for similar jobs
      const candidateActions = await prisma.application.findMany({
        where: {
          jobId: { in: similarJobs.map(j => j.jobId) },
          status: { in: ['applied', 'shortlisted', 'interview'] }
        },
        select: {
          candidateId: true,
          status: true
        }
      })

      const candidateScores = new Map<string, number>()
      candidateActions.forEach(action => {
        const currentScore = candidateScores.get(action.candidateId) || 0
        const weight = action.status === 'shortlisted' ? 3 : action.status === 'interview' ? 5 : 1
        candidateScores.set(action.candidateId, currentScore + weight)
      })

      // Get top candidates
      const topCandidateIds = Array.from(candidateScores.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 50)
        .map(([id]) => id)

      return prisma.user.findMany({
        where: {
          id: { in: topCandidateIds },
          role: 'seeker',
          isActive: true,
          profile: {
            isPublic: true
          }
        }
      })
    } catch (error) {
      logger.error('Error in collaborative filtering', { error })
      return []
    }
  }

  /**
   * Get candidates based on similar job preferences
   */
  private async getSimilarJobBasedCandidates(job: any, filters: CandidateRecommendationRequest['filters']): Promise<any[]> {
    try {
      // Get job embedding
      const jobEmbedding = await this.embeddingService.getJobEmbedding(job.id)

      // Find similar jobs
      const similarJobs = await this.embeddingService.findSimilarJobs(jobEmbedding, 20)

      // Get candidates who viewed or applied to similar jobs
      const candidateInteractions = await prisma.jobView.findMany({
        where: {
          jobId: { in: similarJobs.map(j => j.id) }
        },
        select: {
          userId: true
        }
      })

      const candidateIds = [...new Set(candidateInteractions.map(i => i.userId))]

      return prisma.user.findMany({
        where: {
          id: { in: candidateIds },
          role: 'seeker',
          isActive: true,
          profile: {
            isPublic: true
          }
        }
      })
    } catch (error) {
      logger.error('Error in similar job based recommendations', { error })
      return []
    }
  }

  /**
   * Score and rank candidates
   */
  private async scoreAndRankCandidates(
    candidates: any[],
    job: any,
    employerId: string,
    strategy: string
  ): Promise<any[]> {
    const scoredCandidates = await Promise.all(
      candidates.map(async (candidate) => {
        const scoreRequest = {
          candidateId: candidate.id,
          jobId: job.id,
          weights: this.getStrategyWeights(strategy)
        }

        const matchingScore = await this.scoreService.calculateMatchingScore(scoreRequest)

        // Apply strategy-specific adjustments
        const adjustedScore = this.applyStrategyAdjustments(matchingScore, candidate, job, strategy)

        return {
          ...candidate,
          score: adjustedScore.finalScore,
          confidence: adjustedScore.confidence,
          matchingFactors: adjustedScore.factors,
          explanation: adjustedScore.explanation
        }
      })
    )

    // Sort by score and confidence
    return scoredCandidates.sort((a, b) => {
      const scoreDiff = b.score - a.score
      if (Math.abs(scoreDiff) > 0.1) return scoreDiff
      return b.confidence - a.confidence
    })
  }

  /**
   * Apply business rules
   */
  private async applyBusinessRules(
    candidates: any[],
    job: any,
    employerId: string
  ): Promise<any[]> {
    // Remove candidates who already applied
    const appliedCandidates = new Set(
      (await prisma.application.findMany({
        where: { jobId: job.id },
        select: { candidateId: true }
      })).map(a => a.candidateId)
    )

    // Remove candidates previously rejected by this employer
    const rejectedCandidates = new Set(
      (await prisma.application.findMany({
        where: {
          jobId: job.id,
          employerId: employerId,
          status: 'rejected'
        },
        select: { candidateId: true }
      })).map(a => a.candidateId)
    )

    // Check employer preferences
    const employer = await prisma.employer.findUnique({
      where: { userId: employerId },
      include: { preferences: true }
    })

    return candidates.filter(candidate => {
      // Basic business rules
      if (appliedCandidates.has(candidate.id)) return false
      if (rejectedCandidates.has(candidate.id)) return false

      // Employer preferences
      if (employer?.preferences) {
        const prefs = employer.preferences

        // Experience range check
        if (candidate.profile.totalExperience < prefs.minExperience ||
            candidate.profile.totalExperience > prefs.maxExperience) {
          return false
        }

        // Education level check
        if (prefs.minEducationLevel &&
            !this.meetsEducationRequirement(candidate.profile.education, prefs.minEducationLevel)) {
          return false
        }

        // Skills requirement check
        if (prefs.requiredSkills?.length > 0) {
          const candidateSkills = candidate.profile.skills.map((s: any) => s.name)
          const hasRequiredSkills = prefs.requiredSkills.every(skill =>
            candidateSkills.includes(skill)
          )
          if (!hasRequiredSkills) return false
        }
      }

      return true
    })
  }

  /**
   * Generate recommendations with next steps
   */
  private async generateRecommendations(
    candidates: any[],
    job: any,
    employerId: string
  ): Promise<CandidateRecommendation[]> {
    return await Promise.all(
      candidates.map(async (candidate) => {
        const interviewPriority = this.determineInterviewPriority(candidate.score, candidate.confidence)
        const shouldInterview = interviewPriority !== 'low'

        const recommendations = {
          shouldInterview,
          interviewPriority,
          suggestedNextSteps: this.generateNextSteps(candidate, job, interviewPriority),
          potentialConcerns: this.identifyConcerns(candidate, job)
        }

        return {
          candidateId: candidate.id,
          jobId: job.id,
          score: candidate.score,
          confidence: candidate.confidence,
          explanation: candidate.explanation,
          matchingFactors: candidate.matchingFactors,
          recommendations
        }
      })
    )
  }

  /**
   * Track recommendations for learning
   */
  private async trackRecommendations(
    jobId: string,
    employerId: string,
    recommendations: CandidateRecommendation[]
  ): Promise<void> {
    await prisma.recommendation.createMany({
      data: recommendations.map(rec => ({
        type: 'candidate_to_job',
        userId: employerId,
        targetId: rec.candidateId,
        contextId: jobId,
        score: rec.score,
        confidence: rec.confidence,
        factors: rec.matchingFactors,
        metadata: {
          explanation: rec.explanation,
          recommendations: rec.recommendations
        }
      }))
    })
  }

  /**
   * Get strategy-specific weights
   */
  private getStrategyWeights(strategy: string): any {
    const baseWeights = {
      skills: 0.3,
      experience: 0.2,
      education: 0.15,
      location: 0.15,
      salary: 0.1,
      culturalFit: 0.05,
      growthPotential: 0.05
    }

    switch (strategy) {
      case 'skills-first':
        return { ...baseWeights, skills: 0.5, experience: 0.15, education: 0.1 }
      case 'experience-first':
        return { ...baseWeights, experience: 0.4, skills: 0.25, culturalFit: 0.1 }
      case 'potential-first':
        return { ...baseWeights, growthPotential: 0.3, skills: 0.2, culturalFit: 0.2 }
      default:
        return baseWeights
    }
  }

  /**
   * Apply strategy-specific adjustments
   */
  private applyStrategyAdjustments(
    matchingScore: any,
    candidate: any,
    job: any,
    strategy: string
  ): any {
    let adjustedScore = { ...matchingScore }

    switch (strategy) {
      case 'skills-first':
        // Boost candidates with high skill match
        if (matchingScore.factors.skills > 0.8) {
          adjustedScore.finalScore *= 1.1
        }
        break
      case 'experience-first':
        // Boost candidates with relevant experience
        if (matchingScore.factors.experience > 0.8) {
          adjustedScore.finalScore *= 1.1
        }
        break
      case 'potential-first':
        // Boost candidates with high growth potential
        if (matchingScore.factors.growthPotential > 0.8) {
          adjustedScore.finalScore *= 1.15
        }
        break
    }

    return adjustedScore
  }

  /**
   * Extract experience level from job description
   */
  private extractExperienceLevel(description: string): string {
    const lowerDesc = description.toLowerCase()

    if (lowerDesc.includes('entry') || lowerDesc.includes('junior')) return 'entry'
    if (lowerDesc.includes('mid') || lowerDesc.includes('intermediate')) return 'mid'
    if (lowerDesc.includes('senior') || lowerDesc.includes('lead')) return 'senior'
    if (lowerDesc.includes('principal') || lowerDesc.includes('architect')) return 'expert'

    return 'mid' // default
  }

  /**
   * Check if experience matches job level
   */
  private isExperienceMatch(experience: number, jobLevel: string): boolean {
    switch (jobLevel) {
      case 'entry': return experience >= 0 && experience <= 2
      case 'mid': return experience >= 2 && experience <= 5
      case 'senior': return experience >= 5 && experience <= 10
      case 'expert': return experience >= 10
      default: return true
    }
  }

  /**
   * Check if education meets requirements
   */
  private meetsEducationRequirement(education: any[], requiredLevel: string): boolean {
    const levels = ['high_school', 'bachelor', 'master', 'phd']
    const requiredIndex = levels.indexOf(requiredLevel)

    return education.some(edu => {
      const eduIndex = levels.indexOf(edu.level.toLowerCase())
      return eduIndex >= requiredIndex
    })
  }

  /**
   * Determine interview priority
   */
  private determineInterviewPriority(score: number, confidence: number): 'high' | 'medium' | 'low' {
    if (score >= 0.8 && confidence >= 0.7) return 'high'
    if (score >= 0.6 && confidence >= 0.5) return 'medium'
    return 'low'
  }

  /**
   * Generate next steps
   */
  private generateNextSteps(candidate: any, job: any, priority: string): string[] {
    const steps: string[] = []

    if (priority === 'high') {
      steps.push('Schedule interview within 48 hours')
      steps.push('Prepare technical assessment')
      steps.push('Contact references')
    } else if (priority === 'medium') {
      steps.push('Review resume and portfolio')
      steps.push('Conduct phone screening')
      steps.push('Assess cultural fit')
    } else {
      steps.push('Keep in talent pool')
      steps.push('Monitor for skill development')
      steps.push('Consider for future openings')
    }

    return steps
  }

  /**
   * Identify potential concerns
   */
  private identifyConcerns(candidate: any, job: any): string[] {
    const concerns: string[] = []

    if (candidate.matchingFactors?.skills < 0.5) {
      concerns.push('Skills gap in key areas')
    }

    if (candidate.matchingFactors?.experience < 0.5) {
      concerns.push('Limited relevant experience')
    }

    if (candidate.matchingFactors?.location < 0.3) {
      concerns.push('Location or remote work preferences may not align')
    }

    if (candidate.matchingFactors?.salary < 0.4) {
      concerns.push('Salary expectations may exceed budget')
    }

    return concerns
  }
}