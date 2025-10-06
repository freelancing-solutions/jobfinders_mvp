import { OpenAI } from 'openai';
import { z } from 'zod';
import { ResumeData, Suggestion, SuggestionType, SuggestionCategory } from '@/types/resume';

// Suggestion request schema
const SuggestionRequestSchema = z.object({
  resumeData: z.any(),
  targetJobTitle: z.string().optional(),
  targetIndustry: z.string().optional(),
  section: z.enum(['personal', 'experience', 'education', 'skills', 'summary', 'all']).default('all'),
  focus: z.enum(['ats', 'content', 'formatting', 'keywords']).default('content'),
});

// Suggestion response schema
const SuggestionResponseSchema = z.object({
  suggestions: z.array(z.object({
    id: z.string(),
    type: z.enum(['improvement', 'addition', 'removal', 'restructuring']),
    category: z.enum(['ats', 'content', 'formatting', 'keywords', 'impact']),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    title: z.string(),
    description: z.string(),
    section: z.string(),
    field: z.string().optional(),
    currentValue: z.string().optional(),
    suggestedValue: z.string().optional(),
    reasoning: z.string(),
    impact: z.number(), // 0-100 score improvement
    action: z.enum(['add', 'edit', 'remove', 'reorder']),
    examples: z.array(z.string()).optional(),
  })),
  score: z.number(),
  analysis: z.object({
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    recommendations: z.array(z.string()),
  }),
});

export type SuggestionRequest = z.infer<typeof SuggestionRequestSchema>;
export type SuggestionResponse = z.infer<typeof SuggestionResponseSchema>;

