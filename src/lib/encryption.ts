import crypto from 'crypto'

/**
 * Encryption utilities for enhanced security and POPIA compliance
 * Provides AES-256-GCM encryption for sensitive data
 */

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32 // 256 bits
const IV_LENGTH = 16 // 128 bits
const TAG_LENGTH = 16 // 128 bits

/**
 * Get encryption key from environment or generate one
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  
  if (!key) {
    console.warn('ENCRYPTION_KEY not set in environment variables. Using default key for development.')
    // In production, this should throw an error
    return crypto.scryptSync('default-dev-key-change-in-production', 'salt', KEY_LENGTH)
  }
  
  // If key is hex-encoded
  if (key.length === KEY_LENGTH * 2) {
    return Buffer.from(key, 'hex')
  }
  
  // If key is base64-encoded
  if (key.length === Math.ceil(KEY_LENGTH * 4 / 3)) {
    return Buffer.from(key, 'base64')
  }
  
  // Derive key from string
  return crypto.scryptSync(key, 'jobfinders-salt', KEY_LENGTH)
}

/**
 * Encrypt sensitive data
 */
export function encrypt(plaintext: string): string {
  try {
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(IV_LENGTH)
    
    const cipher = crypto.createCipher(ALGORITHM, key)
    cipher.setAAD(Buffer.from('jobfinders-aad')) // Additional authenticated data
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const tag = cipher.getAuthTag()
    
    // Combine IV, tag, and encrypted data
    const result = iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted
    
    return result
    
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

/**
 * Decrypt sensitive data
 */
export function decrypt(encryptedData: string): string {
  try {
    const key = getEncryptionKey()
    const parts = encryptedData.split(':')
    
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format')
    }
    
    const iv = Buffer.from(parts[0], 'hex')
    const tag = Buffer.from(parts[1], 'hex')
    const encrypted = parts[2]
    
    const decipher = crypto.createDecipher(ALGORITHM, key)
    decipher.setAuthTag(tag)
    decipher.setAAD(Buffer.from('jobfinders-aad'))
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
    
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt data')
  }
}

/**
 * Hash sensitive data (one-way)
 */
export function hash(data: string, salt?: string): string {
  try {
    const actualSalt = salt || crypto.randomBytes(16).toString('hex')
    const hash = crypto.pbkdf2Sync(data, actualSalt, 100000, 64, 'sha512')
    
    return actualSalt + ':' + hash.toString('hex')
    
  } catch (error) {
    console.error('Hashing error:', error)
    throw new Error('Failed to hash data')
  }
}

/**
 * Verify hashed data
 */
export function verifyHash(data: string, hashedData: string): boolean {
  try {
    const parts = hashedData.split(':')
    if (parts.length !== 2) {
      return false
    }
    
    const salt = parts[0]
    const originalHash = parts[1]
    
    const hash = crypto.pbkdf2Sync(data, salt, 100000, 64, 'sha512')
    const newHash = hash.toString('hex')
    
    return crypto.timingSafeEqual(Buffer.from(originalHash, 'hex'), Buffer.from(newHash, 'hex'))
    
  } catch (error) {
    console.error('Hash verification error:', error)
    return false
  }
}

/**
 * Generate secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

/**
 * Generate secure random password
 */
export function generateSecurePassword(length: number = 16): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, charset.length)
    password += charset[randomIndex]
  }
  
  return password
}

/**
 * Encrypt personal identifiable information (PII)
 * Special handling for POPIA compliance
 */
export function encryptPII(piiData: Record<string, any>): Record<string, string> {
  const encrypted: Record<string, string> = {}
  
  for (const [key, value] of Object.entries(piiData)) {
    if (value !== null && value !== undefined) {
      encrypted[key] = encrypt(JSON.stringify(value))
    }
  }
  
  return encrypted
}

/**
 * Decrypt personal identifiable information (PII)
 */
export function decryptPII(encryptedPII: Record<string, string>): Record<string, any> {
  const decrypted: Record<string, any> = {}
  
  for (const [key, encryptedValue] of Object.entries(encryptedPII)) {
    try {
      const decryptedValue = decrypt(encryptedValue)
      decrypted[key] = JSON.parse(decryptedValue)
    } catch (error) {
      console.error(`Failed to decrypt PII field ${key}:`, error)
      decrypted[key] = null
    }
  }
  
  return decrypted
}

/**
 * Mask sensitive data for logging
 */
export function maskSensitiveData(data: string, visibleChars: number = 4): string {
  if (!data || data.length <= visibleChars) {
    return '*'.repeat(data?.length || 0)
  }
  
  const visible = data.slice(0, visibleChars)
  const masked = '*'.repeat(data.length - visibleChars)
  
  return visible + masked
}

/**
 * Mask email address for logging
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) {
    return '***@***.***'
  }
  
  const [localPart, domain] = email.split('@')
  const maskedLocal = localPart.length > 2 
    ? localPart.slice(0, 2) + '*'.repeat(localPart.length - 2)
    : '*'.repeat(localPart.length)
  
  const domainParts = domain.split('.')
  const maskedDomain = domainParts.map(part => 
    part.length > 2 ? part.slice(0, 1) + '*'.repeat(part.length - 2) + part.slice(-1) : part
  ).join('.')
  
  return `${maskedLocal}@${maskedDomain}`
}

/**
 * Generate encryption key for environment setup
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex')
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean
  score: number
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0
  
  // Length check
  if (password.length >= 8) {
    score += 1
  } else {
    feedback.push('Password must be at least 8 characters long')
  }
  
  if (password.length >= 12) {
    score += 1
  }
  
  // Character variety checks
  if (/[a-z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Password must contain lowercase letters')
  }
  
  if (/[A-Z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Password must contain uppercase letters')
  }
  
  if (/[0-9]/.test(password)) {
    score += 1
  } else {
    feedback.push('Password must contain numbers')
  }
  
  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 1
  } else {
    feedback.push('Password must contain special characters')
  }
  
  // Common patterns check
  const commonPatterns = [
    /123456/,
    /password/i,
    /qwerty/i,
    /abc123/i,
    /admin/i,
    /letmein/i,
  ]
  
  const hasCommonPattern = commonPatterns.some(pattern => pattern.test(password))
  if (hasCommonPattern) {
    score -= 2
    feedback.push('Password contains common patterns')
  }
  
  // Sequential characters check
  if (/(.)\1{2,}/.test(password)) {
    score -= 1
    feedback.push('Password contains repeated characters')
  }
  
  const isValid = score >= 4 && feedback.length === 0
  
  return {
    isValid,
    score: Math.max(0, Math.min(6, score)),
    feedback
  }
}

/**
 * Secure comparison of strings (timing-safe)
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }
  
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

/**
 * Generate HMAC signature for data integrity
 */
export function generateHMAC(data: string, secret?: string): string {
  const key = secret || process.env.HMAC_SECRET || 'default-hmac-secret'
  return crypto.createHmac('sha256', key).update(data).digest('hex')
}

/**
 * Verify HMAC signature
 */
export function verifyHMAC(data: string, signature: string, secret?: string): boolean {
  const expectedSignature = generateHMAC(data, secret)
  return secureCompare(signature, expectedSignature)
}