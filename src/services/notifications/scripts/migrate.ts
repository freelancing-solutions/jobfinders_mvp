#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

interface Migration {
  version: string
  name: string
  description: string
  up: () => Promise<void>
  down: () => Promise<void>
}

/**
 * Migration system for notification service
 */
class NotificationMigrator {
  private migrations: Migration[] = []

  constructor() {
    this.registerMigrations()
  }

  /**
   * Register all available migrations
   */
  private registerMigrations() {
    // Migration 001: Initial notification tables
    this.migrations.push({
      version: '001',
      name: 'initial_notifications',
      description: 'Create initial notification tables and indexes',
      up: async () => {
        await this.migration001Up()
      },
      down: async () => {
        await this.migration001Down()
      },
    })

    // Migration 002: Add analytics tables
    this.migrations.push({
      version: '002',
      name: 'analytics_tables',
      description: 'Add analytics and metrics tables',
      up: async () => {
        await this.migration002Up()
      },
      down: async () => {
        await this.migration002Down()
      },
    })

    // Migration 003: Add rate limiting
    this.migrations.push({
      version: '003',
      name: 'rate_limiting',
      description: 'Add rate limiting tables and rules',
      up: async () => {
        await this.migration003Up()
      },
      down: async () => {
        await this.migration003Down()
      },
    })

    // Migration 004: Add webhook support
    this.migrations.push({
      version: '004',
      name: 'webhook_support',
      description: 'Add webhook endpoints and event tracking',
      up: async () => {
        await this.migration004Up()
      },
      down: async () => {
        await this.migration004Down()
      },
    })

    // Migration 005: Add template versioning
    this.migrations.push({
      version: '005',
      name: 'template_versioning',
      description: 'Add versioning support for notification templates',
      up: async () => {
        await this.migration005Up()
      },
      down: async () => {
        await this.migration005Down()
      },
    })
  }

  /**
   * Run pending migrations
   */
  async migrate() {
    console.log('🚀 Starting notification service migrations...')

    // Ensure migration table exists
    await this.ensureMigrationTable()

    // Get applied migrations
    const appliedMigrations = await this.getAppliedMigrations()
    const appliedVersions = new Set(appliedMigrations.map(m => m.version))

    // Find pending migrations
    const pendingMigrations = this.migrations.filter(
      migration => !appliedVersions.has(migration.version)
    )

    if (pendingMigrations.length === 0) {
      console.log('✅ No pending migrations')
      return
    }

    console.log(`📋 Found ${pendingMigrations.length} pending migrations`)

    // Run each pending migration
    for (const migration of pendingMigrations) {
      console.log(`⏳ Running migration ${migration.version}: ${migration.name}`)
      
      try {
        await migration.up()
        await this.recordMigration(migration)
        console.log(`✅ Migration ${migration.version} completed`)
      } catch (error) {
        console.error(`❌ Migration ${migration.version} failed:`, error)
        throw error
      }
    }

    console.log('🎉 All migrations completed successfully!')
  }

  /**
   * Rollback last migration
   */
  async rollback() {
    console.log('🔄 Rolling back last migration...')

    const appliedMigrations = await this.getAppliedMigrations()
    
    if (appliedMigrations.length === 0) {
      console.log('ℹ️ No migrations to rollback')
      return
    }

    // Get the last applied migration
    const lastMigration = appliedMigrations[appliedMigrations.length - 1]
    const migration = this.migrations.find(m => m.version === lastMigration.version)

    if (!migration) {
      throw new Error(`Migration ${lastMigration.version} not found`)
    }

    console.log(`⏳ Rolling back migration ${migration.version}: ${migration.name}`)

    try {
      await migration.down()
      await this.removeMigrationRecord(migration.version)
      console.log(`✅ Migration ${migration.version} rolled back`)
    } catch (error) {
      console.error(`❌ Rollback failed:`, error)
      throw error
    }
  }

