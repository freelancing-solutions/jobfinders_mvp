/**
 * Academic Template Registry
 * Manages academic-specific templates with intelligent matching and career stage recommendations
 */

import { ResumeTemplate, TemplateMatchResult } from '@/types/template';
import { TemplateEngineError, TemplateErrorType } from '../errors';
import { researchScientistTemplate } from '@/templates/academic/research-scientist';
import { graduateStudentTemplate } from '@/templates/academic/graduate-student';
import { postdoctoralFellowTemplate } from '@/templates/academic/postdoctoral-fellow';
import { facultyProfessorTemplate } from '@/templates/academic/faculty-professor';
import { educationAcademicTemplate } from '@/templates/industry/education-academic';

export class AcademicTemplateRegistry {
  private static readonly ACADEMIC_TEMPLATES: Map<string, ResumeTemplate> = new Map([
    ['research-scientist', researchScientistTemplate],
    ['graduate-student', graduateStudentTemplate],
    ['postdoctoral-fellow', postdoctoralFellowTemplate],
    ['faculty-professor', facultyProfessorTemplate],
    ['education-academic', educationAcademicTemplate]
  ]);

  private static readonly CAREER_STAGE_MAPPINGS = {
    undergraduate: ['graduate-student'],
    masters: ['graduate-student'],
    phd_candidate: ['graduate-student'],
    phd: ['postdoctoral-fellow', 'research-scientist'],
    postdoc: ['postdoctoral-fellow', 'research-scientist'],
    assistant_professor: ['faculty-professor'],
    associate_professor: ['faculty-professor'],
    full_professor: ['faculty-professor'],
    department_chair: ['faculty-professor'],
    research_scientist: ['research-scientist'],
    senior_scientist: ['research-scientist'],
    principal_investigator: ['research-scientist', 'faculty-professor']
  };

  private static readonly ACADEMIC_DISCIPLINES = {
    'STEM': ['research-scientist', 'graduate-student', 'postdoctoral-fellow'],
    'Life Sciences': ['research-scientist', 'graduate-student', 'postdoctoral-fellow'],
    'Physical Sciences': ['research-scientist', 'graduate-student', 'postdoctoral-fellow'],
    'Social Sciences': ['graduate-student', 'postdoctoral-fellow', 'faculty-professor'],
    'Humanities': ['graduate-student', 'faculty-professor'],
    'Education': ['education-academic', 'faculty-professor'],
    'Engineering': ['research-scientist', 'graduate-student', 'postdoctoral-fellow'],
    'Medicine': ['research-scientist', 'postdoctoral-fellow', 'faculty-professor'],
    'Business': ['faculty-professor'],
    'Arts': ['faculty-professor']
  };

  private static readonly POSITION_TYPES = {
    'research-focused': ['research-scientist', 'postdoctoral-fellow'],
    'teaching-focused': ['faculty-professor', 'education-academic'],
    'research-teaching': ['faculty-professor', 'postdoctoral-fellow'],
    'industry-research': ['research-scientist'],
    'administration': ['faculty-professor'],
    'graduate-program': ['graduate-student']
  };

  /**
   * Get all academic templates
   */
  static getAllAcademicTemplates(): ResumeTemplate[] {
    return Array.from(this.ACADEMIC_TEMPLATES.values());
  }

  /**
   * Get template by ID
   */
  static getTemplateById(templateId: string): ResumeTemplate | null {
    return this.ACADEMIC_TEMPLATES.get(templateId) || null;
  }

  /**
   * Get templates by career stage
   */
  static getTemplatesByCareerStage(careerStage: string): ResumeTemplate[] {
    const normalizedStage = careerStage.toLowerCase().replace(/[-_]/g, ' ');
    const templateIds = this.CAREER_STAGE_MAPPINGS[normalizedStage] || [];

    return templateIds
      .map(id => this.ACADEMIC_TEMPLATES.get(id))
      .filter(template => template !== undefined) as ResumeTemplate[];
  }

