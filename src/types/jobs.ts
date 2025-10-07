// Company model from Prisma schema
export interface Company {
  companyId: string;
  name: string;
  description?: string;
  industry?: string;
  website?: string;
  logoUrl?: string;
  city?: string;
  province?: string;
  country?: string;
  contactEmail?: string;
  phoneNumber?: string;
  billingEmail?: string;
  sendInvoiceEmails: boolean;
  sendTrialReminders: boolean;
  employeeCount?: number;
  foundedYear?: number;
  techStack?: string[];
  linkedinUrl?: string;
  twitterHandle?: string;
  isVerified: boolean;
  verificationStatus?: string;
  createdAt: string;
  updatedAt: string;
}

// JobCategory model from Prisma schema
export interface JobCategory {
  categoryId: string;
  name: string;
  description?: string;
  slug: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// EmployerProfile model from Prisma schema
export interface Employer {
  employerId: string;
  userUid: string;
  companyId: string;
  isVerified: boolean;
  isAdmin: boolean;
  verificationToken?: string;
  verificationTokenExpiresAt?: string;
  fullName?: string;
  jobTitle?: string;
  profilePictureUrl?: string;
  bio?: string;
  companyEmail?: string;
  personalEmail?: string;
  phoneNumber?: string;
  alternatePhone?: string;
  linkedinUrl?: string;
  twitterHandle?: string;
  department?: string;
  hireDate?: string;
}

// Job model from Prisma schema
export interface Job {
  jobId: string;
  title: string;
  companyId: string;
  employerId: string;
  categoryId?: string;
  description: string;
  requirements: any; // Json field - can contain essential/preferred arrays
  location?: string;
  salary?: any; // Json field - can contain min/max/currency
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'PAUSED' | 'EXPIRED' | 'DELETED';
  applicantCount: number;
  isRemote: boolean;
  experienceLevel?: string;
  employmentType?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  adminProfileId?: string;

  // Relationships
  company?: Company;
  category?: JobCategory;
  employer?: Employer;
  applications?: any[]; // JobApplication[]
  savedJobs?: any[]; // SavedJob[]
  matches?: any[]; // Match[]
}

// Simplified interface for frontend consumption (backward compatibility)
export interface JobDisplay {
  id: string;
  title: string;
  company: {
    id: string;
    name: string;
    logo?: string;
    isVerified: boolean;
  };
  category?: {
    id: string;
    name: string;
    icon?: string;
    color?: string;
  };
  location?: string;
  description: string;
  requirements: {
    essential: string[];
    preferred: string[];
  };
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  type?: string;
  experience?: string;
  remote: boolean;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  applicationCount: number;
  companyLogo?: string;
  employer?: {
    id: string;
    name: string;
  };
  tags: string[];
  benefits?: string[];
}

// For backward compatibility, export Job as alias to JobDisplay
export type Job = JobDisplay;

export interface SearchFilters {
  query?: string;
  location?: string;
  category?: string;
  salaryMin?: number;
  salaryMax?: number;
  experience?: 'entry' | 'mid' | 'senior' | 'executive';
  type?: 'full-time' | 'part-time' | 'contract' | 'internship' | 'temporary';
  remote?: boolean;
  sortBy?: 'relevance' | 'date' | 'salary' | 'popularity';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchState {
  filters: SearchFilters;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  view: 'grid' | 'list';
  isLoading: boolean;
  error: string | null;
  results: JobDisplay[];
  hasSearched: boolean;
}

export interface SearchAction {
  type: 'SET_FILTER' | 'CLEAR_FILTERS' | 'SET_PAGINATION' | 'SET_VIEW' | 'SET_LOADING' | 'SET_ERROR' | 'SET_RESULTS' | 'RESET_SEARCH';
  payload?: any;
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  filters: SearchFilters;
  timestamp: string;
  resultCount: number;
}

export interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilters;
  createdAt: string;
  notifications: boolean;
  frequency: 'instant' | 'daily' | 'weekly';
}

export interface JobSearchResponse {
  jobs: JobDisplay[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  facets: {
    categories: { name: string; count: number }[];
    locations: { name: string; count: number }[];
    types: { name: string; count: number }[];
    experience: { name: string; count: number }[];
  };
  suggestions?: string[];
}