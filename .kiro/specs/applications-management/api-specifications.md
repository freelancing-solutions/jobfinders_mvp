# API Specifications: Applications Management System

## Overview

This document defines the comprehensive API specifications for the Applications Management System, including REST endpoints, WebSocket events, real-time APIs, and integration APIs. The API leverages the existing infrastructure and follows the established patterns for authentication, security, and error handling.

## Base API Structure

### Base URL
- **Development**: `http://localhost:3010/api/applications`
- **Production**: `https://api.jobfinders.com/applications`

### Authentication
- **Method**: Bearer Token (JWT)
- **Header**: `Authorization: Bearer <token>`
- **Required**: All endpoints except public ones

### Rate Limiting
- **Standard**: 100 requests per minute per user
- **Real-time**: 1000 WebSocket messages per minute per user
- **Bulk Operations**: 10 requests per minute per user

## REST API Endpoints

### Core Application Endpoints

#### GET /api/applications
Get user's applications with optional filtering and pagination.

**Request:**
```typescript
interface GetApplicationsRequest {
  query?: {
    page?: number;           // Default: 1
    pageSize?: number;       // Default: 20, Max: 100
    status?: ApplicationStatus[];
    dateFrom?: string;       // ISO date string
    dateTo?: string;         // ISO date string
    company?: string;        // Company name filter
    jobTitle?: string;       // Job title filter
    search?: string;         // Semantic search
    sortBy?: 'date' | 'status' | 'company' | 'matchScore';
    sortOrder?: 'asc' | 'desc';
    includeAnalytics?: boolean;
    includeNotes?: boolean;
  };
}
```

**Response:**
```typescript
interface GetApplicationsResponse {
  success: boolean;
  data: {
    applications: Application[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasMore: boolean;
    filters: ApplicationFilters;
    lastUpdated: string;     // ISO date string
  };
  meta: {
    requestId: string;
    timestamp: string;
    processingTime: number;
  };
}
```

**Example:**
```typescript
// Request
GET /api/applications?page=1&pageSize=10&status=applied,reviewing&sortBy=date&sortOrder=desc&includeAnalytics=true

// Response
{
  "success": true,
  "data": {
    "applications": [
      {
        "id": "app_123",
        "jobId": "job_456",
        "jobTitle": "Senior Software Engineer",
        "company": "Tech Corp",
        "status": "reviewing",
        "appliedAt": "2025-01-01T10:00:00Z",
        "updatedAt": "2025-01-02T15:30:00Z",
        "matchScore": 85,
        "aiScore": {
          "overallScore": 88,
          "skillAlignment": 92,
          "experienceMatch": 85,
          "companyCultureFit": 80
        },
        "analytics": {
          "views": 15,
          "responseTime": 48,
          "successProbability": 0.75
        }
      }
    ],
    "total": 45,
    "page": 1,
    "pageSize": 10,
    "totalPages": 5,
    "hasMore": true,
    "lastUpdated": "2025-01-07T12:30:00Z"
  }
}
```

#### GET /api/applications/[id]
Get detailed information about a specific application.

**Request:**
```typescript
interface GetApplicationRequest {
  params: {
    id: string;
  };
  query?: {
    includeTimeline?: boolean;
    includeNotes?: boolean;
    includeAnalytics?: boolean;
    includeRecommendations?: boolean;
  };
}
```

**Response:**
```typescript
interface GetApplicationResponse {
  success: boolean;
  data: {
    application: ApplicationDetails;
    timeline: TimelineEvent[];
    notes: ApplicationNote[];
    analytics: ApplicationAnalytics;
    recommendations: ApplicationRecommendation[];
    relatedApplications: Application[];
  };
  meta: {
    requestId: string;
    timestamp: string;
    processingTime: number;
  };
}
```

#### POST /api/applications
Create a new application.

