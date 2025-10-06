/**
 * Scoring Weights Configuration
 * Configurable weights for different matching criteria
 */

export interface ScoringWeights {
  skills: number;
  experience: number;
  education: number;
  location: number;
  salary: number;
  preferences: number;
  culturalFit: number;
}

export interface IndustryWeights {
  [industry: string]: Partial<ScoringWeights>;
}

export interface ExperienceLevelWeights {
  [level: string]: Partial<ScoringWeights>;
}

export interface WeightConfig {
  default: ScoringWeights;
  industry: IndustryWeights;
  experienceLevel: ExperienceLevelWeights;
  customWeights?: Map<string, ScoringWeights>;
}

// Default scoring weights (total: 1.0)
export const DEFAULT_WEIGHTS: ScoringWeights = {
  skills: 0.35,        // 35% - Most important factor
  experience: 0.25,    // 25% - Critical for role fit
  education: 0.10,      // 10% - Important but less than experience
  location: 0.10,       // 10% - Work/life balance
  salary: 0.10,         // 10% - Compensation alignment
  preferences: 0.05,   // 5%  - Work style preferences
  culturalFit: 0.05     // 5%  - Team compatibility
};

// Industry-specific weight adjustments
export const INDUSTRY_WEIGHTS: IndustryWeights = {
  'Technology': {
    skills: 0.40,        // Technology values skills more
    experience: 0.30,
    education: 0.05,
    location: 0.10,
    salary: 0.05,
    preferences: 0.05,
    culturalFit: 0.05
  },
  'Healthcare': {
    skills: 0.30,
    experience: 0.30,
    education: 0.20,      // Healthcare values education more
    location: 0.10,
    salary: 0.05,
    preferences: 0.05,
    culturalFit: 0.00
  },
  'Finance': {
    skills: 0.35,
    experience: 0.30,
    education: 0.15,
    location: 0.05,       // Finance often remote-friendly
    salary: 0.10,
    preferences: 0.05,
    culturalFit: 0.00
  },
  'Education': {
    skills: 0.25,
    experience: 0.25,
    education: 0.30,      // Education highly values education
    location: 0.05,
    salary: 0.05,
    preferences: 0.10,
    culturalFit: 0.00
  },
  'Manufacturing': {
    skills: 0.35,
    experience: 0.35,      // Manufacturing values practical experience
    education: 0.10,
    location: 0.15,       // Location often important (on-site)
    salary: 0.05,
    preferences: 0.00,
    culturalFit: 0.00
  }
};

// Experience level weight adjustments
export const EXPERIENCE_LEVEL_WEIGHTS: ExperienceLevelWeights = {
  'entry': {
    skills: 0.30,
    experience: 0.10,     // Less emphasis on experience
    education: 0.20,      // Education more important for entry level
    location: 0.15,
    salary: 0.10,
    preferences: 0.10,
    culturalFit: 0.05
  },
  'junior': {
    skills: 0.35,
    experience: 0.20,
    education: 0.15,
    location: 0.10,
    salary: 0.10,
    preferences: 0.05,
    culturalFit: 0.05
  },
  'mid': {
    skills: 0.35,
    experience: 0.25,
    education: 0.10,
    location: 0.10,
    salary: 0.10,
    preferences: 0.05,
    culturalFit: 0.05
  },
  'senior': {
    skills: 0.30,
    experience: 0.30,     // Experience very important for senior roles
    education: 0.10,
    location: 0.10,
    salary: 0.10,
    preferences: 0.05,
    culturalFit: 0.05
  },
  'lead': {
    skills: 0.25,
    experience: 0.35,     // Leadership experience critical
    education: 0.10,
    location: 0.10,
    salary: 0.10,
    preferences: 0.05,
    culturalFit: 0.05
  },
  'manager': {
    skills: 0.20,
    experience: 0.35,     // Management experience critical
    education: 0.10,
    location: 0.10,
    salary: 0.10,
    preferences: 0.10,
    culturalFit: 0.05
  },
  'executive': {
    skills: 0.15,
    experience: 0.40,     // Executive experience most important
    education: 0.10,
    location: 0.10,
    salary: 0.10,
    preferences: 0.10,
    culturalFit: 0.05
  }
};

/**
 * Weight configuration manager
 */
export class WeightConfig {
  private static instance: WeightConfig;
  private config: WeightConfig;

