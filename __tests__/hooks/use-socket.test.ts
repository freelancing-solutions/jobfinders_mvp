import { renderHook, act, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useSocket, useApplicationSocket } from '@/hooks/use-socket'
import { io } from 'socket.io-client'

// Mock socket.io-client
jest.mock('socket.io-client')

// Mock next-auth
jest.mock('next-auth/react')

describe('useSocket', () => {
  const mockSocket = {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    connect: jest.fn(),
    connected: true,
  }

  const mockSession = {
    user: {
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'SEEKER',
    },
    expires: '2024-12-31',
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock useSession
    ;(useSession as jest.Mock).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    })

    // Mock io
    ;(io as jest.Mock).mockReturnValue(mockSocket)
  })

  it('should not connect socket when user is not authenticated', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    const { result } = renderHook(() => useSocket())

    expect(io).not.toHaveBeenCalled()
    expect(result.current.socket).toBeNull()
    expect(result.current.isConnected).toBe(false)
  })

  it('should connect socket when user is authenticated', () => {
    const { result } = renderHook(() => useSocket({ autoConnect: true }))

    expect(io).toHaveBeenCalledWith('/applications', {
      path: '/api/socketio',
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: {
        userId: 'user-123',
        sessionToken: 'john@example.com',
      },
    })

    expect(result.current.socket).toBe(mockSocket)
  })

  it('should set up event listeners on socket connection', () => {
    renderHook(() => useSocket())

    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function))
    expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function))
    expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function))
    expect(mockSocket.on).toHaveBeenCalledWith('reconnect', expect.any(Function))
    expect(mockSocket.on).toHaveBeenCalledWith('reconnect_error', expect.any(Function))
    expect(mockSocket.on).toHaveBeenCalledWith('reconnect_failed', expect.any(Function))
  })

  it('should handle socket connection event', () => {
    let connectHandler: ((...args: any[]) => void) | undefined

    mockSocket.on.mockImplementation((event, handler) => {
      if (event === 'connect') {
        connectHandler = handler
      }
    })

    const { result } = renderHook(() => useSocket())

    // Simulate socket connection
    act(() => {
      connectHandler?.()
    })

    expect(result.current.isConnected).toBe(true)
    expect(result.current.isConnecting).toBe(false)
    expect(result.current.error).toBeNull()
    expect(mockSocket.emit).toHaveBeenCalledWith('join_room', 'user:user-123')
  })

  it('should handle socket disconnect event', () => {
    let disconnectHandler: ((...args: any[]) => void) | undefined

    mockSocket.on.mockImplementation((event, handler) => {
      if (event === 'disconnect') {
        disconnectHandler = handler
      }
    })

    const { result } = renderHook(() => useSocket())

    // First simulate connection
    act(() => {
      const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')?.[1]
      connectHandler?.()
    })

    expect(result.current.isConnected).toBe(true)

    // Then simulate disconnection
    act(() => {
      disconnectHandler?.('io server disconnect')
    })

    expect(result.current.isConnected).toBe(false)
  })

  it('should handle socket connection error', () => {
    let errorHandler: ((...args: any[]) => void) | undefined

    mockSocket.on.mockImplementation((event, handler) => {
      if (event === 'connect_error') {
        errorHandler = handler
      }
    })

    const { result } = renderHook(() => useSocket())

    // Simulate connection error
    act(() => {
      errorHandler?.(new Error('Connection failed'))
    })

    expect(result.current.isConnected).toBe(false)
    expect(result.current.isConnecting).toBe(false)
    expect(result.current.error).toBe('Connection failed')
  })

  it('should cleanup socket on unmount', () => {
    const { unmount } = renderHook(() => useSocket())

    unmount()

    expect(mockSocket.removeAllListeners).toHaveBeenCalled()
    expect(mockSocket.disconnect).toHaveBeenCalled()
  })

  it('should provide manual reconnect functionality', () => {
    const { result } = renderHook(() => useSocket())

    mockSocket.connected = false

    act(() => {
      result.current.reconnect()
    })

    expect(mockSocket.connect).toHaveBeenCalled()
  })

  it('should provide manual disconnect functionality', () => {
    const { result } = renderHook(() => useSocket())

    act(() => {
      result.current.disconnect()
    })

    expect(mockSocket.disconnect).toHaveBeenCalled()
  })

  it('should use custom options when provided', () => {
    const customOptions = {
      autoConnect: true,
      reconnection: false,
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
    }

    renderHook(() => useSocket(customOptions))

    expect(io).toHaveBeenCalledWith('/applications', {
      path: '/api/socketio',
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      reconnection: false,
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
      auth: {
        userId: 'user-123',
        sessionToken: 'john@example.com',
      },
    })
  })
})

