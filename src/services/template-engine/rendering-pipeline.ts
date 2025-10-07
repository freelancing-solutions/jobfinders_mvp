/**
 * Template Rendering Pipeline
 *
 * Multi-stage rendering system that processes templates through validation,
 * processing, styling, optimization, and output generation with error handling
 * and performance monitoring.
 */

import { ResumeTemplate, Resume, RenderedTemplate, RenderedContent, RenderedMetadata, TemplateError, TemplateErrorCode } from '@/types/template';
import { logger } from '@/lib/logger';
import { TemplateEngineErrorFactory } from './errors';
import { DataBinder, DataBindingResult } from './data-binder';

export interface RenderingPipelineOptions {
  format?: 'html' | 'preview' | 'print';
  customizations?: any;
  optimization?: RenderingOptimization;
  performance?: PerformanceOptions;
}

export interface RenderingOptimization {
  minify: boolean;
  inlineCSS: boolean;
  embedImages: boolean;
  subsetFonts: boolean;
  lazyLoad: boolean;
  compress: boolean;
}

export interface PerformanceOptions {
  timeout: number;
  enableProfiling: boolean;
  enableCaching: boolean;
  enableMetrics: boolean;
}

export interface RenderingContext {
  template: ResumeTemplate;
  resume: Resume;
  options: RenderingPipelineOptions;
  startTime: number;
  metadata: RenderingMetadata;
  errors: RenderingError[];
  warnings: RenderingWarning[];
}

export interface RenderingError {
  stage: string;
  code: string;
  message: string;
  details?: any;
  recoverable: boolean;
}

export interface RenderingWarning {
  stage: string;
  code: string;
  message: string;
  impact: string;
}

export interface RenderingStage {
  name: string;
  execute: (context: RenderingContext) => Promise<RenderingContext>;
  timeout: number;
  required: boolean;
}

export class RenderingPipeline {
  private stages: Map<string, RenderingStage> = new Map();
  private dataBinder: DataBinder;
  private performanceMetrics: Map<string, any> = new Map();

  constructor() {
    this.dataBinder = new DataBinder();
    this.initializeStages();
  }

