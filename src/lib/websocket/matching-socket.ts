import { WebSocketServer, WebSocket } from 'ws'
import { IncomingMessage } from 'http'
import { logger } from '@/lib/logger'
import { EventStream } from '@/lib/events/event-stream'
import { MatchEventProcessor } from '@/lib/events/match-events'
import { UserRole } from '@/types/roles'

export interface SocketClient {
  id: string
  userId: string
  userType: UserRole.JOB_SEEKER | UserRole.EMPLOYER | UserRole.ADMIN
  socket: WebSocket
  connectedAt: Date
  lastActivity: Date
  subscriptions: Set<string>
  isAuthenticated: boolean
  metadata: Record<string, any>
}

export interface SocketMessage {
  id: string
  type: string
  data: any
  timestamp: Date
  userId?: string
  metadata?: Record<string, any>
}

export interface SocketSubscription {
  id: string
  userId: string
  type: 'matches' | 'applications' | 'recommendations' | 'notifications' | 'events'
  filters?: Record<string, any>
  createdAt: Date
  active: boolean
}

export class MatchingWebSocketServer {
  private wss: WebSocketServer
  private clients: Map<string, SocketClient> = new Map()
  private subscriptions: Map<string, SocketSubscription> = new Map()
  private eventStream: EventStream
  private matchEventProcessor: MatchEventProcessor
  private heartbeatInterval: NodeJS.Timeout | null = null
  private messageQueue: Map<string, SocketMessage[]> = new Map()

  constructor(
    eventStream: EventStream,
    matchEventProcessor: MatchEventProcessor,
    options: {
      port?: number
      heartbeatInterval?: number
      maxConnections?: number
      enableCompression?: boolean
    } = {}
  ) {
    this.eventStream = eventStream
    this.matchEventProcessor = matchEventProcessor

    this.wss = new WebSocketServer({
      port: options.port || parseInt(process.env.WS_PORT || '8081'),
      path: '/matching-ws',
      maxPayload: 1024 * 1024, // 1MB
      ...options
    })

    this.setupServer()
    this.setupEventSubscriptions()
    this.startHeartbeat(options.heartbeatInterval || 30000)

    logger.info('Matching WebSocket server started', {
      port: options.port || 8081
    })
  }

