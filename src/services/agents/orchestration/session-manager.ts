import { v4 as uuidv4 } from 'uuid';
import { Redis } from '@/lib/redis';
import { Logger } from '@/lib/logger';
import { AgentType } from '@/types/agents';

export interface AgentSession {
  sessionId: string;
  userId: string;
  agentType?: AgentType;
  startTime: Date;
  lastActivity: Date;
  context: SessionContext;
  conversationHistory: SessionMessage[];
  preferences: UserSessionPreferences;
  status: SessionStatus;
}

export interface SessionContext {
  currentGoal?: string;
  userIntent?: string;
  relevantData?: Record<string, any>;
  sharedContext?: Record<string, any>;
  lastIntent?: string;
  sessionMetrics?: SessionMetrics;
}

export interface SessionMessage {
  messageId: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  agentType?: AgentType;
}

export interface UserSessionPreferences {
  communicationStyle: 'formal' | 'casual' | 'friendly';
  responseLength: 'concise' | 'detailed' | 'comprehensive';
  language: string;
  timezone: string;
  enableSuggestions: boolean;
  enableActions: boolean;
}

export interface SessionMetrics {
  messageCount: number;
  averageResponseTime: number;
  userSatisfactionScore?: number;
  taskCompletionRate: number;
  sessionDuration: number;
}

export enum SessionStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ERROR = 'error',
  TIMEOUT = 'timeout'
}

export interface CreateSessionOptions {
  agentType?: AgentType;
  initialContext?: Record<string, any>;
  preferences?: Partial<UserSessionPreferences>;
}

export interface UpdateSessionOptions {
  agentType?: AgentType;
  context?: Partial<SessionContext>;
  status?: SessionStatus;
  preferences?: Partial<UserSessionPreferences>;
}

export class SessionManager {
  private redis: Redis;
  private logger: Logger;
  private readonly SESSION_TTL = 24 * 60 * 60; // 24 hours in seconds
  private readonly MAX_HISTORY_LENGTH = 100;

  constructor() {
    this.redis = new Redis();
    this.logger = new Logger('SessionManager');
  }

  /**
   * Create a new agent session
   */
  async createSession(
    userId: string,
    options: CreateSessionOptions = {}
  ): Promise<AgentSession> {
    try {
      const sessionId = uuidv4();
      const now = new Date();

      const session: AgentSession = {
        sessionId,
        userId,
        agentType: options.agentType,
        startTime: now,
        lastActivity: now,
        context: {
          ...options.initialContext,
          sessionMetrics: {
            messageCount: 0,
            averageResponseTime: 0,
            taskCompletionRate: 0,
            sessionDuration: 0
          }
        },
        conversationHistory: [],
        preferences: {
          communicationStyle: 'friendly',
          responseLength: 'detailed',
          language: 'en',
          timezone: 'UTC',
          enableSuggestions: true,
          enableActions: true,
          ...options.preferences
        },
        status: SessionStatus.ACTIVE
      };

      // Store session in Redis
      await this.storeSession(session);

      this.logger.info(`Created session ${sessionId} for user ${userId}`);
      return session;

    } catch (error) {
      this.logger.error('Error creating session:', error);
      throw error;
    }
  }

