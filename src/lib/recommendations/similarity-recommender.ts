import { EmbeddingService } from '@/services/matching/embedding-service'
import { SimilaritySearch } from '@/lib/vector/similarity-search'
import { VectorStore } from '@/lib/vector/vector-store'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export interface SimilarityRecommendation {
  id: string
  type: 'job' | 'candidate'
  similarity: number
  similarityBreakdown: {
    skills: number
    experience: number
    education: number
    interests: number
    industry: number
    companyCulture: number
  }
  explanation: string[]
  reasons: string[]
  matchDetails: {
    commonSkills: string[]
    experienceAlignment: string
    educationCompatibility: string
    locationMatch?: string
    salaryMatch?: string
  }
}

export interface SimilarityRequest {
  id: string
  type: 'job' | 'candidate'
  limit?: number
  filters?: {
    similarityThreshold?: number
    excludeApplied?: boolean
    excludeViewed?: boolean
    timeRange?: {
      start: Date
      end: Date
    }
    industries?: string[]
    locations?: string[]
    experienceLevel?: string[]
  }
  context?: {
    userId?: string
    sessionId?: string
    searchQuery?: string
  }
}

export class SimilarityRecommender {
  private embeddingService: EmbeddingService
  private similaritySearch: SimilaritySearch
  private vectorStore: VectorStore

  constructor() {
    this.embeddingService = new EmbeddingService()
    this.similaritySearch = new SimilaritySearch()
    this.vectorStore = new VectorStore()
  }