**Request:**
```typescript
interface CreateApplicationRequest {
  jobId: string;
  resumeId?: string;
  coverLetter?: string;
  customAnswers?: Record<string, string>;
  source?: 'job_board' | 'company_website' | 'referral' | 'other';
  referralCode?: string;
  notes?: string;
}
```

**Response:**
```typescript
interface CreateApplicationResponse {
  success: boolean;
  data: {
    application: Application;
    matchScore?: number;
    aiScore?: ApplicationScore;
    recommendations?: string[];
  };
  meta: {
    requestId: string;
    timestamp: string;
    processingTime: number;
  };
}
```

#### PUT /api/applications/[id]
Update an existing application.

**Request:**
```typescript
interface UpdateApplicationRequest {
  params: {
    id: string;
  };
  body: {
    coverLetter?: string;
    customAnswers?: Record<string, string>;
    notes?: string;
    tags?: string[];
    priority?: 'low' | 'medium' | 'high';
  };
}
```

**Response:**
```typescript
interface UpdateApplicationResponse {
  success: boolean;
  data: {
    application: Application;
    updatedFields: string[];
  };
  meta: {
    requestId: string;
    timestamp: string;
    processingTime: number;
  };
}
```

#### DELETE /api/applications/[id]
Withdraw or delete an application.

**Request:**
```typescript
interface DeleteApplicationRequest {
  params: {
    id: string;
  };
  body: {
    reason: string;
    feedback?: string;
    notifyCompany?: boolean;
    anonymousFeedback?: boolean;
  };
}
```

**Response:**
```typescript
interface DeleteApplicationResponse {
  success: boolean;
  data: {
    deleted: boolean;
    withdrawn: boolean;
    message: string;
  };
  meta: {
    requestId: string;
    timestamp: string;
    processingTime: number;
  };
}
```

### Application Notes Endpoints

#### GET /api/applications/[id]/notes
Get all notes for a specific application.

**Request:**
```typescript
interface GetApplicationNotesRequest {
  params: {
    id: string;
  };
  query?: {
    limit?: number;
    offset?: number;
    sortBy?: 'created_at' | 'updated_at';
    sortOrder?: 'asc' | 'desc';
  };
}
```

**Response:**
```typescript
interface GetApplicationNotesResponse {
  success: boolean;
  data: {
    notes: ApplicationNote[];
    total: number;
  };
  meta: {
    requestId: string;
    timestamp: string;
    processingTime: number;
  };
}
```

#### POST /api/applications/[id]/notes
Add a new note to an application.

**Request:**
```typescript
interface CreateApplicationNoteRequest {
  params: {
    id: string;
  };
  body: {
    content: string;
    type: 'note' | 'reminder' | 'follow_up';
    reminderDate?: string;  // ISO date string
    tags?: string[];
    priority?: 'low' | 'medium' | 'high';
  };
}
```

**Response:**
```typescript
interface CreateApplicationNoteResponse {
  success: boolean;
  data: {
    note: ApplicationNote;
  };
  meta: {
    requestId: string;
    timestamp: string;
    processingTime: number;
  };
}
```

#### PUT /api/applications/[id]/notes/[noteId]
Update an existing note.

**Request:**
```typescript
interface UpdateApplicationNoteRequest {
  params: {
    id: string;
    noteId: string;
  };
  body: {
    content?: string;
    reminderDate?: string;
    tags?: string[];
    priority?: 'low' | 'medium' | 'high';
    completed?: boolean;
  };
}
```

**Response:**
```typescript
interface UpdateApplicationNoteResponse {
  success: boolean;
  data: {
    note: ApplicationNote;
  };
  meta: {
    requestId: string;
    timestamp: string;
    processingTime: number;
  };
}
```

#### DELETE /api/applications/[id]/notes/[noteId]
Delete a note.

**Request:**
```typescript
interface DeleteApplicationNoteRequest {
  params: {
    id: string;
    noteId: string;
  };
}
```

