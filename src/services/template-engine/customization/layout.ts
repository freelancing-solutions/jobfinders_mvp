/**
 * Layout customization system for resume templates
 * Provides layout adjustments with ATS optimization
 */

import { LayoutSettings, SectionSpacing, Margins, Alignment } from '@/types/template';
import { TemplateEngineError, TemplateErrorType } from './errors';

export class LayoutCustomizer {
  private static readonly PREDEFINED_LAYOUTS = {
    // Conservative layouts
    traditional: {
      name: 'Traditional',
      margins: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
      sectionSpacing: { before: 12, after: 8 },
      itemSpacing: 6,
      lineHeight: 1.15,
      alignment: 'left',
      description: 'Classic conservative layout suitable for traditional industries'
    },
    modern: {
      name: 'Modern',
      margins: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
      sectionSpacing: { before: 10, after: 6 },
      itemSpacing: 4,
      lineHeight: 1.3,
      alignment: 'left',
      description: 'Contemporary layout with efficient use of space'
    },
    compact: {
      name: 'Compact',
      margins: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
      sectionSpacing: { before: 8, after: 4 },
      itemSpacing: 3,
      lineHeight: 1.1,
      alignment: 'left',
      description: 'Space-efficient layout for experienced professionals'
    },
    spacious: {
      name: 'Spacious',
      margins: { top: 1, right: 1, bottom: 1, left: 1 },
      sectionSpacing: { before: 16, after: 12 },
      itemSpacing: 8,
      lineHeight: 1.5,
      alignment: 'left',
      description: 'Open layout with generous white space'
    }
  };

  private static readonly ATS_CONSTRAINTS = {
    minimumFontSize: 9,
    maximumFontSize: 14,
    minimumLineHeight: 1.0,
    maximumLineHeight: 2.0,
    minimumMargins: 0.5,
    maximumMargins: 1.5,
    minimumSectionSpacing: 6,
    maximumSectionSpacing: 24,
    minimumItemSpacing: 2,
    maximumItemSpacing: 12
  };

  /**
   * Get all predefined layouts
   */
  static getPredefinedLayouts() {
    return Object.entries(this.PREDEFINED_LAYOUTS).map(([key, layout]) => ({
      id: key,
      ...layout
    }));
  }

  /**
   * Get specific predefined layout
   */
  static getPredefinedLayout(layoutId: string): LayoutSettings | null {
    const layout = this.PREDEFINED_LAYOUTS[layoutId as keyof typeof this.PREDEFINED_LAYOUTS];
    if (!layout) return null;

    return {
      margins: { ...layout.margins },
      sectionSpacing: { ...layout.sectionSpacing },
      itemSpacing: layout.itemSpacing,
      lineHeight: layout.lineHeight,
      alignment: layout.alignment,
      customSections: {}
    };
  }

  /**
   * Create custom layout settings
   */
  static createCustomLayout(settings: Partial<LayoutSettings>): LayoutSettings {
    const defaultSettings: LayoutSettings = {
      margins: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
      sectionSpacing: { before: 12, after: 8 },
      itemSpacing: 6,
      lineHeight: 1.15,
      alignment: 'left',
      customSections: {}
    };

    // Validate and merge settings
    const validatedSettings = { ...defaultSettings };

    if (settings.margins) {
      validatedSettings.margins = {
        top: this.clampValue(settings.margins.top, this.ATS_CONSTRAINTS.minimumMargins, this.ATS_CONSTRAINTS.maximumMargins),
        right: this.clampValue(settings.margins.right, this.ATS_CONSTRAINTS.minimumMargins, this.ATS_CONSTRAINTS.maximumMargins),
        bottom: this.clampValue(settings.margins.bottom, this.ATS_CONSTRAINTS.minimumMargins, this.ATS_CONSTRAINTS.maximumMargins),
        left: this.clampValue(settings.margins.left, this.ATS_CONSTRAINTS.minimumMargins, this.ATS_CONSTRAINTS.maximumMargins)
      };
    }

    if (settings.sectionSpacing) {
      validatedSettings.sectionSpacing = {
        before: Math.round(this.clampValue(settings.sectionSpacing.before, this.ATS_CONSTRAINTS.minimumSectionSpacing, this.ATS_CONSTRAINTS.maximumSectionSpacing)),
        after: Math.round(this.clampValue(settings.sectionSpacing.after, this.ATS_CONSTRAINTS.minimumSectionSpacing, this.ATS_CONSTRAINTS.maximumSectionSpacing))
      };
    }

    if (settings.itemSpacing !== undefined) {
      validatedSettings.itemSpacing = Math.round(this.clampValue(settings.itemSpacing, this.ATS_CONSTRAINTS.minimumItemSpacing, this.ATS_CONSTRAINTS.maximumItemSpacing));
    }

    if (settings.lineHeight !== undefined) {
      validatedSettings.lineHeight = this.clampValue(settings.lineHeight, this.ATS_CONSTRAINTS.minimumLineHeight, this.ATS_CONSTRAINTS.maximumLineHeight);
    }

    if (settings.alignment) {
      validatedSettings.alignment = settings.alignment;
    }

    if (settings.customSections) {
      validatedSettings.customSections = { ...settings.customSections };
    }

    return validatedSettings;
  }

