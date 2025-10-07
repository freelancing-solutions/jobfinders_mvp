/**
 * Leadership Elite Template
 *
 * A sophisticated template designed for senior leadership and executive positions.
 * Features elegant styling with subtle design elements and emphasis on leadership achievements.
 */

import React from 'react';
import { ResumeTemplate, TemplateCategory, DEFAULT_LAYOUT, DEFAULT_STYLING, DEFAULT_FEATURES, DEFAULT_ATS_OPTIMIZATION } from '@/types/template';

export const LeadershipEliteTemplate: ResumeTemplate = {
  id: 'leadership-elite',
  name: 'Leadership Elite',
  description: 'Sophisticated template designed for senior leadership positions with elegant styling and emphasis on executive achievements.',
  category: TemplateCategory.PROFESSIONAL,
  subcategory: 'leadership',
  preview: {
    thumbnail: '/assets/templates/professional/leadership-elite-thumbnail.jpg',
    large: '/assets/templates/professional/leadership-elite-large.jpg',
    mobile: '/assets/templates/professional/leadership-elite-mobile.jpg'
  },
  layout: {
    ...DEFAULT_LAYOUT,
    format: 'single-column' as any,
    headerStyle: 'left-aligned' as any,
    sectionOrder: [
      { id: 'personal-info', name: 'Executive Profile', required: true, order: 1, visible: true },
      { id: 'summary', name: 'Executive Summary', required: true, order: 2, visible: true },
      { id: 'experience', name: 'Leadership Experience', required: true, order: 3, visible: true },
      { id: 'education', name: 'Education & Development', required: true, order: 4, visible: true },
      { id: 'skills', name: 'Leadership Competencies', required: true, order: 5, visible: true },
      { id: 'certifications', name: 'Executive Certifications', required: false, order: 6, visible: true },
      { id: 'achievements', name: 'Key Achievements', required: false, order: 7, visible: true }
    ],
    spacing: {
      section: 36,
      item: 18,
      line: 1.6,
      margin: { top: 1, right: 1, bottom: 1, left: 1 },
      padding: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 }
    },
    dimensions: {
      width: 8.5,
      height: 11,
      margins: { top: 1, right: 1, bottom: 1, left: 1 },
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
        name: 'Times New Roman',
        stack: ['Times New Roman', 'Georgia', 'serif'],
        weights: [
          { weight: 300, name: 'Light' },
          { weight: 400, name: 'Regular' },
          { weight: 600, name: 'Semibold' },
          { weight: 700, name: 'Bold' }
        ]
      },
      body: {
        name: 'Georgia',
        stack: ['Georgia', 'Times New Roman', 'serif'],
        weights: [
          { weight: 400, name: 'Regular' },
          { weight: 600, name: 'Semibold' }
        ]
      },
      accents: {
        name: 'Times New Roman',
        stack: ['Times New Roman', 'Georgia', 'serif'],
        weights: [
          { weight: 600, name: 'Semibold' },
          { weight: 700, name: 'Bold' }
        ]
      },
      fallbacks: [
        { category: 'serif', fonts: ['Times New Roman', 'Georgia', 'serif'] },
        { category: 'sans-serif', fonts: ['Arial', 'Helvetica', 'sans-serif'] }
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
        50: '#fef7ed',
        100: '#fdedd3',
        200: '#fbd5a5',
        300: '#f8bb4c',
        400: '#f59e0b',
        500: '#d97706',
        600: '#b45309',
        700: '#92400e',
        800: '#78350f',
        900: '#451a03'
      },
      accent: {
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
      text: {
        primary: '#171717',
        secondary: '#404040',
        tertiary: '#525252',
        inverse: '#ffffff',
        muted: '#737373',
        accent: '#d97706'
      },
      background: {
        primary: '#ffffff',
        secondary: '#fafafa',
        tertiary: '#f5f5f5',
        accent: '#fef7ed'
      },
      semantic: {
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6'
      }
    },
    sizes: {
      heading: {
        h1: 44,
        h2: 34,
        h3: 26,
        h4: 22,
        h5: 18,
        h6: 16
      },
      body: {
        xs: 12,
        sm: 14,
        base: 15,
        lg: 16,
        xl: 17,
        '2xl': 18,
        '3xl': 20
      },
      spacing: {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 20,
        '2xl': 28,
        '3xl': 36
      },
      borders: {
        none: 0,
        sm: 1,
        md: 1,
        lg: 2,
        xl: 3
      }
    },
    effects: {
      shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 2px 4px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        xl: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        inner: 'inset 0 1px 2px 0 rgba(0, 0, 0, 0.05)'
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
        easing: 'ease-in-out'
      },
      animations: {
        fadeIn: 'fadeIn 0.3s ease-in-out',
        slideIn: 'slideIn 0.3s ease-out',
        bounce: 'none',
        pulse: 'none'
      }
    },
    branding: {}
  },
  sections: [
    {
      id: 'personal-info',
      name: 'Executive Profile',
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
        itemSpacing: 10,
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
            name: 'Executive Title',
            type: 'text' as any,
            required: true,
            maxLength: 150,
            validation: [
              { type: 'required' as any, message: 'Executive title is required' }
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
            formatting: { phoneFormat: '+1 (XXX) XXX-XXXX' }
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
            id: 'linkedin',
            name: 'LinkedIn Profile',
            type: 'url' as any,
            required: false,
            validation: [
              { type: 'url' as any, message: 'Please enter a valid URL' }
            ]
          }
        ],
        placeholders: {
          title: 'Chief Executive Officer',
          description: 'Visionary leader with 20+ years of executive experience driving organizational transformation',
          achievements: [
            'Led $1B company through successful IPO and market expansion',
            'Transformed organizational culture resulting in 95% employee retention',
            'Named among Top 100 CEOs by Fortune Magazine'
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
      name: 'Executive Summary',
      type: 'summary' as any,
      required: true,
      order: 2,
      styling: {
        showDates: false,
        showLocation: false,
        showDuration: false,
        bulletPoints: true,
        maxItems: 6,
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
            maxLength: 800,
            validation: [
              { type: 'required' as any, message: 'Executive summary is required' },
              { type: 'min-length' as any, min: 100, message: 'Summary should be at least 100 characters' }
            ]
          }
        ],
        placeholders: {
          title: 'Executive Summary',
          description: 'Strategic executive with proven track record of leading organizations through transformation and growth',
          achievements: [
            'Visionary executive leader with 20+ years of C-level experience across multiple industries',
            'Expert in strategic planning, organizational transformation, and global market expansion',
            'Proven ability to drive revenue growth, optimize operations, and build high-performance cultures',
            'Strong track record of successful mergers, acquisitions, and strategic partnerships',
            'Passionate about innovation, digital transformation, and sustainable business practices',
            'Recognized thought leader with frequent speaking engagements at industry conferences'
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
      name: 'Leadership Experience',
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
        itemSpacing: 28,
        alignment: 'left',
        orientation: 'vertical',
        wrap: false
      },
      content: {
        fields: [
          {
            id: 'position',
            name: 'Executive Position',
            type: 'text' as any,
            required: true,
            maxLength: 150,
            validation: [
              { type: 'required' as any, message: 'Executive position is required' }
            ],
            formatting: { titleCase: true }
          },
          {
            id: 'company',
            name: 'Organization',
            type: 'text' as any,
            required: true,
            maxLength: 150,
            validation: [
              { type: 'required' as any, message: 'Organization is required' }
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
            name: 'Leadership Description & Achievements',
            type: 'textarea' as any,
            required: true,
            maxLength: 1500,
            validation: [
              { type: 'required' as any, message: 'Leadership description is required' }
            ]
          }
        ],
        placeholders: {
          title: 'Chief Executive Officer',
          description: 'Led global organization through strategic transformation and market expansion',
          achievements: [
            'Spearheaded company-wide digital transformation resulting in 40% operational efficiency improvement',
            'Led successful $500M acquisition strategy, expanding market presence to 25 countries',
            'Implemented talent development programs that increased leadership pipeline by 60%',
            'Negotiated strategic partnerships with Fortune 500 companies generating $200M in new revenue',
            'Drove ESG initiatives resulting in 30% reduction in carbon footprint and improved sustainability ratings',
            'Guided organization through successful IPO, achieving $2B market capitalization',
            'Established innovation centers in Silicon Valley, London, and Singapore'
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
      name: 'Education & Development',
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
            name: 'Year',
            type: 'date' as any,
            required: true,
            validation: [
              { type: 'required' as any, message: 'Year is required' }
            ],
            formatting: { dateFormat: 'YYYY' }
          }
        ],
        placeholders: {
          title: 'Executive MBA, Global Leadership',
          description: 'Harvard Business School',
          achievements: [
            'Executive MBA with concentration in Global Leadership and Strategy',
            'Stanford Graduate School of Business - Advanced Management Program',
            'INSEAD - International Executive Program',
            'MIT Sloan - Digital Leadership Program'
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
        maxItems: 15,
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
            id: 'leadershipSkills',
            name: 'Leadership Skills',
            type: 'multi-select' as any,
            required: true,
            validation: [
              { type: 'required' as any, message: 'Leadership skills are required' }
            ]
          },
          {
            id: 'strategicSkills',
            name: 'Strategic Skills',
            type: 'multi-select' as any,
            required: true,
            validation: [
              { type: 'required' as any, message: 'Strategic skills are required' }
            ]
          },
          {
            id: 'technicalSkills',
            name: 'Technical Skills',
            type: 'multi-select' as any,
            required: false,
            validation: []
          }
        ],
        placeholders: {
          title: 'Leadership Competencies',
          description: 'Strategic planning, change management, stakeholder relations',
          achievements: [
            'Strategic Planning & Execution',
            'Change Management & Transformation',
            'Stakeholder Relations & Communication',
            'Global Business Development',
            'Mergers & Acquisitions',
            'Financial Acumen & P&L Management',
            'Innovation & Digital Transformation',
            'Talent Development & Succession Planning',
            'Board Governance & Corporate Strategy',
            'Risk Management & Compliance',
            'Public Speaking & Media Relations',
            'Negotiation & Conflict Resolution'
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
        required: ['leadershipSkills', 'strategicSkills'],
        optional: ['technicalSkills'],
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
      name: 'Executive Certifications',
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
            name: 'Certification',
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
          title: 'Advanced Management Program',
          description: 'Harvard Business School',
          achievements: [
            'Harvard Business School - Advanced Management Program',
            'Stanford Graduate School - Executive Program',
            'INSEAD - Advanced International Management',
            'MIT Sloan - Digital Leadership Program'
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
      id: 'achievements',
      name: 'Key Achievements',
      type: 'custom' as any,
      required: false,
      order: 7,
      styling: {
        showDates: false,
        showLocation: false,
        showDuration: false,
        bulletPoints: true,
        maxItems: 8,
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
            id: 'achievements',
            name: 'Key Achievements',
            type: 'textarea' as any,
            required: false,
            maxLength: 1000,
            validation: []
          }
        ],
        placeholders: {
          title: 'Key Achievements & Awards',
          description: 'Major accomplishments and recognitions throughout career',
          achievements: [
            'Fortune 100 Most Powerful Women in Business - 2023',
            'Ernst & Young Entrepreneur of the Year - 2022',
            'Forbes Top 100 CEOs - 2021, 2022, 2023',
            'Industry Leadership Award - Technology Sector',
            'Innovation Excellence Award - Digital Transformation',
            'Sustainability Leadership Award - ESG Initiatives'
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
        required: [],
        optional: ['achievements'],
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
      targetDensity: 2.8,
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
        urlFormatting: false
      }
    },
    fontOptimization: {
      approvedFonts: ['Times New Roman', 'Arial', 'Calibri', 'Georgia', 'Helvetica'],
      prohibitedFonts: ['Comic Sans', 'Brush Script', 'Papyrus', 'Decorative fonts'],
      minimumSize: 11,
      maximumVariants: 3,
      fallbackRequired: true
    },
    marginGuidelines: {
      minimum: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
      maximum: { top: 1.25, right: 1.25, bottom: 1.25, left: 1.25 },
      recommended: { top: 1, right: 1, bottom: 1, left: 1 },
      units: 'inches'
    },
    sectionOrdering: {
      sections: ['personal-info', 'summary', 'experience', 'education', 'skills', 'certifications', 'achievements'],
      reasoning: 'Executive format emphasizing leadership experience and strategic achievements',
      flexibility: 50,
      industrySpecific: [
        {
          industry: 'technology',
          sections: ['personal-info', 'summary', 'experience', 'skills', 'education', 'certifications', 'achievements'],
          reasoning: 'Tech industry values technical skills and certifications'
        },
        {
          industry: 'finance',
          sections: ['personal-info', 'summary', 'experience', 'education', 'certifications', 'skills', 'achievements'],
          reasoning: 'Finance industry emphasizes education and credentials'
        },
        {
          industry: 'healthcare',
          sections: ['personal-info', 'summary', 'education', 'experience', 'certifications', 'skills', 'achievements'],
          reasoning: 'Healthcare emphasizes education and certifications first'
        }
      ]
    },
    testing: {
      lastTested: new Date(),
      score: 97,
      parser: 'Resume Parser v2.1',
      issues: [],
      recommendations: ['Ensure quantifiable achievements are prominent', 'Maintain consistent serif font throughout']
    }
  },
  customization: {
    colors: {
      themes: [],
      customColors: [],
      currentTheme: 'leadership',
      allowCustom: true
    },
    fonts: {
      families: [],
      sizes: {
        heading: [38, 40, 42, 44, 46],
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
        section: 36,
        item: 18,
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
        { sectionId: 'certifications', visible: true },
        { sectionId: 'achievements', visible: true }
      ],
      ordering: [
        { id: 'personal-info', name: 'Executive Profile', required: true, order: 1, visible: true },
        { id: 'summary', name: 'Executive Summary', required: true, order: 2, visible: true },
        { id: 'experience', name: 'Leadership Experience', required: true, order: 3, visible: true },
        { id: 'education', name: 'Education & Development', required: true, order: 4, visible: true },
        { id: 'skills', name: 'Leadership Competencies', required: true, order: 5, visible: true },
        { id: 'certifications', name: 'Executive Certifications', required: false, order: 6, visible: true },
        { id: 'achievements', name: 'Key Achievements', required: false, order: 7, visible: true }
      ],
      styling: []
    },
    branding: {
      logo: { enabled: false, url: '', size: 32, position: 'top-left' as any, opacity: 1 },
      watermark: { enabled: false, text: '', font: '', size: 12, color: '#e0e0e0', opacity: 0.3, position: 'center' as any, rotation: 0 },
      header: { showName: true, showContact: true, layout: 'leadership' as any, styling: {} },
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
    tags: ['leadership', 'executive', 'senior-management', 'c-suite', 'strategic', 'professional'],
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