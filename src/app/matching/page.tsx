'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { MatchingAnalyticsDashboard } from '@/components/matching/MatchingAnalyticsDashboard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Search,
  Filter,
  RefreshCw,
  Target,
  Users,
  Brain,
  TrendingUp,
  Settings,
  BarChart3,
  Eye,
  Download,
  Plus,
  Zap,
  Star,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  Lightbulb
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { UserRole } from '@/types/roles'

interface MatchingPreferences {
  minMatchScore: number
  preferredJobTypes: string[]
  locationPreferences: string[]
  salaryMin?: number
  salaryMax?: number
  remoteWorkOnly: boolean
  industryPreferences: string[]
  experienceLevel: string
  enableMLRecommendations: boolean
  autoApply: boolean
  notificationSettings: {
    newMatches: boolean
    skillImprovements: boolean
    marketTrends: boolean
    successAlerts: boolean
  }
}

interface JobMatch {
  id: string
  title: string
  company: string
  location: string
  salary: {
    min: number
    max: number
    currency: string
  }
  matchScore: number
  matchConfidence: number
  skills: string[]
  description: string
  postedAt: string
  matchReasons: string[]
}

interface CandidateMatch {
  id: string
  name: string
  email: string
  location: string
  experience: string
  skills: string[]
  education: string
  matchScore: number
  matchConfidence: number
  avatar?: string
  bio: string
  matchReasons: string[]
}

