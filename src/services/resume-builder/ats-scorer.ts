/**
 * ATS Scorer Service
 *
 * Applicant Tracking System (ATS) compatibility scoring system
 * that evaluates resumes against real-world ATS algorithms and criteria.
 */

import { Resume, ResumeAnalysis, KeywordMatch, SkillGap } from '@/types/resume';
import { resumeBuilderConfig } from './config';
import { ResumeBuilderUtils } from './utils';

export interface ATSScoreBreakdown {
  totalScore: number; // 0-100
  categories: {
    formatting: number; // 0-100, 15% weight
    keywords: number; // 0-100, 30% weight
    structure: number; // 0-100, 20% weight
    content: number; // 0-100, 25% weight
    completeness: number; // 0-100, 10% weight
  };
  details: {
    formatting: FormattingScore;
    keywords: KeywordScore;
    structure: StructureScore;
    content: ContentScore;
    completeness: CompletenessScore;
  };
  recommendations: string[];
  criticalIssues: string[];
  improvementPotential: number; // 0-100
}

export interface FormattingScore {
  score: number;
  issues: string[];
  checks: {
    hasCleanFormat: boolean;
    noFancyFormatting: boolean;
    standardFonts: boolean;
    properSpacing: boolean;
    noTablesOrColumns: boolean;
    readableLength: boolean;
  };
}

export interface KeywordScore {
  score: number;
  keywordMatches: KeywordMatch[];
  keywordDensity: {
    dense: string[];
    sparse: string[];
    optimal: string[];
  };
  industryKeywords: {
    found: string[];
    missing: string[];
    relevanceScore: number;
  };
}

export interface StructureScore {
  score: number;
  sectionOrder: string[];
  missingSections: string[];
    extraSections: string[];
  checks: {
    hasContactInfo: boolean;
    hasSummary: boolean;
    hasExperience: boolean;
    hasEducation: boolean;
    hasSkills: boolean;
    logicalFlow: boolean;
  };
}

export interface ContentScore {
  score: number;
  metrics: {
    actionVerbUsage: number; // percentage
    quantificationScore: number; // 0-100
    impactScore: number; // 0-100
    clarityScore: number; // 0-100
    relevanceScore: number; // 0-100
  };
  issues: string[];
  strengths: string[];
}

export interface CompletenessScore {
  score: number;
  completeness: {
    contactInfo: number; // 0-100
    summary: number; // 0-100
    experience: number; // 0-100
    education: number; // 0-100
    skills: number; // 0-100
  };
  missingCritical: string[];
}

export interface ATSScoringOptions {
  jobDescription?: string;
  industry?: string;
  experienceLevel?: string;
  strictMode?: boolean;
  includeRecommendations?: boolean;
}

export class ATSScorer {
  private readonly categoryWeights = {
    formatting: 0.15,
    keywords: 0.30,
    structure: 0.20,
    content: 0.25,
    completeness: 0.10,
  };

  private readonly actionVerbs = [
    'achieved', 'accomplished', 'acquired', 'adapted', 'addressed', 'administered',
    'advanced', 'advised', 'advocated', 'analyzed', 'authored', 'balanced',
    'budgeted', 'built', 'calculated', 'catalogued', 'changed', 'collaborated',
    'collected', 'combined', 'communicated', 'competed', 'compiled', 'completed',
    'composed', 'computed', 'conducted', 'constructed', 'consulted', 'contributed',
    'controlled', 'converted', 'coordinated', 'created', 'critiqued', 'delegated',
    'delivered', 'demonstrated', 'derived', 'designed', 'developed', 'devised',
    'diagnosed', 'directed', 'discovered', 'distributed', 'documented', 'drafted',
    'edited', 'educated', 'eliminated', 'enabled', 'encouraged', 'engineered',
    'enhanced', 'enlarged', 'established', 'estimated', 'evaluated', 'examined',
    'executed', 'expanded', 'expedited', 'explained', 'explored', 'expressed',
    'extracted', 'facilitated', 'finalized', 'followed', 'formulated', 'founded',
    'generated', 'guided', 'headed', 'helped', 'identified', 'illustrated',
    'implemented', 'improved', 'influenced, initiated', 'innovated', 'inspected',
    'installed', 'instituted', 'instructed', 'integrated', 'interpreted', 'interviewed',
    'introduced', 'invented', 'investigated', 'joined', 'judged', 'launched',
    'led', 'lectured', 'maintained', 'managed', 'marketed', 'mediated', 'merged',
    'modified', 'monitored', 'motivated', 'negotiated', 'obtained', 'operated',
    'organized', 'originated', 'oversaw', 'participated', 'performed', 'persuaded',
    'planned', 'presented', 'presided', 'produced', 'programmed', 'promoted',
    'proposed', 'provided', 'publicized', 'published', 'reduced', 'refined',
    'regulated', 'reinforced', 'reorganized', 'repaired', 'replaced', 'reported',
    'represented', 'researched', 'resolved', 'responded', 'restored', 'restructured',
    'revised', 'revitalized', 'saved', 'scheduled', 'secured', 'selected', 'served',
    'simplified', 'solved', 'specified', 'staffed', 'standardized', 'started',
    'streamlined', 'strengthened', 'structured', 'studied', 'succeeded', 'suggested',
    'summarized', 'supervised', 'supported', 'sustained', 'systematized', 'taught',
    'tested', 'trained', 'transferred', 'transformed', 'translated', 'updated',
    'upgraded', 'used', 'utilized', 'validated', 'verified', 'wrote', 'worked'
  ];

