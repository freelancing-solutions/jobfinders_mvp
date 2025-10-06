import { Request, Response, NextFunction } from 'express'
import { z, ZodSchema } from 'zod'

/**
 * Validation middleware for request validation using Zod schemas
 */
export function validateRequest<T>(
  schema: ZodSchema<T>,
  source: 'body' | 'query' | 'params' = 'body'
) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = source === 'body' ? req.body : 
                   source === 'query' ? req.query : 
                   req.params

      const validated = schema.parse(data)
      
      // Replace the original data with validated data
      if (source === 'body') {
        req.body = validated
      } else if (source === 'query') {
        req.query = validated as any
      } else {
        req.params = validated as any
      }
      
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
        })
      }
      
      console.error('Validation middleware error:', error)
      res.status(500).json({
        success: false,
        error: 'Internal validation error',
      })
    }
  }
}

/**
 * Optional validation middleware - validates if data is present
 */
export function validateOptional<T>(
  schema: ZodSchema<T>,
  source: 'body' | 'query' | 'params' = 'body'
) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = source === 'body' ? req.body : 
                   source === 'query' ? req.query : 
                   req.params

      // Skip validation if no data is present
      if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
        return next()
      }

      const validated = schema.parse(data)
      
      // Replace the original data with validated data
      if (source === 'body') {
        req.body = validated
      } else if (source === 'query') {
        req.query = validated as any
      } else {
        req.params = validated as any
      }
      
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
        })
      }
      
      console.error('Optional validation middleware error:', error)
      res.status(500).json({
        success: false,
        error: 'Internal validation error',
      })
    }
  }
}

/**
 * Validate multiple sources at once
 */
export function validateMultiple(validations: {
  body?: ZodSchema<any>
  query?: ZodSchema<any>
  params?: ZodSchema<any>
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors: any[] = []

      // Validate body
      if (validations.body) {
        try {
          req.body = validations.body.parse(req.body)
        } catch (error) {
          if (error instanceof z.ZodError) {
            errors.push(...error.errors.map(err => ({
              source: 'body',
              field: err.path.join('.'),
              message: err.message,
              code: err.code,
            })))
          }
        }
      }

      // Validate query
      if (validations.query) {
        try {
          req.query = validations.query.parse(req.query) as any
        } catch (error) {
          if (error instanceof z.ZodError) {
            errors.push(...error.errors.map(err => ({
              source: 'query',
              field: err.path.join('.'),
              message: err.message,
              code: err.code,
            })))
          }
        }
      }

      // Validate params
      if (validations.params) {
        try {
          req.params = validations.params.parse(req.params) as any
        } catch (error) {
          if (error instanceof z.ZodError) {
            errors.push(...error.errors.map(err => ({
              source: 'params',
              field: err.path.join('.'),
              message: err.message,
              code: err.code,
            })))
          }
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors,
        })
      }

      next()
    } catch (error) {
      console.error('Multiple validation middleware error:', error)
      res.status(500).json({
        success: false,
        error: 'Internal validation error',
      })
    }
  }
}

// Common validation schemas
export const CommonSchemas = {
  // Pagination
  pagination: z.object({
    page: z.string().transform(val => parseInt(val)).pipe(z.number().min(1)).default('1'),
    limit: z.string().transform(val => parseInt(val)).pipe(z.number().min(1).max(100)).default('20'),
  }),

  // Date range
  dateRange: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
  }).refine(data => new Date(data.startDate) <= new Date(data.endDate), {
    message: 'Start date must be before or equal to end date',
    path: ['startDate'],
  }),

  // UUID
  uuid: z.string().uuid(),

  // Email
  email: z.string().email(),

  // Phone number (basic validation)
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),

  // URL
  url: z.string().url(),

  // Non-empty string
  nonEmptyString: z.string().min(1, 'Field cannot be empty'),

  // Positive number
  positiveNumber: z.number().positive(),

  // Non-negative number
  nonNegativeNumber: z.number().min(0),
}

/**
 * Create a validation schema for array of items
 */
export function arrayOf<T>(itemSchema: ZodSchema<T>, options?: {
  minLength?: number
  maxLength?: number
}) {
  let schema = z.array(itemSchema)
  
  if (options?.minLength !== undefined) {
    schema = schema.min(options.minLength)
  }
  
  if (options?.maxLength !== undefined) {
    schema = schema.max(options.maxLength)
  }
  
  return schema
}

/**
 * Create a validation schema for partial updates
 */
export function partialOf<T>(schema: ZodSchema<T>) {
  return schema.partial()
}

/**
 * Sanitize string input
 */
export function sanitizeString(str: string): string {
  return str
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
}

/**
 * Custom validation for notification channels
 */
export const NotificationChannelSchema = z.enum(['email', 'sms', 'push', 'inApp'])

/**
 * Custom validation for notification priority
 */
export const NotificationPrioritySchema = z.enum(['low', 'normal', 'high', 'urgent'])

/**
 * Custom validation for notification status
 */
export const NotificationStatusSchema = z.enum(['pending', 'processing', 'sent', 'delivered', 'failed', 'cancelled'])

/**
 * Validate webhook signature
 */
export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  algorithm: string = 'sha256'
): boolean {
  try {
    const crypto = require('crypto')
    const expectedSignature = crypto
      .createHmac(algorithm, secret)
      .update(payload)
      .digest('hex')
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch (error) {
    console.error('Webhook signature validation error:', error)
    return false
  }
}

/**
 * Middleware to validate webhook signatures
 */
export function validateWebhook(secret: string, headerName: string = 'x-signature') {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const signature = req.headers[headerName] as string
      
      if (!signature) {
        return res.status(401).json({
          success: false,
          error: 'Missing webhook signature',
        })
      }

      const payload = JSON.stringify(req.body)
      const isValid = validateWebhookSignature(payload, signature, secret)
      
      if (!isValid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid webhook signature',
        })
      }
      
      next()
    } catch (error) {
      console.error('Webhook validation error:', error)
      res.status(500).json({
        success: false,
        error: 'Webhook validation failed',
      })
    }
  }
}