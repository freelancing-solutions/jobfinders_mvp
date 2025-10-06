import {
  CandidateProfile,
  JobProfile,
  MatchResult,
  MLModel,
  FeatureVector,
  TrainingData,
  ModelMetrics,
  PredictionResult,
  ModelConfig,
  ABTestConfig
} from '@/types/matching';
import { FeatureExtractor } from '@/lib/ml/feature-extractor';
import { ModelTrainer } from '@/lib/ml/model-trainer';
import { ModelServer } from '@/lib/ml/model-server';
import { ABTestingFramework } from '@/lib/ml/ab-testing';
import { logger } from '@/lib/logging/logger';
import { prisma } from '@/lib/prisma';
import { EventEmitter } from 'events';

/**
 * ML Pipeline Configuration
 */
export interface MLPipelineConfig {
  featureExtraction: {
    useTextEmbeddings: boolean;
    useCategoricalEncoding: boolean;
    useNumericalNormalization: boolean;
    embeddingModel: string;
    embeddingDimension: number;
  };
  modelTraining: {
    validationSplit: number;
    testSplit: number;
    crossValidationFolds: number;
    hyperparameterTuning: boolean;
    maxIterations: number;
    earlyStoppingPatience: number;
  };
  modelServing: {
    modelCacheSize: number;
    predictionTimeout: number;
    batchSize: number;
    enableGPU: boolean;
  };
  abTesting: {
    enabled: boolean;
    trafficSplit: number;
    minSampleSize: number;
    confidenceLevel: number;
  };
}

/**
 * ML Pipeline orchestrates the entire machine learning workflow
 */
export class MLPipeline extends EventEmitter {
  private config: MLPipelineConfig;
  private featureExtractor: FeatureExtractor;
  private modelTrainer: ModelTrainer;
  private modelServer: ModelServer;
  private abTesting: ABTestingFramework;
  private activeModels: Map<string, MLModel> = new Map();
  private modelMetrics: Map<string, ModelMetrics> = new Map();
  private isInitialized: boolean = false;

  constructor(config?: Partial<MLPipelineConfig>) {
    super();

    this.config = {
      featureExtraction: {
        useTextEmbeddings: true,
        useCategoricalEncoding: true,
        useNumericalNormalization: true,
        embeddingModel: 'text-embedding-ada-002',
        embeddingDimension: 1536,
        ...config?.featureExtraction
      },
      modelTraining: {
        validationSplit: 0.2,
        testSplit: 0.2,
        crossValidationFolds: 5,
        hyperparameterTuning: true,
        maxIterations: 1000,
        earlyStoppingPatience: 50,
        ...config?.modelTraining
      },
      modelServing: {
        modelCacheSize: 10,
        predictionTimeout: 5000,
        batchSize: 32,
        enableGPU: false,
        ...config?.modelServing
      },
      abTesting: {
        enabled: true,
        trafficSplit: 0.1,
        minSampleSize: 1000,
        confidenceLevel: 0.95,
        ...config?.abTesting
      }
    };

    this.featureExtractor = new FeatureExtractor(this.config.featureExtraction);
    this.modelTrainer = new ModelTrainer(this.config.modelTraining);
    this.modelServer = new ModelServer(this.config.modelServing);
    this.abTesting = new ABTestingFramework(this.config.abTesting);
  }

  /**
   * Initialize the ML pipeline
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing ML pipeline');

      // Initialize components
      await this.featureExtractor.initialize();
      await this.modelTrainer.initialize();
      await this.modelServer.initialize();
      await this.abTesting.initialize();

      // Load active models from database
      await this.loadActiveModels();

      // Set up model monitoring
      this.setupModelMonitoring();

      this.isInitialized = true;

      logger.info('ML pipeline initialized successfully');
      this.emit('initialized');
    } catch (error) {
      logger.error('Failed to initialize ML pipeline', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Extract features from profiles
   */
  async extractFeatures(
    candidate: CandidateProfile,
    job: JobProfile
  ): Promise<FeatureVector> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const features = await this.featureExtractor.extractPairFeatures(
        candidate,
        job
      );

