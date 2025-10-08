import { Logger } from '@/lib/logger';
import { AgentConfiguration, AgentType, AgentCapabilities, ModelConfiguration, BehaviorSettings } from '@/types/agents';

export class AgentConfigManager {
  private logger: Logger;
  private configurations: Map<string, AgentConfiguration> = new Map();

  constructor() {
    this.logger = new Logger('AgentConfigManager');
  }

  /**
   * Create default configuration for an agent type
   */
  createDefaultConfiguration(agentType: AgentType, agentId: string): AgentConfiguration {
    const capabilities = this.getDefaultCapabilities(agentType);
    const modelConfig = this.getDefaultModelConfiguration(agentType);
    const behaviorSettings = this.getDefaultBehaviorSettings(agentType);

    return {
      agentId,
      agentType,
      name: this.getDefaultName(agentType),
      description: this.getDefaultDescription(agentType),
      capabilities,
      modelConfig,
      behaviorSettings,
      integrations: this.getDefaultIntegrations(agentType),
      version: '1.0.0',
      isActive: true
    };
  }

  /**
   * Load configuration from environment or database
   */
  async loadConfiguration(agentId: string): Promise<AgentConfiguration | null> {
    try {
      // In a real implementation, this would load from database or config files
      // For now, return cached configuration or create default

      let config = this.configurations.get(agentId);

      if (!config) {
        // Try to load from environment variables
        config = this.loadFromEnvironment(agentId);

        if (config) {
          this.configurations.set(agentId, config);
        }
      }

      return config || null;

    } catch (error) {
      this.logger.error(`Error loading configuration for agent ${agentId}:`, error);
      return null;
    }
  }

  /**
   * Save configuration to storage
   */
  async saveConfiguration(config: AgentConfiguration): Promise<void> {
    try {
      this.configurations.set(config.agentId, config);

      // In a real implementation, this would save to database
      this.logger.info(`Configuration saved for agent ${config.agentId}`);

    } catch (error) {
      this.logger.error(`Error saving configuration for agent ${config.agentId}:`, error);
      throw error;
    }
  }

  /**
   * Update configuration
   */
  async updateConfiguration(
    agentId: string,
    updates: Partial<AgentConfiguration>
  ): Promise<AgentConfiguration> {
    const existingConfig = await this.loadConfiguration(agentId);
    if (!existingConfig) {
      throw new Error(`Configuration not found for agent ${agentId}`);
    }

    const updatedConfig: AgentConfiguration = {
      ...existingConfig,
      ...updates,
      version: this.incrementVersion(existingConfig.version)
    };

    await this.saveConfiguration(updatedConfig);
    return updatedConfig;
  }

  /**
   * Validate configuration
   */
  validateConfiguration(config: AgentConfiguration): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate required fields
    if (!config.agentId) {
      errors.push('Agent ID is required');
    }

    if (!config.agentType) {
      errors.push('Agent type is required');
    }

    if (!config.name) {
      errors.push('Agent name is required');
    }

    if (!config.capabilities) {
      errors.push('Agent capabilities are required');
    }

    if (!config.modelConfig) {
      errors.push('Model configuration is required');
    }

    // Validate capabilities
    if (config.capabilities) {
      if (!config.capabilities.supportedIntents || config.capabilities.supportedIntents.length === 0) {
        errors.push('At least one supported intent is required');
      }

      if (!config.capabilities.maxConcurrency || config.capabilities.maxConcurrency <= 0) {
        errors.push('Max concurrency must be greater than 0');
      }

      if (config.capabilities.averageResponseTime < 0) {
        errors.push('Average response time cannot be negative');
      }
    }

    // Validate model configuration
    if (config.modelConfig) {
      if (!config.modelConfig.primaryModel) {
        errors.push('Primary model is required');
      }

      if (config.modelConfig.temperature < 0 || config.modelConfig.temperature > 2) {
        errors.push('Temperature must be between 0 and 2');
      }

      if (config.modelConfig.maxTokens <= 0) {
        errors.push('Max tokens must be greater than 0');
      }
    }

