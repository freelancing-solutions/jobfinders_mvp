/**
 * Export Service for Resume Templates
 * Supports multiple export formats with quality optimization
 */

import { ResumeTemplate, TemplateCustomization, ExportFormat, ExportOptions } from '@/types/template';
import { TemplateEngineError, TemplateErrorType } from '../errors';
import { TemplateRenderer } from '../rendering-pipeline';

export interface ExportRequest {
  template: ResumeTemplate;
  customization: TemplateCustomization;
  content: any; // Resume content data
  format: ExportFormat;
  options?: ExportOptions;
}

export interface ExportResult {
  success: boolean;
  data?: string | ArrayBuffer;
  filename?: string;
  mimeType?: string;
  error?: string;
  metadata?: {
    size: number;
    format: ExportFormat;
    createdAt: string;
    atsScore?: number;
    pageCount?: number;
  };
}

export class ExportService {
  private static readonly SUPPORTED_FORMATS = {
    PDF: 'application/pdf',
    DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    HTML: 'text/html',
    TXT: 'text/plain',
    JSON: 'application/json'
  } as const;

  private static readonly DEFAULT_OPTIONS: Partial<ExportOptions> = {
    quality: 'high',
    includeAnalytics: false,
    watermark: false,
    compression: true,
    metadata: true
  };

  /**
   * Export resume in specified format
   */
  static async export(request: ExportRequest): Promise<ExportResult> {
    try {
      const options = { ...this.DEFAULT_OPTIONS, ...request.options };
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = this.generateFilename(request.template, request.format, timestamp);

      switch (request.format) {
        case 'PDF':
          return await this.exportToPDF(request, options, filename);
        case 'DOCX':
          return await this.exportToDOCX(request, options, filename);
        case 'HTML':
          return await this.exportToHTML(request, options, filename);
        case 'TXT':
          return await this.exportToTXT(request, options, filename);
        case 'JSON':
          return await this.exportToJSON(request, options, filename);
        default:
          throw new TemplateEngineError(
            TemplateErrorType.VALIDATION_ERROR,
            `Unsupported export format: ${request.format}`,
            { format: request.format }
          );
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown export error'
      };
    }
  }

  /**
   * Get supported export formats
   */
  static getSupportedFormats(): Array<{
    format: ExportFormat;
    mimeType: string;
    description: string;
    features: string[];
  }> {
    return [
      {
        format: 'PDF',
        mimeType: this.SUPPORTED_FORMATS.PDF,
        description: 'Portable Document Format - Best for printing and sharing',
        features: ['Preserves formatting', 'ATS compatible', 'Print optimized', 'Secure']
      },
      {
        format: 'DOCX',
        mimeType: this.SUPPORTED_FORMATS.DOCX,
        description: 'Microsoft Word Document - Easy editing and customization',
        features: ['Editable', 'Track changes', 'Compatible', 'Cross-platform']
      },
      {
        format: 'HTML',
        description: 'Web Page - Online viewing and email compatibility',
        mimeType: this.SUPPORTED_FORMATS.HTML,
        features: ['Responsive', 'Interactive', 'Email friendly', 'SEO optimized']
      },
      {
        format: 'TXT',
        mimeType: this.SUPPORTED_FORMATS.TXT,
        description: 'Plain Text - Maximum ATS compatibility',
        features: ['Universal compatibility', 'Smallest size', 'ATS optimized', 'Simple format']
      },
      {
        format: 'JSON',
        mimeType: this.SUPPORTED_FORMATS.JSON,
        description: 'Data Format - For integration and backup',
        features: ['Structured data', 'API integration', 'Backup', 'Import/Export']
      }
    ];
  }

  /**
   * Preview export before downloading
   */
  static async previewExport(request: ExportRequest): Promise<{
    preview: string;
    format: ExportFormat;
    estimatedSize: number;
    pageCount?: number;
    warnings: string[];
  }> {
    try {
      switch (request.format) {
        case 'HTML':
          const htmlResult = await this.generateHTML(request);
          return {
            preview: htmlResult,
            format: 'HTML',
            estimatedSize: new Blob([htmlResult]).size,
            warnings: this.getExportWarnings(request, 'HTML')
          };
        case 'TXT':
          const txtResult = await this.generateTXT(request);
          return {
            preview: txtResult,
            format: 'TXT',
            estimatedSize: new Blob([txtResult]).size,
            warnings: this.getExportWarnings(request, 'TXT')
          };
        default:
          // For PDF and DOCX, return a preview of the HTML content
          const htmlPreview = await this.generateHTML(request);
          return {
            preview: htmlPreview,
            format: request.format,
            estimatedSize: this.estimateFileSize(request),
            pageCount: this.estimatePageCount(request),
            warnings: this.getExportWarnings(request, request.format)
          };
      }
    } catch (error) {
      throw new TemplateEngineError(
        TemplateErrorType.EXPORT_ERROR,
        'Failed to generate export preview',
        { error: error.message }
      );
    }
  }

