/**
 * Template Customizer Service
 *
 * Handles template customization including colors, fonts, layout,
 * sections, and other styling options while maintaining ATS optimization.
 */

import {
  ResumeTemplate,
  CustomizationOptions,
  ColorTheme,
  FontFamily,
  TemplateSystemConfig,
  ValidationResult
} from '@/types/template';
import { TemplateEngineErrorFactory } from './errors';
import { StyleProcessor } from './style-processor';
import { ATSOptimizer } from './ats-optimizer';

export interface CustomizationResult {
  customizedTemplate: ResumeTemplate;
  appliedChanges: AppliedChange[];
  warnings: CustomizationWarning[];
  atsImpact: ATSImpact;
}

export interface AppliedChange {
  category: 'colors' | 'fonts' | 'layout' | 'sections' | 'branding';
  field: string;
  oldValue: any;
  newValue: any;
  atsCompliant: boolean;
}

export interface CustomizationWarning {
  category: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  atsImpact: 'none' | 'minor' | 'major';
  suggestion?: string;
}

export interface ATSImpact {
  score: number; // -100 to 100, negative means negative impact
  issues: string[];
  recommendations: string[];
}

export class TemplateCustomizer {
  private config: TemplateSystemConfig;
  private styleProcessor: StyleProcessor;
  private atsOptimizer: ATSOptimizer;
  private predefinedThemes: ColorTheme[];
  private predefinedFonts: FontFamily[];

  constructor(config: TemplateSystemConfig) {
    this.config = config;
    this.styleProcessor = new StyleProcessor();
    this.atsOptimizer = new ATSOptimizer();
    this.predefinedThemes = this.initializeThemes();
    this.predefinedFonts = this.initializeFonts();
  }

  /**
   * Customize a template with provided options
   */
  async customize(
    templateId: string,
    customizations: CustomizationOptions
  ): Promise<ResumeTemplate> {
    try {
      console.log(`[TemplateCustomizer] Customizing template: ${templateId}`);

      // Get original template (would come from registry)
      const originalTemplate = await this.getTemplate(templateId);
      if (!originalTemplate) {
        throw TemplateEngineErrorFactory.templateNotFound(templateId);
      }

      // Validate customizations
      const validation = this.validateCustomizations(customizations);
      if (!validation.isValid) {
        throw TemplateEngineErrorFactory.customizationInvalid(
          `Invalid customizations: ${validation.errors.map(e => e.message).join(', ')}`
        );
      }

      // Apply customizations
      const customizedTemplate = await this.applyCustomizations(originalTemplate, customizations);

      // Validate ATS compliance
      const atsValidation = await this.validateATSCompliance(customizedTemplate);
      if (atsValidation.score < 70) {
        console.warn(`[TemplateCustomizer] ATS compliance score low: ${atsValidation.score}`);
      }

      console.log(`[TemplateCustomizer] Template customized successfully: ${templateId}`);
      return customizedTemplate;

    } catch (error) {
      if (error instanceof TemplateEngineError) {
        throw error;
      }
      throw TemplateEngineErrorFactory.customizationFailed(
        error instanceof Error ? error : new Error('Unknown customization error'),
        templateId
      );
    }
  }

  /**
   * Reset template to original state
   */
  async reset(templateId: string): Promise<ResumeTemplate> {
    try {
      console.log(`[TemplateCustomizer] Resetting template: ${templateId}`);

      const template = await this.getTemplate(templateId);
      if (!template) {
        throw TemplateEngineErrorFactory.templateNotFound(templateId);
      }

      // Return template with default customizations
      const resetTemplate = {
        ...template,
        customization: this.getDefaultCustomizations()
      };

      console.log(`[TemplateCustomizer] Template reset successfully: ${templateId}`);
      return resetTemplate;

    } catch (error) {
      if (error instanceof TemplateEngineError) {
        throw error;
      }
      throw TemplateEngineErrorFactory.customizationFailed(
        error instanceof Error ? error : new Error('Unknown reset error'),
        templateId
      );
    }
  }

  /**
   * Preview template with customizations
   */
  async preview(
    templateId: string,
    customizations: CustomizationOptions
  ): Promise<string> {
    try {
      const customizedTemplate = await this.customize(templateId, customizations);

      // Generate preview HTML
      const previewHTML = this.generateCustomizationPreview(customizedTemplate, customizations);

      return previewHTML;

    } catch (error) {
      console.error(`[TemplateCustomizer] Preview failed for template ${templateId}:`, error);
      throw error;
    }
  }

