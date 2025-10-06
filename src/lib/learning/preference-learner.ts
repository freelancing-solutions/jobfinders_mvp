import { logger } from '@/lib/logger'

export interface UserPreference {
  userId: string
  preferences: PreferenceProfile
  model: PreferenceModel
  confidence: number
  lastUpdated: Date
  version: number
}

export interface PreferenceProfile {
  jobPreferences: JobPreferences
  interactionPreferences: InteractionPreferences
  contentPreferences: ContentPreferences
  temporalPreferences: TemporalPreferences
  contextualPreferences: ContextualPreferences
}

export interface JobPreferences {
  industries: Array<{ industry: string; weight: number }>
  locations: Array<{ location: string; weight: number }>
  salaryRange: { min: number; max: number; weight: number }
  remoteWork: { remote: boolean; weight: number }
  experienceLevel: { level: string; weight: number }
  jobTypes: Array<{ type: string; weight: number }>
  companySize: { size: string; weight: number }
  skills: Array<{ skill: string; weight: number; required: boolean }>
  benefits: Array<{ benefit: string; weight: number }>
}

export interface InteractionPreferences {
  preferredInteractionChannels: Array<{ channel: string; weight: number }>
  communicationFrequency: { frequency: string; weight: number }
  responseTimeExpectation: { expectation: string; weight: number }
  notificationTypes: Array<{ type: string; enabled: boolean; weight: number }>
  contentFormat: { format: string; weight: number }
  languagePreference: { language: string; weight: number }
}

export interface ContentPreferences {
  informationDepth: { depth: string; weight: number }
  visualContent: { preference: boolean; weight: number }
  dataVisualization: { preference: boolean; weight: number }
  recommendationsFrequency: { frequency: string; weight: number }
  learningStyle: { style: string; weight: number }
  expertiseLevel: { level: string; weight: number }
}

export interface TemporalPreferences {
  activeHours: Array<{ start: string; end: string; weight: number }>
  preferredDays: Array<{ day: string; weight: number }>
  responsePatterns: Array<{ timeframe: string; probability: number }>
  seasonality: Array<{ season: string; engagement: number }>
  interactionCadence: { cadence: string; weight: number }
}

export interface ContextualPreferences {
  devicePreferences: Array<{ device: string; weight: number }>
  locationBasedPreferences: Array<{ location: string; preferences: any; weight: number }>
  situationBasedPreferences: Array<{ situation: string; preferences: any; weight: number }>
  moodBasedPreferences: Array<{ mood: string; preferences: any; weight: number }>
  goalBasedPreferences: Array<{ goal: string; preferences: any; weight: number }>
}

export interface PreferenceModel {
  algorithm: 'collaborative_filtering' | 'content_based' | 'hybrid' | 'neural_network'
  features: string[]
  weights: Record<string, number>
  hyperparameters: Record<string, any>
  performance: ModelPerformance
  lastTrained: Date
}

export interface ModelPerformance {
  accuracy: number
  precision: number
  recall: number
  f1Score: number
  trainingLoss: number
  validationLoss: number
  customMetrics: Record<string, number>
}

export interface LearningData {
  userId: string
  interactions: UserInteraction[]
  feedback: UserFeedback[]
  context: InteractionContext[]
  timestamp: Date
}

export interface UserInteraction {
  id: string
  type: InteractionType
  entityType: 'job' | 'candidate' | 'recommendation' | 'search' | 'content'
  entityId: string
  timestamp: Date
  duration?: number
  outcome: 'positive' | 'negative' | 'neutral'
  context: Record<string, any>
  value: number // Implicit satisfaction signal
}

export type InteractionType =
  | 'view'
  | 'click'
  | 'save'
  | 'share'
  | 'apply'
  | 'ignore'
  | 'filter'
  | 'search'
  | 'recommendation_click'
  | 'profile_update'
  | 'settings_change'

