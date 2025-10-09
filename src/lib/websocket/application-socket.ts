/**
 * Application WebSocket Handlers
 * Manages real-time updates for the application management system
 */

import { Server, Socket } from 'socket.io'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { db } from '@/lib/db'
import { logger } from '@/lib/logging/logger'
import { UserRole } from '@/types/roles';

interface AuthenticatedSocket extends Socket {
  userId?: string
  userRole?: string
}

// Rate limiting store
const rateLimiter = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(socket: AuthenticatedSocket, limit: number = 100, windowMs: number = 60000): boolean {
  const userId = socket.userId
  if (!userId) return false

  const now = Date.now()
  const userLimit = rateLimiter.get(userId)

  if (!userLimit) {
    rateLimiter.set(userId, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (now > userLimit.resetTime) {
    rateLimiter.set(userId, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (userLimit.count >= limit) {
    return false
  }

  userLimit.count++
  return true
}

// Clean up expired rate limit entries
setInterval(() => {
  const now = Date.now()
  for (const [userId, data] of rateLimiter.entries()) {
    if (now > data.resetTime) {
      rateLimiter.delete(userId)
    }
  }
}, 60000) // Clean up every minute

export function setupApplicationHandlers(io: Server) {
  io.of('/applications').use(async (socket: AuthenticatedSocket, next) => {
    try {
      // Authenticate the socket connection
      const session = await getServerSession(authOptions)
      if (!session?.user) {
        socket.emit('error', { message: 'Authentication required' })
        socket.disconnect()
        return
      }

      // Set user info on socket
      socket.userId = session.user.id
      socket.userRole = session.user.role

      // Check rate limit
      if (!checkRateLimit(socket, 50, 60000)) { // 50 connections per minute
        socket.emit('error', { message: 'Too many connection attempts' })
        socket.disconnect()
        return
      }

      logger.info('Application socket connected', {
        socketId: socket.id,
        userId: session.user.id,
        userRole: session.user.role
      })

      next()
    } catch (error) {
      logger.error('Socket authentication failed', { error, socketId: socket.id })
      socket.emit('error', { message: 'Authentication failed' })
      socket.disconnect()
    }
  })

  io.of('/applications').on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId!
    const userRole = socket.userRole!

    // Join user-specific room
    socket.join(`user:${userId}`)

    // Join role-specific rooms
    socket.join(`role:${userRole}`)

    // Handle subscription to specific application updates
    socket.on('subscribe:application', (applicationId: string) => {
      if (!checkRateLimit(socket, 100, 60000)) {
        socket.emit('error', { message: 'Rate limit exceeded' })
        return
      }

      // Verify user has access to this application
      db.jobApplication.findFirst({
        where: {
          applicationId,
          jobSeekerProfile: {
            userUid: userId
          }
        }
      }).then(application => {
        if (application) {
          socket.join(`application:${applicationId}`)
          socket.emit('subscribed', { applicationId })
          logger.info('User subscribed to application', {
            socketId: socket.id,
            userId,
            applicationId
          })
        } else {
          socket.emit('error', { message: 'Application not found or access denied' })
        }
      }).catch(error => {
        logger.error('Error checking application access', { error, applicationId, userId })
        socket.emit('error', { message: 'Internal server error' })
      })
    })

    // Handle unsubscribe from application updates
    socket.on('unsubscribe:application', (applicationId: string) => {
      socket.leave(`application:${applicationId}`)
      socket.emit('unsubscribed', { applicationId })
    })

    // Handle getting application updates
    socket.on('get:application', (applicationId: string) => {
      if (!checkRateLimit(socket, 200, 60000)) {
        socket.emit('error', { message: 'Rate limit exceeded' })
        return
      }

      db.jobApplication.findFirst({
        where: {
          applicationId,
          jobSeekerProfile: {
            userUid: userId
          }
        },
        include: {
          job: {
            include: {
              company: true
            }
          },
          timeline: {
            orderBy: {
              createdAt: 'desc'
            }
          },
          attachments: {
            orderBy: {
              createdAt: 'desc'
            }
          },
          notes: {
            orderBy: {
              createdAt: 'desc'
            }
          },
          interviews: {
            orderBy: {
              scheduledAt: 'asc'
            }
          }
        }
      }).then(application => {
        if (application) {
          socket.emit('application:data', { applicationId, data: application })
        } else {
          socket.emit('error', { message: 'Application not found' })
        }
      }).catch(error => {
        logger.error('Error fetching application', { error, applicationId, userId })
        socket.emit('error', { message: 'Failed to fetch application' })
      })
    })

    // Handle application status updates
    socket.on('update:status', ({ applicationId, status, note }: { applicationId: string; status: string; note?: string }) => {
      if (!checkRateLimit(socket, 50, 60000)) {
        socket.emit('error', { message: 'Rate limit exceeded' })
        return
      }

      // Verify user owns this application
      db.jobApplication.findFirst({
        where: {
          applicationId,
          jobSeekerProfile: {
            userUid: userId
          }
        }
      }).then(application => {
        if (!application) {
          socket.emit('error', { message: 'Application not found' })
          return
        }

        // Validate status transition
        const validTransitions = {
          'applied': ['reviewing', 'rejected', 'withdrawn'],
          'reviewing': ['shortlisted', 'rejected', 'withdrawn'],
          'shortlisted': ['interview_scheduled', 'rejected', 'withdrawn'],
          'interview_scheduled': ['interview_completed', 'rejected', 'withdrawn'],
          'interview_completed': ['offered', 'rejected', 'withdrawn'],
          'offered': ['hired', 'rejected', 'withdrawn'],
          'rejected': ['archived'],
          'withdrawn': ['archived'],
          'hired': ['archived']
        }

        const currentStatus = application.status.toLowerCase()
        const newStatus = status.toLowerCase()

        if (!validTransitions[currentStatus]?.includes(newStatus)) {
          socket.emit('error', { message: 'Invalid status transition' })
          return
        }

        // Update application status
        return db.jobApplication.update({
          where: { applicationId },
          data: {
            status: status.toUpperCase(),
            lastStatusUpdate: new Date()
          }
        })
      }).then(updatedApplication => {
        if (updatedApplication) {
          // Add timeline event
          return db.applicationTimeline.create({
            data: {
              applicationId,
              status: status.toUpperCase(),
              notes: note || `Status changed to ${status}`,
              createdBy: userId,
              createdByRole: UserRole.JOB_SEEKER
            }
          }).then(() => {
            // Broadcast to user's rooms
            io.of('/applications').to(`user:${userId}`).emit('application:status_updated', {
              applicationId,
              status: status,
              timestamp: new Date().toISOString(),
              note
            })

            // Broadcast to specific application room
            io.of('/applications').to(`application:${applicationId}`).emit('application:updated', {
              applicationId,
              status: status,
              timestamp: new Date().toISOString()
            })

            socket.emit('application:status:updated', {
              applicationId,
              status: status,
              success: true
            })

            logger.info('Application status updated via WebSocket', {
              applicationId,
              userId,
              oldStatus: updatedApplication.status,
              newStatus: status
            })
          })
        }
      }).catch(error => {
        logger.error('Error updating application status', { error, applicationId, userId })
        socket.emit('error', { message: 'Failed to update status' })
      })
    })

    // Handle adding notes
    socket.on('add:note', ({ applicationId, content, isPrivate = true }: { applicationId: string; content: string; isPrivate?: boolean }) => {
      if (!checkRateLimit(socket, 100, 60000)) {
        socket.emit('error', { message: 'Rate limit exceeded' })
        return
      }

      if (!content || content.trim().length === 0) {
        socket.emit('error', { message: 'Note content is required' })
        return
      }

      // Verify user owns this application
      db.jobApplication.findFirst({
        where: {
          applicationId,
          jobSeekerProfile: {
            userUid: userId
          }
        }
      }).then(application => {
        if (!application) {
          socket.emit('error', { message: 'Application not found' })
          return
        }

        // Create note
        return db.applicationNote.create({
          data: {
            applicationId,
            content: content.trim(),
            isPrivate,
            createdBy: userId,
            createdById: userId
          }
        })
      }).then(note => {
        if (note) {
          // Update application's last status update
          return db.jobApplication.update({
            where: { applicationId },
            data: {
              lastStatusUpdate: new Date()
            }
          }).then(() => {
            // Broadcast to user's rooms
            io.of('/applications').to(`user:${userId}`).emit('application:note_added', {
              applicationId,
              note: {
                id: note.noteId,
                content: note.content,
                createdAt: note.createdAt.toISOString(),
                createdBy: userId
              },
              timestamp: new Date().toISOString()
            })

            // Broadcast to specific application room
            io.of('/applications').to(`application:${applicationId}`).emit('application:updated', {
              applicationId,
              lastUpdated: new Date().toISOString()
            })

            socket.emit('application:note:added', {
              applicationId,
              noteId: note.noteId,
              success: true
            })

            logger.info('Application note added via WebSocket', {
              applicationId,
              userId,
              noteId: note.noteId
            })
          })
        }
      }).catch(error => {
        logger.error('Error adding application note', { error, applicationId, userId })
        socket.emit('error', { message: 'Failed to add note' })
      })
    })

    // Handle ping for connection health check
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() })
    })

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      logger.info('Application socket disconnected', {
        socketId: socket.id,
        userId,
        reason
      })
    })

    // Send initial connection message
    socket.emit('connected', {
      message: 'Connected to application WebSocket',
      timestamp: new Date().toISOString(),
      userId,
      userRole
    })
  })

  // Error handling for the namespace
  io.of('/applications').on('error', (error) => {
    logger.error('Application WebSocket error', { error })
  })

  logger.info('Application WebSocket handlers configured')
}

// Helper function to broadcast application updates
export function broadcastApplicationUpdate(
  io: Server,
  applicationId: string,
  type: string,
  data: any,
  targetRoles?: string[]
) {
  const eventName = `application:${type}`

  // Broadcast to specific application room
  io.of('/applications').to(`application:${applicationId}`).emit(eventName, {
    applicationId,
    ...data,
    timestamp: new Date().toISOString()
  })

  // Broadcast to role-specific rooms if specified
  if (targetRoles) {
    targetRoles.forEach(role => {
      io.of('/applications').to(`role:${role}`).emit(eventName, {
        applicationId,
        ...data,
        timestamp: new Date().toISOString()
      })
    })
  }

  logger.info('Application update broadcasted', {
    applicationId,
    type,
    targetRoles
  })
}

// Helper function to broadcast to specific users
export function broadcastToUsers(
  io: Server,
  userIds: string[],
  eventName: string,
  data: any
) {
  userIds.forEach(userId => {
    io.of('/applications').to(`user:${userId}`).emit(eventName, {
      ...data,
      timestamp: new Date().toISOString()
    })
  })

  logger.info('Message broadcasted to users', {
    userIds,
    eventName
  })
}