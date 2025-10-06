/**
 * Social Media Integration Service
 *
 * This service integrates with various social media platforms to enrich
 * user profiles with additional professional information, skills, and
 * accomplishments.
 */

import { prisma } from '@/lib/prisma';
import { cache } from '@/lib/cache';
import { rateLimit } from '@/lib/rate-limiter';
import { logger } from '@/lib/logger';
import { textExtractor } from '@/lib/text-extractor';
import { keywordAnalyzer } from '@/lib/keyword-analyzer';

export interface LinkedInProfileData {
  id: string;
  firstName: string;
  lastName: string;
  headline: string;
  summary: string;
  location: string;
  industry: string;
  experience: LinkedInExperience[];
  education: LinkedInEducation[];
  skills: string[];
  certifications: LinkedInCertification[];
  languages: LinkedInLanguage[];
  projects: LinkedInProject[];
  honors: LinkedInHonor[];
  recommendations: LinkedInRecommendation[];
  profileUrl: string;
  avatarUrl?: string;
}

export interface LinkedInExperience {
  id: string;
  title: string;
  company: string;
  location?: string;
  startDate: Date;
  endDate?: Date;
  isCurrentJob: boolean;
  description?: string;
  skills: string[];
  achievements: string[];
}

export interface LinkedInEducation {
  id: string;
  schoolName: string;
  degree: string;
  fieldOfStudy: string;
  startDate?: Date;
  endDate?: Date;
  grade?: string;
  activities?: string[];
  description?: string;
}

export interface LinkedInCertification {
  id: string;
  name: string;
  issuingOrganization: string;
  issueDate: Date;
  expirationDate?: Date;
  credentialUrl?: string;
  credentialId?: string;
}

export interface LinkedInLanguage {
  id: string;
  name: string;
  proficiency: string;
}

export interface LinkedInProject {
  id: string;
  title: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  url?: string;
  skills: string[];
  accomplishments: string[];
}

export interface LinkedInHonor {
  id: string;
  title: string;
  issuer: string;
  date: Date;
  description?: string;
}

export interface LinkedInRecommendation {
  id: string;
  recommender: string;
  recommenderTitle: string;
  recommenderCompany: string;
  text: string;
  date: Date;
  relationship: string;
}

export interface GitHubProfileData {
  id: string;
  login: string;
  name: string;
  bio?: string;
  location?: string;
  email?: string;
  website?: string;
  company?: string;
  avatarUrl: string;
  followers: number;
  following: number;
  publicRepos: number;
  repositories: GitHubRepository[];
  contributions: GitHubContribution[];
  organizations: GitHubOrganization[];
  skills: string[];
  languages: string[];
  profileUrl: string;
  joinedAt: Date;
}

export interface GitHubRepository {
  id: string;
  name: string;
  fullName: string;
  description?: string;
  language: string;
  languages: { [key: string]: number };
  stars: number;
  forks: number;
  watchers: number;
  size: number;
  isPrivate: boolean;
  isFork: boolean;
  createdAt: Date;
  updatedAt: Date;
  pushedAt: Date;
  url: string;
  homepage?: string;
  topics: string[];
  contributions: number;
  contributionsCount: number;
}

export interface GitHubContribution {
  date: Date;
  count: number;
  repository: string;
  type: 'commit' | 'pull_request' | 'issue' | 'review';
}

export interface GitHubOrganization {
  id: string;
  login: string;
  name?: string;
  description?: string;
  avatarUrl: string;
  members: number;
  repos: number;
  url: string;
}

export interface TwitterProfileData {
  id: string;
  username: string;
  name: string;
  bio?: string;
  location?: string;
  website?: string;
  followersCount: number;
  followingCount: number;
  tweetsCount: number;
  listedCount: number;
  verified: boolean;
  protected: boolean;
  createdAt: Date;
  profileImageUrl?: string;
  profileBannerUrl?: string;
  professionalTweets: TwitterTweet[];
  hashtags: string[];
  mentions: string[];
  profileUrl: string;
}

export interface TwitterTweet {
  id: string;
  text: string;
  createdAt: Date;
  retweetCount: number;
  likeCount: number;
  replyCount: number;
  quoteCount: number;
  hashtags: string[];
  mentions: string[];
  urls: string[];
  media?: TwitterMedia[];
  isProfessional: boolean;
  engagement: number;
}

