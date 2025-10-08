'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Area,
  AreaChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Users,
  Briefcase,
  Target,
  Brain,
  Activity,
  Eye,
  MousePointer,
  CheckCircle,
  AlertTriangle,
  Clock,
  Download,
  RefreshCw,
  Filter,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react'

interface MatchingAnalyticsProps {
  className?: string
  isGlobal?: boolean
  userId?: string
  jobId?: string
  candidateId?: string
}

interface AnalyticsData {
  overview: {
    totalMatches: number
    successfulMatches: number
    avgMatchScore: number
    avgConfidence: number
    matchesLast24h: number
    matchesLast7d: number
    successRate: number
  }
  skillsAnalysis: {
    topSkills: Array<{
      skill: string
      demand: number
      successRate: number
      avgScore: number
    }>
    skillGaps: Array<{
      skill: string
      gapSize: number
      demandLevel: 'high' | 'medium' | 'low'
      recommended: boolean
    }>
  }
  performanceMetrics: {
    accuracy: {
      precision: number
      recall: number
      f1Score: number
      accuracy: number
    }
    engagement: {
      views: number
      applications: number
      interviews: number
      hires: number
    }
    satisfaction: {
      avgRating: number
      feedbackCount: number
      positiveFeedback: number
    }
  }
  timeAnalytics: {
    hourlyDistribution: Array<{
      hour: number
      matches: number
      successRate: number
    }>
    dailyTrends: Array<{
      date: string
      matches: number
      successRate: number
      avgScore: number
    }>
    responseTime: {
      avgMatchTime: number
      avgApplicationTime: number
      avgResponseTime: number
    }
  }
  channelAnalytics: {
    sources: Array<{
      source: string
      matches: number
      successRate: number
      qualityScore: number
    }>
    conversion: {
      matchToApplication: number
      applicationToInterview: number
      interviewToHire: number
    }
  }
  insights: {
    recommendations: Array<{
      title: string
      description: string
      priority: 'high' | 'medium' | 'low'
      impact: 'high' | 'medium' | 'low'
      action: string
    }>
    trends: Array<{
      trend: string
      direction: 'up' | 'down' | 'stable'
      changePercent: number
      description: string
    }>
  }
}

const COLORS = {
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  primary: '#8b5cf6',
  secondary: '#6b7280'
}