  private readonly industryKeywords = {
    technology: [
      'javascript', 'typescript', 'python', 'java', 'react', 'angular', 'vue',
      'node.js', 'express', 'django', 'flask', 'spring', '.net', 'aws', 'azure',
      'gcp', 'docker', 'kubernetes', 'jenkins', 'git', 'agile', 'scrum',
      'devops', 'ci/cd', 'microservices', 'apis', 'rest', 'graphql', 'sql',
      'nosql', 'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch',
      'machine learning', 'ai', 'data science', 'analytics', 'blockchain',
      'cloud computing', 'serverless', 'lambda', 'functions', 'saas', 'paas'
    ],
    healthcare: [
      'patient care', 'medical records', 'hipaa', 'clinical', 'diagnosis',
      'treatment', 'electronic health records', 'ehr', 'medical terminology',
      'cpr', 'bls', 'nursing', 'healthcare', 'medicine', 'surgery',
      'pharmacy', 'therapy', 'rehabilitation', 'medical billing', 'coding',
      'healthcare administration', 'patient safety', 'clinical research'
    ],
    finance: [
      'financial analysis', 'accounting', 'bookkeeping', 'audit', 'compliance',
      'risk management', 'investment', 'portfolio', 'banking', 'insurance',
      'fintech', 'cryptocurrency', 'blockchain', 'trading', 'wealth management',
      'tax preparation', 'financial planning', 'budgeting', 'forecasting',
      'financial modeling', 'valuation', 'due diligence', 'mergers', 'acquisitions'
    ],
    marketing: [
      'digital marketing', 'seo', 'sem', 'ppc', 'social media', 'content marketing',
      'email marketing', 'branding', 'market research', 'analytics', 'campaign',
      'lead generation', 'conversion optimization', 'crm', 'marketing automation',
      'public relations', 'advertising', 'copywriting', 'graphic design', 'video'
    ],
    sales: [
      'sales', 'business development', 'lead generation', 'crm', 'customer relationship',
      'negotiation', 'closing', 'prospecting', 'cold calling', 'account management',
      'sales forecasting', 'quota', 'pipeline', 'territory management', 'solution selling'
    ]
  };

  calculateATSScore(
    resume: Partial<Resume>,
    options: ATSScoringOptions = {}
  ): ATSScoreBreakdown {
    const {
      jobDescription,
      industry,
      experienceLevel,
      strictMode = false,
      includeRecommendations = true,
    } = options;

    // Initialize scores
    const formatting = this.scoreFormatting(resume);
    const keywords = this.scoreKeywords(resume, jobDescription, industry);
    const structure = this.scoreStructure(resume);
    const content = this.scoreContent(resume);
    const completeness = this.scoreCompleteness(resume);

    // Calculate weighted total score
    const categories = {
      formatting: formatting.score,
      keywords: keywords.score,
      structure: structure.score,
      content: content.score,
      completeness: completeness.score,
    };

    const totalScore = Object.entries(categories).reduce((total, [category, score]) => {
      return total + (score * this.categoryWeights[category as keyof typeof categories]);
    }, 0);

    // Generate recommendations
    const recommendations = includeRecommendations ?
      this.generateRecommendations(formatting, keywords, structure, content, completeness) :
      [];

    // Identify critical issues
    const criticalIssues = this.identifyCriticalIssues(formatting, keywords, structure, content, completeness);

    // Calculate improvement potential
    const improvementPotential = this.calculateImprovementPotential(categories);

    return {
      totalScore: Math.round(totalScore),
      categories,
      details: {
        formatting,
        keywords,
        structure,
        content,
        completeness,
      },
      recommendations,
      criticalIssues,
      improvementPotential,
    };
  }

