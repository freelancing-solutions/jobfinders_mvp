import { prisma } from './prisma'
import { maskEmail, maskSensitiveData } from './encryption'

/**
 * Comprehensive audit logging system for POPIA compliance
 * Tracks all critical user actions and system events
 */

export enum AuditAction {
  // Authentication
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  PASSWORD_RESET_REQUESTED = 'PASSWORD_RESET_REQUESTED',
  PASSWORD_RESET_COMPLETED = 'PASSWORD_RESET_COMPLETED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED = 'ACCOUNT_UNLOCKED',
  
  // Two-Factor Authentication
  '2FA_ENABLED' = '2FA_ENABLED',
  '2FA_DISABLED' = '2FA_DISABLED',
  '2FA_SETUP_INITIATED' = '2FA_SETUP_INITIATED',
  '2FA_VERIFICATION_FAILED' = '2FA_VERIFICATION_FAILED',
  '2FA_LOGIN_SUCCESS' = '2FA_LOGIN_SUCCESS',
  '2FA_LOGIN_FAILED' = '2FA_LOGIN_FAILED',
  '2FA_BACKUP_CODE_USED' = '2FA_BACKUP_CODE_USED',
  '2FA_BACKUP_CODE_FAILED' = '2FA_BACKUP_CODE_FAILED',
  '2FA_BACKUP_CODES_REGENERATED' = '2FA_BACKUP_CODES_REGENERATED',
  '2FA_RECOVERY_CODES_GENERATED' = '2FA_RECOVERY_CODES_GENERATED',
  
  // User Management
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_SUSPENDED = 'USER_SUSPENDED',
  USER_REACTIVATED = 'USER_REACTIVATED',
  PROFILE_UPDATED = 'PROFILE_UPDATED',
  EMAIL_CHANGED = 'EMAIL_CHANGED',
  EMAIL_VERIFIED = 'EMAIL_VERIFIED',
  
  // Data Rights (POPIA)
  DATA_ACCESSED = 'DATA_ACCESSED',
  DATA_EXPORTED = 'DATA_EXPORTED',
  DATA_DELETION_REQUESTED = 'DATA_DELETION_REQUESTED',
  DATA_DELETION_COMPLETED = 'DATA_DELETION_COMPLETED',
  DATA_DELETION_CANCELLED = 'DATA_DELETION_CANCELLED',
  DATA_RETENTION_POLICY_APPLIED = 'DATA_RETENTION_POLICY_APPLIED',
  
  // Consent Management
  CONSENT_GIVEN = 'CONSENT_GIVEN',
  CONSENT_WITHDRAWN = 'CONSENT_WITHDRAWN',
  CONSENT_UPDATED = 'CONSENT_UPDATED',
  CONSENT_EXPIRED = 'CONSENT_EXPIRED',
  COOKIE_CONSENT_UPDATED = 'COOKIE_CONSENT_UPDATED',
  
  // Job Applications
  JOB_APPLICATION_CREATED = 'JOB_APPLICATION_CREATED',
  JOB_APPLICATION_UPDATED = 'JOB_APPLICATION_UPDATED',
  JOB_APPLICATION_WITHDRAWN = 'JOB_APPLICATION_WITHDRAWN',
  JOB_APPLICATION_VIEWED = 'JOB_APPLICATION_VIEWED',
  CV_UPLOADED = 'CV_UPLOADED',
  CV_DOWNLOADED = 'CV_DOWNLOADED',
  CV_DELETED = 'CV_DELETED',
  
  // Job Management
  JOB_CREATED = 'JOB_CREATED',
  JOB_UPDATED = 'JOB_UPDATED',
  JOB_DELETED = 'JOB_DELETED',
  JOB_PUBLISHED = 'JOB_PUBLISHED',
  JOB_UNPUBLISHED = 'JOB_UNPUBLISHED',
  JOB_VIEWED = 'JOB_VIEWED',
  JOB_SAVED = 'JOB_SAVED',
  JOB_UNSAVED = 'JOB_UNSAVED',
  
