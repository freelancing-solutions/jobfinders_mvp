import { prisma } from '@/lib/prisma';
import { ProfileAnalyzer } from './profile-analyzer';
import type {
  JobProfile,
  JobRequirements,
  EmployerPreferences,
  CompensationInfo,
  CompanyInfo,
  JobMetadata
} from '@/types/profiles';
import type {
  JobAnalysis,
  MatchResult,
  UserInteraction
} from '@/types/matching';

export interface CreateJobProfileData {
  jobId: string;
  employerId: string;
  title: string;
  description: string;
  requirements: {
    skills: {
      name: string;
      level?: string;
      required: boolean;
      importance?: number;
      yearsExperience?: number;
      alternatives?: string[];
    }[];
    experience: {
      title: string;
      level?: string;
      yearsRequired: number;
      industry?: string;
      companyType?: string;
      required: boolean;
      alternatives?: string[];
    }[];
    education: {
      level: string;
      field?: string;
      specialization?: string;
      required: boolean;
      alternatives?: string[];
    }[];
    certifications: {
      name: string;
      issuer?: string;
      required: boolean;
      alternatives?: string[];
      expiryRequired?: boolean;
    }[];
    languages: {
      language: string;
      proficiency: string;
      required: boolean;
    }[];
    qualifications: {
      type: string;
      description: string;
      required: boolean;
      importance?: number;
    }[];
  };
  preferences: {
    location: {
      city?: string;
      state?: string;
      country: string;
      priority: number;
      required?: boolean;
    }[];
    workType: string[];
    experienceLevel: string[];
    companyCulture: {
      aspect: string;
      required: boolean;
      description?: string;
    }[];
    teamStructure: {
      size: string;
      structure: string;
      leadershipStyle: string;
      collaborationLevel: string;
    };
    workEnvironment: {
      pace: string;
      pressure: string;
      innovation: string;
      structure: string;
      flexibility: string;
    };
    diversityGoals: {
      category: string;
      target?: string;
      importance: number;
      description?: string;
    }[];
    compensationPhilosophy: {
      type: string;
      range: {
        min?: number;
        max?: number;
        currency?: string;
        period?: string;
      };
      bonuses: {
        type: string;
        target?: number;
        frequency: string;
        criteria?: string[];
      }[];
      equity?: {
        type: string;
        percentage?: number;
        vestingSchedule?: {
          totalPeriod: number;
          cliffPeriod: number;
          frequency: string;
        };
        cliffPeriod?: number;
      };
      benefits: {
        health: {
          medical: boolean;
          dental: boolean;
          vision: boolean;
          mentalHealth: boolean;
          wellness: boolean;
          familyCoverage: boolean;
        };
        retirement: {
          plan: string;
          employerMatch: boolean;
          matchPercentage?: number;
          vestingPeriod?: number;
        };
        leave: {
          vacationDays: number;
          sickDays: number;
          personalDays: number;
          parentalLeave: {
            maternity: number;
            paternity: number;
            adoption: number;
            paid: boolean;
          };
          bereavementLeave: boolean;
          juryDutyLeave: boolean;
        };
        perks: {
          meals: boolean;
          transportation: boolean;
          gym: boolean;
          remoteWork: boolean;
          flexibleHours: boolean;
          equipment: boolean;
          discounts: string[];
        };
        development: {
          trainingBudget: number;
          conferences: boolean;
          certifications: boolean;
          tuitionReimbursement: boolean;
          mentorship: boolean;
        };
        flexible: {
          customAllocation: boolean;
          lifestyleAccount: boolean;
          wellnessStipend: boolean;
          educationStipend: boolean;
          childcare: boolean;
        };
      };
      reviewFrequency: string;
      transparency: string;
    };
  };
  compensation: {
    salaryRange: {
      min?: number;
      max?: number;
      currency?: string;
      period?: string;
      negotiable?: boolean;
    };
    bonuses: {
      type: string;
      target?: number;
      frequency: string;
      criteria?: string[];
    }[];
    equity?: {
      type: string;
      percentage?: number;
      vestingSchedule?: {
        totalPeriod: number;
        cliffPeriod: number;
        frequency: string;
      };
      cliffPeriod?: number;
    };
    benefits: {
      health: {
        medical: boolean;
        dental: boolean;
        vision: boolean;
        mentalHealth: boolean;
        wellness: boolean;
        familyCoverage: boolean;
      };
      retirement: {
        plan: string;
        employerMatch: boolean;
        matchPercentage?: number;
        vestingPeriod?: number;
      };
      leave: {
        vacationDays: number;
        sickDays: number;
        personalDays: number;
        parentalLeave: {
          maternity: number;
          paternity: number;
          adoption: number;
          paid: boolean;
        };
        bereavementLeave: boolean;
        juryDutyLeave: boolean;
      };
      perks: {
        meals: boolean;
        transportation: boolean;
        gym: boolean;
        remoteWork: boolean;
        flexibleHours: boolean;
        equipment: boolean;
        discounts: string[];
      };
      development: {
        trainingBudget: number;
        conferences: boolean;
        certifications: boolean;
        tuitionReimbursement: boolean;
        mentorship: boolean;
      };
      flexible: {
        customAllocation: boolean;
        lifestyleAccount: boolean;
        wellnessStipend: boolean;
        educationStipend: boolean;
        childcare: boolean;
      };
    };
    reviewFrequency: string;
    transparency: string;
    negotiable?: boolean;
  };
  companyInfo: {
    id: string;
    name: string;
    description: string;
    industry: string;
    size: string;
    foundedYear?: number;
    website?: string;
    logoUrl?: string;
    locations: {
      city: string;
      state?: string;
      country: string;
      isHeadquarters: boolean;
      address?: string;
      remoteFriendly: boolean;
    }[];
    culture: {
      values: string[];
      mission: string;
      vision: string;
      workEnvironment: {
        pace: string;
        pressure: string;
        innovation: string;
        structure: string;
        flexibility: string;
      };
      diversityCommitment: string;
      sustainabilityFocus: boolean;
      socialImpact: boolean;
      innovationFocus: boolean;
    };
    benefits: {
      standardBenefits: {
        health: {
          medical: boolean;
          dental: boolean;
          vision: boolean;
          mentalHealth: boolean;
          wellness: boolean;
          familyCoverage: boolean;
        };
        retirement: {
          plan: string;
          employerMatch: boolean;
          matchPercentage?: number;
          vestingPeriod?: number;
        };
        leave: {
          vacationDays: number;
          sickDays: number;
          personalDays: number;
          parentalLeave: {
            maternity: number;
            paternity: number;
            adoption: number;
            paid: boolean;
          };
          bereavementLeave: boolean;
          juryDutyLeave: boolean;
        };
        perks: {
          meals: boolean;
          transportation: boolean;
          gym: boolean;
          remoteWork: boolean;
          flexibleHours: boolean;
          equipment: boolean;
          discounts: string[];
        };
        development: {
          trainingBudget: number;
          conferences: boolean;
          certifications: boolean;
          tuitionReimbursement: boolean;
          mentorship: boolean;
        };
        flexible: {
          customAllocation: boolean;
          lifestyleAccount: boolean;
          wellnessStipend: boolean;
          educationStipend: boolean;
          childcare: boolean;
        };
      };
      uniqueBenefits: string[];
      perksDescription: string;
      workLifeBalance: {
        flexibleHours: boolean;
        remoteWorkPolicy: string;
        vacationPolicy: string;
        parentalLeavePolicy: string;
        wellnessPrograms: boolean;
      };
    };
    growth: {
      fundingStage: string;
      employeeGrowth: {
        currentYear: number;
        previousYear: number;
        projectedYear: number;
        period: string;
      };
      revenueGrowth: {
        currentYear: number;
        previousYear: number;
        projectedYear: number;
        period: string;
      };
      marketPosition: string;
      expansionPlans: string[];
    };
    reputation: {
      overallRating: number;
      employeeSatisfaction: number;
      ceoApproval: number;
      recommendToFriend: number;
      awards: string[];
      pressMentions: string[];
      glassdoorUrl?: string;
      linkedinFollowers?: number;
    };
  };
  location: {
    city?: string;
    state?: string;
    country: string;
    postalCode?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    timezone?: string;
    isRemote: boolean;
    relocationWilling: boolean;
    preferredLocations?: {
      city?: string;
      state?: string;
      country: string;
      priority: number;
      required?: boolean;
    }[];
  };
  metadata: {
    postedDate: Date;
    expiryDate?: Date;
    urgency: string;
    isActive: boolean;
    isFeatured: boolean;
    department?: string;
    division?: string;
    requisitionId?: string;
  };
}

