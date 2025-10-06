import { logger } from '@/lib/logger'

export interface ImplicitAction {
  id: string
  userId: string
  sessionId: string
  actionType: ImplicitActionType
  entityType: 'match' | 'job' | 'candidate' | 'recommendation'
  entityId: string
  timestamp: Date
  context: {
    source: string
    duration?: number
    position?: number
    filters?: Record<string, any>
    searchQuery?: string
    [key: string]: any
  }
  value: number // Implicit satisfaction signal (0-1)
  confidence: number // Confidence in the implicit signal (0-1)
}

export type ImplicitActionType =
  | 'view_time'
  | 'scroll_depth'
  | 'click_through'
  | 'save_action'
  | 'share_action'
  | 'apply_action'
  | 'profile_update'
  | 'search_refinement'
  | 'filter_usage'
  | 'recommendation_click'
  | 'repeat_view'
  | 'comparison'
  | 'engagement_depth'

export interface ImplicitSignal {
  userId: string
  entityId: string
  entityType: string
  signals: ImplicitAction[]
  aggregateScore: number
  confidence: number
  patterns: BehaviorPattern[]
  lastUpdated: Date
}

export interface BehaviorPattern {
  patternType: 'temporal' | 'sequential' | 'contextual' | 'preference'
  description: string
  strength: number // 0-1
  frequency: number
  associatedValue: number
  conditions: Record<string, any>
}

export interface ImplicitFeedbackSummary {
  totalActions: number
  averageEngagementScore: number
  topActionTypes: Array<{
    type: ImplicitActionType
    count: number
    averageValue: number
  }>
  engagementDistribution: EngagementDistribution
  userSegments: UserSegment[]
  behavioralInsights: BehavioralInsight[]
}

export interface EngagementDistribution {
  low: number    // 0-0.3
  medium: number // 0.3-0.7
  high: number   // 0.7-1.0
  average: number
}

export interface UserSegment {
  segmentId: string
  name: string
  size: number
  characteristics: Record<string, any>
  averageEngagement: number
  commonPatterns: BehaviorPattern[]
  recommendations: string[]
}

export interface BehavioralInsight {
  insight: string
  category: 'engagement' | 'preference' | 'friction' | 'opportunity'
  confidence: number
  affectedUsers: number
  potentialImpact: number
  recommendedActions: string[]
}

export interface ImplicitTrackingConfig {
  enabledActionTypes: ImplicitActionType[]
  trackingSensitivity: number // 0-1, affects confidence calculations
  sessionTimeout: number // milliseconds
  minConfidenceThreshold: number // 0-1
  aggregationWindow: number // milliseconds for aggregating signals
  patternDetectionMinOccurrences: number
  anonymizeData: boolean
}

export class ImplicitFeedbackTracker {
  private config: ImplicitTrackingConfig
  private userSessions: Map<string, UserSession> = new Map()
  private signalBuffer: Map<string, ImplicitAction[]> = new Map()
  private patternCache: Map<string, BehaviorPattern[]> = new Map()

  constructor(config: Partial<ImplicitTrackingConfig> = {}) {
    this.config = {
      enabledActionTypes: [
        'view_time',
        'scroll_depth',
        'click_through',
        'save_action',
        'apply_action',
        'recommendation_click',
        'repeat_view'
      ],
      trackingSensitivity: 0.7,
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      minConfidenceThreshold: 0.3,
      aggregationWindow: 5 * 60 * 1000, // 5 minutes
      patternDetectionMinOccurrences: 3,
      anonymizeData: true,
      ...config
    }
  }

  /**
   * Track an implicit user action
   */
  async trackAction(action: Omit<ImplicitAction, 'id' | 'value' | 'confidence'>): Promise<void> {
    try {
      // Validate action
      if (!this.config.enabledActionTypes.includes(action.actionType)) {
        return
      }

      // Calculate implicit value and confidence
      const { value, confidence } = this.calculateImplicitValue(action)

      const implicitAction: ImplicitAction = {
        id: this.generateActionId(),
        ...action,
        value,
        confidence,
        timestamp: new Date()
      }

      // Add to signal buffer
      this.addToBuffer(implicitAction)

      // Update user session
      this.updateUserSession(implicitAction)

      // Check for pattern detection
      this.detectPatterns(implicitAction.userId)

      logger.debug('Implicit action tracked', {
        userId: action.userId,
        actionType: action.actionType,
        value,
        confidence
      })

    } catch (error) {
      logger.error('Error tracking implicit action', { error, action })
    }
  }

