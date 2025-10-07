/**
 * ATS Keyword Analyzer
 * Advanced keyword analysis and optimization for ATS compatibility
 */

import { TemplateEngineError, TemplateErrorType } from '../errors';

export interface KeywordAnalysisRequest {
  resumeContent: any;
  jobDescription?: string;
  targetKeywords?: string[];
  industry?: string;
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'executive';
}

export interface KeywordAnalysisResult {
  overallScore: number;
  keywordDensity: Record<string, number>;
  matchedKeywords: KeywordMatch[];
  missingKeywords: KeywordGap[];
  keywordSuggestions: KeywordSuggestion[];
  semanticAnalysis: SemanticAnalysis;
  optimizationTips: OptimizationTip[];
  industryInsights: IndustryInsights;
}

export interface KeywordMatch {
  keyword: string;
  frequency: number;
  density: number;
  context: string[];
  importance: 'critical' | 'important' | 'nice-to-have';
  locations: string[];
}

export interface KeywordGap {
  keyword: string;
  importance: 'critical' | 'important' | 'nice-to-have';
  reason: string;
  suggestedContext: string;
  placement: string[];
}

export interface KeywordSuggestion {
  keyword: string;
  relevance: number;
  category: 'skill' | 'experience' | 'qualification' | 'responsibility';
  implementation: string;
  impact: number;
}

export interface SemanticAnalysis {
  semanticScore: number;
  conceptMatches: ConceptMatch[];
  themeAlignment: ThemeAlignment;
  contextualRelevance: ContextualRelevance;
}

export interface ConceptMatch {
  concept: string;
  confidence: number;
  relatedTerms: string[];
  foundInResume: boolean;
  suggestedInclusion: string[];
}

export interface ThemeAlignment {
  primaryTheme: string;
  alignmentScore: number;
  missingThemes: string[];
  strengtheningSuggestions: string[];
}

export interface ContextualRelevance {
  overallRelevance: number;
  sectionRelevance: Record<string, number>;
  improvementAreas: string[];
}

export interface OptimizationTip {
  category: 'density' | 'placement' | 'variety' | 'context';
  title: string;
  description: string;
  action: string;
  impact: number;
}

export interface IndustryInsights {
  topKeywords: Array<{
    keyword: string;
    frequency: number;
    importance: number;
  }>;
  trendingKeywords: string[];
    requiredSkills: string[];
    preferredQualifications: string[];
}

export class KeywordAnalyzer {
  private static readonly INDUSTRY_KEYWORDS = {
    technology: [
      'software development', 'programming', 'javascript', 'python', 'react',
      'node.js', 'aws', 'cloud computing', 'agile', 'devops', 'git',
      'database', 'api', 'microservices', 'machine learning', 'data analysis'
    ],
    healthcare: [
      'patient care', 'clinical', 'medical', 'nursing', 'hipaa',
      'electronic health records', 'diagnosis', 'treatment', 'healthcare',
      'clinical skills', 'medical terminology', 'patient assessment'
    ],
    finance: [
      'financial analysis', 'investment', 'portfolio management', 'risk assessment',
      'financial modeling', 'valuation', 'accounting', 'compliance', 'regulatory',
      'budgeting', 'forecasting', 'financial reporting', 'due diligence'
    ],
    marketing: [
      'digital marketing', 'seo', 'content marketing', 'social media',
      'brand management', 'campaign management', 'analytics', 'roi',
      'conversion optimization', 'marketing automation', 'customer acquisition'
    ],
    education: [
      'teaching', 'curriculum development', 'educational technology',
      'student assessment', 'pedagogy', 'academic research', 'instruction',
      'learning management', 'educational leadership', 'classroom management'
    ]
  };

  private static readonly SKILL_KEYWORDS = {
    technical: [
      'programming', 'software development', 'web development', 'mobile development',
      'database management', 'cloud computing', 'cybersecurity', 'data analysis',
      'machine learning', 'artificial intelligence', 'devops', 'agile methodologies'
    ],
    soft: [
      'leadership', 'communication', 'teamwork', 'problem solving',
      'critical thinking', 'project management', 'time management',
      'adaptability', 'creativity', 'emotional intelligence', 'collaboration'
    ],
    business: [
      'strategic planning', 'business development', 'financial analysis',
      'market research', 'project management', 'budget management',
      'contract negotiation', 'stakeholder management', 'risk assessment'
    ]
  };

