/**
 * Profile Completeness Enhancement Service
 *
 * Enhances user profiles by analyzing completeness, identifying gaps,
 * and providing intelligent suggestions for improvement.
 */

import { prisma } from '@/lib/prisma';
import { cache } from '@/lib/cache';
import { logger } from '@/lib/logger';
import { socialMediaIntegration } from './social-media-integration';
import { textExtractor } from '@/lib/text-extractor';
import { keywordAnalyzer } from '@/lib/keyword-analyzer';

export interface ProfileCompletenessScore {
  overall: number;
  sections: {
    personal: number;
    experience: number;
    education: number;
    skills: number;
    projects: number;
    accomplishments: number;
    socialMedia: number;
  };
  weightedScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  lastCalculated: Date;
}

export interface ProfileGap {
  type: 'missing' | 'incomplete' | 'outdated' | 'inconsistent';
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  field: string;
  description: string;
  impact: string;
  suggestedAction: string;
  estimatedImprovement: number;
  priority: number;
}

export interface ProfileEnhancement {
  category: 'content' | 'structure' | 'presentation' | 'seo' | 'validation';
  type: 'addition' | 'improvement' | 'correction' | 'optimization';
  title: string;
  description: string;
  benefits: string[];
  implementation: {
    difficulty: 'easy' | 'medium' | 'hard';
    timeEstimate: string;
    steps: string[];
    resources?: string[];
  };
  impact: {
    completenessImprovement: number;
    visibilityImprovement: number;
    credibilityImprovement: number;
  };
  autoSuggestion?: {
    content: string;
    confidence: number;
    source: string;
  };
}

export interface ProfileOptimization {
  userId: string;
  currentScore: ProfileCompletenessScore;
  gaps: ProfileGap[];
  enhancements: ProfileEnhancement[];
  prioritizedActions: Array<{
    action: string;
    category: string;
    impact: number;
    effort: number;
    timeline: string;
  }>;
  socialMediaEnrichment: {
    availablePlatforms: string[];
    suggestedConnections: string[];
    contentOpportunities: string[];
  };
  competitorAnalysis?: {
    averageScore: number;
    topPerformers: Array<{
      score: number;
      strengths: string[];
    }>;
    improvementOpportunities: string[];
  };
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  lastUpdated: Date;
}

export interface ProfileSectionWeights {
  personal: number;
  experience: number;
  education: number;
  skills: number;
  projects: number;
  accomplishments: number;
  socialMedia: number;
}

export interface ProfileValidationRule {
  field: string;
  type: 'required' | 'recommended' | 'format' | 'consistency';
  condition: (value: any) => boolean;
  message: string;
  impact: number;
}

class ProfileCompletenessEnhancementService {
  private static instance: ProfileCompletenessEnhancementService;
  private sectionWeights: ProfileSectionWeights = {
    personal: 0.20,
    experience: 0.25,
    education: 0.15,
    skills: 0.15,
    projects: 0.10,
    accomplishments: 0.10,
    socialMedia: 0.05,
  };

  private validationRules: ProfileValidationRule[] = [
    // Personal section rules
    {
      field: 'firstName',
      type: 'required',
      condition: (value: string) => value && value.trim().length > 0,
      message: 'First name is required',
      impact: 15,
    },
    {
      field: 'lastName',
      type: 'required',
      condition: (value: string) => value && value.trim().length > 0,
      message: 'Last name is required',
      impact: 15,
    },
    {
      field: 'headline',
      type: 'recommended',
      condition: (value: string) => value && value.trim().length >= 10,
      message: 'Headline should be at least 10 characters',
      impact: 8,
    },
    {
      field: 'summary',
      type: 'recommended',
      condition: (value: string) => value && value.trim().length >= 150,
      message: 'Summary should be at least 150 characters for better impact',
      impact: 12,
    },
    {
      field: 'location',
      type: 'recommended',
      condition: (value: string) => value && value.trim().length > 0,
      message: 'Location helps with local job matching',
      impact: 5,
    },
    {
      field: 'website',
      type: 'recommended',
      condition: (value: string) => value && this.isValidUrl(value),
      message: 'Professional website or portfolio URL',
      impact: 7,
    },

    // Experience section rules
    {
      field: 'experience',
      type: 'required',
      condition: (value: any[]) => value && value.length > 0,
      message: 'At least one work experience is required',
      impact: 20,
    },
    {
      field: 'experience.description',
      type: 'recommended',
      condition: (value: string) => value && value.trim().length >= 50,
      message: 'Experience descriptions should be detailed (50+ characters)',
      impact: 6,
    },
    {
      field: 'experience.achievements',
      type: 'recommended',
      condition: (value: string[]) => value && value.length >= 2,
      message: 'Include at least 2 achievements per experience',
      impact: 8,
    },
    {
      field: 'experience.skills',
      type: 'recommended',
      condition: (value: string[]) => value && value.length >= 3,
      message: 'List relevant skills used in each role',
      impact: 5,
    },

    // Education section rules
    {
      field: 'education',
      type: 'recommended',
      condition: (value: any[]) => value && value.length > 0,
      message: 'Education information improves credibility',
      impact: 10,
    },
    {
      field: 'education.fieldOfStudy',
      type: 'recommended',
      condition: (value: string) => value && value.trim().length > 0,
      message: 'Field of study should be specified',
      impact: 4,
    },

    // Skills section rules
    {
      field: 'skills',
      type: 'required',
      condition: (value: any[]) => value && value.length >= 5,
      message: 'At least 5 skills should be listed',
      impact: 12,
    },
    {
      field: 'skills.diversity',
      type: 'recommended',
      condition: (value: any[]) => value && this.hasSkillDiversity(value),
      message: 'Include a diverse mix of technical and soft skills',
      impact: 6,
    },

    // Projects section rules
    {
      field: 'projects',
      type: 'recommended',
      condition: (value: any[]) => value && value.length >= 2,
      message: 'Showcase at least 2 projects',
      impact: 8,
    },
    {
      field: 'projects.description',
      type: 'recommended',
      condition: (value: string) => value && value.trim().length >= 30,
      message: 'Project descriptions should be detailed',
      impact: 4,
    },
  ];

