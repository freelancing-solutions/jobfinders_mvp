'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useApplicationStats } from '@/hooks/applications/use-applications'
import { ApplicationStats as ApplicationStatsType } from '@/types/applications'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Target,
  Clock,
  Award,
  Briefcase,
  DollarSign,
  Activity,
  Eye,
  FileText,
  Download,
  Filter,
  RefreshCw,
} from 'lucide-react'

interface ApplicationAnalyticsProps {
  className?: string
  compact?: boolean
  showExport?: boolean
}

export function ApplicationAnalytics({
  className,
  compact = false,
  showExport = true,
}: ApplicationAnalyticsProps) {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d')
  const [isLoading, setIsLoading] = useState(false)

  const { stats, refresh } = useApplicationStats({
    dateFrom: getDateFromRange(dateRange),
  })

  const handleRefresh = async () => {
    setIsLoading(true)
    await refresh()
    setIsLoading(false)
  }

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export analytics data')
  }

  if (!stats) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </CardContent>
      </Card>
    )
  }

  const successRate = stats.total > 0 ? ((stats.byStatus.offered || 0) + (stats.byStatus.hired || 0)) / stats.total * 100 : 0
  const interviewRate = stats.total > 0 ? ((stats.byStatus.interview_scheduled || 0) + (stats.byStatus.interview_completed || 0)) / stats.total * 100 : 0
  const rejectionRate = stats.total > 0 ? (stats.byStatus.rejected || 0) / stats.total * 100 : 0

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Application Analytics</h2>
          <p className="text-gray-600">Track your job application performance and insights</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {showExport && (
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Applications"
          value={stats.total}
          icon={FileText}
          trend={null}
          color="bg-blue-500"
        />
        <MetricCard
          title="Success Rate"
          value={`${successRate.toFixed(1)}%`}
          icon={TrendingUp}
          trend={successRate > 20 ? 'up' : successRate > 10 ? 'stable' : 'down'}
          color="bg-green-500"
        />
        <MetricCard
          title="Interview Rate"
          value={`${interviewRate.toFixed(1)}%`}
          icon={Calendar}
          trend={interviewRate > 30 ? 'up' : interviewRate > 20 ? 'stable' : 'down'}
          color="bg-purple-500"
        />
        <MetricCard
          title="Active Applications"
          value={stats.active}
          icon={Activity}
          trend={null}
          color="bg-orange-500"
        />
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="companies">Companies</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Status Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StatusBreakdownCard stats={stats} />
            <ResponseMetricsCard metrics={stats.responseMetrics} />
          </div>

          {/* Top Companies */}
          <TopCompaniesCard companies={stats.byCompany} />

          {/* Time Period Analysis */}
          <TimePeriodCard periods={stats.byTimePeriod} />
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <ApplicationTimelineCard periods={stats.byTimePeriod} />
        </TabsContent>

        <TabsContent value="companies" className="space-y-6">
          <CompanyAnalysisCard companies={stats.byCompany} />
        </TabsContent>

        <TabsContent value="skills" className="space-y-6">
          <SkillsAnalysisCard skills={stats.topSkills} />
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <InsightsCard stats={stats} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Helper function to get date from range
function getDateFromRange(range: string): string | undefined {
  const now = new Date()
  switch (range) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()
    case '1y':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString()
    default:
      return undefined
  }
}

// Metric Card Component
interface MetricCardProps {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  trend: 'up' | 'down' | 'stable' | null
  color: string
}

function MetricCard({ title, value, icon: Icon, trend, color }: MetricCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <Activity className="h-4 w-4 text-yellow-500" />
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {trend && (
              <div className="flex items-center gap-1 mt-1">
                {getTrendIcon()}
                <span className="text-xs text-gray-500">
                  {trend === 'up' ? 'Improving' : trend === 'down' ? 'Declining' : 'Stable'}
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Status Breakdown Card
function StatusBreakdownCard({ stats }: { stats: ApplicationStatsType }) {
  const statusEntries = Object.entries(stats.byStatus).filter(([_, count]) => count > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Status Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {statusEntries.map(([status, count]) => {
            const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0
            const getStatusColor = (status: string) => {
              const colors: Record<string, string> = {
                applied: 'bg-blue-500',
                reviewing: 'bg-yellow-500',
                shortlisted: 'bg-green-500',
                interview_scheduled: 'bg-purple-500',
                interview_completed: 'bg-indigo-500',
                offered: 'bg-emerald-500',
                rejected: 'bg-red-500',
                withdrawn: 'bg-gray-500',
                hired: 'bg-teal-500',
                archived: 'bg-slate-500',
              }
              return colors[status] || 'bg-gray-500'
            }

            return (
              <div key={status} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`} />
                    <span className="text-sm font-medium capitalize">
                      {status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{count}</span>
                    <Badge variant="secondary">{percentage.toFixed(1)}%</Badge>
                  </div>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// Response Metrics Card
function ResponseMetricsCard({ metrics }: { metrics: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Response Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Average Response Time</span>
          <span className="font-medium">{metrics.averageResponseTime || 0}h</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Response Rate</span>
          <span className="font-medium">{metrics.responseRate?.toFixed(1) || 0}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Interview Rate</span>
          <span className="font-medium">{metrics.interviewRate?.toFixed(1) || 0}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Offer Rate</span>
          <span className="font-medium">{metrics.offerRate?.toFixed(1) || 0}%</span>
        </div>
      </CardContent>
    </Card>
  )
}

// Top Companies Card
function TopCompaniesCard({ companies }: { companies: Array<{ companyName: string; count: number; successRate: number }> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Top Companies Applied To
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {companies.slice(0, 10).map((company, index) => (
            <div key={company.companyName} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                <span className="font-medium">{company.companyName}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">{company.count} applications</span>
                <Badge variant={company.successRate > 20 ? 'default' : 'secondary'}>
                  {company.successRate.toFixed(1)}% success
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Time Period Card
function TimePeriodCard({ periods }: { periods: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Application Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {periods.slice(0, 6).map((period, index) => (
            <div key={period.period} className="flex items-center justify-between">
              <span className="text-sm">{formatPeriod(period.period)}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">{period.applications} applied</span>
                <Badge variant={period.successRate > 10 ? 'default' : 'secondary'}>
                  {period.successRate.toFixed(1)}% success
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Application Timeline Card
function ApplicationTimelineCard({ periods }: { periods: any[] }) {
  const maxApplications = Math.max(...periods.map(p => p.applications), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Application Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {periods.map((period) => (
            <div key={period.period} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{formatPeriod(period.period)}</span>
                <span className="text-sm text-gray-600">{period.applications} applications</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-blue-500 h-4 rounded-full"
                    style={{ width: `${(period.applications / maxApplications) * 100}%` }}
                  />
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <span>📞 {period.interviews}</span>
                  <span>🎉 {period.offers}</span>
                  <span>❌ {period.rejections}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Company Analysis Card
function CompanyAnalysisCard({ companies }: { companies: Array<{ companyName: string; count: number; successRate: number }> }) {
  const averageSuccessRate = companies.reduce((acc, c) => acc + c.successRate, 0) / companies.length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Company Performance Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              Average success rate across all companies: <strong>{averageSuccessRate.toFixed(1)}%</strong>
            </p>
          </div>
          {companies
            .sort((a, b) => b.successRate - a.successRate)
            .slice(0, 15)
            .map((company) => (
              <div key={company.companyName} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <span className="font-medium">{company.companyName}</span>
                  <p className="text-sm text-gray-600">{company.count} application(s)</p>
                </div>
                <div className="text-right">
                  <Badge variant={company.successRate > averageSuccessRate ? 'default' : 'secondary'}>
                    {company.successRate.toFixed(1)}% success
                  </Badge>
                  {company.successRate > averageSuccessRate && (
                    <p className="text-xs text-green-600 mt-1">Above average</p>
                  )}
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Skills Analysis Card
function SkillsAnalysisCard({ skills }: { skills: Array<{ skill: string; count: number; successRate: number }> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          Skills Performance Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {skills.slice(0, 15).map((skill) => (
            <div key={skill.skill} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="outline">{skill.skill}</Badge>
                <span className="text-sm text-gray-600">{skill.count} uses</span>
              </div>
              <Badge variant={skill.successRate > 15 ? 'default' : 'secondary'}>
                {skill.successRate.toFixed(1)}% success
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Insights Card
function InsightsCard({ stats }: { stats: ApplicationStatsType }) {
  const insights = generateInsights(stats)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Key Insights & Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.map((insight, index) => (
            <div key={index} className={`p-4 rounded-lg border-l-4 ${insight.type === 'positive' ? 'bg-green-50 border-green-500' : insight.type === 'warning' ? 'bg-yellow-50 border-yellow-500' : 'bg-blue-50 border-blue-500'}`}>
              <h4 className="font-medium mb-1">{insight.title}</h4>
              <p className="text-sm text-gray-700">{insight.description}</p>
              {insight.action && (
                <p className="text-sm font-medium mt-2 text-blue-600">{insight.action}</p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Helper function to format period
function formatPeriod(period: string): string {
  const date = new Date(period)
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

// Generate insights based on stats
function generateInsights(stats: ApplicationStatsType) {
  const insights = []

  // Success rate insights
  const successRate = stats.total > 0 ? ((stats.byStatus.offered || 0) + (stats.byStatus.hired || 0)) / stats.total * 100 : 0
  if (successRate > 20) {
    insights.push({
      type: 'positive',
      title: 'Strong Performance',
      description: `Your success rate of ${successRate.toFixed(1)}% is above average. Keep up the great work!`,
      action: 'Consider applying to similar roles or companies.'
    })
  } else if (successRate < 10) {
    insights.push({
      type: 'warning',
      title: 'Low Success Rate',
      description: `Your success rate of ${successRate.toFixed(1)}% could be improved.`,
      action: 'Review your resume and cover letter, or consider upskilling in high-demand areas.'
    })
  }

  // Top performing companies
  const topCompanies = stats.byCompany.filter(c => c.successRate > 30).slice(0, 3)
  if (topCompanies.length > 0) {
    insights.push({
      type: 'positive',
      title: 'Top Performing Companies',
      description: `You have good success rates with ${topCompanies.map(c => c.companyName).join(', ')}.`,
      action: 'Look for more opportunities at these companies or similar ones.'
    })
  }

  // Application frequency
  if (stats.byTimePeriod.length > 0) {
    const recentPeriods = stats.byTimePeriod.slice(0, 3)
    const recentApplications = recentPeriods.reduce((sum, p) => sum + p.applications, 0)
    const earlierPeriods = stats.byTimePeriod.slice(3, 6)
    const earlierApplications = earlierPeriods.reduce((sum, p) => sum + p.applications, 0)

    if (recentApplications < earlierApplications / 2) {
      insights.push({
        type: 'warning',
        title: 'Decreasing Application Rate',
        description: 'You\'ve been applying to fewer jobs recently.',
        action: 'Consider setting a weekly goal for job applications.'
      })
    }
  }

  // Skills insights
  if (stats.topSkills.length > 0) {
    const topSkill = stats.topSkills[0]
    if (topSkill.successRate > 25) {
      insights.push({
        type: 'positive',
        title: 'Strong Skill Match',
        description: `Your "${topSkill.skill}" skill has a high success rate of ${topSkill.successRate.toFixed(1)}%.`,
        action: 'Highlight this skill more prominently in your applications.'
      })
    }
  }

  return insights
}