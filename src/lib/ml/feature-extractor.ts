import {
  CandidateProfile,
  JobProfile,
  FeatureVector,
  FeatureExtractionConfig,
  EmbeddingModel
} from '@/types/matching';
import { logger } from '@/lib/logging/logger';

/**
 * Feature extraction configuration
 */
export interface FeatureExtractionOptions {
  useTextEmbeddings: boolean;
  useCategoricalEncoding: boolean;
  useNumericalNormalization: boolean;
  embeddingModel: string;
  embeddingDimension: number;
  maxTextLength: number;
  includeMetadataFeatures: boolean;
}

/**
 * Feature categories and their weights
 */
const FEATURE_CATEGORIES = {
  SKILLS: { weight: 0.35, maxFeatures: 50 },
  EXPERIENCE: { weight: 0.25, maxFeatures: 20 },
  EDUCATION: { weight: 0.15, maxFeatures: 15 },
  LOCATION: { weight: 0.10, maxFeatures: 10 },
  SALARY: { weight: 0.10, maxFeatures: 5 },
  PREFERENCES: { weight: 0.05, maxFeatures: 10 }
};

/**
 * Advanced feature extractor for ML models
 */
export class FeatureExtractor {
  private config: FeatureExtractionOptions;
  private embeddingCache: Map<string, number[]> = new Map();
  private vocabulary: Set<string> = new Set();
  private isInitialized: boolean = false;

  constructor(config?: Partial<FeatureExtractionOptions>) {
    this.config = {
      useTextEmbeddings: true,
      useCategoricalEncoding: true,
      useNumericalNormalization: true,
      embeddingModel: 'text-embedding-ada-002',
      embeddingDimension: 1536,
      maxTextLength: 5000,
      includeMetadataFeatures: true,
      ...config
    };
  }

  /**
   * Initialize the feature extractor
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing feature extractor');

      // Load vocabulary and models
      await this.loadVocabulary();
      await this.loadEmbeddingModel();

      this.isInitialized = true;
      logger.info('Feature extractor initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize feature extractor', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Extract features from a single profile (candidate or job)
   */
  async extractProfileFeatures(
    profile: CandidateProfile | JobProfile,
    profileType: 'candidate' | 'job'
  ): Promise<FeatureVector> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const startTime = Date.now();
      const features: number[] = [];

      // Extract different feature categories
      const skillsFeatures = await this.extractSkillsFeatures(profile, profileType);
      const experienceFeatures = this.extractExperienceFeatures(profile, profileType);
      const educationFeatures = this.extractEducationFeatures(profile, profileType);
      const locationFeatures = this.extractLocationFeatures(profile, profileType);
      const salaryFeatures = this.extractSalaryFeatures(profile, profileType);
      const preferenceFeatures = this.extractPreferenceFeatures(profile, profileType);

      // Combine all features
      features.push(...skillsFeatures);
      features.push(...experienceFeatures);
      features.push(...educationFeatures);
      features.push(...locationFeatures);
      features.push(...salaryFeatures);
      features.push(...preferenceFeatures);

      // Add metadata features if enabled
      if (this.config.includeMetadataFeatures) {
        const metadataFeatures = this.extractMetadataFeatures(profile, profileType);
        features.push(...metadataFeatures);
      }

      // Apply normalization if enabled
      if (this.config.useNumericalNormalization) {
        this.normalizeFeatures(features);
      }

      const processingTime = Date.now() - startTime;

      logger.debug('Profile features extracted', {
        profileType,
        profileId: profile.id,
        featureCount: features.length,
        processingTime
      });

