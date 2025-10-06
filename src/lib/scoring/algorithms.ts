/**
 * Scoring Algorithms
 * Individual algorithms for calculating different aspects of matching scores
 */

import type {
  CandidateProfile,
  JobProfile,
  Skill,
  WorkExperience,
  Education,
  LocationInfo,
  JobRequirements,
  EmployerPreferences,
  JobPreferences,
  AvailabilityInfo
} from '@/types/profiles';

import { ExperienceLevel, SkillLevel, EducationLevel } from '@/types/profiles';

/**
 * Skills matching algorithm
 */
export class SkillsMatcher {
  /**
   * Calculate skills match score between candidate and job
   */
  static calculateSkillsMatch(
    candidateSkills: Skill[],
    jobSkills: Array<{
      name: string;
      level: string;
      required: boolean;
      importance: number;
      yearsExperience?: number;
    }>
  ): number {
    if (!candidateSkills.length || !jobSkills.length) return 0;

    let totalScore = 0;
    let totalWeight = 0;

    // Create maps for faster lookup
    const candidateSkillMap = new Map(
      candidateSkills.map(skill => [skill.name.toLowerCase().trim(), skill])
    );

    for (const jobSkill of jobSkills) {
      const weight = jobSkill.importance || 3; // Default importance if not specified
      totalWeight += weight;

      const candidateSkill = candidateSkillMap.get(jobSkill.name.toLowerCase().trim());
      if (candidateSkill) {
        let skillScore = 0;

        // Exact match bonus
        if (candidateSkill.name.toLowerCase() === jobSkill.name.toLowerCase()) {
          skillScore += 0.3;
        }

        // Level matching
        const levelMatch = this.calculateLevelMatch(
          candidateSkill.level,
          jobSkill.level
        );
        skillScore += levelMatch * 0.7;

        // Experience matching (if specified)
        if (jobSkill.yearsExperience && candidateSkill.experience) {
          const expMatch = this.calculateExperienceMatch(
            candidateSkill.experience,
            jobSkill.yearsExperience
          );
          skillScore += expMatch * 0.2;
        }

        // Required skill bonus
        if (jobSkill.required) {
          skillScore += 0.2;
        }

        totalScore += skillScore * weight;
      }
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * Calculate skill level compatibility
   */
  private static calculateLevelMatch(
    candidateLevel: SkillLevel,
    requiredLevel: string
  ): number {
    const levelHierarchy = {
      [SkillLevel.BEGINNER]: 1,
      [SkillLevel.INTERMEDIATE]: 2,
      [SkillLevel.ADVANCED]: 3,
      [SkillLevel.EXPERT]: 4,
      [SkillLevel.MASTER]: 5
    };

    const requiredLevelMap: { [key: string]: number } = {
      'beginner': 1,
      'intermediate': 2,
      'advanced': 3,
      'expert': 4,
      'master': 5
    };

    const candidateScore = levelHierarchy[candidateLevel] || 0;
    const requiredScore = requiredLevelMap[requiredLevel.toLowerCase()] || 0;

    if (candidateScore >= requiredScore) {
      return 1.0; // Meets or exceeds requirement
    }

    // Partial credit for close matches
    const diff = requiredScore - candidateScore;
    if (diff <= 1) return 0.7; // One level below
    if (diff <= 2) return 0.4; // Two levels below
    return 0.1; // Much lower level
  }

  /**
   * Calculate experience compatibility
   */
  private static calculateExperienceMatch(
    candidateYears: number,
    requiredYears: number
  ): number {
    if (candidateYears >= requiredYears) {
      return 1.0; // Meets or exceeds requirement
    }

    // Partial credit based on how close they are
    const ratio = candidateYears / requiredYears;
    if (ratio >= 0.8) return 0.8;
    if (ratio >= 0.6) return 0.6;
    if (ratio >= 0.4) return 0.4;
    if (ratio >= 0.2) return 0.2;
    return 0.1;
  }
}

/**
 * Experience matching algorithm
 */
export class ExperienceMatcher {
  /**
   * Calculate experience match score
   */
  static calculateExperienceMatch(
    candidateExperience: WorkExperience[],
    jobRequirements: Array<{
      title: string;
      level: string;
      yearsRequired: number;
      industry?: string;
      companyType?: string;
      required: boolean;
    }>
  ): number {
    if (!candidateExperience.length || !jobRequirements.length) return 0;

    let totalScore = 0;
    let totalWeight = 0;

    const expByRecency = candidateExperience.sort((a, b) =>
      (b.endDate || new Date()).getTime() - (a.endDate || new Date()).getTime()
    );

    for (const jobReq of jobRequirements) {
      const weight = jobReq.required ? 2 : 1; // Required experience gets double weight
      totalWeight += weight;

      const bestMatch = this.findBestExperienceMatch(expByRecency, jobReq);
      if (bestMatch) {
        let matchScore = 0;

        // Title similarity
        const titleSimilarity = this.calculateTitleSimilarity(bestMatch.position, jobReq.title);
        matchScore += titleSimilarity * 0.4;

        // Level matching
        const levelMatch = this.calculateLevelMatch(bestMatch, jobReq);
        matchScore += levelMatch * 0.3;

        // Duration matching
        const durationMatch = this.calculateDurationMatch(bestMatch, jobReq);
        matchScore += durationMatch * 0.2;

        // Industry alignment
        if (jobReq.industry) {
          const industryMatch = this.calculateIndustryMatch(bestMatch, jobReq.industry);
          matchScore += industryMatch * 0.1;
        }

        totalScore += matchScore * weight;
      }
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * Find the best matching experience for a job requirement
   */
  private static findBestExperienceMatch(
    experiences: WorkExperience[],
    jobReq: any
  ): WorkExperience | null {
    let bestMatch = null;
    let bestScore = 0;

    for (const exp of experiences) {
      let score = 0;

      // Title matching
      score += this.calculateTitleSimilarity(exp.position, jobReq.title) * 40;

      // Level matching
      score += this.calculateLevelMatch(exp, jobReq) * 30;

      // Duration matching
      score += this.calculateDurationMatch(exp, jobReq) * 30;

      if (score > bestScore) {
        bestScore = score;
        bestMatch = exp;
      }
    }

    return bestScore;
  }

  /**
   * Calculate title similarity using text similarity
   */
  private static calculateTitleSimilarity(candidateTitle: string, jobTitle: string): number {
    const candidate = candidateTitle.toLowerCase();
    const job = jobTitle.toLowerCase();

    // Exact match
    if (candidate === job) return 1.0;

    // Check for exact word matches
    const candidateWords = candidate.split(/\s+/);
    const jobWords = job.split(/\s+/);

    const commonWords = candidateWords.filter(word => jobWords.includes(word));
    const maxWords = Math.max(candidateWords.length, jobWords.length);

    if (commonWords.length === 0) return 0;

    // Jaccard similarity
    const intersection = commonWords.length;
    const union = candidateWords.length + jobWords.length - intersection;

    return intersection / union;
  }

  /**
   * Calculate experience level match
   */
  private static calculateLevelMatch(
    experience: WorkExperience,
    jobReq: any
  ): number {
    const expLevel = this.guessExperienceLevel(experience);
    const reqLevel = jobReq.level.toLowerCase();

    if (expLevel === reqLevel) return 1.0;

    // Adjacent levels get partial credit
    const levels = ['entry', 'junior', 'mid', 'senior', 'lead', 'manager', 'director', 'executive'];
    const expIndex = levels.indexOf(expLevel);
    const reqIndex = levels.indexOf(reqLevel);

    if (expIndex === -1 || reqIndex === -1) return 0.5;

    const diff = Math.abs(expIndex - reqIndex);
    if (diff <= 1) return 0.8;
    if (diff <= 2) return 0.6;
    if (diff <= 3) return 0.4;
    return 0.2;
  }

  /**
   * Calculate experience duration match
   */
  private static calculateDurationMatch(
    experience: WorkExperience,
    jobReq: any
  ): number {
    const expDuration = this.calculateExperienceDuration(experience);
    const reqDuration = jobReq.yearsRequired;

    if (expDuration >= reqDuration) {
      return 1.0;
    }

    const ratio = expDuration / reqDuration;
    if (ratio >= 0.8) return 0.8;
    if (ratio >= 0.6) return 0.6;
    if (ratio >= 0.4) return 0.4;
    if (ratio >= 0.2) return 0.2;
    return 0.1;
  }

  /**
   * Calculate industry match
   */
  private static calculateIndustryMatch(
    experience: WorkExperience,
    industry: string
  ): number {
    // Look for industry keywords in company or position
    const text = `${experience.company} ${experience.position}`.toLowerCase();
    const industryLower = industry.toLowerCase();

    if (text.includes(industryLower)) return 1.0;

    // Common industry synonyms
    const synonyms: { [key: string]: string[] } = {
      'technology': ['tech', 'software', 'it'],
      'finance': ['financial', 'banking', 'investment'],
      'healthcare': ['medical', 'health'],
      'education': ['school', 'university', 'academic'],
      'manufacturing': ['factory', 'production']
    };

    for (const [key, values] of Object.entries(synonyms)) {
      if (key === industryLower) {
        for (const synonym of values) {
          if (text.includes(synonym)) return 0.8;
        }
      }
    }

    return 0;
  }

  /**
   * Guess experience level from position and duration
   */
  private static guessExperienceLevel(experience: WorkExperience): string {
    const position = experience.position.toLowerCase();
    const duration = this.calculateExperienceDuration(experience);

    // Level heuristics based on position title
    const levelKeywords = {
      'entry': ['intern', 'trainee', 'junior trainee', 'associate'],
      'junior': ['junior', 'entry level', 'jr', 'associate'],
      'mid': ['mid-level', 'mid', 'regular'],
      'senior': ['senior', 'sr', 'lead developer', 'principal'],
      'lead': ['lead', 'team lead', 'lead developer'],
      'manager': ['manager', 'supervisor', 'team manager'],
      'director': ['director', 'head', 'department head'],
      'executive': ['ceo', 'cto', 'vp', 'vice president']
    };

    for (const [level, keywords] of Object.entries(levelKeywords)) {
      for (const keyword of keywords) {
        if (position.includes(keyword)) {
          return level;
        }
      }
    }

    // Duration heuristics
    if (duration < 1) return 'entry';
    if (duration < 3) return 'junior';
    if (duration < 5) return 'mid';
    if (duration < 8) return 'senior';
    if (duration < 12) return 'lead';
    if (duration < 15) return 'manager';
    return 'executive';
  }

  /**
   * Calculate total experience duration
   */
  private static calculateExperienceDuration(experience: WorkExperience): number {
    const startDate = new Date(experience.startDate);
    const endDate = experience.isCurrent ? new Date() : new Date(experience.endDate || startDate);

    const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
                      (endDate.getMonth() - startDate.getMonth());

    return monthsDiff / 12;
  }
}

/**
 * Education matching algorithm
 */
export class EducationMatcher {
  /**
   * Calculate education match score
   */
  static calculateEducationMatch(
    candidateEducation: Education[],
    jobRequirements: Array<{
      level: string;
      field?: string;
      specialization?: string;
      required: boolean;
    }>
  ): number {
    if (!candidateEducation.length || !jobRequirements.length) return 1; // No requirements = perfect match

    let totalScore = 0;
    let totalWeight = 0;

    for (const jobReq of jobRequirements) {
      const weight = jobReq.required ? 2 : 1; // Required education gets double weight
      totalWeight += weight;

      const bestMatch = this.findBestEducationMatch(candidateEducation, jobReq);
      if (bestMatch) {
        let matchScore = 0;

        // Level matching
        const levelMatch = this.calculateLevelMatch(bestMatch.level, jobReq.level);
        matchScore += levelMatch * 0.5;

        // Field matching
        if (jobReq.field && bestMatch.field) {
          const fieldMatch = this.calculateFieldMatch(bestMatch.field, jobReq.field);
          matchScore += fieldMatch * 0.4;
        }

        // Specialization matching
        if (jobReq.specialization && bestMatch.field && bestMatch.field.includes(jobReq.specialization)) {
          matchScore += 0.1;
        }

        totalScore += matchScore * weight;
      } else if (!jobReq.required) {
        // Partial credit for having any education
        totalScore += 0.3 * weight;
      }
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * Find the best matching education for a job requirement
   */
  private static findBestEducationMatch(
    education: Education[],
    jobReq: any
  ): Education | null {
    let bestMatch = null;
    let bestScore = 0;

    for (const edu of education) {
      let score = 0;

      // Level matching
      score += this.calculateLevelMatch(edu.level, jobReq.level) * 0.5;

      // Field matching
      if (jobReq.field && edu.field) {
        score += this.calculateFieldMatch(edu.field, jobReq.field) * 0.4;
      }

      // Recent education bonus
      const recencyBonus = this.calculateRecencyBonus(edu);
      score += recencyBonus * 0.1;

      if (score > bestScore) {
        bestScore = score;
        bestMatch = edu;
      }
    }

    return bestMatch;
  }

  /**
   * Calculate education level match
   */
  private static calculateLevelMatch(candidateLevel: string, requiredLevel: string): number {
    const levelHierarchy = {
      [EducationLevel.HIGH_SCHOOL]: 1,
      [EducationLevel.ASSOCIATE]: 2,
      [EducationLevel.CERTIFICATE]: 2,
      [EducationLevel.DIPLOMA]: 2,
      [EducationLevel.BACHELOR]: 3,
      [EducationLevel.PROFESSIONAL]: 3,
      [EducationLevel.MASTER]: 4,
      [EducationLevel.PHD]: 5,
      [EducationLevel.POSTDOCTORAL]: 6
    };

    const candidateScore = levelHierarchy[candidateLevel as EducationLevel] || 0;
    const requiredScore = levelHierarchy[requiredLevel as EducationLevel] || 0;

    if (candidateScore >= requiredScore) {
      return 1.0;
    }

    // Partial credit for close matches
    const diff = requiredScore - candidateScore;
    if (diff <= 1) return 0.8;
    if (diff <= 2) return 0.6;
    if (diff <= 3) return 0.4;
    return 0.2;
  }

  /**
   * Calculate field of study match
   */
  private static calculateFieldMatch(candidateField: string, requiredField: string): number {
    const candidate = candidateField.toLowerCase().trim();
    const required = requiredField.toLowerCase().trim();

    if (candidate === required) return 1.0;

    // Check for substring matches
    if (candidate.includes(required) || required.includes(candidate)) {
      return 0.8;
    }

    // Check for common field variations
    const fieldVariations: { [key: string]: string[] } = {
      'computer science': ['cs', 'computer engineering', 'software engineering'],
      'business administration': ['business', 'mba', 'management'],
      'information technology': ['it', 'information systems'],
      'mechanical engineering': ['mechanical'],
      'electrical engineering': ['electrical'],
      'civil engineering': ['civil']
    };

    for (const [key, variations] of Object.entries(fieldVariations)) {
      if (key === required) {
        for (const variation of variations) {
          if (candidate.includes(variation) || variation.includes(candidate)) {
            return 0.7;
          }
        }
      }
    }

    return 0.3; // Minimal credit for having some education
  }

  /**
   * Calculate recency bonus for recent education
   */
  private static calculateRecencyBonus(education: Education): number {
    const endDate = education.isCurrent ? new Date() : new Date(education.endDate || education.startDate);
    const now = new Date();
    const monthsDiff = (now.getFullYear() - endDate.getFullYear()) * 12 + (now.getMonth() - endDate.getMonth());

    if (monthsDiff <= 12) return 1.0;    // Within last year
    if (monthsDiff <= 36) return 0.8;    // Within last 3 years
    if (monthsDiff <= 60) return 0.6;    // Within last 5 years
    if (monthsDiff <= 120) return 0.4;   // Within last 10 years
    return 0.2;                      // Older education
  }
}

/**
 * Location matching algorithm
 */
export class LocationMatcher {
  /**
   * Calculate location match score
   */
  static calculateLocationMatch(
    candidateLocation: LocationInfo,
    jobLocation: LocationInfo,
    jobPreferences: any
  ): number {
    // Exact location match
    if (candidateLocation.country === jobLocation.country &&
        candidateLocation.city === jobLocation.city) {
      return 1.0;
    }

    // Country match (different cities)
    if (candidateLocation.country === jobLocation.country) {
      return 0.8;
    }

    // Remote work compatibility
    if (jobLocation.isRemote && this.isRemoteWorkCompatible(candidateLocation, jobPreferences)) {
      return 0.9;
    }

    // Relocation willingness
    if (candidateLocation.relocationWilling) {
      return 0.7;
    }

    return 0.2; // Poor location match
  }

  /**
   * Check if candidate is compatible with remote work
   */
  private static isRemoteWorkCompatible(
    candidateLocation: LocationInfo,
    jobPreferences: any
  ): boolean {
    // Candidate willing to work remotely
    if (candidateLocation.isRemote) return true;

    // Job preferences allow remote work
    if (jobPreferences && jobPreferences.remoteWorkPreference) {
      return ['remote_only', 'flexible', 'hybrid'].includes(jobPreferences.remoteWorkPreference);
    }

    return false;
  }
}

/**
 * Preferences matching algorithm
 */
export class PreferencesMatcher {
  /**
   * Calculate preferences match score
   */
  static calculatePreferencesMatch(
    candidatePreferences: JobPreferences,
    jobPreferences: EmployerPreferences
  ): number {
    let score = 0;
    let factors = 0;

    // Work type compatibility
    if (candidatePreferences.workType.length > 0 && jobPreferences.workType.length > 0) {
      const workTypeMatch = this.calculateWorkTypeMatch(
        candidatePreferences.workType,
        jobPreferences.workType
      );
      score += workTypeMatch * 0.3;
      factors++;
    }

    // Team size compatibility
    const teamSizeMatch = this.calculateTeamSizeMatch(
      candidatePreferences.teamSize,
      jobPreferences.teamStructure.size
    );
    score += teamSizeMatch * 0.2;
    factors++;

    // Work schedule compatibility
    const scheduleMatch = this.calculateScheduleMatch(
      candidatePreferences.workSchedule,
      jobPreferences.workEnvironment.schedule
    );
    score += scheduleMatch * 0.2;
    factors++;

    // Travel requirement compatibility
    const travelMatch = this.calculateTravelMatch(
      candidatePreferences.travelRequirement,
      jobPreferences.teamStructure.travelRequirement
    );
    score += travelMatch * 0.2;
    factors++;

    // Work environment compatibility
    const envMatch = this.calculateEnvironmentMatch(
      candidatePreferences,
      jobPreferences.workEnvironment
    );
    score += envMatch * 0.1;
    factors++;

    return factors > 0 ? score / factors : 0;
  }

  /**
   * Calculate work type match
   */
  private static calculateWorkTypeMatch(
    candidateTypes: string[],
    jobTypes: string[]
  ): number {
    if (!candidateTypes.length || !jobTypes.length) return 0.5;

    // Exact match bonus
    const exactMatches = candidateTypes.filter(type => jobTypes.includes(type)).length;
    if (exactMatches > 0 && exactMatches === candidateTypes.length) {
      return 1.0;
    }

    // Partial match based on flexibility
    const flexibilityScore = this.calculateFlexibilityScore(candidateTypes, jobTypes);
    return flexibilityScore * 0.8;
  }

  /**
   * Calculate team size match
   */
  private static calculateTeamSizeMatch(
    candidateSize: string,
    jobSize: string
  ): number {
    const sizes = ['solo', 'small', 'medium', 'large', 'very_large'];
    const candidateIndex = sizes.indexOf(candidateSize);
    const jobIndex = sizes.indexOf(jobSize);

    if (candidateIndex === -1 || jobIndex === -1) return 0.5;

    const diff = Math.abs(candidateIndex - jobIndex);
    if (diff === 0) return 1.0;
    if (diff === 1) return 0.8;
    if (diff === 2) return 0.6;
    return 0.4;
  }

  /**
   * Calculate schedule match
   */
  private static calculateScheduleMatch(
    candidateSchedule: string,
    jobSchedule: string
  ): number {
    if (candidateSchedule === jobSchedule) return 1.0;

    // Flexible work arrangements
    if (candidateSchedule === 'flexible' || jobSchedule === 'flexible') {
      return 0.8;
    }

    // Similar schedules
    const scheduleGroups = {
      'standard': ['standard'],
      'flexible': ['flexible', 'custom'],
      'shift_work': ['shift', 'night'],
      'compressed': ['compressed', '4x10'],
      'weekend': ['weekend', 'sat/sun']
    };

    for (const [group, schedules] of Object.entries(scheduleGroups)) {
      if (schedules.includes(candidateSchedule) && schedules.includes(jobSchedule)) {
        return 0.9;
      }
    }

    return 0.3;
  }

  /**
   * Calculate travel requirement match
   */
  private static calculateTravelMatch(
    candidateRequirement: number,
    jobRequirement: number
  ): number {
    if (candidateRequirement >= jobRequirement) return 1.0;

    const ratio = candidateRequirement / jobRequirement;
    if (ratio >= 0.8) return 0.8;
    if (ratio >= 0.5) return 0.6;
    return 0.3;
  }

  /**
   * Calculate flexibility score
   */
  private static calculateFlexibilityScore(
    candidateTypes: string[],
    jobTypes: string[]
  ): number {
    const flexibleTypes = ['hybrid', 'flexible', 'remote'];
    const candidateFlexible = candidateTypes.some(type => flexibleTypes.includes(type.toLowerCase()));
    const jobFlexible = jobTypes.some(type => flexibleTypes.includes(type.toLowerCase()));

    if (candidateFlexible && jobFlexible) return 1.0;
    if (candidateFlexible || jobFlexible) return 0.7;
    return 0.4;
  }

  /**
   * Calculate work environment match
   */
  private static calculateEnvironmentMatch(
    candidatePrefs: JobPreferences,
    jobEnv: any
  ): number {
    // This would be more complex in a real implementation
    // For now, return a neutral score
    return 0.5;
  }
}

/**
 * Salary matching algorithm
 */
export class SalaryMatcher {
  /**
   * Calculate salary alignment score
   */
  static calculateSalaryMatch(
    candidateSalary: any,
    jobSalary: any
  ): number {
    if (!candidateSalary || !jobSalary) return 0.5;

    const candidateMin = candidateSalary.min || 0;
    const candidateMax = candidateSalary.max || candidateMin * 2;
    const jobMin = jobSalary.min || 0;
    const jobMax = jobSalary.max || jobMin * 1.5;

    // Check for salary range overlap
    const overlapStart = Math.max(candidateMin, jobMin);
    const overlapEnd = Math.min(candidateMax, jobMax);

    if (overlapStart <= overlapEnd) {
      // There is some overlap
      const overlapAmount = overlapEnd - overlapStart;
      const candidateRange = candidateMax - candidateMin;
      const jobRange = jobMax - jobMin;

      // Calculate overlap percentage
      const overlapPercent = overlapAmount / Math.max(candidateRange, jobRange);
      return Math.min(1.0, overlapPercent * 2); // Normalize to 0-1 range
    }

    // Check if candidate range encompasses job range
    if (candidateMin <= jobMin && candidateMax >= jobMax) {
      return 1.0;
    }

    // Check if job range encompasses candidate range
    if (jobMin <= candidateMin && jobMax >= candidateMax) {
      return 0.9;
    }

    // No overlap - calculate distance
    if (candidateMax < jobMin) {
      // Candidate salary is below job range
      const gap = (jobMin - candidateMax) / jobMin;
      return Math.max(0, 1 - gap);
    } else {
      // Candidate salary is above job range
      const excess = (candidateMin - jobMax) / candidateMin;
      return Math.max(0, 1 - excess * 0.5));
    }
  }
}