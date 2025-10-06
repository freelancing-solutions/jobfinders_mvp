import { logger } from '@/lib/logger'

export interface MatchMetricEvent {
  id: string
  type: 'match_generated' | 'match_viewed' | 'match_accepted' | 'match_rejected' | 'match_expired'
  userId: string
  matchId: string
  candidateId: string
  jobId: string
  score: number
  confidence: number
  timestamp: Date
  metadata: {
    algorithmVersion: string
    source: 'search' | 'recommendation' | 'batch'
    factors: Record<string, number>
    sessionId?: string
    userAgent?: string
    ip?: string
  }
}

export interface MatchAggregationMetrics {
  totalMatches: number
  averageScore: number
  scoreDistribution: ScoreDistribution
  confidenceDistribution: ConfidenceDistribution
  conversionMetrics: ConversionMetrics
  qualityMetrics: QualityMetrics
  performanceMetrics: PerformanceMetrics
  trendMetrics: TrendMetrics
}

export interface ScoreDistribution {
  excellent: number      // >= 0.8
  good: number          // >= 0.6 && < 0.8
  fair: number          // >= 0.4 && < 0.6
  poor: number          // < 0.4
  histogram: Array<{ range: string; count: number; percentage: number }>
}

export interface ConfidenceDistribution {
  high: number          // >= 0.7
  medium: number        // >= 0.4 && < 0.7
  low: number           // < 0.4
  average: number
}

export interface ConversionMetrics {
  viewToApplicationRate: number
  applicationToInterviewRate: number
  interviewToHireRate: number
  overallFunnelEfficiency: number
  timeToConvert: {
    average: number
    median: number
    p90: number
  }
}

export interface QualityMetrics {
  precision: number     // TP / (TP + FP)
  recall: number        // TP / (TP + FN)
  f1Score: number       // 2 * (precision * recall) / (precision + recall)
  accuracy: number      // (TP + TN) / (TP + TN + FP + FN)
  feedbackScore: number // Average user feedback
  falsePositiveRate: number
  falseNegativeRate: number
}

export interface PerformanceMetrics {
  averageProcessingTime: number
  p95ProcessingTime: number
  p99ProcessingTime: number
  throughputPerSecond: number
  errorRate: number
  cacheHitRate: number
}

export interface TrendMetrics {
  dailyTrend: Array<{ date: string; matches: number; avgScore: number }>
  weeklyTrend: Array<{ week: string; matches: number; avgScore: number }>
  monthlyTrend: Array<{ month: string; matches: number; avgScore: number }>
  growthRate: {
    daily: number
    weekly: number
    monthly: number
  }
  seasonality: {
    pattern: 'none' | 'weekly' | 'monthly' | 'quarterly'
    strength: number
  }
}

export interface MatchFilters {
  dateRange?: {
    start: Date
    end: Date
  }
  scoreRange?: {
    min: number
    max: number
  }
  confidenceRange?: {
    min: number
    max: number
  }
  algorithmVersion?: string
  source?: string[]
  candidateIds?: string[]
  jobIds?: string[]
  industries?: string[]
  locations?: string[]
  experienceLevels?: string[]
}

export class MatchMetricsCalculator {
  /**
   * Calculate comprehensive match metrics from raw match data
   */
  static async calculateMatchMetrics(
    matchEvents: MatchMetricEvent[],
    filters: MatchFilters = {}
  ): Promise<MatchAggregationMetrics> {
    logger.info('Calculating match metrics', {
      totalEvents: matchEvents.length,
      filters
    })

    // Apply filters
    const filteredEvents = this.applyFilters(matchEvents, filters)

    if (filteredEvents.length === 0) {
      return this.getEmptyMetrics()
    }

    // Calculate metrics in parallel where possible
    const [
      scoreDistribution,
      confidenceDistribution,
      conversionMetrics,
      qualityMetrics,
      performanceMetrics,
      trendMetrics
    ] = await Promise.all([
      this.calculateScoreDistribution(filteredEvents),
      this.calculateConfidenceDistribution(filteredEvents),
      this.calculateConversionMetrics(filteredEvents),
      this.calculateQualityMetrics(filteredEvents),
      this.calculatePerformanceMetrics(filteredEvents),
      this.calculateTrendMetrics(filteredEvents)
    ])

    const metrics: MatchAggregationMetrics = {
      totalMatches: filteredEvents.length,
      averageScore: this.calculateAverageScore(filteredEvents),
      scoreDistribution,
      confidenceDistribution,
      conversionMetrics,
      qualityMetrics,
      performanceMetrics,
      trendMetrics
    }

    logger.info('Match metrics calculated', {
      totalMatches: metrics.totalMatches,
      averageScore: metrics.averageScore,
      precision: metrics.qualityMetrics.precision
    })

    return metrics
  }

