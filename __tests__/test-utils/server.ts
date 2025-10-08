import { setupServer } from 'msw/node'
import { rest } from 'msw'

// Create a test server for mocking API responses
export const testServer = setupServer(
  // Default handlers can be added here
  rest.get('/api/health', (req, res, ctx) => {
    return res(ctx.json({ status: 'ok' }))
  })
)

export function setupTestServer() {
  // Start the server before all tests
  beforeAll(() => {
    testServer.listen({
      onUnhandledRequest: 'error',
    })
  })

  // Reset handlers after each test
  afterEach(() => {
    testServer.resetHandlers()
  })

  return testServer
}

export function cleanupTestServer() {
  // Close the server after all tests
  afterAll(() => {
    testServer.close()
  })
}

// Helper function to create mock handlers
export function createMockHandler(path: string, response: any, status = 200) {
  return rest.get(path, (req, res, ctx) => {
    return res(
      ctx.status(status),
      ctx.json(response)
    )
  })
}

// Helper function to create error handlers
export function createErrorHandler(path: string, error: string, status = 500) {
  return rest.get(path, (req, res, ctx) => {
    return res(
      ctx.status(status),
      ctx.json({ error })
    )
  })
}

// Helper function to create delay handler
export function createDelayHandler(path: string, response: any, delay: number) {
  return rest.get(path, (req, res, ctx) => {
    return res(
      ctx.delay(delay),
      ctx.json(response)
    )
  })
}