export interface TwitterMedia {
  id: string;
  type: 'photo' | 'video' | 'animated_gif';
  url: string;
  previewImageUrl?: string;
  width?: number;
  height?: number;
}

export interface SocialMediaEnrichment {
  userId: string;
  linkedinData?: LinkedInProfileData;
  githubData?: GitHubProfileData;
  twitterData?: TwitterProfileData;
  enrichedSkills: string[];
  experienceEnhancements: ExperienceEnhancement[];
  projectAdditions: ProjectAddition[];
  skillValidations: SkillValidation[];
  profileCompleteness: ProfileCompleteness;
  lastUpdated: Date;
}

export interface ExperienceEnhancement {
  originalExperienceId: string;
  enrichedData: {
    achievements: string[];
    skills: string[];
    technologies: string[];
    metrics?: { [key: string]: number };
    descriptions: string[];
  };
  confidence: number;
  source: 'linkedin' | 'github' | 'twitter';
}

export interface ProjectAddition {
  title: string;
  description: string;
  technologies: string[];
  url?: string;
  startDate?: Date;
  endDate?: Date;
  achievements: string[];
  source: 'github' | 'linkedin' | 'twitter';
  confidence: number;
}

export interface SkillValidation {
  skill: string;
  validated: boolean;
  evidence: string[];
  confidence: number;
  source: 'linkedin' | 'github' | 'twitter';
  lastValidated: Date;
}

export interface ProfileCompleteness {
  overall: number;
  sections: {
    personal: number;
    experience: number;
    education: number;
    skills: number;
    projects: number;
    accomplishments: number;
  };
  missingFields: string[];
  suggestions: string[];
}

export interface SocialMediaConnection {
  id: string;
  userId: string;
  platform: 'linkedin' | 'github' | 'twitter';
  platformUserId: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  isActive: boolean;
  lastSync: Date;
  syncFrequency: number; // hours
  data: any; // platform-specific data
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncResult {
  success: boolean;
  platform: string;
  newItems: number;
  updatedItems: number;
  errors: string[];
  lastSync: Date;
  nextSync: Date;
}

class SocialMediaIntegrationService {
  private static instance: SocialMediaIntegrationService;

  private constructor() {}

  static getInstance(): SocialMediaIntegrationService {
    if (!SocialMediaIntegrationService.instance) {
      SocialMediaIntegrationService.instance = new SocialMediaIntegrationService();
    }
    return SocialMediaIntegrationService.instance;
  }

  /**
   * Connect a social media account
   */
  async connectSocialMedia(
    userId: string,
    platform: 'linkedin' | 'github' | 'twitter',
    authData: {
      accessToken?: string;
      refreshToken?: string;
      tokenExpiresAt?: Date;
      platformUserId: string;
      additionalData?: any;
    }
  ): Promise<SocialMediaConnection> {
    try {
      // Check if connection already exists
      const existingConnection = await prisma.socialMediaConnection.findFirst({
        where: {
          userId,
          platform,
        },
      });

      if (existingConnection) {
        // Update existing connection
        const updatedConnection = await prisma.socialMediaConnection.update({
          where: { id: existingConnection.id },
          data: {
            platformUserId: authData.platformUserId,
            accessToken: authData.accessToken,
            refreshToken: authData.refreshToken,
            tokenExpiresAt: authData.tokenExpiresAt,
            isActive: true,
            lastSync: new Date(),
            data: authData.additionalData || {},
            updatedAt: new Date(),
          },
        });

        logger.info('Updated social media connection', {
          userId,
          platform,
          connectionId: updatedConnection.id,
        });

        return updatedConnection;
      } else {
        // Create new connection
        const connection = await prisma.socialMediaConnection.create({
          data: {
            userId,
            platform,
            platformUserId: authData.platformUserId,
            accessToken: authData.accessToken,
            refreshToken: authData.refreshToken,
            tokenExpiresAt: authData.tokenExpiresAt,
            isActive: true,
            lastSync: new Date(),
            syncFrequency: 24, // Default 24 hours
            data: authData.additionalData || {},
          },
        });

        logger.info('Created social media connection', {
          userId,
          platform,
          connectionId: connection.id,
        });

        return connection;
      }
    } catch (error) {
      logger.error('Error connecting social media account', error, { userId, platform });
      throw error;
    }
  }

