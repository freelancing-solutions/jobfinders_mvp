import { auditLog, AuditAction, AuditResource } from './audit-logger'

// Incident types
export enum IncidentType {
  SECURITY_BREACH = 'security_breach',
  DATA_BREACH = 'data_breach',
  SYSTEM_OUTAGE = 'system_outage',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  MALWARE_DETECTION = 'malware_detection',
  DDOS_ATTACK = 'ddos_attack',
  PHISHING_ATTEMPT = 'phishing_attempt',
  INSIDER_THREAT = 'insider_threat',
  COMPLIANCE_VIOLATION = 'compliance_violation',
  PRIVACY_INCIDENT = 'privacy_incident'
}

// Incident severity levels
export enum IncidentSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Incident status
export enum IncidentStatus {
  REPORTED = 'reported',
  ACKNOWLEDGED = 'acknowledged',
  INVESTIGATING = 'investigating',
  CONTAINED = 'contained',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

// Response team roles
export enum ResponseRole {
  INCIDENT_COMMANDER = 'incident_commander',
  SECURITY_ANALYST = 'security_analyst',
  TECHNICAL_LEAD = 'technical_lead',
  COMMUNICATIONS_LEAD = 'communications_lead',
  LEGAL_COUNSEL = 'legal_counsel',
  COMPLIANCE_OFFICER = 'compliance_officer',
  EXTERNAL_CONSULTANT = 'external_consultant'
}

// Notification channels
export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  SLACK = 'slack',
  PHONE = 'phone',
  WEBHOOK = 'webhook'
}

// Incident interface
export interface SecurityIncident {
  id: string
  type: IncidentType
  severity: IncidentSeverity
  status: IncidentStatus
  title: string
  description: string
  affectedSystems: string[]
  affectedUsers: string[]
  detectedAt: Date
  reportedAt: Date
  reportedBy: string
  assignedTo?: string
  responseTeam: ResponseTeamMember[]
  timeline: IncidentTimelineEntry[]
  containmentActions: ContainmentAction[]
  communicationLog: CommunicationEntry[]
  evidence: Evidence[]
  rootCause?: string
  resolution?: string
  lessonsLearned?: string[]
  estimatedImpact?: ImpactAssessment
  regulatoryNotifications: RegulatoryNotification[]
  createdAt: Date
  updatedAt: Date
}

// Response team member
export interface ResponseTeamMember {
  userId: string
  role: ResponseRole
  contactInfo: ContactInfo
  assignedAt: Date
  isActive: boolean
}

// Contact information
export interface ContactInfo {
  email: string
  phone?: string
  alternateEmail?: string
  slackId?: string
}

// Timeline entry
export interface IncidentTimelineEntry {
  id: string
  timestamp: Date
  action: string
  description: string
  performedBy: string
  evidence?: string[]
}

// Containment action
export interface ContainmentAction {
  id: string
  action: string
  description: string
  implementedAt: Date
  implementedBy: string
  effectiveness: 'effective' | 'partially_effective' | 'ineffective'
  notes?: string
}

// Communication entry
export interface CommunicationEntry {
  id: string
  timestamp: Date
  channel: NotificationChannel
  recipient: string
  message: string
  sentBy: string
  acknowledged?: boolean
  acknowledgedAt?: Date
}

// Evidence
export interface Evidence {
  id: string
  type: 'log_file' | 'screenshot' | 'document' | 'network_capture' | 'forensic_image'
  filename: string
  description: string
  collectedAt: Date
  collectedBy: string
  hash: string
  location: string
  chainOfCustody: ChainOfCustodyEntry[]
}

// Chain of custody
export interface ChainOfCustodyEntry {
  timestamp: Date
  action: 'collected' | 'transferred' | 'analyzed' | 'stored'
  performedBy: string
  location: string
  notes?: string
}

// Impact assessment
export interface ImpactAssessment {
  usersAffected: number
  systemsAffected: string[]
  dataCompromised: boolean
  dataTypes: string[]
  estimatedRecords: number
  businessImpact: 'low' | 'medium' | 'high' | 'critical'
  financialImpact?: number
  reputationalImpact: 'low' | 'medium' | 'high' | 'critical'
}

// Regulatory notification
export interface RegulatoryNotification {
  authority: string
  notifiedAt: Date
  notificationMethod: string
  referenceNumber?: string
  status: 'pending' | 'sent' | 'acknowledged' | 'investigating'
  deadline?: Date
}