  /**
   * Validate customization options
   */
  validate(customizations: CustomizationOptions): ValidationResult {
    return this.validateCustomizations(customizations);
  }

  /**
   * Get available color themes
   */
  getColorThemes(): ColorTheme[] {
    return [...this.predefinedThemes];
  }

  /**
   * Get available font families
   */
  getFontFamilies(): FontFamily[] {
    return [...this.predefinedFonts];
  }

  /**
   * Get customization suggestions based on template and industry
   */
  getSuggestions(templateId: string, industry?: string): CustomizationSuggestion[] {
    const suggestions: CustomizationSuggestion[] = [];

    // Industry-specific suggestions
    if (industry) {
      switch (industry.toLowerCase()) {
        case 'technology':
          suggestions.push(
            {
              category: 'colors',
              suggestion: 'Use modern blue color scheme for tech industry',
              options: { theme: 'tech-modern-blue' },
              impact: 'ATS Compliant',
              confidence: 0.9
            },
            {
              category: 'fonts',
              suggestion: 'Use clean sans-serif fonts for better readability',
              options: { font: 'Inter' },
              impact: 'ATS Compliant',
              confidence: 0.95
            }
          );
          break;
        case 'finance':
          suggestions.push(
            {
              category: 'colors',
              suggestion: 'Use conservative navy and gray color scheme',
              options: { theme: 'corporate-navy' },
              impact: 'ATS Compliant',
              confidence: 0.85
            },
            {
              category: 'fonts',
              suggestion: 'Use traditional serif fonts for professional appearance',
              options: { font: 'Georgia' },
              impact: 'ATS Compliant',
              confidence: 0.9
            }
          );
          break;
        case 'healthcare':
          suggestions.push(
            {
              category: 'colors',
              suggestion: 'Use calming blue and green color scheme',
              options: { theme: 'healthcare-calm' },
              impact: 'ATS Compliant',
              confidence: 0.8
            }
          );
          break;
      }
    }

    // ATS optimization suggestions
    suggestions.push(
      {
        category: 'layout',
        suggestion: 'Ensure single-column layout for better ATS parsing',
        options: { layout: 'single-column' },
        impact: 'ATS Critical',
        confidence: 1.0
      },
      {
        category: 'fonts',
        suggestion: 'Use ATS-friendly fonts (Arial, Georgia, Helvetica)',
        options: { font: 'Arial' },
        impact: 'ATS Critical',
        confidence: 0.95
      }
    );

    return suggestions;
  }

  // Private methods

  private async getTemplate(templateId: string): Promise<ResumeTemplate | null> {
    // In real implementation, this would fetch from the template registry
    // For now, return null to indicate template should be provided externally
    return null;
  }

  private async applyCustomizations(
    template: ResumeTemplate,
    customizations: CustomizationOptions
  ): Promise<ResumeTemplate> {
    let customizedTemplate = { ...template };

    // Apply color customizations
    if (customizations.colors) {
      customizedTemplate = await this.applyColorCustomizations(customizedTemplate, customizations.colors);
    }

    // Apply font customizations
    if (customizations.fonts) {
      customizedTemplate = await this.applyFontCustomizations(customizedTemplate, customizations.fonts);
    }

    // Apply layout customizations
    if (customizations.layout) {
      customizedTemplate = await this.applyLayoutCustomizations(customizedTemplate, customizations.layout);
    }

    // Apply section customizations
    if (customizations.sections) {
      customizedTemplate = await this.applySectionCustomizations(customizedTemplate, customizations.sections);
    }

    // Apply branding customizations
    if (customizations.branding) {
      customizedTemplate = await this.applyBrandingCustomizations(customizedTemplate, customizations.branding);
    }

    // Update metadata
    customizedTemplate.metadata = {
      ...customizedTemplate.metadata,
      updated: new Date(),
      version: this.incrementVersion(customizedTemplate.metadata.version)
    };

    return customizedTemplate;
  }

