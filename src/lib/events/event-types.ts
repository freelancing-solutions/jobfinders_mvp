// Event System Types
// Core event types and payloads for the event bus system

export enum EventType {
  // User Events
  USER_REGISTERED = 'user.registered',
  USER_PROFILE_UPDATED = 'user.profile_updated',
  USER_PREFERENCES_UPDATED = 'user.preferences_updated',
  USER_LOGIN = 'user.login',
  USER_LOGOUT = 'user.logout',

  // Job Events
  JOB_POSTED = 'job.posted',
  JOB_UPDATED = 'job.updated',
  JOB_EXPIRED = 'job.expired',
  JOB_CLOSED = 'job.closed',
  JOB_FEATURED = 'job.featured',

  // Application Events
  APPLICATION_SUBMITTED = 'application.submitted',
  APPLICATION_UPDATED = 'application.updated',
  APPLICATION_WITHDRAWN = 'application.withdrawn',
  APPLICATION_VIEWED = 'application.viewed',

  // Matching Events
  MATCH_CREATED = 'match.created',
  MATCH_UPDATED = 'match.updated',
  MATCH_VIEWED = 'match.viewed',
  MATCH_ACCEPTED = 'match.accepted',
  MATCH_REJECTED = 'match.rejected',

  // Resume Events
  RESUME_UPLOADED = 'resume.uploaded',
  RESUME_PARSED = 'resume.parsed',
  RESUME_ANALYZED = 'resume.analyzed',
  RESUME_UPDATED = 'resume.updated',
  RESUME_DELETED = 'resume.deleted',

  // Notification Events
  NOTIFICATION_CREATED = 'notification.created',
  NOTIFICATION_SENT = 'notification.sent',
  NOTIFICATION_DELIVERED = 'notification.delivered',
  NOTIFICATION_READ = 'notification.read',
  NOTIFICATION_FAILED = 'notification.failed',

  // Recommendation Events
  RECOMMENDATION_GENERATED = 'recommendation.generated',
  RECOMMENDATION_VIEWED = 'recommendation.viewed',
  RECOMMENDATION_CLICKED = 'recommendation.clicked',
  RECOMMENDATION_SAVED = 'recommendation.saved',
  RECOMMENDATION_DISMISSED = 'recommendation.dismissed',

  // System Events
  SYSTEM_BACKUP_COMPLETED = 'system.backup_completed',
  SYSTEM_MAINTENANCE_STARTED = 'system.maintenance_started',
  SYSTEM_MAINTENANCE_COMPLETED = 'system.maintenance_completed',
  SYSTEM_ERROR_OCCURRED = 'system.error_occurred',

  // Analytics Events
  ANALYTICS_DATA_COLLECTED = 'analytics.data_collected',
  ANALYTICS_REPORT_GENERATED = 'analytics.report_generated',
  ANALYTICS_METRICS_UPDATED = 'analytics.metrics_updated',

  // Real-time Events
  REAL_TIME_CONNECTION_ESTABLISHED = 'real_time.connection_established',
  REAL_TIME_CONNECTION_LOST = 'real_time.connection_lost',
  REAL_TIME_DATA_UPDATED = 'real_time.data_updated'
}

export enum EventPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface BaseEvent {
  id: string;
  type: EventType;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  priority: EventPriority;
  metadata?: Record<string, any>;
  correlationId?: string;
  source: string;
}

// User Event Payloads
export interface UserRegisteredEvent extends BaseEvent {
  type: EventType.USER_REGISTERED;
  payload: {
    userId: string;
    email: string;
    role: 'seeker' | 'employer' | 'admin';
    registrationSource?: string;
    ip?: string;
    userAgent?: string;
  };
}

export interface UserProfileUpdatedEvent extends BaseEvent {
  type: EventType.USER_PROFILE_UPDATED;
  payload: {
    userId: string;
    changes: Record<string, any>;
    previousValues: Record<string, any>;
  };
}

// Job Event Payloads
export interface JobPostedEvent extends BaseEvent {
  type: EventType.JOB_POSTED;
  payload: {
    jobId: string;
    companyId: string;
    employerId: string;
    title: string;
    category?: string;
    location?: string;
    isRemote: boolean;
    requirements: string[];
    salaryRange?: {
      min?: number;
      max?: number;
      currency: string;
    };
  };
}

