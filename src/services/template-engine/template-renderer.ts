/**
 * Template Renderer Service
 *
 * Handles rendering resume data into template formats, including
 * HTML generation, preview rendering, and output optimization.
 */

import {
  Resume,
  ResumeTemplate,
  RenderedTemplate,
  RenderOptions,
  RenderOptimization,
  ValidationResult,
  TemplateSystemConfig
} from '@/types/template';
import { TemplateEngineErrorFactory } from './errors';
import { DataBinder } from './data-binder';
import { StyleProcessor } from './style-processor';
import { ContentProcessor } from './content-processor';
import { TemplateValidator } from './template-validator';

export interface RenderContext {
  template: ResumeTemplate;
  resume: Resume;
  options: RenderOptions;
  customizations?: any;
  metadata: RenderMetadata;
}

export interface RenderMetadata {
  renderId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  version: string;
  optimization: RenderOptimization;
  errors: string[];
  warnings: string[];
}

export class TemplateRenderer {
  private config: TemplateSystemConfig;
  private dataBinder: DataBinder;
  private styleProcessor: StyleProcessor;
  private contentProcessor: ContentProcessor;
  private validator: TemplateValidator;

  constructor(config: TemplateSystemConfig) {
    this.config = config;
    this.dataBinder = new DataBinder();
    this.styleProcessor = new StyleProcessor();
    this.contentProcessor = new ContentProcessor();
    this.validator = new TemplateValidator();
  }

  /**
   * Render a resume template with given data
   */
  async render(
    templateId: string,
    resume: Resume,
    options: RenderOptions = {}
  ): Promise<RenderedTemplate> {
    const startTime = Date.now();
    const renderId = this.generateRenderId();

    try {
      console.log(`[TemplateRenderer] Starting render: ${renderId}`);

      // Get template (this would come from registry in real implementation)
      const template = await this.getTemplate(templateId);
      if (!template) {
        throw TemplateEngineErrorFactory.templateNotFound(templateId);
      }

      // Validate template and data
      const validation = this.validateRenderData(template, resume);
      if (!validation.isValid) {
        throw TemplateEngineErrorFactory.validationFailed(
          `Validation failed: ${validation.errors.map(e => e.message).join(', ')}`
        );
      }

      // Create render context
      const context: RenderContext = {
        template,
        resume,
        options: {
          format: options.format || 'html',
          customizations: options.customizations,
          optimization: {
            minify: false,
            inlineCSS: true,
            embedImages: false,
            subsetFonts: true,
            ...options.optimization
          }
        },
        metadata: {
          renderId,
          startTime,
          version: '1.0.0',
          optimization: options.optimization || {},
          errors: [],
          warnings: []
        }
      };

      // Render pipeline
      let renderedContent;
      switch (options.format) {
        case 'preview':
          renderedContent = await this.renderPreview(context);
          break;
        case 'html':
        default:
          renderedContent = await this.renderHTML(context);
          break;
      }

      const endTime = Date.now();
      context.metadata.endTime = endTime;
      context.metadata.duration = endTime - startTime;

      // Create result
      const result: RenderedTemplate = {
        id: renderId,
        templateId,
        resumeData: resume,
        customizations: options.customizations || {},
        rendered: renderedContent,
        metadata: {
          generatedAt: new Date(),
          renderingTime: context.metadata.duration || 0,
          version: context.metadata.version,
          checksum: this.generateChecksum(renderedContent),
          size: {
            html: renderedContent.html.length,
            css: renderedContent.css.length,
            total: renderedContent.html.length + renderedContent.css.length
          }
        }
      };

      console.log(`[TemplateRenderer] Render completed: ${renderId} (${context.metadata.duration}ms)`);
      return result;

    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.error(`[TemplateRenderer] Render failed: ${renderId} (${duration}ms)`, error);

      if (error instanceof TemplateEngineError) {
        throw error;
      }

      throw TemplateEngineErrorFactory.renderFailed(
        error instanceof Error ? error : new Error('Unknown render error'),
        templateId
      );
    }
  }

