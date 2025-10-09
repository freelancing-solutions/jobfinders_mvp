/**
 * Matching Core Service
 *
 * Core matching algorithms and utilities for job-candidate matching,
 * skill matching, and recommendation systems.
 */

import { Resume } from '@/types/resume';
import { Job } from '@/types/job';

export interface MatchingScore {
  overall: number;
  skills: number;
  experience: number;
  education: number;
  location: number;
  salary: number;
}

export interface MatchingResult {
  candidateId: string;
  jobId: string;
  score: MatchingScore;
  reasons: string[];
  confidence: number;
  timestamp: Date;
}

export interface SkillMatch {
  skill: string;
  required: boolean;
  candidateLevel: number;
  requiredLevel: number;
  match: boolean;
  weight: number;
}

export interface ExperienceMatch {
  yearsRequired: number;
  yearsCandidate: number;
  industryMatch: boolean;
  roleMatch: boolean;
  score: number;
}

export interface LocationMatch {
  distance: number;
  remoteAllowed: boolean;
  relocateWilling: boolean;
  score: number;
}

export class MatchingCore {
  private static readonly WEIGHTS = {
    skills: 0.4,
    experience: 0.3,
    education: 0.15,
    location: 0.1,
    salary: 0.05
  };

  /**
   * Calculate overall matching score between candidate and job
   */
  static calculateMatch(resume: Resume, job: Job): MatchingResult {
    const skillsScore = this.calculateSkillsMatch(resume, job);
    const experienceScore = this.calculateExperienceMatch(resume, job);
    const educationScore = this.calculateEducationMatch(resume, job);
    const locationScore = this.calculateLocationMatch(resume, job);
    const salaryScore = this.calculateSalaryMatch(resume, job);

    const overall = 
      skillsScore * this.WEIGHTS.skills +
      experienceScore * this.WEIGHTS.experience +
      educationScore * this.WEIGHTS.education +
      locationScore * this.WEIGHTS.location +
      salaryScore * this.WEIGHTS.salary;

    const score: MatchingScore = {
      overall: Math.round(overall * 100) / 100,
      skills: Math.round(skillsScore * 100) / 100,
      experience: Math.round(experienceScore * 100) / 100,
      education: Math.round(educationScore * 100) / 100,
      location: Math.round(locationScore * 100) / 100,
      salary: Math.round(salaryScore * 100) / 100
    };

    const reasons = this.generateMatchReasons(score, resume, job);
    const confidence = this.calculateConfidence(score);

    return {
      candidateId: resume.id || '',
      jobId: job.id || '',
      score,
      reasons,
      confidence,
      timestamp: new Date()
    };
  }

  /**
   * Calculate skills matching score
   */
  private static calculateSkillsMatch(resume: Resume, job: Job): number {
    if (!job.requirements?.skills || job.requirements.skills.length === 0) {
      return 1.0; // No specific skills required
    }

    const candidateSkills = resume.skills?.map(s => s.name.toLowerCase()) || [];
    const requiredSkills = job.requirements.skills.map(s => s.toLowerCase());
    
    const matchedSkills = requiredSkills.filter(skill => 
      candidateSkills.some(candidateSkill => 
        candidateSkill.includes(skill) || skill.includes(candidateSkill)
      )
    );

    return matchedSkills.length / requiredSkills.length;
  }

  /**
   * Calculate experience matching score
   */
  private static calculateExperienceMatch(resume: Resume, job: Job): number {
    const candidateYears = this.calculateTotalExperience(resume);
    const requiredYears = job.requirements?.experience?.years || 0;

    if (requiredYears === 0) {
      return 1.0; // No specific experience required
    }

    if (candidateYears >= requiredYears) {
      return 1.0;
    }

    // Partial credit for having some experience
    return Math.max(0, candidateYears / requiredYears);
  }