  /**
   * Get templates by academic discipline
   */
  static getTemplatesByDiscipline(discipline: string): ResumeTemplate[] {
    const normalizedDiscipline = discipline.toLowerCase();
    const templateIds = this.ACADEMIC_DISCIPLINES[normalizedDiscipline] || [];

    return templateIds
      .map(id => this.ACADEMIC_TEMPLATES.get(id))
      .filter(template => template !== undefined) as ResumeTemplate[];
  }

  /**
   * Get templates by position type
   */
  static getTemplatesByPositionType(positionType: string): ResumeTemplate[] {
    const normalizedType = positionType.toLowerCase().replace(/[-_]/g, ' ');
    const templateIds = this.POSITION_TYPES[normalizedType] || [];

    return templateIds
      .map(id => this.ACADEMIC_TEMPLATES.get(id))
      .filter(template => template !== undefined) as ResumeTemplate[];
  }

  /**
   * Find best matching academic templates based on academic profile
   */
  static findAcademicTemplateMatches(academicProfile: {
    careerStage?: string;
    discipline?: string;
    positionType?: string;
    publicationCount?: number;
    teachingExperience?: boolean;
    grantExperience?: boolean;
    leadershipExperience?: boolean;
    industryInterest?: boolean;
  }): TemplateMatchResult[] {
    const matches: TemplateMatchResult[] = [];
    const allTemplates = this.getAllAcademicTemplates();

    allTemplates.forEach(template => {
      const score = this.calculateAcademicMatchScore(template, academicProfile);
      if (score > 0) {
        matches.push({
          template,
          score,
          reasons: this.getAcademicMatchReasons(template, academicProfile)
        });
      }
    });

    // Sort by score descending
    matches.sort((a, b) => b.score - a.score);

    return matches.slice(0, 5); // Return top 5 matches
  }

  /**
   * Get career progression recommendations
   */
  static getCareerProgressionRecommendations(currentStage: string): {
    currentTemplates: TemplateMatchResult[];
    nextStageTemplates: TemplateMatchResult[];
    careerPath: Array<{
      stage: string;
      templates: string[];
      timeframe: string;
      requirements: string[];
    }>;
  } {
    const currentTemplates = this.findAcademicTemplateMatches({ careerStage: currentStage })
      .map(match => ({
        ...match,
        score: match.score + 20 // Boost for current stage
      }));

    // Determine next likely stage
    const nextStage = this.getNextCareerStage(currentStage);
    const nextStageTemplates = nextStage
      ? this.findAcademicTemplateMatches({ careerStage: nextStage })
      : [];

    const careerPath = this.generateCareerPath(currentStage);

    return {
      currentTemplates,
      nextStageTemplates,
      careerPath
    };
  }

  /**
   * Get discipline-specific recommendations
   */
  static getDisciplineRecommendations(discipline: string): {
    recommendedTemplates: ResumeTemplate[];
    disciplineInsights: {
      keySkills: string[];
      commonSections: string[];
      publicationExpectations: string[];
      fundingOpportunities: string[];
      careerPaths: string[];
    };
    templateCustomizations: Array<{
      templateId: string;
      customizations: {
        sections: Array<{ id: string; priority: number; recommendation: string }>;
        emphasis: string[];
      };
    }>;
  } {
    const templates = this.getTemplatesByDiscipline(discipline);
    const insights = this.getDisciplineInsights(discipline);
    const customizations = this.getDisciplineCustomizations(discipline);

    return {
      recommendedTemplates: templates,
      disciplineInsights: insights,
      templateCustomizations: customizations
    };
  }

  /**
   * Analyze academic CV and suggest template
   */
  static analyzeAcademicCV(cvContent: {
    education?: Array<{ degree?: string; field?: string; year?: string }>;
    experience?: Array<{ title?: string; institution?: string; description?: string }>;
    publications?: Array<{ title?: string; type?: string }>;
    teaching?: Array<{ course?: string; institution?: string }>;
    grants?: Array<{ title?: string; amount?: string }>;
  }): {
    recommendedTemplate: TemplateMatchResult | null;
    academicProfile: {
      careerStage: string;
      discipline: string;
      positionType: string;
      strengths: string[];
      improvementAreas: string[];
    };
    recommendations: string[];
  } {
    // Analyze CV content
    const profile = this.analyzeAcademicProfile(cvContent);
    const matches = this.findAcademicTemplateMatches(profile);
    const recommendedTemplate = matches[0] || null;

    // Generate recommendations
    const recommendations = this.generateAcademicRecommendations(cvContent, profile);

    return {
      recommendedTemplate,
      academicProfile: profile,
      recommendations
    };
  }