  /**
   * Batch export multiple formats
   */
  static async batchExport(
    request: Omit<ExportRequest, 'format'> & { formats: ExportFormat[] }
  ): Promise<ExportResult[]> {
    const results: ExportResult[] = [];

    for (const format of request.formats) {
      const exportRequest = { ...request, format };
      const result = await this.export(exportRequest);
      results.push(result);
    }

    return results;
  }

  /**
   * Validate export request
   */
  static validateExportRequest(request: ExportRequest): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate template
    if (!request.template) {
      errors.push('Template is required');
    }

    // Validate customization
    if (!request.customization) {
      errors.push('Customization is required');
    }

    // Validate content
    if (!request.content) {
      errors.push('Resume content is required');
    }

    // Validate format
    if (!request.format || !Object.keys(this.SUPPORTED_FORMATS).includes(request.format)) {
      errors.push(`Invalid export format: ${request.format}`);
    }

    // Check for large content
    if (request.content && this.isLargeContent(request.content)) {
      warnings.push('Large content detected - export may be slow');
    }

    // Check for ATS compatibility
    if (request.format === 'PDF' && request.options?.quality === 'low') {
      warnings.push('Low quality may affect ATS compatibility');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Private export methods
  private static async exportToPDF(
    request: ExportRequest,
    options: ExportOptions,
    filename: string
  ): Promise<ExportResult> {
    try {
      // Generate HTML content
      const htmlContent = await this.generateHTML(request);

      // For now, we'll create a simple PDF export simulation
      // In a real implementation, you would use a library like Puppeteer or jsPDF
      const pdfData = await this.convertHTMLToPDF(htmlContent, options);

      const metadata = {
        size: pdfData.byteLength,
        format: 'PDF' as ExportFormat,
        createdAt: new Date().toISOString(),
        atsScore: request.template.atsScore,
        pageCount: this.estimatePageCount(request)
      };

      return {
        success: true,
        data: pdfData,
        filename,
        mimeType: this.SUPPORTED_FORMATS.PDF,
        metadata
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'PDF export failed'
      };
    }
  }

  private static async exportToDOCX(
    request: ExportRequest,
    options: ExportOptions,
    filename: string
  ): Promise<ExportResult> {
    try {
      // Generate HTML content first
      const htmlContent = await this.generateHTML(request);

      // Convert HTML to DOCX
      const docxData = await this.convertHTMLToDOCX(htmlContent, options);

      const metadata = {
        size: docxData.byteLength,
        format: 'DOCX' as ExportFormat,
        createdAt: new Date().toISOString(),
        atsScore: request.template.atsScore,
        pageCount: this.estimatePageCount(request)
      };

      return {
        success: true,
        data: docxData,
        filename,
        mimeType: this.SUPPORTED_FORMATS.DOCX,
        metadata
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'DOCX export failed'
      };
    }
  }

  private static async exportToHTML(
    request: ExportRequest,
    options: ExportOptions,
    filename: string
  ): Promise<ExportResult> {
    try {
      const htmlContent = await this.generateHTML(request, options);

      const metadata = {
        size: new Blob([htmlContent]).size,
        format: 'HTML' as ExportFormat,
        createdAt: new Date().toISOString()
      };

      return {
        success: true,
        data: htmlContent,
        filename,
        mimeType: this.SUPPORTED_FORMATS.HTML,
        metadata
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'HTML export failed'
      };
    }
  }

  private static async exportToTXT(
    request: ExportRequest,
    options: ExportOptions,
    filename: string
  ): Promise<ExportResult> {
    try {
      const txtContent = await this.generateTXT(request, options);

      const metadata = {
        size: new Blob([txtContent]).size,
        format: 'TXT' as ExportFormat,
        createdAt: new Date().toISOString()
      };

      return {
        success: true,
        data: txtContent,
        filename,
        mimeType: this.SUPPORTED_FORMATS.TXT,
        metadata
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'TXT export failed'
      };
    }
  }

  private static async exportToJSON(
    request: ExportRequest,
    options: ExportOptions,
    filename: string
  ): Promise<ExportResult> {
    try {
      const jsonData = JSON.stringify({
        template: request.template,
        customization: request.customization,
        content: request.content,
        exportedAt: new Date().toISOString(),
        version: '1.0',
        metadata: options.metadata ? this.generateExportMetadata(request) : undefined
      }, null, 2);

      const metadata = {
        size: new Blob([jsonData]).size,
        format: 'JSON' as ExportFormat,
        createdAt: new Date().toISOString()
      };

      return {
        success: true,
        data: jsonData,
        filename,
        mimeType: this.SUPPORTED_FORMATS.JSON,
        metadata
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'JSON export failed'
      };
    }
  }

  // Content generation methods
  private static async generateHTML(request: ExportRequest, options?: ExportOptions): Promise<string> {
    const renderer = new TemplateRenderer();
    const renderedContent = await renderer.render(request.template, request.content, {
      customization: request.customization,
      format: 'html',
      ...options
    });

    return this.wrapInHTMLDocument(renderedContent, request.template, request.customization, options);
  }

  private static async generateTXT(request: ExportRequest, options?: ExportOptions): Promise<string> {
    const renderer = new TemplateRenderer();
    const renderedContent = await renderer.render(request.template, request.content, {
      customization: request.customization,
      format: 'text',
      ...options
    });

    return this.formatAsPlainText(renderedContent, request.template);
  }

  private static async convertHTMLToPDF(htmlContent: string, options: ExportOptions): Promise<ArrayBuffer> {
    // Simulated PDF conversion
    // In a real implementation, you would use a PDF library
    const htmlBytes = new TextEncoder().encode(htmlContent);

    // Create a simple ArrayBuffer that represents a PDF
    // This is a placeholder - actual PDF generation is complex
    const pdfHeader = new TextEncoder().encode('%PDF-1.4\n');
    const combined = new Uint8Array(pdfHeader.length + htmlBytes.length);
    combined.set(pdfHeader, 0);
    combined.set(htmlBytes, pdfHeader.length);

    return combined.buffer;
  }

  private static async convertHTMLToDOCX(htmlContent: string, options: ExportOptions): Promise<ArrayBuffer> {
    // Simulated DOCX conversion
    // In a real implementation, you would use a library like docx or html-to-docx
    const docxContent = new TextEncoder().encode(htmlContent);
    return docxContent.buffer;
  }

  // Utility methods
  private static generateFilename(template: ResumeTemplate, format: ExportFormat, timestamp: string): string {
    const safeName = template.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    return `${safeName}_resume_${timestamp}.${format.toLowerCase()}`;
  }

  private static wrapInHTMLDocument(
    content: string,
    template: ResumeTemplate,
    customization: TemplateCustomization,
    options?: ExportOptions
  ): string {
    const css = this.generateInlineCSS(template, customization);
    const metadata = options?.metadata ? this.generateMetaTags(template, customization) : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${template.name} - Resume</title>
    <style>
        ${css}
    </style>
    ${metadata}
</head>
<body>
    <div class="resume-container">
        ${content}
    </div>
    ${options?.includeAnalytics ? this.generateAnalyticsScript() : ''}
</body>
</html>`;
  }

  private static generateInlineCSS(template: ResumeTemplate, customization: TemplateCustomization): string {
    return `
        @page {
            margin: 0.5in;
            size: letter;
        }

        body {
            font-family: ${customization.typography.body.fontFamily};
            font-size: ${customization.typography.body.fontSize.normal}pt;
            line-height: ${customization.layout.lineHeight};
            color: ${customization.colorScheme.text};
            background-color: ${customization.colorScheme.background};
            margin: 0;
            padding: ${customization.layout.margins.top}in ${customization.layout.margins.right}in ${customization.layout.margins.bottom}in ${customization.layout.margins.left}in;
        }

        .resume-container {
            max-width: 8.5in;
            margin: 0 auto;
        }

        h1, h2, h3, h4 {
            font-family: ${customization.typography.heading.fontFamily};
            font-weight: ${customization.typography.heading.fontWeight};
            color: ${customization.colorScheme.primary};
            margin-top: ${customization.layout.sectionSpacing.before}pt;
            margin-bottom: ${customization.layout.sectionSpacing.after}pt;
        }

        h1 { font-size: ${customization.typography.heading.fontSize.h1}pt; }
        h2 { font-size: ${customization.typography.heading.fontSize.h2}pt; }
        h3 { font-size: ${customization.typography.heading.fontSize.h3}pt; }
        h4 { font-size: ${customization.typography.heading.fontSize.h4}pt; }

        .section {
            margin-bottom: ${customization.layout.sectionSpacing.after}pt;
            page-break-inside: avoid;
        }

        .item {
            margin-bottom: ${customization.layout.itemSpacing}pt;
        }

        .contact-info {
            font-size: ${customization.typography.body.fontSize.small}pt;
            color: ${customization.colorScheme.muted};
            border-bottom: 1px solid ${customization.colorScheme.border};
            padding-bottom: 10pt;
            margin-bottom: ${customization.layout.sectionSpacing.before}pt;
        }

        .skills-list {
            display: flex;
            flex-wrap: wrap;
            gap: 8pt;
        }

        .skill-item {
            background-color: ${customization.colorScheme.highlight};
            padding: 4pt 8pt;
            border-radius: 3pt;
            font-size: ${customization.typography.body.fontSize.small}pt;
        }

        @media print {
            body { margin: 0; }
            .section { page-break-inside: avoid; }
            .item { page-break-inside: avoid; }
        }
    `;
  }

  private static formatAsPlainText(content: string, template: ResumeTemplate): string {
    // Remove HTML tags and format as plain text
    return content
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n\n');
  }

  private static generateMetaTags(template: ResumeTemplate, customization: TemplateCustomization): string {
    return `
        <meta name="generator" content="Resume Builder Template Engine">
        <meta name="template" content="${template.id}">
        <meta name="template-name" content="${template.name}">
        <meta name="generated" content="${new Date().toISOString()}">
        <meta name="ats-score" content="${template.atsScore}">
    `;
  }

  private static generateAnalyticsScript(): string {
    return `
        <script>
            // Analytics tracking for resume views
            if (typeof gtag !== 'undefined') {
                gtag('event', 'resume_view', {
                    'template_name': '${template.name}',
                    'ats_score': '${template.atsScore}'
                });
            }
        </script>
    `;
  }

  private static generateExportMetadata(request: ExportRequest): any {
    return {
      templateId: request.template.id,
      templateName: request.template.name,
      atsScore: request.template.atsScore,
      customizationId: request.customization.id,
      exportedAt: new Date().toISOString(),
      format: request.format,
      options: request.options
    };
  }

  private static estimateFileSize(request: ExportRequest): number {
    const baseSize = 50000; // 50KB base size
    const contentMultiplier = JSON.stringify(request.content).length * 0.5;

    switch (request.format) {
      case 'PDF':
        return Math.round(baseSize + contentMultiplier * 2);
      case 'DOCX':
        return Math.round(baseSize + contentMultiplier * 1.5);
      case 'HTML':
        return Math.round(baseSize + contentMultiplier);
      case 'TXT':
        return Math.round(baseSize * 0.3 + contentMultiplier * 0.2);
      case 'JSON':
        return Math.round(baseSize * 0.5 + contentMultiplier);
      default:
        return baseSize;
    }
  }

  private static estimatePageCount(request: ExportRequest): number {
    // Rough estimate based on content length
    const contentLength = JSON.stringify(request.content).length;
    const avgWordsPerPage = 500;
    const avgCharsPerWord = 5;
    const estimatedPages = Math.ceil(contentLength / (avgWordsPerPage * avgCharsPerWord));

    return Math.max(1, Math.min(estimatedPages, 3)); // Cap at 3 pages
  }

  private static isLargeContent(content: any): boolean {
    return JSON.stringify(content).length > 10000; // 10KB threshold
  }

  private static getExportWarnings(request: ExportRequest, format: ExportFormat): string[] {
    const warnings: string[] = [];

    if (request.template.atsScore < 90) {
      warnings.push(`Template has ATS score of ${request.template.atsScore} - may not be optimal for ATS systems`);
    }

    if (format === 'PDF' && request.options?.quality === 'low') {
      warnings.push('Low quality export may affect readability and ATS compatibility');
    }

    if (format === 'HTML' && !request.options?.compression) {
      warnings.push('Uncompressed HTML will result in larger file size');
    }

    if (request.options?.watermark) {
      warnings.push('Watermark will be added to exported document');
    }

    return warnings;
  }
}