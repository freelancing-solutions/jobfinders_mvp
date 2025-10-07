/**
 * Template Engine Service
 *
 * Main entry point for the resume template system.
 * Exports all template services, utilities, and types.
 */

// Core services
export { TemplateRegistry } from './template-registry';
export { TemplateRenderer } from './template-renderer';
export { TemplateCustomizer } from './template-customizer';
export { ExportManager as TemplateExporter } from './export/export-manager';

// Template management
export { IndustryTemplateManager as TemplateManager } from './industry-template-manager';
export { TemplateValidator } from './template-validator';
export { TemplateCache } from '@/lib/template-cache';

// Rendering pipeline
export { RenderPipeline } from './rendering-pipeline';
export { DataBinder } from './data-binder';
// export { StyleProcessor } from './style-processor';
// export { ContentProcessor } from './content-processor';

// Export services
// export { PDFExporter } from './exporters/pdf-exporter';
// export { DOCXExporter } from './exporters/docx-exporter';
// export { HTMLExporter } from './exporters/html-exporter';
export { ExportManager } from './export/export-manager';

// Optimization and performance
// export { TemplateOptimizer } from './template-optimizer';
export { ATSOptimizer } from './ats/ats-optimization-engine';
// export { PerformanceMonitor } from './performance-monitor';

// Error handling
export {
  TemplateEngineError,
  TemplateEngineErrorFactory,
  TemplateErrorHandler,
  templateErrorHandler,
} from './errors';

// Utilities
// export { TemplateUtils } from './template-utils';
// export { ColorUtils } from './color-utils';
// export { FontUtils } from './font-utils';
// export { LayoutUtils } from './layout-utils';

// Configuration
// export { templateEngineConfig } from './config';

// Types (re-export for convenience)
export type {
  ResumeTemplate,
  TemplatePreview,
  TemplateLayout,
  TemplateStyling,
  TemplateSection,
  TemplateFeatures,
  ATSOptimization,
  CustomizationOptions,
  RenderedTemplate,
  ExportResult,
  TemplateSystem,
  TemplateRegistry,
  TemplateRenderer,
  TemplateCustomizer,
  TemplateExporter,
  ValidationResult,
  TemplateAnalytics,
  TemplateError,
  TemplateEvent,
  TemplateSystemConfig
} from '@/types/template';

// Constants
export {
  DEFAULT_TEMPLATE_CONFIG,
  DEFAULT_LAYOUT,
  DEFAULT_STYLING,
  DEFAULT_FEATURES,
  DEFAULT_ATS_OPTIMIZATION
} from '@/types/template';

// Main template system instance
export class TemplateEngine {
  private registry: TemplateRegistry;
  private renderer: TemplateRenderer;
  private customizer: TemplateCustomizer;
  private exporter: ExportManager;
  private manager: IndustryTemplateManager;
  private config: any;

  constructor(config?: Partial<any>) {
    this.config = config || {};

    // Initialize services
    this.registry = new TemplateRegistry(this.config);
    this.renderer = new TemplateRenderer(this.config);
    this.customizer = new TemplateCustomizer(this.config);
    this.exporter = new ExportManager();
    this.manager = new IndustryTemplateManager();
  }

  // Template management
  async initialize(): Promise<void> {
    await this.manager.initialize();
    console.log('Template Engine initialized successfully');
  }

  // Template operations
  getRegistry(): TemplateRegistry {
    return this.registry;
  }

  getRenderer(): TemplateRenderer {
    return this.renderer;
  }

  getCustomizer(): TemplateCustomizer {
    return this.customizer;
  }

  getExporter(): ExportManager {
    return this.exporter;
  }

  getManager(): IndustryTemplateManager {
    return this.manager;
  }

  // Convenience methods
  async renderTemplate(templateId: string, resume: any, options?: any): Promise<any> {
    return this.renderer.render(templateId, resume, options);
  }

  async customizeTemplate(templateId: string, customizations: any): Promise<any> {
    return this.customizer.customize(templateId, customizations);
  }

  async exportTemplate(renderedTemplate: any, format: any, options?: any): Promise<any> {
    return this.exporter.export(renderedTemplate, format, options);
  }

  async previewTemplate(templateId: string, resume?: any): Promise<string> {
    return this.renderer.preview(templateId, resume);
  }

  // Status and health
  getStatus(): any {
    return {
      initialized: this.manager.isInitialized(),
      templateCount: this.registry.list().length,
      performance: this.getPerformanceStats(),
      config: this.config,
      health: this.getHealthStatus()
    };
  }

  private getPerformanceStats(): any {
    // This would be implemented with actual metrics collection
    return {
      averageRenderTime: 1500,
      averageExportTime: 5000,
      successRate: 0.99,
      errorRate: 0.01,
      uptime: Date.now() - (Date.now())
    };
  }

  private getHealthStatus(): 'healthy' | 'degraded' | 'unhealthy' {
    const stats = this.getPerformanceStats();

    if (stats.successRate < 0.95 || stats.errorRate > 0.1) {
      return 'unhealthy';
    }
    if (stats.successRate < 0.98 || stats.errorRate > 0.05) {
      return 'degraded';
    }
    return 'healthy';
  }

  // Cleanup
  async shutdown(): Promise<void> {
    await this.manager.shutdown();
    console.log('Template Engine shut down successfully');
  }
}

// Export singleton instance
export const templateEngine = new TemplateEngine();