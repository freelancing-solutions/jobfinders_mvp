import { Redis } from '@/lib/redis';
import { Logger } from '@/lib/logger';
import { AgentType } from '@/types/agents';
import { prisma } from '@/lib/prisma';

export interface UserContext {
  userId: string;
  profile: UserProfile;
  career: CareerContext;
  preferences: UserPreferences;
  skills: SkillContext;
  applications: ApplicationContext;
  recentActivity: ActivityContext;
  goals: GoalContext;
}

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  location?: string;
  industry?: string;
  experienceLevel: string;
  currentPosition?: string;
  company?: string;
  linkedInUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
}

export interface CareerContext {
  currentTitle?: string;
  targetTitles: string[];
  targetIndustries: string[];
  targetLocations: string[];
  careerStage: 'early' | 'mid' | 'senior' | 'executive';
  salaryExpectation?: {
    min?: number;
    max?: number;
    currency: string;
  };
  careerGoals: string[];
  workPreferences: {
    remote: boolean;
    hybrid: boolean;
    onsite: boolean;
    contract: boolean;
    fullTime: boolean;
    partTime: boolean;
  };
}

export interface SkillContext {
  technicalSkills: Skill[];
  softSkills: Skill[];
  certifications: Certification[];
  learningGoals: LearningGoal[];
  skillGaps: SkillGap[];
}

export interface Skill {
  name: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsExperience?: number;
  lastUsed?: Date;
  verified: boolean;
}

export interface Certification {
  name: string;
  issuer: string;
  issueDate: Date;
  expiryDate?: Date;
  credentialId?: string;
  credentialUrl?: string;
}

export interface LearningGoal {
  skill: string;
  targetLevel: string;
  priority: 'low' | 'medium' | 'high';
  timeline?: string;
  resources?: string[];
}

export interface SkillGap {
  skill: string;
  currentLevel: string;
  targetLevel: string;
  importance: 'low' | 'medium' | 'high';
  timeToAcquire?: string;
  recommendedResources?: string[];
}

export interface ApplicationContext {
  activeApplications: Application[];
  recentApplications: Application[];
  applicationStats: ApplicationStats;
  savedJobs: SavedJob[];
  applicationPreferences: ApplicationPreferences;
}

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  status: string;
  appliedDate: Date;
  lastUpdate?: Date;
  nextAction?: string;
  notes?: string;
}

export interface ApplicationStats {
  totalApplied: number;
  interviewCount: number;
  offerCount: number;
  rejectionCount: number;
  responseRate: number;
  averageResponseTime: number;
  successRate: number;
}

export interface SavedJob {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  savedDate: Date;
  notes?: string;
  tags?: string[];
}

export interface ApplicationPreferences {
  autoApplyEnabled: boolean;
  notificationFrequency: 'immediate' | 'daily' | 'weekly';
  followUpEnabled: boolean;
  statusTrackingEnabled: boolean;
}

export interface ActivityContext {
  recentSearches: RecentSearch[];
  recentViews: RecentView[];
  interactionHistory: Interaction[];
  engagementMetrics: EngagementMetrics;
}

export interface RecentSearch {
  query: string;
  filters: Record<string, any>;
  timestamp: Date;
  resultsCount: number;
}

export interface RecentView {
  type: 'job' | 'company' | 'profile';
  id: string;
  title: string;
  timestamp: Date;
  duration?: number;
}

