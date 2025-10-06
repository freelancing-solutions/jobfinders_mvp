/**
 * AI Resume Analyzer Service
 *
 * Advanced AI-powered resume analysis using OpenAI for content evaluation,
 * improvement suggestions, and ATS optimization recommendations.
 */

import { v4 as uuidv4 } from 'uuid';
import { Resume, ResumeAnalysis, KeywordMatch, SkillGap, ImprovementSuggestion } from '@/types/resume';
import { ResumeBuilderErrorFactory, withServiceErrorHandling } from './errors';
import { openAIService } from './openai-service';
import { resumeBuilderConfig } from './config';

export interface AnalysisOptions {
  jobDescription?: string;
  jobTitle?: string;
  industry?: string;
  experienceLevel?: string;
  targetCompany?: string;
  analysisDepth?: 'quick' | 'standard' | 'comprehensive';
  includeSuggestions?: boolean;
  benchmarkAgainst?: boolean;
}

export interface AIAnalysisResult {
  analysis: ResumeAnalysis;
  insights: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  recommendations: {
    immediate: ImprovementSuggestion[];
    shortTerm: ImprovementSuggestion[];
    longTerm: ImprovementSuggestion[];
  };
  marketFit: {
    industryAlignment: number; // 0-100
    roleMatch: number; // 0-100
    experienceMatch: number; // 0-100
    skillMatch: number; // 0-100
  };
  processingMetadata: {
    modelUsed: string;
    tokensConsumed: number;
    processingTime: number;
    confidence: number;
  };
}

export interface BenchmarkData {
  industry: string;
  role: string;
  experienceLevel: string;
  averageScore: number;
  topSkills: string[];
  commonKeywords: string[];
  recommendedSections: string[];
}

export class AIAnalyzer {
  private readonly analysisPrompts = {
    overall: `You are an expert resume analyst and career coach with deep knowledge of Applicant Tracking Systems (ATS), recruitment trends, and industry best practices across multiple sectors.

Your task is to provide a comprehensive analysis of the provided resume ${'and job description' || ''}. Focus on:

1. ATS compatibility and keyword optimization
2. Content quality and impact quantification
3. Structure and formatting effectiveness
4. Skills and experience alignment with market demands
5. Areas for improvement with specific, actionable recommendations

Provide detailed, constructive feedback with examples where appropriate. Consider both technical excellence and human readability.`,

    ats: `As an ATS optimization specialist, analyze this resume for Applicant Tracking System compatibility:

Key focus areas:
- Keyword density and relevance
- Section structure and formatting
- Action verb usage and impact statements
- Quantifiable achievements and metrics
- Industry-specific terminology
- Section ordering and completeness

Provide an ATS score (0-100) with detailed breakdown and specific improvement recommendations.`,

    content: `As a professional resume writer and content strategist, analyze the resume content for:

1. Impact and achievement quantification
2. Action verb effectiveness
3. Storytelling and narrative flow
4. Value proposition clarity
5. Professional tone and messaging
6. Section completeness and relevance

Provide specific examples of improvements and rewrites where needed.`,

    market: `As a labor market analyst and industry expert, evaluate this resume against current market demands:

1. Industry alignment and trends
2. In-demand skills and certifications
3. Experience level match for target roles
4. Competitive positioning
5. Salary range implications
6. Career progression opportunities

Provide insights on market positioning and recommendations for improvement.`
  };