  private static readonly EXPERIENCE_LEVEL_KEYWORDS = {
    entry: [
      'entry level', 'junior', 'recent graduate', 'internship', 'training',
      'learning', 'development', 'foundational', 'basic', 'fundamental'
    ],
    mid: [
      'mid level', 'experienced', 'professional', 'independent',
      'autonomous', 'proficient', 'skilled', 'competent', 'established'
    ],
    senior: [
      'senior level', 'lead', 'senior', 'expert', 'specialized',
      'advanced', 'mastery', 'leadership', 'mentoring', 'strategic'
    ],
    executive: [
      'executive', 'director', 'vp', 'c-level', 'strategic', 'leadership',
      'executive management', 'board level', 'c-suite', 'senior leadership'
    ]
  };

  /**
   * Perform comprehensive keyword analysis
   */
  static async analyzeKeywords(request: KeywordAnalysisRequest): Promise<KeywordAnalysisResult> {
    const { resumeContent, jobDescription, targetKeywords, industry, experienceLevel } = request;

    // Extract text from resume
    const resumeText = this.extractTextFromContent(resumeContent);

    // Build keyword list
    const keywordList = this.buildKeywordList(jobDescription, targetKeywords, industry, experienceLevel);

    // Analyze keyword matches
    const matchedKeywords = this.findKeywordMatches(resumeText, keywordList);

    // Identify keyword gaps
    const missingKeywords = this.identifyKeywordGaps(keywordList, matchedKeywords, resumeText);

    // Calculate keyword density
    const keywordDensity = this.calculateKeywordDensity(resumeText, matchedKeywords);

    // Generate keyword suggestions
    const keywordSuggestions = this.generateKeywordSuggestions(missingKeywords, industry, experienceLevel);

    // Perform semantic analysis
    const semanticAnalysis = await this.performSemanticAnalysis(resumeText, jobDescription, industry);

    // Generate optimization tips
    const optimizationTips = this.generateOptimizationTips(matchedKeywords, missingKeywords, keywordDensity);

    // Get industry insights
    const industryInsights = this.getIndustryInsights(industry);

    // Calculate overall score
    const overallScore = this.calculateOverallScore(matchedKeywords, missingKeywords, semanticAnalysis);

    return {
      overallScore,
      keywordDensity,
      matchedKeywords,
      missingKeywords,
      keywordSuggestions,
      semanticAnalysis,
      optimizationTips,
      industryInsights
    };
  }

  /**
   * Quick keyword match analysis
   */
  static quickKeywordMatch(resumeContent: any, keywords: string[]): {
    matchPercentage: number;
    matchedKeywords: string[];
    missingKeywords: string[];
    score: number;
  } {
    const resumeText = this.extractTextFromContent(resumeContent).toLowerCase();
    const matchedKeywords = keywords.filter(keyword =>
      resumeText.includes(keyword.toLowerCase())
    );

    const missingKeywords = keywords.filter(keyword =>
      !resumeText.includes(keyword.toLowerCase())
    );

    const matchPercentage = (matchedKeywords.length / keywords.length) * 100;
    const score = Math.round(matchPercentage);

    return {
      matchPercentage,
      matchedKeywords,
      missingKeywords,
      score
    };
  }

  /**
   * Extract keywords from job description
   */
  static extractJobKeywords(jobDescription: string): {
    skills: string[];
    qualifications: string[];
    responsibilities: string[];
    experience: string[];
    tools: string[];
  } {
    const text = jobDescription.toLowerCase();

    // Extract skill keywords
    const skills = this.extractKeywordsByPattern(text, this.SKILL_KEYWORDS.technical);

    // Extract qualification keywords
    const qualifications = this.extractQualificationKeywords(text);

    // Extract responsibility keywords
    const responsibilities = this.extractResponsibilityKeywords(text);

    // Extract experience level keywords
    const experience = this.extractExperienceKeywords(text);

    // Extract tool/software keywords
    const tools = this.extractToolKeywords(text);

    return {
      skills,
      qualifications,
      responsibilities,
      experience,
      tools
    };
  }

