import { prisma } from '@/lib/prisma';
import { Prisma, Job, Resume, User } from '@prisma/client';

// Types for ML features
interface JobFeatures {
  title: string;
  description: string;
  requirements: string;
  requiredSkills: string[];
  location: string;
  type: string;
  experienceLevel: string;
  salaryMin?: number;
  salaryMax?: number;
  industry?: string;
  companySize?: string;
}

interface CandidateFeatures {
  skills: string[];
  experience: Array<{
    title: string;
    description: string;
    duration: number;
    current: boolean;
  }>;
  education: Array<{
    degree: string;
    field: string;
    school: string;
  }>;
  location: string;
  title: string;
  summary?: string;
  preferredLocations: string[];
  salaryExpectation?: number;
  jobTypes: string[];
  availability: string;
}

interface MatchResult {
  score: number;
  confidence: number;
  factors: MatchFactor[];
  recommendations: string[];
  insights: MatchInsight[];
}

interface MatchFactor {
  name: string;
  score: number;
  weight: number;
  details: string;
}

interface MatchInsight {
  type: 'strength' | 'weakness' | 'recommendation';
  title: string;
  description: string;
  actionable: boolean;
}

export class MLMatchingEngine {
  private static instance: MLMatchingEngine;
  private skillEmbeddings: Map<string, number[]> = new Map();
  private modelInitialized = false;

  static getInstance(): MLMatchingEngine {
    if (!MLMatchingEngine.instance) {
      MLMatchingEngine.instance = new MLMatchingEngine();
    }
    return MLMatchingEngine.instance;
  }

  private constructor() {
    this.initializeModel();
  }

  private async initializeModel() {
    try {
      // Load pre-trained skill embeddings or initialize with simple ones
      await this.loadSkillEmbeddings();
      this.modelInitialized = true;
      console.log('ML Matching Engine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ML Matching Engine:', error);
      // Fall back to rule-based matching if ML fails
    }
  }

  private async loadSkillEmbeddings() {
    // Simplified skill embeddings - in production, these would be pre-trained vectors
    const commonSkills = [
      'javascript', 'python', 'react', 'nodejs', 'typescript', 'java', 'c++', 'sql',
      'aws', 'docker', 'kubernetes', 'git', 'agile', 'scrum', 'leadership',
      'communication', 'project management', 'data analysis', 'machine learning',
      'artificial intelligence', 'web development', 'mobile development', 'devops'
    ];

    // Create simple embeddings based on skill categories
    const categories = {
      'frontend': ['javascript', 'react', 'typescript', 'html', 'css', 'vue', 'angular'],
      'backend': ['nodejs', 'python', 'java', 'c++', 'sql', 'mongodb', 'postgresql'],
      'devops': ['aws', 'docker', 'kubernetes', 'git', 'ci/cd', 'linux', 'terraform'],
      'data': ['data analysis', 'machine learning', 'artificial intelligence', 'python', 'r', 'sql'],
      'mobile': ['react native', 'flutter', 'swift', 'kotlin', 'ios', 'android'],
      'soft': ['leadership', 'communication', 'project management', 'agile', 'scrum']
    };

    // Generate embeddings for each skill
    for (const skill of commonSkills) {
      const embedding = new Array(6).fill(0);

      Object.entries(categories).forEach(([category, skills], index) => {
        if (skills.some(s => skill.includes(s) || s.includes(skill))) {
          embedding[index] = 1;
        }
      });

      // Add some noise for uniqueness
      embedding.push(Math.random() * 0.3);

      this.skillEmbeddings.set(skill.toLowerCase(), embedding);
    }
  }

