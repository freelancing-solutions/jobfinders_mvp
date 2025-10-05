export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  type: 'full-time' | 'part-time' | 'contract' | 'internship' | 'temporary';
  category: string;
  experience: 'entry' | 'mid' | 'senior' | 'executive';
  remote: boolean;
  featured: boolean;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  applicationCount: number;
  viewCount: number;
  companyLogo?: string;
  companySize?: string;
  industry?: string;
  website?: string;
  tags: string[];
  benefits?: string[];
}

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
  results: Job[];
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
  jobs: Job[];
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