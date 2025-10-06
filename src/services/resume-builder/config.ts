/**
 * Resume Builder Configuration
 *
 * Centralized configuration for the AI-powered resume builder system.
 * Includes AI service settings, file upload limits, and feature flags.
 */

import { z } from 'zod';

const envSchema = z.object({
  // AI Service Configuration
  OPENROUTER_API_KEY: z.string().min(1, 'OpenRouter API key is required'),
  OPENROUTER_API_URL: z.string().url().default('https://api.openrouter.ai/api/v1'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_ORG_ID: z.string().optional(),

  // Resume Builder Configuration
  RESUME_UPLOAD_MAX_SIZE: z.string().transform(Number).default('10485760'), // 10MB
  RESUME_UPLOAD_ALLOWED_TYPES: z.string().default('application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain'),
  RESUME_GENERATION_TIMEOUT: z.string().transform(Number).default('300000'), // 5 minutes
  RESUME_ANALYSIS_TIMEOUT: z.string().transform(Number).default('60000'), // 1 minute

  // File Storage Configuration
  UPLOAD_DIR: z.string().default('uploads/resumes'),
  MAX_FILE_SIZE: z.string().transform(Number).default('10485760'),
  ALLOWED_FILE_TYPES: z.string().default('pdf,doc,docx,txt'),

  // Feature Flags
  ENABLE_RESUME_BUILDER: z.string().transform(val => val === 'true').default('true'),
  ENABLE_ATS_SCORING: z.string().transform(val => val === 'true').default('true'),
  ENABLE_AI_ANALYSIS: z.string().transform(val => val === 'true').default('true'),
  ENABLE_TEMPLATE_CUSTOMIZATION: z.string().transform(val => val === 'true').default('true'),
});

const env = envSchema.parse(process.env);

export const resumeBuilderConfig = {
  // AI Service Configuration
  ai: {
    openRouter: {
      apiKey: env.OPENROUTER_API_KEY,
      apiUrl: env.OPENROUTER_API_URL,
      models: {
        primary: 'anthropic/claude-3.5-sonnet',
        fallback: 'openai/gpt-4-turbo',
        fast: 'openai/gpt-3.5-turbo',
      },
      rateLimit: {
        requests: 100,
        window: 60000, // 1 minute
      },
      timeouts: {
        chatCompletion: 60000, // 1 minute
        analysis: env.RESUME_ANALYSIS_TIMEOUT,
        generation: env.RESUME_GENERATION_TIMEOUT,
      },
    },
    openai: env.OPENAI_API_KEY ? {
      apiKey: env.OPENAI_API_KEY,
      orgId: env.OPENAI_ORG_ID,
      models: {
        primary: 'gpt-4-turbo-preview',
        fallback: 'gpt-3.5-turbo-16k',
        fast: 'gpt-3.5-turbo',
      },
      rateLimit: {
        requests: 200,
        window: 60000, // 1 minute
      },
    } : null,
  },

  // File Upload Configuration
  fileUpload: {
    maxFileSize: env.RESUME_UPLOAD_MAX_SIZE,
    allowedMimeTypes: env.RESUME_UPLOAD_ALLOWED_TYPES.split(','),
    allowedExtensions: env.ALLOWED_FILE_TYPES.split(','),
    uploadDir: env.UPLOAD_DIR,
    validation: {
      scanForMalware: true,
      validateFileHeaders: true,
      checkFileIntegrity: true,
    },
  },

  // Resume Processing Configuration
  processing: {
    timeouts: {
      upload: 30000, // 30 seconds
      parsing: 60000, // 1 minute
      analysis: env.RESUME_ANALYSIS_TIMEOUT,
      generation: env.RESUME_GENERATION_TIMEOUT,
      templateRender: 120000, // 2 minutes
    },
    retryAttempts: {
      aiService: 3,
      fileUpload: 2,
      parsing: 2,
    },
    retryDelays: {
      aiService: [1000, 2000, 5000], // Progressive delays
      fileUpload: [1000, 3000],
      parsing: [2000, 5000],
    },
  },

  // ATS Analysis Configuration
  ats: {
    scoring: {
      weightings: {
        skills: 0.3,
        experience: 0.25,
        education: 0.15,
        keywords: 0.2,
        formatting: 0.1,
      },
      thresholds: {
        excellent: 80,
        good: 60,
        fair: 40,
        poor: 0,
      },
    },
    keywords: {
      industry: {
        technology: [
          'javascript', 'typescript', 'react', 'node.js', 'python', 'aws', 'docker',
          'kubernetes', 'mongodb', 'postgresql', 'graphql', 'rest api', 'microservices'
        ],
        healthcare: [
          'patient care', 'medical records', 'hipaa', 'clinical', 'healthcare',
          'medical terminology', 'patient assessment', 'cpr certified', 'emr'
        ],
        finance: [
          'financial analysis', 'accounting', 'excel', 'financial modeling',
          'risk management', 'compliance', 'audit', 'financial reporting'
        ],
      },
      actionVerbs: [
        'managed', 'developed', 'implemented', 'created', 'led', 'designed',
        'optimized', 'increased', 'reduced', 'improved', 'launched', 'coordinated'
      ],
      skills: [
        'communication', 'leadership', 'problem solving', 'teamwork', 'project management',
        'analytical skills', 'time management', 'adaptability', 'creativity', 'critical thinking'
      ],
    },
  },

  // Template Configuration
  templates: {
    categories: ['professional', 'creative', 'modern', 'academic', 'technical', 'executive'],
    defaultTemplate: 'professional-modern',
    customization: {
      allowColorChanges: true,
      allowFontChanges: true,
      allowLayoutChanges: true,
      allowSectionReordering: true,
    },
    rendering: {
      formats: ['pdf', 'docx', 'html'],
      quality: {
        standard: { dpi: 150, compression: true },
        high: { dpi: 300, compression: false },
        print: { dpi: 600, compression: false },
      },
    },
  },

  // Database Configuration
  database: {
    retryAttempts: 3,
    retryDelay: 1000,
    connectionTimeout: 30000,
    queryTimeout: 60000,
  },

  // Cache Configuration
  cache: {
    analysis: {
      ttl: 3600, // 1 hour
      maxSize: 1000,
    },
    templates: {
      ttl: 86400, // 24 hours
      maxSize: 100,
    },
    parsedResumes: {
      ttl: 7200, // 2 hours
      maxSize: 500,
    },
  },

  // Security Configuration
  security: {
    fileValidation: {
      checkMagicBytes: true,
      scanContent: true,
      validateStructure: true,
    },
    rateLimiting: {
      upload: { requests: 10, window: 60000 }, // 10 uploads per minute
      analysis: { requests: 20, window: 60000 }, // 20 analyses per minute
      generation: { requests: 5, window: 60000 }, // 5 generations per minute
    },
    quotas: {
      free: {
        uploads: 5,
        analyses: 10,
        generations: 3,
        templates: 3,
      },
      premium: {
        uploads: 100,
        analyses: 500,
        generations: 100,
        templates: 50,
      },
    },
  },

  // Monitoring and Analytics
  monitoring: {
    metrics: {
      enabled: true,
      sampleRate: 0.1, // 10% sampling
    },
    logging: {
      level: 'info',
      includeRequestBody: false,
      includeResponseBody: false,
      maxLogSize: 1000, // characters
    },
    alerts: {
      errorRateThreshold: 0.05, // 5%
      responseTimeThreshold: 5000, // 5 seconds
      quotaUsageThreshold: 0.8, // 80%
    },
  },

  // Feature Flags
  features: {
    resumeBuilder: env.ENABLE_RESUME_BUILDER,
    atsScoring: env.ENABLE_ATS_SCORING,
    aiAnalysis: env.ENABLE_AI_ANALYSIS,
    templateCustomization: env.ENABLE_TEMPLATE_CUSTOMIZATION,
    realTimeCollaboration: false, // Future feature
    bulkProcessing: false, // Future feature
    integrations: {
      linkedin: false, // Future feature
      github: false, // Future feature
      portfolio: false, // Future feature
    },
  },

  // API Configuration
  api: {
    version: 'v1',
    baseUrl: '/api/resume-builder',
    endpoints: {
      upload: '/upload',
      parse: '/parse',
      analyze: '/analyze',
      generate: '/generate',
      templates: '/templates',
      export: '/export',
    },
    pagination: {
      defaultLimit: 20,
      maxLimit: 100,
    },
  },

  // Business Logic Configuration
  business: {
    subscription: {
      freeFeatures: ['basic_upload', 'basic_templates', 'limited_analysis'],
      premiumFeatures: ['unlimited_upload', 'all_templates', 'advanced_analysis', 'priority_processing'],
    },
    onboarding: {
      enableTutorial: true,
      sampleResumeProvided: true,
      requiredSteps: ['upload', 'select_template', 'generate'],
    },
  },
} as const;

export type ResumeBuilderConfig = typeof resumeBuilderConfig;

// Validation helpers
export const validateConfig = () => {
  const errors: string[] = [];

  // Validate required API keys
  if (!env.OPENROUTER_API_KEY && !env.OPENAI_API_KEY) {
    errors.push('Either OPENROUTER_API_KEY or OPENAI_API_KEY must be provided');
  }

  // Validate file size limits
  if (env.RESUME_UPLOAD_MAX_SIZE > 52428800) { // 50MB
    errors.push('RESUME_UPLOAD_MAX_SIZE cannot exceed 50MB');
  }

  // Validate timeouts
  if (env.RESUME_GENERATION_TIMEOUT > 600000) { // 10 minutes
    errors.push('RESUME_GENERATION_TIMEOUT cannot exceed 10 minutes');
  }

  return errors;
};

// Export environment variables for use in other parts of the application
export const envConfig = env;