  private constructor() {}

  static getInstance(): ProfileCompletenessEnhancementService {
    if (!ProfileCompletenessEnhancementService.instance) {
      ProfileCompletenessEnhancementService.instance = new ProfileCompletenessEnhancementService();
    }
    return ProfileCompletenessEnhancementService.instance;
  }

  /**
   * Analyze and optimize user profile completeness
   */
  async analyzeProfileCompleteness(userId: string): Promise<ProfileOptimization> {
    const cacheKey = `profile_optimization:${userId}`;

    return cache.wrap(cacheKey, async () => {
      try {
        logger.info('Starting profile completeness analysis', { userId });

        // Get user profile data
        const profileData = await this.getUserProfileData(userId);

        // Calculate current completeness score
        const currentScore = await this.calculateCompletenessScore(profileData);

        // Identify profile gaps
        const gaps = await this.identifyProfileGaps(profileData);

        // Generate enhancement suggestions
        const enhancements = await this.generateEnhancements(profileData, gaps);

        // Prioritize actions
        const prioritizedActions = await this.prioritizeActions(gaps, enhancements);

        // Analyze social media enrichment opportunities
        const socialMediaEnrichment = await this.analyzeSocialMediaOpportunities(userId);

        // Perform competitor analysis (optional)
        const competitorAnalysis = await this.performCompetitorAnalysis(userId, profileData);

        // Generate recommendations
        const recommendations = this.generateRecommendations(prioritizedActions, gaps);

        const optimization: ProfileOptimization = {
          userId,
          currentScore,
          gaps,
          enhancements,
          prioritizedActions,
          socialMediaEnrichment,
          competitorAnalysis,
          recommendations,
          lastUpdated: new Date(),
        };

        logger.info('Profile completeness analysis completed', {
          userId,
          overallScore: currentScore.overall,
          gapsIdentified: gaps.length,
          enhancementsGenerated: enhancements.length,
        });

        return optimization;
      } catch (error) {
        logger.error('Error analyzing profile completeness', error, { userId });
        throw error;
      }
    }, 1800); // Cache for 30 minutes
  }

