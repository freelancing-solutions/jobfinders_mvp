# Candidate Matching System - Design

## Architecture Overview

The Candidate Matching System uses a microservices architecture with ML pipeline integration:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Matching API   │    │ Profile Service │    │ ML Pipeline     │
│                 │◄──►│                 │◄──►│                 │
│ - Match Queries │    │ - Candidate     │    │ - Feature Eng   │
│ - Recommendations│    │ - Job Profiles  │    │ - Model Serving │
│ - Analytics     │    │ - Preferences   │    │ - Training      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Scoring Engine  │    │ Recommendation  │    │ Real-time Proc  │
│                 │    │ Engine          │    │                 │
│ - Match Scores  │    │ - Job Recs      │    │ - Stream Proc   │
│ - Compatibility │    │ - Candidate Recs│    │ - Event Handling│
│ - Explanations  │    │ - Similar Items │    │ - Notifications │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vector DB     │    │   Cache Layer   │    │   Event Store   │
│                 │    │                 │    │                 │
│ - Embeddings    │    │ - Match Results │    │ - User Actions  │
│ - Similarity    │    │ - Profiles      │    │ - Match Events  │
│ - Search Index  │    │ - Preferences   │    │ - Analytics     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Component Design

### 1. Matching Core Service
**Location:** `src/services/matching/core-service.ts`

```typescript
interface MatchRequest {
  candidateId?: string;
  jobId?: string;
  filters?: MatchFilters;
  preferences?: UserPreferences;
  limit?: number;
  offset?: number;
}

interface MatchResult {
  id: string;
  candidateId: string;
  jobId: string;
  score: number;
  breakdown: ScoreBreakdown;
  explanation: string[];
  confidence: number;
  timestamp: Date;
}

class MatchingCoreService {
  async findMatches(request: MatchRequest): Promise<MatchResult[]>;
  async getMatchDetails(matchId: string): Promise<MatchDetails>;
  async updateMatchFeedback(matchId: string, feedback: MatchFeedback): Promise<void>;
  async batchMatch(requests: MatchRequest[]): Promise<MatchResult[][]>;
}
```

### 2. Profile Analysis Service
**Location:** `src/services/matching/profile-analyzer.ts`

```typescript
interface CandidateProfile {
  id: string;
  personalInfo: PersonalInfo;
  skills: Skill[];
  experience: WorkExperience[];
  education: Education[];
  certifications: Certification[];
  preferences: JobPreferences;
  metadata: ProfileMetadata;
}

interface JobProfile {
  id: string;
  title: string;
  description: string;
  requirements: JobRequirements;
  preferences: EmployerPreferences;
  company: CompanyInfo;
  location: LocationInfo;
  salary: SalaryRange;
}

class ProfileAnalyzer {
  async analyzeCandidateProfile(profile: CandidateProfile): Promise<ProfileAnalysis>;
  async analyzeJobProfile(job: JobProfile): Promise<JobAnalysis>;
  async extractSkills(text: string): Promise<Skill[]>;
  async calculateExperienceRelevance(experience: WorkExperience[], jobRequirements: JobRequirements): Promise<number>;
  async assessEducationMatch(education: Education[], requirements: EducationRequirement[]): Promise<number>;
}
```

### 3. Scoring Engine
**Location:** `src/services/matching/scoring-engine.ts`

```typescript
interface ScoreBreakdown {
  skillsMatch: number;
  experienceMatch: number;
  educationMatch: number;
  locationMatch: number;
  salaryMatch: number;
  preferencesMatch: number;
  culturalFit: number;
  overallScore: number;
}

interface ScoringWeights {
  skills: number;
  experience: number;
  education: number;
  location: number;
  salary: number;
  preferences: number;
  culturalFit: number;
}

class ScoringEngine {
  async calculateMatchScore(candidate: CandidateProfile, job: JobProfile): Promise<ScoreBreakdown>;
  async batchScore(candidates: CandidateProfile[], job: JobProfile): Promise<ScoreBreakdown[]>;
  async explainScore(score: ScoreBreakdown): Promise<string[]>;
  async customizeWeights(weights: ScoringWeights): Promise<void>;
  private calculateSkillsMatch(candidateSkills: Skill[], jobSkills: Skill[]): number;
  private calculateExperienceMatch(experience: WorkExperience[], requirements: ExperienceRequirement[]): number;
}
```

