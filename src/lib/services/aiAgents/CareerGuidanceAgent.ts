import { BaseAgent, AgentContext, AgentResponse, AgentCapability } from './AIAgentFramework';
import { prisma } from '@/lib/prisma';

interface CareerPath {
  id: string;
  title: string;
  description: string;
  category: string;
  requiredSkills: string[];
  avgSalary: {
    min: number;
    max: number;
    median: number;
  };
  growthRate: number;
  demandLevel: 'low' | 'medium' | 'high' | 'very_high';
  timeToTransition: string;
  nextSteps: string[];
  marketTrends: string[];
}

interface SkillGap {
  skill: string;
  currentLevel: number;
  requiredLevel: number;
  importance: 'critical' | 'important' | 'nice_to_have';
  priority: number;
  resources: Array<{
    type: 'course' | 'certification' | 'book' | 'article' | 'video' | 'project';
    title: string;
    provider: string;
    duration: string;
    cost: number;
    url?: string;
    description: string;
  }>;
}

interface MarketInsight {
  category: 'salary' | 'demand' | 'growth' | 'skills' | 'locations' | 'companies';
  title: string;
  description: string;
  data: any;
  timeframe: string;
  confidence: number;
  source: string;
}

interface CareerAnalysis {
  currentSituation: {
    title: string;
    industry: string;
    experience: number;
    skills: string[];
    education: string;
    location: string;
    salary: number;
  };
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  recommendedPaths: CareerPath[];
  skillGaps: SkillGap[];
  marketInsights: MarketInsight[];
  actionPlan: Array<{
    phase: string;
    timeline: string;
    actions: string[];
    resources: any[];
  }>;
}

export class CareerGuidanceAgent extends BaseAgent {
  constructor() {
    super({
      agentType: 'career-guidance',
      systemPrompt: `You are a Career Guidance AI Assistant, an expert career coach with deep knowledge of job markets, industry trends, and career development strategies. You provide personalized, actionable career advice based on individual profiles, market conditions, and emerging opportunities.

Your key responsibilities:
1. Analyze user profiles and career trajectories
2. Identify skill gaps and recommend learning paths
3. Provide market intelligence and salary insights
4. Suggest career transitions and progression plans
5. Offer unbiased, data-driven recommendations

Always consider:
- Current market trends and future projections
- Industry growth potential and stability
- Salary expectations and negotiation strategies
- Work-life balance and personal fulfillment
- Regional market conditions
- Skill transferability and future-proofing

Provide structured, actionable advice with specific examples and timelines. Be encouraging but realistic about challenges and requirements.`,
      capabilities: [
        {
          id: 'career-analysis',
          name: 'Career Path Analysis',
          description: 'Analyze user profile and recommend suitable career paths',
          category: 'analysis',
          enabled: true,
          confidence: 0.9,
          requiredData: ['profile', 'skills', 'experience'],
          outputFormat: 'structured',
          maxTokens: 2000,
          temperature: 0.7
        },
        {
          id: 'skill-gap-analysis',
          name: 'Skill Gap Analysis',
          description: 'Identify skill gaps and recommend learning resources',
          category: 'analysis',
          enabled: true,
          confidence: 0.85,
          requiredData: ['currentSkills', 'targetRole'],
          outputFormat: 'structured',
          maxTokens: 1500,
          temperature: 0.6
        },
        {
          id: 'market-intelligence',
          name: 'Market Intelligence',
          description: 'Provide market insights and trends',
          category: 'analysis',
          enabled: true,
          confidence: 0.8,
          requiredData: ['jobType', 'location', 'experience'],
          outputFormat: 'structured',
          maxTokens: 1500,
          temperature: 0.5
        },
        {
          id: 'career-planning',
          name: 'Career Planning',
          description: 'Create detailed career development plans',
          category: 'planning',
          enabled: true,
          confidence: 0.9,
          requiredData: ['goals', 'timeline', 'preferences'],
          outputFormat: 'structured',
          maxTokens: 2000,
          temperature: 0.7
        },
        {
          id: 'salary-analysis',
          name: 'Salary Analysis',
          description: 'Analyze salary data and negotiation strategies',
          category: 'analysis',
          enabled: true,
          confidence: 0.85,
          requiredData: ['role', 'experience', 'location'],
          outputFormat: 'structured',
          maxTokens: 1000,
          temperature: 0.4
        }
      ]
    });
  }

