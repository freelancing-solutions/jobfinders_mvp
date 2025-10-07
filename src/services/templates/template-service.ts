/**
 * Core Template Service
 *
 * Provides the main interface for template operations within the resume builder.
 * Bridges the existing template engine with the resume builder and handles
 * database operations for template-related data.
 */

import { prisma } from '@/lib/prisma';
import {
  ResumeTemplate,
  TemplateCustomization,
  Resume,
  ResumeTemplateData,
  IntegrationMetadata,
  TemplateHistoryEntry,
  UserTemplatePreferences
} from '@/types/resume';
import {
  TemplateEngine,
  TemplateRegistry,
  TemplateRenderer,
  TemplateCustomizer as EngineCustomizer,
  RenderedTemplate,
  ExportResult,
  TemplateFilters
} from '@/services/template-engine';

export interface TemplateServiceConfig {
  enableAnalytics: boolean;
  enableHistoryTracking: boolean;
  maxCustomizationsPerUser: number;
  cacheEnabled: boolean;
}

export class TemplateService {
  private templateEngine: TemplateEngine;
  private registry: TemplateRegistry;
  private renderer: TemplateRenderer;
  private customizer: EngineCustomizer;
  private config: TemplateServiceConfig;

  constructor(config: Partial<TemplateServiceConfig> = {}) {
    this.config = {
      enableAnalytics: true,
      enableHistoryTracking: true,
      maxCustomizationsPerUser: 50,
      cacheEnabled: true,
      ...config
    };

    // Initialize template engine
    this.templateEngine = new TemplateEngine();
    this.registry = this.templateEngine.getRegistry();
    this.renderer = this.templateEngine.getRenderer();
    this.customizer = this.templateEngine.getCustomizer();
  }

  /**
   * Initialize the template service
   */
  async initialize(): Promise<void> {
    try {
      await this.templateEngine.initialize();
      await this.seedDefaultTemplates();
      console.log('Template Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Template Service:', error);
      throw error;
    }
  }

  /**
   * Get all available templates with optional filtering
   */
  async getTemplates(filters?: TemplateFilters): Promise<ResumeTemplate[]> {
    try {
      const templates = this.registry.list(filters);

      // Convert to our ResumeTemplate format
      return templates.map(this.convertEngineTemplateToResumeTemplate);
    } catch (error) {
      console.error('Failed to get templates:', error);
      throw new Error('Failed to retrieve templates');
    }
  }

  /**
   * Get a specific template by ID
   */
  async getTemplate(templateId: string): Promise<ResumeTemplate | null> {
    try {
      const template = this.registry.get(templateId);
      if (!template) return null;

      // Convert to our ResumeTemplate format
      return this.convertEngineTemplateToResumeTemplate(template);
    } catch (error) {
      console.error(`Failed to get template ${templateId}:`, error);
      throw new Error(`Failed to retrieve template: ${templateId}`);
    }
  }

  /**
   * Search templates by query
   */
  async searchTemplates(query: string): Promise<ResumeTemplate[]> {
    try {
      const templates = this.registry.search(query);
      return templates.map(this.convertEngineTemplateToResumeTemplate);
    } catch (error) {
      console.error('Failed to search templates:', error);
      throw new Error('Failed to search templates');
    }
  }

