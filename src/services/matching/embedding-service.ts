import {
  CandidateProfile,
  JobProfile,
  EmbeddingVector,
  ProfileEmbedding,
  EmbeddingGenerationConfig,
  BatchEmbeddingRequest
} from '@/types/matching';
import { ProfileEmbedder } from '@/lib/embeddings/profile-embedder';
import { VectorStore } from '@/lib/vector/vector-store';
import { SimilaritySearch } from '@/lib/vector/similarity-search';
import { logger } from '@/lib/logging/logger';
import { EventEmitter } from 'events';

/**
 * Embedding service configuration
 */
export interface EmbeddingServiceConfig {
  embeddingModel: string;
  batchSize: number;
  maxTextLength: number;
  enableCaching: boolean;
  cacheTimeout: number;
  similarityThreshold: number;
  maxResults: number;
  enableRealTimeUpdates: boolean;
}

/**
 * Embedding generation result
 */
export interface EmbeddingResult {
  profileId: string;
  profileType: 'candidate' | 'job';
  embedding: EmbeddingVector;
  metadata: {
    processingTime: number;
    textLength: number;
    modelVersion: string;
    generatedAt: Date;
  };
}

/**
 * Similarity search result
 */
export interface SimilarityResult {
  profileId: string;
  profileType: 'candidate' | 'job';
  similarity: number;
  embedding: EmbeddingVector;
  metadata?: any;
}

/**
 * Advanced embedding service for semantic matching
 */
export class EmbeddingService extends EventEmitter {
  private config: EmbeddingServiceConfig;
  private profileEmbedder: ProfileEmbedder;
  private vectorStore: VectorStore;
  private similaritySearch: SimilaritySearch;
  private embeddingCache: Map<string, { embedding: EmbeddingVector; timestamp: number }> = new Map();
  private isInitialized: boolean = false;

  constructor(config?: Partial<EmbeddingServiceConfig>) {
    super();

    this.config = {
      embeddingModel: 'text-embedding-ada-002',
      batchSize: 100,
      maxTextLength: 8000,
      enableCaching: true,
      cacheTimeout: 24 * 60 * 60 * 1000, // 24 hours
      similarityThreshold: 0.7,
      maxResults: 50,
      enableRealTimeUpdates: true,
      ...config
    };

    this.profileEmbedder = new ProfileEmbedder(this.config);
    this.vectorStore = new VectorStore();
    this.similaritySearch = new SimilaritySearch();
  }

  /**
   * Initialize the embedding service
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing embedding service');

      // Initialize components
      await this.profileEmbedder.initialize();
      await this.vectorStore.initialize();
      await this.similaritySearch.initialize();

      // Load existing embeddings
      await this.loadExistingEmbeddings();

      // Set up cache cleanup
      if (this.config.enableCaching) {
        this.startCacheCleanup();
      }

      this.isInitialized = true;

      logger.info('Embedding service initialized successfully');
      this.emit('initialized');
    } catch (error) {
      logger.error('Failed to initialize embedding service', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Generate embedding for a single profile
   */
  async generateEmbedding(
    profile: CandidateProfile | JobProfile,
    profileType: 'candidate' | 'job'
  ): Promise<EmbeddingResult> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const startTime = Date.now();
      const profileId = profile.id;

      // Check cache first
      if (this.config.enableCaching) {
        const cached = this.getFromCache(profileId);
        if (cached) {
          return {
            profileId,
            profileType,
            embedding: cached,
            metadata: {
              processingTime: Date.now() - startTime,
              textLength: 0,
              modelVersion: this.config.embeddingModel,
              generatedAt: new Date()
            }
          };
        }
      }

      // Generate embedding
      const embedding = await this.profileEmbedder.generateProfileEmbedding(
        profile,
        profileType
      );

      // Validate embedding
      this.validateEmbedding(embedding);

      // Cache the result
      if (this.config.enableCaching) {
        this.setCache(profileId, embedding);
      }

      // Store in vector database
      await this.vectorStore.upsert({
        id: profileId,
        vector: embedding.vector,
        metadata: {
          profileType,
          title: profileType === 'candidate' ? profile.title : profile.title,
          skills: profileType === 'candidate' ? profile.skills : profile.requiredSkills,
          location: profile.location,
          industry: profileType === 'job' ? profile.industry : undefined,
          createdAt: new Date().toISOString()
        }
      });

      const processingTime = Date.now() - startTime;

