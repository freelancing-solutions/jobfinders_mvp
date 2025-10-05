'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Mail, 
  Phone, 
  FileText, 
  Upload, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Save
} from 'lucide-react'

interface ApplicationFormData {
  // Personal Information
  fullName: string
  email: string
  phone: string
  location: string
  
  // Professional Information
  currentTitle: string
  currentCompany: string
  experience: string
  linkedin: string
  github: string
  portfolio: string
  
  // Application Details
  coverLetter: string
  salaryExpectation: string
  availability: string
  noticePeriod: string
  
  // Resume
  resumeFile: File | null
  resumeUrl: string
  
  // Additional Information
  howDidYouHear: string
  additionalInfo: string
}

interface ApplicationFormProps {
  jobId: string
  jobTitle: string
  companyName: string
  onSuccess: () => void
  onCancel: () => void
}

const EXPERIENCE_LEVELS = [
  { value: 'entry', label: 'Entry Level (0-2 years)' },
  { value: 'junior', label: 'Junior (2-4 years)' },
  { value: 'mid', label: 'Mid-Level (4-7 years)' },
  { value: 'senior', label: 'Senior (7-10 years)' },
  { value: 'lead', label: 'Lead/Principal (10+ years)' }
]

const AVAILABILITY_OPTIONS = [
  { value: 'immediate', label: 'Immediately available' },
  { value: '2_weeks', label: '2 weeks notice' },
  { value: '1_month', label: '1 month notice' },
  { value: '2_months', label: '2 months notice' },
  { value: '3_months', label: '3 months notice' }
]

const HEAR_ABOUT_OPTIONS = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'indeed', label: 'Indeed' },
  { value: 'company_website', label: 'Company Website' },
  { value: 'referral', label: 'Employee Referral' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'job_board', label: 'Job Board' },
  { value: 'other', label: 'Other' }
]