  async processMessage(
    message: string,
    context: AgentContext
  ): Promise<AgentResponse> {
    const startTime = Date.now();

    try {
      // Determine the type of analysis needed
      const analysisType = this.determineAnalysisType(message, context);

      // Build context-aware messages
      const messages = this.buildMessages(message, context);

      // Add analysis-specific system prompt
      messages.unshift({
        role: 'system',
        content: `${this.systemPrompt}\n\nCurrent Analysis Type: ${analysisType}\nUser's Current Situation: ${this.formatUserContext(context)}`
      });

      // Get LLM response
      const llmResponse = await this.callLLM(messages, {
        temperature: this.getTemperatureForAnalysis(analysisType),
        maxTokens: this.getMaxTokensForAnalysis(analysisType)
      });

      // Parse and structure the response
      const analysisResult = await this.parseAnalysisResponse(llmResponse.content, analysisType);

      // Generate follow-up questions
      const followUpQuestions = this.generateFollowUpQuestions(context, llmResponse.content);

      // Create structured response
      const response = this.formatResponse(
        llmResponse.content,
        context,
        llmResponse.usage ? (1 - llmResponse.usage.completion_tokens / llmResponse.usage.prompt_tokens) : 0.8,
        analysisResult,
        this.generateActions(analysisResult, context),
        followUpQuestions,
        {
          analysisType,
          estimatedTokens: this.getEstimatedTokens(message),
          processingTime: Date.now() - startTime,
          modelUsed: this.modelConfig.model
        }
      );

      return response;

    } catch (error) {
      console.error('Error in CareerGuidanceAgent.processMessage:', error);
      throw error;
    }
  }

  private determineAnalysisType(message: string, context: AgentContext): string {
    const messageLower = message.toLowerCase();

    // Check for specific keywords and context
    if (messageLower.includes('salary') || messageLower.includes('pay') || messageLower.includes('compensation')) {
      return 'salary-analysis';
    }

    if (messageLower.includes('skill') || messageLower.includes('learn') || messageLower.includes('training')) {
      return 'skill-gap-analysis';
    }

    if (messageLower.includes('market') || messageLower.includes('trend') || messageLower.includes('demand')) {
      return 'market-intelligence';
    }

    if (messageLower.includes('plan') || messageLower.includes('timeline') || messageLower.includes('goal')) {
      return 'career-planning';
    }

    if (messageLower.includes('path') || messageLower.includes('career') || messageLower.includes('transition')) {
      return 'career-analysis';
    }

    // Default to career analysis
    return 'career-analysis';
  }

  private formatUserContext(context: AgentContext): string {
    const parts = [];

    if (context.userProfile) {
      const profile = context.userProfile;
      parts.push(`Current Title: ${profile.title || 'Not specified'}`);
      parts.push(`Industry: ${profile.industry || 'Not specified'}`);
      parts.push(`Experience: ${profile.experience || 'Not specified'} years`);
      parts.push(`Location: ${profile.location || 'Not specified'}`);
    }

    if (context.currentJob) {
      parts.push(`Current Job: ${context.currentJob.title || 'Not specified'}`);
    }

    return parts.join(' | ');
  }

  private getTemperatureForAnalysis(analysisType: string): number {
    const temperatures = {
      'career-analysis': 0.7,
      'skill-gap-analysis': 0.6,
      'market-intelligence': 0.5,
      'career-planning': 0.7,
      'salary-analysis': 0.4
    };

    return temperatures[analysisType] || this.modelConfig.temperature;
  }

  private getMaxTokensForAnalysis(analysisType: string): number {
    const tokens = {
      'career-analysis': 2000,
      'skill-gap-analysis': 1500,
      'market-intelligence': 1500,
      'career-planning': 2000,
      'salary-analysis': 1000
    };

    return tokens[analysisType] || this.modelConfig.maxTokens;
  }

