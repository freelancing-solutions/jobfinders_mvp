/**
 * Template Engine Error System
 *
 * Comprehensive error handling system for template operations
 * with specific error types, error codes, and detailed error information.
 */

import {
  TemplateError,
  TemplateValidationError,
  TemplateRenderingError,
  TemplateExportError,
  TemplateErrorCode
} from '@/types/template';
import { logger } from '@/lib/logger';
import { eventBus } from '@/lib/events/event-bus';

// Base Template Engine Error
export class TemplateEngineError extends Error {
  public readonly code: TemplateErrorCode;
  public readonly templateId?: string;
  public readonly details?: any;
  public readonly timestamp: Date;
  public readonly userId?: string;

  constructor(
    message: string,
    code: TemplateErrorCode,
    templateId?: string,
    details?: any,
    userId?: string
  ) {
    super(message);
    this.name = 'TemplateEngineError';
    this.code = code;
    this.templateId = templateId;
    this.details = details;
    this.timestamp = new Date();
    this.userId = userId;

    // Log error
    logger.error('Template engine error', {
      code,
      message,
      templateId,
      userId,
      details,
      timestamp: this.timestamp
    });

    // Emit error event
    eventBus.emit('template_engine_error', {
      code,
      message,
      templateId,
      userId,
      details,
      timestamp: this.timestamp
    });

    // Maintain stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TemplateEngineError);
    }
  }

  /**
   * Get error as JSON object
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      templateId: this.templateId,
      details: this.details,
      timestamp: this.timestamp,
      userId: this.userId,
      stack: this.stack
    };
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    const userMessages: Record<TemplateErrorCode, string> = {
      [TemplateErrorCode.TEMPLATE_NOT_FOUND]: 'The requested template could not be found.',
      [TemplateErrorCode.RENDER_FAILED]: 'Failed to generate the resume preview. Please try again.',
      [TemplateErrorCode.EXPORT_FAILED]: 'Failed to export the resume. Please try a different format.',
      [TemplateErrorCode.CUSTOMIZATION_INVALID]: 'The customization options are invalid. Please check your settings.',
      [TemplateErrorCode.VALIDATION_FAILED]: 'The template data is invalid. Please review your information.',
      [TemplateErrorCode.PERMISSION_DENIED]: 'You do not have permission to perform this action.',
      [TemplateErrorCode.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please wait a moment and try again.',
      [TemplateErrorCode.STORAGE_ERROR]: 'A storage error occurred. Please try again later.',
      [TemplateErrorCode.NETWORK_ERROR]: 'A network error occurred. Please check your connection.',
      [TemplateErrorCode.PARSE_ERROR]: 'Failed to process the template data. Please try again.'
    };

    return userMessages[this.code] || 'An unexpected error occurred. Please try again.';
  }

  /**
   * Check if error is retryable
   */
  isRetryable(): boolean {
    const retryableCodes = [
      TemplateErrorCode.NETWORK_ERROR,
      TemplateErrorCode.STORAGE_ERROR,
      TemplateErrorCode.RATE_LIMIT_EXCEEDED,
      TemplateErrorCode.RENDER_FAILED,
      TemplateErrorCode.EXPORT_FAILED
    ];

    return retryableCodes.includes(this.code);
  }

  /**
   * Get suggested retry delay in milliseconds
   */
  getRetryDelay(): number {
    const delays: Record<TemplateErrorCode, number> = {
      [TemplateErrorCode.RATE_LIMIT_EXCEEDED]: 5000, // 5 seconds
      [TemplateErrorCode.NETWORK_ERROR]: 2000, // 2 seconds
      [TemplateErrorCode.STORAGE_ERROR]: 3000, // 3 seconds
      [TemplateErrorCode.RENDER_FAILED]: 1000, // 1 second
      [TemplateErrorCode.EXPORT_FAILED]: 1000, // 1 second
      [TemplateErrorCode.TEMPLATE_NOT_FOUND]: 0, // Not retryable
      [TemplateErrorCode.CUSTOMIZATION_INVALID]: 0, // Not retryable
      [TemplateErrorCode.VALIDATION_FAILED]: 0, // Not retryable
      [TemplateErrorCode.PERMISSION_DENIED]: 0, // Not retryable
      [TemplateErrorCode.PARSE_ERROR]: 0 // Not retryable
    };

    return delays[this.code] || 1000;
  }
}

// Specific Error Types
export class TemplateNotFoundError extends TemplateEngineError {
  constructor(templateId: string, userId?: string) {
    super(
      `Template not found: ${templateId}`,
      TemplateErrorCode.TEMPLATE_NOT_FOUND,
      templateId,
      { templateId },
      userId
    );
    this.name = 'TemplateNotFoundError';
  }
}

