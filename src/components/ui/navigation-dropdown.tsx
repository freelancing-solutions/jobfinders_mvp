'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Menu } from 'lucide-react'
import { NavigationItem } from '@/config/navigation'

interface NavigationDropdownProps {
  navigationItems: NavigationItem[]
}

export function NavigationDropdown({ navigationItems }: NavigationDropdownProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" aria-label="Navigation menu">
          <Menu className="h-4 w-4" />
          <span className="hidden sm:inline">Menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {navigationItems.map((item, index) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <React.Fragment key={item.href}>
              {/* Add separator before common items (Settings, Help Center) */}
              {index > 0 && 
               navigationItems[index - 1].roles && 
               !item.roles && (
                <DropdownMenuSeparator />
              )}
              
              <DropdownMenuItem asChild>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-2 py-2 cursor-pointer',
                    isActive && 'bg-accent text-accent-foreground'
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="h-4 w-4" />
                  <div className="flex flex-col flex-1">
                    <span className="font-medium">{item.label}</span>
                    {item.description && (
                      <span className="text-xs text-muted-foreground">
                        {item.description}
                      </span>
                    )}
                  </div>
                  {item.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              </DropdownMenuItem>
            </React.Fragment>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}