import {
  Briefcase,
  FileText,
  Users,
  Heart,
  Settings,
  Building2,
  CreditCard,
  Home,
  Search,
  HelpCircle,
  Plus,
  BarChart3,
  Shield,
  UserCheck,
  Tags,
  Info,
  Mail,
} from 'lucide-react';
import { UserRole, LegacyUserRole, hasJobSeekerAccess, hasEmployerAccess, hasAdminAccess } from '../types/roles';

export interface NavigationItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  roles?: string[];
  badge?: string;
}

// Navigation items for unauthenticated users
export const publicNavigationItems: NavigationItem[] = [
  {
    href: '/',
    label: 'Home',
    icon: Home,
    description: 'Go to homepage',
  },
  {
    href: '/jobs',
    label: 'Browse Jobs',
    icon: Search,
    description: 'Find your next opportunity',
  },
  {
    href: '/companies',
    label: 'Companies',
    icon: Building2,
    description: 'Explore companies',
  },
  {
    href: '/about',
    label: 'About',
    icon: Info,
    description: 'Learn about us',
  },
  {
    href: '/contact',
    label: 'Contact',
    icon: Mail,
    description: 'Get in touch',
  },
  {
    href: '/pricing',
    label: 'Pricing',
    icon: CreditCard,
    description: 'View our pricing plans',
  },
];

// Navigation items for job seekers
export const jobSeekerNavigationItems: NavigationItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: Home,
    description: 'Your job search overview',
    roles: ['SEEKER'],
  },
  {
    href: '/jobs',
    label: 'Find Jobs',
    icon: Search,
    description: 'Browse available positions',
    roles: ['SEEKER'],
  },
  {
    href: '/applications',
    label: 'My Applications',
    icon: FileText,
    description: 'Track your job applications',
    roles: ['SEEKER'],
  },
  {
    href: '/saved-jobs',
    label: 'Saved Jobs',
    icon: Heart,
    description: 'Your bookmarked positions',
    roles: ['SEEKER'],
  },
  {
    href: '/profile',
    label: 'Profile & Resume',
    icon: Users,
    description: 'Manage your profile and resume',
    roles: ['SEEKER'],
  },
];

// Navigation items for employers
export const employerNavigationItems: NavigationItem[] = [
  {
    href: '/employer/dashboard',
    label: 'Dashboard',
    icon: Home,
    description: 'Your hiring overview',
    roles: ['EMPLOYER'],
  },
  {
    href: '/employer/jobs',
    label: 'My Jobs',
    icon: Briefcase,
    description: 'Manage your job postings',
    roles: ['EMPLOYER'],
  },
  {
    href: '/employer/applications',
    label: 'Applications',
    icon: FileText,
    description: 'Review candidate applications',
    roles: ['EMPLOYER'],
  },
  {
    href: '/employer/company',
    label: 'Company Profile',
    icon: Building2,
    description: 'Manage your company profile',
    roles: ['EMPLOYER'],
  },
  {
    href: '/employer/post-job',
    label: 'Post Job',
    icon: Plus,
    description: 'Create a new job posting',
    roles: ['EMPLOYER'],
    badge: 'New',
  },
  {
    href: '/employer/subscription',
    label: 'Subscription',
    icon: CreditCard,
    description: 'Manage your subscription',
    roles: ['EMPLOYER'],
  },
];

// Navigation items for admin users
export const adminNavigationItems: NavigationItem[] = [
  {
    href: '/admin/dashboard',
    label: 'Admin Dashboard',
    icon: BarChart3,
    description: 'System overview and analytics',
    roles: ['ADMIN'],
  },
  {
    href: '/admin/users',
    label: 'User Management',
    icon: Users,
    description: 'Manage users and permissions',
    roles: ['ADMIN'],
  },
  {
    href: '/admin/jobs',
    label: 'Job Management',
    icon: Briefcase,
    description: 'Manage job postings',
    roles: ['ADMIN'],
  },
  {
    href: '/admin/companies',
    label: 'Company Management',
    icon: Building2,
    description: 'Manage company profiles',
    roles: ['ADMIN'],
  },
  {
    href: '/admin/categories',
    label: 'Category Management',
    icon: Tags,
    description: 'Manage job categories',
    roles: ['ADMIN'],
  },
  {
    href: '/admin/analytics',
    label: 'Analytics',
    icon: BarChart3,
    description: 'Platform analytics and reports',
    roles: ['ADMIN'],
  },
];

// Common navigation items for all authenticated users
export const commonNavigationItems: NavigationItem[] = [
  {
    href: '/settings',
    label: 'Settings',
    icon: Settings,
    description: 'Account and preferences',
  },
  {
    href: '/help',
    label: 'Help Center',
    icon: HelpCircle,
    description: 'Get support and answers',
  },
];

/**
 * Get navigation items based on user role and authentication status
 * @param role - User role ('SEEKER' | 'EMPLOYER' | 'ADMIN' | undefined)
 * @param isAuthenticated - Whether user is authenticated
 * @returns Array of navigation items appropriate for the user
 */
export function getNavigationItems(
  role: string | undefined,
  isAuthenticated: boolean
): NavigationItem[] {
  if (!isAuthenticated) {
    return publicNavigationItems;
  }

  let navigationItems: NavigationItem[] = [];

  // Use proper role helper functions instead of string comparisons
  if (hasJobSeekerAccess(role)) {
    navigationItems = [...jobSeekerNavigationItems];
  } else if (hasEmployerAccess(role)) {
    navigationItems = [...employerNavigationItems];
  } else if (hasAdminAccess(role)) {
    navigationItems = [...adminNavigationItems];
  }

  // Add common items for all authenticated users
  navigationItems.push(...commonNavigationItems);

  return navigationItems;
}