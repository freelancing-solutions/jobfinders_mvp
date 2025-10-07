import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { apiHandler, APIError } from '@/lib/api-handler'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return apiHandler(request, async (req) => {
    const { id } = params

    if (!id) {
      throw new APIError('Job ID is required', 400)
    }

    // Fetch job with related data
    const job = await db.job.findFirst({
      where: {
        jobId: id,
        status: 'PUBLISHED',
        expiresAt: {
          gt: new Date() // Only show jobs that haven't expired
        }
      },
      include: {
        company: {
          select: {
            companyId: true,
            name: true,
            logoUrl: true,
            isVerified: true,
            description: true,
            website: true,
            city: true,
            province: true,
            country: true,
            employeeCount: true,
            foundedYear: true,
            industry: true
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
            fullName: true,
            jobTitle: true,
            profilePictureUrl: true,
            companyEmail: true,
            phoneNumber: true
          }
        }
      }
    })

    if (!job) {
      throw new APIError('Job not found', 404)
    }

    // Increment view count
    await db.job.update({
      where: { jobId: id },
      data: { applicantCount: { increment: 0 } } // We'll implement proper view tracking later
    })

    // Transform the data to match the frontend JobDisplay interface
    const salaryData = job.salary as { min: number; max: number; currency: string } | null
    const requirementsData = job.requirements as { essential: string[]; preferred: string[] } | null

    const transformedJob = {
      id: job.jobId,
      title: job.title,
      company: {
        id: job.company.companyId,
        name: job.company.name,
        logo: job.company.logoUrl || undefined,
        isVerified: job.company.isVerified
      },
      category: job.category ? {
        id: job.category.categoryId,
        name: job.category.name,
        icon: job.category.icon || undefined,
        color: job.category.color || undefined
      } : undefined,
      location: job.location || undefined,
      salary: salaryData ? {
        min: salaryData.min,
        max: salaryData.max,
        currency: salaryData.currency
      } : undefined,
      type: job.employmentType || undefined,
      experience: job.experienceLevel || undefined,
      remote: job.isRemote,
      verified: job.company.isVerified,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
      expiresAt: job.expiresAt?.toISOString(),
      applicationCount: job.applicantCount || 0,
      companyLogo: job.company.logoUrl || undefined,
      description: job.description,
      requirements: {
        essential: requirementsData?.essential || [],
        preferred: requirementsData?.preferred || []
      },
      employer: job.employer ? {
        id: job.employer.employerId,
        name: job.employer.fullName || 'Unknown'
      } : undefined,
      tags: [], // Could be implemented later based on job description parsing
      benefits: [] // Could be implemented later from a separate job benefits table
    }

    return NextResponse.json({
      success: true,
      data: transformedJob
    })
  })
}