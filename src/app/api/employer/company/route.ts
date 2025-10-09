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

    if (session.user.role !==  UserRole.EMPLOYER) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get employer profile
    const employerProfile = await db.employerProfile.findUnique({
      where: { userUid: session.user.id },
      include: {
        company: true
      }
    })

    if (!employerProfile || !employerProfile.company) {
      return NextResponse.json({
        success: false,
        error: 'Company profile not found'
      }, { status: 404 })
    }

    const company = employerProfile.company

    return NextResponse.json({
      success: true,
      data: {
        companyId: company.companyId,
        name: company.name,
        description: company.description,
        logoUrl: company.logoUrl,
        isVerified: company.isVerified,
        verificationStatus: company.verificationStatus,
        employeeCount: company.employeeCount,
        foundedYear: company.foundedYear
      }
    })

  } catch (error) {
    console.error('Error fetching company:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch company' },
      { status: 500 }
    )
  }
}