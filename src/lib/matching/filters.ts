import {
  MatchFilters,
  SortOptions,
  FilterOperator,
  FilterField,
  CandidateProfile,
  JobProfile
} from '@/types/matching';

/**
 * Advanced filtering and sorting utilities for matching
 */
export class MatchFiltersBuilder {
  /**
   * Build where clause for candidate queries
   */
  static buildCandidateFilters(filters: MatchFilters): any {
    const whereClause: any = {};

    // Skills filter
    if (filters.skills) {
      whereClause.skills = {
        path: [],
        string_contains: filters.skills.join(' ')
      };
    }

    // Location filter
    if (filters.location) {
      whereClause.location = {
        path: ['city'],
        string_contains: filters.location
      };
    }

    // Experience level filter
    if (filters.experienceLevel) {
      if (Array.isArray(filters.experienceLevel)) {
        whereClause.experience = {
          some: {
            level: { in: filters.experienceLevel }
          }
        };
      } else {
        whereClause.experience = {
          some: {
            level: filters.experienceLevel
          }
        };
      }
    }

    // Education level filter
    if (filters.educationLevel) {
      whereClause.education = {
        some: {
          degree: filters.educationLevel
        }
      };
    }

    // Salary range filter
    if (filters.minSalary || filters.maxSalary) {
      whereClause.salaryExpectation = {};
      if (filters.minSalary) {
        whereClause.salaryExpectation.min = { gte: filters.minSalary };
      }
      if (filters.maxSalary) {
        whereClause.salaryExpectation.max = { lte: filters.maxSalary };
      }
    }

    // Industry filter
    if (filters.industry) {
      if (Array.isArray(filters.industry)) {
        whereClause.experience = {
          some: {
            industry: { in: filters.industry }
          }
        };
      } else {
        whereClause.experience = {
          some: {
            industry: filters.industry
          }
        };
      }
    }

    // Job type filter
    if (filters.jobType) {
      whereClause.preferences = {
        path: ['employmentTypes'],
        array_contains: filters.jobType
      };
    }

    // Remote work filter
    if (filters.remoteWorkPolicy !== undefined) {
      whereClause.preferences = {
        path: ['remoteWork'],
        equals: filters.remoteWorkPolicy
      };
    }

    // Availability filter
    if (filters.availability) {
      whereClause.availability = filters.availability;
    }

    // Completion score filter
    if (filters.minCompletionScore) {
      whereClause.completionScore = { gte: filters.minCompletionScore };
    }

    // Verified filter
    if (filters.verified !== undefined) {
      whereClause.verified = filters.verified;
    }

    // Featured filter
    if (filters.featured !== undefined) {
      whereClause.featured = filters.featured;
    }

    // Custom date ranges
    if (filters.lastUpdated) {
      whereClause.lastUpdated = { gte: new Date(filters.lastUpdated) };
    }

    return whereClause;
  }

