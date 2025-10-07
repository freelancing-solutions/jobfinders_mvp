/**
 * Section visibility management system for resume templates
 * Provides dynamic section toggles with ATS optimization
 */

import { SectionVisibility, SectionConfig, SectionPriority } from '@/types/template';
import { TemplateEngineError, TemplateErrorType } from './errors';

export class SectionVisibilityManager {
  private static readonly DEFAULT_SECTIONS: Record<string, SectionConfig> = {
    contact: {
      id: 'contact',
      name: 'Contact Information',
      visible: true,
      required: true,
      priority: 1,
      order: 1,
      minItems: 1,
      maxItems: 1,
      description: 'Essential contact details for the employer to reach you'
    },
    summary: {
      id: 'summary',
      name: 'Professional Summary',
      visible: true,
      required: false,
      priority: 2,
      order: 2,
      minItems: 1,
      maxItems: 1,
      description: 'Brief overview of your professional background and goals'
    },
    experience: {
      id: 'experience',
      name: 'Work Experience',
      visible: true,
      required: true,
      priority: 3,
      order: 3,
      minItems: 1,
      maxItems: 10,
      description: 'Professional work history and achievements'
    },
    education: {
      id: 'education',
      name: 'Education',
      visible: true,
      required: false,
      priority: 4,
      order: 4,
      minItems: 1,
      maxItems: 5,
      description: 'Academic qualifications and certifications'
    },
    skills: {
      id: 'skills',
      name: 'Skills',
      visible: true,
      required: false,
      priority: 5,
      order: 5,
      minItems: 1,
      maxItems: 20,
      description: 'Technical and professional skills'
    },
    projects: {
      id: 'projects',
      name: 'Projects',
      visible: false,
      required: false,
      priority: 6,
      order: 6,
      minItems: 1,
      maxItems: 10,
      description: 'Notable projects and achievements'
    },
    certifications: {
      id: 'certifications',
      name: 'Certifications',
      visible: false,
      required: false,
      priority: 7,
      order: 7,
      minItems: 1,
      maxItems: 10,
      description: 'Professional certifications and licenses'
    },
    awards: {
      id: 'awards',
      name: 'Awards & Honors',
      visible: false,
      required: false,
      priority: 8,
      order: 8,
      minItems: 1,
      maxItems: 10,
      description: 'Professional awards and recognition'
    },
    publications: {
      id: 'publications',
      name: 'Publications',
      visible: false,
      required: false,
      priority: 9,
      order: 9,
      minItems: 1,
      maxItems: 10,
      description: 'Academic and professional publications'
    },
    languages: {
      id: 'languages',
      name: 'Languages',
      visible: false,
      required: false,
      priority: 10,
      order: 10,
      minItems: 1,
      maxItems: 10,
      description: 'Language proficiency'
    },
    volunteer: {
      id: 'volunteer',
      name: 'Volunteer Experience',
      visible: false,
      required: false,
      priority: 11,
      order: 11,
      minItems: 1,
      maxItems: 10,
      description: 'Volunteer work and community involvement'
    },
    references: {
      id: 'references',
      name: 'References',
      visible: false,
      required: false,
      priority: 12,
      order: 12,
      minItems: 0,
      maxItems: 5,
      description: 'Professional references'
    }
  };

  private static readonly ROLE_SPECIFIC_SECTIONS = {
    'software-engineer': ['projects', 'skills', 'certifications'],
    'designer': ['projects', 'skills', 'awards'],
    'manager': ['summary', 'skills', 'awards', 'certifications'],
    'consultant': ['summary', 'skills', 'certifications', 'publications'],
    'academic': ['publications', 'awards', 'certifications'],
    'healthcare': ['certifications', 'skills', 'education'],
    'finance': ['certifications', 'skills', 'education'],
    'sales': ['awards', 'skills', 'summary'],
    'marketing': ['projects', 'skills', 'awards'],
    'entry-level': ['education', 'skills', 'projects', 'volunteer']
  };

  /**
   * Get default section configurations
   */
  static getDefaultSections(): Record<string, SectionConfig> {
    return JSON.parse(JSON.stringify(this.DEFAULT_SECTIONS));
  }

  /**
   * Get role-specific section recommendations
   */
  static getRoleSpecificSections(role: string): SectionVisibility {
    const defaultSections = this.getDefaultSections();
    const roleSections = this.ROLE_SPECIFIC_SECTIONS[role.toLowerCase()] || [];

    // Show recommended sections for the role
    const sections: SectionVisibility['sections'] = {};

    Object.entries(defaultSections).forEach(([sectionId, config]) => {
      sections[sectionId] = {
        ...config,
        visible: config.required || roleSections.includes(sectionId)
      };
    });

    return { sections };
  }

