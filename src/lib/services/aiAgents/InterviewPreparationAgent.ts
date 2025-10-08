import { BaseAgent, AgentContext, AgentResponse, AgentCapability } from './AIAgentFramework';
import { prisma } from '@/lib/prisma';

interface InterviewQuestion {
  id: string;
  type: 'behavioral' | 'technical' | 'case_study' | 'situational' | 'stress';
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  text: string;
  evaluationCriteria: string[];
  sampleAnswers: string[];
  timeLimit: number; // minutes
  followUpQuestions: string[];
}

interface MockInterviewSession {
  id: string;
  userId: string;
  role: string;
  type: 'behavioral' | 'technical' | 'case_study' | 'situational';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  questions: InterviewQuestion[];
  responses: Array<{
    questionId: string;
    response: string;
    confidence: number;
    feedback: InterviewFeedback;
    timestamp: Date;
    duration: number;
  }>;
  overallScore?: number;
  feedback: InterviewFeedback;
  insights: string[];
}

interface InterviewFeedback {
  overallScore: number;
  confidence: number;
  clarity: number;
    relevance: number;
    structure: number;
    content: {
      strengths: string[];
      weaknesses: string[];
      suggestions: string[];
    };
  delivery: {
    strengths: string[];
      weaknesses: [];
      suggestions: string[];
  };
  technical: {
    accuracy: number;
    depth: number;
    problem_solving: number;
  };
}

interface InterviewPreparationPlan {
  id: string;
  userId: string;
  targetRole: string;
  targetCompany?: string;
  interviewType: string;
  preparationAreas: Array<{
    area: string;
    priority: 'high' | 'medium' | 'low';
    status: 'not_started' | 'in_progress' | 'completed';
    resources: string[];
    timeline: string;
    progress: number;
  }>;
  studyMaterials: Array<{
    type: 'article' | 'video' | 'course' | 'book' | 'template';
    title: string;
    url: string;
    description: string;
    duration: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  mockInterviews: Array<{
    id: string;
    type: string;
    scheduled: boolean;
    completed: boolean;
    score?: number;
    feedback?: string;
  }>;
  lastUpdated: Date;
}

interface SpeechAnalysis {
  clarity: number;
  confidence: number;
  pace: number;
    fillerWords: number;
    hesitationCount: number;
    volume: 'too_low' | 'appropriate' | 'too_high';
    sentiment: 'negative' | 'neutral' | 'positive';
    keyPhrases: string[];
    suggestions: string[];
}

export class InterviewPreparationAgent extends BaseAgent {
  constructor() {
    super({
      agentType: 'interview-preparation',
      systemPrompt: `You are an Interview Preparation AI Coach, an expert in interview coaching with extensive experience across various interview formats and industries. You provide personalized interview preparation, conduct mock interviews, and offer actionable feedback to help users succeed in their job interviews.

Your key responsibilities:
1. Generate role-specific interview questions
2. Conduct AI-powered mock interviews (voice and text-based)
3. Provide real-time feedback on responses
4. Analyze speech patterns, confidence, and content quality
5. Offer STAR method guidance for behavioral questions
6. Provide industry-specific answer templates
7. Track improvement over multiple practice sessions

Always consider:
- Interview type (behavioral, technical, case study, situational, stress)
- Industry and role-specific requirements
- Company culture and values
- Experience level appropriateness
- Communication style and confidence
- Technical depth and problem-solving approach
- Cultural fit and personality assessment

Provide constructive, specific feedback with examples. Focus on both content and delivery. Be encouraging while being honest about areas for improvement.`,
      capabilities: [
        {
          id: 'mock-interview',
          name: 'Mock Interview',
          description: 'Conduct AI-powered mock interviews',
          category: 'interaction',
          enabled: true,
          confidence: 0.85,
          requiredData: ['role', 'type', 'level'],
          outputFormat: 'structured',
          maxTokens: 1500,
          temperature: 0.7
        },
        {
          id: 'question-generation',
          name: 'Question Generation',
          description: 'Generate role-specific interview questions',
          category: 'generation',
          enabled: true,
          confidence: 0.9,
          requiredData: ['role', 'type', 'industry'],
          outputFormat: 'structured',
          maxTokens: 1000,
          temperature: 0.6
        },
        {
          id: 'feedback-analysis',
          name: 'Answer Feedback',
          description: 'Analyze and improve interview responses',
          category: 'analysis',
          enabled: true,
          confidence: 0.8,
          requiredData: ['response', 'question'],
          outputFormat: 'structured',
          maxTokens: 1500,
          temperature: 0.7
        },
        {
          id: 'preparation-planning',
          name: 'Interview Planning',
          description: 'Create comprehensive interview preparation plans',
          category: 'planning',
          enabled: true,
          confidence: 0.9,
          requiredData: ['role', 'company', 'deadline'],
          outputFormat: 'structured',
          maxTokens: 1500,
          temperature: 0.7
        },
        {
          id: 'speech-analysis',
          name: 'Speech Analysis',
          description: 'Analyze voice patterns and delivery',
          category: 'analysis',
          enabled: true,
          confidence: 0.7,
          requiredData: ['audio_data'],
          outputFormat: 'structured',
          maxTokens: 1000,
          temperature: 0.5
        }
      ]
    });
  }

