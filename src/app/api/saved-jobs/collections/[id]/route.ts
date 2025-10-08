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

    // Handle default collections
    if (['applied', 'interviewing', 'follow-up', 'saved'].includes(id)) {
      const jobSeekerProfile = await db.jobSeekerProfile.findUnique({
        where: { userUid: session.user.id }
      })

      if (!jobSeekerProfile) {
        return NextResponse.json({
          success: true,
          data: { jobs: [] }
        })
      }

      const savedJobs = await db.savedJob.findMany({
        where: {
          jobSeekerProfileId: jobSeekerProfile.userUid,
          status: id === 'saved' ? null : id
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
        },
        orderBy: { savedAt: 'desc' }
      })

      const transformedJobs = savedJobs.map(savedJob => ({
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
        status: savedJob.status || 'saved'
      }))

      return NextResponse.json({
        success: true,
        data: {
          id,
          name: id.charAt(0).toUpperCase() + id.slice(1),
          isDefault: true,
          jobs: transformedJobs
        }
      })
    }

    // Handle custom collections
    const jobSeekerProfile = await db.jobSeekerProfile.findUnique({
      where: { userUid: session.user.id }
    })

    if (!jobSeekerProfile) {
      return NextResponse.json(
        { success: false, error: 'Job seeker profile not found' },
        { status: 404 }
      )
    }

    const collection = await db.savedJobCollection.findUnique({
      where: {
        id,
        jobSeekerProfileId: jobSeekerProfile.userUid
      },
      include: {
        savedJobs: {
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
        }
      }
    })

    if (!collection) {
      return NextResponse.json(
        { success: false, error: 'Collection not found' },
        { status: 404 }
      )
    }

    const transformedJobs = collection.savedJobs.map(savedJob => ({
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
      status: savedJob.status || 'saved'
    }))

    return NextResponse.json({
      success: true,
      data: {
        id: collection.id,
        name: collection.name,
        description: collection.description,
        color: collection.color,
        isDefault: false,
        jobs: transformedJobs
      }
    })

  } catch (error) {
    console.error('Error fetching collection:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch collection' },
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
    const { name, description, color } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Collection name is required' },
        { status: 400 }
      )
    }

    // Cannot modify default collections
    if (['applied', 'interviewing', 'follow-up', 'saved'].includes(id)) {
      return NextResponse.json(
        { success: false, error: 'Cannot modify default collections' },
        { status: 400 }
      )
    }

    const jobSeekerProfile = await db.jobSeekerProfile.findUnique({
      where: { userUid: session.user.id }
    })

    if (!jobSeekerProfile) {
      return NextResponse.json(
        { success: false, error: 'Job seeker profile not found' },
        { status: 404 }
      )
    }

    const existingCollection = await db.savedJobCollection.findUnique({
      where: {
        id,
        jobSeekerProfileId: jobSeekerProfile.userUid
      }
    })

    if (!existingCollection) {
      return NextResponse.json(
        { success: false, error: 'Collection not found' },
        { status: 404 }
      )
    }

    const updatedCollection = await db.savedJobCollection.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || '',
        color: color || existingCollection.color
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedCollection,
      message: 'Collection updated successfully'
    })

  } catch (error) {
    console.error('Error updating collection:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update collection' },
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

    // Cannot delete default collections
    if (['applied', 'interviewing', 'follow-up', 'saved'].includes(id)) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete default collections' },
        { status: 400 }
      )
    }

    const jobSeekerProfile = await db.jobSeekerProfile.findUnique({
      where: { userUid: session.user.id }
    })

    if (!jobSeekerProfile) {
      return NextResponse.json(
        { success: false, error: 'Job seeker profile not found' },
        { status: 404 }
      )
    }

    const existingCollection = await db.savedJobCollection.findUnique({
      where: {
        id,
        jobSeekerProfileId: jobSeekerProfile.userUid
      }
    })

    if (!existingCollection) {
      return NextResponse.json(
        { success: false, error: 'Collection not found' },
        { status: 404 }
      )
    }

    // Delete the collection (this will also remove relationships due to cascade)
    await db.savedJobCollection.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Collection deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting collection:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete collection' },
      { status: 500 }
    )
  }
}