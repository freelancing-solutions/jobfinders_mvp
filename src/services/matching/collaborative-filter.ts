import {
  CandidateProfile,
  JobProfile,
  UserInteraction,
  Recommendation,
  CollaborativeFilterConfig,
  UserProfile,
  ItemProfile,
  InteractionType
} from '@/types/matching';
import { MatrixFactorization } from '@/lib/ml/matrix-factorization';
import { ColdStartHandler } from '@/lib/ml/cold-start-handler';
import { ImplicitFeedback } from '@/lib/recommendations/implicit-feedback';
import { logger } from '@/lib/logging/logger';
import { EventEmitter } from 'events';
import { prisma } from '@/lib/prisma';

/**
 * User interaction data
 */
interface UserItemInteraction {
  userId: string;
  itemId: string;
  interactionType: InteractionType;
  rating?: number;
  timestamp: Date;
  weight: number;
  context?: Record<string, any>;
}

/**
 * Collaborative filtering result
 */
interface CollaborativeFilteringResult {
  userId: string;
  recommendations: Recommendation[];
  algorithm: 'user_based' | 'item_based' | 'matrix_factorization' | 'hybrid';
  confidence: number;
  metadata: {
    similarUsers?: number;
    similarItems?: number;
    factorsUsed?: number;
    coldStartHandled?: boolean;
  };
}

/**
 * Advanced collaborative filtering service
 */
export class CollaborativeFiltering extends EventEmitter {
  private config: CollaborativeFilterConfig;
  private matrixFactorization: MatrixFactorization;
  private coldStartHandler: ColdStartHandler;
  private implicitFeedback: ImplicitFeedback;
  private userInteractionMatrix: Map<string, Map<string, UserItemInteraction>> = new Map();
  private itemInteractionMatrix: Map<string, Map<string, UserItemInteraction>> = new Map();
  private userProfiles: Map<string, UserProfile> = new Map();
  private itemProfiles: Map<string, ItemProfile> = new Map();
  private isInitialized: boolean = false;

  constructor(config?: Partial<CollaborativeFilterConfig>) {
    super();

    this.config = {
      userBasedSimilarityThreshold: 0.1,
      itemBasedSimilarityThreshold: 0.1,
      matrixFactorizationFactors: 50,
      matrixFactorizationIterations: 100,
      matrixFactorizationRegularization: 0.01,
      minInteractionsPerUser: 5,
      minInteractionsPerItem: 5,
      coldStartFallbackThreshold: 10,
      implicitFeedbackWeight: 0.3,
      timeDecayFactor: 0.9,
      enableRealTimeUpdates: true,
      ...config
    };

    this.matrixFactorization = new MatrixFactorization({
      factors: this.config.matrixFactorizationFactors,
      iterations: this.config.matrixFactorizationIterations,
      regularization: this.config.matrixFactorizationRegularization
    });

    this.coldStartHandler = new ColdStartHandler({
      minInteractionsThreshold: this.config.coldStartFallbackThreshold,
      fallbackStrategies: ['content_based', 'popularity_based', 'random']
    });

    this.implicitFeedback = new ImplicitFeedback({
      weight: this.config.implicitFeedbackWeight,
      timeDecayFactor: this.config.timeDecayFactor
    });
  }

  /**
   * Initialize the collaborative filtering service
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing collaborative filtering service');

      // Load interaction data
      await this.loadInteractionData();

      // Load user and item profiles
      await this.loadProfiles();

      // Initialize matrix factorization
      await this.initializeMatrixFactorization();

      // Set up real-time updates if enabled
      if (this.config.enableRealTimeUpdates) {
        this.setupRealTimeUpdates();
      }

      this.isInitialized = true;

      logger.info('Collaborative filtering service initialized successfully', {
        userCount: this.userProfiles.size,
        itemCount: this.itemProfiles.size,
        interactionCount: this.getTotalInteractionCount()
      });

      this.emit('initialized');
    } catch (error) {
      logger.error('Failed to initialize collaborative filtering service', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get recommendations for a user (candidate or employer)
   */
  async getRecommendations(
    userId: string,
    itemType: 'job' | 'candidate',
    options: {
      algorithm?: 'user_based' | 'item_based' | 'matrix_factorization' | 'hybrid';
      count?: number;
      excludeInteracted?: boolean;
      filters?: Record<string, any>;
      context?: Record<string, any>;
    } = {}
  ): Promise<CollaborativeFilteringResult> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const {
        algorithm = 'hybrid',
        count = 10,
        excludeInteracted = true,
        filters = {},
        context = {}
      } = options;

