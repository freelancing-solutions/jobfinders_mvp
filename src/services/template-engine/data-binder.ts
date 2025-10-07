/**
 * Template Data Binder
 *
 * Handles data binding between resume data and template structures,
 * including field mapping, validation, transformation, and error handling.
 */

import { Resume, ResumeTemplate, TemplateSection, SectionType, ValidationRule, ValidationResult, TemplateError, TemplateErrorCode } from '@/types/template';
import { logger } from '@/lib/logger';
import { TemplateEngineErrorFactory } from './errors';

export interface DataBindingResult {
  success: boolean;
  data: any;
  errors: DataBindingError[];
  warnings: DataBindingWarning[];
  transformation: DataTransformation;
  metadata: DataBindingMetadata;
}

export interface DataBindingError {
  field: string;
  section: string;
  message: string;
  code: string;
  originalValue: any;
  suggestedValue?: any;
}

export interface DataBindingWarning {
  field: string;
  section: string;
  message: string;
  originalValue: any;
  impact: string;
}

export interface DataTransformation {
  mappings: FieldMapping[];
  conversions: FieldConversion[];
  enrichments: FieldEnrichment[];
}

export interface FieldMapping {
  templateField: string;
  dataSource: string;
  dataPath: string[];
  transform?: string;
  required: boolean;
}

export interface FieldConversion {
  field: string;
  from: string;
  to: string;
  conversion: string;
  success: boolean;
}

export interface FieldEnrichment {
  field: string;
  type: string;
  source: string;
  data: any;
}

export interface DataBindingMetadata {
  boundFields: number;
  totalFields: number;
  missingRequiredFields: number;
  transformationCount: number;
  processingTime: number;
  dataCompleteness: number;
}

export class DataBinder {
  private fieldValidators: Map<string, FieldValidator> = new Map();
  private dataTransformers: Map<string, DataTransformer> = new Map();
  private enrichmentServices: Map<string, EnrichmentService> = new Map();

  constructor() {
    this.initializeValidators();
    this.initializeTransformers();
    this.initializeEnrichmentServices();
  }

