'use client'

import Link from 'next/link'
import { NavigationDropdown } from '@/components/ui/navigation-dropdown'
import { UserAvatarDropdown } from '@/components/ui/user-avatar-dropdown'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Button } from '@/components/ui/button'
import { NotificationDropdown } from '@/components/notifications/notification-dropdown'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { getNavigationItems } from '@/config/navigation'
import {
  Briefcase,
  MapPin,
  Loader2
} from 'lucide-react'

interface NavigationHeaderProps {
  // Made optional since we now use the hook internally
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string
  }
}

export function NavigationHeader({ user: propUser }: NavigationHeaderProps) {
  // Use the useCurrentUser hook for consistent user data
  const { 
    user: hookUser, 
    isLoading, 
    isAuthenticated, 
    isUnauthenticated,
    isJobSeeker,
    isEmployer,
    displayName,
    avatarUrl,
    initials
  } = useCurrentUser()
  
  // Use hook user data if available, fallback to prop user for backward compatibility
  const user = hookUser || propUser
  
  // Get navigation items based on user state
  const navigationItems = getNavigationItems(user, isAuthenticated)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Main Header */}
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold">Job Finders</h1>
              <p className="text-xs text-muted-foreground">South Africa</p>
            </div>
          </Link>

          {/* Location Indicator */}
          <div className="hidden md:flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>South Africa</span>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center gap-4">
          {/* Navigation Dropdown */}
          <NavigationDropdown navigationItems={navigationItems} />
          
          {/* Quick Actions */}
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
            </div>
          ) : (isAuthenticated || user) ? (
            <>
              {/* Notifications */}
              <NotificationDropdown />
              
              {/* Post Job Button for Employers */}
              {isEmployer && (
                <Button asChild variant="default" size="sm">
                  <Link href="/employer/post">
                    Post Job
                  </Link>
                </Button>
              )}
              
              {/* Theme Toggle */}
              <ThemeToggle />
              
              {/* User Avatar Dropdown */}
              <UserAvatarDropdown user={user} />
            </>
          ) : (
            <div className="flex items-center gap-2">
              {/* Theme Toggle for unauthenticated users */}
              <ThemeToggle />
              
              <Button variant="ghost" size="sm" asChild>
                <Link href="/auth/signin">
                  Sign In
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/auth/signup">
                  Sign Up
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}