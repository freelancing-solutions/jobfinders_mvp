'use client'

import Link from 'next/link'
import { NavigationDropdown } from '@/components/ui/navigation-dropdown'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { NotificationDropdown } from '@/components/notifications/notification-dropdown'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import {
  Briefcase,
  MapPin,
  Heart,
  Building2,
  Users,
  FileText,
  Settings,
  CreditCard,
  Menu,
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
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Use hook data for role checking, with fallback to prop user
  const isEmployerUser = isEmployer || user?.role === 'EMPLOYER'

  const employerLinks = [
    {
      href: '/employer/dashboard',
      label: 'Dashboard',
      icon: Briefcase,
    },
    {
      href: '/employer/jobs',
      label: 'Jobs',
      icon: FileText,
    },
    {
      href: '/employer/applications',
      label: 'Applications',
      icon: Users,
    },
    {
      href: '/employer/company',
      label: 'Company Profile',
      icon: Building2,
    },
    {
      href: '/pricing',
      label: 'Subscription',
      icon: CreditCard,
    },
  ]

  const jobSeekerLinks = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: Briefcase,
    },
    {
      href: '/jobs',
      label: 'Find Jobs',
      icon: FileText,
    },
    {
      href: '/applications',
      label: 'My Applications',
      icon: Users,
    },
    {
      href: '/saved',
      label: 'Saved Jobs',
      icon: Heart,
    },
    {
      href: '/profile',
      label: 'Profile & Resume',
      icon: Settings,
    },
  ]

  const navigationLinks = isEmployerUser ? employerLinks : jobSeekerLinks

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

        {/* Navigation Links - Desktop */}
        {(isAuthenticated || user) && (
          <nav className="hidden md:flex items-center gap-6">
            {isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : (
              navigationLinks.map((link) => {
                const Icon = link.icon
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                )
              })
            )}
          </nav>
        )}

        {/* Navigation Controls */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Toggle */}
          {(isAuthenticated || user) && (
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          
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
              {isEmployerUser && (
                <Button asChild variant="default" size="sm">
                  <Link href="/employer/post">
                    Post Job
                  </Link>
                </Button>
              )}
              
              {/* User Menu */}
              <NavigationDropdown user={user} />
            </>
          ) : (
            <div className="flex items-center gap-2">
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

      {/* Mobile Navigation Menu */}
      {(isAuthenticated || user) && (
        <nav className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'} border-t`}>
          <div className="container mx-auto px-4 py-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Loading menu...</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {navigationLinks.map((link) => {
                  const Icon = link.icon
                  const isActive = pathname === link.href
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-2 p-3 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  )
}