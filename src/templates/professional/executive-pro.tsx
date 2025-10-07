/**
 * Executive Pro Template
 *
 * A sophisticated, single-column template designed for C-suite and senior management roles.
 * Features an elegant centered header, conservative styling, and emphasis on leadership experience.
 */

import React from 'react';
import { ResumeTemplate, TemplateCategory, DEFAULT_LAYOUT, DEFAULT_STYLING, DEFAULT_FEATURES, DEFAULT_ATS_OPTIMIZATION } from '@/types/template';

export const ExecutiveProTemplate: ResumeTemplate = {
  id: 'executive-pro',
  name: 'Executive Pro',
  description: 'Elegant single-column template perfect for C-suite and senior management positions with centered header and conservative styling.',
  category: TemplateCategory.PROFESSIONAL,
  subcategory: 'executive',
  preview: {
    thumbnail: '/assets/templates/professional/executive-pro-thumbnail.jpg',
    large: '/assets/templates/professional/executive-pro-large.jpg',
    mobile: '/assets/templates/professional/executive-pro-mobile.jpg'
  },
  layout: {
    ...DEFAULT_LAYOUT,
    format: 'single-column' as any,
    headerStyle: 'centered' as any,
    sectionOrder: [
      { id: 'personal-info', name: 'Contact Information', required: true, order: 1, visible: true },
      { id: 'summary', name: 'Executive Summary', required: true, order: 2, visible: true },
      { id: 'experience', name: 'Executive Experience', required: true, order: 3, visible: true },
      { id: 'education', name: 'Education', required: true, order: 4, visible: true },
      { id: 'skills', name: 'Leadership Competencies', required: true, order: 5, visible: true },
      { id: 'certifications', name: 'Certifications & Awards', required: false, order: 6, visible: true },
      { id: 'languages', name: 'Languages', required: false, order: 7, visible: true }
    ],
    spacing: {
      section: 32,
      item: 16,
      line: 1.6,
      margin: { top: 1, right: 1, bottom: 1, left: 1 },
      padding: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 }
    },
    dimensions: {
      width: 8.5,
      height: 11,
      margins: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
      orientation: 'portrait'
    },
    responsiveness: {
      mobile: 768,
      tablet: 1024,
      desktop: 1200,
      large: 1440
    },
    columns: {
      count: 1,
      widths: [100],
      gutters: 0,
      breakpoints: {
        mobile: 768,
        tablet: 1024,
        desktop: 1200,
        large: 1440
      }
    }
  },
  styling: {
    fonts: {
      heading: {
        name: 'Georgia',
        stack: ['Georgia', 'Times New Roman', 'serif'],
        weights: [
          { weight: 300, name: 'Light' },
          { weight: 400, name: 'Regular' },
          { weight: 700, name: 'Bold' }
        ]
      },
      body: {
        name: 'Arial',
        stack: ['Arial', 'Helvetica', 'sans-serif'],
        weights: [
          { weight: 400, name: 'Regular' },
          { weight: 600, name: 'Semibold' }
        ]
      },
      accents: {
        name: 'Georgia',
        stack: ['Georgia', 'Times New Roman', 'serif'],
        weights: [
          { weight: 600, name: 'Semibold' },
          { weight: 700, name: 'Bold' }
        ]
      },
      fallbacks: [
        { category: 'serif', fonts: ['Georgia', 'Times New Roman', 'serif'] },
        { category: 'sans-serif', fonts: ['Arial', 'Helvetica', 'sans-serif'] }
      ]
    },
    colors: {
      primary: {
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
        accent: '#22c55e'
      },
      background: {
        primary: '#ffffff',
        secondary: '#f8fafc',
        tertiary: '#f1f5f9',
        accent: '#f0fdf4'
      },
      semantic: {
        success: '#22c55e',
        warning: '#eab308',
        error: '#ef4444',
        info: '#3b82f6'
      }
    },
    sizes: {
      heading: {
        h1: 42,
        h2: 32,
        h3: 24,
        h4: 20,
        h5: 18,
        h6: 16
      },
      body: {
        xs: 12,
        sm: 14,
        base: 16,
        lg: 18,
        xl: 20,
        '2xl': 22,
        '3xl': 24
      },
      spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        '2xl': 48,
        '3xl': 64
      },
      borders: {
        none: 0,
        sm: 1,
        md: 2,
        lg: 3,
        xl: 4
      }
    },
    effects: {
      shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
      },
      borderRadius: {
        none: 0,
        sm: 2,
        md: 4,
        lg: 6,
        xl: 8,
        full: 9999
      },
      transitions: {
        fast: '150ms',
        normal: '250ms',
        slow: '350ms',
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
      },
      animations: {
        fadeIn: 'fadeIn 0.3s ease-in-out',
        slideIn: 'slideIn 0.3s ease-out',
        bounce: 'bounce 0.5s ease-in-out',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      }
    },
    branding: {}
  },
  sections: [
    {
      id: 'personal-info',
      name: 'Contact Information',
      type: 'personal-info' as any,
      required: true,
      order: 1,
      styling: {
        showDates: false,
        showLocation: true,
        showDuration: false,
        bulletPoints: false,
        compact: false
      },
      layout: {
        columns: 1,
        itemSpacing: 8,
        alignment: 'center',
        orientation: 'vertical',
        wrap: false
      },
      content: {
        fields: [
          {
            id: 'fullName',
            name: 'Full Name',
            type: 'text' as any,
            required: true,
            maxLength: 100,
            validation: [
              { type: 'required' as any, message: 'Full name is required' },
              { type: 'min-length' as any, min: 2, message: 'Name must be at least 2 characters' }
            ],
            formatting: { titleCase: true }
          },
          {
            id: 'title',
            name: 'Professional Title',
            type: 'text' as any,
            required: true,
            maxLength: 150,
            validation: [
              { type: 'required' as any, message: 'Professional title is required' }
            ],
            formatting: { titleCase: true }
          },
          {
            id: 'email',
            name: 'Email',
            type: 'email' as any,
            required: true,
            validation: [
              { type: 'required' as any, message: 'Email is required' },
              { type: 'email' as any, message: 'Please enter a valid email address' }
            ]
          },
          {
            id: 'phone',
            name: 'Phone',
            type: 'phone' as any,
            required: true,
            validation: [
              { type: 'required' as any, message: 'Phone number is required' },
              { type: 'phone' as any, message: 'Please enter a valid phone number' }
            ],
            formatting: { phoneFormat: '(+1) XXX-XXX-XXXX' }
          },
          {
            id: 'location',
            name: 'Location',
            type: 'text' as any,
            required: true,
            maxLength: 100,
            validation: [
              { type: 'required' as any, message: 'Location is required' }
            ]
          },
          {
            id: 'linkedin',
            name: 'LinkedIn URL',
            type: 'url' as any,
            required: false,
            validation: [
              { type: 'url' as any, message: 'Please enter a valid URL' }
            ]
          }
        ],
        placeholders: {
          title: 'Chief Executive Officer',
          description: 'Results-driven executive with 15+ years of leadership experience',
          achievements: [
            'Led organization through 300% revenue growth',
            'Managed team of 500+ employees across 10 countries',
            'Secured $50M in Series C funding'
          ]
        },
        formatting: {
          autoCapitalization: true,
          bulletPointFormatting: true,
          dateFormatting: true,
          phoneFormatting: true,
          urlFormatting: true
        }
      },
      validation: {
        required: ['fullName', 'title', 'email', 'phone', 'location'],
        optional: ['linkedin', 'website'],
        format: [],
        content: []
      },
      visibility: {
        default: true,
        userOverride: true
      }
    },
    {
      id: 'summary',
      name: 'Executive Summary',
      type: 'summary' as any,
      required: true,
      order: 2,
      styling: {
        showDates: false,
        showLocation: false,
        showDuration: false,
        bulletPoints: true,
        maxItems: 5,
        compact: false
      },
      layout: {
        columns: 1,
        itemSpacing: 12,
        alignment: 'left',
        orientation: 'vertical',
        wrap: false
      },
      content: {
        fields: [
          {
            id: 'summary',
            name: 'Executive Summary',
            type: 'textarea' as any,
            required: true,
            maxLength: 500,
            validation: [
              { type: 'required' as any, message: 'Executive summary is required' },
              { type: 'min-length' as any, min: 50, message: 'Summary should be at least 50 characters' }
            ]
          }
        ],
        placeholders: {
          title: 'Executive Summary',
          description: 'Seasoned executive with proven track record of driving growth and innovation',
          achievements: [
            'Strategic leader with 15+ years of C-level experience',
            'Expert in turnaround management and organizational development',
            'Passionate about building high-performance teams and fostering innovation'
          ]
        },
        formatting: {
          autoCapitalization: true,
          bulletPointFormatting: true,
          dateFormatting: false,
          phoneFormatting: false,
          urlFormatting: false
        }
      },
      validation: {
        required: ['summary'],
        optional: [],
        format: [],
        content: []
      },
      visibility: {
        default: true,
        userOverride: true
      }
    },
    {
      id: 'experience',
      name: 'Executive Experience',
      type: 'experience' as any,
      required: true,
      order: 3,
      styling: {
        showDates: true,
        showLocation: true,
        showDuration: true,
        bulletPoints: true,
        maxItems: 6,
        compact: false
      },
      layout: {
        columns: 1,
        itemSpacing: 24,
        alignment: 'left',
        orientation: 'vertical',
        wrap: false
      },
      content: {
        fields: [
          {
            id: 'position',
            name: 'Position',
            type: 'text' as any,
            required: true,
            maxLength: 150,
            validation: [
              { type: 'required' as any, message: 'Position is required' }
            ],
            formatting: { titleCase: true }
          },
          {
            id: 'company',
            name: 'Company',
            type: 'text' as any,
            required: true,
            maxLength: 150,
            validation: [
              { type: 'required' as any, message: 'Company is required' }
            ]
          },
          {
            id: 'location',
            name: 'Location',
            type: 'text' as any,
            required: true,
            maxLength: 100,
            validation: [
              { type: 'required' as any, message: 'Location is required' }
            ]
          },
          {
            id: 'startDate',
            name: 'Start Date',
            type: 'date' as any,
            required: true,
            validation: [
              { type: 'required' as any, message: 'Start date is required' }
            ],
            formatting: { dateFormat: 'MMMM YYYY' }
          },
          {
            id: 'endDate',
            name: 'End Date',
            type: 'date' as any,
            required: false,
            validation: [],
            formatting: { dateFormat: 'MMMM YYYY' }
          },
          {
            id: 'current',
            name: 'Current Position',
            type: 'boolean' as any,
            required: false
          },
          {
            id: 'description',
            name: 'Description',
            type: 'textarea' as any,
            required: true,
            maxLength: 1000,
            validation: [
              { type: 'required' as any, message: 'Description is required' }
            ]
          },
          {
            id: 'achievements',
            name: 'Key Achievements',
            type: 'textarea' as any,
            required: true,
            maxLength: 1500,
            validation: [
              { type: 'required' as any, message: 'Key achievements are required' }
            ]
          }
        ],
        placeholders: {
          title: 'Chief Executive Officer',
          description: 'Led strategic vision and operational excellence for $500M technology company',
          achievements: [
            'Increased revenue by 300% through strategic acquisitions and product innovation',
            'Reduced operational costs by 25% while improving service quality',
            'Expanded market presence to 15 new countries',
            'Built and mentored executive team resulting in 95% retention rate'
          ]
        },
        formatting: {
          autoCapitalization: true,
          bulletPointFormatting: true,
          dateFormatting: true,
          phoneFormatting: false,
          urlFormatting: false
        }
      },
      validation: {
        required: ['position', 'company', 'location', 'startDate', 'description', 'achievements'],
        optional: ['endDate', 'current'],
        format: [],
        content: []
      },
      visibility: {
        default: true,
        userOverride: true
      }
    },
    {
      id: 'education',
      name: 'Education',
      type: 'education' as any,
      required: true,
      order: 4,
      styling: {
        showDates: true,
        showLocation: true,
        showDuration: false,
        bulletPoints: false,
        maxItems: 4,
        compact: true
      },
      layout: {
        columns: 1,
        itemSpacing: 16,
        alignment: 'left',
        orientation: 'vertical',
        wrap: false
      },
      content: {
        fields: [
          {
            id: 'degree',
            name: 'Degree',
            type: 'text' as any,
            required: true,
            maxLength: 200,
            validation: [
              { type: 'required' as any, message: 'Degree is required' }
            ],
            formatting: { titleCase: true }
          },
          {
            id: 'institution',
            name: 'Institution',
            type: 'text' as any,
            required: true,
            maxLength: 200,
            validation: [
              { type: 'required' as any, message: 'Institution is required' }
            ]
          },
          {
            id: 'location',
            name: 'Location',
            type: 'text' as any,
            required: true,
            maxLength: 100,
            validation: [
              { type: 'required' as any, message: 'Location is required' }
            ]
          },
          {
            id: 'graduationYear',
            name: 'Graduation Year',
            type: 'date' as any,
            required: true,
            validation: [
              { type: 'required' as any, message: 'Graduation year is required' }
            ],
            formatting: { dateFormat: 'YYYY' }
          }
        ],
        placeholders: {
          title: 'Master of Business Administration (MBA)',
          description: 'Harvard Business School',
          achievements: [
            'Graduated with Distinction (Top 10%)',
            'President of the Investment Club',
            'Dean\'s List all semesters'
          ]
        },
        formatting: {
          autoCapitalization: true,
          bulletPointFormatting: true,
          dateFormatting: true,
          phoneFormatting: false,
          urlFormatting: false
        }
      },
      validation: {
        required: ['degree', 'institution', 'location', 'graduationYear'],
        optional: [],
        format: [],
        content: []
      },
      visibility: {
        default: true,
        userOverride: true
      }
    },
    {
      id: 'skills',
      name: 'Leadership Competencies',
      type: 'skills' as any,
      required: true,
      order: 5,
      styling: {
        showDates: false,
        showLocation: false,
        showDuration: false,
        bulletPoints: false,
        maxItems: 12,
        showLevel: true,
        compact: true
      },
      layout: {
        columns: 3,
        itemSpacing: 8,
        alignment: 'left',
        orientation: 'horizontal',
        wrap: true
      },
      content: {
        fields: [
          {
            id: 'skills',
            name: 'Skills',
            type: 'multi-select' as any,
            required: true,
            validation: [
              { type: 'required' as any, message: 'At least one skill is required' }
            ]
          }
        ],
        placeholders: {
          title: 'Leadership Competencies',
          description: 'Strategic Planning, Change Management, Team Leadership',
          achievements: [
            'Strategic Planning & Execution',
            'Change Management & Transformation',
            'Financial Acumen & P&L Management',
            'Team Building & Leadership Development',
            'Stakeholder Management & Communication',
            'Business Development & Growth Strategy'
          ]
        },
        formatting: {
          autoCapitalization: true,
          bulletPointFormatting: false,
          dateFormatting: false,
          phoneFormatting: false,
          urlFormatting: false
        }
      },
      validation: {
        required: ['skills'],
        optional: [],
        format: [],
        content: []
      },
      visibility: {
        default: true,
        userOverride: true
      }
    },
    {
      id: 'certifications',
      name: 'Certifications & Awards',
      type: 'certifications' as any,
      required: false,
      order: 6,
      styling: {
        showDates: true,
        showLocation: false,
        showDuration: false,
        bulletPoints: false,
        maxItems: 6,
        compact: true
      },
      layout: {
        columns: 1,
        itemSpacing: 12,
        alignment: 'left',
        orientation: 'vertical',
        wrap: false
      },
      content: {
        fields: [
          {
            id: 'name',
            name: 'Certification/Award Name',
            type: 'text' as any,
            required: true,
            maxLength: 200,
            validation: [
              { type: 'required' as any, message: 'Certification name is required' }
            ]
          },
          {
            id: 'issuer',
            name: 'Issuing Organization',
            type: 'text' as any,
            required: true,
            maxLength: 200,
            validation: [
              { type: 'required' as any, message: 'Issuing organization is required' }
            ]
          },
          {
            id: 'date',
            name: 'Date',
            type: 'date' as any,
            required: true,
            validation: [
              { type: 'required' as any, message: 'Date is required' }
            ],
            formatting: { dateFormat: 'MMMM YYYY' }
          }
        ],
        placeholders: {
          title: 'Certified Executive Coach',
          description: 'International Coach Federation (ICF)',
          achievements: [
            'Forbes Executive Council Member',
            'Ernst & Young Entrepreneur of the Year',
            'Best CEO - Business Journal Awards'
          ]
        },
        formatting: {
          autoCapitalization: true,
          bulletPointFormatting: false,
          dateFormatting: true,
          phoneFormatting: false,
          urlFormatting: false
        }
      },
      validation: {
        required: ['name', 'issuer', 'date'],
        optional: [],
        format: [],
        content: []
      },
      visibility: {
        default: true,
        userOverride: true
      }
    },
    {
      id: 'languages',
      name: 'Languages',
      type: 'languages' as any,
      required: false,
      order: 7,
      styling: {
        showDates: false,
        showLocation: false,
        showDuration: false,
        bulletPoints: false,
        maxItems: 5,
        compact: true
      },
      layout: {
        columns: 2,
        itemSpacing: 8,
        alignment: 'left',
        orientation: 'horizontal',
        wrap: true
      },
      content: {
        fields: [
          {
            id: 'languages',
            name: 'Languages',
            type: 'multi-select' as any,
            required: false,
            validation: []
          }
        ],
        placeholders: {
          title: 'Languages',
          description: 'English (Native), Spanish (Fluent), French (Professional)',
          achievements: [
            'English (Native)',
            'Spanish (Fluent)',
            'Mandarin (Professional)',
            'French (Professional)'
          ]
        },
        formatting: {
          autoCapitalization: true,
          bulletPointFormatting: false,
          dateFormatting: false,
          phoneFormatting: false,
          urlFormatting: false
        }
      },
      validation: {
        required: [],
        optional: ['languages'],
        format: [],
        content: []
      },
      visibility: {
        default: false,
        userOverride: true
      }
    }
  ],
  features: {
    ...DEFAULT_FEATURES,
    atsOptimized: true,
    mobileOptimized: true,
    printOptimized: true,
    accessibilityFeatures: {
      wcagCompliant: true,
      screenReaderOptimized: true,
      keyboardNavigable: true,
      highContrastMode: true,
      fontScaling: true
    },
    interactiveFeatures: {
      livePreview: true,
      realTimeUpdates: true,
      dragAndDrop: false,
      collapsibleSections: false,
      expandableContent: false
    },
    premiumFeatures: {
      advancedCustomization: false,
      multipleLayouts: false,
      customSections: false,
      brandColors: false,
      prioritySupport: false
    }
  },
  atsOptimization: {
    ...DEFAULT_ATS_OPTIMIZATION,
    formatCompliance: true,
    keywordDensity: {
      enabled: true,
      targetDensity: 2.5,
      suggestions: [],
      analysis: {
        density: 0,
        relevance: 0,
        placement: [],
        missing: [],
        overused: []
      }
    },
    structureValidation: {
      strictMode: true,
      requiredSections: ['personal-info', 'summary', 'experience', 'education', 'skills'],
      prohibitedElements: ['tables', 'columns', 'images', 'headers', 'footers'],
      sectionOrder: ['personal-info', 'summary', 'experience', 'education', 'skills'],
      formatting: {
        autoCapitalization: true,
        bulletPointFormatting: true,
        dateFormatting: true,
        phoneFormatting: true,
        urlFormatting: true
      }
    },
    fontOptimization: {
      approvedFonts: ['Arial', 'Calibri', 'Georgia', 'Helvetica', 'Times New Roman'],
      prohibitedFonts: ['Comic Sans', 'Brush Script', 'Papyrus'],
      minimumSize: 11,
      maximumVariants: 3,
      fallbackRequired: true
    },
    marginGuidelines: {
      minimum: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
      maximum: { top: 1.5, right: 1.5, bottom: 1.5, left: 1.5 },
      recommended: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
      units: 'inches'
    },
    sectionOrdering: {
      sections: ['personal-info', 'summary', 'experience', 'education', 'skills', 'certifications'],
      reasoning: 'Executive resume format with summary first, followed by experience, education, and skills',
      flexibility: 60,
      industrySpecific: [
        {
          industry: 'technology',
          sections: ['personal-info', 'summary', 'experience', 'skills', 'education', 'certifications'],
          reasoning: 'Tech industry values skills and certifications more'
        },
        {
          industry: 'finance',
          sections: ['personal-info', 'summary', 'experience', 'education', 'certifications', 'skills'],
          reasoning: 'Finance industry emphasizes education and certifications'
        }
      ]
    },
    testing: {
      lastTested: new Date(),
      score: 98,
      parser: 'Resume Parser v2.1',
      issues: [],
      recommendations: ['Consider adding more quantifiable achievements', 'Ensure consistent formatting throughout']
    }
  },
  customization: {
    colors: {
      themes: [],
      customColors: [],
      currentTheme: 'executive',
      allowCustom: true
    },
    fonts: {
      families: [],
      sizes: {
        heading: [36, 38, 40, 42, 44, 46],
        body: [14, 15, 16, 17, 18],
        scale: 1
      },
      weights: {
        heading: [300, 400, 600, 700],
        body: [400, 600]
      },
      lineHeight: {
        tight: 1.4,
        normal: 1.6,
        relaxed: 1.8
      }
    },
    layout: {
      spacing: {
        section: 32,
        item: 16,
        line: 1.6,
        scale: 1
      },
      margins: {
        top: 1,
        right: 1,
        bottom: 1,
        left: 1,
        scale: 1
      },
      columns: {
        count: 1,
        widths: [100],
        gutters: 0
      },
      alignment: {
        header: 'center',
        sections: 'left',
        content: 'left'
      }
    },
    sections: {
      visibility: [
        { sectionId: 'personal-info', visible: true },
        { sectionId: 'summary', visible: true },
        { sectionId: 'experience', visible: true },
        { sectionId: 'education', visible: true },
        { sectionId: 'skills', visible: true },
        { sectionId: 'certifications', visible: true },
        { sectionId: 'languages', visible: false }
      ],
      ordering: [
        { id: 'personal-info', name: 'Contact Information', required: true, order: 1, visible: true },
        { id: 'summary', name: 'Executive Summary', required: true, order: 2, visible: true },
        { id: 'experience', name: 'Executive Experience', required: true, order: 3, visible: true },
        { id: 'education', name: 'Education', required: true, order: 4, visible: true },
        { id: 'skills', name: 'Leadership Competencies', required: true, order: 5, visible: true },
        { id: 'certifications', name: 'Certifications & Awards', required: false, order: 6, visible: true },
        { id: 'languages', name: 'Languages', required: false, order: 7, visible: false }
      ],
      styling: []
    },
    branding: {
      logo: { enabled: false, url: '', size: 40, position: 'top-left' as any, opacity: 1 },
      watermark: { enabled: false, text: '', font: '', size: 12, color: '#cccccc', opacity: 0.3, position: 'center' as any, rotation: 0 },
      header: { showName: true, showContact: true, layout: 'classic' as any, styling: {} },
      footer: { showPageNumbers: true, showLastModified: false, showContact: false, text: '', styling: {} }
    },
    export: {
      formats: ['pdf' as any, 'docx' as any, 'html' as any],
      quality: {
        pdf: 'print' as any,
        images: 'high' as any,
        fonts: 'embedded' as any
      },
      options: {
        includeMetadata: false,
        includeComments: false,
        watermarks: false,
        passwordProtection: false,
        compression: true
      }
    }
  },
  metadata: {
    version: '1.0.0',
    author: 'JobFinders Template Team',
    created: new Date('2025-01-07'),
    updated: new Date('2025-01-07'),
    tags: ['executive', 'professional', 'conservative', 'leadership', 'c-suite', 'senior-management'],
    downloads: 0,
    rating: 0,
    reviews: 0,
    compatibility: [
      { browser: 'Chrome', version: '90+', supported: true },
      { browser: 'Firefox', version: '88+', supported: true },
      { browser: 'Safari', version: '14+', supported: true },
      { browser: 'Edge', version: '90+', supported: true }
    ],
    requirements: {
      minBrowserVersion: 'Chrome 90+',
      features: ['CSS Grid', 'Flexbox', 'Custom Properties'],
      limitations: ['No support for IE11']
    },
    license: {
      type: 'free' as any,
      restrictions: ['No redistribution', 'No commercial resale'],
      attribution: true,
      commercialUse: true,
      modification: false
    }
  }
};