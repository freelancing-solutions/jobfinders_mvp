/**
 * Parsed Resume Types
 *
 * Type definitions for resume parsing results, intermediate data structures,
 * and parsing-related interfaces.
 */

import { Resume, PersonalInfo, Experience, Education, Skill, Project, Certification, Language } from './resume';

// Raw parsing results before validation and sanitization
export interface RawParsedResume {
  personalInfo: Partial<PersonalInfo>;
  summary?: string;
  experience: Partial<Experience>[];
  education: Partial<Education>[];
  skills: Partial<Skill>[];
  projects: Partial<Project>[];
  certifications: Partial<Certification>[];
  languages: Partial<Language>[];
  customSections?: RawCustomSection[];
  metadata: RawMetadata;
}

export interface RawCustomSection {
  id?: string;
  title: string;
  content: string;
  order?: number;
  type?: 'text' | 'list' | 'table';
}

export interface RawMetadata {
  title?: string;
  description?: string;
  targetJobTitle?: string;
  targetIndustry?: string;
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'executive';
  documentFormat: string;
  parsingConfidence: number;
  processingTime: number;
  extractedAt: Date;
  parsingWarnings: string[];
  parsingErrors: string[];
}

// Section extraction results
export interface ExtractedSection {
  name: string;
  content: string;
  startIndex: number;
  endIndex: number;
  confidence: number;
  subsections?: ExtractedSubsection[];
}

export interface ExtractedSubsection {
  title: string;
  content: string;
  startIndex: number;
  endIndex: number;
}

// Contact information extraction
export interface ExtractedContactInfo {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  confidence: number;
}

// Work experience extraction
export interface ExtractedExperience {
  title?: string;
  company?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  description?: string;
  achievements?: string[];
  skills?: string[];
  confidence: number;
  parsingNotes?: string[];
}

// Education extraction
export interface ExtractedEducation {
  institution?: string;
  degree?: string;
  field?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  gpa?: number;
  honors?: string[];
  coursework?: string[];
  confidence: number;
  parsingNotes?: string[];
}

// Skill extraction
export interface ExtractedSkill {
  name: string;
  category?: 'technical' | 'soft' | 'language' | 'tool';
  level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience?: number;
  confidence: number;
  source: 'section' | 'description' | 'ai';
}

// Project extraction
export interface ExtractedProject {
  name?: string;
  description?: string;
  technologies?: string[];
  link?: string;
  github?: string;
  startDate?: string;
  endDate?: string;
  status?: 'completed' | 'in-progress' | 'planned';
  confidence: number;
}

// Certification extraction
export interface ExtractedCertification {
  name?: string;
  issuer?: string;
  issueDate?: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  confidence: number;
}

// Language extraction
export interface ExtractedLanguage {
  name?: string;
  proficiency?: 'native' | 'fluent' | 'professional' | 'conversational' | 'basic';
  confidence: number;
}

// Parsing configuration options
export interface ParsingOptions {
  useAI?: boolean;
  targetIndustry?: string;
  targetRole?: string;
  includeProjects?: boolean;
  includeCertifications?: boolean;
  strictValidation?: boolean;
  maxExperienceEntries?: number;
  maxSkillCount?: number;
  preserveOriginalText?: boolean;
  extractDates?: boolean;
  extractLocations?: boolean;
}

// Parsing quality metrics
export interface ParsingQuality {
  overallConfidence: number; // 0-100
  sectionConfidence: {
    [section: string]: number;
  };
  completenessScore: number; // 0-100
  accuracyScore: number; // 0-100
  consistencyScore: number; // 0-100
  issues: ParsingIssue[];
}

export interface ParsingIssue {
  severity: 'error' | 'warning' | 'info';
  type: string;
  message: string;
  section?: string;
  suggestion?: string;
}

// AI-enhanced parsing results
export interface AIParsingResult {
  extractedData: Partial<Resume>;
  confidence: number;
  suggestions: AIParsingSuggestion[];
  missingSections: string[];
  recommendedImprovements: string[];
  processingTime: number;
}

export interface AIParsingSuggestion {
  field: string;
  currentValue?: string;
  suggestedValue?: string;
  reason: string;
  confidence: number;
}

// Parsing statistics
export interface ParsingStatistics {
  totalProcessed: number;
  successRate: number;
  averageProcessingTime: number;
  averageConfidence: number;
  commonIssues: { [issue: string]: number };
  formatBreakdown: { [format: string]: number };
  sectionExtractionRates: { [section: string]: number };
}

// Comparison between original and parsed data
export interface ParseComparison {
  originalText: string;
  extractedData: Partial<Resume>;
  differences: DataDifference[];
  accuracyMetrics: {
    fieldsExtracted: number;
    totalFields: number;
    correctExtractions: number;
    incorrectExtractions: number;
  };
}

