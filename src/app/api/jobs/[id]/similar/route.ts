import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { apiHandler, APIError } from '@/lib/api-handler'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return apiHandler(request, async (req) => {
    const { searchParams } = new URL(req.url)
    const { id } = params
    const limit = Math.min(parseInt(searchParams.get('limit') || '5'), 10)

    if (!id) {
      throw new APIError('Job ID is required', 400)
    }

    // First get the original job to find similar ones
    const originalJob = await db.job.findFirst({
      where: {
        jobId: id,
        status: 'PUBLISHED',
        expiresAt: {
          gt: new Date()
        }
      },
      select: {
        title: true,
        categoryId: true,
        location: true,
        employmentType: true,
        experienceLevel: true,
        isRemote: true,
        salary: true
      }
    })

    if (!originalJob) {
      throw new APIError('Job not found', 404)
    }

    // Build similarity criteria
    const similarityCriteria: any[] = []

    // Same category
    if (originalJob.categoryId) {
      similarityCriteria.push({ categoryId: originalJob.categoryId })
    }

    // Same location
    if (originalJob.location) {
      similarityCriteria.push({ location: { contains: originalJob.location, mode: 'insensitive' } })
    }

    // Same employment type
    if (originalJob.employmentType) {
      similarityCriteria.push({ employmentType: originalJob.employmentType })
    }

    // Same experience level
    if (originalJob.experienceLevel) {
      similarityCriteria.push({ experienceLevel: originalJob.experienceLevel })
    }

    // Same remote status
    similarityCriteria.push({ isRemote: originalJob.isRemote })

    // Build where clause with OR conditions for similarity
    let whereClause: any = {
      jobId: { not: id }, // Exclude the original job
      status: 'PUBLISHED',
      expiresAt: {
        gt: new Date()
      },
      OR: similarityCriteria.length > 0 ? similarityCriteria : [
        // Fallback: just get recent jobs if no similarity criteria
        { updatedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } // Last 30 days
      ]
    }

    // Add title similarity as a bonus
    if (originalJob.title) {
      const titleWords = originalJob.title.split(' ').filter(word => word.length > 3)
      if (titleWords.length > 0) {
        whereClause.OR.push({
          OR: titleWords.map(word => ({
            title: { contains: word, mode: 'insensitive' }
          }))
        })
      }
    }

    const similarJobs = await db.job.findMany({
      where: whereClause,
      include: {
        company: {
          select: {
            companyId: true,
            name: true,
            logoUrl: true,
            isVerified: true
          }
        },
        category: {
          select: {
            categoryId: true,
            name: true,
            icon: true,
            color: true
          }
        },
        employer: {
          select: {
            employerId: true,
            fullName: true
          }
        }
      },
      orderBy: [
        { featured: 'desc' },
        { applicantCount: 'desc' },
        { updatedAt: 'desc' }
      ],
      take: limit
    })

    // Transform the data
    const transformedJobs = similarJobs.map(job => {
      const salaryData = job.salary as { min: number; max: number; currency: string } | null
      
      return {
        id: job.jobId,
        title: job.title,
        company: {
          id: job.company.companyId,
          name: job.company.name,
          logo: job.company.logoUrl,
          isVerified: job.company.isVerified
        },
        category: job.category ? {
          id: job.category.categoryId,
          name: job.category.name,
          icon: job.category.icon,
          color: job.category.color
        } : null,
        location: job.location || '',
        salary: salaryData ? {
          min: salaryData.min,
          max: salaryData.max,
          currency: salaryData.currency
        } : null,
        type: job.employmentType as any,
        category: job.category?.name || '',
        experience: job.experienceLevel as any,
        remote: job.isRemote,
        featured: job.featured || false,
        verified: job.company.isVerified,
        createdAt: job.createdAt.toISOString(),
        updatedAt: job.updatedAt.toISOString(),
        expiresAt: job.expiresAt?.toISOString(),
        applicationCount: job.applicantCount || 0,
        viewCount: job.viewCount || 0,
        companyLogo: job.company.logoUrl,
        description: job.description,
        requirements: job.requirements as {
          essential: string[];
          preferred: string[];
        },
        employer: {
          id: job.employer.employerId,
          name: job.employer.fullName
        },
        tags: [],
        benefits: job.benefits as string[] || []
      }
    })

    return NextResponse.json({
      jobs: transformedJobs
    })
  })
}