  /**
   * Create custom section visibility configuration
   */
  static createCustomVisibility(sections: Partial<Record<string, { visible: boolean; order?: number }>>): SectionVisibility {
    const defaultSections = this.getDefaultSections();
    const customSections: SectionVisibility['sections'] = {};

    // Apply custom visibility settings
    Object.entries(defaultSections).forEach(([sectionId, config]) => {
      const customSettings = sections[sectionId];
      customSections[sectionId] = {
        ...config,
        visible: customSettings?.visible ?? config.visible,
        order: customSettings?.order ?? config.order
      };
    });

    // Validate required sections
    const requiredSections = Object.values(defaultSections)
      .filter(section => section.required)
      .map(section => section.id);

    const missingRequired = requiredSections.filter(id => !customSections[id]?.visible);
    if (missingRequired.length > 0) {
      throw new TemplateEngineError(
        TemplateErrorType.VALIDATION_ERROR,
        `Required sections cannot be hidden: ${missingRequired.join(', ')}`,
        { missingRequired }
      );
    }

    // Validate section order
    const orderedSections = Object.values(customSections)
      .filter(section => section.visible)
      .sort((a, b) => a.order - b.order);

    // Check for duplicate orders
    const orders = orderedSections.map(section => section.order);
    const uniqueOrders = new Set(orders);
    if (orders.length !== uniqueOrders.size) {
      // Auto-fix duplicate orders
      const fixedSections = { ...customSections };
      let currentOrder = 1;

      orderedSections.forEach(section => {
        fixedSections[section.id].order = currentOrder++;
      });

      return { sections: fixedSections };
    }

    return { sections: customSections };
  }

  /**
   * Toggle section visibility
   */
  static toggleSection(sectionId: string, currentVisibility: SectionVisibility): SectionVisibility {
    const sections = { ...currentVisibility.sections };
    const section = sections[sectionId];

    if (!section) {
      throw new TemplateEngineError(
        TemplateErrorType.VALIDATION_ERROR,
        `Section '${sectionId}' not found`,
        { sectionId }
      );
    }

    // Cannot toggle required sections off
    if (section.required && section.visible) {
      throw new TemplateEngineError(
        TemplateErrorType.VALIDATION_ERROR,
        `Required section '${section.name}' cannot be hidden`,
        { sectionId }
      );
    }

    sections[sectionId] = {
      ...section,
      visible: !section.visible
    };

    return { sections };
  }

  /**
   * Reorder sections
   */
  static reorderSections(sectionIds: string[], currentVisibility: SectionVisibility): SectionVisibility {
    const sections = { ...currentVisibility.sections };

    // Validate all sections exist
    const existingSectionIds = Object.keys(sections);
    const missingSections = sectionIds.filter(id => !existingSectionIds.includes(id));
    if (missingSections.length > 0) {
      throw new TemplateEngineError(
        TemplateErrorType.VALIDATION_ERROR,
        `Sections not found: ${missingSections.join(', ')}`,
        { missingSections }
      );
    }

    // Update order for visible sections
    sectionIds.forEach((sectionId, index) => {
      if (sections[sectionId]) {
        sections[sectionId].order = index + 1;
      }
    });

    // Update order for hidden sections to maintain consistency
    const visibleSectionIds = new Set(sectionIds);
    let nextOrder = sectionIds.length + 1;

    Object.entries(sections).forEach(([sectionId, config]) => {
      if (!visibleSectionIds.has(sectionId)) {
        sections[sectionId].order = nextOrder++;
      }
    });

    return { sections };
  }

