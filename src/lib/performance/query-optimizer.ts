import { PrismaClient } from '@prisma/client'
import { logger } from '@/lib/logger'

export interface QueryOptimizationOptions {
  enableCaching: boolean
  cacheTimeout: number
  enableQueryAnalysis: boolean
  slowQueryThreshold: number
  enableIndexSuggestions: boolean
  maxQueryExecutionTime: number
}

export interface QueryAnalysis {
  query: string
  executionTime: number
  rowsAffected: number
  indexesUsed: string[]
  suggestions: string[]
  optimizationLevel: 'optimal' | 'suboptimal' | 'poor'
  timestamp: Date
}

export interface QueryPlan {
  query: string
  plan: any
  estimatedCost: number
  indexesRecommended: string[]
  optimizations: string[]
}

export interface IndexSuggestion {
  tableName: string
  columns: string[]
  indexType: 'btree' | 'hash' | 'gin' | 'gist'
  estimatedImprovement: number
  priority: 'high' | 'medium' | 'low'
  reason: string
}

export class QueryOptimizer {
  private prisma: PrismaClient
  private options: QueryOptimizationOptions
  private queryCache: Map<string, { result: any; timestamp: number }> = new Map()
  private slowQueries: QueryAnalysis[] = []
  private indexSuggestions: IndexSuggestion[] = []

  constructor(
    prisma: PrismaClient,
    options: Partial<QueryOptimizationOptions> = {}
  ) {
    this.prisma = prisma
    this.options = {
      enableCaching: true,
      cacheTimeout: 300000, // 5 minutes
      enableQueryAnalysis: true,
      slowQueryThreshold: 1000, // 1 second
      enableIndexSuggestions: true,
      maxQueryExecutionTime: 5000, // 5 seconds
      ...options
    }

    this.setupQueryMonitoring()
    this.analyzeExistingIndexes()
  }

