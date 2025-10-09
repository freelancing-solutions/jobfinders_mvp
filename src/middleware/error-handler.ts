import { NextRequest, NextResponse } from 'next/server'

export interface ApiError extends Error {
  statusCode?: number
  code?: string
  details?: any
}

/**
 * Error handler middleware for API routes
 */
export function errorHandler(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(req)
    } catch (error) {
      console.error('API Error:', error)

      // Handle known API errors
      if (error instanceof ApiError || (error as any).statusCode) {
        const apiError = error as ApiError
        return NextResponse.json(
          {
            error: apiError.message || 'An error occurred',
            code: apiError.code,
            details: apiError.details
          },
          { status: apiError.statusCode || 500 }
        )
      }

      // Handle validation errors
      if (error instanceof Error && error.name === 'ValidationError') {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: error.message
          },
          { status: 400 }
        )
      }

      // Handle database errors
      if (error instanceof Error && error.message.includes('Prisma')) {
        return NextResponse.json(
          {
            error: 'Database error occurred',
            code: 'DATABASE_ERROR'
          },
          { status: 500 }
        )
      }

      // Handle authentication errors
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        return NextResponse.json(
          {
            error: 'Authentication required',
            code: 'UNAUTHORIZED'
          },
          { status: 401 }
        )
      }

      // Handle authorization errors
      if (error instanceof Error && error.message.includes('Forbidden')) {
        return NextResponse.json(
          {
            error: 'Access denied',
            code: 'FORBIDDEN'
          },
          { status: 403 }
        )
      }

      // Handle generic errors
      return NextResponse.json(
        {
          error: 'Internal server error',
          code: 'INTERNAL_ERROR'
        },
        { status: 500 }
      )
    }
  }
}

/**
 * Create a custom API error
 */
export function createApiError(
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: any
): ApiError {
  const error = new Error(message) as ApiError
  error.statusCode = statusCode
  error.code = code
  error.details = details
  return error
}

/**
 * Common error creators
 */
export const errors = {
  badRequest: (message: string = 'Bad request', details?: any) =>
    createApiError(message, 400, 'BAD_REQUEST', details),
  
  unauthorized: (message: string = 'Unauthorized') =>
    createApiError(message, 401, 'UNAUTHORIZED'),
  
  forbidden: (message: string = 'Forbidden') =>
    createApiError(message, 403, 'FORBIDDEN'),
  
  notFound: (message: string = 'Not found') =>
    createApiError(message, 404, 'NOT_FOUND'),
  
  conflict: (message: string = 'Conflict') =>
    createApiError(message, 409, 'CONFLICT'),
  
  tooManyRequests: (message: string = 'Too many requests') =>
    createApiError(message, 429, 'TOO_MANY_REQUESTS'),
  
  internal: (message: string = 'Internal server error') =>
    createApiError(message, 500, 'INTERNAL_ERROR')
}