      logger.debug('Embedding generated', {
        profileId,
        profileType,
        processingTime,
        dimension: embedding.vector.length
      });

      this.emit('embeddingGenerated', {
        profileId,
        profileType,
        embedding,
        processingTime
      });

      return {
        profileId,
        profileType,
        embedding,
        metadata: {
          processingTime,
          textLength: embedding.textLength || 0,
          modelVersion: embedding.model || this.config.embeddingModel,
          generatedAt: new Date()
        }
      };
    } catch (error) {
      logger.error('Embedding generation failed', {
        profileId: profile.id,
        profileType,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple profiles (batch processing)
   */
  async generateBatchEmbeddings(
    request: BatchEmbeddingRequest
  ): Promise<EmbeddingResult[]> {
    try {
      const { profiles, profileType, options } = request;
      const batchSize = options?.batchSize || this.config.batchSize;
      const results: EmbeddingResult[] = [];

      logger.info('Starting batch embedding generation', {
        count: profiles.length,
        profileType,
        batchSize
      });

      // Process in batches
      for (let i = 0; i < profiles.length; i += batchSize) {
        const batch = profiles.slice(i, i + batchSize);

        const batchPromises = batch.map(profile =>
          this.generateEmbedding(profile, profileType)
        );

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Emit progress
        const progress = Math.min(((i + batchSize) / profiles.length) * 100, 100);
        this.emit('batchProgress', {
          processed: results.length,
          total: profiles.length,
          progress,
          profileType
        });

        // Add delay to prevent rate limiting
        if (i + batchSize < profiles.length) {
          await this.sleep(100);
        }
      }

      logger.info('Batch embedding generation completed', {
        profileType,
        total: results.length,
        avgProcessingTime: results.reduce((sum, r) => sum + r.metadata.processingTime, 0) / results.length
      });

      this.emit('batchCompleted', {
        profileType,
        results: results.length,
        totalProcessingTime: results.reduce((sum, r) => sum + r.metadata.processingTime, 0)
      });

      return results;
    } catch (error) {
      logger.error('Batch embedding generation failed', {
        profileType,
        count: request.profiles.length,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Find similar profiles using semantic search
   */
  async findSimilarProfiles(
    profileId: string,
    profileType: 'candidate' | 'job',
    options?: {
      limit?: number;
      threshold?: number;
      filter?: any;
      includeMetadata?: boolean;
    }
  ): Promise<SimilarityResult[]> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const limit = options?.limit || this.config.maxResults;
      const threshold = options?.threshold || this.config.similarityThreshold;

      // Get the query embedding
      const queryEmbedding = await this.getEmbedding(profileId);
      if (!queryEmbedding) {
        throw new Error(`Embedding not found for profile: ${profileId}`);
      }

      // Build filter for opposite profile type
      const filter = {
        ...options?.filter,
        profileType: profileType === 'candidate' ? 'job' : 'candidate'
      };

      // Search for similar vectors
      const searchResults = await this.vectorStore.query({
        vector: queryEmbedding.vector,
        topK: limit,
        filter,
        includeMetadata: options?.includeMetadata || false
      });

      // Filter by similarity threshold
      const filteredResults = searchResults.filter(result => result.score >= threshold);

      // Convert to similarity results
      const similarityResults: SimilarityResult[] = filteredResults.map(result => ({
        profileId: result.id,
        profileType: filter.profileType,
        similarity: result.score,
        embedding: {
          vector: result.vector,
          dimension: result.vector.length,
          model: this.config.embeddingModel
        },
        metadata: result.metadata
      }));

      logger.debug('Similarity search completed', {
        queryProfileId: profileId,
        queryType: profileType,
        resultsFound: similarityResults.length,
        threshold
      });

      this.emit('similaritySearchCompleted', {
        queryProfileId: profileId,
        queryType: profileType,
        resultsCount: similarityResults.length
      });

      return similarityResults;
    } catch (error) {
      logger.error('Similarity search failed', {
        profileId,
        profileType,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Update embedding for a profile
   */
  async updateEmbedding(
    profile: CandidateProfile | JobProfile,
    profileType: 'candidate' | 'job'
  ): Promise<EmbeddingResult> {
    try {
      logger.info('Updating profile embedding', {
        profileId: profile.id,
        profileType
      });

      // Generate new embedding
      const result = await this.generateEmbedding(profile, profileType);

      // Update in vector store
      await this.vectorStore.upsert({
        id: profile.id,
        vector: result.embedding.vector,
        metadata: {
          profileType,
          title: profile.title,
          updatedAt: new Date().toISOString(),
          ...result.metadata
        }
      });

      logger.info('Profile embedding updated', {
        profileId: profile.id,
        profileType,
        processingTime: result.metadata.processingTime
      });

      this.emit('embeddingUpdated', {
        profileId: profile.id,
        profileType,
        result
      });

      return result;
    } catch (error) {
      logger.error('Embedding update failed', {
        profileId: profile.id,
        profileType,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Delete embedding for a profile
   */
  async deleteEmbedding(profileId: string): Promise<void> {
    try {
      // Remove from vector store
      await this.vectorStore.delete(profileId);

      // Remove from cache
      this.embeddingCache.delete(profileId);

      logger.info('Embedding deleted', { profileId });

      this.emit('embeddingDeleted', { profileId });
    } catch (error) {
      logger.error('Embedding deletion failed', {
        profileId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get embedding for a profile
   */
  async getEmbedding(profileId: string): Promise<EmbeddingVector | null> {
    try {
      // Check cache first
      if (this.config.enableCaching) {
        const cached = this.getFromCache(profileId);
        if (cached) {
          return cached;
        }
      }

      // Get from vector store
      const result = await this.vectorStore.fetch([profileId]);
      if (result.length === 0) {
        return null;
      }

      const embedding: EmbeddingVector = {
        vector: result[0].vector,
        dimension: result[0].vector.length,
        model: result[0].metadata?.model || this.config.embeddingModel
      };

      // Cache the result
      if (this.config.enableCaching) {
        this.setCache(profileId, embedding);
      }

      return embedding;
    } catch (error) {
      logger.error('Failed to get embedding', {
        profileId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Calculate similarity between two profiles
   */
  async calculateSimilarity(
    profileId1: string,
    profileId2: string
  ): Promise<number> {
    try {
      const embedding1 = await this.getEmbedding(profileId1);
      const embedding2 = await this.getEmbedding(profileId2);

      if (!embedding1 || !embedding2) {
        throw new Error('One or both embeddings not found');
      }

      const similarity = this.similaritySearch.cosineSimilarity(
        embedding1.vector,
        embedding2.vector
      );

      return similarity;
    } catch (error) {
      logger.error('Similarity calculation failed', {
        profileId1,
        profileId2,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get embedding statistics
   */
  async getStatistics(): Promise<{
    totalEmbeddings: number;
    candidateEmbeddings: number;
    jobEmbeddings: number;
    cacheHitRate: number;
    averageDimension: number;
    modelVersion: string;
  }> {
    try {
      const stats = await this.vectorStore.getStatistics();

      return {
        totalEmbeddings: stats.totalVectors,
        candidateEmbeddings: stats.vectorsByType?.candidate || 0,
        jobEmbeddings: stats.vectorsByType?.job || 0,
        cacheHitRate: this.calculateCacheHitRate(),
        averageDimension: stats.averageDimension || 0,
        modelVersion: this.config.embeddingModel
      };
    } catch (error) {
      logger.error('Failed to get statistics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return {
        totalEmbeddings: 0,
        candidateEmbeddings: 0,
        jobEmbeddings: 0,
        cacheHitRate: 0,
        averageDimension: 0,
        modelVersion: this.config.embeddingModel
      };
    }
  }

  /**
   * Optimize similarity thresholds based on performance data
   */
  async optimizeThresholds(): Promise<void> {
    try {
      logger.info('Starting threshold optimization');

      // Analyze recent similarity searches and their outcomes
      const optimizationData = await this.collectOptimizationData();

      // Calculate optimal threshold
      const newThreshold = this.calculateOptimalThreshold(optimizationData);

      if (Math.abs(newThreshold - this.config.similarityThreshold) > 0.05) {
        const oldThreshold = this.config.similarityThreshold;
        this.config.similarityThreshold = newThreshold;

        logger.info('Similarity threshold optimized', {
          oldThreshold,
          newThreshold,
          improvement: optimizationData.expectedImprovement
        });

        this.emit('thresholdOptimized', {
          oldThreshold,
          newThreshold,
          improvement: optimizationData.expectedImprovement
        });
      } else {
        logger.info('Threshold optimization complete - no significant change needed');
      }
    } catch (error) {
      logger.error('Threshold optimization failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Reindex all embeddings (useful after model updates)
   */
  async reindexEmbeddings(options?: {
    batchSize?: number;
    profileType?: 'candidate' | 'job';
    forceUpdate?: boolean;
  }): Promise<void> {
    try {
      logger.info('Starting embedding reindexing', options);

      const batchSize = options?.batchSize || this.config.batchSize;

      // Get all profiles to reindex
      const profiles = await this.getProfilesForReindexing(options?.profileType);

      // Process in batches
      for (let i = 0; i < profiles.length; i += batchSize) {
        const batch = profiles.slice(i, i + batchSize);

        for (const profile of batch) {
          try {
            if (options?.forceUpdate || !await this.getEmbedding(profile.id)) {
              await this.generateEmbedding(
                profile,
                options?.profileType || (profile as any).profileType
              );
            }
          } catch (error) {
            logger.warn('Failed to reindex profile', {
              profileId: profile.id,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }

        // Emit progress
        const progress = Math.min(((i + batchSize) / profiles.length) * 100, 100);
        this.emit('reindexProgress', {
          processed: Math.min(i + batchSize, profiles.length),
          total: profiles.length,
          progress
        });

        // Add delay to prevent overwhelming the system
        await this.sleep(50);
      }

      logger.info('Embedding reindexing completed', {
        totalProcessed: profiles.length
      });

      this.emit('reindexCompleted', { totalProcessed: profiles.length });
    } catch (error) {
      logger.error('Embedding reindexing failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Private helper methods
  private validateEmbedding(embedding: EmbeddingVector): void {
    if (!embedding.vector || embedding.vector.length === 0) {
      throw new Error('Embedding vector cannot be empty');
    }

    if (embedding.dimension && embedding.dimension !== embedding.vector.length) {
      throw new Error('Embedding dimension mismatch');
    }

    // Check for invalid values
    const hasInvalidValues = embedding.vector.some(val =>
      isNaN(val) || !isFinite(val)
    );

    if (hasInvalidValues) {
      throw new Error('Embedding contains invalid values');
    }
  }

  private getFromCache(profileId: string): EmbeddingVector | null {
    const cached = this.embeddingCache.get(profileId);
    if (cached && Date.now() - cached.timestamp < this.config.cacheTimeout) {
      return cached.embedding;
    }

    if (cached) {
      this.embeddingCache.delete(profileId);
    }

    return null;
  }

  private setCache(profileId: string, embedding: EmbeddingVector): void {
    this.embeddingCache.set(profileId, {
      embedding,
      timestamp: Date.now()
    });
  }

  private startCacheCleanup(): void {
    // Clean up expired cache entries every hour
    setInterval(() => {
      const now = Date.now();
      let cleaned = 0;

      for (const [key, value] of this.embeddingCache.entries()) {
        if (now - value.timestamp > this.config.cacheTimeout) {
          this.embeddingCache.delete(key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        logger.debug('Cache cleanup completed', { cleaned, remaining: this.embeddingCache.size });
      }
    }, 60 * 60 * 1000);
  }

  private calculateCacheHitRate(): number {
    // This would track cache hits/misses over time
    // For now, return a mock value
    return 0.85;
  }

  private async loadExistingEmbeddings(): Promise<void> {
    // Load existing embeddings from vector store
    // Implementation depends on your vector store setup
    logger.info('Loading existing embeddings from vector store');
  }

  private async collectOptimizationData(): Promise<any> {
    // Collect data for threshold optimization
    // This would analyze historical search results and user feedback
    return {
      searches: [],
      conversions: [],
      expectedImprovement: 0.05
    };
  }

  private calculateOptimalThreshold(data: any): number {
    // Calculate optimal threshold based on collected data
    // This would use statistical analysis to find the best threshold
    return 0.75; // Mock implementation
  }

  private async getProfilesForReindexing(profileType?: 'candidate' | 'job'): Promise<any[]> {
    // Get profiles that need reindexing
    // Implementation depends on your database setup
    return [];
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get service status
   */
  getStatus(): {
    initialized: boolean;
    config: EmbeddingServiceConfig;
    cacheSize: number;
    health: 'healthy' | 'degraded' | 'unhealthy';
  } {
    let health: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (!this.isInitialized) {
      health = 'unhealthy';
    } else if (this.embeddingCache.size === 0) {
      health = 'degraded';
    }

    return {
      initialized: this.isInitialized,
      config: this.config,
      cacheSize: this.embeddingCache.size,
      health
    };
  }
}

export default EmbeddingService;