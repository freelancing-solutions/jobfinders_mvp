/**
 * React hooks for ATS optimization functionality
 * Provides state management and methods for ATS optimization
 */

import { useState, useCallback, useEffect } from 'react';
import { ATSOptimizationEngine, ATSOptimizationRequest, ATSOptimizationResult } from '@/services/template-engine/ats/ats-optimization-engine';
import { KeywordAnalyzer, KeywordAnalysisRequest, KeywordAnalysisResult } from '@/services/template-engine/ats/keyword-analyzer';
import { ResumeTemplate, TemplateCustomization } from '@/types/template';

interface UseATSOptimizationOptions {
  template: ResumeTemplate;
  customization: TemplateCustomization;
  content: any;
  jobDescription?: string;
  targetKeywords?: string[];
  industry?: string;
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'executive';
  onOptimizationComplete?: (result: ATSOptimizationResult) => void;
  onError?: (error: Error) => void;
}

interface ATSOptimizationState {
  isOptimizing: boolean;
  optimizationResult: ATSOptimizationResult | null;
  keywordAnalysis: KeywordAnalysisResult | null;
  quickScore: {
    score: number;
    criticalIssues: string[];
    quickFixes: string[];
  } | null;
  isValidating: boolean;
  validation: {
    compatible: boolean;
    score: number;
    blockingIssues: string[];
    warnings: string[];
  } | null;
}

export function useATSOptimization({
  template,
  customization,
  content,
  jobDescription,
  targetKeywords,
  industry,
  experienceLevel,
  onOptimizationComplete,
  onError
}: UseATSOptimizationOptions) {
  const [state, setState] = useState<ATSOptimizationState>({
    isOptimizing: false,
    optimizationResult: null,
    keywordAnalysis: null,
    quickScore: null,
    isValidating: false,
    validation: null
  });

  // Perform comprehensive ATS optimization
  const optimizeForATS = useCallback(async (options?: {
    strictMode?: boolean;
    includeKeywords?: boolean;
    includeSemantic?: boolean;
  }) => {
    setState(prev => ({ ...prev, isOptimizing: true }));

    try {
      const request: ATSOptimizationRequest = {
        template,
        customization,
        content,
        jobDescription,
        targetKeywords,
        strictMode: options?.strictMode || false
      };

      const result = await ATSOptimizationEngine.optimizeForATS(request);

      setState(prev => ({
        ...prev,
        isOptimizing: false,
        optimizationResult: result
      }));

      if (onOptimizationComplete) {
        onOptimizationComplete(result);
      }

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('ATS optimization failed');

      setState(prev => ({
        ...prev,
        isOptimizing: false
      }));

      if (onError) {
        onError(err);
      }

      throw err;
    }
  }, [template, customization, content, jobDescription, targetKeywords, onOptimizationComplete, onError]);

  // Quick ATS score check
  const quickATSCheck = useCallback(() => {
    const result = ATSOptimizationEngine.quickATSCheck(template, customization, content);

    setState(prev => ({
      ...prev,
      quickScore: result
    }));

    return result;
  }, [template, customization, content]);

  // Validate ATS compatibility
  const validateATSCompatibility = useCallback(() => {
    setState(prev => ({ ...prev, isValidating: true }));

    try {
      const result = ATSOptimizationEngine.validateATSCompatibility(template, customization);

      setState(prev => ({
        ...prev,
        isValidating: false,
        validation: result
      }));

      return result;
    } catch (error) {
      setState(prev => ({ ...prev, isValidating: false }));
      throw error;
    }
  }, [template, customization]);

  // Analyze keywords
  const analyzeKeywords = useCallback(async () => {
    try {
      const request: KeywordAnalysisRequest = {
        resumeContent: content,
        jobDescription,
        targetKeywords,
        industry,
        experienceLevel
      };

      const result = await KeywordAnalyzer.analyzeKeywords(request);

      setState(prev => ({
        ...prev,
        keywordAnalysis: result
      }));

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Keyword analysis failed');

      if (onError) {
        onError(err);
      }

      throw err;
    }
  }, [content, jobDescription, targetKeywords, industry, experienceLevel, onError]);

  // Quick keyword match
  const quickKeywordMatch = useCallback((keywords: string[]) => {
    return KeywordAnalyzer.quickKeywordMatch(content, keywords);
  }, [content]);

  // Extract job keywords
  const extractJobKeywords = useCallback((jobDesc: string) => {
    return KeywordAnalyzer.extractJobKeywords(jobDesc);
  }, []);

  // Get ATS section suggestions
  const getATSSectionSuggestions = useCallback(() => {
    return ATSOptimizationEngine.getATSSectionSuggestions(content);
  }, [content]);

  // Analyze keyword optimization
  const analyzeKeywordOptimization = useCallback((keywords: string[]) => {
    return KeywordAnalyzer.analyzeKeywordOptimization(content, keywords);
  }, [content]);

  // Get optimization suggestions
  const getOptimizationSuggestions = useCallback((keywords: string[]) => {
    return KeywordAnalyzer.getOptimizationSuggestions(content, keywords);
  }, [content]);

  // Apply optimizations
  const applyOptimizations = useCallback((result: ATSOptimizationResult) => {
    // In a real implementation, this would update the content/state
    console.log('Applied optimizations:', result.recommendations);

    // Trigger re-optimization to see improvements
    quickATSCheck();
  }, [quickATSCheck]);

  // Reset state
  const reset = useCallback(() => {
    setState({
      isOptimizing: false,
      optimizationResult: null,
      keywordAnalysis: null,
      quickScore: null,
      isValidating: false,
      validation: null
    });
  }, []);

  // Initialize with quick check
  useEffect(() => {
    quickATSCheck();
    validateATSCompatibility();
  }, [quickATSCheck, validateATSCompatibility]);

  return {
    // State
    isOptimizing: state.isOptimizing,
    optimizationResult: state.optimizationResult,
    keywordAnalysis: state.keywordAnalysis,
    quickScore: state.quickScore,
    isValidating: state.isValidating,
    validation: state.validation,

    // Methods
    optimizeForATS,
    quickATSCheck,
    validateATSCompatibility,
    analyzeKeywords,
    quickKeywordMatch,
    extractJobKeywords,
    getATSSectionSuggestions,
    analyzeKeywordOptimization,
    getOptimizationSuggestions,
    applyOptimizations,
    reset
  };
}

