/**
 * Template Validator Service
 *
 * Provides validation functionality for templates and customizations.
 * Ensures data integrity and compatibility with the resume builder system.
 */

import { ResumeTemplate, TemplateCustomization } from '@/types/resume';
import { TemplateEngineErrorFactory } from '@/services/template-engine/errors';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  score: number; // 0-100
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error';
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
  severity: 'warning';
  suggestion?: string;
}

export class TemplateValidator {
  private readonly ATS_SCORE_THRESHOLD = 85;
  private readonly MAX_CUSTOMIZATION_NAME_LENGTH = 100;

  /**
   * Validate a template
   */
  validateTemplate(template: ResumeTemplate): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required field validations
    this.validateRequiredFields(template, errors);

    // Format validations
    this.validateTemplateFormat(template, errors, warnings);

    // ATS optimization validation
    this.validateATSOptimization(template, errors, warnings);

    // Content validation
    this.validateTemplateContent(template, errors, warnings);

    const score = this.calculateValidationScore(errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score
    };
  }

  /**
   * Validate a template customization
   */
  validateCustomization(customization: TemplateCustomization): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required field validations
    this.validateCustomizationRequiredFields(customization, errors);

    // Color scheme validation
    this.validateColorScheme(customization.colorScheme, errors, warnings);

    // Typography validation
    this.validateTypography(customization.typography, errors, warnings);

    // Layout validation
    this.validateLayout(customization.layout, errors, warnings);

    // Section visibility validation
    this.validateSectionVisibility(customization.sectionVisibility, errors, warnings);

    const score = this.calculateValidationScore(errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score
    };
  }

  /**
   * Validate template compatibility with resume data
   */
  validateTemplateResumeCompatibility(
    template: ResumeTemplate,
    resumeData: any
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check if template supports all resume sections
    this.validateSectionCompatibility(template, resumeData, errors, warnings);

    // Check content length against template constraints
    this.validateContentLength(template, resumeData, errors, warnings);

    // Validate data completeness for template requirements
    this.validateDataCompleteness(template, resumeData, errors, warnings);

    const score = this.calculateValidationScore(errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score
    };
  }

  /**
   * Validate color scheme
   */
  validateColorScheme(colorScheme: any, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (!colorScheme) {
      errors.push({
        field: 'colorScheme',
        message: 'Color scheme is required',
        code: 'MISSING_COLOR_SCHEME',
        severity: 'error'
      });
      return;
    }

    const requiredColors = ['primary', 'secondary', 'accent', 'text', 'background'];
    requiredColors.forEach(color => {
      if (!colorScheme[color] || typeof colorScheme[color] !== 'string') {
        errors.push({
          field: `colorScheme.${color}`,
          message: `${color} color is required and must be a valid color string`,
          code: 'INVALID_COLOR',
          severity: 'error'
        });
      } else if (!this.isValidColor(colorScheme[color])) {
        errors.push({
          field: `colorScheme.${color}`,
          message: `${color} color must be a valid color (hex, rgb, or named color)`,
          code: 'INVALID_COLOR_FORMAT',
          severity: 'error'
        });
      }
    });

    // Check color contrast for accessibility
    if (colorScheme.text && colorScheme.background) {
      const contrast = this.calculateContrastRatio(colorScheme.text, colorScheme.background);
      if (contrast < 4.5) {
        warnings.push({
          field: 'colorScheme.contrast',
          message: 'Text and background colors have low contrast ratio',
          code: 'LOW_CONTRAST',
          severity: 'warning',
          suggestion: 'Consider using colors with higher contrast for better readability'
        });
      }
    }
  }

  /**
   * Validate typography settings
   */
  validateTypography(typography: any, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (!typography) {
      errors.push({
        field: 'typography',
        message: 'Typography settings are required',
        code: 'MISSING_TYPOGRAPHY',
        severity: 'error'
      });
      return;
    }

    // Validate heading typography
    if (typography.heading) {
      if (!typography.heading.fontFamily || typeof typography.heading.fontFamily !== 'string') {
        errors.push({
          field: 'typography.heading.fontFamily',
          message: 'Heading font family is required',
          code: 'MISSING_FONT_FAMILY',
          severity: 'error'
        });
      }

      if (typography.heading.fontSize) {
        const { h1, h2, h3, h4, h5, h6 } = typography.heading.fontSize;
        const headingSizes = [h1, h2, h3, h4, h5, h6];

        headingSizes.forEach((size: number, index: number) => {
          if (size && (size < 8 || size > 72)) {
            warnings.push({
              field: `typography.heading.fontSize.h${index + 1}`,
              message: `H${index + 1} font size (${size}px) is outside recommended range (8-72px)`,
              code: 'FONT_SIZE_OUT_OF_RANGE',
              severity: 'warning',
              suggestion: 'Consider using a more standard font size for better readability'
            });
          }
        });

        // Check heading hierarchy
        if (h1 <= h2 || h2 <= h3 || h3 <= h4) {
          warnings.push({
            field: 'typography.heading.fontSize',
            message: 'Heading sizes should follow proper hierarchy (h1 > h2 > h3 > h4)',
            code: 'INVALID_HEADING_HIERARCHY',
            severity: 'warning',
            suggestion: 'Ensure each heading level is smaller than the previous one'
          });
        }
      }
    }

    // Validate body typography
    if (typography.body) {
      if (!typography.body.fontFamily || typeof typography.body.fontFamily !== 'string') {
        errors.push({
          field: 'typography.body.fontFamily',
          message: 'Body font family is required',
          code: 'MISSING_FONT_FAMILY',
          severity: 'error'
        });
      }

      if (typography.body.fontSize) {
        const { normal } = typography.body.fontSize;
        if (normal && (normal < 8 || normal > 18)) {
          warnings.push({
            field: 'typography.body.fontSize.normal',
            message: `Body font size (${normal}px) is outside recommended range (8-18px)`,
            code: 'FONT_SIZE_OUT_OF_RANGE',
            severity: 'warning',
            suggestion: 'Use a body font size between 10-14px for optimal readability'
          });
        }
      }
    }
  }

  /**
   * Validate layout settings
   */
  validateLayout(layout: any, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (!layout) {
      errors.push({
        field: 'layout',
        message: 'Layout settings are required',
        code: 'MISSING_LAYOUT',
        severity: 'error'
      });
      return;
    }

    // Validate margins
    if (layout.margins) {
      const { top, right, bottom, left } = layout.margins;
      const margins = [top, right, bottom, left];

      margins.forEach((margin: number, index: number) => {
        if (margin !== undefined && (margin < 0.25 || margin > 2)) {
          warnings.push({
            field: `layout.margins.${['top', 'right', 'bottom', 'left'][index]}`,
            message: `Margin (${margin}in) is outside recommended range (0.25-2 inches)`,
            code: 'MARGIN_OUT_OF_RANGE',
            severity: 'warning',
            suggestion: 'Use margins between 0.5-1 inch for standard documents'
          });
        }
      });
    }

    // Validate column configuration
    if (layout.columns) {
      const { count, widths, gutters } = layout.columns;

      if (count !== undefined && (count < 1 || count > 3)) {
        warnings.push({
          field: 'layout.columns.count',
          message: `Column count (${count}) is outside recommended range (1-3)`,
          code: 'COLUMN_COUNT_OUT_OF_RANGE',
          severity: 'warning',
          suggestion: 'Use 1-3 columns for optimal readability and ATS compatibility'
        });
      }

      if (widths && Array.isArray(widths)) {
        const totalWidth = widths.reduce((sum: number, width: number) => sum + width, 0);
        if (Math.abs(totalWidth - 100) > 1) {
          errors.push({
            field: 'layout.columns.widths',
            message: 'Column widths must sum to 100%',
            code: 'INVALID_COLUMN_WIDTHS',
            severity: 'error'
          });
        }
      }
    }
  }

  /**
   * Validate section visibility
   */
  validateSectionVisibility(sectionVisibility: any, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (!sectionVisibility) {
      return; // Section visibility is optional
    }

    const requiredSections = ['personal-info', 'experience', 'education', 'skills'];

    requiredSections.forEach(section => {
      if (sectionVisibility[section] && sectionVisibility[section].visible === false) {
        warnings.push({
          field: `sectionVisibility.${section}`,
          message: `${section} section is hidden but typically required for resumes`,
          code: 'HIDDEN_REQUIRED_SECTION',
          severity: 'warning',
          suggestion: 'Consider keeping this section visible for better resume completeness'
        });
      }
    });
  }

  // Private helper methods

  private validateRequiredFields(template: ResumeTemplate, errors: ValidationError[]): void {
    if (!template.templateId) {
      errors.push({
        field: 'templateId',
        message: 'Template ID is required',
        code: 'MISSING_TEMPLATE_ID',
        severity: 'error'
      });
    }

    if (!template.name || typeof template.name !== 'string') {
      errors.push({
        field: 'name',
        message: 'Template name is required and must be a string',
        code: 'MISSING_TEMPLATE_NAME',
        severity: 'error'
      });
    }

    if (!template.description || typeof template.description !== 'string') {
      errors.push({
        field: 'description',
        message: 'Template description is required and must be a string',
        code: 'MISSING_TEMPLATE_DESCRIPTION',
        severity: 'error'
      });
    }

    if (!template.category || typeof template.category !== 'string') {
      errors.push({
        field: 'category',
        message: 'Template category is required',
        code: 'MISSING_TEMPLATE_CATEGORY',
        severity: 'error'
      });
    }

    if (!template.previewUrl) {
      errors.push({
        field: 'previewUrl',
        message: 'Template preview URL is required',
        code: 'MISSING_PREVIEW_URL',
        severity: 'error'
      });
    }
  }

  private validateTemplateFormat(template: ResumeTemplate, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (template.name && template.name.length > 100) {
      errors.push({
        field: 'name',
        message: 'Template name must be 100 characters or less',
        code: 'NAME_TOO_LONG',
        severity: 'error'
      });
    }

    if (template.description && template.description.length > 500) {
      warnings.push({
        field: 'description',
        message: 'Template description is quite long and may be truncated',
        code: 'DESCRIPTION_TOO_LONG',
        severity: 'warning'
      });
    }
  }

  private validateATSOptimization(template: ResumeTemplate, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (!template.features) {
      errors.push({
        field: 'features',
        message: 'Template features configuration is required',
        code: 'MISSING_FEATURES',
        severity: 'error'
      });
      return;
    }

    if (!template.features.atsOptimized) {
      warnings.push({
        field: 'features.atsOptimized',
        message: 'Template is not ATS optimized, which may affect parsing by automated systems',
        code: 'NOT_ATS_OPTIMIZED',
        severity: 'warning',
        suggestion: 'Consider enabling ATS optimization for better job application success'
      });
    }
  }

  private validateTemplateContent(template: ResumeTemplate, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (!template.sections || !Array.isArray(template.sections) || template.sections.length === 0) {
      errors.push({
        field: 'sections',
        message: 'Template must have at least one section defined',
        code: 'NO_SECTIONS_DEFINED',
        severity: 'error'
      });
    }

    if (!template.layout) {
      errors.push({
        field: 'layout',
        message: 'Template layout configuration is required',
        code: 'MISSING_LAYOUT',
        severity: 'error'
      });
    }
  }

  private validateCustomizationRequiredFields(customization: TemplateCustomization, errors: ValidationError[]): void {
    if (!customization.templateId) {
      errors.push({
        field: 'templateId',
        message: 'Template ID is required for customization',
        code: 'MISSING_TEMPLATE_ID',
        severity: 'error'
      });
    }

    if (!customization.userId) {
      errors.push({
        field: 'userId',
        message: 'User ID is required for customization',
        code: 'MISSING_USER_ID',
        severity: 'error'
      });
    }

    if (customization.name && customization.name.length > this.MAX_CUSTOMIZATION_NAME_LENGTH) {
      errors.push({
        field: 'name',
        message: `Customization name must be ${this.MAX_CUSTOMIZATION_NAME_LENGTH} characters or less`,
        code: 'CUSTOMIZATION_NAME_TOO_LONG',
        severity: 'error'
      });
    }
  }

  private validateSectionCompatibility(template: ResumeTemplate, resumeData: any, errors: ValidationError[], warnings: ValidationWarning[]): void {
    // This would check if the template supports all the sections in the resume data
    // Implementation would depend on the specific template and resume data structure
  }

  private validateContentLength(template: ResumeTemplate, resumeData: any, errors: ValidationError[], warnings: ValidationWarning[]): void {
    // Check if resume content fits within template constraints
    // Implementation would depend on specific template constraints
  }

  private validateDataCompleteness(template: ResumeTemplate, resumeData: any, errors: ValidationError[], warnings: ValidationWarning[]): void {
    // Check if required data for template is present in resume
    // Implementation would depend on template requirements
  }

  private calculateValidationScore(errors: ValidationError[], warnings: ValidationWarning[]): number {
    // Start with 100 points
    let score = 100;

    // Deduct points for errors (10 points each)
    score -= errors.length * 10;

    // Deduct points for warnings (2 points each)
    score -= warnings.length * 2;

    // Ensure score doesn't go below 0
    return Math.max(0, score);
  }

  private isValidColor(color: string): boolean {
    // Check if it's a valid hex color
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
      return true;
    }

    // Check if it's a valid RGB color
    if (/^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/.test(color)) {
      return true;
    }

    // Check if it's a valid CSS named color
    const cssColors = [
      'black', 'white', 'red', 'green', 'blue', 'yellow', 'orange', 'purple', 'pink',
      'gray', 'grey', 'brown', 'navy', 'maroon', 'olive', 'lime', 'aqua', 'teal', 'silver'
    ];

    return cssColors.includes(color.toLowerCase());
  }

  private calculateContrastRatio(color1: string, color2: string): number {
    // Simplified contrast ratio calculation
    // In a real implementation, you'd want to use a proper color contrast library
    return 4.5; // Default value for demonstration
  }
}

// Export singleton instance
export const templateValidator = new TemplateValidator();