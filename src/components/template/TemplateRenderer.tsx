/**
 * Template Renderer Component
 *
 * React component for rendering resume templates with real-time preview,
 * loading states, error handling, and progressive loading capabilities.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ResumeTemplate, Resume, RenderedTemplate, RenderingPipelineOptions } from '@/types/template';
import { renderingPipeline } from '@/services/template-engine/rendering-pipeline';
import { logger } from '@/lib/logger';

interface TemplateRendererProps {
  template: ResumeTemplate;
  resume: Resume;
  customizations?: any;
  options?: RenderingPipelineOptions;
  className?: string;
  style?: React.CSSProperties;
  onLoad?: (rendered: RenderedTemplate) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
  mode?: 'preview' | 'print' | 'export';
  showLoadingIndicator?: boolean;
  showErrorBoundary?: boolean;
}

interface RenderingState {
  isLoading: boolean;
  isRendering: boolean;
  rendered: RenderedTemplate | null;
  error: Error | null;
  progress: number;
  stage: string;
  cacheKey: string;
}

export const TemplateRenderer: React.FC<TemplateRendererProps> = ({
  template,
  resume,
  customizations,
  options = {},
  className = '',
  style = {},
  onLoad,
  onError,
  onProgress,
  mode = 'preview',
  showLoadingIndicator = true,
  showErrorBoundary = true
}) => {
  const [state, setState] = useState<RenderingState>({
    isLoading: true,
    isRendering: false,
    rendered: null,
    error: null,
    progress: 0,
    stage: 'initializing',
    cacheKey: ''
  });

  const cacheRef = useRef<Map<string, RenderedTemplate>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generate cache key
  const generateCacheKey = useCallback(() => {
    const keyData = {
      templateId: template.id,
      resumeId: resume.id,
      customizations: JSON.stringify(customizations || {}),
      options: JSON.stringify(options),
      mode
    };
    return btoa(JSON.stringify(keyData));
  }, [template.id, resume.id, customizations, options, mode]);

  // Check cache first
  const checkCache = useCallback(() => {
    const cacheKey = generateCacheKey();
    const cached = cacheRef.current.get(cacheKey);

    if (cached && isValidCache(cached)) {
      logger.debug('Using cached rendered template', {
        templateId: template.id,
        cacheKey
      });

      setState({
        isLoading: false,
        isRendering: false,
        rendered: cached,
        error: null,
        progress: 100,
        stage: 'completed',
        cacheKey
      });

      onLoad?.(cached);
      return true;
    }

    return false;
  }, [generateCacheKey, onLoad]);

  // Main rendering function
  const renderTemplate = useCallback(async () => {
    // Cancel any existing render
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      setState(prev => ({
        ...prev,
        isLoading: false,
        isRendering: true,
        error: null,
        progress: 0,
        stage: 'rendering'
      }));

      // Update progress during rendering
      const progressInterval = setInterval(() => {
        setState(prev => {
          if (prev.progress < 90) {
            return { ...prev, progress: Math.min(prev.progress + 10, 90) };
          }
          return prev;
        });
      }, 100);

      // Set up timeout for rendering
      renderTimeoutRef.current = setTimeout(() => {
        clearInterval(progressInterval);
      }, 10000); // 10 second timeout

      // Configure rendering options
      const renderingOptions: RenderingPipelineOptions = {
        format: mode === 'preview' ? 'preview' : mode === 'print' ? 'print' : 'html',
        customizations,
        optimization: {
          minify: mode === 'export',
          inlineCSS: mode === 'preview',
          embedImages: false,
          subsetFonts: true,
          lazyLoad: mode === 'preview',
          compress: mode === 'export'
        },
        performance: {
          timeout: 10000,
          enableProfiling: true,
          enableCaching: true,
          enableMetrics: true
        },
        ...options
      };

      // Render the template
      const rendered = await renderingPipeline.render(template, resume, renderingOptions);

      // Clear timeout and interval
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
        renderTimeoutRef.current = null;
      }
      clearInterval(progressInterval);

      // Check if request was aborted
      if (signal.aborted) {
        logger.info('Rendering was aborted');
        return;
      }

      // Cache the result
      const cacheKey = generateCacheKey();
      cacheRef.current.set(cacheKey, rendered);

      // Clear old cache entries (keep last 10)
      if (cacheRef.current.size > 10) {
        const oldestKey = cacheRef.current.keys().next().value;
        if (oldestKey) {
          cacheRef.current.delete(oldestKey);
        }
      }

      setState({
        isLoading: false,
        isRendering: false,
        rendered,
        error: null,
        progress: 100,
        stage: 'completed',
        cacheKey
      });

      onProgress?.(100);
      onLoad?.(rendered);

      logger.info('Template rendered successfully', {
        templateId: template.id,
        renderingTime: rendered.metadata.renderingTime,
        errors: 0
      });

    } catch (error) {
      clearInterval(progressInterval);

      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
        renderTimeoutRef.current = null;
      }

      if (signal.aborted) {
        logger.info('Rendering was aborted');
        return;
      }

      const errorObj = error instanceof Error ? error : new Error('Unknown rendering error');

      setState({
        isLoading: false,
        isRendering: false,
        rendered: null,
        error: errorObj,
        progress: 0,
        stage: 'error',
        cacheKey: ''
      });

      onError?.(errorObj);

      logger.error('Template rendering failed', {
        templateId: template.id,
        error: errorObj.message
      });
    }
  }, [template, resume, customizations, options, mode, onError, onLoad, onProgress, generateCacheKey]);

  // Initialize component
  useEffect(() => {
    // Check cache first
    if (!checkCache()) {
      // No cache found, start rendering
      renderTemplate();
    }
  }, [checkCache, renderTemplate]);

  // Re-render when dependencies change
  useEffect(() => {
    const cacheKey = generateCacheKey();
    if (state.cacheKey !== cacheKey && state.rendered) {
      // Dependencies changed, re-render
      renderTemplate();
    }
  }, [template.id, resume.id, customizations, options, mode, generateCacheKey, state.cacheKey, state.rendered]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, []);

  // Generate preview HTML
  const renderPreviewHTML = useCallback(() => {
    if (!state.rendered) return '';

    const { html, css } = state.rendered.rendered;

    if (mode === 'preview') {
      // For preview mode, return HTML with embedded styles
      return html;
    }

    // For other modes, return HTML
    return html;
  }, [state.rendered, mode]);

  // Handle error recovery
  const handleRetry = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
      isLoading: true
    }));
    renderTemplate();
  }, [renderTemplate]);

  // Handle cache clearing
  const handleClearCache = useCallback(() => {
    cacheRef.current.clear();
    setState(prev => ({
      ...prev,
      rendered: null,
      cacheKey: ''
    }));
    renderTemplate();
  }, [renderTemplate]);

  // Loading indicator component
  const LoadingIndicator = () => {
    if (!showLoadingIndicator) return null;

    return (
      <div className="template-renderer-loading">
        <div className="loading-spinner"></div>
        <div className="loading-text">
          Rendering template...
          {state.stage && (
            <span className="loading-stage"> ({state.stage})</span>
          )}
        </div>
        <div className="loading-progress">
          <div
            className="progress-bar"
            style={{ width: `${state.progress}%` }}
          ></div>
        </div>
      </div>
    );
  };

  // Error display component
  const ErrorDisplay = ({ error }: { error: Error }) => {
    return (
      <div className="template-renderer-error">
        <div className="error-icon">⚠️</div>
        <div className="error-message">
          <h3>Rendering Failed</h3>
          <p>{error.message}</p>
        </div>
        <div className="error-actions">
          <button onClick={handleRetry} className="retry-button">
            Try Again
          </button>
          <button onClick={handleClearCache} className="clear-cache-button">
            Clear Cache
          </button>
        </div>
      </div>
    );
  };

  // Render content
  const renderContent = () => {
    if (state.error && showErrorBoundary) {
      return <ErrorDisplay error={state.error} />;
    }

    if (state.isLoading || state.isRendering) {
      return <LoadingIndicator />;
    }

    if (!state.rendered) {
      return (
        <div className="template-renderer-empty">
          <div className="empty-icon">📄</div>
          <p>No content to display</p>
        </div>
      );
    }

    // Render the template content
    return (
      <div
        className={`template-renderer-content template-${template.id}`}
        dangerouslySetInnerHTML={{ __html: renderPreviewHTML() }}
      />
    );
  };

  return (
    <div
      className={`template-renderer ${className}`}
      style={style}
      data-template-id={template.id}
      data-rendering-mode={mode}
      data-rendering-stage={state.stage}
    >
      {renderContent()}
    </div>
  );
};

// Helper function to check if cache is valid
function isValidCache(rendered: RenderedTemplate): boolean {
  if (!rendered) return false;

  const maxAge = 5 * 60 * 1000; // 5 minutes
  const age = Date.now() - rendered.metadata.generatedAt.getTime();

  return age < maxAge;
}

// Export higher-order components
export const withTemplateRenderer = (template: ResumeTemplate) => {
  return (props: Omit<TemplateRendererProps, 'template'>) => (
    <TemplateRenderer {...props} template={template} />
  );
};

export const withErrorHandling = (WrappedComponent: React.ComponentType<any>) => {
  return (props: any) => {
    const [error, setError] = useState<Error | null>(null);

    const handleError = useCallback((error: Error) => {
      setError(error);
      logger.error('Template renderer error', { error: error.message });
    }, []);

    if (error) {
      return (
        <div className="template-renderer-error-boundary">
          <ErrorDisplay error={error} />
        </div>
      );
    }

    return <WrappedComponent {...props} onError={handleError} />;
  };
};

// Export hook for template rendering
export const useTemplateRenderer = () => {
  const [renderedTemplate, setRenderedTemplate] = useState<RenderedTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const renderTemplate = useCallback(async (
    template: ResumeTemplate,
    resume: Resume,
    options?: RenderingPipelineOptions
  ) => {
      try {
        setIsLoading(true);
        setError(null);

        const rendered = await renderingPipeline.render(template, resume, options);
        setRenderedTemplate(rendered);

        logger.info('Template rendered successfully', {
          templateId: template.id,
          renderingTime: rendered.metadata.renderingTime
        });

        return rendered;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error('Unknown error');
        setError(errorObj);
        logger.error('Template rendering failed', {
          templateId: template.id,
          error: errorObj.message
        });
        throw errorObj;
      } finally {
        setIsLoading(false);
      }
  }, []);

  const clearCache = useCallback(() => {
    setRenderedTemplate(null);
    setError(null);
  }, []);

  return {
    renderedTemplate,
    isLoading,
    error,
    renderTemplate,
    clearCache
  };
};

export default TemplateRenderer;