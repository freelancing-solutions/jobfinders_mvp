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

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '6')

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

    // Get jobs that match the user's profile
    // This is a simplified matching algorithm - in production, this would be more sophisticated
    const whereClause: any = {
      status: 'active'
    }

    // Filter by experience level if available
    if (jobSeekerProfile.experienceYears) {
      const experienceMap: Record<number, string> = {
        0: 'entry',
        2: 'junior', 
        5: 'mid',
        8: 'senior',
        12: 'lead',
        15: 'executive'
      }
      
      let targetLevel = 'entry'
      for (const [years, level] of Object.entries(experienceMap)) {
        if (jobSeekerProfile.experienceYears >= parseInt(years)) {
          targetLevel = level
        }
      }
      whereClause.experienceLevel = targetLevel
    }

    // Filter by location if available
    if (jobSeekerProfile.location) {
      whereClause.OR = [
        { city: { contains: jobSeekerProfile.location, mode: 'insensitive' } },
        { province: { contains: jobSeekerProfile.location, mode: 'insensitive' } },
        { remotePolicy: 'remote' }
      ]
    }

    // Filter by remote work preference
    if (jobSeekerProfile.remoteWorkPreference === true) {
      whereClause.remotePolicy = { in: ['remote', 'hybrid'] }
    }

    // Get recommended jobs
    const jobs = await db.job.findMany({
      where: whereClause,
      include: {
        company: {
          select: {
            companyId: true,
            name: true,
            logoUrl: true,
            isVerified: true
          }
        }
      },
      orderBy: [
        { isFeatured: 'desc' },
        { postedAt: 'desc' }
      ],
      take: limit
    })

    // Calculate match scores for each job
    const jobsWithScores = jobs.map(job => {
      let matchScore = 50 // Base score

      // Experience matching (30 points)
      if (job.experienceLevel && jobSeekerProfile.experienceYears) {
        const experienceMap: Record<string, number> = {
          'entry': 0,
          'junior': 2,
          'mid': 5,
          'senior': 8,
          'lead': 10,
          'executive': 15
        }
        
        const requiredExperience = experienceMap[job.experienceLevel] || 0
        const userExperience = jobSeekerProfile.experienceYears || 0
        
        if (userExperience >= requiredExperience) {
          matchScore += 30
        } else if (userExperience >= requiredExperience * 0.7) {
          matchScore += 20
        } else if (userExperience >= requiredExperience * 0.5) {
          matchScore += 10
        }
      }

      // Skills matching (20 points)
      if (job.requiredSkills && jobSeekerProfile.skills) {
        const requiredSkills = Array.isArray(job.requiredSkills) ? job.requiredSkills : []
        const userSkills = Array.isArray(jobSeekerProfile.skills) ? jobSeekerProfile.skills : []
        
        const matchingSkills = requiredSkills.filter(skill => 
          userSkills.some(userSkill => 
            userSkill.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(userSkill.toLowerCase())
          )
        )
        
        const skillMatchRatio = matchingSkills.length / Math.max(requiredSkills.length, 1)
        matchScore += Math.min(20, skillMatchRatio * 20)
      }

      // Location matching (20 points)
      if (job.remotePolicy === 'remote') {
        matchScore += 20
      } else if (job.city && jobSeekerProfile.location) {
        if (job.city.toLowerCase().includes(jobSeekerProfile.location.toLowerCase()) ||
            jobSeekerProfile.location.toLowerCase().includes(job.city.toLowerCase())) {
          matchScore += 20
        }
      }

      // Salary matching (10 points)
      if (job.salaryMin && job.salaryMax && 
          jobSeekerProfile.salaryExpectationMin && jobSeekerProfile.salaryExpectationMax) {
        const userMin = jobSeekerProfile.salaryExpectationMin
        const userMax = jobSeekerProfile.salaryExpectationMax
        const jobMin = job.salaryMin
        const jobMax = job.salaryMax
        
        if (userMin <= jobMax && userMax >= jobMin) {
          matchScore += 10
        }
      }

      return {
        ...job,
        matchScore: Math.min(100, Math.round(matchScore))
      }
    })

    // Sort by match score and transform data
    const sortedJobs = jobsWithScores
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
      .map(job => ({
        id: job.jobId,
        title: job.title,
        company: job.company.name,
        location: `${job.city}, ${job.province}`.trim(),
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        currency: job.salaryCurrency,
        positionType: job.positionType,
        remotePolicy: job.remotePolicy,
        description: job.description,
        postedAt: job.postedAt.toISOString(),
        isFeatured: job.isFeatured,
        isUrgent: job.isUrgent,
        companyLogo: job.company.logoUrl,
        matchScore: job.matchScore
      }))

    return NextResponse.json({
      success: true,
      data: sortedJobs
    })

  } catch (error) {
    console.error('Error fetching recommended jobs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recommended jobs' },
      { status: 500 }
    )
  }
}