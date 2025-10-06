import { prisma } from '@/lib/prisma';
import { OpenRouterClient } from '@/lib/openrouter';
import { VectorStore } from '@/lib/vector-store';
import type {
  CandidateProfile,
  JobProfile,
  ProfileAnalysis,
  JobAnalysis,
  Skill,
  WorkExperience,
  Education,
  Certification,
  ScoreBreakdown,
  LocationInfo,
  JobPreferences,
  AvailabilityInfo,
  ProfileMetadata,
  JobRequirements,
  EmployerPreferences,
  CompensationInfo,
  CompanyInfo,
  JobMetadata
} from '@/types/profiles';
import type { ExperienceLevel, SkillLevel, EducationLevel } from '@/types/profiles';

export interface ProfileAnalysis {
  id: string;
  profileId: string;
  profileType: 'candidate' | 'job';
  completionScore: number;
  skillCount: number;
  experienceYears: number;
  educationLevel: EducationLevel;
  keyStrengths: string[];
  improvementAreas: string[];
  marketFit: number;
  salaryAlignment: number;
  locationFlexibility: number;
  lastAnalyzed: Date;
}

export interface JobAnalysis {
  id: string;
  jobId: string;
  complexity: number;
  marketDemand: number;
  salaryCompetitiveness: number;
  requiredSkillsCount: number;
  experienceLevel: ExperienceLevel;
  keyRequirements: string[];
  marketInsights: string[];
  lastAnalyzed: Date;
}

export class ProfileAnalyzer {
  private ai: OpenRouterClient;
  private vectorStore: VectorStore;

  constructor() {
    this.ai = new OpenRouterClient({
      apiKey: process.env.OPENROUTER_API_KEY!,
      models: {
        primary: 'claude-2',
        fallback: 'gpt-3.5-turbo',
      },
      endpoints: {
        chat: 'https://api.openrouter.ai/api/v1/chat/completions',
      },
      rateLimit: {
        requests: 50,
        window: 60000, // 1 minute
      },
    });

    this.vectorStore = new VectorStore();
  }

  /**
   * Analyze candidate profile comprehensively
   */
  async analyzeCandidateProfile(profile: CandidateProfile): Promise<ProfileAnalysis> {
    try {
      const completionScore = this.calculateProfileCompletion(profile);
      const experienceYears = this.calculateTotalExperience(profile.experience);
      const educationLevel = this.determineEducationLevel(profile.education);
      const keyStrengths = await this.identifyKeyStrengths(profile);
      const improvementAreas = await this.identifyImprovementAreas(profile);
      const marketFit = await this.calculateMarketFit(profile);
      const salaryAlignment = this.calculateSalaryAlignment(profile);
      const locationFlexibility = this.calculateLocationFlexibility(profile);

      const analysis: ProfileAnalysis = {
        id: `analysis_${profile.id}_${Date.now()}`,
        profileId: profile.id,
        profileType: 'candidate',
        completionScore,
        skillCount: profile.skills.length,
        experienceYears,
        educationLevel,
        keyStrengths,
        improvementAreas,
        marketFit,
        salaryAlignment,
        locationFlexibility,
        lastAnalyzed: new Date(),
      };

      // Store analysis in database
      await this.saveProfileAnalysis(analysis);

      return analysis;
    } catch (error) {
      console.error('Error analyzing candidate profile:', error);
      throw new Error('Failed to analyze candidate profile');
    }
  }

  /**
   * Analyze job profile comprehensively
   */
  async analyzeJobProfile(job: JobProfile): Promise<JobAnalysis> {
    try {
      const complexity = this.calculateJobComplexity(job);
      const marketDemand = await this.calculateMarketDemand(job);
      const salaryCompetitiveness = await this.calculateSalaryCompetitiveness(job);
      const requiredSkillsCount = job.requirements.skills.length;
      const experienceLevel = this.determineRequiredExperienceLevel(job.requirements.experience);
      const keyRequirements = this.extractKeyRequirements(job);
      const marketInsights = await this.generateMarketInsights(job);

      const analysis: JobAnalysis = {
        id: `analysis_${job.id}_${Date.now()}`,
        jobId: job.id,
        complexity,
        marketDemand,
        salaryCompetitiveness,
        requiredSkillsCount,
        experienceLevel,
        keyRequirements,
        marketInsights,
        lastAnalyzed: new Date(),
      };

      // Store analysis in database
      await this.saveJobAnalysis(analysis);

      return analysis;
    } catch (error) {
      console.error('Error analyzing job profile:', error);
      throw new Error('Failed to analyze job profile');
    }
  }