  /**
   * Disconnect a social media account
   */
  async disconnectSocialMedia(
    userId: string,
    platform: 'linkedin' | 'github' | 'twitter'
  ): Promise<void> {
    try {
      await prisma.socialMediaConnection.updateMany({
        where: {
          userId,
          platform,
        },
        data: {
          isActive: false,
          accessToken: null,
          refreshToken: null,
          updatedAt: new Date(),
        },
      });

      logger.info('Disconnected social media account', { userId, platform });
    } catch (error) {
      logger.error('Error disconnecting social media account', error, { userId, platform });
      throw error;
    }
  }

  /**
   * Get user's social media connections
   */
  async getSocialMediaConnections(
    userId: string
  ): Promise<SocialMediaConnection[]> {
    try {
      const connections = await prisma.socialMediaConnection.findMany({
        where: {
          userId,
          isActive: true,
        },
        orderBy: {
          lastSync: 'desc',
        },
      });

      return connections;
    } catch (error) {
      logger.error('Error getting social media connections', error, { userId });
      throw error;
    }
  }

  /**
   * Sync data from all connected social media platforms
   */
  async syncAllPlatforms(userId: string): Promise<SyncResult[]> {
    try {
      const connections = await this.getSocialMediaConnections(userId);
      const results: SyncResult[] = [];

      for (const connection of connections) {
        const result = await this.syncPlatform(userId, connection.platform);
        results.push(result);
      }

      return results;
    } catch (error) {
      logger.error('Error syncing all platforms', error, { userId });
      throw error;
    }
  }

  /**
   * Sync data from a specific platform
   */
  async syncPlatform(
    userId: string,
    platform: 'linkedin' | 'github' | 'twitter'
  ): Promise<SyncResult> {
    const cacheKey = `social_sync:${userId}:${platform}`;

    return rateLimit(cacheKey, async () => {
      try {
        const connection = await prisma.socialMediaConnection.findFirst({
          where: {
            userId,
            platform,
            isActive: true,
          },
        });

        if (!connection) {
          throw new Error(`No active ${platform} connection found`);
        }

        let result: SyncResult;

        switch (platform) {
          case 'linkedin':
            result = await this.syncLinkedInData(userId, connection);
            break;
          case 'github':
            result = await this.syncGitHubData(userId, connection);
            break;
          case 'twitter':
            result = await this.syncTwitterData(userId, connection);
            break;
          default:
            throw new Error(`Unsupported platform: ${platform}`);
        }

        // Update connection last sync
        await prisma.socialMediaConnection.update({
          where: { id: connection.id },
          data: {
            lastSync: new Date(),
            updatedAt: new Date(),
          },
        });

        return result;
      } catch (error) {
        logger.error(`Error syncing ${platform} data`, error, { userId });

        return {
          success: false,
          platform,
          newItems: 0,
          updatedItems: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
          lastSync: new Date(),
          nextSync: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        };
      }
    }, { max: 10, window: 60000 }); // 10 requests per minute
  }

  /**
   * Sync LinkedIn data
   */
  private async syncLinkedInData(
    userId: string,
    connection: SocialMediaConnection
  ): Promise<SyncResult> {
    try {
      // This would integrate with LinkedIn API
      // For now, we'll simulate the process
      const linkedinData = await this.fetchLinkedInProfile(connection);

      let newItems = 0;
      let updatedItems = 0;
      const errors: string[] = [];

      // Update user profile with LinkedIn data
      if (linkedinData) {
        const existingProfile = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            profile: true,
            experiences: true,
            educations: true,
            skills: true,
          },
        });