describe('useApplicationSocket', () => {
  const mockSocket = {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    connect: jest.fn(),
    connected: true,
  }

  const mockSession = {
    user: {
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'SEEKER',
    },
    expires: '2024-12-31',
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock useSession
    ;(useSession as jest.Mock).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    })

    // Mock io
    ;(io as jest.Mock).mockReturnValue(mockSocket)
  })

  it('should listen to application-specific events', () => {
    renderHook(() => useApplicationSocket())

    expect(mockSocket.on).toHaveBeenCalledWith('application:status_updated', expect.any(Function))
    expect(mockSocket.on).toHaveBeenCalledWith('application:created', expect.any(Function))
    expect(mockSocket.on).toHaveBeenCalledWith('application:interview_scheduled', expect.any(Function))
  })

  it('should handle application status update events', () => {
    let statusUpdateHandler: ((...args: any[]) => void) | undefined

    mockSocket.on.mockImplementation((event, handler) => {
      if (event === 'application:status_updated') {
        statusUpdateHandler = handler
      }
    })

    const { result } = renderHook(() => useApplicationSocket())

    // Simulate status update event
    const updateData = {
      applicationId: 'app-123',
      status: 'interview_scheduled',
      timestamp: '2024-01-15T10:00:00Z',
    }

    act(() => {
      statusUpdateHandler?.(updateData)
    })

    expect(result.current.lastUpdate).toBe('2024-01-15T10:00:00Z')
    expect(result.current.notifications).toHaveLength(1)
    expect(result.current.notifications[0]).toMatchObject({
      type: 'status_update',
      message: 'Application status updated to interview_scheduled',
      data: updateData,
    })
  })

  it('should handle new application events', () => {
    let newApplicationHandler: ((...args: any[]) => void) | undefined

    mockSocket.on.mockImplementation((event, handler) => {
      if (event === 'application:created') {
        newApplicationHandler = handler
      }
    })

    const { result } = renderHook(() => useApplicationSocket())

    // Simulate new application event
    const applicationData = {
      applicationId: 'app-456',
      jobTitle: 'Software Engineer',
      timestamp: '2024-01-15T11:00:00Z',
    }

    act(() => {
      newApplicationHandler?.(applicationData)
    })

    expect(result.current.lastUpdate).toBe('2024-01-15T11:00:00Z')
    expect(result.current.notifications).toHaveLength(1)
    expect(result.current.notifications[0]).toMatchObject({
      type: 'new_application',
      message: 'New application submitted for Software Engineer',
      data: applicationData,
    })
  })

  it('should handle interview scheduled events', () => {
    let interviewHandler: ((...args: any[]) => void) | undefined

    mockSocket.on.mockImplementation((event, handler) => {
      if (event === 'application:interview_scheduled') {
        interviewHandler = handler
      }
    })

    const { result } = renderHook(() => useApplicationSocket())

    // Simulate interview scheduled event
    const interviewData = {
      applicationId: 'app-789',
      jobTitle: 'Frontend Developer',
      timestamp: '2024-01-15T12:00:00Z',
    }

    act(() => {
      interviewHandler?.(interviewData)
    })

    expect(result.current.lastUpdate).toBe('2024-01-15T12:00:00Z')
    expect(result.current.notifications).toHaveLength(1)
    expect(result.current.notifications[0]).toMatchObject({
      type: 'interview_scheduled',
      message: 'Interview scheduled for Frontend Developer',
      data: interviewData,
    })
  })

  it('should limit notifications to last 10', () => {
    let statusUpdateHandler: ((...args: any[]) => void) | undefined

    mockSocket.on.mockImplementation((event, handler) => {
      if (event === 'application:status_updated') {
        statusUpdateHandler = handler
      }
    })

    const { result } = renderHook(() => useApplicationSocket())

    // Simulate 15 status update events
    for (let i = 1; i <= 15; i++) {
      act(() => {
        statusUpdateHandler?.({
          applicationId: `app-${i}`,
          status: 'reviewing',
          timestamp: `2024-01-${String(i).padStart(2, '0')}T10:00:00Z`,
        })
      })
    }

    expect(result.current.notifications).toHaveLength(10)
    // Should have the 10 most recent notifications (app-15 to app-6)
    expect(result.current.notifications[0].data.applicationId).toBe('app-15')
    expect(result.current.notifications[9].data.applicationId).toBe('app-6')
  })

  it('should clear notifications', () => {
    let statusUpdateHandler: ((...args: any[]) => void) | undefined

    mockSocket.on.mockImplementation((event, handler) => {
      if (event === 'application:status_updated') {
        statusUpdateHandler = handler
      }
    })

    const { result } = renderHook(() => useApplicationSocket())

    // Add some notifications
    act(() => {
      statusUpdateHandler?.({
        applicationId: 'app-1',
        status: 'reviewing',
        timestamp: '2024-01-15T10:00:00Z',
      })
    })

    expect(result.current.notifications).toHaveLength(1)

    // Clear notifications
    act(() => {
      result.current.clearNotifications()
    })

    expect(result.current.notifications).toHaveLength(0)
  })

  it('should cleanup event listeners on unmount', () => {
    const { unmount } = renderHook(() => useApplicationSocket())

    unmount()

    expect(mockSocket.off).toHaveBeenCalledWith('application:status_updated', expect.any(Function))
    expect(mockSocket.off).toHaveBeenCalledWith('application:created', expect.any(Function))
    expect(mockSocket.off).toHaveBeenCalledWith('application:interview_scheduled', expect.any(Function))
  })
})