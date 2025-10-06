'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { type ThemeProviderProps } from 'next-themes/dist/types'
import { ColorPalette, lightColors, darkColors } from '@/lib/design-system/colors'

interface ThemeContextType {
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  resolvedTheme: 'light' | 'dark' | undefined
  colors: ColorPalette
  gradients: {
    primary: string
    secondary: string
    hero: string
    subtle: string
  }
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface CustomThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: 'light' | 'dark' | 'system'
  storageKey?: string
  enableSystem?: boolean
  attribute?: 'class' | 'data-theme'
  value?: {
    light: string
    dark: string
  }
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'jobfinders-theme',
  enableSystem = true,
  attribute = 'class',
  value,
  ...props
}: CustomThemeProviderProps & ThemeProviderProps) {
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>(defaultTheme)

  const colors = resolvedTheme === 'dark' ? darkColors : lightColors

  const gradients = {
    primary: resolvedTheme === 'dark'
      ? 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)'
      : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    secondary: resolvedTheme === 'dark'
      ? 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)'
      : 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
    hero: resolvedTheme === 'dark'
      ? 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #14b8a6 100%)'
      : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #0d9488 100%)',
    subtle: resolvedTheme === 'dark'
      ? 'linear-gradient(135deg, #1a1a1a 0%, #262626 100%)'
      : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
  }

  const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setThemeState(newTheme)
  }

  useEffect(() => {
    const root = window.document.documentElement

    if (attribute === 'class') {
      root.classList.remove('light', 'dark')

      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        root.classList.add(systemTheme)
        setResolvedTheme(systemTheme)
      } else {
        root.classList.add(theme)
        setResolvedTheme(theme as 'light' | 'dark')
      }
    } else {
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        root.setAttribute('data-theme', systemTheme)
        setResolvedTheme(systemTheme)
      } else {
        root.setAttribute('data-theme', theme)
        setResolvedTheme(theme as 'light' | 'dark')
      }
    }

    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, theme)
    }
  }, [theme, attribute, storageKey])

  useEffect(() => {
    // Load theme from localStorage on mount
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem(storageKey) as 'light' | 'dark' | 'system' | null
      if (savedTheme) {
        setThemeState(savedTheme)
      }
    }
  }, [storageKey])

  const contextValue: ThemeContextType = {
    theme,
    setTheme,
    resolvedTheme,
    colors,
    gradients,
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      <NextThemesProvider
        attribute={attribute}
        defaultTheme={defaultTheme}
        enableSystem={enableSystem}
        storageKey={storageKey}
        value={value}
        {...props}
      >
        {children}
      </NextThemesProvider>
    </ThemeContext.Provider>
  )
}