/**
 * Typography customization system for resume templates
 * Provides professional font combinations with ATS optimization
 */

import { TypographySettings, FontFamily, FontWeight, FontSize } from '@/types/template';
import { TemplateEngineError, TemplateErrorType } from './errors';

export class TypographyCustomizer {
  private static readonly ATS_SAFE_FONTS = {
    serif: [
      { name: 'Times New Roman', stack: '"Times New Roman", Times, serif', category: 'serif', readability: 95 },
      { name: 'Georgia', stack: 'Georgia, "Times New Roman", serif', category: 'serif', readability: 93 },
      { name: 'Garamond', stack: 'Garamond, "Times New Roman", serif', category: 'serif', readability: 92 },
      { name: 'Cambria', stack: 'Cambria, Georgia, serif', category: 'serif', readability: 91 }
    ],
    sansSerif: [
      { name: 'Arial', stack: 'Arial, Helvetica, sans-serif', category: 'sans-serif', readability: 94 },
      { name: 'Calibri', stack: 'Calibri, Arial, sans-serif', category: 'sans-serif', readability: 93 },
      { name: 'Helvetica', stack: 'Helvetica, Arial, sans-serif', category: 'sans-serif', readability: 95 },
      { name: 'Verdana', stack: 'Verdana, Arial, sans-serif', category: 'sans-serif', readability: 92 },
      { name: 'Tahoma', stack: 'Tahoma, Arial, sans-serif', category: 'sans-serif', readability: 91 }
    ],
    monospace: [
      { name: 'Courier New', stack: '"Courier New", Courier, monospace', category: 'monospace', readability: 88 },
      { name: 'Consolas', stack: 'Consolas, "Courier New", monospace', category: 'monospace', readability: 90 }
    ]
  };

  private static readonly PROFESSIONAL_COMBINATIONS = [
    {
      name: 'Corporate Classic',
      heading: 'Arial',
      body: 'Arial',
      accent: 'Arial',
      description: 'Consistent, professional, and ATS-friendly'
    },
    {
      name: 'Executive Elegance',
      heading: 'Georgia',
      body: 'Arial',
      accent: 'Georgia',
      description: 'Sophisticated headings with readable body text'
    },
    {
      name: 'Modern Minimal',
      heading: 'Helvetica',
      body: 'Helvetica',
      accent: 'Helvetica',
      description: 'Clean, contemporary, and professional'
    },
    {
      name: 'Traditional Professional',
      heading: 'Times New Roman',
      body: 'Arial',
      accent: 'Times New Roman',
      description: 'Classic combination for traditional industries'
    },
    {
      name: 'Contemporary Balance',
      heading: 'Calibri',
      body: 'Calibri',
      accent: 'Calibri',
      description: 'Modern and widely accepted in business'
    }
  ];

  private static readonly FONT_SIZES = {
    heading: {
      h1: { min: 18, max: 32, default: 28, step: 2 },
      h2: { min: 14, max: 24, default: 20, step: 1 },
      h3: { min: 12, max: 20, default: 16, step: 1 },
      h4: { min: 11, max: 18, default: 14, step: 1 }
    },
    body: {
      large: { min: 12, max: 18, default: 16, step: 1 },
      normal: { min: 10, max: 16, default: 12, step: 1 },
      small: { min: 9, max: 14, default: 10, step: 1 },
      caption: { min: 8, max: 12, default: 9, step: 1 }
    }
  };

  private static readonly LINE_HEIGHTS = {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8
  };

  private static readonly LETTER_SPACING = {
    tight: -0.02,
    normal: 0,
    relaxed: 0.02,
    loose: 0.04
  };

  /**
   * Get all ATS-safe fonts
   */
  static getATSSafeFonts(category?: 'serif' | 'sansSerif' | 'monospace') {
    if (category) {
      return this.ATS_SAFE_FONTS[category] || [];
    }
    return [
      ...this.ATS_SAFE_FONTS.serif,
      ...this.ATS_SAFE_FONTS.sansSerif,
      ...this.ATS_SAFE_FONTS.monospace
    ];
  }

