'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { AppLayout } from '@/components/layout/app-layout'
import { 
  User, 
  Briefcase, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Github, 
  Linkedin,
  Loader2,
  Plus,
  X,
  Upload,
  FileText,
  Download
} from 'lucide-react'
import { ProfileCompletion } from '@/components/profile/profile-completion'
import type { JobSeekerProfile } from '@/types/profile'
import { UserRole } from '@/types/roles'

export default function Profile() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [profile, setProfile] = useState<JobSeekerProfile | null>(null)
  const [newSkill, setNewSkill] = useState('')
  const [newPortfolioLink, setNewPortfolioLink] = useState('')
  const [uploadingResume, setUploadingResume] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (status === 'authenticated') {
      if (session.user.role !== UserRole.JOB_SEEKER) {
        router.push(session.user.role === UserRole.EMPLOYER ? '/employer/dashboard' : '/admin/dashboard')
        return
      }
      fetchProfile()
    }
  }, [status, session, router])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/profile/jobseeker')
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setProfile(data.data)
        }
      } else {
        // Profile might not exist yet, create default
        setProfile({
          userUid: session!.user.id,
          currency: 'ZAR'
        })
      }
    } catch (err) {
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<JobSeekerProfile>) => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const response = await fetch('/api/profile/jobseeker', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Profile updated successfully!')
        setProfile(data.data)
      } else {
        setError(data.error || 'Failed to update profile')
      }
    } catch (err) {
      setError('An error occurred while updating profile')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    updateProfile(profile)
  }

  const addSkill = () => {
    if (!newSkill.trim() || !profile) return
    
    const skills = profile.skills || []
    if (!skills.includes(newSkill.trim())) {
      setProfile({
        ...profile,
        skills: [...skills, newSkill.trim()]
      })
    }
    setNewSkill('')
  }

  const removeSkill = (skillToRemove: string) => {
    if (!profile) return
    setProfile({
      ...profile,
      skills: (profile.skills || []).filter(skill => skill !== skillToRemove)
    })
  }

  const addPortfolioLink = () => {
    if (!newPortfolioLink.trim() || !profile) return
    
    const links = profile.portfolioLinks || []
    if (!links.includes(newPortfolioLink.trim())) {
      setProfile({
        ...profile,
        portfolioLinks: [...links, newPortfolioLink.trim()]
      })
    }
    setNewPortfolioLink('')
  }

  const removePortfolioLink = (linkToRemove: string) => {
    if (!profile) return
    setProfile({
      ...profile,
      portfolioLinks: (profile.portfolioLinks || []).filter(link => link !== linkToRemove)
    })
  }

  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PDF or Word document')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      return
    }

    try {
      setUploadingResume(true)
      setError('')

      const formData = new FormData()
      formData.append('resume', file)

      const response = await fetch('/api/profile/upload-resume', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Resume uploaded successfully!')
        setProfile(prev => prev ? { ...prev, resumeFileUrl: data.resumeUrl } : null)
      } else {
        setError(data.error || 'Failed to upload resume')
      }
    } catch (err) {
      setError('An error occurred while uploading resume')
    } finally {
      setUploadingResume(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeResume = async () => {
    if (!profile?.resumeFileUrl) return

    try {
      setSaving(true)
      setError('')

      const response = await fetch('/api/profile/remove-resume', {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Resume removed successfully!')
        setProfile(prev => prev ? { ...prev, resumeFileUrl: undefined } : null)
      } else {
        setError(data.error || 'Failed to remove resume')
      }
    } catch (err) {
      setError('An error occurred while removing resume')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading profile...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!profile) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Alert className="max-w-md">
            <AlertDescription>Failed to load profile</AlertDescription>
            <Button onClick={fetchProfile} className="mt-2">
              Try Again
            </Button>
          </Alert>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Profile Settings</h2>
          <p className="text-gray-600">
            Manage your job seeker profile and preferences
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Completion */}
          <ProfileCompletion profile={profile} />

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Update your personal and professional details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={session?.user?.name || ''}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={session?.user?.email || ''}
                    disabled
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="professionalTitle">Professional Title</Label>
                <Input
                  id="professionalTitle"
                  value={profile.professionalTitle || ''}
                  onChange={(e) => setProfile({...profile, professionalTitle: e.target.value})}
                  placeholder="e.g., Senior Software Engineer"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="summary">Professional Summary</Label>
                <Textarea
                  id="summary"
                  value={profile.summary || ''}
                  onChange={(e) => setProfile({...profile, summary: e.target.value})}
                  placeholder="Brief description of your professional background and career goals"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Skills
              </CardTitle>
              <CardDescription>
                Add your technical and professional skills
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add a skill"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                />
                <Button type="button" onClick={addSkill}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {(profile.skills || []).map((skill, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {skill}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeSkill(skill)}
                    />
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Experience & Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Experience & Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="experienceYears">Years of Experience</Label>
                  <Select 
                    value={profile.experienceYears?.toString() || ''} 
                    onValueChange={(value) => setProfile({...profile, experienceYears: parseInt(value) || undefined})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Entry Level (0-1 years)</SelectItem>
                      <SelectItem value="2">Junior (2-3 years)</SelectItem>
                      <SelectItem value="5">Mid Level (4-6 years)</SelectItem>
                      <SelectItem value="8">Senior (7-10 years)</SelectItem>
                      <SelectItem value="12">Lead (11-15 years)</SelectItem>
                      <SelectItem value="15">Executive (15+ years)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={profile.location || ''}
                    onChange={(e) => setProfile({...profile, location: e.target.value})}
                    placeholder="City, Province"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="availability">Availability</Label>
                <Select 
                  value={profile.availability || ''} 
                  onValueChange={(value) => setProfile({...profile, availability: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="When can you start?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediately</SelectItem>
                    <SelectItem value="2_weeks">2 weeks notice</SelectItem>
                    <SelectItem value="1_month">1 month notice</SelectItem>
                    <SelectItem value="3_months">3 months notice</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profile.phone || ''}
                  onChange={(e) => setProfile({...profile, phone: e.target.value})}
                  placeholder="+27 XX XXX XXXX"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={profile.website || ''}
                    onChange={(e) => setProfile({...profile, website: e.target.value})}
                    placeholder="https://yourwebsite.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    type="url"
                    value={profile.linkedin || ''}
                    onChange={(e) => setProfile({...profile, linkedin: e.target.value})}
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="github">GitHub</Label>
                <Input
                  id="github"
                  type="url"
                  value={profile.github || ''}
                  onChange={(e) => setProfile({...profile, github: e.target.value})}
                  placeholder="https://github.com/username"
                />
              </div>
            </CardContent>
          </Card>

          {/* Portfolio Links */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Portfolio Links
              </CardTitle>
              <CardDescription>
                Add links to your portfolio, projects, or other relevant work
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newPortfolioLink}
                  onChange={(e) => setNewPortfolioLink(e.target.value)}
                  placeholder="Add portfolio link"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPortfolioLink())}
                />
                <Button type="button" onClick={addPortfolioLink}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-2">
                {(profile.portfolioLinks || []).map((link, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <a 
                      href={link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline truncate flex-1"
                    >
                      {link}
                    </a>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePortfolioLink(link)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Resume Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Resume
              </CardTitle>
              <CardDescription>
                Upload your resume to apply for jobs faster
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.resumeFileUrl ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50 border-green-200">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800">Resume Uploaded</p>
                        <p className="text-sm text-green-600">Your resume is ready for job applications</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(profile.resumeFileUrl, '_blank')}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={removeResume}
                        disabled={saving}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleResumeUpload}
                      className="hidden"
                      disabled={uploadingResume}
                    />
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {uploadingResume ? 'Uploading...' : 'Upload Resume'}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      PDF or Word documents, up to 5MB
                    </p>
                    <Button 
                      type="button" 
                      disabled={uploadingResume}
                      onClick={(e) => {
                        e.stopPropagation()
                        fileInputRef.current?.click()
                      }}
                    >
                      {uploadingResume ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Choose File
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="text-sm text-gray-500">
                    <p>• Accepted formats: PDF, DOC, DOCX</p>
                    <p>• Maximum file size: 5MB</p>
                    <p>• Your resume will be used when you apply for jobs</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Salary Expectations */}
          <Card>
            <CardHeader>
              <CardTitle>Salary Expectations</CardTitle>
              <CardDescription>
                Set your preferred salary range (optional)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select 
                    value={profile.currency} 
                    onValueChange={(value) => setProfile({...profile, currency: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ZAR">ZAR (South African Rand)</SelectItem>
                      <SelectItem value="USD">USD (US Dollar)</SelectItem>
                      <SelectItem value="EUR">EUR (Euro)</SelectItem>
                      <SelectItem value="GBP">GBP (British Pound)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salaryMin">Minimum Salary</Label>
                  <Input
                    id="salaryMin"
                    type="number"
                    value={profile.salaryExpectationMin || ''}
                    onChange={(e) => setProfile({...profile, salaryExpectationMin: e.target.value ? parseFloat(e.target.value) : undefined})}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salaryMax">Maximum Salary</Label>
                  <Input
                    id="salaryMax"
                    type="number"
                    value={profile.salaryExpectationMax || ''}
                    onChange={(e) => setProfile({...profile, salaryExpectationMax: e.target.value ? parseFloat(e.target.value) : undefined})}
                    placeholder="0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Profile'
              )}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}