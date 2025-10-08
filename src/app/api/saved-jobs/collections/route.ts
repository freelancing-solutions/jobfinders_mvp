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

    // Get user collections
    const collections = await db.savedJobCollection.findMany({
      where: { jobSeekerProfileId: jobSeekerProfile.userUid },
      include: {
        _count: {
          select: { savedJobs: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Get default collections with job counts
    const defaultCollections = [
      {
        id: 'applied',
        name: 'Applied',
        description: 'Jobs you\'ve applied to',
        color: '#3b82f6',
        isDefault: true,
        jobCount: await db.savedJob.count({
          where: {
            jobSeekerProfileId: jobSeekerProfile.userUid,
            status: 'applied'
          }
        })
      },
      {
        id: 'interviewing',
        name: 'Interviewing',
        description: 'Jobs in interview process',
        color: '#8b5cf6',
        isDefault: true,
        jobCount: await db.savedJob.count({
          where: {
            jobSeekerProfileId: jobSeekerProfile.userUid,
            status: 'interviewing'
          }
        })
      },
      {
        id: 'follow-up',
        name: 'Follow-up',
        description: 'Jobs requiring follow-up',
        color: '#f59e0b',
        isDefault: true,
        jobCount: await db.savedJob.count({
          where: {
            jobSeekerProfileId: jobSeekerProfile.userUid,
            status: 'follow-up'
          }
        })
      },
      {
        id: 'saved',
        name: 'Saved',
        description: 'All saved jobs',
        color: '#10b981',
        isDefault: true,
        jobCount: await db.savedJob.count({
          where: {
            jobSeekerProfileId: jobSeekerProfile.userUid,
            status: 'saved'
          }
        })
      }
    ]

    // Combine default and custom collections
    const allCollections = [
      ...defaultCollections,
      ...collections.map(collection => ({
        id: collection.id,
        name: collection.name,
        description: collection.description,
        color: collection.color,
        isDefault: false,
        jobCount: collection._count.savedJobs
      }))
    ]

    return NextResponse.json({
      success: true,
      data: allCollections
    })

  } catch (error) {
    console.error('Error fetching collections:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch collections' },
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
    const { name, description, color } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Collection name is required' },
        { status: 400 }
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

    // Create new collection
    const newCollection = await db.savedJobCollection.create({
      data: {
        jobSeekerProfileId: jobSeekerProfile.userUid,
        name: name.trim(),
        description: description?.trim() || '',
        color: color || '#6b7280'
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: newCollection.id,
        name: newCollection.name,
        description: newCollection.description,
        color: newCollection.color,
        isDefault: false,
        jobCount: 0,
        createdAt: newCollection.createdAt
      },
      message: 'Collection created successfully'
    })

  } catch (error) {
    console.error('Error creating collection:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create collection' },
      { status: 500 }
    )
  }
}