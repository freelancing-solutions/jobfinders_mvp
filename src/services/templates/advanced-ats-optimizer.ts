/**
 * Advanced ATS Optimization Service
 *
 * Comprehensive ATS (Applicant Tracking System) optimization service
 * that provides real-time analysis, scoring, and optimization
 * recommendations for resume templates and content.
 */

import { ResumeTemplate, TemplateCustomization, Resume } from '@/types/resume';
import { templateService } from '@/services/templates/template-service';

export interface ATSOptimizationRequest {
  resume: Resume;
  template: ResumeTemplate;
  customization?: TemplateCustomization;
  jobDescription?: string;
  targetCompany?: string;
  industry?: string;
  experienceLevel?: string;
}

export interface ATSOptimizationResult {
  overallScore: number;
  scoreBreakdown: ScoreBreakdown;
  compatibility: ATSCompatibility;
  optimizations: ATSOptimization[];
  warnings: ATSWarning[];
  recommendations: ATSRecommendation[];
  benchmarkComparison: BenchmarkComparison;
  detailedAnalysis: DetailedAnalysis;
}

export interface ScoreBreakdown {
  formatting: number;
  keywords: number;
  structure: number;
  readability: number;
  completeness: number;
  relevance: number;
}

export interface ATSCompatibility {
  systems: ATSSystem[];
  overallCompatibility: number;
  potentialIssues: string[];
  guaranteedParsing: boolean;
}

export interface ATSSystem {
  name: string;
  marketShare: number;
  compatibility: number;
  specificIssues: string[];
  recommendations: string[];
}

export interface ATSOptimization {
  type: 'formatting' | 'keyword' | 'structure' | 'content';
  priority: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  action: string;
  impact: number;
  implementation: any;
}

export interface ATSWarning {
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  location: string;
  resolution: string;
}

export interface ATSRecommendation {
  category: 'format' | 'content' | 'keywords' | 'structure';
  recommendation: string;
  reasoning: string;
  expectedImpact: number;
  difficulty: 'easy' | 'moderate' | 'complex';
}

export interface BenchmarkComparison {
  industryAverage: number;
  topPerformers: number;
  yourScore: number;
  percentile: number;
  improvements: string[];
}

export interface DetailedAnalysis {
  sectionAnalysis: SectionAnalysis[];
  keywordAnalysis: KeywordAnalysis;
  formattingAnalysis: FormattingAnalysis;
  structureAnalysis: StructureAnalysis;
  contentAnalysis: ContentAnalysis;
}

export interface SectionAnalysis {
  section: string;
  score: number;
  issues: string[];
  optimizations: string[];
  bestPractices: string[];
}

export interface KeywordAnalysis {
  totalKeywords: number;
  relevantKeywords: string[];
  missingKeywords: string[];
  keywordDensity: Record<string, number>;
  keywordPlacement: KeywordPlacement[];
}

export interface KeywordPlacement {
  keyword: string;
  locations: string[];
  density: number;
  importance: 'high' | 'medium' | 'low';
}

export interface FormattingAnalysis {
  issues: FormattingIssue[];
  recommendations: string[];
  complianceScore: number;
  readabilityScore: number;
}

export interface FormattingIssue {
  type: 'font' | 'spacing' | 'layout' | 'formatting' | 'structure';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  location: string;
  fix: string;
}

export interface StructureAnalysis {
  sectionOrder: string[];
  missingSections: string[];
  redundantSections: string[];
  recommendations: string[];
  optimalOrder: string[];
}

export interface ContentAnalysis {
  actionVerbs: ActionVerbAnalysis;
  quantifiableResults: QuantifiableResultsAnalysis;
  impactLanguage: ImpactLanguageAnalysis;
  achievements: AchievementAnalysis;
}

export interface ActionVerbAnalysis {
  count: number;
  strengthScore: number;
  recommendedVerbs: string[];
  weakVerbs: string[];
}

export interface QuantifiableResultsAnalysis {
  metricsFound: number;
  impactScore: number;
  missingMetrics: string[];
  suggestedAdditions: string[];
}

export interface ImpactLanguageAnalysis {
  score: number;
  strongPhrases: string[];
  weakPhrases: string[];
  improvements: string[];
}

export interface AchievementAnalysis {
  totalAchievements: number;
  impactScore: number;
  categorizedAchievements: Record<string, string[]>;
  missingCategories: string[];
}

export class AdvancedATSOptimizer {
  private readonly ATS_SYSTEMS = [
    { name: 'Taleo', marketShare: 0.18, commonIssues: ['Table parsing', 'Image parsing'] },
    { name: 'Workday', marketShare: 0.15, commonIssues: ['Section detection', 'Date parsing'] },
    { name: 'iCIMS', marketShare: 0.12, commonIssues: ['Font rendering', 'Layout interpretation'] },
    { name: 'Greenhouse', marketShare: 0.10, commonIssues: ['Contact info parsing', 'Skills extraction'] },
    { name: 'Lever', marketShare: 0.08, commonIssues: ['Experience parsing', 'Education detection'] },
    { name: 'SmartRecruiters', marketShare: 0.07, commonIssues: ['Multi-column layout', 'Custom sections'] },
    { name: 'ApplicantPro', marketShare: 0.06, commonIssues: ['PDF rendering', 'Character encoding'] },
    { name: 'Jobvite', marketShare: 0.05, commonIssues: ['Work history parsing', 'Skills recognition'] }
  ];

