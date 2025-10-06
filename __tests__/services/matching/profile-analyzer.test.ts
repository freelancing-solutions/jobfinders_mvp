import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ProfileAnalyzer } from '@/services/matching/profile-analyzer';
import type {
  CandidateProfile,
  JobProfile,
  WorkExperience,
  Education,
  JobRequirements
} from '@/types/profiles';
import { ExperienceLevel, SkillLevel, EducationLevel } from '@/types/profiles';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    candidateProfile: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    jobProfile: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    userInteraction: {
      create: jest.fn(),
    },
  },
}));

jest.mock('@/lib/openrouter', () => ({
  OpenRouterClient: jest.fn().mockImplementation(() => ({
    chatCompletion: jest.fn().mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify([
            'Strong leadership skills',
            'Technical expertise',
            'Problem solving abilities',
            'Communication excellence',
            'Project management experience'
          ])
        }
      }]
    })
  })),
}));

jest.mock('@/lib/vector-store', () => ({
  VectorStore: jest.fn().mockImplementation(() => ({
    addDocument: jest.fn(),
    search: jest.fn().mockResolvedValue([]),
  })),
}));

describe('ProfileAnalyzer', () => {
  let profileAnalyzer: ProfileAnalyzer;

  beforeEach(() => {
    jest.clearAllMocks();
    profileAnalyzer = new ProfileAnalyzer();
  });

  describe('analyzeCandidateProfile', () => {
    const mockCandidateProfile: CandidateProfile = {
      id: 'candidate_1',
      userId: 'user_1',
      personalInfo: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        location: {
          country: 'United States',
          city: 'New York',
          state: 'NY'
        },
        languages: []
      },
      professionalSummary: 'Experienced software developer with 5 years of expertise in full-stack development.',
      skills: [
        {
          id: 'skill_1',
          name: 'JavaScript',
          category: 'technical',
          level: SkillLevel.ADVANCED,
          experience: 5,
          isPrimary: true,
          selfRated: true
        },
        {
          id: 'skill_2',
          name: 'React',
          category: 'technical',
          level: SkillLevel.ADVANCED,
          experience: 4,
          isPrimary: true,
          selfRated: true
        },
        {
          id: 'skill_3',
          name: 'Communication',
          category: 'soft_skill',
          level: SkillLevel.INTERMEDIATE,
          experience: 5,
          isPrimary: false,
          selfRated: true
        }
      ],
      experience: [
        {
          id: 'exp_1',
          company: 'Tech Corp',
          position: 'Senior Software Engineer',
          startDate: new Date('2020-01-01'),
          endDate: new Date('2023-12-31'),
          isCurrent: false,
          description: 'Led development of web applications using React and Node.js',
          location: 'New York',
          employmentType: 'full_time',
          skills: ['JavaScript', 'React', 'Node.js'],
          achievements: [],
          teamSize: 5,
          directReports: 0,
          budget: 0,
          tools: [],
          projects: []
        }
      ],
      education: [
        {
          id: 'edu_1',
          institution: 'University of Technology',
          degree: 'Bachelor of Science',
          field: 'Computer Science',
          startDate: new Date('2016-09-01'),
          endDate: new Date('2020-05-31'),
          isCurrent: false,
          gpa: 3.8,
          scale: 4.0,
          honors: [],
          activities: [],
          thesis: '',
          relevantCoursework: [],
          projects: [],
          certifications: [],
          location: 'New York'
        }
      ],
      certifications: [
        {
          id: 'cert_1',
          name: 'AWS Certified Developer',
          issuer: 'Amazon Web Services',
          issueDate: new Date('2022-06-01'),
          expiryDate: new Date('2025-06-01'),
          credentialId: 'AWS-123456',
          credentialUrl: 'https://aws.amazon.com/certification/',
          verificationUrl: 'https://aws.amazon.com/verify/',
          level: 'associate',
          status: 'active',
          skills: ['AWS', 'Cloud Computing'],
          description: 'AWS Developer Associate Certification'
        }
      ],
      preferences: {
        location: [
          {
            city: 'New York',
            state: 'NY',
            country: 'United States',
            priority: 1,
            required: false
          }
        ],
        salaryRange: {
          min: 80000,
          max: 120000,
          currency: 'USD',
          period: 'yearly'
        },
        workType: ['full_time'],
        remoteWorkPreference: 'flexible',
        companyTypes: [],
        industries: ['technology'],
        teamSize: 'small',
        travelRequirement: 10,
        careerLevel: ['mid_career'],
        workSchedule: 'standard',
        benefits: [],
        cultureFit: [],
        growthOpportunities: [],
        excludeCompanies: [],
        mustHaveBenefits: [],
        dealBreakers: []
      },
      availability: {
        isAvailable: true,
        availableFromDate: new Date(),
        noticePeriod: 'two_weeks',
        preferredStartDate: new Date(),
        workSchedule: 'standard',
        overtimeWilling: false,
        weekendWorkWilling: false,
        travelWilling: true,
        relocationWilling: false,
        visaStatus: 'citizen',
        workAuthorization: []
      },
      metadata: {
        completionScore: 85,
        lastUpdated: new Date(),
        visibility: 'public',
        isActive: true,
        isPublic: true,
        allowSearch: true,
        allowDirectContact: false,
        dataRetentionSettings: {
          retentionPeriod: 365,
          deleteAfterExpiry: true,
          anonymizeData: false,
          keepInteractions: true,
          keepApplications: true
        },
        privacySettings: {
          shareProfileData: true,
          allowAnalytics: true,
          allowPersonalization: true,
          allowThirdPartySharing: false,
          excludedCompanies: [],
          blockedUsers: [],
          dataProcessingConsent: true,
          marketingConsent: false
        },
        verificationStatus: 'unverified',
        lastProfileView: new Date(),
        profileViews: 42,
        searchRanking: 0.8,
        featured: false,
        premium: false
      }
    };

    it('should analyze candidate profile successfully', async () => {
      const result = await profileAnalyzer.analyzeCandidateProfile(mockCandidateProfile);

      expect(result).toBeDefined();
      expect(result.profileId).toBe('candidate_1');
      expect(result.profileType).toBe('candidate');
      expect(result.completionScore).toBeGreaterThan(0);
      expect(result.skillCount).toBe(3);
      expect(result.experienceYears).toBeGreaterThan(0);
      expect(result.keyStrengths).toBeDefined();
      expect(result.improvementAreas).toBeDefined();
      expect(result.marketFit).toBeGreaterThanOrEqual(0);
      expect(result.marketFit).toBeLessThanOrEqual(1);
      expect(result.salaryAlignment).toBeGreaterThanOrEqual(0);
      expect(result.salaryAlignment).toBeLessThanOrEqual(1);
      expect(result.locationFlexibility).toBeGreaterThanOrEqual(0);
      expect(result.locationFlexibility).toBeLessThanOrEqual(1);
      expect(result.lastAnalyzed).toBeInstanceOf(Date);
    });

    it('should handle empty profile gracefully', async () => {
      const emptyProfile: CandidateProfile = {
        id: 'candidate_empty',
        userId: 'user_empty',
        personalInfo: {
          firstName: '',
          lastName: '',
          email: '',
          location: { country: '' },
          languages: []
        },
        professionalSummary: '',
        skills: [],
        experience: [],
        education: [],
        certifications: [],
        preferences: {
          location: [],
          workType: [],
          remoteWorkPreference: 'flexible',
          companyTypes: [],
          industries: [],
          teamSize: 'small',
          travelRequirement: 0,
          careerLevel: [],
          workSchedule: 'standard',
          benefits: [],
          cultureFit: [],
          growthOpportunities: [],
          excludeCompanies: [],
          mustHaveBenefits: [],
          dealBreakers: []
        },
        availability: {
          isAvailable: true,
          workSchedule: 'standard',
          overtimeWilling: false,
          weekendWorkWilling: false,
          travelWilling: false,
          relocationWilling: false,
          workAuthorization: []
        },
        metadata: {
          completionScore: 0,
          lastUpdated: new Date(),
          visibility: 'public',
          isActive: true,
          isPublic: true,
          allowSearch: true,
          allowDirectContact: false,
          dataRetentionSettings: {
            retentionPeriod: 365,
            deleteAfterExpiry: true,
            anonymizeData: false,
            keepInteractions: true,
            keepApplications: true
          },
          privacySettings: {
            shareProfileData: true,
            allowAnalytics: true,
            allowPersonalization: true,
            allowThirdPartySharing: false,
            excludedCompanies: [],
            blockedUsers: [],
            dataProcessingConsent: true,
            marketingConsent: false
          },
          verificationStatus: 'unverified',
          profileViews: 0,
          searchRanking: 0,
          featured: false,
          premium: false
        }
      };

      const result = await profileAnalyzer.analyzeCandidateProfile(emptyProfile);

      expect(result).toBeDefined();
      expect(result.completionScore).toBe(0);
      expect(result.skillCount).toBe(0);
      expect(result.experienceYears).toBe(0);
    });
  });

  describe('extractSkills', () => {
    it('should extract skills from text', async () => {
      const text = `
        I am a senior software developer with 5 years of experience in JavaScript, React, and Node.js.
        I have strong leadership skills and experience with AWS and Docker. I am proficient in Python
        and have worked with PostgreSQL databases. I have excellent communication skills and experience
        in project management.
      `;

      const result = await profileAnalyzer.extractSkills(text);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      result.forEach(skill => {
        expect(skill).toHaveProperty('id');
        expect(skill).toHaveProperty('name');
        expect(skill).toHaveProperty('category');
        expect(skill).toHaveProperty('level');
        expect(skill).toHaveProperty('experience');
        expect(skill).toHaveProperty('isPrimary');
        expect(skill).toHaveProperty('selfRated');

        expect(typeof skill.name).toBe('string');
        expect(skill.name.length).toBeGreaterThan(0);
        expect(typeof skill.category).toBe('string');
        expect(typeof skill.level).toBe('string');
        expect(typeof skill.experience).toBe('number');
        expect(typeof skill.isPrimary).toBe('boolean');
        expect(typeof skill.selfRated).toBe('boolean');
      });
    });

    it('should handle empty text gracefully', async () => {
      const result = await profileAnalyzer.extractSkills('');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should handle malformed text gracefully', async () => {
      const result = await profileAnalyzer.extractSkills('Invalid JSON response');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('calculateExperienceRelevance', () => {
    const mockJobRequirements: JobRequirements = {
      skills: [
        {
          id: 'req_skill_1',
          name: 'JavaScript',
          level: SkillLevel.ADVANCED,
          required: true,
          importance: 5,
          yearsExperience: 3,
          alternatives: []
        },
        {
          id: 'req_skill_2',
          name: 'React',
          level: SkillLevel.ADVANCED,
          required: true,
          importance: 5,
          yearsExperience: 2,
          alternatives: []
        }
      ],
      experience: [
        {
          id: 'req_exp_1',
          title: 'Software Engineer',
          level: ExperienceLevel.SENIOR,
          yearsRequired: 5,
          industry: 'Technology',
          required: true,
          alternatives: []
        }
      ],
      education: [
        {
          id: 'req_edu_1',
          level: EducationLevel.BACHELOR,
          field: 'Computer Science',
          required: true,
          alternatives: []
        }
      ],
      certifications: [],
      languages: [],
      qualifications: []
    };

    const mockExperience: WorkExperience[] = [
      {
        id: 'exp_1',
        company: 'Tech Corp',
        position: 'Senior Software Engineer',
        startDate: new Date('2020-01-01'),
        endDate: new Date('2023-12-31'),
        isCurrent: false,
        description: 'Led development of web applications using React and Node.js',
        location: 'New York',
        employmentType: 'full_time',
        skills: ['JavaScript', 'React', 'Node.js'],
        achievements: [],
        teamSize: 5,
        directReports: 0,
        budget: 0,
        tools: [],
        projects: []
      }
    ];

    it('should calculate experience relevance correctly', async () => {
      const result = await profileAnalyzer.calculateExperienceRelevance(mockExperience, mockJobRequirements);

      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });

    it('should handle empty experience array', async () => {
      const result = await profileAnalyzer.calculateExperienceRelevance([], mockJobRequirements);

      expect(result).toBe(0);
    });

    it('should handle empty job requirements', async () => {
      const emptyRequirements: JobRequirements = {
        skills: [],
        experience: [],
        education: [],
        certifications: [],
        languages: [],
        qualifications: []
      };

      const result = await profileAnalyzer.calculateExperienceRelevance(mockExperience, emptyRequirements);

      expect(result).toBe(0);
    });
  });

  describe('assessEducationMatch', () => {
    const mockEducation: Education[] = [
      {
        id: 'edu_1',
        institution: 'University of Technology',
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        startDate: new Date('2016-09-01'),
        endDate: new Date('2020-05-31'),
        isCurrent: false,
        gpa: 3.8,
        scale: 4.0,
        honors: [],
        activities: [],
        thesis: '',
        relevantCoursework: [],
        projects: [],
        certifications: [],
        location: 'New York'
      }
    ];

    it('should assess education match correctly', async () => {
      const requirements = [
        {
          level: EducationLevel.BACHELOR,
          field: 'Computer Science',
          required: true,
          alternatives: []
        }
      ];

      const result = await profileAnalyzer.assessEducationMatch(mockEducation, requirements);

      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });

    it('should handle no requirements', async () => {
      const result = await profileAnalyzer.assessEducationMatch(mockEducation, []);

      expect(result).toBe(1); // No requirements = perfect match
    });

    it('should handle empty education array', async () => {
      const requirements = [
        {
          level: EducationLevel.BACHELOR,
          field: 'Computer Science',
          required: true,
          alternatives: []
        }
      ];

      const result = await profileAnalyzer.assessEducationMatch([], requirements);

      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });
  });
});