  private async parseAnalysisResponse(response: string, analysisType: string): Promise<any> {
    try {
      // Try to parse as JSON first
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }

      // Fallback to structured parsing based on analysis type
      switch (analysisType) {
        case 'career-analysis':
          return this.parseCareerAnalysis(response);
        case 'skill-gap-analysis':
          return this.parseSkillGapAnalysis(response);
        case 'market-intelligence':
          return this.parseMarketIntelligence(response);
        case 'career-planning':
          return this.parseCareerPlanning(response);
        case 'salary-analysis':
          return this.parseSalaryAnalysis(response);
        default:
          return { type: analysisType, content: response };
      }
    } catch (error) {
      console.error('Error parsing analysis response:', error);
      return { type: analysisType, content: response };
    }
  }

  private parseCareerAnalysis(response: string): Partial<CareerAnalysis> {
    const analysis: Partial<CareerAnalysis> = {
      currentSituation: this.extractCurrentSituation(response),
      strengths: this.extractListItems(response, 'strengths?'),
      weaknesses: this.extractListItems(response, 'weakness|weaknesses?'),
      opportunities: this.extractListItems(response, 'opportunities?'),
      threats: this.extractListItems(response, 'threats?'),
      recommendedPaths: this.extractCareerPaths(response),
      skillGaps: this.extractSkillGaps(response),
      marketInsights: this.extractMarketInsights(response),
      actionPlan: this.extractActionPlan(response)
    };

    return analysis;
  }

  private parseSkillGapAnalysis(response: string): {
    skillGaps: SkillGap[];
    priorityAreas: string[];
    timeline: string;
  } {
    return {
      skillGaps: this.extractSkillGaps(response),
      priorityAreas: this.extractListItems(response, 'priority|important'),
      timeline: this.extractTimeline(response)
    };
  }

  private parseMarketIntelligence(response: string): {
    insights: MarketInsight[];
    trends: string[];
    recommendations: string[];
  } {
    return {
      insights: this.extractMarketInsights(response),
      trends: this.extractListItems(response, 'trends?'),
      recommendations: this.extractListItems(response, 'recommendations?')
    };
  }

  private parseCareerPlanning(response: string): {
    plan: Array<{
      phase: string;
      timeline: string;
      actions: string[];
    }>;
    milestones: string[];
    successMetrics: string[];
  } {
    return {
      plan: this.extractActionPlan(response),
      milestones: this.extractListItems(response, 'milestones?'),
      successMetrics: this.extractListItems(response, 'metrics?|success')
    };
  }

  private parseSalaryAnalysis(response: string): {
    currentSalary?: number;
    marketRates: Array<{
      role: string;
      min: number;
      max: number;
      median: number;
      location: string;
    }>;
    negotiationStrategy: string[];
    recommendations: string[];
  } {
    return {
      currentSalary: this.extractSalary(response),
      marketRates: this.extractMarketRates(response),
      negotiationStrategy: this.extractListItems(response, 'negotiation'),
      recommendations: this.extractListItems(response, 'recommend')
    };
  }

  private extractCurrentSituation(response: string) {
    // Simple extraction - in production, use more sophisticated parsing
    const situation = {
      title: this.extractFieldValue(response, 'Current Title'),
      industry: this.extractFieldValue(response, 'Industry'),
      experience: this.extractFieldValue(response, 'Experience')
    };

    return situation;
  }

  private extractListItems(response: string, pattern: string): string[] {
    const regex = new RegExp(pattern + '\\s*[:\\-]\\s*(.+?)(?=\\n|$)', 'gi');
    const items = [];
    let match;

    while ((match = regex.exec(response)) !== null) {
      const item = match[1].trim().replace(/^[-*]\s*/, '');
      if (item && item !== 'None' && item !== 'N/A') {
        items.push(item);
      }
    }

    return items;
  }

  private extractCareerPaths(response: string): CareerPath[] {
    const paths: CareerPath[] = [];
    const pathPattern = /(?:Recommended|Suggested)\s*(?:Career\s*)?Paths?:\s*[:\\-]\s*(.+?)(?=\n|$|Recommended)/gi;

    let match;
    while ((match = pathPattern.exec(response)) !== null) {
      const pathText = match[1].trim();
      if (pathText && pathText.toLowerCase() !== 'none') {
        paths.push({
          id: `path-${Date.now()}-${paths.length}`,
          title: pathText,
          description: '',
          category: 'general',
          requiredSkills: [],
          avgSalary: { min: 0, max: 0, median: 0 },
          growthRate: 0,
          demandLevel: 'medium',
          timeToTransition: '6-12 months',
          nextSteps: [],
          marketTrends: []
        });
      }
    }

    return paths;
  }

  private extractSkillGaps(response: string): SkillGap[] {
    const gaps: SkillGap[] = [];
    const gapPattern = /Skill\s*Gaps?\s*[:\\-]\s*(.+?)(?=\n|$)/gi;

    let match;
    while ((match = gapPattern.exec(response)) !== null) {
      const gapText = match[1].trim();
      if (gapText && gapText.toLowerCase() !== 'none') {
        gaps.push({
          skill: gapText,
          currentLevel: 0,
          requiredLevel: 5,
          importance: 'important',
          priority: 1,
          resources: []
        });
      }
    }

    return gaps;
  }

  private extractMarketInsights(response: string): MarketInsight[] {
    const insights: MarketInsight[] = [];
    const insightPattern = /(?:Market\s*)?Insights?\s*[:\\-]\s*(.+?)(?=\n|$)/gi;

    let match;
    while ((match = insightPattern.exec(response)) !== null) {
      const insightText = match[1].trim();
      if (insightText && insightText.toLowerCase() !== 'none') {
        insights.push({
          category: 'general',
          title: insightText,
          description: insightText,
          data: {},
          timeframe: 'current',
          confidence: 0.8,
          source: 'ai_analysis'
        });
      }
    }

    return insights;
  }

  private extractActionPlan(response: string): Array<{
    phase: string;
    timeline: string;
    actions: string[];
  }> {
    const plans = [];
    const phasePattern = /Phase\s*\d+\s*[:\\-]\s*(.+?)\n\s*Timeline:\s*(.+?)\n\s*Actions:\s*(.+?)(?=\n\n|\nPhase|$)/gi;

    let match;
    while ((match = phasePattern.exec(response)) !== null) {
      const phase = match[1].trim();
      const timeline = match[2].trim();
      const actionsText = match[3].trim();

      const actions = actionsText.split('\n')
        .map(action => action.replace(/^[-*]\s*/, '').trim())
        .filter(action => action.length > 0);

      plans.push({
        phase,
        timeline,
        actions
      });
    }

    return plans;
  }

  private extractFieldValue(response: string, field: string): string {
    const pattern = new RegExp(`${field}\\s*[:\\-]\\s*([^\n]+)`, 'i');
    const match = response.match(pattern);
    return match ? match[1].trim() : '';
  }

  private extractSalary(response: string): number | undefined {
    const salaryPattern = /\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(?:k|m|hour|year|yr)/gi;
    const match = response.match(salaryPattern);
    if (!match) return undefined;

    const salary = parseFloat(match[0].replace(/[^0-9.]/g, ''));
    const multiplier = match[0].toLowerCase().includes('k') ? 1000 :
                     match[0].toLowerCase().includes('m') ? 1000000 :
                     match[0].toLowerCase().includes('hour') ? 1 :
                     match[0].toLowerCase().includes('year') || match[0].toLowerCase().includes('yr') ? 2080 : 1;

    return salary * multiplier;
  }

  private extractMarketRates(response: string): Array<{
    role: string;
    min: number;
    max: number;
    median: number;
    location: string;
  }> {
    const rates = [];
    const ratePattern = /\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*-\s*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*\(([^)]+)\)/gi;

    let match;
    while ((match = ratePattern.exec(response)) !== null) {
      const min = parseFloat(match[1].replace(/[^0-9.]/g, ''));
      const max = parseFloat(match[2].replace(/[^0-9.]/g, ''));
      const location = match[3];

      rates.push({
        role: 'General',
        min,
        max,
        median: (min + max) / 2,
        location: location.replace(/[()]/g, '')
      });
    }

    return rates;
  }

  private extractTimeline(response: string): string {
    const timelinePattern = /(?:Timeline|Timeframe)\s*[:\\-]\s*(.+?)(?=\n|$)/gi;
    const match = response.match(timelinePattern);
    return match ? match[1].trim() : '6-12 months';
  }

  private generateActions(analysisResult: any, context: AgentContext): AgentAction[] {
    const actions: AgentAction[] = [];

    if (analysisResult.recommendedPaths && analysisResult.recommendedPaths.length > 0) {
      actions.push({
        type: 'recommendation',
        description: `Explore ${analysisResult.recommendedPaths.length} career path options`,
        data: { paths: analysisResult.recommendedPaths },
        priority: 'high',
        requiresConfirmation: false
      });
    }

    if (analysisResult.skillGaps && analysisResult.skillGaps.length > 0) {
      actions.push({
        type: 'recommendation',
        description: `Address ${analysisResult.skillGaps.length} identified skill gaps`,
        data: { skillGaps: analysisResult.skillGaps },
        priority: 'high',
        requiresConfirmation: false
      });
    }

    if (analysisResult.actionPlan && analysisResult.actionPlan.length > 0) {
      actions.push({
        type: 'generation',
        description: 'Download detailed career development plan',
        data: { actionPlan: analysisResult.actionPlan },
        priority: 'medium',
        requiresConfirmation: false
      });
    }

    if (analysisResult.marketInsights && analysisResult.marketInsights.length > 0) {
      actions.push({
        type: 'analysis',
        description: 'View detailed market intelligence report',
        data: { insights: analysisResult.marketInsights },
        priority: 'low',
        requiresConfirmation: false
      });
    }

    return actions;
  }

  getRequiredData(): string[] {
    return ['profile', 'skills', 'experience', 'location', 'goals'];
  }

  getEstimatedTokens(input: string): number {
    // Rough estimation: ~4 tokens per word + overhead
    return Math.ceil(input.split(/\s+/).length * 1.3) + 100;
  }
}

