// API Validation Schemas
// Zod schemas for API request validation

import { z } from 'zod';

// Common Schemas
export const PaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).optional()
});

export const SortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export const DateRangeSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional()
});

export const IdSchema = z.string().min(1, 'ID is required');

// User Management Schemas
export const UserRegistrationSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['seeker', 'employer']).default('seeker')
});

export const UserLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

export const UserProfileUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  website: z.string().url().optional(),
  linkedin: z.string().url().optional(),
  github: z.string().url().optional()
});

export const PasswordResetSchema = z.object({
  email: z.string().email('Invalid email address')
});

export const PasswordResetConfirmSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

// Job Management Schemas
export const JobCreateSchema = z.object({
  title: z.string().min(3, 'Job title must be at least 3 characters'),
  description: z.string().min(10, 'Job description must be at least 10 characters'),
  requirements: z.array(z.string()).min(1, 'At least one requirement is required'),
  location: z.string().optional(),
  isRemote: z.boolean().default(false),
  experienceLevel: z.enum(['entry', 'junior', 'mid', 'senior', 'lead', 'principal']).optional(),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'freelance', 'internship']).optional(),
  categoryId: z.string().optional(),
  salary: z.object({
    min: z.number().min(0).optional(),
    max: z.number().min(0).optional(),
    currency: z.string().default('ZAR')
  }).optional(),
  expiresAt: z.coerce.date().optional()
});

export const JobUpdateSchema = JobCreateSchema.partial();

export const JobSearchSchema = z.object({
  query: z.string().optional(),
  location: z.string().optional(),
  isRemote: z.boolean().optional(),
  experienceLevel: z.enum(['entry', 'junior', 'mid', 'senior', 'lead', 'principal']).optional(),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'freelance', 'internship']).optional(),
  categoryId: z.string().optional(),
  salaryMin: z.number().min(0).optional(),
  salaryMax: z.number().min(0).optional(),
  postedAfter: z.coerce.date().optional()
}).merge(PaginationSchema).merge(SortSchema);

// Application Management Schemas
export const ApplicationCreateSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  resumeId: z.string().optional(),
  coverLetter: z.string().optional(),
  answers: z.array(z.object({
    questionId: z.string(),
    answer: z.string()
  })).optional()
});

export const ApplicationUpdateSchema = z.object({
  status: z.enum(['APPLIED', 'REVIEWING', 'SHORTLISTED', 'REJECTED', 'HIRED']).optional(),
  notes: z.string().optional()
});

// Resume Management Schemas
export const ResumeUploadSchema = z.object({
  file: z.any(), // File handling is typically done separately
  isPrimary: z.boolean().default(false)
});

export const ResumeUpdateSchema = z.object({
  professionalTitle: z.string().optional(),
  summary: z.string().optional(),
  skills: z.array(z.string()).optional(),
  location: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  linkedin: z.string().url().optional(),
  github: z.string().url().optional()
});

