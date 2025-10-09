'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { 
  User, 
  Settings, 
  LogOut, 
  Briefcase, 
  Heart, 
  FileText, 
  CreditCard, 
  Bell, 
  Shield,
  BarChart3,
  Users,
  Building,
  Tags,
  HelpCircle,
  MessageSquare
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { UserRole } from '@/types/roles'

interface UserMenuProps {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string
  }
  className?: string
}

export function UserMenu({ user: propUser, className }: UserMenuProps) {
  const [isSigningOut, setIsSigningOut] = useState(false)
  const { user: hookUser, isLoading, isJobSeeker, isEmployer, isAdmin } = useCurrentUser()
  
  // Use prop user if provided, otherwise use hook user
  const user = propUser || hookUser

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut({ 
        callbackUrl: '/auth/signin',
        redirect: true 
      })
    } catch (error) {
      console.error('Sign out error:', error)
      setIsSigningOut(false)
    }
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case UserRole.ADMIN:
        return <Badge variant="destructive" className="text-xs">Admin</Badge>
      case UserRole.EMPLOYER:
        return <Badge variant="default" className="text-xs">Employer</Badge>
      case UserRole.JOB_SEEKER:
        return <Badge variant="secondary" className="text-xs">Job Seeker</Badge>
      default:
        return null
    }
  }

  if (isLoading && !propUser) {
    return (
      <Button variant="ghost" size="icon" disabled className={className}>
        <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
      </Button>
    )
  }

  if (!user) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={`relative h-10 w-10 rounded-full ${className}`}>
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.image || ''} alt={user.name || 'User'} />
            <AvatarFallback className="text-sm">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium leading-none">
                {user.name || 'User'}
              </p>
              {getRoleBadge(user.role)}
            </div>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {/* Profile & Account */}
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/profile" className="flex items-center">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings" className="flex items-center">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/notifications" className="flex items-center">
              <Bell className="mr-2 h-4 w-4" />
              <span>Notifications</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Role-specific menu items */}
        {isJobSeeker && (
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href="/jobs/saved" className="flex items-center">
                <Heart className="mr-2 h-4 w-4" />
                <span>Saved Jobs</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/applications" className="flex items-center">
                <FileText className="mr-2 h-4 w-4" />
                <span>My Applications</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        )}

        {isEmployer && (
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href="/employer/jobs" className="flex items-center">
                <Briefcase className="mr-2 h-4 w-4" />
                <span>My Job Posts</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/employer/company" className="flex items-center">
                <Building className="mr-2 h-4 w-4" />
                <span>Company Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/employer/candidates" className="flex items-center">
                <Users className="mr-2 h-4 w-4" />
                <span>Candidates</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        )}

        {isAdmin && (
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href="/admin/dashboard" className="flex items-center">
                <BarChart3 className="mr-2 h-4 w-4" />
                <span>Admin Dashboard</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/users" className="flex items-center">
                <Shield className="mr-2 h-4 w-4" />
                <span>User Management</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/categories" className="flex items-center">
                <Tags className="mr-2 h-4 w-4" />
                <span>Categories</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        )}

        <DropdownMenuSeparator />

        {/* Billing & Subscription (for non-admin users) */}
        {!isAdmin && (
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href="/settings/billing" className="flex items-center">
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Billing & Subscription</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        )}

        <DropdownMenuSeparator />

        {/* Support & Help */}
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/help" className="flex items-center">
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>Help & Support</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/contact" className="flex items-center">
              <MessageSquare className="mr-2 h-4 w-4" />
              <span>Contact Us</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          className="text-red-600 focus:text-red-600 focus:bg-red-50"
          onClick={handleSignOut}
          disabled={isSigningOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isSigningOut ? 'Signing out...' : 'Sign out'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}