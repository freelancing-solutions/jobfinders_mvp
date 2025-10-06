import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { suggestionEngine, SuggestionRequest } from '@/services/resume-builder/suggestion-engine';
import { rateLimit } from '@/lib/rate-limiter';
import { z } from 'zod';

// Request schema for validation
const SuggestionsRequestSchema = z.object({
  resumeData: z.any(),
  targetJobTitle: z.string().optional(),
  targetIndustry: z.string().optional(),
  section: z.enum(['personal', 'experience', 'education', 'skills', 'summary', 'all']).default('all'),
  focus: z.enum(['ats', 'content', 'formatting', 'keywords']).default('content'),
});

const ContextualSuggestionsRequestSchema = z.object({
  resumeData: z.any().optional(),
  field: z.string(),
  value: z.string(),
  context: z.object({
    targetJobTitle: z.string().optional(),
    industry: z.string().optional(),
    experience: z.string().optional(),
  }).optional(),
});

const GrammarCheckRequestSchema = z.object({
  text: z.string(),
});

const KeywordAnalysisRequestSchema = z.object({
  resumeText: z.string(),
  jobDescription: z.string().optional(),
  industry: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Rate limiting
    const ip = request.ip || 'unknown';
    const rateLimitResult = await rateLimit(`suggestions:${ip}`, 20, 60000); // 20 requests per minute

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { type } = body;

    switch (type) {
      case 'general':
        return handleGeneralSuggestions(body);
      case 'contextual':
        return handleContextualSuggestions(body);
      case 'grammar':
        return handleGrammarCheck(body);
      case 'keywords':
        return handleKeywordAnalysis(body);
      default:
        return NextResponse.json(
          { error: 'Invalid suggestion type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in suggestions API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleGeneralSuggestions(body: any) {
  try {
    const { resumeData, targetJobTitle, targetIndustry, section, focus } =
      SuggestionsRequestSchema.parse(body);

    const request: SuggestionRequest = {
      resumeData,
      targetJobTitle,
      targetIndustry,
      section,
      focus,
    };

    const suggestions = await suggestionEngine.generateSuggestions(request);

    return NextResponse.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    console.error('Error generating general suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}

async function handleContextualSuggestions(body: any) {
  try {
    const { resumeData, field, value, context } =
      ContextualSuggestionsRequestSchema.parse(body);

    // Use empty resume data if not provided (for real-time field editing)
    const resumeDataToUse = resumeData || {};

    const suggestions = await suggestionEngine.generateContextualSuggestions(
      resumeDataToUse,
      field,
      value,
      context || {}
    );

    return NextResponse.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    console.error('Error generating contextual suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate contextual suggestions' },
      { status: 500 }
    );
  }
}

async function handleGrammarCheck(body: any) {
  try {
    const { text } = GrammarCheckRequestSchema.parse(body);

    const result = await suggestionEngine.checkGrammar(text);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error checking grammar:', error);
    return NextResponse.json(
      { error: 'Failed to check grammar' },
      { status: 500 }
    );
  }
}

async function handleKeywordAnalysis(body: any) {
  try {
    const { resumeText, jobDescription, industry } =
      KeywordAnalysisRequestSchema.parse(body);

    const result = await suggestionEngine.analyzeKeywords(
      resumeText,
      jobDescription,
      industry
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error analyzing keywords:', error);
    return NextResponse.json(
      { error: 'Failed to analyze keywords' },
      { status: 500 }
    );
  }
}