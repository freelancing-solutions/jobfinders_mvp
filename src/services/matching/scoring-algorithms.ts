import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';
import {
  CandidateScoreBreakdown,
  JobScoreBreakdown,
  MatchCandidate,
  MatchJob,
  ScoringWeights,
  MatchingAlgorithm,
  MatchContext
} from '@/types/matching';

export class ScoringAlgorithms {
  private prisma: PrismaClient;
  private defaultWeights: ScoringWeights = {
    skills: 0.35,
    experience: 0.20,
    location: 0.15,
    education: 0.10,
    availability: 0.10,
    activity: 0.05,
    compensation: 0.05
  };

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Advanced candidate scoring using multiple algorithms
   */
  async scoreCandidate(candidate: any, job: any, context: MatchContext): Promise<CandidateScoreBreakdown> {
    const algorithm = context.algorithm || MatchingAlgorithm.COMPREHENSIVE;

    switch (algorithm) {
      case MatchingAlgorithm.COMPREHENSIVE:
        return await this.comprehensiveCandidateScoring(candidate, job, context);
      case MatchingAlgorithm.WEIGHTED:
        return await this.weightedCandidateScoring(candidate, job, context);
      case MatchingAlgorithm.ML_ENHANCED:
        return await this.mlEnhancedCandidateScoring(candidate, job, context);
      case MatchingAlgorithm.COLLABORATIVE:
        return await this.collaborativeCandidateScoring(candidate, job, context);
      case MatchingAlgorithm.CONTENT_BASED:
        return await this.contentBasedCandidateScoring(candidate, job, context);
      default:
        return await this.comprehensiveCandidateScoring(candidate, job, context);
    }
  }

  /**
   * Advanced job scoring using multiple algorithms
   */
  async scoreJob(job: any, candidate: any, context: MatchContext): Promise<JobScoreBreakdown> {
    const algorithm = context.algorithm || MatchingAlgorithm.COMPREHENSIVE;

    switch (algorithm) {
      case MatchingAlgorithm.COMPREHENSIVE:
        return await this.comprehensiveJobScoring(job, candidate, context);
      case MatchingAlgorithm.WEIGHTED:
        return await this.weightedJobScoring(job, candidate, context);
      case MatchingAlgorithm.ML_ENHANCED:
        return await this.mlEnhancedJobScoring(job, candidate, context);
      case MatchingAlgorithm.COLLABORATIVE:
        return await this.collaborativeJobScoring(job, candidate, context);
      case MatchingAlgorithm.CONTENT_BASED:
        return await this.contentBasedJobScoring(job, candidate, context);
      default:
        return await this.comprehensiveJobScoring(job, candidate, context);
    }
  }

  /**
   * Comprehensive scoring algorithm with multiple factors
   */
  private async comprehensiveCandidateScoring(
    candidate: any,
    job: any,
    context: MatchContext
  ): Promise<CandidateScoreBreakdown> {
    const weights = context.weights || this.defaultWeights;
    const breakdown: CandidateScoreBreakdown = {
      overallScore: 0,
      skillsMatch: 0,
      experienceMatch: 0,
      locationMatch: 0,
      educationMatch: 0,
      availabilityMatch: 0,
      recentActivity: 0
    };

    // Enhanced skills matching
    breakdown.skillsMatch = await this.calculateAdvancedSkillsMatch(candidate, job, weights.skills);

    // Experience matching with level and years consideration
    breakdown.experienceMatch = await this.calculateExperienceMatch(candidate, job, weights.experience);

    // Location matching with remote/hybrid preferences
    breakdown.locationMatch = await this.calculateLocationMatch(candidate, job, weights.location);

    // Education matching with degree relevance
    breakdown.educationMatch = await this.calculateEducationMatch(candidate, job, weights.education);

    // Availability matching with response time
    breakdown.availabilityMatch = await this.calculateAvailabilityMatch(candidate, job, weights.availability);

    // Recent activity and engagement
    breakdown.recentActivity = await this.calculateActivityScore(candidate, weights.activity);

    // Calculate overall score
    breakdown.overallScore = Math.min(100,
      breakdown.skillsMatch +
      breakdown.experienceMatch +
      breakdown.locationMatch +
      breakdown.educationMatch +
      breakdown.availabilityMatch +
      breakdown.recentActivity
    );

    return breakdown;
  }

