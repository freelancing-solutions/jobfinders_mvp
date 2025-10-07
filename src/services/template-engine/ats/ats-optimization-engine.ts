/**
 * ATS Optimization Engine
 * Comprehensive system for optimizing resume templates and content for Applicant Tracking Systems
 */

import { ResumeTemplate, TemplateCustomization } from '@/types/template';
import { TemplateEngineError, TemplateErrorType } from '../errors';

export interface ATSOptimizationRequest {
  template: ResumeTemplate;
  customization: TemplateCustomization;
  content: any;
  targetJobDescription?: string;
  targetKeywords?: string[];
  strictMode?: boolean;
}

export interface ATSOptimizationResult {
  score: number;
  atsScore: number;
  readabilityScore: number;
  keywordScore: number;
  formatScore: number;
  issues: ATSIssue[];
  recommendations: ATSRecommendation[];
  optimizedContent: any;
  keywordAnalysis: {
    found: string[];
    missing: string[];
    density: Record<string, number>;
    suggestions: string[];
  };
  formatAnalysis: {
    compatible: boolean;
    issues: string[];
    fixes: string[];
  };
}

export interface ATSIssue {
  type: 'critical' | 'warning' | 'suggestion';
  category: 'format' | 'content' | 'keywords' | 'structure';
  message: string;
  location?: string;
  fix: string;
  impact: number; // 1-10
}

export interface ATSRecommendation {
  priority: 'high' | 'medium' | 'low';
  category: 'content' | 'format' | 'keywords';
  title: string;
  description: string;
  implementation: string;
  impact: number; // Estimated score improvement
}

export class ATSOptimizationEngine {
  private static readonly ATS_SAFE_FONTS = [
    'Arial', 'Calibri', 'Georgia', 'Helvetica', 'Times New Roman', 'Verdana'
  ];

  private static readonly ATS_SAFE_FONT_SIZES = {
    minimum: 10,
    maximum: 14,
    preferred: [11, 12]
  };

  private static readonly ATS_SAFE_COLORS = [
    '#000000', '#1a1a1a', '#2d2d2d', '#404040', '#525252', '#666666',
    '#7a7a7a', '#8d8d8d', '#a0a0a0', '#b3b3b3', '#c6c6c6', '#d9d9d9',
    '#e6e6e6', '#f0f0f0', '#ffffff'
  ];

  private static readonly SECTION_HEADINGS = [
    'Professional Summary', 'Experience', 'Work Experience', 'Education',
    'Skills', 'Certifications', 'Projects', 'Awards', 'Publications',
    'Leadership', 'Volunteer', 'References'
  ];

  private static readonly ACTION_VERBS = [
    'managed', 'developed', 'implemented', 'created', 'led', 'coordinated',
    'achieved', 'improved', 'increased', 'decreased', 'reduced', 'optimized',
    'designed', 'launched', 'executed', 'supervised', 'trained', 'mentored',
    'analyzed', 'researched', 'presented', 'published', 'collaborated'
  ];

  private static readonly PROBLEMATIC_KEYWORDS = [
    'rockstar', 'ninja', 'guru', 'synergy', 'leverage', 'paradigm',
    'ideate', 'deep dive', 'low-hanging fruit', 'win-win', 'think outside the box'
  ];

  /**
   * Optimize resume for ATS compatibility
   */
  static async optimizeForATS(request: ATSOptimizationRequest): Promise<ATSOptimizationResult> {
    const { template, customization, content, targetJobDescription, targetKeywords, strictMode = false } = request;

    // Analyze current state
    const formatScore = this.analyzeFormat(template, customization);
    const contentScore = this.analyzeContent(content, template);
    const keywordScore = this.analyzeKeywords(content, targetJobDescription, targetKeywords);
    const readabilityScore = this.analyzeReadability(customization, content);

    // Calculate overall score
    const atsScore = Math.round((formatScore + contentScore + keywordScore) / 3);
    const overallScore = Math.round((atsScore + readabilityScore) / 2);

    // Generate issues and recommendations
    const issues = this.identifyIssues(template, customization, content, targetJobDescription, targetKeywords);
    const recommendations = this.generateRecommendations(issues, template, content);

    // Optimize content
    const optimizedContent = this.optimizeContent(content, issues, recommendations);

    // Analyze keywords
    const keywordAnalysis = this.performKeywordAnalysis(content, targetJobDescription, targetKeywords);

    // Analyze format
    const formatAnalysis = this.analyzeFormatCompatibility(template, customization);

    return {
      score: overallScore,
      atsScore,
      readabilityScore,
      keywordScore,
      formatScore,
      issues,
      recommendations,
      optimizedContent,
      keywordAnalysis,
      formatAnalysis
    };
  }