  /**
   * Get keyword optimization suggestions
   */
  static getOptimizationSuggestions(
    resumeContent: any,
    targetKeywords: string[],
    maxSuggestions: number = 10
  ): Array<{
    keyword: string;
    currentCount: number;
    recommendedCount: number;
    suggestedSections: string[];
    examplePhrases: string[];
  }> {
    const resumeText = this.extractTextFromContent(resumeContent);
    const suggestions = [];

    targetKeywords.forEach(keyword => {
      const currentCount = (resumeText.match(new RegExp(keyword, 'gi')) || []).length;
      const recommendedCount = this.getRecommendedKeywordCount(keyword, resumeText);

      if (currentCount < recommendedCount) {
        suggestions.push({
          keyword,
          currentCount,
          recommendedCount,
          suggestedSections: this.getSuggestedSectionsForKeyword(keyword),
          examplePhrases: this.getExamplePhrasesForKeyword(keyword)
        });
      }
    });

    return suggestions
      .sort((a, b) => (b.recommendedCount - b.currentCount) - (a.recommendedCount - a.currentCount))
      .slice(0, maxSuggestions);
  }

  // Private helper methods
  private static extractTextFromContent(content: any): string {
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

  private static buildKeywordList(
    jobDescription?: string,
    targetKeywords?: string[],
    industry?: string,
    experienceLevel?: string
  ): string[] {
    const keywords = new Set<string>();

    // Add target keywords
    if (targetKeywords) {
      targetKeywords.forEach(keyword => keywords.add(keyword.toLowerCase()));
    }

    // Extract keywords from job description
    if (jobDescription) {
      const jobKeywords = this.extractJobKeywords(jobDescription);
      Object.values(jobKeywords).flat().forEach(keyword => keywords.add(keyword));
    }

    // Add industry-specific keywords
    if (industry && this.INDUSTRY_KEYWORDS[industry.toLowerCase()]) {
      this.INDUSTRY_KEYWORDS[industry.toLowerCase()].forEach(keyword => keywords.add(keyword));
    }

    // Add experience level keywords
    if (experienceLevel && this.EXPERIENCE_LEVEL_KEYWORDS[experienceLevel]) {
      this.EXPERIENCE_LEVEL_KEYWORDS[experienceLevel].forEach(keyword => keywords.add(keyword));
    }

    return Array.from(keywords);
  }

  private static findKeywordMatches(text: string, keywords: string[]): KeywordMatch[] {
    const matches: KeywordMatch[] = [];
    const textLower = text.toLowerCase();

    keywords.forEach(keyword => {
      const regex = new RegExp(keyword, 'gi');
      const occurrences = text.match(regex) || [];

      if (occurrences.length > 0) {
        const density = (occurrences.length / text.split(/\s+/).length) * 100;
        const context = this.extractKeywordContext(text, keyword);
        const locations = this.findKeywordLocations(text, keyword);
        const importance = this.determineKeywordImportance(keyword);

        matches.push({
          keyword,
          frequency: occurrences.length,
          density,
          context,
          importance,
          locations
        });
      }
    });

    return matches.sort((a, b) => b.frequency - a.frequency);
  }

  private static identifyKeywordGaps(
    keywords: string[],
    matches: KeywordMatch[],
    resumeText: string
  ): KeywordGap[] {
    const matchedKeywords = new Set(matches.map(match => match.keyword.toLowerCase()));

    return keywords
      .filter(keyword => !matchedKeywords.has(keyword.toLowerCase()))
      .map(keyword => ({
        keyword,
        importance: this.determineKeywordImportance(keyword),
        reason: this.getGapReason(keyword),
        suggestedContext: this.getSuggestedContext(keyword),
        placement: this.getSuggestedSectionsForKeyword(keyword)
      }))
      .sort((a, b) => {
        const importanceOrder = { 'critical': 3, 'important': 2, 'nice-to-have': 1 };
        return importanceOrder[b.importance] - importanceOrder[a.importance];
      });
  }

  private static calculateKeywordDensity(text: string, matches: KeywordMatch[]): Record<string, number> {
    const density: Record<string, number> = {};
    const totalWords = text.split(/\s+/).length;

    matches.forEach(match => {
      density[match.keyword] = match.density;
    });

    return density;
  }

  private static generateKeywordSuggestions(
    gaps: KeywordGap[],
    industry?: string,
    experienceLevel?: string
  ): KeywordSuggestion[] {
    const suggestions: KeywordSuggestion[] = [];

    gaps.forEach(gap => {
      if (gap.importance === 'critical' || gap.importance === 'important') {
        suggestions.push({
          keyword: gap.keyword,
          relevance: this.calculateRelevanceScore(gap.keyword, industry, experienceLevel),
          category: this.categorizeKeyword(gap.keyword),
          implementation: gap.suggestedContext,
          impact: this.calculateImpactScore(gap.keyword)
        });
      }
    });

    // Add industry-specific suggestions
    if (industry && this.INDUSTRY_KEYWORDS[industry.toLowerCase()]) {
      this.INDUSTRY_KEYWORDS[industry.toLowerCase()].forEach(keyword => {
        if (!suggestions.find(s => s.keyword === keyword)) {
          suggestions.push({
            keyword,
            relevance: 0.7,
            category: 'skill',
            implementation: `Add "${keyword}" to skills or experience sections`,
            impact: 6
          });
        }
      });
    }

    return suggestions
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 15);
  }