  /**
   * Get templates recommended for a specific resume
   */
  async getRecommendedTemplates(
    resume: Partial<Resume>,
    jobDescription?: string,
    limit: number = 10
  ): Promise<ResumeTemplate[]> {
    try {
      // For now, return templates based on resume metadata
      // This can be enhanced with ML-based recommendations
      const allTemplates = await this.getTemplates();

      // Simple recommendation logic based on experience level and industry
      const { experienceLevel, targetIndustry } = resume.metadata || {};

      let filteredTemplates = allTemplates;

      if (experienceLevel) {
        // Filter templates suitable for experience level
        filteredTemplates = filteredTemplates.filter(template => {
          if (experienceLevel === 'entry') {
            return template.category === 'professional' || template.category === 'modern';
          } else if (experienceLevel === 'executive') {
            return template.category === 'professional' || template.subcategory?.includes('executive');
          }
          return true;
        });
      }

      if (targetIndustry) {
        // Filter templates suitable for industry
        filteredTemplates = filteredTemplates.filter(template =>
          template.subcategory?.toLowerCase().includes(targetIndustry.toLowerCase()) ||
          template.name.toLowerCase().includes(targetIndustry.toLowerCase())
        );
      }

      // Sort by rating and download count
      filteredTemplates.sort((a, b) => {
        const aScore = (a.rating || 0) * 0.7 + (Math.log(a.downloadCount + 1) * 0.3);
        const bScore = (b.rating || 0) * 0.7 + (Math.log(b.downloadCount + 1) * 0.3);
        return bScore - aScore;
      });

      return filteredTemplates.slice(0, limit);
    } catch (error) {
      console.error('Failed to get recommended templates:', error);
      throw new Error('Failed to get template recommendations');
    }
  }

  /**
   * Apply a template to a resume
   */
  async applyTemplateToResume(
    resumeId: string,
    templateId: string,
    userId: string,
    customizationId?: string
  ): Promise<Resume> {
    try {
      // Get the resume and template
      const resume = await this.getResume(resumeId, userId);
      const template = await this.getTemplate(templateId);

      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      // Get or create customization
      let customization: TemplateCustomization;
      if (customizationId) {
        customization = await this.getCustomization(customizationId, userId);
      } else {
        customization = await this.createDefaultCustomization(templateId, userId, resumeId);
      }

      // Render the template with resume data
      const renderedTemplate = await this.renderer.render(templateId, resume, {
        customizations: this.convertCustomizationToEngineFormat(customization)
      });

      // Create template data
      const templateData: ResumeTemplateData = {
        selectedTemplate: template,
        customization,
        renderedPreview: renderedTemplate.rendered.html,
        atsScore: template.features.atsOptimized ? 85 : 70, // Default ATS score
        version: template.metadata.version,
        appliedAt: new Date()
      };

      // Update resume with template information
      const updatedResume = await prisma.resume.update({
        where: { resumeId },
        data: {
          templateId,
          templateCustomizationId: customization.id,
          templateData: templateData as any,
          updatedAt: new Date()
        },
        include: {
          user: true,
          experience: true,
          education: true,
          skills: true,
          projects: true,
          certifications: true,
          languages: true
        }
      });

      // Track template usage
      if (this.config.enableAnalytics) {
        await this.trackTemplateUsage(userId, templateId, customization.id, resumeId);
      }

      // Record history
      if (this.config.enableHistoryTracking) {
        await this.recordTemplateHistory(userId, resumeId, templateId, customization.id, 'selected');
      }

      return this.convertPrismaResumeToResume(updatedResume);
    } catch (error) {
      console.error('Failed to apply template to resume:', error);
      throw new Error('Failed to apply template to resume');
    }
  }

  /**
   * Create or update a template customization
   */
  async saveCustomization(
    customization: Partial<TemplateCustomization>,
    userId: string
  ): Promise<TemplateCustomization> {
    try {
      // Check user's customization limit
      const customizationCount = await prisma.resumeTemplateCustomization.count({
        where: { userUid: userId }
      });

      if (customizationCount >= this.config.maxCustomizationsPerUser) {
        throw new Error('Maximum customization limit reached');
      }

      // Validate customization data
      this.validateCustomization(customization);

      const savedCustomization = await prisma.resumeTemplateCustomization.upsert({
        where: {
          userUid_templateId_name: {
            userUid: userId,
            templateId: customization.templateId!,
            name: customization.name || 'Default'
          }
        },
        update: {
          colorScheme: customization.colorScheme as any,
          typography: customization.typography as any,
          layout: customization.layout as any,
          sectionSettings: customization.sectionVisibility as any,
          customSections: customization.customSections as any,
          branding: customization.branding as any,
          changeCount: { increment: 1 },
          lastApplied: new Date()
        },
        create: {
          userUid: userId,
          templateId: customization.templateId!,
          name: customization.name || 'Default',
          colorScheme: customization.colorScheme as any,
          typography: customization.typography as any,
          layout: customization.layout as any,
          sectionSettings: customization.sectionVisibility as any,
          customSections: customization.customSections as any,
          branding: customization.branding as any
        }
      });

      return this.convertPrismaCustomizationToCustomization(savedCustomization);
    } catch (error) {
      console.error('Failed to save customization:', error);
      throw new Error('Failed to save template customization');
    }
  }

