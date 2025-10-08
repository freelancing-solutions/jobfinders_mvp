export interface ComplianceRule {
  id: string;
  name: string;
  category: 'eeoc' | 'gdpr' | 'ada' | 'bias' | 'data_privacy' | 'state_law' | 'industry_specific';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  checkFunction: (text: string, context?: any) => ComplianceCheckResult;
  jurisdiction?: string[];
  industry?: string[];
}

export interface ComplianceCheckResult {
  status: 'pass' | 'warning' | 'fail';
  score: number;
  violations: ComplianceViolation[];
  recommendations: string[];
  references: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface ComplianceViolation {
  type: string;
  description: string;
  location?: {
    line?: number;
    position?: number;
    context?: string;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  legalReference?: string;
  suggestedFix?: string;
}

export interface ComplianceReport {
  overallStatus: 'compliant' | 'warning' | 'non_compliant';
  overallScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  checks: Array<{
    ruleId: string;
    ruleName: string;
    category: string;
    result: ComplianceCheckResult;
  }>;
  auditTrail: Array<{
    timestamp: Date;
    action: string;
    details: any;
    userId?: string;
  }>;
  remediationPlan: Array<{
    violation: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    action: string;
    estimatedTime: string;
    resources: string[];
  }>;
}

export class ComplianceChecker {
  private static instance: ComplianceChecker;
  private rules: Map<string, ComplianceRule> = new Map();
  private jurisdictionRules: Map<string, string[]> = new Map();

  static getInstance(): ComplianceChecker {
    if (!ComplianceChecker.instance) {
      ComplianceChecker.instance = new ComplianceChecker();
    }
    return ComplianceChecker.instance;
  }

  private constructor() {
    this.initializeEEOCRules();
    this.initializeGDPRRules();
    this.initializeADARules();
    this.initializeBiasDetectionRules();
    this.initializeDataPrivacyRules();
    this.initializeStateLawRules();
  }

  private initializeEEOCRules() {
    // Age discrimination
    this.rules.set('eeoc_age_discrimination', {
      id: 'eeoc_age_discrimination',
      name: 'Age Discrimination Check',
      category: 'eeoc',
      description: 'Detects language that could indicate age discrimination',
      severity: 'high',
      checkFunction: (text: string) => {
        const ageIndicators = [
          'young', 'energetic', 'recent graduate', 'fresh', 'new blood',
          'digital native', 'recent college grad', 'just out of college',
          'age requirements', 'age range', 'years old', 'over', 'under'
        ];

        const agePattern = /\b(\d{1,2})\s*[-+]\s*(\d{1,2})\s*(?:years?|yrs?)\b|\b(over|under|younger than|older than)\s+(\d{1,2})\b/gi;
        const violations: ComplianceViolation[] = [];

        let match;
        while ((match = agePattern.exec(text)) !== null) {
          violations.push({
            type: 'age_specification',
            description: `Age-specific language found: ${match[0]}`,
            location: { position: match.index, context: text.substring(Math.max(0, match.index - 50), match.index + 50) },
            severity: 'high',
            legalReference: 'Age Discrimination in Employment Act (ADEA)',
            suggestedFix: 'Remove age-specific language and focus on skills and experience'
          });
        }

        for (const indicator of ageIndicators) {
          const regex = new RegExp(`\\b${indicator}\\b`, 'gi');
          let match;
          while ((match = regex.exec(text)) !== null) {
            violations.push({
              type: 'age_code_word',
              description: `Potentially age-related term: ${indicator}`,
              location: { position: match.index, context: text.substring(Math.max(0, match.index - 30), match.index + 30) },
              severity: 'medium',
              legalReference: 'Age Discrimination in Employment Act (ADEA)',
              suggestedFix: 'Use neutral language focusing on qualifications'
            });
          }
        }

        return {
          status: violations.length > 0 ? 'fail' : 'pass',
          score: Math.max(0, 100 - (violations.length * 20)),
          violations,
          recommendations: violations.length > 0 ? [
            'Remove age-specific requirements and preferences',
            'Focus on skills, experience, and qualifications',
            'Use neutral language in job descriptions'
          ] : [],
          references: [
            'Age Discrimination in Employment Act (ADEA) of 1967',
            'EEOC Guidance on Age Discrimination'
          ],
          riskLevel: violations.some(v => v.severity === 'high') ? 'high' : 'medium'
        };
      }
    });

    // Gender discrimination
    this.rules.set('eeoc_gender_discrimination', {
      id: 'eeoc_gender_discrimination',
      name: 'Gender Discrimination Check',
      category: 'eeoc',
      description: 'Detects language that could indicate gender discrimination',
      severity: 'high',
      checkFunction: (text: string) => {
        const genderedTerms = [
          'salesman', 'saleswoman', 'chairman', 'chairwoman',
          'male', 'female', 'he/she', 'his/her', 'waitress', 'waiter'
        ];

        const genderPattern = /\b(male|female|he|she|his|her|hers|him|waitress|waiter|salesman|saleswoman|chairman|chairwoman)\b/gi;
        const violations: ComplianceViolation[] = [];

        let match;
        while ((match = genderPattern.exec(text)) !== null) {
          violations.push({
            type: 'gendered_language',
            description: `Gender-specific term: ${match[0]}`,
            location: { position: match.index, context: text.substring(Math.max(0, match.index - 30), match.index + 30) },
            severity: 'medium',
            legalReference: 'Title VII of the Civil Rights Act',
            suggestedFix: 'Use gender-neutral terms (e.g., salesperson, chairperson, they/them)'
          });
        }

        return {
          status: violations.length > 0 ? 'warning' : 'pass',
          score: Math.max(0, 100 - (violations.length * 15)),
          violations,
          recommendations: violations.length > 0 ? [
            'Use gender-neutral language throughout',
            'Replace gendered terms with inclusive alternatives',
            'Focus on qualifications regardless of gender'
          ] : [],
          references: [
            'Title VII of the Civil Rights Act of 1964',
            'EEOC Guidance on Gender Discrimination'
          ],
          riskLevel: 'medium'
        };
      }
    });

    // Protected characteristics
    this.rules.set('eeoc_protected_characteristics', {
      id: 'eeoc_protected_characteristics',
      name: 'Protected Characteristics Check',
      category: 'eeoc',
      description: 'Detects inquiries about protected characteristics',
      severity: 'critical',
      checkFunction: (text: string) => {
        const protectedQueries = [
          'marital status', 'married', 'single', 'divorced',
          'children', 'kids', 'family status', 'pregnant', 'pregnancy',
          'religion', 'religious', 'church', 'mosque', 'synagogue',
          'national origin', 'citizenship', 'visa status', 'work authorization',
          'disability', 'disabled', 'handicap', 'medical condition'
        ];

        const violations: ComplianceViolation[] = [];

        for (const query of protectedQueries) {
          const regex = new RegExp(`\\b${query}\\b`, 'gi');
          let match;
          while ((match = regex.exec(text)) !== null) {
            violations.push({
              type: 'protected_characteristic_inquiry',
              description: `Inquiry about protected characteristic: ${query}`,
              location: { position: match.index, context: text.substring(Math.max(0, match.index - 30), match.index + 30) },
              severity: 'critical',
              legalReference: 'Title VII of the Civil Rights Act',
              suggestedFix: 'Remove inquiries about protected characteristics'
            });
          }
        }

        return {
          status: violations.length > 0 ? 'fail' : 'pass',
          score: Math.max(0, 100 - (violations.length * 25)),
          violations,
          recommendations: violations.length > 0 ? [
            'Remove all questions about protected characteristics',
            'Focus only on job-related qualifications',
            'Review application forms and interview questions'
          ] : [],
          references: [
            'Title VII of the Civil Rights Act',
            'Americans with Disabilities Act (ADA)',
            'EEOC Enforcement Guidance'
          ],
          riskLevel: 'critical'
        };
      }
    });
  }

  private initializeGDPRRules() {
    // Data consent
    this.rules.set('gdpr_consent', {
      id: 'gdpr_consent',
      name: 'GDPR Consent Check',
      category: 'gdpr',
      description: 'Verifies proper consent mechanisms for data processing',
      severity: 'high',
      jurisdiction: ['EU', 'UK'],
      checkFunction: (text: string) => {
        const consentIndicators = [
          'consent', 'agree', 'accept', 'permission', 'authorization',
          'privacy policy', 'data protection', 'personal data'
        ];

        const hasConsent = consentIndicators.some(indicator =>
          text.toLowerCase().includes(indicator)
        );

        const violations: ComplianceViolation[] = [];

        if (!hasConsent) {
          violations.push({
            type: 'missing_consent',
            description: 'No clear consent mechanism for data processing',
            severity: 'high',
            legalReference: 'GDPR Article 6 - Lawfulness of processing',
            suggestedFix: 'Add clear consent language and privacy policy reference'
          });
        }

        return {
          status: violations.length > 0 ? 'fail' : 'pass',
          score: violations.length > 0 ? 40 : 100,
          violations,
          recommendations: violations.length > 0 ? [
            'Add explicit consent language',
            'Reference privacy policy',
            'Explain data processing purposes'
          ] : [],
          references: [
            'GDPR Article 6 - Lawfulness of processing',
            'GDPR Article 7 - Conditions for consent',
            'GDPR Article 13 - Information to be provided where personal data are collected from the data subject'
          ],
          riskLevel: 'high'
        };
      }
    });

    // Data retention
    this.rules.set('gdpr_data_retention', {
      id: 'gdpr_data_retention',
      name: 'GDPR Data Retention Check',
      category: 'gdpr',
      description: 'Verifies data retention policy compliance',
      severity: 'medium',
      jurisdiction: ['EU', 'UK'],
      checkFunction: (text: string) => {
        const retentionIndicators = [
          'data retention', 'retention period', 'data deletion',
          'right to deletion', 'right to be forgotten', 'store data'
        ];

        const hasRetentionPolicy = retentionIndicators.some(indicator =>
          text.toLowerCase().includes(indicator)
        );

        const violations: ComplianceViolation[] = [];

        if (!hasRetentionPolicy) {
          violations.push({
            type: 'missing_retention_policy',
            description: 'No clear data retention policy',
            severity: 'medium',
            legalReference: 'GDPR Article 5 - Principles relating to processing of personal data',
            suggestedFix: 'Specify data retention periods and deletion procedures'
          });
        }

        return {
          status: violations.length > 0 ? 'warning' : 'pass',
          score: violations.length > 0 ? 60 : 100,
          violations,
          recommendations: violations.length > 0 ? [
            'Specify data retention periods',
            'Explain deletion procedures',
            'Include right to deletion information'
          ] : [],
          references: [
            'GDPR Article 5 - Principles relating to processing of personal data',
            'GDPR Article 17 - Right to erasure (right to be forgotten)'
          ],
          riskLevel: 'medium'
        };
      }
    });
  }

  private initializeADARules() {
    // Accessibility accommodations
    this.rules.set('ada_accommodations', {
      id: 'ada_accommodations',
      name: 'ADA Accommodations Check',
      category: 'ada',
      description: 'Verifies inclusion of disability accommodation statements',
      severity: 'medium',
      checkFunction: (text: string) => {
        const accommodationIndicators = [
          'reasonable accommodation', 'disability accommodation', 'ada compliance',
          'equal opportunity', 'accessibility', 'inclusive workplace'
        ];

        const hasAccommodationStatement = accommodationIndicators.some(indicator =>
          text.toLowerCase().includes(indicator)
        );

        const violations: ComplianceViolation[] = [];

        if (!hasAccommodationStatement) {
          violations.push({
            type: 'missing_accommodation_statement',
            description: 'No disability accommodation statement',
            severity: 'medium',
            legalReference: 'Americans with Disabilities Act (ADA)',
            suggestedFix: 'Add statement about reasonable accommodations for disabilities'
          });
        }

        return {
          status: violations.length > 0 ? 'warning' : 'pass',
          score: violations.length > 0 ? 70 : 100,
          violations,
          recommendations: violations.length > 0 ? [
            'Add accommodation statement',
            'Include contact information for accommodation requests',
            'Ensure application process is accessible'
          ] : [],
          references: [
            'Americans with Disabilities Act (ADA) of 1990',
            'ADA Title I - Employment',
            'EEOC Guidance on Disability Discrimination'
          ],
          riskLevel: 'medium'
        };
      }
    });
  }

  private initializeBiasDetectionRules() {
    // Unconscious bias
    this.rules.set('bias_detection', {
      id: 'bias_detection',
      name: 'Unconscious Bias Detection',
      category: 'bias',
      description: 'Detects language that may indicate unconscious bias',
      severity: 'medium',
      checkFunction: (text: string) => {
        const biasedTerms = [
          'culture fit', 'fit in', 'like-minded', 'similar background',
          'rockstar', 'ninja', 'guru', 'wizard', 'superstar',
          'work hard play hard', 'fast-paced environment', 'wear multiple hats'
        ];

        const violations: ComplianceViolation[] = [];

        for (const term of biasedTerms) {
          const regex = new RegExp(`\\b${term}\\b`, 'gi');
          let match;
          while ((match = regex.exec(text)) !== null) {
            violations.push({
              type: 'biased_language',
              description: `Potentially biased term: ${term}`,
              location: { position: match.index, context: text.substring(Math.max(0, match.index - 30), match.index + 30) },
              severity: 'medium',
              suggestedFix: 'Use neutral, inclusive language focusing on qualifications'
            });
          }
        }

        return {
          status: violations.length > 0 ? 'warning' : 'pass',
          score: Math.max(0, 100 - (violations.length * 10)),
          violations,
          recommendations: violations.length > 0 ? [
            'Use neutral, inclusive language',
            'Focus on skills and qualifications',
            'Avoid subjective or cultural references'
          ] : [],
          references: [
            'EEOC Guidance on Unconscious Bias',
            'Harvard Business Review: How to Reduce Unconscious Bias'
          ],
          riskLevel: 'medium'
        };
      }
    });
  }

  private initializeDataPrivacyRules() {
    // Personal data collection
    this.rules.set('data_privacy_collection', {
      id: 'data_privacy_collection',
      name: 'Personal Data Collection Check',
      category: 'data_privacy',
      description: 'Verifies appropriate personal data collection practices',
      severity: 'high',
      checkFunction: (text: string) => {
        const personalDataIndicators = [
          'social security', 'ssn', 'driver license', 'passport number',
          'bank account', 'credit card', 'financial information',
          'medical history', 'health records', 'genetic information'
        ];

        const violations: ComplianceViolation[] = [];

        for (const indicator of personalDataIndicators) {
          const regex = new RegExp(`\\b${indicator}\\b`, 'gi');
          let match;
          while ((match = regex.exec(text)) !== null) {
            violations.push({
              type: 'excessive_data_collection',
              description: `Request for sensitive personal data: ${indicator}`,
              location: { position: match.index, context: text.substring(Math.max(0, match.index - 30), match.index + 30) },
              severity: 'high',
              legalReference: 'Various Privacy Laws (GDPR, CCPA, etc.)',
              suggestedFix: 'Remove requests for sensitive personal data unless absolutely necessary'
            });
          }
        }

        return {
          status: violations.length > 0 ? 'fail' : 'pass',
          score: Math.max(0, 100 - (violations.length * 20)),
          violations,
          recommendations: violations.length > 0 ? [
            'Minimize personal data collection',
            'Collect only necessary information',
            'Explain why data is needed'
          ] : [],
          references: [
            'GDPR - Data Minimization Principle',
            'CCPA - Consumer Privacy Act',
            'General Data Protection Best Practices'
          ],
          riskLevel: 'high'
        };
      }
    });
  }

  private initializeStateLawRules() {
    // California Fair Chance Act
    this.rules.set('ca_fair_chance', {
      id: 'ca_fair_chance',
      name: 'California Fair Chance Act Check',
      category: 'state_law',
      description: 'Ensures compliance with California Fair Chance Act',
      severity: 'high',
      jurisdiction: ['CA'],
      checkFunction: (text: string) => {
        const prohibitedQuestions = [
          'have you ever been convicted', 'criminal record', 'felony',
          'misdemeanor', 'arrested', 'charged', 'background check'
        ];

        const violations: ComplianceViolation[] = [];

        for (const question of prohibitedQuestions) {
          const regex = new RegExp(`\\b${question}\\b`, 'gi');
          let match;
          while ((match = regex.exec(text)) !== null) {
            violations.push({
              type: 'prohibited_criminal_question',
              description: `Prohibited criminal history question: ${question}`,
              location: { position: match.index, context: text.substring(Math.max(0, match.index - 30), match.index + 30) },
              severity: 'high',
              legalReference: 'California Fair Chance Act',
              suggestedFix: 'Remove criminal history questions from initial application'
            });
          }
        }

        return {
          status: violations.length > 0 ? 'fail' : 'pass',
          score: Math.max(0, 100 - (violations.length * 25)),
          violations,
          recommendations: violations.length > 0 ? [
            'Remove criminal history questions',
            'Wait until conditional offer to conduct background checks',
            'Consider qualified candidates with criminal records'
          ] : [],
          references: [
            'California Fair Chance Act (AB 1008)',
            'Cal. Gov. Code § 12952'
          ],
          riskLevel: 'high'
        };
      }
    });
  }

  async checkCompliance(
    text: string,
    context: {
      jurisdiction?: string[];
      industry?: string;
      documentType?: 'job' | 'resume' | 'application';
    } = {}
  ): Promise<ComplianceReport> {
    const checks = [];
    let totalScore = 0;
    let criticalViolations = 0;

    // Get relevant rules based on context
    const relevantRules = Array.from(this.rules.values()).filter(rule => {
      // Check jurisdiction
      if (context.jurisdiction && rule.jurisdiction) {
        const hasJurisdictionMatch = rule.jurisdiction.some(jur =>
          context.jurisdiction!.includes(jur)
        );
        if (!hasJurisdictionMatch) return false;
      }

      // Check industry
      if (context.industry && rule.industry) {
        if (!rule.industry.includes(context.industry)) return false;
      }

      return true;
    });

    // Run all relevant checks
    for (const rule of relevantRules) {
      try {
        const result = rule.checkFunction(text, context);
        checks.push({
          ruleId: rule.id,
          ruleName: rule.name,
          category: rule.category,
          result
        });

        totalScore += result.score;
        criticalViolations += result.violations.filter(v => v.severity === 'critical').length;
      } catch (error) {
        console.error(`Error running compliance check ${rule.id}:`, error);
      }
    }

    const overallScore = checks.length > 0 ? totalScore / checks.length : 100;
    const overallStatus = criticalViolations > 0 ? 'non_compliant' :
                          overallScore < 70 ? 'warning' : 'compliant';

    const riskLevel = overallScore < 50 ? 'critical' :
                     overallScore < 70 ? 'high' :
                     overallScore < 85 ? 'medium' : 'low';

    // Generate audit trail
    const auditTrail = [{
      timestamp: new Date(),
      action: 'compliance_check',
      details: {
        documentType: context.documentType,
        jurisdiction: context.jurisdiction,
        industry: context.industry,
        overallScore,
        violationsCount: checks.reduce((sum, check) => sum + check.result.violations.length, 0)
      }
    }];

    // Generate remediation plan
    const remediationPlan = this.generateRemediationPlan(checks);

    return {
      overallStatus,
      overallScore: Math.round(overallScore),
      riskLevel,
      checks,
      auditTrail,
      remediationPlan
    };
  }

  private generateRemediationPlan(checks: any[]): Array<{
    violation: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    action: string;
    estimatedTime: string;
    resources: string[];
  }> {
    const plan: any[] = [];
    const processedViolations = new Set();

    for (const check of checks) {
      for (const violation of check.result.violations) {
        const key = `${violation.type}-${violation.description}`;
        if (processedViolations.has(key)) continue;
        processedViolations.add(key);

        plan.push({
          violation: violation.description,
          priority: violation.severity,
          action: violation.suggestedFix || 'Review and modify content',
          estimatedTime: this.estimateFixTime(violation.severity),
          resources: this.getFixResources(violation.type)
        });
      }
    }

    // Sort by priority
    return plan.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private estimateFixTime(severity: string): string {
    switch (severity) {
      case 'critical': return '2-4 hours';
      case 'high': return '1-2 hours';
      case 'medium': return '30-60 minutes';
      case 'low': return '15-30 minutes';
      default: return '30 minutes';
    }
  }

  private getFixResources(violationType: string): string[] {
    const resourceMap: Record<string, string[]> = {
      'age_specification': ['HR team', 'Legal counsel'],
      'gendered_language': ['Writing guidelines', 'HR review'],
      'protected_characteristic_inquiry': ['Legal counsel', 'Compliance officer'],
      'missing_consent': ['Legal team', 'Privacy officer'],
      'biased_language': ['DEI team', 'Writing guidelines'],
      'excessive_data_collection': ['Privacy officer', 'Legal counsel'],
      'prohibited_criminal_question': ['Legal counsel', 'HR team']
    };

    return resourceMap[violationType] || ['HR team'];
  }

  addCustomRule(rule: ComplianceRule): void {
    this.rules.set(rule.id, rule);
  }

  removeRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  getRule(ruleId: string): ComplianceRule | undefined {
    return this.rules.get(ruleId);
  }

  getAllRules(): ComplianceRule[] {
    return Array.from(this.rules.values());
  }

  getRulesByCategory(category: string): ComplianceRule[] {
    return Array.from(this.rules.values()).filter(rule => rule.category === category);
  }

  updateRule(ruleId: string, updates: Partial<ComplianceRule>): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;

    Object.assign(rule, updates);
    return true;
  }
}