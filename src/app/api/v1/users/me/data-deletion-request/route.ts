import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limiter'

/**
 * POST /api/v1/users/me/data-deletion-request
 * Initiates account deletion with 30-day grace period for POPIA compliance
 * Implements the right to be forgotten under data protection laws
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 3 requests per day per user
    const rateLimitResult = await rateLimit(request, 'data-deletion', 3, 86400)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again tomorrow.' },
        { status: 429 }
      )
    }

    // Authentication check
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const { reason, confirmEmail } = await request.json()

    // Validate request body
    if (!reason || typeof reason !== 'string') {
      return NextResponse.json(
        { error: 'Deletion reason is required' },
        { status: 400 }
      )
    }

    if (confirmEmail !== session.user.email) {
      return NextResponse.json(
        { error: 'Email confirmation does not match account email' },
        { status: 400 }
      )
    }

    // Check if user already has a pending deletion request
    const existingRequest = await prisma.dataDeletionRequest.findFirst({
      where: {
        userId: userId,
        status: 'PENDING'
      }
    })

    if (existingRequest) {
      return NextResponse.json(
        { 
          error: 'Deletion request already pending',
          scheduledDeletion: existingRequest.scheduledDeletion,
          requestId: existingRequest.id
        },
        { status: 409 }
      )
    }

    // Calculate deletion date (30 days from now)
    const scheduledDeletion = new Date()
    scheduledDeletion.setDate(scheduledDeletion.getDate() + 30)

    // Create deletion request
    const deletionRequest = await prisma.dataDeletionRequest.create({
      data: {
        userId: userId,
        reason: reason,
        requestedAt: new Date(),
        scheduledDeletion: scheduledDeletion,
        status: 'PENDING',
        ipAddress: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      }
    })

    // Log the deletion request for audit purposes
    await prisma.auditLog.create({
      data: {
        userId: userId,
        action: 'DATA_DELETION_REQUESTED',
        ipAddress: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        metadata: {
          deletionRequestId: deletionRequest.id,
          reason: reason,
          scheduledDeletion: scheduledDeletion.toISOString(),
          gracePeriodDays: 30,
        }
      }
    })

    // TODO: Send confirmation email to user
    // This would typically integrate with your email service (Resend)
    // await sendDeletionConfirmationEmail(session.user.email, {
    //   requestId: deletionRequest.id,
    //   scheduledDeletion: scheduledDeletion,
    //   cancellationUrl: `${process.env.NEXTAUTH_URL}/account/cancel-deletion?token=${deletionRequest.id}`
    // })

    return NextResponse.json({
      success: true,
      message: 'Data deletion request submitted successfully',
      requestId: deletionRequest.id,
      scheduledDeletion: scheduledDeletion.toISOString(),
      gracePeriod: {
        days: 30,
        description: 'You have 30 days to cancel this request. After this period, your account and all associated data will be permanently deleted.',
      },
      cancellationInfo: {
        method: 'Contact support or use the cancellation link in your confirmation email',
        email: 'support@jobfinders.site',
        deadline: scheduledDeletion.toISOString(),
      },
      whatWillBeDeleted: [
        'Account information and profile data',
        'Job applications and saved jobs',
        'CV and uploaded documents',
        'Subscription and billing history',
        'Communication preferences and notifications',
        'All personal information and activity logs',
      ],
      whatWillBeRetained: [
        'Anonymized analytics data (no personal identifiers)',
        'Legal compliance records (as required by law)',
        'Financial records (for tax and audit purposes)',
      ]
    })

  } catch (error) {
    console.error('Data deletion request error:', error)
    
    // Log the error for monitoring
    if (error instanceof Error) {
      await prisma.auditLog.create({
        data: {
          userId: null,
          action: 'DATA_DELETION_REQUEST_ERROR',
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          metadata: {
            error: error.message,
            stack: error.stack,
          }
        }
      }).catch(() => {}) // Ignore logging errors
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/v1/users/me/data-deletion-request
 * Check status of existing deletion request
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Find existing deletion request
    const deletionRequest = await prisma.dataDeletionRequest.findFirst({
      where: {
        userId: userId,
        status: 'PENDING'
      },
      select: {
        id: true,
        reason: true,
        requestedAt: true,
        scheduledDeletion: true,
        status: true,
      }
    })

    if (!deletionRequest) {
      return NextResponse.json({
        hasPendingRequest: false,
        message: 'No pending deletion request found'
      })
    }

    const now = new Date()
    const daysRemaining = Math.ceil(
      (deletionRequest.scheduledDeletion.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )

    return NextResponse.json({
      hasPendingRequest: true,
      requestId: deletionRequest.id,
      requestedAt: deletionRequest.requestedAt.toISOString(),
      scheduledDeletion: deletionRequest.scheduledDeletion.toISOString(),
      daysRemaining: Math.max(0, daysRemaining),
      status: deletionRequest.status,
      reason: deletionRequest.reason,
      canCancel: daysRemaining > 0,
    })

  } catch (error) {
    console.error('Deletion request status check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/v1/users/me/data-deletion-request
 * Cancel pending deletion request
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Find and cancel pending deletion request
    const deletionRequest = await prisma.dataDeletionRequest.findFirst({
      where: {
        userId: userId,
        status: 'PENDING'
      }
    })

    if (!deletionRequest) {
      return NextResponse.json(
        { error: 'No pending deletion request found' },
        { status: 404 }
      )
    }

    // Check if still within grace period
    const now = new Date()
    if (now >= deletionRequest.scheduledDeletion) {
      return NextResponse.json(
        { error: 'Deletion request cannot be cancelled - grace period has expired' },
        { status: 410 }
      )
    }

    // Cancel the deletion request
    await prisma.dataDeletionRequest.update({
      where: { id: deletionRequest.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: now,
      }
    })

    // Log the cancellation for audit purposes
    await prisma.auditLog.create({
      data: {
        userId: userId,
        action: 'DATA_DELETION_CANCELLED',
        ipAddress: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        metadata: {
          deletionRequestId: deletionRequest.id,
          originalScheduledDeletion: deletionRequest.scheduledDeletion.toISOString(),
          cancelledAt: now.toISOString(),
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Data deletion request cancelled successfully',
      requestId: deletionRequest.id,
      cancelledAt: now.toISOString(),
    })

  } catch (error) {
    console.error('Deletion request cancellation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}