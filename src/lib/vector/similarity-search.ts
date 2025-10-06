import {
  EmbeddingVector,
  VectorSearchResult,
  SimilaritySearchConfig,
  SimilarityMetrics,
  SimilaritySearchOptions
} from '@/types/matching';
import { logger } from '@/lib/logging/logger';

/**
 * Similarity search configuration
 */
export interface SimilaritySearchOptionsConfig {
  defaultMetric: 'cosine' | 'euclidean' | 'dotproduct' | 'manhattan';
  normalizeVectors: boolean;
  useApproximateSearch: boolean;
  approximateSearchParams: {
    efConstruction?: number;
    efSearch?: number;
    m?: number;
  };
  batchSize: number;
  resultThreshold: number;
  enableMetadataFiltering: boolean;
}

/**
 * Similarity search result with additional metrics
 */
export interface EnhancedSimilarityResult extends VectorSearchResult {
  metrics: {
    similarity: number;
    distance: number;
    rank: number;
    relativeScore: number;
  };
  explanation?: {
    matchingFeatures: string[];
    scoreBreakdown: Record<string, number>;
    confidence: number;
  };
}

/**
 * Advanced similarity search with multiple metrics and optimizations
 */
export class SimilaritySearch {
  private config: SimilaritySearchOptionsConfig;

  constructor(config?: Partial<SimilaritySearchOptionsConfig>) {
    this.config = {
      defaultMetric: 'cosine',
      normalizeVectors: true,
      useApproximateSearch: false,
      approximateSearchParams: {
        efConstruction: 200,
        efSearch: 50,
        m: 16
      },
      batchSize: 100,
      resultThreshold: 0.5,
      enableMetadataFiltering: true,
      ...config
    };
  }

