/**
 * Networking Activity Tracker
 * Tracks and analyzes networking activities, progress, and metrics
 */
export class NetworkingTracker {
  private activities: any[] = [];
  private goals: any[] = [];
  private metrics: any = {};

  /**
   * Analyze networking activities
   */
  async analyzeActivities(userId: string, activities: any[], timeframe: string): Promise<any> {
    this.activities = activities;

    // Filter by timeframe
    const filteredActivities = this.filterByTimeframe(activities, timeframe);

    // Categorize activities
    const categorized = this.categorizeActivities(filteredActivities);

    // Calculate metrics
    const metrics = this.calculateActivityMetrics(categorized);

    // Identify patterns
    const patterns = this.identifyPatterns(categorized);

    // Analyze effectiveness
    const effectiveness = await this.analyzeEffectiveness(categorized);

    return {
      activities: filteredActivities,
      categorized,
      metrics,
      patterns,
      effectiveness,
      timeframe,
      totalActivities: filteredActivities.length
    };
  }

  /**
   * Generate insights from activity analysis
   */
  async generateInsights(analysis: any): Promise<any[]> {
    const insights = [];

    // Activity level insights
    if (analysis.metrics.weeklyAverage < 5) {
      insights.push({
        type: 'activity_level',
        level: 'warning',
        title: 'Low Networking Activity',
        description: 'Your networking activity is below recommended levels. Consider increasing outreach to 3-5 activities per week.',
        actionable: true,
        suggestion: 'Schedule 15 minutes daily for networking activities'
      });
    }

    // Platform diversity insights
    if (analysis.metrics.platformDiversity < 3) {
      insights.push({
        type: 'platform_diversity',
        level: 'info',
        title: 'Limited Platform Usage',
        description: 'You\'re primarily using one platform. Consider diversifying your networking across multiple platforms.',
        actionable: true,
        suggestion: 'Explore LinkedIn, Twitter, and professional forums in your industry'
      });
    }

    // Engagement rate insights
    if (analysis.metrics.engagementRate < 0.3) {
      insights.push({
        type: 'engagement',
        level: 'warning',
        title: 'Low Engagement Rate',
        description: 'Your messages are getting lower than average response rates. Consider improving personalization.',
        actionable: true,
        suggestion: 'Research recipients more thoroughly and tailor messages to their interests'
      });
    }

    // Follow-up insights
    if (analysis.metrics.followUpRate < 0.5) {
      insights.push({
        type: 'follow_up',
        level: 'warning',
        title: 'Missed Follow-up Opportunities',
        description: 'You\'re not following up consistently. Follow-ups can double response rates.',
        actionable: true,
        suggestion: 'Set reminders to follow up 3-5 days after initial outreach'
      });
    }

    // Success pattern insights
    if (analysis.patterns.mostSuccessful.length > 0) {
      const mostSuccessful = analysis.patterns.mostSuccessful[0];
      insights.push({
        type: 'success_pattern',
        level: 'success',
        title: 'Successful Pattern Identified',
        description: `Your ${mostSuccessful.type} activities are most successful with ${mostSuccessful.successRate}% success rate.`,
        actionable: true,
        suggestion: `Focus more on ${mostSuccessful.type} activities for better results`
      });
    }

    return insights;
  }

