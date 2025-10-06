'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { type ThemeProviderProps } from 'next-themes/dist/types'
import { ThemeProvider as CustomThemeProvider } from '@/components/design-system/theme/theme-context'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <CustomThemeProvider {...props}>
      <NextThemesProvider {...props}>
        {children}
      </NextThemesProvider>
    </CustomThemeProvider>
  )
}