// Market Intelligence Service
export class MarketIntelligenceService {
  private static instance: MarketIntelligenceService;
  private cache: Map<string, { data: any; expiry: Date }> = new Map();
  private cacheExpiryMs = 3600000; // 1 hour

  static getInstance(): MarketIntelligenceService {
    if (!MarketIntelligenceService.instance) {
      MarketIntelligenceService.instance = new MarketIntelligenceService();
    }
    return MarketIntelligenceService.instance;
  }

  async getMarketData(
    category: string,
    filters?: {
      location?: string;
      industry?: string;
      experience?: string;
      timeframe?: string;
    }
  ): Promise<any> {
    const cacheKey = `${category}-${JSON.stringify(filters || {})}`;
    const cached = this.cache.get(cacheKey);

    if (cached && cached.expiry > new Date()) {
      return cached.data;
    }

    try {
      // Fetch market data from external APIs or database
      const data = await this.fetchMarketData(category, filters);

      // Cache the result
      this.cache.set(cacheKey, {
        data,
        expiry: new Date(Date.now() + this.cacheExpiryMs)
      });

      return data;
    } catch (error) {
      console.error('Error fetching market data:', error);
      throw error;
    }
  }

  private async fetchMarketData(
    category: string,
    filters?: any
  ): Promise<any> {
    // In production, this would integrate with external APIs like:
    // - Bureau of Labor Statistics (BLS)
    // - LinkedIn Salary Insights
    - Glassdoor Market Data
    - Indeed Market Trends
    - Payscale Data
    // - Custom data providers

    // Mock implementation
    const mockData = await this.generateMockMarketData(category, filters);
    return mockData;
  }

