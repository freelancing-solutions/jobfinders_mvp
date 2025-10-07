/**
 * Education & Academic Resume Template
 * Optimized for academic and educational positions with emphasis on credentials and research
 */

import { ResumeTemplate } from '@/types/template';

export const educationAcademicTemplate: ResumeTemplate = {
  id: 'education-academic',
  name: 'Education & Academic',
  description: 'Comprehensive template designed for educators, researchers, and academic professionals',
  category: 'industry',
  industry: 'education',
  tags: ['academic', 'research', 'teaching', 'publications', 'conservative'],
  atsScore: 96,
  layout: {
    type: 'single-column',
    sections: [
      'contact', 'summary', 'research-interests', 'education', 'research-experience',
      'teaching-experience', 'publications', 'presentations', 'awards', 'certifications'
    ]
  },
  styling: {
    colorScheme: {
      name: 'Academic Professional',
      primary: '#1e293b',
      secondary: '#475569',
      accent: '#7c3aed',
      background: '#ffffff',
      text: '#1e293b',
      muted: '#64748b',
      border: '#e2e8f0',
      highlight: '#faf5ff',
      link: '#6d28d9'
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
        fontFamily: 'Georgia',
        fontWeight: 400,
        fontSize: { large: 14, normal: 12, small: 10, caption: 9 },
        lineHeight: 1.5,
        letterSpacing: 0
      },
      accent: {
        fontFamily: 'Georgia',
        fontWeight: 500,
        fontSize: 11,
        lineHeight: 1.4,
        letterSpacing: 0.25
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
      lineHeight: 1.5
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
        borderColor: '#7c3aed',
        textColor: '#1e293b',
        showIcons: false,
        showAcademicEmail: true,
        showLinkedIn: true,
        compact: false
      }
    },
    {
      id: 'summary',
      name: 'Academic Profile',
      type: 'summary',
      required: false,
      order: 2,
      maxLength: 200,
      layout: 'full-width',
      styling: {
        accentColor: '#7c3aed',
        showBorder: true,
        textAlign: 'left',
        emphasizeResearch: true
      }
    },
    {
      id: 'research-interests',
      name: 'Research Interests',
      type: 'skills',
      required: false,
      order: 3,
      layout: 'full-width',
      styling: {
        groupBy: 'area',
        showProficiency: false,
        columns: 2,
        academicFocus: true,
        showKeywords: true
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
        showThesis: true,
        showDissertation: true,
        showAdvisor: true,
        showHonors: true,
        showDeanList: true,
        compact: false
      }
    },
    {
      id: 'research-experience',
      name: 'Research Experience',
      type: 'experience',
      required: false,
      order: 5,
      layout: 'full-width',
      styling: {
        showDates: true,
        showLocation: true,
        showBullets: true,
        showFunding: true,
        showCollaborators: true,
        showMethodology: true,
        showPublications: true,
        dateFormat: 'Month Year'
      }
    },
    {
      id: 'teaching-experience',
      name: 'Teaching Experience',
      type: 'experience',
      required: false,
      order: 6,
      layout: 'full-width',
      styling: {
        showDates: true,
        showLocation: true,
        showBullets: true,
        showCourses: true,
        showStudentEvaluations: true,
        showCurriculum: true,
        dateFormat: 'Month Year'
      }
    },
    {
      id: 'publications',
      name: 'Publications',
      type: 'publications',
      required: false,
      order: 7,
      layout: 'full-width',
      styling: {
        showCitations: true,
        showCoAuthors: true,
        showJournal: true,
        showDOI: true,
        showImpactFactor: true,
        showPeerReviewed: true,
        citationFormat: 'APA',
        groupByType: true
      }
    },
    {
      id: 'presentations',
      name: 'Conference Presentations',
      type: 'presentations',
      required: false,
      order: 8,
      layout: 'full-width',
      styling: {
        showDates: true,
        showLocation: true,
        showConference: true,
        showTitle: true,
        showCoPresenters: true,
        showAbstract: false,
        compact: true
      }
    },
    {
      id: 'awards',
      name: 'Honors & Awards',
      type: 'awards',
      required: false,
      order: 9,
      layout: 'full-width',
      styling: {
        showDates: true,
        showIssuer: true,
        showDescription: true,
        showAmount: true,
        showSelectivity: true,
        compact: false
      }
    },
    {
      id: 'certifications',
      name: 'Professional Development',
      type: 'certifications',
      required: false,
      order: 10,
      layout: 'full-width',
      styling: {
        showDates: true,
        showIssuer: true,
        showCredentialId: false,
        showWorkshopTitle: true,
        showHours: true,
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
    colorThemes: ['leadership', 'executive', 'corporate', 'professional'],
    fontCombinations: ['Traditional Professional', 'Executive Elegance', 'Corporate Classic'],
    layoutPresets: ['traditional', 'spacious', 'professional'],
    customSections: {
      allowed: ['research-interests', 'teaching-philosophy', 'service', 'grants'],
      restricted: ['projects', 'portfolio']
    }
  },
  metadata: {
    targetRoles: [
      'Professor', 'Research Scientist', 'Academic Advisor', 'Department Chair',
      'Postdoctoral Researcher', 'Lecturer', 'Education Director', 'Curriculum Developer',
      'Academic Administrator', 'Research Assistant', 'Teaching Assistant'
    ],
    experienceLevels: ['entry', 'mid', 'senior', 'executive'],
    targetIndustries: [
      'Higher Education', 'Research Institutions', 'K-12 Education',
      'Educational Publishing', 'EdTech', 'Nonprofit Education', 'Government Education'
    ],
    atsOptimization: {
      keywords: [
        'research', 'teaching', 'academic', 'curriculum development', 'higher education',
        'pedagogy', 'scholarship', 'peer review', 'academic publishing', 'grant writing',
        'educational leadership', 'student assessment', 'educational technology'
      ],
      avoidKeywords: ['rockstar', 'ninja', 'disruptive'],
      formatting: 'academic-structure'
    }
  }
};