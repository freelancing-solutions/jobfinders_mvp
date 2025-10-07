/**
 * Main customization engine for resume templates
 * Combines color, typography, layout, and section customization
 */

import { ColorThemeCustomizer } from './color-theme';
import { TypographyCustomizer } from './typography';
import { LayoutCustomizer } from './layout';
import { SectionVisibilityManager } from './section-visibility';
import {
  TemplateCustomization,
  ColorScheme,
  TypographySettings,
  LayoutSettings,
  SectionVisibility,
  ResumeTemplate
} from '@/types/template';
import { TemplateEngineError, TemplateErrorType } from '../errors';

export class TemplateCustomizationEngine {
  private colorScheme: ColorScheme;
  private typography: TypographySettings;
  private layout: LayoutSettings;
  private sectionVisibility: SectionVisibility;
  private baseTemplate: ResumeTemplate;
  private changeHistory: CustomizationChange[];
  private listeners: Set<(customization: TemplateCustomization) => void>;

  constructor(baseTemplate: ResumeTemplate) {
    this.baseTemplate = baseTemplate;
    this.colorScheme = ColorThemeCustomizer.getPredefinedTheme('executive')!;
    this.typography = TypographyCustomizer.createCustomTypography({});
    this.layout = LayoutCustomizer.getPredefinedLayout('traditional')!;
    this.sectionVisibility = SectionVisibilityManager.createCustomVisibility({});
    this.changeHistory = [];
    this.listeners = new Set();
  }

  /**
   * Get current customization state
   */
  getCurrentCustomization(): TemplateCustomization {
    return {
      id: `custom-${Date.now()}`,
      templateId: this.baseTemplate.id,
      name: 'Custom Resume',
      colorScheme: { ...this.colorScheme },
      typography: JSON.parse(JSON.stringify(this.typography)),
      layout: JSON.parse(JSON.stringify(this.layout)),
      sectionVisibility: JSON.parse(JSON.stringify(this.sectionVisibility)),
      metadata: {
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        version: '1.0',
        changes: this.changeHistory.length
      }
    };
  }

  /**
   * Apply color theme
   */
  applyColorTheme(themeId: string): void {
    const theme = ColorThemeCustomizer.getPredefinedTheme(themeId);
    if (!theme) {
      throw new TemplateEngineError(
        TemplateErrorType.VALIDATION_ERROR,
        `Color theme '${themeId}' not found`,
        { themeId }
      );
    }

    const previousTheme = { ...this.colorScheme };
    this.colorScheme = ColorThemeCustomizer.optimizeForATS(theme);

    this.recordChange({
      type: 'color',
      property: 'theme',
      previousValue: previousTheme,
      newValue: { ...this.colorScheme },
      timestamp: new Date().toISOString()
    });

    this.notifyListeners();
  }

  /**
   * Customize individual color
   */
  customizeColor(property: keyof ColorScheme, color: string): void {
    if (!ColorThemeCustomizer.isATSSafeColor(color)) {
      throw new TemplateEngineError(
        TemplateErrorType.VALIDATION_ERROR,
        `Color '${color}' is not ATS-safe`,
        { color, property }
      );
    }

    const previousValue = this.colorScheme[property];
    this.colorScheme[property] = color;

    // Re-optimize the entire scheme for ATS compatibility
    this.colorScheme = ColorThemeCustomizer.optimizeForATS(this.colorScheme);

    this.recordChange({
      type: 'color',
      property,
      previousValue,
      newValue: this.colorScheme[property],
      timestamp: new Date().toISOString()
    });

    this.notifyListeners();
  }

  /**
   * Apply professional font combination
   */
  applyFontCombination(combinationName: string): void {
    const previousTypography = JSON.parse(JSON.stringify(this.typography));
    this.typography = TypographyCustomizer.applyProfessionalCombination(combinationName);

    this.recordChange({
      type: 'typography',
      property: 'combination',
      previousValue: previousTypography,
      newValue: JSON.parse(JSON.stringify(this.typography)),
      timestamp: new Date().toISOString()
    });

    this.notifyListeners();
  }