  private scoreFormatting(resume: Partial<Resume>): FormattingScore {
    const score = {
      score: 100,
      issues: [] as string[],
      checks: {
        hasCleanFormat: true,
        noFancyFormatting: true,
        standardFonts: true,
        properSpacing: true,
        noTablesOrColumns: true,
        readableLength: true,
      }
    };

    // Check for formatting issues (these would be detected during parsing)
    // For now, we'll simulate based on resume metadata
    if (resume.metadata?.documentFormat === 'pdf') {
      // PDF format - generally good for ATS
      score.checks.hasCleanFormat = true;
    } else {
      score.checks.hasCleanFormat = false;
      score.issues.push('Non-PDF format may cause ATS parsing issues');
      score.score -= 10;
    }

    // Check experience length (not too long, not too short)
    if (resume.experience) {
      const totalLength = resume.experience.reduce((sum, exp) =>
        sum + (exp.description?.length || 0), 0
      );

      if (totalLength < 200) {
        score.issues.push('Experience section too brief - add more detail');
        score.score -= 15;
      } else if (totalLength > 2000) {
        score.issues.push('Experience section too lengthy - consider condensing');
        score.score -= 10;
      }
    }

    // Check summary length
    if (resume.summary) {
      if (resume.summary.length < 50) {
        score.issues.push('Summary too short - add more detail about your qualifications');
        score.score -= 10;
      } else if (resume.summary.length > 300) {
        score.issues.push('Summary too long - keep it concise (2-3 sentences)');
        score.score -= 5;
      }
    } else {
      score.issues.push('Missing professional summary');
      score.score -= 15;
    }

    return {
      score: Math.max(0, score.score),
      issues: score.issues,
      checks: score.checks,
    };
  }

  private scoreKeywords(
    resume: Partial<Resume>,
    jobDescription?: string,
    industry?: string
  ): KeywordScore {
    const resumeText = this.extractTextFromResume(resume);
    const keywordMatches: KeywordMatch[] = [];
    const foundKeywords = new Set<string>();

    // Extract keywords from job description if provided
    const jobKeywords = jobDescription ? this.extractKeywordsFromText(jobDescription) : [];

    // Get industry-specific keywords
    const industryKeywords = industry ? this.industryKeywords[industry as keyof typeof this.industryKeywords] || [] : [];

    // Combine all keywords
    const allKeywords = [...new Set([...jobKeywords, ...industryKeywords])];

    // Check keyword matches
    allKeywords.forEach(keyword => {
      const regex = new RegExp(keyword, 'gi');
      const matches = resumeText.match(regex);
      const count = matches ? matches.length : 0;
      const found = count > 0;

      if (found) {
        foundKeywords.add(keyword.toLowerCase());
      }

      // Determine importance based on context
      let importance: 'high' | 'medium' | 'low' = 'medium';
      if (jobKeywords.includes(keyword)) {
        importance = 'high';
      } else if (industryKeywords.includes(keyword)) {
        importance = 'medium';
      } else {
        importance = 'low';
      }

      // Extract context around keyword matches
      const contexts: string[] = [];
      if (matches) {
        resumeText.split(/\n/).forEach(line => {
          if (regex.test(line)) {
            contexts.push(line.trim());
          }
        });
      }

      keywordMatches.push({
        keyword,
        found,
        count,
        context: contexts,
        importance,
      });
    });

    // Calculate keyword density analysis
    const words = resumeText.split(/\s+/);
    const totalWords = words.length;
    const keywordDensity: { dense: string[]; sparse: string[]; optimal: string[] } = {
      dense: [],
      sparse: [],
      optimal: [],
    };

    keywordMatches.forEach(match => {
      if (match.found) {
        const density = (match.count / totalWords) * 100;
        if (density > 3) {
          keywordDensity.dense.push(match.keyword);
        } else if (density < 0.5) {
          keywordDensity.sparse.push(match.keyword);
        } else {
          keywordDensity.optimal.push(match.keyword);
        }
      }
    });

    // Calculate relevance score
    const relevantKeywords = keywordMatches.filter(m => m.found && m.importance !== 'low');
    const relevanceScore = allKeywords.length > 0 ?
      (relevantKeywords.length / allKeywords.length) * 100 : 0;

    // Calculate keyword score
    const foundHighImportance = keywordMatches.filter(m => m.found && m.importance === 'high').length;
    const totalHighImportance = keywordMatches.filter(m => m.importance === 'high').length;
    const keywordScore = totalHighImportance > 0 ?
      (foundHighImportance / totalHighImportance) * 80 + relevanceScore * 0.2 : relevanceScore;

    return {
      score: Math.min(100, Math.round(keywordScore)),
      keywordMatches,
      keywordDensity,
      industryKeywords: {
        found: Array.from(foundKeywords),
        missing: allKeywords.filter(k => !foundKeywords.has(k.toLowerCase())),
        relevanceScore: Math.round(relevanceScore),
      },
    };
  }

