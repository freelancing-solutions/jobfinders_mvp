/**
 * Software Engineer Resume Template
 * Optimized for tech industry with focus on technical skills and projects
 */

import { ResumeTemplate } from '@/types/template';

export const softwareEngineerTemplate: ResumeTemplate = {
  id: 'software-engineer',
  name: 'Software Engineer',
  description: 'Modern template designed for software engineers and developers',
  category: 'industry',
  industry: 'technology',
  tags: ['technical', 'projects', 'skills-focused', 'modern'],
  atsScore: 96,
  layout: {
    type: 'two-column',
    sidebar: {
      width: 35,
      sections: ['contact', 'skills', 'technical-projects', 'tools']
    },
    main: {
      sections: ['summary', 'experience', 'education', 'certifications']
    }
  },
  styling: {
    colorScheme: {
      name: 'Tech Modern',
      primary: '#1e293b',
      secondary: '#475569',
      accent: '#3b82f6',
      background: '#ffffff',
      text: '#1e293b',
      muted: '#64748b',
      border: '#e2e8f0',
      highlight: '#f0f9ff',
      link: '#2563eb'
    },
    typography: {
      heading: {
        fontFamily: 'Arial',
        fontWeight: 600,
        fontSize: { h1: 28, h2: 18, h3: 14, h4: 12 },
        lineHeight: 1.2,
        letterSpacing: 0
      },
      body: {
        fontFamily: 'Arial',
        fontWeight: 400,
        fontSize: { large: 14, normal: 11, small: 9, caption: 8 },
        lineHeight: 1.3,
        letterSpacing: 0
      },
      accent: {
        fontFamily: 'Arial',
        fontWeight: 500,
        fontSize: 10,
        lineHeight: 1.3,
        letterSpacing: 0.5
      },
      monospace: {
        fontFamily: 'Consolas',
        fontWeight: 400,
        fontSize: 10,
        lineHeight: 1.2,
        letterSpacing: 0
      }
    },
    spacing: {
      margins: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
      sectionSpacing: { before: 10, after: 6 },
      itemSpacing: 4,
      lineHeight: 1.15
    }
  },
  sections: [
    {
      id: 'contact',
      name: 'Contact',
      type: 'contact',
      required: true,
      order: 1,
      layout: 'compact',
      styling: {
        backgroundColor: '#f0f9ff',
        borderColor: '#3b82f6',
        textColor: '#1e293b',
        showIcons: true,
        compact: true
      }
    },
    {
      id: 'summary',
      name: 'Professional Summary',
      type: 'summary',
      required: false,
      order: 2,
      maxLength: 150,
      layout: 'full-width',
      styling: {
        accentColor: '#3b82f6',
        showBorder: true,
        textAlign: 'left'
      }
    },
    {
      id: 'skills',
      name: 'Technical Skills',
      type: 'skills',
      required: true,
      order: 3,
      layout: 'sidebar',
      styling: {
        groupBy: 'category',
        showProficiency: true,
        columns: 1,
        compact: true
      }
    },
    {
      id: 'technical-projects',
      name: 'Technical Projects',
      type: 'projects',
      required: false,
      order: 4,
      layout: 'sidebar',
      styling: {
        showTechnologies: true,
        showGithub: true,
        showLiveLink: true,
        compact: true
      }
    },
    {
      id: 'tools',
      name: 'Tools & Technologies',
      type: 'skills',
      required: false,
      order: 5,
      layout: 'sidebar',
      styling: {
        groupBy: 'category',
        showProficiency: false,
        columns: 2,
        compact: true
      }
    },
    {
      id: 'experience',
      name: 'Professional Experience',
      type: 'experience',
      required: true,
      order: 6,
      layout: 'full-width',
      styling: {
        showDates: true,
        showLocation: true,
        showBullets: true,
        highlightAchievements: true,
        dateFormat: 'Month Year'
      }
    },
    {
      id: 'education',
      name: 'Education',
      type: 'education',
      required: false,
      order: 7,
      layout: 'full-width',
      styling: {
        showDates: true,
        showGPA: true,
        showRelevantCoursework: false,
        compact: true
      }
    },
    {
      id: 'certifications',
      name: 'Certifications',
      type: 'certifications',
      required: false,
      order: 8,
      layout: 'full-width',
      styling: {
        showDates: true,
        showIssuer: true,
        showCredentialId: true,
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
    colorThemes: ['modern_blue', 'modern_green', 'modern_purple', 'executive'],
    fontCombinations: ['Modern Minimal', 'Corporate Classic', 'Contemporary Balance'],
    layoutPresets: ['modern', 'compact'],
    customSections: {
      allowed: ['technical-projects', 'open-source', 'contributions'],
      restricted: ['references', 'publications']
    }
  },
  metadata: {
    targetRoles: ['Software Engineer', 'Full Stack Developer', 'Frontend Developer', 'Backend Developer', 'DevOps Engineer'],
    experienceLevels: ['entry', 'mid', 'senior'],
    targetIndustries: ['Technology', 'Software', 'IT Services'],
    atsOptimization: {
      keywords: ['software development', 'programming', 'technical skills', 'agile', 'version control', 'testing'],
      avoidKeywords: ['rockstar', 'ninja', 'guru'],
      formatting: 'clean-structure'
    }
  }
};