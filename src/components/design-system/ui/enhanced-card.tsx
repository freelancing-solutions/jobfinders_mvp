'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { useTheme } from '@/components/design-system/theme/theme-context'

const cardVariants = cva(
  'rounded-lg border transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'bg-card text-card-foreground shadow-sm',
        elevated: 'bg-card text-card-foreground shadow-md hover:shadow-lg',
        outlined: 'bg-card/50 text-card-foreground border-2 backdrop-blur-sm',
        ghost: 'bg-transparent text-card-foreground border-0 shadow-none',
      },
      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
      hover: {
        true: 'hover:shadow-lg hover:-translate-y-1 cursor-pointer',
        false: '',
      },
      interactive: {
        true: 'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
      hover: false,
      interactive: false,
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, hover, interactive, asChild = false, ...props }, ref) => {
    const { resolvedTheme } = useTheme()

    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, padding, hover, interactive, className }))}
        data-theme={resolvedTheme}
        {...props}
      />
    )
  }
)
Card.displayName = 'Card'

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
))
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-2xl-fluid font-semibold leading-none tracking-tight', className)}
    {...props}
  />
))
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm-fluid text-muted-foreground', className)}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
))
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
))
CardFooter.displayName = 'CardFooter'

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
}