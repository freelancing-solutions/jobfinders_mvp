#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client'
import { createHash } from 'crypto'
import { NotificationChannel, NotificationPriority } from '../types'

const prisma = new PrismaClient()

/**
 * Setup script for notification service
 * Initializes database schema, default templates, and configurations
 */
async function setupNotificationService() {
  console.log('🚀 Setting up Notification Service...')

  try {
    // 1. Create default notification templates
    await createDefaultTemplates()
    
    // 2. Create default notification preferences
    await createDefaultPreferences()
    
    // 3. Create system notification channels
    await createSystemChannels()
    
    // 4. Initialize analytics tables
    await initializeAnalytics()
    
    // 5. Create default rate limit rules
    await createRateLimitRules()
    
    // 6. Setup webhook endpoints
    await setupWebhookEndpoints()

    console.log('✅ Notification Service setup completed successfully!')
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * Create default notification templates
 */
async function createDefaultTemplates() {
  console.log('📝 Creating default templates...')

  const templates = [
    // Email Templates
    {
      name: 'welcome_email',
      channel: NotificationChannel.EMAIL,
      subject: 'Welcome to {{app_name}}!',
      content: `
        <h1>Welcome {{user_name}}!</h1>
        <p>Thank you for joining {{app_name}}. We're excited to have you on board!</p>
        <p>Here are some things you can do to get started:</p>
        <ul>
          <li>Complete your profile</li>
          <li>Explore job opportunities</li>
          <li>Set up job alerts</li>
        </ul>
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <p>Best regards,<br>The {{app_name}} Team</p>
      `,
      variables: ['user_name', 'app_name'],
      isActive: true,
    },
    {
      name: 'password_reset',
      channel: NotificationChannel.EMAIL,
      subject: 'Reset Your Password',
      content: `
        <h1>Password Reset Request</h1>
        <p>Hi {{user_name}},</p>
        <p>You requested to reset your password. Click the button below to create a new password:</p>
        <a href="{{reset_url}}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>This link will expire in {{expiry_hours}} hours.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
      variables: ['user_name', 'reset_url', 'expiry_hours'],
      isActive: true,
    },
    {
      name: 'job_alert',
      channel: NotificationChannel.EMAIL,
      subject: 'New Job Matches Found!',
      content: `
        <h1>New Job Opportunities</h1>
        <p>Hi {{user_name}},</p>
        <p>We found {{job_count}} new job(s) that match your criteria:</p>
        {{#jobs}}
        <div style="border: 1px solid #ddd; padding: 15px; margin: 10px 0;">
          <h3>{{title}}</h3>
          <p><strong>Company:</strong> {{company}}</p>
          <p><strong>Location:</strong> {{location}}</p>
          <p><strong>Salary:</strong> {{salary}}</p>
          <a href="{{job_url}}">View Job</a>
        </div>
        {{/jobs}}
        <p><a href="{{unsubscribe_url}}">Unsubscribe from job alerts</a></p>
      `,
      variables: ['user_name', 'job_count', 'jobs', 'unsubscribe_url'],
      isActive: true,
    },

    // SMS Templates
    {
      name: 'verification_sms',
      channel: NotificationChannel.SMS,
      subject: null,
      content: 'Your {{app_name}} verification code is: {{code}}. Valid for {{expiry_minutes}} minutes.',
      variables: ['app_name', 'code', 'expiry_minutes'],
      isActive: true,
    },
    {
      name: 'job_application_sms',
      channel: NotificationChannel.SMS,
      subject: null,
      content: 'Your application for {{job_title}} at {{company}} has been {{status}}. Check your email for details.',
      variables: ['job_title', 'company', 'status'],
      isActive: true,
    },

    // Push Notification Templates
    {
      name: 'new_message_push',
      channel: NotificationChannel.PUSH,
      subject: 'New Message',
      content: '{{sender_name}}: {{message_preview}}',
      variables: ['sender_name', 'message_preview'],
      isActive: true,
    },
    {
      name: 'job_match_push',
      channel: NotificationChannel.PUSH,
      subject: 'New Job Match!',
      content: 'Found a {{job_title}} position at {{company}} that matches your profile.',
      variables: ['job_title', 'company'],
      isActive: true,
    },

    // In-App Templates
    {
      name: 'profile_completion',
      channel: NotificationChannel.IN_APP,
      subject: 'Complete Your Profile',
      content: 'Your profile is {{completion_percentage}}% complete. Add more details to attract employers!',
      variables: ['completion_percentage'],
      isActive: true,
    },
    {
      name: 'interview_reminder',
      channel: NotificationChannel.IN_APP,
      subject: 'Interview Reminder',
      content: 'You have an interview with {{company}} scheduled for {{interview_date}} at {{interview_time}}.',
      variables: ['company', 'interview_date', 'interview_time'],
      isActive: true,
    },
  ]

  for (const template of templates) {
    await prisma.notificationTemplate.upsert({
      where: { name: template.name },
      update: template,
      create: template,
    })
  }

  console.log(`✅ Created ${templates.length} default templates`)
}

/**
 * Create default notification preferences
 */
async function createDefaultPreferences() {
  console.log('⚙️ Creating default notification preferences...')

  const defaultPreferences = [
    {
      type: 'job_alerts',
      channels: [NotificationChannel.EMAIL, NotificationChannel.PUSH],
      enabled: true,
      frequency: 'daily',
    },
    {
      type: 'application_updates',
      channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP, NotificationChannel.SMS],
      enabled: true,
      frequency: 'immediate',
    },
    {
      type: 'messages',
      channels: [NotificationChannel.EMAIL, NotificationChannel.PUSH, NotificationChannel.IN_APP],
      enabled: true,
      frequency: 'immediate',
    },
    {
      type: 'profile_reminders',
      channels: [NotificationChannel.IN_APP],
      enabled: true,
      frequency: 'weekly',
    },
    {
      type: 'marketing',
      channels: [NotificationChannel.EMAIL],
      enabled: false,
      frequency: 'weekly',
    },
  ]

  // These will be used as defaults when creating user preferences
  await prisma.notificationPreferenceTemplate.deleteMany()
  
  for (const pref of defaultPreferences) {
    await prisma.notificationPreferenceTemplate.create({
      data: {
        type: pref.type,
        channels: pref.channels,
        enabled: pref.enabled,
        frequency: pref.frequency,
      },
    })
  }

  console.log(`✅ Created ${defaultPreferences.length} default preference templates`)
}

/**
 * Create system notification channels
 */
async function createSystemChannels() {
  console.log('📡 Setting up system channels...')

  const channels = [
    {
      name: 'system_alerts',
      type: 'system',
      config: {
        priority: NotificationPriority.HIGH,
        channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        recipients: ['admin@jobfinders.com'],
      },
    },
    {
      name: 'user_onboarding',
      type: 'automated',
      config: {
        priority: NotificationPriority.MEDIUM,
        channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        delay: 0,
      },
    },
    {
      name: 'job_recommendations',
      type: 'scheduled',
      config: {
        priority: NotificationPriority.LOW,
        channels: [NotificationChannel.EMAIL, NotificationChannel.PUSH],
        schedule: '0 9 * * *', // Daily at 9 AM
      },
    },
  ]

  for (const channel of channels) {
    await prisma.systemChannel.upsert({
      where: { name: channel.name },
      update: channel,
      create: channel,
    })
  }

  console.log(`✅ Created ${channels.length} system channels`)
}

/**
 * Initialize analytics tables and indexes
 */
async function initializeAnalytics() {
  console.log('📊 Initializing analytics...')

  // Create indexes for better query performance
  try {
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
    `
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
    `
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_notifications_channel ON notifications(channel);
    `
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
    `
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_notification_events_type ON notification_events(event_type);
    `
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_notification_events_timestamp ON notification_events(timestamp);
    `

    console.log('✅ Analytics indexes created')
  } catch (error) {
    console.log('ℹ️ Analytics indexes may already exist')
  }

  // Initialize daily analytics aggregation
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  await prisma.dailyAnalytics.upsert({
    where: {
      date_channel: {
        date: today,
        channel: NotificationChannel.EMAIL,
      },
    },
    update: {},
    create: {
      date: today,
      channel: NotificationChannel.EMAIL,
      sent: 0,
      delivered: 0,
      failed: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      unsubscribed: 0,
    },
  })

  console.log('✅ Analytics initialization completed')
}

/**
 * Create default rate limit rules
 */
async function createRateLimitRules() {
  console.log('🚦 Creating rate limit rules...')

  const rules = [
    {
      name: 'email_per_user_hourly',
      type: 'user',
      channel: NotificationChannel.EMAIL,
      limit: 10,
      window: 3600, // 1 hour
      isActive: true,
    },
    {
      name: 'sms_per_user_daily',
      type: 'user',
      channel: NotificationChannel.SMS,
      limit: 5,
      window: 86400, // 24 hours
      isActive: true,
    },
    {
      name: 'push_per_user_hourly',
      type: 'user',
      channel: NotificationChannel.PUSH,
      limit: 20,
      window: 3600, // 1 hour
      isActive: true,
    },
    {
      name: 'global_email_per_minute',
      type: 'global',
      channel: NotificationChannel.EMAIL,
      limit: 100,
      window: 60, // 1 minute
      isActive: true,
    },
    {
      name: 'bulk_operations_per_hour',
      type: 'global',
      channel: null,
      limit: 10,
      window: 3600, // 1 hour
      isActive: true,
    },
  ]

  for (const rule of rules) {
    await prisma.rateLimitRule.upsert({
      where: { name: rule.name },
      update: rule,
      create: rule,
    })
  }

  console.log(`✅ Created ${rules.length} rate limit rules`)
}

/**
 * Setup webhook endpoints
 */
async function setupWebhookEndpoints() {
  console.log('🔗 Setting up webhook endpoints...')

  const webhooks = [
    {
      name: 'resend_delivery',
      url: `${process.env.API_BASE_URL}/webhooks/resend`,
      events: ['email.delivered', 'email.bounced', 'email.opened', 'email.clicked'],
      secret: generateWebhookSecret(),
      isActive: true,
    },
    {
      name: 'twilio_delivery',
      url: `${process.env.API_BASE_URL}/webhooks/twilio`,
      events: ['sms.delivered', 'sms.failed', 'sms.undelivered'],
      secret: generateWebhookSecret(),
      isActive: true,
    },
    {
      name: 'fcm_delivery',
      url: `${process.env.API_BASE_URL}/webhooks/fcm`,
      events: ['push.delivered', 'push.opened', 'push.dismissed'],
      secret: generateWebhookSecret(),
      isActive: true,
    },
  ]

  for (const webhook of webhooks) {
    await prisma.webhookEndpoint.upsert({
      where: { name: webhook.name },
      update: webhook,
      create: webhook,
    })
  }

  console.log(`✅ Created ${webhooks.length} webhook endpoints`)
  console.log('🔐 Webhook secrets generated - store them securely!')
}

/**
 * Generate secure webhook secret
 */
function generateWebhookSecret(): string {
  return createHash('sha256')
    .update(Math.random().toString() + Date.now().toString())
    .digest('hex')
    .substring(0, 32)
}

/**
 * Cleanup function for development/testing
 */
async function cleanup() {
  console.log('🧹 Cleaning up notification service data...')

  await prisma.notificationEvent.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.notificationTemplate.deleteMany()
  await prisma.notificationPreferenceTemplate.deleteMany()
  await prisma.systemChannel.deleteMany()
  await prisma.rateLimitRule.deleteMany()
  await prisma.webhookEndpoint.deleteMany()
  await prisma.dailyAnalytics.deleteMany()

  console.log('✅ Cleanup completed')
}

/**
 * Verify setup
 */
async function verifySetup() {
  console.log('🔍 Verifying setup...')

  const counts = {
    templates: await prisma.notificationTemplate.count(),
    preferences: await prisma.notificationPreferenceTemplate.count(),
    channels: await prisma.systemChannel.count(),
    rateLimits: await prisma.rateLimitRule.count(),
    webhooks: await prisma.webhookEndpoint.count(),
  }

  console.log('📊 Setup verification:')
  console.log(`  - Templates: ${counts.templates}`)
  console.log(`  - Preference templates: ${counts.preferences}`)
  console.log(`  - System channels: ${counts.channels}`)
  console.log(`  - Rate limit rules: ${counts.rateLimits}`)
  console.log(`  - Webhook endpoints: ${counts.webhooks}`)

  if (Object.values(counts).every(count => count > 0)) {
    console.log('✅ Setup verification passed')
  } else {
    console.log('❌ Setup verification failed - some components missing')
    process.exit(1)
  }
}

// CLI handling
const command = process.argv[2]

switch (command) {
  case 'setup':
    setupNotificationService()
    break
  case 'cleanup':
    cleanup()
    break
  case 'verify':
    verifySetup()
    break
  default:
    console.log('Usage: ts-node setup.ts [setup|cleanup|verify]')
    console.log('  setup   - Initialize notification service')
    console.log('  cleanup - Remove all notification data (dev only)')
    console.log('  verify  - Verify setup completion')
    process.exit(1)
}