  async analyzeResume(
    resume: Partial<Resume>,
    options: AnalysisOptions & { userId: string; requestId?: string } = {
      userId: '',
      analysisDepth: 'standard',
      includeSuggestions: true,
    }
  ): Promise<AIAnalysisResult> {
    const startTime = Date.now();
    const { userId, requestId, ...analysisOptions } = options;

    try {
      console.log(`[AIAnalyzer] Starting analysis: ${requestId}`);

      // Prepare resume text for analysis
      const resumeText = this.prepareResumeText(resume);

      // Determine analysis depth
      const depth = analysisOptions.analysisDepth || 'standard';

      // Perform concurrent analyses based on depth
      const analysisPromises: Promise<any>[] = [];

      // Core analysis (always included)
      analysisPromises.push(this.performATSAnalysis(resumeText, analysisOptions, userId, requestId));

      if (depth === 'standard' || depth === 'comprehensive') {
        analysisPromises.push(this.performContentAnalysis(resumeText, analysisOptions, userId, requestId));
      }

      if (depth === 'comprehensive') {
        analysisPromises.push(this.performMarketAnalysis(resumeText, analysisOptions, userId, requestId));
      }

      if (analysisOptions.includeSuggestions) {
        analysisPromises.push(this.generateImprovementSuggestions(resume, analysisOptions, userId, requestId));
      }

      // Wait for all analyses to complete
      const results = await Promise.allSettled(analysisPromises);

      // Combine results
      const combinedAnalysis = this.combineAnalysisResults(results, resume, analysisOptions);

      // Calculate market fit scores
      const marketFit = await this.calculateMarketFit(resume, analysisOptions, userId, requestId);

      // Generate insights
      const insights = this.generateInsights(combinedAnalysis, marketFit);

      const processingTime = Date.now() - startTime;
      console.log(`[AIAnalyzer] Analysis completed: ${requestId} (${processingTime}ms)`);

      return {
        analysis: combinedAnalysis.analysis,
        insights,
        recommendations: combinedAnalysis.recommendations,
        marketFit,
        processingMetadata: {
          modelUsed: 'gpt-4-turbo-preview',
          tokensConsumed: combinedAnalysis.tokensConsumed || 0,
          processingTime,
          confidence: combinedAnalysis.confidence || 0,
        },
      };

    } catch (error) {
      console.error(`[AIAnalyzer] Analysis failed: ${requestId}`, error);
      throw ResumeBuilderErrorFactory.aiServiceError(
        error instanceof Error ? error : new Error('Analysis failed'),
        requestId
      );
    }
  }

  private prepareResumeText(resume: Partial<Resume>): string {
    const sections: string[] = [];

    // Add personal information
    if (resume.personalInfo) {
      sections.push(`NAME: ${resume.personalInfo.fullName}`);
      sections.push(`EMAIL: ${resume.personalInfo.email}`);
      sections.push(`PHONE: ${resume.personalInfo.phone}`);
      sections.push(`LOCATION: ${resume.personalInfo.location}`);
      if (resume.personalInfo.linkedin) sections.push(`LINKEDIN: ${resume.personalInfo.linkedin}`);
      if (resume.personalInfo.github) sections.push(`GITHUB: ${resume.personalInfo.github}`);
    }

    // Add summary
    if (resume.summary) {
      sections.push(`\nSUMMARY:\n${resume.summary}`);
    }

    // Add experience
    if (resume.experience && resume.experience.length > 0) {
      sections.push('\nEXPERIENCE:');
      resume.experience.forEach((exp, index) => {
        sections.push(`${index + 1}. ${exp.title} at ${exp.company} (${exp.startDate} - ${exp.endDate || 'Present'})`);
        if (exp.description) sections.push(`   ${exp.description}`);
        if (exp.achievements && exp.achievements.length > 0) {
          exp.achievements.forEach(achievement => {
            sections.push(`   • ${achievement}`);
          });
        }
      });
    }

    // Add education
    if (resume.education && resume.education.length > 0) {
      sections.push('\nEDUCATION:');
      resume.education.forEach((edu, index) => {
        let eduText = `${index + 1}. ${edu.degree} in ${edu.field} at ${edu.institution}`;
        if (edu.gpa) eduText += ` (GPA: ${edu.gpa})`;
        sections.push(eduText);
      });
    }

    // Add skills
    if (resume.skills && resume.skills.length > 0) {
      sections.push('\nSKILLS:');
      const skillsByCategory = resume.skills.reduce((acc, skill) => {
        if (!acc[skill.category]) acc[skill.category] = [];
        acc[skill.category].push(skill.name);
        return acc;
      }, {} as Record<string, string[]>);

      Object.entries(skillsByCategory).forEach(([category, skills]) => {
        sections.push(`${category.toUpperCase()}: ${skills.join(', ')}`);
      });
    }

    // Add projects
    if (resume.projects && resume.projects.length > 0) {
      sections.push('\nPROJECTS:');
      resume.projects.forEach((project, index) => {
        sections.push(`${index + 1}. ${project.name}`);
        if (project.description) sections.push(`   ${project.description}`);
        if (project.technologies && project.technologies.length > 0) {
          sections.push(`   Technologies: ${project.technologies.join(', ')}`);
        }
      });
    }

    return sections.join('\n');
  }