export function MatchingAnalyticsDashboard({
  className,
  isGlobal = false,
  userId,
  jobId,
  candidateId
}: MatchingAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState('7d')
  const [metric, setMetric] = useState('overview')

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        period,
        metric,
        ...(isGlobal && { global: 'true' }),
        ...(userId && { userId }),
        ...(jobId && { jobId }),
        ...(candidateId && { candidateId })
      })

      const response = await fetch(`/api/analytics/matching?${params}`)
      if (!response.ok) throw new Error('Failed to fetch analytics')

      const data = await response.json()
      if (data.success) {
        setAnalytics(data.data)
      } else {
        throw new Error(data.error || 'Failed to fetch analytics')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analytics'
      setError(errorMessage)
      console.error('Error fetching analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [period, metric, isGlobal, userId, jobId, candidateId])

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return 'text-green-600'
    if (value >= thresholds.warning) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card>
          <CardContent className="flex items-center justify-center h-96">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics Error</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={fetchAnalytics} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!analytics) {
    return null
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Matching Analytics</h2>
          <p className="text-gray-600">
            {isGlobal ? 'Global matching performance metrics' : 'Your matching performance and insights'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>

          <Select value={metric} onValueChange={setMetric}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Overview</SelectItem>
              <SelectItem value="skills">Skills</SelectItem>
              <SelectItem value="performance">Performance</SelectItem>
              <SelectItem value="engagement">Engagement</SelectItem>
              <SelectItem value="time">Timing</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={fetchAnalytics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Matches</p>
                <p className="text-2xl font-bold">{analytics.overview.totalMatches.toLocaleString()}</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold">{analytics.overview.successRate}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Match Score</p>
                <p className="text-2xl font-bold">{analytics.overview.avgMatchScore.toFixed(1)}</p>
              </div>
              <Brain className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Confidence</p>
                <p className="text-2xl font-bold">{analytics.overview.avgConfidence.toFixed(1)}%</p>
              </div>
              <Activity className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Matching Trends</CardTitle>
                <CardDescription>Match volume and success rate over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{}}>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analytics.timeAnalytics.dailyTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar yAxisId="left" dataKey="matches" fill="#3b82f6" />
                      <Line yAxisId="right" type="monotone" dataKey="successRate" stroke="#10b981" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Key accuracy and engagement indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {analytics.performanceMetrics.accuracy.precision.toFixed(1)}%
                      </p>
                      <p className="text-sm text-gray-600">Precision</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {analytics.performanceMetrics.accuracy.recall.toFixed(1)}%
                      </p>
                      <p className="text-sm text-gray-600">Recall</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {analytics.performanceMetrics.accuracy.f1Score.toFixed(1)}
                      </p>
                      <p className="text-sm text-gray-600">F1 Score</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">
                        {analytics.performanceMetrics.accuracy.accuracy.toFixed(1)}%
                      </p>
                      <p className="text-sm text-gray-600">Accuracy</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Channel Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>Channel Performance</CardTitle>
              <CardDescription>Match sources and conversion rates</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.channelAnalytics.sources}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="source" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="matches" fill="#3b82f6" name="Matches" />
                    <Bar dataKey="successRate" fill="#10b981" name="Success Rate" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Skills */}
            <Card>
              <CardHeader>
                <CardTitle>Most In-Demand Skills</CardTitle>
                <CardDescription>Skills with highest matching demand</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.skillsAnalysis.topSkills.slice(0, 10).map((skill, index) => (
                    <div key={skill.skill} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                        <div>
                          <p className="font-medium">{skill.skill}</p>
                          <p className="text-sm text-gray-600">{skill.demand} opportunities</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">{skill.successRate}%</p>
                        <p className="text-xs text-gray-500">success rate</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Skill Gaps */}
            <Card>
              <CardHeader>
                <CardTitle>Skill Gap Analysis</CardTitle>
                <CardDescription>Recommended skills to improve matching</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.skillsAnalysis.skillGaps.map((gap, index) => (
                    <div key={gap.skill} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          gap.demandLevel === 'high' ? 'bg-red-100 text-red-700' :
                          gap.demandLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {gap.demandLevel.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{gap.skill}</p>
                          <p className="text-sm text-gray-600">Gap: {gap.gapSize} candidates</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {gap.recommended && (
                          <Badge variant="outline" className="text-blue-600">
                            Recommended
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Skills Radar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Skills Performance Radar</CardTitle>
              <CardDescription>Multi-dimensional skills analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}}>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={analytics.skillsAnalysis.topSkills.slice(0, 6)}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="skill" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar
                      name="Demand"
                      dataKey="demand"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                    />
                    <Radar
                      name="Success Rate"
                      dataKey="successRate"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.6}
                    />
                    <Radar
                      name="Avg Score"
                      dataKey="avgScore"
                      stroke="#f59e0b"
                      fill="#f59e0b"
                      fillOpacity={0.6}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </RadarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Response Times */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Response Times
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Avg Match Time</span>
                    <span className="font-semibold">
                      {analytics.timeAnalytics.responseTime.avgMatchTime}ms
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Avg Application Time</span>
                    <span className="font-semibold">
                      {analytics.timeAnalytics.responseTime.avgApplicationTime}ms
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Avg Response Time</span>
                    <span className="font-semibold">
                      {analytics.timeAnalytics.responseTime.avgResponseTime}ms
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Engagement Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MousePointer className="w-5 h-5" />
                  Engagement Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Profile Views</span>
                    <span className="font-semibold">
                      {analytics.performanceMetrics.engagement.views.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Applications</span>
                    <span className="font-semibold">
                      {analytics.performanceMetrics.engagement.applications.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Interviews</span>
                    <span className="font-semibold">
                      {analytics.performanceMetrics.engagement.interviews.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Hires</span>
                    <span className="font-semibold text-green-600">
                      {analytics.performanceMetrics.engagement.hires.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Satisfaction */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Satisfaction Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">
                      {analytics.performanceMetrics.satisfaction.avgRating.toFixed(1)}
                    </p>
                    <p className="text-sm text-gray-600">Average Rating</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Feedback</span>
                      <span className="font-semibold">
                        {analytics.performanceMetrics.satisfaction.feedbackCount}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Positive</span>
                      <span className="font-semibold text-green-600">
                        {analytics.performanceMetrics.satisfaction.positiveFeedback}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Conversion Funnel */}
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
              <CardDescription>Conversion rates through the hiring process</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: 'Match → Application', value: analytics.channelAnalytics.conversion.matchToApplication, fill: '#3b82f6' },
                    { name: 'Application → Interview', value: analytics.channelAnalytics.conversion.applicationToInterview, fill: '#10b981' },
                    { name: 'Interview → Hire', value: analytics.channelAnalytics.conversion.interviewToHire, fill: '#f59e0b' }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  AI Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.insights.recommendations.map((rec, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold">{rec.title}</h4>
                        <div className="flex gap-2">
                          <Badge
                            variant={rec.priority === 'high' ? 'destructive' :
                                   rec.priority === 'medium' ? 'default' : 'secondary'}
                          >
                            {rec.priority}
                          </Badge>
                          <Badge variant="outline">
                            {rec.impact}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
                      <Button size="sm" variant="outline">
                        {rec.action}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Market Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.insights.trends.map((trend, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getTrendIcon(trend.direction)}
                        <div>
                          <p className="font-medium">{trend.trend}</p>
                          <p className="text-sm text-gray-600">{trend.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${
                          trend.direction === 'up' ? 'text-green-600' :
                          trend.direction === 'down' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {trend.changePercent > 0 && '+'}{trend.changePercent}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}