  /**
   * Get an existing session
   */
  async getSession(sessionId: string): Promise<AgentSession | null> {
    try {
      const sessionData = await this.redis.get(`session:${sessionId}`);
      if (!sessionData) {
        return null;
      }

      const session: AgentSession = JSON.parse(sessionData);

      // Check if session has expired
      const now = new Date();
      const timeDiff = now.getTime() - new Date(session.lastActivity).getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);

      if (hoursDiff > 24) {
        await this.deleteSession(sessionId);
        return null;
      }

      return session;

    } catch (error) {
      this.logger.error(`Error getting session ${sessionId}:`, error);
      return null;
    }
  }

  /**
   * Update an existing session
   */
  async updateSession(
    sessionId: string,
    updates: UpdateSessionOptions
  ): Promise<AgentSession | null> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        return null;
      }

      // Apply updates
      if (updates.agentType) {
        session.agentType = updates.agentType;
      }

      if (updates.context) {
        session.context = { ...session.context, ...updates.context };
      }

      if (updates.status) {
        session.status = updates.status;
      }

      if (updates.preferences) {
        session.preferences = { ...session.preferences, ...updates.preferences };
      }

      session.lastActivity = new Date();

      await this.storeSession(session);
      return session;

    } catch (error) {
      this.logger.error(`Error updating session ${sessionId}:`, error);
      return null;
    }
  }

  /**
   * Add a message to the conversation history
   */
  async addMessage(
    sessionId: string,
    role: 'user' | 'agent' | 'system',
    content: string,
    metadata?: Record<string, any>,
    agentType?: AgentType
  ): Promise<void> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const message: SessionMessage = {
        messageId: uuidv4(),
        role,
        content,
        timestamp: new Date(),
        metadata,
        agentType
      };

      // Add message to history
      session.conversationHistory.push(message);

      // Limit history length
      if (session.conversationHistory.length > this.MAX_HISTORY_LENGTH) {
        session.conversationHistory = session.conversationHistory.slice(-this.MAX_HISTORY_LENGTH);
      }

      // Update metrics
      if (session.context.sessionMetrics) {
        session.context.sessionMetrics.messageCount++;
        session.context.sessionMetrics.sessionDuration =
          new Date().getTime() - session.startTime.getTime();
      }

      session.lastActivity = new Date();

      await this.storeSession(session);

    } catch (error) {
      this.logger.error(`Error adding message to session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Get conversation history for a session
   */
  async getConversationHistory(
    sessionId: string,
    limit?: number
  ): Promise<SessionMessage[]> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        return [];
      }

      const history = session.conversationHistory;

      if (limit) {
        return history.slice(-limit);
      }

      return history;

    } catch (error) {
      this.logger.error(`Error getting conversation history for session ${sessionId}:`, error);
      return [];
    }
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: string): Promise<AgentSession[]> {
    try {
      const pattern = `session:*`;
      const keys = await this.redis.keys(pattern);
      const userSessions: AgentSession[] = [];

      for (const key of keys) {
        const sessionData = await this.redis.get(key);
        if (sessionData) {
          const session: AgentSession = JSON.parse(sessionData);
          if (session.userId === userId && session.status === SessionStatus.ACTIVE) {
            userSessions.push(session);
          }
        }
      }

      return userSessions.sort((a, b) =>
        new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
      );

    } catch (error) {
      this.logger.error(`Error getting sessions for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Get active session count by agent type
   */
  async getActiveSessionCount(agentType?: AgentType): Promise<number> {
    try {
      const pattern = `session:*`;
      const keys = await this.redis.keys(pattern);
      let count = 0;

      for (const key of keys) {
        const sessionData = await this.redis.get(key);
        if (sessionData) {
          const session: AgentSession = JSON.parse(sessionData);
          if (session.status === SessionStatus.ACTIVE) {
            if (!agentType || session.agentType === agentType) {
              count++;
            }
          }
        }
      }

      return count;

    } catch (error) {
      this.logger.error('Error getting active session count:', error);
      return 0;
    }
  }

  /**
   * Pause a session
   */
  async pauseSession(sessionId: string): Promise<boolean> {
    try {
      return await this.updateSessionStatus(sessionId, SessionStatus.PAUSED);
    } catch (error) {
      this.logger.error(`Error pausing session ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Resume a session
   */
  async resumeSession(sessionId: string): Promise<boolean> {
    try {
      return await this.updateSessionStatus(sessionId, SessionStatus.ACTIVE);
    } catch (error) {
      this.logger.error(`Error resuming session ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Complete a session
   */
  async completeSession(sessionId: string): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId);
      if (session && session.context.sessionMetrics) {
        // Calculate final metrics
        const duration = new Date().getTime() - session.startTime.getTime();
        session.context.sessionMetrics.sessionDuration = duration;

        await this.storeSession(session);
      }

      return await this.updateSessionStatus(sessionId, SessionStatus.COMPLETED);
    } catch (error) {
      this.logger.error(`Error completing session ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      await this.redis.del(`session:${sessionId}`);
      this.logger.info(`Deleted session ${sessionId}`);
      return true;
    } catch (error) {
      this.logger.error(`Error deleting session ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const pattern = `session:*`;
      const keys = await this.redis.keys(pattern);
      let cleanedCount = 0;

      for (const key of keys) {
        const sessionData = await this.redis.get(key);
        if (sessionData) {
          const session: AgentSession = JSON.parse(sessionData);
          const now = new Date();
          const timeDiff = now.getTime() - new Date(session.lastActivity).getTime();
          const hoursDiff = timeDiff / (1000 * 60 * 60);

          if (hoursDiff > 24 || session.status === SessionStatus.COMPLETED) {
            await this.redis.del(key);
            cleanedCount++;
          }
        }
      }

      this.logger.info(`Cleaned up ${cleanedCount} expired sessions`);
      return cleanedCount;

    } catch (error) {
      this.logger.error('Error cleaning up expired sessions:', error);
      return 0;
    }
  }

  /**
   * Get session analytics
   */
  async getSessionAnalytics(userId?: string): Promise<Record<string, any>> {
    try {
      const pattern = `session:*`;
      const keys = await this.redis.keys(pattern);
      const analytics = {
        totalSessions: 0,
        activeSessions: 0,
        completedSessions: 0,
        averageSessionDuration: 0,
        totalMessages: 0,
        sessionsByAgentType: {} as Record<string, number>,
        userSessions: userId ? 0 : undefined
      };

      let totalDuration = 0;
      let sessionCount = 0;

      for (const key of keys) {
        const sessionData = await this.redis.get(key);
        if (sessionData) {
          const session: AgentSession = JSON.parse(sessionData);

          // Filter by user if specified
          if (userId && session.userId !== userId) {
            continue;
          }

          analytics.totalSessions++;

          if (session.status === SessionStatus.ACTIVE) {
            analytics.activeSessions++;
          } else if (session.status === SessionStatus.COMPLETED) {
            analytics.completedSessions++;
          }

          if (session.agentType) {
            analytics.sessionsByAgentType[session.agentType] =
              (analytics.sessionsByAgentType[session.agentType] || 0) + 1;
          }

          if (session.context.sessionMetrics) {
            analytics.totalMessages += session.context.sessionMetrics.messageCount || 0;
            totalDuration += session.context.sessionMetrics.sessionDuration || 0;
            sessionCount++;
          }

          if (userId) {
            analytics.userSessions = (analytics.userSessions || 0) + 1;
          }
        }
      }

      if (sessionCount > 0) {
        analytics.averageSessionDuration = totalDuration / sessionCount;
      }

      return analytics;

    } catch (error) {
      this.logger.error('Error getting session analytics:', error);
      return {};
    }
  }

  /**
   * Store session in Redis with TTL
   */
  private async storeSession(session: AgentSession): Promise<void> {
    const sessionData = JSON.stringify(session);
    await this.redis.setex(`session:${session.sessionId}`, this.SESSION_TTL, sessionData);
  }

  /**
   * Update session status
   */
  private async updateSessionStatus(
    sessionId: string,
    status: SessionStatus
  ): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        return false;
      }

      session.status = status;
      session.lastActivity = new Date();

      await this.storeSession(session);
      return true;

    } catch (error) {
      this.logger.error(`Error updating session status for ${sessionId}:`, error);
      return false;
    }
  }
}