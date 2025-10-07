'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ApplicationStatus } from '@/types/applications'
import {
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Star,
  Building,
  AlertCircle,
  Target,
  Activity,
} from 'lucide-react'

interface ApplicationStatsProps {
  total: number
  counts: Record<ApplicationStatus, number>
  compact?: boolean
  className?: string
}

const statusIcons = {
  applied: CheckCircle,
  reviewing: Clock,
  shortlisted: Star,
  interview_scheduled: Calendar,
  interview_completed: CheckCircle,
  offered: TrendingUp,
  rejected: XCircle,
  withdrawn: AlertCircle,
  hired: Target,
  archived: Activity,
}

const statusColors = {
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

const statusLabels = {
  applied: 'Applied',
  reviewing: 'Under Review',
  shortlisted: 'Shortlisted',
  interview_scheduled: 'Interview',
  interview_completed: 'Interview Complete',
  offered: 'Offer Received',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
  hired: 'Hired',
  archived: 'Archived',
}

export function ApplicationStats({
  total,
  counts,
  compact = false,
  className,
}: ApplicationStatsProps) {
  if (compact) {
    return (
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
        <StatCard
          title="Total Applications"
          value={total}
          icon={BarChart3}
          color="bg-blue-500"
        />
        <StatCard
          title="Under Review"
          value={counts.reviewing || 0}
          icon={Clock}
          color="bg-yellow-500"
        />
        <StatCard
          title="Interviews"
          value={(counts.interview_scheduled || 0) + (counts.interview_completed || 0)}
          icon={Calendar}
          color="bg-purple-500"
        />
        <StatCard
          title="Offers"
          value={counts.offered || 0}
          icon={TrendingUp}
          color="bg-emerald-500"
        />
      </div>
    )
  }

  const activeApplications = total - (counts.archived || 0)
  const successRate = total > 0 ? ((counts.offered || 0) + (counts.hired || 0)) / total * 100 : 0
  const interviewRate = total > 0 ? ((counts.interview_scheduled || 0) + (counts.interview_completed || 0)) / total * 100 : 0
  const rejectionRate = total > 0 ? (counts.rejected || 0) / total * 100 : 0

  const statusEntries = Object.entries(counts).filter(([_, count]) => count > 0)

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Applications"
          value={total}
          icon={BarChart3}
          color="bg-blue-500"
          subtitle={`${activeApplications} active`}
        />
        <StatCard
          title="Success Rate"
          value={`${successRate.toFixed(1)}%`}
          icon={TrendingUp}
          color="bg-green-500"
          subtitle={`${(counts.offered || 0) + (counts.hired || 0)} offers/hired`}
        />
        <StatCard
          title="Interview Rate"
          value={`${interviewRate.toFixed(1)}%`}
          icon={Calendar}
          color="bg-purple-500"
          subtitle={`${(counts.interview_scheduled || 0) + (counts.interview_completed || 0)} interviews`}
        />
        <StatCard
          title="Active Companies"
          value={new Set(statusEntries.map(([status]) => status)).size}
          icon={Building}
          color="bg-indigo-500"
          subtitle={`${statusEntries.length} companies`}
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
            {statusEntries.map(([status, count]) => {
              const percentage = total > 0 ? (count / total) * 100 : 0
              const Icon = statusIcons[status as ApplicationStatus]
              const color = statusColors[status as ApplicationStatus]
              const label = statusLabels[status as ApplicationStatus]

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
              <span className="font-medium">{counts.offered || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Hired</span>
              <span className="font-medium">{counts.hired || 0}</span>
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
              <span className="font-medium">{counts.reviewing || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Shortlisted</span>
              <span className="font-medium">{counts.shortlisted || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Interview Scheduled</span>
              <span className="font-medium">{counts.interview_scheduled || 0}</span>
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
              <span className="font-medium">{counts.rejected || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Withdrawn</span>
              <span className="font-medium">{counts.withdrawn || 0}</span>
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