  /**
   * Customize typography settings
   */
  customizeTypography(settings: Partial<TypographySettings>): void {
    const previousTypography = JSON.parse(JSON.stringify(this.typography));
    this.typography = TypographyCustomizer.createCustomTypography({
      ...this.typography,
      ...settings
    });

    this.recordChange({
      type: 'typography',
      property: 'settings',
      previousValue: previousTypography,
      newValue: JSON.parse(JSON.stringify(this.typography)),
      timestamp: new Date().toISOString()
    });

    this.notifyListeners();
  }

  /**
   * Apply layout preset
   */
  applyLayoutPreset(presetId: string): void {
    const layout = LayoutCustomizer.getPredefinedLayout(presetId);
    if (!layout) {
      throw new TemplateEngineError(
        TemplateErrorType.VALIDATION_ERROR,
        `Layout preset '${presetId}' not found`,
        { presetId }
      );
    }

    const previousLayout = JSON.parse(JSON.stringify(this.layout));
    this.layout = LayoutCustomizer.optimizeForATS(layout);

    this.recordChange({
      type: 'layout',
      property: 'preset',
      previousValue: previousLayout,
      newValue: JSON.parse(JSON.stringify(this.layout)),
      timestamp: new Date().toISOString()
    });

    this.notifyListeners();
  }

  /**
   * Customize layout settings
   */
  customizeLayout(settings: Partial<LayoutSettings>): void {
    const previousLayout = JSON.parse(JSON.stringify(this.layout));
    this.layout = LayoutCustomizer.createCustomLayout({
      ...this.layout,
      ...settings
    });

    this.recordChange({
      type: 'layout',
      property: 'settings',
      previousValue: previousLayout,
      newValue: JSON.parse(JSON.stringify(this.layout)),
      timestamp: new Date().toISOString()
    });

    this.notifyListeners();
  }

  /**
   * Toggle section visibility
   */
  toggleSection(sectionId: string): void {
    const previousVisibility = JSON.parse(JSON.stringify(this.sectionVisibility));
    this.sectionVisibility = SectionVisibilityManager.toggleSection(sectionId, this.sectionVisibility);

    this.recordChange({
      type: 'section',
      property: `visibility-${sectionId}`,
      previousValue: previousVisibility.sections[sectionId].visible,
      newValue: this.sectionVisibility.sections[sectionId].visible,
      timestamp: new Date().toISOString()
    });

    this.notifyListeners();
  }

  /**
   * Reorder sections
   */
  reorderSections(sectionIds: string[]): void {
    const previousVisibility = JSON.parse(JSON.stringify(this.sectionVisibility));
    this.sectionVisibility = SectionVisibilityManager.reorderSections(sectionIds, this.sectionVisibility);

    this.recordChange({
      type: 'section',
      property: 'order',
      previousValue: previousVisibility,
      newValue: JSON.parse(JSON.stringify(this.sectionVisibility)),
      timestamp: new Date().toISOString()
    });

    this.notifyListeners();
  }

  /**
   * Apply role-specific customization
   */
  applyRoleCustomization(role: string, industry?: string, experienceLevel?: 'entry' | 'mid' | 'senior' | 'executive'): void {
    const previousCustomization = this.getCurrentCustomization();

    // Apply role-specific sections
    const roleSections = SectionVisibilityManager.getRoleSpecificSections(role);
    this.sectionVisibility = SectionVisibilityManager.optimizeForATS(roleSections);

    // Apply industry typography recommendations
    if (industry) {
      const industryTypography = TypographyCustomizer.getIndustryRecommendations(industry);
      this.typography = TypographyCustomizer.createCustomTypography({
        ...this.typography,
        ...industryTypography
      });
    }

    // Apply experience-level layout recommendations
    if (experienceLevel) {
      const layoutRecommendations = LayoutCustomizer.getExperienceBasedRecommendations(experienceLevel);
      this.layout = LayoutCustomizer.createCustomLayout({
        ...this.layout,
        ...layoutRecommendations
      });
    }

    this.recordChange({
      type: 'role',
      property: 'customization',
      previousValue: previousCustomization,
      newValue: this.getCurrentCustomization(),
      timestamp: new Date().toISOString(),
      metadata: { role, industry, experienceLevel }
    });

    this.notifyListeners();
  }

