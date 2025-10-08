'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StatusBadge, ApplicationStatus, getStatusProgression, isFinalStatus } from './status-badge'
import { formatDistanceToNow } from 'date-fns'
import {
  Building2,
  MapPin,
  DollarSign,
  Clock,
  Calendar,
  FileText,
  MoreHorizontal,
  ExternalLink,
  Archive,
  Trash2,
  Edit,
  MessageSquare,
  Bell,
  Eye,
} from 'lucide-react'

interface Application {
  id: string
  jobId: string
  userId: string
  status: ApplicationStatus
  appliedAt: string
  updatedAt: string
  job: {
    id: string
    title: string
    company: {
      id: string
      name: string
      logo?: string
      location?: string
    }
    location: string
    salaryMin?: number
    salaryMax?: number
    currency: string
    positionType: string
    remotePolicy: string
    description: string
    requirements: string[]
    isFeatured: boolean
    isUrgent: boolean
    postedAt: string
    expiresAt?: string
    applicationCount: number
  }
  resume?: {
    id: string
    title: string
    fileUrl: string
  }
  coverLetter?: string
  notes?: string
  matchScore?: number
  viewCount?: number
  timeline?: Array<{
    status: ApplicationStatus
    timestamp: string
    note?: string
    updatedBy: string
  }>
}

interface ApplicationCardProps {
  application: Application
  onView?: (application: Application) => void
  onEdit?: (application: Application) => void
  onStatusUpdate?: (applicationId: string, newStatus: ApplicationStatus) => void
  onWithdraw?: (applicationId: string) => void
  onArchive?: (applicationId: string) => void
  onDelete?: (applicationId: string) => void
  onAddNote?: (applicationId: string, note: string) => void
  showTimeline?: boolean
  className?: string
}

export function ApplicationCard({
  application,
  onView,
  onEdit,
  onStatusUpdate,
  onWithdraw,
  onArchive,
  onDelete,
  onAddNote,
  showTimeline = false,
  className,
}: ApplicationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const {
    id,
    status,
    appliedAt,
    updatedAt,
    job,
    resume,
    coverLetter,
    notes,
    matchScore,
    viewCount,
    timeline,
  } = application

  const isActive = !isFinalStatus(status)
  const daysSinceApplied = formatDistanceToNow(new Date(appliedAt), { addSuffix: true })
  const lastUpdated = formatDistanceToNow(new Date(updatedAt), { addSuffix: true })

  const handleViewJob = () => {
    window.open(`/jobs/${job.id}`, '_blank')
  }

  const getStatusColor = (status: ApplicationStatus) => {
    const progression = getStatusProgression(status)
    if (progression >= 5) return 'text-green-600'
    if (progression >= 3) return 'text-blue-600'
    if (progression >= 1) return 'text-yellow-600'
    return 'text-gray-600'
  }

  return (
    <Card className={`transition-shadow hover:shadow-md ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {/* Company Logo */}
            <Avatar className="h-12 w-12">
              <AvatarImage src={job.company.logo} alt={job.company.name} />
              <AvatarFallback>
                <Building2 className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>

            {/* Job Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-lg font-semibold truncate">
                  {job.title}
                </CardTitle>
                {job.isFeatured && (
                  <Badge variant="secondary" className="text-xs">
                    Featured
                  </Badge>
                )}
                {job.isUrgent && (
                  <Badge variant="destructive" className="text-xs">
                    Urgent
                  </Badge>
                )}
              </div>

              <CardDescription className="flex items-center gap-4 text-sm">
                <span className="font-medium text-gray-900">{job.company.name}</span>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>{job.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{job.positionType}</span>
                </div>
              </CardDescription>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <StatusBadge status={status} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView?.(application)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleViewJob}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Job Posting
                  </DropdownMenuItem>
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(application)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Notes
                    </DropdownMenuItem>
                  )}
                  {onAddNote && (
                    <DropdownMenuItem onClick={() => onAddNote(id, '')}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Add Note
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  {isActive && onWithdraw && (
                    <DropdownMenuItem
                      onClick={() => onWithdraw(id)}
                      className="text-yellow-600"
                    >
                      <Archive className="mr-2 h-4 w-4" />
                      Withdraw Application
                    </DropdownMenuItem>
                  )}
                  {onArchive && (
                    <DropdownMenuItem onClick={() => onArchive(id)}>
                      <Archive className="mr-2 h-4 w-4" />
                      Archive
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={() => onDelete(id)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status and Timeline */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>Applied {daysSinceApplied}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>Updated {lastUpdated}</span>
            </div>
          </div>
          {matchScore && (
            <Badge variant="outline" className="text-green-600">
              {matchScore}% Match
            </Badge>
          )}
        </div>

        {/* Salary and Position Details */}
        <div className="flex items-center gap-4 text-sm">
          {(job.salaryMin || job.salaryMax) && (
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-gray-500" />
              <span>
                {job.salaryMin && job.salaryMax
                  ? `${job.currency}${job.salaryMin.toLocaleString()} - ${job.currency}${job.salaryMax.toLocaleString()}`
                  : job.salaryMin
                  ? `${job.currency}${job.salaryMin.toLocaleString()}+`
                  : `Up to ${job.currency}${job.salaryMax?.toLocaleString()}`}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Building2 className="h-4 w-4 text-gray-500" />
            <span>{job.remotePolicy}</span>
          </div>
          {viewCount && (
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4 text-gray-500" />
              <span>{viewCount} views</span>
            </div>
          )}
        </div>

        {/* Application Details */}
        {(resume || coverLetter || notes) && (
          <div className="space-y-2">
            {resume && (
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-gray-500" />
                <span>Resume: {resume.title}</span>
              </div>
            )}
            {coverLetter && (
              <div className="text-sm">
                <span className="text-gray-500">Cover Letter: </span>
                <span className="line-clamp-2">{coverLetter}</span>
              </div>
            )}
            {notes && (
              <div className="text-sm bg-gray-50 p-2 rounded">
                <span className="text-gray-500">Notes: </span>
                <span className="line-clamp-2">{notes}</span>
              </div>
            )}
          </div>
        )}

        {/* Timeline */}
        {showTimeline && timeline && timeline.length > 0 && (
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-0 h-auto text-sm"
            >
              <Clock className="mr-2 h-4 w-4" />
              Timeline ({timeline.length} updates)
            </Button>
            {isExpanded && (
              <div className="space-y-2 pl-6 border-l-2 border-gray-200">
                {timeline.map((event, index) => (
                  <div key={index} className="relative">
                    <div className="absolute -left-6 w-3 h-3 bg-white border-2 border-gray-300 rounded-full" />
                    <div className="text-sm">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={event.status} size="sm" />
                        <span className="text-gray-500">
                          {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                      {event.note && (
                        <p className="text-gray-600 mt-1">{event.note}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView?.(application)}
            className="flex-1"
          >
            View Details
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewJob}
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Job
          </Button>
          {isActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onStatusUpdate?.(id, status)}
            >
              <Bell className="h-4 w-4 mr-1" />
              Follow Up
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}