export default function MatchingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState('dashboard')
  const [userRole, setUserRole] = useState<UserRole>(UserRole.JOB_SEEKER)
  const [matches, setMatches] = useState<(JobMatch | CandidateMatch)[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [preferences, setPreferences] = useState<MatchingPreferences>({
    minMatchScore: 70,
    preferredJobTypes: [],
    locationPreferences: [],
    remoteWorkOnly: false,
    industryPreferences: [],
    experienceLevel: 'mid',
    enableMLRecommendations: true,
    autoApply: false,
    notificationSettings: {
      newMatches: true,
      skillImprovements: true,
      marketTrends: false,
      successAlerts: true
    }
  })

  const [filters, setFilters] = useState({
    minScore: 50,
    maxResults: 20,
    sortBy: 'matchScore',
    sortOrder: 'desc',
    skills: [] as string[],
    location: '',
    remoteWorkOnly: false
  })

  const isEmployer = session?.user?.role === UserRole.EMPLOYER
  const isAdmin = session?.user?.role === UserRole.ADMIN

  // Fetch matches
  const fetchMatches = async () => {
    if (!session?.user?.id) return

    try {
      setLoading(true)

      const matchType = isEmployer ? 'candidates-for-job' : 'jobs-for-candidate'
      const endpoint = isEmployer ? '/api/matching/find-matches' : '/api/matching/find-matches'

      const payload = {
        type: matchType,
        filters: {
          minScore: filters.minScore,
          skills: filters.skills,
          location: filters.location,
          remoteWorkOnly: filters.remoteWorkOnly
        },
        sort: {
          field: filters.sortBy,
          order: filters.sortOrder
        },
        limit: filters.maxResults,
        offset: 0
      }

      // For employers, we need a job ID
      if (isEmployer) {
        // In a real implementation, this would come from user context or URL params
        payload.id = 'example-job-id' // Placeholder
      } else {
        payload.id = session.user.id
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) throw new Error('Failed to fetch matches')

      const data = await response.json()
      if (data.success) {
        setMatches(data.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching matches:', error)
      toast({
        title: "Error",
        description: "Failed to load matches",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Save preferences
  const savePreferences = async () => {
    if (!session?.user?.id) return

    try {
      const response = await fetch('/api/matching/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      })

      if (!response.ok) throw new Error('Failed to save preferences')

      toast({
        title: "Success",
        description: "Preferences saved successfully"
      })
    } catch (error) {
      console.error('Error saving preferences:', error)
      toast({
        title: "Error",
        description: "Failed to save preferences",
        variant: "destructive"
      })
    }
  }

  // Handle match interaction
  const handleMatchAction = async (matchId: string, action: 'view' | 'save' | 'apply' | 'reject') => {
    try {
      const response = await fetch(`/api/matching/matches/${matchId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })

      if (!response.ok) throw new Error('Failed to perform action')

      toast({
        title: "Success",
        description: `Action "${action}" completed successfully`
      })

      // Refresh matches after action
      if (action === 'apply' || action === 'reject') {
        fetchMatches()
      }
    } catch (error) {
      console.error('Error performing match action:', error)
      toast({
        title: "Error",
        description: "Failed to perform action",
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      setUserRole(session.user.role as UserRole)
      fetchMatches()
    } else if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, session])

  if (status === 'loading') {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Intelligent Matching</h1>
            <p className="text-gray-600 mt-2">
              {isEmployer
                ? 'Find the perfect candidates for your jobs with AI-powered matching'
                : 'Discover jobs that match your skills and preferences'
              }
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <BarChart3 className="w-3 h-3" />
                Admin View
              </Badge>
            )}
            <Button onClick={fetchMatches} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Matches
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {isEmployer ? 'Candidates' : 'Jobs'} Found
                  </p>
                  <p className="text-2xl font-bold">{matches.length}</p>
                </div>
                <Target className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Match Score</p>
                  <p className="text-2xl font-bold">
                    {matches.length > 0
                      ? (matches.reduce((sum, match) => sum + (match as any).matchScore, 0) / matches.length).toFixed(1)
                      : '0'
                    }
                  </p>
                </div>
                <Brain className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">ML Enabled</p>
                  <p className="text-2xl font-bold">
                    {preferences.enableMLRecommendations ? 'Active' : 'Disabled'}
                  </p>
                </div>
                <Zap className={`h-8 w-8 ${preferences.enableMLRecommendations ? 'text-green-600' : 'text-gray-400'}`} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Min Score</p>
                  <p className="text-2xl font-bold">{preferences.minMatchScore}%</p>
                </div>
                <Settings className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="matches">Matches</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Common actions to optimize your matching experience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Matching Settings</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="ml-recommendations" className="text-sm">
                          ML Recommendations
                        </Label>
                        <Switch
                          id="ml-recommendations"
                          checked={preferences.enableMLRecommendations}
                          onCheckedChange={(checked) =>
                            setPreferences({ ...preferences, enableMLRecommendations: checked })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="auto-apply" className="text-sm">
                          Auto Apply (Coming Soon)
                        </Label>
                        <Switch
                          id="auto-apply"
                          checked={preferences.autoApply}
                          disabled
                          onCheckedChange={(checked) =>
                            setPreferences({ ...preferences, autoApply: checked })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Notifications</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="new-matches" className="text-sm">
                          New Match Alerts
                        </Label>
                        <Switch
                          id="new-matches"
                          checked={preferences.notificationSettings.newMatches}
                          onCheckedChange={(checked) =>
                            setPreferences({
                              ...preferences,
                              notificationSettings: {
                                ...preferences.notificationSettings,
                                newMatches: checked
                              }
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="skill-improvements" className="text-sm">
                          Skill Improvement Tips
                        </Label>
                        <Switch
                          id="skill-improvements"
                          checked={preferences.notificationSettings.skillImprovements}
                          onCheckedChange={(checked) =>
                            setPreferences({
                              ...preferences,
                              notificationSettings: {
                                ...preferences.notificationSettings,
                                skillImprovements: checked
                              }
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Current Performance</CardTitle>
                <CardDescription>
                  Your recent matching activity and success metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {matches.filter((m: any) => m.matchScore >= 80).length}
                    </p>
                    <p className="text-sm text-gray-600">High-Quality Matches</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {matches.filter((m: any) => m.matchConfidence >= 80).length}
                    </p>
                    <p className="text-sm text-gray-600">High Confidence</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {matches.filter((m: any) => (m as any).skills?.length >= 5).length}
                    </p>
                    <p className="text-sm text-gray-600">Skill-Rich Matches</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Alert>
              <Brain className="h-4 w-4" />
              <AlertDescription>
                <strong>AI-Powered Insights:</strong> Enable ML recommendations to get personalized matching insights and skill gap analysis based on your profile and market trends.
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="matches" className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Search & Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder={`Search ${isEmployer ? 'candidates' : 'jobs'}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-md"
                      />
                    </div>
                    <Button onClick={fetchMatches} variant="outline">
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Min Match Score</Label>
                      <Slider
                        value={[filters.minScore]}
                        onValueChange={(value) => setFilters({ ...filters, minScore: value[0] })}
                        max={100}
                        step={5}
                        className="mt-2"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>50%</span>
                        <span>{filters.minScore}%</span>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Remote Work</Label>
                      <div className="flex items-center mt-2">
                        <Switch
                          checked={filters.remoteWorkOnly}
                          onCheckedChange={(checked) => setFilters({ ...filters, remoteWorkOnly: checked })}
                        />
                        <span className="ml-2 text-sm">Remote only</span>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Results</Label>
                      <Select
                        value={filters.maxResults}
                        onValueChange={(value) => setFilters({ ...filters, maxResults: value })}
                        className="mt-2"
                      >
                        <SelectItem value={10}>10</SelectItem>
                        <SelectItem value={20}>20</SelectItem>
                        <SelectItem value={50}>50</SelectItem>
                        <SelectItem value={100}>100</SelectItem>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Sort By</Label>
                      <Select
                        value={filters.sortBy}
                        onValueChange={(value) => setFilters({ ...filters, sortBy: value })}
                        className="mt-2"
                      >
                        <SelectItem value="matchScore">Match Score</SelectItem>
                        <SelectItem value="matchConfidence">Confidence</SelectItem>
                        <SelectItem value="postedDate">Posted Date</SelectItem>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Matches List */}
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Finding matches...</p>
                </div>
              ) : matches.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No matches found
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Try adjusting your filters or preferences to find more matches
                    </p>
                    <Button onClick={() => setFilters({
                      minScore: 50,
                      maxResults: 20,
                      sortBy: 'matchScore',
                      sortOrder: 'desc',
                      skills: [],
                      location: '',
                      remoteWorkOnly: false
                    })} variant="outline">
                      Reset Filters
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {matches.map((match: any) => (
                    <Card key={match.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">
                                {isEmployer ? (match as CandidateMatch).name : (match as JobMatch).title}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {isEmployer ? (match as CandidateMatch).location : (match as JobMatch).company}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-lg">
                                  {(match as any).matchScore.toFixed(0)}%
                                </Badge>
                                <Badge variant="outline" className="text-sm">
                                  {(match as any).matchConfidence.toFixed(0)}% confidence
                                </Badge>
                              </div>
                            </div>
                          </div>

                          {/* Skills */}
                          <div className="flex flex-wrap gap-1">
                            {(match as any).skills?.slice(0, 5).map((skill: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>

                          {/* Match Reasons */}
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Why this match:</p>
                            <div className="space-y-1">
                              {(match as any).matchReasons?.slice(0, 2).map((reason: string, index: number) => (
                                <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                  <span>{reason}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 pt-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMatchAction(match.id, 'view')}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMatchAction(match.id, 'save')}
                            >
                              <Star className="w-3 h-3 mr-1" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleMatchAction(match.id, 'apply')}
                            >
                              <ArrowRight className="w-3 h-3 mr-1" />
                              {isEmployer ? 'Contact' : 'Apply'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Matching Preferences</CardTitle>
                <CardDescription>
                  Customize your matching criteria and AI recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {/* Basic Preferences */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Basic Preferences</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="min-score">Minimum Match Score</Label>
                          <Slider
                            id="min-score"
                            value={[preferences.minMatchScore]}
                            onValueChange={(value) =>
                              setPreferences({ ...preferences, minMatchScore: value[0] })
                            }
                            min={0}
                            max={100}
                            step={5}
                            className="mt-2"
                          />
                          <div className="flex justify-between text-sm text-gray-500 mt-1">
                            <span>0%</span>
                            <span>{preferences.minMatchScore}%</span>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="experience-level">Experience Level</Label>
                          <Select
                            id="experience-level"
                            value={preferences.experienceLevel}
                            onValueChange={(value) =>
                              setPreferences({ ...preferences, experienceLevel: value })
                            }
                            className="mt-2"
                          >
                            <SelectItem value="entry">Entry Level</SelectItem>
                            <SelectItem value="junior">Junior</SelectItem>
                            <SelectItem value="mid">Mid Level</SelectItem>
                            <SelectItem value="senior">Senior Level</SelectItem>
                            <SelectItem value="lead">Lead</SelectItem>
                            <SelectItem value="principal">Principal</SelectItem>
                            <SelectItem value="executive">Executive</SelectItem>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="remote-work-only">Remote Work Preference</Label>
                          <div className="flex items-center mt-2">
                            <Switch
                              id="remote-work-only"
                              checked={preferences.remoteWorkOnly}
                              onCheckedChange={(checked) =>
                                setPreferences({ ...preferences, remoteWorkOnly: checked })
                              }
                            />
                            <span className="ml-2 text-sm">Remote positions only</span>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="ml-recommendations">AI-Powered Recommendations</Label>
                          <div className="flex items-center mt-2">
                            <Switch
                              id="ml-recommendations"
                              checked={preferences.enableMLRecommendations}
                              onCheckedChange={(checked) =>
                                setPreferences({ ...preferences, enableMLRecommendations: checked })
                              }
                            />
                            <span className="ml-2 text-sm">Enable ML insights</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="salary-min">Minimum Salary</Label>
                          <Input
                            id="salary-min"
                            type="number"
                            value={preferences.salaryMin || ''}
                            onChange={(e) =>
                              setPreferences({ ...preferences, salaryMin: e.target.value ? parseInt(e.target.value) : undefined })
                            }
                            placeholder="Optional"
                            className="mt-2"
                          />
                        </div>

                        <div>
                          <Label htmlFor="salary-max">Maximum Salary</Label>
                          <Input
                            id="salary-max"
                            type="number"
                            value={preferences.salaryMax || ''}
                            onChange={(e) =>
                              setPreferences({ ...preferences, salaryMax: e.target.value ? parseInt(e.target.value) : undefined })
                            }
                            placeholder="Optional"
                            className="mt-2"
                          />
                        </div>

                        <div>
                          <Label htmlFor="auto-apply">Auto-Apply (Coming Soon)</Label>
                          <div className="flex items-center mt-2">
                            <Switch
                              id="auto-apply"
                              checked={preferences.autoApply}
                              disabled
                              onCheckedChange={(checked) =>
                                setPreferences({ ...preferences, autoApply: checked })
                              }
                            />
                            <span className="ml-2 text-sm text-gray-500">Coming soon</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Notification Settings */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Notification Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="noti-new-matches">New Match Alerts</Label>
                          <Switch
                            id="noti-new-matches"
                            checked={preferences.notificationSettings.newMatches}
                            onCheckedChange={(checked) =>
                              setPreferences({
                                ...preferences,
                                notificationSettings: {
                                  ...preferences.notificationSettings,
                                  newMatches: checked
                                }
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="noti-skill-improvements">Skill Improvement Tips</Label>
                          <Switch
                            id="noti-skill-improvements"
                            checked={preferences.notificationSettings.skillImprovements}
                            onCheckedChange={(checked) =>
                              setPreferences({
                                ...preferences,
                                notificationSettings: {
                                  ...preferences.notificationSettings,
                                  skillImprovements: checked
                                }
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="noti-market-trends">Market Trends</Label>
                          <Switch
                            id="noti-market-trends"
                            checked={preferences.notificationSettings.marketTrends}
                            onCheckedChange={(checked) =>
                              setPreferences({
                                ...preferences,
                                notificationSettings: {
                                  ...preferences.notificationSettings,
                                  marketTrends: checked
                                }
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="noti-success-alerts">Success Alerts</Label>
                          <Switch
                            id="noti-success-alerts"
                            checked={preferences.notificationSettings.successAlerts}
                            onCheckedChange={(checked) =>
                              setPreferences({
                                ...preferences,
                                notificationSettings: {
                                  ...preferences.notificationSettings,
                                  successAlerts: checked
                                }
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6">
                  <Button variant="outline" onClick={fetchMatches}>
                    Reset to Defaults
                  </Button>
                  <Button onClick={savePreferences}>
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <MatchingAnalyticsDashboard
              isGlobal={isAdmin}
              userId={session?.user?.id}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}