  /**
   * Weighted scoring algorithm with customizable weights
   */
  private async weightedCandidateScoring(
    candidate: any,
    job: any,
    context: MatchContext
  ): Promise<CandidateScoreBreakdown> {
    const weights = context.weights || this.defaultWeights;
    const breakdown: CandidateScoreBreakdown = {
      overallScore: 0,
      skillsMatch: 0,
      experienceMatch: 0,
      locationMatch: 0,
      educationMatch: 0,
      availabilityMatch: 0,
      recentActivity: 0
    };

    // Calculate weighted scores
    breakdown.skillsMatch = this.calculateBasicSkillsMatch(candidate, job) * 100 * weights.skills;
    breakdown.experienceMatch = this.calculateBasicExperienceMatch(candidate, job) * 100 * weights.experience;
    breakdown.locationMatch = this.calculateBasicLocationMatch(candidate, job) * 100 * weights.location;
    breakdown.educationMatch = this.calculateBasicEducationMatch(candidate, job) * 100 * weights.education;
    breakdown.availabilityMatch = this.calculateBasicAvailabilityMatch(candidate, job) * 100 * weights.availability;
    breakdown.recentActivity = this.calculateBasicActivityScore(candidate) * 100 * weights.activity;

    // Apply employer preferences if available
    if (context.employerPreferences) {
      await this.applyEmployerPreferences(breakdown, candidate, context.employerPreferences);
    }

    breakdown.overallScore = Math.min(100,
      breakdown.skillsMatch +
      breakdown.experienceMatch +
      breakdown.locationMatch +
      breakdown.educationMatch +
      breakdown.availabilityMatch +
      breakdown.recentActivity
    );

    return breakdown;
  }

  /**
   * ML-enhanced scoring with learned patterns
   */
  private async mlEnhancedCandidateScoring(
    candidate: any,
    job: any,
    context: MatchContext
  ): Promise<CandidateScoreBreakdown> {
    // Start with comprehensive scoring
    const baseBreakdown = await this.comprehensiveCandidateScoring(candidate, job, context);

    try {
      // Apply ML model adjustments
      const mlAdjustments = await this.applyMLScoring(candidate, job, context);

      // Adjust scores based on ML predictions
      baseBreakdown.skillsMatch *= mlAdjustments.skillsMultiplier;
      baseBreakdown.experienceMatch *= mlAdjustments.experienceMultiplier;
      baseBreakdown.locationMatch *= mlAdjustments.locationMultiplier;
      baseBreakdown.educationMatch *= mlAdjustments.educationMultiplier;

      // Add ML-predicted success probability
      baseBreakdown.overallScore = (baseBreakdown.overallScore * 0.7) + (mlAdjustments.successProbability * 30);

      return baseBreakdown;

    } catch (error) {
      logger.module('scoring-algorithms').warn('ML scoring failed, falling back to comprehensive', {
        candidateId: candidate.id,
        jobId: job.id,
        error: error.message
      });
      return baseBreakdown;
    }
  }