  /**
   * Generate recommendations based on analysis
   */
  async generateRecommendations(analysis: any): Promise<any[]> {
    const recommendations = [];

    // Activity recommendations
    recommendations.push({
      category: 'Activity Frequency',
      priority: 'high',
      title: 'Increase Weekly Networking',
      description: 'Aim for 5-7 networking activities per week for optimal results',
      actionItems: [
        'Schedule 15 minutes daily for LinkedIn engagement',
        'Send 2-3 personalized connection requests weekly',
        'Attend one virtual or in-person event monthly'
      ],
      expectedImpact: '50% increase in meaningful connections'
    });

    // Content recommendations
    if (analysis.metrics.contentCreationRate < 0.5) {
      recommendations.push({
        category: 'Content Strategy',
        priority: 'medium',
        title: 'Create More Professional Content',
        description: 'Sharing content increases visibility and attracts inbound connections',
        actionItems: [
          'Share one industry insight weekly',
          'Write about your project experiences',
          'Comment on trending industry topics'
        ],
        expectedImpact: '30% increase in profile views'
      });
    }

    // Follow-up recommendations
    recommendations.push({
      category: 'Follow-up Strategy',
      priority: 'high',
      title: 'Implement Systematic Follow-ups',
      description: 'Consistent follow-ups dramatically increase response rates',
      actionItems: [
        'Set calendar reminders for follow-ups',
        'Create follow-up message templates',
        'Track response rates by follow-up attempt'
      ],
      expectedImpact: '80% improvement in response rates'
    });

    // Platform recommendations
    if (analysis.metrics.platformDiversity < 3) {
      recommendations.push({
        category: 'Platform Diversification',
        priority: 'medium',
        title: 'Expand to New Platforms',
        description: 'Different platforms offer different networking opportunities',
        actionItems: [
          'Join 2-3 industry-specific LinkedIn groups',
          'Participate in relevant Twitter discussions',
          'Explore professional forums in your field'
        ],
        expectedImpact: '40% broader network reach'
      });
    }

    // Personalization recommendations
    if (analysis.metrics.personalizationScore < 0.7) {
      recommendations.push({
        category: 'Message Personalization',
        priority: 'high',
        title: 'Improve Message Personalization',
        description: 'Personalized messages have 3x higher response rates',
        actionItems: [
          'Research recipients before reaching out',
          'Find common ground or shared interests',
          'Reference recent posts or accomplishments'
        ],
        expectedImpact: '200% increase in response rates'
      });
    }

    return recommendations;
  }

  /**
   * Track progress towards networking goals
   */
  async trackGoalProgress(userId: string, analysis: any): Promise<any> {
    // Get user's networking goals
    const goals = await this.getUserGoals(userId);

    const progress = goals.map(goal => {
      const currentValue = this.getCurrentValue(goal, analysis);
      const targetValue = goal.target;
      const progressPercentage = Math.min(100, (currentValue / targetValue) * 100);

      return {
        goalId: goal.id,
        title: goal.title,
        target: targetValue,
        current: currentValue,
        progress: Math.round(progressPercentage),
        onTrack: this.isOnTrack(goal, progressPercentage),
        timeframe: goal.timeframe,
        category: goal.category
      };
    });

    // Calculate overall progress
    const overallProgress = Math.round(
      progress.reduce((sum, p) => sum + p.progress, 0) / progress.length
    );

    return {
      goals: progress,
      overallProgress,
      onTrackGoals: progress.filter(p => p.onTrack).length,
      totalGoals: progress.length,
      nextMilestones: this.getNextMilestones(progress)
    };
  }

  /**
   * Calculate comprehensive metrics
   */
  async calculateMetrics(analysis: any): Promise<any> {
    return {
      activityMetrics: {
        totalActivities: analysis.totalActivities,
        weeklyAverage: analysis.metrics.weeklyAverage,
        dailyAverage: analysis.metrics.weeklyAverage / 7,
        platformDiversity: analysis.metrics.platformDiversity,
        activityConsistency: analysis.metrics.consistencyScore
      },
      engagementMetrics: {
        engagementRate: analysis.metrics.engagementRate,
        responseRate: analysis.metrics.responseRate,
        followUpRate: analysis.metrics.followUpRate,
        conversionRate: analysis.metrics.conversionRate
      },
      networkGrowth: {
        newConnections: analysis.metrics.newConnections,
        connectionGrowthRate: analysis.metrics.growthRate,
        networkQuality: analysis.metrics.qualityScore,
        relationshipBuilding: analysis.metrics.relationshipScore
      },
      contentMetrics: {
        contentCreationRate: analysis.metrics.contentCreationRate,
        contentEngagementRate: analysis.metrics.contentEngagementRate,
        thoughtLeadershipScore: analysis.metrics.thoughtLeadershipScore
      },
      roiMetrics: {
        timeInvestment: analysis.metrics.totalTimeInvested,
        opportunitiesGenerated: analysis.metrics.opportunitiesGenerated,
        referralQuality: analysis.metrics.referralQuality,
        networkingROI: this.calculateROI(analysis.metrics)
      }
    };
  }

  /**
   * Filter activities by timeframe
   */
  private filterByTimeframe(activities: any[], timeframe: string): any[] {
    const now = new Date();
    let startDate: Date;

    switch (timeframe) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '6m':
        startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return activities.filter(activity =>
      new Date(activity.date) >= startDate
    );
  }

