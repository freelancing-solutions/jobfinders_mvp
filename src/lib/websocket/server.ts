// WebSocket Server Implementation
// Socket.IO server configuration and setup

import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { eventBus, EventType, EventPriority } from '../events';
import { WebSocketRateLimiter, memoryStore } from '../api/rate-limiter';

export interface WebSocketConfig {
  cors: {
    origin: string | string[];
    methods: string[];
    credentials: boolean;
  };
  transports: string[];
  pingTimeout: number;
  pingInterval: number;
  maxHttpBufferSize: number;
  allowEIO3: boolean;
  compression: boolean;
  perMessageDeflate: boolean;
}

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
  sessionId?: string;
  isAuthenticated: boolean;
}

export interface RoomInfo {
  id: string;
  name: string;
  type: 'user' | 'job' | 'application' | 'notification' | 'system';
  members: Set<string>;
  maxMembers?: number;
  isPrivate: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface ConnectionInfo {
  socketId: string;
  userId?: string;
  userRole?: string;
  sessionId?: string;
  ip: string;
  userAgent: string;
  connectedAt: Date;
  lastActivity: Date;
  rooms: Set<string>;
}

export class WebSocketServer {
  private io: SocketIOServer;
  private config: WebSocketConfig;
  private rooms = new Map<string, RoomInfo>();
  private connections = new Map<string, ConnectionInfo>();
  private rateLimiter: WebSocketRateLimiter;
  private heartbeatInterval: NodeJS.Timeout;