  /**
   * Generate a quick preview of a template
   */
  async preview(templateId: string, resume?: Partial<Resume>): Promise<string> {
    // Use demo data if no resume provided
    const demoResume = resume || this.generateDemoResume();

    const options: RenderOptions = {
      format: 'preview',
      optimization: {
        minify: true,
        inlineCSS: true,
        embedImages: true,
        subsetFonts: false
      }
    };

    const result = await this.render(templateId, demoResume as Resume, options);
    return result.rendered.html;
  }

  /**
   * Validate template and resume data
   */
  validate(templateId: string, resume: Resume): ValidationResult {
    try {
      const template = this.getTemplateSync(templateId);
      if (!template) {
        return {
          isValid: false,
          errors: [
            {
              field: 'templateId',
              message: `Template not found: ${templateId}`,
              code: 'TEMPLATE_NOT_FOUND',
              severity: 'error'
            }
          ],
          warnings: [],
          score: 0
        };
      }

      return this.validateRenderData(template, resume);
    } catch (error) {
      return {
        isValid: false,
        errors: [
          {
            field: 'validation',
            message: error instanceof Error ? error.message : 'Validation failed',
            code: 'VALIDATION_ERROR',
            severity: 'error'
          }
        ],
        warnings: [],
        score: 0
      };
    }
  }

  /**
   * Get supported render formats
   */
  getSupportedFormats(): string[] {
    return ['html', 'preview'];
  }

  // Private methods

  private async getTemplate(templateId: string): Promise<ResumeTemplate | null> {
    // In real implementation, this would fetch from the template registry
    // For now, we'll return null to indicate template should be provided externally
    return null;
  }

  private getTemplateSync(templateId: string): ResumeTemplate | null {
    // Synchronous version for validation
    return null;
  }

  private validateRenderData(template: ResumeTemplate, resume: Resume): ValidationResult {
    const errors: any[] = [];
    const warnings: any[] = [];

    // Validate required sections
    for (const section of template.sections) {
      if (section.required) {
        const hasData = this.hasSectionData(resume, section.type);
        if (!hasData) {
          errors.push({
            field: section.id,
            message: `Required section '${section.name}' is missing or empty`,
            code: 'MISSING_REQUIRED_SECTION',
            severity: 'error'
          });
        }
      }
    }

    // Validate personal information
    if (!resume.personalInfo || !resume.personalInfo.fullName) {
      errors.push({
        field: 'personalInfo.fullName',
        message: 'Full name is required',
        code: 'MISSING_FULL_NAME',
        severity: 'error'
      });
    }

    // Validate email format
    if (resume.personalInfo?.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(resume.personalInfo.email)) {
        errors.push({
          field: 'personalInfo.email',
          message: 'Invalid email format',
          code: 'INVALID_EMAIL',
          severity: 'error'
        });
      }
    }

    // Check for empty experience
    if (!resume.experience || resume.experience.length === 0) {
      warnings.push({
        field: 'experience',
        message: 'No work experience provided',
        code: 'NO_EXPERIENCE',
        severity: 'warning',
        suggestion: 'Add work experience to strengthen your resume'
      });
    }

    // Check for missing education
    if (!resume.education || resume.education.length === 0) {
      warnings.push({
        field: 'education',
        message: 'No education information provided',
        code: 'NO_EDUCATION',
        severity: 'warning',
        suggestion: 'Add education information to complete your profile'
      });
    }

