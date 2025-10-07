/**
 * Faculty/Professor Resume Template
 * Optimized for academic faculty positions with emphasis on teaching, research, and service
 */

import { ResumeTemplate } from '@/types/template';

export const facultyProfessorTemplate: ResumeTemplate = {
  id: 'faculty-professor',
  name: 'Faculty/Professor',
  description: 'Comprehensive template for academic faculty positions at all levels',
  category: 'academic',
  industry: 'higher-education',
  tags: ['faculty', 'professor', 'teaching', 'research', 'service', 'leadership'],
  atsScore: 98,
  layout: {
    type: 'single-column',
    sections: [
      'contact', 'academic-profile', 'education', 'research-appointments',
      'teaching-experience', 'research-interests', 'publications', 'grants-funding',
      'student-advising', 'academic-service', 'leadership-roles', 'honors-awards',
      'professional-activities', 'references'
    ]
  },
  styling: {
    colorScheme: {
      name: 'Faculty Excellence',
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
        fontSize: { h1: 32, h2: 24, h3: 20, h4: 18 },
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
      sectionSpacing: { before: 18, after: 14 },
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
        showResearchGate: true,
        showLinkedIn: true,
        showPersonalWebsite: true,
        showOfficeHours: true,
        compact: false
      }
    },
    {
      id: 'academic-profile',
      name: 'Academic Profile',
      type: 'summary',
      required: false,
      order: 2,
      maxLength: 350,
      layout: 'full-width',
      styling: {
        accentColor: '#7c3aed',
        showBorder: true,
        textAlign: 'left',
        emphasizeResearch: true,
        emphasizeTeaching: true,
        emphasizeService: true,
        emphasizeLeadership: true,
        showCareerGoals: true
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
        showAwards: true,
        compact: false
      }
    },
    {
      id: 'research-appointments',
      name: 'Research Appointments',
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
        showLeadership: true,
        showSupervision: true,
        dateFormat: 'Month Year',
        emphasizeLeadership: true
      }
    },
    {
      id: 'teaching-experience',
      name: 'Teaching Experience',
      type: 'teaching',
      required: false,
      order: 5,
      layout: 'full-width',
      styling: {
        showDates: true,
        showInstitution: true,
        showCourses: true,
        showLevel: true,
        showStudentCount: true,
        showCourseDevelopment: true,
        showCurriculumDesign: true,
        showTeachingPhilosophy: false,
        showEvaluation: true,
        showInnovation: true,
        showOnlineTeaching: true,
        compact: false
      }
    },
    {
      id: 'research-interests',
      name: 'Research Interests & Expertise',
      type: 'skills',
      required: false,
      order: 6,
      layout: 'full-width',
      styling: {
        groupBy: 'area',
        showProficiency: false,
        columns: 2,
        academicFocus: true,
        showKeywords: true,
        showCurrentProjects: true,
        showFutureDirections: true,
        emphasizeExpertise: true
      }
    },
    {
      id: 'publications',
      name: 'Selected Publications',
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
        groupByType: true,
        showHIndex: true,
        showTotalCitations: true,
        showFirstAuthor: true,
        showSeniorAuthor: true,
        showRecentOnly: true,
        emphasizeImpact: true
      }
    },
    {
      id: 'grants-funding',
      name: 'Grants & Funding',
      type: 'grants',
      required: false,
      order: 8,
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
        showTotalFunding: true,
        showPIFunding: true,
        currency: 'USD',
        compact: false
      }
    },
    {
      id: 'student-advising',
      name: 'Student Advising & Mentorship',
      type: 'mentorship',
      required: false,
      order: 9,
      layout: 'full-width',
      styling: {
        showCurrent: true,
        showGraduated: true,
        showThesisAdvised: true,
        showDissertationChaired: true,
        showPostdocsSupervised: true,
        showCareerOutcomes: true,
        showAwards: true,
        showPublicationsWithStudents: true,
        compact: false
      }
    },
    {
      id: 'academic-service',
      name: 'Academic Service',
      type: 'service',
      required: false,
      order: 10,
      layout: 'full-width',
      styling: {
        showDepartmental: true,
        showUniversity: true,
        showProfessional: true,
        showCommunity: true,
        showCommitteeWork: true,
        showReviewer: true,
        showEditorial: true,
        showOrganizer: true,
        showLeadership: true,
        compact: false
      }
    },
    {
      id: 'leadership-roles',
      name: 'Leadership & Administration',
      type: 'leadership',
      required: false,
      order: 11,
      layout: 'full-width',
      styling: {
        showDates: true,
        showInstitution: true,
        showRole: true,
        showDescription: true,
        showImpact: true,
        showBudget: true,
        showPersonnel: true,
        showInitiatives: true,
        compact: false
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
        showTeachingAwards: true,
        showResearchAwards: true,
        compact: false
      }
    },
    {
      id: 'professional-activities',
      name: 'Professional Activities & Memberships',
      type: 'professional',
      required: false,
      order: 13,
      layout: 'full-width',
      styling: {
        showMemberships: true,
        showLicenses: true,
        showCertifications: true,
        showConferences: true,
        showWorkshops: true,
        showInvitedTalks: true,
        showMedia: true,
        compact: true
      }
    },
    {
      id: 'references',
      name: 'References',
      type: 'references',
      required: false,
      order: 14,
      layout: 'full-width',
      styling: {
        showTitle: true,
        showInstitution: true,
        showEmail: true,
        showPhone: false,
        showRelationship: true,
        showAvailable: true,
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
    fontCombinations: ['Executive Elegance', 'Traditional Professional', 'Corporate Classic'],
    layoutPresets: ['traditional', 'spacious', 'professional'],
    customSections: {
      allowed: ['academic-profile', 'leadership-roles', 'student-advising', 'professional-activities', 'patents', 'software'],
      restricted: ['projects', 'portfolio']
    }
  },
  metadata: {
    targetRoles: [
      'Assistant Professor', 'Associate Professor', 'Full Professor',
      'Department Chair', 'Program Director', 'Research Director',
      'Faculty Fellow', 'Senior Lecturer', 'Professor of Practice',
      'Adjunct Professor', 'Visiting Professor'
    ],
    experienceLevels: ['mid', 'senior', 'executive'],
    targetIndustries: [
      'Higher Education', 'Research Institutions', 'Medical Schools',
      'Liberal Arts Colleges', 'Community Colleges', 'Online Education',
      'Professional Schools', 'Research Hospitals'
    ],
    atsOptimization: {
      keywords: [
        'faculty position', 'teaching', 'research', 'academic service', 'curriculum development',
        'student advising', 'mentorship', 'grant writing', 'peer review', 'departmental service',
        'academic leadership', 'publication record', 'research funding', 'teaching excellence',
        'interdisciplinary collaboration', 'community engagement', 'professional development',
        'higher education', 'academic administration', 'curriculum design'
      ],
      avoidKeywords: ['corporate', 'business', 'sales', 'marketing'],
      formatting: 'academic-faculty-structure'
    }
  }
};