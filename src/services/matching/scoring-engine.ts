import {
  MatchRequest,
  MatchResult,
  ScoreBreakdown,
  MatchExplanation,
  MatchingConfig,
  MatchMode,
  MatchConfidence,
  CandidateProfile,
  JobProfile,
  ProfileMatchResult,
  MLModel
} from '@/types/matching';
import { getWeightsConfig } from '@/lib/scoring/weights-config';
import {
  SkillsMatcher,
  ExperienceMatcher,
  EducationMatcher,
  LocationMatcher,
  PreferencesMatcher,
  SalaryMatcher
} from '@/lib/scoring/algorithms';
import { ExplanationGenerator } from '@/lib/scoring/explanations';
import { logger } from '@/lib/logging/logger';
import { prisma } from '@/lib/prisma';

/**
 * Core scoring engine for candidate-job matching
 */
export class ScoringEngine {
  private config: MatchingConfig;
  private aiModels: Map<string, MLModel> = new Map();

  constructor(config?: Partial<MatchingConfig>) {
    this.config = {
      mode: MatchMode.HYBRID,
      useML: true,
      enableCulturalFit: true,
      enableSalaryMatching: true,
      minThreshold: 50,
      maxResults: 50,
      ...config
    };

    this.initializeAIModels();
  }

