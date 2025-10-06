import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { verifyAuth } from '@/lib/auth'
import { incidentResponseManager } from '@/lib/incident-response'

// Rate limiting for incident statistics
const statisticsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30 // limit each IP to 30 requests per windowMs
})

/**
 * GET /api/v1/incidents/statistics - Get incident statistics and metrics
 */
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await statisticsLimiter(request)
    if (rateLimitResult) {
      return rateLimitResult
    }

    // Verify authentication
    const authResult = await verifyAuth(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user has permission to view incident statistics
    const hasPermission = authResult.user.role === 'ADMIN' || 
                         authResult.user.role === 'security' ||
                         authResult.user.permissions?.includes('view_incidents')

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') as 'day' | 'week' | 'month' || 'month'

    // Validate timeframe
    if (!['day', 'week', 'month'].includes(timeframe)) {
      return NextResponse.json(
        { 
          error: 'Invalid timeframe',
          validTimeframes: ['day', 'week', 'month']
        },
        { status: 400 }
      )
    }

    // Get incident statistics
    const statistics = incidentResponseManager.getIncidentStatistics(timeframe)

    // Get additional metrics
    const now = new Date()
    const startDate = new Date()
    
    switch (timeframe) {
      case 'day':
        startDate.setDate(now.getDate() - 1)
        break
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
    }

    const allIncidents = incidentResponseManager.getIncidents({ startDate })

    // Calculate additional metrics
    const criticalIncidents = allIncidents.filter(i => i.severity === 'critical')
    const highSeverityIncidents = allIncidents.filter(i => i.severity === 'high')
    const dataBreaches = allIncidents.filter(i => i.type === 'data_breach')
    const securityBreaches = allIncidents.filter(i => i.type === 'security_breach')

    // Calculate response time metrics
    const responseTimeMetrics = calculateResponseTimeMetrics(allIncidents)

    // Calculate trend data (compare with previous period)
    const previousStartDate = new Date(startDate)
    switch (timeframe) {
      case 'day':
        previousStartDate.setDate(previousStartDate.getDate() - 1)
        break
      case 'week':
        previousStartDate.setDate(previousStartDate.getDate() - 7)
        break
      case 'month':
        previousStartDate.setMonth(previousStartDate.getMonth() - 1)
        break
    }

    const previousIncidents = incidentResponseManager.getIncidents({
      startDate: previousStartDate,
      endDate: startDate
    })

    const trendData = {
      totalIncidents: {
        current: statistics.total,
        previous: previousIncidents.length,
        change: statistics.total - previousIncidents.length,
        changePercent: previousIncidents.length > 0 
          ? Math.round(((statistics.total - previousIncidents.length) / previousIncidents.length) * 100)
          : 0
      },
      criticalIncidents: {
        current: criticalIncidents.length,
        previous: previousIncidents.filter(i => i.severity === 'critical').length,
        change: criticalIncidents.length - previousIncidents.filter(i => i.severity === 'critical').length
      },
      averageResolutionTime: {
        current: statistics.averageResolutionTime,
        previous: calculateAverageResolutionTime(previousIncidents),
        change: statistics.averageResolutionTime - calculateAverageResolutionTime(previousIncidents)
      }
    }

    // Compliance metrics
    const complianceMetrics = {
      dataBreachNotifications: {
        total: dataBreaches.length,
        notifiedWithin72Hours: dataBreaches.filter(incident => {
          const notification = incident.regulatoryNotifications.find(n => 
            n.authority === 'Information Regulator (South Africa)'
          )
          if (!notification) return false
          
          const timeDiff = notification.notifiedAt.getTime() - incident.detectedAt.getTime()
          return timeDiff <= (72 * 60 * 60 * 1000) // 72 hours in milliseconds
        }).length
      },
      incidentResponseTimes: {
        within15Minutes: allIncidents.filter(i => {
          const firstResponse = i.timeline.find(t => t.action === 'status_updated')
          if (!firstResponse) return false
          
          const responseTime = firstResponse.timestamp.getTime() - i.reportedAt.getTime()
          return responseTime <= (15 * 60 * 1000) // 15 minutes in milliseconds
        }).length,
        total: allIncidents.length
      }
    }

    const enhancedStatistics = {
      ...statistics,
      timeframe,
      period: {
        startDate,
        endDate: now
      },
      criticalIncidents: criticalIncidents.length,
      highSeverityIncidents: highSeverityIncidents.length,
      dataBreaches: dataBreaches.length,
      securityBreaches: securityBreaches.length,
      responseTimeMetrics,
      trendData,
      complianceMetrics,
      
      // Risk assessment
      riskAssessment: {
        currentRiskLevel: calculateCurrentRiskLevel(allIncidents),
        riskFactors: identifyRiskFactors(allIncidents),
        recommendations: generateRecommendations(allIncidents, statistics)
      }
    }

    return NextResponse.json({
      success: true,
      statistics: enhancedStatistics
    })

  } catch (error) {
    console.error('Error retrieving incident statistics:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve incident statistics' },
      { status: 500 }
    )
  }
}

