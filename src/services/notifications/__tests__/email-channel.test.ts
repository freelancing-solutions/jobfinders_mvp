import { EmailChannelService } from '../channels/email-channel'
import { PrismaClient } from '@prisma/client'
import { Resend } from 'resend'
import { NotificationAnalyticsEngine } from '../analytics-engine'

// Mock dependencies
jest.mock('resend')
jest.mock('@prisma/client')
jest.mock('../analytics-engine')

describe('EmailChannelService', () => {
  let emailService: EmailChannelService
  let mockPrisma: jest.Mocked<PrismaClient>
  let mockResend: jest.Mocked<Resend>
  let mockAnalytics: jest.Mocked<NotificationAnalyticsEngine>

  beforeEach(() => {
    mockPrisma = {
      notificationTemplate: {
        findFirst: jest.fn(),
      },
      notificationDeliveryLog: {
        create: jest.fn(),
        update: jest.fn(),
      },
      emailSuppressionList: {
        findFirst: jest.fn(),
      },
    } as any

    mockResend = {
      emails: {
        send: jest.fn(),
      },
    } as any

    mockAnalytics = {
      trackEvent: jest.fn(),
      incrementMetric: jest.fn(),
    } as any

    emailService = new EmailChannelService(mockPrisma, mockResend, mockAnalytics)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Single Email Sending', () => {
    it('should send email successfully', async () => {
      const payload = {
        notificationId: 'notif-123',
        userId: 'user-123',
        recipient: 'test@example.com',
        content: {
          title: 'Welcome!',
          body: 'Welcome to our platform',
        },
        templateId: 'welcome-template',
        metadata: {
          firstName: 'John',
        },
      }

      mockPrisma.notificationTemplate.findFirst.mockResolvedValue({
        id: 'welcome-template',
        subject: 'Welcome {{firstName}}!',
        htmlContent: '<h1>Welcome {{firstName}}!</h1><p>{{body}}</p>',
        textContent: 'Welcome {{firstName}}! {{body}}',
      } as any)

      mockPrisma.emailSuppressionList.findFirst.mockResolvedValue(null)

      mockResend.emails.send.mockResolvedValue({
        data: { id: 'email-123' },
        error: null,
      } as any)

      mockPrisma.notificationDeliveryLog.create.mockResolvedValue({
        id: 'log-123',
      } as any)

      const result = await emailService.send(payload)

      expect(result.success).toBe(true)
      expect(result.messageId).toBe('email-123')
      expect(mockResend.emails.send).toHaveBeenCalledWith({
        from: 'noreply@jobfinders.com',
        to: 'test@example.com',
        subject: 'Welcome John!',
        html: '<h1>Welcome John!</h1><p>Welcome to our platform</p>',
        text: 'Welcome John! Welcome to our platform',
      })
    })

    it('should handle suppressed recipients', async () => {
      const payload = {
        notificationId: 'notif-123',
        userId: 'user-123',
        recipient: 'suppressed@example.com',
        content: {
          title: 'Test',
          body: 'Test message',
        },
        templateId: 'test-template',
        metadata: {},
      }

      mockPrisma.emailSuppressionList.findFirst.mockResolvedValue({
        email: 'suppressed@example.com',
        reason: 'BOUNCED',
      } as any)

      const result = await emailService.send(payload)

      expect(result.success).toBe(false)
      expect(result.error).toContain('suppressed')
      expect(mockResend.emails.send).not.toHaveBeenCalled()
    })

    it('should handle template not found', async () => {
      const payload = {
        notificationId: 'notif-123',
        userId: 'user-123',
        recipient: 'test@example.com',
        content: {
          title: 'Test',
          body: 'Test message',
        },
        templateId: 'nonexistent-template',
        metadata: {},
      }

      mockPrisma.notificationTemplate.findFirst.mockResolvedValue(null)

      const result = await emailService.send(payload)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Template not found')
    })

    it('should handle Resend API errors', async () => {
      const payload = {
        notificationId: 'notif-123',
        userId: 'user-123',
        recipient: 'test@example.com',
        content: {
          title: 'Test',
          body: 'Test message',
        },
        templateId: 'test-template',
        metadata: {},
      }

      mockPrisma.notificationTemplate.findFirst.mockResolvedValue({
        id: 'test-template',
        subject: 'Test',
        htmlContent: '<p>{{body}}</p>',
        textContent: '{{body}}',
      } as any)

      mockPrisma.emailSuppressionList.findFirst.mockResolvedValue(null)

      mockResend.emails.send.mockResolvedValue({
        data: null,
        error: { message: 'Invalid email address' },
      } as any)

      const result = await emailService.send(payload)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid email address')
    })
  })

  describe('Bulk Email Sending', () => {
    it('should send bulk emails successfully', async () => {
      const payloads = [
        {
          notificationId: 'notif-1',
          userId: 'user-1',
          recipient: 'user1@example.com',
          content: { title: 'Test 1', body: 'Message 1' },
          templateId: 'test-template',
          metadata: { firstName: 'John' },
        },
        {
          notificationId: 'notif-2',
          userId: 'user-2',
          recipient: 'user2@example.com',
          content: { title: 'Test 2', body: 'Message 2' },
          templateId: 'test-template',
          metadata: { firstName: 'Jane' },
        },
      ]

      mockPrisma.notificationTemplate.findFirst.mockResolvedValue({
        id: 'test-template',
        subject: 'Hello {{firstName}}',
        htmlContent: '<h1>{{title}}</h1><p>{{body}}</p>',
        textContent: '{{title}} - {{body}}',
      } as any)

      mockPrisma.emailSuppressionList.findFirst.mockResolvedValue(null)

      mockResend.emails.send
        .mockResolvedValueOnce({ data: { id: 'email-1' }, error: null } as any)
        .mockResolvedValueOnce({ data: { id: 'email-2' }, error: null } as any)

      const results = await emailService.sendBulk(payloads)

      expect(results).toHaveLength(2)
      expect(results.every(r => r.success)).toBe(true)
      expect(mockResend.emails.send).toHaveBeenCalledTimes(2)
    })

    it('should handle partial failures in bulk sending', async () => {
      const payloads = [
        {
          notificationId: 'notif-1',
          userId: 'user-1',
          recipient: 'valid@example.com',
          content: { title: 'Test 1', body: 'Message 1' },
          templateId: 'test-template',
          metadata: {},
        },
        {
          notificationId: 'notif-2',
          userId: 'user-2',
          recipient: 'invalid@example.com',
          content: { title: 'Test 2', body: 'Message 2' },
          templateId: 'test-template',
          metadata: {},
        },
      ]

      mockPrisma.notificationTemplate.findFirst.mockResolvedValue({
        id: 'test-template',
        subject: 'Test',
        htmlContent: '<p>{{body}}</p>',
        textContent: '{{body}}',
      } as any)

      mockPrisma.emailSuppressionList.findFirst.mockResolvedValue(null)

      mockResend.emails.send
        .mockResolvedValueOnce({ data: { id: 'email-1' }, error: null } as any)
        .mockResolvedValueOnce({ data: null, error: { message: 'Invalid email' } } as any)

      const results = await emailService.sendBulk(payloads)

      expect(results).toHaveLength(2)
      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(false)
    })
  })

  describe('Template Processing', () => {
    it('should process template variables correctly', async () => {
      const template = {
        subject: 'Welcome {{firstName}} to {{companyName}}!',
        htmlContent: '<h1>Hello {{firstName}}</h1><p>{{body}}</p><p>Best regards, {{companyName}}</p>',
        textContent: 'Hello {{firstName}}! {{body}} Best regards, {{companyName}}',
      }

      const variables = {
        firstName: 'John',
        companyName: 'JobFinders',
        body: 'Welcome to our platform',
      }

      const processed = emailService['processTemplate'](template, variables)

      expect(processed.subject).toBe('Welcome John to JobFinders!')
      expect(processed.htmlContent).toBe('<h1>Hello John</h1><p>Welcome to our platform</p><p>Best regards, JobFinders</p>')
      expect(processed.textContent).toBe('Hello John! Welcome to our platform Best regards, JobFinders')
    })

    it('should handle missing template variables', async () => {
      const template = {
        subject: 'Hello {{firstName}}!',
        htmlContent: '<p>{{body}}</p>',
        textContent: '{{body}}',
      }

      const variables = {
        firstName: 'John',
        // body is missing
      }

      const processed = emailService['processTemplate'](template, variables)

      expect(processed.subject).toBe('Hello John!')
      expect(processed.htmlContent).toBe('<p></p>')
      expect(processed.textContent).toBe('')
    })
  })

  describe('Rate Limiting', () => {
    it('should respect rate limits', async () => {
      const payload = {
        notificationId: 'notif-123',
        userId: 'user-123',
        recipient: 'test@example.com',
        content: { title: 'Test', body: 'Test message' },
        templateId: 'test-template',
        metadata: {},
      }

      // Mock rate limit exceeded
      emailService['rateLimiter'] = {
        checkLimit: jest.fn().mockResolvedValue({ allowed: false, resetTime: Date.now() + 60000 }),
      } as any

      const result = await emailService.send(payload)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Rate limit exceeded')
    })
  })

  describe('Webhook Handling', () => {
    it('should handle delivery webhook', async () => {
      const webhookData = {
        type: 'email.delivered',
        data: {
          email_id: 'email-123',
          to: 'test@example.com',
          delivered_at: '2024-01-01T12:00:00Z',
        },
      }

      mockPrisma.notificationDeliveryLog.update.mockResolvedValue({} as any)

      await emailService.handleWebhook(webhookData)

      expect(mockPrisma.notificationDeliveryLog.update).toHaveBeenCalledWith({
        where: { externalMessageId: 'email-123' },
        data: {
          status: 'DELIVERED',
          deliveredAt: new Date('2024-01-01T12:00:00Z'),
        },
      })

      expect(mockAnalytics.trackEvent).toHaveBeenCalledWith('email_delivered', {
        messageId: 'email-123',
        recipient: 'test@example.com',
      })
    })

    it('should handle bounce webhook', async () => {
      const webhookData = {
        type: 'email.bounced',
        data: {
          email_id: 'email-123',
          to: 'bounced@example.com',
          bounce_type: 'hard',
          reason: 'Invalid email address',
        },
      }

      mockPrisma.notificationDeliveryLog.update.mockResolvedValue({} as any)

      await emailService.handleWebhook(webhookData)

      expect(mockPrisma.notificationDeliveryLog.update).toHaveBeenCalledWith({
        where: { externalMessageId: 'email-123' },
        data: {
          status: 'BOUNCED',
          errorMessage: 'Invalid email address',
        },
      })

      expect(mockAnalytics.trackEvent).toHaveBeenCalledWith('email_bounced', {
        messageId: 'email-123',
        recipient: 'bounced@example.com',
        bounceType: 'hard',
      })
    })

    it('should handle open webhook', async () => {
      const webhookData = {
        type: 'email.opened',
        data: {
          email_id: 'email-123',
          to: 'test@example.com',
          opened_at: '2024-01-01T12:05:00Z',
        },
      }

      await emailService.handleWebhook(webhookData)

      expect(mockAnalytics.trackEvent).toHaveBeenCalledWith('email_opened', {
        messageId: 'email-123',
        recipient: 'test@example.com',
        openedAt: '2024-01-01T12:05:00Z',
      })
    })

    it('should handle click webhook', async () => {
      const webhookData = {
        type: 'email.clicked',
        data: {
          email_id: 'email-123',
          to: 'test@example.com',
          clicked_at: '2024-01-01T12:10:00Z',
          link: 'https://example.com/action',
        },
      }

      await emailService.handleWebhook(webhookData)

      expect(mockAnalytics.trackEvent).toHaveBeenCalledWith('email_clicked', {
        messageId: 'email-123',
        recipient: 'test@example.com',
        clickedAt: '2024-01-01T12:10:00Z',
        link: 'https://example.com/action',
      })
    })
  })
})