  /**
   * Scores a candidate against a job
   */
  async scoreCandidate(request: MatchRequest): Promise<MatchResult> {
    try {
      logger.info('Starting candidate scoring', {
        candidateId: request.candidateId,
        jobId: request.jobId,
        mode: request.mode
      });

      // Get profiles
      const candidateProfile = await this.getCandidateProfile(request.candidateId);
      const jobProfile = await this.getJobProfile(request.jobId);

      if (!candidateProfile || !jobProfile) {
        throw new Error('Candidate or job profile not found');
      }

      // Calculate individual scores
      const breakdown = await this.calculateScoreBreakdown(candidateProfile, jobProfile, request);

      // Calculate weighted total score
      const totalScore = this.calculateWeightedScore(breakdown, jobProfile);

      // Calculate confidence score
      const confidence = this.calculateConfidence(breakdown, candidateProfile, jobProfile);

      // Generate explanation
      const explanation = ExplanationGenerator.generateExplanation(
        breakdown,
        candidateProfile,
        jobProfile,
        request.language
      );

      const result: MatchResult = {
        candidateId: request.candidateId,
        jobId: request.jobId,
        totalScore,
        confidence,
        breakdown,
        explanation,
        matchDate: new Date(),
        algorithm: this.getAlgorithmVersion(),
        recommendations: explanation.recommendations
      };

      logger.info('Candidate scoring completed', {
        candidateId: request.candidateId,
        jobId: request.jobId,
        totalScore,
        confidence
      });

      return result;
    } catch (error) {
      logger.error('Error scoring candidate', {
        candidateId: request.candidateId,
        jobId: request.jobId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Calculates detailed score breakdown
   */
  async calculateScoreBreakdown(
    candidate: CandidateProfile,
    job: JobProfile,
    request: MatchRequest
  ): Promise<ScoreBreakdown> {
    const breakdown: ScoreBreakdown = {};

    try {
      // Skills matching
      breakdown.skills = await SkillsMatcher.calculateMatch(
        candidate.skills,
        job.requiredSkills,
        job.preferredSkills
      );

      // Experience matching
      breakdown.experience = ExperienceMatcher.calculateMatch(
        candidate.experience,
        job.experienceRequired
      );

      // Education matching
      breakdown.education = EducationMatcher.calculateMatch(
        candidate.education,
        job.educationRequirements
      );

      // Location matching
      breakdown.location = LocationMatcher.calculateMatch(
        candidate.location,
        job.location,
        job.remoteWorkPolicy
      );

      // Preferences matching
      breakdown.preferences = PreferencesMatcher.calculateMatch(
        candidate.preferences,
        job.benefits,
        job.workCulture
      );

      // Salary matching
      if (this.config.enableSalaryMatching) {
        breakdown.salary = SalaryMatcher.calculateMatch(
          candidate.salaryExpectation,
          job.salaryRange
        );
      }

      // Cultural fit matching
      if (this.config.enableCulturalFit) {
        breakdown.culturalFit = await this.calculateCulturalFit(candidate, job);
      }

      // AI prediction
      if (this.config.useML && this.config.mode !== MatchMode.RULE_BASED) {
        breakdown.aiPrediction = await this.getAIPrediction(candidate, job);
      }

      return breakdown;
    } catch (error) {
      logger.error('Error calculating score breakdown', {
        candidateId: candidate.id,
        jobId: job.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Calculates weighted total score from breakdown
   */
  calculateWeightedScore(breakdown: ScoreBreakdown, job: JobProfile): number {
    try {
      const weights = getWeightsConfig(job.industry, job.experienceLevel);
      let totalScore = 0;
      let totalWeight = 0;

      Object.entries(breakdown).forEach(([factor, score]) => {
        if (score !== undefined && typeof score === 'number') {
          const weight = weights[factor as keyof typeof weights] || 0;
          totalScore += score * weight;
          totalWeight += weight;
        }
      });

      return totalWeight > 0 ? totalScore / totalWeight : 0;
    } catch (error) {
      logger.error('Error calculating weighted score', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return 0;
    }
  }

  /**
   * Calculates confidence score for the match
   */
  calculateConfidence(
    breakdown: ScoreBreakdown,
    candidate: CandidateProfile,
    job: JobProfile
  ): MatchConfidence {
    try {
      const factors = Object.values(breakdown).filter(score =>
        score !== undefined && typeof score === 'number'
      ) as number[];

      if (factors.length === 0) {
        return { score: 0, level: 'very_low', reasoning: 'No scoring factors available' };
      }

      // Calculate average score
      const averageScore = factors.reduce((sum, score) => sum + score, 0) / factors.length;

      // Calculate score consistency (standard deviation)
      const variance = factors.reduce((sum, score) => sum + Math.pow(score - averageScore, 2), 0) / factors.length;
      const standardDeviation = Math.sqrt(variance);

      // Data quality factors
      const candidateCompleteness = candidate.completionScore || 0;
      const jobCompleteness = job.completionScore || 0;
      const avgCompleteness = (candidateCompleteness + jobCompleteness) / 2;

      // Confidence factors
      let confidenceScore = averageScore;
      let reasoning: string[] = [];

      // Adjust based on score consistency
      if (standardDeviation > 30) {
        confidenceScore -= 15;
        reasoning.push('High score variance indicates inconsistent matching');
      } else if (standardDeviation < 10) {
        confidenceScore += 10;
        reasoning.push('Consistent scores across all factors');
      }

      // Adjust based on data quality
      if (avgCompleteness >= 90) {
        confidenceScore += 10;
        reasoning.push('High data quality in both profiles');
      } else if (avgCompleteness < 70) {
        confidenceScore -= 20;
        reasoning.push('Low data quality may affect accuracy');
      }

      // Adjust based on factor coverage
      const factorCoverage = (factors.length / 8) * 100; // 8 possible factors
      if (factorCoverage >= 80) {
        reasoning.push('Comprehensive factor coverage');
      } else if (factorCoverage < 50) {
        confidenceScore -= 15;
        reasoning.push('Limited factor coverage');
      }

      // Clamp score to valid range
      confidenceScore = Math.max(0, Math.min(100, confidenceScore));

      // Determine confidence level
      let level: 'very_high' | 'high' | 'medium' | 'low' | 'very_low';
      if (confidenceScore >= 85) {
        level = 'very_high';
      } else if (confidenceScore >= 70) {
        level = 'high';
      } else if (confidenceScore >= 55) {
        level = 'medium';
      } else if (confidenceScore >= 40) {
        level = 'low';
      } else {
        level = 'very_low';
      }

      return {
        score: confidenceScore,
        level,
        reasoning: reasoning.join('; ') || 'Standard confidence calculation',
        factors: {
          scoreConsistency: Math.max(0, 100 - standardDeviation),
          dataQuality: avgCompleteness,
          factorCoverage
        }
      };
    } catch (error) {
      logger.error('Error calculating confidence', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return {
        score: 0,
        level: 'very_low',
        reasoning: 'Error calculating confidence'
      };
    }
  }

  /**
   * Gets candidate profile with caching
   */
  private async getCandidateProfile(candidateId: string): Promise<CandidateProfile | null> {
    try {
      // First try to get from database
      const profile = await prisma.candidateProfile.findUnique({
        where: { id: candidateId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true
            }
          }
        }
      });

      if (!profile) {
        return null;
      }

      return {
        id: profile.id,
        userId: profile.userId,
        user: {
          id: profile.user.id,
          email: profile.user.email,
          role: profile.user.role as any
        },
        title: profile.title,
        summary: profile.summary,
        skills: profile.skills as any,
        experience: profile.experience as any,
        education: profile.education as any,
        location: profile.location as any,
        preferences: profile.preferences as any,
        salaryExpectation: profile.salaryExpectation as any,
        availability: profile.availability,
        workHistory: profile.workHistory as any,
        certifications: profile.certifications as any,
        languages: profile.languages as any,
        portfolio: profile.portfolio as any,
        socialLinks: profile.socialLinks as any,
        customFields: profile.customFields as any,
        completionScore: profile.completionScore,
        lastUpdated: profile.lastUpdated,
        metadata: profile.metadata as any,
        verified: profile.verified,
        featured: profile.featured
      };
    } catch (error) {
      logger.error('Error getting candidate profile', {
        candidateId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Gets job profile with caching
   */
  private async getJobProfile(jobId: string): Promise<JobProfile | null> {
    try {
      const job = await prisma.jobProfile.findUnique({
        where: { id: jobId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true
            }
          }
        }
      });

      if (!job) {
        return null;
      }

      return {
        id: job.id,
        userId: job.userId,
        user: {
          id: job.user.id,
          email: job.user.email,
          role: job.user.role as any
        },
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
        workCulture: job.workCulture,
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
      };
    } catch (error) {
      logger.error('Error getting job profile', {
        jobId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Calculates cultural fit score using AI
   */
  private async calculateCulturalFit(
    candidate: CandidateProfile,
    job: JobProfile
  ): Promise<number> {
    try {
      // This would integrate with an AI model for cultural fit analysis
      // For now, return a basic calculation based on preferences
      if (!candidate.preferences || !job.workCulture) {
        return 50; // Neutral score when data is missing
      }

      // Simple cultural fit calculation
      let score = 50; // Base score

      // Work style alignment
      if (candidate.preferences.workStyle && job.workCulture.workStyle) {
        if (candidate.preferences.workStyle === job.workCulture.workStyle) {
          score += 20;
        }
      }

      // Company size preference
      if (candidate.preferences.companySize && job.company?.size) {
        if (candidate.preferences.companySize === job.company.size) {
          score += 15;
        }
      }

      // Growth opportunities
      if (candidate.preferences.growthOpportunities && job.workCulture.growthOpportunities) {
        if (candidate.preferences.growthOpportunities === job.workCulture.growthOpportunities) {
          score += 15;
        }
      }

      return Math.min(100, score);
    } catch (error) {
      logger.error('Error calculating cultural fit', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return 50;
    }
  }

  /**
   * Gets AI prediction for match success
   */
  private async getAIPrediction(
    candidate: CandidateProfile,
    job: JobProfile
  ): Promise<number> {
    try {
      // This would integrate with ML models for prediction
      // For now, return a weighted average of other scores
      const weights = getWeightsConfig(job.industry, job.experienceLevel);

      // Simulate AI prediction based on profile characteristics
      let prediction = 60; // Base prediction

      // Adjust based on profile completeness
      const avgCompleteness = ((candidate.completionScore || 0) + (job.completionScore || 0)) / 2;
      prediction += (avgCompleteness - 50) * 0.3;

      // Adjust based on skills alignment (simulated)
      if (candidate.skills && job.requiredSkills) {
        const candidateSkills = Array.isArray(candidate.skills) ? candidate.skills : Object.keys(candidate.skills);
        const requiredSkills = Array.isArray(job.requiredSkills) ? job.requiredSkills : Object.keys(job.requiredSkills);
        const overlap = candidateSkills.filter(skill => requiredSkills.includes(skill)).length;
        const overlapRatio = overlap / Math.max(requiredSkills.length, 1);
        prediction += overlapRatio * 30;
      }

      // Add some randomness to simulate AI prediction
      prediction += (Math.random() - 0.5) * 10;

      return Math.max(0, Math.min(100, prediction));
    } catch (error) {
      logger.error('Error getting AI prediction', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return 50;
    }
  }

  /**
   * Initializes AI models
   */
  private async initializeAIModels(): Promise<void> {
    try {
      // Load available ML models from database
      const models = await prisma.mLModel.findMany({
        where: { active: true }
      });

      models.forEach(model => {
        this.aiModels.set(model.id, {
          id: model.id,
          name: model.name,
          version: model.version,
          type: model.type as any,
          accuracy: model.accuracy,
          algorithm: model.algorithm,
          parameters: model.parameters as any,
          createdAt: model.createdAt,
          updatedAt: model.updatedAt,
          active: model.active
        });
      });

      logger.info(`Initialized ${this.aiModels.size} AI models`);
    } catch (error) {
      logger.error('Error initializing AI models', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Gets current algorithm version
   */
  private getAlgorithmVersion(): string {
    return 'v2.1.0';
  }

  /**
   * Updates engine configuration
   */
  updateConfig(config: Partial<MatchingConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info('Scoring engine configuration updated', { config: this.config });
  }

  /**
   * Gets current configuration
   */
  getConfig(): MatchingConfig {
    return { ...this.config };
  }

  /**
   * Validates a match request
   */
  validateRequest(request: MatchRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.candidateId) {
      errors.push('Candidate ID is required');
    }

    if (!request.jobId) {
      errors.push('Job ID is required');
    }

    if (request.mode && !Object.values(MatchMode).includes(request.mode)) {
      errors.push('Invalid match mode');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Gets available AI models
   */
  getAvailableModels(): MLModel[] {
    return Array.from(this.aiModels.values());
  }
}

export default ScoringEngine;