/**
 * Professional Minimal Template
 *
 * A clean, spacious single-column template designed for conservative roles.
 * Features minimal styling, generous whitespace, and focus on content clarity.
 */

import React from 'react';
import { ResumeTemplate, TemplateCategory, DEFAULT_LAYOUT, DEFAULT_STYLING, DEFAULT_FEATURES, DEFAULT_ATS_OPTIMIZATION } from '@/types/template';

export const ProfessionalMinimalTemplate: ResumeTemplate = {
  id: 'professional-minimal',
  name: 'Professional Minimal',
  description: 'Clean and spacious single-column template with minimal styling, perfect for conservative roles and industries that value clarity.',
  category: TemplateCategory.PROFESSIONAL,
  subcategory: 'minimal',
  preview: {
    thumbnail: '/assets/templates/professional/professional-minimal-thumbnail.jpg',
    large: '/assets/templates/professional/professional-minimal-large.jpg',
    mobile: '/assets/templates/professional/professional-minimal-mobile.jpg'
  },
  layout: {
    ...DEFAULT_LAYOUT,
    format: 'single-column' as any,
    headerStyle: 'left-aligned' as any,
    sectionOrder: [
      { id: 'personal-info', name: 'Name and Contact', required: true, order: 1, visible: true },
      { id: 'summary', name: 'Summary', required: true, order: 2, visible: true },
      { id: 'experience', name: 'Experience', required: true, order: 3, visible: true },
      { id: 'education', name: 'Education', required: true, order: 4, visible: true },
      { id: 'skills', name: 'Skills', required: true, order: 5, visible: true },
      { id: 'certifications', name: 'Certifications', required: false, order: 6, visible: true }
    ],
    spacing: {
      section: 40,
      item: 20,
      line: 1.7,
      margin: { top: 1.2, right: 1.2, bottom: 1.2, left: 1.2 },
      padding: { top: 0, right: 0, bottom: 0, left: 0 }
    },
    dimensions: {
      width: 8.5,
      height: 11,
      margins: { top: 1.2, right: 1.2, bottom: 1.2, left: 1.2 },
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
        name: 'Helvetica',
        stack: ['Helvetica', 'Arial', 'sans-serif'],
        weights: [
          { weight: 300, name: 'Light' },
          { weight: 400, name: 'Regular' },
          { weight: 600, name: 'Semibold' }
        ]
      },
      body: {
        name: 'Arial',
        stack: ['Arial', 'Helvetica', 'sans-serif'],
        weights: [
          { weight: 400, name: 'Regular' }
        ]
      },
      accents: {
        name: 'Helvetica',
        stack: ['Helvetica', 'Arial', 'sans-serif'],
        weights: [
          { weight: 600, name: 'Semibold' }
        ]
      },
      fallbacks: [
        { category: 'sans-serif', fonts: ['Arial', 'Helvetica', 'sans-serif'] },
        { category: 'serif', fonts: ['Times New Roman', 'Georgia', 'serif'] }
      ]
    },
    colors: {
      primary: {
        50: '#fafafa',
        100: '#f5f5f5',
        200: '#e5e5e5',
        300: '#d4d4d4',
        400: '#a3a3a3',
        500: '#737373',
        600: '#525252',
        700: '#404040',
        800: '#262626',
        900: '#171717'
      },
      secondary: {
        50: '#fafafa',
        100: '#f4f4f5',
        200: '#e4e4e7',
        300: '#d4d4d8',
        400: '#a1a1aa',
        500: '#71717a',
        600: '#52525b',
        700: '#3f3f46',
        800: '#27272a',
        900: '#18181b'
      },
      accent: {
        50: '#fafafa',
        100: '#f4f4f5',
        200: '#e4e4e7',
        300: '#d4d4d8',
        400: '#a1a1aa',
        500: '#71717a',
        600: '#52525b',
        700: '#3f3f46',
        800: '#27272a',
        900: '#18181b'
      },
      text: {
        primary: '#171717',
        secondary: '#404040',
        tertiary: '#525252',
        inverse: '#ffffff',
        muted: '#737373',
        accent: '#404040'
      },
      background: {
        primary: '#ffffff',
        secondary: '#fafafa',
        tertiary: '#f5f5f5',
        accent: '#fafafa'
      },
      semantic: {
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6'
      }
    },
    sizes: {
      heading: {
        h1: 48,
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
        '2xl': 24,
        '3xl': 28
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
        sm: 0,
        md: 1,
        lg: 1,
        xl: 2
      }
    },
    effects: {
      shadows: {
        sm: 'none',
        md: 'none',
        lg: 'none',
        xl: 'none',
        inner: 'none'
      },
      borderRadius: {
        none: 0,
        sm: 0,
        md: 0,
        lg: 0,
        xl: 0,
        full: 0
      },
      transitions: {
        fast: '150ms',
        normal: '200ms',
        slow: '300ms',
        easing: 'ease'
      },
      animations: {
        fadeIn: 'fadeIn 0.2s ease',
        slideIn: 'slideIn 0.2s ease',
        bounce: 'none',
        pulse: 'none'
      }
    },
    branding: {}
  },
  sections: [
    {
      id: 'personal-info',
      name: 'Name and Contact',
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
        itemSpacing: 12,
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
            maxLength: 100,
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
            maxLength: 120,
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
            maxLength: 80,
            validation: [
              { type: 'required' as any, message: 'Location is required' }
            ]
          },
          {
            id: 'website',
            name: 'Website',
            type: 'url' as any,
            required: false,
            validation: [
              { type: 'url' as any, message: 'Please enter a valid URL' }
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
          title: 'Senior Project Manager',
          description: 'Experienced professional with 10+ years of project management expertise',
          achievements: [
            'Delivered 50+ projects on time and within budget',
            'Managed teams of up to 25 professionals',
            'Improved project delivery efficiency by 40%'
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
        optional: ['website', 'linkedin'],
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
      name: 'Summary',
      type: 'summary' as any,
      required: true,
      order: 2,
      styling: {
        showDates: false,
        showLocation: false,
        showDuration: false,
        bulletPoints: false,
        compact: false
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
            id: 'summary',
            name: 'Professional Summary',
            type: 'textarea' as any,
            required: true,
            maxLength: 600,
            validation: [
              { type: 'required' as any, message: 'Professional summary is required' },
              { type: 'min-length' as any, min: 50, message: 'Summary should be at least 50 characters' }
            ]
          }
        ],
        placeholders: {
          title: 'Professional Summary',
          description: 'Results-driven professional with proven expertise in project management and team leadership',
          achievements: [
            'Experienced Project Manager with 10+ years delivering successful projects across various industries',
            'Proven track record of managing complex projects from inception to completion',
            'Strong leadership skills with experience managing cross-functional teams',
            'Expertise in Agile, Waterfall, and hybrid project management methodologies'
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
      id: 'experience',
      name: 'Experience',
      type: 'experience' as any,
      required: true,
      order: 3,
      styling: {
        showDates: true,
        showLocation: true,
        showDuration: false,
        bulletPoints: true,
        maxItems: 6,
        compact: false
      },
      layout: {
        columns: 1,
        itemSpacing: 32,
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
            maxLength: 120,
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
            maxLength: 120,
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
            formatting: { dateFormat: 'Month YYYY' }
          },
          {
            id: 'endDate',
            name: 'End Date',
            type: 'date' as any,
            required: false,
            validation: [],
            formatting: { dateFormat: 'Month YYYY' }
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
            maxLength: 1200,
            validation: [
              { type: 'required' as any, message: 'Description is required' }
            ]
          }
        ],
        placeholders: {
          title: 'Senior Project Manager',
          description: 'Led cross-functional teams to deliver complex technology projects on time and within budget',
          achievements: [
            'Managed portfolio of 15+ concurrent projects with total budget of $10M',
            'Implemented Agile methodologies resulting in 30% improvement in delivery time',
            'Led team of 12 project managers and 50+ team members',
            'Developed and implemented project management frameworks adopted company-wide',
            'Achieved 95% on-time delivery rate and 98% client satisfaction score',
            'Reduced project overhead costs by 25% through process optimization'
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
      order: 4,
      styling: {
        showDates: true,
        showLocation: true,
        showDuration: false,
        bulletPoints: false,
        maxItems: 4,
        compact: false
      },
      layout: {
        columns: 1,
        itemSpacing: 20,
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
          },
          {
            id: 'gpa',
            name: 'GPA',
            type: 'text' as any,
            required: false,
            maxLength: 10,
            validation: []
          }
        ],
        placeholders: {
          title: 'Master of Business Administration',
          description: 'Stanford University',
          achievements: [
            'Graduated with Honors (GPA: 3.8/4.0)',
            'Beta Gamma Sigma Honor Society',
            'Student Government Association President'
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
        optional: ['gpa'],
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
      name: 'Skills',
      type: 'skills' as any,
      required: true,
      order: 5,
      styling: {
        showDates: false,
        showLocation: false,
        showDuration: false,
        bulletPoints: false,
        maxItems: 12,
        compact: false
      },
      layout: {
        columns: 3,
        itemSpacing: 12,
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
          title: 'Professional Skills',
          description: 'Project Management, Leadership, Communication, Problem Solving',
          achievements: [
            'Project Management',
            'Team Leadership',
            'Agile Methodologies',
            'Risk Management',
            'Budget Management',
            'Stakeholder Communication',
            'Process Improvement',
            'Strategic Planning',
            'Quality Assurance',
            'Vendor Management',
            'Microsoft Project',
            'JIRA'
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
      name: 'Certifications',
      type: 'certifications' as any,
      required: false,
      order: 6,
      styling: {
        showDates: true,
        showLocation: false,
        showDuration: false,
        bulletPoints: false,
        maxItems: 5,
        compact: false
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
            id: 'name',
            name: 'Certification Name',
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
            formatting: { dateFormat: 'Month YYYY' }
          }
        ],
        placeholders: {
          title: 'Project Management Professional',
          description: 'Project Management Institute (PMI)',
          achievements: [
            'Project Management Professional (PMP)',
            'Certified ScrumMaster (CSM)',
            'ITIL Foundation Certification',
            'Six Sigma Green Belt'
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
      targetDensity: 2.0,
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
      prohibitedElements: ['tables', 'columns', 'images', 'headers', 'footers', 'shadows', 'borders'],
      sectionOrder: ['personal-info', 'summary', 'experience', 'education', 'skills'],
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
      prohibitedFonts: ['Comic Sans', 'Brush Script', 'Papyrus', 'Decorative fonts'],
      minimumSize: 11,
      maximumVariants: 2,
      fallbackRequired: true
    },
    marginGuidelines: {
      minimum: { top: 1.0, right: 1.0, bottom: 1.0, left: 1.0 },
      maximum: { top: 1.5, right: 1.5, bottom: 1.5, left: 1.5 },
      recommended: { top: 1.2, right: 1.2, bottom: 1.2, left: 1.2 },
      units: 'inches'
    },
    sectionOrdering: {
      sections: ['personal-info', 'summary', 'experience', 'education', 'skills', 'certifications'],
      reasoning: 'Clean chronological format with minimal visual elements for maximum ATS compatibility',
      flexibility: 80,
      industrySpecific: [
        {
          industry: 'technology',
          sections: ['personal-info', 'summary', 'experience', 'skills', 'education', 'certifications'],
          reasoning: 'Tech industry values skills before education'
        },
        {
          industry: 'healthcare',
          sections: ['personal-info', 'summary', 'education', 'experience', 'certifications', 'skills'],
          reasoning: 'Healthcare emphasizes education and credentials'
        }
      ]
    },
    testing: {
      lastTested: new Date(),
      score: 99,
      parser: 'Resume Parser v2.1',
      issues: [],
      recommendations: ['Maintain clean formatting throughout', 'Use consistent bullet points']
    }
  },
  customization: {
    colors: {
      themes: [],
      customColors: [],
      currentTheme: 'minimal',
      allowCustom: true
    },
    fonts: {
      families: [],
      sizes: {
        heading: [40, 44, 48, 52, 56],
        body: [14, 15, 16, 17, 18],
        scale: 1
      },
      weights: {
        heading: [300, 400, 600],
        body: [400]
      },
      lineHeight: {
        tight: 1.5,
        normal: 1.7,
        relaxed: 1.9
      }
    },
    layout: {
      spacing: {
        section: 40,
        item: 20,
        line: 1.7,
        scale: 1
      },
      margins: {
        top: 1.2,
        right: 1.2,
        bottom: 1.2,
        left: 1.2,
        scale: 1
      },
      columns: {
        count: 1,
        widths: [100],
        gutters: 0
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
        { sectionId: 'experience', visible: true },
        { sectionId: 'education', visible: true },
        { sectionId: 'skills', visible: true },
        { sectionId: 'certifications', visible: true }
      ],
      ordering: [
        { id: 'personal-info', name: 'Name and Contact', required: true, order: 1, visible: true },
        { id: 'summary', name: 'Summary', required: true, order: 2, visible: true },
        { id: 'experience', name: 'Experience', required: true, order: 3, visible: true },
        { id: 'education', name: 'Education', required: true, order: 4, visible: true },
        { id: 'skills', name: 'Skills', required: true, order: 5, visible: true },
        { id: 'certifications', name: 'Certifications', required: false, order: 6, visible: true }
      ],
      styling: []
    },
    branding: {
      logo: { enabled: false, url: '', size: 24, position: 'top-left' as any, opacity: 1 },
      watermark: { enabled: false, text: '', font: '', size: 8, color: '#f0f0f0', opacity: 0.1, position: 'center' as any, rotation: 0 },
      header: { showName: true, showContact: true, layout: 'minimal' as any, styling: {} },
      footer: { showPageNumbers: false, showLastModified: false, showContact: false, text: '', styling: {} }
    },
    export: {
      formats: ['pdf' as any, 'docx' as any, 'html' as any],
      quality: {
        pdf: 'print' as any,
        images: 'compressed' as any,
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
    tags: ['minimal', 'professional', 'clean', 'conservative', 'spacious', 'readable'],
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
      features: ['Basic CSS', 'Flexbox'],
      limitations: ['No advanced CSS features required']
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