/**
 * Spacing system for the JobFinders design system
 * 8px grid-based spacing for consistency
 */

export interface SpacingScale {
  0: string
  1: string    // 4px
  2: string    // 8px - Base unit
  3: string    // 12px
  4: string    // 16px
  5: string    // 20px
  6: string    // 24px
  8: string    // 32px
  10: string   // 40px
  12: string   // 48px
  16: string   // 64px
  20: string   // 80px
  24: string   // 96px
  32: string   // 128px
  40: string   // 160px
  48: string   // 192px
  56: string   // 224px
  64: string   // 256px
}

export const spacing: SpacingScale = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px - Base unit
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  32: '8rem',     // 128px
  40: '10rem',    // 160px
  48: '12rem',    // 192px
  56: '14rem',    // 224px
  64: '16rem',    // 256px
}

/**
 * Responsive spacing utilities
 */
export interface ResponsiveSpacing {
  xs: string
  sm: string
  md: string
  lg: string
  xl: string
}

export const responsiveSpacing: ResponsiveSpacing = {
  xs: 'clamp(0.5rem, 1vw, 1rem)',     // 8px - 16px
  sm: 'clamp(0.75rem, 1.5vw, 1.5rem)', // 12px - 24px
  md: 'clamp(1rem, 2vw, 2rem)',       // 16px - 32px
  lg: 'clamp(1.5rem, 3vw, 3rem)',     // 24px - 48px
  xl: 'clamp(2rem, 4vw, 4rem)',       // 32px - 64px
}

/**
 * Section spacing presets
 */
export interface SectionSpacing {
  none: string
  sm: string
  md: string
  lg: string
  xl: string
}

export const sectionSpacing: SectionSpacing = {
  none: '0',
  sm: 'clamp(2rem, 4vw, 3rem)',    // 32px - 48px
  md: 'clamp(3rem, 6vw, 5rem)',    // 48px - 80px
  lg: 'clamp(4rem, 8vw, 7rem)',    // 64px - 112px
  xl: 'clamp(5rem, 10vw, 10rem)',  // 80px - 160px
}

/**
 * Component spacing presets
 */
export interface ComponentSpacing {
  tight: string
  normal: string
  relaxed: string
}

export const componentSpacing: ComponentSpacing = {
  tight: 'clamp(0.5rem, 1vw, 1rem)',     // 8px - 16px
  normal: 'clamp(1rem, 2vw, 1.5rem)',     // 16px - 24px
  relaxed: 'clamp(1.5rem, 3vw, 2rem)',    // 24px - 32px
}

/**
 * Spacing utility functions
 */
export function getSpacing(size: keyof SpacingScale): string {
  return spacing[size]
}

export function getResponsiveSpacing(size: keyof ResponsiveSpacing): string {
  return responsiveSpacing[size]
}

export function getSectionSpacing(size: keyof SectionSpacing): string {
  return sectionSpacing[size]
}

export function getComponentSpacing(size: keyof ComponentSpacing): string {
  return componentSpacing[size]
}

/**
 * Generate spacing CSS classes
 */
export function spacingClasses() {
  const classes: Record<string, any> = {}

  // Static spacing classes
  Object.entries(spacing).forEach(([key, value]) => {
    classes[`.space-${key}`] = { margin: value }
    classes[`.space-y-${key}`] = {
      '> * + *': { marginTop: value }
    }
    classes[`.space-x-${key}`] = {
      '> * + *': { marginLeft: value }
    }
    classes[`.p-${key}`] = { padding: value }
    classes[`.px-${key}`] = { paddingLeft: value, paddingRight: value }
    classes[`.py-${key}`] = { paddingTop: value, paddingBottom: value }
    classes[`.pt-${key}`] = { paddingTop: value }
    classes[`.pr-${key}`] = { paddingRight: value }
    classes[`.pb-${key}`] = { paddingBottom: value }
    classes[`.pl-${key}`] = { paddingLeft: value }
    classes[`.m-${key}`] = { margin: value }
    classes[`.mx-${key}`] = { marginLeft: value, marginRight: value }
    classes[`.my-${key}`] = { marginTop: value, marginBottom: value }
    classes[`.mt-${key}`] = { marginTop: value }
    classes[`.mr-${key}`] = { marginRight: value }
    classes[`.mb-${key}`] = { marginBottom: value }
    classes[`.ml-${key}`] = { marginLeft: value }
  })

  // Responsive spacing classes
  Object.entries(responsiveSpacing).forEach(([key, value]) => {
    classes[`.p-responsive-${key}`] = { padding: value }
    classes[`.px-responsive-${key}`] = { paddingLeft: value, paddingRight: value }
    classes[`.py-responsive-${key}`] = { paddingTop: value, paddingBottom: value }
    classes[`.m-responsive-${key}`] = { margin: value }
    classes[`.mx-responsive-${key}`] = { marginLeft: value, marginRight: value }
    classes[`.my-responsive-${key}`] = { marginTop: value, marginBottom: value }
  })

  // Section spacing classes
  Object.entries(sectionSpacing).forEach(([key, value]) => {
    classes[`.section-spacing-${key}`] = {
      paddingTop: value,
      paddingBottom: value
    }
    classes[`.section-spacing-y-${key}`] = {
      paddingTop: value,
      paddingBottom: value
    }
  })

  return classes
}