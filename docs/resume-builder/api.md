# Resume Builder API Documentation

## Overview

The Resume Builder API provides comprehensive functionality for resume parsing, AI analysis, template management, and export capabilities. This document outlines all available endpoints, request/response formats, and usage examples.

## Base URL

```
https://jobfinders.com/api/resume-builder
```

## Authentication

All API endpoints require authentication using NextAuth.js session cookies. The user must be logged in to access the Resume Builder functionality.

### Required Headers

```
Content-Type: application/json
Authorization: Bearer <session_token> (if using API tokens)
```

## API Endpoints

### 1. Resume Upload and Management

#### POST /upload

Upload a resume file for processing.

**Request:**
- Method: POST
- Content-Type: multipart/form-data

**Form Data:**
- `file`: Resume file (PDF, DOC, DOCX, TXT)
- `isPrimary`: boolean (optional, default: false)

**Response (201):**
```json
{
  "success": true,
  "data": {
    "resumeId": "resume_123",
    "filename": "john_doe_resume.pdf",
    "status": "uploading",
    "uploadedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_FILE_TYPE",
    "message": "Only PDF, DOC, DOCX, and TXT files are supported"
  }
}
```

#### GET /{resumeId}

Retrieve resume details and analysis results.

**Parameters:**
- `resumeId`: string (path parameter)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "resumeId": "resume_123",
    "filename": "john_doe_resume.pdf",
    "status": "complete",
    "parsedData": {
      "personalInfo": {
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+1-555-0123"
      },
      "experience": [...],
      "education": [...],
      "skills": [...]
    },
    "analysis": {
      "atsScore": 85,
      "suggestions": [...],
      "keywordAnalysis": {...}
    },
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:35:00Z"
  }
}
```

#### PUT /{resumeId}

Update resume information.

**Request Body:**
```json
{
  "personalInfo": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1-555-0123",
    "location": "New York, NY"
  },
  "professionalSummary": "Experienced software developer...",
  "skills": ["JavaScript", "React", "Node.js"],
  "isPrimary": true
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "resumeId": "resume_123",
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}
```

#### DELETE /{resumeId}

Delete a resume and all associated data.

**Response (200):**
```json
{
  "success": true,
  "message": "Resume deleted successfully"
}
```

#### GET /user/{userId}

Get all resumes for a user.

**Parameters:**
- `userId`: string (path parameter)
- `page`: number (optional, default: 1)
- `limit`: number (optional, default: 20)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "resumes": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

### 2. Resume Analysis

#### POST /{resumeId}/analyze

Trigger AI analysis of a resume.

**Request Body:**
```json
{
  "analysisType": "full", // "full" | "ats" | "keywords" | "suggestions"
  "options": {
    "industry": "technology",
    "experienceLevel": "senior",
    "targetRole": "software-engineer"
  }
}
```

**Response (202):**
```json
{
  "success": true,
  "data": {
    "analysisId": "analysis_456",
    "status": "processing",
    "estimatedTime": 30
  }
}
```

#### GET /{resumeId}/analysis

Get analysis results for a resume.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "analysisId": "analysis_456",
    "atsScore": 85,
    "breakdown": {
      "skills": 90,
      "experience": 80,
      "education": 75,
      "keywords": 85,
      "formatting": 95
    },
    "suggestions": [
      {
        "type": "keyword",
        "priority": "high",
        "text": "Add more technical keywords like 'microservices' and 'Docker'"
      },
      {
        "type": "format",
        "priority": "medium",
        "text": "Consider using a more standard resume format"
      }
    ],
    "keywordAnalysis": {
      "found": ["JavaScript", "React", "Node.js"],
      "missing": ["Python", "AWS", "Docker"],
      "density": {
        "JavaScript": 2.5,
        "React": 2.1,
        "Node.js": 1.8
      }
    },
    "improvements": [
      "Add quantifiable achievements",
      "Include more technical details",
      "Improve formatting consistency"
    ]
  }
}
```

