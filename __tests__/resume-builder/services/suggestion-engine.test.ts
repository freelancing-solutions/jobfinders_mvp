import { suggestionEngine, SuggestionRequest } from '@/services/resume-builder/suggestion-engine';

// Mock OpenAI
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  })),
}));

describe('SuggestionEngine', () => {
  const mockResumeData = {
    personal: {
      professionalTitle: 'Software Engineer',
      summary: 'Experienced software developer with expertise in web technologies.',
      location: 'San Francisco, CA',
      phone: '+1 (555) 123-4567',
      email: 'john@example.com',
    },
    experience: [
      {
        company: 'Tech Corp',
        position: 'Senior Software Engineer',
        startDate: '2020-01-01',
        endDate: '2023-12-31',
        isCurrent: false,
        description: 'Developed web applications using React and Node.js.',
      },
    ],
    education: [
      {
        institution: 'University of Technology',
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        startDate: '2016-09-01',
        endDate: '2020-05-31',
        isCurrent: false,
      },
    ],
    skills: ['JavaScript', 'React', 'Node.js', 'TypeScript'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateSuggestions', () => {
    it('should generate suggestions for resume improvement', async () => {
      const mockOpenAI = require('openai').OpenAI;
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                suggestions: [
                  {
                    id: 'suggestion-1',
                    type: 'improvement',
                    category: 'content',
                    priority: 'high',
                    title: 'Add quantifiable achievements',
                    description: 'Include specific metrics and achievements in your experience descriptions.',
                    section: 'experience',
                    field: 'description',
                    currentValue: 'Developed web applications using React and Node.js.',
                    suggestedValue: 'Developed 5+ web applications using React and Node.js, improving user engagement by 30%.',
                    reasoning: 'Quantifiable achievements help recruiters understand your impact.',
                    impact: 85,
                    action: 'edit',
                    examples: ['Increased performance by 40%', 'Reduced load time by 50%'],
                  },
                ],
                score: 75,
                analysis: {
                  strengths: ['Good technical skills listed'],
                  weaknesses: ['Lacks quantifiable achievements'],
                  recommendations: ['Add specific metrics'],
                },
              }),
            },
          },
        ],
      });

      mockOpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      }));

      const request: SuggestionRequest = {
        resumeData: mockResumeData,
        targetJobTitle: 'Senior Software Engineer',
        targetIndustry: 'Technology',
        section: 'experience',
        focus: 'content',
      };

      const result = await suggestionEngine.generateSuggestions(request);

      expect(result).toBeDefined();
      expect(result.suggestions).toHaveLength(1);
      expect(result.suggestions[0].title).toBe('Add quantifiable achievements');
      expect(result.score).toBe(75);
      expect(mockCreate).toHaveBeenCalledWith({
        model: 'gpt-4',
        messages: expect.any(Array),
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      });
    });

    it('should cache suggestions for identical requests', async () => {
      const mockOpenAI = require('openai').OpenAI;
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                suggestions: [],
                score: 80,
                analysis: { strengths: [], weaknesses: [], recommendations: [] },
              }),
            },
          },
        ],
      });

      mockOpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      }));

      const request: SuggestionRequest = {
        resumeData: mockResumeData,
        section: 'all',
        focus: 'content',
      };

      // First call
      await suggestionEngine.generateSuggestions(request);
      // Second call (should use cache)
      await suggestionEngine.generateSuggestions(request);

      // Should only call OpenAI once
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('should handle API errors gracefully', async () => {
      const mockOpenAI = require('openai').OpenAI;
      const mockCreate = jest.fn().mockRejectedValue(new Error('API Error'));

      mockOpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      }));

      const request: SuggestionRequest = {
        resumeData: mockResumeData,
        section: 'all',
        focus: 'content',
      };

      await expect(suggestionEngine.generateSuggestions(request)).rejects.toThrow('Failed to generate suggestions');
    });
  });

  describe('generateContextualSuggestions', () => {
    it('should generate contextual suggestions for specific field', async () => {
      const mockOpenAI = require('openai').OpenAI;
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                suggestions: [
                  {
                    id: 'contextual-1',
                    type: 'improvement',
                    title: 'Add action verbs',
                    description: 'Start your description with strong action verbs.',
                    suggestedValue: 'Led development of web applications...',
                    reasoning: 'Action verbs make your experience more impactful.',
                    impact: 75,
                  },
                ],
              }),
            },
          },
        ],
      });

      mockOpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      }));

      const suggestions = await suggestionEngine.generateContextualSuggestions(
        mockResumeData,
        'experience.description',
        'Developed web applications using React and Node.js.',
        {
          targetJobTitle: 'Senior Software Engineer',
          industry: 'Technology',
        }
      );

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].title).toBe('Add action verbs');
      expect(mockCreate).toHaveBeenCalledWith({
        model: 'gpt-4',
        messages: expect.any(Array),
        temperature: 0.7,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      });
    });

    it('should return empty array for empty text', async () => {
      const suggestions = await suggestionEngine.generateContextualSuggestions(
        mockResumeData,
        'experience.description',
        '',
        {}
      );

      expect(suggestions).toEqual([]);
    });
  });

  describe('analyzeKeywords', () => {
    it('should analyze keywords in resume text', async () => {
      const mockOpenAI = require('openai').OpenAI;
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                missingKeywords: ['agile', 'scrum', 'ci/cd'],
                overusedKeywords: ['developed', 'application'],
                suggestedKeywords: ['microservices', 'kubernetes', 'aws'],
                keywordDensity: {
                  'react': 0.05,
                  'javascript': 0.08,
                  'node.js': 0.03,
                },
              }),
            },
          },
        ],
      });

      mockOpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      }));

      const resumeText = 'Experienced software developer with React and Node.js expertise.';
      const jobDescription = 'Looking for a senior developer with React, Node.js, and AWS experience.';
      const industry = 'Technology';

      const result = await suggestionEngine.analyzeKeywords(resumeText, jobDescription, industry);

      expect(result.missingKeywords).toContain('aws');
      expect(result.suggestedKeywords).toContain('kubernetes');
      expect(result.keywordDensity).toHaveProperty('react');
      expect(mockCreate).toHaveBeenCalledWith({
        model: 'gpt-4',
        messages: expect.any(Array),
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      });
    });

    it('should handle API errors and return default structure', async () => {
      const mockOpenAI = require('openai').OpenAI;
      const mockCreate = jest.fn().mockRejectedValue(new Error('API Error'));

      mockOpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      }));

      const result = await suggestionEngine.analyzeKeywords('Sample text');

      expect(result).toEqual({
        missingKeywords: [],
        overusedKeywords: [],
        suggestedKeywords: [],
        keywordDensity: {},
      });
    });
  });

  describe('checkGrammar', () => {
    it('should check grammar and spelling', async () => {
      const mockOpenAI = require('openai').OpenAI;
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                errors: [
                  {
                    type: 'spelling',
                    message: 'Possible spelling mistake',
                    position: 10,
                    length: 8,
                    suggestion: 'development',
                  },
                ],
                correctedText: 'Experienced software developer with React development expertise.',
                score: 95,
              }),
            },
          },
        ],
      });

      mockOpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      }));

      const text = 'Experienced software developer with React developement expertise.';
      const result = await suggestionEngine.checkGrammar(text);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('spelling');
      expect(result.correctedText).toContain('development');
      expect(result.score).toBe(95);
    });

    it('should return original text for perfect grammar', async () => {
      const mockOpenAI = require('openai').OpenAI;
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                errors: [],
                correctedText: 'Perfect grammar text.',
                score: 100,
              }),
            },
          },
        ],
      });

      mockOpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      }));

      const text = 'Perfect grammar text.';
      const result = await suggestionEngine.checkGrammar(text);

      expect(result.errors).toHaveLength(0);
      expect(result.score).toBe(100);
    });
  });

  describe('cache management', () => {
    it('should clear cache for specific request', async () => {
      const request: SuggestionRequest = {
        resumeData: mockResumeData,
        section: 'all',
        focus: 'content',
      };

      // Generate suggestions to populate cache
      const mockOpenAI = require('openai').OpenAI;
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                suggestions: [],
                score: 80,
                analysis: { strengths: [], weaknesses: [], recommendations: [] },
              }),
            },
          },
        ],
      });

      mockOpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      }));

      await suggestionEngine.generateSuggestions(request);

      // Clear cache
      suggestionEngine.clearCache(request);

      // Generate suggestions again (should call API again)
      await suggestionEngine.generateSuggestions(request);

      expect(mockCreate).toHaveBeenCalledTimes(2);
    });

    it('should clear all cache', () => {
      suggestionEngine.clearAllCache();
      // This is a simple test to ensure the method exists and doesn't throw
      expect(true).toBe(true);
    });
  });
});