  /**
   * Get similar items based on embeddings and metadata
   */
  async getSimilarItems(request: SimilarityRequest): Promise<SimilarityRecommendation[]> {
    try {
      const { id, type, limit = 10, filters = {}, context = {} } = request

      logger.info('Generating similarity recommendations', {
        id,
        type,
        limit,
        hasFilters: Object.keys(filters).length > 0,
        hasContext: Object.keys(context).length > 0
      })

      // Get source item and its embedding
      const sourceItem = await this.getSourceItem(id, type)
      const sourceEmbedding = await this.embeddingService.getItemEmbedding(id, type)

      if (!sourceEmbedding) {
        throw new Error(`No embedding found for ${type} ${id}`)
      }

      // Find similar items using vector search
      const similarItems = await this.similaritySearch.findSimilar(
        sourceEmbedding,
        type === 'job' ? 'jobs' : 'candidates',
        limit * 2, // Get more to filter down
        {
          threshold: filters.similarityThreshold || 0.3,
          excludeIds: [id],
          filters: this.buildSearchFilters(filters, type)
        }
      )

      // Get detailed item information
      const detailedItems = await this.getDetailedItems(similarItems, type, context)

      // Calculate similarity breakdowns and explanations
      const recommendations = await this.enrichWithSimilarityDetails(
        detailedItems,
        sourceItem,
        sourceEmbedding,
        type
      )

      // Apply additional filters and business rules
      const filteredRecommendations = this.applyAdditionalFilters(
        recommendations,
        filters,
        context
      )

      // Sort by similarity score and relevance
      const sortedRecommendations = filteredRecommendations
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)

      logger.info('Generated similarity recommendations', {
        id,
        type,
        count: sortedRecommendations.length,
        avgSimilarity: sortedRecommendations.reduce((sum, r) => sum + r.similarity, 0) / sortedRecommendations.length
      })

      return sortedRecommendations
    } catch (error) {
      logger.error('Error generating similarity recommendations', {
        error,
        id: request.id,
        type: request.type
      })
      throw error
    }
  }

  /**
   * Get similar jobs for a candidate
   */
  async getSimilarJobsForCandidate(
    candidateId: string,
    options: {
      limit?: number
      excludeApplied?: boolean
      experienceMatch?: boolean
      locationMatch?: boolean
      salaryMatch?: boolean
    } = {}
  ): Promise<SimilarityRecommendation[]> {
    const request: SimilarityRequest = {
      id: candidateId,
      type: 'candidate',
      limit: options.limit || 10,
      filters: {
        excludeApplied: options.excludeApplied,
        similarityThreshold: 0.2
      }
    }

    return this.getSimilarItems(request)
  }

  /**
   * Get similar candidates for a job
   */
  async getSimilarCandidatesForJob(
    jobId: string,
    options: {
      limit?: number
      experienceLevel?: string
      locationRadius?: number
      skillMatch?: number
    } = {}
  ): Promise<SimilarityRecommendation[]> {
    const request: SimilarityRequest = {
      id: jobId,
      type: 'job',
      limit: options.limit || 10,
      filters: {
        similarityThreshold: 0.3
      }
    }

    return this.getSimilarItems(request)
  }

  /**
   * Get similar candidates to another candidate
   */
  async getSimilarCandidates(
    candidateId: string,
    limit: number = 10
  ): Promise<SimilarityRecommendation[]> {
    try {
      const sourceCandidate = await this.getCandidateDetails(candidateId)
      const sourceEmbedding = await this.embeddingService.getCandidateEmbedding(candidateId)

      const similarCandidates = await this.similaritySearch.findSimilar(
        sourceEmbedding,
        'candidates',
        limit * 2,
        { excludeIds: [candidateId], threshold: 0.3 }
      )

      const detailedCandidates = await Promise.all(
        similarCandidates.map(async (similar) => {
          const candidate = await this.getCandidateDetails(similar.id)
          return {
            ...candidate,
            similarity: similar.score,
            metadata: similar.metadata
          }
        })
      )

      const recommendations = await this.enrichCandidateSimilarity(
        detailedCandidates,
        sourceCandidate
      )

      return recommendations.slice(0, limit)
    } catch (error) {
      logger.error('Error getting similar candidates', { error, candidateId })
      throw error
    }
  }

  /**
   * Get similar jobs to another job
   */
  async getSimilarJobs(
    jobId: string,
    limit: number = 10
  ): Promise<SimilarityRecommendation[]> {
    try {
      const sourceJob = await this.getJobDetails(jobId)
      const sourceEmbedding = await this.embeddingService.getJobEmbedding(jobId)

      const similarJobs = await this.similaritySearch.findSimilar(
        sourceEmbedding,
        'jobs',
        limit * 2,
        { excludeIds: [jobId], threshold: 0.3 }
      )

      const detailedJobs = await Promise.all(
        similarJobs.map(async (similar) => {
          const job = await this.getJobDetails(similar.id)
          return {
            ...job,
            similarity: similar.score,
            metadata: similar.metadata
          }
        })
      )

      const recommendations = await this.enrichJobSimilarity(
        detailedJobs,
        sourceJob
      )

      return recommendations.slice(0, limit)
    } catch (error) {
      logger.error('Error getting similar jobs', { error, jobId })
      throw error
    }
  }

  /**
   * Get source item details
   */
  private async getSourceItem(id: string, type: string): Promise<any> {
    if (type === 'job') {
      return this.getJobDetails(id)
    } else {
      return this.getCandidateDetails(id)
    }
  }

  /**
   * Get job details
   */
  private async getJobDetails(jobId: string): Promise<any> {
    return prisma.job.findUnique({
      where: { id: jobId },
      include: {
        company: true,
        skills: true,
        requirements: true,
        benefits: true
      }
    })
  }

  /**
   * Get candidate details
   */
  private async getCandidateDetails(candidateId: string): Promise<any> {
    return prisma.user.findUnique({
      where: { id: candidateId },
      include: {
        profile: {
          include: {
            skills: true,
            education: true,
            experience: true,
            preferences: true
          }
        }
      }
    })
  }

  /**
   * Get detailed items with additional context
   */
  private async getDetailedItems(
    similarItems: any[],
    type: string,
    context: SimilarityRequest['context']
  ): Promise<any[]> {
    const itemIds = similarItems.map(item => item.id)

    if (type === 'job') {
      return prisma.job.findMany({
        where: { id: { in: itemIds } },
        include: {
          company: true,
          skills: true,
          requirements: true,
          applications: context.userId ? {
            where: { candidateId: context.userId }
          } : false,
          views: context.userId ? {
            where: { userId: context.userId }
          } : false
        }
      })
    } else {
      return prisma.user.findMany({
        where: {
          id: { in: itemIds },
          role: 'seeker'
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
          applications: context.userId ? {
            where: { jobId: context.userId }
          } : false
        }
      })
    }
  }

  /**
   * Enrich items with similarity details
   */
  private async enrichWithSimilarityDetails(
    items: any[],
    sourceItem: any,
    sourceEmbedding: number[],
    type: string
  ): Promise<SimilarityRecommendation[]> {
    return await Promise.all(
      items.map(async (item) => {
        const similarityBreakdown = await this.calculateSimilarityBreakdown(
          sourceItem,
          item,
          type
        )

        const explanation = await this.generateSimilarityExplanation(
          sourceItem,
          item,
          similarityBreakdown,
          type
        )

        const matchDetails = this.generateMatchDetails(
          sourceItem,
          item,
          similarityBreakdown,
          type
        )

        return {
          id: item.id,
          type,
          similarity: this.calculateOverallSimilarity(similarityBreakdown),
          similarityBreakdown,
          explanation,
          reasons: this.generateSimilarityReasons(similarityBreakdown, type),
          matchDetails
        }
      })
    )
  }

  /**
   * Calculate similarity breakdown by category
   */
  private async calculateSimilarityBreakdown(
    source: any,
    target: any,
    type: string
  ): Promise<SimilarityRecommendation['similarityBreakdown']> {
    const breakdown = {
      skills: await this.calculateSkillsSimilarity(source, target, type),
      experience: this.calculateExperienceSimilarity(source, target, type),
      education: this.calculateEducationSimilarity(source, target, type),
      interests: this.calculateInterestsSimilarity(source, target, type),
      industry: this.calculateIndustrySimilarity(source, target, type),
      companyCulture: this.calculateCultureSimilarity(source, target, type)
    }

    return breakdown
  }

  /**
   * Calculate skills similarity
   */
  private async calculateSkillsSimilarity(
    source: any,
    target: any,
    type: string
  ): Promise<number> {
    const sourceSkills = type === 'job'
      ? source.skills?.map((s: any) => s.name.toLowerCase()) || []
      : source.profile?.skills?.map((s: any) => s.name.toLowerCase()) || []

    const targetSkills = type === 'job'
      ? target.skills?.map((s: any) => s.name.toLowerCase()) || []
      : target.profile?.skills?.map((s: any) => s.name.toLowerCase()) || []

    if (sourceSkills.length === 0 || targetSkills.length === 0) {
      return 0
    }

    const intersection = sourceSkills.filter(skill => targetSkills.includes(skill))
    const union = [...new Set([...sourceSkills, ...targetSkills])]

    return intersection.length / union.length // Jaccard similarity
  }

  /**
   * Calculate experience similarity
   */
  private calculateExperienceSimilarity(
    source: any,
    target: any,
    type: string
  ): Promise<number> {
    if (type === 'job') {
      // Job to candidate experience matching
      const jobLevel = this.extractJobLevel(source)
      const candidateExp = target.profile?.totalExperience || 0
      const expectedExp = this.getExpectedExperience(jobLevel)

      const diff = Math.abs(candidateExp - expectedExp)
      const maxDiff = Math.max(expectedExp, candidateExp)

      return maxDiff > 0 ? Math.max(0, 1 - (diff / maxDiff)) : 1
    } else {
      // Candidate to candidate experience similarity
      const exp1 = source.profile?.totalExperience || 0
      const exp2 = target.profile?.totalExperience || 0
      const maxExp = Math.max(exp1, exp2)

      return maxExp > 0 ? 1 - (Math.abs(exp1 - exp2) / maxExp) : 1
    }
  }

  /**
   * Calculate education similarity
   */
  private calculateEducationSimilarity(
    source: any,
    target: any,
    type: string
  ): number {
    const levels = ['high_school', 'associate', 'bachelor', 'master', 'phd']

    const getHighestLevel = (education: any[]) => {
      if (!education || education.length === 0) return 0
      return Math.max(...education.map(edu => levels.indexOf(edu.level.toLowerCase())))
    }

    const sourceLevel = type === 'job'
      ? this.getRequiredEducationLevel(source)
      : getHighestLevel(source.profile?.education || [])

    const targetLevel = type === 'job'
      ? this.getRequiredEducationLevel(target)
      : getHighestLevel(target.profile?.education || [])

    if (sourceLevel === 0 || targetLevel === 0) return 0.5

    return 1 - Math.abs(sourceLevel - targetLevel) / levels.length
  }

  /**
   * Calculate interests similarity
   */
  private calculateInterestsSimilarity(
    source: any,
    target: any,
    type: string
  ): number {
    if (type !== 'candidate') return 0

    const sourceInterests = source.profile?.interests || []
    const targetInterests = target.profile?.interests || []

    if (sourceInterests.length === 0 || targetInterests.length === 0) {
      return 0
    }

    const intersection = sourceInterests.filter((interest: string) =>
      targetInterests.includes(interest)
    )

    return intersection.length / Math.max(sourceInterests.length, targetInterests.length)
  }

  /**
   * Calculate industry similarity
   */
  private calculateIndustrySimilarity(
    source: any,
    target: any,
    type: string
  ): number {
    const sourceIndustry = type === 'job'
      ? source.company?.industry
      : source.profile?.preferredIndustries?.[0]

    const targetIndustry = type === 'job'
      ? target.company?.industry
      : target.profile?.preferredIndustries?.[0]

    if (!sourceIndustry || !targetIndustry) return 0

    return sourceIndustry === targetIndustry ? 1 : 0.3
  }

  /**
   * Calculate company culture similarity
   */
  private calculateCultureSimilarity(
    source: any,
    target: any,
    type: string
  ): number {
    if (type === 'candidate') {
      // Compare work preferences
      const sourcePrefs = source.profile?.preferences || {}
      const targetPrefs = target.profile?.preferences || {}

      let matches = 0
      let total = 0

      if (sourcePrefs.remoteWork !== undefined && targetPrefs.remoteWork !== undefined) {
        total++
        if (sourcePrefs.remoteWork === targetPrefs.remoteWork) matches++
      }

      if (sourcePrefs.workEnvironment && targetPrefs.workEnvironment) {
        total++
        if (sourcePrefs.workEnvironment === targetPrefs.workEnvironment) matches++
      }

      return total > 0 ? matches / total : 0
    } else {
      // Job culture similarity based on benefits and description
      const sourceBenefits = source.benefits?.map((b: any) => b.type) || []
      const targetBenefits = target.benefits?.map((b: any) => b.type) || []

      if (sourceBenefits.length === 0 || targetBenefits.length === 0) return 0

      const intersection = sourceBenefits.filter(benefit => targetBenefits.includes(benefit))
      return intersection.length / Math.max(sourceBenefits.length, targetBenefits.length)
    }
  }

  /**
   * Generate similarity explanation
   */
  private async generateSimilarityExplanation(
    source: any,
    target: any,
    breakdown: SimilarityRecommendation['similarityBreakdown'],
    type: string
  ): Promise<string[]> {
    const explanations: string[] = []

    if (breakdown.skills > 0.6) {
      explanations.push(`Strong skill overlap (${Math.round(breakdown.skills * 100)}% match)`)
    }

    if (breakdown.experience > 0.7) {
      explanations.push(`Experience level aligns well`)
    }

    if (breakdown.education > 0.7) {
      explanations.push(`Education requirements match`)
    }

    if (breakdown.industry > 0.8) {
      explanations.push(`Same industry focus`)
    }

    if (breakdown.companyCulture > 0.6) {
      explanations.push(`Good cultural fit potential`)
    }

    if (breakdown.interests > 0.5) {
      explanations.push(`Shared interests and preferences`)
    }

    if (explanations.length === 0) {
      explanations.push('Basic similarity based on profile characteristics')
    }

    return explanations
  }

  /**
   * Generate match details
   */
  private generateMatchDetails(
    source: any,
    target: any,
    breakdown: SimilarityRecommendation['similarityBreakdown'],
    type: string
  ): SimilarityRecommendation['matchDetails'] {
    const commonSkills = this.getCommonSkills(source, target, type)
    const experienceAlignment = this.getExperienceAlignment(source, target, type)
    const educationCompatibility = this.getEducationCompatibility(source, target, type)

    const details: SimilarityRecommendation['matchDetails'] = {
      commonSkills,
      experienceAlignment,
      educationCompatibility
    }

    // Add location and salary match if applicable
    if (type === 'job') {
      details.locationMatch = this.getLocationMatch(source, target)
      details.salaryMatch = this.getSalaryMatch(source, target)
    }

    return details
  }

  /**
   * Get common skills
   */
  private getCommonSkills(source: any, target: any, type: string): string[] {
    const sourceSkills = type === 'job'
      ? source.skills?.map((s: any) => s.name) || []
      : source.profile?.skills?.map((s: any) => s.name) || []

    const targetSkills = type === 'job'
      ? target.skills?.map((s: any) => s.name) || []
      : target.profile?.skills?.map((s: any) => s.name) || []

    return sourceSkills.filter(skill => targetSkills.includes(skill))
  }

  /**
   * Get experience alignment description
   */
  private getExperienceAlignment(source: any, target: any, type: string): string {
    if (type === 'job') {
      const jobLevel = this.extractJobLevel(source)
      const candidateExp = target.profile?.totalExperience || 0
      return `${Math.round(candidateExp)} years experience vs ${jobLevel} level requirement`
    } else {
      const exp1 = source.profile?.totalExperience || 0
      const exp2 = target.profile?.totalExperience || 0
      return `Both have ${Math.round((exp1 + exp2) / 2)} years average experience`
    }
  }

  /**
   * Get education compatibility
   */
  private getEducationCompatibility(source: any, target: any, type: string): string {
    const levels = ['High School', "Associate's", "Bachelor's", "Master's", 'PhD']

    const getEducationLevel = (item: any, itemType: string) => {
      if (itemType === 'job') {
        return this.getRequiredEducationLevel(item)
      } else {
        const education = item.profile?.education || []
        if (education.length === 0) return 'Not specified'
        const highestLevel = Math.max(...education.map((edu: any) =>
          levels.indexOf(edu.level)
        ))
        return levels[highestLevel] || 'Not specified'
      }
    }

    const sourceLevel = getEducationLevel(source, type)
    const targetLevel = getEducationLevel(target, type)

    return `${sourceLevel} education level`
  }

  /**
   * Get location match
   */
  private getLocationMatch(source: any, target: any): string {
    if (source.isRemote && target.profile?.preferences?.remoteWork) {
      return 'Remote work compatible'
    }

    if (source.location && target.profile?.location) {
      const distance = this.calculateDistance(
        source.latitude,
        source.longitude,
        target.profile.latitude,
        target.profile.longitude
      )

      if (distance < 50) {
        return `${Math.round(distance)} miles away`
      }
    }

    return 'Location mismatch'
  }

  /**
   * Get salary match
   */
  private getSalaryMatch(source: any, target: any): string {
    const jobMin = source.salaryMin || 0
    const jobMax = source.salaryMax || 0
    const candidateMin = target.profile?.salaryExpectation?.min || 0
    const candidateMax = target.profile?.salaryExpectation?.max || 0

    if (candidateMin <= jobMax && candidateMax >= jobMin) {
      return 'Salary expectations align'
    }

    return 'Salary expectations may not align'
  }

  /**
   * Calculate overall similarity
   */
  private calculateOverallSimilarity(breakdown: SimilarityRecommendation['similarityBreakdown']): number {
    const weights = {
      skills: 0.35,
      experience: 0.25,
      education: 0.15,
      interests: 0.1,
      industry: 0.1,
      companyCulture: 0.05
    }

    return Object.entries(breakdown).reduce((sum, [key, value]) => {
      return sum + (value * weights[key as keyof typeof weights])
    }, 0)
  }

  /**
   * Generate similarity reasons
   */
  private generateSimilarityReasons(
    breakdown: SimilarityRecommendation['similarityBreakdown'],
    type: string
  ): string[] {
    const reasons: string[] = []

    if (breakdown.skills > 0.7) {
      reasons.push(`Excellent skill match at ${Math.round(breakdown.skills * 100)}%`)
    } else if (breakdown.skills > 0.5) {
      reasons.push(`Good skill overlap at ${Math.round(breakdown.skills * 100)}%`)
    }

    if (breakdown.experience > 0.8) {
      reasons.push('Perfect experience alignment')
    } else if (breakdown.experience > 0.6) {
      reasons.push('Strong experience match')
    }

    if (breakdown.education > 0.7) {
      reasons.push('Education requirements met')
    }

    if (breakdown.industry > 0.8) {
      reasons.push('Industry expertise matches')
    }

    if (breakdown.companyCulture > 0.6) {
      reasons.push('Cultural alignment likely')
    }

    return reasons
  }

  /**
   * Apply additional filters
   */
  private applyAdditionalFilters(
    recommendations: SimilarityRecommendation[],
    filters: SimilarityRequest['filters'],
    context: SimilarityRequest['context']
  ): SimilarityRecommendation[] {
    let filtered = recommendations

    // Filter by similarity threshold
    if (filters.similarityThreshold) {
      filtered = filtered.filter(rec => rec.similarity >= filters.similarityThreshold!)
    }

    // Exclude already applied items
    if (filters.excludeApplied && context.userId) {
      // Implementation would depend on tracking user applications/views
    }

    // Exclude already viewed items
    if (filters.excludeViewed && context.userId) {
      // Implementation would depend on tracking user views
    }

    // Filter by industries
    if (filters.industries?.length > 0) {
      // Implementation would require industry information in recommendations
    }

    // Filter by locations
    if (filters.locations?.length > 0) {
      // Implementation would require location information in recommendations
    }

    return filtered
  }

  /**
   * Build search filters for vector search
   */
  private buildSearchFilters(filters: SimilarityRequest['filters'], type: string): any {
    const searchFilters: any = {}

    if (filters.industries?.length > 0) {
      searchFilters.industry = { in: filters.industries }
    }

    if (filters.locations?.length > 0) {
      searchFilters.location = { in: filters.locations }
    }

    if (filters.experienceLevel?.length > 0) {
      searchFilters.experienceLevel = { in: filters.experienceLevel }
    }

    if (filters.timeRange) {
      searchFilters.createdAt = {
        gte: filters.timeRange.start,
        lte: filters.timeRange.end
      }
    }

    return searchFilters
  }

  /**
   * Enrich candidate similarity with additional details
   */
  private async enrichCandidateSimilarity(
    candidates: any[],
    sourceCandidate: any
  ): Promise<SimilarityRecommendation[]> {
    return await Promise.all(
      candidates.map(async (candidate) => {
        const breakdown = await this.calculateSimilarityBreakdown(
          sourceCandidate,
          candidate,
          'candidate'
        )

        return {
          id: candidate.id,
          type: 'candidate' as const,
          similarity: candidate.similarity,
          similarityBreakdown: breakdown,
          explanation: await this.generateSimilarityExplanation(
            sourceCandidate,
            candidate,
            breakdown,
            'candidate'
          ),
          reasons: this.generateSimilarityReasons(breakdown, 'candidate'),
          matchDetails: this.generateMatchDetails(
            sourceCandidate,
            candidate,
            breakdown,
            'candidate'
          )
        }
      })
    )
  }

  /**
   * Enrich job similarity with additional details
   */
  private async enrichJobSimilarity(
    jobs: any[],
    sourceJob: any
  ): Promise<SimilarityRecommendation[]> {
    return await Promise.all(
      jobs.map(async (job) => {
        const breakdown = await this.calculateSimilarityBreakdown(
          sourceJob,
          job,
          'job'
        )

        return {
          id: job.id,
          type: 'job' as const,
          similarity: job.similarity,
          similarityBreakdown: breakdown,
          explanation: await this.generateSimilarityExplanation(
            sourceJob,
            job,
            breakdown,
            'job'
          ),
          reasons: this.generateSimilarityReasons(breakdown, 'job'),
          matchDetails: this.generateMatchDetails(
            sourceJob,
            job,
            breakdown,
            'job'
          )
        }
      })
    )
  }

  /**
   * Helper methods
   */
  private extractJobLevel(job: any): string {
    const title = job.title?.toLowerCase() || ''
    const description = job.description?.toLowerCase() || ''

    if (title.includes('junior') || title.includes('entry') || description.includes('entry level')) {
      return 'entry'
    }
    if (title.includes('senior') || title.includes('lead') || description.includes('senior level')) {
      return 'senior'
    }
    if (title.includes('principal') || title.includes('architect') || title.includes('director')) {
      return 'expert'
    }

    return 'mid'
  }

  private getExpectedExperience(jobLevel: string): number {
    switch (jobLevel) {
      case 'entry': return 1
      case 'mid': return 4
      case 'senior': return 7
      case 'expert': return 10
      default: return 4
    }
  }

  private getRequiredEducationLevel(job: any): number {
    const levels = ['high_school', 'associate', 'bachelor', 'master', 'phd']

    if (job.requirements?.education) {
      const eduLevel = job.requirements.education.toLowerCase()
      return Math.max(0, levels.indexOf(eduLevel))
    }

    return 2 // Bachelor's default
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3959 // Earth's radius in miles
    const dLat = this.toRadians(lat2 - lat1)
    const dLon = this.toRadians(lon2 - lon1)
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }
}