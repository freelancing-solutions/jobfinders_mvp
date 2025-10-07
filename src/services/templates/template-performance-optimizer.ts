/**
 * Template Performance Optimizer
 *
 * Provides performance optimization services for template rendering,
  caching, preloading, and resource management to ensure
  smooth user experience.
 */

import { ResumeTemplate, TemplateCustomization, Resume } from '@/types/resume';
import { templateService } from '@/services/templates/template-service';
import { templatePreviewGenerator } from '@/services/templates/template-preview-generator';

export interface PerformanceMetrics {
  renderTime: number;
  cacheHitRate: number;
  memoryUsage: number;
  bundleSize: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  size: number;
  accessCount: number;
  lastAccessed: number;
}

export interface PreloadTask {
  id: string;
  type: 'template' | 'preview' | 'customization';
  priority: 'high' | 'medium' | 'low';
  url: string;
  data?: any;
  callback?: (data: any) => void;
}

export interface OptimizationConfig {
  enableCaching: boolean;
  enablePreloading: boolean;
  enableLazyLoading: boolean;
  enableCompression: boolean;
  cacheMaxSize: number;
  cacheMaxAge: number;
  preloadThreshold: number;
  compressionLevel: number;
}

export interface ResourceBundle {
  id: string;
  type: 'template' | 'assets' | 'fonts' | 'styles';
  resources: string[];
  compressed: boolean;
  size: number;
  loaded: boolean;
}

export class TemplatePerformanceOptimizer {
  private config: OptimizationConfig;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private preloadedResources: Set<string> = new Set();
  private preloadQueue: PreloadTask[] = [];
  private isPreloading = false;
  private performanceMetrics: PerformanceMetrics;
  private resourceBundles: Map<string, ResourceBundle> = new Map();

  constructor(config: Partial<OptimizationConfig> = {}) {
    this.config = {
      enableCaching: true,
      enablePreloading: true,
      enableLazyLoading: true,
      enableCompression: true,
      cacheMaxSize: 50 * 1024 * 1024, // 50MB
      cacheMaxAge: 24 * 60 * 60 * 1000, // 24 hours
      preloadThreshold: 0.7, // Preload when cache hit rate falls below 70%
      compressionLevel: 6,
      ...config
    };

    this.performanceMetrics = {
      renderTime: 0,
      cacheHitRate: 0,
      memoryUsage: 0,
      bundleSize: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      cumulativeLayoutShift: 0
    };

    this.initializePerformanceMonitoring();
    this.startCacheCleanup();
  }