  /**
   * Build where clause for job queries
   */
  static buildJobFilters(filters: MatchFilters): any {
    const whereClause: any = {};

    // Skills filter
    if (filters.skills) {
      whereClause.OR = filters.skills.map(skill => ({
        requiredSkills: {
          path: [],
          string_contains: skill
        }
      }));
    }

    // Location filter
    if (filters.location) {
      whereClause.location = {
        path: ['city'],
        string_contains: filters.location
      };
    }

    // Experience required filter
    if (filters.experienceLevel) {
      whereClause.experienceRequired = {
        gte: this.getExperienceYears(filters.experienceLevel)
      };
    }

    // Education requirements filter
    if (filters.educationLevel) {
      whereClause.educationRequirements = {
        path: ['degree'],
        string_contains: filters.educationLevel
      };
    }

    // Salary range filter
    if (filters.minSalary || filters.maxSalary) {
      whereClause.salaryRange = {};
      if (filters.minSalary) {
        whereClause.salaryRange.min = { gte: filters.minSalary };
      }
      if (filters.maxSalary) {
        whereClause.salaryRange.max = { lte: filters.maxSalary };
      }
    }

    // Industry filter
    if (filters.industry) {
      if (Array.isArray(filters.industry)) {
        whereClause.industry = { in: filters.industry };
      } else {
        whereClause.industry = filters.industry;
      }
    }

    // Job type filter
    if (filters.jobType) {
      if (Array.isArray(filters.jobType)) {
        whereClause.employmentType = { in: filters.jobType };
      } else {
        whereClause.employmentType = filters.jobType;
      }
    }

    // Remote work filter
    if (filters.remoteWorkPolicy !== undefined) {
      whereClause.remoteWorkPolicy = filters.remoteWorkPolicy;
    }

    // Department filter
    if (filters.department) {
      whereClause.department = filters.department;
    }

    // Active filter
    if (filters.active !== undefined) {
      whereClause.active = filters.active;
    }

    // Featured filter
    if (filters.featured !== undefined) {
      whereClause.featured = filters.featured;
    }

    // Urgent filter
    if (filters.urgent !== undefined) {
      whereClause.urgent = filters.urgent;
    }

    // Date filters
    if (filters.postedAfter) {
      whereClause.createdAt = { gte: new Date(filters.postedAfter) };
    }

    if (filters.applicationDeadline) {
      whereClause.applicationDeadline = { gte: new Date(filters.applicationDeadline) };
    }

    return whereClause;
  }