  /**
   * Bind resume data to template structure
   */
  async bindData(template: ResumeTemplate, resume: Resume, customizations?: any): Promise<DataBindingResult> {
    const startTime = Date.now();
    const errors: DataBindingError[] = [];
    const warnings: DataBindingWarning[] = [];
    const transformation: DataTransformation = {
      mappings: [],
      conversions: [],
      enrichments: []
    };

    try {
      logger.debug('Starting data binding', {
        templateId: template.id,
        resumeId: resume.id,
        sectionsCount: template.sections.length
      });

      // 1. Extract field mappings from template
      const fieldMappings = this.extractFieldMappings(template);
      transformation.mappings = fieldMappings;

      // 2. Apply customizations if provided
      const enhancedData = this.applyCustomizations(resume, customizations);

      // 3. Bind data for each section
      const boundData = await this.bindSectionData(template.sections, enhancedData, errors, warnings, transformation);

      // 4. Validate bound data
      const validationResult = this.validateBoundData(template, boundData, errors, warnings);

      // 5. Apply enrichment services
      const enrichedData = await this.applyEnrichment(boundData, transformation.enrichments, warnings);

      const processingTime = Date.now() - startTime;
      const metadata = this.calculateMetadata(fieldMappings, errors, warnings, processingTime);

      logger.debug('Data binding completed', {
        templateId: template.id,
        success: validationResult.isValid,
        boundFields: metadata.boundFields,
        processingTime
      });

      return {
        success: validationResult.isValid,
        data: enrichedData,
        errors,
        warnings,
        transformation,
        metadata
      };

    } catch (error) {
      logger.error('Data binding failed', {
        templateId: template.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw TemplateEngineErrorFactory.fromError(error as Error, template.id);
    }
  }

  /**
   * Extract field mappings from template structure
   */
  private extractFieldMappings(template: ResumeTemplate): FieldMapping[] {
    const mappings: FieldMapping[] = [];

    template.sections.forEach(section => {
      section.content.fields.forEach(field => {
        const mapping: FieldMapping = {
          templateField: field.id,
          dataSource: 'resume',
          dataPath: this.getDataPathForField(field.id, section.type),
          required: field.required,
          transform: this.getTransformForField(field)
        };

        mappings.push(mapping);
      });
    });

    return mappings;
  }

  /**
   * Get data path for a field based on field ID and section type
   */
  private getDataPathForField(fieldId: string, sectionType: SectionType): string[] {
    const pathMap: Record<string, string[]> = {
      // Personal Info section
      'fullName': ['personalInfo', 'fullName'],
      'title': ['personalInfo', 'title'],
      'email': ['personalInfo', 'email'],
      'phone': ['personalInfo', 'phone'],
      'location': ['personalInfo', 'location'],
      'linkedin': ['personalInfo', 'linkedin'],
      'website': ['personalInfo', 'website'],

      // Summary section
      'summary': ['summary', 'content'],

      // Experience section
      'position': ['experience', 'position'],
      'company': ['experience', 'company'],
      'location': ['experience', 'location'],
      'startDate': ['experience', 'startDate'],
      'endDate': ['experience', 'endDate'],
      'current': ['experience', 'current'],
      'description': ['experience', 'description'],
      'achievements': ['experience', 'achievements'],

      // Education section
      'degree': ['education', 'degree'],
      'institution': ['education', 'institution'],
      'graduationYear': ['education', 'graduationYear'],
      'gpa': ['education', 'gpa'],

      // Skills section
      'skills': ['skills', 'technical'],
      'technicalSkills': ['skills', 'technical'],
      'businessSkills': ['skills', 'business'],
      'leadershipSkills': ['skills', 'leadership'],
      'strategicSkills': ['skills', 'strategic'],

      // Certifications section
      'name': ['certifications', 'name'],
      'issuer': ['certifications', 'issuer'],
      'date': ['certifications', 'date'],

      // Languages section
      'languages': ['languages', 'list'],

      // Achievements section
      'achievements': ['achievements', 'list']
    };

    return pathMap[fieldId] || [fieldId];
  }

  /**
   * Get transformation for a field
   */
  private getTransformForField(field: any): string | undefined {
    if (field.formatting?.titleCase) return 'titleCase';
    if (field.formatting?.dateFormatting) return 'dateFormat';
    if (field.formatting?.phoneFormatting) return 'phoneFormat';
    if (field.formatting?.uppercase) return 'uppercase';
    if (field.formatting?.lowercase) return 'lowercase';
    return undefined;
  }

  /**
   * Apply customizations to resume data
   */
  private applyCustomizations(resume: Resume, customizations?: any): Resume {
    if (!customizations) return resume;

    const enhancedData = { ...resume };

    // Apply color theme customizations
    if (customizations.colors?.currentTheme) {
      enhancedData.theme = customizations.colors.currentTheme;
    }

    // Apply font customizations
    if (customizations.fonts) {
      enhancedData.fonts = customizations.fonts;
    }

    // Apply layout customizations
    if (customizations.layout) {
      enhancedData.layout = customizations.layout;
    }

    // Apply section customizations
    if (customizations.sections) {
      enhancedData.sections = customizations.sections;
    }

    return enhancedData;
  }

  /**
   * Bind data for all sections
   */
  private async bindSectionData(
    sections: TemplateSection[],
    resume: Resume,
    errors: DataBindingError[],
    warnings: DataBindingWarning[],
    transformation: DataTransformation
  ): Promise<any> {
    const boundData: any = {};

    for (const section of sections) {
      try {
        const sectionData = await this.bindSection(section, resume, errors, warnings, transformation);
        boundData[section.id] = sectionData;
      } catch (error) {
        logger.error('Failed to bind section data', {
          sectionId: section.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        errors.push({
          field: 'section',
          section: section.id,
          message: `Failed to bind section data: ${error instanceof Error ? error.message : 'Unknown error'}`,
          code: 'SECTION_BINDING_ERROR',
          originalValue: null
        });

        boundData[section.id] = null;
      }
    }

    return boundData;
  }

  /**
   * Bind data for a single section
   */
  private async bindSection(
    section: TemplateSection,
    resume: Resume,
    errors: DataBindingError[],
    warnings: DataBindingWarning[],
    transformation: DataTransformation
  ): Promise<any> {
    const sectionData: any = {};

    for (const field of section.content.fields) {
      try {
        const dataPath = this.getDataPathForField(field.id, section.type);
        const value = this.extractValueFromPath(resume, dataPath);

        if (value === undefined || value === null) {
          if (field.required) {
            errors.push({
              field: field.id,
              section: section.id,
              message: `Required field is missing: ${field.name}`,
              code: 'REQUIRED_FIELD_MISSING',
              originalValue: value,
              suggestedValue: field.placeholders?.[field.id] || ''
            });
          } else {
            warnings.push({
              field: field.id,
              section: section.id,
              message: `Optional field is missing: ${field.name}`,
              originalValue: value,
              impact: 'Section may appear incomplete'
            });
          }
          continue;
        }

        // Apply field transformations
        const transformedValue = await this.transformField(field, value, transformation.conversions);

        // Validate field value
        const validation = this.validateField(field, transformedValue);
        if (!validation.valid) {
          errors.push({
            field: field.id,
            section: section.id,
            message: validation.error || `Field validation failed: ${field.name}`,
            code: 'FIELD_VALIDATION_ERROR',
            originalValue: value,
            suggestedValue: validation.suggestedValue
          });
        }

        // Apply field formatting
        const formattedValue = this.formatField(field, transformedValue);

        sectionData[field.id] = formattedValue;

      } catch (error) {
        logger.error('Failed to bind field', {
          fieldId: field.id,
          sectionId: section.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        errors.push({
          field: field.id,
          section: section.id,
          message: `Failed to bind field: ${error instanceof Error ? error.message : 'Unknown error'}`,
          code: 'FIELD_BINDING_ERROR',
          originalValue: null
        });
      }
    }

    return sectionData;
  }

  /**
   * Extract value from data path
   */
  private extractValueFromPath(data: any, path: string[]): any {
    let current = data;

    for (const key of path) {
      if (current === null || current === undefined) {
        return undefined;
      }

      if (typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }

    return current;
  }

  /**
   * Transform field value
   */
  private async transformField(field: any, value: any, conversions: FieldConversion[]): Promise<any> {
    let transformedValue = value;

    // Apply field-specific transformations
    if (field.formatting?.titleCase) {
      transformedValue = this.toTitleCase(transformedValue);
      conversions.push({
        field: field.id,
        from: 'original',
        to: 'titleCase',
        conversion: 'titleCase',
        success: true
      });
    }

    if (field.formatting?.dateFormatting && transformedValue) {
      transformedValue = this.formatDate(transformedValue, field.formatting.dateFormat);
      conversions.push({
        field: field.id,
        from: 'original',
        to: 'formatted',
        conversion: 'dateFormat',
        success: true
      });
    }

    if (field.formatting?.phoneFormatting && transformedValue) {
      transformedValue = this.formatPhone(transformedValue);
      conversions.push({
        field: field.id,
        from: 'original',
        to: 'formatted',
        conversion: 'phoneFormat',
        success: true
      });
    }

    if (field.formatting?.uppercase) {
      transformedValue = String(transformedValue).toUpperCase();
      conversions.push({
        field: field.id,
        from: 'original',
        to: 'uppercase',
        conversion: 'uppercase',
        success: true
      });
    }

    if (field.formatting?.lowercase) {
      transformedValue = String(transformedValue).toLowerCase();
      conversions.push({
        field: field.id,
        from: 'original',
        to: 'lowercase',
        conversion: 'lowercase',
        success: true
      });
    }

    return transformedValue;
  }

  /**
   * Validate field value
   */
  private validateField(field: any, value: any): { valid: boolean; error?: string; suggestedValue?: any } {
    const validator = this.fieldValidators.get(field.type);
    if (!validator) {
      return { valid: true };
    }

    return validator.validate(value, field);
  }

  /**
   * Format field value
   */
  private formatField(field: any, value: any): any {
    if (value === null || value === undefined) {
      return '';
    }

    // Apply field-specific formatting rules
    switch (field.type) {
      case 'date':
        return value instanceof Date ? value.toISOString().split('T')[0] : value;

      case 'boolean':
        return Boolean(value);

      case 'number':
        return Number(value);

      default:
        return String(value);
    }
  }

  /**
   * Apply enrichment services to bound data
   */
  private async applyEnrichment(boundData: any, enrichments: FieldEnrichment[], warnings: DataBindingWarning[]): Promise<any> {
    const enrichedData = { ...boundData };

    for (const [serviceName, service] of this.enrichmentServices) {
      try {
        const enrichmentResult = await service.enrich(boundData);

        if (enrichmentResult.success) {
          enrichments.push({
            field: 'enriched_data',
            type: serviceName,
            source: service.constructor.name,
            data: enrichmentResult.data
          });

          // Merge enrichment data
          Object.assign(enrichedData, enrichmentResult.data);
        }

        if (enrichmentResult.warnings) {
          warnings.push(...enrichmentResult.warnings);
        }

      } catch (error) {
        logger.warn(`Enrichment service failed: ${serviceName}`, {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return enrichedData;
  }

  /**
   * Validate bound data against template requirements
   */
  private validateBoundData(template: ResumeTemplate, boundData: any, errors: DataBindingError[], warnings: DataBindingWarning[]): ValidationResult {
    let isValid = true;
    const validationErrors: any[] = [];

    // Validate required sections
    template.sections.forEach(section => {
      const sectionData = boundData[section.id];

      if (section.required && (!sectionData || Object.keys(sectionData).length === 0)) {
        isValid = false;
        validationErrors.push({
          field: 'section',
          message: `Required section is empty: ${section.name}`,
          code: 'REQUIRED_SECTION_EMPTY',
          severity: 'error'
        });
      }
    });

    // Validate section data completeness
    template.sections.forEach(section => {
      const sectionData = boundData[section.id];
      if (!sectionData) return;

      section.content.fields.forEach(field => {
        const fieldValue = sectionData[field.id];

        if (field.required && (fieldValue === undefined || fieldValue === null || fieldValue === '')) {
          isValid = false;
          validationErrors.push({
            field: field.id,
            message: `Required field is missing or empty: ${field.name}`,
            code: 'REQUIRED_FIELD_EMPTY',
            severity: 'error'
          });
        }
      });
    });

    return {
      isValid,
      errors: validationErrors,
      warnings: [],
      score: isValid ? 100 : Math.max(0, 100 - (validationErrors.length * 10))
    };
  }

  /**
   * Calculate metadata for data binding operation
   */
  private calculateMetadata(
    mappings: FieldMapping[],
    errors: DataBindingError[],
    warnings: DataBindingWarning[],
    processingTime: number
  ): DataBindingMetadata {
    const totalFields = mappings.length;
    const boundFields = totalFields - errors.length;
    const missingRequiredFields = errors.filter(e => e.code === 'REQUIRED_FIELD_MISSING').length;
    const transformationCount = 0; // Would be calculated from actual transformations
    const dataCompleteness = totalFields > 0 ? (boundFields / totalFields) * 100 : 0;

    return {
      boundFields,
      totalFields,
      missingRequiredFields,
      transformationCount,
      processingTime,
      dataCompleteness
    };
  }

  // Transformation utilities

  private toTitleCase(str: string): string {
    if (!str) return str;
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  }

  private formatDate(date: any, format: string): string {
    if (!date) return '';

    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return String(date);

    switch (format) {
      case 'MMM YYYY':
        return dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      case 'Month YYYY':
        return dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      case 'YYYY':
        return dateObj.getFullYear().toString();
      case 'MM/DD/YYYY':
        return dateObj.toLocaleDateString('en-US');
      default:
        return dateObj.toLocaleDateString();
    }
  }

  private formatPhone(phone: string): string {
    if (!phone) return phone;

    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');

    // Format as (XXX) XXX-XXXX for US numbers
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }

    // Add country code for longer numbers
    if (cleaned.length > 10) {
      return `+${cleaned.slice(0, cleaned.length - 10)} (${cleaned.slice(-10, -7)}) ${cleaned.slice(-7, -4)}-${cleaned.slice(-4)}`;
    }

    return phone;
  }

  // Initialization methods

  private initializeValidators(): void {
    this.fieldValidators.set('text', new TextFieldValidator());
    this.fieldValidators.set('email', new EmailFieldValidator());
    this.fieldValidators.set('phone', new PhoneFieldValidator());
    this.fieldValidators.set('url', new URLFieldValidator());
    this.fieldValidators.set('date', new DateFieldValidator());
    this.fieldValidators.set('number', new NumberFieldValidator());
    this.fieldValidators.set('textarea', new TextAreaFieldValidator());
    this.fieldValidators.set('select', new SelectFieldValidator());
    this.fieldValidators.set('multi-select', new MultiSelectFieldValidator());
    this.fieldValidators.set('boolean', new BooleanFieldValidator());
  }

  private initializeTransformers(): void {
    this.dataTransformers.set('text', new TextDataTransformer());
    this.dataTransformers.set('date', new DateDataTransformer());
    this.dataTransformers.set('array', new ArrayDataTransformer());
    this.dataTransformers.set('object', new ObjectDataTransformer());
  }

  private initializeEnrichmentServices(): void {
    // Add enrichment services as needed
    // this.enrichmentServices.set('geo', new GeoEnrichmentService());
    // this.enrichmentServices.set('skills', new SkillsEnrichmentService());
  }
}

// Field validator interfaces
interface FieldValidator {
  validate(value: any, field: any): { valid: boolean; error?: string; suggestedValue?: any };
}

// Implementations
class TextFieldValidator implements FieldValidator {
  validate(value: any, field: any): { valid: boolean; error?: string; suggestedValue?: any } {
    if (typeof value !== 'string') {
      return { valid: false, error: 'Value must be a string', suggestedValue: String(value) };
    }

    if (field.validation) {
      for (const rule of field.validation) {
        if (rule.type === 'min-length' && value.length < rule.min) {
          return {
            valid: false,
            error: `Text must be at least ${rule.min} characters`,
            suggestedValue: field.placeholders?.[field.id] || ''
          };
        }

        if (rule.type === 'max-length' && value.length > rule.max) {
          return {
            valid: false,
            error: `Text must be no more than ${rule.max} characters`,
            suggestedValue: value.substring(0, rule.max)
          };
        }

        if (rule.type === 'pattern' && rule.pattern && !new RegExp(rule.pattern).test(value)) {
          return {
            valid: false,
            error: 'Text format is invalid',
            suggestedValue: field.placeholders?.[field.id] || ''
          };
        }
      }
    }

    return { valid: true };
  }
}

class EmailFieldValidator implements FieldValidator {
  validate(value: any, field: any): { valid: boolean; error?: string; suggestedValue?: any } {
    if (typeof value !== 'string') {
      return { valid: false, error: 'Email must be a string', suggestedValue: '' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return {
        valid: false,
        error: 'Invalid email format',
        suggestedValue: field.placeholders?.[field.id] || ''
      };
    }

    return { valid: true };
  }
}

class PhoneFieldValidator implements FieldValidator {
  validate(value: any, field: any): { valid: boolean; error?: string; suggestedValue?: any } {
    if (typeof value !== 'string') {
      return { valid: false, error: 'Phone must be a string', suggestedValue: '' };
    }

    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    if (!phoneRegex.test(value)) {
      return {
        valid: false,
        error: 'Invalid phone format',
        suggestedValue: field.placeholders?.[field.id] || ''
      };
    }

    return { valid: true };
  }
}

class URLFieldValidator implements FieldValidator {
  validate(value: any, field: any): { valid: boolean; error?: string; suggestedValue?: any } {
    if (typeof value !== 'string') {
      return { valid: false, error: 'URL must be a string', suggestedValue: '' };
    }

    try {
      new URL(value);
      return { valid: true };
    } catch {
      return {
        valid: false,
        error: 'Invalid URL format',
        suggestedValue: field.placeholders?.[field.id] || ''
      };
    }
  }
}

class DateFieldValidator implements FieldValidator {
  validate(value: any, field: any): { valid: boolean; error?: string; suggestedValue?: any } {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return {
        valid: false,
        error: 'Invalid date format',
        suggestedValue: new Date().toISOString().split('T')[0]
      };
    }

    return { valid: true };
  }
}

class NumberFieldValidator implements FieldValidator {
  validate(value: any, field: any): { valid: boolean; error?: string; suggestedValue?: any } {
    const num = Number(value);
    if (isNaN(num)) {
      return {
        valid: false,
        error: 'Value must be a number',
        suggestedValue: 0
      };
    }

    if (field.validation) {
      for (const rule of field.validation) {
        if (rule.type === 'min' && num < rule.min) {
          return {
            valid: false,
            error: `Number must be at least ${rule.min}`,
            suggestedValue: rule.min
          };
        }

        if (rule.type === 'max' && num > rule.max) {
          return {
            valid: false,
            error: `Number must be no more than ${rule.max}`,
            suggestedValue: rule.max
          };
        }
      }
    }

    return { valid: true };
  }
}

class TextAreaFieldValidator implements FieldValidator {
  validate(value: any, field: any): { valid: boolean; error?: string; suggestedValue?: any } {
    return new TextFieldValidator().validate(value, field);
  }
}

class SelectFieldValidator implements FieldValidator {
  validate(value: any, field: any): { valid: boolean; error?: string; suggestedValue?: any } {
    return new TextFieldValidator().validate(value, field);
  }
}

class MultiSelectFieldValidator implements FieldValidator {
  validate(value: any, field: any): { valid: boolean; error?: string; suggestedValue?: any } {
    if (!Array.isArray(value)) {
      return {
        valid: false,
        error: 'Value must be an array',
        suggestedValue: []
      };
    }

    return { valid: true };
  }
}

class BooleanFieldValidator implements FieldValidator {
  validate(value: any, field: any): { valid: boolean; error?: string; suggestedValue?: any } {
    if (typeof value !== 'boolean') {
      return {
        valid: false,
        error: 'Value must be true or false',
        suggestedValue: false
      };
    }

    return { valid: true };
  }
}

// Data transformer interfaces
interface DataTransformer {
  transform(data: any, options?: any): Promise<any>;
}

// Implementations
class TextDataTransformer implements DataTransformer {
  async transform(data: any, options?: any): Promise<any> {
    return data;
  }
}

class DateDataTransformer implements DataTransformer {
  async transform(data: any, options?: any): Promise<any> {
    return data;
  }
}

class ArrayDataTransformer implements DataTransformer {
  async transform(data: any, options?: any): Promise<any> {
    return Array.isArray(data) ? data : [data];
  }
}

class ObjectDataTransformer implements DataTransformer {
  async transform(data: any, options?: any): Promise<any> {
    return typeof data === 'object' ? data : { value: data };
  }
}

// Enrichment service interfaces
interface EnrichmentService {
  enrich(data: any): Promise<{ success: boolean; data: any; warnings?: any[] }>;
}

// Implementations (placeholder)
class GeoEnrichmentService implements EnrichmentService {
  async enrich(data: any): Promise<{ success: boolean; data: any; warnings?: any[] }> {
    return { success: true, data: {} };
  }
}

class SkillsEnrichmentService implements EnrichmentService {
  async enrich(data: any): Promise<{ success: boolean; data: any; warnings?: any[] }> {
    return { success: true, data: {} };
  }
}

// Export singleton instance
export const dataBinder = new DataBinder();