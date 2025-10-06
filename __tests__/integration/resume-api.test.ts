import { createMocks } from 'node-mocks-http';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/resume/suggestions/route';
import { GET, POST as ResumePOST } from '@/app/api/resume/[id]/suggestions/route';
import { POST as BatchPOST } from '@/app/api/resume/batch/route';

// Mock authentication
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Mock rate limiter
jest.mock('@/lib/rate-limiter', () => ({
  rateLimit: jest.fn().mockResolvedValue({ success: true }),
}));

// Mock OpenAI
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  suggestions: [
                    {
                      id: 'suggestion-1',
                      type: 'improvement',
                      category: 'content',
                      priority: 'high',
                      title: 'Add quantifiable achievements',
                      description: 'Include specific metrics in your descriptions.',
                      impact: 85,
                    },
                  ],
                  score: 75,
                  analysis: {
                    strengths: ['Good technical skills'],
                    weaknesses: ['Lacks metrics'],
                    recommendations: ['Add numbers'],
                  },
                }),
              },
            },
          ],
        }),
      },
    },
  })),
}));

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    resume: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    batchMatchJob: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

describe('Resume API Integration Tests', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const { getServerSession } = require('next-auth');
    getServerSession.mockResolvedValue({ user: mockUser });
  });

  describe('POST /api/resume/suggestions', () => {
    it('should generate suggestions for resume data', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {
          type: 'general',
          resumeData: {
            personal: {
              professionalTitle: 'Software Engineer',
              summary: 'Experienced developer',
            },
            experience: [
              {
                company: 'Tech Corp',
                position: 'Developer',
                description: 'Built web apps',
              },
            ],
          },
          targetJobTitle: 'Senior Software Engineer',
          section: 'all',
          focus: 'content',
        },
      });

      const request = req as unknown as NextRequest;
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.suggestions).toHaveLength(1);
      expect(data.data.suggestions[0].title).toBe('Add quantifiable achievements');
      expect(data.data.score).toBe(75);
    });

    it('should handle contextual suggestions request', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {
          type: 'contextual',
          field: 'experience.description',
          value: 'Built web applications',
          context: {
            targetJobTitle: 'Senior Developer',
            industry: 'Technology',
          },
        },
      });

      const request = req as unknown as NextRequest;
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
    });

    it('should handle grammar check request', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {
          type: 'grammar',
          text: 'I is a software developer',
        },
      });

      const request = req as unknown as NextRequest;
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.errors).toBeDefined();
      expect(data.data.correctedText).toBeDefined();
    });

    it('should handle keyword analysis request', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {
          type: 'keywords',
          resumeText: 'Experienced React developer with Node.js skills',
          jobDescription: 'Looking for React, Node.js, and AWS experience',
          industry: 'Technology',
        },
      });

      const request = req as unknown as NextRequest;
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.missingKeywords).toBeDefined();
      expect(data.data.keywordDensity).toBeDefined();
    });

    it('should reject unauthenticated requests', async () => {
      const { getServerSession } = require('next-auth');
      getServerSession.mockResolvedValue(null);

      const { req } = createMocks({
        method: 'POST',
        body: {
          type: 'general',
          resumeData: {},
        },
      });

      const request = req as unknown as NextRequest;
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('should handle rate limiting', async () => {
      const { rateLimit } = require('@/lib/rate-limiter');
      rateLimit.mockResolvedValue({ success: false });

      const { req } = createMocks({
        method: 'POST',
        body: {
          type: 'general',
          resumeData: {},
        },
      });

      const request = req as unknown as NextRequest;
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe('Too many requests. Please try again later.');
    });

    it('should validate request body', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {
          type: 'invalid_type',
          resumeData: 'invalid_data',
        },
      });

      const request = req as unknown as NextRequest;
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('GET /api/resume/[id]/suggestions', () => {
    const mockResume = {
      resumeId: 'resume-1',
      userUid: 'user-1',
      professionalTitle: 'Software Engineer',
      summary: 'Experienced developer',
      experience: [
        {
          experienceId: 'exp-1',
          company: 'Tech Corp',
          position: 'Developer',
          description: 'Built web apps',
        },
      ],
      education: [],
      certifications: [],
      languages: [],
      projects: [],
    };

    beforeEach(() => {
      const { prisma } = require('@/lib/prisma');
      prisma.resume.findFirst.mockResolvedValue(mockResume);
    });

    it('should get suggestions for specific resume', async () => {
      const { req } = createMocks({
        method: 'GET',
        query: {
          section: 'experience',
          focus: 'content',
          targetJobTitle: 'Senior Developer',
        },
      });

      const request = req as unknown as NextRequest;
      const response = await GET(request, { params: { id: 'resume-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.suggestions).toBeDefined();
      expect(data.data.resumeId).toBe('resume-1');
    });

    it('should return 404 for non-existent resume', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.resume.findFirst.mockResolvedValue(null);

      const { req } = createMocks({
        method: 'GET',
      });

      const request = req as unknown as NextRequest;
      const response = await GET(request, { params: { id: 'non-existent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Resume not found');
    });

    it('should reject access to other user resumes', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.resume.findFirst.mockResolvedValue({
        ...mockResume,
        userUid: 'other-user',
      });

      const { req } = createMocks({
        method: 'GET',
      });

      const request = req as unknown as NextRequest;
      const response = await GET(request, { params: { id: 'resume-1' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Resume not found');
    });
  });

  describe('POST /api/resume/[id]/suggestions', () => {
    const mockResume = {
      resumeId: 'resume-1',
      userUid: 'user-1',
      professionalTitle: 'Software Engineer',
    };

    beforeEach(() => {
      const { prisma } = require('@/lib/prisma');
      prisma.resume.findFirst.mockResolvedValue(mockResume);
    });

    it('should handle contextual suggestions for resume field', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {
          type: 'contextual',
          field: 'professionalTitle',
          value: 'Software Developer',
          context: {
            targetJobTitle: 'Senior Developer',
          },
        },
      });

      const request = req as unknown as NextRequest;
      const response = await ResumePOST(request, { params: { id: 'resume-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
    });

    it('should handle keyword analysis for resume', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {
          type: 'keywords',
          jobDescription: 'Senior React Developer position',
          industry: 'Technology',
        },
      });

      const request = req as unknown as NextRequest;
      const response = await ResumePOST(request, { params: { id: 'resume-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.missingKeywords).toBeDefined();
    });
  });

  describe('POST /api/resume/batch', () => {
    beforeEach(() => {
      const { prisma } = require('@/lib/prisma');
      prisma.resume.findMany.mockResolvedValue([
        { resumeId: 'resume-1', userUid: 'user-1' },
        { resumeId: 'resume-2', userUid: 'user-1' },
      ]);
      prisma.batchMatchJob.create.mockResolvedValue({
        id: 'batch-job-1',
        status: 'queued',
        totalProfiles: 2,
      });
    });

    it('should create batch job for resume analysis', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {
          action: 'create',
          type: 'resume_analysis',
          resumeIds: ['resume-1', 'resume-2'],
          priority: 50,
          emailNotification: true,
        },
      });

      const request = req as unknown as NextRequest;
      const response = await BatchPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.jobId).toBe('batch-job-1');
      expect(data.data.type).toBe('resume_analysis');
      expect(data.data.totalItems).toBe(2);
    });

    it('should get user batch jobs', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.batchMatchJob.findMany.mockResolvedValue([
        {
          id: 'batch-job-1',
          type: 'resume_analysis',
          status: 'completed',
          createdAt: new Date(),
        },
      ]);

      const { req } = createMocks({
        method: 'POST',
        body: {
          action: 'get',
          status: 'completed',
          limit: 10,
        },
      });

      const request = req as unknown as NextRequest;
      const response = await BatchPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.jobs).toHaveLength(1);
      expect(data.data.pagination).toBeDefined();
    });

    it('should get batch job statistics', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.batchMatchJob.findMany.mockResolvedValue([
        {
          id: 'batch-job-1',
          type: 'resume_analysis',
          status: 'completed',
          createdBy: 'user-1',
        },
        {
          id: 'batch-job-2',
          type: 'ats_scoring',
          status: 'processing',
          createdBy: 'user-1',
        },
      ]);

      const { req } = createMocks({
        method: 'POST',
        body: {
          action: 'stats',
        },
      });

      const request = req as unknown as NextRequest;
      const response = await BatchPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.total).toBe(2);
      expect(data.data.completed).toBe(1);
      expect(data.data.processing).toBe(1);
      expect(data.data.byType).toBeDefined();
    });

    it('should cancel batch job', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {
          action: 'cancel',
          jobId: 'batch-job-1',
        },
      });

      const request = req as unknown as NextRequest;
      const response = await BatchPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Job cancelled successfully');
    });

    it('should handle invalid actions', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {
          action: 'invalid_action',
        },
      });

      const request = req as unknown as NextRequest;
      const response = await BatchPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid action');
    });

    it('should enforce rate limiting for batch operations', async () => {
      const { rateLimit } = require('@/lib/rate-limiter');
      rateLimit.mockResolvedValue({ success: false });

      const { req } = createMocks({
        method: 'POST',
        body: {
          action: 'create',
          type: 'resume_analysis',
        },
      });

      const request = req as unknown as NextRequest;
      const response = await BatchPOST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe('Too many requests. Please try again later.');
    });
  });

  describe('Error Handling', () => {
    it('should handle OpenAI API errors gracefully', async () => {
      const { OpenAI } = require('openai');
      OpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: jest.fn().mockRejectedValue(new Error('OpenAI API Error')),
          },
        },
      }));

      const { req } = createMocks({
        method: 'POST',
        body: {
          type: 'general',
          resumeData: {},
        },
      });

      const request = req as unknown as NextRequest;
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle database connection errors', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.resume.findFirst.mockRejectedValue(new Error('Database connection failed'));

      const { req } = createMocks({
        method: 'GET',
      });

      const request = req as unknown as NextRequest;
      const response = await GET(request, { params: { id: 'resume-1' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle malformed JSON in request body', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: 'invalid json',
        headers: {
          'content-type': 'application/json',
        },
      });

      // This would typically be handled by Next.js parsing, but we test the error case
      const request = {
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as any;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('Security Tests', () => {
    it('should prevent access to other user data', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.resume.findFirst.mockResolvedValue({
        resumeId: 'resume-1',
        userUid: 'other-user-id', // Different user
      });

      const { req } = createMocks({
        method: 'GET',
      });

      const request = req as unknown as NextRequest;
      const response = await GET(request, { params: { id: 'resume-1' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Resume not found');
    });

    it('should sanitize user input', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {
          type: 'general',
          resumeData: {
            personal: {
              professionalTitle: '<script>alert("xss")</script>',
            },
          },
        },
      });

      const request = req as unknown as NextRequest;
      const response = await POST(request);

      // Should not execute script and should handle gracefully
      expect(response.status).toBe(200);
    });

    it('should validate required fields', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {
          type: 'general',
          // Missing resumeData
        },
      });

      const request = req as unknown as NextRequest;
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
    });
  });
});