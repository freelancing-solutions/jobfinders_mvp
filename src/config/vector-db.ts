import { VectorStoreConfig } from '@/lib/vector/vector-store';
import { EmbeddingServiceConfig } from '@/services/matching/embedding-service';

/**
 * Vector database configuration
 */
export interface VectorDBConfig {
  provider: 'pinecone' | 'weaviate' | 'chromadb' | 'local';
  credentials: {
    apiKey?: string;
    environment?: string;
    host?: string;
    port?: number;
    username?: string;
    password?: string;
  };
  indexConfig: {
    name: string;
    dimension: number;
    metric: 'cosine' | 'euclidean' | 'dotproduct';
    pods?: number;
    replicas?: number;
    podType?: string;
  };
  performance: {
    batchSize: number;
    maxConcurrency: number;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
  };
  caching: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
  };
}

/**
 * Environment-specific vector database configurations
 */
export const VectorDBConfigs: Record<string, VectorDBConfig> = {
  development: {
    provider: 'local',
    credentials: {},
    indexConfig: {
      name: 'job-matching-dev',
      dimension: 1536,
      metric: 'cosine'
    },
    performance: {
      batchSize: 50,
      maxConcurrency: 2,
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000
    },
    caching: {
      enabled: true,
      ttl: 3600000, // 1 hour
      maxSize: 1000
    }
  },

  staging: {
    provider: 'chromadb',
    credentials: {
      host: process.env.CHROMA_HOST || 'localhost',
      port: parseInt(process.env.CHROMA_PORT || '8000')
    },
    indexConfig: {
      name: 'job-matching-staging',
      dimension: 1536,
      metric: 'cosine'
    },
    performance: {
      batchSize: 100,
      maxConcurrency: 5,
      timeout: 60000,
      retryAttempts: 5,
      retryDelay: 2000
    },
    caching: {
      enabled: true,
      ttl: 1800000, // 30 minutes
      maxSize: 5000
    }
  },

  production: {
    provider: 'pinecone',
    credentials: {
      apiKey: process.env.PINECONE_API_KEY || '',
      environment: process.env.PINECONE_ENVIRONMENT || 'us-west1-gcp'
    },
    indexConfig: {
      name: 'job-matching-prod',
      dimension: 1536,
      metric: 'cosine',
      pods: 2,
      replicas: 1,
      podType: 'p1.x1'
    },
    performance: {
      batchSize: 200,
      maxConcurrency: 10,
      timeout: 120000,
      retryAttempts: 10,
      retryDelay: 5000
    },
    caching: {
      enabled: true,
      ttl: 600000, // 10 minutes
      maxSize: 10000
    }
  },

  testing: {
    provider: 'local',
    credentials: {},
    indexConfig: {
      name: 'job-matching-test',
      dimension: 384, // Smaller dimension for testing
      metric: 'cosine'
    },
    performance: {
      batchSize: 10,
      maxConcurrency: 1,
      timeout: 5000,
      retryAttempts: 1,
      retryDelay: 500
    },
    caching: {
      enabled: false,
      ttl: 0,
      maxSize: 0
    }
  }
};

/**
 * Embedding service configurations
 */
export const EmbeddingConfigs: Record<string, EmbeddingServiceConfig> = {
  development: {
    embeddingModel: 'text-embedding-ada-002',
    batchSize: 50,
    maxTextLength: 4000,
    enableCaching: true,
    cacheTimeout: 3600000, // 1 hour
    similarityThreshold: 0.6,
    maxResults: 25,
    enableRealTimeUpdates: true
  },

  staging: {
    embeddingModel: 'text-embedding-ada-002',
    batchSize: 100,
    maxTextLength: 6000,
    enableCaching: true,
    cacheTimeout: 1800000, // 30 minutes
    similarityThreshold: 0.7,
    maxResults: 50,
    enableRealTimeUpdates: true
  },

  production: {
    embeddingModel: 'text-embedding-ada-002',
    batchSize: 200,
    maxTextLength: 8000,
    enableCaching: true,
    cacheTimeout: 600000, // 10 minutes
    similarityThreshold: 0.75,
    maxResults: 100,
    enableRealTimeUpdates: true
  },

  testing: {
    embeddingModel: 'text-embedding-ada-002',
    batchSize: 10,
    maxTextLength: 2000,
    enableCaching: false,
    cacheTimeout: 0,
    similarityThreshold: 0.5,
    maxResults: 10,
    enableRealTimeUpdates: false
  }
};

/**
 * Get vector database configuration for current environment
 */
export function getVectorDBConfig(): VectorDBConfig {
  const environment = process.env.NODE_ENV || 'development';
  return VectorDBConfigs[environment] || VectorDBConfigs.development;
}

/**
 * Get embedding service configuration for current environment
 */
export function getEmbeddingConfig(): EmbeddingServiceConfig {
  const environment = process.env.NODE_ENV || 'development';
  return EmbeddingConfigs[environment] || EmbeddingConfigs.development;
}

/**
 * Validate vector database configuration
 */
