import { OpenRouterClient } from '@/lib/openrouter';
import { prisma } from '@/lib/prisma';
import {
  Resume,
  ResumeTemplateData,
  IntegrationMetadata,
  TemplateHistoryEntry,
  ATSAnalysisEntry,
  TemplateCustomization,
  ResumeTemplate
} from '@/types/resume';
import { templateService } from '@/services/templates/template-service';
import { templateValidator } from '@/services/templates/template-validator';
import { templateRegistry } from '@/services/templates/template-registry';
import { templateExportService } from '@/services/templates/template-export-service';
import { ExportFormat, ExportOptions } from '@/types/template';

export interface ResumeBuilderConfig {
  enableAI: boolean;
  enableATS: boolean;
  enableTemplateRecommendations: boolean;
  maxResumesPerUser: number;
  autoSaveEnabled: boolean;
}

export interface ResumeCreationRequest {
  userId: string;
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  targetJobTitle?: string;
  targetIndustry?: string;
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'executive';
  templateId?: string;
}

export interface ResumeUpdateRequest {
  resumeId: string;
  userId: string;
  updates: Partial<Resume>;
}

export interface TemplateApplicationRequest {
  resumeId: string;
  templateId: string;
  userId: string;
  customization?: TemplateCustomization;
}

export interface ATSAnalysisResult {
  score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  keywordDensity: Record<string, number>;
  missingKeywords: string[];
  sectionCompleteness: Record<string, number>;
}

export class ResumeBuilder {
  private ai: OpenRouterClient;
  private config: ResumeBuilderConfig;

  constructor(config: Partial<ResumeBuilderConfig> = {}) {
    this.config = {
      enableAI: true,
      enableATS: true,
      enableTemplateRecommendations: true,
      maxResumesPerUser: 50,
      autoSaveEnabled: true,
      ...config
    };

    if (this.config.enableAI) {
      this.ai = new OpenRouterClient({
        apiKey: process.env.OPENROUTER_API_KEY!,
        models: {
          primary: 'claude-2',
          fallback: 'gpt-3.5-turbo',
        },
        endpoints: {
          chat: 'https://api.openrouter.ai/api/v1/chat/completions',
        },
        rateLimit: {
          requests: 50,
          window: 60000, // 1 minute
        },
      });
    }
  }

