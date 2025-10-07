// Matching System Types
// Core types for the candidate matching system

export interface MatchRequest {
  candidateId?: string;
  jobId?: string;
  filters?: MatchFilters;
  preferences?: UserPreferences;
  limit?: number;
  offset?: number;
}

export interface MatchFilters {
  skills?: string[];
  location?: string[];
  salaryRange?: SalaryRange;
  experienceLevel?: ExperienceLevel[];
  workType?: WorkType[];
  industry?: string[];
  companySize?: CompanySize[];
  excludeCompanies?: string[];
  mustHaveSkills?: string[];
  dealBreakers?: string[];
}

export interface UserPreferences {
  location: LocationPreference[];
  salaryRange: SalaryRange;
  workType: WorkType;
  remoteWorkPreference: boolean;
  companyTypes: CompanyType[];
  industries: string[];
  teamSize: TeamSizePreference;
  travelRequirement: number;
  careerLevel: CareerLevel;
}

export interface MatchResult {
  id: string;
  candidateId: string;
  jobId: string;
  score: number;
  breakdown: ScoreBreakdown;
  explanation: MatchExplanation;
  confidence: number;
  status: MatchStatus;
  feedback?: MatchFeedback;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScoreBreakdown {
  skillsMatch: number;
  experienceMatch: number;
  educationMatch: number;
  locationMatch: number;
  salaryMatch: number;
  preferencesMatch: number;
  culturalFit: number;
  overallScore: number;
}

export interface MatchExplanation {
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  skillGaps: string[];
  improvementSuggestions: string[];
}

export interface MatchFeedback {
  userId: string;
  rating: number; // 1-5
  feedback: string;
  helpful: boolean;
  timestamp: Date;
}

export enum MatchStatus {
  NEW = 'new',
  VIEWED = 'viewed',
  APPLIED = 'applied',
  REJECTED = 'rejected',
  SAVED = 'saved',
  SHORTLISTED = 'shortlisted'
}

export interface Recommendation {
  id: string;
  targetId: string;
  type: RecommendationType;
  score: number;
  reason: string;
  metadata: RecommendationMetadata;
  createdAt: Date;
}

export enum RecommendationType {
  JOB = 'job',
  CANDIDATE = 'candidate',
  SKILL = 'skill',
  CAREER_PATH = 'career_path',
  SIMILAR_JOB = 'similar_job',
  SIMILAR_CANDIDATE = 'similar_candidate'
}

export interface RecommendationMetadata {
  strategy: string;
  weight: number;
  source: string;
  context?: any;
  expiresAt?: Date;
}

export interface RecommendationStrategy {
  name: string;
  weight: number;
  enabled: boolean;
  description: string;
}

export interface ScoringWeights {
  skills: number;
  experience: number;
  education: number;
  location: number;
  salary: number;
  preferences: number;
  culturalFit: number;
}

export interface MLModel {
  id: string;
  name: string;
  version: string;
  type: MLModelType;
  accuracy: number;
  lastTrained: Date;
  features: string[];
  isActive: boolean;
  metrics: ModelMetrics;
}

export enum MLModelType {
  COLLABORATIVE_FILTERING = 'collaborative_filtering',
  CONTENT_BASED = 'content_based',
  HYBRID = 'hybrid',
  DEEP_LEARNING = 'deep_learning',
  EMBEDDING_BASED = 'embedding_based'
}

export interface ModelMetrics {
  precision: number;
  recall: number;
  f1Score: number;
  aucRoc: number;
  accuracy: number;
  lastEvaluated: Date;
}

export interface FeatureVector {
  candidateFeatures: number[];
  jobFeatures: number[];
  interactionFeatures: number[];
  contextFeatures: number[];
}

export interface UserInteraction {
  id: string;
  userId: string;
  interactionType: InteractionType;
  targetType: InteractionTarget;
  targetId: string;
  metadata: any;
  timestamp: Date;
  sessionId?: string;
}

export enum InteractionType {
  VIEW = 'view',
  APPLY = 'apply',
  SAVE = 'save',
  SHARE = 'share',
  FEEDBACK = 'feedback',
  SEARCH = 'search',
  FILTER = 'filter',
  MATCH_CLICK = 'match_click',
  RECOMMENDATION_CLICK = 'recommendation_click'
}

export enum InteractionTarget {
  JOB = 'job',
  CANDIDATE = 'candidate',
  MATCH = 'match',
  RECOMMENDATION = 'recommendation',
  SEARCH_RESULT = 'search_result'
}

export interface MatchingEvent {
  id: string;
  type: MatchingEventType;
  userId: string;
  entityId: string;
  timestamp: Date;
  data: any;
}

export enum MatchingEventType {
  PROFILE_UPDATED = 'profile_updated',
  JOB_POSTED = 'job_posted',
  APPLICATION_SUBMITTED = 'application_submitted',
  MATCH_VIEWED = 'match_viewed',
  MATCH_UPDATED = 'match_updated',
  RECOMMENDATION_GENERATED = 'recommendation_generated'
}

export interface ProfileEmbedding {
  id: string;
  profileId: string;
  profileType: 'candidate' | 'job';
  embedding: number[];
  metadata: EmbeddingMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmbeddingMetadata {
  model: string;
  version: string;
  dimensions: number;
  source: string;
  confidence?: number;
}

export interface SimilarityResult {
  profileId: string;
  similarity: number;
  metadata: any;
  score: number;
}

export interface BatchMatchJob {
  id: string;
  type: BatchMatchType;
  profileIds: string[];
  status: BatchMatchStatus;
  progress: number;
  totalProfiles: number;
  results?: MatchResult[];
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export enum BatchMatchType {
  CANDIDATE_BATCH = 'candidate_batch',
  JOB_BATCH = 'job_batch',
  FULL_RECOMPUTE = 'full_recompute',
  MODEL_UPDATE = 'model_update'
}

export enum BatchMatchStatus {
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface CacheConfig {
  matchResults: { ttl: number; maxSize: number };
  profileAnalysis: { ttl: number; maxSize: number };
  recommendations: { ttl: number; maxSize: number };
  embeddings: { ttl: number; maxSize: number };
  mlModels: { ttl: number; maxSize: number };
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'employers_only' | 'private';
  allowDirectContact: boolean;
  excludedCompanies: string[];
  anonymousMatching: boolean;
  dataRetentionPeriod: number;
  allowAnalytics: boolean;
  allowPersonalization: boolean;
}

export interface BiasMetrics {
  demographicParity: number;
  equalizedOdds: number;
  calibration: number;
  overallFairness: number;
  lastCalculated: Date;
}

export interface AnalyticsMetrics {
  totalMatches: number;
  averageScore: number;
  matchConversionRate: number;
  userSatisfaction: number;
  algorithmAccuracy: number;
  responseTime: number;
  dateRange: DateRange;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

// Supporting types from profile system
export interface SalaryRange {
  min?: number;
  max?: number;
  currency?: string;
  period?: 'hourly' | 'monthly' | 'yearly';
}

export enum ExperienceLevel {
  ENTRY = 'entry',
  JUNIOR = 'junior',
  MID = 'mid',
  SENIOR = 'senior',
  LEAD = 'lead',
  MANAGER = 'manager',
  DIRECTOR = 'director',
  EXECUTIVE = 'executive'
}

export enum WorkType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACT = 'contract',
  FREELANCE = 'freelance',
  INTERNSHIP = 'internship',
  TEMPORARY = 'temporary'
}

export enum CompanyType {
  STARTUP = 'startup',
  SMB = 'smb',
  ENTERPRISE = 'enterprise',
  NON_PROFIT = 'non_profit',
  GOVERNMENT = 'government',
  AGENCY = 'agency'
}

export enum CompanySize {
  MICRO = 'micro', // 1-10
  SMALL = 'small', // 11-50
  MEDIUM = 'medium', // 51-200
  LARGE = 'large', // 201-1000
  ENTERPRISE = 'enterprise' // 1000+
}

export interface LocationPreference {
  city?: string;
  state?: string;
  country?: string;
  remote: boolean;
  relocation: boolean;
  priority: number; // 1-5
}

export enum TeamSizePreference {
  SOLO = 'solo',
  SMALL = 'small', // 2-10
  MEDIUM = 'medium', // 11-50
  LARGE = 'large', // 51-200
  VERY_LARGE = 'very_large' // 200+
}

export enum CareerLevel {
  ENTRY_LEVEL = 'entry_level',
  EARLY_CAREER = 'early_career',
  MID_CAREER = 'mid_career',
  SENIOR_LEVEL = 'senior_level',
  EXECUTIVE_LEVEL = 'executive_level'
}

// Additional types for UI integration
export interface MatchSortOptions {
  field: 'matchScore' | 'matchConfidence' | 'lastMatched';
  order: 'asc' | 'desc';
}

export interface ProfileMatchResult {
  profile: CandidateProfile | JobProfile;
  matchScore: number;
  matchConfidence: number;
  matchDetails: ScoreBreakdown;
  explanation: MatchExplanation;
  recommendations: string[];
  lastMatched: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

export interface JobRecommendation {
  id: string;
  job: {
    id: string;
    title: string;
    company: {
      name: string;
      logo?: string;
    };
    location?: {
      city: string;
      state: string;
    };
    salaryRange?: {
      min?: number;
      max?: number;
    };
    requirements?: {
      skills: string[];
    };
    employmentType?: string;
  };
  matchScore: number;
  matchConfidence: number;
  matchDetails?: ScoreBreakdown;
  explanation?: MatchExplanation;
  lastMatched: Date;
}

export interface CandidateRecommendation {
  id: string;
  candidate: {
    id: string;
    name: string;
    title?: string;
    location?: {
      city: string;
      state: string;
    };
    experience?: {
      years: number;
      level: string;
    };
    skills: string[];
    avatar?: string;
  };
  matchScore: number;
  matchConfidence: number;
  matchDetails?: ScoreBreakdown;
  explanation?: MatchExplanation;
  lastMatched: Date;
}

export interface MatchStats {
  totalMatches: number;
  averageScore: number;
  highQualityMatches: number;
  recentMatches: number;
  matchRate: number;
}

// Core profile types
export interface CandidateProfile {
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
    headline?: string;
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
  embedding?: number[];
}

export interface JobProfile {
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
    companyCulture?: string[];
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
    expiryDate?: Date;
    urgency: 'low' | 'medium' | 'high';
    isActive: boolean;
  };
  embedding?: number[];
}

export interface Skill {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsExperience?: number;
  lastUsed?: Date;
  category: string;
}

export interface WorkExperience {
  id: string;
  title: string;
  company: string;
  location?: string;
  startDate: Date;
  endDate?: Date;
  current: boolean;
  description: string;
  achievements: string[];
  skills: string[];
  industry: string;
  companySize?: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: Date;
  endDate?: Date;
  current: boolean;
  gpa?: number;
  honors?: string[];
  activities?: string[];
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate: Date;
  expiryDate?: Date;
  credentialId?: string;
  credentialUrl?: string;
  skills: string[];
}

export interface JobPreferences {
  jobTypes: string[];
  workTypes: ('remote' | 'hybrid' | 'onsite')[];
  locations: LocationPreference[];
  salaryRange: SalaryRange;
  industries: string[];
  companySizes: string[];
  remoteOnly: boolean;
  openToRelocation: boolean;
  travelWillingness: number;
}

export interface LocationInfo {
  city: string;
  state: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  timezone?: string;
  remote: boolean;
}

export interface AvailabilityInfo {
  availableImmediately: boolean;
  startDate?: Date;
  workSchedule: 'full-time' | 'part-time' | 'contract' | 'internship';
  workHours?: {
    min: number;
    max: number;
  };
  overtime: boolean;
}

export interface RequiredSkill {
  name: string;
  required: 'required' | 'preferred';
  experience: number;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface ExperienceRequirement {
  years: number;
  level: 'entry' | 'junior' | 'mid' | 'senior' | 'lead' | 'principal';
  required: boolean;
}

export interface EducationRequirement {
  degree: string;
  field: string;
  required: boolean;
}

export interface CertificationRequirement {
  name: string;
  issuer: string;
  required: boolean;
}

export interface CompanyInfo {
  id: string;
  name: string;
  description: string;
  industry: string;
  size: string;
  website?: string;
  logo?: string;
  locations: LocationInfo[];
  benefits: string[];
  culture: string[];
  values: string[];
}