**Response:**
```typescript
interface DeleteApplicationNoteResponse {
  success: boolean;
  data: {
    deleted: boolean;
  };
  meta: {
    requestId: string;
    timestamp: string;
    processingTime: number;
  };
}
```

### Application Analytics Endpoints

#### GET /api/applications/analytics/summary
Get analytics summary for user's applications.

**Request:**
```typescript
interface GetApplicationAnalyticsRequest {
  query?: {
    timeRange?: '7d' | '30d' | '90d' | '1y';
    includeBenchmarks?: boolean;
    includePredictions?: boolean;
  };
}
```

**Response:**
```typescript
interface GetApplicationAnalyticsResponse {
  success: boolean;
  data: {
    summary: ApplicationAnalyticsSummary;
    trends: ApplicationTrends[];
    benchmarks: IndustryBenchmarks;
    predictions: ApplicationPredictions;
    insights: ApplicationInsight[];
  };
  meta: {
    requestId: string;
    timestamp: string;
    processingTime: number;
  };
}
```

#### GET /api/applications/[id]/analytics
Get detailed analytics for a specific application.

**Response:**
```typescript
interface GetApplicationAnalyticsResponse {
  success: boolean;
  data: {
    analytics: ApplicationAnalytics;
    companyAnalytics: CompanyAnalytics;
    marketAnalytics: MarketAnalytics;
    recommendations: AnalyticsRecommendation[];
  };
  meta: {
    requestId: string;
    timestamp: string;
    processingTime: number;
  };
}
```

### Application Status Endpoints

#### PUT /api/applications/[id]/status
Update application status.

**Request:**
```typescript
interface UpdateApplicationStatusRequest {
  params: {
    id: string;
  };
  body: {
    status: ApplicationStatus;
    reason?: string;
    internalNotes?: string;
    notifyUser?: boolean;
    scheduledDate?: string;  // For interviews
    location?: string;        // For interviews
  };
}
```

**Response:**
```typescript
interface UpdateApplicationStatusResponse {
  success: boolean;
  data: {
    application: Application;
    statusChange: StatusChange;
    nextSteps?: NextStep[];
  };
  meta: {
    requestId: string;
    timestamp: string;
    processingTime: number;
  };
}
```

### Bulk Operations Endpoints

#### POST /api/applications/bulk
Perform bulk operations on multiple applications.

**Request:**
```typescript
interface BulkApplicationOperationRequest {
  operation: 'update_status' | 'add_notes' | 'archive' | 'unarchive' | 'delete';
  applicationIds: string[];
  data: {
    status?: ApplicationStatus;
    note?: string;
    tags?: string[];
    reason?: string;
  };
}
```

**Response:**
```typescript
interface BulkApplicationOperationResponse {
  success: boolean;
  data: {
    successful: string[];
    failed: {
      applicationId: string;
      error: string;
    }[];
    totalProcessed: number;
    totalSuccessful: number;
    totalFailed: number;
  };
  meta: {
    requestId: string;
    timestamp: string;
    processingTime: number;
  };
}
```

### Export Endpoints

#### GET /api/applications/export
Export applications data.

**Request:**
```typescript
interface ExportApplicationsRequest {
  query?: {
    format?: 'csv' | 'xlsx' | 'json';
    filters?: ApplicationFilters;
    includeAnalytics?: boolean;
    includeNotes?: boolean;
    dateRange?: {
      from: string;
      to: string;
    };
  };
}
```

**Response:**
```typescript
// File download response
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="applications.xlsx"

// Or JSON response
{
  "success": true,
  "data": {
    downloadUrl: string;
    expiresAt: string;
    fileSize: number;
  };
}
```

## WebSocket Events

### Connection Management

#### Connect to Application Updates
```typescript
// Client connection
const socket = io('/applications', {
  auth: {
    token: 'jwt_token_here'
  }
});

// Connection events
socket.on('connect', () => {
  console.log('Connected to application updates');
});

socket.on('disconnect', () => {
  console.log('Disconnected from application updates');
});
```

