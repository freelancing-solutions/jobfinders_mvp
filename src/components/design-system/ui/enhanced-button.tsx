'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { useTheme } from '@/components/design-system/theme/theme-context'
import { Loader2 } from 'lucide-react'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm-fluid font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        primary: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        outline: 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        success: 'bg-success text-success-foreground shadow-sm hover:bg-success/90',
        warning: 'bg-warning text-warning-foreground shadow-sm hover:bg-warning/90',
        gradient: 'gradient-primary text-primary-foreground shadow hover:opacity-90',
      },
      size: {
        xs: 'h-8 px-3 text-xs-fluid',
        sm: 'h-9 px-3 text-sm-fluid',
        md: 'h-10 px-4 py-2',
        lg: 'h-11 px-8 text-lg-fluid',
        xl: 'h-12 px-10 text-xl-fluid',
        icon: 'h-10 w-10',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
      loading: {
        true: 'cursor-not-allowed',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      fullWidth: false,
      loading: false,
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant,
    size,
    fullWidth,
    loading = false,
    leftIcon,
    rightIcon,
    children,
    disabled,
    asChild = false,
    ...props
  }, ref) => {
    const { resolvedTheme } = useTheme()
    const Comp = asChild ? Slot : 'button'

    const renderLeftIcon = () => {
      if (loading) return <Loader2 className="h-4 w-4 animate-spin" />
      if (leftIcon) return leftIcon
      return null
    }

    const renderRightIcon = () => {
      if (loading) return null // Loading icon only shows on the left
      if (rightIcon) return rightIcon
      return null
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, fullWidth, loading, className }))}
        ref={ref}
        disabled={disabled || loading}
        data-theme={resolvedTheme}
        {...props}
      >
        <span className="flex items-center gap-2">
          {renderLeftIcon()}
          {children}
          {renderRightIcon()}
        </span>
      </Comp>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }