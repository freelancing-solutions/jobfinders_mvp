'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
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
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Mail,
  MessageSquare,
  Smartphone,
  Monitor,
  Calendar as CalendarIcon,
  Download,
  RefreshCw,
  Eye,
  MousePointer,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Activity,
} from 'lucide-react'

interface AnalyticsData {
  overview: {
    totalSent: number
    totalDelivered: number
    totalOpened: number
    totalClicked: number
    deliveryRate: number
    openRate: number
    clickRate: number
    engagementScore: number
  }
  timeline: Array<{
    date: string
    sent: number
    delivered: number
    opened: number
    clicked: number
  }>
  channelBreakdown: Array<{
    channel: string
    sent: number
    delivered: number
    opened: number
    clicked: number
    deliveryRate: number
    engagementRate: number
  }>
  typeBreakdown: Array<{
    type: string
    count: number
    percentage: number
  }>
  topPerformers: Array<{
    type: string
    title: string
    sent: number
    openRate: number
    clickRate: number
  }>
}

const channelColors = {
  email: '#3b82f6',
  sms: '#10b981',
  push: '#8b5cf6',
  inApp: '#f59e0b',
}

const typeColors = {
  job_match: '#f59e0b',
  application_update: '#3b82f6',
  profile_view: '#8b5cf6',
  system: '#6b7280',
  marketing: '#ec4899',
}

export function NotificationAnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })
  const [groupBy, setGroupBy] = useState<'hour' | 'day' | 'week' | 'month'>('day')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedChannel, setSelectedChannel] = useState<string>('all')

  // Load analytics data
  const loadAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        startDate: startOfDay(dateRange.from).toISOString(),
        endDate: endOfDay(dateRange.to).toISOString(),
        groupBy,
      })

      if (selectedType !== 'all') params.append('type', selectedType)
      if (selectedChannel !== 'all') params.append('channel', selectedChannel)

      const response = await fetch(`/api/notifications/analytics?${params}`)
      if (!response.ok) {
        throw new Error('Failed to load analytics data')
      }

      const data = await response.json()
      if (data.success) {
        setAnalyticsData(data.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  // Export analytics
  const exportAnalytics = async (format: 'json' | 'csv') => {
    try {
      const params = new URLSearchParams({
        startDate: startOfDay(dateRange.from).toISOString(),
        endDate: endOfDay(dateRange.to).toISOString(),
        groupBy,
        format,
      })

      if (selectedType !== 'all') params.append('type', selectedType)
      if (selectedChannel !== 'all') params.append('channel', selectedChannel)

      const response = await fetch(`/api/notifications/analytics/export?${params}`)
      if (!response.ok) {
        throw new Error('Failed to export analytics')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `notification-analytics-${format}-${format(new Date(), 'yyyy-MM-dd')}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export analytics')
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [dateRange, groupBy, selectedType, selectedChannel])

  if (loading && !analyticsData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2">
          <RefreshCw className="animate-spin h-4 w-4" />
          <span>Loading analytics...</span>
        </div>
      </div>
    )
  }

  if (error && !analyticsData) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadAnalytics} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  const overview = analyticsData?.overview
  const timelineData = analyticsData?.timeline || []
  const channelData = analyticsData?.channelBreakdown || []
  const typeData = analyticsData?.typeBreakdown || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Notification Analytics</h2>
          <p className="text-gray-600">Track and analyze your notification performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => exportAnalytics('csv')}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => exportAnalytics('json')}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export JSON
          </Button>
          <Button onClick={loadAnalytics} className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Date Range */}
            <div className="space-y-2">
              <Label>Date Range</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateRange.from, 'MMM dd, yyyy')} - {format(dateRange.to, 'MMM dd, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        setDateRange({ from: range.from, to: range.to })
                      }
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Group By */}
            <div className="space-y-2">
              <Label>Group By</Label>
              <Select value={groupBy} onValueChange={(value: any) => setGroupBy(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hour">Hour</SelectItem>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter */}
            <div className="space-y-2">
              <Label>Notification Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="job_match">Job Match</SelectItem>
                  <SelectItem value="application_update">Application Update</SelectItem>
                  <SelectItem value="profile_view">Profile View</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Channel Filter */}
            <div className="space-y-2">
              <Label>Channel</Label>
              <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="push">Push</SelectItem>
                  <SelectItem value="inApp">In-App</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.totalSent || 0}</div>
            <p className="text-xs text-muted-foreground">
              Notifications sent in selected period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.deliveryRate.toFixed(1) || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Successfully delivered notifications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.openRate.toFixed(1) || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Notifications opened by users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.clickRate.toFixed(1) || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Notifications clicked by users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="timeline" className="space-y-6">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="types">Types</TabsTrigger>
          <TabsTrigger value="performers">Top Performers</TabsTrigger>
        </TabsList>

        {/* Timeline Chart */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Notification Timeline</CardTitle>
              <CardDescription>
                Notification volume and engagement over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="sent" stroke="#3b82f6" name="Sent" />
                  <Line type="monotone" dataKey="delivered" stroke="#10b981" name="Delivered" />
                  <Line type="monotone" dataKey="opened" stroke="#f59e0b" name="Opened" />
                  <Line type="monotone" dataKey="clicked" stroke="#8b5cf6" name="Clicked" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Channel Breakdown */}
        <TabsContent value="channels">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Channel Performance</CardTitle>
                <CardDescription>
                  Notifications by channel and engagement rates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={channelData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="channel" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sent" fill="#3b82f6" name="Sent" />
                    <Bar dataKey="opened" fill="#f59e0b" name="Opened" />
                    <Bar dataKey="clicked" fill="#8b5cf6" name="Clicked" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Channel Distribution</CardTitle>
                <CardDescription>
                  Percentage breakdown by channel
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={channelData.map(item => ({
                        name: item.channel,
                        value: item.sent,
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {channelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={channelColors[entry.channel as keyof typeof channelColors]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Type Breakdown */}
        <TabsContent value="types">
          <Card>
            <CardHeader>
              <CardTitle>Notification Types</CardTitle>
              <CardDescription>
                Breakdown by notification type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {typeData.map((item) => (
                  <div key={item.type} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: typeColors[item.type as keyof typeof typeColors] }}
                      />
                      <span className="capitalize">{item.type.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">{item.count} notifications</span>
                      <Badge variant="secondary">{item.percentage.toFixed(1)}%</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Performers */}
        <TabsContent value="performers">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Notifications</CardTitle>
              <CardDescription>
                Best performing notification types and templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData?.topPerformers?.map((performer, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{performer.title}</h4>
                      <p className="text-sm text-gray-600 capitalize">{performer.type.replace('_', ' ')}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-sm">
                        <Eye className="h-4 w-4" />
                        <span>{performer.openRate.toFixed(1)}% open rate</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MousePointer className="h-4 w-4" />
                        <span>{performer.clickRate.toFixed(1)}% click rate</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {performer.sent} sent
                      </div>
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