// Incident response plan
export interface ResponsePlan {
  incidentType: IncidentType
  severity: IncidentSeverity
  responseTeamRoles: ResponseRole[]
  escalationCriteria: string[]
  containmentProcedures: string[]
  communicationPlan: CommunicationPlan
  regulatoryRequirements: RegulatoryRequirement[]
  maxResponseTime: number // minutes
}

// Communication plan
export interface CommunicationPlan {
  internalNotifications: NotificationRule[]
  externalNotifications: NotificationRule[]
  mediaResponse?: string
  customerCommunication?: string
}

// Notification rule
export interface NotificationRule {
  trigger: string
  recipients: string[]
  channels: NotificationChannel[]
  template: string
  delay: number // minutes
}

// Regulatory requirement
export interface RegulatoryRequirement {
  authority: string
  notificationDeadline: number // hours
  reportingRequirements: string[]
  contactInfo: ContactInfo
}

// Incident response manager
export class IncidentResponseManager {
  private static instance: IncidentResponseManager
  private incidents: Map<string, SecurityIncident> = new Map()
  private responsePlans: Map<string, ResponsePlan> = new Map()
  private responseTeam: Map<string, ResponseTeamMember> = new Map()

  static getInstance(): IncidentResponseManager {
    if (!IncidentResponseManager.instance) {
      IncidentResponseManager.instance = new IncidentResponseManager()
      IncidentResponseManager.instance.initializeResponsePlans()
    }
    return IncidentResponseManager.instance
  }

  /**
   * Initialize default response plans
   */
  private initializeResponsePlans(): void {
    // Data breach response plan
    this.responsePlans.set('data_breach_critical', {
      incidentType: IncidentType.DATA_BREACH,
      severity: IncidentSeverity.CRITICAL,
      responseTeamRoles: [
        ResponseRole.INCIDENT_COMMANDER,
        ResponseRole.SECURITY_ANALYST,
        ResponseRole.LEGAL_COUNSEL,
        ResponseRole.COMPLIANCE_OFFICER,
        ResponseRole.COMMUNICATIONS_LEAD
      ],
      escalationCriteria: [
        'Personal data of more than 100 users compromised',
        'Sensitive financial information exposed',
        'System credentials compromised'
      ],
      containmentProcedures: [
        'Isolate affected systems immediately',
        'Preserve evidence and logs',
        'Reset compromised credentials',
        'Implement emergency access controls'
      ],
      communicationPlan: {
        internalNotifications: [
          {
            trigger: 'incident_created',
            recipients: ['security-team', 'management'],
            channels: [NotificationChannel.EMAIL, NotificationChannel.SLACK],
            template: 'critical_incident_alert',
            delay: 0
          }
        ],
        externalNotifications: [
          {
            trigger: 'data_breach_confirmed',
            recipients: ['affected-users'],
            channels: [NotificationChannel.EMAIL],
            template: 'data_breach_notification',
            delay: 60 // 1 hour after confirmation
          }
        ]
      },
      regulatoryRequirements: [
        {
          authority: 'Information Regulator (South Africa)',
          notificationDeadline: 72, // hours
          reportingRequirements: [
            'Nature of personal information involved',
            'Number of data subjects affected',
            'Possible consequences of the breach',
            'Measures taken to address the breach'
          ],
          contactInfo: {
            email: 'complaints.IR@justice.gov.za',
            phone: '+27 12 406 4818'
          }
        }
      ],
      maxResponseTime: 15 // minutes
    })

    // Security breach response plan
    this.responsePlans.set('security_breach_high', {
      incidentType: IncidentType.SECURITY_BREACH,
      severity: IncidentSeverity.HIGH,
      responseTeamRoles: [
        ResponseRole.INCIDENT_COMMANDER,
        ResponseRole.SECURITY_ANALYST,
        ResponseRole.TECHNICAL_LEAD
      ],
      escalationCriteria: [
        'Unauthorized access to production systems',
        'Privilege escalation detected',
        'Multiple failed authentication attempts'
      ],
      containmentProcedures: [
        'Block suspicious IP addresses',
        'Disable compromised accounts',
        'Enable enhanced monitoring',
        'Review access logs'
      ],
      communicationPlan: {
        internalNotifications: [
          {
            trigger: 'incident_created',
            recipients: ['security-team'],
            channels: [NotificationChannel.EMAIL, NotificationChannel.SLACK],
            template: 'security_incident_alert',
            delay: 0
          }
        ],
        externalNotifications: []
      },
      regulatoryRequirements: [],
      maxResponseTime: 30 // minutes
    })
  }

