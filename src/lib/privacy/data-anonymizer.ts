import { PiiDetector } from './pii-detector';
import { PrivacyManager } from '../services/matching/privacy-manager';
import { AuditLogger } from './audit/matching-audit';
import { logger } from '@/lib/logger';

export interface AnonymizationConfig {
  preserveAccuracy: boolean;
  retentionPeriod: number;
  anonymizationLevel: 'minimal' | 'standard' | 'strict';
  allowedAttributes: string[];
}

export interface AnonymizedData {
  originalData: any;
  anonymizedData: any;
  anonymizationReport: AnonymizationReport;
  riskScore: number;
}

export interface AnonymizationReport {
  techniquesUsed: string[];
  dataLossPercentage: number;
  privacyGain: number;
  reidentificationRisk: number;
  utilityPreservation: number;
}

export class DataAnonymizer {
  private piiDetector: PiiDetector;
  private privacyManager: PrivacyManager;
  private auditLogger: AuditLogger;
  private config: AnonymizationConfig;

  constructor(config: AnonymizationConfig) {
    this.config = config;
    this.piiDetector = new PiiDetector();
    this.privacyManager = new PrivacyManager();
    this.auditLogger = new AuditLogger();
  }

  async anonymizeUserData(userId: string, data: any): Promise<AnonymizedData> {
    try {
      const startTime = Date.now();

      // Log anonymization start
      await this.auditLogger.logEvent({
        userId,
        action: 'data_anonymization_start',
        resourceType: 'user_data',
        resourceId: userId,
        metadata: {
          dataSize: JSON.stringify(data).length,
          anonymizationLevel: this.config.anonymizationLevel
        }
      });

      // Step 1: Detect and classify PII
      const piiDetection = await this.piiDetector.scanData(data);

      // Step 2: Apply anonymization techniques
      let anonymizedData = JSON.parse(JSON.stringify(data)); // Deep copy

      for (const piiItem of piiDetection.detectedPii) {
        anonymizedData = await this.applyAnonymizationTechnique(
          anonymizedData,
          piiItem.path,
          piiItem.type,
          piiItem.confidence
        );
      }

      // Step 3: Apply generalization techniques
      anonymizedData = await this.applyGeneralization(anonymizedData);

      // Step 4: Generate synthetic data if needed
      if (this.config.preserveAccuracy) {
        anonymizedData = await this.generateSyntheticData(anonymizedData);
      }

      // Step 5: Calculate anonymization metrics
      const report = await this.generateAnonymizationReport(data, anonymizedData, piiDetection);
      const riskScore = await this.calculateReidentificationRisk(anonymizedData);

      // Log anonymization completion
      await this.auditLogger.logEvent({
        userId,
        action: 'data_anonymization_complete',
        resourceType: 'user_data',
        resourceId: userId,
        metadata: {
          duration: Date.now() - startTime,
          riskScore,
          dataLossPercentage: report.dataLossPercentage,
          techniquesUsed: report.techniquesUsed.length
        }
      });

      return {
        originalData: data,
        anonymizedData,
        anonymizationReport: report,
        riskScore
      };

    } catch (error) {
      logger.error('Data anonymization failed', { error, userId });
      throw new Error(`Data anonymization failed: ${error.message}`);
    }
  }

  private async applyAnonymizationTechnique(
    data: any,
    path: string,
    piiType: string,
    confidence: number
  ): Promise<any> {
    const pathParts = path.split('.');
    let current = data;

    // Navigate to the parent of the target
    for (let i = 0; i < pathParts.length - 1; i++) {
      if (!current[pathParts[i]]) return data;
      current = current[pathParts[i]];
    }

    const finalKey = pathParts[pathParts.length - 1];

    switch (piiType) {
      case 'email':
        current[finalKey] = this.anonymizeEmail(current[finalKey]);
        break;

      case 'phone':
        current[finalKey] = this.anonymizePhone(current[finalKey]);
        break;

      case 'name':
        current[finalKey] = this.anonymizeName(current[finalKey]);
        break;

      case 'address':
        current[finalKey] = this.anonymizeAddress(current[finalKey]);
        break;

      case 'ssn':
        current[finalKey] = 'XXX-XX-XXXX';
        break;

      case 'credit_card':
        current[finalKey] = 'XXXX-XXXX-XXXX-XXXX';
        break;

      case 'ip_address':
        current[finalKey] = this.anonymizeIPAddress(current[finalKey]);
        break;

      case 'date_of_birth':
        current[finalKey] = this.anonymizeDateOfBirth(current[finalKey]);
        break;

      default:
        // Apply general masking for unknown PII types
        current[finalKey] = this.maskValue(current[finalKey]);
    }

    return data;
  }

