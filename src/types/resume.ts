/**
 * Resume Builder Types
 *
 * Comprehensive TypeScript interfaces for the AI-powered resume builder system.
 * Defines data structures for resumes, parsing, analysis, templates, and ATS scoring.
 */

// Base resume data structures
export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  website?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string | null; // null for current position
  current: boolean;
  description: string;
  achievements: string[];
  skills: string[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa?: number;
  honors?: string[];
  coursework?: string[];
}

export interface Skill {
  id: string;
  name: string;
  category: 'technical' | 'soft' | 'language' | 'tool';
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience?: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  link?: string;
  github?: string;
  startDate: string;
  endDate?: string;
  status: 'completed' | 'in-progress' | 'planned';
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
}

export interface Language {
  id: string;
  name: string;
  proficiency: 'native' | 'fluent' | 'professional' | 'conversational' | 'basic';
}

// Complete resume structure
export interface Resume {
  id: string;
  userId: string;
  personalInfo: PersonalInfo;
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
  certifications: Certification[];
  languages: Language[];
  customSections?: CustomSection[];
  metadata: ResumeMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomSection {
  id: string;
  title: string;
  content: string;
  order: number;
  type: 'text' | 'list' | 'table';
}

export interface ResumeMetadata {
  title: string;
  description: string;
  targetJobTitle?: string;
  targetIndustry?: string;
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
  documentFormat: 'pdf' | 'docx' | 'html';
  atsScore?: number;
  lastAnalyzedAt?: Date;
  templateUsed?: string;
}

// File upload and parsing types
export interface ResumeUpload {
  id: string;
  userId: string;
  originalName: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  uploadedAt: Date;
  processedAt?: Date;
  errorMessage?: string;
}

export interface ParsedResume {
  id: string;
  uploadId: string;
  rawText: string;
  structuredData: Partial<Resume>;
  confidence: number;
  parsingErrors: string[];
  processingTime: number; // in milliseconds
  createdAt: Date;
}

// AI analysis types
export interface ResumeAnalysis {
  id: string;
  resumeId: string;
  jobDescription?: string;
  atsScore: number;
  keywordMatches: KeywordMatch[];
  skillGaps: SkillGap[];
  improvementSuggestions: ImprovementSuggestion[];
  strengths: string[];
  weaknesses: string[];
  analyzedAt: Date;
}

export interface KeywordMatch {
  keyword: string;
  found: boolean;
  count: number;
  context: string[];
  importance: 'high' | 'medium' | 'low';
}

export interface SkillGap {
  skill: string;
  importance: 'required' | 'preferred' | 'bonus';
  foundInResume: boolean;
  proficiencyLevel?: string;
}

export interface ImprovementSuggestion {
  category: 'content' | 'formatting' | 'keywords' | 'structure' | 'impact';
  priority: 'high' | 'medium' | 'low';
  suggestion: string;
  example?: string;
  section?: string;
}

// Template system types
export interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  category: 'professional' | 'creative' | 'modern' | 'academic' | 'technical';
  preview: string; // URL to preview image
  layout: TemplateLayout;
  styling: TemplateStyling;
  sections: TemplateSection[];
  atsOptimized: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateLayout {
  format: 'single-column' | 'two-column' | 'three-column';
  headerStyle: 'centered' | 'left-aligned' | 'right-aligned';
  sectionOrder: string[];
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  spacing: {
    section: number;
    item: number;
    line: number;
  };
}

export interface TemplateStyling {
  fonts: {
    heading: string;
    body: string;
    accents: string;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
  };
  sizes: {
    heading: {
      h1: number;
      h2: number;
      h3: number;
    };
    body: number;
    small: number;
  };
}

export interface TemplateSection {
  id: string;
  name: string;
  type: 'personal-info' | 'summary' | 'experience' | 'education' | 'skills' | 'projects' | 'certifications' | 'languages' | 'custom';
  required: boolean;
  order: number;
  styling: {
    showDates: boolean;
    showLocation: boolean;
    bulletPoints: boolean;
    maxItems?: number;
  };
}

// Resume generation and export types
export interface ResumeGenerationRequest {
  resumeId: string;
  templateId: string;
  format: 'pdf' | 'docx' | 'html';
  options: GenerationOptions;
}

export interface GenerationOptions {
  includePhoto: boolean;
  customSections: string[];
  watermark?: boolean;
  quality: 'standard' | 'high' | 'print';
  pageMargins: 'normal' | 'narrow' | 'wide';
}

export interface GeneratedResume {
  id: string;
  requestId: string;
  downloadUrl: string;
  fileName: string;
  fileSize: number;
  format: string;
  templateUsed: string;
  generatedAt: Date;
  expiresAt: Date;
}

// Error handling types
export interface ResumeBuilderError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  requestId?: string;
}

export type ErrorCode =
  | 'FILE_TOO_LARGE'
  | 'UNSUPPORTED_FORMAT'
  | 'PARSING_FAILED'
  | 'AI_SERVICE_ERROR'
  | 'TEMPLATE_NOT_FOUND'
  | 'GENERATION_FAILED'
  | 'STORAGE_ERROR'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMIT_EXCEEDED'
  | 'QUOTA_EXCEEDED';

// API request/response types
export interface CreateResumeRequest {
  personalInfo: PersonalInfo;
  summary?: string;
  templateId?: string;
}

export interface UpdateResumeRequest {
  personalInfo?: Partial<PersonalInfo>;
  summary?: string;
  experience?: Experience[];
  education?: Education[];
  skills?: Skill[];
  projects?: Project[];
  certifications?: Certification[];
  languages?: Language[];
  customSections?: CustomSection[];
}

export interface AnalyzeResumeRequest {
  resumeId: string;
  jobDescription?: string;
  jobTitle?: string;
  industry?: string;
}

export interface ResumeListResponse {
  resumes: Resume[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Real-time update types
export interface ResumeUpdateEvent {
  type: 'resume_created' | 'resume_updated' | 'resume_deleted' | 'analysis_completed';
  resumeId: string;
  userId: string;
  data: any;
  timestamp: Date;
}

// Validation types
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
  severity: 'low' | 'medium' | 'high';
}

// Dashboard and analytics types
export interface ResumeAnalytics {
  totalResumes: number;
  totalAnalyses: number;
  averageAtsScore: number;
  mostUsedTemplates: TemplateUsage[];
  recentActivity: ActivityItem[];
  skillTrends: SkillTrend[];
}

export interface TemplateUsage {
  templateId: string;
  templateName: string;
  usageCount: number;
  percentage: number;
}

export interface ActivityItem {
  type: 'resume_created' | 'resume_updated' | 'analysis_completed' | 'resume_exported';
  resumeId: string;
  resumeTitle?: string;
  timestamp: Date;
  details?: any;
}

export interface SkillTrend {
  skill: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
  percentageChange: number;
}