  /**
   * Setup WebSocket server event handlers
   */
  private setupServer(): void {
    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      this.handleConnection(ws, req)
    })

    this.wss.on('error', (error) => {
      logger.error('WebSocket server error', { error })
    })

    this.wss.on('listening', () => {
      logger.info('WebSocket server listening')
    })
  }

  /**
   * Handle new WebSocket connection
   */
  private async handleConnection(ws: WebSocket, req: IncomingMessage): Promise<void> {
    const clientId = this.generateClientId()
    const url = new URL(req.url || '', `http://${req.headers.host}`)

    // Extract authentication token and user info
    const token = url.searchParams.get('token') || req.headers['authorization']?.replace('Bearer ', '')
    const userId = url.searchParams.get('userId')
    const userType = url.searchParams.get('userType') as UserRole.JOB_SEEKER | UserRole.EMPLOYER | UserRole.ADMIN

    if (!token || !userId || !userType) {
      ws.close(1008, 'Authentication required')
      return
    }

    // Validate authentication (implement your auth logic)
    const isAuthenticated = await this.validateAuthentication(token, userId)
    if (!isAuthenticated) {
      ws.close(1008, 'Invalid authentication')
      return
    }

    const client: SocketClient = {
      id: clientId,
      userId,
      userType,
      socket: ws,
      connectedAt: new Date(),
      lastActivity: new Date(),
      subscriptions: new Set(),
      isAuthenticated: true,
      metadata: {
        userAgent: req.headers['user-agent'],
        ip: req.socket.remoteAddress,
        origin: req.headers.origin
      }
    }

    this.clients.set(clientId, client)

    // Setup client event handlers
    this.setupClientHandlers(client)

    // Send connection confirmation
    this.sendToClient(client, {
      type: 'connection_established',
      data: {
        clientId,
        userId,
        userType,
        connectedAt: client.connectedAt,
        serverTime: new Date()
      }
    })

    // Queue any pending messages
    this.flushMessageQueue(userId)

    logger.info('Client connected', {
      clientId,
      userId,
      userType,
      userAgent: req.headers['user-agent']
    })
  }

  /**
   * Setup event handlers for a client
   */
  private setupClientHandlers(client: SocketClient): void {
    const ws = client.socket

    ws.on('message', async (data) => {
      try {
        const message: SocketMessage = JSON.parse(data.toString())
        await this.handleClientMessage(client, message)
      } catch (error) {
        logger.error('Error parsing client message', {
          clientId: client.id,
          userId: client.userId,
          error
        })
        this.sendError(client, 'Invalid message format')
      }
    })

    ws.on('close', (code, reason) => {
      this.handleDisconnection(client, code, reason.toString())
    })

    ws.on('error', (error) => {
      logger.error('Client socket error', {
        clientId: client.id,
        userId: client.userId,
        error
      })
    })

    ws.on('pong', () => {
      client.lastActivity = new Date()
    })
  }

  /**
   * Handle messages from clients
   */
  private async handleClientMessage(client: SocketClient, message: SocketMessage): Promise<void> {
    client.lastActivity = new Date()

    try {
      switch (message.type) {
        case 'subscribe':
          await this.handleSubscription(client, message.data)
          break
        case 'unsubscribe':
          await this.handleUnsubscription(client, message.data)
          break
        case 'get_matches':
          await this.handleGetMatches(client, message.data)
          break
        case 'get_applications':
          await this.handleGetApplications(client, message.data)
          break
        case 'get_recommendations':
          await this.handleGetRecommendations(client, message.data)
          break
        case 'mark_notification_read':
          await this.handleMarkNotificationRead(client, message.data)
          break
        case 'ping':
          this.sendToClient(client, {
            type: 'pong',
            data: { timestamp: new Date() }
          })
          break
        default:
          logger.warn('Unknown message type', {
            clientId: client.id,
            userId: client.userId,
            messageType: message.type
          })
      }
    } catch (error) {
      logger.error('Error handling client message', {
        clientId: client.id,
        userId: client.userId,
        messageType: message.type,
        error
      })
      this.sendError(client, 'Error processing message')
    }
  }

  /**
   * Handle subscription requests
   */
  private async handleSubscription(client: SocketClient, data: any): Promise<void> {
    const { type, filters } = data

    if (!type) {
      this.sendError(client, 'Subscription type is required')
      return
    }

    const subscriptionId = this.generateSubscriptionId()
    const subscription: SocketSubscription = {
      id: subscriptionId,
      userId: client.userId,
      type: type as any,
      filters,
      createdAt: new Date(),
      active: true
    }

    this.subscriptions.set(subscriptionId, subscription)
    client.subscriptions.add(subscriptionId)

    this.sendToClient(client, {
      type: 'subscription_created',
      data: {
        subscriptionId,
        type,
        filters,
        createdAt: subscription.createdAt
      }
    })

    logger.info('Client subscribed', {
      clientId: client.id,
      userId: client.userId,
      subscriptionType: type,
      subscriptionId
    })
  }

  /**
   * Handle unsubscription requests
   */
  private async handleUnsubscription(client: SocketClient, data: any): Promise<void> {
    const { subscriptionId } = data

    if (!subscriptionId) {
      this.sendError(client, 'Subscription ID is required')
      return
    }

    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription || subscription.userId !== client.userId) {
      this.sendError(client, 'Invalid subscription ID')
      return
    }

    subscription.active = false
    this.subscriptions.delete(subscriptionId)
    client.subscriptions.delete(subscriptionId)

    this.sendToClient(client, {
      type: 'subscription_removed',
      data: { subscriptionId }
    })

    logger.info('Client unsubscribed', {
      clientId: client.id,
      userId: client.userId,
      subscriptionId
    })
  }

  /**
   * Handle get matches request
   */
  private async handleGetMatches(client: SocketClient, data: any): Promise<void> {
    // This would integrate with your matching service
    const { limit = 10, filters = {} } = data

    try {
      // Mock matches - replace with actual service call
      const matches = []

      this.sendToClient(client, {
        type: 'matches_response',
        data: {
          matches,
          total: matches.length,
          filters,
          timestamp: new Date()
        }
      })
    } catch (error) {
      logger.error('Error getting matches', {
        clientId: client.id,
        userId: client.userId,
        error
      })
      this.sendError(client, 'Failed to get matches')
    }
  }

  /**
   * Handle get applications request
   */
  private async handleGetApplications(client: SocketClient, data: any): Promise<void> {
    const { limit = 10, status } = data

    try {
      // Mock applications - replace with actual service call
      const applications = []

      this.sendToClient(client, {
        type: 'applications_response',
        data: {
          applications,
          total: applications.length,
          filters: { status },
          timestamp: new Date()
        }
      })
    } catch (error) {
      logger.error('Error getting applications', {
        clientId: client.id,
        userId: client.userId,
        error
      })
      this.sendError(client, 'Failed to get applications')
    }
  }

  /**
   * Handle get recommendations request
   */
  private async handleGetRecommendations(client: SocketClient, data: any): Promise<void> {
    const { type, limit = 10, filters = {} } = data

    try {
      // Mock recommendations - replace with actual service call
      const recommendations = []

      this.sendToClient(client, {
        type: 'recommendations_response',
        data: {
          recommendations,
          type,
          total: recommendations.length,
          filters,
          timestamp: new Date()
        }
      })
    } catch (error) {
      logger.error('Error getting recommendations', {
        clientId: client.id,
        userId: client.userId,
        error
      })
      this.sendError(client, 'Failed to get recommendations')
    }
  }

  /**
   * Handle mark notification read request
   */
  private async handleMarkNotificationRead(client: SocketClient, data: any): Promise<void> {
    const { notificationId } = data

    if (!notificationId) {
      this.sendError(client, 'Notification ID is required')
      return
    }

    try {
      // Update notification in database
      // await this.notificationService.markAsRead(notificationId, client.userId)

      this.sendToClient(client, {
        type: 'notification_marked_read',
        data: { notificationId, timestamp: new Date() }
      })
    } catch (error) {
      logger.error('Error marking notification read', {
        clientId: client.id,
        userId: client.userId,
        notificationId,
        error
      })
      this.sendError(client, 'Failed to mark notification as read')
    }
  }

  /**
   * Handle client disconnection
   */
  private handleDisconnection(client: SocketClient, code: number, reason: string): void {
    // Remove client
    this.clients.delete(client.id)

    // Deactivate subscriptions
    client.subscriptions.forEach(subscriptionId => {
      const subscription = this.subscriptions.get(subscriptionId)
      if (subscription) {
        subscription.active = false
      }
    })

    logger.info('Client disconnected', {
      clientId: client.id,
      userId: client.userId,
      code,
      reason,
      duration: Date.now() - client.connectedAt.getTime()
    })
  }

  /**
   * Send message to specific client
   */
  private sendToClient(client: SocketClient, message: any): void {
    if (client.socket.readyState === WebSocket.OPEN) {
      try {
        const fullMessage: SocketMessage = {
          id: this.generateMessageId(),
          ...message,
          timestamp: new Date()
        }

        client.socket.send(JSON.stringify(fullMessage))
      } catch (error) {
        logger.error('Error sending message to client', {
          clientId: client.id,
          userId: client.userId,
          error
        })
      }
    }
  }

  /**
   * Send error message to client
   */
  private sendError(client: SocketClient, error: string): void {
    this.sendToClient(client, {
      type: 'error',
      data: { error, timestamp: new Date() }
    })
  }

  /**
   * Broadcast message to multiple clients
   */
  public broadcast(userIds: string[], message: any): void {
    userIds.forEach(userId => {
      const userClients = Array.from(this.clients.values())
        .filter(client => client.userId === userId)

      userClients.forEach(client => {
        this.sendToClient(client, message)
      })
    })
  }

  /**
   * Setup event subscriptions
   */
  private setupEventSubscriptions(): void {
    // Subscribe to match events
    this.eventStream.subscribe(
      { types: ['match_created', 'match_updated', 'match_accepted', 'match_rejected'] },
      (event) => {
        this.handleMatchEvent(event)
      }
    )

    // Subscribe to application events
    this.eventStream.subscribe(
      { types: ['application_submitted', 'application_viewed', 'application_shortlisted', 'application_rejected'] },
      (event) => {
        this.handleApplicationEvent(event)
      }
    )

    // Subscribe to recommendation events
    this.eventStream.subscribe(
      { types: ['recommendation_generated', 'recommendation_updated'] },
      (event) => {
        this.handleRecommendationEvent(event)
      }
    )
  }

  /**
   * Handle match events
   */
  private handleMatchEvent(event: any): void {
    const { candidateId, employerId } = event.data

    // Send to candidate
    this.broadcast([candidateId], {
      type: 'match_update',
      data: event.data
    })

    // Send to employer
    this.broadcast([employerId], {
      type: 'match_update',
      data: event.data
    })
  }

  /**
   * Handle application events
   */
  private handleApplicationEvent(event: any): void {
    const { candidateId, employerId } = event.data

    // Send to candidate
    this.broadcast([candidateId], {
      type: 'application_update',
      data: event.data
    })

    // Send to employer
    this.broadcast([employerId], {
      type: 'application_update',
      data: event.data
    })
  }

  /**
   * Handle recommendation events
   */
  private handleRecommendationEvent(event: any): void {
    const { userId } = event.data

    this.broadcast([userId], {
      type: 'recommendation_update',
      data: event.data
    })
  }

  /**
   * Start heartbeat for connection health
   */
  private startHeartbeat(interval: number): void {
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach(client => {
        if (client.socket.readyState === WebSocket.OPEN) {
          client.socket.ping()
        } else {
          // Remove dead connections
          this.clients.delete(client.id)
        }
      })
    }, interval)
  }

  /**
   * Flush message queue for user
   */
  private flushMessageQueue(userId: string): void {
    const queue = this.messageQueue.get(userId)
    if (queue && queue.length > 0) {
      const userClients = Array.from(this.clients.values())
        .filter(client => client.userId === userId)

      if (userClients.length > 0) {
        queue.forEach(message => {
          this.broadcast([userId], message)
        })
        this.messageQueue.delete(userId)
      }
    }
  }

  /**
   * Queue message for offline user
   */
  public queueMessage(userId: string, message: any): void {
    if (!this.messageQueue.has(userId)) {
      this.messageQueue.set(userId, [])
    }

    const queue = this.messageQueue.get(userId)!
    queue.push({
      id: this.generateMessageId(),
      ...message,
      timestamp: new Date()
    })

    // Limit queue size
    if (queue.length > 50) {
      queue.splice(0, queue.length - 50)
    }
  }

  /**
   * Validate authentication token
   */
  private async validateAuthentication(token: string, userId: string): Promise<boolean> {
    // Implement your authentication logic here
    // This would typically validate the JWT token against your auth service
    try {
      // Mock validation - replace with actual implementation
      return token.length > 10 && userId.length > 0
    } catch (error) {
      logger.error('Authentication validation error', { error })
      return false
    }
  }

  /**
   * Get server statistics
   */
  public getStats(): {
    connectedClients: number
    totalSubscriptions: number
    messageQueueSize: number
    uptime: number
  } {
    return {
      connectedClients: this.clients.size,
      totalSubscriptions: this.subscriptions.size,
      messageQueueSize: Array.from(this.messageQueue.values())
        .reduce((total, queue) => total + queue.length, 0),
      uptime: process.uptime()
    }
  }

  /**
   * Get client information
   */
  public getClient(clientId: string): SocketClient | undefined {
    return this.clients.get(clientId)
  }

  /**
   * Get all connected clients
   */
  public getAllClients(): SocketClient[] {
    return Array.from(this.clients.values())
  }

  /**
   * Disconnect client
   */
  public disconnectClient(clientId: string, reason?: string): boolean {
    const client = this.clients.get(clientId)
    if (client) {
      client.socket.close(1000, reason || 'Disconnected by server')
      return true
    }
    return false
  }

  /**
   * Graceful shutdown
   */
  public async shutdown(): Promise<void> {
    logger.info('Shutting down WebSocket server')

    // Stop heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }

    // Close all connections
    this.clients.forEach(client => {
      client.socket.close(1001, 'Server shutting down')
    })
    this.clients.clear()

    // Close server
    this.wss.close()

    logger.info('WebSocket server shutdown complete')
  }

  // ID generators
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}