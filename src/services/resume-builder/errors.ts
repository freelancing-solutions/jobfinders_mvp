/**
 * Resume Builder Error Handling
 *
 * Centralized error handling utilities for the AI-powered resume builder system.
 * Provides custom error classes and error handling functions.
 */

import { ResumeBuilderError, ErrorCode } from '@/types/resume';

export class ResumeBuilderServiceError extends Error {
  public readonly code: ErrorCode;
  public readonly details?: any;
  public readonly timestamp: Date;
  public readonly requestId?: string;

  constructor(
    code: ErrorCode,
    message: string,
    details?: any,
    requestId?: string
  ) {
    super(message);
    this.name = 'ResumeBuilderServiceError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date();
    this.requestId = requestId;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ResumeBuilderServiceError);
    }
  }

  toJSON(): ResumeBuilderError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
      requestId: this.requestId,
    };
  }
}

// Error factory functions for common error scenarios
export class ResumeBuilderErrorFactory {
  static fileTooLarge(fileSize: number, maxSize: number, requestId?: string) {
    return new ResumeBuilderServiceError(
      'FILE_TOO_LARGE',
      `File size ${fileSize} bytes exceeds maximum allowed size of ${maxSize} bytes`,
      { fileSize, maxSize },
      requestId
    );
  }

  static unsupportedFormat(mimeType: string, requestId?: string) {
    return new ResumeBuilderServiceError(
      'UNSUPPORTED_FORMAT',
      `Unsupported file format: ${mimeType}`,
      { mimeType },
      requestId
    );
  }

  static parsingFailed(error: Error, requestId?: string) {
    return new ResumeBuilderServiceError(
      'PARSING_FAILED',
      `Failed to parse resume file: ${error.message}`,
      { originalError: error.message, stack: error.stack },
      requestId
    );
  }

  static aiServiceError(error: Error, requestId?: string) {
    return new ResumeBuilderServiceError(
      'AI_SERVICE_ERROR',
      `AI service error: ${error.message}`,
      { originalError: error.message, stack: error.stack },
      requestId
    );
  }

  static templateNotFound(templateId: string, requestId?: string) {
    return new ResumeBuilderServiceError(
      'TEMPLATE_NOT_FOUND',
      `Template not found: ${templateId}`,
      { templateId },
      requestId
    );
  }

  static generationFailed(error: Error, requestId?: string) {
    return new ResumeBuilderServiceError(
      'GENERATION_FAILED',
      `Resume generation failed: ${error.message}`,
      { originalError: error.message, stack: error.stack },
      requestId
    );
  }

  static storageError(operation: string, error: Error, requestId?: string) {
    return new ResumeBuilderServiceError(
      'STORAGE_ERROR',
      `Storage error during ${operation}: ${error.message}`,
      { operation, originalError: error.message },
      requestId
    );
  }

  static validationError(field: string, message: string, requestId?: string) {
    return new ResumeBuilderServiceError(
      'VALIDATION_ERROR',
      `Validation error for field '${field}': ${message}`,
      { field },
      requestId
    );
  }

  static rateLimitExceeded(limit: number, window: number, requestId?: string) {
    return new ResumeBuilderServiceError(
      'RATE_LIMIT_EXCEEDED',
      `Rate limit exceeded: ${limit} requests per ${window}ms`,
      { limit, window },
      requestId
    );
  }

  static quotaExceeded(quotaType: string, current: number, limit: number, requestId?: string) {
    return new ResumeBuilderServiceError(
      'QUOTA_EXCEEDED',
      `Quota exceeded for ${quotaType}: ${current}/${limit}`,
      { quotaType, current, limit },
      requestId
    );
  }
}