  constructor(server: HTTPServer, config?: Partial<WebSocketConfig>) {
    this.config = {
      cors: {
        origin: process.env.NODE_ENV === 'production'
          ? [process.env.NEXT_PUBLIC_APP_URL || ''].filter(Boolean)
          : ['http://localhost:3000', 'http://localhost:3010'],
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
      maxHttpBufferSize: 1e6, // 1MB
      allowEIO3: true,
      compression: true,
      perMessageDeflate: {
        threshold: 1024
      },
      ...config
    };

    this.io = new SocketIOServer(server, this.config);
    this.rateLimiter = new WebSocketRateLimiter(memoryStore, {
      windowMs: 60000, // 1 minute
      maxRequests: 100, // 100 connections per minute per IP
      message: 'Too many WebSocket connections, please try again later.'
    });

    this.setupEventHandlers();
    this.startHeartbeat();
    this.setupEventBusIntegration();
  }

  private setupEventHandlers(): void {
    this.io.use(this.authenticateSocket.bind(this));
    this.io.on('connection', this.handleConnection.bind(this));
  }

  private async authenticateSocket(
    socket: Socket,
    next: (err?: Error) => void
  ): Promise<void> {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      const userId = socket.handshake.auth.userId;
      const sessionId = socket.handshake.auth.sessionId;

      // Basic validation
      if (!token && !userId) {
        return next(new Error('Authentication required'));
      }

      const authSocket = socket as AuthenticatedSocket;
      authSocket.userId = userId;
      authSocket.sessionId = sessionId;
      authSocket.isAuthenticated = true;

      // Get user info from token if available
      if (token) {
        // In a real implementation, verify JWT token here
        try {
          // const decoded = jwt.verify(token, process.env.JWT_SECRET!);
          // authSocket.userId = decoded.userId;
          // authSocket.userRole = decoded.role;
        } catch (error) {
          console.warn('WebSocket authentication failed:', error);
        }
      }

      // Rate limiting check
      const ip = socket.handshake.address;
      const canConnect = await this.rateLimiter.checkConnectionLimit(ip);

      if (!canConnect) {
        return next(new Error('Rate limit exceeded'));
      }

      next();
    } catch (error) {
      console.error('WebSocket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  }

  private async handleConnection(socket: AuthenticatedSocket): Promise<void> {
    const connectionInfo: ConnectionInfo = {
      socketId: socket.id,
      userId: socket.userId,
      userRole: socket.userRole,
      sessionId: socket.sessionId,
      ip: socket.handshake.address,
      userAgent: socket.handshake.headers['user-agent'] || 'unknown',
      connectedAt: new Date(),
      lastActivity: new Date(),
      rooms: new Set()
    };

    this.connections.set(socket.id, connectionInfo);

    // Join user-specific room
    if (socket.userId) {
      await this.joinUserRoom(socket, socket.userId);
    }

    // Setup socket event handlers
    this.setupSocketEventHandlers(socket);

    // Send welcome message
    socket.emit('connected', {
      socketId: socket.id,
      userId: socket.userId,
      timestamp: new Date().toISOString(),
      features: {
        notifications: true,
        realTimeUpdates: true,
        messaging: true,
        presence: true
      }
    });

    // Publish connection event
    await eventBus.publish({
      id: `ws-connect-${socket.id}`,
      type: EventType.REAL_TIME_CONNECTION_ESTABLISHED,
      timestamp: new Date(),
      userId: socket.userId,
      priority: EventPriority.NORMAL,
      source: 'websocket-server',
      payload: {
        userId: socket.userId,
        sessionId: socket.sessionId,
        connectionId: socket.id,
        connectedAt: connectionInfo.connectedAt,
        userAgent: connectionInfo.userAgent,
        ip: connectionInfo.ip
      }
    });

    console.log(`WebSocket connected: ${socket.id} (User: ${socket.userId || 'anonymous'})');
  }

  private setupSocketEventHandlers(socket: AuthenticatedSocket): void {
    // Handle disconnection
    socket.on('disconnect', (reason, description) => {
      this.handleDisconnection(socket, reason, description);
    });

    // Handle room management
    socket.on('join-room', async (data) => {
      await this.handleJoinRoom(socket, data);
    });

    socket.on('leave-room', async (data) => {
      await this.handleLeaveRoom(socket, data);
    });

    socket.on('get-rooms', async () => {
      await this.handleGetRooms(socket);
    });

    // Handle real-time subscriptions
    socket.on('subscribe', async (data) => {
      await this.handleSubscribe(socket, data);
    });

    socket.on('unsubscribe', async (data) => {
      await this.handleUnsubscribe(socket, data);
    });

    // Handle presence
    socket.on('ping', () => {
      this.updateLastActivity(socket.id);
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`WebSocket error for socket ${socket.id}:`, error);
    });

    // Handle typing indicators
    socket.on('typing-start', (data) => {
      this.handleTypingStart(socket, data);
    });

    socket.on('typing-stop', (data) => {
      this.handleTypingStop(socket, data);
    });
  }

  private async handleDisconnection(
    socket: AuthenticatedSocket,
    reason: string,
    description?: string
  ): Promise<void> {
    const connectionInfo = this.connections.get(socket.id);
    if (!connectionInfo) return;

    // Leave all rooms
    for (const roomId of connectionInfo.rooms) {
      await this.leaveRoom(socket, roomId);
    }

    // Remove connection
    this.connections.delete(socket.id);

    // Update rate limiter
    await this.rateLimiter.removeConnection(connectionInfo.ip);

    // Publish disconnection event
    await eventBus.publish({
      id: `ws-disconnect-${socket.id}`,
      type: EventType.REAL_TIME_CONNECTION_LOST,
      timestamp: new Date(),
      userId: socket.userId,
      priority: EventPriority.NORMAL,
      source: 'websocket-server',
      payload: {
        userId: socket.userId,
        sessionId: socket.sessionId,
        connectionId: socket.id,
        reason,
        description,
        disconnectedAt: new Date(),
        duration: new Date().getTime() - connectionInfo.connectedAt.getTime()
      }
    });

    console.log(`WebSocket disconnected: ${socket.id} (${reason})`);
  }

  private async handleJoinRoom(
    socket: AuthenticatedSocket,
    data: { roomId: string; password?: string }
  ): Promise<void> {
    try {
      const { roomId, password } = data;
      const room = this.rooms.get(roomId);

      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      // Check if room is private and requires password
      if (room.isPrivate && room.metadata?.password !== password) {
        socket.emit('error', { message: 'Invalid password or room is private' });
        return;
      }

      // Check max members limit
      if (room.maxMembers && room.members.size >= room.maxMembers) {
        socket.emit('error', { message: 'Room is full' });
        return;
      }

      // Join room
      await socket.join(roomId);
      room.members.add(socket.id);

      const connectionInfo = this.connections.get(socket.id);
      if (connectionInfo) {
        connectionInfo.rooms.add(roomId);
      }

      socket.emit('room-joined', {
        roomId,
        roomName: room.name,
        memberCount: room.members.size
      });

      // Notify other members
      socket.to(roomId).emit('member-joined', {
        roomId,
        memberInfo: {
          socketId: socket.id,
          userId: socket.userId,
          joinedAt: new Date().toISOString()
        }
      });

      console.log(`Socket ${socket.id} joined room ${roomId}`);
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  }

  private async handleLeaveRoom(
    socket: AuthenticatedSocket,
    data: { roomId: string }
  ): Promise<void> {
    try {
      const { roomId } = data;
      await this.leaveRoom(socket, roomId);

      socket.emit('room-left', { roomId });
    } catch (error) {
      console.error('Error leaving room:', error);
      socket.emit('error', { message: 'Failed to leave room' });
    }
  }

  private async leaveRoom(socket: AuthenticatedSocket, roomId: string): Promise<void> {
    const room = this.rooms.get(roomId);
    if (room) {
      room.members.delete(socket.id);
      await socket.leave(roomId);

      const connectionInfo = this.connections.get(socket.id);
      if (connectionInfo) {
        connectionInfo.rooms.delete(roomId);
      }

      // Notify other members
      socket.to(roomId).emit('member-left', {
        roomId,
        memberInfo: {
          socketId: socket.id,
          userId: socket.userId,
          leftAt: new Date().toISOString()
        }
      });

      // Remove empty rooms (except system rooms)
      if (room.members.size === 0 && !room.name.startsWith('system:')) {
        this.rooms.delete(roomId);
      }

      console.log(`Socket ${socket.id} left room ${roomId}`);
    }
  }

  private async handleGetRooms(socket: AuthenticatedSocket): Promise<void> {
    const connectionInfo = this.connections.get(socket.id);
    if (!connectionInfo) return;

    const userRooms = Array.from(connectionInfo.rooms).map(roomId => {
      const room = this.rooms.get(roomId);
      return room ? {
        id: room.id,
        name: room.name,
        type: room.type,
        memberCount: room.members.size,
        isPrivate: room.isPrivate
      } : null;
    }).filter(Boolean);

    socket.emit('rooms-list', userRooms);
  }

  private async handleSubscribe(
    socket: AuthenticatedSocket,
    data: { eventTypes: string[]; filters?: Record<string, any> }
  ): Promise<void> {
    try {
      const { eventTypes, filters } = data;

      // Join user-specific subscription room
      const subscriptionRoom = `subscriptions:${socket.userId}`;
      await socket.join(subscriptionRoom);

      socket.emit('subscribed', {
        eventTypes,
        filters,
        timestamp: new Date().toISOString()
      });

      console.log(`Socket ${socket.id} subscribed to events: ${eventTypes.join(', ')}`);
    } catch (error) {
      console.error('Error subscribing to events:', error);
      socket.emit('error', { message: 'Failed to subscribe to events' });
    }
  }

  private async handleUnsubscribe(
    socket: AuthenticatedSocket,
    data: { eventTypes?: string[] }
  ): Promise<void> {
    try {
      const { eventTypes } = data;

      const subscriptionRoom = `subscriptions:${socket.userId}`;
      await socket.leave(subscriptionRoom);

      socket.emit('unsubscribed', {
        eventTypes,
        timestamp: new Date().toISOString()
      });

      console.log(`Socket ${socket.id} unsubscribed from events`);
    } catch (error) {
      console.error('Error unsubscribing from events:', error);
      socket.emit('error', { message: 'Failed to unsubscribe from events' });
    }
  }

  private handleTypingStart(socket: AuthenticatedSocket, data: { roomId: string; type: string }): void {
    const { roomId, type } = data;

    socket.to(roomId).emit('typing-start', {
      userId: socket.userId,
      socketId: socket.id,
      type,
      timestamp: new Date().toISOString()
    });
  }

  private handleTypingStop(socket: AuthenticatedSocket, data: { roomId: string }): void {
    const { roomId } = data;

    socket.to(roomId).emit('typing-stop', {
      userId: socket.userId,
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });
  }

  private async joinUserRoom(socket: AuthenticatedSocket, userId: string): Promise<void> {
    const roomId = `user:${userId}`;

    // Create user room if it doesn't exist
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        id: roomId,
        name: `User Room: ${userId}`,
        type: 'user',
        members: new Set(),
        isPrivate: true,
        createdAt: new Date(),
        metadata: { userId }
      });
    }

    await socket.join(roomId);
    const room = this.rooms.get(roomId)!;
    room.members.add(socket.id);

    const connectionInfo = this.connections.get(socket.id);
    if (connectionInfo) {
      connectionInfo.rooms.add(roomId);
    }
  }

  private updateLastActivity(socketId: string): void {
    const connectionInfo = this.connections.get(socketId);
    if (connectionInfo) {
      connectionInfo.lastActivity = new Date();
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.io.emit('heartbeat', {
        timestamp: new Date().toISOString(),
        connectedClients: this.connections.size,
        activeRooms: this.rooms.size
      });
    }, 30000); // Every 30 seconds
  }

  private setupEventBusIntegration(): void {
    // Subscribe to relevant events for real-time broadcasting
    eventBus.subscribeMultiple([
      EventType.NOTIFICATION_CREATED,
      EventType.NOTIFICATION_SENT,
      EventType.MATCH_CREATED,
      EventType.APPLICATION_SUBMITTED,
      EventType.RECOMMENDATION_GENERATED,
      EventType.REAL_TIME_DATA_UPDATED
    ], async (event) => {
      await this.broadcastEvent(event);
    });
  }

  private async broadcastEvent(event: any): Promise<void> {
    try {
      const { userId, type, payload } = event;

      // Send to specific user if userId is present
      if (userId) {
        this.io.to(`user:${userId}`).emit('event', {
          type,
          payload,
          timestamp: new Date().toISOString()
        });
      }

      // Send to subscribers
      this.io.to('subscriptions:*').emit('event', {
        type,
        payload,
        timestamp: new Date().toISOString()
      });

      // Send to relevant rooms based on event type
      const targetRooms = this.getEventTargetRooms(event);
      for (const roomId of targetRooms) {
        this.io.to(roomId).emit('event', {
          type,
          payload,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error broadcasting event:', error);
    }
  }

  private getEventTargetRooms(event: any): string[] {
    const rooms: string[] = [];
    const { type, payload } = event;

    switch (type) {
      case EventType.APPLICATION_SUBMITTED:
        if (payload.jobId) {
          rooms.push(`job:${payload.jobId}`);
        }
        break;

      case EventType.MATCH_CREATED:
        if (payload.jobId) {
          rooms.push(`job:${payload.jobId}`);
        }
        if (payload.candidateId) {
          rooms.push(`user:${payload.candidateId}`);
        }
        break;

      case EventType.NOTIFICATION_CREATED:
        if (payload.userId) {
          rooms.push(`user:${payload.userId}`);
        }
        break;

      case EventType.RECOMMENDATION_GENERATED:
        if (payload.userId) {
          rooms.push(`user:${payload.userId}`);
        }
        break;
    }

    return rooms;
  }

  // Public API methods
  getServer(): SocketIOServer {
    return this.io;
  }

  getConnections(): Map<string, ConnectionInfo> {
    return new Map(this.connections);
  }

  getRooms(): Map<string, RoomInfo> {
    return new Map(this.rooms);
  }

  getConnectionCount(): number {
    return this.connections.size;
  }

  getRoomCount(): number {
    return this.rooms.size;
  }

  async sendToUser(userId: string, event: string, data: any): Promise<void> {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  async sendToRoom(roomId: string, event: string, data: any): Promise<void> {
    this.io.to(roomId).emit(event, data);
  }

  async broadcast(event: string, data: any): Promise<void> {
    this.io.emit(event, data);
  }

  async shutdown(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Disconnect all clients
    this.io.disconnectSockets(true);

    console.log('WebSocket server shutdown complete');
  }
}

// Singleton instance
let wsServer: WebSocketServer | null = null;

export function initializeWebSocket(server: HTTPServer): WebSocketServer {
  if (!wsServer) {
    wsServer = new WebSocketServer(server);
    console.log('WebSocket server initialized');
  }
  return wsServer;
}

export function getWebSocketServer(): WebSocketServer | null {
  return wsServer;
}

export default WebSocketServer;