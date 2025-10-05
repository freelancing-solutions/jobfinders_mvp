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

    if (session.user.role !== 'seeker') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get job seeker profile
    const jobSeekerProfile = await db.jobSeekerProfile.findUnique({
      where: { userUid: session.user.id }
    })

    if (!jobSeekerProfile) {
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    const savedJobs = await db.savedJob.findMany({
      where: { jobSeekerProfileId: jobSeekerProfile.userUid },
      include: {
        job: {
          select: {
            jobId: true,
            title: true,
            company: {
              select: {
                name: true
              }
            },
            city: true,
            province: true,
            salaryMin: true,
            salaryMax: true,
            salaryCurrency: true,
            positionType: true,
            remotePolicy: true
          }
        }
      },
      orderBy: { savedAt: 'desc' }
    })

    const transformedSavedJobs = savedJobs.map(savedJob => ({
      id: savedJob.job.jobId,
      title: savedJob.job.title,
      company: savedJob.job.company.name,
      location: `${savedJob.job.city}, ${savedJob.job.province}`.trim(),
      salaryMin: savedJob.job.salaryMin,
      salaryMax: savedJob.job.salaryMax,
      currency: savedJob.job.salaryCurrency,
      positionType: savedJob.job.positionType,
      remotePolicy: savedJob.job.remotePolicy,
      savedAt: savedJob.savedAt.toISOString()
    }))

    return NextResponse.json({
      success: true,
      data: transformedSavedJobs
    })

  } catch (error) {
    console.error('Error fetching saved jobs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch saved jobs' },
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

    if (session.user.role !== 'seeker') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { jobId, notes } = body

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'Job ID is required' },
        { status: 400 }
      )
    }

    // Verify job exists
    const job = await db.job.findUnique({
      where: { jobId }
    })

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      )
    }

    // Get job seeker profile
    const jobSeekerProfile = await db.jobSeekerProfile.findUnique({
      where: { userUid: session.user.id }
    })

    if (!jobSeekerProfile) {
      return NextResponse.json(
        { success: false, error: 'Job seeker profile not found' },
        { status: 404 }
      )
    }

    // Check if already saved
    const existingSavedJob = await db.savedJob.findUnique({
      where: {
        jobSeekerProfileId_jobId: {
          jobSeekerProfileId: jobSeekerProfile.userUid,
          jobId
        }
      }
    })

    if (existingSavedJob) {
      return NextResponse.json(
        { success: false, error: 'Job already saved' },
        { status: 400 }
      )
    }

    // Save the job
    const savedJob = await db.savedJob.create({
      data: {
        jobSeekerProfileId: jobSeekerProfile.userUid,
        jobId,
        notes
      }
    })

    return NextResponse.json({
      success: true,
      data: savedJob,
      message: 'Job saved successfully'
    })

  } catch (error) {
    console.error('Error saving job:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save job' },
      { status: 500 }
    )
  }
}