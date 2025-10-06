/**
 * Resume Builder Analysis API Route
 *
 * API endpoint for comprehensive resume analysis including ATS scoring,
 * keyword analysis, AI-powered insights, and industry recommendations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { aiAnalyzer } from '@/services/resume-builder/ai-analyzer';
import { atsScorer } from '@/services/resume-builder/ats-scorer';
import { keywordAnalyzer } from '@/lib/keyword-analyzer';
import { ResumeBuilderErrorFactory } from '@/services/resume-builder/errors';
import { resumeBuilderConfig } from '@/services/resume-builder/config';

// Simple in-memory cache for analysis results (in production, use Redis)
const analysisCache = new Map<string, any>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

interface AnalysisRequest {
  resume: any;
  jobDescription?: string;
  jobTitle?: string;
  industry?: string;
  experienceLevel?: string;
  targetCompany?: string;
  analysisDepth?: 'quick' | 'standard' | 'comprehensive';
  includeSuggestions?: boolean;
  benchmarkAgainst?: boolean;
}

interface AnalysisResponse {
  success: boolean;
  data?: {
    aiAnalysis: any;
    atsScore: any;
    keywordAnalysis: any;
    insights: {
      overallScore: number;
      strengths: string[];
      weaknesses: string[];
      recommendations: string[];
      marketFit: any;
    };
    benchmark?: any;
    processingMetadata: {
      totalProcessingTime: number;
      aiProcessingTime: number;
      cacheHit: boolean;
      modelUsed: string;
      tokensConsumed: number;
    };
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  requestId: string;
  timestamp: string;
}

export async function POST(request: NextRequest) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();

  try {
    console.log(`[ResumeAnalyze] Starting analysis request: ${requestId}`);

    // Check if resume builder is enabled
    if (!resumeBuilderConfig.features.resumeBuilder || !resumeBuilderConfig.features.aiAnalysis) {
      return NextResponse.json(createErrorResponse(
        'FEATURE_DISABLED',
        'AI analysis feature is currently disabled',
        { requestId }
      ), { status: 503 });
    }

    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(createErrorResponse(
        'UNAUTHORIZED',
        'Authentication required',
        { requestId }
      ), { status: 401 });
    }

    // Parse and validate request body
    const body: AnalysisRequest = await request.json();
    const {
      resume,
      jobDescription,
      jobTitle,
      industry,
      experienceLevel,
      targetCompany,
      analysisDepth = 'standard',
      includeSuggestions = true,
      benchmarkAgainst = false,
    } = body;

    if (!resume) {
      return NextResponse.json(createErrorResponse(
        'VALIDATION_ERROR',
        'Resume data is required',
        { requestId }
      ), { status: 400 });
    }

    // Check cache first
    const cacheKey = generateCacheKey(session.user.id, resume, {
      jobDescription,
      jobTitle,
      industry,
      experienceLevel,
      analysisDepth
    });

    const cachedResult = analysisCache.get(cacheKey);
    if (cachedResult && (Date.now() - cachedResult.timestamp) < CACHE_TTL) {
      console.log(`[ResumeAnalyze] Cache hit: ${requestId}`);

      return NextResponse.json(createSuccessResponse({
        ...cachedResult.data,
        processingMetadata: {
          ...cachedResult.data.processingMetadata,
          cacheHit: true,
          totalProcessingTime: Date.now() - startTime,
        }
      }, requestId), {
        headers: {
          'X-Request-ID': requestId,
          'X-Cache': 'HIT',
          'X-Process-Time': (Date.now() - startTime).toString(),
        },
      });
    }

    console.log(`[ResumeAnalyze] Cache miss - performing analysis: ${requestId}`);

    // Perform concurrent analyses
    const analysisPromises = [
      performAIAnalysis(resume, {
        jobDescription,
        jobTitle,
        industry,
        experienceLevel,
        targetCompany,
        analysisDepth,
        includeSuggestions,
      }, session.user.id, requestId),

      performATSScoring(resume, {
        jobDescription,
        industry,
        experienceLevel,
      }, requestId),

      performKeywordAnalysis(resume, {
        jobDescription,
        industry,
        jobTitle,
        experienceLevel,
      }, requestId),
    ];

    // Add benchmark analysis if requested
    if (benchmarkAgainst && industry && jobTitle) {
      analysisPromises.push(
        performBenchmarkAnalysis(resume, industry, jobTitle, session.user.id, requestId)
      );
    }

    // Wait for all analyses to complete
    const results = await Promise.allSettled(analysisPromises);

    // Extract results
    const [aiResult, atsResult, keywordResult] = results.map(r =>
      r.status === 'fulfilled' ? r.value : null
    );

    const benchmarkResult = results.length > 3 && results[3].status === 'fulfilled' ?
      results[3].value : null;

    // Handle analysis failures
    const errors: string[] = [];
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const analysisNames = ['AI Analysis', 'ATS Scoring', 'Keyword Analysis', 'Benchmark'];
        errors.push(`${analysisNames[index]} failed: ${result.reason}`);
      }
    });

    if (errors.length > 0 && !aiResult && !atsResult && !keywordResult) {
      throw new Error(`All analyses failed: ${errors.join(', ')}`);
    }

    // Combine results
    const combinedData = combineAnalysisResults(
      aiResult,
      atsResult,
      keywordResult,
      benchmarkResult
    );

    // Calculate overall insights
    const insights = generateOverallInsights(combinedData);

    // Cache the results
    const cacheEntry = {
      data: combinedData,
      timestamp: Date.now(),
    };
    analysisCache.set(cacheKey, cacheEntry);

    // Clean up old cache entries
    cleanupCache();

    const totalProcessingTime = Date.now() - startTime;
    console.log(`[ResumeAnalyze] Analysis completed: ${requestId} (${totalProcessingTime}ms)`);

    return NextResponse.json(createSuccessResponse({
      ...combinedData,
      insights,
      processingMetadata: {
        totalProcessingTime,
        aiProcessingTime: aiResult?.processingMetadata?.processingTime || 0,
        cacheHit: false,
        modelUsed: aiResult?.processingMetadata?.modelUsed || 'unknown',
        tokensConsumed: aiResult?.processingMetadata?.tokensConsumed || 0,
      }
    }, requestId), {
      headers: {
        'X-Request-ID': requestId,
        'X-Cache': 'MISS',
        'X-Process-Time': totalProcessingTime.toString(),
        'X-Overall-Score': insights.overallScore.toString(),
      },
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`[ResumeAnalyze] Analysis failed: ${requestId} (${processingTime}ms)`, error);

    // Handle known service errors
    if (error && typeof error === 'object' && 'code' in error) {
      const serviceError = error as any;

      switch (serviceError.code) {
        case 'AI_SERVICE_ERROR':
          return NextResponse.json(createErrorResponse(
            serviceError.code,
            'AI analysis service temporarily unavailable',
            { ...serviceError.details, requestId }
          ), { status: 503 });

        case 'RATE_LIMIT_EXCEEDED':
          return NextResponse.json(createErrorResponse(
            serviceError.code,
            serviceError.message,
            { ...serviceError.details, requestId }
          ), { status: 429 });

        case 'QUOTA_EXCEEDED':
          return NextResponse.json(createErrorResponse(
            serviceError.code,
            'Analysis quota exceeded',
            { ...serviceError.details, requestId }
          ), { status: 429 });
      }
    }

    // Handle unknown errors
    return NextResponse.json(createErrorResponse(
      'ANALYSIS_FAILED',
      'Failed to analyze resume',
      {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        processingTime,
      }
    ), { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    console.log(`[ResumeAnalyze] Capabilities request: ${requestId}`);

    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(createErrorResponse(
        'UNAUTHORIZED',
        'Authentication required',
        { requestId }
      ), { status: 401 });
    }

    // Return analysis capabilities
    const capabilities = {
      supportedAnalyses: {
        aiAnalysis: resumeBuilderConfig.features.aiAnalysis,
        atsScoring: true,
        keywordAnalysis: true,
        benchmarking: true,
      },
      analysisDepths: {
        quick: {
          description: 'Basic analysis with ATS scoring and keyword analysis',
          estimatedTime: '5-10 seconds',
          features: ['ats_score', 'keyword_density', 'basic_suggestions']
        },
        standard: {
          description: 'Comprehensive analysis with AI insights',
          estimatedTime: '15-30 seconds',
          features: ['ai_analysis', 'ats_score', 'keyword_analysis', 'market_fit', 'recommendations']
        },
        comprehensive: {
          description: 'Deep analysis with market benchmarking',
          estimatedTime: '30-60 seconds',
          features: ['full_ai_analysis', 'detailed_ats', 'advanced_keywords', 'benchmarking', 'strategic_insights']
        }
      },
      supportedIndustries: Object.keys(keywordAnalyzer['industryKeywordBanks']),
      limits: {
        maxJobDescriptionLength: 10000,
        maxResumeTextLength: 50000,
        analysesPerHour: 20,
        cacheDuration: '30 minutes',
      },
      features: {
        caching: true,
        realTimeAnalysis: true,
        industrySpecific: true,
        jobMatching: true,
        improvementSuggestions: true,
        marketInsights: true,
        atsOptimization: true,
        keywordOptimization: true,
      },
      pricing: {
        freeAnalyses: 5,
        standardAnalyses: 20,
        comprehensiveAnalyses: 10,
      }
    };

    return NextResponse.json(createSuccessResponse(capabilities, requestId), {
      headers: {
        'X-Request-ID': requestId,
      },
    });

  } catch (error) {
    console.error(`[ResumeAnalyze] Capabilities request failed: ${requestId}`, error);

    return NextResponse.json(createErrorResponse(
      'CAPABILITIES_FAILED',
      'Failed to retrieve analysis capabilities',
      {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        requestId,
      }
    ), { status: 500 });
  }
}

// Helper functions
async function performAIAnalysis(resume: any, options: any, userId: string, requestId: string) {
  return await aiAnalyzer.analyzeResume(resume, {
    ...options,
    userId,
    requestId,
  });
}

async function performATSScoring(resume: any, options: any, requestId: string) {
  return atsScorer.calculateATSScore(resume, options);
}

async function performKeywordAnalysis(resume: any, options: any, requestId: string) {
  const resumeText = extractResumeText(resume);
  return keywordAnalyzer.analyzeKeywords(resumeText, options);
}

async function performBenchmarkAnalysis(resume: any, industry: string, role: string, userId: string, requestId: string) {
  return await aiAnalyzer.benchmarkResume(resume, industry, role, {
    userId,
    requestId,
  });
}

function extractResumeText(resume: any): string {
  const parts: string[] = [];

  if (resume.personalInfo) {
    parts.push(Object.values(resume.personalInfo).filter(Boolean).join(' '));
  }

  if (resume.summary) {
    parts.push(resume.summary);
  }

  if (resume.experience) {
    resume.experience.forEach((exp: any) => {
      parts.push(exp.title || '');
      parts.push(exp.company || '');
      parts.push(exp.description || '');
      if (exp.achievements) {
        parts.push(exp.achievements.join(' '));
      }
    });
  }

  if (resume.education) {
    resume.education.forEach((edu: any) => {
      parts.push(edu.degree || '');
      parts.push(edu.field || '');
      parts.push(edu.institution || '');
    });
  }

  if (resume.skills) {
    parts.push(resume.skills.map((skill: any) => skill.name).join(' '));
  }

  return parts.join(' ');
}

function combineAnalysisResults(aiResult: any, atsResult: any, keywordResult: any, benchmarkResult: any) {
  return {
    aiAnalysis: aiResult,
    atsScore: atsResult,
    keywordAnalysis: keywordResult,
    benchmark: benchmarkResult,
  };
}

function generateOverallInsights(data: any) {
  const scores = [];

  if (data.atsScore?.totalScore) {
    scores.push(data.atsScore.totalScore);
  }

  if (data.keywordAnalysis?.score) {
    scores.push(data.keywordAnalysis.score);
  }

  if (data.aiAnalysis?.marketFit) {
    const fitScores = Object.values(data.aiAnalysis.marketFit);
    scores.push(...fitScores as number[]);
  }

  const overallScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];

  // Extract insights from each analysis
  if (data.atsScore?.details?.content?.strengths) {
    strengths.push(...data.atsScore.details.content.strengths);
  }

  if (data.atsScore?.details?.content?.issues) {
    weaknesses.push(...data.atsScore.details.content.issues);
  }

  if (data.atsScore?.recommendations) {
    recommendations.push(...data.atsScore.recommendations.slice(0, 5));
  }

  if (data.keywordAnalysis?.optimization?.suggestions) {
    recommendations.push(...data.keywordAnalysis.optimization.suggestions
      .slice(0, 3)
      .map((s: any) => s.suggestion));
  }

  if (data.aiAnalysis?.recommendations?.immediate) {
    recommendations.push(...data.aiAnalysis.recommendations.immediate
      .slice(0, 2)
      .map((r: any) => r.suggestion));
  }

  return {
    overallScore,
    strengths: [...new Set(strengths)].slice(0, 5),
    weaknesses: [...new Set(weaknesses)].slice(0, 5),
    recommendations: [...new Set(recommendations)].slice(0, 8),
    marketFit: data.aiAnalysis?.marketFit || {
      industryAlignment: 0,
      roleMatch: 0,
      experienceMatch: 0,
      skillMatch: 0,
    },
  };
}

function generateCacheKey(userId: string, resume: any, options: any): string {
  const resumeHash = hashObject(resume);
  const optionsHash = hashObject(options);
  return `analysis_${userId}_${resumeHash}_${optionsHash}`;
}

function hashObject(obj: any): string {
  const str = JSON.stringify(obj, Object.keys(obj).sort());
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

function cleanupCache() {
  const now = Date.now();
  for (const [key, value] of analysisCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      analysisCache.delete(key);
    }
  }
}

function createSuccessResponse(data: any, requestId: string): AnalysisResponse {
  return {
    success: true,
    data,
    requestId,
    timestamp: new Date().toISOString(),
  };
}

function createErrorResponse(code: string, message: string, details?: any): AnalysisResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
    requestId: '',
    timestamp: new Date().toISOString(),
  };
}