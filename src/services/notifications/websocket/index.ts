import { Server as SocketIOServer, Socket } from 'socket.io'
import { PrismaClient } from '@prisma/client'
import { InAppChannelService } from '../channels/in-app-channel'
import jwt from 'jsonwebtoken'

interface AuthenticatedSocket extends Socket {
  userId?: string
  user?: {
    id: string
    email: string
    name: string
  }
}

/**
 * Setup WebSocket handlers for real-time notifications
 */
export function setupWebSocketHandlers(
  io: SocketIOServer,
  inAppChannel: InAppChannelService,
  prisma: PrismaClient
): void {
  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '')
      
      if (!token) {
        return next(new Error('Authentication token required'))
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
      
      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
        },
      })

      if (!user) {
        return next(new Error('User not found'))
      }

      socket.userId = user.id
      socket.user = user
      next()
    } catch (error) {
      console.error('WebSocket authentication error:', error)
      next(new Error('Authentication failed'))
    }
  })

  // Connection handler
  io.on('connection', async (socket: AuthenticatedSocket) => {
    const userId = socket.userId!
    const user = socket.user!
    
    console.log(`User ${user.email} connected via WebSocket`)

    try {
      // Join user-specific room
      await socket.join(`user:${userId}`)
      
      // Register connection with in-app channel
      await inAppChannel.handleUserConnection(userId, socket.id)
      
      // Send connection confirmation
      socket.emit('connected', {
        message: 'Connected to notification service',
        userId,
        timestamp: new Date().toISOString(),
      })

      // Get unread notification count
      const unreadCount = await prisma.notification.count({
        where: {
          userId,
          readAt: null,
          channels: {
            has: 'inApp',
          },
        },
      })

      socket.emit('unread_count', { count: unreadCount })

      // Handle notification acknowledgment
      socket.on('notification_read', async (data: { notificationId: string }) => {
        try {
          await prisma.notification.update({
            where: {
              id: data.notificationId,
              userId,
            },
            data: {
              readAt: new Date(),
            },
          })

          // Update unread count
          const newUnreadCount = await prisma.notification.count({
            where: {
              userId,
              readAt: null,
              channels: {
                has: 'inApp',
              },
            },
          })

          socket.emit('unread_count', { count: newUnreadCount })
          
          console.log(`Notification ${data.notificationId} marked as read by user ${userId}`)
        } catch (error) {
          console.error('Error marking notification as read:', error)
          socket.emit('error', { message: 'Failed to mark notification as read' })
        }
      })

      // Handle notification click
      socket.on('notification_clicked', async (data: { notificationId: string }) => {
        try {
          await prisma.notification.update({
            where: {
              id: data.notificationId,
              userId,
            },
            data: {
              clickedAt: new Date(),
              readAt: new Date(), // Also mark as read when clicked
            },
          })

          // Track click event
          await inAppChannel['analyticsEngine'].trackEvent({
            type: 'notification_clicked',
            userId,
            notificationId: data.notificationId,
            channel: 'inApp',
            timestamp: new Date(),
            metadata: {
              socketId: socket.id,
            },
          })

          console.log(`Notification ${data.notificationId} clicked by user ${userId}`)
        } catch (error) {
          console.error('Error handling notification click:', error)
          socket.emit('error', { message: 'Failed to handle notification click' })
        }
      })

      // Handle mark all as read
      socket.on('mark_all_read', async () => {
        try {
          await prisma.notification.updateMany({
            where: {
              userId,
              readAt: null,
              channels: {
                has: 'inApp',
              },
            },
            data: {
              readAt: new Date(),
            },
          })

          socket.emit('unread_count', { count: 0 })
          socket.emit('all_marked_read', { timestamp: new Date().toISOString() })
          
          console.log(`All notifications marked as read for user ${userId}`)
        } catch (error) {
          console.error('Error marking all notifications as read:', error)
          socket.emit('error', { message: 'Failed to mark all notifications as read' })
        }
      })

      // Handle get notifications
      socket.on('get_notifications', async (data: { 
        page?: number
        limit?: number
        unreadOnly?: boolean 
      }) => {
        try {
          const page = data.page || 1
          const limit = Math.min(data.limit || 20, 50) // Max 50 per request
          const skip = (page - 1) * limit

          const where: any = {
            userId,
            channels: {
              has: 'inApp',
            },
          }

          if (data.unreadOnly) {
            where.readAt = null
          }

          const [notifications, total] = await Promise.all([
            prisma.notification.findMany({
              where,
              orderBy: { createdAt: 'desc' },
              skip,
              take: limit,
              select: {
                id: true,
                type: true,
                template: true,
                data: true,
                createdAt: true,
                readAt: true,
                clickedAt: true,
              },
            }),
            prisma.notification.count({ where }),
          ])

          socket.emit('notifications', {
            notifications,
            pagination: {
              page,
              limit,
              total,
              pages: Math.ceil(total / limit),
            },
          })
        } catch (error) {
          console.error('Error getting notifications:', error)
          socket.emit('error', { message: 'Failed to get notifications' })
        }
      })

      // Handle subscription to notification types
      socket.on('subscribe', (data: { types: string[] }) => {
        try {
          const validTypes = ['email', 'sms', 'push', 'inApp', 'system']
          const types = data.types.filter(type => validTypes.includes(type))
          
          // Join type-specific rooms
          types.forEach(type => {
            socket.join(`type:${type}`)
          })

          socket.emit('subscribed', { types })
          console.log(`User ${userId} subscribed to notification types: ${types.join(', ')}`)
        } catch (error) {
          console.error('Error handling subscription:', error)
          socket.emit('error', { message: 'Failed to subscribe to notification types' })
        }
      })

      // Handle unsubscription
      socket.on('unsubscribe', (data: { types: string[] }) => {
        try {
          data.types.forEach(type => {
            socket.leave(`type:${type}`)
          })

          socket.emit('unsubscribed', { types: data.types })
          console.log(`User ${userId} unsubscribed from notification types: ${data.types.join(', ')}`)
        } catch (error) {
          console.error('Error handling unsubscription:', error)
          socket.emit('error', { message: 'Failed to unsubscribe from notification types' })
        }
      })

      // Handle ping/pong for connection health
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: new Date().toISOString() })
      })

      // Handle disconnection
      socket.on('disconnect', async (reason) => {
        console.log(`User ${user.email} disconnected: ${reason}`)
        
        try {
          // Unregister connection
          await inAppChannel.handleUserDisconnection(userId, socket.id)
        } catch (error) {
          console.error('Error handling user disconnection:', error)
        }
      })

      // Handle connection errors
      socket.on('error', (error) => {
        console.error(`WebSocket error for user ${userId}:`, error)
      })

    } catch (error) {
      console.error('Error setting up WebSocket connection:', error)
      socket.emit('error', { message: 'Failed to initialize connection' })
      socket.disconnect()
    }
  })

  // Handle connection errors
  io.on('connect_error', (error) => {
    console.error('WebSocket connection error:', error)
  })

  console.log('✅ WebSocket handlers initialized')
}