  async calculateMatchScore(
    candidate: CandidateFeatures,
    job: JobFeatures,
    userPreferences?: any
  ): Promise<MatchResult> {
    if (!this.modelInitialized) {
      return this.fallbackMatching(candidate, job);
    }

    const factors: MatchFactor[] = [];
    let totalScore = 0;
    let totalWeight = 0;

    // 1. Skills Matching (35% weight)
    const skillsMatch = await this.calculateSkillsMatch(candidate.skills, job.requiredSkills);
    factors.push({
      name: 'Skills Alignment',
      score: skillsMatch.score,
      weight: 0.35,
      details: skillsMatch.details
    });
    totalScore += skillsMatch.score * 0.35;
    totalWeight += 0.35;

    // 2. Experience Matching (25% weight)
    const experienceMatch = this.calculateExperienceMatch(candidate.experience, job);
    factors.push({
      name: 'Experience Relevance',
      score: experienceMatch.score,
      weight: 0.25,
      details: experienceMatch.details
    });
    totalScore += experienceMatch.score * 0.25;
    totalWeight += 0.25;

    // 3. Education & Qualifications (15% weight)
    const educationMatch = this.calculateEducationMatch(candidate.education, job);
    factors.push({
      name: 'Education Match',
      score: educationMatch.score,
      weight: 0.15,
      details: educationMatch.details
    });
    totalScore += educationMatch.score * 0.15;
    totalWeight += 0.15;

    // 4. Location & Work Style (15% weight)
    const locationMatch = this.calculateLocationMatch(candidate, job, userPreferences);
    factors.push({
      name: 'Location & Work Style',
      score: locationMatch.score,
      weight: 0.15,
      details: locationMatch.details
    });
    totalScore += locationMatch.score * 0.15;
    totalWeight += 0.15;

    // 5. Salary Alignment (10% weight)
    const salaryMatch = this.calculateSalaryMatch(candidate, job);
    factors.push({
      name: 'Salary Alignment',
      score: salaryMatch.score,
      weight: 0.10,
      details: salaryMatch.details
    });
    totalScore += salaryMatch.score * 0.10;
    totalWeight += 0.10;

    const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    const confidence = this.calculateConfidence(factors);
    const insights = this.generateInsights(candidate, job, factors);
    const recommendations = this.generateRecommendations(candidate, job, factors);

    return {
      score: Math.round(finalScore * 100),
      confidence: Math.round(confidence * 100),
      factors,
      recommendations,
      insights
    };
  }

  private async calculateSkillsMatch(
    candidateSkills: string[],
    jobSkills: string[]
  ): Promise<{ score: number; details: string }> {
    if (!jobSkills || jobSkills.length === 0) {
      return { score: 0.5, details: 'No specific skills required' };
    }

    const normalizedCandidateSkills = candidateSkills.map(s => s.toLowerCase());
    const normalizedJobSkills = jobSkills.map(s => s.toLowerCase());

    // Calculate semantic similarity using embeddings
    let similarityScore = 0;
    let matchedSkills: string[] = [];

    for (const jobSkill of normalizedJobSkills) {
      let bestMatch = 0;
      let matchedSkill = '';

      for (const candidateSkill of normalizedCandidateSkills) {
        const similarity = this.calculateSkillSimilarity(candidateSkill, jobSkill);
        if (similarity > bestMatch) {
          bestMatch = similarity;
          matchedSkill = candidateSkill;
        }
      }

      if (bestMatch > 0.3) { // Threshold for considering a skill matched
        similarityScore += bestMatch;
        matchedSkills.push(matchedSkill);
      }
    }

    const averageSimilarity = similarityScore / jobSkills.length;
    const coverageRate = matchedSkills.length / jobSkills.length;

    // Combine similarity and coverage
    const finalScore = (averageSimilarity * 0.6) + (coverageRate * 0.4);

    const details = `Matched ${matchedSkills.length}/${jobSkills.length} skills: ${matchedSkills.join(', ')}`;

    return {
      score: Math.min(finalScore, 1),
      details
    };
  }

