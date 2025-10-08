import { prisma } from '@/lib/prisma';
import { Resume, Job, Application, User } from '@prisma/client';

// Types for ATS processing
interface KeywordExtraction {
  skills: Array<{
    keyword: string;
    category: 'technical' | 'soft' | 'certification' | 'experience';
    weight: number;
    frequency: number;
    context: string[];
  }>;
  experience: Array<{
    keyword: string;
    level: 'entry' | 'mid' | 'senior' | 'executive';
    weight: number;
    context: string[];
  }>;
  education: Array<{
    keyword: string;
    level: string;
    weight: number;
    context: string[];
  }>;
  industry: Array<{
    keyword: string;
    relevance: number;
    category: string;
  }>;
}

interface ResumeScore {
  overallScore: number;
  breakdown: {
    skillsMatch: number;
    experienceMatch: number;
    educationMatch: number;
    industryMatch: number;
    additionalFactors: number;
  };
  details: {
    matchedSkills: string[];
    missingSkills: string[];
    experienceAlignment: string;
    educationAlignment: string;
    recommendations: string[];
  };
  confidence: number;
  processingTime: number;
}

interface ComplianceCheck {
  status: 'compliant' | 'warning' | 'non_compliant';
  checks: Array<{
    type: 'eeoc' | 'gdpr' | 'ada' | 'bias' | 'data_privacy';
    status: 'pass' | 'fail' | 'warning';
    description: string;
    recommendation?: string;
  }>;
  riskScore: number;
  auditTrail: string[];
}

interface ATSSettings {
  skillWeights: Record<string, number>;
  experienceWeights: Record<string, number>;
  educationWeights: Record<string, number>;
  enableBiasDetection: boolean;
  enableComplianceChecking: boolean;
  customKeywords: string[];
  excludedKeywords: string[];
}

export class ATSEngine {
  private static instance: ATSEngine;
  private industryKeywords: Map<string, KeywordExtraction> = new Map();
  private skillDatabase: Map<string, { category: string; weight: number }> = new Map();
  private biasKeywords: Set<string> = new Set();
  private complianceRules: Map<string, any> = new Map();

  static getInstance(): ATSEngine {
    if (!ATSEngine.instance) {
      ATSEngine.instance = new ATSEngine();
    }
    return ATSEngine.instance;
  }

  private constructor() {
    this.initializeSkillDatabase();
    this.initializeBiasDetection();
    this.initializeComplianceRules();
  }

  private initializeSkillDatabase() {
    // Technical skills with categories and weights
    const technicalSkills = {
      'javascript': { category: 'programming', weight: 0.9 },
      'python': { category: 'programming', weight: 0.9 },
      'react': { category: 'framework', weight: 0.85 },
      'node.js': { category: 'framework', weight: 0.85 },
      'typescript': { category: 'programming', weight: 0.85 },
      'aws': { category: 'cloud', weight: 0.8 },
      'docker': { category: 'devops', weight: 0.8 },
      'kubernetes': { category: 'devops', weight: 0.85 },
      'sql': { category: 'database', weight: 0.8 },
      'mongodb': { category: 'database', weight: 0.75 },
      'java': { category: 'programming', weight: 0.85 },
      'c++': { category: 'programming', weight: 0.85 },
      'git': { category: 'tool', weight: 0.9 },
      'agile': { category: 'methodology', weight: 0.7 },
      'scrum': { category: 'methodology', weight: 0.7 },
      'machine learning': { category: 'ai', weight: 0.9 },
      'data analysis': { category: 'analytics', weight: 0.8 },
      'artificial intelligence': { category: 'ai', weight: 0.9 },
      'tensorflow': { category: 'ai', weight: 0.85 },
      'pytorch': { category: 'ai', weight: 0.85 }
    };

    // Soft skills
    const softSkills = {
      'leadership': { category: 'soft', weight: 0.7 },
      'communication': { category: 'soft', weight: 0.7 },
      'teamwork': { category: 'soft', weight: 0.6 },
      'problem solving': { category: 'soft', weight: 0.7 },
      'project management': { category: 'management', weight: 0.8 },
      'time management': { category: 'soft', weight: 0.6 },
      'adaptability': { category: 'soft', weight: 0.6 },
      'creativity': { category: 'soft', weight: 0.6 },
      'critical thinking': { category: 'soft', weight: 0.7 }
    };

    // Certifications
    const certifications = {
      'pmp': { category: 'certification', weight: 0.8 },
      'aws certified': { category: 'certification', weight: 0.85 },
      'google cloud': { category: 'certification', weight: 0.8 },
      'microsoft certified': { category: 'certification', weight: 0.75 },
      'cfa': { category: 'certification', weight: 0.9 },
      'cpa': { category: 'certification', weight: 0.9 },
      'phd': { category: 'education', weight: 0.9 },
      'master': { category: 'education', weight: 0.8 },
      'bachelor': { category: 'education', weight: 0.7 }
    };

    Object.entries(technicalSkills).forEach(([skill, data]) => {
      this.skillDatabase.set(skill, data);
    });

    Object.entries(softSkills).forEach(([skill, data]) => {
      this.skillDatabase.set(skill, data);
    });

    Object.entries(certifications).forEach(([skill, data]) => {
      this.skillDatabase.set(skill, data);
    });
  }

