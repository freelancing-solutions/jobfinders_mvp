/**
 * Mobile Optimization for Professional Templates
 *
 * Mobile responsiveness configuration and utilities for professional templates
 * ensuring optimal display on mobile devices.
 */

import { TemplateLayout, ResponsiveBreakpoints } from '@/types/template';

// Mobile-specific breakpoints for professional templates
export const professionalMobileBreakpoints: ResponsiveBreakpoints = {
  mobile: 768,    // Mobile devices (phones)
  tablet: 1024,   // Tablets (iPad, etc.)
  desktop: 1200,  // Desktop computers
  large: 1440     // Large desktop monitors
};

// Mobile layout adjustments for professional templates
export interface MobileLayoutAdjustments {
  // Typography adjustments for mobile
  fontSizes: {
    h1: number;
    h2: number;
    h3: number;
    body: number;
    small: number;
  };

  // Spacing adjustments for mobile
  spacing: {
    section: number;
    item: number;
    line: number;
  };

  // Layout adjustments for mobile
  layout: {
    columns: number;
    gutters: number;
    padding: {
      horizontal: number;
      vertical: number;
    };
  };

  // Content adjustments for mobile
  content: {
    maxItemsPerSection: number;
    truncateDescriptions: boolean;
    hideOptionalSections: boolean[];
  };
}

// Mobile optimization presets for each professional template
export const professionalMobilePresets: Record<string, MobileLayoutAdjustments> = {
  'executive-pro': {
    fontSizes: {
      h1: 32,
      h2: 24,
      h3: 20,
      body: 14,
      small: 12
    },
    spacing: {
      section: 24,
      item: 12,
      line: 1.5
    },
    layout: {
      columns: 1,
      gutters: 0,
      padding: {
        horizontal: 16,
        vertical: 12
      }
    },
    content: {
      maxItemsPerSection: 4,
      truncateDescriptions: true,
      hideOptionalSections: ['languages']
    }
  },

  'corporate-classic': {
    fontSizes: {
      h1: 28,
      h2: 22,
      h3: 18,
      body: 13,
      small: 11
    },
    spacing: {
      section: 20,
      item: 10,
      line: 1.4
    },
    layout: {
      columns: 1, // Convert 2-column to single column on mobile
      gutters: 0,
      padding: {
        horizontal: 16,
        vertical: 10
      }
    },
    content: {
      maxItemsPerSection: 3,
      truncateDescriptions: true,
      hideOptionalSections: ['certifications']
    }
  },

  'professional-minimal': {
    fontSizes: {
      h1: 36,
      h2: 26,
      h3: 20,
      body: 15,
      small: 13
    },
    spacing: {
      section: 32,
      item: 16,
      line: 1.6
    },
    layout: {
      columns: 1,
      gutters: 0,
      padding: {
        horizontal: 20,
        vertical: 16
      }
    },
    content: {
      maxItemsPerSection: 5,
      truncateDescriptions: false,
      hideOptionalSections: []
    }
  },

  'leadership-elite': {
    fontSizes: {
      h1: 38,
      h2: 28,
      h3: 22,
      body: 14,
      small: 12
    },
    spacing: {
      section: 28,
      item: 14,
      line: 1.5
    },
    layout: {
      columns: 1,
      gutters: 0,
      padding: {
        horizontal: 18,
        vertical: 14
      }
    },
    content: {
      maxItemsPerSection: 4,
      truncateDescriptions: true,
      hideOptionalSections: ['achievements']
    }
  }
};

// Mobile optimization utilities
export class ProfessionalMobileOptimizer {
  /**
   * Get mobile layout adjustments for a specific template
   */
  static getMobileLayoutAdjustments(templateId: string): MobileLayoutAdjustments {
    return professionalMobilePresets[templateId] || professionalMobilePresets['professional-minimal'];
  }

  /**
   * Apply mobile optimizations to template layout
   */
  static applyMobileOptimizations(
    templateId: string,
    originalLayout: TemplateLayout
  ): TemplateLayout {
    const adjustments = this.getMobileLayoutAdjustments(templateId);

    return {
      ...originalLayout,
      responsiveness: professionalMobileBreakpoints,
      columns: {
        ...originalLayout.columns,
        count: adjustments.layout.columns,
        gutters: adjustments.layout.gutters
      },
      spacing: {
        ...originalLayout.spacing,
        section: adjustments.spacing.section,
        item: adjustments.spacing.item,
        line: adjustments.spacing.line,
        padding: {
          top: adjustments.layout.padding.vertical,
          right: adjustments.layout.padding.horizontal,
          bottom: adjustments.layout.padding.vertical,
          left: adjustments.layout.padding.horizontal
        }
      }
    };
  }

