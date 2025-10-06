import { prisma } from '@/lib/prisma'

/**
 * Consent Management System for POPIA Compliance
 * Handles user consent for various data processing activities
 */

export type ConsentType = 
  | 'ESSENTIAL_COOKIES'
  | 'ANALYTICS_COOKIES' 
  | 'MARKETING_COOKIES'
  | 'FUNCTIONAL_COOKIES'
  | 'EMAIL_MARKETING'
  | 'SMS_MARKETING'
  | 'DATA_PROCESSING'
  | 'PROFILE_SHARING'
  | 'JOB_RECOMMENDATIONS'
  | 'THIRD_PARTY_INTEGRATIONS'

export interface ConsentRecord {
  id: string
  userId?: string
  sessionId?: string
  consentType: ConsentType
  granted: boolean
  version: string
  ipAddress: string
  userAgent: string
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface ConsentPreferences {
  essential: boolean // Always true, cannot be disabled
  analytics: boolean
  marketing: boolean
  functional: boolean
  emailMarketing: boolean
  smsMarketing: boolean
  dataProcessing: boolean
  profileSharing: boolean
  jobRecommendations: boolean
  thirdPartyIntegrations: boolean
}

export class ConsentManager {
  private static readonly CONSENT_VERSION = '1.0.0'
  private static readonly CONSENT_COOKIE_NAME = 'jobfinders_consent'
  private static readonly CONSENT_EXPIRY_DAYS = 365

  /**
   * Record user consent with audit trail
   */
  static async recordConsent(
    consentType: ConsentType,
    granted: boolean,
    options: {
      userId?: string
      sessionId?: string
      ipAddress: string
      userAgent: string
      metadata?: Record<string, any>
    }
  ): Promise<ConsentRecord> {
    try {
      const consentRecord = await prisma.consentRecord.create({
        data: {
          userId: options.userId,
          sessionId: options.sessionId,
          consentType,
          granted,
          version: this.CONSENT_VERSION,
          ipAddress: options.ipAddress,
          userAgent: options.userAgent,
          metadata: options.metadata || {},
        }
      })

      // Log consent change for audit purposes
      await prisma.auditLog.create({
        data: {
          userId: options.userId,
          action: granted ? 'CONSENT_GRANTED' : 'CONSENT_REVOKED',
          ipAddress: options.ipAddress,
          userAgent: options.userAgent,
          metadata: {
            consentType,
            consentVersion: this.CONSENT_VERSION,
            consentRecordId: consentRecord.id,
            sessionId: options.sessionId,
            ...options.metadata,
          }
        }
      })

      return consentRecord

    } catch (error) {
      console.error('Error recording consent:', error)
      throw new Error('Failed to record consent')
    }
  }

  /**
   * Record multiple consent preferences at once
   */
  static async recordConsentPreferences(
    preferences: Partial<ConsentPreferences>,
    options: {
      userId?: string
      sessionId?: string
      ipAddress: string
      userAgent: string
      source?: string
    }
  ): Promise<ConsentRecord[]> {
    const consentRecords: ConsentRecord[] = []

    // Map preferences to consent types
    const consentMappings: Array<[keyof ConsentPreferences, ConsentType]> = [
      ['essential', 'ESSENTIAL_COOKIES'],
      ['analytics', 'ANALYTICS_COOKIES'],
      ['marketing', 'MARKETING_COOKIES'],
      ['functional', 'FUNCTIONAL_COOKIES'],
      ['emailMarketing', 'EMAIL_MARKETING'],
      ['smsMarketing', 'SMS_MARKETING'],
      ['dataProcessing', 'DATA_PROCESSING'],
      ['profileSharing', 'PROFILE_SHARING'],
      ['jobRecommendations', 'JOB_RECOMMENDATIONS'],
      ['thirdPartyIntegrations', 'THIRD_PARTY_INTEGRATIONS'],
    ]

    for (const [prefKey, consentType] of consentMappings) {
      if (preferences[prefKey] !== undefined) {
        const granted = preferences[prefKey] === true
        
        const record = await this.recordConsent(consentType, granted, {
          ...options,
          metadata: {
            source: options.source || 'consent_banner',
            batchUpdate: true,
          }
        })
        
        consentRecords.push(record)
      }
    }

    return consentRecords
  }

  /**
   * Get current consent status for a user or session
   */
  static async getConsentStatus(
    identifier: { userId: string } | { sessionId: string }
  ): Promise<ConsentPreferences> {
    try {
      const whereClause = 'userId' in identifier 
        ? { userId: identifier.userId }
        : { sessionId: identifier.sessionId }

      // Get latest consent records for each type
      const consentRecords = await prisma.consentRecord.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        distinct: ['consentType'],
      })

      // Build consent preferences object
      const preferences: ConsentPreferences = {
        essential: true, // Always true
        analytics: false,
        marketing: false,
        functional: false,
        emailMarketing: false,
        smsMarketing: false,
        dataProcessing: false,
        profileSharing: false,
        jobRecommendations: false,
        thirdPartyIntegrations: false,
      }