  private initializeBiasDetection() {
    // Keywords that might indicate bias
    const biasedTerms = [
      'young', 'energetic', 'recent graduate', 'fresh', 'new blood',
      'mature', 'experienced worker', 'seasoned', 'veteran',
      'male', 'female', 'he', 'she', 'his', 'her',
      'native speaker', 'citizen', 'national', 'local'
    ];

    biasedTerms.forEach(term => this.biasKeywords.add(term.toLowerCase()));
  }

  private initializeComplianceRules() {
    // EEOC compliance rules
    this.complianceRules.set('eeoc', {
      prohibitedQuestions: [
        'age', 'marital status', 'religion', 'national origin',
        'disability', 'pregnancy', 'children', 'childcare'
      ],
      requiredStatements: [
        'Equal Opportunity Employer',
        'EEOC compliance'
      ]
    });

    // GDPR compliance rules
    this.complianceRules.set('gdpr', {
      consentRequired: true,
      dataRetention: 730, // days
      rightToDeletion: true,
      dataMinimization: true
    });

    // ADA compliance rules
    this.complianceRules.set('ada', {
      accessibilityRequired: true,
      reasonableAccommodation: true,
      disabilityNonDiscrimination: true
    });
  }

  async extractKeywords(text: string, type: 'resume' | 'job'): Promise<KeywordExtraction> {
    const startTime = Date.now();

    // Normalize text
    const normalizedText = text.toLowerCase().replace(/[^\w\s]/g, ' ');
    const words = normalizedText.split(/\s+/).filter(word => word.length > 2);
    const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);

    const extraction: KeywordExtraction = {
      skills: [],
      experience: [],
      education: [],
      industry: []
    };

    // Extract skill keywords
    const skillCounts = new Map<string, { count: number; contexts: string[] }>();

    for (const skill of this.skillDatabase.keys()) {
      const regex = new RegExp(`\\b${skill.replace(/\s+/g, '\\s+')}\\b`, 'gi');
      const matches = text.match(regex);

      if (matches) {
        const contexts = sentences.filter(sentence =>
          sentence.toLowerCase().includes(skill.toLowerCase())
        ).slice(0, 3); // Keep first 3 contexts

        skillCounts.set(skill, {
          count: matches.length,
          contexts
        });
      }
    }

    // Process skills with categories and weights
    for (const [skill, data] of skillCounts) {
      const skillInfo = this.skillDatabase.get(skill);
      if (skillInfo) {
        extraction.skills.push({
          keyword: skill,
          category: skillInfo.category as any,
          weight: skillInfo.weight * Math.min(data.count / 3, 1), // Cap weight at 3 mentions
          frequency: data.count,
          context: data.contexts
        });
      }
    }

    // Extract experience level keywords
    const experiencePatterns = {
      'entry': ['entry level', 'junior', 'associate', 'intern', 'trainee', '0-1 years', '1-2 years'],
      'mid': ['mid level', 'intermediate', '3-5 years', '4-6 years', 'experienced'],
      'senior': ['senior', 'lead', 'principal', '5+ years', '7+ years', 'expert'],
      'executive': ['executive', 'director', 'vp', 'c-level', 'manager', 'head of']
    };