  /**
   * Get implicit signals for a user
   */
  async getUserSignals(userId: string, entityType?: string): Promise<ImplicitSignal[]> {
    try {
      const userActions = this.getUserActions(userId)

      if (userActions.length === 0) {
        return []
      }

      // Group actions by entity
      const entityGroups = new Map<string, ImplicitAction[]>()

      userActions.forEach(action => {
        if (entityType && action.entityType !== entityType) {
          return
        }

        const key = `${action.entityType}:${action.entityId}`
        if (!entityGroups.has(key)) {
          entityGroups.set(key, [])
        }
        entityGroups.get(key)!.push(action)
      })

      // Generate signals for each entity
      const signals: ImplicitSignal[] = []

      entityGroups.forEach((actions, entityKey) => {
        const [type, id] = entityKey.split(':')
        const signal = this.generateSignal(userId, id, type, actions)
        signals.push(signal)
      })

      return signals.sort((a, b) => b.aggregateScore - a.aggregateScore)

    } catch (error) {
      logger.error('Error getting user signals', { error, userId })
      return []
    }
  }

  /**
   * Get implicit feedback summary
   */
  async getImplicitFeedbackSummary(
    filters: {
      dateRange?: { start: Date; end: Date }
      userIds?: string[]
      actionTypes?: ImplicitActionType[]
    } = {}
  ): Promise<ImplicitFeedbackSummary> {
    try {
      const actions = this.getFilteredActions(filters)

      if (actions.length === 0) {
        return this.getEmptySummary()
      }

      // Calculate average engagement score
      const averageEngagementScore = actions.reduce((sum, action) => sum + action.value, 0) / actions.length

      // Analyze action types
      const actionTypesMap = new Map<ImplicitActionType, { count: number; totalValue: number }>()
      actions.forEach(action => {
        if (!actionTypesMap.has(action.actionType)) {
          actionTypesMap.set(action.actionType, { count: 0, totalValue: 0 })
        }
        const stats = actionTypesMap.get(action.actionType)!
        stats.count++
        stats.totalValue += action.value
      })

      const topActionTypes = Array.from(actionTypesMap.entries())
        .map(([type, stats]) => ({
          type,
          count: stats.count,
          averageValue: stats.totalValue / stats.count
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      // Calculate engagement distribution
      const engagementDistribution = this.calculateEngagementDistribution(actions)

      // Generate user segments
      const userSegments = await this.generateUserSegments(actions)

      // Generate behavioral insights
      const behavioralInsights = await this.generateBehavioralInsights(actions)

      return {
        totalActions: actions.length,
        averageEngagementScore: Math.round(averageEngagementScore * 100) / 100,
        topActionTypes,
        engagementDistribution,
        userSegments,
        behavioralInsights
      }

    } catch (error) {
      logger.error('Error generating implicit feedback summary', { error })
      return this.getEmptySummary()
    }
  }

  /**
   * Get behavior patterns for a user
   */
  async getUserPatterns(userId: string): Promise<BehaviorPattern[]> {
    try {
      const cachedPatterns = this.patternCache.get(userId)
      if (cachedPatterns) {
        return cachedPatterns
      }

      const actions = this.getUserActions(userId)
      const patterns = await this.detectUserPatterns(actions)

      // Cache patterns
      this.patternCache.set(userId, patterns)

      return patterns

    } catch (error) {
      logger.error('Error getting user patterns', { error, userId })
      return []
    }
  }

  /**
   * Clean up old data
   */
  async cleanup(olderThan: Date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)): Promise<void> {
    try {
      // Clean up old sessions
      for (const [userId, session] of this.userSessions.entries()) {
        if (session.lastActivity < olderThan) {
          this.userSessions.delete(userId)
        }
      }

      // Clean up old buffered actions
      for (const [key, actions] of this.signalBuffer.entries()) {
        const filteredActions = actions.filter(action => action.timestamp > olderThan)
        if (filteredActions.length === 0) {
          this.signalBuffer.delete(key)
        } else {
          this.signalBuffer.set(key, filteredActions)
        }
      }

      // Clean up old pattern cache
      for (const [userId, patterns] of this.patternCache.entries()) {
        // Keep only recent patterns
        this.patternCache.set(userId, patterns.filter(p => {
          // Pattern age check would go here
          return true
        }))
      }

      logger.info('Implicit feedback cleanup completed', {
        sessionsCleaned: this.userSessions.size,
        bufferedActionsCleaned: Array.from(this.signalBuffer.values()).reduce((sum, actions) => sum + actions.length, 0)
      })

    } catch (error) {
      logger.error('Error during cleanup', { error })
    }
  }

  // Private helper methods

  private calculateImplicitValue(action: Omit<ImplicitAction, 'id' | 'value' | 'confidence'>): { value: number; confidence: number } {
    let value = 0
    let confidence = 0.5 // Base confidence

    switch (action.actionType) {
      case 'view_time':
        // Value based on duration (up to 2 minutes)
        const duration = action.context.duration || 0
        value = Math.min(duration / 120000, 1) // 2 minutes = full value
        confidence = duration > 10000 ? 0.8 : 0.5 // More confident with longer view times
        break

      case 'scroll_depth':
        // Value based on how far user scrolled
        const scrollDepth = action.context.scrollDepth || 0
        value = scrollDepth / 100
        confidence = scrollDepth > 50 ? 0.7 : 0.4
        break

      case 'click_through':
        value = 0.8 // Strong positive signal
        confidence = 0.9
        break

      case 'save_action':
        value = 0.9 // Very strong positive signal
        confidence = 0.95
        break

      case 'apply_action':
        value = 1.0 // Maximum positive signal
        confidence = 1.0
        break

      case 'recommendation_click':
        value = 0.7
        confidence = 0.8
        break

      case 'repeat_view':
        // Value increases with repeat views
        value = 0.6
        confidence = 0.7
        break

      case 'search_refinement':
        value = 0.4 // Moderate engagement signal
        confidence = 0.6
        break

      case 'filter_usage':
        value = 0.3 // Weak engagement signal
        confidence = 0.5
        break

      default:
        value = 0.2
        confidence = 0.3
    }

    // Apply tracking sensitivity
    value = value * this.config.trackingSensitivity
    confidence = confidence * this.config.trackingSensitivity

    // Ensure minimum confidence threshold
    if (confidence < this.config.minConfidenceThreshold) {
      confidence = this.config.minConfidenceThreshold
    }

    return {
      value: Math.round(value * 100) / 100,
      confidence: Math.round(confidence * 100) / 100
    }
  }

  private addToBuffer(action: ImplicitAction): void {
    const key = `${action.userId}:${action.entityType}:${action.entityId}`

    if (!this.signalBuffer.has(key)) {
      this.signalBuffer.set(key, [])
    }

    const buffer = this.signalBuffer.get(key)!
    buffer.push(action)

    // Keep only recent actions in buffer
    const cutoff = new Date(Date.now() - this.config.aggregationWindow)
    const filteredBuffer = buffer.filter(a => a.timestamp > cutoff)
    this.signalBuffer.set(key, filteredBuffer)
  }

  private updateUserSession(action: ImplicitAction): void {
    const userId = action.userId

    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, {
        userId,
        startTime: new Date(),
        lastActivity: action.timestamp,
        actions: [],
        sessionId: action.sessionId
      })
    }

    const session = this.userSessions.get(userId)!
    session.lastActivity = action.timestamp
    session.actions.push(action)

    // Update session ID if changed
    if (action.sessionId !== session.sessionId) {
      session.sessionId = action.sessionId
    }
  }

