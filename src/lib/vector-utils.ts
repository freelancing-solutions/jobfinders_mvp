export interface Vector {
  data: number[];
  dimensions: number;
}

export interface SimilarityResult {
  score: number;
  vector: Vector;
  index?: number;
}

export interface DistanceMetrics {
  cosine: number;
  euclidean: number;
  manhattan: number;
  dotProduct: number;
}

export class VectorUtils {
  /**
   * Validate if an array is a valid vector
   */
  static isValidVector(vector: number[]): boolean {
    return Array.isArray(vector) &&
           vector.length > 0 &&
           vector.every(v => typeof v === 'number' && !isNaN(v));
  }

  /**
   * Create a vector object
   */
  static createVector(data: number[]): Vector {
    if (!this.isValidVector(data)) {
      throw new Error('Invalid vector data');
    }

    return {
      data: [...data], // Create a copy
      dimensions: data.length,
    };
  }

  /**
   * Calculate the magnitude (norm) of a vector
   */
  static magnitude(vector: number[]): number {
    return Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  }

  /**
   * Normalize a vector to unit length
   */
  static normalize(vector: number[]): number[] {
    const mag = this.magnitude(vector);
    if (mag === 0) {
      throw new Error('Cannot normalize zero vector');
    }
    return vector.map(val => val / mag);
  }

  /**
   * Calculate dot product of two vectors
   */
  static dotProduct(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error('Vectors must have the same dimensions');
    }

