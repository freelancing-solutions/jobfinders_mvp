// Event Persistence Implementation
// Database persistence for events with querying capabilities

import { PrismaClient } from '@prisma/client';
import { BaseEvent, EventType, EventFilter, EventPriority } from './event-types';

const prisma = new PrismaClient();

export interface EventPersistenceConfig {
  retentionDays: number;
  batchSize: number;
  enableCompression: boolean;
  archiveOldEvents: boolean;
  compressionThreshold: number; // bytes
}

export class EventPersistence {
  private config: EventPersistenceConfig;
  private batchBuffer: BaseEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor(config?: Partial<EventPersistenceConfig>) {
    this.config = {
      retentionDays: 90,
      batchSize: 100,
      enableCompression: true,
      archiveOldEvents: true,
      compressionThreshold: 1024, // 1KB
      ...config
    };

    this.startBatchFlush();
  }

  async saveEvent(event: BaseEvent): Promise<void> {
    try {
      // Add to batch buffer for efficient bulk insertion
      this.batchBuffer.push(event);

      if (this.batchBuffer.length >= this.config.batchSize) {
        await this.flushBatch();
      }
    } catch (error) {
      console.error('Failed to save event:', error);
      throw error;
    }
  }

  async saveBatch(events: BaseEvent[]): Promise<void> {
    try {
      const eventData = events.map(event => this.prepareEventData(event));

      await prisma.$transaction(async (tx) => {
        // Batch insert events
        await tx.$executeRaw`
          INSERT INTO "event_logs" (
            "id", "type", "timestamp", "user_id", "session_id",
            "priority", "metadata", "correlation_id", "source", "payload",
            "created_at"
          ) VALUES
          ${eventData.map(data =>
            `('${data.id}', '${data.type}', '${data.timestamp}', ${data.userId}, ${data.sessionId},
              '${data.priority}', ${data.metadata}, ${data.correlationId}, '${data.source}', ${data.payload},
              NOW())`
          ).join(', ')}
          ON CONFLICT ("id") DO NOTHING
        `;
      });

      console.log(`Saved ${events.length} events to database`);
    } catch (error) {
      console.error('Failed to save event batch:', error);
      throw error;
    }
  }

