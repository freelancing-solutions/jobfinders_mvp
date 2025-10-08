'use client'

import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { io, Socket } from 'socket.io-client'

interface UseSocketOptions {
  autoConnect?: boolean
  reconnection?: boolean
  reconnectionAttempts?: number
  reconnectionDelay?: number
}

interface UseSocketReturn {
  socket: Socket | null
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  reconnect: () => void
  disconnect: () => void
}

/**
 * Hook for managing WebSocket connections with Socket.IO
 * Provides real-time communication with the server
 */
export function useSocket(options: UseSocketOptions = {}): UseSocketReturn {
  const {
    autoConnect = true,
    reconnection = true,
    reconnectionAttempts = 5,
    reconnectionDelay = 1000,
  } = options

  const { data: session } = useSession()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const socketRef = useRef<Socket | null>(null)

  // Initialize socket connection
  useEffect(() => {
    if (!autoConnect || !session?.user?.id) {
      return
    }

    setIsConnecting(true)
    setError(null)

    // Create socket connection to applications namespace
    const socketInstance = io('/applications', {
      path: '/api/socketio',
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      reconnection,
      reconnectionAttempts,
      reconnectionDelay,
      auth: {
        userId: session.user.id,
        sessionToken: session.user.email, // Using email as simple session identifier
      },
    })

    // Store socket reference
    socketRef.current = socketInstance
    setSocket(socketInstance)

    // Connection event handlers
    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id)
      setIsConnected(true)
      setIsConnecting(false)
      setError(null)

      // Join user's personal room for targeted updates
      socketInstance.emit('join_room', `user:${session.user.id}`)
    })

    socketInstance.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
      setIsConnected(false)
      setIsConnecting(false)

      if (reason === 'io server disconnect') {
        // The disconnection was initiated by the server, reconnect manually
        socketInstance.connect()
      }
    })

    socketInstance.on('connect_error', (err) => {
      console.error('Socket connection error:', err)
      setIsConnecting(false)
      setError(err.message)
      setIsConnected(false)
    })

    socketInstance.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts')
      setIsConnected(true)
      setError(null)
    })

    socketInstance.on('reconnect_error', (err) => {
      console.error('Socket reconnection error:', err)
      setError(err.message)
    })

    socketInstance.on('reconnect_failed', () => {
      console.error('Socket reconnection failed after', reconnectionAttempts, 'attempts')
      setError('Failed to reconnect to server')
    })

    // Cleanup on unmount
    return () => {
      if (socketInstance) {
        socketInstance.removeAllListeners()
        socketInstance.disconnect()
        socketRef.current = null
        setSocket(null)
        setIsConnected(false)
        setIsConnecting(false)
      }
    }
  }, [session?.user?.id, autoConnect, reconnection, reconnectionAttempts, reconnectionDelay])

  // Manual reconnect function
  const reconnect = () => {
    if (socketRef.current && !socketRef.current.connected) {
      socketRef.current.connect()
    }
  }

  // Manual disconnect function
  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect()
    }
  }

  return {
    socket: socketRef.current,
    isConnected,
    isConnecting,
    error,
    reconnect,
    disconnect,
  }
}

/**
 * Hook for listening to specific socket events
 */
export function useSocketEvent<T = any>(
  socket: Socket | null,
  eventName: string,
  callback: (data: T) => void,
  deps: React.DependencyList = []
) {
  useEffect(() => {
    if (!socket) return

    const handler = (data: T) => {
      try {
        callback(data)
      } catch (error) {
        console.error(`Error in socket event handler for ${eventName}:`, error)
      }
    }

    socket.on(eventName, handler)

    return () => {
      socket.off(eventName, handler)
    }
  }, [socket, eventName, ...deps])
}

/**
 * Hook for application-specific socket events
 */
export function useApplicationSocket() {
  const { socket, isConnected } = useSocket()
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<any[]>([])

  // Listen for application status updates
  useSocketEvent(socket, 'application:status_updated', (data) => {
    console.log('Application status updated:', data)
    setLastUpdate(new Date().toISOString())

    // Add notification
    setNotifications(prev => [{
      id: Date.now().toString(),
      type: 'status_update',
      message: `Application status updated to ${data.status}`,
      data,
      timestamp: new Date().toISOString(),
    }, ...prev.slice(0, 9)]) // Keep only last 10 notifications
  }, [socket])

  // Listen for new applications
  useSocketEvent(socket, 'application:created', (data) => {
    console.log('New application created:', data)
    setLastUpdate(new Date().toISOString())

    // Add notification
    setNotifications(prev => [{
      id: Date.now().toString(),
      type: 'new_application',
      message: `New application submitted for ${data.jobTitle}`,
      data,
      timestamp: new Date().toISOString(),
    }, ...prev.slice(0, 9)])
  }, [socket])

  // Listen for interview updates
  useSocketEvent(socket, 'application:interview_scheduled', (data) => {
    console.log('Interview scheduled:', data)
    setLastUpdate(new Date().toISOString())

    // Add notification
    setNotifications(prev => [{
      id: Date.now().toString(),
      type: 'interview_scheduled',
      message: `Interview scheduled for ${data.jobTitle}`,
      data,
      timestamp: new Date().toISOString(),
    }, ...prev.slice(0, 9)])
  }, [socket])

  const clearNotifications = () => {
    setNotifications([])
  }

  return {
    socket,
    isConnected,
    lastUpdate,
    notifications,
    clearNotifications,
  }
}