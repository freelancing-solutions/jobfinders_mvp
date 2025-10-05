import { SearchFilters, Job } from '@/types/jobs';

export const JOB_CATEGORIES = [
  'Engineering',
  'Design',
  'Marketing',
  'Sales',
  'Customer Support',
  'Product',
  'Data Science',
  'Operations',
  'HR',
  'Finance',
  'Legal',
  'Education',
  'Healthcare',
  'Consulting',
  'Other'
] as const;

export const JOB_TYPES = [
  { value: 'full-time', label: 'Full Time' },
  { value: 'part-time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
  { value: 'temporary', label: 'Temporary' }
] as const;

export const EXPERIENCE_LEVELS = [
  { value: 'entry', label: 'Entry Level' },
  { value: 'mid', label: 'Mid Level' },
  { value: 'senior', label: 'Senior Level' },
  { value: 'executive', label: 'Executive' }
] as const;

export const SORT_OPTIONS = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'date', label: 'Most Recent' },
  { value: 'salary', label: 'Highest Salary' },
  { value: 'popularity', label: 'Most Popular' }
] as const;

export const SALARY_RANGES = [
  { min: 0, max: 50000, label: 'Under $50k' },
  { min: 50000, max: 75000, label: '$50k - $75k' },
  { min: 75000, max: 100000, label: '$75k - $100k' },
  { min: 100000, max: 150000, label: '$100k - $150k' },
  { min: 150000, max: 200000, label: '$150k - $200k' },
  { min: 200000, max: Infinity, label: 'Over $200k' }
] as const;

export function formatSalary(salary: { min: number; max: number; currency: string }): string {
  const { min, max, currency } = salary;
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  if (min === max) {
    return formatter.format(min);
  }

  return `${formatter.format(min)} - ${formatter.format(max)}`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  }
}

export function getLocationString(location: string): string {
  // You can enhance this with more sophisticated location formatting
  return location;
}

export function getJobTypeLabel(type: string): string {
  const jobType = JOB_TYPES.find(t => t.value === type);
  return jobType?.label || type;
}

export function getExperienceLabel(experience: string): string {
  const expLevel = EXPERIENCE_LEVELS.find(e => e.value === experience);
  return expLevel?.label || experience;
}

export function validateSearchFilters(filters: Partial<SearchFilters>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate salary range
  if (filters.salaryMin !== undefined && filters.salaryMax !== undefined) {
    if (filters.salaryMin > filters.salaryMax) {
      errors.push('Minimum salary cannot be greater than maximum salary');
    }
  }

  // Validate salary values
  if (filters.salaryMin !== undefined && filters.salaryMin < 0) {
    errors.push('Minimum salary cannot be negative');
  }

  if (filters.salaryMax !== undefined && filters.salaryMax < 0) {
    errors.push('Maximum salary cannot be negative');
  }

  // Validate query length
  if (filters.query !== undefined && filters.query.length > 200) {
    errors.push('Search query is too long (maximum 200 characters)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function sanitizeSearchFilters(filters: Partial<SearchFilters>): SearchFilters {
  const sanitized: SearchFilters = {};

  if (filters.query && filters.query.trim()) {
    sanitized.query = filters.query.trim();
  }

  if (filters.location && filters.location.trim()) {
    sanitized.location = filters.location.trim();
  }

  if (filters.category) {
    sanitized.category = filters.category;
  }

  if (filters.salaryMin !== undefined && filters.salaryMin > 0) {
    sanitized.salaryMin = Math.floor(filters.salaryMin);
  }

  if (filters.salaryMax !== undefined && filters.salaryMax > 0) {
    sanitized.salaryMax = Math.floor(filters.salaryMax);
  }

  if (filters.experience) {
    sanitized.experience = filters.experience;
  }

  if (filters.type) {
    sanitized.type = filters.type;
  }

  if (filters.remote !== undefined) {
    sanitized.remote = filters.remote;
  }

  if (filters.sortBy) {
    sanitized.sortBy = filters.sortBy;
  }

  if (filters.sortOrder) {
    sanitized.sortOrder = filters.sortOrder;
  }

  return sanitized;
}

export function createSearchQuery(filters: SearchFilters): string {
  const parts: string[] = [];

  if (filters.query) {
    parts.push(filters.query);
  }

  if (filters.location) {
    parts.push(`in ${filters.location}`);
  }

  if (filters.category) {
    parts.push(`in ${filters.category}`);
  }

  if (filters.type) {
    parts.push(getJobTypeLabel(filters.type));
  }

  if (filters.experience) {
    parts.push(getExperienceLabel(filters.experience));
  }

  if (filters.remote) {
    parts.push('Remote');
  }

  return parts.join(' ');
}

export function parseSearchQuery(query: string): Partial<SearchFilters> {
  const filters: Partial<SearchFilters> = {};
  
  // This is a simple implementation - you can make it more sophisticated
  const lowerQuery = query.toLowerCase();
  
  // Check for remote
  if (lowerQuery.includes('remote')) {
    filters.remote = true;
  }
  
  // Check for job types
  for (const type of JOB_TYPES) {
    if (lowerQuery.includes(type.label.toLowerCase())) {
      filters.type = type.value as any;
      break;
    }
  }
  
  // Check for experience levels
  for (const exp of EXPERIENCE_LEVELS) {
    if (lowerQuery.includes(exp.label.toLowerCase())) {
      filters.experience = exp.value as any;
      break;
    }
  }
  
  // Extract the main search query (remove known patterns)
  let cleanQuery = query;
  cleanQuery = cleanQuery.replace(/\b(remote|full time|part time|contract|internship|temporary)\b/gi, '');
  cleanQuery = cleanQuery.replace(/\b(entry level|mid level|senior level|executive)\b/gi, '');
  cleanQuery = cleanQuery.replace(/\bin\s+[^,\s]+/gi, ''); // Remove "in location"
  
  cleanQuery = cleanQuery.trim();
  if (cleanQuery) {
    filters.query = cleanQuery;
  }
  
  return filters;
}