  private async performATSAnalysis(
    resumeText: string,
    options: AnalysisOptions,
    userId: string,
    requestId: string
  ): Promise<any> {
    const prompt = `
${this.analysisPrompts.ats}

${options.jobDescription ? `TARGET JOB DESCRIPTION:
${options.jobDescription}

` : ''}RESUME TO ANALYZE:
${resumeText}

Please provide your analysis in JSON format:
{
  "atsScore": number (0-100),
  "keywordMatches": [
    {
      "keyword": string,
      "found": boolean,
      "count": number,
      "context": string[],
      "importance": "high" | "medium" | "low"
    }
  ],
  "skillGaps": [
    {
      "skill": string,
      "importance": "required" | "preferred" | "bonus",
      "foundInResume": boolean,
      "proficiencyLevel": string
    }
  ],
  "improvementSuggestions": [
    {
      "category": "content" | "formatting" | "keywords" | "structure" | "impact",
      "priority": "high" | "medium" | "low",
      "suggestion": string,
      "example": string,
      "section": string
    }
  ],
  "strengths": string[],
  "weaknesses": string[]
}`;

    const response = await openAIService.chatCompletion(
      [
        { role: 'system', content: this.analysisPrompts.ats },
        { role: 'user', content: prompt }
      ],
      {
        temperature: 0.3,
        operation: 'analysis',
        userId,
        requestId,
      }
    );

    try {
      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('[AIAnalyzer] Failed to parse ATS analysis response:', error);
      throw new Error('Invalid ATS analysis response format');
    }
  }

  private async performContentAnalysis(
    resumeText: string,
    options: AnalysisOptions,
    userId: string,
    requestId: string
  ): Promise<any> {
    const prompt = `
${this.analysisPrompts.content}

RESUME TO ANALYZE:
${resumeText}

Please provide your analysis in JSON format:
{
  "contentQuality": number (0-100),
  "impactScore": number (0-100),
  "storytellingScore": number (0-100),
  "readabilityScore": number (0-100),
  "actionVerbEffectiveness": number (0-100),
  "quantificationScore": number (0-100),
  "contentStrengths": string[],
  "contentWeaknesses": string[],
  "contentRecommendations": [
    {
      "section": string,
      "currentText": string,
      "suggestedText": string,
      "reason": string,
      "impact": "high" | "medium" | "low"
    }
  ]
}`;

    const response = await openAIService.chatCompletion(
      [
        { role: 'system', content: this.analysisPrompts.content },
        { role: 'user', content: prompt }
      ],
      {
        temperature: 0.4,
        operation: 'analysis',
        userId,
        requestId,
      }
    );

    try {
      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('[AIAnalyzer] Failed to parse content analysis response:', error);
      throw new Error('Invalid content analysis response format');
    }
  }

  private async performMarketAnalysis(
    resumeText: string,
    options: AnalysisOptions,
    userId: string,
    requestId: string
  ): Promise<any> {
    const prompt = `
${this.analysisPrompts.market}

TARGET ROLE: ${options.jobTitle || 'Not specified'}
TARGET INDUSTRY: ${options.industry || 'Not specified'}
EXPERIENCE LEVEL: ${options.experienceLevel || 'Not specified'}

RESUME TO ANALYZE:
${resumeText}

Please provide your analysis in JSON format:
{
  "marketAlignment": number (0-100),
  "competitiveness": number (0-100),
  "salaryPotential": "low" | "medium" | "high" | "very-high",
  "careerProgression": number (0-100),
  "industryTrends": string[],
  "inDemandSkills": string[],
  "missingSkills": string[],
  "marketRecommendations": [
    {
      "category": "skills" | "experience" | "certification" | "networking",
      "recommendation": string,
      "urgency": "high" | "medium" | "low",
      "timeToComplete": string
    }
  ]
}`;

    const response = await openAIService.chatCompletion(
      [
        { role: 'system', content: this.analysisPrompts.market },
        { role: 'user', content: prompt }
      ],
      {
        temperature: 0.5,
        operation: 'analysis',
        userId,
        requestId,
      }
    );

    try {
      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('[AIAnalyzer] Failed to parse market analysis response:', error);
      throw new Error('Invalid market analysis response format');
    }
  }