export class TemplateRenderingFailedError extends TemplateEngineError {
  constructor(templateId: string, reason: string, details?: any, userId?: string) {
    super(
      `Template rendering failed: ${reason}`,
      TemplateErrorCode.RENDER_FAILED,
      templateId,
      { reason, ...details },
      userId
    );
    this.name = 'TemplateRenderingFailedError';
  }
}

export class TemplateExportFailedError extends TemplateEngineError {
  constructor(templateId: string, format: string, reason: string, details?: any, userId?: string) {
    super(
      `Template export failed for ${format}: ${reason}`,
      TemplateErrorCode.EXPORT_FAILED,
      templateId,
      { format, reason, ...details },
      userId
    );
    this.name = 'TemplateExportFailedError';
  }
}

export class TemplateValidationError extends TemplateEngineError {
  constructor(templateId: string, validationErrors: any[], userId?: string) {
    super(
      'Template validation failed',
      TemplateErrorCode.VALIDATION_FAILED,
      templateId,
      { validationErrors },
      userId
    );
    this.name = 'TemplateValidationError';
  }
}

export class TemplatePermissionDeniedError extends TemplateEngineError {
  constructor(action: string, templateId?: string, userId?: string) {
    super(
      `Permission denied for action: ${action}`,
      TemplateErrorCode.PERMISSION_DENIED,
      templateId,
      { action },
      userId
    );
    this.name = 'TemplatePermissionDeniedError';
  }
}

export class TemplateRateLimitExceededError extends TemplateEngineError {
  constructor(limit: number, window: number, templateId?: string, userId?: string) {
    super(
      `Rate limit exceeded: ${limit} requests per ${window}ms`,
      TemplateErrorCode.RATE_LIMIT_EXCEEDED,
      templateId,
      { limit, window },
      userId
    );
    this.name = 'TemplateRateLimitExceededError';
  }
}

export class TemplateStorageError extends TemplateEngineError {
  constructor(operation: string, reason: string, templateId?: string, userId?: string) {
    super(
      `Storage error during ${operation}: ${reason}`,
      TemplateErrorCode.STORAGE_ERROR,
      templateId,
      { operation, reason },
      userId
    );
    this.name = 'TemplateStorageError';
  }
}

export class TemplateNetworkError extends TemplateEngineError {
  constructor(operation: string, reason: string, templateId?: string, userId?: string) {
    super(
      `Network error during ${operation}: ${reason}`,
      TemplateErrorCode.NETWORK_ERROR,
      templateId,
      { operation, reason },
      userId
    );
    this.name = 'TemplateNetworkError';
  }
}

export class TemplateParseError extends TemplateEngineError {
  constructor(dataType: string, reason: string, templateId?: string, userId?: string) {
    super(
      `Parse error for ${dataType}: ${reason}`,
      TemplateErrorCode.PARSE_ERROR,
      templateId,
      { dataType, reason },
      userId
    );
    this.name = 'TemplateParseError';
  }
}

export class TemplateCustomizationError extends TemplateEngineError {
  constructor(templateId: string, invalidFields: string[], userId?: string) {
    super(
      'Invalid customization options',
      TemplateErrorCode.CUSTOMIZATION_INVALID,
      templateId,
      { invalidFields },
      userId
    );
    this.name = 'TemplateCustomizationError';
  }
}

// Error Factory
export class TemplateEngineErrorFactory {
  static templateNotFound(templateId: string, userId?: string): TemplateNotFoundError {
    return new TemplateNotFoundError(templateId, userId);
  }

  static renderingFailed(templateId: string, reason: string, details?: any, userId?: string): TemplateRenderingFailedError {
    return new TemplateRenderingFailedError(templateId, reason, details, userId);
  }

  static exportFailed(templateId: string, format: string, reason: string, details?: any, userId?: string): TemplateExportFailedError {
    return new TemplateExportFailedError(templateId, format, reason, details, userId);
  }

  static validationFailed(templateId: string, validationErrors: any[], userId?: string): TemplateValidationError {
    return new TemplateValidationError(templateId, validationErrors, userId);
  }

  static permissionDenied(action: string, templateId?: string, userId?: string): TemplatePermissionDeniedError {
    return new TemplatePermissionDeniedError(action, templateId, userId);
  }

  static rateLimitExceeded(limit: number, window: number, templateId?: string, userId?: string): TemplateRateLimitExceededError {
    return new TemplateRateLimitExceededError(limit, window, templateId, userId);
  }

  static storageError(operation: string, reason: string, templateId?: string, userId?: string): TemplateStorageError {
    return new TemplateStorageError(operation, reason, templateId, userId);
  }