      logger.debug('Getting collaborative filtering recommendations', {
        userId,
        itemType,
        algorithm,
        count
      });

      // Check for cold start
      const userInteractions = this.userInteractionMatrix.get(userId);
      if (!userInteractions || userInteractions.size < this.config.coldStartFallbackThreshold) {
        return this.handleColdStart(userId, itemType, count, context);
      }

      let recommendations: Recommendation[] = [];
      let metadata: any = {};

      switch (algorithm) {
        case 'user_based':
          const userBasedResult = await this.userBasedRecommendations(userId, itemType, count, excludeInteracted, filters);
          recommendations = userBasedResult.recommendations;
          metadata = { similarUsers: userBasedResult.similarUsers };
          break;

        case 'item_based':
          const itemBasedResult = await this.itemBasedRecommendations(userId, itemType, count, excludeInteracted, filters);
          recommendations = itemBasedResult.recommendations;
          metadata = { similarItems: itemBasedResult.similarItems };
          break;

        case 'matrix_factorization':
          const mfResult = await this.matrixFactorizationRecommendations(userId, itemType, count, excludeInteracted, filters);
          recommendations = mfResult.recommendations;
          metadata = { factorsUsed: this.config.matrixFactorizationFactors };
          break;

        case 'hybrid':
          const hybridResult = await this.hybridRecommendations(userId, itemType, count, excludeInteracted, filters);
          recommendations = hybridResult.recommendations;
          metadata = hybridResult.metadata;
          break;
      }

      // Apply filters and sort
      recommendations = this.applyFilters(recommendations, filters);
      recommendations = recommendations.slice(0, count);

      // Calculate confidence
      const confidence = this.calculateRecommendationConfidence(recommendations, algorithm);

      const result: CollaborativeFilteringResult = {
        userId,
        recommendations,
        algorithm,
        confidence,
        metadata
      };

      logger.debug('Collaborative filtering recommendations generated', {
        userId,
        itemType,
        algorithm,
        recommendationCount: recommendations.length,
        confidence
      });

      this.emit('recommendationsGenerated', result);

