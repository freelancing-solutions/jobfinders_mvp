/**
 * Template Preview Generator Service
 *
 * Generates preview images and HTML previews for resume templates.
 * Provides thumbnail generation, large previews, and animated previews.
 */

import { ResumeTemplate, Resume, TemplateCustomization } from '@/types/resume';
import { templateService } from './template-service';
import { templateValidator } from './template-validator';

export interface PreviewOptions {
  width?: number;
  height?: number;
  format?: 'png' | 'jpg' | 'webp';
  quality?: number;
  scale?: number;
  includeWatermark?: boolean;
}

export interface PreviewGenerationResult {
  thumbnail: string;     // URL to thumbnail image
  large: string;        // URL to large preview image
  animated?: string;    // URL to animated preview (optional)
  html?: string;        // HTML preview
  generatedAt: Date;
  processingTime: number; // in milliseconds
}

export interface PreviewCacheEntry {
  templateId: string;
  customizationId?: string;
  resumeDataHash: string;
  previews: PreviewGenerationResult;
  expiresAt: Date;
  createdAt: Date;
}

export class TemplatePreviewGenerator {
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private readonly DEFAULT_THUMBNAIL_SIZE = { width: 300, height: 400 };
  private readonly DEFAULT_LARGE_SIZE = { width: 600, height: 800 };
  private readonly PREVIEW_CACHE = new Map<string, PreviewCacheEntry>();

  /**
   * Generate preview images for a template
   */
  async generatePreviews(
    templateId: string,
    resumeData?: Partial<Resume>,
    customization?: TemplateCustomization,
    options: PreviewOptions = {}
  ): Promise<PreviewGenerationResult> {
    const startTime = Date.now();

    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(templateId, customization, resumeData);
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached.previews;
      }

