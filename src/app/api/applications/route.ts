import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { db } from '@/lib/db'
import { apiHandler, APIError } from '@/lib/api-handler'
import { ApplicationStatus } from '@prisma/client'
import { logger } from '@/lib/logging/logger'
import { UserRole } from '@/types/roles'

export async function POST(request: NextRequest) {
  return apiHandler(request, async (req) => {
    const contentType = req.headers.get('content-type') || ''
    
    let formData: FormData
    let data: any = {}

    if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
      formData = await req.formData()
      
      // Extract form data
      const jobId = formData.get('jobId') as string
      const jobTitle = formData.get('jobTitle') as string
      const companyName = formData.get('companyName') as string
      const fullName = formData.get('fullName') as string
      const email = formData.get('email') as string
      const phone = formData.get('phone') as string
      const location = formData.get('location') as string
      const currentTitle = formData.get('currentTitle') as string
      const currentCompany = formData.get('currentCompany') as string
      const experience = formData.get('experience') as string
      const linkedin = formData.get('linkedin') as string
      const github = formData.get('github') as string
      const portfolio = formData.get('portfolio') as string
      const coverLetter = formData.get('coverLetter') as string
      const salaryExpectation = formData.get('salaryExpectation') as string
      const availability = formData.get('availability') as string
      const noticePeriod = formData.get('noticePeriod') as string
      const howDidYouHear = formData.get('howDidYouHear') as string
      const additionalInfo = formData.get('additionalInfo') as string
      const resumeUrl = formData.get('resumeUrl') as string
      const resumeFile = formData.get('resume') as File | null

      data = {
        jobId, jobTitle, companyName, fullName, email, phone, location,
        currentTitle, currentCompany, experience, linkedin, github, portfolio,
        coverLetter, salaryExpectation, availability, noticePeriod,
        howDidYouHear, additionalInfo, resumeUrl, resumeFile
      }
    } else {
      // Handle JSON data
      const jsonData = await req.json()
      data = jsonData
    }
    
    const {
      jobId,
      fullName,
      email,
      phone,
      location,
      currentTitle,
      currentCompany,
      experience,
      linkedin,
      github,
      portfolio,
      coverLetter,
      salaryExpectation,
      availability,
      noticePeriod,
      howDidYouHear,
      additionalInfo,
      resumeUrl,
      resumeFile
    } = data

    // Validate required fields
    if (!jobId || !fullName || !email || !phone || !location || !currentTitle || !experience || !coverLetter || !availability) {
      throw new APIError('Missing required fields', 400)
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new APIError('Invalid email format', 400)
    }

    // Check if job exists and is published
    const job = await db.job.findFirst({
      where: {
        jobId: jobId,
        status: 'PUBLISHED',
        expiresAt: {
          gt: new Date()
        }
      }
    })

    if (!job) {
      throw new APIError('Job not found or no longer accepting applications', 404)
    }

    // Check if user has already applied for this job
    const existingApplication = await db.jobApplication.findFirst({
      where: {
        jobId: job.jobId,
        jobSeekerProfile: {
          user: {
            email: email
          }
        }
      }
    })

    if (existingApplication) {
      throw new APIError('You have already applied for this position', 409)
    }

    // Find or create job seeker profile
    let jobSeekerProfile = await db.jobSeekerProfile.findFirst({
      where: {
        user: {
          email: email
        }
      },
      include: {
        user: true
      }
    })

    if (!jobSeekerProfile) {
      // Create a new user and job seeker profile
      const newUser = await db.user.create({
        data: {
          email: email,
          name: fullName,
          role: UserRole.JOB_SEEKER,
          isActive: true
        }
      })

      jobSeekerProfile = await db.jobSeekerProfile.create({
        data: {
          userUid: newUser.uid,
          professionalTitle: currentTitle,
          location: location,
          phone: phone,
          linkedin: linkedin || undefined,
          github: github || undefined,
          portfolioLinks: portfolio ? [portfolio] : undefined,
          experienceYears: experience === 'entry' ? 1 : 
                          experience === 'junior' ? 3 : 
                          experience === 'mid' ? 5 : 
                          experience === 'senior' ? 8 : 10,
          availability: availability
        },
        include: {
          user: true
        }
      })
    } else {
      // Update existing profile with new information
      await db.jobSeekerProfile.update({
        where: {
          userUid: jobSeekerProfile.userUid
        },
        data: {
          professionalTitle: currentTitle,
          location: location,
          phone: phone,
          linkedin: linkedin || undefined,
          github: github || undefined,
          portfolioLinks: portfolio ? [portfolio] : undefined,
          experienceYears: experience === 'entry' ? 1 : 
                          experience === 'junior' ? 3 : 
                          experience === 'mid' ? 5 : 
                          experience === 'senior' ? 8 : 10,
          availability: availability
        }
      })
    }

    // Handle resume file upload
    let resumeFileUrl = resumeUrl
    if (resumeFile) {
      // For now, we'll simulate file upload
      // In a real application, you would upload to a cloud storage service
      const timestamp = Date.now()
      const fileName = `resume_${jobSeekerProfile.userUid}_${timestamp}.${resumeFile.name.split('.').pop()}`
      resumeFileUrl = `/uploads/resumes/${fileName}`
      
      // Here you would actually upload the file to your storage service
      // For demo purposes, we'll just use the placeholder URL
      console.log('Resume file uploaded:', resumeFile.name, '->', resumeFileUrl)
    }

    // Create the application
    const application = await db.jobApplication.create({
      data: {
        jobId: job.jobId,
        jobSeekerProfileId: jobSeekerProfile.userUid,
        coverLetter: coverLetter,
        status: ApplicationStatus.APPLIED,
        matchScore: 0, // Will be calculated later
        notes: `Current Company: ${currentCompany || 'Not specified'}
Salary Expectation: ${salaryExpectation || 'Not specified'}
How did you hear about us: ${howDidYouHear || 'Not specified'}
Additional Info: ${additionalInfo || 'None'}
LinkedIn: ${linkedin || 'Not provided'}
GitHub: ${github || 'Not provided'}
Portfolio: ${portfolio || 'Not provided'}
Resume URL: ${resumeUrl || 'Not provided'}
Resume File: ${resumeFileUrl || 'Not uploaded'}`,
        appliedAt: new Date(),
        lastStatusUpdate: new Date()
      },
      include: {
        job: {
          include: {
            company: true,
            employer: true
          }
        },
        jobSeekerProfile: {
          include: {
            user: true
          }
        }
      }
    })

    // Update job applicant count
    await db.job.update({
      where: { jobId: job.jobId },
      data: {
        applicantCount: {
          increment: 1
        }
      }
    })

    // TODO: Send confirmation email to applicant
    // TODO: Send notification to employer
    // TODO: Calculate match score using AI

    return NextResponse.json({
      success: true,
      data: {
        applicationId: application.applicationId,
        jobTitle: job.title,
        companyName: job.company?.name,
        appliedAt: application.appliedAt,
        status: application.status
      },
      message: 'Application submitted successfully!'
    })
  })
}