  /**
   * Get professional font combinations
   */
  static getProfessionalCombinations() {
    return this.PROFESSIONAL_COMBINATIONS;
  }

  /**
   * Create custom typography settings
   */
  static createCustomTypography(settings: Partial<TypographySettings>): TypographySettings {
    const defaultSettings: TypographySettings = {
      heading: {
        fontFamily: 'Arial',
        fontWeight: 600,
        fontSize: {
          h1: 28,
          h2: 20,
          h3: 16,
          h4: 14
        },
        lineHeight: 1.2,
        letterSpacing: 0
      },
      body: {
        fontFamily: 'Arial',
        fontWeight: 400,
        fontSize: {
          large: 16,
          normal: 12,
          small: 10,
          caption: 9
        },
        lineHeight: 1.4,
        letterSpacing: 0
      },
      accent: {
        fontFamily: 'Arial',
        fontWeight: 500,
        fontSize: 14,
        lineHeight: 1.4,
        letterSpacing: 0.5
      },
      monospace: {
        fontFamily: 'Courier New',
        fontWeight: 400,
        fontSize: 11,
        lineHeight: 1.3,
        letterSpacing: 0
      }
    };

    // Validate font families
    const validatedSettings = { ...defaultSettings };

    if (settings.heading?.fontFamily) {
      if (this.isValidFont(settings.heading.fontFamily)) {
        validatedSettings.heading.fontFamily = settings.heading.fontFamily;
      }
    }

    if (settings.body?.fontFamily) {
      if (this.isValidFont(settings.body.fontFamily)) {
        validatedSettings.body.fontFamily = settings.body.fontFamily;
      }
    }

    if (settings.accent?.fontFamily) {
      if (this.isValidFont(settings.accent.fontFamily)) {
        validatedSettings.accent.fontFamily = settings.accent.fontFamily;
      }
    }

    if (settings.monospace?.fontFamily) {
      if (this.isValidMonospaceFont(settings.monospace.fontFamily)) {
        validatedSettings.monospace.fontFamily = settings.monospace.fontFamily;
      }
    }

    // Merge other settings
    return {
      heading: { ...validatedSettings.heading, ...settings.heading },
      body: { ...validatedSettings.body, ...settings.body },
      accent: { ...validatedSettings.accent, ...settings.accent },
      monospace: { ...validatedSettings.monospace, ...settings.monospace }
    };
  }

  /**
   * Validate font is ATS-safe
   */
  static isValidFont(fontName: string): boolean {
    const allFonts = [
      ...this.ATS_SAFE_FONTS.serif,
      ...this.ATS_SAFE_FONTS.sansSerif
    ];
    return allFonts.some(font => font.name === fontName);
  }

  /**
   * Validate monospace font is ATS-safe
   */
  static isValidMonospaceFont(fontName: string): boolean {
    return this.ATS_SAFE_FONTS.monospace.some(font => font.name === fontName);
  }

  /**
   * Get font stack for given font name
   */
  static getFontStack(fontName: string): string {
    const allFonts = [
      ...this.ATS_SAFE_FONTS.serif,
      ...this.ATS_SAFE_FONTS.sansSerif,
      ...this.ATS_SAFE_FONTS.monospace
    ];
    const font = allFonts.find(f => f.name === fontName);
    return font?.stack || '"Times New Roman", Times, serif';
  }

  /**
   * Get font category
   */
  static getFontCategory(fontName: string): 'serif' | 'sans-serif' | 'monospace' | null {
    const allFonts = [
      ...this.ATS_SAFE_FONTS.serif.map(f => ({ ...f, category: 'serif' as const })),
      ...this.ATS_SAFE_FONTS.sansSerif.map(f => ({ ...f, category: 'sans-serif' as const })),
      ...this.ATS_SAFE_FONTS.monospace.map(f => ({ ...f, category: 'monospace' as const }))
    ];
    const font = allFonts.find(f => f.name === fontName);
    return font?.category || null;
  }