  private async generateImprovementSuggestions(
    resume: Partial<Resume>,
    options: AnalysisOptions,
    userId: string,
    requestId: string
  ): Promise<any> {
    const resumeText = this.prepareResumeText(resume);

    const prompt = `
As a master resume coach and career strategist, provide specific, actionable improvement suggestions for this resume:

TARGET ROLE: ${options.jobTitle || 'Not specified'}
TARGET INDUSTRY: ${options.industry || 'Not specified'}

RESUME:
${resumeText}

Please provide 3-5 high-impact suggestions for each category in JSON format:
{
  "suggestions": [
    {
      "category": "content" | "formatting" | "keywords" | "structure" | "impact",
      "priority": "high" | "medium" | "low",
      "title": string,
      "description": string,
      "example": string,
      "section": string,
      "expectedImpact": "minimal" | "moderate" | "significant" | "transformational",
      "implementationTime": "quick" | "moderate" | "extensive"
    }
  ]
}

Focus on suggestions that will have the biggest impact on ATS scoring and interview chances.`;

    const response = await openAIService.chatCompletion(
      [
        { role: 'system', content: 'You are an expert resume coach providing specific, actionable advice.' },
        { role: 'user', content: prompt }
      ],
      {
        temperature: 0.6,
        operation: 'generation',
        userId,
        requestId,
      }
    );

    try {
      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('[AIAnalyzer] Failed to parse suggestions response:', error);
      throw new Error('Invalid suggestions response format');
    }
  }

  private combineAnalysisResults(
    results: PromiseSettledResult<any>[],
    resume: Partial<Resume>,
    options: AnalysisOptions
  ): {
    analysis: ResumeAnalysis;
    recommendations: any;
    tokensConsumed?: number;
    confidence?: number;
  } {
    const analysis: Partial<ResumeAnalysis> = {
      id: uuidv4(),
      resumeId: resume.id || '',
      jobDescription: options.jobDescription,
      atsScore: 0,
      keywordMatches: [],
      skillGaps: [],
      improvementSuggestions: [],
      strengths: [],
      weaknesses: [],
      analyzedAt: new Date(),
    };

    let recommendations = {
      immediate: [] as any[],
      shortTerm: [] as any[],
      longTerm: [] as any[],
    };

    let totalTokens = 0;
    let confidenceSum = 0;
    let validResults = 0;

    // Process ATS analysis
    if (results[0]?.status === 'fulfilled') {
      const atsResult = results[0].value;
      analysis.atsScore = atsResult.atsScore || 0;
      analysis.keywordMatches = atsResult.keywordMatches || [];
      analysis.skillGaps = atsResult.skillGaps || [];
      analysis.improvementSuggestions = atsResult.improvementSuggestions || [];
      analysis.strengths = atsResult.strengths || [];
      analysis.weaknesses = atsResult.weaknesses || [];
      confidenceSum += 0.9;
      validResults++;
    }

    // Process content analysis
    if (results[1]?.status === 'fulfilled') {
      const contentResult = results[1].value;
      analysis.strengths = [...(analysis.strengths || []), ...(contentResult.contentStrengths || [])];
      analysis.weaknesses = [...(analysis.weaknesses || []), ...(contentResult.contentWeaknesses || [])];
      confidenceSum += 0.8;
      validResults++;
    }

    // Process market analysis
    if (results[2]?.status === 'fulfilled') {
      const marketResult = results[2].value;
      // Add market insights to strengths/weaknesses
      if (marketResult.inDemandSkills && marketResult.inDemandSkills.length > 0) {
        analysis.strengths?.push(`Strong alignment with in-demand skills: ${marketResult.inDemandSkills.join(', ')}`);
      }
      if (marketResult.missingSkills && marketResult.missingSkills.length > 0) {
        analysis.weaknesses?.push(`Missing key skills: ${marketResult.missingSkills.join(', ')}`);
      }
      confidenceSum += 0.7;
      validResults++;
    }

    // Process suggestions
    if (results[results.length - 1]?.status === 'fulfilled') {
      const suggestionsResult = results[results.length - 1].value;
      if (suggestionsResult.suggestions) {
        suggestionsResult.suggestions.forEach((suggestion: any) => {
          if (suggestion.priority === 'high' && suggestion.implementationTime === 'quick') {
            recommendations.immediate.push(suggestion);
          } else if (suggestion.priority === 'high' || suggestion.implementationTime === 'moderate') {
            recommendations.shortTerm.push(suggestion);
          } else {
            recommendations.longTerm.push(suggestion);
          }
        });
      }
    }

    return {
      analysis: analysis as ResumeAnalysis,
      recommendations,
      tokensConsumed: totalTokens,
      confidence: validResults > 0 ? confidenceSum / validResults : 0,
    };
  }