### 4. Machine Learning Pipeline
**Location:** `src/services/matching/ml-pipeline.ts`

```typescript
interface MLModel {
  id: string;
  name: string;
  version: string;
  type: 'collaborative_filtering' | 'content_based' | 'hybrid' | 'deep_learning';
  accuracy: number;
  lastTrained: Date;
  features: string[];
}

interface FeatureVector {
  candidateFeatures: number[];
  jobFeatures: number[];
  interactionFeatures: number[];
  contextFeatures: number[];
}

class MLPipeline {
  async generateEmbeddings(profile: CandidateProfile | JobProfile): Promise<number[]>;
  async predictMatchScore(candidateId: string, jobId: string): Promise<number>;
  async getRecommendations(userId: string, type: 'jobs' | 'candidates', limit: number): Promise<Recommendation[]>;
  async trainModel(trainingData: TrainingData[]): Promise<MLModel>;
  async evaluateModel(testData: TestData[]): Promise<ModelMetrics>;
  private extractFeatures(candidate: CandidateProfile, job: JobProfile): FeatureVector;
}
```

### 5. Recommendation Engine
**Location:** `src/services/matching/recommendation-engine.ts`

```typescript
interface Recommendation {
  id: string;
  targetId: string;
  type: 'job' | 'candidate' | 'skill' | 'career_path';
  score: number;
  reason: string;
  metadata: RecommendationMetadata;
}

interface RecommendationStrategy {
  name: string;
  weight: number;
  enabled: boolean;
}

class RecommendationEngine {
  async getJobRecommendations(candidateId: string, limit: number): Promise<Recommendation[]>;
  async getCandidateRecommendations(jobId: string, limit: number): Promise<Recommendation[]>;
  async getSimilarJobs(jobId: string, limit: number): Promise<Recommendation[]>;
  async getSimilarCandidates(candidateId: string, limit: number): Promise<Recommendation[]>;
  async getSkillRecommendations(candidateId: string): Promise<Recommendation[]>;
  async getCareerPathRecommendations(candidateId: string): Promise<Recommendation[]>;
  private combineStrategies(strategies: RecommendationStrategy[], results: Recommendation[][]): Recommendation[];
}
```

### 6. Real-time Processing Service
**Location:** `src/services/matching/realtime-processor.ts`

```typescript
interface MatchEvent {
  id: string;
  type: 'profile_updated' | 'job_posted' | 'application_submitted' | 'match_viewed';
  userId: string;
  entityId: string;
  timestamp: Date;
  data: any;
}

interface StreamProcessor {
  processEvent(event: MatchEvent): Promise<void>;
  handleProfileUpdate(candidateId: string): Promise<void>;
  handleJobPosting(jobId: string): Promise<void>;
  handleUserInteraction(interaction: UserInteraction): Promise<void>;
}

class RealtimeProcessor implements StreamProcessor {
  async processEvent(event: MatchEvent): Promise<void>;
  async handleProfileUpdate(candidateId: string): Promise<void>;
  async handleJobPosting(jobId: string): Promise<void>;
  async handleUserInteraction(interaction: UserInteraction): Promise<void>;
  async triggerMatchNotifications(matches: MatchResult[]): Promise<void>;
  private updateMatchCache(candidateId: string, jobId: string): Promise<void>;
}
```

## Data Models

