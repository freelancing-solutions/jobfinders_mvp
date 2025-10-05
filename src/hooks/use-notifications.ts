'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { io, Socket } from 'socket.io-client'
import { NotificationData } from '@/lib/notifications'

export const useNotifications = () => {
  const { data: session } = useSession()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Initialize socket connection
  useEffect(() => {
    if (typeof window === 'undefined') return

    const socketInstance = io()
    
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

    socketInstance.on('notification', (notification: NotificationData) => {
      setNotifications(prev => [notification, ...prev])
      setUnreadCount(prev => prev + 1)
    })

    socketInstance.on('notification_marked_read', ({ notificationId }) => {
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
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

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    if (socket) {
      socket.emit('mark_notification_read', notificationId)
    }
  }, [socket])

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    notifications.forEach(notification => {
      if (!notification.read) {
        markAsRead(notification.id)
      }
    })
  }, [notifications, markAsRead])

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([])
    setUnreadCount(0)
  }, [])

  // Send a test notification (for development)
  const sendTestNotification = useCallback(() => {
    if (socket && session?.user?.id) {
      const testNotification: Omit<NotificationData, 'id' | 'timestamp' | 'read'> = {
        type: 'application_status',
        title: 'Test Notification',
        message: 'This is a test notification from the system',
        userId: session.user.id
      }
      
      const fullNotification: NotificationData = {
        ...testNotification,
        id: `test_${Date.now()}`,
        timestamp: new Date(),
        read: false
      }
      
      setNotifications(prev => [fullNotification, ...prev])
      setUnreadCount(prev => prev + 1)
    }
  }, [socket, session])

  return {
    notifications,
    isConnected,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    sendTestNotification
  }
}