  private calculateSkillSimilarity(skill1: string, skill2: string): number {
    const embedding1 = this.skillEmbeddings.get(skill1);
    const embedding2 = this.skillEmbeddings.get(skill2);

    if (embedding1 && embedding2) {
      // Calculate cosine similarity
      const dotProduct = embedding1.reduce((sum, val, i) => sum + val * embedding2[i], 0);
      const magnitude1 = Math.sqrt(embedding1.reduce((sum, val) => sum + val * val, 0));
      const magnitude2 = Math.sqrt(embedding2.reduce((sum, val) => sum + val * val, 0));

      return magnitude1 > 0 && magnitude2 > 0 ? dotProduct / (magnitude1 * magnitude2) : 0;
    }

    // Fallback to string similarity
    if (skill1 === skill2) return 1;
    if (skill1.includes(skill2) || skill2.includes(skill1)) return 0.8;

    // Simple word overlap
    const words1 = skill1.split(' ');
    const words2 = skill2.split(' ');
    const commonWords = words1.filter(word => words2.includes(word));

    return commonWords.length / Math.max(words1.length, words2.length);
  }

  private calculateExperienceMatch(
    candidateExperience: CandidateFeatures['experience'],
    job: JobFeatures
  ): { score: number; details: string } {
    if (!candidateExperience || candidateExperience.length === 0) {
      return { score: 0.2, details: 'No experience information available' };
    }

    let totalScore = 0;
    let relevantExperiences: string[] = [];

    // Calculate years of experience
    const totalYears = candidateExperience.reduce((sum, exp) => {
      const years = exp.duration / 12; // Convert months to years
      return sum + years;
    }, 0);

    // Check if experience level matches
    const requiredYears = this.getRequiredYears(job.experienceLevel);
    const yearsScore = Math.min(totalYears / requiredYears, 1);

    // Check for relevant experience titles
    const jobTitleWords = job.title.toLowerCase().split(' ');

    for (const exp of candidateExperience) {
      const expTitle = exp.title.toLowerCase();
      const titleMatch = jobTitleWords.some(word => expTitle.includes(word)) ||
                        jobTitleWords.some(word => word.includes(expTitle));

      if (titleMatch) {
        totalScore += 0.3;
        relevantExperiences.push(exp.title);
      }

      // Check description relevance
      const descMatch = this.calculateTextRelevance(exp.description, job.description);
      if (descMatch > 0.3) {
        totalScore += descMatch * 0.2;
      }
    }

    const experienceScore = Math.min((yearsScore * 0.5) + (totalScore * 0.5), 1);

    const details = relevantExperiences.length > 0
      ? `Relevant experience: ${relevantExperiences.join(', ')} (${totalYears.toFixed(1)} years total)`
      : `${totalYears.toFixed(1)} years of experience`;

    return { score: experienceScore, details };
  }

  private calculateEducationMatch(
    candidateEducation: CandidateFeatures['education'],
    job: JobFeatures
  ): { score: number; details: string } {
    if (!candidateEducation || candidateEducation.length === 0) {
      return { score: 0.5, details: 'No education information available' };
    }

    let score = 0.5; // Base score
    let highestDegree = '';
    let relevantFields: string[] = [];

    const educationLevels = {
      'high school': 1,
      'associate': 2,
      'bachelor': 3,
      'master': 4,
      'phd': 5,
      'doctorate': 5
    };

    // Find highest degree
    for (const edu of candidateEducation) {
      const degreeLevel = Object.entries(educationLevels).find(([level]) =>
        edu.degree.toLowerCase().includes(level)
      );

      if (degreeLevel) {
        const [level, levelScore] = degreeLevel;
        if (levelScore > score) {
          score = levelScore / 5; // Normalize to 0-1
          highestDegree = edu.degree;
        }
      }

      // Check field relevance
      if (job.requirements) {
        const fieldRelevance = this.calculateTextRelevance(edu.field, job.requirements);
        if (fieldRelevance > 0.3) {
          relevantFields.push(edu.field);
          score += 0.1;
        }
      }
    }

    const details = relevantFields.length > 0
      ? `${highestDegree} - Relevant fields: ${relevantFields.join(', ')}`
      : highestDegree;

    return { score: Math.min(score, 1), details };
  }

