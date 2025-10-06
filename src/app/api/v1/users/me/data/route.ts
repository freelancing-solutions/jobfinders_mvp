import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limiter'

/**
 * GET /api/v1/users/me/data
 * Returns complete user data in JSON format for POPIA compliance
 * Implements the right of access under data protection laws
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting: 5 requests per hour per user
    const rateLimitResult = await rateLimit(request, 'data-access', 5, 3600)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
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

    // Fetch all user data from database
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: {
            skills: true,
            portfolioLinks: true,
          }
        },
        applications: {
          include: {
            job: {
              select: {
                id: true,
                title: true,
                company: true,
                location: true,
                createdAt: true,
              }
            }
          }
        },
        savedJobs: {
          include: {
            job: {
              select: {
                id: true,
                title: true,
                company: true,
                location: true,
                createdAt: true,
              }
            }
          }
        },
        subscriptions: {
          select: {
            id: true,
            plan: true,
            status: true,
            startDate: true,
            endDate: true,
            createdAt: true,
          }
        },
        notifications: {
          select: {
            id: true,
            type: true,
            title: true,
            message: true,
            read: true,
            createdAt: true,
          }
        },
        auditLogs: {
          select: {
            id: true,
            action: true,
            ipAddress: true,
            userAgent: true,
            createdAt: true,
            metadata: true,
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 100, // Limit to last 100 audit entries
        }
      }
    })

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Structure the response for POPIA compliance
    const dataExport = {
      exportInfo: {
        exportDate: new Date().toISOString(),
        exportType: 'complete_user_data',
        dataSubject: userData.email,
        legalBasis: 'POPIA Article 23 - Right of Access',
      },
      personalInformation: {
        account: {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          image: userData.image,
          emailVerified: userData.emailVerified,
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt,
        },
        profile: userData.profile ? {
          id: userData.profile.id,
          firstName: userData.profile.firstName,
          lastName: userData.profile.lastName,
          phone: userData.profile.phone,
          location: userData.profile.location,
          bio: userData.profile.bio,
          experience: userData.profile.experience,
          education: userData.profile.education,
          salaryExpectation: userData.profile.salaryExpectation,
          availability: userData.profile.availability,
          resumeUrl: userData.profile.resumeUrl,
          profileCompletion: userData.profile.profileCompletion,
          skills: userData.profile.skills.map(skill => ({
            id: skill.id,
            name: skill.name,
            level: skill.level,
            createdAt: skill.createdAt,
          })),
          portfolioLinks: userData.profile.portfolioLinks.map(link => ({
            id: link.id,
            title: link.title,
            url: link.url,
            description: link.description,
            createdAt: link.createdAt,
          })),
          createdAt: userData.profile.createdAt,
          updatedAt: userData.profile.updatedAt,
        } : null,
      },
      activityData: {
        jobApplications: userData.applications.map(app => ({
          id: app.id,
          status: app.status,
          appliedAt: app.createdAt,
          coverLetter: app.coverLetter,
          customResume: app.customResume,
          job: app.job,
        })),
        savedJobs: userData.savedJobs.map(saved => ({
          id: saved.id,
          savedAt: saved.createdAt,
          job: saved.job,
        })),
        subscriptions: userData.subscriptions,
        notifications: userData.notifications,
      },
      systemData: {
        auditLogs: userData.auditLogs,
        lastLogin: userData.updatedAt, // Approximation
        accountStatus: 'active',
      },
      dataProcessingInfo: {
        purposes: [
          'Job matching and recommendations',
          'Account management and authentication',
          'Communication about job opportunities',
          'Service improvement and analytics',
          'Legal compliance and fraud prevention',
        ],
        legalBases: [
          'Consent for marketing communications',
          'Contract performance for job matching services',
          'Legitimate interest for service improvement',
          'Legal obligation for compliance requirements',
        ],
        retentionPeriod: 'Active account + 2 years after deletion',
        thirdPartyProcessors: [
          'Paddle (payment processing)',
          'Resend (email delivery)',
          'Claude AI (job matching)',
          'Google Analytics (with consent)',
        ],
      },
    }

    // Log the data access request for audit purposes
    await prisma.auditLog.create({
      data: {
        userId: userId,
        action: 'DATA_ACCESS_REQUEST',
        ipAddress: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        metadata: {
          exportType: 'complete_user_data',
          recordCount: {
            applications: userData.applications.length,
            savedJobs: userData.savedJobs.length,
            notifications: userData.notifications.length,
            auditLogs: userData.auditLogs.length,
          }
        }
      }
    })

    return NextResponse.json(dataExport, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="jobfinders-data-export-${userId}-${Date.now()}.json"`,
      }
    })

  } catch (error) {
    console.error('Data access request error:', error)
    
    // Log the error for monitoring
    if (error instanceof Error) {
      await prisma.auditLog.create({
        data: {
          userId: null,
          action: 'DATA_ACCESS_ERROR',
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