### Candidate Profile Model
```typescript
interface CandidateProfile {
  id: string;
  userId: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    location: LocationInfo;
    linkedinUrl?: string;
    portfolioUrl?: string;
  };
  professionalSummary: string;
  skills: Skill[];
  experience: WorkExperience[];
  education: Education[];
  certifications: Certification[];
  preferences: JobPreferences;
  availability: AvailabilityInfo;
  metadata: {
    completionScore: number;
    lastUpdated: Date;
    visibility: 'public' | 'private' | 'employers_only';
    isActive: boolean;
  };
}
```

### Job Profile Model
```typescript
interface JobProfile {
  id: string;
  employerId: string;
  title: string;
  description: string;
  requirements: {
    skills: RequiredSkill[];
    experience: ExperienceRequirement[];
    education: EducationRequirement[];
    certifications: CertificationRequirement[];
  };
  preferences: {
    location: LocationPreference[];
    workType: 'remote' | 'hybrid' | 'onsite';
    travelRequirement: number;
    teamSize: number;
  };
  compensation: {
    salaryRange: SalaryRange;
    benefits: string[];
    equity: boolean;
    bonus: boolean;
  };
  company: CompanyInfo;
  metadata: {
    postedDate: Date;
    expiryDate: Date;
    urgency: 'low' | 'medium' | 'high';
    isActive: boolean;
  };
}
```

### Match Result Model
```typescript
interface MatchResult {
  id: string;
  candidateId: string;
  jobId: string;
  score: number;
  breakdown: ScoreBreakdown;
  explanation: MatchExplanation;
  confidence: number;
  status: 'new' | 'viewed' | 'applied' | 'rejected' | 'saved';
  feedback?: MatchFeedback;
  createdAt: Date;
  updatedAt: Date;
}

interface MatchExplanation {
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  skillGaps: string[];
  improvementSuggestions: string[];
}
```

## API Endpoints

### Matching Operations
```
POST   /api/matching/find-matches        - Find matches for candidate or job
GET    /api/matching/matches/:id         - Get match details
PUT    /api/matching/matches/:id/feedback - Submit match feedback
POST   /api/matching/batch-match         - Batch matching operation
GET    /api/matching/candidates/:id/matches - Get matches for candidate
GET    /api/matching/jobs/:id/matches    - Get matches for job
```

### Recommendations
```
GET    /api/recommendations/jobs/:candidateId     - Get job recommendations
GET    /api/recommendations/candidates/:jobId     - Get candidate recommendations
GET    /api/recommendations/similar-jobs/:jobId   - Get similar jobs
GET    /api/recommendations/similar-candidates/:candidateId - Get similar candidates
GET    /api/recommendations/skills/:candidateId   - Get skill recommendations
GET    /api/recommendations/career-paths/:candidateId - Get career path suggestions
```

### Profile Analysis
```
POST   /api/analysis/profile/candidate   - Analyze candidate profile
POST   /api/analysis/profile/job         - Analyze job profile
POST   /api/analysis/skills/extract      - Extract skills from text
POST   /api/analysis/compatibility       - Check compatibility between profiles
GET    /api/analysis/market-insights     - Get market insights and trends
```

### Machine Learning
```
POST   /api/ml/embeddings/generate       - Generate profile embeddings
POST   /api/ml/predict/match-score       - Predict match score
POST   /api/ml/train/model              - Train ML model
GET    /api/ml/models                   - Get available models
GET    /api/ml/models/:id/metrics       - Get model performance metrics
```

## Database Schema

### Candidate Profiles Table
```sql
CREATE TABLE candidate_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  personal_info JSONB NOT NULL,
  professional_summary TEXT,
  skills JSONB NOT NULL DEFAULT '[]',
  experience JSONB NOT NULL DEFAULT '[]',
  education JSONB NOT NULL DEFAULT '[]',
  certifications JSONB NOT NULL DEFAULT '[]',
  preferences JSONB NOT NULL DEFAULT '{}',
  availability JSONB NOT NULL DEFAULT '{}',
  completion_score INTEGER DEFAULT 0,
  visibility VARCHAR(20) DEFAULT 'public',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Job Profiles Table
```sql
CREATE TABLE job_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  requirements JSONB NOT NULL DEFAULT '{}',
  preferences JSONB NOT NULL DEFAULT '{}',
  compensation JSONB NOT NULL DEFAULT '{}',
  company_info JSONB NOT NULL DEFAULT '{}',
  posted_date TIMESTAMP DEFAULT NOW(),
  expiry_date TIMESTAMP,
  urgency VARCHAR(10) DEFAULT 'medium',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Match Results Table
