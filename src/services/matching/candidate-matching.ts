import { PrismaClient, Prisma } from '@prisma/client';
import { EventBus } from '@/lib/events/event-bus';
import { logger } from '@/lib/logger';
import {
  CandidateMatchRequest,
  CandidateMatchResponse,
  CandidateMatch,
  MatchCandidate,
  MatchFilters,
  MatchSortBy,
  CandidateScoreBreakdown,
  CandidateMatchEvent,
  CandidateSearchRequest,
  CandidateSearchResponse
} from '@/types/matching';

export class CandidateMatchingService {
  private prisma: PrismaClient;
  private eventBus: EventBus;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes

  constructor(prisma: PrismaClient, eventBus: EventBus) {
    this.prisma = prisma;
    this.eventBus = eventBus;
  }

  async findCandidatesForJob(request: CandidateMatchRequest): Promise<CandidateMatchResponse> {
    const startTime = Date.now();
    logger.module('candidate-matching').info('Finding candidates for job', {
      jobId: request.jobId,
      employerId: request.employerId,
      limit: request.limit
    });

    try {
      // Validate job exists and belongs to employer
      const job = await this.prisma.job.findFirst({
        where: {
          id: request.jobId,
          companyId: request.employerId
        },
        include: {
          company: true,
          requiredSkills: true,
          preferredSkills: true,
          _count: {
            select: { applications: true }
          }
        }
      });

      if (!job) {
        throw new Error('Job not found or access denied');
      }

      // Check cache first
      const cacheKey = `candidate_match:${request.jobId}:${JSON.stringify(request.filters)}`;
      const cached = this.getFromCache(cacheKey);
      if (cached && !request.forceRefresh) {
        logger.module('candidate-matching').info('Returning cached candidate matches', { jobId: request.jobId });
        return cached;
      }

      // Get candidates who match the basic criteria
      const candidates = await this.getMatchingCandidates(job, request);

      // Score and rank candidates
      const scoredCandidates = await this.scoreCandidates(candidates, job, request);

      // Sort by score
      scoredCandidates.sort((a, b) => b.overallScore - a.overallScore);

      // Create match response
      const response: CandidateMatchResponse = {
        jobId: request.jobId,
        candidates: scoredCandidates.slice(0, request.limit || 50),
        totalCandidates: candidates.length,
        searchCriteria: {
          requiredSkills: job.requiredSkills.map(s => s.name),
          experienceLevel: job.experienceLevel,
          location: job.location
        },
        metadata: {
          searchTime: Date.now() - startTime,
          algorithm: 'comprehensive_candidate_matching',
          timestamp: new Date().toISOString()
        }
      };

      // Cache the results
      this.setCache(cacheKey, response);

      // Publish match event
      await this.publishCandidateMatchEvent(job, response);

      logger.module('candidate-matching').info('Candidate matching completed', {
        jobId: request.jobId,
        candidatesMatched: response.candidates.length,
        searchTime: response.metadata.searchTime
      });

      return response;

    } catch (error) {
      logger.module('candidate-matching').error('Error finding candidates for job', {
        jobId: request.jobId,
        error: error.message
      });
      throw error;
    }
  }

  async searchCandidates(request: CandidateSearchRequest): Promise<CandidateSearchResponse> {
    logger.module('candidate-matching').info('Searching candidates', {
      query: request.query,
      filters: request.filters,
      limit: request.limit
    });

    try {
      const candidates = await this.queryCandidates(request);
      const totalCandidates = await this.countCandidates(request);

      const response: CandidateSearchResponse = {
        candidates: candidates.slice(0, request.limit || 100),
        totalCandidates,
        currentPage: request.page || 1,
        totalPages: Math.ceil(totalCandidates / (request.limit || 100)),
        filters: request.filters,
        metadata: {
          searchTime: Date.now() - Date.now(),
          query: request.query,
          timestamp: new Date().toISOString()
        }
      };

      logger.module('candidate-matching').info('Candidate search completed', {
        resultsCount: response.candidates.length,
        totalCandidates
      });

      return response;

    } catch (error) {
      logger.module('candidate-matching').error('Error searching candidates', {
        error: error.message
      });
      throw error;
    }
  }

