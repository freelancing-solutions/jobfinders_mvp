/**
 * Twitter Professional Activity Tracking Module
 *
 * Tracks and analyzes professional activity on Twitter to extract
 * career insights, networking information, and professional interests.
 */

import { logger } from '@/lib/logger';
import { cache } from '@/lib/cache';
import { textExtractor } from '@/lib/text-extractor';
import { keywordAnalyzer } from '@/lib/keyword-analyzer';

export interface TwitterConfig {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessTokenSecret: string;
  bearerToken: string;
  environment: 'production' | 'sandbox';
}

export interface TwitterUser {
  id: string;
  username: string;
  name: string;
  description: string | null;
  location: string | null;
  url: string | null;
  protected: boolean;
  verified: boolean;
  followersCount: number;
  followingCount: number;
  tweetsCount: number;
  listedCount: number;
  createdAt: string;
  profileImageUrl: string;
  profileBannerUrl: string | null;
  pinnedTweetId?: string;
}

export interface TwitterTweet {
  id: string;
  text: string;
  createdAt: string;
  authorId: string;
  inReplyToUserId?: string;
  referencedTweets?: Array<{
    type: 'replied_to' | 'quoted' | 'retweeted';
    id: string;
  }>;
  publicMetrics: {
    retweetCount: number;
    likeCount: number;
    replyCount: number;
    quoteCount: number;
  };
  contextAnnotations?: Array<{
    domain: {
      id: string;
      name: string;
      description: string;
    };
    entity: {
      id: string;
      name: string;
      description: string;
    };
  }>;
  entities?: {
    hashtags?: Array<{
      tag: string;
      start: number;
      end: number;
    }>;
    mentions?: Array<{
      username: string;
      start: number;
      end: number;
    }>;
    urls?: Array<{
      start: number;
      end: number;
      url: string;
      expandedUrl: string;
      displayUrl: string;
    }>;
  };
  attachments?: {
    mediaKeys?: string[];
  };
  lang: string;
  possiblySensitive: boolean;
  replySettings: 'everyone' | 'mentioned' | 'following';
  source: string;
}

export interface TwitterMedia {
  mediaKey: string;
  type: 'photo' | 'video' | 'animated_gif';
  url?: string;
  previewImageUrl?: string;
  width?: number;
  height?: number;
  durationMs?: number;
  publicMetrics?: {
    viewCount: number;
  };
}

export interface TwitterSpace {
  id: string;
  state: 'live' | 'scheduled' | 'ended';
  createdAt: string;
  createdAt: string;
  title: string;
  description?: string;
  hostedBy: string[];
  hostIds: string[];
  participantCount: number;
  language: string;
  isTicketed: boolean;
}

export interface TwitterList {
  id: string;
  name: string;
  description: string | null;
  private: boolean;
  memberCount: number;
  followerCount: number;
  createdAt: string;
}

export interface TwitterFollow {
  following: boolean;
  followedBy: boolean;
  followingRequested: boolean;
}

export interface TwitterProfessionalInsight {
  userProfile: TwitterUser;
  professionalMetrics: {
    professionalTweetRatio: number;
    networkingScore: number;
    influenceScore: number;
    engagementRate: number;
    consistency: number;
    thoughtLeadership: number;
  };
  contentAnalysis: {
    primaryTopics: Array<{
      topic: string;
      frequency: number;
      relevanceScore: number;
    }>;
    professionalInterests: string[];
    expertiseAreas: string[];
    industryConnections: string[];
    contentThemes: string[];
  };
  networkingInsights: {
    professionalConnections: Array<{
      username: string;
      name: string;
      interactionCount: number;
      relationshipType: 'colleague' | 'industry_leader' | 'mentor' | 'recruiter' | 'peer';
      lastInteraction: string;
    }>;
    industryInfluencers: Array<{
      username: string;
      name: string;
      followers: number;
      relevanceScore: number;
    }>;
    networkingOpportunities: Array<{
      event: string;
      potentialConnections: string[];
      recommendedActions: string[];
    }>;
  };
  activityPatterns: {
    tweetFrequency: {
      daily: number;
      weekly: number;
      monthly: number;
    };
    activeHours: number[];
    activeDays: string[];
    contentTypes: {
      professional: number;
      personal: number;
      promotional: number;
      engagement: number;
    };
    seasonalTrends: Array<{
      period: string;
      tweetCount: number;
      engagement: number;
    }>;
  };
  professionalRecommendations: {
    profileOptimizations: string[];
    contentStrategy: string[];
    networkingActions: string[];
    personalBranding: string[];
  };
}

