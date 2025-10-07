// Matching System Integration Layer
// Integration service for the candidate matching system

import { PrismaClient } from '@prisma/client';
import { eventBus, EventType, EventPriority } from '../../lib/events';
import { logger } from '../../lib/logger';
import {
  MatchRequest,
  MatchResult,
  MatchFilters,
  PaginatedResponse,
  JobRecommendation,
  CandidateRecommendation,
  ScoreBreakdown,
  MatchExplanation,
  MatchStatus,
  RecommendationType
} from '../../types/matching';

const prisma = new PrismaClient();
const matchingLogger = logger.module('MatchingIntegration');

export interface MatchingConfig {
  maxMatchesPerRequest: number;
  defaultScoreThreshold: number;
  enableRealTimeUpdates: boolean;
  enableMLModels: boolean;
  cacheEnabled: boolean;
  cacheTTL: number; // seconds
  batchSize: number;
}

export interface MatchingContext {
  userId?: string;
  userRole?: string;
  sessionId?: string;
  requestId?: string;
  timestamp: Date;
}

export interface MatchingEngineResponse {
  matches: MatchResult[];
  total: number;
  processingTime: number;
  algorithmVersion: string;
  metadata: Record<string, any>;
}

export class MatchingIntegration {
  private config: MatchingConfig;
  private cache = new Map<string, any>();
  private cacheTimestamps = new Map<string, Date>();

  constructor(config?: Partial<MatchingConfig>) {
    this.config = {
      maxMatchesPerRequest: 50,
      defaultScoreThreshold: 0.5,
      enableRealTimeUpdates: true,
      enableMLModels: true,
      cacheEnabled: true,
      cacheTTL: 300, // 5 minutes
      batchSize: 20,
      ...config
    };

    this.setupEventHandlers();
  }

