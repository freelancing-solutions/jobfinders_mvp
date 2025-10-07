/**
 * Finance Professional Resume Template
 * Optimized for finance and banking industry with emphasis on achievements and qualifications
 */

import { ResumeTemplate } from '@/types/template';

export const financeProfessionalTemplate: ResumeTemplate = {
  id: 'finance-professional',
  name: 'Finance Professional',
  description: 'Conservative template designed for finance, banking, and investment professionals',
  category: 'industry',
  industry: 'finance',
  tags: ['finance', 'banking', 'quantitative', 'professional', 'conservative'],
  atsScore: 97,
  layout: {
    type: 'single-column',
    sections: ['contact', 'summary', 'experience', 'education', 'certifications', 'skills', 'achievements']
  },
  styling: {
    colorScheme: {
      name: 'Finance Professional',
      primary: '#1a1a1a',
      secondary: '#4a4a4a',
      accent: '#2c5aa0',
      background: '#ffffff',
      text: '#1a1a1a',
      muted: '#6b7280',
      border: '#e5e7eb',
      highlight: '#f8fafc',
      link: '#1e40af'
    },
    typography: {
      heading: {
        fontFamily: 'Georgia',
        fontWeight: 600,
        fontSize: { h1: 32, h2: 22, h3: 18, h4: 16 },
        lineHeight: 1.15,
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
        fontFamily: 'Georgia',
        fontWeight: 500,
        fontSize: 12,
        lineHeight: 1.4,
        letterSpacing: 0.5
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
      margins: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
      sectionSpacing: { before: 14, after: 10 },
      itemSpacing: 5,
      lineHeight: 1.3
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
        borderColor: '#2c5aa0',
        textColor: '#1a1a1a',
        showIcons: false,
        compact: false
      }
    },
    {
      id: 'summary',
      name: 'Executive Summary',
      type: 'summary',
      required: false,
      order: 2,
      maxLength: 180,
      layout: 'full-width',
      styling: {
        accentColor: '#2c5aa0',
        showBorder: true,
        textAlign: 'left',
        emphasizeQuantifiable: true
      }
    },
    {
      id: 'experience',
      name: 'Professional Experience',
      type: 'experience',
      required: true,
      order: 3,
      layout: 'full-width',
      styling: {
        showDates: true,
        showLocation: true,
        showBullets: true,
        highlightAchievements: true,
        showMetrics: true,
        showPromotions: true,
        dateFormat: 'Month Year',
        emphasizeResults: true
      }
    },
    {
      id: 'education',
      name: 'Education',
      type: 'education',
      required: true,
      order: 4,
      layout: 'full-width',
      styling: {
        showDates: true,
        showGPA: true,
        showHonors: true,
        showRelevantCoursework: false,
        showDeanList: true,
        compact: false
      }
    },
    {
      id: 'certifications',
      name: 'Professional Certifications',
      type: 'certifications',
      required: true,
      order: 5,
      layout: 'full-width',
      styling: {
        showDates: true,
        showIssuer: true,
        showCredentialId: true,
        showExpirationDate: true,
        showLicenseNumber: true,
        compact: false
      }
    },
    {
      id: 'skills',
      name: 'Technical & Professional Skills',
      type: 'skills',
      required: false,
      order: 6,
      layout: 'full-width',
      styling: {
        groupBy: 'category',
        showProficiency: true,
        columns: 3,
        categories: ['Financial Analysis', 'Technical Skills', 'Software', 'Languages']
      }
    },
    {
      id: 'achievements',
      name: 'Key Achievements',
      type: 'achievements',
      required: false,
      order: 7,
      layout: 'full-width',
      styling: {
        showMetrics: true,
        showDates: true,
        showRecognition: true,
        showAwards: true,
        compact: false
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
    colorThemes: ['executive', 'corporate', 'professional', 'minimal'],
    fontCombinations: ['Executive Elegance', 'Corporate Classic', 'Traditional Professional'],
    layoutPresets: ['traditional', 'professional'],
    customSections: {
      allowed: ['achievements', 'awards', 'publications', 'languages'],
      restricted: ['projects', 'portfolio', 'volunteer']
    }
  },
  metadata: {
    targetRoles: [
      'Financial Analyst', 'Investment Banker', 'Portfolio Manager', 'Risk Manager',
      'Financial Controller', 'Corporate Finance Manager', 'Investment Advisor', 'Credit Analyst'
    ],
    experienceLevels: ['mid', 'senior', 'executive'],
    targetIndustries: [
      'Banking', 'Investment', 'Insurance', 'Corporate Finance', 'Asset Management',
      'Financial Services', 'Venture Capital', 'Private Equity'
    ],
    atsOptimization: {
      keywords: [
        'financial analysis', 'investment', 'portfolio management', 'risk assessment',
        'financial modeling', 'valuation', 'due diligence', 'financial reporting',
        'budgeting', 'forecasting', 'M&A', 'capital markets', 'compliance'
      ],
      avoidKeywords: ['creative', 'innovative', 'disruptive'],
      formatting: 'conservative-structure'
    }
  }
};