export const ExperienceSchema = z.object({
  company: z.string().min(1, 'Company name is required'),
  position: z.string().min(1, 'Position is required'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  isCurrent: z.boolean().default(false),
  description: z.string().optional(),
  location: z.string().optional(),
  skills: z.array(z.string()).optional()
});

export const EducationSchema = z.object({
  institution: z.string().min(1, 'Institution name is required'),
  degree: z.string().min(1, 'Degree is required'),
  field: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  isCurrent: z.boolean().default(false),
  gpa: z.number().min(0).max(5).optional(),
  description: z.string().optional()
});

// Matching System Schemas
export const MatchRequestSchema = z.object({
  candidateId: z.string().optional(),
  jobId: z.string().optional(),
  filters: z.object({
    skills: z.array(z.string()).optional(),
    location: z.array(z.string()).optional(),
    salaryRange: z.object({
      min: z.number().min(0).optional(),
      max: z.number().min(0).optional(),
      currency: z.string().default('ZAR')
    }).optional(),
    experienceLevel: z.array(z.enum(['entry', 'junior', 'mid', 'senior', 'lead', 'principal'])).optional(),
    workType: z.array(z.enum(['full_time', 'part_time', 'contract', 'freelance', 'internship'])).optional()
  }).optional(),
  limit: z.coerce.number().min(1).max(50).default(10)
});

export const MatchFeedbackSchema = z.object({
  matchId: z.string().min(1, 'Match ID is required'),
  rating: z.number().min(1).max(5),
  feedback: z.string().optional(),
  helpful: z.boolean().optional()
});

// Resume Builder Schemas
export const ResumeBuilderUploadSchema = z.object({
  file: z.any(),
  options: z.object({
    parseResume: z.boolean().default(true),
    analyzeResume: z.boolean().default(true),
    updateProfile: z.boolean().default(false)
  }).optional()
});

export const ResumeBuilderParseSchema = z.object({
  resumeId: z.string().min(1, 'Resume ID is required'),
  options: z.object({
    extractSkills: z.boolean().default(true),
    extractExperience: z.boolean().default(true),
    extractEducation: z.boolean().default(true),
    extractContactInfo: z.boolean().default(true)
  }).optional()
});

export const ResumeBuilderAnalyzeSchema = z.object({
  resumeId: z.string().min(1, 'Resume ID is required'),
  jobDescription: z.string().optional(),
  targetRole: z.string().optional(),
  industry: z.string().optional()
});

// Notification System Schemas
export const NotificationPreferencesSchema = z.object({
  emailEnabled: z.boolean().default(true),
  smsEnabled: z.boolean().default(false),
  pushEnabled: z.boolean().default(true),
  inAppEnabled: z.boolean().default(true),
  applicationUpdates: z.boolean().default(true),
  newJobAlerts: z.boolean().default(true),
  jobMatches: z.boolean().default(true),
  applicationReceived: z.boolean().default(true),
  systemAnnouncements: z.boolean().default(true),
  marketingEmails: z.boolean().default(false),
  quietHoursStart: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  quietHoursEnd: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  timezone: z.string().default('UTC'),
  frequency: z.enum(['immediate', 'hourly', 'daily', 'weekly']).default('immediate'),
  phoneNumber: z.string().optional(),
  alternateEmail: z.string().email().optional()
});

export const NotificationQuerySchema = z.object({
  type: z.string().optional(),
  status: z.enum(['pending', 'sent', 'delivered', 'failed', 'read']).optional(),
  channel: z.enum(['in_app', 'email', 'sms', 'push']).optional(),
  unreadOnly: z.boolean().default(false)
}).merge(PaginationSchema).merge(SortSchema);

// Recommendation System Schemas
export const RecommendationRequestSchema = z.object({
  type: z.enum(['job', 'candidate', 'skill', 'career_path']),
  limit: z.coerce.number().min(1).max(20).default(10),
  filters: z.object({
    excludeViewed: z.boolean().default(false),
    excludeApplied: z.boolean().default(false),
    minScore: z.number().min(0).max(1).optional(),
    skills: z.array(z.string()).optional(),
    location: z.string().optional()
  }).optional()
});

export const RecommendationFeedbackSchema = z.object({
  recommendationId: z.string().min(1, 'Recommendation ID is required'),
  action: z.enum(['view', 'click', 'save', 'dismiss', 'apply']),
  rating: z.number().min(1).max(5).optional(),
  feedback: z.string().optional()
});

// Analytics Schemas
export const AnalyticsQuerySchema = z.object({
  metric: z.string().optional(),
  dateRange: DateRangeSchema,
  dimensions: z.array(z.string()).optional(),
  filters: z.record(z.any()).optional()
});

export const MatchingAnalyticsSchema = z.object({
  dateRange: DateRangeSchema,
  candidateId: z.string().optional(),
  jobId: z.string().optional(),
  includeBreakdown: z.boolean().default(true)
});

// Company Management Schemas
export const CompanyCreateSchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  description: z.string().optional(),
  industry: z.string().optional(),
  website: z.string().url().optional(),
  logoUrl: z.string().url().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  country: z.string().optional(),
  contactEmail: z.string().email().optional(),
  phoneNumber: z.string().optional(),
  billingEmail: z.string().email().optional(),
  employeeCount: z.number().min(1).optional(),
  foundedYear: z.number().min(1800).max(new Date().getFullYear()).optional(),
  techStack: z.array(z.string()).optional()
});

export const CompanyUpdateSchema = CompanyCreateSchema.partial();

// Billing Schemas
export const BillingProfileCreateSchema = z.object({
  companyId: z.string().min(1, 'Company ID is required'),
  planId: z.string().min(1, 'Plan ID is required'),
  paymentMethod: z.object({
    type: z.enum(['card', 'bank_transfer']),
    details: z.record(z.any())
  }),
  billingEmail: z.string().email(),
  billingAddress: z.object({
    street: z.string(),
    city: z.string(),
    province: z.string(),
    postalCode: z.string(),
    country: z.string()
  })
});