export interface Interaction {
  type: string;
  target: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface EngagementMetrics {
  sessionCount: number;
  averageSessionDuration: number;
  lastActiveDate: Date;
  featureUsage: Record<string, number>;
  satisfactionScore?: number;
}

export interface GoalContext {
  shortTermGoals: Goal[];
  longTermGoals: Goal[];
  milestones: Milestone[];
  progress: GoalProgress;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'career' | 'skill' | 'application' | 'networking';
  targetDate: Date;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  progress: number;
}

export interface Milestone {
  id: string;
  goalId: string;
  title: string;
  completed: boolean;
  completedDate?: Date;
  targetDate: Date;
}

export interface GoalProgress {
  overallCompletion: number;
  categoryProgress: Record<string, number>;
  upcomingDeadlines: Goal[];
  recentAchievements: Milestone[];
}

export interface UserPreferences {
  agentPreferences: Record<AgentType, AgentPreference>;
  communicationStyle: 'formal' | 'casual' | 'friendly';
  responseLength: 'concise' | 'detailed' | 'comprehensive';
  language: string;
  timezone: string;
  notifications: NotificationPreferences;
  privacy: PrivacyPreferences;
}

export interface AgentPreference {
  enabled: boolean;
  frequency: 'real-time' | 'daily' | 'weekly' | 'on-demand';
  customizations: Record<string, any>;
  feedbackHistory: FeedbackEntry[];
}

export interface FeedbackEntry {
  rating: number;
  comment?: string;
  timestamp: Date;
  interactionType: string;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  frequency: 'immediate' | 'daily' | 'weekly';
  categories: Record<string, boolean>;
}

export interface PrivacyPreferences {
  dataSharing: boolean;
  analytics: boolean;
  personalization: boolean;
  thirdPartyIntegrations: boolean;
  dataRetention: '30days' | '90days' | '1year' | 'forever';
}

export class ContextManager {
  private redis: Redis;
  private logger: Logger;
  private readonly CONTEXT_TTL = 60 * 60; // 1 hour in seconds

  constructor() {
    this.redis = new Redis();
    this.logger = new Logger('ContextManager');
  }

  /**
   * Get comprehensive user context
   */
  async getUserContext(userId: string): Promise<Record<string, any>> {
    try {
      // Try to get cached context first
      const cachedContext = await this.getCachedContext(userId);
      if (cachedContext) {
        return cachedContext;
      }

      // Build context from database
      const context = await this.buildUserContext(userId);

      // Cache the context
      await this.cacheContext(userId, context);

      return context;

    } catch (error) {
      this.logger.error(`Error getting user context for ${userId}:`, error);
      return {};
    }
  }

