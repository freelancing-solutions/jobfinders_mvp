/**
 * Keyword Analyzer Utility
 *
 * Advanced keyword analysis for resume optimization including
 * density analysis, relevance scoring, and ATS optimization.
 */

import { KeywordMatch, SkillGap } from '@/types/resume';

export interface KeywordAnalysis {
  keywords: KeywordMatch[];
  density: KeywordDensity;
  relevance: KeywordRelevance;
  gaps: SkillGap[];
  optimization: KeywordOptimization;
  score: number; // 0-100
}

export interface KeywordDensity {
  overall: number; // Overall keyword density percentage
  byKeyword: { [keyword: string]: number };
  distribution: {
    dense: KeywordDensityItem[];
    optimal: KeywordDensityItem[];
    sparse: KeywordDensityItem[];
  };
  recommendations: string[];
}

export interface KeywordDensityItem {
  keyword: string;
  density: number;
  count: number;
  optimal: boolean;
}

export interface KeywordRelevance {
  overallScore: number; // 0-100
  industryAlignment: number; // 0-100
  roleAlignment: number; // 0-100
  trending: TrendingKeyword[];
  essential: EssentialKeyword[];
  secondary: SecondaryKeyword[];
}

export interface TrendingKeyword {
  keyword: string;
  trend: 'rising' | 'stable' | 'declining';
  relevance: number; // 0-100
  frequency: number;
}

export interface EssentialKeyword {
  keyword: string;
  importance: 'critical' | 'high' | 'medium';
  found: boolean;
  alternatives: string[];
}

export interface SecondaryKeyword {
  keyword: string;
  importance: 'low' | 'nice-to-have';
  found: boolean;
  context: string[];
}

export interface KeywordOptimization {
  suggestions: OptimizationSuggestion[];
  missingKeywords: string[];
  overusedKeywords: string[];
  keywordVariations: KeywordVariation[];
  contextOptimization: ContextOptimization[];
}

export interface OptimizationSuggestion {
  type: 'add' | 'remove' | 'replace' | 'rephrase';
  keyword: string;
  suggestion: string;
  reason: string;
  impact: 'high' | 'medium' | 'low';
  example?: string;
}

export interface KeywordVariation {
  original: string;
  variations: string[];
  recommended: string;
  usage: 'experience' | 'skills' | 'summary' | 'education';
}

export interface ContextOptimization {
  section: string;
  currentText: string;
  optimizedText: string;
  keywordsAdded: string[];
  impact: number;
}

export interface AnalysisOptions {
  industry?: string;
  jobTitle?: string;
  experienceLevel?: string;
  jobDescription?: string;
  strictMode?: boolean;
  includeTrending?: boolean;
  maxKeywords?: number;
}

export class KeywordAnalyzer {
  private readonly industryKeywordBanks = {
    technology: {
      essential: [
        'javascript', 'typescript', 'python', 'java', 'react', 'node.js', 'aws',
        'docker', 'kubernetes', 'mongodb', 'postgresql', 'sql', 'git', 'rest api',
        'microservices', 'ci/cd', 'agile', 'devops'
      ],
      trending: [
        'kubernetes', 'terraform', 'serverless', 'machine learning', 'ai/ml',
        'typescript', 'react', 'vue.js', 'golang', 'rust', 'python 3.11+',
        'aws lambda', 'azure functions', 'google cloud', 'blockchain', 'web3'
      ],
      secondary: [
        'html5', 'css3', 'sass', 'webpack', 'babel', 'jest', 'cypress',
        'figma', 'jira', 'confluence', 'slack', 'linux', 'bash', 'powershell'
      ]
    },
    healthcare: {
      essential: [
        'patient care', 'hipaa', 'electronic health records', 'ehr', 'clinical',
        'medical terminology', 'cpr', 'bls', 'nursing', 'diagnosis', 'treatment'
      ],
      trending: [
        'telehealth', 'digital health', 'ai in healthcare', 'robotic surgery',
        'genomics', 'precision medicine', 'value-based care', 'population health'
      ],
      secondary: [
        'medical billing', 'coding', 'scheduling', 'patient education',
        'medical records', 'vital signs', 'medication administration'
      ]
    },
    finance: {
      essential: [
        'financial analysis', 'accounting', 'risk management', 'compliance',
        'investment', 'portfolio', 'financial modeling', 'excel', 'gaap', 'ifrs'
      ],
      trending: [
        'cryptocurrency', 'blockchain', 'fintech', 'robo-advisory',
        'algorithmic trading', 'esg investing', 'regtech', 'insurtech'
      ],
      secondary: [
        'financial reporting', 'budgeting', 'forecasting', 'tax planning',
        'auditing', 'due diligence', 'mergers', 'acquisitions'
      ]
    },
    marketing: {
      essential: [
        'digital marketing', 'seo', 'sem', 'ppc', 'social media', 'content marketing',
        'email marketing', 'analytics', 'crm', 'branding', 'market research'
      ],
      trending: [
        'influencer marketing', 'video marketing', 'tiktok marketing',
        'ai in marketing', 'personalization', 'customer experience', 'marketing automation'
      ],
      secondary: [
        'copywriting', 'graphic design', 'public relations', 'event planning',
        'product marketing', 'growth hacking', 'conversion optimization'
      ]
    }
  };