// Specialized hooks
export function useKeywordAnalysis(content: any, options?: {
  jobDescription?: string;
  targetKeywords?: string[];
  industry?: string;
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'executive';
}) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<KeywordAnalysisResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const analyze = useCallback(async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const request: KeywordAnalysisRequest = {
        resumeContent: content,
        ...options
      };

      const analysisResult = await KeywordAnalyzer.analyzeKeywords(request);
      setResult(analysisResult);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Analysis failed'));
    } finally {
      setIsAnalyzing(false);
    }
  }, [content, options]);

  useEffect(() => {
    if (content) {
      analyze();
    }
  }, [analyze]);

  return {
    isAnalyzing,
    result,
    error,
    analyze,
    reset: () => {
      setResult(null);
      setError(null);
    }
  };
}

export function useATSScore(
  template: ResumeTemplate,
  customization: TemplateCustomization,
  content: any
) {
  const [score, setScore] = useState<number | null>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);

  const calculateScore = useCallback(() => {
    const quickResult = ATSOptimizationEngine.quickATSCheck(template, customization, content);
    setScore(quickResult.score);
    setIsValid(quickResult.criticalIssues.length === 0);
  }, [template, customization, content]);

  useEffect(() => {
    calculateScore();
  }, [calculateScore]);

  return {
    score,
    isValid,
    refreshScore: calculateScore
  };
}

export function useJobKeywordMatcher(jobDescription: string) {
  const [keywords, setKeywords] = useState<{
    skills: string[];
    qualifications: string[];
    responsibilities: string[];
    experience: string[];
    tools: string[];
  } | null>(null);

  useEffect(() => {
    const extracted = KeywordAnalyzer.extractJobKeywords(jobDescription);
    setKeywords(extracted);
  }, [jobDescription]);

  const matchWithResume = useCallback((resumeContent: any) => {
    if (!keywords) return null;

    const allKeywords = [
      ...keywords.skills,
      ...keywords.qualifications,
      ...keywords.responsibilities,
      ...keywords.experience,
      ...keywords.tools
    ];

    return KeywordAnalyzer.quickKeywordMatch(resumeContent, allKeywords);
  }, [keywords]);

  return {
    keywords,
    matchWithResume,
    extractKeywords: (jd: string) => KeywordAnalyzer.extractJobKeywords(jd)
  };
}

export function useATSOptimizationTips() {
  const [tips, setTips] = useState<Array<{
    category: string;
    title: string;
    description: string;
    action: string;
    impact: number;
  }>>([]);

  const generateTips = useCallback((
    template: ResumeTemplate,
    customization: TemplateCustomization,
    content: any
  ) => {
    const quickResult = ATSOptimizationEngine.quickATSCheck(template, customization, content);

    const generatedTips = quickResult.quickFixes.map((fix, index) => ({
      category: 'general',
      title: `Quick Fix ${index + 1}`,
      description: fix,
      action: fix,
      impact: 7
    }));

    if (quickResult.criticalIssues.length > 0) {
      generatedTips.unshift({
        category: 'critical',
        title: 'Critical Issues',
        description: 'Address critical ATS compatibility issues',
        action: quickResult.criticalIssues.join('; '),
        impact: 10
      });
    }

    setTips(generatedTips);
    return generatedTips;
  }, []);

  return {
    tips,
    generateTips,
    reset: () => setTips([])
  };
}