  /**
   * Categorize activities
   */
  private categorizeActivities(activities: any[]): any {
    const categories = {
      outreach: [],
      engagement: [],
      content: [],
      events: [],
      follow_up: [],
      relationship_building: []
    };

    activities.forEach(activity => {
      const category = this.categorizeActivity(activity);
      if (categories[category]) {
        categories[category].push(activity);
      }
    });

    return categories;
  }

  /**
   * Categorize individual activity
   */
  private categorizeActivity(activity: any): string {
    const type = activity.type?.toLowerCase();
    const description = activity.description?.toLowerCase() || '';

    if (type === 'connection_request' || type === 'message' || description.includes('reach out')) {
      return 'outreach';
    }
    if (type === 'like' || type === 'comment' || description.includes('engage')) {
      return 'engagement';
    }
    if (type === 'post' || type === 'article' || description.includes('create content')) {
      return 'content';
    }
    if (type === 'event' || description.includes('attend')) {
      return 'events';
    }
    if (description.includes('follow up')) {
      return 'follow_up';
    }
    if (description.includes('coffee') || description.includes('meeting')) {
      return 'relationship_building';
    }

    return 'engagement'; // default
  }

  /**
   * Calculate activity metrics
   */
  private calculateActivityMetrics(categorized: any): any {
    const totalActivities = Object.values(categorized).flat().length;
    const daysInPeriod = 30; // Default to 30 days
    const weeklyAverage = (totalActivities / daysInPeriod) * 7;

    // Calculate platform diversity
    const platforms = new Set();
    Object.values(categorized).flat().forEach((activity: any) => {
      if (activity.platform) {
        platforms.add(activity.platform);
      }
    });

    // Calculate consistency score
    const consistencyScore = this.calculateConsistencyScore(categorized);

    return {
      totalActivities,
      weeklyAverage,
      dailyAverage: weeklyAverage / 7,
      platformDiversity: platforms.size,
      consistencyScore,
      engagementRate: this.calculateEngagementRate(categorized),
      responseRate: this.calculateResponseRate(categorized),
      followUpRate: this.calculateFollowUpRate(categorized),
      conversionRate: this.calculateConversionRate(categorized),
      newConnections: this.countNewConnections(categorized),
      growthRate: this.calculateGrowthRate(categorized),
      qualityScore: this.calculateQualityScore(categorized),
      relationshipScore: this.calculateRelationshipScore(categorized),
      contentCreationRate: this.calculateContentCreationRate(categorized),
      contentEngagementRate: this.calculateContentEngagementRate(categorized),
      thoughtLeadershipScore: this.calculateThoughtLeadershipScore(categorized),
      totalTimeInvested: this.calculateTimeInvested(categorized),
      opportunitiesGenerated: this.countOpportunities(categorized),
      referralQuality: this.calculateReferralQuality(categorized)
    };
  }

  /**
   * Identify patterns in activities
   */
  private identifyPatterns(categorized: any): any {
    const patterns = {
      mostSuccessful: this.findMostSuccessfulCategories(categorized),
      bestTimes: this.findBestTimes(categorized),
      optimalFrequency: this.findOptimalFrequency(categorized),
      platformEffectiveness: this.findPlatformEffectiveness(categorized),
      contentThemes: this.findSuccessfulContentThemes(categorized)
    };

    return patterns;
  }

  /**
   * Analyze effectiveness of activities
   */
  private async analyzeEffectiveness(categorized: any): Promise<any> {
    const effectiveness = {};

    for (const [category, activities] of Object.entries(categorized)) {
      const categoryActivities = activities as any[];
      if (categoryActivities.length === 0) {
        effectiveness[category] = {
          successRate: 0,
          averageResponseTime: 0,
          conversionRate: 0,
          qualityScore: 0
        };
        continue;
      }

      const successful = categoryActivities.filter(a => a.success).length;
      const responseTimes = categoryActivities
        .filter(a => a.responseTime)
        .map(a => a.responseTime);
      const conversions = categoryActivities.filter(a => a.converted).length;

      effectiveness[category] = {
        successRate: (successful / categoryActivities.length) * 100,
        averageResponseTime: responseTimes.length > 0
          ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
          : 0,
        conversionRate: (conversions / categoryActivities.length) * 100,
        qualityScore: this.calculateQualityScoreForCategory(categoryActivities)
      };
    }

    return effectiveness;
  }