  async saveCandidateMatch(
    jobId: string,
    candidateId: string,
    employerId: string,
    action: 'viewed' | 'saved' | 'contacted' | 'rejected'
  ): Promise<void> {
    logger.module('candidate-matching').info('Saving candidate match', {
      jobId,
      candidateId,
      employerId,
      action
    });

    try {
      // Record the match interaction
      await this.prisma.match.upsert({
        where: {
          jobId_candidateId: {
            jobId,
            candidateId
          }
        },
        update: {
          status: action,
          employerViewedAt: action === 'viewed' ? new Date() : undefined,
          contactedAt: action === 'contacted' ? new Date() : undefined,
          updatedAt: new Date()
        },
        create: {
          jobId,
          candidateId,
          employerId,
          status: action,
          score: 0, // Will be calculated when match is created
          employerViewedAt: action === 'viewed' ? new Date() : undefined,
          contactedAt: action === 'contacted' ? new Date() : undefined
        }
      });

      // Publish interaction event
      this.eventBus.publish('candidate.interaction', {
        jobId,
        candidateId,
        employerId,
        action,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.module('candidate-matching').error('Error saving candidate match', {
        jobId,
        candidateId,
        error: error.message
      });
      throw error;
    }
  }

  async getCandidateFeedback(
    jobId: string,
    candidateId: string,
    employerId: string
  ): Promise<any> {
    logger.module('candidate-matching').info('Getting candidate feedback', {
      jobId,
      candidateId,
      employerId
    });

    try {
      const match = await this.prisma.match.findFirst({
        where: {
          jobId,
          candidateId,
          employerId
        }
      });

      return match?.feedback || null;

    } catch (error) {
      logger.module('candidate-matching').error('Error getting candidate feedback', {
        jobId,
        candidateId,
        error: error.message
      });
      throw error;
    }
  }

  private async getMatchingCandidates(
    job: any,
    request: CandidateMatchRequest
  ): Promise<any[]> {
    const whereClause: any = {
      isActive: true,
      profileComplete: true,
      NOT: {
        id: {
          in: request.excludeCandidateIds || []
        }
      }
    };

    // Apply filters
    if (request.filters) {
      if (request.filters.skills?.length) {
        whereClause.OR = request.filters.skills.map(skill => ({
          skills: {
            some: {
              skill: {
                name: {
                  contains: skill,
                  mode: 'insensitive'
                }
              }
            }
          }
        }));
      }

      if (request.filters.location) {
        whereClause.location = {
          contains: request.filters.location,
          mode: 'insensitive'
        };
      }

      if (request.filters.experienceLevel) {
        whereClause.experienceLevel = request.filters.experienceLevel;
      }

      if (request.filters.minYearsExperience) {
        whereClause.yearsExperience = {
          gte: request.filters.minYearsExperience
        };
      }

      if (request.filters.maxYearsExperience) {
        whereClause.yearsExperience = {
          ...whereClause.yearsExperience,
          lte: request.filters.maxYearsExperience
        };
      }

      if (request.filters.willingToRelocate !== undefined) {
        whereClause.willingToRelocate = request.filters.willingToRelocate;
      }

      if (request.filters.workType) {
        whereClause.workType = request.filters.workType;
      }
    }

    // Job-specific criteria
    if (job.experienceLevel) {
      whereClause.experienceLevel = job.experienceLevel;
    }

    if (job.remote !== undefined) {
      whereClause.OR = whereClause.OR || [];
      if (job.remote) {
        whereClause.OR.push(
          { remote: true },
          { willingToRelocate: true }
        );
      } else {
        whereClause.OR.push({
          AND: [
            { location: { contains: job.location, mode: 'insensitive' } },
            { remote: false }
          ]
        });
      }
    }

    return await this.prisma.user.findMany({
      where: whereClause,
      include: {
        resume: {
          include: {
            skills: true,
            experiences: true,
            education: true
          }
        },
        skills: {
          include: {
            skill: true
          }
        },
        _count: {
          select: { applications: true }
        }
      }
    });
  }

  private async scoreCandidates(
    candidates: any[],
    job: any,
    request: CandidateMatchRequest
  ): Promise<MatchCandidate[]> {
    const scoredCandidates: MatchCandidate[] = [];

    for (const candidate of candidates) {
      const scoreBreakdown = await this.calculateCandidateScore(candidate, job);

      const matchCandidate: MatchCandidate = {
        candidateId: candidate.id,
        name: `${candidate.firstName} ${candidate.lastName}`,
        email: candidate.email,
        location: candidate.location,
        experienceLevel: candidate.experienceLevel,
        yearsExperience: candidate.yearsExperience || 0,
        remote: candidate.remote,
        willingToRelocate: candidate.willingToRelocate || false,
        workType: candidate.workType,
        skills: candidate.skills?.map((s: any) => s.skill.name) || [],
        resume: candidate.resume ? {
          title: candidate.resume.title,
          summary: candidate.resume.summary,
          experiences: candidate.resume.experiences?.length || 0,
          education: candidate.resume.education?.length || 0,
          lastUpdated: candidate.resume.updatedAt
        } : undefined,
        overallScore: scoreBreakdown.overallScore,
        scoreBreakdown,
        matchReasons: this.generateMatchReasons(scoreBreakdown, job),
        potentialConcerns: this.generateConcerns(candidate, job),
        lastActive: candidate.lastLoginAt || candidate.createdAt,
        responseRate: await this.getCandidateResponseRate(candidate.id),
        profileComplete: candidate.profileComplete
      };

      scoredCandidates.push(matchCandidate);
    }

    return scoredCandidates;
  }

  private async calculateCandidateScore(candidate: any, job: any): Promise<CandidateScoreBreakdown> {
    let score = 0;
    const maxScore = 100;
    const breakdown: CandidateScoreBreakdown = {
      overallScore: 0,
      skillsMatch: 0,
      experienceMatch: 0,
      locationMatch: 0,
      educationMatch: 0,
      availabilityMatch: 0,
      recentActivity: 0
    };

    // Skills matching (40 points)
    const candidateSkills = candidate.skills?.map((s: any) => s.skill.name.toLowerCase()) || [];
    const requiredSkills = job.requiredSkills?.map((s: any) => s.name.toLowerCase()) || [];
    const preferredSkills = job.preferredSkills?.map((s: any) => s.name.toLowerCase()) || [];

    const requiredSkillMatches = requiredSkills.filter(skill =>
      candidateSkills.some(candidateSkill =>
        candidateSkill.includes(skill) || skill.includes(candidateSkill)
      )
    ).length;

    const preferredSkillMatches = preferredSkills.filter(skill =>
      candidateSkills.some(candidateSkill =>
        candidateSkill.includes(skill) || skill.includes(candidateSkill)
      )
    ).length;

    breakdown.skillsMatch = requiredSkills.length > 0
      ? (requiredSkillMatches / requiredSkills.length) * 30
      : 20;

    breakdown.skillsMatch += preferredSkills.length > 0
      ? (preferredSkillMatches / preferredSkills.length) * 10
      : 10;

    // Experience matching (20 points)
    if (job.experienceLevel === candidate.experienceLevel) {
      breakdown.experienceMatch = 20;
    } else {
      const experienceLevels = ['entry', 'mid', 'senior', 'executive'];
      const jobLevel = experienceLevels.indexOf(job.experienceLevel);
      const candidateLevel = experienceLevels.indexOf(candidate.experienceLevel);
      const levelDiff = Math.abs(jobLevel - candidateLevel);

      breakdown.experienceMatch = Math.max(0, 20 - (levelDiff * 5));
    }

    // Location matching (15 points)
    if (job.remote && candidate.remote) {
      breakdown.locationMatch = 15;
    } else if (!job.remote && candidate.location?.toLowerCase().includes(job.location?.toLowerCase() || '')) {
      breakdown.locationMatch = 15;
    } else if (job.remote && candidate.willingToRelocate) {
      breakdown.locationMatch = 10;
    } else if (candidate.location?.toLowerCase().includes(job.location?.toLowerCase() || '')) {
      breakdown.locationMatch = 12;
    } else {
      breakdown.locationMatch = 0;
    }

    // Education matching (10 points)
    if (candidate.resume?.education?.length) {
      const hasRelevantEducation = candidate.resume.education.some((edu: any) =>
        edu.degree?.toLowerCase().includes('bachelor') ||
        edu.degree?.toLowerCase().includes('master') ||
        edu.degree?.toLowerCase().includes('phd')
      );
      breakdown.educationMatch = hasRelevantEducation ? 10 : 5;
    } else {
      breakdown.educationMatch = 0;
    }

    // Availability matching (10 points)
    breakdown.availabilityMatch = candidate.isActive ? 10 : 0;

    // Recent activity (5 points)
    const lastActive = candidate.lastLoginAt || candidate.createdAt;
    const daysSinceActive = (Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceActive <= 7) {
      breakdown.recentActivity = 5;
    } else if (daysSinceActive <= 30) {
      breakdown.recentActivity = 3;
    } else if (daysSinceActive <= 90) {
      breakdown.recentActivity = 1;
    } else {
      breakdown.recentActivity = 0;
    }

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

  private generateMatchReasons(scoreBreakdown: CandidateScoreBreakdown, job: any): string[] {
    const reasons: string[] = [];

    if (scoreBreakdown.skillsMatch >= 25) {
      reasons.push('Strong skills alignment with job requirements');
    }
    if (scoreBreakdown.experienceMatch >= 15) {
      reasons.push('Experience level matches job requirements');
    }
    if (scoreBreakdown.locationMatch >= 12) {
      reasons.push('Great location match for this position');
    }
    if (scoreBreakdown.educationMatch >= 8) {
      reasons.push('Educational background fits well');
    }
    if (scoreBreakdown.recentActivity >= 3) {
      reasons.push('Recently active on platform');
    }

    return reasons.length > 0 ? reasons : ['Candidate meets basic requirements'];
  }

  private generateConcerns(candidate: any, job: any): string[] {
    const concerns: string[] = [];

    if (!candidate.profileComplete) {
      concerns.push('Profile is incomplete');
    }
    if (!candidate.isActive) {
      concerns.push('Candidate may not be actively looking');
    }
    if (!candidate.resume) {
      concerns.push('No resume available');
    }

    return concerns;
  }

  private async getCandidateResponseRate(candidateId: string): Promise<number> {
    try {
      // This would typically query application/response data
      // For now, returning a mock value
      return 0.75;
    } catch (error) {
      return 0.5; // Default response rate
    }
  }

  private async queryCandidates(request: CandidateSearchRequest): Promise<any[]> {
    // Implement candidate search logic
    const whereClause: any = {
      isActive: true,
      role: 'seeker'
    };

    if (request.query) {
      whereClause.OR = [
        { firstName: { contains: request.query, mode: 'insensitive' } },
        { lastName: { contains: request.query, mode: 'insensitive' } },
        { email: { contains: request.query, mode: 'insensitive' } }
      ];
    }

    // Apply filters
    if (request.filters) {
      Object.assign(whereClause, request.filters);
    }

    return await this.prisma.user.findMany({
      where: whereClause,
      include: {
        resume: true,
        skills: {
          include: {
            skill: true
          }
        }
      },
      skip: ((request.page || 1) - 1) * (request.limit || 100),
      take: request.limit || 100
    });
  }

  private async countCandidates(request: CandidateSearchRequest): Promise<number> {
    const whereClause: any = {
      isActive: true,
      role: 'seeker'
    };

    if (request.query) {
      whereClause.OR = [
        { firstName: { contains: request.query, mode: 'insensitive' } },
        { lastName: { contains: request.query, mode: 'insensitive' } },
        { email: { contains: request.query, mode: 'insensitive' } }
      ];
    }

    return await this.prisma.user.count({ where: whereClause });
  }

  private async publishCandidateMatchEvent(job: any, response: CandidateMatchResponse): Promise<void> {
    const event: CandidateMatchEvent = {
      jobId: job.id,
      employerId: job.companyId,
      candidatesMatched: response.candidates.length,
      averageScore: response.candidates.reduce((sum, c) => sum + c.overallScore, 0) / response.candidates.length,
      topCandidateScore: response.candidates[0]?.overallScore || 0,
      searchCriteria: response.searchCriteria,
      timestamp: new Date().toISOString()
    };

    this.eventBus.publish('candidate.match', event);
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.CACHE_TTL
    });

    // Clean old cache entries periodically
    if (this.cache.size > 100) {
      this.cleanCache();
    }
  }

  private cleanCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > value.ttl) {
        this.cache.delete(key);
      }
    }
  }
}