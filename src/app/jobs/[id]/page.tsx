'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { ApplicationModal } from '@/components/jobs/application-modal'
import { 
  MapPin, 
  Briefcase, 
  Building2, 
  Calendar,
  DollarSign,
  Clock,
  Users,
  ArrowLeft,
  Share2,
  Heart,
  ExternalLink,
  Mail,
  Phone,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { useJobDetails } from '@/hooks/use-job-details'
import { formatSalary, formatDate, getLocationString, getJobTypeLabel, getExperienceLabel } from '@/lib/search-utils'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

function JobDetailsPageContent({ params }: { params: { id: string } }) {
  const { job, isLoading, error } = useJobDetails(params.id)
  const [isSaved, setIsSaved] = useState(false)
  const [showApplicationModal, setShowApplicationModal] = useState(false)

  const LoadingSkeleton = () => (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-6 w-32" />
      </div>
      
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-24" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const ErrorState = () => (
    <div className="max-w-4xl mx-auto">
      <Card className="text-center py-12">
        <CardContent>
          <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {error === 'Job not found' ? 'Job Not Found' : 'Something went wrong'}
          </h3>
          <p className="text-gray-600 mb-6">
            {error === 'Job not found' 
              ? 'The job you\'re looking for doesn\'t exist or has been removed.'
              : error || 'Failed to load job details. Please try again.'
            }
          </p>
          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/jobs">Browse All Jobs</Link>
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()} className="w-full">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  if (error === 'Job not found') {
    notFound()
  }

  if (error) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50 py-8">
          <ErrorState />
        </div>
      </AppLayout>
    )
  }

  if (isLoading || !job) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50 py-8">
          <LoadingSkeleton />
        </div>
      </AppLayout>
    )
  }

  const handleApply = () => {
    setShowApplicationModal(true)
  }

  const handleSaveJob = () => {
    setIsSaved(!isSaved)
    // TODO: Implement save job logic
    console.log('Save job:', job.id)
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: job.title,
        text: job.description,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      // TODO: Show toast notification
    }
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <section className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/jobs" className="flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Jobs
                  </Link>
                </Button>
                <div className="flex items-center gap-2">
                  <Badge variant={job.verified ? 'default' : 'secondary'}>
                    {job.verified ? 'Verified' : 'Standard'}
                  </Badge>
                  {job.remote && (
                    <Badge variant="outline" className="gap-1">
                      <Clock className="h-3 w-3" />
                      Remote
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveJob}
                  className={`gap-2 ${isSaved ? 'text-red-600 border-red-600' : ''}`}
                >
                  <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
                  {isSaved ? 'Saved' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Job Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-2xl font-bold text-gray-900">
                        {job.title}
                      </CardTitle>
                      <CardDescription className="text-lg">
                        {job.company.name}
                      </CardDescription>
                    </div>
                    {job.company.logo && (
                      <img
                        src={job.company.logo}
                        alt={job.company.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {getLocationString(job.location)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      {getJobTypeLabel(job.type)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {getExperienceLabel(job.experience)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Posted {formatDate(job.createdAt)}
                    </div>
                  </div>

                  {job.salary && (
                    <div className="flex items-center gap-2 text-lg font-semibold text-green-600">
                      <DollarSign className="h-5 w-5" />
                      {formatSalary(job.salary.min, job.salary.max, job.salary.currency)}
                    </div>
                  )}
                </CardHeader>
              </Card>

              {/* Job Description */}
              <Card>
                <CardHeader>
                  <CardTitle>Job Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed">
                      {job.description}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Requirements */}
              {job.requirements && (
                <Card>
                  <CardHeader>
                    <CardTitle>Requirements</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {job.requirements.essential && job.requirements.essential.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Essential Requirements</h4>
                        <ul className="space-y-2">
                          {job.requirements.essential.map((req, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700">{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {job.requirements.preferred && job.requirements.preferred.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Preferred Qualifications</h4>
                        <ul className="space-y-2">
                          {job.requirements.preferred.map((req, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <div className="h-5 w-5 border-2 border-gray-300 rounded-full mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700">{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Benefits */}
              {job.benefits && job.benefits.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Benefits & Perks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {job.benefits.map((benefit, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-gray-700">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Company Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    About {job.company.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    {job.company.verified && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    <span className="text-sm text-gray-600">
                      {job.company.verified ? 'Verified Company' : 'Company'}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700">{getLocationString(job.location)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700">{job.applicationCount} applicants</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      Posted by {job.employer.name}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      {formatDate(job.createdAt)}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Application Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Ready to Apply?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={handleApply}
                    className="w-full"
                    size="lg"
                  >
                    Apply Now
                  </Button>
                  
                  {job.expiresAt && (
                    <Alert>
                      <Clock className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        Application deadline: {formatDate(job.expiresAt)}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">
                      Questions about this position?
                    </p>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Mail className="h-4 w-4" />
                      Contact Employer
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Similar Jobs */}
              <Card>
                <CardHeader>
                  <CardTitle>Similar Jobs</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 text-center py-4">
                    Similar jobs will appear here
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Application Modal */}
      {job && (
        <ApplicationModal
          isOpen={showApplicationModal}
          onClose={() => setShowApplicationModal(false)}
          jobId={job.id}
          jobTitle={job.title}
          companyName={job.company.name}
        />
      )}
    </AppLayout>
  )
}

export default function JobDetailsPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={
      <AppLayout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <Skeleton className="h-10 w-10" />
              <Skeleton className="h-6 w-32" />
            </div>
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    }>
      <JobDetailsPageContent params={params} />
    </Suspense>
  )
}