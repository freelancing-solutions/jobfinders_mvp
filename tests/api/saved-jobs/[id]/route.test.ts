import { NextRequest } from 'next/server'
import { GET, PUT, DELETE } from '@/app/api/saved-jobs/[id]/route'
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
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
}))

describe('/api/saved-jobs/[id]', () => {
  const mockSession = {
    user: {
      id: 'user123',
      role: UserRole.JOB_SEEKER
    }
  }

  const mockJobSeekerProfile = {
    userUid: 'user123'
  }

  const mockSavedJob = {
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
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
  })

  describe('GET /api/saved-jobs/[id]', () => {
    it('returns saved job details for authenticated seeker', async () => {
      ;(db.jobSeekerProfile.findUnique as jest.Mock).mockResolvedValue(mockJobSeekerProfile)
      ;(db.savedJob.findUnique as jest.Mock).mockResolvedValue(mockSavedJob)

      const request = new NextRequest('http://localhost:3000/api/saved-jobs/job1')
      const response = await GET(request, { params: { id: 'job1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toMatchObject({
        id: 'job1',
        title: 'Software Developer',
        company: 'Tech Corp',
        location: 'Cape Town, Western Cape',
        salaryMin: 50000,
        salaryMax: 70000,
        currency: 'ZAR'
      })
    })

    it('returns 404 when saved job does not exist', async () => {
      ;(db.jobSeekerProfile.findUnique as jest.Mock).mockResolvedValue(mockJobSeekerProfile)
      ;(db.savedJob.findUnique as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/saved-jobs/nonexistent')
      const response = await GET(request, { params: { id: 'nonexistent' } })

      expect(response.status).toBe(404)
    })

    it('returns 404 when job seeker profile does not exist', async () => {
      ;(db.jobSeekerProfile.findUnique as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/saved-jobs/job1')
      const response = await GET(request, { params: { id: 'job1' } })

      expect(response.status).toBe(404)
    })

    it('returns 401 for unauthenticated users', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/saved-jobs/job1')
      const response = await GET(request, { params: { id: 'job1' } })

      expect(response.status).toBe(401)
    })

    it('returns 403 for non-seeker users', async () => {
       ;(getServerSession as jest.Mock).mockResolvedValue({
         user: { id: 'user123', role: UserRole.EMPLOYER }
       })

      const request = new NextRequest('http://localhost:3000/api/saved-jobs/job1')
      const response = await GET(request, { params: { id: 'job1' } })

      expect(response.status).toBe(403)
    })
  })

  describe('PUT /api/saved-jobs/[id]', () => {
    it('updates saved job successfully', async () => {
      ;(db.jobSeekerProfile.findUnique as jest.Mock).mockResolvedValue(mockJobSeekerProfile)
      ;(db.savedJob.findUnique as jest.Mock).mockResolvedValue(mockSavedJob)
      ;(db.savedJob.update as jest.Mock).mockResolvedValue({
        ...mockSavedJob,
        status: 'applied',
        notes: 'Updated notes'
      })

      const requestBody = {
        status: 'applied',
        notes: 'Updated notes'
      }

      const request = new NextRequest('http://localhost:3000/api/saved-jobs/job1', {
        method: 'PUT',
        body: JSON.stringify(requestBody)
      })

      const response = await PUT(request, { params: { id: 'job1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Saved job updated successfully')
      expect(db.savedJob.update).toHaveBeenCalledWith({
        where: {
          jobSeekerProfileId_jobId: {
            jobSeekerProfileId: 'user123',
            jobId: 'job1'
          }
        },
        data: {
          status: 'applied',
          notes: 'Updated notes'
        }
      })
    })

    it('updates only provided fields', async () => {
      ;(db.jobSeekerProfile.findUnique as jest.Mock).mockResolvedValue(mockJobSeekerProfile)
      ;(db.savedJob.findUnique as jest.Mock).mockResolvedValue(mockSavedJob)
      ;(db.savedJob.update as jest.Mock).mockResolvedValue(mockSavedJob)

      const requestBody = {
        status: 'applied'
      }

      const request = new NextRequest('http://localhost:3000/api/saved-jobs/job1', {
        method: 'PUT',
        body: JSON.stringify(requestBody)
      })

      const response = await PUT(request, { params: { id: 'job1' } })

      expect(response.status).toBe(200)
      expect(db.savedJob.update).toHaveBeenCalledWith({
        where: {
          jobSeekerProfileId_jobId: {
            jobSeekerProfileId: 'user123',
            jobId: 'job1'
          }
        },
        data: {
          status: 'applied'
        }
      })
    })

    it('returns 404 when saved job does not exist', async () => {
      ;(db.jobSeekerProfile.findUnique as jest.Mock).mockResolvedValue(mockJobSeekerProfile)
      ;(db.savedJob.findUnique as jest.Mock).mockResolvedValue(null)

      const requestBody = {
        status: 'applied'
      }

      const request = new NextRequest('http://localhost:3000/api/saved-jobs/nonexistent', {
        method: 'PUT',
        body: JSON.stringify(requestBody)
      })

      const response = await PUT(request, { params: { id: 'nonexistent' } })

      expect(response.status).toBe(404)
    })

    it('returns 401 for unauthenticated users', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const requestBody = {
        status: 'applied'
      }

      const request = new NextRequest('http://localhost:3000/api/saved-jobs/job1', {
        method: 'PUT',
        body: JSON.stringify(requestBody)
      })

      const response = await PUT(request, { params: { id: 'job1' } })

      expect(response.status).toBe(401)
    })

    it('returns 403 for non-seeker users', async () => {
       ;(getServerSession as jest.Mock).mockResolvedValue({
         user: { id: 'user123', role: UserRole.EMPLOYER }
       })

      const requestBody = {
        status: 'applied'
      }

      const request = new NextRequest('http://localhost:3000/api/saved-jobs/job1', {
        method: 'PUT',
        body: JSON.stringify(requestBody)
      })

      const response = await PUT(request, { params: { id: 'job1' } })

      expect(response.status).toBe(403)
    })
  })

  describe('DELETE /api/saved-jobs/[id]', () => {
    it('removes saved job successfully', async () => {
      ;(db.jobSeekerProfile.findUnique as jest.Mock).mockResolvedValue(mockJobSeekerProfile)
      ;(db.savedJob.findUnique as jest.Mock).mockResolvedValue(mockSavedJob)
      ;(db.savedJob.delete as jest.Mock).mockResolvedValue(mockSavedJob)

      const request = new NextRequest('http://localhost:3000/api/saved-jobs/job1', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { id: 'job1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Saved job removed successfully')
      expect(db.savedJob.delete).toHaveBeenCalledWith({
        where: {
          jobSeekerProfileId_jobId: {
            jobSeekerProfileId: 'user123',
            jobId: 'job1'
          }
        }
      })
    })

    it('returns 404 when saved job does not exist', async () => {
      ;(db.jobSeekerProfile.findUnique as jest.Mock).mockResolvedValue(mockJobSeekerProfile)
      ;(db.savedJob.findUnique as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/saved-jobs/nonexistent', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { id: 'nonexistent' } })

      expect(response.status).toBe(404)
    })

    it('returns 401 for unauthenticated users', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/saved-jobs/job1', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { id: 'job1' } })

      expect(response.status).toBe(401)
    })

    it('returns 403 for non-seeker users', async () => {
       ;(getServerSession as jest.Mock).mockResolvedValue({
         user: { id: 'user123', role: UserRole.EMPLOYER }
       })

      const request = new NextRequest('http://localhost:3000/api/saved-jobs/job1', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { id: 'job1' } })

      expect(response.status).toBe(403)
    })
  })
})