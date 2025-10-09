/**
 * Matching System Integration Service
 * Integrates the candidate matching system with the main Next.js application
 */

import { MatchingCoreService } from '@/services/matching/core-service';
import { CacheManager } from '@/lib/cache';
import { NotificationService } from '@/lib/notifications/notification-service';
import { Logger } from '@/lib/logger';

export interface JobRecommendation {
  jobId: string;
  title: string;
  company: string;
  location: string;
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  matchScore: number;
  matchReasons: string[];
  improvementSuggestions: string[];
  postedAt: Date;
  description: string;
  requirements: string[];
  skills: string[];
}

export interface CandidateMatch {
  candidateId: string;
  name: string;
  email: string;
  currentRole?: string;
  experience: number;
  matchScore: number;
  matchBreakdown: {
    skills: number;
    experience: number;
    education: number;
    location: number;
    overall: number;
  };
  resumeUrl?: string;
  lastActive: Date;
}

export interface MatchingFilters {
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  experienceLevel?: string;
  remote?: boolean;
  skills?: string[];
  company?: string;
}

export class MatchingIntegrationService {
  private matchingService: MatchingCoreService;
  private cacheService: CacheManager;
  private notificationService: NotificationService;
  private logger: Logger;

  constructor() {
    this.matchingService = new MatchingCoreService();
    this.cacheService = new CacheManager();
    this.notificationService = new NotificationService();
    this.logger = new Logger('MatchingIntegration');
  }

  /**
   * Get personalized job recommendations for a candidate
   */
  async getJobRecommendations(
    userId: string,
    filters?: MatchingFilters,
    limit: number = 20
  ): Promise<JobRecommendation[]> {
    try {
      const cacheKey = `job_recommendations:${userId}:${JSON.stringify(filters || {})}`;

      // Try cache first
      const cached = await this.cacheService.get(cacheKey);
      if (cached.data) {
        return cached.data;
      }

      // Get user profile for matching
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      // Get matching jobs from service
      const matches = await this.matchingService.findJobsForCandidate(userId, filters, limit);

      // Format results
      const recommendations: JobRecommendation[] = matches.map(match => ({
        jobId: match.job.id,
        title: match.job.title,
        company: match.job.company.name,
        location: match.job.location,
        salary: match.job.salary,
        matchScore: match.score,
        matchReasons: match.reasons || [],
        improvementSuggestions: match.suggestions || [],
        postedAt: match.job.postedAt,
        description: match.job.description,
        requirements: match.job.requirements,
        skills: match.job.requiredSkills
      }));

      // Cache results
      await this.cacheService.set(cacheKey, recommendations, { ttl: 300 }); // 5 minutes

      return recommendations;

    } catch (error) {
      this.logger.error('Error getting job recommendations:', error);
      throw error;
    }
  }

  /**
   * Get matched candidates for a job posting
   */
  async getMatchedCandidates(
    jobId: string,
    employerId: string,
    filters?: MatchingFilters,
    limit: number = 50
  ): Promise<CandidateMatch[]> {
    try {
      const cacheKey = `matched_candidates:${jobId}:${JSON.stringify(filters || {})}`;

      // Try cache first
      const cached = await this.cacheService.get(cacheKey);
      if (cached.data) {
        return cached.data;
      }

      // Verify employer owns the job
      const job = await this.getJobWithOwnership(jobId, employerId);
      if (!job) {
        throw new Error('Job not found or access denied');
      }

    // Get matching candidates from service
      const matches = await this.matchingService.findCandidatesForJob(jobId, filters, limit);

      // Format results
      const candidates: CandidateMatch[] = matches.map(match => ({
        candidateId: match.candidate.id,
        name: `${match.candidate.firstName} ${match.candidate.lastName}`,
        email: match.candidate.email,
        currentRole: match.candidate.currentRole,
        experience: match.candidate.experience,
        matchScore: match.score,
        matchBreakdown: match.breakdown || {
          skills: 0,
          experience: 0,
          education: 0,
          location: 0,
          overall: match.score
        },
        resumeUrl: match.candidate.resumeUrl,
        lastActive: match.candidate.lastActive
      }));

      // Cache results
      await this.cacheService.set(cacheKey, candidates, { ttl: 600 }); // 10 minutes

      return candidates;

    } catch (error) {
      this.logger.error('Error getting matched candidates:', error);
      throw error;
    }
  }

