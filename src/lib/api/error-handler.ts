// API Error Handling Middleware
// Comprehensive error handling for API routes

import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { eventBus, EventType, EventPriority } from '../events';

export enum ErrorCode {
  // Validation Errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',

  // Authentication Errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // Not Found Errors
  NOT_FOUND = 'NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  JOB_NOT_FOUND = 'JOB_NOT_FOUND',
  APPLICATION_NOT_FOUND = 'APPLICATION_NOT_FOUND',

  // Conflict Errors
  CONFLICT = 'CONFLICT',
  DUPLICATE_RESOURCE = 'DUPLICATE_RESOURCE',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  INVALID_STATE = 'INVALID_STATE',

  // Rate Limiting Errors
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',

  // Business Logic Errors
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  INVALID_OPERATION = 'INVALID_OPERATION',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',

  // System Errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',

  // File Handling Errors
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_UPLOAD_FAILED = 'FILE_UPLOAD_FAILED',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',

  // Payment Errors
  PAYMENT_ERROR = 'PAYMENT_ERROR',
  PAYMENT_DECLINED = 'PAYMENT_DECLINED',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  PAYMENT_METHOD_INVALID = 'PAYMENT_METHOD_INVALID'
}

export interface ApiError extends Error {
  code: ErrorCode;
  statusCode: number;
  details?: Record<string, any>;
  isOperational: boolean;
  timestamp: Date;
  requestId?: string;
  userId?: string;
}

export class CustomApiError extends Error implements ApiError {
  code: ErrorCode;
  statusCode: number;
  details?: Record<string, any>;
  isOperational: boolean;
  timestamp: Date;
  requestId?: string;
  userId?: string;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    details?: Record<string, any>,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;
    this.timestamp = new Date();

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CustomApiError);
    }
  }

  toJSON(): Record<string, any> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      isOperational: this.isOperational,
      timestamp: this.timestamp,
      requestId: this.requestId,
      userId: this.userId
    };
  }
}

// Error Factory Functions
export const createValidationError = (
  message: string,
  details?: Record<string, any>
): CustomApiError => {
  return new CustomApiError(
    ErrorCode.VALIDATION_ERROR,
    message,
    400,
    details
  );
};

export const createUnauthorizedError = (
  message: string = 'Unauthorized',
  details?: Record<string, any>
): CustomApiError => {
  return new CustomApiError(
    ErrorCode.UNAUTHORIZED,
    message,
    401,
    details
  );
};

export const createForbiddenError = (
  message: string = 'Forbidden',
  details?: Record<string, any>
): CustomApiError => {
  return new CustomApiError(
    ErrorCode.FORBIDDEN,
    message,
    403,
    details
  );
};

export const createNotFoundError = (
  resource: string,
  identifier?: string
): CustomApiError => {
  const message = identifier ? `${resource} with identifier '${identifier}' not found` : `${resource} not found`;
  return new CustomApiError(
    ErrorCode.NOT_FOUND,
    message,
    404,
    { resource, identifier }
  );
};

export const createConflictError = (
  message: string,
  details?: Record<string, any>
): CustomApiError => {
  return new CustomApiError(
    ErrorCode.CONFLICT,
    message,
    409,
    details
  );
};

export const createRateLimitError = (
  message: string = 'Rate limit exceeded',
  details?: Record<string, any>
): CustomApiError => {
  return new CustomApiError(
    ErrorCode.RATE_LIMIT_EXCEEDED,
    message,
    429,
    details
  );
};

export const createInternalServerError = (
  message: string = 'Internal server error',
  details?: Record<string, any>
): CustomApiError => {
  return new CustomApiError(
    ErrorCode.INTERNAL_SERVER_ERROR,
    message,
    500,
    details,
    false // Mark as non-operational (unexpected)
  );
};

// Error Handler Middleware
export function handleApiError(
  error: Error | CustomApiError,
  request?: NextRequest
): NextResponse {
  const requestId = request?.headers.get('x-request-id') || generateRequestId();
  const timestamp = new Date();

  let apiError: ApiError;

  if (error instanceof CustomApiError) {
    apiError = {
      ...error,
      requestId,
      timestamp
    };
  } else {
    // Convert generic errors to ApiError
    apiError = convertToApiError(error, requestId, timestamp);
  }

  // Log error
  logError(apiError, request);

  // Publish error event for monitoring
  publishErrorEvent(apiError, request);

  // Create error response
  const responseBody = {
    success: false,
    error: {
      code: apiError.code,
      message: apiError.message,
      details: apiError.details,
      timestamp: apiError.timestamp.toISOString(),
      requestId: apiError.requestId
    }
  };

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    responseBody.error.stack = apiError.stack;
  }

  return NextResponse.json(responseBody, {
    status: apiError.statusCode,
    headers: {
      'x-request-id': requestId,
      'content-type': 'application/json'
    }
  });
}