  private async calculateMarketFit(
    resume: Partial<Resume>,
    options: AnalysisOptions,
    userId: string,
    requestId: string
  ): Promise<any> {
    // Simple market fit calculation based on available data
    const marketFit = {
      industryAlignment: 70, // Default value
      roleMatch: 70,
      experienceMatch: 70,
      skillMatch: 70,
    };

    if (options.jobDescription && resume.skills) {
      // Enhanced calculation when job description is available
      const jobSkills = this.extractSkillsFromText(options.jobDescription);
      const resumeSkills = resume.skills.map(s => s.name.toLowerCase());

      const matchedSkills = jobSkills.filter(skill =>
        resumeSkills.some(resumeSkill => resumeSkill.includes(skill.toLowerCase()) || skill.toLowerCase().includes(resumeSkill))
      );

      marketFit.skillMatch = Math.min(100, (matchedSkills.length / Math.max(jobSkills.length, 1)) * 100);
      marketFit.roleMatch = marketFit.skillMatch * 0.8 + 20; // Adjust for other factors
    }

    return marketFit;
  }

  private extractSkillsFromText(text: string): string[] {
    const skillKeywords = [
      'javascript', 'typescript', 'python', 'java', 'react', 'node.js', 'aws', 'docker',
      'kubernetes', 'mongodb', 'postgresql', 'sql', 'git', 'html', 'css', 'angular',
      'vue.js', 'ruby', 'php', 'c++', 'c#', 'scala', 'go', 'rust', 'swift',
      'leadership', 'management', 'communication', 'project management', 'agile',
      'scrum', 'devops', 'ci/cd', 'machine learning', 'data science', 'analytics'
    ];

    const foundSkills: string[] = [];
    const lowerText = text.toLowerCase();

    skillKeywords.forEach(skill => {
      if (lowerText.includes(skill.toLowerCase())) {
        foundSkills.push(skill);
      }
    });

    return foundSkills;
  }

  private generateInsights(analysis: any, marketFit: any): any {
    return {
      strengths: analysis.analysis?.strengths || [],
      weaknesses: analysis.analysis?.weaknesses || [],
      opportunities: [
        'ATS optimization can improve visibility by 40-60%',
        'Quantifying achievements can increase interview rates by 25%',
        'Skill alignment with job requirements can boost match scores'
      ],
      threats: [
        'Poor ATS compatibility may prevent resume from being seen',
        'Missing keywords can reduce match scores significantly',
        'Incomplete sections may appear as red flags to recruiters'
      ]
    };
  }

  // Benchmark resume against industry standards
  async benchmarkResume(
    resume: Partial<Resume>,
    industry: string,
    role: string,
    options: { userId: string; requestId?: string }
  ): Promise<BenchmarkData> {
    // This would typically use a database of industry benchmarks
    // For now, return mock data
    return {
      industry,
      role,
      experienceLevel: resume.metadata?.experienceLevel || 'mid',
      averageScore: 75,
      topSkills: ['JavaScript', 'React', 'Node.js', 'AWS', 'Docker'],
      commonKeywords: ['full-stack', 'web development', 'cloud computing'],
      recommendedSections: ['Summary', 'Experience', 'Skills', 'Education', 'Projects']
    };
  }
}

// Export singleton instance
export const aiAnalyzer = new AIAnalyzer();

// Export error-wrapped methods for use in routes
export const wrappedAIAnalyzer = {
  analyzeResume: withServiceErrorHandling(aiAnalyzer.analyzeResume.bind(aiAnalyzer), 'analyzeResume'),
  benchmarkResume: withServiceErrorHandling(aiAnalyzer.benchmarkResume.bind(aiAnalyzer), 'benchmarkResume'),
};