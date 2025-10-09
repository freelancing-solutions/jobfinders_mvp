/**
 * Core Application Types for JobFinders MVP
 * This file contains all TypeScript interfaces and types for the applications management system
 */

import { UserRole } from '@/types/roles'
import { User } from '@/types/profiles'
import { Job } from '@/types/jobs'

// Re-export from existing components
export type { ApplicationStatus } from '@/components/applications/status-badge'

/**
 * Core Application interface - represents a single job application
 */
export interface Application {
  id: string
  jobId: string
  userId: string
  status: ApplicationStatus
  appliedAt: string
  updatedAt: string
  job: {
    id: string
    title: string
    company: {
      id: string
      name: string
      logo?: string
      location?: string
      website?: string
      size?: string
      industry?: string
    }
    location: string
    salaryMin?: number
    salaryMax?: number
    currency: string
    positionType: string
    remotePolicy: string
    description: string
    requirements: string[]
    benefits?: string[]
    isFeatured: boolean
    isUrgent: boolean
    postedAt: string
    expiresAt?: string
    applicationCount: number
    department?: string
    experienceLevel?: string
    skills?: string[]
  }
  resume?: {
    id: string
    title: string
    fileUrl: string
    fileName: string
    fileSize: number
    fileType: string
  }
  coverLetter?: string
  notes?: string
  matchScore?: number
  viewCount?: number
  source: 'direct' | 'linkedin' | 'indeed' | 'glassdoor' | 'other'
  referral?: {
    name: string
    email?: string
    relationship: string
  }
  timeline?: ApplicationTimelineEvent[]
  attachments?: ApplicationAttachment[]
  interviewDetails?: InterviewDetails[]
  feedback?: ApplicationFeedback[]
  analytics?: ApplicationAnalytics
  notifications?: ApplicationNotificationSettings
}

/**
 * Timeline event for tracking application progress
 */
export interface ApplicationTimelineEvent {
  id: string
  status: ApplicationStatus
  timestamp: string
  note?: string
  updatedBy: string
  updatedByRole?: UserRole | 'system'
  attachments?: ApplicationAttachment[]
  metadata?: Record<string, any>
}

/**
 * File attachment for applications
 */
export interface ApplicationAttachment {
  id: string
  name: string
  url: string
  type: string
  size: number
  uploadedAt: string
  uploadedBy: string
  description?: string
}

/**
 * Interview details
 */
export interface InterviewDetails {
  id: string
  type: 'phone' | 'video' | 'onsite' | 'technical' | 'behavioral' | 'panel'
  scheduledAt: string
  duration: number // in minutes
  location?: string
  meetingLink?: string
  interviewers: Array<{
    name: string
    email?: string
    role: string
    avatar?: string
  }>
  instructions?: string
  preparation?: string[]
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
  feedback?: string
  rating?: number // 1-5 scale
}

/**
 * Feedback received for the application
 */
export interface ApplicationFeedback {
  id: string
  from: UserRole | 'system' | 'ai'
  timestamp: string
  type: 'rating' | 'comment' | 'suggestion' | 'improvement'
  content: string
  rating?: number // 1-5 scale
  actionable: boolean
  category?: 'resume' | 'cover_letter' | 'skills' | 'interview' | 'general'
}

/**
 * Analytics data for an application
 */
export interface ApplicationAnalytics {
  views: number
  lastViewed?: string
  clickThroughRate?: number
  responseRate?: number
  averageResponseTime?: number // in hours
  competitorCount?: number
  marketDemand?: 'high' | 'medium' | 'low'
  skillMatchScore?: number
  experienceMatchScore?: number
  recommendations?: ApplicationRecommendation[]
}

/**
 * AI-powered recommendations
 */
export interface ApplicationRecommendation {
  id: string
  type: 'skill' | 'experience' | 'network' | 'timing' | 'followup'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  actionText?: string
  actionUrl?: string
  validUntil?: string
  aiConfidence: number // 0-1 score
}

/**
 * Notification settings for an application
 */
export interface ApplicationNotificationSettings {
  statusUpdates: boolean
  interviewReminders: boolean
  feedbackRequests: boolean
  deadlineReminders: boolean
  weeklyDigest: boolean
  newApplicantsAlert: boolean // for employers
  customAlerts: CustomNotificationRule[]
}

/**
 * Custom notification rule
 */
export interface CustomNotificationRule {
  id: string
  name: string
  enabled: boolean
  trigger: 'status_change' | 'deadline' | 'view_count' | 'no_response' | 'custom'
  conditions: Record<string, any>
  actions: ('email' | 'push' | 'sms' | 'in_app')[]
  message?: string
}

/**
 * Application list view configuration
 */
export interface ApplicationListConfig {
  viewMode: 'list' | 'grid' | 'compact'
  sortBy: 'date' | 'status' | 'company' | 'matchScore' | 'deadline' | 'priority'
  sortOrder: 'asc' | 'desc'
  filters: ApplicationFilters
  pageSize: number
  showAnalytics: boolean
  showTimeline: boolean
  showMatchScore: boolean
  showNotes: boolean
  groupBy?: 'status' | 'company' | 'date' | 'priority'
}

