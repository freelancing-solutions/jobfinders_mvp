/**
 * Corporate Classic Template
 *
 * A traditional two-column template designed for corporate environments.
 * Features a left-aligned header, sidebar layout, and conservative business styling.
 */

import React from 'react';
import { ResumeTemplate, TemplateCategory, DEFAULT_LAYOUT, DEFAULT_STYLING, DEFAULT_FEATURES, DEFAULT_ATS_OPTIMIZATION } from '@/types/template';

export const CorporateClassicTemplate: ResumeTemplate = {
  id: 'corporate-classic',
  name: 'Corporate Classic',
  description: 'Traditional two-column template perfect for corporate roles with left-aligned header and professional business styling.',
  category: TemplateCategory.PROFESSIONAL,
  subcategory: 'corporate',
  preview: {
    thumbnail: '/assets/templates/professional/corporate-classic-thumbnail.jpg',
    large: '/assets/templates/professional/corporate-classic-large.jpg',
    mobile: '/assets/templates/professional/corporate-classic-mobile.jpg'
  },
  layout: {
    ...DEFAULT_LAYOUT,
    format: 'two-column' as any,
    headerStyle: 'left-aligned' as any,
    sectionOrder: [
      { id: 'personal-info', name: 'Contact Information', required: true, order: 1, visible: true },
      { id: 'summary', name: 'Professional Summary', required: true, order: 2, visible: true },
      { id: 'sidebar', name: 'Skills & Information', required: true, order: 3, visible: true },
      { id: 'experience', name: 'Work Experience', required: true, order: 4, visible: true },
      { id: 'education', name: 'Education', required: true, order: 5, visible: true },
      { id: 'certifications', name: 'Certifications', required: false, order: 6, visible: true }
    ],
    spacing: {
      section: 24,
      item: 12,
      line: 1.5,
      margin: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
      padding: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 }
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
      count: 2,
      widths: [35, 65], // 35% sidebar, 65% main content
      gutters: 20,
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
        name: 'Calibri',
        stack: ['Calibri', 'Arial', 'Helvetica', 'sans-serif'],
        weights: [
          { weight: 400, name: 'Regular' },
          { weight: 600, name: 'Semibold' },
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
        name: 'Calibri',
        stack: ['Calibri', 'Arial', 'Helvetica', 'sans-serif'],
        weights: [
          { weight: 600, name: 'Semibold' },
          { weight: 700, name: 'Bold' }
        ]
      },
      fallbacks: [
        { category: 'sans-serif', fonts: ['Arial', 'Helvetica', 'sans-serif'] },
        { category: 'serif', fonts: ['Times New Roman', 'Georgia', 'serif'] }
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
        50: '#f0f9ff',
        100: '#e0f2fe',
        200: '#bae6fd',
        300: '#7dd3fc',
        400: '#38bdf8',
        500: '#0ea5e9',
        600: '#0284c7',
        700: '#0369a1',
        800: '#075985',
        900: '#0c4a6e'
      },
      accent: {
        50: '#fdf4ff',
        100: '#fae8ff',
        200: '#f5d0fe',
        300: '#f0abfc',
        400: '#e879f9',
        500: '#d946ef',
        600: '#c026d3',
        700: '#a21caf',
        800: '#86198f',
        900: '#701a75'
      },
      text: {
        primary: '#1e293b',
        secondary: '#475569',
        tertiary: '#64748b',
        inverse: '#ffffff',
        muted: '#94a3b8',
        accent: '#0ea5e9'
      },
      background: {
        primary: '#ffffff',
        secondary: '#f8fafc',
        tertiary: '#f1f5f9',
        accent: '#f0f9ff'
      },
      semantic: {
        success: '#0ea5e9',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6'
      }
    },
    sizes: {
      heading: {
        h1: 36,
        h2: 28,
        h3: 22,
        h4: 18,
        h5: 16,
        h6: 14
      },
      body: {
        xs: 11,
        sm: 12,
        base: 13,
        lg: 14,
        xl: 15,
        '2xl': 16,
        '3xl': 18
      },
      spacing: {
        xs: 2,
        sm: 4,
        md: 8,
        lg: 12,
        xl: 16,
        '2xl': 20,
        '3xl': 24
      },
      borders: {
        none: 0,
        sm: 1,
        md: 1,
        lg: 2,
        xl: 2
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
        md: 3,
        lg: 4,
        xl: 6,
        full: 9999
      },
      transitions: {
        fast: '100ms',
        normal: '200ms',
        slow: '300ms',
        easing: 'ease-in-out'
      },
      animations: {
        fadeIn: 'fadeIn 0.2s ease-in-out',
        slideIn: 'slideIn 0.2s ease-out',
        bounce: 'bounce 0.3s ease-in-out',
        pulse: 'pulse 1.5s ease-in-out infinite'
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
        compact: true
      },
      layout: {
        columns: 1,
        itemSpacing: 6,
        alignment: 'left',
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
            maxLength: 80,
            validation: [
              { type: 'required' as any, message: 'Full name is required' },
              { type: 'min-length' as any, min: 2, message: 'Name must be at least 2 characters' }
            ],
            formatting: { uppercase: false, titleCase: true }
          },
          {
            id: 'title',
            name: 'Professional Title',
            type: 'text' as any,
            required: true,
            maxLength: 100,
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
            formatting: { phoneFormat: '(XXX) XXX-XXXX' }
          },
          {
            id: 'location',
            name: 'Location',
            type: 'text' as any,
            required: true,
            maxLength: 60,
            validation: [
              { type: 'required' as any, message: 'Location is required' }
            ]
          },
          {
            id: 'linkedin',
            name: 'LinkedIn',
            type: 'url' as any,
            required: false,
            validation: [
              { type: 'url' as any, message: 'Please enter a valid URL' }
            ]
          }
        ],
        placeholders: {
          title: 'Senior Business Analyst',
          description: 'Results-driven professional with 8+ years of business analysis experience',
          achievements: [
            'Analyzed business requirements for enterprise software implementation',
            'Led cross-functional teams to deliver projects on time and budget',
            'Improved operational efficiency by 30% through process optimization'
          ]
        },
        formatting: {
          autoCapitalization: true,
          bulletPointFormatting: true,
          dateFormatting: true,
          phoneFormatting: true,
          urlFormatting: false
        }
      },
      validation: {
        required: ['fullName', 'title', 'email', 'phone', 'location'],
        optional: ['linkedin'],
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
      name: 'Professional Summary',
      type: 'summary' as any,
      required: true,
      order: 2,
      styling: {
        showDates: false,
        showLocation: false,
        showDuration: false,
        bulletPoints: false,
        compact: true
      },
      layout: {
        columns: 1,
        itemSpacing: 8,
        alignment: 'left',
        orientation: 'vertical',
        wrap: false
      },
      content: {
        fields: [
          {
            id: 'summary',
            name: 'Professional Summary',
            type: 'textarea' as any,
            required: true,
            maxLength: 400,
            validation: [
              { type: 'required' as any, message: 'Professional summary is required' },
              { type: 'min-length' as any, min: 30, message: 'Summary should be at least 30 characters' }
            ]
          }
        ],
        placeholders: {
          title: 'Professional Summary',
          description: 'Experienced business analyst with strong analytical skills and proven track record',
          achievements: [
            'Results-driven Business Analyst with 8+ years of experience in process improvement and requirements gathering',
            'Expertise in stakeholder management, data analysis, and project coordination',
            'Proven ability to translate complex business needs into technical solutions'
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
      id: 'sidebar',
      name: 'Skills & Information',
      type: 'skills' as any,
      required: true,
      order: 3,
      styling: {
        showDates: false,
        showLocation: false,
        showDuration: false,
        bulletPoints: true,
        maxItems: 15,
        compact: true
      },
      layout: {
        columns: 1,
        itemSpacing: 6,
        alignment: 'left',
        orientation: 'vertical',
        wrap: false
      },
      content: {
        fields: [
          {
            id: 'technicalSkills',
            name: 'Technical Skills',
            type: 'multi-select' as any,
            required: true,
            validation: [
              { type: 'required' as any, message: 'Technical skills are required' }
            ]
          },
          {
            id: 'businessSkills',
            name: 'Business Skills',
            type: 'multi-select' as any,
            required: true,
            validation: [
              { type: 'required' as any, message: 'Business skills are required' }
            ]
          },
          {
            id: 'languages',
            name: 'Languages',
            type: 'multi-select' as any,
            required: false,
            validation: []
          },
          {
            id: 'certifications',
            name: 'Certifications',
            type: 'text' as any,
            required: false,
            maxLength: 300,
            validation: []
          }
        ],
        placeholders: {
          title: 'Skills & Qualifications',
          description: 'Technical expertise and business competencies',
          achievements: [
            'Technical: SQL, Python, Excel, Tableau, JIRA',
            'Business: Requirements Analysis, Stakeholder Management, Process Mapping',
            'Languages: English (Native), Spanish (Professional)',
            'Certifications: CBAP, PMP, Agile Certified'
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
        required: ['technicalSkills', 'businessSkills'],
        optional: ['languages', 'certifications'],
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
      name: 'Work Experience',
      type: 'experience' as any,
      required: true,
      order: 4,
      styling: {
        showDates: true,
        showLocation: true,
        showDuration: true,
        bulletPoints: true,
        maxItems: 6,
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
            id: 'position',
            name: 'Position',
            type: 'text' as any,
            required: true,
            maxLength: 100,
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
            maxLength: 100,
            validation: [
              { type: 'required' as any, message: 'Company is required' }
            ]
          },
          {
            id: 'location',
            name: 'Location',
            type: 'text' as any,
            required: true,
            maxLength: 80,
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
            formatting: { dateFormat: 'MMM YYYY' }
          },
          {
            id: 'endDate',
            name: 'End Date',
            type: 'date' as any,
            required: false,
            validation: [],
            formatting: { dateFormat: 'MMM YYYY' }
          },
          {
            id: 'current',
            name: 'Current Position',
            type: 'boolean' as any,
            required: false
          },
          {
            id: 'description',
            name: 'Description & Achievements',
            type: 'textarea' as any,
            required: true,
            maxLength: 800,
            validation: [
              { type: 'required' as any, message: 'Description is required' }
            ]
          }
        ],
        placeholders: {
          title: 'Senior Business Analyst',
          description: 'Led business analysis initiatives for enterprise software implementation project',
          achievements: [
            'Analyzed and documented business requirements for $2M software implementation',
            'Collaborated with cross-functional teams of 15+ stakeholders',
            'Identified and resolved process gaps, improving efficiency by 30%',
            'Created detailed functional specifications and user stories',
            'Conducted user acceptance testing and training for 200+ end users'
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
        required: ['position', 'company', 'location', 'startDate', 'description'],
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
      order: 5,
      styling: {
        showDates: true,
        showLocation: true,
        showDuration: false,
        bulletPoints: false,
        maxItems: 3,
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
            id: 'degree',
            name: 'Degree',
            type: 'text' as any,
            required: true,
            maxLength: 150,
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
            maxLength: 150,
            validation: [
              { type: 'required' as any, message: 'Institution is required' }
            ]
          },
          {
            id: 'location',
            name: 'Location',
            type: 'text' as any,
            required: true,
            maxLength: 80,
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
          title: 'Bachelor of Science in Business Administration',
          description: 'University of Texas at Austin',
          achievements: [
            'Graduated Magna Cum Laude (GPA: 3.8/4.0)',
            'Dean\'s List all semesters',
            'Business Analytics Club President'
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
      id: 'certifications',
      name: 'Certifications',
      type: 'certifications' as any,
      required: false,
      order: 6,
      styling: {
        showDates: true,
        showLocation: false,
        showDuration: false,
        bulletPoints: false,
        maxItems: 4,
        compact: true
      },
      layout: {
        columns: 1,
        itemSpacing: 8,
        alignment: 'left',
        orientation: 'vertical',
        wrap: false
      },
      content: {
        fields: [
          {
            id: 'name',
            name: 'Certification Name',
            type: 'text' as any,
            required: true,
            maxLength: 150,
            validation: [
              { type: 'required' as any, message: 'Certification name is required' }
            ]
          },
          {
            id: 'issuer',
            name: 'Issuing Organization',
            type: 'text' as any,
            required: true,
            maxLength: 150,
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
            formatting: { dateFormat: 'MMM YYYY' }
          }
        ],
        placeholders: {
          title: 'Certified Business Analysis Professional',
          description: 'International Institute of Business Analysis (IIBA)',
          achievements: [
            'Certified Business Analysis Professional (CBAP)',
            'Project Management Professional (PMP)',
            'Agile Certified Practitioner (PMI-ACP)'
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
      targetDensity: 2.2,
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
      prohibitedElements: ['tables', 'images', 'headers', 'footers'],
      sectionOrder: ['personal-info', 'summary', 'skills', 'experience', 'education'],
      formatting: {
        autoCapitalization: true,
        bulletPointFormatting: true,
        dateFormatting: true,
        phoneFormatting: true,
        urlFormatting: false
      }
    },
    fontOptimization: {
      approvedFonts: ['Arial', 'Calibri', 'Georgia', 'Helvetica', 'Times New Roman'],
      prohibitedFonts: ['Comic Sans', 'Brush Script', 'Papyrus'],
      minimumSize: 10,
      maximumVariants: 3,
      fallbackRequired: true
    },
    marginGuidelines: {
      minimum: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
      maximum: { top: 1.0, right: 1.0, bottom: 1.0, left: 1.0 },
      recommended: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
      units: 'inches'
    },
    sectionOrdering: {
      sections: ['personal-info', 'summary', 'sidebar', 'experience', 'education', 'certifications'],
      reasoning: 'Traditional corporate format with sidebar for skills, followed by experience and education',
      flexibility: 70,
      industrySpecific: [
        {
          industry: 'technology',
          sections: ['personal-info', 'summary', 'sidebar', 'experience', 'certifications', 'education'],
          reasoning: 'Tech industry values certifications more than education'
        },
        {
          industry: 'finance',
          sections: ['personal-info', 'summary', 'sidebar', 'experience', 'education', 'certifications'],
          reasoning: 'Finance industry maintains traditional structure'
        }
      ]
    },
    testing: {
      lastTested: new Date(),
      score: 96,
      parser: 'Resume Parser v2.1',
      issues: [],
      recommendations: ['Ensure consistent formatting in sidebar section', 'Consider adding more quantifiable achievements']
    }
  },
  customization: {
    colors: {
      themes: [],
      customColors: [],
      currentTheme: 'corporate',
      allowCustom: true
    },
    fonts: {
      families: [],
      sizes: {
        heading: [32, 34, 36, 38, 40],
        body: [11, 12, 13, 14, 15],
        scale: 1
      },
      weights: {
        heading: [400, 600, 700],
        body: [400, 600]
      },
      lineHeight: {
        tight: 1.3,
        normal: 1.5,
        relaxed: 1.7
      }
    },
    layout: {
      spacing: {
        section: 24,
        item: 12,
        line: 1.5,
        scale: 1
      },
      margins: {
        top: 0.75,
        right: 0.75,
        bottom: 0.75,
        left: 0.75,
        scale: 1
      },
      columns: {
        count: 2,
        widths: [35, 65],
        gutters: 20
      },
      alignment: {
        header: 'left',
        sections: 'left',
        content: 'left'
      }
    },
    sections: {
      visibility: [
        { sectionId: 'personal-info', visible: true },
        { sectionId: 'summary', visible: true },
        { sectionId: 'sidebar', visible: true },
        { sectionId: 'experience', visible: true },
        { sectionId: 'education', visible: true },
        { sectionId: 'certifications', visible: true }
      ],
      ordering: [
        { id: 'personal-info', name: 'Contact Information', required: true, order: 1, visible: true },
        { id: 'summary', name: 'Professional Summary', required: true, order: 2, visible: true },
        { id: 'sidebar', name: 'Skills & Information', required: true, order: 3, visible: true },
        { id: 'experience', name: 'Work Experience', required: true, order: 4, visible: true },
        { id: 'education', name: 'Education', required: true, order: 5, visible: true },
        { id: 'certifications', name: 'Certifications', required: false, order: 6, visible: true }
      ],
      styling: []
    },
    branding: {
      logo: { enabled: false, url: '', size: 32, position: 'top-left' as any, opacity: 1 },
      watermark: { enabled: false, text: '', font: '', size: 10, color: '#cccccc', opacity: 0.2, position: 'center' as any, rotation: 0 },
      header: { showName: true, showContact: true, layout: 'classic' as any, styling: {} },
      footer: { showPageNumbers: true, showLastModified: false, showContact: false, text: '', styling: {} }
    },
    export: {
      formats: ['pdf' as any, 'docx' as any, 'html' as any],
      quality: {
        pdf: 'print' as any,
        images: 'balanced' as any,
        fonts: 'subset' as any
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
    tags: ['corporate', 'professional', 'traditional', 'business', 'two-column', 'conservative'],
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