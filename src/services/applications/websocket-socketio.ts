/**
 * Socket.IO client service for real-time application updates
 * Handles real-time communication for application management using Socket.IO
 */

import { io, Socket } from 'socket.io-client'
import { ApplicationUpdateEvent, ApplicationWebSocketEvents } from '@/types/applications'

export class ApplicationSocketIOService {
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectTimeout = 1000
  private isConnecting = false
  private eventListeners: Map<string, Set<Function>> = new Map()
  private connectionCallbacks: Set<(connected: boolean) => void> = new Set()

  constructor(private url: string = '/applications') {
    // Bind methods to maintain context
    this.connect = this.connect.bind(this)
    this.handleConnect = this.handleConnect.bind(this)
    this.handleDisconnect = this.handleDisconnect.bind(this)
    this.handleError = this.handleError.bind(this)
  }

  /**
   * Initialize Socket.IO connection
   */
  connect(): void {
    if (typeof window === 'undefined' || this.isConnecting) return

    this.isConnecting = true

    // Get the Socket.IO server URL
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:'
    const host = window.location.host
    const socketUrl = `${protocol}//${host}`

    console.log('Connecting to Application Socket.IO:', socketUrl + this.url)

    try {
      this.socket = io(socketUrl + this.url, {
        path: '/api/socketio',
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
        timeout: 20000,
        autoConnect: true,
        forceNew: false,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        maxReconnectionAttempts: 5,
        randomizationFactor: 0.5,
      })

      this.setupEventListeners()
    } catch (error) {
      console.error('Failed to create Socket.IO connection:', error)
      this.isConnecting = false
      this.scheduleReconnect()
    }
  }

  /**
   * Setup Socket.IO event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return

    this.socket.on('connect', this.handleConnect)
    this.socket.on('disconnect', this.handleDisconnect)
    this.socket.on('error', this.handleError)
    this.socket.on('connect_error', this.handleError)

    // Setup application-specific event listeners
    this.socket.on('application:status_updated', (data) => {
      this.emit('application:status_changed', data)
    })

    this.socket.on('application:note_added', (data) => {
      this.emit('application:note_added', data)
    })

    this.socket.on('application:updated', (data) => {
      this.emit('application:view_updated', data)
    })

    this.socket.on('application:interview_scheduled', (data) => {
      this.emit('application:interview_scheduled', data)
    })

    this.socket.on('application:feedback_added', (data) => {
      this.emit('application:feedback_added', data)
    })

    this.socket.on('application:reminder_triggered', (data) => {
      this.emit('application:reminder_triggered', data)
    })
  }

  /**
   * Handle connection success
   */
  private handleConnect(): void {
    console.log('Application Socket.IO connected')
    this.isConnecting = false
    this.reconnectAttempts = 0
    this.notifyConnectionCallbacks(true)
  }

  /**
   * Handle connection close
   */
  private handleDisconnect(reason: string): void {
    console.log('Application Socket.IO disconnected:', reason)
    this.isConnecting = false
    this.notifyConnectionCallbacks(false)

    // Attempt to reconnect if not a normal closure
    if (reason !== 'io client disconnect') {
      this.scheduleReconnect()
    }
  }

  /**
   * Handle connection errors
   */
  private handleError(error: any): void {
    console.error('Application Socket.IO error:', error)
    this.isConnecting = false
    this.notifyConnectionCallbacks(false)
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached for Socket.IO')
      return
    }

    const delay = this.reconnectTimeout * Math.pow(2, this.reconnectAttempts)
    console.log(`Scheduling Socket.IO reconnection in ${delay}ms (attempt ${this.reconnectAttempts + 1})`)

    setTimeout(() => {
      this.reconnectAttempts++
      this.connect()
    }, delay)
  }

  /**
   * Add event listener for specific event type
   */
  addEventListener<T extends keyof ApplicationWebSocketEvents>(
    event: T,
    callback: (data: ApplicationWebSocketEvents[T]) => void
  ): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }
    this.eventListeners.get(event)!.add(callback)

    // Auto-connect if not already done
    if (!this.socket) {
      this.connect()
    }
  }

  /**
   * Remove event listener
   */
  removeEventListener<T extends keyof ApplicationWebSocketEvents>(
    event: T,
    callback: (data: ApplicationWebSocketEvents[T]) => void
  ): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.delete(callback)
      if (listeners.size === 0) {
        this.eventListeners.delete(event)
      }
    }
  }

  /**
   * Emit event to all listeners
   */
  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error('Error in Socket.IO event listener:', error)
        }
      })
    }
  }

  /**
   * Add connection state callback
   */
  onConnectionChange(callback: (connected: boolean) => void): void {
    this.connectionCallbacks.add(callback)
    // Call immediately with current state
    if (this.socket) {
      callback(this.socket.connected)
    } else {
      callback(false)
    }
  }

  /**
   * Remove connection state callback
   */
  removeConnectionCallback(callback: (connected: boolean) => void): void {
    this.connectionCallbacks.delete(callback)
  }

  /**
   * Notify all connection callbacks
   */
  private notifyConnectionCallbacks(connected: boolean): void {
    this.connectionCallbacks.forEach(callback => {
      try {
        callback(connected)
      } catch (error) {
        console.error('Error in connection callback:', error)
      }
    })
  }

  /**
   * Send message to Socket.IO server
   */
  send(event: string, data: any): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data)
    } else {
      console.warn('Socket.IO not connected, cannot send message:', event)
    }
  }

  /**
   * Subscribe to application updates
   */
  subscribeToApplication(applicationId: string): void {
    this.send('subscribe:application', applicationId)
  }

  /**
   * Unsubscribe from application updates
   */
  unsubscribeFromApplication(applicationId: string): void {
    this.send('unsubscribe:application', applicationId)
  }

  /**
   * Get application data
   */
  getApplication(applicationId: string): void {
    this.send('get:application', applicationId)
  }

  /**
   * Update application status
   */
  updateApplicationStatus(applicationId: string, status: string, note?: string): void {
    this.send('update:status', { applicationId, status, note })
  }

  /**
   * Add note to application
   */
  addApplicationNote(applicationId: string, content: string, isPrivate = true): void {
    this.send('add:note', { applicationId, content, isPrivate })
  }

  /**
   * Get connection state
   */
  get isConnected(): boolean {
    return this.socket?.connected || false
  }

  /**
   * Get connection state as string
   */
  get connectionState(): string {
    if (!this.socket) return 'disconnected'
    if (this.socket.connected) return 'connected'
    if (this.isConnecting) return 'connecting'
    return 'disconnected'
  }

  /**
   * Force reconnect
   */
  reconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
    }
    this.reconnectAttempts = 0
    this.connect()
  }

  /**
   * Disconnect Socket.IO connection
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    this.eventListeners.clear()
    this.connectionCallbacks.clear()
    this.reconnectAttempts = 0
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return {
      connected: this.isConnected,
      state: this.connectionState,
      reconnectAttempts: this.reconnectAttempts,
      eventListeners: Array.from(this.eventListeners.entries()).map(([event, listeners]) => ({
        event,
        count: listeners.size
      }))
    }
  }
}

// Create singleton instance
export const applicationSocketIO = new ApplicationSocketIOService()

// Export for testing
export { ApplicationSocketIOService }