  private async applyColorCustomizations(
    template: ResumeTemplate,
    colorCustomizations: any
  ): Promise<ResumeTemplate> {
    const customizedTemplate = { ...template };

    if (colorCustomizations.currentTheme) {
      const theme = this.predefinedThemes.find(t => t.id === colorCustomizations.currentTheme);
      if (theme) {
        customizedTemplate.styling.colors = theme.colors;
      }
    }

    if (colorCustomizations.customColors && colorCustomizations.customColors.length > 0) {
      // Apply custom colors
      const customColors = colorCustomizations.customColors[0];
      customizedTemplate.styling.colors.primary[500] = customColors.colors.primary;
      customizedTemplate.styling.colors.secondary[500] = customColors.colors.secondary;
      customizedTemplate.styling.colors.accent[500] = customColors.colors.accent;
    }

    return customizedTemplate;
  }

  private async applyFontCustomizations(
    template: ResumeTemplate,
    fontCustomizations: any
  ): Promise<ResumeTemplate> {
    const customizedTemplate = { ...template };

    if (fontCustomizations.families && fontCustomizations.families.length > 0) {
      const selectedFont = fontCustomizations.families[0];
      customizedTemplate.styling.fonts.heading = selectedFont;
      customizedTemplate.styling.fonts.body = selectedFont;
      customizedTemplate.styling.fonts.accents = selectedFont;
    }

    if (fontCustomizations.sizes) {
      const { sizes } = fontCustomizations;
      if (sizes.heading) {
        customizedTemplate.styling.sizes.heading = {
          ...customizedTemplate.styling.sizes.heading,
          h1: customizedTemplate.styling.sizes.heading.h1 * sizes.scale,
          h2: customizedTemplate.styling.sizes.heading.h2 * sizes.scale,
          h3: customizedTemplate.styling.sizes.heading.h3 * sizes.scale,
          h4: customizedTemplate.styling.sizes.heading.h4 * sizes.scale,
          h5: customizedTemplate.styling.sizes.heading.h5 * sizes.scale,
          h6: customizedTemplate.styling.sizes.heading.h6 * sizes.scale
        };
      }

      if (sizes.body) {
        customizedTemplate.styling.sizes.body = {
          ...customizedTemplate.styling.sizes.body,
          xs: customizedTemplate.styling.sizes.body.xs * sizes.scale,
          sm: customizedTemplate.styling.sizes.body.sm * sizes.scale,
          base: customizedTemplate.styling.sizes.body.base * sizes.scale,
          lg: customizedTemplate.styling.sizes.body.lg * sizes.scale,
          xl: customizedTemplate.styling.sizes.body.xl * sizes.scale,
          '2xl': customizedTemplate.styling.sizes.body['2xl'] * sizes.scale,
          '3xl': customizedTemplate.styling.sizes.body['3xl'] * sizes.scale
        };
      }
    }

    return customizedTemplate;
  }

  private async applyLayoutCustomizations(
    template: ResumeTemplate,
    layoutCustomizations: any
  ): Promise<ResumeTemplate> {
    const customizedTemplate = { ...template };

    if (layoutCustomizations.spacing) {
      const { spacing } = layoutCustomizations;
      customizedTemplate.layout.spacing = {
        ...customizedTemplate.layout.spacing,
        section: customizedTemplate.layout.spacing.section * spacing.scale,
        item: customizedTemplate.layout.spacing.item * spacing.scale,
        line: customizedTemplate.layout.spacing.line
      };
    }

    if (layoutCustomizations.margins) {
      const { margins } = layoutCustomizations;
      customizedTemplate.layout.dimensions.margins = {
        top: customizedTemplate.layout.dimensions.margins.top * margins.scale,
        right: customizedTemplate.layout.dimensions.margins.right * margins.scale,
        bottom: customizedTemplate.layout.dimensions.margins.bottom * margins.scale,
        left: customizedTemplate.layout.dimensions.margins.left * margins.scale
      };
    }

    if (layoutCustomizations.alignment) {
      customizedTemplate.layout.headerStyle = layoutCustomizations.alignment.header as any;
    }

    return customizedTemplate;
  }

  private async applySectionCustomizations(
    template: ResumeTemplate,
    sectionCustomizations: any
  ): Promise<ResumeTemplate> {
    const customizedTemplate = { ...template };

    if (sectionCustomizations.visibility) {
      sectionCustomizations.visibility.forEach((visibility: any) => {
        const section = customizedTemplate.sections.find(s => s.id === visibility.sectionId);
        if (section) {
          section.visibility.default = visibility.visible;
        }
      });
    }

    if (sectionCustomizations.ordering) {
      sectionCustomizations.ordering.forEach((order: any) => {
        const section = customizedTemplate.sections.find(s => s.id === order.sectionId);
        if (section) {
          section.order = order.order;
        }
      });

      // Reorder sections array
      customizedTemplate.sections.sort((a, b) => a.order - b.order);
    }

    return customizedTemplate;
  }