#### POST /{resumeId}/suggestions

Get AI-powered suggestions for improving the resume.

**Request Body:**
```json
{
  "section": "summary", // "summary" | "experience" | "skills" | "all"
  "context": "I want to highlight my leadership experience"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "original": "Led a team of developers",
        "improved": "Led a cross-functional team of 8 developers, resulting in 30% increase in productivity",
        "reason": "Added quantifiable metrics and specific details"
      }
    ]
  }
}
```

#### GET /{resumeId}/ats-score

Get ATS compatibility score for a resume.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "overallScore": 85,
    "categoryScores": {
      "formatCompatibility": 95,
      "keywordOptimization": 80,
      "readability": 90,
      "completeness": 75
    },
    "recommendations": [
      "Add more industry-specific keywords",
      "Include more quantifiable achievements"
    ],
    "compatibleSystems": [
      "Applicant Tracking Systems",
      "Resume Parsing Software",
      "HR Management Systems"
    ]
  }
}
```

### 3. Template Management

#### GET /templates

Get available resume templates.

**Query Parameters:**
- `category`: string (optional) - Filter by category
- `industry`: string (optional) - Filter by industry
- `format`: string (optional) - Filter by format

**Response (200):**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "professional-modern",
        "name": "Professional Modern",
        "category": "professional",
        "industry": "general",
        "preview": "https://cdn.jobfinders.com/templates/professional-modern-preview.jpg",
        "features": [
          "Clean layout",
          "Professional typography",
          "Skills section"
        ],
        "formats": ["pdf", "docx"]
      }
    ]
  }
}
```

#### GET /templates/{templateId}

Get details for a specific template.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "professional-modern",
    "name": "Professional Modern",
    "description": "Clean and professional template suitable for most industries",
    "category": "professional",
    "preview": "https://cdn.jobfinders.com/templates/professional-modern-preview.jpg",
    "structure": {
      "sections": [
        {
          "id": "header",
          "type": "personal-info",
          "required": true
        },
        {
          "id": "summary",
          "type": "professional-summary",
          "required": false
        }
      ]
    },
    "customization": {
      "colors": ["#000000", "#1e40af", "#dc2626"],
      "fonts": ["Inter", "Roboto", "Open Sans"],
      "layouts": ["single-column", "two-column"]
    }
  }
}
```

#### POST /{resumeId}/apply-template

Apply a template to a resume.

**Request Body:**
```json
{
  "templateId": "professional-modern",
  "customization": {
    "color": "#1e40af",
    "font": "Inter",
    "layout": "single-column",
    "sections": {
      "include": ["header", "summary", "experience", "education", "skills"],
      "exclude": [],
      "order": ["header", "summary", "experience", "education", "skills"]
    }
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "previewUrl": "https://cdn.jobfinders.com/previews/resume_123_template_preview.jpg",
    "templateId": "professional-modern",
    "appliedAt": "2024-01-15T12:00:00Z"
  }
}
```

### 4. Export and Download

#### POST /{resumeId}/export

Export a resume in specified format.

**Request Body:**
```json
{
  "format": "pdf", // "pdf" | "docx" | "html"
  "templateId": "professional-modern",
  "options": {
    "quality": "high", // "standard" | "high" | "print"
    "includePhoto": false,
    "watermark": false
  }
}
```

**Response (202):**
```json
{
  "success": true,
  "data": {
    "exportId": "export_789",
    "status": "processing",
    "estimatedTime": 15
  }
}
```

#### GET /{resumeId}/export/{exportId}/download

Download an exported resume.

**Response (200):**
- Binary file download with appropriate Content-Type header

#### GET /{resumeId}/preview

Get a preview image of the resume.

**Query Parameters:**
- `templateId`: string (optional)
- `page`: number (optional, default: 1)

**Response (200):**
- PNG image file

### 5. Batch Operations

#### POST /batch

Process multiple resumes in batch.

**Request Body:**
```json
{
  "resumeIds": ["resume_123", "resume_456", "resume_789"],
  "operation": "analyze", // "analyze" | "export" | "apply-template"
  "options": {
    "analysisType": "full",
    "industry": "technology"
  }
}
```

**Response (202):**
```json
{
  "success": true,
  "data": {
    "batchId": "batch_456",
    "status": "processing",
    "totalResumes": 3,
    "estimatedTime": 90
  }
}
```

#### GET /batch/{batchId}/status

Get status of batch operation.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "batchId": "batch_456",
    "status": "completed", // "processing" | "completed" | "failed"
    "progress": {
      "total": 3,
      "completed": 3,
      "failed": 0
    },
    "results": [...],
    "completedAt": "2024-01-15T13:00:00Z"
  }
}
```

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "additional error context"
    }
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | User not authenticated |
| `FORBIDDEN` | 403 | User doesn't have permission |
| `NOT_FOUND` | 404 | Resource not found |
| `INVALID_FILE_TYPE` | 400 | Unsupported file type |
| `FILE_TOO_LARGE` | 413 | File exceeds size limit |
| `RATE_LIMITED` | 429 | Too many requests |
| `AI_SERVICE_ERROR` | 503 | AI service temporarily unavailable |
| `PROCESSING_ERROR` | 500 | Error during file processing |
| `QUOTA_EXCEEDED` | 402 | User quota exceeded |

