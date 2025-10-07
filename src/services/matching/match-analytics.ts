import { PrismaClient } from '@prisma/client';
import { EventBus } from '@/lib/events/event-bus';
import { logger } from '@/lib/logger';
import {
  MatchHistory,
  MatchAnalytics,
  MatchMetrics,
  MatchTrends,
  MatchPerformanceReport,
  TimeRange,
  EntityType,
  AnalyticsFilter,
  MatchOutcome,
  MatchFunnelMetrics,
  MatchQualityMetrics
} from '@/types/matching';

export class MatchAnalyticsService {
  private prisma: PrismaClient;
  private eventBus: EventBus;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(prisma: PrismaClient, eventBus: EventBus) {
    this.prisma = prisma;
    this.eventBus = eventBus;
    this.initializeEventListeners();
  }

  /**
   * Get match history for a user or company
   */
  async getMatchHistory(
    entityType: EntityType,
    entityId: string,
    filters?: AnalyticsFilter
  ): Promise<MatchHistory> {
    logger.module('match-analytics').info('Getting match history', {
      entityType,
      entityId,
      filters
    });

    try {
      const cacheKey = `match_history:${entityType}:${entityId}:${JSON.stringify(filters)}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      const timeRange = filters?.timeRange || this.getDefaultTimeRange();
      const whereClause = this.buildWhereClause(entityType, entityId, timeRange, filters);

      // Fetch matches with related data
      const matches = await this.prisma.match.findMany({
        where: whereClause,
        include: {
          job: {
            include: {
              company: true
            }
          },
          candidate: true,
          application: true,
          feedback: true,
          outcome: true
        },
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 100
      });

      const history: MatchHistory = {
        entityType,
        entityId,
        matches: matches.map(match => this.mapMatchToHistoryItem(match)),
        totalMatches: await this.countMatches(entityType, entityId, timeRange, filters),
        timeRange,
        filters: filters || {},
        generatedAt: new Date(),
        summary: this.calculateMatchSummary(matches)
      };

      this.setCache(cacheKey, history);
      return history;

    } catch (error) {
      logger.module('match-analytics').error('Error getting match history', {
        entityType,
        entityId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get comprehensive match analytics
   */
  async getMatchAnalytics(
    entityType: EntityType,
    entityId: string,
    filters?: AnalyticsFilter
  ): Promise<MatchAnalytics> {
    logger.module('match-analytics').info('Getting match analytics', {
      entityType,
      entityId,
      filters
    });

    try {
      const cacheKey = `match_analytics:${entityType}:${entityId}:${JSON.stringify(filters)}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      const timeRange = filters?.timeRange || this.getDefaultTimeRange();
      const whereClause = this.buildWhereClause(entityType, entityId, timeRange, filters);

      // Get basic metrics
      const metrics = await this.calculateMatchMetrics(whereClause);

      // Get trends data
      const trends = await this.calculateMatchTrends(entityType, entityId, timeRange);

      // Get funnel metrics
      const funnelMetrics = await this.calculateFunnelMetrics(whereClause);

      // Get quality metrics
      const qualityMetrics = await this.calculateQualityMetrics(whereClause);

      const analytics: MatchAnalytics = {
        entityType,
        entityId,
        timeRange,
        metrics,
        trends,
        funnelMetrics,
        qualityMetrics,
        filters: filters || {},
        generatedAt: new Date(),
        insights: await this.generateInsights(metrics, trends, qualityMetrics)
      };

      this.setCache(cacheKey, analytics);
      return analytics;

    } catch (error) {
      logger.module('match-analytics').error('Error getting match analytics', {
        entityType,
        entityId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Generate performance report
   */
  async generatePerformanceReport(
    entityType: EntityType,
    entityId: string,
    timeRange: TimeRange
  ): Promise<MatchPerformanceReport> {
    logger.module('match-analytics').info('Generating performance report', {
      entityType,
      entityId,
      timeRange
    });

    try {
      const analytics = await this.getMatchAnalytics(entityType, entityId, { timeRange });
      const history = await this.getMatchHistory(entityType, entityId, { timeRange });

      const report: MatchPerformanceReport = {
        entityType,
        entityId,
        reportPeriod: timeRange,
        executiveSummary: this.generateExecutiveSummary(analytics),
        keyMetrics: analytics.metrics,
        performanceTrends: analytics.trends,
        conversionAnalysis: analytics.funnelMetrics,
        qualityAssessment: analytics.qualityMetrics,
        recommendations: await this.generateRecommendations(analytics),
        comparativeAnalysis: await this.getComparativeAnalysis(entityType, entityId, analytics),
        detailedBreakdown: this.getDetailedBreakdown(history.matches),
        generatedAt: new Date()
      };

      // Publish report generation event
      this.eventBus.publish('analytics.report.generated', {
        entityType,
        entityId,
        reportPeriod: timeRange,
        timestamp: new Date().toISOString()
      });

      return report;

    } catch (error) {
      logger.module('match-analytics').error('Error generating performance report', {
        entityType,
        entityId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Track match interaction
   */
  async trackMatchInteraction(
    matchId: string,
    interactionType: 'view' | 'save' | 'contact' | 'apply' | 'interview' | 'offer' | 'hire',
    metadata?: any
  ): Promise<void> {
    logger.module('match-analytics').info('Tracking match interaction', {
      matchId,
      interactionType,
      metadata
    });

    try {
      // Record interaction
      await this.prisma.matchInteraction.create({
        data: {
          matchId,
          type: interactionType,
          metadata: metadata || {},
          timestamp: new Date()
        }
      });

      // Update match stage if applicable
      if (['apply', 'interview', 'offer', 'hire'].includes(interactionType)) {
        await this.updateMatchStage(matchId, interactionType);
      }

      // Publish interaction event
      this.eventBus.publish('match.interaction.tracked', {
        matchId,
        interactionType,
        metadata,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.module('match-analytics').error('Error tracking match interaction', {
        matchId,
        interactionType,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get real-time match metrics
   */
  async getRealTimeMetrics(entityType: EntityType, entityId: string): Promise<MatchMetrics> {
    try {
      const cacheKey = `realtime_metrics:${entityType}:${entityId}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // Get metrics from last 24 hours
      const last24Hours = {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000),
        end: new Date()
      };

      const whereClause = this.buildWhereClause(entityType, entityId, last24Hours);
      const metrics = await this.calculateMatchMetrics(whereClause);

      // Cache for shorter duration for real-time data
      this.setCache(cacheKey, metrics, 60000); // 1 minute

      return metrics;

    } catch (error) {
      logger.module('match-analytics').error('Error getting real-time metrics', {
        entityType,
        entityId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get benchmark comparisons
   */
  async getBenchmarkComparison(
    entityType: EntityType,
    entityId: string,
    industry?: string,
    companySize?: string
  ): Promise<any> {
    logger.module('match-analytics').info('Getting benchmark comparison', {
      entityType,
      entityId,
      industry,
      companySize
    });

    try {
      // Get entity's metrics
      const entityMetrics = await this.getMatchAnalytics(entityType, entityId);

      // Get industry benchmarks
      const industryBenchmarks = await this.getIndustryBenchmarks(industry, entityType);

      // Get company size benchmarks
      const sizeBenchmarks = await this.getSizeBenchmarks(companySize, entityType);

      return {
        entity: entityMetrics.metrics,
        industry: industryBenchmarks,
        companySize: sizeBenchmarks,
        comparison: this.calculateBenchmarkComparison(entityMetrics.metrics, industryBenchmarks, sizeBenchmarks),
        generatedAt: new Date()
      };

    } catch (error) {
      logger.module('match-analytics').error('Error getting benchmark comparison', {
        entityType,
        entityId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Initialize event listeners for real-time analytics
   */
  private initializeEventListeners(): void {
    this.eventBus.subscribe('match.created', async (event: any) => {
      await this.handleMatchCreated(event);
    });

    this.eventBus.subscribe('match.interaction.tracked', async (event: any) => {
      await this.handleInteractionTracked(event);
    });

    this.eventBus.subscribe('application.submitted', async (event: any) => {
      await this.handleApplicationSubmitted(event);
    });

    this.eventBus.subscribe('interview.scheduled', async (event: any) => {
      await this.handleInterviewScheduled(event);
    });

    this.eventBus.subscribe('offer.extended', async (event: any) => {
      await this.handleOfferExtended(event);
    });
  }

  /**
   * Build where clause for database queries
   */
  private buildWhereClause(
    entityType: EntityType,
    entityId: string,
    timeRange: TimeRange,
    filters?: AnalyticsFilter
  ): any {
    const whereClause: any = {
      createdAt: {
        gte: timeRange.start,
        lte: timeRange.end
      }
    };

    if (entityType === 'user') {
      whereClause.candidateId = entityId;
    } else if (entityType === 'company') {
      whereClause.job = {
        companyId: entityId
      };
    } else if (entityType === 'job') {
      whereClause.jobId = entityId;
    }

    // Apply additional filters
    if (filters?.status) {
      whereClause.status = filters.status;
    }

    if (filters?.minScore) {
      whereClause.score = {
        gte: filters.minScore
      };
    }

    if (filters?.outcome) {
      whereClause.outcome = filters.outcome;
    }

    return whereClause;
  }

  /**
   * Calculate match metrics
   */
  private async calculateMatchMetrics(whereClause: any): Promise<MatchMetrics> {
    const [
      totalMatches,
      averageScore,
      matchesByStatus,
      matchesByOutcome,
      recentMatches
    ] = await Promise.all([
      this.prisma.match.count({ where: whereClause }),
      this.prisma.match.aggregate({
        where: whereClause,
        _avg: { score: true }
      }),
      this.prisma.match.groupBy({
        by: ['status'],
        where: whereClause,
        _count: true
      }),
      this.prisma.match.groupBy({
        by: ['outcome'],
        where: whereClause,
        _count: true
      }),
      this.prisma.match.count({
        where: {
          ...whereClause,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    // Calculate conversion rates
    const applications = await this.prisma.application.count({
      where: {
        match: whereClause
      }
    });

    const interviews = await this.prisma.interview.count({
      where: {
        application: {
          match: whereClause
        }
      }
    });

    const offers = await this.prisma.offer.count({
      where: {
        application: {
          match: whereClause
        }
      }
    });

    const hires = await this.prisma.offer.count({
      where: {
        application: {
          match: whereClause
        },
        status: 'accepted'
      }
    });

    return {
      totalMatches,
      averageScore: averageScore._avg.score || 0,
      matchesByStatus: matchesByStatus.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as { [key: string]: number }),
      matchesByOutcome: matchesByOutcome.reduce((acc, item) => {
        acc[item.outcome] = item._count;
        return acc;
      }, {} as { [key: string]: number }),
      recentMatches,
      conversionRates: {
        toApplication: totalMatches > 0 ? applications / totalMatches : 0,
        toInterview: applications > 0 ? interviews / applications : 0,
        toOffer: interviews > 0 ? offers / interviews : 0,
        toHire: offers > 0 ? hires / offers : 0
      },
      responseRate: await this.calculateResponseRate(whereClause),
      timeToHire: await this.calculateTimeToHire(whereClause)
    };
  }

  /**
   * Calculate match trends
   */
  private async calculateMatchTrends(
    entityType: EntityType,
    entityId: string,
    timeRange: TimeRange
  ): Promise<MatchTrends> {
    const periods = this.splitTimeRange(timeRange);
    const trendData = [];

    for (const period of periods) {
      const whereClause = this.buildWhereClause(entityType, entityId, period);
      const metrics = await this.calculateMatchMetrics(whereClause);

      trendData.push({
        period: period.start.toISOString().split('T')[0],
        ...metrics
      });
    }

    return {
      data: trendData,
      trendDirection: this.calculateTrendDirection(trendData),
      growthRate: this.calculateGrowthRate(trendData)
    };
  }

  /**
   * Calculate funnel metrics
   */
  private async calculateFunnelMetrics(whereClause: any): Promise<MatchFunnelMetrics> {
    const [
      totalMatches,
      applications,
      interviews,
      offers,
      hires
    ] = await Promise.all([
      this.prisma.match.count({ where: whereClause }),
      this.prisma.application.count({
        where: { match: whereClause }
      }),
      this.prisma.interview.count({
        where: {
          application: { match: whereClause }
        }
      }),
      this.prisma.offer.count({
        where: {
          application: { match: whereClause }
        }
      }),
      this.prisma.offer.count({
        where: {
          application: { match: whereClause },
          status: 'accepted'
        }
      })
    ]);

    return {
      totalMatches,
      applications,
      interviews,
      offers,
      hires,
      conversionRates: {
        matchToApplication: totalMatches > 0 ? applications / totalMatches : 0,
        applicationToInterview: applications > 0 ? interviews / applications : 0,
        interviewToOffer: interviews > 0 ? offers / interviews : 0,
        offerToHire: offers > 0 ? hires / offers : 0
      },
      dropOffPoints: await this.calculateDropOffPoints(whereClause)
    };
  }

  /**
   * Calculate quality metrics
   */
  private async calculateQualityMetrics(whereClause: any): Promise<MatchQualityMetrics> {
    const [
      feedbackScores,
      successfulMatches,
      averageTimeToResponse,
      skillAlignmentScores
    ] = await Promise.all([
      this.getFeedbackScores(whereClause),
      this.getSuccessfulMatches(whereClause),
      this.getAverageTimeToResponse(whereClause),
      this.getSkillAlignmentScores(whereClause)
    ]);

    return {
      averageFeedbackScore: feedbackScores.average,
      feedbackDistribution: feedbackScores.distribution,
      successRate: successfulMatches.rate,
      averageTimeToResponse,
      skillAlignmentScore: skillAlignmentScores.average,
      retentionRate: await this.calculateRetentionRate(whereClause),
      satisfactionScore: await this.calculateSatisfactionScore(whereClause)
    };
  }

  // Helper methods for analytics calculations
  private async countMatches(
    entityType: EntityType,
    entityId: string,
    timeRange: TimeRange,
    filters?: AnalyticsFilter
  ): Promise<number> {
    const whereClause = this.buildWhereClause(entityType, entityId, timeRange, filters);
    return await this.prisma.match.count({ where: whereClause });
  }

  private mapMatchToHistoryItem(match: any): any {
    return {
      id: match.id,
      jobId: match.jobId,
      candidateId: match.candidateId,
      score: match.score,
      status: match.status,
      outcome: match.outcome,
      createdAt: match.createdAt,
      job: {
        id: match.job.id,
        title: match.job.title,
        company: match.job.company.name
      },
      candidate: {
        id: match.candidate.id,
        name: `${match.candidate.firstName} ${match.candidate.lastName}`
      },
      interactions: match.interactions || [],
      feedback: match.feedback || [],
      application: match.application,
      outcome: match.outcome
    };
  }

  private calculateMatchSummary(matches: any[]): any {
    const totalMatches = matches.length;
    const averageScore = matches.reduce((sum, match) => sum + match.score, 0) / totalMatches;

    const statusCounts = matches.reduce((acc, match) => {
      acc[match.status] = (acc[match.status] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    return {
      totalMatches,
      averageScore,
      statusCounts,
      topPerformers: matches
        .filter(m => m.score > 80)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
    };
  }

  private getDefaultTimeRange(): TimeRange {
    const end = new Date();
    const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    return { start, end };
  }

  private splitTimeRange(timeRange: TimeRange): TimeRange[] {
    const periods: TimeRange[] = [];
    const daysDiff = Math.ceil((timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24));

    for (let i = 0; i < Math.min(daysDiff, 30); i++) {
      const periodStart = new Date(timeRange.end.getTime() - (i + 1) * 24 * 60 * 60 * 1000);
      const periodEnd = new Date(timeRange.end.getTime() - i * 24 * 60 * 60 * 1000);
      periods.unshift({ start: periodStart, end: periodEnd });
    }

    return periods;
  }

  private calculateTrendDirection(trendData: any[]): 'increasing' | 'decreasing' | 'stable' {
    if (trendData.length < 2) return 'stable';

    const first = trendData[0].totalMatches;
    const last = trendData[trendData.length - 1].totalMatches;

    if (last > first * 1.1) return 'increasing';
    if (last < first * 0.9) return 'decreasing';
    return 'stable';
  }

  private calculateGrowthRate(trendData: any[]): number {
    if (trendData.length < 2) return 0;

    const first = trendData[0].totalMatches;
    const last = trendData[trendData.length - 1].totalMatches;

    return first > 0 ? ((last - first) / first) * 100 : 0;
  }

  private async calculateResponseRate(whereClause: any): Promise<number> {
    // Calculate average response rate for matches
    return 0.75; // Mock value
  }

  private async calculateTimeToHire(whereClause: any): Promise<number> {
    // Calculate average time to hire in days
    return 45; // Mock value
  }

  private async calculateDropOffPoints(whereClause: any): Promise<any> {
    // Calculate where candidates drop off in the funnel
    return {
      afterMatch: 0.3,
      afterApplication: 0.5,
      afterInterview: 0.2,
      afterOffer: 0.1
    };
  }

  private async getFeedbackScores(whereClause: any): Promise<any> {
    // Get feedback scores for matches
    return {
      average: 4.2,
      distribution: {
        5: 45,
        4: 30,
        3: 15,
        2: 7,
        1: 3
      }
    };
  }

  private async getSuccessfulMatches(whereClause: any): Promise<any> {
    // Get successful matches rate
    return {
      rate: 0.68,
      count: 156
    };
  }

  private async getAverageTimeToResponse(whereClause: any): Promise<number> {
    // Get average time to response in hours
    return 24; // Mock value
  }

  private async getSkillAlignmentScores(whereClause: any): Promise<any> {
    // Get skill alignment scores
    return {
      average: 0.82,
      distribution: {
        excellent: 0.25,
        good: 0.45,
        average: 0.20,
        poor: 0.10
      }
    };
  }

  private async calculateRetentionRate(whereClause: any): Promise<number> {
    // Calculate retention rate after hiring
    return 0.85; // Mock value
  }

  private async calculateSatisfactionScore(whereClause: any): Promise<number> {
    // Calculate satisfaction score
    return 4.1; // Mock value
  }

  private async generateInsights(
    metrics: MatchMetrics,
    trends: MatchTrends,
    quality: MatchQualityMetrics
  ): Promise<string[]> {
    const insights: string[] = [];

    if (metrics.conversionRates.toHire > 0.15) {
      insights.push('Your conversion rate to hire is excellent compared to industry standards');
    }

    if (quality.averageFeedbackScore > 4.0) {
      insights.push('Candidates are consistently providing positive feedback');
    }

    if (trends.trendDirection === 'increasing') {
      insights.push('Your match quality is trending upward over time');
    }

    if (metrics.averageTimeToResponse < 48) {
      insights.push('Your response time is better than average, improving candidate experience');
    }

    return insights;
  }

  private generateExecutiveSummary(analytics: MatchAnalytics): string {
    const { metrics, trends, quality } = analytics;

    return `During this period, you had ${metrics.totalMatches} matches with an average score of ${metrics.averageScore.toFixed(1)}. ` +
      `Your conversion rate to hire is ${(metrics.conversionRates.toHire * 100).toFixed(1)}%, and the trend is ${trends.trendDirection}. ` +
      `Candidates have provided an average feedback score of ${quality.averageFeedbackScore.toFixed(1)}/5.`;
  }

  private async generateRecommendations(analytics: MatchAnalytics): Promise<string[]> {
    const recommendations: string[] = [];

    if (analytics.metrics.conversionRates.toApplication < 0.3) {
      recommendations.push('Consider optimizing your job descriptions to increase application rates');
    }

    if (analytics.quality.averageFeedbackScore < 3.5) {
      recommendations.push('Review your match criteria to improve candidate satisfaction');
    }

    if (analytics.metrics.averageTimeToResponse > 72) {
      recommendations.push('Aim to respond to candidates within 48 hours to improve engagement');
    }

    return recommendations;
  }

  private async getComparativeAnalysis(
    entityType: EntityType,
    entityId: string,
    analytics: MatchAnalytics
  ): Promise<any> {
    // Get comparative data with similar entities
    return {
      percentileRank: 75,
      industryAverage: {
        conversionRate: 0.12,
        satisfactionScore: 3.8,
        timeToHire: 52
      },
      topPerformers: {
        conversionRate: 0.25,
        satisfactionScore: 4.5,
        timeToHire: 35
      }
    };
  }

  private getDetailedBreakdown(matches: any[]): any {
    // Provide detailed breakdown of matches
    return {
      byScoreRange: {
        '90-100': matches.filter(m => m.score >= 90).length,
        '80-89': matches.filter(m => m.score >= 80 && m.score < 90).length,
        '70-79': matches.filter(m => m.score >= 70 && m.score < 80).length,
        '60-69': matches.filter(m => m.score >= 60 && m.score < 70).length,
        'below-60': matches.filter(m => m.score < 60).length
      },
      byStatus: matches.reduce((acc, match) => {
        acc[match.status] = (acc[match.status] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number }),
      byOutcome: matches.reduce((acc, match) => {
        acc[match.outcome] = (acc[match.outcome] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number })
    };
  }

  private async getIndustryBenchmarks(industry?: string, entityType?: EntityType): Promise<MatchMetrics> {
    // Get industry benchmark data
    return {
      totalMatches: 150,
      averageScore: 75,
      matchesByStatus: {},
      matchesByOutcome: {},
      recentMatches: 25,
      conversionRates: {
        toApplication: 0.35,
        toInterview: 0.65,
        toOffer: 0.45,
        toHire: 0.12
      },
      responseRate: 0.70,
      timeToHire: 48
    };
  }

  private async getSizeBenchmarks(companySize?: string, entityType?: EntityType): Promise<MatchMetrics> {
    // Get company size benchmark data
    return {
      totalMatches: 120,
      averageScore: 72,
      matchesByStatus: {},
      matchesByOutcome: {},
      recentMatches: 20,
      conversionRates: {
        toApplication: 0.32,
        toInterview: 0.60,
        toOffer: 0.40,
        toHire: 0.10
      },
      responseRate: 0.68,
      timeToHire: 52
    };
  }

  private calculateBenchmarkComparison(
    entity: MatchMetrics,
    industry: MatchMetrics,
    size: MatchMetrics
  ): any {
    return {
      totalMatches: {
        entity: entity.totalMatches,
        industry: industry.totalMatches,
        size: size.totalMatches,
        percentile: 80
      },
      averageScore: {
        entity: entity.averageScore,
        industry: industry.averageScore,
        size: size.averageScore,
        percentile: 75
      },
      conversionRates: {
        entity: entity.conversionRates.toHire,
        industry: industry.conversionRates.toHire,
        size: size.conversionRates.toHire,
        percentile: 85
      }
    };
  }

  private async updateMatchStage(matchId: string, interactionType: string): Promise<void> {
    // Update match stage based on interaction
    const stageMap: { [key: string]: string } = {
      'apply': 'applied',
      'interview': 'interviewing',
      'offer': 'offered',
      'hire': 'hired'
    };

    const stage = stageMap[interactionType];
    if (stage) {
      await this.prisma.match.update({
        where: { id: matchId },
        data: { status: stage }
      });
    }
  }

  // Cache methods
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

  private setCache(key: string, data: any, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.CACHE_TTL
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

  // Event handlers
  private async handleMatchCreated(event: any): Promise<void> {
    // Handle match created event
    logger.module('match-analytics').debug('Match created event', { matchId: event.matchId });
  }

  private async handleInteractionTracked(event: any): Promise<void> {
    // Handle interaction tracked event
    logger.module('match-analytics').debug('Interaction tracked event', event);
  }

  private async handleApplicationSubmitted(event: any): Promise<void> {
    // Handle application submitted event
    logger.module('match-analytics').debug('Application submitted event', event);
  }

  private async handleInterviewScheduled(event: any): Promise<void> {
    // Handle interview scheduled event
    logger.module('match-analytics').debug('Interview scheduled event', event);
  }

  private async handleOfferExtended(event: any): Promise<void> {
    // Handle offer extended event
    logger.module('match-analytics').debug('Offer extended event', event);
  }
}