  private scoreStructure(resume: Partial<Resume>): StructureScore {
    const score = {
      score: 100,
      sectionOrder: [] as string[],
      missingSections: [] as string[],
      extraSections: [] as string[],
      checks: {
        hasContactInfo: false,
        hasSummary: false,
        hasExperience: false,
        hasEducation: false,
        hasSkills: false,
        logicalFlow: true,
      }
    };

    // Check required sections
    if (resume.personalInfo) {
      score.checks.hasContactInfo = !!(
        resume.personalInfo.email &&
        resume.personalInfo.phone &&
        resume.personalInfo.fullName
      );
      if (score.checks.hasContactInfo) {
        score.sectionOrder.push('Contact Info');
      } else {
        score.missingSections.push('Contact Information');
        score.score -= 20;
      }
    } else {
      score.missingSections.push('Contact Information');
      score.score -= 20;
    }

    if (resume.summary) {
      score.checks.hasSummary = true;
      score.sectionOrder.push('Summary');
    } else {
      score.missingSections.push('Professional Summary');
      score.score -= 15;
    }

    if (resume.experience && resume.experience.length > 0) {
      score.checks.hasExperience = true;
      score.sectionOrder.push('Experience');
    } else {
      score.missingSections.push('Work Experience');
      score.score -= 25;
    }

    if (resume.education && resume.education.length > 0) {
      score.checks.hasEducation = true;
      score.sectionOrder.push('Education');
    } else {
      score.missingSections.push('Education');
      score.score -= 10;
    }

    if (resume.skills && resume.skills.length > 0) {
      score.checks.hasSkills = true;
      score.sectionOrder.push('Skills');
    } else {
      score.missingSections.push('Skills');
      score.score -= 10;
    }

    // Check section order (reverse chronological is preferred)
    const preferredOrder = ['Contact Info', 'Summary', 'Experience', 'Education', 'Skills'];
    const orderScore = this.calculateOrderScore(score.sectionOrder, preferredOrder);
    score.checks.logicalFlow = orderScore >= 0.8;
    if (!score.checks.logicalFlow) {
      score.score -= 5;
    }

    return {
      score: Math.max(0, score.score),
      sectionOrder: score.sectionOrder,
      missingSections: score.missingSections,
      extraSections: score.extraSections,
      checks: score.checks,
    };
  }

