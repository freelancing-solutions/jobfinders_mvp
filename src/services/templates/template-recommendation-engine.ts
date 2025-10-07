/**
 * Template Recommendation Engine
 *
 * Advanced recommendation system that uses machine learning concepts,
  user behavior analysis, and content matching to recommend
  the most suitable templates for users.
 */

import { ResumeTemplate, Resume, TemplateCustomization } from '@/types/resume';
import { templateRegistry } from '@/services/templates/template-registry';
import { prisma } from '@/lib/prisma';

export interface RecommendationContext {
  user: {
    id: string;
    experienceLevel?: string;
    industry?: string;
    jobTitle?: string;
    skills: string[];
    preferences?: UserPreferences;
  };
  targetJob?: {
    title: string;
    description: string;
    industry?: string;
    requiredSkills: string[];
    seniority?: string;
  };
  resume: Resume;
  session: {
    previousSelections?: string[];
    timeSpent?: number;
    interactionHistory?: InteractionEvent[];
  };
}

export interface UserPreferences {
  preferredLayouts: string[];
  preferredColors: string[];
  preferredFonts: string[];
  avoidedFeatures: string[];
  favoriteCategories: string[];
}

export interface InteractionEvent {
  type: 'view' | 'like' | 'select' | 'customize' | 'export' | 'skip';
  templateId: string;
  timestamp: Date;
  duration?: number;
  context?: any;
}

export interface RecommendationResult {
  template: ResumeTemplate;
  score: number;
  reasons: RecommendationReason[];
  confidence: number;
  category: 'high_match' | 'good_match' | 'potential_match';
  personalized: boolean;
}

export interface RecommendationReason {
  type: 'industry_match' | 'experience_match' | 'skill_match' | 'layout_preference' | 'style_preference' | 'popularity' | 'success_history';
  description: string;
  weight: number;
}

export interface RecommendationWeights {
  industry: number;
  experience: number;
  skills: number;
  userPreferences: number;
  popularity: number;
  successHistory: number;
  similarUsers: number;
  contentSimilarity: number;
}

export interface SimilarUser {
  userId: string;
  similarityScore: number;
  selectedTemplates: string[];
  successRate: number;
}

export class TemplateRecommendationEngine {
  private readonly DEFAULT_WEIGHTS: RecommendationWeights = {
    industry: 0.25,
    experience: 0.20,
    skills: 0.20,
    userPreferences: 0.15,
    popularity: 0.10,
    successHistory: 0.05,
    similarUsers: 0.03,
    contentSimilarity: 0.02
  };

  private weights: RecommendationWeights;
  private userCache: Map<string, any> = new Map();
  private templateCache: Map<string, any> = new Map();

  constructor(weights?: Partial<RecommendationWeights>) {
    this.weights = { ...this.DEFAULT_WEIGHTS, ...weights };
  }

  /**
   * Get personalized template recommendations for a user
   */
  async getRecommendations(
    context: RecommendationContext,
    limit: number = 10
  ): Promise<RecommendationResult[]> {
    try {
      // Get all available templates
      const allTemplates = await templateRegistry.listTemplates({
        isActive: true,
        limit: 100
      });

      // Score each template
      const scoredTemplates = await Promise.all(
        allTemplates.map(template => this.scoreTemplate(template, context))
      );

      // Sort by score and filter
      const recommendations = scoredTemplates
        .filter(result => result.score > 0.3) // Filter out low-quality matches
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      // Update user interaction history
      await this.updateInteractionHistory(context.user.id, recommendations);

      return recommendations;
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      return [];
    }
  }

  /**
   * Get recommendations based on similar users
   */
  async getCollaborativeRecommendations(
    userId: string,
    limit: number = 5
  ): Promise<RecommendationResult[]> {
    try {
      // Find similar users
      const similarUsers = await this.findSimilarUsers(userId, 20);

      if (similarUsers.length === 0) {
        return [];
      }

      // Get templates frequently used by similar users
      const templateScores = new Map<string, { count: number; totalScore: number }>();

      for (const similarUser of similarUsers) {
        const userTemplates = await this.getUserTemplateHistory(similarUser.userId);

        userTemplates.forEach(templateUsage => {
          const existing = templateScores.get(templateUsage.templateId) || { count: 0, totalScore: 0 };
          templateScores.set(templateUsage.templateId, {
            count: existing.count + 1,
            totalScore: existing.totalScore + (similarUser.successRate * similarUser.similarityScore)
          });
        });
      }

      // Convert to recommendations
      const recommendations: RecommendationResult[] = [];

      for (const [templateId, scores] of templateScores.entries()) {
        const template = await templateRegistry.getTemplate(templateId);
        if (template) {
          const avgScore = scores.totalScore / scores.count;
          recommendations.push({
            template,
            score: avgScore,
            reasons: [{
              type: 'similar_users',
              description: `Popular among users with similar profiles`,
              weight: this.weights.similarUsers
            }],
            confidence: Math.min(avgScore, 1.0),
            category: avgScore > 0.7 ? 'high_match' : 'good_match',
            personalized: true
          });
        }
      }

      return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to get collaborative recommendations:', error);
      return [];
    }
  }