    // Calculate validation score
    const totalChecks = errors.length + warnings.length + 10; // Base score
    const score = Math.max(0, Math.round(((totalChecks - errors.length - (warnings.length * 0.5)) / totalChecks) * 100));

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score
    };
  }

  private hasSectionData(resume: Resume, sectionType: string): boolean {
    switch (sectionType) {
      case 'personal-info':
        return !!resume.personalInfo;
      case 'summary':
        return !!resume.summary && resume.summary.trim().length > 0;
      case 'experience':
        return !!(resume.experience && resume.experience.length > 0);
      case 'education':
        return !!(resume.education && resume.education.length > 0);
      case 'skills':
        return !!(resume.skills && resume.skills.length > 0);
      case 'projects':
        return !!(resume.projects && resume.projects.length > 0);
      case 'certifications':
        return !!(resume.certifications && resume.certifications.length > 0);
      case 'languages':
        return !!(resume.languages && resume.languages.length > 0);
      default:
        return false;
    }
  }

  private async renderHTML(context: RenderContext): Promise<any> {
    const { template, resume, options } = context;

    // Process content
    const processedContent = await this.contentProcessor.process(resume, template);

    // Bind data to template
    const boundData = await this.dataBinder.bind(processedContent, template);

    // Generate styles
    const styles = await this.styleProcessor.generate(template, options.customizations);

    // Generate HTML structure
    const html = this.generateHTMLStructure(template, boundData, styles, options);

    return {
      html: options.optimization?.minify ? this.minifyHTML(html) : html,
      css: styles.css,
      javascript: styles.javascript,
      assets: styles.assets || {
        fonts: [],
        images: [],
        icons: []
      }
    };
  }

  private async renderPreview(context: RenderContext): Promise<any> {
    // For preview, we use a simplified rendering with demo data
    const { template, resume, options } = context;

    // Generate preview HTML (simplified version)
    const previewHTML = this.generatePreviewHTML(template, resume, options);

    return {
      html: previewHTML,
      css: '',
      assets: {
        fonts: [],
        images: [],
        icons: []
      }
    };
  }

  private generateHTMLStructure(
    template: ResumeTemplate,
    data: any,
    styles: any,
    options: RenderOptions
  ): string {
    const { template: templateStyles } = styles;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.personalInfo?.fullName || 'Resume'} - Professional Resume</title>
    <style>
        ${templateStyles}
    </style>
</head>
<body>
    <div class="resume-container">
        ${this.renderHeader(template, data)}
        ${this.renderSections(template, data)}
    </div>