export interface JobUpdatedEvent extends BaseEvent {
  type: EventType.JOB_UPDATED;
  payload: {
    jobId: string;
    changes: Record<string, any>;
    previousValues: Record<string, any>;
  };
}

// Application Event Payloads
export interface ApplicationSubmittedEvent extends BaseEvent {
  type: EventType.APPLICATION_SUBMITTED;
  payload: {
    applicationId: string;
    jobId: string;
    jobSeekerProfileId: string;
    resumeId?: string;
    coverLetter?: string;
    matchScore?: number;
    appliedAt: Date;
  };
}

// Matching Event Payloads
export interface MatchCreatedEvent extends BaseEvent {
  type: EventType.MATCH_CREATED;
  payload: {
    matchId: string;
    candidateId: string;
    jobId: string;
    score: number;
    breakdown: {
      skillsMatch: number;
      experienceMatch: number;
      educationMatch: number;
      locationMatch: number;
      overallScore: number;
    };
    confidence: number;
    algorithmVersion: string;
  };
}

export interface MatchUpdatedEvent extends BaseEvent {
  type: EventType.MATCH_UPDATED;
  payload: {
    matchId: string;
    previousScore?: number;
    newScore: number;
    changes: Record<string, any>;
  };
}

// Resume Event Payloads
export interface ResumeUploadedEvent extends BaseEvent {
  type: EventType.RESUME_UPLOADED;
  payload: {
    resumeId: string;
    userId: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    uploadSource: 'manual' | 'import' | 'api';
  };
}

export interface ResumeParsedEvent extends BaseEvent {
  type: EventType.RESUME_PARSED;
  payload: {
    resumeId: string;
    userId: string;
    parsedData: {
      personalInfo: Record<string, any>;
      skills: string[];
      experience: Array<Record<string, any>>;
      education: Array<Record<string, any>>;
      certifications: Array<Record<string, any>>;
    };
    confidence: number;
  };
}

export interface ResumeAnalyzedEvent extends BaseEvent {
  type: EventType.RESUME_ANALYZED;
  payload: {
    resumeId: string;
    userId: string;
    analysisResults: {
      completionScore: number;
      skillGaps: string[];
      recommendations: string[];
      marketFit: number;
      suggestedImprovements: Array<{
        category: string;
        suggestion: string;
        priority: 'low' | 'medium' | 'high';
      }>;
    };
  };
}

// Notification Event Payloads
export interface NotificationCreatedEvent extends BaseEvent {
  type: EventType.NOTIFICATION_CREATED;
  payload: {
    notificationId: string;
    userId: string;
    type: string;
    channel: 'in_app' | 'email' | 'sms' | 'push';
    title: string;
    message: string;
    data?: Record<string, any>;
    priority: EventPriority;
    scheduledFor?: Date;
  };
}

export interface NotificationSentEvent extends BaseEvent {
  type: EventType.NOTIFICATION_SENT;
  payload: {
    notificationId: string;
    userId: string;
    channel: string;
    provider?: string;
    providerMessageId?: string;
    sentAt: Date;
  };
}

export interface NotificationDeliveredEvent extends BaseEvent {
  type: EventType.NOTIFICATION_DELIVERED;
  payload: {
    notificationId: string;
    userId: string;
    channel: string;
    deliveredAt: Date;
    metadata?: Record<string, any>;
  };
}

export interface NotificationReadEvent extends BaseEvent {
  type: EventType.NOTIFICATION_READ;
  payload: {
    notificationId: string;
    userId: string;
    readAt: Date;
    timeToRead?: number; // Time in seconds between delivery and read
  };
}

// Recommendation Event Payloads
export interface RecommendationGeneratedEvent extends BaseEvent {
  type: EventType.RECOMMENDATION_GENERATED;
  payload: {
    recommendationId: string;
    userId: string;
    targetId: string;
    type: 'job' | 'candidate' | 'skill' | 'career_path';
    score: number;
    reason: string;
    strategy: string;
    metadata: Record<string, any>;
  };
}

