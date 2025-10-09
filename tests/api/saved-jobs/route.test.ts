import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/saved-jobs/route'
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
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn()
  },
  job: {
    findUnique: jest.fn()
  }
}))

describe('/api/saved-jobs', () => {
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
        remotePolicy: 'remote'
      }
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
  })

  describe('GET /api/saved-jobs', () => {
    it('returns saved jobs for authenticated seeker', async () => {
      ;(db.jobSeekerProfile.findUnique as jest.Mock).mockResolvedValue(mockJobSeekerProfile)
      ;(db.savedJob.findMany as jest.Mock).mockResolvedValue(mockSavedJobs)

      const request = new NextRequest('http://localhost:3000/api/saved-jobs')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(data.data[0]).toMatchObject({
        id: 'job1',
        title: 'Software Developer',
        company: 'Tech Corp',
        location: 'Cape Town, Western Cape'
      })
    })

    it('returns empty array when no job seeker profile exists', async () => {
      ;(db.jobSeekerProfile.findUnique as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/saved-jobs')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual([])
    })

    it('returns 401 for unauthenticated users', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/saved-jobs')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    it('returns 403 for non-seeker users', async () => {
       ;(getServerSession as jest.Mock).mockResolvedValue({
         user: { id: 'user123', role: UserRole.EMPLOYER }
       })

      const request = new NextRequest('http://localhost:3000/api/saved-jobs')
      const response = await GET(request)

      expect(response.status).toBe(403)
    })

    it('handles database errors gracefully', async () => {
      ;(db.jobSeekerProfile.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/saved-jobs')
      const response = await GET(request)

      expect(response.status).toBe(500)
    })
  })

  describe('POST /api/saved-jobs', () => {
    const mockJob = {
      jobId: 'job1',
      title: 'Software Developer'
    }

    it('saves a job successfully', async () => {
      ;(db.jobSeekerProfile.findUnique as jest.Mock).mockResolvedValue(mockJobSeekerProfile)
      ;(db.job.findUnique as jest.Mock).mockResolvedValue(mockJob)
      ;(db.savedJob.findUnique as jest.Mock).mockResolvedValue(null) // Not already saved
      ;(db.savedJob.create as jest.Mock).mockResolvedValue({
        id: '1',
        jobSeekerProfileId: 'user123',
        jobId: 'job1'
      })

      const requestBody = {
        jobId: 'job1',
        notes: 'Interesting role'
      }

      const request = new NextRequest('http://localhost:3000/api/saved-jobs', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Job saved successfully')
    })

    it('returns 400 when jobId is missing', async () => {
      const requestBody = {
        notes: 'Interesting role'
      }

      const request = new NextRequest('http://localhost:3000/api/saved-jobs', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('returns 404 when job does not exist', async () => {
      ;(db.jobSeekerProfile.findUnique as jest.Mock).mockResolvedValue(mockJobSeekerProfile)
      ;(db.job.findUnique as jest.Mock).mockResolvedValue(null)

      const requestBody = {
        jobId: 'nonexistent'
      }

      const request = new NextRequest('http://localhost:3000/api/saved-jobs', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)

      expect(response.status).toBe(404)
    })

    it('returns 404 when job seeker profile does not exist', async () => {
      ;(db.jobSeekerProfile.findUnique as jest.Mock).mockResolvedValue(null)
      ;(db.job.findUnique as jest.Mock).mockResolvedValue(mockJob)

      const requestBody = {
        jobId: 'job1'
      }

      const request = new NextRequest('http://localhost:3000/api/saved-jobs', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)

      expect(response.status).toBe(404)
    })

    it('returns 400 when job is already saved', async () => {
      ;(db.jobSeekerProfile.findUnique as jest.Mock).mockResolvedValue(mockJobSeekerProfile)
      ;(db.job.findUnique as jest.Mock).mockResolvedValue(mockJob)
      ;(db.savedJob.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        jobSeekerProfileId: 'user123',
        jobId: 'job1'
      })

      const requestBody = {
        jobId: 'job1'
      }

      const request = new NextRequest('http://localhost:3000/api/saved-jobs', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('returns 401 for unauthenticated users', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const requestBody = {
        jobId: 'job1'
      }

      const request = new NextRequest('http://localhost:3000/api/saved-jobs', {
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
        jobId: 'job1'
      }

      const request = new NextRequest('http://localhost:3000/api/saved-jobs', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)

      expect(response.status).toBe(403)
    })
  })
})