  /**
   * Get a template customization
   */
  async getCustomization(customizationId: string, userId: string): Promise<TemplateCustomization> {
    try {
      const customization = await prisma.resumeTemplateCustomization.findFirst({
        where: {
          id: customizationId,
          userUid: userId
        }
      });

      if (!customization) {
        throw new Error(`Customization not found: ${customizationId}`);
      }

      return this.convertPrismaCustomizationToCustomization(customization);
    } catch (error) {
      console.error(`Failed to get customization ${customizationId}:`, error);
      throw new Error(`Failed to retrieve customization: ${customizationId}`);
    }
  }

  /**
   * Get user's customizations for a template
   */
  async getUserCustomizations(userId: string, templateId?: string): Promise<TemplateCustomization[]> {
    try {
      const whereClause: any = { userUid: userId };
      if (templateId) {
        whereClause.templateId = templateId;
      }

      const customizations = await prisma.resumeTemplateCustomization.findMany({
        where: whereClause,
        orderBy: { updatedAt: 'desc' }
      });

      return customizations.map(this.convertPrismaCustomizationToCustomization);
    } catch (error) {
      console.error('Failed to get user customizations:', error);
      throw new Error('Failed to retrieve user customizations');
    }
  }

  /**
   * Delete a template customization
   */
  async deleteCustomization(customizationId: string, userId: string): Promise<boolean> {
    try {
      const result = await prisma.resumeTemplateCustomization.deleteMany({
        where: {
          id: customizationId,
          userUid: userId
        }
      });

      return result.count > 0;
    } catch (error) {
      console.error(`Failed to delete customization ${customizationId}:`, error);
      throw new Error('Failed to delete customization');
    }
  }

  /**
   * Generate a preview of a resume with a template
   */
  async generatePreview(
    templateId: string,
    resumeData: Partial<Resume>,
    customization?: TemplateCustomization
  ): Promise<string> {
    try {
      const template = await this.getTemplate(templateId);
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      const preview = await this.renderer.preview(templateId, resumeData, {
        customizations: customization ? this.convertCustomizationToEngineFormat(customization) : undefined
      });

      return preview;
    } catch (error) {
      console.error('Failed to generate preview:', error);
      throw new Error('Failed to generate preview');
    }
  }

  /**
   * Export a resume with applied template
   */
  async exportResume(
    resumeId: string,
    format: 'pdf' | 'docx' | 'html',
    userId: string
  ): Promise<ExportResult> {
    try {
      const resume = await this.getResume(resumeId, userId);

      if (!resume.templateId) {
        throw new Error('No template applied to resume');
      }

      const template = await this.getTemplate(resume.templateId);
      if (!template) {
        throw new Error(`Template not found: ${resume.templateId}`);
      }

      const customization = resume.templateCustomizationId
        ? await this.getCustomization(resume.templateCustomizationId, userId)
        : undefined;

      // Render the template
      const renderedTemplate = await this.renderer.render(resume.templateId, resume, {
        customizations: customization ? this.convertCustomizationToEngineFormat(customization) : undefined
      });

      // Export the rendered template
      const exportResult = await this.templateEngine.exportTemplate(
        renderedTemplate,
        format as any,
        {
          includeMetadata: true,
          watermarks: false
        }
      );

      // Track export
      if (this.config.enableAnalytics) {
        await this.trackTemplateExport(userId, resume.templateId, resume.templateCustomizationId, resumeId);
      }

      return exportResult;
    } catch (error) {
      console.error('Failed to export resume:', error);
      throw new Error('Failed to export resume');
    }
  }

