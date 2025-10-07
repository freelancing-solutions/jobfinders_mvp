/**
 * Template Export Service
 *
 * Handles exporting resumes with applied templates to various formats.
 * Supports PDF, DOCX, HTML, and TXT exports with customizable options.
 */

import { ResumeTemplate, Resume, TemplateCustomization, ExportResult } from '@/types/resume';
import { ExportFormat } from '@/types/template';
import { templateService } from './template-service';
import { prisma } from '@/lib/prisma';

export interface ExportOptions {
  format: ExportFormat;
  quality?: 'screen' | 'print' | 'press';
  includeMetadata?: boolean;
  includeComments?: boolean;
  watermarks?: boolean;
  passwordProtection?: boolean;
  compression?: boolean;
  customFileName?: string;
  pageSize?: 'A4' | 'Letter' | 'Legal';
  orientation?: 'portrait' | 'landscape';
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface ExportRequest {
  resumeId: string;
  templateId?: string;
  customizationId?: string;
  userId: string;
  options: ExportOptions;
}

export interface ExportJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: ExportResult;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export class TemplateExportService {
  private readonly EXPORT_TIMEOUT = 60000; // 60 seconds
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly SUPPORTED_FORMATS = [ExportFormat.PDF, ExportFormat.DOCX, ExportFormat.HTML, ExportFormat.TXT];

  private readonly exportJobs = new Map<string, ExportJob>();

  /**
   * Export a resume with applied template
   */
  async exportResume(request: ExportRequest): Promise<ExportResult> {
    try {
      // Validate export request
      this.validateExportRequest(request);

      // Get resume data
      const resume = await this.getResume(request.resumeId, request.userId);
      if (!resume) {
        throw new Error('Resume not found');
      }

      // Determine template to use
      const templateId = request.templateId || resume.templateId;
      if (!templateId) {
        throw new Error('No template specified for export');
      }

      // Get template
      const template = await templateService.getTemplate(templateId);
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      // Get customization if specified
      let customization;
      if (request.customizationId) {
        customization = await templateService.getCustomization(request.customizationId, request.userId);
      } else if (resume.templateCustomizationId) {
        customization = await templateService.getCustomization(resume.templateCustomizationId, request.userId);
      }

      // Generate export based on format
      const result = await this.generateExport(resume, template, customization, request.options);

      // Track export in database
      await this.trackExport(request.userId, request.resumeId, templateId, request.options.format, result);

      return result;
    } catch (error) {
      console.error('Export failed:', error);
      throw new Error(`Export failed: ${error.message}`);
    }
  }

