import { db } from '../db'
import { NotificationTemplate } from '@prisma/client'

/**
 * Template management system for notification emails
 * Handles CRUD operations and template seeding
 */
export class TemplateManager {
  /**
   * Create a new email template
   */
  async createTemplate(templateData: {
    name: string
    type: string
    subject?: string
    htmlContent?: string
    textContent: string
    variables?: Record<string, any>
    createdBy: string
  }): Promise<NotificationTemplate> {
    try {
      return await db.notificationTemplate.create({
        data: {
          ...templateData,
          channel: 'email',
          isActive: true,
          version: 1
        }
      })
    } catch (error) {
      console.error('Failed to create template:', error)
      throw error
    }
  }

  /**
   * Get template by name
   */
  async getTemplate(name: string): Promise<NotificationTemplate | null> {
    return await db.notificationTemplate.findFirst({
      where: {
        name,
        channel: 'email',
        isActive: true
      }
    })
  }

  /**
   * Update existing template
   */
  async updateTemplate(
    name: string,
    updates: Partial<NotificationTemplate>
  ): Promise<NotificationTemplate> {
    return await db.notificationTemplate.update({
      where: { name },
      data: {
        ...updates,
        updatedAt: new Date()
      }
    })
  }

  /**
   * Deactivate template
   */
  async deactivateTemplate(name: string): Promise<void> {
    await db.notificationTemplate.update({
      where: { name },
      data: { isActive: false }
    })
  }

