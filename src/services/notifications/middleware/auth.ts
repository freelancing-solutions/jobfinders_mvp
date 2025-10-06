import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    name: string
    role: string
    tier: string
    permissions: string[]
  }
}

interface JWTPayload {
  userId: string
  email: string
  role: string
  iat: number
  exp: number
}

/**
 * Authentication middleware
 */
export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Authentication token required',
      })
      return
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload

    // Get user from database with additional context
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tier: true,
        isActive: true,
        emailVerified: true,
        permissions: {
          select: {
            permission: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User not found',
      })
      return
    }

    if (!user.isActive) {
      res.status(401).json({
        success: false,
        error: 'User account is inactive',
      })
      return
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tier: user.tier || 'free',
      permissions: user.permissions.map(p => p.permission.name),
    }

    next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Invalid authentication token',
      })
      return
    }

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Authentication token expired',
      })
      return
    }

    console.error('Authentication middleware error:', error)
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
    })
  }
}

/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
export async function optionalAuthMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

    if (!token) {
      return next()
    }

    // Try to authenticate, but don't fail if it doesn't work
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          tier: true,
          isActive: true,
          permissions: {
            select: {
              permission: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      })

      if (user && user.isActive) {
        req.user = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tier: user.tier || 'free',
          permissions: user.permissions.map(p => p.permission.name),
        }
      }
    } catch (error) {
      // Ignore authentication errors in optional middleware
    }

    next()
  } catch (error) {
    console.error('Optional authentication middleware error:', error)
    next()
  }
}

/**
 * Role-based authorization middleware
 */
export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        required: roles,
        current: req.user.role,
      })
    }

    next()
  }
}

/**
 * Permission-based authorization middleware
 */
export function requirePermission(...permissions: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      })
    }

    const hasPermission = permissions.some(permission => 
      req.user!.permissions.includes(permission)
    )

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        required: permissions,
        current: req.user.permissions,
      })
    }

    next()
  }
}

/**
 * User tier authorization middleware
 */
export function requireTier(...tiers: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      })
    }

    if (!tiers.includes(req.user.tier)) {
      return res.status(403).json({
        success: false,
        error: 'Upgrade required',
        required: tiers,
        current: req.user.tier,
      })
    }

    next()
  }
}

/**
 * Resource ownership middleware - ensures user can only access their own resources
 */
export function requireOwnership(resourceIdParam: string = 'userId') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      })
    }

    const resourceUserId = req.params[resourceIdParam] || req.body[resourceIdParam] || req.query[resourceIdParam]
    
    if (resourceUserId && resourceUserId !== req.user.id) {
      // Allow admins to access any resource
      if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied - resource ownership required',
        })
      }
    }

    next()
  }
}

/**
 * API key authentication middleware (for webhooks and external integrations)
 */
export function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const apiKey = req.headers['x-api-key'] as string

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'API key required',
      })
    }

    // Validate API key format (should be a secure random string)
    if (!/^[a-zA-Z0-9]{32,}$/.test(apiKey)) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key format',
      })
    }

    // In a real implementation, you would validate against stored API keys
    const validApiKeys = process.env.VALID_API_KEYS?.split(',') || []
    
    if (!validApiKeys.includes(apiKey)) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key',
      })
    }

    next()
  } catch (error) {
    console.error('API key authentication error:', error)
    res.status(500).json({
      success: false,
      error: 'API key validation failed',
    })
  }
}

/**
 * Service-to-service authentication middleware
 */
export function serviceAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const serviceToken = req.headers['x-service-token'] as string

    if (!serviceToken) {
      return res.status(401).json({
        success: false,
        error: 'Service token required',
      })
    }

    // Verify service token
    const decoded = jwt.verify(serviceToken, process.env.SERVICE_JWT_SECRET!) as any

    if (decoded.type !== 'service') {
      return res.status(401).json({
        success: false,
        error: 'Invalid service token',
      })
    }

    // Attach service info to request
    (req as any).service = {
      name: decoded.service,
      permissions: decoded.permissions || [],
    }

    next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid service token',
      })
    }

    console.error('Service authentication error:', error)
    res.status(500).json({
      success: false,
      error: 'Service authentication failed',
    })
  }
}

/**
 * Combined authentication middleware - supports multiple auth methods
 */
export function combinedAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Try JWT authentication first
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith('Bearer ')) {
    return authMiddleware(req, res, next)
  }

  // Try API key authentication
  const apiKey = req.headers['x-api-key']
  if (apiKey) {
    return apiKeyAuth(req, res, next)
  }

  // Try service authentication
  const serviceToken = req.headers['x-service-token']
  if (serviceToken) {
    return serviceAuth(req, res, next)
  }

  // No valid authentication method found
  res.status(401).json({
    success: false,
    error: 'Authentication required - provide Bearer token, API key, or service token',
  })
}

/**
 * Generate service JWT token
 */
export function generateServiceToken(serviceName: string, permissions: string[] = []): string {
  return jwt.sign(
    {
      type: 'service',
      service: serviceName,
      permissions,
    },
    process.env.SERVICE_JWT_SECRET!,
    {
      expiresIn: '1h',
    }
  )
}

/**
 * Validate user session and refresh if needed
 */
export async function validateSession(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        isActive: true,
        emailVerified: true,
        lastLoginAt: true,
      },
    })

    if (!user || !user.isActive) {
      return false
    }

    // Check if session is too old (optional)
    const maxSessionAge = 7 * 24 * 60 * 60 * 1000 // 7 days
    if (user.lastLoginAt && Date.now() - user.lastLoginAt.getTime() > maxSessionAge) {
      return false
    }

    return true
  } catch (error) {
    console.error('Session validation error:', error)
    return false
  }
}

export type { AuthenticatedRequest }