/**
 * Send notification to specific user via WebSocket
 */
export async function sendNotificationToUser(
  io: SocketIOServer,
  userId: string,
  notification: {
    id: string
    type: string
    template: string
    data: any
    createdAt: Date
  }
): Promise<void> {
  try {
    // Send to user-specific room
    io.to(`user:${userId}`).emit('notification', {
      id: notification.id,
      type: notification.type,
      template: notification.template,
      data: notification.data,
      timestamp: notification.createdAt.toISOString(),
    })

    // Also send to type-specific room if user is subscribed
    io.to(`type:${notification.type}`).emit('notification', {
      id: notification.id,
      type: notification.type,
      template: notification.template,
      data: notification.data,
      timestamp: notification.createdAt.toISOString(),
      userId, // Include userId for type-based subscriptions
    })

    console.log(`Notification ${notification.id} sent to user ${userId} via WebSocket`)
  } catch (error) {
    console.error('Error sending notification via WebSocket:', error)
    throw error
  }
}

/**
 * Broadcast system notification to all connected users
 */
export async function broadcastSystemNotification(
  io: SocketIOServer,
  notification: {
    type: string
    message: string
    data?: any
  }
): Promise<void> {
  try {
    io.emit('system_notification', {
      type: notification.type,
      message: notification.message,
      data: notification.data,
      timestamp: new Date().toISOString(),
    })

    console.log(`System notification broadcasted: ${notification.message}`)
  } catch (error) {
    console.error('Error broadcasting system notification:', error)
    throw error
  }
}

/**
 * Get connected users count
 */
export function getConnectedUsersCount(io: SocketIOServer): number {
  return io.sockets.sockets.size
}

/**
 * Get user connection status
 */
export function isUserConnected(io: SocketIOServer, userId: string): boolean {
  const room = io.sockets.adapter.rooms.get(`user:${userId}`)
  return room ? room.size > 0 : false
}