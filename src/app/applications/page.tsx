'use client'

import { useState, Suspense, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useSocket } from '@/hooks/use-socket'
import { AppLayout } from '@/components/layout/app-layout'
import { ApplicationGrid } from '@/components/applications/ApplicationList/ApplicationGrid'
import { ApplicationStats } from '@/components/applications/application-stats'
import { ApplicationAnalytics } from '@/components/applications/ApplicationAnalytics/ApplicationAnalytics'
import { useApplications } from '@/hooks/use-applications'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Briefcase,
  BarChart3,
  FileText,
  Plus,
  Filter,
  Download,
  Search,
  RefreshCw,
  TrendingUp,
  Activity,
  Loader2,
  AlertCircle,
  Wifi,
  WifiOff,
} from 'lucide-react'
import Link from 'next/link'

function ApplicationsPageContent() {
  const { data: session } = useSession()
  const router = useRouter()
  const { socket, isConnected } = useSocket()

  const [activeTab, setActiveTab] = useState('applications')
  const [realtimeUpdates, setRealtimeUpdates] = useState(false)

  const {
    applications,
    stats,
    loading,
    error,
    hasActiveFilters,
    activeFilterCount,
    filters,
    updateFilters,
    clearFilters,
    updatePagination,
    search,
    exportApplications,
    refresh,
    pagination
  } = useApplications()

  // WebSocket event listeners for real-time updates
  useEffect(() => {
    if (!socket || !session?.user?.id) return

    // Listen for application status updates
    const handleApplicationUpdate = (data: any) => {
      if (data.userId === session.user.id) {
        refresh() // Refresh applications when status changes
      }
    }

    // Listen for new application events
    const handleNewApplication = (data: any) => {
      if (data.userId === session.user.id) {
        refresh() // Refresh applications when new application is submitted
      }
    }

    // Register event listeners
    socket.on('application:status_updated', handleApplicationUpdate)
    socket.on('application:created', handleNewApplication)

    // Join user's personal room for targeted updates
    socket.emit('join_room', `user:${session.user.id}`)

    // Cleanup function
    return () => {
      socket.off('application:status_updated', handleApplicationUpdate)
      socket.off('application:created', handleNewApplication)
      socket.emit('leave_room', `user:${session.user.id}`)
    }
  }, [socket, session?.user?.id, refresh])

  // Redirect if not authenticated or not a job seeker
  if (!session?.user) {
    router.push('/auth/signin')
    return null
  }

  if (session.user.role !== 'SEEKER') {
    router.push('/dashboard')
    return null
  }

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="p-6">
          <div className="space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )

  const EmptyState = () => (
    <Card className="text-center py-12">
      <CardContent>
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <FileText className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No applications found</h3>
        <p className="text-gray-600 mb-6">
          You haven't applied to any jobs yet. Start exploring opportunities and submit your first application!
        </p>
        <Link href="/jobs">
          <Button>Browse Jobs</Button>
        </Link>
      </CardContent>
    </Card>
  )

  const ErrorState = ({ error }: { error: string }) => (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        {error || 'Failed to load applications. Please try again later.'}
      </AlertDescription>
      <Button onClick={refresh} className="mt-2">
        Try Again
      </Button>
    </Alert>
  )

  if (error) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <ErrorState error={error} />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
              <div className="flex items-center gap-1">
                {isConnected ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <Wifi className="h-4 w-4" />
                    <span className="text-xs font-medium">Live</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-gray-400">
                    <WifiOff className="h-4 w-4" />
                    <span className="text-xs font-medium">Offline</span>
                  </div>
                )}
              </div>
            </div>
            <p className="text-gray-600 mt-1">
              Track and manage your job applications {isConnected && '• Real-time updates active'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => exportApplications('csv')}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => exportApplications('json')}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export JSON
            </Button>
            <Button onClick={refresh} size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button asChild>
              <Link href="/jobs">
                <Plus className="h-4 w-4 mr-2" />
                Browse Jobs
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <ApplicationStats stats={stats} loading={loading} />

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="applications" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Applications
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="applications" className="mt-6">
            <Suspense fallback={<LoadingSkeleton />}>
              {loading ? (
                <LoadingSkeleton />
              ) : applications.length === 0 ? (
                <EmptyState />
              ) : (
                <ApplicationGrid
                  applications={applications}
                  loading={loading}
                  pagination={pagination}
                  onPageChange={(page) => updatePagination(page)}
                />
              )}
            </Suspense>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <ApplicationAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}

export default function ApplicationsPage() {
  return (
    <Suspense fallback={
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-6">
                <div className="space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </AppLayout>
    }>
      <ApplicationsPageContent />
    </Suspense>
  )
}