  private readonly KEYWORD_CATEGORIES = {
    technical: ['javascript', 'python', 'react', 'node.js', 'aws', 'docker', 'kubernetes', 'sql', 'git', 'agile'],
    business: ['management', 'leadership', 'strategy', 'analysis', 'development', 'growth', 'revenue', 'budget'],
    soft_skills: ['communication', 'teamwork', 'leadership', 'problem-solving', 'adaptability', 'time management', 'collaboration'],
    action_verbs: ['managed', 'developed', 'implemented', 'created', 'led', 'achieved', 'improved', 'optimized', 'designed', 'coordinated']
  };

  private readonly ATS_FRIENDLY_FONTS = [
    'Arial', 'Calibri', 'Georgia', 'Helvetica', 'Times New Roman', 'Verdana', 'Cambria', 'Garamond'
  ];

  private readonly SECTION_ORDER = [
    'Contact Information',
    'Professional Summary',
    'Experience',
    'Education',
    'Skills',
    'Projects',
    'Certifications',
    'Awards',
    'Publications'
  ];

  /**
   * Perform comprehensive ATS optimization analysis
   */
  async optimizeForATS(request: ATSOptimizationRequest): Promise<ATSOptimizationResult> {
    try {
      const [
        scoreBreakdown,
        compatibility,
        optimizations,
        warnings,
        recommendations,
        benchmarkComparison,
        detailedAnalysis
      ] = await Promise.all([
        this.calculateScoreBreakdown(request),
        this.analyzeATSCompatibility(request),
        this.generateOptimizations(request),
        this.identifyWarnings(request),
        this.generateRecommendations(request),
        this.performBenchmarkComparison(request),
        this.performDetailedAnalysis(request)
      ]);

      const overallScore = this.calculateOverallScore(scoreBreakdown);

      return {
        overallScore,
        scoreBreakdown,
        compatibility,
        optimizations,
        warnings,
        recommendations,
        benchmarkComparison,
        detailedAnalysis
      };
    } catch (error) {
      console.error('ATS optimization failed:', error);
      throw new Error('ATS optimization service unavailable');
    }
  }

  /**
   * Get real-time ATS scoring as user types
   */
  async getRealTimeATSScore(
    content: string,
    section: string,
    context: {
      industry?: string;
      experienceLevel?: string;
      jobDescription?: string;
    }
  ): Promise<{
    score: number;
    issues: string[];
    suggestions: string[];
    keywordMatches: string[];
  }> {
    try {
      const score = this.calculateSectionScore(content, section, context);
      const issues = this.identifySectionIssues(content, section);
      const suggestions = this.generateSectionSuggestions(content, section, context);
      const keywordMatches = this.extractKeywordMatches(content, context);

      return {
        score,
        issues,
        suggestions,
        keywordMatches
      };
    } catch (error) {
      console.error('Real-time ATS scoring failed:', error);
      return {
        score: 0,
        issues: ['Scoring unavailable'],
        suggestions: [],
        keywordMatches: []
      };
    }
  }

  /**
   * Generate ATS-friendly template version
   */
  async generateATSFriendlyVersion(
    template: ResumeTemplate,
    customization: TemplateCustomization
  ): Promise<{
    optimizedTemplate: ResumeTemplate;
    optimizedCustomization: TemplateCustomization;
    changes: string[];
    scoreImprovement: number;
  }> {
    try {
      const changes: string[] = [];
      let scoreImprovement = 0;

      // Clone and optimize template
      const optimizedTemplate = { ...template };
      const optimizedCustomization = { ...customization };

      // Optimize typography
      if (!this.isATSFriendlyFont(customization.typography?.heading?.fontFamily)) {
        optimizedCustomization.typography = {
          ...customization.typography,
          heading: {
            ...customization.typography.heading,
            fontFamily: 'Arial'
          },
          body: {
            ...customization.typography.body,
            fontFamily: 'Arial'
          }
        };
        changes.push('Changed font to ATS-friendly Arial');
        scoreImprovement += 15;
      }

      // Optimize layout
      if (template.layout?.columns?.count && template.layout.columns.count > 2) {
        optimizedTemplate.layout = {
          ...template.layout,
          columns: { count: 2, widths: [60, 40], gutters: 20 }
        };
        changes.push('Reduced columns to 2 for better ATS parsing');
        scoreImprovement += 10;
      }

      // Optimize colors
      if (customization.colorScheme?.background && customization.colorScheme.background !== '#ffffff') {
        optimizedCustomization.colorScheme = {
          ...customization.colorScheme,
          background: '#ffffff',
          text: '#000000'
        };
        changes.push('Set background to white and text to black for maximum contrast');
        scoreImprovement += 8;
      }

      // Ensure proper section structure
      if (!template.sections || template.sections.length === 0) {
        optimizedTemplate.sections = [
          { id: 'contact', type: 'header', title: 'Contact Information' },
          { id: 'summary', type: 'section', title: 'Professional Summary' },
          { id: 'experience', type: 'section', title: 'Work Experience' },
          { id: 'education', type: 'section', title: 'Education' },
          { id: 'skills', type: 'section', title: 'Skills' }
        ];
        changes.push('Added standard ATS-friendly sections');
        scoreImprovement += 20;
      }

      return {
        optimizedTemplate,
        optimizedCustomization,
        changes,
        scoreImprovement
      };
    } catch (error) {
      console.error('ATS-friendly version generation failed:', error);
      throw new Error('Unable to generate ATS-friendly version');
    }
  }