  /**
   * Apply advanced filters to results
   */
  static applyAdvancedFilters(
    results: any[],
    filters: MatchFilters
  ): any[] {
    return results.filter(item => {
      // Text search filter
      if (filters.searchQuery) {
        const searchText = filters.searchQuery.toLowerCase();
        const itemText = this.getSearchableText(item).toLowerCase();
        if (!itemText.includes(searchText)) {
          return false;
        }
      }

      // Custom field filters
      if (filters.customFields) {
        for (const [key, value] of Object.entries(filters.customFields)) {
          if (item.customFields && item.customFields[key] !== value) {
            return false;
          }
        }
      }

      // Date range filters
      if (filters.dateRange) {
        const itemDate = new Date(item.createdAt || item.lastUpdated);
        if (filters.dateRange.start && itemDate < new Date(filters.dateRange.start)) {
          return false;
        }
        if (filters.dateRange.end && itemDate > new Date(filters.dateRange.end)) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Get experience years from level
   */
  private static getExperienceYears(level: string): number {
    const levelMap: Record<string, number> = {
      'entry': 0,
      'junior': 1,
      'mid': 3,
      'senior': 5,
      'lead': 7,
      'principal': 10,
      'executive': 15
    };

    return levelMap[level] || 0;
  }

  /**
   * Get searchable text from item
   */
  private static getSearchableText(item: any): string {
    const texts: string[] = [];

    if (item.title) texts.push(item.title);
    if (item.summary) texts.push(item.summary);
    if (item.description) texts.push(item.description);
    if (item.company?.name) texts.push(item.company.name);
    if (item.skills) {
      if (Array.isArray(item.skills)) {
        texts.push(item.skills.join(' '));
      } else if (typeof item.skills === 'object') {
        texts.push(Object.keys(item.skills).join(' '));
      }
    }

    return texts.join(' ');
  }

  /**
   * Validate filter values
   */
  static validateFilters(filters: MatchFilters): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate salary ranges
    if (filters.minSalary && filters.maxSalary && filters.minSalary > filters.maxSalary) {
      errors.push('Minimum salary cannot be greater than maximum salary');
    }

    // Validate date ranges
    if (filters.dateRange) {
      if (filters.dateRange.start && filters.dateRange.end) {
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        if (startDate > endDate) {
          errors.push('Start date cannot be after end date');
        }
      }
    }

    // Validate arrays
    if (filters.skills && filters.skills.length === 0) {
      errors.push('Skills array cannot be empty');
    }

    if (filters.industry && Array.isArray(filters.industry) && filters.industry.length === 0) {
      errors.push('Industry array cannot be empty');
    }

    // Validate score thresholds
    if (filters.minScore && (filters.minScore < 0 || filters.minScore > 100)) {
      errors.push('Minimum score must be between 0 and 100');
    }

    if (filters.minCompletionScore && (filters.minCompletionScore < 0 || filters.minCompletionScore > 100)) {
      errors.push('Minimum completion score must be between 0 and 100');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * Sort engine for match results
 */
export class SortEngine {
  /**
   * Sort match results based on options
   */
  static sortResults<T extends Record<string, any>>(
    results: T[],
    sortOptions: SortOptions
  ): T[] {
    return results.sort((a, b) => {
      const aValue = this.getSortValue(a, sortOptions.field);
      const bValue = this.getSortValue(b, sortOptions.field);

      let comparison = 0;

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortOptions.order === 'desc' ? -comparison : comparison;
    });
  }

  /**
   * Get sort value from object
   */
  private static getSortValue(obj: any, field: string): any {
    // Handle nested fields with dot notation
    const fieldParts = field.split('.');
    let value = obj;

    for (const part of fieldParts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return null;
      }
    }

    return value;
  }

  /**
   * Multi-level sorting
   */
  static multiLevelSort<T extends Record<string, any>>(
    results: T[],
    sortOptions: SortOptions[]
  ): T[] {
    return results.sort((a, b) => {
      for (const sortOption of sortOptions) {
        const aValue = this.getSortValue(a, sortOption.field);
        const bValue = this.getSortValue(b, sortOption.field);

        let comparison = 0;

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        } else if (aValue instanceof Date && bValue instanceof Date) {
          comparison = aValue.getTime() - bValue.getTime();
        } else {
          comparison = String(aValue).localeCompare(String(bValue));
        }

        if (comparison !== 0) {
          return sortOption.order === 'desc' ? -comparison : comparison;
        }
      }

      return 0;
    });
  }

  /**
   * Sort with custom comparator
   */
  static customSort<T>(
    results: T[],
    comparator: (a: T, b: T) => number
  ): T[] {
    return results.sort(comparator);
  }
}

/**
 * Filter operators for advanced filtering
 */
export class FilterOperators {
  static equals(value: any, filterValue: any): boolean {
    return value === filterValue;
  }

  static notEquals(value: any, filterValue: any): boolean {
    return value !== filterValue;
  }

  static contains(value: string, filterValue: string): boolean {
    return value.toLowerCase().includes(filterValue.toLowerCase());
  }

  static startsWith(value: string, filterValue: string): boolean {
    return value.toLowerCase().startsWith(filterValue.toLowerCase());
  }

  static endsWith(value: string, filterValue: string): boolean {
    return value.toLowerCase().endsWith(filterValue.toLowerCase());
  }

  static greaterThan(value: number, filterValue: number): boolean {
    return value > filterValue;
  }

  static greaterThanOrEqual(value: number, filterValue: number): boolean {
    return value >= filterValue;
  }

  static lessThan(value: number, filterValue: number): boolean {
    return value < filterValue;
  }

  static lessThanOrEqual(value: number, filterValue: number): boolean {
    return value <= filterValue;
  }

  static inArray(value: any, filterValue: any[]): boolean {
    return filterValue.includes(value);
  }

  static notInArray(value: any, filterValue: any[]): boolean {
    return !filterValue.includes(value);
  }

  static inRange(value: number, filterValue: { min: number; max: number }): boolean {
    return value >= filterValue.min && value <= filterValue.max;
  }

  static arrayContains(value: any[], filterValue: any): boolean {
    return value.includes(filterValue);
  }

  static arrayContainsAll(value: any[], filterValue: any[]): boolean {
    return filterValue.every(item => value.includes(item));
  }

  static arrayContainsAny(value: any[], filterValue: any[]): boolean {
    return filterValue.some(item => value.includes(item));
  }
}

export default MatchFiltersBuilder;