// WebSocket Room Management System
// Advanced room management for real-time collaboration

import { EventEmitter } from 'events';
import { AuthenticatedSocket } from './server';

export interface RoomConfig {
  id: string;
  name: string;
  type: RoomType;
  isPrivate: boolean;
  isTemporary: boolean;
  maxMembers?: number;
  requiresInvite: boolean;
  password?: string;
  metadata?: Record<string, any>;
  permissions?: RoomPermissions;
  settings?: RoomSettings;
}

export enum RoomType {
  USER = 'user',
  JOB = 'job',
  APPLICATION = 'application',
  NOTIFICATION = 'notification',
  SYSTEM = 'system',
  CHAT = 'chat',
  COLLABORATION = 'collaboration',
  INTERVIEW = 'interview',
  SUPPORT = 'support'
}

export interface RoomPermissions {
  canJoin: string[]; // User roles that can join
  canSpeak: string[]; // User roles that can send messages
  canModerate: string[]; // User roles that can moderate
  canInvite: string[]; // User roles that can invite others
  canKick: string[]; // User roles that can kick members
}

export interface RoomSettings {
  allowAnonymous: boolean;
  persistMessages: boolean;
  messageHistoryLimit: number;
  enableFileSharing: boolean;
  enableScreenShare: boolean;
  enableVideoCall: boolean;
  autoCleanup: boolean;
  cleanupDelay: number; // milliseconds
}

export interface RoomMember {
  socketId: string;
  userId?: string;
  role: string;
  joinedAt: Date;
  lastActivity: Date;
  isOnline: boolean;
  permissions: MemberPermissions;
  metadata?: Record<string, any>;
}

export interface MemberPermissions {
  canSpeak: boolean;
  canModerate: boolean;
  canInvite: boolean;
  canKick: boolean;
  canShareFiles: boolean;
  canScreenShare: boolean;
}

export interface RoomMessage {
  id: string;
  roomId: string;
  userId?: string;
  type: MessageType;
  content: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  editedAt?: Date;
  replyTo?: string;
  reactions: MessageReaction[];
  isDeleted: boolean;
}

export enum MessageType {
  TEXT = 'text',
  SYSTEM = 'system',
  FILE = 'file',
  IMAGE = 'image',
  TYPING = 'typing',
  PRESENCE = 'presence',
  NOTIFICATION = 'notification',
  CALL = 'call'
}

export interface MessageReaction {
  emoji: string;
  userId: string;
  timestamp: Date;
}

export interface RoomActivity {
  id: string;
  roomId: string;
  type: ActivityType;
  userId?: string;
  data: Record<string, any>;
  timestamp: Date;
}

export enum ActivityType {
  MEMBER_JOINED = 'member_joined',
  MEMBER_LEFT = 'member_left',
  MESSAGE_SENT = 'message_sent',
  FILE_SHARED = 'file_shared',
  CALL_STARTED = 'call_started',
  CALL_ENDED = 'call_ended',
  ROLE_CHANGED = 'role_changed',
  ROOM_CREATED = 'room_created',
  ROOM_DELETED = 'room_deleted'
}