/**
 * Filters for application queries
 */
export interface ApplicationFilters {
  status?: ApplicationStatus[]
  dateFrom?: string
  dateTo?: string
  company?: string[]
  jobTitle?: string
  location?: string
  salaryMin?: number
  salaryMax?: number
  remotePolicy?: string[]
  source?: string[]
  matchScoreMin?: number
  hasNotes?: boolean
  hasAttachments?: boolean
  isArchived?: boolean
  search?: string // semantic search
  priority?: 'high' | 'medium' | 'low'
}

/**
 * Application statistics
 */
export interface ApplicationStats {
  total: number
  active: number
  archived: number
  byStatus: Record<ApplicationStatus, number>
  byCompany: Array<{
    companyName: string
    count: number
    successRate: number
  }>
  byTimePeriod: Array<{
    period: string // e.g., "2024-01", "2024-W01"
    applications: number
    interviews: number
    offers: number
    rejections: number
    successRate: number
  }>
  responseMetrics: {
    averageResponseTime: number // in hours
    responseRate: number
    interviewRate: number
    offerRate: number
  }
  topSkills: Array<{
    skill: string
    count: number
    successRate: number
  }>
  salaryInsights: {
    averageMin: number
    averageMax: number
    median: number
    marketRate: number
  }
}

/**
 * Application activity feed item
 */
export interface ApplicationActivity {
  id: string
  type: 'status_change' | 'view' | 'note' | 'attachment' | 'interview' | 'feedback' | 'recommendation'
  applicationId: string
  timestamp: string
  title: string
  description: string
  metadata?: Record<string, any>
  isRead: boolean
  priority: 'high' | 'medium' | 'low'
}

/**
 * Real-time application update event
 */
export interface ApplicationUpdateEvent {
  type: 'status_changed' | 'view_count_updated' | 'feedback_added' | 'interview_scheduled' | 'note_added'
  applicationId: string
  timestamp: string
  data: any
  userId?: string
}

/**
 * Application export configuration
 */
export interface ApplicationExportConfig {
  format: 'pdf' | 'excel' | 'csv' | 'json'
  fields: (keyof Application)[]
  filters: ApplicationFilters
  includeAnalytics: boolean
  includeTimeline: boolean
  includeAttachments: boolean
  dateRange?: {
    from: string
    to: string
  }
}

/**
 * Application bulk action
 */
export interface ApplicationBulkAction {
  type: 'withdraw' | 'archive' | 'delete' | 'update_status' | 'add_note' | 'export'
  applicationIds: string[]
  data?: any
  confirmRequired: boolean
}

/**
 * Application reminder
 */
export interface ApplicationReminder {
  id: string
  applicationId: string
  type: 'followup' | 'interview' | 'deadline' | 'custom'
  title: string
  description?: string
  scheduledFor: string
  isCompleted: boolean
  notifyVia: ('email' | 'push' | 'sms' | 'in_app')[]
  recurrence?: 'once' | 'daily' | 'weekly' | 'monthly'
}

/**
 * Application note
 */
export interface ApplicationNote {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  createdBy: string
  isPrivate: boolean
  tags: string[]
  attachments?: ApplicationAttachment[]
}

/**
 * API request/response types
 */
export interface GetApplicationsRequest {
  query?: {
    page?: number
    pageSize?: number
    status?: ApplicationStatus[]
    dateFrom?: string
    dateTo?: string
    company?: string
    jobTitle?: string
    search?: string
    sortBy?: 'date' | 'status' | 'company' | 'matchScore'
    sortOrder?: 'asc' | 'desc'
    includeAnalytics?: boolean
    includeNotes?: boolean
  }
}

export interface GetApplicationsResponse {
  applications: Application[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
  filters?: {
    availableCompanies: string[]
    availableLocations: string[]
    availableStatuses: ApplicationStatus[]
  }
  stats?: Partial<ApplicationStats>
}

export interface CreateApplicationRequest {
  jobId: string
  resumeId?: string
  coverLetter?: string
  notes?: string
  source?: Application['source']
  referral?: Application['referral']
  customData?: Record<string, any>
}

export interface UpdateApplicationRequest {
  status?: ApplicationStatus
  notes?: string
  coverLetter?: string
  notifications?: Partial<ApplicationNotificationSettings>
  customData?: Record<string, any>
}

export interface ApplicationWebSocketEvents {
  'application:status_changed': ApplicationUpdateEvent
  'application:view_updated': ApplicationUpdateEvent
  'application:feedback_added': ApplicationUpdateEvent
  'application:interview_scheduled': ApplicationUpdateEvent
  'application:note_added': ApplicationUpdateEvent
  'application:reminder_triggered': { applicationId: string; reminderId: string }
}