export class SuggestionEngine {
  private openai: OpenAI;
  private cache: Map<string, { data: SuggestionResponse; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Generate real-time suggestions for resume improvements
   */
  async generateSuggestions(request: SuggestionRequest): Promise<SuggestionResponse> {
    try {
      // Validate request
      const validatedRequest = SuggestionRequestSchema.parse(request);

      // Check cache first
      const cacheKey = this.generateCacheKey(validatedRequest);
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // Generate suggestions using AI
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: this.buildSystemPrompt(validatedRequest),
          },
          {
            role: "user",
            content: this.buildUserPrompt(validatedRequest),
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      });

      const suggestionsData = JSON.parse(response.choices[0].message.content || '{}');

      // Validate and parse response
      const validatedResponse = SuggestionResponseSchema.parse(suggestionsData);

      // Cache the result
      this.setCache(cacheKey, validatedResponse);

      return validatedResponse;
    } catch (error) {
      console.error('Error generating suggestions:', error);
      throw new Error('Failed to generate suggestions');
    }
  }

  /**
   * Generate context-aware suggestions based on current editing context
   */
  async generateContextualSuggestions(
    resumeData: ResumeData,
    currentField: string,
    currentValue: string,
    context: {
      targetJobTitle?: string;
      industry?: string;
      experience?: string;
    }
  ): Promise<Suggestion[]> {
    try {
      const prompt = `
        Analyze the following resume field and provide specific, actionable suggestions:

        Field: ${currentField}
        Current Value: "${currentValue}"
        Target Job: ${context.targetJobTitle || 'Not specified'}
        Industry: ${context.industry || 'Not specified'}
        Experience Level: ${context.experience || 'Not specified'}

        Provide 3-5 specific suggestions for this field. Focus on:
        1. ATS optimization
        2. Impact and achievement language
        3. Industry-specific keywords
        4. Clarity and professionalism

        Return suggestions in JSON format with this structure:
        {
          "suggestions": [
            {
              "id": "unique_id",
              "type": "improvement|addition|restructuring",
              "title": "Brief title",
              "description": "Detailed explanation",
              "suggestedValue": "Exact text to use",
              "reasoning": "Why this helps",
              "impact": 85
            }
          ]
        }
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 800,
        response_format: { type: "json_object" },
      });

      const data = JSON.parse(response.choices[0].message.content || '{}');
      return data.suggestions || [];
    } catch (error) {
      console.error('Error generating contextual suggestions:', error);
      return [];
    }
  }

  /**
   * Analyze keywords and suggest improvements
   */
  async analyzeKeywords(
    resumeText: string,
    jobDescription?: string,
    industry?: string
  ): Promise<{
    missingKeywords: string[];
    overusedKeywords: string[];
    suggestedKeywords: string[];
    keywordDensity: Record<string, number>;
  }> {
    try {
      const prompt = `
        Analyze the following resume text for keyword optimization:

        Resume Text: "${resumeText}"
        ${jobDescription ? `Job Description: "${jobDescription}"` : ''}
        ${industry ? `Industry: ${industry}` : ''}

        Analyze and return:
        1. Important keywords missing from the resume
        2. Keywords that are overused
        3. Suggested keywords to add
        4. Current keyword density analysis

        Return as JSON with this structure:
        {
          "missingKeywords": ["keyword1", "keyword2"],
          "overusedKeywords": ["keyword1", "keyword2"],
          "suggestedKeywords": ["keyword1", "keyword2"],
          "keywordDensity": {"keyword": 0.05}
        }
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: "json_object" },
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Error analyzing keywords:', error);
      return {
        missingKeywords: [],
        overusedKeywords: [],
        suggestedKeywords: [],
        keywordDensity: {},
      };
    }
  }

  /**
   * Check grammar and spelling in real-time
   */
  async checkGrammar(text: string): Promise<{
    errors: Array<{
      type: 'grammar' | 'spelling' | 'punctuation';
      message: string;
      position: number;
      length: number;
      suggestion: string;
    }>;
    correctedText: string;
    score: number;
  }> {
    try {
      const prompt = `
        Check the following text for grammar, spelling, and punctuation errors:

        Text: "${text}"

        Return JSON with:
        {
          "errors": [
            {
              "type": "grammar|spelling|punctuation",
              "message": "Description of the error",
              "position": 0,
              "length": 5,
              "suggestion": "corrected text"
            }
          ],
          "correctedText": "Fully corrected text",
          "score": 95
        }
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 500,
        response_format: { type: "json_object" },
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Error checking grammar:', error);
      return {
        errors: [],
        correctedText: text,
        score: 100,
      };
    }
  }

  private buildSystemPrompt(request: SuggestionRequest): string {
    const focusPrompts = {
      ats: 'Focus on ATS optimization, keyword matching, and formatting that passes automated screenings.',
      content: 'Focus on content quality, achievement language, and professional presentation.',
      formatting: 'Focus on layout, structure, and visual presentation.',
      keywords: 'Focus on keyword density, industry terms, and search optimization.',
    };

    return `
      You are an expert resume coach and ATS specialist. Your task is to analyze resumes and provide specific, actionable suggestions.

      ${focusPrompts[request.focus]}

      Analyze the provided resume and return suggestions in this JSON format:
      {
        "suggestions": [
          {
            "id": "unique_id",
            "type": "improvement|addition|removal|restructuring",
            "category": "ats|content|formatting|keywords|impact",
            "priority": "low|medium|high|critical",
            "title": "Brief, actionable title",
            "description": "Detailed explanation of the suggestion",
            "section": "resume_section_name",
            "field": "specific_field_name",
            "currentValue": "current text",
            "suggestedValue": "suggested text",
            "reasoning": "Why this change helps",
            "impact": 85,
            "action": "add|edit|remove|reorder",
            "examples": ["example1", "example2"]
          }
        ],
        "score": 75,
        "analysis": {
          "strengths": ["strength1", "strength2"],
          "weaknesses": ["weakness1", "weakness2"],
          "recommendations": ["rec1", "rec2"]
        }
      }

      Focus on high-impact, specific suggestions that will measurably improve the resume's effectiveness.
    `;
  }

  private buildUserPrompt(request: SuggestionRequest): string {
    const targetInfo = `
      Target Job Title: ${request.targetJobTitle || 'Not specified'}
      Target Industry: ${request.targetIndustry || 'Not specified'}
      Focus Section: ${request.section}
    `;

    return `
      Analyze this resume for improvements:

      ${targetInfo}

      Resume Data:
      ${JSON.stringify(request.resumeData, null, 2)}

      Provide specific, actionable suggestions for improvement.
    `;
  }

  private generateCacheKey(request: SuggestionRequest): string {
    return `${JSON.stringify(request)}-${request.targetJobTitle || ''}-${request.targetIndustry || ''}`;
  }

  private getFromCache(key: string): SuggestionResponse | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: SuggestionResponse): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear cache for a specific request
   */
  clearCache(request: SuggestionRequest): void {
    const key = this.generateCacheKey(request);
    this.cache.delete(key);
  }

  /**
   * Clear all cached suggestions
   */
  clearAllCache(): void {
    this.cache.clear();
  }
}

// Singleton instance
export const suggestionEngine = new SuggestionEngine();