'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { NotificationAnalyticsDashboard } from '@/components/notifications/NotificationAnalyticsDashboard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Bell,
  Mail,
  Smartphone,
  MessageSquare,
  Settings,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Info,
  Download,
  RefreshCw,
  Users,
  BarChart3
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface NotificationPreferences {
  emailEnabled: boolean
  smsEnabled: boolean
  pushEnabled: boolean
  inAppEnabled: boolean
  applicationUpdates: boolean
  newJobAlerts: boolean
  jobMatches: boolean
  applicationReceived: boolean
  systemAnnouncements: boolean
  marketingEmails: boolean
  quietHoursStart?: string
  quietHoursEnd?: string
  frequency: string
  timezone: string
}

export default function NotificationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState('overview')
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [loading, setLoading] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  // Fetch user preferences
  const fetchPreferences = async () => {
    if (!session?.user?.id) return

    try {
      setLoading(true)
      const response = await fetch('/api/user/notifications/preferences')
      if (!response.ok) throw new Error('Failed to fetch preferences')

      const data = await response.json()
      if (data.success) {
        setPreferences(data.data)
      }
    } catch (error) {
      console.error('Error fetching preferences:', error)
      toast({
        title: "Error",
        description: "Failed to load notification preferences",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Update preferences
  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    if (!session?.user?.id) return

    try {
      const response = await fetch('/api/user/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!response.ok) throw new Error('Failed to update preferences')

      const data = await response.json()
      if (data.success) {
        setPreferences(data.data)
        toast({
          title: "Success",
          description: "Preferences updated successfully"
        })
      }
    } catch (error) {
      console.error('Error updating preferences:', error)
      toast({
        title: "Error",
        description: "Failed to update preferences",
        variant: "destructive"
      })
    }
  }

  // Check if user is admin
  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      setIsAdmin(true)
    }
  }, [session])

  // Load preferences on mount
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      fetchPreferences()
    }
  }, [status, session])

  if (status === 'loading' || loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AppLayout>
    )
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin')
    return null
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-gray-600 mt-2">
              Manage your notification preferences and view analytics
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                Admin View
              </Badge>
            )}
            <Button variant="outline" onClick={fetchPreferences}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            {isAdmin && <TabsTrigger value="admin">Admin</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Email</p>
                      <p className="text-2xl font-bold">{preferences?.emailEnabled ? 'Active' : 'Disabled'}</p>
                    </div>
                    <Mail className={`h-8 w-8 ${preferences?.emailEnabled ? 'text-blue-600' : 'text-gray-400'}`} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">SMS</p>
                      <p className="text-2xl font-bold">{preferences?.smsEnabled ? 'Active' : 'Disabled'}</p>
                    </div>
                    <Smartphone className={`h-8 w-8 ${preferences?.smsEnabled ? 'text-green-600' : 'text-gray-400'}`} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Push</p>
                      <p className="text-2xl font-bold">{preferences?.pushEnabled ? 'Active' : 'Disabled'}</p>
                    </div>
                    <Bell className={`h-8 w-8 ${preferences?.pushEnabled ? 'text-orange-600' : 'text-gray-400'}`} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">In-App</p>
                      <p className="text-2xl font-bold">{preferences?.inAppEnabled ? 'Active' : 'Disabled'}</p>
                    </div>
                    <MessageSquare className={`h-8 w-8 ${preferences?.inAppEnabled ? 'text-purple-600' : 'text-gray-400'}`} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Quick Settings
                </CardTitle>
                <CardDescription>
                  Toggle your most frequently used notification settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Notification Channels</h4>
                      <div className="space-y-3">
                        {[
                          { key: 'emailEnabled', label: 'Email Notifications', icon: Mail },
                          { key: 'smsEnabled', label: 'SMS Notifications', icon: Smartphone },
                          { key: 'pushEnabled', label: 'Push Notifications', icon: Bell },
                          { key: 'inAppEnabled', label: 'In-App Notifications', icon: MessageSquare }
                        ].map(({ key, label, icon: Icon }) => (
                          <div key={key} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-gray-500" />
                              <Label htmlFor={key} className="text-sm font-medium">
                                {label}
                              </Label>
                            </div>
                            <Switch
                              id={key}
                              checked={preferences?.[key as keyof NotificationPreferences] as boolean}
                              onCheckedChange={(checked) => updatePreferences({ [key]: checked })}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Notification Types</h4>
                      <div className="space-y-3">
                        {[
                          { key: 'applicationUpdates', label: 'Application Updates', icon: CheckCircle },
                          { key: 'newJobAlerts', label: 'New Job Alerts', icon: Bell },
                          { key: 'jobMatches', label: 'Job Matches', icon: Users },
                          { key: 'systemAnnouncements', label: 'System Announcements', icon: Info }
                        ].map(({ key, label, icon: Icon }) => (
                          <div key={key} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-gray-500" />
                              <Label htmlFor={key} className="text-sm font-medium">
                                {label}
                              </Label>
                            </div>
                            <Switch
                              id={key}
                              checked={preferences?.[key as keyof NotificationPreferences] as boolean}
                              onCheckedChange={(checked) => updatePreferences({ [key]: checked })}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Information Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Alert>
                <Bell className="h-4 w-4" />
                <AlertDescription>
                  <strong>Stay Informed:</strong> Keep notifications on to never miss important updates about your applications and job matches.
                </AlertDescription>
              </Alert>

              <Alert>
                <Eye className="h-4 w-4" />
                <AlertDescription>
                  <strong>View Analytics:</strong> Track your notification engagement and optimize your preferences for better results.
                </AlertDescription>
              </Alert>

              <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  <strong>Customize:</strong> Tailor your notification settings to match your job search preferences and workflow.
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Configure how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                {preferences ? (
                  <div className="space-y-8">
                    {/* Channel Settings */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Delivery Channels
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                          { key: 'emailEnabled', label: 'Email Notifications', description: 'Receive notifications via email' },
                          { key: 'smsEnabled', label: 'SMS Notifications', description: 'Receive text messages for urgent updates' },
                          { key: 'pushEnabled', label: 'Push Notifications', description: 'Browser and mobile app notifications' },
                          { key: 'inAppEnabled', label: 'In-App Notifications', description: 'Notifications within the platform' }
                        ].map(({ key, label, description }) => (
                          <div key={key} className="flex items-start justify-between space-x-3">
                            <div className="space-y-1">
                              <Label htmlFor={key} className="text-sm font-medium">{label}</Label>
                              <p className="text-sm text-gray-600">{description}</p>
                            </div>
                            <Switch
                              id={key}
                              checked={preferences[key as keyof NotificationPreferences] as boolean}
                              onCheckedChange={(checked) => updatePreferences({ [key]: checked })}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Notification Types */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Notification Types
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                          { key: 'applicationUpdates', label: 'Application Updates', description: 'Status changes for your job applications' },
                          { key: 'newJobAlerts', label: 'New Job Alerts', description: 'New job postings matching your criteria' },
                          { key: 'jobMatches', label: 'Job Matches', description: 'AI-powered job recommendations' },
                          { key: 'applicationReceived', label: 'Application Received', description: 'When candidates apply to your jobs' },
                          { key: 'systemAnnouncements', label: 'System Announcements', description: 'Platform updates and maintenance' },
                          { key: 'marketingEmails', label: 'Marketing Emails', description: 'Promotional content and newsletters' }
                        ].map(({ key, label, description }) => (
                          <div key={key} className="flex items-start justify-between space-x-3">
                            <div className="space-y-1">
                              <Label htmlFor={key} className="text-sm font-medium">{label}</Label>
                              <p className="text-sm text-gray-600">{description}</p>
                            </div>
                            <Switch
                              id={key}
                              checked={preferences[key as keyof NotificationPreferences] as boolean}
                              onCheckedChange={(checked) => updatePreferences({ [key]: checked })}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Delivery Settings */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Delivery Settings</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="frequency" className="text-sm font-medium">Delivery Frequency</Label>
                          <select
                            id="frequency"
                            value={preferences.frequency}
                            onChange={(e) => updatePreferences({ frequency: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                          >
                            <option value="immediate">Immediate</option>
                            <option value="daily">Daily Digest</option>
                            <option value="weekly">Weekly Summary</option>
                          </select>
                        </div>

                        <div>
                          <Label htmlFor="timezone" className="text-sm font-medium">Timezone</Label>
                          <select
                            id="timezone"
                            value={preferences.timezone}
                            onChange={(e) => updatePreferences({ timezone: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                          >
                            <option value="UTC">UTC</option>
                            <option value="America/New_York">Eastern Time</option>
                            <option value="America/Chicago">Central Time</option>
                            <option value="America/Denver">Mountain Time</option>
                            <option value="America/Los_Angeles">Pacific Time</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Preferences</h3>
                    <p className="text-gray-600">Please wait while we load your notification settings...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <NotificationAnalyticsDashboard userId={session?.user?.id} />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="admin">
              <div className="space-y-6">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    You are viewing global notification analytics. This includes all platform users and their notification activities.
                  </AlertDescription>
                </Alert>

                <NotificationAnalyticsDashboard isGlobal={true} />
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </AppLayout>
  )
}