  private scoreContent(resume: Partial<Resume>): ContentScore {
    const metrics = {
      actionVerbUsage: 0,
      quantificationScore: 0,
      impactScore: 0,
      clarityScore: 0,
      relevanceScore: 0,
    };

    const issues: string[] = [];
    const strengths: string[] = [];

    // Score action verb usage
    if (resume.experience) {
      const experienceText = resume.experience.map(exp =>
        (exp.description || '') + ' ' + (exp.achievements?.join(' ') || '')
      ).join(' ');

      const words = experienceText.split(/\s+/);
      const actionVerbCount = words.filter(word =>
        this.actionVerbs.includes(word.toLowerCase().replace(/[.,;]/g, ''))
      ).length;

      metrics.actionVerbUsage = words.length > 0 ? (actionVerbCount / words.length) * 100 : 0;

      if (metrics.actionVerbUsage < 10) {
        issues.push('Low action verb usage - start bullet points with strong action verbs');
      } else if (metrics.actionVerbUsage > 20) {
        strengths.push('Good action verb usage');
      }
    }

    // Score quantification
    let quantifiablePoints = 0;
    let totalPoints = 0;

    if (resume.experience) {
      resume.experience.forEach(exp => {
        const text = (exp.description || '') + ' ' + (exp.achievements?.join(' ') || '');
        const bulletPoints = text.split(/[•\-\n]/).filter(bp => bp.trim().length > 0);

        bulletPoints.forEach(point => {
          totalPoints++;
          if (/\d+%|\$\d+|\d+\s*(year|month|day|hour|time|customer|user|employee)/i.test(point)) {
            quantifiablePoints++;
          }
        });
      });
    }

    metrics.quantificationScore = totalPoints > 0 ? (quantifiablePoints / totalPoints) * 100 : 0;

    if (metrics.quantificationScore < 30) {
      issues.push('Low quantification - add metrics and numbers to demonstrate impact');
    } else if (metrics.quantificationScore > 60) {
      strengths.push('Good use of quantification and metrics');
    }

    // Calculate overall content score
    metrics.impactScore = (metrics.actionVerbUsage * 0.3 + metrics.quantificationScore * 0.7);
    metrics.clarityScore = 75; // Would be calculated based on readability metrics
    metrics.relevanceScore = 80; // Would be calculated based on job description matching

    const contentScore = (metrics.impactScore * 0.4 + metrics.clarityScore * 0.3 + metrics.relevanceScore * 0.3);

    return {
      score: Math.round(contentScore),
      metrics,
      issues,
      strengths,
    };
  }

  private scoreCompleteness(resume: Partial<Resume>): CompletenessScore {
    const completeness = {
      contactInfo: 0,
      summary: 0,
      experience: 0,
      education: 0,
      skills: 0,
    };

    const missingCritical: string[] = [];

    // Score contact info completeness
    if (resume.personalInfo) {
      let contactScore = 0;
      if (resume.personalInfo.fullName) contactScore += 25;
      if (resume.personalInfo.email) contactScore += 25;
      if (resume.personalInfo.phone) contactScore += 25;
      if (resume.personalInfo.location) contactScore += 15;
      if (resume.personalInfo.linkedin || resume.personalInfo.github) contactScore += 10;

      completeness.contactInfo = contactScore;

      if (contactScore < 50) {
        missingCritical.push('Complete contact information');
      }
    } else {
      missingCritical.push('Contact information');
    }

    // Score summary completeness
    if (resume.summary) {
      if (resume.summary.length >= 50 && resume.summary.length <= 300) {
        completeness.summary = 100;
      } else if (resume.summary.length > 0) {
        completeness.summary = 50;
      } else {
        missingCritical.push('Professional summary');
      }
    } else {
      missingCritical.push('Professional summary');
    }

    // Score experience completeness
    if (resume.experience && resume.experience.length > 0) {
      const expScore = Math.min(100, resume.experience.length * 25);
      completeness.experience = expScore;

      // Check if experiences have descriptions
      const withDescriptions = resume.experience.filter(exp =>
        exp.description && exp.description.length > 50
      ).length;

      if (withDescriptions === 0) {
        missingCritical.push('Experience descriptions');
      }
    } else {
      missingCritical.push('Work experience');
    }

    // Score education completeness
    if (resume.education && resume.education.length > 0) {
      completeness.education = 100;
    } else {
      missingCritical.push('Education information');
    }

    // Score skills completeness
    if (resume.skills && resume.skills.length > 0) {
      completeness.skills = Math.min(100, resume.skills.length * 5);
    } else {
      missingCritical.push('Skills section');
    }

    const totalScore = Object.values(completeness).reduce((sum, score) => sum + score, 0) / 5;

    return {
      score: Math.round(totalScore),
      completeness,
      missingCritical,
    };
  }