        if (existingProfile) {
          // Update basic profile info
          if (existingProfile.profile) {
            await prisma.userProfile.update({
              where: { id: existingProfile.profile.id },
              data: {
                headline: linkedinData.headline || existingProfile.profile.headline,
                summary: linkedinData.summary || existingProfile.profile.summary,
                location: linkedinData.location || existingProfile.profile.location,
                website: linkedinData.profileUrl || existingProfile.profile.website,
                updatedAt: new Date(),
              },
            });
            updatedItems++;
          }

          // Sync experiences
          for (const exp of linkedinData.experience) {
            const existingExp = existingProfile.experiences.find(
              e => e.company === exp.company && e.title === exp.title
            );

            if (existingExp) {
              await prisma.experience.update({
                where: { id: existingExp.id },
                data: {
                  description: exp.description || existingExp.description,
                  skills: exp.skills || existingExp.skills,
                  achievements: exp.achievements || existingExp.achievements,
                  updatedAt: new Date(),
                },
              });
              updatedItems++;
            } else {
              await prisma.experience.create({
                data: {
                  userId,
                  title: exp.title,
                  company: exp.company,
                  location: exp.location,
                  startDate: exp.startDate,
                  endDate: exp.endDate,
                  isCurrentJob: exp.isCurrentJob,
                  description: exp.description,
                  skills: exp.skills,
                  achievements: exp.achievements,
                },
              });
              newItems++;
            }
          }

          // Sync education
          for (const edu of linkedinData.education) {
            const existingEdu = existingProfile.educations.find(
              e => e.schoolName === edu.schoolName && e.degree === edu.degree
            );

            if (existingEdu) {
              await prisma.education.update({
                where: { id: existingEdu.id },
                data: {
                  fieldOfStudy: edu.fieldOfStudy || existingEdu.fieldOfStudy,
                  description: edu.description || existingEdu.description,
                  activities: edu.activities || existingEdu.activities,
                  updatedAt: new Date(),
                },
              });
              updatedItems++;
            } else {
              await prisma.education.create({
                data: {
                  userId,
                  schoolName: edu.schoolName,
                  degree: edu.degree,
                  fieldOfStudy: edu.fieldOfStudy,
                  startDate: edu.startDate,
                  endDate: edu.endDate,
                  grade: edu.grade,
                  activities: edu.activities,
                  description: edu.description,
                },
              });
              newItems++;
            }
          }

          // Sync skills
          const existingSkills = existingProfile.skills.map(s => s.name);
          const newSkills = linkedinData.skills.filter(skill => !existingSkills.includes(skill));

          for (const skillName of newSkills) {
            await prisma.userSkill.create({
              data: {
                userId,
                name: skillName,
                level: 'INTERMEDIATE', // Default level
              },
            });
            newItems++;
          }
        }

        // Cache the LinkedIn data
        await cache.setex(
          `linkedin_profile:${userId}`,
          86400, // 24 hours
          JSON.stringify(linkedinData)
        );
      }

