import { NextRequest } from 'next/server'
import { WebSocketServer, WebSocket } from 'ws'
import { NextApiResponse } from 'next'

export const runtime = 'nodejs'

// WebSocket connections storage
const connections = new Map<string, WebSocket>()

// Store user connections
const userConnections = new Map<string, Set<string>>()

interface WebSocketMessage {
  type: string
  data: any
  timestamp: string
  userId?: string
}

interface ApplicationUpdateMessage {
  type: 'application:status_changed' | 'application:view_updated' | 'application:feedback_added' | 'application:interview_scheduled' | 'application:note_added' | 'application:reminder_triggered'
  applicationId: string
  timestamp: string
  data: any
  userId?: string
}

// This is a placeholder implementation
// In a real application, you would need to set up a proper WebSocket server
export async function GET(request: NextRequest) {
  // This would normally set up a WebSocket upgrade
  // However, Next.js API routes don't directly support WebSocket upgrades
  // You would typically handle this in a separate WebSocket server

  return new Response('WebSocket endpoint', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  })
}

// Placeholder WebSocket server setup
// In a real implementation, this would be in a separate server file
export class ApplicationWebSocketHandler {
  private wss: WebSocketServer | null = null

  constructor() {
    // This would normally be set up with a proper HTTP server
    // For now, we'll provide the structure
  }

  // Handle WebSocket connection
  handleConnection(ws: WebSocket, userId: string) {
    const connectionId = `${userId}-${Date.now()}`

    connections.set(connectionId, ws)

    if (!userConnections.has(userId)) {
      userConnections.set(userId, new Set())
    }
    userConnections.get(userId)!.add(connectionId)

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connection:established',
      data: { connectionId, userId },
      timestamp: new Date().toISOString()
    }))

    // Handle incoming messages
    ws.on('message', (data: Buffer) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString())
        this.handleMessage(connectionId, userId, message)
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    })

    // Handle disconnection
    ws.on('close', () => {
      connections.delete(connectionId)
      const userConnSet = userConnections.get(userId)
      if (userConnSet) {
        userConnSet.delete(connectionId)
        if (userConnSet.size === 0) {
          userConnections.delete(userId)
        }
      }
    })

    // Handle errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error)
      connections.delete(connectionId)
    })
  }

  // Handle incoming messages
  private handleMessage(connectionId: string, userId: string, message: WebSocketMessage) {
    switch (message.type) {
      case 'ping':
        this.sendToConnection(connectionId, {
          type: 'pong',
          data: { timestamp: new Date().toISOString() },
          timestamp: new Date().toISOString()
        })
        break

      case 'subscribe':
        // Handle subscription to specific application updates
        if (message.data.applicationId) {
          // Add connection to application-specific subscription
          // This would typically involve Redis or another pub/sub system
        }
        break

      case 'unsubscribe':
        // Handle unsubscription
        break

      default:
        console.log('Unknown message type:', message.type)
    }
  }

  // Send message to specific connection
  sendToConnection(connectionId: string, message: any) {
    const ws = connections.get(connectionId)
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
    }
  }

  // Send message to all connections for a user
  sendToUser(userId: string, message: any) {
    const userConnSet = userConnections.get(userId)
    if (userConnSet) {
      userConnSet.forEach(connectionId => {
        this.sendToConnection(connectionId, message)
      })
    }
  }

  // Send application update to relevant users
  sendApplicationUpdate(message: ApplicationUpdateMessage) {
    // Send to the application owner
    if (message.userId) {
      this.sendToUser(message.userId, message)
    }

    // In a real implementation, you would also send to:
    // - Company/employer users
    // - Admin users
    // - Other relevant parties
  }

  // Broadcast message to all connected users
  broadcast(message: any) {
    connections.forEach((ws, connectionId) => {
      this.sendToConnection(connectionId, message)
    })
  }

  // Get connection statistics
  getStats() {
    return {
      totalConnections: connections.size,
      uniqueUsers: userConnections.size,
      connectionsByUser: Array.from(userConnections.entries()).map(([userId, conns]) => ({
        userId,
        connectionCount: conns.size
      }))
    }
  }
}

// Create singleton instance
export const wsHandler = new ApplicationWebSocketHandler()

// Export for use in other parts of the application
export function sendApplicationUpdate(update: ApplicationUpdateMessage) {
  wsHandler.sendApplicationUpdate(update)
}

// Health check for WebSocket service
export async function checkWebSocketHealth() {
  const stats = wsHandler.getStats()
  return {
    status: 'healthy',
    connections: stats.totalConnections,
    users: stats.uniqueUsers,
    timestamp: new Date().toISOString()
  }
}