class TwitterProfessionalTrackingService {
  private config: TwitterConfig;
  private baseUrl = 'https://api.twitter.com/2';

  constructor(config: TwitterConfig) {
    this.config = config;
  }

  /**
   * Analyze Twitter profile for professional insights
   */
  async analyzeProfessionalProfile(username: string): Promise<TwitterProfessionalInsight> {
    const cacheKey = `twitter_professional_analysis:${username}`;

    return cache.wrap(cacheKey, async () => {
      try {
        logger.info('Starting Twitter professional analysis', { username });

        // Get user profile
        const userProfile = await this.getUserProfile(username);

        // Get recent tweets
        const recentTweets = await this.getUserTweets(username, 200);

        // Get professional metrics
        const professionalMetrics = await this.calculateProfessionalMetrics(userProfile, recentTweets);

        // Analyze content
        const contentAnalysis = await this.analyzeContent(recentTweets);

        // Get networking insights
        const networkingInsights = await this.getNetworkingInsights(username, recentTweets);

        // Analyze activity patterns
        const activityPatterns = await this.analyzeActivityPatterns(recentTweets);

        // Generate professional recommendations
        const professionalRecommendations = await this.generateRecommendations(
          userProfile,
          professionalMetrics,
          contentAnalysis,
          networkingInsights,
          activityPatterns
        );

        const insights: TwitterProfessionalInsight = {
          userProfile,
          professionalMetrics,
          contentAnalysis,
          networkingInsights,
          activityPatterns,
          professionalRecommendations,
        };

        logger.info('Twitter professional analysis completed', {
          username,
          influenceScore: professionalMetrics.influenceScore,
          networkingScore: professionalMetrics.networkingScore,
        });

        return insights;
      } catch (error) {
        logger.error('Error analyzing Twitter professional profile', error, { username });
        throw error;
      }
    }, 3600); // Cache for 1 hour
  }

