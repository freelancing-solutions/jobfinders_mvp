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
  ResponsiveContainer
} from 'recharts'
import {
  BarChart3,
  TrendingUp,
  Building,
  MapPin,
  DollarSign,
  Award,
  Target,
  Calendar,
  Briefcase,
  Download,
  RefreshCw,
  Eye,
  Clock,
} from 'lucide-react'

interface SavedJobsAnalyticsProps {
  className?: string
  compact?: boolean
  showExport?: boolean
}

interface AnalyticsData {
  totalSaved: number
  statusBreakdown: Record<string, number>
  companyStats: Array<{ name: string; count: number; averageSalary: number }>
  locationStats: Array<{ location: string; count: number }>
  salaryInsights: { averageMin: number; median: number; marketRate: number }
  timeBasedStats: Array<{ month: string; saved: number; applied: number; interviewing: number }>
  topSkills: Array<{ skill: string; count: number; applicationRate: number }>
  applicationConversionRate: number
  averageResponseTime: number
  positionTypeStats: Record<string, number>
  remotePolicyStats: Record<string, number>
  lastUpdated: string
}

const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#6b7280', '#06b6d4', '#ec4899']

export function SavedJobsAnalytics({
  className,
  compact = false,
  showExport = true,
}: SavedJobsAnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '1y' | 'all'>('all')

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/saved-jobs/analytics')
      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }

      const data = await response.json()
      if (data.success) {
        setAnalyticsData(data.data)
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
  }, [])

  const handleExport = async () => {
    if (!analyticsData) return

    try {
      const response = await fetch('/api/saved-jobs/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ format: 'json' })
      })

      if (!response.ok) {
        throw new Error('Failed to export data')
      }

      const data = await response.json()
      const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `saved-jobs-analytics-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error exporting analytics:', err)
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-red-600 mb-4">Failed to load analytics</p>
            <Button onClick={fetchAnalytics} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analyticsData) {
    return null
  }

  const statusData = Object.entries(analyticsData.statusBreakdown).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
    color: COLORS[Object.keys(analyticsData.statusBreakdown).indexOf(status) % COLORS.length]
  }))

  const positionTypeData = Object.entries(analyticsData.positionTypeStats).map(([type, count]) => ({
    name: type,
    value: count
  }))

  const remotePolicyData = Object.entries(analyticsData.remotePolicyStats).map(([policy, count]) => ({
    name: policy,
    value: count
  }))

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Saved Jobs Analytics</h2>
          <p className="text-gray-600">Track your job search performance and insights</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchAnalytics} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
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
          title="Total Saved Jobs"
          value={analyticsData.totalSaved}
          icon={Briefcase}
          color="bg-blue-500"
        />
        <MetricCard
          title="Application Rate"
          value={`${analyticsData.applicationConversionRate.toFixed(1)}%`}
          icon={TrendingUp}
          color="bg-green-500"
        />
        <MetricCard
          title="Avg. Salary"
          value={`ZAR ${analyticsData.salaryInsights.averageMin.toLocaleString()}`}
          icon={DollarSign}
          color="bg-purple-500"
        />
        <MetricCard
          title="Top Companies"
          value={analyticsData.companyStats.length}
          icon={Building}
          color="bg-orange-500"
        />
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="companies">Companies</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Status Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{}}>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Application Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Application Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Saved Jobs</span>
                    <span className="font-semibold">{analyticsData.totalSaved}</span>
                  </div>
                  <Progress
                    value={(analyticsData.statusBreakdown.applied || 0) / analyticsData.totalSaved * 100}
                    className="h-2"
                  />
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>Applied</span>
                    <span>{analyticsData.statusBreakdown.applied || 0}</span>
                  </div>
                  <Progress
                    value={(analyticsData.statusBreakdown.interviewing || 0) / analyticsData.totalSaved * 100}
                    className="h-2"
                  />
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>Interviewing</span>
                    <span>{analyticsData.statusBreakdown.interviewing || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Position Types */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Position Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={positionTypeData}>
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

        <TabsContent value="companies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Top Companies You're Following
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.companyStats.slice(0, 10).map((company, index) => (
                  <div key={company.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                      <div>
                        <span className="font-medium">{company.name}</span>
                        <p className="text-sm text-gray-600">{company.count} saved jobs</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {company.averageSalary > 0 && (
                        <Badge variant="outline">
                          ZAR {company.averageSalary.toLocaleString()}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Preferred Locations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}}>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analyticsData.locationStats} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="location" type="category" width={150} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Top Skills in Demand
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.topSkills.slice(0, 15).map((skill, index) => (
                  <div key={skill.skill} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                      <Badge variant="outline">{skill.skill}</Badge>
                      <span className="text-sm text-gray-600">{skill.count} jobs</span>
                    </div>
                    <div className="text-right">
                      <Badge variant={skill.applicationRate > 50 ? 'default' : 'secondary'}>
                        {skill.applicationRate.toFixed(1)}% applied
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Job Search Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}}>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={analyticsData.timeBasedStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="saved" stroke="#3b82f6" name="Saved Jobs" />
                    <Line type="monotone" dataKey="applied" stroke="#10b981" name="Applied" />
                    <Line type="monotone" dataKey="interviewing" stroke="#8b5cf6" name="Interviewing" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Metric Card Component
interface MetricCardProps {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  color: string
}

function MetricCard({ title, value, icon: Icon, color }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}