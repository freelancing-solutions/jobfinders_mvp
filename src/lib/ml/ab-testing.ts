import {
  CandidateProfile,
  JobProfile,
  MLModel,
  PredictionResult,
  ABTestConfig,
  ABTestResult,
  ABTestStatus
} from '@/types/matching';
import { logger } from '@/lib/logging/logger';
import { EventEmitter } from 'events';

/**
 * A/B test configuration
 */
export interface ABTestingOptions {
  enabled: boolean;
  trafficSplit: number;
  minSampleSize: number;
  confidenceLevel: number;
  maxTestDuration: number; // in days
  enableAutoWinnerSelection: boolean;
  winnerSelectionThreshold: number;
}

/**
 * A/B test participant
 */
interface ABTestParticipant {
  userId: string;
  groupId: 'control' | 'treatment';
  assignedAt: Date;
  modelId: string;
}

/**
 * A/B test metrics
 */
interface ABTestMetrics {
  controlGroup: {
    participants: number;
    conversions: number;
    averageScore: number;
    averageConfidence: number;
    userSatisfaction: number;
  };
  treatmentGroup: {
    participants: number;
    conversions: number;
    averageScore: number;
    averageConfidence: number;
    userSatisfaction: number;
  };
  statisticalSignificance: {
    pValue: number;
    confidenceInterval: [number, number];
    isSignificant: boolean;
    recommendedWinner: 'control' | 'treatment' | 'inconclusive';
  };
}

/**
 * A/B test definition
 */
interface ABTest {
  id: string;
  name: string;
  description: string;
  controlModel: MLModel;
  treatmentModel: MLModel;
  status: ABTestStatus;
  config: ABTestingOptions;
  createdAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  participants: ABTestParticipant[];
  metrics?: ABTestMetrics;
  results?: ABTestResult;
}

/**
 * Advanced A/B testing framework for ML models
 */
export class ABTestingFramework extends EventEmitter {
  private config: ABTestingOptions;
  private activeTests: Map<string, ABTest> = new Map();
  private participants: Map<string, ABTestParticipant> = new Map(); // userId -> participant
  private metricsHistory: Map<string, ABTestMetrics[]> = new Map();

  constructor(config?: Partial<ABTestingOptions>) {
    super();

    this.config = {
      enabled: true,
      trafficSplit: 0.1, // 10% traffic to treatment
      minSampleSize: 1000,
      confidenceLevel: 0.95,
      maxTestDuration: 30, // 30 days
      enableAutoWinnerSelection: true,
      winnerSelectionThreshold: 0.8,
      ...config
    };
  }