  /**
   * Get user profile
   */
  private async getUserProfile(username: string): Promise<TwitterUser> {
    const response = await fetch(
      `${this.baseUrl}/users/by/username/${username}?user.fields=description,location,url,protected,verified,public_metrics,profile_image_url,profile_banner_url,pinned_tweet_id,created_at`,
      {
        headers: {
          'Authorization': `Bearer ${this.config.bearerToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch Twitter user: ${response.statusText}`);
    }

    const data = await response.json();
    return this.parseTwitterUser(data.data);
  }

  /**
   * Get user tweets
   */
  private async getUserTweets(username: string, maxResults = 100): Promise<TwitterTweet[]> {
    const user = await this.getUserProfile(username);
    const tweets: TwitterTweet[] = [];

    let paginationToken: string | undefined;

    while (tweets.length < maxResults) {
      const limit = Math.min(100, maxResults - tweets.length);
      const url = `${this.baseUrl}/users/${user.id}/tweets?tweet.fields=created_at,public_metrics,context_annotations,entities,attachments,lang,possibly_sensitive,reply_settings,source&expansions=attachments.media_keys&media.fields=url,preview_image_url,width,height,duration_ms,public_metrics&max_results=${limit}${paginationToken ? `&pagination_token=${paginationToken}` : ''}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.config.bearerToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tweets: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.data) {
        tweets.push(...data.data.map(this.parseTwitterTweet.bind(this)));
      }

      if (!data.meta?.next_token || tweets.length >= maxResults) {
        break;
      }

      paginationToken = data.meta.next_token;
    }

    return tweets;
  }

  /**
   * Calculate professional metrics
   */
  private async calculateProfessionalMetrics(
    userProfile: TwitterUser,
    tweets: TwitterTweet[]
  ): Promise<TwitterProfessionalInsight['professionalMetrics']> {
    const professionalTweets = tweets.filter(tweet => this.isProfessionalTweet(tweet));
    const professionalTweetRatio = tweets.length > 0 ? professionalTweets.length / tweets.length : 0;

    // Calculate networking score
    const networkingScore = this.calculateNetworkingScore(userProfile, tweets);

    // Calculate influence score
    const influenceScore = this.calculateInfluenceScore(userProfile, tweets);

    // Calculate engagement rate
    const totalEngagement = tweets.reduce((sum, tweet) =>
      sum + tweet.publicMetrics.likeCount +
      tweet.publicMetrics.retweetCount +
      tweet.publicMetrics.replyCount +
      tweet.publicMetrics.quoteCount, 0
    );
    const engagementRate = userProfile.followersCount > 0 ? totalEngagement / userProfile.followersCount : 0;

    // Calculate consistency
    const consistency = this.calculateConsistency(tweets);

    // Calculate thought leadership
    const thoughtLeadership = this.calculateThoughtLeadership(professionalTweets);

    return {
      professionalTweetRatio,
      networkingScore,
      influenceScore,
      engagementRate,
      consistency,
      thoughtLeadership,
    };
  }

  /**
   * Analyze content
   */
  private async analyzeContent(tweets: TwitterTweet[]): Promise<TwitterProfessionalInsight['contentAnalysis']> {
    const professionalTweets = tweets.filter(tweet => this.isProfessionalTweet(tweet));
    const contentTexts = professionalTweets.map(tweet => tweet.text).join(' ');

    // Extract topics
    const primaryTopics = await this.extractTopics(professionalTweets);

    // Extract professional interests
    const professionalInterests = await this.extractProfessionalInterests(contentTexts);

    // Identify expertise areas
    const expertiseAreas = await this.identifyExpertiseAreas(professionalTweets);

    // Find industry connections
    const industryConnections = this.extractIndustryConnections(professionalTweets);

    // Analyze content themes
    const contentThemes = this.analyzeContentThemes(professionalTweets);

    return {
      primaryTopics,
      professionalInterests,
      expertiseAreas,
      industryConnections,
      contentThemes,
    };
  }

  /**
   * Get networking insights
   */
  private async getNetworkingInsights(
    username: string,
    tweets: TwitterTweet[]
  ): Promise<TwitterProfessionalInsight['networkingInsights']> {
    // Extract professional connections
    const professionalConnections = await this.extractProfessionalConnections(tweets);

    // Find industry influencers
    const industryInfluencers = await this.findIndustryInfluencers(username, tweets);

    // Identify networking opportunities
    const networkingOpportunities = await this.identifyNetworkingOpportunities(tweets);

    return {
      professionalConnections,
      industryInfluencers,
      networkingOpportunities,
    };
  }

  /**
   * Analyze activity patterns
   */
  private async analyzeActivityPatterns(tweets: TwitterTweet[]): Promise<TwitterProfessionalInsight['activityPatterns']> {
    // Calculate tweet frequency
    const tweetFrequency = this.calculateTweetFrequency(tweets);

    // Find active hours
    const activeHours = this.findActiveHours(tweets);

    // Find active days
    const activeDays = this.findActiveDays(tweets);

    // Categorize content types
    const contentTypes = this.categorizeContentTypes(tweets);

    // Analyze seasonal trends
    const seasonalTrends = this.analyzeSeasonalTrends(tweets);

    return {
      tweetFrequency,
      activeHours,
      activeDays,
      contentTypes,
      seasonalTrends,
    };
  }

  /**
   * Generate professional recommendations
   */
  private async generateRecommendations(
    userProfile: TwitterUser,
    professionalMetrics: TwitterProfessionalInsight['professionalMetrics'],
    contentAnalysis: TwitterProfessionalInsight['contentAnalysis'],
    networkingInsights: TwitterProfessionalInsight['networkingInsights'],
    activityPatterns: TwitterProfessionalInsight['activityPatterns']
  ): Promise<TwitterProfessionalInsight['professionalRecommendations']> {
    const profileOptimizations: string[] = [];
    const contentStrategy: string[] = [];
    const networkingActions: string[] = [];
    const personalBranding: string[] = [];

    // Profile optimizations
    if (!userProfile.description || userProfile.description.length < 50) {
      profileOptimizations.push('Add a more detailed professional bio');
    }
    if (!userProfile.url) {
      profileOptimizations.push('Add a link to your professional website or LinkedIn');
    }
    if (professionalMetrics.professionalTweetRatio < 0.5) {
      profileOptimizations.push('Increase the ratio of professional content');
    }

    // Content strategy
    if (contentAnalysis.primaryTopics.length === 0) {
      contentStrategy.push('Focus on specific professional topics to establish expertise');
    }
    if (activityPatterns.tweetFrequency.daily < 1) {
      contentStrategy.push('Tweet more consistently to maintain visibility');
    }
    if (professionalMetrics.thoughtLeadership < 50) {
      contentStrategy.push('Share original insights and thought leadership content');
    }

    // Networking actions
    if (professionalMetrics.networkingScore < 60) {
      networkingActions.push('Engage more with industry peers and leaders');
    }
    if (networkingInsights.professionalConnections.length < 10) {
      networkingActions.push('Build relationships with more professionals in your field');
    }
    if (activityPatterns.contentTypes.engagement < 20) {
      networkingActions.push('Respond to others\' tweets to increase engagement');
    }

    // Personal branding
    if (contentAnalysis.expertiseAreas.length === 0) {
      personalBranding.push('Develop and showcase your areas of expertise');
    }
    if (professionalMetrics.influenceScore < 40) {
      personalBranding.push('Focus on building your professional influence');
    }
    if (!userProfile.verified && professionalMetrics.influenceScore > 70) {
      personalBranding.push('Consider applying for verification if eligible');
    }

    return {
      profileOptimizations,
      contentStrategy,
      networkingActions,
      personalBranding,
    };
  }

  // Helper methods

  private parseTwitterUser(data: any): TwitterUser {
    return {
      id: data.id,
      username: data.username,
      name: data.name,
      description: data.description,
      location: data.location,
      url: data.url,
      protected: data.protected,
      verified: data.verified,
      followersCount: data.public_metrics?.followers_count || 0,
      followingCount: data.public_metrics?.following_count || 0,
      tweetsCount: data.public_metrics?.tweet_count || 0,
      listedCount: data.public_metrics?.listed_count || 0,
      createdAt: data.created_at,
      profileImageUrl: data.profile_image_url,
      profileBannerUrl: data.profile_banner_url,
      pinnedTweetId: data.pinned_tweet_id,
    };
  }

  private parseTwitterTweet(data: any): TwitterTweet {
    return {
      id: data.id,
      text: data.text,
      createdAt: data.created_at,
      authorId: data.author_id,
      inReplyToUserId: data.in_reply_to_user_id,
      referencedTweets: data.referenced_tweets,
      publicMetrics: {
        retweetCount: data.public_metrics?.retweet_count || 0,
        likeCount: data.public_metrics?.like_count || 0,
        replyCount: data.public_metrics?.reply_count || 0,
        quoteCount: data.public_metrics?.quote_count || 0,
      },
      contextAnnotations: data.context_annotations,
      entities: data.entities,
      attachments: data.attachments,
      lang: data.lang,
      possiblySensitive: data.possibly_sensitive || false,
      replySettings: data.reply_settings,
      source: data.source,
    };
  }

  private isProfessionalTweet(tweet: TwitterTweet): boolean {
    const professionalKeywords = [
      'work', 'career', 'job', 'professional', 'business', 'industry',
      'technology', 'software', 'development', 'design', 'marketing',
      'startup', 'entrepreneur', 'leadership', 'management', 'team',
      'project', 'client', 'customer', 'strategy', 'innovation',
      'data', 'analytics', 'research', 'conference', 'meetup'
    ];

    const text = tweet.text.toLowerCase();
    const hasProfessionalKeywords = professionalKeywords.some(keyword => text.includes(keyword));

    const hasProfessionalHashtags = tweet.entities?.hashtags?.some(hashtag =>
      professionalKeywords.some(keyword => hashtag.tag.toLowerCase().includes(keyword))
    );

    const hasProfessionalContext = tweet.contextAnnotations?.some(annotation =>
      annotation.domain.name.toLowerCase().includes('professional') ||
      annotation.entity.name.toLowerCase().includes('professional')
    );

    return hasProfessionalKeywords || hasProfessionalHashtags || hasProfessionalContext;
  }

  private calculateNetworkingScore(userProfile: TwitterUser, tweets: TwitterTweet[]): number {
    let score = 0;

    // Followers to following ratio
    const ratio = userProfile.followingCount > 0 ? userProfile.followersCount / userProfile.followingCount : userProfile.followersCount;
    if (ratio > 2) score += 20;
    else if (ratio > 1) score += 15;
    else if (ratio > 0.5) score += 10;

    // List appearances
    score += Math.min(userProfile.listedCount * 2, 20);

    // Engagement with others
    const replies = tweets.filter(tweet => tweet.inReplyToUserId).length;
    const mentions = tweets.filter(tweet => tweet.entities?.mentions?.length).length;
    score += Math.min((replies + mentions) * 0.5, 20);

    // Retweets and quote tweets
    const retweets = tweets.filter(tweet => tweet.referencedTweets?.some(rt => rt.type === 'retweeted')).length;
    const quotes = tweets.filter(tweet => tweet.referencedTweets?.some(rt => rt.type === 'quoted')).length;
    score += Math.min((retweets + quotes) * 0.3, 15);

    // Account age and consistency
    const accountAge = (Date.now() - new Date(userProfile.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (accountAge > 365) score += 10;
    else if (accountAge > 180) score += 7;
    else if (accountAge > 90) score += 5;

    // Verification bonus
    if (userProfile.verified) score += 15;

    return Math.min(score, 100);
  }

  private calculateInfluenceScore(userProfile: TwitterUser, tweets: TwitterTweet[]): number {
    let score = 0;

    // Follower count
    if (userProfile.followersCount > 10000) score += 30;
    else if (userProfile.followersCount > 5000) score += 25;
    else if (userProfile.followersCount > 1000) score += 20;
    else if (userProfile.followersCount > 500) score += 15;
    else if (userProfile.followersCount > 100) score += 10;

    // Average engagement
    const totalEngagement = tweets.reduce((sum, tweet) =>
      sum + tweet.publicMetrics.likeCount +
      tweet.publicMetrics.retweetCount +
      tweet.publicMetrics.replyCount +
      tweet.publicMetrics.quoteCount, 0
    );
    const avgEngagement = tweets.length > 0 ? totalEngagement / tweets.length : 0;

    if (avgEngagement > 50) score += 25;
    else if (avgEngagement > 20) score += 20;
    else if (avgEngagement > 10) score += 15;
    else if (avgEngagement > 5) score += 10;

    // Viral tweets
    const viralTweets = tweets.filter(tweet =>
      tweet.publicMetrics.likeCount > 100 ||
      tweet.publicMetrics.retweetCount > 50
    ).length;
    score += Math.min(viralTweets * 5, 20);

    // Verified status
    if (userProfile.verified) score += 15;

    // List appearances
    score += Math.min(userProfile.listedCount, 10);

    return Math.min(score, 100);
  }

  private calculateConsistency(tweets: TwitterTweet[]): number {
    if (tweets.length === 0) return 0;

    const dates = tweets.map(tweet => new Date(tweet.createdAt));
    const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime());

    if (sortedDates.length < 2) return 50;

    const timeDiff = sortedDates[sortedDates.length - 1].getTime() - sortedDates[0].getTime();
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

    if (daysDiff === 0) return 100;

    const frequency = tweets.length / daysDiff;

    if (frequency >= 3) return 100; // 3+ tweets per day
    if (frequency >= 1) return 85;  // 1+ tweets per day
    if (frequency >= 0.5) return 70; // 1 tweet every 2 days
    if (frequency >= 0.25) return 55; // 1 tweet every 4 days
    if (frequency >= 0.1) return 40;  // 1 tweet per week
    return 25; // Less than 1 tweet per week
  }

  private calculateThoughtLeadership(professionalTweets: TwitterTweet[]): number {
    if (professionalTweets.length === 0) return 0;

    let score = 0;

    // Original content (not replies or retweets)
    const originalContent = professionalTweets.filter(tweet =>
      !tweet.inReplyToUserId &&
      !tweet.referencedTweets?.some(rt => rt.type === 'retweeted')
    );
    const originalRatio = originalContent.length / professionalTweets.length;
    score += originalRatio * 30;

    // High engagement content
    const highEngagement = professionalTweets.filter(tweet =>
      tweet.publicMetrics.likeCount > 10 ||
      tweet.publicMetrics.retweetCount > 5
    );
    const engagementRatio = highEngagement.length / professionalTweets.length;
    score += engagementRatio * 25;

    // Thought leadership indicators
    const leadershipKeywords = ['insight', 'analysis', 'trend', 'future', 'strategy', 'innovation', 'perspective'];
    const leadershipTweets = professionalTweets.filter(tweet => {
      const text = tweet.text.toLowerCase();
      return leadershipKeywords.some(keyword => text.includes(keyword));
    });
    const leadershipRatio = leadershipTweets.length / professionalTweets.length;
    score += leadershipRatio * 25;

    // Threaded content (indicates in-depth analysis)
    const threads = professionalTweets.filter(tweet =>
      professionalTweets.some(otherTweet =>
        otherTweet.inReplyToUserId === tweet.authorId &&
        Math.abs(new Date(otherTweet.createdAt).getTime() - new Date(tweet.createdAt).getTime()) < 3600000 // 1 hour
      )
    );
    const threadRatio = Math.min(threads.length / professionalTweets.length * 50, 20);

    return Math.min(score + threadRatio, 100);
  }

  private async extractTopics(tweets: TwitterTweet[]): Promise<Array<{ topic: string; frequency: number; relevanceScore: number }>> {
    const allText = tweets.map(tweet => tweet.text).join(' ');
    const keywords = keywordAnalyzer.extractKeywords(allText, {
      categories: ['topics', 'technology', 'business'],
      minConfidence: 0.6,
      maxKeywords: 20,
    });

    const topicCounts: { [key: string]: number } = {};
    tweets.forEach(tweet => {
      keywords.forEach(keyword => {
        if (tweet.text.toLowerCase().includes(keyword.text.toLowerCase())) {
          topicCounts[keyword.text] = (topicCounts[keyword.text] || 0) + 1;
        }
      });
    });

    return Object.entries(topicCounts)
      .map(([topic, frequency]) => ({
        topic,
        frequency,
        relevanceScore: (frequency / tweets.length) * 100,
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 10);
  }

  private async extractProfessionalInterests(text: string): Promise<string[]> {
    return keywordAnalyzer.extractKeywords(text, {
      categories: ['interests', 'skills', 'technologies'],
      minConfidence: 0.5,
      maxKeywords: 15,
    }).map(keyword => keyword.text);
  }

  private async identifyExpertiseAreas(tweets: TwitterTweet[]): Promise<string[]> {
    const expertiseKeywords: { [key: string]: number } = {};

    tweets.forEach(tweet => {
      if (this.isProfessionalTweet(tweet)) {
        const keywords = keywordAnalyzer.extractKeywords(tweet.text, {
          categories: ['skills', 'technologies', 'expertise'],
          minConfidence: 0.7,
        });

        keywords.forEach(keyword => {
          expertiseKeywords[keyword.text] = (expertiseKeywords[keyword.text] || 0) + 1;
        });
      }
    });

    return Object.entries(expertiseKeywords)
      .filter(([, count]) => count >= 3)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([topic]) => topic);
  }

  private extractIndustryConnections(tweets: TwitterTweet[]): string[] {
    const companies: { [key: string]: number } = {};
    const companyPattern = /@([a-zA-Z0-9_]+)/g;

    tweets.forEach(tweet => {
      const mentions = tweet.text.match(companyPattern) || [];
      mentions.forEach(mention => {
        if (mention.length > 3) { // Filter out short mentions
          companies[mention] = (companies[mention] || 0) + 1;
        }
      });
    });

    return Object.entries(companies)
      .filter(([, count]) => count >= 2)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([company]) => company);
  }

  private analyzeContentThemes(tweets: TwitterTweet[]): string[] {
    const themes: { [key: string]: number } = {};

    tweets.forEach(tweet => {
      if (this.isProfessionalTweet(tweet)) {
        const text = tweet.text.toLowerCase();

        // Categorize themes
        if (text.includes('learn') || text.includes('study') || text.includes('course')) {
          themes['Learning & Development'] = (themes['Learning & Development'] || 0) + 1;
        }
        if (text.includes('team') || text.includes('collaborat') || text.includes('together')) {
          themes['Teamwork & Collaboration'] = (themes['Teamwork & Collaboration'] || 0) + 1;
        }
        if (text.includes('innovat') || text.includes('future') || text.includes('trend')) {
          themes['Innovation & Trends'] = (themes['Innovation & Trends'] || 0) + 1;
        }
        if (text.includes('success') || text.includes('achiev') || text.includes('milestone')) {
          themes['Achievements & Success'] = (themes['Achievements & Success'] || 0) + 1;
        }
        if (text.includes('advice') || text.includes('tips') || text.includes('guide')) {
          themes['Advice & Tips'] = (themes['Advice & Tips'] || 0) + 1;
        }
        if (text.includes('opinion') || text.includes('think') || text.includes('believe')) {
          themes['Opinions & Thoughts'] = (themes['Opinions & Thoughts'] || 0) + 1;
        }
      }
    });

    return Object.entries(themes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([theme]) => theme);
  }

  private async extractProfessionalConnections(tweets: TwitterTweet[]): Promise<TwitterProfessionalInsight['networkingInsights']['professionalConnections']> {
    const connections: { [key: string]: { count: number; lastInteraction: string } } = {};

    tweets.forEach(tweet => {
      if (tweet.entities?.mentions) {
        tweet.entities.mentions.forEach(mention => {
          if (this.isProfessionalTweet(tweet)) {
            if (!connections[mention.username]) {
              connections[mention.username] = { count: 0, lastInteraction: tweet.createdAt };
            }
            connections[mention.username].count++;
            if (new Date(tweet.createdAt) > new Date(connections[mention.username].lastInteraction)) {
              connections[mention.username].lastInteraction = tweet.createdAt;
            }
          }
        });
      }
    });

    return Object.entries(connections)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 20)
      .map(([username, data]) => ({
        username,
        name: username, // Would need additional API call to get real name
        interactionCount: data.count,
        relationshipType: this.classifyRelationshipType(data.count),
        lastInteraction: data.lastInteraction,
      }));
  }

  private classifyRelationshipType(interactionCount: number): 'colleague' | 'industry_leader' | 'mentor' | 'recruiter' | 'peer' {
    if (interactionCount > 20) return 'colleague';
    if (interactionCount > 10) return 'mentor';
    if (interactionCount > 5) return 'industry_leader';
    return 'peer';
  }

  private async findIndustryInfluencers(username: string, tweets: TwitterTweet[]): Promise<TwitterProfessionalInsight['networkingInsights']['industryInfluencers']> {
    const mentionedUsers: { [key: string]: { count: number; followers: number } } = {};

    tweets.forEach(tweet => {
      if (tweet.entities?.mentions) {
        tweet.entities.mentions.forEach(mention => {
          mentionedUsers[mention.username] = (mentionedUsers[mention.username] || { count: 0, followers: 0 });
          mentionedUsers[mention.username].count++;
        });
      }
    });

    // In a real implementation, you would fetch follower counts for these users
    // For now, we'll estimate based on interaction frequency
    return Object.entries(mentionedUsers)
      .filter(([, data]) => data.count >= 3)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 10)
      .map(([username, data]) => ({
        username,
        name: username, // Would need additional API call
        followers: data.count * 1000, // Estimate
        relevanceScore: Math.min(data.count * 10, 100),
      }));
  }

  private async identifyNetworkingOpportunities(tweets: TwitterTweet[]): Promise<TwitterProfessionalInsight['networkingInsights']['networkingOpportunities']> {
    const opportunities: TwitterProfessionalInsight['networkingInsights']['networkingOpportunities'] = [];

    // Look for conference mentions
    const conferences = tweets.filter(tweet => {
      const text = tweet.text.toLowerCase();
      return text.includes('conference') || text.includes('summit') || text.includes('meetup');
    });

    conferences.forEach(tweet => {
      opportunities.push({
        event: 'Conference/Event',
        potentialConnections: ['event_organizers', 'attendees'],
        recommendedActions: ['Engage with event hashtag', 'Connect with speakers'],
      });
    });

    // Look for trending topics
    const hashtags: { [key: string]: number } = {};
    tweets.forEach(tweet => {
      if (tweet.entities?.hashtags) {
        tweet.entities.hashtags.forEach(hashtag => {
          hashtags[hashtag.tag] = (hashtags[hashtag.tag] || 0) + 1;
        });
      }
    });

    const trendingHashtags = Object.entries(hashtags)
      .filter(([, count]) => count >= 3)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    trendingHashtags.forEach(([hashtag]) => {
      opportunities.push({
        event: `Trending Topic: #${hashtag}`,
        potentialConnections: ['topic_experts', 'industry_peers'],
        recommendedActions: [`Engage with #${hashtag}`, 'Share your perspective'],
      });
    });

    return opportunities;
  }

  private calculateTweetFrequency(tweets: TwitterTweet[]): TwitterProfessionalInsight['activityPatterns']['tweetFrequency'] {
    if (tweets.length === 0) return { daily: 0, weekly: 0, monthly: 0 };

    const dates = tweets.map(tweet => new Date(tweet.createdAt));
    const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime());

    const timeDiff = sortedDates[sortedDates.length - 1].getTime() - sortedDates[0].getTime();
    const daysDiff = Math.max(timeDiff / (1000 * 60 * 60 * 24), 1);

    return {
      daily: tweets.length / daysDiff,
      weekly: (tweets.length / daysDiff) * 7,
      monthly: (tweets.length / daysDiff) * 30,
    };
  }

  private findActiveHours(tweets: TwitterTweet[]): number[] {
    const hourCounts: { [key: number]: number } = {};

    tweets.forEach(tweet => {
      const hour = new Date(tweet.createdAt).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    return Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([hour]) => parseInt(hour));
  }

  private findActiveDays(tweets: TwitterTweet[]): string[] {
    const dayCounts: { [key: string]: number } = {};
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    tweets.forEach(tweet => {
      const dayName = dayNames[new Date(tweet.createdAt).getDay()];
      dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
    });

    return Object.entries(dayCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([day]) => day);
  }

  private categorizeContentTypes(tweets: TwitterTweet[]): TwitterProfessionalInsight['activityPatterns']['contentTypes'] {
    const types = {
      professional: 0,
      personal: 0,
      promotional: 0,
      engagement: 0,
    };

    tweets.forEach(tweet => {
      if (this.isProfessionalTweet(tweet)) {
        types.professional++;
      } else if (tweet.entities?.urls?.length) {
        types.promotional++;
      } else if (tweet.inReplyToUserId) {
        types.engagement++;
      } else {
        types.personal++;
      }
    });

    const total = tweets.length;
    return {
      professional: (types.professional / total) * 100,
      personal: (types.personal / total) * 100,
      promotional: (types.promotional / total) * 100,
      engagement: (types.engagement / total) * 100,
    };
  }

  private analyzeSeasonalTrends(tweets: TwitterTweet[]): TwitterProfessionalInsight['activityPatterns']['seasonalTrends'] {
    const monthlyData: { [key: string]: { count: number; engagement: number } } = {};

    tweets.forEach(tweet => {
      const month = new Date(tweet.createdAt).toISOString().substring(0, 7); // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { count: 0, engagement: 0 };
      }
      monthlyData[month].count++;
      monthlyData[month].engagement += tweet.publicMetrics.likeCount + tweet.publicMetrics.retweetCount;
    });

    return Object.entries(monthlyData).map(([period, data]) => ({
      period,
      tweetCount: data.count,
      engagement: data.engagement / data.count,
    }));
  }
}

export { TwitterProfessionalTrackingService };
export type {
  TwitterConfig,
  TwitterUser,
  TwitterTweet,
  TwitterMedia,
  TwitterSpace,
  TwitterList,
  TwitterFollow,
  TwitterProfessionalInsight,
};