/**
 * Data Validator Utility
 *
 * Comprehensive validation and sanitization for resume data extracted
 * from various file formats, ensuring data integrity and security.
 */

import { z } from 'zod';
import { Resume, PersonalInfo, Experience, Education, Skill, Project, Certification, Language } from '@/types/resume';

// Validation schemas
export const personalInfoSchema = z.object({
  fullName: z.string()
    .min(1, 'Full name is required')
    .max(100, 'Full name must be less than 100 characters')
    .regex(/^[a-zA-Z\s\-'.]+$/, 'Full name can only contain letters, spaces, hyphens, apostrophes, and periods'),
  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email must be less than 255 characters'),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(20, 'Phone number must be less than 20 characters')
    .regex(/^[\d\s\-\+\(\)]+$/, 'Phone number can only contain digits, spaces, hyphens, plus, and parentheses'),
  location: z.string()
    .min(1, 'Location is required')
    .max(200, 'Location must be less than 200 characters'),
  website: z.string()
    .url('Invalid website URL')
    .max(500, 'Website URL must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  linkedin: z.string()
    .url('Invalid LinkedIn URL')
    .max(500, 'LinkedIn URL must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  github: z.string()
    .url('Invalid GitHub URL')
    .max(500, 'GitHub URL must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  portfolio: z.string()
    .url('Invalid portfolio URL')
    .max(500, 'Portfolio URL must be less than 500 characters')
    .optional()
    .or(z.literal('')),
});

export const experienceSchema = z.object({
  id: z.string().uuid('Invalid experience ID'),
  title: z.string()
    .min(1, 'Job title is required')
    .max(200, 'Job title must be less than 200 characters'),
  company: z.string()
    .min(1, 'Company name is required')
    .max(200, 'Company name must be less than 200 characters'),
  location: z.string()
    .max(200, 'Location must be less than 200 characters')
    .optional()
    .or(z.literal('')),
  startDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  endDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
    .nullable()
    .optional(),
  current: z.boolean(),
  description: z.string()
    .max(5000, 'Description must be less than 5000 characters')
    .optional()
    .or(z.literal('')),
  achievements: z.array(z.string().max(500, 'Achievement must be less than 500 characters'))
    .max(10, 'Cannot have more than 10 achievements')
    .optional(),
  skills: z.array(z.string().max(100, 'Skill name must be less than 100 characters'))
    .max(50, 'Cannot have more than 50 skills')
    .optional(),
});

export const educationSchema = z.object({
  id: z.string().uuid('Invalid education ID'),
  institution: z.string()
    .min(1, 'Institution name is required')
    .max(200, 'Institution name must be less than 200 characters'),
  degree: z.string()
    .min(1, 'Degree is required')
    .max(200, 'Degree must be less than 200 characters'),
  field: z.string()
    .max(200, 'Field of study must be less than 200 characters')
    .optional()
    .or(z.literal('')),
  location: z.string()
    .max(200, 'Location must be less than 200 characters')
    .optional()
    .or(z.literal('')),
  startDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  endDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format'),
  gpa: z.number()
    .min(0, 'GPA cannot be negative')
    .max(4.0, 'GPA cannot exceed 4.0')
    .optional(),
  honors: z.array(z.string().max(200, 'Honor must be less than 200 characters'))
    .max(10, 'Cannot have more than 10 honors')
    .optional(),
  coursework: z.array(z.string().max(100, 'Course name must be less than 100 characters'))
    .max(20, 'Cannot have more than 20 courses')
    .optional(),
});

export const skillSchema = z.object({
  id: z.string().uuid('Invalid skill ID'),
  name: z.string()
    .min(1, 'Skill name is required')
    .max(100, 'Skill name must be less than 100 characters'),
  category: z.enum(['technical', 'soft', 'language', 'tool']),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  yearsOfExperience: z.number()
    .min(0, 'Years of experience cannot be negative')
    .max(50, 'Years of experience cannot exceed 50')
    .optional(),
});

export const projectSchema = z.object({
  id: z.string().uuid('Invalid project ID'),
  name: z.string()
    .min(1, 'Project name is required')
    .max(200, 'Project name must be less than 200 characters'),
  description: z.string()
    .max(2000, 'Description must be less than 2000 characters')
    .optional()
    .or(z.literal('')),
  technologies: z.array(z.string().max(100, 'Technology name must be less than 100 characters'))
    .max(20, 'Cannot have more than 20 technologies')
    .optional(),
  link: z.string()
    .url('Invalid project URL')
    .max(500, 'Project URL must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  github: z.string()
    .url('Invalid GitHub URL')
    .max(500, 'GitHub URL must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  startDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  endDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
    .nullable()
    .optional(),
  status: z.enum(['completed', 'in-progress', 'planned']),
});

export const certificationSchema = z.object({
  id: z.string().uuid('Invalid certification ID'),
  name: z.string()
    .min(1, 'Certification name is required')
    .max(300, 'Certification name must be less than 300 characters'),
  issuer: z.string()
    .min(1, 'Issuer is required')
    .max(200, 'Issuer name must be less than 200 characters'),
  issueDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Issue date must be in YYYY-MM-DD format'),
  expiryDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expiry date must be in YYYY-MM-DD format')
    .nullable()
    .optional(),
  credentialId: z.string()
    .max(100, 'Credential ID must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  credentialUrl: z.string()
    .url('Invalid credential URL')
    .max(500, 'Credential URL must be less than 500 characters')
    .optional()
    .or(z.literal('')),
});

export const languageSchema = z.object({
  id: z.string().uuid('Invalid language ID'),
  name: z.string()
    .min(1, 'Language name is required')
    .max(100, 'Language name must be less than 100 characters'),
  proficiency: z.enum(['native', 'fluent', 'professional', 'conversational', 'basic']),
});

export const resumeSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().min(1, 'User ID is required'),
  personalInfo: personalInfoSchema,
  summary: z.string()
    .max(1000, 'Summary must be less than 1000 characters')
    .optional()
    .or(z.literal('')),
  experience: z.array(experienceSchema)
    .max(20, 'Cannot have more than 20 experiences')
    .optional(),
  education: z.array(educationSchema)
    .max(10, 'Cannot have more than 10 education entries')
    .optional(),
  skills: z.array(skillSchema)
    .max(100, 'Cannot have more than 100 skills')
    .optional(),
  projects: z.array(projectSchema)
    .max(20, 'Cannot have more than 20 projects')
    .optional(),
  certifications: z.array(certificationSchema)
    .max(20, 'Cannot have more than 20 certifications')
    .optional(),
  languages: z.array(languageSchema)
    .max(10, 'Cannot have more than 10 languages')
    .optional(),
  customSections: z.array(z.any()).optional(), // Flexible for custom sections
  metadata: z.object({
    title: z.string().max(200, 'Title must be less than 200 characters'),
    description: z.string().max(500, 'Description must be less than 500 characters'),
    targetJobTitle: z.string().max(200, 'Target job title must be less than 200 characters').optional(),
    targetIndustry: z.string().max(200, 'Target industry must be less than 200 characters').optional(),
    experienceLevel: z.enum(['entry', 'mid', 'senior', 'executive']),
    documentFormat: z.enum(['pdf', 'docx', 'html']),
    atsScore: z.number().min(0).max(100).optional(),
    lastAnalyzedAt: z.string().datetime().optional(),
    templateUsed: z.string().max(100, 'Template name must be less than 100 characters').optional(),
  }),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  sanitizedData?: Partial<Resume>;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  path?: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
  severity: 'low' | 'medium' | 'high';
  path?: string;
}

export class DataValidator {
  private readonly sanitizePatterns: { [key: string]: RegExp } = {
    // Remove potentially dangerous content
    script: /<script[^>]*>.*?<\/script>/gis,
    iframe: /<iframe[^>]*>.*?<\/iframe>/gis,
    object: /<object[^>]*>.*?<\/object>/gis,
    embed: /<embed[^>]*>/gis,
    javascript: /javascript:/gi,
    vbscript: /vbscript:/gi,
    data: /data:/gi,

    // Normalize whitespace
    excessiveWhitespace: /\s+/g,
    multipleNewlines: /\n{3,}/g,

    // Remove control characters except newlines and tabs
    controlChars: /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g,
  };

  async validateResume(data: Partial<Resume>, options: {
    strict?: boolean;
    sanitize?: boolean;
  } = {}): Promise<ValidationResult> {
    const { strict = false, sanitize = true } = options;
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let sanitizedData = data;

    try {
      // First, sanitize data if requested
      if (sanitize) {
        sanitizedData = await this.sanitizeResumeData(data);
      }

      // Validate with Zod schema
      const result = resumeSchema.safeParse(sanitizedData);

      if (!result.success) {
        // Handle Zod validation errors
        result.error.issues.forEach(issue => {
          const path = issue.path.join('.');
          errors.push({
            field: path || 'root',
            message: issue.message,
            code: issue.code,
            path,
          });
        });
      } else {
        sanitizedData = result.data;
      }

      // Perform additional business logic validation
      const businessErrors = this.validateBusinessLogic(sanitizedData);
      errors.push(...businessErrors);

      // Generate warnings for potential issues
      const potentialWarnings = this.generateWarnings(sanitizedData);
      warnings.push(...potentialWarnings);

      // Strict mode validation
      if (strict) {
        const strictErrors = this.validateStrictMode(sanitizedData);
        errors.push(...strictErrors);
      }

    } catch (error) {
      errors.push({
        field: 'validation',
        message: `Validation process failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'VALIDATION_ERROR',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedData: sanitize ? sanitizedData : data,
    };
  }

  private async sanitizeResumeData(data: Partial<Resume>): Promise<Partial<Resume>> {
    const sanitized = JSON.parse(JSON.stringify(data)); // Deep clone

    // Sanitize personal info
    if (sanitized.personalInfo) {
      sanitized.personalInfo = this.sanitizePersonalInfo(sanitized.personalInfo);
    }

    // Sanitize text fields
    if (sanitized.summary) {
      sanitized.summary = this.sanitizeText(sanitized.summary);
    }

    // Sanitize experience
    if (sanitized.experience) {
      sanitized.experience = sanitized.experience.map(exp => this.sanitizeExperience(exp));
    }

    // Sanitize education
    if (sanitized.education) {
      sanitized.education = sanitized.education.map(edu => this.sanitizeEducation(edu));
    }

    // Sanitize skills
    if (sanitized.skills) {
      sanitized.skills = sanitized.skills.map(skill => this.sanitizeSkill(skill));
    }

    // Sanitize projects
    if (sanitized.projects) {
      sanitized.projects = sanitized.projects.map(project => this.sanitizeProject(project));
    }

    // Sanitize certifications
    if (sanitized.certifications) {
      sanitized.certifications = sanitized.certifications.map(cert => this.sanitizeCertification(cert));
    }

    // Sanitize metadata
    if (sanitized.metadata) {
      sanitized.metadata = this.sanitizeMetadata(sanitized.metadata);
    }

    return sanitized;
  }

  private sanitizePersonalInfo(personalInfo: Partial<PersonalInfo>): Partial<PersonalInfo> {
    return {
      fullName: this.sanitizeText(personalInfo.fullName || ''),
      email: this.sanitizeEmail(personalInfo.email || ''),
      phone: this.sanitizePhone(personalInfo.phone || ''),
      location: this.sanitizeText(personalInfo.location || ''),
      website: this.sanitizeUrl(personalInfo.website || ''),
      linkedin: this.sanitizeUrl(personalInfo.linkedin || ''),
      github: this.sanitizeUrl(personalInfo.github || ''),
      portfolio: this.sanitizeUrl(personalInfo.portfolio || ''),
    };
  }

  private sanitizeExperience(experience: Partial<Experience>): Partial<Experience> {
    return {
      ...experience,
      title: this.sanitizeText(experience.title || ''),
      company: this.sanitizeText(experience.company || ''),
      location: this.sanitizeText(experience.location || ''),
      description: this.sanitizeText(experience.description || ''),
      achievements: experience.achievements?.map(achievement => this.sanitizeText(achievement)) || [],
      skills: experience.skills?.map(skill => this.sanitizeText(skill)) || [],
    };
  }

  private sanitizeEducation(education: Partial<Education>): Partial<Education> {
    return {
      ...education,
      institution: this.sanitizeText(education.institution || ''),
      degree: this.sanitizeText(education.degree || ''),
      field: this.sanitizeText(education.field || ''),
      location: this.sanitizeText(education.location || ''),
      honors: education.honors?.map(honor => this.sanitizeText(honor)) || [],
      coursework: education.coursework?.map(course => this.sanitizeText(course)) || [],
    };
  }

  private sanitizeSkill(skill: Partial<Skill>): Partial<Skill> {
    return {
      ...skill,
      name: this.sanitizeText(skill.name || ''),
    };
  }

  private sanitizeProject(project: Partial<Project>): Partial<Project> {
    return {
      ...project,
      name: this.sanitizeText(project.name || ''),
      description: this.sanitizeText(project.description || ''),
      technologies: project.technologies?.map(tech => this.sanitizeText(tech)) || [],
      link: this.sanitizeUrl(project.link || ''),
      github: this.sanitizeUrl(project.github || ''),
    };
  }

  private sanitizeCertification(certification: Partial<Certification>): Partial<Certification> {
    return {
      ...certification,
      name: this.sanitizeText(certification.name || ''),
      issuer: this.sanitizeText(certification.issuer || ''),
      credentialId: this.sanitizeText(certification.credentialId || ''),
      credentialUrl: this.sanitizeUrl(certification.credentialUrl || ''),
    };
  }

  private sanitizeMetadata(metadata: any): any {
    return {
      ...metadata,
      title: this.sanitizeText(metadata.title || ''),
      description: this.sanitizeText(metadata.description || ''),
      targetJobTitle: this.sanitizeText(metadata.targetJobTitle || ''),
      targetIndustry: this.sanitizeText(metadata.targetIndustry || ''),
      templateUsed: this.sanitizeText(metadata.templateUsed || ''),
    };
  }

  private sanitizeText(text: string): string {
    if (!text) return '';

    let sanitized = text;

    // Remove dangerous content
    Object.entries(this.sanitizePatterns).forEach(([name, pattern]) => {
      if (name !== 'excessiveWhitespace' && name !== 'multipleNewlines') {
        sanitized = sanitized.replace(pattern, '');
      }
    });

    // Normalize whitespace
    sanitized = sanitized
      .replace(this.sanitizePatterns.excessiveWhitespace, ' ')
      .replace(this.sanitizePatterns.multipleNewlines, '\n\n')
      .replace(this.sanitizePatterns.controlChars, '')
      .trim();

    return sanitized;
  }

  private sanitizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  private sanitizePhone(phone: string): string {
    return phone.replace(/[^\d\s\-\+\(\)]/g, '').trim();
  }

  private sanitizeUrl(url: string): string {
    if (!url) return '';

    try {
      // Basic URL normalization
      const normalized = url.trim();
      if (normalized && !normalized.match(/^https?:\/\//)) {
        return `https://${normalized}`;
      }
      return normalized;
    } catch {
      return '';
    }
  }

  private validateBusinessLogic(data: Partial<Resume>): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate experience dates
    if (data.experience) {
      data.experience.forEach((exp, index) => {
        if (exp.startDate && exp.endDate && exp.startDate > exp.endDate) {
          errors.push({
            field: `experience[${index}].dates`,
            message: 'Start date cannot be after end date',
            code: 'INVALID_DATE_RANGE',
            path: `experience.${index}`,
          });
        }

        if (exp.current && exp.endDate) {
          errors.push({
            field: `experience[${index}].current`,
            message: 'Current position cannot have an end date',
            code: 'CURRENT_WITH_END_DATE',
            path: `experience.${index}`,
          });
        }
      });
    }

    // Validate education dates
    if (data.education) {
      data.education.forEach((edu, index) => {
        if (edu.startDate && edu.endDate && edu.startDate > edu.endDate) {
          errors.push({
            field: `education[${index}].dates`,
            message: 'Start date cannot be after end date',
            code: 'INVALID_DATE_RANGE',
            path: `education.${index}`,
          });
        }
      });
    }

    // Validate future dates
    const now = new Date().toISOString().split('T')[0];

    if (data.experience) {
      data.experience.forEach((exp, index) => {
        if (exp.startDate > now && !exp.current) {
          errors.push({
            field: `experience[${index}].startDate`,
            message: 'Start date cannot be in the future for past positions',
            code: 'FUTURE_START_DATE',
            path: `experience.${index}`,
          });
        }
      });
    }

    // Validate required sections
    if (!data.personalInfo?.fullName) {
      errors.push({
        field: 'personalInfo.fullName',
        message: 'Full name is required',
        code: 'REQUIRED_FIELD',
        path: 'personalInfo.fullName',
      });
    }

    return errors;
  }

  private generateWarnings(data: Partial<Resume>): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    // Check for minimal experience descriptions
    if (data.experience) {
      const minimalDescriptions = data.experience.filter(exp =>
        !exp.description || exp.description.length < 50
      );

      if (minimalDescriptions.length > 0) {
        warnings.push({
          field: 'experience.descriptions',
          message: `${minimalDescriptions.length} work experience entries have minimal descriptions`,
          code: 'MINIMAL_DESCRIPTIONS',
          severity: 'medium',
          path: 'experience',
        });
      }
    }

    // Check for missing skills
    if (!data.skills || data.skills.length < 5) {
      warnings.push({
        field: 'skills',
        message: 'Resume has few skills listed - consider adding more relevant skills',
        code: 'FEW_SKILLS',
        severity: 'medium',
        path: 'skills',
      });
    }

    // Check for old experience
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);

    if (data.experience) {
      const oldExperience = data.experience.filter(exp =>
        exp.startDate < tenYearsAgo.toISOString().split('T')[0]
      );

      if (oldExperience.length > 0) {
        warnings.push({
          field: 'experience.age',
          message: 'Resume includes experience older than 10 years - consider focusing on recent experience',
          code: 'OLD_EXPERIENCE',
          severity: 'low',
          path: 'experience',
        });
      }
    }

    // Check for missing contact information
    if (!data.personalInfo?.linkedin && !data.personalInfo?.github) {
      warnings.push({
        field: 'personalInfo.social',
        message: 'Consider adding LinkedIn or GitHub profile for better professional visibility',
        code: 'MISSING_SOCIAL',
        severity: 'low',
        path: 'personalInfo',
      });
    }

    return warnings;
  }

  private validateStrictMode(data: Partial<Resume>): ValidationError[] {
    const errors: ValidationError[] = [];

    // Strict mode requires certain fields
    if (!data.personalInfo?.linkedin) {
      errors.push({
        field: 'personalInfo.linkedin',
        message: 'LinkedIn profile is required in strict mode',
        code: 'STRICT_MODE_REQUIRED',
        path: 'personalInfo.linkedin',
      });
    }

    if (!data.summary || data.summary.length < 100) {
      errors.push({
        field: 'summary',
        message: 'Summary of at least 100 characters is required in strict mode',
        code: 'STRICT_MODE_REQUIRED',
        path: 'summary',
      });
    }

    if (!data.experience || data.experience.length < 2) {
      errors.push({
        field: 'experience',
        message: 'At least 2 work experiences are required in strict mode',
        code: 'STRICT_MODE_REQUIRED',
        path: 'experience',
      });
    }

    if (!data.education || data.education.length === 0) {
      errors.push({
        field: 'education',
        message: 'Education information is required in strict mode',
        code: 'STRICT_MODE_REQUIRED',
        path: 'education',
      });
    }

    if (!data.skills || data.skills.length < 10) {
      errors.push({
        field: 'skills',
        message: 'At least 10 skills are required in strict mode',
        code: 'STRICT_MODE_REQUIRED',
        path: 'skills',
      });
    }

    return errors;
  }

  // Utility method to validate specific sections
  validatePersonalInfo(personalInfo: Partial<PersonalInfo>): ValidationResult {
    const result = personalInfoSchema.safeParse(personalInfo);

    if (result.success) {
      return {
        isValid: true,
        errors: [],
        warnings: [],
        sanitizedData: { personalInfo: result.data },
      };
    }

    const errors: ValidationError[] = result.error.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
      path: issue.path.join('.'),
    }));

    return {
      isValid: false,
      errors,
      warnings: [],
    };
  }

  validateExperience(experience: Partial<Experience>): ValidationResult {
    const result = experienceSchema.safeParse(experience);

    if (result.success) {
      return {
        isValid: true,
        errors: [],
        warnings: [],
        sanitizedData: { experience: [result.data] },
      };
    }

    const errors: ValidationError[] = result.error.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
      path: issue.path.join('.'),
    }));

    return {
      isValid: false,
      errors,
      warnings: [],
    };
  }
}

// Export singleton instance
export const dataValidator = new DataValidator();