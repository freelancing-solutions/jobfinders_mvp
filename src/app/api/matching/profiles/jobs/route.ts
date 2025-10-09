import { NextRequest, NextResponse } from 'next/server';
import { withMatchingAuth } from '@/middleware/matching-auth';
import { JobService } from '@/services/matching/job-service';
import {
  CreateJobProfileSchema,
  JobProfileQuerySchema,
  type CreateJobProfileInput,
  type JobProfileQueryInput
} from '@/lib/validation/matching-schemas';
import { ZodError } from 'zod';
import { UserRole } from '@/types/roles';

const jobService = new JobService();

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams: Record<string, any> = {};

    // Extract all query parameters
    for (const [key, value] of searchParams.entries()) {
      if (value) {
        queryParams[key] = value;
      }
    }

    // Validate query parameters
    const validatedQuery = JobProfileQuerySchema.parse(queryParams);

    // Authentication - employers can view their own jobs, seekers can search
    const authResult = await withMatchingAuth(request, {
      rateLimitType: 'search'
    });

    if ('error' in authResult) {
      return authResult as NextResponse;
    }

    const { user } = authResult;

    // If employerId is specified, ensure user can access those jobs
    if (validatedQuery.employerId && validatedQuery.employerId !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied. You can only access your own job profiles.', code: 'ACCESS_DENIED' },
        { status: 403 }
      );
    }

    // If employerId is not specified and user is employer, default to current user
    if (!validatedQuery.employerId && user.role === 'employer') {
      validatedQuery.employerId = user.id;
    }

    // Get jobs
    const result = await jobService.searchJobProfiles({
      query: searchParams.get('query') || undefined,
      filters: validatedQuery,
      sortBy: (searchParams.get('sortBy') as any) || 'relevance',
      sortOrder: (searchParams.get('sortOrder') as any) || 'desc',
      includeInactive: searchParams.get('includeInactive') === 'true'
    });

    return NextResponse.json({
      success: true,
      data: result.profiles,
      meta: {
        total: result.total,
        hasMore: result.hasMore,
        limit: validatedQuery.limit,
        offset: validatedQuery.offset
      }
    });

  } catch (error) {
    console.error('Error in GET /api/matching/profiles/jobs:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch job profiles',
        code: 'FETCH_ERROR'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication - only employers can create job profiles
    const authResult = await withMatchingAuth(request, {
      requireRole: UserRole.EMPLOYER,
      rateLimitType: 'profile'
    });

    if ('error' in authResult) {
      return authResult as NextResponse;
    }

    const { user } = authResult;

    // Parse and validate request body
    const body = await request.json();
    const validatedData: CreateJobProfileInput = CreateJobProfileSchema.parse({
      ...body,
      employerId: user.id // Override employerId with authenticated user
    });

    // Create job profile
    const profile = await jobService.createJobProfile(validatedData);

    return NextResponse.json({
      success: true,
      data: profile,
      message: 'Job profile created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/matching/profiles/jobs:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    // Handle specific service errors
    if (error instanceof Error) {
      if (error.message.includes('Employer not found')) {
        return NextResponse.json(
          { error: error.message, code: 'EMPLOYER_NOT_FOUND' },
          { status: 404 }
        );
      }
      if (error.message.includes('must have employer role')) {
        return NextResponse.json(
          { error: error.message, code: 'ROLE_MISMATCH' },
          { status: 403 }
        );
      }
      if (error.message.includes('Job not found')) {
        return NextResponse.json(
          { error: error.message, code: 'JOB_NOT_FOUND' },
          { status: 404 }
        );
      }
      if (error.message.includes('already exists')) {
        return NextResponse.json(
          { error: error.message, code: 'PROFILE_EXISTS' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to create job profile',
        code: 'CREATE_ERROR'
      },
      { status: 500 }
    );
  }
}