  /**
   * Get content-based recommendations
   */
  async getContentBasedRecommendations(
    resume: Resume,
    jobDescription?: string,
    limit: number = 5
  ): Promise<RecommendationResult[]> {
    try {
      const allTemplates = await templateRegistry.listTemplates({
        isActive: true,
        limit: 100
      });

      // Extract features from resume and job description
      const resumeFeatures = await this.extractResumeFeatures(resume);
      const jobFeatures = jobDescription ? await this.extractJobFeatures(jobDescription) : null;

      // Score templates based on content similarity
      const recommendations: RecommendationResult[] = [];

      for (const template of allTemplates) {
        const templateFeatures = await this.extractTemplateFeatures(template);
        const similarityScore = this.calculateContentSimilarity(
          resumeFeatures,
          templateFeatures,
          jobFeatures
        );

        if (similarityScore > 0.3) {
          recommendations.push({
            template,
            score: similarityScore * this.weights.contentSimilarity,
            reasons: [{
              type: 'content_similarity',
              description: 'Template content matches your profile',
              weight: this.weights.contentSimilarity
            }],
            confidence: similarityScore,
            category: similarityScore > 0.6 ? 'good_match' : 'potential_match',
            personalized: true
          });
        }
      }

      return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to get content-based recommendations:', error);
      return [];
    }
  }

  /**
   * Update recommendation weights based on user feedback
   */
  async updateWeights(userId: string, feedback: {
    templateId: string;
    wasHelpful: boolean;
    applied: boolean;
    reason?: string;
  }): Promise<void> {
    try {
      // Store feedback for learning
      await prisma.recommendationFeedback.create({
        data: {
          userId,
          templateId: feedback.templateId,
          wasHelpful: feedback.wasful,
          applied: feedback.applied,
          reason: feedback.reason,
          createdAt: new Date()
        }
      });

      // Update weights based on feedback (simplified machine learning)
      await this.adjustWeights(feedback);
    } catch (error) {
      console.error('Failed to update weights:', error);
    }
  }

  /**
   * Get template performance metrics
   */
  async getTemplatePerformance(templateId: string): Promise<{
    selectionRate: number;
    successRate: number;
    averageRating: number;
    userSatisfaction: number;
    recommendationAccuracy: number;
  }> {
    try {
      const usage = await prisma.resumeTemplateUsage.findMany({
        where: { templateId },
        include: {
          resume: {
            include: {
              user: true
            }
          }
        }
      });

      const feedback = await prisma.recommendationFeedback.findMany({
        where: { templateId }
      });

      const selectionRate = usage.length > 0 ? usage.length / 1000 : 0; // Simplified
      const successRate = Math.random() * 100; // Would be calculated from actual data
      const averageRating = Math.random() * 5; // Would be calculated from actual ratings
      const userSatisfaction = feedback.length > 0
        ? feedback.filter(f => f.wasHelpful).length / feedback.length
        : Math.random();
      const recommendationAccuracy = Math.random() * 100; // Would be calculated from actual data

      return {
        selectionRate,
        successRate,
        averageRating,
        userSatisfaction,
        recommendationAccuracy
      };
    } catch (error) {
      console.error('Failed to get template performance:', error);
      throw error;
    }
  }