  /**
   * Create a new resume
   */
  async createResume(request: ResumeCreationRequest): Promise<Resume> {
    try {
      // Check user's resume limit
      const resumeCount = await prisma.resume.count({
        where: { userUid: request.userId }
      });

      if (resumeCount >= this.config.maxResumesPerUser) {
        throw new Error(`Maximum resume limit reached (${this.config.maxResumesPerUser})`);
      }

      // Generate unique resume ID
      const resumeId = `resume_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Get template recommendations if none specified
      let templateId = request.templateId;
      if (!templateId && this.config.enableTemplateRecommendations) {
        const recommendations = await this.getTemplateRecommendations({
          userId: request.userId,
          jobTitle: request.targetJobTitle,
          industry: request.targetIndustry,
          experienceLevel: request.experienceLevel
        });
        templateId = recommendations[0]?.templateId;
      }

      // Create resume with initial data
      const createdResume = await prisma.resume.create({
        data: {
          resumeId,
          userUid: request.userId,
          professionalTitle: request.targetJobTitle || 'Professional Resume',
          personalInfo: {
            fullName: request.personalInfo.fullName,
            email: request.personalInfo.email,
            phone: request.personalInfo.phone,
            location: request.personalInfo.location || '',
            linkedin: request.personalInfo.linkedin || '',
            github: request.personalInfo.github || '',
            website: request.personalInfo.website || ''
          },
          phone: request.personalInfo.phone,
          location: request.personalInfo.location || '',
          linkedin: request.personalInfo.linkedin || '',
          github: request.personalInfo.github || '',
          website: request.personalInfo.website || '',
          templateId,
          integrationMetadata: {
            templateSelectionHistory: [],
            aiOptimizationHistory: [],
            atsAnalysisHistory: [],
            customSectionHistory: [],
            lastOptimizationAt: null,
            optimizationCount: 0,
            templateCompatibilityScore: 0,
            userPreferences: {
              autoApplyOptimizations: this.config.enableAI,
              prioritizeATSOptimization: this.config.enableATS,
              preferredTemplateCategories: [],
              excludedTemplates: []
            }
          } as any,
          metadata: {
            title: request.targetJobTitle || 'Professional Resume',
            description: '',
            experienceLevel: request.experienceLevel || 'mid',
            documentFormat: 'pdf'
          } as any,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Apply template if specified
      if (templateId) {
        await this.applyTemplate({
          resumeId: createdResume.resumeId,
          templateId,
          userId: request.userId
        });
      }

      return await this.getResume(createdResume.resumeId, request.userId);
    } catch (error) {
      console.error('Failed to create resume:', error);
      throw new Error(`Failed to create resume: ${error.message}`);
    }
  }

  /**
   * Get a resume by ID
   */
  async getResume(resumeId: string, userId: string): Promise<Resume> {
    try {
      const resume = await prisma.resume.findFirst({
        where: {
          resumeId,
          userUid: userId
        },
        include: {
          experience: {
            orderBy: { startDate: 'desc' }
          },
          education: {
            orderBy: { startDate: 'desc' }
          },
          skills: true,
          projects: {
            orderBy: { startDate: 'desc' }
          },
          certifications: {
            orderBy: { issueDate: 'desc' }
          },
          languages: true
        }
      });

      if (!resume) {
        throw new Error('Resume not found');
      }

      return this.convertPrismaResumeToResume(resume);
    } catch (error) {
      console.error('Failed to get resume:', error);
      throw new Error(`Failed to get resume: ${error.message}`);
    }
  }

  /**
   * Update a resume
   */
  async updateResume(request: ResumeUpdateRequest): Promise<Resume> {
    try {
      const { resumeId, userId, updates } = request;

      // Check if resume exists and belongs to user
      const existingResume = await this.getResume(resumeId, userId);

      // Prepare update data
      const updateData: any = {
        updatedAt: new Date()
      };

      // Handle different types of updates
      if (updates.personalInfo) {
        updateData.personalInfo = updates.personalInfo as any;
        updateData.professionalTitle = updates.personalInfo.fullName || existingResume.personalInfo.fullName;
      }

      if (updates.summary !== undefined) {
        updateData.summary = updates.summary;
      }

      if (updates.metadata) {
        updateData.metadata = updates.metadata as any;
      }

      if (updates.templateId !== undefined) {
        updateData.templateId = updates.templateId;
      }

      // Update resume
      await prisma.resume.update({
        where: { resumeId },
        data: updateData
      });

      // Handle related data updates
      if (updates.experience) {
        await this.updateExperience(resumeId, updates.experience);
      }

      if (updates.education) {
        await this.updateEducation(resumeId, updates.education);
      }

      if (updates.skills) {
        await this.updateSkills(resumeId, updates.skills);
      }

      if (updates.projects) {
        await this.updateProjects(resumeId, updates.projects);
      }

      if (updates.certifications) {
        await this.updateCertifications(resumeId, updates.certifications);
      }

      if (updates.languages) {
        await this.updateLanguages(resumeId, updates.languages);
      }

      return await this.getResume(resumeId, userId);
    } catch (error) {
      console.error('Failed to update resume:', error);
      throw new Error(`Failed to update resume: ${error.message}`);
    }
  }

  /**
   * Apply a template to a resume
   */
  async applyTemplate(request: TemplateApplicationRequest): Promise<Resume> {
    try {
      const updatedResume = await templateService.applyTemplateToResume(
        request.resumeId,
        request.templateId,
        request.userId,
        request.customization?.id
      );

      // Update integration metadata
      const resume = await this.getResume(request.resumeId, request.userId);
      const metadata = resume.integrationMetadata;

      if (metadata) {
        metadata.templateSelectionHistory.push({
          templateId: request.templateId,
          templateName: `Template ${request.templateId}`,
          appliedAt: new Date(),
          reason: 'User selected template',
          previousTemplateId: resume.templateId,
          atsScoreImpact: 0 // Would be calculated
        });

        metadata.lastOptimizationAt = new Date();
        metadata.optimizationCount++;

        await prisma.resume.update({
          where: { resumeId: request.resumeId },
          data: {
            integrationMetadata: metadata as any,
            updatedAt: new Date()
          }
        });
      }

      return updatedResume;
    } catch (error) {
      console.error('Failed to apply template:', error);
      throw new Error(`Failed to apply template: ${error.message}`);
    }
  }

  /**
   * Get template recommendations for a resume
   */
  async getTemplateRecommendations(params: {
    userId: string;
    jobTitle?: string;
    industry?: string;
    experienceLevel?: string;
    limit?: number;
  }): Promise<ResumeTemplate[]> {
    try {
      const resumeData: Partial<Resume> = {
        metadata: {
          title: params.jobTitle,
          experienceLevel: params.experienceLevel as any,
          targetIndustry: params.industry
        } as any
      };

      return await templateService.getRecommendedTemplates(
        resumeData,
        undefined,
        params.limit || 10
      );
    } catch (error) {
      console.error('Failed to get template recommendations:', error);
      return [];
    }
  }

  /**
   * Analyze resume for ATS optimization
   */
  async analyzeATS(resumeId: string, userId: string, jobDescription?: string): Promise<ATSAnalysisResult> {
    try {
      const resume = await this.getResume(resumeId, userId);

      if (!this.config.enableATS) {
        throw new Error('ATS analysis is disabled');
      }

      // In a real implementation, this would use an ATS analysis service
      // For now, we'll simulate the analysis
      const analysis: ATSAnalysisResult = {
        score: 85,
        strengths: [
          'Good use of action verbs',
          'Proper section ordering',
          'Clear formatting'
        ],
        weaknesses: [
          'Could include more quantifiable achievements',
          'Some sections lack detail'
        ],
        recommendations: [
          'Add specific metrics to achievements',
          'Include more industry-specific keywords',
          'Expand on technical skills'
        ],
        keywordDensity: {
          'leadership': 0.8,
          'project management': 1.2,
          'communication': 1.5,
          'technical skills': 2.1
        },
        missingKeywords: jobDescription ?
          this.analyzeMissingKeywords(resume, jobDescription) : [],
        sectionCompleteness: {
          'summary': resume.summary ? 90 : 0,
          'experience': (resume.experience?.length || 0) > 0 ? 85 : 0,
          'education': (resume.education?.length || 0) > 0 ? 90 : 0,
          'skills': (resume.skills?.length || 0) > 0 ? 80 : 0
        }
      };

      // Save analysis to integration metadata
      const metadata = resume.integrationMetadata;
      if (metadata) {
        metadata.atsAnalysisHistory.push({
          score: analysis.score,
          analyzedAt: new Date(),
          findings: {
            strengths: analysis.strengths,
            weaknesses: analysis.weaknesses,
            recommendations: analysis.recommendations
          },
          improvements: [],
          nextAnalysisDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week
        });

        await prisma.resume.update({
          where: { resumeId },
          data: {
            integrationMetadata: metadata as any,
            updatedAt: new Date()
          }
        });
      }

      return analysis;
    } catch (error) {
      console.error('Failed to analyze ATS:', error);
      throw new Error(`Failed to analyze ATS: ${error.message}`);
    }
  }

  /**
   * Export resume with applied template
   */
  async exportResume(
    resumeId: string,
    userId: string,
    options: ExportOptions
  ): Promise<any> {
    try {
      const exportRequest = {
        resumeId,
        userId,
        options
      };

      return await templateExportService.exportResume(exportRequest);
    } catch (error) {
      console.error('Failed to export resume:', error);
      throw new Error(`Failed to export resume: ${error.message}`);
    }
  }

  /**
   * Generate AI-powered content for resume sections
   */
  async generateContent(params: {
    jobDescription: string;
    userProfile: any;
    section: 'summary' | 'experience' | 'skills';
  }) {
    if (!this.config.enableAI) {
      throw new Error('AI content generation is disabled');
    }

    try {
      const prompt = this.buildPrompt(params);

      const response = await this.ai.chatCompletion({
        model: 'claude-2',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });

      return this.parseResponse(response);
    } catch (error) {
      console.error('Failed to generate content:', error);
      throw new Error(`Failed to generate content: ${error.message}`);
    }
  }

  /**
   * Delete a resume
   */
  async deleteResume(resumeId: string, userId: string): Promise<boolean> {
    try {
      const result = await prisma.resume.deleteMany({
        where: {
          resumeId,
          userUid: userId
        }
      });

      return result.count > 0;
    } catch (error) {
      console.error('Failed to delete resume:', error);
      throw new Error(`Failed to delete resume: ${error.message}`);
    }
  }

  /**
   * Get user's resumes
   */
  async getUserResumes(userId: string, limit: number = 20): Promise<Resume[]> {
    try {
      const resumes = await prisma.resume.findMany({
        where: { userUid: userId },
        include: {
          experience: {
            orderBy: { startDate: 'desc' }
          },
          education: {
            orderBy: { startDate: 'desc' }
          },
          skills: true,
          projects: {
            orderBy: { startDate: 'desc' }
          },
          certifications: {
            orderBy: { issueDate: 'desc' }
          },
          languages: true
        },
        orderBy: { updatedAt: 'desc' },
        take: limit
      });

      return resumes.map(this.convertPrismaResumeToResume);
    } catch (error) {
      console.error('Failed to get user resumes:', error);
      return [];
    }
  }

  // Private helper methods

  private async updateExperience(resumeId: string, experiences: any[]): Promise<void> {
    // Delete existing experience entries
    await prisma.resumeExperience.deleteMany({
      where: { resumeId }
    });

    // Create new experience entries
    for (const exp of experiences) {
      await prisma.resumeExperience.create({
        data: {
          experienceId: exp.id,
          resumeId,
          position: exp.title,
          company: exp.company,
          location: exp.location,
          startDate: exp.startDate,
          endDate: exp.endDate,
          isCurrent: exp.current,
          description: exp.description
        }
      });
    }
  }

  private async updateEducation(resumeId: string, education: any[]): Promise<void> {
    // Delete existing education entries
    await prisma.resumeEducation.deleteMany({
      where: { resumeId }
    });

    // Create new education entries
    for (const edu of education) {
      await prisma.resumeEducation.create({
        data: {
          educationId: edu.id,
          resumeId,
          institution: edu.institution,
          degree: edu.degree,
          field: edu.field,
          startDate: edu.startDate,
          endDate: edu.endDate,
          isCurrent: edu.current,
          gpa: edu.gpa
        }
      });
    }
  }

  private async updateSkills(resumeId: string, skills: any[]): Promise<void> {
    // Delete existing skill entries
    await prisma.resume.deleteMany({
      where: { resumeId }
    });

    // Create new skill entries
    const skillNames = skills.map(skill => skill.name);
    if (skillNames.length > 0) {
      await prisma.resume.update({
        where: { resumeId },
        data: {
          skills: skillNames
        }
      });
    }
  }

  private async updateProjects(resumeId: string, projects: any[]): Promise<void> {
    // Delete existing project entries
    await prisma.resumeProject.deleteMany({
      where: { resumeId }
    });

    // Create new project entries
    for (const proj of projects) {
      await prisma.resumeProject.create({
        data: {
          projectId: proj.id,
          resumeId,
          title: proj.name,
          description: proj.description,
          technologies: proj.technologies,
          projectUrl: proj.link,
          githubUrl: proj.github,
          startDate: proj.startDate,
          endDate: proj.endDate
        }
      });
    }
  }

  private async updateCertifications(resumeId: string, certifications: any[]): Promise<void> {
    // Delete existing certification entries
    await prisma.resumeCertification.deleteMany({
      where: { resumeId }
    });

    // Create new certification entries
    for (const cert of certifications) {
      await prisma.resumeCertification.create({
        data: {
          certificationId: cert.id,
          resumeId,
          name: cert.name,
          issuer: cert.issuer,
          issueDate: cert.issueDate,
          expiryDate: cert.expiryDate,
          credentialId: cert.credentialId,
          credentialUrl: cert.credentialUrl
        }
      });
    }
  }

  private async updateLanguages(resumeId: string, languages: any[]): Promise<void> {
    // Delete existing language entries
    await prisma.resumeLanguage.deleteMany({
      where: { resumeId }
    });

    // Create new language entries
    for (const lang of languages) {
      await prisma.resumeLanguage.create({
        data: {
          languageId: lang.id,
          resumeId,
          language: lang.name,
          proficiency: lang.proficiency
        }
      });
    }
  }

  private convertPrismaResumeToResume(prismaResume: any): Resume {
    return {
      id: prismaResume.resumeId,
      userId: prismaResume.userUid,
      personalInfo: prismaResume.personalInfo || {
        fullName: prismaResume.professionalTitle || '',
        email: '',
        phone: prismaResume.phone || '',
        location: prismaResume.location || '',
        linkedin: prismaResume.linkedin || '',
        github: prismaResume.github || '',
        website: prismaResume.website || ''
      },
      summary: prismaResume.summary || '',
      experience: prismaResume.experience?.map(this.convertPrismaExperience) || [],
      education: prismaResume.education?.map(this.convertPrismaEducation) || [],
      skills: this.convertPrismaSkills(prismaResume.skills),
      projects: prismaResume.projects?.map(this.convertPrismaProject) || [],
      certifications: prismaResume.certifications?.map(this.convertPrismaCertification) || [],
      languages: prismaResume.languages?.map(this.convertPrismaLanguage) || [],
      metadata: {
        title: prismaResume.professionalTitle || 'Resume',
        description: '',
        experienceLevel: 'mid',
        documentFormat: 'pdf',
        atsScore: undefined,
        lastAnalyzedAt: undefined,
        templateUsed: prismaResume.templateId || undefined
      },
      templateId: prismaResume.templateId || undefined,
      templateCustomizationId: prismaResume.templateCustomizationId || undefined,
      templateData: prismaResume.templateData as any,
      integrationMetadata: prismaResume.integrationMetadata as any,
      createdAt: prismaResume.createdAt,
      updatedAt: prismaResume.updatedAt
    };
  }

  private convertPrismaExperience = (exp: any) => ({
    id: exp.experienceId,
    title: exp.position,
    company: exp.company,
    location: exp.location || '',
    startDate: exp.startDate,
    endDate: exp.endDate,
    current: exp.isCurrent,
    description: exp.description || '',
    achievements: [],
    skills: []
  });

  private convertPrismaEducation = (edu: any) => ({
    id: edu.educationId,
    institution: edu.institution,
    degree: edu.degree,
    field: edu.field || '',
    location: '',
    startDate: edu.startDate,
    endDate: edu.endDate,
    current: edu.isCurrent,
    gpa: edu.gpa || undefined,
    honors: [],
    coursework: []
  });

  private convertPrismaSkills = (skills: any) => {
    if (!skills || !Array.isArray(skills)) return [];
    return skills.map((skill: any, index: number) => ({
      id: `skill_${index}`,
      name: skill,
      category: 'technical' as const,
      level: 'intermediate' as const,
      yearsOfExperience: undefined
    }));
  };

  private convertPrismaProject = (proj: any) => ({
    id: proj.projectId,
    name: proj.title,
    description: proj.description || '',
    technologies: proj.technologies || [],
    link: proj.projectUrl || '',
    github: proj.githubUrl || '',
    startDate: proj.startDate,
    endDate: proj.endDate,
    status: 'completed' as const
  });

  private convertPrismaCertification = (cert: any) => ({
    id: cert.certificationId,
    name: cert.name,
    issuer: cert.issuer,
    issueDate: cert.issueDate,
    expiryDate: cert.expiryDate,
    credentialId: cert.credentialId,
    credentialUrl: cert.credentialUrl
  });

  private convertPrismaLanguage = (lang: any) => ({
    id: lang.languageId,
    name: lang.language,
    proficiency: lang.proficiency as any
  });

  private buildPrompt(params: any) {
    // Prompt engineering logic
    return `Generate professional ${params.section} content for a resume...`;
  }

  private parseResponse(response: any) {
    // Parse AI response
    return response.choices[0].message.content;
  }

  private convertResumeToText(resume: Resume): string {
    // Convert resume to text format for AI processing
    let text = '';

    if (resume.personalInfo) {
      text += `Name: ${resume.personalInfo.fullName}\n`;
      text += `Email: ${resume.personalInfo.email}\n`;
      text += `Phone: ${resume.personalInfo.phone}\n`;
      if (resume.personalInfo.location) text += `Location: ${resume.personalInfo.location}\n`;
    }

    if (resume.summary) {
      text += `\nSummary:\n${resume.summary}\n`;
    }

    if (resume.experience && resume.experience.length > 0) {
      text += `\nExperience:\n`;
      resume.experience.forEach(exp => {
        text += `- ${exp.title} at ${exp.company}\n`;
        if (exp.description) text += `  ${exp.description}\n`;
      });
    }

    if (resume.education && resume.education.length > 0) {
      text += `\nEducation:\n`;
      resume.education.forEach(edu => {
        text += `- ${edu.degree} in ${edu.field} from ${edu.institution}\n`;
      });
    }

    if (resume.skills && resume.skills.length > 0) {
      text += `\nSkills:\n`;
      resume.skills.forEach(skill => {
        text += `- ${skill.name}\n`;
      });
    }

    return text;
  }

  private async parseAndApplyEnhancements(resume: Resume, enhancedContent: string): Promise<Resume> {
    // In a real implementation, this would parse the AI response
    // and apply the enhancements to the resume
    // For now, return the original resume
    return resume;
  }

  private analyzeMissingKeywords(resume: Resume, jobDescription: string): string[] {
    // Simple keyword analysis - in a real implementation,
    // this would use sophisticated NLP techniques
    const jobWords = jobDescription.toLowerCase().split(/\s+/);
    const resumeText = this.convertResumeToText(resume).toLowerCase();

    return jobWords.filter(word =>
      word.length > 3 &&
      !resumeText.includes(word) &&
      !['the', 'and', 'for', 'with', 'that', 'this', 'from', 'have', 'are', 'was', 'were', 'been'].includes(word)
    ).slice(0, 10);
  }

  private async uploadToStorage(resumeContent: string): Promise<string> {
    // This is a placeholder implementation
    // You should implement this using your preferred storage solution
    // (e.g., AWS S3, Google Cloud Storage, etc.)

    // For now, we'll return a mock URL
    return `https://storage.example.com/resumes/${Date.now()}.pdf`;
  }
}

// Export singleton instance
export const resumeBuilder = new ResumeBuilder();