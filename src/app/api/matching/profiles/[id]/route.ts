import { NextRequest, NextResponse } from 'next/server';
import { withMatchingAuth, verifyResourceOwnership, canAccessResource } from '@/middleware/matching-auth';
import { CandidateService } from '@/services/matching/candidate-service';
import { JobService } from '@/services/matching/job-service';
import { IdParamSchema, type IdParamInput } from '@/lib/validation/matching-schemas';
import { ZodError } from 'zod';

const candidateService = new CandidateService();
const jobService = new JobService();

export async function GET(
  request: NextRequest,
  { params }: { params: IdParamInput }
) {
  try {
    // Validate ID parameter
    const { id } = IdParamSchema.parse(params);

    // Authentication
    const authResult = await withMatchingAuth(request, {
      rateLimitType: 'search'
    });

    if ('error' in authResult) {
      return authResult as NextResponse;
    }

    const { user } = authResult;

    // Determine if this is a candidate or job profile
    // Check if it's a candidate profile first
    try {
      const candidateProfile = await candidateService.getCandidateProfileById(id);

      // Check access permissions
      const accessCheck = await canAccessResource(
        user,
        'read',
        'candidate_profile',
        id
      );

      if (!accessCheck.allowed) {
        return NextResponse.json(
          { error: accessCheck.reason || 'Access denied', code: 'ACCESS_DENIED' },
          { status: 403 }
        );
      }

      return NextResponse.json({
        success: true,
        data: candidateProfile,
        type: 'candidate'
      });

    } catch (candidateError) {
      // If candidate profile not found, try job profile
      try {
        const jobProfile = await jobService.getJobProfileById(id);

        // Check access permissions
        const accessCheck = await canAccessResource(
          user,
          'read',
          'job_profile',
          id
        );

        if (!accessCheck.allowed) {
          return NextResponse.json(
            { error: accessCheck.reason || 'Access denied', code: 'ACCESS_DENIED' },
            { status: 403 }
          );
        }

        return NextResponse.json({
          success: true,
          data: jobProfile,
          type: 'job'
        });

      } catch (jobError) {
        // Neither candidate nor job profile found
        return NextResponse.json(
          { error: 'Profile not found', code: 'PROFILE_NOT_FOUND' },
          { status: 404 }
        );
      }
    }

  } catch (error) {
    console.error('Error in GET /api/matching/profiles/[id]:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid profile ID',
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
        error: 'Failed to fetch profile',
        code: 'FETCH_ERROR'
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: IdParamInput }
) {
  try {
    // Validate ID parameter
    const { id } = IdParamSchema.parse(params);

    // Authentication
    const authResult = await withMatchingAuth(request, {
      rateLimitType: 'profile'
    });

    if ('error' in authResult) {
      return authResult as NextResponse;
    }

    const { user } = authResult;

    // Parse request body
    const body = await request.json();

    // Determine if this is a candidate or job profile update
    // Check if it's a candidate profile first
    try {
      // Check ownership before proceeding
      const isOwner = await verifyResourceOwnership(user.id, 'candidate_profile', id);
      if (!isOwner && user.role !== 'admin') {
        return NextResponse.json(
          { error: 'You can only update your own profile', code: 'OWNERSHIP_REQUIRED' },
          { status: 403 }
        );
      }

      const updatedProfile = await candidateService.updateCandidateProfile({
        ...body,
        id
      });

      return NextResponse.json({
        success: true,
        data: updatedProfile,
        type: 'candidate',
        message: 'Candidate profile updated successfully'
      });

    } catch (candidateError) {
      // If candidate profile not found or update failed, try job profile
      try {
        // Check ownership before proceeding
        const isOwner = await verifyResourceOwnership(user.id, 'job_profile', id);
        if (!isOwner && user.role !== 'admin') {
          return NextResponse.json(
            { error: 'You can only update your own job profiles', code: 'OWNERSHIP_REQUIRED' },
            { status: 403 }
          );
        }

        const updatedProfile = await jobService.updateJobProfile({
          ...body,
          id,
          employerId: user.id // Ensure employerId is set correctly
        });

        return NextResponse.json({
          success: true,
          data: updatedProfile,
          type: 'job',
          message: 'Job profile updated successfully'
        });

      } catch (jobError) {
        // Neither candidate nor job profile could be updated
        return NextResponse.json(
          { error: 'Profile not found or update failed', code: 'UPDATE_FAILED' },
          { status: 404 }
        );
      }
    }

  } catch (error) {
    console.error('Error in PUT /api/matching/profiles/[id]:', error);

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
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message, code: 'PROFILE_NOT_FOUND' },
          { status: 404 }
        );
      }
      if (error.message.includes('not authorized')) {
        return NextResponse.json(
          { error: error.message, code: 'UNAUTHORIZED' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to update profile',
        code: 'UPDATE_ERROR'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: IdParamInput }
) {
  try {
    // Validate ID parameter
    const { id } = IdParamSchema.parse(params);

    // Authentication
    const authResult = await withMatchingAuth(request, {
      rateLimitType: 'profile'
    });

    if ('error' in authResult) {
      return authResult as NextResponse;
    }

    const { user } = authResult;

    // Determine if this is a candidate or job profile deletion
    // Check if it's a candidate profile first
    try {
      // Check ownership before proceeding
      const isOwner = await verifyResourceOwnership(user.id, 'candidate_profile', id);
      if (!isOwner && user.role !== 'admin') {
        return NextResponse.json(
          { error: 'You can only delete your own profile', code: 'OWNERSHIP_REQUIRED' },
          { status: 403 }
        );
      }

      await candidateService.deleteCandidateProfile(id, user.id);

      return NextResponse.json({
        success: true,
        type: 'candidate',
        message: 'Candidate profile deleted successfully'
      });

    } catch (candidateError) {
      // If candidate profile not found or deletion failed, try job profile
      try {
        // Check ownership before proceeding
        const isOwner = await verifyResourceOwnership(user.id, 'job_profile', id);
        if (!isOwner && user.role !== 'admin') {
          return NextResponse.json(
            { error: 'You can only delete your own job profiles', code: 'OWNERSHIP_REQUIRED' },
            { status: 403 }
          );
        }

        await jobService.deleteJobProfile(id, user.id);

        return NextResponse.json({
          success: true,
          type: 'job',
          message: 'Job profile deleted successfully'
        });

      } catch (jobError) {
        // Neither candidate nor job profile could be deleted
        return NextResponse.json(
          { error: 'Profile not found or deletion failed', code: 'DELETE_FAILED' },
          { status: 404 }
        );
      }
    }

  } catch (error) {
    console.error('Error in DELETE /api/matching/profiles/[id]:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid profile ID',
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
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message, code: 'PROFILE_NOT_FOUND' },
          { status: 404 }
        );
      }
      if (error.message.includes('not authorized')) {
        return NextResponse.json(
          { error: error.message, code: 'UNAUTHORIZED' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to delete profile',
        code: 'DELETE_ERROR'
      },
      { status: 500 }
    );
  }
}