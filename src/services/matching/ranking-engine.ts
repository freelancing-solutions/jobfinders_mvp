import { logger } from '@/lib/logger';
import {
  MatchCandidate,
  MatchJob,
  RankingCriteria,
  SortOption,
  FilterOption,
  RankedMatches,
  MatchFilters
} from '@/types/matching';

export class RankingEngine {
  /**
   * Rank candidates based on multiple criteria
   */
  rankCandidates(
    candidates: MatchCandidate[],
    criteria: RankingCriteria,
    filters?: MatchFilters
  ): RankedMatches<MatchCandidate> {
    logger.module('ranking-engine').info('Ranking candidates', {
      totalCandidates: candidates.length,
      criteria,
      filters
    });

    try {
      // Apply filters first
      let filteredCandidates = candidates;
      if (filters) {
        filteredCandidates = this.applyCandidateFilters(candidates, filters);
      }

      // Calculate ranking scores
      const rankedCandidates = filteredCandidates.map(candidate => ({
        ...candidate,
        rankingScore: this.calculateRankingScore(candidate, criteria)
      }));

      // Sort by ranking score
      rankedCandidates.sort((a, b) => b.rankingScore - a.rankingScore);

      // Apply diversification for better results
      const diversifiedCandidates = this.diversifyResults(rankedCandidates, criteria);

      return {
        items: diversifiedCandidates,
        totalItems: filteredCandidates.length,
        rankingCriteria: criteria,
        appliedFilters: filters,
        metadata: {
          rankingTime: Date.now(),
          algorithm: 'multi_criteria_ranking',
          diversification: true
        }
      };

    } catch (error) {
      logger.module('ranking-engine').error('Error ranking candidates', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Rank jobs based on multiple criteria
   */
  rankJobs(
    jobs: MatchJob[],
    criteria: RankingCriteria,
    filters?: MatchFilters
  ): RankedMatches<MatchJob> {
    logger.module('ranking-engine').info('Ranking jobs', {
      totalJobs: jobs.length,
      criteria,
      filters
    });

    try {
      // Apply filters first
      let filteredJobs = jobs;
      if (filters) {
        filteredJobs = this.applyJobFilters(jobs, filters);
      }

      // Calculate ranking scores
      const rankedJobs = filteredJobs.map(job => ({
        ...job,
        rankingScore: this.calculateJobRankingScore(job, criteria)
      }));

      // Sort by ranking score
      rankedJobs.sort((a, b) => b.rankingScore - a.rankingScore);

      // Apply diversification
      const diversifiedJobs = this.diversifyJobResults(rankedJobs, criteria);

      return {
        items: diversifiedJobs,
        totalItems: filteredJobs.length,
        rankingCriteria: criteria,
        appliedFilters: filters,
        metadata: {
          rankingTime: Date.now(),
          algorithm: 'multi_criteria_job_ranking',
          diversification: true
        }
      };

    } catch (error) {
      logger.module('ranking-engine').error('Error ranking jobs', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Calculate ranking score for a candidate
   */
  private calculateRankingScore(candidate: MatchCandidate, criteria: RankingCriteria): number {
    let score = 0;
    const weights = criteria.weights || {
      overallScore: 0.4,
      skillsMatch: 0.2,
      experienceMatch: 0.15,
      locationMatch: 0.1,
      responseRate: 0.1,
      recentActivity: 0.05
    };

    // Base match score
    score += (candidate.overallScore / 100) * (weights.overallScore * 100);

    // Individual component scores
    if (candidate.scoreBreakdown) {
      score += (candidate.scoreBreakdown.skillsMatch / 100) * (weights.skillsMatch * 100);
      score += (candidate.scoreBreakdown.experienceMatch / 100) * (weights.experienceMatch * 100);
      score += (candidate.scoreBreakdown.locationMatch / 100) * (weights.locationMatch * 100);
    }

    // Response rate bonus
    if (candidate.responseRate) {
      score += candidate.responseRate * (weights.responseRate * 100);
    }

    // Recent activity bonus
    if (candidate.lastActive) {
      const daysSinceActive = (Date.now() - new Date(candidate.lastActive).getTime()) / (1000 * 60 * 60 * 24);
      const activityScore = Math.max(0, 1 - (daysSinceActive / 90));
      score += activityScore * (weights.recentActivity * 100);
    }

    // Apply custom criteria
    if (criteria.customCriteria) {
      score += this.applyCustomCriteria(candidate, criteria.customCriteria);
    }

    return Math.min(100, score);
  }

  /**
   * Calculate ranking score for a job
   */
  private calculateJobRankingScore(job: MatchJob, criteria: RankingCriteria): number {
    let score = 0;
    const weights = criteria.weights || {
      overallScore: 0.4,
      requirementsMatch: 0.2,
      compensationFit: 0.15,
      cultureFit: 0.1,
      growthPotential: 0.1,
      marketDemand: 0.05
    };

    // Base match score
    score += (job.overallScore / 100) * (weights.overallScore * 100);

    // Individual component scores
    if (job.scoreBreakdown) {
      score += (job.scoreBreakdown.requirementsMatch / 100) * (weights.requirementsMatch * 100);
      score += (job.scoreBreakdown.compensationFit / 100) * (weights.compensationFit * 100);
      score += (job.scoreBreakdown.cultureFit / 100) * (weights.cultureFit * 100);
      score += (job.scoreBreakdown.growthPotential / 100) * (weights.growthPotential * 100);
      score += (job.scoreBreakdown.marketDemand / 100) * (weights.marketDemand * 100);
    }

    // Apply custom criteria
    if (criteria.customCriteria) {
      score += this.applyJobCustomCriteria(job, criteria.customCriteria);
    }

    return Math.min(100, score);
  }

  /**
   * Apply filters to candidates
   */
  private applyCandidateFilters(candidates: MatchCandidate[], filters: MatchFilters): MatchCandidate[] {
    return candidates.filter(candidate => {
      // Skills filter
      if (filters.skills?.length) {
        const hasRequiredSkill = filters.skills.some(skill =>
          candidate.skills.some(candidateSkill =>
            candidateSkill.toLowerCase().includes(skill.toLowerCase())
          )
        );
        if (!hasRequiredSkill) return false;
      }

      // Location filter
      if (filters.location) {
        if (!candidate.location?.toLowerCase().includes(filters.location.toLowerCase())) {
          return false;
        }
      }

      // Experience level filter
      if (filters.experienceLevel) {
        if (candidate.experienceLevel !== filters.experienceLevel) {
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
        if (candidate.workType !== filters.workType) {
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
        const daysSinceActive = candidate.lastActive
          ? (Date.now() - new Date(candidate.lastActive).getTime()) / (1000 * 60 * 60 * 24)
          : Infinity;
        if (daysSinceActive > filters.recentActivityDays) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Apply filters to jobs
   */
  private applyJobFilters(jobs: MatchJob[], filters: MatchFilters): MatchJob[] {
    return jobs.filter(job => {
      // Skills filter
      if (filters.skills?.length) {
        const hasRequiredSkill = filters.skills.some(skill =>
          job.requiredSkills?.some(jobSkill =>
            jobSkill.toLowerCase().includes(skill.toLowerCase())
          )
        );
        if (!hasRequiredSkill) return false;
      }

      // Location filter
      if (filters.location) {
        if (!job.location?.toLowerCase().includes(filters.location.toLowerCase())) {
          return false;
        }
      }

      // Experience level filter
      if (filters.experienceLevel) {
        if (job.experienceLevel !== filters.experienceLevel) {
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
        if (job.workType !== filters.workType) {
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
        if (job.companySize !== filters.companySize) {
          return false;
        }
      }

      // Industry filter
      if (filters.industry) {
        if (!job.industry?.toLowerCase().includes(filters.industry.toLowerCase())) {
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
        const daysSincePosted = (Date.now() - new Date(job.postedAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSincePosted > filters.postedWithinDays) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Apply diversification to results
   */
  private diversifyResults(candidates: MatchCandidate[], criteria: RankingCriteria): MatchCandidate[] {
    if (!criteria.diversify || candidates.length <= 5) {
      return candidates;
    }

    const diversified: MatchCandidate[] = [];
    const usedSkillSets = new Set<string>();
    const usedCompanies = new Set<string>();

    // First, add top candidates
    diversified.push(candidates[0]);

    // Then add diverse candidates
    for (let i = 1; i < candidates.length; i++) {
      const candidate = candidates[i];

      // Check for skill diversity
      const skillSignature = candidate.skills.slice(0, 3).sort().join(',');
      const hasNewSkills = !usedSkillSets.has(skillSignature);

      // Check for company diversity (if applicable)
      const hasNewCompany = candidate.currentCompany && !usedCompanies.has(candidate.currentCompany);

      // Include candidate if they add diversity
      if (hasNewSkills || hasNewCompany || diversified.length < 10) {
        diversified.push(candidate);

        if (hasNewSkills) {
          usedSkillSets.add(skillSignature);
        }
        if (hasNewCompany) {
          usedCompanies.add(candidate.currentCompany);
        }
      }

      if (diversified.length >= 20) {
        break;
      }
    }

    return diversified;
  }

  /**
   * Apply diversification to job results
   */
  private diversifyJobResults(jobs: MatchJob[], criteria: RankingCriteria): MatchJob[] {
    if (!criteria.diversify || jobs.length <= 5) {
      return jobs;
    }

    const diversified: MatchJob[] = [];
    const usedCompanies = new Set<string>();
    const usedIndustries = new Set<string>();

    // First, add top jobs
    diversified.push(jobs[0]);

    // Then add diverse jobs
    for (let i = 1; i < jobs.length; i++) {
      const job = jobs[i];

      // Check for company diversity
      const hasNewCompany = !usedCompanies.has(job.companyId);

      // Check for industry diversity
      const hasNewIndustry = job.industry && !usedIndustries.has(job.industry);

      // Include job if it adds diversity
      if (hasNewCompany || hasNewIndustry || diversified.length < 10) {
        diversified.push(job);

        if (hasNewCompany) {
          usedCompanies.add(job.companyId);
        }
        if (hasNewIndustry) {
          usedIndustries.add(job.industry);
        }
      }

      if (diversified.length >= 20) {
        break;
      }
    }

    return diversified;
  }

  /**
   * Apply custom ranking criteria
   */
  private applyCustomCriteria(candidate: MatchCandidate, customCriteria: any): number {
    let bonusScore = 0;

    // Custom bonus for specific skills
    if (customCriteria.preferredSkills?.length) {
      const matches = customCriteria.preferredSkills.filter((skill: string) =>
        candidate.skills.some(candidateSkill =>
          candidateSkill.toLowerCase().includes(skill.toLowerCase())
        )
      ).length;
      bonusScore += matches * 2;
    }

    // Custom bonus for experience in specific industries
    if (customCriteria.preferredIndustries?.length && candidate.industries) {
      const matches = customCriteria.preferredIndustries.filter((industry: string) =>
        candidate.industries.some((candidateIndustry: string) =>
          candidateIndustry.toLowerCase().includes(industry.toLowerCase())
        )
      ).length;
      bonusScore += matches * 3;
    }

    // Custom bonus for education level
    if (customCriteria.minEducationLevel && candidate.education) {
      const educationLevels = ['high school', 'associate', 'bachelor', 'master', 'phd'];
      const candidateLevel = educationLevels.findIndex(level =>
        candidate.education.toLowerCase().includes(level)
      );
      const requiredLevel = educationLevels.indexOf(customCriteria.minEducationLevel);

      if (candidateLevel >= requiredLevel) {
        bonusScore += 5;
      }
    }

    return bonusScore;
  }

  /**
   * Apply custom job ranking criteria
   */
  private applyJobCustomCriteria(job: MatchJob, customCriteria: any): number {
    let bonusScore = 0;

    // Custom bonus for specific benefits
    if (customCriteria.requiredBenefits?.length && job.benefits) {
      const matches = customCriteria.requiredBenefits.filter((benefit: string) =>
        job.benefits.some((jobBenefit: string) =>
          jobBenefit.toLowerCase().includes(benefit.toLowerCase())
        )
      ).length;
      bonusScore += matches * 2;
    }

    // Custom bonus for company culture fit
    if (customCriteria.preferredCulture && job.cultureTags) {
      const matches = customCriteria.preferredCulture.filter((tag: string) =>
        job.cultureTags.some((cultureTag: string) =>
          cultureTag.toLowerCase().includes(tag.toLowerCase())
        )
      ).length;
      bonusScore += matches * 3;
    }

    // Custom bonus for growth opportunities
    if (customCriteria.requireGrowthOpportunities && job.growthOpportunities) {
      bonusScore += 5;
    }

    return bonusScore;
  }

  /**
   * Get recommended sorting options
   */
  getSortingOptions(type: 'candidate' | 'job'): SortOption[] {
    if (type === 'candidate') {
      return [
        { value: 'overallScore', label: 'Best Match', description: 'Sort by overall compatibility score' },
        { value: 'skillsMatch', label: 'Skills Match', description: 'Sort by skills alignment' },
        { value: 'experienceMatch', label: 'Experience Level', description: 'Sort by experience compatibility' },
        { value: 'responseRate', label: 'Response Rate', description: 'Sort by likelihood to respond' },
        { value: 'recentActivity', label: 'Recently Active', description: 'Sort by recent platform activity' },
        { value: 'locationMatch', label: 'Location Match', description: 'Sort by location compatibility' }
      ];
    } else {
      return [
        { value: 'overallScore', label: 'Best Match', description: 'Sort by overall compatibility score' },
        { value: 'requirementsMatch', label: 'Requirements Match', description: 'Sort by how well you meet requirements' },
        { value: 'compensationFit', label: 'Salary Match', description: 'Sort by compensation alignment' },
        { value: 'postedAt', label: 'Recently Posted', description: 'Sort by posting date' },
        { value: 'marketDemand', label: 'Market Demand', description: 'Sort by market demand' },
        { value: 'growthPotential', label: 'Growth Potential', description: 'Sort by career growth opportunities' }
      ];
    }
  }

  /**
   * Get recommended filtering options
   */
  getFilteringOptions(type: 'candidate' | 'job'): FilterOption[] {
    const commonFilters: FilterOption[] = [
      { value: 'skills', label: 'Skills', type: 'multiselect', description: 'Filter by specific skills' },
      { value: 'location', label: 'Location', type: 'text', description: 'Filter by location' },
      { value: 'experienceLevel', label: 'Experience Level', type: 'select', description: 'Filter by experience level' },
      { value: 'remote', label: 'Remote Work', type: 'boolean', description: 'Filter for remote opportunities' },
      { value: 'workType', label: 'Work Type', type: 'select', description: 'Filter by work type (full-time, part-time, contract)' },
      { value: 'minScore', label: 'Minimum Score', type: 'number', description: 'Filter by minimum match score' }
    ];

    if (type === 'candidate') {
      return [
        ...commonFilters,
        { value: 'minYearsExperience', label: 'Minimum Years Experience', type: 'number', description: 'Filter by minimum years of experience' },
        { value: 'maxYearsExperience', label: 'Maximum Years Experience', type: 'number', description: 'Filter by maximum years of experience' },
        { value: 'willingToRelocate', label: 'Willing to Relocate', type: 'boolean', description: 'Filter by relocation willingness' },
        { value: 'profileComplete', label: 'Complete Profile', type: 'boolean', description: 'Filter by profile completeness' },
        { value: 'recentActivityDays', label: 'Recent Activity', type: 'number', description: 'Filter by days since last active' }
      ];
    } else {
      return [
        ...commonFilters,
        { value: 'minSalary', label: 'Minimum Salary', type: 'number', description: 'Filter by minimum salary' },
        { value: 'maxSalary', label: 'Maximum Salary', type: 'number', description: 'Filter by maximum salary' },
        { value: 'companySize', label: 'Company Size', type: 'select', description: 'Filter by company size' },
        { value: 'industry', label: 'Industry', type: 'text', description: 'Filter by industry' },
        { value: 'postedWithinDays', label: 'Posted Within', type: 'number', description: 'Filter by days since posting' }
      ];
    }
  }

  /**
   * Create default ranking criteria
   */
  createDefaultCriteria(type: 'candidate' | 'job'): RankingCriteria {
    if (type === 'candidate') {
      return {
        weights: {
          overallScore: 0.4,
          skillsMatch: 0.2,
          experienceMatch: 0.15,
          locationMatch: 0.1,
          responseRate: 0.1,
          recentActivity: 0.05
        },
        diversify: true,
        boostRecent: true,
        penalizeInactive: true
      };
    } else {
      return {
        weights: {
          overallScore: 0.4,
          requirementsMatch: 0.2,
          compensationFit: 0.15,
          cultureFit: 0.1,
          growthPotential: 0.1,
          marketDemand: 0.05
        },
        diversify: true,
        boostRecent: true,
        penalizeInactive: true
      };
    }
  }
}