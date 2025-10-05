'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { 
  Building2, 
  Users, 
  Briefcase, 
  TrendingUp, 
  Eye,
  Calendar,
  Plus,
  Loader2
} from 'lucide-react'

interface Company {
  companyId: string
  name: string
  description?: string
  logoUrl?: string
  isVerified: boolean
  verificationStatus: string
  employeeCount?: number
  foundedYear?: number
}

interface Job {
  jobId: string
  title: string
  description: string
  status: string
  postedAt: string
  applicationCount: number
  viewCount: number
  isFeatured: boolean
  isUrgent: boolean
}

interface Application {
  id: string
  status: string
  matchScore?: number
  appliedAt: string
  jobTitle: string
  candidateName: string
}

export default function EmployerDashboard() {
  const { 
    user, 
    isLoading: userLoading, 
    isAuthenticated, 
    isEmployer, 
    displayName 
  } = useCurrentUser()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [company, setCompany] = useState<Company | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [recentApplications, setRecentApplications] = useState<Application[]>([])

  useEffect(() => {
    // Redirect if not authenticated
    if (!userLoading && !isAuthenticated) {
      router.push('/auth/signin')
      return
    }

    // Redirect if not an employer
    if (!userLoading && user && !isEmployer) {
      router.push(user.role === 'SEEKER' ? '/dashboard' : '/admin/dashboard')
      return
    }

    // Fetch dashboard data when user is loaded and is an employer
    if (!userLoading && isAuthenticated && isEmployer) {
      fetchDashboardData()
    }
  }, [userLoading, isAuthenticated, isEmployer, user, router])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError('')

      const [companyRes, jobsRes, applicationsRes] = await Promise.all([
        fetch('/api/employer/company'),
        fetch('/api/employer/jobs'),
        fetch('/api/employer/applications')
      ])

      if (companyRes.ok) {
        const companyData = await companyRes.json()
        setCompany(companyData.success ? companyData.data : null)
      }

      if (jobsRes.ok) {
        const jobsData = await jobsRes.json()
        setJobs(jobsData.success ? jobsData.data : [])
      }

      if (applicationsRes.ok) {
        const applicationsData = await applicationsRes.json()
        setRecentApplications(applicationsData.success ? applicationsData.data : [])
      }
    } catch (err) {
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'closed': return 'bg-red-100 text-red-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getVerificationStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'rejected': return 'bg-red-100 text-red-800'
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

  // Return null if redirecting (useEffect will handle redirects)
  if (!userLoading && (!isAuthenticated || !isEmployer)) {
    return null
  }

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
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
              {company && (
                <div className="ml-4 flex items-center gap-2">
                  <span className="text-gray-600">|</span>
                  <span className="font-medium">{company.name}</span>
                  <Badge className={getVerificationStatusColor(company.verificationStatus)}>
                    {company.verificationStatus}
                  </Badge>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={() => router.push('/employer/jobs/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Post Job
              </Button>
              <Button variant="outline" onClick={() => router.push('/employer/profile')}>
                Company Profile
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {displayName}!
          </h2>
          <p className="text-gray-600">
            Manage your company profile, job postings, and applications
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {jobs.filter(job => job.status === 'active').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Total active postings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {jobs.reduce((sum, job) => sum + job.applicationCount, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all job postings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {jobs.reduce((sum, job) => sum + job.viewCount, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Job listing views
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {jobs.length > 0 
                  ? Math.round((jobs.reduce((sum, job) => sum + job.applicationCount, 0) / jobs.reduce((sum, job) => sum + job.viewCount, 1)) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Views to applications
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Company Status */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {company ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium">{company.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {company.description || 'No description provided'}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Verification:</span>
                        <Badge className={getVerificationStatusColor(company.verificationStatus)}>
                          {company.verificationStatus}
                        </Badge>
                      </div>
                      
                      {company.employeeCount && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Employees:</span>
                          <span className="text-sm">{company.employeeCount}</span>
                        </div>
                      )}
                      
                      {company.foundedYear && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Founded:</span>
                          <span className="text-sm">{company.foundedYear}</span>
                        </div>
                      )}
                    </div>

                    {!company.isVerified && (
                      <Button variant="outline" className="w-full" onClick={() => router.push('/employer/verify')}>
                        Get Verified
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No company profile found</p>
                    <Button onClick={() => router.push('/employer/profile')}>
                      Create Company Profile
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Applications */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Applications</CardTitle>
                <CardDescription>
                  Latest candidates who applied to your job postings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentApplications.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No applications yet</p>
                    <Button onClick={() => router.push('/employer/jobs/new')}>
                      Post Your First Job
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentApplications.slice(0, 5).map((application) => (
                      <div key={application.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{application.candidateName}</h4>
                          <p className="text-sm text-gray-600">{application.jobTitle}</p>
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
                        <Badge className={
                          application.status === 'applied' ? 'bg-blue-100 text-blue-800' :
                          application.status === 'reviewing' ? 'bg-yellow-100 text-yellow-800' :
                          application.status === 'shortlisted' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {application.status}
                        </Badge>
                      </div>
                    ))}
                    {recentApplications.length > 5 && (
                      <Button variant="outline" className="w-full">
                        View All Applications
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Job Postings */}
        <Card className="mt-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Your Job Postings</CardTitle>
                <CardDescription>
                  Manage your active and closed job postings
                </CardDescription>
              </div>
              <Button onClick={() => router.push('/employer/jobs/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Post New Job
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {jobs.length === 0 ? (
              <div className="text-center py-8">
                <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No job postings yet</p>
                <Button onClick={() => router.push('/employer/jobs/new')}>
                  Post Your First Job
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <div key={job.jobId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{job.title}</h4>
                        <Badge className={getStatusColor(job.status)}>
                          {job.status}
                        </Badge>
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
                      <p className="text-sm text-gray-600 line-clamp-1">
                        {job.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>{job.applicationCount} applications</span>
                        <span>{job.viewCount} views</span>
                        <span>Posted {formatDate(job.postedAt)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}