  private async generateMockMarketData(category: string, filters?: any): Promise<any> {
    // Generate mock data based on category
    switch (category) {
      case 'salary':
        return this.generateMockSalaryData(filters);
      case 'demand':
        return this.generateMockDemandData(filters);
      case 'growth':
        return this.generateMockGrowthData(filters);
      case 'skills':
        return this.generateMockSkillsData(filters);
      default:
        return {};
    }
  }

  private async generateMockSalaryData(filters?: any): Promise<{
    average: number;
    byLocation: Array<{ location: string; min: number; max: number; median: number }>;
    byIndustry: Array<{ industry: string; min: number; max: number; median: number }>;
    byExperience: Array<{ level: string; min: number; max: number; median: number }>;
  }> {
    return {
      average: 75000,
      byLocation: [
        { location: 'San Francisco, CA', min: 120000, max: 200000, median: 150000 },
        { location: 'New York, NY', min: 90000, max: 180000, median: 130000 },
        { location: 'Austin, TX', min: 85000, max: 140000, median: 110000 },
        { location: 'Chicago, IL', min: 75000, max: 120000, median: 95000 }
      ],
      byIndustry: [
        { industry: 'Technology', min: 95000, max: 180000, median: 125000 },
        { industry: 'Healthcare', min: 80000, max: 150000, median: 110000 },
        { industry: 'Finance', min: 90000, max: 170000, median: 120000 },
        { industry: 'Education', min: 60000, max: 100000, median: 75000 }
      ],
      byExperience: [
        { level: 'Entry', min: 45000, max: 75000, median: 60000 },
        { level: 'Mid', min: 75000, max: 130000, median: 95000 },
        { level: 'Senior', min: 100000, max: 180000, median: 140000 },
        { level: 'Executive', min: 150000, max: 300000, median: 200000 }
      ]
    };
  }