export interface DataDifference {
  field: string;
  originalValue?: string;
  extractedValue?: string;
  status: 'correct' | 'incorrect' | 'missing' | 'extra';
  confidence: number;
}

// Resume structure analysis
export interface ResumeStructure {
  hasHeader: boolean;
  hasSummary: boolean;
  sectionOrder: string[];
  hasChronologicalExperience: boolean;
  hasFunctionalExperience: boolean;
  hasProjects: boolean;
  hasCertifications: boolean;
  structureType: 'chronological' | 'functional' | 'combination' | 'targeted' | 'unknown';
  estimatedReadability: 'excellent' | 'good' | 'fair' | 'poor';
  estimatedAtsCompatibility: number; // 0-100
}

// Date extraction results
export interface ExtractedDate {
  originalText: string;
  normalizedDate: string;
  confidence: number;
  format: 'YYYY-MM-DD' | 'MM/YYYY' | 'Month YYYY' | 'YYYY' | 'relative';
  isApproximate?: boolean;
}

// Location extraction results
export interface ExtractedLocation {
  originalText: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  confidence: number;
  isComplete: boolean;
}

// Skill category mapping
export interface SkillCategory {
  name: string;
  skills: string[];
  confidence: number;
  source: 'explicit' | 'inferred' | 'ai';
}

// Parsing progress tracking
export interface ParsingProgress {
  stage: 'initializing' | 'text_extraction' | 'section_detection' | 'field_extraction' | 'ai_analysis' | 'validation' | 'completed';
  progress: number; // 0-100
  currentOperation: string;
  estimatedTimeRemaining?: number;
  errors: string[];
}

// Batch parsing results
export interface BatchParseResult {
  requestId: string;
  totalFiles: number;
  processedFiles: number;
  results: IndividualParseResult[];
  summary: BatchParseSummary;
}

export interface IndividualParseResult {
  fileId: string;
  fileName: string;
  success: boolean;
  result?: ParseResult;
  error?: string;
  processingTime: number;
}

export interface BatchParseSummary {
  successCount: number;
  errorCount: number;
  averageConfidence: number;
  totalProcessingTime: number;
  commonErrors: { [error: string]: number };
}

// Main parse result interface
export interface ParseResult {
  resume: Partial<Resume>;
  confidence: number;
  parsingErrors: string[];
  warnings: string[];
  processingTime: number;
  quality: ParsingQuality;
  structure: ResumeStructure;
  aiAnalysis?: AIParsingResult;
  sourceMetadata: {
    originalTextLength: number;
    extractedSections: string[];
    detectedFormat: string;
    processedAt: Date;
    requestId?: string;
  };
}

// Template matching for resume format detection
export interface ResumeTemplate {
  type: 'chronological' | 'functional' | 'combination' | 'targeted' | 'academic' | 'creative';
  sections: string[];
  commonPatterns: string[];
  confidence: number;
}

// Error handling specific to parsing
export interface ParseError {
  code: string;
  message: string;
  details?: any;
  recoverable: boolean;
  suggestion?: string;
}

// Export all interfaces
export type {
  Resume,
  PersonalInfo,
  Experience,
  Education,
  Skill,
  Project,
  Certification,
  Language,
};

// Default parsing options
export const DEFAULT_PARSING_OPTIONS: ParsingOptions = {
  useAI: true,
  includeProjects: true,
  includeCertifications: true,
  strictValidation: false,
  maxExperienceEntries: 20,
  maxSkillCount: 100,
  preserveOriginalText: false,
  extractDates: true,
  extractLocations: true,
};

// Parsing confidence thresholds
export const CONFIDENCE_THRESHOLDS = {
  EXCELLENT: 90,
  GOOD: 75,
  FAIR: 60,
  POOR: 40,
  UNACCEPTABLE: 20,
} as const;

// Section mapping for standardization
export const SECTION_MAPPINGS: { [key: string]: string } = {
  'work experience': 'experience',
  'employment': 'experience',
  'career history': 'experience',
  'professional experience': 'experience',
  'job experience': 'experience',

  'education': 'education',
  'academic': 'education',
  'educational background': 'education',
  'qualifications': 'education',
  'academic background': 'education',

  'skills': 'skills',
  'technical skills': 'skills',
  'core competencies': 'skills',
  'expertise': 'skills',
  'technologies': 'skills',
  'tools': 'skills',

  'projects': 'projects',
  'portfolio': 'projects',
  'work samples': 'projects',
  'personal projects': 'projects',

  'certifications': 'certifications',
  'certificates': 'certifications',
  'credentials': 'certifications',
  'professional certifications': 'certifications',

  'languages': 'languages',
  'language proficiency': 'languages',
  'fluency': 'languages',

  'summary': 'summary',
  'professional summary': 'summary',
  'about': 'summary',
  'profile': 'summary',
  'objective': 'summary',
  'overview': 'summary',
};