```sql
CREATE TABLE match_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidate_profiles(id),
  job_id UUID NOT NULL REFERENCES job_profiles(id),
  score DECIMAL(5,2) NOT NULL,
  breakdown JSONB NOT NULL,
  explanation JSONB NOT NULL,
  confidence DECIMAL(5,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'new',
  feedback JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(candidate_id, job_id)
);
```

### User Interactions Table
```sql
CREATE TABLE user_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  interaction_type VARCHAR(50) NOT NULL,
  target_type VARCHAR(20) NOT NULL,
  target_id UUID NOT NULL,
  metadata JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

### ML Models Table
```sql
CREATE TABLE ml_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  version VARCHAR(20) NOT NULL,
  type VARCHAR(50) NOT NULL,
  accuracy DECIMAL(5,4),
  features JSONB NOT NULL,
  model_data BYTEA,
  is_active BOOLEAN DEFAULT false,
  trained_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Vector Database Integration

### Embedding Storage
```typescript
interface ProfileEmbedding {
  id: string;
  profileId: string;
  profileType: 'candidate' | 'job';
  embedding: number[];
  metadata: EmbeddingMetadata;
  createdAt: Date;
}

class VectorStore {
  async storeEmbedding(embedding: ProfileEmbedding): Promise<void>;
  async searchSimilar(queryEmbedding: number[], limit: number, filters?: any): Promise<SimilarityResult[]>;
  async updateEmbedding(profileId: string, embedding: number[]): Promise<void>;
  async deleteEmbedding(profileId: string): Promise<void>;
  async batchStore(embeddings: ProfileEmbedding[]): Promise<void>;
}
```

### Similarity Search
```typescript
interface SimilarityResult {
  profileId: string;
  similarity: number;
  metadata: any;
}

class SimilaritySearchService {
  async findSimilarCandidates(jobId: string, limit: number): Promise<SimilarityResult[]>;
  async findSimilarJobs(candidateId: string, limit: number): Promise<SimilarityResult[]>;
  async findSimilarProfiles(profileId: string, profileType: string, limit: number): Promise<SimilarityResult[]>;
  private combineSemanticAndKeywordSearch(semanticResults: SimilarityResult[], keywordResults: SimilarityResult[]): SimilarityResult[];
}
```

## Caching Strategy

### Multi-Level Caching
```typescript
interface CacheConfig {
  matchResults: { ttl: 1800, maxSize: 10000 }; // 30 minutes
  profileAnalysis: { ttl: 3600, maxSize: 5000 }; // 1 hour
  recommendations: { ttl: 900, maxSize: 20000 }; // 15 minutes
  embeddings: { ttl: 86400, maxSize: 1000 }; // 24 hours
  mlModels: { ttl: 604800, maxSize: 10 }; // 1 week
}

class MatchingCacheService {
  async cacheMatchResult(key: string, result: MatchResult): Promise<void>;
  async getCachedMatch(candidateId: string, jobId: string): Promise<MatchResult | null>;
  async cacheRecommendations(userId: string, recommendations: Recommendation[]): Promise<void>;
  async invalidateUserCache(userId: string): Promise<void>;
  async warmupCache(profileIds: string[]): Promise<void>;
}
```

## Real-time Features

