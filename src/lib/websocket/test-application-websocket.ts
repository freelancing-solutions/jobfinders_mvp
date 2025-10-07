/**
 * Test script for Application WebSocket functionality
 * This file can be used to test the WebSocket connection and events
 */

import { setupApplicationHandlers, broadcastApplicationUpdate } from './application-socket'
import { Server } from 'socket.io'

export function testApplicationWebSocket(io: Server) {
  console.log('🧪 Testing Application WebSocket functionality...')

  // Test basic connection
  io.of('/applications').use((socket, next) => {
    console.log('✅ Socket.IO middleware test passed')
    next()
  })

  // Test rate limiting
  io.of('/applications').on('connection', (socket) => {
    let messageCount = 0

    socket.on('test:rate-limit', () => {
      messageCount++
      if (messageCount > 5) {
        socket.emit('rate-limit-test', {
          success: false,
          message: 'Rate limit triggered',
          count: messageCount
        })
      } else {
        socket.emit('rate-limit-test', {
          success: true,
          message: 'Message allowed',
          count: messageCount
        })
      }
    })

    // Test application subscription
    socket.on('test:subscribe', (applicationId: string) => {
      socket.join(`application:${applicationId}`)
      socket.emit('subscription-test', {
        success: true,
        applicationId,
        room: `application:${applicationId}`
      })

      // Simulate an update after 2 seconds
      setTimeout(() => {
        broadcastApplicationUpdate(io, applicationId, 'status_changed', {
          status: 'reviewing',
          note: 'Test automated update'
        })
      }, 2000)
    })

    // Test application status update
    socket.on('test:update-status', ({ applicationId, status, note }) => {
      // This would normally validate and update in the database
      // For testing, we'll just broadcast the update

      const validStatuses = ['applied', 'reviewing', 'shortlisted', 'interview_scheduled', 'interview_completed', 'offered', 'rejected', 'withdrawn', 'hired', 'archived']

      if (!validStatuses.includes(status)) {
        socket.emit('update-status-test', {
          success: false,
          error: 'Invalid status'
        })
        return
      }

      broadcastApplicationUpdate(io, applicationId, 'status_changed', {
        status,
        note,
        timestamp: new Date().toISOString()
      })

      socket.emit('update-status-test', {
        success: true,
        applicationId,
        status,
        note
      })
    })

    // Test note addition
    socket.on('test:add-note', ({ applicationId, content }) => {
      if (!content || content.trim().length === 0) {
        socket.emit('add-note-test', {
          success: false,
          error: 'Note content is required'
        })
        return
      }

      broadcastApplicationUpdate(io, applicationId, 'note_added', {
        note: {
          id: 'test-' + Date.now(),
          content: content.trim(),
          createdAt: new Date().toISOString(),
          createdBy: socket.userId || 'test-user'
        },
        timestamp: new Date().toISOString()
      })

      socket.emit('add-note-test', {
        success: true,
        applicationId,
        noteId: 'test-' + Date.now()
      })
    })

    // Test ping/pong
    socket.on('test:ping', () => {
      socket.emit('test:pong', {
        timestamp: new Date().toISOString(),
        latency: 0 // Would calculate actual latency in production
      })
    })

    // Send initial test message
    socket.emit('test:connected', {
      message: 'Application WebSocket test connection established',
      timestamp: new Date().toISOString(),
      availableTests: [
        'test:rate-limit',
        'test:subscribe',
        'test:update-status',
        'test:add-note',
        'test:ping'
      ]
    })
  })

  console.log('✅ Application WebSocket test handlers registered')
}

// Test data generator for development
export function generateTestApplicationData() {
  return {
    applicationId: 'test-app-' + Date.now(),
    status: 'applied',
    jobTitle: 'Software Engineer',
    companyName: 'Test Company',
    appliedAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    matchScore: 85,
    viewCount: 3
  }
}

// Export for manual testing
export const WebSocketTestCommands = {
  // Test connection
  testConnection: 'emit("test:ping")',

  // Test rate limiting
  testRateLimit: 'for(let i=0; i<10; i++) { socket.emit("test:rate-limit") }',

  // Test subscription
  testSubscription: 'socket.emit("test:subscribe", "test-app-123")',

  // Test status update
  testStatusUpdate: 'socket.emit("test:update-status", { applicationId: "test-app-123", status: "reviewing", note: "Test update" })',

  // Test note addition
  testAddNote: 'socket.emit("test:add-note", { applicationId: "test-app-123", content: "This is a test note" })',
}

// Usage example:
// import { testApplicationWebSocket, WebSocketTestCommands } from './test-application-websocket'
// testApplicationWebSocket(io)
// Then in browser console: WebSocketTestCommands.testConnection