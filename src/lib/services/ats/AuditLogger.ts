import { prisma } from '@/lib/prisma';

export interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  resource: string;
  details: any;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  sessionId?: string;
  requestId?: string;
}

export interface AuditFilter {
  userId?: string;
  action?: string;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
  ipAddress?: string;
  sessionId?: string;
}

export interface AuditReport {
  summary: {
    totalEntries: number;
    uniqueUsers: number;
    uniqueActions: number;
    dateRange: { start: Date; end: Date };
  };
  actionCounts: Array<{
    action: string;
    count: number;
    percentage: number;
  }>;
  userActivity: Array<{
    userId: string;
    userIdentifier: string;
    actionCount: number;
    lastActivity: Date;
  }>;
  resourceAccess: Array<{
    resource: string;
    accessCount: number;
    uniqueUsers: number;
  }>;
  timeline: Array<{
    date: string;
    actionCount: number;
    uniqueUsers: number;
  }>;
  anomalies: Array<{
    type: 'unusual_activity' | 'security_risk' | 'performance_issue';
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    affectedUsers: string[];
    timestamp: Date;
  }>;
}

export class AuditLogger {
  private static instance: AuditLogger;
  private batchSize = 100;
  private batchQueue: Array<Partial<AuditLogEntry>> = [];
  private batchTimeout: NodeJS.Timeout | null = null;

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  private constructor() {
    // Initialize batch processing
    this.startBatchProcessor();
  }