  /**
   * Validate academic CV for template compatibility
   */
  static validateAcademicCV(cvContent: any, templateId: string): {
    valid: boolean;
    score: number;
    missingSections: string[];
    suggestions: string[];
    atsOptimizations: string[];
  } {
    const template = this.getTemplateById(templateId);
    if (!template) {
      throw new TemplateEngineError(
        TemplateErrorType.NOT_FOUND,
        `Template '${templateId}' not found`,
        { templateId }
      );
    }

    const missingSections: string[] = [];
    const suggestions: string[] = [];
    const atsOptimizations: string[] = [];
    let score = 100;

    // Check required sections
    template.sections.forEach(section => {
      if (section.required && !cvContent[section.id]) {
        missingSections.push(section.name);
        score -= 20;
      }
    });

    // Analyze content quality
    if (cvContent.publications && cvContent.publications.length > 0) {
      score += 10;
    } else {
      suggestions.push('Consider adding publications to strengthen your academic profile');
    }

    if (cvContent.education && cvContent.education.length > 0) {
      score += 5;
    }

    if (cvContent.experience && cvContent.experience.length > 0) {
      score += 5;
    }

    // ATS optimizations
    atsOptimizations.push('Use standard academic section headings');
    atsOptimizations.push('Include relevant keywords from your field');
    atsOptimizations.push('Format publications consistently');
    atsOptimizations.push('Quantify achievements where possible');

    return {
      valid: missingSections.length === 0,
      score: Math.max(0, Math.min(100, score)),
      missingSections,
      suggestions,
      atsOptimizations
    };
  }

  // Private helper methods
  private static calculateAcademicMatchScore(template: ResumeTemplate, profile: {
    careerStage?: string;
    discipline?: string;
    positionType?: string;
    publicationCount?: number;
    teachingExperience?: boolean;
    grantExperience?: boolean;
    leadershipExperience?: boolean;
    industryInterest?: boolean;
  }): number {
    let score = 0;

    // Career stage matching
    if (profile.careerStage) {
      const stageTemplates = this.getTemplatesByCareerStage(profile.careerStage);
      if (stageTemplates.includes(template)) {
        score += 35;
      }
    }

    // Position type matching
    if (profile.positionType) {
      const typeTemplates = this.getTemplatesByPositionType(profile.positionType);
      if (typeTemplates.includes(template)) {
        score += 25;
      }
    }

    // Experience-based scoring
    if (profile.publicationCount !== undefined) {
      if (profile.publicationCount > 10 && template.id === 'research-scientist') {
        score += 15;
      } else if (profile.publicationCount > 5 && template.id === 'postdoctoral-fellow') {
        score += 15;
      } else if (profile.publicationCount <= 5 && template.id === 'graduate-student') {
        score += 15;
      }
    }

    if (profile.teachingExperience && template.id === 'faculty-professor') {
      score += 10;
    }

    if (profile.grantExperience && template.id === 'research-scientist') {
      score += 10;
    }

    if (profile.leadershipExperience && template.id === 'faculty-professor') {
      score += 10;
    }

    if (profile.industryInterest && template.id === 'research-scientist') {
      score += 5;
    }

    return Math.round(score);
  }

  private static getAcademicMatchReasons(template: ResumeTemplate, profile: {
    careerStage?: string;
    discipline?: string;
    positionType?: string;
    publicationCount?: number;
    teachingExperience?: boolean;
    grantExperience?: boolean;
    leadershipExperience?: boolean;
    industryInterest?: boolean;
  }): string[] {
    const reasons: string[] = [];

    if (profile.careerStage) {
      reasons.push(`Optimized for ${profile.careerStage} career stage`);
    }

    if (profile.positionType) {
      reasons.push(`Designed for ${profile.positionType} positions`);
    }

    if (profile.publicationCount !== undefined) {
      if (profile.publicationCount > 10) {
        reasons.push('Emphasizes extensive publication record');
      } else if (profile.publicationCount > 5) {
        reasons.push('Balanced approach to publications and experience');
      } else {
        reasons.push('Focus on research potential and early career achievements');
      }
    }

    if (profile.teachingExperience) {
      reasons.push('Includes dedicated teaching sections');
    }

    if (profile.grantExperience) {
      reasons.push('Highlights funding and grant experience');
    }

    if (profile.leadershipExperience) {
      reasons.push('Emphasizes leadership and administrative roles');
    }

    return reasons;
  }