  /**
   * Quick ATS score check
   */
  static quickATSCheck(template: ResumeTemplate, customization: TemplateCustomization, content: any): {
    score: number;
    criticalIssues: string[];
    quickFixes: string[];
  } {
    const issues = this.identifyIssues(template, customization, content);
    const criticalIssues = issues
      .filter(issue => issue.type === 'critical')
      .map(issue => issue.message);

    const quickFixes = issues
      .filter(issue => issue.impact >= 7)
      .slice(0, 3)
      .map(issue => issue.fix);

    const score = 100 - (criticalIssues.length * 15) - (issues.filter(i => i.type === 'warning').length * 5);

    return {
      score: Math.max(0, Math.min(100, score)),
      criticalIssues,
      quickFixes
    };
  }

  /**
   * Validate ATS compatibility
   */
  static validateATSCompatibility(template: ResumeTemplate, customization: TemplateCustomization): {
    compatible: boolean;
    score: number;
    blockingIssues: string[];
    warnings: string[];
  } {
    const formatIssues = this.checkFormatCompatibility(template, customization);
    const blockingIssues = formatIssues.filter(issue => issue.severity === 'error');
    const warnings = formatIssues.filter(issue => issue.severity === 'warning');

    const score = Math.max(0, 100 - (blockingIssues.length * 20) - (warnings.length * 10));

    return {
      compatible: blockingIssues.length === 0,
      score,
      blockingIssues: blockingIssues.map(issue => issue.message),
      warnings: warnings.map(issue => issue.message)
    };
  }

  /**
   * Get ATS-friendly section suggestions
   */
  static getATSSectionSuggestions(content: any): {
    recommended: string[];
    current: string[];
    missing: string[];
    improvements: Array<{
      section: string;
      suggestion: string;
      impact: string;
    }>;
  } {
    const currentSections = Object.keys(content);
    const recommended = this.SECTION_HEADINGS;
    const missing = recommended.filter(section => !currentSections.includes(section.toLowerCase()));

    const improvements = [
      {
        section: 'Professional Summary',
        suggestion: 'Add a 2-3 line summary at the top',
        impact: 'High - helps ATS quickly understand your profile'
      },
      {
        section: 'Skills',
        suggestion: 'List technical skills separately for easy scanning',
        impact: 'High - ATS looks for specific skill keywords'
      },
      {
        section: 'Experience',
        suggestion: 'Use bullet points with action verbs and metrics',
        impact: 'Medium - Improves readability and keyword matching'
      }
    ];

    return {
      recommended,
      current: currentSections,
      missing,
      improvements
    };
  }