  // Job Recommendations for Candidates
  async getJobRecommendations(
    request: MatchRequest,
    context: MatchingContext
  ): Promise<PaginatedResponse<JobRecommendation>> {
    const startTime = Date.now();

    try {
      matchingLogger.info('Getting job recommendations', {
        userId: context.userId,
        requestId: context.requestId,
        filters: request.filters
      });

      // Validate request
      this.validateRecommendationRequest(request, context);

      // Check cache first
      const cacheKey = this.generateCacheKey('job_recommendations', request, context);
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        matchingLogger.debug('Job recommendations served from cache', {
          requestId: context.requestId,
          resultCount: cached.data.length
        });
        return cached;
      }

      // Get candidate profile
      const candidateProfile = await this.getCandidateProfile(context.userId!);
      if (!candidateProfile) {
        throw new Error('Candidate profile not found');
      }

      // Find matching jobs
      const engineResponse = await this.findMatchingJobs(candidateProfile, request, context);

      // Process and format results
      const recommendations = await this.processJobMatches(
        engineResponse.matches,
        candidateProfile,
        context
      );

      const response: PaginatedResponse<JobRecommendation> = {
        data: recommendations,
        total: engineResponse.total,
        page: 1,
        pageSize: recommendations.length,
        totalPages: Math.ceil(engineResponse.total / recommendations.length),
        hasMore: engineResponse.total > recommendations.length
      };

      // Cache results
      this.setCache(cacheKey, response);

      // Publish event
      await this.publishRecommendationEvent(
        EventType.RECOMMENDATION_GENERATED,
        context.userId!,
        'job',
        recommendations.length,
        { requestId: context.requestId }
      );

      const processingTime = Date.now() - startTime;
      matchingLogger.info('Job recommendations completed', {
        userId: context.userId,
        requestId: context.requestId,
        resultCount: recommendations.length,
        processingTime,
        algorithmVersion: engineResponse.algorithmVersion
      });

      return response;

    } catch (error) {
      matchingLogger.error('Failed to get job recommendations', {
        error: error.message,
        userId: context.userId,
        requestId: context.requestId
      });
      throw error;
    }
  }

  // Candidate Recommendations for Employers
  async getCandidateRecommendations(
    request: MatchRequest,
    context: MatchingContext
  ): Promise<PaginatedResponse<CandidateRecommendation>> {
    const startTime = Date.now();

    try {
      matchingLogger.info('Getting candidate recommendations', {
        userId: context.userId,
        requestId: context.requestId,
        jobId: request.jobId
      });

      // Validate request
      this.validateRecommendationRequest(request, context);

      // Check cache
      const cacheKey = this.generateCacheKey('candidate_recommendations', request, context);
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        matchingLogger.debug('Candidate recommendations served from cache', {
          requestId: context.requestId,
          resultCount: cached.data.length
        });
        return cached;
      }

      // Get job details
      const job = await this.getJobDetails(request.jobId!);
      if (!job) {
        throw new Error('Job not found');
      }

      // Verify user permissions
      await this.verifyEmployerPermissions(context.userId!, job.companyId);

      // Find matching candidates
      const engineResponse = await this.findMatchingCandidates(job, request, context);

      // Process and format results
      const recommendations = await this.processCandidateMatches(
        engineResponse.matches,
        job,
        context
      );

      const response: PaginatedResponse<CandidateRecommendation> = {
        data: recommendations,
        total: engineResponse.total,
        page: 1,
        pageSize: recommendations.length,
        totalPages: Math.ceil(engineResponse.total / recommendations.length),
        hasMore: engineResponse.total > recommendations.length
      };

      // Cache results
      this.setCache(cacheKey, response);

      // Publish event
      await this.publishRecommendationEvent(
        EventType.RECOMMENDATION_GENERATED,
        context.userId!,
        'candidate',
        recommendations.length,
        { jobId: request.jobId, requestId: context.requestId }
      );

      const processingTime = Date.now() - startTime;
      matchingLogger.info('Candidate recommendations completed', {
        userId: context.userId,
        requestId: context.requestId,
        jobId: request.jobId,
        resultCount: recommendations.length,
        processingTime,
        algorithmVersion: engineResponse.algorithmVersion
      });

      return response;

    } catch (error) {
      matchingLogger.error('Failed to get candidate recommendations', {
        error: error.message,
        userId: context.userId,
        requestId: context.requestId
      });
      throw error;
    }
  }

  // Find Matches between Candidates and Jobs
  async findMatches(
    request: MatchRequest,
    context: MatchingContext
  ): Promise<PaginatedResponse<MatchResult>> {
    const startTime = Date.now();

    try {
      matchingLogger.info('Finding matches', {
        userId: context.userId,
        requestId: context.requestId,
        candidateId: request.candidateId,
        jobId: request.jobId
      });

      // Validate request
      this.validateMatchRequest(request, context);

      // Check cache
      const cacheKey = this.generateCacheKey('matches', request, context);
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        matchingLogger.debug('Matches served from cache', {
          requestId: context.requestId,
          resultCount: cached.data.length
        });
        return cached;
      }

      let engineResponse: MatchingEngineResponse;

      if (request.candidateId) {
        // Find jobs for candidate
        const candidateProfile = await this.getCandidateProfile(request.candidateId);
        if (!candidateProfile) {
          throw new Error('Candidate profile not found');
        }
        engineResponse = await this.findMatchingJobs(candidateProfile, request, context);

      } else if (request.jobId) {
        // Find candidates for job
        const job = await this.getJobDetails(request.jobId);
        if (!job) {
          throw new Error('Job not found');
        }
        engineResponse = await this.findMatchingCandidates(job, request, context);

      } else {
        throw new Error('Either candidateId or jobId must be provided');
      }

      // Process results
      const matches = engineResponse.matches.map(match => ({
        ...match,
        timestamp: new Date()
      }));

      const response: PaginatedResponse<MatchResult> = {
        data: matches,
        total: engineResponse.total,
        page: 1,
        pageSize: matches.length,
        totalPages: Math.ceil(engineResponse.total / matches.length),
        hasMore: engineResponse.total > matches.length
      };

      // Cache results
      this.setCache(cacheKey, response);

      // Publish events
      for (const match of matches) {
        await this.publishMatchEvent(EventType.MATCH_CREATED, match, context);
      }

      const processingTime = Date.now() - startTime;
      matchingLogger.info('Matches found', {
        userId: context.userId,
        requestId: context.requestId,
        resultCount: matches.length,
        processingTime,
        algorithmVersion: engineResponse.algorithmVersion
      });

      return response;

    } catch (error) {
      matchingLogger.error('Failed to find matches', {
        error: error.message,
        userId: context.userId,
        requestId: context.requestId
      });
      throw error;
    }
  }

  // Submit Match Feedback
  async submitMatchFeedback(
    matchId: string,
    feedback: {
      rating: number;
      feedback?: string;
      helpful?: boolean;
    },
    context: MatchingContext
  ): Promise<void> {
    try {
      matchingLogger.info('Submitting match feedback', {
        matchId,
        rating: feedback.rating,
        userId: context.userId,
        requestId: context.requestId
      });

      // Validate feedback
      if (feedback.rating < 1 || feedback.rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      // Save feedback to database
      await prisma.matchResult.update({
        where: { id: matchId },
        data: {
          feedback: {
            rating: feedback.rating,
            feedback: feedback.feedback || '',
            helpful: feedback.helpful || false,
            submittedAt: new Date(),
            submittedBy: context.userId
          }
        }
      });

      // Publish event
      await eventBus.publish({
        id: `feedback-${matchId}`,
        type: EventType.MATCH_UPDATED,
        timestamp: new Date(),
        userId: context.userId,
        priority: EventPriority.NORMAL,
        source: 'matching-integration',
        payload: {
          matchId,
          feedback,
          submittedBy: context.userId,
          submittedAt: new Date()
        }
      });

      matchingLogger.info('Match feedback submitted successfully', {
        matchId,
        userId: context.userId
      });

    } catch (error) {
      matchingLogger.error('Failed to submit match feedback', {
        error: error.message,
        matchId,
        userId: context.userId
      });
      throw error;
    }
  }

  // Get Match History
  async getMatchHistory(
    filters: {
      userId?: string;
      candidateId?: string;
      jobId?: string;
      status?: MatchStatus;
      dateRange?: {
        start: Date;
        end: Date;
      };
    },
    pagination: {
      page: number;
      limit: number;
    },
    context: MatchingContext
  ): Promise<PaginatedResponse<MatchResult>> {
    try {
      matchingLogger.info('Getting match history', {
        filters,
        pagination,
        userId: context.userId
      });

      // Build query
      const whereClause: any = {};

      if (filters.userId) {
        whereClause.candidate = { userId: filters.userId };
      }

      if (filters.candidateId) {
        whereClause.candidateId = filters.candidateId;
      }

      if (filters.jobId) {
        whereClause.jobId = filters.jobId;
      }

      if (filters.status) {
        whereClause.status = filters.status;
      }

      if (filters.dateRange) {
        whereClause.createdAt = {
          gte: filters.dateRange.start,
          lte: filters.dateRange.end
        };
      }

      // Count total records
      const total = await prisma.matchResult.count({ where: whereClause });

      // Fetch matches
      const matches = await prisma.matchResult.findMany({
        where: whereClause,
        include: {
          candidate: {
            include: {
              user: {
                select: { uid: true, name: true, email: true }
              }
            }
          },
          job: {
            include: {
              company: {
                select: { name: true, logoUrl: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit
      });

      // Format results
      const formattedMatches: MatchResult[] = matches.map(match => ({
        id: match.id,
        candidateId: match.candidateId,
        jobId: match.jobId,
        score: match.score,
        breakdown: match.breakdown as ScoreBreakdown,
        explanation: match.explanation as MatchExplanation,
        confidence: match.confidence,
        status: match.status as MatchStatus,
        feedback: match.feedback,
        createdAt: match.createdAt,
        updatedAt: match.updatedAt
      }));

      return {
        data: formattedMatches,
        total,
        page: pagination.page,
        pageSize: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit),
        hasMore: pagination.page * pagination.limit < total
      };

    } catch (error) {
      matchingLogger.error('Failed to get match history', {
        error: error.message,
        filters,
        userId: context.userId
      });
      throw error;
    }
  }

  // Private helper methods
  private async findMatchingJobs(
    candidateProfile: any,
    request: MatchRequest,
    context: MatchingContext
  ): Promise<MatchingEngineResponse> {
    // This would integrate with your actual matching engine
    // For now, we'll create a mock implementation

    matchingLogger.debug('Finding matching jobs for candidate', {
      candidateId: candidateProfile.id,
      requestId: context.requestId
    });

    // Mock implementation - replace with actual matching logic
    const mockJobs = await this.searchJobs(candidateProfile, request);
    const scoredMatches = await this.scoreMatches(candidateProfile, mockJobs);

    return {
      matches: scoredMatches.slice(0, request.limit || this.config.maxMatchesPerRequest),
      total: scoredMatches.length,
      processingTime: 150,
      algorithmVersion: '2.0',
      metadata: {
        candidateId: candidateProfile.id,
        filters: request.filters,
        timestamp: new Date()
      }
    };
  }

  private async findMatchingCandidates(
    job: any,
    request: MatchRequest,
    context: MatchingContext
  ): Promise<MatchingEngineResponse> {
    // This would integrate with your actual matching engine
    // For now, we'll create a mock implementation

    matchingLogger.debug('Finding matching candidates for job', {
      jobId: job.id,
      requestId: context.requestId
    });

    // Mock implementation - replace with actual matching logic
    const mockCandidates = await this.searchCandidates(job, request);
    const scoredMatches = await this.scoreCandidates(job, mockCandidates);

    return {
      matches: scoredMatches.slice(0, request.limit || this.config.maxMatchesPerRequest),
      total: scoredMatches.length,
      processingTime: 200,
      algorithmVersion: '2.0',
      metadata: {
        jobId: job.id,
        filters: request.filters,
        timestamp: new Date()
      }
    };
  }

  private async processJobMatches(
    matches: any[],
    candidateProfile: any,
    context: MatchingContext
  ): Promise<JobRecommendation[]> {
    const recommendations: JobRecommendation[] = [];

    for (const match of matches) {
      const job = await this.getJobDetails(match.jobId);
      if (!job) continue;

      const recommendation: JobRecommendation = {
        id: match.id,
        job: {
          id: job.id,
          title: job.title,
          company: {
            name: job.company.name,
            logo: job.company.logoUrl
          },
          location: job.location ? {
            city: job.location.city,
            state: job.location.province
          } : undefined,
          salaryRange: job.salary ? {
            min: job.salary.min,
            max: job.salary.max
          } : undefined,
          requirements: job.requirements ? {
            skills: job.requirements as string[]
          } : undefined,
          employmentType: job.employmentType
        },
        matchScore: match.score,
        matchConfidence: match.confidence,
        matchDetails: match.breakdown,
        explanation: match.explanation,
        lastMatched: new Date()
      };

      recommendations.push(recommendation);
    }

    return recommendations;
  }

  private async processCandidateMatches(
    matches: any[],
    job: any,
    context: MatchingContext
  ): Promise<CandidateRecommendation[]> {
    const recommendations: CandidateRecommendation[] = [];

    for (const match of matches) {
      const candidateProfile = await this.getCandidateProfile(match.candidateId);
      if (!candidateProfile) continue;

      const recommendation: CandidateRecommendation = {
        id: match.id,
        candidate: {
          id: candidateProfile.id,
          name: candidateProfile.personalInfo?.firstName || 'Unknown',
          title: candidateProfile.professionalTitle,
          location: candidateProfile.personalInfo?.location ? {
            city: candidateProfile.personalInfo.location.city,
            state: candidateProfile.personalInfo.location.state
          } : undefined,
          experience: candidateProfile.experience ? {
            years: candidateProfile.experience.length > 0 ?
              Math.max(...candidateProfile.experience.map((exp: any) => exp.years || 0)) : 0,
            level: this.getExperienceLevel(candidateProfile.experience)
          } : undefined,
          skills: candidateProfile.skills as string[] || [],
          avatar: candidateProfile.profileImageUrl
        },
        matchScore: match.score,
        matchConfidence: match.confidence,
        matchDetails: match.breakdown,
        explanation: match.explanation,
        lastMatched: new Date()
      };

      recommendations.push(recommendation);
    }

    return recommendations;
  }

  // Mock implementations - replace with actual logic
  private async searchJobs(candidateProfile: any, request: MatchRequest): Promise<any[]> {
    // Mock search implementation
    return [];
  }

  private async searchCandidates(job: any, request: MatchRequest): Promise<any[]> {
    // Mock search implementation
    return [];
  }

  private async scoreMatches(candidateProfile: any, jobs: any[]): Promise<any[]> {
    // Mock scoring implementation
    return jobs.map(job => ({
      id: `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      candidateId: candidateProfile.id,
      jobId: job.id,
      score: Math.random(),
      breakdown: {
        skillsMatch: Math.random() * 100,
        experienceMatch: Math.random() * 100,
        educationMatch: Math.random() * 100,
        locationMatch: Math.random() * 100,
        overallScore: Math.random() * 100
      },
      explanation: {
        strengths: ['Great skill match', 'Relevant experience'],
        weaknesses: ['Missing specific experience'],
        recommendations: ['Add more skills to profile']
      },
      confidence: Math.random(),
      status: MatchStatus.NEW
    }));
  }

  private async scoreCandidates(job: any, candidates: any[]): Promise<any[]> {
    // Mock scoring implementation
    return candidates.map(candidate => ({
      id: `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      candidateId: candidate.id,
      jobId: job.id,
      score: Math.random(),
      breakdown: {
        skillsMatch: Math.random() * 100,
        experienceMatch: Math.random() * 100,
        educationMatch: Math.random() * 100,
        locationMatch: Math.random() * 100,
        overallScore: Math.random() * 100
      },
      explanation: {
        strengths: ['Strong educational background'],
        weaknesses: ['Limited experience'],
        recommendations: ['Gain more relevant experience']
      },
      confidence: Math.random(),
      status: MatchStatus.NEW
    }));
  }

  private async getCandidateProfile(userId: string): Promise<any> {
    return await prisma.candidateProfile.findUnique({
      where: { userId },
      include: {
        user: true,
        resume: true
      }
    });
  }

  private async getJobDetails(jobId: string): Promise<any> {
    return await prisma.job.findUnique({
      where: { jobId },
      include: {
        company: true
      }
    });
  }

  private async verifyEmployerPermissions(userId: string, companyId: string): Promise<void> {
    const employer = await prisma.employerProfile.findFirst({
      where: { userId, companyId }
    });

    if (!employer) {
      throw new Error('Permission denied');
    }
  }

  private getExperienceLevel(experience: any[]): string {
    if (!experience || experience.length === 0) return 'entry';

    const totalYears = experience.reduce((sum: number, exp: any) => sum + (exp.years || 0), 0);

    if (totalYears < 2) return 'entry';
    if (totalYears < 5) return 'junior';
    if (totalYears < 8) return 'mid';
    if (totalYears < 12) return 'senior';
    if (totalYears < 15) return 'lead';
    return 'principal';
  }

  // Validation methods
  private validateRecommendationRequest(request: MatchRequest, context: MatchingContext): void {
    if (!context.userId) {
      throw new Error('User ID is required');
    }

    if (request.limit && request.limit > this.config.maxMatchesPerRequest) {
      throw new Error(`Limit cannot exceed ${this.config.maxMatchesPerRequest}`);
    }
  }

  private validateMatchRequest(request: MatchRequest, context: MatchingContext): void {
    if (!request.candidateId && !request.jobId) {
      throw new Error('Either candidateId or jobId must be provided');
    }

    if (request.limit && request.limit > this.config.maxMatchesPerRequest) {
      throw new Error(`Limit cannot exceed ${this.config.maxMatchesPerRequest}`);
    }
  }

  // Event handling
  private setupEventHandlers(): void {
    // Listen for relevant events
    eventBus.subscribe(EventType.USER_PROFILE_UPDATED, async (event) => {
      await this.handleProfileUpdate(event);
    });

    eventBus.subscribe(EventType.JOB_POSTED, async (event) => {
      await this.handleJobPosted(event);
    });
  }

  private async handleProfileUpdate(event: any): Promise<void> {
    const { userId } = event.payload;

    // Invalidate cache for this user
    this.invalidateUserCache(userId);

    matchingLogger.info('Profile updated, cache invalidated', { userId });
  }

  private async handleJobPosted(event: any): Promise<void> {
    const { jobId } = event.payload;

    // Invalidate cache for this job
    this.invalidateJobCache(jobId);

    matchingLogger.info('Job posted, cache invalidated', { jobId });
  }

  // Event publishing
  private async publishMatchEvent(
    eventType: EventType,
    match: any,
    context: MatchingContext
  ): Promise<void> {
    await eventBus.publish({
      id: `match-event-${match.id}`,
      type: eventType,
      timestamp: new Date(),
      userId: context.userId,
      priority: EventPriority.NORMAL,
      source: 'matching-integration',
      payload: match
    });
  }

  private async publishRecommendationEvent(
    eventType: EventType,
    userId: string,
    targetType: string,
    count: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    await eventBus.publish({
      id: `recommendation-${userId}-${Date.now()}`,
      type: eventType,
      timestamp: new Date(),
      userId,
      priority: EventPriority.NORMAL,
      source: 'matching-integration',
      payload: {
        userId,
        targetType,
        count,
        ...metadata
      }
    });
  }

  // Cache management
  private generateCacheKey(type: string, request: MatchRequest, context: MatchingContext): string {
    const keyData = {
      type,
      userId: context.userId,
      ...request
    };

    return Buffer.from(JSON.stringify(keyData)).toString('base64');
  }

  private getFromCache(key: string): any {
    if (!this.config.cacheEnabled) return null;

    const cached = this.cache.get(key);
    const timestamp = this.cacheTimestamps.get(key);

    if (!cached || !timestamp) return null;

    const now = Date.now();
    const age = (now - timestamp.getTime()) / 1000;

    if (age > this.config.cacheTTL) {
      this.cache.delete(key);
      this.cacheTimestamps.delete(key);
      return null;
    }

    return cached;
  }

  private setCache(key: string, data: any): void {
    if (!this.config.cacheEnabled) return;

    this.cache.set(key, data);
    this.cacheTimestamps.set(key, new Date());

    // Implement cache size limit
    if (this.cache.size > 1000) {
      this.cleanupCache();
    }
  }

  private invalidateUserCache(userId: string): void {
    for (const [key] of this.cache.entries()) {
      if (key.includes(userId)) {
        this.cache.delete(key);
        this.cacheTimestamps.delete(key);
      }
    }
  }

  private invalidateJobCache(jobId: string): void {
    for (const [key] of this.cache.entries()) {
      if (key.includes(jobId)) {
        this.cache.delete(key);
        this.cacheTimestamps.delete(key);
      }
    }
  }

  private cleanupCache(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, timestamp] of this.cacheTimestamps.entries()) {
      const age = (now - timestamp.getTime()) / 1000;
      if (age > this.config.cacheTTL * 2) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
      this.cacheTimestamps.delete(key);
    }
  }

  // Public API methods
  getMatchingStats(): {
    totalMatches: number;
    averageScore: number;
    cacheHitRate: number;
    algorithmVersion: string;
  } {
    // This would calculate actual statistics
    return {
      totalMatches: 0,
      averageScore: 0,
      cacheHitRate: 0,
      algorithmVersion: '2.0'
    };
  }

  async clearCache(): Promise<void> {
    this.cache.clear();
    this.cacheTimestamps.clear();
    matchingLogger.info('Matching cache cleared');
  }

  async shutdown(): Promise<void> {
    matchingLogger.info('Shutting down matching integration...');
    await this.clearCache();
    this.removeAllListeners();
    matchingLogger.info('Matching integration shutdown complete');
  }
}

export default MatchingIntegration;