export interface UpdateJobProfileData extends Partial<CreateJobProfileData> {
  id: string;
}

export interface JobProfileQuery {
  employerId?: string;
  title?: string;
  skills?: string[];
  location?: string;
  experienceLevel?: string;
  workType?: string[];
  salaryMin?: number;
  salaryMax?: number;
  industry?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  postedAfter?: Date;
  postedBefore?: Date;
  limit?: number;
  offset?: number;
}

export interface JobProfileSearchOptions {
  query?: string;
  filters?: JobProfileQuery;
  sortBy?: 'relevance' | 'posted_date' | 'salary' | 'urgency' | 'application_count';
  sortOrder?: 'asc' | 'desc';
  includeInactive?: boolean;
}

export class JobService {
  private profileAnalyzer: ProfileAnalyzer;

  constructor() {
    this.profileAnalyzer = new ProfileAnalyzer();
  }

  /**
   * Create a new job profile
   */
  async createJobProfile(data: CreateJobProfileData): Promise<JobProfile> {
    try {
      // Validate employer exists and has employer role
      const employer = await prisma.user.findUnique({
        where: { uid: data.employerId },
        select: { role: true, email: true }
      });

      if (!employer) {
        throw new Error('Employer not found');
      }

      if (employer.role !== 'employer' && employer.role !== 'admin') {
        throw new Error('User must have employer role to create job profile');
      }

      // Validate job exists
      const job = await prisma.job.findUnique({
        where: { jobId: data.jobId }
      });

      if (!job) {
        throw new Error('Job not found');
      }

      // Check if job profile already exists
      const existingProfile = await prisma.jobProfile.findUnique({
        where: { jobId: data.jobId }
      });

      if (existingProfile) {
        throw new Error('Job profile already exists for this job');
      }

      // Process and validate the profile data
      const processedData = await this.processJobProfileData(data);

      // Create the profile
      const profile = await prisma.jobProfile.create({
        data: {
          jobId: data.jobId,
          employerId: data.employerId,
          title: processedData.title,
          description: processedData.description,
          requirements: processedData.requirements,
          preferences: processedData.preferences,
          compensation: processedData.compensation,
          companyInfo: processedData.companyInfo,
          location: processedData.location,
          metadata: processedData.metadata,
          isActive: true,
          isFeatured: processedData.metadata?.isFeatured || false,
          applicationCount: 0,
          viewCount: 0,
          searchRanking: 0.0,
          postedDate: processedData.metadata?.postedDate || new Date(),
          expiryDate: processedData.metadata?.expiryDate,
          urgency: processedData.metadata?.urgency || 'medium'
        }
      });

      // Track user interaction
      await this.trackInteraction(data.employerId, 'job_profile_created', 'job_profile', profile.id, {
        jobId: data.jobId,
        title: data.title
      });

      // Generate initial analysis
      try {
        await this.profileAnalyzer.analyzeJobProfile(profile);
      } catch (error) {
        console.warn('Failed to generate initial job analysis:', error);
      }

      return await this.getJobProfileById(profile.id);
    } catch (error) {
      console.error('Error creating job profile:', error);
      throw error;
    }
  }

