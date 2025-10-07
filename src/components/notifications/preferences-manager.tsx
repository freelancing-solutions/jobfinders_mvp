'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Monitor,
  Clock,
  Settings,
  RotateCcw,
  Check,
  X,
  Info
} from 'lucide-react'

interface NotificationPreferences {
  channels: {
    email: boolean
    sms: boolean
    push: boolean
    inApp: boolean
  }
  types: {
    job_match: boolean
    application_update: boolean
    profile_view: boolean
    system: boolean
    marketing: boolean
  }
  quietHours: {
    enabled: boolean
    startTime: string
    endTime: string
    timezone: string
  }
  frequency: {
    digest: 'immediate' | 'hourly' | 'daily' | 'weekly'
    maxPerDay: number
  }
}

const channelIcons = {
  email: Mail,
  sms: MessageSquare,
  push: Smartphone,
  inApp: Monitor,
}

const channelDescriptions = {
  email: 'Receive notifications via email',
  sms: 'Get SMS alerts on your phone',
  push: 'Browser push notifications',
  inApp: 'In-app notifications',
}

const typeDescriptions = {
  job_match: 'New job matches based on your profile',
  application_update: 'Updates on your job applications',
  profile_view: 'When employers view your profile',
  system: 'System updates and maintenance',
  marketing: 'Promotional content and newsletters',
}

const timezoneList = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Australia/Sydney',
]