  /**
   * Start an asynchronous export job
   */
  async startExportJob(request: ExportRequest): Promise<string> {
    const jobId = `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const job: ExportJob = {
      id: jobId,
      status: 'pending',
      progress: 0,
      createdAt: new Date()
    };

    this.exportJobs.set(jobId, job);

    // Process export asynchronously
    this.processExportJob(jobId, request).catch(error => {
      console.error(`Export job ${jobId} failed:`, error);
      const failedJob = this.exportJobs.get(jobId);
      if (failedJob) {
        failedJob.status = 'failed';
        failedJob.error = error.message;
        failedJob.completedAt = new Date();
      }
    });

    return jobId;
  }

  /**
   * Get export job status
   */
  getExportJob(jobId: string): ExportJob | undefined {
    return this.exportJobs.get(jobId);
  }

  /**
   * Cancel an export job
   */
  cancelExportJob(jobId: string): boolean {
    const job = this.exportJobs.get(jobId);
    if (!job || job.status === 'completed') {
      return false;
    }

    job.status = 'failed';
    job.error = 'Export cancelled by user';
    job.completedAt = new Date();

    return true;
  }

  /**
   * Get supported export formats
   */
  getSupportedFormats(): ExportFormat[] {
    return [...this.SUPPORTED_FORMATS];
  }

  /**
   * Validate export options
   */
  validateExportOptions(options: ExportOptions): string[] {
    const errors: string[] = [];

    if (!this.SUPPORTED_FORMATS.includes(options.format)) {
      errors.push(`Unsupported format: ${options.format}`);
    }

    if (options.customFileName && options.customFileName.length > 255) {
      errors.push('Custom file name too long (max 255 characters)');
    }

    if (options.pageSize && !['A4', 'Letter', 'Legal'].includes(options.pageSize)) {
      errors.push('Invalid page size');
    }

    if (options.orientation && !['portrait', 'landscape'].includes(options.orientation)) {
      errors.push('Invalid orientation');
    }

    if (options.margins) {
      const { top, right, bottom, left } = options.margins;
      [top, right, bottom, left].forEach(margin => {
        if (margin < 0 || margin > 5) {
          errors.push('Margins must be between 0 and 5 inches');
        }
      });
    }

    return errors;
  }

  /**
   * Estimate file size for export
   */
  async estimateFileSize(request: ExportRequest): Promise<number> {
    try {
      const resume = await this.getResume(request.resumeId, request.userId);
      if (!resume) return 0;

      // Rough estimation based on format and content
      const baseSize = {
        [ExportFormat.PDF]: 50000,      // 50KB base
        [ExportFormat.DOCX]: 75000,     // 75KB base
        [ExportFormat.HTML]: 30000,     // 30KB base
        [ExportFormat.TXT]: 10000       // 10KB base
      };

      const sizePerExperience = 5000; // 5KB per experience
      const sizePerEducation = 3000;  // 3KB per education
      const sizePerSkill = 500;       // 500B per skill

      let estimatedSize = baseSize[request.options.format] || 50000;

      estimatedSize += (resume.experience?.length || 0) * sizePerExperience;
      estimatedSize += (resume.education?.length || 0) * sizePerEducation;
      estimatedSize += (resume.skills?.length || 0) * sizePerSkill;

      // Adjust for quality settings
      if (request.options.quality === 'print') {
        estimatedSize *= 1.5;
      } else if (request.options.quality === 'press') {
        estimatedSize *= 2;
      }

      return Math.min(estimatedSize, this.MAX_FILE_SIZE);
    } catch (error) {
      console.error('Failed to estimate file size:', error);
      return 0;
    }
  }

  // Private methods

  private async processExportJob(jobId: string, request: ExportRequest): Promise<void> {
    const job = this.exportJobs.get(jobId);
    if (!job) return;

    try {
      job.status = 'processing';
      job.progress = 10;

      // Simulate progress updates
      await this.updateProgress(jobId, 30, 'Rendering template...');
      const result = await this.exportResume(request);

      await this.updateProgress(jobId, 90, 'Finalizing export...');
      await this.updateProgress(jobId, 100, 'Export completed');

      job.status = 'completed';
      job.result = result;
      job.completedAt = new Date();

      // Clean up old jobs (older than 24 hours)
      this.cleanupOldJobs();
    } catch (error) {
      job.status = 'failed';
      job.error = error.message;
      job.completedAt = new Date();
    }
  }

  private async updateProgress(jobId: string, progress: number, message?: string): Promise<void> {
    const job = this.exportJobs.get(jobId);
    if (job) {
      job.progress = progress;
      // In a real implementation, you might emit progress events via WebSocket
    }
  }

  private cleanupOldJobs(): void {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    for (const [jobId, job] of this.exportJobs.entries()) {
      if (job.createdAt < oneDayAgo) {
        this.exportJobs.delete(jobId);
      }
    }
  }

  private validateExportRequest(request: ExportRequest): void {
    if (!request.resumeId) {
      throw new Error('Resume ID is required');
    }

    if (!request.userId) {
      throw new Error('User ID is required');
    }

    if (!request.options || !request.options.format) {
      throw new Error('Export options and format are required');
    }

    const errors = this.validateExportOptions(request.options);
    if (errors.length > 0) {
      throw new Error(`Invalid export options: ${errors.join(', ')}`);
    }
  }

  private async getResume(resumeId: string, userId: string): Promise<Resume | null> {
    try {
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

      if (!resume) return null;

      // Convert Prisma resume to Resume type
      return {
        id: resume.resumeId,
        userId: resume.userUid,
        personalInfo: {
          fullName: resume.professionalTitle || '',
          email: '',
          phone: resume.phone || '',
          location: resume.location || '',
          website: resume.website || '',
          linkedin: resume.linkedin || '',
          github: resume.github || '',
          portfolio: ''
        },
        summary: resume.summary || '',
        experience: resume.experience?.map(exp => ({
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
        })) || [],
        education: resume.education?.map(edu => ({
          id: edu.educationId,
          institution: edu.institution,
          degree: edu.degree,
          field: edu.field || '',
          location: '',
          startDate: edu.startDate,
          endDate: edu.endDate,
          current: edu.isCurrent,
          gpa: edu.gpa,
          honors: [],
          coursework: []
        })) || [],
        skills: resume.skills?.map((skill, index) => ({
          id: `skill_${index}`,
          name: skill,
          category: 'technical',
          level: 'intermediate',
          yearsOfExperience: undefined
        })) || [],
        projects: resume.projects?.map(proj => ({
          id: proj.projectId,
          name: proj.title,
          description: proj.description || '',
          technologies: proj.technologies || [],
          link: proj.projectUrl || '',
          github: proj.githubUrl || '',
          startDate: proj.startDate,
          endDate: proj.endDate,
          status: 'completed'
        })) || [],
        certifications: resume.certifications?.map(cert => ({
          id: cert.certificationId,
          name: cert.name,
          issuer: cert.issuer,
          issueDate: cert.issueDate,
          expiryDate: cert.expiryDate,
          credentialId: cert.credentialId,
          credentialUrl: cert.credentialUrl
        })) || [],
        languages: resume.languages?.map(lang => ({
          id: lang.languageId,
          name: lang.language,
          proficiency: lang.proficiency as any
        })) || [],
        metadata: {
          title: resume.professionalTitle || 'Resume',
          description: '',
          experienceLevel: 'mid',
          documentFormat: 'pdf'
        },
        templateId: resume.templateId || undefined,
        templateCustomizationId: resume.templateCustomizationId || undefined,
        createdAt: resume.createdAt,
        updatedAt: resume.updatedAt
      };
    } catch (error) {
      console.error('Failed to get resume:', error);
      return null;
    }
  }

  private async generateExport(
    resume: Resume,
    template: ResumeTemplate,
    customization?: TemplateCustomization,
    options: ExportOptions = { format: ExportFormat.PDF }
  ): Promise<ExportResult> {
    const exportId = `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fileName = options.customFileName ||
      `${resume.personalInfo.fullName.replace(/\s+/g, '_')}_Resume.${options.format}`;

    // In a real implementation, this would use actual export libraries
    // For now, we'll generate placeholder URLs
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010';

    let url: string;
    let fileSize: number;

    switch (options.format) {
      case ExportFormat.PDF:
        url = `${baseUrl}/api/exports/${exportId}.pdf`;
        fileSize = 150000; // 150KB
        break;
      case ExportFormat.DOCX:
        url = `${baseUrl}/api/exports/${exportId}.docx`;
        fileSize = 200000; // 200KB
        break;
      case ExportFormat.HTML:
        url = `${baseUrl}/api/exports/${exportId}.html`;
        fileSize = 75000; // 75KB
        break;
      case ExportFormat.TXT:
        url = `${baseUrl}/api/exports/${exportId}.txt`;
        fileSize = 25000; // 25KB
        break;
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }

    // Adjust file size based on quality settings
    if (options.quality === 'print') {
      fileSize *= 1.5;
    } else if (options.quality === 'press') {
      fileSize *= 2;
    }

    // Adjust for compression
    if (options.compression) {
      fileSize *= 0.8;
    }

    return {
      id: exportId,
      templateId: template.templateId,
      format: options.format,
      url,
      fileName,
      fileSize: Math.round(fileSize),
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      metadata: {
        pages: this.estimatePageCount(resume),
        resolution: options.quality || 'screen',
        colorSpace: 'RGB',
        compression: options.compression ? 'lossy' : 'lossless',
        optimizedFor: options.quality === 'print' ? 'print' : 'screen'
      }
    };
  }