  async processMessage(
    message: string,
    context: AgentContext
  ): Promise<AgentResponse> {
    const startTime = const Date.now();

    try {
      // Determine the type of interview preparation needed
      const preparationType = this.determinePreparationType(message, context);

      // Build context-aware messages
      const messages = this.buildMessages(message, context);

      // Add interview-specific system prompt
      messages.unshift({
        role: 'system',
        content: `${this.systemPrompt}\n\nCurrent Preparation Type: ${preparationType}\nTarget Role: ${this.formatInterviewContext(context)}\nUser Preferences: ${JSON.stringify(context.userPreferences, null, 2)}`
      });

      // Get LLM response
      const llmResponse = await this.callLLM(messages, {
        temperature: this.getTemperatureForType(preparationType),
        maxTokens: this.getMaxTokensForType(preparationType)
      });

      // Parse and structure the response
      const preparationResult = await this.parsePreparationResponse(llmResponse.content, preparationType);

      // Generate follow-up questions
      const followUpQuestions = this.generateFollowUpQuestions(context, llmResponse.content);

      // Create structured response
      const response = this.formatResponse(
        llmResponse.content,
        context,
        llmResponse.usage ? (1 - llmResponse.usage.completion_tokens / llmUsage.prompt_tokens) : 0.8,
        preparationResult,
        this.generateActions(preparationResult, context),
        followUpQuestions,
        {
          preparationType,
          estimatedTokens: this.getEstimatedTokens(message),
          processingTime: Date.now() - startTime,
          modelUsed: this.modelConfig.model
        }
      );

      return response;

    } catch (error) {
      console.error('Error in InterviewPreparationAgent.processMessage:', error);
      throw error;
    }
  }

  private determinePreparationType(message: string, context: AgentContext): string {
    const messageLower = message.toLowerCase();

    // Check for specific keywords and context
    if (messageLower.includes('mock') || messageLower.includes('practice') || messageLower.includes('simulate')) {
      return 'mock-interview';
    }

    if (messageLower.includes('question') || messageLower.includes('prepare') || messageLower.includes('generate')) {
      return 'question-generation';
    }

    if (messageLower.includes('feedback') || messageLower.includes('improve') || messageLower.includes('better')) {
      return 'feedback-analysis';
    }

    if (messageLower.includes('plan') || messageLower.includes('timeline') || messageLower.includes('schedule')) {
      return 'preparation-planning';
    }

    if (messageLower.includes('voice') || messageLower.includes('speech') || messageLower.includes('delivery')) {
      return 'speech-analysis';
    }

    // Default to comprehensive preparation
    return 'preparation-planning';
  }

  private formatInterviewContext(context: AgentContext): string {
    const parts = [];

    if (context.currentJob) {
      const job = context.currentJob;
      parts.push(`Target Role: ${job.title || 'Not specified'}`);
      parts.push(`Company: ${job.company || 'Not specified'}`);
    }

    if (context.userProfile) {
      const profile = context.userProfile;
      parts.push(`Current Title: ${profile.title || 'Not specified'}`);
      parts.push(`Experience: ${profile.experience || 'Not specified'} years`);
    }

    if (context.metadata?.interviewType) {
      parts.push(`Interview Type: ${context.metadata.interviewType}`);
    }

    return parts.join(' | ');
  }