export class RoomManager extends EventEmitter {
  private rooms = new Map<string, Room>();
  private roomMembers = new Map<string, Map<string, RoomMember>>();
  private roomMessages = new Map<string, RoomMessage[]>();
  private roomActivities = new Map<string, RoomActivity[]>();
  private userRooms = new Map<string, Set<string>>(); // userId -> roomIds
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    super();
    this.startCleanupTimer();
  }

  // Room Management
  async createRoom(config: RoomConfig): Promise<Room> {
    const room: Room = {
      id: config.id,
      name: config.name,
      type: config.type,
      isPrivate: config.isPrivate,
      isTemporary: config.isTemporary,
      maxMembers: config.maxMembers,
      requiresInvite: config.requiresInvite,
      password: config.password,
      metadata: config.metadata || {},
      permissions: config.permissions || this.getDefaultPermissions(config.type),
      settings: config.settings || this.getDefaultSettings(config.type),
      members: new Map(),
      createdAt: new Date(),
      createdBy: config.metadata?.createdBy,
      lastActivity: new Date(),
      isActive: true,
      messageCount: 0
    };

    this.rooms.set(config.id, room);
    this.roomMembers.set(config.id, new Map());
    this.roomMessages.set(config.id, []);
    this.roomActivities.set(config.id, []);

    this.emit('roomCreated', room);

    // Log activity
    await this.logActivity(config.id, ActivityType.ROOM_CREATED, {
      roomName: config.name,
      roomType: config.type,
      createdBy: config.metadata?.createdBy
    });

    return room;
  }

  async deleteRoom(roomId: string, deletedBy?: string): Promise<boolean> {
    const room = this.rooms.get(roomId);
    if (!room) {
      return false;
    }

    // Remove all members
    const members = Array.from(this.roomMembers.get(roomId)?.values() || []);
    for (const member of members) {
      await this.removeMember(roomId, member.socketId, 'Room deleted');
    }

    // Clean up data
    this.rooms.delete(roomId);
    this.roomMembers.delete(roomId);
    this.roomMessages.delete(roomId);
    this.roomActivities.delete(roomId);

    // Remove from user rooms mapping
    for (const [userId, userRoomSet] of this.userRooms.entries()) {
      userRoomSet.delete(roomId);
      if (userRoomSet.size === 0) {
        this.userRooms.delete(userId);
      }
    }

    this.emit('roomDeleted', { roomId, deletedBy });

    return true;
  }

  getRoom(roomId: string): Room | null {
    return this.rooms.get(roomId) || null;
  }

  getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  getRoomsByType(type: RoomType): Room[] {
    return Array.from(this.rooms.values()).filter(room => room.type === type);
  }

  getRoomsByUser(userId: string): Room[] {
    const roomIds = this.userRooms.get(userId);
    if (!roomIds) {
      return [];
    }

    return Array.from(roomIds)
      .map(roomId => this.rooms.get(roomId))
      .filter(Boolean) as Room[];
  }

  // Member Management
  async addMember(roomId: string, socket: AuthenticatedSocket, invitedBy?: string): Promise<RoomMember> {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    // Check if room is full
    if (room.maxMembers && room.members.size >= room.maxMembers) {
      throw new Error('Room is full');
    }

    // Check permissions
    if (!this.canJoinRoom(socket, room)) {
      throw new Error('Permission denied');
    }

    const member: RoomMember = {
      socketId: socket.id,
      userId: socket.userId,
      role: socket.userRole || 'user',
      joinedAt: new Date(),
      lastActivity: new Date(),
      isOnline: true,
      permissions: this.getMemberPermissions(socket, room),
      metadata: {
        userAgent: socket.handshake.headers['user-agent'],
        ip: socket.handshake.address
      }
    };

    // Add to room
    room.members.set(socket.id, member);
    room.lastActivity = new Date();

    const membersMap = this.roomMembers.get(roomId)!;
    membersMap.set(socket.id, member);

    // Update user rooms mapping
    if (socket.userId) {
      if (!this.userRooms.has(socket.userId)) {
        this.userRooms.set(socket.userId, new Set());
      }
      this.userRooms.get(socket.userId)!.add(roomId);
    }

    this.emit('memberJoined', { roomId, member, invitedBy });

    // Log activity
    await this.logActivity(roomId, ActivityType.MEMBER_JOINED, {
      userId: socket.userId,
      socketId: socket.id,
      invitedBy
    });

    return member;
  }

  async removeMember(roomId: string, socketId: string, reason?: string): Promise<boolean> {
    const room = this.rooms.get(roomId);
    if (!room) {
      return false;
    }

    const member = room.members.get(socketId);
    if (!member) {
      return false;
    }

    // Remove from room
    room.members.delete(socketId);
    const membersMap = this.roomMembers.get(roomId)!;
    membersMap.delete(socketId);

    // Update user rooms mapping
    if (member.userId) {
      const userRoomSet = this.userRooms.get(member.userId);
      if (userRoomSet) {
        userRoomSet.delete(roomId);
        if (userRoomSet.size === 0) {
          this.userRooms.delete(member.userId);
        }
      }
    }

    // Update last activity
    room.lastActivity = new Date();

    // Check if room should be deleted (temporary rooms)
    if (room.isTemporary && room.members.size === 0) {
      setTimeout(() => {
        if (room.members.size === 0) {
          this.deleteRoom(roomId);
        }
      }, room.settings.cleanupDelay);
    }

    this.emit('memberLeft', { roomId, member, reason });

    // Log activity
    await this.logActivity(roomId, ActivityType.MEMBER_LEFT, {
      userId: member.userId,
      socketId,
      reason
    });

    return true;
  }

  getRoomMembers(roomId: string): RoomMember[] {
    const membersMap = this.roomMembers.get(roomId);
    return membersMap ? Array.from(membersMap.values()) : [];
  }

  getMember(roomId: string, socketId: string): RoomMember | null {
    const membersMap = this.roomMembers.get(roomId);
    return membersMap ? membersMap.get(socketId) || null : null;
  }

  async updateMemberRole(roomId: string, socketId: string, newRole: string, updatedBy?: string): Promise<boolean> {
    const room = this.rooms.get(roomId);
    if (!room) {
      return false;
    }

    const member = room.members.get(socketId);
    if (!member) {
      return false;
    }

    const oldRole = member.role;
    member.role = newRole;
    member.permissions = this.getMemberPermissions({ userRole: newRole } as AuthenticatedSocket, room);

    this.emit('memberRoleChanged', { roomId, member, oldRole, updatedBy });

    // Log activity
    await this.logActivity(roomId, ActivityType.ROLE_CHANGED, {
      userId: member.userId,
      socketId,
      oldRole,
      newRole,
      updatedBy
    });

    return true;
  }

  // Message Management
  async addMessage(roomId: string, message: Omit<RoomMessage, 'id' | 'timestamp'>): Promise<RoomMessage> {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    const fullMessage: RoomMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      roomId,
      userId: message.userId,
      type: message.type,
      content: message.content,
      metadata: message.metadata,
      timestamp: new Date(),
      replyTo: message.replyTo,
      reactions: [],
      isDeleted: false
    };

    const messages = this.roomMessages.get(roomId)!;
    messages.push(fullMessage);

    // Limit message history
    if (messages.length > room.settings.messageHistoryLimit) {
      messages.splice(0, messages.length - room.settings.messageHistoryLimit);
    }

    room.messageCount++;
    room.lastActivity = new Date();

    this.emit('messageAdded', { roomId, message: fullMessage });

    // Log activity
    await this.logActivity(roomId, ActivityType.MESSAGE_SENT, {
      messageId: fullMessage.id,
      userId: message.userId,
      messageType: message.type
    });

    return fullMessage;
  }

  getRoomMessages(roomId: string, limit = 50, offset = 0): RoomMessage[] {
    const messages = this.roomMessages.get(roomId) || [];
    return messages
      .filter(msg => !msg.isDeleted)
      .slice(-limit - offset)
      .slice(0, limit);
  }

  async updateMessage(roomId: string, messageId: string, content: string, editedBy: string): Promise<boolean> {
    const messages = this.roomMessages.get(roomId);
    if (!messages) {
      return false;
    }

    const message = messages.find(msg => msg.id === messageId);
    if (!message || message.isDeleted) {
      return false;
    }

    if (message.userId !== editedBy) {
      throw new Error('Permission denied');
    }

    message.content = content;
    message.editedAt = new Date();

    this.emit('messageUpdated', { roomId, message });

    return true;
  }

  async deleteMessage(roomId: string, messageId: string, deletedBy: string): Promise<boolean> {
    const messages = this.roomMessages.get(roomId);
    if (!messages) {
      return false;
    }

    const message = messages.find(msg => msg.id === messageId);
    if (!message || message.isDeleted) {
      return false;
    }

    const room = this.rooms.get(roomId)!;
    const member = room.members.get(deletedBy);

    // Check if user can delete message (own message or moderator)
    if (message.userId !== deletedBy && (!member || !member.permissions.canModerate)) {
      throw new Error('Permission denied');
    }

    message.isDeleted = true;

    this.emit('messageDeleted', { roomId, messageId, deletedBy });

    return true;
  }

  async addReaction(roomId: string, messageId: string, emoji: string, userId: string): Promise<boolean> {
    const messages = this.roomMessages.get(roomId);
    if (!messages) {
      return false;
    }

    const message = messages.find(msg => msg.id === messageId);
    if (!message || message.isDeleted) {
      return false;
    }

    // Check if reaction already exists
    const existingReaction = message.reactions.find(r => r.emoji === emoji && r.userId === userId);
    if (existingReaction) {
      // Remove reaction
      message.reactions = message.reactions.filter(r => !(r.emoji === emoji && r.userId === userId));
    } else {
      // Add reaction
      message.reactions.push({
        emoji,
        userId,
        timestamp: new Date()
      });
    }

    this.emit('messageReactionUpdated', { roomId, messageId, reactions: message.reactions });

    return true;
  }

  // Activity Tracking
  async logActivity(roomId: string, type: ActivityType, data: Record<string, any>): Promise<void> {
    const activity: RoomActivity = {
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      roomId,
      type,
      userId: data.userId,
      data,
      timestamp: new Date()
    };

    const activities = this.roomActivities.get(roomId)!;
    activities.push(activity);

    // Limit activity history
    if (activities.length > 1000) {
      activities.splice(0, activities.length - 1000);
    }

    this.emit('activityLogged', { roomId, activity });
  }

  getRoomActivities(roomId: string, limit = 100): RoomActivity[] {
    const activities = this.roomActivities.get(roomId) || [];
    return activities.slice(-limit);
  }

  // Permission Management
  private canJoinRoom(socket: AuthenticatedSocket, room: Room): boolean {
    // Check if anonymous users are allowed
    if (!socket.userId && !room.settings.allowAnonymous) {
      return false;
    }

    // Check if user role is allowed
    if (socket.userRole && !room.permissions.canJoin.includes(socket.userRole)) {
      return false;
    }

    // Check private room requirements
    if (room.isPrivate && room.requiresInvite) {
      // In a real implementation, check if user is invited
      return false;
    }

    return true;
  }

  private getMemberPermissions(socket: AuthenticatedSocket, room: Room): MemberPermissions {
    const userRole = socket.userRole || 'user';

    return {
      canSpeak: room.permissions.canSpeak.includes(userRole),
      canModerate: room.permissions.canModerate.includes(userRole),
      canInvite: room.permissions.canInvite.includes(userRole),
      canKick: room.permissions.canKick.includes(userRole),
      canShareFiles: room.settings.enableFileSharing,
      canScreenShare: room.settings.enableScreenShare
    };
  }

  private getDefaultPermissions(type: RoomType): RoomPermissions {
    const allRoles = ['admin', 'employer', 'seeker', 'user'];

    switch (type) {
      case RoomType.USER:
        return {
          canJoin: allRoles,
          canSpeak: allRoles,
          canModerate: ['admin'],
          canInvite: ['admin'],
          canKick: ['admin']
        };

      case RoomType.JOB:
        return {
          canJoin: allRoles,
          canSpeak: allRoles,
          canModerate: ['admin', 'employer'],
          canInvite: ['admin', 'employer'],
          canKick: ['admin', 'employer']
        };

      case RoomType.APPLICATION:
        return {
          canJoin: ['admin', 'employer', 'seeker'],
          canSpeak: ['admin', 'employer'],
          canModerate: ['admin', 'employer'],
          canInvite: ['admin', 'employer'],
          canKick: ['admin', 'employer']
        };

      case RoomType.SYSTEM:
        return {
          canJoin: ['admin'],
          canSpeak: ['admin'],
          canModerate: ['admin'],
          canInvite: ['admin'],
          canKick: ['admin']
        };

      default:
        return {
          canJoin: allRoles,
          canSpeak: allRoles,
          canModerate: ['admin'],
          canInvite: ['admin', 'employer'],
          canKick: ['admin']
        };
    }
  }

  private getDefaultSettings(type: RoomType): RoomSettings {
    switch (type) {
      case RoomType.USER:
        return {
          allowAnonymous: false,
          persistMessages: true,
          messageHistoryLimit: 100,
          enableFileSharing: true,
          enableScreenShare: false,
          enableVideoCall: false,
          autoCleanup: false,
          cleanupDelay: 60000 // 1 minute
        };

      case RoomType.SYSTEM:
        return {
          allowAnonymous: false,
          persistMessages: true,
          messageHistoryLimit: 1000,
          enableFileSharing: false,
          enableScreenShare: false,
          enableVideoCall: false,
          autoCleanup: false,
          cleanupDelay: 0
        };

      default:
        return {
          allowAnonymous: false,
          persistMessages: true,
          messageHistoryLimit: 500,
          enableFileSharing: true,
          enableScreenShare: true,
          enableVideoCall: true,
          autoCleanup: true,
          cleanupDelay: 300000 // 5 minutes
        };
    }
  }

  // Cleanup and Maintenance
  private startCleanupTimer(): void {
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, 60000); // Every minute
  }

  private async performCleanup(): Promise<void> {
    const now = Date.now();

    for (const [roomId, room] of this.rooms.entries()) {
      // Clean up inactive temporary rooms
      if (room.isTemporary && room.members.size === 0) {
        const timeSinceLastActivity = now - room.lastActivity.getTime();
        if (timeSinceLastActivity > room.settings.cleanupDelay) {
          this.deleteRoom(roomId);
        }
      }

      // Clean up old activities
      const activities = this.roomActivities.get(roomId);
      if (activities && activities.length > 1000) {
        activities.splice(0, activities.length - 1000);
      }
    }
  }

  // Statistics
  getStatistics(): {
    totalRooms: number;
    activeRooms: number;
    totalMembers: number;
    totalMessages: number;
    roomsByType: Record<RoomType, number>;
  } {
    const rooms = Array.from(this.rooms.values());
    const roomsByType = rooms.reduce((acc, room) => {
      acc[room.type] = (acc[room.type] || 0) + 1;
      return acc;
    }, {} as Record<RoomType, number>);

    const totalMembers = rooms.reduce((sum, room) => sum + room.members.size, 0);
    const totalMessages = rooms.reduce((sum, room) => sum + room.messageCount, 0);
    const activeRooms = rooms.filter(room => room.isActive && room.members.size > 0).length;

    return {
      totalRooms: rooms.length,
      activeRooms,
      totalMembers,
      totalMessages,
      roomsByType
    };
  }

  async shutdown(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Clean up all rooms
    for (const roomId of this.rooms.keys()) {
      await this.deleteRoom(roomId);
    }

    this.removeAllListeners();
  }
}

// Enhanced Room interface
export interface Room {
  id: string;
  name: string;
  type: RoomType;
  isPrivate: boolean;
  isTemporary: boolean;
  maxMembers?: number;
  requiresInvite: boolean;
  password?: string;
  metadata: Record<string, any>;
  permissions: RoomPermissions;
  settings: RoomSettings;
  members: Map<string, RoomMember>;
  createdAt: Date;
  createdBy?: string;
  lastActivity: Date;
  isActive: boolean;
  messageCount: number;
}

// Export singleton instance
export const roomManager = new RoomManager();

export default RoomManager;