# ATS System Development - Design

## Architecture Overview

The ATS System follows a microservices architecture with event-driven communication:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   ATS Frontend  │    │  ATS Core API   │    │  Scoring Engine │
│                 │◄──►│                 │◄──►│                 │
│ - Dashboard     │    │ - Applications  │    │ - Algorithm     │
│ - Analytics     │    │ - Jobs          │    │ - ML Models     │
│ - Reports       │    │ - Candidates    │    │ - Bias Check    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Keyword Service │    │  Parser Service │    │ Compliance Svc  │
│                 │    │                 │    │                 │
│ - Extraction    │    │ - Industry      │    │ - EEOC Check    │
│ - Analysis      │    │ - Formats       │    │ - Audit Trail   │
│ - Weighting     │    │ - Validation    │    │ - Bias Monitor  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Event Bus     │    │   Database      │    │  Cache Layer    │
│                 │    │                 │    │                 │
│ - Job Events    │    │ - Applications  │    │ - Scores        │
│ - Score Events  │    │ - Analysis      │    │ - Keywords      │
│ - Audit Events  │    │ - Audit Logs    │    │ - Models        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Component Design

### 1. ATS Core Service
**Location:** `src/services/ats/core-service.ts`

```typescript
interface ATSApplication {
  id: string;
  jobId: string;
  candidateId: string;
  resumeData: ParsedResume;
  score: ATSScore;
  status: ApplicationStatus;
  submittedAt: Date;
  lastAnalyzed: Date;
}

class ATSCoreService {
  async processApplication(application: ATSApplication): Promise<void>;
  async scoreApplication(applicationId: string): Promise<ATSScore>;
  async getApplicationsByJob(jobId: string): Promise<ATSApplication[]>;
  async updateApplicationStatus(id: string, status: ApplicationStatus): Promise<void>;
}
```

### 2. Keyword Extraction Service
**Location:** `src/services/ats/keyword-service.ts`

```typescript
interface KeywordAnalysis {
  keywords: ExtractedKeyword[];
  density: KeywordDensity;
  relevanceScore: number;
  industryMatch: number;
}

interface ExtractedKeyword {
  term: string;
  weight: number;
  category: 'skill' | 'experience' | 'education' | 'certification';
  frequency: number;
  context: string[];
}

class KeywordService {
  async extractFromJobDescription(jobDescription: string): Promise<KeywordAnalysis>;
  async extractFromResume(resumeText: string): Promise<KeywordAnalysis>;
  async compareKeywords(jobKeywords: KeywordAnalysis, resumeKeywords: KeywordAnalysis): Promise<number>;
  private weightKeywordsByIndustry(keywords: ExtractedKeyword[], industry: string): ExtractedKeyword[];
}
```

### 3. Scoring Engine
**Location:** `src/services/ats/scoring-engine.ts`

```typescript
interface ATSScore {
  overall: number;
  breakdown: ScoreBreakdown;
  explanation: string[];
  recommendations: string[];
  biasCheck: BiasCheckResult;
}

interface ScoreBreakdown {
  keywordMatch: number;
  experienceRelevance: number;
  educationMatch: number;
  skillsAlignment: number;
  additionalFactors: number;
}

class ScoringEngine {
  async calculateScore(application: ATSApplication, jobRequirements: JobRequirements): Promise<ATSScore>;
  async batchScore(applications: ATSApplication[], jobId: string): Promise<ATSScore[]>;
  private applyIndustryWeights(baseScore: number, industry: string): number;
  private checkForBias(score: ATSScore, candidateData: any): BiasCheckResult;
}
```

### 4. Industry Parser Service
**Location:** `src/services/ats/industry-parser.ts`

```typescript
interface IndustryConfig {
  id: string;
  name: string;
  keywordDictionary: string[];
  requiredCertifications: string[];
  scoringWeights: ScoringWeights;
  complianceRules: ComplianceRule[];
}

class IndustryParserService {
  async parseForIndustry(resumeText: string, industry: string): Promise<IndustryParseResult>;
  async detectIndustry(resumeText: string): Promise<string>;
  async validateCertifications(certifications: string[], industry: string): Promise<ValidationResult>;
  private loadIndustryConfig(industry: string): IndustryConfig;
}
```