  /**
   * Get user's template preferences
   */
  async getUserPreferences(userId: string): Promise<UserTemplatePreferences> {
    try {
      // Get recent template usage to infer preferences
      const recentUsage = await prisma.resumeTemplateUsage.findMany({
        where: { userUid: userId },
        include: { template: true },
        orderBy: { lastUsed: 'desc' },
        take: 20
      });

      const preferences: UserTemplatePreferences = {
        favoriteCategories: this.getMostUsedCategories(recentUsage),
        preferredLayouts: this.getMostUsedLayouts(recentUsage),
        colorSchemePreference: 'professional', // Default, can be inferred from usage
        fontPreference: 'inter', // Default, can be inferred from usage
        autoSaveEnabled: true,
        realTimePreviewEnabled: true,
        atsOptimizationEnabled: true
      };

      return preferences;
    } catch (error) {
      console.error('Failed to get user preferences:', error);
      // Return default preferences
      return {
        favoriteCategories: [],
        preferredLayouts: [],
        colorSchemePreference: 'professional',
        fontPreference: 'inter',
        autoSaveEnabled: true,
        realTimePreviewEnabled: true,
        atsOptimizationEnabled: true
      };
    }
  }

  // Private helper methods

  private async seedDefaultTemplates(): Promise<void> {
    try {
      const existingTemplates = await prisma.resumeTemplate.count();
      if (existingTemplates > 0) {
        return; // Templates already exist
      }

      // Import default templates from the template engine
      const defaultTemplates = this.getDefaultTemplates();

      for (const template of defaultTemplates) {
        await prisma.resumeTemplate.create({
          data: {
            templateId: template.id,
            name: template.name,
            description: template.description,
            category: template.category,
            subcategory: template.subcategory,
            previewUrl: template.preview.thumbnail,
            largePreviewUrl: template.preview.large,
            animatedPreviewUrl: template.preview.animated,
            layout: template.layout as any,
            styling: template.styling as any,
            sections: template.sections as any,
            features: template.features as any,
            atsOptimization: template.atsOptimization as any,
            customization: template.customization as any,
            metadata: template.metadata as any,
            isActive: true,
            isPremium: false,
            version: template.metadata.version,
            author: template.metadata.author
          }
        });
      }

      console.log('Default templates seeded successfully');
    } catch (error) {
      console.error('Failed to seed default templates:', error);
      throw error;
    }
  }

  private getDefaultTemplates() {
    // These would typically come from your template engine registry
    // For now, return some basic template definitions
    return [
      {
        id: 'professional-executive',
        name: 'Executive Professional',
        description: 'Clean and professional template perfect for executive roles',
        category: 'professional',
        subcategory: 'executive',
        preview: {
          thumbnail: '/templates/professional-executive/thumb.png',
          large: '/templates/professional-executive/large.png'
        },
        layout: {},
        styling: {},
        sections: [],
        features: { atsOptimized: true, mobileOptimized: true, printOptimized: true },
        atsOptimization: {},
        customization: {},
        metadata: { version: '1.0.0', author: 'JobFinders', created: new Date(), updated: new Date(), tags: [], downloads: 0, rating: 4.5, reviews: 0 }
      },
      {
        id: 'modern-software-engineer',
        name: 'Modern Software Engineer',
        description: 'Modern template optimized for software engineering roles',
        category: 'modern',
        subcategory: 'software-engineer',
        preview: {
          thumbnail: '/templates/modern-software-engineer/thumb.png',
          large: '/templates/modern-software-engineer/large.png'
        },
        layout: {},
        styling: {},
        sections: [],
        features: { atsOptimized: true, mobileOptimized: true, printOptimized: true },
        atsOptimization: {},
        customization: {},
        metadata: { version: '1.0.0', author: 'JobFinders', created: new Date(), updated: new Date(), tags: [], downloads: 0, rating: 4.7, reviews: 0 }
      }
    ];
  }

