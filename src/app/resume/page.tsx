'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { ResumeEditor } from '@/components/resume/ResumeEditor'
import { ATSAnalysisDashboard } from '@/components/resume/ATSAnalysisDashboard'
import { TemplateGallery } from '@/components/templates/TemplateGallery'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  FileText,
  Plus,
  Edit,
  Download,
  Eye,
  Sparkles,
  BarChart3,
  Layout,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Trash2,
  Copy,
  Users,
  Star,
  Target,
  Zap
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { Resume, ResumeTemplate, ATSAnalysisResult } from '@/types/resume'

interface ResumeMetrics {
  totalResumes: number
  lastUpdated: string
  atsScores: number[]
  exportCount: number
  averageAtsScore: number
}

export default function ResumeBuilderPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState('dashboard')
  const [resumes, setResumes] = useState<Resume[]>([])
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [atsAnalysis, setAtsAnalysis] = useState<ATSAnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [metrics, setMetrics] = useState<ResumeMetrics | null>(null)
  const [recommendedTemplates, setRecommendedTemplates] = useState<ResumeTemplate[]>([])

  // Form state for new resume
  const [newResumeData, setNewResumeData] = useState({
    personalInfo: {
      fullName: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      github: '',
      website: ''
    },
    targetJobTitle: '',
    targetIndustry: '',
    experienceLevel: 'mid' as 'entry' | 'mid' | 'senior' | 'executive',
    templateId: ''
  })

  // Fetch user resumes
  const fetchResumes = async () => {
    if (!session?.user?.id) return

    try {
      setIsLoading(true)
      const response = await fetch('/api/resume')
      if (!response.ok) throw new Error('Failed to fetch resumes')

      const data = await response.json()
      setResumes(data.data || [])

      // Calculate metrics
      const resumeCount = data.data?.length || 0
      const atsScores = data.data?.map((r: Resume) => r.metadata?.atsScore || 0).filter(Boolean) || []
      const averageAtsScore = atsScores.length > 0 ? atsScores.reduce((a: number, b: number) => a + b, 0) / atsScores.length : 0

      setMetrics({
        totalResumes: resumeCount,
        lastUpdated: new Date().toISOString(),
        atsScores,
        exportCount: 0, // TODO: Track exports
        averageAtsScore
      })

    } catch (error) {
      console.error('Error fetching resumes:', error)
      toast({
        title: "Error",
        description: "Failed to load your resumes",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch template recommendations
  const fetchTemplateRecommendations = async () => {
    if (!session?.user?.id) return

    try {
      const response = await fetch('/api/resume/template')
      if (!response.ok) throw new Error('Failed to fetch recommendations')

      const data = await response.json()
      setRecommendedTemplates(data.data || [])
    } catch (error) {
      console.error('Error fetching template recommendations:', error)
    }
  }

  // Create new resume
  const createResume = async () => {
    if (!newResumeData.personalInfo.fullName || !newResumeData.personalInfo.email || !newResumeData.personalInfo.phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    try {
      setIsCreating(true)
      const response = await fetch('/api/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newResumeData)
      })

      if (!response.ok) throw new Error('Failed to create resume')

      const data = await response.json()
      const newResume = data.data

      setResumes(prev => [newResume, ...prev])
      setSelectedResume(newResume)
      setShowCreateDialog(false)
      setIsEditing(true)
      setActiveTab('editor')

      toast({
        title: "Success",
        description: "Resume created successfully"
      })

    } catch (error) {
      console.error('Error creating resume:', error)
      toast({
        title: "Error",
        description: "Failed to create resume",
        variant: "destructive"
      })
    } finally {
      setIsCreating(false)
    }
  }

  // Delete resume
  const deleteResume = async (resumeId: string) => {
    if (!confirm('Are you sure you want to delete this resume?')) return

    try {
      const response = await fetch(`/api/resume?resumeId=${resumeId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete resume')

      setResumes(prev => prev.filter(r => r.id !== resumeId))
      if (selectedResume?.id === resumeId) {
        setSelectedResume(null)
      }

      toast({
        title: "Success",
        description: "Resume deleted successfully"
      })

    } catch (error) {
      console.error('Error deleting resume:', error)
      toast({
        title: "Error",
        description: "Failed to delete resume",
        variant: "destructive"
      })
    }
  }

  // Analyze resume for ATS
  const analyzeResume = async (resumeId: string, jobDescription?: string) => {
    try {
      setIsAnalyzing(true)
      const response = await fetch('/api/resume/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId, jobDescription })
      })

      if (!response.ok) throw new Error('Failed to analyze resume')

      const data = await response.json()
      setAtsAnalysis(data.data)

      toast({
        title: "Analysis Complete",
        description: "ATS analysis has been completed"
      })

    } catch (error) {
      console.error('Error analyzing resume:', error)
      toast({
        title: "Error",
        description: "Failed to analyze resume",
        variant: "destructive"
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Export resume
  const exportResume = async (resumeId: string, format: string) => {
    try {
      const response = await fetch('/api/resume/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId, format })
      })

      if (!response.ok) throw new Error('Failed to export resume')

      if (format === 'pdf' || format === 'docx') {
        // Handle file download
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `resume-${Date.now()}.${format}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }

      toast({
        title: "Success",
        description: `Resume exported as ${format.toUpperCase()}`
      })

    } catch (error) {
      console.error('Error exporting resume:', error)
      toast({
        title: "Error",
        description: "Failed to export resume",
        variant: "destructive"
      })
    }
  }

  // Handle save
  const handleSave = async (resume: Resume) => {
    try {
      const response = await fetch('/api/resume', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeId: resume.id,
          updates: resume
        })
      })

      if (!response.ok) throw new Error('Failed to save resume')

      const data = await response.json()
      const updatedResume = data.data

      setResumes(prev => prev.map(r => r.id === resume.id ? updatedResume : r))
      setSelectedResume(updatedResume)

      toast({
        title: "Success",
        description: "Resume saved successfully"
      })

    } catch (error) {
      console.error('Error saving resume:', error)
      toast({
        title: "Error",
        description: "Failed to save resume",
        variant: "destructive"
      })
    }
  }

  // Load data on mount
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'seeker') {
      fetchResumes()
      fetchTemplateRecommendations()
    } else if (status === 'authenticated' && session?.user?.role !== 'seeker') {
      router.push('/dashboard')
    }
  }, [status, session])

  if (status === 'loading' || isLoading) {
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

  if (session?.user?.role !== 'seeker') {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Alert className="max-w-md">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Resume builder is only available to job seekers.
            </AlertDescription>
          </Alert>
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
            <h1 className="text-3xl font-bold">Resume Builder</h1>
            <p className="text-gray-600 mt-2">
              Create professional resumes with AI-powered optimization and ATS analysis
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Resume
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Resume</DialogTitle>
                  <DialogDescription>
                    Start with your basic information and we'll help you build a professional resume
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        value={newResumeData.personalInfo.fullName}
                        onChange={(e) => setNewResumeData(prev => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, fullName: e.target.value }
                        }))}
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newResumeData.personalInfo.email}
                        onChange={(e) => setNewResumeData(prev => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, email: e.target.value }
                        }))}
                        placeholder="john@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone *</Label>
                      <Input
                        id="phone"
                        value={newResumeData.personalInfo.phone}
                        onChange={(e) => setNewResumeData(prev => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, phone: e.target.value }
                        }))}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={newResumeData.personalInfo.location}
                        onChange={(e) => setNewResumeData(prev => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, location: e.target.value }
                        }))}
                        placeholder="New York, NY"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="jobTitle">Target Job Title</Label>
                      <Input
                        id="jobTitle"
                        value={newResumeData.targetJobTitle}
                        onChange={(e) => setNewResumeData(prev => ({
                          ...prev,
                          targetJobTitle: e.target.value
                        }))}
                        placeholder="Software Engineer"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="industry">Industry</Label>
                      <Input
                        id="industry"
                        value={newResumeData.targetIndustry}
                        onChange={(e) => setNewResumeData(prev => ({
                          ...prev,
                          targetIndustry: e.target.value
                        }))}
                        placeholder="Technology"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="experience">Experience Level</Label>
                      <Select
                        value={newResumeData.experienceLevel}
                        onValueChange={(value: 'entry' | 'mid' | 'senior' | 'executive') =>
                          setNewResumeData(prev => ({ ...prev, experienceLevel: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="entry">Entry Level</SelectItem>
                          <SelectItem value="mid">Mid Level</SelectItem>
                          <SelectItem value="senior">Senior Level</SelectItem>
                          <SelectItem value="executive">Executive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createResume} disabled={isCreating}>
                      {isCreating ? 'Creating...' : 'Create Resume'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" onClick={() => setShowTemplateDialog(true)}>
              <Layout className="w-4 h-4 mr-2" />
              Templates
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Metrics */}
            {metrics && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Resumes</p>
                        <p className="text-2xl font-bold">{metrics.totalResumes}</p>
                      </div>
                      <FileText className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Avg ATS Score</p>
                        <p className="text-2xl font-bold">{metrics.averageAtsScore.toFixed(1)}</p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Exports</p>
                        <p className="text-2xl font-bold">{metrics.exportCount}</p>
                      </div>
                      <Download className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Last Updated</p>
                        <p className="text-2xl font-bold">
                          {new Date(metrics.lastUpdated).toLocaleDateString()}
                        </p>
                      </div>
                      <Clock className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Resume List */}
            <Card>
              <CardHeader>
                <CardTitle>Your Resumes</CardTitle>
                <CardDescription>
                  Manage and edit your resume collection
                </CardDescription>
              </CardHeader>
              <CardContent>
                {resumes.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No resumes yet</h3>
                    <p className="text-gray-600 mb-6">
                      Create your first professional resume with our AI-powered builder
                    </p>
                    <Button onClick={() => setShowCreateDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Resume
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {resumes.map((resume) => (
                      <Card key={resume.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="font-semibold text-lg mb-1">
                                {resume.personalInfo?.fullName || 'Untitled Resume'}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {resume.metadata?.title || 'Professional Resume'}
                              </p>
                            </div>
                            <Badge variant={resume.metadata?.atsScore && resume.metadata.atsScore > 80 ? 'default' : 'secondary'}>
                              {resume.metadata?.atsScore || 'Not analyzed'}
                            </Badge>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Experience Level</span>
                              <span>{resume.metadata?.experienceLevel || 'Not set'}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Last Updated</span>
                              <span>{new Date(resume.updatedAt).toLocaleDateString()}</span>
                            </div>
                          </div>

                          <div className="flex gap-2 mt-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedResume(resume)
                                setIsEditing(true)
                                setActiveTab('editor')
                              }}
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => analyzeResume(resume.id)}
                              disabled={isAnalyzing}
                            >
                              <Sparkles className="w-3 h-3 mr-1" />
                              Analyze
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => exportResume(resume.id, 'pdf')}
                            >
                              <Download className="w-3 h-3 mr-1" />
                              PDF
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteResume(resume.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recommended Templates */}
            {recommendedTemplates.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recommended Templates</CardTitle>
                  <CardDescription>
                    Based on your profile and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {recommendedTemplates.slice(0, 3).map((template) => (
                      <Card key={template.templateId} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="aspect-[3/4] bg-gray-100 rounded-lg mb-3"></div>
                          <h4 className="font-semibold">{template.name}</h4>
                          <p className="text-sm text-gray-600">{template.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="editor">
            {selectedResume ? (
              <ResumeEditor
                initialResume={selectedResume}
                onSave={handleSave}
                onAnalysisRequest={(resume) => analyzeResume(resume.id)}
                onExport={(resume, format) => exportResume(resume.id, format)}
                userId={session.user.id}
                showTemplateSelector={true}
                enableTemplateCustomization={true}
              />
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Resume Selected</h3>
                <p className="text-gray-600 mb-6">
                  Select a resume from your dashboard or create a new one to start editing
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Resume
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics">
            {atsAnalysis ? (
              <ATSAnalysisDashboard analysis={atsAnalysis} />
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analysis Available</h3>
                <p className="text-gray-600 mb-6">
                  Analyze your resume to get ATS optimization insights and recommendations
                </p>
                <Button
                  onClick={() => selectedResume && analyzeResume(selectedResume.id)}
                  disabled={!selectedResume || isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Analyze Resume
                    </>
                  )}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="templates">
            <TemplateGallery
              onTemplateSelect={(template) => {
                if (selectedResume) {
                  // Apply template to selected resume
                  fetch('/api/resume/template', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      resumeId: selectedResume.id,
                      templateId: template.templateId
                    })
                  }).then(() => {
                    toast({
                      title: "Template Applied",
                      description: "Template has been applied to your resume"
                    })
                    fetchResumes()
                  })
                } else {
                  toast({
                    title: "No Resume Selected",
                    description: "Please create or select a resume first",
                    variant: "destructive"
                  })
                }
              }}
              userId={session.user.id}
              enableRecommendations={true}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Template Dialog */}
      {showTemplateDialog && (
        <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Choose a Template</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto">
              <TemplateGallery
                onTemplateSelect={(template) => {
                  setShowTemplateDialog(false)
                  // Handle template selection
                }}
                userId={session.user.id}
                enableRecommendations={true}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AppLayout>
  )
}