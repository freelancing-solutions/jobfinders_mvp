'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { ApplicationList } from '@/components/applications/ApplicationList'
import { ApplicationDetails } from '@/components/applications/ApplicationDetails'
import { ApplicationAnalytics } from '@/components/applications/ApplicationAnalytics'
import { useApplicationStore } from '@/stores/applications'
import { useRealtimeUpdates } from '@/hooks/applications/use-realtime-updates'
import { Application, ApplicationStatus } from '@/types/applications'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Briefcase,
  BarChart3,
  FileText,
  Settings,
  Plus,
  Filter,
  Download,
  Bell,
  Search,
  RefreshCw,
  TrendingUp,
  Activity,
} from 'lucide-react'

export default function ApplicationsPage() {
  const { data: session } = useSession()
  const router = useRouter()

  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('applications')

  const {
    applications,
    isLoading,
    error,
    fetchApplications,
    refresh,
  } = useApplicationStore()

  const { isConnected } = useRealtimeUpdates()

  // Redirect if not authenticated or not a job seeker
  if (!session?.user) {
    router.push('/auth/signin')
    return null
  }

  if (session.user.role !== 'SEEKER') {
    router.push('/dashboard')
    return null
  }

  const handleApplicationSelect = (application: Application) => {
    setSelectedApplicationId(application.id)
  }

  const handleApplicationEdit = (application: Application) => {
    // TODO: Implement edit functionality
    console.log('Edit application:', application)
  }

  const handleStatusUpdate = (applicationId: string, status: ApplicationStatus) => {
    // Status update is handled by the store
    console.log('Status updated:', applicationId, status)
  }

  const handleApplicationDelete = (applicationId: string) => {
    setSelectedApplicationId(null)
    // Refresh the list
    fetchApplications()
  }

  const selectedApplication = applications.find(app => app.id === selectedApplicationId)

  // Calculate stats
  const stats = {
    total: applications.length,
    applied: applications.filter(app => app.status === 'applied').length,
    reviewing: applications.filter(app => app.status === 'reviewing').length,
    shortlisted: applications.filter(app => app.status === 'shortlisted').length,
    interview: applications.filter(app =>
      ['interview_scheduled', 'interview_completed'].includes(app.status)
    ).length,
    offered: applications.filter(app => app.status === 'offered').length,
    rejected: applications.filter(app => app.status === 'rejected').length,
    hired: applications.filter(app => app.status === 'hired').length,
  }

  if (error) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
            <Button onClick={refresh} className="mt-2">
              Try Again
            </Button>
          </Alert>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
            <p className="text-gray-600 mt-1">
              Track and manage your job applications in one place
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-600 hidden sm:inline">
                {isConnected ? 'Real-time updates active' : 'Connection lost'}
              </span>
            </div>
            <Button variant="outline" size="sm" className="hidden sm:flex">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button variant="outline" size="sm" className="hidden sm:flex">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={refresh} size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button asChild>
              <a href="/jobs">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">New Application</span>
                <span className="sm:hidden">Apply</span>
              </a>
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-xl sm:text-2xl font-bold">{stats.total}</p>
                </div>
                <div className="p-2 sm:p-3 rounded-full bg-blue-500">
                  <Briefcase className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Under Review</p>
                  <p className="text-xl sm:text-2xl font-bold">{stats.reviewing}</p>
                </div>
                <div className="p-2 sm:p-3 rounded-full bg-yellow-500">
                  <FileText className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Interviews</p>
                  <p className="text-xl sm:text-2xl font-bold">{stats.interview}</p>
                </div>
                <div className="p-2 sm:p-3 rounded-full bg-purple-500">
                  <Settings className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Offers</p>
                  <p className="text-xl sm:text-2xl font-bold">{stats.offered}</p>
                </div>
                <div className="p-2 sm:p-3 rounded-full bg-green-500">
                  <BarChart3 className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column - List/Analytics */}
          <div className="flex-1 lg:flex-initial lg:w-2/3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="applications" className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  <span className="hidden sm:inline">Applications</span>
                  <span className="sm:hidden">Apps</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Analytics</span>
                  <span className="sm:hidden">Stats</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="applications" className="mt-6">
                <ApplicationList
                  showFilters={true}
                  showStats={false}
                  selectable={true}
                  onApplicationSelect={handleApplicationSelect}
                  onApplicationEdit={handleApplicationEdit}
                  onStatusUpdate={handleStatusUpdate}
                />
              </TabsContent>

              <TabsContent value="analytics" className="mt-6">
                <ApplicationAnalytics compact={true} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Details */}
          <div className="flex-1 lg:flex-initial lg:w-1/3">
            {selectedApplication ? (
              <ApplicationDetails
                applicationId={selectedApplication.id}
                onStatusUpdate={handleStatusUpdate}
                onEdit={handleApplicationEdit}
                onDelete={handleApplicationDelete}
              />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Application Selected</h3>
                  <p className="text-gray-600 text-center">
                    Select an application from the list to view details and manage your progress.
                  </p>
                  <Button className="mt-4" asChild>
                    <a href="/jobs">Browse Jobs</a>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Floating Action Button for mobile */}
        <div className="fixed bottom-6 right-6 lg:hidden">
          <Button size="lg" className="rounded-full w-14 h-14 shadow-lg" asChild>
            <a href="/jobs">
              <Plus className="h-6 w-6" />
            </a>
          </Button>
        </div>
      </div>
    </AppLayout>
  )
}