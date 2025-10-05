import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(
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

    const jobId = params.id
    const body = await request.json()
    const { coverLetter, resumeId } = body

    // Verify the job exists and is active
    const job = await db.job.findUnique({
      where: { jobId, status: 'active' }
    })

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found or no longer active' },
        { status: 404 }
      )
    }

    // Get the user's job seeker profile
    const jobSeekerProfile = await db.jobSeekerProfile.findUnique({
      where: { userUid: session.user.id }
    })

    if (!jobSeekerProfile) {
      return NextResponse.json(
        { success: false, error: 'Job seeker profile not found' },
        { status: 404 }
      )
    }

    // Check if user has already applied to this job
    const existingApplication = await db.jobApplication.findFirst({
      where: {
        jobId,
        jobSeekerProfileId: jobSeekerProfile.userUid
      }
    })

    if (existingApplication) {
      return NextResponse.json(
        { success: false, error: 'You have already applied to this job' },
        { status: 400 }
      )
    }

    // If resumeId is provided, verify it belongs to the user
    if (resumeId) {
      const resume = await db.resume.findFirst({
        where: {
          resumeId,
          userUid: session.user.id
        }
      })

      if (!resume) {
        return NextResponse.json(
          { success: false, error: 'Resume not found or access denied' },
          { status: 404 }
        )
      }
    }

    // Calculate match score (simplified version - in real app this would use AI)
    const matchScore = await calculateMatchScore(job, jobSeekerProfile)

    // Create the application
    const application = await db.jobApplication.create({
      data: {
        jobId,
        jobSeekerProfileId: jobSeekerProfile.userUid,
        resumeId,
        coverLetter,
        status: 'applied',
        matchScore
      },
      include: {
        job: {
          select: {
            title: true,
            company: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    // Update job application count
    await db.job.update({
      where: { jobId },
      data: { applicationCount: { increment: 1 } }
    })

    return NextResponse.json({
      success: true,
      data: {
        applicationId: application.applicationId,
        status: application.status,
        matchScore: application.matchScore,
        appliedAt: application.appliedAt,
        jobTitle: application.job.title,
        companyName: application.job.company.name
      },
      message: 'Application submitted successfully'
    })

  } catch (error) {
    console.error('Error submitting job application:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to submit application' },
      { status: 500 }
    )
  }
}

// Helper function to calculate match score
async function calculateMatchScore(job: any, profile: any): Promise<number> {
  let score = 0
  let maxScore = 100

  // Experience matching (30 points)
  if (job.experienceLevel && profile.experienceYears) {
    const experienceMap: Record<string, number> = {
      'entry': 0,
      'junior': 2,
      'mid': 5,
      'senior': 8,
      'lead': 10,
      'executive': 15
    }
    
    const requiredExperience = experienceMap[job.experienceLevel] || 0
    const userExperience = profile.experienceYears || 0
    
    if (userExperience >= requiredExperience) {
      score += 30
    } else if (userExperience >= requiredExperience * 0.7) {
      score += 20
    } else if (userExperience >= requiredExperience * 0.5) {
      score += 10
    }
  }

  // Skills matching (40 points)
  if (job.requiredSkills && profile.skills) {
    const requiredSkills = Array.isArray(job.requiredSkills) ? job.requiredSkills : []
    const userSkills = Array.isArray(profile.skills) ? profile.skills : []
    
    const matchingSkills = requiredSkills.filter(skill => 
      userSkills.some(userSkill => 
        userSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(userSkill.toLowerCase())
      )
    )
    
    const skillMatchRatio = matchingSkills.length / Math.max(requiredSkills.length, 1)
    score += Math.min(40, skillMatchRatio * 40)
  }

  // Location matching (20 points)
  if (job.remotePolicy === 'remote') {
    score += 20 // Remote jobs get full location points
  } else if (job.city && profile.location) {
    if (job.city.toLowerCase().includes(profile.location.toLowerCase()) ||
        profile.location.toLowerCase().includes(job.city.toLowerCase())) {
      score += 20
    }
  }

  // Salary expectations (10 points)
  if (job.salaryMin && job.salaryMax && profile.salaryExpectationMin && profile.salaryExpectationMax) {
    const userMin = profile.salaryExpectationMin
    const userMax = profile.salaryExpectationMax
    const jobMin = job.salaryMin
    const jobMax = job.salaryMax
    
    if (userMin <= jobMax && userMax >= jobMin) {
      score += 10 // Salary ranges overlap
    }
  }

  return Math.round(score)
}