    for (const [level, keywords] of Object.entries(experiencePatterns)) {
      for (const keyword of keywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = text.match(regex);

        if (matches) {
          const contexts = sentences.filter(sentence =>
            sentence.toLowerCase().includes(keyword.toLowerCase())
          ).slice(0, 2);

          extraction.experience.push({
            keyword,
            level: level as any,
            weight: matches.length * 0.3,
            context: contexts
          });
        }
      }
    }

    // Extract education keywords
    const educationPatterns = {
      'high school': ['high school', 'ged', 'diploma'],
      'associate': ['associate', 'aa', 'as'],
      'bachelor': ['bachelor', 'ba', 'bs', 'undergraduate'],
      'master': ['master', 'ma', 'ms', 'mba', 'graduate'],
      'phd': ['phd', 'doctorate', 'doctor', 'postgraduate']
    };

    for (const [level, keywords] of Object.entries(educationPatterns)) {
      for (const keyword of keywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = text.match(regex);

        if (matches) {
          const contexts = sentences.filter(sentence =>
            sentence.toLowerCase().includes(keyword.toLowerCase())
          ).slice(0, 2);

          extraction.education.push({
            keyword,
            level,
            weight: matches.length * 0.4,
            context: contexts
          });
        }
      }
    }

    // Extract industry keywords
    const industryKeywords = [
      { category: 'technology', keywords: ['software', 'it', 'tech', 'saas', 'fintech', 'healthtech'] },
      { category: 'healthcare', keywords: ['healthcare', 'medical', 'hospital', 'clinical', 'pharmaceutical'] },
      { category: 'finance', keywords: ['finance', 'banking', 'investment', 'insurance', 'accounting'] },
      { category: 'education', keywords: ['education', 'school', 'university', 'academic', 'teaching'] },
      { category: 'retail', keywords: ['retail', 'sales', 'customer service', 'merchandising'] },
      { category: 'manufacturing', keywords: ['manufacturing', 'production', 'logistics', 'supply chain'] }
    ];

    for (const industry of industryKeywords) {
      for (const keyword of industry.keywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = text.match(regex);

        if (matches) {
          extraction.industry.push({
            keyword,
            relevance: matches.length * 0.2,
            category: industry.category
          });
        }
      }
    }

    // Sort by weight/relevance
    extraction.skills.sort((a, b) => b.weight - a.weight);
    extraction.experience.sort((a, b) => b.weight - a.weight);
    extraction.education.sort((a, b) => b.weight - a.weight);
    extraction.industry.sort((a, b) => b.relevance - a.relevance);