  /**
   * Get visible sections in order
   */
  static getVisibleSections(visibility: SectionVisibility): SectionConfig[] {
    return Object.values(visibility.sections)
      .filter(section => section.visible)
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Validate section content
   */
  static validateSectionContent(sectionId: string, content: any, visibility: SectionVisibility): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const section = visibility.sections[sectionId];
    if (!section) {
      return {
        valid: false,
        errors: [`Section '${sectionId}' not found`],
        warnings: []
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if section has content when visible
    if (section.visible) {
      if (!content || (Array.isArray(content) && content.length === 0)) {
        errors.push(`Visible section '${section.name}' has no content`);
      }

      // Validate content length
      if (Array.isArray(content)) {
        if (content.length < section.minItems) {
          errors.push(`Section '${section.name}' requires at least ${section.minItems} items`);
        }
        if (content.length > section.maxItems) {
          warnings.push(`Section '${section.name}' has more than ${section.maxItems} items, consider reducing`);
        }
      }
    }

    // Section-specific validations
    switch (sectionId) {
      case 'contact':
        if (section.visible) {
          const requiredFields = ['name', 'email', 'phone'];
          if (content && typeof content === 'object') {
            requiredFields.forEach(field => {
              if (!content[field]) {
                errors.push(`Contact information missing required field: ${field}`);
              }
            });
          }
        }
        break;

      case 'experience':
        if (section.visible && Array.isArray(content)) {
          content.forEach((item, index) => {
            if (!item.title || !item.company) {
              errors.push(`Experience item ${index + 1} missing title or company`);
            }
            if (!item.startDate) {
              warnings.push(`Experience item ${index + 1} missing start date`);
            }
          });
        }
        break;

      case 'education':
        if (section.visible && Array.isArray(content)) {
          content.forEach((item, index) => {
            if (!item.institution || !item.degree) {
              errors.push(`Education item ${index + 1} missing institution or degree`);
            }
          });
        }
        break;

      case 'skills':
        if (section.visible && Array.isArray(content) && content.length < 3) {
          warnings.push('Consider adding more skills to showcase your abilities');
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Optimize sections for ATS
   */
  static optimizeForATS(visibility: SectionVisibility): SectionVisibility {
    const sections = { ...visibility.sections };

    // ATS-recommended section order
    const atsOrder = [
      'contact',
      'summary',
      'experience',
      'education',
      'skills',
      'certifications',
      'projects',
      'awards',
      'publications',
      'languages',
      'volunteer',
      'references'
    ];

    // Reorder sections according to ATS best practices
    atsOrder.forEach((sectionId, index) => {
      if (sections[sectionId]) {
        sections[sectionId].order = index + 1;
        // ATS prefers these key sections to be visible
        if (['contact', 'experience', 'education', 'skills'].includes(sectionId)) {
          sections[sectionId].visible = true;
        }
      }
    });

    return { sections };
  }

  /**
   * Get section analytics
   */
  static getSectionAnalytics(visibility: SectionVisibility, content: Record<string, any>): {
    totalSections: number;
    visibleSections: number;
    requiredSections: number;
    optionalSections: number;
    contentCompleteness: number;
    atsScore: number;
    recommendations: string[];
  } {
    const allSections = Object.values(visibility.sections);
    const visibleSections = allSections.filter(section => section.visible);
    const requiredSections = allSections.filter(section => section.required);
    const visibleRequired = visibleSections.filter(section => section.required);

    // Calculate content completeness
    let totalContentScore = 0;
    let maxContentScore = 0;

    allSections.forEach(section => {
      maxContentScore += 10; // Each section worth 10 points

      if (section.visible) {
        const sectionContent = content[section.id];
        if (sectionContent) {
          if (Array.isArray(sectionContent)) {
            // Score based on number of items vs minimum required
            const score = Math.min(10, (sectionContent.length / section.minItems) * 10);
            totalContentScore += score;
          } else {
            totalContentScore += 5; // Partial credit for non-array content
          }
        }
      }
    });

    const contentCompleteness = Math.round((totalContentScore / maxContentScore) * 100);

    // Calculate ATS score
    const requiredVisibleScore = (visibleRequired.length / requiredSections.length) * 40;
    const sectionOrderScore = this.calculateSectionOrderScore(visibleSections) * 30;
    const contentScore = contentCompleteness * 0.3;
    const atsScore = Math.round(requiredVisibleScore + sectionOrderScore + contentScore);

    // Generate recommendations
    const recommendations: string[] = [];

    if (visibleRequired.length < requiredSections.length) {
      recommendations.push('Ensure all required sections are visible');
    }

    if (contentCompleteness < 80) {
      recommendations.push('Add more content to improve completeness');
    }

    if (visibleSections.length < 5) {
      recommendations.push('Consider showing more sections to showcase your qualifications');
    }

    if (visibleSections.length > 8) {
      recommendations.push('Consider hiding some sections to maintain focus');
    }

    return {
      totalSections: allSections.length,
      visibleSections: visibleSections.length,
      requiredSections: requiredSections.length,
      optionalSections: allSections.length - requiredSections.length,
      contentCompleteness,
      atsScore,
      recommendations
    };
  }

  /**
   * Export section configuration
   */
  static exportConfiguration(visibility: SectionVisibility): string {
    const exportData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      sections: visibility.sections
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import section configuration
   */
  static importConfiguration(configJson: string): SectionVisibility {
    try {
      const config = JSON.parse(configJson);

      if (!config.sections) {
        throw new TemplateEngineError(
          TemplateErrorType.VALIDATION_ERROR,
          'Invalid configuration format',
          { config }
        );
      }

      return this.createCustomVisibility(config.sections);
    } catch (error) {
      if (error instanceof TemplateEngineError) {
        throw error;
      }

      throw new TemplateEngineError(
        TemplateErrorType.VALIDATION_ERROR,
        'Failed to parse configuration',
        { error: error.message }
      );
    }
  }

  // Helper method
  private static calculateSectionOrderScore(sections: SectionConfig[]): number {
    const idealOrder = ['contact', 'summary', 'experience', 'education', 'skills'];
    let score = 0;
    let maxScore = 0;

    idealOrder.forEach((idealSectionId, idealIndex) => {
      maxScore += 20;
      const section = sections.find(s => s.id === idealSectionId);
      if (section && section.order === idealIndex + 1) {
        score += 20;
      } else if (section) {
        // Partial score for being present but not in ideal position
        const positionDiff = Math.abs(section.order - (idealIndex + 1));
        score += Math.max(0, 20 - (positionDiff * 5));
      }
    });

    return maxScore > 0 ? (score / maxScore) * 100 : 0;
  }
}