export interface UserFeedback {
  id: string
  type: 'explicit' | 'implicit'
  category: 'match_quality' | 'content_quality' | 'ui_experience' | 'recommendation_relevance'
  rating: number
  sentiment: 'positive' | 'neutral' | 'negative'
  comments?: string
  timestamp: Date
  context: Record<string, any>
}

export interface InteractionContext {
  sessionId: string
  device: string
  location?: string
  timeOfDay: string
  previousActions: string[]
  environmentalFactors: Record<string, any>
}

export interface LearningConfig {
  algorithm: 'collaborative_filtering' | 'content_based' | 'hybrid' | 'neural_network'
  learningRate: number
  regularization: number
  updateFrequency: 'real_time' | 'batch' | 'scheduled'
  minInteractions: number
  maxHistory: number // in days
  featureWeights: Record<string, number>
  decayRate: number // for preference decay over time
  privacyLevel: 'anonymous' | 'pseudonymous' | 'identified'
}

export interface PreferenceUpdate {
  userId: string
  updates: PreferenceUpdateData[]
  confidence: number
  source: 'explicit_feedback' | 'implicit_behavior' | 'hybrid'
  timestamp: Date
}

export interface PreferenceUpdateData {
  category: keyof PreferenceProfile
  field: string
  oldValue: any
  newValue: any
  weight: number
  confidence: number
}

export interface PersonalizationMetrics {
  accuracy: number
  clickThroughRate: number
  conversionRate: number
  userSatisfaction: number
  engagementTime: number
  retentionRate: number
  personalizationScore: number
}

export class PreferenceLearner {
  private config: LearningConfig
  private userPreferences: Map<string, UserPreference> = new Map()
  private learningData: Map<string, LearningData[]> = new Map()
  private globalModel: PreferenceModel
  private featureExtractor: FeatureExtractor

  constructor(config: Partial<LearningConfig> = {}) {
    this.config = {
      algorithm: 'hybrid',
      learningRate: 0.01,
      regularization: 0.001,
      updateFrequency: 'real_time',
      minInteractions: 10,
      maxHistory: 90,
      featureWeights: {},
      decayRate: 0.95,
      privacyLevel: 'pseudonymous',
      ...config
    }

    this.globalModel = this.initializeModel()
    this.featureExtractor = new FeatureExtractor()
  }

  /**
   * Learn from user interactions
   */
  async learnFromInteraction(
    userId: string,
    interaction: UserInteraction,
    context: InteractionContext
  ): Promise<void> {
    try {
      logger.debug('Learning from user interaction', {
        userId,
        interactionType: interaction.type,
        outcome: interaction.outcome
      })

      // Store interaction data
      this.storeInteractionData(userId, interaction, context)

      // Check if we have enough data to update preferences
      const userData = this.learningData.get(userId) || []
      if (userData.length < this.config.minInteractions) {
        return
      }

      // Extract features from interaction
      const features = this.featureExtractor.extractFeatures(interaction, context)

      // Update user preferences
      await this.updatePreferences(userId, features, interaction.outcome)

      // Update global model periodically
      if (Math.random() < 0.1) { // 10% chance to update global model
        await this.updateGlobalModel()
      }

      logger.debug('Learning completed', { userId, featuresCount: Object.keys(features).length })

    } catch (error) {
      logger.error('Error learning from interaction', { error, userId })
    }
  }

  /**
   * Learn from explicit feedback
   */
  async learnFromFeedback(
    userId: string,
    feedback: UserFeedback,
    context: InteractionContext
  ): Promise<void> {
    try {
      logger.debug('Learning from explicit feedback', {
        userId,
        feedbackType: feedback.type,
        rating: feedback.rating,
        sentiment: feedback.sentiment
      })

      // Store feedback data
      this.storeFeedbackData(userId, feedback, context)

      // Extract features from feedback
      const features = this.featureExtractor.extractFeedbackFeatures(feedback, context)

      // Update preferences with higher confidence for explicit feedback
      await this.updatePreferences(userId, features, feedback.sentiment === 'positive' ? 'positive' : 'negative')

      logger.debug('Feedback learning completed', { userId, featuresCount: Object.keys(features).length })

    } catch (error) {
      logger.error('Error learning from feedback', { error, userId })
    }
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string): Promise<UserPreference | null> {
    try {
      return this.userPreferences.get(userId) || null

    } catch (error) {
      logger.error('Error getting user preferences', { error, userId })
      return null
    }
  }