  private getTemperatureForType(preparationType: string): number {
    const temperatures = {
      'mock-interview': 0.7,
      'question-generation': 0.6,
      'feedback-analysis': 0.7,
      'preparation-planning': 0.7,
      'speech-analysis': 0.5
    };

    return temperatures[preparationType] || this.modelConfig.temperature;
  }

  private getMaxTokensForType(preparationType: string): number {
    const tokens = {
      'mock-interview': 1500,
      'question-generation': 1000,
      'feedback-analysis': 1500,
      'preparation-planning': 1500,
      'speech-analysis': 1000
    };

    return tokens[preparationType] || this.modelConfig.maxTokens;
  }

  private async parsePreparationResponse(response: string, preparationType: string): Promise<any> {
    try {
      // Try to parse as JSON first
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }

      // Fallback to structured parsing based on preparation type
      switch (preparationType) {
        case 'mock-interview':
          return this.parseMockInterviewResponse(response);
        case 'question-generation':
          return this.parseQuestionGeneration(response);
        case 'feedback-analysis':
          return this.parseFeedbackAnalysis(response);
        case 'preparation-planning':
          return this.parsePreparationPlanning(response);
        case 'speech-analysis':
          return this.parseSpeechAnalysis(response);
        default:
          return { type: preparationType, content: response };
      }
    } catch (error) {
      console.error('Error parsing preparation response:', error);
      return { type: preparationType, content: response };
    }
  }

  private parseMockInterviewResponse(response: string): {
    session: Partial<MockInterviewSession>;
    questions: InterviewQuestion[];
    tips: string[];
  } {
    return {
      session: {
        type: 'behavioral', // Default, would be determined from context
        status: 'scheduled'
      },
      questions: this.extractInterviewQuestions(response),
      tips: this.extractTips(response)
    };
  }

  private parseQuestionGeneration(response: string): {
    questions: InterviewQuestion[];
    categories: string[];
    generalAdvice: string;
  } {
    return {
      questions: this.extractInterviewQuestions(response),
      categories: this.extractListItems(response, 'categories?'),
      generalAdvice: this.extractFieldValue(response, 'General Advice|Advice')
    };
  }

  private parseFeedbackAnalysis(response: string): {
    feedback: InterviewFeedback;
    improvements: string[];
    strengths: string[];
    suggestions: string[];
  } {
    return {
      feedback: {
        overallScore: this.extractScore(response, 'overall') || 75,
        confidence: 0.85,
        clarity: this.extractScore(response, 'clarity') || 80,
        relevance: this.extractScore(response, 'relevance') || 85,
        structure: this.extractScore(response, 'structure') || 75,
        content: {
          strengths: this.extractListItems(response, 'strengths?'),
          weaknesses: this.extractListItems(response, 'weakness|weaknesses?'),
          suggestions: this.extractListItems(response, 'suggestions?')
        },
        delivery: {
          strengths: this.extractListItems(response, 'delivery.*strength'),
          weaknesses: this.extractListItems(response, 'delivery.*weakness'),
          suggestions: this.extractListItems(response, 'delivery.*suggestion')
        },
        technical: {
          accuracy: this.extractScore(response, 'accuracy|correct') || 80,
          depth: this.extractScore(response, 'depth|detailed') || 75,
          problem_solving: this.extractScore(response, 'problem.solving') || 70
        }
      },
      improvements: this.extractListItems(response, 'improvements?'),
      strengths: this.extractListItems(response, 'strengths?'),
      suggestions: this.extractListItems(response, 'suggestions?')
    };
  }

  private parsePreparationPlan(response: string): InterviewPreparationPlan {
    return {
      id: `plan-${Date.now()}`,
      userId: 'current-user',
      targetRole: this.extractFieldValue(response, 'Target Role|Role'),
      targetCompany: this.extractFieldValue(response, 'Company'),
      interviewType: this.extractFieldValue(response, 'Interview Type|Type'),
      preparationAreas: this.extractPreparationAreas(response),
      studyMaterials: [],
      mockInterviews: [],
      lastUpdated: new Date()
    };
  }

