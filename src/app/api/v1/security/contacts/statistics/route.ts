import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limiter'
import { verifyAuth } from '@/lib/auth'
import { securityContactManager } from '@/lib/security-contacts'

// Rate limiting configuration
const statisticsRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // Limit each IP to 50 requests per windowMs
  message: 'Too many statistics requests from this IP'
})

/**
 * GET /api/v1/security/contacts/statistics
 * Retrieve security contact statistics and performance metrics
 */
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await statisticsRateLimit(request)
    if (rateLimitResult) {
      return rateLimitResult
    }

    // Verify authentication and authorization
    const authResult = await verifyAuth(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user has admin or security role
    if (!authResult.user.roles?.includes('admin') && 
        !authResult.user.roles?.includes('security') &&
        !authResult.user.permissions?.includes('view_security_statistics')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d' // 7d, 30d, 90d, 1y
    const includeDetails = searchParams.get('details') === 'true'

    // Get basic statistics
    const statistics = securityContactManager.getContactStatistics()

    // Calculate additional metrics based on period
    const periodMetrics = calculatePeriodMetrics(period)

    // Get emergency contact list statistics
    const emergencyContacts = securityContactManager.getEmergencyContactList()
    const emergencyContactStats = {
      totalEmergencyContacts: emergencyContacts.length,
      activeEmergencyContacts: emergencyContacts.filter(c => c.isActive).length,
      emergencyContactsByType: emergencyContacts.reduce((acc, contact) => {
        acc[contact.type] = (acc[contact.type] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }

    // Get escalation rule statistics
    const escalationRules = Array.from(securityContactManager['escalationRules'].values())
    const escalationStats = {
      totalRules: escalationRules.length,
      activeRules: escalationRules.filter(rule => rule.isActive).length,
      rulesByTriggerType: escalationRules.reduce((acc, rule) => {
        rule.triggerConditions.forEach(trigger => {
          acc[trigger.type] = (acc[trigger.type] || 0) + 1
        })
        return acc
      }, {} as Record<string, number>)
    }

    // Calculate contact reliability scores
    const contacts = Array.from(securityContactManager['contacts'].values())
    const contactReliability = contacts.map(contact => {
      const totalMethods = contact.contactMethods.length
      const verifiedMethods = contact.contactMethods.filter(m => m.isVerified).length
      const failedMethods = contact.contactMethods.filter(m => m.failureCount > 0).length
      
      const reliabilityScore = totalMethods > 0 
        ? Math.round(((verifiedMethods - failedMethods) / totalMethods) * 100)
        : 0

      return {
        contactId: contact.id,
        contactName: contact.name,
        contactType: contact.type,
        reliabilityScore: Math.max(0, reliabilityScore),
        totalMethods,
        verifiedMethods,
        failedMethods,
        lastContactedAt: contact.lastContactedAt,
        responseTimeMinutes: contact.responseTimeMinutes
      }
    }).sort((a, b) => b.reliabilityScore - a.reliabilityScore)

    // Calculate coverage metrics
    const coverageMetrics = calculateCoverageMetrics(contacts)

    const response = {
      success: true,
      data: {
        overview: {
          ...statistics,
          ...emergencyContactStats,
          ...escalationStats,
          period,
          generatedAt: new Date().toISOString()
        },
        periodMetrics,
        coverageMetrics,
        reliability: {
          averageReliabilityScore: contactReliability.length > 0
            ? Math.round(contactReliability.reduce((sum, c) => sum + c.reliabilityScore, 0) / contactReliability.length)
            : 0,
          highReliabilityContacts: contactReliability.filter(c => c.reliabilityScore >= 80).length,
          lowReliabilityContacts: contactReliability.filter(c => c.reliabilityScore < 50).length,
          ...(includeDetails && { contactReliability: contactReliability.slice(0, 20) }) // Top 20 contacts
        },
        recommendations: generateRecommendations(statistics, contactReliability, coverageMetrics)
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error retrieving contact statistics:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve contact statistics' },
      { status: 500 }
    )
  }
}

/**
 * Calculate period-specific metrics
 */
function calculatePeriodMetrics(period: string) {
  const now = new Date()
  let startDate: Date

  switch (period) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      break
    case '1y':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      break
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  }

  // Get contact attempts within the period
  const attempts = Array.from(securityContactManager['contactAttempts'].values())
  const periodAttempts = attempts.filter(attempt => 
    attempt.attemptedAt >= startDate && attempt.attemptedAt <= now
  )

  // Calculate metrics
  const totalAttempts = periodAttempts.length
  const successfulAttempts = periodAttempts.filter(a => a.success).length
  const failedAttempts = totalAttempts - successfulAttempts

  // Group attempts by method
  const attemptsByMethod = periodAttempts.reduce((acc, attempt) => {
    const method = attempt.method
    if (!acc[method]) {
      acc[method] = { total: 0, successful: 0, failed: 0 }
    }
    acc[method].total++
    if (attempt.success) {
      acc[method].successful++
    } else {
      acc[method].failed++
    }
    return acc
  }, {} as Record<string, { total: number; successful: number; failed: number }>)

  // Calculate daily breakdown
  const dailyBreakdown = []
  for (let i = 0; i < 30; i++) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
    
    const dayAttempts = periodAttempts.filter(attempt => 
      attempt.attemptedAt >= dayStart && attempt.attemptedAt < dayEnd
    )

    dailyBreakdown.unshift({
      date: dayStart.toISOString().split('T')[0],
      totalAttempts: dayAttempts.length,
      successfulAttempts: dayAttempts.filter(a => a.success).length,
      failedAttempts: dayAttempts.filter(a => !a.success).length
    })
  }

  return {
    period,
    startDate: startDate.toISOString(),
    endDate: now.toISOString(),
    totalAttempts,
    successfulAttempts,
    failedAttempts,
    successRate: totalAttempts > 0 ? Math.round((successfulAttempts / totalAttempts) * 100) : 0,
    attemptsByMethod,
    dailyBreakdown: dailyBreakdown.slice(-30) // Last 30 days
  }
}

/**
 * Calculate coverage metrics
 */
function calculateCoverageMetrics(contacts: any[]) {
  const activeContacts = contacts.filter(c => c.isActive)
  
  // Time zone coverage
  const timezones = activeContacts.reduce((acc, contact) => {
    acc[contact.timezone] = (acc[contact.timezone] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Language coverage
  const languages = activeContacts.reduce((acc, contact) => {
    contact.languages.forEach((lang: string) => {
      acc[lang] = (acc[lang] || 0) + 1
    })
    return acc
  }, {} as Record<string, number>)

  // Availability coverage
  const availability = activeContacts.reduce((acc, contact) => {
    acc[contact.availability] = (acc[contact.availability] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Contact method coverage
  const methodCoverage = activeContacts.reduce((acc, contact) => {
    contact.contactMethods.forEach((method: any) => {
      if (method.isVerified) {
        acc[method.method] = (acc[method.method] || 0) + 1
      }
    })
    return acc
  }, {} as Record<string, number>)

  // Calculate coverage scores
  const timezoneCoverage = Object.keys(timezones).length
  const languageCoverage = Object.keys(languages).length
  const methodTypes = Object.keys(methodCoverage).length

  // 24/7 coverage assessment
  const alwaysAvailable = activeContacts.filter(c => c.availability === 'always').length
  const businessHoursOnly = activeContacts.filter(c => c.availability === 'business_hours').length
  const onCallAvailable = activeContacts.filter(c => c.availability === 'on_call').length

  const coverageScore = Math.round(
    (timezoneCoverage * 10 + // Max 50 points for timezone diversity
     languageCoverage * 5 + // Max 25 points for language diversity  
     methodTypes * 3 + // Max 21 points for method diversity
     alwaysAvailable * 2 + // Points for 24/7 availability
     onCallAvailable * 1) / 2 // Normalize to 100
  )

  return {
    coverageScore: Math.min(100, coverageScore),
    timezones,
    languages,
    availability,
    methodCoverage,
    assessment: {
      timezoneDiversity: timezoneCoverage >= 3 ? 'Good' : timezoneCoverage >= 2 ? 'Fair' : 'Poor',
      languageDiversity: languageCoverage >= 3 ? 'Good' : languageCoverage >= 2 ? 'Fair' : 'Poor',
      methodDiversity: methodTypes >= 4 ? 'Good' : methodTypes >= 3 ? 'Fair' : 'Poor',
      availabilityCoverage: alwaysAvailable >= 2 ? 'Good' : alwaysAvailable >= 1 ? 'Fair' : 'Poor'
    }
  }
}

/**
 * Generate recommendations based on statistics
 */
function generateRecommendations(
  statistics: any,
  contactReliability: any[],
  coverageMetrics: any
): string[] {
  const recommendations: string[] = []

  // Contact reliability recommendations
  const lowReliabilityContacts = contactReliability.filter(c => c.reliabilityScore < 50)
  if (lowReliabilityContacts.length > 0) {
    recommendations.push(
      `Review and update ${lowReliabilityContacts.length} contacts with low reliability scores`
    )
  }

  // Contact method recommendations
  const unverifiedMethods = contactReliability.reduce((sum, c) => 
    sum + (c.totalMethods - c.verifiedMethods), 0
  )
  if (unverifiedMethods > 0) {
    recommendations.push(
      `Verify ${unverifiedMethods} unverified contact methods to improve reliability`
    )
  }

  // Coverage recommendations
  if (coverageMetrics.assessment.timezoneDiversity === 'Poor') {
    recommendations.push('Add contacts in different time zones to improve 24/7 coverage')
  }

  if (coverageMetrics.assessment.languageDiversity === 'Poor') {
    recommendations.push('Add contacts with diverse language capabilities')
  }

  if (coverageMetrics.assessment.methodDiversity === 'Poor') {
    recommendations.push('Diversify contact methods (email, SMS, phone, etc.) for better redundancy')
  }

  if (coverageMetrics.assessment.availabilityCoverage === 'Poor') {
    recommendations.push('Ensure adequate 24/7 contact coverage for critical incidents')
  }

  // Failure rate recommendations
  if (statistics.failureRate > 20) {
    recommendations.push('High failure rate detected - review and update contact information')
  }

  // Emergency contact recommendations
  const emergencyContacts = contactReliability.filter(c => c.contactType === 'security_team')
  if (emergencyContacts.length < 2) {
    recommendations.push('Add more emergency security team contacts for redundancy')
  }

  // Response time recommendations
  const slowResponders = contactReliability.filter(c => 
    c.responseTimeMinutes && c.responseTimeMinutes > 60
  )
  if (slowResponders.length > 0) {
    recommendations.push('Review response time expectations with slow-responding contacts')
  }

  // Default recommendation if no issues found
  if (recommendations.length === 0) {
    recommendations.push('Contact system appears to be well-configured and performing optimally')
  }

  return recommendations
}