      // Update preferences based on consent records
      consentRecords.forEach(record => {
        switch (record.consentType) {
          case 'ANALYTICS_COOKIES':
            preferences.analytics = record.granted
            break
          case 'MARKETING_COOKIES':
            preferences.marketing = record.granted
            break
          case 'FUNCTIONAL_COOKIES':
            preferences.functional = record.granted
            break
          case 'EMAIL_MARKETING':
            preferences.emailMarketing = record.granted
            break
          case 'SMS_MARKETING':
            preferences.smsMarketing = record.granted
            break
          case 'DATA_PROCESSING':
            preferences.dataProcessing = record.granted
            break
          case 'PROFILE_SHARING':
            preferences.profileSharing = record.granted
            break
          case 'JOB_RECOMMENDATIONS':
            preferences.jobRecommendations = record.granted
            break
          case 'THIRD_PARTY_INTEGRATIONS':
            preferences.thirdPartyIntegrations = record.granted
            break
        }
      })

      return preferences

    } catch (error) {
      console.error('Error getting consent status:', error)
      // Return default (minimal) preferences on error
      return {
        essential: true,
        analytics: false,
        marketing: false,
        functional: false,
        emailMarketing: false,
        smsMarketing: false,
        dataProcessing: false,
        profileSharing: false,
        jobRecommendations: false,
        thirdPartyIntegrations: false,
      }
    }
  }

  /**
   * Check if user has consented to a specific type
   */
  static async hasConsent(
    consentType: ConsentType,
    identifier: { userId: string } | { sessionId: string }
  ): Promise<boolean> {
    try {
      const whereClause = 'userId' in identifier 
        ? { userId: identifier.userId }
        : { sessionId: identifier.sessionId }

      const latestConsent = await prisma.consentRecord.findFirst({
        where: {
          ...whereClause,
          consentType,
        },
        orderBy: { createdAt: 'desc' },
      })

      // Essential cookies are always consented
      if (consentType === 'ESSENTIAL_COOKIES') {
        return true
      }

      return latestConsent?.granted || false

    } catch (error) {
      console.error('Error checking consent:', error)
      return false
    }
  }

  /**
   * Get consent history for audit purposes
   */
  static async getConsentHistory(
    identifier: { userId: string } | { sessionId: string },
    consentType?: ConsentType
  ): Promise<ConsentRecord[]> {
    try {
      const whereClause = 'userId' in identifier 
        ? { userId: identifier.userId }
        : { sessionId: identifier.sessionId }

      return await prisma.consentRecord.findMany({
        where: {
          ...whereClause,
          ...(consentType && { consentType }),
        },
        orderBy: { createdAt: 'desc' },
      })

    } catch (error) {
      console.error('Error getting consent history:', error)
      return []
    }
  }

  /**
   * Revoke all consent for a user (for account deletion)
   */
  static async revokeAllConsent(
    userId: string,
    options: {
      ipAddress: string
      userAgent: string
      reason?: string
    }
  ): Promise<void> {
    try {
      const consentTypes: ConsentType[] = [
        'ANALYTICS_COOKIES',
        'MARKETING_COOKIES',
        'FUNCTIONAL_COOKIES',
        'EMAIL_MARKETING',
        'SMS_MARKETING',
        'DATA_PROCESSING',
        'PROFILE_SHARING',
        'JOB_RECOMMENDATIONS',
        'THIRD_PARTY_INTEGRATIONS',
      ]

      for (const consentType of consentTypes) {
        await this.recordConsent(consentType, false, {
          userId,
          ipAddress: options.ipAddress,
          userAgent: options.userAgent,
          metadata: {
            reason: options.reason || 'account_deletion',
            revokeAll: true,
          }
        })
      }

    } catch (error) {
      console.error('Error revoking all consent:', error)
      throw new Error('Failed to revoke consent')
    }
  }

  /**
   * Check if consent needs to be refreshed (older than 1 year)
   */
  static async needsConsentRefresh(
    identifier: { userId: string } | { sessionId: string }
  ): Promise<boolean> {
    try {
      const whereClause = 'userId' in identifier 
        ? { userId: identifier.userId }
        : { sessionId: identifier.sessionId }

      const latestConsent = await prisma.consentRecord.findFirst({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
      })

      if (!latestConsent) {
        return true // No consent recorded, needs consent
      }

      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

      return latestConsent.createdAt < oneYearAgo

    } catch (error) {
      console.error('Error checking consent refresh:', error)
      return true // Default to requiring consent on error
    }
  }

  /**
   * Generate consent summary for data export
   */
  static async generateConsentSummary(userId: string): Promise<{
    currentPreferences: ConsentPreferences
    consentHistory: ConsentRecord[]
    lastUpdated: Date | null
    needsRefresh: boolean
  }> {
    const [preferences, history, needsRefresh] = await Promise.all([
      this.getConsentStatus({ userId }),
      this.getConsentHistory({ userId }),
      this.needsConsentRefresh({ userId }),
    ])

    const lastUpdated = history.length > 0 ? history[0].createdAt : null

    return {
      currentPreferences: preferences,
      consentHistory: history,
      lastUpdated,
      needsRefresh,
    }
  }
}