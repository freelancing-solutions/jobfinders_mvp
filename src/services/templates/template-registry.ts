/**
 * Template Registry Service
 *
 * Central registry for managing resume templates. Handles template registration,
 * retrieval, searching, filtering, and metadata management.
 */

import { ResumeTemplate, TemplateCategory, TemplateFeatures } from '@/types/resume';
import { prisma } from '@/lib/prisma';
import { templateValidator } from './template-validator';
import { templatePreviewGenerator } from './template-preview-generator';

export interface TemplateFilters {
  category?: TemplateCategory | string;
  subcategory?: string;
  features?: string[];
  atsOptimized?: boolean;
  mobileOptimized?: boolean;
  premium?: boolean;
  isActive?: boolean;
  minRating?: number;
  search?: string;
  sortBy?: 'name' | 'rating' | 'downloads' | 'created' | 'updated';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface TemplateRegistrationResult {
  success: boolean;
  templateId?: string;
  errors?: string[];
  warnings?: string[];
}

export interface TemplateStats {
  totalTemplates: number;
  activeTemplates: number;
  premiumTemplates: number;
  freeTemplates: number;
  averageRating: number;
  totalDownloads: number;
  categoryDistribution: Record<string, number>;
}

export class TemplateRegistry {
  private readonly DEFAULT_PAGE_SIZE = 20;
  private readonly MAX_SEARCH_RESULTS = 100;

  /**
   * Register a new template in the registry
   */
  async registerTemplate(template: ResumeTemplate): Promise<TemplateRegistrationResult> {
    try {
      // Validate template before registration
      const validation = templateValidator.validateTemplate(template);
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors.map(e => e.message)
        };
      }

      // Check if template already exists
      const existingTemplate = await prisma.resumeTemplate.findUnique({
        where: { templateId: template.templateId }
      });

      if (existingTemplate) {
        return {
          success: false,
          errors: ['Template with this ID already exists']
        };
      }

      // Generate previews for the template
      const previews = await templatePreviewGenerator.generatePreviews(template.templateId);

      // Create template in database
      const createdTemplate = await prisma.resumeTemplate.create({
        data: {
          templateId: template.templateId,
          name: template.name,
          description: template.description,
          category: template.category,
          subcategory: template.subcategory,
          previewUrl: previews.thumbnail,
          largePreviewUrl: previews.large,
          animatedPreviewUrl: previews.animated,
          layout: template.layout as any,
          styling: template.styling as any,
          sections: template.sections as any,
          features: template.features as any,
          atsOptimization: template.atsOptimization as any,
          customization: template.customization as any,
          metadata: {
            ...template.metadata,
            ...{
              downloads: template.metadata.downloadCount || 0,
              rating: template.metadata.rating || 0,
              reviews: template.metadata.reviewCount || 0
            }
          } as any,
          isActive: template.isActive !== false,
          isPremium: template.isPremium || false,
          version: template.version || '1.0.0',
          author: template.author,
          license: template.license,
          downloadCount: template.metadata.downloadCount || 0,
          rating: template.metadata.rating || 0,
          reviewCount: template.metadata.reviewCount || 0
        }
      });