  // Subscriptions & Payments
  SUBSCRIPTION_CREATED = 'SUBSCRIPTION_CREATED',
  SUBSCRIPTION_UPDATED = 'SUBSCRIPTION_UPDATED',
  SUBSCRIPTION_CANCELLED = 'SUBSCRIPTION_CANCELLED',
  PAYMENT_PROCESSED = 'PAYMENT_PROCESSED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  REFUND_REQUESTED = 'REFUND_REQUESTED',
  REFUND_PROCESSED = 'REFUND_PROCESSED',
  
  // Security Events
  SUSPICIOUS_ACTIVITY_DETECTED = 'SUSPICIOUS_ACTIVITY_DETECTED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  UNAUTHORIZED_ACCESS_ATTEMPT = 'UNAUTHORIZED_ACCESS_ATTEMPT',
  SECURITY_SCAN_COMPLETED = 'SECURITY_SCAN_COMPLETED',
  MALWARE_DETECTED = 'MALWARE_DETECTED',
  
  // Content Moderation
  CONTENT_FLAGGED = 'CONTENT_FLAGGED',
  CONTENT_APPROVED = 'CONTENT_APPROVED',
  CONTENT_REJECTED = 'CONTENT_REJECTED',
  CONTENT_REMOVED = 'CONTENT_REMOVED',
  USER_REPORTED = 'USER_REPORTED',
  
  // Admin Actions
  ADMIN_LOGIN = 'ADMIN_LOGIN',
  ADMIN_ACTION_PERFORMED = 'ADMIN_ACTION_PERFORMED',
  FORCE_PASSWORD_RESET = 'FORCE_PASSWORD_RESET',
  USER_IMPERSONATION_STARTED = 'USER_IMPERSONATION_STARTED',
  USER_IMPERSONATION_ENDED = 'USER_IMPERSONATION_ENDED',
  
  // System Events
  SYSTEM_BACKUP_COMPLETED = 'SYSTEM_BACKUP_COMPLETED',
  SYSTEM_MAINTENANCE_STARTED = 'SYSTEM_MAINTENANCE_STARTED',
  SYSTEM_MAINTENANCE_COMPLETED = 'SYSTEM_MAINTENANCE_COMPLETED',
  DATA_BREACH_DETECTED = 'DATA_BREACH_DETECTED',
  INCIDENT_RESPONSE_TRIGGERED = 'INCIDENT_RESPONSE_TRIGGERED'
}

export enum AuditResource {
  USER_ACCOUNT = 'USER_ACCOUNT',
  USER_PROFILE = 'USER_PROFILE',
  JOB_LISTING = 'JOB_LISTING',
  JOB_APPLICATION = 'JOB_APPLICATION',
  DOCUMENT = 'DOCUMENT',
  SUBSCRIPTION = 'SUBSCRIPTION',
  PAYMENT = 'PAYMENT',
  CONSENT_RECORD = 'CONSENT_RECORD',
  SYSTEM = 'SYSTEM',
  ADMIN_PANEL = 'ADMIN_PANEL'
}

export interface AuditLogEntry {
  userId?: string
  action: AuditAction
  resource: AuditResource
  resourceId?: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  sessionId?: string
  success?: boolean
  errorMessage?: string
  metadata?: Record<string, any>
}

/**
 * Main audit logging function
 */