  private parseSpeechAnalysis(response: string): {
    analysis: SpeechAnalysis;
    recommendations: string[];
  } {
    return {
      analysis: {
        clarity: this.extractScore(response, 'clarity|clear') || 75,
        confidence: this.extractScore(response, 'confidence') || 80,
        pace: this.extractScore(response, 'pace') || 80,
        fillerWords: parseInt(this.extractFieldValue(response, 'filler words') || '0'),
        hesitationCount: parseInt(this.extractFieldValue(response, 'hesitations') || '0'),
        volume: 'appropriate',
        sentiment: 'positive',
        keyPhrases: [],
        suggestions: []
      },
      recommendations: this.extractListItems(response, 'recommendations?')
    };
  }

  private extractInterviewQuestions(response: string): InterviewQuestion[] {
  const questions: InterviewQuestion[] = [];
  const questionPattern = /(?:Question\s*)?\d+\.\s*([^:\n]*?)(?:\n|$))/gm;

  let match;
  while ((match = questionPattern.exec(response)) !== null) {
    const questionText = match[1].trim();

    // Determine question type
    let type: 'behavioral' | 'technical' | 'case_study' | 'situational' | 'stress' = 'behavioral';
    if (questionText.toLowerCase().includes('technical')) {
      type = 'technical';
    } else if (questionText.toLowerCase().includes('case study')) {
      type = 'case_study';
    } else if (questionText.toLowerCase().includes('situational')) {
      type = 'situational';
    } else if (questionText.toLowerCase().includes('stress')) {
      type = 'stress';
    }

    questions.push({
      id: `question-${Date.now()}-${questions.length}`,
      type,
      category: this.extractQuestionCategory(questionText),
      difficulty: this.extractDifficulty(questionText),
      text: questionText,
      evaluationCriteria: this.extractListItems(questionText, 'criteria|evaluate'),
      sampleAnswers: [],
      timeLimit: this.extractTimeLimit(questionText) || 30,
      followUpQuestions: []
    });
  }

