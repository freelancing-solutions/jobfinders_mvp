import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { UserRole } from '@/types/roles'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (session.user.role !== UserRole.JOB_SEEKER) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    const profile = await db.jobSeekerProfile.findUnique({
      where: { userUid: session.user.id }
    })

    if (!profile) {
      return NextResponse.json({
        success: false,
        error: 'Profile not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: profile
    })

  } catch (error) {
    console.error('Error fetching job seeker profile:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (session.user.role !== UserRole.JOB_SEEKER) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // Check if profile exists, if not create it
    const existingProfile = await db.jobSeekerProfile.findUnique({
      where: { userUid: session.user.id }
    })

    let profile

    if (existingProfile) {
      // Update existing profile
      profile = await db.jobSeekerProfile.update({
        where: { userUid: session.user.id },
        data: {
          professionalTitle: body.professionalTitle,
          summary: body.summary,
          skills: body.skills,
          experienceYears: body.experienceYears,
          location: body.location,
          phone: body.phone,
          website: body.website,
          linkedin: body.linkedin,
          github: body.github,
          portfolioLinks: body.portfolioLinks,
          remoteWorkPreference: body.remoteWorkPreference,
          salaryExpectationMin: body.salaryExpectationMin,
          salaryExpectationMax: body.salaryExpectationMax,
          currency: body.currency,
          availability: body.availability,
          resumeFileUrl: body.resumeFileUrl
        }
      })
    } else {
      // Create new profile
      profile = await db.jobSeekerProfile.create({
        data: {
          userUid: session.user.id,
          professionalTitle: body.professionalTitle,
          summary: body.summary,
          skills: body.skills,
          experienceYears: body.experienceYears,
          location: body.location,
          phone: body.phone,
          website: body.website,
          linkedin: body.linkedin,
          github: body.github,
          portfolioLinks: body.portfolioLinks,
          remoteWorkPreference: body.remoteWorkPreference,
          salaryExpectationMin: body.salaryExpectationMin,
          salaryExpectationMax: body.salaryExpectationMax,
          currency: body.currency || 'ZAR',
          availability: body.availability,
          resumeFileUrl: body.resumeFileUrl
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: profile,
      message: 'Profile updated successfully'
    })

  } catch (error) {
    console.error('Error updating job seeker profile:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}