  analyzeKeywords(
    resumeText: string,
    options: AnalysisOptions = {}
  ): KeywordAnalysis {
    const {
      industry,
      jobTitle,
      experienceLevel,
      jobDescription,
      strictMode = false,
      includeTrending = true,
      maxKeywords = 50,
    } = options;

    // Extract keywords from resume and job description
    const resumeKeywords = this.extractKeywords(resumeText);
    const jobKeywords = jobDescription ? this.extractKeywords(jobDescription) : [];

    // Get industry keywords
    const industryKeywords = this.getIndustryKeywords(industry);

    // Analyze keyword density
    const density = this.analyzeKeywordDensity(resumeText, resumeKeywords, jobKeywords);

    // Analyze relevance
    const relevance = this.analyzeRelevance(resumeKeywords, jobKeywords, industryKeywords, options);

    // Identify gaps
    const gaps = this.identifyKeywordGaps(resumeKeywords, jobKeywords, industryKeywords);

    // Generate optimization suggestions
    const optimization = this.generateOptimizationSuggestions(resumeText, resumeKeywords, jobKeywords, industryKeywords, gaps);

    // Calculate overall score
    const score = this.calculateKeywordScore(density, relevance, gaps, optimization);

    return {
      keywords: this.createKeywordMatches(resumeKeywords, jobKeywords, industryKeywords),
      density,
      relevance,
      gaps,
      optimization,
      score,
    };
  }

  private extractKeywords(text: string): string[] {
    // Remove common words and extract relevant keywords
    const commonWords = new Set([
      'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was',
      'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now',
      'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she',
      'too', 'use', 'was', 'will', 'with', 'have', 'this', 'that', 'from', 'they', 'been',
      'called', 'come', 'could', 'each', 'find', 'going', 'great', 'must', 'number', 'other',
      'part', 'people', 'said', 'than', 'them', 'time', 'very', 'water', 'were', 'where',
      'which', 'words', 'would', 'write', 'your', 'there', 'their', 'what', 'when', 'make'
    ]);

    return text.toLowerCase()
      .replace(/[^\w\s\-]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.has(word))
      .filter((word, index, array) => array.indexOf(word) === index) // Remove duplicates
      .slice(0, 100); // Limit to top 100 keywords
  }

  private getIndustryKeywords(industry?: string): any {
    if (!industry || !this.industryKeywordBanks[industry as keyof typeof this.industryKeywordBanks]) {
      return {
        essential: [],
        trending: [],
        secondary: []
      };
    }

    return this.industryKeywordBanks[industry as keyof typeof this.industryKeywordBanks];
  }