  /**
   * Render a template with resume data
   */
  async render(
    template: ResumeTemplate,
    resume: Resume,
    options: RenderingPipelineOptions = {}
  ): Promise<RenderedTemplate> {
    const startTime = Date.now();

    try {
      logger.info('Starting template rendering', {
        templateId: template.id,
        format: options.format || 'html',
        resumeId: resume.id
      });

      // Initialize rendering context
      const context: RenderingContext = {
        template,
        resume,
        options: {
          format: 'html',
          customizations: {},
          optimization: {
            minify: false,
            inlineCSS: true,
            embedImages: false,
            subsetFonts: true,
            lazyLoad: false,
            compress: false
          },
          performance: {
            timeout: 10000,
            enableProfiling: true,
            enableCaching: true,
            enableMetrics: true
          },
          ...options
        },
        startTime,
        metadata: {
          generatedAt: new Date(),
          renderingTime: 0,
          version: template.metadata.version,
          checksum: '',
          size: { html: 0, css: 0, total: 0 }
        },
        errors: [],
        warnings: []
      };

      // Execute rendering stages
      const finalContext = await this.executeRenderingPipeline(context);

      // Create final rendered template
      const renderedTemplate: RenderedTemplate = {
        id: `rendered-${template.id}-${Date.now()}`,
        templateId: template.id,
        resumeData: resume,
        customizations: options.customizations || {},
        rendered: finalContext.metadata.renderedContent as RenderedContent,
        metadata: finalContext.metadata
      };

      const renderingTime = Date.now() - startTime;
      logger.info('Template rendering completed', {
        templateId: template.id,
        renderingTime,
        errors: finalContext.errors.length,
        warnings: finalContext.warnings.length
      });

      return renderedTemplate;

    } catch (error) {
      const renderingTime = Date.now() - startTime;
      logger.error('Template rendering failed', {
        templateId: template.id,
        renderingTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw TemplateEngineErrorFactory.fromError(error as Error, template.id);
    }
  }

  /**
   * Execute rendering pipeline stages
   */
  private async executeRenderingPipeline(context: RenderingContext): Promise<RenderingContext> {
    let currentContext = context;

    // Define rendering stages
    const pipeline: RenderingStage[] = [
      this.stages.get('validation')!,
      this.stages.get('dataBinding')!,
      this.stages.get('contentProcessing')!,
      this.stages.get('styling')!,
      this.stages.get('optimization')!,
      this.stages.get('output')!
    ];

    // Execute each stage
    for (const stage of pipeline) {
      if (!stage) continue;

      try {
        const stageStartTime = Date.now();
        currentContext = await this.executeStageWithTimeout(stage, currentContext);
        const stageEndTime = Date.now();

        // Record performance metrics
        if (currentContext.options.performance?.enableProfiling) {
          this.recordPerformanceMetric(stage.name, stageEndTime - stageStartTime);
        }

        // Handle errors from stage
        if (currentContext.errors.length > 0) {
          const unrecoverableErrors = currentContext.errors.filter(e => !e.recoverable);
          if (unrecoverableErrors.length > 0) {
            throw new Error(`Unrecoverable error in stage ${stage.name}: ${unrecoverableErrors[0].message}`);
          }
        }

      } catch (error) {
        if (stage.required) {
          throw error; // Critical stage failed
        } else {
          // Non-critical stage failed, continue with warnings
          currentContext.warnings.push({
            stage: stage.name,
            code: 'STAGE_FAILED',
            message: `Stage ${stage.name} failed but is not critical: ${error instanceof Error ? error.message : 'Unknown error'}`,
            impact: 'Rendering quality may be reduced'
          });
        }
      }
    }

    return currentContext;
  }

  /**
   * Execute a stage with timeout
   */
  private async executeStageWithTimeout(stage: RenderingStage, context: RenderingContext): Promise<RenderingContext> {
    const timeout = stage.timeout || context.options.performance?.timeout || 10000;

    return Promise.race([
      stage.execute(context),
      new Promise<RenderingContext>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Stage ${stage.name} timed out after ${timeout}ms`));
        }, timeout);
      })
    ]) as Promise<RenderingContext>;
  }

  /**
   * Initialize rendering stages
   */
  private initializeStages(): void {
    this.stages.set('validation', {
      name: 'validation',
      execute: this.validationStage.bind(this),
      timeout: 2000,
      required: true
    });

    this.stages.set('dataBinding', {
      name: 'dataBinding',
      execute: this.dataBindingStage.bind(this),
      timeout: 5000,
      required: true
    });

    this.stages.set('contentProcessing', {
      name: 'contentProcessing',
      execute: this.contentProcessingStage.bind(this),
      timeout: 3000,
      required: true
    });

    this.stages.set('styling', {
      name: 'styling',
      execute: this.stylingStage.bind(this),
      timeout: 4000,
      required: true
    });

    this.stages.set('optimization', {
      name: 'optimization',
      execute: this.optimizationStage.bind(this),
      timeout: 2000,
      required: false
    });

    this.stages.set('output', {
      name: 'output',
      execute: this.outputStage.bind(this),
      timeout: 3000,
      required: true
    });
  }

  /**
   * Stage 1: Validation
   */
  private async validationStage(context: RenderingContext): Promise<RenderingContext> {
    logger.debug('Starting validation stage');

    // Validate template structure
    if (!context.template || !context.template.id) {
      context.errors.push({
        stage: 'validation',
        code: 'INVALID_TEMPLATE',
        message: 'Invalid template structure',
        details: { template: context.template },
        recoverable: false
      });
    }

    // Validate resume data
    if (!context.resume || !context.resume.id) {
      context.errors.push({
        stage: 'validation',
        code: 'INVALID_RESUME',
        message: 'Invalid resume data',
        details: { resume: context.resume },
        recoverable: false
      });
    }

    // Validate rendering options
    if (context.options.format && !['html', 'preview', 'print'].includes(context.options.format)) {
      context.warnings.push({
        stage: 'validation',
        code: 'INVALID_FORMAT',
        message: `Unsupported format: ${context.options.format}, using html`,
        impact: 'Output format may not be as expected'
      });
      context.options.format = 'html';
    }

    logger.debug('Validation stage completed', {
      errors: context.errors.length,
      warnings: context.warnings.length
    });

    return context;
  }

  /**
   * Stage 2: Data Binding
   */
  private async dataBindingStage(context: RenderingContext): Promise<RenderingContext> {
    logger.debug('Starting data binding stage');

    try {
      const bindingResult: DataBindingResult = await this.dataBinder.bindData(
        context.template,
        context.resume,
        context.options.customizations
      );

      if (!bindingResult.success) {
        bindingResult.errors.forEach(error => {
          context.errors.push({
            stage: 'dataBinding',
            code: error.code,
            message: error.message,
            details: { field: error.field, section: error.section },
            recoverable: error.code !== 'REQUIRED_FIELD_MISSING'
          });
        });
      }

      bindingResult.warnings.forEach(warning => {
        context.warnings.push({
          stage: 'dataBinding',
          code: 'DATA_BINDING_WARNING',
          message: warning.message,
          impact: warning.impact
        });
      });

      // Store bound data in context
      context.metadata.boundData = bindingResult.data;
      context.metadata.bindingMetadata = bindingResult.metadata;

      logger.debug('Data binding stage completed', {
        boundFields: bindingResult.metadata.boundFields,
        completeness: bindingResult.metadata.dataCompleteness
      });

      return context;

    } catch (error) {
      context.errors.push({
        stage: 'dataBinding',
        code: 'DATA_BINDING_ERROR',
        message: 'Data binding failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        recoverable: false
      });
      return context;
    }
  }

  /**
   * Stage 3: Content Processing
   */
  private async contentProcessingStage(context: RenderingContext): Promise<RenderingContext> {
    logger.debug('Starting content processing stage');

    try {
      const boundData = context.metadata.boundData;
      if (!boundData) {
        throw new Error('No bound data available for content processing');
      }

      // Process template sections
      const processedSections = await this.processSections(context.template, boundData);

      // Generate HTML structure
      const htmlStructure = this.generateHTMLStructure(context.template, processedSections);

      // Store processed content
      context.metadata.processedContent = {
        sections: processedSections,
        htmlStructure,
        assets: this.identifyAssets(context.template)
      };

      logger.debug('Content processing stage completed', {
        sectionsCount: processedSections.length,
        assetsCount: context.metadata.processedContent.assets.length
      });

      return context;

    } catch (error) {
      context.errors.push({
        stage: 'contentProcessing',
        code: 'CONTENT_PROCESSING_ERROR',
        message: 'Content processing failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        recoverable: true
      });
      return context;
    }
  }

  /**
   * Stage 4: Styling
   */
  private async stylingStage(context: RenderingContext): Promise<RenderingContext> {
    logger.debug('Starting styling stage');

    try {
      const processedContent = context.metadata.processedContent;
      if (!processedContent) {
        throw new Error('No processed content available for styling');
      }

      // Generate CSS from template styling
      const css = this.generateCSS(context.template, context.options.customizations);

      // Apply responsive styles
      const responsiveCSS = this.generateResponsiveCSS(context.template);

      // Combine CSS
      const fullCSS = this.combineCSS([css, responsiveCSS]);

      // Store styling information
      context.metadata.processedContent.css = fullCSS;
      context.metadata.processedContent.styleInfo = {
        theme: context.template.styling.colors,
        fonts: context.template.styling.fonts,
        responsive: context.template.layout.responsiveness
      };

      logger.debug('Styling stage completed', {
        cssSize: fullCSS.length,
        responsiveRules: responsiveCSS.length
      });

      return context;

    } catch (error) {
      context.errors.push({
        stage: 'styling',
        code: 'STYLING_ERROR',
        message: 'Styling failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        recoverable: true
      });
      return context;
    }
  }

  /**
   * Stage 5: Optimization
   */
  private async optimizationStage(context: RenderingContext): Promise<RenderingContext> {
    logger.debug('Starting optimization stage');

    try {
      const processedContent = context.metadata.processedContent;
      const optimization = context.options.optimization;

      if (!processedContent) {
        throw new Error('No processed content available for optimization');
      }

      // Apply optimizations
      let optimizedHTML = processedContent.htmlStructure;
      let optimizedCSS = processedContent.css;

      if (optimization?.minify) {
        optimizedHTML = this.minifyHTML(optimizedHTML);
        optimizedCSS = this.minifyCSS(optimizedCSS);
      }

      if (optimization?.inlineCSS) {
        optimizedHTML = this.inlineCSS(optimizedHTML, optimizedCSS);
        optimizedCSS = ''; // CSS is now inline
      }

      if (optimization?.compress) {
        optimizedHTML = this.compressHTML(optimizedHTML);
      }

      // Store optimized content
      context.metadata.processedContent.htmlStructure = optimizedHTML;
      context.metadata.processedContent.css = optimizedCSS;
      context.metadata.optimization = {
        minified: optimization?.minify || false,
        inlineCSS: optimization?.inlineCSS || false,
        compressed: optimization?.compress || false
      };

      logger.debug('Optimization stage completed', {
        htmlSize: optimizedHTML.length,
        cssSize: optimizedCSS.length,
        optimizations: Object.keys(optimization || {})
      });

      return context;

    } catch (error) {
      context.warnings.push({
        stage: 'optimization',
        code: 'OPTIMIZATION_ERROR',
        message: 'Optimization failed, using unoptimized content',
        impact: 'File size may be larger and performance reduced'
      });
      return context;
    }
  }

  /**
   * Stage 6: Output
   */
  private async outputStage(context: RenderingContext): Promise<RenderingContext> {
    logger.debug('Starting output stage');

    try {
      const processedContent = context.metadata.processedContent;
      if (!processedContent) {
        throw new Error('No processed content available for output');
      }

      // Create final rendered content
      const renderedContent: RenderedContent = {
        html: processedContent.htmlStructure,
        css: processedContent.css,
        javascript: this.generateJavaScript(context.template),
        assets: processedContent.assets || []
      };

      // Calculate sizes
      const htmlSize = new Blob([renderedContent.html]).size;
      const cssSize = new Blob([renderedContent.css]).size;
      const jsSize = renderedContent.javascript ? new Blob([renderedContent.javascript]).size : 0;

      // Update metadata
      context.metadata.renderedContent = renderedContent;
      context.metadata.size = {
        html: htmlSize,
        css: cssSize,
        total: htmlSize + cssSize + jsSize
      };
      context.metadata.renderingTime = Date.now() - context.startTime;
      context.metadata.checksum = this.generateChecksum(renderedContent);

      logger.debug('Output stage completed', {
        totalSize: context.metadata.size.total,
        renderingTime: context.metadata.renderingTime
      });

      return context;

    } catch (error) {
      context.errors.push({
        stage: 'output',
        code: 'OUTPUT_ERROR',
        message: 'Output generation failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        recoverable: false
      });
      return context;
    }
  }

  /**
   * Process template sections
   */
  private async processSections(template: ResumeTemplate, boundData: any): Promise<any[]> {
    const processedSections: any[] = [];

    for (const section of template.sections) {
      try {
        const sectionData = boundData[section.id];
        if (!sectionData) continue;

        const processedSection = {
          id: section.id,
          name: section.name,
          type: section.type,
          data: sectionData,
          layout: section.layout,
          styling: section.styling,
          visibility: section.visibility
        };

        processedSections.push(processedSection);
      } catch (error) {
        logger.warn('Failed to process section', {
          sectionId: section.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return processedSections;
  }

  /**
   * Generate HTML structure
   */
  private generateHTMLStructure(template: ResumeTemplate, sections: any[]): string {
    const { layout, styling } = template;

    let html = '<!DOCTYPE html>\n<html>\n<head>\n';
    html += '<meta charset="UTF-8">\n';
    html += '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n';
    html += '<title>Resume - ' + template.name + '</title>\n';
    html += '</head>\n<body>\n';

    html += '<div class="resume-template" data-template-id="' + template.id + '">\n';

    // Add sections
    for (const section of sections) {
      html += this.generateSectionHTML(section);
    }

    html += '</div>\n</body>\n</html>';

    return html;
  }

  /**
   * Generate HTML for a section
   */
  private generateSectionHTML(section: any): string {
    let html = `<section class="section-${section.id}" data-section-type="${section.type}">\n`;
    html += `<h2 class="section-title">${section.name}</h2>\n`;

    // Generate section content based on type
    switch (section.type) {
      case 'personal-info':
        html += this.generatePersonalInfoHTML(section.data);
        break;
      case 'summary':
        html += this.generateSummaryHTML(section.data);
        break;
      case 'experience':
        html += this.generateExperienceHTML(section.data);
        break;
      case 'education':
        html += this.generateEducationHTML(section.data);
        break;
      case 'skills':
        html += this.generateSkillsHTML(section.data);
        break;
      default:
        html += this.generateGenericSectionHTML(section.data);
    }

    html += '</section>\n';
    return html;
  }

  /**
   * Generate personal info HTML
   */
  private generatePersonalInfoHTML(data: any): string {
    let html = '<div class="personal-info">\n';

    if (data.fullName) {
      html += `<h1 class="name">${data.fullName}</h1>\n`;
    }

    if (data.title) {
      html += `<p class="title">${data.title}</p>\n`;
    }

    html += '<div class="contact-info">\n';

    const contactItems = [
      { label: 'Email', value: data.email, icon: 'email' },
      { label: 'Phone', value: data.phone, icon: 'phone' },
      { label: 'Location', value: data.location, icon: 'location' },
      { label: 'LinkedIn', value: data.linkedin, icon: 'linkedin' }
    ];

    contactItems.forEach(item => {
      if (item.value) {
        html += `<div class="contact-item">
          <span class="contact-label">${item.label}:</span>
          <span class="contact-value">${item.value}</span>
        </div>\n`;
      }
    });

    html += '</div>\n</div>\n';
    return html;
  }

  /**
   * Generate summary HTML
   */
  private generateSummaryHTML(data: any): string {
    let html = '<div class="summary">\n';

    if (data.summary) {
      html += `<p class="summary-text">${data.summary}</p>\n`;
    }

    html += '</div>\n';
    return html;
  }

  /**
   * Generate experience HTML
   */
  private generateExperienceHTML(data: any): string {
    let html = '<div class="experience">\n';

    if (Array.isArray(data)) {
      data.forEach((experience: any, index: number) => {
        html += `<div class="experience-item">\n`;
        html += `<h3 class="position">${experience.position}</h3>\n`;
        html += `<h4 class="company">${experience.company} - ${experience.location}</h4>\n`;

        if (experience.startDate) {
          const endDate = experience.current ? 'Present' : experience.endDate;
          html += `<p class="duration">${experience.startDate} - ${endDate}</p>\n`;
        }

        if (experience.description) {
          html += `<div class="description">${experience.description}</div>\n`;
        }

        html += '</div>\n';
      });
    }

    html += '</div>\n';
    return html;
  }

  /**
   * Generate education HTML
   */
  private generateEducationHTML(data: any): string {
    let html = '<div class="education">\n';

    if (Array.isArray(data)) {
      data.forEach((education: any) => {
        html += `<div class="education-item">\n`;
        html += `<h3 class="degree">${education.degree}</h3>\n`;
        html += `<h4 class="institution">${education.institution} - ${education.location}</h4>\n`;

        if (education.graduationYear) {
          html += `<p class="graduation-year">${education.graduationYear}</p>\n`;
        }

        html += '</div>\n';
      });
    }

    html += '</div>\n';
    return html;
  }

  /**
   * Generate skills HTML
   */
  private generateSkillsHTML(data: any): string {
    let html = '<div class="skills">\n';

    if (Array.isArray(data)) {
      html += '<div class="skills-list">\n';
      data.forEach((skill: string) => {
        html += `<span class="skill-item">${skill}</span>\n`;
      });
      html += '</div>\n';
    }

    html += '</div>\n';
    return html;
  }

  /**
   * Generate generic section HTML
   */
  private generateGenericSectionHTML(data: any): string {
    let html = '<div class="generic-section">\n';

    if (typeof data === 'string') {
      html += `<p>${data}</p>\n`;
    } else if (typeof data === 'object' && data !== null) {
      html += '<pre>' + JSON.stringify(data, null, 2) + '</pre>\n';
    }

    html += '</div>\n';
    return html;
  }

  /**
   * Generate CSS from template styling
   */
  private generateCSS(template: ResumeTemplate, customizations?: any): string {
    let css = '/* Generated CSS for ' + template.id + ' */\n\n';

    // Add base styles
    css += this.generateBaseCSS(template);

    // Add layout styles
    css += this.generateLayoutCSS(template.layout);

    // Add typography styles
    css += this.generateTypographyCSS(template.styling.fonts);

    // Add color styles
    css += this.generateColorCSS(template.styling.colors);

    // Add spacing styles
    css += this.generateSpacingCSS(template.layout.spacing);

    return css;
  }

  /**
   * Generate base CSS
   */
  private generateBaseCSS(template: ResumeTemplate): string {
    return `
.resume-template {
  font-family: ${template.styling.fonts.body.name}, ${template.styling.fonts.body.stack.join(', ')};
  line-height: ${template.layout.spacing.line};
  color: ${template.styling.colors.text.primary};
  max-width: 21cm;
  margin: 0 auto;
  padding: 2cm;
  background: ${template.styling.colors.background.primary};
}

.resume-template * {
  box-sizing: border-box;
}

.section {
  margin-bottom: ${template.layout.spacing.section}px;
}

.section-title {
  font-family: ${template.styling.fonts.heading.name}, ${template.styling.fonts.heading.stack.join(', ')};
  font-size: ${template.styling.sizes.heading.h3}px;
  font-weight: ${template.styling.fonts.heading.weights[0]?.weight || 400};
  color: ${template.styling.colors.text.primary};
  margin-bottom: ${template.layout.spacing.item}px;
  border-bottom: 1px solid ${template.styling.colors.border.md || '#e5e5e5'};
  padding-bottom: ${template.layout.spacing.item}px;
}
    `;
  }

  /**
   * Generate layout CSS
   */
  private generateLayoutCSS(layout: any): string {
    return `
/* Layout specific styles */
.template-${layout.format} {
  /* Layout specific styles */
}

.contact-info {
  display: flex;
  flex-wrap: wrap;
  gap: ${layout.spacing.item}px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.experience-item,
.education-item {
  margin-bottom: ${layout.spacing.section}px;
}

.position,
.degree {
  font-weight: 600;
  margin-bottom: 4px;
}

.company,
.institution {
  font-weight: normal;
  font-style: italic;
  margin-bottom: 4px;
}
    `;
  }

  /**
   * Generate typography CSS
   */
  private generateTypographyCSS(fonts: any): string {
    return `
/* Typography styles */
.name {
  font-family: ${fonts.heading.name}, ${fonts.heading.stack.join(', ')};
  font-size: ${fonts.heading.weights.find(w => w.weight === 700)?.weight || 700}px;
  font-weight: 700;
  margin-bottom: 8px;
}

.title {
  font-family: ${fonts.body.name}, ${fonts.body.stack.join(', ')};
  font-size: ${fonts.body.weights.find(w => w.weight === 400)?.weight || 400}px;
  font-weight: 400;
  color: ${fonts.body.weights.find(w => w.weight === 600)?.weight || 600 ? 'inherit' : '#666'};
  margin-bottom: 16px;
}
    `;
  }

  /**
   * Generate color CSS
   */
  private generateColorCSS(colors: any): string {
    return `
/* Color styles */
.section-title {
  color: ${colors.text.primary};
  border-color: ${colors.border.md || '#e5e5e5'};
}

.contact-label {
  color: ${colors.text.secondary};
}

.contact-value {
  color: ${colors.text.primary};
}

a {
  color: ${colors.accent || colors.primary['500']};
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
    `;
  }

  /**
   * Generate spacing CSS
   */
  private generateSpacingCSS(spacing: any): string {
    return `
/* Spacing styles */
h1, h2, h3, h4, h5, h6 {
  margin-top: 0;
  margin-bottom: ${spacing.item}px;
}

p {
  margin-top: 0;
  margin-bottom: ${spacing.item}px;
}

ul, ol {
  margin-top: 0;
  margin-bottom: ${spacing.item}px;
  padding-left: ${spacing.item * 1.5}px;
}

li {
  margin-bottom: ${spacing.line / 2}px;
}
    `;
  }

  /**
   * Generate responsive CSS
   */
  private generateResponsiveCSS(template: ResumeTemplate): string {
    return `
/* Responsive styles */
@media (max-width: ${template.layout.responsiveness.mobile}px) {
  .resume-template {
    padding: 1cm;
    font-size: 14px;
  }

  .contact-info {
    flex-direction: column;
    gap: 8px;
  }
}

@media (max-width: ${template.layout.responsiveness.tablet}px) {
  .resume-template {
    padding: 1.5cm;
  }
}
    `;
  }

  /**
   * Combine multiple CSS strings
   */
  private combineCSS(cssArray: string[]): string {
    return cssArray.filter(css => css && css.trim().length > 0).join('\n\n');
  }

  /**
   * Minify HTML
   */
  private minifyHTML(html: string): string {
    return html
      .replace(/>\s+</g, '><') // Remove whitespace between tags
      .replace(/\s+/g, ' ') // Collapse whitespace
      .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
      .trim();
  }

  /**
   * Minify CSS
   */
  private minifyCSS(css: string): string {
    return css
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
      .replace(/\s*([{}:;,])\s*/g, '$1') // Remove whitespace around symbols
      .replace(/\s+/g, ' ') // Collapse whitespace
      .replace(/;\s*}/g, '}') // Remove unnecessary semicolons
      .trim();
  }

  /**
   * Inline CSS into HTML
   */
  private inlineCSS(html: string, css: string): string {
    const styleTag = `<style>\n${css}\n</style>`;
    return html.replace('</head>', `${styleTag}</head>`);
  }

  /**
   * Compress HTML (basic compression)
   */
  private compressHTML(html: string): string {
    return html; // Placeholder for more advanced compression
  }

  /**
   * Generate JavaScript for template
   */
  private generateJavaScript(template: ResumeTemplate): string {
    return `
// Template JavaScript for ${template.id}
document.addEventListener('DOMContentLoaded', function() {
  // Template initialization code
  console.log('Template ${template.name} loaded');
});
    `;
  }

  /**
   * Identify assets from template
   */
  private identifyAssets(template: ResumeTemplate): any[] {
    const assets: any[] = [];

    // Add preview images
    if (template.preview) {
      assets.push({
        type: 'image',
        url: template.preview.thumbnail,
        name: 'thumbnail'
      });
    }

    return assets;
  }

  /**
   * Generate checksum
   */
  private generateChecksum(content: RenderedContent): string {
    const contentString = JSON.stringify(content);
    let hash = 0;
    for (let i = 0; i < contentString.length; i++) {
      const char = contentString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char) & 0xffffffff;
    }
    return hash.toString(16);
  }

  /**
   * Record performance metric
   */
  private recordPerformanceMetric(stage: string, duration: number): void {
    this.performanceMetrics.set(stage, {
      duration,
      timestamp: Date.now(),
      count: (this.performanceMetrics.get(stage)?.count || 0) + 1
    });
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): Map<string, any> {
    return this.performanceMetrics;
  }

  /**
   * Clear performance metrics
   */
  clearPerformanceMetrics(): void {
    this.performanceMetrics.clear();
  }
}

// Export singleton instance
export const renderingPipeline = new RenderingPipeline();