import {
  CandidateProfile,
  JobProfile,
  Recommendation,
  RecommendationContext,
  RecommendationFilters
} from '@/types/matching';
import { logger } from '@/lib/logging/logger';
import { prisma } from '@/lib/prisma';

/**
 * Job recommendation configuration
 */
export interface JobRecommenderConfig {
  maxRecommendations: number;
  minMatchScore: number;
  enableSkillsBoost: boolean;
  enableLocationBoost: boolean;
  enableSalaryBoost: boolean;
  enableExperienceBoost: boolean;
  diversityThreshold: number;
  timeDecayFactor: number;
  trendingWeight: number;
}

/**
 * Job analysis result
 */
interface JobAnalysis {
  skillsMatch: number;
  experienceMatch: number;
  locationMatch: number;
  salaryMatch: number;
  culturalFit: number;
  overallScore: number;
  matchingFactors: string[];
}

/**
 * Advanced job recommender for candidates
 */
export class JobRecommender {
  private config: JobRecommenderConfig;
  private skillsBoostMap: Map<string, number> = new Map();
  private locationBoostMap: Map<string, number> = new Map();

  constructor(config?: Partial<JobRecommenderConfig>) {
    this.config = {
      maxRecommendations: 20,
      minMatchScore: 0.5,
      enableSkillsBoost: true,
      enableLocationBoost: true,
      enableSalaryBoost: true,
      enableExperienceBoost: true,
      diversityThreshold: 0.3,
      timeDecayFactor: 0.95,
      trendingWeight: 0.1,
      ...config
    };

    this.initializeBoostMaps();
  }

