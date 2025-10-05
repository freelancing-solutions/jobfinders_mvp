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
} from 'lucide-react';

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
    roles: ['job_seeker'],
  },
  {
    href: '/jobs',
    label: 'Find Jobs',
    icon: Search,
    description: 'Browse available positions',
    roles: ['job_seeker'],
  },
  {
    href: '/applications',
    label: 'My Applications',
    icon: FileText,
    description: 'Track your job applications',
    roles: ['job_seeker'],
  },
  {
    href: '/saved-jobs',
    label: 'Saved Jobs',
    icon: Heart,
    description: 'Your bookmarked positions',
    roles: ['job_seeker'],
  },
  {
    href: '/profile',
    label: 'Profile & Resume',
    icon: Users,
    description: 'Manage your profile and resume',
    roles: ['job_seeker'],
  },
];

// Navigation items for employers
export const employerNavigationItems: NavigationItem[] = [
  {
    href: '/employer/dashboard',
    label: 'Dashboard',
    icon: Home,
    description: 'Your hiring overview',
    roles: ['employer'],
  },
  {
    href: '/employer/jobs',
    label: 'My Jobs',
    icon: Briefcase,
    description: 'Manage your job postings',
    roles: ['employer'],
  },
  {
    href: '/employer/applications',
    label: 'Applications',
    icon: FileText,
    description: 'Review candidate applications',
    roles: ['employer'],
  },
  {
    href: '/employer/company',
    label: 'Company Profile',
    icon: Building2,
    description: 'Manage your company profile',
    roles: ['employer'],
  },
  {
    href: '/employer/post-job',
    label: 'Post Job',
    icon: Plus,
    description: 'Create a new job posting',
    roles: ['employer'],
    badge: 'New',
  },
  {
    href: '/employer/subscription',
    label: 'Subscription',
    icon: CreditCard,
    description: 'Manage your subscription',
    roles: ['employer'],
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
 * @param role - User role ('job_seeker' | 'employer' | undefined)
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

  if (role === 'job_seeker') {
    navigationItems = [...jobSeekerNavigationItems];
  } else if (role === 'employer') {
    navigationItems = [...employerNavigationItems];
  }

  // Add common items for all authenticated users
  navigationItems.push(...commonNavigationItems);

  return navigationItems;
}