  /**
   * Analyze keyword density and optimization
   */
  static analyzeKeywordOptimization(content: any, keywords: string[]): {
    density: Record<string, number>;
    optimization: {
      overused: string[];
      underused: string[];
      ideal: string[];
    };
    suggestions: string[];
  } {
    const allText = this.extractAllText(content).toLowerCase();
    const totalWords = allText.split(/\s+/).length;
    const density: Record<string, number> = {};

    keywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      const occurrences = (allText.match(new RegExp(keywordLower, 'g')) || []).length;
      density[keyword] = totalWords > 0 ? (occurrences / totalWords) * 100 : 0;
    });

    const optimization = {
      overused: keywords.filter(k => density[k] > 3),
      underused: keywords.filter(k => density[k] < 0.5 && density[k] > 0),
      ideal: keywords.filter(k => density[k] >= 0.5 && density[k] <= 3)
    };

    const suggestions = [];
    if (optimization.overused.length > 0) {
      suggestions.push(`Reduce usage of: ${optimization.overused.join(', ')}`);
    }
    if (optimization.underused.length > 0) {
      suggestions.push(`Add more mentions of: ${optimization.underused.join(', ')}`);
    }
    if (optimization.ideal.length === 0 && keywords.length > 0) {
      suggestions.push('Try to include keywords naturally 1-2% of the time');
    }

    return {
      density,
      optimization,
      suggestions
    };
  }

  // Private helper methods
  private static analyzeFormat(template: ResumeTemplate, customization: TemplateCustomization): number {
    let score = 100;

    // Check font compatibility
    const headingFont = customization.typography.heading.fontFamily;
    const bodyFont = customization.typography.body.fontFamily;

    if (!this.ATS_SAFE_FONTS.includes(headingFont)) {
      score -= 15;
    }
    if (!this.ATS_SAFE_FONTS.includes(bodyFont)) {
      score -= 15;
    }

    // Check font sizes
    const headingSize = customization.typography.heading.fontSize.h1;
    const bodySize = customization.typography.body.fontSize.normal;

    if (headingSize < this.ATS_SAFE_FONT_SIZES.minimum || headingSize > this.ATS_SAFE_FONT_SIZES.maximum) {
      score -= 10;
    }
    if (bodySize < this.ATS_SAFE_FONT_SIZES.minimum || bodySize > this.ATS_SAFE_FONT_SIZES.maximum) {
      score -= 10;
    }

    // Check layout complexity
    if (template.layout.type === 'two-column') {
      score -= 5; // Two-column can be problematic for some ATS
    }

    // Check color contrast
    const textColor = customization.colorScheme.text;
    const backgroundColor = customization.colorScheme.background;

    if (!this.ATS_SAFE_COLORS.includes(textColor) || !this.ATS_SAFE_COLORS.includes(backgroundColor)) {
      score -= 10;
    }

    // Check line height
    if (customization.layout.lineHeight < 1.0 || customization.layout.lineHeight > 1.5) {
      score -= 5;
    }

    return Math.max(0, score);
  }

  private static analyzeContent(content: any, template: ResumeTemplate): number {
    let score = 100;

    // Check for standard sections
    const hasRequiredSections = template.sections
      .filter(section => section.required)
      .every(section => content[section.id]);

    if (!hasRequiredSections) {
      score -= 20;
    }

    // Check contact information
    if (!content.contact || !content.contact.email || !content.contact.phone) {
      score -= 15;
    }

    // Check for action verbs in experience
    if (content.experience) {
      const experienceText = this.extractSectionText(content.experience);
      const hasActionVerbs = this.ACTION_VERBS.some(verb =>
        experienceText.toLowerCase().includes(verb)
      );

      if (!hasActionVerbs) {
        score -= 10;
      }
    }

    // Check for problematic keywords
    const allText = this.extractAllText(content).toLowerCase();
    const hasProblematicKeywords = this.PROBLEMATIC_KEYWORDS.some(keyword =>
      allText.includes(keyword)
    );

    if (hasProblematicKeywords) {
      score -= 10;
    }

    // Check for quantifiable achievements
    if (content.experience) {
      const hasMetrics = /\d+%|\$\d+|\d+ years/.test(this.extractSectionText(content.experience));
      if (!hasMetrics) {
        score -= 5;
      }
    }

    return Math.max(0, score);
  }

  private static analyzeKeywords(content: any, jobDescription?: string, targetKeywords?: string[]): number {
    if (!jobDescription && (!targetKeywords || targetKeywords.length === 0)) {
      return 85; // Neutral score when no keywords provided
    }

    const allText = this.extractAllText(content).toLowerCase();
    let score = 0;
    let totalKeywords = 0;

    // Analyze job description keywords
    if (jobDescription) {
      const jobKeywords = this.extractKeywords(jobDescription);
      totalKeywords += jobKeywords.length;

      jobKeywords.forEach(keyword => {
        if (allText.includes(keyword.toLowerCase())) {
          score += 10;
        }
      });
    }

    // Analyze target keywords
    if (targetKeywords) {
      totalKeywords += targetKeywords.length;

      targetKeywords.forEach(keyword => {
        if (allText.includes(keyword.toLowerCase())) {
          score += 10;
        }
      });
    }

    return totalKeywords > 0 ? Math.min(100, (score / (totalKeywords * 10)) * 100) : 85;
  }

  private static analyzeReadability(customization: TemplateCustomization, content: any): number {
    let score = 100;

    // Check line height
    if (customization.layout.lineHeight < 1.2 || customization.layout.lineHeight > 1.6) {
      score -= 10;
    }

    // Check spacing
    if (customization.layout.sectionSpacing.before < 8 || customization.layout.sectionSpacing.after < 6) {
      score -= 10;
    }

    // Check content complexity
    const allText = this.extractAllText(content);
    const sentences = allText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.reduce((sum, sentence) =>
      sum + sentence.split(/\s+/).length, 0) / sentences.length;

    if (avgSentenceLength > 25) {
      score -= 10; // Sentences too long
    } else if (avgSentenceLength < 10) {
      score -= 5; // Sentences too short
    }

    return Math.max(0, score);
  }

  private static identifyIssues(
    template: ResumeTemplate,
    customization: TemplateCustomization,
    content: any,
    jobDescription?: string,
    targetKeywords?: string[]
  ): ATSIssue[] {
    const issues: ATSIssue[] = [];

    // Format issues
    if (!this.ATS_SAFE_FONTS.includes(customization.typography.heading.fontFamily)) {
      issues.push({
        type: 'critical',
        category: 'format',
        message: `Heading font "${customization.typography.heading.fontFamily}" may not be ATS-compatible`,
        location: 'Typography',
        fix: `Use ATS-safe fonts: ${this.ATS_SAFE_FONTS.join(', ')}`,
        impact: 8
      });
    }

    if (template.layout.type === 'two-column') {
      issues.push({
        type: 'warning',
        category: 'format',
        message: 'Two-column layouts can cause ATS parsing issues',
        location: 'Layout',
        fix: 'Consider using a single-column layout for better ATS compatibility',
        impact: 6
      });
    }

    // Content issues
    if (!content.contact || !content.contact.email) {
      issues.push({
        type: 'critical',
        category: 'content',
        message: 'Missing email address in contact information',
        location: 'Contact',
        fix: 'Add your email address to contact information',
        impact: 9
      });
    }

    // Keyword issues
    if (jobDescription || targetKeywords) {
      const keywordScore = this.analyzeKeywords(content, jobDescription, targetKeywords);
      if (keywordScore < 70) {
        issues.push({
          type: 'warning',
          category: 'keywords',
          message: 'Low keyword match with job description',
          location: 'Content',
          fix: 'Add more relevant keywords from the job description',
          impact: 7
        });
      }
    }

    // Structure issues
    const requiredSections = template.sections.filter(s => s.required);
    requiredSections.forEach(section => {
      if (!content[section.id]) {
        issues.push({
          type: 'critical',
          category: 'structure',
          message: `Missing required section: ${section.name}`,
          location: 'Structure',
          fix: `Add content to the ${section.name} section`,
          impact: 9
        });
      }
    });

    return issues.sort((a, b) => b.impact - a.impact);
  }

  private static generateRecommendations(
    issues: ATSIssue[],
    template: ResumeTemplate,
    content: any
  ): ATSRecommendation[] {
    const recommendations: ATSRecommendation[] = [];

    // Generate recommendations from issues
    issues.forEach(issue => {
      if (issue.type === 'critical' || issue.impact >= 7) {
        recommendations.push({
          priority: issue.type === 'critical' ? 'high' : 'medium',
          category: issue.category,
          title: `Fix ${issue.category} issue`,
          description: issue.message,
          implementation: issue.fix,
          impact: issue.impact
        });
      }
    });

    // Add general recommendations
    if (content.experience) {
      const hasMetrics = /\d+%|\$\d+|\d+ years/.test(this.extractSectionText(content.experience));
      if (!hasMetrics) {
        recommendations.push({
          priority: 'medium',
          category: 'content',
          title: 'Add quantifiable achievements',
          description: 'Include specific metrics and numbers in your experience',
          implementation: 'Add percentages, dollar amounts, or time periods to show impact',
          impact: 6
        });
      }
    }

    return recommendations.sort((a, b) => b.impact - a.impact).slice(0, 10);
  }

  private static optimizeContent(content: any, issues: ATSIssue[], recommendations: ATSRecommendation[]): any {
    const optimized = JSON.parse(JSON.stringify(content));

    // Apply optimizations based on recommendations
    recommendations.forEach(rec => {
      if (rec.category === 'content' && rec.title.includes('quantifiable')) {
        // This would require more sophisticated content analysis
        // For now, we'll just mark that optimization was attempted
      }
    });

    return optimized;
  }

  private static performKeywordAnalysis(
    content: any,
    jobDescription?: string,
    targetKeywords?: string[]
  ): ATSOptimizationResult['keywordAnalysis'] {
    const allText = this.extractAllText(content).toLowerCase();
    const found: string[] = [];
    const missing: string[] = [];
    const density: Record<string, number> = {};

    const keywords = targetKeywords || [];
    if (jobDescription) {
      keywords.push(...this.extractKeywords(jobDescription));
    }

    const uniqueKeywords = [...new Set(keywords)];

    uniqueKeywords.forEach(keyword => {
      if (allText.includes(keyword.toLowerCase())) {
        found.push(keyword);
        // Calculate density
        const occurrences = (allText.match(new RegExp(keyword.toLowerCase(), 'g')) || []).length;
        const totalWords = allText.split(/\s+/).length;
        density[keyword] = totalWords > 0 ? (occurrences / totalWords) * 100 : 0;
      } else {
        missing.push(keyword);
      }
    });

    const suggestions = [];
    if (missing.length > 0) {
      suggestions.push(`Include these keywords: ${missing.slice(0, 5).join(', ')}`);
    }

    const lowDensityKeywords = Object.entries(density)
      .filter(([_, density]) => density < 0.5)
      .map(([keyword, _]) => keyword);

    if (lowDensityKeywords.length > 0) {
      suggestions.push(`Increase usage of: ${lowDensityKeywords.slice(0, 3).join(', ')}`);
    }

    return {
      found,
      missing,
      density,
      suggestions
    };
  }

  private static analyzeFormatCompatibility(
    template: ResumeTemplate,
    customization: TemplateCustomization
  ): ATSOptimizationResult['formatAnalysis'] {
    const issues: string[] = [];
    const fixes: string[] = [];

    // Check fonts
    const headingFont = customization.typography.heading.fontFamily;
    const bodyFont = customization.typography.body.fontFamily;

    if (!this.ATS_SAFE_FONTS.includes(headingFont)) {
      issues.push(`Heading font "${headingFont}" is not ATS-safe`);
      fixes.push(`Change heading font to one of: ${this.ATS_SAFE_FONTS.join(', ')}`);
    }

    if (!this.ATS_SAFE_FONTS.includes(bodyFont)) {
      issues.push(`Body font "${bodyFont}" is not ATS-safe`);
      fixes.push(`Change body font to one of: ${this.ATS_SAFE_FONTS.join(', ')}`);
    }

    // Check layout
    if (template.layout.type === 'two-column') {
      issues.push('Two-column layout may cause parsing issues');
      fixes.push('Use single-column layout for better ATS compatibility');
    }

    // Check colors
    const textColor = customization.colorScheme.text;
    if (!this.ATS_SAFE_COLORS.includes(textColor)) {
      issues.push('Text color may reduce readability');
      fixes.push('Use standard black or dark gray text');
    }

    const compatible = issues.length === 0;

    return {
      compatible,
      issues,
      fixes
    };
  }

  private static checkFormatCompatibility(
    template: ResumeTemplate,
    customization: TemplateCustomization
  ): Array<{ severity: 'error' | 'warning'; message: string }> {
    const issues = [];

    // Critical format issues
    if (!this.ATS_SAFE_FONTS.includes(customization.typography.heading.fontFamily)) {
      issues.push({
        severity: 'error',
        message: `Heading font "${customization.typography.heading.fontFamily}" is not ATS-compatible`
      });
    }

    if (!this.ATS_SAFE_FONTS.includes(customization.typography.body.fontFamily)) {
      issues.push({
        severity: 'error',
        message: `Body font "${customization.typography.body.fontFamily}" is not ATS-compatible`
      });
    }

    // Warnings
    if (template.layout.type === 'two-column') {
      issues.push({
        severity: 'warning',
        message: 'Two-column layouts may cause ATS parsing issues'
      });
    }

    return issues;
  }

  private static extractAllText(content: any): string {
    let text = '';

    const extractFromObject = (obj: any): void => {
      if (typeof obj === 'string') {
        text += obj + ' ';
      } else if (Array.isArray(obj)) {
        obj.forEach(item => extractFromObject(item));
      } else if (obj && typeof obj === 'object') {
        Object.values(obj).forEach(value => extractFromObject(value));
      }
    };

    extractFromObject(content);
    return text;
  }

  private static extractSectionText(section: any): string {
    return this.extractAllText(section);
  }

  private static extractKeywords(text: string): string[] {
    // Simple keyword extraction - in a real implementation, this would be more sophisticated
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);

    // Remove common words
    const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'];

    return words.filter(word => !stopWords.includes(word))
      .slice(0, 20); // Limit to top 20 keywords
  }
}