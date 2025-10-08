/**
 * Type definitions for application management system
 */

export type ApplicationStatus =
  | 'applied'
  | 'reviewing'
  | 'shortlisted'
  | 'interview_scheduled'
  | 'interview_completed'
  | 'offered'
  | 'rejected'
  | 'withdrawn'
  | 'hired'
  | 'archived'

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
    }
    location: string
    salaryMin?: number
    salaryMax?: number
    currency: string
    positionType: string
    remotePolicy: string
    description: string
    requirements: string[]
    isFeatured: boolean
    isUrgent: boolean
    postedAt: string
    expiresAt?: string
    applicationCount: number
  }
  resume?: {
    id: string
    title: string
    fileUrl: string
  }
  coverLetter?: string
  notes?: string
  matchScore?: number
  viewCount?: number
  timeline?: ApplicationTimelineEntry[]
  attachments?: ApplicationAttachment[]
}

export interface ApplicationTimelineEntry {
  id: string
  status: ApplicationStatus
  timestamp: string
  note?: string
  updatedBy: string
  updatedByRole?: string
  type: 'status_change' | 'note' | 'attachment' | 'interview' | 'system'
}

export interface ApplicationAttachment {
  id: string
  fileName: string
  fileUrl: string
  fileSize: number
  mimeType: string
  description?: string
  uploadedAt: string
  uploadedBy: string
}

export interface ApplicationFilters {
  search?: string
  status?: ApplicationStatus[]
  startDate?: string
  endDate?: string
  companies?: string[]
  locations?: string[]
  positionTypes?: string[]
  salaryRanges?: string[]
  remotePolicies?: string[]
  hasMatchScore?: boolean | null
  archived?: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

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
    period: string
    applications: number
    interviews: number
    offers: number
    rejections: number
    successRate: number
  }>
  responseMetrics: {
    averageResponseTime: number
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
    median: number
    marketRate: number
  }
}

export interface ApplicationListConfig {
  page: number
  limit: number
  filters: ApplicationFilters
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

export interface ApplicationCreateRequest {
  jobId: string
  coverLetter: string
  resumeId?: string
  additionalInfo?: string
  salaryExpectation?: string
  availability?: string
  customQuestions?: Record<string, any>
}

export interface ApplicationUpdateRequest {
  status?: ApplicationStatus
  notes?: string
  privateNotes?: string
  reminderDate?: string
}

export interface BulkApplicationAction {
  applicationIds: string[]
  action: 'update_status' | 'archive' | 'delete' | 'add_notes'
  payload?: any
}

export interface ApplicationNotification {
  id: string
  type: 'status_update' | 'interview_scheduled' | 'new_application' | 'reminder'
  applicationId: string
  message: string
  data?: any
  read: boolean
  createdAt: string
}

export interface ApplicationAnalytics {
  successRate: number
  interviewRate: number
  rejectionRate: number
  averageResponseTime: number
  totalApplications: number
  activeApplications: number
  archivedApplications: number
  statusDistribution: Record<ApplicationStatus, number>
  monthlyTrends: Array<{
    month: string
    applications: number
    interviews: number
    offers: number
    rejections: number
  }>
  companyPerformance: Array<{
    companyName: string
    applicationCount: number
    successRate: number
    averageResponseTime: number
  }>
  skillAnalysis: Array<{
    skill: string
    applicationCount: number
    successRate: number
    averageSalary: number
  }>
}

export interface ApplicationExportConfig {
  format: 'csv' | 'json' | 'pdf' | 'excel'
  fields: string[]
  filters?: ApplicationFilters
  includeAnalytics?: boolean
  includeTimeline?: boolean
  includeAttachments?: boolean
  dateRange?: {
    start: string
    end: string
  }
}

export interface ApplicationWebSocketEvent {
  type: 'application_created' | 'application_updated' | 'status_changed' | 'interview_scheduled'
  applicationId: string
  userId: string
  data: any
  timestamp: string
}