</body>
</html>`;
  }

  private renderHeader(template: ResumeTemplate, data: any): string {
    const { personalInfo } = data;
    const { headerStyle } = template.layout;

    let headerClass = 'resume-header';
    if (headerStyle === 'centered') headerClass += ' text-center';
    if (headerStyle === 'left-aligned') headerClass += ' text-left';
    if (headerStyle === 'right-aligned') headerClass += ' text-right';

    return `
    <header class="${headerClass}">
        <h1 class="resume-name">${personalInfo?.fullName || 'Your Name'}</h1>
        ${personalInfo?.title ? `<h2 class="resume-title">${personalInfo.title}</h2>` : ''}
        <div class="contact-info">
            ${personalInfo?.email ? `<span class="contact-item">${personalInfo.email}</span>` : ''}
            ${personalInfo?.phone ? `<span class="contact-item">${personalInfo.phone}</span>` : ''}
            ${personalInfo?.location ? `<span class="contact-item">${personalInfo.location}</span>` : ''}
            ${personalInfo?.linkedin ? `<span class="contact-item">${personalInfo.linkedin}</span>` : ''}
        </div>
    </header>`;
  }

  private renderSections(template: ResumeTemplate, data: any): string {
    const sections = template.sections
      .filter(section => section.visible && this.hasSectionData(data, section.type))
      .sort((a, b) => a.order - b.order);

    return sections.map(section => this.renderSection(template, section, data)).join('\n');
  }

  private renderSection(template: ResumeTemplate, section: any, data: any): string {
    switch (section.type) {
      case 'summary':
        return this.renderSummary(data);
      case 'experience':
        return this.renderExperience(data);
      case 'education':
        return this.renderEducation(data);
      case 'skills':
        return this.renderSkills(data);
      case 'projects':
        return this.renderProjects(data);
      case 'certifications':
        return this.renderCertifications(data);
      case 'languages':
        return this.renderLanguages(data);
      default:
        return '';
    }
  }

  private renderSummary(data: any): string {
    if (!data.summary) return '';

    return `
    <section class="resume-section summary-section">
        <h2 class="section-title">Professional Summary</h2>
        <div class="summary-content">
            <p>${data.summary}</p>
        </div>
    </section>`;
  }

  private renderExperience(data: any): string {
    if (!data.experience || data.experience.length === 0) return '';

    const experienceHTML = data.experience.map((exp: any) => `
        <div class="experience-item">
            <div class="experience-header">
                <h3 class="job-title">${exp.title}</h3>
                <div class="company-location">
                    <span class="company">${exp.company}</span>
                    ${exp.location ? `<span class="location">${exp.location}</span>` : ''}
                </div>
                <div class="employment-dates">
                    <span class="date-range">${this.formatDateRange(exp.startDate, exp.endDate, exp.current)}</span>
                </div>
            </div>
            ${exp.description ? `<div class="job-description">${exp.description}</div>` : ''}
            ${exp.achievements && exp.achievements.length > 0 ? `
                <ul class="achievements">
                    ${exp.achievements.map((achievement: string) => `<li>${achievement}</li>`).join('')}
                </ul>
            ` : ''}
        </div>
    `).join('');

    return `
    <section class="resume-section experience-section">
        <h2 class="section-title">Professional Experience</h2>
        <div class="experience-list">
            ${experienceHTML}
        </div>
    </section>`;
  }

  private renderEducation(data: any): string {
    if (!data.education || data.education.length === 0) return '';

    const educationHTML = data.education.map((edu: any) => `
        <div class="education-item">
            <div class="education-header">
                <h3 class="degree">${edu.degree}${edu.field ? ` in ${edu.field}` : ''}</h3>
                <div class="institution-location">
                    <span class="institution">${edu.institution}</span>
                    ${edu.location ? `<span class="location">${edu.location}</span>` : ''}
                </div>
                <div class="education-dates">
                    <span class="date-range">${this.formatDateRange(edu.startDate, edu.endDate, false)}</span>
                    ${edu.gpa ? `<span class="gpa">GPA: ${edu.gpa}</span>` : ''}
                </div>
            </div>
        </div>
    `).join('');

    return `
    <section class="resume-section education-section">
        <h2 class="section-title">Education</h2>
        <div class="education-list">
            ${educationHTML}
        </div>
    </section>`;
  }

  private renderSkills(data: any): string {
    if (!data.skills || data.skills.length === 0) return '';

    const skillsByCategory = data.skills.reduce((acc: any, skill: any) => {
      const category = skill.category || 'technical';
      if (!acc[category]) acc[category] = [];
      acc[category].push(skill);
      return acc;
    }, {});

    const skillsHTML = Object.entries(skillsByCategory).map(([category, skills]: [string, any]) => `
        <div class="skill-category">
            <h4 class="skill-category-title">${category.charAt(0).toUpperCase() + category.slice(1)}</h4>
            <div class="skill-list">
                ${(skills as any[]).map((skill: any) => `<span class="skill-item">${skill.name}</span>`).join('')}
            </div>
        </div>
    `).join('');

    return `
    <section class="resume-section skills-section">
        <h2 class="section-title">Skills</h2>
        <div class="skills-container">
            ${skillsHTML}
        </div>
    </section>`;
  }

  private renderProjects(data: any): string {
    if (!data.projects || data.projects.length === 0) return '';

    const projectsHTML = data.projects.map((project: any) => `
        <div class="project-item">
            <h3 class="project-name">${project.name}</h3>
            ${project.description ? `<p class="project-description">${project.description}</p>` : ''}
            ${project.technologies && project.technologies.length > 0 ? `
                <div class="project-technologies">
                    <strong>Technologies:</strong> ${project.technologies.join(', ')}
                </div>
            ` : ''}
        </div>
    `).join('');

    return `
    <section class="resume-section projects-section">
        <h2 class="section-title">Projects</h2>
        <div class="projects-list">
            ${projectsHTML}
        </div>
    </section>`;
  }

  private renderCertifications(data: any): string {
    if (!data.certifications || data.certifications.length === 0) return '';

    const certificationsHTML = data.certifications.map((cert: any) => `
        <div class="certification-item">
            <strong>${cert.name}</strong>
            <span class="certification-issuer">${cert.issuer}</span>
            ${cert.issueDate ? `<span class="certification-date">${cert.issueDate}</span>` : ''}
        </div>
    `).join('');

    return `
    <section class="resume-section certifications-section">
        <h2 class="section-title">Certifications</h2>
        <div class="certifications-list">
            ${certificationsHTML}
        </div>
    </section>`;
  }

  private renderLanguages(data: any): string {
    if (!data.languages || data.languages.length === 0) return '';

    const languagesHTML = data.languages.map((lang: any) => `
        <div class="language-item">
            <span class="language-name">${lang.name}</span>
            <span class="language-proficiency">${lang.proficiency}</span>
        </div>
    `).join('');

    return `
    <section class="resume-section languages-section">
        <h2 class="section-title">Languages</h2>
        <div class="languages-list">
            ${languagesHTML}
        </div>
    </section>`;
  }

  private generatePreviewHTML(template: ResumeTemplate, resume: Partial<Resume>, options: RenderOptions): string {
    // Simplified preview for template gallery
    return `
    <div class="template-preview" data-template-id="${template.id}">
        <div class="preview-header">
            <h3>${template.name}</h3>
            <p>${template.description}</p>
        </div>
        <div class="preview-content">
            <div class="preview-thumbnail">
                <img src="${template.preview.thumbnail}" alt="${template.name} Preview" />
            </div>
            <div class="preview-details">
                <span class="template-category">${template.category}</span>
                ${template.features.atsOptimized ? '<span class="feature-badge">ATS Optimized</span>' : ''}
            </div>
        </div>
    </div>`;
  }

  private formatDateRange(startDate: string, endDate?: string, current?: boolean): string {
    const start = new Date(startDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });

    if (current || !endDate) {
      return `${start} - Present`;
    }

    const end = new Date(endDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });

    return `${start} - ${end}`;
  }

  private minifyHTML(html: string): string {
    return html
      .replace(/\s+/g, ' ')
      .replace(/>\s+</g, '><')
      .replace(/^\s+|\s+$/g, '');
  }

  private generateRenderId(): string {
    return `render_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateChecksum(content: any): string {
    // Simple checksum implementation
    const str = JSON.stringify(content);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  private generateDemoResume(): Partial<Resume> {
    return {
      personalInfo: {
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        phone: '(555) 123-4567',
        location: 'New York, NY',
        linkedin: 'https://linkedin.com/in/johndoe'
      },
      summary: 'Experienced professional with a proven track record of success in leadership roles.',
      experience: [
        {
          id: '1',
          title: 'Senior Manager',
          company: 'Tech Company',
          location: 'New York, NY',
          startDate: '2020-01',
          endDate: null,
          current: true,
          description: 'Leading strategic initiatives and team development.',
          achievements: ['Increased team productivity by 30%', 'Successfully launched 5 major projects'],
          skills: ['Leadership', 'Strategy', 'Project Management']
        }
      ],
      education: [
        {
          id: '1',
          institution: 'University Name',
          degree: 'Bachelor of Science',
          field: 'Business Administration',
          location: 'Boston, MA',
          startDate: '2015-09',
          endDate: '2019-05'
        }
      ],
      skills: [
        { id: '1', name: 'Leadership', category: 'soft', level: 'expert' },
        { id: '2', name: 'Project Management', category: 'technical', level: 'advanced' }
      ]
    };
  }
}