import {
  MatchRequest,
  MatchResult,
  PaginatedResponse,
  ProfileMatchResult,
  MatchFilters,
  MatchSortOptions,
  JobRecommendation,
  CandidateRecommendation,
  MatchStats
} from '@/types/matching';
import { MatchingCoreService } from './core-service';
import { RecommendationEngine } from './recommendation-engine';
import { logger } from '@/lib/logging/logger';

export class MatchingAPIIntegration {
  private matchingService: MatchingCoreService;
  private recommendationEngine: RecommendationEngine;

  constructor() {
    this.matchingService = new MatchingCoreService();
    this.recommendationEngine = new RecommendationEngine();
  }

  /**
   * Find job recommendations for a candidate
   */
  async findJobsForCandidate(
    candidateId: string,
    options: {
      filters?: MatchFilters;
      sort?: MatchSortOptions;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<PaginatedResponse<JobRecommendation>> {
    try {
      logger.info('Finding job recommendations for candidate', { candidateId, options });

      const result = await this.matchingService.findJobsForCandidate(
        candidateId,
        options.filters,
        options.sort,
        options.limit || 10,
        options.offset || 0
      );

      // Convert ProfileMatchResult to JobRecommendation
      const recommendations: JobRecommendation[] = result.data.map(match => ({
        id: match.profile.id,
        job: {
          id: match.profile.id,
          title: match.profile.title,
          company: {
            name: match.profile.company?.name || 'Company',
            logo: match.profile.company?.logo
          },
          location: match.profile.company?.location ? {
            city: match.profile.company.location.city,
            state: match.profile.company.location.state
          } : undefined,
          salaryRange: match.profile.compensation?.salaryRange,
          requirements: match.profile.requirements ? {
            skills: match.profile.requirements.skills?.map(s => s.name) || []
          } : undefined,
          employmentType: match.profile.preferences?.workType
        },
        matchScore: match.matchScore,
        matchConfidence: match.matchConfidence,
        matchDetails: match.matchDetails,
        explanation: match.explanation,
        lastMatched: match.lastMatched
      }));

      return {
        data: recommendations,
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
        hasMore: result.hasMore
      };

    } catch (error) {
      logger.error('Error finding job recommendations', { error, candidateId });
      throw new Error(`Failed to find job recommendations: ${error.message}`);
    }
  }

  /**
   * Find candidate recommendations for a job
   */
  async findCandidatesForJob(
    jobId: string,
    options: {
      filters?: MatchFilters;
      sort?: MatchSortOptions;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<PaginatedResponse<CandidateRecommendation>> {
    try {
      logger.info('Finding candidate recommendations for job', { jobId, options });

      const result = await this.matchingService.findCandidatesForJob(
        jobId,
        options.filters,
        options.sort,
        options.limit || 10,
        options.offset || 0
      );

      // Convert ProfileMatchResult to CandidateRecommendation
      const recommendations: CandidateRecommendation[] = result.data.map(match => ({
        id: match.profile.id,
        candidate: {
          id: match.profile.id,
          name: `${match.profile.personalInfo.firstName} ${match.profile.personalInfo.lastName}`,
          title: match.profile.experience[0]?.title,
          location: match.profile.personalInfo.location ? {
            city: match.profile.personalInfo.location.city,
            state: match.profile.personalInfo.location.state
          } : undefined,
          experience: {
            years: this.calculateTotalExperience(match.profile.experience),
            level: this.getExperienceLevel(match.profile.experience)
          },
          skills: match.profile.skills.map(s => s.name),
          avatar: match.profile.personalInfo.avatar
        },
        matchScore: match.matchScore,
        matchConfidence: match.matchConfidence,
        matchDetails: match.matchDetails,
        explanation: match.explanation,
        lastMatched: match.lastMatched
      }));

      return {
        data: recommendations,
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
        hasMore: result.hasMore
      };

    } catch (error) {
      logger.error('Error finding candidate recommendations', { error, jobId });
      throw new Error(`Failed to find candidate recommendations: ${error.message}`);
    }
  }

  /**
   * Get personalized job recommendations using recommendation engine
   */
  async getPersonalizedJobRecommendations(
    candidateId: string,
    limit: number = 10
  ): Promise<JobRecommendation[]> {
    try {
      logger.info('Getting personalized job recommendations', { candidateId, limit });

      const recommendations = await this.recommendationEngine.getJobRecommendations(
        candidateId,
        limit
      );

      // Convert recommendations to JobRecommendation format
      return recommendations.map(rec => ({
        id: rec.id,
        job: {
          id: rec.targetId,
          title: rec.metadata.jobTitle || 'Job Position',
          company: {
            name: rec.metadata.companyName || 'Company'
          },
          location: rec.metadata.location,
          salaryRange: rec.metadata.salaryRange,
          requirements: rec.metadata.skills ? {
            skills: rec.metadata.skills
          } : undefined,
          employmentType: rec.metadata.workType
        },
        matchScore: rec.score,
        matchConfidence: rec.metadata.confidence || 0.8,
        matchDetails: rec.metadata.breakdown,
        explanation: rec.metadata.explanation,
        lastMatched: rec.timestamp
      }));

    } catch (error) {
      logger.error('Error getting personalized job recommendations', { error, candidateId });
      throw new Error(`Failed to get personalized recommendations: ${error.message}`);
    }
  }

  /**
   * Score a specific candidate-job match
   */
  async scoreMatch(
    candidateId: string,
    jobId: string,
    options: {
      mode?: 'keyword' | 'semantic' | 'hybrid';
    } = {}
  ): Promise<MatchResult> {
    try {
      logger.info('Scoring match', { candidateId, jobId, options });

      const request: MatchRequest = {
        candidateId,
        jobId,
        mode: options.mode || 'hybrid'
      };

      const result = await this.matchingService.scoreCandidate(candidateId, jobId, request);

      return result;

    } catch (error) {
      logger.error('Error scoring match', { error, candidateId, jobId });
      throw new Error(`Failed to score match: ${error.message}`);
    }
  }

  /**
   * Submit feedback for a match
   */
  async submitMatchFeedback(
    matchId: string,
    feedback: {
      rating: number;
      feedback?: string;
      helpful: boolean;
    }
  ): Promise<void> {
    try {
      logger.info('Submitting match feedback', { matchId, feedback });

      const response = await fetch(`/api/matching/matches/${matchId}/feedback`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedback)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      logger.info('Match feedback submitted successfully', { matchId });

    } catch (error) {
      logger.error('Error submitting match feedback', { error, matchId });
      throw new Error(`Failed to submit feedback: ${error.message}`);
    }
  }

  /**
   * Get match history for a user
   */
  async getMatchHistory(
    userId: string,
    options: {
      type?: 'given' | 'received';
      limit?: number;
      offset?: number;
      status?: string[];
    } = {}
  ): Promise<PaginatedResponse<MatchResult>> {
    try {
      logger.info('Getting match history', { userId, options });

      const params = new URLSearchParams({
        limit: (options.limit || 20).toString(),
        offset: (options.offset || 0).toString(),
        ...(options.type && { type: options.type }),
        ...(options.status && { status: options.status.join(',') })
      });

      const response = await fetch(`/api/matches/history?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to get match history');
      }

      return data.data;

    } catch (error) {
      logger.error('Error getting match history', { error, userId });
      throw new Error(`Failed to get match history: ${error.message}`);
    }
  }

  /**
   * Get matching analytics
   */
  async getMatchingAnalytics(
    filters?: {
      startDate?: Date;
      endDate?: Date;
      candidateId?: string;
      jobId?: string;
      minScore?: number;
    }
  ): Promise<MatchStats> {
    try {
      logger.info('Getting matching analytics', { filters });

      const params = new URLSearchParams();

      if (filters?.startDate) {
        params.set('startDate', filters.startDate.toISOString());
      }
      if (filters?.endDate) {
        params.set('endDate', filters.endDate.toISOString());
      }
      if (filters?.candidateId) {
        params.set('candidateId', filters.candidateId);
      }
      if (filters?.jobId) {
        params.set('jobId', filters.jobId);
      }
      if (filters?.minScore) {
        params.set('minScore', filters.minScore.toString());
      }

      const response = await fetch(`/api/matching/analytics?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to get analytics');
      }

      return data.data;

    } catch (error) {
      logger.error('Error getting matching analytics', { error });
      throw new Error(`Failed to get analytics: ${error.message}`);
    }
  }

  /**
   * Get similar jobs for a given job
   */
  async getSimilarJobs(
    jobId: string,
    limit: number = 5
  ): Promise<JobRecommendation[]> {
    try {
      logger.info('Getting similar jobs', { jobId, limit });

      const recommendations = await this.recommendationEngine.getSimilarJobs(jobId, limit);

      return recommendations.map(rec => ({
        id: rec.id,
        job: {
          id: rec.targetId,
          title: rec.metadata.jobTitle || 'Similar Position',
          company: {
            name: rec.metadata.companyName || 'Company'
          },
          location: rec.metadata.location,
          salaryRange: rec.metadata.salaryRange,
          requirements: rec.metadata.skills ? {
            skills: rec.metadata.skills
          } : undefined
        },
        matchScore: rec.score,
        matchConfidence: rec.metadata.confidence || 0.7,
        matchDetails: rec.metadata.breakdown,
        explanation: {
          strengths: [`Similar to your interests: ${rec.reason}`],
          weaknesses: [],
          recommendations: [],
          skillGaps: [],
          improvementSuggestions: []
        },
        lastMatched: rec.timestamp
      }));

    } catch (error) {
      logger.error('Error getting similar jobs', { error, jobId });
      throw new Error(`Failed to get similar jobs: ${error.message}`);
    }
  }

  /**
   * Get similar candidates for a given candidate
   */
  async getSimilarCandidates(
    candidateId: string,
    limit: number = 5
  ): Promise<CandidateRecommendation[]> {
    try {
      logger.info('Getting similar candidates', { candidateId, limit });

      const recommendations = await this.recommendationEngine.getSimilarCandidates(candidateId, limit);

      return recommendations.map(rec => ({
        id: rec.id,
        candidate: {
          id: rec.targetId,
          name: rec.metadata.candidateName || 'Candidate',
          title: rec.metadata.title,
          experience: rec.metadata.experience,
          skills: rec.metadata.skills || [],
          avatar: rec.metadata.avatar
        },
        matchScore: rec.score,
        matchConfidence: rec.metadata.confidence || 0.7,
        matchDetails: rec.metadata.breakdown,
        explanation: {
          strengths: [`Similar profile: ${rec.reason}`],
          weaknesses: [],
          recommendations: [],
          skillGaps: [],
          improvementSuggestions: []
        },
        lastMatched: rec.timestamp
      }));

    } catch (error) {
      logger.error('Error getting similar candidates', { error, candidateId });
      throw new Error(`Failed to get similar candidates: ${error.message}`);
    }
  }

  // Helper methods
  private calculateTotalExperience(experience: any[]): number {
    if (!experience || experience.length === 0) return 0;

    return experience.reduce((total, exp) => {
      const start = exp.startDate ? new Date(exp.startDate) : new Date();
      const end = exp.endDate ? new Date(exp.endDate) : new Date();
      const months = (end.getFullYear() - start.getFullYear()) * 12 +
                     (end.getMonth() - start.getMonth());
      return total + months;
    }, 0) / 12; // Convert to years
  }

  private getExperienceLevel(experience: any[]): string {
    const totalYears = this.calculateTotalExperience(experience);

    if (totalYears < 2) return 'Entry Level';
    if (totalYears < 5) return 'Junior';
    if (totalYears < 10) return 'Mid Level';
    if (totalYears < 15) return 'Senior';
    return 'Lead/Principal';
  }
}

// Export singleton instance
export const matchingAPI = new MatchingAPIIntegration();