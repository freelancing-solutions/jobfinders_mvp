import { KeywordExtraction } from './ATSEngine';

export interface IndustryConfig {
  name: string;
  category: string;
  keywords: {
    technical: string[];
    soft: string[];
    certifications: string[];
    experience: string[];
    tools: string[];
  };
  weighting: {
    technical: number;
    soft: number;
    certifications: number;
    experience: number;
    education: number;
  };
  compliance: {
    required?: string[];
    prohibited?: string[];
    certifications?: string[];
  };
  parsing: {
    sections: string[];
    formats: string[];
    specialFields: string[];
  };
}

export class IndustryParsers {
  private static instance: IndustryParsers;
  private industryConfigs: Map<string, IndustryConfig> = new Map();

  static getInstance(): IndustryParsers {
    if (!IndustryParsers.instance) {
      IndustryParsers.instance = new IndustryParsers();
    }
    return IndustryParsers.instance;
  }

  private constructor() {
    this.initializeIndustryConfigs();
  }

  private initializeIndustryConfigs() {
    // Technology Industry
    this.industryConfigs.set('technology', {
      name: 'Technology',
      category: 'tech',
      keywords: {
        technical: [
          'javascript', 'python', 'java', 'c++', 'react', 'angular', 'vue', 'node.js',
          'express', 'django', 'flask', 'spring', 'dotnet', 'php', 'ruby', 'rails',
          'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ansible',
          'sql', 'nosql', 'mongodb', 'postgresql', 'mysql', 'oracle', 'redis',
          'git', 'github', 'gitlab', 'jenkins', 'ci/cd', 'agile', 'scrum',
          'machine learning', 'artificial intelligence', 'data science', 'devops',
          'microservices', 'api', 'rest', 'graphql', 'websockets', 'blockchain',
          'cybersecurity', 'cloud computing', 'serverless', 'ios', 'android'
        ],
        soft: [
          'problem solving', 'team collaboration', 'communication', 'leadership',
          'adaptability', 'continuous learning', 'innovation', ' analytical thinking',
          'project management', 'mentoring', 'code review', 'documentation'
        ],
        certifications: [
          'aws certified', 'azure certified', 'google cloud certified', 'pmp',
          'cissp', 'compTIA', 'oracle certified', 'microsoft certified',
          'salesforce certified', 'scrum master', 'product owner'
        ],
        experience: [
          'software engineer', 'senior developer', 'tech lead', 'architect',
          'full stack', 'frontend', 'backend', 'devops engineer', 'data scientist',
          'machine learning engineer', 'qa engineer', 'sdet', 'product manager'
        ],
        tools: [
          'visual studio', 'intellij', 'vscode', 'jira', 'confluence', 'slack',
          'postman', 'figma', 'sketch', 'webpack', 'babel', 'eslint', 'jest',
          'kubernetes', 'docker', 'terraform', 'ansible', 'jenkins', 'github'
        ]
      },
      weighting: {
        technical: 0.45,
        soft: 0.20,
        certifications: 0.15,
        experience: 0.15,
        education: 0.05
      },
      compliance: {
        required: ['Equal Opportunity Employer'],
        prohibited: ['age discrimination', 'gender preference'],
        certifications: ['security clearance required for government contracts']
      },
      parsing: {
        sections: ['skills', 'experience', 'projects', 'education', 'certifications'],
        formats: ['resume', 'cv', 'github profile', 'linkedin'],
        specialFields: ['github', 'linkedin', 'portfolio', 'stack overflow']
      }
    });

    // Healthcare Industry
    this.industryConfigs.set('healthcare', {
      name: 'Healthcare',
      category: 'medical',
      keywords: {
        technical: [
          'patient care', 'medical terminology', 'hipaa', 'emr', 'ehr', 'epic',
          'cerner', 'medical coding', 'billing', 'clinical research', 'pharmacology',
          'anatomy', 'physiology', 'medical diagnosis', 'treatment planning',
          'vital signs', 'medical procedures', 'surgery assistance', 'triage',
          'medical records', 'healthcare it', 'telehealth', 'medical imaging'
        ],
        soft: [
          'patient communication', 'empathy', 'compassion', 'stress management',
          'attention to detail', 'teamwork', 'bedside manner', 'confidentiality',
          'critical thinking', 'time management', 'multitasking', 'adaptability'
        ],
        certifications: [
          'rn', 'lpn', 'cna', 'cma', 'rma', 'bcls', 'acls', 'pals',
          'medical license', 'board certified', 'fellowship', 'residency',
          'nursing license', 'physician assistant', 'nurse practitioner'
        ],
        experience: [
          'registered nurse', 'physician', 'surgeon', 'medical assistant',
          'healthcare administrator', 'clinical coordinator', 'medical technician',
          'pharmacist', 'physical therapist', 'occupational therapist',
          'medical coder', 'healthcare consultant', 'clinical researcher'
        ],
        tools: [
          'epic systems', 'cerner', 'allscripts', 'athenahealth', 'eclinicalworks',
          'medical devices', 'diagnostic equipment', 'telemedicine platform',
          'medical software', 'billing software', 'scheduling systems'
        ]
      },
      weighting: {
        technical: 0.35,
        soft: 0.30,
        certifications: 0.25,
        experience: 0.05,
        education: 0.05
      },
      compliance: {
        required: ['HIPAA compliance', 'medical license verification'],
        prohibited: ['discrimination based on health status'],
        certifications: ['state medical license', 'DEA registration', 'NPI number']
      },
      parsing: {
        sections: ['licenses', 'certifications', 'clinical experience', 'education', 'specializations'],
        formats: ['resume', 'cv', 'medical license', 'board certification'],
        specialFields: ['medical license', 'DEA number', 'NPI number', 'specialty']
      }
    });

    // Finance Industry
    this.industryConfigs.set('finance', {
      name: 'Finance',
      category: 'financial',
      keywords: {
        technical: [
          'financial analysis', 'investment banking', 'portfolio management',
          'risk management', 'financial modeling', 'valuation', 'due diligence',
          'mergers and acquisitions', 'ipo', 'trading', 'equity research',
          'fixed income', 'derivatives', 'commodities', 'forex', 'crypto',
          'wealth management', 'asset management', 'fund management', 'hedge fund',
          'private equity', 'venture capital', 'credit analysis', 'underwriting'
        ],
        soft: [
          'analytical thinking', 'attention to detail', 'communication',
          'negotiation', 'relationship management', 'sales', 'presentation',
          'leadership', 'strategic thinking', 'problem solving', 'decision making'
        ],
        certifications: [
          'cfa', 'cpa', 'cfp', 'frm', 'caia', 'series 7', 'series 63',
          'series 65', 'series 66', 'insurance license', 'sec registered',
          'finra licensed', 'cisa', 'cism', 'cfe'
        ],
        experience: [
          'financial analyst', 'investment banker', 'portfolio manager',
          'risk manager', 'credit analyst', 'trader', 'broker', 'financial advisor',
          'wealth manager', 'asset manager', 'fund manager', 'compliance officer',
          'controller', 'cfo', 'finance manager', 'treasury analyst'
        ],
        tools: [
          'bloomberg', 'reuters', 'factset', 'capital iq', 'excel', 'powerpoint',
          'salesforce', 'salesforce financial cloud', 'adobe', 'tableau', 'quickbooks',
          'sap', 'oracle financial', 'risk management software', 'trading platforms'
        ]
      },
      weighting: {
        technical: 0.40,
        soft: 0.25,
        certifications: 0.20,
        experience: 0.10,
        education: 0.05
      },
      compliance: {
        required: ['SEC compliance', 'FINRA registration'],
        prohibited: ['insider trading', 'misrepresentation'],
        certifications: ['series 7', 'series 63', 'cfa', 'cpa']
      },
      parsing: {
        sections: ['experience', 'education', 'certifications', 'licenses', 'deal experience'],
        formats: ['resume', 'cv', 'linkedin', 'bloomberg profile'],
        specialFields: ['series licenses', 'cfa level', 'university', 'gpa']
      }
    });

    // Education Industry
    this.industryConfigs.set('education', {
      name: 'Education',
      category: 'academic',
      keywords: {
        technical: [
          'curriculum development', 'lesson planning', 'educational technology',
          'learning management systems', 'assessment', 'instructional design',
          'pedagogy', 'classroom management', 'student engagement', 'differentiation',
          'educational research', 'learning theory', 'child development',
          'educational psychology', 'special education', 'esl', 'bilingual education'
        ],
        soft: [
          'teaching', 'mentoring', 'communication', 'patience', 'creativity',
          'adaptability', 'leadership', 'collaboration', 'problem solving',
          'classroom management', 'parent communication', 'cultural sensitivity'
        ],
        certifications: [
          'teaching license', 'teaching certification', 'state certification',
          'tesol', 'tefl', 'special education certification', 'principal certification',
          'superintendent certification', 'school counselor certification'
        ],
        experience: [
          'teacher', 'professor', 'instructor', 'lecturer', 'principal',
          'superintendent', 'school administrator', 'curriculum coordinator',
          'instructional designer', 'educational consultant', 'librarian',
          'school counselor', 'special education teacher'
        ],
        tools: [
          'google classroom', 'microsoft teams', 'zoom', 'canvas', 'moodle',
          'blackboard', 'smartboard', 'educational apps', 'assessment tools',
          'learning management systems', 'student information systems'
        ]
      },
      weighting: {
        technical: 0.25,
        soft: 0.35,
        certifications: 0.25,
        experience: 0.10,
        education: 0.05
      },
      compliance: {
        required: ['teaching license', 'background check'],
        prohibited: ['discrimination based on age, gender, race'],
        certifications: ['state teaching license', 'fingerprint clearance']
      },
      parsing: {
        sections: ['teaching experience', 'education', 'certifications', 'licenses', 'research'],
        formats: ['resume', 'cv', 'teaching portfolio', 'linkedin'],
        specialFields: ['teaching license', 'certification area', 'grade levels', 'subjects']
      }
    });

    // Manufacturing Industry
    this.industryConfigs.set('manufacturing', {
      name: 'Manufacturing',
      category: 'industrial',
      keywords: {
        technical: [
          'lean manufacturing', 'six sigma', 'kaizen', 'continuous improvement',
          'quality control', 'quality assurance', 'iso 9001', 'production planning',
          'supply chain', 'logistics', 'inventory management', 'warehouse management',
          'manufacturing processes', 'cnc machining', 'welding', 'fabrication',
          'assembly line', 'production scheduling', 'maintenance', 'preventive maintenance'
        ],
        soft: [
          'team leadership', 'problem solving', 'attention to detail', 'communication',
          'time management', 'adaptability', 'safety consciousness', 'quality focus',
          'analytical thinking', 'decision making', 'project management'
        ],
        certifications: [
          'six sigma black belt', 'six sigma green belt', 'lean certification',
          'pmp', 'cpim', 'cscp', 'osha certification', 'forklift certification',
          'welding certification', 'cnc certification', 'quality auditor'
        ],
        experience: [
          'production manager', 'manufacturing engineer', 'quality manager',
          'supply chain manager', 'logistics coordinator', 'plant manager',
          'operations manager', 'maintenance supervisor', 'production supervisor',
          'quality engineer', 'process engineer', 'industrial engineer'
        ],
        tools: [
          'erp systems', 'sap', 'oracle', 'microsoft dynamics', 'autocad',
          'solidworks', 'catia', 'microsoft project', 'excel', 'quality management software',
          'inventory management systems', 'production scheduling software'
        ]
      },
      weighting: {
        technical: 0.40,
        soft: 0.25,
        certifications: 0.20,
        experience: 0.10,
        education: 0.05
      },
      compliance: {
        required: ['OSHA compliance', 'safety training'],
        prohibited: ['safety violations', 'unauthorized modifications'],
        certifications: ['OSHA 10', 'OSHA 30', 'forklift certification']
      },
      parsing: {
        sections: ['work experience', 'certifications', 'skills', 'education', 'safety training'],
        formats: ['resume', 'cv', 'linkedin'],
        specialFields: ['machinery experience', 'certifications', 'safety record']
      }
    });

    // Retail Industry
    this.industryConfigs.set('retail', {
      name: 'Retail',
      category: 'sales',
      keywords: {
        technical: [
          'sales', 'customer service', 'merchandising', 'inventory management',
          'point of sale', 'pos systems', 'retail operations', 'store management',
          'visual merchandising', 'loss prevention', 'sales forecasting',
          'product knowledge', 'upselling', 'cross-selling', 'customer relationship management'
        ],
        soft: [
          'customer service', 'communication', 'salesmanship', 'problem solving',
          'teamwork', 'leadership', 'adaptability', 'time management',
          'conflict resolution', 'product knowledge', 'attention to detail'
        ],
        certifications: [
          'retail management certificate', 'customer service certification',
          'sales certification', 'loss prevention certification', 'first aid',
          'food handling permit', 'alcohol serving permit'
        ],
        experience: [
          'sales associate', 'store manager', 'assistant manager', 'department manager',
          'buyer', 'merchandiser', 'visual merchandiser', 'loss prevention specialist',
          'customer service representative', 'cashier', 'sales supervisor'
        ],
        tools: [
          'pos systems', 'inventory management software', 'customer relationship management',
          'microsoft office', 'scheduling software', 'communication platforms',
          'retail management systems'
        ]
      },
      weighting: {
        technical: 0.30,
        soft: 0.40,
        certifications: 0.10,
        experience: 0.15,
        education: 0.05
      },
      compliance: {
        required: ['customer service training', 'safety procedures'],
        prohibited: ['age discrimination in hiring'],
        certifications: ['food handling', 'alcohol service']
      },
      parsing: {
        sections: ['work experience', 'skills', 'education', 'certifications'],
        formats: ['resume', 'cv', 'linkedin'],
        specialFields: ['sales experience', 'customer service skills']
      }
    });
  }

