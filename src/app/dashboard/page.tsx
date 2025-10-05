'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { 
  Briefcase, 
  MapPin, 
  Calendar, 
  TrendingUp, 
  FileText, 
  Bookmark,
  Settings,
  User,
  Loader2
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
  isFeatured: boolean
  isUrgent: boolean
  companyLogo?: string
  matchScore?: number
}

interface Application {
  id: string
  status: string
  matchScore?: number
  appliedAt: string
  jobTitle: string
  companyName: string
}

interface SavedJob {
  id: string
  title: string
  company: string
  location: string
  salaryMin?: number
  salaryMax?: number
  currency: string
  positionType: string
  remotePolicy: string
  savedAt: string
}

export default function Dashboard() {
  const { 
    user, 
    isLoading: userLoading, 
    isAuthenticated, 
    isJobSeeker, 
    displayName 
  } = useCurrentUser()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [applications, setApplications] = useState<Application[]>([])
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([])
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([])

  useEffect(() => {
    // Redirect if not authenticated
    if (!userLoading && !isAuthenticated) {
      router.push('/auth/signin')
      return
    }

    // Redirect if not a job seeker
    if (!userLoading && user && !isJobSeeker) {
      router.push(user.role === 'EMPLOYER' ? '/employer/dashboard' : '/admin/dashboard')
      return
    }

    // Fetch dashboard data when user is loaded and is a job seeker
    if (!userLoading && isAuthenticated && isJobSeeker) {
      fetchDashboardData()
    }
  }, [userLoading, isAuthenticated, isJobSeeker, user, router])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError('')

      // Fetch applications
      const [applicationsRes, savedJobsRes, recommendedJobsRes] = await Promise.all([
        fetch('/api/applications'),
        fetch('/api/saved-jobs'),
        fetch('/api/jobs/recommended')
      ])

      if (applicationsRes.ok) {
        const applicationsData = await applicationsRes.json()
        setApplications(applicationsData.success ? applicationsData.data : [])
      }

      if (savedJobsRes.ok) {
        const savedJobsData = await savedJobsRes.json()
        setSavedJobs(savedJobsData.success ? savedJobsData.data : [])
      }

      if (recommendedJobsRes.ok) {
        const recommendedJobsData = await recommendedJobsRes.json()
        setRecommendedJobs(recommendedJobsData.success ? recommendedJobsData.data : [])
      }
    } catch (err) {
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied': return 'bg-blue-100 text-blue-800'
      case 'reviewing': return 'bg-yellow-100 text-yellow-800'
      case 'shortlisted': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'hired': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null // Will redirect in useEffect
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertDescription>{error}</AlertDescription>
          <Button onClick={fetchDashboardData} className="mt-2">
            Try Again
          </Button>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Job Finders</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => router.push('/jobs')}>
                Browse Jobs
              </Button>
              <Button variant="outline" onClick={() => router.push('/profile')}>
                <Settings className="h-4 w-4 mr-2" />
                Profile
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {session?.user?.name}!
          </h2>
          <p className="text-gray-600">
            Here's your job search activity and recommendations
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Applications</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{applications.length}</div>
              <p className="text-xs text-muted-foreground">
                Total applications
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saved Jobs</CardTitle>
              <Bookmark className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{savedJobs.length}</div>
              <p className="text-xs text-muted-foreground">
                Jobs saved for later
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">
                Companies viewed your profile
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Match Rate</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">78%</div>
              <p className="text-xs text-muted-foreground">
                Average match score
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Applications */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Applications</CardTitle>
                <CardDescription>
                  Track your job application status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {applications.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No applications yet</p>
                    <Button onClick={() => router.push('/jobs')}>
                      Browse Jobs
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applications.slice(0, 5).map((application) => (
                      <div key={application.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{application.jobTitle}</h4>
                          <p className="text-sm text-gray-600">{application.companyName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {formatDate(application.appliedAt)}
                            </span>
                            {application.matchScore && (
                              <span className="text-xs text-green-600">
                                {application.matchScore}% match
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge className={getStatusColor(application.status)}>
                          {application.status}
                        </Badge>
                      </div>
                    ))}
                    {applications.length > 5 && (
                      <Button variant="outline" className="w-full">
                        View All Applications
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Saved Jobs */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Saved Jobs</CardTitle>
                <CardDescription>
                  Jobs you've saved for later
                </CardDescription>
              </CardHeader>
              <CardContent>
                {savedJobs.length === 0 ? (
                  <div className="text-center py-8">
                    <Bookmark className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No saved jobs</p>
                    <Button onClick={() => router.push('/jobs')}>
                      Browse Jobs
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {savedJobs.slice(0, 3).map((job) => (
                      <div key={job.id} className="p-4 border rounded-lg">
                        <h4 className="font-medium">{job.title}</h4>
                        <p className="text-sm text-gray-600">{job.company}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">{job.location}</span>
                        </div>
                      </div>
                    ))}
                    {savedJobs.length > 3 && (
                      <Button variant="outline" className="w-full">
                        View All Saved Jobs
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recommended Jobs */}
        {recommendedJobs.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Recommended for You</CardTitle>
              <CardDescription>
                Jobs that match your profile and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendedJobs.slice(0, 6).map((job) => (
                  <div key={job.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{job.title}</h4>
                      {job.matchScore && (
                        <Badge className="bg-green-100 text-green-800">
                          {job.matchScore}%
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{job.company}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <MapPin className="h-3 w-3" />
                      <span>{job.location}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}