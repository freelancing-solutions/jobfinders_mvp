/**
 * Resume Builder Service
 *
 * Main entry point for the AI-powered resume builder system.
 * Exports all services, utilities, and types.
 */

// Core services
export { ResumeBuilder } from './resume-builder';
export { ResumeParser } from './parser';
export { AIAnalysisService } from './ai-analysis';
export { TemplateEngine } from './template-engine';
export { FileUploadService } from './file-upload';

// Error handling
export {
  ResumeBuilderServiceError,
  ResumeBuilderErrorFactory,
  ResumeBuilderErrorHandler,
  ValidationError,
  RateLimitError,
  QuotaError,
  withServiceErrorHandling,
  createErrorResponse,
  createSuccessResponse,
} from './errors';

// Utilities
export { ResumeBuilderUtils } from './utils';
export { ATSAnalyzer } from './ats-analyzer';
export { ResumeValidator } from './validator';

// Configuration
export { resumeBuilderConfig } from './config';