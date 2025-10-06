/**
 * Resume Builder Parse API Route
 *
 * API endpoint for parsing resume text and extracting structured data
 * with AI enhancement, validation, and error handling.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { resumeParser } from '@/services/resume-builder/parser';
import { dataValidator } from '@/lib/data-validator';
import { textExtractor } from '@/lib/text-extractor';
import { ResumeBuilderErrorFactory } from '@/services/resume-builder/errors';
import { resumeBuilderConfig } from '@/services/resume-builder/config';

export async function POST(request: NextRequest) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();

  try {
    console.log(`[ResumeParse] Starting parse request: ${requestId}`);

    // Check if resume builder is enabled
    if (!resumeBuilderConfig.features.resumeBuilder) {
      return NextResponse.json(
        createErrorResponse(
          'FEATURE_DISABLED',
          'Resume builder feature is currently disabled',
          { requestId }
        ),
        { status: 503 }
      );
    }

    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        createErrorResponse(
          'UNAUTHORIZED',
          'Authentication required',
          { requestId }
        ),
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { text, options = {}, uploadId } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        createErrorResponse(
          'VALIDATION_ERROR',
          'Resume text is required',
          { requestId }
        ),
        { status: 400 }
      );
    }

    // Validate text length
    if (text.length < 50) {
      return NextResponse.json(
        createErrorResponse(
          'VALIDATION_ERROR',
          'Resume text is too short to parse effectively',
          { requestId, minLength: 50, providedLength: text.length }
        ),
        { status: 400 }
      );
    }

    if (text.length > 100000) { // 100KB limit
      return NextResponse.json(
        createErrorResponse(
          'VALIDATION_ERROR',
          'Resume text is too long',
          { requestId, maxLength: 100000, providedLength: text.length }
        ),
        { status: 400 }
      );
    }

    // Set default parsing options
    const parsingOptions = {
      userId: session.user.id,
      requestId,
      useAI: options.useAI !== false, // Default to true
      targetIndustry: options.targetIndustry,
      targetRole: options.targetRole,
      includeProjects: options.includeProjects !== false,
      includeCertifications: options.includeCertifications !== false,
      strictValidation: options.strictValidation === true,
    };

    // Perform parsing
    const parseResult = await resumeParser.parseResume(text, parsingOptions);

    // Validate parsed data
    const validationResult = await dataValidator.validateResume(parseResult.resume, {
      strict: parsingOptions.strictValidation,
      sanitize: true,
    });

    // Combine parsing and validation results
    const combinedResult = {
      ...parseResult,
      validation: validationResult,
      uploadId,
    };

    const duration = Date.now() - startTime;
    console.log(`[ResumeParse] Parsing completed successfully: ${requestId} (${duration}ms)`);

    return NextResponse.json(createSuccessResponse(combinedResult, requestId), {
      status: 200,
      headers: {
        'X-Request-ID': requestId,
        'X-Process-Time': duration.toString(),
        'X-Confidence': parseResult.confidence.toString(),
      },
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[ResumeParse] Parsing failed: ${requestId} (${duration}ms)`, error);

    // Handle known service errors
    if (error && typeof error === 'object' && 'code' in error) {
      const serviceError = error as any;

      switch (serviceError.code) {
        case 'PARSING_FAILED':
          return NextResponse.json(
            createErrorResponse(
              serviceError.code,
              serviceError.message,
              { ...serviceError.details, requestId }
            ),
            { status: 400 }
          );

        case 'AI_SERVICE_ERROR':
          return NextResponse.json(
            createErrorResponse(
              serviceError.code,
              'AI analysis service unavailable',
              { ...serviceError.details, requestId }
            ),
            { status: 503 }
          );

        case 'RATE_LIMIT_EXCEEDED':
          return NextResponse.json(
            createErrorResponse(
              serviceError.code,
              serviceError.message,
              { ...serviceError.details, requestId }
            ),
            { status: 429 }
          );
      }
    }

    // Handle unknown errors
    return NextResponse.json(
      createErrorResponse(
        'PARSE_FAILED',
        'Failed to parse resume',
        {
          originalError: error instanceof Error ? error.message : 'Unknown error',
          requestId,
          duration,
        }
      ),
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    console.log(`[ResumeParse] Parse capabilities request: ${requestId}`);

    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        createErrorResponse(
          'UNAUTHORIZED',
          'Authentication required',
          { requestId }
        ),
        { status: 401 }
      );
    }

    // Return parser capabilities and configuration
    const capabilities = {
      supportedFormats: ['pdf', 'doc', 'docx', 'txt'],
      supportedSections: [
        'personalInfo',
        'summary',
        'experience',
        'education',
        'skills',
        'projects',
        'certifications',
        'languages',
      ],
      parsingOptions: {
        useAI: resumeBuilderConfig.features.aiAnalysis,
        targetIndustry: true,
        targetRole: true,
        includeProjects: true,
        includeCertifications: true,
        strictValidation: false,
      },
      validation: {
        strictMode: true,
        sanitization: true,
        businessRules: true,
      },
      limits: {
        maxTextLength: 100000,
        maxExperienceEntries: 20,
        maxSkillCount: 100,
        maxProjects: 20,
        maxCertifications: 20,
      },
      features: {
        aiEnhancement: resumeBuilderConfig.features.aiAnalysis,
        dataValidation: true,
        errorRecovery: true,
        confidenceScoring: true,
        qualityAssessment: true,
      },
    };

    return NextResponse.json(createSuccessResponse(capabilities, requestId), {
      headers: {
        'X-Request-ID': requestId,
      },
    });

  } catch (error) {
    console.error(`[ResumeParse] Capabilities request failed: ${requestId}`, error);

    return NextResponse.json(
      createErrorResponse(
        'CAPABILITIES_FAILED',
        'Failed to retrieve parser capabilities',
        {
          originalError: error instanceof Error ? error.message : 'Unknown error',
          requestId,
        }
      ),
      { status: 500 }
    );
  }
}

// Utility functions for creating standardized responses
function createSuccessResponse(data: any, requestId: string) {
  return {
    success: true,
    data,
    requestId,
    timestamp: new Date().toISOString(),
  };
}

function createErrorResponse(code: string, message: string, details?: any) {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
    timestamp: new Date().toISOString(),
  };
}