  /**
   * Validate font size for ATS compatibility
   */
  static validateFontSize(size: number, type: 'heading' | 'body' | 'accent' | 'monospace'): boolean {
    const ranges = type === 'heading' ? this.FONT_SIZES.heading :
                   type === 'body' ? this.FONT_SIZES.body :
                   { large: { min: 10, max: 16 }, normal: { min: 10, max: 16 }, small: { min: 10, max: 16 }, caption: { min: 10, max: 16 } };

    const minSize = Math.min(...Object.values(ranges).map(r => r.min));
    const maxSize = Math.max(...Object.values(ranges).map(r => r.max));

    return size >= minSize && size <= maxSize;
  }

  /**
   * Get recommended font size for specific role
   */
  static getRecommendedFontSize(role: 'heading' | 'body' | 'accent' | 'monospace', context: string = 'default'): number {
    switch (role) {
      case 'heading':
        return context === 'name' ? 28 : context === 'section' ? 16 : 14;
      case 'body':
        return context === 'contact' ? 10 : 12;
      case 'accent':
        return 11;
      case 'monospace':
        return 11;
      default:
        return 12;
    }
  }

  /**
   * Calculate reading score for typography combination
   */
  static calculateReadabilityScore(typography: TypographySettings): {
    score: number;
    factors: {
      fontSize: number;
      lineHeight: number;
      fontFamily: number;
      contrast: number;
    };
    recommendations: string[];
  } {
    let score = 0;
    const factors = {
      fontSize: 0,
      lineHeight: 0,
      fontFamily: 0,
      contrast: 0
    };
    const recommendations: string[] = [];

    // Font size scoring
    const bodyFontSize = typography.body.fontSize.normal;
    if (bodyFontSize >= 11 && bodyFontSize <= 12) {
      factors.fontSize = 25;
      score += 25;
    } else if (bodyFontSize >= 10 && bodyFontSize <= 14) {
      factors.fontSize = 20;
      score += 20;
    } else {
      factors.fontSize = 10;
      score += 10;
      recommendations.push('Consider using 11-12pt font size for optimal readability');
    }

    // Line height scoring
    const bodyLineHeight = typography.body.lineHeight;
    if (bodyLineHeight >= 1.4 && bodyLineHeight <= 1.6) {
      factors.lineHeight = 25;
      score += 25;
    } else if (bodyLineHeight >= 1.2 && bodyLineHeight <= 1.8) {
      factors.lineHeight = 20;
      score += 20;
    } else {
      factors.lineHeight = 10;
      score += 10;
      recommendations.push('Consider using 1.4-1.6 line height for better readability');
    }

    // Font family scoring
    const bodyFont = typography.body.fontFamily;
    const fontInfo = this.getATSSafeFonts().find(f => f.name === bodyFont);
    if (fontInfo) {
      factors.fontFamily = fontInfo.readability;
      score += fontInfo.readability / 4; // Scale to 25 points
    } else {
      factors.fontFamily = 50;
      score += 12.5;
      recommendations.push('Consider using an ATS-safe font family');
    }

    // Contrast scoring (estimated based on typical usage)
    factors.contrast = 25;
    score += 25;

    return {
      score: Math.round(score),
      factors,
      recommendations
    };
  }

