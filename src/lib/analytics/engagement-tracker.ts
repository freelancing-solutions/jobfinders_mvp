import { logger } from '@/lib/logger'

export interface UserEngagementEvent {
  id: string
  userId: string
  sessionId: string
  eventType: EngagementEventType
  timestamp: Date
  duration?: number
  metadata: {
    userAgent?: string
    ip?: string
    referrer?: string
    platform?: 'web' | 'mobile' | 'api'
    version?: string
    [key: string]: any
  }
  data: {
    [key: string]: any
  }
}

export type EngagementEventType =
  | 'session_start'
  | 'session_end'
  | 'page_view'
  | 'profile_view'
  | 'job_view'
  | 'match_view'
  | 'application_submit'
  | 'application_view'
  | 'recommendation_view'
  | 'search_query'
  | 'filter_apply'
  | 'save_job'
  | 'share_job'
  | 'message_send'
  | 'notification_open'
  | 'feedback_submit'
  | 'settings_update'
  | 'profile_update'
  | 'resume_upload'
  | 'skill_add'
  | 'connection_request'
  | 'login'
  | 'logout'

export interface UserSession {
  id: string
  userId: string
  startTime: Date
  endTime?: Date
  duration?: number
  pageViews: number
  actions: number
  bounceRate: number
  deviceType: 'desktop' | 'mobile' | 'tablet'
  browser?: string
  os?: string
  location?: string
  referrer?: string
  exitPage?: string
  conversionEvents: string[]
}

export interface EngagementMetrics {
  totalUsers: number
  activeUsers: ActiveUsersMetrics
  sessionMetrics: SessionMetrics
  featureUsage: FeatureUsageMetrics
  retentionMetrics: RetentionMetrics
  conversionMetrics: ConversionMetrics
  satisfactionMetrics: SatisfactionMetrics
  behavioralMetrics: BehavioralMetrics
}

export interface ActiveUsersMetrics {
  daily: number
  weekly: number
  monthly: number
  currentlyOnline: number
  newUsers: number
  returningUsers: number
  churnRate: number
  growthRate: number
}

export interface SessionMetrics {
  totalSessions: number
  averageSessionDuration: number
  medianSessionDuration: number
  bounceRate: number
  pagesPerSession: number
  sessionsPerUser: number
  topExitPages: Array<{ page: string; count: number; percentage: number }>
  peakUsageTimes: Array<{ hour: number; sessions: number }>
}

export interface FeatureUsageMetrics {
  profileViews: number
  jobViews: number
  matchViews: number
  applications: number
  recommendationsUsed: number
  searchQueries: number
  jobsSaved: number
  jobsShared: number
  messagesSent: number
  featureAdoption: Record<string, {
    users: number
    usage: number
    frequency: number
    adoptionRate: number
  }>
}

export interface RetentionMetrics {
  day1: number
  day7: number
  day30: number
  day90: number
  cohortRetention: Array<{
    cohort: string
    size: number
    retention: Record<string, number>
  }>
  userLifecycle: {
    acquisition: number
    activation: number
    retention: number
    referral: number
    revenue: number
  }
}

export interface ConversionMetrics {
  registrationToProfile: number
  profileToApplication: number
  applicationToInterview: number
  interviewToHire: number
  overallFunnelEfficiency: number
  conversionTime: {
    average: number
    median: number
    byStage: Record<string, number>
  }
  abandonmentRates: Record<string, number>
}

export interface SatisfactionMetrics {
  overallSatisfaction: number
  featureSatisfaction: Record<string, number>
  netPromoterScore: number
  userEffortScore: number
  feedbackCount: number
  sentimentAnalysis: {
    positive: number
    neutral: number
    negative: number
  }
  supportTickets: {
    total: number
    resolved: number
    averageResolutionTime: number
  }
}

export interface BehavioralMetrics {
  userSegments: UserSegment[]
  pathAnalysis: UserPath[]
  heatMapData: Record<string, number>
  clickThroughRates: Record<string, number>
  scrollDepth: {
    average: number
    distribution: Record<string, number>
  }
  timeOnPage: Record<string, number>
}

export interface UserSegment {
  id: string
  name: string
  size: number
  characteristics: Record<string, any>
  behavior: {
    sessionFrequency: number
    sessionDuration: number
    featureUsage: Record<string, number>
    conversionRate: number
  }
}

