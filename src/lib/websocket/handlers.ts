// WebSocket Event Handlers
// Event handlers for WebSocket connections and real-time features

import { Server as SocketIOServer, Socket } from 'socket.io';
import { AuthenticatedSocket } from './server';
import { RoomManager, RoomType } from './rooms';
import { eventBus, EventType, EventPriority } from '../events';
import { createRateLimitError } from '../api/error-handler';

export interface WebSocketHandlerConfig {
  enableHeartbeat: boolean;
  heartbeatInterval: number;
  enableReconnection: boolean;
  maxReconnectionAttempts: number;
  reconnectionDelay: number;
  enablePresence: boolean;
  enableTypingIndicators: boolean;
  enableFileSharing: boolean;
  enableScreenShare: boolean;
}

export class WebSocketHandlers {
  private io: SocketIOServer;
  private roomManager: RoomManager;
  private config: WebSocketHandlerConfig;
  private presence = new Map<string, UserPresence>(); // userId -> presence
  private typingUsers = new Map<string, Set<string>>(); // roomId -> set of userIds

  constructor(
    io: SocketIOServer,
    roomManager: RoomManager,
    config?: Partial<WebSocketHandlerConfig>
  ) {
    this.io = io;
    this.roomManager = roomManager;
    this.config = {
      enableHeartbeat: true,
      heartbeatInterval: 30000, // 30 seconds
      enableReconnection: true,
      maxReconnectionAttempts: 5,
      reconnectionDelay: 1000,
      enablePresence: true,
      enableTypingIndicators: true,
      enableFileSharing: true,
      enableScreenShare: false,
      ...config
    };

    this.setupGlobalHandlers();
    this.startPresenceTracking();
  }

