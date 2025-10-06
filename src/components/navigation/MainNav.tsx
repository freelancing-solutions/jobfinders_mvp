'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { NavigationItem } from '@/config/navigation'
import { Badge } from '@/components/ui/badge'

interface MainNavProps {
  navigationItems: NavigationItem[]
  className?: string
}

export function MainNav({ navigationItems, className }: MainNavProps) {
  const pathname = usePathname()

  return (
    <nav className={cn('hidden md:flex items-center space-x-6', className)}>
      {navigationItems.map((item) => {
        const isActive = pathname === item.href || 
          (item.href !== '/' && pathname.startsWith(item.href))
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary',
              isActive 
                ? 'text-foreground' 
                : 'text-muted-foreground'
            )}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
            {item.badge && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                {item.badge}
              </Badge>
            )}
          </Link>
        )
      })}
    </nav>
  )
}