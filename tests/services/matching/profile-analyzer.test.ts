/**
 * Profile Analyzer Unit Tests
 */

import { ProfileAnalyzer } from '@/services/matching/profile-analyzer';
import { CandidateProfile } from '@/types/matching';

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

jest.mock('@/lib/analysis/skills-extractor', () => ({
  skillsExtractor: {
    extractSkills: jest.fn(),
    categorizeSkills: jest.fn(),
    validateSkillLevel: jest.fn(),
  },
}));

describe('ProfileAnalyzer', () => {
  let profileAnalyzer: ProfileAnalyzer;
  let mockProfile: CandidateProfile;

  beforeEach(() => {
    profileAnalyzer = new ProfileAnalyzer();

    mockProfile = {
      id: 'candidate-1',
      userId: 'user-1',
      personalInfo: {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: '+1234567890',
        location: 'New York, NY',
        website: 'https://janesmith.dev',
        headline: 'Full Stack Developer',
        summary: 'Passionate developer with 5 years of experience building web applications.',
        avatarUrl: 'https://example.com/avatar.jpg',
      },
      experience: [
        {
          id: 'exp-1',
          title: 'Senior Frontend Developer',
          company: 'TechStart',
          location: 'New York, NY',
          startDate: new Date('2021-01-01'),
          endDate: new Date('2023-12-31'),
          isCurrentJob: false,
          description: 'Led frontend development for multiple projects using React and TypeScript.',
          skills: ['React', 'TypeScript', 'JavaScript', 'CSS', 'HTML'],
          achievements: [
            'Improved page load speed by 40%',
            'Led a team of 3 developers',
            'Implemented responsive design across all products',
          ],
        },
      ],
      education: [
        {
          id: 'edu-1',
          schoolName: 'MIT',
          degree: 'Bachelor of Science',
          fieldOfStudy: 'Computer Science',
          startDate: new Date('2017-09-01'),
          endDate: new Date('2021-05-31'),
          grade: '3.9',
          activities: ['Computer Science Club', 'Women in Tech'],
          description: 'Focused on software engineering and artificial intelligence.',
        },
      ],
      skills: [
        { id: 'skill-1', name: 'JavaScript', level: 'EXPERT', endorsements: 20 },
        { id: 'skill-2', name: 'React', level: 'EXPERT', endorsements: 18 },
        { id: 'skill-3', name: 'TypeScript', level: 'ADVANCED', endorsements: 15 },
        { id: 'skill-4', name: 'Node.js', level: 'INTERMEDIATE', endorsements: 10 },
        { id: 'skill-5', name: 'Python', level: 'BEGINNER', endorsements: 5 },
      ],
      projects: [
        {
          id: 'proj-1',
          title: 'Task Management App',
          description: 'A React-based task management application with real-time collaboration.',
          startDate: new Date('2023-01-01'),
          endDate: new Date('2023-06-30'),
          url: 'https://github.com/janesmith/task-manager',
          technologies: ['React', 'TypeScript', 'Node.js', 'Socket.io'],
          achievements: [
            '1000+ active users',
            'Featured on Product Hunt',
          ],
        },
      ],
      preferences: {
        jobTypes: ['FULL_TIME'],
        industries: ['TECHNOLOGY'],
        locations: ['New York, NY', 'Remote'],
        salaryRange: {
          min: 100000,
          max: 150000,
          currency: 'USD',
        },
      },
      completeness: 90,
      lastUpdated: new Date('2023-12-01'),
    };
  });

  describe('analyzeProfile', () => {
    it('should analyze profile and return results', async () => {
      const result = await profileAnalyzer.analyzeProfile(mockProfile);

      expect(result).toBeDefined();
      expect(result.completeness).toBeGreaterThanOrEqual(0);
      expect(result.completeness).toBeLessThanOrEqual(100);
      expect(result.strengths).toBeDefined();
      expect(result.weaknesses).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(result.analyzedAt).toBeInstanceOf(Date);
    });

    it('should calculate completeness score correctly', async () => {
      const result = await profileAnalyzer.analyzeProfile(mockProfile);

      expect(result.completeness).toBeGreaterThan(80);
      expect(result.completeness).toBeLessThanOrEqual(100);
    });

    it('should identify strengths', async () => {
      const result = await profileAnalyzer.analyzeProfile(mockProfile);

      expect(result.strengths.length).toBeGreaterThan(0);
      expect(result.strengths).toContainEqual(
        expect.objectContaining({
          category: expect.any(String),
          description: expect.any(String),
          impact: expect.any(String),
        })
      );
    });

    it('should identify weaknesses', async () => {
      const incompleteProfile = {
        ...mockProfile,
        experience: [],
        education: [],
        projects: [],
      };

      const result = await profileAnalyzer.analyzeProfile(incompleteProfile);

      expect(result.weaknesses.length).toBeGreaterThan(0);
      expect(result.weaknesses).toContainEqual(
        expect.objectContaining({
          category: expect.any(String),
          description: expect.any(String),
          suggestion: expect.any(String),
        })
      );
    });

    it('should provide recommendations', async () => {
      const result = await profileAnalyzer.analyzeProfile(mockProfile);

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations).toContainEqual(
        expect.objectContaining({
          priority: expect.any(String),
          action: expect.any(String),
          benefit: expect.any(String),
        })
      );
    });

    it('should handle empty profile', async () => {
      const emptyProfile: CandidateProfile = {
        id: 'empty-1',
        userId: 'user-1',
        personalInfo: {
          firstName: '',
          lastName: '',
          email: '',
        },
        experience: [],
        education: [],
        skills: [],
        projects: [],
        preferences: {
          jobTypes: [],
          industries: [],
          locations: [],
          salaryRange: { min: 0, max: 0, currency: 'USD' },
        },
        completeness: 0,
        lastUpdated: new Date(),
      };

      const result = await profileAnalyzer.analyzeProfile(emptyProfile);

      expect(result.completeness).toBeLessThan(20);
      expect(result.weaknesses.length).toBeGreaterThan(5);
    });
  });

  describe('calculateCompleteness', () => {
    it('should give high score for complete profile', () => {
      const score = profileAnalyzer.calculateCompleteness(mockProfile);

      expect(score).toBeGreaterThan(80);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should give low score for incomplete profile', () => {
      const incompleteProfile = {
        ...mockProfile,
        personalInfo: { firstName: '', lastName: '', email: '' },
        experience: [],
        education: [],
        skills: [],
      };

      const score = profileAnalyzer.calculateCompleteness(incompleteProfile);

      expect(score).toBeLessThan(50);
    });

    it('should calculate personal info completeness', () => {
      const profileWithoutPersonalInfo = {
        ...mockProfile,
        personalInfo: { firstName: '', lastName: '', email: '' },
      };

      const score = profileAnalyzer.calculateCompleteness(profileWithoutPersonalInfo);

      expect(score).toBeLessThan(mockProfile.completeness);
    });

    it('should calculate experience completeness', () => {
      const profileWithoutExperience = {
        ...mockProfile,
        experience: [],
      };

      const score = profileAnalyzer.calculateCompleteness(profileWithoutExperience);

      expect(score).toBeLessThan(mockProfile.completeness);
    });

    it('should calculate skills completeness', () => {
      const profileWithoutSkills = {
        ...mockProfile,
        skills: [],
      };

      const score = profileAnalyzer.calculateCompleteness(profileWithoutSkills);

      expect(score).toBeLessThan(mockProfile.completeness);
    });
  });

  describe('extractSkills', () => {
    it('should extract skills from experience descriptions', async () => {
      const { skillsExtractor } = require('@/lib/analysis/skills-extractor');
      skillsExtractor.extractSkills.mockResolvedValue([
        { skill: 'React', confidence: 0.9 },
        { skill: 'TypeScript', confidence: 0.8 },
        { skill: 'JavaScript', confidence: 0.95 },
      ]);

      const result = await profileAnalyzer.extractSkills(mockProfile);

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContainEqual(
        expect.objectContaining({
          name: expect.any(String),
          source: 'experience',
          confidence: expect.any(Number),
        })
      );
    });

    it('should extract skills from projects', async () => {
      const { skillsExtractor } = require('@/lib/analysis/skills-extractor');
      skillsExtractor.extractSkills.mockResolvedValue([
        { skill: 'React', confidence: 0.9 },
        { skill: 'Node.js', confidence: 0.8 },
      ]);

      const result = await profileAnalyzer.extractSkills(mockProfile);

      expect(result).toBeDefined();
      expect(result.some(skill => skill.source === 'projects')).toBe(true);
    });

    it('should deduplicate extracted skills', async () => {
      const { skillsExtractor } = require('@/lib/analysis/skills-extractor');
      skillsExtractor.extractSkills.mockResolvedValue([
        { skill: 'React', confidence: 0.9 },
        { skill: 'React', confidence: 0.8 }, // Duplicate
        { skill: 'JavaScript', confidence: 0.95 },
      ]);

      const result = await profileAnalyzer.extractSkills(mockProfile);

      const reactSkills = result.filter(skill => skill.name === 'React');
      expect(reactSkills.length).toBe(1);
    });
  });

  describe('validateExperience', () => {
    it('should validate experience entries', () => {
      const validExperience = mockProfile.experience[0];

      const result = profileAnalyzer.validateExperience(validExperience);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should identify invalid experience entries', () => {
      const invalidExperience = {
        id: 'invalid-exp',
        title: '',
        company: '',
        startDate: new Date(),
        endDate: new Date('2020-01-01'), // End before start
        isCurrentJob: false,
        description: '',
        skills: [],
        achievements: [],
      };

      const result = profileAnalyzer.validateExperience(invalidExperience);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle missing required fields', () => {
      const incompleteExperience = {
        id: 'incomplete-exp',
        title: 'Developer',
        // Missing company
        startDate: new Date('2021-01-01'),
        isCurrentJob: true,
        description: '',
        skills: [],
        achievements: [],
      };

      const result = profileAnalyzer.validateExperience(incompleteExperience);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('company'))).toBe(true);
    });

    it('should validate date consistency', () => {
      const experienceWithBadDates = {
        ...mockProfile.experience[0],
        startDate: new Date('2022-01-01'),
        endDate: new Date('2021-01-01'), // End before start
        isCurrentJob: false,
      };

      const result = profileAnalyzer.validateExperience(experienceWithBadDates);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('date'))).toBe(true);
    });
  });

  describe('analyzeSkills', () => {
    it('should analyze skill distribution', async () => {
      const result = await profileAnalyzer.analyzeSkills(mockProfile);

      expect(result).toBeDefined();
      expect(result.totalSkills).toBe(mockProfile.skills.length);
      expect(result.categories).toBeDefined();
      expect(result.levelDistribution).toBeDefined();
      expect(result.endorsementStats).toBeDefined();
    });

    it('should categorize skills correctly', async () => {
      const result = await profileAnalyzer.analyzeSkills(mockProfile);

      expect(result.categories).toHaveProperty('technical');
      expect(result.categories).toHaveProperty('soft');
      expect(result.categories).toHaveProperty('business');
    });

    it('should calculate level distribution', async () => {
      const result = await profileAnalyzer.analyzeSkills(mockProfile);

      expect(result.levelDistribution).toHaveProperty('EXPERT');
      expect(result.levelDistribution).toHaveProperty('ADVANCED');
      expect(result.levelDistribution).toHaveProperty('INTERMEDIATE');
      expect(result.levelDistribution).toHaveProperty('BEGINNER');
    });

    it('should identify top skills', async () => {
      const result = await profileAnalyzer.analyzeSkills(mockProfile);

      expect(result.topSkills).toBeDefined();
      expect(result.topSkills.length).toBeGreaterThan(0);
      expect(result.topSkills[0]).toHaveProperty('name');
      expect(result.topSkills[0]).toHaveProperty('endorsements');
      expect(result.topSkills[0]).toHaveProperty('level');
    });

    it('should suggest missing skills', async () => {
      const result = await profileAnalyzer.analyzeSkills(mockProfile);

      expect(result.suggestedSkills).toBeDefined();
      expect(Array.isArray(result.suggestedSkills)).toBe(true);
    });
  });

  describe('generateRecommendations', () => {
    it('should generate profile improvement recommendations', () => {
      const result = profileAnalyzer.generateRecommendations(mockProfile);

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should prioritize recommendations correctly', () => {
      const incompleteProfile = {
        ...mockProfile,
        experience: [],
        education: [],
        projects: [],
        skills: [],
      };

      const result = profileAnalyzer.generateRecommendations(incompleteProfile);

      expect(result).toContainEqual(
        expect.objectContaining({
          priority: 'HIGH',
        })
      );
    });

    it('should categorize recommendations', () => {
      const result = profileAnalyzer.generateRecommendations(mockProfile);

      expect(result.some(rec => rec.category === 'experience')).toBe(true);
      expect(result.some(rec => rec.category === 'skills')).toBe(true);
      expect(result.some(rec => rec.category === 'education')).toBe(true);
    });

    it('should provide actionable recommendations', () => {
      const result = profileAnalyzer.generateRecommendations(mockProfile);

      result.forEach(recommendation => {
        expect(recommendation.action).toBeDefined();
        expect(recommendation.action.length).toBeGreaterThan(0);
        expect(recommendation.benefit).toBeDefined();
        expect(recommendation.benefit.length).toBeGreaterThan(0);
      });
    });
  });

  describe('error handling', () => {
    it('should handle null profile', async () => {
      await expect(profileAnalyzer.analyzeProfile(null as any))
        .rejects.toThrow();
    });

    it('should handle undefined profile', async () => {
      await expect(profileAnalyzer.analyzeProfile(undefined as any))
        .rejects.toThrow();
    });

    it('should handle invalid profile structure', async () => {
      const invalidProfile = { invalid: 'structure' };

      const result = await profileAnalyzer.analyzeProfile(invalidProfile as any);

      expect(result.completeness).toBe(0);
      expect(result.weaknesses.length).toBeGreaterThan(0);
    });

    it('should handle missing experience array', async () => {
      const profileWithoutExperienceArray = {
        ...mockProfile,
        experience: undefined as any,
      };

      expect(() => profileAnalyzer.calculateCompleteness(profileWithoutExperienceArray))
        .not.toThrow();
    });
  });

  describe('performance', () => {
    it('should analyze profile within performance threshold', async () => {
      const startTime = Date.now();

      await profileAnalyzer.analyzeProfile(mockProfile);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle large profile efficiently', async () => {
      const largeProfile = {
        ...mockProfile,
        experience: Array(10).fill(mockProfile.experience[0]),
        skills: Array(50).fill(mockProfile.skills[0]).map((skill, index) => ({
          ...skill,
          id: `skill-${index}`,
          name: `Skill ${index}`,
        })),
        projects: Array(20).fill(mockProfile.projects[0]).map((project, index) => ({
          ...project,
          id: `proj-${index}`,
          title: `Project ${index}`,
        })),
      };

      const startTime = Date.now();

      await profileAnalyzer.analyzeProfile(largeProfile);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });
});