#!/usr/bin/env node

/**
 * Task 1.2: API Route Infrastructure
 *
 * This script creates the API route structure for the integrated systems.
 */

const fs = require('fs');
const path = require('path');

class APIRouteInfrastructure {
  constructor() {
    this.basePath = path.join(process.cwd(), 'src/app/api');
  }

  async execute() {
    console.log('🛣️  Task 1.2: API Route Infrastructure');
    console.log('==========================================');

    try {
      // Step 1: Create API route structure for matching system
      await this.createMatchingAPIRoutes();

      // Step 2: Create API routes for resume builder
      await this.createResumeBuilderAPIRoutes();

      // Step 3: Create API routes for notifications
      await this.createNotificationAPIRoutes();

      // Step 4: Create API routes for events
      await this.createEventAPIRoutes();

      // Step 5: Implement error handling middleware
      await this.createErrorHandlingMiddleware();

      // Step 6: Add request validation schemas
      await this.createValidationSchemas();

      // Step 7: Implement rate limiting
      await this.createRateLimiting();

      console.log('✅ Task 1.2 completed successfully');

    } catch (error) {
      console.error('❌ Task 1.2 failed:', error.message);
      throw error;
    }
  }

  async createMatchingAPIRoutes() {
    console.log('🎯 Creating matching API routes...');

    const matchingPath = path.join(this.basePath, 'matching');
    this.ensureDirectoryExists(matchingPath);

    // Create find-matches route
    await this.createFile(path.join(matchingPath, 'find-matches', 'route.ts'), this.getFindMatchesRoute());

    // Create recommendations routes
    const recommendationsPath = path.join(matchingPath, 'recommendations');
    this.ensureDirectoryExists(recommendationsPath);

    await this.createFile(path.join(recommendationsPath, 'jobs', '[candidateId]', 'route.ts'), this.getJobRecommendationsRoute());
    await this.createFile(path.join(recommendationsPath, 'candidates', '[jobId]', 'route.ts'), this.getCandidateRecommendationsRoute());

    // Create analytics route
    await this.createFile(path.join(matchingPath, 'analytics', 'route.ts'), this.getAnalyticsRoute());

    console.log('✅ Matching API routes created');
  }

  async createResumeBuilderAPIRoutes() {
    console.log('📄 Creating resume builder API routes...');

    const resumePath = path.join(this.basePath, 'resume-builder');
    this.ensureDirectoryExists(resumePath);

    // Create upload route
    await this.createFile(path.join(resumePath, 'upload', 'route.ts'), this.getUploadRoute());

    // Create analyze route
    await this.createFile(path.join(resumePath, 'analyze', 'route.ts'), this.getAnalyzeRoute());

    // Create generate route
    await this.createFile(path.join(resumePath, 'generate', 'route.ts'), this.getGenerateRoute());

    // Create templates route
    await this.createFile(path.join(resumePath, 'templates', 'route.ts'), this.getTemplatesRoute());

    console.log('✅ Resume builder API routes created');
  }

  async createNotificationAPIRoutes() {
    console.log('📢 Creating notification API routes...');

    const notificationPath = path.join(this.basePath, 'notifications');
    this.ensureDirectoryExists(notificationPath);

    // Create preferences route
    await this.createFile(path.join(notificationPath, 'preferences', 'route.ts'), this.getPreferencesRoute());

    // Create history route
    await this.createFile(path.join(notificationPath, 'history', 'route.ts'), this.getHistoryRoute());

    // Create mark-read route
    await this.createFile(path.join(notificationPath, 'mark-read', 'route.ts'), this.getMarkReadRoute());

    console.log('✅ Notification API routes created');
  }

  async createEventAPIRoutes() {
    console.log('📡 Creating event API routes...');

    const eventPath = path.join(this.basePath, 'events');
    this.ensureDirectoryExists(eventPath);

    // Create publish route
    await this.createFile(path.join(eventPath, 'publish', 'route.ts'), this.getPublishRoute());

    // Create subscribe route
    await this.createFile(path.join(eventPath, 'subscribe', 'route.ts'), this.getSubscribeRoute());

    console.log('✅ Event API routes created');
  }