  // Private helper methods

  private async calculateScoreBreakdown(request: ATSOptimizationRequest): Promise<ScoreBreakdown> {
    return {
      formatting: this.calculateFormattingScore(request),
      keywords: this.calculateKeywordScore(request),
      structure: this.calculateStructureScore(request),
      readability: this.calculateReadabilityScore(request),
      completeness: this.calculateCompletenessScore(request),
      relevance: this.calculateRelevanceScore(request)
    };
  }

  private calculateFormattingScore(request: ATSOptimizationRequest): number {
    let score = 50;

    // Check font compatibility
    if (this.isATSFriendlyFont(request.customization?.typography?.heading?.fontFamily)) {
      score += 15;
    }

    // Check layout complexity
    if (request.template.layout?.columns?.count && request.template.layout.columns.count <= 2) {
      score += 15;
    }

    // Check color contrast
    if (request.customization?.colorScheme?.background === '#ffffff') {
      score += 10;
    }

    // Check for tables or graphics
    if (this.hasComplexFormatting(request.template)) {
      score -= 20;
    }

    return Math.max(0, Math.min(100, score));
  }

  private calculateKeywordScore(request: ATSOptimizationRequest): number {
    if (!request.jobDescription) return 50;

    const resumeText = this.extractTextFromResume(request.resume);
    const jobKeywords = this.extractKeywords(request.jobDescription);
    const matches = jobKeywords.filter(keyword => resumeText.toLowerCase().includes(keyword.toLowerCase()));

    return Math.min(100, (matches.length / Math.max(jobKeywords.length, 1)) * 100);
  }

  private calculateStructureScore(request: ATSOptimizationRequest): number {
    let score = 50;

    // Check section order
    const currentOrder = this.getCurrentSectionOrder(request.resume);
    const orderMatches = this.calculateSectionOrderMatch(currentOrder);
    score += orderMatches * 20;

    // Check for required sections
    const requiredSections = ['personalInfo', 'experience', 'education', 'skills'];
    const hasRequiredSections = requiredSections.every(section => this.hasSection(request.resume, section));
    if (hasRequiredSections) {
      score += 30;
    }

    return Math.max(0, Math.min(100, score));
  }

