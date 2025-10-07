/**
 * Professional Templates Registry
 *
 * Exports all professional resume templates for registration
 * in the template engine system.
 */

import { ResumeTemplate } from '@/types/template';
import { ExecutiveProTemplate } from './executive-pro';
import { CorporateClassicTemplate } from './corporate-classic';
import { ProfessionalMinimalTemplate } from './professional-minimal';
import { LeadershipEliteTemplate } from './leadership-elite';

// Professional template collection
export const professionalTemplates: ResumeTemplate[] = [
  ExecutiveProTemplate,
  CorporateClassicTemplate,
  ProfessionalMinimalTemplate,
  LeadershipEliteTemplate
];

// Template metadata for professional category
export const professionalTemplatesMetadata = {
  category: 'professional',
  totalTemplates: professionalTemplates.length,
  subcategories: {
    executive: ['executive-pro', 'leadership-elite'],
    corporate: ['corporate-classic'],
    minimal: ['professional-minimal'],
    leadership: ['executive-pro', 'leadership-elite']
  },
  features: {
    atsOptimized: true,
    mobileOptimized: true,
    printOptimized: true,
    wcagCompliant: true
  },
  designPrinciples: {
    conservative: true,
    professional: true,
    clean: true,
    readable: true
  },
  targetAudience: [
    'C-suite executives',
    'Senior managers',
    'Corporate professionals',
    'Leadership roles',
    'Traditional industries',
    'Government positions',
    'Academic administration'
  ],
  recommendedIndustries: [
    'Finance & Banking',
    'Consulting',
    'Legal',
    'Healthcare Administration',
    'Government',
    'Education',
    'Corporate',
    'Fortune 500'
  ]
};

// Export individual templates
export {
  ExecutiveProTemplate,
  CorporateClassicTemplate,
  ProfessionalMinimalTemplate,
  LeadershipEliteTemplate
};

// Template factory functions
export const createProfessionalTemplate = (templateId: string): ResumeTemplate | null => {
  const template = professionalTemplates.find(t => t.id === templateId);
  return template || null;
};

export const getProfessionalTemplateById = (templateId: string): ResumeTemplate | null => {
  return createProfessionalTemplate(templateId);
};

export const getProfessionalTemplatesBySubcategory = (subcategory: string): ResumeTemplate[] => {
  return professionalTemplates.filter(template =>
    professionalTemplatesMetadata.subcategories[subcategory as keyof typeof professionalTemplatesMetadata.subcategories]?.includes(template.id)
  );
};

// Helper functions
export const getProfessionalTemplatePreview = (templateId: string): string => {
  const template = getProfessionalTemplateById(templateId);
  return template?.preview?.thumbnail || '';
};

export const getProfessionalTemplateName = (templateId: string): string => {
  const template = getProfessionalTemplateById(templateId);
  return template?.name || '';
};

export const isProfessionalTemplate = (templateId: string): boolean => {
  return professionalTemplates.some(template => template.id === templateId);
};

// Validation functions
export const validateProfessionalTemplateId = (templateId: string): boolean => {
  return isProfessionalTemplate(templateId);
};

export const getProfessionalTemplateFeatures = (templateId: string): any => {
  const template = getProfessionalTemplateById(templateId);
  return template?.features || null;
};

// Search functions
export const searchProfessionalTemplates = (query: string): ResumeTemplate[] => {
  const searchTerm = query.toLowerCase();
  return professionalTemplates.filter(template =>
    template.name.toLowerCase().includes(searchTerm) ||
    template.description.toLowerCase().includes(searchTerm) ||
    template.tags.some(tag => tag.toLowerCase().includes(searchTerm))
  );
};

// Export category information
export { professionalTemplatesMetadata as professionalCategoryInfo };