  /**
   * Collaborative filtering based on similar candidates/employers
   */
  private async collaborativeCandidateScoring(
    candidate: any,
    job: any,
    context: MatchContext
  ): Promise<CandidateScoreBreakdown> {
    const baseBreakdown = await this.comprehensiveCandidateScoring(candidate, job, context);

    try {
      // Find similar candidates who applied to similar jobs
      const similarCandidates = await this.findSimilarCandidates(candidate, job);
      const collaborativeScore = await this.calculateCollaborativeScore(candidate, job, similarCandidates);

      // Boost score based on collaborative patterns
      baseBreakdown.overallScore = (baseBreakdown.overallScore * 0.8) + (collaborativeScore * 20);

      return baseBreakdown;

    } catch (error) {
      logger.module('scoring-algorithms').warn('Collaborative scoring failed, falling back to comprehensive', {
        candidateId: candidate.id,
        jobId: job.id,
        error: error.message
      });
      return baseBreakdown;
    }
  }

  /**
   * Content-based scoring focusing on profile-job alignment
   */
  private async contentBasedCandidateScoring(
    candidate: any,
    job: any,
    context: MatchContext
  ): Promise<CandidateScoreBreakdown> {
    const breakdown: CandidateScoreBreakdown = {
      overallScore: 0,
      skillsMatch: 0,
      experienceMatch: 0,
      locationMatch: 0,
      educationMatch: 0,
      availabilityMatch: 0,
      recentActivity: 0
    };

    // Enhanced content analysis
    const skillsAlignment = await this.analyzeSkillsAlignment(candidate, job);
    const experienceAlignment = await this.analyzeExperienceAlignment(candidate, job);
    const contentAlignment = await this.analyzeContentAlignment(candidate, job);

    breakdown.skillsMatch = skillsAlignment * 40;
    breakdown.experienceMatch = experienceAlignment * 25;
    breakdown.locationMatch = this.calculateBasicLocationMatch(candidate, job) * 100 * 0.15;
    breakdown.educationMatch = this.calculateBasicEducationMatch(candidate, job) * 100 * 0.10;
    breakdown.availabilityMatch = this.calculateBasicAvailabilityMatch(candidate, job) * 100 * 0.05;
    breakdown.recentActivity = this.calculateBasicActivityScore(candidate) * 100 * 0.05;

    // Content alignment bonus
    breakdown.overallScore = Math.min(100,
      breakdown.skillsMatch +
      breakdown.experienceMatch +
      breakdown.locationMatch +
      breakdown.educationMatch +
      breakdown.availabilityMatch +
      breakdown.recentActivity +
      (contentAlignment * 10)
    );

    return breakdown;
  }

  /**
   * Advanced skills matching with semantic analysis
   */
  private async calculateAdvancedSkillsMatch(candidate: any, job: any, weight: number): Promise<number> {
    const candidateSkills = candidate.skills?.map((s: any) => s.skill.name.toLowerCase()) || [];
    const requiredSkills = job.requiredSkills?.map((s: any) => s.name.toLowerCase()) || [];
    const preferredSkills = job.preferredSkills?.map((s: any) => s.name.toLowerCase()) || [];

    if (requiredSkills.length === 0 && preferredSkills.length === 0) {
      return 35 * weight; // Default score when no skills specified
    }

    // Exact matches
    const exactRequiredMatches = requiredSkills.filter(skill =>
      candidateSkills.includes(skill)
    ).length;

    // Semantic matches (related skills)
    const semanticMatches = await this.findSemanticSkillMatches(candidateSkills, [...requiredSkills, ...preferredSkills]);

    // Skill proficiency weighting
    const proficiencyBonus = await this.calculateSkillProficiencyBonus(candidate, requiredSkills);

    const requiredScore = requiredSkills.length > 0
      ? (exactRequiredMatches / requiredSkills.length) * 25 * weight
      : 15 * weight;

    const preferredScore = preferredSkills.length > 0
      ? (semanticMatches / preferredSkills.length) * 10 * weight
      : 10 * weight;

    return requiredScore + preferredScore + proficiencyBonus;
  }

