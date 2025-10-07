'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { io, Socket } from 'socket.io-client'
import { NotificationData } from '@/lib/notifications'

// Extended notification interface with more fields
export interface EnhancedNotificationData extends NotificationData {
  id: string
  userId: string
  type: 'job_match' | 'application_update' | 'profile_view' | 'system' | 'marketing'
  channel: 'email' | 'sms' | 'push' | 'in_app'
  title: string
  message: string
  read: boolean
  timestamp: string
  data?: Record<string, any>
  priority?: 'low' | 'normal' | 'high' | 'urgent'
}

export const useNotifications = (options?: {
  autoFetch?: boolean
  limit?: number
}) => {
  const { data: session } = useSession()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [notifications, setNotifications] = useState<EnhancedNotificationData[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { autoFetch = true, limit = 20 } = options || {}

  // Fetch notifications from API
  const fetchNotifications = useCallback(async (page: number = 1) => {
    if (!session?.user?.id) return

    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })

      const response = await fetch(`/api/notifications?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch notifications')
      }

      const data = await response.json()

      if (data.success) {
        setNotifications(prev => page === 1 ? data.data : [...prev, ...data.data])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications')
      console.error('Error fetching notifications:', err)
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.id, limit])

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!session?.user?.id) return

    try {
      const response = await fetch('/api/notifications/unread-count', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch unread count')
      }

      const data = await response.json()

      if (data.success) {
        setUnreadCount(data.data.unreadCount)
      }
    } catch (err) {
      console.error('Error fetching unread count:', err)
    }
  }, [session?.user?.id])

  // Initialize socket connection
  useEffect(() => {
    if (typeof window === 'undefined') return

    const socketInstance = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001', {
      path: '/socket.io',
    })

    socketInstance.on('connect', () => {
      console.log('Connected to notification server')
      setIsConnected(true)
      setSocket(socketInstance)
    })

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from notification server')
      setIsConnected(false)
      setSocket(null)
    })

    socketInstance.on('notification', (notification: EnhancedNotificationData) => {
      setNotifications(prev => [notification, ...prev])
      setUnreadCount(prev => prev + 1)
    })

    socketInstance.on('notification_marked_read', ({ notificationId }) => {
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    })

    socketInstance.on('notification_count_updated', ({ count }) => {
      setUnreadCount(count)
    })

    return () => {
      socketInstance.disconnect()
    }
  }, [])

  // Join user room when session is available
  useEffect(() => {
    if (socket && session?.user?.id) {
      socket.emit('join_user_room', session.user.id)
    }
  }, [socket, session])

  // Auto-fetch notifications and unread count
  useEffect(() => {
    if (autoFetch && session?.user?.id) {
      fetchNotifications()
      fetchUnreadCount()
    }
  }, [autoFetch, session?.user?.id, fetchNotifications, fetchUnreadCount])

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!session?.user?.id) return

    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ read: true }),
      })

      if (!response.ok) {
        throw new Error('Failed to mark notification as read')
      }

      // Update local state
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))

      // Also emit via WebSocket for real-time updates
      if (socket) {
        socket.emit('mark_notification_read', notificationId)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark notification as read')
      console.error('Error marking notification as read:', err)
    }
  }, [session?.user?.id, socket])

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!session?.user?.id || notifications.length === 0) return

    const unreadNotificationIds = notifications
      .filter(n => !n.read)
      .map(n => n.id)

    if (unreadNotificationIds.length === 0) return

    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationIds: unreadNotificationIds,
          action: 'mark_read',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read')
      }

      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      )
      setUnreadCount(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark all notifications as read')
      console.error('Error marking all notifications as read:', err)
    }
  }, [session?.user?.id, notifications])

  // Clear all notifications
  const clearAll = useCallback(async () => {
    if (!session?.user?.id || notifications.length === 0) return

    const notificationIds = notifications.map(n => n.id)

    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationIds,
          action: 'delete',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to clear notifications')
      }

      // Update local state
      setNotifications([])
      setUnreadCount(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear notifications')
      console.error('Error clearing notifications:', err)
    }
  }, [session?.user?.id, notifications])

  // Send a test notification (for development)
  const sendTestNotification = useCallback(async () => {
    if (!session?.user?.id) return

    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id,
          type: 'system',
          channel: 'in_app',
          subject: 'Test Notification',
          content: 'This is a test notification from the system',
          priority: 'normal',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send test notification')
      }

      // Add to local state immediately for instant feedback
      const testNotification: EnhancedNotificationData = {
        id: `test_${Date.now()}`,
        userId: session.user.id,
        type: 'system',
        channel: 'in_app',
        title: 'Test Notification',
        message: 'This is a test notification from the system',
        read: false,
        timestamp: new Date().toISOString(),
        priority: 'normal',
      }

      setNotifications(prev => [testNotification, ...prev])
      setUnreadCount(prev => prev + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send test notification')
      console.error('Error sending test notification:', err)
    }
  }, [session?.user?.id])

  // Track notification analytics event
  const trackEvent = useCallback(async (notificationId: string, eventType: string, metadata?: Record<string, any>) => {
    if (!session?.user?.id) return

    try {
      const response = await fetch('/api/notifications/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationId,
          eventType,
          metadata,
        }),
      })

      if (!response.ok) {
        console.error('Failed to track analytics event')
      }
    } catch (err) {
      console.error('Error tracking analytics event:', err)
    }
  }, [session?.user?.id])

  // Refresh notifications
  const refresh = useCallback(() => {
    fetchNotifications()
    fetchUnreadCount()
  }, [fetchNotifications, fetchUnreadCount])

  return {
    notifications,
    isConnected,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    clearAll,
    sendTestNotification,
    trackEvent,
    refresh,
    fetchMore: () => fetchNotifications(Math.floor(notifications.length / limit) + 1),
  }
}