  /**
   * Get job profile by ID
   */
  async getJobProfileById(id: string): Promise<JobProfile> {
    try {
      const profile = await prisma.jobProfile.findUnique({
        where: { id },
        include: {
          job: {
            select: {
              jobId: true,
              status: true,
              applicantCount: true,
              expiresAt: true,
              createdAt: true
            }
          },
          employer: {
            select: {
              uid: true,
              email: true,
              name: true,
              employerProfile: {
                select: {
                  companyId: true,
                  isVerified: true
                }
              }
            }
          }
        }
      });

      if (!profile) {
        throw new Error('Job profile not found');
      }

      // Update view count
      await prisma.jobProfile.update({
        where: { id },
        data: { viewCount: { increment: 1 } }
      });

      return this.transformDatabaseProfile(profile);
    } catch (error) {
      console.error('Error getting job profile:', error);
      throw error;
    }
  }

  /**
   * Get job profile by job ID
   */
  async getJobProfileByJobId(jobId: string): Promise<JobProfile | null> {
    try {
      const profile = await prisma.jobProfile.findUnique({
        where: { jobId }
      });

      if (!profile) {
        return null;
      }

      return await this.getJobProfileById(profile.id);
    } catch (error) {
      console.error('Error getting job profile by job ID:', error);
      throw error;
    }
  }

