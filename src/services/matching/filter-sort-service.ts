import { logger } from '@/lib/logger';
import {
  MatchCandidate,
  MatchJob,
  MatchFilters,
  SortOption,
  FilterOption,
  FilterCriteria,
  SortCriteria,
  FilteredMatches,
  FilterValidationResult,
  AdvancedFilterOptions
} from '@/types/matching';

export class FilterSortService {
  /**
   * Filter and sort candidate matches
   */
  async filterAndSortCandidates(
    candidates: MatchCandidate[],
    filters?: MatchFilters,
    sortCriteria?: SortCriteria
  ): Promise<FilteredMatches<MatchCandidate>> {
    logger.module('filter-sort-service').info('Filtering and sorting candidates', {
      totalCandidates: candidates.length,
      filters,
      sortCriteria
    });

    try {
      let filteredCandidates = [...candidates];

      // Apply filters
      if (filters) {
        const validationResult = this.validateFilters(filters, 'candidate');
        if (!validationResult.isValid) {
          throw new Error(`Invalid filters: ${validationResult.errors.join(', ')}`);
        }

        filteredCandidates = await this.applyCandidateFilters(filteredCandidates, filters);
      }

      // Apply sorting
      if (sortCriteria) {
        filteredCandidates = this.applySorting(filteredCandidates, sortCriteria, 'candidate');
      }

      // Apply pagination
      const paginatedResults = this.applyPagination(
        filteredCandidates,
        sortCriteria?.page || 1,
        sortCriteria?.limit || 20
      );

      return {
        items: paginatedResults.items,
        totalItems: filteredCandidates.length,
        currentPage: sortCriteria?.page || 1,
        totalPages: paginatedResults.totalPages,
        appliedFilters: filters,
        sortCriteria,
        filterMetadata: {
          processingTime: Date.now(),
          filtersApplied: Object.keys(filters || {}).length,
          sortApplied: !!sortCriteria
        }
      };

    } catch (error) {
      logger.module('filter-sort-service').error('Error filtering and sorting candidates', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Filter and sort job matches
   */
  async filterAndSortJobs(
    jobs: MatchJob[],
    filters?: MatchFilters,
    sortCriteria?: SortCriteria
  ): Promise<FilteredMatches<MatchJob>> {
    logger.module('filter-sort-service').info('Filtering and sorting jobs', {
      totalJobs: jobs.length,
      filters,
      sortCriteria
    });

    try {
      let filteredJobs = [...jobs];

      // Apply filters
      if (filters) {
        const validationResult = this.validateFilters(filters, 'job');
        if (!validationResult.isValid) {
          throw new Error(`Invalid filters: ${validationResult.errors.join(', ')}`);
        }

        filteredJobs = await this.applyJobFilters(filteredJobs, filters);
      }

      // Apply sorting
      if (sortCriteria) {
        filteredJobs = this.applySorting(filteredJobs, sortCriteria, 'job');
      }

      // Apply pagination
      const paginatedResults = this.applyPagination(
        filteredJobs,
        sortCriteria?.page || 1,
        sortCriteria?.limit || 20
      );

      return {
        items: paginatedResults.items,
        totalItems: filteredJobs.length,
        currentPage: sortCriteria?.page || 1,
        totalPages: paginatedResults.totalPages,
        appliedFilters: filters,
        sortCriteria,
        filterMetadata: {
          processingTime: Date.now(),
          filtersApplied: Object.keys(filters || {}).length,
          sortApplied: !!sortCriteria
        }
      };

    } catch (error) {
      logger.module('filter-sort-service').error('Error filtering and sorting jobs', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Apply advanced filters with complex criteria
   */
  async applyAdvancedFilters<T extends MatchCandidate | MatchJob>(
    items: T[],
    advancedFilters: AdvancedFilterOptions,
    type: 'candidate' | 'job'
  ): Promise<T[]> {
    logger.module('filter-sort-service').info('Applying advanced filters', {
      type,
      itemCount: items.length,
      filterCount: Object.keys(advancedFilters).length
    });

    try {
      let filteredItems = [...items];

      // Skills filter with AND/OR logic
      if (advancedFilters.skillsFilter) {
        filteredItems = this.applySkillsFilter(filteredItems, advancedFilters.skillsFilter, type);
      }

      // Date range filter
      if (advancedFilters.dateRange) {
        filteredItems = this.applyDateRangeFilter(filteredItems, advancedFilters.dateRange, type);
      }

      // Custom score range filter
      if (advancedFilters.scoreRange) {
        filteredItems = this.applyScoreRangeFilter(filteredItems, advancedFilters.scoreRange);
      }

      // Text search filter
      if (advancedFilters.textSearch) {
        filteredItems = this.applyTextSearchFilter(filteredItems, advancedFilters.textSearch, type);
      }

      // Location radius filter
      if (advancedFilters.locationRadius) {
        filteredItems = this.applyLocationRadiusFilter(filteredItems, advancedFilters.locationRadius, type);
      }

      // Company size filter
      if (advancedFilters.companySizeFilter && type === 'job') {
        filteredItems = this.applyCompanySizeFilter(filteredItems as MatchJob[], advancedFilters.companySizeFilter);
      }

      // Experience range filter
      if (advancedFilters.experienceRange && type === 'candidate') {
        filteredItems = this.applyExperienceRangeFilter(filteredItems as MatchCandidate[], advancedFilters.experienceRange);
      }

      // Education level filter
      if (advancedFilters.educationFilter && type === 'candidate') {
        filteredItems = this.applyEducationFilter(filteredItems as MatchCandidate[], advancedFilters.educationFilter);
      }

      return filteredItems;

    } catch (error) {
      logger.module('filter-sort-service').error('Error applying advanced filters', {
        type,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Apply candidate filters
   */
  private async applyCandidateFilters(candidates: MatchCandidate[], filters: MatchFilters): Promise<MatchCandidate[]> {
    return candidates.filter(candidate => {
      // Skills filter
      if (filters.skills?.length) {
        const hasRequiredSkill = this.checkSkillsMatch(candidate.skills, filters.skills, filters.skillsMatchType || 'any');
        if (!hasRequiredSkill) return false;
      }

      // Location filter
      if (filters.location) {
        if (!this.checkLocationMatch(candidate.location, filters.location)) {
          return false;
        }
      }

      // Experience level filter
      if (filters.experienceLevel) {
        if (!this.checkExperienceLevelMatch(candidate.experienceLevel, filters.experienceLevel)) {
          return false;
        }
      }

      // Years of experience filter
      if (filters.minYearsExperience) {
        if ((candidate.yearsExperience || 0) < filters.minYearsExperience) {
          return false;
        }
      }

      if (filters.maxYearsExperience) {
        if ((candidate.yearsExperience || 0) > filters.maxYearsExperience) {
          return false;
        }
      }

      // Remote work filter
      if (filters.remote !== undefined) {
        if (candidate.remote !== filters.remote) {
          return false;
        }
      }

      // Willing to relocate filter
      if (filters.willingToRelocate !== undefined) {
        if (candidate.willingToRelocate !== filters.willingToRelocate) {
          return false;
        }
      }

      // Work type filter
      if (filters.workType) {
        if (!this.checkWorkTypeMatch(candidate.workType, filters.workType)) {
          return false;
        }
      }

      // Minimum score filter
      if (filters.minScore) {
        if (candidate.overallScore < filters.minScore) {
          return false;
        }
      }

      // Profile completeness filter
      if (filters.profileComplete !== undefined) {
        if (candidate.profileComplete !== filters.profileComplete) {
          return false;
        }
      }

      // Recent activity filter
      if (filters.recentActivityDays) {
        if (!this.checkRecentActivity(candidate.lastActive, filters.recentActivityDays)) {
          return false;
        }
      }

      // Response rate filter
      if (filters.minResponseRate) {
        if ((candidate.responseRate || 0) < filters.minResponseRate) {
          return false;
        }
      }

      // Availability filter
      if (filters.availableImmediately !== undefined) {
        if (filters.availableImmediately && !candidate.availableImmediately) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Apply job filters
   */
  private async applyJobFilters(jobs: MatchJob[], filters: MatchFilters): Promise<MatchJob[]> {
    return jobs.filter(job => {
      // Skills filter
      if (filters.skills?.length) {
        const hasRequiredSkill = this.checkSkillsMatch(job.requiredSkills || [], filters.skills, filters.skillsMatchType || 'any');
        if (!hasRequiredSkill) return false;
      }

      // Location filter
      if (filters.location) {
        if (!this.checkLocationMatch(job.location, filters.location)) {
          return false;
        }
      }

      // Experience level filter
      if (filters.experienceLevel) {
        if (!this.checkExperienceLevelMatch(job.experienceLevel, filters.experienceLevel)) {
          return false;
        }
      }

      // Remote work filter
      if (filters.remote !== undefined) {
        if (job.remote !== filters.remote) {
          return false;
        }
      }

      // Work type filter
      if (filters.workType) {
        if (!this.checkWorkTypeMatch(job.workType, filters.workType)) {
          return false;
        }
      }

      // Salary range filter
      if (filters.minSalary) {
        if ((job.minSalary || 0) < filters.minSalary) {
          return false;
        }
      }

      if (filters.maxSalary) {
        if ((job.maxSalary || Infinity) > filters.maxSalary) {
          return false;
        }
      }

      // Company size filter
      if (filters.companySize) {
        if (!this.checkCompanySizeMatch(job.companySize, filters.companySize)) {
          return false;
        }
      }

      // Industry filter
      if (filters.industry) {
        if (!this.checkIndustryMatch(job.industry, filters.industry)) {
          return false;
        }
      }

      // Minimum score filter
      if (filters.minScore) {
        if (job.overallScore < filters.minScore) {
          return false;
        }
      }

      // Posted within days filter
      if (filters.postedWithinDays) {
        if (!this.checkPostedWithinDays(job.postedAt, filters.postedWithinDays)) {
          return false;
        }
      }

      // Application deadline filter
      if (filters.activeOnly && job.applicationDeadline) {
        if (new Date(job.applicationDeadline) < new Date()) {
          return false;
        }
      }

      // Company rating filter
      if (filters.minCompanyRating) {
        if ((job.companyRating || 0) < filters.minCompanyRating) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Apply sorting to items
   */
  private applySorting<T extends MatchCandidate | MatchJob>(
    items: T[],
    sortCriteria: SortCriteria,
    type: 'candidate' | 'job'
  ): T[] {
    const { sortBy, sortOrder = 'desc' } = sortCriteria;

    return items.sort((a, b) => {
      let aValue: number | string | Date;
      let bValue: number | string | Date;

      // Get values based on sort field
      switch (sortBy) {
        case 'overallScore':
          aValue = a.overallScore;
          bValue = b.overallScore;
          break;
        case 'postedAt':
        case 'lastActive':
          aValue = type === 'job' ? (b as MatchJob).postedAt : (a as MatchCandidate).lastActive || new Date(0);
          bValue = type === 'job' ? (a as MatchJob).postedAt : (b as MatchCandidate).lastActive || new Date(0);
          break;
        case 'responseRate':
          aValue = (a as MatchCandidate).responseRate || 0;
          bValue = (b as MatchCandidate).responseRate || 0;
          break;
        case 'skillsMatch':
          aValue = a.scoreBreakdown?.skillsMatch || 0;
          bValue = b.scoreBreakdown?.skillsMatch || 0;
          break;
        case 'experienceMatch':
          aValue = a.scoreBreakdown?.experienceMatch || 0;
          bValue = b.scoreBreakdown?.experienceMatch || 0;
          break;
        case 'locationMatch':
          aValue = a.scoreBreakdown?.locationMatch || 0;
          bValue = b.scoreBreakdown?.locationMatch || 0;
          break;
        case 'minSalary':
          aValue = (b as MatchJob).minSalary || 0;
          bValue = (a as MatchJob).minSalary || 0;
          break;
        case 'companyRating':
          aValue = (b as MatchJob).companyRating || 0;
          bValue = (a as MatchJob).companyRating || 0;
          break;
        default:
          aValue = a.overallScore;
          bValue = b.overallScore;
      }

      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortOrder === 'asc' ? comparison : -comparison;
      }

      // Handle date comparison
      if (aValue instanceof Date && bValue instanceof Date) {
        const comparison = aValue.getTime() - bValue.getTime();
        return sortOrder === 'asc' ? comparison : -comparison;
      }

      // Handle numeric comparison
      const comparison = (aValue as number) - (bValue as number);
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * Apply pagination
   */
  private applyPagination<T>(
    items: T[],
    page: number,
    limit: number
  ): { items: T[]; totalPages: number } {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = items.slice(startIndex, endIndex);
    const totalPages = Math.ceil(items.length / limit);

    return {
      items: paginatedItems,
      totalPages
    };
  }

  /**
   * Validate filter criteria
   */
  private validateFilters(filters: MatchFilters, type: 'candidate' | 'job'): FilterValidationResult {
    const errors: string[] = [];

    // Validate numeric ranges
    if (filters.minYearsExperience && filters.maxYearsExperience) {
      if (filters.minYearsExperience > filters.maxYearsExperience) {
        errors.push('minYearsExperience cannot be greater than maxYearsExperience');
      }
    }

    if (filters.minSalary && filters.maxSalary) {
      if (filters.minSalary > filters.maxSalary) {
        errors.push('minSalary cannot be greater than maxSalary');
      }
    }

    if (filters.minScore && (filters.minScore < 0 || filters.minScore > 100)) {
      errors.push('minScore must be between 0 and 100');
    }

    if (filters.minResponseRate && (filters.minResponseRate < 0 || filters.minResponseRate > 1)) {
      errors.push('minResponseRate must be between 0 and 1');
    }

    // Validate arrays
    if (filters.skills && filters.skills.length === 0) {
      errors.push('skills array cannot be empty');
    }

    // Validate strings
    if (filters.location && filters.location.trim().length === 0) {
      errors.push('location cannot be empty');
    }

    if (filters.workType && !['full-time', 'part-time', 'contract', 'internship', 'temporary'].includes(filters.workType)) {
      errors.push('invalid workType value');
    }

    if (filters.experienceLevel && !['entry', 'mid', 'senior', 'executive'].includes(filters.experienceLevel)) {
      errors.push('invalid experienceLevel value');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Helper methods for filter checks
  private checkSkillsMatch(candidateSkills: string[], requiredSkills: string[], matchType: 'any' | 'all'): boolean {
    if (matchType === 'all') {
      return requiredSkills.every(skill =>
        candidateSkills.some(candidateSkill =>
          candidateSkill.toLowerCase().includes(skill.toLowerCase())
        )
      );
    } else {
      return requiredSkills.some(skill =>
        candidateSkills.some(candidateSkill =>
          candidateSkill.toLowerCase().includes(skill.toLowerCase())
        )
      );
    }
  }

  private checkLocationMatch(candidateLocation: string | undefined, requiredLocation: string): boolean {
    if (!candidateLocation) return false;
    return candidateLocation.toLowerCase().includes(requiredLocation.toLowerCase());
  }

  private checkExperienceLevelMatch(candidateLevel: string, requiredLevel: string): boolean {
    return candidateLevel === requiredLevel;
  }

  private checkWorkTypeMatch(candidateType: string | undefined, requiredType: string): boolean {
    if (!candidateType) return false;
    return candidateType === requiredType;
  }

  private checkRecentActivity(lastActive: string | undefined, maxDays: number): boolean {
    if (!lastActive) return false;
    const daysSinceActive = (Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceActive <= maxDays;
  }

  private checkPostedWithinDays(postedAt: string, maxDays: number): boolean {
    const daysSincePosted = (Date.now() - new Date(postedAt).getTime()) / (1000 * 60 * 60 * 24);
    return daysSincePosted <= maxDays;
  }

  private checkCompanySizeMatch(jobSize: string | undefined, requiredSize: string): boolean {
    if (!jobSize) return false;
    return jobSize === requiredSize;
  }

  private checkIndustryMatch(jobIndustry: string | undefined, requiredIndustry: string): boolean {
    if (!jobIndustry) return false;
    return jobIndustry.toLowerCase().includes(requiredIndustry.toLowerCase());
  }

  // Advanced filter methods
  private applySkillsFilter<T extends MatchCandidate | MatchJob>(
    items: T[],
    skillsFilter: any,
    type: 'candidate' | 'job'
  ): T[] {
    return items.filter(item => {
      const itemSkills = type === 'candidate'
        ? (item as MatchCandidate).skills
        : (item as MatchJob).requiredSkills || [];

      if (skillsFilter.mode === 'exact') {
        return skillsFilter.skills.every((skill: string) =>
          itemSkills.some((itemSkill: string) =>
            itemSkill.toLowerCase() === skill.toLowerCase()
          )
        );
      } else {
        return this.checkSkillsMatch(itemSkills, skillsFilter.skills, skillsFilter.mode);
      }
    });
  }

  private applyDateRangeFilter<T extends MatchCandidate | MatchJob>(
    items: T[],
    dateRange: { start: Date; end: Date },
    type: 'candidate' | 'job'
  ): T[] {
    const { start, end } = dateRange;

    return items.filter(item => {
      const itemDate = type === 'candidate'
        ? new Date((item as MatchCandidate).lastActive || 0)
        : new Date((item as MatchJob).postedAt);

      return itemDate >= start && itemDate <= end;
    });
  }

  private applyScoreRangeFilter<T extends MatchCandidate | MatchJob>(
    items: T[],
    scoreRange: { min: number; max: number }
  ): T[] {
    const { min, max } = scoreRange;

    return items.filter(item =>
      item.overallScore >= min && item.overallScore <= max
    );
  }

  private applyTextSearchFilter<T extends MatchCandidate | MatchJob>(
    items: T[],
    textSearch: { query: string; fields: string[] },
    type: 'candidate' | 'job'
  ): T[] {
    const { query, fields } = textSearch;
    const searchTerms = query.toLowerCase().split(' ');

    return items.filter(item => {
      return searchTerms.every(term =>
        fields.some(field => {
          const fieldValue = this.getNestedProperty(item, field);
          return fieldValue && fieldValue.toString().toLowerCase().includes(term);
        })
      );
    });
  }

  private applyLocationRadiusFilter<T extends MatchCandidate | MatchJob>(
    items: T[],
    locationRadius: { center: string; radius: number },
    type: 'candidate' | 'job'
  ): T[] {
    // This would require geolocation data and distance calculation
    // For now, return all items
    return items;
  }

  private applyCompanySizeFilter(jobs: MatchJob[], companySizeFilter: any): MatchJob[] {
    return jobs.filter(job => {
      if (!job.companySize) return false;

      const sizeMap: { [key: string]: number[] } = {
        'startup': [1, 10],
        'small': [11, 50],
        'medium': [51, 200],
        'large': [201, 1000],
        'enterprise': [1001, Infinity]
      };

      const sizeRange = sizeMap[job.companySize.toLowerCase()];
      if (!sizeRange) return false;

      return companySizeFilter.min <= sizeRange[1] && companySizeFilter.max >= sizeRange[0];
    });
  }

  private applyExperienceRangeFilter(candidates: MatchCandidate[], experienceRange: { min: number; max: number }): MatchCandidate[] {
    const { min, max } = experienceRange;

    return candidates.filter(candidate => {
      const years = candidate.yearsExperience || 0;
      return years >= min && years <= max;
    });
  }

  private applyEducationFilter(candidates: MatchCandidate[], educationFilter: { levels: string[] }): MatchCandidate[] {
    return candidates.filter(candidate => {
      if (!candidate.resume?.education) return false;

      return candidate.resume.education.some((education: any) =>
        educationFilter.levels.some(level =>
          education.degree?.toLowerCase().includes(level.toLowerCase())
        )
      );
    });
  }

  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Get available filter options for a type
   */
  getFilterOptions(type: 'candidate' | 'job'): FilterOption[] {
    const commonFilters: FilterOption[] = [
      { value: 'skills', label: 'Skills', type: 'multiselect', description: 'Filter by specific skills' },
      { value: 'location', label: 'Location', type: 'text', description: 'Filter by location' },
      { value: 'experienceLevel', label: 'Experience Level', type: 'select', description: 'Filter by experience level' },
      { value: 'remote', label: 'Remote Work', type: 'boolean', description: 'Filter for remote opportunities' },
      { value: 'workType', label: 'Work Type', type: 'select', description: 'Filter by work type' },
      { value: 'minScore', label: 'Minimum Score', type: 'number', description: 'Filter by minimum match score' }
    ];

    if (type === 'candidate') {
      return [
        ...commonFilters,
        { value: 'minYearsExperience', label: 'Min Years Experience', type: 'number', description: 'Minimum years of experience' },
        { value: 'maxYearsExperience', label: 'Max Years Experience', type: 'number', description: 'Maximum years of experience' },
        { value: 'willingToRelocate', label: 'Willing to Relocate', type: 'boolean', description: 'Candidates willing to relocate' },
        { value: 'profileComplete', label: 'Complete Profile', type: 'boolean', description: 'Candidates with complete profiles' },
        { value: 'recentActivityDays', label: 'Recent Activity', type: 'number', description: 'Days since last active' },
        { value: 'minResponseRate', label: 'Min Response Rate', type: 'number', description: 'Minimum response rate' },
        { value: 'availableImmediately', label: 'Available Immediately', type: 'boolean', description: 'Candidates available immediately' }
      ];
    } else {
      return [
        ...commonFilters,
        { value: 'minSalary', label: 'Minimum Salary', type: 'number', description: 'Minimum salary range' },
        { value: 'maxSalary', label: 'Maximum Salary', type: 'number', description: 'Maximum salary range' },
        { value: 'companySize', label: 'Company Size', type: 'select', description: 'Filter by company size' },
        { value: 'industry', label: 'Industry', type: 'text', description: 'Filter by industry' },
        { value: 'postedWithinDays', label: 'Posted Within', type: 'number', description: 'Days since posting' },
        { value: 'activeOnly', label: 'Active Only', type: 'boolean', description: 'Only active job postings' },
        { value: 'minCompanyRating', label: 'Min Company Rating', type: 'number', description: 'Minimum company rating' }
      ];
    }
  }

  /**
   * Get available sort options for a type
   */
  getSortOptions(type: 'candidate' | 'job'): SortOption[] {
    if (type === 'candidate') {
      return [
        { value: 'overallScore', label: 'Best Match', description: 'Sort by overall compatibility score' },
        { value: 'skillsMatch', label: 'Skills Match', description: 'Sort by skills alignment' },
        { value: 'experienceMatch', label: 'Experience Level', description: 'Sort by experience compatibility' },
        { value: 'locationMatch', label: 'Location Match', description: 'Sort by location compatibility' },
        { value: 'responseRate', label: 'Response Rate', description: 'Sort by likelihood to respond' },
        { value: 'lastActive', label: 'Recently Active', description: 'Sort by recent platform activity' }
      ];
    } else {
      return [
        { value: 'overallScore', label: 'Best Match', description: 'Sort by overall compatibility score' },
        { value: 'postedAt', label: 'Recently Posted', description: 'Sort by posting date' },
        { value: 'minSalary', label: 'Salary', description: 'Sort by salary range' },
        { value: 'companyRating', label: 'Company Rating', description: 'Sort by company rating' },
        { value: 'applicationDeadline', label: 'Application Deadline', description: 'Sort by application deadline' }
      ];
    }
  }
}