/**
 * useTemplateRenderer Hook
 *
 * Custom React hook for template rendering with caching, error handling,
 * performance monitoring, and real-time preview capabilities.
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { ResumeTemplate, Resume, RenderedTemplate, RenderingPipelineOptions, TemplateError, TemplateErrorCode } from '@/types/template';
import { renderingPipeline } from '@/services/template-engine/rendering-pipeline';
import { templateEngine } from '@/services/template-engine';
import { logger } from '@/lib/logger';

interface UseTemplateRendererOptions {
  enableCache?: boolean;
  enablePreload?: boolean;
  timeout?: number;
  retryAttempts?: number;
  enableMetrics?: boolean;
}

interface UseTemplateRendererState {
  rendered: RenderedTemplate | null;
  isLoading: boolean;
  isRendering: boolean;
  error: Error | null;
  metrics: RenderingMetrics;
  cache: Map<string, RenderedTemplate>;
}

interface RenderingMetrics {
  renderCount: number;
  totalRenderingTime: number;
  averageRenderingTime: number;
  errorCount: number;
  cacheHits: number;
  lastRenderTime: Date | null;
  performance: {
    dataBindingTime: number;
    contentProcessingTime: number;
    stylingTime: number;
    optimizationTime: number;
    outputTime: number;
  };
}

interface RenderOptions extends RenderingPipelineOptions {
  templateId?: string;
  resumeId?: string;
  customizations?: any;
  mode?: 'preview' | 'print' | 'export';
  quality?: 'low' | 'medium' | 'high';
}

export const useTemplateRenderer = (options: UseTemplateRendererOptions = {}) => {
  const {
    enableCache = true,
    enablePreload = true,
    timeout = 10000,
    retryAttempts = 3,
    enableMetrics = true
  } = options;

  const [state, setState] = useState<UseTemplateRendererState>({
    rendered: null,
    isLoading: false,
    isRendering: false,
    error: null,
    metrics: {
      renderCount: 0,
      totalRenderingTime: 0,
      averageRenderingTime: 0,
      errorCount: 0,
      cacheHits: 0,
      lastRenderTime: null,
      performance: {
        dataBindingTime: 0,
        contentProcessingTime: 0,
        stylingTime: 0,
        optimizationTime: 0,
        outputTime: 0
      }
    },
    cache: new Map()
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef<number>(0);

  // Generate cache key
  const generateCacheKey = useCallback((
    templateId: string,
    resumeId: string,
    customizations?: any,
    renderOptions?: RenderOptions
  ) => {
    const keyData = {
      templateId,
      resumeId,
      customizations: customizations ? JSON.stringify(customizations) : '',
      options: renderOptions ? JSON.stringify(renderOptions) : '',
      version: '1.0' // Version for cache invalidation
    };

    return btoa(JSON.stringify(keyData));
  }, []);

  // Get cached template
  const getCachedTemplate = useCallback((
    templateId: string,
    resumeId: string,
    customizations?: any,
    renderOptions?: RenderOptions
  ) => {
    if (!enableCache) return null;

    const cacheKey = generateCacheKey(templateId, resumeId, customizations, renderOptions);
    const cached = state.cache.get(cacheKey);

    if (cached && isValidCache(cached)) {
      if (enableMetrics) {
        setState(prev => ({
          ...prev,
          metrics: {
            ...prev.metrics,
            cacheHits: prev.metrics.cacheHits + 1
          }
        }));
      }
      return cached;
    }

    return null;
  }, [enableCache, enableMetrics, generateCacheKey]);

  // Cache template
  const cacheTemplate = useCallback((
    templateId: string,
    resumeId: string,
    rendered: RenderedTemplate,
    customizations?: any,
    renderOptions?: RenderOptions
  ) => {
    if (!enableCache) return;

    const cacheKey = generateCacheKey(templateId, resumeId, customizations, renderOptions);
    state.cache.set(cacheKey, rendered);

    // Limit cache size
    if (state.cache.size > 20) {
      const oldestKey = state.cache.keys().next().value;
      if (oldestKey) {
        state.cache.delete(oldestKey);
      }
    }
  }, [enableCache, generateCacheKey]);

  // Update metrics
  const updateMetrics = useCallback((rendered: RenderedTemplate, startTime: number) => {
    if (!enableMetrics) return;

    const renderingTime = Date.now() - startTime;

    setState(prev => {
      const newRenderCount = prev.metrics.renderCount + 1;
      const newTotalTime = prev.metrics.totalRenderingTime + renderingTime;
      const newAverageTime = newTotalTime / newRenderCount;

      return {
        ...prev,
        metrics: {
          ...prev.metrics,
          renderCount: newRenderCount,
          totalRenderingTime: newTotalTime,
          averageRenderingTime: newAverageTime,
          lastRenderTime: new Date(),
          performance: {
            ...prev.metrics.performance,
            // Update from pipeline metrics if available
            ...rendered.metadata.renderingPerformance
          }
        }
      };
    });
  }, [enableMetrics]);

  // Main render function
  const renderTemplate = useCallback(async (
    templateId: string,
    resume: Resume,
    customizations?: any,
    renderOptions: RenderOptions = {}
  ): Promise<RenderedTemplate> => {
    // Cancel any existing render
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    retryCountRef.current = 0;

    // Check cache first
    const cached = getCachedTemplate(templateId, resume.id, customizations, renderOptions);
    if (cached) {
      logger.debug('Using cached template', { templateId, resumeId: resume.id });
      return cached;
    }

    // Get template from engine
    const template = await templateEngine.getTemplate(templateId);
    if (!template) {
      throw new TemplateError(
        `Template not found: ${templateId}`,
        TemplateErrorCode.TEMPLATE_NOT_FOUND,
        templateId
      );
    }

    // Configure render options
    const fullRenderOptions: RenderingPipelineOptions = {
      format: renderOptions.mode || 'preview',
      customizations: { ...customizations, ...renderOptions.customizations },
      optimization: {
        minify: renderOptions.mode === 'export' && renderOptions.quality === 'low',
        inlineCSS: renderOptions.mode === 'preview',
        embedImages: false,
        subsetFonts: true,
        lazyLoad: renderOptions.mode === 'preview',
        compress: renderOptions.mode === 'export'
      },
      performance: {
        timeout,
        enableProfiling: enableMetrics,
        enableCaching: enableCache,
        enableMetrics: enableMetrics
      },
      ...renderOptions
    };

    // Set loading state
    setState(prev => ({
      ...prev,
      isLoading: true,
      isRendering: true,
      error: null
    }));

    const renderWithRetry = async (): Promise<RenderedTemplate> => {
      try {
        const startTime = Date.now();
        const rendered = await renderingPipeline.render(template, resume, fullRenderOptions);

        // Check if render was aborted
        if (signal.aborted) {
          throw new Error('Rendering was aborted');
        }

        // Update cache and metrics
        cacheTemplate(templateId, resume.id, rendered, customizations, renderOptions);
        updateMetrics(rendered, startTime);

        setState(prev => ({
          ...prev,
          isLoading: false,
          isRendering: false,
          rendered
        }));

        logger.info('Template rendered successfully', {
          templateId,
          renderingTime: rendered.metadata.renderingTime,
          fromCache: false
        });

        return rendered;

      } catch (error) {
        if (signal.aborted) {
          throw new Error('Rendering was aborted');
        }

        const errorObj = error instanceof Error ? error : new Error('Unknown rendering error');

        if (retryCountRef.current < retryAttempts) {
          retryCountRef.current++;
          logger.warn(`Retrying template render (${retryCountRef.current}/${retryAttempts})`, {
            templateId,
            error: errorObj.message
          });

          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCountRef.current));
          return renderWithRetry();
        }

        // All retries exhausted
        throw errorObj;
      }
    };

    // Set render timeout
    if (timeout) {
      renderTimeoutRef.current = setTimeout(() => {
        abortControllerRef.current?.abort();
      }, timeout);
    }

    return renderWithRetry();
  }, [
    templateEngine,
    getCachedTemplate,
    cacheTemplate,
    updateMetrics,
    generateCacheKey,
    timeout,
    retryAttempts,
    enableCache,
    enableMetrics
  ]);

  // Cancel current render
  const cancelRender = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }

    setState(prev => ({
      ...prev,
      isLoading: false,
      isRendering: false
    }));

    logger.info('Template rendering cancelled');
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    setState(prev => {
      prev.cache.clear();
      return {
        ...prev,
        cache: new Map()
      };
    });

    logger.info('Template renderer cache cleared');
  }, []);

  // Preload template
  const preloadTemplate = useCallback(async (
    templateId: string,
    resume: Resume,
    customizations?: any
  ): Promise<void> => {
    if (!enablePreload) return;

    try {
      const options: RenderOptions = {
        mode: 'preview',
        customizations,
        quality: 'medium'
      };

      await renderTemplate(templateId, resume, customizations, options);
      logger.info('Template preloaded', { templateId });
    } catch (error) {
      logger.warn('Failed to preload template', {
        templateId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, [enablePreload, renderTemplate]);

  // Get performance metrics
  const getPerformanceMetrics = useCallback(() => {
    if (!enableMetrics) return null;

    return {
      ...state.metrics,
      performance: {
        ...state.metrics.performance,
        pipelineMetrics: renderingPipeline.getPerformanceMetrics()
      }
    };
  }, [enableMetrics, state.metrics]);

  // Get cache statistics
  const getCacheStats = useCallback(() => {
    return {
      size: state.cache.size,
      maxSize: 20,
      hits: state.metrics.cacheHits,
      hitRate: state.metrics.renderCount > 0 ? state.metrics.cacheHits / state.metrics.renderCount : 0
    };
  }, [state.cache, state.metrics]);

  // Get HTML content
  const getHTML = useCallback((templateId: string, resumeId: string, customizations?: any) => {
    const cached = getCachedTemplate(templateId, resumeId, customizations);
    if (cached) {
      return cached.rendered.html;
    }
    return '';
  }, [getCachedTemplate]);

  // Get CSS content
  const getCSS = useCallback((templateId: string, resumeId: string, customizations?: any) => {
    const cached = getCachedTemplate(templateId, resumeId, customizations);
    if (cached) {
      return cached.rendered.css;
    }
    return '';
  }, [getCachedTemplate]);

  // Memoized computed values
  const hasRenderedContent = useMemo(() => state.rendered !== null, [state.rendered]);
  const canRetry = useMemo(() => state.error !== null && retryCountRef.current < retryAttempts, [state.error, retryAttempts]);
  const isCacheEnabled = useMemo(() => enableCache, [enableCache]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelRender();
    };
  }, [cancelRender]);

  return {
    // State
    rendered: state.rendered,
    isLoading: state.isLoading,
    isRendering: state.isRendering,
    error: state.error,

    // Methods
    renderTemplate,
    cancelRender,
    clearCache,
    preloadTemplate,

    // Utilities
    getHTML,
    getCSS,
    getPerformanceMetrics,
    getCacheStats,

    // Flags
    hasRenderedContent,
    canRetry,
    isCacheEnabled
  };
};

export default useTemplateRenderer;