      return {
        success: true,
        templateId: createdTemplate.templateId,
        warnings: validation.warnings.map(w => w.message)
      };
    } catch (error) {
      console.error('Failed to register template:', error);
      return {
        success: false,
        errors: [`Registration failed: ${error.message}`]
      };
    }
  }

  /**
   * Update an existing template
   */
  async updateTemplate(
    templateId: string,
    updates: Partial<ResumeTemplate>
  ): Promise<TemplateRegistrationResult> {
    try {
      // Get existing template
      const existingTemplate = await prisma.resumeTemplate.findUnique({
        where: { templateId }
      });

      if (!existingTemplate) {
        return {
          success: false,
          errors: ['Template not found']
        };
      }

      // Merge with existing template data
      const updatedTemplateData = { ...existingTemplate, ...updates };

      // Validate updated template
      const validation = templateValidator.validateTemplate(updatedTemplateData as ResumeTemplate);
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors.map(e => e.message)
        };
      }

      // Update template in database
      const updatedTemplate = await prisma.resumeTemplate.update({
        where: { templateId },
        data: {
          ...(updates.name && { name: updates.name }),
          ...(updates.description && { description: updates.description }),
          ...(updates.category && { category: updates.category }),
          ...(updates.subcategory && { subcategory: updates.subcategory }),
          ...(updates.layout && { layout: updates.layout as any }),
          ...(updates.styling && { styling: updates.styling as any }),
          ...(updates.sections && { sections: updates.sections as any }),
          ...(updates.features && { features: updates.features as any }),
          ...(updates.atsOptimization && { atsOptimization: updates.atsOptimization as any }),
          ...(updates.customization && { customization: updates.customization as any }),
          ...(updates.isActive !== undefined && { isActive: updates.isActive }),
          ...(updates.isPremium !== undefined && { isPremium: updates.isPremium }),
          ...(updates.version && { version: updates.version }),
          ...(updates.author && { author: updates.author }),
          ...(updates.license && { license: updates.license }),
          updatedAt: new Date()
        }
      });

      // Regenerate previews if layout or styling changed
      if (updates.layout || updates.styling) {
        await templatePreviewGenerator.updateTemplatePreview(templateId);
      }

      return {
        success: true,
        templateId: updatedTemplate.templateId,
        warnings: validation.warnings.map(w => w.message)
      };
    } catch (error) {
      console.error('Failed to update template:', error);
      return {
        success: false,
        errors: [`Update failed: ${error.message}`]
      };
    }
  }

  /**
   * Get a specific template by ID
   */
  async getTemplate(templateId: string): Promise<ResumeTemplate | null> {
    try {
      const template = await prisma.resumeTemplate.findUnique({
        where: { templateId }
      });

      if (!template) return null;

      return this.convertPrismaTemplateToResumeTemplate(template);
    } catch (error) {
      console.error(`Failed to get template ${templateId}:`, error);
      return null;
    }
  }

  /**
   * List templates with optional filtering
   */
  async listTemplates(filters: TemplateFilters = {}): Promise<ResumeTemplate[]> {
    try {
      const whereClause: any = {};

      // Apply filters
      if (filters.category) {
        whereClause.category = filters.category;
      }

      if (filters.subcategory) {
        whereClause.subcategory = filters.subcategory;
      }

      if (filters.isActive !== undefined) {
        whereClause.isActive = filters.isActive;
      }

      if (filters.premium !== undefined) {
        whereClause.isPremium = filters.premium;
      }

      if (filters.minRating) {
        whereClause.rating = { gte: filters.minRating };
      }

      if (filters.search) {
        whereClause.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
          { subcategory: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      // Build order clause
      const orderBy: any = {};
      const sortBy = filters.sortBy || 'created';
      const sortOrder = filters.sortOrder || 'desc';

      switch (sortBy) {
        case 'name':
          orderBy.name = sortOrder;
          break;
        case 'rating':
          orderBy.rating = sortOrder;
          break;
        case 'downloads':
          orderBy.downloadCount = sortOrder;
          break;
        case 'updated':
          orderBy.updatedAt = sortOrder;
          break;
        case 'created':
        default:
          orderBy.createdAt = sortOrder;
          break;
      }

      // Apply pagination
      const take = Math.min(filters.limit || this.DEFAULT_PAGE_SIZE, this.MAX_SEARCH_RESULTS);
      const skip = filters.offset || 0;

      const templates = await prisma.resumeTemplate.findMany({
        where: whereClause,
        orderBy,
        take,
        skip
      });

      return templates.map(this.convertPrismaTemplateToResumeTemplate);
    } catch (error) {
      console.error('Failed to list templates:', error);
      return [];
    }
  }

  /**
   * Search templates by query
   */
  async searchTemplates(query: string, limit: number = 20): Promise<ResumeTemplate[]> {
    return this.listTemplates({
      search: query,
      limit,
      sortBy: 'rating',
      sortOrder: 'desc'
    });
  }

  /**
   * Get templates by category
   */
  async getTemplatesByCategory(category: TemplateCategory | string): Promise<ResumeTemplate[]> {
    return this.listTemplates({
      category,
      sortBy: 'rating',
      sortOrder: 'desc'
    });
  }

  /**
   * Get featured templates
   */
  async getFeaturedTemplates(limit: number = 6): Promise<ResumeTemplate[]> {
    return this.listTemplates({
      isActive: true,
      limit,
      sortBy: 'rating',
      sortOrder: 'desc'
    });
  }

  /**
   * Get popular templates (by downloads)
   */
  async getPopularTemplates(limit: number = 10): Promise<ResumeTemplate[]> {
    return this.listTemplates({
      isActive: true,
      limit,
      sortBy: 'downloads',
      sortOrder: 'desc'
    });
  }

  /**
   * Get new templates
   */
  async getNewTemplates(limit: number = 10): Promise<ResumeTemplate[]> {
    return this.listTemplates({
      isActive: true,
      limit,
      sortBy: 'created',
      sortOrder: 'desc'
    });
  }

  /**
   * Get premium templates
   */
  async getPremiumTemplates(limit: number = 20): Promise<ResumeTemplate[]> {
    return this.listTemplates({
      premium: true,
      isActive: true,
      limit,
      sortBy: 'rating',
      sortOrder: 'desc'
    });
  }

  /**
   * Get free templates
   */
  async getFreeTemplates(limit: number = 20): Promise<ResumeTemplate[]> {
    return this.listTemplates({
      premium: false,
      isActive: true,
      limit,
      sortBy: 'rating',
      sortOrder: 'desc'
    });
  }

  /**
   * Unregister (delete) a template
   */
  async unregisterTemplate(templateId: string): Promise<boolean> {
    try {
      const result = await prisma.resumeTemplate.delete({
        where: { templateId }
      });

      return !!result;
    } catch (error) {
      console.error(`Failed to unregister template ${templateId}:`, error);
      return false;
    }
  }

  /**
   * Get template statistics
   */
  async getTemplateStats(): Promise<TemplateStats> {
    try {
      const [
        totalTemplates,
        activeTemplates,
        premiumTemplates,
        averageRating,
        totalDownloads
      ] = await Promise.all([
        prisma.resumeTemplate.count(),
        prisma.resumeTemplate.count({ where: { isActive: true } }),
        prisma.resumeTemplate.count({ where: { isPremium: true } }),
        prisma.resumeTemplate.aggregate({
          _avg: { rating: true }
        }),
        prisma.resumeTemplate.aggregate({
          _sum: { downloadCount: true }
        })
      ]);

      // Get category distribution
      const categoryDistribution = await prisma.resumeTemplate.groupBy({
        by: ['category'],
        _count: true
      });

      const distribution: Record<string, number> = {};
      categoryDistribution.forEach(item => {
        distribution[item.category] = item._count;
      });

      return {
        totalTemplates,
        activeTemplates,
        premiumTemplates,
        freeTemplates: totalTemplates - premiumTemplates,
        averageRating: averageRating._avg.rating || 0,
        totalDownloads: totalDownloads._sum.downloadCount || 0,
        categoryDistribution: distribution
      };
    } catch (error) {
      console.error('Failed to get template stats:', error);
      return {
        totalTemplates: 0,
        activeTemplates: 0,
        premiumTemplates: 0,
        freeTemplates: 0,
        averageRating: 0,
        totalDownloads: 0,
        categoryDistribution: {}
      };
    }
  }

  /**
   * Increment template download count
   */
  async incrementDownloadCount(templateId: string): Promise<void> {
    try {
      await prisma.resumeTemplate.update({
        where: { templateId },
        data: {
          downloadCount: { increment: 1 }
        }
      });
    } catch (error) {
      console.error(`Failed to increment download count for template ${templateId}:`, error);
    }
  }

  /**
   * Add or update template rating
   */
  async updateTemplateRating(templateId: string, rating: number): Promise<void> {
    try {
      // Get current rating data
      const template = await prisma.resumeTemplate.findUnique({
        where: { templateId }
      });

      if (!template) return;

      // Calculate new average rating
      const newRatingCount = template.reviewCount + 1;
      const newAverageRating = ((template.rating * template.reviewCount) + rating) / newRatingCount;

      await prisma.resumeTemplate.update({
        where: { templateId },
        data: {
          rating: newAverageRating,
          reviewCount: newRatingCount
        }
      });
    } catch (error) {
      console.error(`Failed to update rating for template ${templateId}:`, error);
    }
  }

  /**
   * Get template categories
   */
  async getCategories(): Promise<string[]> {
    try {
      const categories = await prisma.resumeTemplate.findMany({
        select: { category: true },
        distinct: ['category']
      });

      return categories.map(c => c.category);
    } catch (error) {
      console.error('Failed to get categories:', error);
      return [];
    }
  }

  /**
   * Get subcategories for a category
   */
  async getSubcategories(category: string): Promise<string[]> {
    try {
      const subcategories = await prisma.resumeTemplate.findMany({
        where: { category },
        select: { subcategory: true },
        distinct: ['subcategory']
      });

      return subcategories
        .map(s => s.subcategory)
        .filter(Boolean) as string[];
    } catch (error) {
      console.error(`Failed to get subcategories for category ${category}:`, error);
      return [];
    }
  }

  /**
   * Check if template exists
   */
  async templateExists(templateId: string): Promise<boolean> {
    try {
      const template = await prisma.resumeTemplate.findUnique({
        where: { templateId },
        select: { templateId: true }
      });

      return !!template;
    } catch (error) {
      console.error(`Failed to check if template exists ${templateId}:`, error);
      return false;
    }
  }

  // Private helper methods

  private convertPrismaTemplateToResumeTemplate(prismaTemplate: any): ResumeTemplate {
    return {
      templateId: prismaTemplate.templateId,
      name: prismaTemplate.name,
      description: prismaTemplate.description,
      category: prismaTemplate.category,
      subcategory: prismaTemplate.subcategory,
      previewUrl: prismaTemplate.previewUrl,
      largePreviewUrl: prismaTemplate.largePreviewUrl,
      animatedPreviewUrl: prismaTemplate.animatedPreviewUrl,
      layout: prismaTemplate.layout,
      styling: prismaTemplate.styling,
      sections: prismaTemplate.sections,
      features: prismaTemplate.features,
      atsOptimization: prismaTemplate.atsOptimization,
      customization: prismaTemplate.customization,
      metadata: {
        ...prismaTemplate.metadata,
        downloadCount: prismaTemplate.downloadCount || 0,
        rating: prismaTemplate.rating || 0,
        reviewCount: prismaTemplate.reviewCount || 0
      },
      isActive: prismaTemplate.isActive,
      isPremium: prismaTemplate.isPremium,
      version: prismaTemplate.version,
      author: prismaTemplate.author,
      license: prismaTemplate.license
    };
  }
}

// Export singleton instance
export const templateRegistry = new TemplateRegistry();