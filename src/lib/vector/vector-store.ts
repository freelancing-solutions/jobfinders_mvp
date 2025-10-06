import {
  EmbeddingVector,
  VectorMetadata,
  VectorSearchConfig,
  VectorSearchResult
} from '@/types/matching';
import { logger } from '@/lib/logging/logger';
import { EventEmitter } from 'events';

/**
 * Vector store configuration
 */
export interface VectorStoreConfig {
  provider: 'pinecone' | 'weaviate' | 'chromadb' | 'local';
  indexName: string;
  dimension: number;
  metric: 'cosine' | 'euclidean' | 'dotproduct';
  cloudProvider?: 'aws' | 'gcp' | 'azure';
  region?: string;
  apiKey?: string;
  environment?: string;
}

/**
 * Vector record
 */
interface VectorRecord {
  id: string;
  vector: number[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Index statistics
 */
export interface IndexStatistics {
  totalVectors: number;
  dimension: number;
  metric: string;
  indexSize: number;
  vectorsByType?: Record<string, number>;
  lastUpdated: Date;
}

/**
 * Advanced vector store for semantic search
 */
export class VectorStore extends EventEmitter {
  private config: VectorStoreConfig;
  private isInitialized: boolean = false;
  private indexCache: Map<string, VectorRecord[]> = new Map();
  private pendingOperations: Map<string, Promise<any>> = new Map();

  constructor(config?: Partial<VectorStoreConfig>) {
    super();

    this.config = {
      provider: 'local',
      indexName: 'matching-index',
      dimension: 1536,
      metric: 'cosine',
      cloudProvider: 'aws',
      region: 'us-west-2',
      ...config
    };
  }

  /**
   * Initialize the vector store
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing vector store', {
        provider: this.config.provider,
        indexName: this.config.indexName,
        dimension: this.config.dimension
      });

      switch (this.config.provider) {
        case 'pinecone':
          await this.initializePinecone();
          break;
        case 'weaviate':
          await this.initializeWeaviate();
          break;
        case 'chromadb':
          await this.initializeChromaDB();
          break;
        case 'local':
          await this.initializeLocal();
          break;
        default:
          throw new Error(`Unsupported vector store provider: ${this.config.provider}`);
      }

      this.isInitialized = true;

      logger.info('Vector store initialized successfully');
      this.emit('initialized');
    } catch (error) {
      logger.error('Failed to initialize vector store', {
        provider: this.config.provider,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Insert or update vectors
   */
  async upsert(vectors: Array<{
    id: string;
    vector: number[];
    metadata?: Record<string, any>;
  }>): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Validate vectors
      for (const item of vectors) {
        this.validateVector(item);
      }

      const operationId = `upsert_${Date.now()}`;
      const operation = this.performUpsert(vectors);

      // Track operation
      this.pendingOperations.set(operationId, operation);

      try {
        await operation;
        logger.debug('Vectors upserted successfully', {
          count: vectors.length,
          operationId
        });

        this.emit('vectorsUpserted', {
          count: vectors.length,
          ids: vectors.map(v => v.id)
        });
      } finally {
        this.pendingOperations.delete(operationId);
      }
    } catch (error) {
      logger.error('Vector upsert failed', {
        count: vectors.length,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Query vectors by similarity
   */
  async query(query: {
    vector: number[];
    topK: number;
    filter?: Record<string, any>;
    includeMetadata?: boolean;
    includeVector?: boolean;
  }): Promise<VectorSearchResult[]> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Validate query vector
      this.validateVector({ id: 'query', vector: query.vector });

      const results = await this.performQuery(query);

      logger.debug('Vector query completed', {
        topK: query.topK,
        resultsFound: results.length,
        filter: query.filter
      });

      this.emit('queryCompleted', {
        queryVector: query.vector,
        resultsCount: results.length
      });

      return results;
    } catch (error) {
      logger.error('Vector query failed', {
        topK: query.topK,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Fetch vectors by IDs
   */
  async fetch(ids: string[]): Promise<Array<{
    id: string;
    vector: number[];
    metadata: Record<string, any>;
  }>> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const results = await this.performFetch(ids);

      logger.debug('Vectors fetched successfully', {
        requestedIds: ids.length,
        foundIds: results.length
      });

      return results;
    } catch (error) {
      logger.error('Vector fetch failed', {
        ids,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Delete vectors by IDs
   */
  async delete(ids: string[]): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      await this.performDelete(ids);

      logger.debug('Vectors deleted successfully', {
        deletedIds: ids.length
      });

      this.emit('vectorsDeleted', { ids });
    } catch (error) {
      logger.error('Vector deletion failed', {
        ids,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get index statistics
   */
  async getStatistics(): Promise<IndexStatistics> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const stats = await this.performGetStatistics();

      return stats;
    } catch (error) {
      logger.error('Failed to get statistics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return {
        totalVectors: 0,
        dimension: this.config.dimension,
        metric: this.config.metric,
        indexSize: 0,
        lastUpdated: new Date()
      };
    }
  }

  /**
   * Create index
   */
  async createIndex(options?: {
    dimension?: number;
    metric?: 'cosine' | 'euclidean' | 'dotproduct';
    pods?: number;
    replicas?: number;
  }): Promise<void> {
    try {
      logger.info('Creating vector index', {
        provider: this.config.provider,
        indexName: this.config.indexName,
        options
      });

      await this.performCreateIndex(options);

      logger.info('Vector index created successfully');
      this.emit('indexCreated');
    } catch (error) {
      logger.error('Index creation failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Delete index
   */
  async deleteIndex(): Promise<void> {
    try {
      logger.info('Deleting vector index', {
        provider: this.config.provider,
        indexName: this.config.indexName
      });

      await this.performDeleteIndex();

      logger.info('Vector index deleted successfully');
      this.emit('indexDeleted');
    } catch (error) {
      logger.error('Index deletion failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Provider-specific implementations
  private async initializePinecone(): Promise<void> {
    try {
      // Initialize Pinecone client
      const { PineconeClient } = await import('@pinecone-database/pinecone');

      const client = new PineconeClient();
      await client.init({
        apiKey: this.config.apiKey || '',
        environment: this.config.environment || 'us-west1-gcp'
      });

      // Check if index exists
      const { listIndexes } = await import('@pinecone-database/pinecone');
      const indexes = await client.listIndexes();

      const indexExists = indexes.some(index => index.name === this.config.indexName);

      if (!indexExists) {
        await this.createIndex();
      }

      logger.info('Pinecone initialized successfully');
    } catch (error) {
      logger.error('Pinecone initialization failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private async initializeWeaviate(): Promise<void> {
    try {
      // Initialize Weaviate client
      const { WeaviateClient } = await import('weaviate-client');

      const client = new WeaviateClient({
        scheme: 'https',
        host: this.config.environment || 'localhost:8080',
        apiKey: this.config.apiKey
      });

      // Check if schema exists
      const schema = await client.schema.get();
      const classExists = schema.classes.some(cls => cls.class === this.config.indexName);

      if (!classExists) {
        await this.createWeaviateSchema();
      }

      logger.info('Weaviate initialized successfully');
    } catch (error) {
      logger.error('Weaviate initialization failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private async initializeChromaDB(): Promise<void> {
    try {
      // Initialize ChromaDB client
      const { ChromaClient } = await import('chromadb');

      const client = new ChromaClient({
        path: this.config.environment || 'http://localhost:8000'
      });

      // Get or create collection
      const collection = await client.getOrCreateCollection({
        name: this.config.indexName,
        metadata: {
          dimension: this.config.dimension,
          metric: this.config.metric
        }
      });

      logger.info('ChromaDB initialized successfully');
    } catch (error) {
      logger.error('ChromaDB initialization failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private async initializeLocal(): Promise<void> {
    try {
      // Initialize local vector store (in-memory or file-based)
      if (!this.indexCache.has(this.config.indexName)) {
        this.indexCache.set(this.config.indexName, []);
      }

      logger.info('Local vector store initialized successfully');
    } catch (error) {
      logger.error('Local vector store initialization failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private async performUpsert(vectors: Array<{
    id: string;
    vector: number[];
    metadata?: Record<string, any>;
  }>): Promise<void> {
    switch (this.config.provider) {
      case 'pinecone':
        return this.pineconeUpsert(vectors);
      case 'weaviate':
        return this.weaviateUpsert(vectors);
      case 'chromadb':
        return this.chromaUpsert(vectors);
      case 'local':
        return this.localUpsert(vectors);
    }
  }

  private async performQuery(query: {
    vector: number[];
    topK: number;
    filter?: Record<string, any>;
    includeMetadata?: boolean;
    includeVector?: boolean;
  }): Promise<VectorSearchResult[]> {
    switch (this.config.provider) {
      case 'pinecone':
        return this.pineconeQuery(query);
      case 'weaviate':
        return this.weaviateQuery(query);
      case 'chromadb':
        return this.chromaQuery(query);
      case 'local':
        return this.localQuery(query);
    }
  }

  private async performFetch(ids: string[]): Promise<Array<{
    id: string;
    vector: number[];
    metadata: Record<string, any>;
  }>> {
    switch (this.config.provider) {
      case 'pinecone':
        return this.pineconeFetch(ids);
      case 'weaviate':
        return this.weaviateFetch(ids);
      case 'chromadb':
        return this.chromaFetch(ids);
      case 'local':
        return this.localFetch(ids);
    }
  }

  private async performDelete(ids: string[]): Promise<void> {
    switch (this.config.provider) {
      case 'pinecone':
        return this.pineconeDelete(ids);
      case 'weaviate':
        return this.weaviateDelete(ids);
      case 'chromadb':
        return this.chromaDelete(ids);
      case 'local':
        return this.localDelete(ids);
    }
  }

  private async performGetStatistics(): Promise<IndexStatistics> {
    switch (this.config.provider) {
      case 'pinecone':
        return this.pineconeGetStatistics();
      case 'weaviate':
        return this.weaviateGetStatistics();
      case 'chromadb':
        return this.chromaGetStatistics();
      case 'local':
        return this.localGetStatistics();
    }
  }

  private async performCreateIndex(options?: any): Promise<void> {
    switch (this.config.provider) {
      case 'pinecone':
        return this.pineconeCreateIndex(options);
      case 'weaviate':
        return this.weaviateCreateSchema();
      case 'chromadb':
        return this.chromaCreateCollection(options);
      case 'local':
        return this.localCreateIndex(options);
    }
  }

  private async performDeleteIndex(): Promise<void> {
    switch (this.config.provider) {
      case 'pinecone':
        return this.pineconeDeleteIndex();
      case 'weaviate':
        return this.weaviateDeleteSchema();
      case 'chromadb':
        return this.chromaDeleteCollection();
      case 'local':
        return this.localDeleteIndex();
    }
  }

  // Local implementation (simplified)
  private async localUpsert(vectors: Array<{
    id: string;
    vector: number[];
    metadata?: Record<string, any>;
  }>): Promise<void> {
    const index = this.indexCache.get(this.config.indexName) || [];
    const now = new Date();

    for (const vector of vectors) {
      const existingIndex = index.findIndex(item => item.id === vector.id);
      const record: VectorRecord = {
        id: vector.id,
        vector: vector.vector,
        metadata: vector.metadata || {},
        createdAt: now,
        updatedAt: now
      };

      if (existingIndex >= 0) {
        index[existingIndex] = record;
      } else {
        index.push(record);
      }
    }

    this.indexCache.set(this.config.indexName, index);
  }

  private async localQuery(query: {
    vector: number[];
    topK: number;
    filter?: Record<string, any>;
    includeMetadata?: boolean;
    includeVector?: boolean;
  }): Promise<VectorSearchResult[]> {
    const index = this.indexCache.get(this.config.indexName) || [];
    let candidates = index;

    // Apply filter
    if (query.filter) {
      candidates = index.filter(record => {
        return Object.entries(query.filter!).every(([key, value]) => {
          return record.metadata[key] === value;
        });
      });
    }

    // Calculate similarities
    const similarities = candidates.map(record => ({
      id: record.id,
      score: this.cosineSimilarity(query.vector, record.vector),
      vector: query.includeVector ? record.vector : undefined,
      metadata: query.includeMetadata ? record.metadata : undefined
    }));

    // Sort by similarity and take topK
    return similarities
      .sort((a, b) => b.score - a.score)
      .slice(0, query.topK);
  }

  private async localFetch(ids: string[]): Promise<Array<{
    id: string;
    vector: number[];
    metadata: Record<string, any>;
  }>> {
    const index = this.indexCache.get(this.config.indexName) || [];

    return index
      .filter(record => ids.includes(record.id))
      .map(record => ({
        id: record.id,
        vector: record.vector,
        metadata: record.metadata
      }));
  }

  private async localDelete(ids: string[]): Promise<void> {
    const index = this.indexCache.get(this.config.indexName) || [];
    const filteredIndex = index.filter(record => !ids.includes(record.id));
    this.indexCache.set(this.config.indexName, filteredIndex);
  }

  private async localGetStatistics(): Promise<IndexStatistics> {
    const index = this.indexCache.get(this.config.indexName) || [];

    const vectorsByType = index.reduce((acc, record) => {
      const type = record.metadata.profileType || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalVectors: index.length,
      dimension: this.config.dimension,
      metric: this.config.metric,
      indexSize: index.length * this.config.dimension * 8, // Rough estimation
      vectorsByType,
      lastUpdated: new Date()
    };
  }

  private async localCreateIndex(options?: any): Promise<void> {
    if (!this.indexCache.has(this.config.indexName)) {
      this.indexCache.set(this.config.indexName, []);
    }
  }

  private async localDeleteIndex(): Promise<void> {
    this.indexCache.delete(this.config.indexName);
  }

  // Placeholder implementations for other providers
  private async pineconeUpsert(vectors: any[]): Promise<void> {
    // Pinecone implementation
    throw new Error('Pinecone implementation not yet available');
  }

  private async pineconeQuery(query: any): Promise<VectorSearchResult[]> {
    // Pinecone implementation
    throw new Error('Pinecone implementation not yet available');
  }

  private async pineconeFetch(ids: string[]): Promise<any[]> {
    // Pinecone implementation
    throw new Error('Pinecone implementation not yet available');
  }

  private async pineconeDelete(ids: string[]): Promise<void> {
    // Pinecone implementation
    throw new Error('Pinecone implementation not yet available');
  }

  private async pineconeGetStatistics(): Promise<IndexStatistics> {
    // Pinecone implementation
    throw new Error('Pinecone implementation not yet available');
  }

  private async pineconeCreateIndex(options?: any): Promise<void> {
    // Pinecone implementation
    throw new Error('Pinecone implementation not yet available');
  }

  private async pineconeDeleteIndex(): Promise<void> {
    // Pinecone implementation
    throw new Error('Pinecone implementation not yet available');
  }

  private async weaviateUpsert(vectors: any[]): Promise<void> {
    // Weaviate implementation
    throw new Error('Weaviate implementation not yet available');
  }

  private async weaviateQuery(query: any): Promise<VectorSearchResult[]> {
    // Weaviate implementation
    throw new Error('Weaviate implementation not yet available');
  }

  private async weaviateFetch(ids: string[]): Promise<any[]> {
    // Weaviate implementation
    throw new Error('Weaviate implementation not yet available');
  }

  private async weaviateDelete(ids: string[]): Promise<void> {
    // Weaviate implementation
    throw new Error('Weaviate implementation not yet available');
  }

  private async weaviateGetStatistics(): Promise<IndexStatistics> {
    // Weaviate implementation
    throw new Error('Weaviate implementation not yet available');
  }

  private async weaviateCreateSchema(): Promise<void> {
    // Weaviate implementation
    throw new Error('Weaviate implementation not yet available');
  }

  private async weaviateDeleteSchema(): Promise<void> {
    // Weaviate implementation
    throw new Error('Weaviate implementation not yet available');
  }

  private async chromaUpsert(vectors: any[]): Promise<void> {
    // ChromaDB implementation
    throw new Error('ChromaDB implementation not yet available');
  }

  private async chromaQuery(query: any): Promise<VectorSearchResult[]> {
    // ChromaDB implementation
    throw new Error('ChromaDB implementation not yet available');
  }

  private async chromaFetch(ids: string[]): Promise<any[]> {
    // ChromaDB implementation
    throw new Error('ChromaDB implementation not yet available');
  }

  private async chromaDelete(ids: string[]): Promise<void> {
    // ChromaDB implementation
    throw new Error('ChromaDB implementation not yet available');
  }

  private async chromaGetStatistics(): Promise<IndexStatistics> {
    // ChromaDB implementation
    throw new Error('ChromaDB implementation not yet available');
  }

  private async chromaCreateCollection(options?: any): Promise<void> {
    // ChromaDB implementation
    throw new Error('ChromaDB implementation not yet available');
  }

  private async chromaDeleteCollection(): Promise<void> {
    // ChromaDB implementation
    throw new Error('ChromaDB implementation not yet available');
  }

  // Helper methods
  private validateVector(vector: { id: string; vector: number[]; metadata?: any }): void {
    if (!vector.id) {
      throw new Error('Vector ID is required');
    }

    if (!vector.vector || vector.vector.length === 0) {
      throw new Error('Vector cannot be empty');
    }

    if (this.config.dimension && vector.vector.length !== this.config.dimension) {
      throw new Error(`Vector dimension mismatch. Expected ${this.config.dimension}, got ${vector.vector.length}`);
    }

    // Check for invalid values
    const hasInvalidValues = vector.vector.some(val => isNaN(val) || !isFinite(val));
    if (hasInvalidValues) {
      throw new Error('Vector contains invalid values (NaN or infinite)');
    }
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same dimension');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * Get service status
   */
  getStatus(): {
    initialized: boolean;
    provider: string;
    indexName: string;
    config: VectorStoreConfig;
    pendingOperations: number;
    health: 'healthy' | 'degraded' | 'unhealthy';
  } {
    let health: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (!this.isInitialized) {
      health = 'unhealthy';
    } else if (this.pendingOperations.size > 10) {
      health = 'degraded';
    }

    return {
      initialized: this.isInitialized,
      provider: this.config.provider,
      indexName: this.config.indexName,
      config: this.config,
      pendingOperations: this.pendingOperations.size,
      health
    };
  }
}

export default VectorStore;