  private detectPatterns(userId: string): void {
    const actions = this.getUserActions(userId)
    if (actions.length < this.config.patternDetectionMinOccurrences) {
      return
    }

    // Pattern detection logic would go here
    // For now, we'll just trigger cache refresh
    this.patternCache.delete(userId)
  }

  private getUserActions(userId: string): ImplicitAction[] {
    const session = this.userSessions.get(userId)
    if (!session) {
      return []
    }

    return session.actions
  }

  private generateSignal(userId: string, entityId: string, entityType: string, actions: ImplicitAction[]): ImplicitSignal {
    // Calculate weighted average score
    const totalWeight = actions.reduce((sum, action) => sum + (action.value * action.confidence), 0)
    const totalConfidence = actions.reduce((sum, action) => sum + action.confidence, 0)

    const aggregateScore = totalConfidence > 0 ? totalWeight / totalConfidence : 0
    const confidence = Math.min(totalConfidence / actions.length, 1)

    // Detect patterns
    const patterns = this.detectActionPatterns(actions)

    return {
      userId,
      entityId,
      entityType,
      signals: actions,
      aggregateScore: Math.round(aggregateScore * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
      patterns,
      lastUpdated: new Date()
    }
  }

  private detectActionPatterns(actions: ImplicitAction[]): BehaviorPattern[] {
    const patterns: BehaviorPattern[] = []

    // Detect temporal patterns (time-based)
    const temporalPattern = this.detectTemporalPattern(actions)
    if (temporalPattern) {
      patterns.push(temporalPattern)
    }

    // Detect sequential patterns (action sequences)
    const sequentialPattern = this.detectSequentialPattern(actions)
    if (sequentialPattern) {
      patterns.push(sequentialPattern)
    }

    // Detect preference patterns (consistent choices)
    const preferencePattern = this.detectPreferencePattern(actions)
    if (preferencePattern) {
      patterns.push(preferencePattern)
    }

    return patterns
  }

  private detectTemporalPattern(actions: ImplicitAction[]): BehaviorPattern | null {
    if (actions.length < 3) return null

    // Group actions by hour of day
    const hourlyActivity = new Map<number, number>()
    actions.forEach(action => {
      const hour = action.timestamp.getHours()
      hourlyActivity.set(hour, (hourlyActivity.get(hour) || 0) + 1)
    })

    // Find peak activity hours
    const sortedHours = Array.from(hourlyActivity.entries())
      .sort(([, a], [, b]) => b - a)

    if (sortedHours.length === 0) return null

    const [peakHour, peakCount] = sortedHours[0]
    const totalActions = actions.length
    const strength = peakCount / totalActions

    if (strength < 0.3) return null // Not strong enough pattern

    return {
      patternType: 'temporal',
      description: `User most active around ${peakHour}:00`,
      strength: Math.round(strength * 100) / 100,
      frequency: peakCount,
      associatedValue: strength,
      conditions: { peakHour }
    }
  }

  private detectSequentialPattern(actions: ImplicitAction[]): BehaviorPattern | null {
    if (actions.length < 5) return null

    // Look for common action sequences
    const sequences = new Map<string, number>()

    for (let i = 0; i < actions.length - 2; i++) {
      const sequence = `${actions[i].actionType} -> ${actions[i + 1].actionType} -> ${actions[i + 2].actionType}`
      sequences.set(sequence, (sequences.get(sequence) || 0) + 1)
    }

    const sortedSequences = Array.from(sequences.entries())
      .sort(([, a], [, b]) => b - a)

    if (sortedSequences.length === 0) return null

    const [sequence, count] = sortedSequences[0]
    const strength = count / (actions.length - 2)

    if (strength < 0.2) return null

    return {
      patternType: 'sequential',
      description: `Common sequence: ${sequence}`,
      strength: Math.round(strength * 100) / 100,
      frequency: count,
      associatedValue: strength,
      conditions: { sequence }
    }
  }

  private detectPreferencePattern(actions: ImplicitAction[]): BehaviorPattern | null {
    // Group actions by entity type and analyze preferences
    const entityTypeActions = new Map<string, ImplicitAction[]>()

    actions.forEach(action => {
      if (!entityTypeActions.has(action.entityType)) {
        entityTypeActions.set(action.entityType, [])
      }
      entityTypeActions.get(action.entityType)!.push(action)
    })

    for (const [entityType, entityActions] of entityTypeActions.entries()) {
      if (entityActions.length < 3) continue

      // Calculate average engagement for this entity type
      const avgEngagement = entityActions.reduce((sum, action) => sum + action.value, 0) / entityActions.length

      if (avgEngagement > 0.7) {
        return {
          patternType: 'preference',
          description: `Strong preference for ${entityType}`,
          strength: Math.round(avgEngagement * 100) / 100,
          frequency: entityActions.length,
          associatedValue: avgEngagement,
          conditions: { entityType }
        }
      }
    }

    return null
  }

  private getFilteredActions(filters: {
    dateRange?: { start: Date; end: Date }
    userIds?: string[]
    actionTypes?: ImplicitActionType[]
  }): ImplicitAction[] {
    let allActions: ImplicitAction[] = []

    // Collect all actions from sessions
    this.userSessions.forEach(session => {
      allActions = allActions.concat(session.actions)
    })

    // Apply filters
    if (filters.dateRange) {
      allActions = allActions.filter(action =>
        action.timestamp >= filters.dateRange!.start &&
        action.timestamp <= filters.dateRange!.end
      )
    }

    if (filters.userIds?.length) {
      allActions = allActions.filter(action =>
        filters.userIds!.includes(action.userId)
      )
    }

    if (filters.actionTypes?.length) {
      allActions = allActions.filter(action =>
        filters.actionTypes!.includes(action.actionType)
      )
    }

    return allActions
  }

  private calculateEngagementDistribution(actions: ImplicitAction[]): EngagementDistribution {
    const distribution = { low: 0, medium: 0, high: 0 }

    actions.forEach(action => {
      if (action.value <= 0.3) distribution.low++
      else if (action.value <= 0.7) distribution.medium++
      else distribution.high++
    })

    const total = actions.length
    const average = total > 0 ?
      actions.reduce((sum, action) => sum + action.value, 0) / total : 0

    return {
      ...distribution,
      average: Math.round(average * 100) / 100
    }
  }

  private async generateUserSegments(actions: ImplicitAction[]): Promise<UserSegment[]> {
    // Segment users by engagement level
    const userEngagement = new Map<string, number>()

    actions.forEach(action => {
      const current = userEngagement.get(action.userId) || 0
      userEngagement.set(action.userId, current + action.value)
    })

    // Calculate average engagement per user
    const userAverages = new Map<string, number>()
    const userActionCounts = new Map<string, number>()

    actions.forEach(action => {
      const count = userActionCounts.get(action.userId) || 0
      userActionCounts.set(action.userId, count + 1)
    })

    userEngagement.forEach((total, userId) => {
      const count = userActionCounts.get(userId) || 1
      userAverages.set(userId, total / count)
    })

    const averages = Array.from(userAverages.values())
    const overallAverage = averages.reduce((sum, avg) => sum + avg, 0) / averages.length

    // Create segments
    const segments: UserSegment[] = [
      {
        segmentId: 'high_engagement',
        name: 'Highly Engaged Users',
        size: Array.from(userAverages.values()).filter(avg => avg > overallAverage + 0.2).length,
        characteristics: { averageEngagement: overallAverage + 0.3, frequentInteraction: true },
        averageEngagement: overallAverage + 0.3,
        commonPatterns: [],
        recommendations: ['Premium features', 'Advanced tools', 'Early access']
      },
      {
        segmentId: 'medium_engagement',
        name: 'Moderately Engaged Users',
        size: Array.from(userAverages.values()).filter(avg => avg >= overallAverage - 0.1 && avg <= overallAverage + 0.2).length,
        characteristics: { averageEngagement: overallAverage, regularInteraction: true },
        averageEngagement: overallAverage,
        commonPatterns: [],
        recommendations: ['Personalized content', 'Engagement campaigns', 'Skill development']
      },
      {
        segmentId: 'low_engagement',
        name: 'Low Engagement Users',
        size: Array.from(userAverages.values()).filter(avg => avg < overallAverage - 0.1).length,
        characteristics: { averageEngagement: overallAverage - 0.2, occasionalInteraction: true },
        averageEngagement: overallAverage - 0.2,
        commonPatterns: [],
        recommendations: ['Onboarding improvement', 'Simplified interface', 'Targeted re-engagement']
      }
    ]

    return segments
  }

  private async generateBehavioralInsights(actions: ImplicitAction[]): Promise<BehavioralInsight[]> {
    const insights: BehavioralInsight[] = []

    // Generate insights based on action patterns
    const actionTypes = new Map<ImplicitActionType, number>()
    actions.forEach(action => {
      actionTypes.set(action.actionType, (actionTypes.get(action.actionType) || 0) + 1)
    })

    // Most common action type
    const sortedActionTypes = Array.from(actionTypes.entries())
      .sort(([, a], [, b]) => b - a)

    if (sortedActionTypes.length > 0) {
      const [topActionType, count] = sortedActionTypes[0]
      const percentage = (count / actions.length) * 100

      insights.push({
        insight: `${topActionType} is the most common user action (${percentage.toFixed(1)}% of all actions)`,
        category: 'engagement',
        confidence: 0.8,
        affectedUsers: new Set(actions.map(a => a.userId)).size,
        potentialImpact: 0.6,
        recommendedActions: [`Optimize ${topActionType} flow`, `Add more ${topActionType} opportunities`]
      })
    }

    // Low engagement insight
    const lowEngagementActions = actions.filter(a => a.value < 0.3)
    if (lowEngagementActions.length > actions.length * 0.3) {
      insights.push({
        insight: 'High percentage of low-engagement actions detected',
        category: 'friction',
        confidence: 0.7,
        affectedUsers: new Set(lowEngagementActions.map(a => a.userId)).size,
        potentialImpact: 0.8,
        recommendedActions: ['Review user journey', 'Simplify interfaces', 'Add engagement features']
      })
    }

    return insights
  }

  private async detectUserPatterns(actions: ImplicitAction[]): Promise<BehaviorPattern[]> {
    return this.detectActionPatterns(actions)
  }

  private getEmptySummary(): ImplicitFeedbackSummary {
    return {
      totalActions: 0,
      averageEngagementScore: 0,
      topActionTypes: [],
      engagementDistribution: {
        low: 0,
        medium: 0,
        high: 0,
        average: 0
      },
      userSegments: [],
      behavioralInsights: []
    }
  }

  private generateActionId(): string {
    return `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

interface UserSession {
  userId: string
  sessionId: string
  startTime: Date
  lastActivity: Date
  actions: ImplicitAction[]
}

export default ImplicitFeedbackTracker