  /**
   * Adjust layout for content length
   */
  static adjustLayoutForContent(layout: LayoutSettings, contentLength: number): LayoutSettings {
    const adjustedLayout = { ...layout };

    if (contentLength < 200) {
      // Short content - make more spacious
      adjustedLayout.sectionSpacing = {
        before: Math.min(layout.sectionSpacing.before + 4, this.ATS_CONSTRAINTS.maximumSectionSpacing),
        after: Math.min(layout.sectionSpacing.after + 2, this.ATS_CONSTRAINTS.maximumSectionSpacing)
      };
      adjustedLayout.itemSpacing = Math.min(layout.itemSpacing + 2, this.ATS_CONSTRAINTS.maximumItemSpacing);
      adjustedLayout.lineHeight = Math.min(layout.lineHeight + 0.1, this.ATS_CONSTRAINTS.maximumLineHeight);
    } else if (contentLength > 800) {
      // Long content - make more compact
      adjustedLayout.sectionSpacing = {
        before: Math.max(layout.sectionSpacing.before - 2, this.ATS_CONSTRAINTS.minimumSectionSpacing),
        after: Math.max(layout.sectionSpacing.after - 2, this.ATS_CONSTRAINTS.minimumSectionSpacing)
      };
      adjustedLayout.itemSpacing = Math.max(layout.itemSpacing - 1, this.ATS_CONSTRAINTS.minimumItemSpacing);
      adjustedLayout.lineHeight = Math.max(layout.lineHeight - 0.05, this.ATS_CONSTRAINTS.minimumLineHeight);
    }

    return adjustedLayout;
  }

  /**
   * Calculate layout efficiency score
   */
  static calculateLayoutEfficiency(layout: LayoutSettings, contentLength: number): {
    score: number;
    readabilityScore: number;
    densityScore: number;
    atsCompliance: number;
    recommendations: string[];
  } {
    let readabilityScore = 0;
    let densityScore = 0;
    let atsCompliance = 100;
    const recommendations: string[] = [];

    // Readability scoring
    if (layout.lineHeight >= 1.2 && layout.lineHeight <= 1.5) {
      readabilityScore += 25;
    } else if (layout.lineHeight >= 1.0 && layout.lineHeight <= 1.8) {
      readabilityScore += 15;
    } else {
      readabilityScore += 5;
      recommendations.push('Consider using 1.2-1.5 line height for better readability');
    }

    if (layout.sectionSpacing.before >= 8 && layout.sectionSpacing.before <= 16) {
      readabilityScore += 25;
    } else {
      readabilityScore += 10;
      recommendations.push('Section spacing should be between 8-16 points');
    }

    if (layout.itemSpacing >= 4 && layout.itemSpacing <= 8) {
      readabilityScore += 25;
    } else {
      readabilityScore += 10;
      recommendations.push('Item spacing should be between 4-8 points');
    }

    // Density scoring (based on margins)
    const avgMargin = (layout.margins.top + layout.margins.bottom + layout.margins.left + layout.margins.right) / 4;
    if (avgMargin >= 0.5 && avgMargin <= 1.0) {
      densityScore += 50;
    } else if (avgMargin >= 0.75 && avgMargin <= 1.25) {
      densityScore += 30;
    } else {
      densityScore += 10;
      recommendations.push('Margins should be between 0.5-1.0 inches for optimal density');
    }

    // Content density adjustment
    const expectedLines = contentLength / 60; // Rough estimate of lines
    const availableHeight = 11 - (layout.margins.top + layout.margins.bottom); // 11" page height minus margins
    const lineHeight = layout.lineHeight * 12; // Convert to points
    const maxLines = Math.floor(availableHeight * 72 / lineHeight); // 72 points per inch

    if (expectedLines <= maxLines * 0.8) {
      densityScore += 25; // Good use of space
    } else if (expectedLines <= maxLines) {
      densityScore += 15; // Acceptable use of space
    } else {
      densityScore += 5; // Too dense
      recommendations.push('Consider reducing content or making layout more compact');
    }

    // ATS compliance check
    if (layout.lineHeight < 1.0) atsCompliance -= 20;
    if (avgMargin < 0.5) atsCompliance -= 20;
    if (layout.sectionSpacing.before < 6) atsCompliance -= 15;
    if (layout.itemSpacing < 2) atsCompliance -= 15;

    const totalScore = Math.round((readabilityScore + densityScore) * 0.9 + atsCompliance * 0.1);

    return {
      score: Math.min(100, totalScore),
      readabilityScore,
      densityScore,
      atsCompliance,
      recommendations
    };
  }