  private extractTextFromResume(resume: Partial<Resume>): string {
    const textParts: string[] = [];

    if (resume.personalInfo) {
      textParts.push(Object.values(resume.personalInfo).filter(Boolean).join(' '));
    }

    if (resume.summary) {
      textParts.push(resume.summary);
    }

    if (resume.experience) {
      resume.experience.forEach(exp => {
        textParts.push(exp.title || '');
        textParts.push(exp.company || '');
        textParts.push(exp.description || '');
        if (exp.achievements) {
          textParts.push(exp.achievements.join(' '));
        }
      });
    }

    if (resume.education) {
      resume.education.forEach(edu => {
        textParts.push(edu.degree || '');
        textParts.push(edu.field || '');
        textParts.push(edu.institution || '');
      });
    }

    if (resume.skills) {
      textParts.push(resume.skills.map(skill => skill.name).join(' '));
    }

    return textParts.join(' ').toLowerCase();
  }

  private extractKeywordsFromText(text: string): string[] {
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
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.has(word))
      .filter((word, index, array) => array.indexOf(word) === index) // Remove duplicates
      .slice(0, 50); // Limit to top 50 keywords
  }

  private calculateOrderScore(currentOrder: string[], preferredOrder: string[]): number {
    let score = 0;
    for (let i = 0; i < preferredOrder.length; i++) {
      const currentIndex = currentOrder.indexOf(preferredOrder[i]);
      if (currentIndex !== -1) {
        // Score based on how close to preferred position
        const distance = Math.abs(currentIndex - i);
        score += Math.max(0, 1 - distance * 0.2);
      }
    }
    return score / preferredOrder.length;
  }

  private generateRecommendations(
    formatting: FormattingScore,
    keywords: KeywordScore,
    structure: StructureScore,
    content: ContentScore,
    completeness: CompletenessScore
  ): string[] {
    const recommendations: string[] = [];

    // Formatting recommendations
    if (formatting.score < 80) {
      recommendations.push(...formatting.issues);
    }

    // Keyword recommendations
    if (keywords.score < 70) {
      if (keywords.keywordDensity.sparse.length > 0) {
        recommendations.push(`Increase frequency of important keywords: ${keywords.keywordDensity.sparse.slice(0, 3).join(', ')}`);
      }
      if (keywords.industryKeywords.missing.length > 0) {
        recommendations.push(`Add missing industry keywords: ${keywords.industryKeywords.missing.slice(0, 3).join(', ')}`);
      }
    }

    // Structure recommendations
    if (structure.score < 80) {
      if (structure.missingSections.length > 0) {
        recommendations.push(`Add missing sections: ${structure.missingSections.join(', ')}`);
      }
      if (!structure.checks.logicalFlow) {
        recommendations.push('Reorder sections to follow standard resume format');
      }
    }

    // Content recommendations
    if (content.score < 75) {
      recommendations.push(...content.issues);
    }

    // Completeness recommendations
    if (completeness.missingCritical.length > 0) {
      recommendations.push(`Complete critical sections: ${completeness.missingCritical.join(', ')}`);
    }

    return recommendations.slice(0, 10); // Limit to top 10 recommendations
  }

  private identifyCriticalIssues(
    formatting: FormattingScore,
    keywords: KeywordScore,
    structure: StructureScore,
    content: ContentScore,
    completeness: CompletenessScore
  ): string[] {
    const criticalIssues: string[] = [];

    // Critical formatting issues
    if (!formatting.checks.hasCleanFormat) {
      criticalIssues.push('Document format may cause ATS parsing failures');
    }

    // Critical structure issues
    if (!structure.checks.hasContactInfo) {
      criticalIssues.push('Missing or incomplete contact information');
    }
    if (!structure.checks.hasExperience) {
      criticalIssues.push('No work experience section found');
    }

    // Critical content issues
    if (content.metrics.actionVerbUsage < 5) {
      criticalIssues.push('Insufficient use of action verbs in experience descriptions');
    }

    // Critical completeness issues
    if (completeness.missingCritical.length > 2) {
      criticalIssues.push('Multiple critical sections missing from resume');
    }

    return criticalIssues;
  }

  private calculateImprovementPotential(categories: any): number {
    // Calculate how much room for improvement exists
    const averageScore = Object.values(categories).reduce((sum: number, score: any) =>
      sum + (score as number), 0) / Object.keys(categories).length;

    return Math.max(0, Math.min(100, 100 - averageScore));
  }
}

// Export singleton instance
export const atsScorer = new ATSScorer();