      // Get template
      const template = await templateService.getTemplate(templateId);
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      // Validate template
      const validation = templateValidator.validateTemplate(template);
      if (!validation.isValid) {
        throw new Error(`Template validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      // Create sample resume data if not provided
      const sampleResumeData = resumeData || this.createSampleResumeData();

      // Generate previews
      const previews: PreviewGenerationResult = {
        thumbnail: await this.generateThumbnail(template, sampleResumeData, customization, options),
        large: await this.generateLargePreview(template, sampleResumeData, customization, options),
        animated: await this.generateAnimatedPreview(template, sampleResumeData, customization, options),
        html: await this.generateHTMLPreview(template, sampleResumeData, customization),
        generatedAt: new Date(),
        processingTime: Date.now() - startTime
      };

      // Cache the results
      this.cachePreviews(cacheKey, previews);

      return previews;
    } catch (error) {
      console.error('Failed to generate previews:', error);
      throw new Error(`Preview generation failed: ${error.message}`);
    }
  }

  /**
   * Generate thumbnail preview
   */
  private async generateThumbnail(
    template: ResumeTemplate,
    resumeData: Partial<Resume>,
    customization?: TemplateCustomization,
    options: PreviewOptions = {}
  ): Promise<string> {
    const size = {
      width: options.width || this.DEFAULT_THUMBNAIL_SIZE.width,
      height: options.height || this.DEFAULT_THUMBNAIL_SIZE.height
    };

    // In a real implementation, this would use a headless browser or canvas API
    // to render the template and generate an actual image
    // For now, we'll return a placeholder URL

    const thumbnailUrl = this.generatePlaceholderImage(template.templateId, size, 'thumb');

    return thumbnailUrl;
  }

  /**
   * Generate large preview
   */
  private async generateLargePreview(
    template: ResumeTemplate,
    resumeData: Partial<Resume>,
    customization?: TemplateCustomization,
    options: PreviewOptions = {}
  ): Promise<string> {
    const size = {
      width: options.width || this.DEFAULT_LARGE_SIZE.width,
      height: options.height || this.DEFAULT_LARGE_SIZE.height
    };

    // In a real implementation, this would render the full template
    // and generate a high-quality preview image
    const largePreviewUrl = this.generatePlaceholderImage(template.templateId, size, 'large');

    return largePreviewUrl;
  }

  /**
   * Generate animated preview (optional)
   */
  private async generateAnimatedPreview(
    template: ResumeTemplate,
    resumeData: Partial<Resume>,
    customization?: TemplateCustomization,
    options: PreviewOptions = {}
  ): Promise<string | undefined> {
    // Animated previews are optional and resource-intensive
    // Only generate if specifically requested or for premium templates
    if (!template.isPremium && !options.includeWatermark) {
      return undefined;
    }

    // In a real implementation, this would create a short video or GIF
    // showing the template features, animations, and sections
    const animatedUrl = this.generatePlaceholderAnimation(template.templateId);

    return animatedUrl;
  }

  /**
   * Generate HTML preview
   */
  private async generateHTMLPreview(
    template: ResumeTemplate,
    resumeData: Partial<Resume>,
    customization?: TemplateCustomization
  ): Promise<string> {
    try {
      // Use the template service to generate HTML preview
      const htmlPreview = await templateService.generatePreview(
        template.templateId,
        resumeData,
        customization
      );

      return htmlPreview;
    } catch (error) {
      console.error('Failed to generate HTML preview:', error);
      // Return a basic HTML preview as fallback
      return this.generateBasicHTMLPreview(template, resumeData);
    }
  }

  /**
   * Create sample resume data for preview generation
   */
  private createSampleResumeData(): Partial<Resume> {
    return {
      personalInfo: {
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        phone: '(555) 123-4567',
        location: 'New York, NY',
        linkedin: 'linkedin.com/in/johndoe',
        github: 'github.com/johndoe',
        website: 'johndoe.com'
      },
      summary: 'Experienced software engineer with 5+ years of experience in full-stack development, specializing in React, Node.js, and cloud technologies. Proven track record of delivering high-quality solutions and leading cross-functional teams.',
      experience: [
        {
          id: 'exp1',
          title: 'Senior Software Engineer',
          company: 'Tech Company Inc.',
          location: 'San Francisco, CA',
          startDate: '2020-01',
          endDate: null,
          current: true,
          description: 'Lead development of scalable web applications and mentor junior developers.',
          achievements: [
            'Improved application performance by 40%',
            'Led team of 5 developers on major project',
            'Implemented CI/CD pipeline reducing deployment time by 60%'
          ],
          skills: ['React', 'Node.js', 'AWS', 'PostgreSQL']
        }
      ],
      education: [
        {
          id: 'edu1',
          institution: 'University of Technology',
          degree: 'Bachelor of Science',
          field: 'Computer Science',
          location: 'Boston, MA',
          startDate: '2015-09',
          endDate: '2019-05',
          current: false,
          gpa: 3.8
        }
      ],
      skills: [
        { id: 'skill1', name: 'JavaScript', category: 'technical', level: 'expert' },
        { id: 'skill2', name: 'React', category: 'technical', level: 'expert' },
        { id: 'skill3', name: 'Node.js', category: 'technical', level: 'advanced' },
        { id: 'skill4', name: 'AWS', category: 'technical', level: 'advanced' },
        { id: 'skill5', name: 'PostgreSQL', category: 'technical', level: 'intermediate' }
      ],
      metadata: {
        title: 'Senior Software Engineer Resume',
        description: 'Resume for senior software engineer position',
        experienceLevel: 'senior',
        documentFormat: 'pdf'
      }
    };
  }

  /**
   * Generate placeholder image URL
   */
  private generatePlaceholderImage(
    templateId: string,
    size: { width: number; height: number },
    type: 'thumb' | 'large'
  ): string {
    // In a real implementation, this would generate actual images
    // For now, return a placeholder URL with parameters
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010';
    return `${baseUrl}/api/templates/${templateId}/preview/${type}?width=${size.width}&height=${size.height}`;
  }

  /**
   * Generate placeholder animation URL
   */
  private generatePlaceholderAnimation(templateId: string): string {
    // In a real implementation, this would generate actual animations
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010';
    return `${baseUrl}/api/templates/${templateId}/preview/animated`;
  }

  /**
   * Generate basic HTML preview as fallback
   */
  private generateBasicHTMLPreview(
    template: ResumeTemplate,
    resumeData: Partial<Resume>
  ): string {
    const { personalInfo, summary } = resumeData;

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${template.name} - Preview</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #fff;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .name {
            font-size: 24px;
            font-weight: bold;
            margin: 0;
          }
          .contact {
            margin: 10px 0;
            color: #666;
          }
          .summary {
            margin: 20px 0;
            padding: 15px;
            background: #f8fafc;
            border-radius: 5px;
          }
          .preview-watermark {
            position: fixed;
            bottom: 10px;
            right: 10px;
            color: #ccc;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="name">${personalInfo?.fullName || 'John Doe'}</h1>
          <div class="contact">
            ${personalInfo?.email || 'john.doe@example.com'} •
            ${personalInfo?.phone || '(555) 123-4567'} •
            ${personalInfo?.location || 'New York, NY'}
          </div>
        </div>

        ${summary ? `
          <div class="summary">
            <h2>Professional Summary</h2>
            <p>${summary}</p>
          </div>
        ` : ''}

        <div class="preview-watermark">Preview - ${template.name}</div>
      </body>
      </html>
    `;
  }

  /**
   * Generate cache key for preview results
   */
  private generateCacheKey(
    templateId: string,
    customization?: TemplateCustomization,
    resumeData?: Partial<Resume>
  ): string {
    const customHash = customization ?
      JSON.stringify(customization.colorScheme) + JSON.stringify(customization.typography) :
      '';
    const resumeHash = resumeData ?
      JSON.stringify(resumeData.personalInfo) + JSON.stringify(resumeData.summary) :
      '';

    return `${templateId}_${customHash}_${resumeHash}`.replace(/[^a-zA-Z0-9]/g, '_');
  }

  /**
   * Get previews from cache
   */
  private getFromCache(cacheKey: string): PreviewCacheEntry | null {
    const cached = this.PREVIEW_CACHE.get(cacheKey);
    if (!cached) return null;

    // Check if cache entry has expired
    if (cached.expiresAt < new Date()) {
      this.PREVIEW_CACHE.delete(cacheKey);
      return null;
    }

    return cached;
  }

  /**
   * Cache preview results
   */
  private cachePreviews(cacheKey: string, previews: PreviewGenerationResult): void {
    const cacheEntry: PreviewCacheEntry = {
      templateId: cacheKey.split('_')[0],
      resumeDataHash: cacheKey,
      previews,
      expiresAt: new Date(Date.now() + this.CACHE_TTL),
      createdAt: new Date()
    };

    this.PREVIEW_CACHE.set(cacheKey, cacheEntry);
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    const now = new Date();
    for (const [key, entry] of this.PREVIEW_CACHE.entries()) {
      if (entry.expiresAt < now) {
        this.PREVIEW_CACHE.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    totalEntries: number;
    expiredEntries: number;
    cacheHitRate: number;
  } {
    const now = new Date();
    let expiredCount = 0;

    for (const entry of this.PREVIEW_CACHE.values()) {
      if (entry.expiresAt < now) {
        expiredCount++;
      }
    }

    return {
      totalEntries: this.PREVIEW_CACHE.size,
      expiredEntries: expiredCount,
      cacheHitRate: 0 // This would require tracking hits/misses
    };
  }

  /**
   * Pre-generate previews for all templates
   */
  async generateAllTemplatePreviews(): Promise<void> {
    try {
      const templates = await templateService.getTemplates();

      console.log(`Generating previews for ${templates.length} templates...`);

      const promises = templates.map(async (template) => {
        try {
          await this.generatePreviews(template.templateId);
          console.log(`Generated previews for template: ${template.name}`);
        } catch (error) {
          console.error(`Failed to generate previews for template ${template.name}:`, error);
        }
      });

      await Promise.all(promises);
      console.log('All template previews generated successfully');
    } catch (error) {
      console.error('Failed to generate all template previews:', error);
      throw error;
    }
  }

  /**
   * Update preview for a specific template
   */
  async updateTemplatePreview(templateId: string): Promise<PreviewGenerationResult> {
    // Clear existing cache entries for this template
    for (const [key, entry] of this.PREVIEW_CACHE.entries()) {
      if (entry.templateId === templateId) {
        this.PREVIEW_CACHE.delete(key);
      }
    }

    // Generate new previews
    return await this.generatePreviews(templateId);
  }
}

// Export singleton instance
export const templatePreviewGenerator = new TemplatePreviewGenerator();