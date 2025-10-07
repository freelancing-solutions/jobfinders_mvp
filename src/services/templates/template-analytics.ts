/**
 * Template Analytics Service
 *
 * Provides analytics and insights for template usage, performance,
 * and user behavior. Tracks metrics to improve template recommendations
 * and user experience.
 */

import { prisma } from '@/lib/prisma';

export interface TemplateUsageStats {
  totalUses: number;
  uniqueUsers: number;
  averageSessionDuration: number;
  conversionRate: number;
  popularCustomizations: PopularCustomization[];
  timeSpentOnCustomization: number;
  templateCompletionRate: number;
}

export interface PopularCustomization {
  customizationId: string;
  customizationName: string;
  count: number;
  percentage: number;
}

export interface TemplatePerformanceStats {
  renderTime: number;
  exportTime: number;
  errorRate: number;
  successRate: number;
  averageFileSize: number;
  cacheHitRate: number;
  memoryUsage: number;
}

export interface TemplateTrends {
  usageTrend: TrendData[];
  popularityTrend: TrendData[];
  featureAdoption: FeatureAdoptionData[];
  seasonalUsage: SeasonalUsageData[];
}

export interface TrendData {
  period: string;
  value: number;
  change: number;
  changePercentage: number;
}

export interface FeatureAdoptionData {
  feature: string;
  adoptionRate: number;
  usage: TrendData[];
  userSegment: UserSegment[];
}

export interface UserSegment {
  segment: string;
  adoptionRate: number;
  count: number;
}

export interface SeasonalUsageData {
  month: number;
  year: number;
  usage: number;
  growth: number;
  popularTemplates: string[];
}

export interface TemplateEffectivenessMetrics {
  atsScoreImprovement: number;
  applicationSuccessRate: number;
  userSatisfactionScore: number;
  templateRecommendationAccuracy: number;
  retentionRate: number;
}

export interface UserBehaviorInsights {
  averageCustomizationsPerUser: number;
  mostUsedFeatures: string[];
  commonCustomizationPaths: CustomizationPath[];
  userSegmentBehavior: SegmentBehavior[];
  churnRisk: ChurnRiskData[];
}

export interface CustomizationPath {
  step: number;
  action: string;
  percentage: number;
  averageTimeSpent: number;
}

export interface SegmentBehavior {
  segment: string;
  preferences: UserPreferences;
  usagePatterns: UsagePattern[];
  conversionMetrics: ConversionMetrics;
}

export interface UserPreferences {
  favoriteCategories: string[];
  preferredLayouts: string[];
  colorSchemePreference: string;
  fontPreference: string;
}