  /**
   * Calculate consistency score
   */
  private calculateConsistencyScore(categorized: any): number {
    // Simple implementation - could be more sophisticated
    const totalActivities = Object.values(categorized).flat().length;
    const daysInPeriod = 30;
    const averagePerDay = totalActivities / daysInDay;

    // Consistency is highest when activities are spread evenly
    // Score from 0-1, where 1 is perfect consistency
    return Math.min(1, averagePerDay / 5); // Assuming 5 activities per day is ideal
  }

  /**
   * Calculate engagement rate
   */
  private calculateEngagementRate(categorized: any): number {
    const engagementActivities = categorized.engagement || [];
    const totalEngagements = engagementActivities.length;
    const positiveEngagements = engagementActivities.filter(a => a.positive).length;

    return totalEngagements > 0 ? positiveEngagements / totalEngagements : 0;
  }

  /**
   * Calculate response rate
   */
  private calculateResponseRate(categorized: any): number {
    const outreachActivities = categorized.outreach || [];
    const totalOutreach = outreachActivities.length;
    const responses = outreachActivities.filter(a => a.response).length;

    return totalOutreach > 0 ? responses / totalOutreach : 0;
  }

  /**
   * Calculate follow-up rate
   */
  private calculateFollowUpRate(categorized: any): number {
    const outreachActivities = categorized.outreach || [];
    const totalOutreach = outreachActivities.length;
    const followedUp = outreachActivities.filter(a => a.followUp).length;

    return totalOutreach > 0 ? followedUp / totalOutreach : 0;
  }

  /**
   * Calculate conversion rate
   */
  private calculateConversionRate(categorized: any): number {
    const outreachActivities = categorized.outreach || [];
    const totalOutreach = outreachActivities.length;
    const converted = outreachActivities.filter(a => a.converted).length;

    return totalOutreach > 0 ? converted / totalOutreach : 0;
  }

  /**
   * Count new connections
   */
  private countNewConnections(categorized: any): number {
    const outreachActivities = categorized.outreach || [];
    return outreachActivities.filter(a => a.newConnection).length;
  }

  /**
   * Calculate growth rate
   */
  private calculateGrowthRate(categorized: any): number {
    const newConnections = this.countNewConnections(categorized);
    const daysInPeriod = 30;
    return (newConnections / daysInPeriod) * 30; // Monthly growth rate
  }

  /**
   * Calculate quality score
   */
  private calculateQualityScore(categorized: any): number {
    const allActivities = Object.values(categorized).flat();
    if (allActivities.length === 0) return 0;

    const qualityScore = allActivities.reduce((sum, activity) => {
      let score = 0;
      if (activity.success) score += 0.3;
      if (activity.response) score += 0.3;
      if (activity.personalized) score += 0.2;
      if (activity.followUp) score += 0.2;
      return sum + score;
    }, 0);

    return qualityScore / allActivities.length;
  }

  /**
   * Calculate relationship score
   */
  private calculateRelationshipScore(categorized: any): number {
    const relationshipActivities = categorized.relationship_building || [];
    const engagementActivities = categorized.engagement || [];

    const totalRelationshipActivities = relationshipActivities.length + engagementActivities.length;
    const meaningfulInteractions = relationshipActivities.filter(a => a.meaningful).length +
                                  engagementActivities.filter(a => a.meaningful).length;

    return totalRelationshipActivities > 0 ? meaningfulInteractions / totalRelationshipActivities : 0;
  }

  /**
   * Calculate content creation rate
   */
  private calculateContentCreationRate(categorized: any): number {
    const contentActivities = categorized.content || [];
    const totalActivities = Object.values(categorized).flat().length;

    return totalActivities > 0 ? contentActivities.length / totalActivities : 0;
  }

  /**
   * Calculate content engagement rate
   */
  private calculateContentEngagementRate(categorized: any): number {
    const contentActivities = categorized.content || [];
    if (contentActivities.length === 0) return 0;

    const totalEngagements = contentActivities.reduce((sum, content) => {
      return sum + (content.likes || 0) + (content.comments || 0) + (content.shares || 0);
    }, 0);

    return totalEngagements / contentActivities.length;
  }

