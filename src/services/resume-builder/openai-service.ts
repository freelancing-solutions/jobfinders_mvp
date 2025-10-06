/**
 * OpenAI Service for Resume Builder
 *
 * Enhanced OpenAI API integration with rate limiting, token tracking,
 * error handling, and fallback mechanisms for the resume builder system.
 */

import OpenAI from 'openai';
import { resumeBuilderConfig } from './config';
import { ResumeBuilderErrorFactory, withServiceErrorHandling } from './errors';
import { RateLimiter } from '@/lib/rate-limiter';
import { tokenTracker } from '@/lib/token-tracker';

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIRequestOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
}

export interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finishReason: string;
  }>;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface TokenUsage {
  timestamp: Date;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  operation: string;
  userId?: string;
  requestId?: string;
}

export class OpenAIService {
  private client: OpenAI | null = null;
  private rateLimiters: Map<string, RateLimiter> = new Map();
  private tokenUsageHistory: TokenUsage[] = [];
  private isEnabled: boolean = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    const config = resumeBuilderConfig.ai.openai;

    if (!config || !config.apiKey) {
      console.warn('[OpenAIService] OpenAI API key not configured, service disabled');
      this.isEnabled = false;
      return;
    }

    try {
      this.client = new OpenAI({
        apiKey: config.apiKey,
        organization: config.orgId,
      });

      // Initialize rate limiters for different operations
      this.rateLimiters.set('default', new RateLimiter({
        maxRequests: config.rateLimit.requests,
        windowMs: config.rateLimit.window,
        keyPrefix: 'openai_default',
      }));

      this.rateLimiters.set('analysis', new RateLimiter({
        maxRequests: 20, // More restrictive for expensive operations
        windowMs: config.rateLimit.window,
        keyPrefix: 'openai_analysis',
      }));

      this.rateLimiters.set('generation', new RateLimiter({
        maxRequests: 10, // Most restrictive for generation
        windowMs: config.rateLimit.window,
        keyPrefix: 'openai_generation',
      }));

      this.isEnabled = true;
      console.log('[OpenAIService] Successfully initialized');
    } catch (error) {
      console.error('[OpenAIService] Failed to initialize:', error);
      this.isEnabled = false;
    }
  }

  private getRateLimiter(operation: string): RateLimiter {
    return this.rateLimiters.get(operation) || this.rateLimiters.get('default')!;
  }

  private calculateCost(model: string, promptTokens: number, completionTokens: number): number {
    // Pricing per 1M tokens (as of 2024)
    const pricing: { [key: string]: { input: number; output: number } } = {
      'gpt-4-turbo-preview': { input: 10, output: 30 },
      'gpt-4': { input: 30, output: 60 },
      'gpt-3.5-turbo-16k': { input: 3, output: 4 },
      'gpt-3.5-turbo': { input: 1, output: 2 },
    };

    const modelPricing = pricing[model] || pricing['gpt-3.5-turbo'];
    const inputCost = (promptTokens / 1000000) * modelPricing.input;
    const outputCost = (completionTokens / 1000000) * modelPricing.output;
    return inputCost + outputCost;
  }

  private recordTokenUsage(usage: any, model: string, operation: string, userId?: string, requestId?: string) {
    const tokenUsage: TokenUsage = {
      timestamp: new Date(),
      model,
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
      cost: this.calculateCost(model, usage.prompt_tokens, usage.completion_tokens),
      operation,
      userId,
      requestId,
    };

    this.tokenUsageHistory.push(tokenUsage);

    // Keep only last 1000 records to prevent memory issues
    if (this.tokenUsageHistory.length > 1000) {
      this.tokenUsageHistory = this.tokenUsageHistory.slice(-1000);
    }

    // Log significant usage
    if (tokenUsage.totalTokens > 1000 || tokenUsage.cost > 0.01) {
      console.log('[OpenAIService] Token usage:', {
        model,
        operation,
        tokens: tokenUsage.totalTokens,
        cost: `$${tokenUsage.cost.toFixed(4)}`,
        userId,
        requestId,
      });
    }
  }

  async chatCompletion(
    messages: OpenAIMessage[],
    options: OpenAIRequestOptions & {
      operation?: string;
      userId?: string;
      requestId?: string;
    } = {}
  ): Promise<OpenAIResponse> {
    if (!this.isEnabled || !this.client) {
      throw ResumeBuilderErrorFactory.aiServiceError(
        new Error('OpenAI service is not available'),
        options.requestId
      );
    }

    const {
      model = resumeBuilderConfig.ai.openai!.models.primary,
      temperature = 0.7,
      maxTokens = 2000,
      operation = 'default',
      userId,
      requestId,
      ...otherOptions
    } = options;

    const rateLimiter = this.getRateLimiter(operation);

    try {
      // Check rate limits
      await rateLimiter.check(userId || 'anonymous');

      const response = await this.client.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        ...otherOptions,
      });

      const openAIResponse: OpenAIResponse = {
        id: response.id,
        object: response.object,
        created: response.created,
        model: response.model,
        choices: response.choices.map(choice => ({
          index: choice.index,
          message: {
            role: choice.message.role,
            content: choice.message.content || '',
          },
          finishReason: choice.finish_reason || 'unknown',
        })),
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
      };

      // Record token usage in local tracker
      this.recordTokenUsage(response.usage || {}, model, operation, userId, requestId);

      // Record token usage in centralized tracker
      await tokenTracker.trackUsage({
        service: 'openai',
        model,
        operation,
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
        userId,
        requestId,
        metadata: {
          temperature,
          maxTokens,
          messageCount: messages.length,
        },
      });

      return openAIResponse;
    } catch (error: any) {
      console.error('[OpenAIService] Chat completion error:', error);

      // Handle specific OpenAI errors
      if (error.status === 429) {
        throw ResumeBuilderErrorFactory.rateLimitExceeded(
          60, // Retry after 60 seconds
          requestId
        );
      }

      if (error.status === 401) {
        throw ResumeBuilderErrorFactory.aiServiceError(
          new Error('Invalid OpenAI API key'),
          requestId
        );
      }

      if (error.status === 403) {
        throw ResumeBuilderErrorFactory.aiServiceError(
          new Error('OpenAI API access forbidden'),
          requestId
        );
      }

      if (error.status >= 500) {
        // Try fallback model for server errors
        const fallbackModel = resumeBuilderConfig.ai.openai!.models.fallback;
        if (model !== fallbackModel) {
          console.log(`[OpenAIService] Retrying with fallback model: ${fallbackModel}`);
          return this.chatCompletion(messages, {
            ...options,
            model: fallbackModel,
          });
        }
      }

      throw ResumeBuilderErrorFactory.aiServiceError(error, requestId);
    }
  }

  // Specialized methods for resume builder operations

  async analyzeResume(
    resumeText: string,
    jobDescription?: string,
    options: { userId?: string; requestId?: string } = {}
  ) {
    const systemPrompt = `You are an expert resume analyzer and career coach with deep knowledge of Applicant Tracking Systems (ATS), recruitment trends, and industry best practices.

Your task is to analyze the provided resume and job description (if available) to provide comprehensive feedback.

Focus on:
1. ATS compatibility and keyword optimization
2. Content quality and impact
3. Structure and formatting
4. Skills and experience alignment
5. Areas for improvement

Provide specific, actionable recommendations with examples where appropriate.`;

    const userPrompt = `Please analyze this resume${jobDescription ? ' against the job description' : ''}:

${jobDescription ? `JOB DESCRIPTION:
${jobDescription}

` : ''}RESUME:
${resumeText}

Please provide:
1. Overall ATS score (0-100)
2. Key strengths (3-5 points)
3. Areas for improvement (3-5 points)
4. Specific suggestions for each section
5. Keyword analysis and recommendations

Format your response as JSON with the following structure:
{
  "atsScore": number,
  "strengths": string[],
  "improvements": string[],
  "sectionSuggestions": {
    "summary": string[],
    "experience": string[],
    "education": string[],
    "skills": string[]
  },
  "keywordAnalysis": {
    "foundKeywords": string[],
    "missingKeywords": string[],
    "recommendations": string[]
  }
}`;

    return this.chatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      {
        temperature: 0.3, // Lower temperature for more consistent analysis
        operation: 'analysis',
        ...options,
      }
    );
  }

  async generateResumeContent(
    section: 'summary' | 'experience' | 'skills' | 'achievements',
    context: {
      jobTitle?: string;
      industry?: string;
      experienceLevel?: string;
      existingContent?: string;
      jobDescription?: string;
    },
    options: { userId?: string; requestId?: string } = {}
  ) {
    const sectionPrompts = {
      summary: `professional summary that highlights career achievements and career goals`,
      experience: `compelling bullet points for work experience that demonstrate impact and results`,
      skills: `comprehensive skills section including technical and soft skills relevant to the target role`,
      achievements: `impressive achievements and awards that demonstrate excellence`,
    };

    const systemPrompt = `You are an expert resume writer and career coach specializing in creating compelling, ATS-optimized resumes.

Your task is to generate ${sectionPrompts[section]} for a professional resume.

Guidelines:
- Use strong action verbs
- Quantify achievements whenever possible
- Include relevant keywords for ATS
- Keep content professional and impactful
- Tailor to the specific job/industry when provided
- Focus on results and impact, not just responsibilities`;

    const userPrompt = `Generate ${sectionPrompts[section]} for the following context:

Job Title: ${context.jobTitle || 'Not specified'}
Industry: ${context.industry || 'Not specified'}
Experience Level: ${context.experienceLevel || 'Not specified'}
${context.existingContent ? `Existing Content: ${context.existingContent}` : ''}
${context.jobDescription ? `Job Description: ${context.jobDescription}` : ''}

Please provide 3-5 options that are professional, impactful, and ATS-optimized. Format as a JSON array of strings.`;

    return this.chatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      {
        temperature: 0.7,
        operation: 'generation',
        ...options,
      }
    );
  }

  async improveResumeSection(
    section: string,
    currentContent: string,
    targetRole?: string,
    options: { userId?: string; requestId?: string } = {}
  ) {
    const systemPrompt = `You are an expert resume writer and career coach. Your task is to improve the provided resume section to make it more impactful, ATS-optimized, and tailored to the target role.

Focus on:
- Using stronger action verbs
- Quantifying achievements and impact
- Including relevant keywords
- Improving clarity and conciseness
- Highlighting results over responsibilities`;

    const userPrompt = `Please improve this resume section:

${targetRole ? `Target Role: ${targetRole}` : ''}

Current Content:
${currentContent}

Please provide 3 improved versions that are more impactful and professional. Format as a JSON array of strings, where each string is an improved version of the content.`;

    return this.chatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      {
        temperature: 0.6,
        operation: 'generation',
        ...options,
      }
    );
  }

  async extractResumeData(resumeText: string, options: { userId?: string; requestId?: string } = {}) {
    const systemPrompt = `You are an expert resume parser. Extract structured information from the provided resume text.

Extract the following information if available:
- Personal information (name, email, phone, location)
- Work experience with dates, companies, and descriptions
- Education with degrees, institutions, and dates
- Skills (technical, soft, languages)
- Projects with descriptions and technologies
- Certifications with names and issuers
- Languages and proficiency levels

Return the data in JSON format following the resume schema structure. If information is not available, use null or empty arrays as appropriate.`;

    const userPrompt = `Extract structured resume data from the following text:

${resumeText}

Please format the response as valid JSON that can be parsed directly.`;

    return this.chatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      {
        temperature: 0.1, // Very low temperature for accurate parsing
        operation: 'analysis',
        maxTokens: 4000, // Allow more tokens for comprehensive parsing
        ...options,
      }
    );
  }

  // Utility methods

  async isHealthy(): Promise<boolean> {
    if (!this.isEnabled || !this.client) {
      return false;
    }

    try {
      // Simple test request
      await this.client.chat.completions.create({
        model: resumeBuilderConfig.ai.openai!.models.fast,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5,
      });
      return true;
    } catch (error) {
      console.error('[OpenAIService] Health check failed:', error);
      return false;
    }
  }

  getTokenUsageStats(timeframe?: { start: Date; end: Date }) {
    let usage = this.tokenUsageHistory;

    if (timeframe) {
      usage = usage.filter(record =>
        record.timestamp >= timeframe.start && record.timestamp <= timeframe.end
      );
    }

    const stats = {
      totalRequests: usage.length,
      totalTokens: usage.reduce((sum, record) => sum + record.totalTokens, 0),
      totalCost: usage.reduce((sum, record) => sum + record.cost, 0),
      averageTokensPerRequest: usage.length > 0 ? usage.reduce((sum, record) => sum + record.totalTokens, 0) / usage.length : 0,
      usageByModel: {} as { [key: string]: { tokens: number; cost: number; requests: number } },
      usageByOperation: {} as { [key: string]: { tokens: number; cost: number; requests: number } },
    };

    usage.forEach(record => {
      // By model
      if (!stats.usageByModel[record.model]) {
        stats.usageByModel[record.model] = { tokens: 0, cost: 0, requests: 0 };
      }
      stats.usageByModel[record.model].tokens += record.totalTokens;
      stats.usageByModel[record.model].cost += record.cost;
      stats.usageByModel[record.model].requests += 1;

      // By operation
      if (!stats.usageByOperation[record.operation]) {
        stats.usageByOperation[record.operation] = { tokens: 0, cost: 0, requests: 0 };
      }
      stats.usageByOperation[record.operation].tokens += record.totalTokens;
      stats.usageByOperation[record.operation].cost += record.cost;
      stats.usageByOperation[record.operation].requests += 1;
    });

    return stats;
  }

  getUsageLimits() {
    const config = resumeBuilderConfig.ai.openai!;
    return {
      maxRequestsPerMinute: config.rateLimit.requests,
      analysisRateLimit: 20,
      generationRateLimit: 10,
      supportedModels: Object.keys(config.models),
      maxTokens: 4096, // Conservative limit
    };
  }
}

// Export singleton instance
export const openAIService = new OpenAIService();

// Export error-wrapped methods for use in routes
export const wrappedOpenAIService = {
  chatCompletion: withServiceErrorHandling(openAIService.chatCompletion.bind(openAIService), 'chatCompletion'),
  analyzeResume: withServiceErrorHandling(openAIService.analyzeResume.bind(openAIService), 'analyzeResume'),
  generateResumeContent: withServiceErrorHandling(openAIService.generateResumeContent.bind(openAIService), 'generateResumeContent'),
  improveResumeSection: withServiceErrorHandling(openAIService.improveResumeSection.bind(openAIService), 'improveResumeSection'),
  extractResumeData: withServiceErrorHandling(openAIService.extractResumeData.bind(openAIService), 'extractResumeData'),
};