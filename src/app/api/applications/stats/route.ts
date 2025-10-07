import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { db } from '@/lib/db'
import { apiHandler, APIError } from '@/lib/api-handler'
import { ApplicationStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  return apiHandler(request, async (req) => {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      throw new APIError('Authentication required', 401)
    }

    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build base where clause
    const baseWhere: any = {
      jobSeekerProfile: {
        userUid: session.user.id
      }
    }

    // Add date filters
    if (startDate || endDate) {
      baseWhere.appliedAt = {}
      if (startDate) {
        baseWhere.appliedAt.gte = new Date(startDate)
      }
      if (endDate) {
        baseWhere.appliedAt.lte = new Date(endDate)
      }
    }

    // Get total applications count
    const totalApplications = await db.jobApplication.count({
      where: baseWhere
    })

    // Get active applications (not archived)
    const activeApplications = await db.jobApplication.count({
      where: {
        ...baseWhere,
        status: {
          not: ApplicationStatus.ARCHIVED
        }
      }
    })

    // Get archived applications
    const archivedApplications = await db.jobApplication.count({
      where: {
        ...baseWhere,
        status: ApplicationStatus.ARCHIVED
      }
    })

    // Get applications by status
    const applicationsByStatus = await db.jobApplication.groupBy({
      by: ['status'],
      where: baseWhere,
      _count: true
    })

    // Format status counts
    const statusCounts: Record<string, number> = {}
    applicationsByStatus.forEach(item => {
      statusCounts[item.status.toLowerCase()] = item._count
    })

    // Get applications by company
    const applicationsByCompany = await db.jobApplication.findMany({
      where: baseWhere,
      include: {
        job: {
          include: {
            company: true
          }
        }
      }
    })

    const companyStats = applicationsByCompany.reduce((acc: any, app) => {
      const companyName = app.job.company?.name || 'Unknown Company'
      if (!acc[companyName]) {
        acc[companyName] = {
          count: 0,
          offers: 0,
          rejections: 0,
          interviews: 0
        }
      }
      acc[companyName].count++
      if (app.status === ApplicationStatus.OFFERED || app.status === ApplicationStatus.HIRED) {
        acc[companyName].offers++
      }
      if (app.status === ApplicationStatus.REJECTED) {
        acc[companyName].rejections++
      }
      if (app.status === ApplicationStatus.INTERVIEW_SCHEDULED || app.status === ApplicationStatus.INTERVIEW_COMPLETED) {
        acc[companyName].interviews++
      }
      return acc
    }, {})

    // Format company stats with success rates
    const companyStatsFormatted = Object.entries(companyStats).map(([companyName, stats]: [string, any]) => ({
      companyName,
      count: stats.count,
      successRate: stats.count > 0 ? (stats.offers / stats.count) * 100 : 0
    })).sort((a, b) => b.count - a.count).slice(0, 10) // Top 10 companies

    // Get time period stats (by month)
    const timePeriodStats = await db.$queryRaw`
      SELECT
        DATE_TRUNC('month', "appliedAt") as period,
        COUNT(*) as applications,
        COUNT(CASE WHEN status = 'INTERVIEW_SCHEDULED' OR status = 'INTERVIEW_COMPLETED' THEN 1 END) as interviews,
        COUNT(CASE WHEN status = 'OFFERED' OR status = 'HIRED' THEN 1 END) as offers,
        COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) as rejections
      FROM "JobApplication"
      WHERE "jobSeekerProfileId" = ${session.user.id}
        ${startDate ? `AND "appliedAt" >= ${startDate}` : ''}
        ${endDate ? `AND "appliedAt" <= ${endDate}` : ''}
      GROUP BY DATE_TRUNC('month', "appliedAt")
      ORDER BY period DESC
      LIMIT 12
    ` as any[]

    // Format time period stats
    const timePeriodFormatted = timePeriodStats.map(item => ({
      period: item.period,
      applications: parseInt(item.applications),
      interviews: parseInt(item.interviews),
      offers: parseInt(item.offers),
      rejections: parseInt(item.rejections),
      successRate: parseInt(item.applications) > 0 ? (parseInt(item.offers) / parseInt(item.applications)) * 100 : 0
    }))

    // Calculate response metrics
    const totalInterviews = applicationsByStatus.find(item => item.status === ApplicationStatus.INTERVIEW_SCHEDULED)?._count || 0 +
                           applicationsByStatus.find(item => item.status === ApplicationStatus.INTERVIEW_COMPLETED)?._count || 0
    const totalOffers = applicationsByStatus.find(item => item.status === ApplicationStatus.OFFERED)?._count || 0 +
                        applicationsByStatus.find(item => item.status === ApplicationStatus.HIRED)?._count || 0
    const totalRejections = applicationsByStatus.find(item => item.status === ApplicationStatus.REJECTED)?._count || 0

    const responseMetrics = {
      averageResponseTime: 0, // TODO: Calculate from timeline data
      responseRate: totalApplications > 0 ? ((totalInterviews + totalOffers + totalRejections) / totalApplications) * 100 : 0,
      interviewRate: totalApplications > 0 ? (totalInterviews / totalApplications) * 100 : 0,
      offerRate: totalApplications > 0 ? (totalOffers / totalApplications) * 100 : 0
    }

    // Get skills from job requirements
    const applicationsWithSkills = await db.jobApplication.findMany({
      where: baseWhere,
      include: {
        job: true
      }
    })

    const allSkills = applicationsWithSkills.flatMap(app => app.job.skills || [])
    const skillStats = allSkills.reduce((acc: any, skill) => {
      if (!acc[skill]) {
        acc[skill] = { count: 0, success: 0 }
      }
      acc[skill].count++
      if (app.status === ApplicationStatus.OFFERED || app.status === ApplicationStatus.HIRED) {
        acc[skill].success++
      }
      return acc
    }, {})

    // Format top skills
    const topSkills = Object.entries(skillStats)
      .map(([skill, stats]: [string, any]) => ({
        skill,
        count: stats.count,
        successRate: stats.count > 0 ? (stats.success / stats.count) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Calculate salary insights
    const salaryData = await db.jobApplication.findMany({
      where: {
        ...baseWhere,
        job: {
          salaryMin: {
            not: null
          }
        }
      },
      include: {
        job: true
      }
    })

    const salaries = salaryData.map(app => [app.job.salaryMin, app.job.salaryMax]).flat().filter(Boolean)
    const salaryInsights = {
      averageMin: salaries.length > 0 ? Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length) : 0,
      median: salaries.length > 0 ? Math.round(salaries.sort((a, b) => a - b)[Math.floor(salaries.length / 2)]) : 0,
      marketRate: 0 // TODO: Calculate from market data
    }

    const stats = {
      total: totalApplications,
      active: activeApplications,
      archived: archivedApplications,
      byStatus: statusCounts,
      byCompany: companyStatsFormatted,
      byTimePeriod: timePeriodFormatted,
      responseMetrics,
      topSkills,
      salaryInsights
    }

    return NextResponse.json({
      success: true,
      data: stats
    })
  })
}