  /**
   * Log an audit entry immediately
   */
  async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    try {
      const auditEntry = {
        ...entry,
        timestamp: new Date(),
        details: entry.details || {}
      };

      // For high-priority actions, log immediately
      const immediateActions = [
        'DELETE_APPLICATION',
        'DELETE_JOB',
        'ACCESS_SENSITIVE_DATA',
        'SECURITY_BREACH',
        'COMPLIANCE_VIOLATION'
      ];

      if (immediateActions.includes(entry.action)) {
        await this.writeToDatabase([auditEntry]);
      } else {
        // Add to batch queue for normal actions
        this.batchQueue.push(auditEntry);
        this.scheduleBatchWrite();
      }
    } catch (error) {
      console.error('Error logging audit entry:', error);
      // Fallback to file logging if database fails
      this.writeToFile(entry);
    }
  }

  /**
   * Create audit entry from request context
   */
  createFromRequest(
    userId: string,
    action: string,
    resource: string,
    details: any,
    request?: any
  ): Omit<AuditLogEntry, 'id' | 'timestamp'> {
    return {
      userId,
      action,
      resource,
      details,
      ipAddress: request?.headers?.get('x-forwarded-for') ||
                 request?.socket?.remoteAddress ||
                 'unknown',
      userAgent: request?.headers?.get('user-agent') || 'unknown',
      sessionId: request?.session?.id,
      requestId: request?.id
    };
  }

  /**
   * Log ATS-specific events
   */
  async logATSAnalysis(
    userId: string,
    applicationId: string,
    score: number,
    complianceStatus: string,
    request?: any
  ): Promise<void> {
    await this.log(this.createFromRequest(
      userId,
      'ATS_ANALYSIS_APPLICATION',
      `application:${applicationId}`,
      {
        score,
        complianceStatus,
        analysisType: 'automated',
        version: '1.0.0'
      },
      request
    ));
  }

  async logATSComplianceCheck(
    userId: string,
    jobId: string,
    complianceStatus: string,
    riskScore: number,
    violations: any[],
    request?: any
  ): Promise<void> {
    await this.log(this.createFromRequest(
      userId,
      'ATS_COMPLIANCE_CHECK',
      `job:${jobId}`,
      {
        complianceStatus,
        riskScore,
        violationCount: violations.length,
        violations: violations.map(v => ({
          type: v.type,
          severity: v.severity,
          description: v.description
        }))
      },
      request
    ));
  }

  async logDataAccess(
    userId: string,
    resourceType: string,
    resourceId: string,
    accessType: 'read' | 'write' | 'delete',
    request?: any
  ): Promise<void> {
    await this.log(this.createFromRequest(
      userId,
      `DATA_${accessType.toUpperCase()}`,
      `${resourceType}:${resourceId}`,
      {
        accessType,
        resourceType,
        timestamp: new Date().toISOString()
      },
      request
    ));
  }

  async logSecurityEvent(
    userId: string,
    eventType: 'login' | 'logout' | 'failed_login' | 'suspicious_activity',
    details: any,
    request?: any
  ): Promise<void> {
    await this.log(this.createFromRequest(
      userId,
      `SECURITY_${eventType.toUpperCase()}`,
      'system:security',
      {
        eventType,
        ...details,
        severity: this.getSecurityEventSeverity(eventType)
      },
      request
    ));
  }

  async logConfigurationChange(
    userId: string,
    configType: string,
    oldValue: any,
    newValue: any,
    request?: any
  ): Promise<void> {
    await this.log(this.createFromRequest(
      userId,
      'CONFIGURATION_CHANGE',
      `config:${configType}`,
      {
        configType,
        oldValue,
        newValue,
        changedFields: this.getChangedFields(oldValue, newValue)
      },
      request
    ));
  }

  /**
   * Query audit logs with filtering
   */
  async queryLogs(filter: AuditFilter, options: {
    limit?: number;
    offset?: number;
    orderBy?: 'timestamp' | 'action' | 'userId';
    orderDirection?: 'asc' | 'desc';
  } = {}): Promise<AuditLogEntry[]> {
    try {
      const whereClause: any = {};

      if (filter.userId) {
        whereClause.userId = filter.userId;
      }

      if (filter.action) {
        whereClause.action = {
          contains: filter.action,
          mode: 'insensitive'
        };
      }

      if (filter.resource) {
        whereClause.resource = {
          contains: filter.resource,
          mode: 'insensitive'
        };
      }

      if (filter.startDate || filter.endDate) {
        whereClause.timestamp = {};
        if (filter.startDate) {
          whereClause.timestamp.gte = filter.startDate;
        }
        if (filter.endDate) {
          whereClause.timestamp.lte = filter.endDate;
        }
      }

      if (filter.ipAddress) {
        whereClause.ipAddress = filter.ipAddress;
      }

      if (filter.sessionId) {
        whereClause.sessionId = filter.sessionId;
      }

      const logs = await prisma.auditLog.findMany({
        where: whereClause,
        orderBy: {
          [options.orderBy || 'timestamp']: options.orderDirection || 'desc'
        },
        take: options.limit || 100,
        skip: options.offset || 0
      });

      return logs.map(log => ({
        ...log,
        details: typeof log.details === 'string' ? JSON.parse(log.details) : log.details
      }));
    } catch (error) {
      console.error('Error querying audit logs:', error);
      throw error;
    }
  }

  /**
   * Generate comprehensive audit report
   */
  async generateReport(filter: AuditFilter): Promise<AuditReport> {
    try {
      const baseQuery = {
        where: this.buildWhereClause(filter)
      };

      // Get total entries and date range
      const [totalEntries, minDate, maxDate] = await Promise.all([
        prisma.auditLog.count({ where: baseQuery.where }),
        prisma.auditLog.findFirst({
          where: baseQuery.where,
          orderBy: { timestamp: 'asc' },
          select: { timestamp: true }
        }),
        prisma.auditLog.findFirst({
          where: baseQuery.where,
          orderBy: { timestamp: 'desc' },
          select: { timestamp: true }
        })
      ]);

      // Get unique users count
      const uniqueUsers = await prisma.auditLog.groupBy({
        by: ['userId'],
        where: baseQuery.where
      });

      // Get action counts
      const actionCounts = await prisma.auditLog.groupBy({
        by: ['action'],
        where: baseQuery.where,
        _count: {
          action: true
        },
        orderBy: {
          _count: {
            action: 'desc'
          }
        }
      });

      // Get user activity
      const userActivity = await prisma.auditLog.groupBy({
        by: ['userId'],
        where: baseQuery.where,
        _count: {
          userId: true
        },
        _max: {
          timestamp: true
        },
        orderBy: {
          _count: {
            userId: 'desc'
          }
        },
        take: 10
      });

      // Get resource access patterns
      const resourceAccess = await prisma.auditLog.groupBy({
        by: ['resource'],
        where: baseQuery.where,
        _count: {
          resource: true
        },
        orderBy: {
          _count: {
            resource: 'desc'
          }
        },
        take: 10
      });

      // Get timeline data
      const timeline = await this.getTimelineData(baseQuery.where);

      // Detect anomalies
      const anomalies = await this.detectAnomalies(baseQuery.where);

      // Get user identifiers
      const userIds = userActivity.map(ua => ua.userId);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true }
      });

      const userMap = new Map(users.map(u => [u.id, `${u.name} (${u.email})`]));

      return {
        summary: {
          totalEntries,
          uniqueUsers: uniqueUsers.length,
          uniqueActions: actionCounts.length,
          dateRange: {
            start: minDate?.timestamp || new Date(),
            end: maxDate?.timestamp || new Date()
          }
        },
        actionCounts: actionCounts.map(ac => ({
          action: ac.action,
          count: ac._count.action,
          percentage: Math.round((ac._count.action / totalEntries) * 100)
        })),
        userActivity: userActivity.map(ua => ({
          userId: ua.userId,
          userIdentifier: userMap.get(ua.userId) || ua.userId,
          actionCount: ua._count.userId,
          lastActivity: ua._max.timestamp!
        })),
        resourceAccess: resourceAccess.map(ra => ({
          resource: ra.resource,
          accessCount: ra._count.resource,
          uniqueUsers: ra._count.resource // This would need a separate query for accuracy
        })),
        timeline,
        anomalies
      };
    } catch (error) {
      console.error('Error generating audit report:', error);
      throw error;
    }
  }

  /**
   * Export audit logs to various formats
   */
  async exportLogs(filter: AuditFilter, format: 'csv' | 'json' | 'xml'): Promise<string> {
    try {
      const logs = await this.queryLogs(filter, { limit: 10000 });

      switch (format) {
        case 'csv':
          return this.convertToCSV(logs);
        case 'json':
          return JSON.stringify(logs, null, 2);
        case 'xml':
          return this.convertToXML(logs);
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      throw error;
    }
  }

  /**
   * Cleanup old audit logs based on retention policy
   */
  async cleanup(retentionDays: number = 2555): Promise<number> { // 7 years default
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const result = await prisma.auditLog.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate
          }
        }
      });

      console.log(`Cleaned up ${result.count} audit logs older than ${retentionDays} days`);
      return result.count;
    } catch (error) {
      console.error('Error cleaning up audit logs:', error);
      throw error;
    }
  }

  // Private helper methods

  private startBatchProcessor(): void {
    // Process batch every 30 seconds
    setInterval(() => {
      this.processBatch();
    }, 30000);
  }

  private scheduleBatchWrite(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    this.batchTimeout = setTimeout(() => {
      this.processBatch();
    }, 5000); // Wait 5 seconds for more entries
  }

  private async processBatch(): Promise<void> {
    if (this.batchQueue.length === 0) return;

    const batch = [...this.batchQueue];
    this.batchQueue = [];

    try {
      await this.writeToDatabase(batch);
    } catch (error) {
      console.error('Error writing audit batch:', error);
      // Re-add failed entries to queue for retry
      this.batchQueue.unshift(...batch);
    }
  }

  private async writeToDatabase(entries: Array<Partial<AuditLogEntry>>): Promise<void> {
    if (entries.length === 0) return;

    await prisma.auditLog.createMany({
      data: entries.map(entry => ({
        userId: entry.userId!,
        action: entry.action!,
        resource: entry.resource!,
        details: entry.details || {},
        ipAddress: entry.ipAddress || 'unknown',
        userAgent: entry.userAgent || 'unknown',
        timestamp: entry.timestamp || new Date(),
        sessionId: entry.sessionId,
        requestId: entry.requestId
      }))
    });
  }

  private writeToFile(entry: Partial<AuditLogEntry>): void {
    // Fallback file logging
    const logEntry = {
      timestamp: new Date().toISOString(),
      ...entry
    };

    console.error('AUDIT_LOG_FALLBACK:', JSON.stringify(logEntry));
  }

  private buildWhereClause(filter: AuditFilter): any {
    const where: any = {};

    if (filter.userId) where.userId = filter.userId;
    if (filter.action) where.action = { contains: filter.action, mode: 'insensitive' };
    if (filter.resource) where.resource = { contains: filter.resource, mode: 'insensitive' };

    if (filter.startDate || filter.endDate) {
      where.timestamp = {};
      if (filter.startDate) where.timestamp.gte = filter.startDate;
      if (filter.endDate) where.timestamp.lte = filter.endDate;
    }

    if (filter.ipAddress) where.ipAddress = filter.ipAddress;
    if (filter.sessionId) where.sessionId = filter.sessionId;

    return where;
  }

  private async getTimelineData(whereClause: any): Promise<Array<{ date: string; actionCount: number; uniqueUsers: number }>> {
    // This would ideally use database-specific date functions
    // For now, return a simplified version
    const logs = await prisma.auditLog.findMany({
      where: whereClause,
      select: {
        timestamp: true,
        userId: true
      },
      orderBy: { timestamp: 'asc' },
      take: 1000
    });

    const groupedByDate = logs.reduce((acc, log) => {
      const date = log.timestamp.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { actions: 0, users: new Set() };
      }
      acc[date].actions++;
      acc[date].users.add(log.userId);
      return acc;
    }, {} as Record<string, { actions: number; users: Set<string> }>);

    return Object.entries(groupedByDate).map(([date, data]) => ({
      date,
      actionCount: data.actions,
      uniqueUsers: data.users.size
    }));
  }

  private async detectAnomalies(whereClause: any): Promise<AuditReport['anomalies']> {
    const anomalies: AuditReport['anomalies'] = [];

    try {
      // Detect unusual login patterns
      const recentLogins = await prisma.auditLog.findMany({
        where: {
          ...whereClause,
          action: { contains: 'LOGIN' }
        },
        select: {
          userId: true,
          ipAddress: true,
          timestamp: true
        },
        take: 100
      });

      // Group by user and check for multiple IPs
      const userIPs = new Map<string, Set<string>>();
      recentLogins.forEach(login => {
        if (!userIPs.has(login.userId)) {
          userIPs.set(login.userId, new Set());
        }
        userIPs.get(login.userId)!.add(login.ipAddress);
      });

      for (const [userId, ips] of userIPs) {
        if (ips.size > 3) {
          anomalies.push({
            type: 'security_risk',
            description: `User ${userId} logged in from ${ips.size} different IP addresses`,
            severity: 'medium',
            affectedUsers: [userId],
            timestamp: new Date()
          });
        }
      }

      // Detect high-frequency actions
      const actionCounts = await prisma.auditLog.groupBy({
        by: ['userId', 'action'],
        where: {
          ...whereClause,
          timestamp: {
            gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
          }
        },
        _count: {
          userId: true
        },
        having: {
          userId: {
            _count: {
              gt: 100 // More than 100 actions in an hour
            }
          }
        }
      });

      actionCounts.forEach(ac => {
        anomalies.push({
          type: 'unusual_activity',
          description: `User ${ac.userId} performed ${ac._count.userId} ${ac.action} actions in the last hour`,
          severity: 'low',
          affectedUsers: [ac.userId],
          timestamp: new Date()
        });
      });

    } catch (error) {
      console.error('Error detecting anomalies:', error);
    }

    return anomalies;
  }

  private getSecurityEventSeverity(eventType: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (eventType) {
      case 'login':
      case 'logout':
        return 'low';
      case 'failed_login':
        return 'medium';
      case 'suspicious_activity':
        return 'high';
      default:
        return 'medium';
    }
  }

  private getChangedFields(oldValue: any, newValue: any): string[] {
    const fields: string[] = [];

    if (!oldValue || !newValue) return fields;

    for (const key in newValue) {
      if (oldValue[key] !== newValue[key]) {
        fields.push(key);
      }
    }

    return fields;
  }

  private convertToCSV(logs: AuditLogEntry[]): string {
    const headers = [
      'id', 'userId', 'action', 'resource', 'ipAddress',
      'userAgent', 'timestamp', 'sessionId', 'details'
    ];

    const csvRows = [
      headers.join(','),
      ...logs.map(log => [
        log.id,
        log.userId,
        log.action,
        log.resource,
        log.ipAddress,
        `"${log.userAgent}"`,
        log.timestamp.toISOString(),
        log.sessionId || '',
        `"${JSON.stringify(log.details).replace(/"/g, '""')}"`
      ].join(','))
    ];

    return csvRows.join('\n');
  }

  private convertToXML(logs: AuditLogEntry[]): string {
    const xmlEntries = logs.map(log => `
  <AuditLog>
    <id>${log.id}</id>
    <userId>${log.userId}</userId>
    <action>${log.action}</action>
    <resource>${log.resource}</resource>
    <ipAddress>${log.ipAddress}</ipAddress>
    <userAgent>${log.userAgent}</userAgent>
    <timestamp>${log.timestamp.toISOString()}</timestamp>
    <sessionId>${log.sessionId || ''}</sessionId>
    <details>${JSON.stringify(log.details)}</details>
  </AuditLog>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<AuditLogs>
  <summary>
    <totalEntries>${logs.length}</totalEntries>
    <exportedAt>${new Date().toISOString()}</exportedAt>
  </summary>
  <entries>${xmlEntries}
  </entries>
</AuditLogs>`;
  }
}