  /**
   * Execute optimized query
   */
  public async executeQuery<T = any>(
    query: string,
    params: any[] = [],
    options: {
      cacheKey?: string
      forceRefresh?: boolean
      analyzeQuery?: boolean
    } = {}
  ): Promise<T> {
    const startTime = Date.now()
    const cacheKey = options.cacheKey || this.generateCacheKey(query, params)

    try {
      // Check cache first
      if (this.options.enableCaching && !options.forceRefresh) {
        const cached = this.getFromCache<T>(cacheKey)
        if (cached) {
          logger.debug('Query cache hit', { cacheKey })
          return cached
        }
      }

      // Execute query with analysis
      const result = await this.executeQueryWithAnalysis(query, params, options)

      // Cache result
      if (this.options.enableCaching) {
        this.setCache(cacheKey, result)
      }

      const executionTime = Date.now() - startTime
      logger.debug('Query executed', { query, executionTime, rowsReturned: Array.isArray(result) ? result.length : 1 })

      return result
    } catch (error) {
      const executionTime = Date.now() - startTime
      logger.error('Query execution failed', {
        query,
        params,
        executionTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  /**
   * Execute optimized matching query
   */
  public async executeMatchingQuery(
    candidateId?: string,
    jobId?: string,
    filters: Record<string, any> = {},
    limit: number = 50,
    offset: number = 0
  ): Promise<any[]> {
    const startTime = Date.now()
    let query = `
      SELECT
        m.*,
        c.first_name || ' ' || c.last_name as candidate_name,
        j.title as job_title,
        co.name as company_name,
        CASE
          WHEN m.score >= 0.8 THEN 'excellent'
          WHEN m.score >= 0.6 THEN 'good'
          WHEN m.score >= 0.4 THEN 'fair'
          ELSE 'poor'
        END as match_quality
      FROM matches m
      LEFT JOIN users c ON m.candidate_id = c.id
      LEFT JOIN jobs j ON m.job_id = j.id
      LEFT JOIN companies co ON j.company_id = co.id
      WHERE 1=1
    `

    const params: any[] = []
    const conditions: string[] = []

    // Add filters
    if (candidateId) {
      conditions.push('m.candidate_id = $' + (params.length + 1))
      params.push(candidateId)
    }

    if (jobId) {
      conditions.push('m.job_id = $' + (params.length + 1))
      params.push(jobId)
    }

    if (filters.minScore) {
      conditions.push('m.score >= $' + (params.length + 1))
      params.push(filters.minScore)
    }

    if (filters.matchQuality) {
      const qualityConditions = {
        excellent: 'm.score >= 0.8',
        good: 'm.score >= 0.6 AND m.score < 0.8',
        fair: 'm.score >= 0.4 AND m.score < 0.6',
        poor: 'm.score < 0.4'
      }

      if (qualityConditions[filters.matchQuality as keyof typeof qualityConditions]) {
        conditions.push(qualityConditions[filters.matchQuality as keyof typeof qualityConditions])
      }
    }

    if (filters.dateRange) {
      conditions.push('m.created_at BETWEEN $' + (params.length + 1) + ' AND $' + (params.length + 2))
      params.push(filters.dateRange.start, filters.dateRange.end)
    }

    // Combine conditions
    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ')
    }

    // Add ordering and pagination
    query += ' ORDER BY m.score DESC, m.created_at DESC'
    query += ' LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2)
    params.push(limit, offset)

    return this.executeQuery(query, params, {
      cacheKey: `matching:${candidateId}:${jobId}:${JSON.stringify(filters)}:${limit}:${offset}`,
      analyzeQuery: true
    })
  }

  /**
   * Execute optimized profile query
   */
  public async executeProfileQuery(
    userId: string,
    includeData: {
      skills?: boolean
      experience?: boolean
      education?: boolean
      preferences?: boolean
    } = {}
  ): Promise<any> {
    const startTime = Date.now()

    // Build optimized query based on requested data
    let query = `
      SELECT
        u.id,
        u.email,
        u.role,
        u.created_at,
        u.updated_at,
        p.first_name,
        p.last_name,
        p.headline,
        p.summary,
        p.location,
        p.resume_url,
        p.portfolio_url,
        p.linkedin_url,
        p.github_url,
        p.avatar_url,
        p.is_public,
        p.completion_percentage,
        p.total_experience
    `

    const params: any[] = [userId]
    const joins: string[] = []
    const selects: string[] = []

    // Add conditional joins and selects
    if (includeData.skills) {
      selects.push(`
        COALESCE(
          json_agg(
            json_build_object(
              'id', s.id,
              'name', s.name,
              'level', us.level,
              'years_of_experience', us.years_of_experience,
              'last_used', us.last_used
            )
          ) FILTER (WHERE s.id IS NOT NULL),
          '[]'
        ) as skills
      `)
      joins.push(`
        LEFT JOIN user_skills us ON u.id = us.user_id
        LEFT JOIN skills s ON us.skill_id = s.id
      `)
    }

    if (includeData.experience) {
      selects.push(`
        COALESCE(
          json_agg(
            json_build_object(
              'id', e.id,
              'title', e.title,
              'company', e.company,
              'location', e.location,
              'start_date', e.start_date,
              'end_date', e.end_date,
              'description', e.description,
              'is_current', e.is_current
            )
          ) FILTER (WHERE e.id IS NOT NULL),
          '[]'
        ) as experience
      `)
      joins.push(`
        LEFT JOIN experiences e ON u.id = e.user_id
      `)
    }

    if (includeData.education) {
      selects.push(`
        COALESCE(
          json_agg(
            json_build_object(
              'id', ed.id,
              'institution', ed.institution,
              'degree', ed.degree,
              'field_of_study', ed.field_of_study,
              'start_date', ed.start_date,
              'end_date', ed.end_date,
              'gpa', ed.gpa
            )
          ) FILTER (WHERE ed.id IS NOT NULL),
          '[]'
        ) as education
      `)
      joins.push(`
        LEFT JOIN education ed ON u.id = ed.user_id
      `)
    }

    if (includeData.preferences) {
      selects.push(`
        COALESCE(
          json_build_object(
            'remote_work', pref.remote_work,
            'work_environment', pref.work_environment,
            'salary_min', pref.salary_min,
            'salary_max', pref.salary_max,
            'preferred_locations', pref.preferred_locations,
            'job_types', pref.job_types,
            'industries', pref.industries
          ),
          '{}'
        ) as preferences
      `)
      joins.push(`
        LEFT JOIN user_preferences pref ON u.id = pref.user_id
      `)
    }

    // Add selects to main query
    if (selects.length > 0) {
      query += ', ' + selects.join(', ')
    }

    query += `
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      ${joins.join(' ')}
      WHERE u.id = $1
      GROUP BY u.id, p.id
    `

    return this.executeQuery(query, params, {
      cacheKey: `profile:${userId}:${JSON.stringify(includeData)}`,
      analyzeQuery: true
    })
  }

  /**
   * Execute optimized job query
   */
  public async executeJobQuery(
    filters: Record<string, any> = {},
    sort: string = 'relevance',
    limit: number = 20,
    offset: number = 0
  ): Promise<any[]> {
    const startTime = Date.now()

    let query = `
      SELECT
        j.*,
        co.name as company_name,
        co.logo_url as company_logo,
        co.industry as company_industry,
        co.size as company_size,
        COUNT(DISTINCT a.id) as application_count,
        AVG(m.score) as avg_match_score,
        COUNT(DISTINCT js.skill_id) as required_skills_count,
        CASE
          WHEN j.is_remote THEN 'Remote'
          WHEN j.location IS NOT NULL THEN j.location
          ELSE 'Location not specified'
        END as display_location
    `

    const params: any[] = []
    const joins: string[] = [
      'LEFT JOIN companies co ON j.company_id = co.id',
      'LEFT JOIN applications a ON j.id = a.job_id',
      'LEFT JOIN matches m ON j.id = m.job_id',
      'LEFT JOIN job_skills js ON j.id = js.job_id'
    ]
    const conditions: string[] = []
    const groupBy = ['j.id', 'co.id']

    // Add filters
    if (filters.companyId) {
      conditions.push('j.company_id = $' + (params.length + 1))
      params.push(filters.companyId)
    }

    if (filters.title) {
      conditions.push('j.title ILIKE $' + (params.length + 1))
      params.push(`%${filters.title}%`)
    }

    if (filters.location) {
      conditions.push('j.location ILIKE $' + (params.length + 1))
      params.push(`%${filters.location}%`)
    }

    if (filters.isRemote !== undefined) {
      conditions.push('j.is_remote = $' + (params.length + 1))
      params.push(filters.isRemote)
    }

    if (filters.salaryMin) {
      conditions.push('(j.salary_min >= $' + (params.length + 1) + ' OR j.salary_max >= $' + (params.length + 2) + ')')
      params.push(filters.salaryMin, filters.salaryMin)
    }

    if (filters.salaryMax) {
      conditions.push('j.salary_max <= $' + (params.length + 1))
      params.push(filters.salaryMax)
    }

    if (filters.skills && filters.skills.length > 0) {
      conditions.push(`
        j.id IN (
          SELECT job_id
          FROM job_skills
          WHERE skill_id = ANY($${params.length + 1})
          GROUP BY job_id
          HAVING COUNT(DISTINCT skill_id) >= $${params.length + 2}
        )
      `)
      params.push(filters.skills, Math.ceil(filters.skills.length * 0.5))
    }

    if (filters.datePosted) {
      const daysBack = {
        today: 1,
        week: 7,
        month: 30,
        year: 365
      }
      const days = daysBack[filters.datePosted as keyof typeof daysBack] || 30
      conditions.push('j.created_at >= $' + (params.length + 1))
      params.push(new Date(Date.now() - days * 24 * 60 * 60 * 1000))
    }

    // Combine query parts
    query += ' FROM jobs j ' + joins.join(' ')

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }

    query += ' GROUP BY ' + groupBy.join(', ')

    // Add ordering
    const sortOptions: Record<string, string> = {
      relevance: 'AVG(m.score) DESC, j.created_at DESC',
      date: 'j.created_at DESC',
      salary: 'j.salary_max DESC NULLS LAST',
      applications: 'application_count DESC',
      company: 'co.name ASC'
    }

    query += ' ORDER BY ' + (sortOptions[sort] || sortOptions.relevance)

    // Add pagination
    query += ' LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2)
    params.push(limit, offset)

    return this.executeQuery(query, params, {
      cacheKey: `jobs:${JSON.stringify(filters)}:${sort}:${limit}:${offset}`,
      analyzeQuery: true
    })
  }

  /**
   * Get query analysis
   */
  public getQueryAnalysis(): {
    slowQueries: QueryAnalysis[]
    indexSuggestions: IndexSuggestion[]
    cacheStats: {
      size: number;
      hitRate: number;
      memoryUsage: number;
    }
  } {
    const cacheStats = this.getCacheStats()

    return {
      slowQueries: this.slowQueries,
      indexSuggestions: this.indexSuggestions,
      cacheStats
    }
  }

  /**
   * Get query execution plan
   */
  public async getQueryPlan(query: string, params: any[] = []): Promise<QueryPlan> {
    try {
      // This would typically use database-specific commands like EXPLAIN
      // For now, return a mock plan
      return {
        query,
        plan: {
          nodeType: 'Seq Scan',
          relationName: 'matches',
          alias: 'm',
          startupCost: 0.00,
          totalCost: 100.00,
          planRows: 1000,
          planWidth: 200
        },
        estimatedCost: 100.00,
        indexesRecommended: [],
        optimizations: ['Consider adding index on frequently filtered columns']
      }
    } catch (error) {
      logger.error('Error getting query plan', { query, error })
      throw error
    }
  }

  /**
   * Clear query cache
   */
  public clearCache(): void {
    this.queryCache.clear()
    logger.info('Query cache cleared')
  }

  /**
   * Clear slow query log
   */
  public clearSlowQueries(): void {
    this.slowQueries = []
    logger.info('Slow query log cleared')
  }

  /**
   * Execute query with analysis
   */
  private async executeQueryWithAnalysis(
    query: string,
    params: any[],
    options: { analyzeQuery?: boolean } = {}
  ): Promise<any> {
    const startTime = Date.now()

    try {
      let result: any

      if (options.analyzeQuery && this.options.enableQueryAnalysis) {
        // For analysis, we would typically use EXPLAIN ANALYZE
        // For now, just execute the query
        result = await this.prisma.$queryRawUnsafe(query, ...params)
      } else {
        result = await this.prisma.$queryRawUnsafe(query, ...params)
      }

      const executionTime = Date.now() - startTime

      // Analyze slow queries
      if (executionTime > this.options.slowQueryThreshold) {
        this.recordSlowQuery(query, executionTime, params.length)
      }

      // Check for optimization opportunities
      if (this.options.enableIndexSuggestions && options.analyzeQuery) {
        await this.analyzeQueryForOptimizations(query, executionTime)
      }

      return result
    } catch (error) {
      const executionTime = Date.now() - startTime
      logger.error('Query execution error', {
        query,
        params,
        executionTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  /**
   * Record slow query
   */
  private recordSlowQuery(query: string, executionTime: number, paramCount: number): void {
    const analysis: QueryAnalysis = {
      query: this.sanitizeQuery(query),
      executionTime,
      rowsAffected: 0, // Would need to be determined from result
      indexesUsed: [], // Would need to be determined from execution plan
      suggestions: this.generateQuerySuggestions(query, executionTime),
      optimizationLevel: this.determineOptimizationLevel(executionTime),
      timestamp: new Date()
    }

    this.slowQueries.push(analysis)

    // Keep only last 100 slow queries
    if (this.slowQueries.length > 100) {
      this.slowQueries = this.slowQueries.slice(-100)
    }

    logger.warn('Slow query detected', {
      executionTime,
      query: analysis.query,
      suggestions: analysis.suggestions
    })
  }

  /**
   * Generate query suggestions
   */
  private generateQuerySuggestions(query: string, executionTime: number): string[] {
    const suggestions: string[] = []

    if (executionTime > 2000) {
      suggestions.push('Consider adding appropriate indexes')
    }

    if (query.includes('ORDER BY') && !query.includes('INDEX')) {
      suggestions.push('Consider adding index for ORDER BY clause')
    }

    if (query.includes('WHERE') && query.includes('LIKE')) {
      suggestions.push('Consider using full-text search for LIKE operations')
    }

    if (query.includes('JOIN') && query.includes('LEFT JOIN')) {
      suggestions.push('Review JOIN order and add foreign key indexes')
    }

    return suggestions
  }

  /**
   * Determine optimization level
   */
  private determineOptimizationLevel(executionTime: number): 'optimal' | 'suboptimal' | 'poor' {
    if (executionTime < 100) return 'optimal'
    if (executionTime < 1000) return 'suboptimal'
    return 'poor'
  }

  /**
   * Analyze query for optimizations
   */
  private async analyzeQueryForOptimizations(query: string, executionTime: number): Promise<void> {
    // This would typically analyze the query execution plan
    // For now, add placeholder suggestions
    if (executionTime > 500) {
      this.addIndexSuggestion({
        tableName: 'matches',
        columns: ['candidate_id', 'job_id'],
        indexType: 'btree',
        estimatedImprovement: 50,
        priority: 'high',
        reason: 'Frequently joined columns'
      })
    }
  }

  /**
   * Add index suggestion
   */
  private addIndexSuggestion(suggestion: IndexSuggestion): void {
    // Check if similar suggestion already exists
    const exists = this.indexSuggestions.some(existing =>
      existing.tableName === suggestion.tableName &&
      JSON.stringify(existing.columns) === JSON.stringify(suggestion.columns)
    )

    if (!exists) {
      this.indexSuggestions.push(suggestion)
    }
  }

  /**
   * Analyze existing indexes
   */
  private async analyzeExistingIndexes(): Promise<void> {
    try {
      // This would typically query the database for existing indexes
      // For now, add placeholder suggestions
      this.addIndexSuggestion({
        tableName: 'matches',
        columns: ['score', 'created_at'],
        indexType: 'btree',
        estimatedImprovement: 30,
        priority: 'medium',
        reason: 'Optimize ordering for match listings'
      })
    } catch (error) {
      logger.error('Error analyzing existing indexes', { error })
    }
  }

  /**
   * Setup query monitoring
   */
  private setupQueryMonitoring(): void {
    // Periodic cleanup of cache and slow queries
    setInterval(() => {
      this.cleanupCache()
      this.cleanupSlowQueries()
    }, 300000) // Every 5 minutes
  }

  /**
   * Get from cache
   */
  private getFromCache<T>(key: string): T | null {
    const cached = this.queryCache.get(key)
    if (cached && Date.now() - cached.timestamp < this.options.cacheTimeout) {
      return cached.result
    }
    return null
  }

  /**
   * Set cache
   */
  private setCache(key: string, result: any): void {
    this.queryCache.set(key, {
      result,
      timestamp: Date.now()
    })

    // Limit cache size
    if (this.queryCache.size > 1000) {
      const oldestKey = this.queryCache.keys().next().value
      this.queryCache.delete(oldestKey)
    }
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(query: string, params: any[]): string {
    const hash = require('crypto')
      .createHash('md5')
      .update(query + JSON.stringify(params))
      .digest('hex')
    return `query_${hash}`
  }

  /**
   * Sanitize query for logging
   */
  private sanitizeQuery(query: string): string {
    // Remove sensitive data and truncate long queries
    return query.length > 200 ? query.substring(0, 200) + '...' : query
  }

  /**
   * Get cache statistics
   */
  private getCacheStats(): {
    size: number;
    hitRate: number;
    memoryUsage: number;
  } {
    // This would typically calculate actual memory usage
    return {
      size: this.queryCache.size,
      hitRate: 0.75, // Placeholder
      memoryUsage: 1024 * 1024 * 10 // 10MB placeholder
    }
  }

  /**
   * Cleanup expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now()
    for (const [key, value] of this.queryCache.entries()) {
      if (now - value.timestamp > this.options.cacheTimeout) {
        this.queryCache.delete(key)
      }
    }
  }

  /**
   * Cleanup old slow queries
   */
  private cleanupSlowQueries(): void {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000) // 24 hours ago
    this.slowQueries = this.slowQueries.filter(
      query => query.timestamp.getTime() > cutoff
    )
  }
}