export function validateVectorDBConfig(config: VectorDBConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate provider
  if (!['pinecone', 'weaviate', 'chromadb', 'local'].includes(config.provider)) {
    errors.push('Invalid vector database provider');
  }

  // Validate credentials based on provider
  if (config.provider === 'pinecone') {
    if (!config.credentials.apiKey) {
      errors.push('Pinecone API key is required');
    }
    if (!config.credentials.environment) {
      errors.push('Pinecone environment is required');
    }
  } else if (config.provider === 'weaviate') {
    if (!config.credentials.host) {
      errors.push('Weaviate host is required');
    }
  }

  // Validate index configuration
  if (!config.indexConfig.name) {
    errors.push('Index name is required');
  }

  if (config.indexConfig.dimension <= 0) {
    errors.push('Index dimension must be positive');
  }

  if (!['cosine', 'euclidean', 'dotproduct'].includes(config.indexConfig.metric)) {
    errors.push('Invalid distance metric');
  }

  // Validate performance settings
  if (config.performance.batchSize <= 0) {
    errors.push('Batch size must be positive');
  }

  if (config.performance.maxConcurrency <= 0) {
    errors.push('Max concurrency must be positive');
  }

  if (config.performance.timeout <= 0) {
    errors.push('Timeout must be positive');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate embedding configuration
 */
export function validateEmbeddingConfig(config: EmbeddingServiceConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate model
  if (!config.embeddingModel) {
    errors.push('Embedding model is required');
  }

  // Validate batch size
  if (config.batchSize <= 0) {
    errors.push('Batch size must be positive');
  }

  // Validate text length
  if (config.maxTextLength <= 0) {
    errors.push('Max text length must be positive');
  }

  // Validate similarity threshold
  if (config.similarityThreshold < 0 || config.similarityThreshold > 1) {
    errors.push('Similarity threshold must be between 0 and 1');
  }

  // Validate max results
  if (config.maxResults <= 0) {
    errors.push('Max results must be positive');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Create vector store configuration from vector DB config
 */
export function createVectorStoreConfig(vectorDBConfig: VectorDBConfig): {
  provider: string;
  indexName: string;
  dimension: number;
  metric: string;
  cloudProvider?: string;
  region?: string;
  apiKey?: string;
  environment?: string;
} {
  return {
    provider: vectorDBConfig.provider,
    indexName: vectorDBConfig.indexConfig.name,
    dimension: vectorDBConfig.indexConfig.dimension,
    metric: vectorDBConfig.indexConfig.metric,
    cloudProvider: 'aws', // Default, can be made configurable
    region: 'us-west-2', // Default, can be made configurable
    apiKey: vectorDBConfig.credentials.apiKey,
    environment: vectorDBConfig.credentials.environment
  };
}

/**
 * Default embedding model configurations
 */
export const EmbeddingModels = {
  OPENAI_ADA_002: {
    name: 'text-embedding-ada-002',
    dimension: 1536,
    maxTokens: 8191,
    pricing: {
      input: 0.0001, // per 1K tokens
      output: 0 // No output tokens for embeddings
    }
  },

  OPENAI_ADA_002_LARGE: {
    name: 'text-embedding-3-large',
    dimension: 3072,
    maxTokens: 8191,
    pricing: {
      input: 0.00013,
      output: 0
    }
  },

  OPENAI_ADA_002_SMALL: {
    name: 'text-embedding-3-small',
    dimension: 1536,
    maxTokens: 8191,
    pricing: {
      input: 0.00002,
      output: 0
    }
  },

  LOCAL_SENTENCE_TRANSFORMER: {
    name: 'all-MiniLM-L6-v2',
    dimension: 384,
    maxTokens: 512,
    pricing: {
      input: 0, // Free for local models
      output: 0
    }
  }
};

/**
 * Get embedding model information
 */
export function getEmbeddingModelInfo(modelName: string): typeof EmbeddingModels[keyof typeof EmbeddingModels] | null {
  for (const model of Object.values(EmbeddingModels)) {
    if (model.name === modelName) {
      return model;
    }
  }
  return null;
}

/**
 * Calculate estimated cost for embedding generation
 */
export function calculateEmbeddingCost(
  modelName: string,
  tokenCount: number,
  embeddingCount: number
): number {
  const modelInfo = getEmbeddingModelInfo(modelName);
  if (!modelInfo) {
    return 0;
  }

  const costPerToken = modelInfo.pricing.input / 1000; // Convert from per 1K tokens to per token
  return (tokenCount * embeddingCount * costPerToken);
}

/**
 * Environment-specific optimization settings
 */
export const OptimizationSettings = {
  development: {
    enableApproximateSearch: false,
    cacheResults: true,
    batchSize: 50,
    maxConcurrency: 2,
    timeoutMs: 30000
  },

  staging: {
    enableApproximateSearch: true,
    cacheResults: true,
    batchSize: 100,
    maxConcurrency: 5,
    timeoutMs: 60000
  },

  production: {
    enableApproximateSearch: true,
    cacheResults: true,
    batchSize: 200,
    maxConcurrency: 10,
    timeoutMs: 120000
  }
};

/**
 * Get optimization settings for current environment
 */
export function getOptimizationSettings() {
  const environment = process.env.NODE_ENV || 'development';
  return OptimizationSettings[environment] || OptimizationSettings.development;
}

export default {
  VectorDBConfigs,
  EmbeddingConfigs,
  getVectorDBConfig,
  getEmbeddingConfig,
  validateVectorDBConfig,
  validateEmbeddingConfig,
  createVectorStoreConfig,
  EmbeddingModels,
  getEmbeddingModelInfo,
  calculateEmbeddingCost,
  OptimizationSettings,
  getOptimizationSettings
};