import { auditLog, AuditAction, AuditResource } from './audit-logger'

// Contact types
export enum ContactType {
  SECURITY_TEAM = 'security_team',
  INCIDENT_COMMANDER = 'incident_commander',
  TECHNICAL_LEAD = 'technical_lead',
  LEGAL_COUNSEL = 'legal_counsel',
  COMPLIANCE_OFFICER = 'compliance_officer',
  COMMUNICATIONS_LEAD = 'communications_lead',
  EXECUTIVE_LEADERSHIP = 'executive_leadership',
  EXTERNAL_CONSULTANT = 'external_consultant',
  REGULATORY_AUTHORITY = 'regulatory_authority',
  LAW_ENFORCEMENT = 'law_enforcement',
  VENDOR_SUPPORT = 'vendor_support',
  EMERGENCY_SERVICES = 'emergency_services'
}

// Contact priority levels
export enum ContactPriority {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  ESCALATION = 'escalation',
  EMERGENCY = 'emergency'
}

// Contact availability
export enum ContactAvailability {
  ALWAYS = 'always',
  BUSINESS_HOURS = 'business_hours',
  ON_CALL = 'on_call',
  EMERGENCY_ONLY = 'emergency_only'
}

// Notification methods
export enum NotificationMethod {
  EMAIL = 'email',
  SMS = 'sms',
  PHONE = 'phone',
  SLACK = 'slack',
  TEAMS = 'teams',
  WEBHOOK = 'webhook',
  PAGER = 'pager'
}

// Security contact interface
export interface SecurityContact {
  id: string
  name: string
  title: string
  organization: string
  type: ContactType
  priority: ContactPriority
  availability: ContactAvailability
  contactMethods: ContactMethod[]
  specialties: string[]
  languages: string[]
  timezone: string
  isActive: boolean
  lastContactedAt?: Date
  responseTimeMinutes?: number
  notes?: string
  emergencyOnly: boolean
  createdAt: Date
  updatedAt: Date
}

// Contact method
export interface ContactMethod {
  method: NotificationMethod
  value: string
  isPrimary: boolean
  isVerified: boolean
  verifiedAt?: Date
  lastUsedAt?: Date
  failureCount: number
  maxRetries: number
}

