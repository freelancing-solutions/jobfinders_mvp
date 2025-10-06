/**
 * Resume Parser Service
 *
 * Extracts structured resume data from unstructured text using pattern matching,
 * AI analysis, and data validation techniques.
 */

import { v4 as uuidv4 } from 'uuid';
import { Resume, PersonalInfo, Experience, Education, Skill, Project, Certification, Language } from '@/types/resume';
import { ResumeBuilderErrorFactory, withServiceErrorHandling } from './errors';
import { ResumeBuilderUtils } from './utils';
import { openAIService } from './openai-service';
import { textExtractor } from '@/lib/text-extractor';

export interface ParseOptions {
  useAI?: boolean;
  targetIndustry?: string;
  targetRole?: string;
  includeProjects?: boolean;
  includeCertifications?: boolean;
  strictValidation?: boolean;
}

export interface ParseResult {
  resume: Partial<Resume>;
  confidence: number; // 0-100
  parsingErrors: string[];
  warnings: string[];
  processingTime: number;
  aiAnalysis?: any;
  sourceMetadata: {
    originalTextLength: number;
    extractedSections: string[];
    detectedFormat: string;
    processedAt: Date;
  };
}

interface SectionMatch {
  section: string;
  content: string;
  startIndex: number;
  endIndex: number;
  confidence: number;
}

export class ResumeParser {
  private readonly sectionPatterns: { [key: string]: RegExp[] };
  private readonly contactPatterns: { [key: string]: RegExp };
  private readonly datePatterns: RegExp[];
  private readonly skillPatterns: { [key: string]: RegExp };

