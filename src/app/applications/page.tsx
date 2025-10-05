'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Briefcase, 
  Building2, 
  Calendar,
  Mail,
  ExternalLink,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  FileText,
  ArrowRight
} from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Application {
  id: string
  jobTitle: string
  companyName: string
  status: 'APPLIED' | 'REVIEWING' | 'SHORTLISTED' | 'REJECTED' | 'HIRED'
  appliedAt: string
  jobUrl: string
  coverLetter: string
  matchScore?: number
}

const STATUS_CONFIG = {
  APPLIED: {
    label: 'Applied',
    color: 'bg-blue-100 text-blue-800',
    icon: Clock,
    description: 'Your application has been received and is under review.'
  },
  REVIEWING: {
    label: 'Under Review',
    color: 'bg-yellow-100 text-yellow-800',
    icon: AlertCircle,
    description: 'Your application is being reviewed by the hiring team.'
  },
  SHORTLISTED: {
    label: 'Shortlisted',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle,
    description: 'Congratulations! You have been shortlisted for this position.'
  },
  REJECTED: {
    label: 'Not Selected',
    color: 'bg-red-100 text-red-800',
    icon: XCircle,
    description: 'Unfortunately, your application was not selected for this position.'
  },
  HIRED: {
    label: 'Hired',
    color: 'bg-purple-100 text-purple-800',
    icon: CheckCircle,
    description: 'Congratulations! You have been hired for this position.'
  }
}

function ApplicationsPageContent() {
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchApplications() {
      try {
        setIsLoading(true)
        setError(null)

        // For demo purposes, we'll use mock data
        // In a real application, you would fetch from the API
        const mockApplications: Application[] = [
          {
            id: '1',
            jobTitle: 'Senior Frontend Developer',
            companyName: 'Tech Solutions Inc',
            status: 'REVIEWING',
            appliedAt: '2024-01-15T10:30:00Z',
            jobUrl: '/jobs/cmgdumrwl000kry6bp08eerxd',
            coverLetter: 'I am excited about this opportunity...',
            matchScore: 85
          },
          {
            id: '2',
            jobTitle: 'Data Scientist',
            companyName: 'AI Innovations',
            status: 'SHORTLISTED',
            appliedAt: '2024-01-14T14:20:00Z',
            jobUrl: '/jobs/sample-id-2',
            coverLetter: 'My background in machine learning...',
            matchScore: 92
          },
          {
            id: '3',
            jobTitle: 'UX Designer',
            companyName: 'Design Studio',
            status: 'REJECTED',
            appliedAt: '2024-01-10T09:15:00Z',
            jobUrl: '/jobs/sample-id-3',
            coverLetter: 'I have extensive experience in UX design...'
          }
        ]

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setApplications(mockApplications)
      } catch (err) {
        console.error('Error fetching applications:', err)
        setError('Failed to load applications. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchApplications()
  }, [])

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-6 w-24" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const EmptyState = () => (
    <Card className="text-center py-12">
      <CardContent>
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Briefcase className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Applications Yet</h3>
        <p className="text-gray-600 mb-6">
          You haven't applied for any positions yet. Start browsing jobs to find your next opportunity!
        </p>
        <Button asChild className="w-full">
          <Link href="/jobs">Browse Jobs</Link>
        </Button>
      </CardContent>
    </Card>
  )

  const ErrorState = () => (
    <Card className="text-center py-12">
      <CardContent>
        <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
        <p className="text-gray-600 mb-6">
          {error || 'Failed to load your applications. Please try again.'}
        </p>
        <Button onClick={() => window.location.reload()} className="w-full">
          Try Again
        </Button>
      </CardContent>
    </Card>
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
              <p className="text-gray-600 mt-2">Track the status of your job applications</p>
            </div>
            <LoadingSkeleton />
          </div>
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
              <p className="text-gray-600 mt-2">Track the status of your job applications</p>
            </div>
            <ErrorState />
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
            <p className="text-gray-600 mt-2">Track the status of your job applications</p>
          </div>

          {/* Applications List */}
          {applications.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-6">
              {applications.map((application) => {
                const statusConfig = STATUS_CONFIG[application.status]
                const StatusIcon = statusConfig.icon

                return (
                  <Card key={application.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <CardTitle className="text-xl">{application.jobTitle}</CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            {application.companyName}
                          </CardDescription>
                        </div>
                        <Badge className={statusConfig.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Status Description */}
                      <Alert>
                        <StatusIcon className="h-4 w-4" />
                        <AlertDescription>
                          {statusConfig.description}
                        </AlertDescription>
                      </Alert>

                      {/* Application Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Applied: {formatDate(application.appliedAt)}</span>
                        </div>
                        {application.matchScore && (
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">Match Score: {application.matchScore}%</span>
                          </div>
                        )}
                      </div>

                      {/* Cover Letter Preview */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Cover Letter Preview</h4>
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {application.coverLetter}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Mail className="h-4 w-4" />
                          <span>Application ID: {application.id}</span>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={application.jobUrl} className="flex items-center gap-2">
                            View Job
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Stats Summary */}
          {applications.length > 0 && (
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{applications.length}</div>
                  <div className="text-sm text-gray-600">Total Applications</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {applications.filter(app => app.status === 'REVIEWING').length}
                  </div>
                  <div className="text-sm text-gray-600">Under Review</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {applications.filter(app => app.status === 'SHORTLISTED').length}
                  </div>
                  <div className="text-sm text-gray-600">Shortlisted</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {applications.filter(app => app.status === 'HIRED').length}
                  </div>
                  <div className="text-sm text-gray-600">Hired</div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

export default function ApplicationsPage() {
  return <ApplicationsPageContent />
}