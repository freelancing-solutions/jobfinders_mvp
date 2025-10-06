# Design System Architecture

## System Overview

The JobFinders design system is built on a foundation of shadcn/ui components, enhanced with custom theming and layout patterns tailored for a professional SaaS job board platform. The system emphasizes consistency, accessibility, and maintainability while supporting both light and dark themes.

## Color System Architecture

### Primary Color Palette
```css
:root {
  /* Primary Brand Colors - Professional Blue/Indigo */
  --primary-50: #eff6ff;
  --primary-100: #dbeafe;
  --primary-200: #bfdbfe;
  --primary-300: #93c5fd;
  --primary-400: #60a5fa;
  --primary-500: #3b82f6; /* Main Primary */
  --primary-600: #2563eb;
  --primary-700: #1d4ed8;
  --primary-800: #1e40af;
  --primary-900: #1e3a8a;

  /* Secondary Colors */
  --secondary-50: #f0fdfa;
  --secondary-100: #ccfbf1;
  --secondary-200: #99f6e4;
  --secondary-300: #5eead4;
  --secondary-400: #2dd4bf;
  --secondary-500: #14b8a6; /* Teal Accent */
  --secondary-600: #0d9488;
  --secondary-700: #0f766e;
  --secondary-800: #115e59;
  --secondary-900: #134e4a;

  /* Success Colors */
  --success-50: #f0fdf4;
  --success-100: #dcfce7;
  --success-200: #bbf7d0;
  --success-300: #86efac;
  --success-400: #4ade80;
  --success-500: #22c55e; /* Green Success */
  --success-600: #16a34a;
  --success-700: #15803d;
  --success-800: #166534;
  --success-900: #14532d;

  /* Warning Colors */
  --warning-50: #fffbeb;
  --warning-100: #fef3c7;
  --warning-200: #fde68a;
  --warning-300: #fcd34d;
  --warning-400: #fbbf24;
  --warning-500: #f59e0b; /* Amber Warning */
  --warning-600: #d97706;
  --warning-700: #b45309;
  --warning-800: #92400e;
  --warning-900: #78350f;

  /* Error Colors */
  --error-50: #fef2f2;
  --error-100: #fee2e2;
  --error-200: #fecaca;
  --error-300: #fca5a5;
  --error-400: #f87171;
  --error-500: #ef4444; /* Red Error */
  --error-600: #dc2626;
  --error-700: #b91c1c;
  --error-800: #991b1b;
  --error-900: #7f1d1d;

  /* Neutral Colors */
  --neutral-50: #fafafa;
  --neutral-100: #f5f5f5;
  --neutral-200: #e5e5e5;
  --neutral-300: #d4d4d4;
  --neutral-400: #a3a3a3;
  --neutral-500: #737373;
  --neutral-600: #525252;
  --neutral-700: #404040;
  --neutral-800: #262626;
  --neutral-900: #171717;
}

.dark {
  /* Dark theme adjustments for better contrast */
  --background: #0f0f0f;
  --foreground: #fafafa;
  --card: #1a1a1a;
  --card-foreground: #fafafa;
  --popover: #1a1a1a;
  --popover-foreground: #fafafa;
  --primary: #60a5fa;
  --primary-foreground: #0f0f0f;
  --secondary: #14b8a6;
  --secondary-foreground: #0f0f0f;
  --muted: #262626;
  --muted-foreground: #a3a3a3;
  --accent: #262626;
  --accent-foreground: #fafafa;
  --destructive: #f87171;
  --destructive-foreground: #0f0f0f;
  --border: #404040;
  --input: #404040;
  --ring: #60a5fa;
}
```

### Gradient System
```css
/* Primary Gradients */
.gradient-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
}

.gradient-secondary {
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
}

.gradient-hero {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #0d9488 100%);
}

.gradient-subtle {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

.dark .gradient-subtle {
  background: linear-gradient(135deg, #1a1a1a 0%, #262626 100%);
}
```

## Typography System

### Font Stack
```css
.font-sans {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
               Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', sans-serif;
}

.font-mono {
  font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
}
```

### Typography Scale
```css
/* Fluid Typography Scale */
.text-xs { font-size: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem); }
.text-sm { font-size: clamp(0.875rem, 0.8rem + 0.375vw, 1rem); }
.text-base { font-size: clamp(1rem, 0.9rem + 0.5vw, 1.125rem); }
.text-lg { font-size: clamp(1.125rem, 1rem + 0.625vw, 1.25rem); }
.text-xl { font-size: clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem); }
.text-2xl { font-size: clamp(1.5rem, 1.3rem + 1vw, 2rem); }
.text-3xl { font-size: clamp(1.875rem, 1.6rem + 1.375vw, 2.5rem); }
.text-4xl { font-size: clamp(2.25rem, 1.9rem + 1.75vw, 3rem); }
.text-5xl { font-size: clamp(3rem, 2.5rem + 2.5vw, 4rem); }
```

### Line Height and Letter Spacing
```css
.leading-tight { line-height: 1.25; }
.leading-normal { line-height: 1.5; }
.leading-relaxed { line-height: 1.75; }

.tracking-tight { letter-spacing: -0.025em; }
.tracking-normal { letter-spacing: 0; }
.tracking-wide { letter-spacing: 0.025em; }
```

## Spacing System