  /**
   * Optimize template rendering performance
   */
  async optimizeTemplateRender(
    template: ResumeTemplate,
    resume: Resume,
    customization?: TemplateCustomization
  ): Promise<{
    renderedContent: string;
    metrics: PerformanceMetrics;
    optimizations: string[];
  }> {
    const startTime = performance.now();
    const optimizations: string[] = [];

    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(template, resume, customization);
      const cached = this.getFromCache(cacheKey);

      if (cached) {
        optimizations.push('cache_hit');
        this.updateMetrics('cache_hit');
        return {
          renderedContent: cached.data,
          metrics: this.performanceMetrics,
          optimizations
        };
      }

      // Apply render optimizations
      const optimizedTemplate = await this.optimizeTemplateStructure(template);
      const optimizedResume = await this.optimizeResumeData(resume);
      const optimizedCustomization = customization ?
        await this.optimizeCustomization(customization) : undefined;

      // Render with optimizations
      const renderedContent = await this.renderWithOptimizations(
        optimizedTemplate,
        optimizedResume,
        optimizedCustomization
      );

      // Cache result
      this.setCache(cacheKey, {
        data: renderedContent,
        size: this.calculateSize(renderedContent)
      });

      optimizations.push('optimized_render');
      this.updateMetrics('render_complete', performance.now() - startTime);

      return {
        renderedContent,
        metrics: this.performanceMetrics,
        optimizations
      };
    } catch (error) {
      console.error('Template render optimization failed:', error);
      throw error;
    }
  }

  /**
   * Preload template resources
   */
  async preloadTemplates(templateIds: string[], priority: 'high' | 'medium' | 'low' = 'medium'): Promise<void> {
    if (!this.config.enablePreloading) return;

    const tasks: PreloadTask[] = templateIds.map(templateId => ({
      id: `preload_${templateId}`,
      type: 'template' as const,
      priority,
      url: `/api/templates/${templateId}`
    }));

    this.preloadQueue.push(...tasks);
    this.processPreloadQueue();
  }

  /**
   * Preload template previews
   */
  async preloadPreviews(
    templateId: string,
    customizations?: TemplateCustomization[],
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<void> {
    if (!this.config.enablePreloading) return;

    const tasks: PreloadTask[] = [];

    // Add preview generation tasks
    tasks.push({
      id: `preview_${templateId}`,
      type: 'preview' as const,
      priority,
      url: `/api/templates/${templateId}/preview`
    });

    // Add customization preview tasks
    if (customizations) {
      customizations.forEach((customization, index) => {
        tasks.push({
          id: `preview_${templateId}_custom_${index}`,
          type: 'preview' as const,
          priority,
          url: `/api/templates/${templateId}/preview`,
          data: customization
        });
      });
    }

    this.preloadQueue.push(...tasks);
    this.processPreloadQueue();
  }

  /**
   * Create optimized resource bundles
   */
  async createResourceBundles(templates: ResumeTemplate[]): Promise<ResourceBundle[]> {
    const bundles: ResourceBundle[] = [];

    // Group templates by category
    const templatesByCategory = templates.reduce((acc, template) => {
      const category = template.category;
      if (!acc[category]) acc[category] = [];
      acc[category].push(template);
      return acc;
    }, {} as Record<string, ResumeTemplate[]>);

    // Create bundles for each category
    for (const [category, categoryTemplates] of Object.entries(templatesByCategory)) {
      const bundle: ResourceBundle = {
        id: `bundle_${category}`,
        type: 'template',
        resources: categoryTemplates.map(t => t.templateId),
        compressed: this.config.enableCompression,
        size: 0,
        loaded: false
      };

      // Calculate bundle size
      bundle.size = await this.calculateBundleSize(bundle);
      bundles.push(bundle);
    }

    // Create common asset bundles
    const assetBundle = await this.createAssetBundle();
    if (assetBundle) bundles.push(assetBundle);

    // Store bundles
    bundles.forEach(bundle => {
      this.resourceBundles.set(bundle.id, bundle);
    });

    return bundles;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Clear cache and reset metrics
   */
  clearCache(): void {
    this.cache.clear();
    this.preloadedResources.clear();
    this.resetMetrics();
  }

  /**
   * Optimize memory usage
   */
  optimizeMemory(): void {
    // Remove expired cache entries
    for (const [key, entry] of this.cache.entries()) {
      if (Date.now() > entry.expiresAt) {
        this.cache.delete(key);
      }
    }

    // Remove least recently used entries if cache is too large
    const totalSize = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.size, 0);

    if (totalSize > this.config.cacheMaxSize) {
      const sortedEntries = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

      let currentSize = totalSize;
      for (const [key, entry] of sortedEntries) {
        this.cache.delete(key);
        currentSize -= entry.size;
        if (currentSize < this.config.cacheMaxSize * 0.8) break;
      }
    }

    // Update memory usage metric
    this.performanceMetrics.memoryUsage = this.calculateMemoryUsage();
  }

  /**
   * Enable lazy loading for template components
   */
  enableLazyLoading(): void {
    if (!this.config.enableLazyLoading) return;

    // Implement intersection observer for lazy loading
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const templateId = element.dataset.templateId;
            if (templateId && !this.preloadedResources.has(templateId)) {
              this.loadTemplateOnDemand(templateId);
            }
            observer.unobserve(element);
          }
        });
      }, {
        rootMargin: '50px'
      });

      // Observe template placeholders
      document.querySelectorAll('[data-template-id]').forEach(element => {
        observer.observe(element);
      });
    }
  }

  // Private helper methods

  private initializePerformanceMonitoring(): void {
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Monitor Core Web Vitals
      this.observeWebVitals();
    }
  }

  private observeWebVitals(): void {
    // First Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        this.performanceMetrics.firstContentfulPaint = fcpEntry.startTime;
      }
    }).observe({ entryTypes: ['paint'] });

    // Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lcpEntry = entries[entries.length - 1]; // Last LCP entry
      if (lcpEntry) {
        this.performanceMetrics.largestContentfulPaint = lcpEntry.startTime;
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // Cumulative Layout Shift
    let clsValue = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      this.performanceMetrics.cumulativeLayoutShift = clsValue;
    }).observe({ entryTypes: ['layout-shift'] });
  }

  private startCacheCleanup(): void {
    // Clean up cache every hour
    setInterval(() => {
      this.optimizeMemory();
    }, 60 * 60 * 1000);
  }

  private generateCacheKey(
    template: ResumeTemplate,
    resume: Resume,
    customization?: TemplateCustomization
  ): string {
    const templateHash = this.hashObject(template);
    const resumeHash = this.hashObject(resume);
    const customizationHash = customization ? this.hashObject(customization) : '';
    return `${templateHash}_${resumeHash}_${customizationHash}`;
  }

  private hashObject(obj: any): string {
    const str = JSON.stringify(obj);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private getFromCache<T>(key: string): CacheEntry<T> | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Update access information
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    return entry;
  }

  private setCache<T>(key: string, data: { data: T; size: number }): void {
    if (!this.config.enableCaching) return;

    const entry: CacheEntry<T> = {
      data: data.data,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.config.cacheMaxAge,
      size: data.size,
      accessCount: 1,
      lastAccessed: Date.now()
    };

    this.cache.set(key, entry);
  }

  private calculateSize(data: any): number {
    // Rough estimate of memory usage
    return JSON.stringify(data).length * 2; // Assume 2 bytes per character
  }

  private async optimizeTemplateStructure(template: ResumeTemplate): Promise<ResumeTemplate> {
    // Remove unnecessary fields and optimize structure
    const optimized = { ...template };

    // Remove heavy metadata for rendering
    if (optimized.metadata) {
      const { downloadCount, rating, reviewCount, ...lightMetadata } = optimized.metadata;
      optimized.metadata = lightMetadata;
    }

    // Optimize sections
    if (optimized.sections) {
      optimized.sections = optimized.sections.map(section => ({
        ...section,
        // Remove unnecessary properties for rendering
      }));
    }

    return optimized;
  }

  private async optimizeResumeData(resume: Resume): Promise<Resume> {
    // Optimize resume data for rendering
    const optimized = { ...resume };

    // Limit experience entries for performance
    if (optimized.experience && optimized.experience.length > 10) {
      optimized.experience = optimized.experience.slice(0, 10);
    }

    // Limit skills entries
    if (optimized.skills && optimized.skills.length > 20) {
      optimized.skills = optimized.skills.slice(0, 20);
    }

    return optimized;
  }

  private async optimizeCustomization(customization: TemplateCustomization): Promise<TemplateCustomization> {
    // Optimize customization data
    return customization;
  }

  private async renderWithOptimizations(
    template: ResumeTemplate,
    resume: Resume,
    customization?: TemplateCustomization
  ): Promise<string> {
    // Use optimized rendering approach
    const startTime = performance.now();

    // Implement virtual DOM diffing or other optimizations
    // For now, use the standard template service
    const result = await templateService.generatePreview(
      template.templateId,
      resume,
      customization
    );

    this.performanceMetrics.renderTime = performance.now() - startTime;
    return result;
  }

  private async processPreloadQueue(): Promise<void> {
    if (this.isPreloading || this.preloadQueue.length === 0) return;

    this.isPreloading = true;

    // Sort by priority
    this.preloadQueue.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    // Process tasks in batches
    const batchSize = 3;
    const batch = this.preloadQueue.splice(0, batchSize);

    await Promise.all(
      batch.map(task => this.processPreloadTask(task))
    );

    this.isPreloading = false;

    // Continue processing if there are more tasks
    if (this.preloadQueue.length > 0) {
      setTimeout(() => this.processPreloadQueue(), 100);
    }
  }

  private async processPreloadTask(task: PreloadTask): Promise<void> {
    try {
      switch (task.type) {
        case 'template':
          await this.preloadTemplate(task);
          break;
        case 'preview':
          await this.preloadPreview(task);
          break;
        case 'customization':
          await this.preloadCustomization(task);
          break;
      }

      this.preloadedResources.add(task.url);
    } catch (error) {
      console.error(`Failed to preload ${task.type}:`, error);
    }
  }

  private async preloadTemplate(task: PreloadTask): Promise<void> {
    // Preload template data
    const templateId = task.url.split('/').pop();
    if (templateId) {
      // Implementation would fetch and cache template data
    }
  }

  private async preloadPreview(task: PreloadTask): Promise<void> {
    // Preload template preview
    const templateId = task.url.split('/').pop();
    if (templateId) {
      await templatePreviewGenerator.generatePreviews(templateId, undefined, task.data);
    }
  }

  private async preloadCustomization(task: PreloadTask): Promise<void> {
    // Preload customization data
    // Implementation would fetch and cache customization data
  }

  private async calculateBundleSize(bundle: ResourceBundle): Promise<number> {
    // Calculate actual bundle size
    return bundle.resources.length * 1024; // Simplified calculation
  }

  private async createAssetBundle(): Promise<ResourceBundle | null> {
    // Create bundle of common assets
    const commonAssets = [
      '/fonts/inter.woff2',
      '/styles/base.css',
      '/scripts/template-engine.js'
    ];

    return {
      id: 'bundle_common_assets',
      type: 'assets',
      resources: commonAssets,
      compressed: this.config.enableCompression,
      size: commonAssets.length * 1024, // Simplified
      loaded: false
    };
  }

  private async loadTemplateOnDemand(templateId: string): Promise<void> {
    if (this.preloadedResources.has(templateId)) return;

    try {
      await this.preloadTemplates([templateId], 'high');
      this.preloadedResources.add(templateId);
    } catch (error) {
      console.error(`Failed to load template on demand: ${templateId}`, error);
    }
  }

  private updateMetrics(type: string, value?: number): void {
    switch (type) {
      case 'cache_hit':
        // Update cache hit rate
        const totalRequests = this.performanceMetrics.cacheHitRate * 100 + 1;
        const hits = (this.performanceMetrics.cacheHitRate * 99) + 1;
        this.performanceMetrics.cacheHitRate = hits / totalRequests;
        break;
      case 'render_complete':
        if (value !== undefined) {
          this.performanceMetrics.renderTime = value;
        }
        break;
    }
  }

  private resetMetrics(): void {
    this.performanceMetrics = {
      renderTime: 0,
      cacheHitRate: 0,
      memoryUsage: 0,
      bundleSize: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      cumulativeLayoutShift: 0
    };
  }

  private calculateMemoryUsage(): number {
    // Rough estimate of memory usage
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += entry.size;
    }
    return totalSize;
  }
}

// Export singleton instance
export const templatePerformanceOptimizer = new TemplatePerformanceOptimizer();