  /**
   * Update job profile
   */
  async updateJobProfile(data: UpdateJobProfileData): Promise<JobProfile> {
    try {
      const existingProfile = await prisma.jobProfile.findUnique({
        where: { id: data.id }
      });

      if (!existingProfile) {
        throw new Error('Job profile not found');
      }

      // Validate authorization
      if (existingProfile.employerId !== data.employerId) {
        throw new Error('Not authorized to update this job profile');
      }

      // Process and validate the update data
      const processedData = await this.processJobProfileData(data as CreateJobProfileData);

      // Update the profile
      const updatedProfile = await prisma.jobProfile.update({
        where: { id: data.id },
        data: {
          title: processedData.title,
          description: processedData.description,
          requirements: processedData.requirements,
          preferences: processedData.preferences,
          compensation: processedData.compensation,
          companyInfo: processedData.companyInfo,
          location: processedData.location,
          metadata: processedData.metadata,
          lastUpdated: new Date()
        }
      });

      // Track user interaction
      await this.trackInteraction(existingProfile.employerId, 'job_profile_updated', 'job_profile', data.id, {
        jobId: existingProfile.jobId,
        title: data.title,
        updatedFields: Object.keys(data).filter(key => key !== 'id')
      });

      // Re-analyze profile
      try {
        await this.profileAnalyzer.analyzeJobProfile(updatedProfile);
      } catch (error) {
        console.warn('Failed to re-analyze job profile:', error);
      }

      return await this.getJobProfileById(data.id);
    } catch (error) {
      console.error('Error updating job profile:', error);
      throw error;
    }
  }

  /**
   * Delete job profile
   */
  async deleteJobProfile(id: string, employerId: string): Promise<void> {
    try {
      const profile = await prisma.jobProfile.findUnique({
        where: { id }
      });

      if (!profile) {
        throw new Error('Job profile not found');
      }

      if (profile.employerId !== employerId) {
        throw new Error('Not authorized to delete this job profile');
      }

      await prisma.jobProfile.delete({
        where: { id }
      });

      // Track user interaction
      await this.trackInteraction(employerId, 'job_profile_deleted', 'job_profile', id, {
        jobId: profile.jobId
      });
    } catch (error) {
      console.error('Error deleting job profile:', error);
      throw error;
    }
  }

