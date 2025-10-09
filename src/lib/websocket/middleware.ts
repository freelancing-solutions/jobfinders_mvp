// WebSocket Middleware
// Authentication, authorization, and error handling middleware for WebSocket connections

import { Socket, NextFunction } from 'socket.io';
import jwt from 'jsonwebtoken';
import { AuthenticatedSocket } from './server';
import { createUnauthorizedError, createRateLimitError } from '../api/error-handler';
import { WebSocketRateLimiter, memoryStore } from '../api/rate-limiter';
import { PrismaClient } from '@prisma/client';
import { UserRole } from '@/types/roles';

const prisma = new PrismaClient();

export interface WebSocketMiddlewareContext {
  socket: AuthenticatedSocket;
  next: NextFunction;
}

export interface AuthenticationOptions {
  secret: string;
  algorithms?: jwt.Algorithm[];
  ignoreExpiration?: boolean;
  issuer?: string;
  audience?: string;
}

export interface RateLimitOptions {
  windowMs: number;
  maxConnections: number;
  maxConnectionsPerUser?: number;
  skipSuccessfulConnections?: boolean;
  skipFailedConnections?: boolean;
}

export interface AuthorizationOptions {
  roles?: string[];
  permissions?: string[];
  checkRoomAccess?: boolean;
  checkMessagePermissions?: boolean;
}

export class WebSocketMiddleware {
  private authOptions: AuthenticationOptions;
  private rateLimitOptions: RateLimitOptions;
  private authorizationOptions: AuthorizationOptions;
  private rateLimiter: WebSocketRateLimiter;
  private connectionCache = new Map<string, CachedConnection>();

  constructor(options?: {
    auth?: Partial<AuthenticationOptions>;
    rateLimit?: Partial<RateLimitOptions>;
    authorization?: Partial<AuthorizationOptions>;
  }) {
    this.authOptions = {
      secret: process.env.JWT_SECRET || 'your-secret-key',
      algorithms: ['HS256'],
      ignoreExpiration: false,
      ...options?.auth
    };

    this.rateLimitOptions = {
      windowMs: 60000, // 1 minute
      maxConnections: 100,
      maxConnectionsPerUser: 5,
      skipSuccessfulConnections: false,
      skipFailedConnections: false,
      ...options?.rateLimit
    };

    this.authorizationOptions = {
      roles: [],
      permissions: [],
      checkRoomAccess: true,
      checkMessagePermissions: true,
      ...options?.authorization
    };

    this.rateLimiter = new WebSocketRateLimiter(memoryStore, {
      windowMs: this.rateLimitOptions.windowMs,
      maxRequests: this.rateLimitOptions.maxConnections
    });

    // Start cleanup interval
    setInterval(() => this.cleanupCache(), 60000); // Every minute
  }

