import { prisma } from '@/lib/prisma';
import { ProfileAnalyzer } from './profile-analyzer';
import type {
  CandidateProfile,
  ProfileAnalysis,
  Skill,
  WorkExperience,
  Education,
  Certification,
  JobPreferences,
  AvailabilityInfo,
  ProfileMetadata
} from '@/types/profiles';
import type {
  MatchResult,
  UserInteraction,
  ProfileEmbedding
} from '@/types/matching';

export interface CreateCandidateProfileData {
  userId: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    location: {
      country: string;
      city?: string;
      state?: string;
    };
    linkedinUrl?: string;
    portfolioUrl?: string;
    githubUrl?: string;
    website?: string;
  };
  professionalSummary?: string;
  skills?: Partial<Skill>[];
  experience?: Partial<WorkExperience>[];
  education?: Partial<Education>[];
  certifications?: Partial<Certification>[];
  preferences?: Partial<JobPreferences>;
  availability?: Partial<AvailabilityInfo>;
}

export interface UpdateCandidateProfileData extends Partial<CreateCandidateProfileData> {
  id: string;
}

export interface CandidateProfileQuery {
  userId?: string;
  skills?: string[];
  location?: string;
  experienceLevel?: string;
  educationLevel?: string;
  availability?: boolean;
  salaryRange?: {
    min?: number;
    max?: number;
  };
  limit?: number;
  offset?: number;
}

export interface CandidateProfileSearchOptions {
  query?: string;
  filters?: CandidateProfileQuery;
  sortBy?: 'relevance' | 'experience' | 'education' | 'completion' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
  includeInactive?: boolean;
}

export class CandidateService {
  private profileAnalyzer: ProfileAnalyzer;

  constructor() {
    this.profileAnalyzer = new ProfileAnalyzer();
  }

  /**
   * Create a new candidate profile
   */
  async createCandidateProfile(data: CreateCandidateProfileData): Promise<CandidateProfile> {
    try {
      // Validate user exists and has seeker role
      const user = await prisma.user.findUnique({
        where: { uid: data.userId },
        select: { role: true, email: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (user.role !== 'seeker') {
        throw new Error('User must have seeker role to create candidate profile');
      }

      // Check if profile already exists
      const existingProfile = await prisma.candidateProfile.findUnique({
        where: { userId: data.userId }
      });

      if (existingProfile) {
        throw new Error('Candidate profile already exists for this user');
      }

      // Process and validate the profile data
      const processedData = await this.processProfileData(data);

      // Create the profile
      const profile = await prisma.candidateProfile.create({
        data: {
          userId: data.userId,
          personalInfo: processedData.personalInfo,
          professionalSummary: processedData.professionalSummary,
          skills: processedData.skills || [],
          experience: processedData.experience || [],
          education: processedData.education || [],
          certifications: processedData.certifications || [],
          preferences: processedData.preferences || {},
          availability: processedData.availability || {},
          completionScore: 0, // Will be calculated below
          verificationStatus: 'unverified',
        }
      });

      // Calculate and update completion score
      const completionScore = this.calculateCompletionScore(profile);
      await prisma.candidateProfile.update({
        where: { id: profile.id },
        data: { completionScore }
      });

      // Track user interaction
      await this.trackInteraction(data.userId, 'profile_created', 'candidate_profile', profile.id, {
        completionScore
      });

      // Generate initial analysis
      try {
        await this.profileAnalyzer.analyzeCandidateProfile(profile);
      } catch (error) {
        console.warn('Failed to generate initial analysis:', error);
      }

      return await this.getCandidateProfileById(profile.id);
    } catch (error) {
      console.error('Error creating candidate profile:', error);
      throw error;
    }
  }

  /**
   * Get candidate profile by ID
   */
  async getCandidateProfileById(id: string): Promise<CandidateProfile> {
    try {
      const profile = await prisma.candidateProfile.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              uid: true,
              email: true,
              name: true,
              createdAt: true
            }
          }
        }
      });

      if (!profile) {
        throw new Error('Candidate profile not found');
      }

      // Update profile view count
      await prisma.candidateProfile.update({
        where: { id },
        data: {
          profileViews: { increment: 1 },
          lastProfileView: new Date()
        }
      });

