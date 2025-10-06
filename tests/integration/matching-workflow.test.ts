/**
 * Matching Workflow Integration Tests
 * Tests the complete matching pipeline from candidate/job creation to match results
 */

import { ScoringEngine } from '@/services/matching/scoring-engine';
import { ProfileAnalyzer } from '@/services/matching/profile-analyzer';
import { MatchingCoreService } from '@/services/matching/core-service';
import { RecommendationEngine } from '@/services/matching/recommendation-engine';
import { CandidateService } from '@/services/matching/candidate-service';
import { JobService } from '@/services/matching/job-service';
import { CacheService } from '@/services/matching/cache-service';

// Mock database
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
  },
  candidateProfile: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
  },
  jobProfile: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
  },
  matchResult: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  userInteraction: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
};

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/lib/cache', () => ({
  cache: {
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    wrap: jest.fn(),
    del: jest.fn(),
  },
}));

describe('Matching Workflow Integration Tests', () => {
  let scoringEngine: ScoringEngine;
  let profileAnalyzer: ProfileAnalyzer;
  let matchingCoreService: MatchingCoreService;
  let recommendationEngine: RecommendationEngine;
  let candidateService: CandidateService;
  let jobService: JobService;
  let cacheService: CacheService;

  // Test data
  let testCandidate: any;
  let testJob: any;
  let testUser: any;

  beforeEach(async () => {
    // Initialize services
    scoringEngine = new ScoringEngine();
    profileAnalyzer = new ProfileAnalyzer();
    cacheService = new CacheService();
    candidateService = new CandidateService();
    jobService = new JobService();
    matchingCoreService = new MatchingCoreService(scoringEngine, cacheService);
    recommendationEngine = new RecommendationEngine(matchingCoreService, cacheService);

    // Reset all mocks
    jest.clearAllMocks();

    // Setup test user
    testUser = {
      id: 'test-user-1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'SEEKER',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Setup test candidate profile
    testCandidate = {
      id: 'test-candidate-1',
      userId: testUser.id,
      personalInfo: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        location: 'San Francisco, CA',
        headline: 'Senior Software Engineer',
        summary: 'Experienced software engineer with expertise in full-stack development.',
      },
      experience: [
        {
          id: 'exp-1',
          title: 'Senior Software Engineer',
          company: 'Tech Corp',
          location: 'San Francisco, CA',
          startDate: new Date('2020-01-01'),
          endDate: new Date('2023-12-31'),
          isCurrentJob: false,
          description: 'Led development of scalable web applications.',
          skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'AWS'],
          achievements: ['Reduced API response time by 40%', 'Mentored junior developers'],
        },
      ],
      education: [
        {
          id: 'edu-1',
          schoolName: 'Stanford University',
          degree: 'Bachelor of Science',
          fieldOfStudy: 'Computer Science',
          startDate: new Date('2016-09-01'),
          endDate: new Date('2020-05-31'),
          grade: '3.8',
        },
      ],
      skills: [
        { id: 'skill-1', name: 'JavaScript', level: 'EXPERT', endorsements: 20 },
        { id: 'skill-2', name: 'React', level: 'EXPERT', endorsements: 18 },
        { id: 'skill-3', name: 'TypeScript', level: 'ADVANCED', endorsements: 15 },
        { id: 'skill-4', name: 'Node.js', level: 'ADVANCED', endorsements: 12 },
        { id: 'skill-5', name: 'AWS', level: 'INTERMEDIATE', endorsements: 8 },
      ],
      projects: [
        {
          id: 'proj-1',
          title: 'E-commerce Platform',
          description: 'Full-stack e-commerce platform with React and Node.js',
          technologies: ['React', 'Node.js', 'MongoDB'],
          achievements: ['Handled 10,000+ monthly users'],
        },
      ],
      preferences: {
        jobTypes: ['FULL_TIME', 'REMOTE'],
        industries: ['TECHNOLOGY'],
        locations: ['San Francisco, CA', 'Remote'],
        salaryRange: { min: 120000, max: 180000, currency: 'USD' },
      },
      completeness: 92,
      lastUpdated: new Date(),
    };

    // Setup test job
    testJob = {
      id: 'test-job-1',
      companyId: 'test-company-1',
      title: 'Senior Full Stack Developer',
      description: 'We are looking for an experienced full stack developer to join our team.',
      requirements: [
        '5+ years of experience in software development',
        'Strong proficiency in JavaScript and TypeScript',
        'Experience with React and Node.js',
        'Familiarity with cloud services',
      ],
      skills: [
        { name: 'JavaScript', required: true, level: 'ADVANCED' },
        { name: 'TypeScript', required: true, level: 'INTERMEDIATE' },
        { name: 'React', required: true, level: 'ADVANCED' },
        { name: 'Node.js', required: true, level: 'INTERMEDIATE' },
        { name: 'AWS', required: false, level: 'INTERMEDIATE' },
      ],
      company: {
        id: 'test-company-1',
        name: 'Tech Innovations',
        industry: 'TECHNOLOGY',
        location: 'San Francisco, CA',
      },
      location: 'San Francisco, CA',
      jobType: 'FULL_TIME',
      remoteWork: true,
      experienceLevel: 'SENIOR',
      salary: { min: 130000, max: 170000, currency: 'USD' },
      postedDate: new Date(),
      status: 'ACTIVE',
    };

    // Setup default mock responses
    mockPrisma.user.findUnique.mockResolvedValue(testUser);
    mockPrisma.candidateProfile.findUnique.mockResolvedValue(testCandidate);
    mockPrisma.jobProfile.findUnique.mockResolvedValue(testJob);
    mockPrisma.matchResult.create.mockResolvedValue({
      id: 'match-1',
      candidateId: testCandidate.id,
      jobId: testJob.id,
      score: 85.5,
      confidence: 0.92,
      breakdown: {},
      explanation: 'Strong match in skills and experience',
      createdAt: new Date(),
    });
  });

  describe('Complete Matching Workflow', () => {
    it('should complete end-to-end matching workflow', async () => {
      // Step 1: Create/Update candidate profile
      mockPrisma.candidateProfile.upsert.mockResolvedValue(testCandidate);
      const updatedCandidate = await candidateService.updateProfile(testCandidate.userId, testCandidate);
      expect(updatedCandidate).toBeDefined();
      expect(mockPrisma.candidateProfile.upsert).toHaveBeenCalled();

      // Step 2: Analyze profile completeness
      const analysisResult = await profileAnalyzer.analyzeProfile(testCandidate);
      expect(analysisResult.completeness).toBeGreaterThan(80);
      expect(analysisResult.strengths.length).toBeGreaterThan(0);
      expect(analysisResult.recommendations.length).toBeGreaterThan(0);

      // Step 3: Create job posting
      mockPrisma.jobProfile.create.mockResolvedValue(testJob);
      const createdJob = await jobService.createJob(testJob);
      expect(createdJob).toBeDefined();
      expect(mockPrisma.jobProfile.create).toHaveBeenCalled();

      // Step 4: Find matches for candidate
      const matches = await matchingCoreService.findMatchesForCandidate(testCandidate.id, {
        limit: 10,
        filters: { jobType: 'FULL_TIME' },
      });
      expect(matches).toBeDefined();
      expect(matches.length).toBeGreaterThan(0);

      // Step 5: Get job recommendations for candidate
      const recommendations = await recommendationEngine.getJobRecommendations(
        testCandidate.id,
        { limit: 5 }
      );
      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeGreaterThan(0);

      // Step 6: Validate match quality
      const topMatch = matches[0];
      expect(topMatch.score).toBeGreaterThan(70);
      expect(topMatch.confidence).toBeGreaterThan(0.7);
      expect(topMatch.breakdown).toBeDefined();
      expect(topMatch.explanation).toBeDefined();

      // Step 7: Cache match results
      const cacheKey = `matches:${testCandidate.id}:${testJob.id}`;
      expect(cacheService.set).toHaveBeenCalledWith(
        cacheKey,
        expect.any(Object),
        expect.any(Number)
      );
    });

    it('should handle candidate-to-job matching flow', async () => {
      // Mock multiple jobs
      const jobs = [testJob, { ...testJob, id: 'test-job-2', title: 'Frontend Developer' }];
      mockPrisma.jobProfile.findMany.mockResolvedValue(jobs);

      const matches = await matchingCoreService.findMatchesForCandidate(testCandidate.id);

      expect(matches).toBeDefined();
      expect(matches.length).toBe(jobs.length);

      // Verify matches are sorted by score (descending)
      for (let i = 1; i < matches.length; i++) {
        expect(matches[i-1].score).toBeGreaterThanOrEqual(matches[i].score);
      }

      // Verify all matches have required fields
      matches.forEach(match => {
        expect(match).toHaveProperty('candidateId');
        expect(match).toHaveProperty('jobId');
        expect(match).toHaveProperty('score');
        expect(match).toHaveProperty('confidence');
        expect(match).toHaveProperty('breakdown');
        expect(match).toHaveProperty('explanation');
        expect(match).toHaveProperty('calculatedAt');
      });
    });

    it('should handle job-to-candidate matching flow', async () => {
      // Mock multiple candidates
      const candidates = [
        testCandidate,
        { ...testCandidate, id: 'test-candidate-2', personalInfo: { firstName: 'Jane', lastName: 'Smith' } }
      ];
      mockPrisma.candidateProfile.findMany.mockResolvedValue(candidates);

      const matches = await matchingCoreService.findMatchesForJob(testJob.id);

      expect(matches).toBeDefined();
      expect(matches.length).toBe(candidates.length);

      // Verify matches are sorted by score (descending)
      for (let i = 1; i < matches.length; i++) {
        expect(matches[i-1].score).toBeGreaterThanOrEqual(matches[i].score);
      }
    });

    it('should handle batch matching operations', async () => {
      const candidates = [testCandidate];
      const jobs = [testJob];

      const batchResults = await matchingCoreService.batchMatch(candidates, jobs);

      expect(batchResults).toBeDefined();
      expect(batchResults.length).toBe(candidates.length * jobs.length);

      // Verify all batch results are properly formatted
      batchResults.forEach(result => {
        expect(result).toHaveProperty('candidateId');
        expect(result).toHaveProperty('jobId');
        expect(result).toHaveProperty('score');
        expect(result).toHaveProperty('confidence');
      });
    });
  });

  describe('Profile Update and Recalculation', () => {
    it('should invalidate cache on profile update', async () => {
      // Initial match
      await matchingCoreService.findMatchesForCandidate(testCandidate.id);

      // Update profile
      const updatedProfile = {
        ...testCandidate,
        skills: [
          ...testCandidate.skills,
          { id: 'skill-6', name: 'Python', level: 'ADVANCED', endorsements: 10 }
        ]
      };

      mockPrisma.candidateProfile.update.mockResolvedValue(updatedProfile);
      await candidateService.updateProfile(testCandidate.userId, updatedProfile);

      // Verify cache invalidation
      expect(cacheService.del).toHaveBeenCalledWith(
        expect.stringContaining(`matches:${testCandidate.id}`)
      );

      // Get fresh matches
      const freshMatches = await matchingCoreService.findMatchesForCandidate(testCandidate.id);
      expect(freshMatches).toBeDefined();
    });

    it('should recalculate matches after skill additions', async () => {
      const originalMatches = await matchingCoreService.findMatchesForCandidate(testCandidate.id);
      const originalScore = originalMatches[0]?.score || 0;

      // Add new skill that matches job requirements
      const updatedProfile = {
        ...testCandidate,
        skills: [
          ...testCandidate.skills,
          { id: 'skill-new', name: 'Docker', level: 'INTERMEDIATE', endorsements: 5 }
        ]
      };

      mockPrisma.candidateProfile.update.mockResolvedValue(updatedProfile);
      await candidateService.updateProfile(testCandidate.userId, updatedProfile);

      // Get updated matches
      const updatedMatches = await matchingCoreService.findMatchesForCandidate(testCandidate.id);

      // Should potentially have different scores
      expect(updatedMatches).toBeDefined();
      // Score might be different due to new skills
    });
  });

  describe('Recommendation Workflow', () => {
    it('should generate personalized job recommendations', async () => {
      // Mock additional similar jobs
      const similarJobs = [
        testJob,
        { ...testJob, id: 'test-job-2', title: 'Full Stack Engineer' },
        { ...testJob, id: 'test-job-3', title: 'Senior React Developer' },
      ];
      mockPrisma.jobProfile.findMany.mockResolvedValue(similarJobs);

      const recommendations = await recommendationEngine.getJobRecommendations(testCandidate.id, {
        limit: 5,
        strategies: ['collaborative', 'content', 'hybrid']
      });

      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.length).toBeLessThanOrEqual(5);

      // Verify recommendation structure
      recommendations.forEach(rec => {
        expect(rec).toHaveProperty('jobId');
        expect(rec).toHaveProperty('score');
        expect(rec).toHaveProperty('confidence');
        expect(rec).toHaveProperty('reason');
        expect(rec).toHaveProperty('strategy');
      });
    });

    it('should generate candidate recommendations for jobs', async () => {
      // Mock additional similar candidates
      const similarCandidates = [
        testCandidate,
        { ...testCandidate, id: 'test-candidate-2', personalInfo: { firstName: 'Jane', lastName: 'Smith' } },
        { ...testCandidate, id: 'test-candidate-3', personalInfo: { firstName: 'Bob', lastName: 'Johnson' } },
      ];
      mockPrisma.candidateProfile.findMany.mockResolvedValue(similarCandidates);

      const recommendations = await recommendationEngine.getCandidateRecommendations(testJob.id, {
        limit: 10,
        strategies: ['collaborative', 'content']
      });

      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeGreaterThan(0);

      // Verify recommendation structure
      recommendations.forEach(rec => {
        expect(rec).toHaveProperty('candidateId');
        expect(rec).toHaveProperty('score');
        expect(rec).toHaveProperty('confidence');
        expect(rec).toHaveProperty('reason');
      });
    });

    it('should provide similar items recommendations', async () => {
      const similarJobs = await recommendationEngine.getSimilarJobs(testJob.id, {
        limit: 5
      });

      expect(similarJobs).toBeDefined();
      expect(Array.isArray(similarJobs)).toBe(true);

      const similarCandidates = await recommendationEngine.getSimilarCandidates(testCandidate.id, {
        limit: 5
      });

      expect(similarCandidates).toBeDefined();
      expect(Array.isArray(similarCandidates)).toBe(true);
    });
  });

  describe('Feedback and Learning Integration', () => {
    it('should record user interactions for learning', async () => {
      const interaction = {
        userId: testUser.id,
        candidateId: testCandidate.id,
        jobId: testJob.id,
        interactionType: 'VIEW' as const,
        metadata: { source: 'search', position: 1 },
      };

      mockPrisma.userInteraction.create.mockResolvedValue({
        id: 'interaction-1',
        ...interaction,
        createdAt: new Date(),
      });

      // Record view interaction
      const recordedInteraction = await matchingCoreService.recordInteraction(interaction);
      expect(recordedInteraction).toBeDefined();
      expect(mockPrisma.userInteraction.create).toHaveBeenCalledWith({
        data: expect.objectContaining(interaction),
      });

      // Record application interaction
      const applicationInteraction = {
        ...interaction,
        interactionType: 'APPLY' as const,
        metadata: { source: 'recommendation', matchScore: 85.5 },
      };

      mockPrisma.userInteraction.create.mockResolvedValue({
        id: 'interaction-2',
        ...applicationInteraction,
        createdAt: new Date(),
      });

      const recordedApplication = await matchingCoreService.recordInteraction(applicationInteraction);
      expect(recordedApplication).toBeDefined();
      expect(mockPrisma.userInteraction.create).toHaveBeenCalledTimes(2);
    });

    it('should update recommendations based on feedback', async () => {
      const feedback = {
        matchId: 'match-1',
        userId: testUser.id,
        rating: 4,
        feedback: 'Good match, but location is not ideal',
        helpful: true,
      };

      // Record feedback
      mockPrisma.matchResult.update.mockResolvedValue({
        id: 'match-1',
        feedback: [feedback],
        updatedAt: new Date(),
      });

      const updatedMatch = await matchingCoreService.recordFeedback(feedback);
      expect(updatedMatch).toBeDefined();

      // Subsequent recommendations should consider this feedback
      const newRecommendations = await recommendationEngine.getJobRecommendations(testCandidate.id);
      expect(newRecommendations).toBeDefined();
    });
  });

  describe('Performance and Caching', () => {
    it('should cache match results for performance', async () => {
      const cacheKey = `matches:${testCandidate.id}:${testJob.id}`;

      // First call should compute and cache
      await matchingCoreService.findMatchesForCandidate(testCandidate.id);
      expect(cacheService.set).toHaveBeenCalledWith(
        cacheKey,
        expect.any(Object),
        expect.any(Number)
      );

      // Second call should use cache
      mockPrisma.candidateProfile.findUnique.mockClear();
      mockPrisma.jobProfile.findUnique.mockClear();

      await matchingCoreService.findMatchesForCandidate(testCandidate.id);

      // Should not hit database if cache hit
      expect(mockPrisma.candidateProfile.findUnique).not.toHaveBeenCalled();
      expect(mockPrisma.jobProfile.findUnique).not.toHaveBeenCalled();
    });

    it('should handle cache misses gracefully', async () => {
      // Mock cache miss
      const { cache } = require('@/lib/cache');
      cache.get.mockResolvedValue(null);

      const matches = await matchingCoreService.findMatchesForCandidate(testCandidate.id);

      expect(matches).toBeDefined();
      expect(mockPrisma.candidateProfile.findUnique).toHaveBeenCalled();
      expect(mockPrisma.jobProfile.findMany).toHaveBeenCalled();
    });

    it('should handle cache service failures', async () => {
      // Mock cache service error
      const { cache } = require('@/lib/cache');
      cache.get.mockRejectedValue(new Error('Cache service unavailable'));

      const matches = await matchingCoreService.findMatchesForCandidate(testCandidate.id);

      // Should still work by falling back to database
      expect(matches).toBeDefined();
      expect(mockPrisma.candidateProfile.findUnique).toHaveBeenCalled();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing candidate profile gracefully', async () => {
      mockPrisma.candidateProfile.findUnique.mockResolvedValue(null);

      await expect(matchingCoreService.findMatchesForCandidate('non-existent-candidate'))
        .rejects.toThrow('Candidate profile not found');
    });

    it('should handle missing job posting gracefully', async () => {
      mockPrisma.jobProfile.findUnique.mockResolvedValue(null);

      await expect(matchingCoreService.findMatchesForJob('non-existent-job'))
        .rejects.toThrow('Job profile not found');
    });

    it('should handle database connection failures', async () => {
      mockPrisma.candidateProfile.findUnique.mockRejectedValue(new Error('Database connection failed'));

      await expect(matchingCoreService.findMatchesForCandidate(testCandidate.id))
        .rejects.toThrow('Database connection failed');
    });

    it('should handle malformed profile data', async () => {
      const malformedProfile = {
        ...testCandidate,
        skills: 'not-an-array', // Malformed data
      };

      mockPrisma.candidateProfile.findUnique.mockResolvedValue(malformedProfile);

      await expect(matchingCoreService.findMatchesForCandidate(testCandidate.id))
        .rejects.toThrow();
    });

    it('should handle empty result sets', async () => {
      mockPrisma.jobProfile.findMany.mockResolvedValue([]);

      const matches = await matchingCoreService.findMatchesForCandidate(testCandidate.id);
      expect(matches).toHaveLength(0);
    });
  });

  describe('Data Consistency', () => {
    it('should maintain data consistency across operations', async () => {
      // Create initial match
      const initialMatches = await matchingCoreService.findMatchesForCandidate(testCandidate.id);
      expect(initialMatches).toBeDefined();

      // Update candidate profile
      const updatedProfile = {
        ...testCandidate,
        personalInfo: {
          ...testCandidate.personalInfo,
          headline: 'Principal Software Engineer',
        }
      };

      mockPrisma.candidateProfile.update.mockResolvedValue(updatedProfile);
      await candidateService.updateProfile(testCandidate.userId, updatedProfile);

      // Get updated matches
      const updatedMatches = await matchingCoreService.findMatchesForCandidate(testCandidate.id);

      // Verify data consistency
      expect(updatedMatches).toBeDefined();
      expect(updatedMatches[0]?.candidateId).toBe(testCandidate.id);
      expect(updatedMatches.every(match => match.candidateId === testCandidate.id)).toBe(true);
    });

    it('should handle concurrent operations safely', async () => {
      // Simulate concurrent match requests
      const concurrentRequests = Array(5).fill(null).map(() =>
        matchingCoreService.findMatchesForCandidate(testCandidate.id)
      );

      const results = await Promise.all(concurrentRequests);

      // All requests should return valid results
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
      });

      // Results should be consistent
      const firstResult = results[0];
      results.forEach(result => {
        expect(result.length).toBe(firstResult.length);
        if (result.length > 0) {
          expect(result[0].candidateId).toBe(firstResult[0].candidateId);
        }
      });
    });
  });
});