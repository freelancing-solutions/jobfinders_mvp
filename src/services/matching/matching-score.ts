/**
 * Matching Score Service
 *
 * Provides scoring algorithms and utilities for calculating
 * compatibility scores between candidates and job requirements.
 */

import { Resume } from '@/types/resume';
import { Job } from '@/types/job';

export interface ScoreBreakdown {
  skills: number;
  experience: number;
  education: number;
  location: number;
  salary: number;
  overall: number;
}

export interface MatchingFactors {
  skillsWeight: number;
  experienceWeight: number;
  educationWeight: number;
  locationWeight: number;
  salaryWeight: number;
}

export interface ScoreResult {
  score: number;
  breakdown: ScoreBreakdown;
  confidence: number;
  reasons: string[];
  timestamp: Date;
}

export class MatchingScore {
  private static readonly DEFAULT_WEIGHTS: MatchingFactors = {
    skillsWeight: 0.4,
    experienceWeight: 0.3,
    educationWeight: 0.15,
    locationWeight: 0.1,
    salaryWeight: 0.05
  };

  /**
   * Calculate comprehensive matching score between candidate and job
   */
  static calculate(
    resume: Resume,
    job: Job,
    weights: MatchingFactors = this.DEFAULT_WEIGHTS
  ): ScoreResult {
    const breakdown = this.calculateBreakdown(resume, job);
    
    const overall = 
      breakdown.skills * weights.skillsWeight +
      breakdown.experience * weights.experienceWeight +
      breakdown.education * weights.educationWeight +
      breakdown.location * weights.locationWeight +
      breakdown.salary * weights.salaryWeight;

    const confidence = this.calculateConfidence(breakdown);
    const reasons = this.generateReasons(breakdown);

    return {
      score: Math.round(overall * 100) / 100,
      breakdown,
      confidence,
      reasons,
      timestamp: new Date()
    };
  }

  /**
   * Calculate detailed score breakdown
   */
  private static calculateBreakdown(resume: Resume, job: Job): ScoreBreakdown {
    return {
      skills: this.calculateSkillsScore(resume, job),
      experience: this.calculateExperienceScore(resume, job),
      education: this.calculateEducationScore(resume, job),
      location: this.calculateLocationScore(resume, job),
      salary: this.calculateSalaryScore(resume, job),
      overall: 0 // Will be calculated in main function
    };
  }

  /**
   * Calculate skills matching score (0-1)
   */
  private static calculateSkillsScore(resume: Resume, job: Job): number {
    if (!job.requirements?.skills || job.requirements.skills.length === 0) {
      return 1.0;
    }

    const candidateSkills = (resume.skills || []).map(s => s.name.toLowerCase());
    const requiredSkills = job.requirements.skills.map(s => s.toLowerCase());
    
    let matchedCount = 0;
    let totalWeight = 0;

    for (const requiredSkill of requiredSkills) {
      totalWeight += 1;
      
      // Check for exact or partial matches
      const hasMatch = candidateSkills.some(candidateSkill => {
        return candidateSkill.includes(requiredSkill) || 
               requiredSkill.includes(candidateSkill) ||
               this.calculateStringSimilarity(candidateSkill, requiredSkill) > 0.8;
      });

      if (hasMatch) {
        matchedCount += 1;
      }
    }

    return totalWeight > 0 ? matchedCount / totalWeight : 1.0;
  }

  /**
   * Calculate experience matching score (0-1)
   */
  private static calculateExperienceScore(resume: Resume, job: Job): number {
    const candidateYears = this.getTotalExperienceYears(resume);
    const requiredYears = job.requirements?.experience?.years || 0;

    if (requiredYears === 0) {
      return 1.0;
    }

    if (candidateYears >= requiredYears) {
      // Bonus for exceeding requirements, but cap at 1.0
      return Math.min(1.0, candidateYears / requiredYears);
    }

    // Partial credit for having some experience
    return Math.max(0.1, candidateYears / requiredYears);
  }

  /**
   * Calculate education matching score (0-1)
   */
  private static calculateEducationScore(resume: Resume, job: Job): number {
    if (!job.requirements?.education?.level) {
      return 1.0;
    }

    const educationLevels = {
      'high school': 1,
      'diploma': 2,
      'associate': 3,
      'bachelor': 4,
      'master': 5,
      'doctorate': 6,
      'phd': 6
    };

    const candidateEducation = resume.education || [];
    const candidateLevel = Math.max(
      0,
      ...candidateEducation.map(edu => 
        educationLevels[edu.degree?.toLowerCase() as keyof typeof educationLevels] || 0
      )
    );

    const requiredLevel = educationLevels[
      job.requirements.education.level.toLowerCase() as keyof typeof educationLevels
    ] || 0;

    if (candidateLevel >= requiredLevel) {
      return 1.0;
    }

    // Partial credit based on education level achieved
    return Math.max(0.2, candidateLevel / requiredLevel);
  }

