/**
 * Template Recommendation Service
 * Intelligent template recommendation system with ML-based scoring
 */

import { ResumeTemplate, TemplateMatchResult, UserProfile } from '@/types/template';
import { IndustryTemplateManager } from './industry-template-manager';
import { TemplateEngineError, TemplateErrorType } from './errors';

interface RecommendationRequest {
  userProfile: UserProfile;
  resumeContent?: {
    experience?: Array<{ title?: string; description?: string; duration?: string }>;
    skills?: string[];
    education?: Array<{ degree?: string; field?: string; institution?: string }>;
    achievements?: string[];
  };
  preferences?: {
    layoutStyle?: 'traditional' | 'modern' | 'creative';
    colorPreference?: string;
    industry?: string;
    targetRoles?: string[];
  };
}

interface RecommendationResponse {
  primaryRecommendation: TemplateMatchResult | null;
  alternativeRecommendations: TemplateMatchResult[];
  insights: {
    matchScore: number;
    keyFactors: string[];
    improvementSuggestions: string[];
    industryFit: number;
    atsOptimization: number;
  };
  customizations: {
    recommendedThemes: string[];
    recommendedLayouts: string[];
    sectionAdjustments: Array<{
      sectionId: string;
      action: 'show' | 'hide' | 'reorder';
      reason: string;
    }>;
  };
}

export class TemplateRecommendationService {
  private static readonly ROLE_WEIGHTS = {
    exactMatch: 1.0,
    partialMatch: 0.6,
    relatedMatch: 0.3,
    noMatch: 0.0
  };

  private static readonly EXPERIENCE_WEIGHTS = {
    exact: 1.0,
    adjacent: 0.5,
    different: 0.1
  };

  private static readonly INDUSTRY_WEIGHTS = {
    exact: 1.0,
    related: 0.7,
    different: 0.2
  };

  /**
   * Get comprehensive template recommendations
   */
  static async getRecommendations(request: RecommendationRequest): Promise<RecommendationResponse> {
    const { userProfile, resumeContent, preferences } = request;

    // Enhance user profile with resume content analysis
    const enhancedProfile = this.enhanceUserProfile(userProfile, resumeContent);

    // Get base matches
    const baseMatches = IndustryTemplateManager.findMatchingTemplates(enhancedProfile);

    // Apply preference filtering and re-ranking
    const filteredMatches = this.applyPreferences(baseMatches, preferences);

    // Generate insights
    const insights = this.generateInsights(enhancedProfile, filteredMatches);

    // Generate customization recommendations
    const customizations = this.generateCustomizationRecommendations(
      filteredMatches[0]?.template,
      enhancedProfile,
      preferences
    );

    return {
      primaryRecommendation: filteredMatches[0] || null,
      alternativeRecommendations: filteredMatches.slice(1, 4),
      insights,
      customizations
    };
  }

  /**
   * Get quick recommendations based on role only
   */
  static getQuickRecommendations(role: string): TemplateMatchResult[] {
    return IndustryTemplateManager.getRecommendationsForRole(role);
  }

  /**
   * Analyze resume content and suggest improvements
   */
  static analyzeResumeContent(resumeContent: RecommendationRequest['resumeContent']): {
    suggestedTemplate: TemplateMatchResult | null;
    contentAnalysis: {
      strengths: string[];
      weaknesses: string[];
      recommendations: string[];
      missingKeywords: string[];
      formatIssues: string[];
    };
    atsScore: number;
  } {
    if (!resumeContent) {
      throw new TemplateEngineError(
        TemplateErrorType.VALIDATION_ERROR,
        'Resume content is required for analysis',
        {}
      );
    }

    const suggestedTemplate = IndustryTemplateManager.analyzeAndSuggest(resumeContent)[0] || null;
    const contentAnalysis = this.analyzeContentQuality(resumeContent);
    const atsScore = this.calculateATSScore(resumeContent, suggestedTemplate?.template);

    return {
      suggestedTemplate,
      contentAnalysis,
      atsScore
    };
  }

  /**
   * Get industry-specific template insights
   */
  static getIndustryInsights(industry: string): {
    overview: string;
    keyCharacteristics: string[];
    commonPitfalls: string[];
    bestPractices: string[];
    recommendedTemplates: ResumeTemplate[];
    skillEmphasis: Array<{ skill: string; importance: number; description: string }>;
  } {
    const industryData = IndustryTemplateManager.getIndustryRecommendations(industry);

    const insights = {
      overview: this.getIndustryOverview(industry),
      keyCharacteristics: this.getIndustryCharacteristics(industry),
      commonPitfalls: this.getIndustryPitfalls(industry),
      bestPractices: this.getIndustryBestPractices(industry),
      recommendedTemplates: [
        industryData.primaryTemplate,
        ...industryData.alternativeTemplates
      ].filter(Boolean) as ResumeTemplate[],
      skillEmphasis: this.getIndustrySkillEmphasis(industry)
    };

    return insights;
  }