  /**
   * Generate layout CSS
   */
  static generateCSS(layout: LayoutSettings): string {
    const css = `
/* Layout Styles */
.resume-container {
  margin: ${layout.margins.top}in ${layout.margins.right}in ${layout.margins.bottom}in ${layout.margins.left}in;
  line-height: ${layout.lineHeight};
  text-align: ${layout.alignment};
}

.resume-section {
  margin-top: ${layout.sectionSpacing.before}pt;
  margin-bottom: ${layout.sectionSpacing.after}pt;
}

.resume-item {
  margin-bottom: ${layout.itemSpacing}pt;
}

.section-title {
  margin-bottom: ${Math.max(layout.itemSpacing - 2, 2)}pt;
}

.item-title {
  margin-bottom: ${Math.max(layout.itemSpacing - 4, 1)}pt;
}

.contact-info {
  margin-bottom: ${layout.sectionSpacing.before}pt;
}

.two-column-layout {
  display: flex;
  gap: ${layout.itemSpacing * 2}pt;
}

.two-column-layout .sidebar {
  flex: 0 0 35%;
}

.two-column-layout .main-content {
  flex: 1;
}

@media print {
  .resume-container {
    margin: ${layout.margins.top}in ${layout.margins.right}in ${layout.margins.bottom}in ${layout.margins.left}in;
    line-height: ${layout.lineHeight};
  }

  .resume-section {
    page-break-inside: avoid;
    margin-top: ${layout.sectionSpacing.before}pt;
    margin-bottom: ${layout.sectionSpacing.after}pt;
  }

  .resume-item {
    margin-bottom: ${layout.itemSpacing}pt;
    page-break-inside: avoid;
  }
}
    `.trim();

    // Add custom section styles
    if (layout.customSections) {
      const customCSS = Object.entries(layout.customSections)
        .map(([sectionId, settings]) => {
          if (!settings) return '';
          return `
.custom-section-${sectionId} {
  margin-top: ${settings.spacing || layout.sectionSpacing.before}pt;
  margin-bottom: ${settings.spacing || layout.sectionSpacing.after}pt;
  ${settings.alignment ? `text-align: ${settings.alignment};` : ''}
  ${settings.width ? `width: ${settings.width};` : ''}
}
          `.trim();
        })
        .join('\n');

      return css + '\n\n' + customCSS;
    }

    return css;
  }

  /**
   * Create section-specific layout adjustments
   */
  static createSectionAdjustment(sectionId: string, settings: {
    spacing?: number;
    alignment?: Alignment;
    width?: string;
    columns?: number;
    priority?: number;
  }): LayoutSettings['customSections'][string] {
    return {
      sectionId,
      spacing: settings.spacing,
      alignment: settings.alignment,
      width: settings.width,
      columns: settings.columns,
      priority: settings.priority,
      visibility: true
    };
  }