  /**
   * Experience matching with level and years consideration
   */
  private async calculateExperienceMatch(candidate: any, job: any, weight: number): Promise<number> {
    let score = 0;
    const maxScore = 20 * weight;

    // Experience level matching
    if (job.experienceLevel === candidate.experienceLevel) {
      score += 15 * weight;
    } else {
      const experienceLevels = ['entry', 'mid', 'senior', 'executive'];
      const jobLevel = experienceLevels.indexOf(job.experienceLevel);
      const candidateLevel = experienceLevels.indexOf(candidate.experienceLevel);
      const levelDiff = Math.abs(jobLevel - candidateLevel);

      score += Math.max(0, (15 - (levelDiff * 3)) * weight);
    }

    // Years of experience matching
    const candidateYears = candidate.yearsExperience || 0;
    const minYears = this.extractMinYearsFromDescription(job.description);
    const idealYears = this.extractIdealYearsFromDescription(job.description);

    if (candidateYears >= minYears) {
      if (idealYears && Math.abs(candidateYears - idealYears) <= 2) {
        score += 5 * weight; // Ideal range
      } else if (candidateYears > idealYears + 5) {
        score += 2 * weight; // Overqualified but acceptable
      } else {
        score += 3 * weight; // Meets minimum
      }
    }

    return Math.min(maxScore, score);
  }

  /**
   * Location matching with remote/hybrid preferences
   */
  private async calculateLocationMatch(candidate: any, job: any, weight: number): Promise<number> {
    let score = 0;
    const maxScore = 15 * weight;

    if (job.remote && candidate.remote) {
      score = maxScore; // Perfect remote match
    } else if (!job.remote && candidate.location?.toLowerCase().includes(job.location?.toLowerCase() || '')) {
      score = maxScore; // Perfect location match
    } else if (job.remote && candidate.willingToRelocate) {
      score = maxScore * 0.8; // Good remote match with relocation
    } else if (candidate.location?.toLowerCase().includes(job.location?.toLowerCase() || '')) {
      score = maxScore * 0.9; // Location match with some flexibility
    } else if (job.remote) {
      score = maxScore * 0.6; // Remote possible
    } else {
      // Calculate distance-based score (would need geolocation data)
      score = maxScore * 0.2;
    }

    return score;
  }

  /**
   * Education matching with degree relevance
   */
  private async calculateEducationMatch(candidate: any, job: any, weight: number): Promise<number> {
    let score = 0;
    const maxScore = 10 * weight;

    if (!candidate.resume?.education?.length) {
      return 0;
    }

    const requiredEducation = job.requiredEducation?.toLowerCase() || '';
    const preferredEducation = job.preferredEducation?.toLowerCase() || '';

    for (const education of candidate.resume.education) {
      const degree = education.degree?.toLowerCase() || '';
      const field = education.field?.toLowerCase() || '';

      // Required education matching
      if (requiredEducation && (degree.includes(requiredEducation) || field.includes(requiredEducation))) {
        score += 8 * weight;
      }

      // Preferred education matching
      if (preferredEducation && (degree.includes(preferredEducation) || field.includes(preferredEducation))) {
        score += 5 * weight;
      }

      // General education level scoring
      if (degree.includes('phd') || degree.includes('doctorate')) {
        score += 10 * weight;
      } else if (degree.includes('master') || degree.includes('mba')) {
        score += 8 * weight;
      } else if (degree.includes('bachelor') || degree.includes('b.s.') || degree.includes('b.a.')) {
        score += 6 * weight;
      } else if (degree.includes('associate')) {
        score += 4 * weight;
      }
    }

    return Math.min(maxScore, score);
  }

  /**
   * Availability matching with response time
   */
  private async calculateAvailabilityMatch(candidate: any, job: any, weight: number): Promise<number> {
    let score = 0;
    const maxScore = 10 * weight;

    // Active status
    if (candidate.isActive) {
      score += 6 * weight;
    }

    // Recent activity indicates availability
    const lastActive = candidate.lastLoginAt || candidate.createdAt;
    const daysSinceActive = (Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceActive <= 7) {
      score += 4 * weight;
    } else if (daysSinceActive <= 30) {
      score += 2 * weight;
    } else if (daysSinceActive <= 90) {
      score += 1 * weight;
    }

    return Math.min(maxScore, score);
  }