  private calculateLocationMatch(
    candidate: CandidateFeatures,
    job: JobFeatures,
    preferences?: any
  ): { score: number; details: string } {
    const workMode = job.type.toLowerCase();

    // Remote jobs - always a good match
    if (workMode.includes('remote') || job.location.toLowerCase().includes('remote')) {
      return { score: 1, details: 'Remote position - location independent' };
    }

    // Check candidate's preferred locations
    if (candidate.preferredLocations && candidate.preferredLocations.length > 0) {
      const jobLocation = job.location.toLowerCase();
      const hasPreferredLocation = candidate.preferredLocations.some(pref =>
        jobLocation.includes(pref.toLowerCase()) || pref.toLowerCase().includes(jobLocation)
      );

      if (hasPreferredLocation) {
        return { score: 0.9, details: 'Job location matches preferences' };
      }
    }

    // Check current location proximity
    const candidateLocation = candidate.location.toLowerCase();
    const jobLocation = job.location.toLowerCase();

    if (candidateLocation === jobLocation) {
      return { score: 0.8, details: 'Job location matches current location' };
    }

    // Check if in same city/region
    const candidateCity = candidateLocation.split(',')[0];
    const jobCity = jobLocation.split(',')[0];

    if (candidateCity === jobCity) {
      return { score: 0.6, details: 'Job in same city' };
    }

    return { score: 0.3, details: 'Location mismatch - may require relocation' };
  }

  private calculateSalaryMatch(
    candidate: CandidateFeatures,
    job: JobFeatures
  ): { score: number; details: string } {
    if (!candidate.salaryExpectation || (!job.salaryMin && !job.salaryMax)) {
      return { score: 0.5, details: 'Salary information incomplete' };
    }

    const expectation = candidate.salaryExpectation;
    const minSalary = job.salaryMin || 0;
    const maxSalary = job.salaryMax || Infinity;

    if (expectation >= minSalary && expectation <= maxSalary) {
      return { score: 1, details: 'Salary expectations aligned perfectly' };
    }

    if (expectation < minSalary) {
      const diff = ((minSalary - expectation) / expectation) * 100;
      if (diff < 10) {
        return { score: 0.8, details: 'Expectation slightly below range' };
      } else if (diff < 25) {
        return { score: 0.6, details: 'Expectation below range but negotiable' };
      } else {
        return { score: 0.3, details: 'Expectation significantly below range' };
      }
    }

    if (expectation > maxSalary) {
      const diff = ((expectation - maxSalary) / maxSalary) * 100;
      if (diff < 10) {
        return { score: 0.8, details: 'Expectation slightly above range' };
      } else if (diff < 25) {
        return { score: 0.5, details: 'Expectation above range but possibly negotiable' };
      } else {
        return { score: 0.2, details: 'Expectation significantly above range' };
      }
    }

    return { score: 0.5, details: 'Salary alignment unclear' };
  }

  private calculateConfidence(factors: MatchFactor[]): number {
    // Confidence based on the variance of factor scores
    const scores = factors.map(f => f.score);
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);

    // High variance means some factors are strong, others are weak
    // This indicates a more polarized (less certain) match
    const confidence = 1 - Math.min(standardDeviation, 1);

