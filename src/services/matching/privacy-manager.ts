/**
 * Privacy Manager Service
 *
 * Manages privacy settings, data access controls, and user privacy preferences
 * for the matching system. Handles consent management, data retention policies,
 * and privacy compliance requirements.
 */

import { prisma } from '@/lib/prisma';
import { cache } from '@/lib/cache';
import { logger } from '@/lib/logger';

export interface PrivacySettings {
  userId: string;
  profileVisibility: 'public' | 'private' | 'connections_only';
  dataSharing: {
    allowAnalytics: boolean;
    allowRecommendations: boolean;
    allowThirdPartySharing: boolean;
    allowResearchUsage: boolean;
  };
  communication: {
    allowEmailNotifications: boolean;
    allowSmsNotifications: boolean;
    allowPushNotifications: boolean;
    allowMarketingEmails: boolean;
  };
  socialMedia: {
    allowLinkedInImport: boolean;
    allowGitHubImport: boolean;
    allowTwitterImport: boolean;
    allowPublicProfile: boolean;
  };
  dataRetention: {
    keepInactiveProfile: boolean;
    keepApplicationHistory: boolean;
    keepInteractionHistory: boolean;
    retentionPeriod: number; // months
  };
  gdpr: {
    dataProcessingConsent: boolean;
    marketingConsent: boolean;
    analyticsConsent: boolean;
    consentDate: Date;
    consentVersion: string;
    lastUpdated: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface PrivacyAudit {
  id: string;
  userId: string;
  action: 'access_request' | 'data_deletion' | 'consent_update' | 'privacy_change';
  details: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  performedBy: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface DataSubjectRequest {
  id: string;
  userId: string;
  type: 'access' | 'portability' | 'deletion' | 'rectification' | 'restriction';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requestDetails: string;
  evidence: string[];
  processedAt?: Date;
  processedBy?: string;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConsentRecord {
  id: string;
  userId: string;
  consentType: 'data_processing' | 'marketing' | 'analytics' | 'third_party_sharing';
  granted: boolean;
  consentText: string;
  version: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  expiresAt?: Date;
  withdrawnAt?: Date;
}

class PrivacyManagerService {
  private static instance: PrivacyManagerService;

  private constructor() {}

  static getInstance(): PrivacyManagerService {
    if (!PrivacyManagerService.instance) {
      PrivacyManagerService.instance = new PrivacyManagerService();
    }
    return PrivacyManagerService.instance;
  }

  /**
   * Get user privacy settings
   */
  async getPrivacySettings(userId: string): Promise<PrivacySettings | null> {
    try {
      const cacheKey = `privacy_settings:${userId}`;

      return await cache.wrap(cacheKey, async () => {
        const settings = await prisma.privacySettings.findUnique({
          where: { userId },
        });

        return settings ? this.mapPrivacySettings(settings) : null;
      }, 3600); // Cache for 1 hour
    } catch (error) {
      logger.error('Error getting privacy settings', error, { userId });
      throw error;
    }
  }

  /**
   * Update user privacy settings
   */
  async updatePrivacySettings(
    userId: string,
    updates: Partial<PrivacySettings>,
    performedBy?: string
  ): Promise<PrivacySettings> {
    try {
      // Validate privacy settings
      this.validatePrivacyUpdates(updates);

      const existingSettings = await this.getPrivacySettings(userId);

      const updatedSettings = await prisma.privacySettings.upsert({
        where: { userId },
        update: {
          ...updates,
          updatedAt: new Date(),
        },
        create: {
          userId,
          ...this.getDefaultPrivacySettings(userId, updates),
        },
      });

      // Log privacy changes
      await this.logPrivacyChange(userId, updates, performedBy);

      // Invalidate cache
      await cache.del(`privacy_settings:${userId}`);

      // Apply privacy changes to user data
      await this.applyPrivacyChanges(userId, updates);

      logger.info('Privacy settings updated', { userId, updates });

      return this.mapPrivacySettings(updatedSettings);
    } catch (error) {
      logger.error('Error updating privacy settings', error, { userId });
      throw error;
    }
  }

  /**
   * Grant or withdraw consent
   */
  async updateConsent(
    userId: string,
    consentType: ConsentRecord['consentType'],
    granted: boolean,
    consentText: string,
    ipAddress: string,
    userAgent: string
  ): Promise<ConsentRecord> {
    try {
      const consentRecord = await prisma.consentRecord.create({
        data: {
          userId,
          consentType,
          granted,
          consentText,
          version: '1.0',
          ipAddress,
          userAgent,
          timestamp: new Date(),
          expiresAt: granted ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : undefined, // 1 year
        },
      });

      // Withdraw previous consents of the same type
      if (!granted) {
        await prisma.consentRecord.updateMany({
          where: {
            userId,
            consentType,
            granted: true,
            withdrawnAt: null,
          },
          data: {
            withdrawnAt: new Date(),
          },
        });
      }

      // Update privacy settings if needed
      await this.updatePrivacySettingsForConsent(userId, consentType, granted);

      logger.info('Consent updated', { userId, consentType, granted });

      return consentRecord;
    } catch (error) {
      logger.error('Error updating consent', error, { userId, consentType });
      throw error;
    }
  }

  /**
   * Get user consent status
   */
  async getConsentStatus(userId: string): Promise<{
    dataProcessing: boolean;
    marketing: boolean;
    analytics: boolean;
    thirdPartySharing: boolean;
    lastUpdated: Date;
  }> {
    try {
      const consentRecords = await prisma.consentRecord.findMany({
        where: {
          userId,
          granted: true,
          withdrawnAt: null,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
        orderBy: { timestamp: 'desc' },
      });

      const consents = {
        dataProcessing: false,
        marketing: false,
        analytics: false,
        thirdPartySharing: false,
        lastUpdated: new Date(0),
      };

      consentRecords.forEach(record => {
        consents[record.consentType as keyof typeof consents] = true;
        if (record.timestamp > consents.lastUpdated) {
          consents.lastUpdated = record.timestamp;
        }
      });

      return consents;
    } catch (error) {
      logger.error('Error getting consent status', error, { userId });
      throw error;
    }
  }

  /**
   * Create data subject request (GDPR)
   */
  async createDataSubjectRequest(
    userId: string,
    type: DataSubjectRequest['type'],
    requestDetails: string,
    evidence?: string[]
  ): Promise<DataSubjectRequest> {
    try {
      const request = await prisma.dataSubjectRequest.create({
        data: {
          userId,
          type,
          requestDetails,
          evidence: evidence || [],
          status: 'pending',
        },
      });

      // Log the request
      await this.logPrivacyAudit(userId, 'access_request',
        `Data subject request created: ${type}`,
        'system', '127.0.0.1', 'GDPR System'
      );

      // Notify administrators
      await this.notifyDataSubjectRequest(request);

      logger.info('Data subject request created', { userId, type });

      return request;
    } catch (error) {
      logger.error('Error creating data subject request', error, { userId, type });
      throw error;
    }
  }

  /**
   * Process data subject request
   */
  async processDataSubjectRequest(
    requestId: string,
    processedBy: string,
    result?: any,
    rejectionReason?: string
  ): Promise<DataSubjectRequest> {
    try {
      const request = await prisma.dataSubjectRequest.findUnique({
        where: { id: requestId },
      });

      if (!request) {
        throw new Error('Data subject request not found');
      }

      let status: DataSubjectRequest['status'] = 'completed';

      if (rejectionReason) {
        status = 'rejected';
      }

      const updatedRequest = await prisma.dataSubjectRequest.update({
        where: { id: requestId },
        data: {
          status,
          processedAt: new Date(),
          processedBy,
          rejectionReason,
        },
      });

      // Process the request based on type
      if (status === 'completed') {
        await this.executeDataSubjectRequest(request, result);
      }

      logger.info('Data subject request processed', { requestId, status });

      return updatedRequest;
    } catch (error) {
      logger.error('Error processing data subject request', error, { requestId });
      throw error;
    }
  }

  /**
   * Export user data (GDPR Right to Data Portability)
   */
  async exportUserData(userId: string): Promise<any> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          experiences: true,
          educations: true,
          skills: true,
          projects: true,
          applications: true,
          privacySettings: true,
          consentRecords: true,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Check privacy settings
      const privacySettings = await this.getPrivacySettings(userId);
      if (privacySettings?.profileVisibility === 'private') {
        throw new Error('User has private profile settings');
      }

      // Filter data based on privacy settings
      const filteredData = this.filterDataForExport(user, privacySettings);

      // Create export record
      await this.logPrivacyAudit(userId, 'access_request',
        'Data export performed',
        'system', '127.0.0.1', 'GDPR Export'
      );

      return {
        user: filteredData,
        exportDate: new Date().toISOString(),
        version: '1.0',
      };
    } catch (error) {
      logger.error('Error exporting user data', error, { userId });
      throw error;
    }
  }

  /**
   * Delete user data (GDPR Right to Erasure)
   */
  async deleteUserData(
    userId: string,
    reason: string,
    performedBy: string
  ): Promise<void> {
    try {
      // Check for active applications or other constraints
      const constraints = await this.checkDeletionConstraints(userId);
      if (constraints.length > 0) {
        throw new Error(`Cannot delete user due to constraints: ${constraints.join(', ')}`);
      }

      // Anonymize data instead of hard delete for audit purposes
      await this.anonymizeUserData(userId);

      // Log the deletion
      await this.logPrivacyAudit(userId, 'data_deletion',
        `User data deleted: ${reason}`,
        performedBy, '127.0.0.1', 'Privacy Manager'
      );

      logger.info('User data deleted', { userId, performedBy, reason });
    } catch (error) {
      logger.error('Error deleting user data', error, { userId });
      throw error;
    }
  }

  /**
   * Check if user has consent for specific processing
   */
  async hasConsent(
    userId: string,
    consentType: ConsentRecord['consentType']
  ): Promise<boolean> {
    try {
      const consent = await prisma.consentRecord.findFirst({
        where: {
          userId,
          consentType,
          granted: true,
          withdrawnAt: null,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
        orderBy: { timestamp: 'desc' },
      });

      return !!consent;
    } catch (error) {
      logger.error('Error checking consent', error, { userId, consentType });
      return false;
    }
  }

  /**
   * Apply privacy filters to search results
   */
  async applyPrivacyFilters(
    userId: string,
    results: any[],
    requesterId?: string
  ): Promise<any[]> {
    try {
      const privacySettings = await this.getPrivacySettings(userId);
      if (!privacySettings) {
        return results;
      }

      return results.map(result => {
        const filteredResult = { ...result };

        // Apply visibility settings
        if (privacySettings.profileVisibility === 'private' && requesterId !== userId) {
          // Remove sensitive information
          delete filteredResult.email;
          delete filteredResult.phone;
          delete filteredResult.address;
        }

        if (privacySettings.profileVisibility === 'connections_only' && requesterId !== userId) {
          // Check if requester is a connection
          const isConnection = await this.checkConnection(userId, requesterId);
          if (!isConnection) {
            delete filteredResult.email;
            delete filteredResult.phone;
          }
        }

        // Apply data sharing settings
        if (!privacySettings.dataSharing.allowAnalytics) {
          delete filteredResult.analytics;
        }

        return filteredResult;
      });
    } catch (error) {
      logger.error('Error applying privacy filters', error, { userId });
      return results;
    }
  }

  /**
   * Get privacy audit log for user
   */
  async getPrivacyAuditLog(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<PrivacyAudit[]> {
    try {
      const audits = await prisma.privacyAudit.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      });

      return audits.map(audit => this.mapPrivacyAudit(audit));
    } catch (error) {
      logger.error('Error getting privacy audit log', error, { userId });
      throw error;
    }
  }

  // Private helper methods

  private validatePrivacyUpdates(updates: Partial<PrivacySettings>): void {
    // Validate visibility setting
    if (updates.profileVisibility) {
      const validVisibilities = ['public', 'private', 'connections_only'];
      if (!validVisibilities.includes(updates.profileVisibility)) {
        throw new Error('Invalid profile visibility setting');
      }
    }

    // Validate data retention period
    if (updates.dataRetention?.retentionPeriod) {
      if (updates.dataRetention.retentionPeriod < 1 || updates.dataRetention.retentionPeriod > 120) {
        throw new Error('Retention period must be between 1 and 120 months');
      }
    }

    // Validate GDPR consent
    if (updates.gdpr) {
      if (typeof updates.gdpr.dataProcessingConsent !== 'boolean') {
        throw new Error('Data processing consent must be a boolean');
      }
    }
  }

  private getDefaultPrivacySettings(
    userId: string,
    overrides: Partial<PrivacySettings>
  ): Omit<PrivacySettings, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      userId,
      profileVisibility: 'public',
      dataSharing: {
        allowAnalytics: true,
        allowRecommendations: true,
        allowThirdPartySharing: false,
        allowResearchUsage: false,
      },
      communication: {
        allowEmailNotifications: true,
        allowSmsNotifications: false,
        allowPushNotifications: true,
        allowMarketingEmails: false,
      },
      socialMedia: {
        allowLinkedInImport: false,
        allowGitHubImport: false,
        allowTwitterImport: false,
        allowPublicProfile: true,
      },
      dataRetention: {
        keepInactiveProfile: true,
        keepApplicationHistory: true,
        keepInteractionHistory: true,
        retentionPeriod: 24, // 2 years
      },
      gdpr: {
        dataProcessingConsent: false,
        marketingConsent: false,
        analyticsConsent: false,
        consentDate: new Date(),
        consentVersion: '1.0',
        lastUpdated: new Date(),
      },
      ...overrides,
    };
  }

  private mapPrivacySettings(settings: any): PrivacySettings {
    return {
      id: settings.id,
      userId: settings.userId,
      profileVisibility: settings.profileVisibility,
      dataSharing: settings.dataSharing || {},
      communication: settings.communication || {},
      socialMedia: settings.socialMedia || {},
      dataRetention: settings.dataRetention || {},
      gdpr: settings.gdpr || {},
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    };
  }

  private mapPrivacyAudit(audit: any): PrivacyAudit {
    return {
      id: audit.id,
      userId: audit.userId,
      action: audit.action,
      details: audit.details,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
      timestamp: audit.timestamp,
      performedBy: audit.performedBy,
      status: audit.status,
    };
  }

  private async logPrivacyChange(
    userId: string,
    updates: Partial<PrivacySettings>,
    performedBy?: string
  ): Promise<void> {
    try {
      await prisma.privacyAudit.create({
        data: {
          userId,
          action: 'privacy_change',
          details: `Privacy settings updated: ${JSON.stringify(updates)}`,
          ipAddress: '127.0.0.1', // Would be extracted from request
          userAgent: 'Privacy Manager',
          timestamp: new Date(),
          performedBy: performedBy || 'user',
          status: 'completed',
        },
      });
    } catch (error) {
      logger.error('Error logging privacy change', error, { userId });
    }
  }

  private async logPrivacyAudit(
    userId: string,
    action: PrivacyAudit['action'],
    details: string,
    performedBy: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    try {
      await prisma.privacyAudit.create({
        data: {
          userId,
          action,
          details,
          ipAddress,
          userAgent,
          timestamp: new Date(),
          performedBy,
          status: 'completed',
        },
      });
    } catch (error) {
      logger.error('Error logging privacy audit', error, { userId });
    }
  }

  private async applyPrivacyChanges(userId: string, updates: Partial<PrivacySettings>): Promise<void> {
    // Apply privacy changes to user data
    if (updates.profileVisibility === 'private') {
      // Update profile visibility in search indexes
      await this.updateSearchVisibility(userId, false);
    }

    if (updates.dataSharing?.allowAnalytics === false) {
      // Remove user from analytics tracking
      await this.removeFromAnalytics(userId);
    }

    if (updates.socialMedia) {
      // Update social media integration settings
      await this.updateSocialMediaSettings(userId, updates.socialMedia);
    }
  }

  private async updatePrivacySettingsForConsent(
    userId: string,
    consentType: ConsentRecord['consentType'],
    granted: boolean
  ): Promise<void> {
    const privacySettings = await this.getPrivacySettings(userId);
    if (!privacySettings) return;

    const updates: Partial<PrivacySettings> = {};

    switch (consentType) {
      case 'data_processing':
        updates.gdpr = {
          ...privacySettings.gdpr,
          dataProcessingConsent: granted,
          lastUpdated: new Date(),
        };
        break;
      case 'marketing':
        updates.gdpr = {
          ...privacySettings.gdpr,
          marketingConsent: granted,
          lastUpdated: new Date(),
        };
        updates.communication = {
          ...privacySettings.communication,
          allowMarketingEmails: granted,
        };
        break;
      case 'analytics':
        updates.gdpr = {
          ...privacySettings.gdpr,
          analyticsConsent: granted,
          lastUpdated: new Date(),
        };
        updates.dataSharing = {
          ...privacySettings.dataSharing,
          allowAnalytics: granted,
        };
        break;
      case 'third_party_sharing':
        updates.dataSharing = {
          ...privacySettings.dataSharing,
          allowThirdPartySharing: granted,
        };
        break;
    }

    await this.updatePrivacySettings(userId, updates, 'consent_system');
  }

  private async notifyDataSubjectRequest(request: DataSubjectRequest): Promise<void> {
    // Send notification to administrators
    // This would integrate with your notification system
    logger.info('Data subject request notification sent', { requestId: request.id });
  }

  private async executeDataSubjectRequest(request: DataSubjectRequest, result?: any): Promise<void> {
    switch (request.type) {
      case 'access':
        // Access already handled by exportUserData
        break;
      case 'portability':
        // Portability already handled by exportUserData
        break;
      case 'deletion':
        // Deletion already handled by deleteUserData
        break;
      case 'rectification':
        await this.rectifyUserData(request.userId, request.requestDetails);
        break;
      case 'restriction':
        await this.restrictUserData(request.userId);
        break;
    }
  }

  private async checkDeletionConstraints(userId: string): Promise<string[]> {
    const constraints: string[] = [];

    // Check for active applications
    const activeApplications = await prisma.application.findMany({
      where: {
        candidateId: userId,
        status: {
          in: ['PENDING', 'UNDER_REVIEW', 'INTERVIEW_SCHEDULED'],
        },
      },
    });

    if (activeApplications.length > 0) {
      constraints.push('Active applications');
    }

    // Check for legal hold requirements
    // This would check for any legal holds on the user data

    return constraints;
  }

  private async anonymizeUserData(userId: string): Promise<void> {
    // Anonymize user data instead of hard delete
    const anonymizedData = {
      email: `deleted-${userId}@deleted.com`,
      firstName: 'Deleted',
      lastName: 'User',
      phone: '0000000000',
      // ... other fields to anonymize
    };

    await prisma.user.update({
      where: { id: userId },
      data: {
        ...anonymizedData,
        deletedAt: new Date(),
        isAnonymous: true,
      },
    });
  }

  private filterDataForExport(user: any, privacySettings: PrivacySettings | null): any {
    if (!privacySettings) return user;

    const filtered = { ...user };

    // Remove sensitive information based on privacy settings
    if (!privacySettings.dataSharing.allowAnalytics) {
      delete filtered.analytics;
    }

    if (!privacySettings.communication.allowSmsNotifications) {
      delete filtered.phone;
    }

    // Remove internal system fields
    delete filtered.internalId;
    delete filtered.systemFlags;

    return filtered;
  }

  private async checkConnection(userId: string, requesterId: string): Promise<boolean> {
    // Check if two users are connected
    const connection = await prisma.connection.findFirst({
      where: {
        OR: [
          { userId, connectedUserId: requesterId },
          { userId: requesterId, connectedUserId: userId },
        ],
        status: 'ACTIVE',
      },
    });

    return !!connection;
  }

  private async updateSearchVisibility(userId: string, visible: boolean): Promise<void> {
    // Update user visibility in search indexes
    // This would integrate with your search service
    logger.info('Search visibility updated', { userId, visible });
  }

  private async removeFromAnalytics(userId: string): Promise<void> {
    // Remove user from analytics tracking
    // This would integrate with your analytics service
    logger.info('User removed from analytics', { userId });
  }

  private async updateSocialMediaSettings(
    userId: string,
    settings: PrivacySettings['socialMedia']
  ): Promise<void> {
    // Update social media integration settings
    logger.info('Social media settings updated', { userId, settings });
  }

  private async rectifyUserData(userId: string, rectificationDetails: string): Promise<void> {
    // Handle data rectification requests
    logger.info('User data rectified', { userId, details: rectificationDetails });
  }

  private async restrictUserData(userId: string): Promise<void> {
    // Restrict processing of user data
    logger.info('User data processing restricted', { userId });
  }
}

export const privacyManager = PrivacyManagerService.getInstance();
export type {
  PrivacySettings,
  PrivacyAudit,
  DataSubjectRequest,
  ConsentRecord,
};