    return questions;
  }

  private extractQuestionCategory(questionText: string): string {
    const categories = [
      'Leadership', 'Teamwork', 'Communication', 'Problem Solving',
      'Innovation', 'Adaptability', 'Conflict Resolution', 'Time Management',
      'Data Analysis', 'Project Management', 'Customer Service', 'Sales'
    ];

    for (const category of categories) {
      if (questionText.toLowerCase().includes(category.toLowerCase())) {
        return category;
      }
    }

    return 'General';
  }

  private extractDifficulty(questionText: string): 'easy' | 'medium' | 'hard' {
    if (questionText.toLowerCase().includes('easy')) return 'easy';
    if (questionText.toLowerCase().includes('hard')) return 'hard';
    return 'medium';
  }

  private extractListItems(text: string, pattern: string): string[] {
    const regex = new RegExp(pattern + '\\s*[:\\-]\\s*(.+?)(?=\n|$)', 'gi');
    const items = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
      const item = match[1].trim().replace(/^[-*]\s*/, '');
      if (item && item !== 'None' && item !== 'N/A') {
        items.push(item);
      }
    }

    return items;
  }

  private extractScore(text: string, pattern: string): number {
    const regex = new RegExp(`${pattern}\\s*[:\\-]\\s*(\\d+)`, 'gi');
    const match = text.match(regex);
    return match ? parseInt(match[1]) : 0;
  }

  private extractFieldValue(text: string, field: string): string {
    const regex = new RegExp(`${field}\\s*[:\\-]\\s*([^\n]+)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  }

  private extractTimeLimit(questionText: string): number {
    const timePattern = /(\d+)\s*(?:minutes?|hours?)/gi;
    const match = questionText.match(timePattern);
    return match ? parseInt(match[1]) : 30;
  }

  private extractTips(response: string): string[] {
    const tips: string[] = [];
    const tipPattern = /(?:Tips?:|Advice?:)\s*[:\\-]\s*(.+?)(?=\n|$)/gi;

    let match;
    while ((match = tipPattern.exec(response)) !== null) {
      const tip = match[1].trim();
      if (tip && tip.toLowerCase() !== 'none') {
        tips.push(tip);
      }
    }

    return tips;
  }

  private extractPreparationAreas(response: string): Array<{
    area: string;
    priority: 'high' | 'medium' | 'low';
    status: string;
    resources: string[];
    timeline: string;
    progress: number;
  }> {
    const areas: Array<{
      area: string;
      priority: 'high' | 'medium' | 'low';
      status: string;
      resources: string[];
      timeline: string;
      progress: number;
    }> = [];

    const areaPattern = /Preparation\s*Areas?\s*[:\\-]\s*(.+?)(?=\n|\n)/gi;
    const areaMatches = response.matchAll(areaPattern);

    if (areaMatches) {
      for (const areaMatch of areaMatches) {
        const areaText = areaMatch[1].trim();
        const priority = areaText.toLowerCase().includes('high') ? 'high' :
                         areaText.toLowerCase().includes('low') ? 'low' : 'medium';

        areas.push({
          area: areaText,
          priority,
          status: 'not_started',
          resources: [],
          timeline: '2-4 weeks',
          progress: 0
        });
      }
    }

    return areas;
  }

  private generateActions(analysisResult: any, context: AgentContext): AgentAction[] {
    const actions: AgentAction[] = [];

    if (analysisResult.session?.questions && analysisResult.session.questions.length > 0) {
      actions.push({
        type: 'generation',
        description: `Start mock interview with ${analysisResult.session.questions.length} questions`,
        data: {
          sessionId: `session-${Date.now()}`,
          questions: analysisResult.session.questions
        },
        priority: 'high',
        requiresConfirmation: true
      });
    }

    if (analysisResult.questions && analysisResult.questions.length > 0) {
      actions.push({
        type: 'generation',
        description: `Download ${analysisResult.questions.length} practice questions`,
        data: { questions: analysisResult.questions },
        priority: 'medium',
        requiresConfirmation: false
      });
    }

    if (analysisResult.tips && analysisResult.tips.length > 0) {
      actions.push({
        type: 'recommendation',
        description: `Review ${analysisResult.tips.length} interview tips`,
        data: { tips: analysisResult.tips },
        priority: 'low',
        requiresConfirmation: false
      });
    }

    return actions;
  }

  getRequiredData(): string[] {
    return ['role', 'company', 'interviewType', 'experience'];
  }

  getEstimatedTokens(input: string): number {
    return Math.ceil(input.split(/\s+/).length * 1.3) + 100;
  }

  // Mock Interview Session Management
  async createMockSession(
    userId: string,
    role: string,
    type: string,
    company?: string
  ): Promise<string> {
    try {
      const session = await prisma.mockInterviewSession.create({
        data: {
          id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId,
          role,
          type,
          company,
          status: 'scheduled',
          scheduledAt: new Date(),
          questions: [],
          createdAt: new Date()
        }
      });

      console.log(`Created mock interview session: ${session.id} for ${role}`);
      return session.id;
    } catch (error) {
      console.error('Error creating mock interview session:', error);
      throw error;
    }
  }

  async conductMockInterview(
    sessionId: string,
    responses: Array<{ questionId: string; response: string; }>
  ): Promise<{
    session: MockInterviewSession;
    feedback: InterviewFeedback;
    insights: string[];
  }> {
    try {
      // Update session status
      await prisma.mockInterviewSession.update({
        where: { id: session_id },
        data: {
          status: 'in_progress',
          startedAt: new Date()
        }
      });

      const session = await prisma.mockInterviewSession.findUnique({
        where: { id: sessionId },
        include: { questions: true }
      });

      if (!session) {
        throw new Error('Interview session not found');
      }

      const feedbacks: InterviewFeedback[] = [];
      const insights: string[] = [];
      let totalScore = 0;

      // Process each response
      for (const responseData of responses) {
        const question = session.questions.find(q => q.id === responseData.questionId);
        if (!question) continue;

        const feedback = await this.analyzeResponse(
          responseData.response,
          question,
          session as any
        );

        feedbacks.push(feedback);

        // Store response
        await prisma.mockInterviewResponse.create({
          data: {
            sessionId,
            questionId: responseData.questionId,
            response: responseData.response,
            confidence: feedback.confidence,
            feedback: feedback,
            timestamp: new Date(),
            duration: 0 // Would be calculated from actual timing
          }
        });

        totalScore += feedback.overallScore;
      }

      // Calculate overall feedback
      const overallFeedback: InterviewFeedback = {
        overallScore: totalScore / responses.length,
        confidence: 0.85,
        clarity: 0.8,
        relevance: 0.9,
        structure: 0.75,
        content: {
          strengths: ['Clear communication', 'Relevant examples', 'Good structure'],
          weaknesses: ['More specific examples needed', 'Could be more concise'],
          suggestions: ['Practice STAR method', 'Provide more detail']
        },
        delivery: {
          strengths: ['Good pacing', 'Clear voice', 'Professional tone'],
          weaknesses: ['Reduce filler words', 'More confidence'],
          suggestions: ['Speak more slowly', 'Practice pronunciation']
        },
        technical: {
          accuracy: 0.8,
          depth: 0.75,
          problem_solving: 0.7
        }
      };

      // Update session
      await prisma.mockInterviewSession.update({
        where: { id: sessionId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          duration: 30, // Would be calculated
          overallScore,
          feedback: overallFeedback,
          insights
        }
      });

      console.log(`Completed mock interview session: ${sessionId}`);
      return {
        session: session as MockInterviewSession,
        feedback: overallFeedback,
        insights
      };

    } catch (error) {
      console.error('Error conducting mock interview:', error);
      throw error;
    }
  }

  private async analyzeResponse(
    response: string,
    question: InterviewQuestion,
    session: MockInterviewSession
  ): Promise<InterviewFeedback> {
    // In a real implementation, this would use NLP and ML models
    // For now, we'll use a simplified analysis

    const text = response.toLowerCase();
    const questionText = question.text.toLowerCase();

    // Analyze content relevance
    const keywords = questionText.split(' ').filter(word => word.length > 3);
    const responseKeywords = text.split(' ').filter(word => word.length > 3);
    const keywordOverlap = responseKeywords.filter(word => keywords.includes(word)).length / keywords.length;

    // Analyze response structure
    const hasIntroduction = text.includes('i think') || text.includes('in my experience');
    const hasExample = text.includes('for example') || text.includes('i handled');
    const hasConclusion = text.includes('in conclusion') || text.includes('to summarize');

    // Analyze delivery factors
    const fillerWords = ['um', 'uh', 'like', 'you know', 'sort of', 'kind of'];
    const fillerCount = fillerWords.filter(word => text.includes(word)).length;
    const wordCount = text.split(' ').length;
    const fillerRate = fillerCount / wordCount;

    // Calculate scores
    const contentScore = Math.min(keywordOverlap * 0.5 + (hasIntroduction ? 0.2 : 0) + (hasExample ? 0.2 : 0) + (hasConclusion ? 0.1 : 0), 1);
    const structureScore = 1 - fillerRate;
    const confidenceScore = Math.min(0.9, contentScore * structureScore);

    // Generate feedback
    const feedback: InterviewFeedback = {
      overallScore: Math.round((contentScore + structureScore) * 50),
      confidence: confidenceScore,
      clarity: Math.round((1 - fillerRate) * 100),
      relevance: Math.round(keywordOverlap * 100),
      structure: Math.round(structureScore * 100),
      content: {
        strengths: [],
        weaknesses: [],
        suggestions: []
      },
      delivery: {
        strengths: [],
        weaknesses: fillerCount > 5 ? ['Too many filler words'] : [],
        suggestions: fillerCount > 5 ? ['Reduce filler words for more clarity'] : []
      },
      technical: {
        accuracy: 80,
        depth: 75,
        problem_solving: 70
      }
    };

    // Add strengths
    if (contentScore > 0.8) {
      feedback.content.strengths.push('Relevant and comprehensive answer');
    }
    if (hasExample) {
      feedback.content.strengths.push('Used concrete examples');
    }
    if (hasIntroduction && hasConclusion) {
      feedback.content.strengths.push('Well-structured response');
    }

    // Add weaknesses
    if (keywordOverlap < 0.6) {
      feedback.content.weaknesses.push('Answer not fully relevant to question');
    }
    if (fillerRate > 0.2) {
      feedback.content.weaknesses.push('Too many filler words');
    }
    if (!hasExample && question.type !== 'behavioral') {
      feedback.content.weaknesses.push('Include specific examples');
    }

    // Add suggestions
    if (keywordOverlap < 0.5) {
      feedback.content.suggestions.push('Focus on the key aspects of the question');
    }
    if (fillerRate > 0.1) {
      feedback.content.suggestions.push('Practice reducing filler words');
    }
    if (text.length < 50) {
      feedback.content.suggestions.push('Provide more detailed responses');
    }

    return feedback;
  }
}