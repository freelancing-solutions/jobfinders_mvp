'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { debounce } from 'lodash';
import { ResumeData, Suggestion } from '@/types/resume';
import { suggestionEngine, SuggestionRequest } from '@/services/resume-builder/suggestion-engine';

interface UseRealTimeSuggestionsOptions {
  debounceMs?: number;
  enabled?: boolean;
  targetJobTitle?: string;
  targetIndustry?: string;
}

interface SuggestionState {
  suggestions: Suggestion[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

interface ContextualSuggestionState {
  suggestions: Suggestion[];
  loading: boolean;
  error: string | null;
}

interface GrammarCheckState {
  errors: Array<{
    type: 'grammar' | 'spelling' | 'punctuation';
    message: string;
    position: number;
    length: number;
    suggestion: string;
  }>;
  correctedText: string;
  score: number;
  loading: boolean;
  error: string | null;
}

export function useRealTimeSuggestions(options: UseRealTimeSuggestionsOptions = {}) {
  const {
    debounceMs = 1000,
    enabled = true,
    targetJobTitle,
    targetIndustry,
  } = options;

  const [suggestionState, setSuggestionState] = useState<SuggestionState>({
    suggestions: [],
    loading: false,
    error: null,
    lastUpdated: null,
  });

  const [contextualSuggestions, setContextualSuggestions] = useState<ContextualSuggestionState>({
    suggestions: [],
    loading: false,
    error: null,
  });

  const [grammarCheck, setGrammarCheck] = useState<GrammarCheckState>({
    errors: [],
    correctedText: '',
    score: 100,
    loading: false,
    error: null,
  });

  const [currentField, setCurrentField] = useState<string>('');
  const [currentValue, setCurrentValue] = useState<string>('');

  const abortControllerRef = useRef<AbortController | null>(null);

  // Generate suggestions for entire resume
  const generateSuggestions = useCallback(
    debounce(async (resumeData: ResumeData, section?: string) => {
      if (!enabled || !resumeData) return;

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      setSuggestionState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const request: SuggestionRequest = {
          resumeData,
          targetJobTitle,
          targetIndustry,
          section: section || 'all',
          focus: 'content',
        };

        const response = await suggestionEngine.generateSuggestions(request);

        if (!abortControllerRef.current?.signal.aborted) {
          setSuggestionState({
            suggestions: response.suggestions.map(s => ({
              id: s.id,
              type: s.type,
              category: s.category,
              priority: s.priority,
              title: s.title,
              description: s.description,
              section: s.section,
              field: s.field,
              currentValue: s.currentValue,
              suggestedValue: s.suggestedValue,
              reasoning: s.reasoning,
              impact: s.impact,
              action: s.action,
              examples: s.examples || [],
            })),
            loading: false,
            error: null,
            lastUpdated: new Date(),
          });
        }
      } catch (error) {
        if (!abortControllerRef.current?.signal.aborted) {
          console.error('Error generating suggestions:', error);
          setSuggestionState(prev => ({
            ...prev,
            loading: false,
            error: 'Failed to generate suggestions',
          }));
        }
      }
    }, debounceMs),
    [enabled, targetJobTitle, targetIndustry, debounceMs]
  );

  // Generate contextual suggestions for specific field
  const generateContextualSuggestions = useCallback(
    debounce(async (
      field: string,
      value: string,
      context: {
        targetJobTitle?: string;
        industry?: string;
        experience?: string;
      } = {}
    ) => {
      if (!enabled || !value.trim()) {
        setContextualSuggestions({ suggestions: [], loading: false, error: null });
        return;
      }

      setCurrentField(field);
      setCurrentValue(value);

      setContextualSuggestions(prev => ({ ...prev, loading: true, error: null }));

      try {
        const suggestions = await suggestionEngine.generateContextualSuggestions(
          {} as ResumeData, // We'll need the full resume data here
          field,
          value,
          {
            targetJobTitle: context.targetJobTitle || targetJobTitle,
            industry: context.industry || targetIndustry,
            experience: context.experience,
          }
        );

        setContextualSuggestions({
          suggestions: suggestions.map(s => ({
            id: s.id,
            type: s.type,
            category: 'content',
            priority: 'medium',
            title: s.title,
            description: s.description,
            section: field,
            field: field,
            currentValue: value,
            suggestedValue: s.suggestedValue,
            reasoning: s.reasoning,
            impact: s.impact,
            action: 'edit',
            examples: [],
          })),
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error('Error generating contextual suggestions:', error);
        setContextualSuggestions(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to generate suggestions',
        }));
      }
    }, 500),
    [enabled, targetJobTitle, targetIndustry]
  );

  // Check grammar in real-time
  const checkGrammar = useCallback(
    debounce(async (text: string) => {
      if (!enabled || !text.trim()) {
        setGrammarCheck({
          errors: [],
          correctedText: '',
          score: 100,
          loading: false,
          error: null,
        });
        return;
      }

      setGrammarCheck(prev => ({ ...prev, loading: true, error: null }));

      try {
        const result = await suggestionEngine.checkGrammar(text);

        setGrammarCheck({
          errors: result.errors,
          correctedText: result.correctedText,
          score: result.score,
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error('Error checking grammar:', error);
        setGrammarCheck(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to check grammar',
        }));
      }
    }, 800),
    [enabled]
  );

  // Analyze keywords
  const analyzeKeywords = useCallback(async (
    resumeText: string,
    jobDescription?: string,
    industry?: string
  ) => {
    if (!enabled || !resumeText.trim()) return null;

    try {
      return await suggestionEngine.analyzeKeywords(
        resumeText,
        jobDescription,
        industry || targetIndustry
      );
    } catch (error) {
      console.error('Error analyzing keywords:', error);
      return null;
    }
  }, [enabled, targetIndustry]);

  // Accept suggestion
  const acceptSuggestion = useCallback((suggestionId: string) => {
    setSuggestionState(prev => ({
      ...prev,
      suggestions: prev.suggestions.filter(s => s.id !== suggestionId),
    }));
  }, []);

  // Reject suggestion
  const rejectSuggestion = useCallback((suggestionId: string) => {
    setSuggestionState(prev => ({
      ...prev,
      suggestions: prev.suggestions.filter(s => s.id !== suggestionId),
    }));
  }, []);

  // Dismiss contextual suggestion
  const dismissContextualSuggestion = useCallback((suggestionId: string) => {
    setContextualSuggestions(prev => ({
      ...prev,
      suggestions: prev.suggestions.filter(s => s.id !== suggestionId),
    }));
  }, []);

  // Clear all suggestions
  const clearSuggestions = useCallback(() => {
    setSuggestionState({
      suggestions: [],
      loading: false,
      error: null,
      lastUpdated: null,
    });
    setContextualSuggestions({
      suggestions: [],
      loading: false,
      error: null,
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // Global suggestions
    suggestions: suggestionState.suggestions,
    loading: suggestionState.loading,
    error: suggestionState.error,
    lastUpdated: suggestionState.lastUpdated,
    generateSuggestions,

    // Contextual suggestions
    contextualSuggestions: contextualSuggestions.suggestions,
    contextualLoading: contextualSuggestions.loading,
    contextualError: contextualSuggestions.error,
    currentField,
    currentValue,
    generateContextualSuggestions,
    dismissContextualSuggestion,

    // Grammar check
    grammarErrors: grammarCheck.errors,
    correctedText: grammarCheck.correctedText,
    grammarScore: grammarCheck.score,
    grammarLoading: grammarCheck.loading,
    grammarError: grammarCheck.error,
    checkGrammar,

    // Keywords analysis
    analyzeKeywords,

    // Actions
    acceptSuggestion,
    rejectSuggestion,
    clearSuggestions,
  };
}

export type UseRealTimeSuggestionsReturn = ReturnType<typeof useRealTimeSuggestions>;