### Application Update Events

#### Application Status Changed
```typescript
// Server event
socket.emit('application:status_changed', {
  applicationId: 'app_123',
  userId: 'user_456',
  oldStatus: 'applied',
  newStatus: 'reviewing',
  timestamp: '2025-01-07T12:30:00Z',
  metadata: {
    reviewer: 'John Doe',
    department: 'Engineering'
  }
});

// Client listener
socket.on('application:status_changed', (event) => {
  console.log('Application status changed:', event);
  // Update UI with new status
});
```

#### Application Note Added
```typescript
// Server event
socket.emit('application:note_added', {
  applicationId: 'app_123',
  userId: 'user_456',
  note: {
    id: 'note_789',
    content: 'Follow up next week',
    type: 'reminder',
    reminderDate: '2025-01-14T09:00:00Z',
    createdAt: '2025-01-07T12:30:00Z'
  },
  timestamp: '2025-01-07T12:30:00Z'
});

// Client listener
socket.on('application:note_added', (event) => {
  console.log('Note added:', event);
  // Update notes section
});
```

#### Application Analytics Updated
```typescript
// Server event
socket.emit('application:analytics_updated', {
  applicationId: 'app_123',
  userId: 'user_456',
  analytics: {
    views: 20,
    responseTime: 48,
    successProbability: 0.85,
    trendScore: 0.92
  },
  timestamp: '2025-01-07T12:30:00Z'
});

// Client listener
socket.on('application:analytics_updated', (event) => {
  console.log('Analytics updated:', event);
  // Update analytics display
});
```

#### Application Reminder
```typescript
// Server event
socket.emit('application:reminder', {
  applicationId: 'app_123',
  userId: 'user_456',
  reminder: {
    id: 'reminder_456',
    type: 'follow_up',
    message: 'Time to follow up on your application',
    scheduledDate: '2025-01-10T09:00:00Z',
    priority: 'high'
  },
  timestamp: '2025-01-07T12:30:00Z'
});

// Client listener
socket.on('application:reminder', (event) => {
  console.log('Reminder:', event);
  // Show notification
});
```

## Real-time APIs

### Server-Sent Events

#### Application Status Stream
```typescript
// Client SSE connection
const eventSource = new EventSource('/api/applications/status-stream', {
  headers: {
    'Authorization': 'Bearer jwt_token_here'
  }
});

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Status update:', data);
  // Update application status
};

eventSource.onerror = (error) => {
  console.error('SSE error:', error);
};
```

#### Analytics Stream
```typescript
// Client SSE connection for analytics
const analyticsStream = new EventSource('/api/applications/analytics-stream', {
  headers: {
    'Authorization': 'Bearer jwt_token_here'
  }
});

analyticsStream.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Analytics update:', data);
  // Update analytics display
};
```

## Integration APIs

### Calendar Integration

#### POST /api/applications/[id]/calendar
Add application to calendar.

**Request:**
```typescript
interface AddToCalendarRequest {
  params: {
    id: string;
  };
  body: {
    provider: 'google' | 'outlook' | 'apple';
    title: string;
    description?: string;
    startTime: string;        // ISO date string
    endTime?: string;          // ISO date string
    reminders?: {
      method: 'email' | 'popup' | 'sms';
      minutesBefore: number;
    }[];
  };
}
```

**Response:**
```typescript
interface AddToCalendarResponse {
  success: boolean;
  data: {
    eventId: string;
    calendarUrl: string;
    provider: string;
  };
  meta: {
    requestId: string;
    timestamp: string;
    processingTime: number;
  };
}
```

### Email Integration

#### POST /api/applications/[id]/email
Send email related to application.

