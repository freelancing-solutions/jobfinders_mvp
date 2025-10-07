/**
 * Resume Builder Types
 *
 * Comprehensive TypeScript interfaces for the AI-powered resume builder system.
 * Defines data structures for resumes, parsing, analysis, templates, and ATS scoring.
 */

import { ResumeTemplate } from './template';

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

  // Template integration fields
  templateId?: string;
  templateCustomizationId?: string;
  templateData?: ResumeTemplateData;
  integrationMetadata?: IntegrationMetadata;

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

// Template integration data structure
export interface ResumeTemplateData {
  selectedTemplate: ResumeTemplate;
  customization: TemplateCustomization;
  renderedPreview?: string;
  atsScore?: number;
  version: string;
  appliedAt?: Date;
}

// Integration metadata for tracking template interactions
export interface IntegrationMetadata {
  templateAppliedAt?: Date;
  lastCustomizedAt?: Date;
  templateHistory: TemplateHistoryEntry[];
  atsAnalysisHistory: ATSAnalysisEntry[];
  exportHistory: ExportHistoryEntry[];
  performanceMetrics?: PerformanceMetrics;
  userPreferences?: UserTemplatePreferences;
}

export interface TemplateHistoryEntry {
  id: string;
  templateId: string;
  templateName: string;
  action: 'selected' | 'customized' | 'exported' | 'reverted' | 'shared';
  timestamp: Date;
  snapshot?: any;
  changeSummary?: string;
  sessionId?: string;
}

export interface ATSAnalysisEntry {
  id: string;
  score: number;
  issues: ATSIssue[];
  suggestions: string[];
  analyzedAt: Date;
  templateVersion: string;
  improvementAmount?: number;
}

export interface ExportHistoryEntry {
  id: string;
  format: 'pdf' | 'docx' | 'html' | 'txt';
  fileName: string;
  fileSize: number;
  exportedAt: Date;
  downloadUrl?: string;
  expiresAt?: Date;
  templateId: string;
  customizationId?: string;
}

export interface PerformanceMetrics {
  averageRenderTime: number;
  renderCount: number;
  errorCount: number;
  lastRenderTime?: Date;
  optimizationSuggestions: string[];
}

export interface UserTemplatePreferences {
  favoriteCategories: string[];
  preferredLayouts: string[];
  colorSchemePreference: string;
  fontPreference: string;
  autoSaveEnabled: boolean;
  realTimePreviewEnabled: boolean;
  atsOptimizationEnabled: boolean;
}

// Template customization data structure
export interface TemplateCustomization {
  id: string;
  name?: string;
  templateId: string;
  userId: string;
  resumeId?: string;
  colorScheme: ColorScheme;
  typography: TypographySettings;
  layout: LayoutSettings;
  sectionVisibility: SectionVisibility;
  customSections: Record<string, any>;
  branding: BrandingSettings;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    version: string;
    changeCount: number;
    isDefault: boolean;
    lastApplied?: Date;
  };
}

export interface ColorScheme {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  muted: string;
  border: string;
  highlight: string;
  link: string;
  customColors?: Record<string, string>;
}

export interface TypographySettings {
  heading: {
    fontFamily: string;
    fontWeight: number;
    fontSize: {
      h1: number;
      h2: number;
      h3: number;
      h4: number;
      h5: number;
      h6: number;
    };
    lineHeight: number;
    letterSpacing: number;
  };
  body: {
    fontFamily: string;
    fontWeight: number;
    fontSize: {
      large: number;
      normal: number;
      small: number;
      caption: number;
    };
    lineHeight: number;
    letterSpacing: number;
  };
  accent: {
    fontFamily: string;
    fontWeight: number;
    fontSize: number;
    lineHeight: number;
    letterSpacing: number;
  };
  monospace?: {
    fontFamily: string;
    fontWeight: number;
    fontSize: number;
    lineHeight: number;
    letterSpacing: number;
  };
}

export interface LayoutSettings {
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  sectionSpacing: {
    before: number;
    after: number;
  };
  itemSpacing: number;
  lineHeight: number;
  columns: {
    count: number;
    widths: number[];
    gutters: number;
  };
  customSections: Record<string, any>;
}

export interface SectionVisibility {
  [sectionId: string]: {
    visible: boolean;
    order: number;
    customSettings?: Record<string, any>;
  };
}

export interface BrandingSettings {
  logo?: {
    url: string;
    size: number;
    position: string;
    opacity: number;
  };
  watermark?: {
    text: string;
    font: string;
    size: number;
    color: string;
    opacity: number;
    position: string;
    rotation: number;
  };
  customHeader?: Record<string, any>;
  customFooter?: Record<string, any>;
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

export interface ATSIssue {
  severity: 'critical' | 'warning' | 'info';
  category: 'format' | 'structure' | 'content' | 'fonts';
  description: string;
  suggestion: string;
  autoFixable: boolean;
  section?: string;
  line?: number;
}

// Template system types are imported from './template'
// TemplateLayout, TemplateStyling, TemplateSection interfaces are available from template types

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