  /**
   * Compare templates for decision making
   */
  static compareTemplates(templateIds: string[]): {
    comparison: Array<{
      template: ResumeTemplate;
      strengths: string[];
      weaknesses: string[];
      bestFor: string[];
      atsScore: number;
      flexibilityScore: number;
    }>;
    recommendation: {
      bestOverall: string | null;
      bestForATS: string | null;
      mostFlexible: string | null;
      mostModern: string | null;
    };
  } {
    const templates = templateIds
      .map(id => IndustryTemplateManager.getTemplateById(id))
      .filter(Boolean) as ResumeTemplate[];

    if (templates.length === 0) {
      throw new TemplateEngineError(
        TemplateErrorType.NOT_FOUND,
        'No valid templates found for comparison',
        { templateIds }
      );
    }

    const comparison = templates.map(template => ({
      template,
      strengths: this.getTemplateStrengths(template),
      weaknesses: this.getTemplateWeaknesses(template),
      bestFor: template.metadata.targetRoles,
      atsScore: template.atsScore,
      flexibilityScore: this.calculateFlexibilityScore(template)
    }));

    const recommendation = {
      bestOverall: this.getBestOverallTemplate(comparison),
      bestForATS: this.getBestATSTemplate(comparison),
      mostFlexible: this.getMostFlexibleTemplate(comparison),
      mostModern: this.getMostModernTemplate(comparison)
    };

    return { comparison, recommendation };
  }

  // Private helper methods
  private static enhanceUserProfile(
    userProfile: UserProfile,
    resumeContent?: RecommendationRequest['resumeContent']
  ): UserProfile {
    const enhanced = { ...userProfile };

    if (resumeContent) {
      // Extract skills from resume if not provided
      if (!enhanced.skills && resumeContent.skills) {
        enhanced.skills = resumeContent.skills;
      }

      // Extract industry from experience descriptions
      if (!enhanced.industry && resumeContent.experience) {
        const experienceText = resumeContent.experience
          .map(exp => exp.description || '')
          .join(' ')
          .toLowerCase();

        enhanced.industry = this.inferIndustryFromText(experienceText);
      }

      // Estimate experience level from work history
      if (!enhanced.experienceLevel && resumeContent.experience) {
        enhanced.experienceLevel = this.estimateExperienceLevel(resumeContent.experience);
      }

      // Extract target role from most recent position
      if (!enhanced.targetRole && resumeContent.experience?.[0]?.title) {
        enhanced.targetRole = resumeContent.experience[0].title;
      }
    }

    return enhanced;
  }

  private static applyPreferences(
    matches: TemplateMatchResult[],
    preferences?: RecommendationRequest['preferences']
  ): TemplateMatchResult[] {
    if (!preferences) return matches;

    return matches.map(match => {
      let adjustedScore = match.score;

      // Apply layout preference
      if (preferences.layoutStyle) {
        if (preferences.layoutStyle === 'modern' && match.template.layout.type === 'two-column') {
          adjustedScore += 5;
        } else if (preferences.layoutStyle === 'traditional' && match.template.layout.type === 'single-column') {
          adjustedScore += 5;
        } else if (preferences.layoutStyle === 'creative' && match.template.tags.includes('creative')) {
          adjustedScore += 5;
        }
      }

      // Apply color preference
      if (preferences.colorPreference) {
        const colorThemes = match.template.customization.colorThemes;
        if (colorThemes.some(theme => theme.includes(preferences.colorPreference!.toLowerCase()))) {
          adjustedScore += 3;
        }
      }

      // Apply industry preference
      if (preferences.industry && match.template.industry === preferences.industry.toLowerCase()) {
        adjustedScore += 10;
      }

      return { ...match, score: Math.min(100, adjustedScore) };
    }).sort((a, b) => b.score - a.score);
  }

