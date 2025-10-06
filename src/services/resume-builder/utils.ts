/**
 * Resume Builder Utilities
 *
 * Common utility functions for the AI-powered resume builder system.
 * Includes file processing, text extraction, data manipulation, and formatting helpers.
 */

import { v4 as uuidv4 } from 'uuid';
import { Resume, PersonalInfo, Experience, Education, Skill, Project } from '@/types/resume';

export class ResumeBuilderUtils {
  // File processing utilities
  static generateFileId(): string {
    return uuidv4();
  }

  static generateUniqueFileName(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = this.getFileExtension(originalName);
    const baseName = this.removeFileExtension(originalName);
    return `${baseName}_${timestamp}_${random}.${extension}`;
  }

  static getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  static removeFileExtension(filename: string): string {
    return filename.substring(0, filename.lastIndexOf('.')) || filename;
  }

  static isValidFileType(filename: string, allowedTypes: string[]): boolean {
    const extension = this.getFileExtension(filename);
    return allowedTypes.includes(extension);
  }

  static formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  static sanitizeFileName(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, '');
  }

  // Text processing utilities
  static cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
  }

  static extractKeywords(text: string): string[] {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);

    const stopWords = new Set([
      'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one',
      'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see',
      'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use', 'was',
      'will', 'with', 'have', 'this', 'that', 'from', 'they', 'been', 'call', 'come', 'each',
      'find', 'give', 'hand', 'know', 'just', 'like', 'look', 'make', 'more', 'move', 'must',
      'name', 'only', 'over', 'such', 'take', 'tell', 'than', 'them', 'well', 'were', 'what',
      'when', 'where', 'which', 'would', 'write', 'your', 'could', 'other', 'after', 'again',
      'before', 'being', 'between', 'both', 'does', 'doing', 'going', 'great', 'however',
      'might', 'never', 'should', 'still', 'those', 'under', 'upon', 'very', 'where', 'while',
      'without', 'according', 'actually', 'almost', 'always', 'another', 'because', 'been',
      'before', 'being', 'between', 'both', 'business', 'cannot', 'contact', 'could', 'course',
      'during', 'email', 'first', 'following', 'found', 'going', 'great', 'however', 'internet',
      'large', 'least', 'might', 'more', 'most', 'need', 'next', 'number', 'online', 'order',
      'other', 'people', 'please', 'point', 'question', 'receive', 'remember', 'right', 'same',
      'second', 'seems', 'service', 'since', 'social', 'something', 'state', 'still', 'thing',
      'think', 'though', 'through', 'today', 'together', 'understand', 'upon', 'using', 'various',
      'website', 'week', 'which', 'while', 'without', 'world', 'would', 'write', 'years'
    ]);

    const wordFrequency: { [key: string]: number } = {};
    words.forEach(word => {
      if (!stopWords.has(word)) {
        wordFrequency[word] = (wordFrequency[word] || 0) + 1;
      }
    });

    return Object.entries(wordFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 50)
      .map(([word]) => word);
  }

  static extractBullets(text: string): string[] {
    const bulletPatterns = [
      /^[•·‣⁃]\s*(.+)/gm,
      /^[-*]\s*(.+)/gm,
      /^\d+\.\s*(.+)/gm,
      /^[a-zA-Z]\.\s*(.+)/gm,
    ];

    const bullets: string[] = [];
    bulletPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        bullets.push(...matches.map(match => match.replace(/^[•·‣⁃\-*\d+a-zA-Z.]\s*/, '').trim()));
      }
    });

    return bullets.filter(bullet => bullet.length > 0);
  }

  // Date processing utilities
  static parseDate(dateString: string): Date | null {
    if (!dateString) return null;

    const patterns = [
      /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/(\d{4})$/, // MM/DD/YYYY
      /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/, // YYYY-MM-DD
      /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-(\d{4})$/, // DD-MM-YYYY
      /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}$/i, // Month DD, YYYY
    ];

    for (const pattern of patterns) {
      const match = dateString.match(pattern);
      if (match) {
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }

    // Try parsing as relative date
    const now = new Date();
    const lowerDate = dateString.toLowerCase();

    if (lowerDate.includes('present') || lowerDate.includes('current')) {
      return now;
    }

    if (lowerDate.includes('month')) {
      const months = parseInt(lowerDate);
      if (!isNaN(months)) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - months);
        return date;
      }
    }

    return null;
  }

  static formatDate(date: Date | string | null, format: 'short' | 'long' | 'iso' = 'short'): string {
    if (!date) return '';

    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '';

    switch (format) {
      case 'short':
        return dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      case 'long':
        return dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      case 'iso':
        return dateObj.toISOString().split('T')[0];
      default:
        return dateObj.toLocaleDateString();
    }
  }

  static formatDateRange(startDate: Date | string, endDate: Date | string | null): string {
    const start = this.formatDate(startDate, 'short');
    const end = endDate ? this.formatDate(endDate, 'short') : 'Present';
    return `${start} - ${end}`;
  }

  // Data validation utilities
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  }

  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static calculateExperience(experiences: Experience[]): number {
    let totalMonths = 0;

    experiences.forEach(exp => {
      const start = new Date(exp.startDate);
      const end = exp.endDate ? new Date(exp.endDate) : new Date();

      const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      totalMonths += Math.max(0, months);
    });

    return Math.round(totalMonths / 12 * 10) / 10; // Round to 1 decimal place
  }

  // Resume data utilities
  static createEmptyResume(userId: string): Omit<Resume, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      userId,
      personalInfo: {
        fullName: '',
        email: '',
        phone: '',
        location: '',
      },
      summary: '',
      experience: [],
      education: [],
      skills: [],
      projects: [],
      certifications: [],
      languages: [],
      customSections: [],
      metadata: {
        title: '',
        description: '',
        experienceLevel: 'entry',
        documentFormat: 'pdf',
      },
    };
  }

  static validateResume(resume: Partial<Resume>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate personal info
    if (!resume.personalInfo?.fullName) {
      errors.push('Full name is required');
    }
    if (!resume.personalInfo?.email) {
      errors.push('Email is required');
    } else if (!this.isValidEmail(resume.personalInfo.email)) {
      errors.push('Invalid email format');
    }
    if (!resume.personalInfo?.phone) {
      errors.push('Phone number is required');
    } else if (!this.isValidPhone(resume.personalInfo.phone)) {
      errors.push('Invalid phone number format');
    }

    // Validate summary length
    if (resume.summary && resume.summary.length > 500) {
      errors.push('Summary should not exceed 500 characters');
    }

    // Validate experience
    resume.experience?.forEach((exp, index) => {
      if (!exp.title) {
        errors.push(`Experience ${index + 1}: Title is required`);
      }
      if (!exp.company) {
        errors.push(`Experience ${index + 1}: Company is required`);
      }
      if (!exp.startDate) {
        errors.push(`Experience ${index + 1}: Start date is required`);
      }
      if (exp.endDate && new Date(exp.endDate) < new Date(exp.startDate)) {
        errors.push(`Experience ${index + 1}: End date must be after start date`);
      }
    });

    // Validate education
    resume.education?.forEach((edu, index) => {
      if (!edu.institution) {
        errors.push(`Education ${index + 1}: Institution is required`);
      }
      if (!edu.degree) {
        errors.push(`Education ${index + 1}: Degree is required`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static calculateResumeCompleteness(resume: Partial<Resume>): number {
    let completedSections = 0;
    let totalSections = 7;

    // Personal info (20% weight)
    if (resume.personalInfo?.fullName && resume.personalInfo.email && resume.personalInfo.phone) {
      completedSections += 1;
    }

    // Summary (15% weight)
    if (resume.summary && resume.summary.length > 50) {
      completedSections += 1;
    }

    // Experience (25% weight)
    if (resume.experience && resume.experience.length > 0) {
      completedSections += 1;
    }

    // Education (15% weight)
    if (resume.education && resume.education.length > 0) {
      completedSections += 1;
    }

    // Skills (15% weight)
    if (resume.skills && resume.skills.length > 5) {
      completedSections += 1;
    }

    // Projects (5% weight)
    if (resume.projects && resume.projects.length > 0) {
      completedSections += 0.5;
    }

    // Certifications (5% weight)
    if (resume.certifications && resume.certifications.length > 0) {
      completedSections += 0.5;
    }

    return Math.round((completedSections / totalSections) * 100);
  }

  // Text analysis utilities
  static calculateReadingTime(text: string): number {
    const wordsPerMinute = 200;
    const words = text.trim().split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  }

  static extractSkillsFromText(text: string, knownSkills: string[]): string[] {
    const foundSkills: string[] = [];
    const lowerText = text.toLowerCase();

    knownSkills.forEach(skill => {
      if (lowerText.includes(skill.toLowerCase())) {
        foundSkills.push(skill);
      }
    });

    return [...new Set(foundSkills)]; // Remove duplicates
  }

  static extractContactInfo(text: string): Partial<PersonalInfo> {
    const contactInfo: Partial<PersonalInfo> = {};

    // Email extraction
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = text.match(emailRegex);
    if (emails && emails.length > 0) {
      contactInfo.email = emails[0];
    }

    // Phone extraction
    const phoneRegex = /\+?[\d\s\-\(\)]{10,}/g;
    const phones = text.match(phoneRegex);
    if (phones && phones.length > 0) {
      contactInfo.phone = phones[0].trim();
    }

    // LinkedIn extraction
    const linkedinRegex = /linkedin\.com\/in\/[\w-]+/gi;
    const linkedinMatches = text.match(linkedinRegex);
    if (linkedinMatches && linkedinMatches.length > 0) {
      contactInfo.linkedin = `https://${linkedinMatches[0]}`;
    }

    // GitHub extraction
    const githubRegex = /github\.com\/[\w-]+/gi;
    const githubMatches = text.match(githubRegex);
    if (githubMatches && githubMatches.length > 0) {
      contactInfo.github = `https://${githubMatches[0]}`;
    }

    return contactInfo;
  }

  // Template utilities
  static getTemplatePreviewUrl(templateId: string): string {
    return `/api/resume-builder/templates/${templateId}/preview`;
  }

  static getDefaultTemplateId(): string {
    return 'professional-modern';
  }

  // Export utilities
  static sanitizeFilenameForExport(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9\s._-]/g, '')
      .replace(/\s+/g, '_')
      .toLowerCase();
  }

  static generateResumeTitle(personalInfo: PersonalInfo): string {
    const { fullName } = personalInfo;
    const timestamp = new Date().toISOString().split('T')[0];
    return `${fullName}_Resume_${timestamp}`;
  }
}

// Export commonly used utility functions
export const {
  generateFileId,
  generateUniqueFileName,
  getFileExtension,
  removeFileExtension,
  isValidFileType,
  formatFileSize,
  sanitizeFileName,
  cleanText,
  extractKeywords,
  extractBullets,
  parseDate,
  formatDate,
  formatDateRange,
  isValidEmail,
  isValidPhone,
  isValidUrl,
  calculateExperience,
  createEmptyResume,
  validateResume,
  calculateResumeCompleteness,
  calculateReadingTime,
  extractSkillsFromText,
  extractContactInfo,
  getTemplatePreviewUrl,
  getDefaultTemplateId,
  sanitizeFilenameForExport,
  generateResumeTitle,
} = ResumeBuilderUtils;