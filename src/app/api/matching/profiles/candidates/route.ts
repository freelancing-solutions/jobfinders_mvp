import { NextRequest, NextResponse } from 'next/server';
import { withMatchingAuth } from '@/middleware/matching-auth';
import { CandidateService } from '@/services/matching/candidate-service';
import {
  CreateCandidateProfileSchema,
  CandidateProfileQuerySchema,
  type CreateCandidateProfileInput,
  type CandidateProfileQueryInput
} from '@/lib/validation/matching-schemas';
import { ZodError } from 'zod';

const candidateService = new CandidateService();

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
    const validatedQuery = CandidateProfileQuerySchema.parse(queryParams);

    // Authentication - seekers can view their own profiles, employers can search
    const authResult = await withMatchingAuth(request, {
      rateLimitType: 'search'
    });

    if ('error' in authResult) {
      return authResult as NextResponse;
    }

    const { user } = authResult;

    // If userId is specified, ensure user can access that profile
    if (validatedQuery.userId && validatedQuery.userId !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied. You can only access your own profile.', code: 'ACCESS_DENIED' },
        { status: 403 }
      );
    }

    // If userId is not specified, default to current user (for seekers)
    if (!validatedQuery.userId && user.role === 'seeker') {
      validatedQuery.userId = user.id;
    }

    // Get candidates
    const result = await candidateService.searchCandidateProfiles({
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
    console.error('Error in GET /api/matching/profiles/candidates:', error);

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
        error: 'Failed to fetch candidate profiles',
        code: 'FETCH_ERROR'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication - only seekers can create candidate profiles
    const authResult = await withMatchingAuth(request, {
      requireRole: 'seeker',
      rateLimitType: 'profile'
    });

    if ('error' in authResult) {
      return authResult as NextResponse;
    }

    const { user } = authResult;

    // Parse and validate request body
    const body = await request.json();
    const validatedData: CreateCandidateProfileInput = CreateCandidateProfileSchema.parse({
      ...body,
      userId: user.id // Override userId with authenticated user
    });

    // Create candidate profile
    const profile = await candidateService.createCandidateProfile(validatedData);

    return NextResponse.json({
      success: true,
      data: profile,
      message: 'Candidate profile created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/matching/profiles/candidates:', error);

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
      if (error.message.includes('User not found')) {
        return NextResponse.json(
          { error: error.message, code: 'USER_NOT_FOUND' },
          { status: 404 }
        );
      }
      if (error.message.includes('must have seeker role')) {
        return NextResponse.json(
          { error: error.message, code: 'ROLE_MISMATCH' },
          { status: 403 }
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
        error: 'Failed to create candidate profile',
        code: 'CREATE_ERROR'
      },
      { status: 500 }
    );
  }
}