  /**
   * Recent activity and engagement scoring
   */
  private async calculateActivityScore(candidate: any, weight: number): Promise<number> {
    let score = 0;
    const maxScore = 5 * weight;

    // Profile completeness
    if (candidate.profileComplete) {
      score += 2 * weight;
    }

    // Recent login
    const lastLogin = candidate.lastLoginAt;
    if (lastLogin) {
      const daysSinceLogin = (Date.now() - new Date(lastLogin).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLogin <= 1) {
        score += 3 * weight;
      } else if (daysSinceLogin <= 7) {
        score += 2 * weight;
      } else if (daysSinceLogin <= 30) {
        score += 1 * weight;
      }
    }

    return Math.min(maxScore, score);
  }

  // Helper methods for basic scoring
  private calculateBasicSkillsMatch(candidate: any, job: any): number {
    const candidateSkills = candidate.skills?.map((s: any) => s.skill.name.toLowerCase()) || [];
    const requiredSkills = job.requiredSkills?.map((s: any) => s.name.toLowerCase()) || [];

    if (requiredSkills.length === 0) return 0.8;

    const matches = requiredSkills.filter(skill =>
      candidateSkills.some(candidateSkill =>
        candidateSkill.includes(skill) || skill.includes(candidateSkill)
      )
    ).length;

    return matches / requiredSkills.length;
  }

  private calculateBasicExperienceMatch(candidate: any, job: any): number {
    if (job.experienceLevel === candidate.experienceLevel) return 1.0;

    const experienceLevels = ['entry', 'mid', 'senior', 'executive'];
    const jobLevel = experienceLevels.indexOf(job.experienceLevel);
    const candidateLevel = experienceLevels.indexOf(candidate.experienceLevel);
    const levelDiff = Math.abs(jobLevel - candidateLevel);

    return Math.max(0, 1.0 - (levelDiff * 0.25));
  }

  private calculateBasicLocationMatch(candidate: any, job: any): number {
    if (job.remote && candidate.remote) return 1.0;
    if (candidate.location?.toLowerCase().includes(job.location?.toLowerCase() || '')) return 1.0;
    if (job.remote && candidate.willingToRelocate) return 0.8;
    return 0.2;
  }

  private calculateBasicEducationMatch(candidate: any, job: any): number {
    if (!candidate.resume?.education?.length) return 0.3;

    const hasDegree = candidate.resume.education.some((edu: any) =>
      edu.degree?.toLowerCase().includes('bachelor') ||
      edu.degree?.toLowerCase().includes('master') ||
      edu.degree?.toLowerCase().includes('phd')
    );

    return hasDegree ? 0.8 : 0.5;
  }

  private calculateBasicAvailabilityMatch(candidate: any, job: any): number {
    return candidate.isActive ? 1.0 : 0.2;
  }

  private calculateBasicActivityScore(candidate: any): number {
    const lastActive = candidate.lastLoginAt || candidate.createdAt;
    const daysSinceActive = (Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceActive <= 7) return 1.0;
    if (daysSinceActive <= 30) return 0.7;
    if (daysSinceActive <= 90) return 0.4;
    return 0.1;
  }

  // Advanced helper methods
  private async findSemanticSkillMatches(candidateSkills: string[], jobSkills: string[]): Promise<number> {
    // This would integrate with a semantic similarity API
    // For now, return basic partial matches
    let matches = 0;
    for (const jobSkill of jobSkills) {
      for (const candidateSkill of candidateSkills) {
        if (candidateSkill.includes(jobSkill) || jobSkill.includes(candidateSkill)) {
          matches++;
          break;
        }
      }
    }
    return matches;
  }

