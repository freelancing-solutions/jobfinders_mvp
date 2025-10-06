/**
 * Scoring Engine Unit Tests
 */

import { ScoringEngine } from '@/services/matching/scoring-engine';
import { CandidateProfile } from '@/types/matching';
import { JobProfile } from '@/types/matching';

// Mock dependencies
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
  },
}));

describe('ScoringEngine', () => {
  let scoringEngine: ScoringEngine;
  let mockCandidate: CandidateProfile;
  let mockJob: JobProfile;

  beforeEach(() => {
    scoringEngine = new ScoringEngine();

    // Mock candidate profile
    mockCandidate = {
      id: 'candidate-1',
      userId: 'user-1',
      personalInfo: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        location: 'San Francisco, CA',
        website: 'https://johndoe.dev',
        headline: 'Senior Software Engineer',
        summary: 'Experienced software engineer with expertise in full-stack development and cloud architecture.',
        avatarUrl: 'https://example.com/avatar.jpg',
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
          description: 'Led development of microservices architecture and mentored junior developers.',
          skills: ['JavaScript', 'TypeScript', 'Node.js', 'React', 'AWS'],
          achievements: [
            'Reduced API response time by 40%',
            'Mentored 5 junior developers',
            'Led migration to microservices architecture',
          ],
        },
        {
          id: 'exp-2',
          title: 'Software Engineer',
          company: 'StartupXYZ',
          location: 'New York, NY',
          startDate: new Date('2018-06-01'),
          endDate: new Date('2019-12-31'),
          isCurrentJob: false,
          description: 'Developed responsive web applications using React and Node.js.',
          skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
          achievements: [
            'Built 3 production applications',
            'Improved application performance by 30%',
          ],
        },
      ],
      education: [
        {
          id: 'edu-1',
          schoolName: 'University of California, Berkeley',
          degree: 'Bachelor of Science',
          fieldOfStudy: 'Computer Science',
          startDate: new Date('2014-09-01'),
          endDate: new Date('2018-05-31'),
          grade: '3.8',
          activities: ['Computer Science Club', 'Hackathon Participant'],
          description: 'Focused on software engineering and machine learning.',
        },
      ],
      skills: [
        { id: 'skill-1', name: 'JavaScript', level: 'EXPERT', endorsements: 15 },
        { id: 'skill-2', name: 'TypeScript', level: 'ADVANCED', endorsements: 12 },
        { id: 'skill-3', name: 'React', level: 'EXPERT', endorsements: 18 },
        { id: 'skill-4', name: 'Node.js', level: 'ADVANCED', endorsements: 10 },
        { id: 'skill-5', name: 'AWS', level: 'INTERMEDIATE', endorsements: 8 },
        { id: 'skill-6', name: 'Python', level: 'INTERMEDIATE', endorsements: 6 },
      ],
      projects: [
        {
          id: 'proj-1',
          title: 'E-commerce Platform',
          description: 'Full-stack e-commerce platform with React and Node.js',
          startDate: new Date('2023-01-01'),
          endDate: new Date('2023-06-30'),
          url: 'https://github.com/johndoe/ecommerce',
          technologies: ['React', 'Node.js', 'MongoDB', 'Stripe'],
          achievements: [
            'Handled 10,000+ monthly active users',
            'Implemented secure payment processing',
          ],
        },
      ],
      preferences: {
        jobTypes: ['FULL_TIME', 'REMOTE'],
        industries: ['TECHNOLOGY', 'FINANCE'],
        locations: ['San Francisco, CA', 'New York, NY', 'Remote'],
        salaryRange: {
          min: 120000,
          max: 180000,
          currency: 'USD',
        },
      },
      completeness: 95,
      lastUpdated: new Date('2023-12-01'),
    };

    // Mock job profile
    mockJob = {
      id: 'job-1',
      companyId: 'company-1',
      title: 'Senior Full Stack Developer',
      description: 'We are looking for an experienced full stack developer to join our growing team. You will work on building scalable web applications using modern technologies.',
      requirements: [
        '5+ years of experience in software development',
        'Strong proficiency in JavaScript and TypeScript',
        'Experience with React and Node.js',
        'Familiarity with cloud services (AWS preferred)',
        'Excellent problem-solving skills',
      ],
      qualifications: [
        'Bachelor\'s degree in Computer Science or related field',
        'Experience with microservices architecture',
        'Strong communication and teamwork skills',
      ],
      skills: [
        { name: 'JavaScript', required: true, level: 'ADVANCED' },
        { name: 'TypeScript', required: true, level: 'INTERMEDIATE' },
        { name: 'React', required: true, level: 'ADVANCED' },
        { name: 'Node.js', required: true, level: 'INTERMEDIATE' },
        { name: 'AWS', required: false, level: 'INTERMEDIATE' },
        { name: 'Python', required: false, level: 'BEGINNER' },
      ],
      company: {
        id: 'company-1',
        name: 'InnovateTech',
        description: 'Leading technology company focused on innovative solutions',
        industry: 'TECHNOLOGY',
        size: '100-500',
        location: 'San Francisco, CA',
        website: 'https://innovatetech.com',
        logo: 'https://example.com/logo.jpg',
      },
      location: 'San Francisco, CA',
      jobType: 'FULL_TIME',
      remoteWork: true,
      experienceLevel: 'SENIOR',
      salary: {
        min: 130000,
        max: 170000,
        currency: 'USD',
      },
      benefits: [
        'Health insurance',
        '401(k) matching',
        'Flexible work hours',
        'Remote work options',
      ],
      postedDate: new Date('2023-11-15'),
      applicationDeadline: new Date('2023-12-31'),
      status: 'ACTIVE',
      tags: ['full-stack', 'react', 'nodejs', 'javascript', 'typescript'],
    };
  });

  describe('calculateMatch', () => {
    it('should calculate a valid match score', async () => {
      const result = await scoringEngine.calculateMatch(mockCandidate, mockJob);

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.breakdown).toBeDefined();
      expect(result.explanation).toBeDefined();
      expect(result.calculatedAt).toBeInstanceOf(Date);
    });

    it('should calculate higher score for well-matching candidate', async () => {
      const result = await scoringEngine.calculateMatch(mockCandidate, mockJob);

      // Should be a high match since candidate has most required skills and experience
      expect(result.score).toBeGreaterThan(70);
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should provide detailed breakdown', async () => {
      const result = await scoringEngine.calculateMatch(mockCandidate, mockJob);

      expect(result.breakdown).toHaveProperty('skills');
      expect(result.breakdown).toHaveProperty('experience');
      expect(result.breakdown).toHaveProperty('education');
      expect(result.breakdown).toHaveProperty('location');
      expect(result.breakdown).toHaveProperty('preferences');

      expect(result.breakdown.skills).toHaveProperty('score');
      expect(result.breakdown.skills).toHaveProperty('weight');
      expect(result.breakdown.skills).toHaveProperty('details');
    });

    it('should handle candidate with no experience', async () => {
      const candidateWithNoExperience = {
        ...mockCandidate,
        experience: [],
      };

      const result = await scoringEngine.calculateMatch(candidateWithNoExperience, mockJob);

      expect(result.score).toBeDefined();
      expect(result.score).toBeLessThan(50); // Should be lower due to no experience
    });

    it('should handle job with no requirements', async () => {
      const jobWithNoRequirements = {
        ...mockJob,
        requirements: [],
        skills: [],
      };

      const result = await scoringEngine.calculateMatch(mockCandidate, jobWithNoRequirements);

      expect(result.score).toBeDefined();
      expect(result.breakdown.skills.score).toBe(0);
    });

    it('should calculate location match correctly', async () => {
      const jobInDifferentLocation = {
        ...mockJob,
        location: 'London, UK',
        remoteWork: false,
      };

      const result = await scoringEngine.calculateMatch(mockCandidate, jobInDifferentLocation);

      expect(result.breakdown.location.score).toBeLessThan(50);
    });

    it('should handle remote work preferences', async () => {
      const remoteJob = {
        ...mockJob,
        location: 'Remote',
        remoteWork: true,
      };

      const result = await scoringEngine.calculateMatch(mockCandidate, remoteJob);

      expect(result.breakdown.location.score).toBeGreaterThan(80);
    });

    it('should calculate salary match correctly', async () => {
      const highSalaryJob = {
        ...mockJob,
        salary: {
          min: 200000,
          max: 250000,
          currency: 'USD',
        },
      };

      const result = await scoringEngine.calculateMatch(mockCandidate, highSalaryJob);

      expect(result.breakdown.preferences.score).toBeDefined();
    });
  });

  describe('calculateSkillsMatch', () => {
    it('should calculate high score for matching skills', async () => {
      const result = await scoringEngine.calculateMatch(mockCandidate, mockJob);

      expect(result.breakdown.skills.score).toBeGreaterThan(70);
    });

    it('should give extra weight to required skills', async () => {
      const jobWithRequiredSkills = {
        ...mockJob,
        skills: [
          { name: 'JavaScript', required: true, level: 'ADVANCED' },
          { name: 'React', required: true, level: 'ADVANCED' },
          { name: 'Node.js', required: true, level: 'INTERMEDIATE' },
          { name: 'TypeScript', required: true, level: 'INTERMEDIATE' },
        ],
      };

      const result = await scoringEngine.calculateMatch(mockCandidate, jobWithRequiredSkills);

      expect(result.breakdown.skills.details.requiredMatch).toBeGreaterThan(80);
    });

    it('should handle missing required skills', async () => {
      const jobRequiringMissingSkill = {
        ...mockJob,
        skills: [
          { name: 'Java', required: true, level: 'ADVANCED' },
          { name: 'Spring Boot', required: true, level: 'ADVANCED' },
        ],
      };

      const result = await scoringEngine.calculateMatch(mockCandidate, jobRequiringMissingSkill);

      expect(result.breakdown.skills.score).toBeLessThan(30);
    });
  });

  describe('calculateExperienceMatch', () => {
    it('should match relevant experience', async () => {
      const result = await scoringEngine.calculateMatch(mockCandidate, mockJob);

      expect(result.breakdown.experience.score).toBeGreaterThan(60);
    });

    it('should consider years of experience', async () => {
      const juniorJob = {
        ...mockJob,
        title: 'Junior Developer',
        experienceLevel: 'JUNIOR',
        requirements: ['1-2 years of experience'],
      };

      const result = await scoringEngine.calculateMatch(mockCandidate, juniorJob);

      expect(result.breakdown.experience.score).toBeGreaterThan(50);
    });

    it('should handle candidate with no experience', async () => {
      const candidateWithNoExperience = {
        ...mockCandidate,
        experience: [],
      };

      const result = await scoringEngine.calculateMatch(candidateWithNoExperience, mockJob);

      expect(result.breakdown.experience.score).toBe(0);
    });
  });

  describe('calculateEducationMatch', () => {
    it('should match relevant education', async () => {
      const result = await scoringEngine.calculateMatch(mockCandidate, mockJob);

      expect(result.breakdown.education.score).toBeGreaterThan(40);
    });

    it('should handle candidate with no education', async () => {
      const candidateWithNoEducation = {
        ...mockCandidate,
        education: [],
      };

      const result = await scoringEngine.calculateMatch(candidateWithNoEducation, mockJob);

      expect(result.breakdown.education.score).toBe(0);
    });

    it('should give extra points for relevant field of study', async () => {
      const result = await scoringEngine.calculateMatch(mockCandidate, mockJob);

      expect(result.breakdown.education.details.relevanceScore).toBeGreaterThan(70);
    });
  });

  describe('generateExplanation', () => {
    it('should generate meaningful explanation', async () => {
      const result = await scoringEngine.calculateMatch(mockCandidate, mockJob);

      expect(result.explanation).toBeDefined();
      expect(result.explanation.length).toBeGreaterThan(50);
      expect(result.explanation).toContain('skills');
      expect(result.explanation).toContain('experience');
    });

    it('should mention specific matching skills', async () => {
      const result = await scoringEngine.calculateMatch(mockCandidate, mockJob);

      expect(result.explanation).toContain('JavaScript');
      expect(result.explanation).toContain('React');
    });
  });

  describe('batchCalculateMatches', () => {
    it('should calculate matches for multiple candidates', async () => {
      const candidates = [mockCandidate];
      const jobs = [mockJob];

      const results = await scoringEngine.batchCalculateMatches(candidates, jobs);

      expect(results).toHaveLength(1);
      expect(results[0]).toHaveProperty('candidateId');
      expect(results[0]).toHaveProperty('jobId');
      expect(results[0]).toHaveProperty('score');
    });

    it('should handle empty arrays', async () => {
      const results = await scoringEngine.batchCalculateMatches([], []);

      expect(results).toHaveLength(0);
    });

    it('should handle mismatched arrays', async () => {
      const candidates = [mockCandidate];
      const jobs = [mockJob, { ...mockJob, id: 'job-2' }];

      const results = await scoringEngine.batchCalculateMatches(candidates, jobs);

      expect(results).toHaveLength(2);
    });
  });

  describe('error handling', () => {
    it('should handle invalid candidate data', async () => {
      const invalidCandidate = null as any;

      await expect(scoringEngine.calculateMatch(invalidCandidate, mockJob))
        .rejects.toThrow();
    });

    it('should handle invalid job data', async () => {
      const invalidJob = null as any;

      await expect(scoringEngine.calculateMatch(mockCandidate, invalidJob))
        .rejects.toThrow();
    });

    it('should handle missing required fields', async () => {
      const incompleteCandidate = { ...mockCandidate, skills: undefined };

      const result = await scoringEngine.calculateMatch(incompleteCandidate, mockJob);

      expect(result.score).toBeDefined();
      expect(result.breakdown.skills.score).toBe(0);
    });
  });

  describe('performance', () => {
    it('should calculate match within performance threshold', async () => {
      const startTime = Date.now();

      await scoringEngine.calculateMatch(mockCandidate, mockJob);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it('should handle batch processing efficiently', async () => {
      const candidates = Array(10).fill(mockCandidate);
      const jobs = Array(10).fill(mockJob);

      const startTime = Date.now();

      await scoringEngine.batchCalculateMatches(candidates, jobs);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('edge cases', () => {
    it('should handle duplicate skills', async () => {
      const candidateWithDuplicateSkills = {
        ...mockCandidate,
        skills: [
          { id: 'skill-1', name: 'JavaScript', level: 'EXPERT', endorsements: 15 },
          { id: 'skill-2', name: 'JavaScript', level: 'EXPERT', endorsements: 10 },
        ],
      };

      const result = await scoringEngine.calculateMatch(candidateWithDuplicateSkills, mockJob);

      expect(result.score).toBeDefined();
      expect(result.breakdown.skills.score).toBeLessThanOrEqual(100);
    });

    it('should handle skills with different casing', async () => {
      const jobWithDifferentCasing = {
        ...mockJob,
        skills: [
          { name: 'javascript', required: true, level: 'ADVANCED' },
          { name: 'TYPESCRIPT', required: true, level: 'INTERMEDIATE' },
        ],
      };

      const result = await scoringEngine.calculateMatch(mockCandidate, jobWithDifferentCasing);

      expect(result.breakdown.skills.score).toBeGreaterThan(50);
    });

    it('should handle extremely long descriptions', async () => {
      const candidateWithLongDescription = {
        ...mockCandidate,
        personalInfo: {
          ...mockCandidate.personalInfo,
          summary: 'A'.repeat(10000), // Very long summary
        },
      };

      const result = await scoringEngine.calculateMatch(candidateWithLongDescription, mockJob);

      expect(result.score).toBeDefined();
    });
  });
});