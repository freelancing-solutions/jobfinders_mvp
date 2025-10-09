import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db } from '@/lib/db';
import { apiHandler, APIError } from '@/lib/api-handler';
import { ApplicationStatus } from '@prisma/client';
import { logger } from '@/lib/logging/logger';

// Helper function to map frontend status to Prisma status
function mapFrontendStatusToPrisma(status: string): ApplicationStatus {
  const statusMap: Record<string, ApplicationStatus> = {
    'applied': ApplicationStatus.APPLIED,
    'reviewing': ApplicationStatus.REVIEWING,
    'shortlisted': ApplicationStatus.SHORTLISTED,
    'interview_scheduled': ApplicationStatus.INTERVIEW_SCHEDULED,
    'interview_completed': ApplicationStatus.INTERVIEW_COMPLETED,
    'offered': ApplicationStatus.OFFERED,
    'rejected': ApplicationStatus.REJECTED,
    'withdrawn': ApplicationStatus.WITHDRAWN,
    'hired': ApplicationStatus.HIRED,
    'archived': ApplicationStatus.ARCHIVED
  }
  return statusMap[status] || ApplicationStatus.APPLIED
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return apiHandler(request, async (req) => {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      throw new APIError('Authentication required', 401);
    }

    const body = await req.json();
    const { type, applicationIds, data, confirmRequired = false } = body;

    if (!type || !applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      throw new APIError('Bulk action type and application IDs are required', 400);
    }

    if (confirmRequired) {
      const confirmation = body.confirmation;
      if (!confirmation) {
        throw new APIError('Confirmation is required for this action', 400);
      }
    }

    // Verify ownership of all applications
    const applications = await db.jobApplication.findMany({
      where: {
        applicationId: {
          in: applicationIds,
        },
        jobSeekerProfile: {
          userUid: session.user.id,
        },
      },
    });

    if (applications.length !== applicationIds.length) {
      throw new APIError('Some applications not found or access denied', 404);
    }

    const success: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];

    // Process each application
    for (const applicationId of applicationIds) {
      try {
        switch (type) {
          case 'update_status':
            await handleStatusUpdate(applicationId, data.status, session.user.id, session.user.email || 'User');
            success.push(applicationId);
            break;

          case 'archive':
            await handleArchive(applicationId, session.user.id, session.user.email || 'User');
            success.push(applicationId);
            break;

          case 'delete':
            await handleDelete(applicationId, session.user.id);
            success.push(applicationId);
            break;

          case 'add_note':
            await handleAddNote(applicationId, data.note, session.user.id, session.user.email || 'User');
            success.push(applicationId);
            break;

          case 'withdraw':
            await handleWithdraw(applicationId, data.reason, session.user.id, session.user.email || 'User');
            success.push(applicationId);
            break;

          default:
            throw new APIError('Unsupported bulk action type', 400);
        }
      } catch (error) {
        logger.error('Bulk action failed for application', {
          applicationId,
          action: type,
          userId: session.user.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        failed.push({
          id: applicationId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Log bulk action
    logger.info('Bulk action completed', {
      action: type,
      totalRequested: applicationIds.length,
      successful: success.length,
      failed: failed.length,
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      data: {
        success,
        failed,
        summary: {
          total: applicationIds.length,
          successful: success.length,
          failed: failed.length,
        },
      },
      message: `Bulk action completed: ${success.length} successful, ${failed.length} failed`,
    });
  });
}

// Helper functions for different bulk actions
async function handleStatusUpdate(
  applicationId: string,
  status: string,
  userId: string,
  userEmail: string,
): Promise<void> {
  const newStatus = mapFrontendStatusToPrisma(status);

  await db.jobApplication.update({
    where: { applicationId },
    data: {
      status: newStatus,
      lastStatusUpdate: new Date(),
    },
  });

  // Add timeline event
  await db.applicationTimeline.create({
    data: {
      applicationId,
      status: newStatus,
      notes: `Status changed to ${status} (bulk action)`,
      createdBy: userEmail,
      createdByRole: 'candidate',
    },
  });
}

async function handleArchive(
  applicationId: string,
  userId: string,
  userEmail: string,
): Promise<void> {
  await db.jobApplication.update({
    where: { applicationId },
    data: {
      status: ApplicationStatus.ARCHIVED,
      lastStatusUpdate: new Date(),
    },
  });

  // Add timeline event
  await db.applicationTimeline.create({
    data: {
      applicationId,
      status: ApplicationStatus.ARCHIVED,
      notes: 'Application archived (bulk action)',
      createdBy: userEmail,
      createdByRole: 'candidate',
    },
  });
}

async function handleDelete(applicationId: string, userId: string): Promise<void> {
  // Delete related records first
  await db.applicationTimeline.deleteMany({
    where: { applicationId },
  });

  await db.applicationAttachment.deleteMany({
    where: { applicationId },
  });

  await db.applicationNote.deleteMany({
    where: { applicationId },
  });

  await db.interviewSchedule.deleteMany({
    where: { applicationId },
  });

  // Delete the application
  await db.jobApplication.delete({
    where: { applicationId },
  });
}

async function handleAddNote(
  applicationId: string,
  note: string,
  userId: string,
  userEmail: string,
): Promise<void> {
  if (!note || note.trim().length === 0) {
    throw new Error('Note content is required');
  }

  await db.applicationNote.create({
    data: {
      applicationId,
      content: note.trim(),
      isPrivate: true,
      tags: JSON.stringify(['bulk-action']),
      createdBy: userEmail,
      createdById: userId,
    },
  });

  // Update application's last status update
  await db.jobApplication.update({
    where: { applicationId },
    data: {
      lastStatusUpdate: new Date(),
    },
  });

  // Add timeline event
  await db.applicationTimeline.create({
    data: {
      applicationId,
      status: ApplicationStatus.REVIEWING, // Use a default status for timeline
      notes: `Note added (bulk action): ${note.substring(0, 100)}${note.length > 100 ? '...' : ''}`,
      createdBy: userEmail,
      createdByRole: 'candidate',
    },
  });
}

async function handleWithdraw(
  applicationId: string,
  reason: string,
  userId: string,
  userEmail: string,
): Promise<void> {
  await db.jobApplication.update({
    where: { applicationId },
    data: {
      status: ApplicationStatus.WITHDRAWN,
      lastStatusUpdate: new Date(),
    },
  });

  // Add timeline event
  await db.applicationTimeline.create({
    data: {
      applicationId,
      status: ApplicationStatus.WITHDRAWN,
      notes: `Application withdrawn (bulk action)${reason ? `: ${reason}` : ''}`,
      createdBy: userEmail,
      createdByRole: 'candidate',
    },
  });
}