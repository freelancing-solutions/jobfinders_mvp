/**
 * WebSocket service for real-time application updates
 * Handles real-time communication for application management
 */

import { ApplicationUpdateEvent, ApplicationWebSocketEvents } from '@/types/applications'

export class ApplicationWebSocketService {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectTimeout = 1000
  private isConnecting = false
  private eventListeners: Map<string, Set<Function>> = new Map()
  private connectionCallbacks: Set<(connected: boolean) => void> = new Set()

  constructor(private url: string = '/api/applications/ws') {
    // Bind methods to maintain context
    this.connect = this.connect.bind(this)
    this.handleMessage = this.handleMessage.bind(this)
    this.handleClose = this.handleClose.bind(this)
    this.handleError = this.handleError.bind(this)
  }

  /**
   * Initialize WebSocket connection
   */
  connect(): void {
    if (typeof window === 'undefined' || this.isConnecting) return

    this.isConnecting = true
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}${this.url}`

    console.log('Connecting to Application WebSocket:', wsUrl)

    try {
      this.ws = new WebSocket(wsUrl)
      this.setupEventListeners()
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      this.isConnecting = false
      this.scheduleReconnect()
    }
  }

  /**
   * Setup WebSocket event listeners
   */
  private setupEventListeners(): void {
    if (!this.ws) return

    this.ws.onopen = () => {
      console.log('Application WebSocket connected')
      this.isConnecting = false
      this.reconnectAttempts = 0
      this.notifyConnectionCallbacks(true)
    }

    this.ws.onmessage = this.handleMessage
    this.ws.onclose = this.handleClose
    this.ws.onerror = this.handleError
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data) as ApplicationUpdateEvent
      console.log('Received WebSocket message:', data)
      this.emit(data.type, data)
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error)
    }
  }

  /**
   * Handle WebSocket connection close
   */
  private handleClose(event: CloseEvent): void {
    console.log('Application WebSocket disconnected:', event.code, event.reason)
    this.ws = null
    this.isConnecting = false
    this.notifyConnectionCallbacks(false)

    // Attempt to reconnect if not a normal closure
    if (event.code !== 1000) {
      this.scheduleReconnect()
    }
  }

  /**
   * Handle WebSocket errors
   */
  private handleError(error: Event): void {
    console.error('Application WebSocket error:', error)
    this.isConnecting = false
    this.notifyConnectionCallbacks(false)
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    const delay = this.reconnectTimeout * Math.pow(2, this.reconnectAttempts)
    console.log(`Scheduling reconnection in ${delay}ms (attempt ${this.reconnectAttempts + 1})`)

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

    // Auto-connect if not already connected
    if (!this.ws && !this.isConnecting) {
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
          console.error('Error in WebSocket event listener:', error)
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
    if (this.ws) {
      callback(this.ws.readyState === WebSocket.OPEN)
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
   * Send message to WebSocket server
   */
  send(type: string, data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = { type, data, timestamp: new Date().toISOString() }
      this.ws.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket not connected, cannot send message:', type)
    }
  }

  /**
   * Get connection state
   */
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  /**
   * Get connection state as string
   */
  get connectionState(): string {
    if (!this.ws) return 'disconnected'
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting'
      case WebSocket.OPEN: return 'connected'
      case WebSocket.CLOSING: return 'closing'
      case WebSocket.CLOSED: return 'disconnected'
      default: return 'unknown'
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }
    this.eventListeners.clear()
    this.connectionCallbacks.clear()
    this.reconnectAttempts = 0
  }

  /**
   * Force reconnect
   */
  reconnect(): void {
    this.disconnect()
    this.reconnectAttempts = 0
    this.connect()
  }
}

// Create singleton instance
export const applicationWebSocket = new ApplicationWebSocketService()

// Export for testing
export { ApplicationWebSocketService }