  /**
   * Extract and categorize skills from text
   */
  async extractSkills(text: string): Promise<Skill[]> {
    try {
      const prompt = `
        Extract and categorize technical and professional skills from the following text:

        Text: ${text}

        Please return a JSON array of skills with the following structure:
        [
          {
            "name": "skill name",
            "category": "technical|soft_skill|domain|tool|language|framework|platform|methodology|certification",
            "level": "beginner|intermediate|advanced|expert|master",
            "experience": 0, // years of experience if mentioned
            "isPrimary": false
          }
        ]

        Focus on concrete, marketable skills. Be conservative with skill levels - only mark as advanced or expert if there's clear evidence.
      `;

      const response = await this.ai.chatCompletion({
        model: 'claude-2',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      });

      const skillsData = JSON.parse(response.choices[0].message.content || '[]');

      return skillsData.map((skill: any, index: number) => ({
        id: `skill_${Date.now()}_${index}`,
        name: skill.name,
        category: skill.category,
        level: skill.level,
        experience: skill.experience || 0,
        isPrimary: skill.isPrimary || false,
        selfRated: true,
      }));
    } catch (error) {
      console.error('Error extracting skills:', error);
      return [];
    }
  }

  /**
   * Calculate experience relevance to job requirements
   */
  async calculateExperienceRelevance(
    experience: WorkExperience[],
    jobRequirements: JobRequirements
  ): Promise<number> {
    try {
      let relevanceScore = 0;
      let totalWeight = 0;

      for (const exp of experience) {
        const expText = `${exp.position} ${exp.description} ${exp.skills.join(' ')}`.toLowerCase();

        // Check skill overlap
        const requiredSkills = jobRequirements.skills.map(s => s.name.toLowerCase());
        const matchedSkills = requiredSkills.filter(skill => expText.includes(skill));

        const skillScore = matchedSkills.length / Math.max(requiredSkills.length, 1);

        // Check position relevance
        const positionRelevance = this.calculatePositionRelevance(exp.position, jobRequirements);

        // Check industry alignment
        const industryAlignment = jobRequirements.experience.some(req =>
          req.industry && exp.industry &&
          req.industry.toLowerCase() === exp.industry.toLowerCase()
        ) ? 1 : 0.5;

        // Weight by recency (more recent experience gets higher weight)
        const recencyWeight = this.calculateRecencyWeight(exp);

        const combinedScore = (skillScore * 0.5 + positionRelevance * 0.3 + industryAlignment * 0.2) * recencyWeight;

        relevanceScore += combinedScore;
        totalWeight += recencyWeight;
      }

      return totalWeight > 0 ? relevanceScore / totalWeight : 0;
    } catch (error) {
      console.error('Error calculating experience relevance:', error);
      return 0;
    }
  }

  /**
   * Assess education match to requirements
   */
  async assessEducationMatch(
    education: Education[],
    requirements: EducationRequirement[]
  ): Promise<number> {
    try {
      if (requirements.length === 0) return 1.0; // No requirements = perfect match

      let matchScore = 0;
      let totalWeight = 0;

      for (const req of requirements) {
        const weight = req.required ? 2 : 1; // Required education gets double weight
        totalWeight += weight;

        const bestMatch = education.find(edu =>
          this.matchesEducationRequirement(edu, req)
        );

        if (bestMatch) {
          // Higher score for exact matches, partial for close matches
          const exactMatch = this.exactEducationMatch(bestMatch, req);
          matchScore += weight * (exactMatch ? 1.0 : 0.7);
        } else if (!req.required) {
          // Partial credit for having education even if not exact match
          matchScore += weight * 0.3;
        }
      }

      return totalWeight > 0 ? matchScore / totalWeight : 0;
    } catch (error) {
      console.error('Error assessing education match:', error);
      return 0;
    }
  }