  private async generateMockDemandData(filters?: any): Promise<{
    overallDemand: number;
    byCategory: Array<{ category: string; demand: number; trend: 'increasing' | 'decreasing' | 'stable' }>;
    byLocation: Array<{ location: string; demand: number; trend: string }>;
    topGrowthAreas: string[];
  }> {
    return {
      overallDemand: 85,
      byCategory: [
        { category: 'Technology', demand: 92, trend: 'increasing' },
        { category: 'Healthcare', demand: 78, trend: 'increasing' },
        { category: 'Finance', demand: 82, trend: 'stable' },
        { category: 'Education', demand: 65, trend: 'stable' }
      ],
      byLocation: [
        { location: 'San Francisco', demand: 95, trend: 'increasing' },
        { location: 'New York', demand: 88, trend: 'increasing' },
        location: 'Austin', demand: 82, trend: 'increasing' }
      ],
      topGrowthAreas: [
        'Artificial Intelligence/Machine Learning',
        'Cybersecurity',
        'Data Science',
        'Cloud Computing',
        'Healthcare Technology'
      ]
    };
  }

  private async generateMockGrowthData(filters?: any): Promise<{
    overallGrowth: number;
    industryGrowth: Array<{ industry: string; growth: number; timeframe: string }>;
    emergingFields: Array<{
      field: string;
      growth: number;
      description: string;
      requiredSkills: string[];
    }>;
  }> {
    return {
      overallGrowth: 7.5,
      industryGrowth: [
        { industry: 'Technology', growth: 12.5, timeframe: 'annual' },
        { industry: 'Healthcare', growth: 8.2, timeframe: 'annual' },
        { industry: 'Finance', growth: 5.8, timeframe: 'annual' },
        { industry: 'Education', growth: 3.2, timeframe: 'annual' }
      ],
      emergingFields: [
        {
          field: 'AI/ML Engineering',
          growth: 35.2,
          description: 'Rapid growth in AI and machine learning roles',
          requiredSkills: ['Python', 'TensorFlow', 'PyTorch', 'Deep Learning']
        },
        {
          field: 'Cloud Architecture',
          growth: 28.7,
          description: 'High demand for cloud infrastructure expertise',
          requiredSkills: ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes']
        },
        {
          field: 'Cybersecurity',
          growth: 22.3,
          description: 'Growing need for security professionals',
          requiredSkills: ['Network Security', 'Cryptography', 'Penetration Testing']
        }
      ]
    };
  }

  private async generateMockSkillsData(filters?: any): Promise<{
    topSkills: Array<{
      skill: string;
      demand: number;
      growth: number;
      averageSalary: number;
    }>;
    emergingSkills: Array<{
      skill: string;
      description: string;
      relevanceScore: number;
    }>;
  }> {
    return {
      topSkills: [
        { skill: 'Python', demand: 92, growth: 15.3, averageSalary: 125000 },
        { skill: 'JavaScript', demand: 89, growth: 12.7, averageSalary: 115000 },
        { skill: 'AWS', demand: 85, growth: 18.2, averageSalary: 130000 },
        { skill: 'React', demand: 82, growth: 10.5, averageSalary: 120000 },
        { skill: 'SQL', demand: 78, growth: 8.3, averageSalary: 95000 }
      ],
      emergingSkills: [
        {
          skill: 'Rust',
          description: 'Systems programming language gaining popularity',
          relevanceScore: 85
        },
        {
          skill: 'Kubernetes',
          description: 'Container orchestration platform',
          relevanceScore: 92
        },
        {
          skill: 'GraphQL',
          description: 'API query language and runtime',
          relevanceScore: 78
        }
      ]
    };
  }
}