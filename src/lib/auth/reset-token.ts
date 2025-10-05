import crypto from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * Generate a secure password reset token
 * @returns Object with plain token (for email) and hashed token (for database)
 */
export async function generateResetToken() {
  // Generate a cryptographically secure random token
  const plainToken = crypto.randomBytes(32).toString('hex');
  
  // Hash the token for database storage
  const hashedToken = await hashToken(plainToken);
  
  // Set expiration time (1 hour from now)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);
  
  return {
    token: plainToken,
    hashedToken,
    expiresAt,
  };
}

/**
 * Hash a token for database storage
 * @param token - Plain text token
 * @returns Hashed token
 */
export async function hashToken(token: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(token, saltRounds);
}

/**
 * Verify a token against its hash
 * @param plainToken - Plain text token from URL
 * @param hashedToken - Hashed token from database
 * @returns Boolean indicating if token matches
 */
export async function verifyToken(plainToken: string, hashedToken: string): Promise<boolean> {
  return bcrypt.compare(plainToken, hashedToken);
}

/**
 * Check if a token has expired
 * @param expiresAt - Expiration date from database
 * @returns Boolean indicating if token is expired
 */
export function isTokenExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

/**
 * Generate a secure random string for various purposes
 * @param length - Length of the string to generate
 * @returns Random string
 */
export function generateSecureRandomString(length: number = 32): string {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

/**
 * Create a password reset link
 * @param token - Plain text reset token
 * @returns Full reset password URL
 */
export function createResetPasswordLink(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/auth/reset-password?token=${token}`;
}

/**
 * Validate token format
 * @param token - Token to validate
 * @returns Boolean indicating if token format is valid
 */
export function isValidTokenFormat(token: string): boolean {
  // Check if token is a hex string of reasonable length (64 chars for 32 bytes)
  return /^[a-f0-9]{64}$/i.test(token);
}

/**
 * Sanitize and validate email address
 * @param email - Email address to validate
 * @returns Sanitized email address or null if invalid
 */
export function sanitizeEmail(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(trimmed)) {
    return null;
  }
  
  return trimmed;
}

/**
 * Generate a unique request ID for tracking
 * @returns Unique request ID
 */
export function generateRequestId(): string {
  return crypto.randomUUID();
}

/**
 * Rate limit key generator for password reset requests
 * @param identifier - IP address or email
 * @returns Rate limit key
 */
export function generateRateLimitKey(identifier: string): string {
  return `password_reset:${identifier}`;
}

/**
 * Calculate password strength
 * @param password - Password to evaluate
 * @returns Strength score (0-4)
 */
export function calculatePasswordStrength(password: string): number {
  let score = 0;
  
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  
  return Math.min(score, 4);
}

/**
 * Get password strength requirements
 * @returns Object with password requirements
 */
export function getPasswordRequirements() {
  return {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxLength: 128,
  };
}

/**
 * Validate password against requirements
 * @param password - Password to validate
 * @returns Object with validation result and errors
 */
export function validatePassword(password: string) {
  const requirements = getPasswordRequirements();
  const errors: string[] = [];
  
  if (password.length < requirements.minLength) {
    errors.push(`Password must be at least ${requirements.minLength} characters long`);
  }
  
  if (password.length > requirements.maxLength) {
    errors.push(`Password must be no more than ${requirements.maxLength} characters long`);
  }
  
  if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (requirements.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (requirements.requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (requirements.requireSpecialChars && !/[^a-zA-Z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength: calculatePasswordStrength(password),
  };
}