  /**
   * Get user profile data from database
   */
  private async getUserProfileData(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        experiences: {
          orderBy: { startDate: 'desc' },
        },
        educations: {
          orderBy: { startDate: 'desc' },
        },
        skills: {
          orderBy: { endorsements: 'desc' },
        },
        projects: {
          orderBy: { startDate: 'desc' },
        },
        certifications: {
          orderBy: { issueDate: 'desc' },
        },
        resumes: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        socialMediaConnections: true,
      },
    });
  }

  /**
   * Calculate profile completeness score
   */
  private async calculateCompletenessScore(profileData: any): Promise<ProfileCompletenessScore> {
    const sections = {
      personal: this.calculatePersonalScore(profileData),
      experience: this.calculateExperienceScore(profileData.experiences),
      education: this.calculateEducationScore(profileData.educations),
      skills: this.calculateSkillsScore(profileData.skills),
      projects: this.calculateProjectsScore(profileData.projects),
      accomplishments: this.calculateAccomplishmentsScore(profileData),
      socialMedia: this.calculateSocialMediaScore(profileData.socialMediaConnections),
    };

    // Calculate weighted overall score
    const weightedScore = Object.entries(this.sectionWeights).reduce((total, [section, weight]) => {
      return total + (sections[section as keyof typeof sections] * weight);
    }, 0);

    const overall = Math.round(weightedScore);

    return {
      overall,
      sections,
      weightedScore,
      grade: this.calculateGrade(overall),
      lastCalculated: new Date(),
    };
  }

  /**
   * Calculate personal information section score
   */
  private calculatePersonalScore(profileData: any): number {
    let score = 0;
    const profile = profileData.profile;

    if (profileData.firstName) score += 15;
    if (profileData.lastName) score += 15;
    if (profile?.headline && profile.headline.length >= 10) score += 20;
    if (profile?.summary && profile.summary.length >= 150) score += 25;
    if (profile?.location) score += 10;
    if (profile?.website) score += 10;
    if (profileData.email) score += 5;

    return Math.min(score, 100);
  }

  /**
   * Calculate experience section score
   */
  private calculateExperienceScore(experiences: any[]): number {
    if (!experiences || experiences.length === 0) return 0;

    let totalScore = 0;
    let maxPossibleScore = 0;

    experiences.forEach(exp => {
      let expScore = 0;
      let expMax = 0;

      // Basic info (40 points)
      expMax += 40;
      if (exp.title && exp.title.length > 0) expScore += 10;
      if (exp.company && exp.company.length > 0) expScore += 10;
      if (exp.startDate) expScore += 10;
      if (exp.description && exp.description.length >= 50) expScore += 10;

      // Enhancements (60 points)
      expMax += 60;
      if (exp.description && exp.description.length >= 150) expScore += 15;
      if (exp.achievements && exp.achievements.length >= 2) expScore += 20;
      if (exp.skills && exp.skills.length >= 3) expScore += 15;
      if (exp.location) expScore += 10;

      totalScore += expScore;
      maxPossibleScore += expMax;
    });

    return maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
  }

  /**
   * Calculate education section score
   */
  private calculateEducationScore(educations: any[]): number {
    if (!educations || educations.length === 0) return 30; // Some credit for not having education

    let totalScore = 0;
    let maxPossibleScore = 0;

    educations.forEach(edu => {
      let eduScore = 0;
      let eduMax = 0;

      // Basic info (50 points)
      eduMax += 50;
      if (edu.schoolName && edu.schoolName.length > 0) eduScore += 15;
      if (edu.degree && edu.degree.length > 0) eduScore += 15;
      if (edu.fieldOfStudy && edu.fieldOfStudy.length > 0) eduScore += 10;
      if (edu.startDate) eduScore += 10;

      // Enhancements (50 points)
      eduMax += 50;
      if (edu.description && edu.description.length >= 50) eduScore += 15;
      if (edu.activities && edu.activities.length > 0) eduScore += 15;
      if (edu.grade) eduScore += 10;
      if (edu.endDate) eduScore += 10;

      totalScore += eduScore;
      maxPossibleScore += eduMax;
    });

    return maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
  }

  /**
   * Calculate skills section score
   */
  private calculateSkillsScore(skills: any[]): number {
    if (!skills || skills.length === 0) return 0;

    let score = 0;

    // Number of skills (40 points)
    score += Math.min(skills.length * 4, 40);

    // Skill diversity (30 points)
    const hasTechnical = skills.some(skill => this.isTechnicalSkill(skill.name));
    const hasSoft = skills.some(skill => this.isSoftSkill(skill.name));
    const hasBusiness = skills.some(skill => this.isBusinessSkill(skill.name));

    if (hasTechnical) score += 10;
    if (hasSoft) score += 10;
    if (hasBusiness) score += 10;

    // Skill validation (30 points)
    const endorsedSkills = skills.filter(skill => skill.endorsements > 0).length;
    score += Math.min((endorsedSkills / skills.length) * 30, 30);

    return Math.min(score, 100);
  }

  /**
   * Calculate projects section score
   */
  private calculateProjectsScore(projects: any[]): number {
    if (!projects || projects.length === 0) return 0;

    let totalScore = 0;
    let maxPossibleScore = 0;

    projects.forEach(project => {
      let projScore = 0;
      let projMax = 0;

      // Basic info (50 points)
      projMax += 50;
      if (project.title && project.title.length > 0) projScore += 15;
      if (project.description && project.description.length >= 50) projScore += 20;
      if (project.url) projScore += 15;

      // Enhancements (50 points)
      projMax += 50;
      if (project.technologies && project.technologies.length >= 2) projScore += 20;
      if (project.achievements && project.achievements.length > 0) projScore += 15;
      if (project.startDate) projScore += 15;

      totalScore += projScore;
      maxPossibleScore += projMax;
    });

    return maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
  }

  /**
   * Calculate accomplishments section score
   */
  private calculateAccomplishmentsScore(profileData: any): number {
    let score = 0;

    // Certifications
    if (profileData.certifications && profileData.certifications.length > 0) {
      score += Math.min(profileData.certifications.length * 15, 30);
    }

    // Awards (would need to be added to schema)
    // if (profileData.awards && profileData.awards.length > 0) {
    //   score += Math.min(profileData.awards.length * 10, 25);
    // }

    // Publications (would need to be added to schema)
    // if (profileData.publications && profileData.publications.length > 0) {
    //   score += Math.min(profileData.publications.length * 15, 25);
    // }

    // Languages (would need to be added to schema)
    // if (profileData.languages && profileData.languages.length > 0) {
    //   score += Math.min(profileData.languages.length * 5, 20);
    // }

    return Math.min(score, 100);
  }

  /**
   * Calculate social media integration score
   */
  private calculateSocialMediaScore(connections: any[]): number {
    if (!connections || connections.length === 0) return 0;

    const connectedPlatforms = connections.filter(conn => conn.isActive).length;
    const professionalPlatforms = ['linkedin', 'github', 'twitter'];
    const connectedProfessional = connections
      .filter(conn => conn.isActive && professionalPlatforms.includes(conn.platform))
      .length;

    let score = 0;

    // Points for connections
    score += Math.min(connectedPlatforms * 20, 40);
    score += Math.min(connectedProfessional * 15, 30);

    // Bonus for recent syncs
    const recentlySynced = connections.filter(conn =>
      conn.isActive &&
      new Date(conn.lastSync).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
    ).length;
    score += Math.min(recentlySynced * 10, 30);

    return Math.min(score, 100);
  }

  /**
   * Calculate letter grade from numeric score
   */
  private calculateGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Identify profile gaps and issues
   */
  private async identifyProfileGaps(profileData: any): Promise<ProfileGap[]> {
    const gaps: ProfileGap[] = [];

    // Apply validation rules
    this.validationRules.forEach(rule => {
      const value = this.getNestedValue(profileData, rule.field);
      if (!rule.condition(value)) {
        gaps.push({
          type: rule.type === 'required' ? 'missing' : 'incomplete',
          severity: this.determineSeverity(rule.impact),
          category: this.categorizeField(rule.field),
          field: rule.field,
          description: rule.message,
          impact: `Improves profile completeness by ${rule.impact}%`,
          suggestedAction: this.generateSuggestedAction(rule.field, value),
          estimatedImprovement: rule.impact,
          priority: rule.impact,
        });
      }
    });

    // Check for outdated information
    const outdatedGaps = await this.checkForOutdatedInformation(profileData);
    gaps.push(...outdatedGaps);

    // Check for inconsistencies
    const inconsistencyGaps = await this.checkForInconsistencies(profileData);
    gaps.push(...inconsistencyGaps);

    return gaps.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Generate enhancement suggestions
   */
  private async generateEnhancements(
    profileData: any,
    gaps: ProfileGap[]
  ): Promise<ProfileEnhancement[]> {
    const enhancements: ProfileEnhancement[] = [];

    // Content enhancements
    enhancements.push(...await this.generateContentEnhancements(profileData, gaps));

    // Structure improvements
    enhancements.push(...await this.generateStructureImprovements(profileData));

    // Presentation optimizations
    enhancements.push(...await this.generatePresentationOptimizations(profileData));

    // SEO improvements
    enhancements.push(...await this.generateSEOImprovements(profileData));

    // Validation corrections
    enhancements.push(...await this.generateValidationCorrections(gaps));

    return enhancements.sort((a, b) => {
      const aImpact = a.impact.completenessImprovement + a.impact.visibilityImprovement + a.impact.credibilityImprovement;
      const bImpact = b.impact.completenessImprovement + b.impact.visibilityImprovement + b.impact.credibilityImprovement;
      return bImpact - aImpact;
    });
  }

  /**
   * Prioritize actions based on impact and effort
   */
  private async prioritizeActions(
    gaps: ProfileGap[],
    enhancements: ProfileEnhancement[]
  ): Promise<ProfileOptimization['prioritizedActions']> {
    const actions: ProfileOptimization['prioritizedActions'] = [];

    // High-priority gap fixes
    gaps.filter(gap => gap.severity === 'critical' || gap.severity === 'high').forEach(gap => {
      actions.push({
        action: gap.suggestedAction,
        category: gap.category,
        impact: gap.estimatedImprovement,
        effort: this.estimateEffort(gap.type, gap.field),
        timeline: this.estimateTimeline(gap.type, gap.field),
      });
    });

    // High-impact enhancements
    enhancements.filter(enhancement =>
      enhancement.implementation.difficulty === 'easy' &&
      (enhancement.impact.completenessImprovement > 10 || enhancement.impact.visibilityImprovement > 10)
    ).forEach(enhancement => {
      actions.push({
        action: enhancement.title,
        category: enhancement.category,
        impact: enhancement.impact.completenessImprovement,
        effort: this.estimateEffortFromDifficulty(enhancement.implementation.difficulty),
        timeline: enhancement.implementation.timeEstimate,
      });
    });

    return actions.sort((a, b) => {
      const aScore = a.impact / a.effort;
      const bScore = b.impact / b.effort;
      return bScore - aScore;
    }).slice(0, 10); // Top 10 prioritized actions
  }

  /**
   * Analyze social media enrichment opportunities
   */
  private async analyzeSocialMediaOpportunities(userId: string): Promise<ProfileOptimization['socialMediaEnrichment']> {
    try {
      const enrichment = await socialMediaIntegration.getSocialMediaEnrichment(userId);

      return {
        availablePlatforms: Object.keys(enrichment).filter(key =>
          key !== 'userId' && enrichment[key as keyof typeof enrichment]
        ),
        suggestedConnections: this.generateSuggestedConnections(enrichment),
        contentOpportunities: this.generateContentOpportunities(enrichment),
      };
    } catch (error) {
      logger.error('Error analyzing social media opportunities', error);
      return {
        availablePlatforms: [],
        suggestedConnections: [],
        contentOpportunities: [],
      };
    }
  }

  /**
   * Perform competitor analysis
   */
  private async performCompetitorAnalysis(userId: string, profileData: any): Promise<ProfileOptimization['competitorAnalysis']> {
    // This would involve comparing with similar profiles
    // For now, return a basic structure
    return {
      averageScore: 75,
      topPerformers: [
        {
          score: 95,
          strengths: ['comprehensive experience', 'strong project portfolio', 'active social media presence'],
        },
      ],
      improvementOpportunities: [
        'Add more project details',
        'Include quantifiable achievements',
        'Enhance skill descriptions',
      ],
    };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    prioritizedActions: ProfileOptimization['prioritizedActions'],
    gaps: ProfileGap[]
  ): ProfileOptimization['recommendations'] {
    const immediate: string[] = [];
    const shortTerm: string[] = [];
    const longTerm: string[] = [];

    // Immediate actions (critical gaps, easy fixes)
    gaps.filter(gap => gap.severity === 'critical').forEach(gap => {
      immediate.push(gap.suggestedAction);
    });

    prioritizedActions.filter(action => action.effort <= 3 && action.timeline.includes('day')).forEach(action => {
      immediate.push(action.action);
    });

    // Short-term actions (medium priority)
    gaps.filter(gap => gap.severity === 'high').forEach(gap => {
      shortTerm.push(gap.suggestedAction);
    });

    prioritizedActions.filter(action => action.effort <= 5 && action.timeline.includes('week')).forEach(action => {
      shortTerm.push(action.action);
    });

    // Long-term actions (lower priority, larger effort)
    gaps.filter(gap => gap.severity === 'medium' || gap.severity === 'low').forEach(gap => {
      longTerm.push(gap.suggestedAction);
    });

    prioritizedActions.filter(action => action.effort > 5 || action.timeline.includes('month')).forEach(action => {
      longTerm.push(action.action);
    });

    return {
      immediate: [...new Set(immediate)].slice(0, 5),
      shortTerm: [...new Set(shortTerm)].slice(0, 5),
      longTerm: [...new Set(longTerm)].slice(0, 5),
    };
  }

  // Helper methods

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private hasSkillDiversity(skills: any[]): boolean {
    const categories = {
      technical: 0,
      soft: 0,
      business: 0,
    };

    skills.forEach(skill => {
      if (this.isTechnicalSkill(skill.name)) categories.technical++;
      else if (this.isSoftSkill(skill.name)) categories.soft++;
      else if (this.isBusinessSkill(skill.name)) categories.business++;
    });

    return Object.values(categories).filter(count => count > 0).length >= 2;
  }

  private isTechnicalSkill(skill: string): boolean {
    const technicalKeywords = [
      'javascript', 'python', 'java', 'react', 'node', 'docker', 'aws', 'sql',
      'html', 'css', 'git', 'linux', 'api', 'database', 'frontend', 'backend'
    ];
    return technicalKeywords.some(keyword => skill.toLowerCase().includes(keyword));
  }

  private isSoftSkill(skill: string): boolean {
    const softKeywords = [
      'communication', 'leadership', 'teamwork', 'problem solving', 'creativity',
      'adaptability', 'time management', 'collaboration', 'critical thinking'
    ];
    return softKeywords.some(keyword => skill.toLowerCase().includes(keyword));
  }

  private isBusinessSkill(skill: string): boolean {
    const businessKeywords = [
      'project management', 'marketing', 'sales', 'finance', 'strategy',
      'analytics', 'business development', 'negotiation', 'planning'
    ];
    return businessKeywords.some(keyword => skill.toLowerCase().includes(keyword));
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private determineSeverity(impact: number): 'low' | 'medium' | 'high' | 'critical' {
    if (impact >= 15) return 'critical';
    if (impact >= 10) return 'high';
    if (impact >= 5) return 'medium';
    return 'low';
  }

  private categorizeField(field: string): string {
    if (field.includes('experience')) return 'experience';
    if (field.includes('education')) return 'education';
    if (field.includes('skill')) return 'skills';
    if (field.includes('project')) return 'projects';
    if (field.includes('personal')) return 'personal';
    return 'general';
  }

  private generateSuggestedAction(field: string, currentValue: any): string {
    const actions: { [key: string]: string } = {
      'firstName': 'Add your first name to personalize your profile',
      'lastName': 'Add your last name to complete your identity',
      'headline': 'Write a compelling headline that describes your professional role',
      'summary': 'Create a detailed summary highlighting your expertise and career goals',
      'location': 'Add your location to help with local job opportunities',
      'website': 'Include a link to your portfolio or professional website',
      'experience': 'Add your work experience to show your career progression',
      'experience.description': 'Provide detailed descriptions of your responsibilities and achievements',
      'experience.achievements': 'List specific achievements with metrics when possible',
      'experience.skills': 'Include the key skills you used in each role',
      'education': 'Add your educational background to build credibility',
      'education.fieldOfStudy': 'Specify your field of study or major',
      'skills': 'Add relevant skills to showcase your qualifications',
      'skills.diversity': 'Include a mix of technical, soft, and business skills',
      'projects': 'Showcase your projects to demonstrate your abilities',
      'projects.description': 'Provide detailed descriptions of your project work',
    };

    return actions[field] || `Complete the ${field} section`;
  }

  private estimateEffort(type: string, field: string): number {
    const effortMap: { [key: string]: number } = {
      'missing': 8,
      'incomplete': 5,
      'outdated': 3,
      'inconsistent': 4,
    };

    const baseEffort = effortMap[type] || 5;

    // Adjust based on field complexity
    if (field.includes('summary') || field.includes('description')) {
      return baseEffort + 2;
    }
    if (field.includes('project') || field.includes('experience')) {
      return baseEffort + 3;
    }

    return baseEffort;
  }

  private estimateTimeline(type: string, field: string): string {
    const effort = this.estimateEffort(type, field);

    if (effort <= 3) return '1-2 days';
    if (effort <= 6) return '3-5 days';
    if (effort <= 8) return '1-2 weeks';
    return '2-3 weeks';
  }

  private estimateEffortFromDifficulty(difficulty: 'easy' | 'medium' | 'hard'): number {
    const effortMap = { easy: 2, medium: 5, hard: 8 };
    return effortMap[difficulty];
  }

  private async checkForOutdatedInformation(profileData: any): Promise<ProfileGap[]> {
    const gaps: ProfileGap[] = [];
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

    // Check for outdated experiences
    if (profileData.experiences) {
      profileData.experiences.forEach((exp: any, index: number) => {
        if (exp.endDate && new Date(exp.endDate) < oneYearAgo && exp.isCurrentJob) {
          gaps.push({
            type: 'outdated',
            severity: 'high',
            category: 'experience',
            field: `experiences[${index}].isCurrentJob`,
            description: 'Experience marked as current but end date is over a year old',
            impact: 'May confuse recruiters about current employment status',
            suggestedAction: 'Update current job status or add recent experience',
            estimatedImprovement: 8,
            priority: 8,
          });
        }
      });
    }

    return gaps;
  }

  private async checkForInconsistencies(profileData: any): Promise<ProfileGap[]> {
    const gaps: ProfileGap[] = [];

    // Check for date inconsistencies
    if (profileData.experiences) {
      profileData.experiences.forEach((exp: any, index: number) => {
        if (exp.startDate && exp.endDate && new Date(exp.startDate) > new Date(exp.endDate)) {
          gaps.push({
            type: 'inconsistent',
            severity: 'medium',
            category: 'experience',
            field: `experiences[${index}].dates`,
            description: 'Start date is after end date',
            impact: 'Creates confusion about employment timeline',
            suggestedAction: 'Correct the date order for this experience',
            estimatedImprovement: 5,
            priority: 6,
          });
        }
      });
    }

    return gaps;
  }

  private async generateContentEnhancements(
    profileData: any,
    gaps: ProfileGap[]
  ): Promise<ProfileEnhancement[]> {
    const enhancements: ProfileEnhancement[] = [];

    // Enhance summary with AI-suggested content
    if (!profileData.profile?.summary || profileData.profile.summary.length < 150) {
      const suggestedSummary = await this.generateSummarySuggestion(profileData);
      if (suggestedSummary) {
        enhancements.push({
          category: 'content',
          type: 'improvement',
          title: 'Enhance Professional Summary',
          description: 'Expand your summary to better highlight your expertise and value proposition',
          benefits: [
            'Improved first impression with recruiters',
            'Better keyword optimization for search',
            'Clearer communication of your value'
          ],
          implementation: {
            difficulty: 'medium',
            timeEstimate: '30-45 minutes',
            steps: [
              'Review the suggested summary content',
              'Customize it to reflect your unique voice',
              'Add specific achievements and metrics',
              'Ensure it aligns with your career goals'
            ],
            resources: ['Professional summary examples', 'Industry keywords list']
          },
          impact: {
            completenessImprovement: 12,
            visibilityImprovement: 15,
            credibilityImprovement: 10
          },
          autoSuggestion: {
            content: suggestedSummary,
            confidence: 0.8,
            source: 'ai_analysis'
          }
        });
      }
    }

    return enhancements;
  }

  private async generateStructureImprovements(profileData: any): Promise<ProfileEnhancement[]> {
    const enhancements: ProfileEnhancement[] = [];

    // Suggest reordering experiences by impact
    if (profileData.experiences && profileData.experiences.length > 1) {
      enhancements.push({
        category: 'structure',
        type: 'optimization',
        title: 'Optimize Experience Order',
        description: 'Reorder your experiences to highlight the most relevant and impactful ones first',
        benefits: [
          'Improved readability for recruiters',
          'Better highlighting of key achievements',
          'Enhanced professional narrative'
        ],
        implementation: {
          difficulty: 'easy',
          timeEstimate: '15-20 minutes',
          steps: [
            'Review all your experiences',
            'Identify most impactful roles',
            'Reorder to highlight recent and relevant experience',
            'Ensure chronological flow within categories'
          ]
        },
        impact: {
          completenessImprovement: 5,
          visibilityImprovement: 8,
          credibilityImprovement: 6
        }
      });
    }

    return enhancements;
  }

  private async generatePresentationOptimizations(profileData: any): Promise<ProfileEnhancement[]> {
    const enhancements: ProfileEnhancement[] = [];

    // Suggest formatting improvements
    enhancements.push({
      category: 'presentation',
      type: 'improvement',
      title: 'Improve Content Formatting',
      description: 'Use consistent formatting, bullet points, and proper capitalization throughout your profile',
      benefits: [
        'Enhanced readability',
        'Professional appearance',
        'Better information retention'
      ],
      implementation: {
        difficulty: 'easy',
        timeEstimate: '20-30 minutes',
        steps: [
          'Use bullet points for lists',
          'Ensure consistent capitalization',
          'Add proper spacing between sections',
          'Use bold for emphasis on key achievements'
        ]
      },
      impact: {
        completenessImprovement: 3,
        visibilityImprovement: 5,
        credibilityImprovement: 8
      }
    });

    return enhancements;
  }

  private async generateSEOImprovements(profileData: any): Promise<ProfileEnhancement[]> {
    const enhancements: ProfileEnhancement[] = [];

    // Suggest keyword optimization
    const relevantKeywords = await this.extractRelevantKeywords(profileData);
    if (relevantKeywords.length > 0) {
      enhancements.push({
        category: 'seo',
        type: 'optimization',
        title: 'Optimize Profile for Search',
        description: 'Incorporate relevant industry keywords to improve visibility in recruiter searches',
        benefits: [
          'Higher ranking in search results',
          'Increased profile views',
          'Better matching with relevant opportunities'
        ],
        implementation: {
          difficulty: 'medium',
          timeEstimate: '45-60 minutes',
          steps: [
            'Review suggested keywords',
            'Incorporate them naturally in your summary',
            'Add to skills and experience descriptions',
            'Ensure relevance to your actual expertise'
          ],
          resources: ['Industry keyword research', 'SEO best practices for profiles']
        },
        impact: {
          completenessImprovement: 8,
          visibilityImprovement: 20,
          credibilityImprovement: 5
        }
      });
    }

    return enhancements;
  }

  private async generateValidationCorrections(gaps: ProfileGap[]): Promise<ProfileEnhancement[]> {
    const enhancements: ProfileEnhancement[] = [];

    gaps.filter(gap => gap.type === 'inconsistent').forEach(gap => {
      enhancements.push({
        category: 'validation',
        type: 'correction',
        title: `Fix ${gap.field} Inconsistency`,
        description: gap.description,
        benefits: [
          'Improved data accuracy',
          'Enhanced professional credibility',
          'Better user experience'
        ],
        implementation: {
          difficulty: 'easy',
          timeEstimate: '5-10 minutes',
          steps: [
            'Review the flagged inconsistency',
            'Correct the data accuracy',
            'Verify related information',
            'Save your changes'
          ]
        },
        impact: {
          completenessImprovement: gap.estimatedImprovement,
          visibilityImprovement: 3,
          credibilityImprovement: 10
        }
      });
    });

    return enhancements;
  }

  private generateSuggestedConnections(enrichment: any): string[] {
    const connections: string[] = [];

    // Suggest connecting with colleagues from LinkedIn data
    if (enrichment.linkedinData?.recommendations) {
      enrichment.linkedinData.recommendations.slice(0, 3).forEach((rec: any) => {
        connections.push(`Connect with ${rec.recommender} - ${rec.recommenderTitle} at ${rec.recommenderCompany}`);
      });
    }

    // Suggest following GitHub collaborators
    if (enrichment.githubData?.repositories) {
      const collaborators = enrichment.githubData.repositories
        .filter((repo: any) => repo.forks > 5)
        .slice(0, 3)
        .map((repo: any) => `Collaborators on ${repo.name}`);
      connections.push(...collaborators);
    }

    return connections;
  }

  private generateContentOpportunities(enrichment: any): string[] {
    const opportunities: string[] = [];

    // Suggest sharing project achievements
    if (enrichment.projectAdditions && enrichment.projectAdditions.length > 0) {
      opportunities.push('Share recent project completions and achievements on social media');
    }

    // Suggest writing about skills
    if (enrichment.enrichedSkills && enrichment.enrichedSkills.length > 5) {
      opportunities.push('Write articles or posts about your top skills and expertise');
    }

    // Suggest engaging with industry content
    opportunities.push('Comment on and share industry news and insights');
    opportunities.push('Participate in relevant Twitter discussions and LinkedIn groups');

    return opportunities;
  }

  private async generateSummarySuggestion(profileData: any): Promise<string | null> {
    // This would integrate with an AI service to generate a personalized summary
    // For now, return a template that would be customized
    const firstName = profileData.firstName || 'Professional';
    const topSkills = profileData.skills?.slice(0, 3).map((s: any) => s.name).join(', ') || 'key skills';
    const yearsExperience = this.calculateYearsOfExperience(profileData.experiences);

    return `Results-driven ${firstName} with ${yearsExperience}+ years of experience specializing in ${topSkills}. Proven track record of delivering innovative solutions and driving business growth. Passionate about leveraging cutting-edge technologies to solve complex challenges and create meaningful impact.`;
  }

  private async extractRelevantKeywords(profileData: any): Promise<string[]> {
    const allText = [
      profileData.profile?.summary || '',
      profileData.profile?.headline || '',
      ...profileData.experiences?.map((exp: any) => exp.description || '') || [],
      ...profileData.skills?.map((skill: any) => skill.name) || [],
    ].join(' ');

    return keywordAnalyzer.extractKeywords(allText, {
      categories: ['industry', 'skills', 'technologies'],
      minConfidence: 0.7,
      maxKeywords: 10,
    }).map(keyword => keyword.text);
  }

  private calculateYearsOfExperience(experiences: any[]): number {
    if (!experiences || experiences.length === 0) return 0;

    const totalDays = experiences.reduce((total, exp) => {
      const start = new Date(exp.startDate);
      const end = exp.endDate ? new Date(exp.endDate) : new Date();
      return total + Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    }, 0);

    return Math.floor(totalDays / 365);
  }
}

export const profileCompletenessEnhancement = ProfileCompletenessEnhancementService.getInstance();
export type {
  ProfileCompletenessScore,
  ProfileGap,
  ProfileEnhancement,
  ProfileOptimization,
  ProfileSectionWeights,
  ProfileValidationRule,
};