      return {
        vector: features,
        metadata: {
          featureCount: features.length,
          processingTime,
          categories: {
            skills: skillsFeatures.length,
            experience: experienceFeatures.length,
            education: educationFeatures.length,
            location: locationFeatures.length,
            salary: salaryFeatures.length,
            preferences: preferenceFeatures.length
          }
        }
      };
    } catch (error) {
      logger.error('Feature extraction failed', {
        profileType,
        profileId: profile.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Extract paired features from candidate and job profiles
   */
  async extractPairFeatures(
    candidate: CandidateProfile,
    job: JobProfile
  ): Promise<FeatureVector> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const startTime = Date.now();
      const features: number[] = [];

      // Extract individual profile features
      const candidateFeatures = await this.extractProfileFeatures(candidate, 'candidate');
      const jobFeatures = await this.extractProfileFeatures(job, 'job');

      // Calculate interaction features
      const interactionFeatures = await this.calculateInteractionFeatures(
        candidateFeatures.vector,
        jobFeatures.vector
      );

      // Calculate similarity features
      const similarityFeatures = await this.calculateSimilarityFeatures(candidate, job);

      // Calculate text similarity features
      const textSimilarityFeatures = this.config.useTextEmbeddings
        ? await this.calculateTextSimilarityFeatures(candidate, job)
        : [];

      // Combine all features
      features.push(...candidateFeatures.vector);
      features.push(...jobFeatures.vector);
      features.push(...interactionFeatures);
      features.push(...similarityFeatures);
      features.push(...textSimilarityFeatures);

      // Apply normalization
      if (this.config.useNumericalNormalization) {
        this.normalizeFeatures(features);
      }

      const processingTime = Date.now() - startTime;

      logger.debug('Pair features extracted', {
        candidateId: candidate.id,
        jobId: job.id,
        featureCount: features.length,
        processingTime
      });

      return {
        vector: features,
        metadata: {
          featureCount: features.length,
          processingTime,
          candidateFeatures: candidateFeatures.vector.length,
          jobFeatures: jobFeatures.vector.length,
          interactionFeatures: interactionFeatures.length,
          similarityFeatures: similarityFeatures.length,
          textSimilarityFeatures: textSimilarityFeatures.length
        }
      };
    } catch (error) {
      logger.error('Pair feature extraction failed', {
        candidateId: candidate.id,
        jobId: job.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Extract skills-related features
   */
  private async extractSkillsFeatures(
    profile: CandidateProfile | JobProfile,
    profileType: 'candidate' | 'job'
  ): Promise<number[]> {
    const features: number[] = [];

    try {
      let skills: string[] = [];

      if (profileType === 'candidate' && 'skills' in profile) {
        skills = Array.isArray(profile.skills) ? profile.skills : Object.keys(profile.skills || {});
      } else if (profileType === 'job' && 'requiredSkills' in profile) {
        skills = Array.isArray(profile.requiredSkills) ? profile.requiredSkills : Object.keys(profile.requiredSkills || {});
      }

      // Clean and normalize skills
      const normalizedSkills = skills.map(skill => skill.toLowerCase().trim());

      // Create binary features for common skills
      const commonSkills = this.getCommonSkills();
      for (const commonSkill of commonSkills) {
        features.push(normalizedSkills.includes(commonSkill) ? 1 : 0);
      }

      // Skills count feature
      features.push(this.normalizeValue(skills.length, 0, 50));

      // Skills diversity (number of unique categories)
      const skillCategories = this.categorizeSkills(normalizedSkills);
      features.push(this.normalizeValue(Object.keys(skillCategories).length, 0, 10));

      // Skills level (for candidates)
      if (profileType === 'candidate' && 'skills' in profile && typeof profile.skills === 'object') {
        const skillLevels = Object.values(profile.skills).filter((level): level is number => typeof level === 'number');
        if (skillLevels.length > 0) {
          features.push(this.normalizeValue(skillLevels.reduce((sum, level) => sum + level, 0) / skillLevels.length, 0, 5));
        } else {
          features.push(0);
        }
      } else {
        features.push(0);
      }

      return features;
    } catch (error) {
      logger.error('Skills feature extraction failed', {
        profileId: profile.id,
        profileType,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return features;
    }
  }

  /**
   * Extract experience-related features
   */
  private extractExperienceFeatures(
    profile: CandidateProfile | JobProfile,
    profileType: 'candidate' | 'job'
  ): number[] {
    const features: number[] = [];

    try {
      let experienceYears = 0;
      let experienceLevel = 0;
      let industryExperience: string[] = [];

      if (profileType === 'candidate' && 'experience' in profile) {
        const experience = Array.isArray(profile.experience) ? profile.experience : [];

        // Calculate total experience years
        for (const exp of experience) {
          if (exp.startDate && exp.endDate) {
            const start = new Date(exp.startDate);
            const end = exp.endDate ? new Date(exp.endDate) : new Date();
            const years = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
            experienceYears += years;
          }

          // Collect industries
          if (exp.industry) {
            industryExperience.push(exp.industry.toLowerCase());
          }
        }

        // Experience level mapping
        experienceLevel = this.mapExperienceToLevel(experienceYears);
      } else if (profileType === 'job' && 'experienceRequired' in profile) {
        experienceYears = profile.experienceRequired || 0;
        experienceLevel = this.mapExperienceToLevel(experienceYears);
      }

      // Experience years
      features.push(this.normalizeValue(experienceYears, 0, 30));

      // Experience level (one-hot encoded)
      const levelCategories = ['entry', 'junior', 'mid', 'senior', 'lead', 'principal', 'executive'];
      for (const level of levelCategories) {
        features.push(experienceLevel === levelCategories.indexOf(level) ? 1 : 0);
      }

      // Industry diversity
      features.push(this.normalizeValue(new Set(industryExperience).size, 0, 10));

      return features;
    } catch (error) {
      logger.error('Experience feature extraction failed', {
        profileId: profile.id,
        profileType,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return features;
    }
  }

  /**
   * Extract education-related features
   */
  private extractEducationFeatures(
    profile: CandidateProfile | JobProfile,
    profileType: 'candidate' | 'job'
  ): number[] {
    const features: number[] = [];

    try {
      let highestDegree = 'none';
      let educationCount = 0;
      let relevantFields: string[] = [];

      if (profileType === 'candidate' && 'education' in profile) {
        const education = Array.isArray(profile.education) ? profile.education : [];
        educationCount = education.length;

        // Find highest degree
        const degrees = education.map(ed => ed.degree.toLowerCase());
        if (degrees.includes('phd') || degrees.includes('doctorate')) {
          highestDegree = 'phd';
        } else if (degrees.includes('master') || degrees.includes('mba')) {
          highestDegree = 'master';
        } else if (degrees.includes('bachelor') || degrees.includes('bs')) {
          highestDegree = 'bachelor';
        } else if (degrees.includes('associate')) {
          highestDegree = 'associate';
        }

        // Collect relevant fields
        relevantFields = education.map(ed => ed.field.toLowerCase());
      } else if (profileType === 'job' && 'educationRequirements' in profile) {
        const requirements = Array.isArray(profile.educationRequirements) ? profile.educationRequirements : [];
        educationCount = requirements.length;

        // Extract degree requirements
        const degreeText = requirements.join(' ').toLowerCase();
        if (degreeText.includes('phd') || degreeText.includes('doctorate')) {
          highestDegree = 'phd';
        } else if (degreeText.includes('master') || degreeText.includes('mba')) {
          highestDegree = 'master';
        } else if (degreeText.includes('bachelor') || degreeText.includes('bs')) {
          highestDegree = 'bachelor';
        } else if (degreeText.includes('associate')) {
          highestDegree = 'associate';
        }

        relevantFields = requirements;
      }

      // Education level (one-hot encoded)
      const degreeLevels = ['none', 'high-school', 'associate', 'bachelor', 'master', 'phd'];
      for (const level of degreeLevels) {
        features.push(highestDegree === level ? 1 : 0);
      }

      // Education count
      features.push(this.normalizeValue(educationCount, 0, 5));

      // Field relevance (simplified)
      const relevantFieldsCount = relevantFields.length;
      features.push(this.normalizeValue(relevantFieldsCount, 0, 3));

      return features;
    } catch (error) {
      logger.error('Education feature extraction failed', {
        profileId: profile.id,
        profileType,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return features;
    }
  }

  /**
   * Extract location-related features
   */
  private extractLocationFeatures(
    profile: CandidateProfile | JobProfile,
    profileType: 'candidate' | 'job'
  ): number[] {
    const features: number[] = [];

    try {
      let location: any = null;
      let remotePreference = false;

      if (profileType === 'candidate' && 'location' in profile) {
        location = profile.location;
        remotePreference = profile.preferences?.remoteWork || false;
      } else if (profileType === 'job' && 'location' in profile) {
        location = profile.location;
        remotePreference = profile.remoteWorkPolicy === 'remote';
      }

      if (!location) {
        // Fill with zeros for missing location
        return new Array(10).fill(0);
      }

      // Country features (one-hot encoded for common countries)
      const commonCountries = ['united states', 'canada', 'united kingdom', 'germany', 'france'];
      const country = location.country?.toLowerCase() || '';
      for (const commonCountry of commonCountries) {
        features.push(country.includes(commonCountry) ? 1 : 0);
      }

      // Remote work preference
      features.push(remotePreference ? 1 : 0);

      // Location type (urban/suburban/rural)
      const locationType = location.type || 'unknown';
      const locationTypes = ['urban', 'suburban', 'rural', 'unknown'];
      for (const type of locationTypes) {
        features.push(locationType === type ? 1 : 0);
      }

      // Timezone offset (normalized)
      const timezoneOffset = location.timezoneOffset || 0;
      features.push(this.normalizeValue(timezoneOffset, -12, 12));

      return features;
    } catch (error) {
      logger.error('Location feature extraction failed', {
        profileId: profile.id,
        profileType,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return features;
    }
  }

  /**
   * Extract salary-related features
   */
  private extractSalaryFeatures(
    profile: CandidateProfile | JobProfile,
    profileType: 'candidate' | 'job'
  ): number[] {
    const features: number[] = [];

    try {
      let salaryMin = 0;
      let salaryMax = 0;
      let currency = 'USD';

      if (profileType === 'candidate' && 'salaryExpectation' in profile) {
        const salary = profile.salaryExpectation;
        if (typeof salary === 'object') {
          salaryMin = salary.min || 0;
          salaryMax = salary.max || 0;
          currency = salary.currency || 'USD';
        }
      } else if (profileType === 'job' && 'salaryRange' in profile) {
        const salary = profile.salaryRange;
        if (typeof salary === 'object') {
          salaryMin = salary.min || 0;
          salaryMax = salary.max || 0;
          currency = salary.currency || 'USD';
        }
      }

      // Salary range (normalized)
      features.push(this.normalizeValue(salaryMin, 0, 300000));
      features.push(this.normalizeValue(salaryMax, 0, 300000));

      // Salary range width
      const rangeWidth = salaryMax - salaryMin;
      features.push(this.normalizeValue(rangeWidth, 0, 100000));

      // Currency features (one-hot encoded)
      const commonCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];
      for (const commonCurrency of commonCurrencies) {
        features.push(currency === commonCurrency ? 1 : 0);
      }

      return features;
    } catch (error) {
      logger.error('Salary feature extraction failed', {
        profileId: profile.id,
        profileType,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return features;
    }
  }

  /**
   * Extract preference-related features
   */
  private extractPreferenceFeatures(
    profile: CandidateProfile | JobProfile,
    profileType: 'candidate' | 'job'
  ): number[] {
    const features: number[] = [];

    try {
      let preferences: any = {};

      if (profileType === 'candidate' && 'preferences' in profile) {
        preferences = profile.preferences || {};
      } else if (profileType === 'job' && 'benefits' in profile) {
        preferences = { ...profile.benefits, ...profile.workCulture };
      }

      // Employment type preferences
      const employmentTypes = preferences.employmentTypes || [];
      const commonTypes = ['full-time', 'part-time', 'contract', 'internship'];
      for (const type of commonTypes) {
        features.push(employmentTypes.includes(type) ? 1 : 0);
      }

      // Work style preferences
      const workStyle = preferences.workStyle || '';
      const workStyles = ['remote', 'hybrid', 'on-site', 'flexible'];
      for (const style of workStyles) {
        features.push(workStyle.includes(style) ? 1 : 0);
      }

      // Company size preference
      const companySize = preferences.companySize || '';
      const sizes = ['startup', 'small', 'medium', 'large', 'enterprise'];
      for (const size of sizes) {
        features.push(companySize.includes(size) ? 1 : 0);
      }

      // Growth opportunities preference
      const growthOpportunities = preferences.growthOpportunities || false;
      features.push(growthOpportunities ? 1 : 0);

      return features;
    } catch (error) {
      logger.error('Preference feature extraction failed', {
        profileId: profile.id,
        profileType,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return features;
    }
  }

  /**
   * Extract metadata features
   */
  private extractMetadataFeatures(
    profile: CandidateProfile | JobProfile,
    profileType: 'candidate' | 'job'
  ): number[] {
    const features: number[] = [];

    try {
      // Profile completeness score
      features.push((profile.completionScore || 0) / 100);

      // Profile age (days since creation/last update)
      const profileAge = (Date.now() - (profile.lastUpdated || profile.createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24);
      features.push(this.normalizeValue(profileAge, 0, 365));

      // Verification status
      features.push(profile.verified ? 1 : 0);

      // Featured status
      features.push(profile.featured ? 1 : 0);

      // Activity level (simplified)
      const activityLevel = this.calculateActivityLevel(profile);
      features.push(this.normalizeValue(activityLevel, 0, 1));

      return features;
    } catch (error) {
      logger.error('Metadata feature extraction failed', {
        profileId: profile.id,
        profileType,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return features;
    }
  }

  /**
   * Calculate interaction features between candidate and job features
   */
  private async calculateInteractionFeatures(
    candidateFeatures: number[],
    jobFeatures: number[]
  ): Promise<number[]> {
    const features: number[] = [];

    try {
      // Element-wise multiplication (interaction)
      const minLength = Math.min(candidateFeatures.length, jobFeatures.length);
      for (let i = 0; i < minLength; i++) {
        features.push(candidateFeatures[i] * jobFeatures[i]);
      }

      // Absolute differences
      for (let i = 0; i < minLength; i++) {
        features.push(Math.abs(candidateFeatures[i] - jobFeatures[i]));
      }

      // Ratios (with handling for zero division)
      for (let i = 0; i < minLength; i++) {
        if (jobFeatures[i] !== 0) {
          features.push(candidateFeatures[i] / jobFeatures[i]);
        } else {
          features.push(0);
        }
      }

      return features;
    } catch (error) {
      logger.error('Interaction feature calculation failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return features;
    }
  }

  /**
   * Calculate similarity features
   */
  private async calculateSimilarityFeatures(
    candidate: CandidateProfile,
    job: JobProfile
  ): Promise<number[]> {
    const features: number[] = [];

    try {
      // Skills similarity (Jaccard similarity)
      const candidateSkills = this.getSkillList(candidate);
      const jobSkills = this.getSkillList(job);
      const skillsJaccard = this.calculateJaccardSimilarity(
        new Set(candidateSkills),
        new Set(jobSkills)
      );
      features.push(skillsJaccard);

      // Experience alignment
      const candidateExp = this.getTotalExperience(candidate);
      const jobExp = job.experienceRequired || 0;
      const expAlignment = this.calculateExperienceAlignment(candidateExp, jobExp);
      features.push(expAlignment);

      // Education match
      const candidateEducation = this.getHighestEducation(candidate);
      const jobEducation = job.educationRequirements || [];
      const educationMatch = this.calculateEducationMatch(candidateEducation, jobEducation);
      features.push(educationMatch);

      // Location compatibility
      const locationCompatibility = this.calculateLocationCompatibility(
        candidate.location,
        job.location,
        job.remoteWorkPolicy
      );
      features.push(locationCompatibility);

      // Salary alignment
      const salaryAlignment = this.calculateSalaryAlignment(
        candidate.salaryExpectation,
        job.salaryRange
      );
      features.push(salaryAlignment);

      return features;
    } catch (error) {
      logger.error('Similarity feature calculation failed', {
        candidateId: candidate.id,
        jobId: job.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return features;
    }
  }

  /**
   * Calculate text similarity features using embeddings
   */
  private async calculateTextSimilarityFeatures(
    candidate: CandidateProfile,
    job: JobProfile
  ): Promise<number[]> {
    const features: number[] = [];

    try {
      // Get text embeddings
      const candidateText = this.extractTextForEmbedding(candidate);
      const jobText = this.extractTextForEmbedding(job);

      const candidateEmbedding = await this.getEmbedding(candidateText);
      const jobEmbedding = await this.getEmbedding(jobText);

      if (candidateEmbedding && jobEmbedding) {
        // Cosine similarity
        const cosineSimilarity = this.calculateCosineSimilarity(candidateEmbedding, jobEmbedding);
        features.push(cosineSimilarity);

        // Euclidean distance
        const euclideanDistance = this.calculateEuclideanDistance(candidateEmbedding, jobEmbedding);
        features.push(this.normalizeValue(euclideanDistance, 0, 2));
      } else {
        features.push(0, 0);
      }

      return features;
    } catch (error) {
      logger.error('Text similarity calculation failed', {
        candidateId: candidate.id,
        jobId: job.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return features;
    }
  }

  // Helper methods
  private normalizeValue(value: number, min: number, max: number): number {
    if (max === min) return 0;
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
  }

  private normalizeFeatures(features: number[]): void {
    // Simple min-max normalization
    const min = Math.min(...features);
    const max = Math.max(...features);

    if (max === min) return;

    for (let i = 0; i < features.length; i++) {
      features[i] = (features[i] - min) / (max - min);
    }
  }

  private getCommonSkills(): string[] {
    return [
      'javascript', 'python', 'java', 'react', 'node.js', 'sql', 'aws',
      'leadership', 'communication', 'project management', 'data analysis',
      'machine learning', 'docker', 'kubernetes', 'typescript', 'angular'
    ];
  }

  private categorizeSkills(skills: string[]): Record<string, string[]> {
    const categories: Record<string, string[]> = {
      'frontend': [],
      'backend': [],
      'database': [],
      'cloud': [],
      'devops': [],
      'mobile': [],
      'ml': [],
      'other': []
    };

    const skillCategoryMap: Record<string, string> = {
      'javascript': 'frontend', 'react': 'frontend', 'angular': 'frontend', 'vue': 'frontend',
      'python': 'backend', 'java': 'backend', 'node.js': 'backend', 'c#': 'backend',
      'sql': 'database', 'mongodb': 'database', 'postgresql': 'database',
      'aws': 'cloud', 'azure': 'cloud', 'gcp': 'cloud', 'docker': 'cloud',
      'kubernetes': 'devops', 'jenkins': 'devops', 'git': 'devops',
      'ios': 'mobile', 'android': 'mobile', 'flutter': 'mobile',
      'machine learning': 'ml', 'tensorflow': 'ml', 'pytorch': 'ml'
    };

    for (const skill of skills) {
      const category = skillCategoryMap[skill] || 'other';
      categories[category].push(skill);
    }

    return categories;
  }

  private mapExperienceToLevel(years: number): string {
    if (years < 1) return 'entry';
    if (years < 3) return 'junior';
    if (years < 5) return 'mid';
    if (years < 8) return 'senior';
    if (years < 12) return 'lead';
    if (years < 15) return 'principal';
    return 'executive';
  }

  private getSkillList(profile: CandidateProfile | JobProfile): string[] {
    if ('skills' in profile) {
      return Array.isArray(profile.skills) ? profile.skills : Object.keys(profile.skills || {});
    } else if ('requiredSkills' in profile) {
      return Array.isArray(profile.requiredSkills) ? profile.requiredSkills : Object.keys(profile.requiredSkills || {});
    }
    return [];
  }

  private getTotalExperience(profile: CandidateProfile): number {
    const experience = Array.isArray(profile.experience) ? profile.experience : [];
    let totalYears = 0;

    for (const exp of experience) {
      if (exp.startDate && exp.endDate) {
        const start = new Date(exp.startDate);
        const end = exp.endDate ? new Date(exp.endDate) : new Date();
        totalYears += (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
      }
    }

    return totalYears;
  }

  private getHighestEducation(profile: CandidateProfile): string {
    const education = Array.isArray(profile.education) ? profile.education : [];
    const degrees = education.map(ed => ed.degree.toLowerCase());

    if (degrees.includes('phd') || degrees.includes('doctorate')) return 'phd';
    if (degrees.includes('master') || degrees.includes('mba')) return 'master';
    if (degrees.includes('bachelor') || degrees.includes('bs')) return 'bachelor';
    if (degrees.includes('associate')) return 'associate';
    return 'none';
  }

  private calculateJaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return intersection.size / union.size;
  }

  private calculateExperienceAlignment(candidateYears: number, jobYears: number): number {
    if (jobYears === 0) return 1;
    const ratio = candidateYears / jobYears;
    if (ratio >= 0.8 && ratio <= 1.5) return 1;
    if (ratio >= 0.5 && ratio <= 2.0) return 0.7;
    return Math.max(0, 1 - Math.abs(ratio - 1));
  }

  private calculateEducationMatch(candidateLevel: string, jobRequirements: any[]): number {
    // Simplified education matching logic
    const levels = ['none', 'high-school', 'associate', 'bachelor', 'master', 'phd'];
    const candidateIndex = levels.indexOf(candidateLevel);

    if (candidateIndex === -1) return 0;

    // Check if candidate meets requirements
    for (const requirement of jobRequirements) {
      const reqText = requirement.toLowerCase();
      if (reqText.includes('phd') && candidateIndex < 5) return 0;
      if (reqText.includes('master') && candidateIndex < 4) return 0;
      if (reqText.includes('bachelor') && candidateIndex < 3) return 0;
    }

    return 1;
  }

  private calculateLocationCompatibility(candidateLoc: any, jobLoc: any, remotePolicy: string): number {
    if (!candidateLoc || !jobLoc) return 0;

    // Full remote compatibility
    if (remotePolicy === 'remote') return 1;

    // Same location compatibility
    if (candidateLoc.country === jobLoc.country && candidateLoc.city === jobLoc.city) return 1;
    if (candidateLoc.country === jobLoc.country) return 0.8;

    return 0.3;
  }

  private calculateSalaryAlignment(candidateSal: any, jobSal: any): number {
    if (!candidateSal || !jobSal) return 0;

    const candidateMin = candidateSal.min || 0;
    const candidateMax = candidateSal.max || candidateMin;
    const jobMin = jobSal.min || 0;
    const jobMax = jobSal.max || jobMin;

    // Check if ranges overlap
    if (candidateMax >= jobMin && candidateMin <= jobMax) return 1;

    // Check proximity
    const centerDist = Math.abs((candidateMin + candidateMax) / 2 - (jobMin + jobMax) / 2);
    const avgRange = ((candidateMax - candidateMin) + (jobMax - jobMin)) / 2;

    return Math.max(0, 1 - centerDist / avgRange);
  }

  private extractTextForEmbedding(profile: CandidateProfile | JobProfile): string {
    const texts: string[] = [];

    if ('title' in profile) texts.push(profile.title || '');
    if ('summary' in profile) texts.push(profile.summary || '');
    if ('description' in profile) texts.push(profile.description || '');

    return texts.join(' ').substring(0, this.config.maxTextLength);
  }

  private async getEmbedding(text: string): Promise<number[] | null> {
    if (!this.config.useTextEmbeddings || !text.trim()) return null;

    // Check cache first
    const cacheKey = text.substring(0, 100);
    if (this.embeddingCache.has(cacheKey)) {
      return this.embeddingCache.get(cacheKey);
    }

    // Generate embedding (simulated - in real implementation, use OpenAI or similar)
    const embedding = this.generateMockEmbedding(text);

    // Cache result
    this.embeddingCache.set(cacheKey, embedding);

    return embedding;
  }

  private generateMockEmbedding(text: string): number[] {
    // Generate deterministic mock embedding based on text
    const embedding = new Array(this.config.embeddingDimension).fill(0);
    const hash = this.simpleHash(text);

    for (let i = 0; i < embedding.length; i++) {
      embedding[i] = Math.sin(hash + i) * 0.5 + 0.5;
    }

    return embedding;
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

  private calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0;

    const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
    const magnitude1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));

    if (magnitude1 === 0 || magnitude2 === 0) return 0;

    return dotProduct / (magnitude1 * magnitude2);
  }

  private calculateEuclideanDistance(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return Infinity;

    const sumSquared = vec1.reduce((sum, val, i) => sum + Math.pow(val - vec2[i], 2), 0);
    return Math.sqrt(sumSquared);
  }

  private calculateActivityLevel(profile: CandidateProfile | JobProfile): number {
    // Simplified activity level calculation
    const lastUpdated = profile.lastUpdated || profile.createdAt || new Date();
    const daysSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceUpdate < 7) return 1;
    if (daysSinceUpdate < 30) return 0.7;
    if (daysSinceUpdate < 90) return 0.4;
    return 0.1;
  }

  private async loadVocabulary(): Promise<void> {
    // Load vocabulary from database or file
    // Implementation depends on your vocabulary storage strategy
  }

  private async loadEmbeddingModel(): Promise<void> {
    // Load embedding model (OpenAI, local model, etc.)
    // Implementation depends on your embedding service
  }
}

export default FeatureExtractor;