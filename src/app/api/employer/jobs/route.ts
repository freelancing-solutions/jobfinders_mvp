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

    // Get employer profile
    const employerProfile = await db.employerProfile.findUnique({
      where: { userUid: session.user.id }
    })

    if (!employerProfile) {
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    const jobs = await db.job.findMany({
      where: { employerId: employerProfile.employerId },
      include: {
        company: {
          select: {
            name: true
          }
        }
      },
      orderBy: { postedAt: 'desc' }
    })

    const transformedJobs = jobs.map(job => ({
      jobId: job.jobId,
      title: job.title,
      description: job.description,
      status: job.status,
      postedAt: job.postedAt.toISOString(),
      applicationCount: job.applicationCount,
      viewCount: job.viewCount,
      isFeatured: job.isFeatured,
      isUrgent: job.isUrgent
    }))

    return NextResponse.json({
      success: true,
      data: transformedJobs
    })

  } catch (error) {
    console.error('Error fetching employer jobs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch jobs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    
    // Get employer profile
    const employerProfile = await db.employerProfile.findUnique({
      where: { userUid: session.user.id },
      include: {
        company: true
      }
    })

    if (!employerProfile || !employerProfile.company) {
      return NextResponse.json(
        { success: false, error: 'Company profile not found' },
        { status: 404 }
      )
    }

    // Create job
    const job = await db.job.create({
      data: {
        title: body.title,
        description: body.description,
        employerId: employerProfile.employerId,
        companyId: employerProfile.company.companyId,
        positionType: body.positionType,
        remotePolicy: body.remotePolicy,
        salaryMin: body.salaryMin,
        salaryMax: body.salaryMax,
        salaryCurrency: body.salaryCurrency || 'ZAR',
        city: body.city,
        province: body.province,
        country: body.country || 'South Africa',
        experienceLevel: body.experienceLevel,
        requiredSkills: body.requiredSkills,
        preferredSkills: body.preferredSkills,
        requiredDocuments: body.requiredDocuments,
        status: body.status || 'active',
        isFeatured: body.isFeatured || false,
        isUrgent: body.isUrgent || false,
        expiresAt: body.expiresAt
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        jobId: job.jobId,
        title: job.title,
        status: job.status
      },
      message: 'Job posted successfully'
    })

  } catch (error) {
    console.error('Error creating job:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create job' },
      { status: 500 }
    )
  }
}