  /**
   * Update user preferences directly
   */
  async updatePreferencesDirectly(
    userId: string,
    updates: Partial<PreferenceProfile>,
    confidence: number = 0.8
  ): Promise<void> {
    try {
      logger.info('Updating preferences directly', { userId, confidence })

      let userPref = this.userPreferences.get(userId)

      if (!userPref) {
        // Create new user preference profile
        userPref = {
          userId,
          preferences: this.createDefaultPreferences(),
          model: this.initializeUserModel(),
          confidence,
          lastUpdated: new Date(),
          version: 1
        }
      }

      // Merge updates with existing preferences
      userPref.preferences = this.mergePreferences(userPref.preferences, updates)
      userPref.confidence = confidence
      userPref.lastUpdated = new Date()
      userPref.version++

      this.userPreferences.set(userId, userPref)

      logger.info('Preferences updated successfully', { userId, version: userPref.version })

    } catch (error) {
      logger.error('Error updating preferences directly', { error, userId })
      throw new Error('Failed to update preferences')
    }
  }

  /**
   * Get personalization recommendations
   */
  async getPersonalizationRecommendations(
    userId: string,
    context: InteractionContext,
    options: {
      count?: number
      diversity?: number
      exploration?: number
    } = {}
  ): Promise<Array<{
    entityId: string
    entityType: string
    score: number
    confidence: number
    reasoning: string[]
  }>> {
    try {
      const userPref = this.userPreferences.get(userId)
      if (!userPref) {
        return []
      }

      const { count = 10, diversity = 0.3, exploration = 0.1 } = options

      // Generate recommendations based on user preferences
      const recommendations = await this.generateRecommendations(
        userPref,
        context,
        count,
        diversity,
        exploration
      )

      return recommendations

    } catch (error) {
      logger.error('Error getting personalization recommendations', { error, userId })
      return []
    }
  }

  /**
   * Get personalization metrics
   */
  async getPersonalizationMetrics(userId?: string): Promise<PersonalizationMetrics> {
    try {
      if (userId) {
        // Get metrics for specific user
        const userPref = this.userPreferences.get(userId)
        const userData = this.learningData.get(userId) || []

        return this.calculateUserMetrics(userPref, userData)
      } else {
        // Get global metrics
        return this.calculateGlobalMetrics()
      }

    } catch (error) {
      logger.error('Error getting personalization metrics', { error, userId })
      throw new Error('Failed to get personalization metrics')
    }
  }

  /**
   * Retrain user model
   */
  async retrainUserModel(userId: string): Promise<void> {
    try {
      logger.info('Retraining user model', { userId })

      const userData = this.learningData.get(userId) || []
      if (userData.length < this.config.minInteractions) {
        throw new Error('Insufficient data for model retraining')
      }

      // Extract features from all user data
      const features = userData.flatMap(data => [
        ...data.interactions.map(i => this.featureExtractor.extractFeatures(i, data.context[0])),
        ...data.feedback.map(f => this.featureExtractor.extractFeedbackFeatures(f, data.context[0]))
      ])

      // Train new model
      const newModel = await this.trainModel(features)

      // Update user preference
      const userPref = this.userPreferences.get(userId)
      if (userPref) {
        userPref.model = newModel
        userPref.lastUpdated = new Date()
        userPref.version++
      }

      logger.info('User model retrained successfully', { userId, modelVersion: newModel })

    } catch (error) {
      logger.error('Error retraining user model', { error, userId })
      throw new Error('Failed to retrain user model')
    }
  }