  /**
   * Report a new security incident
   */
  async reportIncident(
    type: IncidentType,
    severity: IncidentSeverity,
    title: string,
    description: string,
    reportedBy: string,
    affectedSystems: string[] = [],
    affectedUsers: string[] = []
  ): Promise<SecurityIncident> {
    const incidentId = `INC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const now = new Date()

    const incident: SecurityIncident = {
      id: incidentId,
      type,
      severity,
      status: IncidentStatus.REPORTED,
      title,
      description,
      affectedSystems,
      affectedUsers,
      detectedAt: now,
      reportedAt: now,
      reportedBy,
      responseTeam: [],
      timeline: [{
        id: `TL-${Date.now()}`,
        timestamp: now,
        action: 'incident_reported',
        description: `Incident reported: ${title}`,
        performedBy: reportedBy
      }],
      containmentActions: [],
      communicationLog: [],
      evidence: [],
      regulatoryNotifications: [],
      createdAt: now,
      updatedAt: now
    }

    // Store incident
    this.incidents.set(incidentId, incident)

    // Get response plan
    const planKey = `${type}_${severity}`
    const responsePlan = this.responsePlans.get(planKey) || this.getDefaultResponsePlan(type, severity)

    // Assign response team
    await this.assignResponseTeam(incidentId, responsePlan.responseTeamRoles)

    // Send initial notifications
    await this.sendNotifications(incident, 'incident_created', responsePlan)

    // Log incident creation
    await auditLog({
      userId: reportedBy,
      action: AuditAction.SECURITY_INCIDENT,
      resource: AuditResource.SYSTEM,
      resourceId: incidentId,
      details: {
        incidentType: type,
        severity,
        title,
        affectedSystems,
        affectedUsers: affectedUsers.length
      },
      ipAddress: '127.0.0.1', // Would be actual IP
      userAgent: 'Incident Response System'
    })

    return incident
  }

  /**
   * Update incident status
   */
  async updateIncidentStatus(
    incidentId: string,
    newStatus: IncidentStatus,
    updatedBy: string,
    notes?: string
  ): Promise<void> {
    const incident = this.incidents.get(incidentId)
    if (!incident) {
      throw new Error('Incident not found')
    }

    const oldStatus = incident.status
    incident.status = newStatus
    incident.updatedAt = new Date()

    // Add timeline entry
    incident.timeline.push({
      id: `TL-${Date.now()}`,
      timestamp: new Date(),
      action: 'status_updated',
      description: `Status changed from ${oldStatus} to ${newStatus}${notes ? `: ${notes}` : ''}`,
      performedBy: updatedBy
    })

    // Log status update
    await auditLog({
      userId: updatedBy,
      action: AuditAction.SECURITY_INCIDENT,
      resource: AuditResource.SYSTEM,
      resourceId: incidentId,
      details: {
        statusChange: {
          from: oldStatus,
          to: newStatus
        },
        notes
      },
      ipAddress: '127.0.0.1',
      userAgent: 'Incident Response System'
    })
  }

  /**
   * Add containment action
   */
  async addContainmentAction(
    incidentId: string,
    action: string,
    description: string,
    implementedBy: string
  ): Promise<void> {
    const incident = this.incidents.get(incidentId)
    if (!incident) {
      throw new Error('Incident not found')
    }

    const containmentAction: ContainmentAction = {
      id: `CA-${Date.now()}`,
      action,
      description,
      implementedAt: new Date(),
      implementedBy,
      effectiveness: 'effective' // Default, can be updated later
    }

    incident.containmentActions.push(containmentAction)
    incident.updatedAt = new Date()

    // Add timeline entry
    incident.timeline.push({
      id: `TL-${Date.now()}`,
      timestamp: new Date(),
      action: 'containment_action',
      description: `Containment action implemented: ${action}`,
      performedBy: implementedBy
    })

    // Log containment action
    await auditLog({
      userId: implementedBy,
      action: AuditAction.SECURITY_INCIDENT,
      resource: AuditResource.SYSTEM,
      resourceId: incidentId,
      details: {
        containmentAction: {
          action,
          description
        }
      },
      ipAddress: '127.0.0.1',
      userAgent: 'Incident Response System'
    })
  }

  /**
   * Add evidence to incident
   */
  async addEvidence(
    incidentId: string,
    type: Evidence['type'],
    filename: string,
    description: string,
    collectedBy: string,
    location: string
  ): Promise<void> {
    const incident = this.incidents.get(incidentId)
    if (!incident) {
      throw new Error('Incident not found')
    }

    const evidence: Evidence = {
      id: `EV-${Date.now()}`,
      type,
      filename,
      description,
      collectedAt: new Date(),
      collectedBy,
      hash: this.generateHash(filename), // Simplified hash generation
      location,
      chainOfCustody: [{
        timestamp: new Date(),
        action: 'collected',
        performedBy: collectedBy,
        location
      }]
    }

    incident.evidence.push(evidence)
    incident.updatedAt = new Date()

    // Add timeline entry
    incident.timeline.push({
      id: `TL-${Date.now()}`,
      timestamp: new Date(),
      action: 'evidence_collected',
      description: `Evidence collected: ${filename}`,
      performedBy: collectedBy,
      evidence: [evidence.id]
    })
  }

  /**
   * Send regulatory notifications
   */
  async sendRegulatoryNotifications(incidentId: string): Promise<void> {
    const incident = this.incidents.get(incidentId)
    if (!incident) {
      throw new Error('Incident not found')
    }

    const planKey = `${incident.type}_${incident.severity}`
    const responsePlan = this.responsePlans.get(planKey)
    
    if (responsePlan?.regulatoryRequirements) {
      for (const requirement of responsePlan.regulatoryRequirements) {
        const notification: RegulatoryNotification = {
          authority: requirement.authority,
          notifiedAt: new Date(),
          notificationMethod: 'email',
          status: 'sent'
        }

        incident.regulatoryNotifications.push(notification)

        // Add timeline entry
        incident.timeline.push({
          id: `TL-${Date.now()}`,
          timestamp: new Date(),
          action: 'regulatory_notification',
          description: `Regulatory notification sent to ${requirement.authority}`,
          performedBy: 'system'
        })
      }
    }

    incident.updatedAt = new Date()
  }

  /**
   * Get incident by ID
   */
  getIncident(incidentId: string): SecurityIncident | undefined {
    return this.incidents.get(incidentId)
  }

  /**
   * Get all incidents with filtering
   */
  getIncidents(filters?: {
    type?: IncidentType
    severity?: IncidentSeverity
    status?: IncidentStatus
    startDate?: Date
    endDate?: Date
  }): SecurityIncident[] {
    let incidents = Array.from(this.incidents.values())

    if (filters) {
      if (filters.type) {
        incidents = incidents.filter(i => i.type === filters.type)
      }
      if (filters.severity) {
        incidents = incidents.filter(i => i.severity === filters.severity)
      }
      if (filters.status) {
        incidents = incidents.filter(i => i.status === filters.status)
      }
      if (filters.startDate) {
        incidents = incidents.filter(i => i.createdAt >= filters.startDate!)
      }
      if (filters.endDate) {
        incidents = incidents.filter(i => i.createdAt <= filters.endDate!)
      }
    }

    return incidents.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  /**
   * Get incident statistics
   */
  getIncidentStatistics(timeframe: 'day' | 'week' | 'month' = 'month'): any {
    const now = new Date()
    const startDate = new Date()
    
    switch (timeframe) {
      case 'day':
        startDate.setDate(now.getDate() - 1)
        break
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
    }

    const incidents = this.getIncidents({ startDate })

    return {
      total: incidents.length,
      byType: this.groupBy(incidents, 'type'),
      bySeverity: this.groupBy(incidents, 'severity'),
      byStatus: this.groupBy(incidents, 'status'),
      averageResolutionTime: this.calculateAverageResolutionTime(incidents),
      openIncidents: incidents.filter(i => 
        ![IncidentStatus.RESOLVED, IncidentStatus.CLOSED].includes(i.status)
      ).length
    }
  }

  /**
   * Private helper methods
   */
  private async assignResponseTeam(incidentId: string, roles: ResponseRole[]): Promise<void> {
    const incident = this.incidents.get(incidentId)
    if (!incident) return

    // This would typically query a database for available team members
    // For now, we'll create mock assignments
    for (const role of roles) {
      const teamMember: ResponseTeamMember = {
        userId: `user_${role}`,
        role,
        contactInfo: {
          email: `${role}@company.com`,
          phone: '+27123456789'
        },
        assignedAt: new Date(),
        isActive: true
      }

      incident.responseTeam.push(teamMember)
    }
  }

  private async sendNotifications(
    incident: SecurityIncident,
    trigger: string,
    responsePlan: ResponsePlan
  ): Promise<void> {
    // This would integrate with actual notification services
    // For now, we'll log the notifications
    console.log(`Sending notifications for incident ${incident.id}, trigger: ${trigger}`)
    
    const notifications = [
      ...responsePlan.communicationPlan.internalNotifications,
      ...responsePlan.communicationPlan.externalNotifications
    ].filter(n => n.trigger === trigger)

    for (const notification of notifications) {
      const communicationEntry: CommunicationEntry = {
        id: `COM-${Date.now()}`,
        timestamp: new Date(),
        channel: notification.channels[0], // Use first channel
        recipient: notification.recipients.join(', '),
        message: `Incident Alert: ${incident.title}`,
        sentBy: 'system'
      }

      incident.communicationLog.push(communicationEntry)
    }
  }

  private getDefaultResponsePlan(type: IncidentType, severity: IncidentSeverity): ResponsePlan {
    return {
      incidentType: type,
      severity,
      responseTeamRoles: [ResponseRole.INCIDENT_COMMANDER, ResponseRole.SECURITY_ANALYST],
      escalationCriteria: ['Default escalation criteria'],
      containmentProcedures: ['Default containment procedures'],
      communicationPlan: {
        internalNotifications: [],
        externalNotifications: []
      },
      regulatoryRequirements: [],
      maxResponseTime: 60
    }
  }

  private generateHash(input: string): string {
    // Simplified hash generation - would use proper cryptographic hash in production
    return Buffer.from(input).toString('base64').substring(0, 16)
  }

  private groupBy(items: SecurityIncident[], key: keyof SecurityIncident): Record<string, number> {
    return items.reduce((acc, item) => {
      const value = item[key] as string
      acc[value] = (acc[value] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  private calculateAverageResolutionTime(incidents: SecurityIncident[]): number {
    const resolvedIncidents = incidents.filter(i => 
      [IncidentStatus.RESOLVED, IncidentStatus.CLOSED].includes(i.status)
    )

    if (resolvedIncidents.length === 0) return 0

    const totalTime = resolvedIncidents.reduce((sum, incident) => {
      const resolutionTime = incident.updatedAt.getTime() - incident.createdAt.getTime()
      return sum + resolutionTime
    }, 0)

    return Math.round(totalTime / resolvedIncidents.length / (1000 * 60 * 60)) // hours
  }
}

// Export singleton instance
export const incidentResponseManager = IncidentResponseManager.getInstance()

// Utility functions for common incident types
export async function reportDataBreach(
  description: string,
  affectedUsers: string[],
  reportedBy: string,
  severity: IncidentSeverity = IncidentSeverity.CRITICAL
): Promise<SecurityIncident> {
  return incidentResponseManager.reportIncident(
    IncidentType.DATA_BREACH,
    severity,
    'Data Breach Detected',
    description,
    reportedBy,
    [],
    affectedUsers
  )
}

export async function reportSecurityBreach(
  description: string,
  affectedSystems: string[],
  reportedBy: string,
  severity: IncidentSeverity = IncidentSeverity.HIGH
): Promise<SecurityIncident> {
  return incidentResponseManager.reportIncident(
    IncidentType.SECURITY_BREACH,
    severity,
    'Security Breach Detected',
    description,
    reportedBy,
    affectedSystems
  )
}

export async function reportUnauthorizedAccess(
  description: string,
  userId: string,
  reportedBy: string,
  severity: IncidentSeverity = IncidentSeverity.HIGH
): Promise<SecurityIncident> {
  return incidentResponseManager.reportIncident(
    IncidentType.UNAUTHORIZED_ACCESS,
    severity,
    'Unauthorized Access Detected',
    description,
    reportedBy,
    [],
    [userId]
  )
}