  private setupGlobalHandlers(): void {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      this.setupConnectionHandlers(socket);
    });
  }

  private setupConnectionHandlers(socket: AuthenticatedSocket): void {
    // Connection lifecycle
    socket.on('authenticate', (data) => this.handleAuthentication(socket, data));
    socket.on('disconnect', (reason) => this.handleDisconnection(socket, reason));
    socket.on('error', (error) => this.handleError(socket, error));

    // Room management
    socket.on('join-room', (data) => this.handleJoinRoom(socket, data));
    socket.on('leave-room', (data) => this.handleLeaveRoom(socket, data));
    socket.on('create-room', (data) => this.handleCreateRoom(socket, data));
    socket.on('delete-room', (data) => this.handleDeleteRoom(socket, data));
    socket.on('get-room-info', (data) => this.handleGetRoomInfo(socket, data));

    // Messaging
    socket.on('send-message', (data) => this.handleSendMessage(socket, data));
    socket.on('edit-message', (data) => this.handleEditMessage(socket, data));
    socket.on('delete-message', (data) => this.handleDeleteMessage(socket, data));
    socket.on('add-reaction', (data) => this.handleAddReaction(socket, data));
    socket.on('get-messages', (data) => this.handleGetMessages(socket, data));

    // Real-time features
    socket.on('update-presence', (data) => this.handleUpdatePresence(socket, data));
    socket.on('typing-start', (data) => this.handleTypingStart(socket, data));
    socket.on('typing-stop', (data) => this.handleTypingStop(socket, data));

    // File sharing
    socket.on('share-file', (data) => this.handleShareFile(socket, data));
    socket.on('request-file', (data) => this.handleRequestFile(socket, data));

    // Screen sharing
    socket.on('start-screen-share', (data) => this.handleStartScreenShare(socket, data));
    socket.on('stop-screen-share', (data) => this.handleStopScreenShare(socket, data));
    socket.on('join-screen-share', (data) => this.handleJoinScreenShare(socket, data));

    // Notifications and alerts
    socket.on('mark-notification-read', (data) => this.handleMarkNotificationRead(socket, data));
    socket.on('subscribe-notifications', (data) => this.handleSubscribeNotifications(socket, data));
    socket.on('unsubscribe-notifications', (data) => this.handleUnsubscribeNotifications(socket, data));

    // Analytics and metrics
    socket.on('track-event', (data) => this.handleTrackEvent(socket, data));
    socket.on('get-analytics', (data) => this.handleGetAnalytics(socket, data));

    // System events
    socket.on('ping', () => this.handlePing(socket));
    socket.on('get-system-status', () => this.handleGetSystemStatus(socket));
  }

  // Authentication handlers
  private async handleAuthentication(
    socket: AuthenticatedSocket,
    data: { token?: string; userId?: string; sessionId?: string }
  ): Promise<void> {
    try {
      const { token, userId, sessionId } = data;

      // Validate authentication data
      if (!token && !userId) {
        socket.emit('authentication-error', { message: 'Authentication required' });
        return;
      }

      // Update socket with auth info
      if (userId) {
        socket.userId = userId;
        socket.isAuthenticated = true;
      }

      if (sessionId) {
        socket.sessionId = sessionId;
      }

      // Join user's personal room
      if (socket.userId) {
        await this.joinUserPersonalRoom(socket);
        this.updateUserPresence(socket.userId, 'online');
      }

      socket.emit('authenticated', {
        success: true,
        userId: socket.userId,
        timestamp: new Date().toISOString()
      });

      // Publish authentication event
      await eventBus.publish({
        id: `ws-auth-${socket.id}`,
        type: EventType.REAL_TIME_CONNECTION_ESTABLISHED,
        timestamp: new Date(),
        userId: socket.userId,
        priority: EventPriority.NORMAL,
        source: 'websocket-handlers',
        payload: {
          userId: socket.userId,
          sessionId: socket.sessionId,
          connectionId: socket.id,
          authenticatedAt: new Date()
        }
      });

    } catch (error) {
      console.error('WebSocket authentication error:', error);
      socket.emit('authentication-error', { message: 'Authentication failed' });
    }
  }

  // Connection lifecycle handlers
  private async handleDisconnection(socket: AuthenticatedSocket, reason: string): Promise<void> {
    try {
      // Update presence
      if (socket.userId) {
        this.updateUserPresence(socket.userId, 'offline');
      }

      // Clean up typing indicators
      this.cleanupTypingIndicators(socket);

      // Leave all rooms
      const userRooms = this.roomManager.getRoomsByUser(socket.userId || '');
      for (const room of userRooms) {
        await this.roomManager.removeMember(room.id, socket.id, 'disconnected');
      }

      // Publish disconnection event
      await eventBus.publish({
        id: `ws-disconnect-${socket.id}`,
        type: EventType.REAL_TIME_CONNECTION_LOST,
        timestamp: new Date(),
        userId: socket.userId,
        priority: EventPriority.NORMAL,
        source: 'websocket-handlers',
        payload: {
          userId: socket.userId,
          sessionId: socket.sessionId,
          connectionId: socket.id,
          reason,
          disconnectedAt: new Date()
        }
      });

      console.log(`WebSocket disconnected: ${socket.id} (${reason})`);
    } catch (error) {
      console.error('Error handling disconnection:', error);
    }
  }

  private handleError(socket: AuthenticatedSocket, error: Error): void {
    console.error(`WebSocket error for ${socket.id}:`, error);

    // Send error to client
    socket.emit('error', {
      message: error.message,
      code: 'WEBSOCKET_ERROR',
      timestamp: new Date().toISOString()
    });

    // Publish error event
    eventBus.publish({
      id: `ws-error-${socket.id}`,
      type: EventType.SYSTEM_ERROR_OCCURRED,
      timestamp: new Date(),
      userId: socket.userId,
      priority: EventPriority.HIGH,
      source: 'websocket-handlers',
      payload: {
        errorId: socket.id,
        errorType: 'websocket_error',
        message: error.message,
        stack: error.stack,
        context: {
          socketId: socket.id,
          userId: socket.userId,
          userAgent: socket.handshake.headers['user-agent']
        },
        severity: 'medium',
        userId: socket.userId
      }
    });
  }

  // Room management handlers
  private async handleJoinRoom(
    socket: AuthenticatedSocket,
    data: { roomId: string; password?: string }
  ): Promise<void> {
    try {
      const { roomId, password } = data;

      // Check if user can join room
      const room = this.roomManager.getRoom(roomId);
      if (!room) {
        socket.emit('join-room-error', { message: 'Room not found' });
        return;
      }

      // Add member to room
      const member = await this.roomManager.addMember(roomId, socket);

      // Join socket.io room
      await socket.join(roomId);

      // Send success response
      socket.emit('room-joined', {
        roomId,
        roomName: room.name,
        memberCount: room.members.size,
        permissions: member.permissions
      });

      // Notify other members
      socket.to(roomId).emit('member-joined', {
        roomId,
        member: {
          userId: socket.userId,
          socketId: socket.id,
          role: member.role,
          joinedAt: member.joinedAt
        }
      });

      // Send recent messages to new member
      const recentMessages = this.roomManager.getRoomMessages(roomId, 50);
      socket.emit('messages-history', {
        roomId,
        messages: recentMessages
      });

    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('join-room-error', { message: 'Failed to join room' });
    }
  }

  private async handleLeaveRoom(
    socket: AuthenticatedSocket,
    data: { roomId: string }
  ): Promise<void> {
    try {
      const { roomId } = data;

      await this.roomManager.removeMember(roomId, socket.id);
      await socket.leave(roomId);

      socket.emit('room-left', { roomId });

      // Notify other members
      socket.to(roomId).emit('member-left', {
        roomId,
        member: {
          userId: socket.userId,
          socketId: socket.id,
          leftAt: new Date()
        }
      });

    } catch (error) {
      console.error('Error leaving room:', error);
      socket.emit('leave-room-error', { message: 'Failed to leave room' });
    }
  }

  private async handleCreateRoom(
    socket: AuthenticatedSocket,
    data: {
      name: string;
      type: RoomType;
      isPrivate?: boolean;
      maxMembers?: number;
      password?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    try {
      const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const room = await this.roomManager.createRoom({
        id: roomId,
        name: data.name,
        type: data.type,
        isPrivate: data.isPrivate || false,
        isTemporary: data.type === RoomType.CHAT,
        maxMembers: data.maxMembers,
        requiresInvite: data.isPrivate || false,
        password: data.password,
        metadata: {
          ...data.metadata,
          createdBy: socket.userId,
          createdAt: new Date()
        }
      });

      // Creator automatically joins the room
      await this.handleJoinRoom(socket, { roomId });

      socket.emit('room-created', {
        roomId: room.id,
        room: {
          id: room.id,
          name: room.name,
          type: room.type,
          isPrivate: room.isPrivate,
          maxMembers: room.maxMembers,
          memberCount: room.members.size
        }
      });

    } catch (error) {
      console.error('Error creating room:', error);
      socket.emit('create-room-error', { message: 'Failed to create room' });
    }
  }

  private async handleDeleteRoom(
    socket: AuthenticatedSocket,
    data: { roomId: string }
  ): Promise<void> {
    try {
      const { roomId } = data;
      const room = this.roomManager.getRoom(roomId);

      if (!room) {
        socket.emit('delete-room-error', { message: 'Room not found' });
        return;
      }

      // Check if user can delete room
      if (room.metadata?.createdBy !== socket.userId) {
        socket.emit('delete-room-error', { message: 'Permission denied' });
        return;
      }

      const success = await this.roomManager.deleteRoom(roomId, socket.userId);

      if (success) {
        socket.emit('room-deleted', { roomId });

        // Notify all members
        this.io.to(roomId).emit('room-deleted', {
          roomId,
          deletedBy: socket.userId
        });

        // Make all members leave the socket.io room
        this.io.in(roomId).socketsLeave(roomId);
      } else {
        socket.emit('delete-room-error', { message: 'Failed to delete room' });
      }

    } catch (error) {
      console.error('Error deleting room:', error);
      socket.emit('delete-room-error', { message: 'Failed to delete room' });
    }
  }

  private handleGetRoomInfo(
    socket: AuthenticatedSocket,
    data: { roomId: string }
  ): void {
    try {
      const { roomId } = data;
      const room = this.roomManager.getRoom(roomId);

      if (!room) {
        socket.emit('room-info-error', { message: 'Room not found' });
        return;
      }

      const members = this.roomManager.getRoomMembers(roomId);
      const recentMessages = this.roomManager.getRoomMessages(roomId, 10);

      socket.emit('room-info', {
        room: {
          id: room.id,
          name: room.name,
          type: room.type,
          isPrivate: room.isPrivate,
          maxMembers: room.maxMembers,
          memberCount: room.members.size,
          createdAt: room.createdAt,
          lastActivity: room.lastActivity
        },
        members: members.map(member => ({
          userId: member.userId,
          role: member.role,
          joinedAt: member.joinedAt,
          isOnline: member.isOnline,
          permissions: member.permissions
        })),
        recentMessages
      });

    } catch (error) {
      console.error('Error getting room info:', error);
      socket.emit('room-info-error', { message: 'Failed to get room info' });
    }
  }

  // Messaging handlers
  private async handleSendMessage(
    socket: AuthenticatedSocket,
    data: {
      roomId: string;
      type: string;
      content: string;
      metadata?: Record<string, any>;
      replyTo?: string;
    }
  ): Promise<void> {
    try {
      const { roomId, type, content, metadata, replyTo } = data;

      // Check if user is in room and can speak
      const member = this.roomManager.getMember(roomId, socket.id);
      if (!member || !member.permissions.canSpeak) {
        socket.emit('message-error', { message: 'Cannot send message to this room' });
        return;
      }

      // Add message
      const message = await this.roomManager.addMessage(roomId, {
        userId: socket.userId,
        type: type as any,
        content,
        metadata: {
          ...metadata,
          socketId: socket.id,
          userAgent: socket.handshake.headers['user-agent']
        },
        replyTo
      });

      // Broadcast message to room
      this.io.to(roomId).emit('message-received', {
        roomId,
        message
      });

      // Publish message event
      await eventBus.publish({
        id: `message-${message.id}`,
        type: EventType.ANALYTICS_DATA_COLLECTED,
        timestamp: new Date(),
        userId: socket.userId,
        priority: EventPriority.NORMAL,
        source: 'websocket-handlers',
        payload: {
          eventType: 'message_sent',
          data: {
            messageId: message.id,
            roomId,
            userId: socket.userId,
            messageType: type,
            timestamp: message.timestamp
          }
        }
      });

    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('message-error', { message: 'Failed to send message' });
    }
  }

  private async handleEditMessage(
    socket: AuthenticatedSocket,
    data: { roomId: string; messageId: string; content: string }
  ): Promise<void> {
    try {
      const { roomId, messageId, content } = data;

      const success = await this.roomManager.updateMessage(roomId, messageId, content, socket.id);

      if (success) {
        this.io.to(roomId).emit('message-edited', {
          roomId,
          messageId,
          content,
          editedBy: socket.userId,
          editedAt: new Date().toISOString()
        });
      } else {
        socket.emit('message-edit-error', { message: 'Failed to edit message' });
      }

    } catch (error) {
      console.error('Error editing message:', error);
      socket.emit('message-edit-error', { message: 'Failed to edit message' });
    }
  }

  private async handleDeleteMessage(
    socket: AuthenticatedSocket,
    data: { roomId: string; messageId: string }
  ): Promise<void> {
    try {
      const { roomId, messageId } = data;

      const success = await this.roomManager.deleteMessage(roomId, messageId, socket.id);

      if (success) {
        this.io.to(roomId).emit('message-deleted', {
          roomId,
          messageId,
          deletedBy: socket.userId,
          deletedAt: new Date().toISOString()
        });
      } else {
        socket.emit('message-delete-error', { message: 'Failed to delete message' });
      }

    } catch (error) {
      console.error('Error deleting message:', error);
      socket.emit('message-delete-error', { message: 'Failed to delete message' });
    }
  }

  private async handleAddReaction(
    socket: AuthenticatedSocket,
    data: { roomId: string; messageId: string; emoji: string }
  ): Promise<void> {
    try {
      const { roomId, messageId, emoji } = data;

      const success = await this.roomManager.addReaction(roomId, messageId, emoji, socket.userId!);

      if (success) {
        const message = this.roomManager.getRoomMessages(roomId, 1)
          .find(msg => msg.id === messageId);

        this.io.to(roomId).emit('message-reaction-updated', {
          roomId,
          messageId,
          reactions: message?.reactions || []
        });
      }

    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  }

  private handleGetMessages(
    socket: AuthenticatedSocket,
    data: { roomId: string; limit?: number; before?: string }
  ): void {
    try {
      const { roomId, limit = 50, before } = data;

      // Check if user is in room
      const member = this.roomManager.getMember(roomId, socket.id);
      if (!member) {
        socket.emit('messages-error', { message: 'Not authorized to view messages in this room' });
        return;
      }

      const messages = this.roomManager.getRoomMessages(roomId, limit);

      socket.emit('messages-list', {
        roomId,
        messages
      });

    } catch (error) {
      console.error('Error getting messages:', error);
      socket.emit('messages-error', { message: 'Failed to get messages' });
    }
  }

  // Presence handlers
  private async handleUpdatePresence(
    socket: AuthenticatedSocket,
    data: { status: 'online' | 'away' | 'busy' | 'invisible'; metadata?: Record<string, any> }
  ): Promise<void> {
    if (!socket.userId) return;

    this.updateUserPresence(socket.userId, data.status, data.metadata);

    // Notify user's rooms about presence change
    const userRooms = this.roomManager.getRoomsByUser(socket.userId);
    for (const room of userRooms) {
      socket.to(room.id).emit('presence-updated', {
        userId: socket.userId,
        status: data.status,
        metadata: data.metadata,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Typing indicators
  private handleTypingStart(
    socket: AuthenticatedSocket,
    data: { roomId: string; type: string }
  ): void {
    if (!this.config.enableTypingIndicators || !socket.userId) return;

    const { roomId, type } = data;

    if (!this.typingUsers.has(roomId)) {
      this.typingUsers.set(roomId, new Set());
    }

    this.typingUsers.get(roomId)!.add(socket.userId);

    socket.to(roomId).emit('typing-start', {
      roomId,
      userId: socket.userId,
      type,
      timestamp: new Date().toISOString()
    });

    // Auto-stop typing after 5 seconds of inactivity
    setTimeout(() => {
      if (this.typingUsers.get(roomId)?.has(socket.userId)) {
        this.handleTypingStop(socket, { roomId });
      }
    }, 5000);
  }

  private handleTypingStop(
    socket: AuthenticatedSocket,
    data: { roomId: string }
  ): void {
    if (!this.config.enableTypingIndicators || !socket.userId) return;

    const { roomId } = data;

    const roomTypingUsers = this.typingUsers.get(roomId);
    if (roomTypingUsers) {
      roomTypingUsers.delete(socket.userId);
      if (roomTypingUsers.size === 0) {
        this.typingUsers.delete(roomId);
      }
    }

    socket.to(roomId).emit('typing-stop', {
      roomId,
      userId: socket.userId,
      timestamp: new Date().toISOString()
    });
  }

  // System handlers
  private handlePing(socket: AuthenticatedSocket): void {
    socket.emit('pong', {
      timestamp: new Date().toISOString(),
      latency: Date.now() - (socket.handshake.time as number)
    });
  }

  private handleGetSystemStatus(socket: AuthenticatedSocket): void {
    const stats = this.roomManager.getStatistics();
    const systemStatus = {
      websocket: {
        connectedClients: this.io.engine.clientsCount,
        totalRooms: stats.totalRooms,
        activeRooms: stats.activeRooms,
        totalMembers: stats.totalMembers,
        totalMessages: stats.totalMessages
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };

    socket.emit('system-status', systemStatus);
  }

  // Helper methods
  private async joinUserPersonalRoom(socket: AuthenticatedSocket): Promise<void> {
    if (!socket.userId) return;

    const personalRoomId = `user:${socket.userId}`;

    // Create personal room if it doesn't exist
    if (!this.roomManager.getRoom(personalRoomId)) {
      await this.roomManager.createRoom({
        id: personalRoomId,
        name: `Personal Room: ${socket.userId}`,
        type: RoomType.USER,
        isPrivate: true,
        isTemporary: false,
        requiresInvite: true,
        metadata: {
          userId: socket.userId,
          isPersonalRoom: true
        }
      });
    }

    await this.handleJoinRoom(socket, { roomId: personalRoomId });
  }

  private updateUserPresence(
    userId: string,
    status: 'online' | 'away' | 'busy' | 'offline',
    metadata?: Record<string, any>
  ): void {
    if (!this.config.enablePresence) return;

    const presence: UserPresence = {
      userId,
      status,
      lastSeen: new Date(),
      metadata: metadata || {}
    };

    this.presence.set(userId, presence);
  }

  private cleanupTypingIndicators(socket: AuthenticatedSocket): void {
    if (!socket.userId) return;

    for (const [roomId, typingUsers] of this.typingUsers.entries()) {
      if (typingUsers.has(socket.userId)) {
        typingUsers.delete(socket.userId);
        socket.to(roomId).emit('typing-stop', {
          roomId,
          userId: socket.userId,
          timestamp: new Date().toISOString()
        });

        if (typingUsers.size === 0) {
          this.typingUsers.delete(roomId);
        }
      }
    }
  }

  private startPresenceTracking(): void {
    if (!this.config.enableHeartbeat) return;

    setInterval(() => {
      // Send heartbeat to all connected clients
      this.io.emit('heartbeat', {
        timestamp: new Date().toISOString(),
        connectedClients: this.io.engine.clientsCount,
        activeRooms: this.roomManager.getStatistics().activeRooms
      });

      // Clean up offline presence
      const now = Date.now();
      const offlineThreshold = 5 * 60 * 1000; // 5 minutes

      for (const [userId, presence] of this.presence.entries()) {
        if (presence.status !== 'offline' &&
            (now - presence.lastSeen.getTime()) > offlineThreshold) {
          presence.status = 'offline';
          this.presence.set(userId, presence);
        }
      }
    }, this.config.heartbeatInterval);
  }

  // Placeholder handlers for features to be implemented
  private async handleShareFile(socket: AuthenticatedSocket, data: any): Promise<void> {
    if (!this.config.enableFileSharing) {
      socket.emit('file-share-error', { message: 'File sharing is disabled' });
      return;
    }
    // TODO: Implement file sharing
  }

  private async handleRequestFile(socket: AuthenticatedSocket, data: any): Promise<void> {
    // TODO: Implement file request
  }

  private async handleStartScreenShare(socket: AuthenticatedSocket, data: any): Promise<void> {
    if (!this.config.enableScreenShare) {
      socket.emit('screen-share-error', { message: 'Screen sharing is disabled' });
      return;
    }
    // TODO: Implement screen sharing
  }

  private async handleStopScreenShare(socket: AuthenticatedSocket, data: any): Promise<void> {
    // TODO: Implement screen sharing stop
  }

  private async handleJoinScreenShare(socket: AuthenticatedSocket, data: any): Promise<void> {
    // TODO: Implement screen sharing join
  }

  private async handleMarkNotificationRead(socket: AuthenticatedSocket, data: any): Promise<void> {
    // TODO: Implement notification marking
  }

  private async handleSubscribeNotifications(socket: AuthenticatedSocket, data: any): Promise<void> {
    // TODO: Implement notification subscription
  }

  private async handleUnsubscribeNotifications(socket: AuthenticatedSocket, data: any): Promise<void> {
    // TODO: Implement notification unsubscription
  }

  private async handleTrackEvent(socket: AuthenticatedSocket, data: any): Promise<void> {
    // TODO: Implement event tracking
  }

  private async handleGetAnalytics(socket: AuthenticatedSocket, data: any): Promise<void> {
    // TODO: Implement analytics retrieval
  }
}

// Interfaces
export interface UserPresence {
  userId: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: Date;
  metadata: Record<string, any>;
}

export default WebSocketHandlers;