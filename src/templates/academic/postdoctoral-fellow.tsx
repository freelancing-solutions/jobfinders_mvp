/**
 * Postdoctoral Fellow Resume Template
 * Optimized for postdoctoral researchers transitioning to independent research careers
 */

import { ResumeTemplate } from '@/types/template';

export const postdoctoralFellowTemplate: ResumeTemplate = {
  id: 'postdoctoral-fellow',
  name: 'Postdoctoral Fellow',
  description: 'Advanced template for postdoctoral researchers seeking faculty and research positions',
  category: 'academic',
  industry: 'research',
  tags: ['postdoc', 'research', 'faculty', 'independent-research', 'grants'],
  atsScore: 98,
  layout: {
    type: 'single-column',
    sections: [
      'contact', 'research-profile', 'education', 'postdoctoral-research',
      'graduate-research', 'publications', 'grants-fellowships', 'conferences',
      'teaching-mentorship', 'collaborations', 'skills-expertise', 'honors-awards'
    ]
  },
  styling: {
    colorScheme: {
      name: 'Postdoctoral Excellence',
      primary: '#0f172a',
      secondary: '#334155',
      accent: '#0ea5e9',
      background: '#ffffff',
      text: '#0f172a',
      muted: '#64748b',
      border: '#e2e8f0',
      highlight: '#f0f9ff',
      link: '#0284c7'
    },
    typography: {
      heading: {
        fontFamily: 'Times New Roman',
        fontWeight: 600,
        fontSize: { h1: 30, h2: 22, h3: 18, h4: 16 },
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
      itemSpacing: 5,
      lineHeight: 1.4
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
        borderColor: '#0ea5e9',
        textColor: '#0f172a',
        showIcons: false,
        showAcademicEmail: true,
        showORCID: true,
        showGoogleScholar: true,
        showResearchGate: true,
        showLinkedIn: true,
        showPersonalWebsite: true,
        compact: false
      }
    },
    {
      id: 'research-profile',
      name: 'Research Profile & Objectives',
      type: 'summary',
      required: false,
      order: 2,
      maxLength: 300,
      layout: 'full-width',
      styling: {
        accentColor: '#0ea5e9',
        showBorder: true,
        textAlign: 'left',
        emphasizeResearch: true,
        emphasizeIndependence: true,
        emphasizeFutureGoals: true
      }
    },
    {
      id: 'education',
      name: 'Education',
      type: 'education',
      required: true,
      order: 3,
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
        showDissertationDefense: true,
        showPublicationsFromThesis: true,
        compact: false
      }
    },
    {
      id: 'postdoctoral-research',
      name: 'Postdoctoral Research',
      type: 'experience',
      required: false,
      order: 4,
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
        showIndependence: true,
        showMentorship: true,
        dateFormat: 'Month Year',
        emphasizeIndependence: true
      }
    },
    {
      id: 'graduate-research',
      name: 'Graduate Research',
      type: 'experience',
      required: false,
      order: 5,
      layout: 'full-width',
      styling: {
        showDates: true,
        showLocation: true,
        showBullets: true,
        showFunding: false,
        showCollaborators: true,
        showMethodology: true,
        showPublications: true,
        showImpactMetrics: false,
        showThesis: true,
        dateFormat: 'Month Year',
        emphasizeFoundation: true
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
        showFirstAuthor: true,
        showSeniorAuthor: true,
        emphasizeImpact: true
      }
    },
    {
      id: 'grants-fellowships',
      name: 'Grants & Fellowships',
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
        showSelectivity: true,
        showIndependence: true,
        currency: 'USD',
        compact: false
      }
    },
    {
      id: 'conferences',
      name: 'Conference Activities',
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
        showOrganizer: true,
        showSessionChair: true,
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
        showPostdocsMentored: false,
        showTeachingPhilosophy: false,
        showEvaluation: true,
        compact: false
      }
    },
    {
      id: 'collaborations',
      name: 'Research Collaborations',
      type: 'collaborations',
      required: false,
      order: 10,
      layout: 'full-width',
      styling: {
        showDates: true,
        showInstitutions: true,
        showProject: true,
        showRole: true,
        showOutcomes: true,
        showInternational: true,
        showInterdisciplinary: true,
        showOngoing: true,
        compact: false
      }
    },
    {
      id: 'skills-expertise',
      name: 'Research Skills & Expertise',
      type: 'skills',
      required: false,
      order: 11,
      layout: 'full-width',
      styling: {
        groupBy: 'category',
        showProficiency: true,
        columns: 3,
        categories: ['Research Methods', 'Technical Skills', 'Data Analysis', 'Software', 'Languages'],
        showCertifications: true,
        showYearsOfExperience: true,
        showExpertise: true
      }
    },
    {
      id: 'honors-awards',
      name: 'Honors & Awards',
      type: 'awards',
      required: false,
      order: 12,
      layout: 'full-width',
      styling: {
        showDates: true,
        showIssuer: true,
        showDescription: true,
        showAmount: false,
        showSelectivity: true,
        showScope: true,
        showInternational: true,
        showPrestige: true,
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
    colorThemes: ['executive', 'leadership', 'corporate', 'professional'],
    fontCombinations: ['Executive Elegance', 'Traditional Professional', 'Corporate Classic'],
    layoutPresets: ['traditional', 'spacious', 'professional'],
    customSections: {
      allowed: ['research-profile', 'collaborations', 'patents', 'software', 'media-coverage'],
      restricted: ['projects', 'portfolio']
    }
  },
  metadata: {
    targetRoles: [
      'Postdoctoral Fellow', 'Research Scientist', 'Assistant Professor',
      'Research Associate', 'Senior Researcher', 'Principal Investigator',
      'Faculty Candidate', 'Independent Researcher', 'Staff Scientist'
    ],
    experienceLevels: ['mid', 'senior'],
    targetIndustries: [
      'Higher Education', 'Research Institutions', 'Government Research',
      'Pharmaceutical', 'Biotechnology', 'Technology Research',
      'Healthcare Research', 'Nonprofit Research', 'Industry R&D'
    ],
    atsOptimization: {
      keywords: [
        'postdoctoral research', 'independent research', 'principal investigator',
        'grant writing', 'funding acquisition', 'peer review', 'mentorship',
        'collaboration', 'interdisciplinary research', 'publication record',
        'research impact', 'h-index', 'citations', 'conference presentations',
        'teaching experience', 'academic service', 'research methodology'
      ],
      avoidKeywords: ['entry-level', 'junior', 'learning', 'training'],
      formatting: 'academic-postdoc-structure'
    }
  }
};