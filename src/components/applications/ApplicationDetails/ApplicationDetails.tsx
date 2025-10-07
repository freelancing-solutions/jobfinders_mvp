'use client'

import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StatusBadge, ApplicationStatus } from '../status-badge'
import { ApplicationTimeline } from '../application-timeline'
import { useApplication } from '@/hooks/applications/use-applications'
import { Application, ApplicationNote, ApplicationAttachment } from '@/types/applications'
import {
  Building2,
  MapPin,
  DollarSign,
  Clock,
  Calendar,
  FileText,
  Users,
  Mail,
  Phone,
  ExternalLink,
  Edit,
  Trash2,
  Archive,
  Download,
  MessageSquare,
  Plus,
  Paperclip,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Eye,
  Star,
  Bell,
  Settings,
} from 'lucide-react'

interface ApplicationDetailsProps {
  applicationId: string
  className?: string
  onStatusUpdate?: (applicationId: string, status: ApplicationStatus) => void
  onEdit?: (application: Application) => void
  onDelete?: (applicationId: string) => void
}

export function ApplicationDetails({
  applicationId,
  className,
  onStatusUpdate,
  onEdit,
  onDelete,
}: ApplicationDetailsProps) {
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false)
  const [noteContent, setNoteContent] = useState('')
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [editedNotes, setEditedNotes] = useState('')

  const {
    application,
    isLoading,
    error,
    updateStatus,
    addNote: addApplicationNote,
    uploadFile,
    delete: deleteApplication,
    archive,
    withdraw,
    refresh,
  } = useApplication(applicationId)

  // Handle status update
  const handleStatusUpdate = useCallback(async (status: ApplicationStatus) => {
    await updateStatus(status)
    onStatusUpdate?.(applicationId, status)
  }, [updateStatus, applicationId, onStatusUpdate])

  // Handle add note
  const handleAddNote = useCallback(async () => {
    if (!noteContent.trim()) return

    try {
      await addApplicationNote(noteContent, true)
      setNoteContent('')
      setIsNoteDialogOpen(false)
    } catch (error) {
      console.error('Failed to add note:', error)
    }
  }, [noteContent, addApplicationNote])

  // Handle edit notes
  const handleEditNotes = useCallback(() => {
    setEditedNotes(application?.notes || '')
    setIsEditingNotes(true)
  }, [application])

  const handleSaveNotes = useCallback(async () => {
    try {
      // This would call an update API for notes
      // await updateApplication(applicationId, { notes: editedNotes })
      setIsEditingNotes(false)
      refresh()
    } catch (error) {
      console.error('Failed to save notes:', error)
    }
  }, [editedNotes, applicationId, refresh])

  // Handle file upload
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      await uploadFile(file, `Uploaded on ${new Date().toLocaleDateString()}`)
      refresh()
    } catch (error) {
      console.error('Failed to upload file:', error)
    }
  }, [uploadFile, refresh])

  // Handle actions
  const handleEdit = useCallback(() => {
    if (application) {
      onEdit?.(application)
    }
  }, [application, onEdit])

  const handleDelete = useCallback(async () => {
    if (window.confirm('Are you sure you want to delete this application? This action cannot be undone.')) {
      await deleteApplication()
      onDelete?.(applicationId)
    }
  }, [deleteApplication, applicationId, onDelete])

  const handleArchive = useCallback(async () => {
    await archive()
  }, [archive])

  const handleWithdraw = useCallback(async () => {
    const reason = window.prompt('Why are you withdrawing this application? (optional)')
    await withdraw(reason || undefined)
  }, [withdraw])

  if (isLoading && !application) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </CardContent>
      </Card>
    )
  }

  if (error && !application) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Application</h3>
          <p className="text-gray-600 text-center mb-4">{error}</p>
          <Button onClick={refresh} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!application) {
    return null
  }

  const isActive = !['rejected', 'withdrawn', 'hired', 'archived'].includes(application.status)

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              {/* Company Logo */}
              <Avatar className="h-16 w-16">
                <AvatarImage src={application.job.company.logo} alt={application.job.company.name} />
                <AvatarFallback>
                  <Building2 className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>

              {/* Job Info */}
              <div className="flex-1 min-w-0">
                <CardTitle className="text-2xl mb-2">{application.job.title}</CardTitle>
                <CardDescription className="text-lg font-medium text-gray-900 mb-1">
                  {application.job.company.name}
                </CardDescription>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{application.job.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{application.job.positionType}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Applied {new Date(application.appliedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Status and Actions */}
              <div className="flex items-center gap-3">
                <StatusBadge status={application.status} size="lg" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleEdit}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Application
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.open(`/jobs/${application.jobId}`, '_blank')}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Job Posting
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {isActive && (
                      <DropdownMenuItem onClick={() => handleStatusUpdate('reviewing')}>
                        <Eye className="mr-2 h-4 w-4" />
                        Mark as Under Review
                      </DropdownMenuItem>
                    )}
                    {isActive && (
                      <DropdownMenuItem onClick={handleWithdraw} className="text-yellow-600">
                        <AlertCircle className="mr-2 h-4 w-4" />
                        Withdraw Application
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleArchive}>
                      <Archive className="mr-2 h-4 w-4" />
                      Archive
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Application
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Job Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Salary */}
              {(application.job.salaryMin || application.job.salaryMax) && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <span>
                    {application.job.salaryMin && application.job.salaryMax
                      ? `${application.job.currency}${application.job.salaryMin.toLocaleString()} - ${application.job.currency}${application.job.salaryMax.toLocaleString()}`
                      : application.job.salaryMin
                      ? `${application.job.currency}${application.job.salaryMin.toLocaleString()}+`
                      : `Up to ${application.job.currency}${application.job.salaryMax?.toLocaleString()}`}
                  </span>
                </div>
              )}

              {/* Remote Policy */}
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-500" />
                <span>{application.job.remotePolicy}</span>
              </div>

              {/* Requirements */}
              {application.job.requirements.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Requirements:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {application.job.requirements.map((req, index) => (
                      <li key={index} className="text-sm text-gray-600">{req}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Benefits */}
              {application.job.benefits && application.job.benefits.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Benefits:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {application.job.benefits.map((benefit, index) => (
                      <li key={index} className="text-sm text-gray-600">{benefit}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Description */}
              <div>
                <h4 className="font-medium mb-2">Job Description:</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {application.job.description}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Application Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ApplicationTimeline
                events={application.timeline || []}
                currentStatus={application.status}
                showFuture={isActive}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isActive && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleStatusUpdate('reviewing')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Mark as Under Review
                </Button>
              )}
              <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Add Note
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Note</DialogTitle>
                    <DialogDescription>
                      Add a private note to this application
                    </DialogDescription>
                  </DialogHeader>
                  <Textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Enter your note here..."
                    rows={4}
                  />
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsNoteDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddNote}>
                      Add Note
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <div className="relative">
                <Input
                  type="file"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Button variant="outline" className="w-full justify-start">
                  <Paperclip className="h-4 w-4 mr-2" />
                  Upload Attachment
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Application Materials */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Application Materials
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Resume */}
              {application.resume && (
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">{application.resume.title}</p>
                      <p className="text-xs text-gray-500">
                        {application.resume.fileSize} bytes
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={application.resume.fileUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              )}

              {/* Cover Letter */}
              {application.coverLetter && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Cover Letter:</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {application.coverLetter}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Notes
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={isEditingNotes ? handleSaveNotes : handleEditNotes}
                >
                  {isEditingNotes ? 'Save' : 'Edit'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isEditingNotes ? (
                <Textarea
                  value={editedNotes}
                  onChange={(e) => setEditedNotes(e.target.value)}
                  placeholder="Add your notes here..."
                  rows={4}
                />
              ) : (
                <div className="text-sm text-gray-600">
                  {application.notes ? (
                    <p>{application.notes}</p>
                  ) : (
                    <p className="text-gray-400 italic">No notes added yet</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Match Score */}
          {application.matchScore && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Match Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center">
                  <div className="relative w-24 h-24">
                    <div className="absolute inset-0 rounded-full border-8 border-gray-200"></div>
                    <div
                      className="absolute inset-0 rounded-full border-8 border-green-500"
                      style={{
                        clipPath: `polygon(50% 50%, 50% 0%, ${50 + application.matchScore / 2}% 0%)`,
                        transform: 'rotate(-90deg)',
                      }}
                    ></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold">{application.matchScore}%</span>
                    </div>
                  </div>
                </div>
                <p className="text-center text-sm text-gray-600 mt-3">
                  Your profile matches this job well
                </p>
              </CardContent>
            </Card>
          )}

          {/* Analytics */}
          {application.viewCount && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Views</span>
                  <span className="text-sm font-medium">{application.viewCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Application Status</span>
                  <StatusBadge status={application.status} size="sm" />
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Source</span>
                  <Badge variant="outline">{application.source}</Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}