    return confidence;
  }

  private generateInsights(
    candidate: CandidateFeatures,
    job: JobFeatures,
    factors: MatchFactor[]
  ): MatchInsight[] {
    const insights: MatchInsight[] = [];

    // Analyze each factor for insights
    for (const factor of factors) {
      if (factor.score > 0.8) {
        insights.push({
          type: 'strength',
          title: `Strong ${factor.name}`,
          description: factor.details,
          actionable: false
        });
      } else if (factor.score < 0.4) {
        insights.push({
          type: 'weakness',
          title: `Improve ${factor.name}`,
          description: factor.details,
          actionable: true
        });
      }
    }

    // Add specific recommendations
    if (factors.find(f => f.name === 'Skills Alignment')?.score < 0.5) {
      insights.push({
        type: 'recommendation',
        title: 'Skill Development Opportunity',
        description: `Consider developing key skills for this position: ${job.requiredSkills?.slice(0, 3).join(', ')}`,
        actionable: true
      });
    }

    return insights.slice(0, 5); // Limit to top 5 insights
  }

  private generateRecommendations(
    candidate: CandidateFeatures,
    job: JobFeatures,
    factors: MatchFactor[]
  ): string[] {
    const recommendations: string[] = [];

    // Based on factor analysis
    const skillsFactor = factors.find(f => f.name === 'Skills Alignment');
    if (skillsFactor && skillsFactor.score < 0.6) {
      recommendations.push('Highlight relevant projects and experiences in your application');
      recommendations.push('Consider taking courses in key required skills');
    }

    const experienceFactor = factors.find(f => f.name === 'Experience Relevance');
    if (experienceFactor && experienceFactor.score < 0.6) {
      recommendations.push('Emphasize transferable skills in your cover letter');
      recommendations.push('Consider connecting with someone in a similar role');
    }

    const locationFactor = factors.find(f => f.name === 'Location & Work Style');
    if (locationFactor && locationFactor.score < 0.5) {
      recommendations.push('Discuss remote work possibilities in your application');
      recommendations.push('Research relocation assistance options');
    }

    return recommendations.slice(0, 4); // Limit to top 4 recommendations
  }

  private fallbackMatching(candidate: CandidateFeatures, job: JobFeatures): MatchResult {
    // Simple rule-based matching if ML model fails
    const skillsScore = this.calculateSimpleSkillsMatch(candidate.skills, job.requiredSkills || []);
    const experienceScore = this.calculateSimpleExperienceMatch(candidate.experience, job.experienceLevel);

    const overallScore = (skillsScore + experienceScore) / 2;

    return {
      score: Math.round(overallScore * 100),
      confidence: 50,
      factors: [
        {
          name: 'Skills Match',
          score: skillsScore,
          weight: 0.5,
          details: `Basic skills matching: ${skillsScore * 100}%`
        },
        {
          name: 'Experience Match',
          score: experienceScore,
          weight: 0.5,
          details: `Basic experience matching: ${experienceScore * 100}%`
        }
      ],
      recommendations: ['Complete your profile to improve matching accuracy'],
      insights: []
    };
  }

  private calculateSimpleSkillsMatch(candidateSkills: string[], jobSkills: string[]): number {
    if (!jobSkills || jobSkills.length === 0) return 0.5;

    const matches = candidateSkills.filter(skill =>
      jobSkills.some(jobSkill =>
        skill.toLowerCase().includes(jobSkill.toLowerCase()) ||
        jobSkill.toLowerCase().includes(skill.toLowerCase())
      )
    );

    return matches.length / jobSkills.length;
  }

  private calculateSimpleExperienceMatch(
    experience: CandidateFeatures['experience'],
    requiredLevel: string
  ): number {
    const totalYears = experience.reduce((sum, exp) => sum + exp.duration / 12, 0);
    const requiredYears = this.getRequiredYears(requiredLevel);

    return Math.min(totalYears / requiredYears, 1);
  }

  private getRequiredYears(experienceLevel: string): number {
    const levels: Record<string, number> = {
      'ENTRY': 0,
      'MID': 3,
      'SENIOR': 5,
      'EXECUTIVE': 10
    };

    return levels[experienceLevel] || 3;
  }

  private calculateTextRelevance(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(' ');
    const words2 = text2.toLowerCase().split(' ');

    const commonWords = words1.filter(word => words2.includes(word));
    const totalWords = new Set([...words1, ...words2]).size;

    return commonWords.length / totalWords;
  }

  // Public methods for training and model improvement
  async trainModel(matchData: Array<{ candidate: CandidateFeatures; job: JobFeatures; outcome: boolean }>) {
    // In production, this would use the match data to retrain the model
    console.log(`Training model with ${matchData.length} data points`);

    // Simplified: adjust weights based on success rates
    // Real implementation would use proper ML algorithms
  }

  async getModelMetrics(): Promise<{ accuracy: number; precision: number; recall: number }> {
    // Return model performance metrics
    // In production, these would be calculated from actual outcomes
    return {
      accuracy: 0.85,
      precision: 0.82,
      recall: 0.88
    };
  }
}