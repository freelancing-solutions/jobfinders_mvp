/**
 * Industry Template Manager
 * Manages industry-specific templates with intelligent matching and recommendations
 */

import { ResumeTemplate, TemplateMatchResult } from '@/types/template';
import { TemplateEngineError, TemplateErrorType } from './errors';
import { softwareEngineerTemplate } from '@/templates/industry/software-engineer';
import { healthcareProfessionalTemplate } from '@/templates/industry/healthcare-professional';
import { financeProfessionalTemplate } from '@/templates/industry/finance-professional';
import { marketingCreativeTemplate } from '@/templates/industry/marketing-creative';
import { educationAcademicTemplate } from '@/templates/industry/education-academic';

export class IndustryTemplateManager {
  private static readonly INDUSTRY_TEMPLATES: Map<string, ResumeTemplate> = new Map([
    ['software-engineer', softwareEngineerTemplate],
    ['healthcare-professional', healthcareProfessionalTemplate],
    ['finance-professional', financeProfessionalTemplate],
    ['marketing-creative', marketingCreativeTemplate],
    ['education-academic', educationAcademicTemplate]
  ]);

  private static readonly ROLE_TO_TEMPLATE_MAPPING: Record<string, string[]> = {
    // Technology roles
    'software engineer': ['software-engineer'],
    'full stack developer': ['software-engineer'],
    'frontend developer': ['software-engineer'],
    'backend developer': ['software-engineer'],
    'devops engineer': ['software-engineer'],
    'software developer': ['software-engineer'],
    'web developer': ['software-engineer'],
    'mobile developer': ['software-engineer'],
    'data scientist': ['software-engineer'],
    'machine learning engineer': ['software-engineer'],
    'qa engineer': ['software-engineer'],
    'technical lead': ['software-engineer'],
    'engineering manager': ['software-engineer'],

    // Healthcare roles
    'registered nurse': ['healthcare-professional'],
    'physician assistant': ['healthcare-professional'],
    'medical doctor': ['healthcare-professional'],
    'healthcare administrator': ['healthcare-professional'],
    'clinical specialist': ['healthcare-professional'],
    'medical technician': ['healthcare-professional'],
    'physical therapist': ['healthcare-professional'],
    'pharmacist': ['healthcare-professional'],
    'medical assistant': ['healthcare-professional'],
    'healthcare manager': ['healthcare-professional'],
    'clinical researcher': ['healthcare-professional'],

    // Finance roles
    'financial analyst': ['finance-professional'],
    'investment banker': ['finance-professional'],
    'portfolio manager': ['finance-professional'],
    'risk manager': ['finance-professional'],
    'financial controller': ['finance-professional'],
    'corporate finance manager': ['finance-professional'],
    'investment advisor': ['finance-professional'],
    'credit analyst': ['finance-professional'],
    'financial advisor': ['finance-professional'],
    'wealth manager': ['finance-professional'],
    'tax specialist': ['finance-professional'],
    'compliance officer': ['finance-professional'],

    // Marketing & Creative roles
    'marketing manager': ['marketing-creative'],
    'creative director': ['marketing-creative'],
    'graphic designer': ['marketing-creative'],
    'content creator': ['marketing-creative'],
    'social media manager': ['marketing-creative'],
    'brand manager': ['marketing-creative'],
    'ux/ui designer': ['marketing-creative'],
    'digital marketing specialist': ['marketing-creative'],
    'art director': ['marketing-creative'],
    'copywriter': ['marketing-creative'],
    'marketing analyst': ['marketing-creative'],
    'product designer': ['marketing-creative'],
    'video producer': ['marketing-creative'],

    // Education roles
    'professor': ['education-academic'],
    'research scientist': ['education-academic'],
    'academic advisor': ['education-academic'],
    'department chair': ['education-academic'],
    'postdoctoral researcher': ['education-academic'],
    'lecturer': ['education-academic'],
    'education director': ['education-academic'],
    'curriculum developer': ['education-academic'],
    'academic administrator': ['education-academic'],
    'teacher': ['education-academic'],
    'principal': ['education-academic'],
    'education consultant': ['education-academic']
  };