  private anonymizeEmail(email: string): string {
    if (!email || !email.includes('@')) return '***@***.com';

    const [username, domain] = email.split('@');
    const maskedUsername = username.length > 3
      ? username[0] + '*'.repeat(username.length - 2) + username[username.length - 1]
      : '*'.repeat(username.length);

    const [domainName, tld] = domain.split('.');
    const maskedDomain = domainName.length > 2
      ? domainName[0] + '*'.repeat(domainName.length - 2) + domainName[domainName.length - 1]
      : '*'.repeat(domainName.length);

    return `${maskedUsername}@${maskedDomain}.${tld}`;
  }

  private anonymizePhone(phone: string): string {
    if (!phone) return 'XXX-XXX-XXXX';

    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');

    if (digits.length >= 10) {
      const areaCode = digits.substring(0, 3);
      const exchange = digits.substring(3, 6);
      const lineNumber = digits.substring(6, 10);

      return `${areaCode[0]}XX-${exchange[0]}X-${lineNumber[0]}XXX`;
    }

    return 'XXX-XXX-XXXX';
  }

  private anonymizeName(name: string): string {
    if (!name) return '***';

    const parts = name.trim().split(/\s+/);
    return parts.map(part => {
      if (part.length <= 2) return '*'.repeat(part.length);
      return part[0] + '*'.repeat(part.length - 2) + part[part.length - 1];
    }).join(' ');
  }

  private anonymizeAddress(address: string): string {
    if (!address) return '*** Address ***';

    // Replace street numbers and preserve general location
    return address.replace(/\d+/g, 'XX').replace(/[A-Za-z]{3,}/g, match => {
      return match[0] + '*'.repeat(match.length - 2) + match[match.length - 1];
    });
  }

  private anonymizeIPAddress(ip: string): string {
    if (!ip) return 'X.X.X.X';

    if (ip.includes(':')) {
      // IPv6
      return ip.replace(/[0-9a-fA-F]/g, 'X');
    }

    // IPv4
    const parts = ip.split('.');
    return parts.map((part, index) => {
      if (index === 0 || index === parts.length - 1) return part;
      return 'X';
    }).join('.');
  }

