import {
  CandidateProfile,
  JobProfile,
  EmbeddingVector,
  ProfileEmbedding,
  EmbeddingGenerationConfig
} from '@/types/matching';
import { logger } from '@/lib/logging/logger';

/**
 * Profile embedding configuration
 */
export interface ProfileEmbedderConfig {
  embeddingModel: string;
  maxTextLength: number;
  chunkSize: number;
  overlapSize: number;
  includeSkills: boolean;
  includeExperience: boolean;
  includeEducation: boolean;
  includePreferences: boolean;
  useHierarchicalEmbedding: boolean;
  cacheResults: boolean;
}

/**
 * Text chunk for processing
 */
interface TextChunk {
  text: string;
  type: 'title' | 'summary' | 'skills' | 'experience' | 'education' | 'preferences';
  weight: number;
}

/**
 * Advanced profile embedder for generating semantic embeddings
 */
export class ProfileEmbedder {
  private config: ProfileEmbedderConfig;
  private embeddingCache: Map<string, EmbeddingVector> = new Map();

  constructor(config?: Partial<ProfileEmbedderConfig>) {
    this.config = {
      embeddingModel: 'text-embedding-ada-002',
      maxTextLength: 8000,
      chunkSize: 1000,
      overlapSize: 200,
      includeSkills: true,
      includeExperience: true,
      includeEducation: true,
      includePreferences: true,
      useHierarchicalEmbedding: false,
      cacheResults: true,
      ...config
    };
  }