  private estimatePageCount(resume: Resume): number {
    // Simple estimation based on content length
    let pageCount = 1;

    const experienceCount = resume.experience?.length || 0;
    const educationCount = resume.education?.length || 0;
    const skillsCount = resume.skills?.length || 0;
    const projectsCount = resume.projects?.length || 0;

    // Add pages based on content
    if (experienceCount > 3) pageCount += Math.ceil((experienceCount - 3) / 2);
    if (educationCount > 2) pageCount += Math.ceil((educationCount - 2) / 3);
    if (skillsCount > 10) pageCount += Math.ceil((skillsCount - 10) / 15);
    if (projectsCount > 2) pageCount += Math.ceil((projectsCount - 2) / 2);

    // Add half page for summary if it's long
    if (resume.summary && resume.summary.length > 300) {
      pageCount += 0.5;
    }

    return Math.ceil(pageCount);
  }

  private async trackExport(
    userId: string,
    resumeId: string,
    templateId: string,
    format: ExportFormat,
    result: ExportResult
  ): Promise<void> {
    try {
      // Update template usage export count
      await prisma.resumeTemplateUsage.updateMany({
        where: {
          userUid: userId,
          templateId,
          resumeId
        },
        data: {
          exportCount: { increment: 1 }
        }
      });

      // Log export for analytics
      console.log(`Export tracked: User ${userId}, Template ${templateId}, Format ${format}, File ${result.fileName}`);
    } catch (error) {
      console.error('Failed to track export:', error);
    }
  }
}

// Export singleton instance
export const templateExportService = new TemplateExportService();