  private static async performSemanticAnalysis(
    resumeText: string,
    jobDescription?: string,
    industry?: string
  ): Promise<SemanticAnalysis> {
    // Simplified semantic analysis - in a real implementation, this would use NLP
    const semanticScore = this.calculateSemanticScore(resumeText, jobDescription);
    const conceptMatches = this.findConceptMatches(resumeText, jobDescription, industry);
    const themeAlignment = this.analyzeThemeAlignment(resumeText, jobDescription);
    const contextualRelevance = this.analyzeContextualRelevance(resumeText, jobDescription);

    return {
      semanticScore,
      conceptMatches,
      themeAlignment,
      contextualRelevance
    };
  }

  private static generateOptimizationTips(
    matches: KeywordMatch[],
    gaps: KeywordGap[],
    density: Record<string, number>
  ): OptimizationTip[] {
    const tips: OptimizationTip[] = [];

    // Density tips
    const lowDensityKeywords = Object.entries(density)
      .filter(([_, d]) => d < 0.5)
      .map(([keyword, _]) => keyword);

    if (lowDensityKeywords.length > 0) {
      tips.push({
        category: 'density',
        title: 'Increase keyword density',
        description: `Several important keywords appear too infrequently`,
        action: `Add more mentions of: ${lowDensityKeywords.slice(0, 3).join(', ')}`,
        impact: 7
      });
    }

    // Placement tips
    const criticalGaps = gaps.filter(gap => gap.importance === 'critical');
    if (criticalGaps.length > 0) {
      tips.push({
        category: 'placement',
        title: 'Add critical keywords',
        description: `Missing critical keywords that ATS systems look for`,
        action: `Include these in summary or experience: ${criticalGaps.slice(0, 3).map(g => g.keyword).join(', ')}`,
        impact: 9
      });
    }

    // Variety tips
    const uniqueKeywords = matches.length;
    if (uniqueKeywords < 10) {
      tips.push({
        category: 'variety',
        title: 'Expand keyword variety',
        description: 'Include a broader range of relevant keywords',
        action: 'Add synonyms and related terms to increase keyword coverage',
        impact: 6
      });
    }

    return tips;
  }

  private static getIndustryInsights(industry?: string): IndustryInsights {
    if (!industry || !this.INDUSTRY_KEYWORDS[industry.toLowerCase()]) {
      return {
        topKeywords: [],
        trendingKeywords: [],
        requiredSkills: [],
        preferredQualifications: []
      };
    }

    const industryKeywords = this.INDUSTRY_KEYWORDS[industry.toLowerCase()];

    return {
      topKeywords: industryKeywords.map((keyword, index) => ({
        keyword,
        frequency: Math.max(1, 10 - index),
        importance: index < 5 ? 9 : 7
      })),
      trendingKeywords: industryKeywords.slice(0, 5),
      requiredSkills: industryKeywords.slice(0, 8),
      preferredQualifications: industryKeywords.slice(8)
    };
  }