// Skills Management Schemas
export const SkillVerificationSchema = z.object({
  skill: z.string().min(1, 'Skill name is required'),
  verificationMethod: z.enum(['manual', 'automated', 'third_party']),
  evidence: z.array(z.string()).optional()
});

export const SkillRecommendationSchema = z.object({
  userRole: z.enum(['seeker', 'employer']),
  currentSkills: z.array(z.string()),
  targetRole: z.string().optional(),
  industry: z.string().optional(),
  experienceLevel: z.enum(['entry', 'junior', 'mid', 'senior', 'lead', 'principal']).optional()
});

// File Upload Schemas
export const FileUploadSchema = z.object({
  file: z.any(),
  type: z.enum(['resume', 'profile_image', 'company_logo', 'document']),
  maxSize: z.number().default(5 * 1024 * 1024), // 5MB
  allowedTypes: z.array(z.string()).default([
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ])
});

// WebSocket Authentication Schema
export const WebSocketAuthSchema = z.object({
  token: z.string().min(1, 'Authentication token is required'),
  userId: z.string().optional(),
  sessionId: z.string().optional()
});

// Event Subscription Schema
export const EventSubscriptionSchema = z.object({
  eventTypes: z.array(z.string()).min(1, 'At least one event type is required'),
  filters: z.record(z.any()).optional(),
  roomId: z.string().optional()
});

// Search and Filter Schemas
export const AdvancedSearchSchema = z.object({
  query: z.string().optional(),
  filters: z.record(z.any()).optional(),
  aggregations: z.array(z.string()).optional(),
  facets: z.record(z.array(z.string())).optional()
}).merge(PaginationSchema).merge(SortSchema);

// Bulk Operation Schemas
export const BulkOperationSchema = z.object({
  operation: z.enum(['create', 'update', 'delete']),
  resources: z.array(z.record(z.any())).min(1, 'At least one resource is required'),
  options: z.object({
    continueOnError: z.boolean().default(false),
    validateBeforeExecute: z.boolean().default(true)
  }).optional()
});

// Export all schemas for easy importing
export const ValidationSchemas = {
  // Common
  Pagination: PaginationSchema,
  Sort: SortSchema,
  DateRange: DateRangeSchema,
  Id: IdSchema,

  // User Management
  UserRegistration: UserRegistrationSchema,
  UserLogin: UserLoginSchema,
  UserProfileUpdate: UserProfileUpdateSchema,
  PasswordReset: PasswordResetSchema,
  PasswordResetConfirm: PasswordResetConfirmSchema,

  // Job Management
  JobCreate: JobCreateSchema,
  JobUpdate: JobUpdateSchema,
  JobSearch: JobSearchSchema,

  // Application Management
  ApplicationCreate: ApplicationCreateSchema,
  ApplicationUpdate: ApplicationUpdateSchema,

  // Resume Management
  ResumeUpload: ResumeUploadSchema,
  ResumeUpdate: ResumeUpdateSchema,
  Experience: ExperienceSchema,
  Education: EducationSchema,

  // Matching System
  MatchRequest: MatchRequestSchema,
  MatchFeedback: MatchFeedbackSchema,

  // Resume Builder
  ResumeBuilderUpload: ResumeBuilderUploadSchema,
  ResumeBuilderParse: ResumeBuilderParseSchema,
  ResumeBuilderAnalyze: ResumeBuilderAnalyzeSchema,

  // Notification System
  NotificationPreferences: NotificationPreferencesSchema,
  NotificationQuery: NotificationQuerySchema,

  // Recommendation System
  RecommendationRequest: RecommendationRequestSchema,
  RecommendationFeedback: RecommendationFeedbackSchema,

  // Analytics
  AnalyticsQuery: AnalyticsQuerySchema,
  MatchingAnalytics: MatchingAnalyticsSchema,

  // Company Management
  CompanyCreate: CompanyCreateSchema,
  CompanyUpdate: CompanyUpdateSchema,

  // Billing
  BillingProfileCreate: BillingProfileCreateSchema,

  // Skills Management
  SkillVerification: SkillVerificationSchema,
  SkillRecommendation: SkillRecommendationSchema,

  // File Upload
  FileUpload: FileUploadSchema,

  // WebSocket
  WebSocketAuth: WebSocketAuthSchema,
  EventSubscription: EventSubscriptionSchema,

  // Search and Filter
  AdvancedSearch: AdvancedSearchSchema,

  // Bulk Operations
  BulkOperation: BulkOperationSchema
};

export default ValidationSchemas;