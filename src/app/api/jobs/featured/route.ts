import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '6')

    const jobs = await db.job.findMany({
      where: { 
        status: 'active',
        isFeatured: true 
      },
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
        }
      },
      orderBy: [
        { isUrgent: 'desc' },
        { postedAt: 'desc' }
      ],
      take: limit
    })

    const transformedJobs = jobs.map(job => ({
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
      experienceLevel: job.experienceLevel,
      requiredSkills: job.requiredSkills,
      preferredSkills: job.preferredSkills,
      applicationCount: job.applicationCount,
      viewCount: job.viewCount,
      matchScore: job.matchScore
    }))

    return NextResponse.json({
      success: true,
      data: transformedJobs
    })

  } catch (error) {
    console.error('Error fetching featured jobs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch featured jobs' },
      { status: 500 }
    )
  }
}