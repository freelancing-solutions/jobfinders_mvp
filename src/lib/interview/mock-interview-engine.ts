import { Logger } from '@/lib/logger';

export interface MockInterviewConfig {
    role: string;
    company: string;
    interviewType: InterviewType;
    difficulty: 'easy' | 'medium' | 'hard';
    duration: number; // in minutes
    focusAreas: string[];
    questionCount: number;
    enableRecording: boolean;
    enableRealTimeFeedback: boolean;
}

export interface MockInterviewSession {
    sessionId: string;
    config: MockInterviewConfig;
    status: InterviewStatus;
    startTime: Date;
    endTime?: Date;
    currentQuestionIndex: number;
    questions: InterviewQuestion[];
    responses: InterviewResponse[];
    realTimeFeedback: RealTimeFeedback[];
    finalFeedback: InterviewFeedback;
    metrics: InterviewMetrics;
}

export interface InterviewQuestion {
    id: string;
    question: string;
    type: QuestionType;
    category: QuestionCategory;
    difficulty: number; // 1-10 scale
    timeLimit: number; // in seconds
    followUpQuestions: string[];
    evaluationCriteria: EvaluationCriteria[];
    sampleAnswer?: string;
    tips: string[];
    keywords: string[];
    context: string;
}

export interface InterviewResponse {
    questionId: string;
    response: string;
    startTime: Date;
    endTime: Date;
    duration: number;
    audioData?: string;
    transcript?: string;
    confidence: number; // 0-1 scale
    keywords: string[];
    structure: ResponseStructure;
    quality: ResponseQuality;
    realTimeAnalysis?: RealTimeAnalysis;
}

export interface ResponseStructure {
    hasIntroduction: boolean;
    hasMainPoints: boolean;
    hasExamples: boolean;
    hasConclusion: boolean;
    usesStarMethod: boolean;
    logicalFlow: number; // 0-10 scale
    conciseness: number; // 0-10 scale
    timeManagement: number; // 0-10 scale
}

export interface ResponseQuality {
    clarity: number; // 0-10 scale
    relevance: number; // 0-10 scale
    completeness: number; // 0-10 scale
    specificity: number; // 0-10 scale
    engagement: number; // 0-10 scale
    professionalism: number; // 0-10 scale
}

export interface RealTimeFeedback {
    timestamp: Date;
    type: FeedbackType;
    message: string;
    severity: 'info' | 'suggestion' | 'warning';
    suggestions: string[];
}

export interface RealTimeAnalysis {
    pace: number; // words per minute
    fillerWords: number;
    confidenceLevel: number;
    clarity: number;
    engagement: number;
}

export interface InterviewFeedback {
    overallScore: number; // 0-100 scale
    categoryScores: CategoryScore[];
    strengths: string[];
    improvements: string[];
    specificFeedback: SpecificFeedback[];
    recommendations: Recommendation[];
    nextSteps: string[];
    confidenceLevel: number;
    preparationLevel: number;
}

export interface CategoryScore {
    category: string;
    score: number;
    maxScore: number;
    feedback: string;
    benchmarks: BenchmarkComparison;
}

export interface SpecificFeedback {
    questionId: string;
    aspect: string;
    score: number;
    comment: string;
    suggestion: string;
    examples: string[];
}

export interface Recommendation {
    type: RecommendationType;
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    actionItems: string[];
    resources: LearningResource[];
    timeline: string;
    expectedImpact: string;
}

export interface InterviewMetrics {
    totalDuration: number;
    questionCount: number;
    averageResponseTime: number;
    totalWords: number;
    averageWordsPerResponse: number;
    fillerWordCount: number;
    confidenceTrend: number[];
    performanceTrend: number[];
    improvementAreas: string[];
    strongAreas: string[];
}

export interface BenchmarkComparison {
    userScore: number;
    industryAverage: number;
    topPerformers: number;
    improvementPotential: number;
    ranking: string;
}

export interface EvaluationCriteria {
    aspect: string;
    description: string;
    weight: number;
    scoringLevels: ScoringLevel[];
}

export interface ScoringLevel {
    level: number;
    description: string;
    indicators: string[];
}

export interface LearningResource {
    title: string;
    type: ResourceType;
    url?: string;
    duration: string;
    rating: number;
    description: string;
    topics: string[];
}