  private static readonly INDUSTRY_TO_TEMPLATE_MAPPING: Record<string, string[]> = {
    'technology': ['software-engineer'],
    'software': ['software-engineer'],
    'it services': ['software-engineer'],
    'computer software': ['software-engineer'],
    'internet': ['software-engineer'],
    'fintech': ['software-engineer', 'finance-professional'],
    'healthtech': ['software-engineer', 'healthcare-professional'],
    'edtech': ['software-engineer', 'education-academic'],

    'healthcare': ['healthcare-professional'],
    'medical services': ['healthcare-professional'],
    'hospital': ['healthcare-professional'],
    'pharmaceutical': ['healthcare-professional'],
    'biotechnology': ['healthcare-professional'],
    'medical devices': ['healthcare-professional'],

    'banking': ['finance-professional'],
    'investment': ['finance-professional'],
    'insurance': ['finance-professional'],
    'financial services': ['finance-professional'],
    'asset management': ['finance-professional'],
    'venture capital': ['finance-professional'],
    'private equity': ['finance-professional'],
    'corporate finance': ['finance-professional'],
    'accounting': ['finance-professional'],

    'marketing': ['marketing-creative'],
    'advertising': ['marketing-creative'],
    'design': ['marketing-creative'],
    'media': ['marketing-creative'],
    'entertainment': ['marketing-creative'],
    'e-commerce': ['marketing-creative'],
    'fashion': ['marketing-creative'],
    'publishing': ['marketing-creative'],
    'consumer goods': ['marketing-creative'],

    'higher education': ['education-academic'],
    'research': ['education-academic'],
    'education': ['education-academic'],
    'educational publishing': ['education-academic'],
    'nonprofit education': ['education-academic'],
    'government education': ['education-academic'],
    'k-12 education': ['education-academic']
  };

  private static readonly SKILL_PATTERNS: Record<string, string[]> = {
    technical: [
      'programming', 'software development', 'coding', 'javascript', 'python', 'java',
      'react', 'node.js', 'aws', 'azure', 'sql', 'database', 'api', 'git', 'agile'
    ],
    healthcare: [
      'patient care', 'clinical', 'medical', 'nursing', 'hipaa', 'electronic health records',
      'medical terminology', 'diagnosis', 'treatment', 'healthcare', 'clinical skills'
    ],
    finance: [
      'financial analysis', 'investment', 'portfolio management', 'risk assessment',
      'financial modeling', 'valuation', 'accounting', 'budgeting', 'forecasting', 'compliance'
    ],
    creative: [
      'design', 'creative', 'marketing', 'branding', 'social media', 'content creation',
      'graphic design', 'ux design', 'adobe creative suite', 'video editing', 'copywriting'
    ],
    education: [
      'teaching', 'curriculum development', 'education', 'pedagogy', 'student assessment',
      'academic', 'research', 'educational technology', 'classroom management', 'instruction'
    ]
  };

  /**
   * Get all industry templates
   */
  static getAllIndustryTemplates(): ResumeTemplate[] {
    return Array.from(this.INDUSTRY_TEMPLATES.values());
  }

  /**
   * Get template by ID
   */
  static getTemplateById(templateId: string): ResumeTemplate | null {
    return this.INDUSTRY_TEMPLATES.get(templateId) || null;
  }

  /**
   * Get templates by industry
   */
  static getTemplatesByIndustry(industry: string): ResumeTemplate[] {
    const normalizedIndustry = industry.toLowerCase();
    const templateIds = this.INDUSTRY_TO_TEMPLATE_MAPPING[normalizedIndustry] || [];

    return templateIds
      .map(id => this.INDUSTRY_TEMPLATES.get(id))
      .filter(template => template !== undefined) as ResumeTemplate[];
  }