  async createErrorHandlingMiddleware() {
    console.log('⚠️  Creating error handling middleware...');

    const middlewarePath = path.join(process.cwd(), 'src/lib/api/middleware');
    this.ensureDirectoryExists(middlewarePath);

    await this.createFile(path.join(middlewarePath, 'error-handler.ts'), this.getErrorHandlerMiddleware());

    console.log('✅ Error handling middleware created');
  }

  async createValidationSchemas() {
    console.log('✅ Creating validation schemas...');

    const validationPath = path.join(process.cwd(), 'src/lib/api/validation');
    this.ensureDirectoryExists(validationPath);

    await this.createFile(path.join(validationPath, 'schemas.ts'), this.getValidationSchemas());

    console.log('✅ Validation schemas created');
  }

  async createRateLimiting() {
    console.log('🚦 Creating rate limiting...');

    const rateLimitPath = path.join(process.cwd(), 'src/lib/api/rate-limit');
    this.ensureDirectoryExists(rateLimitPath);

    await this.createFile(path.join(rateLimitPath, 'index.ts'), this.getRateLimiting());

    console.log('✅ Rate limiting created');
  }

  // Helper methods
  ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  async createFile(filePath, content) {
    this.ensureDirectoryExists(path.dirname(filePath));
    fs.writeFileSync(filePath, content);
  }

  // Route templates
  getFindMatchesRoute() {
    return `import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { MatchingCoreService } from '@/services/matching/core-service';
import { withRateLimit } from '@/lib/api/rate-limit';
import { validateRequest } from '@/lib/api/validation';
import { errorHandler } from '@/lib/api/middleware/error-handler';

const findMatchesSchema = z.object({
  type: z.enum(['candidates-for-job', 'jobs-for-candidate']),
  id: z.string(),
  filters: z.object({
    minScore: z.number().min(0).max(100).optional(),
    location: z.string().optional(),
    experienceLevel: z.string().optional(),
    salaryRange: z.object({
      min: z.number().optional(),
      max: z.number().optional()
    }).optional()
  }).optional(),
  sort: z.object({
    field: z.enum(['matchScore', 'matchConfidence', 'lastMatched']),
    order: z.enum(['asc', 'desc'])
  }).optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0)
});

export const POST = withRateLimit(async (request: NextRequest) => {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = validateRequest(findMatchesSchema, body);

    const matchingService = new MatchingCoreService();
    let result;

    if (validatedData.type === 'candidates-for-job') {
      result = await matchingService.findCandidatesForJob(
        validatedData.id,
        validatedData.filters,
        validatedData.sort,
        validatedData.limit,
        validatedData.offset
      );
    } else {
      result = await matchingService.findJobsForCandidate(
        validatedData.id,
        validatedData.filters,
        validatedData.sort,
        validatedData.limit,
        validatedData.offset
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return errorHandler(error);
  }
}, { requests: 100, window: '1m' });`;
  }

  getJobRecommendationsRoute() {
    return `import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { RecommendationEngine } from '@/services/matching/recommendation-engine';
import { withRateLimit } from '@/lib/api/rate-limit';
import { errorHandler } from '@/lib/api/middleware/error-handler';

export const GET = withRateLimit(async (
  request: NextRequest,
  { params }: { params: { candidateId: string } }
) => {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { candidateId } = params;
    const { searchParams } = new URL(request.url);

    const limit = parseInt(searchParams.get('limit') || '10');
    const filters = searchParams.get('filters')
      ? JSON.parse(searchParams.get('filters')!)
      : {};

    const recommendationEngine = new RecommendationEngine();
    const recommendations = await recommendationEngine.getJobRecommendations(
      candidateId,
      limit,
      filters
    );

    return NextResponse.json({
      success: true,
      data: recommendations,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return errorHandler(error);
  }
}, { requests: 50, window: '1m' });`;
  }

  getCandidateRecommendationsRoute() {
    return `import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { RecommendationEngine } from '@/services/matching/recommendation-engine';
import { withRateLimit } from '@/lib/api/rate-limit';
import { errorHandler } from '@/lib/api/middleware/error-handler';

export const GET = withRateLimit(async (
  request: NextRequest,
  { params }: { params: { jobId: string } }
) => {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = params;
    const { searchParams } = new URL(request.url);

    const limit = parseInt(searchParams.get('limit') || '10');
    const filters = searchParams.get('filters')
      ? JSON.parse(searchParams.get('filters')!)
      : {};

    const recommendationEngine = new RecommendationEngine();
    const recommendations = await recommendationEngine.getCandidateRecommendations(
      jobId,
      limit,
      filters
    );

    return NextResponse.json({
      success: true,
      data: recommendations,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return errorHandler(error);
  }
}, { requests: 50, window: '1m' });`;
  }

