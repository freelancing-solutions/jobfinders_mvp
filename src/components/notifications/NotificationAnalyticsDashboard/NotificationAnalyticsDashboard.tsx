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
  AreaChart
} from 'recharts'
import {
  Bell,
  Mail,
  Smartphone,
  MessageSquare,
  Send,
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  MousePointer,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react'

interface NotificationAnalyticsProps {
  className?: string
  isGlobal?: boolean
  userId?: string
}

interface AnalyticsData {
  summary: {
    totalSent: number
    totalDelivered: number
    totalOpened: number
    totalClicked: number
    totalFailed: number
    deliveryRate: number
    openRate: number
    clickRate: number
    failureRate: number
  }
  channelBreakdown: Array<{ channel: string; count: number; percentage: number }>
  typeBreakdown: Array<{
    type: string
    sent: number
    delivered: number
    opened: number
    clicked: number
    deliveryRate: number
    openRate: number
    clickRate: number
  }>
  dailyMetrics: Array<{
    date: string
    sent: number
    delivered: number
    opened: number
    clicked: number
    deliveryRate: number
    openRate: number
  }>
  topTemplates?: Array<{
    id: string
    name: string
    type: string
    usageCount: number
    category: string
  }>
  recentActivity?: Array<{
    id: string
    channel: string
    status: string
    attemptedAt: string
    notificationType?: string
    notificationTitle?: string
    errorMessage?: string
  }>
  preferences?: {
    emailEnabled: boolean
    smsEnabled: boolean
    pushEnabled: boolean
    inAppEnabled: boolean
    applicationUpdates: boolean
    newJobAlerts: boolean
    jobMatches: boolean
    systemAnnouncements: boolean
    marketingEmails: boolean
    frequency: string
    timezone: string
  }
}

const COLORS = {
  email: '#3b82f6',
  sms: '#10b981',
  push: '#f59e0b',
  in_app: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6'
}

const CHANNEL_ICONS = {
  email: Mail,
  sms: Smartphone,
  push: Bell,
  in_app: MessageSquare
}

export function NotificationAnalyticsDashboard({
  className,
  isGlobal = false,
  userId
}: NotificationAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState('7d')
  const [channel, setChannel] = useState('all')
  const [type, setType] = useState('all')

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        period,
        ...(channel !== 'all' && { channel }),
        ...(type !== 'all' && { type }),
        ...(isGlobal && { global: 'true' })
      })

      const response = await fetch(`/api/notifications/analytics?${params}`)
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
  }, [period, channel, type, isGlobal])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'sent':
        return 'text-green-600'
      case 'failed':
        return 'text-red-600'
      case 'pending':
        return 'text-yellow-600'
      default:
        return 'text-gray-600'
    }
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
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
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
          <h2 className="text-2xl font-bold">Notification Analytics</h2>
          <p className="text-gray-600">
            {isGlobal ? 'Global notification performance metrics' : 'Your notification activity and preferences'}
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

          <Select value={channel} onValueChange={setChannel}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
              <SelectItem value="push">Push</SelectItem>
              <SelectItem value="in_app">In-App</SelectItem>
            </SelectContent>
          </Select>

          {isGlobal && (
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="application_status">Application Status</SelectItem>
                <SelectItem value="new_job">New Jobs</SelectItem>
                <SelectItem value="job_match">Job Matches</SelectItem>
                <SelectItem value="system_announcement">System</SelectItem>
              </SelectContent>
            </Select>
          )}

          <Button onClick={fetchAnalytics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sent</p>
                <p className="text-2xl font-bold">{analytics.summary.totalSent.toLocaleString()}</p>
              </div>
              <Send className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Delivery Rate</p>
                <p className="text-2xl font-bold">{analytics.summary.deliveryRate}%</p>
              </div>
              <div className="flex items-center gap-1">
                {analytics.summary.deliveryRate >= 90 ? (
                  <TrendingUp className="h-8 w-8 text-green-600" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-red-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open Rate</p>
                <p className="text-2xl font-bold">{analytics.summary.openRate}%</p>
              </div>
              <Eye className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Click Rate</p>
                <p className="text-2xl font-bold">{analytics.summary.clickRate}%</p>
              </div>
              <MousePointer className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="types">Types</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {isGlobal && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Channel Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Channel Performance</CardTitle>
                  <CardDescription>Delivery success by channel</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{}}>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analytics.channelBreakdown}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="channel" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="count" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Daily Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Daily Trends</CardTitle>
                  <CardDescription>Notification volume over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{}}>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={analytics.dailyMetrics}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area type="monotone" dataKey="sent" stackId="1" stroke="#3b82f6" fill="#3b82f6" />
                        <Area type="monotone" dataKey="delivered" stackId="1" stroke="#10b981" fill="#10b981" />
                        <Area type="monotone" dataKey="opened" stackId="1" stroke="#f59e0b" fill="#f59e0b" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {!isGlobal && analytics.preferences && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Your current notification settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">Email</span>
                    <Badge variant={analytics.preferences.emailEnabled ? 'default' : 'secondary'}>
                      {analytics.preferences.emailEnabled ? 'On' : 'Off'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">SMS</span>
                    <Badge variant={analytics.preferences.smsEnabled ? 'default' : 'secondary'}>
                      {analytics.preferences.smsEnabled ? 'On' : 'Off'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">Push</span>
                    <Badge variant={analytics.preferences.pushEnabled ? 'default' : 'secondary'}>
                      {analytics.preferences.pushEnabled ? 'On' : 'Off'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">In-App</span>
                    <Badge variant={analytics.preferences.inAppEnabled ? 'default' : 'secondary'}>
                      {analytics.preferences.inAppEnabled ? 'On' : 'Off'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="channels" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Channel Breakdown</CardTitle>
              <CardDescription>Performance metrics by notification channel</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.channelBreakdown.map((channel) => {
                  const Icon = CHANNEL_ICONS[channel.channel as keyof typeof CHANNEL_ICONS] || Bell
                  return (
                    <div key={channel.channel} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gray-100">
                          <Icon className="h-5 w-5" style={{ color: COLORS[channel.channel as keyof typeof COLORS] }} />
                        </div>
                        <div>
                          <p className="font-medium capitalize">{channel.channel.replace('_', ' ')}</p>
                          <p className="text-sm text-gray-600">{channel.count.toLocaleString()} notifications</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{channel.percentage}%</p>
                        <p className="text-sm text-gray-600">of total</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Types</CardTitle>
              <CardDescription>Engagement metrics by notification type</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}}>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analytics.typeBreakdown} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="type" type="category" width={120} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="sent" fill="#3b82f6" name="Sent" />
                    <Bar dataKey="delivered" fill="#10b981" name="Delivered" />
                    <Bar dataKey="opened" fill="#f59e0b" name="Opened" />
                    <Bar dataKey="clicked" fill="#8b5cf6" name="Clicked" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest notification deliveries and status updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.recentActivity?.slice(0, 10).map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(activity.status)}
                      <div>
                        <p className="font-medium">{activity.notificationTitle || 'Unknown Notification'}</p>
                        <p className="text-sm text-gray-600">
                          {activity.notificationType && `${activity.notificationType} • `}
                          {activity.channel}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${getStatusColor(activity.status)}`}>
                        {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.attemptedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}