  /**
   * Optimize layout for ATS parsing
   */
  static optimizeForATS(layout: LayoutSettings): LayoutSettings {
    const optimized = { ...layout };

    // Ensure ATS-friendly values
    optimized.lineHeight = Math.max(1.0, Math.min(1.5, layout.lineHeight));
    optimized.margins = {
      top: Math.max(0.5, Math.min(1.0, layout.margins.top)),
      right: Math.max(0.5, Math.min(1.0, layout.margins.right)),
      bottom: Math.max(0.5, Math.min(1.0, layout.margins.bottom)),
      left: Math.max(0.5, Math.min(1.0, layout.margins.left))
    };
    optimized.sectionSpacing = {
      before: Math.max(6, Math.min(16, layout.sectionSpacing.before)),
      after: Math.max(6, Math.min(16, layout.sectionSpacing.after))
    };
    optimized.itemSpacing = Math.max(2, Math.min(8, layout.itemSpacing));

    // ATS prefers left alignment
    optimized.alignment = 'left';

    return optimized;
  }

  /**
   * Get layout recommendations based on experience level
   */
  static getExperienceBasedRecommendations(experienceLevel: 'entry' | 'mid' | 'senior' | 'executive'): Partial<LayoutSettings> {
    const recommendations: Record<string, Partial<LayoutSettings>> = {
      entry: {
        margins: { top: 1, right: 1, bottom: 1, left: 1 },
        sectionSpacing: { before: 10, after: 6 },
        itemSpacing: 4,
        lineHeight: 1.3
      },
      mid: {
        margins: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
        sectionSpacing: { before: 12, after: 8 },
        itemSpacing: 6,
        lineHeight: 1.2
      },
      senior: {
        margins: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
        sectionSpacing: { before: 8, after: 6 },
        itemSpacing: 4,
        lineHeight: 1.15
      },
      executive: {
        margins: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
        sectionSpacing: { before: 16, after: 12 },
        itemSpacing: 8,
        lineHeight: 1.25
      }
    };

    return recommendations[experienceLevel] || {};
  }

  /**
   * Preview layout with sample content
   */
  static generateLayoutPreview(layout: LayoutSettings): string {
    const sampleContent = this.generateSampleContent(layout);
    const css = this.generateCSS(layout);

    return `
<!DOCTYPE html>
<html>
<head>
<style>
${css}

body {
  font-family: Arial, sans-serif;
  font-size: 12pt;
  color: #333;
  max-width: 8.5in;
  margin: 0 auto;
}

.preview-container {
  border: 1px solid #ddd;
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
</style>
</head>
<body>
<div class="preview-container">
${sampleContent}
</div>
</body>
</html>
    `.trim();
  }

  // Helper methods
  private static clampValue(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  private static generateSampleContent(layout: LayoutSettings): string {
    return `
<div class="resume-container">
  <div class="contact-info">
    <strong>John Doe</strong> • (555) 123-4567 • john.doe@email.com • City, State
  </div>

  <div class="resume-section">
    <h2 class="section-title">Professional Summary</h2>
    <div class="resume-item">
      <p class="body-text">Experienced professional with a proven track record of success.</p>
    </div>
  </div>

  <div class="resume-section">
    <h2 class="section-title">Experience</h2>
    <div class="resume-item">
      <div class="item-title"><strong>Senior Position</strong> - Company Name</div>
      <p class="body-text">Responsible for key initiatives and team leadership.</p>
    </div>
    <div class="resume-item">
      <div class="item-title"><strong>Previous Role</strong> - Another Company</div>
      <p class="body-text">Contributed to project success and team growth.</p>
    </div>
  </div>

  <div class="resume-section">
    <h2 class="section-title">Education</h2>
    <div class="resume-item">
      <div class="item-title"><strong>Bachelor's Degree</strong> - University Name</div>
      <p class="body-text">Graduated with honors</p>
    </div>
  </div>

  <div class="resume-section">
    <h2 class="section-title">Skills</h2>
    <div class="resume-item">
      <p class="body-text">Technical Skills, Communication, Leadership</p>
    </div>
  </div>
</div>
    `.trim();
  }
}