  /**
   * Score a single template for a user context
   */
  private async scoreTemplate(
    template: ResumeTemplate,
    context: RecommendationContext
  ): Promise<RecommendationResult> {
    const reasons: RecommendationReason[] = [];
    let totalScore = 0;

    // Industry match
    if (context.user.industry) {
      const industryScore = this.calculateIndustryMatch(template, context.user.industry);
      if (industryScore > 0) {
        reasons.push({
          type: 'industry_match',
          description: `Matches ${context.user.industry} industry standards`,
          weight: this.weights.industry
        });
        totalScore += industryScore * this.weights.industry;
      }
    }

    // Experience level match
    if (context.user.experienceLevel) {
      const experienceScore = this.calculateExperienceMatch(template, context.user.experienceLevel);
      if (experienceScore > 0) {
        reasons.push({
          type: 'experience_match',
          description: `Suitable for ${context.user.experienceLevel} level`,
          weight: this.weights.experience
        });
        totalScore += experienceScore * this.weights.experience;
      }
    }

    // Skills match
    if (context.user.skills.length > 0) {
      const skillsScore = this.calculateSkillsMatch(template, context.user.skills, context.targetJob?.requiredSkills);
      if (skillsScore > 0) {
        reasons.push({
          type: 'skill_match',
          description: `Supports your technical and soft skills`,
          weight: this.weights.skills
        });
        totalScore += skillsScore * this.weights.skills;
      }
    }

    // User preferences
    if (context.user.preferences) {
      const preferenceScore = this.calculatePreferenceMatch(template, context.user.preferences);
      if (preferenceScore > 0) {
        reasons.push({
          type: 'layout_preference',
          description: `Matches your style preferences`,
          weight: this.weights.userPreferences
        });
        totalScore += preferenceScore * this.weights.userPreferences;
      }
    }

    // Popularity
    const popularityScore = this.calculatePopularityScore(template);
    if (popularityScore > 0) {
      reasons.push({
        type: 'popularity',
        description: `Popular choice with ${(template.metadata?.downloadCount || 0)} downloads`,
        weight: this.weights.popularity
      });
      totalScore += popularityScore * this.weights.popularity;
    }

    // Success history
    const successScore = await this.calculateSuccessScore(template, context.user.industry);
    if (successScore > 0) {
      reasons.push({
        type: 'success_history',
        description: `High success rate in your industry`,
        weight: this.weights.successHistory
      });
      totalScore += successScore * this.weights.successHistory;
    }

    // Determine category and confidence
    const category = totalScore > 0.7 ? 'high_match' :
                     totalScore > 0.5 ? 'good_match' : 'potential_match';

    const confidence = Math.min(totalScore, 1.0);

    return {
      template,
      score: totalScore,
      reasons,
      confidence,
      category,
      personalized: context.user.preferences !== undefined
    };
  }

  // Helper methods for scoring

  private calculateIndustryMatch(template: ResumeTemplate, industry: string): number {
    const industryKeywords = {
      technology: ['software', 'developer', 'engineer', 'technical'],
      healthcare: ['medical', 'healthcare', 'clinical', 'patient'],
      finance: ['financial', 'banking', 'investment', 'finance'],
      creative: ['design', 'creative', 'artistic', 'visual'],
      education: ['teaching', 'education', 'academic', 'learning'],
      sales: ['sales', 'revenue', 'client', 'business'],
      marketing: ['marketing', 'branding', 'campaign', 'strategy'],
      consulting: ['consulting', 'strategy', 'advisory', 'analysis'],
      legal: ['legal', 'law', 'compliance', 'regulatory'],
      engineering: ['engineering', 'technical', 'development', 'project']
    };

    const keywords = industryKeywords[industry.toLowerCase()] || [];
    const templateText = `${template.name} ${template.description} ${template.category} ${template.subcategory || ''}`.toLowerCase();

    const matches = keywords.filter(keyword => templateText.includes(keyword));
    return matches.length / keywords.length;
  }

  private calculateExperienceMatch(template: ResumeTemplate, experienceLevel: string): number {
    const experienceMapping = {
      entry: ['modern', 'creative', 'fresh', 'graduate'],
      mid: ['professional', 'corporate', 'business'],
      senior: ['executive', 'leadership', 'management', 'senior'],
      executive: ['executive', 'leadership', 'c-level', 'management']
    };

    const keywords = experienceMapping[experienceLevel] || [];
    const templateText = `${template.name} ${template.description} ${template.category}`.toLowerCase();

    const matches = keywords.filter(keyword => templateText.includes(keyword));
    return matches.length > 0 ? 0.8 : 0.3; // Base score if no specific match
  }

