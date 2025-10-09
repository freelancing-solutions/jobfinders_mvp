'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NavigationItem } from '@/config/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

interface MobileNavProps {
  navigationItems: NavigationItem[]
  className?: string
}

export function MobileNav({ navigationItems, className }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState<string[]>([])
  const pathname = usePathname()

  // For main navigation items (public), render them directly without grouping
  // For authenticated users, group by category for better organization
  const hasPublicItems = navigationItems.some(item =>
    ['/', '/jobs', '/companies', '/about', '/contact', '/pricing'].includes(item.href)
  )

  const groupedItems = hasPublicItems ? { '': navigationItems } : navigationItems.reduce((acc, item) => {
    const category = item.category || 'main'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(item)
    return acc
  }, {} as Record<string, NavigationItem[]>)

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  const handleLinkClick = () => {
    setIsOpen(false)
  }

  return (
    <div className={cn('md:hidden', className)}>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="px-2">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0">
          <SheetHeader className="p-6 border-b">
            <SheetTitle className="text-left">Navigation</SheetTitle>
          </SheetHeader>
          
          <div className="flex flex-col h-full">
            <nav className="flex-1 overflow-y-auto p-4 space-y-2">
              {Object.entries(groupedItems).map(([category, items]) => {
                const isExpanded = expandedSections.includes(category)
                const hasMultipleItems = items.length > 1
                const hasEmptyCategory = category === ''

                // For empty category (public items), render them directly without section
                if (hasEmptyCategory) {
                  return items.map((item) => {
                    const isActive = pathname === item.href ||
                      (item.href !== '/' && pathname.startsWith(item.href))

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={handleLinkClick}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-accent hover:text-accent-foreground'
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="flex-1">{item.label}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    )
                  })
                }

                if (!hasMultipleItems) {
                  // Single item - render directly
                  const item = items[0]
                  const isActive = pathname === item.href ||
                    (item.href !== '/' && pathname.startsWith(item.href))

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleLinkClick}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  )
                }

                // Multiple items - render as collapsible section
                return (
                  <Collapsible
                    key={category}
                    open={isExpanded}
                    onOpenChange={() => toggleSection(category)}
                  >
                    <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-left hover:bg-accent hover:text-accent-foreground rounded-md">
                      <span className="capitalize">{category}</span>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-1 mt-1">
                      {items.map((item) => {
                        const isActive = pathname === item.href ||
                          (item.href !== '/' && pathname.startsWith(item.href))

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={handleLinkClick}
                            className={cn(
                              'flex items-center gap-3 px-6 py-2 rounded-md text-sm transition-colors',
                              isActive
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-accent hover:text-accent-foreground'
                            )}
                          >
                            <item.icon className="h-4 w-4" />
                            <span className="flex-1">{item.label}</span>
                            {item.badge && (
                              <Badge variant="secondary" className="text-xs">
                                {item.badge}
                              </Badge>
                            )}
                          </Link>
                        )
                      })}
                    </CollapsibleContent>
                  </Collapsible>
                )
              })}
            </nav>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}