/**
 * Marketing & Creative Professional Resume Template
 * Optimized for creative industries with visual appeal and portfolio focus
 */

import { ResumeTemplate } from '@/types/template';

export const marketingCreativeTemplate: ResumeTemplate = {
  id: 'marketing-creative',
  name: 'Marketing & Creative Professional',
  description: 'Modern visually-appealing template for marketing, design, and creative professionals',
  category: 'industry',
  industry: 'creative',
  tags: ['creative', 'marketing', 'design', 'portfolio', 'visual', 'modern'],
  atsScore: 94,
  layout: {
    type: 'two-column',
    sidebar: {
      width: 40,
      sections: ['contact', 'skills', 'tools', 'portfolio', 'social']
    },
    main: {
      sections: ['summary', 'experience', 'education', 'achievements']
    }
  },
  styling: {
    colorScheme: {
      name: 'Creative Modern',
      primary: '#134e4a',
      secondary: '#0f766e',
      accent: '#14b8a6',
      background: '#ffffff',
      text: '#1e293b',
      muted: '#64748b',
      border: '#e2e8f0',
      highlight: '#f0fdfa',
      link: '#0d9488'
    },
    typography: {
      heading: {
        fontFamily: 'Helvetica',
        fontWeight: 600,
        fontSize: { h1: 26, h2: 20, h3: 16, h4: 14 },
        lineHeight: 1.25,
        letterSpacing: 0.5
      },
      body: {
        fontFamily: 'Arial',
        fontWeight: 400,
        fontSize: { large: 14, normal: 12, small: 10, caption: 9 },
        lineHeight: 1.5,
        letterSpacing: 0
      },
      accent: {
        fontFamily: 'Helvetica',
        fontWeight: 500,
        fontSize: 11,
        lineHeight: 1.4,
        letterSpacing: 0.75
      },
      monospace: {
        fontFamily: 'Consolas',
        fontWeight: 400,
        fontSize: 10,
        lineHeight: 1.3,
        letterSpacing: 0
      }
    },
    spacing: {
      margins: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
      sectionSpacing: { before: 12, after: 8 },
      itemSpacing: 4,
      lineHeight: 1.25
    }
  },
  sections: [
    {
      id: 'contact',
      name: 'Contact',
      type: 'contact',
      required: true,
      order: 1,
      layout: 'sidebar',
      styling: {
        backgroundColor: '#f0fdfa',
        borderColor: '#14b8a6',
        textColor: '#134e4a',
        showIcons: true,
        showSocial: true,
        compact: true
      }
    },
    {
      id: 'summary',
      name: 'Creative Profile',
      type: 'summary',
      required: false,
      order: 2,
      maxLength: 160,
      layout: 'full-width',
      styling: {
        accentColor: '#14b8a6',
        showBorder: true,
        textAlign: 'left',
        emphasizeCreativity: true
      }
    },
    {
      id: 'skills',
      name: 'Creative Skills',
      type: 'skills',
      required: false,
      order: 3,
      layout: 'sidebar',
      styling: {
        groupBy: 'category',
        showProficiency: true,
        columns: 1,
        categories: ['Design', 'Marketing', 'Digital', 'Software'],
        visualIndicators: true
      }
    },
    {
      id: 'tools',
      name: 'Tools & Software',
      type: 'skills',
      required: false,
      order: 4,
      layout: 'sidebar',
      styling: {
        groupBy: 'category',
        showProficiency: true,
        columns: 2,
        showIcons: true,
        compact: true
      }
    },
    {
      id: 'portfolio',
      name: 'Portfolio Highlights',
      type: 'projects',
      required: false,
      order: 5,
      layout: 'sidebar',
      styling: {
        showThumbnail: true,
        showLink: true,
        showTechnologies: true,
        showResults: true,
        compact: true
      }
    },
    {
      id: 'social',
      name: 'Social & Professional',
      type: 'contact',
      required: false,
      order: 6,
      layout: 'sidebar',
      styling: {
        showSocialOnly: true,
        showIcons: true,
        compact: true
      }
    },
    {
      id: 'experience',
      name: 'Professional Experience',
      type: 'experience',
      required: true,
      order: 7,
      layout: 'full-width',
      styling: {
        showDates: true,
        showLocation: true,
        showBullets: true,
        highlightAchievements: true,
        showMetrics: true,
        showCampaigns: true,
        showClients: true,
        dateFormat: 'Month Year'
      }
    },
    {
      id: 'education',
      name: 'Education',
      type: 'education',
      required: false,
      order: 8,
      layout: 'full-width',
      styling: {
        showDates: true,
        showGPA: false,
        showHonors: true,
        showRelevantCoursework: false,
        compact: true
      }
    },
    {
      id: 'achievements',
      name: 'Awards & Recognition',
      type: 'awards',
      required: false,
      order: 9,
      layout: 'full-width',
      styling: {
        showDates: true,
        showIssuer: true,
        showDescription: true,
        showMetrics: true,
        compact: true
      }
    }
  ],
  rendering: {
    component: 'TwoColumnTemplate',
    responsive: true,
    printOptimized: true,
    cssFramework: 'tailwind'
  },
  customization: {
    colorThemes: ['creative_teal', 'creative_orange', 'modern_blue', 'modern_purple'],
    fontCombinations: ['Modern Minimal', 'Contemporary Balance', 'Creative Professional'],
    layoutPresets: ['modern', 'compact', 'spacious'],
    customSections: {
      allowed: ['portfolio', 'social', 'awards', 'testimonials'],
      restricted: ['references']
    }
  },
  metadata: {
    targetRoles: [
      'Marketing Manager', 'Creative Director', 'Graphic Designer', 'Content Creator',
      'Social Media Manager', 'Brand Manager', 'UX/UI Designer', 'Digital Marketing Specialist',
      'Art Director', 'Copywriter', 'Marketing Analyst'
    ],
    experienceLevels: ['entry', 'mid', 'senior'],
    targetIndustries: [
      'Marketing', 'Advertising', 'Design', 'Media', 'Entertainment',
      'Technology', 'E-commerce', 'Fashion', 'Publishing'
    ],
    atsOptimization: {
      keywords: [
        'marketing', 'creative', 'design', 'brand development', 'campaign management',
        'social media', 'content creation', 'digital marketing', 'brand strategy',
        'creative direction', 'visual design', 'marketing analytics', 'ROI'
      ],
      avoidKeywords: ['synergy', 'leverage', 'paradigm'],
      formatting: 'clean-creative'
    }
  }
};