  /**
   * Calculate profile completion score
   */
  private calculateProfileCompletion(profile: CandidateProfile): number {
    let score = 0;
    let maxScore = 0;

    // Personal info (25%)
    maxScore += 25;
    if (profile.personalInfo.firstName && profile.personalInfo.lastName) score += 5;
    if (profile.personalInfo.email) score += 5;
    if (profile.personalInfo.location && profile.personalInfo.location.country) score += 5;
    if (profile.personalInfo.phone) score += 5;
    if (profile.professionalSummary && profile.professionalSummary.length > 50) score += 5;

    // Skills (20%)
    maxScore += 20;
    if (profile.skills.length > 0) score += 10;
    if (profile.skills.length >= 5) score += 10;

    // Experience (25%)
    maxScore += 25;
    if (profile.experience.length > 0) score += 10;
    if (profile.experience.some(exp => exp.description && exp.description.length > 50)) score += 10;
    if (profile.experience.some(exp => !exp.isCurrent)) score += 5;

    // Education (15%)
    maxScore += 15;
    if (profile.education.length > 0) score += 10;
    if (profile.education.some(edu => edu.degree && edu.institution)) score += 5;

    // Certifications (5%)
    maxScore += 5;
    if (profile.certifications.length > 0) score += 5;

    // Preferences (10%)
    maxScore += 10;
    if (profile.preferences && Object.keys(profile.preferences).length > 0) score += 10;

    return maxScore > 0 ? Math.min(100, Math.round((score / maxScore) * 100)) : 0;
  }