  private calculateReadabilityScore(request: ATSOptimizationRequest): number {
    let score = 70;

    const resumeText = this.extractTextFromResume(request.resume);
    const sentences = resumeText.split(/[.!?]+/).filter(s => s.trim().length > 0);

    // Check sentence length
    const avgSentenceLength = sentences.reduce((sum, sentence) => sum + sentence.split(' ').length, 0) / sentences.length;
    if (avgSentenceLength > 25) {
      score -= 10;
    }

    // Check for jargon and abbreviations
    const jargonCount = this.countJargon(resumeText);
    if (jargonCount > 5) {
      score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  private calculateCompletenessScore(request: ATSOptimizationRequest): number {
    const required = ['personalInfo', 'summary', 'experience', 'education', 'skills'];
    let score = 0;
    let total = required.length;

    required.forEach(section => {
      if (this.hasSection(request.resume, section)) {
        score += 20;
      }
    });

    return score;
  }

  private calculateRelevanceScore(request: ATSOptimizationRequest): number {
    if (!request.jobDescription || !request.industry) return 50;

    // Calculate relevance based on industry and job description match
    const industryKeywords = this.KEYWORD_CATEGORIES[request.industry as keyof typeof KEYWORD_CATEGORIES] || [];
    const resumeText = this.extractTextFromResume(request.resume).toLowerCase();
    const matches = industryKeywords.filter(keyword => resumeText.includes(keyword.toLowerCase()));

    return Math.min(100, (matches.length / Math.max(industryKeywords.length, 1)) * 100);
  }

  private async analyzeATSCompatibility(request: ATSOptimizationRequest): Promise<ATSCompatibility> {
    const systems: ATSSystem[] = this.ATS_SYSTEMS.map(atsSystem => ({
      ...atsSystem,
      compatibility: this.calculateSystemCompatibility(request, atsSystem),
      specificIssues: this.identifySystemIssues(request, atsSystem),
      recommendations: this.generateSystemRecommendations(request, atsSystem)
    }));

    const overallCompatibility = systems.reduce((sum, system) => sum + (system.compatibility * system.marketShare), 0);

    return {
      systems,
      overallCompatibility,
      potentialIssues: this.identifyCommonIssues(request),
      guaranteedParsing: overallCompatibility > 0.8
    };
  }

  private async generateOptimizations(request: ATSOptimizationRequest): Promise<ATSOptimization[]> {
    const optimizations: ATSOptimization[] = [];

    // Formatting optimizations
    if (!this.isATSFriendlyFont(request.customization?.typography?.heading?.fontFamily)) {
      optimizations.push({
        type: 'formatting',
        priority: 'high',
        description: 'Use ATS-friendly fonts',
        action: 'Change font to Arial, Calibri, or Georgia',
        impact: 15,
        implementation: { fontFamily: 'Arial' }
      });
    }

    // Keyword optimizations
    if (request.jobDescription) {
      const missingKeywords = this.findMissingKeywords(request.resume, request.jobDescription);
      if (missingKeywords.length > 0) {
        optimizations.push({
          type: 'keyword',
          priority: 'high',
          description: 'Add missing keywords from job description',
          action: `Include keywords: ${missingKeywords.join(', ')}`,
          impact: 20,
          implementation: { keywords: missingKeywords }
        });
      }
    }

    // Structure optimizations
    const missingSections = this.findMissingSections(request.resume);
    if (missingSections.length > 0) {
      optimizations.push({
        type: 'structure',
        priority: 'medium',
        description: 'Add missing standard sections',
        action: `Include sections: ${missingSections.join(', ')}`,
        impact: 10,
        implementation: { sections: missingSections }
      });
    }

    return optimizations;
  }

  private async identifyWarnings(request: ATSOptimizationRequest): Promise<ATSWarning[]> {
    const warnings: ATSWarning[] = [];

    // Check for common ATS issues
    if (this.hasComplexFormatting(request.template)) {
      warnings.push({
        severity: 'high',
        message: 'Complex formatting may cause parsing issues',
        location: 'Template layout',
        resolution: 'Simplify layout and avoid tables or graphics'
      });
    }

    if (this.hasInsufficientContactInfo(request.resume)) {
      warnings.push({
        severity: 'critical',
        message: 'Missing or incomplete contact information',
        location: 'Personal information',
        resolution: 'Add complete contact details including email and phone'
      });
    }

    if (this.hasInsufficientExperience(request.resume)) {
      warnings.push({
        severity: 'medium',
        message: 'Limited work experience details',
        location: 'Experience section',
        resolution: 'Add more details about your roles and achievements'
      });
    }

    return warnings;
  }

  private async generateRecommendations(request: ATSOptimizationRequest): Promise<ATSRecommendation[]> {
    const recommendations: ATSRecommendation[] = [];

    // Format recommendations
    recommendations.push({
      category: 'format',
      recommendation: 'Use standard chronological format',
      reasoning: 'Most ATS systems are trained to recognize this format',
      expectedImpact: 15,
      difficulty: 'easy'
    });

    // Content recommendations
    recommendations.push({
      category: 'content',
      recommendation: 'Include quantifiable achievements',
      reasoning: 'Numbers and metrics make your impact clearer',
      expectedImpact: 20,
      difficulty: 'moderate'
    });

    // Keyword recommendations
    if (request.jobDescription) {
      recommendations.push({
        category: 'keywords',
        recommendation: 'Mirror language from job description',
        reasoning: 'Improves keyword matching and relevance scoring',
        expectedImpact: 25,
        difficulty: 'easy'
      });
    }

    return recommendations;
  }

  private async performBenchmarkComparison(request: ATSOptimizationRequest): Promise<BenchmarkComparison> {
    const industryAverage = 75; // Would be calculated from actual data
    const topPerformers = 90; // Would be calculated from actual data
    const yourScore = 50; // Would be calculated from current analysis
    const percentile = ((yourScore - 50) / 40) * 100; // Simplified calculation

    return {
      industryAverage,
      topPerformers,
      yourScore,
      percentile: Math.max(0, Math.min(100, percentile)),
      improvements: [
        'Add quantifiable achievements',
        'Include more relevant keywords',
        'Optimize formatting for ATS compatibility'
      ]
    };
  }

  private async performDetailedAnalysis(request: ATSOptimizationRequest): Promise<DetailedAnalysis> {
    return {
      sectionAnalysis: this.analyzeSections(request.resume),
      keywordAnalysis: this.analyzeKeywords(request.resume, request.jobDescription),
      formattingAnalysis: this.analyzeFormatting(request.template, request.customization),
      structureAnalysis: this.analyzeStructure(request.resume),
      contentAnalysis: this.analyzeContent(request.resume)
    };
  }

  // Helper methods for analysis

  private analyzeSections(resume: Resume): SectionAnalysis[] {
    const analyses: SectionAnalysis[] = [];

    // Analyze summary
    if (resume.summary) {
      analyses.push({
        section: 'summary',
        score: this.analyzeSummary(resume.summary),
        issues: this.identifySummaryIssues(resume.summary),
        optimizations: this.getSummaryOptimizations(resume.summary),
        bestPractices: this.getSummaryBestPractices()
      });
    }

    // Analyze experience
    if (resume.experience) {
      analyses.push({
        section: 'experience',
        score: this.analyzeExperience(resume.experience),
        issues: this.identifyExperienceIssues(resume.experience),
        optimizations: this.getExperienceOptimizations(resume.experience),
        bestPractices: this.getExperienceBestPractices()
      });
    }

    return analyses;
  }

  private analyzeKeywords(resume: Resume, jobDescription?: string): KeywordAnalysis {
    const resumeText = this.extractTextFromResume(resume);
    const allKeywords = Object.values(this.KEYWORD_CATEGORIES).flat();

    const relevantKeywords = allKeywords.filter(keyword =>
      resumeText.toLowerCase().includes(keyword.toLowerCase())
    );

    const missingKeywords = jobDescription
      ? this.findMissingKeywords(resume, jobDescription)
      : [];

    const keywordDensity: Record<string, number> = {};
    relevantKeywords.forEach(keyword => {
      const regex = new RegExp(keyword, 'gi');
      const matches = resumeText.match(regex);
      keywordDensity[keyword] = matches ? matches.length : 0;
    });

    const keywordPlacement: KeywordPlacement[] = relevantKeywords.map(keyword => ({
      keyword,
      locations: this.findKeywordLocations(resume, keyword),
      density: keywordDensity[keyword] / resumeText.split(' ').length,
      importance: this.getKeywordImportance(keyword)
    }));

    return {
      totalKeywords: relevantKeywords.length,
      relevantKeywords,
      missingKeywords,
      keywordDensity,
      keywordPlacement
    };
  }

  private analyzeFormatting(template: ResumeTemplate, customization?: TemplateCustomization): FormattingAnalysis {
    const issues: FormattingIssue[] = [];
    const recommendations: string[] = [];

    // Check font issues
    if (customization?.typography?.heading?.fontFamily) {
      if (!this.isATSFriendlyFont(customization.typography.heading.fontFamily)) {
        issues.push({
          type: 'font',
          severity: 'high',
          description: 'Non-ATS friendly font detected',
          location: 'Typography settings',
          fix: 'Change to Arial, Calibri, or Georgia'
        });
      }
    }

    // Check layout issues
    if (template.layout?.columns?.count && template.layout.columns.count > 2) {
      issues.push({
        type: 'layout',
        severity: 'medium',
        description: 'Complex multi-column layout',
        location: 'Template layout',
        fix: 'Simplify to single or two-column layout'
      });
    }

    return {
      issues,
      recommendations,
      complianceScore: Math.max(0, 100 - (issues.length * 10)),
      readabilityScore: this.calculateFormattingReadability(template, customization)
    };
  }

  private analyzeStructure(resume: Resume): StructureAnalysis {
    const currentOrder = this.getCurrentSectionOrder(resume);
    const missingSections = this.findMissingSections(resume);
    const redundantSections = this.findRedundantSections(resume);

    return {
      sectionOrder: currentOrder,
      missingSections,
      redundantSections,
      recommendations: this.getStructureRecommendations(missingSections, redundantSections),
      optimalOrder: this.SECTION_ORDER
    };
  }

  private analyzeContent(resume: Resume): ContentAnalysis {
    return {
      actionVerbs: this.analyzeActionVerbs(resume),
      quantifiableResults: this.analyzeQuantifiableResults(resume),
      impactLanguage: this.analyzeImpactLanguage(resume),
      achievements: this.analyzeAchievements(resume)
    };
  }

  private analyzeActionVerbs(resume: Resume): ActionVerbAnalysis {
    const resumeText = this.extractTextFromResume(resume);
    const actionVerbs = this.KEYWORD_CATEGORIES.action_verbs;
    const usedVerbs = actionVerbs.filter(verb => resumeText.toLowerCase().includes(verb));

    return {
      count: usedVerbs.length,
      strengthScore: this.calculateActionVerbStrength(usedVerbs, resumeText),
      recommendedVerbs: this.getRecommendedActionVerbs(),
      weakVerbs: this.getWeakActionVerbs(resumeText)
    };
  }

  private analyzeQuantifiableResults(resume: Resume): QuantifiableResultsAnalysis {
    const resumeText = this.extractTextFromResume(resume);
    const metrics = resumeText.match(/\d+%|\$\d+|\d+\s+(years|months|people|teams)/gi) || [];

    return {
      metricsFound: metrics.length,
      impactScore: Math.min(100, metrics.length * 10),
      missingMetrics: this.findMissingMetrics(resume),
      suggestedAdditions: this.getSuggestedMetricAdditions(resume)
    };
  }

  private analyzeImpactLanguage(resume: Resume): ImpactLanguageAnalysis {
    const resumeText = this.extractTextFromResume(resume);
    const strongPhrases = this.findStrongPhrases(resumeText);
    const weakPhrases = this.findWeakPhrases(resumeText);

    return {
      score: this.calculateImpactScore(strongPhrases, weakPhrases),
      strongPhrases,
      weakPhrases,
      improvements: this.getImpactImprovements(weakPhrases)
    };
  }

  private analyzeAchievements(resume: Resume): AchievementAnalysis {
    const achievements = this.extractAchievements(resume);

    return {
      totalAchievements: achievements.length,
      impactScore: this.calculateAchievementImpact(achievements),
      categorizedAchievements: this.categorizeAchievements(achievements),
      missingCategories: this.findMissingAchievementCategories(resume)
    };
  }

  // Utility methods

  private calculateOverallScore(breakdown: ScoreBreakdown): number {
    return (
      breakdown.formatting * 0.2 +
      breakdown.keywords * 0.25 +
      breakdown.structure * 0.2 +
      breakdown.readability * 0.15 +
      breakdown.completeness * 0.1 +
      breakdown.relevance * 0.1
    );
  }

  private isATSFriendlyFont(font?: string): boolean {
    if (!font) return false;
    return this.ATS_FRIENDLY_FONTS.some(atsFont =>
      font.toLowerCase().includes(atsFont.toLowerCase())
    );
  }

  private hasComplexFormatting(template: ResumeTemplate): boolean {
    // Check for tables, graphics, or complex layouts
    return template.layout?.columns?.count && template.layout.columns.count > 2;
  }

  private extractTextFromResume(resume: Resume): string {
    return `
      ${resume.personalInfo?.fullName || ''}
      ${resume.summary || ''}
      ${resume.experience?.map(exp => exp.description || '').join(' ') || ''}
      ${resume.education?.map(edu => edu.degree || '').join(' ') || ''}
      ${resume.skills?.map(skill => skill.name || '').join(' ') || ''}
    `.toLowerCase();
  }

  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase().split(/\s+/);
    return words.filter(word => word.length > 3);
  }

  private findMissingKeywords(resume: Resume, jobDescription: string): string[] {
    const jobKeywords = this.extractKeywords(jobDescription);
    const resumeText = this.extractTextFromResume(resume);

    return jobKeywords.filter(keyword => !resumeText.includes(keyword));
  }

  private getCurrentSectionOrder(resume: Resume): string[] {
    const order: string[] = [];

    if (resume.personalInfo) order.push('Contact Information');
    if (resume.summary) order.push('Professional Summary');
    if (resume.experience && resume.experience.length > 0) order.push('Experience');
    if (resume.education && resume.education.length > 0) order.push('Education');
    if (resume.skills && resume.skills.length > 0) order.push('Skills');
    if (resume.projects && resume.projects.length > 0) order.push('Projects');
    if (resume.certifications && resume.certifications.length > 0) order.push('Certifications');

    return order;
  }

  private calculateSectionOrderMatch(currentOrder: string[]): number {
    let matches = 0;
    for (let i = 0; i < Math.min(currentOrder.length, this.SECTION_ORDER.length); i++) {
      if (currentOrder[i] === this.SECTION_ORDER[i]) {
        matches++;
      }
    }
    return matches / Math.max(currentOrder.length, 1);
  }

  private hasSection(resume: Resume, section: string): boolean {
    switch (section) {
      case 'personalInfo':
        return !!resume.personalInfo;
      case 'summary':
        return !!resume.summary;
      case 'experience':
        return !!(resume.experience && resume.experience.length > 0);
      case 'education':
        return !!(resume.education && resume.education.length > 0);
      case 'skills':
        return !!(resume.skills && resume.skills.length > 0);
      default:
        return false;
    }
  }

  private hasInsufficientContactInfo(resume: Resume): boolean {
    const contact = resume.personalInfo;
    return !contact || !contact.email || !contact.phone;
  }

  private hasInsufficientExperience(resume: Resume): boolean {
    return !resume.experience || resume.experience.length === 0;
  }

  private calculateSystemCompatibility(request: ATSOptimizationRequest, system: any): number {
    let compatibility = 80; // Base compatibility

    // Adjust based on specific system requirements
    if (system.name === 'Taleo' && this.hasTables(request.template)) {
      compatibility -= 30;
    }

    if (system.name === 'Workday' && this.hasCustomSections(request.resume)) {
      compatibility -= 20;
    }

    return Math.max(0, Math.min(100, compatibility));
  }

  private identifySystemIssues(request: ATSOptimizationRequest, system: any): string[] {
    const issues: string[] = [];

    if (system.commonIssues.includes('Table parsing') && this.hasTables(request.template)) {
      issues.push('Tables may not parse correctly');
    }

    return issues;
  }

  private generateSystemRecommendations(request: ATSOptimizationRequest, system: any): string[] {
    const recommendations: string[] = [];

    if (system.name === 'Taleo') {
      recommendations.push('Use simple formatting without tables');
    }

    return recommendations;
  }

  private identifyCommonIssues(request: ATSOptimizationRequest): string[] {
    const issues: string[] = [];

    if (!this.isATSFriendlyFont(request.customization?.typography?.heading?.fontFamily)) {
      issues.push('Non-standard font may cause parsing issues');
    }

    return issues;
  }

  private findMissingSections(resume: Resume): string[] {
    const missing: string[] = [];
    const required = ['summary', 'experience', 'education', 'skills'];

    required.forEach(section => {
      if (!this.hasSection(resume, section)) {
        missing.push(section.charAt(0).toUpperCase() + section.slice(1));
      }
    });

    return missing;
  }

  private findRedundantSections(resume: Resume): string[] {
    // Simplified - would analyze actual content
    return [];
  }

  private hasTables(template: ResumeTemplate): boolean {
    // Check if template uses tables
    return template.layout?.sections?.some((section: any) =>
      section.type === 'table'
    ) || false;
  }

  private hasCustomSections(resume: Resume): boolean {
    // Check for non-standard sections
    const standardSections = ['personalInfo', 'summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'languages'];
    const resumeKeys = Object.keys(resume).filter(key => resume[key as keyof Resume]);

    return resumeKeys.some(key => !standardSections.includes(key));
  }

  // Additional helper methods would go here...

  private analyzeSummary(summary: string): number {
    if (!summary) return 0;
    let score = 50;

    if (summary.length >= 50 && summary.length <= 150) score += 30;
    if (summary.split(' ').some(word => this.KEYWORD_CATEGORIES.action_verbs.includes(word.toLowerCase()))) score += 20;

    return Math.min(100, score);
  }

  private analyzeExperience(experience: any[]): number {
    if (!experience || experience.length === 0) return 0;
    let score = 50;

    experience.forEach(exp => {
      if (exp.description && exp.description.length > 50) score += 10;
    });

    return Math.min(100, score);
  }

  private identifySummaryIssues(summary: string): string[] {
    const issues: string[] = [];

    if (!summary) {
      issues.push('No professional summary provided');
    } else if (summary.length < 50) {
      issues.push('Summary is too short - aim for 50-150 words');
    } else if (summary.length > 200) {
      issues.push('Summary is too long - consider condensing');
    }

    return issues;
  }

  private getSummaryOptimizations(summary: string): string[] {
    return [
      'Start with a strong statement of your expertise',
      'Include 2-3 key achievements',
      'Tailor to the specific job you\'re applying for'
    ];
  }

  private getSummaryBestPractices(): string[] {
    return [
      'Keep it concise (50-150 words)',
      'Use professional tone',
      'Include quantifiable achievements',
      'Highlight relevant skills and experience'
    ];
  }

  private identifyExperienceIssues(experience: any[]): string[] {
    const issues: string[] = [];

    if (!experience || experience.length === 0) {
      issues.push('No work experience listed');
    }

    experience.forEach((exp, index) => {
      if (!exp.description) {
        issues.push(`Experience ${index + 1} has no description`);
      } else if (exp.description.length < 30) {
        issues.push(`Experience ${index + 1} description is too brief`);
      }
    });

    return issues;
  }

  private getExperienceOptimizations(experience: any[]): string[] {
    return [
      'Use action verbs to start bullet points',
      'Include quantifiable achievements',
      'Focus on results and impact',
      'Tailor descriptions to target job'
    ];
  }

  private getExperienceBestPractices(): string[] {
    return [
      'Use reverse chronological order',
      'Include company name and location',
      'Specify dates of employment',
      'Use bullet points for clarity'
    ];
  }

  private getStructureRecommendations(missing: string[], redundant: string[]): string[] {
    const recommendations: string[] = [];

    if (missing.length > 0) {
      recommendations.push(`Add missing sections: ${missing.join(', ')}`);
    }

    if (redundant.length > 0) {
      recommendations.push(`Consider removing redundant sections: ${redundant.join(', ')}`);
    }

    return recommendations;
  }

  private calculateActionVerbStrength(verbs: string[], text: string): number {
    if (verbs.length === 0) return 0;
    return Math.min(100, (verbs.length / 10) * 100);
  }

  private getRecommendedActionVerbs(): string[] {
    return [
      'Led', 'Managed', 'Developed', 'Implemented', 'Achieved',
      'Improved', 'Created', 'Coordinated', 'Designed', 'Optimized'
    ];
  }

  private getWeakActionVerbs(text: string): string[] {
    const weakVerbs = ['responsible for', 'worked on', 'helped with', 'participated in'];
    return weakVerbs.filter(verb => text.toLowerCase().includes(verb));
  }

  private findMissingMetrics(resume: Resume): string[] {
    const resumeText = this.extractTextFromResume(resume);
    const missingMetrics: string[] = [];

    if (!resumeText.match(/\d+%|percent/g)) missingMetrics.push('Percentage-based metrics');
    if (!resumeText.match(/\$\d+/g)) missingMetrics.push('Financial impact metrics');
    if (!resumeText.match(/\d+\s+(years|months)/g)) missingMetrics.push('Time-based metrics');

    return missingMetrics;
  }

  private getSuggestedMetricAdditions(resume: Resume): string[] {
    return [
      'Add percentage improvements (e.g., "increased efficiency by 25%")',
      'Include cost savings or revenue generation',
      'Mention project timelines or deadlines met',
      'Quantify team sizes or project scope'
    ];
  }

  private findStrongPhrases(text: string): string[] {
    const strongPhrases = [
      'proven track record',
      'consistent track record',
      'significant improvements',
      'measurable results',
      'quantifiable achievements'
    ];

    return strongPhrases.filter(phrase => text.toLowerCase().includes(phrase));
  }

  private findWeakPhrases(text: string): string[] {
    const weakPhrases = [
      'responsible for',
      'worked on',
      'helped with',
      'participated in',
      'involved in'
    ];

    return weakPhrases.filter(phrase => text.toLowerCase().includes(phrase));
  }

  private calculateImpactScore(strong: string[], weak: string[]): number {
    const baseScore = 50;
    const strongBonus = strong.length * 10;
    const weakPenalty = weak.length * 5;

    return Math.max(0, Math.min(100, baseScore + strongBonus - weakPenalty));
  }

  private getImpactImprovements(weakPhrases: string[]): string[] {
    return [
      'Replace passive language with action verbs',
      'Focus on results rather than responsibilities',
      'Use specific, quantifiable language',
      'Highlight achievements over duties'
    ];
  }

  private extractAchievements(resume: Resume): string[] {
    const achievements: string[] = [];

    if (resume.experience) {
      resume.experience.forEach(exp => {
        if (exp.description) {
          // Look for achievement indicators
          const sentences = exp.description.split(/[.!?]+/);
          sentences.forEach(sentence => {
            if (this.isAchievementSentence(sentence)) {
              achievements.push(sentence.trim());
            }
          });
        }
      });
    }

    return achievements;
  }

  private isAchievementSentence(sentence: string): boolean {
    const achievementIndicators = [
      'increased', 'decreased', 'improved', 'achieved', 'led', 'managed',
      'reduced', 'generated', 'saved', 'created', 'developed', 'implemented'
    ];

    return achievementIndicators.some(indicator =>
      sentence.toLowerCase().includes(indicator)
    );
  }

  private calculateAchievementImpact(achievements: string[]): number {
    if (achievements.length === 0) return 0;
    return Math.min(100, (achievements.length / 5) * 100);
  }

  private categorizeAchievements(achievements: string[]): Record<string, string[]> {
    const categories: Record<string, string[]> = {
      leadership: [],
      technical: [],
      financial: [],
      operational: [],
      customer: []
    };

    achievements.forEach(achievement => {
      const text = achievement.toLowerCase();

      if (text.includes('managed') || text.includes('led') || text.includes('team')) {
        categories.leadership.push(achievement);
      }

      if (text.includes('developed') || text.includes('implemented') || text.includes('created')) {
        categories.technical.push(achievement);
      }

      if (text.includes('$') || text.includes('budget') || text.includes('revenue')) {
        categories.financial.push(achievement);
      }
    });

    return categories;
  }

  private findMissingAchievementCategories(resume: Resume): string[] {
    const missing: string[] = [];
    const present = this.categorizeAchievements(this.extractAchievements(resume));

    const categories = ['leadership', 'technical', 'financial', 'operational', 'customer'];
    categories.forEach(category => {
      if (!present[category] || present[category].length === 0) {
        missing.push(category);
      }
    });

    return missing;
  }

  private calculateSectionScore(content: string, section: string, context: any): number {
    let score = 50;

    // Base score for having content
    if (content.length > 0) score += 20;

    // Length optimization
    if (section === 'summary' && content.length >= 50 && content.length <= 150) {
      score += 20;
    }

    // Keyword relevance
    if (context.jobDescription) {
      const keywords = this.extractKeywords(context.jobDescription);
      const matches = keywords.filter(keyword => content.toLowerCase().includes(keyword.toLowerCase()));
      score += (matches.length / keywords.length) * 20;
    }

    return Math.max(0, Math.min(100, score));
  }

  private identifySectionIssues(content: string, section: string): string[] {
    const issues: string[] = [];

    if (content.length === 0) {
      issues.push('Section is empty');
    } else if (section === 'summary' && content.length < 50) {
      issues.push('Section content is too brief');
    }

    return issues;
  }

  private generateSectionSuggestions(content: string, section: string, context: any): string[] {
    const suggestions: string[] = [];

    if (section === 'summary' && context.jobDescription) {
      suggestions.push('Include keywords from the job description');
    }

    if (section === 'experience') {
      suggestions.push('Use action verbs to start bullet points');
      suggestions.push('Include quantifiable achievements');
    }

    return suggestions;
  }

  private extractKeywordMatches(content: string, context: any): string[] {
    const matches: string[] = [];

    if (context.jobDescription) {
      const keywords = this.extractKeywords(context.jobDescription);
      keywords.forEach(keyword => {
        if (content.toLowerCase().includes(keyword.toLowerCase())) {
          matches.push(keyword);
        }
      });
    }

    return matches;
  }

  private calculateFormattingReadability(template: ResumeTemplate, customization?: TemplateCustomization): number {
    let score = 80;

    // Check for ATS-friendly formatting
    if (this.isATSFriendlyFont(customization?.typography?.heading?.fontFamily)) {
      score += 10;
    }

    if (template.layout?.columns?.count && template.layout.columns.count <= 2) {
      score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  private getKeywordImportance(keyword: string): 'high' | 'medium' | 'low' {
    const highImportance = ['manager', 'developer', 'lead', 'senior', 'expert'];
    const mediumImportance = ['coordinator', 'specialist', 'analyst', 'associate'];

    if (highImportance.some(hi => keyword.toLowerCase().includes(hi))) return 'high';
    if (mediumImportance.some(mi => keyword.toLowerCase().includes(mi))) return 'medium';
    return 'low';
  }

  private findKeywordLocations(resume: Resume, keyword: string): string[] {
    const locations: string[] = [];
    const resumeText = this.extractTextFromResume(resume);

    // Check in standard sections
    if (resume.summary && resume.summary.toLowerCase().includes(keyword.toLowerCase())) {
      locations.push('Summary');
    }

    if (resume.experience) {
      resume.experience.forEach((exp, index) => {
        if (exp.description && exp.description.toLowerCase().includes(keyword.toLowerCase())) {
          locations.push(`Experience ${index + 1}`);
        }
      });
    }

    if (resume.skills) {
      resume.skills.forEach((skill, index) => {
        if (skill.name && skill.name.toLowerCase().includes(keyword.toLowerCase())) {
          locations.push(`Skills ${index + 1}`);
        }
      });
    }

    return locations;
  }

  private countJargon(text: string): number {
    const jargonWords = ['synergize', 'leverage', 'paradigm', 'ecosystem', 'bandwidth', 'scalable'];
    return jargonWords.reduce((count, word) => {
      return count + (text.toLowerCase().split(word.toLowerCase()).length - 1);
    }, 0);
  }
}

// Export singleton instance
export const advancedATSOptimizer = new AdvancedATSOptimizer();