export async function auditLog(entry: AuditLogEntry): Promise<void> {
  try {
    // Sanitize sensitive data in details
    const sanitizedDetails = sanitizeAuditDetails(entry.details)
    
    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId,
        details: sanitizedDetails,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent ? entry.userAgent.substring(0, 500) : undefined, // Limit length
        sessionId: entry.sessionId,
        success: entry.success ?? true,
        errorMessage: entry.errorMessage,
        metadata: entry.metadata,
        timestamp: new Date()
      }
    })
    
    // Check for critical security events
    await checkCriticalSecurityEvent(entry)
    
  } catch (error) {
    console.error('Audit logging failed:', error)
    // Don't throw error to avoid breaking the main application flow
    // But log to system error log
    console.error('Failed to create audit log:', {
      action: entry.action,
      userId: entry.userId,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

/**
 * Sanitize sensitive data in audit details
 */
function sanitizeAuditDetails(details?: Record<string, any>): Record<string, any> | undefined {
  if (!details) return undefined
  
  const sanitized = { ...details }
  
  // List of sensitive fields to mask
  const sensitiveFields = [
    'password', 'token', 'secret', 'key', 'hash',
    'creditCard', 'bankAccount', 'ssn', 'idNumber',
    'totpSecret', 'backupCodes', 'recoveryCode'
  ]
  
  // Recursively sanitize object
  function sanitizeObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject)
    }
    
    const sanitizedObj: any = {}
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase()
      
      if (sensitiveFields.some(field => lowerKey.includes(field))) {
        sanitizedObj[key] = '[REDACTED]'
      } else if (key === 'email' && typeof value === 'string') {
        sanitizedObj[key] = maskEmail(value)
      } else if (typeof value === 'string' && value.length > 50 && 
                 (lowerKey.includes('data') || lowerKey.includes('content'))) {
        sanitizedObj[key] = maskSensitiveData(value, 10)
      } else {
        sanitizedObj[key] = sanitizeObject(value)
      }
    }
    
    return sanitizedObj
  }
  
  return sanitizeObject(sanitized)
}

/**
 * Check for critical security events and trigger alerts
 */
async function checkCriticalSecurityEvent(entry: AuditLogEntry): Promise<void> {
  const criticalEvents = [
    AuditAction.DATA_BREACH_DETECTED,
    AuditAction.MALWARE_DETECTED,
    AuditAction.UNAUTHORIZED_ACCESS_ATTEMPT,
    AuditAction.SUSPICIOUS_ACTIVITY_DETECTED
  ]
  
  if (criticalEvents.includes(entry.action)) {
    // Log critical event separately
    console.error('CRITICAL SECURITY EVENT:', {
      action: entry.action,
      userId: entry.userId,
      ipAddress: entry.ipAddress,
      timestamp: new Date().toISOString(),
      details: entry.details
    })
    
    // Here you could integrate with alerting systems like:
    // - Email notifications
    // - Slack/Teams webhooks
    // - SMS alerts
    // - Security incident management systems
  }
}

/**
 * Specialized audit functions for common actions
 */

export async function auditUserLogin(
  userId: string,
  success: boolean,
  ipAddress: string,
  userAgent: string,
  details?: Record<string, any>
): Promise<void> {
  await auditLog({
    userId,
    action: success ? AuditAction.LOGIN_SUCCESS : AuditAction.LOGIN_FAILED,
    resource: AuditResource.USER_ACCOUNT,
    ipAddress,
    userAgent,
    success,
    details
  })
}

export async function auditDataAccess(
  userId: string,
  dataType: string,
  ipAddress: string,
  userAgent: string,
  details?: Record<string, any>
): Promise<void> {
  await auditLog({
    userId,
    action: AuditAction.DATA_ACCESSED,
    resource: AuditResource.USER_ACCOUNT,
    ipAddress,
    userAgent,
    details: {
      dataType,
      ...details
    }
  })
}

export async function auditConsentChange(
  userId: string,
  consentType: string,
  granted: boolean,
  ipAddress: string,
  details?: Record<string, any>
): Promise<void> {
  await auditLog({
    userId,
    action: granted ? AuditAction.CONSENT_GIVEN : AuditAction.CONSENT_WITHDRAWN,
    resource: AuditResource.CONSENT_RECORD,
    ipAddress,
    details: {
      consentType,
      granted,
      ...details
    }
  })
}

export async function auditJobApplication(
  userId: string,
  jobId: string,
  action: 'created' | 'updated' | 'withdrawn',
  ipAddress: string,
  details?: Record<string, any>
): Promise<void> {
  const actionMap = {
    created: AuditAction.JOB_APPLICATION_CREATED,
    updated: AuditAction.JOB_APPLICATION_UPDATED,
    withdrawn: AuditAction.JOB_APPLICATION_WITHDRAWN
  }
  
  await auditLog({
    userId,
    action: actionMap[action],
    resource: AuditResource.JOB_APPLICATION,
    resourceId: jobId,
    ipAddress,
    details
  })
}