// Error handling utilities
export class ResumeBuilderErrorHandler {
  static handleError(error: unknown, requestId?: string): ResumeBuilderError {
    if (error instanceof ResumeBuilderServiceError) {
      return error.toJSON();
    }

    if (error instanceof Error) {
      // Convert common errors to our custom error types
      if (error.message.includes('ENOENT') || error.message.includes('file not found')) {
        return ResumeBuilderErrorFactory.storageError('file read', error, requestId).toJSON();
      }

      if (error.message.includes('EACCES') || error.message.includes('permission')) {
        return ResumeBuilderErrorFactory.storageError('file access', error, requestId).toJSON();
      }

      if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
        return new ResumeBuilderServiceError(
          'AI_SERVICE_ERROR',
          `Service timeout: ${error.message}`,
          { originalError: error.message },
          requestId
        ).toJSON();
      }

      // Generic error
      return new ResumeBuilderServiceError(
        'AI_SERVICE_ERROR',
        `Unexpected error: ${error.message}`,
        { originalError: error.message, stack: error.stack },
        requestId
      ).toJSON();
    }

    // Unknown error type
    return new ResumeBuilderServiceError(
      'AI_SERVICE_ERROR',
      'Unknown error occurred',
      { error: String(error) },
      requestId
    ).toJSON();
  }

  static async withErrorHandling<T>(
    operation: () => Promise<T>,
    requestId?: string
  ): Promise<{ data?: T; error?: ResumeBuilderError }> {
    try {
      const data = await operation();
      return { data };
    } catch (error) {
      return { error: this.handleError(error, requestId) };
    }
  }

  static logError(error: ResumeBuilderError, context?: string): void {
    const logMessage = `[${error.code}] ${error.message}`;
    const logContext = context ? ` [Context: ${context}]` : '';
    const logDetails = error.details ? ` | Details: ${JSON.stringify(error.details)}` : '';

    console.error(`[ResumeBuilder]${logContext}${logMessage}${logDetails}`, {
      requestId: error.requestId,
      timestamp: error.timestamp,
      ...error.details,
    });
  }
}

// Async error wrapper for service methods
export function withServiceErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: string
) {
  return async (...args: T): Promise<{ data?: R; error?: ResumeBuilderError }> => {
    const requestId = args[args.length - 1]?.requestId ||
                     (typeof args[0] === 'object' && args[0]?.requestId) ||
                     `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const result = await fn(...args);
      return { data: result };
    } catch (error) {
      const serviceError = ResumeBuilderErrorHandler.handleError(error, requestId);
      ResumeBuilderErrorHandler.logError(serviceError, context);
      return { error: serviceError };
    }
  };
}

// Validation error helper
export class ValidationError extends ResumeBuilderServiceError {
  public readonly field: string;

  constructor(field: string, message: string, requestId?: string) {
    super('VALIDATION_ERROR', `Validation error for field '${field}': ${message}`, { field }, requestId);
    this.field = field;
    this.name = 'ValidationError';
  }
}

// Rate limiting error helper
export class RateLimitError extends ResumeBuilderServiceError {
  public readonly retryAfter: number;

  constructor(retryAfter: number, requestId?: string) {
    super(
      'RATE_LIMIT_EXCEEDED',
      `Rate limit exceeded. Retry after ${retryAfter} seconds`,
      { retryAfter },
      requestId
    );
    this.retryAfter = retryAfter;
    this.name = 'RateLimitError';
  }
}

// Quota error helper
export class QuotaError extends ResumeBuilderServiceError {
  public readonly quotaType: string;
  public readonly current: number;
  public readonly limit: number;

  constructor(quotaType: string, current: number, limit: number, requestId?: string) {
    super(
      'QUOTA_EXCEEDED',
      `Quota exceeded for ${quotaType}: ${current}/${limit}`,
      { quotaType, current, limit },
      requestId
    );
    this.quotaType = quotaType;
    this.current = current;
    this.limit = limit;
    this.name = 'QuotaError';
  }
}

// Utility to create consistent error responses
export const createErrorResponse = (
  code: ErrorCode,
  message: string,
  details?: any,
  requestId?: string
) => ({
  success: false,
  error: {
    code,
    message,
    details,
    timestamp: new Date(),
    requestId,
  },
});

// Utility to create success responses
export const createSuccessResponse = <T>(data: T, requestId?: string) => ({
  success: true,
  data,
  requestId,
  timestamp: new Date(),
});