  async getEvents(filter?: EventFilter, limit = 100, offset = 0): Promise<BaseEvent[]> {
    try {
      let query = `
        SELECT * FROM "event_logs"
        WHERE 1=1
      `;

      const params: any[] = [];
      let paramIndex = 1;

      if (filter) {
        if (filter.eventTypes && filter.eventTypes.length > 0) {
          query += ` AND type = ANY($${paramIndex})`;
          params.push(filter.eventTypes);
          paramIndex++;
        }

        if (filter.userId) {
          query += ` AND user_id = $${paramIndex}`;
          params.push(filter.userId);
          paramIndex++;
        }

        if (filter.dateRange) {
          query += ` AND timestamp BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
          params.push(filter.dateRange.start, filter.dateRange.end);
          paramIndex += 2;
        }

        if (filter.priority && filter.priority.length > 0) {
          query += ` AND priority = ANY($${paramIndex})`;
          params.push(filter.priority);
          paramIndex++;
        }

        if (filter.source) {
          query += ` AND source = $${paramIndex}`;
          params.push(filter.source);
          paramIndex++;
        }
      }

      query += ` ORDER BY timestamp DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const results = await prisma.$queryRawUnsafe(query, ...params);

      return results.map((row: any) => this.parseEventData(row));
    } catch (error) {
      console.error('Failed to get events:', error);
      throw error;
    }
  }

  async getEventById(eventId: string): Promise<BaseEvent | null> {
    try {
      const result = await prisma.$queryRaw`
        SELECT * FROM "event_logs"
        WHERE id = ${eventId}
        LIMIT 1
      `;

      const events = result as any[];
      return events.length > 0 ? this.parseEventData(events[0]) : null;
    } catch (error) {
      console.error('Failed to get event by ID:', error);
      throw error;
    }
  }

  async getEventsByUser(userId: string, limit = 50): Promise<BaseEvent[]> {
    try {
      const results = await prisma.$queryRaw`
        SELECT * FROM "event_logs"
        WHERE user_id = ${userId}
        ORDER BY timestamp DESC
        LIMIT ${limit}
      `;

      return (results as any[]).map(row => this.parseEventData(row));
    } catch (error) {
      console.error('Failed to get events by user:', error);
      throw error;
    }
  }

  async getEventsByType(eventType: EventType, limit = 100): Promise<BaseEvent[]> {
    try {
      const results = await prisma.$queryRaw`
        SELECT * FROM "event_logs"
        WHERE type = ${eventType}
        ORDER BY timestamp DESC
        LIMIT ${limit}
      `;

      return (results as any[]).map(row => this.parseEventData(row));
    } catch (error) {
      console.error('Failed to get events by type:', error);
      throw error;
    }
  }

  async getEventMetrics(eventType?: EventType, startDate?: Date, endDate?: Date): Promise<any> {
    try {
      let query = `
        SELECT
          type,
          COUNT(*) as count,
          AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_processing_time,
          COUNT(*) FILTER (WHERE priority = 'urgent') as urgent_count,
          COUNT(*) FILTER (WHERE priority = 'high') as high_count,
          COUNT(*) FILTER (WHERE priority = 'normal') as normal_count,
          COUNT(*) FILTER (WHERE priority = 'low') as low_count
        FROM "event_logs"
        WHERE 1=1
      `;

      const params: any[] = [];
      let paramIndex = 1;

      if (eventType) {
        query += ` AND type = $${paramIndex}`;
        params.push(eventType);
        paramIndex++;
      }

      if (startDate) {
        query += ` AND timestamp >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        query += ` AND timestamp <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
      }

      query += ` GROUP BY type ORDER BY count DESC`;

      const results = await prisma.$queryRawUnsafe(query, ...params);
      return results;
    } catch (error) {
      console.error('Failed to get event metrics:', error);
      throw error;
    }
  }

  async deleteEvent(eventId: string): Promise<boolean> {
    try {
      const result = await prisma.$executeRaw`
        DELETE FROM "event_logs"
        WHERE id = ${eventId}
      `;

      return result > 0;
    } catch (error) {
      console.error('Failed to delete event:', error);
      throw error;
    }
  }

  async deleteEvents(filter: EventFilter): Promise<number> {
    try {
      let query = `DELETE FROM "event_logs" WHERE 1=1`;
      const params: any[] = [];
      let paramIndex = 1;

      if (filter.eventTypes && filter.eventTypes.length > 0) {
        query += ` AND type = ANY($${paramIndex})`;
        params.push(filter.eventTypes);
        paramIndex++;
      }

      if (filter.userId) {
        query += ` AND user_id = $${paramIndex}`;
        params.push(filter.userId);
        paramIndex++;
      }

      if (filter.dateRange) {
        query += ` AND timestamp BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
        params.push(filter.dateRange.start, filter.dateRange.end);
        paramIndex += 2;
      }

      const result = await prisma.$queryRawUnsafe(query, ...params);
      return Array.isArray(result) ? result.length : 0;
    } catch (error) {
      console.error('Failed to delete events:', error);
      throw error;
    }
  }

  async archiveOldEvents(): Promise<number> {
    if (!this.config.archiveOldEvents) {
      return 0;
    }

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

      const result = await prisma.$executeRaw`
        INSERT INTO "event_logs_archive"
        SELECT * FROM "event_logs"
        WHERE timestamp < ${cutoffDate}
      `;

      await prisma.$executeRaw`
        DELETE FROM "event_logs"
        WHERE timestamp < ${cutoffDate}
      `;

      console.log(`Archived ${result} old events`);
      return result;
    } catch (error) {
      console.error('Failed to archive old events:', error);
      throw error;
    }
  }

  async cleanupEvents(): Promise<void> {
    try {
      // Archive old events
      await this.archiveOldEvents();

      // Clean up any orphaned data
      await prisma.$executeRaw`
        DELETE FROM "event_logs"
        WHERE created_at < NOW() - INTERVAL '${this.config.retentionDays} days'
        AND id NOT IN (
          SELECT DISTINCT event_id FROM "event_processing_logs"
        )
      `;

      console.log('Event cleanup completed');
    } catch (error) {
      console.error('Failed to cleanup events:', error);
      throw error;
    }
  }

  // Private Methods
  private prepareEventData(event: BaseEvent): any {
    const payload = this.serializePayload(event);

    return {
      id: event.id,
      type: event.type,
      timestamp: event.timestamp,
      userId: event.userId || null,
      sessionId: event.sessionId || null,
      priority: event.priority,
      metadata: this.config.enableCompression &&
        JSON.stringify(event.metadata || {}).length > this.config.compressionThreshold
        ? this.compress(JSON.stringify(event.metadata || {}))
        : JSON.stringify(event.metadata || {}),
      correlationId: event.correlationId || null,
      source: event.source,
      payload: this.config.enableCompression &&
        payload.length > this.config.compressionThreshold
        ? this.compress(payload)
        : payload
    };
  }

  private parseEventData(row: any): BaseEvent {
    const metadata = row.metadata ?
      (this.isCompressed(row.metadata) ?
        this.decompress(row.metadata) : row.metadata) : '{}';

    const payload = row.payload ?
      (this.isCompressed(row.payload) ?
        this.decompress(row.payload) : row.payload) : '{}';

    return {
      id: row.id,
      type: row.type as EventType,
      timestamp: new Date(row.timestamp),
      userId: row.user_id,
      sessionId: row.session_id,
      priority: row.priority as EventPriority,
      metadata: JSON.parse(metadata),
      correlationId: row.correlation_id,
      source: row.source,
      payload: JSON.parse(payload)
    };
  }

  private serializePayload(event: BaseEvent): string {
    // Extract payload from event
    const payload = (event as any).payload || {};
    return JSON.stringify(payload);
  }

  private compress(data: string): string {
    // Simple compression placeholder - in production, use proper compression
    return Buffer.from(data).toString('base64');
  }

  private decompress(data: string): string {
    // Simple decompression placeholder - in production, use proper decompression
    return Buffer.from(data, 'base64').toString();
  }

  private isCompressed(data: string): boolean {
    // Check if data is compressed (base64 in this simple implementation)
    try {
      Buffer.from(data, 'base64');
      return true;
    } catch {
      return false;
    }
  }

  private startBatchFlush(): void {
    this.flushInterval = setInterval(() => {
      if (this.batchBuffer.length > 0) {
        this.flushBatch();
      }
    }, 5000); // Flush every 5 seconds
  }

  private async flushBatch(): Promise<void> {
    if (this.batchBuffer.length === 0) {
      return;
    }

    const batch = [...this.batchBuffer];
    this.batchBuffer = [];

    try {
      await this.saveBatch(batch);
    } catch (error) {
      console.error('Failed to flush event batch:', error);
      // Re-add events to buffer for retry
      this.batchBuffer.unshift(...batch);
    }
  }

  async shutdown(): Promise<void> {
    // Flush remaining events
    if (this.batchBuffer.length > 0) {
      await this.flushBatch();
    }

    // Clear flush interval
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }

    console.log('Event persistence shutdown complete');
  }
}

// Create table if it doesn't exist
export async function initializeEventPersistence(): Promise<void> {
  try {
    // Create event logs table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "event_logs" (
        "id" VARCHAR(255) PRIMARY KEY,
        "type" VARCHAR(100) NOT NULL,
        "timestamp" TIMESTAMP NOT NULL,
        "user_id" VARCHAR(255),
        "session_id" VARCHAR(255),
        "priority" VARCHAR(20) NOT NULL DEFAULT 'normal',
        "metadata" TEXT,
        "correlation_id" VARCHAR(255),
        "source" VARCHAR(100) NOT NULL,
        "payload" JSONB NOT NULL DEFAULT '{}',
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create archive table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "event_logs_archive" (
        LIKE "event_logs" INCLUDING ALL
      )
    `;

    // Create indexes
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "idx_event_logs_type" ON "event_logs" ("type")
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "idx_event_logs_user_id" ON "event_logs" ("user_id")
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "idx_event_logs_timestamp" ON "event_logs" ("timestamp")
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "idx_event_logs_priority" ON "event_logs" ("priority")
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "idx_event_logs_source" ON "event_logs" ("source")
    `;

    console.log('Event persistence initialized');
  } catch (error) {
    console.error('Failed to initialize event persistence:', error);
    throw error;
  }
}

// Singleton instance
export const eventPersistence = new EventPersistence();