  /**
   * Initialize the embedder
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing profile embedder', {
        model: this.config.embeddingModel,
        maxTextLength: this.config.maxTextLength
      });

      // Initialize embedding service (OpenAI, local model, etc.)
      await this.initializeEmbeddingService();

      logger.info('Profile embedder initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize profile embedder', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Generate embedding for a candidate profile
   */
  async generateCandidateEmbedding(candidate: CandidateProfile): Promise<EmbeddingVector> {
    try {
      const cacheKey = `candidate_${candidate.id}_${candidate.lastUpdated?.getTime() || Date.now()}`;

      if (this.config.cacheResults && this.embeddingCache.has(cacheKey)) {
        return this.embeddingCache.get(cacheKey)!;
      }

      const textChunks = this.extractCandidateChunks(candidate);
      const embedding = await this.generateEmbeddingFromChunks(textChunks);

      // Cache the result
      if (this.config.cacheResults) {
        this.embeddingCache.set(cacheKey, embedding);
      }

      logger.debug('Candidate embedding generated', {
        candidateId: candidate.id,
        chunksCount: textChunks.length,
        dimension: embedding.vector.length
      });

      return embedding;
    } catch (error) {
      logger.error('Candidate embedding generation failed', {
        candidateId: candidate.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Generate embedding for a job profile
   */
  async generateJobEmbedding(job: JobProfile): Promise<EmbeddingVector> {
    try {
      const cacheKey = `job_${job.id}_${job.lastUpdated?.getTime() || Date.now()}`;

      if (this.config.cacheResults && this.embeddingCache.has(cacheKey)) {
        return this.embeddingCache.get(cacheKey)!;
      }

      const textChunks = this.extractJobChunks(job);
      const embedding = await this.generateEmbeddingFromChunks(textChunks);

      // Cache the result
      if (this.config.cacheResults) {
        this.embeddingCache.set(cacheKey, embedding);
      }

      logger.debug('Job embedding generated', {
        jobId: job.id,
        chunksCount: textChunks.length,
        dimension: embedding.vector.length
      });

      return embedding;
    } catch (error) {
      logger.error('Job embedding generation failed', {
        jobId: job.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Generate profile embedding (generic method)
   */
  async generateProfileEmbedding(
    profile: CandidateProfile | JobProfile,
    profileType: 'candidate' | 'job'
  ): Promise<EmbeddingVector> {
    if (profileType === 'candidate') {
      return this.generateCandidateEmbedding(profile as CandidateProfile);
    } else {
      return this.generateJobEmbedding(profile as JobProfile);
    }
  }

  /**
   * Generate hierarchical embedding with section-level embeddings
   */
  async generateHierarchicalEmbedding(
    profile: CandidateProfile | JobProfile,
    profileType: 'candidate' | 'job'
  ): Promise<{
    overall: EmbeddingVector;
    sections: Record<string, EmbeddingVector>;
  }> {
    try {
      const textChunks = profileType === 'candidate'
        ? this.extractCandidateChunks(profile as CandidateProfile)
        : this.extractJobChunks(profile as JobProfile);

      // Group chunks by type
      const chunksByType = textChunks.reduce((groups, chunk) => {
        if (!groups[chunk.type]) {
          groups[chunk.type] = [];
        }
        groups[chunk.type].push(chunk);
        return groups;
      }, {} as Record<string, TextChunk[]>);

      // Generate embeddings for each section
      const sectionEmbeddings: Record<string, EmbeddingVector> = {};

      for (const [type, chunks] of Object.entries(chunksByType)) {
        const sectionEmbedding = await this.generateEmbeddingFromChunks(chunks);
        sectionEmbeddings[type] = sectionEmbedding;
      }

      // Generate overall embedding (weighted average of sections)
      const overallEmbedding = await this.combineSectionEmbeddings(sectionEmbeddings, textChunks);

      logger.debug('Hierarchical embedding generated', {
        profileType,
        profileId: profile.id,
        sections: Object.keys(sectionEmbeddings),
        overallDimension: overallEmbedding.vector.length
      });

      return {
        overall: overallEmbedding,
        sections: sectionEmbeddings
      };
    } catch (error) {
      logger.error('Hierarchical embedding generation failed', {
        profileType,
        profileId: profile.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Update embedding for an existing profile
   */
  async updateEmbedding(
    profile: CandidateProfile | JobProfile,
    profileType: 'candidate' | 'job'
  ): Promise<EmbeddingVector> {
    try {
      // Clear cache for this profile
      const cachePattern = profileType === 'candidate' ? 'candidate_' : 'job_';
      for (const [key] of this.embeddingCache.entries()) {
        if (key.startsWith(`${cachePattern}${profile.id}_`)) {
          this.embeddingCache.delete(key);
        }
      }

      // Generate new embedding
      return this.generateProfileEmbedding(profile, profileType);
    } catch (error) {
      logger.error('Embedding update failed', {
        profileType,
        profileId: profile.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Clear embedding cache
   */
  clearCache(): void {
    this.embeddingCache.clear();
    logger.info('Embedding cache cleared');
  }

  // Private methods
  private async initializeEmbeddingService(): Promise<void> {
    // Initialize embedding service (OpenAI, local model, etc.)
    // This would set up the actual embedding generation capability
    logger.debug('Embedding service initialized');
  }

  private extractCandidateChunks(candidate: CandidateProfile): TextChunk[] {
    const chunks: TextChunk[] = [];

    // Title chunk (high weight)
    if (candidate.title) {
      chunks.push({
        text: candidate.title,
        type: 'title',
        weight: 1.0
      });
    }

    // Summary chunk (high weight)
    if (candidate.summary) {
      chunks.push({
        text: candidate.summary,
        type: 'summary',
        weight: 0.9
      });
    }

    // Skills chunks (very high weight)
    if (this.config.includeSkills && candidate.skills) {
      const skillsText = this.formatSkills(candidate.skills);
      if (skillsText) {
        chunks.push({
          text: skillsText,
          type: 'skills',
          weight: 1.0
        });
      }
    }

    // Experience chunks (medium weight)
    if (this.config.includeExperience && candidate.experience) {
      const experienceText = this.formatExperience(candidate.experience);
      if (experienceText) {
        chunks.push({
          text: experienceText,
          type: 'experience',
          weight: 0.7
        });
      }
    }

    // Education chunks (medium weight)
    if (this.config.includeEducation && candidate.education) {
      const educationText = this.formatEducation(candidate.education);
      if (educationText) {
        chunks.push({
          text: educationText,
          type: 'education',
          weight: 0.6
        });
      }
    }

    // Preferences chunks (low weight)
    if (this.config.includePreferences && candidate.preferences) {
      const preferencesText = this.formatPreferences(candidate.preferences);
      if (preferencesText) {
        chunks.push({
          text: preferencesText,
          type: 'preferences',
          weight: 0.4
        });
      }
    }

    return chunks;
  }

  private extractJobChunks(job: JobProfile): TextChunk[] {
    const chunks: TextChunk[] = [];

    // Title chunk (high weight)
    if (job.title) {
      chunks.push({
        text: job.title,
        type: 'title',
        weight: 1.0
      });
    }

    // Description chunk (high weight)
    if (job.description) {
      chunks.push({
        text: job.description,
        type: 'summary',
        weight: 0.9
      });
    }

    // Skills chunks (very high weight)
    if (this.config.includeSkills && job.requiredSkills) {
      const skillsText = this.formatSkills(job.requiredSkills);
      if (skillsText) {
        chunks.push({
          text: skillsText,
          type: 'skills',
          weight: 1.0
        });
      }
    }

    // Responsibilities chunk (medium weight)
    if (job.responsibilities && job.responsibilities.length > 0) {
      const responsibilitiesText = job.responsibilities.join(' ');
      chunks.push({
        text: responsibilitiesText,
        type: 'experience',
        weight: 0.7
      });
    }

    // Requirements chunk (medium weight)
    if (job.requirements && job.requirements.length > 0) {
      const requirementsText = job.requirements.join(' ');
      chunks.push({
        text: requirementsText,
        type: 'experience',
        weight: 0.8
      });
    }

    // Benefits chunk (low weight)
    if (job.benefits) {
      const benefitsText = this.formatBenefits(job.benefits);
      if (benefitsText) {
        chunks.push({
          text: benefitsText,
          type: 'preferences',
          weight: 0.4
        });
      }
    }

    return chunks;
  }

  private async generateEmbeddingFromChunks(chunks: TextChunk[]): Promise<EmbeddingVector> {
    try {
      if (chunks.length === 0) {
        throw new Error('No text chunks provided for embedding generation');
      }

      if (this.config.useHierarchicalEmbedding) {
        return this.generateHierarchicalEmbeddingFromChunks(chunks);
      } else {
        return this.generateFlatEmbeddingFromChunks(chunks);
      }
    } catch (error) {
      logger.error('Embedding generation from chunks failed', {
        chunksCount: chunks.length,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private async generateFlatEmbeddingFromChunks(chunks: TextChunk[]): Promise<EmbeddingVector> {
    // Combine all chunks into a single text
    const combinedText = chunks
      .map(chunk => chunk.text)
      .join(' ')
      .substring(0, this.config.maxTextLength);

    // Generate embedding for combined text
    const embedding = await this.generateTextEmbedding(combinedText);

    return embedding;
  }

  private async generateHierarchicalEmbeddingFromChunks(chunks: TextChunk[]): Promise<EmbeddingVector> {
    // Generate embeddings for each chunk
    const chunkEmbeddings: Array<{ embedding: EmbeddingVector; weight: number }> = [];

    for (const chunk of chunks) {
      const embedding = await this.generateTextEmbedding(chunk.text);
      chunkEmbeddings.push({ embedding, weight: chunk.weight });
    }

    // Combine embeddings using weighted average
    return this.combineEmbeddings(chunkEmbeddings);
  }

  private async combineSectionEmbeddings(
    sectionEmbeddings: Record<string, EmbeddingVector>,
    originalChunks: TextChunk[]
  ): Promise<EmbeddingVector> {
    // Calculate weights for each section based on original chunks
    const sectionWeights: Record<string, number> = {};

    for (const chunk of originalChunks) {
      if (!sectionWeights[chunk.type]) {
        sectionWeights[chunk.type] = 0;
      }
      sectionWeights[chunk.type] += chunk.weight;
    }

    // Normalize weights
    const totalWeight = Object.values(sectionWeights).reduce((sum, weight) => sum + weight, 0);
    for (const sectionType in sectionWeights) {
      sectionWeights[sectionType] /= totalWeight;
    }

    // Combine section embeddings
    const weightedEmbeddings: Array<{ embedding: EmbeddingVector; weight: number }> = [];

    for (const [sectionType, embedding] of Object.entries(sectionEmbeddings)) {
      weightedEmbeddings.push({
        embedding,
        weight: sectionWeights[sectionType] || 0
      });
    }

    return this.combineEmbeddings(weightedEmbeddings);
  }

  private combineEmbeddings(
    weightedEmbeddings: Array<{ embedding: EmbeddingVector; weight: number }>
  ): EmbeddingVector {
    if (weightedEmbeddings.length === 0) {
      throw new Error('No embeddings to combine');
    }

    const dimension = weightedEmbeddings[0].embedding.vector.length;
    const combinedVector = new Array(dimension).fill(0);
    let totalWeight = 0;

    for (const { embedding, weight } of weightedEmbeddings) {
      for (let i = 0; i < dimension; i++) {
        combinedVector[i] += embedding.vector[i] * weight;
      }
      totalWeight += weight;
    }

    // Normalize by total weight
    if (totalWeight > 0) {
      for (let i = 0; i < dimension; i++) {
        combinedVector[i] /= totalWeight;
      }
    }

    // Normalize the final vector
    const norm = Math.sqrt(combinedVector.reduce((sum, val) => sum + val * val, 0));
    if (norm > 0) {
      for (let i = 0; i < dimension; i++) {
        combinedVector[i] /= norm;
      }
    }

    return {
      vector: combinedVector,
      dimension,
      model: this.config.embeddingModel
    };
  }

  private async generateTextEmbedding(text: string): Promise<EmbeddingVector> {
    try {
      // This would call the actual embedding service (OpenAI, local model, etc.)
      // For now, return a mock embedding
      const mockEmbedding = this.generateMockEmbedding(text);

      return mockEmbedding;
    } catch (error) {
      logger.error('Text embedding generation failed', {
        textLength: text.length,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private generateMockEmbedding(text: string): EmbeddingVector {
    // Generate deterministic mock embedding based on text
    const dimension = 1536; // Standard for text-embedding-ada-002
    const embedding = new Array(dimension).fill(0);

    // Simple hash-based embedding generation
    const hash = this.simpleHash(text);
    const seed = hash % 1000000;

    for (let i = 0; i < dimension; i++) {
      embedding[i] = Math.sin(seed + i * 1234.567) * 0.5 + 0.5;
    }

    // Normalize the embedding
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (norm > 0) {
      for (let i = 0; i < dimension; i++) {
        embedding[i] /= norm;
      }
    }

    return {
      vector: embedding,
      dimension,
      model: this.config.embeddingModel,
      textLength: text.length
    };
  }

  private simpleHash(text: string): number {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Text formatting methods
  private formatSkills(skills: any): string {
    try {
      if (Array.isArray(skills)) {
        return skills.join(' ');
      } else if (typeof skills === 'object') {
        return Object.keys(skills).join(' ');
      } else if (typeof skills === 'string') {
        return skills;
      }
      return '';
    } catch (error) {
      return '';
    }
  }

  private formatExperience(experience: any[]): string {
    try {
      return experience
        .map(exp => {
          const parts = [];
          if (exp.title) parts.push(exp.title);
          if (exp.company) parts.push(exp.company);
          if (exp.description) parts.push(exp.description);
          return parts.join(' ');
        })
        .join(' ');
    } catch (error) {
      return '';
    }
  }

  private formatEducation(education: any[]): string {
    try {
      return education
        .map(edu => {
          const parts = [];
          if (edu.degree) parts.push(edu.degree);
          if (edu.field) parts.push(edu.field);
          if (edu.institution) parts.push(edu.institution);
          return parts.join(' ');
        })
        .join(' ');
    } catch (error) {
      return '';
    }
  }

  private formatPreferences(preferences: any): string {
    try {
      const parts = [];
      if (preferences.employmentTypes) {
        parts.push(preferences.employmentTypes.join(' '));
      }
      if (preferences.workStyle) {
        parts.push(preferences.workStyle);
      }
      if (preferences.companySize) {
        parts.push(preferences.companySize);
      }
      if (preferences.remoteWork) {
        parts.push('remote work');
      }
      return parts.join(' ');
    } catch (error) {
      return '';
    }
  }

  private formatBenefits(benefits: any): string {
    try {
      if (Array.isArray(benefits)) {
        return benefits.join(' ');
      } else if (typeof benefits === 'object') {
        return Object.keys(benefits).join(' ');
      } else if (typeof benefits === 'string') {
        return benefits;
      }
      return '';
    } catch (error) {
      return '';
    }
  }

  /**
   * Get embedder statistics
   */
  getStatistics(): {
    cacheSize: number;
    config: ProfileEmbedderConfig;
    model: string;
  } {
    return {
      cacheSize: this.embeddingCache.size,
      config: this.config,
      model: this.config.embeddingModel
    };
  }
}

export default ProfileEmbedder;