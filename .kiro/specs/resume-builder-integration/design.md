# Resume Builder Integration - Design

## Architecture Overview

The Resume Builder Integration follows a microservices architecture with clear separation of concerns:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend UI   │    │  Resume API     │    │  OpenAI Service │
│                 │◄──►│                 │◄──►│                 │
│ - Upload        │    │ - Parse         │    │ - Analysis      │
│ - Templates     │    │ - Analyze       │    │ - Suggestions   │
│ - Editor        │    │ - Generate      │    │ - Scoring       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  File Storage   │    │   Database      │    │  Cache Layer    │
│                 │    │                 │    │                 │
│ - Resume Files  │    │ - User Data     │    │ - AI Responses  │
│ - Templates     │    │ - Analysis      │    │ - Templates     │
│ - Exports       │    │ - Metadata      │    │ - Parsed Data   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Component Design

### 1. Resume Upload Component
**Location:** `src/components/resume/ResumeUpload.tsx`

```typescript
interface ResumeUploadProps {
  onUploadComplete: (fileId: string) => void;
  maxFileSize: number;
  acceptedFormats: string[];
}

interface UploadState {
  uploading: boolean;
  progress: number;
  error: string | null;
}
```

**Features:**
- Drag-and-drop file upload
- Progress indicator
- File validation
- Error handling

### 2. Resume Parser Service
**Location:** `src/services/resume-parser.ts`

```typescript
interface ParsedResume {
  personalInfo: PersonalInfo;
  workExperience: WorkExperience[];
  education: Education[];
  skills: string[];
  certifications: Certification[];
  metadata: ResumeMetadata;
}

class ResumeParserService {
  async parseResume(fileBuffer: Buffer, mimeType: string): Promise<ParsedResume>;
  async extractText(fileBuffer: Buffer, mimeType: string): Promise<string>;
  private validateParsedData(data: any): ParsedResume;
}
```

### 3. AI Analysis Service
**Location:** `src/services/ai-analysis.ts`

```typescript
interface AnalysisResult {
  atsScore: number;
  suggestions: Suggestion[];
  keywordAnalysis: KeywordAnalysis;
  improvements: Improvement[];
}

class AIAnalysisService {
  async analyzeResume(parsedResume: ParsedResume): Promise<AnalysisResult>;
  async generateSuggestions(content: string): Promise<Suggestion[]>;
  async calculateATSScore(resume: ParsedResume): Promise<number>;
  private buildPrompt(resume: ParsedResume): string;
}
```

### 4. Template Engine
**Location:** `src/components/resume/TemplateEngine.tsx`

```typescript
interface Template {
  id: string;
  name: string;
  category: string;
  preview: string;
  structure: TemplateStructure;
}

interface TemplateEngineProps {
  selectedTemplate: Template;
  resumeData: ParsedResume;
  onTemplateChange: (templateId: string) => void;
}
```

## Data Models

### Resume Data Model
```typescript
interface Resume {
  id: string;
  userId: string;
  filename: string;
  originalContent: string;
  parsedData: ParsedResume;
  analysisResults: AnalysisResult[];
  templateId?: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'uploading' | 'parsing' | 'analyzing' | 'complete' | 'error';
}
```

### Analysis Data Model
```typescript
interface Analysis {
  id: string;
  resumeId: string;
  type: 'ats_score' | 'suggestions' | 'keywords';
  results: any;
  aiModel: string;
  tokensUsed: number;
  createdAt: Date;
}
```

## API Endpoints

### Resume Management
```
POST   /api/resume/upload          - Upload resume file
GET    /api/resume/:id             - Get resume details
PUT    /api/resume/:id             - Update resume
DELETE /api/resume/:id             - Delete resume
GET    /api/resume/user/:userId    - Get user's resumes
```

### Analysis Endpoints
```
POST   /api/resume/:id/analyze     - Trigger AI analysis
GET    /api/resume/:id/analysis    - Get analysis results
POST   /api/resume/:id/suggestions - Get improvement suggestions
GET    /api/resume/:id/ats-score   - Get ATS compatibility score
```

### Template Endpoints
```
GET    /api/templates              - Get available templates
GET    /api/templates/:id          - Get specific template
POST   /api/resume/:id/apply-template - Apply template to resume
POST   /api/resume/:id/export      - Export resume with template
```

## Database Schema

### Resumes Table
```sql
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  original_content TEXT,
  parsed_data JSONB,
  template_id VARCHAR(50),
  status VARCHAR(20) DEFAULT 'uploading',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Analyses Table
```sql
CREATE TABLE resume_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID NOT NULL REFERENCES resumes(id),
  analysis_type VARCHAR(50) NOT NULL,
  results JSONB NOT NULL,
  ai_model VARCHAR(50),
  tokens_used INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Security Considerations

### File Upload Security
- Virus scanning for uploaded files
- File type validation
- Size limits enforcement
- Secure temporary storage

### Data Privacy
- Encryption at rest for resume content
- Secure deletion of temporary files
- User consent for AI processing
- GDPR compliance measures

### API Security
- Rate limiting on analysis endpoints
- Authentication required for all operations
- Input validation and sanitization
- Audit logging for sensitive operations

## Performance Optimization

### Caching Strategy
- Redis cache for parsed resume data
- Template caching for faster rendering
- AI response caching for similar content
- CDN for template assets

### Async Processing
- Background job queue for file processing
- WebSocket updates for real-time progress
- Batch processing for multiple resumes
- Graceful degradation for API failures

## Error Handling

### File Processing Errors
```typescript
enum ResumeError {
  INVALID_FORMAT = 'INVALID_FORMAT',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  PARSING_FAILED = 'PARSING_FAILED',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  TEMPLATE_ERROR = 'TEMPLATE_ERROR'
}
```

### Recovery Mechanisms
- Automatic retry for transient failures
- Fallback to basic parsing if AI fails
- User notification for permanent failures
- Manual intervention queue for complex cases

## Integration Points

### OpenAI API Integration
```typescript
interface OpenAIConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

class OpenAIService {
  async analyzeResume(content: string): Promise<AnalysisResult>;
  async generateSuggestions(prompt: string): Promise<string[]>;
  private handleRateLimit(): Promise<void>;
  private validateResponse(response: any): boolean;
}
```

### File Storage Integration
- Integration with existing document storage
- Secure file cleanup policies
- Version control for resume iterations
- Backup and recovery procedures