  detectIndustry(text: string): { industry: string; confidence: number } {
    const lowerText = text.toLowerCase();
    const industryScores = new Map<string, number>();

    for (const [industryKey, config] of this.industryConfigs) {
      let score = 0;
      let totalKeywords = 0;

      // Check all keyword categories
      const allKeywords = [
        ...config.keywords.technical,
        ...config.keywords.soft,
        ...config.keywords.certifications,
        ...config.keywords.experience,
        ...config.keywords.tools
      ];

      totalKeywords = allKeywords.length;

      for (const keyword of allKeywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          score += 1;
        }
      }

      const confidence = totalKeywords > 0 ? score / totalKeywords : 0;
      industryScores.set(industryKey, confidence);
    }

    // Find the best match
    let bestIndustry = 'general';
    let bestScore = 0;

    for (const [industry, score] of industryScores) {
      if (score > bestScore && score > 0.1) { // Minimum threshold of 10%
        bestScore = score;
        bestIndustry = industry;
      }
    }

    return {
      industry: bestIndustry,
      confidence: Math.round(bestScore * 100)
    };
  }

  parseForIndustry(text: string, industry: string): KeywordExtraction {
    const config = this.industryConfigs.get(industry);
    if (!config) {
      return this.genericParse(text);
    }

    const normalizedText = text.toLowerCase().replace(/[^\w\s]/g, ' ');
    const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);

    const extraction: KeywordExtraction = {
      skills: [],
      experience: [],
      education: [],
      industry: []
    };

    // Parse technical skills
    for (const skill of config.keywords.technical) {
      const regex = new RegExp(`\\b${skill.replace(/\s+/g, '\\s+')}\\b`, 'gi');
      const matches = text.match(regex);

      if (matches) {
        const contexts = sentences.filter(sentence =>
          sentence.toLowerCase().includes(skill.toLowerCase())
        ).slice(0, 3);

        extraction.skills.push({
          keyword: skill,
          category: 'technical',
          weight: config.weighting.technical * Math.min(matches.length / 3, 1),
          frequency: matches.length,
          context: contexts
        });
      }
    }

    // Parse soft skills
    for (const skill of config.keywords.soft) {
      const regex = new RegExp(`\\b${skill.replace(/\s+/g, '\\s+')}\\b`, 'gi');
      const matches = text.match(regex);

      if (matches) {
        const contexts = sentences.filter(sentence =>
          sentence.toLowerCase().includes(skill.toLowerCase())
        ).slice(0, 3);

        extraction.skills.push({
          keyword: skill,
          category: 'soft',
          weight: config.weighting.soft * Math.min(matches.length / 3, 1),
          frequency: matches.length,
          context: contexts
        });
      }
    }

    // Parse certifications
    for (const cert of config.keywords.certifications) {
      const regex = new RegExp(`\\b${cert.replace(/\s+/g, '\\s+')}\\b`, 'gi');
      const matches = text.match(regex);

      if (matches) {
        const contexts = sentences.filter(sentence =>
          sentence.toLowerCase().includes(cert.toLowerCase())
        ).slice(0, 3);

        extraction.skills.push({
          keyword: cert,
          category: 'certification',
          weight: config.weighting.certifications * Math.min(matches.length / 2, 1),
          frequency: matches.length,
          context: contexts
        });
      }
    }

    // Parse experience levels
    const experienceLevels = {
      'entry': ['entry level', 'junior', 'associate', 'intern', 'trainee', '0-1 year', '1-2 years'],
      'mid': ['mid level', 'intermediate', '3-5 years', '4-6 years', 'experienced'],
      'senior': ['senior', 'lead', 'principal', '5+ years', '7+ years', 'expert'],
      'executive': ['executive', 'director', 'vp', 'c-level', 'manager', 'head of']
    };

    for (const [level, keywords] of Object.entries(experienceLevels)) {
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
            weight: config.weighting.experience * matches.length * 0.3,
            context: contexts
          });
        }
      }
    }

    // Parse education
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
            weight: config.weighting.education * matches.length * 0.4,
            context: contexts
          });
        }
      }
    }

    // Add industry-specific information
    extraction.industry.push({
      keyword: config.name,
      relevance: 1.0,
      category: config.category
    });

    // Sort by weight
    extraction.skills.sort((a, b) => b.weight - a.weight);
    extraction.experience.sort((a, b) => b.weight - a.weight);
    extraction.education.sort((a, b) => b.weight - a.weight);

    return extraction;
  }

  private genericParse(text: string): KeywordExtraction {
    // Fallback generic parsing when industry is not detected
    return {
      skills: [],
      experience: [],
      education: [],
      industry: []
    };
  }

  validateIndustryRequirements(
    text: string,
    industry: string
  ): {
    isValid: boolean;
    missingRequirements: string[];
    recommendations: string[];
  } {
    const config = this.industryConfigs.get(industry);
    if (!config) {
      return {
        isValid: true,
        missingRequirements: [],
        recommendations: []
      };
    }

    const lowerText = text.toLowerCase();
    const missingRequirements: string[] = [];
    const recommendations: string[] = [];

    // Check for required compliance items
    if (config.compliance.required) {
      for (const requirement of config.compliance.required) {
        if (!lowerText.includes(requirement.toLowerCase())) {
          missingRequirements.push(`Missing: ${requirement}`);
        }
      }
    }

    // Check for prohibited items
    if (config.compliance.prohibited) {
      for (const prohibited of config.compliance.prohibited) {
        if (lowerText.includes(prohibited.toLowerCase())) {
          missingRequirements.push(`Prohibited content: ${prohibited}`);
        }
      }
    }

    // Check for required certifications
    if (config.compliance.certifications) {
      const foundCerts = config.compliance.certifications.filter(cert =>
        lowerText.includes(cert.toLowerCase())
      );

      if (foundCerts.length === 0) {
        recommendations.push(`Consider adding relevant certifications: ${config.compliance.certifications.join(', ')}`);
      }
    }

    // Generate recommendations based on missing keywords
    const allKeywords = [
      ...config.keywords.technical,
      ...config.keywords.soft,
      ...config.keywords.tools
    ];

    const foundKeywords = allKeywords.filter(keyword =>
      lowerText.includes(keyword.toLowerCase())
    );

    const keywordCoverage = foundKeywords.length / allKeywords.length;

    if (keywordCoverage < 0.3) {
      recommendations.push(`Include more ${config.name} industry-specific terminology`);
    }

    if (keywordCoverage < 0.5) {
      recommendations.push(`Highlight relevant skills and tools common in ${config.name}`);
    }

    return {
      isValid: missingRequirements.length === 0,
      missingRequirements,
      recommendations
    };
  }

  getIndustryConfig(industry: string): IndustryConfig | undefined {
    return this.industryConfigs.get(industry);
  }

  getAllIndustries(): Array<{ key: string; name: string; category: string }> {
    return Array.from(this.industryConfigs.entries()).map(([key, config]) => ({
      key,
      name: config.name,
      category: config.category
    }));
  }

  addCustomIndustryConfig(key: string, config: IndustryConfig): void {
    this.industryConfigs.set(key, config);
  }

  updateIndustryWeights(industry: string, weights: Partial<IndustryConfig['weighting']>): boolean {
    const config = this.industryConfigs.get(industry);
    if (!config) return false;

    config.weighting = { ...config.weighting, ...weights };
    return true;
  }
}