  /**
   * Initialize the job recommender
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing job recommender');

      // Load skills importance data
      await this.loadSkillsImportance();

      // Load location preference data
      await this.loadLocationPreferences();

      logger.info('Job recommender initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize job recommender', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get job recommendations for a candidate
   */
  async getJobRecommendations(
    candidate: CandidateProfile,
    count: number = 20,
    filters?: RecommendationFilters,
    context?: RecommendationContext
  ): Promise<Recommendation[]> {
    try {
      logger.info('Getting job recommendations', {
        candidateId: candidate.id,
        count,
        filters
      });

      // Get available jobs
      const jobs = await this.getAvailableJobs(filters);
      if (jobs.length === 0) {
        return [];
      }

      // Analyze each job
      const jobAnalyses: Array<{
        job: JobProfile;
        analysis: JobAnalysis;
      }> = [];

      for (const job of jobs) {
        const analysis = await this.analyzeJobMatch(candidate, job, context);
        jobAnalyses.push({ job, analysis });
      }

      // Apply filters
      const filteredAnalyses = jobAnalyses.filter(ja =>
        ja.analysis.overallScore >= this.config.minMatchScore
      );

      // Apply diversification
      const diversifiedRecommendations = this.applyDiversification(
        filteredAnalyses,
        count
      );

      // Convert to recommendations
      const recommendations: Recommendation[] = diversifiedRecommendations.map(({ job, analysis }) => ({
        itemId: job.id,
        itemType: 'job',
        score: analysis.overallScore,
        confidence: this.calculateConfidence(analysis),
        algorithm: 'content_based',
        explanation: this.generateExplanation(analysis),
        metadata: {
          jobTitle: job.title,
          company: job.company,
          location: job.location,
          requiredSkills: job.requiredSkills,
          salaryRange: job.salaryRange,
          remoteWorkPolicy: job.remoteWorkPolicy,
          industry: job.industry,
          matchingFactors: analysis.matchingFactors,
          analysis
        }
      }));

      logger.info('Job recommendations generated', {
        candidateId: candidate.id,
        totalJobs: jobs.length,
        filteredJobs: filteredAnalyses.length,
        recommendations: recommendations.length
      });

      return recommendations;
    } catch (error) {
      logger.error('Job recommendations failed', {
        candidateId: candidate.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get similar jobs based on a reference job
   */
  async getSimilarJobs(
    referenceJob: JobProfile,
    count: number = 10,
    filters?: RecommendationFilters
  ): Promise<Recommendation[]> {
    try {
      logger.info('Getting similar jobs', {
        referenceJobId: referenceJob.id,
        count,
        filters
      });

      // Get available jobs excluding the reference job
      const jobs = await this.getAvailableJobs(filters, referenceJob.id);
      if (jobs.length === 0) {
        return [];
      }

      // Calculate similarity scores
      const similarJobs = jobs.map(job => ({
        job,
        similarity: this.calculateJobSimilarity(referenceJob, job)
      }));

      // Filter by similarity threshold and sort
      const filteredJobs = similarJobs
        .filter(({ similarity }) => similarity >= 0.5)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, count);

      // Convert to recommendations
      const recommendations: Recommendation[] = filteredJobs.map(({ job, similarity }) => ({
        itemId: job.id,
        itemType: 'job',
        score: similarity,
        confidence: similarity * 0.9,
        algorithm: 'similarity_based',
        explanation: this.generateSimilarityExplanation(referenceJob, job, similarity),
        metadata: {
          jobTitle: job.title,
          company: job.company,
          location: job.location,
          requiredSkills: job.requiredSkills,
          salaryRange: job.salaryRange,
          industry: job.industry,
          referenceJob: referenceJob.id,
          similarityScore: similarity
        }
      }));

      logger.info('Similar jobs generated', {
        referenceJobId: referenceJob.id,
        totalJobs: jobs.length,
        similarJobs: recommendations.length
      });

      return recommendations;
    } catch (error) {
      logger.error('Similar jobs failed', {
        referenceJobId: referenceJob.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get trending jobs
   */
  async getTrendingJobs(
    candidate?: CandidateProfile,
    count: number = 10,
    filters?: RecommendationFilters
  ): Promise<Recommendation[]> {
    try {
      logger.info('Getting trending jobs', {
        candidateId: candidate?.id,
        count,
        filters
      });

      // Get jobs with high activity in recent period
      const trendingJobs = await this.getTrendingJobData(count * 2, filters);

      // Score based on trending factors
      const scoredJobs = trendingJobs.map(job => ({
        job,
        trendingScore: this.calculateTrendingScore(job)
      }));

      // Filter and sort
      const filteredJobs = scoredJobs
        .filter(({ trendingScore }) => trendingScore > 0.3)
        .sort((a, b) => b.trendingScore - a.trendingScore)
        .slice(0, count);

      // Personalize for candidate if provided
      let personalizedJobs = filteredJobs;
      if (candidate) {
        personalizedJobs = this.personalizeTrendingJobs(filteredJobs, candidate);
      }

      // Convert to recommendations
      const recommendations: Recommendation[] = personalizedJobs.map(({ job, trendingScore, personalizedScore }) => ({
        itemId: job.id,
        itemType: 'job',
        score: personalizedScore || trendingScore,
        confidence: Math.min(0.7, trendingScore),
        algorithm: 'trending',
        explanation: this.generateTrendingExplanation(job, trendingScore),
        metadata: {
          jobTitle: job.title,
          company: job.company,
          location: job.location,
          requiredSkills: job.requiredSkills,
          salaryRange: job.salaryRange,
          industry: job.industry,
          trendingScore,
          personalizedScore,
          trendingFactors: this.getTrendingFactors(job)
        }
      }));

      logger.info('Trending jobs generated', {
        candidateId: candidate?.id,
        totalJobs: trendingJobs.length,
        trendingJobs: recommendations.length
      });

      return recommendations;
    } catch (error) {
      logger.error('Trending jobs failed', {
        candidateId: candidate?.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Analyze job match for a candidate
   */
  private async analyzeJobMatch(
    candidate: CandidateProfile,
    job: JobProfile,
    context?: RecommendationContext
  ): Promise<JobAnalysis> {
    const analysis: JobAnalysis = {
      skillsMatch: 0,
      experienceMatch: 0,
      locationMatch: 0,
      salaryMatch: 0,
      culturalFit: 0,
      overallScore: 0,
      matchingFactors: []
    };

    try {
      // Skills matching
      if (this.config.enableSkillsBoost) {
        analysis.skillsMatch = this.calculateSkillsMatch(candidate, job);
        analysis.matchingFactors.push('skills');
      }

      // Experience matching
      if (this.config.enableExperienceBoost) {
        analysis.experienceMatch = this.calculateExperienceMatch(candidate, job);
        analysis.matchingFactors.push('experience');
      }

      // Location matching
      if (this.config.enableLocationBoost) {
        analysis.locationMatch = this.calculateLocationMatch(candidate, job);
        analysis.matchingFactors.push('location');
      }

      // Salary matching
      if (this.config.enableSalaryBoost) {
        analysis.salaryMatch = this.calculateSalaryMatch(candidate, job);
        analysis.matchingFactors.push('salary');
      }

      // Cultural fit
      analysis.culturalFit = this.calculateCulturalFit(candidate, job);
      analysis.matchingFactors.push('cultural_fit');

      // Calculate overall score with weights
      analysis.overallScore = this.calculateOverallScore(analysis);

      // Apply time decay
      if (context?.recencyWeight) {
        analysis.overallScore *= (1 + context.recencyWeight * this.config.timeDecayFactor);
      }

    } catch (error) {
      logger.error('Job analysis failed', {
        candidateId: candidate.id,
        jobId: job.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return analysis;
  }

  /**
   * Calculate skills matching score
   */
  private calculateSkillsMatch(candidate: CandidateProfile, job: JobProfile): number {
    try {
      const candidateSkills = this.extractSkills(candidate.skills);
      const jobSkills = this.extractSkills(job.requiredSkills);

      if (candidateSkills.length === 0 || jobSkills.length === 0) {
        return 0;
      }

      // Calculate Jaccard similarity
      const candidateSkillSet = new Set(candidateSkills);
      const jobSkillSet = new Set(jobSkills);

      const intersection = new Set([...candidateSkillSet].filter(skill => jobSkillSet.has(skill)));
      const union = new Set([...candidateSkillSet, ...jobSkillSet]);

      const baseScore = intersection.size / union.size;

      // Apply skills importance boost
      let importanceBoost = 1.0;
      for (const skill of intersection) {
        importanceBoost += this.skillsBoostMap.get(skill) || 0;
      }
      importanceBoost = Math.min(importanceBoost, candidateSkills.length);

      // Apply experience-based weighting
      const experienceWeight = this.getSkillsExperienceWeight(candidateSkills, jobSkills);

      return Math.min(1.0, baseScore * importanceBoost * experienceWeight);
    } catch (error) {
      logger.error('Skills match calculation failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return 0;
    }
  }

  /**
   * Calculate experience matching score
   */
  private calculateExperienceMatch(candidate: CandidateProfile, job: JobProfile): number {
    try {
      const candidateExperience = this.getTotalExperience(candidate);
      const requiredExperience = job.experienceRequired || 0;

      if (requiredExperience === 0) {
        return 1.0; // Any experience level is acceptable
      }

      // Calculate match ratio
      const ratio = candidateExperience / requiredExperience;

      // Score based on experience alignment
      if (ratio >= 0.8 && ratio <= 1.5) {
        return 1.0; // Perfect match
      } else if (ratio >= 0.5 && ratio <= 2.0) {
        return 0.8; // Good match
      } else if (ratio >= 0.3 && ratio <= 3.0) {
        return 0.6; // Acceptable match
      } else {
        return Math.max(0.1, 1 - Math.abs(ratio - 1)); // Poor match
      }
    } catch (error) {
      logger.error('Experience match calculation failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return 0;
    }
  }

  /**
   * Calculate location matching score
   */
  private calculateLocationMatch(candidate: CandidateProfile, job: JobProfile): number {
    try {
      const candidateLocation = candidate.location;
      const jobLocation = job.location;
      const remotePolicy = job.remoteWorkPolicy;

      if (!candidateLocation || !jobLocation) {
        return 0.5; // Neutral score
      }

      // Check remote work compatibility
      if (remotePolicy === 'remote' || remotePolicy === 'hybrid') {
        return 1.0; // Remote work available
      }

      // Calculate location similarity
      const similarity = this.calculateLocationSimilarity(candidateLocation, jobLocation);

      // Apply location boost
      const locationBoost = this.getLocationBoost(
        candidateLocation,
        jobLocation
      );

      return Math.min(1.0, similarity * locationBoost);
    } catch (error) {
      logger.error('Location match calculation failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return 0;
    }
  }

  /**
   * Calculate salary matching score
   */
  private calculateSalaryMatch(candidate: CandidateProfile, job: JobProfile): number {
    try {
      const candidateSalary = candidate.salaryExpectation;
      const jobSalary = job.salaryRange;

      if (!candidateSalary || !jobSalary) {
        return 0.5; // Neutral score
      }

      const candidateMin = candidateSalary.min || 0;
      const candidateMax = candidateSalary.max || candidateMin;
      const jobMin = jobSalary.min || 0;
      const jobMax = jobSalary.max || jobMin;

      // Check if salary ranges overlap
      const rangesOverlap = candidateMax >= jobMin && candidateMin <= jobMax;

      if (rangesOverlap) {
        return 1.0; // Perfect match
      }

      // Calculate alignment score
      const candidateAvg = (candidateMin + candidateMax) / 2;
      const jobAvg = (jobMin + jobMax) / 2;

      const ratio = candidateAvg / jobAvg;

      if (ratio >= 0.8 && ratio <= 1.2) {
        return 0.9; // Good alignment
      } else if (ratio >= 0.6 && ratio <= 1.5) {
        return 0.7; // Acceptable alignment
      } else if (ratio >= 0.4 && ratio <= 2.0) {
        return 0.5; // Some alignment
      } else {
        return Math.max(0.1, 1 - Math.abs(ratio - 1)); // Poor alignment
      }
    } catch (error) {
      logger.error('Salary match calculation failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return 0;
    }
  }

  /**
   * Calculate cultural fit score
   */
  private calculateCulturalFit(candidate: CandidateProfile, job: JobProfile): number {
    try {
      const candidatePreferences = candidate.preferences;
      const jobCulture = job.workCulture;

      if (!candidatePreferences || !jobCulture) {
        return 0.6; // Neutral score
      }

      let fitScore = 0.5; // Base score

      // Work style alignment
      if (candidatePreferences.workStyle && jobCulture.workStyle) {
        if (candidatePreferences.workStyle === jobCulture.workStyle) {
          fitScore += 0.2;
        }
      }

      // Company size preference
      if (candidatePreferences.companySize && job.company?.size) {
        if (candidatePreferences.companySize === job.company.size) {
          fitScore += 0.15;
        }
      }

      // Growth opportunities
      if (candidatePreferences.growthOpportunities && jobCulture.growthOpportunities) {
        fitScore += 0.15;
      }

      return Math.min(1.0, fitScore);
    } catch (error) {
      logger.error('Cultural fit calculation failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return 0;
    }
  }

  /**
   * Calculate overall score with weights
   */
  private calculateOverallScore(analysis: JobAnalysis): number {
    const weights = {
      skills: 0.35,
      experience: 0.25,
      location: 0.15,
      salary: 0.15,
      culturalFit: 0.1
    };

    let totalScore = 0;
    let totalWeight = 0;

    for (const [factor, score] of Object.entries(analysis)) {
      if (factor !== 'overallScore' && factor !== 'matchingFactors') {
        const weight = weights[factor as keyof typeof weights] || 0;
        totalScore += score * weight;
        totalWeight += weight;
      }
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * Apply diversification to recommendations
   */
  private applyDiversification(
    jobAnalyses: Array<{ job: JobProfile; analysis: JobAnalysis }>,
    count: number
  ): Array<{ job: JobProfile; analysis: JobAnalysis }> {
    const diversified: Array<{ job: JobProfile; analysis: JobAnalysis }> = [];
    const usedCategories = new Set<string>();

    // Sort by score initially
    const sortedAnalyses = jobAnalyses.sort((a, b) => b.analysis.overallScore - a.analysis.overallScore);

    for (const analysis of sortedAnalyses) {
      if (diversified.length >= count) break;

      const category = this.getJobCategory(analysis.job);

      // Include if category not used or if we need more recommendations
      if (!usedCategories.has(category) || diversified.length < Math.ceil(count * this.config.diversityThreshold)) {
        diversified.push(analysis);
        usedCategories.add(category);
      }
    }

    return diversified;
  }

  /**
   * Calculate job similarity
   */
  private calculateJobSimilarity(job1: JobProfile, job2: JobProfile): number {
    try {
      let similarity = 0;
      let factors = 0;

      // Title similarity
      const titleSimilarity = this.calculateTextSimilarity(job1.title, job2.title);
      similarity += titleSimilarity * 0.3;
      factors += 0.3;

      // Skills similarity
      const skills1 = this.extractSkills(job1.requiredSkills);
      const skills2 = this.extractSkills(job2.requiredSkills);
      if (skills1.length > 0 && skills2.length > 0) {
        const set1 = new Set(skills1);
        const set2 = new Set(skills2);
        const intersection = new Set([...set1].filter(skill => set2.has(skill)));
        const union = new Set([...set1, ...set2]);
        const skillsSimilarity = intersection.size / union.size;
        similarity += skillsSimilarity * 0.4;
        factors += 0.4;
      }

      // Industry similarity
      if (job1.industry && job2.industry && job1.industry === job2.industry) {
        similarity += 0.2;
        factors += 0.2;
      }

      // Location similarity
      if (job1.location && job2.location) {
        const locationSimilarity = this.calculateLocationSimilarity(job1.location, job2.location);
        similarity += locationSimilarity * 0.1;
        factors += 0.1;
      }

      return factors > 0 ? similarity / factors : 0;
    } catch (error) {
      logger.error('Job similarity calculation failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return 0;
    }
  }

  /**
   * Calculate trending score for a job
   */
  private calculateTrendingScore(job: JobProfile): number {
    try {
      let score = 0;

      // Recent activity score
      const recentActivity = this.getJobRecentActivity(job);
      score += recentActivity * 0.4;

      // Application rate
      const applicationRate = this.getJobApplicationRate(job);
      score += applicationRate * 0.3;

      // View rate
      const viewRate = this.getJobViewRate(job);
      score += viewRate * 0.2;

      // Save rate
      const saveRate = this.getJobSaveRate(job);
      score += saveRate * 0.1;

      return Math.min(1.0, score);
    } catch (error) {
      logger.error('Trending score calculation failed', {
        jobId: job.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return 0;
    }
  }

  /**
   * Personalize trending jobs for a candidate
   */
  private personalizeTrendingJobs(
    trendingJobs: Array<{ job: JobProfile; trendingScore: number }>,
    candidate: CandidateProfile
  ): Array<{ job: JobProfile; trendingScore: number; personalizedScore?: number }> {
    return trendingJobs.map(({ job, trendingScore }) => {
      let personalizedScore = trendingScore;

      // Skills-based personalization
      const candidateSkills = this.extractSkills(candidate.skills);
      const jobSkills = this.extractSkills(job.requiredSkills);

      if (candidateSkills.length > 0 && jobSkills.length > 0) {
        const candidateSkillSet = new Set(candidateSkills);
        const jobSkillSet = new Set(jobSkills);
        const overlap = new Set([...candidateSkillSet].filter(skill => jobSkillSet.has(skill)));
        const skillsAlignment = overlap.size / Math.min(candidateSkillSet.size, jobSkillSet.size);
        personalizedScore += skillsAlignment * 0.3;
      }

      // Experience-based personalization
      const candidateExperience = this.getTotalExperience(candidate);
      const requiredExperience = job.experienceRequired || 0;
      if (requiredExperience > 0) {
        const experienceAlignment = Math.min(1.0, candidateExperience / requiredExperience);
        personalizedScore += experienceAlignment * 0.2;
      }

      // Location-based personalization
      if (candidate.location && job.location) {
        const locationAlignment = this.calculateLocationSimilarity(candidate.location, job.location);
        personalizedScore += locationAlignment * 0.1;
      }

      return { job, trendingScore, personalizedScore };
    });
  }

  /**
   * Get available jobs with filters
   */
  private async getAvailableJobs(filters?: RecommendationFilters, excludeJobId?: string): Promise<JobProfile[]> {
    try {
      const whereClause: any = {
        active: true
      };

      if (excludeJobId) {
        whereClause.id = { not: excludeJobId };
      }

      // Apply filters
      if (filters) {
        if (filters.industry) {
          whereClause.industry = filters.industry;
        }
        if (filters.location) {
          whereClause.location = {
            path: ['city'],
            string_contains: filters.location
          };
        }
        if (filters.minSalary) {
          whereClause.salaryRange = {
            min: { gte: filters.minSalary }
          };
        }
        if (filters.remoteWorkPolicy) {
          whereClause.remoteWorkPolicy = filters.remoteWorkPolicy;
        }
        if (filters.employmentType) {
          whereClause.employmentType = filters.employmentType;
        }
      }

      const jobs = await prisma.jobProfile.findMany({
        where: whereClause,
        select: {
          id: true,
          userId: true,
          title: true,
          company: true,
          location: true,
          description: true,
          responsibilities: true,
          requirements: true,
          requiredSkills: true,
          preferredSkills: true,
          benefits: true,
          salaryRange: true,
          workCulture: true,
          remoteWorkPolicy: true,
          educationRequirements: true,
          experienceRequired: true,
          applicationDeadline: true,
          startDate: true,
          employmentType: true,
          industry: true,
          department: true,
          customFields: true,
          completionScore: true,
          lastUpdated: true,
          metadata: true,
          active: true,
          featured: true,
          urgent: true,
          createdAt: true
        },
        orderBy: {
          featured: 'desc',
          createdAt: 'desc'
        },
        take: this.config.maxRecommendations * 2
      });

      return jobs.map(job => ({
        id: job.id,
        userId: job.userId,
        title: job.title,
        company: job.company as any,
        location: job.location as any,
        description: job.description,
        responsibilities: job.responsibilities as any,
        requirements: job.requirements as any,
        requiredSkills: job.requiredSkills as any,
        preferredSkills: job.preferredSkills as any,
        benefits: job.benefits as any,
        salaryRange: job.salaryRange as any,
        workCulture: job.workCulture as any,
        remoteWorkPolicy: job.remoteWorkPolicy,
        educationRequirements: job.educationRequirements as any,
        experienceRequired: job.experienceRequired,
        applicationDeadline: job.applicationDeadline,
        startDate: job.startDate,
        employmentType: job.employmentType,
        industry: job.industry,
        department: job.department,
        customFields: job.customFields as any,
        completionScore: job.completionScore,
        lastUpdated: job.lastUpdated,
        metadata: job.metadata as any,
        active: job.active,
        featured: job.featured,
        urgent: job.urgent
      }));
    } catch (error) {
      logger.error('Failed to get available jobs', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  /**
   * Get trending job data
   */
  private async getTrendingJobData(count: number, filters?: RecommendationFilters): Promise<JobProfile[]> {
    try {
      // Get jobs with high activity in the last 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const jobs = await prisma.jobProfile.findMany({
        where: {
          active: true,
          createdAt: { gte: sevenDaysAgo },
          ...filters
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: count,
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          requiredSkills: true,
          salaryRange: true,
          industry: true,
          createdAt: true
        }
      });

      return jobs.map(job => ({
        id: job.id,
        userId: job.userId,
        title: job.title,
        company: job.company as any,
        location: job.location as any,
        requiredSkills: job.requiredSkills as any,
        salaryRange: job.salaryRange as any,
        industry: job.industry,
        createdAt: job.createdAt,
        // Fill missing fields with defaults
        description: '',
        responsibilities: [],
        requirements: [],
        preferredSkills: [],
        benefits: null,
        workCulture: null,
        remoteWorkPolicy: 'onsite',
        educationRequirements: null,
        experienceRequired: 0,
        applicationDeadline: null,
        startDate: null,
        employmentType: 'full-time',
        department: '',
        customFields: {},
        completionScore: 0,
        lastUpdated: new Date(),
        metadata: {},
        active: true,
        featured: false,
        urgent: false
      }));
    } catch (error) {
      logger.error('Failed to get trending job data', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  // Helper methods
  private extractSkills(skills: any): string[] {
    try {
      if (Array.isArray(skills)) {
        return skills;
      } else if (typeof skills === 'object' && skills !== null) {
        return Object.keys(skills);
      } else if (typeof skills === 'string') {
        return skills.split(',').map(s => s.trim());
      }
      return [];
    } catch (error) {
      return [];
    }
  }

  private getTotalExperience(candidate: CandidateProfile): number {
    try {
      const experience = candidate.experience;
      if (!Array.isArray(experience)) return 0;

      let totalYears = 0;
      for (const exp of experience) {
        if (exp.startDate) {
          const start = new Date(exp.startDate);
          const end = exp.endDate ? new Date(exp.endDate) : new Date();
          totalYears += (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
        }
      }
      return totalYears;
    } catch (error) {
      return 0;
    }
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    // Simple text similarity calculation
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);

    const set1 = new Set(words1);
    const set2 = new Set(words2);
    const intersection = new Set([...set1].filter(word => set2.has(word)));
    const union = new Set([...set1, ...set2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private calculateLocationSimilarity(location1: any, location2: any): number {
    // Simple location similarity
    if (!location1 || !location2) return 0.5;

    // Check city
    if (location1.city && location2.city) {
      return location1.city.toLowerCase() === location2.city.toLowerCase() ? 1.0 : 0;
    }

    // Check country
    if (location1.country && location2.country) {
      return location1.country.toLowerCase() === location2.country.toLowerCase() ? 0.8 : 0.5;
    }

    return 0.5; // Default
  }

  private getLocationBoost(location1: any, location2: any): number {
    // Location-based boost factor
    if (!location1 || !location2) return 1.0;

    // Same city gets highest boost
    if (location1.city === location2.city) {
      return 1.2;
    }

    // Same country gets medium boost
    if (location1.country === location2.country) {
      return 1.1;
    }

    return 1.0; // Default boost
  }

  private getSkillsExperienceWeight(skills1: string[], skills2: string[]): number {
    // Calculate experience-based weight for skills
    // This would use industry-specific experience requirements
    return 1.0; // Default weight
  }

  private getJobCategory(job: JobProfile): string {
    // Extract job category from industry, title, or metadata
    if (job.industry) return job.industry.toLowerCase();
    if (job.title) {
      const title = job.title.toLowerCase();
      if (title.includes('engineer')) return 'engineering';
      if (title.includes('manager')) return 'management';
      if (title.includes('developer')) return 'engineering';
      if (title.includes('analyst')) return 'analytics';
    }
    return 'other';
  }

  private generateExplanation(analysis: JobAnalysis): RecommendationExplanation {
    const factors = analysis.matchingFactors.map(factor => {
      const score = analysis[factor as keyof JobAnalysis] as number;
      const descriptions: Record<string, string> = {
        skills: 'Strong alignment of your technical skills with job requirements',
        experience: 'Your experience level matches the job requirements',
        location: 'Job location preferences align with your location',
        salary: 'Salary expectations are well-aligned with job compensation',
        cultural_fit: 'Work environment and culture match your preferences'
      };

      return {
        factor,
        contribution: score,
        description: descriptions[factor] || 'Matching factor'
      };
    });

    return {
      summary: `Job match score: ${(analysis.overallScore * 100).toFixed(1)}%`,
      factors,
      confidence: 0.8,
      personalized: true
    };
  }

  private generateSimilarityExplanation(job1: JobProfile, job2: JobProfile, similarity: number): RecommendationExplanation {
    return {
      summary: `Similar job with ${(similarity * 100).toFixed(1)}% similarity`,
      factors: [
        {
          factor: 'similarity',
          contribution: similarity,
          description: `Similar to job you viewed: ${job1.title}`
        }
      ],
      confidence: similarity * 0.9,
      personalized: false
    };
  }

  private generateTrendingExplanation(job: JobProfile, score: number): RecommendationExplanation {
    return {
      summary: `Trending job with high market activity`,
      factors: [
        {
          factor: 'trending',
          contribution: score,
          description: 'Highly requested and viewed recently'
        }
      ],
      confidence: 0.7,
      personalized: false
    };
  }

  private generateExplanationFromHybrid(recommendations: Recommendation[]): RecommendationExplanation {
    const avgScore = recommendations.reduce((sum, rec) => sum + rec.score, 0) / recommendations.length;
    const algorithms = [...new Set(recommendations.map(r => r.algorithm))];

    return {
      summary: `Personalized recommendations with ${avgScore.toFixed(1)}% average match score`,
      factors: algorithms.map(algorithm => ({
        factor: algorithm,
        contribution: 0.8,
        description: `Recommendations from ${algorithm} algorithm`
      })),
      confidence: avgScore,
      personalized: true
    };
  }

  private calculateConfidence(analysis: JobAnalysis): number {
    const factors = [
      analysis.skillsMatch,
      analysis.experienceMatch,
      analysis.locationMatch,
      analysis.salaryMatch,
      analysis.culturalFit
    ];

    // Confidence based on consistency of factors
    const avgFactor = factors.reduce((sum, factor) => sum + factor, 0) / factors.length;
    const variance = factors.reduce((sum, factor) => sum + Math.pow(factor - avgFactor, 2), 0) / factors.length;
    const consistency = 1 - Math.min(variance, 1);

    return Math.min(0.9, avgFactor * consistency);
  }

  private getJobRecentActivity(job: JobProfile): number {
    // This would query actual activity data
    return Math.random() * 0.5; // Mock implementation
  }

  private getJobApplicationRate(job: JobProfile): number {
    // This would query actual application data
    return Math.random() * 0.3; // Mock implementation
  }

  private getJobViewRate(job: JobProfile): number {
    // This would query actual view data
    return Math.random() * 0.7; // Mock implementation
  }

  private getJobSaveRate(job: JobProfile): number {
    // This would query actual save data
    return Math.random() * 0.2; // Mock implementation
  }

  private getTrendingFactors(job: JobProfile): string[] {
    const factors: string[] = [];

    if (job.featured) factors.push('featured');
    if (job.urgent) factors.push('urgent');
    if (job.createdAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
      factors.push('recently_posted');
    }

    return factors;
  }

  private async loadSkillsImportance(): Promise<void> {
    // Load skills importance data from database or external source
    // Mock implementation for common skills
    const commonSkills = [
      'javascript', 'python', 'java', 'react', 'node.js', 'sql',
      'leadership', 'communication', 'project management', 'data analysis'
    ];

    for (const skill of commonSkills) {
      this.skillsBoostMap.set(skill, 1.0 + Math.random() * 0.5);
    }
  }

  private async loadLocationPreferences(): Promise<void> {
    // Load location preference data
    // Mock implementation for major cities
    const majorCities = [
      'New York', 'San Francisco', 'London', 'Boston', 'Seattle',
      'Chicago', 'Austin', 'Denver', 'Portland', 'Los Angeles'
    ];

    for (const city of majorCities) {
      this.locationBoostMap.set(city, 1.1);
    }
  }
}

export default JobRecommender;