  private static calculateOverallScore(
    matches: KeywordMatch[],
    gaps: KeywordGap[],
    semanticAnalysis: SemanticAnalysis
  ): number {
    const keywordScore = Math.min(100, (matches.length / (matches.length + gaps.length)) * 100);
    const semanticScore = semanticAnalysis.semanticScore;

    return Math.round((keywordScore * 0.7) + (semanticScore * 0.3));
  }

  private static extractKeywordContext(text: string, keyword: string): string[] {
    const contexts: string[] = [];
    const regex = new RegExp(`(.{0,50}${keyword}.{0,50})`, 'gi');
    let match;

    while ((match = regex.exec(text)) !== null && contexts.length < 3) {
      contexts.push(match[1].trim());
    }

    return contexts;
  }

  private static findKeywordLocations(text: string, keyword: string): string[] {
    const locations: string[] = [];
    const sections = ['summary', 'experience', 'skills', 'education'];

    sections.forEach(section => {
      const sectionRegex = new RegExp(`${section}[^:]*:(.*?)(?=\n\\w+:|$)`, 'is');
      const sectionMatch = text.match(sectionRegex);

      if (sectionMatch && sectionMatch[1].toLowerCase().includes(keyword.toLowerCase())) {
        locations.push(section);
      }
    });

    return locations.length > 0 ? locations : ['general'];
  }

  private static determineKeywordImportance(keyword: string): 'critical' | 'important' | 'nice-to-have' {
    // This is a simplified implementation
    const criticalKeywords = ['experience', 'education', 'skills', 'management', 'leadership'];
    const importantKeywords = ['development', 'analysis', 'communication', 'project'];

    if (criticalKeywords.some(ck => keyword.toLowerCase().includes(ck))) {
      return 'critical';
    } else if (importantKeywords.some(ik => keyword.toLowerCase().includes(ik))) {
      return 'important';
    } else {
      return 'nice-to-have';
    }
  }

  private static getGapReason(keyword: string): string {
    return `Keyword "${keyword}" is important for ATS matching but not found in resume`;
  }

  private static getSuggestedContext(keyword: string): string {
    return `Include "${keyword}" in relevant experience or skills section`;
  }

  private static getSuggestedSectionsForKeyword(keyword: string): string[] {
    // Simplified logic - would be more sophisticated in real implementation
    if (keyword.includes('skill') || keyword.includes('programming') || keyword.includes('software')) {
      return ['skills', 'experience'];
    } else if (keyword.includes('education') || keyword.includes('degree')) {
      return ['education'];
    } else if (keyword.includes('experience') || keyword.includes('work')) {
      return ['experience', 'summary'];
    } else {
      return ['summary', 'experience', 'skills'];
    }
  }

  private static getExamplePhrasesForKeyword(keyword: string): string[] {
    return [
      `Experienced in ${keyword}`,
      `Proficient with ${keyword}`,
      `Applied ${keyword} to achieve results`,
      `${keyword} expertise in professional environment`
    ];
  }

  private static getRecommendedKeywordCount(keyword: string, resumeText: string): number {
    const resumeLength = resumeText.split(/\s+/).length;
    const baseCount = Math.max(1, Math.floor(resumeLength / 500));

    // Important keywords should appear more frequently
    const importance = this.determineKeywordImportance(keyword);
    const multiplier = importance === 'critical' ? 3 : importance === 'important' ? 2 : 1;

    return baseCount * multiplier;
  }

  private static calculateRelevanceScore(keyword: string, industry?: string, experienceLevel?: string): number {
    let score = 0.5; // Base score

    if (industry && this.INDUSTRY_KEYWORDS[industry.toLowerCase()]?.includes(keyword)) {
      score += 0.3;
    }

    if (experienceLevel && this.EXPERIENCE_LEVEL_KEYWORDS[experienceLevel]?.includes(keyword)) {
      score += 0.2;
    }

    return Math.min(1, score);
  }

  private static categorizeKeyword(keyword: string): 'skill' | 'experience' | 'qualification' | 'responsibility' {
    if (keyword.includes('skill') || keyword.includes('programming') || keyword.includes('software')) {
      return 'skill';
    } else if (keyword.includes('experience') || keyword.includes('work') || keyword.includes('year')) {
      return 'experience';
    } else if (keyword.includes('degree') || keyword.includes('certification') || keyword.includes('education')) {
      return 'qualification';
    } else {
      return 'responsibility';
    }
  }

