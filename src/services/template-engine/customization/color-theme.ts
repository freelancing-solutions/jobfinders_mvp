/**
 * Color theme customization system for resume templates
 * Provides professional color schemes with ATS optimization
 */

import { ColorTheme, ThemeColor, ColorScheme } from '@/types/template';
import { TemplateEngineError, TemplateErrorType } from './errors';

export class ColorThemeCustomizer {
  private static readonly PREDEFINED_THEMES: Record<string, ColorScheme> = {
    // Professional conservative themes
    executive: {
      name: 'Executive',
      primary: '#1a1a1a',
      secondary: '#4a4a4a',
      accent: '#2c5aa0',
      background: '#ffffff',
      text: '#1a1a1a',
      muted: '#6b7280',
      border: '#e5e7eb',
      highlight: '#f3f4f6',
      link: '#2563eb'
    },
    corporate: {
      name: 'Corporate',
      primary: '#0f172a',
      secondary: '#334155',
      accent: '#0ea5e9',
      background: '#ffffff',
      text: '#0f172a',
      muted: '#64748b',
      border: '#e2e8f0',
      highlight: '#f8fafc',
      link: '#0284c7'
    },
    minimal: {
      name: 'Minimal',
      primary: '#111827',
      secondary: '#374151',
      accent: '#6366f1',
      background: '#ffffff',
      text: '#111827',
      muted: '#6b7280',
      border: '#f3f4f6',
      highlight: '#f9fafb',
      link: '#4f46e5'
    },
    leadership: {
      name: 'Leadership',
      primary: '#1e293b',
      secondary: '#475569',
      accent: '#7c3aed',
      background: '#ffffff',
      text: '#1e293b',
      muted: '#64748b',
      border: '#e2e8f0',
      highlight: '#f8fafc',
      link: '#6d28d9'
    },

    // Modern themes
    modern_blue: {
      name: 'Modern Blue',
      primary: '#1e3a8a',
      secondary: '#3730a3',
      accent: '#3b82f6',
      background: '#ffffff',
      text: '#1e293b',
      muted: '#64748b',
      border: '#e2e8f0',
      highlight: '#eff6ff',
      link: '#2563eb'
    },
    modern_green: {
      name: 'Modern Green',
      primary: '#14532d',
      secondary: '#166534',
      accent: '#22c55e',
      background: '#ffffff',
      text: '#1e293b',
      muted: '#64748b',
      border: '#e2e8f0',
      highlight: '#f0fdf4',
      link: '#16a34a'
    },
    modern_purple: {
      name: 'Modern Purple',
      primary: '#581c87',
      secondary: '#6b21a8',
      accent: '#a855f7',
      background: '#ffffff',
      text: '#1e293b',
      muted: '#64748b',
      border: '#e2e8f0',
      highlight: '#faf5ff',
      link: '#9333ea'
    },

    // Creative themes
    creative_teal: {
      name: 'Creative Teal',
      primary: '#134e4a',
      secondary: '#0f766e',
      accent: '#14b8a6',
      background: '#ffffff',
      text: '#1e293b',
      muted: '#64748b',
      border: '#e2e8f0',
      highlight: '#f0fdfa',
      link: '#0d9488'
    },
    creative_orange: {
      name: 'Creative Orange',
      primary: '#7c2d12',
      secondary: '#9a3412',
      accent: '#f97316',
      background: '#ffffff',
      text: '#1e293b',
      muted: '#64748b',
      border: '#e2e8f0',
      highlight: '#fff7ed',
      link: '#ea580c'
    }
  };

  private static readonly ATS_SAFE_COLORS = [
    // Safe neutrals
    '#000000', '#1a1a1a', '#2d2d2d', '#404040', '#525252', '#666666', '#7a7a7a', '#8d8d8d', '#a0a0a0', '#b3b3b3', '#c6c6c6', '#d9d9d9', '#e6e6e6', '#f0f0f0', '#ffffff',

    // Safe blues
    '#000080', '#0000cd', '#1e3a8a', '#1e40af', '#2563eb', '#3b82f6', '#60a5fa', '#93bbfc',

    // Safe greens
    '#006400', '#008000', '#14532d', '#166534', '#16a34a', '#22c55e', '#4ade80', '#86efac',

    // Safe accent colors (conservative)
    '#4b0082', '#6b21a8', '#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd',

    // Safe professional colors
    '#8b4513', '#a0522d', '#d2691e', '#ff8c00', '#ff6347', '#ff4500'
  ];