  /**
   * Update user context
   */
  async updateUserContext(userId: string, updates: Partial<UserContext>): Promise<void> {
    try {
      const currentContext = await this.getUserContext(userId);
      const updatedContext = { ...currentContext, ...updates };

      // Cache updated context
      await this.cacheContext(userId, updatedContext);

      // Update database if needed
      await this.updateDatabaseContext(userId, updates);

    } catch (error) {
      this.logger.error(`Error updating user context for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const preferences = await prisma.userAgentPreferences.findUnique({
        where: { userId }
      });

      if (!preferences) {
        return this.createDefaultPreferences(userId);
      }

      return preferences as any;

    } catch (error) {
      this.logger.error(`Error getting user preferences for ${userId}:`, error);
      return null;
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(
    userId: string,
    preferences: Partial<UserPreferences>
  ): Promise<void> {
    try {
      await prisma.userAgentPreferences.upsert({
        where: { userId },
        update: preferences as any,
        create: {
          userId,
          ...preferences
        } as any
      });

      // Invalidate cached context
      await this.invalidateCachedContext(userId);

    } catch (error) {
      this.logger.error(`Error updating user preferences for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Share context between agents
   */
  async shareContext(
    fromAgent: AgentType,
    toAgent: AgentType,
    userId: string,
    context: Record<string, any>
  ): Promise<void> {
    try {
      const shareKey = `context:share:${fromAgent}:${toAgent}:${userId}`;
      await this.redis.setex(shareKey, this.CONTEXT_TTL, JSON.stringify({
        fromAgent,
        toAgent,
        userId,
        context,
        timestamp: new Date()
      }));

      this.logger.info(`Shared context from ${fromAgent} to ${toAgent} for user ${userId}`);

    } catch (error) {
      this.logger.error(`Error sharing context between agents:`, error);
      throw error;
    }
  }

  /**
   * Get shared context from another agent
   */
  async getSharedContext(
    fromAgent: AgentType,
    toAgent: AgentType,
    userId: string
  ): Promise<Record<string, any> | null> {
    try {
      const shareKey = `context:share:${fromAgent}:${toAgent}:${userId}`;
      const sharedData = await this.redis.get(shareKey);

      if (!sharedData) {
        return null;
      }

      const parsed = JSON.parse(sharedData);
      return parsed.context;

    } catch (error) {
      this.logger.error(`Error getting shared context:`, error);
      return null;
    }
  }

  /**
   * Get context relevance score for a specific query
   */
  async getContextRelevance(
    userId: string,
    query: string,
    agentType: AgentType
  ): Promise<number> {
    try {
      const context = await this.getUserContext(userId);
      const keywords = this.extractKeywords(query);
      let relevanceScore = 0;

      // Check profile relevance
      if (context.profile) {
        const profileText = Object.values(context.profile).join(' ').toLowerCase();
        relevanceScore += this.calculateKeywordMatch(keywords, profileText) * 0.3;
      }

      // Check career relevance
      if (context.career) {
        const careerText = JSON.stringify(context.career).toLowerCase();
        relevanceScore += this.calculateKeywordMatch(keywords, careerText) * 0.3;
      }

      // Check skills relevance
      if (context.skills) {
        const skillsText = JSON.stringify(context.skills).toLowerCase();
        relevanceScore += this.calculateKeywordMatch(keywords, skillsText) * 0.2;
      }

      // Check recent activity relevance
      if (context.recentActivity) {
        const activityText = JSON.stringify(context.recentActivity).toLowerCase();
        relevanceScore += this.calculateKeywordMatch(keywords, activityText) * 0.2;
      }

      return Math.min(relevanceScore, 1.0);

    } catch (error) {
      this.logger.error(`Error calculating context relevance:`, error);
      return 0;
    }
  }

  /**
   * Build user context from database
   */
  private async buildUserContext(userId: string): Promise<Record<string, any>> {
    try {
      // Get user basic info
      const user = await prisma.user.findUnique({
        where: { uid: userId },
        include: {
          jobSeekerProfile: true,
          resumes: true,
          applications: {
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Build profile context
      const profile: UserProfile = {
        name: user.name || '',
        email: user.email,
        role: user.role,
        experienceLevel: this.determineExperienceLevel(user.jobSeekerProfile)
      };

      // Build career context from profile
      const careerContext = await this.buildCareerContext(userId);

      // Build skills context
      const skillsContext = await this.buildSkillsContext(userId);

      // Build applications context
      const applicationContext = await this.buildApplicationContext(userId);

      // Build activity context
      const activityContext = await this.buildActivityContext(userId);

      return {
        profile,
        career: careerContext,
        skills: skillsContext,
        applications: applicationContext,
        recentActivity: activityContext
      };

    } catch (error) {
      this.logger.error(`Error building user context for ${userId}:`, error);
      return {};
    }
  }

  /**
   * Build career context
   */
  private async buildCareerContext(userId: string): Promise<CareerContext> {
    // This would integrate with existing career data
    return {
      careerStage: 'mid',
      targetTitles: [],
      targetIndustries: [],
      targetLocations: [],
      careerGoals: [],
      workPreferences: {
        remote: true,
        hybrid: true,
        onsite: false,
        contract: false,
        fullTime: true,
        partTime: false
      }
    };
  }

  /**
   * Build skills context
   */
  private async buildSkillsContext(userId: string): Promise<SkillContext> {
    // This would integrate with existing skills data
    return {
      technicalSkills: [],
      softSkills: [],
      certifications: [],
      learningGoals: [],
      skillGaps: []
    };
  }

  /**
   * Build application context
   */
  private async buildApplicationContext(userId: string): Promise<ApplicationContext> {
    const applications = await prisma.application.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    return {
      activeApplications: applications
        .filter(app => ['applied', 'reviewing'].includes(app.status))
        .map(app => ({
          id: app.id,
          jobId: app.jobId,
          jobTitle: '', // Would need to join with jobs table
          company: '',
          status: app.status,
          appliedDate: app.createdAt,
          lastUpdate: app.updatedAt
        })),
      recentApplications: applications.slice(0, 5).map(app => ({
        id: app.id,
        jobId: app.jobId,
        jobTitle: '',
        company: '',
        status: app.status,
        appliedDate: app.createdAt
      })),
      applicationStats: {
        totalApplied: applications.length,
        interviewCount: applications.filter(app => app.status === 'interview').length,
        offerCount: applications.filter(app => app.status === 'offered').length,
        rejectionCount: applications.filter(app => app.status === 'rejected').length,
        responseRate: 0,
        averageResponseTime: 0,
        successRate: 0
      },
      savedJobs: [],
      applicationPreferences: {
        autoApplyEnabled: false,
        notificationFrequency: 'daily',
        followUpEnabled: true,
        statusTrackingEnabled: true
      }
    };
  }

  /**
   * Build activity context
   */
  private async buildActivityContext(userId: string): Promise<ActivityContext> {
    // This would integrate with existing activity tracking
    return {
      recentSearches: [],
      recentViews: [],
      interactionHistory: [],
      engagementMetrics: {
        sessionCount: 0,
        averageSessionDuration: 0,
        lastActiveDate: new Date(),
        featureUsage: {}
      }
    };
  }

  /**
   * Cache user context in Redis
   */
  private async cacheContext(userId: string, context: Record<string, any>): Promise<void> {
    const cacheKey = `context:user:${userId}`;
    await this.redis.setex(cacheKey, this.CONTEXT_TTL, JSON.stringify(context));
  }

  /**
   * Get cached user context
   */
  private async getCachedContext(userId: string): Promise<Record<string, any> | null> {
    try {
      const cacheKey = `context:user:${userId}`;
      const cachedData = await this.redis.get(cacheKey);

      if (!cachedData) {
        return null;
      }

      return JSON.parse(cachedData);

    } catch (error) {
      this.logger.error(`Error getting cached context for ${userId}:`, error);
      return null;
    }
  }

  /**
   * Invalidate cached context
   */
  private async invalidateCachedContext(userId: string): Promise<void> {
    try {
      const cacheKey = `context:user:${userId}`;
      await this.redis.del(cacheKey);
    } catch (error) {
      this.logger.error(`Error invalidating cached context for ${userId}:`, error);
    }
  }

  /**
   * Update database context
   */
  private async updateDatabaseContext(
    userId: string,
    updates: Partial<UserContext>
  ): Promise<void> {
    // This would update relevant database tables based on the context updates
    // Implementation depends on the specific database schema
  }

  /**
   * Create default user preferences
   */
  private createDefaultPreferences(userId: string): UserPreferences {
    return {
      agentPreferences: {} as Record<AgentType, AgentPreference>,
      communicationStyle: 'friendly',
      responseLength: 'detailed',
      language: 'en',
      timezone: 'UTC',
      notifications: {
        email: true,
        push: true,
        inApp: true,
        frequency: 'daily',
        categories: {}
      },
      privacy: {
        dataSharing: true,
        analytics: true,
        personalization: true,
        thirdPartyIntegrations: false,
        dataRetention: '1year'
      }
    };
  }

  /**
   * Determine experience level from profile
   */
  private determineExperienceLevel(profile: any): string {
    // Logic to determine experience level from user profile
    return 'intermediate';
  }

  /**
   * Extract keywords from query
   */
  private extractKeywords(query: string): string[] {
    return query.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !['the', 'and', 'for', 'with', 'that', 'this'].includes(word));
  }

  /**
   * Calculate keyword match score
   */
  private calculateKeywordMatch(keywords: string[], text: string): number {
    if (keywords.length === 0) return 0;

    const matches = keywords.filter(keyword => text.includes(keyword));
    return matches.length / keywords.length;
  }
}