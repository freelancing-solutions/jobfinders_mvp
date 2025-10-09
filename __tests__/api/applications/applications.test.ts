import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/applications/route'
import { getServerSession } from 'next-auth'
import { db } from '@/lib/db'
import { UserRole } from '@/types/roles'

// Mock dependencies
jest.mock('next-auth')
jest.mock('@/lib/db')

// Mock logger to avoid console output during tests
jest.mock('@/lib/logging/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}))

describe('/api/applications', () => {
  const mockSession = {
    user: {
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      role: UserRole.JOB_SEEKER,
    },
    expires: '2024-12-31',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/applications', () => {
    const mockJob = {
      jobId: 'job-123',
      title: 'Software Engineer',
      status: 'PUBLISHED',
      expiresAt: new Date('2024-12-31'),
    }

    const mockApplicationData = {
      jobId: 'job-123',
      fullName: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      location: 'San Francisco, CA',
      currentTitle: 'Software Developer',
      currentCompany: 'Tech Corp',
      experience: 'mid',
      coverLetter: 'I am excited to apply for this position...',
      availability: 'immediately',
    }

    it('should create an application successfully', async () => {
      // Mock authentication
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

      // Mock job existence check
      ;(db.job.findFirst as jest.Mock).mockResolvedValue(mockJob)

      // Mock existing application check (none exists)
      ;(db.jobApplication.findFirst as jest.Mock).mockResolvedValue(null)

      // Mock job seeker profile
      const mockProfile = {
        userUid: 'user-123',
        professionalTitle: 'Software Developer',
        location: 'San Francisco, CA',
        phone: '+1234567890',
      }
      ;(db.jobSeekerProfile.findFirst as jest.Mock).mockResolvedValue({
        ...mockProfile,
        user: { uid: 'user-123' },
      })

      // Mock application creation
      const mockCreatedApplication = {
        applicationId: 'app-123',
        jobId: 'job-123',
        jobSeekerProfileId: 'user-123',
        status: 'APPLIED',
        appliedAt: new Date(),
      }
      ;(db.jobApplication.create as jest.Mock).mockResolvedValue(mockCreatedApplication)

      // Mock job update
      ;(db.job.update as jest.Mock).mockResolvedValue({})

      // Create mock FormData
      const formData = new FormData()
      Object.entries(mockApplicationData).forEach(([key, value]) => {
        formData.append(key, value as string)
      })

      const request = new NextRequest('http://localhost:3000/api/applications', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.applicationId).toBe('app-123')
      expect(data.data.jobTitle).toBe('Software Engineer')
      expect(data.message).toBe('Application submitted successfully!')
    })

    it('should reject applications for non-existent jobs', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(db.job.findFirst as jest.Mock).mockResolvedValue(null)

      const formData = new FormData()
      Object.entries(mockApplicationData).forEach(([key, value]) => {
        formData.append(key, value as string)
      })

      const request = new NextRequest('http://localhost:3000/api/applications', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)

      expect(response.status).toBe(404)
    })

    it('should prevent duplicate applications', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(db.job.findFirst as jest.Mock).mockResolvedValue(mockJob)

      // Mock existing application
      ;(db.jobApplication.findFirst as jest.Mock).mockResolvedValue({
        applicationId: 'app-existing',
      })

      const formData = new FormData()
      Object.entries(mockApplicationData).forEach(([key, value]) => {
        formData.append(key, value as string)
      })

      const request = new NextRequest('http://localhost:3000/api/applications', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)

      expect(response.status).toBe(409)
    })

    it('should validate required fields', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

      const formData = new FormData()
      formData.append('jobId', 'job-123')
      // Missing required fields

      const request = new NextRequest('http://localhost:3000/api/applications', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should validate email format', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

      const formData = new FormData()
      Object.entries({
        ...mockApplicationData,
        email: 'invalid-email',
      }).forEach(([key, value]) => {
        formData.append(key, value as string)
      })

      const request = new NextRequest('http://localhost:3000/api/applications', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/applications', () => {
    const mockApplications = [
      {
        applicationId: 'app-1',
        jobId: 'job-1',
        jobSeekerProfileId: 'user-123',
        status: 'APPLIED',
        appliedAt: new Date('2024-01-15'),
        lastStatusUpdate: new Date('2024-01-15'),
        job: {
          jobId: 'job-1',
          title: 'Software Engineer',
          location: 'San Francisco, CA',
          salaryMin: 80000,
          salaryMax: 120000,
          currency: 'USD',
          positionType: 'full-time',
          remotePolicy: 'hybrid',
          description: 'Software engineering role',
          requirements: ['React', 'TypeScript'],
          isFeatured: true,
          isUrgent: false,
          postedAt: new Date('2024-01-10'),
          expiresAt: new Date('2024-02-10'),
          applicantCount: 10,
          company: {
            companyId: 'company-1',
            name: 'Tech Corp',
            logo: '/logo.png',
            location: 'San Francisco, CA',
          },
        },
        matchScore: 85,
      },
    ]

    it('should return applications for authenticated user', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

      // Mock total count
      ;(db.jobApplication.count as jest.Mock).mockResolvedValue(1)

      // Mock applications query
      ;(db.jobApplication.findMany as jest.Mock).mockResolvedValue(mockApplications)

      const request = new NextRequest('http://localhost:3000/api/applications?page=1&limit=20')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(data.data[0].id).toBe('app-1')
      expect(data.data[0].job.title).toBe('Software Engineer')
      expect(data.pagination.total).toBe(1)
    })

    it('should reject unauthenticated requests', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/applications')

      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    it('should apply search filters', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(db.jobApplication.count as jest.Mock).mockResolvedValue(0)
      ;(db.jobApplication.findMany as jest.Mock).mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/applications?search=engineer&status=applied')

      await GET(request)

      expect(db.jobApplication.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              expect.objectContaining({
                job: expect.objectContaining({
                  title: expect.objectContaining({
                    contains: 'engineer',
                    mode: 'insensitive',
                  }),
                }),
              }),
              expect.objectContaining({
                job: expect.objectContaining({
                  company: expect.objectContaining({
                    name: expect.objectContaining({
                      contains: 'engineer',
                      mode: 'insensitive',
                    }),
                  }),
                }),
              }),
            ],
            status: {
              in: ['applied'],
            },
          }),
        })
      )
    })

    it('should handle date range filters', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(db.jobApplication.count as jest.Mock).mockResolvedValue(0)
      ;(db.jobApplication.findMany as jest.Mock).mockResolvedValue([])

      const request = new NextRequest(
        'http://localhost:3000/api/applications?startDate=2024-01-01&endDate=2024-01-31'
      )

      await GET(request)

      expect(db.jobApplication.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            appliedAt: {
              gte: new Date('2024-01-01'),
              lte: new Date('2024-01-31'),
            },
          }),
        })
      )
    })

    it('should handle sorting parameters', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(db.jobApplication.count as jest.Mock).mockResolvedValue(0)
      ;(db.jobApplication.findMany as jest.Mock).mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/applications?sortBy=matchScore&sortOrder=desc')

      await GET(request)

      expect(db.jobApplication.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            matchScore: 'desc',
          },
        })
      )
    })

    it('should export applications as CSV', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(db.jobApplication.findMany as jest.Mock).mockResolvedValue(mockApplications)

      const request = new NextRequest('http://localhost:3000/api/applications?format=csv')

      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('text/csv')
      expect(response.headers.get('Content-Disposition')).toMatch(/applications-.*\.csv/)
    })

    it('should export applications as JSON', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(db.jobApplication.findMany as jest.Mock).mockResolvedValue(mockApplications)

      const request = new NextRequest('http://localhost:3000/api/applications?format=json')

      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('application/json')
      expect(response.headers.get('Content-Disposition')).toMatch(/applications-.*\.json/)
    })

    it('should handle pagination correctly', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(db.jobApplication.count as jest.Mock).mockResolvedValue(50)
      ;(db.jobApplication.findMany as jest.Mock).mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/applications?page=2&limit=10')

      await GET(request)

      expect(db.jobApplication.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      )
    })
  })
})