  /**
   * Show migration status
   */
  async status() {
    console.log('📊 Migration Status:')
    console.log('==================')

    await this.ensureMigrationTable()
    const appliedMigrations = await this.getAppliedMigrations()
    const appliedVersions = new Set(appliedMigrations.map(m => m.version))

    for (const migration of this.migrations) {
      const status = appliedVersions.has(migration.version) ? '✅ Applied' : '⏳ Pending'
      const appliedAt = appliedMigrations.find(m => m.version === migration.version)?.appliedAt
      
      console.log(`${migration.version}: ${migration.name} - ${status}`)
      console.log(`    ${migration.description}`)
      if (appliedAt) {
        console.log(`    Applied: ${appliedAt.toISOString()}`)
      }
      console.log('')
    }
  }

  /**
   * Ensure migration tracking table exists
   */
  private async ensureMigrationTable() {
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS notification_migrations (
        version VARCHAR(10) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
  }

  /**
   * Get applied migrations
   */
  private async getAppliedMigrations() {
    const result = await prisma.$queryRaw<Array<{
      version: string
      name: string
      description: string
      appliedAt: Date
    }>>`
      SELECT version, name, description, applied_at as "appliedAt"
      FROM notification_migrations
      ORDER BY version ASC
    `
    
    return result
  }

  /**
   * Record successful migration
   */
  private async recordMigration(migration: Migration) {
    await prisma.$executeRaw`
      INSERT INTO notification_migrations (version, name, description)
      VALUES (${migration.version}, ${migration.name}, ${migration.description})
    `
  }

  /**
   * Remove migration record
   */
  private async removeMigrationRecord(version: string) {
    await prisma.$executeRaw`
      DELETE FROM notification_migrations WHERE version = ${version}
    `
  }

  // Migration implementations
  private async migration001Up() {
    // Create notification templates table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS notification_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) UNIQUE NOT NULL,
        channel VARCHAR(20) NOT NULL,
        subject VARCHAR(255),
        content TEXT NOT NULL,
        variables TEXT[],
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create notifications table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        channel VARCHAR(20) NOT NULL,
        type VARCHAR(50) NOT NULL,
        priority VARCHAR(10) DEFAULT 'medium',
        status VARCHAR(20) DEFAULT 'pending',
        subject VARCHAR(255),
        content TEXT NOT NULL,
        metadata JSONB DEFAULT '{}',
        scheduled_for TIMESTAMP,
        sent_at TIMESTAMP,
        delivered_at TIMESTAMP,
        read_at TIMESTAMP,
        clicked_at TIMESTAMP,
        failed_at TIMESTAMP,
        error_message TEXT,
        retry_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create indexes
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)
    `
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status)
    `
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_notifications_channel ON notifications(channel)
    `
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at)
    `
  }

  private async migration001Down() {
    await prisma.$executeRaw`DROP TABLE IF EXISTS notifications`
    await prisma.$executeRaw`DROP TABLE IF EXISTS notification_templates`
  }

  private async migration002Up() {
    // Create notification events table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS notification_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        notification_id UUID NOT NULL,
        event_type VARCHAR(50) NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB DEFAULT '{}',
        FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE
      )
    `

    // Create daily analytics table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS daily_analytics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        date DATE NOT NULL,
        channel VARCHAR(20) NOT NULL,
        sent INTEGER DEFAULT 0,
        delivered INTEGER DEFAULT 0,
        failed INTEGER DEFAULT 0,
        opened INTEGER DEFAULT 0,
        clicked INTEGER DEFAULT 0,
        bounced INTEGER DEFAULT 0,
        unsubscribed INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(date, channel)
      )
    `