  /**
   * Find best matching templates based on user profile
   */
  static findMatchingTemplates(userProfile: {
    targetRole?: string;
    industry?: string;
    skills?: string[];
    experienceLevel?: 'entry' | 'mid' | 'senior' | 'executive';
  }): TemplateMatchResult[] {
    const matches: TemplateMatchResult[] = [];
    const allTemplates = this.getAllIndustryTemplates();

    allTemplates.forEach(template => {
      const score = this.calculateMatchScore(template, userProfile);
      if (score > 0) {
        matches.push({
          template,
          score,
          reasons: this.getMatchReasons(template, userProfile)
        });
      }
    });

    // Sort by score descending
    matches.sort((a, b) => b.score - a.score);

    return matches.slice(0, 5); // Return top 5 matches
  }

  /**
   * Get template recommendations for specific role
   */
  static getRecommendationsForRole(role: string): TemplateMatchResult[] {
    const normalizedRole = role.toLowerCase();
    const templateIds = this.ROLE_TO_TEMPLATE_MAPPING[normalizedRole] || [];

    return templateIds
      .map(id => {
        const template = this.INDUSTRY_TEMPLATES.get(id);
        if (!template) return null;

        return {
          template,
          score: this.calculateRoleMatchScore(template, normalizedRole),
          reasons: this.getRoleMatchReasons(template, normalizedRole)
        };
      })
      .filter(match => match !== null && match.score > 0) as TemplateMatchResult[];
  }

  /**
   * Get industry-specific recommendations
   */
  static getIndustryRecommendations(industry: string): {
    primaryTemplate: ResumeTemplate | null;
    alternativeTemplates: ResumeTemplate[];
    industryInsights: {
      keySkills: string[];
      commonFormats: string[];
      atsConsiderations: string[];
    };
  } {
    const templates = this.getTemplatesByIndustry(industry);
    const primaryTemplate = templates[0] || null;
    const alternativeTemplates = templates.slice(1);

    const industryInsights = this.getIndustryInsights(industry);

    return {
      primaryTemplate,
      alternativeTemplates,
      industryInsights
    };
  }

  /**
   * Analyze resume and suggest industry template
   */
  static analyzeAndSuggest(resumeContent: {
    experience?: Array<{ title?: string; description?: string }>;
    skills?: string[];
    education?: Array<{ degree?: string; field?: string }>;
  }): TemplateMatchResult[] {
    const extractedText = [
      ...resumeContent.experience?.map(exp => `${exp.title} ${exp.description}`) || [],
      ...resumeContent.skills || [],
      ...resumeContent.education?.map(edu => `${edu.degree} ${edu.field}`) || []
    ].join(' ').toLowerCase();

    const profile = {
      skills: resumeContent.skills || [],
      // Extract role from most recent experience
      targetRole: resumeContent.experience?.[0]?.title || '',
      // Extract industry from experience descriptions
      industry: this.extractIndustryFromText(extractedText)
    };

    return this.findMatchingTemplates(profile);
  }