      return {
        success: true,
        platform: 'linkedin',
        newItems,
        updatedItems,
        errors,
        lastSync: new Date(),
        nextSync: new Date(connection.lastSync.getTime() + connection.syncFrequency * 60 * 60 * 1000),
      };
    } catch (error) {
      logger.error('Error syncing LinkedIn data', error, { userId });
      throw error;
    }
  }

  /**
   * Sync GitHub data
   */
  private async syncGitHubData(
    userId: string,
    connection: SocialMediaConnection
  ): Promise<SyncResult> {
    try {
      // This would integrate with GitHub API
      // For now, we'll simulate the process
      const githubData = await this.fetchGitHubProfile(connection);

      let newItems = 0;
      let updatedItems = 0;
      const errors: string[] = [];

      if (githubData) {
        // Cache the GitHub data
        await cache.setex(
          `github_profile:${userId}`,
          86400, // 24 hours
          JSON.stringify(githubData)
        );

        // Extract skills from repositories
        const extractedSkills = this.extractSkillsFromGitHub(githubData);

        // Add new skills to user profile
        const existingSkills = await prisma.userSkill.findMany({
          where: { userId },
        });

        const existingSkillNames = existingSkills.map(s => s.name);
        const newSkills = extractedSkills.filter(skill => !existingSkillNames.includes(skill));

        for (const skillName of newSkills) {
          await prisma.userSkill.create({
            data: {
              userId,
              name: skillName,
              level: 'INTERMEDIATE',
              endorsements: 1,
            },
          });
          newItems++;
        }

        // Update existing skills with GitHub validation
        for (const skillName of extractedSkills) {
          const existingSkill = existingSkills.find(s => s.name === skillName);
          if (existingSkill) {
            await prisma.userSkill.update({
              where: { id: existingSkill.id },
              data: {
                endorsements: existingSkill.endorsements + 1,
                updatedAt: new Date(),
              },
            });
            updatedItems++;
          }
        }
      }

      return {
        success: true,
        platform: 'github',
        newItems,
        updatedItems,
        errors,
        lastSync: new Date(),
        nextSync: new Date(connection.lastSync.getTime() + connection.syncFrequency * 60 * 60 * 1000),
      };
    } catch (error) {
      logger.error('Error syncing GitHub data', error, { userId });
      throw error;
    }
  }

  /**
   * Sync Twitter data
   */
  private async syncTwitterData(
    userId: string,
    connection: SocialMediaConnection
  ): Promise<SyncResult> {
    try {
      // This would integrate with Twitter API
      // For now, we'll simulate the process
      const twitterData = await this.fetchTwitterProfile(connection);

      let newItems = 0;
      let updatedItems = 0;
      const errors: string[] = [];

      if (twitterData) {
        // Cache the Twitter data
        await cache.setex(
          `twitter_profile:${userId}`,
          86400, // 24 hours
          JSON.stringify(twitterData)
        );

        // Extract professional insights from tweets
        const professionalInsights = this.extractProfessionalInsights(twitterData);

        // Update user profile with professional insights
        if (professionalInsights.bio && professionalInsights.bio.length > 0) {
          const existingProfile = await prisma.userProfile.findUnique({
            where: { userId },
          });

          if (existingProfile) {
            await prisma.userProfile.update({
              where: { id: existingProfile.id },
              data: {
                summary: professionalInsights.bio.join(' ') || existingProfile.summary,
                updatedAt: new Date(),
              },
            });
            updatedItems++;
          }
        }

        // Extract and add skills from professional tweets
        if (professionalInsights.skills.length > 0) {
          const existingSkills = await prisma.userSkill.findMany({
            where: { userId },
          });

          const existingSkillNames = existingSkills.map(s => s.name);
          const newSkills = professionalInsights.skills.filter(skill => !existingSkillNames.includes(skill));

          for (const skillName of newSkills) {
            await prisma.userSkill.create({
              data: {
                userId,
                name: skillName,
                level: 'BEGINNER',
              },
            });
            newItems++;
          }
        }
      }

      return {
        success: true,
        platform: 'twitter',
        newItems,
        updatedItems,
        errors,
        lastSync: new Date(),
        nextSync: new Date(connection.lastSync.getTime() + connection.syncFrequency * 60 * 60 * 1000),
      };
    } catch (error) {
      logger.error('Error syncing Twitter data', error, { userId });
      throw error;
    }
  }

  /**
   * Get comprehensive social media enrichment for a user
   */
  async getSocialMediaEnrichment(userId: string): Promise<SocialMediaEnrichment> {
    const cacheKey = `social_enrichment:${userId}`;

    return cache.wrap(cacheKey, async () => {
      try {
        const [linkedinData, githubData, twitterData] = await Promise.all([
          this.getCachedLinkedInData(userId),
          this.getCachedGitHubData(userId),
          this.getCachedTwitterData(userId),
        ]);

        const enrichedSkills = this.extractEnrichedSkills(linkedinData, githubData, twitterData);
        const experienceEnhancements = this.generateExperienceEnhancements(linkedinData, githubData, twitterData);
        const projectAdditions = this.generateProjectAdditions(githubData, linkedinData);
        const skillValidations = this.generateSkillValidations(linkedinData, githubData, twitterData);
        const profileCompleteness = this.calculateProfileCompleteness(linkedinData, githubData, twitterData);

        return {
          userId,
          linkedinData,
          githubData,
          twitterData,
          enrichedSkills,
          experienceEnhancements,
          projectAdditions,
          skillValidations,
          profileCompleteness,
          lastUpdated: new Date(),
        };
      } catch (error) {
        logger.error('Error getting social media enrichment', error, { userId });
        throw error;
      }
    }, 3600); // Cache for 1 hour
  }

  /**
   * Extract enriched skills from all platforms
   */
  private extractEnrichedSkills(
    linkedinData?: LinkedInProfileData,
    githubData?: GitHubProfileData,
    twitterData?: TwitterProfileData
  ): string[] {
    const skills = new Set<string>();

    // Add LinkedIn skills
    if (linkedinData?.skills) {
      linkedinData.skills.forEach(skill => skills.add(skill));
    }

    // Add GitHub skills (languages and technologies)
    if (githubData?.skills) {
      githubData.skills.forEach(skill => skills.add(skill));
    }

    if (githubData?.languages) {
      githubData.languages.forEach(lang => skills.add(lang));
    }

    // Add Twitter professional skills
    if (twitterData?.hashtags) {
      const professionalHashtags = twitterData.hashtags.filter(tag =>
        tag.startsWith('#') &&
        !tag.toLowerCase().includes('fun') &&
        !tag.toLowerCase().includes('personal')
      );
      professionalHashtags.forEach(tag => skills.add(tag.substring(1).trim()));
    }

    return Array.from(skills).sort();
  }

  /**
   * Generate experience enhancements from social data
   */
  private generateExperienceEnhancements(
    linkedinData?: LinkedInProfileData,
    githubData?: GitHubProfileData,
    twitterData?: TwitterProfileData
  ): ExperienceEnhancement[] {
    const enhancements: ExperienceEnhancement[] = [];

    // LinkedIn experience enhancements
    if (linkedinData?.experience) {
      linkedinData.experience.forEach(exp => {
        enhancements.push({
          originalExperienceId: exp.id,
          enrichedData: {
            achievements: exp.achievements,
            skills: exp.skills,
            technologies: exp.skills.filter(skill => this.isTechnology(skill)),
            metrics: this.extractMetricsFromDescription(exp.description || ''),
            descriptions: [exp.description || ''].filter(Boolean),
          },
          confidence: 0.9,
          source: 'linkedin',
        });
      });
    }

    // GitHub contributions as experience
    if (githubData?.repositories) {
      const significantRepos = githubData.repositories.filter(repo =>
        repo.stars > 0 || repo.forks > 0 || repo.contributions > 50
      );

      significantRepos.forEach(repo => {
        enhancements.push({
          originalExperienceId: `github_${repo.id}`,
          enrichedData: {
            achievements: [
              `Created ${repo.name} repository with ${repo.stars} stars`,
              `Made ${repo.contributions} contributions`,
              repo.forks > 0 ? `Repository forked ${repo.forks} times` : undefined,
            ].filter(Boolean) as string[],
            skills: [repo.language, ...repo.topics],
            technologies: [repo.language, ...repo.topics.filter(this.isTechnology)],
            metrics: {
              stars: repo.stars,
              forks: repo.forks,
              contributions: repo.contributions,
            },
            descriptions: [repo.description || ''].filter(Boolean),
          },
          confidence: 0.8,
          source: 'github',
        });
      });
    }

    return enhancements;
  }

  /**
   * Generate project additions from social data
   */
  private generateProjectAdditions(
    githubData?: GitHubProfileData,
    linkedinData?: LinkedInProfileData
  ): ProjectAddition[] {
    const projects: ProjectAddition[] = [];

    // GitHub repositories as projects
    if (githubData?.repositories) {
      githubData.repositories.forEach(repo => {
        if (repo.description || repo.topics.length > 0) {
          projects.push({
            title: repo.name,
            description: repo.description || `A ${repo.language} project`,
            technologies: [repo.language, ...repo.topics],
            url: repo.url,
            startDate: repo.createdAt,
            endDate: repo.pushedAt,
            achievements: [
              `${repo.stars} stars`,
              `${repo.forks} forks`,
              `${repo.contributions} contributions`,
            ],
            source: 'github',
            confidence: 0.9,
          });
        }
      });
    }

    // LinkedIn projects
    if (linkedinData?.projects) {
      linkedinData.projects.forEach(project => {
        projects.push({
          title: project.title,
          description: project.description || '',
          technologies: project.skills,
          url: project.url,
          startDate: project.startDate,
          endDate: project.endDate,
          achievements: project.accomplishments,
          source: 'linkedin',
          confidence: 0.95,
        });
      });
    }

    return projects;
  }

  /**
   * Generate skill validations from social data
   */
  private generateSkillValidations(
    linkedinData?: LinkedInProfileData,
    githubData?: GitHubProfileData,
    twitterData?: TwitterProfileData
  ): SkillValidation[] {
    const validations: SkillValidation[] = [];

    // Validate LinkedIn skills
    if (linkedinData?.skills) {
      linkedinData.skills.forEach(skill => {
        validations.push({
          skill,
          validated: true,
          evidence: [`Listed on LinkedIn profile`],
          confidence: 0.8,
          source: 'linkedin',
          lastValidated: new Date(),
        });
      });
    }

    // Validate GitHub skills
    if (githubData?.skills) {
      githubData.skills.forEach(skill => {
        validations.push({
          skill,
          validated: true,
          evidence: [`Demonstrated in GitHub repositories`],
          confidence: 0.9,
          source: 'github',
          lastValidated: new Date(),
        });
      });
    }

    // Validate Twitter professional mentions
    if (twitterData?.hashtags) {
      const professionalHashtags = twitterData.hashtags.filter(tag =>
        this.isProfessionalSkill(tag.substring(1))
      );

      professionalHashtags.forEach(tag => {
        const skill = tag.substring(1);
        validations.push({
          skill,
          validated: true,
          evidence: [`Mentioned in professional tweets`],
          confidence: 0.6,
          source: 'twitter',
          lastValidated: new Date(),
        });
      });
    }

    return validations;
  }

  /**
   * Calculate profile completeness score
   */
  private calculateProfileCompleteness(
    linkedinData?: LinkedInProfileData,
    githubData?: GitHubProfileData,
    twitterData?: TwitterProfileData
  ): ProfileCompleteness {
    const completeness: ProfileCompleteness = {
      overall: 0,
      sections: {
        personal: 0,
        experience: 0,
        education: 0,
        skills: 0,
        projects: 0,
        accomplishments: 0,
      },
      missingFields: [],
      suggestions: [],
    };

    // Personal section (30%)
    let personalScore = 0;
    if (linkedinData?.firstName && linkedinData.lastName) personalScore += 20;
    if (linkedinData?.headline) personalScore += 30;
    if (linkedinData?.summary) personalScore += 30;
    if (linkedinData?.location) personalScore += 20;
    completeness.sections.personal = personalScore;

    // Experience section (25%)
    let experienceScore = 0;
    if (linkedinData?.experience && linkedinData.experience.length > 0) {
      experienceScore += Math.min(50, linkedinData.experience.length * 10);
      const hasDescriptions = linkedinData.experience.some(exp => exp.description);
      if (hasDescriptions) experienceScore += 30;
      const hasAchievements = linkedinData.experience.some(exp => exp.achievements.length > 0);
      if (hasAchievements) experienceScore += 20;
    }
    completeness.sections.experience = experienceScore;

    // Education section (15%)
    let educationScore = 0;
    if (linkedinData?.education && linkedinData.education.length > 0) {
      educationScore += 50;
      const hasDetails = linkedinData.education.some(edu => edu.fieldOfStudy || edu.description);
      if (hasDetails) educationScore += 50;
    }
    completeness.sections.education = educationScore;

    // Skills section (15%)
    let skillsScore = 0;
    const allSkills = [
      ...(linkedinData?.skills || []),
      ...(githubData?.skills || []),
      ...(githubData?.languages || []),
    ];
    if (allSkills.length > 0) {
      skillsScore += Math.min(50, allSkills.length * 5);
      if (allSkills.length >= 10) skillsScore += 50;
    }
    completeness.sections.skills = skillsScore;

    // Projects section (10%)
    let projectsScore = 0;
    const allProjects = [
      ...(linkedinData?.projects || []),
      ...(githubData?.repositories || []),
    ];
    if (allProjects.length > 0) {
      projectsScore += Math.min(50, allProjects.length * 10);
      const hasDescriptions = allProjects.some(proj => proj.description);
      if (hasDescriptions) projectsScore += 50;
    }
    completeness.sections.projects = projectsScore;

    // Accomplishments section (5%)
    let accomplishmentsScore = 0;
    if (linkedinData?.certifications && linkedinData.certifications.length > 0) {
      accomplishmentsScore += 40;
    }
    if (linkedinData?.honors && linkedinData.honors.length > 0) {
      accomplishmentsScore += 30;
    }
    if (linkedinData?.recommendations && linkedinData.recommendations.length > 0) {
      accomplishmentsScore += 30;
    }
    completeness.sections.accomplishments = accomplishmentsScore;

    // Calculate overall score
    completeness.overall = Math.round(
      completeness.sections.personal * 0.3 +
      completeness.sections.experience * 0.25 +
      completeness.sections.education * 0.15 +
      completeness.sections.skills * 0.15 +
      completeness.sections.projects * 0.1 +
      completeness.sections.accomplishments * 0.05
    );

    // Generate missing fields and suggestions
    if (completeness.sections.personal < 80) {
      completeness.missingFields.push('Professional headline');
      completeness.missingFields.push('Profile summary');
      completeness.suggestions.push('Add a professional headline and summary to your profile');
    }

    if (completeness.sections.experience < 70) {
      completeness.missingFields.push('Detailed experience descriptions');
      completeness.suggestions.push('Add detailed descriptions and achievements to your experience');
    }

    if (completeness.sections.skills < 60) {
      completeness.missingFields.push('More skills');
      completeness.suggestions.push('Add more relevant skills to your profile');
    }

    if (completeness.sections.projects < 50) {
      completeness.missingFields.push('Project details');
      completeness.suggestions.push('Showcase your projects with detailed descriptions');
    }

    return completeness;
  }

  /**
   * Mock methods for fetching data from social media APIs
   * In a real implementation, these would make actual API calls
   */
  private async fetchLinkedInProfile(connection: SocialMediaConnection): Promise<LinkedInProfileData | null> {
    // Mock implementation - would integrate with LinkedIn API
    return null;
  }

  private async fetchGitHubProfile(connection: SocialMediaConnection): Promise<GitHubProfileData | null> {
    // Mock implementation - would integrate with GitHub API
    return null;
  }

  private async fetchTwitterProfile(connection: SocialMediaConnection): Promise<TwitterProfileData | null> {
    // Mock implementation - would integrate with Twitter API
    return null;
  }

  private async getCachedLinkedInData(userId: string): Promise<LinkedInProfileData | undefined> {
    try {
      const cached = await cache.get(`linkedin_profile:${userId}`);
      return cached ? JSON.parse(cached) : undefined;
    } catch {
      return undefined;
    }
  }

  private async getCachedGitHubData(userId: string): Promise<GitHubProfileData | undefined> {
    try {
      const cached = await cache.get(`github_profile:${userId}`);
      return cached ? JSON.parse(cached) : undefined;
    } catch {
      return undefined;
    }
  }

  private async getCachedTwitterData(userId: string): Promise<TwitterProfileData | undefined> {
    try {
      const cached = await cache.get(`twitter_profile:${userId}`);
      return cached ? JSON.parse(cached) : undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Helper methods
   */
  private extractSkillsFromGitHub(githubData: GitHubProfileData): string[] {
    const skills = new Set<string>();

    // Add languages from repositories
    githubData.repositories.forEach(repo => {
      if (repo.language) {
        skills.add(repo.language);
      }
      Object.keys(repo.languages).forEach(lang => skills.add(lang));
      repo.topics.forEach(topic => skills.add(topic));
    });

    return Array.from(skills);
  }

  private extractProfessionalInsights(twitterData: TwitterProfileData): {
    bio: string[];
    skills: string[];
  } {
    const bio: string[] = [];
    const skills: string[] = [];

    // Extract bio information
    if (twitterData.bio) {
      bio.push(twitterData.bio);
    }

    // Extract skills from professional tweets
    twitterData.professionalTweets.forEach(tweet => {
      // Extract hashtags that might be skills
      tweet.hashtags.forEach(tag => {
        if (this.isProfessionalSkill(tag.substring(1))) {
          skills.push(tag.substring(1));
        }
      });
    });

    return { bio, skills };
  }

  private isTechnology(skill: string): boolean {
    const techKeywords = [
      'javascript', 'typescript', 'python', 'java', 'react', 'node', 'angular',
      'vue', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'sql', 'mongodb',
      'postgresql', 'redis', 'graphql', 'rest', 'api', 'html', 'css', 'git',
      'ci/cd', 'devops', 'microservices', 'serverless', 'ml', 'ai', 'data'
    ];

    return techKeywords.some(tech =>
      skill.toLowerCase().includes(tech)
    );
  }

  private isProfessionalSkill(skill: string): boolean {
    const nonProfessional = ['fun', 'mood', 'life', 'personal', 'family', 'friends'];
    return !nonProfessional.some(word => skill.toLowerCase().includes(word));
  }

  private extractMetricsFromDescription(description: string): { [key: string]: number } {
    const metrics: { [key: string]: number } = {};

    // Extract common metrics using regex
    const percentageMatch = description.match(/(\d+)%/);
    if (percentageMatch) {
      metrics.percentage = parseInt(percentageMatch[1]);
    }

    const revenueMatch = description.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(million|billion|k)/i);
    if (revenueMatch) {
      const amount = parseFloat(revenueMatch[1].replace(',', ''));
      const unit = revenueMatch[2].toLowerCase();
      metrics.revenue = unit === 'million' ? amount * 1000000 :
                       unit === 'billion' ? amount * 1000000000 :
                       amount * 1000;
    }

    const teamMatch = description.match(/(\d+)\s*(people|team|member|employee)s?/i);
    if (teamMatch) {
      metrics.teamSize = parseInt(teamMatch[1]);
    }

    return metrics;
  }
}

export const socialMediaIntegration = SocialMediaIntegrationService.getInstance();