  getAnalyticsRoute() {
    return `import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { MatchingCoreService } from '@/services/matching/core-service';
import { withRateLimit } from '@/lib/api/rate-limit';
import { errorHandler } from '@/lib/api/middleware/error-handler';

export const GET = withRateLimit(async (request: NextRequest) => {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filters = searchParams.get('filters')
      ? JSON.parse(searchParams.get('filters')!)
      : {};

    const matchingService = new MatchingCoreService();
    const analytics = await matchingService.getMatchStats(filters);

    return NextResponse.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return errorHandler(error);
  }
}, { requests: 20, window: '1m' });`;
  }

  getUploadRoute() {
    return `import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ResumeBuilder } from '@/services/resume-builder';
import { withRateLimit } from '@/lib/api/rate-limit';
import { errorHandler } from '@/lib/api/middleware/error-handler';

export const POST = withRateLimit(async (request: NextRequest) => {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const resumeBuilder = new ResumeBuilder();
    const result = await resumeBuilder.uploadResume(session.user.id, file);

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return errorHandler(error);
  }
}, { requests: 10, window: '1m' });`;
  }

  getAnalyzeRoute() {
    return `import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ResumeBuilder } from '@/services/resume-builder';
import { withRateLimit } from '@/lib/api/rate-limit';
import { errorHandler } from '@/lib/api/middleware/error-handler';

export const POST = withRateLimit(async (request: NextRequest) => {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { resumeId } = await request.json();

    if (!resumeId) {
      return NextResponse.json({ error: 'Resume ID required' }, { status: 400 });
    }

    const resumeBuilder = new ResumeBuilder();
    const analysis = await resumeBuilder.analyzeResume(resumeId, session.user.id);

    return NextResponse.json({
      success: true,
      data: analysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return errorHandler(error);
  }
}, { requests: 20, window: '1m' });`;
  }

  getGenerateRoute() {
    return `import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ResumeBuilder } from '@/services/resume-builder';
import { withRateLimit } from '@/lib/api/rate-limit';
import { errorHandler } from '@/lib/api/middleware/error-handler';

export const POST = withRateLimit(async (request: NextRequest) => {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { templateId, content, options } = await request.json();

    const resumeBuilder = new ResumeBuilder();
    const result = await resumeBuilder.generateResume(
      session.user.id,
      templateId,
      content,
      options
    );

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return errorHandler(error);
  }
}, { requests: 10, window: '1m' });`;
  }

  getTemplatesRoute() {
    return `import { NextResponse } from 'next/server';
import { ResumeBuilder } from '@/services/resume-builder';
import { errorHandler } from '@/lib/api/middleware/error-handler';

export const GET = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const industry = searchParams.get('industry');
    const experience = searchParams.get('experience');

    const resumeBuilder = new ResumeBuilder();
    const templates = await resumeBuilder.getTemplates({ industry, experience });

    return NextResponse.json({
      success: true,
      data: templates,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return errorHandler(error);
  }
};`;
  }

  getPreferencesRoute() {
    return `import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { NotificationService } from '@/services/notifications/integration-service';
import { withRateLimit } from '@/lib/api/rate-limit';
import { errorHandler } from '@/lib/api/middleware/error-handler';

export const GET = withRateLimit(async (request: NextRequest) => {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notificationService = new NotificationService();
    const preferences = await notificationService.getUserPreferences(session.user.id);

    return NextResponse.json({
      success: true,
      data: preferences,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return errorHandler(error);
  }
}, { requests: 20, window: '1m' });

export const PUT = withRateLimit(async (request: NextRequest) => {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const preferences = await request.json();

    const notificationService = new NotificationService();
    const updatedPreferences = await notificationService.updateUserPreferences(
      session.user.id,
      preferences
    );

    return NextResponse.json({
      success: true,
      data: updatedPreferences,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return errorHandler(error);
  }
}, { requests: 10, window: '1m' });`;
  }