  /**
   * Generate mobile-specific CSS classes
   */
  static generateMobileCSS(templateId: string): string {
    const adjustments = this.getMobileLayoutAdjustments(templateId);

    return `
      /* Mobile styles for ${templateId} */
      @media (max-width: ${professionalMobileBreakpoints.mobile}px) {
        .template-${templateId} {
          padding: ${adjustments.layout.padding.vertical}px ${adjustments.layout.padding.horizontal}px;
        }

        .template-${templateId} h1 {
          font-size: ${adjustments.fontSizes.h1}px;
          line-height: 1.2;
        }

        .template-${templateId} h2 {
          font-size: ${adjustments.fontSizes.h2}px;
          line-height: 1.3;
        }

        .template-${templateId} h3 {
          font-size: ${adjustments.fontSizes.h3}px;
          line-height: 1.4;
        }

        .template-${templateId} .body-text {
          font-size: ${adjustments.fontSizes.body}px;
          line-height: ${adjustments.spacing.line};
        }

        .template-${templateId} .small-text {
          font-size: ${adjustments.fontSizes.small}px;
        }

        .template-${templateId} .section {
          margin-bottom: ${adjustments.spacing.section}px;
        }

        .template-${templateId} .item {
          margin-bottom: ${adjustments.spacing.item}px;
        }

        .template-${templateId} .multi-column {
          display: block;
          column-count: 1;
        }

        .template-${templateId} .optional-section {
          display: none;
        }
      }

      /* Tablet styles */
      @media (min-width: ${professionalMobileBreakpoints.mobile + 1}px) and (max-width: ${professionalMobileBreakpoints.tablet}px) {
        .template-${templateId} {
          padding: calc(${adjustments.layout.padding.vertical}px * 1.2) calc(${adjustments.layout.padding.horizontal}px * 1.2);
        }

        .template-${templateId} h1 {
          font-size: calc(${adjustments.fontSizes.h1}px * 1.1);
        }

        .template-${templateId} h2 {
          font-size: calc(${adjustments.fontSizes.h2}px * 1.1);
        }
      }
    `;
  }

  /**
   * Get responsive viewport meta tag
   */
  static getViewportMetaTag(): string {
    return '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">';
  }

  /**
   * Check if template is mobile-optimized
   */
  static isMobileOptimized(templateId: string): boolean {
    return professionalMobilePresets.hasOwnProperty(templateId);
  }

  /**
   * Get mobile-specific content adjustments
   */
  static getMobileContentAdjustments(templateId: string): {
    maxItemsPerSection: number;
    truncateDescriptions: boolean;
    hideOptionalSections: string[];
  } {
    const adjustments = this.getMobileLayoutAdjustments(templateId);
    return {
      maxItemsPerSection: adjustments.content.maxItemsPerSection,
      truncateDescriptions: adjustments.content.truncateDescriptions,
      hideOptionalSections: adjustments.content.hideOptionalSections
    };
  }

  /**
   * Generate mobile touch targets (minimum 44px for accessibility)
   */
  static generateMobileTouchTargets(): string {
    return `
      /* Mobile touch targets for accessibility */
      @media (max-width: ${professionalMobileBreakpoints.mobile}px) {
        .template-professional .interactive-element {
          min-height: 44px;
          min-width: 44px;
          padding: 12px 16px;
        }

        .template-professional .button {
          min-height: 44px;
          padding: 12px 24px;
        }

        .template-professional .link {
          padding: 8px 0;
          display: block;
        }
      }
    `;
  }

  /**
   * Generate mobile accessibility improvements
   */
  static generateMobileAccessibilityCSS(): string {
    return `
      /* Mobile accessibility improvements */
      @media (max-width: ${professionalMobileBreakpoints.mobile}px) {
        .template-professional {
          font-size: 16px; /* Prevent zoom on iOS */
        }

        .template-professional *:focus {
          outline: 2px solid #007AFF;
          outline-offset: 2px;
        }

        .template-professional .skip-link {
          position: absolute;
          top: -40px;
          left: 6px;
          background: #007AFF;
          color: white;
          padding: 8px;
          z-index: 100;
        }

        .template-professional .skip-link:focus {
          top: 6px;
        }
      }
    `;
  }
}

// Export default mobile optimization
export default ProfessionalMobileOptimizer;