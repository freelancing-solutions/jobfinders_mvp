/**
 * Typography system for the JobFinders design system
 * Provides consistent typography scale and utilities
 */

export interface TypographyScale {
  xs: string
  sm: string
  base: string
  lg: string
  xl: string
  '2xl': string
  '3xl': string
  '4xl': string
  '5xl': string
}

export interface LineHeightScale {
  tight: string
  normal: string
  relaxed: string
}

export interface LetterSpacingScale {
  tight: string
  normal: string
  wide: string
}

export const fluidTypography: TypographyScale = {
  xs: 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)',   // 12px - 14px
  sm: 'clamp(0.875rem, 0.8rem + 0.375vw, 1rem)',     // 14px - 16px
  base: 'clamp(1rem, 0.9rem + 0.5vw, 1.125rem)',     // 16px - 18px
  lg: 'clamp(1.125rem, 1rem + 0.625vw, 1.25rem)',   // 18px - 20px
  xl: 'clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)',    // 20px - 24px
  '2xl': 'clamp(1.5rem, 1.3rem + 1vw, 2rem)',        // 24px - 32px
  '3xl': 'clamp(1.875rem, 1.6rem + 1.375vw, 2.5rem)', // 30px - 40px
  '4xl': 'clamp(2.25rem, 1.9rem + 1.75vw, 3rem)',    // 36px - 48px
  '5xl': 'clamp(3rem, 2.5rem + 2.5vw, 4rem)',        // 48px - 64px
}

export const lineHeights: LineHeightScale = {
  tight: '1.25',
  normal: '1.5',
  relaxed: '1.75',
}

export const letterSpacings: LetterSpacingScale = {
  tight: '-0.025em',
  normal: '0',
  wide: '0.025em',
}

/**
 * Typography utility functions
 */
export function getFontSize(size: keyof TypographyScale): string {
  return fluidTypography[size]
}

export function getLineHeight(height: keyof LineHeightScale): string {
  return lineHeights[height]
}

export function getLetterSpacing(spacing: keyof LetterSpacingScale): string {
  return letterSpacings[spacing]
}

/**
 * Generate typography CSS classes
 */
export function typographyClasses() {
  return {
    '.text-xs-fluid': { fontSize: fluidTypography.xs },
    '.text-sm-fluid': { fontSize: fluidTypography.sm },
    '.text-base-fluid': { fontSize: fluidTypography.base },
    '.text-lg-fluid': { fontSize: fluidTypography.lg },
    '.text-xl-fluid': { fontSize: fluidTypography.xl },
    '.text-2xl-fluid': { fontSize: fluidTypography['2xl'] },
    '.text-3xl-fluid': { fontSize: fluidTypography['3xl'] },
    '.text-4xl-fluid': { fontSize: fluidTypography['4xl'] },
    '.text-5xl-fluid': { fontSize: fluidTypography['5xl'] },
  }
}

/**
 * Heading hierarchy system
 */
export interface HeadingHierarchy {
  h1: {
    fontSize: keyof TypographyScale
    lineHeight: keyof LineHeightScale
    letterSpacing: keyof LetterSpacingScale
    fontWeight: string
  }
  h2: {
    fontSize: keyof TypographyScale
    lineHeight: keyof LineHeightScale
    letterSpacing: keyof LetterSpacingScale
    fontWeight: string
  }
  h3: {
    fontSize: keyof TypographyScale
    lineHeight: keyof LineHeightScale
    letterSpacing: keyof LetterSpacingScale
    fontWeight: string
  }
  h4: {
    fontSize: keyof TypographyScale
    lineHeight: keyof LineHeightScale
    letterSpacing: keyof LetterSpacingScale
    fontWeight: string
  }
  h5: {
    fontSize: keyof TypographyScale
    lineHeight: keyof LineHeightScale
    letterSpacing: keyof LetterSpacingScale
    fontWeight: string
  }
  h6: {
    fontSize: keyof TypographyScale
    lineHeight: keyof LineHeightScale
    letterSpacing: keyof LetterSpacingScale
    fontWeight: string
  }
}

export const headingHierarchy: HeadingHierarchy = {
  h1: {
    fontSize: '4xl',
    lineHeight: 'tight',
    letterSpacing: 'tight',
    fontWeight: '800',
  },
  h2: {
    fontSize: '3xl',
    lineHeight: 'tight',
    letterSpacing: 'tight',
    fontWeight: '700',
  },
  h3: {
    fontSize: '2xl',
    lineHeight: 'tight',
    letterSpacing: 'normal',
    fontWeight: '600',
  },
  h4: {
    fontSize: 'xl',
    lineHeight: 'normal',
    letterSpacing: 'normal',
    fontWeight: '600',
  },
  h5: {
    fontSize: 'lg',
    lineHeight: 'normal',
    letterSpacing: 'normal',
    fontWeight: '500',
  },
  h6: {
    fontSize: 'base',
    lineHeight: 'normal',
    letterSpacing: 'normal',
    fontWeight: '500',
  },
}