  /**
   * Generate CSS for typography settings
   */
  static generateCSS(typography: TypographySettings): string {
    const css = `
/* Typography Styles */
h1, .resume-name {
  font-family: ${this.getFontStack(typography.heading.fontFamily)};
  font-size: ${typography.heading.fontSize.h1}pt;
  font-weight: ${typography.heading.fontWeight};
  line-height: ${typography.heading.lineHeight};
  letter-spacing: ${typography.heading.letterSpacing}em;
}

h2, .section-title {
  font-family: ${this.getFontStack(typography.heading.fontFamily)};
  font-size: ${typography.heading.fontSize.h2}pt;
  font-weight: ${typography.heading.fontWeight};
  line-height: ${typography.heading.lineHeight};
  letter-spacing: ${typography.heading.letterSpacing}em;
}

h3, .subsection-title {
  font-family: ${this.getFontStack(typography.heading.fontFamily)};
  font-size: ${typography.heading.fontSize.h3}pt;
  font-weight: ${typography.heading.fontWeight};
  line-height: ${typography.heading.lineHeight};
  letter-spacing: ${typography.heading.letterSpacing}em;
}

.body-text, p, li {
  font-family: ${this.getFontStack(typography.body.fontFamily)};
  font-size: ${typography.body.fontSize.normal}pt;
  font-weight: ${typography.body.fontWeight};
  line-height: ${typography.body.lineHeight};
  letter-spacing: ${typography.body.letterSpacing}em;
}

.accent-text {
  font-family: ${this.getFontStack(typography.accent.fontFamily)};
  font-size: ${typography.accent.fontSize}pt;
  font-weight: ${typography.accent.fontWeight};
  line-height: ${typography.accent.lineHeight};
  letter-spacing: ${typography.accent.letterSpacing}em;
}

.contact-info {
  font-family: ${this.getFontStack(typography.body.fontFamily)};
  font-size: ${typography.body.fontSize.small}pt;
  font-weight: ${typography.body.fontWeight};
  line-height: ${typography.body.lineHeight};
  letter-spacing: ${typography.body.letterSpacing}em;
}

.caption-text {
  font-family: ${this.getFontStack(typography.body.fontFamily)};
  font-size: ${typography.body.fontSize.caption}pt;
  font-weight: ${typography.body.fontWeight};
  line-height: ${typography.body.lineHeight};
  letter-spacing: ${typography.body.letterSpacing}em;
}

.code, .tech-skills {
  font-family: ${this.getFontStack(typography.monospace.fontFamily)};
  font-size: ${typography.monospace.fontSize}pt;
  font-weight: ${typography.monospace.fontWeight};
  line-height: ${typography.monospace.lineHeight};
  letter-spacing: ${typography.monospace.letterSpacing}em;
}
    `.trim();

    return css;
  }

  /**
   * Get typography recommendations for specific industry
   */
  static getIndustryRecommendations(industry: string): Partial<TypographySettings> {
    const recommendations: Record<string, Partial<TypographySettings>> = {
      finance: {
        heading: { fontFamily: 'Georgia', fontWeight: 600 },
        body: { fontFamily: 'Arial', fontWeight: 400 }
      },
      tech: {
        heading: { fontFamily: 'Arial', fontWeight: 600 },
        body: { fontFamily: 'Arial', fontWeight: 400 },
        monospace: { fontFamily: 'Consolas', fontWeight: 400 }
      },
      healthcare: {
        heading: { fontFamily: 'Times New Roman', fontWeight: 600 },
        body: { fontFamily: 'Arial', fontWeight: 400 }
      },
      legal: {
        heading: { fontFamily: 'Times New Roman', fontWeight: 600 },
        body: { fontFamily: 'Georgia', fontWeight: 400 }
      },
      creative: {
        heading: { fontFamily: 'Helvetica', fontWeight: 600 },
        body: { fontFamily: 'Arial', fontWeight: 400 }
      },
      education: {
        heading: { fontFamily: 'Georgia', fontWeight: 600 },
        body: { fontFamily: 'Times New Roman', fontWeight: 400 }
      }
    };

    return recommendations[industry.toLowerCase()] || {};
  }

  /**
   * Apply professional combination
   */
  static applyProfessionalCombination(combinationName: string): TypographySettings {
    const combination = this.PROFESSIONAL_COMBINATIONS.find(c => c.name === combinationName);
    if (!combination) {
      throw new TemplateEngineError(
        TemplateErrorType.VALIDATION_ERROR,
        'Invalid combination name',
        { combinationName }
      );
    }

    return this.createCustomTypography({
      heading: { fontFamily: combination.heading },
      body: { fontFamily: combination.body },
      accent: { fontFamily: combination.accent }
    });
  }
}