  /**
   * Get template customization recommendations
   */
  static getCustomizationRecommendations(templateId: string, userProfile: {
    experienceLevel?: 'entry' | 'mid' | 'senior' | 'executive';
    industry?: string;
    role?: string;
  }): {
    colorThemes: string[];
    fontCombinations: string[];
    layoutPresets: string[];
    sectionPriorities: Array<{ sectionId: string; priority: number; recommendation: string }>;
  } {
    const template = this.getTemplateById(templateId);
    if (!template) {
      throw new TemplateEngineError(
        TemplateErrorType.NOT_FOUND,
        `Template '${templateId}' not found`,
        { templateId }
      );
    }

    const recommendations = {
      colorThemes: [...template.customization.colorThemes],
      fontCombinations: [...template.customization.fontCombinations],
      layoutPresets: [...template.customization.layoutPresets],
      sectionPriorities: this.getSectionPriorities(template, userProfile)
    };

    // Customize based on experience level
    if (userProfile.experienceLevel) {
      if (userProfile.experienceLevel === 'entry') {
        recommendations.colorThemes = recommendations.colorThemes.filter(theme =>
          !['executive', 'leadership'].includes(theme)
        );
        recommendations.layoutPresets = ['modern', 'spacious'];
      } else if (userProfile.experienceLevel === 'executive') {
        recommendations.colorThemes = recommendations.colorThemes.filter(theme =>
          ['executive', 'leadership', 'corporate'].includes(theme)
        );
        recommendations.fontCombinations = recommendations.fontCombinations.filter(combo =>
          ['Executive Elegance', 'Corporate Classic'].includes(combo)
        );
      }
    }

    return recommendations;
  }

  // Private helper methods
  private static calculateMatchScore(template: ResumeTemplate, profile: {
    targetRole?: string;
    industry?: string;
    skills?: string[];
    experienceLevel?: 'entry' | 'mid' | 'senior' | 'executive';
  }): number {
    let score = 0;

    // Industry match
    if (profile.industry && template.industry === profile.industry.toLowerCase()) {
      score += 40;
    }

    // Role match
    if (profile.targetRole) {
      const targetRoles = template.metadata.targetRoles.map(role => role.toLowerCase());
      const normalizedTargetRole = profile.targetRole.toLowerCase();

      if (targetRoles.includes(normalizedTargetRole)) {
        score += 35;
      } else {
        // Partial match
        const roleWords = normalizedTargetRole.split(' ');
        const matchCount = roleWords.filter(word =>
          targetRoles.some(role => role.includes(word))
        ).length;
        score += (matchCount / roleWords.length) * 20;
      }
    }

    // Skills match
    if (profile.skills && profile.skills.length > 0) {
      const atsKeywords = template.metadata.atsOptimization.keywords;
      const skillMatches = profile.skills.filter(skill =>
        atsKeywords.some(keyword =>
          skill.toLowerCase().includes(keyword.toLowerCase()) ||
          keyword.toLowerCase().includes(skill.toLowerCase())
        )
      ).length;
      score += (skillMatches / profile.skills.length) * 20;
    }

    // Experience level match
    if (profile.experienceLevel && template.metadata.experienceLevels.includes(profile.experienceLevel)) {
      score += 5;
    }

    return Math.round(score);
  }

  private static calculateRoleMatchScore(template: ResumeTemplate, role: string): number {
    const targetRoles = template.metadata.targetRoles.map(r => r.toLowerCase());

    if (targetRoles.includes(role)) {
      return 100;
    }

    // Partial matching
    const roleWords = role.split(' ');
    const matchCount = roleWords.filter(word =>
      targetRoles.some(templateRole => templateRole.includes(word))
    ).length;

    return Math.round((matchCount / roleWords.length) * 70);
  }

  private static getMatchReasons(template: ResumeTemplate, profile: {
    targetRole?: string;
    industry?: string;
    skills?: string[];
    experienceLevel?: 'entry' | 'mid' | 'senior' | 'executive';
  }): string[] {
    const reasons: string[] = [];

    if (profile.industry && template.industry === profile.industry.toLowerCase()) {
      reasons.push(`Optimized for ${profile.industry} industry`);
    }

    if (profile.targetRole) {
      const targetRoles = template.metadata.targetRoles.map(role => role.toLowerCase());
      if (targetRoles.includes(profile.targetRole.toLowerCase())) {
        reasons.push(`Designed for ${profile.targetRole} roles`);
      }
    }

    if (profile.experienceLevel && template.metadata.experienceLevels.includes(profile.experienceLevel)) {
      reasons.push(`Suitable for ${profile.experienceLevel} level professionals`);
    }

    if (template.atsScore >= 95) {
      reasons.push(`High ATS optimization score (${template.atsScore}/100)`);
    }

    return reasons;
  }