  /**
   * Calculate thought leadership score
   */
  private calculateThoughtLeadershipScore(categorized: any): number {
    const contentActivities = categorized.content || [];
    if (contentActivities.length === 0) return 0;

    const highQualityContent = contentActivities.filter(content =>
      content.likes > 10 || content.comments > 5 || content.shares > 2
    ).length;

    return highQualityContent / contentActivities.length;
  }

  /**
   * Calculate time invested
   */
  private calculateTimeInvested(categorized: any): number {
    const allActivities = Object.values(categorized).flat();

    return allActivities.reduce((total, activity) => {
      return total + (activity.duration || 15); // Default 15 minutes
    }, 0);
  }

  /**
   * Count opportunities generated
   */
  private countOpportunities(categorized: any): number {
    const allActivities = Object.values(categorized).flat();
    return allActivities.filter(activity => activity.opportunity).length;
  }

  /**
   * Calculate referral quality
   */
  private calculateReferralQuality(categorized: any): number {
    const opportunities = this.countOpportunities(categorized);
    if (opportunities === 0) return 0;

    const highQualityOpportunities = Object.values(categorized).flat()
      .filter(activity => activity.opportunity && activity.opportunityQuality === 'high').length;

    return highQualityOpportunities / opportunities;
  }

  /**
   * Find most successful categories
   */
  private findMostSuccessfulCategories(categorized: any): any[] {
    const categorySuccess = [];

    for (const [category, activities] of Object.entries(categorized)) {
      const categoryActivities = activities as any[];
      if (categoryActivities.length === 0) continue;

      const successRate = (categoryActivities.filter(a => a.success).length / categoryActivities.length) * 100;

      categorySuccess.push({
        category,
        successRate,
        totalActivities: categoryActivities.length
      });
    }

    return categorySuccess.sort((a, b) => b.successRate - a.successRate);
  }

  /**
   * Find best times for networking
   */
  private findBestTimes(categorized: any): any[] {
    const allActivities = Object.values(categorized).flat();
    const timeAnalysis = {};

    allActivities.forEach(activity => {
      if (activity.date) {
        const hour = new Date(activity.date).getHours();
        const dayOfWeek = new Date(activity.date).getDay();

        const key = `${dayOfWeek}-${hour}`;
        if (!timeAnalysis[key]) {
          timeAnalysis[key] = { count: 0, success: 0 };
        }
        timeAnalysis[key].count++;
        if (activity.success) {
          timeAnalysis[key].success++;
        }
      }
    });

    // Convert to array and calculate success rates
    const timeSlots = Object.entries(timeAnalysis).map(([key, data]: [string, any]) => {
      const [day, hour] = key.split('-').map(Number);
      return {
        dayOfWeek: day,
        hour,
        count: data.count,
        successRate: (data.success / data.count) * 100
      };
    });

    return timeSlots.sort((a, b) => b.successRate - a.successRate).slice(0, 5);
  }

  /**
   * Find optimal frequency
   */
  private findOptimalFrequency(categorized: any): any {
    const allActivities = Object.values(categorized).flat();
    const dailyActivity = {};

    // Group activities by day
    allActivities.forEach(activity => {
      if (activity.date) {
        const day = new Date(activity.date).toDateString();
        if (!dailyActivity[day]) {
          dailyActivity[day] = { count: 0, success: 0 };
        }
        dailyActivity[day].count++;
        if (activity.success) {
          dailyActivity[day].success++;
        }
      }
    });

    // Analyze success by frequency
    const frequencyAnalysis = {};
    Object.values(dailyActivity).forEach((day: any) => {
      const frequency = Math.min(10, Math.ceil(day.count / 2) * 2); // Round to nearest 2, max 10
      if (!frequencyAnalysis[frequency]) {
        frequencyAnalysis[frequency] = { totalDays: 0, totalSuccess: 0 };
      }
      frequencyAnalysis[frequency].totalDays++;
      frequencyAnalysis[frequency].totalSuccess += (day.success / day.count) * 100;
    });

    // Find optimal frequency
    const optimalFreq = Object.entries(frequencyAnalysis)
      .map(([freq, data]: [string, any]) => ({
        frequency: parseInt(freq),
        avgSuccessRate: data.totalSuccess / data.totalDays
      }))
      .sort((a, b) => b.avgSuccessRate - a.avgSuccessRate)[0];

    return optimalFreq || { frequency: 5, avgSuccessRate: 50 };
  }