### 8px Grid System
```css
/* Base spacing unit: 0.5rem (8px at 16px base) */
.space-1 { margin: 0.25rem; }  /* 4px */
.space-2 { margin: 0.5rem; }   /* 8px */
.space-3 { margin: 0.75rem; }  /* 12px */
.space-4 { margin: 1rem; }     /* 16px */
.space-5 { margin: 1.25rem; }  /* 20px */
.space-6 { margin: 1.5rem; }   /* 24px */
.space-8 { margin: 2rem; }     /* 32px */
.space-10 { margin: 2.5rem; }  /* 40px */
.space-12 { margin: 3rem; }    /* 48px */
.space-16 { margin: 4rem; }    /* 64px */
.space-20 { margin: 5rem; }    /* 80px */
.space-24 { margin: 6rem; }    /* 96px */
```

### Container System
```css
.container {
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  padding-left: 1rem;
  padding-right: 1rem;
}

@media (min-width: 640px) { .container { max-width: 640px; } }
@media (min-width: 768px) { .container { max-width: 768px; } }
@media (min-width: 1024px) { .container { max-width: 1024px; } }
@media (min-width: 1280px) { .container { max-width: 1280px; } }
@media (min-width: 1536px) { .container { max-width: 1536px; } }
```

## Component Architecture

### Layout Components

#### PageLayout Component
```typescript
interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  background?: 'default' | 'muted' | 'subtle';
}

// Standard page wrapper with consistent spacing and container
```

#### SectionLayout Component
```typescript
interface SectionLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
  spacing?: 'sm' | 'md' | 'lg' | 'xl';
  background?: 'default' | 'muted' | 'primary' | 'gradient';
  container?: boolean;
}

// Reusable section component with optional header
```

#### HeroSection Component
```typescript
interface HeroSectionProps {
  title: string;
  subtitle?: string;
  description?: string;
  actions?: React.ReactNode;
  backgroundImage?: string;
  background?: 'gradient' | 'image' | 'color';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  alignment?: 'left' | 'center' | 'right';
}

// Hero section with configurable background and layout
```

### Enhanced shadcn/ui Components

#### Card Variants
```typescript
interface CardProps {
  variant?: 'default' | 'elevated' | 'outlined' | 'ghost';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  interactive?: boolean;
}

// Enhanced Card component with multiple visual styles
```

#### Button System
```typescript
interface ButtonProps {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

// Enhanced Button with consistent styling states
```

## Theme Provider Architecture

### Custom Theme Provider
```typescript
interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: 'light' | 'dark' | 'system';
  storageKey?: string;
  enableSystem?: boolean;
  attribute?: 'class' | 'data-theme';
  value?: {
    light: string;
    dark: string;
  };
}

// Enhanced theme provider with custom color mappings
```

### Theme Context
```typescript
interface ThemeContextType {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  resolvedTheme: 'light' | 'dark';
  colors: ColorPalette;
  gradients: GradientPalette;
}

// Theme context with access to current color palette
```

## Responsive Design System

### Breakpoint System
```css
/* Mobile-first responsive breakpoints */
sm: 640px   /* Small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Small desktops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large desktops */
```

### Responsive Spacing
```css
/* Responsive spacing utilities */
.p-responsive { padding: clamp(1rem, 2.5vw, 2rem); }
.py-responsive { padding-top: clamp(1rem, 2.5vw, 2rem); padding-bottom: clamp(1rem, 2.5vw, 2rem); }
.px-responsive { padding-left: clamp(1rem, 2.5vw, 2rem); padding-right: clamp(1rem, 2.5vw, 2rem); }
```

## Animation System

### Transition Utilities
```css
.transition-base {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.transition-slow {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}

.transition-fast {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 75ms;
}
```

### Motion Presets
```css
.motion-safe {
  /* Respect prefers-reduced-motion */
}

.motion-reduce {
  /* Simplified animations for reduced motion preference */
}
```

## Integration Strategy

### With shadcn/ui
- Extend existing shadcn/ui component variants
- Maintain backward compatibility
- Use shadcn/ui's CSS variable system
- Follow shadcn/ui component patterns

### With Tailwind CSS
- Use Tailwind's CSS-in-JS approach
- Extend Tailwind's default configuration
- Utilize Tailwind's responsive utilities
- Maintain Tailwind's utility-first approach

### With Next.js
- Support Next.js 15 App Router
- Server-side rendering compatible
- Optimized for Next.js caching
- Works with Next.js font optimization

## File Structure
```
src/
├── components/
│   ├── design-system/
│   │   ├── theme/
│   │   │   ├── theme-provider.tsx
│   │   │   ├── theme-toggle.tsx
│   │   │   └── theme-context.tsx
│   │   ├── layout/
│   │   │   ├── page-layout.tsx
│   │   │   ├── section-layout.tsx
│   │   │   ├── hero-section.tsx
│   │   │   └── container.tsx
│   │   ├── ui/
│   │   │   ├── enhanced-card.tsx
│   │   │   ├── enhanced-button.tsx
│   │   │   └── enhanced-input.tsx
│   │   └── styles/
│   │       ├── globals.css
│   │       ├── components.css
│   │       └── utilities.css
├── lib/
│   ├── design-system/
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   └── animations.ts
│   └── utils/
│       ├── cn.ts
│       └── theme.ts
```

This architecture provides a comprehensive, scalable design system that ensures consistency while maintaining flexibility for future enhancements.