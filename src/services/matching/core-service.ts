import {
  MatchRequest,
  MatchResult,
  MatchingConfig,
  MatchMode,
  MatchFilters,
  SortOptions,
  MatchStats,
  CandidateProfile,
  JobProfile,
  ProfileMatchResult,
  PaginatedResponse,
  BatchMatchRequest,
  BatchMatchResult
} from '@/types/matching';
import { ScoringEngine } from './scoring-engine';
import { CandidateService } from './candidate-service';
import { JobService } from './job-service';
import { logger } from '@/lib/logging/logger';
import { prisma } from '@/lib/prisma';

/**
 * Core matching service that orchestrates the matching process
 */
export class MatchingCoreService {
  private scoringEngine: ScoringEngine;
  private candidateService: CandidateService;
  private jobService: JobService;
  private cache: Map<string, any> = new Map();
  private cacheTimeout: number = 5 * 60 * 1000; // 5 minutes

  constructor(config?: Partial<MatchingConfig>) {
    this.scoringEngine = new ScoringEngine(config);
    this.candidateService = new CandidateService();
    this.jobService = new JobService();
  }

  /**
   * Find candidates matching a job
   */
  async findCandidatesForJob(
    jobId: string,
    filters?: MatchFilters,
    sort?: SortOptions,
    limit: number = 50,
    offset: number = 0
  ): Promise<PaginatedResponse<ProfileMatchResult>> {
    try {
      logger.info('Finding candidates for job', {
        jobId,
        filters,
        sort,
        limit,
        offset
      });

      // Check cache first
      const cacheKey = this.generateCacheKey('candidates-for-job', { jobId, filters, sort, limit, offset });
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        logger.debug('Returning cached results', { jobId });
        return cached;
      }

      // Get job profile
      const job = await this.jobService.getJobProfile(jobId);
      if (!job) {
        throw new Error('Job profile not found');
      }

      // Get candidates with filters
      const candidates = await this.candidateService.searchCandidates(
        filters || {},
        limit + offset
      );

      // Calculate matches for each candidate
      const matchPromises = candidates.map(candidate =>
        this.scoreCandidate(candidate.id, jobId, {
          candidateId: candidate.id,
          jobId,
          mode: MatchMode.HYBRID
        })
      );

      const matchResults = await Promise.all(matchPromises);

      // Apply threshold filter
      const minScore = filters?.minScore || 50;
      const validMatches = matchResults.filter(match => match.totalScore >= minScore);

      // Convert to ProfileMatchResult
      const profileMatches: ProfileMatchResult[] = await Promise.all(
        validMatches.map(async (match) => {
          const candidate = candidates.find(c => c.id === match.candidateId);
          if (!candidate) return null;

          return {
            profile: candidate,
            matchScore: match.totalScore,
            matchConfidence: match.confidence.score,
            matchDetails: match.breakdown,
            explanation: match.explanation,
            recommendations: match.recommendations,
            lastMatched: match.matchDate
          };
        })
      );

      // Filter out nulls and apply sorting
      const sortedMatches = this.sortResults(
        profileMatches.filter(Boolean) as ProfileMatchResult[],
        sort || { field: 'matchScore', order: 'desc' }
      );

      // Apply pagination
      const paginatedResults = sortedMatches.slice(offset, offset + limit);
      const total = validMatches.length;

      const result: PaginatedResponse<ProfileMatchResult> = {
        data: paginatedResults,
        total,
        page: Math.floor(offset / limit) + 1,
        pageSize: limit,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + limit < total
      };

      // Cache result
      this.setCache(cacheKey, result);

      logger.info('Candidates matching completed', {
        jobId,
        total,
        returned: paginatedResults.length
      });

      return result;
    } catch (error) {
      logger.error('Error finding candidates for job', {
        jobId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Find jobs matching a candidate
   */
  async findJobsForCandidate(
    candidateId: string,
    filters?: MatchFilters,
    sort?: SortOptions,
    limit: number = 50,
    offset: number = 0
  ): Promise<PaginatedResponse<ProfileMatchResult>> {
    try {
      logger.info('Finding jobs for candidate', {
        candidateId,
        filters,
        sort,
        limit,
        offset
      });

      // Check cache first
      const cacheKey = this.generateCacheKey('jobs-for-candidate', { candidateId, filters, sort, limit, offset });
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        logger.debug('Returning cached results', { candidateId });
        return cached;
      }

      // Get candidate profile
      const candidate = await this.candidateService.getCandidateProfile(candidateId);
      if (!candidate) {
        throw new Error('Candidate profile not found');
      }

      // Get jobs with filters
      const jobs = await this.jobService.searchJobs(
        filters || {},
        limit + offset
      );

      // Calculate matches for each job
      const matchPromises = jobs.map(job =>
        this.scoreCandidate(candidateId, job.id, {
          candidateId,
          jobId: job.id,
          mode: MatchMode.HYBRID
        })
      );

      const matchResults = await Promise.all(matchPromises);

      // Apply threshold filter
      const minScore = filters?.minScore || 50;
      const validMatches = matchResults.filter(match => match.totalScore >= minScore);

      // Convert to ProfileMatchResult
      const profileMatches: ProfileMatchResult[] = await Promise.all(
        validMatches.map(async (match) => {
          const job = jobs.find(j => j.id === match.jobId);
          if (!job) return null;

          return {
            profile: job,
            matchScore: match.totalScore,
            matchConfidence: match.confidence.score,
            matchDetails: match.breakdown,
            explanation: match.explanation,
            recommendations: match.recommendations,
            lastMatched: match.matchDate
          };
        })
      );

      // Filter out nulls and apply sorting
      const sortedMatches = this.sortResults(
        profileMatches.filter(Boolean) as ProfileMatchResult[],
        sort || { field: 'matchScore', order: 'desc' }
      );

      // Apply pagination
      const paginatedResults = sortedMatches.slice(offset, offset + limit);
      const total = validMatches.length;

      const result: PaginatedResponse<ProfileMatchResult> = {
        data: paginatedResults,
        total,
        page: Math.floor(offset / limit) + 1,
        pageSize: limit,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + limit < total
      };

      // Cache result
      this.setCache(cacheKey, result);

      logger.info('Jobs matching completed', {
        candidateId,
        total,
        returned: paginatedResults.length
      });

      return result;
    } catch (error) {
      logger.error('Error finding jobs for candidate', {
        candidateId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Score a single candidate against a job
   */
  async scoreCandidate(candidateId: string, jobId: string, request: MatchRequest): Promise<MatchResult> {
    try {
      // Validate request
      const validation = this.scoringEngine.validateRequest(request);
      if (!validation.valid) {
        throw new Error(`Invalid match request: ${validation.errors.join(', ')}`);
      }

      // Calculate match score
      const result = await this.scoringEngine.scoreCandidate(request);

      // Save match result to database
      await this.saveMatchResult(result);

      // Invalidate relevant cache entries
      this.invalidateCacheForCandidate(candidateId);
      this.invalidateCacheForJob(jobId);

      return result;
    } catch (error) {
      logger.error('Error scoring candidate', {
        candidateId,
        jobId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Batch matching for multiple candidates and jobs
   */
  async batchMatch(request: BatchMatchRequest): Promise<BatchMatchResult> {
    try {
      logger.info('Starting batch matching', {
        type: request.type,
        candidateIds: request.candidateIds?.length,
        jobIds: request.jobIds?.length
      });

      const startTime = Date.now();
      const results: MatchResult[] = [];
      let processed = 0;
      let failed = 0;

      if (request.type === 'candidate-to-jobs' && request.candidateId && request.jobIds) {
        // Match one candidate to multiple jobs
        for (const jobId of request.jobIds) {
          try {
            const result = await this.scoreCandidate(request.candidateId!, jobId, {
              candidateId: request.candidateId!,
              jobId,
              mode: request.mode || MatchMode.HYBRID
            });
            results.push(result);
            processed++;
          } catch (error) {
            failed++;
            logger.error('Batch match failed for candidate-job', {
              candidateId: request.candidateId,
              jobId,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
      } else if (request.type === 'job-to-candidates' && request.jobId && request.candidateIds) {
        // Match one job to multiple candidates
        for (const candidateId of request.candidateIds) {
          try {
            const result = await this.scoreCandidate(candidateId, request.jobId!, {
              candidateId,
              jobId: request.jobId!,
              mode: request.mode || MatchMode.HYBRID
            });
            results.push(result);
            processed++;
          } catch (error) {
            failed++;
            logger.error('Batch match failed for job-candidate', {
              jobId: request.jobId,
              candidateId,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
      } else if (request.type === 'cross-match' && request.candidateIds && request.jobIds) {
        // Match all candidates to all jobs
        for (const candidateId of request.candidateIds) {
          for (const jobId of request.jobIds) {
            try {
              const result = await this.scoreCandidate(candidateId, jobId, {
                candidateId,
                jobId,
                mode: request.mode || MatchMode.HYBRID
              });
              results.push(result);
              processed++;
            } catch (error) {
              failed++;
              logger.error('Batch match failed for cross-match', {
                candidateId,
                jobId,
                error: error instanceof Error ? error.message : 'Unknown error'
              });
            }
          }
        }
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      const batchResult: BatchMatchResult = {
        id: `batch_${Date.now()}`,
        type: request.type,
        totalProcessed: processed + failed,
        successful: processed,
        failed,
        duration,
        results,
        timestamp: new Date()
      };

      logger.info('Batch matching completed', {
        type: request.type,
        processed,
        failed,
        duration
      });

      return batchResult;
    } catch (error) {
      logger.error('Error in batch matching', {
        type: request.type,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get matching statistics
   */
  async getMatchStats(filters?: any): Promise<MatchStats> {
    try {
      const whereClause = this.buildStatsWhereClause(filters);

      const [
        totalMatches,
        highQualityMatches,
        averageScore,
        recentMatches
      ] = await Promise.all([
        prisma.matchResult.count({ where: whereClause }),
        prisma.matchResult.count({
          where: { ...whereClause, totalScore: { gte: 80 } }
        }),
        prisma.matchResult.aggregate({
          where: whereClause,
          _avg: { totalScore: true }
        }),
        prisma.matchResult.count({
          where: {
            ...whereClause,
            matchDate: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
          }
        })
      ]);

      return {
        totalMatches,
        averageScore: averageScore._avg.totalScore || 0,
        highQualityMatches,
        recentMatches,
        matchRate: totalMatches > 0 ? (highQualityMatches / totalMatches) * 100 : 0
      };
    } catch (error) {
      logger.error('Error getting match stats', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return {
        totalMatches: 0,
        averageScore: 0,
        highQualityMatches: 0,
        recentMatches: 0,
        matchRate: 0
      };
    }
  }

  /**
   * Get match details by ID
   */
  async getMatch(matchId: string): Promise<MatchResult | null> {
    try {
      const matchRecord = await prisma.matchResult.findUnique({
        where: { id: matchId },
        include: {
          candidate: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  role: true
                }
              }
            }
          },
          job: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  role: true
                }
              }
            }
          }
        }
      });

      if (!matchRecord) {
        return null;
      }

      return {
        candidateId: matchRecord.candidateId,
        jobId: matchRecord.jobId,
        totalScore: matchRecord.totalScore,
        confidence: matchRecord.confidence as any,
        breakdown: matchRecord.breakdown as any,
        explanation: matchRecord.explanation as any,
        matchDate: matchRecord.matchDate,
        algorithm: matchRecord.algorithm,
        recommendations: matchRecord.recommendations as string[]
      };
    } catch (error) {
      logger.error('Error getting match details', {
        matchId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Save match result to database
   */
  private async saveMatchResult(result: MatchResult): Promise<void> {
    try {
      await prisma.matchResult.create({
        data: {
          candidateId: result.candidateId,
          jobId: result.jobId,
          totalScore: result.totalScore,
          confidence: result.confidence,
          breakdown: result.breakdown as any,
          explanation: result.explanation as any,
          matchDate: result.matchDate,
          algorithm: result.algorithm,
          recommendations: result.recommendations,
          metadata: {
            processingTime: Date.now(),
            version: '2.1.0'
          }
        }
      });
    } catch (error) {
      logger.error('Error saving match result', {
        candidateId: result.candidateId,
        jobId: result.jobId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Build where clause for stats queries
   */
  private buildStatsWhereClause(filters?: any): any {
    const whereClause: any = {};

    if (filters?.startDate) {
      whereClause.matchDate = { ...whereClause.matchDate, gte: new Date(filters.startDate) };
    }

    if (filters?.endDate) {
      whereClause.matchDate = { ...whereClause.matchDate, lte: new Date(filters.endDate) };
    }

    if (filters?.minScore) {
      whereClause.totalScore = { ...whereClause.totalScore, gte: filters.minScore };
    }

    if (filters?.candidateId) {
      whereClause.candidateId = filters.candidateId;
    }

    if (filters?.jobId) {
      whereClause.jobId = filters.jobId;
    }

    return whereClause;
  }

  /**
   * Sort results based on field and order
   */
  private sortResults(
    results: ProfileMatchResult[],
    sort: SortOptions
  ): ProfileMatchResult[] {
    return results.sort((a, b) => {
      let aValue: number;
      let bValue: number;

      switch (sort.field) {
        case 'matchScore':
          aValue = a.matchScore;
          bValue = b.matchScore;
          break;
        case 'matchConfidence':
          aValue = a.matchConfidence;
          bValue = b.matchConfidence;
          break;
        case 'lastMatched':
          aValue = a.lastMatched.getTime();
          bValue = b.lastMatched.getTime();
          break;
        default:
          aValue = a.matchScore;
          bValue = b.matchScore;
      }

      if (sort.order === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(type: string, params: any): string {
    return `${type}:${JSON.stringify(params)}`;
  }

  /**
   * Get value from cache
   */
  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  /**
   * Set value in cache
   */
  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Invalidate cache for candidate
   */
  private invalidateCacheForCandidate(candidateId: string): void {
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.includes(candidateId)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Invalidate cache for job
   */
  private invalidateCacheForJob(jobId: string): void {
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.includes(jobId)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Update matching configuration
   */
  updateConfig(config: Partial<MatchingConfig>): void {
    this.scoringEngine.updateConfig(config);
    this.clearCache(); // Clear cache when config changes
  }

  /**
   * Get current configuration
   */
  getConfig(): MatchingConfig {
    return this.scoringEngine.getConfig();
  }
}

export default MatchingCoreService;