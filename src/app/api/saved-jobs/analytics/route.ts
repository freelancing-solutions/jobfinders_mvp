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

    // Get job seeker profile
    const jobSeekerProfile = await db.jobSeekerProfile.findUnique({
      where: { userUid: session.user.id }
    })

    if (!jobSeekerProfile) {
      return NextResponse.json({
        success: true,
        data: {
          totalSaved: 0,
          statusBreakdown: {},
          companyStats: [],
          salaryInsights: { averageMin: 0, median: 0, marketRate: 0 },
          locationStats: [],
          timeBasedStats: [],
          topSkills: [],
          applicationConversionRate: 0,
          averageResponseTime: 0
        }
      })
    }

    // Get all saved jobs with their details
    const savedJobs = await db.savedJob.findMany({
      where: { jobSeekerProfileId: jobSeekerProfile.userUid },
      include: {
        job: {
          select: {
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
            requirements: true,
            skills: true,
            createdAt: true
          }
        }
      },
      orderBy: { savedAt: 'desc' }
    })

    const totalSaved = savedJobs.length

    // Status breakdown
    const statusBreakdown = savedJobs.reduce((acc: any, savedJob) => {
      const status = savedJob.status || 'saved'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})

    // Company statistics
    const companyStats = savedJobs.reduce((acc: any, savedJob) => {
      const companyName = savedJob.job.company.name
      if (!acc[companyName]) {
        acc[companyName] = { count: 0, totalSalary: 0, salaryJobs: 0 }
      }
      acc[companyName].count++

      if (savedJob.job.salaryMin || savedJob.job.salaryMax) {
        const avgSalary = (savedJob.job.salaryMin || savedJob.job.salaryMax || 0)
        acc[companyName].totalSalary += avgSalary
        acc[companyName].salaryJobs++
      }

      return acc
    }, {})

    const formattedCompanyStats = Object.entries(companyStats)
      .map(([name, stats]: [string, any]) => ({
        name,
        count: stats.count,
        averageSalary: stats.salaryJobs > 0 ? Math.round(stats.totalSalary / stats.salaryJobs) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Location statistics
    const locationStats = savedJobs.reduce((acc: any, savedJob) => {
      const location = `${savedJob.job.city}, ${savedJob.job.province}`.trim()
      if (!acc[location]) {
        acc[location] = 0
      }
      acc[location]++
      return acc
    }, {})

    const formattedLocationStats = Object.entries(locationStats)
      .map(([location, count]: [string, number]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Salary insights
    const salaries = savedJobs
      .map(savedJob => savedJob.job.salaryMin || savedJob.job.salaryMax)
      .filter(Boolean)

    const sortedSalaries = salaries.sort((a, b) => a - b)
    const median = sortedSalaries.length > 0
      ? sortedSalaries[Math.floor(sortedSalaries.length / 2)]
      : 0

    const salaryInsights = {
      averageMin: salaries.length > 0
        ? Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length)
        : 0,
      median,
      marketRate: 0 // TODO: Calculate based on market data
    }

    // Time-based statistics (by month)
    const timeBasedStats = savedJobs.reduce((acc: any, savedJob) => {
      const month = new Date(savedJob.savedAt).toISOString().slice(0, 7) // YYYY-MM
      if (!acc[month]) {
        acc[month] = { month, saved: 0, applied: 0, interviewing: 0 }
      }
      acc[month].saved++
      if (savedJob.status === 'applied') acc[month].applied++
      if (savedJob.status === 'interviewing') acc[month].interviewing++
      return acc
    }, {})

    const formattedTimeStats = Object.values(timeBasedStats)
      .sort((a: any, b: any) => b.month.localeCompare(a.month))
      .slice(0, 12)

    // Top skills analysis
    const allSkills = savedJobs.flatMap(savedJob =>
      savedJob.job.skills || savedJob.job.requirements || []
    )

    const topSkills = allSkills.reduce((acc: any, skill) => {
      if (!acc[skill]) {
        acc[skill] = { count: 0, applied: 0 }
      }
      acc[skill].count++

      const savedJob = savedJobs.find(sj =>
        (sj.job.skills?.includes(skill) || sj.job.requirements?.includes(skill))
      )
      if (savedJob?.status === 'applied') {
        acc[skill].applied++
      }

      return acc
    }, {})

    const formattedTopSkills = Object.entries(topSkills)
      .map(([skill, stats]: [string, any]) => ({
        skill,
        count: stats.count,
        applicationRate: stats.count > 0 ? (stats.applied / stats.count) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15)

    // Application conversion rate
    const appliedJobs = savedJobs.filter(job => job.status === 'applied').length
    const applicationConversionRate = totalSaved > 0 ? (appliedJobs / totalSaved) * 100 : 0

    // Position type breakdown
    const positionTypeStats = savedJobs.reduce((acc: any, savedJob) => {
      const type = savedJob.job.positionType || 'unknown'
      if (!acc[type]) {
        acc[type] = 0
      }
      acc[type]++
      return acc
    }, {})

    // Remote policy breakdown
    const remotePolicyStats = savedJobs.reduce((acc: any, savedJob) => {
      const policy = savedJob.job.remotePolicy || 'unknown'
      if (!acc[policy]) {
        acc[policy] = 0
      }
      acc[policy]++
      return acc
    }, {})

    const analytics = {
      totalSaved,
      statusBreakdown,
      companyStats: formattedCompanyStats,
      locationStats: formattedLocationStats,
      salaryInsights,
      timeBasedStats: formattedTimeStats,
      topSkills: formattedTopSkills,
      applicationConversionRate,
      averageResponseTime: 0, // TODO: Calculate from application data
      positionTypeStats,
      remotePolicyStats,
      lastUpdated: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      data: analytics
    })

  } catch (error) {
    console.error('Error fetching saved jobs analytics:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}