import { Server } from 'socket.io'
import { db } from './db'

export interface NotificationData {
  id: string
  type: 'application_status' | 'new_job' | 'application_received' | 'job_match'
  title: string
  message: string
  data?: any
  timestamp: Date
  userId: string
  read: boolean
}

export const setupNotificationHandlers = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    // Join user to their personal room for targeted notifications
    socket.on('join_user_room', (userId: string) => {
      socket.join(`user_${userId}`)
      console.log(`User ${userId} joined their room`)
    })

    // Handle application status updates
    socket.on('application_status_update', async (data: {
      applicationId: string
      newStatus: string
      userId: string
      employerId?: string
    }) => {
      try {
        // Update application in database
        await db.jobApplication.update({
          where: { applicationId: data.applicationId },
          data: { 
            status: data.newStatus as any,
            lastStatusUpdate: new Date()
          }
        })

        // Create notification
        const notification: NotificationData = {
          id: `notif_${Date.now()}_${Math.random()}`,
          type: 'application_status',
          title: 'Application Status Updated',
          message: `Your application status has been updated to: ${data.newStatus}`,
          data: {
            applicationId: data.applicationId,
            newStatus: data.newStatus
          },
          timestamp: new Date(),
          userId: data.userId,
          read: false
        }

        // Send notification to the specific user
        io.to(`user_${data.userId}`).emit('notification', notification)

        // If there's an employer, send them a notification too
        if (data.employerId) {
          const employerNotification: NotificationData = {
            id: `notif_${Date.now()}_${Math.random()}`,
            type: 'application_status',
            title: 'Application Status Updated',
            message: `Application status has been updated to: ${data.newStatus}`,
            data: {
              applicationId: data.applicationId,
              newStatus: data.newStatus
            },
            timestamp: new Date(),
            userId: data.employerId,
            read: false
          }
          io.to(`user_${data.employerId}`).emit('notification', employerNotification)
        }

      } catch (error) {
        console.error('Error handling application status update:', error)
      }
    })

    // Handle new job notifications for job seekers
    socket.on('new_job_posted', async (data: {
      jobId: string
      jobTitle: string
      company: string
      location?: string
    }) => {
      try {
        // Find job seekers who might be interested
        const jobSeekers = await db.user.findMany({
          where: { role: 'seeker' },
          include: { jobSeekerProfile: true }
        })

        // Send notifications to relevant job seekers
        for (const seeker of jobSeekers) {
          // Simple matching logic - can be enhanced
          const shouldNotify = seeker.jobSeekerProfile?.location && 
            (!data.location || seeker.jobSeekerProfile.location.toLowerCase().includes(data.location.toLowerCase()))

          if (shouldNotify) {
            const notification: NotificationData = {
              id: `notif_${Date.now()}_${Math.random()}`,
              type: 'new_job',
              title: 'New Job Posted',
              message: `New position: ${data.jobTitle} at ${data.company}${data.location ? ` in ${data.location}` : ''}`,
              data: {
                jobId: data.jobId,
                jobTitle: data.jobTitle,
                company: data.company,
                location: data.location
              },
              timestamp: new Date(),
              userId: seeker.uid,
              read: false
            }

            io.to(`user_${seeker.uid}`).emit('notification', notification)
          }
        }
      } catch (error) {
        console.error('Error handling new job notification:', error)
      }
    })

    // Handle application received notifications for employers
    socket.on('application_received', async (data: {
      jobId: string
      jobTitle: string
      applicantName: string
      employerId: string
    }) => {
      try {
        const notification: NotificationData = {
          id: `notif_${Date.now()}_${Math.random()}`,
          type: 'application_received',
          title: 'New Application Received',
          message: `${data.applicantName} has applied for ${data.jobTitle}`,
          data: {
            jobId: data.jobId,
            jobTitle: data.jobTitle,
            applicantName: data.applicantName
          },
          timestamp: new Date(),
          userId: data.employerId,
          read: false
        }

        io.to(`user_${data.employerId}`).emit('notification', notification)

      } catch (error) {
        console.error('Error handling application received notification:', error)
      }
    })

    // Handle job match notifications
    socket.on('job_match_found', async (data: {
      jobId: string
      jobTitle: string
      company: string
      matchScore: number
      userId: string
    }) => {
      try {
        const notification: NotificationData = {
          id: `notif_${Date.now()}_${Math.random()}`,
          type: 'job_match',
          title: 'New Job Match Found',
          message: `${data.matchScore}% match: ${data.jobTitle} at ${data.company}`,
          data: {
            jobId: data.jobId,
            jobTitle: data.jobTitle,
            company: data.company,
            matchScore: data.matchScore
          },
          timestamp: new Date(),
          userId: data.userId,
          read: false
        }

        io.to(`user_${data.userId}`).emit('notification', notification)

      } catch (error) {
        console.error('Error handling job match notification:', error)
      }
    })

    // Handle marking notifications as read
    socket.on('mark_notification_read', (notificationId: string) => {
      // In a real implementation, you would update the database
      // For now, we'll just acknowledge the request
      socket.emit('notification_marked_read', { notificationId })
    })

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
    })

    // Send welcome message
    socket.emit('connected', {
      message: 'Connected to notification system',
      timestamp: new Date().toISOString(),
    })
  })
}

export const sendNotificationToUser = (io: Server, userId: string, notification: Omit<NotificationData, 'id' | 'timestamp' | 'read'>) => {
  const fullNotification: NotificationData = {
    ...notification,
    id: `notif_${Date.now()}_${Math.random()}`,
    timestamp: new Date(),
    read: false
  }

  io.to(`user_${userId}`).emit('notification', fullNotification)
}