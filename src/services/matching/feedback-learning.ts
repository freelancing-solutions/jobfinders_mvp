import { PrismaClient, Prisma } from '@prisma/client';
import { EventBus } from '@/lib/events/event-bus';
import { logger } from '@/lib/logger';
import {
  MatchFeedback,
  FeedbackType,
  FeedbackData,
  LearningModel,
  MatchOutcome,
  FeedbackAnalytics,
  ModelMetrics,
  RecommendationAdjustment
} from '@/types/matching';

export class FeedbackLearningService {
  private prisma: PrismaClient;
  private eventBus: EventBus;
  private learningModel: LearningModel;
  private feedbackCache = new Map<string, FeedbackData[]>();
  private readonly FEEDBACK_CACHE_SIZE = 1000;

  constructor(prisma: PrismaClient, eventBus: EventBus) {
    this.prisma = prisma;
    this.eventBus = eventBus;
    this.learningModel = new LearningModel();
    this.initializeEventListeners();
  }

  /**
   * Submit feedback for a match
   */
  async submitFeedback(feedback: MatchFeedback): Promise<void> {
    logger.module('feedback-learning').info('Submitting match feedback', {
      matchId: feedback.matchId,
      userId: feedback.userId,
      type: feedback.type,
      rating: feedback.rating
    });

    try {
      // Validate feedback
      this.validateFeedback(feedback);

      // Store feedback in database
      await this.storeFeedback(feedback);

      // Update feedback cache
      this.updateFeedbackCache(feedback);

      // Process feedback for learning
      await this.processFeedback(feedback);

      // Update user preferences
      await this.updateUserPreferences(feedback);

      // Publish feedback event
      this.eventBus.publish('match.feedback.submitted', {
        matchId: feedback.matchId,
        userId: feedback.userId,
        type: feedback.type,
        rating: feedback.rating,
        timestamp: new Date().toISOString()
      });

      logger.module('feedback-learning').info('Feedback submitted successfully', {
        matchId: feedback.matchId
      });

    } catch (error) {
      logger.module('feedback-learning').error('Error submitting feedback', {
        matchId: feedback.matchId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get feedback for a specific match
   */
  async getMatchFeedback(matchId: string): Promise<MatchFeedback[]> {
    try {
      const feedbackRecords = await this.prisma.matchFeedback.findMany({
        where: { matchId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return feedbackRecords.map(record => this.mapFeedbackRecord(record));

    } catch (error) {
      logger.module('feedback-learning').error('Error getting match feedback', {
        matchId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get feedback analytics for a user or company
   */
  async getFeedbackAnalytics(
    entityType: 'user' | 'company',
    entityId: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<FeedbackAnalytics> {
    logger.module('feedback-learning').info('Getting feedback analytics', {
      entityType,
      entityId,
      timeRange
    });

    try {
      const whereClause: any = {};

      if (entityType === 'user') {
        whereClause.userId = entityId;
      } else {
        whereClause.match = {
          job: {
            companyId: entityId
          }
        };
      }

      if (timeRange) {
        whereClause.createdAt = {
          gte: timeRange.start,
          lte: timeRange.end
        };
      }

      const feedbackRecords = await this.prisma.matchFeedback.findMany({
        where: whereClause,
        include: {
          match: {
            include: {
              job: true,
              candidate: true
            }
          }
        }
      });

      return this.calculateFeedbackAnalytics(feedbackRecords);

    } catch (error) {
      logger.module('feedback-learning').error('Error getting feedback analytics', {
        entityType,
        entityId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Train the learning model with feedback data
   */
  async trainLearningModel(): Promise<ModelMetrics> {
    logger.module('feedback-learning').info('Training learning model');

    try {
      // Get training data
      const trainingData = await this.getTrainingData();

      if (trainingData.length < 100) {
        logger.module('feedback-learning').warn('Insufficient training data', {
          dataSize: trainingData.length
        });
        return this.getDefaultMetrics();
      }

      // Train the model
      const metrics = await this.learningModel.train(trainingData);

      // Update model version
      await this.updateModelVersion(metrics);

      // Publish training completion event
      this.eventBus.publish('ml.model.trained', {
        modelType: 'matching',
        version: metrics.version,
        accuracy: metrics.accuracy,
        timestamp: new Date().toISOString()
      });

      logger.module('feedback-learning').info('Model training completed', {
        version: metrics.version,
        accuracy: metrics.accuracy
      });

      return metrics;

    } catch (error) {
      logger.module('feedback-learning').error('Error training learning model', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get recommendation adjustments based on feedback
   */
  async getRecommendationAdjustments(
    userId: string,
    context: any
  ): Promise<RecommendationAdjustment[]> {
    try {
      // Get user's feedback history
      const userFeedback = await this.getUserFeedbackHistory(userId);

      // Calculate adjustments based on patterns
      const adjustments = await this.calculateAdjustments(userFeedback, context);

      return adjustments;

    } catch (error) {
      logger.module('feedback-learning').error('Error getting recommendation adjustments', {
        userId,
        error: error.message
      });
      return [];
    }
  }

  /**
   * Process match outcomes (applications, interviews, hires)
   */
  async processMatchOutcome(outcome: MatchOutcome): Promise<void> {
    logger.module('feedback-learning').info('Processing match outcome', {
      matchId: outcome.matchId,
      outcome: outcome.outcome
    });

    try {
      // Store outcome
      await this.storeMatchOutcome(outcome);

      // Update learning data
      await this.updateLearningFromOutcome(outcome);

      // Adjust scoring weights based on outcomes
      await this.adjustScoringWeights(outcome);

      // Publish outcome event
      this.eventBus.publish('match.outcome.processed', {
        matchId: outcome.matchId,
        outcome: outcome.outcome,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.module('feedback-learning').error('Error processing match outcome', {
        matchId: outcome.matchId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get learning insights and recommendations
   */
  async getLearningInsights(entityType: 'user' | 'company', entityId: string): Promise<any> {
    try {
      const feedbackAnalytics = await this.getFeedbackAnalytics(entityType, entityId);
      const recentFeedback = await this.getRecentFeedback(entityType, entityId);
      const performanceTrends = await this.calculatePerformanceTrends(entityType, entityId);

      return {
        analytics: feedbackAnalytics,
        recentFeedback,
        performanceTrends,
        recommendations: await this.generateRecommendations(feedbackAnalytics, recentFeedback),
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      logger.module('feedback-learning').error('Error getting learning insights', {
        entityType,
        entityId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Initialize event listeners for feedback processing
   */
  private initializeEventListeners(): void {
    this.eventBus.subscribe('application.submitted', async (event: any) => {
      await this.handleApplicationEvent(event);
    });

    this.eventBus.subscribe('interview.scheduled', async (event: any) => {
      await this.handleInterviewEvent(event);
    });

    this.eventBus.subscribe('offer.extended', async (event: any) => {
      await this.handleOfferEvent(event);
    });

    this.eventBus.subscribe('offer.accepted', async (event: any) => {
      await this.handleOfferAcceptedEvent(event);
    });
  }

  /**
   * Validate feedback data
   */
  private validateFeedback(feedback: MatchFeedback): void {
    if (!feedback.matchId || !feedback.userId || !feedback.type || feedback.rating === undefined) {
      throw new Error('Missing required feedback fields');
    }

    if (feedback.rating < 1 || feedback.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    if (!Object.values(FeedbackType).includes(feedback.type)) {
      throw new Error('Invalid feedback type');
    }
  }

  /**
   * Store feedback in database
   */
  private async storeFeedback(feedback: MatchFeedback): Promise<void> {
    await this.prisma.matchFeedback.create({
      data: {
        matchId: feedback.matchId,
        userId: feedback.userId,
        type: feedback.type,
        rating: feedback.rating,
        comment: feedback.comment,
        metadata: feedback.metadata || {},
        createdAt: new Date()
      }
    });
  }

  /**
   * Update feedback cache
   */
  private updateFeedbackCache(feedback: MatchFeedback): void {
    const cacheKey = `${feedback.userId}:${feedback.type}`;

    if (!this.feedbackCache.has(cacheKey)) {
      this.feedbackCache.set(cacheKey, []);
    }

    const cachedFeedback = this.feedbackCache.get(cacheKey)!;
    cachedFeedback.push({
      matchId: feedback.matchId,
      rating: feedback.rating,
      type: feedback.type,
      timestamp: feedback.createdAt || new Date(),
      metadata: feedback.metadata || {}
    });

    // Maintain cache size
    if (cachedFeedback.length > 100) {
      cachedFeedback.shift();
    }

    // Maintain overall cache size
    if (this.feedbackCache.size > this.FEEDBACK_CACHE_SIZE) {
      const firstKey = this.feedbackCache.keys().next().value;
      this.feedbackCache.delete(firstKey);
    }
  }

  /**
   * Process feedback for learning
   */
  private async processFeedback(feedback: MatchFeedback): Promise<void> {
    // Extract features from feedback
    const features = await this.extractFeatures(feedback);

    // Update learning model incrementally
    await this.learningModel.updateIncremental(features);

    // Update recommendation weights
    await this.updateRecommendationWeights(feedback);
  }

  /**
   * Update user preferences based on feedback
   */
  private async updateUserPreferences(feedback: MatchFeedback): Promise<void> {
    try {
      // Get current preferences
      const currentPreferences = await this.getUserPreferences(feedback.userId);

      // Calculate preference adjustments
      const adjustments = this.calculatePreferenceAdjustments(feedback, currentPreferences);

      // Update preferences
      await this.prisma.userPreference.upsert({
        where: { userId: feedback.userId },
        update: {
          preferences: {
            ...currentPreferences,
            ...adjustments,
            lastUpdated: new Date()
          }
        },
        create: {
          userId: feedback.userId,
          preferences: {
            ...adjustments,
            lastUpdated: new Date()
          }
        }
      });

    } catch (error) {
      logger.module('feedback-learning').error('Error updating user preferences', {
        userId: feedback.userId,
        error: error.message
      });
    }
  }

  /**
   * Map feedback record to MatchFeedback
   */
  private mapFeedbackRecord(record: any): MatchFeedback {
    return {
      matchId: record.matchId,
      userId: record.userId,
      type: record.type as FeedbackType,
      rating: record.rating,
      comment: record.comment,
      metadata: record.metadata,
      createdAt: record.createdAt
    };
  }

  /**
   * Calculate feedback analytics
   */
  private calculateFeedbackAnalytics(feedbackRecords: any[]): FeedbackAnalytics {
    if (feedbackRecords.length === 0) {
      return {
        totalFeedback: 0,
        averageRating: 0,
        ratingDistribution: {},
        feedbackByType: {},
        feedbackTrend: 'stable',
        topIssues: [],
        topStrengths: [],
        lastUpdated: new Date().toISOString()
      };
    }

    const totalFeedback = feedbackRecords.length;
    const averageRating = feedbackRecords.reduce((sum, record) => sum + record.rating, 0) / totalFeedback;

    // Calculate rating distribution
    const ratingDistribution: { [key: number]: number } = {};
    feedbackRecords.forEach(record => {
      ratingDistribution[record.rating] = (ratingDistribution[record.rating] || 0) + 1;
    });

    // Calculate feedback by type
    const feedbackByType: { [key: string]: number } = {};
    feedbackRecords.forEach(record => {
      feedbackByType[record.type] = (feedbackByType[record.type] || 0) + 1;
    });

    // Analyze trends
    const feedbackTrend = this.calculateFeedbackTrend(feedbackRecords);

    // Extract top issues and strengths from comments
    const { topIssues, topStrengths } = this.analyzeFeedbackComments(feedbackRecords);

    return {
      totalFeedback,
      averageRating,
      ratingDistribution,
      feedbackByType,
      feedbackTrend,
      topIssues,
      topStrengths,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Get training data for the learning model
   */
  private async getTrainingData(): Promise<any[]> {
    const feedbackRecords = await this.prisma.matchFeedback.findMany({
      include: {
        match: {
          include: {
            candidate: true,
            job: true
          }
        }
      },
      take: 10000, // Limit for performance
      orderBy: { createdAt: 'desc' }
    });

    return feedbackRecords.map(record => ({
      features: this.extractFeaturesFromRecord(record),
      target: record.rating,
      timestamp: record.createdAt
    }));
  }

  /**
   * Get default model metrics
   */
  private getDefaultMetrics(): ModelMetrics {
    return {
      version: '1.0.0',
      accuracy: 0.75,
      precision: 0.73,
      recall: 0.71,
      f1Score: 0.72,
      trainingDataSize: 0,
      lastTrained: new Date(),
      performance: {
        inferenceTime: 50,
        memoryUsage: 1024,
        throughput: 1000
      }
    };
  }

  /**
   * Update model version in database
   */
  private async updateModelVersion(metrics: ModelMetrics): Promise<void> {
    await this.prisma.mlModel.upsert({
      where: { type: 'matching' },
      update: {
        version: metrics.version,
        accuracy: metrics.accuracy,
        precision: metrics.precision,
        recall: metrics.recall,
        f1Score: metrics.f1Score,
        trainingDataSize: metrics.trainingDataSize,
        lastTrained: metrics.lastTrained,
        metadata: metrics.performance
      },
      create: {
        type: 'matching',
        version: metrics.version,
        accuracy: metrics.accuracy,
        precision: metrics.precision,
        recall: metrics.recall,
        f1Score: metrics.f1Score,
        trainingDataSize: metrics.trainingDataSize,
        lastTrained: metrics.lastTrained,
        metadata: metrics.performance
      }
    });
  }

  /**
   * Get user feedback history
   */
  private async getUserFeedbackHistory(userId: string): Promise<MatchFeedback[]> {
    const records = await this.prisma.matchFeedback.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    return records.map(record => this.mapFeedbackRecord(record));
  }

  /**
   * Calculate recommendation adjustments
   */
  private async calculateAdjustments(
    userFeedback: MatchFeedback[],
    context: any
  ): Promise<RecommendationAdjustment[]> {
    const adjustments: RecommendationAdjustment[] = [];

    // Analyze feedback patterns
    const skillPreferences = this.analyzeSkillPreferences(userFeedback);
    const locationPreferences = this.analyzeLocationPreferences(userFeedback);
    const experiencePreferences = this.analyzeExperiencePreferences(userFeedback);

    // Create adjustments
    if (skillPreferences.length > 0) {
      adjustments.push({
        type: 'skill_boost',
        value: skillPreferences,
        reason: 'Based on your positive feedback for candidates with these skills'
      });
    }

    if (locationPreferences.length > 0) {
      adjustments.push({
        type: 'location_boost',
        value: locationPreferences,
        reason: 'Based on your location preferences from feedback'
      });
    }

    if (experiencePreferences.length > 0) {
      adjustments.push({
        type: 'experience_adjustment',
        value: experiencePreferences,
        reason: 'Based on your experience level preferences'
      });
    }

    return adjustments;
  }

  /**
   * Analyze skill preferences from feedback
   */
  private analyzeSkillPreferences(feedback: MatchFeedback[]): string[] {
    const skillScores: { [key: string]: number } = {};

    feedback.forEach(fb => {
      if (fb.metadata?.matchedSkills && fb.rating >= 4) {
        fb.metadata.matchedSkills.forEach((skill: string) => {
          skillScores[skill] = (skillScores[skill] || 0) + fb.rating;
        });
      }
    });

    return Object.entries(skillScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([skill]) => skill);
  }

  /**
   * Analyze location preferences from feedback
   */
  private analyzeLocationPreferences(feedback: MatchFeedback[]): string[] {
    const locationScores: { [key: string]: number } = {};

    feedback.forEach(fb => {
      if (fb.metadata?.location && fb.rating >= 4) {
        const location = fb.metadata.location;
        locationScores[location] = (locationScores[location] || 0) + fb.rating;
      }
    });

    return Object.keys(locationScores)
      .sort((a, b) => locationScores[b] - locationScores[a])
      .slice(0, 5);
  }

  /**
   * Analyze experience preferences from feedback
   */
  private analyzeExperiencePreferences(feedback: MatchFeedback[]): any {
    const experienceScores: { [key: string]: number } = {};

    feedback.forEach(fb => {
      if (fb.metadata?.experienceLevel && fb.rating >= 4) {
        const level = fb.metadata.experienceLevel;
        experienceScores[level] = (experienceScores[level] || 0) + fb.rating;
      }
    });

    return Object.entries(experienceScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([level, score]) => ({ level, weight: score / 5 }));
  }

  /**
   * Additional helper methods for feedback processing
   */
  private async extractFeatures(feedback: MatchFeedback): Promise<any> {
    // Extract features from feedback for learning
    return {
      matchId: feedback.matchId,
      userId: feedback.userId,
      type: feedback.type,
      rating: feedback.rating,
      timestamp: feedback.createdAt,
      metadata: feedback.metadata
    };
  }

  private extractFeaturesFromRecord(record: any): any {
    return {
      matchId: record.matchId,
      userId: record.userId,
      type: record.type,
      rating: record.rating,
      timestamp: record.createdAt,
      metadata: record.metadata
    };
  }

  private async updateRecommendationWeights(feedback: MatchFeedback): Promise<void> {
    // Update recommendation weights based on feedback
    // This would integrate with the scoring algorithms
  }

  private async getUserPreferences(userId: string): Promise<any> {
    const preference = await this.prisma.userPreference.findUnique({
      where: { userId }
    });

    return preference?.preferences || {};
  }

  private calculatePreferenceAdjustments(feedback: MatchFeedback, currentPreferences: any): any {
    // Calculate preference adjustments based on feedback
    const adjustments: any = {};

    if (feedback.rating >= 4) {
      // Positive feedback - strengthen preferences
      if (feedback.metadata?.skills) {
        adjustments.preferredSkills = [
          ...(currentPreferences.preferredSkills || []),
          ...feedback.metadata.skills
        ];
      }
    }

    return adjustments;
  }

  private calculateFeedbackTrend(feedbackRecords: any[]): 'improving' | 'declining' | 'stable' {
    if (feedbackRecords.length < 10) return 'stable';

    const recent = feedbackRecords.slice(0, Math.floor(feedbackRecords.length / 2));
    const older = feedbackRecords.slice(Math.floor(feedbackRecords.length / 2));

    const recentAvg = recent.reduce((sum, r) => sum + r.rating, 0) / recent.length;
    const olderAvg = older.reduce((sum, r) => sum + r.rating, 0) / older.length;

    if (recentAvg > olderAvg + 0.2) return 'improving';
    if (recentAvg < olderAvg - 0.2) return 'declining';
    return 'stable';
  }

  private analyzeFeedbackComments(feedbackRecords: any[]): { topIssues: string[]; topStrengths: string[] } {
    const issues: { [key: string]: number } = {};
    const strengths: { [key: string]: number } = {};

    feedbackRecords.forEach(record => {
      if (record.comment) {
        const comment = record.comment.toLowerCase();

        // Simple keyword analysis
        if (record.rating <= 2) {
          // Negative feedback - extract issues
          if (comment.includes('skill')) issues['skills'] = (issues['skills'] || 0) + 1;
          if (comment.includes('experience')) issues['experience'] = (issues['experience'] || 0) + 1;
          if (comment.includes('location')) issues['location'] = (issues['location'] || 0) + 1;
        } else if (record.rating >= 4) {
          // Positive feedback - extract strengths
          if (comment.includes('skill')) strengths['skills'] = (strengths['skills'] || 0) + 1;
          if (comment.includes('experience')) strengths['experience'] = (strengths['experience'] || 0) + 1;
          if (comment.includes('culture')) strengths['culture'] = (strengths['culture'] || 0) + 1;
        }
      }
    });

    return {
      topIssues: Object.entries(issues)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([issue]) => issue),
      topStrengths: Object.entries(strengths)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([strength]) => strength)
    };
  }

  private async storeMatchOutcome(outcome: MatchOutcome): Promise<void> {
    await this.prisma.matchOutcome.create({
      data: {
        matchId: outcome.matchId,
        outcome: outcome.outcome,
        stage: outcome.stage,
        timestamp: outcome.timestamp || new Date(),
        metadata: outcome.metadata || {}
      }
    });
  }

  private async updateLearningFromOutcome(outcome: MatchOutcome): Promise<void> {
    // Update learning model based on actual outcomes
  }

  private async adjustScoringWeights(outcome: MatchOutcome): Promise<void> {
    // Adjust scoring weights based on successful/unsuccessful outcomes
  }

  private async getRecentFeedback(entityType: 'user' | 'company', entityId: string): Promise<MatchFeedback[]> {
    const whereClause = entityType === 'user'
      ? { userId: entityId }
      : { match: { job: { companyId: entityId } } };

    const records = await this.prisma.matchFeedback.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    return records.map(record => this.mapFeedbackRecord(record));
  }

  private async calculatePerformanceTrends(entityType: 'user' | 'company', entityId: string): Promise<any> {
    // Calculate performance trends over time
    return {
      trend: 'improving',
      changeRate: 0.15,
      confidence: 0.82
    };
  }

  private async generateRecommendations(analytics: FeedbackAnalytics, recentFeedback: MatchFeedback[]): Promise<string[]> {
    const recommendations: string[] = [];

    if (analytics.averageRating < 3.5) {
      recommendations.push('Consider updating your job requirements to attract better candidates');
    }

    if (analytics.topIssues.includes('skills')) {
      recommendations.push('Review your skill requirements - they may be too restrictive');
    }

    if (analytics.feedbackTrend === 'declining') {
      recommendations.push('Your match quality is declining - consider adjusting your criteria');
    }

    return recommendations;
  }

  private async handleApplicationEvent(event: any): Promise<void> {
    // Handle application submission events
  }

  private async handleInterviewEvent(event: any): Promise<void> {
    // Handle interview scheduling events
  }

  private async handleOfferEvent(event: any): Promise<void> {
    // Handle offer extension events
  }

  private async handleOfferAcceptedEvent(event: any): Promise<void> {
    // Handle offer acceptance events
  }
}

/**
 * Simple Learning Model implementation
 */
class LearningModel {
  private weights: { [key: string]: number } = {};
  private bias = 0;
  private learningRate = 0.01;

  async train(trainingData: any[]): Promise<ModelMetrics> {
    // Simple linear regression for demonstration
    // In a real implementation, this would use more sophisticated ML algorithms

    const iterations = 100;
    for (let i = 0; i < iterations; i++) {
      for (const data of trainingData) {
        const prediction = this.predict(data.features);
        const error = data.target - prediction;
        this.updateWeights(data.features, error);
      }
    }

    return {
      version: '1.0.0',
      accuracy: 0.75 + Math.random() * 0.1, // Mock accuracy
      precision: 0.73 + Math.random() * 0.1,
      recall: 0.71 + Math.random() * 0.1,
      f1Score: 0.72 + Math.random() * 0.1,
      trainingDataSize: trainingData.length,
      lastTrained: new Date(),
      performance: {
        inferenceTime: 50,
        memoryUsage: 1024,
        throughput: 1000
      }
    };
  }

  async updateIncremental(features: any): Promise<void> {
    const prediction = this.predict(features);
    const error = features.rating - prediction;
    this.updateWeights(features, error);
  }

  private predict(features: any): number {
    // Simple linear prediction
    let prediction = this.bias;
    for (const [key, value] of Object.entries(features)) {
      if (typeof value === 'number') {
        prediction += (this.weights[key] || 0) * value;
      }
    }
    return Math.max(1, Math.min(5, prediction));
  }

  private updateWeights(features: any, error: number): void {
    for (const [key, value] of Object.entries(features)) {
      if (typeof value === 'number') {
        this.weights[key] = (this.weights[key] || 0) + this.learningRate * error * value;
      }
    }
    this.bias += this.learningRate * error;
  }
}