    return vec1.reduce((sum, val, index) => sum + val * vec2[index], 0);
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  static cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error('Vectors must have the same dimensions');
    }

    const dotProduct = this.dotProduct(vec1, vec2);
    const mag1 = this.magnitude(vec1);
    const mag2 = this.magnitude(vec2);

    if (mag1 === 0 || mag2 === 0) {
      return 0;
    }

    return dotProduct / (mag1 * mag2);
  }

  /**
   * Calculate Euclidean distance between two vectors
   */
  static euclideanDistance(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error('Vectors must have the same dimensions');
    }

    const sumSquares = vec1.reduce((sum, val, index) => {
      const diff = val - vec2[index];
      return sum + diff * diff;
    }, 0);

    return Math.sqrt(sumSquares);
  }

  /**
   * Calculate Manhattan distance between two vectors
   */
  static manhattanDistance(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error('Vectors must have the same dimensions');
    }

    return vec1.reduce((sum, val, index) => sum + Math.abs(val - vec2[index]), 0);
  }

  /**
   * Calculate all distance metrics between two vectors
   */
  static allDistanceMetrics(vec1: number[], vec2: number[]): DistanceMetrics {
    return {
      cosine: this.cosineSimilarity(vec1, vec2),
      euclidean: this.euclideanDistance(vec1, vec2),
      manhattan: this.manhattanDistance(vec1, vec2),
      dotProduct: this.dotProduct(vec1, vec2),
    };
  }

  /**
   * Find the most similar vectors to a target vector
   */
  static findMostSimilar(
    target: number[],
    candidates: number[][],
    options: {
      metric?: 'cosine' | 'euclidean' | 'manhattan';
      limit?: number;
      threshold?: number;
    } = {}
  ): SimilarityResult[] {
    const {
      metric = 'cosine',
      limit = candidates.length,
      threshold = metric === 'cosine' ? 0 : Infinity
    } = options;

    if (!this.isValidVector(target)) {
      throw new Error('Invalid target vector');
    }

    const results: SimilarityResult[] = candidates
      .map((vector, index) => {
        if (!this.isValidVector(vector)) {
          return null;
        }

        let score: number;
        switch (metric) {
          case 'cosine':
            score = this.cosineSimilarity(target, vector);
            break;
          case 'euclidean':
            score = 1 / (1 + this.euclideanDistance(target, vector));
            break;
          case 'manhattan':
            score = 1 / (1 + this.manhattanDistance(target, vector));
            break;
          default:
            throw new Error(`Unknown metric: ${metric}`);
        }

        return {
          score,
          vector: this.createVector(vector),
          index,
        };
      })
      .filter((result): result is SimilarityResult =>
        result !== null && result.score >= threshold
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return results;
  }

  /**
   * Perform k-nearest neighbors search
   */
  static kNN(
    target: number[],
    candidates: number[],
    k: number,
    metric: 'cosine' | 'euclidean' | 'manhattan' = 'cosine'
  ): SimilarityResult[] {
    return this.findMostSimilar(target, candidates, { metric, limit: k });
  }

  /**
   * Average multiple vectors
   */
  static average(vectors: number[][]): number[] {
    if (vectors.length === 0) {
      throw new Error('Cannot average empty vector list');
    }

    const dimensions = vectors[0].length;
    if (!vectors.every(vec => vec.length === dimensions)) {
      throw new Error('All vectors must have the same dimensions');
    }

    const result = new Array(dimensions).fill(0);

    for (const vector of vectors) {
      for (let i = 0; i < dimensions; i++) {
        result[i] += vector[i];
      }
    }

    return result.map(sum => sum / vectors.length);
  }

  /**
   * Weighted average of multiple vectors
   */
  static weightedAverage(vectors: number[][], weights: number[]): number[] {
    if (vectors.length === 0 || weights.length === 0) {
      throw new Error('Cannot average empty vector list');
    }

    if (vectors.length !== weights.length) {
      throw new Error('Number of vectors must match number of weights');
    }

    const dimensions = vectors[0].length;
    if (!vectors.every(vec => vec.length === dimensions)) {
      throw new Error('All vectors must have the same dimensions');
    }

    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    if (totalWeight === 0) {
      throw new Error('Total weight cannot be zero');
    }

    const result = new Array(dimensions).fill(0);

    for (let i = 0; i < vectors.length; i++) {
      const vector = vectors[i];
      const weight = weights[i];

      for (let j = 0; j < dimensions; j++) {
        result[j] += vector[j] * weight;
      }
    }

    return result.map(sum => sum / totalWeight);
  }

  /**
   * Perform vector addition
   */
  static add(vec1: number[], vec2: number[]): number[] {
    if (vec1.length !== vec2.length) {
      throw new Error('Vectors must have the same dimensions');
    }

    return vec1.map((val, index) => val + vec2[index]);
  }

  /**
   * Perform vector subtraction
   */
  static subtract(vec1: number[], vec2: number[]): number[] {
    if (vec1.length !== vec2.length) {
      throw new Error('Vectors must have the same dimensions');
    }

    return vec1.map((val, index) => val - vec2[index]);
  }

  /**
   * Scale a vector by a scalar
   */
  static scale(vector: number[], scalar: number): number[] {
    return vector.map(val => val * scalar);
  }

  /**
   * Interpolate between two vectors
   */
  static interpolate(vec1: number[], vec2: number[], t: number): number[] {
    if (vec1.length !== vec2.length) {
      throw new Error('Vectors must have the same dimensions');
    }

    if (t < 0 || t > 1) {
      throw new Error('Interpolation parameter t must be between 0 and 1');
    }

    return vec1.map((val, index) => val * (1 - t) + vec2[index] * t);
  }

  /**
   * Convert vector to string representation
   */
  static toString(vector: number[], precision: number = 2): string {
    return `[${vector.map(v => v.toFixed(precision)).join(', ')}]`;
  }

  /**
   * Parse vector from string representation
   */
  static fromString(str: string): number[] {
    const trimmed = str.trim();
    if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) {
      throw new Error('Invalid vector string format');
    }

    const inner = trimmed.slice(1, -1);
    if (inner === '') {
      return [];
    }

    const values = inner.split(',').map(v => {
      const num = parseFloat(v.trim());
      if (isNaN(num)) {
        throw new Error(`Invalid number in vector: ${v}`);
      }
      return num;
    });

    return values;
  }

  /**
   * Generate a random vector
   */
  static random(dimensions: number, min: number = 0, max: number = 1): number[] {
    return Array.from({ length: dimensions }, () =>
      Math.random() * (max - min) + min
    );
  }

  /**
   * Generate a random normalized vector
   */
  static randomNormalized(dimensions: number): number[] {
    const vector = this.random(dimensions, -1, 1);
    return this.normalize(vector);
  }

  /**
   * Check if two vectors are approximately equal within a tolerance
   */
  static approximatelyEqual(
    vec1: number[],
    vec2: number[],
    tolerance: number = 1e-6
  ): boolean {
    if (vec1.length !== vec2.length) {
      return false;
    }

    return vec1.every((val, index) => Math.abs(val - vec2[index]) <= tolerance);
  }

  /**
   * Calculate the angle between two vectors in radians
   */
  static angle(vec1: number[], vec2: number[]): number {
    const cosSimilarity = this.cosineSimilarity(vec1, vec2);
    // Clamp to [-1, 1] to handle floating point errors
    const clamped = Math.max(-1, Math.min(1, cosSimilarity));
    return Math.acos(clamped);
  }

  /**
   * Calculate the angle between two vectors in degrees
   */
  static angleDegrees(vec1: number[], vec2: number[]): number {
    return (this.angle(vec1, vec2) * 180) / Math.PI;
  }

  /**
   * Project one vector onto another
   */
  static project(vec: number[], onto: number[]): number[] {
    if (vec.length !== onto.length) {
      throw new Error('Vectors must have the same dimensions');
    }

    const ontoNormalized = this.normalize(onto);
    const projectionLength = this.dotProduct(vec, ontoNormalized);
    return this.scale(ontoNormalized, projectionLength);
  }

  /**
   * Calculate the component of vec that's orthogonal to onto
   */
  static orthogonalComponent(vec: number[], onto: number[]): number[] {
    const projection = this.project(vec, onto);
    return this.subtract(vec, projection);
  }
}

// Export commonly used functions for convenience
export const {
  isValidVector,
  createVector,
  magnitude,
  normalize,
  dotProduct,
  cosineSimilarity,
  euclideanDistance,
  manhattanDistance,
  findMostSimilar,
  kNN,
  average,
  weightedAverage,
  add,
  subtract,
  scale,
  interpolate,
  random,
  randomNormalized,
  approximatelyEqual,
  angle,
  angleDegrees,
  project,
  orthogonalComponent,
} = VectorUtils;

// Default export
export default VectorUtils;