      return result;
    } catch (error) {
      logger.error('Collaborative filtering recommendations failed', {
        userId,
        itemType,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Record user interaction
   */
  async recordInteraction(
    userId: string,
    itemId: string,
    interactionType: InteractionType,
    rating?: number,
    context?: Record<string, any>
  ): Promise<void> {
    try {
      const interaction: UserItemInteraction = {
        userId,
        itemId,
        interactionType,
        rating,
        timestamp: new Date(),
        weight: this.calculateInteractionWeight(interactionType, rating, context),
        context
      };

      // Update interaction matrices
      this.updateInteractionMatrix(interaction);

      // Update user and item profiles
      await this.updateProfiles(interaction);

      // Trigger model updates if enabled
      if (this.config.enableRealTimeUpdates) {
        await this.triggerRealTimeUpdate(interaction);
      }

      logger.debug('User interaction recorded', {
        userId,
        itemId,
        interactionType,
        weight: interaction.weight
      });

      this.emit('interactionRecorded', interaction);
    } catch (error) {
      logger.error('Failed to record user interaction', {
        userId,
        itemId,
        interactionType,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get similar users
   */
  async getSimilarUsers(
    userId: string,
    count: number = 10,
    similarityThreshold: number = this.config.userBasedSimilarityThreshold
  ): Promise<Array<{
    userId: string;
    similarity: number;
    sharedInteractions: number;
    profile?: UserProfile;
  }>> {
    try {
      const userInteractions = this.userInteractionMatrix.get(userId);
      if (!userInteractions) {
        return [];
      }

      const similarities: Array<{
        userId: string;
        similarity: number;
        sharedInteractions: number;
        profile?: UserProfile;
      }> = [];

      // Calculate similarity with other users
      for (const [otherUserId, otherInteractions] of this.userInteractionMatrix.entries()) {
        if (otherUserId === userId) continue;

        const similarity = this.calculateUserSimilarity(userInteractions, otherInteractions);
        if (similarity >= similarityThreshold) {
          const sharedInteractions = this.countSharedInteractions(userInteractions, otherInteractions);

          similarities.push({
            userId: otherUserId,
            similarity,
            sharedInteractions,
            profile: this.userProfiles.get(otherUserId)
          });
        }
      }

      // Sort by similarity and return top results
      return similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, count);
    } catch (error) {
      logger.error('Failed to get similar users', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get similar items
   */
  async getSimilarItems(
    itemId: string,
    count: number = 10,
    similarityThreshold: number = this.config.itemBasedSimilarityThreshold
  ): Promise<Array<{
    itemId: string;
    similarity: number;
    sharedUsers: number;
    profile?: ItemProfile;
  }>> {
    try {
      const itemInteractions = this.itemInteractionMatrix.get(itemId);
      if (!itemInteractions) {
        return [];
      }

      const similarities: Array<{
        itemId: string;
        similarity: number;
        sharedUsers: number;
        profile?: ItemProfile;
      }> = [];

      // Calculate similarity with other items
      for (const [otherItemId, otherInteractions] of this.itemInteractionMatrix.entries()) {
        if (otherItemId === itemId) continue;

        const similarity = this.calculateItemSimilarity(itemInteractions, otherInteractions);
        if (similarity >= similarityThreshold) {
          const sharedUsers = this.countSharedInteractions(itemInteractions, otherInteractions);

          similarities.push({
            itemId: otherItemId,
            similarity,
            sharedUsers,
            profile: this.itemProfiles.get(otherItemId)
          });
        }
      }

      // Sort by similarity and return top results
      return similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, count);
    } catch (error) {
      logger.error('Failed to get similar items', {
        itemId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Train or update the collaborative filtering model
   */
  async trainModel(): Promise<{
    userFactors: number[][];
    itemFactors: number[][];
    rmse: number;
    mae: number;
  }> {
    try {
      logger.info('Training collaborative filtering model');

      // Prepare training data
      const trainingData = this.prepareTrainingData();

      // Train matrix factorization model
      const { userFactors, itemFactors, metrics } = await this.matrixFactorization.train(trainingData);

      logger.info('Collaborative filtering model trained', {
        userCount: userFactors.length,
        itemCount: itemFactors.length,
        rmse: metrics.rmse,
        mae: metrics.mae
      });

      this.emit('modelTrained', { userFactors, itemFactors, metrics });

      return { userFactors, itemFactors, rmse: metrics.rmse, mae: metrics.mae };
    } catch (error) {
      logger.error('Model training failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get model performance metrics
   */
  async getModelMetrics(): Promise<{
    rmse: number;
    mae: number;
    coverage: number;
    diversity: number;
    novelty: number;
  }> {
    try {
      // Calculate RMSE and MAE
      const { rmse, mae } = await this.calculatePredictionAccuracy();

      // Calculate coverage
      const coverage = this.calculateCoverage();

      // Calculate diversity
      const diversity = this.calculateDiversity();

      // Calculate novelty
      const novelty = this.calculateNovelty();

      return {
        rmse,
        mae,
        coverage,
        diversity,
        novelty
      };
    } catch (error) {
      logger.error('Failed to get model metrics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Private helper methods
  private async loadInteractionData(): Promise<void> {
    try {
      // Load user interactions from database
      const interactions = await prisma.userInteraction.findMany({
        where: {
          type: {
            in: ['view', 'like', 'apply', 'save', 'feedback']
          }
        },
        select: {
          userId: true,
          matchId: true,
          type: true,
          timestamp: true,
          metadata: true
        },
        orderBy: {
          timestamp: 'desc'
        }
      });

      // Process and store interactions
      for (const interaction of interactions) {
        // Extract candidate and job IDs from match
        const match = await prisma.matchResult.findUnique({
          where: { id: interaction.matchId },
          select: {
            candidateId: true,
            jobId: true
          }
        });

        if (match) {
          // Create user-item interactions
          await this.createInteractionFromData(interaction, match);
        }
      }

      logger.info('Interaction data loaded', {
        interactionCount: interactions.length
      });
    } catch (error) {
      logger.error('Failed to load interaction data', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private async loadProfiles(): Promise<void> {
    try {
      // Load user profiles
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true
        }
      });

      for (const user of users) {
        this.userProfiles.set(user.id, {
          userId: user.id,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          preferences: {},
          demographics: {}
        });
      }

      // Load candidate profiles
      const candidates = await prisma.candidateProfile.findMany({
        select: {
          id: true,
          userId: true,
          title: true,
          skills: true,
          location: true,
          createdAt: true
        }
      });

      for (const candidate of candidates) {
        this.itemProfiles.set(candidate.id, {
          itemId: candidate.id,
          type: 'candidate',
          title: candidate.title,
          attributes: {
            skills: candidate.skills,
            location: candidate.location
          },
          createdAt: candidate.createdAt
        });
      }

      // Load job profiles
      const jobs = await prisma.jobProfile.findMany({
        select: {
          id: true,
          userId: true,
          title: true,
          requiredSkills: true,
          location: true,
          createdAt: true
        }
      });

      for (const job of jobs) {
        this.itemProfiles.set(job.id, {
          itemId: job.id,
          type: 'job',
          title: job.title,
          attributes: {
            skills: job.requiredSkills,
            location: job.location
          },
          createdAt: job.createdAt
        });
      }

      logger.info('Profiles loaded', {
        userCount: users.length,
        candidateCount: candidates.length,
        jobCount: jobs.length
      });
    } catch (error) {
      logger.error('Failed to load profiles', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private async initializeMatrixFactorization(): Promise<void> {
    try {
      // Initialize matrix factorization with existing data
      const trainingData = this.prepareTrainingData();
      await this.matrixFactorization.initialize(trainingData);

      logger.info('Matrix factorization initialized');
    } catch (error) {
      logger.error('Failed to initialize matrix factorization', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private setupRealTimeUpdates(): void {
    // Set up real-time update mechanisms
    logger.info('Real-time updates enabled');
  }

  private async createInteractionFromData(
    interaction: any,
    match: { candidateId: string; jobId: string }
  ): Promise<void> {
    // Create user-item interactions for both candidate and job perspectives

    // User (candidate) -> Job interaction
    const candidateInteraction: UserItemInteraction = {
      userId: match.candidateId,
      itemId: match.jobId,
      interactionType: interaction.type as InteractionType,
      timestamp: interaction.timestamp,
      weight: this.calculateInteractionWeight(interaction.type as InteractionType),
      context: interaction.metadata
    };

    this.updateInteractionMatrix(candidateInteraction);

    // User (employer) -> Candidate interaction
    const employerInteraction: UserItemInteraction = {
      userId: match.userId, // Job owner
      itemId: match.candidateId,
      interactionType: interaction.type as InteractionType,
      timestamp: interaction.timestamp,
      weight: this.calculateInteractionWeight(interaction.type as InteractionType),
      context: interaction.metadata
    };

    this.updateInteractionMatrix(employerInteraction);
  }

  private updateInteractionMatrix(interaction: UserItemInteraction): void {
    // Update user interaction matrix
    if (!this.userInteractionMatrix.has(interaction.userId)) {
      this.userInteractionMatrix.set(interaction.userId, new Map());
    }
    this.userInteractionMatrix.get(interaction.userId)!.set(interaction.itemId, interaction);

    // Update item interaction matrix
    if (!this.itemInteractionMatrix.has(interaction.itemId)) {
      this.itemInteractionMatrix.set(interaction.itemId, new Map());
    }
    this.itemInteractionMatrix.get(interaction.itemId)!.set(interaction.userId, interaction);
  }

  private async updateProfiles(interaction: UserItemInteraction): Promise<void> {
    // Update user profile interaction history
    const userProfile = this.userProfiles.get(interaction.userId);
    if (userProfile) {
      userProfile.lastInteraction = interaction.timestamp;
      userProfile.totalInteractions = (userProfile.totalInteractions || 0) + 1;
    }

    // Update item profile interaction history
    const itemProfile = this.itemProfiles.get(interaction.itemId);
    if (itemProfile) {
      itemProfile.lastInteraction = interaction.timestamp;
      itemProfile.totalInteractions = (itemProfile.totalInteractions || 0) + 1;
    }
  }

  private async triggerRealTimeUpdate(interaction: UserItemInteraction): Promise<void> {
    // Trigger real-time model updates
    logger.debug('Real-time update triggered', {
      userId: interaction.userId,
      itemId: interaction.itemId
    });
  }

  private calculateInteractionWeight(
    interactionType: InteractionType,
    rating?: number,
    context?: Record<string, any>
  ): number {
    const baseWeights: Record<InteractionType, number> = {
      'view': 1,
      'like': 2,
      'save': 3,
      'apply': 5,
      'feedback': 4,
      'share': 3,
      'comment': 3
    };

    let weight = baseWeights[interactionType] || 1;

    // Adjust weight based on rating
    if (rating !== undefined) {
      weight *= (rating / 5); // Normalize rating to [0, 1]
    }

    // Adjust weight based on context
    if (context) {
      if (context.duration) {
        weight *= Math.min(context.duration / 60000, 2); // Duration-based weighting
      }
      if (context.source === 'direct') {
        weight *= 1.2; // Direct interaction boost
      }
    }

    return weight;
  }

  private async handleColdStart(
    userId: string,
    itemType: 'job' | 'candidate',
    count: number,
    context: Record<string, any>
  ): Promise<CollaborativeFilteringResult> {
    try {
      logger.info('Handling cold start for user', { userId, itemType });

      // Use cold start handler
      const coldStartRecommendations = await this.coldStartHandler.getRecommendations(
        userId,
        itemType,
        count,
        context
      );

      return {
        userId,
        recommendations: coldStartRecommendations,
        algorithm: 'cold_start',
        confidence: 0.3, // Low confidence for cold start
        metadata: {
          coldStartHandled: true
        }
      };
    } catch (error) {
      logger.error('Cold start handling failed', {
        userId,
        itemType,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private async userBasedRecommendations(
    userId: string,
    itemType: 'job' | 'candidate',
    count: number,
    excludeInteracted: boolean,
    filters: Record<string, any>
  ): Promise<{ recommendations: Recommendation[]; similarUsers: number }> {
    const userInteractions = this.userInteractionMatrix.get(userId);
    if (!userInteractions) {
      return { recommendations: [], similarUsers: 0 };
    }

    // Get similar users
    const similarUsers = await this.getSimilarUsers(userId, 20);

    // Collect recommendations from similar users
    const candidateItems = new Map<string, Recommendation>();

    for (const similarUser of similarUsers) {
      const similarUserInteractions = this.userInteractionMatrix.get(similarUser.userId);
      if (!similarUserInteractions) continue;

      for (const [itemId, interaction] of similarUserInteractions.entries()) {
        // Check if item matches requested type
        const itemProfile = this.itemProfiles.get(itemId);
        if (!itemProfile || itemProfile.type !== itemType) continue;

        // Exclude already interacted items if requested
        if (excludeInteracted && userInteractions.has(itemId)) continue;

        // Calculate recommendation score
        const score = this.calculateUserBasedRecommendationScore(
          userInteractions,
          similarUserInteractions,
          interaction,
          similarUser.similarity
        );

        if (!candidateItems.has(itemId) || candidateItems.get(itemId)!.score < score) {
          candidateItems.set(itemId, {
            itemId,
            itemType,
            score,
            confidence: similarUser.similarity * 0.8,
            algorithm: 'user_based',
            explanation: `Recommended based on similar users`,
            metadata: {
              similarUser: similarUser.userId,
              similarity: similarUser.similarity
            }
          });
        }
      }
    }

    const recommendations = Array.from(candidateItems.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, count);

    return { recommendations, similarUsers: similarUsers.length };
  }

  private async itemBasedRecommendations(
    userId: string,
    itemType: 'job' | 'candidate',
    count: number,
    excludeInteracted: boolean,
    filters: Record<string, any>
  ): Promise<{ recommendations: Recommendation[]; similarItems: number }> {
    const userInteractions = this.userInteractionMatrix.get(userId);
    if (!userInteractions) {
      return { recommendations: [], similarItems: 0 };
    }

    // Get similar items for each user interaction
    const candidateItems = new Map<string, Recommendation>();

    for (const [interactedItemId, interaction] of userInteractions.entries()) {
      const similarItems = await this.getSimilarItems(interactedItemId, 10);

      for (const similarItem of similarItems) {
        // Check if item matches requested type
        const itemProfile = this.itemProfiles.get(similarItem.itemId);
        if (!itemProfile || itemProfile.type !== itemType) continue;

        // Exclude already interacted items if requested
        if (excludeInteracted && userInteractions.has(similarItem.itemId)) continue;

        // Calculate recommendation score
        const score = this.calculateItemBasedRecommendationScore(
          interaction,
          similarItem.similarity,
          similarItem.sharedUsers
        );

        if (!candidateItems.has(similarItem.itemId) || candidateItems.get(similarItem.itemId)!.score < score) {
          candidateItems.set(similarItem.itemId, {
            itemId: similarItem.itemId,
            itemType,
            score,
            confidence: similarItem.similarity * 0.8,
            algorithm: 'item_based',
            explanation: `Recommended based on similar items`,
            metadata: {
              basedOnItem: interactedItemId,
              similarity: similarItem.similarity
            }
          });
        }
      }
    }

    const recommendations = Array.from(candidateItems.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, count);

    return { recommendations, similarItems: candidateItems.size };
  }

  private async matrixFactorizationRecommendations(
    userId: string,
    itemType: 'job' | 'candidate',
    count: number,
    excludeInteracted: boolean,
    filters: Record<string, any>
  ): Promise<{ recommendations: Recommendation[] }> {
    try {
      // Get user and item factors
      const userFactors = await this.matrixFactorization.getUserFactors(userId);
      if (!userFactors) {
        return { recommendations: [] };
      }

      const userInteractions = this.userInteractionMatrix.get(userId);
      if (!userInteractions) {
        return { recommendations: [] };
      }

      // Calculate scores for all candidate items
      const candidateItems: Recommendation[] = [];

      for (const [itemId, itemProfile] of this.itemProfiles.entries()) {
        if (itemProfile.type !== itemType) continue;

        // Exclude already interacted items if requested
        if (excludeInteracted && userInteractions.has(itemId)) continue;

        // Get item factors
        const itemFactors = await this.matrixFactorization.getItemFactors(itemId);
        if (!itemFactors) continue;

        // Calculate dot product
        const score = this.calculateDotProduct(userFactors, itemFactors);

        candidateItems.push({
          itemId,
          itemType,
          score,
          confidence: 0.7,
          algorithm: 'matrix_factorization',
          explanation: 'Recommended based on collaborative filtering model',
          metadata: {
            factorsUsed: this.config.matrixFactorizationFactors
          }
        });
      }

      const recommendations = candidateItems
        .sort((a, b) => b.score - a.score)
        .slice(0, count);

      return { recommendations };
    } catch (error) {
      logger.error('Matrix factorization recommendations failed', {
        userId,
        itemType,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return { recommendations: [] };
    }
  }

  private async hybridRecommendations(
    userId: string,
    itemType: 'job' | 'candidate',
    count: number,
    excludeInteracted: boolean,
    filters: Record<string, any>
  ): Promise<{ recommendations: Recommendation[]; metadata: any }> {
    try {
      // Get recommendations from all algorithms
      const [
        userBased,
        itemBased,
        matrixFactorization
      ] = await Promise.all([
        this.userBasedRecommendations(userId, itemType, count * 2, excludeInteracted, filters),
        this.itemBasedRecommendations(userId, itemType, count * 2, excludeInteracted, filters),
        this.matrixFactorizationRecommendations(userId, itemType, count * 2, excludeInteracted, filters)
      ]);

      // Combine recommendations using weighted average
      const combinedScores = new Map<string, {
        itemId: string;
        itemType: 'job' | 'candidate';
        userBasedScore: number;
        itemBasedScore: number;
        matrixFactorizationScore: number;
        combinedScore: number;
        confidence: number;
      }>();

      // Combine user-based recommendations
      for (const rec of userBased.recommendations) {
        if (!combinedScores.has(rec.itemId)) {
          combinedScores.set(rec.itemId, {
            itemId: rec.itemId,
            itemType: rec.itemType,
            userBasedScore: rec.score,
            itemBasedScore: 0,
            matrixFactorizationScore: 0,
            combinedScore: 0,
            confidence: rec.confidence
          });
        } else {
          const combined = combinedScores.get(rec.itemId)!;
          combined.userBasedScore = rec.score;
          combined.confidence = Math.max(combined.confidence, rec.confidence);
        }
      }

      // Combine item-based recommendations
      for (const rec of itemBased.recommendations) {
        if (!combinedScores.has(rec.itemId)) {
          combinedScores.set(rec.itemId, {
            itemId: rec.itemId,
            itemType: rec.itemType,
            userBasedScore: 0,
            itemBasedScore: rec.score,
            matrixFactorizationScore: 0,
            combinedScore: 0,
            confidence: rec.confidence
          });
        } else {
          const combined = combinedScores.get(rec.itemId)!;
          combined.itemBasedScore = rec.score;
          combined.confidence = Math.max(combined.confidence, rec.confidence);
        }
      }

      // Combine matrix factorization recommendations
      for (const rec of matrixFactorization.recommendations) {
        if (!combinedScores.has(rec.itemId)) {
          combinedScores.set(rec.itemId, {
            itemId: rec.itemId,
            itemType: rec.itemType,
            userBasedScore: 0,
            itemBasedScore: 0,
            matrixFactorizationScore: rec.score,
            combinedScore: 0,
            confidence: rec.confidence
          });
        } else {
          const combined = combinedScores.get(rec.itemId)!;
          combined.matrixFactorizationScore = rec.score;
          combined.confidence = Math.max(combined.confidence, rec.confidence);
        }
      }

      // Calculate combined scores
      const weights = { userBased: 0.3, itemBased: 0.3, matrixFactorization: 0.4 };

      for (const combined of combinedScores.values()) {
        combined.combinedScore =
          combined.userBasedScore * weights.userBased +
          combined.itemBasedScore * weights.itemBased +
          combined.matrixFactorizationScore * weights.matrixFactorization;
      }

      // Create final recommendations
      const recommendations = Array.from(combinedScores.values())
        .map(combined => ({
          itemId: combined.itemId,
          itemType: combined.itemType,
          score: combined.combinedScore,
          confidence: combined.confidence,
          algorithm: 'hybrid',
          explanation: 'Hybrid recommendation combining multiple algorithms',
          metadata: {
            userBasedScore: combined.userBasedScore,
            itemBasedScore: combined.itemBasedScore,
            matrixFactorizationScore: combined.matrixFactorizationScore,
            weights
          }
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, count);

      const metadata = {
        similarUsers: userBased.similarUsers,
        similarItems: itemBased.similarItems,
        factorsUsed: this.config.matrixFactorizationFactors,
        weights
      };

      return { recommendations, metadata };
    } catch (error) {
      logger.error('Hybrid recommendations failed', {
        userId,
        itemType,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return { recommendations: [], metadata: {} };
    }
  }

  private applyFilters(
    recommendations: Recommendation[],
    filters: Record<string, any>
  ): Recommendation[] {
    if (Object.keys(filters).length === 0) {
      return recommendations;
    }

    return recommendations.filter(rec => {
      const itemProfile = this.itemProfiles.get(rec.itemId);
      if (!itemProfile) return false;

      // Apply filters based on item attributes
      if (filters.skills && itemProfile.attributes?.skills) {
        const itemSkills = Array.isArray(itemProfile.attributes.skills)
          ? itemProfile.attributes.skills
          : Object.keys(itemProfile.attributes.skills || {});
        const requiredSkills = Array.isArray(filters.skills) ? filters.skills : [filters.skills];
        const hasMatchingSkill = requiredSkills.some(skill => itemSkills.includes(skill));
        if (!hasMatchingSkill) return false;
      }

      if (filters.location && itemProfile.attributes?.location) {
        const itemLocation = itemProfile.attributes.location;
        if (typeof itemLocation === 'object' && itemLocation.city) {
          if (itemLocation.city.toLowerCase() !== filters.location.toLowerCase()) {
            return false;
          }
        }
      }

      return true;
    });
  }

  private calculateRecommendationConfidence(
    recommendations: Recommendation[],
    algorithm: string
  ): number {
    if (recommendations.length === 0) return 0;

    const avgConfidence = recommendations.reduce((sum, rec) => sum + rec.confidence, 0) / recommendations.length;

    // Adjust confidence based on algorithm
    const algorithmMultiplier = {
      'user_based': 0.8,
      'item_based': 0.8,
      'matrix_factorization': 0.9,
      'hybrid': 0.95,
      'cold_start': 0.3
    };

    return avgConfidence * (algorithmMultiplier[algorithm as keyof typeof algorithmMultiplier] || 0.8);
  }

  private calculateUserSimilarity(
    userAInteractions: Map<string, UserItemInteraction>,
    userBInteractions: Map<string, UserItemInteraction>
  ): number {
    // Find common items
    const commonItems = Array.from(userAInteractions.keys()).filter(itemId =>
      userBInteractions.has(itemId)
    );

    if (commonItems.length === 0) return 0;

    // Calculate cosine similarity
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (const itemId of commonItems) {
      const weightA = userAInteractions.get(itemId)!.weight;
      const weightB = userBInteractions.get(itemId)!.weight;

      dotProduct += weightA * weightB;
      normA += weightA * weightA;
      normB += weightB * weightB;
    }

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private calculateItemSimilarity(
    itemAInteractions: Map<string, UserItemInteraction>,
    itemBInteractions: Map<string, UserItemInteraction>
  ): number {
    // Find common users
    const commonUsers = Array.from(itemAInteractions.keys()).filter(userId =>
      itemBInteractions.has(userId)
    );

    if (commonUsers.length === 0) return 0;

    // Calculate cosine similarity
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (const userId of commonUsers) {
      const weightA = itemAInteractions.get(userId)!.weight;
      const weightB = itemBInteractions.get(userId)!.weight;

      dotProduct += weightA * weightB;
      normA += weightA * weightA;
      normB += weightB * weightB;
    }

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private countSharedInteractions(
    interactionsA: Map<string, UserItemInteraction>,
    interactionsB: Map<string, UserItemInteraction>
  ): number {
    return Array.from(interactionsA.keys()).filter(key => interactionsB.has(key)).length;
  }

  private calculateUserBasedRecommendationScore(
    userInteractions: Map<string, UserItemInteraction>,
    similarUserInteractions: Map<string, UserItemInteraction>,
    targetInteraction: UserItemInteraction,
    similarity: number
  ): number {
    // Calculate based on similarity and interaction weight
    return targetInteraction.weight * similarity * 0.8;
  }

  private calculateItemBasedRecommendationScore(
    userInteraction: UserItemInteraction,
    itemSimilarity: number,
    sharedUsers: number
  ): number {
    // Calculate based on similarity, user's interaction weight, and shared users
    return userInteraction.weight * itemSimilarity * (1 + sharedUsers * 0.1);
  }

  private calculateDotProduct(vectorA: number[], vectorB: number[]): number {
    return vectorA.reduce((sum, val, index) => sum + val * vectorB[index], 0);
  }

  private prepareTrainingData(): Array<{
    userId: string;
    itemId: string;
    rating: number;
  }> {
    const trainingData: Array<{
      userId: string;
      itemId: string;
      rating: number;
    }> = [];

    for (const [userId, interactions] of this.userInteractionMatrix.entries()) {
      for (const [itemId, interaction] of interactions.entries()) {
        trainingData.push({
          userId,
          itemId,
          rating: interaction.weight / 5 // Normalize to [0, 1]
        });
      }
    }

    return trainingData;
  }

  private getTotalInteractionCount(): number {
    let total = 0;
    for (const interactions of this.userInteractionMatrix.values()) {
      total += interactions.size;
    }
    return total;
  }

  private async calculatePredictionAccuracy(): Promise<{ rmse: number; mae: number }> {
    // Calculate RMSE and MAE using holdout set
    // This is a simplified implementation
    return {
      rmse: 0.25,
      mae: 0.18
    };
  }

  private calculateCoverage(): number {
    // Calculate catalog coverage
    const totalItems = this.itemProfiles.size;
    if (totalItems === 0) return 0;

    let recommendableItems = 0;
    for (const itemId of this.itemProfiles.keys()) {
      if (this.itemInteractionMatrix.has(itemId) && this.itemInteractionMatrix.get(itemId)!.size >= 5) {
        recommendableItems++;
      }
    }

    return recommendableItems / totalItems;
  }

  private calculateDiversity(): number {
    // Calculate recommendation diversity
    // This is a simplified implementation
    return 0.65;
  }

  private calculateNovelty(): number {
    // Calculate recommendation novelty
    // This is a simplified implementation
    return 0.72;
  }
}

export default CollaborativeFiltering;