    // Validate behavior settings
    if (config.behaviorSettings) {
      const validPersonalities = ['professional', 'friendly', 'casual', 'formal'];
      if (config.behaviorSettings.personality &&
          !validPersonalities.includes(config.behaviorSettings.personality)) {
        errors.push(`Personality must be one of: ${validPersonalities.join(', ')}`);
      }

      const validResponseStyles = ['concise', 'detailed', 'comprehensive'];
      if (config.behaviorSettings.responseStyle &&
          !validResponseStyles.includes(config.behaviorSettings.responseStyle)) {
        errors.push(`Response style must be one of: ${validResponseStyles.join(', ')}`);
      }

      const validProactivity = ['reactive', 'moderate', 'proactive'];
      if (config.behaviorSettings.proactivity &&
          !validProactivity.includes(config.behaviorSettings.proactivity)) {
        errors.push(`Proactivity must be one of: ${validProactivity.join(', ')}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get default capabilities for agent type
   */
  private getDefaultCapabilities(agentType: AgentType): AgentCapabilities {
    const capabilityMap: Record<AgentType, AgentCapabilities> = {
      [AgentType.CAREER_GUIDANCE]: {
        supportedIntents: ['career_guidance', 'skill_analysis', 'market_intelligence'],
        primaryIntents: ['career_guidance'],
        maxConcurrency: 10,
        averageResponseTime: 2000,
        supportedLanguages: ['en'],
        supportsVoice: true,
        supportsFileUpload: true,
        features: ['career_path_analysis', 'skill_gap_identification', 'market_trends']
      },
      [AgentType.INTERVIEW_PREPARATION]: {
        supportedIntents: ['mock_interview', 'interview_preparation'],
        primaryIntents: ['mock_interview'],
        maxConcurrency: 5,
        averageResponseTime: 3000,
        supportedLanguages: ['en'],
        supportsVoice: true,
        supportsFileUpload: true,
        features: ['mock_interviews', 'answer_optimization', 'speech_analysis']
      },
      [AgentType.APPLICATION_ASSISTANT]: {
        supportedIntents: ['application_optimization', 'application_tracking', 'application_assistance'],
        primaryIntents: ['application_optimization'],
        maxConcurrency: 8,
        averageResponseTime: 2500,
        supportedLanguages: ['en'],
        supportsVoice: false,
        supportsFileUpload: true,
        features: ['resume_optimization', 'ats_optimization', 'application_tracking']
      },
      [AgentType.EMPLOYER_ASSISTANT]: {
        supportedIntents: ['candidate_screening', 'job_posting_optimization', 'employer_assistance'],
        primaryIntents: ['candidate_screening'],
        maxConcurrency: 6,
        averageResponseTime: 2200,
        supportedLanguages: ['en'],
        supportsVoice: false,
        supportsFileUpload: true,
        features: ['resume_screening', 'candidate_ranking', 'job_posting_optimization']
      },
      [AgentType.NETWORKING_ASSISTANT]: {
        supportedIntents: ['connection_recommendations', 'networking_assistance'],
        primaryIntents: ['connection_recommendations'],
        maxConcurrency: 4,
        averageResponseTime: 1800,
        supportedLanguages: ['en'],
        supportsVoice: false,
        supportsFileUpload: false,
        features: ['network_analysis', 'connection_recommendations', 'conversation_starters']
      }
    };

    return capabilityMap[agentType] || {
      supportedIntents: ['general_assistance'],
      primaryIntents: ['general_assistance'],
      maxConcurrency: 5,
      averageResponseTime: 2000,
      supportedLanguages: ['en'],
      supportsVoice: false,
      supportsFileUpload: false,
      features: ['general_assistance']
    };
  }

  /**
   * Get default model configuration for agent type
   */
  private getDefaultModelConfiguration(agentType: AgentType): ModelConfiguration {
    const modelMap: Record<AgentType, ModelConfiguration> = {
      [AgentType.CAREER_GUIDANCE]: {
        primaryModel: 'gpt-4',
        fallbackModels: ['claude-3-sonnet-20240229', 'gemini-pro'],
        temperature: 0.7,
        maxTokens: 2000,
        systemPrompt: this.getSystemPrompt('career_guidance'),
        responseFormat: 'text',
        tools: []
      },
      [AgentType.INTERVIEW_PREPARATION]: {
        primaryModel: 'gpt-4',
        fallbackModels: ['claude-3-sonnet-20240229', 'gemini-pro'],
        temperature: 0.6,
        maxTokens: 1500,
        systemPrompt: this.getSystemPrompt('interview_preparation'),
        responseFormat: 'text',
        tools: []
      },
      [AgentType.APPLICATION_ASSISTANT]: {
        primaryModel: 'gpt-4',
        fallbackModels: ['claude-3-sonnet-20240229', 'gemini-pro'],
        temperature: 0.5,
        maxTokens: 2500,
        systemPrompt: this.getSystemPrompt('application_assistant'),
        responseFormat: 'text',
        tools: []
      },
      [AgentType.EMPLOYER_ASSISTANT]: {
        primaryModel: 'gpt-4',
        fallbackModels: ['claude-3-sonnet-20240229', 'gemini-pro'],
        temperature: 0.4,
        maxTokens: 2000,
        systemPrompt: this.getSystemPrompt('employer_assistant'),
        responseFormat: 'text',
        tools: []
      },
      [AgentType.NETWORKING_ASSISTANT]: {
        primaryModel: 'gpt-3.5-turbo',
        fallbackModels: ['claude-3-haiku-20240307', 'gemini-1.5-flash'],
        temperature: 0.8,
        maxTokens: 1000,
        systemPrompt: this.getSystemPrompt('networking_assistant'),
        responseFormat: 'text',
        tools: []
      }
    };

    return modelMap[agentType] || {
      primaryModel: 'gpt-3.5-turbo',
      fallbackModels: ['claude-3-haiku-20240307'],
      temperature: 0.7,
      maxTokens: 1000,
      systemPrompt: 'You are a helpful AI assistant.',
      responseFormat: 'text',
      tools: []
    };
  }

  /**
   * Get default behavior settings for agent type
   */
  private getDefaultBehaviorSettings(agentType: AgentType): BehaviorSettings {
    const behaviorMap: Record<AgentType, BehaviorSettings> = {
      [AgentType.CAREER_GUIDANCE]: {
        personality: 'professional',
        responseStyle: 'detailed',
        proactivity: 'moderate',
        followUpEnabled: true,
        suggestionEnabled: true,
        learningEnabled: true
      },
      [AgentType.INTERVIEW_PREPARATION]: {
        personality: 'friendly',
        responseStyle: 'comprehensive',
        proactivity: 'proactive',
        followUpEnabled: true,
        suggestionEnabled: true,
        learningEnabled: true
      },
      [AgentType.APPLICATION_ASSISTANT]: {
        personality: 'professional',
        responseStyle: 'detailed',
        proactivity: 'moderate',
        followUpEnabled: true,
        suggestionEnabled: true,
        learningEnabled: false
      },
      [AgentType.EMPLOYER_ASSISTANT]: {
        personality: 'professional',
        responseStyle: 'concise',
        proactivity: 'reactive',
        followUpEnabled: false,
        suggestionEnabled: true,
        learningEnabled: true
      },
      [AgentType.NETWORKING_ASSISTANT]: {
        personality: 'friendly',
        responseStyle: 'detailed',
        proactivity: 'proactive',
        followUpEnabled: true,
        suggestionEnabled: true,
        learningEnabled: true
      }
    };

    return behaviorMap[agentType] || {
      personality: 'friendly',
      responseStyle: 'detailed',
      proactivity: 'moderate',
      followUpEnabled: true,
      suggestionEnabled: true,
      learningEnabled: true
    };
  }

  /**
   * Get default integrations for agent type
   */
  private getDefaultIntegrations(agentType: AgentType): string[] {
    const integrationMap: Record<AgentType, string[]> = {
      [AgentType.CAREER_GUIDANCE]: ['linkedin', 'github', 'learning_platforms'],
      [AgentType.INTERVIEW_PREPARATION]: ['speech_to_text', 'text_to_speech', 'calendar'],
      [AgentType.APPLICATION_ASSISTANT]: ['resume_parser', 'ats_systems', 'job_boards'],
      [AgentType.EMPLOYER_ASSISTANT]: ['ats_systems', 'resume_parser', 'calendar'],
      [AgentType.NETWORKING_ASSISTANT]: ['linkedin', 'twitter', 'email']
    };

    return integrationMap[agentType] || [];
  }

  /**
   * Get default name for agent type
   */
  private getDefaultName(agentType: AgentType): string {
    const nameMap: Record<AgentType, string> = {
      [AgentType.CAREER_GUIDANCE]: 'Career Guidance Agent',
      [AgentType.INTERVIEW_PREPARATION]: 'Interview Preparation Agent',
      [AgentType.APPLICATION_ASSISTANT]: 'Application Assistant Agent',
      [AgentType.EMPLOYER_ASSISTANT]: 'Employer Assistant Agent',
      [AgentType.NETWORKING_ASSISTANT]: 'Networking Assistant Agent'
    };

    return nameMap[agentType] || 'AI Agent';
  }

  /**
   * Get default description for agent type
   */
  private getDefaultDescription(agentType: AgentType): string {
    const descriptionMap: Record<AgentType, string> = {
      [AgentType.CAREER_GUIDANCE]: 'Provides personalized career advice, skill analysis, and market intelligence',
      [AgentType.INTERVIEW_PREPARATION]: 'Helps users prepare for interviews through practice sessions and optimization',
      [AgentType.APPLICATION_ASSISTANT]: 'Assists with job application optimization and tracking',
      [AgentType.EMPLOYER_ASSISTANT]: 'Helps employers with candidate screening and job posting optimization',
      [AgentType.NETWORKING_ASSISTANT]: 'Provides networking recommendations and professional connection assistance'
    };

    return descriptionMap[agentType] || 'AI-powered assistant for job seekers and employers';
  }

  /**
   * Get system prompt for agent type
   */
  private getSystemPrompt(agentType: string): string {
    const promptMap: Record<string, string> = {
      'career_guidance': `You are a Career Guidance Agent, an expert career counselor and coach.
Your role is to provide personalized career advice, help users identify their skills and career paths,
and offer insights about job market trends. Be encouraging, professional, and provide actionable advice.
Always consider the user's background, goals, and current market conditions in your responses.`,

      'interview_preparation': `You are an Interview Preparation Agent, an expert interview coach.
Your role is to help users prepare for job interviews through mock interviews, feedback, and optimization tips.
Be supportive, constructive, and provide specific, actionable advice. Focus on both technical and behavioral
interview skills, and help users build confidence.`,

      'application_assistant': `You are an Application Assistant Agent, an expert in job applications and resume optimization.
Your role is to help users optimize their job applications, improve their resumes and cover letters, and track their application progress.
Be detail-oriented, professional, and provide specific guidance on ATS optimization and application best practices.`,

      'employer_assistant': `You are an Employer Assistant Agent, an expert in recruitment and hiring.
Your role is to help employers with candidate screening, job posting optimization, and interview coordination.
Be professional, efficient, and focus on finding the best candidates while maintaining fair and unbiased hiring practices.`,

      'networking_assistant': `You are a Networking Assistant Agent, an expert in professional networking and relationship building.
Your role is to help users build and maintain professional networks, identify networking opportunities, and provide guidance on professional communication.
Be personable, strategic, and focus on building authentic and valuable professional relationships.`
    };

    return promptMap[agentType] || 'You are a helpful AI assistant.';
  }

  /**
   * Load configuration from environment variables
   */
  private loadFromEnvironment(agentId: string): AgentConfiguration | null {
    // In a real implementation, this would read from environment variables
    // For now, return null to indicate no environment config
    return null;
  }

  /**
   * Increment version number
   */
  private incrementVersion(version: string): string {
    const parts = version.split('.');
    if (parts.length !== 3) {
      return '1.0.1';
    }

    const patch = parseInt(parts[2]) + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  }

  /**
   * Get all cached configurations
   */
  getAllConfigurations(): AgentConfiguration[] {
    return Array.from(this.configurations.values());
  }

  /**
   * Clear configuration cache
   */
  clearCache(): void {
    this.configurations.clear();
  }
}