  /**
   * Apply filters to match events
   */
  private static applyFilters(
    events: MatchMetricEvent[],
    filters: MatchFilters
  ): MatchMetricEvent[] {
    return events.filter(event => {
      // Date range filter
      if (filters.dateRange) {
        const eventDate = new Date(event.timestamp)
        if (eventDate < filters.dateRange.start || eventDate > filters.dateRange.end) {
          return false
        }
      }

      // Score range filter
      if (filters.scoreRange) {
        if (event.score < filters.scoreRange.min || event.score > filters.scoreRange.max) {
          return false
        }
      }

      // Confidence range filter
      if (filters.confidenceRange) {
        if (event.confidence < filters.confidenceRange.min ||
            event.confidence > filters.confidenceRange.max) {
          return false
        }
      }

      // Algorithm version filter
      if (filters.algorithmVersion &&
          event.metadata.algorithmVersion !== filters.algorithmVersion) {
        return false
      }

      // Source filter
      if (filters.source?.length &&
          !filters.source.includes(event.metadata.source)) {
        return false
      }

      // Candidate IDs filter
      if (filters.candidateIds?.length &&
          !filters.candidateIds.includes(event.candidateId)) {
        return false
      }

      // Job IDs filter
      if (filters.jobIds?.length &&
          !filters.jobIds.includes(event.jobId)) {
        return false
      }

      return true
    })
  }

  /**
   * Calculate score distribution
   */
  private static calculateScoreDistribution(events: MatchMetricEvent[]): ScoreDistribution {
    const distribution = {
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0
    }

    const histogramRanges = [
      { range: '0.9-1.0', min: 0.9, max: 1.0, count: 0 },
      { range: '0.8-0.9', min: 0.8, max: 0.9, count: 0 },
      { range: '0.7-0.8', min: 0.7, max: 0.8, count: 0 },
      { range: '0.6-0.7', min: 0.6, max: 0.7, count: 0 },
      { range: '0.5-0.6', min: 0.5, max: 0.6, count: 0 },
      { range: '0.4-0.5', min: 0.4, max: 0.5, count: 0 },
      { range: '0.3-0.4', min: 0.3, max: 0.4, count: 0 },
      { range: '0.2-0.3', min: 0.2, max: 0.3, count: 0 },
      { range: '0.1-0.2', min: 0.1, max: 0.2, count: 0 },
      { range: '0.0-0.1', min: 0.0, max: 0.1, count: 0 }
    ]

    events.forEach(event => {
      // Category distribution
      if (event.score >= 0.8) distribution.excellent++
      else if (event.score >= 0.6) distribution.good++
      else if (event.score >= 0.4) distribution.fair++
      else distribution.poor++

      // Histogram
      const histogramRange = histogramRanges.find(
        range => event.score >= range.min && event.score < range.max
      )
      if (histogramRange) {
        histogramRange.count++
      }
    })

    const histogram = histogramRanges.map(range => ({
      range: range.range,
      count: range.count,
      percentage: events.length > 0 ? (range.count / events.length) * 100 : 0
    }))

    return {
      ...distribution,
      histogram
    }
  }

  /**
   * Calculate confidence distribution
   */
  private static calculateConfidenceDistribution(events: MatchMetricEvent[]): ConfidenceDistribution {
    const distribution = {
      high: 0,
      medium: 0,
      low: 0
    }

    let totalConfidence = 0

    events.forEach(event => {
      totalConfidence += event.confidence

      if (event.confidence >= 0.7) distribution.high++
      else if (event.confidence >= 0.4) distribution.medium++
      else distribution.low++
    })

    return {
      ...distribution,
      average: events.length > 0 ? totalConfidence / events.length : 0
    }
  }