export type InterviewStatus = 'preparing' | 'active' | 'paused' | 'completed' | 'abandoned';
export type InterviewType = 'behavioral' | 'technical' | 'case_study' | 'panel' | 'phone_screen' | 'system_design';
export type QuestionType = 'behavioral' | 'technical' | 'situational' | 'case' | 'brainteaser' | 'background';
export type QuestionCategory = 'leadership' | 'teamwork' | 'problem_solving' | 'communication' | 'technical_skills' | 'cultural_fit' | 'career_goals';
export type FeedbackType = 'pace' | 'structure' | 'content' | 'delivery' | 'confidence' | 'engagement';
export type RecommendationType = 'question_practice' | 'answer_structure' | 'content_improvement' | 'delivery' | 'confidence' | 'research';

export class MockInterviewEngine {
    private logger: Logger;
    private questionBank: Map<string, InterviewQuestion[]> = new Map();
    private activeSessions: Map<string, MockInterviewSession> = new Map();
    private evaluationTemplates: Map<string, EvaluationCriteria[]> = new Map();

    constructor() {
        this.logger = new Logger('MockInterviewEngine');
        this.initializeQuestionBank();
        this.initializeEvaluationTemplates();
    }

    /**
     * Create a new mock interview session
     */
    async createSession(config: MockInterviewConfig): Promise<MockInterviewSession> {
        try {
            this.logger.info(`Creating mock interview session for role: ${config.role}`);

            // Generate questions for the session
            const questions = await this.generateQuestions(config);

            // Create session
            const session: MockInterviewSession = {
                sessionId: `interview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                config,
                status: 'preparing',
                startTime: new Date(),
                currentQuestionIndex: 0,
                questions,
                responses: [],
                realTimeFeedback: [],
                finalFeedback: this.createDefaultFeedback(),
                metrics: this.createDefaultMetrics()
            };

            // Store session
            this.activeSessions.set(session.sessionId, session);

            this.logger.info(`Mock interview session created: ${session.sessionId}`);
            return session;

        } catch (error) {
            this.logger.error('Error creating mock interview session:', error);
            throw error;
        }
    }

    /**
     * Start the mock interview
     */
    async startSession(sessionId: string): Promise<InterviewQuestion> {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }

        if (session.status !== 'preparing') {
            throw new Error('Session cannot be started');
        }

        session.status = 'active';
        session.startTime = new Date();

        // Get first question
        const firstQuestion = session.questions[0];
        if (!firstQuestion) {
            throw new Error('No questions available');
        }

        this.logger.info(`Started mock interview session: ${sessionId}`);
        return firstQuestion;
    }

    /**
     * Submit a response to the current question
     */
    async submitResponse(
        sessionId: string,
        response: string,
        duration: number,
        audioData?: string
    ): Promise<{
        feedback?: RealTimeFeedback[];
        nextQuestion?: InterviewQuestion;
        sessionComplete: boolean;
        finalFeedback?: InterviewFeedback;
    }> {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }

        if (session.status !== 'active') {
            throw new Error('Session is not active');
        }

        const currentQuestion = session.questions[session.currentQuestionIndex];
        if (!currentQuestion) {
            throw new Error('No current question');
        }

        // Create response object
        const interviewResponse: InterviewResponse = {
            questionId: currentQuestion.id,
            response,
            startTime: new Date(Date.now() - duration * 1000),
            endTime: new Date(),
            duration,
            audioData,
            transcript: await this.transcribeAudio(audioData),
            confidence: await this.assessConfidence(response),
            keywords: await this.extractKeywords(response),
            structure: await this.analyzeStructure(response),
            quality: await this.assessQuality(response),
            realTimeAnalysis: await this.analyzeResponseRealTime(response, audioData)
        };

        // Add response to session
        session.responses.push(interviewResponse);

        // Generate real-time feedback
        const feedback = await this.generateRealTimeFeedback(interviewResponse, currentQuestion);
        session.realTimeFeedback.push(...feedback);

        // Move to next question
        session.currentQuestionIndex++;

        // Check if session is complete
        const sessionComplete = session.currentQuestionIndex >= session.questions.length;
        if (sessionComplete) {
            await this.completeSession(sessionId);
            return {
                feedback,
                sessionComplete: true,
                finalFeedback: session.finalFeedback
            };
        }

        // Get next question
        const nextQuestion = session.questions[session.currentQuestionIndex];

        return {
            feedback,
            nextQuestion,
            sessionComplete: false
        };
    }

    /**
     * Get session status and progress
     */
    async getSessionStatus(sessionId: string): Promise<MockInterviewSession | null> {
        return this.activeSessions.get(sessionId) || null;
    }

    /**
     * Pause an active session
     */
    async pauseSession(sessionId: string): Promise<void> {
        const session = this.activeSessions.get(sessionId);
        if (session && session.status === 'active') {
            session.status = 'paused';
            this.logger.info(`Paused session: ${sessionId}`);
        }
    }

    /**
     * Resume a paused session
     */
    async resumeSession(sessionId: string): Promise<void> {
        const session = this.activeSessions.get(sessionId);
        if (session && session.status === 'paused') {
            session.status = 'active';
            this.logger.info(`Resumed session: ${sessionId}`);
        }
    }

    /**
     * Complete a session and generate final feedback
     */
    async completeSession(sessionId: string): Promise<InterviewFeedback> {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }

        session.status = 'completed';
        session.endTime = new Date();

        // Calculate metrics
        session.metrics = await this.calculateSessionMetrics(session);

        // Generate final feedback
        session.finalFeedback = await this.generateFinalFeedback(session);

        this.logger.info(`Completed mock interview session: ${sessionId}`);
        return session.finalFeedback;
    }

    /**
     * Get session history
     */
    async getSessionHistory(userId?: string, limit: number = 10): Promise<MockInterviewSession[]> {
        const sessions = Array.from(this.activeSessions.values())
            .filter(session => session.status === 'completed')
            .sort((a, b) => b.endTime!.getTime() - a.endTime!.getTime())
            .slice(0, limit);

        return sessions;
    }

    // Private helper methods

    private async generateQuestions(config: MockInterviewConfig): Promise<InterviewQuestion[]> {
        const questions: InterviewQuestion[] = [];
        const categoryQuestions = this.questionBank.get(config.interviewType) || [];

        // Select questions based on focus areas
        for (const focusArea of config.focusAreas) {
            const areaQuestions = categoryQuestions.filter(q =>
                q.category === focusArea || q.keywords.some(k => k.toLowerCase().includes(focusArea.toLowerCase()))
            );

            // Select questions based on difficulty
            const filteredQuestions = areaQuestions.filter(q =>
                Math.abs(q.difficulty - this.getDifficultyValue(config.difficulty)) <= 2
            );

            // Add random questions from this area
            const selectedQuestions = this.shuffleArray(filteredQuestions)
                .slice(0, Math.ceil(config.questionCount / config.focusAreas.length));

            questions.push(...selectedQuestions);
        }

        // If we don't have enough questions, add more from the general pool
        if (questions.length < config.questionCount) {
            const remainingQuestions = categoryQuestions
                .filter(q => !questions.some(existing => existing.id === q.id))
                .filter(q => Math.abs(q.difficulty - this.getDifficultyValue(config.difficulty)) <= 3)
                .slice(0, config.questionCount - questions.length);

            questions.push(...remainingQuestions);
        }

        return questions.slice(0, config.questionCount);
    }

    private getDifficultyValue(difficulty: string): number {
        const difficultyMap = { easy: 3, medium: 6, hard: 9 };
        return difficultyMap[difficulty] || 6;
    }

    private shuffleArray<T>(array: T[]): T[] {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    private async transcribeAudio(audioData?: string): Promise<string> {
        // In a real implementation, this would use speech-to-text service
        return '';
    }

    private async assessConfidence(response: string): Promise<number> {
        // Simple confidence assessment based on response characteristics
        const indicators = [
            response.length > 50, // Adequate length
            !response.includes('um'), // No filler words
            !response.includes('like'), // No filler words
            response.includes('I think'), // Shows thought
            response.includes('example'), // Provides examples
        ];

        return indicators.filter(Boolean).length / indicators.length;
    }

    private async extractKeywords(response: string): Promise<string[]> {
        // Simple keyword extraction
        const words = response.toLowerCase().split(/\s+/);
        const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'];
        return words.filter(word => word.length > 3 && !commonWords.includes(word));
    }

    private async analyzeStructure(response: string): Promise<ResponseStructure> {
        return {
            hasIntroduction: response.length > 0,
            hasMainPoints: response.split('.').length > 2,
            hasExamples: response.includes('example') || response.includes('for instance'),
            hasConclusion: response.includes('in conclusion') || response.includes('to summarize'),
            usesStarMethod: this.checkStarMethod(response),
            logicalFlow: Math.random() * 10, // Placeholder
            conciseness: Math.max(0, 10 - response.length / 50), // Placeholder
            timeManagement: 7 // Placeholder
        };
    }

    private checkStarMethod(response: string): boolean {
        const starIndicators = ['situation', 'task', 'action', 'result'];
        const responseLower = response.toLowerCase();
        return starIndicators.some(indicator => responseLower.includes(indicator));
    }

    private async assessQuality(response: string): Promise<ResponseQuality> {
        return {
            clarity: Math.random() * 10, // Placeholder
            relevance: Math.random() * 10, // Placeholder
            completeness: Math.random() * 10, // Placeholder
            specificity: Math.random() * 10, // Placeholder
            engagement: Math.random() * 10, // Placeholder
            professionalism: Math.random() * 10 // Placeholder
        };
    }

    private async analyzeResponseRealTime(response: string, audioData?: string): Promise<RealTimeAnalysis> {
        return {
            pace: response.length / 60, // words per minute (placeholder)
            fillerWords: (response.match(/\\b(um|uh|like|you know)\\b/gi) || []).length,
            confidenceLevel: await this.assessConfidence(response),
            clarity: 7, // Placeholder
            engagement: 7 // Placeholder
        };
    }

    private async generateRealTimeFeedback(
        response: InterviewResponse,
        question: InterviewQuestion
    ): Promise<RealTimeFeedback[]> {
        const feedback: RealTimeFeedback[] = [];

        // Check response length
        if (response.duration > question.timeLimit) {
            feedback.push({
                timestamp: new Date(),
                type: 'pace',
                message: 'Your response was longer than the recommended time',
                severity: 'warning',
                suggestions: ['Try to be more concise', 'Focus on the key points']
            });
        }

        // Check for filler words
        if (response.realTimeAnalysis?.fillerWords > 5) {
            feedback.push({
                timestamp: new Date(),
                type: 'delivery',
                message: 'Try to reduce filler words in your response',
                severity: 'suggestion',
                suggestions: ['Practice pausing instead of using filler words', 'Take a breath before speaking']
            });
        }

        // Check structure
        if (!response.structure.usesStarMethod && question.type === 'behavioral') {
            feedback.push({
                timestamp: new Date(),
                type: 'structure',
                message: 'Consider using the STAR method for behavioral questions',
                severity: 'suggestion',
                suggestions: [
                    'Situation: Describe the context',
                    'Task: Explain what you needed to do',
                    'Action: Detail the steps you took',
                    'Result: Share the outcome'
                ]
            });
        }

        return feedback;
    }

    private async calculateSessionMetrics(session: MockInterviewSession): Promise<InterviewMetrics> {
        const totalDuration = session.endTime!.getTime() - session.startTime.getTime();
        const averageResponseTime = session.responses.reduce((sum, r) => sum + r.duration, 0) / session.responses.length;
        const totalWords = session.responses.reduce((sum, r) => sum + r.response.split(/\s+/).length, 0);
        const averageWordsPerResponse = totalWords / session.responses.length;
        const fillerWordCount = session.responses.reduce((sum, r) =>
            sum + (r.realTimeAnalysis?.fillerWords || 0), 0);

        return {
            totalDuration: totalDuration / 1000, // Convert to seconds
            questionCount: session.questions.length,
            averageResponseTime,
            totalWords,
            averageWordsPerResponse,
            fillerWordCount,
            confidenceTrend: session.responses.map(r => r.confidence),
            performanceTrend: session.responses.map(r => r.quality.clarity),
            improvementAreas: ['delivery', 'structure'], // Placeholder
            strongAreas: ['content', 'relevance'] // Placeholder
        };
    }

    private async generateFinalFeedback(session: MockInterviewSession): Promise<InterviewFeedback> {
        const overallScore = this.calculateOverallScore(session);
        const categoryScores = this.calculateCategoryScores(session);
        const strengths = this.identifyStrengths(session);
        const improvements = this.identifyImprovements(session);
        const recommendations = this.generateRecommendations(session);

        return {
            overallScore,
            categoryScores,
            strengths,
            improvements,
            specificFeedback: [], // Would be populated with detailed feedback
            recommendations,
            nextSteps: ['Practice with more questions', 'Work on identified areas'],
            confidenceLevel: this.calculateAverageConfidence(session),
            preparationLevel: this.calculatePreparationLevel(session)
        };
    }

    private calculateOverallScore(session: MockInterviewSession): number {
        const responseScores = session.responses.map(r =>
            (r.quality.clarity + r.quality.relevance + r.quality.completeness + r.quality.specificity) / 4
        );
        return responseScores.reduce((sum, score) => sum + score, 0) / responseScores.length * 10;
    }

    private calculateCategoryScores(session: MockInterviewSession): CategoryScore[] {
        return [
            {
                category: 'Communication',
                score: 7.5,
                maxScore: 10,
                feedback: 'Good clarity and engagement',
                benchmarks: this.createDefaultBenchmark()
            },
            {
                category: 'Content',
                score: 8.0,
                maxScore: 10,
                feedback: 'Relevant and specific answers',
                benchmarks: this.createDefaultBenchmark()
            },
            {
                category: 'Structure',
                score: 6.5,
                maxScore: 10,
                feedback: 'Room for improvement in answer structure',
                benchmarks: this.createDefaultBenchmark()
            }
        ];
    }

    private createDefaultBenchmark(): BenchmarkComparison {
        return {
            userScore: 7.5,
            industryAverage: 7.0,
            topPerformers: 9.0,
            improvementPotential: 1.5,
            ranking: 'Above Average'
        };
    }

    private identifyStrengths(session: MockInterviewSession): string[] {
        return [
            'Good technical knowledge',
            'Provides specific examples',
            'Shows enthusiasm'
        ];
    }

    private identifyImprovements(session: MockInterviewSession): string[] {
        return [
            'Reduce filler words',
            'Improve answer structure',
            'Practice pacing'
        ];
    }

    private generateRecommendations(session: MockInterviewSession): Recommendation[] {
        return [
            {
                type: 'answer_structure',
                priority: 'high',
                title: 'Practice STAR Method',
                description: 'Master the STAR method for behavioral questions',
                actionItems: [
                    'Study STAR method examples',
                    'Practice with common scenarios',
                    'Record and review practice sessions'
                ],
                resources: [],
                timeline: '2-3 weeks',
                expectedImpact: 'Improve behavioral question scores by 20%'
            }
        ];
    }

    private calculateAverageConfidence(session: MockInterviewSession): number {
        const confidenceScores = session.responses.map(r => r.confidence);
        return confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length;
    }

    private calculatePreparationLevel(session: MockInterviewSession): number {
        // Placeholder calculation based on response quality
        return 7.5;
    }

    private createDefaultFeedback(): InterviewFeedback {
        return {
            overallScore: 0,
            categoryScores: [],
            strengths: [],
            improvements: [],
            specificFeedback: [],
            recommendations: [],
            nextSteps: [],
            confidenceLevel: 0,
            preparationLevel: 0
        };
    }

    private createDefaultMetrics(): InterviewMetrics {
        return {
            totalDuration: 0,
            questionCount: 0,
            averageResponseTime: 0,
            totalWords: 0,
            averageWordsPerResponse: 0,
            fillerWordCount: 0,
            confidenceTrend: [],
            performanceTrend: [],
            improvementAreas: [],
            strongAreas: []
        };
    }

    private initializeQuestionBank(): void {
        // Initialize with sample questions
        this.questionBank.set('behavioral', [
            {
                id: 'behav_001',
                question: 'Tell me about a time when you had to deal with a difficult team member.',
                type: 'behavioral',
                category: 'teamwork',
                difficulty: 6,
                timeLimit: 120,
                followUpQuestions: [
                    'What was the outcome?',
                    'What did you learn from this experience?'
                ],
                evaluationCriteria: [],
                tips: ['Use STAR method', 'Focus on resolution'],
                keywords: ['teamwork', 'conflict', 'resolution'],
                context: 'Assesses teamwork and conflict resolution skills'
            }
        ]);
    }

    private initializeEvaluationTemplates(): void {
        // Initialize evaluation templates for different question types
    }
}