  getHistoryRoute() {
    return `import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { NotificationService } from '@/services/notifications/integration-service';
import { withRateLimit } from '@/lib/api/rate-limit';
import { errorHandler } from '@/lib/api/middleware/error-handler';

export const GET = withRateLimit(async (request: NextRequest) => {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type');

    const notificationService = new NotificationService();
    const history = await notificationService.getNotificationHistory(
      session.user.id,
      { page, limit, type }
    );

    return NextResponse.json({
      success: true,
      data: history,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return errorHandler(error);
  }
}, { requests: 50, window: '1m' });`;
  }

  getMarkReadRoute() {
    return `import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { NotificationService } from '@/services/notifications/integration-service';
import { withRateLimit } from '@/lib/api/rate-limit';
import { errorHandler } from '@/lib/api/middleware/error-handler';

export const POST = withRateLimit(async (request: NextRequest) => {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notificationIds } = await request.json();

    if (!Array.isArray(notificationIds)) {
      return NextResponse.json({ error: 'Notification IDs array required' }, { status: 400 });
    }

    const notificationService = new NotificationService();
    await notificationService.markNotificationsAsRead(session.user.id, notificationIds);

    return NextResponse.json({
      success: true,
      message: 'Notifications marked as read',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return errorHandler(error);
  }
}, { requests: 100, window: '1m' });`;
  }

  getPublishRoute() {
    return `import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { EventBus } from '@/lib/events/event-bus';
import { withRateLimit } from '@/lib/api/rate-limit';
import { errorHandler } from '@/lib/api/middleware/error-handler';

export const POST = withRateLimit(async (request: NextRequest) => {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventData = await request.json();
    const { type, data, metadata } = eventData;

    if (!type || !data) {
      return NextResponse.json({ error: 'Event type and data are required' }, { status: 400 });
    }

    const eventBus = new EventBus();
    const eventId = await eventBus.publish({
      type,
      data,
      userId: session.user.id,
      metadata: {
        ...metadata,
        source: 'api',
        timestamp: new Date().toISOString()
      }
    });

    return NextResponse.json({
      success: true,
      data: { eventId },
      message: 'Event published successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return errorHandler(error);
  }
}, { requests: 100, window: '1m' });`;
  }

  getSubscribeRoute() {
    return `import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { EventBus } from '@/lib/events/event-bus';
import { withRateLimit } from '@/lib/api/rate-limit';
import { errorHandler } from '@/lib/api/middleware/error-handler';

export const POST = withRateLimit(async (request: NextRequest) => {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventType, endpoint } = await request.json();

    if (!eventType) {
      return NextResponse.json({ error: 'Event type is required' }, { status: 400 });
    }

    const eventBus = new EventBus();
    const subscriptionId = await eventBus.subscribe(eventType, {
      eventType,
      handler: async (event) => {
        // Forward event to provided endpoint
        if (endpoint) {
          await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(event)
          });
        }
      },
      priority: 1
    });

    return NextResponse.json({
      success: true,
      data: { subscriptionId },
      message: 'Subscription created successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return errorHandler(error);
  }
}, { requests: 20, window: '1m' });`;
  }

  getErrorHandlerMiddleware() {
    return `import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { logger } from '@/lib/logging/logger';

export type ApiError = {
  code: string;
  message: string;
  details?: any;
  statusCode: number;
};

export function errorHandler(error: any): NextResponse {
  logger.error('API Error:', {
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });

  // Handle validation errors
  if (error instanceof ZodError) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }
    }, { status: 400 });
  }

  // Handle known API errors
  if (error.code) {
    return NextResponse.json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    }, { status: error.statusCode || 500 });
  }

  // Handle unknown errors
  return NextResponse.json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }
  }, { status: 500 });
}

export function createApiError(
  code: string,
  message: string,
  statusCode: number = 500,
  details?: any
): ApiError {
  return { code, message, statusCode, details };
}

export const COMMON_ERRORS = {
  UNAUTHORIZED: createApiError('UNAUTHORIZED', 'Authentication required', 401),
  FORBIDDEN: createApiError('FORBIDDEN', 'Access denied', 403),
  NOT_FOUND: createApiError('NOT_FOUND', 'Resource not found', 404),
  VALIDATION_ERROR: createApiError('VALIDATION_ERROR', 'Invalid input data', 400),
  RATE_LIMIT_EXCEEDED: createApiError('RATE_LIMIT_EXCEEDED', 'Too many requests', 429),
  INTERNAL_ERROR: createApiError('INTERNAL_ERROR', 'Internal server error', 500)
};`;
  }