  /**
   * Calculate similarity between two vectors
   */
  calculateSimilarity(
    vectorA: number[],
    vectorB: number[],
    metric: 'cosine' | 'euclidean' | 'dotproduct' | 'manhattan' = this.config.defaultMetric
  ): number {
    try {
      // Validate vectors
      this.validateVectors(vectorA, vectorB);

      // Normalize vectors if configured
      let normalizedA = vectorA;
      let normalizedB = vectorB;

      if (this.config.normalizeVectors) {
        normalizedA = this.normalizeVector(vectorA);
        normalizedB = this.normalizeVector(vectorB);
      }

      // Calculate similarity based on metric
      switch (metric) {
        case 'cosine':
          return this.cosineSimilarity(normalizedA, normalizedB);
        case 'euclidean':
          return this.euclideanSimilarity(normalizedA, normalizedB);
        case 'dotproduct':
          return this.dotProductSimilarity(normalizedA, normalizedB);
        case 'manhattan':
          return this.manhattanSimilarity(normalizedA, normalizedB);
        default:
          throw new Error(`Unsupported similarity metric: ${metric}`);
      }
    } catch (error) {
      logger.error('Similarity calculation failed', {
        metric,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Find most similar vectors from a dataset
   */
  findMostSimilar(
    queryVector: number[],
    candidates: Array<{
      id: string;
      vector: number[];
      metadata?: Record<string, any>;
    }>,
    options: SimilaritySearchOptions = {}
  ): EnhancedSimilarityResult[] {
    try {
      const {
        topK = 10,
        metric = this.config.defaultMetric,
        threshold = this.config.resultThreshold,
        includeMetadata = true,
        filter
      } = options;

      // Validate query vector
      if (!queryVector || queryVector.length === 0) {
        throw new Error('Query vector cannot be empty');
      }

      // Normalize query vector if configured
      const normalizedQuery = this.config.normalizeVectors
        ? this.normalizeVector(queryVector)
        : queryVector;

      // Filter candidates if filter provided
      let filteredCandidates = candidates;
      if (filter && this.config.enableMetadataFiltering) {
        filteredCandidates = candidates.filter(candidate =>
          this.matchesFilter(candidate.metadata, filter)
        );
      }

      // Calculate similarities
      const similarities = filteredCandidates.map(candidate => {
        const normalizedCandidate = this.config.normalizeVectors
          ? this.normalizeVector(candidate.vector)
          : candidate.vector;

        const similarity = this.calculateSimilarity(
          normalizedQuery,
          normalizedCandidate,
          metric
        );

        return {
          id: candidate.id,
          vector: includeMetadata ? candidate.vector : undefined,
          metadata: includeMetadata ? candidate.metadata : undefined,
          score: similarity,
          metrics: {
            similarity,
            distance: this.similarityToDistance(similarity, metric),
            rank: 0, // Will be set after sorting
            relativeScore: 0 // Will be calculated after sorting
          }
        };
      });

      // Filter by threshold
      const filteredSimilarities = similarities.filter(result =>
        result.score >= threshold
      );

      // Sort by similarity (descending)
      filteredSimilarities.sort((a, b) => b.score - a.score);

      // Update ranks and relative scores
      const maxScore = filteredSimilarities[0]?.score || 0;
      filteredSimilarities.forEach((result, index) => {
        result.metrics.rank = index + 1;
        result.metrics.relativeScore = maxScore > 0 ? result.score / maxScore : 0;
      });

      // Take topK results
      const topResults = filteredSimilarities.slice(0, topK);

      // Generate explanations if metadata is available
      if (includeMetadata && topResults.length > 0) {
        topResults.forEach(result => {
          result.explanation = this.generateExplanation(
            normalizedQuery,
            candidates.find(c => c.id === result.id)?.vector || [],
            result.metadata,
            metric
          );
        });
      }

      logger.debug('Similarity search completed', {
        candidatesCount: candidates.length,
        filteredCount: filteredCandidates.length,
        resultsCount: topResults.length,
        metric,
        threshold
      });

      return topResults;
    } catch (error) {
      logger.error('Similarity search failed', {
        candidatesCount: candidates.length,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Batch similarity calculations
   */
  batchSimilarity(
    queryVector: number[],
    candidateVectors: number[][],
    metric: 'cosine' | 'euclidean' | 'dotproduct' | 'manhattan' = this.config.defaultMetric
  ): number[] {
    try {
      const results: number[] = [];
      const batchSize = this.config.batchSize;

      // Normalize query vector if configured
      const normalizedQuery = this.config.normalizeVectors
        ? this.normalizeVector(queryVector)
        : queryVector;

      // Process in batches
      for (let i = 0; i < candidateVectors.length; i += batchSize) {
        const batch = candidateVectors.slice(i, i + batchSize);

        const batchResults = batch.map(vector =>
          this.calculateSimilarity(normalizedQuery, vector, metric)
        );

        results.push(...batchResults);
      }

      return results;
    } catch (error) {
      logger.error('Batch similarity calculation failed', {
        candidateCount: candidateVectors.length,
        metric,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Find approximate nearest neighbors (for large datasets)
   */
  async findApproximateNeighbors(
    queryVector: number[],
    candidates: Array<{
      id: string;
      vector: number[];
      metadata?: Record<string, any>;
    }>,
    options: {
      topK?: number;
      ef?: number;
      metric?: 'cosine' | 'euclidean' | 'dotproduct' | 'manhattan';
    } = {}
  ): Promise<EnhancedSimilarityResult[]> {
    try {
      if (!this.config.useApproximateSearch) {
        // Fall back to exact search
        return this.findMostSimilar(queryVector, candidates, options);
      }

      const {
        topK = 10,
        ef = this.config.approximateSearchParams.efSearch,
        metric = this.config.defaultMetric
      } = options;

      // For now, implement a simple approximate search using clustering
      // In a real implementation, this would use HNSW, Annoy, or similar
      const clusters = this.clusterVectors(candidates);
      const promisingClusters = this.findPromisingClusters(queryVector, clusters, topK);

      // Search within promising clusters
      const promisingCandidates = promisingClusters.flatMap(cluster => cluster.vectors);

      return this.findMostSimilar(queryVector, promisingCandidates, {
        topK,
        metric,
        includeMetadata: true
      });
    } catch (error) {
      logger.error('Approximate nearest neighbor search failed', {
        candidatesCount: candidates.length,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Calculate similarity matrix for a set of vectors
   */
  calculateSimilarityMatrix(
    vectors: number[][],
    metric: 'cosine' | 'euclidean' | 'dotproduct' | 'manhattan' = this.config.defaultMetric
  ): number[][] {
    try {
      const matrix: number[][] = [];

      for (let i = 0; i < vectors.length; i++) {
        matrix[i] = [];
        for (let j = 0; j < vectors.length; j++) {
          if (i === j) {
            matrix[i][j] = 1.0; // Self-similarity
          } else {
            matrix[i][j] = this.calculateSimilarity(vectors[i], vectors[j], metric);
          }
        }
      }

      return matrix;
    } catch (error) {
      logger.error('Similarity matrix calculation failed', {
        vectorCount: vectors.length,
        metric,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Multi-metric similarity search
   */
  multiMetricSearch(
    queryVector: number[],
    candidates: Array<{
      id: string;
      vector: number[];
      metadata?: Record<string, any>;
    }>,
    metrics: Array<{
      type: 'cosine' | 'euclidean' | 'dotproduct' | 'manhattan';
      weight: number;
    }>,
    options: {
      topK?: number;
      threshold?: number;
    } = {}
  ): EnhancedSimilarityResult[] {
    try {
      const { topK = 10, threshold = 0.5 } = options;

      // Calculate similarity for each metric
      const metricResults = metrics.map(metricConfig => {
        const results = this.findMostSimilar(queryVector, candidates, {
          topK: candidates.length, // Get all results
          metric: metricConfig.type,
          threshold: 0,
          includeMetadata: true
        });

        return {
          type: metricConfig.type,
          weight: metricConfig.weight,
          results
        };
      });

      // Combine results using weighted average
      const combinedScores = new Map<string, {
        id: string;
        vector: number[];
        metadata?: Record<string, any>;
        weightedScore: number;
        metricScores: Record<string, number>;
      }>();

      metricResults.forEach(metricResult => {
        metricResult.results.forEach(result => {
          if (!combinedScores.has(result.id)) {
            combinedScores.set(result.id, {
              id: result.id,
              vector: result.vector,
              metadata: result.metadata,
              weightedScore: 0,
              metricScores: {}
            });
          }

          const combined = combinedScores.get(result.id)!;
          combined.metricScores[metricResult.type] = result.score;
          combined.weightedScore += result.score * metricResult.weight;
        });
      });

      // Normalize weighted scores
      const totalWeight = metrics.reduce((sum, m) => sum + m.weight, 0);
      const finalResults = Array.from(combinedScores.values())
        .map(combined => ({
          id: combined.id,
          vector: combined.vector,
          metadata: combined.metadata,
          score: combined.weightedScore / totalWeight,
          metrics: {
            similarity: combined.weightedScore / totalWeight,
            distance: 0, // Calculate distance if needed
            rank: 0,
            relativeScore: 0
          },
          explanation: {
            matchingFeatures: [],
            scoreBreakdown: combined.metricScores,
            confidence: Math.max(...Object.values(combined.metricScores))
          }
        }))
        .filter(result => result.score >= threshold)
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);

      // Update ranks and relative scores
      const maxScore = finalResults[0]?.score || 0;
      finalResults.forEach((result, index) => {
        result.metrics.rank = index + 1;
        result.metrics.relativeScore = maxScore > 0 ? result.score / maxScore : 0;
      });

      return finalResults;
    } catch (error) {
      logger.error('Multi-metric search failed', {
        candidatesCount: candidates.length,
        metrics: metrics.map(m => m.type),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Private helper methods
  private validateVectors(vectorA: number[], vectorB: number[]): void {
    if (!vectorA || !vectorB) {
      throw new Error('Vectors cannot be null or undefined');
    }

    if (vectorA.length === 0 || vectorB.length === 0) {
      throw new Error('Vectors cannot be empty');
    }

    if (vectorA.length !== vectorB.length) {
      throw new Error('Vectors must have the same dimension');
    }

    // Check for invalid values
    const hasInvalidValues = [...vectorA, ...vectorB].some(val =>
      isNaN(val) || !isFinite(val)
    );

    if (hasInvalidValues) {
      throw new Error('Vectors contain invalid values (NaN or infinite)');
    }
  }

  private normalizeVector(vector: number[]): number[] {
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));

    if (norm === 0) {
      return vector; // Return as-is if zero vector
    }

    return vector.map(val => val / norm);
  }

  private cosineSimilarity(vectorA: number[], vectorB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      normA += vectorA[i] * vectorA[i];
      normB += vectorB[i] * vectorB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  private euclideanSimilarity(vectorA: number[], vectorB: number[]): number {
    let distance = 0;

    for (let i = 0; i < vectorA.length; i++) {
      const diff = vectorA[i] - vectorB[i];
      distance += diff * diff;
    }

    distance = Math.sqrt(distance);

    // Convert distance to similarity (1 / (1 + distance))
    return 1 / (1 + distance);
  }

  private dotProductSimilarity(vectorA: number[], vectorB: number[]): number {
    let dotProduct = 0;

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
    }

    // Normalize dot product to [0, 1] range
    const normA = Math.sqrt(vectorA.reduce((sum, val) => sum + val * val, 0));
    const normB = Math.sqrt(vectorB.reduce((sum, val) => sum + val * val, 0));

    if (normA === 0 || normB === 0) {
      return 0;
    }

    const normalizedDotProduct = dotProduct / (normA * normB);
    return (normalizedDotProduct + 1) / 2; // Scale from [-1, 1] to [0, 1]
  }

  private manhattanSimilarity(vectorA: number[], vectorB: number[]): number {
    let distance = 0;

    for (let i = 0; i < vectorA.length; i++) {
      distance += Math.abs(vectorA[i] - vectorB[i]);
    }

    // Convert distance to similarity
    const maxPossibleDistance = vectorA.length * 2; // Assuming normalized vectors
    return 1 - (distance / maxPossibleDistance);
  }

  private similarityToDistance(similarity: number, metric: string): number {
    switch (metric) {
      case 'cosine':
        return Math.acos(similarity); // Angular distance
      case 'euclidean':
        return Math.sqrt(2 * (1 - similarity)); // Convert to Euclidean distance
      case 'dotproduct':
        return 1 - similarity; // Simple inverse
      case 'manhattan':
        return 1 - similarity; // Simple inverse
      default:
        return 1 - similarity;
    }
  }

  private matchesFilter(metadata: Record<string, any> | undefined, filter: Record<string, any>): boolean {
    if (!metadata || !filter) {
      return true;
    }

    return Object.entries(filter).every(([key, value]) => {
      const metadataValue = metadata[key];

      if (Array.isArray(value)) {
        return value.includes(metadataValue);
      } else if (typeof value === 'object' && value !== null) {
        return Object.entries(value).every(([subKey, subValue]) => {
          return metadataValue?.[subKey] === subValue;
        });
      } else {
        return metadataValue === value;
      }
    });
  }

  private generateExplanation(
    queryVector: number[],
    candidateVector: number[],
    metadata: Record<string, any> | undefined,
    metric: string
  ): EnhancedSimilarityResult['explanation'] {
    const matchingFeatures: string[] = [];
    const scoreBreakdown: Record<string, number> = {};
    let confidence = 0.7;

    // Analyze vector dimensions to identify contributing features
    for (let i = 0; i < Math.min(queryVector.length, 10); i++) {
      const contribution = Math.abs(queryVector[i] * candidateVector[i]);
      if (contribution > 0.1) {
        matchingFeatures.push(`feature_${i}`);
        scoreBreakdown[`feature_${i}`] = contribution;
      }
    }

    // Add metadata-based explanations
    if (metadata) {
      if (metadata.skills) {
        matchingFeatures.push('skills_match');
        scoreBreakdown.skills = 0.3;
      }
      if (metadata.experience) {
        matchingFeatures.push('experience_alignment');
        scoreBreakdown.experience = 0.2;
      }
    }

    // Calculate confidence based on consistency of scores
    const scores = Object.values(scoreBreakdown);
    if (scores.length > 0) {
      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      const variance = scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / scores.length;
      confidence = Math.max(0.5, 1 - variance);
    }

    return {
      matchingFeatures,
      scoreBreakdown,
      confidence
    };
  }

  private clusterVectors(candidates: Array<{
    id: string;
    vector: number[];
    metadata?: Record<string, any>;
  }>): Array<{ center: number[]; vectors: typeof candidates }> {
    // Simple k-means clustering implementation
    const k = Math.min(10, Math.max(1, Math.floor(candidates.length / 10)));
    const clusters: Array<{ center: number[]; vectors: typeof candidates }> = [];

    // Initialize cluster centers (random selection)
    const centers: number[][] = [];
    for (let i = 0; i < k; i++) {
      const randomIndex = Math.floor(Math.random() * candidates.length);
      centers.push([...candidates[randomIndex].vector]);
    }

    // Assign vectors to clusters
    for (let i = 0; i < k; i++) {
      clusters.push({ center: centers[i], vectors: [] });
    }

    candidates.forEach(candidate => {
      let bestCluster = 0;
      let bestDistance = Infinity;

      centers.forEach((center, index) => {
        const distance = this.euclideanDistance(candidate.vector, center);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestCluster = index;
        }
      });

      clusters[bestCluster].vectors.push(candidate);
    });

    return clusters;
  }

  private findPromisingClusters(
    queryVector: number[],
    clusters: Array<{ center: number[]; vectors: any[] }>,
    topK: number
  ): Array<{ center: number[]; vectors: any[] }> {
    // Calculate distance from query to each cluster center
    const clusterDistances = clusters.map(cluster => ({
      cluster,
      distance: this.euclideanDistance(queryVector, cluster.center)
    }));

    // Sort by distance and take top clusters
    clusterDistances.sort((a, b) => a.distance - b.distance);

    // Take enough clusters to potentially get topK results
    const promisingClusters = clusterDistances
      .slice(0, Math.min(topK * 2, clusters.length))
      .map(item => item.cluster);

    return promisingClusters;
  }

  private euclideanDistance(vectorA: number[], vectorB: number[]): number {
    let distance = 0;

    for (let i = 0; i < vectorA.length; i++) {
      const diff = vectorA[i] - vectorB[i];
      distance += diff * diff;
    }

    return Math.sqrt(distance);
  }
}

// Helper function for multi-metric search
function maxScore(obj: Record<string, number>): number {
  return Math.max(...Object.values(obj));
}

export default SimilaritySearch;