  private static getNextCareerStage(currentStage: string): string | null {
    const progression: Record<string, string> = {
      'undergraduate': 'masters',
      'masters': 'phd_candidate',
      'phd_candidate': 'phd',
      'phd': 'postdoc',
      'postdoc': 'assistant_professor',
      'assistant_professor': 'associate_professor',
      'associate_professor': 'full_professor'
    };

    const normalizedStage = currentStage.toLowerCase().replace(/[-_]/g, ' ');
    return progression[normalizedStage] || null;
  }

  private static generateCareerPath(currentStage: string): Array<{
    stage: string;
    templates: string[];
    timeframe: string;
    requirements: string[];
  }> {
    const paths = [];
    let stage = currentStage.toLowerCase().replace(/[-_]/g, ' ');

    while (stage) {
      const templates = this.getTemplatesByCareerStage(stage).map(t => t.id);
      const nextStage = this.getNextCareerStage(stage);

      paths.push({
        stage: stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        templates,
        timeframe: this.getTimeframeForStage(stage),
        requirements: this.getRequirementsForStage(stage)
      });

      if (!nextStage) break;
      stage = nextStage;
    }

    return paths;
  }

  private static getTimeframeForStage(stage: string): string {
    const timeframes: Record<string, string> = {
      'undergraduate': '4 years',
      'masters': '2 years',
      'phd candidate': '3-5 years',
      'phd': '0-1 year (defending)',
      'postdoc': '2-5 years',
      'assistant professor': '5-7 years',
      'associate professor': '5-10 years',
      'full professor': 'ongoing'
    };

    return timeframes[stage] || 'varies';
  }

  private static getRequirementsForStage(stage: string): string[] {
    const requirements: Record<string, string[]> = {
      'undergraduate': ['Strong GPA', 'Research experience', 'Letters of recommendation'],
      'masters': ['Bachelor\'s degree', 'Statement of purpose', 'GRE scores'],
      'phd candidate': ['Master\'s degree', 'Research experience', 'Publications'],
      'phd': ['Completed dissertation', 'Publications', 'Defense preparation'],
      'postdoc': ['PhD completed', 'Postdoc offer', 'Research proposal'],
      'assistant professor': ['PhD + postdoc', 'Teaching experience', 'Research funding'],
      'associate professor': ['Assistant professor experience', 'Tenure requirements', 'Established research'],
      'full professor': ['Associate professor experience', 'National recognition', 'Leadership roles']
    };

    return requirements[stage] || ['Varies by institution'];
  }

  private static getDisciplineInsights(discipline: string): {
    keySkills: string[];
    commonSections: string[];
    publicationExpectations: string[];
    fundingOpportunities: string[];
    careerPaths: string[];
  } {
    const insights: Record<string, any> = {
      'STEM': {
        keySkills: ['Data analysis', 'Laboratory techniques', 'Statistical methods', 'Technical writing'],
        commonSections: ['Research experience', 'Publications', 'Technical skills', 'Grants'],
        publicationExpectations: ['Peer-reviewed journals', 'Conference proceedings', 'Technical reports'],
        fundingOpportunities: ['NSF', 'NIH', 'DOD', 'Industry partnerships'],
        careerPaths: ['Academia', 'Industry R&D', 'Government research', 'Consulting']
      },
      'Humanities': {
        keySkills: ['Critical analysis', 'Writing', 'Research', 'Teaching'],
        commonSections: ['Publications', 'Teaching experience', 'Conference presentations', 'Service'],
        publicationExpectations: ['Monographs', 'Edited volumes', 'Peer-reviewed articles'],
        fundingOpportunities: ['NEH', 'Andrew W. Mellon', 'Guggenheim', 'University grants'],
        careerPaths: ['Academia', 'Publishing', 'Cultural institutions', 'Education']
      }
    };

    return insights[discipline.toLowerCase()] || {
      keySkills: ['Research', 'Writing', 'Communication', 'Critical thinking'],
      commonSections: ['Education', 'Experience', 'Publications', 'Skills'],
      publicationExpectations: ['Varies by field'],
      fundingOpportunities: ['Field-specific grants', 'University funding'],
      careerPaths: ['Academia', 'Industry', 'Government', 'Nonprofit']
    };
  }