    return extraction;
  }

  async scoreResume(
    resumeText: string,
    jobText: string,
    settings?: Partial<ATSSettings>
  ): Promise<ResumeScore> {
    const startTime = Date.now();

    const defaultSettings: ATSSettings = {
      skillWeights: { 'technical': 0.4, 'soft': 0.3, 'certification': 0.3 },
      experienceWeights: { 'entry': 0.25, 'mid': 0.35, 'senior': 0.3, 'executive': 0.1 },
      educationWeights: { 'high school': 0.2, 'associate': 0.3, 'bachelor': 0.4, 'master': 0.45, 'phd': 0.5 },
      enableBiasDetection: true,
      enableComplianceChecking: true,
      customKeywords: [],
      excludedKeywords: []
    };

    const finalSettings = { ...defaultSettings, ...settings };

    // Extract keywords from both documents
    const resumeKeywords = await this.extractKeywords(resumeText, 'resume');
    const jobKeywords = await this.extractKeywords(jobText, 'job');

    // Calculate skills match
    const skillsMatch = this.calculateSkillsMatch(resumeKeywords.skills, jobKeywords.skills, finalSettings.skillWeights);

    // Calculate experience match
    const experienceMatch = this.calculateExperienceMatch(resumeKeywords.experience, jobKeywords.experience, finalSettings.experienceWeights);

    // Calculate education match
    const educationMatch = this.calculateEducationMatch(resumeKeywords.education, jobKeywords.education, finalSettings.educationWeights);

    // Calculate industry match
    const industryMatch = this.calculateIndustryMatch(resumeKeywords.industry, jobKeywords.industry);

    // Calculate additional factors (formatting, completeness, etc.)
    const additionalFactors = this.calculateAdditionalFactors(resumeText, resumeKeywords);

    // Calculate overall score using business rule weights
    const overallScore = Math.round(
      skillsMatch.score * 0.4 +
      experienceMatch.score * 0.3 +
      educationMatch.score * 0.2 +
      industryMatch.score * 0.05 +
      additionalFactors * 0.05
    );

    // Generate details and recommendations
    const details = this.generateScoreDetails(
      skillsMatch,
      experienceMatch,
      educationMatch,
      industryMatch,
      resumeKeywords,
      jobKeywords
    );

    const processingTime = Date.now() - startTime;
    const confidence = this.calculateConfidence(skillsMatch, experienceMatch, educationMatch);

    return {
      overallScore,
      breakdown: {
        skillsMatch: skillsMatch.score,
        experienceMatch: experienceMatch.score,
        educationMatch: educationMatch.score,
        industryMatch,
        additionalFactors
      },
      details,
      confidence,
      processingTime
    };
  }

  private calculateSkillsMatch(
    resumeSkills: any[],
    jobSkills: any[],
    weights: Record<string, number>
  ): { score: number; matchedSkills: string[]; missingSkills: string[] } {
    if (jobSkills.length === 0) return { score: 0.5, matchedSkills: [], missingSkills: [] };

    const resumeSkillMap = new Map(resumeSkills.map(skill => [skill.keyword.toLowerCase(), skill]));
    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];
    let totalScore = 0;
    let totalWeight = 0;

    for (const jobSkill of jobSkills) {
      const resumeSkill = resumeSkillMap.get(jobSkill.keyword.toLowerCase());
      const weight = weights[jobSkill.category] || 0.5;

      if (resumeSkill) {
        matchedSkills.push(jobSkill.keyword);
        // Score based on weight and frequency
        const skillScore = Math.min(resumeSkill.weight * 2, 1) * weight;
        totalScore += skillScore;
        totalWeight += weight;
      } else {
        missingSkills.push(jobSkill.keyword);
        totalWeight += weight;
      }
    }

    const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;

    return {
      score: Math.min(finalScore, 1),
      matchedSkills,
      missingSkills
    };
  }

  private calculateExperienceMatch(
    resumeExperience: any[],
    jobExperience: any[],
    weights: Record<string, number>
  ): { score: number; alignment: string } {
    if (jobExperience.length === 0) return { score: 0.5, alignment: 'No specific experience requirements' };

    const resumeExpLevels = new Map(resumeExperience.map(exp => [exp.level, exp.weight]));
    let totalScore = 0;
    let totalWeight = 0;
    let alignment = '';

    for (const jobExp of jobExperience) {
      const resumeExpWeight = resumeExpLevels.get(jobExp.level) || 0;
      const weight = weights[jobExp.level] || 0.25;

      const expScore = Math.min(resumeExpWeight / (jobExp.weight || 1), 1) * weight;
      totalScore += expScore;
      totalWeight += weight;

      if (resumeExpWeight > 0) {
        alignment = `Experience level matches: ${jobExp.level}`;
      }
    }

    const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;

    return {
      score: Math.min(finalScore, 1),
      alignment: alignment || 'Experience level may not align perfectly'
    };
  }

  private calculateEducationMatch(
    resumeEducation: any[],
    jobEducation: any[],
    weights: Record<string, number>
  ): { score: number; alignment: string } {
    if (jobEducation.length === 0) return { score: 0.5, alignment: 'No specific education requirements' };

    const resumeEduLevels = new Map(resumeEducation.map(edu => [edu.level, edu.weight]));
    let totalScore = 0;
    let totalWeight = 0;
    let alignment = '';

    for (const jobEdu of jobEducation) {
      const resumeEduWeight = resumeEduLevels.get(jobEdu.level) || 0;
      const weight = weights[jobEdu.level] || 0.2;

      const eduScore = Math.min(resumeEduWeight / (jobEdu.weight || 1), 1) * weight;
      totalScore += eduScore;
      totalWeight += weight;

      if (resumeEduWeight > 0) {
        alignment = `Education level matches: ${jobEdu.level}`;
      }
    }

    const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;

    return {
      score: Math.min(finalScore, 1),
      alignment: alignment || 'Education level may not meet requirements'
    };
  }

  private calculateIndustryMatch(resumeIndustry: any[], jobIndustry: any[]): number {
    if (jobIndustry.length === 0) return 0.7; // Neutral score if no industry specified

    const resumeIndustryMap = new Map(resumeIndustry.map(ind => [ind.category, ind.relevance]));
    let totalScore = 0;

    for (const jobInd of jobIndustry) {
      const resumeIndRelevance = resumeIndustryMap.get(jobInd.category) || 0;
      totalScore += Math.min(resumeIndRelevance / (jobInd.relevance || 1), 1);
    }

    return Math.min(totalScore / jobIndustry.length, 1);
  }

  private calculateAdditionalFactors(resumeText: string, keywords: KeywordExtraction): number {
    let score = 0.5; // Base score

    // Check resume structure
    const hasContactInfo = /email|phone|@|\.com|\d{3}.*\d{3}.*\d{4}/i.test(resumeText);
    if (hasContactInfo) score += 0.1;

    // Check for professional summary
    const hasSummary = resumeText.length > 500;
    if (hasSummary) score += 0.1;

    // Check skill diversity
    const skillCategories = new Set(keywords.skills.map(skill => skill.category));
    if (skillCategories.size >= 3) score += 0.1;

    // Check experience details
    const hasDetailedExperience = keywords.experience.length > 0;
    if (hasDetailedExperience) score += 0.1;

    // Check education
    const hasEducation = keywords.education.length > 0;
    if (hasEducation) score += 0.1;

    return Math.min(score, 1);
  }

  private generateScoreDetails(
    skillsMatch: any,
    experienceMatch: any,
    educationMatch: any,
    industryMatch: number,
    resumeKeywords: KeywordExtraction,
    jobKeywords: KeywordExtraction
  ) {
    const recommendations: string[] = [];

    // Skills recommendations
    if (skillsMatch.missingSkills.length > 0) {
      recommendations.push(`Consider highlighting experience with: ${skillsMatch.missingSkills.slice(0, 3).join(', ')}`);
    }

    if (skillsMatch.matchedSkills.length < 5) {
      recommendations.push('Add more specific technical skills to your resume');
    }

    // Experience recommendations
    if (experienceMatch.score < 0.6) {
      recommendations.push('Emphasize relevant experience that aligns with job requirements');
    }

    // Education recommendations
    if (educationMatch.score < 0.5) {
      recommendations.push('Highlight relevant education and certifications');
    }

    // General recommendations
    if (industryMatch < 0.5) {
      recommendations.push('Consider including industry-specific experience and terminology');
    }

    return {
      matchedSkills: skillsMatch.matchedSkills,
      missingSkills: skillsMatch.missingSkills,
      experienceAlignment: experienceMatch.alignment,
      educationAlignment: educationMatch.alignment,
      recommendations
    };
  }

  private calculateConfidence(skillsMatch: any, experienceMatch: any, educationMatch: any): number {
    const scores = [skillsMatch.score, experienceMatch.score, educationMatch.score];
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);

    // Higher confidence when scores are consistent (low variance)
    const confidence = 1 - Math.min(standardDeviation, 1);
    return Math.round(confidence * 100);
  }

  async checkCompliance(text: string, type: 'job' | 'resume'): Promise<ComplianceCheck> {
    const checks = [];
    let riskScore = 0;
    const auditTrail: string[] = [];

    // EEOC compliance check
    const eeocCheck = this.checkEEOCCompliance(text);
    checks.push(eeocCheck);
    if (eeocCheck.status === 'fail') riskScore += 30;
    auditTrail.push(`EEOC check: ${eeocCheck.status}`);

    // Bias detection
    const biasCheck = this.detectBias(text);
    checks.push(biasCheck);
    if (biasCheck.status === 'fail') riskScore += 25;
    auditTrail.push(`Bias check: ${biasCheck.status}`);

    // ADA compliance
    const adaCheck = this.checkADACompliance(text);
    checks.push(adaCheck);
    if (adaCheck.status === 'fail') riskScore += 20;
    auditTrail.push(`ADA check: ${adaCheck.status}`);

    // GDPR compliance (for EU)
    const gdprCheck = this.checkGDPRCompliance(text, type);
    checks.push(gdprCheck);
    if (gdprCheck.status === 'fail') riskScore += 25;
    auditTrail.push(`GDPR check: ${gdprCheck.status}`);

    // Determine overall status
    const overallStatus = riskScore >= 50 ? 'non_compliant' :
                         riskScore >= 25 ? 'warning' : 'compliant';

    return {
      status: overallStatus,
      checks,
      riskScore,
      auditTrail
    };
  }

  private checkEEOCCompliance(text: string): any {
    const prohibitedQuestions = [
      'age', 'how old', 'date of birth', 'marital status',
      'married', 'children', 'pregnant', 'religion',
      'national origin', 'citizenship', 'disability'
    ];

    const lowerText = text.toLowerCase();
    const violations = prohibitedQuestions.filter(q => lowerText.includes(q));

    return {
      type: 'eeoc',
      status: violations.length > 0 ? 'fail' : 'pass',
      description: violations.length > 0 ?
        `Found potentially discriminatory questions: ${violations.join(', ')}` :
        'No EEOC violations detected',
      recommendation: violations.length > 0 ?
        'Remove age, marital status, and other protected characteristic questions' :
        undefined
    };
  }

  private detectBias(text: string): any {
    const lowerText = text.toLowerCase();
    const biasedTermsFound = Array.from(this.biasKeywords).filter(term =>
      lowerText.includes(term)
    );

    return {
      type: 'bias',
      status: biasedTermsFound.length > 0 ? 'warning' : 'pass',
      description: biasedTermsFound.length > 0 ?
        `Potentially biased terms detected: ${biasedTermsFound.slice(0, 3).join(', ')}` :
        'No obvious bias detected',
      recommendation: biasedTermsFound.length > 0 ?
        'Consider using more neutral, inclusive language' :
        undefined
    };
  }

  private checkADACompliance(text: string): any {
    const accessibilityKeywords = [
      'accessibility', 'accommodation', 'reasonable accommodation',
      'disability friendly', 'equal opportunity'
    ];

    const lowerText = text.toLowerCase();
    const hasAccessibilityStatement = accessibilityKeywords.some(keyword =>
      lowerText.includes(keyword)
    );

    return {
      type: 'ada',
      status: hasAccessibilityStatement ? 'pass' : 'warning',
      description: hasAccessibilityStatement ?
        'Accessibility statement found' :
        'No explicit accessibility statement found',
      recommendation: !hasAccessibilityStatement ?
        'Include statement about reasonable accommodations for disabilities' :
        undefined
    };
  }

  private checkGDPRCompliance(text: string, type: 'job' | 'resume'): any {
    // For job postings, check for data privacy statements
    // For resumes, check for appropriate consent language
    const privacyKeywords = [
      'privacy policy', 'data protection', 'consent', 'gdpr',
      'data retention', 'right to deletion'
    ];

    const lowerText = text.toLowerCase();
    const hasPrivacyStatement = privacyKeywords.some(keyword =>
      lowerText.includes(keyword)
    );

    return {
      type: 'gdpr',
      status: hasPrivacyStatement ? 'pass' : 'warning',
      description: hasPrivacyStatement ?
        'Data privacy statement found' :
        'No explicit data privacy statement found',
      recommendation: !hasPrivacyStatement ?
        'Include privacy and data protection statements' :
        undefined
    };
  }

  // Public methods for integration
  async processApplication(applicationId: string): Promise<{
    score: ResumeScore;
    compliance: ComplianceCheck;
    keywords: KeywordExtraction;
  }> {
    try {
      // Get application with related data
      const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: {
          user: {
            include: {
              resume: true
            }
          },
          job: true
        }
      });

      if (!application || !application.user?.resume?.[0]) {
        throw new Error('Application or resume not found');
      }

      const resume = application.user.resume[0];
      const job = application.job;

      // Process resume text (combine all resume sections)
      const resumeText = [
        resume.title || '',
        resume.summary || '',
        resume.experiences?.map((exp: any) => `${exp.title} ${exp.description}`).join(' ') || '',
        resume.skills?.map((skill: any) => skill.name).join(' ') || '',
        resume.educations?.map((edu: any) => `${edu.degree} ${edu.field}`).join(' ') || ''
      ].join(' ');

      const jobText = [
        job.title,
        job.description,
        job.requirements
      ].join(' ');

      // Run ATS analysis
      const keywords = await this.extractKeywords(resumeText, 'resume');
      const score = await this.scoreResume(resumeText, jobText);
      const compliance = await this.checkCompliance(jobText, 'job');

      // Store results in database
      await this.storeATSResults(applicationId, score, compliance, keywords);

      return {
        score,
        compliance,
        keywords
      };
    } catch (error) {
      console.error('Error processing application:', error);
      throw error;
    }
  }

  private async storeATSResults(
    applicationId: string,
    score: ResumeScore,
    compliance: ComplianceCheck,
    keywords: KeywordExtraction
  ) {
    // Store ATS analysis results
    await prisma.aTSAnalysis.create({
      data: {
        applicationId,
        overallScore: score.overallScore,
        skillsScore: score.breakdown.skillsMatch,
        experienceScore: score.breakdown.experienceMatch,
        educationScore: score.breakdown.educationMatch,
        industryScore: score.breakdown.industryMatch,
        confidence: score.confidence,
        processingTime: score.processingTime,
        complianceStatus: compliance.status,
        riskScore: compliance.riskScore,
        keywords: keywords as any,
        recommendations: score.details.recommendations,
        matchedSkills: score.details.matchedSkills,
        missingSkills: score.details.missingSkills,
        createdAt: new Date()
      }
    });

    // Create audit trail entry
    await prisma.auditLog.create({
      data: {
        userId: '', // Will be filled by middleware
        action: 'ATS_ANALYSIS',
        resource: `application:${applicationId}`,
        details: {
          score: score.overallScore,
          compliance: compliance.status,
          processingTime: score.processingTime
        },
        ipAddress: '', // Will be filled by middleware
        userAgent: '', // Will be filled by middleware
        timestamp: new Date()
      }
    });
  }

  async getATSInsights(jobId: string) {
    const analyses = await prisma.aTSAnalysis.findMany({
      where: {
        application: {
          jobId
        }
      },
      include: {
        application: {
          include: {
            user: true
          }
        }
      }
    });

    // Calculate aggregate insights
    const totalApplications = analyses.length;
    const averageScore = analyses.reduce((sum, a) => sum + a.overallScore, 0) / totalApplications;
    const compliantApplications = analyses.filter(a => a.complianceStatus === 'compliant').length;

    // Find most common missing skills
    const allMissingSkills = analyses.flatMap(a => a.missingSkills || []);
    const missingSkillCounts = allMissingSkills.reduce((acc, skill) => {
      acc[skill] = (acc[skill] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topMissingSkills = Object.entries(missingSkillCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([skill, count]) => ({ skill, count }));

    return {
      totalApplications,
      averageScore: Math.round(averageScore),
      complianceRate: Math.round((compliantApplications / totalApplications) * 100),
      topMissingSkills,
      scoreDistribution: this.calculateScoreDistribution(analyses)
    };
  }

  private calculateScoreDistribution(analyses: any[]) {
    const ranges = [
      { label: '90-100', min: 90, max: 100, count: 0 },
      { label: '80-89', min: 80, max: 89, count: 0 },
      { label: '70-79', min: 70, max: 79, count: 0 },
      { label: '60-69', min: 60, max: 69, count: 0 },
      { label: '50-59', min: 50, max: 59, count: 0 },
      { label: 'Below 50', min: 0, max: 49, count: 0 }
    ];

    analyses.forEach(analysis => {
      const range = ranges.find(r => analysis.overallScore >= r.min && analysis.overallScore <= r.max);
      if (range) range.count++;
    });

    return ranges.map(r => ({
      range: r.label,
      count: r.count,
      percentage: Math.round((r.count / analyses.length) * 100)
    }));
  }
}