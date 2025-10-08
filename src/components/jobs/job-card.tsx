import { Job } from '@/types/jobs'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Briefcase, MapPin, Clock, Building2, Bookmark, BookmarkCheck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { useToast } from '@/hooks/use-toast'
import { useState } from 'react'

interface JobCardProps {
  job: Job
  isSaved?: boolean
  onToggleSave?: (jobId: string) => void
}

export function JobCard({ job, isSaved = false, onToggleSave }: JobCardProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!session?.user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to save jobs.",
        variant: "destructive"
      })
      return
    }

    if (session.user.role !== 'seeker') {
      toast({
        title: "Access Denied",
        description: "Only job seekers can save jobs.",
        variant: "destructive"
      })
      return
    }

    setIsSaving(true)

    try {
      if (onToggleSave) {
        onToggleSave(job.id)
      } else {
        // Default save functionality if no handler provided
        const method = isSaved ? 'DELETE' : 'POST'
        const url = isSaved ? `/api/saved-jobs/${job.id}` : '/api/saved-jobs'

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json'
          },
          ...(method === 'POST' && { body: JSON.stringify({ jobId: job.id }) })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to save job')
        }

        const data = await response.json()

        toast({
          title: isSaved ? "Job Removed" : "Job Saved",
          description: isSaved
            ? "The job has been removed from your saved list."
            : "The job has been added to your saved list."
        })
      }
    } catch (error) {
      console.error('Error toggling save:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save job. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }
  return (
    <Card className="p-6 hover:border-primary transition-colors">
      <div className="flex items-start gap-4">
        {/* Company Logo */}
        <div className="w-12 h-12 relative flex-shrink-0">
          {job.company.logo ? (
            <Image
              src={job.company.logo}
              alt={job.company.name}
              className="rounded-lg object-contain"
              fill
              sizes="48px"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
              <Building2 className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="flex-grow">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <Link 
                href={`/jobs/${job.id}`}
                className="text-lg font-semibold hover:text-primary transition-colors line-clamp-1"
              >
                {job.title}
              </Link>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  {job.company.name}
                </span>
                {job.company.isVerified && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Verified
                  </Badge>
                )}
              </div>
            </div>

            {/* Category */}
            {job.category && (
              <Badge
                variant="outline"
                className="hidden sm:flex"
                style={{
                  backgroundColor: job.category.color || undefined,
                  color: job.category.color ? '#fff' : undefined
                }}
              >
                {job.category.icon && (
                  <span className="mr-1">{job.category.icon}</span>
                )}
                {job.category.name}
              </Badge>
            )}
          </div>

          {/* Details */}
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {job.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {job.location}
              </span>
            )}
            {job.type && (
              <span className="flex items-center gap-1">
                <Briefcase className="w-4 h-4" />
                {job.type}
              </span>
            )}
            {job.remote && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Remote
              </Badge>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
            </span>
          </div>

          {/* Salary */}
          {job.salary && (
            <div className="mt-3">
              <Badge variant="secondary" className="text-sm">
                {job.salary.min.toLocaleString()} - {job.salary.max.toLocaleString()} {job.salary.currency}
              </Badge>
            </div>
          )}

          {/* Description */}
          <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
            {job.description}
          </p>

          {/* Actions */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                {job.applicantCount} {job.applicantCount === 1 ? 'applicant' : 'applicants'}
              </Badge>
              {job.experience && (
                <Badge variant="secondary" className="bg-purple-50 text-purple-700">
                  {job.experience}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleSave}
                disabled={isSaving}
                className={isSaved ? "text-blue-600 border-blue-200 hover:bg-blue-50" : ""}
              >
                {isSaving ? (
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                ) : isSaved ? (
                  <BookmarkCheck className="h-4 w-4" />
                ) : (
                  <Bookmark className="h-4 w-4" />
                )}
              </Button>
              <Button asChild>
                <Link href={`/jobs/${job.id}/apply`}>
                  Apply Now
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