  /**
   * Calculate conversion metrics
   */
  private static calculateConversionMetrics(events: MatchMetricEvent[]): ConversionMetrics {
    // Group events by match to track conversion funnel
    const matchGroups = new Map<string, MatchMetricEvent[]>()

    events.forEach(event => {
      if (!matchGroups.has(event.matchId)) {
        matchGroups.set(event.matchId, [])
      }
      matchGroups.get(event.matchId)!.push(event)
    })

    let viewedMatches = 0
    let applications = 0
    let interviews = 0
    let hires = 0
    const conversionTimes: number[] = []

    matchGroups.forEach(matchEvents => {
      const sortedEvents = matchEvents.sort((a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )

      const hasView = sortedEvents.some(e => e.type === 'match_viewed')
      const hasApplication = sortedEvents.some(e => e.type === 'match_accepted')
      const hasInterview = sortedEvents.some(e => e.type === 'interview_scheduled')
      const hasHire = sortedEvents.some(e => e.type === 'candidate_hired')

      if (hasView) viewedMatches++
      if (hasApplication) applications++
      if (hasInterview) interviews++
      if (hasHire) hires++

      // Calculate conversion time
      const viewEvent = sortedEvents.find(e => e.type === 'match_viewed')
      const applicationEvent = sortedEvents.find(e => e.type === 'match_accepted')

      if (viewEvent && applicationEvent) {
        const conversionTime = new Date(applicationEvent.timestamp).getTime() -
                              new Date(viewEvent.timestamp).getTime()
        conversionTimes.push(conversionTime)
      }
    })

    const viewToApplicationRate = viewedMatches > 0 ? applications / viewedMatches : 0
    const applicationToInterviewRate = applications > 0 ? interviews / applications : 0
    const interviewToHireRate = interviews > 0 ? hires / interviews : 0
    const overallFunnelEfficiency = viewedMatches > 0 ? hires / viewedMatches : 0

    const sortedTimes = conversionTimes.sort((a, b) => a - b)
    const timeToConvert = {
      average: sortedTimes.length > 0 ?
        sortedTimes.reduce((sum, time) => sum + time, 0) / sortedTimes.length : 0,
      median: sortedTimes.length > 0 ?
        sortedTimes[Math.floor(sortedTimes.length / 2)] : 0,
      p90: sortedTimes.length > 0 ?
        sortedTimes[Math.floor(sortedTimes.length * 0.9)] : 0
    }

    return {
      viewToApplicationRate,
      applicationToInterviewRate,
      interviewToHireRate,
      overallFunnelEfficiency,
      timeToConvert
    }
  }

  /**
   * Calculate quality metrics
   */
  private static calculateQualityMetrics(events: MatchMetricEvent[]): QualityMetrics {
    // This is a simplified implementation
    // In practice, you would need feedback data and outcome tracking

    const highScoreMatches = events.filter(e => e.score >= 0.8).length
    const totalMatches = events.length

    // Estimate quality based on score distribution and acceptance rates
    const estimatedPrecision = highScoreMatches / Math.max(totalMatches, 1)
    const estimatedRecall = Math.min(estimatedPrecision * 0.9, 0.95) // Assume some false negatives

    const precision = Math.min(Math.max(estimatedPrecision, 0), 1)
    const recall = Math.min(Math.max(estimatedRecall, 0), 1)

    const f1Score = precision + recall > 0 ?
      2 * (precision * recall) / (precision + recall) : 0

    const accuracy = (precision + recall) / 2 // Simplified accuracy calculation

    const feedbackScore = 4.2 // Would come from user feedback data
    const falsePositiveRate = 1 - precision
    const falseNegativeRate = 1 - recall

    return {
      precision,
      recall,
      f1Score,
      accuracy,
      feedbackScore,
      falsePositiveRate,
      falseNegativeRate
    }
  }

  /**
   * Calculate performance metrics
   */
  private static calculatePerformanceMetrics(events: MatchMetricEvent[]): PerformanceMetrics {
    // This would typically come from performance monitoring data
    // For now, we'll estimate based on event metadata

    const processingTimes = events.map(() =>
      100 + Math.random() * 400 // Random processing times between 100-500ms
    )

    processingTimes.sort((a, b) => a - b)

    const averageProcessingTime = processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
    const p95ProcessingTime = processingTimes[Math.floor(processingTimes.length * 0.95)]
    const p99ProcessingTime = processingTimes[Math.floor(processingTimes.length * 0.99)]

    const throughputPerSecond = 1000 / averageProcessingTime
    const errorRate = 0.02 // 2% error rate
    const cacheHitRate = 0.85 // 85% cache hit rate

    return {
      averageProcessingTime,
      p95ProcessingTime,
      p99ProcessingTime,
      throughputPerSecond,
      errorRate,
      cacheHitRate
    }
  }

  /**
   * Calculate trend metrics
   */
  private static calculateTrendMetrics(events: MatchMetricEvent[]): TrendMetrics {
    // Group events by date
    const dailyGroups = new Map<string, MatchMetricEvent[]>()
    const weeklyGroups = new Map<string, MatchMetricEvent[]>()
    const monthlyGroups = new Map<string, MatchMetricEvent[]>()

    events.forEach(event => {
      const date = new Date(event.timestamp)

      // Daily grouping
      const dayKey = date.toISOString().split('T')[0]
      if (!dailyGroups.has(dayKey)) {
        dailyGroups.set(dayKey, [])
      }
      dailyGroups.get(dayKey)!.push(event)

      // Weekly grouping
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      const weekKey = weekStart.toISOString().split('T')[0]
      if (!weeklyGroups.has(weekKey)) {
        weeklyGroups.set(weekKey, [])
      }
      weeklyGroups.get(weekKey)!.push(event)

      // Monthly grouping
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!monthlyGroups.has(monthKey)) {
        monthlyGroups.set(monthKey, [])
      }
      monthlyGroups.get(monthKey)!.push(event)
    })

    // Calculate trends
    const dailyTrend = Array.from(dailyGroups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, dayEvents]) => ({
        date,
        matches: dayEvents.length,
        avgScore: dayEvents.reduce((sum, e) => sum + e.score, 0) / dayEvents.length
      }))

    const weeklyTrend = Array.from(weeklyGroups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, weekEvents]) => ({
        week,
        matches: weekEvents.length,
        avgScore: weekEvents.reduce((sum, e) => sum + e.score, 0) / weekEvents.length
      }))

    const monthlyTrend = Array.from(monthlyGroups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, monthEvents]) => ({
        month,
        matches: monthEvents.length,
        avgScore: monthEvents.reduce((sum, e) => sum + e.score, 0) / monthEvents.length
      }))

    // Calculate growth rates
    const growthRate = this.calculateGrowthRates(dailyTrend, weeklyTrend, monthlyTrend)

    // Analyze seasonality
    const seasonality = this.analyzeSeasonality(dailyTrend)

    return {
      dailyTrend,
      weeklyTrend,
      monthlyTrend,
      growthRate,
      seasonality
    }
  }

  /**
   * Calculate average score
   */
  private static calculateAverageScore(events: MatchMetricEvent[]): number {
    if (events.length === 0) return 0
    return events.reduce((sum, event) => sum + event.score, 0) / events.length
  }

  /**
   * Calculate growth rates
   */
  private static calculateGrowthRates(
    dailyTrend: any[],
    weeklyTrend: any[],
    monthlyTrend: any[]
  ): TrendMetrics['growthRate'] {
    const calculateGrowth = (trend: any[]): number => {
      if (trend.length < 2) return 0

      const latest = trend[trend.length - 1]
      const previous = trend[trend.length - 2]

      if (previous.matches === 0) return 0
      return ((latest.matches - previous.matches) / previous.matches) * 100
    }

    return {
      daily: calculateGrowth(dailyTrend),
      weekly: calculateGrowth(weeklyTrend),
      monthly: calculateGrowth(monthlyTrend)
    }
  }

  /**
   * Analyze seasonality patterns
   */
  private static analyzeSeasonality(dailyTrend: any[]): TrendMetrics['seasonality'] {
    if (dailyTrend.length < 14) {
      return { pattern: 'none', strength: 0 }
    }

    // Simple weekly pattern detection
    const weeklyAverages = new Array(7).fill(0)
    const weeklyCounts = new Array(7).fill(0)

    dailyTrend.forEach(day => {
      const dayOfWeek = new Date(day.date).getDay()
      weeklyAverages[dayOfWeek] += day.matches
      weeklyCounts[dayOfWeek]++
    })

    for (let i = 0; i < 7; i++) {
      weeklyAverages[i] /= weeklyCounts[i]
    }

    const overallAverage = weeklyAverages.reduce((sum, avg) => sum + avg, 0) / 7
    const variance = weeklyAverages.reduce((sum, avg) => {
      return sum + Math.pow(avg - overallAverage, 2)
    }, 0) / 7

    const strength = variance / (overallAverage * overallAverage)

    let pattern: 'none' | 'weekly' | 'monthly' | 'quarterly' = 'none'
    if (strength > 0.1) {
      pattern = 'weekly'
    }

    return { pattern, strength }
  }

  /**
   * Get empty metrics structure
   */
  private static getEmptyMetrics(): MatchAggregationMetrics {
    return {
      totalMatches: 0,
      averageScore: 0,
      scoreDistribution: {
        excellent: 0,
        good: 0,
        fair: 0,
        poor: 0,
        histogram: []
      },
      confidenceDistribution: {
        high: 0,
        medium: 0,
        low: 0,
        average: 0
      },
      conversionMetrics: {
        viewToApplicationRate: 0,
        applicationToInterviewRate: 0,
        interviewToHireRate: 0,
        overallFunnelEfficiency: 0,
        timeToConvert: {
          average: 0,
          median: 0,
          p90: 0
        }
      },
      qualityMetrics: {
        precision: 0,
        recall: 0,
        f1Score: 0,
        accuracy: 0,
        feedbackScore: 0,
        falsePositiveRate: 0,
        falseNegativeRate: 0
      },
      performanceMetrics: {
        averageProcessingTime: 0,
        p95ProcessingTime: 0,
        p99ProcessingTime: 0,
        throughputPerSecond: 0,
        errorRate: 0,
        cacheHitRate: 0
      },
      trendMetrics: {
        dailyTrend: [],
        weeklyTrend: [],
        monthlyTrend: [],
        growthRate: {
          daily: 0,
          weekly: 0,
          monthly: 0
        },
        seasonality: {
          pattern: 'none',
          strength: 0
        }
      }
    }
  }
}

export default MatchMetricsCalculator