  /**
   * Calculate location matching score (0-1)
   */
  private static calculateLocationScore(resume: Resume, job: Job): number {
    // Remote work gets perfect score
    if (job.remote) {
      return 1.0;
    }

    if (!job.location || !resume.personalInfo?.location) {
      return 0.5; // Neutral score when location info is missing
    }

    const candidateLocation = resume.personalInfo.location.toLowerCase();
    const jobLocation = job.location.toLowerCase();

    // Exact location match
    if (candidateLocation === jobLocation) {
      return 1.0;
    }

    // City/state matching
    if (candidateLocation.includes(jobLocation) || jobLocation.includes(candidateLocation)) {
      return 0.8;
    }

    // Same state/region (simplified check)
    const candidateParts = candidateLocation.split(',').map(p => p.trim());
    const jobParts = jobLocation.split(',').map(p => p.trim());
    
    if (candidateParts.length > 1 && jobParts.length > 1) {
      if (candidateParts[candidateParts.length - 1] === jobParts[jobParts.length - 1]) {
        return 0.6; // Same state
      }
    }

    return 0.3; // Different locations, but candidate might relocate
  }

  /**
   * Calculate salary matching score (0-1)
   */
  private static calculateSalaryScore(resume: Resume, job: Job): number {
    if (!job.salary?.min || !resume.expectedSalary) {
      return 1.0; // No salary constraints
    }

    const candidateExpected = resume.expectedSalary;
    const jobMin = job.salary.min;
    const jobMax = job.salary.max || jobMin * 1.3;

    // Perfect match within range
    if (candidateExpected >= jobMin && candidateExpected <= jobMax) {
      return 1.0;
    }

    // Candidate expects less (good for employer)
    if (candidateExpected < jobMin) {
      const difference = jobMin - candidateExpected;
      const tolerance = jobMin * 0.2;
      
      if (difference <= tolerance) {
        return 0.9;
      }
      return 0.7; // Significantly under expectations
    }

    // Candidate expects more
    const overAmount = candidateExpected - jobMax;
    const tolerance = jobMax * 0.15;

    if (overAmount <= tolerance) {
      return 0.6; // Slightly over budget
    }

    return 0.2; // Significantly over budget
  }

  /**
   * Calculate total years of experience from resume
   */
  private static getTotalExperienceYears(resume: Resume): number {
    if (!resume.experience || resume.experience.length === 0) {
      return 0;
    }

    let totalMonths = 0;
    const now = new Date();

    for (const exp of resume.experience) {
      const startDate = new Date(exp.startDate);
      const endDate = exp.endDate ? new Date(exp.endDate) : now;
      
      const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                    (endDate.getMonth() - startDate.getMonth());
      
      totalMonths += Math.max(0, months);
    }

    return Math.round((totalMonths / 12) * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Calculate string similarity using simple algorithm
   */
  private static calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) {
      return 1.0;
    }

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Calculate confidence in the matching score
   */
  private static calculateConfidence(breakdown: ScoreBreakdown): number {
    const scores = [
      breakdown.skills,
      breakdown.experience,
      breakdown.education,
      breakdown.location,
      breakdown.salary
    ];

    // Calculate variance to measure consistency
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    
    // Lower variance means more consistent scores = higher confidence
    const consistencyScore = Math.max(0, 1 - variance);
    
    // Higher overall scores also increase confidence
    const averageScore = mean;
    
    // Combine consistency and average score
    return Math.round((consistencyScore * 0.4 + averageScore * 0.6) * 100) / 100;
  }

  /**
   * Generate human-readable reasons for the score
   */
  private static generateReasons(breakdown: ScoreBreakdown): string[] {
    const reasons: string[] = [];

    if (breakdown.skills >= 0.8) {
      reasons.push('Excellent skills match');
    } else if (breakdown.skills >= 0.6) {
      reasons.push('Good skills alignment');
    } else if (breakdown.skills < 0.4) {
      reasons.push('Skills gap identified');
    }

    if (breakdown.experience >= 0.8) {
      reasons.push('Strong experience level');
    } else if (breakdown.experience >= 0.6) {
      reasons.push('Adequate experience');
    } else if (breakdown.experience < 0.4) {
      reasons.push('Limited relevant experience');
    }

    if (breakdown.education >= 0.8) {
      reasons.push('Education requirements met');
    } else if (breakdown.education < 0.5) {
      reasons.push('Education level below requirements');
    }

    if (breakdown.location >= 0.8) {
      reasons.push('Excellent location match');
    } else if (breakdown.location < 0.5) {
      reasons.push('Location may require consideration');
    }

    if (breakdown.salary >= 0.8) {
      reasons.push('Salary expectations align well');
    } else if (breakdown.salary < 0.5) {
      reasons.push('Salary expectations may need discussion');
    }

    return reasons;
  }

  /**
   * Batch calculate scores for multiple candidates
   */
  static batchCalculate(
    resumes: Resume[],
    job: Job,
    weights?: MatchingFactors
  ): ScoreResult[] {
    return resumes.map(resume => this.calculate(resume, job, weights));
  }

  /**
   * Find best matches from a list of candidates
   */
  static findBestMatches(
    resumes: Resume[],
    job: Job,
    limit: number = 10,
    minScore: number = 0.5
  ): ScoreResult[] {
    const scores = this.batchCalculate(resumes, job);
    
    return scores
      .filter(result => result.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}

export default MatchingScore;