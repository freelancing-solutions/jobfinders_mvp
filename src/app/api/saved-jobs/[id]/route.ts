import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params

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

    const savedJob = await db.savedJob.findUnique({
      where: {
        jobSeekerProfileId_jobId: {
          jobSeekerProfileId: jobSeekerProfile.userUid,
          jobId: id
        }
      },
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
            remotePolicy: true,
            description: true,
            requirements: true,
            benefits: true,
            createdAt: true
          }
        }
      }
    })

    if (!savedJob) {
      return NextResponse.json(
        { success: false, error: 'Saved job not found' },
        { status: 404 }
      )
    }

    const transformedSavedJob = {
      id: savedJob.job.jobId,
      title: savedJob.job.title,
      company: savedJob.job.company.name,
      location: `${savedJob.job.city}, ${savedJob.job.province}`.trim(),
      salaryMin: savedJob.job.salaryMin,
      salaryMax: savedJob.job.salaryMax,
      currency: savedJob.job.salaryCurrency,
      positionType: savedJob.job.positionType,
      remotePolicy: savedJob.job.remotePolicy,
      description: savedJob.job.description,
      requirements: savedJob.job.requirements,
      benefits: savedJob.job.benefits,
      postedAt: savedJob.job.createdAt?.toISOString(),
      savedAt: savedJob.savedAt.toISOString(),
      notes: savedJob.notes,
      status: savedJob.status
    }

    return NextResponse.json({
      success: true,
      data: transformedSavedJob
    })

  } catch (error) {
    console.error('Error fetching saved job:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch saved job' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params
    const body = await request.json()
    const { notes, status, tags } = body

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

    // Check if saved job exists
    const existingSavedJob = await db.savedJob.findUnique({
      where: {
        jobSeekerProfileId_jobId: {
          jobSeekerProfileId: jobSeekerProfile.userUid,
          jobId: id
        }
      }
    })

    if (!existingSavedJob) {
      return NextResponse.json(
        { success: false, error: 'Saved job not found' },
        { status: 404 }
      )
    }

    // Update the saved job
    const updateData: any = {}
    if (notes !== undefined) updateData.notes = notes
    if (status !== undefined) updateData.status = status
    if (tags !== undefined) updateData.tags = tags

    const updatedSavedJob = await db.savedJob.update({
      where: {
        jobSeekerProfileId_jobId: {
          jobSeekerProfileId: jobSeekerProfile.userUid,
          jobId: id
        }
      },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      data: updatedSavedJob,
      message: 'Saved job updated successfully'
    })

  } catch (error) {
    console.error('Error updating saved job:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update saved job' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params

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

    // Check if saved job exists
    const existingSavedJob = await db.savedJob.findUnique({
      where: {
        jobSeekerProfileId_jobId: {
          jobSeekerProfileId: jobSeekerProfile.userUid,
          jobId: id
        }
      }
    })

    if (!existingSavedJob) {
      return NextResponse.json(
        { success: false, error: 'Saved job not found' },
        { status: 404 }
      )
    }

    // Delete the saved job
    await db.savedJob.delete({
      where: {
        jobSeekerProfileId_jobId: {
          jobSeekerProfileId: jobSeekerProfile.userUid,
          jobId: id
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Saved job removed successfully'
    })

  } catch (error) {
    console.error('Error removing saved job:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to remove saved job' },
      { status: 500 }
    )
  }
}