  /**
   * Calculate total years of experience
   */
  private calculateTotalExperience(experience: WorkExperience[]): number {
    let totalMonths = 0;

    for (const exp of experience) {
      const endDate = exp.isCurrent ? new Date() : exp.endDate;
      if (exp.startDate && endDate) {
        const months = this.getMonthsBetween(exp.startDate, endDate);
        totalMonths += months;
      }
    }

    return Math.round(totalMonths / 12 * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Determine highest education level
   */
  private determineEducationLevel(education: Education[]): EducationLevel {
    const levels = {
      [EducationLevel.HIGH_SCHOOL]: 0,
      [EducationLevel.ASSOCIATE]: 1,
      [EducationLevel.BACHELOR]: 2,
      [EducationLevel.MASTER]: 3,
      [EducationLevel.PHD]: 4,
      [EducationLevel.POSTDOCTORAL]: 5,
      [EducationLevel.PROFESSIONAL]: 3,
      [EducationLevel.CERTIFICATE]: 1,
      [EducationLevel.DIPLOMA]: 1,
    };

    let highestLevel = EducationLevel.HIGH_SCHOOL;
    let highestScore = 0;

    for (const edu of education) {
      const score = levels[edu.level as EducationLevel] || 0;
      if (score > highestScore) {
        highestScore = score;
        highestLevel = edu.level as EducationLevel;
      }
    }

    return highestLevel;
  }

  /**
   * Identify key strengths from profile
   */
  private async identifyKeyStrengths(profile: CandidateProfile): Promise<string[]> {
    try {
      const prompt = `
        Based on the following candidate profile, identify 5 key strengths that would be valuable to employers:

        Professional Summary: ${profile.professionalSummary}
        Skills: ${profile.skills.map(s => s.name).join(', ')}
        Experience: ${profile.experience.map(exp => `${exp.position} at ${exp.company}`).join(', ')}
        Education: ${profile.education.map(edu => `${edu.degree} in ${edu.field}`).join(', ')}

        Return only a JSON array of 5 strengths, each as a short phrase (2-4 words).
      `;

      const response = await this.ai.chatCompletion({
        model: 'claude-2',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
      });

      return JSON.parse(response.choices[0].message.content || '[]');
    } catch (error) {
      console.error('Error identifying key strengths:', error);
      return [];
    }
  }

  /**
   * Identify areas for improvement
   */
  private async identifyImprovementAreas(profile: CandidateProfile): Promise<string[]> {
    try {
      const prompt = `
        Based on the following candidate profile, identify 3-5 areas for improvement that would make them more competitive in the job market:

        Professional Summary: ${profile.professionalSummary}
        Skills: ${profile.skills.map(s => s.name).join(', ')}
        Experience: ${profile.experience.map(exp => `${exp.position} at ${exp.company}`).join(', ')}
        Education: ${profile.education.map(edu => `${edu.degree} in ${edu.field}`).join(', ')}

        Return only a JSON array of 3-5 improvement areas, each as a short phrase (2-4 words).
      `;

      const response = await this.ai.chatCompletion({
        model: 'claude-2',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
      });

      return JSON.parse(response.choices[0].message.content || '[]');
    } catch (error) {
      console.error('Error identifying improvement areas:', error);
      return [];
    }
  }

  /**
   * Calculate market fit for candidate
   */
  private async calculateMarketFit(profile: CandidateProfile): Promise<number> {
    try {
      // This would typically involve market data analysis
      // For now, use a heuristic based on skills and experience

      const inDemandSkills = [
        'javascript', 'python', 'react', 'node.js', 'aws', 'docker',
        'kubernetes', 'typescript', 'machine learning', 'data analysis'
      ];

      const candidateSkills = profile.skills.map(s => s.name.toLowerCase());
      const inDemandCount = candidateSkills.filter(skill =>
        inDemandSkills.some(tech => skill.includes(tech))
      ).length;

      const skillFit = Math.min(1.0, inDemandCount / 5);

      const experienceFit = Math.min(1.0, this.calculateTotalExperience(profile.experience) / 5);

      return (skillFit * 0.7 + experienceFit * 0.3);
    } catch (error) {
      console.error('Error calculating market fit:', error);
      return 0.5;
    }
  }

  /**
   * Calculate salary alignment
   */
  private calculateSalaryAlignment(profile: CandidateProfile): number {
    if (!profile.preferences?.salaryRange) return 0.5;

    // This would typically involve market salary data
    // For now, return a neutral score
    return 0.7;
  }

  /**
   * Calculate location flexibility
   */
  private calculateLocationFlexibility(profile: CandidateProfile): number {
    const preferences = profile.preferences;
    if (!preferences) return 0.5;

    let score = 0.5; // Base score

    if (preferences.remoteWorkPreference) score += 0.3;
    if (preferences.location?.some(loc => loc.relocation)) score += 0.2;

    return Math.min(1.0, score);
  }

  /**
   * Calculate job complexity
   */
  private calculateJobComplexity(job: JobProfile): number {
    let complexity = 0;

    // Skills complexity
    complexity += Math.min(1.0, job.requirements.skills.length / 10) * 0.4;

    // Experience requirements
    const maxExperience = Math.max(...job.requirements.experience.map(exp => exp.yearsRequired || 0));
    complexity += Math.min(1.0, maxExperience / 10) * 0.3;

    // Education requirements
    complexity += job.requirements.education.filter(req => req.required).length * 0.1;

    // Description complexity (length as proxy)
    complexity += Math.min(1.0, job.description.length / 2000) * 0.2;

    return Math.min(1.0, complexity);
  }

  /**
   * Calculate market demand for job
   */
  private async calculateMarketDemand(job: JobProfile): Promise<number> {
    // This would typically involve market data analysis
    // For now, use a heuristic based on job title and skills
    return 0.7;
  }

  /**
   * Calculate salary competitiveness
   */
  private async calculateSalaryCompetitiveness(job: JobProfile): Promise<number> {
    // This would typically involve market salary data
    // For now, return a neutral score
    return 0.7;
  }

  /**
   * Determine required experience level
   */
  private determineRequiredExperienceLevel(experience: any[]): ExperienceLevel {
    if (experience.length === 0) return ExperienceLevel.ENTRY;

    const maxYears = Math.max(...experience.map(exp => exp.yearsRequired || 0));

    if (maxYears <= 1) return ExperienceLevel.ENTRY;
    if (maxYears <= 3) return ExperienceLevel.JUNIOR;
    if (maxYears <= 5) return ExperienceLevel.MID;
    if (maxYears <= 8) return ExperienceLevel.SENIOR;
    if (maxYears <= 12) return ExperienceLevel.LEAD;
    return ExperienceLevel.MANAGER;
  }

  /**
   * Extract key requirements from job
   */
  private extractKeyRequirements(job: JobProfile): string[] {
    const requirements: string[] = [];

    // Add required skills
    requirements.push(...job.requirements.skills
      .filter(skill => skill.required)
      .map(skill => skill.name)
      .slice(0, 5));

    // Add key experience requirements
    requirements.push(...job.requirements.experience
      .filter(exp => exp.required)
      .map(exp => `${exp.yearsRequired}+ years ${exp.title}`)
      .slice(0, 3));

    // Add education requirements
    requirements.push(...job.requirements.education
      .filter(edu => edu.required)
      .map(edu => `${edu.level} in ${edu.field || 'relevant field'}`)
      .slice(0, 2));

    return requirements.slice(0, 8); // Limit to 8 key requirements
  }

  /**
   * Generate market insights for job
   */
  private async generateMarketInsights(job: JobProfile): Promise<string[]> {
    try {
      const prompt = `
        Generate 3-4 market insights for the following job position:

        Title: ${job.title}
        Description: ${job.description.substring(0, 500)}...
        Required Skills: ${job.requirements.skills.map(s => s.name).join(', ')}
        Experience Level: ${job.requirements.experience.map(e => `${e.yearsRequired}+ years`).join(', ')}

        Focus on:
        1. Market demand for this role
        2. Salary trends
        3. Career growth opportunities
        4. Industry trends affecting this position

        Return only a JSON array of 3-4 insights, each as a short sentence.
      `;

      const response = await this.ai.chatCompletion({
        model: 'claude-2',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
      });

      return JSON.parse(response.choices[0].message.content || '[]');
    } catch (error) {
      console.error('Error generating market insights:', error);
      return [];
    }
  }

  /**
   * Calculate position relevance
   */
  private calculatePositionRelevance(position: string, jobRequirements: JobRequirements): number {
    const positionWords = position.toLowerCase().split(' ');
    const requiredPositions = jobRequirements.experience.map(exp => exp.title.toLowerCase());

    let maxRelevance = 0;

    for (const reqPos of requiredPositions) {
      const reqWords = reqPos.split(' ');
      const commonWords = positionWords.filter(word => reqWords.includes(word));
      const relevance = commonWords.length / Math.max(positionWords.length, reqWords.length);
      maxRelevance = Math.max(maxRelevance, relevance);
    }

    return maxRelevance;
  }

  /**
   * Calculate recency weight for experience
   */
  private calculateRecencyWeight(experience: WorkExperience): number {
    const endDate = experience.isCurrent ? new Date() : experience.endDate;
    if (!endDate || !experience.startDate) return 0.5;

    const monthsSinceEnd = this.getMonthsBetween(endDate, new Date());

    // More recent experience gets higher weight
    if (monthsSinceEnd <= 12) return 1.0; // Last year
    if (monthsSinceEnd <= 36) return 0.8; // Last 3 years
    if (monthsSinceEnd <= 60) return 0.6; // Last 5 years
    if (monthsSinceEnd <= 120) return 0.4; // Last 10 years
    return 0.2; // Older than 10 years
  }

  /**
   * Check if education matches requirement
   */
  private matchesEducationRequirement(education: Education, requirement: EducationRequirement): boolean {
    if (requirement.field && education.field) {
      const fieldMatch = education.field.toLowerCase().includes(requirement.field.toLowerCase()) ||
                        requirement.field.toLowerCase().includes(education.field.toLowerCase());
      if (!fieldMatch) return false;
    }

    if (requirement.level && education.level) {
      const eduLevelScore = this.getEducationLevelScore(education.level);
      const reqLevelScore = this.getEducationLevelScore(requirement.level);
      return eduLevelScore >= reqLevelScore;
    }

    return true;
  }

  /**
   * Check for exact education match
   */
  private exactEducationMatch(education: Education, requirement: EducationRequirement): boolean {
    if (requirement.field && education.field) {
      return education.field.toLowerCase() === requirement.field.toLowerCase() &&
             education.level === requirement.level;
    }
    return education.level === requirement.level;
  }

  /**
   * Get numeric score for education level
   */
  private getEducationLevelScore(level: string): number {
    const scores = {
      [EducationLevel.HIGH_SCHOOL]: 1,
      [EducationLevel.ASSOCIATE]: 2,
      [EducationLevel.CERTIFICATE]: 2,
      [EducationLevel.DIPLOMA]: 2,
      [EducationLevel.BACHELOR]: 3,
      [EducationLevel.PROFESSIONAL]: 3,
      [EducationLevel.MASTER]: 4,
      [EducationLevel.PHD]: 5,
      [EducationLevel.POSTDOCTORAL]: 6,
    };

    return scores[level as EducationLevel] || 0;
  }

  /**
   * Calculate months between two dates
   */
  private getMonthsBetween(startDate: Date, endDate: Date): number {
    return (endDate.getFullYear() - startDate.getFullYear()) * 12 +
           (endDate.getMonth() - startDate.getMonth());
  }

  /**
   * Save profile analysis to database
   */
  private async saveProfileAnalysis(analysis: ProfileAnalysis): Promise<void> {
    // Implementation would save to a profile_analyses table
    // For now, we'll just log it
    console.log('Profile analysis saved:', analysis.id);
  }

  /**
   * Save job analysis to database
   */
  private async saveJobAnalysis(analysis: JobAnalysis): Promise<void> {
    // Implementation would save to a job_analyses table
    // For now, we'll just log it
    console.log('Job analysis saved:', analysis.id);
  }
}