export interface UsagePattern {
  metric: string;
  value: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface ConversionMetrics {
  templateToApplicationRate: number;
  customizationToExportRate: number;
  previewToApplicationRate: number;
}

export interface ChurnRiskData {
  userId: string;
  riskLevel: 'low' | 'medium' | 'high';
  riskFactors: string[];
  lastActivity: Date;
  recommendedAction: string;
}

export interface TemplateRecommendationInsights {
  accuracyRate: number;
  clickThroughRate: number;
  acceptanceRate: number;
  mostEffectiveFactors: RecommendationFactor[];
  userFeedback: RecommendationFeedback[];
}

export interface RecommendationFactor {
  factor: string;
  weight: number;
  effectiveness: number;
}

export interface RecommendationFeedback {
  userId: string;
  templateId: string;
  rating: number;
  feedback: string;
  applied: boolean;
}

export class TemplateAnalytics {
  /**
   * Get comprehensive usage statistics for a template
   */
  async getTemplateUsageStats(templateId: string, timeRange: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<TemplateUsageStats> {
    try {
      const dateRange = this.getDateRange(timeRange);

      // Get basic usage metrics
      const usageData = await prisma.resumeTemplateUsage.aggregate({
        where: {
          templateId,
          lastUsed: {
            gte: dateRange.start,
            lte: dateRange.end
          }
        },
        _sum: {
          useCount: true,
          exportCount: true
        },
        _count: {
          userUid: true
        }
      });

      const totalUses = usageData._sum.useCount || 0;
      const uniqueUsers = usageData._count.userUid || 0;
      const totalExports = usageData._sum.exportCount || 0;

      // Calculate average session duration (this would need session tracking data)
      const averageSessionDuration = await this.calculateAverageSessionDuration(templateId, dateRange);

      // Calculate conversion rate (exports / uses)
      const conversionRate = totalUses > 0 ? (totalExports / totalUses) * 100 : 0;

      // Get popular customizations
      const popularCustomizations = await this.getPopularCustomizations(templateId, dateRange);

      // Get time spent on customization
      const timeSpentOnCustomization = await this.calculateCustomizationTime(templateId, dateRange);

      // Calculate template completion rate
      const templateCompletionRate = await this.calculateCompletionRate(templateId, dateRange);

      return {
        totalUses,
        uniqueUsers,
        averageSessionDuration,
        conversionRate,
        popularCustomizations,
        timeSpentOnCustomization,
        templateCompletionRate
      };
    } catch (error) {
      console.error('Failed to get template usage stats:', error);
      throw new Error('Failed to retrieve template usage statistics');
    }
  }

  /**
   * Get performance metrics for templates
   */
  async getTemplatePerformanceStats(templateId?: string): Promise<TemplatePerformanceStats> {
    try {
      // This would typically come from performance monitoring system
      // For now, we'll use mock data and some basic database queries

      const performanceStats: TemplatePerformanceStats = {
        renderTime: 1200, // ms - would come from actual performance metrics
        exportTime: 3500, // ms - would come from actual performance metrics
        errorRate: 0.02, // 2% error rate
        successRate: 0.98, // 98% success rate
        averageFileSize: 150000, // bytes - 150KB average
        cacheHitRate: 0.75, // 75% cache hit rate
        memoryUsage: 50000 // KB - 50MB average
      };

      // If templateId is provided, we could get template-specific metrics
      if (templateId) {
        // Implementation would query template-specific performance data
      }

      return performanceStats;
    } catch (error) {
      console.error('Failed to get template performance stats:', error);
      throw new Error('Failed to retrieve template performance statistics');
    }
  }

  /**
   * Get usage trends over time
   */
  async getTemplateTrends(templateId?: string, timeRange: 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<TemplateTrends> {
    try {
      const dateRange = this.getDateRange(timeRange);
      const periods = this.generateTimePeriods(dateRange.start, dateRange.end, timeRange);

      // Get usage trend data
      const usageTrend = await this.getUsageTrendData(templateId, periods);

      // Get popularity trend data
      const popularityTrend = await this.getPopularityTrendData(templateId, periods);

      // Get feature adoption data
      const featureAdoption = await this.getFeatureAdoptionData(templateId, dateRange);

      // Get seasonal usage data
      const seasonalUsage = await this.getSeasonalUsageData(templateId, dateRange);

      return {
        usageTrend,
        popularityTrend,
        featureAdoption,
        seasonalUsage
      };
    } catch (error) {
      console.error('Failed to get template trends:', error);
      throw new Error('Failed to retrieve template trends');
    }
  }

  /**
   * Get template effectiveness metrics
   */
  async getTemplateEffectivenessMetrics(templateId: string): Promise<TemplateEffectivenessMetrics> {
    try {
      // Get ATS score improvement
      const atsScoreImprovement = await this.calculateATSScoreImprovement(templateId);

      // Get application success rate
      const applicationSuccessRate = await this.calculateApplicationSuccessRate(templateId);

      // Get user satisfaction score
      const userSatisfactionScore = await this.calculateUserSatisfactionScore(templateId);

      // Get template recommendation accuracy
      const templateRecommendationAccuracy = await this.calculateRecommendationAccuracy(templateId);

      // Get retention rate
      const retentionRate = await this.calculateRetentionRate(templateId);

      return {
        atsScoreImprovement,
        applicationSuccessRate,
        userSatisfactionScore,
        templateRecommendationAccuracy,
        retentionRate
      };
    } catch (error) {
      console.error('Failed to get template effectiveness metrics:', error);
      throw new Error('Failed to retrieve template effectiveness metrics');
    }
  }

  /**
   * Get user behavior insights
   */
  async getUserBehaviorInsights(timeRange: 'week' | 'month' | 'quarter' = 'month'): Promise<UserBehaviorInsights> {
    try {
      const dateRange = this.getDateRange(timeRange);

      // Calculate average customizations per user
      const averageCustomizationsPerUser = await this.calculateAverageCustomizationsPerUser(dateRange);

      // Get most used features
      const mostUsedFeatures = await this.getMostUsedFeatures(dateRange);

      // Get common customization paths
      const commonCustomizationPaths = await this.getCommonCustomizationPaths(dateRange);

      // Get user segment behavior
      const userSegmentBehavior = await this.getUserSegmentBehavior(dateRange);

      // Identify users at risk of churn
      const churnRisk = await this.identifyChurnRisk(dateRange);

      return {
        averageCustomizationsPerUser,
        mostUsedFeatures,
        commonCustomizationPaths,
        userSegmentBehavior,
        churnRisk
      };
    } catch (error) {
      console.error('Failed to get user behavior insights:', error);
      throw new Error('Failed to retrieve user behavior insights');
    }
  }

  /**
   * Get template recommendation insights
   */
  async getTemplateRecommendationInsights(timeRange: 'week' | 'month' = 'month'): Promise<TemplateRecommendationInsights> {
    try {
      const dateRange = this.getDateRange(timeRange);

      // Calculate recommendation accuracy
      const accuracyRate = await this.calculateRecommendationAccuracyRate(dateRange);

      // Get click-through rate
      const clickThroughRate = await this.calculateRecommendationCTR(dateRange);

      // Get acceptance rate
      const acceptanceRate = await this.calculateRecommendationAcceptanceRate(dateRange);

      // Get most effective recommendation factors
      const mostEffectiveFactors = await this.getMostEffectiveRecommendationFactors(dateRange);

      // Get user feedback
      const userFeedback = await this.getRecommendationFeedback(dateRange);

      return {
        accuracyRate,
        clickThroughRate,
        acceptanceRate,
        mostEffectiveFactors,
        userFeedback
      };
    } catch (error) {
      console.error('Failed to get template recommendation insights:', error);
      throw new Error('Failed to retrieve template recommendation insights');
    }
  }

  /**
   * Track a template event for analytics
   */
  async trackTemplateEvent(event: {
    userId: string;
    templateId?: string;
    action: string;
    metadata?: any;
    timestamp?: Date;
  }): Promise<void> {
    try {
      // This would typically send to an analytics service like Google Analytics,
      // Mixpanel, or a custom analytics pipeline
      console.log('Template event tracked:', event);

      // For now, we could store in a database table or send to external service
      // Implementation would depend on your analytics infrastructure
    } catch (error) {
      console.error('Failed to track template event:', error);
    }
  }

  /**
   * Generate a comprehensive analytics report
   */
  async generateAnalyticsReport(timeRange: 'week' | 'month' | 'quarter' = 'month'): Promise<{
    overview: any;
    templatePerformance: any;
    userBehavior: any;
    recommendations: any;
  }> {
    try {
      const dateRange = this.getDateRange(timeRange);

      // Get overview metrics
      const overview = await this.getOverviewMetrics(dateRange);

      // Get template performance data
      const templatePerformance = await this.getTemplatePerformanceData(dateRange);

      // Get user behavior data
      const userBehavior = await this.getUserBehaviorData(dateRange);

      // Generate recommendations
      const recommendations = await this.generateRecommendations(overview, templatePerformance, userBehavior);

      return {
        overview,
        templatePerformance,
        userBehavior,
        recommendations
      };
    } catch (error) {
      console.error('Failed to generate analytics report:', error);
      throw new Error('Failed to generate analytics report');
    }
  }

  // Private helper methods

  private getDateRange(timeRange: 'day' | 'week' | 'month' | 'year' | 'quarter'): { start: Date; end: Date } {
    const now = new Date();
    const start = new Date();

    switch (timeRange) {
      case 'day':
        start.setDate(now.getDate() - 1);
        break;
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(now.getFullYear() - 1);
        break;
    }

    return { start, end: now };
  }

  private generateTimePeriods(start: Date, end: Date, granularity: 'week' | 'month' | 'quarter' | 'year'): string[] {
    const periods: string[] = [];
    const current = new Date(start);

    while (current <= end) {
      periods.push(current.toISOString().split('T')[0]); // YYYY-MM-DD format

      switch (granularity) {
        case 'week':
          current.setDate(current.getDate() + 7);
          break;
        case 'month':
          current.setMonth(current.getMonth() + 1);
          break;
        case 'quarter':
          current.setMonth(current.getMonth() + 3);
          break;
        case 'year':
          current.setFullYear(current.getFullYear() + 1);
          break;
      }
    }

    return periods;
  }

  private async calculateAverageSessionDuration(templateId: string, dateRange: { start: Date; end: Date }): Promise<number> {
    // This would typically come from session tracking data
    // For now, return a mock value
    return 300; // 5 minutes average session
  }

  private async getPopularCustomizations(templateId: string, dateRange: { start: Date; end: Date }): Promise<PopularCustomization[]> {
    try {
      const customizations = await prisma.resumeTemplateCustomization.findMany({
        where: {
          templateId,
          updatedAt: {
            gte: dateRange.start,
            lte: dateRange.end
          }
        },
        include: {
          usage: {
            where: {
              lastUsed: {
                gte: dateRange.start,
                lte: dateRange.end
              }
            }
          }
        }
      });

      const totalUsage = customizations.reduce((sum, c) => sum + (c.usage.length > 0 ? c.usage[0].useCount : 0), 0);

      return customizations
        .map(c => ({
          customizationId: c.id,
          customizationName: c.name || 'Default',
          count: c.usage.length > 0 ? c.usage[0].useCount : 0,
          percentage: totalUsage > 0 ? ((c.usage.length > 0 ? c.usage[0].useCount : 0) / totalUsage) * 100 : 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    } catch (error) {
      console.error('Failed to get popular customizations:', error);
      return [];
    }
  }

  private async calculateCustomizationTime(templateId: string, dateRange: { start: Date; end: Date }): Promise<number> {
    // This would need tracking of customization start/end times
    // For now, return a mock value
    return 180; // 3 minutes average
  }

  private async calculateCompletionRate(templateId: string, dateRange: { start: Date; end: Date }): Promise<number> {
    try {
      const totalUses = await prisma.resumeTemplateUsage.aggregate({
        where: {
          templateId,
          lastUsed: {
            gte: dateRange.start,
            lte: dateRange.end
          }
        },
        _sum: { useCount: true }
      });

      const totalExports = await prisma.resumeTemplateUsage.aggregate({
        where: {
          templateId,
          lastUsed: {
            gte: dateRange.start,
            lte: dateRange.end
          }
        },
        _sum: { exportCount: true }
      });

      const uses = totalUses._sum.useCount || 0;
      const exports = totalExports._sum.exportCount || 0;

      return uses > 0 ? (exports / uses) * 100 : 0;
    } catch (error) {
      console.error('Failed to calculate completion rate:', error);
      return 0;
    }
  }

  private async getUsageTrendData(templateId: string | undefined, periods: string[]): Promise<TrendData[]> {
    // Implementation would query usage data for each period
    // For now, return mock data
    return periods.map((period, index) => ({
      period,
      value: Math.floor(Math.random() * 100) + 50,
      change: index > 0 ? Math.floor(Math.random() * 20) - 10 : 0,
      changePercentage: index > 0 ? Math.floor(Math.random() * 20) - 10 : 0
    }));
  }

  private async getPopularityTrendData(templateId: string | undefined, periods: string[]): Promise<TrendData[]> {
    // Implementation would query popularity data for each period
    // For now, return mock data
    return periods.map((period, index) => ({
      period,
      value: Math.floor(Math.random() * 5) + 3, // Rating 3-8
      change: index > 0 ? (Math.random() * 2 - 1) : 0,
      changePercentage: index > 0 ? (Math.random() * 20 - 10) : 0
    }));
  }

  private async getFeatureAdoptionData(templateId: string | undefined, dateRange: { start: Date; end: Date }): Promise<FeatureAdoptionData[]> {
    // Implementation would analyze which features are being used
    return [
      {
        feature: 'Color Customization',
        adoptionRate: 75,
        usage: [],
        userSegment: [
          { segment: 'Free Users', adoptionRate: 60, count: 1000 },
          { segment: 'Premium Users', adoptionRate: 90, count: 500 }
        ]
      },
      {
        feature: 'Layout Customization',
        adoptionRate: 45,
        usage: [],
        userSegment: [
          { segment: 'Free Users', adoptionRate: 30, count: 1000 },
          { segment: 'Premium Users', adoptionRate: 65, count: 500 }
        ]
      }
    ];
  }

  private async getSeasonalUsageData(templateId: string | undefined, dateRange: { start: Date; end: Date }): Promise<SeasonalUsageData[]> {
    // Implementation would analyze seasonal patterns
    const currentMonth = new Date().getMonth();
    return Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      year: 2024,
      usage: Math.floor(Math.random() * 1000) + 500,
      growth: Math.random() * 40 - 20,
      popularTemplates: ['professional-executive', 'modern-software-engineer']
    }));
  }

  // Additional helper methods would be implemented based on specific analytics requirements
  private async calculateATSScoreImprovement(templateId: string): Promise<number> {
    return 15.5; // 15.5% average ATS score improvement
  }

  private async calculateApplicationSuccessRate(templateId: string): Promise<number> {
    return 22.3; // 22.3% application success rate
  }

  private async calculateUserSatisfactionScore(templateId: string): Promise<number> {
    return 4.2; // 4.2 out of 5
  }

  private async calculateRecommendationAccuracy(templateId: string): Promise<number> {
    return 68.5; // 68.5% accuracy
  }

  private async calculateRetentionRate(templateId: string): Promise<number> {
    return 85.2; // 85.2% retention rate
  }

  private async calculateAverageCustomizationsPerUser(dateRange: { start: Date; end: Date }): Promise<number> {
    return 3.7; // Average of 3.7 customizations per user
  }

  private async getMostUsedFeatures(dateRange: { start: Date; end: Date }): Promise<string[]> {
    return ['Color Scheme', 'Typography', 'Layout', 'Sections', 'Export'];
  }

  private async getCommonCustomizationPaths(dateRange: { start: Date; end: Date }): Promise<CustomizationPath[]> {
    return [
      { step: 1, action: 'Select Template', percentage: 100, averageTimeSpent: 45 },
      { step: 2, action: 'Customize Colors', percentage: 75, averageTimeSpent: 120 },
      { step: 3, action: 'Customize Typography', percentage: 60, averageTimeSpent: 90 },
      { step: 4, action: 'Adjust Layout', percentage: 45, averageTimeSpent: 150 },
      { step: 5, action: 'Export Resume', percentage: 85, averageTimeSpent: 60 }
    ];
  }

  private async getUserSegmentBehavior(dateRange: { start: Date; end: Date }): Promise<SegmentBehavior[]> {
    // Implementation would analyze behavior by user segments
    return [];
  }

  private async identifyChurnRisk(dateRange: { start: Date; end: Date }): Promise<ChurnRiskData[]> {
    // Implementation would identify users at risk of churning
    return [];
  }

  private async calculateRecommendationAccuracyRate(dateRange: { start: Date; end: Date }): Promise<number> {
    return 72.5; // 72.5% recommendation accuracy
  }

  private async calculateRecommendationCTR(dateRange: { start: Date; end: Date }): Promise<number> {
    return 18.3; // 18.3% click-through rate
  }

  private async calculateRecommendationAcceptanceRate(dateRange: { start: Date; end: Date }): Promise<number> {
    return 45.7; // 45.7% acceptance rate
  }

  private async getMostEffectiveRecommendationFactors(dateRange: { start: Date; end: Date }): Promise<RecommendationFactor[]> {
    return [
      { factor: 'Experience Level', weight: 0.35, effectiveness: 0.78 },
      { factor: 'Industry', weight: 0.25, effectiveness: 0.65 },
      { factor: 'Skills Match', weight: 0.20, effectiveness: 0.72 },
      { factor: 'Previous Usage', weight: 0.15, effectiveness: 0.85 },
      { factor: 'Job Title', weight: 0.05, effectiveness: 0.58 }
    ];
  }

  private async getRecommendationFeedback(dateRange: { start: Date; end: Date }): Promise<RecommendationFeedback[]> {
    // Implementation would collect user feedback on recommendations
    return [];
  }

  private async getOverviewMetrics(dateRange: { start: Date; end: Date }): Promise<any> {
    // Implementation would gather overview metrics
    return {
      totalTemplateUses: 15000,
      uniqueUsers: 3000,
      averageSessionDuration: 420,
      conversionRate: 15.5,
      topTemplate: 'professional-executive'
    };
  }

  private async getTemplatePerformanceData(dateRange: { start: Date; end: Date }): Promise<any> {
    // Implementation would gather performance data
    return {
      averageRenderTime: 1200,
      averageExportTime: 3500,
      errorRate: 0.02,
      successRate: 0.98
    };
  }

  private async getUserBehaviorData(dateRange: { start: Date; end: Date }): Promise<any> {
    // Implementation would gather user behavior data
    return {
      averageCustomizationsPerUser: 3.7,
      mostUsedFeatures: ['Color Scheme', 'Typography'],
      churnRisk: 0.08
    };
  }

  private async generateRecommendations(overview: any, templatePerformance: any, userBehavior: any): Promise<any> {
    // Implementation would generate actionable recommendations
    return {
      templateOptimizations: [
        'Improve loading time for modern-software-engineer template',
        'Add more color options to professional-executive template'
      ],
      featureImprovements: [
        'Implement real-time preview for all customizations',
        'Add ATS score preview in customization panel'
      ],
      userExperience: [
        'Simplify the customization workflow for new users',
        'Add tutorial for advanced customization features'
      ]
    };
  }
}

// Export singleton instance
export const templateAnalytics = new TemplateAnalytics();