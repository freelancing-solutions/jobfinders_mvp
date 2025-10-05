import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = await db.user.findUnique({
      where: { email: session.user?.email as string },
      include: {
        jobSeekerProfile: true
      }
    })

    if (!user || !user.jobSeekerProfile) {
      return NextResponse.json(
        { error: 'Job seeker profile not found' },
        { status: 404 }
      )
    }

    const profile = user.jobSeekerProfile

    return NextResponse.json({
      professionalTitle: profile.professionalTitle || '',
      summary: profile.summary || '',
      skills: profile.skills || [],
      experienceYears: profile.experienceYears || 0,
      location: profile.location || '',
      phone: profile.phone || '',
      website: profile.website || '',
      linkedin: profile.linkedin || '',
      github: profile.github || '',
      portfolioLinks: profile.portfolioLinks || [],
      remoteWorkPreference: profile.remoteWorkPreference || false,
      salaryExpectationMin: profile.salaryExpectationMin || 0,
      salaryExpectationMax: profile.salaryExpectationMax || 0,
      currency: profile.currency || 'ZAR',
      availability: profile.availability || 'immediate'
    })

  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      professionalTitle,
      summary,
      skills,
      experienceYears,
      location,
      phone,
      website,
      linkedin,
      github,
      portfolioLinks,
      remoteWorkPreference,
      salaryExpectationMin,
      salaryExpectationMax,
      currency,
      availability
    } = body

    // Get user profile
    const user = await db.user.findUnique({
      where: { email: session.user?.email as string },
      include: {
        jobSeekerProfile: true
      }
    })

    if (!user || !user.jobSeekerProfile) {
      return NextResponse.json(
        { error: 'Job seeker profile not found' },
        { status: 404 }
      )
    }

    // Update profile
    const updatedProfile = await db.jobSeekerProfile.update({
      where: { userUid: user.uid },
      data: {
        professionalTitle,
        summary,
        skills,
        experienceYears: experienceYears ? parseInt(experienceYears.toString()) : 0,
        location,
        phone,
        website,
        linkedin,
        github,
        portfolioLinks,
        remoteWorkPreference,
        salaryExpectationMin: salaryExpectationMin ? parseFloat(salaryExpectationMin.toString()) : 0,
        salaryExpectationMax: salaryExpectationMax ? parseFloat(salaryExpectationMax.toString()) : 0,
        currency,
        availability
      }
    })

    return NextResponse.json({
      professionalTitle: updatedProfile.professionalTitle || '',
      summary: updatedProfile.summary || '',
      skills: updatedProfile.skills || [],
      experienceYears: updatedProfile.experienceYears || 0,
      location: updatedProfile.location || '',
      phone: updatedProfile.phone || '',
      website: updatedProfile.website || '',
      linkedin: updatedProfile.linkedin || '',
      github: updatedProfile.github || '',
      portfolioLinks: updatedProfile.portfolioLinks || [],
      remoteWorkPreference: updatedProfile.remoteWorkPreference || false,
      salaryExpectationMin: updatedProfile.salaryExpectationMin || 0,
      salaryExpectationMax: updatedProfile.salaryExpectationMax || 0,
      currency: updatedProfile.currency || 'ZAR',
      availability: updatedProfile.availability || 'immediate'
    })

  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}