  /**
   * Clean up old data
   */
  async cleanup(): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - this.config.maxHistory * 24 * 60 * 60 * 1000)

      // Clean up old learning data
      for (const [userId, userData] of this.learningData.entries()) {
        const filteredData = userData.filter(data => data.timestamp > cutoffDate)
        if (filteredData.length === 0) {
          this.learningData.delete(userId)
        } else {
          this.learningData.set(userId, filteredData)
        }
      }

      // Clean up inactive user preferences
      for (const [userId, userPref] of this.userPreferences.entries()) {
        const userData = this.learningData.get(userId)
        if (!userData || userData.length === 0) {
          // Remove preferences for inactive users
          this.userPreferences.delete(userId)
        }
      }

      logger.info('Preference learner cleanup completed')

    } catch (error) {
      logger.error('Error during cleanup', { error })
    }
  }

  // Private helper methods

  private storeInteractionData(
    userId: string,
    interaction: UserInteraction,
    context: InteractionContext
  ): void {
    if (!this.learningData.has(userId)) {
      this.learningData.set(userId, [])
    }

    const userData = this.learningData.get(userId)!
    const currentData = userData.find(data =>
      data.timestamp.toDateString() === new Date().toDateString()
    )

    if (currentData) {
      currentData.interactions.push(interaction)
      currentData.context.push(context)
    } else {
      userData.push({
        userId,
        interactions: [interaction],
        feedback: [],
        context: [context],
        timestamp: new Date()
      })
    }

    // Keep only recent data
    const cutoffDate = new Date(Date.now() - this.config.maxHistory * 24 * 60 * 60 * 1000)
    const filteredData = userData.filter(data => data.timestamp > cutoffDate)
    this.learningData.set(userId, filteredData)
  }

  private storeFeedbackData(
    userId: string,
    feedback: UserFeedback,
    context: InteractionContext
  ): void {
    if (!this.learningData.has(userId)) {
      this.learningData.set(userId, [])
    }

    const userData = this.learningData.get(userId)!
    const currentData = userData.find(data =>
      data.timestamp.toDateString() === new Date().toDateString()
    )

    if (currentData) {
      currentData.feedback.push(feedback)
    } else {
      userData.push({
        userId,
        interactions: [],
        feedback: [feedback],
        context: [context],
        timestamp: new Date()
      })
    }
  }

  private async updatePreferences(
    userId: string,
    features: Record<string, number>,
    outcome: 'positive' | 'negative' | 'neutral'
  ): Promise<void> {
    let userPref = this.userPreferences.get(userId)

    if (!userPref) {
      userPref = {
        userId,
        preferences: this.createDefaultPreferences(),
        model: this.initializeUserModel(),
        confidence: 0.5,
        lastUpdated: new Date(),
        version: 1
      }
    }

    // Update preferences based on features and outcome
    const updates = this.extractPreferenceUpdates(features, outcome)

    // Apply updates to preference profile
    userPref.preferences = this.applyPreferenceUpdates(userPref.preferences, updates)

    // Update confidence
    userPref.confidence = Math.min(1.0, userPref.confidence + 0.01)
    userPref.lastUpdated = new Date()
    userPref.version++

    this.userPreferences.set(userId, userPref)
  }

  private extractPreferenceUpdates(
    features: Record<string, number>,
    outcome: 'positive' | 'negative' | 'neutral'
  ): PreferenceUpdateData[] {
    const updates: PreferenceUpdateData[] = []

    // Extract preference updates from features
    Object.entries(features).forEach(([feature, value]) => {
      const update = this.mapFeatureToPreferenceUpdate(feature, value, outcome)
      if (update) {
        updates.push(update)
      }
    })

    return updates
  }

  private mapFeatureToPreferenceUpdate(
    feature: string,
    value: number,
    outcome: 'positive' | 'negative' | 'neutral'
  ): PreferenceUpdateData | null {
    // Map features to preference updates
    const weight = outcome === 'positive' ? value : outcome === 'negative' ? -value : 0
    const confidence = Math.abs(value)

    if (feature.startsWith('industry_')) {
      const industry = feature.replace('industry_', '')
      return {
        category: 'jobPreferences',
        field: 'industries',
        oldValue: null,
        newValue: { industry, weight },
        weight,
        confidence
      }
    }

    if (feature.startsWith('location_')) {
      const location = feature.replace('location_', '')
      return {
        category: 'jobPreferences',
        field: 'locations',
        oldValue: null,
        newValue: { location, weight },
        weight,
        confidence
      }
    }

    if (feature.startsWith('skill_')) {
      const skill = feature.replace('skill_', '')
      return {
        category: 'jobPreferences',
        field: 'skills',
        oldValue: null,
        newValue: { skill, weight, required: weight > 0.5 },
        weight,
        confidence
      }
    }

    // Add more mappings as needed
    return null
  }

  private applyPreferenceUpdates(
    preferences: PreferenceProfile,
    updates: PreferenceUpdateData[]
  ): PreferenceProfile {
    const updatedPreferences = { ...preferences }

    updates.forEach(update => {
      const category = updatedPreferences[update.category] as any

      if (Array.isArray(category[update.field])) {
        // Handle array fields like industries, locations, skills
        const existingItem = category[update.field].find((item: any) =>
          typeof item === 'object' && Object.values(item).includes(update.newValue)
        )

        if (existingItem) {
          // Update existing item
          Object.assign(existingItem, update.newValue)
        } else {
          // Add new item
          category[update.field].push(update.newValue)
        }
      } else {
        // Handle object fields
        Object.assign(category[update.field], update.newValue)
      }
    })

    // Apply decay to old preferences
    return this.applyPreferenceDecay(updatedPreferences)
  }

  private applyPreferenceDecay(preferences: PreferenceProfile): PreferenceProfile {
    const decayRate = this.config.decayRate

    // Apply decay to weights in array fields
    const applyDecayToArray = (arr: any[]) => {
      return arr.map(item => {
        if (typeof item === 'object' && item.weight !== undefined) {
          return { ...item, weight: item.weight * decayRate }
        }
        return item
      })
    }

    preferences.jobPreferences.industries = applyDecayToArray(preferences.jobPreferences.industries)
    preferences.jobPreferences.locations = applyDecayToArray(preferences.jobPreferences.locations)
    preferences.jobPreferences.skills = applyDecayToArray(preferences.jobPreferences.skills)
    preferences.jobPreferences.jobTypes = applyDecayToArray(preferences.jobPreferences.jobTypes)
    preferences.jobPreferences.benefits = applyDecayToArray(preferences.jobPreferences.benefits)

    return preferences
  }

  private createDefaultPreferences(): PreferenceProfile {
    return {
      jobPreferences: {
        industries: [],
        locations: [],
        salaryRange: { min: 0, max: 1000000, weight: 0.5 },
        remoteWork: { remote: false, weight: 0.5 },
        experienceLevel: { level: '', weight: 0.5 },
        jobTypes: [],
        companySize: { size: '', weight: 0.5 },
        skills: [],
        benefits: []
      },
      interactionPreferences: {
        preferredInteractionChannels: [
          { channel: 'email', weight: 0.7 },
          { channel: 'push', weight: 0.5 },
          { channel: 'in_app', weight: 0.8 }
        ],
        communicationFrequency: { frequency: 'weekly', weight: 0.5 },
        responseTimeExpectation: { expectation: 'within_day', weight: 0.5 },
        notificationTypes: [],
        contentFormat: { format: 'text', weight: 0.5 },
        languagePreference: { language: 'en', weight: 1.0 }
      },
      contentPreferences: {
        informationDepth: { depth: 'medium', weight: 0.5 },
        visualContent: { preference: true, weight: 0.6 },
        dataVisualization: { preference: true, weight: 0.5 },
        recommendationsFrequency: { frequency: 'daily', weight: 0.5 },
        learningStyle: { style: 'visual', weight: 0.5 },
        expertiseLevel: { level: 'intermediate', weight: 0.5 }
      },
      temporalPreferences: {
        activeHours: [
          { start: '09:00', end: '17:00', weight: 0.8 },
          { start: '18:00', end: '21:00', weight: 0.6 }
        ],
        preferredDays: [
          { day: 'monday', weight: 0.8 },
          { day: 'tuesday', weight: 0.8 },
          { day: 'wednesday', weight: 0.8 },
          { day: 'thursday', weight: 0.8 },
          { day: 'friday', weight: 0.8 }
        ],
        responsePatterns: [],
        seasonality: [],
        interactionCadence: { cadence: 'regular', weight: 0.5 }
      },
      contextualPreferences: {
        devicePreferences: [
          { device: 'desktop', weight: 0.6 },
          { device: 'mobile', weight: 0.4 }
        ],
        locationBasedPreferences: [],
        situationBasedPreferences: [],
        moodBasedPreferences: [],
        goalBasedPreferences: []
      }
    }
  }

  private initializeModel(): PreferenceModel {
    return {
      algorithm: this.config.algorithm,
      features: [],
      weights: {},
      hyperparameters: {
        learningRate: this.config.learningRate,
        regularization: this.config.regularization
      },
      performance: {
        accuracy: 0,
        precision: 0,
        recall: 0,
        f1Score: 0,
        trainingLoss: 0,
        validationLoss: 0,
        customMetrics: {}
      },
      lastTrained: new Date()
    }
  }

  private initializeUserModel(): PreferenceModel {
    return this.initializeModel()
  }

  private mergePreferences(
    existing: PreferenceProfile,
    updates: Partial<PreferenceProfile>
  ): PreferenceProfile {
    const merged = { ...existing }

    Object.entries(updates).forEach(([category, categoryUpdates]) => {
      if (typeof categoryUpdates === 'object' && categoryUpdates !== null) {
        merged[category as keyof PreferenceProfile] = {
          ...merged[category as keyof PreferenceProfile],
          ...categoryUpdates
        }
      }
    })

    return merged
  }

  private async generateRecommendations(
    userPref: UserPreference,
    context: InteractionContext,
    count: number,
    diversity: number,
    exploration: number
  ): Promise<Array<{
    entityId: string
    entityType: string
    score: number
    confidence: number
    reasoning: string[]
  }>> {
    // This is a simplified implementation
    // In a real system, you would use the trained model to generate recommendations

    const recommendations = []
    const reasoning = ['Based on job preferences', 'Similar users liked this', 'Matches your skills']

    for (let i = 0; i < count; i++) {
      recommendations.push({
        entityId: `entity-${i + 1}`,
        entityType: 'job',
        score: Math.random() * 0.5 + 0.5, // 0.5-1.0
        confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0
        reasoning: reasoning.slice(0, Math.floor(Math.random() * 3) + 1)
      })
    }

    return recommendations.sort((a, b) => b.score - a.score)
  }

  private calculateUserMetrics(userPref: UserPreference | undefined, userData: LearningData[]): PersonalizationMetrics {
    if (!userPref || userData.length === 0) {
      return {
        accuracy: 0,
        clickThroughRate: 0,
        conversionRate: 0,
        userSatisfaction: 0,
        engagementTime: 0,
        retentionRate: 0,
        personalizationScore: 0
      }
    }

    // Calculate metrics from user data
    const interactions = userData.flatMap(d => d.interactions)
    const feedback = userData.flatMap(d => d.feedback)

    const positiveInteractions = interactions.filter(i => i.outcome === 'positive').length
    const clickThroughRate = interactions.length > 0 ? positiveInteractions / interactions.length : 0

    const positiveFeedback = feedback.filter(f => f.sentiment === 'positive').length
    const userSatisfaction = feedback.length > 0 ? positiveFeedback / feedback.length : 0

    const totalEngagementTime = interactions.reduce((sum, i) => sum + (i.duration || 0), 0)
    const averageEngagementTime = interactions.length > 0 ? totalEngagementTime / interactions.length : 0

    return {
      accuracy: userPref.model.performance.accuracy,
      clickThroughRate: Math.round(clickThroughRate * 100) / 100,
      conversionRate: Math.round(clickThroughRate * 0.3 * 100) / 100, // Estimate
      userSatisfaction: Math.round(userSatisfaction * 100) / 100,
      engagementTime: averageEngagementTime,
      retentionRate: 0.8, // Placeholder
      personalizationScore: Math.round(userPref.confidence * 100) / 100
    }
  }

  private calculateGlobalMetrics(): PersonalizationMetrics {
    const allUserPrefs = Array.from(this.userPreferences.values())

    if (allUserPrefs.length === 0) {
      return {
        accuracy: 0,
        clickThroughRate: 0,
        conversionRate: 0,
        userSatisfaction: 0,
        engagementTime: 0,
        retentionRate: 0,
        personalizationScore: 0
      }
    }

    const totalAccuracy = allUserPrefs.reduce((sum, pref) => sum + pref.model.performance.accuracy, 0)
    const totalConfidence = allUserPrefs.reduce((sum, pref) => sum + pref.confidence, 0)

    return {
      accuracy: Math.round((totalAccuracy / allUserPrefs.length) * 100) / 100,
      clickThroughRate: 0.65, // Placeholder
      conversionRate: 0.25, // Placeholder
      userSatisfaction: 0.75, // Placeholder
      engagementTime: 300, // Placeholder
      retentionRate: 0.8, // Placeholder
      personalizationScore: Math.round((totalConfidence / allUserPrefs.length) * 100) / 100
    }
  }

  private async trainModel(features: Record<string, number>[]): Promise<PreferenceModel> {
    // This is a simplified implementation
    // In a real system, you would use actual machine learning algorithms

    const model = this.initializeModel()
    model.features = Object.keys(features)
    model.lastTrained = new Date()

    // Simulate training performance
    model.performance = {
      accuracy: 0.85,
      precision: 0.82,
      recall: 0.88,
      f1Score: 0.85,
      trainingLoss: 0.15,
      validationLoss: 0.18,
      customMetrics: {}
    }

    return model
  }

  private async updateGlobalModel(): Promise<void> {
    // Update global model based on all user data
    logger.debug('Updating global model')
    // Implementation would depend on the chosen algorithm
  }
}

class FeatureExtractor {
  extractFeatures(interaction: UserInteraction, context: InteractionContext): Record<string, number> {
    const features: Record<string, number> = {}

    // Interaction features
    features[`interaction_${interaction.type}`] = interaction.value
    features[`entity_${interaction.entityType}`] = 1

    // Temporal features
    const hour = interaction.timestamp.getHours()
    features[`time_${hour}`] = 1

    // Context features
    features[`device_${context.device}`] = 1
    if (context.location) {
      features[`location_${context.location}`] = 1
    }

    return features
  }

  extractFeedbackFeatures(feedback: UserFeedback, context: InteractionContext): Record<string, number> {
    const features: Record<string, number> = {}

    // Feedback features
    features[`feedback_${feedback.category}`] = feedback.rating / 5 // Normalize to 0-1
    features[`sentiment_${feedback.sentiment}`] = feedback.sentiment === 'positive' ? 1 : -1

    // Context features
    features[`feedback_device_${context.device}`] = 1

    return features
  }
}

export default PreferenceLearner