  constructor() {
    this.sectionPatterns = {
      summary: [
        /^(summary|professional summary|about|profile|objective|overview)/i,
        /^(career summary|executive summary|professional profile)/i,
      ],
      experience: [
        /^(experience|work experience|professional experience|employment)/i,
        /^(work history|career history|job experience)/i,
        /^(relevant experience|professional background)/i,
      ],
      education: [
        /^(education|academic|educational background)/i,
        /(education|academic|university|college|degree)/i,
        /(qualifications|credentials)/i,
      ],
      skills: [
        /^(skills|technical skills|core competencies)/i,
        /(technologies|tools|programming languages)/i,
        /(expertise|proficiencies|capabilities)/i,
      ],
      projects: [
        /^(projects|portfolio|work samples)/i,
        /^(personal projects|academic projects)/i,
      ],
      certifications: [
        /^(certifications|certificates|credentials)/i,
        /(professional certification|license)/i,
      ],
      languages: [
        /^(languages|language proficiency)/i,
        /(fluency|language skills)/i,
      ],
    };

    this.contactPatterns = {
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      phone: /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
      linkedin: /(?:linkedin\.com\/in\/|linkedin:)\s*([a-zA-Z0-9-]+)/gi,
      github: /(?:github\.com\/|github:)\s*([a-zA-Z0-9-]+)/gi,
      website: /(?:website|portfolio|url):\s*(https?:\/\/[^\s]+)/gi,
    };

    this.datePatterns = [
      // MM/YYYY, YYYY-MM-DD, etc.
      /(0[1-9]|1[0-2])\/(\d{4})/,
      /(\d{4})-(0[1-9]|1[0-2])-(\d{2})/,
      // Month YYYY, Month DD, YYYY
      /(January|February|March|April|May|June|July|August|September|Octo(?:ber|p)|Nov(?:ember|)|Dec(?:ember|))\s+\d{4}/i,
      /(January|February|March|April|May|June|July|August|September|Octo(?:ber|p)|Nov(?:ember|)|Dec(?:ember|))\s+\d{1,2},\s+\d{4}/i,
      // Present/Current
      /(present|current|ongoing)/i,
    ];

    this.skillPatterns = {
      technical: /\b(?:javascript|typescript|python|java|react|node\.js|aws|docker|kubernetes|mongodb|postgresql|sql|git|html|css|angular|vue\.js|ruby|php|c\+\+|c#|scala|go|rust|swift)\b/gi,
      tools: /\b(?:vs code|intellij|eclipse|visual studio|slack|jira|confluence|figma|sketch|adobe|office|excel|powerpoint|word|google workspace)\b/gi,
      methodologies: /\b(?:agile|scrum|kanban|devops|ci\/cd|tdd|bdd|waterfall|lean|six sigma|itil)\b/gi,
    };
  }

  async parseResume(
    text: string,
    options: ParseOptions & { userId: string; requestId?: string } = {
      userId: '',
      useAI: true,
    }
  ): Promise<ParseResult> {
    const startTime = Date.now();
    const { userId, requestId, ...parseOptions } = options;

    try {
      console.log(`[ResumeParser] Starting resume parsing: ${requestId}`);

      // Clean and normalize text
      const cleanText = this.cleanText(text);

      // Extract sections
      const sections = this.extractSections(cleanText);

      // Parse personal information
      const personalInfo = this.extractPersonalInfo(cleanText, sections);

      // Parse work experience
      const experience = this.extractExperience(sections.experience?.content || '');

      // Parse education
      const education = this.extractEducation(sections.education?.content || '');

      // Parse skills
      const skills = this.extractSkills(cleanText, sections.skills?.content);

      // Parse projects (optional)
      const projects = parseOptions.includeProjects ?
        this.extractProjects(sections.projects?.content || '') : [];

      // Parse certifications (optional)
      const certifications = parseOptions.includeCertifications ?
        this.extractCertifications(sections.certifications?.content || '') : [];

      // Parse languages
      const languages = this.extractLanguages(sections.languages?.content || '');

      // Extract summary
      const summary = this.extractSummary(sections.summary?.content || cleanText);

      // Create resume object
      const resume: Partial<Resume> = {
        userId,
        personalInfo,
        summary,
        experience,
        education,
        skills,
        projects,
        certifications,
        languages,
        metadata: {
          title: this.generateResumeTitle(personalInfo),
          description: `Resume for ${personalInfo.fullName || 'Candidate'}`,
          experienceLevel: this.determineExperienceLevel(experience),
          documentFormat: 'pdf',
        },
      };

      // Calculate confidence score
      const confidence = this.calculateConfidence(resume, sections);

      // Validate and sanitize data
      const validationErrors = this.validateResumeData(resume);
      const sanitizedResume = this.sanitizeResumeData(resume);

      // AI analysis if enabled
      let aiAnalysis;
      if (parseOptions.useAI && openAIService) {
        try {
          aiAnalysis = await this.performAIAnalysis(cleanText, {
            targetIndustry: parseOptions.targetIndustry,
            targetRole: parseOptions.targetRole,
            userId,
            requestId,
          });
        } catch (error) {
          console.warn('[ResumeParser] AI analysis failed:', error);
        }
      }

      const processingTime = Date.now() - startTime;
      console.log(`[ResumeParser] Parsing completed: ${requestId} (${processingTime}ms)`);

      return {
        resume: sanitizedResume,
        confidence,
        parsingErrors: validationErrors,
        warnings: this.generateWarnings(sanitizedResume, sections),
        processingTime,
        aiAnalysis,
        sourceMetadata: {
          originalTextLength: text.length,
          extractedSections: Object.keys(sections),
          detectedFormat: 'text',
          processedAt: new Date(),
        },
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(`[ResumeParser] Parsing failed: ${requestId} (${processingTime}ms)`, error);

      throw ResumeBuilderErrorFactory.parsingFailed(
        error instanceof Error ? error : new Error('Unknown parsing error'),
        requestId
      );
    }
  }

  private cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\n{3,}/g, '\n\n') // Remove excessive blank lines
      .replace(/[ \t]+/g, ' ') // Normalize whitespace
      .replace(/^\s+|\s+$/gm, '') // Trim lines
      .trim();
  }

