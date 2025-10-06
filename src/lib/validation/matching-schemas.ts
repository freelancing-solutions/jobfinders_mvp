import { z } from 'zod';

// Common schemas
export const LocationSchema = z.object({
  country: z.string().min(1, 'Country is required'),
  city: z.string().optional(),
  state: z.string().optional(),
  isRemote: z.boolean().default(false),
  relocationWilling: z.boolean().default(false),
});

export const SkillSchema = z.object({
  name: z.string().min(1, 'Skill name is required'),
  category: z.enum(['technical', 'soft_skill', 'domain', 'tool', 'language', 'framework', 'platform', 'methodology', 'certification']),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'expert', 'master']),
  experience: z.number().min(0).optional(),
  isPrimary: z.boolean().default(false),
});

export const WorkExperienceSchema = z.object({
  company: z.string().min(1, 'Company is required'),
  position: z.string().min(1, 'Position is required'),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  isCurrent: z.boolean().default(false),
  description: z.string().optional(),
  location: z.string().optional(),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'freelance', 'internship', 'temporary', 'consultant']),
  skills: z.array(z.string()).default([]),
  achievements: z.array(z.object({
    title: z.string(),
    description: z.string(),
    metrics: z.array(z.object({
      type: z.string(),
      value: z.union([z.number(), z.string()]),
      unit: z.string().optional(),
    })).optional(),
  })).default([]),
  teamSize: z.number().optional(),
  directReports: z.number().optional(),
  budget: z.number().optional(),
  tools: z.array(z.string()).default([]),
  projects: z.array(z.string()).default([]),
});

export const EducationSchema = z.object({
  institution: z.string().min(1, 'Institution is required'),
  degree: z.string().min(1, 'Degree is required'),
  field: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  isCurrent: z.boolean().default(false),
  gpa: z.number().min(0).max(5).optional(),
  scale: z.number().optional(),
  honors: z.array(z.string()).default([]),
  activities: z.array(z.string()).default([]),
  thesis: z.string().optional(),
  relevantCoursework: z.array(z.string()).default([]),
  projects: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
  location: z.string().optional(),
});

export const CertificationSchema = z.object({
  name: z.string().min(1, 'Certification name is required'),
  issuer: z.string().min(1, 'Issuer is required'),
  issueDate: z.string().datetime(),
  expiryDate: z.string().datetime().optional(),
  credentialId: z.string().optional(),
  credentialUrl: z.string().url().optional(),
  verificationUrl: z.string().url().optional(),
  level: z.enum(['foundation', 'associate', 'professional', 'expert', 'specialist', 'master']).optional(),
  status: z.enum(['active', 'expired', 'pending', 'revoked', 'in_progress']).default('active'),
  skills: z.array(z.string()).default([]),
  description: z.string().optional(),
});

export const SalaryRangeSchema = z.object({
  min: z.number().min(0).optional(),
  max: z.number().min(0).optional(),
  currency: z.string().default('USD'),
  period: z.enum(['hourly', 'monthly', 'yearly']).default('yearly'),
  negotiable: z.boolean().default(true),
});

export const JobPreferencesSchema = z.object({
  location: z.array(z.object({
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().min(1, 'Country is required'),
    priority: z.number().min(1).max(5),
    required: z.boolean().default(false),
  })).default([]),
  salaryRange: SalaryRangeSchema.optional(),
  workType: z.array(z.enum(['full_time', 'part_time', 'contract', 'freelance', 'internship', 'temporary', 'consultant'])).default([]),
  remoteWorkPreference: z.enum(['onsite_only', 'hybrid', 'remote_only', 'flexible']).default('flexible'),
  companyTypes: z.array(z.enum(['startup', 'smb', 'enterprise', 'non_profit', 'government', 'agency', 'education', 'healthcare'])).default([]),
  industries: z.array(z.string()).default([]),
  teamSize: z.enum(['solo', 'small', 'medium', 'large', 'very_large']).default('small'),
  travelRequirement: z.number().min(0).max(100).default(0),
  careerLevel: z.array(z.enum(['entry_level', 'early_career', 'mid_career', 'senior_level', 'executive_level'])).default([]),
  workSchedule: z.enum(['standard', 'flexible', 'shift_work', 'compressed', 'weekend', 'irregular']).default('standard'),
  benefits: z.array(z.object({
    type: z.enum(['health_insurance', 'dental_insurance', 'vision_insurance', 'retirement_plan', 'stock_options', 'bonus', 'profit_sharing', 'paid_time_off', 'parental_leave', 'educational_assistance', 'gym_membership', 'transportation', 'remote_work_stipend', 'flexible_hours']),
    required: z.boolean(),
    priority: z.number().min(1).max(5),
  })).default([]),
  cultureFit: z.array(z.object({
    aspect: z.enum(['work_life_balance', 'collaboration', 'innovation', 'structure', 'diversity', 'sustainability', 'social_impact', 'growth_mindset', 'autonomy', 'transparency']),
    preference: z.enum(['not_important', 'slightly_preferred', 'preferred', 'strongly_preferred', 'essential']),
    importance: z.number().min(1).max(5),
  })).default([]),
  growthOpportunities: z.array(z.object({
    type: z.enum(['promotion', 'skill_development', 'leadership', 'mentorship', 'cross_functional', 'specialization', 'entrepreneurship']),
    timeline: z.string(),
    priority: z.number().min(1).max(5),
  })).default([]),
  excludeCompanies: z.array(z.string()).default([]),
  mustHaveBenefits: z.array(z.string()).default([]),
  dealBreakers: z.array(z.string()).default([]),
});

