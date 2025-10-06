/**
 * Resume Builder Upload API Route
 *
 * API endpoint for uploading resume files with validation,
 * virus scanning, and secure storage.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fileUploadService } from '@/services/resume-builder/file-upload';
import { ResumeBuilderErrorFactory } from '@/services/resume-builder/errors';
import { resumeBuilderConfig } from '@/services/resume-builder/config';

export async function POST(request: NextRequest) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();

  try {
    console.log(`[ResumeUpload] Starting upload request: ${requestId}`);

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

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        createErrorResponse(
          'VALIDATION_ERROR',
          'No file provided',
          { requestId }
        ),
        { status: 400 }
      );
    }

    // Get upload options
    const skipVirusScan = formData.get('skipVirusScan') === 'true';
    const quarantineIfSuspicious = formData.get('quarantineIfSuspicious') === 'true';

    // Check user quotas
    // Note: This would require integrating with a quota management system
    // For now, we'll proceed with basic checks

    // Perform upload
    const uploadResult = await fileUploadService.uploadFile(file, {
      userId: session.user.id,
      sessionId: session.sessionToken,
      requestId,
      skipVirusScan,
      quarantineIfSuspicious,
    });

    const duration = Date.now() - startTime;
    console.log(`[ResumeUpload] Upload completed successfully: ${requestId} (${duration}ms)`);

    return NextResponse.json(createSuccessResponse(uploadResult, requestId), {
      status: 200,
      headers: {
        'X-Request-ID': requestId,
        'X-Process-Time': duration.toString(),
      },
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[ResumeUpload] Upload failed: ${requestId} (${duration}ms)`, error);

    // Handle known service errors
    if (error && typeof error === 'object' && 'code' in error) {
      const serviceError = error as any;

      switch (serviceError.code) {
        case 'FILE_TOO_LARGE':
          return NextResponse.json(
            createErrorResponse(
              serviceError.code,
              serviceError.message,
              { ...serviceError.details, requestId }
            ),
            { status: 413 }
          );

        case 'UNSUPPORTED_FORMAT':
          return NextResponse.json(
            createErrorResponse(
              serviceError.code,
              serviceError.message,
              { ...serviceError.details, requestId }
            ),
            { status: 415 }
          );

        case 'VALIDATION_ERROR':
        case 'VIRUS_DETECTED':
        case 'VIRUS_QUARANTINED':
          return NextResponse.json(
            createErrorResponse(
              serviceError.code,
              serviceError.message,
              { ...serviceError.details, requestId }
            ),
            { status: 400 }
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

        case 'STORAGE_ERROR':
          return NextResponse.json(
            createErrorResponse(
              serviceError.code,
              serviceError.message,
              { ...serviceError.details, requestId }
            ),
            { status: 507 }
          );
      }
    }

    // Handle unknown errors
    return NextResponse.json(
      createErrorResponse(
        'UPLOAD_FAILED',
        'Failed to upload file',
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
    console.log(`[ResumeUpload] Getting upload stats: ${requestId}`);

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

    // Get upload statistics for the user
    const stats = await fileUploadService.getUploadStats(session.user.id);

    return NextResponse.json(createSuccessResponse(stats, requestId), {
      headers: {
        'X-Request-ID': requestId,
      },
    });

  } catch (error) {
    console.error(`[ResumeUpload] Failed to get upload stats: ${requestId}`, error);

    return NextResponse.json(
      createErrorResponse(
        'STATS_FAILED',
        'Failed to retrieve upload statistics',
        {
          originalError: error instanceof Error ? error.message : 'Unknown error',
          requestId,
        }
      ),
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    console.log(`[ResumeUpload] Delete upload request: ${requestId}`);

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

    // Get upload ID from request
    const { searchParams } = new URL(request.url);
    const uploadId = searchParams.get('uploadId');

    if (!uploadId) {
      return NextResponse.json(
        createErrorResponse(
          'VALIDATION_ERROR',
          'Upload ID is required',
          { requestId }
        ),
        { status: 400 }
      );
    }

    // Delete the file
    const deleted = await fileUploadService.deleteFile(uploadId, session.user.id);

    if (!deleted) {
      return NextResponse.json(
        createErrorResponse(
          'FILE_NOT_FOUND',
          'File not found or already deleted',
          { uploadId, requestId }
        ),
        { status: 404 }
      );
    }

    return NextResponse.json(
      createSuccessResponse(
        {
          uploadId,
          deleted: true,
          message: 'File deleted successfully',
        },
        requestId
      ),
      {
        headers: {
          'X-Request-ID': requestId,
        },
      }
    );

  } catch (error) {
    console.error(`[ResumeUpload] Delete failed: ${requestId}`, error);

    return NextResponse.json(
      createErrorResponse(
        'DELETE_FAILED',
        'Failed to delete file',
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

// Configuration for multipart form data parsing
export const config = {
  api: {
    bodyParser: false,
    responseLimit: '10mb',
  },
};