export async function auditDocumentAction(
  userId: string,
  documentId: string,
  action: 'uploaded' | 'downloaded' | 'deleted',
  ipAddress: string,
  details?: Record<string, any>
): Promise<void> {
  const actionMap = {
    uploaded: AuditAction.CV_UPLOADED,
    downloaded: AuditAction.CV_DOWNLOADED,
    deleted: AuditAction.CV_DELETED
  }
  
  await auditLog({
    userId,
    action: actionMap[action],
    resource: AuditResource.DOCUMENT,
    resourceId: documentId,
    ipAddress,
    details
  })
}

export async function auditPaymentAction(
  userId: string,
  paymentId: string,
  action: 'processed' | 'failed' | 'refunded',
  amount: number,
  currency: string,
  ipAddress: string,
  details?: Record<string, any>
): Promise<void> {
  const actionMap = {
    processed: AuditAction.PAYMENT_PROCESSED,
    failed: AuditAction.PAYMENT_FAILED,
    refunded: AuditAction.REFUND_PROCESSED
  }
  
  await auditLog({
    userId,
    action: actionMap[action],
    resource: AuditResource.PAYMENT,
    resourceId: paymentId,
    ipAddress,
    details: {
      amount,
      currency,
      ...details
    }
  })
}

export async function auditSecurityEvent(
  action: AuditAction,
  userId?: string,
  ipAddress?: string,
  details?: Record<string, any>
): Promise<void> {
  await auditLog({
    userId,
    action,
    resource: AuditResource.SYSTEM,
    ipAddress,
    details
  })
}

export async function auditAdminAction(
  adminUserId: string,
  action: string,
  targetUserId?: string,
  ipAddress?: string,
  details?: Record<string, any>
): Promise<void> {
  await auditLog({
    userId: adminUserId,
    action: AuditAction.ADMIN_ACTION_PERFORMED,
    resource: AuditResource.ADMIN_PANEL,
    resourceId: targetUserId,
    ipAddress,
    details: {
      adminAction: action,
      targetUserId,
      ...details
    }
  })
}

/**
 * Query audit logs with filtering and pagination
 */
export async function getAuditLogs(filters: {
  userId?: string
  action?: AuditAction
  resource?: AuditResource
  startDate?: Date
  endDate?: Date
  ipAddress?: string
  success?: boolean
  page?: number
  limit?: number
}): Promise<{
  logs: any[]
  total: number
  page: number
  totalPages: number
}> {
  try {
    const page = filters.page || 1
    const limit = Math.min(filters.limit || 50, 100) // Max 100 per page
    const skip = (page - 1) * limit
    
    const where: any = {}
    
    if (filters.userId) where.userId = filters.userId
    if (filters.action) where.action = filters.action
    if (filters.resource) where.resource = filters.resource
    if (filters.ipAddress) where.ipAddress = filters.ipAddress
    if (filters.success !== undefined) where.success = filters.success
    
    if (filters.startDate || filters.endDate) {
      where.timestamp = {}
      if (filters.startDate) where.timestamp.gte = filters.startDate
      if (filters.endDate) where.timestamp.lte = filters.endDate
    }
    
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              email: true,
              name: true
            }
          }
        }
      }),
      prisma.auditLog.count({ where })
    ])
    
    return {
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    }
    
  } catch (error) {
    console.error('Audit log query error:', error)
    throw new Error('Failed to retrieve audit logs')
  }
}

/**
 * Get audit statistics for dashboard
 */
