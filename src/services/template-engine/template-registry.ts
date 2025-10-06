/**
 * Template Registry Service
 *
 * Manages the collection of available resume templates,
 * including registration, lookup, search, and filtering functionality.
 */

import { ResumeTemplate, TemplateCategory, TemplateFilters, TemplateSystemConfig } from '@/types/template';
import { TemplateEngineErrorFactory } from './errors';
import { TemplateCache } from './template-cache';
import { TemplateValidator } from './template-validator';

export interface TemplateSearchIndex {
  [key: string]: Set<string>; // keyword -> template IDs
}

export interface TemplateStats {
  totalTemplates: number;
  categoryCounts: Record<TemplateCategory, number>;
  latestAdded: string[];
  mostPopular: string[];
  recentlyUpdated: string[];
}

export class TemplateRegistry {
  private templates: Map<string, ResumeTemplate> = new Map();
  private searchIndex: TemplateSearchIndex = {};
  private stats: TemplateStats;
  private cache: TemplateCache;
  private validator: TemplateValidator;
  private config: TemplateSystemConfig;

  constructor(config: TemplateSystemConfig) {
    this.config = config;
    this.cache = new TemplateCache(config.defaultCacheSize);
    this.validator = new TemplateValidator();
    this.stats = this.initializeStats();
  }

  /**
   * Register a new template in the registry
   */
  register(template: ResumeTemplate): void {
    try {
      // Validate template
      const validation = this.validator.validate(template);
      if (!validation.isValid) {
        throw TemplateEngineErrorFactory.validationFailed(
          `Template validation failed: ${validation.errors.map(e => e.message).join(', ')}`
        );
      }

      // Check if template already exists
      if (this.templates.has(template.id)) {
        throw TemplateEngineErrorFactory.templateAlreadyExists(template.id);
      }

      // Register template
      this.templates.set(template.id, template);

      // Update search index
      this.updateSearchIndex(template);

      // Update stats
      this.updateStats(template, 'register');

      // Clear cache since registry changed
      this.cache.clear();

      console.log(`Template registered: ${template.name} (${template.id})`);
    } catch (error) {
      if (error instanceof TemplateEngineError) {
        throw error;
      }
      throw TemplateEngineErrorFactory.registrationFailed(error instanceof Error ? error : new Error('Unknown registration error'));
    }
  }

  /**
   * Unregister a template from the registry
   */
  unregister(templateId: string): boolean {
    try {
      const template = this.templates.get(templateId);
      if (!template) {
        return false;
      }

      // Remove from registry
      this.templates.delete(templateId);

      // Update search index
      this.removeFromSearchIndex(templateId);

      // Update stats
      this.updateStats(template, 'unregister');

      // Clear cache
      this.cache.clear();

      console.log(`Template unregistered: ${template.name} (${templateId})`);
      return true;
    } catch (error) {
      console.error(`Error unregistering template ${templateId}:`, error);
      return false;
    }
  }

  /**
   * Get a specific template by ID
   */
  get(templateId: string): ResumeTemplate | null {
    // Check cache first
    const cached = this.cache.get(templateId);
    if (cached) {
      return cached;
    }

    const template = this.templates.get(templateId);
    if (template) {
      // Cache the template
      this.cache.set(templateId, template);
    }

    return template || null;
  }