export const AvailabilityInfoSchema = z.object({
  isAvailable: z.boolean().default(true),
  availableFromDate: z.string().datetime().optional(),
  noticePeriod: z.enum(['immediate', 'one_week', 'two_weeks', 'one_month', 'two_months', 'three_months', 'negotiable']).default('two_weeks'),
  preferredStartDate: z.string().datetime().optional(),
  workSchedule: z.enum(['standard', 'flexible', 'shift_work', 'compressed', 'weekend', 'irregular']).default('standard'),
  overtimeWilling: z.boolean().default(false),
  weekendWorkWilling: z.boolean().default(false),
  travelWilling: z.boolean().default(false),
  relocationWilling: z.boolean().default(false),
  visaStatus: z.enum(['citizen', 'permanent_resident', 'work_visa', 'student_visa', 'tourist_visa', 'no_visa', 'sponsorship_required']).optional(),
  workAuthorization: z.array(z.object({
    country: z.string(),
    type: z.string(),
    expiryDate: z.string().datetime().optional(),
    restrictions: z.array(z.string()).default([]),
  })).default([]),
});

// Candidate Profile Schemas
export const CreateCandidateProfileSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  personalInfo: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Valid email is required'),
    phone: z.string().optional(),
    location: LocationSchema,
    linkedinUrl: z.string().url().optional(),
    portfolioUrl: z.string().url().optional(),
    githubUrl: z.string().url().optional(),
    website: z.string().url().optional(),
  }),
  professionalSummary: z.string().optional(),
  skills: z.array(SkillSchema).default([]),
  experience: z.array(WorkExperienceSchema).default([]),
  education: z.array(EducationSchema).default([]),
  certifications: z.array(CertificationSchema).default([]),
  preferences: JobPreferencesSchema.optional(),
  availability: AvailabilityInfoSchema.optional(),
});

export const UpdateCandidateProfileSchema = CreateCandidateProfileSchema.partial().extend({
  id: z.string().min(1, 'Profile ID is required'),
});