  static networkError(operation: string, reason: string, templateId?: string, userId?: string): TemplateNetworkError {
    return new TemplateNetworkError(operation, reason, templateId, userId);
  }

  static parseError(dataType: string, reason: string, templateId?: string, userId?: string): TemplateParseError {
    return new TemplateParseError(dataType, reason, templateId, userId);
  }

  static customizationInvalid(templateId: string, invalidFields: string[], userId?: string): TemplateCustomizationError {
    return new TemplateCustomizationError(templateId, invalidFields, userId);
  }

  static fromError(error: Error, templateId?: string, userId?: string): TemplateEngineError {
    if (error instanceof TemplateEngineError) {
      return error;
    }

    // Try to infer error type from error message
    const message = error.message.toLowerCase();

    if (message.includes('not found')) {
      return new TemplateNotFoundError(templateId || 'unknown', userId);
    }

    if (message.includes('permission') || message.includes('unauthorized')) {
      return new TemplatePermissionDeniedError('unknown', templateId, userId);
    }

    if (message.includes('network') || message.includes('fetch')) {
      return new TemplateNetworkError('unknown', error.message, templateId, userId);
    }

    if (message.includes('parse') || message.includes('json')) {
      return new TemplateParseError('unknown', error.message, templateId, userId);
    }

    if (message.includes('validation')) {
      return new TemplateValidationError(templateId || 'unknown', [{ message: error.message }], userId);
    }

    if (message.includes('render')) {
      return new TemplateRenderingFailedError(templateId || 'unknown', error.message, undefined, userId);
    }

    if (message.includes('export')) {
      return new TemplateExportFailedError(templateId || 'unknown', 'unknown', error.message, undefined, userId);
    }

    // Default generic error
    return new TemplateEngineError(
      error.message,
      TemplateErrorCode.RENDER_FAILED,
      templateId,
      { originalError: error.stack },
      userId
    );
  }
}

// Error Handler and Recovery System
export class TemplateErrorHandler {
  private retryAttempts: Map<string, number> = new Map();
  private maxRetries: number = 3;

  /**
   * Handle template engine error with retry logic
   */
  async handleError<T>(
    error: TemplateEngineError,
    operation: () => Promise<T>,
    context?: { templateId?: string; userId?: string }
  ): Promise<T> {
    const operationKey = `${context?.templateId || 'unknown'}-${context?.userId || 'anonymous'}`;
    const currentAttempts = this.retryAttempts.get(operationKey) || 0;

    // Log error
    logger.error('Handling template engine error', {
      code: error.code,
      message: error.message,
      templateId: context?.templateId,
      userId: context?.userId,
      attempts: currentAttempts,
      maxRetries: this.maxRetries
    });

    // Check if we should retry
    if (error.isRetryable() && currentAttempts < this.maxRetries) {
      const retryDelay = error.getRetryDelay();

      logger.info(`Retrying operation after ${retryDelay}ms`, {
        operationKey,
        attempt: currentAttempts + 1,
        maxRetries: this.maxRetries
      });

      // Update retry count
      this.retryAttempts.set(operationKey, currentAttempts + 1);

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, retryDelay));

      try {
        const result = await operation();

        // Reset retry count on success
        this.retryAttempts.delete(operationKey);

        logger.info('Operation succeeded after retry', {
          operationKey,
          attempts: currentAttempts + 1
        });

        return result;

      } catch (retryError) {
        // Handle retry error recursively
        const retryTemplateError = TemplateEngineErrorFactory.fromError(
          retryError as Error,
          context?.templateId,
          context?.userId
        );

        return this.handleError(retryTemplateError, operation, context);
      }
    }

    // No more retries or not retryable - clear retry count and throw
    this.retryAttempts.delete(operationKey);
    throw error;
  }

  /**
   * Get retry statistics
   */
  getRetryStats() {
    return {
      activeRetries: this.retryAttempts.size,
      maxRetries: this.maxRetries,
      retryDetails: Object.fromEntries(this.retryAttempts)
    };
  }

  /**
   * Clear retry statistics
   */
  clearRetryStats(): void {
    this.retryAttempts.clear();
  }

  /**
   * Set max retries
   */
  setMaxRetries(maxRetries: number): void {
    this.maxRetries = Math.max(0, maxRetries);
    logger.info('Updated max retries', { maxRetries: this.maxRetries });
  }
}

// Create singleton error handler
export const templateErrorHandler = new TemplateErrorHandler();

// Export error types and factory
export {
  TemplateError,
  TemplateValidationError,
  TemplateRenderingError,
  TemplateExportError,
  TemplateErrorCode
};