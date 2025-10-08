import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { format, jobIds } = body

    if (!format || !['csv', 'json'].includes(format)) {
      return NextResponse.json(
        { success: false, error: 'Invalid format. Supported formats: csv, json' },
        { status: 400 }
      )
    }

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

    // Build query for specific jobs or all saved jobs
    const whereClause: any = {
      jobSeekerProfileId: jobSeekerProfile.userUid
    }

    if (jobIds && Array.isArray(jobIds) && jobIds.length > 0) {
      whereClause.jobId = { in: jobIds }
    }

    const savedJobs = await db.savedJob.findMany({
      where: whereClause,
      include: {
        job: {
          select: {
            jobId: true,
            title: true,
            company: {
              select: {
                name: true
              }
            },
            city: true,
            province: true,
            salaryMin: true,
            salaryMax: true,
            salaryCurrency: true,
            positionType: true,
            remotePolicy: true,
            description: true,
            requirements: true,
            benefits: true,
            createdAt: true
          }
        }
      },
      orderBy: { savedAt: 'desc' }
    })

    const transformedSavedJobs = savedJobs.map(savedJob => ({
      id: savedJob.job.jobId,
      title: savedJob.job.title,
      company: savedJob.job.company.name,
      location: `${savedJob.job.city}, ${savedJob.job.province}`.trim(),
      salaryMin: savedJob.job.salaryMin,
      salaryMax: savedJob.job.salaryMax,
      currency: savedJob.job.salaryCurrency,
      positionType: savedJob.job.positionType,
      remotePolicy: savedJob.job.remotePolicy,
      description: savedJob.job.description,
      requirements: savedJob.job.requirements,
      benefits: savedJob.job.benefits,
      postedAt: savedJob.job.createdAt?.toISOString(),
      savedAt: savedJob.savedAt.toISOString(),
      notes: savedJob.notes,
      status: savedJob.status || 'saved'
    }))

    if (format === 'csv') {
      // Generate CSV content
      const headers = [
        'Job Title',
        'Company',
        'Location',
        'Salary Min',
        'Salary Max',
        'Currency',
        'Position Type',
        'Remote Policy',
        'Status',
        'Notes',
        'Saved Date',
        'Posted Date'
      ]

      const csvRows = [
        headers.join(','),
        ...transformedSavedJobs.map(job => [
          `"${job.title.replace(/"/g, '""')}"`,
          `"${job.company.replace(/"/g, '""')}"`,
          `"${job.location.replace(/"/g, '""')}"`,
          job.salaryMin || '',
          job.salaryMax || '',
          job.currency || '',
          `"${job.positionType || ''}"`,
          `"${job.remotePolicy || ''}"`,
          `"${job.status}"`,
          `"${(job.notes || '').replace(/"/g, '""')}"`,
          `"${new Date(job.savedAt).toLocaleDateString()}"`,
          `"${job.postedAt ? new Date(job.postedAt).toLocaleDateString() : ''}"`
        ].join(','))
      ]

      const csvContent = csvRows.join('\n')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="saved-jobs-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    } else if (format === 'json') {
      // Return JSON format
      return NextResponse.json({
        success: true,
        data: transformedSavedJobs,
        exportedAt: new Date().toISOString(),
        totalJobs: transformedSavedJobs.length
      })
    }

  } catch (error) {
    console.error('Error exporting saved jobs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to export saved jobs' },
      { status: 500 }
    )
  }
}