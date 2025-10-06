import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { validatePasswordStrength, generateSecureToken } from './encryption'
import { prisma } from './prisma'

/**
 * Password security utilities for enhanced authentication
 * Implements secure password handling for POPIA compliance
 */

const SALT_ROUNDS = 12
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes
const PASSWORD_RESET_EXPIRY = 60 * 60 * 1000 // 1 hour
const PASSWORD_HISTORY_COUNT = 5

/**
 * Hash password securely
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    // Validate password strength first
    const validation = validatePasswordStrength(password)
    if (!validation.isValid) {
      throw new Error(`Weak password: ${validation.feedback.join(', ')}`)
    }
    
    const salt = await bcrypt.genSalt(SALT_ROUNDS)
    return await bcrypt.hash(password, salt)
    
  } catch (error) {
    console.error('Password hashing error:', error)
    throw new Error('Failed to hash password')
  }
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash)
  } catch (error) {
    console.error('Password verification error:', error)
    return false
  }
}

/**
 * Check if account is locked due to failed login attempts
 */
export async function isAccountLocked(userId: string): Promise<{
  isLocked: boolean
  remainingTime?: number
  attempts: number
}> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        failedLoginAttempts: true,
        lastFailedLogin: true,
        accountLockedUntil: true
      }
    })
    
    if (!user) {
      return { isLocked: false, attempts: 0 }
    }
    
    const now = new Date()
    
    // Check if account is currently locked
    if (user.accountLockedUntil && user.accountLockedUntil > now) {
      const remainingTime = user.accountLockedUntil.getTime() - now.getTime()
      return {
        isLocked: true,
        remainingTime,
        attempts: user.failedLoginAttempts || 0
      }
    }
    
    // Check if we should reset failed attempts (after lockout period)
    if (user.accountLockedUntil && user.accountLockedUntil <= now) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          failedLoginAttempts: 0,
          accountLockedUntil: null,
          lastFailedLogin: null
        }
      })
      
      return { isLocked: false, attempts: 0 }
    }
    
    return {
      isLocked: false,
      attempts: user.failedLoginAttempts || 0
    }
    
  } catch (error) {
    console.error('Account lock check error:', error)
    return { isLocked: false, attempts: 0 }
  }
}

/**
 * Record failed login attempt
 */
export async function recordFailedLogin(userId: string, ipAddress: string): Promise<{
  isLocked: boolean
  remainingAttempts: number
  lockoutTime?: Date
}> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { failedLoginAttempts: true }
    })
    
    if (!user) {
      throw new Error('User not found')
    }
    
    const attempts = (user.failedLoginAttempts || 0) + 1
    const now = new Date()
    
    let updateData: any = {
      failedLoginAttempts: attempts,
      lastFailedLogin: now
    }
    
    // Lock account if max attempts reached
    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      const lockoutTime = new Date(now.getTime() + LOCKOUT_DURATION)
      updateData.accountLockedUntil = lockoutTime
      
      // Log security event
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'ACCOUNT_LOCKED',
          resource: 'USER_ACCOUNT',
          details: {
            reason: 'Max login attempts exceeded',
            attempts,
            ipAddress,
            lockoutUntil: lockoutTime.toISOString()
          },
          ipAddress,
          userAgent: 'System'
        }
      })
      
      await prisma.user.update({
        where: { id: userId },
        data: updateData
      })
      
      return {
        isLocked: true,
        remainingAttempts: 0,
        lockoutTime
      }
    }
    
    await prisma.user.update({
      where: { id: userId },
      data: updateData
    })
    
    // Log failed login attempt
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'LOGIN_FAILED',
        resource: 'USER_ACCOUNT',
        details: {
          attempts,
          ipAddress,
          remainingAttempts: MAX_LOGIN_ATTEMPTS - attempts
        },
        ipAddress,
        userAgent: 'System'
      }
    })
    
    return {
      isLocked: false,
      remainingAttempts: MAX_LOGIN_ATTEMPTS - attempts
    }
    
  } catch (error) {
    console.error('Failed login recording error:', error)
    throw error
  }
}

/**
 * Record successful login and reset failed attempts
 */
export async function recordSuccessfulLogin(userId: string, ipAddress: string, userAgent: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lastFailedLogin: null,
        accountLockedUntil: null,
        lastLogin: new Date()
      }
    })
    
    // Log successful login
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'LOGIN_SUCCESS',
        resource: 'USER_ACCOUNT',
        details: {
          ipAddress,
          userAgent
        },
        ipAddress,
        userAgent
      }
    })
    
  } catch (error) {
    console.error('Successful login recording error:', error)
    throw error
  }
}

/**
 * Generate password reset token
 */
export async function generatePasswordResetToken(userId: string): Promise<{
  token: string
  expiresAt: Date
}> {
  try {
    const token = generateSecureToken(32)
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRY)
    
    // Invalidate any existing reset tokens
    await prisma.passwordResetToken.deleteMany({
      where: { userId }
    })
    
    // Create new reset token
    await prisma.passwordResetToken.create({
      data: {
        userId,
        token,
        expiresAt
      }
    })
    
    // Log password reset request
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'PASSWORD_RESET_REQUESTED',
        resource: 'USER_ACCOUNT',
        details: {
          tokenExpiresAt: expiresAt.toISOString()
        },
        ipAddress: 'System',
        userAgent: 'System'
      }
    })
    
    return { token, expiresAt }
    
  } catch (error) {
    console.error('Password reset token generation error:', error)
    throw new Error('Failed to generate password reset token')
  }
}

/**
 * Verify password reset token
 */
export async function verifyPasswordResetToken(token: string): Promise<{
  isValid: boolean
  userId?: string
  expiresAt?: Date
}> {
  try {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true }
    })
    
    if (!resetToken) {
      return { isValid: false }
    }
    
    const now = new Date()
    if (resetToken.expiresAt < now) {
      // Clean up expired token
      await prisma.passwordResetToken.delete({
        where: { token }
      })
      
      return { isValid: false }
    }
    
    return {
      isValid: true,
      userId: resetToken.userId,
      expiresAt: resetToken.expiresAt
    }
    
  } catch (error) {
    console.error('Password reset token verification error:', error)
    return { isValid: false }
  }
}

/**
 * Reset password using token
 */
export async function resetPasswordWithToken(
  token: string,
  newPassword: string,
  ipAddress: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Verify token
    const tokenVerification = await verifyPasswordResetToken(token)
    if (!tokenVerification.isValid || !tokenVerification.userId) {
      return { success: false, message: 'Invalid or expired reset token' }
    }
    
    const userId = tokenVerification.userId
    
    // Check password against history
    const canUsePassword = await canUseNewPassword(userId, newPassword)
    if (!canUsePassword) {
      return { 
        success: false, 
        message: 'Cannot reuse recent passwords. Please choose a different password.' 
      }
    }
    
    // Hash new password
    const hashedPassword = await hashPassword(newPassword)
    
    // Update password and add to history
    await prisma.$transaction(async (tx) => {
      // Update user password
      await tx.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          passwordChangedAt: new Date(),
          failedLoginAttempts: 0,
          accountLockedUntil: null,
          lastFailedLogin: null
        }
      })
      
      // Add to password history
      await tx.passwordHistory.create({
        data: {
          userId,
          passwordHash: hashedPassword
        }
      })
      
      // Clean up old password history
      const oldPasswords = await tx.passwordHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: PASSWORD_HISTORY_COUNT
      })
      
      if (oldPasswords.length > 0) {
        await tx.passwordHistory.deleteMany({
          where: {
            id: { in: oldPasswords.map(p => p.id) }
          }
        })
      }
      
      // Delete reset token
      await tx.passwordResetToken.delete({
        where: { token }
      })
    })
    
    // Log password reset
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'PASSWORD_RESET_COMPLETED',
        resource: 'USER_ACCOUNT',
        details: {
          ipAddress,
          method: 'reset_token'
        },
        ipAddress,
        userAgent: 'System'
      }
    })
    
    return { success: true, message: 'Password reset successfully' }
    
  } catch (error) {
    console.error('Password reset error:', error)
    return { success: false, message: 'Failed to reset password' }
  }
}

/**
 * Change password for authenticated user
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
  ipAddress: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true }
    })
    
    if (!user) {
      return { success: false, message: 'User not found' }
    }
    
    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      // Log failed password change attempt
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'PASSWORD_CHANGE_FAILED',
          resource: 'USER_ACCOUNT',
          details: {
            reason: 'Invalid current password',
            ipAddress
          },
          ipAddress,
          userAgent: 'System'
        }
      })
      
      return { success: false, message: 'Current password is incorrect' }
    }
    
    // Check if new password is different from current
    const isSamePassword = await verifyPassword(newPassword, user.password)
    if (isSamePassword) {
      return { success: false, message: 'New password must be different from current password' }
    }
    
    // Check password against history
    const canUsePassword = await canUseNewPassword(userId, newPassword)
    if (!canUsePassword) {
      return { 
        success: false, 
        message: 'Cannot reuse recent passwords. Please choose a different password.' 
      }
    }
    
    // Hash new password
    const hashedPassword = await hashPassword(newPassword)
    
    // Update password and add to history
    await prisma.$transaction(async (tx) => {
      // Update user password
      await tx.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          passwordChangedAt: new Date()
        }
      })
      
      // Add to password history
      await tx.passwordHistory.create({
        data: {
          userId,
          passwordHash: hashedPassword
        }
      })
      
      // Clean up old password history
      const oldPasswords = await tx.passwordHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: PASSWORD_HISTORY_COUNT
      })
      
      if (oldPasswords.length > 0) {
        await tx.passwordHistory.deleteMany({
          where: {
            id: { in: oldPasswords.map(p => p.id) }
          }
        })
      }
    })
    
    // Log password change
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'PASSWORD_CHANGED',
        resource: 'USER_ACCOUNT',
        details: {
          ipAddress,
          method: 'user_initiated'
        },
        ipAddress,
        userAgent: 'System'
      }
    })
    
    return { success: true, message: 'Password changed successfully' }
    
  } catch (error) {
    console.error('Password change error:', error)
    return { success: false, message: 'Failed to change password' }
  }
}

/**
 * Check if new password can be used (not in recent history)
 */
async function canUseNewPassword(userId: string, newPassword: string): Promise<boolean> {
  try {
    const passwordHistory = await prisma.passwordHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: PASSWORD_HISTORY_COUNT
    })
    
    for (const historyEntry of passwordHistory) {
      const isMatch = await verifyPassword(newPassword, historyEntry.passwordHash)
      if (isMatch) {
        return false
      }
    }
    
    return true
    
  } catch (error) {
    console.error('Password history check error:', error)
    // If we can't check history, allow the password change
    return true
  }
}

/**
 * Generate secure session token
 */
export function generateSessionToken(): string {
  return generateSecureToken(48)
}

/**
 * Validate session token format
 */
export function isValidSessionToken(token: string): boolean {
  return /^[a-f0-9]{96}$/.test(token)
}

/**
 * Get password security metrics for user
 */
export async function getPasswordSecurityMetrics(userId: string): Promise<{
  lastPasswordChange?: Date
  failedLoginAttempts: number
  isAccountLocked: boolean
  passwordAge: number
  hasRecentFailedLogins: boolean
}> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        passwordChangedAt: true,
        failedLoginAttempts: true,
        accountLockedUntil: true,
        lastFailedLogin: true,
        createdAt: true
      }
    })
    
    if (!user) {
      throw new Error('User not found')
    }
    
    const now = new Date()
    const passwordChangeDate = user.passwordChangedAt || user.createdAt
    const passwordAge = Math.floor((now.getTime() - passwordChangeDate.getTime()) / (1000 * 60 * 60 * 24))
    
    const isAccountLocked = user.accountLockedUntil ? user.accountLockedUntil > now : false
    
    const hasRecentFailedLogins = user.lastFailedLogin 
      ? (now.getTime() - user.lastFailedLogin.getTime()) < (24 * 60 * 60 * 1000)
      : false
    
    return {
      lastPasswordChange: user.passwordChangedAt,
      failedLoginAttempts: user.failedLoginAttempts || 0,
      isAccountLocked,
      passwordAge,
      hasRecentFailedLogins
    }
    
  } catch (error) {
    console.error('Password security metrics error:', error)
    throw error
  }
}

/**
 * Force password reset for user (admin function)
 */
export async function forcePasswordReset(
  userId: string,
  adminUserId: string,
  reason: string
): Promise<{ success: boolean; message: string }> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        forcePasswordReset: true,
        passwordResetReason: reason
      }
    })
    
    // Log admin action
    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'FORCE_PASSWORD_RESET',
        resource: 'USER_ACCOUNT',
        details: {
          targetUserId: userId,
          reason
        },
        ipAddress: 'System',
        userAgent: 'Admin'
      }
    })
    
    return { success: true, message: 'Password reset forced successfully' }
    
  } catch (error) {
    console.error('Force password reset error:', error)
    return { success: false, message: 'Failed to force password reset' }
  }
}