      return features;
    } catch (error) {
      logger.error('Feature extraction failed', {
        candidateId: candidate.id,
        jobId: job.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Train a new model
   */
  async trainModel(
    trainingData: TrainingData,
    modelConfig: ModelConfig,
    modelName?: string
  ): Promise<MLModel> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const startTime = Date.now();

      logger.info('Starting model training', {
        modelName: modelName || modelConfig.type,
        trainingSamples: trainingData.samples.length,
        config: modelConfig
      });

      // Preprocess training data
      const preprocessedData = await this.preprocessTrainingData(trainingData);

      // Train the model
      const trainedModel = await this.modelTrainer.train(
        preprocessedData,
        modelConfig
      );

      // Evaluate the model
      const metrics = await this.evaluateModel(trainedModel, preprocessedData.testSet);

      // Create model record
      const model: MLModel = {
        id: `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: modelName || `${modelConfig.type}_${Date.now()}`,
        version: '1.0.0',
        type: modelConfig.type,
        algorithm: modelConfig.algorithm,
        accuracy: metrics.accuracy,
        parameters: modelConfig.parameters,
        createdAt: new Date(),
        updatedAt: new Date(),
        active: false,
        metadata: {
          trainingTime: Date.now() - startTime,
          trainingSamples: trainingData.samples.length,
          features: preprocessedData.features,
          metrics
        }
      };

      // Save model to database
      await this.saveModel(model);

      // Cache model in memory
      this.activeModels.set(model.id, model);
      this.modelMetrics.set(model.id, metrics);

      logger.info('Model training completed', {
        modelId: model.id,
        modelName: model.name,
        accuracy: metrics.accuracy,
        trainingTime: Date.now() - startTime
      });

      this.emit('modelTrained', { model, metrics });
      return model;
    } catch (error) {
      logger.error('Model training failed', {
        modelName,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Make prediction using active model
   */
  async predict(
    candidate: CandidateProfile,
    job: JobProfile,
    modelId?: string
  ): Promise<PredictionResult> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Determine which model to use
      const targetModelId = modelId || await this.selectBestModel();

      // Check if A/B testing should be used
      if (this.config.abTesting.enabled && !modelId) {
        return await this.abTesting.predict(candidate, job, targetModelId);
      }

      // Get model
      const model = await this.getModel(targetModelId);
      if (!model) {
        throw new Error(`Model not found: ${targetModelId}`);
      }

      // Extract features
      const features = await this.extractFeatures(candidate, job);

      // Make prediction
      const prediction = await this.modelServer.predict(model, features);

      // Create prediction result
      const result: PredictionResult = {
        modelId: model.id,
        modelName: model.name,
        prediction: prediction.score,
        confidence: prediction.confidence,
        features: features,
        timestamp: new Date(),
        metadata: {
          processingTime: prediction.processingTime,
          modelVersion: model.version,
          abTestGroup: 'control'
        }
      };

      // Log prediction for monitoring
      this.logPrediction(result, candidate, job);

      return result;
    } catch (error) {
      logger.error('Prediction failed', {
        candidateId: candidate.id,
        jobId: job.id,
        modelId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Evaluate model performance
   */
  async evaluateModel(
    model: MLModel,
    testData: any[]
  ): Promise<ModelMetrics> {
    try {
      const predictions = [];
      const actuals = [];

      for (const sample of testData) {
        const features = await this.featureExtractor.extractFeatures(sample);
        const prediction = await this.modelServer.predict(model, features);

        predictions.push(prediction.score);
        actuals.push(sample.label);
      }

      // Calculate metrics
      const metrics = this.calculateMetrics(predictions, actuals);

      return metrics;
    } catch (error) {
      logger.error('Model evaluation failed', {
        modelId: model.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Deploy model to production
   */
  async deployModel(modelId: string): Promise<void> {
    try {
      const model = await this.getModel(modelId);
      if (!model) {
        throw new Error(`Model not found: ${modelId}`);
      }

      // Deactivate other models of the same type
      await this.deactivateModelsByType(model.type);

      // Activate the new model
      await prisma.mLModel.update({
        where: { id: modelId },
        data: {
          active: true,
          deployedAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Update cached model
      model.active = true;
      model.deployedAt = new Date();
      this.activeModels.set(modelId, model);

      logger.info('Model deployed successfully', {
        modelId,
        modelName: model.name,
        type: model.type
      });

      this.emit('modelDeployed', { model });
    } catch (error) {
      logger.error('Model deployment failed', {
        modelId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get model performance metrics
   */
  async getModelMetrics(modelId: string): Promise<ModelMetrics | null> {
    return this.modelMetrics.get(modelId) || null;
  }

  /**
   * Get all active models
   */
  async getActiveModels(): Promise<MLModel[]> {
    return Array.from(this.activeModels.values()).filter(model => model.active);
  }

  /**
   * Monitor model performance and trigger retraining
   */
  async monitorModels(): Promise<void> {
    try {
      const activeModels = await this.getActiveModels();

      for (const model of activeModels) {
        const metrics = await this.getModelMetrics(model.id);
        if (!metrics) continue;

        // Check if performance has degraded
        if (metrics.accuracy < 0.8) {
          logger.warn('Model performance degraded', {
            modelId: model.id,
            accuracy: metrics.accuracy
          });

          this.emit('modelDegraded', { model, metrics });

          // Trigger retraining if configured
          if (this.shouldRetrainModel(model, metrics)) {
            await this.triggerRetraining(model);
          }
        }
      }
    } catch (error) {
      logger.error('Model monitoring failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Preprocess training data
   */
  private async preprocessTrainingData(trainingData: TrainingData): Promise<any> {
    // Extract features for all samples
    const features = [];
    const labels = [];

    for (const sample of trainingData.samples) {
      const featureVector = await this.featureExtractor.extractFeatures(sample);
      features.push(featureVector);
      labels.push(sample.label);
    }

    // Split data
    const trainSize = Math.floor(features.length * (1 - this.config.modelTraining.validationSplit - this.config.modelTraining.testSplit));
    const validationSize = Math.floor(features.length * this.config.modelTraining.validationSplit);

    return {
      features: features[0]?.vector.length || 0,
      trainSet: {
        features: features.slice(0, trainSize),
        labels: labels.slice(0, trainSize)
      },
      validationSet: {
        features: features.slice(trainSize, trainSize + validationSize),
        labels: labels.slice(trainSize, trainSize + validationSize)
      },
      testSet: features.slice(trainSize + validationSize).map((feature, index) => ({
        feature,
        label: labels[trainSize + validationSize + index]
      }))
    };
  }

  /**
   * Load active models from database
   */
  private async loadActiveModels(): Promise<void> {
    try {
      const models = await prisma.mLModel.findMany({
        where: { active: true },
        orderBy: { deployedAt: 'desc' }
      });

      for (const model of models) {
        this.activeModels.set(model.id, model as MLModel);
      }

      logger.info(`Loaded ${models.length} active models`);
    } catch (error) {
      logger.error('Failed to load active models', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Save model to database
   */
  private async saveModel(model: MLModel): Promise<void> {
    await prisma.mLModel.create({
      data: {
        id: model.id,
        name: model.name,
        version: model.version,
        type: model.type,
        algorithm: model.algorithm,
        accuracy: model.accuracy,
        parameters: model.parameters,
        active: false,
        metadata: model.metadata,
        createdAt: model.createdAt,
        updatedAt: model.updatedAt
      }
    });
  }

  /**
   * Get model by ID
   */
  private async getModel(modelId: string): Promise<MLModel | null> {
    // Check cache first
    const cachedModel = this.activeModels.get(modelId);
    if (cachedModel) {
      return cachedModel;
    }

    // Load from database
    const model = await prisma.mLModel.findUnique({
      where: { id: modelId }
    });

    if (model) {
      const mlModel = model as MLModel;
      this.activeModels.set(modelId, mlModel);
      return mlModel;
    }

    return null;
  }

  /**
   * Select best model for prediction
   */
  private async selectBestModel(): Promise<string> {
    const activeModels = await this.getActiveModels();

    if (activeModels.length === 0) {
      throw new Error('No active models available');
    }

    // Return the most recently deployed model with highest accuracy
    return activeModels
      .sort((a, b) => {
        if (a.accuracy !== b.accuracy) {
          return b.accuracy - a.accuracy;
        }
        return (b.deployedAt?.getTime() || 0) - (a.deployedAt?.getTime() || 0);
      })[0].id;
  }

  /**
   * Deactivate models by type
   */
  private async deactivateModelsByType(type: string): Promise<void> {
    await prisma.mLModel.updateMany({
      where: {
        type,
        active: true
      },
      data: {
        active: false,
        updatedAt: new Date()
      }
    });

    // Update cache
    for (const [modelId, model] of this.activeModels.entries()) {
      if (model.type === type) {
        model.active = false;
        this.activeModels.set(modelId, model);
      }
    }
  }

  /**
   * Calculate model metrics
   */
  private calculateMetrics(predictions: number[], actuals: number[]): ModelMetrics {
    // Calculate accuracy
    const correctPredictions = predictions.filter((pred, idx) =>
      Math.round(pred) === actuals[idx]
    ).length;
    const accuracy = correctPredictions / predictions.length;

    // Calculate precision, recall, F1 (for binary classification)
    const tp = predictions.filter((pred, idx) => pred >= 0.5 && actuals[idx] === 1).length;
    const fp = predictions.filter((pred, idx) => pred >= 0.5 && actuals[idx] === 0).length;
    const fn = predictions.filter((pred, idx) => pred < 0.5 && actuals[idx] === 1).length;

    const precision = tp / (tp + fp) || 0;
    const recall = tp / (tp + fn) || 0;
    const f1Score = 2 * (precision * recall) / (precision + recall) || 0;

    // Calculate AUC-ROC (simplified)
    const aucRoc = this.calculateAUC(predictions, actuals);

    return {
      accuracy,
      precision,
      recall,
      f1Score,
      aucRoc,
      confusionMatrix: {
        tp,
        fp,
        fn,
        tn: predictions.filter((pred, idx) => pred < 0.5 && actuals[idx] === 0).length
      },
      timestamp: new Date()
    };
  }

  /**
   * Calculate AUC-ROC
   */
  private calculateAUC(predictions: number[], actuals: number[]): number {
    // Simplified AUC calculation
    const sortedIndices = predictions
      .map((_, index) => index)
      .sort((a, b) => predictions[a] - predictions[b]);

    let auc = 0;
    let rankSum = 0;

    for (let i = 0; i < sortedIndices.length; i++) {
      if (actuals[sortedIndices[i]] === 1) {
        rankSum += i + 1;
      }
    }

    const positiveCount = actuals.filter(a => a === 1).length;
    const negativeCount = actuals.filter(a => a === 0).length;

    if (positiveCount > 0 && negativeCount > 0) {
      auc = (rankSum - positiveCount * (positiveCount + 1) / 2) / (positiveCount * negativeCount);
    }

    return auc;
  }

  /**
   * Setup model monitoring
   */
  private setupModelMonitoring(): void {
    // Monitor models every hour
    setInterval(() => {
      this.monitorModels();
    }, 60 * 60 * 1000);

    logger.info('Model monitoring setup completed');
  }

  /**
   * Log prediction for monitoring
   */
  private logPrediction(
    prediction: PredictionResult,
    candidate: CandidateProfile,
    job: JobProfile
  ): void {
    // Store prediction for analysis
    prisma.predictionLog.create({
      data: {
        modelId: prediction.modelId,
        candidateId: candidate.id,
        jobId: job.id,
        prediction: prediction.prediction,
        confidence: prediction.confidence,
        timestamp: prediction.timestamp,
        metadata: prediction.metadata
      }
    }).catch(error => {
      logger.error('Failed to log prediction', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    });
  }

  /**
   * Check if model should be retrained
   */
  private shouldRetrainModel(model: MLModel, metrics: ModelMetrics): boolean {
    // Retrain if accuracy drops below threshold
    if (metrics.accuracy < 0.8) return true;

    // Retrain if model is older than 30 days and performance is declining
    const daysSinceCreation = (Date.now() - model.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation > 30 && metrics.accuracy < 0.85) return true;

    return false;
  }

  /**
   * Trigger model retraining
   */
  private async triggerRetraining(model: MLModel): Promise<void> {
    logger.info('Triggering model retraining', {
      modelId: model.id,
      modelName: model.name
    });

    // Collect recent training data
    const trainingData = await this.collectTrainingData(model.type);

    // Retrain model
    await this.trainModel(trainingData, {
      type: model.type,
      algorithm: model.algorithm,
      parameters: model.parameters
    }, `${model.name}_retrained`);

    this.emit('modelRetrainingTriggered', { model });
  }

  /**
   * Collect training data for model type
   */
  private async collectTrainingData(modelType: string): Promise<TrainingData> {
    // This would collect recent match results and feedback for training
    // Implementation depends on specific model type
    return {
      samples: [],
      features: [],
      createdAt: new Date()
    };
  }

  /**
   * Get pipeline status
   */
  getStatus(): {
    initialized: boolean;
    activeModels: number;
    config: MLPipelineConfig;
    health: 'healthy' | 'degraded' | 'unhealthy';
  } {
    const activeModelCount = Array.from(this.activeModels.values()).filter(m => m.active).length;

    let health: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (!this.isInitialized) health = 'unhealthy';
    else if (activeModelCount === 0) health = 'degraded';

    return {
      initialized: this.isInitialized,
      activeModels: activeModelCount,
      config: this.config,
      health
    };
  }
}

export default MLPipeline;