// Helper functions
function calculateResponseTimeMetrics(incidents: any[]) {
  const responseTimes = incidents
    .map(incident => {
      const firstResponse = incident.timeline.find((t: any) => 
        t.action === 'status_updated' || t.action === 'containment_action'
      )
      if (!firstResponse) return null
      
      return firstResponse.timestamp.getTime() - incident.reportedAt.getTime()
    })
    .filter(time => time !== null)

  if (responseTimes.length === 0) {
    return {
      average: 0,
      median: 0,
      fastest: 0,
      slowest: 0
    }
  }

  responseTimes.sort((a, b) => a - b)

  return {
    average: Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length / (1000 * 60)), // minutes
    median: Math.round(responseTimes[Math.floor(responseTimes.length / 2)] / (1000 * 60)), // minutes
    fastest: Math.round(responseTimes[0] / (1000 * 60)), // minutes
    slowest: Math.round(responseTimes[responseTimes.length - 1] / (1000 * 60)) // minutes
  }
}

function calculateAverageResolutionTime(incidents: any[]): number {
  const resolvedIncidents = incidents.filter(i => 
    ['resolved', 'closed'].includes(i.status)
  )

  if (resolvedIncidents.length === 0) return 0

  const totalTime = resolvedIncidents.reduce((sum, incident) => {
    const resolutionTime = incident.updatedAt.getTime() - incident.createdAt.getTime()
    return sum + resolutionTime
  }, 0)

  return Math.round(totalTime / resolvedIncidents.length / (1000 * 60 * 60)) // hours
}

function calculateCurrentRiskLevel(incidents: any[]): 'low' | 'medium' | 'high' | 'critical' {
  const openCritical = incidents.filter(i => 
    i.severity === 'critical' && !['resolved', 'closed'].includes(i.status)
  ).length

  const openHigh = incidents.filter(i => 
    i.severity === 'high' && !['resolved', 'closed'].includes(i.status)
  ).length

  if (openCritical > 0) return 'critical'
  if (openHigh > 2) return 'high'
  if (openHigh > 0) return 'medium'
  return 'low'
}

function identifyRiskFactors(incidents: any[]): string[] {
  const factors: string[] = []

  const openCritical = incidents.filter(i => 
    i.severity === 'critical' && !['resolved', 'closed'].includes(i.status)
  ).length

  const dataBreaches = incidents.filter(i => i.type === 'data_breach').length
  const unauthorizedAccess = incidents.filter(i => i.type === 'unauthorized_access').length
  const slowResponse = incidents.filter(i => {
    const firstResponse = i.timeline.find((t: any) => t.action === 'status_updated')
    if (!firstResponse) return true
    
    const responseTime = firstResponse.timestamp.getTime() - i.reportedAt.getTime()
    return responseTime > (30 * 60 * 1000) // 30 minutes
  }).length

  if (openCritical > 0) {
    factors.push(`${openCritical} critical incident(s) still open`)
  }

  if (dataBreaches > 0) {
    factors.push(`${dataBreaches} data breach(es) in current period`)
  }

  if (unauthorizedAccess > 2) {
    factors.push(`High number of unauthorized access attempts (${unauthorizedAccess})`)
  }

  if (slowResponse > incidents.length * 0.3) {
    factors.push('Slow incident response times detected')
  }

  return factors
}

function generateRecommendations(incidents: any[], statistics: any): string[] {
  const recommendations: string[] = []

  const openIncidents = statistics.openIncidents
  const criticalIncidents = incidents.filter(i => i.severity === 'critical').length
  const averageResolutionTime = statistics.averageResolutionTime

  if (openIncidents > 5) {
    recommendations.push('Consider increasing incident response team capacity')
  }

  if (criticalIncidents > 0) {
    recommendations.push('Review and strengthen security controls to prevent critical incidents')
  }

  if (averageResolutionTime > 24) {
    recommendations.push('Improve incident response procedures to reduce resolution time')
  }

  const dataBreaches = incidents.filter(i => i.type === 'data_breach').length
  if (dataBreaches > 0) {
    recommendations.push('Conduct security awareness training and review data protection measures')
  }

  const unauthorizedAccess = incidents.filter(i => i.type === 'unauthorized_access').length
  if (unauthorizedAccess > 2) {
    recommendations.push('Strengthen access controls and implement additional authentication measures')
  }

  if (recommendations.length === 0) {
    recommendations.push('Continue monitoring and maintain current security posture')
  }

  return recommendations
}