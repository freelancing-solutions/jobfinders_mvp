'use client'

import { cn } from '@/lib/utils'
import { calculatePasswordStrength } from '@/lib/auth/reset-token'

interface PasswordStrengthIndicatorProps {
  password: string
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const strength = calculatePasswordStrength(password)
  
  const strengthColors = [
    'bg-red-500',
    'bg-orange-500', 
    'bg-yellow-500',
    'bg-lime-500',
    'bg-green-500'
  ]
  
  const strengthLabels = [
    'Very Weak',
    'Weak',
    'Fair',
    'Good',
    'Strong'
  ]

  const strengthTextColors = [
    'text-red-600',
    'text-orange-600',
    'text-yellow-600', 
    'text-lime-600',
    'text-green-600'
  ]

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-2 flex-1 rounded-full transition-colors duration-200',
              i < strength ? strengthColors[strength] : 'bg-gray-200'
            )}
          />
        ))}
      </div>
      <div className="flex justify-between items-center">
        <p className={cn(
          'text-xs font-medium',
          strengthTextColors[strength]
        )}>
          Password strength: {strengthLabels[strength]}
        </p>
        {password.length > 0 && (
          <div className="text-xs text-muted-foreground">
            {password.length}/128 characters
          </div>
        )}
      </div>
    </div>
  )
}