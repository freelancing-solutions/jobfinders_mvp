import crypto from 'crypto'
import { authenticator } from 'otplib'
import QRCode from 'qrcode'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { generateSecureToken } from './encryption'

/**
 * Two-Factor Authentication utilities for enhanced security
 * Implements TOTP and backup codes for POPIA compliance
 */

const APP_NAME = 'JobFinders.site'
const BACKUP_CODES_COUNT = 10
const BACKUP_CODE_LENGTH = 8
const TOTP_WINDOW = 1 // Allow 1 step tolerance for time drift

/**
 * Generate TOTP secret for user
 */
export async function generateTOTPSecret(userId: string): Promise<{
  secret: string
  qrCodeUrl: string
  manualEntryKey: string
}> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true }
    })
    
    if (!user) {
      throw new Error('User not found')
    }
    
    // Generate secret
    const secret = authenticator.generateSecret()
    
    // Create service name for QR code
    const serviceName = `${APP_NAME} (${user.email})`
    
    // Generate TOTP URL
    const totpUrl = authenticator.keyuri(user.email, APP_NAME, secret)
    
    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(totpUrl)
    
    // Store secret (encrypted) in database
    await prisma.user.update({
      where: { id: userId },
      data: {
        totpSecret: secret, // This should be encrypted in production
        totpEnabled: false // Not enabled until verified
      }
    })
    
    // Log 2FA setup initiation
    await prisma.auditLog.create({
      data: {
        userId,
        action: '2FA_SETUP_INITIATED',
        resource: 'USER_ACCOUNT',
        details: {
          method: 'TOTP'
        },
        ipAddress: 'System',
        userAgent: 'System'
      }
    })
    
    return {
      secret,
      qrCodeUrl,
      manualEntryKey: secret
    }
    
  } catch (error) {
    console.error('TOTP secret generation error:', error)
    throw new Error('Failed to generate TOTP secret')
  }
}

/**
 * Verify TOTP token and enable 2FA
 */
export async function verifyAndEnableTOTP(
  userId: string,
  token: string,
  ipAddress: string
): Promise<{ success: boolean; message: string; backupCodes?: string[] }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { totpSecret: true, totpEnabled: true }
    })
    
    if (!user || !user.totpSecret) {
      return { success: false, message: 'TOTP not set up for this user' }
    }
    
    if (user.totpEnabled) {
      return { success: false, message: '2FA is already enabled' }
    }
    
    // Verify token
    const isValid = authenticator.verify({
      token,
      secret: user.totpSecret,
      window: TOTP_WINDOW
    })
    
    if (!isValid) {
      // Log failed verification
      await prisma.auditLog.create({
        data: {
          userId,
          action: '2FA_VERIFICATION_FAILED',
          resource: 'USER_ACCOUNT',
          details: {
            method: 'TOTP',
            ipAddress
          },
          ipAddress,
          userAgent: 'System'
        }
      })
      
      return { success: false, message: 'Invalid verification code' }
    }
    
    // Generate backup codes
    const backupCodes = generateBackupCodes()
    const hashedBackupCodes = await Promise.all(
      backupCodes.map(async (code) => {
        const salt = crypto.randomBytes(16).toString('hex')
        const hash = crypto.pbkdf2Sync(code, salt, 100000, 64, 'sha512').toString('hex')
        return `${salt}:${hash}`
      })
    )
    
    // Enable 2FA and store backup codes
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          totpEnabled: true,
          totpEnabledAt: new Date()
        }
      })
      
      // Store backup codes
      await tx.backupCode.createMany({
        data: hashedBackupCodes.map(hashedCode => ({
          userId,
          codeHash: hashedCode,
          used: false
        }))
      })
    })
    
    // Log 2FA enabled
    await prisma.auditLog.create({
      data: {
        userId,
        action: '2FA_ENABLED',
        resource: 'USER_ACCOUNT',
        details: {
          method: 'TOTP',
          backupCodesGenerated: backupCodes.length,
          ipAddress
        },
        ipAddress,
        userAgent: 'System'
      }
    })
    
    return {
      success: true,
      message: '2FA enabled successfully',
      backupCodes
    }
    
  } catch (error) {
    console.error('TOTP verification error:', error)
    return { success: false, message: 'Failed to verify and enable 2FA' }
  }
}

/**
 * Verify TOTP token for login
 */
export async function verifyTOTPForLogin(
  userId: string,
  token: string,
  ipAddress: string
): Promise<{ success: boolean; message: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { totpSecret: true, totpEnabled: true }
    })
    
    if (!user || !user.totpEnabled || !user.totpSecret) {
      return { success: false, message: '2FA not enabled for this user' }
    }
    
    // Check if it's a backup code first
    const backupCodeResult = await verifyBackupCode(userId, token, ipAddress)
    if (backupCodeResult.success) {
      return backupCodeResult
    }
    
    // Verify TOTP token
    const isValid = authenticator.verify({
      token,
      secret: user.totpSecret,
      window: TOTP_WINDOW
    })
    
    if (!isValid) {
      // Log failed verification
      await prisma.auditLog.create({
        data: {
          userId,
          action: '2FA_LOGIN_FAILED',
          resource: 'USER_ACCOUNT',
          details: {
            method: 'TOTP',
            ipAddress
          },
          ipAddress,
          userAgent: 'System'
        }
      })
      
      return { success: false, message: 'Invalid verification code' }
    }
    
    // Log successful 2FA login
    await prisma.auditLog.create({
      data: {
        userId,
        action: '2FA_LOGIN_SUCCESS',
        resource: 'USER_ACCOUNT',
        details: {
          method: 'TOTP',
          ipAddress
        },
        ipAddress,
        userAgent: 'System'
      }
    })
    
    return { success: true, message: '2FA verification successful' }
    
  } catch (error) {
    console.error('TOTP login verification error:', error)
    return { success: false, message: 'Failed to verify 2FA code' }
  }
}

/**
 * Verify backup code
 */
export async function verifyBackupCode(
  userId: string,
  code: string,
  ipAddress: string
): Promise<{ success: boolean; message: string; remainingCodes?: number }> {
  try {
    // Get unused backup codes
    const backupCodes = await prisma.backupCode.findMany({
      where: {
        userId,
        used: false
      }
    })
    
    if (backupCodes.length === 0) {
      return { success: false, message: 'No backup codes available' }
    }
    
    // Check each backup code
    for (const backupCode of backupCodes) {
      const [salt, hash] = backupCode.codeHash.split(':')
      const codeHash = crypto.pbkdf2Sync(code, salt, 100000, 64, 'sha512').toString('hex')
      
      if (crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(codeHash, 'hex'))) {
        // Mark backup code as used
        await prisma.backupCode.update({
          where: { id: backupCode.id },
          data: {
            used: true,
            usedAt: new Date()
          }
        })
        
        // Count remaining codes
        const remainingCodes = await prisma.backupCode.count({
          where: {
            userId,
            used: false
          }
        })
        
        // Log backup code usage
        await prisma.auditLog.create({
          data: {
            userId,
            action: '2FA_BACKUP_CODE_USED',
            resource: 'USER_ACCOUNT',
            details: {
              remainingCodes,
              ipAddress
            },
            ipAddress,
            userAgent: 'System'
          }
        })
        
        return {
          success: true,
          message: 'Backup code verified successfully',
          remainingCodes
        }
      }
    }
    
    // Log failed backup code attempt
    await prisma.auditLog.create({
      data: {
        userId,
        action: '2FA_BACKUP_CODE_FAILED',
        resource: 'USER_ACCOUNT',
        details: {
          ipAddress
        },
        ipAddress,
        userAgent: 'System'
      }
    })
    
    return { success: false, message: 'Invalid backup code' }
    
  } catch (error) {
    console.error('Backup code verification error:', error)
    return { success: false, message: 'Failed to verify backup code' }
  }
}

/**
 * Disable 2FA for user
 */
export async function disable2FA(
  userId: string,
  password: string,
  ipAddress: string
): Promise<{ success: boolean; message: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true, totpEnabled: true }
    })
    
    if (!user) {
      return { success: false, message: 'User not found' }
    }
    
    if (!user.totpEnabled) {
      return { success: false, message: '2FA is not enabled' }
    }
    
    // Verify password (this should use your password verification function)
    const isPasswordValid = await bcrypt.compare(password, user.password)
    
    if (!isPasswordValid) {
      // Log failed attempt
      await prisma.auditLog.create({
        data: {
          userId,
          action: '2FA_DISABLE_FAILED',
          resource: 'USER_ACCOUNT',
          details: {
            reason: 'Invalid password',
            ipAddress
          },
          ipAddress,
          userAgent: 'System'
        }
      })
      
      return { success: false, message: 'Invalid password' }
    }
    
    // Disable 2FA and clean up
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          totpEnabled: false,
          totpSecret: null,
          totpEnabledAt: null
        }
      })
      
      // Delete all backup codes
      await tx.backupCode.deleteMany({
        where: { userId }
      })
    })
    
    // Log 2FA disabled
    await prisma.auditLog.create({
      data: {
        userId,
        action: '2FA_DISABLED',
        resource: 'USER_ACCOUNT',
        details: {
          ipAddress
        },
        ipAddress,
        userAgent: 'System'
      }
    })
    
    return { success: true, message: '2FA disabled successfully' }
    
  } catch (error) {
    console.error('2FA disable error:', error)
    return { success: false, message: 'Failed to disable 2FA' }
  }
}

/**
 * Generate new backup codes
 */
export async function generateNewBackupCodes(
  userId: string,
  password: string,
  ipAddress: string
): Promise<{ success: boolean; message: string; backupCodes?: string[] }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true, totpEnabled: true }
    })
    
    if (!user) {
      return { success: false, message: 'User not found' }
    }
    
    if (!user.totpEnabled) {
      return { success: false, message: '2FA is not enabled' }
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    
    if (!isPasswordValid) {
      return { success: false, message: 'Invalid password' }
    }
    
    // Generate new backup codes
    const backupCodes = generateBackupCodes()
    const hashedBackupCodes = await Promise.all(
      backupCodes.map(async (code) => {
        const salt = crypto.randomBytes(16).toString('hex')
        const hash = crypto.pbkdf2Sync(code, salt, 100000, 64, 'sha512').toString('hex')
        return `${salt}:${hash}`
      })
    )
    
    // Replace old backup codes with new ones
    await prisma.$transaction(async (tx) => {
      // Delete old backup codes
      await tx.backupCode.deleteMany({
        where: { userId }
      })
      
      // Create new backup codes
      await tx.backupCode.createMany({
        data: hashedBackupCodes.map(hashedCode => ({
          userId,
          codeHash: hashedCode,
          used: false
        }))
      })
    })
    
    // Log backup codes regeneration
    await prisma.auditLog.create({
      data: {
        userId,
        action: '2FA_BACKUP_CODES_REGENERATED',
        resource: 'USER_ACCOUNT',
        details: {
          newCodesCount: backupCodes.length,
          ipAddress
        },
        ipAddress,
        userAgent: 'System'
      }
    })
    
    return {
      success: true,
      message: 'New backup codes generated successfully',
      backupCodes
    }
    
  } catch (error) {
    console.error('Backup codes generation error:', error)
    return { success: false, message: 'Failed to generate new backup codes' }
  }
}

/**
 * Get 2FA status for user
 */
export async function get2FAStatus(userId: string): Promise<{
  enabled: boolean
  enabledAt?: Date
  backupCodesRemaining: number
  hasBackupCodes: boolean
}> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        totpEnabled: true,
        totpEnabledAt: true
      }
    })
    
    if (!user) {
      throw new Error('User not found')
    }
    
    const backupCodesRemaining = await prisma.backupCode.count({
      where: {
        userId,
        used: false
      }
    })
    
    return {
      enabled: user.totpEnabled || false,
      enabledAt: user.totpEnabledAt || undefined,
      backupCodesRemaining,
      hasBackupCodes: backupCodesRemaining > 0
    }
    
  } catch (error) {
    console.error('2FA status check error:', error)
    throw error
  }
}

/**
 * Generate backup codes
 */
function generateBackupCodes(): string[] {
  const codes: string[] = []
  
  for (let i = 0; i < BACKUP_CODES_COUNT; i++) {
    const code = crypto.randomBytes(BACKUP_CODE_LENGTH / 2).toString('hex').toUpperCase()
    // Format as XXXX-XXXX for better readability
    const formattedCode = code.match(/.{1,4}/g)?.join('-') || code
    codes.push(formattedCode)
  }
  
  return codes
}

/**
 * Check if user requires 2FA for login
 */
export async function requires2FA(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { totpEnabled: true }
    })
    
    return user?.totpEnabled || false
    
  } catch (error) {
    console.error('2FA requirement check error:', error)
    return false
  }
}

/**
 * Generate recovery codes for account recovery
 */
export async function generateRecoveryCodes(
  userId: string,
  adminUserId: string,
  reason: string
): Promise<{ success: boolean; message: string; recoveryCodes?: string[] }> {
  try {
    // Generate one-time recovery codes
    const recoveryCodes = generateBackupCodes()
    const hashedRecoveryCodes = await Promise.all(
      recoveryCodes.map(async (code) => {
        const salt = crypto.randomBytes(16).toString('hex')
        const hash = crypto.pbkdf2Sync(code, salt, 100000, 64, 'sha512').toString('hex')
        return `${salt}:${hash}`
      })
    )
    
    // Store recovery codes (separate from backup codes)
    await prisma.recoveryCode.createMany({
      data: hashedRecoveryCodes.map(hashedCode => ({
        userId,
        codeHash: hashedCode,
        used: false,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }))
    })
    
    // Log recovery codes generation
    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: '2FA_RECOVERY_CODES_GENERATED',
        resource: 'USER_ACCOUNT',
        details: {
          targetUserId: userId,
          reason,
          codesCount: recoveryCodes.length
        },
        ipAddress: 'System',
        userAgent: 'Admin'
      }
    })
    
    return {
      success: true,
      message: 'Recovery codes generated successfully',
      recoveryCodes
    }
    
  } catch (error) {
    console.error('Recovery codes generation error:', error)
    return { success: false, message: 'Failed to generate recovery codes' }
  }
}