  getValidationSchemas() {
    return `import { z } from 'zod';

// Common schemas
export const PaginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0)
});

export const IdSchema = z.string().min(1, 'ID is required');

// Matching schemas
export const MatchFiltersSchema = z.object({
  minScore: z.number().min(0).max(100).optional(),
  maxScore: z.number().min(0).max(100).optional(),
  location: z.string().optional(),
  experienceLevel: z.enum(['entry', 'junior', 'mid', 'senior', 'lead', 'principal']).optional(),
  salaryRange: z.object({
    min: z.number().min(0).optional(),
    max: z.number().min(0).optional()
  }).optional(),
  skills: z.array(z.string()).optional(),
  remote: z.boolean().optional()
});

export const SortSchema = z.object({
  field: z.enum(['matchScore', 'matchConfidence', 'lastMatched', 'createdAt']),
  order: z.enum(['asc', 'desc']).default('desc')
});

export const FindMatchesSchema = z.object({
  type: z.enum(['candidates-for-job', 'jobs-for-candidate']),
  id: IdSchema,
  filters: MatchFiltersSchema.optional(),
  sort: SortSchema.optional()
}).merge(PaginationSchema);

// Resume builder schemas
export const FileUploadSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => file.size <= 10 * 1024 * 1024, // 10MB
    'File size must be less than 10MB'
  ).refine(
    (file) => ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type),
    'Only PDF, DOC, and DOCX files are allowed'
  )
});

export const ResumeAnalysisSchema = z.object({
  resumeId: IdSchema,
  options: z.object({
    includeATS: z.boolean().default(true),
    includeSuggestions: z.boolean().default(true),
    targetJobId: IdSchema.optional()
  }).optional()
});

export const ResumeGenerationSchema = z.object({
  templateId: IdSchema,
  content: z.object({
    personalInfo: z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email(),
      phone: z.string().optional(),
      location: z.string().optional()
    }),
    summary: z.string().optional(),
    experience: z.array(z.object({
      title: z.string(),
      company: z.string(),
      startDate: z.string(),
      endDate: z.string().optional(),
      description: z.string()
    })).optional(),
    education: z.array(z.object({
      degree: z.string(),
      institution: z.string(),
      graduationDate: z.string()
    })).optional(),
    skills: z.array(z.string()).optional()
  }),
  options: z.object({
    format: z.enum(['pdf', 'docx']).default('pdf'),
    includeContact: z.boolean().default(true)
  }).optional()
});

// Notification schemas
export const NotificationPreferencesSchema = z.object({
  channels: z.object({
    email: z.boolean().default(true),
    push: z.boolean().default(true),
    sms: z.boolean().default(false),
    inApp: z.boolean().default(true)
  }),
  types: z.object({
    jobMatches: z.boolean().default(true),
    applicationStatus: z.boolean().default(true),
    resumeAnalysis: z.boolean().default(true),
    marketing: z.boolean().default(false)
  }),
  quietHours: z.object({
    enabled: z.boolean().default(false),
    start: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    end: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional()
  }),
  frequency: z.enum(['immediate', 'daily', 'weekly']).default('immediate')
});

export const MarkNotificationsReadSchema = z.object({
  notificationIds: z.array(IdSchema).min(1, 'At least one notification ID is required')
});

// Event schemas
export const EventSchema = z.object({
  type: z.string().min(1, 'Event type is required'),
  data: z.any(),
  metadata: z.record(z.any()).optional()
});

export const EventSubscriptionSchema = z.object({
  eventType: z.string().min(1, 'Event type is required'),
  endpoint: z.string().url().optional()
});

// Validation function
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw error;
    }
    throw new Error('Validation failed');
  }
}

// Export all schemas for use in API routes
export const API_SCHEMAS = {
  PaginationSchema,
  IdSchema,
  MatchFiltersSchema,
  SortSchema,
  FindMatchesSchema,
  FileUploadSchema,
  ResumeAnalysisSchema,
  ResumeGenerationSchema,
  NotificationPreferencesSchema,
  MarkNotificationsReadSchema,
  EventSchema,
  EventSubscriptionSchema
};`;
  }