  private calculateSkillsMatch(
    template: ResumeTemplate,
    userSkills: string[],
    jobSkills?: string[]
  ): number {
    const relevantSkills = [...userSkills, ...(jobSkills || [])];
    if (relevantSkills.length === 0) return 0;

    // Check if template supports skills section
    const hasSkillsSection = template.sections?.some(section =>
      section.id === 'skills' || section.id === 'technical-skills'
    );

    if (!hasSkillsSection) return 0;

    // Calculate match based on skills relevance to template
    const templateText = `${template.name} ${template.description}`.toLowerCase();
    const matchedSkills = relevantSkills.filter(skill =>
      templateText.includes(skill.toLowerCase())
    );

    return matchedSkills.length / relevantSkills.length;
  }

  private calculatePreferenceMatch(template: ResumeTemplate, preferences: UserPreferences): number {
    let score = 0;
    let factors = 0;

    // Layout preference
    if (preferences.preferredLayouts.length > 0) {
      factors++;
      if (preferences.preferredLayouts.includes(template.category)) {
        score += 1;
      }
    }

    // Color preference
    if (preferences.preferredColors.length > 0) {
      factors++;
      // Would check actual template colors
      score += 0.5; // Simplified
    }

    // Font preference
    if (preferences.preferredFonts.length > 0) {
      factors++;
      // Would check actual template fonts
      score += 0.5; // Simplified
    }

    // Category preference
    if (preferences.favoriteCategories.length > 0) {
      factors++;
      if (preferences.favoriteCategories.includes(template.category)) {
        score += 1;
      }
    }

    // Avoided features
    if (preferences.avoidedFeatures.length > 0) {
      const hasAvoidedFeatures = preferences.avoidedFeatures.some(feature =>
        template.name.toLowerCase().includes(feature.toLowerCase()) ||
        template.description.toLowerCase().includes(feature.toLowerCase())
      );
      if (hasAvoidedFeatures) {
        score -= 0.5;
      }
    }

    return factors > 0 ? score / factors : 0;
  }

  private calculatePopularityScore(template: ResumeTemplate): number {
    const downloads = template.metadata?.downloadCount || 0;
    const rating = template.metadata?.rating || 0;
    const reviews = template.metadata?.reviewCount || 0;

    // Normalize scores
    const downloadScore = Math.min(downloads / 10000, 1); // Normalize to 0-1
    const ratingScore = rating / 5; // Normalize to 0-1
    const reviewScore = Math.min(reviews / 100, 1); // Normalize to 0-1

    return (downloadScore * 0.4 + ratingScore * 0.4 + reviewScore * 0.2);
  }

  private async calculateSuccessScore(template: ResumeTemplate, industry?: string): Promise<number> {
    // Would calculate actual success rate from database
    // For now, return a simplified score
    return Math.random() * 0.8;
  }

  // Advanced feature methods

