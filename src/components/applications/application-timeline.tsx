'use client'

import { StatusBadge, ApplicationStatus } from './status-badge'
import { formatDistanceToNow } from 'date-fns'
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ArrowRight,
  Calendar,
  User,
  MessageSquare,
} from 'lucide-react'

interface TimelineEvent {
  id: string
  status: ApplicationStatus
  timestamp: string
  note?: string
  updatedBy: string
  updatedByRole?: string
  attachments?: Array<{
    name: string
    url: string
    type: string
  }>
}

interface ApplicationTimelineProps {
  events: TimelineEvent[]
  currentStatus: ApplicationStatus
  showFuture?: boolean
  className?: string
}

const statusIcons = {
  applied: CheckCircle2,
  reviewing: Clock,
  shortlisted: CheckCircle2,
  interview_scheduled: Calendar,
  interview_completed: CheckCircle2,
  offered: CheckCircle2,
  rejected: XCircle,
  withdrawn: AlertCircle,
  hired: CheckCircle2,
  archived: CheckCircle2,
}

const statusDescriptions = {
  applied: 'Application submitted successfully',
  reviewing: 'Application is under review',
  shortlisted: 'Application shortlisted for further consideration',
  interview_scheduled: 'Interview scheduled',
  interview_completed: 'Interview completed',
  offered: 'Job offer received',
  rejected: 'Application was not selected',
  withdrawn: 'Application withdrawn by candidate',
  hired: 'Candidate was hired for the position',
  archived: 'Application archived',
}

export function ApplicationTimeline({
  events,
  currentStatus,
  showFuture = false,
  className,
}: ApplicationTimelineProps) {
  // Sort events by timestamp
  const sortedEvents = [...events].sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )

  const isEventCompleted = (eventStatus: ApplicationStatus) => {
    // If this is the current status, it's completed
    if (eventStatus === currentStatus) return true

    // If the current status is after this one in the flow, it's completed
    const statusFlow: ApplicationStatus[] = [
      'applied',
      'reviewing',
      'shortlisted',
      'interview_scheduled',
      'interview_completed',
      'offered',
      'hired'
    ]

    const currentIndex = statusFlow.indexOf(currentStatus)
    const eventIndex = statusFlow.indexOf(eventStatus)

    // Handle special cases for rejected, withdrawn, archived
    if (['rejected', 'withdrawn', 'archived'].includes(currentStatus)) {
      return true
    }

    return currentIndex > eventIndex
  }

  const getEventIcon = (status: ApplicationStatus) => {
    const Icon = statusIcons[status]
    const isCompleted = isEventCompleted(status)

    if (['rejected', 'withdrawn'].includes(status)) {
      return <XCircle className="h-5 w-5 text-red-500" />
    }

    if (isCompleted) {
      return <Icon className="h-5 w-5 text-green-500" />
    }

    return <Icon className="h-5 w-5 text-gray-400" />
  }

  const getEventLine = (status: ApplicationStatus, index: number) => {
    const isCompleted = isEventCompleted(status)
    const isLast = index === sortedEvents.length - 1

    if (isLast) return null

    if (['rejected', 'withdrawn'].includes(status)) {
      return <div className="absolute left-2.5 top-8 w-0.5 h-8 bg-red-200" />
    }

    return (
      <div className={`absolute left-2.5 top-8 w-0.5 h-8 ${
        isCompleted ? 'bg-green-200' : 'bg-gray-200'
      }`} />
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-semibold">Application Timeline</h3>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <div className="relative">
        {sortedEvents.map((event, index) => {
          const Icon = statusIcons[event.status]
          const isCompleted = isEventCompleted(event.status)
          const eventDate = new Date(event.timestamp)

          return (
            <div key={event.id} className="relative flex items-start gap-4 pb-8 last:pb-0">
              {/* Timeline Line */}
              {getEventLine(event.status, index)}

              {/* Status Icon */}
              <div className="relative z-10 flex items-center justify-center">
                {getEventIcon(event.status)}
              </div>

              {/* Event Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <StatusBadge status={event.status} size="sm" />
                  <span className="text-sm text-gray-500">
                    {formatDistanceToNow(eventDate, { addSuffix: true })}
                  </span>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-gray-700">
                    {statusDescriptions[event.status]}
                  </p>

                  {event.note && (
                    <div className="bg-gray-50 p-3 rounded-lg border-l-4 border-blue-200">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-700">{event.note}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>Updated by {event.updatedBy}</span>
                      {event.updatedByRole && (
                        <span className="text-gray-400">({event.updatedByRole})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{eventDate.toLocaleDateString()}</span>
                    </div>
                  </div>

                  {event.attachments && event.attachments.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-600">Attachments:</p>
                      {event.attachments.map((attachment, attIndex) => (
                        <a
                          key={attIndex}
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800"
                        >
                          <span>📎</span>
                          <span>{attachment.name}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Current Status Summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <h4 className="font-medium">Current Status</h4>
          <ArrowRight className="h-4 w-4 text-gray-500" />
          <StatusBadge status={currentStatus} />
        </div>
        <p className="text-sm text-gray-600">
          {statusDescriptions[currentStatus]}
        </p>
      </div>

      {/* Next Steps */}
      {showFuture && !['rejected', 'withdrawn', 'hired', 'archived'].includes(currentStatus) && (
        <div className="border-2 border-dashed border-gray-300 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Next Steps</h4>
          <p className="text-sm text-gray-600">
            Based on your current status, you can expect the company to contact you within
            the next few business days if your application is being considered.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <div className="h-2 w-2 bg-yellow-500 rounded-full animate-pulse" />
            <span className="text-sm text-gray-500">Status updates will appear here automatically</span>
          </div>
        </div>
      )}
    </div>
  )
}