  /**
   * Reset customization to defaults
   */
  resetToDefaults(): void {
    const previousCustomization = this.getCurrentCustomization();

    this.colorScheme = ColorThemeCustomizer.getPredefinedTheme('executive')!;
    this.typography = TypographyCustomizer.createCustomTypography({});
    this.layout = LayoutCustomizer.getPredefinedLayout('traditional')!;
    this.sectionVisibility = SectionVisibilityManager.createCustomVisibility({});
    this.changeHistory = [];

    this.recordChange({
      type: 'reset',
      property: 'all',
      previousValue: previousCustomization,
      newValue: this.getCurrentCustomization(),
      timestamp: new Date().toISOString()
    });

    this.notifyListeners();
  }

  /**
   * Undo last change
   */
  undoLastChange(): boolean {
    if (this.changeHistory.length === 0) {
      return false;
    }

    const lastChange = this.changeHistory.pop()!;

    // Restore previous value
    switch (lastChange.type) {
      case 'color':
        if (typeof lastChange.previousValue === 'object') {
          this.colorScheme = lastChange.previousValue as ColorScheme;
        }
        break;
      case 'typography':
        if (typeof lastChange.previousValue === 'object') {
          this.typography = lastChange.previousValue as TypographySettings;
        }
        break;
      case 'layout':
        if (typeof lastChange.previousValue === 'object') {
          this.layout = lastChange.previousValue as LayoutSettings;
        }
        break;
      case 'section':
        if (typeof lastChange.previousValue === 'object') {
          this.sectionVisibility = lastChange.previousValue as SectionVisibility;
        }
        break;
      case 'role':
        // Complex restoration - would need more sophisticated handling
        this.resetToDefaults();
        break;
      case 'reset':
        // Cannot undo reset
        this.changeHistory = [];
        break;
    }

    this.notifyListeners();
    return true;
  }

  /**
   * Get customization analytics
   */
  getAnalytics(): {
    overallScore: number;
    atsScore: number;
    readabilityScore: number;
    designScore: number;
    recommendations: string[];
    strengths: string[];
    warnings: string[];
  } {
    const readabilityAnalytics = TypographyCustomizer.calculateReadabilityScore(this.typography);
    const layoutAnalytics = LayoutCustomizer.calculateLayoutEfficiency(this.layout, 500); // Estimated content length
    const sectionAnalytics = SectionVisibilityManager.getSectionAnalytics(this.sectionVisibility, {});

    // Calculate ATS score
    let atsScore = 100;
    atsScore -= Math.max(0, 100 - readabilityAnalytics.score) * 0.3;
    atsScore -= Math.max(0, 100 - layoutAnalytics.atsCompliance) * 0.4;
    atsScore -= Math.max(0, 100 - sectionAnalytics.atsScore) * 0.3;

    const overallScore = Math.round(
      readabilityAnalytics.score * 0.3 +
      layoutAnalytics.score * 0.3 +
      sectionAnalytics.contentCompleteness * 0.4
    );

    const recommendations = [
      ...readabilityAnalytics.recommendations,
      ...layoutAnalytics.recommendations,
      ...sectionAnalytics.recommendations
    ];

    const strengths = [];
    if (readabilityAnalytics.score >= 85) strengths.push('Excellent typography for readability');
    if (layoutAnalytics.score >= 85) strengths.push('Well-optimized layout');
    if (sectionAnalytics.contentCompleteness >= 80) strengths.push('Comprehensive content coverage');
    if (atsScore >= 90) strengths.push('ATS-optimized formatting');

    const warnings = [];
    if (readabilityAnalytics.score < 70) warnings.push('Typography may need improvement for ATS systems');
    if (layoutAnalytics.score < 70) warnings.push('Layout may not be optimal for ATS parsing');
    if (sectionAnalytics.contentCompleteness < 60) warnings.push('Consider adding more content sections');

    return {
      overallScore,
      atsScore: Math.round(atsScore),
      readabilityScore: readabilityAnalytics.score,
      designScore: layoutAnalytics.score,
      recommendations: recommendations.slice(0, 5), // Limit to top 5
      strengths,
      warnings
    };
  }

  /**
   * Export customization
   */
  exportCustomization(): string {
    const customization = this.getCurrentCustomization();
    return JSON.stringify({
      ...customization,
      changeHistory: this.changeHistory,
      baseTemplate: this.baseTemplate.id
    }, null, 2);
  }

