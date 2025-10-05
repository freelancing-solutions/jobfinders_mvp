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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import {
  Menu,
  Search,
  Briefcase,
  User,
  Settings,
  LogOut,
  Bell,
  Heart,
  Home,
  Building2,
  FileText,
  Plus,
} from 'lucide-react'

interface NavigationDropdownProps {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string
  }
}

export function NavigationDropdown({ user }: NavigationDropdownProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = React.useState(false)

  const navigationItems = [
    {
      title: 'Home',
      href: '/',
      icon: Home,
      description: 'Return to homepage',
    },
    {
      title: 'Search Jobs',
      href: '/jobs',
      icon: Search,
      description: 'Browse available positions',
    },
    {
      title: 'Companies',
      href: '/companies',
      icon: Building2,
      description: 'Explore companies',
    },
  ]

  const userMenuItems = user
    ? [
        {
          title: 'Dashboard',
          href: user.role === 'employer' ? '/employer/dashboard' : '/dashboard',
          icon: Briefcase,
          description: 'Your dashboard',
        },
        {
          title: 'Profile',
          href: '/profile',
          icon: User,
          description: 'Manage your profile',
        },
        {
          title: 'Saved Jobs',
          href: '/saved-jobs',
          icon: Heart,
          description: 'Your saved positions',
        },
        {
          title: 'Applications',
          href: '/applications',
          icon: FileText,
          description: 'Track your applications',
        },
        {
          title: 'Settings',
          href: '/settings',
          icon: Settings,
          description: 'Account settings',
        },
      ]
    : [
        {
          title: 'Sign In',
          href: '/auth/signin',
          icon: User,
          description: 'Sign in to your account',
        },
        {
          title: 'Sign Up',
          href: '/auth/signup',
          icon: Plus,
          description: 'Create a new account',
        },
      ]

  const employerItems = user?.role === 'employer'
    ? [
        {
          title: 'Post a Job',
          href: '/employer/jobs/post',
          icon: Plus,
          description: 'Create a new job listing',
          badge: 'New',
        },
      ]
    : []

  return (
    <div className="flex items-center gap-2">
      {/* Main Navigation Dropdown */}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Menu className="h-4 w-4" />
            <span className="hidden sm:inline">Menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <DropdownMenuItem key={item.href} asChild>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-2 py-2 cursor-pointer',
                    isActive && 'bg-accent text-accent-foreground'
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="font-medium">{item.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.description}
                    </span>
                  </div>
                </Link>
              </DropdownMenuItem>
            )
          })}
          
          {employerItems.length > 0 && (
            <>
              <DropdownMenuSeparator />
              {employerItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <DropdownMenuItem key={item.href} asChild>
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
                        <span className="font-medium">{item.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {item.description}
                        </span>
                      </div>
                      {item.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </DropdownMenuItem>
                )
              })}
            </>
          )}
          
          <DropdownMenuSeparator />
          
          {userMenuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <DropdownMenuItem key={item.href} asChild>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-2 py-2 cursor-pointer',
                    isActive && 'bg-accent text-accent-foreground'
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="font-medium">{item.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.description}
                    </span>
                  </div>
                </Link>
              </DropdownMenuItem>
            )
          })}
          
          {user && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex items-center gap-3 px-2 py-2 cursor-pointer text-muted-foreground">
                <LogOut className="h-4 w-4" />
                <span className="font-medium">Sign Out</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Notifications */}
      <Button variant="outline" size="icon" className="relative">
        <Bell className="h-4 w-4" />
        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
          3
        </span>
        <span className="sr-only">Notifications</span>
      </Button>

      {/* User Avatar */}
      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.image || ''} alt={user.name || ''} />
                <AvatarFallback>
                  {user.name
                    ? user.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)
                    : 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <div className="flex flex-col space-y-1 p-2">
              <p className="text-sm font-medium leading-none">{user.name}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button variant="outline" size="sm" asChild>
          <Link href="/auth/signin">
            <User className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Sign In</span>
          </Link>
        </Button>
      )}

      {/* Theme Toggle */}
      <ThemeToggle />
    </div>
  )
}