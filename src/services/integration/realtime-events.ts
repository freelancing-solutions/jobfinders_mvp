/**
 * Real-time Events System
 * Provides WebSocket and event bus integration for real-time features
 */

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { Logger } from '@/lib/logger';
import { NotificationIntegrationService } from './notification-integration';
import { Redis } from 'ioredis';

export interface RealtimeEvent {
  id: string;
  type: string;
  userId?: string;
  data: any;
  timestamp: Date;
  metadata?: any;
}

export interface EventSubscription {
  userId: string;
  eventTypes: string[];
  socketId?: string;
  filters?: any;
}

export interface WebSocketConnection {
  userId: string;
  socketId: string;
  connectedAt: Date;
  lastActivity: Date;
  subscriptions: string[];
}

export class RealtimeEventService {
  private io: SocketIOServer;
  private logger: Logger;
  private notificationService: NotificationIntegrationService;
  private redis: Redis;
  private connections: Map<string, WebSocketConnection> = new Map();
  private subscriptions: Map<string, EventSubscription> = new Map();

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NODE_ENV === 'production'
          ? false
          : ['http://localhost:3000', 'http://localhost:3010'],
        methods: ['GET', 'POST']
      }
    });

    this.logger = new Logger('RealtimeEvents');
    this.notificationService = new NotificationIntegrationService();
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

    this.setupSocketHandlers();
    this.setupEventPublishers();
    this.setupCleanupInterval();
  }

  /**
   * Publish an event to subscribers
   */
  async publishEvent(event: Omit<RealtimeEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      const fullEvent: RealtimeEvent = {
        id: this.generateEventId(),
        timestamp: new Date(),
        ...event
      };

      // Store event in Redis for persistence and replay
      await this.storeEvent(fullEvent);

      // Publish to Redis pub/sub for cross-instance communication
      await this.redis.publish('realtime_events', JSON.stringify(fullEvent));

      // Process event locally
      await this.processEvent(fullEvent);

      this.logger.info(`Published event: ${event.type} for user: ${event.userId || 'broadcast'}`);

    } catch (error) {
      this.logger.error('Error publishing event:', error);
    }
  }

  /**
   * Subscribe a user to specific event types
   */
  async subscribeToEvents(userId: string, eventTypes: string[], socketId?: string, filters?: any): Promise<void> {
    try {
      const subscription: EventSubscription = {
        userId,
        eventTypes,
        socketId,
        filters
      };

      await this.redis.setex(
        `subscription:${userId}:${socketId || 'nosocket'}`,
        86400, // 24 hours
        JSON.stringify(subscription)
      );

      this.subscriptions.set(`${userId}:${socketId || 'nosocket'}`, subscription);

      this.logger.info(`User ${userId} subscribed to events: ${eventTypes.join(', ')}`);

    } catch (error) {
      this.logger.error('Error subscribing to events:', error);
    }
  }

  /**
   * Unsubscribe user from events
   */
  async unsubscribeFromEvents(userId: string, socketId?: string): Promise<void> {
    try {
      const key = `${userId}:${socketId || 'nosocket'}`;

      await this.redis.del(`subscription:${key}`);
      this.subscriptions.delete(key);

      this.logger.info(`User ${userId} unsubscribed from events`);

    } catch (error) {
      this.logger.error('Error unsubscribing from events:', error);
    }
  }

  /**
   * Get user's active connections
   */
  async getUserConnections(userId: string): Promise<WebSocketConnection[]> {
    const connections: WebSocketConnection[] = [];

    for (const [socketId, connection] of this.connections) {
      if (connection.userId === userId) {
        connections.push(connection);
      }
    }

    return connections;
  }

  /**
   * Send direct message to user
   */
  async sendToUser(userId: string, event: string, data: any): Promise<void> {
    const connections = await this.getUserConnections(userId);

    for (const connection of connections) {
      this.io.to(connection.socketId).emit(event, data);
    }

    // If no active connections, store as offline event
    if (connections.length === 0) {
      await this.storeOfflineEvent(userId, event, data);
    }
  }

  /**
   * Broadcast event to all connected users
   */
  async broadcast(event: string, data: any, filter?: (userId: string) => boolean): Promise<void> {
    if (filter) {
      // Send to specific users
      for (const [socketId, connection] of this.connections) {
        if (filter(connection.userId)) {
          this.io.to(socketId).emit(event, data);
        }
      }
    } else {
      // Send to all connected users
      this.io.emit(event, data);
    }
  }

  /**
   * Get real-time statistics
   */
  async getStats(): Promise<{
    totalConnections: number;
    uniqueUsers: number;
    totalSubscriptions: number;
    eventsPerMinute: number;
  }> {
    const uniqueUsers = new Set(Array.from(this.connections.values()).map(c => c.userId));

    // Get events per minute from Redis
    const eventsPerMinute = await this.redis.zcard('events:per_minute');

    return {
      totalConnections: this.connections.size,
      uniqueUsers: uniqueUsers.size,
      totalSubscriptions: this.subscriptions.size,
      eventsPerMinute
    };
  }

  /**
   * Get offline events for a user
   */
  async getOfflineEvents(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const events = await this.redis.lrange(`offline_events:${userId}`, 0, limit - 1);
      return events.map(event => JSON.parse(event));

    } catch (error) {
      this.logger.error('Error getting offline events:', error);
      return [];
    }
  }

  /**
   * Clear offline events for a user
   */
  async clearOfflineEvents(userId: string): Promise<void> {
    try {
      await this.redis.del(`offline_events:${userId}`);
    } catch (error) {
      this.logger.error('Error clearing offline events:', error);
    }
  }

  // Private methods
  private setupSocketHandlers(): void {
    this.io.on('connection', (socket) => {
      this.logger.info(`Socket connected: ${socket.id}`);

      socket.on('authenticate', async (data) => {
        try {
          const { userId, token } = data;

          // Verify token (implement your auth logic)
          const isValid = await this.verifyToken(userId, token);

          if (isValid) {
            // Register connection
            const connection: WebSocketConnection = {
              userId,
              socketId: socket.id,
              connectedAt: new Date(),
              lastActivity: new Date(),
              subscriptions: []
            };

            this.connections.set(socket.id, connection);

            // Load existing subscriptions
            await this.loadUserSubscriptions(userId, socket.id);

            // Send offline events
            const offlineEvents = await this.getOfflineEvents(userId);
            if (offlineEvents.length > 0) {
              socket.emit('offline_events', offlineEvents);
              await this.clearOfflineEvents(userId);
            }

            socket.emit('authenticated', { success: true });
            this.logger.info(`User ${userId} authenticated on socket ${socket.id}`);
          } else {
            socket.emit('authenticated', { success: false, error: 'Invalid token' });
            socket.disconnect();
          }

        } catch (error) {
          this.logger.error('Authentication error:', error);
          socket.emit('authenticated', { success: false, error: 'Authentication failed' });
          socket.disconnect();
        }
      });

      socket.on('subscribe', async (data) => {
        try {
          const { eventTypes, filters } = data;
          const connection = this.connections.get(socket.id);

          if (connection) {
            await this.subscribeToEvents(connection.userId, eventTypes, socket.id, filters);
            connection.subscriptions.push(...eventTypes);
          }

        } catch (error) {
          this.logger.error('Subscribe error:', error);
        }
      });

      socket.on('unsubscribe', async (data) => {
        try {
          const { eventTypes } = data;
          const connection = this.connections.get(socket.id);

          if (connection) {
            // Remove specific event types from subscriptions
            connection.subscriptions = connection.subscriptions.filter(
              sub => !eventTypes.includes(sub)
            );

            // Update subscription in Redis
            await this.updateSubscription(connection.userId, socket.id, connection.subscriptions);
          }

        } catch (error) {
          this.logger.error('Unsubscribe error:', error);
        }
      });

      socket.on('heartbeat', () => {
        const connection = this.connections.get(socket.id);
        if (connection) {
          connection.lastActivity = new Date();
        }
        socket.emit('heartbeat_response');
      });

      socket.on('disconnect', () => {
        const connection = this.connections.get(socket.id);
        if (connection) {
          this.logger.info(`User ${connection.userId} disconnected from socket ${socketId}`);
          this.connections.delete(socketId);

          // Remove socket-specific subscriptions
          await this.unsubscribeFromEvents(connection.userId, socketId);
        }
      });
    });
  }

  private setupEventPublishers(): void {
    // Listen to Redis pub/sub for events from other instances
    const subscriber = this.redis.duplicate();

    subscriber.subscribe('realtime_events');
    subscriber.on('message', (channel, message) => {
      if (channel === 'realtime_events') {
        const event: RealtimeEvent = JSON.parse(message);
        this.processEvent(event);
      }
    });
  }

  private async processEvent(event: RealtimeEvent): Promise<void> {
    try {
      // Find matching subscriptions
      const matchingSubscriptions = Array.from(this.subscriptions.values()).filter(sub => {
        if (event.userId && sub.userId !== event.userId) {
          return false;
        }

        if (sub.eventTypes.length > 0 && !sub.eventTypes.includes(event.type)) {
          return false;
        }

        // Apply filters if present
        if (sub.filters) {
          return this.matchesFilters(event, sub.filters);
        }

        return true;
      });

      // Send to matching connections
      for (const subscription of matchingSubscriptions) {
        if (subscription.socketId) {
          this.io.to(subscription.socketId).emit(event.type, event);
        }
      }

      // Track event metrics
      await this.trackEvent(event);

    } catch (error) {
      this.logger.error('Error processing event:', error);
    }
  }

  private async storeEvent(event: RealtimeEvent): Promise<void> {
    // Store recent events in Redis for analytics and debugging
    await this.redis.zadd(
      'recent_events',
      event.timestamp.getTime(),
      JSON.stringify(event)
    );

    // Keep only last 1000 events
    await this.redis.zremrangebyrank('recent_events', 0, -1001);

    // Track events per minute
    const minuteKey = Math.floor(event.timestamp.getTime() / 60000);
    await this.redis.zincrby('events:per_minute', 1, minuteKey.toString());

    // Clean old minute data (keep last 60 minutes)
    const cutoffMinute = Math.floor(Date.now() / 60000) - 60;
    await this.redis.zremrangebyscore('events:per_minute', 0, cutoffMinute);
  }

  private async storeOfflineEvent(userId: string, event: string, data: any): Promise<void> {
    const offlineEvent = {
      event,
      data,
      timestamp: new Date()
    };

    await this.redis.lpush(
      `offline_events:${userId}`,
      JSON.stringify(offlineEvent)
    );

    // Keep only last 100 offline events per user
    await this.redis.ltrim(`offline_events:${userId}`, 0, 99);

    // Set expiration
    await this.redis.expire(`offline_events:${userId}`, 86400 * 7); // 7 days
  }

  private async loadUserSubscriptions(userId: string, socketId: string): Promise<void> {
    try {
      const key = `subscription:${userId}:nosocket`;
      const subscriptionData = await this.redis.get(key);

      if (subscriptionData) {
        const subscription: EventSubscription = JSON.parse(subscriptionData);

        // Create socket-specific subscription
        await this.subscribeToEvents(
          subscription.userId,
          subscription.eventTypes,
          socketId,
          subscription.filters
        );

        const connection = this.connections.get(socketId);
        if (connection) {
          connection.subscriptions.push(...subscription.eventTypes);
        }
      }

    } catch (error) {
      this.logger.error('Error loading user subscriptions:', error);
    }
  }

  private async updateSubscription(userId: string, socketId: string, eventTypes: string[]): Promise<void> {
    try {
      const key = `subscription:${userId}:${socketId}`;
      const existing = await this.redis.get(key);

      if (existing) {
        const subscription: EventSubscription = JSON.parse(existing);
        subscription.eventTypes = eventTypes;

        await this.redis.setex(key, 86400, JSON.stringify(subscription));
      }

    } catch (error) {
      this.logger.error('Error updating subscription:', error);
    }
  }

  private matchesFilters(event: RealtimeEvent, filters: any): boolean {
    // Implement filter matching logic based on your filter structure
    // This is a placeholder implementation
    return true;
  }

  private async verifyToken(userId: string, token: string): Promise<boolean> {
    // Implement your token verification logic
    // This would typically involve checking with your authentication service
    return true; // Placeholder
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async trackEvent(event: RealtimeEvent): Promise<void> {
    // Track event analytics
    await this.redis.hincrby('event_types', event.type, 1);

    if (event.userId) {
      await this.redis.hincrby('user_events', event.userId, 1);
    }
  }

  private setupCleanupInterval(): void {
    // Clean up inactive connections every 5 minutes
    setInterval(async () => {
      const now = new Date();
      const timeoutMs = 30 * 60 * 1000; // 30 minutes

      for (const [socketId, connection] of this.connections) {
        if (now.getTime() - connection.lastActivity.getTime() > timeoutMs) {
          this.logger.info(`Cleaning up inactive connection: ${socketId}`);
          this.connections.delete(socketId);

          // Close socket if still connected
          const socket = this.io.sockets.sockets.get(socketId);
          if (socket) {
            socket.disconnect(true);
          }
        }
      }
    }, 5 * 60 * 1000); // 5 minutes
  }
}

// Singleton instance
let realtimeEventService: RealtimeEventService | null = null;

export function initializeRealtimeEvents(httpServer: HTTPServer): RealtimeEventService {
  if (!realtimeEventService) {
    realtimeEventService = new RealtimeEventService(httpServer);
  }
  return realtimeEventService;
}

export function getRealtimeEventService(): RealtimeEventService | null {
  return realtimeEventService;
}