export const CandidateProfileQuerySchema = z.object({
  userId: z.string().optional(),
  skills: z.array(z.string()).optional(),
  location: z.string().optional(),
  experienceLevel: z.string().optional(),
  educationLevel: z.string().optional(),
  availability: z.coerce.boolean().optional(),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

// Job Profile Schemas
export const JobRequirementsSchema = z.object({
  skills: z.array(z.object({
    name: z.string().min(1, 'Skill name is required'),
    level: z.enum(['beginner', 'intermediate', 'advanced', 'expert', 'master']),
    required: z.boolean(),
    importance: z.number().min(1).max(5).default(3),
    yearsExperience: z.number().min(0).optional(),
    alternatives: z.array(z.string()).default([]),
  })).default([]),
  experience: z.array(z.object({
    title: z.string().min(1, 'Title is required'),
    level: z.enum(['entry', 'junior', 'mid', 'senior', 'lead', 'manager', 'director', 'executive']),
    yearsRequired: z.number().min(0),
    industry: z.string().optional(),
    companyType: z.string().optional(),
    required: z.boolean(),
    alternatives: z.array(z.string()).default([]),
  })).default([]),
  education: z.array(z.object({
    level: z.enum(['high_school', 'associate', 'bachelor', 'master', 'phd', 'postdoctoral', 'professional', 'certificate', 'diploma']),
    field: z.string().optional(),
    specialization: z.string().optional(),
    required: z.boolean(),
    alternatives: z.array(z.string()).default([]),
  })).default([]),
  certifications: z.array(z.object({
    name: z.string().min(1, 'Certification name is required'),
    issuer: z.string().optional(),
    required: z.boolean(),
    alternatives: z.array(z.string()).default([]),
    expiryRequired: z.boolean().default(false),
  })).default([]),
  languages: z.array(z.object({
    language: z.string().min(1, 'Language is required'),
    proficiency: z.enum(['beginner', 'elementary', 'intermediate', 'upper_intermediate', 'advanced', 'proficient', 'native']),
    required: z.boolean(),
  })).default([]),
  qualifications: z.array(z.object({
    type: z.enum(['license', 'clearance', 'membership', 'registration', 'accreditation']),
    description: z.string().min(1, 'Description is required'),
    required: z.boolean(),
    importance: z.number().min(1).max(5).default(3),
  })).default([]),
});

export const EmployerPreferencesSchema = z.object({
  location: z.array(z.object({
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().min(1, 'Country is required'),
    priority: z.number().min(1).max(5),
    required: z.boolean().default(false),
  })).default([]),
  workType: z.array(z.enum(['full_time', 'part_time', 'contract', 'freelance', 'internship', 'temporary', 'consultant'])).default([]),
  experienceLevel: z.array(z.enum(['entry', 'junior', 'mid', 'senior', 'lead', 'manager', 'director', 'executive'])).default([]),
  companyCulture: z.array(z.object({
    aspect: z.enum(['work_life_balance', 'collaboration', 'innovation', 'structure', 'diversity', 'sustainability', 'social_impact', 'growth_mindset', 'autonomy', 'transparency']),
    required: z.boolean(),
    description: z.string().optional(),
  })).default([]),
  teamStructure: z.object({
    size: z.enum(['solo', 'small', 'medium', 'large', 'very_large']),
    structure: z.enum(['flat', 'hierarchical', 'matrix', 'agile', 'hybrid']),
    leadershipStyle: z.enum(['autocratic', 'democratic', 'transformational', 'servant', 'situational', 'hands_off']),
    collaborationLevel: z.enum(['independent', 'collaborative', 'highly_collaborative', 'cross_functional']),
  }),
  workEnvironment: z.object({
    pace: z.enum(['relaxed', 'moderate', 'fast', 'very_fast']),
    pressure: z.enum(['low', 'moderate', 'high', 'very_high']),
    innovation: z.enum(['low', 'moderate', 'high', 'cutting_edge']),
    structure: z.enum(['highly_structured', 'structured', 'flexible', 'unstructured']),
    flexibility: z.enum(['rigid', 'somewhat_flexible', 'flexible', 'highly_flexible']),
  }),
  diversityGoals: z.array(z.object({
    category: z.enum(['gender', 'ethnicity', 'age', 'disability', 'veteran', 'lgbtq', 'socioeconomic', 'educational', 'geographic']),
    target: z.string().optional(),
    importance: z.number().min(1).max(5),
    description: z.string().optional(),
  })).default([]),
});

export const CreateJobProfileSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  employerId: z.string().min(1, 'Employer ID is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  requirements: JobRequirementsSchema,
  preferences: EmployerPreferencesSchema,
  compensation: z.object({
    salaryRange: SalaryRangeSchema,
    bonuses: z.array(z.object({
      type: z.enum(['performance', 'sign_on', 'retention', 'referral', 'project', 'profit_sharing']),
      target: z.number().optional(),
      frequency: z.enum(['one_time', 'quarterly', 'semi_annual', 'annual']),
      criteria: z.array(z.string()).default([]),
    })).default([]),
    equity: z.object({
      type: z.enum(['stock_options', 'restricted_stock', 'rsu', 'stock_purchase_plan', 'profit_interest']),
      percentage: z.number().optional(),
      vestingSchedule: z.object({
        totalPeriod: z.number().min(1),
        cliffPeriod: z.number().min(0),
        frequency: z.enum(['monthly', 'quarterly', 'annual']),
      }).optional(),
      cliffPeriod: z.number().optional(),
    }).optional(),
    benefits: z.object({
      health: z.object({
        medical: z.boolean(),
        dental: z.boolean(),
        vision: z.boolean(),
        mentalHealth: z.boolean(),
        wellness: z.boolean(),
        familyCoverage: z.boolean(),
      }),
      retirement: z.object({
        plan: z.string(),
        employerMatch: z.boolean(),
        matchPercentage: z.number().optional(),
        vestingPeriod: z.number().optional(),
      }),
      leave: z.object({
        vacationDays: z.number().min(0),
        sickDays: z.number().min(0),
        personalDays: z.number().min(0),
        parentalLeave: z.object({
          maternity: z.number().min(0),
          paternity: z.number().min(0),
          adoption: z.number().min(0),
          paid: z.boolean(),
        }),
        bereavementLeave: z.boolean(),
        juryDutyLeave: z.boolean(),
      }),
      perks: z.object({
        meals: z.boolean(),
        transportation: z.boolean(),
        gym: z.boolean(),
        remoteWork: z.boolean(),
        flexibleHours: z.boolean(),
        equipment: z.boolean(),
        discounts: z.array(z.string()).default([]),
      }),
      development: z.object({
        trainingBudget: z.number().min(0),
        conferences: z.boolean(),
        certifications: z.boolean(),
        tuitionReimbursement: z.boolean(),
        mentorship: z.boolean(),
      }),
      flexible: z.object({
        customAllocation: z.boolean(),
        lifestyleAccount: z.boolean(),
        wellnessStipend: z.boolean(),
        educationStipend: z.boolean(),
        childcare: z.boolean(),
      }),
    }),
    reviewFrequency: z.enum(['monthly', 'quarterly', 'semi_annual', 'annual']),
    transparency: z.enum(['transparent', 'semi_transparent', 'confidential', 'undisclosed']),
    negotiable: z.boolean().default(true),
  }),
  companyInfo: z.object({
    id: z.string().min(1, 'Company ID is required'),
    name: z.string().min(1, 'Company name is required'),
    description: z.string().min(10, 'Company description must be at least 10 characters'),
    industry: z.string().min(1, 'Industry is required'),
    size: z.enum(['micro', 'small', 'medium', 'large', 'enterprise']),
    foundedYear: z.number().min(1800).max(new Date().getFullYear()).optional(),
    website: z.string().url().optional(),
    logoUrl: z.string().url().optional(),
    locations: z.array(z.object({
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().min(1, 'Country is required'),
      isHeadquarters: z.boolean(),
      address: z.string().optional(),
      remoteFriendly: z.boolean(),
    })).default([]),
  }),
  location: LocationSchema,
  metadata: z.object({
    postedDate: z.string().datetime(),
    expiryDate: z.string().datetime().optional(),
    urgency: z.enum(['low', 'medium', 'high', 'urgent', 'immediate']).default('medium'),
    isActive: z.boolean().default(true),
    isFeatured: z.boolean().default(false),
    department: z.string().optional(),
    division: z.string().optional(),
    requisitionId: z.string().optional(),
  }),
});

export const UpdateJobProfileSchema = CreateJobProfileSchema.partial().extend({
  id: z.string().min(1, 'Profile ID is required'),
});

export const JobProfileQuerySchema = z.object({
  employerId: z.string().optional(),
  title: z.string().optional(),
  skills: z.array(z.string()).optional(),
  location: z.string().optional(),
  experienceLevel: z.string().optional(),
  workType: z.array(z.string()).optional(),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  industry: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  isFeatured: z.coerce.boolean().optional(),
  postedAfter: z.string().datetime().optional(),
  postedBefore: z.string().datetime().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

// Generic ID parameter schema
export const IdParamSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});

// Export types for use in API handlers
export type CreateCandidateProfileInput = z.infer<typeof CreateCandidateProfileSchema>;
export type UpdateCandidateProfileInput = z.infer<typeof UpdateCandidateProfileSchema>;
export type CandidateProfileQueryInput = z.infer<typeof CandidateProfileQuerySchema>;
export type CreateJobProfileInput = z.infer<typeof CreateJobProfileSchema>;
export type UpdateJobProfileInput = z.infer<typeof UpdateJobProfileSchema>;
export type JobProfileQueryInput = z.infer<typeof JobProfileQuerySchema>;
export type IdParamInput = z.infer<typeof IdParamSchema>;