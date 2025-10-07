import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { db } from '@/lib/db'
import { apiHandler, APIError } from '@/lib/api-handler'
import { ApplicationStatus } from '@prisma/client'
import { logger } from '@/lib/logging/logger'

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

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return apiHandler(request, async (req) => {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      throw new APIError('Authentication required', 401)
    }

    const { id } = params
    const body = await req.json()
    const { status, note } = body

    if (!status) {
      throw new APIError('Status is required', 400)
    }

    // Validate status
    const validStatuses = Object.keys(ApplicationStatus)
    if (!validStatuses.includes(status.toUpperCase())) {
      throw new APIError('Invalid status', 400)
    }

    // Verify ownership
    const existingApplication = await db.jobApplication.findFirst({
      where: {
        applicationId: id,
        jobSeekerProfile: {
          userUid: session.user.id
        }
      },
      include: {
        job: {
          include: {
            company: true
          }
        }
      }
    })

    if (!existingApplication) {
      throw new APIError('Application not found', 404)
    }

    const newStatus = mapFrontendStatusToPrisma(status)

    // Check if this is a valid status transition
    const currentStatus = existingApplication.status
    const isValidTransition = await isValidStatusTransition(currentStatus, newStatus, session.user.id)

    if (!isValidTransition) {
      throw new APIError('Invalid status transition', 400)
    }

    // Update application status
    const updatedApplication = await db.jobApplication.update({
      where: {
        applicationId: id
      },
      data: {
        status: newStatus,
        lastStatusUpdate: new Date()
      },
      include: {
        job: {
          include: {
            company: true
          }
        }
      }
    })

    // Add timeline event
    await db.applicationTimeline.create({
      data: {
        applicationId: id,
        status: newStatus,
        notes: note || `Status changed to ${status}`,
        createdBy: session.user.email || 'User',
        createdByRole: 'candidate'
      }
    })

    // TODO: Send notifications to employer
    // TODO: Trigger real-time updates via WebSocket
    // TODO: Update analytics
    // TODO: Send confirmation email to user

    // Log the status change
    logger.info('Application status updated', {
      applicationId: id,
      oldStatus: currentStatus,
      newStatus: newStatus,
      userId: session.user.id,
      note
    })

    return NextResponse.json({
      success: true,
      data: {
        id: updatedApplication.applicationId,
        status: newStatus.toLowerCase(),
        updatedAt: updatedApplication.lastStatusUpdate.toISOString()
      },
      message: 'Application status updated successfully'
    })
  })
}

// Helper function to validate status transitions
async function isValidStatusTransition(
  currentStatus: ApplicationStatus,
  newStatus: ApplicationStatus,
  userId: string
): Promise<boolean> {
  // Define allowed transitions for candidates
  const allowedTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
    [ApplicationStatus.APPLIED]: [
      ApplicationStatus.REVIEWING,
      ApplicationStatus.REJECTED,
      ApplicationStatus.WITHDRAWN,
      ApplicationStatus.ARCHIVED
    ],
    [ApplicationStatus.REVIEWING]: [
      ApplicationStatus.SHORTLISTED,
      ApplicationStatus.INTERVIEW_SCHEDULED,
      ApplicationStatus.REJECTED,
      ApplicationStatus.WITHDRAWN,
      ApplicationStatus.ARCHIVED
    ],
    [ApplicationStatus.SHORTLISTED]: [
      ApplicationStatus.INTERVIEW_SCHEDULED,
      ApplicationStatus.REJECTED,
      ApplicationStatus.WITHDRAWN,
      ApplicationStatus.ARCHIVED
    ],
    [ApplicationStatus.INTERVIEW_SCHEDULED]: [
      ApplicationStatus.INTERVIEW_COMPLETED,
      ApplicationStatus.REJECTED,
      ApplicationStatus.WITHDRAWN,
      ApplicationStatus.ARCHIVED
    ],
    [ApplicationStatus.INTERVIEW_COMPLETED]: [
      ApplicationStatus.OFFERED,
      ApplicationStatus.REJECTED,
      ApplicationStatus.WITHDRAWN,
      ApplicationStatus.ARCHIVED
    ],
    [ApplicationStatus.OFFERED]: [
      ApplicationStatus.HIRED,
      ApplicationStatus.REJECTED,
      ApplicationStatus.WITHDRAWN,
      ApplicationStatus.ARCHIVED
    ],
    [ApplicationStatus.REJECTED]: [
      ApplicationStatus.ARCHIVED
    ],
    [ApplicationStatus.WITHDRAWN]: [
      ApplicationStatus.ARCHIVED
    ],
    [ApplicationStatus.HIRED]: [
      ApplicationStatus.ARCHIVED
    ],
    [ApplicationStatus.ARCHIVED]: []
  }

  return allowedTransitions[currentStatus]?.includes(newStatus) || false
}