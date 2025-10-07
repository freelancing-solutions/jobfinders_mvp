import { Job } from '@/types/jobs'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Briefcase, MapPin, Clock, Building2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import Image from 'next/image'

interface JobCardProps {
  job: Job
}

export function JobCard({ job }: JobCardProps) {
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

            <Button asChild>
              <Link href={`/jobs/${job.id}/apply`}>
                Apply Now
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
