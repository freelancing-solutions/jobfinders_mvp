import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { UserRole } from '@/types/roles'

/**
 * GET /api/user/me
 * Returns complete user data for the authenticated user
 * Used by useCurrentUser hook for consistent user data across components
 */
export async function GET(request: NextRequest) {
  try {
    // Get the current session
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Fetch complete user data from database
    const user = await db.user.findUnique({
      where: { 
        email: session.user.email 
      },
      select: {
        uid: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        // Include related profile data based on role
        jobSeekerProfile: {
          select: {
            userUid: true,
            professionalTitle: true,
            location: true,
            phone: true,
            experienceYears: true,
            availability: true,
            remoteWorkPreference: true,
            salaryExpectationMin: true,
            salaryExpectationMax: true,
            currency: true
          }
        },
        employerProfile: {
          select: {
            employerId: true,
            fullName: true,
            jobTitle: true,
            companyId: true,
            phoneNumber: true,
            linkedinUrl: true,
            bio: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Format response based on user role
    const responseData = {
      id: user.uid,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      // Include profile data if available
      ...(user.role === UserRole.JOB_SEEKER && user.jobSeekerProfile && {
        profile: {
          type: 'jobSeeker',
          professionalTitle: user.jobSeekerProfile.professionalTitle,
          location: user.jobSeekerProfile.location,
          phone: user.jobSeekerProfile.phone,
          experienceYears: user.jobSeekerProfile.experienceYears,
          availability: user.jobSeekerProfile.availability,
          remoteWorkPreference: user.jobSeekerProfile.remoteWorkPreference,
          salaryExpectationMin: user.jobSeekerProfile.salaryExpectationMin,
          salaryExpectationMax: user.jobSeekerProfile.salaryExpectationMax,
          currency: user.jobSeekerProfile.currency
        }
      }),
      ...(user.role === UserRole.EMPLOYER && user.employerProfile && {
        profile: {
          type: UserRole.EMPLOYER,
          fullName: user.employerProfile.fullName,
          jobTitle: user.employerProfile.jobTitle,
          companyId: user.employerProfile.companyId,
          phoneNumber: user.employerProfile.phoneNumber,
          linkedinUrl: user.employerProfile.linkedinUrl,
          bio: user.employerProfile.bio
        }
      })
    }

    return NextResponse.json(responseData, { status: 200 })

  } catch (error) {
    console.error('Error fetching user data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}