  private analyzeKeywordDensity(
    resumeText: string,
    resumeKeywords: string[],
    jobKeywords: string[]
  ): KeywordDensity {
    const words = resumeText.split(/\s+/);
    const totalWords = words.length;

    const byKeyword: { [keyword: string]: number } = {};
    const distribution: KeywordDensity['distribution'] = {
      dense: [],
      optimal: [],
      sparse: []
    };

    let overallKeywordCount = 0;

    // Calculate density for each keyword
    [...resumeKeywords, ...jobKeywords].forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = resumeText.match(regex);
      const count = matches ? matches.length : 0;
      const density = totalWords > 0 ? (count / totalWords) * 100 : 0;

      byKeyword[keyword] = density;
      overallKeywordCount += count;

      const densityItem: KeywordDensityItem = {
        keyword,
        density,
        count,
        optimal: density >= 0.5 && density <= 3
      };

      if (density > 3) {
        distribution.dense.push(densityItem);
      } else if (density >= 0.5 && density <= 3) {
        distribution.optimal.push(densityItem);
      } else if (count > 0) {
        distribution.sparse.push(densityItem);
      }
    });

    const overallDensity = totalWords > 0 ? (overallKeywordCount / totalWords) * 100 : 0;

    const recommendations: string[] = [];
    if (overallDensity < 2) {
      recommendations.push('Overall keyword density is low - consider adding more relevant keywords');
    } else if (overallDensity > 8) {
      recommendations.push('Overall keyword density is high - risk of keyword stuffing');
    }

    if (distribution.dense.length > 0) {
      recommendations.push(`Reduce usage of overused keywords: ${distribution.dense.slice(0, 3).map(d => d.keyword).join(', ')}`);
    }

    if (distribution.sparse.length > 5) {
      recommendations.push(`Increase frequency of underused keywords: ${distribution.sparse.slice(0, 3).map(d => d.keyword).join(', ')}`);
    }

    return {
      overall: overallDensity,
      byKeyword,
      distribution,
      recommendations
    };
  }

  private analyzeRelevance(
    resumeKeywords: string[],
    jobKeywords: string[],
    industryKeywords: any,
    options: AnalysisOptions
  ): KeywordRelevance {
    // Calculate industry alignment
    const industryAlignment = this.calculateIndustryAlignment(resumeKeywords, industryKeywords);

    // Calculate role alignment
    const roleAlignment = this.calculateRoleAlignment(resumeKeywords, jobKeywords);

    // Identify trending keywords
    const trending = this.identifyTrendingKeywords(resumeKeywords, industryKeywords, options.includeTrending);

    // Identify essential keywords
    const essential = this.identifyEssentialKeywords(resumeKeywords, industryKeywords);

    // Identify secondary keywords
    const secondary = this.identifySecondaryKeywords(resumeKeywords, industryKeywords);

    const overallScore = (industryAlignment * 0.4 + roleAlignment * 0.6);

    return {
      overallScore,
      industryAlignment,
      roleAlignment,
      trending,
      essential,
      secondary
    };
  }

  private calculateIndustryAlignment(resumeKeywords: string[], industryKeywords: any): number {
    if (!industryKeywords.essential || industryKeywords.essential.length === 0) {
      return 50; // Neutral score if no industry specified
    }

    const matchingKeywords = resumeKeywords.filter(keyword =>
      industryKeywords.essential.some(essential =>
        keyword.includes(essential) || essential.includes(keyword)
      )
    );

    return Math.min(100, (matchingKeywords.length / industryKeywords.essential.length) * 100);
  }

  private calculateRoleAlignment(resumeKeywords: string[], jobKeywords: string[]): number {
    if (jobKeywords.length === 0) {
      return 50; // Neutral score if no job description provided
    }

    const matchingKeywords = resumeKeywords.filter(keyword =>
      jobKeywords.some(jobKeyword =>
        keyword.includes(jobKeyword) || jobKeyword.includes(keyword)
      )
    );

    return Math.min(100, (matchingKeywords.length / jobKeywords.length) * 100);
  }

  private identifyTrendingKeywords(resumeKeywords: string[], industryKeywords: any, include: boolean = true): TrendingKeyword[] {
    if (!include || !industryKeywords.trending) {
      return [];
    }

    return industryKeywords.trending.map(keyword => ({
      keyword,
      trend: 'rising' as const,
      relevance: resumeKeywords.some(rk => rk.includes(keyword) || keyword.includes(rk)) ? 80 : 20,
      frequency: resumeKeywords.filter(rk => rk.includes(keyword) || keyword.includes(rk)).length
    }));
  }

  private identifyEssentialKeywords(resumeKeywords: string[], industryKeywords: any): EssentialKeyword[] {
    if (!industryKeywords.essential) {
      return [];
    }

    return industryKeywords.essential.map(keyword => ({
      keyword,
      importance: 'critical' as const,
      found: resumeKeywords.some(rk => rk.includes(keyword) || keyword.includes(rk)),
      alternatives: this.getAlternativeKeywords(keyword)
    }));
  }

  private identifySecondaryKeywords(resumeKeywords: string[], industryKeywords: any): SecondaryKeyword[] {
    if (!industryKeywords.secondary) {
      return [];
    }

    return industryKeywords.secondary.map(keyword => ({
      keyword,
      importance: 'nice-to-have' as const,
      found: resumeKeywords.some(rk => rk.includes(keyword) || keyword.includes(rk)),
      context: [] // Would be populated with actual contexts from resume
    }));
  }

  private getAlternativeKeywords(keyword: string): string[] {
    const alternatives: { [key: string]: string[] } = {
      'javascript': ['javascript', 'js', 'ecmascript', 'node.js', 'react.js'],
      'python': ['python', 'python 3', 'django', 'flask', 'pandas', 'numpy'],
      'react': ['react', 'react.js', 'react native', 'jsx', 'redux'],
      'aws': ['aws', 'amazon web services', 'ec2', 's3', 'lambda', 'rds'],
      'docker': ['docker', 'containers', 'kubernetes', 'k8s', 'containerization'],
      'sql': ['sql', 'mysql', 'postgresql', 't-sql', 'nosql', 'mongodb'],
    };

    return alternatives[keyword] || [];
  }

  private identifyKeywordGaps(
    resumeKeywords: string[],
    jobKeywords: string[],
    industryKeywords: any
  ): SkillGap[] {
    const gaps: SkillGap[] = [];

    // Check missing essential keywords
    if (industryKeywords.essential) {
      industryKeywords.essential.forEach(keyword => {
        const found = resumeKeywords.some(rk => rk.includes(keyword) || keyword.includes(rk));
        if (!found) {
          gaps.push({
            skill: keyword,
            importance: 'required',
            foundInResume: false,
            proficiencyLevel: 'unknown'
          });
        }
      });
    }

    // Check missing job-specific keywords
    jobKeywords.forEach(keyword => {
      const found = resumeKeywords.some(rk => rk.includes(keyword) || keyword.includes(rk));
      if (!found) {
        gaps.push({
          skill: keyword,
          importance: 'preferred',
          foundInResume: false,
          proficiencyLevel: 'unknown'
        });
      }
    });

    return gaps;
  }

  private generateOptimizationSuggestions(
    resumeText: string,
    resumeKeywords: string[],
    jobKeywords: string[],
    industryKeywords: any,
    gaps: SkillGap[]
  ): KeywordOptimization {
    const suggestions: OptimizationSuggestion[] = [];
    const missingKeywords: string[] = [];
    const overusedKeywords: string[] = [];
    const keywordVariations: KeywordVariation[] = [];
    const contextOptimization: ContextOptimization[] = [];

    // Generate suggestions for missing keywords
    gaps.forEach(gap => {
      if (gap.importance === 'required') {
        suggestions.push({
          type: 'add',
          keyword: gap.skill,
          suggestion: `Add "${gap.skill}" to skills or experience section`,
          reason: 'This is a required keyword for the target role',
          impact: 'high',
          example: `Experienced in ${gap.skill} with X years of hands-on experience`
        });
        missingKeywords.push(gap.skill);
      }
    });

    // Check for overused keywords
    const keywordCounts: { [key: string]: number } = {};
    resumeKeywords.forEach(keyword => {
      keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
    });

    Object.entries(keywordCounts).forEach(([keyword, count]) => {
      if (count > 5) {
        overusedKeywords.push(keyword);
        suggestions.push({
          type: 'replace',
          keyword,
          suggestion: `Replace some instances of "${keyword}" with synonyms or variations`,
          reason: 'Keyword appears too frequently, may be seen as stuffing',
          impact: 'medium'
        });
      }
    });

    // Generate keyword variations
    industryKeywords.essential?.forEach(keyword => {
      const alternatives = this.getAlternativeKeywords(keyword);
      if (alternatives.length > 0) {
        keywordVariations.push({
          original: keyword,
          variations: alternatives,
          recommended: alternatives[0],
          usage: 'skills'
        });
      }
    });

    return {
      suggestions,
      missingKeywords,
      overusedKeywords,
      keywordVariations,
      contextOptimization
    };
  }

  private createKeywordMatches(
    resumeKeywords: string[],
    jobKeywords: string[],
    industryKeywords: any
  ): KeywordMatch[] {
    const matches: KeywordMatch[] = [];
    const allKeywords = [...new Set([...resumeKeywords, ...jobKeywords, ...(industryKeywords.essential || [])])];

    allKeywords.forEach(keyword => {
      const found = resumeKeywords.includes(keyword);
      const importance = jobKeywords.includes(keyword) ? 'high' :
                        industryKeywords.essential?.includes(keyword) ? 'medium' : 'low';

      matches.push({
        keyword,
        found,
        count: found ? 1 : 0, // Would be actual count from text analysis
        context: [], // Would be populated with actual contexts
        importance: importance as 'high' | 'medium' | 'low'
      });
    });

    return matches;
  }

  private calculateKeywordScore(
    density: KeywordDensity,
    relevance: KeywordRelevance,
    gaps: SkillGap[],
    optimization: KeywordOptimization
  ): number {
    // Weighted scoring based on different factors
    const densityScore = Math.max(0, 100 - Math.abs(density.overall - 5) * 10); // Optimal around 5%
    const relevanceScore = relevance.overallScore;
    const gapScore = Math.max(0, 100 - (gaps.filter(g => g.importance === 'required').length * 20));
    const optimizationScore = optimization.suggestions.length > 0 ? 70 : 90;

    return Math.round((densityScore * 0.2 + relevanceScore * 0.4 + gapScore * 0.3 + optimizationScore * 0.1));
  }

  // Utility method to extract keywords from job description
  extractJobDescriptionKeywords(jobDescription: string, options: { maxKeywords?: number } = {}): string[] {
    const { maxKeywords = 30 } = options;

    // Remove common words and focus on technical and role-specific terms
    const commonWords = new Set([
      'we', 'our', 'you', 'your', 'the', 'and', 'for', 'are', 'but', 'not', 'all',
      'can', 'have', 'had', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him',
      'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who'
    ]);

    const words = jobDescription.toLowerCase()
      .replace(/[^\w\s\-]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.has(word));

    // Prioritize technical terms, qualifications, and skills
    const technicalTerms = words.filter(word =>
      /\b(javascript|python|java|react|aws|docker|sql|api|cloud|database|development|engineering|analytics)\b/.test(word)
    );

    const qualifications = words.filter(word =>
      /\b(bachelor|master|phd|degree|certification|experienced|senior|junior|lead|manager)\b/.test(word)
    );

    const skills = words.filter(word =>
      /\b(management|communication|leadership|project|team|collaboration|problem-solving|analytical)\b/.test(word)
    );

    // Combine and deduplicate, prioritizing by category
    const prioritizedKeywords = [
      ...new Set([...technicalTerms, ...qualifications, ...skills])
    ];

    // Add remaining unique keywords
    words.forEach(word => {
      if (!prioritizedKeywords.includes(word)) {
        prioritizedKeywords.push(word);
      }
    });

    return prioritizedKeywords.slice(0, maxKeywords);
  }
}

// Export singleton instance
export const keywordAnalyzer = new KeywordAnalyzer();