  /**
   * Find platform effectiveness
   */
  private findPlatformEffectiveness(categorized: any): any[] {
    const platformAnalysis = {};

    Object.values(categorized).flat().forEach(activity => {
      if (activity.platform) {
        if (!platformAnalysis[activity.platform]) {
          platformAnalysis[activity.platform] = { total: 0, success: 0 };
        }
        platformAnalysis[activity.platform].total++;
        if (activity.success) {
          platformAnalysis[activity.platform].success++;
        }
      }
    });

    return Object.entries(platformAnalysis).map(([platform, data]: [string, any]) => ({
      platform,
      totalActivities: data.total,
      successRate: (data.success / data.total) * 100
    })).sort((a, b) => b.successRate - a.successRate);
  }

  /**
   * Find successful content themes
   */
  private findSuccessfulContentThemes(categorized: any): any[] {
    const contentActivities = categorized.content || [];
    const themes = {};

    contentActivities.forEach(content => {
      if (content.theme) {
        if (!themes[content.theme]) {
          themes[content.theme] = { count: 0, totalEngagement: 0 };
        }
        themes[content.theme].count++;
        themes[content.theme].totalEngagement +=
          (content.likes || 0) + (content.comments || 0) + (content.shares || 0);
      }
    });

    return Object.entries(themes).map(([theme, data]: [string, any]) => ({
      theme,
      postCount: data.count,
      avgEngagement: data.totalEngagement / data.count
    })).sort((a, b) => b.avgEngagement - a.avgEngagement);
  }

  /**
   * Calculate quality score for category
   */
  private calculateQualityScoreForCategory(activities: any[]): number {
    if (activities.length === 0) return 0;

    const totalScore = activities.reduce((sum, activity) => {
      let score = 0;
      if (activity.success) score += 0.4;
      if (activity.response) score += 0.3;
      if (activity.personalized) score += 0.2;
      if (activity.followUp) score += 0.1;
      return sum + score;
    }, 0);

    return totalScore / activities.length;
  }

  /**
   * Calculate ROI
   */
  private calculateROI(metrics: any): number {
    const timeInvestedHours = metrics.totalTimeInvested / 60;
    const opportunitiesValue = metrics.opportunitiesGenerated * 100; // Estimate $100 per opportunity
    const connectionValue = metrics.newConnections * 10; // Estimate $10 per connection

    const totalValue = opportunitiesValue + connectionValue;
    const timeCost = timeInvestedHours * 50; // Estimate $50/hour value of time

    return timeCost > 0 ? ((totalValue - timeCost) / timeCost) * 100 : 0;
  }

  /**
   * Get user goals (mock implementation)
   */
  private async getUserGoals(userId: string): Promise<any[]> {
    // In real implementation, this would fetch from database
    return [
      {
        id: '1',
        title: 'Expand Professional Network',
        target: 50,
        timeframe: '6m',
        category: 'growth'
      },
      {
        id: '2',
        title: 'Generate Job Referrals',
        target: 5,
        timeframe: '3m',
        category: 'opportunities'
      },
      {
        id: '3',
        title: 'Attend Industry Events',
        target: 3,
        timeframe: '3m',
        category: 'events'
      }
    ];
  }

  /**
   * Get current value for goal
   */
  private getCurrentValue(goal: any, analysis: any): number {
    switch (goal.category) {
      case 'growth':
        return analysis.metrics.newConnections || 0;
      case 'opportunities':
        return analysis.metrics.opportunitiesGenerated || 0;
      case 'events':
        return analysis.categorized.events?.length || 0;
      default:
        return 0;
    }
  }

  /**
   * Check if goal is on track
   */
  private isOnTrack(goal: any, progressPercentage: number): boolean {
    // Simple implementation - could be more sophisticated based on timeline
    return progressPercentage >= 50; // At least 50% progress to be on track
  }

  /**
   * Get next milestones
   */
  private getNextMilestones(progress: any[]): any[] {
    return progress
      .filter(p => p.progress < 100)
      .map(p => ({
        goal: p.title,
        current: p.current,
        nextTarget: Math.ceil((p.target * 0.25) / 25) * 25, // Next 25% milestone
        percentage: p.progress
      }))
      .slice(0, 3);
  }
}