  private constructor() {
    this.config = {
      default: DEFAULT_WEIGHTS,
      industry: INDUSTRY_WEIGHTS,
      experienceLevel: EXPERIENCE_LEVEL_WEIGHTS,
      customWeights: new Map()
    };
  }

  static getInstance(): WeightConfig {
    if (!WeightConfig.instance) {
      WeightConfig.instance = new WeightConfig();
    }
    return WeightConfig.instance;
  }

  /**
   * Get weights for specific criteria
   */
  getWeights(params: {
    industry?: string;
    experienceLevel?: string;
    employerId?: string;
    candidateId?: string;
  }): ScoringWeights {
    let weights = { ...this.config.default };

    // Apply industry-specific weights
    if (params.industry && this.config.industry[params.industry]) {
      weights = this.mergeWeights(weights, this.config.industry[params.industry]);
    }

    // Apply experience level weights
    if (params.experienceLevel && this.config.experienceLevel[params.experienceLevel]) {
      weights = this.mergeWeights(weights, this.config.experienceLevel[params.experienceLevel]);
    }

    // Apply custom weights if available
    const customWeightKey = this.getCustomWeightKey(params);
    if (customWeightKey && this.config.customWeights.has(customWeightKey)) {
      weights = this.mergeWeights(weights, this.config.customWeights.get(customWeightKey)!);
    }

    // Normalize weights to ensure they sum to 1.0
    return this.normalizeWeights(weights);
  }

  /**
   * Set custom weights for a specific context
   */
  setCustomWeights(key: string, weights: ScoringWeights): void {
    const normalizedWeights = this.normalizeWeights(weights);
    this.config.customWeights.set(key, normalizedWeights);
  }

  /**
   * Get custom weights for a specific context
   */
  getCustomWeights(key: string): ScoringWeights | undefined {
    return this.config.customWeights.get(key);
  }

  /**
   * Remove custom weights
   */
  removeCustomWeights(key: string): void {
    this.config.customWeights.delete(key);
  }

  /**
   * Get all current weights
   */
  getConfig(): WeightConfig {
    return { ...this.config };
  }

  /**
   * Validate weights configuration
   */
  validateWeights(weights: ScoringWeights): boolean {
    const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    return Math.abs(total - 1.0) < 0.01; // Allow small rounding errors
  }

  /**
   * Merge two weight objects
   */
  private mergeWeights(base: ScoringWeights, override: Partial<ScoringWeights>): ScoringWeights {
    return {
      ...base,
      ...override
    };
  }

  /**
   * Normalize weights to sum to 1.0
   */
  private normalizeWeights(weights: ScoringWeights): ScoringWeights {
    const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);

    if (total === 0) {
      return DEFAULT_WEIGHTS; // Fallback to defaults if all weights are zero
    }

    const normalized: ScoringWeights = {} as ScoringWeights;
    for (const [key, value] of Object.entries(weights)) {
      normalized[key as keyof ScoringWeights] = value / total;
    }

    return normalized;
  }

  /**
   * Generate key for custom weights storage
   */
  private getCustomWeightKey(params: {
    industry?: string;
    experienceLevel?: string;
    employerId?: string;
    candidateId?: string;
  }): string {
    const parts = [];
    if (params.industry) parts.push(`industry:${params.industry}`);
    if (params.experienceLevel) parts.push(`level:${params.experienceLevel}`);
    if (params.employerId) parts.push(`employer:${params.employerId}`);
    if (params.candidateId) parts.push(`candidate:${params.candidateId}`);
    return parts.join('|');
  }

  /**
   * Reset to default configuration
   */
  reset(): void {
    this.config = {
      default: DEFAULT_WEIGHTS,
      industry: INDUSTRY_WEIGHTS,
      experienceLevel: EXPERIENCE_LEVEL_WEIGHTS,
      customWeights: new Map()
    };
  }

  /**
   * Export configuration to JSON
   */
  exportToJSON(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Import configuration from JSON
   */
  importFromJSON(json: string): void {
    try {
      const parsed = JSON.parse(json);
      this.config = {
        default: parsed.default || DEFAULT_WEIGHTS,
        industry: parsed.industry || INDUSTRY_WEIGHTS,
        experienceLevel: parsed.experienceLevel || EXPERIENCE_LEVEL_WEIGHTS,
        customWeights: new Map(parsed.customWeights || [])
      };
    } catch (error) {
      console.error('Failed to import weight configuration:', error);
      throw new Error('Invalid weight configuration format');
    }
  }
}

// Export singleton instance
export const weightConfig = WeightConfig.getInstance();
export default weightConfig;