  /**
   * Search job profiles
   */
  async searchJobProfiles(options: JobProfileSearchOptions): Promise<{
    profiles: JobProfile[];
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
      if (filters.employerId) {
        whereConditions.employerId = filters.employerId;
      }

      if (!includeInactive) {
        whereConditions.isActive = true;
      }

      if (filters.isFeatured !== undefined) {
        whereConditions.isFeatured = filters.isFeatured;
      }

      if (filters.title) {
        whereConditions.title = {
          contains: filters.title,
          mode: 'insensitive'
        };
      }

      if (filters.postedAfter || filters.postedBefore) {
        whereConditions.postedDate = {};
        if (filters.postedAfter) {
          whereConditions.postedDate.gte = filters.postedAfter;
        }
        if (filters.postedBefore) {
          whereConditions.postedDate.lte = filters.postedBefore;
        }
      }

      // Build complex filters for JSON fields
      const andConditions: any[] = [];

      if (filters.skills && filters.skills.length > 0) {
        andConditions.push({
          requirements: {
            path: ['skills'],
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
              location: {
                path: ['country'],
                contains: filters.location,
                mode: 'insensitive'
              }
            },
            {
              location: {
                path: ['city'],
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

      if (filters.experienceLevel) {
        andConditions.push({
          requirements: {
            path: ['experience'],
            some: {
              level: filters.experienceLevel
            }
          }
        });
      }

      if (filters.workType && filters.workType.length > 0) {
        andConditions.push({
          preferences: {
            path: ['workType'],
            some: {
              in: filters.workType
            }
          }
        });
      }

      if (filters.salaryMin || filters.salaryMax) {
        andConditions.push({
          compensation: {
            path: ['salaryRange'],
            gte: filters.salaryMin,
            lte: filters.salaryMax
          }
        });
      }

      if (filters.industry) {
        andConditions.push({
          companyInfo: {
            path: ['industry'],
            contains: filters.industry,
            mode: 'insensitive'
          }
        });
      }

      if (andConditions.length > 0) {
        whereConditions.AND = andConditions;
      }

      // Determine ordering
      let orderBy: any = {};
      switch (sortBy) {
        case 'posted_date':
          orderBy = { postedDate: sortOrder };
          break;
        case 'salary':
          // Order by max salary in compensation range
          orderBy = {
            compensation: {
              path: ['salaryRange', 'max'],
              sort: sortOrder
            }
          };
          break;
        case 'urgency':
          orderBy = { urgency: sortOrder };
          break;
        case 'application_count':
          orderBy = { applicationCount: sortOrder };
          break;
        case 'relevance':
        default:
          if (query) {
            orderBy = { searchRanking: sortOrder };
          } else {
            orderBy = { postedDate: sortOrder };
          }
          break;
      }

      const profiles = await prisma.jobProfile.findMany({
        where: whereConditions,
        orderBy,
        take: limit + 1, // Get one extra to check if there are more
        skip: offset,
        include: {
          job: {
            select: {
              jobId: true,
              status: true,
              applicantCount: true,
              expiresAt: true,
              createdAt: true
            }
          },
          employer: {
            select: {
              uid: true,
              email: true,
              name: true,
              employerProfile: {
                select: {
                  companyId: true,
                  isVerified: true
                }
              }
            }
          }
        }
      });

      const hasMore = profiles.length > limit;
      const resultProfiles = hasMore ? profiles.slice(0, -1) : profiles;

      return {
        profiles: resultProfiles.map(p => this.transformDatabaseProfile(p)),
        total: await prisma.jobProfile.count({ where: whereConditions }),
        hasMore
      };
    } catch (error) {
      console.error('Error searching job profiles:', error);
      throw error;
    }
  }

  /**
   * Get job profiles for matching
   */
  async getJobsForMatching(filters: {
    skills?: string[];
    location?: string;
    experienceLevel?: string;
    workType?: string[];
    salaryMin?: number;
    salaryMax?: number;
    limit?: number;
  }): Promise<JobProfile[]> {
    try {
      const whereConditions: any = {
        isActive: true
      };

      // Build complex filters for JSON fields
      const andConditions: any[] = [];

      if (filters.skills && filters.skills.length > 0) {
        andConditions.push({
          requirements: {
            path: ['skills'],
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
              location: {
                path: ['country'],
                contains: filters.location,
                mode: 'insensitive'
              }
            },
            {
              location: {
                path: ['city'],
                contains: filters.location,
                mode: 'insensitive'
              }
            },
            {
              location: {
                path: ['isRemote'],
                equals: true
              }
            }
          ]
        });
      }

      if (filters.experienceLevel) {
        andConditions.push({
          requirements: {
            path: ['experience'],
            some: {
              level: filters.experienceLevel
            }
          }
        });
      }

      if (filters.workType && filters.workType.length > 0) {
        andConditions.push({
          preferences: {
            path: ['workType'],
            some: {
              in: filters.workType
            }
          }
        });
      }

      if (filters.salaryMin || filters.salaryMax) {
        andConditions.push({
          compensation: {
            path: ['salaryRange'],
            gte: filters.salaryMin,
            lte: filters.salaryMax
          }
        });
      }

      if (andConditions.length > 0) {
        whereConditions.AND = andConditions;
      }

      const profiles = await prisma.jobProfile.findMany({
        where: whereConditions,
        orderBy: [
          { isFeatured: 'desc' },
          { searchRanking: 'desc' },
          { postedDate: 'desc' }
        ],
        take: filters.limit || 100,
        include: {
          job: {
            select: {
              jobId: true,
              status: true,
              applicantCount: true,
              expiresAt: true,
              createdAt: true
            }
          },
          employer: {
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
      console.error('Error getting jobs for matching:', error);
      throw error;
    }
  }

  /**
   * Update job search ranking
   */
  async updateSearchRanking(profileId: string, ranking: number): Promise<void> {
    try {
      await prisma.jobProfile.update({
        where: { id: profileId },
        data: { searchRanking: ranking }
      });
    } catch (error) {
      console.error('Error updating job search ranking:', error);
      throw error;
    }
  }

  /**
   * Process and validate job profile data
   */
  private async processJobProfileData(data: CreateJobProfileData): Promise<any> {
    const processed: any = {};

    // Basic info
    processed.title = data.title.trim();
    processed.description = data.description.trim();

    // Process requirements
    processed.requirements = {
      skills: data.requirements.skills.map((skill, index) => ({
        id: `skill_${Date.now()}_${index}`,
        name: skill.name.trim(),
        level: skill.level || 'intermediate',
        required: skill.required,
        importance: skill.importance || 3,
        yearsExperience: skill.yearsExperience,
        alternatives: skill.alternatives || []
      })),
      experience: data.requirements.experience.map((exp, index) => ({
        id: `exp_${Date.now()}_${index}`,
        title: exp.title.trim(),
        level: exp.level || 'mid',
        yearsRequired: exp.yearsRequired,
        industry: exp.industry?.trim(),
        companyType: exp.companyType,
        required: exp.required,
        alternatives: exp.alternatives || []
      })),
      education: data.requirements.education.map((edu, index) => ({
        id: `edu_${Date.now()}_${index}`,
        level: edu.level,
        field: edu.field?.trim(),
        specialization: edu.specialization?.trim(),
        required: edu.required,
        alternatives: edu.alternatives || []
      })),
      certifications: data.requirements.certifications.map((cert, index) => ({
        id: `cert_${Date.now()}_${index}`,
        name: cert.name.trim(),
        issuer: cert.issuer?.trim(),
        required: cert.required,
        alternatives: cert.alternatives || [],
        expiryRequired: cert.expiryRequired || false
      })),
      languages: data.requirements.languages.map((lang, index) => ({
        id: `lang_${Date.now()}_${index}`,
        language: lang.language.trim(),
        proficiency: lang.proficiency,
        required: lang.required
      })),
      qualifications: data.requirements.qualifications.map((qual, index) => ({
        id: `qual_${Date.now()}_${index}`,
        type: qual.type.trim(),
        description: qual.description.trim(),
        required: qual.required,
        importance: qual.importance || 3
      }))
    };

    // Process preferences
    processed.preferences = {
      location: data.preferences.location.map((loc, index) => ({
        id: `loc_${Date.now()}_${index}`,
        city: loc.city?.trim(),
        state: loc.state?.trim(),
        country: loc.country.trim(),
        priority: loc.priority,
        required: loc.required
      })),
      workType: data.preferences.workType,
      experienceLevel: data.preferences.experienceLevel,
      companyCulture: data.preferences.companyCulture.map((culture, index) => ({
        id: `culture_${Date.now()}_${index}`,
        aspect: culture.aspect.trim(),
        required: culture.required,
        description: culture.description?.trim()
      })),
      teamStructure: data.preferences.teamStructure,
      workEnvironment: data.preferences.workEnvironment,
      diversityGoals: data.preferences.diversityGoals.map((goal, index) => ({
        id: `div_${Date.now()}_${index}`,
        category: goal.category.trim(),
        target: goal.target?.trim(),
        importance: goal.importance,
        description: goal.description?.trim()
      })),
      compensationPhilosophy: data.preferences.compensationPhilosophy
    };

    // Process compensation
    processed.compensation = {
      salaryRange: {
        min: data.compensation.salaryRange.min,
        max: data.compensation.salaryRange.max,
        currency: data.compensation.salaryRange.currency || 'USD',
        period: data.compensation.salaryRange.period || 'yearly',
        negotiable: data.compensation.salaryRange.negotiable ?? true
      },
      bonuses: data.compensation.bonuses,
      equity: data.compensation.equity,
      benefits: data.compensation.benefits,
      reviewFrequency: data.compensation.reviewFrequency || 'annual',
      transparency: data.compensation.transparency || 'semi_transparent',
      negotiable: data.compensation.negotiable ?? true
    };

    // Process company info
    processed.companyInfo = {
      id: data.companyInfo.id,
      name: data.companyInfo.name.trim(),
      description: data.companyInfo.description.trim(),
      industry: data.companyInfo.industry.trim(),
      size: data.companyInfo.size,
      foundedYear: data.companyInfo.foundedYear,
      website: data.companyInfo.website?.trim(),
      logoUrl: data.companyInfo.logoUrl?.trim(),
      locations: data.companyInfo.locations,
      culture: data.companyInfo.culture,
      benefits: data.companyInfo.benefits,
      growth: data.companyInfo.growth,
      reputation: data.companyInfo.reputation
    };

    // Process location
    processed.location = {
      city: data.location.city?.trim(),
      state: data.location.state?.trim(),
      country: data.location.country.trim(),
      postalCode: data.location.postalCode?.trim(),
      coordinates: data.location.coordinates,
      timezone: data.location.timezone,
      isRemote: data.location.isRemote,
      relocationWilling: data.location.relocationWilling,
      preferredLocations: data.location.preferredLocations
    };

    // Process metadata
    processed.metadata = {
      postedDate: data.metadata.postedDate,
      expiryDate: data.metadata.expiryDate,
      urgency: data.metadata.urgency,
      isActive: data.metadata.isActive ?? true,
      isFeatured: data.metadata.isFeatured ?? false,
      department: data.metadata.department?.trim(),
      division: data.metadata.division?.trim(),
      requisitionId: data.metadata.requisitionId?.trim()
    };

    return processed;
  }

  /**
   * Transform database profile to frontend format
   */
  private transformDatabaseProfile(dbProfile: any): JobProfile {
    return {
      id: dbProfile.id,
      jobId: dbProfile.jobId,
      employerId: dbProfile.employerId,
      title: dbProfile.title,
      description: dbProfile.description,
      requirements: dbProfile.requirements,
      preferences: dbProfile.preferences,
      compensation: dbProfile.compensation,
      companyInfo: dbProfile.companyInfo,
      location: dbProfile.location,
      metadata: {
        postedDate: dbProfile.postedDate,
        expiryDate: dbProfile.expiryDate,
        urgency: dbProfile.urgency,
        isActive: dbProfile.isActive,
        isFeatured: dbProfile.isFeatured,
        applicationCount: dbProfile.applicationCount,
        viewCount: dbProfile.viewCount,
        searchRanking: dbProfile.searchRanking,
        lastUpdated: dbProfile.lastUpdated
      }
    };
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