export function ApplicationForm({ 
  jobId, 
  jobTitle, 
  companyName, 
  onSuccess, 
  onCancel 
}: ApplicationFormProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploadProgress, setUploadProgress] = useState(0)
  
  const [formData, setFormData] = useState<ApplicationFormData>({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    currentTitle: '',
    currentCompany: '',
    experience: '',
    linkedin: '',
    github: '',
    portfolio: '',
    coverLetter: '',
    salaryExpectation: '',
    availability: '',
    noticePeriod: '',
    resumeFile: null,
    resumeUrl: '',
    howDidYouHear: '',
    additionalInfo: ''
  })

  const steps = [
    { id: 'personal', title: 'Personal Information', icon: User },
    { id: 'professional', title: 'Professional Info', icon: FileText },
    { id: 'application', title: 'Application Details', icon: Mail },
    { id: 'review', title: 'Review & Submit', icon: CheckCircle }
  ]

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    switch (step) {
      case 0: // Personal Information
        if (!formData.fullName.trim()) {
          newErrors.fullName = 'Full name is required'
        }
        if (!formData.email.trim()) {
          newErrors.email = 'Email is required'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = 'Please enter a valid email address'
        }
        if (!formData.phone.trim()) {
          newErrors.phone = 'Phone number is required'
        }
        if (!formData.location.trim()) {
          newErrors.location = 'Location is required'
        }
        break

      case 1: // Professional Information
        if (!formData.currentTitle.trim()) {
          newErrors.currentTitle = 'Current title is required'
        }
        if (!formData.experience) {
          newErrors.experience = 'Experience level is required'
        }
        break

      case 2: // Application Details
        if (!formData.coverLetter.trim()) {
          newErrors.coverLetter = 'Cover letter is required'
        } else if (formData.coverLetter.length < 100) {
          newErrors.coverLetter = 'Cover letter should be at least 100 characters'
        }
        if (!formData.availability) {
          newErrors.availability = 'Availability is required'
        }
        break

      case 3: // Review
        if (!formData.resumeFile && !formData.resumeUrl) {
          newErrors.resume = 'Please upload a resume or provide a resume URL'
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(Math.min(currentStep + 1, steps.length - 1))
    }
  }

  const handlePrevious = () => {
    setCurrentStep(Math.max(currentStep - 1, 0))
  }

  const handleInputChange = (field: keyof ApplicationFormData, value: string | File | null) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!file) return

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, resumeFile: 'Please upload a PDF or Word document' }))
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, resumeFile: 'File size must be less than 5MB' }))
      return
    }

    setFormData(prev => ({ ...prev, resumeFile: file }))
    setErrors(prev => ({ ...prev, resumeFile: '' }))

    // Simulate file upload progress
    setUploadProgress(0)
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 10
      })
    }, 100)
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return

    setIsSubmitting(true)
    try {
      const submitData = new FormData()
      
      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'resumeFile') {
          submitData.append(key, value as string)
        }
      })

      // Add resume file if exists
      if (formData.resumeFile) {
        submitData.append('resume', formData.resumeFile)
      }

      // Add job information
      submitData.append('jobId', jobId)
      submitData.append('jobTitle', jobTitle)
      submitData.append('companyName', companyName)

      const response = await fetch('/api/applications', {
        method: 'POST',
        body: submitData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to submit application')
      }

      onSuccess()
    } catch (error) {
      console.error('Application submission error:', error)
      setErrors({ 
        submit: error instanceof Error ? error.message : 'Failed to submit application. Please try again.' 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Personal Information
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="John Doe"
                  className={errors.fullName ? 'border-red-500' : ''}
                />
                {errors.fullName && (
                  <p className="text-sm text-red-500">{errors.fullName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="john@example.com"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+27 12 345 6789"
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && (
                  <p className="text-sm text-red-500">{errors.phone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Cape Town, South Africa"
                  className={errors.location ? 'border-red-500' : ''}
                />
                {errors.location && (
                  <p className="text-sm text-red-500">{errors.location}</p>
                )}
              </div>
            </div>
          </div>
        )

      case 1: // Professional Information
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentTitle">Current Job Title *</Label>
                <Input
                  id="currentTitle"
                  value={formData.currentTitle}
                  onChange={(e) => handleInputChange('currentTitle', e.target.value)}
                  placeholder="Senior Frontend Developer"
                  className={errors.currentTitle ? 'border-red-500' : ''}
                />
                {errors.currentTitle && (
                  <p className="text-sm text-red-500">{errors.currentTitle}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentCompany">Current Company</Label>
                <Input
                  id="currentCompany"
                  value={formData.currentCompany}
                  onChange={(e) => handleInputChange('currentCompany', e.target.value)}
                  placeholder="Tech Solutions Inc"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">Experience Level *</Label>
                <select
                  id="experience"
                  value={formData.experience}
                  onChange={(e) => handleInputChange('experience', e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.experience ? 'border-red-500' : ''
                  }`}
                >
                  <option value="">Select experience level</option>
                  {EXPERIENCE_LEVELS.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
                {errors.experience && (
                  <p className="text-sm text-red-500">{errors.experience}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn Profile</Label>
                <Input
                  id="linkedin"
                  value={formData.linkedin}
                  onChange={(e) => handleInputChange('linkedin', e.target.value)}
                  placeholder="https://linkedin.com/in/johndoe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="github">GitHub Profile</Label>
                <Input
                  id="github"
                  value={formData.github}
                  onChange={(e) => handleInputChange('github', e.target.value)}
                  placeholder="https://github.com/johndoe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="portfolio">Portfolio Website</Label>
                <Input
                  id="portfolio"
                  value={formData.portfolio}
                  onChange={(e) => handleInputChange('portfolio', e.target.value)}
                  placeholder="https://johndoe.dev"
                />
              </div>
            </div>
          </div>
        )

      case 2: // Application Details
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="coverLetter">Cover Letter *</Label>
              <Textarea
                id="coverLetter"
                value={formData.coverLetter}
                onChange={(e) => handleInputChange('coverLetter', e.target.value)}
                placeholder="Tell us why you're interested in this position and why you'd be a great fit..."
                rows={8}
                className={errors.coverLetter ? 'border-red-500' : ''}
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>Minimum 100 characters</span>
                <span>{formData.coverLetter.length} characters</span>
              </div>
              {errors.coverLetter && (
                <p className="text-sm text-red-500">{errors.coverLetter}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salaryExpectation">Salary Expectation (ZAR)</Label>
                <Input
                  id="salaryExpectation"
                  value={formData.salaryExpectation}
                  onChange={(e) => handleInputChange('salaryExpectation', e.target.value)}
                  placeholder="800000 - 1200000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="availability">Availability *</Label>
                <select
                  id="availability"
                  value={formData.availability}
                  onChange={(e) => handleInputChange('availability', e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.availability ? 'border-red-500' : ''
                  }`}
                >
                  <option value="">Select availability</option>
                  {AVAILABILITY_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.availability && (
                  <p className="text-sm text-red-500">{errors.availability}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="howDidYouHear">How did you hear about this position?</Label>
              <select
                id="howDidYouHear"
                value={formData.howDidYouHear}
                onChange={(e) => handleInputChange('howDidYouHear', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select an option</option>
                {HEAR_ABOUT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalInfo">Additional Information</Label>
              <Textarea
                id="additionalInfo"
                value={formData.additionalInfo}
                onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                placeholder="Any additional information you'd like to share..."
                rows={4}
              />
            </div>
          </div>
        )

      case 3: // Review & Submit
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold text-lg mb-4">Application Summary</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Name:</span> {formData.fullName}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {formData.email}
                </div>
                <div>
                  <span className="font-medium">Phone:</span> {formData.phone}
                </div>
                <div>
                  <span className="font-medium">Location:</span> {formData.location}
                </div>
                <div>
                  <span className="font-medium">Current Title:</span> {formData.currentTitle}
                </div>
                <div>
                  <span className="font-medium">Experience:</span> {EXPERIENCE_LEVELS.find(l => l.value === formData.experience)?.label}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Resume/CV *</Label>
                <div className="mt-2">
                  {formData.resumeFile ? (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                      <FileText className="h-5 w-5 text-green-600" />
                      <span className="text-sm text-green-800">{formData.resumeFile.name}</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                        className={errors.resumeFile ? 'border-red-500' : ''}
                      />
                      {errors.resumeFile && (
                        <p className="text-sm text-red-500">{errors.resumeFile}</p>
                      )}
                      {uploadProgress > 0 && uploadProgress < 100 && (
                        <Progress value={uploadProgress} className="w-full" />
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label>Or provide resume URL</Label>
                <Input
                  value={formData.resumeUrl}
                  onChange={(e) => handleInputChange('resumeUrl', e.target.value)}
                  placeholder="https://drive.google.com/your-resume"
                  className="mt-2"
                />
              </div>
            </div>

            {errors.submit && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.submit}</AlertDescription>
              </Alert>
            )}

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                By submitting this application, you confirm that the information provided is accurate and complete.
              </AlertDescription>
            </Alert>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Apply for {jobTitle}</CardTitle>
          <CardDescription>
            {companyName} • Complete the form below to submit your application
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {steps.map((step, index) => {
                const Icon = step.icon
                const isActive = index === currentStep
                const isCompleted = index < currentStep
                
                return (
                  <div key={step.id} className="flex items-center">
                    <div className={`
                      flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors
                      ${isActive ? 'border-blue-500 bg-blue-500 text-white' : 
                        isCompleted ? 'border-green-500 bg-green-500 text-white' : 
                        'border-gray-300 bg-white text-gray-500'}
                    `}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="ml-3 hidden sm:block">
                      <p className={`text-sm font-medium ${
                        isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {step.title}
                      </p>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-full h-0.5 mx-4 ${
                        index < currentStep ? 'bg-green-500' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Form Content */}
          <div className="min-h-[400px]">
            {renderStepContent()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <div>
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={isSubmitting}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              
              {currentStep < steps.length - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="gap-2"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Submit Application
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}