/**
 * Animation system for the JobFinders design system
 * Provides consistent animations and transitions with accessibility support
 */

export interface AnimationPresets {
  fadeIn: string
  slideUp: string
  slideDown: string
  slideLeft: string
  slideRight: string
  scaleIn: string
  bounce: string
  pulse: string
  spin: string
  ping: string
}

export interface TransitionPresets {
  base: string
  fast: string
  slow: string
  none: string
}

export const animationPresets: AnimationPresets = {
  fadeIn: 'fadeIn 0.5s ease-in-out',
  slideUp: 'slideUp 0.3s ease-out',
  slideDown: 'slideDown 0.3s ease-out',
  slideLeft: 'slideLeft 0.3s ease-out',
  slideRight: 'slideRight 0.3s ease-out',
  scaleIn: 'scaleIn 0.2s ease-out',
  bounce: 'bounce 1s infinite',
  pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  spin: 'spin 1s linear infinite',
  ping: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
}

export const transitionPresets: TransitionPresets = {
  base: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  fast: 'all 75ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
  none: 'none',
}

export const keyframes = {
  fadeIn: {
    '0%': { opacity: '0' },
    '100%': { opacity: '1' },
  },
  slideUp: {
    '0%': { transform: 'translateY(10px)', opacity: '0' },
    '100%': { transform: 'translateY(0)', opacity: '1' },
  },
  slideDown: {
    '0%': { transform: 'translateY(-10px)', opacity: '0' },
    '100%': { transform: 'translateY(0)', opacity: '1' },
  },
  slideLeft: {
    '0%': { transform: 'translateX(10px)', opacity: '0' },
    '100%': { transform: 'translateX(0)', opacity: '1' },
  },
  slideRight: {
    '0%': { transform: 'translateX(-10px)', opacity: '0' },
    '100%': { transform: 'translateX(0)', opacity: '1' },
  },
  scaleIn: {
    '0%': { transform: 'scale(0.95)', opacity: '0' },
    '100%': { transform: 'scale(1)', opacity: '1' },
  },
  bounce: {
    '0%, 100%': { transform: 'translateY(-25%)', animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)' },
    '50%': { transform: 'translateY(0)', animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)' },
  },
  pulse: {
    '0%, 100%': { opacity: '1' },
    '50%': { opacity: '0.5' },
  },
  spin: {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  },
  ping: {
    '75%': { transform: 'scale(2)', opacity: '0' },
    '100%': { transform: 'scale(2)', opacity: '0' },
  },
}

/**
 * Animation utility functions
 */
export function getAnimation(name: keyof AnimationPresets): string {
  return animationPresets[name]
}

export function getTransition(name: keyof TransitionPresets): string {
  return transitionPresets[name]
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Get animation with reduced motion support
 */
export function getSafeAnimation(animation: keyof AnimationPresets): string {
  return prefersReducedMotion() ? 'none' : animationPresets[animation]
}

/**
 * Get transition with reduced motion support
 */
export function getSafeTransition(transition: keyof TransitionPresets): string {
  return prefersReducedMotion() ? 'none' : transitionPresets[transition]
}

/**
 * Generate animation CSS classes
 */
export function animationClasses() {
  return {
    '.animate-fade-in': {
      animation: 'fadeIn 0.5s ease-in-out',
    },
    '.animate-slide-up': {
      animation: 'slideUp 0.3s ease-out',
    },
    '.animate-slide-down': {
      animation: 'slideDown 0.3s ease-out',
    },
    '.animate-slide-left': {
      animation: 'slideLeft 0.3s ease-out',
    },
    '.animate-slide-right': {
      animation: 'slideRight 0.3s ease-out',
    },
    '.animate-scale-in': {
      animation: 'scaleIn 0.2s ease-out',
    },
    '.animate-bounce': {
      animation: 'bounce 1s infinite',
    },
    '.animate-pulse': {
      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    },
    '.animate-spin': {
      animation: 'spin 1s linear infinite',
    },
    '.animate-ping': {
      animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
    },
    '.transition-base': {
      transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    },
    '.transition-fast': {
      transition: 'all 75ms cubic-bezier(0.4, 0, 0.2, 1)',
    },
    '.transition-slow': {
      transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    },
    '.transition-none': {
      transition: 'none',
    },
  }
}

/**
 * Generate keyframe CSS
 */
export function keyframeCSS() {
  let css = ''

  Object.entries(keyframes).forEach(([name, frames]) => {
    css += `@keyframes ${name} {\n`
    Object.entries(frames).forEach(([percentage, styles]) => {
      css += `  ${percentage} {\n`
      Object.entries(styles).forEach(([property, value]) => {
        css += `    ${property}: ${value};\n`
      })
      css += `  }\n`
    })
    css += `}\n\n`
  })

  return css
}

/**
 * Reduced motion support
 */
@media (prefers-reduced-motion: reduce) {
  // Respect user's motion preferences
  const reducedMotionStyles = `
    .motion-respect {
      animation: none !important;
      transition: none !important;
    }
  `
}