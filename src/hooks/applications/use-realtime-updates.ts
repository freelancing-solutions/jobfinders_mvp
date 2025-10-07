/**
 * Custom hook for real-time application updates
 * Provides real-time functionality for application management
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { applicationSocketIO } from '@/services/applications/websocket-socketio'
import { ApplicationUpdateEvent, ApplicationWebSocketEvents } from '@/types/applications'
import { useApplicationStore } from '@/stores/applications'

interface UseRealtimeUpdatesOptions {
  applicationId?: string
  autoConnect?: boolean
  onConnectionChange?: (connected: boolean) => void
}

export function useRealtimeUpdates(options: UseRealtimeUpdatesOptions = {}) {
  const { applicationId, autoConnect = true, onConnectionChange } = options
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<ApplicationUpdateEvent | null>(null)
  const [connectionState, setConnectionState] = useState<string>('disconnected')
  const updateTimeoutRef = useRef<NodeJS.Timeout>()

  const { handleRealtimeUpdate } = useApplicationStore()

  // Handle connection state changes
  const handleConnectionChange = useCallback((connected: boolean) => {
    setIsConnected(connected)
    setConnectionState(connected ? 'connected' : 'disconnected')
    onConnectionChange?.(connected)
  }, [onConnectionChange])

  // Handle incoming updates
  const handleUpdate = useCallback((event: ApplicationUpdateEvent) => {
    setLastUpdate(event)

    // Debounce updates to prevent rapid re-renders
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }

    updateTimeoutRef.current = setTimeout(() => {
      handleRealtimeUpdate(event)
    }, 100)

    // Only handle updates for specific application if applicationId is provided
    if (applicationId && event.applicationId !== applicationId) {
      return
    }
  }, [applicationId, handleRealtimeUpdate])

  // Subscribe to connection changes
  useEffect(() => {
    applicationSocketIO.onConnectionChange(handleConnectionChange)

    return () => {
      applicationSocketIO.removeConnectionCallback(handleConnectionChange)
    }
  }, [handleConnectionChange])

  // Subscribe to real-time updates
  useEffect(() => {
    const listeners: Array<[keyof ApplicationWebSocketEvents, Function]> = []

    // Subscribe to all relevant events
    const events: (keyof ApplicationWebSocketEvents)[] = [
      'application:status_changed',
      'application:view_updated',
      'application:feedback_added',
      'application:interview_scheduled',
      'application:note_added',
      'application:reminder_triggered',
    ]

    events.forEach(event => {
      const listener = (data: any) => handleUpdate({ ...data, type: event })
      applicationSocketIO.addEventListener(event, listener)
      listeners.push([event, listener])
    })

    return () => {
      listeners.forEach(([event, listener]) => {
        applicationSocketIO.removeEventListener(event, listener)
      })
    }
  }, [handleUpdate])

  // Auto-connect
  useEffect(() => {
    if (autoConnect && !applicationSocketIO.isConnected) {
      applicationSocketIO.connect()
    }
  }, [autoConnect])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
    }
  }, [])

  // Manual reconnect function
  const reconnect = useCallback(() => {
    applicationWebSocket.reconnect()
  }, [])

  // Manual disconnect function
  const disconnect = useCallback(() => {
    applicationWebSocket.disconnect()
  }, [])

  return {
    isConnected,
    connectionState,
    lastUpdate,
    reconnect,
    disconnect,
  }
}

/**
 * Hook for application-specific real-time updates
 */
export function useApplicationRealtime(applicationId: string) {
  const [status, setStatus] = useState<string>('')
  const [viewCount, setViewCount] = useState<number>(0)
  const [newFeedback, setNewFeedback] = useState<any>(null)
  const [interviewScheduled, setInterviewScheduled] = useState<any>(null)

  const { isConnected, lastUpdate } = useRealtimeUpdates({
    applicationId,
    onConnectionChange: (connected) => {
      console.log(`Application ${applicationId} real-time connection:`, connected)
    },
  })

  // Handle application-specific updates
  useEffect(() => {
    if (!lastUpdate || lastUpdate.applicationId !== applicationId) {
      return
    }

    switch (lastUpdate.type) {
      case 'application:status_changed':
        setStatus(lastUpdate.data.status)
        break
      case 'application:view_updated':
        setViewCount(lastUpdate.data.viewCount)
        break
      case 'application:feedback_added':
        setNewFeedback(lastUpdate.data.feedback)
        break
      case 'application:interview_scheduled':
        setInterviewScheduled(lastUpdate.data.interview)
        break
    }
  }, [lastUpdate, applicationId])

  const clearNewFeedback = useCallback(() => {
    setNewFeedback(null)
  }, [])

  const clearInterviewScheduled = useCallback(() => {
    setInterviewScheduled(null)
  }, [])

  return {
    isConnected,
    status,
    viewCount,
    newFeedback,
    interviewScheduled,
    clearNewFeedback,
    clearInterviewScheduled,
  }
}

/**
 * Hook for real-time notifications
 */
export function useRealtimeNotifications() {
  const [notifications, setNotifications] = useState<any[]>([])

  const handleNotification = useCallback((event: ApplicationUpdateEvent) => {
    const notification = {
      id: `${event.type}-${event.timestamp}`,
      type: event.type,
      title: getNotificationTitle(event.type),
      message: getNotificationMessage(event),
      timestamp: event.timestamp,
      read: false,
      applicationId: event.applicationId,
    }

    setNotifications(prev => [notification, ...prev])

    // Auto-remove notifications after 10 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id))
    }, 10000)
  }, [])

  useEffect(() => {
    const events: (keyof ApplicationWebSocketEvents)[] = [
      'application:status_changed',
      'application:view_updated',
      'application:feedback_added',
      'application:interview_scheduled',
      'application:reminder_triggered',
    ]

    const listeners = events.map(event => {
      const listener = (data: any) => handleNotification({ ...data, type: event })
      applicationSocketIO.addEventListener(event, listener)
      return [event, listener] as const
    })

    return () => {
      listeners.forEach(([event, listener]) => {
        applicationSocketIO.removeEventListener(event, listener)
      })
    }
  }, [handleNotification])

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    )
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  return {
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
    markAsRead,
    clearAll,
  }
}

/**
 * Helper functions for notifications
 */
function getNotificationTitle(type: string): string {
  switch (type) {
    case 'application:status_changed':
      return 'Application Status Updated'
    case 'application:view_updated':
      return 'Application Viewed'
    case 'application:feedback_added':
      return 'New Feedback Received'
    case 'application:interview_scheduled':
      return 'Interview Scheduled'
    case 'application:note_added':
      return 'Note Added'
    case 'application:reminder_triggered':
      return 'Reminder'
    default:
      return 'Application Update'
  }
}

function getNotificationMessage(event: ApplicationUpdateEvent): string {
  switch (event.type) {
    case 'application:status_changed':
      return `Application status changed to ${event.data.status}`
    case 'application:view_updated':
      return 'Your application was viewed by the employer'
    case 'application:feedback_added':
      return 'You received new feedback on your application'
    case 'application:interview_scheduled':
      return 'An interview has been scheduled'
    case 'application:note_added':
      return 'A new note was added to your application'
    case 'application:reminder_triggered':
      return 'You have a pending reminder'
    default:
      return 'Your application has been updated'
  }
}