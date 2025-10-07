/**
 * Healthcare Professional Resume Template
 * Optimized for medical and healthcare industry with focus on credentials and experience
 */

import { ResumeTemplate } from '@/types/template';

export const healthcareProfessionalTemplate: ResumeTemplate = {
  id: 'healthcare-professional',
  name: 'Healthcare Professional',
  description: 'Traditional template designed for healthcare professionals and medical practitioners',
  category: 'industry',
  industry: 'healthcare',
  tags: ['medical', 'credentials', 'professional', 'conservative'],
  atsScore: 98,
  layout: {
    type: 'single-column',
    sections: ['contact', 'summary', 'credentials', 'experience', 'education', 'certifications', 'skills']
  },
  styling: {
    colorScheme: {
      name: 'Medical Professional',
      primary: '#0f172a',
      secondary: '#334155',
      accent: '#0891b2',
      background: '#ffffff',
      text: '#0f172a',
      muted: '#64748b',
      border: '#e2e8f0',
      highlight: '#f0fdfa',
      link: '#0e7490'
    },
    typography: {
      heading: {
        fontFamily: 'Times New Roman',
        fontWeight: 600,
        fontSize: { h1: 30, h2: 20, h3: 16, h4: 14 },
        lineHeight: 1.2,
        letterSpacing: 0
      },
      body: {
        fontFamily: 'Arial',
        fontWeight: 400,
        fontSize: { large: 14, normal: 12, small: 10, caption: 9 },
        lineHeight: 1.4,
        letterSpacing: 0
      },
      accent: {
        fontFamily: 'Arial',
        fontWeight: 500,
        fontSize: 11,
        lineHeight: 1.4,
        letterSpacing: 0
      },
      monospace: {
        fontFamily: 'Courier New',
        fontWeight: 400,
        fontSize: 11,
        lineHeight: 1.3,
        letterSpacing: 0
      }
    },
    spacing: {
      margins: { top: 1, right: 1, bottom: 1, left: 1 },
      sectionSpacing: { before: 16, after: 12 },
      itemSpacing: 6,
      lineHeight: 1.4
    }
  },
  sections: [
    {
      id: 'contact',
      name: 'Contact Information',
      type: 'contact',
      required: true,
      order: 1,
      layout: 'full-width',
      styling: {
        backgroundColor: '#ffffff',
        borderColor: '#0891b2',
        textColor: '#0f172a',
        showIcons: false,
        compact: false
      }
    },
    {
      id: 'summary',
      name: 'Professional Summary',
      type: 'summary',
      required: false,
      order: 2,
      maxLength: 200,
      layout: 'full-width',
      styling: {
        accentColor: '#0891b2',
        showBorder: true,
        textAlign: 'left'
      }
    },
    {
      id: 'credentials',
      name: 'Professional Credentials',
      type: 'certifications',
      required: true,
      order: 3,
      layout: 'full-width',
      styling: {
        showLicenseNumber: true,
        showExpirationDate: true,
        showIssuingState: true,
        showBoardCertification: true,
        compact: false
      }
    },
    {
      id: 'experience',
      name: 'Clinical Experience',
      type: 'experience',
      required: true,
      order: 4,
      layout: 'full-width',
      styling: {
        showDates: true,
        showLocation: true,
        showBullets: true,
        highlightAchievements: true,
        showPatientCount: true,
        showSpecializations: true,
        dateFormat: 'Month Year'
      }
    },
    {
      id: 'education',
      name: 'Education & Training',
      type: 'education',
      required: true,
      order: 5,
      layout: 'full-width',
      styling: {
        showDates: true,
        showGPA: true,
        showThesis: false,
        showResidency: true,
        showInternship: true,
        compact: false
      }
    },
    {
      id: 'certifications',
      name: 'Additional Certifications',
      type: 'certifications',
      required: false,
      order: 6,
      layout: 'full-width',
      styling: {
        showDates: true,
        showIssuer: true,
        showCredentialId: true,
        showExpirationDate: true,
        compact: false
      }
    },
    {
      id: 'skills',
      name: 'Clinical Skills & Expertise',
      type: 'skills',
      required: false,
      order: 7,
      layout: 'full-width',
      styling: {
        groupBy: 'category',
        showProficiency: true,
        columns: 2,
        categories: ['Clinical Skills', 'Technical Skills', 'Soft Skills']
      }
    },
    {
      id: 'publications',
      name: 'Publications & Research',
      type: 'publications',
      required: false,
      order: 8,
      layout: 'full-width',
      styling: {
        showCitations: true,
        showCoAuthors: true,
        showJournal: true,
        showDOI: true,
        compact: true
      }
    }
  ],
  rendering: {
    component: 'SingleColumnTemplate',
    responsive: true,
    printOptimized: true,
    cssFramework: 'tailwind'
  },
  customization: {
    colorThemes: ['corporate', 'executive', 'professional', 'minimal'],
    fontCombinations: ['Traditional Professional', 'Corporate Classic', 'Executive Elegance'],
    layoutPresets: ['traditional', 'spacious'],
    customSections: {
      allowed: ['publications', 'research', 'teaching', 'volunteer'],
      restricted: ['projects', 'portfolio']
    }
  },
  metadata: {
    targetRoles: [
      'Registered Nurse', 'Physician Assistant', 'Medical Doctor', 'Healthcare Administrator',
      'Clinical Specialist', 'Medical Technician', 'Physical Therapist', 'Pharmacist'
    ],
    experienceLevels: ['mid', 'senior', 'executive'],
    targetIndustries: ['Healthcare', 'Medical Services', 'Hospitals', 'Pharmaceutical'],
    atsOptimization: {
      keywords: [
        'patient care', 'clinical', 'medical', 'healthcare', 'diagnosis', 'treatment',
        'HIPAA', 'electronic health records', 'clinical skills', 'medical terminology'
      ],
      avoidKeywords: ['rockstar', 'ninja', 'synergy'],
      formatting: 'traditional-structure'
    }
  }
};