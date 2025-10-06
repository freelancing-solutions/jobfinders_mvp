/**
 * GitHub Profile Analysis Module
 *
 * Analyzes GitHub profiles to extract technical skills, project experience,
 * contributions, and professional insights for profile enrichment.
 */

import { logger } from '@/lib/logger';
import { cache } from '@/lib/cache';
import { textExtractor } from '@/lib/text-extractor';
import { keywordAnalyzer } from '@/lib/keyword-analyzer';

export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  company: string | null;
  avatarUrl: string;
  followers: number;
  following: number;
  publicRepos: number;
  publicGists: number;
  createdAt: string;
  updatedAt: string;
  twitterUsername?: string;
  linkedin?: string;
}

export interface GitHubRepository {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  language: string | null;
  languages: { [key: string]: number };
  stars: number;
  forks: number;
  watchers: number;
  size: number;
  isPrivate: boolean;
  isFork: boolean;
  isTemplate: boolean;
  defaultBranch: string;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  url: string;
  homepage: string | null;
  topics: string[];
  license?: {
    key: string;
    name: string;
    url: string;
  };
  owner: {
    login: string;
    type: string;
  };
  parent?: {
    fullName: string;
  };
}

export interface GitHubCommit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  committer: {
    name: string;
    email: string;
    date: string;
  };
  url: string;
  additions: number;
  deletions: number;
  changed: number;
  files: Array<{
    filename: string;
    additions: number;
    deletions: number;
    changes: number;
    status: 'added' | 'removed' | 'modified' | 'renamed' | 'copied' | 'changed' | 'unchanged';
    patch?: string;
  }>;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  mergedAt?: string;
  user: {
    login: string;
  };
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
    sha: string;
  };
  additions: number;
  deletions: number;
  changedFiles: number;
  mergeable?: boolean;
  merged?: boolean;
  reviews: Array<{
    user: {
      login: string;
    };
    state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED';
    body: string;
    submittedAt: string;
  }>;
  comments: Array<{
    user: {
      login: string;
    };
    body: string;
    createdAt: string;
  }>;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  user: {
    login: string;
  };
  assignees: Array<{
    login: string;
  }>;
  labels: Array<{
    name: string;
    color: string;
  }>;
  comments: number;
  reactions: {
    '+1': number;
    '-1': number;
    laugh: number;
    hooray: number;
    confused: number;
    heart: number;
    rocket: number;
    eyes: number;
  };
}

export interface GitHubContribution {
  date: string;
  count: number;
  color: string;
}

export interface GitHubOrganization {
  login: string;
  id: number;
  name: string | null;
  description: string | null;
  avatarUrl: string;
  members: number;
  repos: number;
  location: string | null;
  website: string | null;
  isVerified: boolean;
}

export interface GitHubProfileAnalysis {
  userProfile: GitHubUser;
  repositories: GitHubRepository[];
  organizations: GitHubOrganization[];
  contributionCalendar: GitHubContribution[];
  technicalSkills: {
    languages: Array<{
      name: string;
      proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
      repositories: number;
      linesOfCode?: number;
      experience: string;
    }>;
    frameworks: Array<{
      name: string;
      repositories: number;
      experience: string;
    }>;
    tools: Array<{
      name: string;
      repositories: number;
      experience: string;
    }>;
    cloudPlatforms: Array<{
      name: string;
      repositories: number;
      experience: string;
    }>;
  };
  projectExperience: Array<{
    repository: GitHubRepository;
    role: 'owner' | 'contributor' | 'collaborator';
    contributions: number;
    technologies: string[];
    achievements: string[];
    impact: 'low' | 'medium' | 'high';
  }>;
  collaborationMetrics: {
    pullRequestsCreated: number;
    pullRequestsMerged: number;
    issuesCreated: number;
    issuesClosed: number;
    codeReviews: number;
    totalContributions: number;
    collaborationScore: number;
  };
  professionalInsights: {
    codingFrequency: 'daily' | 'weekly' | 'monthly' | 'occasional';
    preferredWorkStyle: 'solo' | 'team' | 'mixed';
    communicationStyle: 'minimal' | 'detailed' | 'collaborative';
    leadership: 'none' | 'emerging' | 'established';
    specialization: string[];
    interests: string[];
  };
  profileStrength: {
    overall: number;
    completeness: number;
    activity: number;
    impact: number;
    engagement: number;
    suggestions: string[];
  };
}