  /**
   * List all templates with optional filtering
   */
  list(filters?: TemplateFilters): ResumeTemplate[] {
    let templates = Array.from(this.templates.values());

    // Apply filters
    if (filters) {
      templates = this.applyFilters(templates, filters);
    }

    // Sort by default order (name, then category)
    templates.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.name.localeCompare(b.name);
    });

    return templates;
  }

  /**
   * Search templates by query string
   */
  search(query: string): ResumeTemplate[] {
    if (!query || query.trim().length === 0) {
      return this.list();
    }

    const normalizedQuery = query.toLowerCase().trim();
    const matchingIds = new Set<string>();

    // Search in index
    const terms = normalizedQuery.split(/\s+/);
    for (const term of terms) {
      if (this.searchIndex[term]) {
        for (const templateId of this.searchIndex[term]) {
          matchingIds.add(templateId);
        }
      }
    }

    // Convert IDs to templates
    const results: ResumeTemplate[] = [];
    for (const templateId of matchingIds) {
      const template = this.get(templateId);
      if (template) {
        results.push(template);
      }
    }

    // Sort by relevance (more matching terms = higher relevance)
    results.sort((a, b) => {
      const aScore = this.calculateRelevanceScore(a, terms);
      const bScore = this.calculateRelevanceScore(b, terms);
      return bScore - aScore;
    });

    return results;
  }

  /**
   * Get templates by category
   */
  getByCategory(category: TemplateCategory): ResumeTemplate[] {
    return this.list({ category });
  }

  /**
   * Get popular templates
   */
  getPopular(limit: number = 10): ResumeTemplate[] {
    const popular = this.stats.mostPopular
      .map(id => this.get(id))
      .filter(Boolean) as ResumeTemplate[]
      .slice(0, limit);

    return popular;
  }

  /**
   * Get recently added templates
   */
  getRecentlyAdded(limit: number = 10): ResumeTemplate[] {
    const recent = this.stats.latestAdded
      .map(id => this.get(id))
      .filter(Boolean) as ResumeTemplate[]
      .slice(0, limit);

    return recent;
  }

  /**
   * Get recently updated templates
   */
  getRecentlyUpdated(limit: number = 10): ResumeTemplate[] {
    const updated = this.stats.recentlyUpdated
      .map(id => this.get(id))
      .filter(Boolean) as ResumeTemplate[]
      .slice(0, limit);

    return updated;
  }

  /**
   * Get template statistics
   */
  getStats(): TemplateStats {
    return { ...this.stats };
  }

  /**
   * Check if a template exists
   */
  exists(templateId: string): boolean {
    return this.templates.has(templateId);
  }

  /**
   * Get count of templates
   */
  count(): number {
    return this.templates.size;
  }

  /**
   * Get available categories
   */
  getCategories(): TemplateCategory[] {
    return Object.values(TemplateCategory);
  }

  /**
   * Get subcategories for a category
   */
  getSubcategories(category: TemplateCategory): string[] {
    const subcategories = new Set<string>();

    for (const template of this.templates.values()) {
      if (template.category === category && template.subcategory) {
        subcategories.add(template.subcategory);
      }
    }

    return Array.from(subcategories).sort();
  }

  /**
   * Bulk register templates
   */
  bulkRegister(templates: ResumeTemplate[]): { success: string[], failed: { id: string, error: string }[] } {
    const success: string[] = [];
    const failed: { id: string, error: string }[] = [];

    for (const template of templates) {
      try {
        this.register(template);
        success.push(template.id);
      } catch (error) {
        failed.push({
          id: template.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return { success, failed };
  }

  /**
   * Bulk unregister templates
   */
  bulkUnregister(templateIds: string[]): { success: string[], failed: string[] } {
    const success: string[] = [];
    const failed: string[] = [];

    for (const templateId of templateIds) {
      if (this.unregister(templateId)) {
        success.push(templateId);
      } else {
        failed.push(templateId);
      }
    }

    return { success, failed };
  }

  /**
   * Clear all templates from registry
   */
  clear(): void {
    this.templates.clear();
    this.searchIndex = {};
    this.cache.clear();
    this.stats = this.initializeStats();
    console.log('Template registry cleared');
  }

  /**
   * Rebuild search index
   */
  rebuildSearchIndex(): void {
    this.searchIndex = {};
    for (const template of this.templates.values()) {
      this.updateSearchIndex(template);
    }
    console.log('Search index rebuilt');
  }

  /**
   * Get registry health status
   */
  getHealthStatus(): RegistryHealthStatus {
    return {
      templateCount: this.templates.size,
      searchIndexSize: Object.keys(this.searchIndex).length,
      cacheSize: this.cache.size(),
      memoryUsage: this.estimateMemoryUsage(),
      lastUpdated: new Date(),
      status: this.getHealthStatusLevel()
    };
  }

  // Private methods

  private initializeStats(): TemplateStats {
    return {
      totalTemplates: 0,
      categoryCounts: {
        [TemplateCategory.PROFESSIONAL]: 0,
        [TemplateCategory.MODERN]: 0,
        [TemplateCategory.INDUSTRY_SPECIFIC]: 0,
        [TemplateCategory.ACADEMIC]: 0,
        [TemplateCategory.CREATIVE]: 0
      },
      latestAdded: [],
      mostPopular: [],
      recentlyUpdated: []
    };
  }

  private updateSearchIndex(template: ResumeTemplate): void {
    const keywords = this.extractKeywords(template);

    for (const keyword of keywords) {
      if (!this.searchIndex[keyword]) {
        this.searchIndex[keyword] = new Set();
      }
      this.searchIndex[keyword].add(template.id);
    }
  }

  private removeFromSearchIndex(templateId: string): void {
    for (const keyword in this.searchIndex) {
      this.searchIndex[keyword].delete(templateId);
      if (this.searchIndex[keyword].size === 0) {
        delete this.searchIndex[keyword];
      }
    }
  }

  private extractKeywords(template: ResumeTemplate): string[] {
    const keywords: string[] = [];

    // Add template name words
    keywords.push(...template.name.toLowerCase().split(/\s+/));

    // Add description words
    keywords.push(...template.description.toLowerCase().split(/\s+/));

    // Add category
    keywords.push(template.category);

    // Add subcategory
    if (template.subcategory) {
      keywords.push(template.subcategory.toLowerCase());
    }

    // Add tags
    keywords.push(...template.metadata.tags.map(tag => tag.toLowerCase()));

    // Add features
    if (template.features.atsOptimized) keywords.push('ats', 'optimized');
    if (template.features.mobileOptimized) keywords.push('mobile', 'responsive');
    if (template.features.printOptimized) keywords.push('print');
    if (template.features.accessibilityFeatures.wcagCompliant) keywords.push('accessible', 'wcag');

    // Filter and deduplicate
    return keywords
      .filter(keyword => keyword.length > 2) // Remove very short words
      .filter((keyword, index, arr) => arr.indexOf(keyword) === index); // Remove duplicates
  }

  private calculateRelevanceScore(template: ResumeTemplate, searchTerms: string[]): number {
    let score = 0;
    const templateText = [
      template.name,
      template.description,
      template.category,
      template.subcategory || '',
      ...template.metadata.tags
    ].join(' ').toLowerCase();

    for (const term of searchTerms) {
      // Exact match in name gets highest score
      if (template.name.toLowerCase().includes(term)) {
        score += 10;
      }

      // Category match
      if (template.category.includes(term)) {
        score += 5;
      }

      // Subcategory match
      if (template.subcategory && template.subcategory.toLowerCase().includes(term)) {
        score += 5;
      }

      // Tag match
      if (template.metadata.tags.some(tag => tag.toLowerCase().includes(term))) {
        score += 3;
      }

      // Description match
      if (template.description.toLowerCase().includes(term)) {
        score += 2;
      }

      // Partial match
      if (templateText.includes(term)) {
        score += 1;
      }
    }

    return score;
  }

  private applyFilters(templates: ResumeTemplate[], filters: TemplateFilters): ResumeTemplate[] {
    return templates.filter(template => {
      // Category filter
      if (filters.category && template.category !== filters.category) {
        return false;
      }

      // Subcategory filter
      if (filters.subcategory && template.subcategory !== filters.subcategory) {
        return false;
      }

      // Features filter
      if (filters.features && filters.features.length > 0) {
        const templateFeatures = this.getTemplateFeatures(template);
        const hasAllFeatures = filters.features.every(feature =>
          templateFeatures.includes(feature)
        );
        if (!hasAllFeatures) {
          return false;
        }
      }

      // ATS optimization filter
      if (filters.atsOptimized !== undefined &&
          template.features.atsOptimized !== filters.atsOptimized) {
        return false;
      }

      // Mobile optimization filter
      if (filters.mobileOptimized !== undefined &&
          template.features.mobileOptimized !== filters.mobileOptimized) {
        return false;
      }

      // Premium filter
      if (filters.premium !== undefined) {
        const isPremium = template.metadata.license.type !== 'free';
        if (isPremium !== filters.premium) {
          return false;
        }
      }

      return true;
    });
  }

  private getTemplateFeatures(template: ResumeTemplate): string[] {
    const features: string[] = [];

    if (template.features.atsOptimized) features.push('ats-optimized');
    if (template.features.mobileOptimized) features.push('mobile-optimized');
    if (template.features.printOptimized) features.push('print-optimized');
    if (template.features.accessibilityFeatures.wcagCompliant) features.push('wcag-compliant');
    if (template.features.interactiveFeatures.livePreview) features.push('live-preview');
    if (template.features.interactiveFeatures.realTimeUpdates) features.push('real-time-updates');
    if (template.features.premiumFeatures.advancedCustomization) features.push('advanced-customization');

    return features;
  }

  private updateStats(template: ResumeTemplate, action: 'register' | 'unregister'): void {
    const multiplier = action === 'register' ? 1 : -1;

    // Update total count
    this.stats.totalTemplates += multiplier;

    // Update category count
    this.stats.categoryCounts[template.category] += multiplier;

    // Update latest added
    if (action === 'register') {
      this.stats.latestAdded.unshift(template.id);
      if (this.stats.latestAdded.length > 20) {
        this.stats.latestAdded.pop();
      }
    } else {
      const index = this.stats.latestAdded.indexOf(template.id);
      if (index > -1) {
        this.stats.latestAdded.splice(index, 1);
      }
    }

    // Update recently updated
    if (action === 'register') {
      this.stats.recentlyUpdated.unshift(template.id);
      if (this.stats.recentlyUpdated.length > 20) {
        this.stats.recentlyUpdated.pop();
      }
    } else {
      const index = this.stats.recentlyUpdated.indexOf(template.id);
      if (index > -1) {
        this.stats.recentlyUpdated.splice(index, 1);
      }
    }

    // Update most popular (simplified - would use actual usage data)
    if (action === 'register') {
      this.stats.mostPopular.push(template.id);
      this.stats.mostPopular.sort((a, b) => {
        const templateA = this.templates.get(a);
        const templateB = this.templates.get(b);
        return (templateB?.metadata.downloads || 0) - (templateA?.metadata.downloads || 0);
      });

      if (this.stats.mostPopular.length > 50) {
        this.stats.mostPopular = this.stats.mostPopular.slice(0, 50);
      }
    } else {
      const index = this.stats.mostPopular.indexOf(template.id);
      if (index > -1) {
        this.stats.mostPopular.splice(index, 1);
      }
    }
  }

  private estimateMemoryUsage(): number {
    let totalSize = 0;

    for (const template of this.templates.values()) {
      // Rough estimation: each template takes about 1KB in memory
      totalSize += 1024;
    }

    // Add search index size
    totalSize += Object.keys(this.searchIndex).length * 100;

    // Add cache size
    totalSize += this.cache.size() * 1024;

    return totalSize;
  }

  private getHealthStatusLevel(): 'healthy' | 'warning' | 'error' {
    const templateCount = this.templates.size;

    if (templateCount === 0) {
      return 'error';
    }

    if (templateCount < 5) {
      return 'warning';
    }

    return 'healthy';
  }
}

// Interface for health status
export interface RegistryHealthStatus {
  templateCount: number;
  searchIndexSize: number;
  cacheSize: number;
  memoryUsage: number;
  lastUpdated: Date;
  status: 'healthy' | 'warning' | 'error';
}