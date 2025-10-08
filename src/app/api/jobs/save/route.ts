import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { db } from '@/lib/db'
import { logger } from '@/lib/logging/logger'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
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
    const { jobId } = body

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
        jobId
      }
    })

    logger.info('Job saved successfully', {
      userId: session.user.id,
      jobId,
      savedJobId: savedJob.id
    })

    return NextResponse.json({
      success: true,
      data: savedJob,
      message: 'Job saved successfully'
    })

  } catch (error) {
    logger.error('Error saving job', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json(
      { success: false, error: 'Failed to save job' },
      { status: 500 }
    )
  }
}