  getRateLimiting() {
    return `import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { logger } from '@/lib/logging/logger';

interface RateLimitConfig {
  requests: number;
  window: string; // e.g., '1m', '1h', '1d'
  identifier?: string;
  skipSuccessfulRequests?: boolean;
}

class RateLimiter {
  private redis: Redis | null = null;
  private memoryCache: Map<string, { count: number; resetTime: number }> = new Map();

  constructor() {
    // Initialize Redis if available
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      this.redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
    }
  }

  private parseWindow(window: string): number {
    const unit = window.slice(-1);
    const value = parseInt(window.slice(0, -1));

    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return value * 1000;
    }
  }

  private getIdentifier(request: NextRequest, customIdentifier?: string): string {
    if (customIdentifier) return customIdentifier;

    // Try to get user ID from session
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      // In a real implementation, you'd decode the JWT to get user ID
      return authHeader;
    }

    // Fallback to IP
    return request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  }

  async checkRateLimit(
    identifier: string,
    config: RateLimitConfig
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = \`rate-limit:\${identifier}:\${config.requests}:\${config.window}\`;
    const windowMs = this.parseWindow(config.window);
    const now = Date.now();
    const resetTime = now + windowMs;

    if (this.redis) {
      // Use Redis for distributed rate limiting
      const current = await this.redis.incr(key);

      if (current === 1) {
        await this.redis.expire(key, Math.ceil(windowMs / 1000));
      }

      return {
        allowed: current <= config.requests,
        remaining: Math.max(0, config.requests - current),
        resetTime
      };
    } else {
      // Fallback to in-memory rate limiting
      const cached = this.memoryCache.get(key);

      if (!cached || cached.resetTime < now) {
        this.memoryCache.set(key, { count: 1, resetTime });
        return {
          allowed: true,
          remaining: config.requests - 1,
          resetTime
        };
      }

      const newCount = cached.count + 1;
      this.memoryCache.set(key, { count: newCount, resetTime: cached.resetTime });

      return {
        allowed: newCount <= config.requests,
        remaining: Math.max(0, config.requests - newCount),
        resetTime: cached.resetTime
      };
    }
  }
}

const rateLimiter = new RateLimiter();

export function withRateLimit(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
  config: RateLimitConfig
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    try {
      const identifier = rateLimiter.getIdentifier(request, config.identifier);
      const result = await rateLimiter.checkRateLimit(identifier, config);

      if (!result.allowed) {
        logger.warn('Rate limit exceeded', {
          identifier,
          config,
          timestamp: new Date().toISOString()
        });

        return NextResponse.json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
            details: {
              resetTime: new Date(result.resetTime).toISOString(),
              remaining: result.remaining
            }
          }
        }, {
          status: 429,
          headers: {
            'X-RateLimit-Limit': config.requests.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetTime.toString(),
            'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
          }
        });
      }

      // Add rate limit headers to successful responses
      const response = await handler(request, ...args);

      response.headers.set('X-RateLimit-Limit', config.requests.toString());
      response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
      response.headers.set('X-RateLimit-Reset', result.resetTime.toString());

      return response;

    } catch (error) {
      logger.error('Rate limiting error:', {
        error: error.message,
        timestamp: new Date().toISOString()
      });

      // Don't block requests if rate limiting fails
      return handler(request, ...args);
    }
  };
}

// Predefined rate limit configurations
export const RATE_LIMITS = {
  AUTH: { requests: 5, window: '1m' },
  UPLOAD: { requests: 10, window: '1m' },
  API: { requests: 100, window: '1m' },
  MATCHING: { requests: 50, window: '1m' },
  NOTIFICATIONS: { requests: 100, window: '1m' },
  EVENTS: { requests: 1000, window: '1m' }
};

export { rateLimiter };`;
  }
}

// Execute the task
async function main() {
  const apiInfrastructure = new APIRouteInfrastructure();
  await apiInfrastructure.execute();
}

if (require.main === module) {
  main().catch(error => {
    console.error('💥 Task execution failed:', error);
    process.exit(1);
  });
}

module.exports = APIRouteInfrastructure;