  private static calculateImpactScore(keyword: string): number {
    const importance = this.determineKeywordImportance(keyword);
    return importance === 'critical' ? 9 : importance === 'important' ? 7 : 5;
  }

  private static extractKeywordsByPattern(text: string, keywordList: string[]): string[] {
    return keywordList.filter(keyword => text.includes(keyword));
  }

  private static extractQualificationKeywords(text: string): string[] {
    const patterns = [
      'bachelor', 'master', 'phd', 'degree', 'certification', 'license',
      'qualified', 'experienced', 'skilled', 'proficient'
    ];

    return this.extractKeywordsByPattern(text, patterns);
  }

  private static extractResponsibilityKeywords(text: string): string[] {
    const patterns = [
      'responsible', 'managed', 'led', 'coordinated', 'developed',
      'implemented', 'created', 'designed', 'oversaw', 'directed'
    ];

    return this.extractKeywordsByPattern(text, patterns);
  }

  private static extractExperienceKeywords(text: string): string[] {
    const patterns = [
      'years of experience', 'entry level', 'mid level', 'senior level',
      'junior', 'experienced', 'professional', 'expert', 'specialist'
    ];

    return this.extractKeywordsByPattern(text, patterns);
  }

  private static extractToolKeywords(text: string): string[] {
    const patterns = [
      'microsoft office', 'excel', 'powerpoint', 'word', 'outlook',
      'adobe', 'photoshop', 'illustrator', 'crm', 'salesforce',
      'slack', 'teams', 'zoom', 'jira', 'github'
    ];

    return this.extractKeywordsByPattern(text, patterns);
  }

  private static calculateSemanticScore(resumeText: string, jobDescription?: string): number {
    if (!jobDescription) return 75; // Neutral score

    // Simplified semantic similarity calculation
    const resumeWords = new Set(resumeText.toLowerCase().split(/\s+/));
    const jobWords = jobDescription.toLowerCase().split(/\s+/);

    const commonWords = jobWords.filter(word => resumeWords.has(word));
    const similarity = (commonWords.length / jobWords.length) * 100;

    return Math.min(100, Math.round(similarity * 1.5)); // Boost slightly
  }

  private static findConceptMatches(
    resumeText: string,
    jobDescription?: string,
    industry?: string
  ): ConceptMatch[] {
    // Simplified concept matching
    const concepts = [
      { concept: 'leadership', terms: ['lead', 'manage', 'supervise', 'direct'] },
      { concept: 'technical', terms: ['programming', 'software', 'development', 'coding'] },
      { concept: 'communication', terms: ['communicate', 'present', 'write', 'speak'] },
      { concept: 'analytical', terms: ['analyze', 'research', 'data', 'metrics'] }
    ];

    return concepts.map(({ concept, terms }) => {
      const foundInResume = terms.some(term => resumeText.toLowerCase().includes(term));
      const confidence = foundInResume ? 0.8 : 0.3;

      return {
        concept,
        confidence,
        relatedTerms: terms,
        foundInResume,
        suggestedInclusion: foundInResume ? [] : terms.slice(0, 2)
      };
    });
  }

  private static analyzeThemeAlignment(resumeText: string, jobDescription?: string): ThemeAlignment {
    // Simplified theme analysis
    const themes = ['technical', 'leadership', 'communication', 'innovation'];
    const primaryTheme = themes[0]; // Simplified - would need more sophisticated analysis

    return {
      primaryTheme,
      alignmentScore: 75,
      missingThemes: [],
      strengtheningSuggestions: []
    };
  }

  private static analyzeContextualRelevance(resumeText: string, jobDescription?: string): ContextualRelevance {
    const sectionRelevance = {
      summary: 85,
      experience: 90,
      skills: 80,
      education: 70
    };

    const overallRelevance = Object.values(sectionRelevance).reduce((a, b) => a + b, 0) / Object.values(sectionRelevance).length;

    return {
      overallRelevance,
      sectionRelevance,
      improvementAreas: ['Add more specific achievements', 'Include quantifiable results']
    };
  }
}