class GitHubProfileAnalysisService {
  private baseUrl = 'https://api.github.com';
  private rateLimitDelay = 1000; // 1 second between requests

  /**
   * Analyze a GitHub profile comprehensively
   */
  async analyzeProfile(username: string, includePrivateRepos = false): Promise<GitHubProfileAnalysis> {
    const cacheKey = `github_analysis:${username}:${includePrivateRepos}`;

    return cache.wrap(cacheKey, async () => {
      try {
        logger.info('Starting GitHub profile analysis', { username });

        // Fetch user data
        const userProfile = await this.getUser(username);

        // Fetch repositories
        const repositories = await this.getUserRepositories(username, includePrivateRepos);

        // Fetch organizations
        const organizations = await this.getUserOrganizations(username);

        // Fetch contribution calendar
        const contributionCalendar = await this.getContributionCalendar(username);

        // Analyze technical skills
        const technicalSkills = await this.analyzeTechnicalSkills(repositories);

        // Analyze project experience
        const projectExperience = await this.analyzeProjectExperience(repositories, userProfile);

        // Calculate collaboration metrics
        const collaborationMetrics = await this.calculateCollaborationMetrics(username, repositories);

        // Generate professional insights
        const professionalInsights = await this.generateProfessionalInsights(
          userProfile,
          repositories,
          contributionCalendar,
          collaborationMetrics
        );

        // Calculate profile strength
        const profileStrength = this.calculateProfileStrength(
          userProfile,
          repositories,
          contributionCalendar,
          collaborationMetrics
        );

        const analysis: GitHubProfileAnalysis = {
          userProfile,
          repositories,
          organizations,
          contributionCalendar,
          technicalSkills,
          projectExperience,
          collaborationMetrics,
          professionalInsights,
          profileStrength,
        };

        logger.info('GitHub profile analysis completed', {
          username,
          repositoryCount: repositories.length,
          overallScore: profileStrength.overall,
        });

        return analysis;
      } catch (error) {
        logger.error('Error analyzing GitHub profile', error, { username });
        throw error;
      }
    }, 7200); // Cache for 2 hours
  }

  /**
   * Get basic user information
   */
  private async getUser(username: string): Promise<GitHubUser> {
    await this.rateLimitDelay();

    const response = await fetch(`${this.baseUrl}/users/${username}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'JobFinders-GitHub-Analysis/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch GitHub user: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get user repositories
   */
  private async getUserRepositories(username: string, includeAll = false): Promise<GitHubRepository[]> {
    const repositories: GitHubRepository[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      await this.rateLimitDelay();

      const response = await fetch(
        `${this.baseUrl}/users/${username}/repos?per_page=${perPage}&page=${page}&type=${includeAll ? 'all' : 'public'}`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'JobFinders-GitHub-Analysis/1.0',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch repositories: ${response.statusText}`);
      }

      const pageRepos: GitHubRepository[] = await response.json();

      if (pageRepos.length === 0) break;