  private static getRoleMatchReasons(template: ResumeTemplate, role: string): string[] {
    return [`Designed for ${role} positions`, `Industry-optimized formatting`, `ATS-optimized structure`];
  }

  private static getIndustryInsights(industry: string): {
    keySkills: string[];
    commonFormats: string[];
    atsConsiderations: string[];
  } {
    const insights: Record<string, any> = {
      technology: {
        keySkills: ['programming', 'software development', 'cloud computing', 'agile methodologies'],
        commonFormats: ['two-column', 'modern'],
        atsConsiderations: ['include technical keywords', 'quantify achievements', 'show project impact']
      },
      healthcare: {
        keySkills: ['patient care', 'clinical skills', 'medical terminology', 'HIPAA compliance'],
        commonFormats: ['single-column', 'traditional'],
        atsConsiderations: ['include license numbers', 'show certifications', 'emphasize clinical experience']
      },
      finance: {
        keySkills: ['financial analysis', 'risk management', 'investment strategies', 'regulatory compliance'],
        commonFormats: ['single-column', 'conservative'],
        atsConsiderations: ['quantify financial results', 'include certifications', 'show analytical skills']
      },
      creative: {
        keySkills: ['creative design', 'brand development', 'digital marketing', 'content creation'],
        commonFormats: ['two-column', 'visual'],
        atsConsiderations: ['balance creativity with ATS-friendliness', 'include portfolio links', 'show campaign results']
      },
      education: {
        keySkills: ['curriculum development', 'teaching methodologies', 'research', 'academic writing'],
        commonFormats: ['single-column', 'academic'],
        atsConsiderations: ['include publications', 'show teaching experience', 'emphasize research contributions']
      }
    };

    return insights[industry.toLowerCase()] || {
      keySkills: [],
      commonFormats: ['single-column'],
      atsConsiderations: ['Ensure ATS compatibility', 'Include relevant keywords', 'Quantify achievements']
    };
  }

  private static extractIndustryFromText(text: string): string {
    const industryKeywords: Record<string, string[]> = {
      technology: ['software', 'programming', 'development', 'coding', 'api', 'database', 'cloud', 'tech'],
      healthcare: ['patient', 'medical', 'clinical', 'healthcare', 'nursing', 'hospital', 'treatment'],
      finance: ['financial', 'investment', 'banking', 'portfolio', 'risk', 'compliance', 'accounting'],
      creative: ['design', 'creative', 'marketing', 'brand', 'advertising', 'content', 'social media'],
      education: ['teaching', 'education', 'curriculum', 'student', 'academic', 'research', 'classroom']
    };

    for (const [industry, keywords] of Object.entries(industryKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return industry;
      }
    }

    return '';
  }

  private static getSectionPriorities(template: ResumeTemplate, userProfile: {
    experienceLevel?: 'entry' | 'mid' | 'senior' | 'executive';
    industry?: string;
    role?: string;
  }): Array<{ sectionId: string; priority: number; recommendation: string }> {
    const priorities: Array<{ sectionId: string; priority: number; recommendation: string }> = [];

    // Base priorities from template sections
    template.sections.forEach(section => {
      let priority = 50; // Base priority
      let recommendation = 'Keep this section visible';

      if (section.required) {
        priority = 100;
        recommendation = 'Required section - always visible';
      } else if (userProfile.experienceLevel === 'entry' && section.id === 'education') {
        priority = 90;
        recommendation = 'Important for entry-level candidates';
      } else if (userProfile.experienceLevel === 'senior' && section.id === 'experience') {
        priority = 95;
        recommendation = 'Critical for senior-level positions';
      }

      priorities.push({
        sectionId: section.id,
        priority,
        recommendation
      });
    });

    return priorities.sort((a, b) => b.priority - a.priority);
  }
}