/**
 * Theme utility functions for the JobFinders design system
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get theme-aware CSS variable value
 */
export function getCSSVariable(variableName: string): string {
  if (typeof window === 'undefined') return ''
  return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim()
}

/**
 * Set CSS variable value
 */
export function setCSSVariable(variableName: string, value: string): void {
  if (typeof window === 'undefined') return
  document.documentElement.style.setProperty(variableName, value)
}

/**
 * Get current theme value
 */
export function getCurrentTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

/**
 * Apply theme class to document
 */
export function applyTheme(theme: 'light' | 'dark' | 'system'): void {
  if (typeof window === 'undefined') return

  const root = document.documentElement
  root.classList.remove('light', 'dark')

  if (theme === 'system') {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
    root.classList.add(systemTheme)
  } else {
    root.classList.add(theme)
  }
}

/**
 * Generate theme-aware className
 */
export function themeClass(baseClass: string, theme?: 'light' | 'dark'): string {
  const currentTheme = theme || getCurrentTheme()
  return `${baseClass} ${baseClass}--${currentTheme}`
}

/**
 * Get responsive value based on theme
 */
export function getResponsiveValue(lightValue: string, darkValue: string, theme?: 'light' | 'dark'): string {
  const currentTheme = theme || getCurrentTheme()
  return currentTheme === 'dark' ? darkValue : lightValue
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Add safe transition class based on motion preference
 */
export function getSafeTransitionClass(baseClass: string = 'transition-base'): string {
  return prefersReducedMotion() ? '' : baseClass
}