## Data Models

### ATS Application Model
```typescript
interface ATSApplication {
  id: string;
  jobId: string;
  candidateId: string;
  resumeId: string;
  applicationData: {
    personalInfo: PersonalInfo;
    experience: WorkExperience[];
    education: Education[];
    skills: string[];
    certifications: Certification[];
  };
  analysisResults: {
    keywordAnalysis: KeywordAnalysis;
    score: ATSScore;
    industryMatch: IndustryMatchResult;
    complianceCheck: ComplianceResult;
  };
  metadata: {
    source: string;
    appliedAt: Date;
    lastUpdated: Date;
    processingStatus: 'pending' | 'analyzing' | 'scored' | 'reviewed' | 'archived';
  };
}
```

### Job Requirements Model
```typescript
interface JobRequirements {
  id: string;
  title: string;
  description: string;
  industry: string;
  requiredSkills: RequiredSkill[];
  preferredSkills: PreferredSkill[];
  experienceLevel: ExperienceLevel;
  educationRequirements: EducationRequirement[];
  certificationRequirements: CertificationRequirement[];
  scoringCriteria: ScoringCriteria;
}
```

## API Endpoints

### Application Management
```
POST   /api/ats/applications          - Submit new application
GET    /api/ats/applications/:id      - Get application details
PUT    /api/ats/applications/:id      - Update application
DELETE /api/ats/applications/:id      - Archive application
GET    /api/ats/jobs/:jobId/applications - Get applications for job
```

### Scoring and Analysis
```
POST   /api/ats/applications/:id/score     - Trigger scoring
GET    /api/ats/applications/:id/analysis  - Get analysis results
POST   /api/ats/jobs/:jobId/batch-score    - Batch score applications
GET    /api/ats/jobs/:jobId/rankings       - Get ranked candidates
```

### Keywords and Parsing
```
POST   /api/ats/keywords/extract           - Extract keywords from text
POST   /api/ats/keywords/compare           - Compare keyword sets
GET    /api/ats/industries                 - Get supported industries
POST   /api/ats/parse/industry/:industry   - Parse with industry rules
```

### Analytics and Reporting
```
GET    /api/ats/analytics/job/:jobId       - Job-specific analytics
GET    /api/ats/analytics/employer/:id     - Employer analytics
GET    /api/ats/reports/bias-check         - Bias analysis report
GET    /api/ats/reports/compliance         - Compliance report
```

## Database Schema

### ATS Applications Table
```sql
CREATE TABLE ats_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id),
  candidate_id UUID NOT NULL REFERENCES users(id),
  resume_id UUID REFERENCES resumes(id),
  application_data JSONB NOT NULL,
  analysis_results JSONB,
  overall_score DECIMAL(5,2),
  processing_status VARCHAR(20) DEFAULT 'pending',
  applied_at TIMESTAMP DEFAULT NOW(),
  last_analyzed TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Keyword Analysis Table
```sql
CREATE TABLE keyword_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES ats_applications(id),
  job_id UUID REFERENCES jobs(id),
  extracted_keywords JSONB NOT NULL,
  keyword_matches JSONB NOT NULL,
  relevance_score DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Industry Configurations Table
```sql
CREATE TABLE industry_configs (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  keyword_dictionary JSONB NOT NULL,
  scoring_weights JSONB NOT NULL,
  compliance_rules JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Audit Trail Table
```sql
CREATE TABLE ats_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES ats_applications(id),
  action VARCHAR(50) NOT NULL,
  actor_id UUID REFERENCES users(id),
  details JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

## Machine Learning Integration

### Scoring Model Pipeline
```typescript
interface MLModel {
  id: string;
  version: string;
  type: 'keyword_extraction' | 'scoring' | 'bias_detection';
  accuracy: number;
  lastTrained: Date;
}

class MLModelService {
  async loadModel(modelId: string): Promise<MLModel>;
  async predictScore(features: FeatureVector): Promise<number>;
  async detectBias(scoreData: ScoreData): Promise<BiasResult>;
  async retrainModel(trainingData: TrainingData[]): Promise<MLModel>;
}
```