  /**
   * Import customization
   */
  importCustomization(customizationJson: string): void {
    try {
      const imported = JSON.parse(customizationJson);

      if (!imported.colorScheme || !imported.typography || !imported.layout || !imported.sectionVisibility) {
        throw new TemplateEngineError(
          TemplateErrorType.VALIDATION_ERROR,
          'Invalid customization format',
          { imported }
        );
      }

      const previousCustomization = this.getCurrentCustomization();

      this.colorScheme = ColorThemeCustomizer.optimizeForATS(imported.colorScheme);
      this.typography = TypographyCustomizer.createCustomTypography(imported.typography);
      this.layout = LayoutCustomizer.createCustomLayout(imported.layout);
      this.sectionVisibility = imported.sectionVisibility;

      this.recordChange({
        type: 'import',
        property: 'customization',
        previousValue: previousCustomization,
        newValue: this.getCurrentCustomization(),
        timestamp: new Date().toISOString()
      });

      this.notifyListeners();

    } catch (error) {
      if (error instanceof TemplateEngineError) {
        throw error;
      }

      throw new TemplateEngineError(
        TemplateErrorType.VALIDATION_ERROR,
        'Failed to import customization',
        { error: error.message }
      );
    }
  }

  /**
   * Add change listener
   */
  addListener(listener: (customization: TemplateCustomization) => void): void {
    this.listeners.add(listener);
  }

  /**
   * Remove change listener
   */
  removeListener(listener: (customization: TemplateCustomization) => void): void {
    this.listeners.delete(listener);
  }

  /**
   * Generate CSS for current customization
   */
  generateCSS(): string {
    const colorCSS = this.generateColorCSS();
    const typographyCSS = TypographyCustomizer.generateCSS(this.typography);
    const layoutCSS = LayoutCustomizer.generateCSS(this.layout);

    return `
/* Resume Template Customization */
${colorCSS}

${typographyCSS}

${layoutCSS}

/* Section Visibility Styles */
${this.generateSectionCSS()}
    `.trim();
  }

  // Private helper methods
  private recordChange(change: CustomizationChange): void {
    this.changeHistory.push(change);

    // Keep only last 50 changes
    if (this.changeHistory.length > 50) {
      this.changeHistory = this.changeHistory.slice(-50);
    }
  }

  private notifyListeners(): void {
    const customization = this.getCurrentCustomization();
    this.listeners.forEach(listener => {
      try {
        listener(customization);
      } catch (error) {
        console.error('Error in customization listener:', error);
      }
    });
  }

  private generateColorCSS(): string {
    return `
/* Color Theme */
:root {
  --color-primary: ${this.colorScheme.primary};
  --color-secondary: ${this.colorScheme.secondary};
  --color-accent: ${this.colorScheme.accent};
  --color-background: ${this.colorScheme.background};
  --color-text: ${this.colorScheme.text};
  --color-muted: ${this.colorScheme.muted};
  --color-border: ${this.colorScheme.border};
  --color-highlight: ${this.colorScheme.highlight};
  --color-link: ${this.colorScheme.link};
}

.resume-container {
  color: var(--color-text);
  background-color: var(--color-background);
}

.section-title {
  color: var(--color-primary);
  border-bottom: 2px solid var(--color-accent);
}

.item-title {
  color: var(--color-secondary);
}

.accent-text {
  color: var(--color-accent);
}

.contact-info {
  color: var(--color-muted);
  border-bottom: 1px solid var(--color-border);
}

a {
  color: var(--color-link);
}

.highlight {
  background-color: var(--color-highlight);
}
    `.trim();
  }

  private generateSectionCSS(): string {
    const visibleSections = SectionVisibilityManager.getVisibleSections(this.sectionVisibility);

    return visibleSections.map(section => `
.resume-section[data-section="${section.id}"] {
  display: block;
}

.resume-section[data-section="${section.id}"]:not(.visible) {
  display: none;
}
    `.trim()).join('\n');
  }
}

// Types
interface CustomizationChange {
  type: 'color' | 'typography' | 'layout' | 'section' | 'role' | 'reset' | 'import';
  property: string;
  previousValue: any;
  newValue: any;
  timestamp: string;
  metadata?: Record<string, any>;
}