  private static readonly COLOR_RELATIONS = {
    analogous: 30,      // Analogous colors (harmonious)
    complementary: 180, // Complementary colors (high contrast)
    triadic: 120,       // Triadic colors (balanced)
    split_complementary: 150, // Split complementary (subtle contrast)
    tetradic: 90        // Tetradic colors (rich contrast)
  };

  /**
   * Get all predefined color themes
   */
  static getPredefinedThemes(): ColorScheme[] {
    return Object.values(this.PREDEFINED_THEMES);
  }

  /**
   * Get a specific predefined theme
   */
  static getPredefinedTheme(themeId: string): ColorScheme | null {
    return this.PREDEFINED_THEMES[themeId] || null;
  }

  /**
   * Create a custom color theme
   */
  static createCustomTheme(baseColors: Partial<ColorScheme>, name?: string): ColorScheme {
    const defaultTheme = this.PREDEFINED_THEMES.executive;

    // Validate colors are ATS-safe
    const validatedColors: Partial<ColorScheme> = {};
    for (const [key, value] of Object.entries(baseColors)) {
      if (value && this.isATSSafeColor(value)) {
        validatedColors[key as keyof ColorScheme] = value;
      }
    }

    return {
      name: name || 'Custom Theme',
      ...defaultTheme,
      ...validatedColors
    };
  }

  /**
   * Check if a color is ATS-safe
   */
  static isATSSafeColor(color: string): boolean {
    // Convert hex to lowercase for comparison
    const normalizedColor = color.toLowerCase();

    // Check against predefined safe colors
    if (this.ATS_SAFE_COLORS.includes(normalizedColor)) {
      return true;
    }

    // Validate hex color format
    if (!/^#[0-9a-f]{6}$/i.test(color)) {
      return false;
    }

    // Check color contrast for readability
    try {
      const rgb = this.hexToRgb(color);
      if (!rgb) return false;

      // Calculate relative luminance
      const luminance = this.calculateRelativeLuminance(rgb);

      // Ensure sufficient contrast (WCAG AA standard)
      return luminance >= 0.1 && luminance <= 0.9;
    } catch {
      return false;
    }
  }

  /**
   * Generate harmonious color variations
   */
  static generateHarmoniousColors(baseColor: string, relation: keyof typeof this.COLOR_RELATIONS = 'analogous'): string[] {
    if (!this.isATSSafeColor(baseColor)) {
      throw new TemplateEngineError(
        TemplateErrorType.VALIDATION_ERROR,
        'Base color must be ATS-safe',
        { baseColor }
      );
    }

    const baseHsl = this.hexToHsl(baseColor);
    if (!baseHsl) {
      throw new TemplateEngineError(
        TemplateErrorType.VALIDATION_ERROR,
        'Invalid color format',
        { baseColor }
      );
    }

    const hueOffset = this.COLOR_RELATIONS[relation];
    const variations: string[] = [];

    // Generate 5 harmonious colors
    for (let i = -2; i <= 2; i++) {
      const newHue = (baseHsl.h + (i * hueOffset / 3) + 360) % 360;
      const newColor = this.hslToHex({
        h: newHue,
        s: Math.max(20, Math.min(80, baseHsl.s + (i * 5))),
        l: Math.max(20, Math.min(80, baseHsl.l + (i * 5)))
      });

      if (this.isATSSafeColor(newColor)) {
        variations.push(newColor);
      }
    }

    return variations.slice(0, 5); // Return up to 5 variations
  }