export async function getAuditStatistics(timeframe: 'day' | 'week' | 'month' = 'week'): Promise<{
  totalEvents: number
  securityEvents: number
  failedLogins: number
  dataAccesses: number
  consentChanges: number
  topActions: Array<{ action: string; count: number }>
  topUsers: Array<{ userId: string; email: string; count: number }>
}> {
  try {
    const now = new Date()
    let startDate: Date
    
    switch (timeframe) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
    }
    
    const [
      totalEvents,
      securityEvents,
      failedLogins,
      dataAccesses,
      consentChanges,
      actionStats,
      userStats
    ] = await Promise.all([
      // Total events
      prisma.auditLog.count({
        where: { timestamp: { gte: startDate } }
      }),
      
      // Security events
      prisma.auditLog.count({
        where: {
          timestamp: { gte: startDate },
          action: {
            in: [
              AuditAction.SUSPICIOUS_ACTIVITY_DETECTED,
              AuditAction.UNAUTHORIZED_ACCESS_ATTEMPT,
              AuditAction.RATE_LIMIT_EXCEEDED,
              AuditAction.MALWARE_DETECTED
            ]
          }
        }
      }),
      
      // Failed logins
      prisma.auditLog.count({
        where: {
          timestamp: { gte: startDate },
          action: AuditAction.LOGIN_FAILED
        }
      }),
      
      // Data accesses
      prisma.auditLog.count({
        where: {
          timestamp: { gte: startDate },
          action: {
            in: [
              AuditAction.DATA_ACCESSED,
              AuditAction.DATA_EXPORTED
            ]
          }
        }
      }),
      
      // Consent changes
      prisma.auditLog.count({
        where: {
          timestamp: { gte: startDate },
          action: {
            in: [
              AuditAction.CONSENT_GIVEN,
              AuditAction.CONSENT_WITHDRAWN,
              AuditAction.CONSENT_UPDATED
            ]
          }
        }
      }),
      
      // Top actions
      prisma.auditLog.groupBy({
        by: ['action'],
        where: { timestamp: { gte: startDate } },
        _count: { action: true },
        orderBy: { _count: { action: 'desc' } },
        take: 10
      }),
      
      // Top users
      prisma.auditLog.groupBy({
        by: ['userId'],
        where: { 
          timestamp: { gte: startDate },
          userId: { not: null }
        },
        _count: { userId: true },
        orderBy: { _count: { userId: 'desc' } },
        take: 10
      })
    ])
    
    // Get user details for top users
    const userIds = userStats.map(stat => stat.userId).filter(Boolean)
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true }
    })
    
    const topUsers = userStats.map(stat => {
      const user = users.find(u => u.id === stat.userId)
      return {
        userId: stat.userId,
        email: user?.email || 'Unknown',
        count: stat._count.userId
      }
    })
    
    return {
      totalEvents,
      securityEvents,
      failedLogins,
      dataAccesses,
      consentChanges,
      topActions: actionStats.map(stat => ({
        action: stat.action,
        count: stat._count.action
      })),
      topUsers
    }
    
  } catch (error) {
    console.error('Audit statistics error:', error)
    throw new Error('Failed to retrieve audit statistics')
  }
}

/**
 * Clean up old audit logs based on retention policy
 */
export async function cleanupOldAuditLogs(retentionDays: number = 365): Promise<{
  deletedCount: number
}> {
  try {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)
    
    const result = await prisma.auditLog.deleteMany({
      where: {
        timestamp: { lt: cutoffDate },
        // Keep critical security events longer
        action: {
          notIn: [
            AuditAction.DATA_BREACH_DETECTED,
            AuditAction.MALWARE_DETECTED,
            AuditAction.UNAUTHORIZED_ACCESS_ATTEMPT,
            AuditAction.SUSPICIOUS_ACTIVITY_DETECTED
          ]
        }
      }
    })
    
    // Log the cleanup action
    await auditLog({
      action: AuditAction.DATA_RETENTION_POLICY_APPLIED,
      resource: AuditResource.SYSTEM,
      details: {
        retentionDays,
        deletedCount: result.count,
        cutoffDate: cutoffDate.toISOString()
      }
    })
    
    return { deletedCount: result.count }
    
  } catch (error) {
    console.error('Audit log cleanup error:', error)
    throw new Error('Failed to cleanup old audit logs')
  }
}