      return this.transformDatabaseProfile(profile);
    } catch (error) {
      console.error('Error getting candidate profile:', error);
      throw error;
    }
  }

  /**
   * Get candidate profile by user ID
   */
  async getCandidateProfileByUserId(userId: string): Promise<CandidateProfile | null> {
    try {
      const profile = await prisma.candidateProfile.findUnique({
        where: { userId }
      });

      if (!profile) {
        return null;
      }

      return await this.getCandidateProfileById(profile.id);
    } catch (error) {
      console.error('Error getting candidate profile by user ID:', error);
      throw error;
    }
  }

  /**
   * Update candidate profile
   */
  async updateCandidateProfile(data: UpdateCandidateProfileData): Promise<CandidateProfile> {
    try {
      const existingProfile = await prisma.candidateProfile.findUnique({
        where: { id: data.id }
      });

      if (!existingProfile) {
        throw new Error('Candidate profile not found');
      }

      // Process and validate the update data
      const processedData = await this.processProfileData(data as CreateCandidateProfileData);

      // Update the profile
      const updatedProfile = await prisma.candidateProfile.update({
        where: { id: data.id },
        data: {
          personalInfo: processedData.personalInfo,
          professionalSummary: processedData.professionalSummary,
          skills: processedData.skills || existingProfile.skills,
          experience: processedData.experience || existingProfile.experience,
          education: processedData.education || existingProfile.education,
          certifications: processedData.certifications || existingProfile.certifications,
          preferences: processedData.preferences || existingProfile.preferences,
          availability: processedData.availability || existingProfile.availability,
          updatedAt: new Date()
        }
      });

      // Recalculate completion score
      const completionScore = this.calculateCompletionScore(updatedProfile);
      await prisma.candidateProfile.update({
        where: { id: data.id },
        data: { completionScore }
      });

      // Track user interaction
      await this.trackInteraction(existingProfile.userId, 'profile_updated', 'candidate_profile', data.id, {
        completionScore,
        updatedFields: Object.keys(data).filter(key => key !== 'id')
      });

      // Re-analyze profile
      try {
        await this.profileAnalyzer.analyzeCandidateProfile(updatedProfile);
      } catch (error) {
        console.warn('Failed to re-analyze profile:', error);
      }

      return await this.getCandidateProfileById(data.id);
    } catch (error) {
      console.error('Error updating candidate profile:', error);
      throw error;
    }
  }

  /**
   * Delete candidate profile
   */
  async deleteCandidateProfile(id: string, userId: string): Promise<void> {
    try {
      const profile = await prisma.candidateProfile.findUnique({
        where: { id }
      });

      if (!profile) {
        throw new Error('Candidate profile not found');
      }

      if (profile.userId !== userId) {
        throw new Error('Not authorized to delete this profile');
      }

      await prisma.candidateProfile.delete({
        where: { id }
      });

      // Track user interaction
      await this.trackInteraction(userId, 'profile_deleted', 'candidate_profile', id);
    } catch (error) {
      console.error('Error deleting candidate profile:', error);
      throw error;
    }
  }

  /**
   * Search candidate profiles
   */
  async searchCandidateProfiles(options: CandidateProfileSearchOptions): Promise<{
    profiles: CandidateProfile[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const {
        query,
        filters = {},
        sortBy = 'relevance',
        sortOrder = 'desc',
        includeInactive = false,
        limit = 20,
        offset = 0
      } = options;

      const whereConditions: any = {};

      // Apply filters
      if (filters.userId) {
        whereConditions.userId = filters.userId;
      }

      if (!includeInactive) {
        whereConditions.isActive = true;
      }

      if (filters.availability !== undefined) {
        whereConditions.availability = {
          path: ['isAvailable'],
          equals: filters.availability
        };
      }

      if (filters.salaryRange) {
        if (filters.salaryRange.min || filters.salaryRange.max) {
          whereConditions.preferences = {
            path: ['salaryRange'],
            gte: filters.salaryRange.min,
            lte: filters.salaryRange.max
          };
        }
      }

      // Text search for query
      let orderBy: any = {};
      switch (sortBy) {
        case 'experience':
          // Order by total years of experience (would need calculation)
          orderBy = { createdAt: 'desc' }; // Fallback
          break;
        case 'education':
          // Order by education level (would need calculation)
          orderBy = { createdAt: 'desc' }; // Fallback
          break;
        case 'completion':
          orderBy = { completionScore: sortOrder };
          break;
        case 'updated_at':
          orderBy = { updatedAt: sortOrder };
          break;
        case 'relevance':
        default:
          if (query) {
            // Use text search ranking
            orderBy = { searchRanking: sortOrder };
          } else {
            orderBy = { completionScore: sortOrder };
          }
          break;
      }

      const profiles = await prisma.candidateProfile.findMany({
        where: whereConditions,
        orderBy,
        take: limit + 1, // Get one extra to check if there are more
        skip: offset,
        include: {
          user: {
            select: {
              uid: true,
              email: true,
              name: true,
              createdAt: true
            }
          }
        }
      });

      const hasMore = profiles.length > limit;
      const resultProfiles = hasMore ? profiles.slice(0, -1) : profiles;

      return {
        profiles: resultProfiles.map(p => this.transformDatabaseProfile(p)),
        total: await prisma.candidateProfile.count({ where: whereConditions }),
        hasMore
      };
    } catch (error) {
      console.error('Error searching candidate profiles:', error);
      throw error;
    }
  }

  /**
   * Get candidate profiles for matching
   */
  async getCandidatesForMatching(filters: {
    skills?: string[];
    location?: string;
    experienceMin?: number;
    experienceMax?: number;
    salaryMin?: number;
    salaryMax?: number;
    limit?: number;
  }): Promise<CandidateProfile[]> {
    try {
      const whereConditions: any = {
        isActive: true,
        completionScore: { gte: 60 } // Only profiles with decent completion
      };

      // Build complex filters for JSON fields
      const andConditions: any[] = [];

      if (filters.skills && filters.skills.length > 0) {
        andConditions.push({
          skills: {
            path: '$',
            some: {
              name: { in: filters.skills }
            }
          }
        });
      }

      if (filters.location) {
        andConditions.push({
          OR: [
            {
              personalInfo: {
                path: ['location', 'country'],
                contains: filters.location,
                mode: 'insensitive'
              }
            },
            {
              preferences: {
                path: ['location'],
                some: {
                  country: { contains: filters.location, mode: 'insensitive' }
                }
              }
            }
          ]
        });
      }

      if (filters.salaryMin || filters.salaryMax) {
        andConditions.push({
          preferences: {
            path: ['salaryRange'],
            gte: filters.salaryMin,
            lte: filters.salaryMax
          }
        });
      }

      if (andConditions.length > 0) {
        whereConditions.AND = andConditions;
      }

      const profiles = await prisma.candidateProfile.findMany({
        where: whereConditions,
        orderBy: [
          { completionScore: 'desc' },
          { searchRanking: 'desc' }
        ],
        take: filters.limit || 100,
        include: {
          user: {
            select: {
              uid: true,
              email: true,
              name: true
            }
          }
        }
      });

      return profiles.map(p => this.transformDatabaseProfile(p));
    } catch (error) {
      console.error('Error getting candidates for matching:', error);
      throw error;
    }
  }

  /**
   * Update candidate search ranking
   */
  async updateSearchRanking(profileId: string, ranking: number): Promise<void> {
    try {
      await prisma.candidateProfile.update({
        where: { id: profileId },
        data: { searchRanking: ranking }
      });
    } catch (error) {
      console.error('Error updating search ranking:', error);
      throw error;
    }
  }

  /**
   * Process and validate profile data
   */
  private async processProfileData(data: CreateCandidateProfileData): Promise<any> {
    const processed: any = {};

    // Personal info
    processed.personalInfo = {
      firstName: data.personalInfo.firstName.trim(),
      lastName: data.personalInfo.lastName.trim(),
      email: data.personalInfo.email.toLowerCase().trim(),
      phone: data.personalInfo.phone?.trim(),
      location: {
        country: data.personalInfo.location.country.trim(),
        city: data.personalInfo.location.city?.trim(),
        state: data.personalInfo.location.state?.trim(),
        isRemote: false,
        relocationWilling: false
      },
      linkedinUrl: data.personalInfo.linkedinUrl?.trim(),
      portfolioUrl: data.personalInfo.portfolioUrl?.trim(),
      githubUrl: data.personalInfo.githubUrl?.trim(),
      website: data.personalInfo.website?.trim(),
      languages: []
    };

    // Professional summary
    processed.professionalSummary = data.professionalSummary?.trim();

    // Process skills
    if (data.skills && data.skills.length > 0) {
      processed.skills = data.skills.map((skill, index) => ({
        id: skill.id || `skill_${Date.now()}_${index}`,
        name: skill.name?.trim(),
        category: skill.category || 'technical',
        level: skill.level || 'intermediate',
        experience: skill.experience || 0,
        isPrimary: skill.isPrimary || false,
        selfRated: true
      })).filter(skill => skill.name); // Remove empty skills
    }

    // Process experience
    if (data.experience && data.experience.length > 0) {
      processed.experience = data.experience.map((exp, index) => ({
        id: exp.id || `exp_${Date.now()}_${index}`,
        company: exp.company?.trim(),
        position: exp.position?.trim(),
        startDate: exp.startDate,
        endDate: exp.endDate,
        isCurrent: exp.isCurrent || false,
        description: exp.description?.trim(),
        location: exp.location?.trim(),
        employmentType: exp.employmentType || 'full_time',
        skills: exp.skills || [],
        achievements: exp.achievements || [],
        teamSize: exp.teamSize,
        directReports: exp.directReports,
        budget: exp.budget,
        tools: exp.tools || [],
        projects: exp.projects || []
      })).filter(exp => exp.company && exp.position); // Remove incomplete experience
    }

    // Process education
    if (data.education && data.education.length > 0) {
      processed.education = data.education.map((edu, index) => ({
        id: edu.id || `edu_${Date.now()}_${index}`,
        institution: edu.institution?.trim(),
        degree: edu.degree?.trim(),
        field: edu.field?.trim(),
        startDate: edu.startDate,
        endDate: edu.endDate,
        isCurrent: edu.isCurrent || false,
        gpa: edu.gpa,
        scale: edu.scale,
        honors: edu.honors || [],
        activities: edu.activities || [],
        thesis: edu.thesis?.trim(),
        relevantCoursework: edu.relevantCoursework || [],
        projects: edu.projects || [],
        certifications: edu.certifications || [],
        location: edu.location?.trim()
      })).filter(edu => edu.institution && edu.degree); // Remove incomplete education
    }

    // Process certifications
    if (data.certifications && data.certifications.length > 0) {
      processed.certifications = data.certifications.map((cert, index) => ({
        id: cert.id || `cert_${Date.now()}_${index}`,
        name: cert.name?.trim(),
        issuer: cert.issuer?.trim(),
        issueDate: cert.issueDate,
        expiryDate: cert.expiryDate,
        credentialId: cert.credentialId?.trim(),
        credentialUrl: cert.credentialUrl?.trim(),
        verificationUrl: cert.verificationUrl?.trim(),
        level: cert.level,
        status: cert.status || 'active',
        skills: cert.skills || [],
        description: cert.description?.trim()
      })).filter(cert => cert.name && cert.issuer); // Remove incomplete certifications
    }

    // Process preferences
    if (data.preferences) {
      processed.preferences = {
        location: data.preferences.location || [],
        salaryRange: data.preferences.salaryRange || {},
        workType: data.preferences.workType || [],
        remoteWorkPreference: data.preferences.remoteWorkPreference || 'flexible',
        companyTypes: data.preferences.companyTypes || [],
        industries: data.preferences.industries || [],
        teamSize: data.preferences.teamSize || 'small',
        travelRequirement: data.preferences.travelRequirement || 0,
        careerLevel: data.preferences.careerLevel || [],
        workSchedule: data.preferences.workSchedule || 'standard',
        benefits: data.preferences.benefits || [],
        cultureFit: data.preferences.cultureFit || [],
        growthOpportunities: data.preferences.growthOpportunities || [],
        excludeCompanies: data.preferences.excludeCompanies || [],
        mustHaveBenefits: data.preferences.mustHaveBenefits || [],
        dealBreakers: data.preferences.dealBreakers || []
      };
    }

    // Process availability
    if (data.availability) {
      processed.availability = {
        isAvailable: data.availability.isAvailable ?? true,
        availableFromDate: data.availability.availableFromDate,
        noticePeriod: data.availability.noticePeriod || 'two_weeks',
        preferredStartDate: data.availability.preferredStartDate,
        workSchedule: data.availability.workSchedule || 'standard',
        overtimeWilling: data.availability.overtimeWilling ?? false,
        weekendWorkWilling: data.availability.weekendWorkWilling ?? false,
        travelWilling: data.availability.travelWilling ?? false,
        relocationWilling: data.availability.relocationWilling ?? false,
        visaStatus: data.availability.visaStatus,
        workAuthorization: data.availability.workAuthorization || []
      };
    }

    return processed;
  }

  /**
   * Transform database profile to frontend format
   */
  private transformDatabaseProfile(dbProfile: any): CandidateProfile {
    return {
      id: dbProfile.id,
      userId: dbProfile.userId,
      personalInfo: dbProfile.personalInfo,
      professionalSummary: dbProfile.professionalSummary || '',
      skills: dbProfile.skills || [],
      experience: dbProfile.experience || [],
      education: dbProfile.education || [],
      certifications: dbProfile.certifications || [],
      preferences: dbProfile.preferences || {},
      availability: dbProfile.availability || {},
      metadata: {
        completionScore: dbProfile.completionScore,
        lastUpdated: dbProfile.updatedAt,
        visibility: dbProfile.visibility,
        isActive: dbProfile.isActive,
        isPublic: dbProfile.isPublic,
        allowSearch: dbProfile.allowSearch,
        allowDirectContact: dbProfile.allowDirectContact,
        dataRetentionSettings: {
          retentionPeriod: dbProfile.dataRetentionPeriod,
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
        verificationStatus: dbProfile.verificationStatus,
        lastProfileView: dbProfile.lastProfileView,
        profileViews: dbProfile.profileViews,
        searchRanking: dbProfile.searchRanking,
        featured: false,
        premium: false
      }
    };
  }

  /**
   * Calculate profile completion score
   */
  private calculateCompletionScore(profile: any): number {
    let score = 0;
    let maxScore = 0;

    // Personal info (25%)
    maxScore += 25;
    const personalInfo = profile.personalInfo || {};
    if (personalInfo.firstName && personalInfo.lastName) score += 5;
    if (personalInfo.email) score += 5;
    if (personalInfo.location?.country) score += 5;
    if (personalInfo.phone) score += 5;
    if (profile.professionalSummary && profile.professionalSummary.length > 50) score += 5;

    // Skills (20%)
    maxScore += 20;
    const skills = profile.skills || [];
    if (skills.length > 0) score += 10;
    if (skills.length >= 5) score += 10;

    // Experience (25%)
    maxScore += 25;
    const experience = profile.experience || [];
    if (experience.length > 0) score += 10;
    if (experience.some((exp: any) => exp.description && exp.description.length > 50)) score += 10;
    if (experience.some((exp: any) => !exp.isCurrent)) score += 5;

    // Education (15%)
    maxScore += 15;
    const education = profile.education || [];
    if (education.length > 0) score += 10;
    if (education.some((edu: any) => edu.degree && edu.institution)) score += 5;

    // Certifications (5%)
    maxScore += 5;
    if (profile.certifications && profile.certifications.length > 0) score += 5;

    // Preferences (10%)
    maxScore += 10;
    if (profile.preferences && Object.keys(profile.preferences).length > 0) score += 10;

    return maxScore > 0 ? Math.min(100, Math.round((score / maxScore) * 100)) : 0;
  }

  /**
   * Track user interaction
   */
  private async trackInteraction(
    userId: string,
    interactionType: string,
    targetType: string,
    targetId: string,
    metadata?: any
  ): Promise<void> {
    try {
      await prisma.userInteraction.create({
        data: {
          userId,
          interactionType,
          targetType,
          targetId,
          metadata,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.warn('Failed to track interaction:', error);
    }
  }
}