### Feature Engineering
```typescript
interface FeatureVector {
  keywordMatchRatio: number;
  experienceYears: number;
  educationLevel: number;
  skillsCount: number;
  certificationCount: number;
  industryExperience: number;
  locationMatch: number;
}

class FeatureExtractor {
  async extractFeatures(application: ATSApplication, job: JobRequirements): Promise<FeatureVector>;
  private normalizeFeatures(features: FeatureVector): FeatureVector;
  private handleMissingValues(features: FeatureVector): FeatureVector;
}
```

## Compliance and Bias Detection

### Bias Detection System
```typescript
interface BiasCheckResult {
  overallRisk: 'low' | 'medium' | 'high';
  detectedBiases: DetectedBias[];
  recommendations: string[];
  auditTrail: AuditEntry[];
}

interface DetectedBias {
  type: 'gender' | 'age' | 'ethnicity' | 'education' | 'location';
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  explanation: string;
}

class BiasDetectionService {
  async checkForBias(scores: ATSScore[], demographics?: DemographicData[]): Promise<BiasCheckResult>;
  async generateFairnessReport(jobId: string): Promise<FairnessReport>;
  private analyzeScoreDistribution(scores: number[]): DistributionAnalysis;
}
```

### Compliance Monitoring
```typescript
interface ComplianceResult {
  isCompliant: boolean;
  violations: ComplianceViolation[];
  recommendations: string[];
  auditRequired: boolean;
}

class ComplianceService {
  async checkEEOCCompliance(application: ATSApplication): Promise<ComplianceResult>;
  async checkGDPRCompliance(dataProcessing: DataProcessingRecord): Promise<ComplianceResult>;
  async generateComplianceReport(timeRange: DateRange): Promise<ComplianceReport>;
}
```

## Performance Optimization

### Caching Strategy
```typescript
interface CacheConfig {
  keywordAnalysis: { ttl: 3600 }; // 1 hour
  industryConfigs: { ttl: 86400 }; // 24 hours
  mlModels: { ttl: 604800 }; // 1 week
  scores: { ttl: 1800 }; // 30 minutes
}

class ATSCacheService {
  async cacheScore(applicationId: string, score: ATSScore): Promise<void>;
  async getCachedScore(applicationId: string): Promise<ATSScore | null>;
  async invalidateJobCache(jobId: string): Promise<void>;
}
```

### Batch Processing
```typescript
interface BatchJob {
  id: string;
  type: 'score_applications' | 'extract_keywords' | 'bias_check';
  jobId: string;
  applicationIds: string[];
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  results?: any;
}

class BatchProcessor {
  async queueBatchJob(job: BatchJob): Promise<string>;
  async processBatch(jobId: string): Promise<void>;
  async getBatchStatus(batchId: string): Promise<BatchJob>;
}
```

## Security Considerations

### Data Protection
- Encryption at rest for all candidate data
- Secure API endpoints with JWT authentication
- Role-based access control (RBAC)
- Data anonymization for analytics

### Audit and Monitoring
- Comprehensive audit logging
- Real-time monitoring of scoring decisions
- Automated bias detection alerts
- Compliance violation notifications

## Integration Points

### Job Board Integration
```typescript
interface JobBoardConnector {
  boardId: string;
  apiEndpoint: string;
  authConfig: AuthConfig;
}

class JobBoardService {
  async syncApplications(boardId: string): Promise<ATSApplication[]>;
  async updateApplicationStatus(boardId: string, applicationId: string, status: string): Promise<void>;
  async postJobToBoard(job: JobRequirements, boardId: string): Promise<string>;
}
```

### HRIS Integration
```typescript
interface HRISConnector {
  systemType: 'workday' | 'bamboohr' | 'adp' | 'custom';
  apiConfig: APIConfig;
  fieldMappings: FieldMapping[];
}

class HRISService {
  async syncCandidateData(candidateId: string): Promise<CandidateData>;
  async createHireRecord(applicationId: string): Promise<HireRecord>;
  async updateCandidateStatus(candidateId: string, status: string): Promise<void>;
}
```