      repositories.push(...pageRepos);
      page++;
    }

    // Enrich repositories with language statistics
    for (const repo of repositories) {
      if (repo.language) {
        repo.languages = await this.getRepositoryLanguages(repo.owner.login, repo.name);
      }
    }

    return repositories;
  }

  /**
   * Get repository languages
   */
  private async getRepositoryLanguages(owner: string, repo: string): Promise<{ [key: string]: number }> {
    await this.rateLimitDelay();

    const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/languages`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'JobFinders-GitHub-Analysis/1.0',
      },
    });

    if (!response.ok) {
      return {};
    }

    return await response.json();
  }

  /**
   * Get user organizations
   */
  private async getUserOrganizations(username: string): Promise<GitHubOrganization[]> {
    await this.rateLimitDelay();

    const response = await fetch(`${this.baseUrl}/users/${username}/orgs`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'JobFinders-GitHub-Analysis/1.0',
      },
    });

    if (!response.ok) {
      return [];
    }

    const orgs: GitHubOrganization[] = await response.json();

    // Enrich with additional organization details
    for (const org of orgs) {
      const details = await this.getOrganizationDetails(org.login);
      Object.assign(org, details);
    }

    return orgs;
  }

  /**
   * Get organization details
   */
  private async getOrganizationDetails(org: string): Promise<Partial<GitHubOrganization>> {
    await this.rateLimitDelay();

    const response = await fetch(`${this.baseUrl}/orgs/${org}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'JobFinders-GitHub-Analysis/1.0',
      },
    });

    if (!response.ok) {
      return {};
    }

    const details = await response.json();

    return {
      members: details.members || 0,
      repos: details.public_repos || 0,
      location: details.location,
      website: details.blog,
      isVerified: details.is_verified || false,
    };
  }

  /**
   * Get contribution calendar
   */
  private async getContributionCalendar(username: string): Promise<GitHubContribution[]> {
    await this.rateLimitDelay();

    const query = `
      query($username: String!) {
        user(login: $username) {
          contributionsCollection {
            contributionCalendar {
              weeks {
                contributionDays {
                  date
                  contributionCount
                  color
                }
              }
            }
          }
        }
      }
    `;

    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'JobFinders-GitHub-Analysis/1.0',
      },
      body: JSON.stringify({
        query,
        variables: { username },
      }),
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const weeks = data.data?.user?.contributionsCollection?.contributionCalendar?.weeks || [];

    const contributions: GitHubContribution[] = [];
    weeks.forEach((week: any) => {
      week.contributionDays?.forEach((day: any) => {
        contributions.push({
          date: day.date,
          count: day.contributionCount,
          color: day.color,
        });
      });
    });

    return contributions;
  }

  /**
   * Analyze technical skills from repositories
   */
  private async analyzeTechnicalSkills(repositories: GitHubRepository[]): Promise<GitHubProfileAnalysis['technicalSkills']> {
    const languages: { [key: string]: { count: number; bytes: number; repos: string[] } } = {};
    const frameworks: { [key: string]: { count: number; repos: string[] } } = {};
    const tools: { [key: string]: { count: number; repos: string[] } } = {};
    const cloudPlatforms: { [key: string]: { count: number; repos: string[] } } = {};

    // Process languages
    repositories.forEach(repo => {
      if (repo.language) {
        if (!languages[repo.language]) {
          languages[repo.language] = { count: 0, bytes: 0, repos: [] };
        }
        languages[repo.language].count++;
        languages[repo.language].repos.push(repo.name);

        if (repo.languages[repo.language]) {
          languages[repo.language].bytes += repo.languages[repo.language];
        }
      }

      // Extract frameworks and tools from topics
      repo.topics.forEach(topic => {
        const framework = this.identifyFramework(topic);
        if (framework) {
          if (!frameworks[framework]) {
            frameworks[framework] = { count: 0, repos: [] };
          }
          frameworks[framework].count++;
          frameworks[framework].repos.push(repo.name);
        }

        const tool = this.identifyTool(topic);
        if (tool) {
          if (!tools[tool]) {
            tools[tool] = { count: 0, repos: [] };
          }
          tools[tool].count++;
          tools[tool].repos.push(repo.name);
        }

        const cloud = this.identifyCloudPlatform(topic);
        if (cloud) {
          if (!cloudPlatforms[cloud]) {
            cloudPlatforms[cloud] = { count: 0, repos: [] };
          }
          cloudPlatforms[cloud].count++;
          cloudPlatforms[cloud].repos.push(repo.name);
        }
      });
    });

    // Calculate proficiency levels for languages
    const languageArray = Object.entries(languages).map(([name, data]) => ({
      name,
      proficiency: this.calculateProficiency(data.count, data.bytes),
      repositories: data.count,
      linesOfCode: data.bytes,
      experience: this.generateExperienceDescription(data.count, data.bytes),
    }));

    // Sort by proficiency
    languageArray.sort((a, b) => {
      const levels = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
      return levels[b.proficiency] - levels[a.proficiency];
    });

    return {
      languages: languageArray,
      frameworks: Object.entries(frameworks).map(([name, data]) => ({
        name,
        repositories: data.count,
        experience: this.generateExperienceDescription(data.count, 0),
      })),
      tools: Object.entries(tools).map(([name, data]) => ({
        name,
        repositories: data.count,
        experience: this.generateExperienceDescription(data.count, 0),
      })),
      cloudPlatforms: Object.entries(cloudPlatforms).map(([name, data]) => ({
        name,
        repositories: data.count,
        experience: this.generateExperienceDescription(data.count, 0),
      })),
    };
  }

  /**
   * Analyze project experience
   */
  private async analyzeProjectExperience(
    repositories: GitHubRepository[],
    userProfile: GitHubUser
  ): Promise<GitHubProfileAnalysis['projectExperience']> {
    return repositories
      .filter(repo => !repo.isFork && (repo.stars > 0 || repo.forks > 0 || repo.description))
      .map(repo => {
        const role = repo.owner.login === userProfile.login ? 'owner' : 'contributor';
        const impact = this.calculateProjectImpact(repo);
        const technologies = [
          repo.language,
          ...repo.topics,
          ...Object.keys(repo.languages)
        ].filter(Boolean);

        return {
          repository: repo,
          role,
          contributions: this.estimateContributions(repo, role),
          technologies: [...new Set(technologies)],
          achievements: this.extractAchievements(repo),
          impact,
        };
      })
      .sort((a, b) => {
        const impactLevels = { high: 3, medium: 2, low: 1 };
        return impactLevels[b.impact] - impactLevels[a.impact];
      });
  }

  /**
   * Calculate collaboration metrics
   */
  private async calculateCollaborationMetrics(
    username: string,
    repositories: GitHubRepository[]
  ): Promise<GitHubProfileAnalysis['collaborationMetrics']> {
    // For this implementation, we'll estimate based on available data
    // In a full implementation, you would fetch actual PR/issue data

    const totalRepos = repositories.length;
    const forkedRepos = repositories.filter(repo => repo.isFork).length;
    const collaboratedRepos = repositories.filter(repo =>
      repo.owner.login !== username && !repo.isFork
    ).length;

    const pullRequestsCreated = Math.floor(collaboratedRepos * 2.5); // Estimate
    const pullRequestsMerged = Math.floor(pullRequestsCreated * 0.8); // Estimate
    const issuesCreated = Math.floor(totalRepos * 3);
    const issuesClosed = Math.floor(issuesCreated * 0.7);
    const codeReviews = Math.floor(collaboratedRepos * 5);
    const totalContributions = pullRequestsMerged + issuesClosed;

    const collaborationScore = this.calculateCollaborationScore({
      pullRequestsCreated,
      pullRequestsMerged,
      issuesCreated,
      issuesClosed,
      codeReviews,
      totalRepos,
      collaboratedRepos,
    });

    return {
      pullRequestsCreated,
      pullRequestsMerged,
      issuesCreated,
      issuesClosed,
      codeReviews,
      totalContributions,
      collaborationScore,
    };
  }

  /**
   * Generate professional insights
   */
  private async generateProfessionalInsights(
    userProfile: GitHubUser,
    repositories: GitHubRepository[],
    contributionCalendar: GitHubContribution[],
    collaborationMetrics: GitHubProfileAnalysis['collaborationMetrics']
  ): Promise<GitHubProfileAnalysis['professionalInsights']> {
    // Analyze coding frequency
    const codingFrequency = this.analyzeCodingFrequency(contributionCalendar);

    // Analyze work style
    const preferredWorkStyle = this.analyzeWorkStyle(repositories, collaborationMetrics);

    // Analyze communication style
    const communicationStyle = this.analyzeCommunicationStyle(userProfile, repositories);

    // Analyze leadership
    const leadership = this.analyzeLeadership(repositories, collaborationMetrics);

    // Identify specialization
    const specialization = this.identifySpecialization(repositories);

    // Extract interests
    const interests = this.extractInterests(userProfile, repositories);

    return {
      codingFrequency,
      preferredWorkStyle,
      communicationStyle,
      leadership,
      specialization,
      interests,
    };
  }

  /**
   * Calculate profile strength
   */
  private calculateProfileStrength(
    userProfile: GitHubUser,
    repositories: GitHubRepository[],
    contributionCalendar: GitHubContribution[],
    collaborationMetrics: GitHubProfileAnalysis['collaborationMetrics']
  ): GitHubProfileAnalysis['profileStrength'] {
    let completeness = 0;
    let activity = 0;
    let impact = 0;
    let engagement = 0;

    // Completeness (40%)
    if (userProfile.name) completeness += 10;
    if (userProfile.bio) completeness += 10;
    if (userProfile.location) completeness += 5;
    if (userProfile.email) completeness += 5;
    if (userProfile.company) completeness += 5;
    if (repositories.length >= 10) completeness += 5;

    // Activity (30%)
    const totalContributions = contributionCalendar.reduce((sum, day) => sum + day.count, 0);
    if (totalContributions > 1000) activity += 15;
    else if (totalContributions > 100) activity += 10;
    else if (totalContributions > 10) activity += 5;

    const activeDays = contributionCalendar.filter(day => day.count > 0).length;
    if (activeDays > 200) activity += 15;
    else if (activeDays > 50) activity += 10;
    else if (activeDays > 10) activity += 5;

    // Impact (20%)
    const totalStars = repositories.reduce((sum, repo) => sum + repo.stars, 0);
    if (totalStars > 100) impact += 10;
    else if (totalStars > 10) impact += 7;
    else if (totalStars > 0) impact += 3;

    const totalForks = repositories.reduce((sum, repo) => sum + repo.forks, 0);
    if (totalForks > 50) impact += 10;
    else if (totalForks > 5) impact += 5;

    // Engagement (10%)
    if (collaborationMetrics.collaborationScore > 80) engagement += 10;
    else if (collaborationMetrics.collaborationScore > 60) engagement += 7;
    else if (collaborationMetrics.collaborationScore > 40) engagement += 5;

    const overall = Math.round(
      completeness * 0.4 + activity * 0.3 + impact * 0.2 + engagement * 0.1
    );

    // Generate suggestions
    const suggestions: string[] = [];
    if (!userProfile.name) suggestions.push('Add your real name to your profile');
    if (!userProfile.bio) suggestions.push('Write a professional bio');
    if (!userProfile.location) suggestions.push('Add your location');
    if (repositories.length < 5) suggestions.push('Create more public repositories');
    if (totalStars === 0) suggestions.push('Work on projects that provide value to others');
    if (collaborationMetrics.collaborationScore < 50) suggestions.push('Contribute to open source projects');

    return {
      overall,
      completeness,
      activity,
      impact,
      engagement,
      suggestions,
    };
  }

  // Helper methods

  private async rateLimitDelay(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));
  }

  private identifyFramework(topic: string): string | null {
    const frameworks = [
      'react', 'vue', 'angular', 'svelte', 'nextjs', 'nuxtjs', 'gatsby',
      'express', 'django', 'flask', 'rails', 'laravel', 'spring', 'fastapi',
      'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'numpy', 'pandas',
      'tailwindcss', 'bootstrap', 'material-ui', 'ant-design', 'chakra-ui'
    ];

    const normalized = topic.toLowerCase();
    return frameworks.find(framework => normalized.includes(framework)) || null;
  }

  private identifyTool(topic: string): string | null {
    const tools = [
      'docker', 'kubernetes', 'jenkins', 'github-actions', 'gitlab-ci',
      'webpack', 'vite', 'parcel', 'rollup', 'babel', 'eslint', 'prettier',
      'redis', 'mongodb', 'postgresql', 'mysql', 'sqlite', 'elasticsearch',
      'aws', 'azure', 'gcp', 'terraform', 'ansible', 'puppet', 'chef'
    ];

    const normalized = topic.toLowerCase();
    return tools.find(tool => normalized.includes(tool)) || null;
  }

  private identifyCloudPlatform(topic: string): string | null {
    const platforms = ['aws', 'azure', 'gcp', 'google-cloud', 'heroku', 'vercel', 'netlify'];
    const normalized = topic.toLowerCase();
    return platforms.find(platform => normalized.includes(platform)) || null;
  }

  private calculateProficiency(repoCount: number, linesOfCode: number): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
    if (repoCount >= 20 && linesOfCode > 100000) return 'expert';
    if (repoCount >= 10 && linesOfCode > 50000) return 'advanced';
    if (repoCount >= 5 && linesOfCode > 10000) return 'intermediate';
    return 'beginner';
  }

  private generateExperienceDescription(repoCount: number, linesOfCode: number): string {
    if (repoCount >= 20) return `Extensive experience across ${repoCount}+ repositories`;
    if (repoCount >= 10) return `Solid experience across ${repoCount}+ repositories`;
    if (repoCount >= 5) return `Good experience across ${repoCount} repositories`;
    return `Initial experience across ${repoCount} repositories`;
  }

  private calculateProjectImpact(repo: GitHubRepository): 'low' | 'medium' | 'high' {
    const score = (repo.stars * 2) + repo.forks + (repo.watchers * 0.5);
    if (score > 100) return 'high';
    if (score > 20) return 'medium';
    return 'low';
  }

  private estimateContributions(repo: GitHubRepository, role: 'owner' | 'contributor' | 'collaborator'): number {
    if (role === 'owner') return Math.floor(repo.size * 0.8);
    return Math.floor(repo.size * 0.3);
  }

  private extractAchievements(repo: GitHubRepository): string[] {
    const achievements: string[] = [];

    if (repo.stars > 0) achievements.push(`${repo.stars} stars`);
    if (repo.forks > 0) achievements.push(`${repo.forks} forks`);
    if (repo.watchers > 0) achievements.push(`${repo.watchers} watchers`);
    if (repo.license) achievements.push(`Open source with ${repo.license.name} license`);
    if (repo.topics.length > 0) achievements.push(`${repo.topics.length} topics/tags`);
    if (repo.isTemplate) achievements.push('Used as a template');

    return achievements;
  }

  private calculateCollaborationScore(metrics: {
    pullRequestsCreated: number;
    pullRequestsMerged: number;
    issuesCreated: number;
    issuesClosed: number;
    codeReviews: number;
    totalRepos: number;
    collaboratedRepos: number;
  }): number {
    let score = 0;

    score += Math.min(metrics.pullRequestsCreated * 2, 30);
    score += Math.min(metrics.pullRequestsMerged * 3, 30);
    score += Math.min(metrics.issuesCreated, 15);
    score += Math.min(metrics.issuesClosed * 2, 15);
    score += Math.min(metrics.codeReviews, 10);

    if (metrics.collaboratedRepos > 0) {
      score += Math.min((metrics.collaboratedRepos / metrics.totalRepos) * 100, 10);
    }

    return Math.min(score, 100);
  }

  private analyzeCodingFrequency(contributionCalendar: GitHubContribution[]): 'daily' | 'weekly' | 'monthly' | 'occasional' {
    const activeDays = contributionCalendar.filter(day => day.count > 0).length;
    const totalDays = contributionCalendar.length;
    const activeRatio = activeDays / totalDays;

    if (activeRatio > 0.7) return 'daily';
    if (activeRatio > 0.3) return 'weekly';
    if (activeRatio > 0.1) return 'monthly';
    return 'occasional';
  }

  private analyzeWorkStyle(repositories: GitHubRepository[], collaborationMetrics: GitHubProfileAnalysis['collaborationMetrics']): 'solo' | 'team' | 'mixed' {
    const soloRepos = repositories.filter(repo => repo.owner.login === repo.name.split('/')[0]).length;
    const totalRepos = repositories.length;
    const soloRatio = soloRepos / totalRepos;

    if (soloRatio > 0.8 && collaborationMetrics.collaborationScore < 30) return 'solo';
    if (soloRatio < 0.3 && collaborationMetrics.collaborationScore > 70) return 'team';
    return 'mixed';
  }

  private analyzeCommunicationStyle(userProfile: GitHubUser, repositories: GitHubRepository[]): 'minimal' | 'detailed' | 'collaborative' {
    let score = 0;

    if (userProfile.bio && userProfile.bio.length > 100) score += 2;
    if (userProfile.email) score += 1;
    if (userProfile.twitterUsername) score += 1;

    const reposWithDescriptions = repositories.filter(repo => repo.description).length;
    score += Math.min(reposWithDescriptions * 0.5, 3);

    const reposWithReadme = repositories.filter(repo => repo.description).length;
    score += Math.min(reposWithReadme * 0.3, 2);

    if (score >= 6) return 'collaborative';
    if (score >= 3) return 'detailed';
    return 'minimal';
  }

  private analyzeLeadership(repositories: GitHubRepository[], collaborationMetrics: GitHubProfileAnalysis['collaborationMetrics']): 'none' | 'emerging' | 'established' {
    let score = 0;

    // Owned repositories
    const ownedRepos = repositories.filter(repo => !repo.isFork).length;
    score += Math.min(ownedRepos * 2, 20);

    // Popular repositories
    const popularRepos = repositories.filter(repo => repo.stars > 10).length;
    score += Math.min(popularRepos * 5, 30);

    // Collaboration leadership
    score += Math.min(collaborationMetrics.codeReviews * 0.5, 20);
    score += Math.min(collaborationMetrics.pullRequestsMerged * 0.3, 15);

    // Mentoring (forked repos with contributions)
    const mentoredRepos = repositories.filter(repo => repo.isFork && repo.stars > 0).length;
    score += Math.min(mentoredRepos * 10, 15);

    if (score >= 60) return 'established';
    if (score >= 25) return 'emerging';
    return 'none';
  }

  private identifySpecialization(repositories: GitHubRepository[]): string[] {
    const languages: { [key: string]: number } = {};
    const topics: { [key: string]: number } = {};

    repositories.forEach(repo => {
      if (repo.language) {
        languages[repo.language] = (languages[repo.language] || 0) + 1;
      }

      repo.topics.forEach(topic => {
        topics[topic] = (topics[topic] || 0) + 1;
      });
    });

    const specializations: string[] = [];

    // Language specializations
    Object.entries(languages)
      .filter(([, count]) => count >= 3)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .forEach(([lang]) => specializations.push(lang));

    // Domain specializations from topics
    const domainTopics = topics.filter(topic =>
      !this.identifyFramework(topic) &&
      !this.identifyTool(topic) &&
      !this.identifyCloudPlatform(topic)
    );

    Object.entries(domainTopics)
      .filter(([, count]) => count >= 2)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .forEach(([topic]) => specializations.push(topic));

    return [...new Set(specializations)];
  }

  private extractInterests(userProfile: GitHubUser, repositories: GitHubRepository[]): string[] {
    const interests: string[] = [];

    // From bio
    if (userProfile.bio) {
      const bioInterests = keywordAnalyzer.extractKeywords(userProfile.bio, {
        categories: ['interests', 'hobbies'],
        minConfidence: 0.6,
      });
      interests.push(...bioInterests.map(k => k.text));
    }

    // From repository topics
    const allTopics = repositories.flatMap(repo => repo.topics);
    const topicCounts: { [key: string]: number } = {};

    allTopics.forEach(topic => {
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    });

    Object.entries(topicCounts)
      .filter(([, count]) => count >= 2)
      .map(([topic]) => topic)
      .forEach(topic => interests.push(topic));

    return [...new Set(interests)].slice(0, 10);
  }
}

export { GitHubProfileAnalysisService };
export type {
  GitHubUser,
  GitHubRepository,
  GitHubCommit,
  GitHubPullRequest,
  GitHubIssue,
  GitHubContribution,
  GitHubOrganization,
  GitHubProfileAnalysis,
};