/**
 * React hook for template customization
 * Provides state management and methods for customizing resume templates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { TemplateCustomizationEngine } from '@/services/template-engine/customization/customization-engine';
import {
  TemplateCustomization,
  ResumeTemplate,
  ColorScheme,
  TypographySettings,
  LayoutSettings,
  SectionVisibility
} from '@/types/template';

interface UseTemplateCustomizationOptions {
  template: ResumeTemplate;
  initialCustomization?: TemplateCustomization;
  autoSave?: boolean;
  onCustomizationChange?: (customization: TemplateCustomization) => void;
  onError?: (error: Error) => void;
}

interface CustomizationState {
  customization: TemplateCustomization | null;
  isLoading: boolean;
  isDirty: boolean;
  error: Error | null;
  analytics: {
    overallScore: number;
    atsScore: number;
    readabilityScore: number;
    designScore: number;
    recommendations: string[];
    strengths: string[];
    warnings: string[];
  } | null;
}

interface CustomizationActions {
  // Color customization
  applyColorTheme: (themeId: string) => void;
  customizeColor: (property: keyof ColorScheme, color: string) => void;

  // Typography customization
  applyFontCombination: (combinationName: string) => void;
  customizeTypography: (settings: Partial<TypographySettings>) => void;

  // Layout customization
  applyLayoutPreset: (presetId: string) => void;
  customizeLayout: (settings: Partial<LayoutSettings>) => void;

  // Section customization
  toggleSection: (sectionId: string) => void;
  reorderSections: (sectionIds: string[]) => void;

  // Role-based customization
  applyRoleCustomization: (role: string, industry?: string, experienceLevel?: 'entry' | 'mid' | 'senior' | 'executive') => void;

  // General actions
  resetToDefaults: () => void;
  undoLastChange: () => boolean;
  exportCustomization: () => string;
  importCustomization: (customizationJson: string) => void;
  generateCSS: () => string;
  refreshAnalytics: () => void;
  clearError: () => void;
}

export function useTemplateCustomization({
  template,
  initialCustomization,
  autoSave = false,
  onCustomizationChange,
  onError
}: UseTemplateCustomizationOptions): CustomizationState & CustomizationActions {
  const [state, setState] = useState<CustomizationState>({
    customization: null,
    isLoading: true,
    isDirty: false,
    error: null,
    analytics: null
  });

  const engineRef = useRef<TemplateCustomizationEngine | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize customization engine
  useEffect(() => {
    try {
      const engine = new TemplateCustomizationEngine(template);

      // Apply initial customization if provided
      if (initialCustomization) {
        engine.importCustomization(JSON.stringify(initialCustomization));
      }

      engineRef.current = engine;

      // Set up change listener
      engine.addListener((customization) => {
        setState(prevState => ({
          ...prevState,
          customization,
          isDirty: true,
          error: null
        }));

        // Update analytics
        const analytics = engine.getAnalytics();
        setState(prevState => ({ ...prevState, analytics }));

        // Call external change handler
        if (onCustomizationChange) {
          onCustomizationChange(customization);
        }

        // Auto-save if enabled
        if (autoSave) {
          scheduleAutoSave(customization);
        }
      });

      // Get initial state
      const customization = engine.getCurrentCustomization();
      const analytics = engine.getAnalytics();

      setState({
        customization,
        isLoading: false,
        isDirty: false,
        error: null,
        analytics
      });

    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to initialize customization');
      setState(prevState => ({
        ...prevState,
        isLoading: false,
        error: err
      }));

      if (onError) {
        onError(err);
      }
    }
  }, [template, initialCustomization, onCustomizationChange, onError, autoSave]);

  // Auto-save functionality
  const scheduleAutoSave = useCallback((customization: TemplateCustomization) => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      // Save to localStorage or API
      try {
        localStorage.setItem(`resume-customization-${customization.templateId}`, JSON.stringify(customization));
      } catch (error) {
        console.error('Failed to auto-save customization:', error);
      }
    }, 2000); // 2 second debounce
  }, [autoSave]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Error handler
  const handleError = useCallback((error: Error, operation: string) => {
    setState(prevState => ({ ...prevState, error }));

    if (onError) {
      onError(error);
    }

    console.error(`Error in ${operation}:`, error);
  }, [onError]);

  // Color customization actions
  const applyColorTheme = useCallback((themeId: string) => {
    try {
      engineRef.current?.applyColorTheme(themeId);
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Failed to apply color theme'), 'applyColorTheme');
    }
  }, [handleError]);

  const customizeColor = useCallback((property: keyof ColorScheme, color: string) => {
    try {
      engineRef.current?.customizeColor(property, color);
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Failed to customize color'), 'customizeColor');
    }
  }, [handleError]);

  // Typography customization actions
  const applyFontCombination = useCallback((combinationName: string) => {
    try {
      engineRef.current?.applyFontCombination(combinationName);
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Failed to apply font combination'), 'applyFontCombination');
    }
  }, [handleError]);

  const customizeTypography = useCallback((settings: Partial<TypographySettings>) => {
    try {
      engineRef.current?.customizeTypography(settings);
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Failed to customize typography'), 'customizeTypography');
    }
  }, [handleError]);

  // Layout customization actions
  const applyLayoutPreset = useCallback((presetId: string) => {
    try {
      engineRef.current?.applyLayoutPreset(presetId);
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Failed to apply layout preset'), 'applyLayoutPreset');
    }
  }, [handleError]);

  const customizeLayout = useCallback((settings: Partial<LayoutSettings>) => {
    try {
      engineRef.current?.customizeLayout(settings);
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Failed to customize layout'), 'customizeLayout');
    }
  }, [handleError]);

  // Section customization actions
  const toggleSection = useCallback((sectionId: string) => {
    try {
      engineRef.current?.toggleSection(sectionId);
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Failed to toggle section'), 'toggleSection');
    }
  }, [handleError]);

  const reorderSections = useCallback((sectionIds: string[]) => {
    try {
      engineRef.current?.reorderSections(sectionIds);
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Failed to reorder sections'), 'reorderSections');
    }
  }, [handleError]);

  // Role-based customization
  const applyRoleCustomization = useCallback((
    role: string,
    industry?: string,
    experienceLevel?: 'entry' | 'mid' | 'senior' | 'executive'
  ) => {
    try {
      engineRef.current?.applyRoleCustomization(role, industry, experienceLevel);
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Failed to apply role customization'), 'applyRoleCustomization');
    }
  }, [handleError]);

  // General actions
  const resetToDefaults = useCallback(() => {
    try {
      engineRef.current?.resetToDefaults();
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Failed to reset to defaults'), 'resetToDefaults');
    }
  }, [handleError]);

  const undoLastChange = useCallback((): boolean => {
    try {
      return engineRef.current?.undoLastChange() ?? false;
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Failed to undo last change'), 'undoLastChange');
      return false;
    }
  }, [handleError]);

  const exportCustomization = useCallback((): string => {
    try {
      return engineRef.current?.exportCustomization() ?? '';
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Failed to export customization'), 'exportCustomization');
      return '';
    }
  }, [handleError]);

  const importCustomization = useCallback((customizationJson: string) => {
    try {
      engineRef.current?.importCustomization(customizationJson);
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Failed to import customization'), 'importCustomization');
    }
  }, [handleError]);

  const generateCSS = useCallback((): string => {
    try {
      return engineRef.current?.generateCSS() ?? '';
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Failed to generate CSS'), 'generateCSS');
      return '';
    }
  }, [handleError]);

  const refreshAnalytics = useCallback(() => {
    try {
      const analytics = engineRef.current?.getAnalytics();
      if (analytics) {
        setState(prevState => ({ ...prevState, analytics }));
      }
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Failed to refresh analytics'), 'refreshAnalytics');
    }
  }, [handleError]);

  const clearError = useCallback(() => {
    setState(prevState => ({ ...prevState, error: null }));
  }, []);

  return {
    ...state,
    applyColorTheme,
    customizeColor,
    applyFontCombination,
    customizeTypography,
    applyLayoutPreset,
    customizeLayout,
    toggleSection,
    reorderSections,
    applyRoleCustomization,
    resetToDefaults,
    undoLastChange,
    exportCustomization,
    importCustomization,
    generateCSS,
    refreshAnalytics,
    clearError
  };
}

// Additional utility hooks
export function useColorThemes() {
  const { ColorThemeCustomizer } = require('@/services/template-engine/customization/color-theme');

  return {
    getPredefinedThemes: ColorThemeCustomizer.getPredefinedThemes,
    getPredefinedTheme: ColorThemeCustomizer.getPredefinedTheme,
    isATSSafeColor: ColorThemeCustomizer.isATSSafeColor,
    generateHarmoniousColors: ColorThemeCustomizer.generateHarmoniousColors
  };
}

export function useTypographyCombinations() {
  const { TypographyCustomizer } = require('@/services/template-engine/customization/typography');

  return {
    getProfessionalCombinations: TypographyCustomizer.getProfessionalCombinations,
    getATSSafeFonts: TypographyCustomizer.getATSSafeFonts,
    getIndustryRecommendations: TypographyCustomizer.getIndustryRecommendations
  };
}

export function useLayoutPresets() {
  const { LayoutCustomizer } = require('@/services/template-engine/customization/layout');

  return {
    getPredefinedLayouts: LayoutCustomizer.getPredefinedLayouts,
    getPredefinedLayout: LayoutCustomizer.getPredefinedLayout,
    calculateLayoutEfficiency: LayoutCustomizer.calculateLayoutEfficiency
  };
}

export function useSectionConfigurations() {
  const { SectionVisibilityManager } = require('@/services/template-engine/customization/section-visibility');

  return {
    getDefaultSections: SectionVisibilityManager.getDefaultSections,
    getRoleSpecificSections: SectionVisibilityManager.getRoleSpecificSections,
    validateSectionContent: SectionVisibilityManager.validateSectionContent
  };
}