// Escalation rule
export interface EscalationRule {
  id: string
  name: string
  description: string
  triggerConditions: EscalationTrigger[]
  escalationSteps: EscalationStep[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Escalation trigger
export interface EscalationTrigger {
  type: 'time_based' | 'severity_based' | 'no_response' | 'manual'
  condition: string
  value: any
}

// Escalation step
export interface EscalationStep {
  stepNumber: number
  delayMinutes: number
  contactTypes: ContactType[]
  contactIds: string[]
  notificationMethods: NotificationMethod[]
  message: string
  requiresAcknowledgment: boolean
  timeoutMinutes: number
}

// Contact attempt
export interface ContactAttempt {
  id: string
  contactId: string
  method: NotificationMethod
  message: string
  attemptedAt: Date
  success: boolean
  responseAt?: Date
  responseMessage?: string
  errorMessage?: string
  retryCount: number
}

// Emergency contact list
export interface EmergencyContactList {
  id: string
  name: string
  description: string
  contacts: string[] // Contact IDs
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

// Security contact manager
export class SecurityContactManager {
  private static instance: SecurityContactManager
  private contacts: Map<string, SecurityContact> = new Map()
  private escalationRules: Map<string, EscalationRule> = new Map()
  private contactAttempts: Map<string, ContactAttempt> = new Map()
  private emergencyLists: Map<string, EmergencyContactList> = new Map()

  static getInstance(): SecurityContactManager {
    if (!SecurityContactManager.instance) {
      SecurityContactManager.instance = new SecurityContactManager()
      SecurityContactManager.instance.initializeDefaultContacts()
    }
    return SecurityContactManager.instance
  }

  /**
   * Initialize default security contacts
   */
  private initializeDefaultContacts(): void {
    // Security Team Lead
    this.addContact({
      name: 'Security Team Lead',
      title: 'Chief Information Security Officer',
      organization: 'JobFinders',
      type: ContactType.SECURITY_TEAM,
      priority: ContactPriority.PRIMARY,
      availability: ContactAvailability.ALWAYS,
      contactMethods: [
        {
          method: NotificationMethod.EMAIL,
          value: 'security@jobfinders.co.za',
          isPrimary: true,
          isVerified: true,
          verifiedAt: new Date(),
          failureCount: 0,
          maxRetries: 3
        },
        {
          method: NotificationMethod.SMS,
          value: '+27123456789',
          isPrimary: false,
          isVerified: true,
          verifiedAt: new Date(),
          failureCount: 0,
          maxRetries: 3
        },
        {
          method: NotificationMethod.PHONE,
          value: '+27123456789',
          isPrimary: false,
          isVerified: true,
          verifiedAt: new Date(),
          failureCount: 0,
          maxRetries: 2
        }
      ],
      specialties: ['Incident Response', 'Threat Analysis', 'Compliance'],
      languages: ['English', 'Afrikaans'],
      timezone: 'Africa/Johannesburg',
      emergencyOnly: false
    })

    // Legal Counsel
    this.addContact({
      name: 'Legal Counsel',
      title: 'General Counsel',
      organization: 'JobFinders Legal',
      type: ContactType.LEGAL_COUNSEL,
      priority: ContactPriority.SECONDARY,
      availability: ContactAvailability.BUSINESS_HOURS,
      contactMethods: [
        {
          method: NotificationMethod.EMAIL,
          value: 'legal@jobfinders.co.za',
          isPrimary: true,
          isVerified: true,
          verifiedAt: new Date(),
          failureCount: 0,
          maxRetries: 3
        },
        {
          method: NotificationMethod.PHONE,
          value: '+27123456790',
          isPrimary: false,
          isVerified: true,
          verifiedAt: new Date(),
          failureCount: 0,
          maxRetries: 2
        }
      ],
      specialties: ['Data Protection Law', 'POPIA Compliance', 'Breach Notification'],
      languages: ['English'],
      timezone: 'Africa/Johannesburg',
      emergencyOnly: false
    })

    // Information Regulator (South Africa)
    this.addContact({
      name: 'Information Regulator',
      title: 'Regulatory Authority',
      organization: 'Information Regulator (South Africa)',
      type: ContactType.REGULATORY_AUTHORITY,
      priority: ContactPriority.ESCALATION,
      availability: ContactAvailability.BUSINESS_HOURS,
      contactMethods: [
        {
          method: NotificationMethod.EMAIL,
          value: 'complaints.IR@justice.gov.za',
          isPrimary: true,
          isVerified: true,
          verifiedAt: new Date(),
          failureCount: 0,
          maxRetries: 3
        },
        {
          method: NotificationMethod.PHONE,
          value: '+27124064818',
          isPrimary: false,
          isVerified: true,
          verifiedAt: new Date(),
          failureCount: 0,
          maxRetries: 2
        }
      ],
      specialties: ['POPIA Enforcement', 'Data Breach Investigation'],
      languages: ['English', 'Afrikaans'],
      timezone: 'Africa/Johannesburg',
      emergencyOnly: false
    })

    // External Security Consultant
    this.addContact({
      name: 'External Security Consultant',
      title: 'Senior Security Consultant',
      organization: 'CyberSec Solutions',
      type: ContactType.EXTERNAL_CONSULTANT,
      priority: ContactPriority.ESCALATION,
      availability: ContactAvailability.ON_CALL,
      contactMethods: [
        {
          method: NotificationMethod.EMAIL,
          value: 'emergency@cybersec.co.za',
          isPrimary: true,
          isVerified: true,
          verifiedAt: new Date(),
          failureCount: 0,
          maxRetries: 3
        },
        {
          method: NotificationMethod.PHONE,
          value: '+27123456791',
          isPrimary: false,
          isVerified: true,
          verifiedAt: new Date(),
          failureCount: 0,
          maxRetries: 2
        }
      ],
      specialties: ['Forensic Analysis', 'Malware Analysis', 'Incident Response'],
      languages: ['English'],
      timezone: 'Africa/Johannesburg',
      emergencyOnly: false
    })

    // Initialize default escalation rules
    this.initializeEscalationRules()

    // Initialize default emergency contact lists
    this.initializeEmergencyLists()
  }

  /**
   * Initialize default escalation rules
   */
  private initializeEscalationRules(): void {
    // Critical incident escalation
    this.escalationRules.set('critical_incident', {
      id: 'critical_incident',
      name: 'Critical Incident Escalation',
      description: 'Escalation procedure for critical security incidents',
      triggerConditions: [
        {
          type: 'severity_based',
          condition: 'severity_equals',
          value: 'critical'
        }
      ],
      escalationSteps: [
        {
          stepNumber: 1,
          delayMinutes: 0,
          contactTypes: [ContactType.SECURITY_TEAM],
          contactIds: [],
          notificationMethods: [NotificationMethod.EMAIL, NotificationMethod.SMS],
          message: 'CRITICAL SECURITY INCIDENT: Immediate attention required',
          requiresAcknowledgment: true,
          timeoutMinutes: 15
        },
        {
          stepNumber: 2,
          delayMinutes: 15,
          contactTypes: [ContactType.INCIDENT_COMMANDER, ContactType.EXECUTIVE_LEADERSHIP],
          contactIds: [],
          notificationMethods: [NotificationMethod.PHONE, NotificationMethod.SMS],
          message: 'ESCALATION: Critical security incident requires executive attention',
          requiresAcknowledgment: true,
          timeoutMinutes: 30
        },
        {
          stepNumber: 3,
          delayMinutes: 45,
          contactTypes: [ContactType.EXTERNAL_CONSULTANT],
          contactIds: [],
          notificationMethods: [NotificationMethod.PHONE, NotificationMethod.EMAIL],
          message: 'EXTERNAL SUPPORT REQUIRED: Critical incident escalation',
          requiresAcknowledgment: false,
          timeoutMinutes: 60
        }
      ],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    // Data breach escalation
    this.escalationRules.set('data_breach', {
      id: 'data_breach',
      name: 'Data Breach Escalation',
      description: 'Escalation procedure for data breach incidents',
      triggerConditions: [
        {
          type: 'severity_based',
          condition: 'incident_type_equals',
          value: 'data_breach'
        }
      ],
      escalationSteps: [
        {
          stepNumber: 1,
          delayMinutes: 0,
          contactTypes: [ContactType.SECURITY_TEAM, ContactType.LEGAL_COUNSEL],
          contactIds: [],
          notificationMethods: [NotificationMethod.EMAIL, NotificationMethod.SMS],
          message: 'DATA BREACH DETECTED: Legal and security review required',
          requiresAcknowledgment: true,
          timeoutMinutes: 30
        },
        {
          stepNumber: 2,
          delayMinutes: 60,
          contactTypes: [ContactType.COMPLIANCE_OFFICER],
          contactIds: [],
          notificationMethods: [NotificationMethod.EMAIL, NotificationMethod.PHONE],
          message: 'DATA BREACH: Regulatory notification assessment required',
          requiresAcknowledgment: true,
          timeoutMinutes: 120
        },
        {
          stepNumber: 3,
          delayMinutes: 180,
          contactTypes: [ContactType.REGULATORY_AUTHORITY],
          contactIds: [],
          notificationMethods: [NotificationMethod.EMAIL],
          message: 'REGULATORY NOTIFICATION: Data breach incident report',
          requiresAcknowledgment: false,
          timeoutMinutes: 1440 // 24 hours
        }
      ],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }

  /**
   * Initialize default emergency contact lists
   */
  private initializeEmergencyLists(): void {
    // Default emergency response team
    const securityTeamContacts = Array.from(this.contacts.values())
      .filter(contact => [
        ContactType.SECURITY_TEAM,
        ContactType.INCIDENT_COMMANDER,
        ContactType.TECHNICAL_LEAD
      ].includes(contact.type))
      .map(contact => contact.id)

    this.emergencyLists.set('emergency_response', {
      id: 'emergency_response',
      name: 'Emergency Response Team',
      description: 'Primary contacts for emergency security incidents',
      contacts: securityTeamContacts,
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    // Legal and compliance team
    const legalContacts = Array.from(this.contacts.values())
      .filter(contact => [
        ContactType.LEGAL_COUNSEL,
        ContactType.COMPLIANCE_OFFICER,
        ContactType.REGULATORY_AUTHORITY
      ].includes(contact.type))
      .map(contact => contact.id)

    this.emergencyLists.set('legal_compliance', {
      id: 'legal_compliance',
      name: 'Legal & Compliance Team',
      description: 'Legal and regulatory contacts for compliance incidents',
      contacts: legalContacts,
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }

  /**
   * Add a new security contact
   */
  async addContact(contactData: Omit<SecurityContact, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>): Promise<SecurityContact> {
    const contactId = `CONTACT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const contact: SecurityContact = {
      id: contactId,
      ...contactData,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.contacts.set(contactId, contact)

    // Log contact creation
    await auditLog({
      userId: 'system',
      action: AuditAction.CREATE,
      resource: AuditResource.SYSTEM,
      resourceId: contactId,
      details: {
        contactType: contact.type,
        contactName: contact.name,
        organization: contact.organization
      },
      ipAddress: '127.0.0.1',
      userAgent: 'Security Contact System'
    })

    return contact
  }

  /**
   * Update a security contact
   */
  async updateContact(
    contactId: string,
    updates: Partial<Omit<SecurityContact, 'id' | 'createdAt' | 'updatedAt'>>,
    updatedBy: string
  ): Promise<void> {
    const contact = this.contacts.get(contactId)
    if (!contact) {
      throw new Error('Contact not found')
    }

    const updatedContact = {
      ...contact,
      ...updates,
      updatedAt: new Date()
    }

    this.contacts.set(contactId, updatedContact)

    // Log contact update
    await auditLog({
      userId: updatedBy,
      action: AuditAction.UPDATE,
      resource: AuditResource.SYSTEM,
      resourceId: contactId,
      details: {
        updates,
        contactName: contact.name
      },
      ipAddress: '127.0.0.1',
      userAgent: 'Security Contact System'
    })
  }

  /**
   * Send notification to contact
   */
  async notifyContact(
    contactId: string,
    message: string,
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    preferredMethods?: NotificationMethod[]
  ): Promise<ContactAttempt[]> {
    const contact = this.contacts.get(contactId)
    if (!contact || !contact.isActive) {
      throw new Error('Contact not found or inactive')
    }

    const attempts: ContactAttempt[] = []
    let methodsToTry = contact.contactMethods

    // Filter by preferred methods if specified
    if (preferredMethods && preferredMethods.length > 0) {
      methodsToTry = methodsToTry.filter(method => 
        preferredMethods.includes(method.method)
      )
    }

    // Sort by priority (primary first) and filter verified methods
    methodsToTry = methodsToTry
      .filter(method => method.isVerified && method.failureCount < method.maxRetries)
      .sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0))

    for (const contactMethod of methodsToTry) {
      const attemptId = `ATTEMPT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      const attempt: ContactAttempt = {
        id: attemptId,
        contactId,
        method: contactMethod.method,
        message,
        attemptedAt: new Date(),
        success: false,
        retryCount: 0
      }

      try {
        // Simulate sending notification (in real implementation, integrate with actual services)
        const success = await this.sendNotification(contactMethod, message, priority)
        
        attempt.success = success
        
        if (success) {
          // Update contact method last used
          contactMethod.lastUsedAt = new Date()
          contactMethod.failureCount = 0
          
          // Update contact last contacted
          contact.lastContactedAt = new Date()
          
          attempts.push(attempt)
          break // Stop trying other methods if successful
        } else {
          contactMethod.failureCount++
          attempt.errorMessage = 'Failed to deliver notification'
        }
      } catch (error) {
        attempt.success = false
        attempt.errorMessage = error instanceof Error ? error.message : 'Unknown error'
        contactMethod.failureCount++
      }

      attempts.push(attempt)
      this.contactAttempts.set(attemptId, attempt)
    }

    // Log notification attempt
    await auditLog({
      userId: 'system',
      action: AuditAction.NOTIFICATION,
      resource: AuditResource.SYSTEM,
      resourceId: contactId,
      details: {
        message: message.substring(0, 100), // Truncate for logging
        priority,
        attempts: attempts.length,
        successful: attempts.some(a => a.success)
      },
      ipAddress: '127.0.0.1',
      userAgent: 'Security Contact System'
    })

    return attempts
  }

  /**
   * Execute escalation rule
   */
  async executeEscalation(
    ruleId: string,
    incidentId: string,
    incidentData: any
  ): Promise<void> {
    const rule = this.escalationRules.get(ruleId)
    if (!rule || !rule.isActive) {
      throw new Error('Escalation rule not found or inactive')
    }

    // Check if rule should trigger
    const shouldTrigger = this.evaluateEscalationTriggers(rule.triggerConditions, incidentData)
    if (!shouldTrigger) {
      return
    }

    // Execute escalation steps
    for (const step of rule.escalationSteps) {
      // Wait for delay if specified
      if (step.delayMinutes > 0) {
        setTimeout(async () => {
          await this.executeEscalationStep(step, incidentId, incidentData)
        }, step.delayMinutes * 60 * 1000)
      } else {
        await this.executeEscalationStep(step, incidentId, incidentData)
      }
    }

    // Log escalation execution
    await auditLog({
      userId: 'system',
      action: AuditAction.ESCALATION,
      resource: AuditResource.SYSTEM,
      resourceId: incidentId,
      details: {
        escalationRule: ruleId,
        ruleName: rule.name,
        stepsExecuted: rule.escalationSteps.length
      },
      ipAddress: '127.0.0.1',
      userAgent: 'Security Contact System'
    })
  }

  /**
   * Get contacts by type
   */
  getContactsByType(type: ContactType): SecurityContact[] {
    return Array.from(this.contacts.values())
      .filter(contact => contact.type === type && contact.isActive)
      .sort((a, b) => {
        // Sort by priority
        const priorityOrder = {
          [ContactPriority.PRIMARY]: 0,
          [ContactPriority.SECONDARY]: 1,
          [ContactPriority.ESCALATION]: 2,
          [ContactPriority.EMERGENCY]: 3
        }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      })
  }

  /**
   * Get emergency contact list
   */
  getEmergencyContactList(listId?: string): SecurityContact[] {
    const list = listId 
      ? this.emergencyLists.get(listId)
      : Array.from(this.emergencyLists.values()).find(list => list.isDefault)

    if (!list) {
      return []
    }

    return list.contacts
      .map(contactId => this.contacts.get(contactId))
      .filter((contact): contact is SecurityContact => contact !== undefined && contact.isActive)
  }

  /**
   * Test contact method
   */
  async testContact(contactId: string, method?: NotificationMethod): Promise<boolean> {
    const contact = this.contacts.get(contactId)
    if (!contact) {
      throw new Error('Contact not found')
    }

    const testMessage = `Test notification from JobFinders Security System at ${new Date().toISOString()}`
    
    if (method) {
      const contactMethod = contact.contactMethods.find(cm => cm.method === method)
      if (!contactMethod) {
        throw new Error('Contact method not found')
      }
      
      return this.sendNotification(contactMethod, testMessage, 'low')
    } else {
      // Test primary method
      const primaryMethod = contact.contactMethods.find(cm => cm.isPrimary)
      if (!primaryMethod) {
        throw new Error('No primary contact method found')
      }
      
      return this.sendNotification(primaryMethod, testMessage, 'low')
    }
  }

  /**
   * Get contact statistics
   */
  getContactStatistics(): any {
    const contacts = Array.from(this.contacts.values())
    const attempts = Array.from(this.contactAttempts.values())

    return {
      totalContacts: contacts.length,
      activeContacts: contacts.filter(c => c.isActive).length,
      contactsByType: this.groupBy(contacts, 'type'),
      contactsByPriority: this.groupBy(contacts, 'priority'),
      contactsByAvailability: this.groupBy(contacts, 'availability'),
      totalAttempts: attempts.length,
      successfulAttempts: attempts.filter(a => a.success).length,
      failureRate: attempts.length > 0 
        ? Math.round((attempts.filter(a => !a.success).length / attempts.length) * 100)
        : 0,
      averageResponseTime: this.calculateAverageResponseTime(contacts)
    }
  }

  /**
   * Private helper methods
   */
  private async sendNotification(
    contactMethod: ContactMethod,
    message: string,
    priority: string
  ): Promise<boolean> {
    // Simulate notification sending - in real implementation, integrate with actual services
    console.log(`Sending ${contactMethod.method} to ${contactMethod.value}: ${message}`)
    
    // Simulate success/failure based on method reliability
    const reliability = {
      [NotificationMethod.EMAIL]: 0.95,
      [NotificationMethod.SMS]: 0.90,
      [NotificationMethod.PHONE]: 0.85,
      [NotificationMethod.SLACK]: 0.98,
      [NotificationMethod.TEAMS]: 0.98,
      [NotificationMethod.WEBHOOK]: 0.99,
      [NotificationMethod.PAGER]: 0.99
    }

    return Math.random() < (reliability[contactMethod.method] || 0.90)
  }

  private async executeEscalationStep(
    step: EscalationStep,
    incidentId: string,
    incidentData: any
  ): Promise<void> {
    // Get contacts for this step
    let contacts: SecurityContact[] = []

    // Add contacts by type
    for (const contactType of step.contactTypes) {
      contacts.push(...this.getContactsByType(contactType))
    }

    // Add specific contacts
    for (const contactId of step.contactIds) {
      const contact = this.contacts.get(contactId)
      if (contact && contact.isActive) {
        contacts.push(contact)
      }
    }

    // Remove duplicates
    contacts = contacts.filter((contact, index, self) => 
      self.findIndex(c => c.id === contact.id) === index
    )

    // Send notifications
    for (const contact of contacts) {
      try {
        await this.notifyContact(
          contact.id,
          step.message,
          'high',
          step.notificationMethods
        )
      } catch (error) {
        console.error(`Failed to notify contact ${contact.id}:`, error)
      }
    }
  }

  private evaluateEscalationTriggers(
    triggers: EscalationTrigger[],
    incidentData: any
  ): boolean {
    return triggers.some(trigger => {
      switch (trigger.type) {
        case 'severity_based':
          return trigger.condition === 'severity_equals' && 
                 incidentData.severity === trigger.value
        case 'time_based':
          // Implement time-based triggers
          return false
        case 'no_response':
          // Implement no-response triggers
          return false
        case 'manual':
          return trigger.value === true
        default:
          return false
      }
    })
  }

  private groupBy(items: any[], key: string): Record<string, number> {
    return items.reduce((acc, item) => {
      const value = item[key]
      acc[value] = (acc[value] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  private calculateAverageResponseTime(contacts: SecurityContact[]): number {
    const contactsWithResponseTime = contacts.filter(c => c.responseTimeMinutes)
    if (contactsWithResponseTime.length === 0) return 0

    const totalTime = contactsWithResponseTime.reduce((sum, contact) => 
      sum + (contact.responseTimeMinutes || 0), 0
    )

    return Math.round(totalTime / contactsWithResponseTime.length)
  }
}

// Export singleton instance
export const securityContactManager = SecurityContactManager.getInstance()

// Utility functions
export async function notifyEmergencyContacts(
  message: string,
  priority: 'low' | 'medium' | 'high' | 'critical' = 'high',
  listId?: string
): Promise<ContactAttempt[]> {
  const contacts = securityContactManager.getEmergencyContactList(listId)
  const allAttempts: ContactAttempt[] = []

  for (const contact of contacts) {
    try {
      const attempts = await securityContactManager.notifyContact(
        contact.id,
        message,
        priority
      )
      allAttempts.push(...attempts)
    } catch (error) {
      console.error(`Failed to notify emergency contact ${contact.id}:`, error)
    }
  }

  return allAttempts
}

export async function escalateIncident(
  incidentType: string,
  incidentSeverity: string,
  incidentId: string,
  incidentData: any
): Promise<void> {
  // Determine escalation rule based on incident type and severity
  let ruleId: string

  if (incidentType === 'data_breach') {
    ruleId = 'data_breach'
  } else if (incidentSeverity === 'critical') {
    ruleId = 'critical_incident'
  } else {
    // No escalation needed
    return
  }

  await securityContactManager.executeEscalation(ruleId, incidentId, incidentData)
}