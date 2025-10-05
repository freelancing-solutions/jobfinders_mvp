import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'employer') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // Get employer profile
    const employerProfile = await db.employerProfile.findUnique({
      where: { userUid: session.user.id }
    })

    if (!employerProfile) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        }
      })
    }

    // Get total count
    const totalCount = await db.jobApplication.count({
      where: {
        job: {
          employerId: employerProfile.employerId
        }
      }
    })

    // Get applications with pagination
    const applications = await db.jobApplication.findMany({
      where: {
        job: {
          employerId: employerProfile.employerId
        }
      },
      include: {
        job: {
          select: {
            title: true
          }
        },
        jobSeekerProfile: {
          select: {
            user: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: { appliedAt: 'desc' },
      skip: offset,
      take: limit
    })

    const transformedApplications = applications.map(app => ({
      id: app.applicationId,
      status: app.status,
      matchScore: app.matchScore,
      appliedAt: app.appliedAt.toISOString(),
      jobTitle: app.job.title,
      candidateName: app.jobSeekerProfile.user.name || 'Unknown'
    }))

    return NextResponse.json({
      success: true,
      data: transformedApplications,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Error fetching employer applications:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch applications' },
      { status: 500 }
    )
  }
}