## Rate Limiting

The API implements rate limiting to ensure fair usage:

- **Upload endpoints**: 10 requests per minute
- **Analysis endpoints**: 20 requests per minute
- **Export endpoints**: 5 requests per minute
- **Other endpoints**: 100 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642234567
```

## Quotas

User quotas are enforced based on subscription level:

### Free Tier
- 5 resume uploads per month
- 10 AI analyses per month
- 3 template exports per month
- 3 templates available

### Premium Tier
- 100 resume uploads per month
- 500 AI analyses per month
- 100 template exports per month
- All templates available

## SDK and Client Libraries

### JavaScript/TypeScript

```bash
npm install @jobfinders/resume-builder-client
```

```javascript
import { ResumeBuilderClient } from '@jobfinders/resume-builder-client';

const client = new ResumeBuilderClient({
  baseUrl: 'https://jobfinders.com/api/resume-builder',
  authToken: 'your-auth-token'
});

// Upload a resume
const result = await client.uploadResume(file);

// Get analysis
const analysis = await client.getAnalysis(resumeId);

// Apply template
const preview = await client.applyTemplate(resumeId, templateId, options);
```

### Python

```bash
pip install jobfinders-resume-builder
```

```python
from jobfinders_resume_builder import ResumeBuilderClient

client = ResumeBuilderClient(
    base_url='https://jobfinders.com/api/resume-builder',
    auth_token='your-auth-token'
)

# Upload a resume
result = client.upload_resume(file_path)

# Get analysis
analysis = client.get_analysis(resume_id)

# Apply template
preview = client.apply_template(resume_id, template_id, options)
```

## Webhooks

Resume Builder supports webhooks for real-time notifications:

### Configure Webhook

```javascript
POST /api/webhooks
{
  "url": "https://your-app.com/webhooks/resume-updates",
  "events": ["analysis.completed", "export.completed"],
  "secret": "your-webhook-secret"
}
```

### Webhook Payload

```json
{
  "event": "analysis.completed",
  "timestamp": "2024-01-15T13:00:00Z",
  "data": {
    "resumeId": "resume_123",
    "analysisId": "analysis_456",
    "userId": "user_789"
  },
  "signature": "sha256=..."
}
```

Verify webhook signature:
```javascript
import crypto from 'crypto';

const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(JSON.stringify(payload))
  .digest('hex');
```

## Support

For API support and questions:
- Documentation: https://docs.jobfinders.com
- Support email: api-support@jobfinders.com
- Status page: https://status.jobfinders.com