export interface RecommendationViewedEvent extends BaseEvent {
  type: EventType.RECOMMENDATION_VIEWED;
  payload: {
    recommendationId: string;
    userId: string;
    viewedAt: Date;
    context?: string;
  };
}

// Analytics Event Payloads
export interface AnalyticsDataCollectedEvent extends BaseEvent {
  type: EventType.ANALYTICS_DATA_COLLECTED;
  payload: {
    userId?: string;
    sessionId?: string;
    eventType: string;
    data: Record<string, any>;
    timestamp: Date;
    source: string;
  };
}

export interface AnalyticsMetricsUpdatedEvent extends BaseEvent {
  type: EventType.ANALYTICS_METRICS_UPDATED;
  payload: {
    metricType: string;
    value: number | string;
    previousValue?: number | string;
    changePercentage?: number;
    timeRange: {
      start: Date;
      end: Date;
    };
    dimensions?: Record<string, string>;
  };
}

// Real-time Event Payloads
export interface RealTimeConnectionEstablishedEvent extends BaseEvent {
  type: EventType.REAL_TIME_CONNECTION_ESTABLISHED;
  payload: {
    userId: string;
    sessionId: string;
    connectionId: string;
    connectedAt: Date;
    userAgent?: string;
    ip?: string;
  };
}

export interface RealTimeDataUpdatedEvent extends BaseEvent {
  type: EventType.REAL_TIME_DATA_UPDATED;
  payload: {
    userId?: string;
    dataType: string;
    dataId: string;
    updateType: 'create' | 'update' | 'delete';
    data: Record<string, any>;
    affectedUsers?: string[];
  };
}

// System Event Payloads
export interface SystemErrorOccurredEvent extends BaseEvent {
  type: EventType.SYSTEM_ERROR_OCCURRED;
  payload: {
    errorId: string;
    errorType: string;
    message: string;
    stack?: string;
    context: Record<string, any>;
    severity: 'low' | 'medium' | 'high' | 'critical';
    userId?: string;
    sessionId?: string;
    timestamp: Date;
  };
}

// Event Handlers
export interface EventHandler<T extends BaseEvent = BaseEvent> {
  eventType: EventType;
  handler: (event: T) => Promise<void> | void;
  options?: {
    priority?: number;
    retryAttempts?: number;
    timeout?: number;
    filter?: (event: T) => boolean;
  };
}

// Event Bus Configuration
export interface EventBusConfig {
  maxRetries: number;
  retryDelay: number;
  timeout: number;
  maxConcurrentEvents: number;
  enablePersistence: boolean;
  enableMonitoring: boolean;
  bufferSize: number;
  batchProcessing: boolean;
  batchSize: number;
  batchTimeout: number;
}

// Event Filter
export interface EventFilter {
  eventTypes?: EventType[];
  userId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  priority?: EventPriority[];
  source?: string;
  customFilter?: (event: BaseEvent) => boolean;
}

// Event Subscription
export interface EventSubscription {
  id: string;
  eventTypes: EventType[];
  filter?: EventFilter;
  handler: EventHandler;
  isActive: boolean;
  createdAt: Date;
  lastTriggered?: Date;
}

// Event Metrics
export interface EventMetrics {
  totalEvents: number;
  eventsByType: Record<EventType, number>;
  eventsByPriority: Record<EventPriority, number>;
  averageProcessingTime: number;
  failureRate: number;
  retryCount: number;
  bufferSize: number;
  activeSubscriptions: number;
}

// Union type for all possible events
export type AppEvent =
  | UserRegisteredEvent
  | UserProfileUpdatedEvent
  | JobPostedEvent
  | JobUpdatedEvent
  | ApplicationSubmittedEvent
  | MatchCreatedEvent
  | MatchUpdatedEvent
  | ResumeUploadedEvent
  | ResumeParsedEvent
  | ResumeAnalyzedEvent
  | NotificationCreatedEvent
  | NotificationSentEvent
  | NotificationDeliveredEvent
  | NotificationReadEvent
  | RecommendationGeneratedEvent
  | RecommendationViewedEvent
  | AnalyticsDataCollectedEvent
  | AnalyticsMetricsUpdatedEvent
  | RealTimeConnectionEstablishedEvent
  | RealTimeDataUpdatedEvent
  | SystemErrorOccurredEvent;