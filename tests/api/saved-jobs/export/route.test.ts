import { NextRequest } from 'next/server'
import { POST } from '@/app/api/saved-jobs/export/route'
import { getServerSession } from 'next-auth'
import { db } from '@/lib/db'
import { UserRole } from '@/types/roles'

// Mock dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}))

jest.mock('@/lib/auth', () => ({
  authOptions: {}
}))

jest.mock('@/lib/db', () => ({
  jobSeekerProfile: {
    findUnique: jest.fn()
  },
  savedJob: {
    findMany: jest.fn()
  }
}))

describe('/api/saved-jobs/export', () => {
  const mockSession = {
    user: {
      id: 'user123',
      role: UserRole.JOB_SEEKER
    }
  }

  const mockJobSeekerProfile = {
    userUid: 'user123'
  }

  const mockSavedJobs = [
    {
      id: '1',
      jobSeekerProfileId: 'user123',
      jobId: 'job1',
      savedAt: new Date('2024-01-15'),
      notes: 'Interesting role',
      status: 'saved',
      job: {
        jobId: 'job1',
        title: 'Software Developer',
        company: { name: 'Tech Corp' },
        city: 'Cape Town',
        province: 'Western Cape',
        salaryMin: 50000,
        salaryMax: 70000,
        salaryCurrency: 'ZAR',
        positionType: 'Full-time',
        remotePolicy: 'remote',
        description: 'Job description',
        requirements: ['React', 'Node.js'],
        benefits: ['Health insurance'],
        createdAt: new Date('2024-01-10')
      }
    },
    {
      id: '2',
      jobSeekerProfileId: 'user123',
      jobId: 'job2',
      savedAt: new Date('2024-01-14'),
      notes: 'Applied position',
      status: 'applied',
      job: {
        jobId: 'job2',
        title: 'Product Manager',
        company: { name: 'StartupXYZ' },
        city: 'Johannesburg',
        province: 'Gauteng',
        salaryMin: 60000,
        salaryMax: 80000,
        salaryCurrency: 'ZAR',
        positionType: 'Full-time',
        remotePolicy: 'hybrid',
        description: 'Product management role',
        requirements: ['Product strategy', 'Analytics'],
        benefits: ['Flexible hours'],
        createdAt: new Date('2024-01-08')
      }
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
  })

  describe('POST /api/saved-jobs/export', () => {
    it('exports saved jobs as CSV format', async () => {
      ;(db.jobSeekerProfile.findUnique as jest.Mock).mockResolvedValue(mockJobSeekerProfile)
      ;(db.savedJob.findMany as jest.Mock).mockResolvedValue(mockSavedJobs)

      const requestBody = {
        format: 'csv',
        jobIds: ['job1', 'job2']
      }

      const request = new NextRequest('http://localhost:3000/api/saved-jobs/export', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('text/csv')
      expect(response.headers.get('Content-Disposition')).toContain('attachment')
      expect(response.headers.get('Content-Disposition')).toContain('saved-jobs-')
      expect(response.headers.get('Content-Disposition')).toContain('.csv')

      const csvContent = await response.text()
      expect(csvContent).toContain('Job Title,Company,Location')
      expect(csvContent).toContain('Software Developer,Tech Corp')
      expect(csvContent).toContain('Product Manager,StartupXYZ')
    })

    it('exports saved jobs as JSON format', async () => {
      ;(db.jobSeekerProfile.findUnique as jest.Mock).mockResolvedValue(mockJobSeekerProfile)
      ;(db.savedJob.findMany as jest.Mock).mockResolvedValue(mockSavedJobs)

      const requestBody = {
        format: 'json',
        jobIds: ['job1', 'job2']
      }

      const request = new NextRequest('http://localhost:3000/api/saved-jobs/export', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(2)
      expect(data.data[0]).toMatchObject({
        id: 'job1',
        title: 'Software Developer',
        company: 'Tech Corp'
      })
      expect(data.totalJobs).toBe(2)
      expect(data.exportedAt).toBeDefined()
    })

    it('exports all saved jobs when no jobIds provided', async () => {
      ;(db.jobSeekerProfile.findUnique as jest.Mock).mockResolvedValue(mockJobSeekerProfile)
      ;(db.savedJob.findMany as jest.Mock).mockResolvedValue(mockSavedJobs)

      const requestBody = {
        format: 'csv'
      }

      const request = new NextRequest('http://localhost:3000/api/saved-jobs/export', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(db.savedJob.findMany).toHaveBeenCalledWith({
        where: {
          jobSeekerProfileId: 'user123'
        },
        include: expect.any(Object),
        orderBy: { savedAt: 'desc' }
      })
    })

    it('exports specific jobs when jobIds provided', async () => {
      ;(db.jobSeekerProfile.findUnique as jest.Mock).mockResolvedValue(mockJobSeekerProfile)
      ;(db.savedJob.findMany as jest.Mock).mockResolvedValue([mockSavedJobs[0]])

      const requestBody = {
        format: 'csv',
        jobIds: ['job1']
      }

      const request = new NextRequest('http://localhost:3000/api/saved-jobs/export', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(db.savedJob.findMany).toHaveBeenCalledWith({
        where: {
          jobSeekerProfileId: 'user123',
          jobId: { in: ['job1'] }
        },
        include: expect.any(Object),
        orderBy: { savedAt: 'desc' }
      })
    })

    it('handles CSV escaping for special characters', async () => {
      const mockJobWithQuotes = {
        ...mockSavedJobs[0],
        job: {
          ...mockSavedJobs[0].job,
          title: 'Software "Senior" Developer',
          company: { name: 'Tech & "Advanced" Corp' }
        }
      }

      ;(db.jobSeekerProfile.findUnique as jest.Mock).mockResolvedValue(mockJobSeekerProfile)
      ;(db.savedJob.findMany as jest.Mock).mockResolvedValue([mockJobWithQuotes])

      const requestBody = {
        format: 'csv'
      }

      const request = new NextRequest('http://localhost:3000/api/saved-jobs/export', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)
      const csvContent = await response.text()

      expect(csvContent).toContain('Software ""Senior"" Developer')
      expect(csvContent).toContain('Tech & ""Advanced"" Corp')
    })

    it('returns empty results when no saved jobs found', async () => {
      ;(db.jobSeekerProfile.findUnique as jest.Mock).mockResolvedValue(mockJobSeekerProfile)
      ;(db.savedJob.findMany as jest.Mock).mockResolvedValue([])

      const requestBody = {
        format: 'csv'
      }

      const request = new NextRequest('http://localhost:3000/api/saved-jobs/export', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)
      const csvContent = await response.text()

      expect(response.status).toBe(200)
      expect(csvContent).toContain('Job Title,Company,Location')
      // Should only contain headers, no data rows
    })

    it('returns 400 for invalid format', async () => {
      const requestBody = {
        format: 'invalid'
      }

      const request = new NextRequest('http://localhost:3000/api/saved-jobs/export', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid format')
    })

    it('returns 400 when format is missing', async () => {
      const requestBody = {}

      const request = new NextRequest('http://localhost:3000/api/saved-jobs/export', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid format')
    })

    it('returns 401 for unauthenticated users', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const requestBody = {
        format: 'csv'
      }

      const request = new NextRequest('http://localhost:3000/api/saved-jobs/export', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('returns 403 for non-seeker users', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user123', role: UserRole.EMPLOYER }
      })

      const requestBody = {
        format: 'csv'
      }

      const request = new NextRequest('http://localhost:3000/api/saved-jobs/export', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)

      expect(response.status).toBe(403)
    })

    it('returns empty data when job seeker profile does not exist', async () => {
      ;(db.jobSeekerProfile.findUnique as jest.Mock).mockResolvedValue(null)

      const requestBody = {
        format: 'csv'
      }

      const request = new NextRequest('http://localhost:3000/api/saved-jobs/export', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      const csvContent = await response.text()
      expect(csvContent).toContain('Job Title,Company,Location')
    })

    it('handles database errors gracefully', async () => {
      ;(db.jobSeekerProfile.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))

      const requestBody = {
        format: 'csv'
      }

      const request = new NextRequest('http://localhost:3000/api/saved-jobs/export', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Failed to export saved jobs')
    })
  })
})