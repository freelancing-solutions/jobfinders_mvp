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

// Helper function to map Prisma status to frontend status
function mapPrismaStatusToFrontend(status: ApplicationStatus): string {
  const statusMap = {
    'APPLIED': 'applied',
    'REVIEWING': 'reviewing',
    'SHORTLISTED': 'shortlisted',
    'INTERVIEW_SCHEDULED': 'interview_scheduled',
    'INTERVIEW_COMPLETED': 'interview_completed',
    'OFFERED': 'offered',
    'REJECTED': 'rejected',
    'WITHDRAWN': 'withdrawn',
    'HIRED': 'hired',
    'ARCHIVED': 'archived'
  }
  return statusMap[status] || status.toLowerCase()
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return apiHandler(request, async (req) => {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      throw new APIError('Authentication required', 401)
    }

    const { id } = params

    // Fetch the application with all related data
    const application = await db.jobApplication.findFirst({
      where: {
        applicationId: id,
        jobSeekerProfile: {
          userUid: session.user.id
        }
      },
      include: {
        job: {
          include: {
            company: true,
            employer: true
          }
        },
        jobSeekerProfile: {
          include: {
            user: true
          }
        }
      }
    })

    if (!application) {
      throw new APIError('Application not found', 404)
    }

    // Get timeline events
    const timelineEvents = await db.applicationTimeline.findMany({
      where: {
        applicationId: application.applicationId
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Get attachments
    const attachments = await db.applicationAttachment.findMany({
      where: {
        applicationId: application.applicationId
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get notes
    const notes = await db.applicationNote.findMany({
      where: {
        applicationId: application.applicationId
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get interview details
    const interviews = await db.interviewSchedule.findMany({
      where: {
        applicationId: application.applicationId
      },
      orderBy: {
        scheduledAt: 'asc'
      }
    })

    // Format response
    const formattedApplication = {
      id: application.applicationId,
      jobId: application.job.jobId,
      userId: application.jobSeekerProfile.userUid,
      status: mapPrismaStatusToFrontend(application.status),
      appliedAt: application.appliedAt.toISOString(),
      updatedAt: application.lastStatusUpdate.toISOString(),
      job: {
        id: application.job.jobId,
        title: application.job.title,
        company: {
          id: application.job.company?.companyId || '',
          name: application.job.company?.name || '',
          logo: application.job.company?.logo || '',
          location: application.job.company?.location || '',
          website: application.job.company?.website || '',
          size: application.job.company?.size || '',
          industry: application.job.company?.industry || ''
        },
        location: application.job.location,
        salaryMin: application.job.salaryMin,
        salaryMax: application.job.salaryMax,
        currency: application.job.currency || 'USD',
        positionType: application.job.positionType,
        remotePolicy: application.job.remotePolicy,
        description: application.job.description || '',
        requirements: application.job.requirements || [],
        benefits: application.job.benefits || [],
        isFeatured: application.job.isFeatured || false,
        isUrgent: application.job.isUrgent || false,
        postedAt: application.job.postedAt.toISOString(),
        expiresAt: application.job.expiresAt?.toISOString(),
        applicationCount: application.job.applicantCount || 0,
        department: application.job.department || '',
        experienceLevel: application.job.experienceLevel || '',
        skills: application.job.skills || []
      },
      resume: application.resumeFileUrl ? {
        id: application.applicationId,
        title: 'Resume',
        fileUrl: application.resumeFileUrl,
        fileName: 'Resume.pdf',
        fileSize: 0,
        fileType: 'application/pdf'
      } : undefined,
      coverLetter: application.coverLetter,
      notes: application.notes,
      matchScore: application.matchScore,
      viewCount: application.viewCount || 0,
      source: application.source || 'direct',
      timeline: timelineEvents.map(event => ({
        id: event.timelineId,
        status: mapPrismaStatusToFrontend(event.status),
        timestamp: event.createdAt.toISOString(),
        note: event.notes,
        updatedBy: event.createdBy || 'System',
        updatedByRole: event.createdByRole || 'system',
        attachments: []
      })),
      attachments: attachments.map(attachment => ({
        id: attachment.attachmentId,
        name: attachment.fileName,
        url: attachment.fileUrl,
        type: attachment.fileType,
        size: attachment.fileSize,
        uploadedAt: attachment.createdAt.toISOString(),
        uploadedBy: attachment.uploadedBy || 'System',
        description: attachment.description
      })),
      interviewDetails: interviews.map(interview => ({
        id: interview.interviewId,
        type: interview.type,
        scheduledAt: interview.scheduledAt.toISOString(),
        duration: interview.duration || 60,
        location: interview.location,
        meetingLink: interview.meetingLink,
        interviewers: interview.interviewers ? JSON.parse(interview.interviewers as string) : [],
        instructions: interview.instructions,
        preparation: interview.preparation ? JSON.parse(interview.preparation as string) : [],
        status: interview.status,
        feedback: interview.feedback,
        rating: interview.rating
      })),
      feedback: [], // TODO: Implement feedback tracking
      analytics: {
        views: application.viewCount || 0,
        lastViewed: application.lastViewedAt?.toISOString(),
        clickThroughRate: 0, // TODO: Implement analytics
        responseRate: 0,
        averageResponseTime: 0,
        competitorCount: 0,
        marketDemand: 'medium' as const,
        skillMatchScore: application.matchScore || 0,
        experienceMatchScore: 0,
        recommendations: []
      },
      notifications: {
        statusUpdates: true,
        interviewReminders: true,
        feedbackRequests: true,
        deadlineReminders: true,
        weeklyDigest: false,
        newApplicantsAlert: false,
        customAlerts: []
      }
    }

    return NextResponse.json({
      success: true,
      data: formattedApplication
    })
  })
}

export async function PUT(
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

    // Verify ownership
    const existingApplication = await db.jobApplication.findFirst({
      where: {
        applicationId: id,
        jobSeekerProfile: {
          userUid: session.user.id
        }
      }
    })

    if (!existingApplication) {
      throw new APIError('Application not found', 404)
    }

    const { status, notes, coverLetter } = body

    // Prepare update data
    const updateData: any = {
      lastStatusUpdate: new Date()
    }

    if (status) {
      updateData.status = mapFrontendStatusToPrisma(status)

      // Add timeline event for status change
      await db.applicationTimeline.create({
        data: {
          applicationId: id,
          status: mapFrontendStatusToPrisma(status),
          notes: `Status changed to ${status}`,
          createdBy: session.user.email || 'User',
          createdByRole: 'candidate'
        }
      })
    }

    if (notes !== undefined) {
      updateData.notes = notes
    }

    if (coverLetter !== undefined) {
      updateData.coverLetter = coverLetter
    }

    // Update application
    const updatedApplication = await db.jobApplication.update({
      where: {
        applicationId: id
      },
      data: updateData,
      include: {
        job: {
          include: {
            company: true
          }
        },
        jobSeekerProfile: {
          include: {
            user: true
          }
        }
      }
    })

    // TODO: Send notifications
    // TODO: Trigger real-time updates via WebSocket

    return NextResponse.json({
      success: true,
      data: {
        id: updatedApplication.applicationId,
        status: mapPrismaStatusToFrontend(updatedApplication.status),
        notes: updatedApplication.notes,
        coverLetter: updatedApplication.coverLetter,
        updatedAt: updatedApplication.lastStatusUpdate.toISOString()
      }
    })
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return apiHandler(request, async (req) => {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      throw new APIError('Authentication required', 401)
    }

    const { id } = params

    // Verify ownership
    const existingApplication = await db.jobApplication.findFirst({
      where: {
        applicationId: id,
        jobSeekerProfile: {
          userUid: session.user.id
        }
      }
    })

    if (!existingApplication) {
      throw new APIError('Application not found', 404)
    }

    // Delete related records first (timeline, attachments, notes, etc.)
    await db.applicationTimeline.deleteMany({
      where: {
        applicationId: id
      }
    })

    await db.applicationAttachment.deleteMany({
      where: {
        applicationId: id
      }
    })

    await db.applicationNote.deleteMany({
      where: {
        applicationId: id
      }
    })

    await db.interviewSchedule.deleteMany({
      where: {
        applicationId: id
      }
    })

    // Delete the application
    await db.jobApplication.delete({
      where: {
        applicationId: id
      }
    })

    // Update job applicant count
    await db.job.update({
      where: {
        jobId: existingApplication.jobId
      },
      data: {
        applicantCount: {
          decrement: 1
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Application deleted successfully'
    })
  })
}