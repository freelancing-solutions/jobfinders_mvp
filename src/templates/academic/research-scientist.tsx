/**
 * Research Scientist Resume Template
 * Optimized for academic research positions with emphasis on publications, grants, and research impact
 */

import { ResumeTemplate } from '@/types/template';

export const researchScientistTemplate: ResumeTemplate = {
  id: 'research-scientist',
  name: 'Research Scientist',
  description: 'Comprehensive template for research scientists and academic researchers',
  category: 'academic',
  industry: 'research',
  tags: ['research', 'publications', 'grants', 'academic', 'citations'],
  atsScore: 97,
  layout: {
    type: 'single-column',
    sections: [
      'contact', 'research-summary', 'research-interests', 'education',
      'research-experience', 'publications', 'grants-funding', 'conferences',
      'teaching-mentorship', 'awards-honors', 'technical-skills', 'references'
    ]
  },
  styling: {
    colorScheme: {
      name: 'Academic Research',
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
        fontSize: { h1: 32, h2: 22, h3: 18, h4: 16 },
        lineHeight: 1.15,
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
        showORCID: true,
        showGoogleScholar: true,
        compact: false
      }
    },
    {
      id: 'research-summary',
      name: 'Research Summary',
      type: 'summary',
      required: false,
      order: 2,
      maxLength: 250,
      layout: 'full-width',
      styling: {
        accentColor: '#7c3aed',
        showBorder: true,
        textAlign: 'left',
        emphasizeResearch: true,
        emphasizeImpact: true
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
        showKeywords: true,
        emphasizeInterests: true
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
        showCommittee: true,
        showHonors: true,
        showFellowships: true,
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
        showImpactMetrics: true,
        showSupervision: true,
        dateFormat: 'Month Year',
        emphasizeResearch: true
      }
    },
    {
      id: 'publications',
      name: 'Publications',
      type: 'publications',
      required: false,
      order: 6,
      layout: 'full-width',
      styling: {
        showCitations: true,
        showCoAuthors: true,
        showJournal: true,
        showDOI: true,
        showImpactFactor: true,
        showPeerReviewed: true,
        citationFormat: 'APA',
        groupByType: true,
        showHIndex: true,
        showTotalCitations: true,
        emphasizeImpact: true
      }
    },
    {
      id: 'grants-funding',
      name: 'Grants & Funding',
      type: 'grants',
      required: false,
      order: 7,
      layout: 'full-width',
      styling: {
        showAmount: true,
        showFundingAgency: true,
        showGrantNumber: true,
        showRole: true,
        showCoInvestigators: true,
        showDuration: true,
        showStatus: true,
        showImpact: true,
        currency: 'USD',
        compact: false
      }
    },
    {
      id: 'conferences',
      name: 'Conference Presentations & Posters',
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
        showType: true,
        showInvited: true,
        showAward: true,
        compact: true
      }
    },
    {
      id: 'teaching-mentorship',
      name: 'Teaching & Mentorship',
      type: 'teaching',
      required: false,
      order: 9,
      layout: 'full-width',
      styling: {
        showDates: true,
        showInstitution: true,
        showCourses: true,
        showLevel: true,
        showStudentCount: true,
        showMentees: true,
        showThesisAdvised: true,
        showPostdocsSupervised: true,
        compact: false
      }
    },
    {
      id: 'awards-honors',
      name: 'Awards & Honors',
      type: 'awards',
      required: false,
      order: 10,
      layout: 'full-width',
      styling: {
        showDates: true,
        showIssuer: true,
        showDescription: true,
        showAmount: true,
        showSelectivity: true,
        showScope: true,
        showInternational: true,
        compact: false
      }
    },
    {
      id: 'technical-skills',
      name: 'Technical & Research Skills',
      type: 'skills',
      required: false,
      order: 11,
      layout: 'full-width',
      styling: {
        groupBy: 'category',
        showProficiency: true,
        columns: 3,
        categories: ['Research Methods', 'Laboratory Techniques', 'Software', 'Data Analysis', 'Languages'],
        showCertifications: true,
        showYearsOfExperience: true
      }
    },
    {
      id: 'references',
      name: 'Professional References',
      type: 'references',
      required: false,
      order: 12,
      layout: 'full-width',
      styling: {
        showTitle: true,
        showInstitution: true,
        showEmail: true,
        showPhone: false,
        showRelationship: true,
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
      allowed: ['research-interests', 'grants-funding', 'conferences', 'teaching-mentorship', 'patents', 'software'],
      restricted: ['projects', 'portfolio']
    }
  },
  metadata: {
    targetRoles: [
      'Research Scientist', 'Postdoctoral Researcher', 'Principal Investigator',
      'Research Associate', 'Senior Scientist', 'Staff Scientist',
      'Research Professor', 'Lab Director', 'Research Fellow'
    ],
    experienceLevels: ['mid', 'senior', 'executive'],
    targetIndustries: [
      'Higher Education', 'Research Institutions', 'Government Research',
      'Pharmaceutical', 'Biotechnology', 'Healthcare Research',
      'Technology Research', 'Nonprofit Research'
    ],
    atsOptimization: {
      keywords: [
        'research', 'scientific', 'publications', 'peer review', 'grants', 'funding',
        'data analysis', 'experimental design', 'methodology', 'hypothesis',
        'statistical analysis', 'laboratory techniques', 'field research',
        'clinical research', 'basic research', 'applied research', 'interdisciplinary'
      ],
      avoidKeywords: ['rockstar', 'ninja', 'disruptive'],
      formatting: 'academic-structure'
    }
  }
};