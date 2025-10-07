/**
 * Graduate Student Resume Template
 * Optimized for graduate students (Master's and PhD) with emphasis on research potential and academic achievements
 */

import { ResumeTemplate } from '@/types/template';

export const graduateStudentTemplate: ResumeTemplate = {
  id: 'graduate-student',
  name: 'Graduate Student',
  description: 'Comprehensive template for graduate students applying for academic and research positions',
  category: 'academic',
  industry: 'education',
  tags: ['graduate', 'research', 'academic', 'early-career', 'education'],
  atsScore: 96,
  layout: {
    type: 'single-column',
    sections: [
      'contact', 'education', 'research-interests', 'research-experience',
      'publications', 'academic-projects', 'teaching-assistantship', 'skills',
      'awards-scholarships', 'conference-presentations', 'leadership-service'
    ]
  },
  styling: {
    colorScheme: {
      name: 'Graduate Academic',
      primary: '#1e293b',
      secondary: '#475569',
      accent: '#2563eb',
      background: '#ffffff',
      text: '#1e293b',
      muted: '#64748b',
      border: '#e2e8f0',
      highlight: '#eff6ff',
      link: '#1d4ed8'
    },
    typography: {
      heading: {
        fontFamily: 'Times New Roman',
        fontWeight: 600,
        fontSize: { h1: 28, h2: 20, h3: 16, h4: 14 },
        lineHeight: 1.2,
        letterSpacing: 0
      },
      body: {
        fontFamily: 'Arial',
        fontWeight: 400,
        fontSize: { large: 13, normal: 11, small: 9, caption: 8 },
        lineHeight: 1.4,
        letterSpacing: 0
      },
      accent: {
        fontFamily: 'Arial',
        fontWeight: 500,
        fontSize: 10,
        lineHeight: 1.3,
        letterSpacing: 0.25
      },
      monospace: {
        fontFamily: 'Courier New',
        fontWeight: 400,
        fontSize: 10,
        lineHeight: 1.2,
        letterSpacing: 0
      }
    },
    spacing: {
      margins: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
      sectionSpacing: { before: 14, after: 10 },
      itemSpacing: 4,
      lineHeight: 1.3
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
        borderColor: '#2563eb',
        textColor: '#1e293b',
        showIcons: false,
        showAcademicEmail: true,
        showLinkedIn: true,
        showPersonalWebsite: true,
        showGitHub: true,
        compact: false
      }
    },
    {
      id: 'education',
      name: 'Education',
      type: 'education',
      required: true,
      order: 2,
      layout: 'full-width',
      styling: {
        showDates: true,
        showGPA: true,
        showThesis: true,
        showDissertation: true,
        showAdvisor: true,
        showCommittee: false,
        showHonors: true,
        showRelevantCoursework: true,
        showFellowships: true,
        showExpectedGraduation: true,
        compact: false
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
        emphasizePotential: true
      }
    },
    {
      id: 'research-experience',
      name: 'Research Experience',
      type: 'experience',
      required: false,
      order: 4,
      layout: 'full-width',
      styling: {
        showDates: true,
        showLocation: true,
        showBullets: true,
        showFunding: false,
        showCollaborators: true,
        showMethodology: true,
        showPublications: false,
        showSkills: true,
        showSupervision: false,
        dateFormat: 'Month Year',
        emphasizeLearning: true
      }
    },
    {
      id: 'publications',
      name: 'Publications',
      type: 'publications',
      required: false,
      order: 5,
      layout: 'full-width',
      styling: {
        showCitations: false,
        showCoAuthors: true,
        showJournal: true,
        showDOI: true,
        showImpactFactor: false,
        showPeerReviewed: true,
        citationFormat: 'APA',
        groupByType: true,
        showUnderReview: true,
        showInPreparation: true,
        emphasizeContribution: true
      }
    },
    {
      id: 'academic-projects',
      name: 'Academic Projects',
      type: 'projects',
      required: false,
      order: 6,
      layout: 'full-width',
      styling: {
        showDates: true,
        showDescription: true,
        showTechnologies: true,
        showOutcomes: true,
        showSkills: true,
        showProfessor: true,
        showCourse: true,
        showGrade: true,
        compact: false
      }
    },
    {
      id: 'teaching-assistantship',
      name: 'Teaching Experience',
      type: 'teaching',
      required: false,
      order: 7,
      layout: 'full-width',
      styling: {
        showDates: true,
        showInstitution: true,
        showCourses: true,
        showLevel: true,
        showStudentCount: true,
        showResponsibilities: true,
        showProfessor: true,
        showEvaluation: false,
        compact: false
      }
    },
    {
      id: 'skills',
      name: 'Skills & Expertise',
      type: 'skills',
      required: false,
      order: 8,
      layout: 'full-width',
      styling: {
        groupBy: 'category',
        showProficiency: true,
        columns: 3,
        categories: ['Research Skills', 'Technical Skills', 'Laboratory Skills', 'Software', 'Languages'],
        showCertifications: false,
        showYearsOfExperience: false,
        showLearning: true
      }
    },
    {
      id: 'awards-scholarships',
      name: 'Awards & Scholarships',
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
        showScope: true,
        showMerit: true,
        compact: false
      }
    },
    {
      id: 'conference-presentations',
      name: 'Conference Presentations',
      type: 'presentations',
      required: false,
      order: 10,
      layout: 'full-width',
      styling: {
        showDates: true,
        showLocation: true,
        showConference: true,
        showTitle: true,
        showCoPresenters: true,
        showAbstract: false,
        showType: true,
        showStudentAward: true,
        showTravelGrant: true,
        compact: true
      }
    },
    {
      id: 'leadership-service',
      name: 'Leadership & Service',
      type: 'leadership',
      required: false,
      order: 11,
      layout: 'full-width',
      styling: {
        showDates: true,
        showOrganization: true,
        showRole: true,
        showDescription: true,
        showImpact: true,
        showVolunteer: true,
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
    colorThemes: ['professional', 'corporate', 'minimal', 'modern_blue'],
    fontCombinations: ['Traditional Professional', 'Corporate Classic', 'Modern Minimal'],
    layoutPresets: ['traditional', 'modern', 'compact'],
    customSections: {
      allowed: ['academic-projects', 'leadership-service', 'extracurricular', 'languages'],
      restricted: ['references', 'publications'] // Publications can be included but not emphasized
    }
  },
  metadata: {
    targetRoles: [
      'Graduate Research Assistant', 'PhD Candidate', 'Master\'s Student',
      'Research Assistant', 'Teaching Assistant', 'Lab Assistant',
      'Graduate Intern', 'Junior Researcher', 'Academic Tutor'
    ],
    experienceLevels: ['entry'],
    targetIndustries: [
      'Higher Education', 'Research Institutions', 'Government Research',
      'Technology', 'Healthcare', 'Consulting', 'Finance', 'Education'
    ],
    atsOptimization: {
      keywords: [
        'graduate research', 'academic research', 'research assistant', 'teaching assistant',
        'data analysis', 'research methods', 'academic writing', 'literature review',
        'experimental design', 'statistical analysis', 'laboratory techniques',
        'coursework', 'thesis', 'dissertation', 'academic presentation'
      ],
      avoidKeywords: ['extensive experience', 'expert', 'seasoned professional'],
      formatting: 'academic-graduate-structure'
    }
  }
};