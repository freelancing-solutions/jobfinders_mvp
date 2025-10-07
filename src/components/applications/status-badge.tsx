'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type ApplicationStatus =
  | 'applied'
  | 'reviewing'
  | 'shortlisted'
  | 'interview_scheduled'
  | 'interview_completed'
  | 'offered'
  | 'rejected'
  | 'withdrawn'
  | 'hired'
  | 'archived'

interface StatusBadgeProps {
  status: ApplicationStatus
  className?: string
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const statusConfig = {
  applied: {
    label: 'Applied',
    variant: 'default' as const,
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: '📤',
    description: 'Application submitted successfully',
  },
  reviewing: {
    label: 'Under Review',
    variant: 'default' as const,
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: '👁️',
    description: 'Application is being reviewed by the employer',
  },
  shortlisted: {
    label: 'Shortlisted',
    variant: 'default' as const,
    className: 'bg-green-100 text-green-800 border-green-200',
    icon: '⭐',
    description: 'Your application has been shortlisted',
  },
  interview_scheduled: {
    label: 'Interview Scheduled',
    variant: 'default' as const,
    className: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: '📅',
    description: 'Interview has been scheduled',
  },
  interview_completed: {
    label: 'Interview Completed',
    variant: 'default' as const,
    className: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    icon: '✅',
    description: 'Interview has been completed',
  },
  offered: {
    label: 'Offer Received',
    variant: 'default' as const,
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: '🎉',
    description: 'Congratulations! You received an offer',
  },
  rejected: {
    label: 'Rejected',
    variant: 'default' as const,
    className: 'bg-red-100 text-red-800 border-red-200',
    icon: '❌',
    description: 'Application was not selected',
  },
  withdrawn: {
    label: 'Withdrawn',
    variant: 'default' as const,
    className: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: '🔙',
    description: 'Application was withdrawn',
  },
  hired: {
    label: 'Hired',
    variant: 'default' as const,
    className: 'bg-teal-100 text-teal-800 border-teal-200',
    icon: '🎊',
    description: 'You were hired for this position!',
  },
  archived: {
    label: 'Archived',
    variant: 'secondary' as const,
    className: 'bg-slate-100 text-slate-800 border-slate-200',
    icon: '📁',
    description: 'Application has been archived',
  },
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
}

export function StatusBadge({ status, className, showIcon = true, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <Badge
      variant={config.variant}
      className={cn(
        'font-medium border',
        config.className,
        sizeClasses[size],
        className
      )}
      title={config.description}
    >
      {showIcon && <span className="mr-1">{config.icon}</span>}
      {config.label}
    </Badge>
  )
}

// Helper function to get status progression order
export function getStatusProgression(status: ApplicationStatus): number {
  const progression: Record<ApplicationStatus, number> = {
    applied: 1,
    reviewing: 2,
    shortlisted: 3,
    interview_scheduled: 4,
    interview_completed: 5,
    offered: 6,
    hired: 7,
    rejected: 0,
    withdrawn: -1,
    archived: -2,
  }
  return progression[status] || 0
}

// Helper function to check if status is positive
export function isPositiveStatus(status: ApplicationStatus): boolean {
  const positiveStatuses: ApplicationStatus[] = [
    'shortlisted',
    'interview_scheduled',
    'interview_completed',
    'offered',
    'hired',
  ]
  return positiveStatuses.includes(status)
}

// Helper function to check if status is final
export function isFinalStatus(status: ApplicationStatus): boolean {
  const finalStatuses: ApplicationStatus[] = [
    'rejected',
    'withdrawn',
    'hired',
    'archived',
  ]
  return finalStatuses.includes(status)
}

// Helper function to get next possible statuses
export function getNextPossibleStatuses(currentStatus: ApplicationStatus): ApplicationStatus[] {
  const statusFlow: Record<ApplicationStatus, ApplicationStatus[]> = {
    applied: ['reviewing', 'rejected', 'withdrawn'],
    reviewing: ['shortlisted', 'rejected', 'withdrawn'],
    shortlisted: ['interview_scheduled', 'rejected', 'withdrawn'],
    interview_scheduled: ['interview_completed', 'rejected', 'withdrawn'],
    interview_completed: ['offered', 'rejected', 'withdrawn'],
    offered: ['hired', 'rejected', 'withdrawn'],
    rejected: ['archived'],
    withdrawn: ['archived'],
    hired: ['archived'],
    archived: [],
  }

  return statusFlow[currentStatus] || []
}