    // Create indexes
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_notification_events_type ON notification_events(event_type)
    `
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_notification_events_timestamp ON notification_events(timestamp)
    `
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_daily_analytics_date ON daily_analytics(date)
    `
  }

  private async migration002Down() {
    await prisma.$executeRaw`DROP TABLE IF EXISTS daily_analytics`
    await prisma.$executeRaw`DROP TABLE IF EXISTS notification_events`
  }

  private async migration003Up() {
    // Create rate limit rules table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS rate_limit_rules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) UNIQUE NOT NULL,
        type VARCHAR(20) NOT NULL, -- 'user', 'global', 'ip'
        channel VARCHAR(20),
        limit_count INTEGER NOT NULL,
        window_seconds INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create rate limit tracking table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS rate_limit_tracking (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        rule_id UUID NOT NULL,
        identifier VARCHAR(255) NOT NULL, -- user_id, ip, etc.
        count INTEGER DEFAULT 1,
        window_start TIMESTAMP NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (rule_id) REFERENCES rate_limit_rules(id) ON DELETE CASCADE,
        UNIQUE(rule_id, identifier, window_start)
      )
    `

    // Create indexes
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_rate_limit_tracking_expires ON rate_limit_tracking(expires_at)
    `
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_rate_limit_tracking_identifier ON rate_limit_tracking(identifier)
    `
  }

  private async migration003Down() {
    await prisma.$executeRaw`DROP TABLE IF EXISTS rate_limit_tracking`
    await prisma.$executeRaw`DROP TABLE IF EXISTS rate_limit_rules`
  }

  private async migration004Up() {
    // Create webhook endpoints table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS webhook_endpoints (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) UNIQUE NOT NULL,
        url VARCHAR(500) NOT NULL,
        events TEXT[] NOT NULL,
        secret VARCHAR(100) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        last_success_at TIMESTAMP,
        last_failure_at TIMESTAMP,
        failure_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create webhook deliveries table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS webhook_deliveries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        webhook_id UUID NOT NULL,
        event_type VARCHAR(50) NOT NULL,
        payload JSONB NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        response_status INTEGER,
        response_body TEXT,
        attempts INTEGER DEFAULT 0,
        next_retry_at TIMESTAMP,
        delivered_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (webhook_id) REFERENCES webhook_endpoints(id) ON DELETE CASCADE
      )
    `

    // Create indexes
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status)
    `
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_next_retry ON webhook_deliveries(next_retry_at)
    `
  }

  private async migration004Down() {
    await prisma.$executeRaw`DROP TABLE IF EXISTS webhook_deliveries`
    await prisma.$executeRaw`DROP TABLE IF EXISTS webhook_endpoints`
  }

  private async migration005Up() {
    // Add version column to templates
    await prisma.$executeRaw`
      ALTER TABLE notification_templates 
      ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1
    `

    // Create template versions table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS notification_template_versions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        template_id UUID NOT NULL,
        version INTEGER NOT NULL,
        subject VARCHAR(255),
        content TEXT NOT NULL,
        variables TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by UUID,
        FOREIGN KEY (template_id) REFERENCES notification_templates(id) ON DELETE CASCADE,
        UNIQUE(template_id, version)
      )
    `

    // Create index
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_template_versions_template_id ON notification_template_versions(template_id)
    `
  }

  private async migration005Down() {
    await prisma.$executeRaw`DROP TABLE IF EXISTS notification_template_versions`
    await prisma.$executeRaw`
      ALTER TABLE notification_templates DROP COLUMN IF EXISTS version
    `
  }
}

// CLI handling
async function main() {
  const migrator = new NotificationMigrator()
  const command = process.argv[2]

  try {
    switch (command) {
      case 'migrate':
        await migrator.migrate()
        break
      case 'rollback':
        await migrator.rollback()
        break
      case 'status':
        await migrator.status()
        break
      default:
        console.log('Usage: ts-node migrate.ts [migrate|rollback|status]')
        console.log('  migrate  - Run pending migrations')
        console.log('  rollback - Rollback last migration')
        console.log('  status   - Show migration status')
        process.exit(1)
    }
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  main()
}