**Request:**
```typescript
interface SendApplicationEmailRequest {
  params: {
    id: string;
  };
  body: {
    type: 'follow_up' | 'thank_you' | 'inquiry' | 'withdrawal';
    recipient: string;
    subject: string;
    content: string;
    template?: string;
    variables?: Record<string, string>;
    attachments?: {
      name: string;
      content: string;
      type: string;
    }[];
  };
}
```

**Response:**
```typescript
interface SendApplicationEmailResponse {
  success: boolean;
  data: {
    messageId: string;
    status: 'sent' | 'scheduled' | 'failed';
    sentAt?: string;
    scheduledAt?: string;
  };
  meta: {
    requestId: string;
    timestamp: string;
    processingTime: number;
  };
}
```

### LinkedIn Integration

#### POST /api/applications/[id]/linkedin-share
Share application success to LinkedIn.

**Request:**
```typescript
interface ShareToLinkedInRequest {
  params: {
    id: string;
  };
  body: {
    message: string;
    visibility: 'public' | 'connections' | 'private';
    includeJobDetails?: boolean;
    includeCompanyDetails?: boolean;
  };
}
```

**Response:**
```typescript
interface ShareToLinkedInResponse {
  success: boolean;
  data: {
    postId: string;
    postUrl: string;
    visibility: string;
  };
  meta: {
    requestId: string;
    timestamp: string;
    processingTime: number;
  };
}
```

## Error Handling

### Error Response Format
```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    field?: string;
    timestamp: string;
    requestId: string;
  };
  meta: {
    timestamp: string;
    requestId: string;
    processingTime: number;
  };
}
```

### Error Codes
- `APPLICATION_NOT_FOUND`: Application not found
- `UNAUTHORIZED`: User not authorized to access application
- `INVALID_STATUS`: Invalid application status
- `RATE_LIMIT_EXCEEDED`: Rate limit exceeded
- `VALIDATION_ERROR`: Request validation failed
- `INTERNAL_ERROR`: Internal server error
- `WEBSOCKET_ERROR`: WebSocket connection error
- `INTEGRATION_ERROR`: Third-party integration error

### Error Handling Example
```typescript
// Application not found error
{
  "success": false,
  "error": {
    "code": "APPLICATION_NOT_FOUND",
    "message": "Application with ID 'app_123' not found",
    "timestamp": "2025-01-07T12:30:00Z",
    "requestId": "req_456"
  }
}

// Validation error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "field": "status",
      "value": "invalid_status",
      "allowedValues": ["applied", "reviewing", "interview_scheduled", "shortlisted", "rejected", "hired"]
    },
    "timestamp": "2025-01-07T12:30:00Z",
    "requestId": "req_789"
  }
}
```

## Security Considerations

### Authentication
- JWT token validation
- User authorization checks
- Application ownership verification

### Rate Limiting
- Per-user rate limiting
- Per-endpoint rate limiting
- WebSocket message rate limiting

### Data Privacy
- Encrypted data transmission
- Sensitive data masking
- Audit logging

### Input Validation
- Request parameter validation
- File upload validation
- XSS protection
- SQL injection prevention

## Testing

### Unit Tests
- Test each endpoint individually
- Mock external dependencies
- Test error handling
- Test authentication

### Integration Tests
- Test endpoint interactions
- Test database operations
- Test WebSocket events
- Test third-party integrations

### E2E Tests
- Test complete user workflows
- Test real-time updates
- Test error scenarios
- Test performance

## Conclusion

The Applications Management API provides comprehensive functionality for managing job applications with real-time updates, AI-powered insights, and third-party integrations. The API follows RESTful principles while leveraging WebSocket for real-time communication and event-driven architecture for scalability.

The API is designed with security, performance, and scalability in mind, ensuring that it can handle the expected load while providing a responsive and reliable experience for users.

---

**Next Steps**: Implement the API endpoints following the specifications, starting with core application endpoints and then adding real-time features and integrations.