  private static getDisciplineCustomizations(discipline: string): Array<{
    templateId: string;
    customizations: {
      sections: Array<{ id: string; priority: number; recommendation: string }>;
      emphasis: string[];
    };
  }> {
    // Return discipline-specific customizations for each template
    return this.getAllAcademicTemplates().map(template => ({
      templateId: template.id,
      customizations: {
        sections: template.sections.map(section => ({
          id: section.id,
          priority: section.required ? 100 : 50,
          recommendation: `Include this section for ${discipline} positions`
        })),
        emphasis: this.getDisciplineEmphasis(discipline)
      }
    }));
  }

  private static getDisciplineEmphasis(discipline: string): string[] {
    const emphasis: Record<string, string[]> = {
      'STEM': ['Technical skills', 'Research methodology', 'Quantitative results'],
      'Humanities': ['Theoretical framework', 'Critical analysis', 'Scholarly impact'],
      'Social Sciences': ['Research methods', 'Statistical analysis', 'Policy implications'],
      'Education': ['Teaching philosophy', 'Curriculum development', 'Student outcomes']
    };

    return emphasis[discipline.toLowerCase()] || ['Research excellence', 'Academic contributions'];
  }

  private static analyzeAcademicProfile(cvContent: any): {
    careerStage: string;
    discipline: string;
    positionType: string;
    strengths: string[];
    improvementAreas: string[];
  } {
    // Simple heuristic-based analysis
    let careerStage = 'undergraduate';
    let discipline = 'General';
    let positionType = 'research-focused';

    // Analyze education to determine career stage
    if (cvContent.education) {
      const degrees = cvContent.education.map((edu: any) => edu.degree?.toLowerCase() || '');
      if (degrees.includes('phd') || degrees.includes('doctorate')) {
        careerStage = 'phd';
      } else if (degrees.includes('master') || degrees.includes('ms') || degrees.includes('ma')) {
        careerStage = 'masters';
      } else if (degrees.includes('bachelor') || degrees.includes('bs') || degrees.includes('ba')) {
        careerStage = 'undergraduate';
      }
    }

    // Analyze experience for teaching focus
    if (cvContent.teaching && cvContent.teaching.length > 0) {
      positionType = 'research-teaching';
    }

    // Analyze publications
    const strengths: string[] = [];
    const improvementAreas: string[] = [];

    if (cvContent.publications && cvContent.publications.length > 0) {
      strengths.push('Established publication record');
    } else {
      improvementAreas.push('Develop publication record');
    }

    if (cvContent.grants && cvContent.grants.length > 0) {
      strengths.push('Grant funding experience');
    } else {
      improvementAreas.push('Pursue grant opportunities');
    }

    return {
      careerStage,
      discipline,
      positionType,
      strengths,
      improvementAreas
    };
  }

  private static generateAcademicRecommendations(cvContent: any, profile: any): string[] {
    const recommendations: string[] = [];

    if (!cvContent.publications || cvContent.publications.length === 0) {
      recommendations.push('Focus on building publication record');
    }

    if (!cvContent.teaching || cvContent.teaching.length === 0) {
      recommendations.push('Gain teaching experience through assistantships');
    }

    if (!cvContent.grants || cvContent.grants.length === 0) {
      recommendations.push('Apply for research grants and fellowships');
    }

    if (profile.careerStage === 'phd' || profile.careerStage === 'postdoc') {
      recommendations.push('Develop independent research agenda');
    }

    recommendations.push('Build professional network through conferences');
    recommendations.push('Seek mentorship from senior colleagues');

    return recommendations;
  }
}