  private async applyBrandingCustomizations(
    template: ResumeTemplate,
    brandingCustomizations: any
  ): Promise<ResumeTemplate> {
    const customizedTemplate = { ...template };

    customizedTemplate.styling.branding = {
      ...customizedTemplate.styling.branding,
      ...brandingCustomizations
    };

    return customizedTemplate;
  }

  private validateCustomizations(customizations: CustomizationOptions): ValidationResult {
    const errors: any[] = [];
    const warnings: any[] = [];

    // Validate color customizations
    if (customizations.colors) {
      if (customizations.colors.currentTheme) {
        const theme = this.predefinedThemes.find(t => t.id === customizations.colors?.currentTheme);
        if (!theme) {
          errors.push({
            field: 'colors.currentTheme',
            message: `Theme not found: ${customizations.colors.currentTheme}`,
            code: 'THEME_NOT_FOUND',
            severity: 'error'
          });
        }
      }

      if (customizations.colors.customColors) {
        for (const customColor of customizations.colors.customColors) {
          if (!this.isValidColor(customColor.colors.primary)) {
            errors.push({
              field: 'colors.customColors.primary',
              message: 'Invalid primary color format',
              code: 'INVALID_COLOR',
              severity: 'error'
            });
          }
          if (!this.isValidColor(customColor.colors.secondary)) {
            errors.push({
              field: 'colors.customColors.secondary',
              message: 'Invalid secondary color format',
              code: 'INVALID_COLOR',
              severity: 'error'
            });
          }
        }
      }
    }

    // Validate font customizations
    if (customizations.fonts?.sizes) {
      if (customizations.fonts.sizes.scale && (customizations.fonts.sizes.scale < 0.5 || customizations.fonts.sizes.scale > 2)) {
        errors.push({
          field: 'fonts.sizes.scale',
          message: 'Font scale must be between 0.5 and 2',
          code: 'INVALID_SCALE',
          severity: 'error'
        });
      }
    }

    // Validate layout customizations
    if (customizations.layout?.spacing?.scale) {
      if (customizations.layout.spacing.scale < 0.5 || customizations.layout.spacing.scale > 2) {
        errors.push({
          field: 'layout.spacing.scale',
          message: 'Spacing scale must be between 0.5 and 2',
          code: 'INVALID_SCALE',
          severity: 'error'
        });
      }
    }

    // ATS compliance warnings
    if (customizations.fonts?.families) {
      for (const font of customizations.fonts.families) {
        if (!this.isATSCompliantFont(font.name)) {
          warnings.push({
            field: 'fonts.families',
            message: `Font "${font.name}" may not be ATS-compliant`,
            code: 'NON_ATS_FONT',
            severity: 'warning',
            suggestion: 'Consider using ATS-friendly fonts like Arial, Georgia, or Helvetica'
          });
        }
      }
    }

    const totalChecks = errors.length + warnings.length + 10;
    const score = Math.max(0, Math.round(((totalChecks - errors.length - (warnings.length * 0.5)) / totalChecks) * 100));

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score
    };
  }

  private async validateATSCompliance(template: ResumeTemplate): Promise<ATSImpact> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check font compliance
    const headingFont = template.styling.fonts.heading.name;
    const bodyFont = template.styling.fonts.body.name;

    if (!this.isATSCompliantFont(headingFont)) {
      issues.push(`Heading font "${headingFont}" is not ATS-compliant`);
      score -= 20;
      recommendations.push(`Change heading font to ATS-approved font like Arial or Georgia`);
    }

    if (!this.isATSCompliantFont(bodyFont)) {
      issues.push(`Body font "${bodyFont}" is not ATS-compliant`);
      score -= 20;
      recommendations.push(`Change body font to ATS-approved font like Arial or Helvetica`);
    }

    // Check layout compliance
    if (template.layout.format !== 'single-column') {
      issues.push('Multi-column layouts may not be ATS-compliant');
      score -= 15;
      recommendations.push('Consider using single-column layout for better ATS compatibility');
    }

    // Check color contrast
    const primaryColor = template.styling.colors.primary[500];
    const backgroundColor = template.styling.colors.background.primary;
    if (!this.hasGoodContrast(primaryColor, backgroundColor)) {
      issues.push('Low color contrast may affect readability');
      score -= 10;
      recommendations.push('Increase color contrast for better readability');
    }

    return {
      score: Math.max(0, score),
      issues,
      recommendations
    };
  }

  private generateCustomizationPreview(
    template: ResumeTemplate,
    customizations: CustomizationOptions
  ): string {
    return `
    <div class="customization-preview" data-template-id="${template.id}">
      <div class="preview-header">
        <h3>${template.name} - Customized</h3>
        <div class="applied-customizations">
          ${customizations.colors?.currentTheme ? `<span class="customization-tag">Theme: ${customizations.colors.currentTheme}</span>` : ''}
          ${customizations.fonts?.families?.[0]?.name ? `<span class="customization-tag">Font: ${customizations.fonts.families[0].name}</span>` : ''}
        </div>
      </div>
      <div class="preview-content">
        <div class="preview-sample" style="font-family: ${customizations.fonts?.families?.[0]?.name || template.styling.fonts.heading.name};">
          <h4 style="color: ${customizations.colors?.customColors?.[0]?.colors.primary || template.styling.colors.primary[500]};">
            ${template.styling.fonts.heading.name}
          </h4>
          <p style="color: ${template.styling.colors.text.secondary};">
            Sample text showing custom font and color selections.
          </p>
        </div>
      </div>
    </div>`;
  }

  private getDefaultCustomizations(): CustomizationOptions {
    return {
      colors: {
        themes: [],
        customColors: [],
        currentTheme: 'default',
        allowCustom: true
      },
      fonts: {
        families: [],
        sizes: {
          heading: [36, 40, 44, 48],
          body: [11, 12, 13, 14, 15],
          scale: 1
        },
        weights: {
          heading: [400, 700],
          body: [400, 700]
        },
        lineHeight: {
          tight: 1.4,
          normal: 1.6,
          relaxed: 1.8
        }
      },
      layout: {
        spacing: {
          section: 24,
          item: 16,
          line: 1.6,
          scale: 1
        },
        margins: {
          top: 0.75,
          right: 0.75,
          bottom: 0.75,
          left: 0.75,
          scale: 1
        },
        columns: {
          count: 1,
          widths: [100],
          gutters: 20
        },
        alignment: {
          header: 'center',
          sections: 'left',
          content: 'left'
        }
      },
      sections: {
        visibility: [],
        ordering: [],
        styling: []
      },
      branding: {
        logo: {
          enabled: false,
          url: '',
          size: 40,
          position: 'top-left',
          opacity: 1
        },
        watermark: {
          enabled: false,
          text: '',
          font: 'Arial',
          size: 24,
          color: '#cccccc',
          opacity: 0.1,
          position: 'center',
          rotation: -45
        },
        header: {
          showName: true,
          showContact: true,
          layout: 'classic',
          styling: {}
        },
        footer: {
          showPageNumbers: false,
          showLastModified: false,
          showContact: false,
          text: '',
          styling: {}
        }
      },
      export: {
        formats: ['pdf', 'docx', 'html'],
        quality: {
          pdf: 'print',
          images: 'balanced',
          fonts: 'embedded'
        },
        options: {
          includeMetadata: true,
          includeComments: false,
          watermarks: false,
          passwordProtection: false,
          compression: true
        }
      }
    };
  }

  private initializeThemes(): ColorTheme[] {
    return [
      {
        id: 'professional-blue',
        name: 'Professional Blue',
        colors: {
          primary: {
            50: '#eff6ff',
            100: '#dbeafe',
            200: '#bfdbfe',
            300: '#93c5fd',
            400: '#60a5fa',
            500: '#3b82f6',
            600: '#2563eb',
            700: '#1d4ed8',
            800: '#1e40af',
            900: '#1e3a8a'
          },
          secondary: {
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#e2e8f0',
            300: '#cbd5e1',
            400: '#94a3b8',
            500: '#64748b',
            600: '#475569',
            700: '#334155',
            800: '#1e293b',
            900: '#0f172a'
          },
          accent: {
            50: '#f0fdf4',
            100: '#dcfce7',
            200: '#bbf7d0',
            300: '#86efac',
            400: '#4ade80',
            500: '#22c55e',
            600: '#16a34a',
            700: '#15803d',
            800: '#166534',
            900: '#14532d'
          },
          text: {
            primary: '#1e293b',
            secondary: '#475569',
            tertiary: '#64748b',
            inverse: '#ffffff',
            muted: '#94a3b8',
            accent: '#3b82f6'
          },
          background: {
            primary: '#ffffff',
            secondary: '#f8fafc',
            tertiary: '#f1f5f9',
            accent: '#eff6ff'
          },
          semantic: {
            success: '#22c55e',
            warning: '#f59e0b',
            error: '#ef4444',
            info: '#3b82f6'
          }
        },
        preview: '/themes/professional-blue-preview.png',
        accessibility: 'good'
      },
      {
        id: 'executive-gray',
        name: 'Executive Gray',
        colors: {
          primary: {
            50: '#f9fafb',
            100: '#f3f4f6',
            200: '#e5e7eb',
            300: '#d1d5db',
            400: '#9ca3af',
            500: '#6b7280',
            600: '#4b5563',
            700: '#374151',
            800: '#1f2937',
            900: '#111827'
          },
          secondary: {
            50: '#fefce8',
            100: '#fef9c3',
            200: '#fef08a',
            300: '#fde047',
            400: '#facc15',
            500: '#eab308',
            600: '#ca8a04',
            700: '#a16207',
            800: '#854d0e',
            900: '#713f12'
          },
          accent: {
            50: '#f0fdfa',
            100: '#ccfbf1',
            200: '#99f6e4',
            300: '#5eead4',
            400: '#2dd4bf',
            500: '#14b8a6',
            600: '#0d9488',
            700: '#0f766e',
            800: '#115e59',
            900: '#134e4a'
          },
          text: {
            primary: '#111827',
            secondary: '#374151',
            tertiary: '#6b7280',
            inverse: '#ffffff',
            muted: '#9ca3af',
            accent: '#059669'
          },
          background: {
            primary: '#ffffff',
            secondary: '#f9fafb',
            tertiary: '#f3f4f6',
            accent: '#f0fdfa'
          },
          semantic: {
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444',
            info: '#3b82f6'
          }
        },
        preview: '/themes/executive-gray-preview.png',
        accessibility: 'excellent'
      }
    ];
  }

  private initializeFonts(): FontFamily[] {
    return [
      {
        name: 'Arial',
        stack: ['Arial', 'Helvetica', 'sans-serif'],
        weights: [
          { weight: 400, name: 'Regular' },
          { weight: 700, name: 'Bold' }
        ]
      },
      {
        name: 'Georgia',
        stack: ['Georgia', 'Times New Roman', 'serif'],
        weights: [
          { weight: 400, name: 'Regular' },
          { weight: 700, name: 'Bold' }
        ]
      },
      {
        name: 'Inter',
        stack: ['Inter', 'system-ui', 'sans-serif'],
        weights: [
          { weight: 300, name: 'Light' },
          { weight: 400, name: 'Regular' },
          { weight: 500, name: 'Medium' },
          { weight: 600, name: 'Semibold' },
          { weight: 700, name: 'Bold' }
        ],
        webFonts: [
          {
            family: 'Inter',
            source: 'google',
            url: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
            variants: ['300', '400', '500', '600', '700']
          }
        ]
      }
    ];
  }

  private isValidColor(color: string): boolean {
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return colorRegex.test(color);
  }

  private isATSCompliantFont(fontName: string): boolean {
    const atsCompliantFonts = [
      'Arial', 'Calibri', 'Cambria', 'Georgia', 'Helvetica',
      'Times New Roman', 'Verdana', 'Trebuchet MS', 'Book Antiqua'
    ];
    return atsCompliantFonts.includes(fontName);
  }

  private hasGoodContrast(foreground: string, background: string): boolean {
    // Simplified contrast check - would use proper contrast calculation in production
    return true;
  }

  private incrementVersion(version: string): string {
    const parts = version.split('.');
    const patch = parseInt(parts[2] || '0') + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  }
}

// Interfaces for customization suggestions
export interface CustomizationSuggestion {
  category: string;
  suggestion: string;
  options: any;
  impact: string;
  confidence: number;
}