  /**
   * Seed default email templates
   */
  async seedDefaultTemplates(): Promise<void> {
    const defaultTemplates = [
      {
        name: 'application_status_update',
        type: 'application_status',
        subject: 'Application Status Update - {{jobTitle}}',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Application Status Update</h2>
            <p>Hello {{userName}},</p>
            <p>Your application for <strong>{{jobTitle}}</strong> at <strong>{{companyName}}</strong> has been updated.</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>New Status:</strong> {{newStatus}}</p>
              <p><strong>Updated:</strong> {{updatedAt}}</p>
            </div>
            <p>You can view more details by logging into your JobFinders dashboard.</p>
            <a href="{{dashboardUrl}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Application</a>
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              Best regards,<br>
              The JobFinders Team
            </p>
          </div>
        `,
        textContent: `
Application Status Update

Hello {{userName}},

Your application for {{jobTitle}} at {{companyName}} has been updated.

New Status: {{newStatus}}
Updated: {{updatedAt}}

You can view more details by logging into your JobFinders dashboard at {{dashboardUrl}}.

Best regards,
The JobFinders Team
        `,
        variables: {
          userName: 'string',
          jobTitle: 'string',
          companyName: 'string',
          newStatus: 'string',
          updatedAt: 'string',
          dashboardUrl: 'string'
        },
        createdBy: 'system'
      },
      {
        name: 'new_job_match',
        type: 'job_match',
        subject: 'New Job Match Found - {{jobTitle}}',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">New Job Match Found!</h2>
            <p>Hello {{userName}},</p>
            <p>We found a job that matches your profile and preferences!</p>
            <div style="border: 1px solid #d1d5db; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #1f2937;">{{jobTitle}}</h3>
              <p style="color: #6b7280; margin: 5px 0;"><strong>{{companyName}}</strong> • {{location}}</p>
              <p style="color: #6b7280; margin: 5px 0;">{{salaryRange}}</p>
              <p style="margin: 15px 0;">{{jobDescription}}</p>
              <div style="background: #ecfdf5; padding: 10px; border-radius: 6px; margin: 15px 0;">
                <p style="margin: 0; color: #059669;"><strong>Match Score: {{matchScore}}%</strong></p>
              </div>
            </div>
            <a href="{{jobUrl}}" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Job Details</a>
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              Best regards,<br>
              The JobFinders Team
            </p>
          </div>
        `,
        textContent: `
New Job Match Found!

Hello {{userName}},

We found a job that matches your profile and preferences!

{{jobTitle}}
{{companyName}} • {{location}}
{{salaryRange}}

{{jobDescription}}

Match Score: {{matchScore}}%

View job details at: {{jobUrl}}

Best regards,
The JobFinders Team
        `,
        variables: {
          userName: 'string',
          jobTitle: 'string',
          companyName: 'string',
          location: 'string',
          salaryRange: 'string',
          jobDescription: 'string',
          matchScore: 'number',
          jobUrl: 'string'
        },
        createdBy: 'system'
      },
      {
        name: 'welcome_email',
        type: 'welcome',
        subject: 'Welcome to JobFinders - Your Career Journey Starts Here!',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb; text-align: center;">Welcome to JobFinders!</h1>
            <p>Hello {{userName}},</p>
            <p>Welcome to JobFinders! We're excited to help you find your next career opportunity.</p>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 15px 0;">Get Started:</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li>Complete your profile to get better job matches</li>
                <li>Upload your resume for quick applications</li>
                <li>Set up job alerts for your preferred roles</li>
                <li>Explore companies and job opportunities</li>
              </ul>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{profileUrl}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 0 10px;">Complete Profile</a>
              <a href="{{jobsUrl}}" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 0 10px;">Browse Jobs</a>
            </div>
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              If you have any questions, feel free to contact our support team.<br><br>
              Best regards,<br>
              The JobFinders Team
            </p>
          </div>
        `,
        textContent: `
Welcome to JobFinders!

Hello {{userName}},

Welcome to JobFinders! We're excited to help you find your next career opportunity.

Get Started:
- Complete your profile to get better job matches
- Upload your resume for quick applications  
- Set up job alerts for your preferred roles
- Explore companies and job opportunities

Complete your profile: {{profileUrl}}
Browse jobs: {{jobsUrl}}

If you have any questions, feel free to contact our support team.

Best regards,
The JobFinders Team
        `,
        variables: {
          userName: 'string',
          profileUrl: 'string',
          jobsUrl: 'string'
        },
        createdBy: 'system'
      },
      {
        name: 'application_received',
        type: 'application_received',
        subject: 'Application Received - {{jobTitle}}',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Application Received</h2>
            <p>Hello {{userName}},</p>
            <p>Thank you for applying to <strong>{{jobTitle}}</strong> at <strong>{{companyName}}</strong>.</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Application ID:</strong> {{applicationId}}</p>
              <p><strong>Submitted:</strong> {{submittedAt}}</p>
              <p><strong>Status:</strong> Under Review</p>
            </div>
            <p>We'll keep you updated on the progress of your application. You can track its status in your dashboard.</p>
            <a href="{{applicationUrl}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Track Application</a>
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              Best regards,<br>
              The JobFinders Team
            </p>
          </div>
        `,
        textContent: `
Application Received

Hello {{userName}},

Thank you for applying to {{jobTitle}} at {{companyName}}.

Application ID: {{applicationId}}
Submitted: {{submittedAt}}
Status: Under Review

We'll keep you updated on the progress of your application. You can track its status in your dashboard at {{applicationUrl}}.

Best regards,
The JobFinders Team
        `,
        variables: {
          userName: 'string',
          jobTitle: 'string',
          companyName: 'string',
          applicationId: 'string',
          submittedAt: 'string',
          applicationUrl: 'string'
        },
        createdBy: 'system'
      }
    ]

    for (const template of defaultTemplates) {
      try {
        const existing = await this.getTemplate(template.name)
        if (!existing) {
          await this.createTemplate(template)
          console.log(`Created template: ${template.name}`)
        }
      } catch (error) {
        console.error(`Failed to seed template ${template.name}:`, error)
      }
    }

    console.log('Default email templates seeded successfully')
  }

  /**
   * Get all active templates
   */
  async getAllTemplates(): Promise<NotificationTemplate[]> {
    return await db.notificationTemplate.findMany({
      where: {
        channel: 'email',
        isActive: true
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  /**
   * Get templates by type
   */
  async getTemplatesByType(type: string): Promise<NotificationTemplate[]> {
    return await db.notificationTemplate.findMany({
      where: {
        type,
        channel: 'email',
        isActive: true
      },
      orderBy: { createdAt: 'desc' }
    })
  }
}

// Singleton instance
let templateManagerInstance: TemplateManager | null = null

/**
 * Get template manager instance
 */
export const getTemplateManager = (): TemplateManager => {
  if (!templateManagerInstance) {
    templateManagerInstance = new TemplateManager()
  }
  return templateManagerInstance
}

/**
 * Initialize templates on startup
 */
export const initializeTemplates = async (): Promise<void> => {
  const manager = getTemplateManager()
  await manager.seedDefaultTemplates()
}