  private async calculateSkillProficiencyBonus(candidate: any, requiredSkills: string[]): Promise<number> {
    // This would analyze skill proficiency levels from resume
    // For now, return a small bonus
    return requiredSkills.length > 0 ? 2 : 0;
  }

  private extractMinYearsFromDescription(description: string): number {
    const match = description.match(/(\d+)\+?\s*years?/i);
    return match ? parseInt(match[1]) : 0;
  }

  private extractIdealYearsFromDescription(description: string): number | null {
    const match = description.match(/(\d+)-(\d+)\s*years?/i);
    return match ? Math.floor((parseInt(match[1]) + parseInt(match[2])) / 2) : null;
  }

  private async applyEmployerPreferences(breakdown: CandidateScoreBreakdown, candidate: any, preferences: any): Promise<void> {
    // Apply employer-specific preferences to boost scores
    if (preferences.preferredSkills?.length) {
      const preferredMatches = candidate.skills?.filter((s: any) =>
        preferences.preferredSkills.includes(s.skill.name)
      ).length || 0;

      breakdown.skillsMatch += preferredMatches * 2;
    }
  }

  private async applyMLScoring(candidate: any, job: any, context: MatchContext): Promise<any> {
    // This would integrate with a trained ML model
    // For now, return mock adjustments
    return {
      skillsMultiplier: 1.1,
      experienceMultiplier: 1.05,
      locationMultiplier: 1.0,
      educationMultiplier: 1.02,
      successProbability: 0.75
    };
  }

  private async findSimilarCandidates(candidate: any, job: any): Promise<any[]> {
    // Find candidates with similar profiles who applied to similar jobs
    return [];
  }

  private async calculateCollaborativeScore(candidate: any, job: any, similarCandidates: any[]): Promise<number> {
    // Calculate score based on collaborative filtering patterns
    return 0.8;
  }

  private async analyzeSkillsAlignment(candidate: any, job: any): Promise<number> {
    // Deep analysis of skills alignment beyond simple matching
    return this.calculateBasicSkillsMatch(candidate, job);
  }

  private async analyzeExperienceAlignment(candidate: any, job: any): Promise<number> {
    // Analyze experience relevance and trajectory
    return this.calculateBasicExperienceMatch(candidate, job);
  }

  private async analyzeContentAlignment(candidate: any, job: any): Promise<number> {
    // Analyze content alignment between resume and job description
    return 0.7;
  }

  // Job scoring methods (similar to candidate scoring but reversed)
  private async comprehensiveJobScoring(job: any, candidate: any, context: MatchContext): Promise<JobScoreBreakdown> {
    const candidateScore = await this.comprehensiveCandidateScoring(candidate, job, context);

    return {
      overallScore: candidateScore.overallScore,
      requirementsMatch: candidateScore.skillsMatch,
      candidateFit: candidateScore.experienceMatch,
      compensationFit: 80, // Would calculate based on salary expectations
      cultureFit: 75, // Would calculate based on company culture analysis
      growthPotential: 70, // Would calculate based on career progression
      marketDemand: 85 // Would calculate based on job market data
    };
  }

  private async weightedJobScoring(job: any, candidate: any, context: MatchContext): Promise<JobScoreBreakdown> {
    return this.comprehensiveJobScoring(job, candidate, context);
  }

  private async mlEnhancedJobScoring(job: any, candidate: any, context: MatchContext): Promise<JobScoreBreakdown> {
    return this.comprehensiveJobScoring(job, candidate, context);
  }

  private async collaborativeJobScoring(job: any, candidate: any, context: MatchContext): Promise<JobScoreBreakdown> {
    return this.comprehensiveJobScoring(job, candidate, context);
  }

  private async contentBasedJobScoring(job: any, candidate: any, context: MatchContext): Promise<JobScoreBreakdown> {
    return this.comprehensiveJobScoring(job, candidate, context);
  }
}