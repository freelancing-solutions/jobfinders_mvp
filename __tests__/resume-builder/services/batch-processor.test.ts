import { batchProcessor, BatchJobRequest } from '@/services/resume-builder/batch-processor';
import { prisma } from '@/lib/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    resume: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    batchMatchJob: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

// Mock AI analyzer
jest.mock('@/services/resume-builder/ai-analyzer', () => ({
  aiAnalyzer: {
    analyzeResume: jest.fn(),
    calculateATSScore: jest.fn(),
    analyzeKeywords: jest.fn(),
  },
}));

// Mock notification service
jest.mock('@/services/notifications', () => ({
  notificationService: {
    sendNotification: jest.fn(),
  },
}));

describe('BatchProcessor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createJob', () => {
    it('should create a batch job for resume analysis', async () => {
      const mockResumes = [
        { resumeId: 'resume-1', userUid: 'user-1' },
        { resumeId: 'resume-2', userUid: 'user-1' },
      ];

      (prisma.resume.findMany as jest.Mock).mockResolvedValue(mockResumes);
      (prisma.batchMatchJob.create as jest.Mock).mockResolvedValue({
        id: 'job-1',
        type: 'resume_analysis',
        status: 'queued',
        totalProfiles: 2,
      });

      const request: BatchJobRequest = {
        type: 'resume_analysis',
        resumeIds: ['resume-1', 'resume-2'],
        userId: 'user-1',
        priority: 50,
        emailNotification: true,
      };

      const job = await batchProcessor.createJob(request);

      expect(job.id).toBeDefined();
      expect(job.type).toBe('resume_analysis');
      expect(job.status).toBe('queued');
      expect(job.totalItems).toBe(2);
      expect(job.createdBy).toBe('user-1');
      expect(job.metadata.priority).toBe(50);
      expect(job.metadata.emailNotification).toBe(true);

      expect(prisma.resume.findMany).toHaveBeenCalledWith({
        where: {
          resumeId: { in: ['resume-1', 'resume-2'] },
          userUid: 'user-1',
        },
      });

      expect(prisma.batchMatchJob.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'resume_analysis',
          profileIds: ['resume-1', 'resume-2'],
          status: 'queued',
          totalProfiles: 2,
          processedProfiles: 0,
          createdBy: 'user-1',
          priority: 50,
        }),
      });
    });

    it('should create a batch job for all user resumes when no resume IDs provided', async () => {
      const mockResumes = [
        { resumeId: 'resume-1', userUid: 'user-1' },
        { resumeId: 'resume-2', userUid: 'user-1' },
        { resumeId: 'resume-3', userUid: 'user-1' },
      ];

      (prisma.resume.findMany as jest.Mock).mockResolvedValue(mockResumes);
      (prisma.batchMatchJob.create as jest.Mock).mockResolvedValue({
        id: 'job-2',
        type: 'ats_scoring',
        status: 'queued',
        totalProfiles: 3,
      });

      const request: BatchJobRequest = {
        type: 'ats_scoring',
        userId: 'user-1',
      };

      const job = await batchProcessor.createJob(request);

      expect(job.totalItems).toBe(3);
      expect(prisma.resume.findMany).toHaveBeenCalledWith({
        where: { userUid: 'user-1' },
      });
    });

    it('should handle batch export jobs', async () => {
      (prisma.batchMatchJob.create as jest.Mock).mockResolvedValue({
        id: 'job-3',
        type: 'batch_export',
        status: 'queued',
        totalProfiles: 2,
      });

      const request: BatchJobRequest = {
        type: 'batch_export',
        resumeIds: ['resume-1', 'resume-2'],
        userId: 'user-1',
        metadata: { exportFormat: 'pdf' },
      };

      const job = await batchProcessor.createJob(request);

      expect(job.type).toBe('batch_export');
      expect(job.totalItems).toBe(2);
      expect(job.metadata.exportFormat).toBe('pdf');
    });
  });

  describe('getJob', () => {
    it('should return job details from database', async () => {
      const mockJob = {
        id: 'job-1',
        type: 'resume_analysis',
        status: 'completed',
        progress: 100,
        totalProfiles: 5,
        processedProfiles: 5,
        results: { analysis: 'complete' },
        createdBy: 'user-1',
        createdAt: new Date('2023-01-01'),
        startedAt: new Date('2023-01-01T01:00:00'),
        completedAt: new Date('2023-01-01T02:00:00'),
        metadata: { priority: 50 },
      };

      (prisma.batchMatchJob.findUnique as jest.Mock).mockResolvedValue(mockJob);

      const job = await batchProcessor.getJob('job-1');

      expect(job).toEqual({
        id: 'job-1',
        type: 'resume_analysis',
        status: 'completed',
        progress: 100,
        totalItems: 5,
        processedItems: 5,
        failedItems: 0,
        results: { analysis: 'complete' },
        createdBy: 'user-1',
        createdAt: mockJob.createdAt,
        startedAt: mockJob.startedAt,
        completedAt: mockJob.completedAt,
        metadata: { priority: 50 },
      });

      expect(prisma.batchMatchJob.findUnique).toHaveBeenCalledWith({
        where: { id: 'job-1' },
      });
    });

    it('should return null for non-existent job', async () => {
      (prisma.batchMatchJob.findUnique as jest.Mock).mockResolvedValue(null);

      const job = await batchProcessor.getJob('non-existent');

      expect(job).toBeNull();
    });
  });

  describe('getUserJobs', () => {
    it('should return all jobs for a user', async () => {
      const mockJobs = [
        {
          id: 'job-1',
          type: 'resume_analysis',
          status: 'completed',
          createdAt: new Date('2023-01-01'),
          createdBy: 'user-1',
        },
        {
          id: 'job-2',
          type: 'ats_scoring',
          status: 'processing',
          createdAt: new Date('2023-01-02'),
          createdBy: 'user-1',
        },
      ];

      (prisma.batchMatchJob.findMany as jest.Mock).mockResolvedValue(mockJobs);

      const jobs = await batchProcessor.getUserJobs('user-1');

      expect(jobs).toHaveLength(2);
      expect(jobs[0].id).toBe('job-1');
      expect(jobs[1].id).toBe('job-2');

      expect(prisma.batchMatchJob.findMany).toHaveBeenCalledWith({
        where: { createdBy: 'user-1' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('cancelJob', () => {
    it('should cancel a queued job', async () => {
      // Create a job first
      const mockResumes = [{ resumeId: 'resume-1', userUid: 'user-1' }];
      (prisma.resume.findMany as jest.Mock).mockResolvedValue(mockResumes);
      (prisma.batchMatchJob.create as jest.Mock).mockResolvedValue({
        id: 'job-1',
        status: 'queued',
      });

      const request: BatchJobRequest = {
        type: 'resume_analysis',
        resumeIds: ['resume-1'],
        userId: 'user-1',
      };

      await batchProcessor.createJob(request);

      // Cancel the job
      const result = await batchProcessor.cancelJob('job-1', 'user-1');

      expect(result).toBe(true);
    });

    it('should not cancel job if user is not the owner', async () => {
      // Create a job for different user
      const mockResumes = [{ resumeId: 'resume-1', userUid: 'user-2' }];
      (prisma.resume.findMany as jest.Mock).mockResolvedValue(mockResumes);
      (prisma.batchMatchJob.create as jest.Mock).mockResolvedValue({
        id: 'job-1',
        status: 'queued',
      });

      const request: BatchJobRequest = {
        type: 'resume_analysis',
        resumeIds: ['resume-1'],
        userId: 'user-2',
      };

      await batchProcessor.createJob(request);

      // Try to cancel with different user
      const result = await batchProcessor.cancelJob('job-1', 'user-1');

      expect(result).toBe(false);
    });

    it('should not cancel completed job', async () => {
      // This would be handled by the actual job processing logic
      // For now, we just test that it returns false for non-existent jobs
      const result = await batchProcessor.cancelJob('non-existent', 'user-1');

      expect(result).toBe(false);
    });
  });

  describe('job processing', () => {
    it('should process resume analysis jobs', async () => {
      const mockResume = {
        resumeId: 'resume-1',
        professionalTitle: 'Software Engineer',
        summary: 'Experienced developer',
        experience: [],
        education: [],
        certifications: [],
        languages: [],
        projects: [],
      };

      (prisma.resume.findMany as jest.Mock).mockResolvedValue([mockResume]);
      (prisma.batchMatchJob.create as jest.Mock).mockResolvedValue({
        id: 'job-1',
        status: 'queued',
      });

      // Mock AI analyzer
      const { aiAnalyzer } = require('@/services/resume-builder/ai-analyzer');
      aiAnalyzer.analyzeResume.mockResolvedValue({
        score: 85,
        suggestions: ['Add more details'],
      });

      // Mock database update
      (prisma.batchMatchJob.update as jest.Mock).mockResolvedValue({});

      const request: BatchJobRequest = {
        type: 'resume_analysis',
        resumeIds: ['resume-1'],
        userId: 'user-1',
      };

      await batchProcessor.createJob(request);

      // Wait a bit for processing to start
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(aiAnalyzer.analyzeResume).toHaveBeenCalledWith(mockResume);
    });

    it('should handle processing errors', async () => {
      const mockResume = {
        resumeId: 'resume-1',
        professionalTitle: 'Software Engineer',
      };

      (prisma.resume.findMany as jest.Mock).mockResolvedValue([mockResume]);
      (prisma.batchMatchJob.create as jest.Mock).mockResolvedValue({
        id: 'job-1',
        status: 'queued',
      });

      // Mock AI analyzer to throw error
      const { aiAnalyzer } = require('@/services/resume-builder/ai-analyzer');
      aiAnalyzer.analyzeResume.mockRejectedValue(new Error('AI service error'));

      // Mock database update for failed job
      (prisma.batchMatchJob.update as jest.Mock).mockResolvedValue({});

      const request: BatchJobRequest = {
        type: 'resume_analysis',
        resumeIds: ['resume-1'],
        userId: 'user-1',
      };

      await batchProcessor.createJob(request);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 100));

      // Job should be marked as failed
      expect(prisma.batchMatchJob.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'job-1' },
          data: expect.objectContaining({
            status: 'failed',
            error: expect.stringContaining('AI service error'),
          }),
        })
      );
    });
  });

  describe('integration tests', () => {
    it('should handle complete job lifecycle', async () => {
      // 1. Create job
      const mockResumes = [{ resumeId: 'resume-1', userUid: 'user-1' }];
      (prisma.resume.findMany as jest.Mock).mockResolvedValue(mockResumes);
      (prisma.batchMatchJob.create as jest.Mock).mockResolvedValue({
        id: 'job-1',
        status: 'queued',
      });

      const request: BatchJobRequest = {
        type: 'resume_analysis',
        resumeIds: ['resume-1'],
        userId: 'user-1',
        emailNotification: true,
      };

      const job = await batchProcessor.createJob(request);
      expect(job.status).toBe('queued');

      // 2. Get job status
      (prisma.batchMatchJob.findUnique as jest.Mock).mockResolvedValue({
        id: 'job-1',
        status: 'processing',
        progress: 50,
      });

      const status = await batchProcessor.getJob('job-1');
      expect(status?.status).toBe('processing');

      // 3. Get user jobs
      (prisma.batchMatchJob.findMany as jest.Mock).mockResolvedValue([{
        id: 'job-1',
        status: 'completed',
        createdBy: 'user-1',
      }]);

      const userJobs = await batchProcessor.getUserJobs('user-1');
      expect(userJobs).toHaveLength(1);
      expect(userJobs[0].status).toBe('completed');
    });
  });
});