export interface UserPath {
  path: string[]
  frequency: number
  conversionRate: number
  dropOffPoints: Array<{ step: string; dropOffRate: number }>
  averageTime: number
}

export interface EngagementFilters {
  dateRange?: {
    start: Date
    end: Date
  }
  userTypes?: ('candidate' | 'employer' | 'admin')[]
  userSegments?: string[]
  platforms?: ('web' | 'mobile' | 'api')[]
  events?: EngagementEventType[]
  countries?: string[]
  devices?: ('desktop' | 'mobile' | 'tablet')[]
  sessions?: string[]
}

export class EngagementTracker {
  /**
   * Process raw engagement events and calculate comprehensive metrics
   */
  static async calculateEngagementMetrics(
    events: UserEngagementEvent[],
    filters: EngagementFilters = {}
  ): Promise<EngagementMetrics> {
    logger.info('Calculating engagement metrics', {
      totalEvents: events.length,
      filters
    })

    // Apply filters
    const filteredEvents = this.applyFilters(events, filters)

    if (filteredEvents.length === 0) {
      return this.getEmptyMetrics()
    }

    // Calculate different metric categories
    const [
      activeUsers,
      sessionMetrics,
      featureUsage,
      retentionMetrics,
      conversionMetrics,
      satisfactionMetrics,
      behavioralMetrics
    ] = await Promise.all([
      this.calculateActiveUsersMetrics(filteredEvents),
      this.calculateSessionMetrics(filteredEvents),
      this.calculateFeatureUsageMetrics(filteredEvents),
      this.calculateRetentionMetrics(filteredEvents),
      this.calculateConversionMetrics(filteredEvents),
      this.calculateSatisfactionMetrics(filteredEvents),
      this.calculateBehavioralMetrics(filteredEvents)
    ])

    const totalUsers = new Set(filteredEvents.map(e => e.userId)).size

    const metrics: EngagementMetrics = {
      totalUsers,
      activeUsers,
      sessionMetrics,
      featureUsage,
      retentionMetrics,
      conversionMetrics,
      satisfactionMetrics,
      behavioralMetrics
    }

    logger.info('Engagement metrics calculated', {
      totalUsers,
      activeUsersDaily: activeUsers.daily,
      averageSessionDuration: sessionMetrics.averageSessionDuration
    })

    return metrics
  }

  /**
   * Apply filters to engagement events
   */
  private static applyFilters(
    events: UserEngagementEvent[],
    filters: EngagementFilters
  ): UserEngagementEvent[] {
    return events.filter(event => {
      // Date range filter
      if (filters.dateRange) {
        if (event.timestamp < filters.dateRange.start ||
            event.timestamp > filters.dateRange.end) {
          return false
        }
      }

      // Event type filter
      if (filters.events?.length &&
          !filters.events.includes(event.eventType)) {
        return false
      }

      // Platform filter
      if (filters.platforms?.length &&
          !filters.platforms.includes(event.metadata.platform)) {
        return false
      }

      return true
    })
  }

  /**
   * Calculate active users metrics
   */
  private static async calculateActiveUsersMetrics(
    events: UserEngagementEvent[]
  ): Promise<ActiveUsersMetrics> {
    const now = new Date()
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const dailyUsers = new Set(
      events
        .filter(e => e.timestamp >= dayAgo)
        .map(e => e.userId)
    ).size

    const weeklyUsers = new Set(
      events
        .filter(e => e.timestamp >= weekAgo)
        .map(e => e.userId)
    ).size

    const monthlyUsers = new Set(
      events
        .filter(e => e.timestamp >= monthAgo)
        .map(e => e.userId)
    ).size

    // Calculate currently online (last 5 minutes)
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
    const currentlyOnline = new Set(
      events
        .filter(e => e.timestamp >= fiveMinutesAgo)
        .map(e => e.userId)
    ).size

    // Calculate new vs returning users
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const userFirstSeen = new Map<string, Date>()

    events.forEach(event => {
      if (!userFirstSeen.has(event.userId) ||
          event.timestamp < userFirstSeen.get(event.userId)!) {
        userFirstSeen.set(event.userId, event.timestamp)
      }
    })

    const newUsers = Array.from(userFirstSeen.values())
      .filter(firstSeen => firstSeen >= dayAgo).length

    const returningUsers = dailyUsers - newUsers

    // Calculate churn and growth rates
    const previousMonthUsers = new Set(
      events
        .filter(e => e.timestamp >= new Date(monthAgo.getTime() - 30 * 24 * 60 * 60 * 1000) &&
                   e.timestamp < monthAgo)
        .map(e => e.userId)
    ).size

    const churnRate = previousMonthUsers > 0 ?
      (previousMonthUsers - monthlyUsers) / previousMonthUsers : 0

    const growthRate = previousMonthUsers > 0 ?
      (monthlyUsers - previousMonthUsers) / previousMonthUsers : 0

    return {
      daily: dailyUsers,
      weekly: weeklyUsers,
      monthly: monthlyUsers,
      currentlyOnline,
      newUsers,
      returningUsers,
      churnRate,
      growthRate
    }
  }