  private extractSections(text: string): { [key: string]: SectionMatch } {
    const sections: { [key: string]: SectionMatch } = {};
    const lines = text.split('\n');
    let currentSection: SectionMatch | null = null;
    let sectionOrder = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check if this line matches any section pattern
      for (const [sectionName, patterns] of Object.entries(this.sectionPatterns)) {
        for (const pattern of patterns) {
          const match = line.match(pattern);
          if (match && match.index === 0) {
            // Save previous section if it exists
            if (currentSection) {
              currentSection.endIndex = i - 1;
              sections[currentSection.section] = currentSection;
            }

            // Start new section
            currentSection = {
              section: sectionName,
              content: '',
              startIndex: i,
              endIndex: -1,
              confidence: 0.8,
            };

            sectionOrder++;
            break;
          }
        }
      }
    }

    // Save the last section
    if (currentSection) {
      currentSection.endIndex = lines.length - 1;
      sections[currentSection.section] = currentSection;
    }

    // Extract content for each section
    for (const [sectionName, match] of Object.entries(sections)) {
      const sectionLines = lines.slice(match.startIndex + 1, match.endIndex + 1);
      match.content = sectionLines.join('\n').trim();
    }

    return sections;
  }

  private extractPersonalInfo(text: string, sections: { [key: string]: SectionMatch }): PersonalInfo {
    const personalInfo: PersonalInfo = {
      fullName: '',
      email: '',
      phone: '',
      location: '',
    };

    // Look for name at the beginning of the resume
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      // Name patterns: typically 2-4 words, mostly letters
      const namePattern = /^([A-Za-z\s-']{2,50})$/;
      if (namePattern.test(firstLine) && firstLine.split(' ').length >= 2 && firstLine.split(' ').length <= 4) {
        personalInfo.fullName = firstLine;
      }
    }

    // Extract contact information
    let emailMatch = text.match(this.contactPatterns.email);
    if (emailMatch) {
      personalInfo.email = emailMatch[0];
    }

    let phoneMatch = text.match(this.contactPatterns.phone);
    if (phoneMatch) {
      personalInfo.phone = phoneMatch[0];
    }

    // Extract location (city, state or city, country)
    const locationPattern = /\b([A-Za-z\s]+,\s*[A-Za-z\s]+(?:\s*\d{5})?)\b/;
    const locationMatch = text.match(locationPattern);
    if (locationMatch) {
      personalInfo.location = locationMatch[1];
    }

    // Extract LinkedIn
    const linkedinMatch = text.match(this.contactPatterns.linkedin);
    if (linkedinMatch) {
      personalInfo.linkedin = `https://linkedin.com/in/${linkedinMatch[1]}`;
    }

    // Extract GitHub
    const githubMatch = text.match(this.contactPatterns.github);
    if (githubMatch) {
      personalInfo.github = `https://github.com/${githubMatch[1]}`;
    }

    // Extract website
    const websiteMatch = text.match(this.contactPatterns.website);
    if (websiteMatch) {
      personalInfo.website = websiteMatch[1];
    }

    return personalInfo;
  }

  private extractExperience(text: string): Experience[] {
    const experiences: Experience[] = [];
    if (!text.trim()) return experiences;

    // Split by company/position indicators
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    let currentExperience: Partial<Experience> = {};
    let currentDescription: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check if this looks like a new job entry
      if (this.looksLikeJobTitle(line) || this.looksLikeCompany(line)) {
        // Save previous experience if it exists
        if (currentExperience.title && currentExperience.company) {
          experiences.push({
            id: uuidv4(),
            title: currentExperience.title || '',
            company: currentExperience.company || '',
            location: currentExperience.location || '',
            startDate: currentExperience.startDate || '',
            endDate: currentExperience.endDate || null,
            current: !currentExperience.endDate,
            description: currentDescription.join('\n'),
            achievements: this.extractAchievements(currentDescription.join('\n')),
            skills: this.extractSkillsFromText(currentDescription.join('\n')),
          });
        }

        // Start new experience
        const jobInfo = this.parseJobLine(line);
        currentExperience = {
          ...jobInfo,
        };
        currentDescription = [];
      } else if (line.match(/^[-•*]\s+/) || line.match(/^\d+\.\s+/)) {
        // This looks like a bullet point or achievement
        currentDescription.push(line);
      } else if (line.length > 20) {
        // This might be part of the description
        currentDescription.push(line);
      }
    }

    // Don't forget the last experience
    if (currentExperience.title && currentExperience.company) {
      experiences.push({
        id: uuidv4(),
        title: currentExperience.title || '',
        company: currentExperience.company || '',
        location: currentExperience.location || '',
        startDate: currentExperience.startDate || '',
        endDate: currentExperience.endDate || null,
        current: !currentExperience.endDate,
        description: currentDescription.join('\n'),
        achievements: this.extractAchievements(currentDescription.join('\n')),
        skills: this.extractSkillsFromText(currentDescription.join('\n')),
      });
    }

    return experiences;
  }

  private extractEducation(text: string): Education[] {
    const educations: Education[] = [];
    if (!text.trim()) return educations;

    const lines = text.split('\n').filter(line => line.trim().length > 0);
    let currentEducation: Partial<Education> = {};

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Look for degree indicators
      if (this.looksLikeDegree(line) || this.looksLikeUniversity(line)) {
        // Save previous education if it exists
        if (currentEducation.institution) {
          educations.push({
            id: uuidv4(),
            institution: currentEducation.institution || '',
            degree: currentEducation.degree || '',
            field: currentEducation.field || '',
            location: currentEducation.location || '',
            startDate: currentEducation.startDate || '',
            endDate: currentEducation.endDate || '',
            gpa: currentEducation.gpa,
          });
        }

        // Start new education
        const educationInfo = this.parseEducationLine(line);
        currentEducation = educationInfo;
      }
    }

    // Don't forget the last education
    if (currentEducation.institution) {
      educations.push({
        id: uuidv4(),
        institution: currentEducation.institution || '',
        degree: currentEducation.degree || '',
        field: currentEducation.field || '',
        location: currentEducation.location || '',
        startDate: currentEducation.startDate || '',
        endDate: currentEducation.endDate || '',
        gpa: currentEducation.gpa,
      });
    }

    return educations;
  }

  private extractSkills(fullText: string, skillsSection?: string): Skill[] {
    const skills: Skill[] = [];
    const textToAnalyze = skillsSection || fullText;

    // Extract technical skills
    const technicalSkills = this.extractSkillCategory(textToAnalyze, 'technical');
    skills.push(...technicalSkills);

    // Extract tools
    const toolSkills = this.extractSkillCategory(textToAnalyze, 'tools');
    skills.push(...toolSkills);

    // Extract methodologies
    const methodologySkills = this.extractSkillCategory(textToAnalyze, 'methodologies');
    skills.push(...methodologySkills);

    // Extract soft skills from the full text
    const softSkills = this.extractSoftSkills(fullText);
    skills.push(...softSkills);

    // Remove duplicates and assign IDs
    const uniqueSkills = Array.from(
      new Map(skills.map(skill => [skill.name.toLowerCase(), skill])).values()
    );

    return uniqueSkills.map(skill => ({
      ...skill,
      id: uuidv4(),
    }));
  }

  private extractSkillCategory(text: string, category: keyof typeof this.skillPatterns): Skill[] {
    const pattern = this.skillPatterns[category];
    const matches = text.match(pattern) || [];

    return matches.map(match => ({
      id: '',
      name: match.trim(),
      category: category === 'technical' ? 'technical' : category === 'tools' ? 'tool' : 'technical',
      level: 'intermediate' as const, // Default level, could be enhanced
    }));
  }

  private extractSoftSkills(text: string): Skill[] {
    const softSkillPatterns = [
      /leadership/gi,
      /communication/gi,
      /teamwork/gi,
      /problem solving/gi,
      /critical thinking/gi,
      /analytical/gi,
      /creativity/gi,
      /adaptability/gi,
      /time management/gi,
      /project management/gi,
    ];

    const softSkills: Skill[] = [];
    softSkillPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        softSkills.push({
          id: '',
          name: matches[0].trim(),
          category: 'soft' as const,
          level: 'intermediate' as const,
        });
      }
    });

    return softSkills;
  }

  private extractProjects(text: string): Project[] {
    const projects: Project[] = [];
    if (!text.trim()) return projects;

    // Simple project extraction - can be enhanced
    const lines = text.split('\n').filter(line => line.trim().length > 0);

    lines.forEach(line => {
      if (line.length > 20 && !line.match(/^[-•*]\s+/)) {
        projects.push({
          id: uuidv4(),
          name: line.split(':')[0] || line.substring(0, 50),
          description: line.includes(':') ? line.split(':')[1].trim() : line,
          technologies: this.extractSkillsFromText(line),
          status: 'completed' as const,
        });
      }
    });

    return projects;
  }

  private extractCertifications(text: string): Certification[] {
    const certifications: Certification[] = [];
    if (!text.trim()) return certifications;

    const lines = text.split('\n').filter(line => line.trim().length > 20);

    lines.forEach(line => {
      certifications.push({
        id: uuidv4(),
        name: line,
        issuer: 'Unknown', // Could be enhanced with extraction
        issueDate: new Date().toISOString().split('T')[0],
      });
    });

    return certifications;
  }

  private extractLanguages(text: string): Language[] {
    const languages: Language[] = [];
    if (!text.trim()) return languages;

    const languagePattern = /([A-Za-z\s]+):\s*(native|fluent|professional|conversational|basic)/gi;
    const matches = text.matchAll(languagePattern);

    for (const match of matches) {
      languages.push({
        id: uuidv4(),
        name: match[1].trim(),
        proficiency: match[2].toLowerCase() as any,
      });
    }

    return languages;
  }

  private extractSummary(text: string): string {
    // Look for summary in the first few paragraphs
    const paragraphs = text.split('\n\n').filter(p => p.trim().length > 50);

    if (paragraphs.length > 0) {
      const firstParagraph = paragraphs[0].trim();

      // Check if it looks like a summary (not too long, contains relevant keywords)
      if (firstParagraph.length < 500 &&
          (firstParagraph.toLowerCase().includes('professional') ||
           firstParagraph.toLowerCase().includes('experience') ||
           firstParagraph.toLowerCase().includes('skills'))) {
        return firstParagraph;
      }
    }

    return '';
  }

  private looksLikeJobTitle(line: string): boolean {
    const jobTitlePatterns = [
      /^(Senior|Lead|Principal|Staff|Junior|Mid-level|Associate)/i,
      /(Engineer|Developer|Designer|Manager|Director|VP|President|Analyst|Consultant)/i,
      /(Software|Frontend|Backend|Full-stack|Data|Product|Marketing|Sales)/i,
    ];

    return jobTitlePatterns.some(pattern => pattern.test(line));
  }

  private looksLikeCompany(line: string): boolean {
    const companyIndicators = [
      /(Inc\.|LLC|Corp\.|Ltd\.|GmbH)/i,
      /^[A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)?$/, // Capitalized company names
    ];

    return companyIndicators.some(pattern => pattern.test(line));
  }

  private looksLikeDegree(line: string): boolean {
    const degreePatterns = [
      /(Bachelor|Master|PhD|Doctorate|Associate)/i,
      /(B\.S\.|M\.S\.|B\.A\.|M\.A\.|MBA)/i,
      /(Computer Science|Engineering|Business|Arts|Science)/i,
    ];

    return degreePatterns.some(pattern => pattern.test(line));
  }

  private looksLikeUniversity(line: string): boolean {
    const universityPatterns = [
      /University/i,
      /College/i,
      /Institute/i,
      /School of/i,
    ];

    return universityPatterns.some(pattern => pattern.test(line));
  }

  private parseJobLine(line: string): Partial<Experience> {
    const result: Partial<Experience> = {};

    // Extract title and company
    const parts = line.split(/(?:at|@|–|-)/i);
    if (parts.length >= 2) {
      result.title = parts[0].trim();
      result.company = parts[1].trim();
    } else {
      result.title = line.trim();
    }

    // Extract dates
    const dateMatch = line.match(/(\d{4}|\w+ \d{4})(?:\s*(?:–|-|to)\s*([A-Za-z]+ \d{4}|Present|Current|Current|\d{4}))?/i);
    if (dateMatch) {
      result.startDate = this.formatDate(dateMatch[1]);
      result.endDate = dateMatch[2] && !dateMatch[2].match(/present|current/i) ?
        this.formatDate(dateMatch[2]) : null;
      result.current = !dateMatch[2] || dateMatch[2].match(/present|current/i);
    }

    // Extract location
    const locationMatch = line.match(/,\s*([^,]+(?:,\s*[A-Za-z]{2})?)\s*(?:\(|$)/);
    if (locationMatch) {
      result.location = locationMatch[1];
    }

    return result;
  }

  private parseEducationLine(line: string): Partial<Education> {
    const result: Partial<Education> = {};

    // Extract degree and field
    const degreeMatch = line.match(/(Bachelor|Master|PhD|Associate|B\.S\.|M\.S\.|B\.A\.|M\.A\.|MBA)\s+(?:in\s+)?(.+?)(?:\s+from|\s+at|\s*$)/i);
    if (degreeMatch) {
      result.degree = degreeMatch[1];
      result.field = degreeMatch[2];
    }

    // Extract institution
    const institutionMatch = line.match(/(?:from|at)\s+([^,\n]+)/i);
    if (institutionMatch) {
      result.institution = institutionMatch[1];
    }

    // Extract dates
    const dateMatch = line.match(/(\d{4}|\w+ \d{4})(?:\s*(?:–|-)\s*([A-Za-z]+ \d{4}|Present|Current|\d{4}))?/i);
    if (dateMatch) {
      result.startDate = this.formatDate(dateMatch[1]);
      result.endDate = dateMatch[2] && !dateMatch[2].match(/present|current/i) ?
        this.formatDate(dateMatch[2]) : null;
    }

    // Extract GPA
    const gpaMatch = line.match(/GPA[:\s]*([0-3]\.\d{2}|4\.0)/i);
    if (gpaMatch) {
      result.gpa = parseFloat(gpaMatch[1]);
    }

    return result;
  }

  private extractAchievements(text: string): string[] {
    const achievements: string[] = [];
    const lines = text.split('\n');

    lines.forEach(line => {
      const cleanLine = line.trim();
      if (cleanLine.match(/^[-•*]\s+/) || cleanLine.match(/^\d+\.\s+/)) {
        achievements.push(cleanLine.replace(/^[-•*\d.]\s+/, ''));
      }
    });

    return achievements;
  }

  private extractSkillsFromText(text: string): string[] {
    const skills: string[] = [];

    // Extract from all skill patterns
    Object.values(this.skillPatterns).forEach(pattern => {
      const matches = text.match(pattern) || [];
      skills.push(...matches);
    });

    // Remove duplicates and normalize
    return Array.from(new Set(skills.map(skill => skill.trim().toLowerCase())));
  }

  private formatDate(dateString: string): string {
    // Try to parse and standardize date format
    const date = ResumeBuilderUtils.parseDate(dateString);
    return date ? date.toISOString().split('T')[0] : dateString;
  }

  private generateResumeTitle(personalInfo: PersonalInfo): string {
    if (personalInfo.fullName) {
      return `${personalInfo.fullName}'s Resume`;
    }
    return 'Resume';
  }

  private determineExperienceLevel(experience: Experience[]): 'entry' | 'mid' | 'senior' | 'executive' {
    const totalExperience = ResumeBuilderUtils.calculateExperience(experience);

    if (totalExperience < 2) return 'entry';
    if (totalExperience < 5) return 'mid';
    if (totalExperience < 10) return 'senior';
    return 'executive';
  }

  private calculateConfidence(resume: Partial<Resume>, sections: { [key: string]: SectionMatch }): number {
    let confidence = 0;
    const maxScore = 100;

    // Personal information (25 points)
    if (resume.personalInfo?.fullName) confidence += 10;
    if (resume.personalInfo?.email) confidence += 8;
    if (resume.personalInfo?.phone) confidence += 7;

    // Experience (30 points)
    if (resume.experience && resume.experience.length > 0) {
      confidence += 15;
      if (resume.experience.some(exp => exp.title && exp.company)) confidence += 15;
    }

    // Education (20 points)
    if (resume.education && resume.education.length > 0) {
      confidence += 10;
      if (resume.education.some(edu => edu.institution && edu.degree)) confidence += 10;
    }

    // Skills (15 points)
    if (resume.skills && resume.skills.length > 5) confidence += 15;
    else if (resume.skills && resume.skills.length > 0) confidence += 8;

    // Summary (10 points)
    if (resume.summary && resume.summary.length > 50) confidence += 10;

    return Math.min(confidence, maxScore);
  }

  private validateResumeData(resume: Partial<Resume>): string[] {
    const errors: string[] = [];

    if (!resume.personalInfo?.fullName) {
      errors.push('Missing candidate name');
    }

    if (!resume.personalInfo?.email) {
      errors.push('Missing email address');
    }

    if (resume.experience && resume.experience.length > 0) {
      resume.experience.forEach((exp, index) => {
        if (!exp.title) errors.push(`Experience ${index + 1}: Missing job title`);
        if (!exp.company) errors.push(`Experience ${index + 1}: Missing company name`);
      });
    }

    return errors;
  }

  private sanitizeResumeData(resume: Partial<Resume>): Partial<Resume> {
    // Deep clone and sanitize
    const sanitized = JSON.parse(JSON.stringify(resume));

    // Sanitize personal info
    if (sanitized.personalInfo) {
      sanitized.personalInfo.fullName = sanitized.personalInfo.fullName?.replace(/[^\w\s.-]/g, '').trim();
      sanitized.personalInfo.email = sanitized.personalInfo.email?.toLowerCase().trim();
      sanitized.personalInfo.phone = sanitized.personalInfo.phone?.replace(/[^\d\s\-\+\(\)]/g, '').trim();
    }

    // Sanitize experience descriptions
    if (sanitized.experience) {
      sanitized.experience.forEach((exp: any) => {
        exp.description = exp.description?.replace(/\s+/g, ' ').trim();
      });
    }

    return sanitized;
  }

  private generateWarnings(resume: Partial<Resume>, sections: { [key: string]: SectionMatch }): string[] {
    const warnings: string[] = [];

    // Check for missing common sections
    if (!sections.experience && (!resume.experience || resume.experience.length === 0)) {
      warnings.push('No work experience section found');
    }

    if (!sections.education && (!resume.education || resume.education.length === 0)) {
      warnings.push('No education section found');
    }

    if (!sections.skills && (!resume.skills || resume.skills.length === 0)) {
      warnings.push('No skills section found');
    }

    // Check for incomplete experience entries
    if (resume.experience) {
      const incompleteExp = resume.experience.filter(exp => !exp.description || exp.description.length < 20);
      if (incompleteExp.length > 0) {
        warnings.push(`${incompleteExp.length} work experience entries have minimal descriptions`);
      }
    }

    return warnings;
  }

  private async performAIAnalysis(
    text: string,
    options: {
      targetIndustry?: string;
      targetRole?: string;
      userId: string;
      requestId?: string;
    }
  ): Promise<any> {
    try {
      const response = await openAIService.extractResumeData(text, {
        userId: options.userId,
        requestId: options.requestId,
      });

      return response;
    } catch (error) {
      console.warn('[ResumeParser] AI analysis failed:', error);
      return null;
    }
  }
}

// Export singleton instance
export const resumeParser = new ResumeParser();

// Export error-wrapped methods for use in routes
export const wrappedResumeParser = {
  parseResume: withServiceErrorHandling(resumeParser.parseResume.bind(resumeParser), 'parseResume'),
};