  private anonymizeDateOfBirth(dob: string | Date): string {
    if (!dob) return 'XXXX';

    const date = new Date(dob);
    if (isNaN(date.getTime())) return 'XXXX';

    // Return only year and month, hide day
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-XX`;
  }

  private maskValue(value: any): string {
    if (typeof value === 'string') {
      return value.length > 4
        ? value.substring(0, 2) + '*'.repeat(value.length - 4) + value.substring(value.length - 2)
        : '*'.repeat(value.length);
    }
    return '***';
  }

  private async applyGeneralization(data: any): Promise<any> {
    const generalized = JSON.parse(JSON.stringify(data));

    // Generalize age ranges
    if (generalized.age) {
      generalized.age = this.generalizeAge(generalized.age);
    }

    // Generalize salary ranges
    if (generalized.salary) {
      generalized.salary = this.generalizeSalary(generalized.salary);
    }

    // Generalize experience years
    if (generalized.experienceYears) {
      generalized.experienceYears = this.generalizeExperience(generalized.experienceYears);
    }

    return generalized;
  }

  private generalizeAge(age: number): string {
    if (age < 25) return '18-24';
    if (age < 35) return '25-34';
    if (age < 45) return '35-44';
    if (age < 55) return '45-54';
    return '55+';
  }

  private generalizeSalary(salary: number): string {
    if (salary < 50000) return '<50k';
    if (salary < 75000) return '50k-75k';
    if (salary < 100000) return '75k-100k';
    if (salary < 150000) return '100k-150k';
    return '150k+';
  }

  private generalizeExperience(years: number): string {
    if (years < 2) return '0-2 years';
    if (years < 5) return '2-5 years';
    if (years < 10) return '5-10 years';
    return '10+ years';
  }

  private async generateSyntheticData(data: any): Promise<any> {
    // Generate synthetic data that preserves statistical properties
    const synthetic = JSON.parse(JSON.stringify(data));

    // Replace real values with synthetic ones that maintain distributions
    // This is a simplified version - in practice, you'd use more sophisticated methods

    if (synthetic.skills && Array.isArray(synthetic.skills)) {
      synthetic.skills = this.generateSyntheticSkills(synthetic.skills);
    }

    if (synthetic.education && Array.isArray(synthetic.education)) {
      synthetic.education = this.generateSyntheticEducation(synthetic.education);
    }

    return synthetic;
  }

  private generateSyntheticSkills(realSkills: string[]): string[] {
    // Generate synthetic skills that maintain the same categories and distribution
    const skillCategories = {
      technical: ['Programming', 'Database', 'Cloud Computing', 'DevOps'],
      soft: ['Communication', 'Leadership', 'Teamwork', 'Problem Solving'],
      domain: ['Finance', 'Healthcare', 'Education', 'Manufacturing']
    };

    const syntheticSkills = [];
    const targetCount = Math.min(realSkills.length, 8);

    for (let i = 0; i < targetCount; i++) {
      const categoryType = Object.keys(skillCategories)[i % 3];
      const category = skillCategories[categoryType as keyof typeof skillCategories];
      const skill = category[Math.floor(Math.random() * category.length)];
      syntheticSkills.push(skill);
    }

    return syntheticSkills;
  }

  private generateSyntheticEducation(realEducation: any[]): any[] {
    return realEducation.map(edu => ({
      level: edu.level,
      field: this.generateSyntheticField(edu.field),
      institution: 'University',
      year: edu.year ? Math.floor(edu.year / 10) * 10 : null
    }));
  }

  private generateSyntheticField(realField: string): string {
    const fields = ['Computer Science', 'Business Administration', 'Engineering', 'Mathematics'];
    return fields[Math.floor(Math.random() * fields.length)];
  }

  private async generateAnonymizationReport(
    originalData: any,
    anonymizedData: any,
    piiDetection: any
  ): Promise<AnonymizationReport> {
    const techniquesUsed = [
      'PII Masking',
      'Data Generalization',
      'Synthetic Data Generation',
      'Value Substitution'
    ];

    // Calculate data loss percentage
    const originalSize = JSON.stringify(originalData).length;
    const anonymizedSize = JSON.stringify(anonymizedData).length;
    const dataLossPercentage = ((originalSize - anonymizedSize) / originalSize) * 100;

    // Calculate privacy gain (simplified metric)
    const privacyGain = Math.min(100, piiDetection.detectedPii.length * 20);

    // Calculate utility preservation
    const utilityPreservation = Math.max(0, 100 - dataLossPercentage);

    // Calculate reidentification risk
    const reidentificationRisk = await this.calculateReidentificationRisk(anonymizedData);

    return {
      techniquesUsed,
      dataLossPercentage,
      privacyGain,
      reidentificationRisk,
      utilityPreservation
    };
  }

  private async calculateReidentificationRisk(data: any): Promise<number> {
    let riskScore = 0;

    // Assess risk based on remaining identifiable information
    if (data.age && typeof data.age === 'string' && data.age !== 'XX-XX') {
      riskScore += 15;
    }

    if (data.location && data.location.length > 5) {
      riskScore += 20;
    }

    if (data.education && Array.isArray(data.education) && data.education.length > 2) {
      riskScore += 10;
    }

    if (data.skills && Array.isArray(data.skills) && data.skills.length > 5) {
      riskScore += 10;
    }

    // Reduce risk based on anonymization level
    const riskReduction = {
      minimal: 0,
      standard: 20,
      strict: 40
    };

    riskScore = Math.max(0, riskScore - riskReduction[this.config.anonymizationLevel]);

    return Math.min(100, riskScore);
  }

  async batchAnonymizeUserDatas(userDataList: Array<{ userId: string; data: any }>): Promise<AnonymizedData[]> {
    const results: AnonymizedData[] = [];

    for (const { userId, data } of userDataList) {
      try {
        const anonymized = await this.anonymizeUserData(userId, data);
        results.push(anonymized);
      } catch (error) {
        logger.error(`Failed to anonymize data for user ${userId}`, { error });
        // Continue with other users even if one fails
      }
    }

    return results;
  }

  async getAnonymizationStats(userId?: string): Promise<any> {
    // Implementation for anonymization statistics
    // This would query the audit logs and provide anonymization metrics
    return {
      totalRecordsAnonymized: 0,
      averageRiskScore: 0,
      averageDataLossPercentage: 0,
      mostUsedTechniques: [],
      anonymizationLevelDistribution: {}
    };
  }
}

// PII Detector Utility Class
export class PiiDetector {
  private patterns = {
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
    phone: /\b(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
    creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    ipv4: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    ipv6: /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/g,
    dateOfBirth: /\b\d{4}[-\/]\d{2}[-\/]\d{2}\b|\b\d{2}[-\/]\d{2}[-\/]\d{4}\b/g,
    zipCode: /\b\d{5}(?:-\d{4})?\b/g
  };

  async scanData(data: any, path = ''): Promise<any> {
    const detectedPii = [];

    if (typeof data === 'string') {
      // Check for PII patterns in string values
      for (const [type, pattern] of Object.entries(this.patterns)) {
        const matches = data.match(pattern);
        if (matches) {
          detectedPii.push({
            type,
            path,
            value: matches[0],
            confidence: 0.9
          });
        }
      }
    } else if (typeof data === 'object' && data !== null) {
      // Recursively scan object properties
      for (const [key, value] of Object.entries(data)) {
        const currentPath = path ? `${path}.${key}` : key;
        const nestedResults = await this.scanData(value, currentPath);
        detectedPii.push(...nestedResults);
      }
    }

    return { detectedPii, timestamp: new Date().toISOString() };
  }
}