  /**
   * Trigger real-time matching when user profile is updated
   */
  async triggerProfileUpdateMatching(userId: string): Promise<void> {
    try {
      this.logger.info(`Triggering profile update matching for user: ${userId}`);

      // Get user profile
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile) {
        return;
      }

      // Find new matching jobs
      const newMatches = await this.matchingService.findJobsForCandidate(userId, {}, 20);

      // Send notifications for new matches
      if (newMatches.length > 0) {
        await this.notificationService.sendNotification({
          userId,
          type: 'new_job_matches',
          title: 'New Job Matches Found',
          message: `We found ${newMatches.length} new job matches for your profile!`,
          data: {
            matchCount: newMatches.length,
            matches: newMatches.slice(0, 5) // Top 5 matches
          },
          channels: ['in_app', 'email']
        });

        // Update cache
        await this.cacheService.delete(`job_recommendations:${userId}:{}`);
      }

    } catch (error) {
      this.logger.error('Error triggering profile update matching:', error);
    }
  }

  /**
   * Batch process matching for multiple users
   */
  async batchProcessUserMatching(userIds: string[]): Promise<void> {
    const batchSize = 10;
    const batches = Math.ceil(userIds.length / batchSize);

    this.logger.info(`Starting batch matching for ${userIds.length} users in ${batches} batches`);

    for (let i = 0; i < batches; i++) {
      const batch = userIds.slice(i * batchSize, (i + 1) * batchSize);

      await Promise.allSettled(
        batch.map(userId => this.triggerProfileUpdateMatching(userId))
      );

      // Add delay between batches to avoid overwhelming the system
      if (i < batches - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    this.logger.info(`Completed batch matching for ${userIds.length} users`);
  }

  /**
   * Get match history and analytics
   */
  async getMatchingAnalytics(userId: string, timeframe: '7d' | '30d' | '90d' = '30d'): Promise<any> {
    try {
      const cacheKey = `matching_analytics:${userId}:${timeframe}`;

      // Try cache first
      const cached = await this.cacheService.get(cacheKey);
      if (cached.data) {
        return cached.data;
      }

      // TODO: Implement analytics method in MatchingCoreService
      // const analytics = await this.matchingService.getUserAnalytics(userId, timeframe);
      const analytics = {
        totalMatches: 0,
        averageScore: 0,
        recentMatches: [],
        timeframe
      };

      // Cache results
      await this.cacheService.set(cacheKey, analytics, { ttl: 3600 }); // 1 hour

      return analytics;

    } catch (error) {
      this.logger.error('Error getting matching analytics:', error);
      throw error;
    }
  }

  /**
   * Update match feedback for learning
   */
  async updateMatchFeedback(
    userId: string,
    jobId: string,
    feedback: 'positive' | 'negative' | 'neutral',
    reason?: string
  ): Promise<void> {
    try {
      // TODO: Implement feedback method in MatchingCoreService
      // await this.matchingService.updateFeedback(userId, jobId, feedback, reason);
      console.log(`Feedback received: ${userId} -> ${jobId} = ${feedback}`);

      // Invalidate user's recommendations cache
      await this.cacheService.delete(`job_recommendations:${userId}:{}`);

      this.logger.info(`Updated match feedback: ${userId} -> ${jobId} = ${feedback}`);

    } catch (error) {
      this.logger.error('Error updating match feedback:', error);
      throw error;
    }
  }

  // Helper methods
  private async getUserProfile(userId: string): Promise<any> {
    // This would integrate with your user service
    // For now, return a mock implementation
    return {
      id: userId,
      skills: [],
      experience: 0,
      location: '',
      preferences: {}
    };
  }

  private async getJobWithOwnership(jobId: string, employerId: string): Promise<any> {
    // This would verify employer owns the job
    // For now, return a mock implementation
    return {
      id: jobId,
      title: 'Job Title',
      description: 'Job Description',
      requirements: [],
      requiredSkills: []
    };
  }
}