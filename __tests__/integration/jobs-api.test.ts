import { createJobsAPIClient } from '@/lib/api/jobs'
import { setupTestServer, cleanupTestServer } from '../test-utils/server'
import { Job } from '@/types/jobs'

// Test server setup
const testServer = setupTestServer()

describe('Jobs API Integration Tests', () => {
  let client: ReturnType<typeof createJobsAPIClient>

  beforeAll(() => {
    client = createJobsAPIClient({
      baseUrl: 'http://localhost:3000',
      timeout: 5000,
      retries: 1,
      enableCache: false
    })
  })

  beforeEach(() => {
    testServer.resetHandlers()
  })

  afterAll(() => {
    cleanupTestServer()
  })

  describe('searchJobs', () => {
    it('should search jobs with basic query', async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            id: 'job-1',
            title: 'Software Engineer',
            company: {
              id: 'company-1',
              name: 'Tech Corp',
              logo: null,
              isVerified: true
            },
            location: 'Cape Town',
            description: 'A great software engineering role',
            requirements: {
              essential: ['JavaScript', 'React'],
              preferred: ['TypeScript']
            },
            salary: {
              min: 500000,
              max: 800000,
              currency: 'ZAR'
            },
            type: 'full-time',
            experience: 'mid',
            remote: true,
            verified: true,
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-15T10:00:00Z',
            applicationCount: 5,
            tags: ['engineering', 'javascript']
          }
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1
        },
        facets: {
          categories: [],
          locations: [],
          types: [],
          experience: []
        }
      }

      testServer.use(
        testServer.rest.get('/api/jobs/search', (req, res, ctx) => {
          return res(ctx.json(mockResponse))
        })
      )

      const result = await client.searchJobs({ query: 'Software Engineer' })

      expect(result.jobs).toHaveLength(1)
      expect(result.jobs[0].title).toBe('Software Engineer')
      expect(result.jobs[0].company.name).toBe('Tech Corp')
      expect(result.pagination.total).toBe(1)
    })

    it('should search jobs with filters', async () => {
      const mockResponse = {
        success: true,
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        },
        facets: {
          categories: [],
          locations: [],
          types: [],
          experience: []
        }
      }

      testServer.use(
        testServer.rest.get('/api/jobs/search', (req, res, ctx) => {
          // Verify query parameters
          expect(req.url.searchParams.get('query')).toBe('React Developer')
          expect(req.url.searchParams.get('location')).toBe('Cape Town')
          expect(req.url.searchParams.get('experienceLevel')).toBe('mid')
          expect(req.url.searchParams.get('employmentType')).toBe('full-time')
          expect(req.url.searchParams.get('isRemote')).toBe('true')

          return res(ctx.json(mockResponse))
        })
      )

      const filters = {
        query: 'React Developer',
        location: 'Cape Town',
        experience: 'mid' as const,
        type: 'full-time' as const,
        remote: true
      }

      await client.searchJobs(filters)
    })

    it('should handle pagination parameters', async () => {
      const mockResponse = {
        success: true,
        data: [],
        pagination: {
          page: 2,
          limit: 20,
          total: 50,
          totalPages: 3
        },
        facets: {
          categories: [],
          locations: [],
          types: [],
          experience: []
        }
      }

      testServer.use(
        testServer.rest.get('/api/jobs/search', (req, res, ctx) => {
          expect(req.url.searchParams.get('page')).toBe('2')
          expect(req.url.searchParams.get('limit')).toBe('20')

          return res(ctx.json(mockResponse))
        })
      )

      const result = await client.searchJobs({ page: 2, limit: 20 })

      expect(result.pagination.page).toBe(2)
      expect(result.pagination.limit).toBe(20)
    })

    it('should handle API errors gracefully', async () => {
      testServer.use(
        testServer.rest.get('/api/jobs/search', (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({ error: 'Internal server error' })
          )
        })
      )

      await expect(client.searchJobs({ query: 'test' })).rejects.toThrow('Internal server error')
    })

    it('should include facets and suggestions when available', async () => {
      const mockResponse = {
        success: true,
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        },
        facets: {
          categories: [
            { name: 'Engineering', count: 15 },
            { name: 'Design', count: 8 }
          ],
          locations: [
            { name: 'Cape Town', count: 12 },
            { name: 'Johannesburg', count: 10 }
          ],
          types: [
            { name: 'full-time', count: 20 },
            { name: 'part-time', count: 3 }
          ],
          experience: [
            { name: 'mid', count: 10 },
            { name: 'senior', count: 8 }
          ]
        },
        suggestions: ['React Developer', 'Frontend Developer', 'JavaScript Developer']
      }

      testServer.use(
        testServer.rest.get('/api/jobs/search', (req, res, ctx) => {
          return res(ctx.json(mockResponse))
        })
      )

      const result = await client.searchJobs({ query: 'developer' })

      expect(result.facets.categories).toHaveLength(2)
      expect(result.facets.categories[0].name).toBe('Engineering')
      expect(result.facets.locations).toHaveLength(2)
      expect(result.facets.types).toHaveLength(2)
      expect(result.facets.experience).toHaveLength(2)
      expect(result.suggestions).toHaveLength(3)
      expect(result.suggestions[0]).toBe('React Developer')
    })
  })

  describe('getJobById', () => {
    it('should fetch job details by ID', async () => {
      const mockJob: Job = {
        id: 'job-123',
        title: 'Senior React Developer',
        company: {
          id: 'company-456',
          name: 'StartupXYZ',
          logo: 'https://example.com/logo.png',
          isVerified: true
        },
        category: {
          id: 'cat-1',
          name: 'Engineering',
          icon: '💻',
          color: '#3B82F6'
        },
        location: 'Remote',
        description: 'Looking for an experienced React developer...',
        requirements: {
          essential: ['React', 'TypeScript', 'Node.js'],
          preferred: ['GraphQL', 'AWS']
        },
        salary: {
          min: 800000,
          max: 1200000,
          currency: 'ZAR'
        },
        type: 'full-time',
        experience: 'senior',
        remote: true,
        verified: true,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        expiresAt: '2024-02-15T10:00:00Z',
        applicationCount: 12,
        tags: ['react', 'typescript', 'remote']
      }

      testServer.use(
        testServer.rest.get('/api/jobs/job-123', (req, res, ctx) => {
          return res(ctx.json(mockJob))
        })
      )

      const result = await client.getJobById('job-123')

      expect(result).toEqual(mockJob)
      expect(result?.title).toBe('Senior React Developer')
      expect(result?.company.name).toBe('StartupXYZ')
    })

    it('should return null for non-existent job', async () => {
      testServer.use(
        testServer.rest.get('/api/jobs/non-existent', (req, res, ctx) => {
          return res(
            ctx.status(404),
            ctx.json({ error: 'Job not found' })
          )
        })
      )

      const result = await client.getJobById('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('getSimilarJobs', () => {
    it('should fetch similar jobs for a given job ID', async () => {
      const mockSimilarJobs: Job[] = [
        {
          id: 'job-2',
          title: 'React Developer',
          company: {
            id: 'company-1',
            name: 'Tech Corp',
            logo: null,
            isVerified: true
          },
          location: 'Cape Town',
          description: 'Similar React position',
          requirements: {
            essential: ['React'],
            preferred: []
          },
          type: 'full-time',
          experience: 'mid',
          remote: true,
          verified: true,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
          applicationCount: 3,
          tags: ['react']
        },
        {
          id: 'job-3',
          title: 'Frontend Developer',
          company: {
            id: 'company-2',
            name: 'WebCo',
            logo: null,
            isVerified: false
          },
          location: 'Johannesburg',
          description: 'Frontend position',
          requirements: {
            essential: ['JavaScript', 'CSS'],
            preferred: ['React']
          },
          type: 'contract',
          experience: 'mid',
          remote: false,
          verified: false,
          createdAt: '2024-01-14T10:00:00Z',
          updatedAt: '2024-01-14T10:00:00Z',
          applicationCount: 7,
          tags: ['javascript', 'frontend']
        }
      ]

      testServer.use(
        testServer.rest.get('/api/jobs/job-1/similar', (req, res, ctx) => {
          return res(ctx.json({ jobs: mockSimilarJobs }))
        })
      )

      const result = await client.getSimilarJobs('job-1')

      expect(result).toHaveLength(2)
      expect(result[0].title).toBe('React Developer')
      expect(result[1].title).toBe('Frontend Developer')
    })

    it('should limit the number of similar jobs returned', async () => {
      const mockSimilarJobs = Array.from({ length: 10 }, (_, i) => ({
        id: `job-${i}`,
        title: `Job ${i}`,
        company: {
          id: 'company-1',
          name: 'Tech Corp',
          logo: null,
          isVerified: true
        },
        location: 'Cape Town',
        description: 'Description',
        requirements: {
          essential: [],
          preferred: []
        },
        type: 'full-time',
        experience: 'mid',
        remote: true,
        verified: true,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        applicationCount: 0,
        tags: []
      }))

      testServer.use(
        testServer.rest.get('/api/jobs/job-1/similar', (req, res, ctx) => {
          const limit = req.url.searchParams.get('limit')
          expect(limit).toBe('3')
          return res(ctx.json({ jobs: mockSimilarJobs.slice(0, 3) }))
        })
      )

      const result = await client.getSimilarJobs('job-1', 3)

      expect(result).toHaveLength(3)
    })

    it('should return empty array when no similar jobs found', async () => {
      testServer.use(
        testServer.rest.get('/api/jobs/job-1/similar', (req, res, ctx) => {
          return res(ctx.json({ jobs: [] }))
        })
      )

      const result = await client.getSimilarJobs('job-1')

      expect(result).toHaveLength(0)
    })
  })

  describe('getJobSuggestions', () => {
    it('should fetch job title suggestions based on query', async () => {
      const mockSuggestions = [
        'Software Engineer',
        'Senior Software Engineer',
        'Software Developer',
        'Full Stack Developer'
      ]

      testServer.use(
        testServer.rest.get('/api/jobs/suggestions', (req, res, ctx) => {
          expect(req.url.searchParams.get('q')).toBe('software')
          return res(ctx.json({ suggestions: mockSuggestions }))
        })
      )

      const result = await client.getJobSuggestions('software')

      expect(result).toEqual(mockSuggestions)
      expect(result).toHaveLength(4)
    })

    it('should return empty array for queries with no suggestions', async () => {
      testServer.use(
        testServer.rest.get('/api/jobs/suggestions', (req, res, ctx) => {
          return res(ctx.json({ suggestions: [] }))
        })
      )

      const result = await client.getJobSuggestions('xyz123')

      expect(result).toHaveLength(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      testServer.use(
        testServer.rest.get('/api/jobs/search', (req, res, ctx) => {
          return res.networkError('Network error')
        })
      )

      await expect(client.searchJobs({ query: 'test' })).rejects.toThrow()
    })

    it('should handle timeout errors', async () => {
      const slowClient = createJobsAPIClient({
        baseUrl: 'http://localhost:3000',
        timeout: 1, // 1ms timeout
        retries: 0
      })

      testServer.use(
        testServer.rest.get('/api/jobs/search', (req, res, ctx) => {
          return res(
            ctx.delay(100), // 100ms delay
            ctx.json({ success: true, data: [], pagination: {}, facets: {} })
          )
        })
      )

      await expect(slowClient.searchJobs({ query: 'test' })).rejects.toThrow()
    })

    it('should retry failed requests', async () => {
      let requestCount = 0

      testServer.use(
        testServer.rest.get('/api/jobs/search', (req, res, ctx) => {
          requestCount++
          if (requestCount < 3) {
            return res(
              ctx.status(500),
              ctx.json({ error: 'Server error' })
            )
          }
          return res(ctx.json({
            success: true,
            data: [],
            pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
            facets: { categories: [], locations: [], types: [], experience: [] }
          }))
        })
      )

      const result = await client.searchJobs({ query: 'test' })

      expect(requestCount).toBe(3)
      expect(result.jobs).toEqual([])
    })
  })

  describe('Caching', () => {
    it('should cache responses when caching is enabled', async () => {
      const cachingClient = createJobsAPIClient({
        baseUrl: 'http://localhost:3000',
        enableCache: true,
        cacheTimeout: 1000 // 1 second
      })

      let requestCount = 0

      testServer.use(
        testServer.rest.get('/api/jobs/search', (req, res, ctx) => {
          requestCount++
          return res(ctx.json({
            success: true,
            data: [],
            pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
            facets: { categories: [], locations: [], types: [], experience: [] }
          }))
        })
      )

      // First request
      await cachingClient.searchJobs({ query: 'test' })
      expect(requestCount).toBe(1)

      // Second request should use cache
      await cachingClient.searchJobs({ query: 'test' })
      expect(requestCount).toBe(1) // Still 1, cached response was used

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 1100))

      // Third request should hit the server again
      await cachingClient.searchJobs({ query: 'test' })
      expect(requestCount).toBe(2)
    })

    it('should clear cache when requested', async () => {
      const cachingClient = createJobsAPIClient({
        baseUrl: 'http://localhost:3000',
        enableCache: true
      })

      testServer.use(
        testServer.rest.get('/api/jobs/search', (req, res, ctx) => {
          return res(ctx.json({
            success: true,
            data: [],
            pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
            facets: { categories: [], locations: [], types: [], experience: [] }
          }))
        })
      )

      // Make first request to populate cache
      await cachingClient.searchJobs({ query: 'test' })

      // Clear cache
      cachingClient.clearCache()

      // Verify cache size is 0 (this depends on implementation)
      expect(cachingClient.getCacheSize()).toBe(0)
    })
  })
})