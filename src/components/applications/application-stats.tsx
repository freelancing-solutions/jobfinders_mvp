'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { ApplicationStats as ApplicationStatsType } from '@/hooks/use-applications'
import {
  BarChart3,
  TrendingUp,
  Briefcase,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Building,
  Target,
  Activity,
} from 'lucide-react'

interface ApplicationStatsProps {
  stats: ApplicationStatsType | null
  loading?: boolean
  compact?: boolean
  className?: string
}

export function ApplicationStats({
  stats,
  loading = false,
  compact = false,
  className,
}: ApplicationStatsProps) {
  if (loading) {
    return (
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="text-center text-gray-500">
                <div className="text-2xl font-bold">-</div>
                <div className="text-sm">No data</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (compact) {
    return (
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
        <StatCard
          title="Total Applications"
          value={stats.total}
          icon={BarChart3}
          color="bg-blue-500"
        />
        <StatCard
          title="Under Review"
          value={stats.byStatus.reviewing || 0}
          icon={Clock}
          color="bg-yellow-500"
        />
        <StatCard
          title="Interviews"
          value={(stats.byStatus.interview_scheduled || 0) + (stats.byStatus.interview_completed || 0)}
          icon={Calendar}
          color="bg-purple-500"
        />
        <StatCard
          title="Offers"
          value={stats.byStatus.offered || 0}
          icon={TrendingUp}
          color="bg-emerald-500"
        />
      </div>
    )
  }

  const successRate = stats.total > 0 ? ((stats.byStatus.offered || 0) + (stats.byStatus.hired || 0)) / stats.total * 100 : 0
  const interviewRate = stats.total > 0 ? ((stats.byStatus.interview_scheduled || 0) + (stats.byStatus.interview_completed || 0)) / stats.total * 100 : 0
  const rejectionRate = stats.total > 0 ? (stats.byStatus.rejected || 0) / stats.total * 100 : 0

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Applications"
          value={stats.total}
          icon={BarChart3}
          color="bg-blue-500"
          subtitle={`${stats.active} active`}
        />
        <StatCard
          title="Success Rate"
          value={`${successRate.toFixed(1)}%`}
          icon={TrendingUp}
          color="bg-green-500"
          subtitle={`${(stats.byStatus.offered || 0) + (stats.byStatus.hired || 0)} offers/hired`}
        />
        <StatCard
          title="Interview Rate"
          value={`${interviewRate.toFixed(1)}%`}
          icon={Calendar}
          color="bg-purple-500"
          subtitle={`${(stats.byStatus.interview_scheduled || 0) + (stats.byStatus.interview_completed || 0)} interviews`}
        />
        <StatCard
          title="Active Companies"
          value={stats.byCompany.length}
          icon={Building}
          color="bg-indigo-500"
          subtitle={`${stats.byCompany.length} companies`}
        />
      </div>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Application Status Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(stats.byStatus).filter(([_, count]) => count > 0).map(([status, count]) => {
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0
              const { icon: Icon, color, label } = getStatusInfo(status)

              return (
                <div key={status} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${color}`} />
                      <Icon className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{count} applications</span>
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Success Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Offers Received</span>
              <span className="font-medium">{stats.byStatus.offered || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Hired</span>
              <span className="font-medium">{stats.byStatus.hired || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Success Rate</span>
              <span className="font-medium">{successRate.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              Active Applications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Under Review</span>
              <span className="font-medium">{stats.byStatus.reviewing || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Shortlisted</span>
              <span className="font-medium">{stats.byStatus.shortlisted || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Interview Scheduled</span>
              <span className="font-medium">{stats.byStatus.interview_scheduled || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              Rejection Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Rejected</span>
              <span className="font-medium">{stats.byStatus.rejected || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Withdrawn</span>
              <span className="font-medium">{stats.byStatus.withdrawn || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Rejection Rate</span>
              <span className="font-medium">{rejectionRate.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  color: string
  subtitle?: string
}

function StatCard({ title, value, icon: Icon, color, subtitle }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
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

function getStatusInfo(status: string) {
  const statusMap: Record<string, { icon: React.ComponentType<{ className?: string }>, color: string, label: string }> = {
    applied: {
      icon: CheckCircle,
      color: 'bg-blue-500',
      label: 'Applied',
    },
    reviewing: {
      icon: Clock,
      color: 'bg-yellow-500',
      label: 'Under Review',
    },
    shortlisted: {
      icon: Target,
      color: 'bg-green-500',
      label: 'Shortlisted',
    },
    interview_scheduled: {
      icon: Calendar,
      color: 'bg-purple-500',
      label: 'Interview Scheduled',
    },
    interview_completed: {
      icon: CheckCircle,
      color: 'bg-indigo-500',
      label: 'Interview Complete',
    },
    offered: {
      icon: TrendingUp,
      color: 'bg-emerald-500',
      label: 'Offer Received',
    },
    rejected: {
      icon: XCircle,
      color: 'bg-red-500',
      label: 'Rejected',
    },
    withdrawn: {
      icon: Activity,
      color: 'bg-gray-500',
      label: 'Withdrawn',
    },
    hired: {
      icon: Target,
      color: 'bg-teal-500',
      label: 'Hired',
    },
    archived: {
      icon: Activity,
      color: 'bg-slate-500',
      label: 'Archived',
    },
  }

  return statusMap[status] || {
    icon: Activity,
    color: 'bg-gray-500',
    label: status.charAt(0).toUpperCase() + status.slice(1),
  }
}