  private static generateInsights(
    profile: UserProfile,
    matches: TemplateMatchResult[]
  ): RecommendationResponse['insights'] {
    const primaryMatch = matches[0];

    if (!primaryMatch) {
      return {
        matchScore: 0,
        keyFactors: [],
        improvementSuggestions: ['Add more specific skills', 'Specify target industry', 'Include relevant experience'],
        industryFit: 0,
        atsOptimization: 0
      };
    }

    const keyFactors = [...primaryMatch.reasons];
    const matchScore = primaryMatch.score;

    // Calculate industry fit
    const industryFit = profile.industry && primaryMatch.template.industry === profile.industry.toLowerCase() ? 90 : 60;

    // Calculate ATS optimization
    const atsOptimization = primaryMatch.template.atsScore;

    // Generate improvement suggestions
    const improvementSuggestions: string[] = [];
    if (matchScore < 80) {
      improvementSuggestions.push('Add more industry-specific keywords');
    }
    if (!profile.skills || profile.skills.length < 5) {
      improvementSuggestions.push('Include more relevant skills');
    }
    if (!profile.experienceLevel) {
      improvementSuggestions.push('Specify your experience level for better recommendations');
    }

    return {
      matchScore,
      keyFactors,
      improvementSuggestions,
      industryFit,
      atsOptimization
    };
  }

  private static generateCustomizationRecommendations(
    template: ResumeTemplate | undefined,
    profile: UserProfile,
    preferences?: RecommendationRequest['preferences']
  ): RecommendationResponse['customizations'] {
    if (!template) {
      return {
        recommendedThemes: [],
        recommendedLayouts: [],
        sectionAdjustments: []
      };
    }

    const baseRecommendations = IndustryTemplateManager.getCustomizationRecommendations(template.id, profile);

    // Generate section adjustments based on profile
    const sectionAdjustments: RecommendationResponse['customizations']['sectionAdjustments'] = [];

    template.sections.forEach(section => {
      if (section.id === 'education' && profile.experienceLevel === 'senior') {
        sectionAdjustments.push({
          sectionId: section.id,
          action: 'reorder',
          reason: 'Move education below experience for senior positions'
        });
      }

      if (section.id === 'skills' && profile.experienceLevel === 'entry') {
        sectionAdjustments.push({
          sectionId: section.id,
          action: 'show',
          reason: 'Skills section is important for entry-level positions'
        });
      }

      if (section.id === 'projects' && profile.skills?.some(skill => skill.toLowerCase().includes('software'))) {
        sectionAdjustments.push({
          sectionId: section.id,
          action: 'show',
          reason: 'Projects are important for technical roles'
        });
      }
    });

    return {
      recommendedThemes: baseRecommendations.colorThemes,
      recommendedLayouts: baseRecommendations.layoutPresets,
      sectionAdjustments
    };
  }

  private static analyzeContentQuality(resumeContent: NonNullable<RecommendationRequest['resumeContent']>): {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    missingKeywords: string[];
    formatIssues: string[];
  } {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];
    const missingKeywords: string[] = [];
    const formatIssues: string[] = [];

    // Analyze experience
    if (resumeContent.experience && resumeContent.experience.length > 0) {
      const hasQuantifiableResults = resumeContent.experience.some(exp =>
        exp.description && /\d+%|\$\d+|\d+ years/.test(exp.description)
      );

      if (hasQuantifiableResults) {
        strengths.push('Includes quantifiable achievements');
      } else {
        recommendations.push('Add quantifiable metrics to experience descriptions');
        missingKeywords.push('quantifiable results');
      }

      if (resumeContent.experience.length >= 2) {
        strengths.push('Good experience progression');
      } else if (resumeContent.experience.length === 1) {
        recommendations.push('Consider adding more experience or focusing on skills');
      }
    } else {
      weaknesses.push('No experience listed');
      recommendations.push('Add professional experience section');
    }

    // Analyze skills
    if (resumeContent.skills && resumeContent.skills.length > 0) {
      if (resumeContent.skills.length >= 10) {
        strengths.push('Comprehensive skills list');
      } else {
        recommendations.push('Add more relevant skills to strengthen profile');
        missingKeywords.push('additional skills');
      }
    } else {
      weaknesses.push('No skills listed');
      recommendations.push('Add skills section with relevant technical and soft skills');
    }

    // Analyze education
    if (resumeContent.education && resumeContent.education.length > 0) {
      strengths.push('Education information included');
    } else {
      recommendations.push('Add education information');
    }