  /**
   * Create color variations for different states
   */
  static createColorStates(baseColor: string): {
    light: string;
    normal: string;
    dark: string;
    border: string;
    background: string;
  } {
    if (!this.isATSSafeColor(baseColor)) {
      throw new TemplateEngineError(
        TemplateErrorType.VALIDATION_ERROR,
        'Base color must be ATS-safe',
        { baseColor }
      );
    }

    const hsl = this.hexToHsl(baseColor);
    if (!hsl) {
      throw new TemplateEngineError(
        TemplateErrorType.VALIDATION_ERROR,
        'Invalid color format',
        { baseColor }
      );
    }

    return {
      light: this.hslToHex({ h: hsl.h, s: hsl.s, l: Math.min(90, hsl.l + 20) }),
      normal: baseColor,
      dark: this.hslToHex({ h: hsl.h, s: hsl.s, l: Math.max(10, hsl.l - 20) }),
      border: this.hslToHex({ h: hsl.h, s: hsl.s, l: Math.max(30, hsl.l - 40) }),
      background: this.hslToHex({ h: hsl.h, s: Math.min(10, hsl.s), l: Math.min(98, hsl.l + 35) })
    };
  }

  /**
   * Get color accessibility information
   */
  static getColorAccessibilityInfo(foregroundColor: string, backgroundColor: string): {
    contrastRatio: number;
    wcagAA: boolean;
    wcagAAA: boolean;
    recommendation: string;
  } {
    const fgRgb = this.hexToRgb(foregroundColor);
    const bgRgb = this.hexToRgb(backgroundColor);

    if (!fgRgb || !bgRgb) {
      throw new TemplateEngineError(
        TemplateErrorType.VALIDATION_ERROR,
        'Invalid color format',
        { foregroundColor, backgroundColor }
      );
    }

    const contrastRatio = this.calculateContrastRatio(fgRgb, bgRgb);
    const wcagAA = contrastRatio >= 4.5;
    const wcagAAA = contrastRatio >= 7;

    let recommendation = '';
    if (contrastRatio < 3) {
      recommendation = 'Poor contrast - Consider using significantly different colors';
    } else if (contrastRatio < 4.5) {
      recommendation = 'Low contrast - Consider adjusting colors for better readability';
    } else if (contrastRatio < 7) {
      recommendation = 'Good contrast - Meets WCAG AA standards';
    } else {
      recommendation = 'Excellent contrast - Meets WCAG AAA standards';
    }

    return {
      contrastRatio,
      wcagAA,
      wcagAAA,
      recommendation
    };
  }

  /**
   * Optimize color scheme for ATS compatibility
   */
  static optimizeForATS(scheme: ColorScheme): ColorScheme {
    const optimized: ColorScheme = { ...scheme };

    // Ensure primary color is dark enough for text
    if (this.calculateRelativeLuminance(this.hexToRgb(optimized.primary)!) > 0.5) {
      optimized.primary = '#1a1a1a';
    }

    // Ensure background is light enough
    if (this.calculateRelativeLuminance(this.hexToRgb(optimized.background)!) < 0.8) {
      optimized.background = '#ffffff';
    }

    // Ensure accent color provides sufficient contrast
    const accentContrast = this.calculateContrastRatio(
      this.hexToRgb(optimized.accent)!,
      this.hexToRgb(optimized.background)!
    );

    if (accentContrast < 3) {
      optimized.accent = '#2563eb'; // Safe blue
    }

    return optimized;
  }

  // Helper methods for color conversions
  private static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  private static rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  private static hexToHsl(hex: string): { h: number; s: number; l: number } | null {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return null;

    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }

  private static hslToHex(hsl: { h: number; s: number; l: number }): string {
    const h = hsl.h / 360;
    const s = hsl.s / 100;
    const l = hsl.l / 100;

    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return this.rgbToHex(
      Math.round(r * 255),
      Math.round(g * 255),
      Math.round(b * 255)
    );
  }

  private static calculateRelativeLuminance(rgb: { r: number; g: number; b: number }): number {
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  private static calculateContrastRatio(rgb1: { r: number; g: number; b: number }, rgb2: { r: number; g: number; b: number }): number {
    const l1 = this.calculateRelativeLuminance(rgb1);
    const l2 = this.calculateRelativeLuminance(rgb2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }
}