### Event Streaming
```typescript
interface MatchingEvent {
  type: 'match_found' | 'profile_updated' | 'job_posted' | 'interaction_recorded';
  userId: string;
  data: any;
  timestamp: Date;
}

class EventStreamProcessor {
  async processMatchingEvent(event: MatchingEvent): Promise<void>;
  async handleNewMatch(match: MatchResult): Promise<void>;
  async handleProfileUpdate(profileId: string): Promise<void>;
  async handleJobPosting(jobId: string): Promise<void>;
  async sendRealtimeNotification(userId: string, notification: Notification): Promise<void>;
}
```

### WebSocket Integration
```typescript
class RealtimeMatchingService {
  async subscribeToMatches(userId: string, socket: WebSocket): Promise<void>;
  async unsubscribeFromMatches(userId: string, socket: WebSocket): Promise<void>;
  async broadcastNewMatch(match: MatchResult): Promise<void>;
  async sendPersonalizedUpdate(userId: string, update: any): Promise<void>;
}
```

## Performance Optimization

### Batch Processing
```typescript
interface BatchMatchJob {
  id: string;
  type: 'candidate_batch' | 'job_batch' | 'full_recompute';
  profileIds: string[];
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  results?: MatchResult[];
}

class BatchMatchProcessor {
  async queueBatchJob(job: BatchMatchJob): Promise<string>;
  async processBatch(jobId: string): Promise<void>;
  async getBatchStatus(batchId: string): Promise<BatchMatchJob>;
  async optimizeBatchSize(profileCount: number): Promise<number>;
}
```

### Query Optimization
```typescript
class QueryOptimizer {
  async optimizeMatchQuery(query: MatchRequest): Promise<OptimizedQuery>;
  async createIndexes(): Promise<void>;
  async analyzeQueryPerformance(): Promise<QueryMetrics>;
  async suggestOptimizations(): Promise<OptimizationSuggestion[]>;
}
```

## Security and Privacy

### Data Protection
```typescript
interface PrivacySettings {
  profileVisibility: 'public' | 'employers_only' | 'private';
  allowDirectContact: boolean;
  excludedCompanies: string[];
  anonymousMatching: boolean;
  dataRetentionPeriod: number;
}

class PrivacyManager {
  async applyPrivacySettings(userId: string, settings: PrivacySettings): Promise<void>;
  async anonymizeProfile(profileId: string): Promise<AnonymizedProfile>;
  async checkDataAccess(requesterId: string, profileId: string): Promise<boolean>;
  async auditDataAccess(accessLog: DataAccessLog): Promise<void>;
}
```

### Bias Detection and Mitigation
```typescript
interface BiasMetrics {
  demographicParity: number;
  equalizedOdds: number;
  calibration: number;
  overallFairness: number;
}

class BiasDetectionService {
  async detectMatchingBias(matches: MatchResult[], demographics?: DemographicData[]): Promise<BiasMetrics>;
  async mitigateBias(algorithm: MatchingAlgorithm): Promise<MatchingAlgorithm>;
  async generateFairnessReport(timeRange: DateRange): Promise<FairnessReport>;
  async monitorAlgorithmFairness(): Promise<void>;
}
```

## Integration Points

### External Job Boards
```typescript
interface JobBoardIntegration {
  boardId: string;
  apiConfig: APIConfig;
  syncFrequency: number;
  fieldMappings: FieldMapping[];
}

class JobBoardSyncService {
  async syncJobsFromBoard(boardId: string): Promise<JobProfile[]>;
  async pushCandidatesToBoard(boardId: string, candidateIds: string[]): Promise<void>;
  async handleApplicationCallback(boardId: string, applicationData: any): Promise<void>;
}
```

### Skills Assessment Platforms
```typescript
interface SkillAssessmentResult {
  candidateId: string;
  skill: string;
  score: number;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  verifiedAt: Date;
  platform: string;
}

class SkillVerificationService {
  async verifySkills(candidateId: string, skills: string[]): Promise<SkillAssessmentResult[]>;
  async updateSkillScores(results: SkillAssessmentResult[]): Promise<void>;
  async getVerifiedSkills(candidateId: string): Promise<SkillAssessmentResult[]>;
}
```