  /**
   * Calculate education matching score
   */
  private static calculateEducationMatch(resume: Resume, job: Job): number {
    if (!job.requirements?.education) {
      return 1.0; // No specific education required
    }

    const candidateEducation = resume.education || [];
    const requiredLevel = job.requirements.education.level;

    // Simple education level matching
    const educationLevels = {
      'high school': 1,
      'associate': 2,
      'bachelor': 3,
      'master': 4,
      'doctorate': 5,
      'phd': 5
    };

    const candidateLevel = Math.max(
      ...candidateEducation.map(edu => 
        educationLevels[edu.degree?.toLowerCase() as keyof typeof educationLevels] || 0
      )
    );

    const requiredLevelNum = educationLevels[requiredLevel?.toLowerCase() as keyof typeof educationLevels] || 0;

    if (candidateLevel >= requiredLevelNum) {
      return 1.0;
    }

    return Math.max(0, candidateLevel / requiredLevelNum);
  }

  /**
   * Calculate location matching score
   */
  private static calculateLocationMatch(resume: Resume, job: Job): number {
    // Simplified location matching - in reality would use geolocation
    if (job.remote || !job.location) {
      return 1.0; // Remote or no location specified
    }

    if (!resume.personalInfo?.location) {
      return 0.5; // No location info from candidate
    }

    // Simple string matching for now
    const candidateLocation = resume.personalInfo.location.toLowerCase();
    const jobLocation = job.location.toLowerCase();

    if (candidateLocation.includes(jobLocation) || jobLocation.includes(candidateLocation)) {
      return 1.0;
    }

    return 0.3; // Different locations but might be willing to relocate
  }

  /**
   * Calculate salary matching score
   */
  private static calculateSalaryMatch(resume: Resume, job: Job): number {
    if (!job.salary?.min || !resume.expectedSalary) {
      return 1.0; // No salary requirements specified
    }

    const candidateExpected = resume.expectedSalary;
    const jobMin = job.salary.min;
    const jobMax = job.salary.max || jobMin * 1.2;

    if (candidateExpected >= jobMin && candidateExpected <= jobMax) {
      return 1.0; // Perfect match
    }

    if (candidateExpected < jobMin) {
      // Candidate expects less - good for employer
      return 0.8;
    }

    // Candidate expects more - calculate how much over
    const overAmount = candidateExpected - jobMax;
    const tolerance = jobMax * 0.2; // 20% tolerance

    if (overAmount <= tolerance) {
      return 0.6;
    }

    return 0.2; // Significantly over budget
  }

  /**
   * Calculate total years of experience from resume
   */
  private static calculateTotalExperience(resume: Resume): number {
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

    return totalMonths / 12; // Convert to years
  }

  /**
   * Generate human-readable match reasons
   */
  private static generateMatchReasons(score: MatchingScore, resume: Resume, job: Job): string[] {
    const reasons: string[] = [];

    if (score.skills >= 0.8) {
      reasons.push('Strong skills match');
    } else if (score.skills >= 0.6) {
      reasons.push('Good skills alignment');
    } else if (score.skills < 0.4) {
      reasons.push('Limited skills match');
    }

    if (score.experience >= 0.8) {
      reasons.push('Excellent experience level');
    } else if (score.experience >= 0.6) {
      reasons.push('Adequate experience');
    } else if (score.experience < 0.4) {
      reasons.push('Below required experience level');
    }

    if (score.education >= 0.8) {
      reasons.push('Education requirements met');
    }

    if (score.location >= 0.8) {
      reasons.push('Good location match');
    } else if (score.location < 0.5) {
      reasons.push('Location may be a challenge');
    }

    if (score.salary >= 0.8) {
      reasons.push('Salary expectations align');
    } else if (score.salary < 0.5) {
      reasons.push('Salary expectations may not align');
    }

    return reasons;
  }

  /**
   * Calculate confidence level in the match
   */
  private static calculateConfidence(score: MatchingScore): number {
    // Higher confidence when scores are more extreme (either very high or very low)
    const variance = this.calculateVariance([
      score.skills,
      score.experience,
      score.education,
      score.location,
      score.salary
    ]);

    // Lower variance means more consistent scores across categories
    const consistencyBonus = Math.max(0, (0.1 - variance) * 5);
    
    // Base confidence on overall score
    let confidence = score.overall;
    
    // Add consistency bonus
    confidence += consistencyBonus;
    
    // Ensure confidence is between 0 and 1
    return Math.min(1, Math.max(0, confidence));
  }

  /**
   * Calculate variance of an array of numbers
   */
  private static calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
  }
}

export default MatchingCore;