export async function GET(request: NextRequest) {
  return apiHandler(request, async (req) => {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      throw new APIError('Authentication required', 401)
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status')?.split(',').filter(Boolean) || []
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const companies = searchParams.get('companies')?.split(',').filter(Boolean) || []
    const locations = searchParams.get('locations')?.split(',').filter(Boolean) || []
    const positionTypes = searchParams.get('positionTypes')?.split(',').filter(Boolean) || []
    const salaryRanges = searchParams.get('salaryRanges')?.split(',').filter(Boolean) || []
    const remotePolicies = searchParams.get('remotePolicies')?.split(',').filter(Boolean) || []
    const hasMatchScore = searchParams.get('hasMatchScore')
    const archived = searchParams.get('archived') === 'true'
    const sortBy = searchParams.get('sortBy') || 'appliedAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const exportFormat = searchParams.get('format')

    // Check if this is an export request
    if (exportFormat) {
      return await handleExportApplications(
        session.user.id,
        exportFormat as 'csv' | 'json',
        { search, status, startDate, endDate, companies, locations, archived }
      )
    }

    // Build where clause
    const where: any = {
      jobSeekerProfile: {
        userUid: session.user.id
      }
    }

    // Add filters
    if (search) {
      where.OR = [
        {
          job: {
            title: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          job: {
            company: {
              name: {
                contains: search,
                mode: 'insensitive'
              }
            }
          }
        }
      ]
    }

    if (status.length > 0) {
      where.status = {
        in: status
      }
    }

    if (startDate || endDate) {
      where.appliedAt = {}
      if (startDate) {
        where.appliedAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.appliedAt.lte = new Date(endDate)
      }
    }

    if (companies.length > 0) {
      where.job = {
        ...where.job,
        company: {
          name: {
            in: companies
          }
        }
      }
    }

    if (locations.length > 0) {
      where.job = {
        ...where.job,
        location: {
          in: locations
        }
      }
    }

    if (positionTypes.length > 0) {
      where.job = {
        ...where.job,
        positionType: {
          in: positionTypes
        }
      }
    }

    if (hasMatchScore !== null) {
      if (hasMatchScore === 'true') {
        where.matchScore = {
          not: null
        }
      } else {
        where.matchScore = null
      }
    }

    // Add archived filter
    if (archived) {
      where.status = 'ARCHIVED'
    } else {
      if (where.status) {
        // If already filtering by status, add ARCHIVED to exclusion
        if (Array.isArray(where.status.in)) {
          where.status.in.push('ARCHIVED')
        }
      } else {
        where.status = {
          not: 'ARCHIVED'
        }
      }
    }

    // Build order by clause
    const orderBy: any = {}
    if (sortBy === 'appliedAt') {
      orderBy.appliedAt = sortOrder
    } else if (sortBy === 'updatedAt') {
      orderBy.lastStatusUpdate = sortOrder
    } else if (sortBy === 'job.title') {
      orderBy.job = {
        title: sortOrder
      }
    } else if (sortBy === 'job.company.name') {
      orderBy.job = {
        company: {
          name: sortOrder
        }
      }
    } else if (sortBy === 'matchScore') {
      orderBy.matchScore = sortOrder
    } else {
      orderBy.appliedAt = sortOrder
    }

    // Get total count
    const total = await db.jobApplication.count({ where })

    // Calculate pagination
    const skip = (page - 1) * limit
    const totalPages = Math.ceil(total / limit)

    // Fetch applications
    const applications = await db.jobApplication.findMany({
      where,
      include: {
        job: {
          include: {
            company: true,
            employer: true
          }
        },
        jobSeekerProfile: {
          include: {
            user: true
          }
        }
      },
      orderBy,
      skip,
      take: limit
    })

    // Format applications for frontend
    const formattedApplications = applications.map(app => ({
      id: app.applicationId,
      jobId: app.job.jobId,
      userId: app.jobSeekerProfile.userUid,
      status: mapPrismaStatusToFrontend(app.status),
      appliedAt: app.appliedAt.toISOString(),
      updatedAt: app.lastStatusUpdate.toISOString(),
      job: {
        id: app.job.jobId,
        title: app.job.title,
        company: {
          id: app.job.company?.companyId || '',
          name: app.job.company?.name || '',
          logo: app.job.company?.logo || '',
          location: app.job.company?.location || ''
        },
        location: app.job.location,
        salaryMin: app.job.salaryMin,
        salaryMax: app.job.salaryMax,
        currency: app.job.currency || 'USD',
        positionType: app.job.positionType,
        remotePolicy: app.job.remotePolicy,
        description: app.job.description || '',
        requirements: app.job.requirements || [],
        isFeatured: app.job.isFeatured || false,
        isUrgent: app.job.isUrgent || false,
        postedAt: app.job.postedAt.toISOString(),
        expiresAt: app.job.expiresAt?.toISOString(),
        applicationCount: app.job.applicantCount || 0
      },
      resume: app.resumeFileUrl ? {
        id: app.applicationId,
        title: 'Resume',
        fileUrl: app.resumeFileUrl
      } : undefined,
      coverLetter: app.coverLetter,
      notes: app.notes,
      matchScore: app.matchScore,
      viewCount: 0, // TODO: Implement view tracking
      timeline: [] // TODO: Implement timeline tracking
    }))

    return NextResponse.json({
      success: true,
      data: formattedApplications,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })
  })
}

// Helper function to map Prisma status to frontend status
function mapPrismaStatusToFrontend(status: ApplicationStatus): string {
  const statusMap = {
    'APPLIED': 'applied',
    'REVIEWING': 'reviewing',
    'SHORTLISTED': 'shortlisted',
    'INTERVIEW_SCHEDULED': 'interview_scheduled',
    'INTERVIEW_COMPLETED': 'interview_completed',
    'OFFERED': 'offered',
    'REJECTED': 'rejected',
    'WITHDRAWN': 'withdrawn',
    'HIRED': 'hired',
    'ARCHIVED': 'archived'
  }
  return statusMap[status] || status.toLowerCase()
}

// Helper function to handle exports
async function handleExportApplications(
  userId: string,
  format: 'csv' | 'json',
  filters: any
) {
  const where: any = {
    jobSeekerProfile: {
      userUid: userId
    }
  }

  // Apply same filters as GET method
  if (filters.search) {
    where.OR = [
      {
        job: {
          title: {
            contains: filters.search,
            mode: 'insensitive'
          }
        }
      },
      {
        job: {
          company: {
            name: {
              contains: filters.search,
              mode: 'insensitive'
            }
          }
        }
      }
    ]
  }

  // ... (apply other filters similar to GET method)

  const applications = await db.jobApplication.findMany({
    where,
    include: {
      job: {
        include: {
          company: true
        }
      },
      jobSeekerProfile: {
        include: {
          user: true
        }
      }
    },
    orderBy: {
      appliedAt: 'desc'
    }
  })

  if (format === 'json') {
    return new NextResponse(JSON.stringify(applications, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="applications-${new Date().toISOString().split('T')[0]}.json"`
      }
    })
  } else if (format === 'csv') {
    // Generate CSV
    const headers = [
      'Application ID', 'Job Title', 'Company', 'Status', 'Applied Date',
      'Location', 'Position Type', 'Salary Range', 'Match Score'
    ]

    const csvContent = [
      headers.join(','),
      ...applications.map(app => [
        app.applicationId,
        `"${app.job.title}"`,
        `"${app.job.company?.name || ''}"`,
        app.status,
        app.appliedAt.toISOString(),
        `"${app.job.location}"`,
        app.job.positionType,
        `${app.job.salaryMin || ''}-${app.job.salaryMax || ''}`,
        app.matchScore || ''
      ].join(','))
    ].join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="applications-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  }

  throw new APIError('Unsupported export format', 400)
}