  private convertEngineTemplateToResumeTemplate = (engineTemplate: any): ResumeTemplate => {
    return {
      templateId: engineTemplate.id,
      name: engineTemplate.name,
      description: engineTemplate.description,
      category: engineTemplate.category,
      subcategory: engineTemplate.subcategory,
      previewUrl: engineTemplate.preview?.thumbnail || '',
      largePreviewUrl: engineTemplate.preview?.large,
      animatedPreviewUrl: engineTemplate.preview?.animated,
      layout: engineTemplate.layout,
      styling: engineTemplate.styling,
      sections: engineTemplate.sections,
      features: engineTemplate.features,
      atsOptimization: engineTemplate.atsOptimization,
      customization: engineTemplate.customization,
      metadata: {
        ...engineTemplate.metadata,
        downloadCount: engineTemplate.metadata?.downloads || 0,
        rating: engineTemplate.metadata?.rating || 0,
        reviewCount: engineTemplate.metadata?.reviews || 0
      },
      isActive: engineTemplate.isActive !== false,
      isPremium: engineTemplate.metadata?.license?.type !== 'free',
      version: engineTemplate.metadata?.version || '1.0.0',
      author: engineTemplate.metadata?.author,
      license: engineTemplate.metadata?.license?.type || 'free'
    };
  };

  private async createDefaultCustomization(
    templateId: string,
    userId: string,
    resumeId: string
  ): Promise<TemplateCustomization> {
    const defaultCustomization: Partial<TemplateCustomization> = {
      templateId,
      userId,
      resumeId,
      name: 'Default',
      colorScheme: {
        name: 'Professional Blue',
        primary: '#2563eb',
        secondary: '#64748b',
        accent: '#3b82f6',
        background: '#ffffff',
        text: '#1e293b',
        muted: '#94a3b8',
        border: '#e2e8f0',
        highlight: '#eff6ff',
        link: '#2563eb'
      },
      typography: {
        heading: {
          fontFamily: 'Inter',
          fontWeight: 600,
          fontSize: { h1: 28, h2: 22, h3: 18, h4: 16, h5: 14, h6: 12 },
          lineHeight: 1.2,
          letterSpacing: 0
        },
        body: {
          fontFamily: 'Inter',
          fontWeight: 400,
          fontSize: { large: 18, normal: 14, small: 12, caption: 10 },
          lineHeight: 1.5,
          letterSpacing: 0
        },
        accent: {
          fontFamily: 'Inter',
          fontWeight: 500,
          fontSize: 14,
          lineHeight: 1.4,
          letterSpacing: 0
        }
      },
      layout: {
        margins: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
        sectionSpacing: { before: 16, after: 16 },
        itemSpacing: 8,
        lineHeight: 1.5,
        columns: { count: 1, widths: [100], gutters: 20 },
        customSections: {}
      },
      sectionVisibility: {},
      customSections: {},
      branding: {},
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '1.0.0',
        changeCount: 0,
        isDefault: true
      }
    };