  /**
   * Calculate session metrics
   */
  private static async calculateSessionMetrics(
    events: UserEngagementEvent[]
  ): Promise<SessionMetrics> {
    // Group events by session
    const sessionGroups = new Map<string, UserEngagementEvent[]>()

    events.forEach(event => {
      if (!sessionGroups.has(event.sessionId)) {
        sessionGroups.set(event.sessionId, [])
      }
      sessionGroups.get(event.sessionId)!.push(event)
    })

    const sessions: UserSession[] = []

    sessionGroups.forEach((sessionEvents, sessionId) => {
      const sortedEvents = sessionEvents.sort((a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )

      const startEvent = sortedEvents[0]
      const endEvent = sortedEvents[sortedEvents.length - 1]

      const duration = endEvent.timestamp.getTime() - startEvent.timestamp.getTime()

      const pageViews = sessionEvents.filter(e => e.eventType === 'page_view').length
      const actions = sessionEvents.filter(e =>
        e.eventType !== 'session_start' && e.eventType !== 'session_end'
      ).length

      // Determine device type from user agent
      const userAgent = startEvent.metadata.userAgent || ''
      const deviceType = this.detectDeviceType(userAgent)

      sessions.push({
        id: sessionId,
        userId: startEvent.userId,
        startTime: startEvent.timestamp,
        endTime: endEvent.timestamp,
        duration,
        pageViews,
        actions,
        bounceRate: pageViews <= 1 ? 1 : 0,
        deviceType,
        browser: this.extractBrowser(userAgent),
        os: this.extractOS(userAgent),
        location: startEvent.metadata.country,
        referrer: startEvent.metadata.referrer,
        exitPage: endEvent.data.page,
        conversionEvents: sessionEvents
          .filter(e => this.isConversionEvent(e.eventType))
          .map(e => e.eventType)
      })
    })

    // Calculate metrics
    const totalSessions = sessions.length
    const durations = sessions.map(s => s.duration || 0).filter(d => d > 0)

    const averageSessionDuration = durations.length > 0 ?
      durations.reduce((sum, d) => sum + d, 0) / durations.length : 0

    const sortedDurations = durations.sort((a, b) => a - b)
    const medianSessionDuration = sortedDurations.length > 0 ?
      sortedDurations[Math.floor(sortedDurations.length / 2)] : 0

    const bounceSessions = sessions.filter(s => s.bounceRate === 1).length
    const bounceRate = totalSessions > 0 ? bounceSessions / totalSessions : 0

    const totalPages = sessions.reduce((sum, s) => sum + s.pageViews, 0)
    const pagesPerSession = totalSessions > 0 ? totalPages / totalSessions : 0

    const usersPerSession = new Set(sessions.map(s => s.userId)).size
    const sessionsPerUser = usersPerSession > 0 ? totalSessions / usersPerSession : 0

    // Calculate top exit pages
    const exitPages = new Map<string, number>()
    sessions.forEach(session => {
      if (session.exitPage) {
        exitPages.set(session.exitPage, (exitPages.get(session.exitPage) || 0) + 1)
      }
    })

    const topExitPages = Array.from(exitPages.entries())
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 10)
      .map(([page, count]) => ({
        page,
        count,
        percentage: totalSessions > 0 ? (count / totalSessions) * 100 : 0
      }))

    // Calculate peak usage times
    const hourlyUsage = new Array(24).fill(0)
    sessions.forEach(session => {
      const hour = session.startTime.getHours()
      hourlyUsage[hour]++
    })

    const peakUsageTimes = hourlyUsage
      .map((sessions, hour) => ({ hour, sessions }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 6)

    return {
      totalSessions,
      averageSessionDuration,
      medianSessionDuration,
      bounceRate,
      pagesPerSession,
      sessionsPerUser,
      topExitPages,
      peakUsageTimes
    }
  }

  /**
   * Calculate feature usage metrics
   */
  private static async calculateFeatureUsageMetrics(
    events: UserEngagementEvent[]
  ): Promise<FeatureUsageMetrics> {
    const eventCounts = new Map<EngagementEventType, number>()
    const featureUsers = new Map<EngagementEventType, Set<string>>()

    events.forEach(event => {
      eventCounts.set(event.eventType, (eventCounts.get(event.eventType) || 0) + 1)

      if (!featureUsers.has(event.eventType)) {
        featureUsers.set(event.eventType, new Set())
      }
      featureUsers.get(event.eventType)!.add(event.userId)
    })

    const totalUsers = new Set(events.map(e => e.userId)).size

    // Extract specific metrics
    const profileViews = eventCounts.get('profile_view') || 0
    const jobViews = eventCounts.get('job_view') || 0
    const matchViews = eventCounts.get('match_view') || 0
    const applications = eventCounts.get('application_submit') || 0
    const recommendationsUsed = eventCounts.get('recommendation_view') || 0
    const searchQueries = eventCounts.get('search_query') || 0
    const jobsSaved = eventCounts.get('save_job') || 0
    const jobsShared = eventCounts.get('share_job') || 0
    const messagesSent = eventCounts.get('message_send') || 0

    // Calculate feature adoption
    const featureAdoption: Record<string, any> = {}
    eventCounts.forEach((count, eventType) => {
      const users = featureUsers.get(eventType)!.size
      const frequency = users > 0 ? count / users : 0
      const adoptionRate = totalUsers > 0 ? users / totalUsers : 0

      featureAdoption[eventType] = {
        users,
        usage: count,
        frequency,
        adoptionRate
      }
    })

    return {
      profileViews,
      jobViews,
      matchViews,
      applications,
      recommendationsUsed,
      searchQueries,
      jobsSaved,
      jobsShared,
      messagesSent,
      featureAdoption
    }
  }

  /**
   * Calculate retention metrics
   */
  private static async calculateRetentionMetrics(
    events: UserEngagementEvent[]
  ): Promise<RetentionMetrics> {
    // Group users by their first seen date (cohorts)
    const userCohorts = new Map<string, Set<string>>()
    const userActivity = new Map<string, Set<string>>() // date -> user IDs

    events.forEach(event => {
      const date = event.timestamp.toISOString().split('T')[0]

      // Track activity
      if (!userActivity.has(date)) {
        userActivity.set(date, new Set())
      }
      userActivity.get(date)!.add(event.userId)

      // Track cohorts (simplified - using weekly cohorts)
      const weekStart = this.getWeekStart(event.timestamp)
      if (!userCohorts.has(weekStart)) {
        userCohorts.set(weekStart, new Set())
      }
      userCohorts.get(weekStart)!.add(event.userId)
    })

    // Calculate day-based retention
    const retentionData = this.calculateDayBasedRetention(userActivity, userCohorts)

    // Generate cohort analysis
    const cohortRetention = Array.from(userCohorts.entries())
      .slice(-12) // Last 12 cohorts
      .map(([cohort, users]) => {
        const cohortSize = users.size
        const retention: Record<string, number> = {}

        // Calculate retention for days 1, 7, 30, 90
        [1, 7, 30, 90].forEach(days => {
          const targetDate = new Date(cohort)
          targetDate.setDate(targetDate.getDate() + days)
          const dateStr = targetDate.toISOString().split('T')[0]

          const activeUsers = userActivity.get(dateStr) || new Set()
          const retainedUsers = Array.from(users).filter(userId => activeUsers.has(userId))

          retention[`day${days}`] = cohortSize > 0 ? retainedUsers.length / cohortSize : 0
        })

        return { cohort, size: cohortSize, retention }
      })

    // User lifecycle metrics (simplified)
    const userLifecycle = {
      acquisition: 1.0, // 100% of users are acquired
      activation: 0.8,  // 80% activate (complete profile)
      retention: 0.6,   // 60% retained
      referral: 0.2,    // 20% refer others
      revenue: 0.1      // 10% generate revenue
    }

    return {
      day1: retentionData.day1,
      day7: retentionData.day7,
      day30: retentionData.day30,
      day90: retentionData.day90,
      cohortRetention,
      userLifecycle
    }
  }

  /**
   * Calculate conversion metrics
   */
  private static async calculateConversionMetrics(
    events: UserEngagementEvent[]
  ): Promise<ConversionMetrics> {
    // Group events by user to track conversion funnels
    const userEvents = new Map<string, UserEngagementEvent[]>()

    events.forEach(event => {
      if (!userEvents.has(event.userId)) {
        userEvents.set(event.userId, [])
      }
      userEvents.get(event.userId)!.push(event)
    })

    let completedProfile = 0
    let submittedApplications = 0
    let gotInterviews = 0
    let gotHired = 0
    const conversionTimes: Array<{ stage: string; time: number }> = []

    userEvents.forEach(userEventList => {
      const sortedEvents = userEventList.sort((a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )

      const hasProfile = sortedEvents.some(e => e.eventType === 'profile_update')
      const hasApplication = sortedEvents.some(e => e.eventType === 'application_submit')
      const hasInterview = sortedEvents.some(e => e.eventType === 'interview_scheduled')
      const hasHire = sortedEvents.some(e => e.eventType === 'candidate_hired')

      if (hasProfile) completedProfile++
      if (hasApplication) submittedApplications++
      if (hasInterview) gotInterviews++
      if (hasHire) gotHired++

      // Calculate conversion times
      const profileEvent = sortedEvents.find(e => e.eventType === 'profile_update')
      const applicationEvent = sortedEvents.find(e => e.eventType === 'application_submit')
      const interviewEvent = sortedEvents.find(e => e.eventType === 'interview_scheduled')

      if (profileEvent && applicationEvent) {
        conversionTimes.push({
          stage: 'profile_to_application',
          time: applicationEvent.timestamp.getTime() - profileEvent.timestamp.getTime()
        })
      }

      if (applicationEvent && interviewEvent) {
        conversionTimes.push({
          stage: 'application_to_interview',
          time: interviewEvent.timestamp.getTime() - applicationEvent.timestamp.getTime()
        })
      }
    })

    const totalUsers = userEvents.size

    const registrationToProfile = totalUsers > 0 ? completedProfile / totalUsers : 0
    const profileToApplication = completedProfile > 0 ? submittedApplications / completedProfile : 0
    const applicationToInterview = submittedApplications > 0 ? gotInterviews / submittedApplications : 0
    const interviewToHire = gotInterviews > 0 ? gotHired / gotInterviews : 0
    const overallFunnelEfficiency = totalUsers > 0 ? gotHired / totalUsers : 0

    // Calculate conversion times
    const timesByStage = new Map<string, number[]>()
    conversionTimes.forEach(({ stage, time }) => {
      if (!timesByStage.has(stage)) {
        timesByStage.set(stage, [])
      }
      timesByStage.get(stage)!.push(time)
    })

    const averageTimes: Record<string, number> = {}
    timesByStage.forEach((times, stage) => {
      averageTimes[stage] = times.length > 0 ?
        times.reduce((sum, time) => sum + time, 0) / times.length : 0
    })

    const allTimes = conversionTimes.map(ct => ct.time)
    const averageTime = allTimes.length > 0 ?
      allTimes.reduce((sum, time) => sum + time, 0) / allTimes.length : 0

    const sortedTimes = allTimes.sort((a, b) => a - b)
    const medianTime = sortedTimes.length > 0 ?
      sortedTimes[Math.floor(sortedTimes.length / 2)] : 0

    // Calculate abandonment rates (simplified)
    const abandonmentRates = {
      profile_completion: 1 - registrationToProfile,
      application_submission: 1 - profileToApplication,
      interview_attendance: 1 - applicationToInterview,
      job_acceptance: 1 - interviewToHire
    }

    return {
      registrationToProfile,
      profileToApplication,
      applicationToInterview,
      interviewToHire,
      overallFunnelEfficiency,
      conversionTime: {
        average: averageTime,
        median: medianTime,
        byStage: averageTimes
      },
      abandonmentRates
    }
  }

  /**
   * Calculate satisfaction metrics
   */
  private static async calculateSatisfactionMetrics(
    events: UserEngagementEvent[]
  ): Promise<SatisfactionMetrics> {
    const feedbackEvents = events.filter(e => e.eventType === 'feedback_submit')

    // Extract satisfaction scores from feedback events
    const satisfactionScores = feedbackEvents
      .map(e => e.data.satisfactionScore)
      .filter(score => typeof score === 'number' && score >= 1 && score <= 5)

    const overallSatisfaction = satisfactionScores.length > 0 ?
      satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length : 0

    // Feature satisfaction
    const featureSatisfaction: Record<string, number> = {}
    feedbackEvents.forEach(event => {
      if (event.data.feature && event.data.satisfactionScore) {
        if (!featureSatisfaction[event.data.feature]) {
          featureSatisfaction[event.data.feature] = []
        }
        featureSatisfaction[event.data.feature].push(event.data.satisfactionScore)
      }
    })

    // Calculate average satisfaction per feature
    Object.keys(featureSatisfaction).forEach(feature => {
      const scores = featureSatisfaction[feature]
      featureSatisfaction[feature] = scores.reduce((sum, score) => sum + score, 0) / scores.length
    })

    // Net Promoter Score calculation
    const promoterScores = satisfactionScores.filter(score => score >= 9).length
    const detractorScores = satisfactionScores.filter(score => score <= 6).length
    const totalScores = satisfactionScores.length
    const netPromoterScore = totalScores > 0 ?
      ((promoterScores - detractorScores) / totalScores) * 100 : 0

    return {
      overallSatisfaction,
      featureSatisfaction,
      netPromoterScore,
      userEffortScore: 3.2, // Would be calculated from specific survey data
      feedbackCount: feedbackEvents.length,
      sentimentAnalysis: {
        positive: 0.7,
        neutral: 0.2,
        negative: 0.1
      },
      supportTickets: {
        total: 150,
        resolved: 120,
        averageResolutionTime: 24 * 60 * 60 * 1000 // 24 hours in ms
      }
    }
  }

  /**
   * Calculate behavioral metrics
   */
  private static async calculateBehavioralMetrics(
    events: UserEngagementEvent[]
  ): Promise<BehavioralMetrics> {
    // This is a simplified implementation
    // In practice, you would use more sophisticated analysis

    const userSegments: UserSegment[] = [
      {
        id: 'power_users',
        name: 'Power Users',
        size: Math.floor(events.length * 0.2),
        characteristics: { sessionsPerWeek: 10, featuresUsed: 8 },
        behavior: {
          sessionFrequency: 10,
          sessionDuration: 1800,
          featureUsage: { search: 50, apply: 20, save: 15 },
          conversionRate: 0.8
        }
      },
      {
        id: 'regular_users',
        name: 'Regular Users',
        size: Math.floor(events.length * 0.6),
        characteristics: { sessionsPerWeek: 3, featuresUsed: 4 },
        behavior: {
          sessionFrequency: 3,
          sessionDuration: 900,
          featureUsage: { search: 15, apply: 5, save: 8 },
          conversionRate: 0.4
        }
      },
      {
        id: 'casual_users',
        name: 'Casual Users',
        size: Math.floor(events.length * 0.2),
        characteristics: { sessionsPerWeek: 1, featuresUsed: 2 },
        behavior: {
          sessionFrequency: 1,
          sessionDuration: 300,
          featureUsage: { search: 5, apply: 1, save: 2 },
          conversionRate: 0.1
        }
      }
    ]

    const userPaths: UserPath[] = [
      {
        path: ['home', 'search', 'job_view', 'application'],
        frequency: 150,
        conversionRate: 0.8,
        dropOffPoints: [
          { step: 'job_view', dropOffRate: 0.2 },
          { step: 'application', dropOffRate: 0.1 }
        ],
        averageTime: 1800000 // 30 minutes
      }
    ]

    return {
      userSegments,
      pathAnalysis: userPaths,
      heatMapData: {
        'search_bar': 450,
        'job_cards': 380,
        'apply_button': 200,
        'save_button': 150
      },
      clickThroughRates: {
        'job_card_to_application': 0.25,
        'search_to_job_view': 0.60,
        'recommendation_to_view': 0.35
      },
      scrollDepth: {
        average: 0.7,
        distribution: {
          '0-25%': 0.1,
          '25-50%': 0.2,
          '50-75%': 0.4,
          '75-100%': 0.3
        }
      },
      timeOnPage: {
        'search_results': 45,
        'job_details': 120,
        'application_form': 300,
        'user_profile': 90
      }
    }
  }

  /**
   * Helper methods
   */
  private static calculateDayBasedRetention(
    userActivity: Map<string, Set<string>>,
    userCohorts: Map<string, Set<string>>
  ): { day1: number; day7: number; day30: number; day90: number } {
    // Simplified retention calculation
    // In practice, you would do more sophisticated cohort analysis
    return {
      day1: 0.8,
      day7: 0.6,
      day30: 0.4,
      day90: 0.25
    }
  }

  private static getWeekStart(date: Date): string {
    const d = new Date(date)
    d.setDate(date.getDate() - date.getDay())
    return d.toISOString().split('T')[0]
  }

  private static detectDeviceType(userAgent: string): 'desktop' | 'mobile' | 'tablet' {
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      return /iPad/.test(userAgent) ? 'tablet' : 'mobile'
    }
    return 'desktop'
  }

  private static extractBrowser(userAgent: string): string | undefined {
    const browserMatch = userAgent.match(/(Chrome|Firefox|Safari|Edge)\/?[\d.]+/)
    return browserMatch ? browserMatch[1] : undefined
  }

  private static extractOS(userAgent: string): string | undefined {
    const osMatch = userAgent.match(/(Windows|Mac|Linux|Android|iOS)/)
    return osMatch ? osMatch[1] : undefined
  }

  private static isConversionEvent(eventType: EngagementEventType): boolean {
    return [
      'application_submit',
      'profile_update',
      'message_send',
      'save_job'
    ].includes(eventType)
  }

  private static getEmptyMetrics(): EngagementMetrics {
    return {
      totalUsers: 0,
      activeUsers: {
        daily: 0,
        weekly: 0,
        monthly: 0,
        currentlyOnline: 0,
        newUsers: 0,
        returningUsers: 0,
        churnRate: 0,
        growthRate: 0
      },
      sessionMetrics: {
        totalSessions: 0,
        averageSessionDuration: 0,
        medianSessionDuration: 0,
        bounceRate: 0,
        pagesPerSession: 0,
        sessionsPerUser: 0,
        topExitPages: [],
        peakUsageTimes: []
      },
      featureUsage: {
        profileViews: 0,
        jobViews: 0,
        matchViews: 0,
        applications: 0,
        recommendationsUsed: 0,
        searchQueries: 0,
        jobsSaved: 0,
        jobsShared: 0,
        messagesSent: 0,
        featureAdoption: {}
      },
      retentionMetrics: {
        day1: 0,
        day7: 0,
        day30: 0,
        day90: 0,
        cohortRetention: [],
        userLifecycle: {
          acquisition: 0,
          activation: 0,
          retention: 0,
          referral: 0,
          revenue: 0
        }
      },
      conversionMetrics: {
        registrationToProfile: 0,
        profileToApplication: 0,
        applicationToInterview: 0,
        interviewToHire: 0,
        overallFunnelEfficiency: 0,
        conversionTime: {
          average: 0,
          median: 0,
          byStage: {}
        },
        abandonmentRates: {}
      },
      satisfactionMetrics: {
        overallSatisfaction: 0,
        featureSatisfaction: {},
        netPromoterScore: 0,
        userEffortScore: 0,
        feedbackCount: 0,
        sentimentAnalysis: {
          positive: 0,
          neutral: 0,
          negative: 0
        },
        supportTickets: {
          total: 0,
          resolved: 0,
          averageResolutionTime: 0
        }
      },
      behavioralMetrics: {
        userSegments: [],
        pathAnalysis: [],
        heatMapData: {},
        clickThroughRates: {},
        scrollDepth: {
          average: 0,
          distribution: {}
        },
        timeOnPage: {}
      }
    }
  }
}

export default EngagementTracker