export function NotificationPreferencesManager() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Load preferences
  const loadPreferences = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/notifications/preferences')
      if (!response.ok) {
        throw new Error('Failed to load preferences')
      }

      const data = await response.json()
      if (data.success) {
        setPreferences(data.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preferences')
    } finally {
      setLoading(false)
    }
  }

  // Save preferences
  const savePreferences = async () => {
    if (!preferences) return

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      })

      if (!response.ok) {
        throw new Error('Failed to save preferences')
      }

      const data = await response.json()
      if (data.success) {
        setSuccess('Preferences saved successfully!')
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  // Reset preferences
  const resetPreferences = async (type?: 'all' | 'channels' | 'types' | 'quietHours' | 'frequency') => {
    try {
      setError(null)
      setSuccess(null)

      const response = await fetch('/api/notifications/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resetType: type }),
      })

      if (!response.ok) {
        throw new Error('Failed to reset preferences')
      }

      const data = await response.json()
      if (data.success) {
        setPreferences(data.data)
        setSuccess(`Preferences reset successfully (${type || 'all'})`)
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset preferences')
    }
  }

  // Update preference
  const updatePreference = (category: keyof NotificationPreferences, key: string, value: any) => {
    if (!preferences) return

    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }))
  }

  useEffect(() => {
    loadPreferences()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
          <span>Loading preferences...</span>
        </div>
      </div>
    )
  }

  if (!preferences) {
    return (
      <Alert variant="destructive">
        <X className="h-4 w-4" />
        <AlertDescription>
          Failed to load notification preferences. Please try again.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Notification Preferences</h2>
          <p className="text-gray-600">Manage how and when you receive notifications</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => resetPreferences()}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset All
          </Button>
          <Button
            onClick={savePreferences}
            disabled={saving}
            className="flex items-center gap-2"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            {saving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <X className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="channels" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="channels" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Channels
          </TabsTrigger>
          <TabsTrigger value="types" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Types
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="frequency" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Frequency
          </TabsTrigger>
        </TabsList>

        {/* Channels Tab */}
        <TabsContent value="channels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Channels</CardTitle>
              <CardDescription>
                Choose how you want to receive notifications
              </CardDescription>
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => resetPreferences('channels')}
                  className="text-xs"
                >
                  Reset channels
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(preferences.channels).map(([channel, enabled]) => {
                const Icon = channelIcons[channel as keyof typeof channelIcons]
                return (
                  <div key={channel} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-gray-600" />
                      <div>
                        <Label className="font-medium capitalize">{channel.replace('_', ' ')}</Label>
                        <p className="text-sm text-gray-600">
                          {channelDescriptions[channel as keyof typeof channelDescriptions]}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={enabled}
                      onCheckedChange={(checked) => updatePreference('channels', channel, checked)}
                    />
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Types Tab */}
        <TabsContent value="types" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Types</CardTitle>
              <CardDescription>
                Choose which types of notifications you want to receive
              </CardDescription>
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => resetPreferences('types')}
                  className="text-xs"
                >
                  Reset types
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(preferences.types).map(([type, enabled]) => (
                <div key={type} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <Label className="font-medium capitalize">{type.replace('_', ' ')}</Label>
                    <p className="text-sm text-gray-600">
                      {typeDescriptions[type as keyof typeof typeDescriptions]}
                    </p>
                  </div>
                  <Switch
                    checked={enabled}
                    onCheckedChange={(checked) => updatePreference('types', type, checked)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quiet Hours</CardTitle>
              <CardDescription>
                Set times when you don't want to receive notifications
              </CardDescription>
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => resetPreferences('quietHours')}
                  className="text-xs"
                >
                  Reset schedule
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>Enable Quiet Hours</Label>
                  <p className="text-sm text-gray-600">
                    Temporarily pause notifications during specified hours
                  </p>
                </div>
                <Switch
                  checked={preferences.quietHours.enabled}
                  onCheckedChange={(checked) => updatePreference('quietHours', 'enabled', checked)}
                />
              </div>

              {preferences.quietHours.enabled && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={preferences.quietHours.startTime}
                        onChange={(e) => updatePreference('quietHours', 'startTime', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endTime">End Time</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={preferences.quietHours.endTime}
                        onChange={(e) => updatePreference('quietHours', 'endTime', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={preferences.quietHours.timezone}
                      onValueChange={(value) => updatePreference('quietHours', 'timezone', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timezoneList.map((tz) => (
                          <SelectItem key={tz} value={tz}>
                            {tz}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Frequency Tab */}
        <TabsContent value="frequency" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Frequency</CardTitle>
              <CardDescription>
                Control how often you receive notifications
              </CardDescription>
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => resetPreferences('frequency')}
                  className="text-xs"
                >
                  Reset frequency
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="digest">Digest Frequency</Label>
                <Select
                  value={preferences.frequency.digest}
                  onValueChange={(value: any) => updatePreference('frequency', 'digest', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="hourly">Hourly Digest</SelectItem>
                    <SelectItem value="daily">Daily Digest</SelectItem>
                    <SelectItem value="weekly">Weekly Digest</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-600 mt-1">
                  Group notifications together and receive them at intervals
                </p>
              </div>

              <div>
                <Label htmlFor="maxPerDay">Maximum Notifications Per Day</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="maxPerDay"
                    type="number"
                    min="1"
                    max="100"
                    value={preferences.frequency.maxPerDay}
                    onChange={(e) => updatePreference('frequency', 'maxPerDay', parseInt(e.target.value))}
                    className="w-24"
                  />
                  <span className="text-sm text-gray-600">
                    Limit the number of notifications you receive per day
                  </span>
                </div>
              </div>

              {/* Summary */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Current Settings Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Active Channels:</span>
                    <div className="flex gap-1">
                      {Object.entries(preferences.channels)
                        .filter(([_, enabled]) => enabled)
                        .map(([channel]) => (
                          <Badge key={channel} variant="secondary" className="text-xs">
                            {channel}
                          </Badge>
                        ))}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Types:</span>
                    <div className="flex gap-1">
                      {Object.entries(preferences.types)
                        .filter(([_, enabled]) => enabled)
                        .map(([type]) => (
                          <Badge key={type} variant="outline" className="text-xs">
                            {type}
                          </Badge>
                        ))}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span>Quiet Hours:</span>
                    <span>{preferences.quietHours.enabled ? 'Enabled' : 'Disabled'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Digest:</span>
                    <span className="capitalize">{preferences.frequency.digest}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}