  // Authentication middleware
  authenticate() {
    return async (socket: AuthenticatedSocket, next: NextFunction) => {
      try {
        const token = this.extractToken(socket);
        if (!token) {
          return next(this.createAuthError('No authentication token provided'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, this.authOptions.secret, {
          algorithms: this.authOptions.algorithms,
          ignoreExpiration: this.authOptions.ignoreExpiration,
          issuer: this.authOptions.issuer,
          audience: this.authOptions.audience
        }) as any;

        // Set user information on socket
        socket.userId = decoded.userId || decoded.sub;
        socket.userRole = decoded.role || 'user';
        socket.sessionId = decoded.sessionId;
        socket.isAuthenticated = true;

        // Additional validation
        await this.validateUser(socket);

        next();
      } catch (error) {
        console.error('WebSocket authentication error:', error);
        next(this.createAuthError('Invalid authentication token', error));
      }
    };
  }

  // Rate limiting middleware
  rateLimit() {
    return async (socket: AuthenticatedSocket, next: NextFunction) => {
      try {
        const ip = socket.handshake.address;
        const userId = socket.userId;

        // Check IP-based rate limit
        const canConnectByIP = await this.rateLimiter.checkConnectionLimit(ip);
        if (!canConnectByIP) {
          return next(this.createRateLimitError('IP rate limit exceeded'));
        }

        // Check user-based rate limit
        if (userId && this.rateLimitOptions.maxConnectionsPerUser) {
          const canConnectByUser = await this.checkUserRateLimit(userId);
          if (!canConnectByUser) {
            return next(this.createRateLimitError('User rate limit exceeded'));
          }
        }

        next();
      } catch (error) {
        console.error('WebSocket rate limit error:', error);
        next(this.createRateLimitError('Rate limit check failed'));
      }
    };
  }

  // Authorization middleware
  authorize(requiredRole?: string, requiredPermissions?: string[]) {
    return async (socket: AuthenticatedSocket, next: NextFunction) => {
      try {
        if (!socket.isAuthenticated) {
          return next(this.createAuthError('Authentication required'));
        }

        // Check role requirements
        if (requiredRole && socket.userRole !== requiredRole) {
          return next(this.createAuthError(`Insufficient permissions. Required role: ${requiredRole}`));
        }

        // Check role-based authorization
        if (this.authorizationOptions.roles.length > 0 &&
            !this.authorizationOptions.roles.includes(socket.userRole!)) {
          return next(this.createAuthError('Role not authorized'));
        }

        // Check permissions if user is loaded
        if (requiredPermissions && socket.userId) {
          const userPermissions = await this.getUserPermissions(socket.userId);
          const hasAllPermissions = requiredPermissions.every(perm =>
            userPermissions.includes(perm)
          );

          if (!hasAllPermissions) {
            return next(this.createAuthError('Insufficient permissions'));
          }
        }

        next();
      } catch (error) {
        console.error('WebSocket authorization error:', error);
        next(this.createAuthError('Authorization failed'));
      }
    };
  }

  // Room access middleware
  checkRoomAccess(roomId: string) {
    return async (socket: AuthenticatedSocket, next: NextFunction) => {
      try {
        if (!socket.isAuthenticated) {
          return next(this.createAuthError('Authentication required'));
        }

        const hasAccess = await this.checkRoomMembership(socket.userId!, roomId);
        if (!hasAccess) {
          return next(this.createAuthError('Access denied to room'));
        }

        next();
      } catch (error) {
        console.error('Room access check error:', error);
        next(this.createAuthError('Room access check failed'));
      }
    };
  }

  // Message permissions middleware
  checkMessagePermissions(action: 'send' | 'edit' | 'delete') {
    return async (socket: AuthenticatedSocket, next: NextFunction) => {
      try {
        if (!socket.isAuthenticated) {
          return next(this.createAuthError('Authentication required'));
        }

        const canPerformAction = await this.checkMessageActionPermission(
          socket.userId!,
          socket.userRole!,
          action
        );

        if (!canPerformAction) {
          return next(this.createAuthError(`Insufficient permissions for ${action} action`));
        }

        next();
      } catch (error) {
        console.error('Message permissions check error:', error);
        next(this.createAuthError('Permission check failed'));
      }
    };
  }

  // Error handling middleware
  errorHandler() {
    return (error: Error, socket: AuthenticatedSocket, next: NextFunction) => {
      console.error('WebSocket middleware error:', error);

      // Log error details
      this.logError(error, socket);

      // Send error to client
      socket.emit('middleware-error', {
        message: error.message,
        code: 'MIDDLEWARE_ERROR',
        timestamp: new Date().toISOString()
      });

      // Don't pass error to next to prevent connection termination for non-critical errors
      if (this.isCriticalError(error)) {
        next(error);
      } else {
        next(); // Continue despite error
      }
    };
  }

  // Reconnection handling middleware
  reconnectionHandler() {
    return (socket: AuthenticatedSocket, next: NextFunction) => {
      // Store reconnection attempt info
      socket.data.reconnectionAttempts = (socket.data.reconnectionAttempts || 0) + 1;
      socket.data.lastReconnectionAttempt = new Date();

      // Check reconnection limits
      const maxAttempts = 5;
      if (socket.data.reconnectionAttempts > maxAttempts) {
        return next(this.createAuthError('Too many reconnection attempts'));
      }

      // Apply exponential backoff
      const backoffDelay = Math.min(
        1000 * Math.pow(2, socket.data.reconnectionAttempts - 1),
        30000 // Max 30 seconds
      );

      if (socket.data.reconnectionAttempts > 1) {
        setTimeout(() => {
          next();
        }, backoffDelay);
        return;
      }

      next();
    };
  }

  // Connection caching middleware
  cacheConnection() {
    return (socket: AuthenticatedSocket, next: NextFunction) => {
      if (socket.userId) {
        // Cache connection info
        this.connectionCache.set(socket.userId, {
          socketId: socket.id,
          userId: socket.userId,
          connectedAt: new Date(),
          lastActivity: new Date(),
          ip: socket.handshake.address,
          userAgent: socket.handshake.headers['user-agent']
        });

        // Set up cleanup on disconnect
        socket.on('disconnect', () => {
          this.connectionCache.delete(socket.userId!);
        });
      }

      next();
    };
  }

  // Private helper methods
  private extractToken(socket: Socket): string | null {
    // Try to get token from handshake auth
    const auth = socket.handshake.auth;
    if (auth.token) {
      return auth.token;
    }

    // Try to get token from headers
    const authHeader = socket.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Try to get token from query parameters
    const token = socket.handshake.query.token as string;
    if (token) {
      return token;
    }

    return null;
  }

  private async validateUser(socket: AuthenticatedSocket): Promise<void> {
    if (!socket.userId) return;

    try {
      // Check if user exists and is active
      const user = await prisma.user.findUnique({
        where: { uid: socket.userId },
        select: { uid: true, role: true, isActive: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (!user.isActive) {
        throw new Error('User account is inactive');
      }

      // Update user role from database
      socket.userRole = user.role;
    } catch (error) {
      throw new Error('User validation failed');
    }
  }

  private async getUserPermissions(userId: string): Promise<string[]> {
    try {
      // Get user permissions from database
      const user = await prisma.user.findUnique({
        where: { uid: userId },
        include: {
          adminProfile: true
        }
      });

      if (!user) {
        return [];
      }

      const permissions = new Set<string>();

      // Role-based permissions
      switch (user.role) {
        case UserRole.ADMIN:
          permissions.add('read:all');
          permissions.add('write:all');
          permissions.add('delete:all');
          permissions.add('manage:users');
          permissions.add('manage:system');
          break;
        case UserRole.EMPLOYER:
          permissions.add('read:jobs');
          permissions.add('write:jobs');
          permissions.add('read:applications');
          permissions.add('write:applications');
          break;
        case UserRole.JOB_SEEKER:
          permissions.add('read:jobs');
          permissions.add('write:applications');
          permissions.add('read:matches');
          permissions.add('write:profile');
          break;
      }

      // Additional permissions from admin profile
      if (user.adminProfile) {
        const adminPerms = user.adminProfile.permissions as string[];
        adminPerms.forEach(perm => permissions.add(perm));
      }

      return Array.from(permissions);
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return [];
    }
  }

  private async checkUserRateLimit(userId: string): Promise<boolean> {
    const userConnections = Array.from(this.connectionCache.values())
      .filter(conn => conn.userId === userId)
      .filter(conn => {
        // Remove stale connections
        const now = Date.now();
        return (now - conn.lastActivity.getTime()) < 300000; // 5 minutes
      });

    return userConnections.length < (this.rateLimitOptions.maxConnectionsPerUser || 5);
  }

  private async checkRoomMembership(userId: string, roomId: string): Promise<boolean> {
    try {
      // Check if user is a member of the room
      // This would integrate with your room management system
      return true; // Placeholder
    } catch (error) {
      console.error('Error checking room membership:', error);
      return false;
    }
  }

  private async checkMessageActionPermission(
    userId: string,
    userRole: string,
    action: string
  ): Promise<boolean> {
    // Basic role-based permissions
    const permissions = {
      admin: ['send', 'edit', 'delete'],
      employer: ['send', 'edit'],
      seeker: ['send']
    };

    return permissions[userRole as keyof typeof permissions]?.includes(action) || false;
  }

  private createAuthError(message: string, originalError?: Error): Error {
    const error = new Error(message) as any;
    error.name = 'AuthenticationError';
    error.code = 'AUTHENTICATION_FAILED';
    error.statusCode = 401;
    error.originalError = originalError;
    return error;
  }

  private createRateLimitError(message: string): Error {
    const error = new Error(message) as any;
    error.name = 'RateLimitError';
    error.code = 'RATE_LIMIT_EXCEEDED';
    error.statusCode = 429;
    return error;
  }

  private logError(error: Error, socket: AuthenticatedSocket): void {
    const errorData = {
      message: error.message,
      name: error.name,
      stack: error.stack,
      socketId: socket.id,
      userId: socket.userId,
      userRole: socket.userRole,
      ip: socket.handshake.address,
      userAgent: socket.handshake.headers['user-agent'],
      timestamp: new Date().toISOString()
    };

    console.error('WebSocket middleware error:', errorData);
  }

  private isCriticalError(error: Error): boolean {
    return error.name === 'AuthenticationError' ||
           error.name === 'RateLimitError' ||
           error.message.includes('critical');
  }

  private cleanupCache(): void {
    const now = Date.now();
    const staleThreshold = 300000; // 5 minutes

    for (const [userId, connection] of this.connectionCache.entries()) {
      if ((now - connection.lastActivity.getTime()) > staleThreshold) {
        this.connectionCache.delete(userId);
      }
    }
  }

  // Public methods for external use
  getCachedConnection(userId: string): CachedConnection | null {
    return this.connectionCache.get(userId) || null;
  }

  getConnectionStats(): {
    totalConnections: number;
    connectionsByRole: Record<string, number>;
    connectionsByIP: Record<string, number>;
  } {
    const connections = Array.from(this.connectionCache.values());
    const connectionsByRole: Record<string, number> = {};
    const connectionsByIP: Record<string, number> = {};

    connections.forEach(conn => {
      const role = 'user'; // Would need to fetch from socket or cache
      connectionsByRole[role] = (connectionsByRole[role] || 0) + 1;
      connectionsByIP[conn.ip] = (connectionsByIP[conn.ip] || 0) + 1;
    });

    return {
      totalConnections: connections.length,
      connectionsByRole,
      connectionsByIP
    };
  }
}

// Interface for cached connections
export interface CachedConnection {
  socketId: string;
  userId: string;
  connectedAt: Date;
  lastActivity: Date;
  ip: string;
  userAgent: string;
}

// Factory function for creating middleware
export function createWebSocketMiddleware(options?: {
  auth?: Partial<AuthenticationOptions>;
  rateLimit?: Partial<RateLimitOptions>;
  authorization?: Partial<AuthorizationOptions>;
}): WebSocketMiddleware {
  return new WebSocketMiddleware(options);
}

// Default middleware instance
export const webSocketMiddleware = createWebSocketMiddleware({
  auth: {
    secret: process.env.JWT_SECRET || 'your-secret-key'
  },
  rateLimit: {
    windowMs: 60000,
    maxConnections: 100,
    maxConnectionsPerUser: 5
  },
  authorization: {
    checkRoomAccess: true,
    checkMessagePermissions: true
  }
});

export default WebSocketMiddleware;