// Convert various error types to ApiError
function convertToApiError(
  error: Error,
  requestId: string,
  timestamp: Date
): ApiError {
  // Zod validation errors
  if (error instanceof ZodError) {
    return new CustomApiError(
      ErrorCode.VALIDATION_ERROR,
      'Validation failed',
      400,
      {
        validationErrors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }))
      }
    );
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(error);
  }

  // Prisma validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    return new CustomApiError(
      ErrorCode.VALIDATION_ERROR,
      'Database validation failed',
      400,
      { originalMessage: error.message }
    );
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return new CustomApiError(
      ErrorCode.INVALID_TOKEN,
      'Invalid authentication token',
      401
    );
  }

  if (error.name === 'TokenExpiredError') {
    return new CustomApiError(
      ErrorCode.TOKEN_EXPIRED,
      'Authentication token has expired',
      401
    );
  }

  // Network errors
  if (error.name === 'FetchError' || error.message.includes('ECONNREFUSED')) {
    return new CustomApiError(
      ErrorCode.NETWORK_ERROR,
      'Network connection failed',
      503,
      { originalMessage: error.message }
    );
  }

  // Timeout errors
  if (error.message.includes('timeout') || error.name === 'TimeoutError') {
    return new CustomApiError(
      ErrorCode.TIMEOUT_ERROR,
      'Request timeout',
      408,
      { originalMessage: error.message }
    );
  }

  // Default internal server error
  return new CustomApiError(
    ErrorCode.INTERNAL_SERVER_ERROR,
    'An unexpected error occurred',
    500,
    {
      originalMessage: process.env.NODE_ENV === 'development' ? error.message : undefined
    },
    false
  );
}

// Handle Prisma-specific errors
function handlePrismaError(error: Prisma.PrismaClientKnownRequestError): CustomApiError {
  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      return new CustomApiError(
        ErrorCode.DUPLICATE_RESOURCE,
        'Resource already exists',
        409,
        { target: error.meta?.target }
      );

    case 'P2025':
      // Record not found
      return new CustomApiError(
        ErrorCode.NOT_FOUND,
        'Resource not found',
        404,
        { cause: error.meta?.cause }
      );

    case 'P2003':
      // Foreign key constraint violation
      return new CustomApiError(
        ErrorCode.CONSTRAINT_VIOLATION,
        'Referenced resource does not exist',
        400,
        { field: error.meta?.field_name }
      );

    case 'P2014':
      // Relation violation
      return new CustomApiError(
        ErrorCode.INVALID_STATE,
        'Invalid relationship state',
        400,
        { relation: error.meta?.relation_name }
      );

    default:
      return new CustomApiError(
        ErrorCode.DATABASE_ERROR,
        'Database operation failed',
        500,
        { code: error.code, meta: error.meta }
      );
  }
}

// Log errors appropriately
function logError(error: ApiError, request?: NextRequest): void {
  const logData = {
    requestId: error.requestId,
    code: error.code,
    message: error.message,
    statusCode: error.statusCode,
    details: error.details,
    isOperational: error.isOperational,
    timestamp: error.timestamp,
    url: request?.url,
    method: request?.method,
    userAgent: request?.headers.get('user-agent'),
    ip: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip'),
    userId: error.userId
  };

  if (error.statusCode >= 500) {
    console.error('Server Error:', logData);
  } else if (error.statusCode >= 400) {
    console.warn('Client Error:', logData);
  } else {
    console.info('Error:', logData);
  }
}

// Publish error events for monitoring
async function publishErrorEvent(error: ApiError, request?: NextRequest): Promise<void> {
  try {
    await eventBus.publish({
      id: `error-${error.requestId}`,
      type: EventType.SYSTEM_ERROR_OCCURRED,
      timestamp: error.timestamp,
      userId: error.userId,
      priority: error.statusCode >= 500 ? EventPriority.HIGH : EventPriority.NORMAL,
      source: 'api-layer',
      payload: {
        errorId: error.requestId,
        errorType: error.code,
        message: error.message,
        stack: error.stack,
        context: {
          url: request?.url,
          method: request?.method,
          statusCode: error.statusCode,
          isOperational: error.isOperational
        },
        severity: error.statusCode >= 500 ? 'high' : 'medium',
        userId: error.userId
      }
    });
  } catch (eventError) {
    console.error('Failed to publish error event:', eventError);
  }
}

// Utility function to generate request ID
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Higher-order function for wrapping API route handlers
export function withErrorHandler<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      const request = args.find(arg => arg instanceof Request) as NextRequest;
      return handleApiError(error as Error, request);
    }
  };
}

// Middleware for Next.js API routes
export function errorHandler(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      return await handler(req, context);
    } catch (error) {
      return handleApiError(error as Error, req);
    }
  };
}

// Validation wrapper
export function withValidation<T>(
  schema: { parse: (data: unknown) => T },
  handler: (data: T, req: NextRequest) => Promise<NextResponse>
) {
  return errorHandler(async (req: NextRequest) => {
    let data: unknown;

    try {
      if (req.method === 'GET') {
        data = Object.fromEntries(req.nextUrl.searchParams);
      } else {
        data = await req.json();
      }

      const validatedData = schema.parse(data);
      return await handler(validatedData, req);
    } catch (error) {
      if (error instanceof ZodError) {
        throw createValidationError('Validation failed', {
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      throw error;
    }
  });
}

export default {
  CustomApiError,
  handleApiError,
  withErrorHandler,
  withValidation,
  createValidationError,
  createUnauthorizedError,
  createForbiddenError,
  createNotFoundError,
  createConflictError,
  createRateLimitError,
  createInternalServerError
};