/**
 * Color palette and utilities for the JobFinders design system
 * Provides consistent color usage across the application
 */

export interface ColorPalette {
  primary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  secondary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  success: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  warning: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  error: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  neutral: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
}

export const lightColors: ColorPalette = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  secondary: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6',
    600: '#0d9488',
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
  },
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
};

export const darkColors: ColorPalette = {
  ...lightColors,
  primary: {
    ...lightColors.primary,
    500: '#60a5fa',
    600: '#3b82f6',
  },
  secondary: {
    ...lightColors.secondary,
    500: '#2dd4bf',
    600: '#14b8a6',
  },
};

export function getColor(colorName: keyof ColorPalette, shade: keyof ColorPalette[keyof ColorPalette], theme: 'light' | 'dark' = 'light'): string {
  const colors = theme === 'dark' ? darkColors : lightColors;
  return colors[colorName][shade];
}

export function getPrimaryColor(shade: keyof ColorPalette['primary'], theme: 'light' | 'dark' = 'light'): string {
  return getColor('primary', shade, theme);
}

export function getSecondaryColor(shade: keyof ColorPalette['secondary'], theme: 'light' | 'dark' = 'light'): string {
  return getColor('secondary', shade, theme);
}

export function getSuccessColor(shade: keyof ColorPalette['success'], theme: 'light' | 'dark' = 'light'): string {
  return getColor('success', shade, theme);
}

export function getWarningColor(shade: keyof ColorPalette['warning'], theme: 'light' | 'dark' = 'light'): string {
  return getColor('warning', shade, theme);
}

export function getErrorColor(shade: keyof ColorPalette['error'], theme: 'light' | 'dark' = 'light'): string {
  return getColor('error', shade, theme);
}

export function getNeutralColor(shade: keyof ColorPalette['neutral'], theme: 'light' | 'dark' = 'light'): string {
  return getColor('neutral', shade, theme);
}