  /**
   * Initialize the A/B testing framework
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing A/B testing framework');

      // Load active tests from database
      await this.loadActiveTests();

      // Load existing participants
      await this.loadParticipants();

      // Start periodic evaluation
      this.startPeriodicEvaluation();

      logger.info('A/B testing framework initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize A/B testing framework', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Create a new A/B test
   */
  async createTest(
    name: string,
    description: string,
    controlModel: MLModel,
    treatmentModel: MLModel,
    options?: Partial<ABTestingOptions>
  ): Promise<string> {
    try {
      const testId = `ab_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const test: ABTest = {
        id: testId,
        name,
        description,
        controlModel,
        treatmentModel,
        status: 'created',
        config: { ...this.config, ...options },
        createdAt: new Date(),
        participants: []
      };

      // Save test to database
      await this.saveTest(test);

      // Add to active tests
      this.activeTests.set(testId, test);

      logger.info('A/B test created', {
        testId,
        name,
        controlModelId: controlModel.id,
        treatmentModelId: treatmentModel.id
      });

      this.emit('testCreated', { test });

      return testId;
    } catch (error) {
      logger.error('Failed to create A/B test', {
        name,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Start an A/B test
   */
  async startTest(testId: string): Promise<void> {
    try {
      const test = this.activeTests.get(testId);
      if (!test) {
        throw new Error(`Test not found: ${testId}`);
      }

      if (test.status !== 'created') {
        throw new Error(`Test cannot be started. Current status: ${test.status}`);
      }

      test.status = 'running';
      test.startedAt = new Date();

      // Save test status
      await this.updateTest(test);

      logger.info('A/B test started', {
        testId,
        name: test.name,
        trafficSplit: test.config.trafficSplit
      });

      this.emit('testStarted', { test });
    } catch (error) {
      logger.error('Failed to start A/B test', {
        testId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Make a prediction using A/B testing
   */
  async predict(
    candidate: CandidateProfile,
    job: JobProfile,
    defaultModelId?: string
  ): Promise<PredictionResult> {
    try {
      if (!this.config.enabled) {
        // A/B testing disabled, use default model
        throw new Error('A/B testing is disabled');
      }

      // Get or assign user to test group
      const participant = await this.getOrAssignParticipant(candidate.userId, job.userId);

      if (!participant) {
        // No active test, use default model
        throw new Error('No active A/B test available');
      }

      const test = this.activeTests.get(participant.modelId);
      if (!test || test.status !== 'running') {
        throw new Error('A/B test is not running');
      }

      // Use appropriate model based on group assignment
      const model = participant.groupId === 'control' ? test.controlModel : test.treatmentModel;

      // Get prediction from model server (this would be injected)
      const prediction = await this.getModelPrediction(model, candidate, job);

      // Add A/B testing metadata
      prediction.metadata = {
        ...prediction.metadata,
        abTest: {
          testId: test.id,
          groupId: participant.groupId,
          modelId: model.id,
          modelName: model.name
        }
      };

      logger.debug('A/B test prediction made', {
        testId: test.id,
        groupId: participant.groupId,
        modelId: model.id,
        score: prediction.prediction
      });

      this.emit('predictionMade', {
        test,
        participant,
        prediction
      });

      return prediction;
    } catch (error) {
      logger.error('A/B test prediction failed', {
        candidateId: candidate.id,
        jobId: job.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Record user feedback/conversion
   */
  async recordConversion(
    userId: string,
    prediction: PredictionResult,
    conversionType: 'positive' | 'negative' | 'neutral',
    metadata?: any
  ): Promise<void> {
    try {
      const participant = this.participants.get(userId);
      if (!participant) {
        logger.warn('Conversion recorded for non-participant', { userId });
        return;
      }

      const test = this.activeTests.get(participant.modelId);
      if (!test) {
        logger.warn('Conversion recorded for inactive test', {
          testId: participant.modelId,
          userId
        });
        return;
      }

      // Record conversion
      await this.saveConversion({
        userId,
        testId: test.id,
        groupId: participant.groupId,
        modelId: participant.modelId,
        predictionId: prediction.metadata?.requestId,
        conversionType,
        predictionScore: prediction.prediction,
        confidence: prediction.confidence,
        timestamp: new Date(),
        metadata
      });

      logger.debug('Conversion recorded', {
        userId,
        testId: test.id,
        groupId: participant.groupId,
        conversionType,
        score: prediction.prediction
      });

      this.emit('conversionRecorded', {
        test,
        participant,
        conversionType,
        prediction
      });

      // Check if test should be evaluated
      await this.evaluateTest(test.id);
    } catch (error) {
      logger.error('Failed to record conversion', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get test status and metrics
   */
  getTestStatus(testId: string): ABTest | null {
    return this.activeTests.get(testId) || null;
  }

  /**
   * Get all active tests
   */
  getActiveTests(): ABTest[] {
    return Array.from(this.activeTests.values()).filter(test => test.status === 'running');
  }

  /**
   * Get test results
   */
  async getTestResults(testId: string): Promise<ABTestResult | null> {
    const test = this.activeTests.get(testId);
    if (!test) {
      return null;
    }

    // Calculate current metrics
    const metrics = await this.calculateTestMetrics(test);

    return {
      testId: test.id,
      testName: test.name,
      status: test.status,
      controlModel: test.controlModel,
      treatmentModel: test.treatmentModel,
      metrics: {
        participants: metrics.controlGroup.participants + metrics.treatmentGroup.participants,
        controlConversions: metrics.controlGroup.conversions,
        treatmentConversions: metrics.treatmentGroup.conversions,
        controlConversionRate: metrics.controlGroup.participants > 0 ?
          metrics.controlGroup.conversions / metrics.controlGroup.participants : 0,
        treatmentConversionRate: metrics.treatmentGroup.participants > 0 ?
          metrics.treatmentGroup.conversions / metrics.treatmentGroup.participants : 0,
        averageScore: (metrics.controlGroup.averageScore + metrics.treatmentGroup.averageScore) / 2,
        statisticalSignificance: metrics.statisticalSignificance
      },
      recommendation: this.generateRecommendation(metrics),
      createdAt: test.createdAt,
      startedAt: test.startedAt,
      endedAt: test.endedAt,
      duration: test.startedAt ?
        (test.endedAt || new Date()).getTime() - test.startedAt.getTime() : 0
    };
  }

  /**
   * Stop a test
   */
  async stopTest(testId: string, reason?: string): Promise<void> {
    try {
      const test = this.activeTests.get(testId);
      if (!test) {
        throw new Error(`Test not found: ${testId}`);
      }

      test.status = 'stopped';
      test.endedAt = new Date();

      // Calculate final metrics
      test.metrics = await this.calculateTestMetrics(test);
      test.results = await this.getTestResults(testId);

      // Save test status
      await this.updateTest(test);

      logger.info('A/B test stopped', {
        testId,
        name: test.name,
        reason,
        duration: test.endedAt.getTime() - (test.startedAt?.getTime() || test.endedAt.getTime())
      });

      this.emit('testStopped', { test, reason });
    } catch (error) {
      logger.error('Failed to stop A/B test', {
        testId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Private methods
  private async loadActiveTests(): Promise<void> {
    // Load active tests from database
    // Implementation depends on your database setup
    logger.info('Loaded active tests from database');
  }

  private async loadParticipants(): Promise<void> {
    // Load existing participants from database
    // Implementation depends on your database setup
    logger.info('Loaded participants from database');
  }

  private async saveTest(test: ABTest): Promise<void> {
    // Save test to database
    // Implementation depends on your database setup
  }

  private async updateTest(test: ABTest): Promise<void> {
    // Update test in database
    // Implementation depends on your database setup
  }

  private async saveConversion(conversion: any): Promise<void> {
    // Save conversion to database
    // Implementation depends on your database setup
  }

  private startPeriodicEvaluation(): void {
    // Evaluate tests every hour
    setInterval(async () => {
      await this.evaluateAllTests();
    }, 60 * 60 * 1000);
  }

  private async evaluateAllTests(): Promise<void> {
    for (const test of this.activeTests.values()) {
      if (test.status === 'running') {
        await this.evaluateTest(test.id);
      }
    }
  }

  private async evaluateTest(testId: string): Promise<void> {
    try {
      const test = this.activeTests.get(testId);
      if (!test || test.status !== 'running') {
        return;
      }

      const metrics = await this.calculateTestMetrics(test);

      // Check if minimum sample size reached
      const totalParticipants = metrics.controlGroup.participants + metrics.treatmentGroup.participants;
      if (totalParticipants < this.config.minSampleSize) {
        return;
      }

      // Check if test duration exceeded
      if (test.startedAt) {
        const duration = (Date.now() - test.startedAt.getTime()) / (1000 * 60 * 60 * 24); // days
        if (duration > this.config.maxTestDuration) {
          await this.stopTest(testId, 'Maximum duration reached');
          return;
        }
      }

      // Check for statistical significance
      if (metrics.statisticalSignificance.isSignificant) {
        const winner = metrics.statisticalSignificance.recommendedWinner;
        const confidence = metrics.statisticalSignificance.confidenceInterval;

        if (winner !== 'inconclusive' && confidence[1] > this.config.winnerSelectionThreshold) {
          if (this.config.enableAutoWinnerSelection) {
            await this.stopTest(testId, `Statistical significance achieved. Winner: ${winner}`);
          } else {
            logger.info('Statistical significance achieved', {
              testId,
              winner,
              confidence
            });
          }
        }
      }

      // Store metrics history
      if (!this.metricsHistory.has(testId)) {
        this.metricsHistory.set(testId, []);
      }
      this.metricsHistory.get(testId)!.push(metrics);

      this.emit('testEvaluated', { test, metrics });
    } catch (error) {
      logger.error('Failed to evaluate test', {
        testId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async calculateTestMetrics(test: ABTest): Promise<ABTestMetrics> {
    // Get participants for each group
    const controlParticipants = test.participants.filter(p => p.groupId === 'control');
    const treatmentParticipants = test.participants.filter(p => p.groupId === 'treatment');

    // Get conversions for each group (this would query database)
    const controlConversions = await this.getConversions(test.id, 'control');
    const treatmentConversions = await this.getConversions(test.id, 'treatment');

    // Calculate metrics
    const controlMetrics = {
      participants: controlParticipants.length,
      conversions: controlConversions.length,
      averageScore: this.calculateAverageScore(controlConversions),
      averageConfidence: this.calculateAverageConfidence(controlConversions),
      userSatisfaction: this.calculateUserSatisfaction(controlConversions)
    };

    const treatmentMetrics = {
      participants: treatmentParticipants.length,
      conversions: treatmentConversions.length,
      averageScore: this.calculateAverageScore(treatmentConversions),
      averageConfidence: this.calculateAverageConfidence(treatmentConversions),
      userSatisfaction: this.calculateUserSatisfaction(treatmentConversions)
    };

    // Calculate statistical significance
    const statisticalSignificance = this.calculateStatisticalSignificance(
      controlMetrics.conversions,
      controlMetrics.participants,
      treatmentMetrics.conversions,
      treatmentMetrics.participants
    );

    return {
      controlGroup: controlMetrics,
      treatmentGroup: treatmentMetrics,
      statisticalSignificance
    };
  }

  private async getOrAssignParticipant(candidateId: string, jobId: string): Promise<ABTestParticipant | null> {
    // Check if user is already assigned
    const existingParticipant = this.participants.get(candidateId);
    if (existingParticipant) {
      return existingParticipant;
    }

    // Find an active test to assign user to
    const activeTests = this.getActiveTests();
    if (activeTests.length === 0) {
      return null;
    }

    // Select test (simplified - would use more sophisticated selection)
    const test = activeTests[0];

    // Assign to group based on traffic split
    const groupId = Math.random() < (1 - test.config.trafficSplit) ? 'control' : 'treatment';

    const participant: ABTestParticipant = {
      userId: candidateId,
      groupId,
      assignedAt: new Date(),
      modelId: test.id
    };

    // Save participant
    this.participants.set(candidateId, participant);
    test.participants.push(participant);

    // Save to database
    await this.saveParticipant(participant);

    return participant;
  }

  private calculateStatisticalSignificance(
    controlConversions: number,
    controlParticipants: number,
    treatmentConversions: number,
    treatmentParticipants: number
  ): ABTestMetrics['statisticalSignificance'] {
    // Calculate conversion rates
    const controlRate = controlConversions / controlParticipants;
    const treatmentRate = treatmentConversions / treatmentParticipants;

    // Calculate pooled standard error
    const pooledRate = (controlConversions + treatmentConversions) / (controlParticipants + treatmentParticipants);
    const pooledSE = Math.sqrt(pooledRate * (1 - pooledRate) * (1/controlParticipants + 1/treatmentParticipants));

    // Calculate Z-score
    const zScore = (treatmentRate - controlRate) / pooledSE;

    // Calculate p-value (two-tailed test)
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));

    // Calculate confidence interval
    const marginOfError = this.zScoreForConfidence(this.config.confidenceLevel) * pooledSE;
    const difference = treatmentRate - controlRate;
    const confidenceInterval: [number, number] = [
      difference - marginOfError,
      difference + marginOfError
    ];

    // Determine significance and winner
    const isSignificant = pValue < (1 - this.config.confidenceLevel);
    let recommendedWinner: 'control' | 'treatment' | 'inconclusive' = 'inconclusive';

    if (isSignificant) {
      recommendedWinner = difference > 0 ? 'treatment' : 'control';
    }

    return {
      pValue,
      confidenceInterval,
      isSignificant,
      recommendedWinner
    };
  }

  private normalCDF(x: number): number {
    // Approximation of normal CDF
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  private erf(x: number): number {
    // Approximation of error function
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  private zScoreForConfidence(confidence: number): number {
    // Z-scores for common confidence levels
    const zScores: Record<number, number> = {
      0.90: 1.645,
      0.95: 1.96,
      0.99: 2.576
    };
    return zScores[confidence] || 1.96;
  }

  private async getConversions(testId: string, groupId: 'control' | 'treatment'): Promise<any[]> {
    // Get conversions from database for specific test and group
    // Implementation depends on your database setup
    return [];
  }

  private calculateAverageScore(conversions: any[]): number {
    if (conversions.length === 0) return 0;
    const total = conversions.reduce((sum, conv) => sum + (conv.predictionScore || 0), 0);
    return total / conversions.length;
  }

  private calculateAverageConfidence(conversions: any[]): number {
    if (conversions.length === 0) return 0;
    const total = conversions.reduce((sum, conv) => sum + (conv.confidence || 0), 0);
    return total / conversions.length;
  }

  private calculateUserSatisfaction(conversions: any[]): number {
    if (conversions.length === 0) return 0;
    const positiveConversions = conversions.filter(conv => conv.conversionType === 'positive').length;
    return positiveConversions / conversions.length;
  }

  private generateRecommendation(metrics: ABTestMetrics): string {
    if (!metrics.statisticalSignificance.isSignificant) {
      return 'Continue test - no statistical significance yet';
    }

    const winner = metrics.statisticalSignificance.recommendedWinner;
    if (winner === 'inconclusive') {
      return 'Results inconclusive - consider running test longer';
    }

    const confidence = metrics.statisticalSignificance.confidenceInterval[1];
    if (confidence > 0.9) {
      return `Strong recommendation: Deploy ${winner} model (${(confidence * 100).toFixed(1)}% confidence)`;
    } else {
      return `Moderate recommendation: Consider ${winner} model (${(confidence * 100).toFixed(1)}% confidence)`;
    }
  }

  private async getModelPrediction(model: MLModel, candidate: CandidateProfile, job: JobProfile): Promise<PredictionResult> {
    // This would integrate with the model server
    // For now, return a mock prediction
    return {
      modelId: model.id,
      modelName: model.name,
      prediction: Math.random(),
      confidence: 0.8 + Math.random() * 0.2,
      features: {
        vector: [],
        metadata: {}
      },
      timestamp: new Date(),
      metadata: {
        requestId: `req_${Date.now()}`,
        algorithm: model.algorithm
      }
    };
  }

  private async saveParticipant(participant: ABTestParticipant): Promise<void> {
    // Save participant to database
    // Implementation depends on your database setup
  }
}

export default ABTestingFramework;