    return {
      strengths,
      weaknesses,
      recommendations,
      missingKeywords,
      formatIssues
    };
  }

  private static calculateATSScore(
    resumeContent: NonNullable<RecommendationRequest['resumeContent']>,
    template?: ResumeTemplate
  ): number {
    let score = 50; // Base score

    // Content completeness
    if (resumeContent.experience?.length) score += 15;
    if (resumeContent.skills?.length && resumeContent.skills.length >= 5) score += 15;
    if (resumeContent.education?.length) score += 10;

    // ATS-friendly formatting (template-based)
    if (template) {
      score += template.atsScore * 0.4;
    }

    // Keyword optimization
    const allText = [
      ...resumeContent.experience?.map(exp => exp.description || '') || [],
      ...resumeContent.skills || [],
      ...resumeContent.education?.map(edu => `${edu.degree} ${edu.field}`) || []
    ].join(' ').toLowerCase();

    const atsKeywords = [
      'managed', 'developed', 'implemented', 'created', 'led', 'coordinated',
      'achieved', 'improved', 'increased', 'decreased', 'reduced', 'optimized'
    ];

    const keywordMatches = atsKeywords.filter(keyword => allText.includes(keyword)).length;
    score += (keywordMatches / atsKeywords.length) * 10;

    return Math.round(Math.min(100, score));
  }

  private static inferIndustryFromText(text: string): string {
    const industryPatterns: Record<string, RegExp[]> = {
      technology: [/software|programming|development|coding|api|database|cloud|tech/gi],
      healthcare: [/patient|medical|clinical|healthcare|nursing|hospital|treatment/gi],
      finance: [/financial|investment|banking|portfolio|risk|compliance|accounting/gi],
      creative: [/design|creative|marketing|brand|advertising|content|social media/gi],
      education: [/teaching|education|curriculum|student|academic|research|classroom/gi]
    };

    for (const [industry, patterns] of Object.entries(industryPatterns)) {
      if (patterns.some(pattern => pattern.test(text))) {
        return industry;
      }
    }

    return '';
  }

  private static estimateExperienceLevel(
    experience: Array<{ duration?: string }>
  ): 'entry' | 'mid' | 'senior' | 'executive' {
    // Simple heuristic based on number of positions
    if (experience.length >= 5) return 'senior';
    if (experience.length >= 3) return 'mid';
    if (experience.length >= 1) return 'entry';
    return 'entry';
  }

  private static getIndustryOverview(industry: string): string {
    const overviews: Record<string, string> = {
      technology: 'Fast-paced industry emphasizing technical skills, innovation, and measurable results',
      healthcare: 'Regulated industry focusing on patient care, clinical expertise, and professional credentials',
      finance: 'Conservative industry valuing analytical skills, risk management, and regulatory compliance',
      creative: 'Dynamic industry prioritizing portfolio work, creativity, and campaign results',
      education: 'Academic industry emphasizing research, teaching experience, and scholarly contributions'
    };

    return overviews[industry.toLowerCase()] || 'Professional industry with specific skill requirements and expectations';
  }

  private static getIndustryCharacteristics(industry: string): string[] {
    const characteristics: Record<string, string[]> = {
      technology: ['Technical focus', 'Rapid innovation', 'Quantifiable results', 'Project-based work'],
      healthcare: ['Patient-centric', 'Highly regulated', 'Credential-focused', 'Clinical expertise'],
      finance: ['Analytical rigor', 'Risk awareness', 'Regulatory compliance', 'Quantitative focus'],
      creative: ['Visual appeal', 'Portfolio-driven', 'Brand awareness', 'Campaign metrics'],
      education: ['Research emphasis', 'Academic credentials', 'Teaching experience', 'Scholarly output']
    };

    return characteristics[industry.toLowerCase()] || ['Professional standards', 'Industry expertise', 'Continued learning'];
  }

  private static getIndustryPitfalls(industry: string): string[] {
    const pitfalls: Record<string, string[]> = {
      technology: ['Over-technical jargon', 'Missing quantifiable results', 'Outdated skills'],
      healthcare: ['Missing license numbers', 'Outdated certifications', 'Insufficient clinical details'],
      finance: ['Lack of quantifiable achievements', 'Missing compliance details', 'Poor formatting'],
      creative: ['Overly creative formatting', 'Missing metrics', 'Weak ATS optimization'],
      education: ['Incomplete publication list', 'Missing research impact', 'Poor structure']
    };

    return pitfalls[industry.toLowerCase()] || ['Generic content', 'Poor formatting', 'Missing keywords'];
  }

  private static getIndustryBestPractices(industry: string): string[] {
    const practices: Record<string, string[]> = {
      technology: ['Include technical stack', 'Quantify project impact', 'Show continuous learning'],
      healthcare: ['List all certifications', 'Include license numbers', 'Show patient outcomes'],
      finance: ['Quantify financial results', 'Include relevant certifications', 'Maintain conservative format'],
      creative: ['Balance creativity with ATS', 'Include portfolio links', 'Show campaign metrics'],
      education: ['List publications properly', 'Include research funding', 'Show teaching effectiveness']
    };

    return practices[industry.toLowerCase()] || ['Tailor content to role', 'Quantify achievements', 'Maintain professional format'];
  }

  private static getIndustrySkillEmphasis(industry: string): Array<{ skill: string; importance: number; description: string }> {
    const emphases: Record<string, Array<{ skill: string; importance: number; description: string }>> = {
      technology: [
        { skill: 'Programming Languages', importance: 95, description: 'Core technical competency' },
        { skill: 'System Architecture', importance: 85, description: 'Design and scalability skills' },
        { skill: 'Cloud Technologies', importance: 90, description: 'Modern infrastructure expertise' }
      ],
      healthcare: [
        { skill: 'Clinical Skills', importance: 98, description: 'Direct patient care capabilities' },
        { skill: 'Medical Knowledge', importance: 95, description: 'Domain expertise' },
        { skill: 'Regulatory Compliance', importance: 90, description: 'Industry requirements' }
      ],
      finance: [
        { skill: 'Financial Analysis', importance: 95, description: 'Core analytical competency' },
        { skill: 'Risk Management', importance: 90, description: 'Risk assessment skills' },
        { skill: 'Regulatory Knowledge', importance: 85, description: 'Compliance expertise' }
      ],
      creative: [
        { skill: 'Design Software', importance: 90, description: 'Technical creative tools' },
        { skill: 'Brand Development', importance: 85, description: 'Strategic creative thinking' },
        { skill: 'Campaign Analytics', importance: 80, description: 'Measuring creative impact' }
      ],
      education: [
        { skill: 'Research Methods', importance: 95, description: 'Academic inquiry skills' },
        { skill: 'Curriculum Development', importance: 90, description: 'Educational design' },
        { skill: 'Academic Writing', importance: 85, description: 'Scholarly communication' }
      ]
    };

    return emphases[industry.toLowerCase()] || [
      { skill: 'Communication', importance: 85, description: 'Professional communication' },
      { skill: 'Problem Solving', importance: 80, description: 'Analytical thinking' },
      { skill: 'Team Collaboration', importance: 75, description: 'Working with others' }
    ];
  }

  private static getTemplateStrengths(template: ResumeTemplate): string[] {
    const strengths: string[] = [];

    if (template.atsScore >= 95) strengths.push('Excellent ATS optimization');
    if (template.layout.type === 'two-column') strengths.push('Modern two-column layout');
    if (template.tags.includes('creative')) strengths.push('Creative design elements');
    if (template.tags.includes('professional')) strengths.push('Professional appearance');
    if (template.customization.colorThemes.length >= 4) strengths.push('Multiple color options');

    return strengths;
  }

  private static getTemplateWeaknesses(template: ResumeTemplate): string[] {
    const weaknesses: string[] = [];

    if (template.atsScore < 90) weaknesses.push('Lower ATS optimization score');
    if (template.customization.colorThemes.length < 3) weaknesses.push('Limited color options');
    if (template.sections.length < 6) weaknesses.push('Fewer section options');
    if (!template.tags.includes('modern')) weaknesses.push('Traditional design');

    return weaknesses;
  }

  private static calculateFlexibilityScore(template: ResumeTemplate): number {
    let score = 50;

    score += template.customization.colorThemes.length * 5;
    score += template.customization.fontCombinations.length * 5;
    score += template.customization.layoutPresets.length * 10;
    score += Object.keys(template.customization.customSections.allowed).length * 3;

    return Math.min(100, score);
  }

  private static getBestOverallTemplate(comparison: RecommendationResponse['comparison']): string | null {
    const best = comparison.reduce((prev, current) => {
      const prevScore = (prev.atsScore + prev.flexibilityScore) / 2;
      const currentScore = (current.atsScore + current.flexibilityScore) / 2;
      return currentScore > prevScore ? current : prev;
    });

    return best.template.id;
  }

  private static getBestATSTemplate(comparison: RecommendationResponse['comparison']): string | null {
    const best = comparison.reduce((prev, current) =>
      current.atsScore > prev.atsScore ? current : prev
    );

    return best.template.id;
  }

  private static getMostFlexibleTemplate(comparison: RecommendationResponse['comparison']): string | null {
    const best = comparison.reduce((prev, current) =>
      current.flexibilityScore > prev.flexibilityScore ? current : prev
    );

    return best.template.id;
  }

  private static getMostModernTemplate(comparison: RecommendationResponse['comparison']): string | null {
    const modern = comparison.find(item =>
      item.template.tags.includes('modern') ||
      item.template.layout.type === 'two-column'
    );

    return modern?.template.id || null;
  }
}