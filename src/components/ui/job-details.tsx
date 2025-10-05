'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  MapPin, 
  Briefcase, 
  Clock, 
  DollarSign, 
  Building2, 
  Calendar,
  Users,
  ExternalLink,
  Share2,
  BookmarkPlus,
  CheckCircle
} from 'lucide-react'

interface Job {
  id: string
  title: string
  company: string
  location: string
  salaryMin?: number
  salaryMax?: number
  currency: string
  positionType: string
  remotePolicy: string
  description: string
  postedAt: string
  expiresAt?: string
  experienceLevel?: string
  educationRequirements?: any
  requiredSkills?: string[]
  preferredSkills?: string[]
  requiredDocuments?: string[]
  isFeatured: boolean
  isUrgent: boolean
  companyLogo?: string
  companyDescription?: string
  companyWebsite?: string
  applicationCount: number
  viewCount: number
  matchScore?: number
}

interface JobDetailsProps {
  job: Job
  onApply?: (jobId: string) => void
  onSaveJob?: (jobId: string) => void
  onShare?: (jobId: string) => void
  isSaved?: boolean
  hasApplied?: boolean
  className?: string
}

export function JobDetails({ 
  job, 
  onApply, 
  onSaveJob, 
  onShare, 
  isSaved = false, 
  hasApplied = false,
  className 
}: JobDetailsProps) {
  const formatSalary = (min?: number, max?: number, currency: string = 'ZAR') => {
    if (!min && !max) return 'Salary not specified'
    if (min && max) return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`
    if (min) return `${currency} ${min.toLocaleString()}+`
    if (max) return `Up to ${currency} ${max.toLocaleString()}`
    return 'Salary not specified'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getDaysUntilExpiration = (expiresAt?: string) => {
    if (!expiresAt) return null
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diffTime = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return 'Expired'
    if (diffDays === 0) return 'Expires today'
    if (diffDays === 1) return 'Expires tomorrow'
    if (diffDays <= 7) return `Expires in ${diffDays} days`
    return `Expires ${formatDate(expiresAt)}`
  }

  const getPositionTypeLabel = (type: string) => {
    switch (type) {
      case 'full_time': return 'Full Time'
      case 'part_time': return 'Part Time'
      case 'contract': return 'Contract'
      case 'internship': return 'Internship'
      default: return type.replace('_', ' ')
    }
  }

  const getRemotePolicyLabel = (policy: string) => {
    switch (policy) {
      case 'remote': return 'Remote'
      case 'onsite': return 'On-site'
      case 'hybrid': return 'Hybrid'
      default: return policy.replace('_', ' ')
    }
  }

  const getExperienceLevelLabel = (level?: string) => {
    if (!level) return 'Not specified'
    switch (level) {
      case 'entry': return 'Entry Level'
      case 'junior': return 'Junior'
      case 'mid': return 'Mid Level'
      case 'senior': return 'Senior'
      case 'lead': return 'Lead'
      case 'executive': return 'Executive'
      default: return level.replace('_', ' ')
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Job Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-start gap-4 mb-4">
                {job.companyLogo && (
                  <img 
                    src={job.companyLogo} 
                    alt={job.company}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <CardTitle className="text-3xl font-bold mb-2">
                        {job.title}
                      </CardTitle>
                      <CardDescription className="text-xl font-medium text-gray-700">
                        {job.company}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col gap-1">
                      {job.isFeatured && (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          Featured
                        </Badge>
                      )}
                      {job.isUrgent && (
                        <Badge className="bg-red-100 text-red-800">
                          Urgent
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <span className="font-medium">
                        {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      <span>{getPositionTypeLabel(job.positionType)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>{getRemotePolicyLabel(job.remotePolicy)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Posted {formatDate(job.postedAt)}</span>
                    </div>
                  </div>

                  {job.matchScore && (
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${job.matchScore}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-green-600">
                        {job.matchScore}% Match
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                size="lg" 
                onClick={() => onApply?.(job.id)}
                disabled={hasApplied}
                className={hasApplied ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                {hasApplied ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Applied
                  </>
                ) : 'Apply Now'}
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => onSaveJob?.(job.id)}
              >
                <BookmarkPlus className="h-4 w-4 mr-2" />
                {isSaved ? 'Saved' : 'Save'}
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => onShare?.(job.id)}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Job Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Description */}
          <Card>
            <CardHeader>
              <CardTitle>Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-line">{job.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card>
            <CardHeader>
              <CardTitle>Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {job.experienceLevel && (
                <div>
                  <h4 className="font-semibold mb-2">Experience Level</h4>
                  <Badge variant="outline">
                    {getExperienceLevelLabel(job.experienceLevel)}
                  </Badge>
                </div>
              )}

              {job.requiredSkills && job.requiredSkills.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Required Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {job.requiredSkills.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {job.preferredSkills && job.preferredSkills.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Preferred Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {job.preferredSkills.map((skill, index) => (
                      <Badge key={index} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {job.requiredDocuments && job.requiredDocuments.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Required Documents</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {job.requiredDocuments.map((doc, index) => (
                      <li key={index} className="text-sm">{doc}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Company Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">About Company</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {job.companyDescription && (
                <p className="text-sm text-gray-600">{job.companyDescription}</p>
              )}
              
              {job.companyWebsite && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => window.open(job.companyWebsite, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visit Website
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Job Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Job Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Views</span>
                <span className="font-medium">{job.viewCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Applications</span>
                <span className="font-medium">{job.applicationCount}</span>
              </div>
              <Separator />
              {job.expiresAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Deadline</span>
                  <span className="font-medium text-orange-600">
                    {getDaysUntilExpiration(job.expiresAt)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => onSaveJob?.(job.id)}
              >
                <BookmarkPlus className="h-4 w-4 mr-2" />
                {isSaved ? 'Remove from Saved' : 'Save Job'}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => onShare?.(job.id)}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share Job
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
              >
                <Users className="h-4 w-4 mr-2" />
                Similar Jobs
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}