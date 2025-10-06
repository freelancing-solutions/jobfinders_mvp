/**
 * Executive Pro Template
 *
 * A sophisticated, ATS-optimized template designed for C-suite executives
 * and senior management positions. Features a clean, professional layout
 * with emphasis on leadership experience and strategic accomplishments.
 */

import { ResumeTemplate, TemplateCategory, LayoutFormat, HeaderStyle, SectionType } from '@/types/template';

export const ExecutiveProTemplate: ResumeTemplate = {
  id: 'executive-pro',
  name: 'Executive Pro',
  description: 'Sophisticated template designed for C-suite executives and senior leadership positions with emphasis on strategic impact and measurable results.',
  category: TemplateCategory.PROFESSIONAL,
  subcategory: 'executive',
  preview: {
    thumbnail: '/templates/professional/executive-pro-thumbnail.png',
    large: '/templates/professional/executive-pro-preview.png',
    animated: '/templates/professional/executive-pro-animated.gif'
  },
  layout: {
    format: LayoutFormat.SINGLE_COLUMN,
    headerStyle: HeaderStyle.CENTERED,
    sectionOrder: [
      { id: 'personal-info', name: 'Contact Information', required: true, order: 1, visible: true },
      { id: 'summary', name: 'Executive Summary', required: true, order: 2, visible: true },
      { id: 'experience', name: 'Executive Experience', required: true, order: 3, visible: true },
      { id: 'education', name: 'Education', required: true, order: 4, visible: true },
      { id: 'certifications', name: 'Certifications & Credentials', required: false, order: 5, visible: true },
      { id: 'skills', name: 'Core Competencies', required: true, order: 6, visible: true },
      { id: 'languages', name: 'Languages', required: false, order: 7, visible: true }
    ],
    spacing: {
      section: 28,
      item: 16,
      line: 1.6,
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
      count: 1,
      widths: [100],
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
        name: 'Georgia',
        stack: ['Georgia', 'Times New Roman', 'serif'],
        weights: [
          { weight: 400, name: 'Regular' },
          { weight: 700, name: 'Bold' }
        ]
      },
      body: {
        name: 'Arial',
        stack: ['Arial', 'Helvetica', 'sans-serif'],
        weights: [
          { weight: 400, name: 'Regular' },
          { weight: 700, name: 'Bold' }
        ]
      },
      accents: {
        name: 'Arial',
        stack: ['Arial', 'Helvetica', 'sans-serif'],
        weights: [
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
        50: '#fef2f2',
        100: '#fee2e2',
        200: '#fecaca',
        300: '#fca5a5',
        400: '#f87171',
        500: '#ef4444',
        600: '#dc2626',
        700: '#b91c1c',
        800: '#991b1b',
        900: '#7f1d1d'
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
        accent: '#ef4444'
      },
      background: {
        primary: '#ffffff',
        secondary: '#f8fafc',
        tertiary: '#f1f5f9',
        accent: '#fef2f2'
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
        h1: 42,
        h2: 28,
        h3: 22,
        h4: 18,
        h5: 16,
        h6: 14
      },
      body: {
        xs: 11,
        sm: 12,
        base: 14,
        lg: 16,
        xl: 18,
        '2xl': 20,
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
        lg: 4,
        xl: 8
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
        lg: 8,
        xl: 12,
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
      type: SectionType.PERSONAL_INFO,
      required: true,
      order: 1,
      styling: {
        showDates: false,
        showLocation: true,
        showDuration: false,
        bulletPoints: false,
        showProgress: false,
        showLevel: false,
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
            type: 'text',
            required: true,
            maxLength: 100,
            validation: [
              { type: 'required', message: 'Full name is required' },
              { type: 'min-length', min: 2, message: 'Name must be at least 2 characters' }
            ],
            formatting: { titleCase: true }
          },
          {
            id: 'title',
            name: 'Professional Title',
            type: 'text',
            required: true,
            maxLength: 100,
            validation: [
              { type: 'required', message: 'Professional title is required' }
            ],
            formatting: { titleCase: true }
          },
          {
            id: 'email',
            name: 'Email',
            type: 'email',
            required: true,
            validation: [
              { type: 'required', message: 'Email is required' },
              { type: 'email', message: 'Please enter a valid email address' }
            ]
          },
          {
            id: 'phone',
            name: 'Phone',
            type: 'phone',
            required: true,
            validation: [
              { type: 'required', message: 'Phone number is required' },
              { type: 'phone', message: 'Please enter a valid phone number' }
            ],
            formatting: { phoneFormat: '(###) ###-####' }
          },
          {
            id: 'location',
            name: 'Location',
            type: 'text',
            required: true,
            maxLength: 100,
            validation: [
              { type: 'required', message: 'Location is required' }
            ]
          },
          {
            id: 'linkedin',
            name: 'LinkedIn URL',
            type: 'url',
            required: false,
            validation: [
              { type: 'url', message: 'Please enter a valid LinkedIn URL' }
            ]
          }
        ],
        placeholders: {
          title: 'Chief Executive Officer',
          subtitle: 'Senior Executive Resume',
          description: 'Professional executive resume with emphasis on leadership and strategic impact',
          achievements: ['Strategic Leadership', 'P&L Management', 'Team Building', 'Stakeholder Relations']
        },
        formatting: {
          autoCapitalization: true,
          bulletPointFormatting: false,
          dateFormatting: false,
          phoneFormatting: true,
          urlFormatting: true
        }
      },
      validation: {
        required: ['fullName', 'title', 'email', 'phone', 'location'],
        optional: ['website', 'linkedin', 'github', 'portfolio'],
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
      type: SectionType.SUMMARY,
      required: true,
      order: 2,
      styling: {
        showDates: false,
        showLocation: false,
        showDuration: false,
        bulletPoints: false,
        maxItems: 1,
        showProgress: false,
        showLevel: false,
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
            name: 'Executive Summary',
            type: 'textarea',
            required: true,
            maxLength: 500,
            validation: [
              { type: 'required', message: 'Executive summary is required' },
              { type: 'min-length', min: 50, message: 'Summary should be at least 50 characters' },
              { type: 'max-length', max: 500, message: 'Summary should not exceed 500 characters' }
            ]
          }
        ],
        placeholders: {
          title: 'Executive Summary',
          subtitle: 'Professional Overview',
          description: 'Results-driven executive with 15+ years of experience leading strategic initiatives and driving organizational growth.',
          achievements: [
            'Strategic Planning & Execution',
            'P&L Management & Financial Oversight',
            'Team Leadership & Development',
            'Stakeholder Relationship Management'
          ]
        },
        formatting: {
          autoCapitalization: false,
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
      name: 'Executive Experience',
      type: SectionType.EXPERIENCE,
      required: true,
      order: 3,
      styling: {
        showDates: true,
        showLocation: true,
        showDuration: true,
        bulletPoints: true,
        maxItems: 6,
        showProgress: false,
        showLevel: false,
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
            id: 'title',
            name: 'Job Title',
            type: 'text',
            required: true,
            maxLength: 100,
            validation: [
              { type: 'required', message: 'Job title is required' }
            ],
            formatting: { titleCase: true }
          },
          {
            id: 'company',
            name: 'Company',
            type: 'text',
            required: true,
            maxLength: 100,
            validation: [
              { type: 'required', message: 'Company is required' }
            ],
            formatting: { titleCase: true }
          },
          {
            id: 'location',
            name: 'Location',
            type: 'text',
            required: false,
            maxLength: 100
          },
          {
            id: 'startDate',
            name: 'Start Date',
            type: 'date',
            required: true,
            validation: [
              { type: 'required', message: 'Start date is required' }
            ],
            formatting: { dateFormat: 'MM/YYYY' }
          },
          {
            id: 'endDate',
            name: 'End Date',
            type: 'date',
            required: false,
            validation: [],
            formatting: { dateFormat: 'MM/YYYY' }
          },
          {
            id: 'current',
            name: 'Current Position',
            type: 'boolean',
            required: false
          },
          {
            id: 'description',
            name: 'Description',
            type: 'textarea',
            required: false,
            maxLength: 1000
          },
          {
            id: 'achievements',
            name: 'Key Achievements',
            type: 'textarea',
            required: false,
            maxLength: 2000,
            validation: []
          }
        ],
        placeholders: {
          title: 'Chief Executive Officer',
          subtitle: 'Senior Leadership Experience',
          description: 'Led strategic initiatives and drove organizational growth through effective leadership and stakeholder management.',
          achievements: [
            'Increased revenue by 45% through strategic initiatives',
            'Led team of 500+ employees across multiple departments',
            'Improved operational efficiency by 30%',
            'Established key partnerships and stakeholder relationships'
          ]
        },
        formatting: {
          autoCapitalization: false,
          bulletPointFormatting: true,
          dateFormatting: true,
          phoneFormatting: false,
          urlFormatting: false
        }
      },
      validation: {
        required: ['title', 'company', 'startDate'],
        optional: ['location', 'endDate', 'current', 'description', 'achievements'],
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
      type: SectionType.EDUCATION,
      required: true,
      order: 4,
      styling: {
        showDates: true,
        showLocation: true,
        showDuration: false,
        bulletPoints: false,
        maxItems: 4,
        showProgress: false,
        showLevel: false,
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
            type: 'text',
            required: true,
            maxLength: 100,
            validation: [
              { type: 'required', message: 'Degree is required' }
            ],
            formatting: { titleCase: true }
          },
          {
            id: 'field',
            name: 'Field of Study',
            type: 'text',
            required: false,
            maxLength: 100,
            formatting: { titleCase: true }
          },
          {
            id: 'institution',
            name: 'Institution',
            type: 'text',
            required: true,
            maxLength: 100,
            validation: [
              { type: 'required', message: 'Institution is required' }
            ],
            formatting: { titleCase: true }
          },
          {
            id: 'location',
            name: 'Location',
            type: 'text',
            required: false,
            maxLength: 100
          },
          {
            id: 'startDate',
            name: 'Start Date',
            type: 'date',
            required: false,
            validation: [],
            formatting: { dateFormat: 'YYYY' }
          },
          {
            id: 'endDate',
            name: 'End Date',
            type: 'date',
            required: false,
            validation: [],
            formatting: { dateFormat: 'YYYY' }
          },
          {
            id: 'gpa',
            name: 'GPA',
            type: 'number',
            required: false,
            validation: []
          }
        ],
        placeholders: {
          title: 'Master of Business Administration',
          subtitle: 'Higher Education',
          description: 'Advanced business education with focus on strategic management and leadership.',
          achievements: [
            'Graduated with honors',
            'Dean\\'s List recognition',
            'Leadership roles in student organizations'
          ]
        },
        formatting: {
          autoCapitalization: false,
          bulletPointFormatting: false,
          dateFormatting: true,
          phoneFormatting: false,
          urlFormatting: false
        }
      },
      validation: {
        required: ['degree', 'institution'],
        optional: ['field', 'location', 'startDate', 'endDate', 'gpa'],
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
      name: 'Certifications & Credentials',
      type: SectionType.CERTIFICATIONS,
      required: false,
      order: 5,
      styling: {
        showDates: true,
        showLocation: false,
        showDuration: false,
        bulletPoints: false,
        maxItems: 6,
        showProgress: false,
        showLevel: false,
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
            name: 'Certification Name',
            type: 'text',
            required: true,
            maxLength: 100,
            validation: [
              { type: 'required', message: 'Certification name is required' }
            ],
            formatting: { titleCase: true }
          },
          {
            id: 'issuer',
            name: 'Issuing Organization',
            type: 'text',
            required: true,
            maxLength: 100,
            validation: [
              { type: 'required', message: 'Issuing organization is required' }
            ],
            formatting: { titleCase: true }
          },
          {
            id: 'issueDate',
            name: 'Issue Date',
            type: 'date',
            required: false,
            validation: [],
            formatting: { dateFormat: 'MM/YYYY' }
          },
          {
            id: 'expiryDate',
            name: 'Expiry Date',
            type: 'date',
            required: false,
            validation: [],
            formatting: { dateFormat: 'MM/YYYY' }
          }
        ],
        placeholders: {
          title: 'Certified Executive Coach',
          subtitle: 'Professional Certification',
          description: 'Professional certification demonstrating expertise and credibility.',
          achievements: [
            'Valid through 2025',
            'Issued by recognized authority',
            'Renewable certification'
          ]
        },
        formatting: {
          autoCapitalization: false,
          bulletPointFormatting: false,
          dateFormatting: true,
          phoneFormatting: false,
          urlFormatting: false
        }
      },
      validation: {
        required: ['name', 'issuer'],
        optional: ['issueDate', 'expiryDate'],
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
      name: 'Core Competencies',
      type: SectionType.SKILLS,
      required: true,
      order: 6,
      styling: {
        showDates: false,
        showLocation: false,
        showDuration: false,
        bulletPoints: true,
        maxItems: 20,
        showProgress: false,
        showLevel: false,
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
            type: 'multi-select',
            required: false,
            validation: []
          }
        ],
        placeholders: {
          title: 'Core Competencies',
          subtitle: 'Professional Skills',
          description: 'Key skills and competencies relevant to executive roles.',
          achievements: [
            'Strategic Planning',
            'Financial Management',
            'Team Leadership',
            'Stakeholder Relations',
            'Change Management',
            'Business Development'
          ]
        },
        formatting: {
          autoCapitalization: false,
          bulletPointFormatting: true,
          dateFormatting: false,
          phoneFormatting: false,
          urlFormatting: false
        }
      },
      validation: {
        required: [],
        optional: ['skills'],
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
      type: SectionType.LANGUAGES,
      required: false,
      order: 7,
      styling: {
        showDates: false,
        showLocation: false,
        showDuration: false,
        bulletPoints: false,
        maxItems: 5,
        showProgress: false,
        showLevel: true,
        compact: true
      },
      layout: {
        columns: 2,
        itemSpacing: 12,
        alignment: 'left',
        orientation: 'horizontal',
        wrap: true
      },
      content: {
        fields: [
          {
            id: 'name',
            name: 'Language',
            type: 'text',
            required: true,
            maxLength: 50,
            validation: [
              { type: 'required', message: 'Language name is required' }
            ],
            formatting: { titleCase: true }
          },
          {
            id: 'proficiency',
            name: 'Proficiency Level',
            type: 'select',
            required: true,
            validation: [
              { type: 'required', message: 'Proficiency level is required' }
            ]
          }
        ],
        placeholders: {
          title: 'Language Proficiency',
          subtitle: 'Language Skills',
          description: 'Language skills and proficiency levels.',
          achievements: [
            'English - Native',
            'Spanish - Professional',
            'French - Conversational'
          ]
        },
        formatting: {
          autoCapitalization: false,
          bulletPointFormatting: false,
          dateFormatting: false,
          phoneFormatting: false,
          urlFormatting: false
        }
      },
      validation: {
        required: ['name', 'proficiency'],
        optional: [],
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
      prohibitedElements: ['tables', 'columns', 'images', 'charts'],
      sectionOrder: ['personal-info', 'summary', 'experience', 'education', 'certifications', 'skills', 'languages'],
      formatting: {
        autoCapitalization: true,
        bulletPointFormatting: true,
        dateFormatting: true,
        phoneFormatting: true,
        urlFormatting: true
      }
    },
    fontOptimization: {
      approvedFonts: ['Georgia', 'Arial', 'Times New Roman', 'Helvetica', 'Calibri'],
      prohibitedFonts: ['Comic Sans', 'Brush Script', 'Papyrus', 'Courier'],
      minimumSize: 11,
      maximumVariants: 4,
      fallbackRequired: true
    },
    marginGuidelines: {
      minimum: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
      maximum: { top: 1.5, right: 1.5, bottom: 1.5, left: 1.5 },
      recommended: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
      units: 'inches'
    },
    sectionOrdering: {
      sections: ['personal-info', 'summary', 'experience', 'education', 'certifications', 'skills', 'languages'],
      reasoning: 'Executive resume format prioritizes leadership experience and strategic impact',
      flexibility: 70,
      industrySpecific: [
        {
          industry: 'technology',
          sections: ['personal-info', 'summary', 'experience', 'skills', 'education', 'certifications'],
          reasoning: 'Tech resumes emphasize skills and experience first'
        },
        {
          industry: 'healthcare',
          sections: ['personal-info', 'summary', 'experience', 'education', 'certifications', 'skills'],
          reasoning: 'Healthcare resumes prioritize credentials and education'
        }
      ]
    },
    testing: {
      lastTested: new Date('2024-01-15'),
      score: 98,
      parser: 'Resume Parser v2.1',
      issues: [],
      recommendations: [
        'Consider adding more quantifiable achievements',
        'Ensure consistent formatting for dates',
        'Review keyword density for target roles'
      ]
    }
  },
  customization: {
    colors: {
      themes: [],
      customColors: [],
      currentTheme: 'executive-pro-default',
      allowCustom: true
    },
    fonts: {
      families: [],
      sizes: {
        heading: [36, 40, 44, 48],
        body: [11, 12, 13, 14, 15],
        scale: 1
      },
      weights: {
        heading: [400, 700],
        body: [400, 700]
      },
      lineHeight: {
        tight: 1.4,
        normal: 1.6,
        relaxed: 1.8
      }
    },
    layout: {
      spacing: {
        section: 28,
        item: 16,
        line: 1.6,
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
        count: 1,
        widths: [100],
        gutters: 20
      },
      alignment: {
        header: 'center',
        sections: 'left',
        content: 'left'
      }
    },
    sections: {
      visibility: [],
      ordering: [
        { sectionId: 'personal-info', order: 1 },
        { sectionId: 'summary', order: 2 },
        { sectionId: 'experience', order: 3 },
        { sectionId: 'education', order: 4 },
        { sectionId: 'certifications', order: 5 },
        { sectionId: 'skills', order: 6 },
        { sectionId: 'languages', order: 7 }
      ],
      styling: []
    },
    branding: {
      logo: {
        enabled: false,
        url: '',
        size: 40,
        position: 'top-left',
        opacity: 1
      },
      watermark: {
        enabled: false,
        text: '',
        font: 'Arial',
        size: 24,
        color: '#cccccc',
        opacity: 0.1,
        position: 'center',
        rotation: -45
      },
      header: {
        showName: true,
        showContact: true,
        layout: 'classic',
        styling: {}
      },
      footer: {
        showPageNumbers: false,
        showLastModified: false,
        showContact: false,
        text: '',
        styling: {}
      }
    },
    export: {
      formats: ['pdf', 'docx', 'html'],
      quality: {
        pdf: 'print',
        images: 'balanced',
        fonts: 'embedded'
      },
      options: {
        includeMetadata: true,
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
    created: new Date('2024-01-01'),
    updated: new Date('2024-01-15'),
    tags: ['executive', 'professional', 'leadership', 'corporate', 'c-suite', 'senior-management'],
    downloads: 1247,
    rating: 4.8,
    reviews: 156,
    compatibility: [
      { browser: 'Chrome', version: '120+', supported: true },
      { browser: 'Firefox', version: '119+', supported: true },
      { browser: 'Safari', version: '17+', supported: true },
      { browser: 'Edge', version: '120+', supported: true }
    ],
    requirements: {
      minBrowserVersion: 'Chrome 120',
      features: ['CSS Grid', 'Flexbox', 'Custom Properties'],
      limitations: ['No external dependencies', 'Modern browser required']
    },
    license: {
      type: 'premium',
      restrictions: ['Commercial use requires license', 'No redistribution'],
      attribution: false,
      commercialUse: true,
      modification: false
    }
  }
};

export default ExecutiveProTemplate;