    return await this.saveCustomization(defaultCustomization, userId);
  }

  private validateCustomization(customization: Partial<TemplateCustomization>): void {
    if (!customization.templateId) {
      throw new Error('Template ID is required');
    }

    // Add more validation as needed
  }

  private async getResume(resumeId: string, userId: string): Promise<Resume> {
    const resume = await prisma.resume.findFirst({
      where: {
        resumeId,
        userUid: userId
      },
      include: {
        experience: true,
        education: true,
        skills: true,
        projects: true,
        certifications: true,
        languages: true
      }
    });

    if (!resume) {
      throw new Error(`Resume not found: ${resumeId}`);
    }

    return this.convertPrismaResumeToResume(resume);
  }

  private convertPrismaResumeToResume(prismaResume: any): Resume {
    return {
      id: prismaResume.resumeId,
      userId: prismaResume.userUid,
      personalInfo: {
        fullName: prismaResume.professionalTitle || '', // This should come from personal info table
        email: '',
        phone: prismaResume.phone || '',
        location: prismaResume.location || '',
        website: prismaResume.website || '',
        linkedin: prismaResume.linkedin || '',
        github: prismaResume.github || '',
        portfolio: ''
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

  private convertPrismaCustomizationToCustomization = (prismaCustomization: any): TemplateCustomization => {
    return {
      id: prismaCustomization.id,
      name: prismaCustomization.name,
      templateId: prismaCustomization.templateId,
      userId: prismaCustomization.userUid,
      resumeId: prismaCustomization.resumeId,
      colorScheme: prismaCustomization.colorScheme,
      typography: prismaCustomization.typography,
      layout: prismaCustomization.layout,
      sectionVisibility: prismaCustomization.sectionSettings,
      customSections: prismaCustomization.customSections || {},
      branding: prismaCustomization.branding || {},
      metadata: {
        createdAt: prismaCustomization.createdAt,
        updatedAt: prismaCustomization.updatedAt,
        version: prismaCustomization.version,
        changeCount: prismaCustomization.changeCount,
        isDefault: prismaCustomization.isDefault,
        lastApplied: prismaCustomization.lastApplied
      }
    };
  };

  private convertCustomizationToEngineFormat(customization: TemplateCustomization): any {
    return {
      colors: {
        primary: customization.colorScheme.primary,
        secondary: customization.colorScheme.secondary,
        accent: customization.colorScheme.accent,
        text: customization.colorScheme.text,
        background: customization.colorScheme.background
      },
      fonts: {
        heading: customization.typography.heading,
        body: customization.typography.body,
        accents: customization.typography.accent
      },
      layout: customization.layout,
      sections: customization.sectionVisibility
    };
  }

  private async trackTemplateUsage(
    userId: string,
    templateId: string,
    customizationId: string,
    resumeId: string
  ): Promise<void> {
    try {
      await prisma.resumeTemplateUsage.upsert({
        where: { userUid_templateId: { userUid: userId, templateId } },
        update: {
          useCount: { increment: 1 },
          lastUsed: new Date(),
          customizationId,
          resumeId
        },
        create: {
          userUid: userId,
          templateId,
          customizationId,
          resumeId,
          useCount: 1,
          lastUsed: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to track template usage:', error);
    }
  }

  private async recordTemplateHistory(
    userId: string,
    resumeId: string,
    templateId: string,
    customizationId: string,
    action: string
  ): Promise<void> {
    try {
      await prisma.resumeTemplateHistory.create({
        data: {
          userUid: userId,
          resumeId,
          templateId,
          customizationId,
          action,
          templateName: `Template ${templateId}`, // This should come from the template
          createdAt: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to record template history:', error);
    }
  }

  private async trackTemplateExport(
    userId: string,
    templateId: string,
    customizationId: string | undefined,
    resumeId: string
  ): Promise<void> {
    try {
      await prisma.resumeTemplateUsage.update({
        where: { userUid_templateId: { userUid: userId, templateId } },
        data: {
          exportCount: { increment: 1 }
        }
      });
    } catch (error) {
      console.error('Failed to track template export:', error);
    }
  }

  private getMostUsedCategories(usage: any[]): string[] {
    const categoryCounts: Record<string, number> = {};
    usage.forEach(u => {
      // This would require template info, simplified for now
      categoryCounts['professional'] = (categoryCounts['professional'] || 0) + 1;
    });
    return Object.keys(categoryCounts).sort((a, b) => categoryCounts[b] - categoryCounts[a]).slice(0, 3);
  }

  private getMostUsedLayouts(usage: any[]): string[] {
    // Simplified implementation
    return ['single-column', 'two-column'];
  }
}

// Export singleton instance
export const templateService = new TemplateService();