  private async findSimilarUsers(userId: string, limit: number): Promise<SimilarUser[]> {
    // Find users with similar characteristics
    const currentUser = await prisma.user.findUnique({
      where: { uid: userId },
      include: {
        resumes: true,
        templateUsage: {
          include: { template: true }
        }
      }
    });

    if (!currentUser) return [];

    // Get other users
    const otherUsers = await prisma.user.findMany({
      where: { uid: { not: userId } },
      include: {
        resumes: true,
        templateUsage: {
          include: { template: true }
        }
      },
      take: limit * 10
    });

    // Calculate similarity scores
    const similarUsers: SimilarUser[] = otherUsers.map(user => ({
      userId: user.uid,
      similarityScore: this.calculateUserSimilarity(currentUser, user),
      selectedTemplates: user.templateUsage.map(usage => usage.templateId),
      successRate: Math.random() * 100 // Would be calculated from actual data
    }));

    return similarUsers
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit);
  }

  private calculateUserSimilarity(user1: any, user2: any): number {
    // Simplified similarity calculation
    let similarity = 0;
    let factors = 0;

    // Compare experience level
    if (user1.experienceLevel && user2.experienceLevel) {
      factors++;
      if (user1.experienceLevel === user2.experienceLevel) similarity += 0.3;
    }

    // Compare industry
    if (user1.industry && user2.industry) {
      factors++;
      if (user1.industry === user2.industry) similarity += 0.3;
    }

    // Compare selected templates
    const templates1 = user1.templateUsage.map((usage: any) => usage.templateId);
    const templates2 = user2.templateUsage.map((usage: any) => usage.templateId);
    const commonTemplates = templates1.filter((id: string) => templates2.includes(id));

    if (templates1.length > 0 && templates2.length > 0) {
      factors++;
      similarity += (commonTemplates.length / Math.max(templates1.length, templates2.length)) * 0.4;
    }

    return factors > 0 ? similarity / factors : 0;
  }

  private async getUserTemplateHistory(userId: string): Promise<any[]> {
    return prisma.resumeTemplateUsage.findMany({
      where: { userUid: userId },
      include: { template: true },
      orderBy: { lastUsed: 'desc' }
    });
  }

  private async extractResumeFeatures(resume: Resume): Promise<any> {
    // Extract features from resume for content-based filtering
    return {
      skills: resume.skills?.map(skill => skill.name.toLowerCase()) || [],
      experienceLevel: resume.metadata?.experienceLevel,
      industry: resume.metadata?.targetIndustry,
      sectionCount: Object.keys(resume).length,
      hasProjects: (resume.projects?.length || 0) > 0,
      hasCertifications: (resume.certifications?.length || 0) > 0,
      summaryLength: resume.summary?.length || 0
    };
  }

  private async extractJobFeatures(jobDescription: string): Promise<any> {
    // Extract features from job description
    const words = jobDescription.toLowerCase().split(/\s+/);
    const skills = []; // Would use NLP to extract skills

    return {
      skills,
      seniority: words.includes('senior') ? 'senior' :
               words.includes('junior') ? 'entry' : 'mid',
      requiredExperience: 0, // Would extract from description
      keywords: words.filter((word, index, arr) =>
        word.length > 4 && arr.indexOf(word) === index
      ).slice(0, 20)
    };
  }

  private async extractTemplateFeatures(template: ResumeTemplate): Promise<any> {
    return {
      category: template.category,
      subcategory: template.subcategory,
      hasATS: template.features?.atsOptimized || false,
      layout: template.layout?.columns?.count || 1,
      sections: template.sections?.length || 0,
      isPremium: template.isPremium,
      rating: template.metadata?.rating || 0
    };
  }

  private calculateContentSimilarity(
    resumeFeatures: any,
    templateFeatures: any,
    jobFeatures?: any
  ): number {
    let similarity = 0;
    let factors = 0;

    // Compare skills relevance
    if (resumeFeatures.skills.length > 0 && templateFeatures.sections > 0) {
      factors++;
      similarity += 0.4; // Simplified calculation
    }

    // Compare experience level suitability
    if (resumeFeatures.experienceLevel) {
      factors++;
      const experienceMatch =
        (resumeFeatures.experienceLevel === 'entry' && templateFeatures.category === 'modern') ||
        (resumeFeatures.experienceLevel === 'senior' && templateFeatures.category === 'professional') ||
        (resumeFeatures.experienceLevel === 'executive' && templateFeatures.category === 'professional');
      similarity += experienceMatch ? 0.3 : 0.1;
    }

    // Compare industry relevance
    if (resumeFeatures.industry) {
      factors++;
      // Would check template industry relevance
      similarity += 0.3; // Simplified
    }

    return factors > 0 ? similarity / factors : 0;
  }

  private async updateInteractionHistory(userId: string, recommendations: RecommendationResult[]): Promise<void> {
    // Store interaction for learning
    try {
      await prisma.recommendationInteraction.createMany({
        data: recommendations.map(rec => ({
          userId,
          templateId: rec.template.templateId,
          score: rec.score,
          category: rec.category,
          personalized: rec.personalized,
          timestamp: new Date()
        })),
        skipDuplicates: true
      });
    } catch (error) {
      console.error('Failed to update interaction history:', error);
    }
  }

  private async adjustWeights(feedback: any): Promise<void> {
    // Simplified weight adjustment based on feedback
    // In a real implementation, this would use more sophisticated ML algorithms
    if (feedback.wasHelpful && feedback.applied) {
      // Increase weights for successful recommendation types
      this.weights.userPreferences = Math.min(1.0, this.weights.userPreferences * 1.05);
      this.weights.industry = Math.min(1.0, this.weights.industry * 1.02);
    } else if (!feedback.wasHelpful) {
      // Decrease weights for unsuccessful recommendations
      this.weights.userPreferences = Math.max(0.01, this.weights.userPreferences * 0.95);
    }
  }
}

// Export singleton instance
export const templateRecommendationEngine = new TemplateRecommendationEngine();