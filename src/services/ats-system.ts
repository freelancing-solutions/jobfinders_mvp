import { OpenRouterClient } from '@/lib/openrouter';
import { prisma } from '@/lib/prisma';
import { createVectorStore } from '@/lib/vector-store';

export class ATSSystem {
  private ai: OpenRouterClient;
  private vectorStore: any;

  constructor() {
    this.ai = new OpenRouterClient({
      apiKey: process.env.OPENROUTER_API_KEY!,
      models: { primary: 'claude-2', fallback: 'gpt-3.5-turbo' }
    });
    this.vectorStore = createVectorStore();
  }

  async analyzeResume(resumeText: string, jobDescription: string): Promise<{
    score: number;
    suggestions: string[];
  }> {
    const analysis = await this.ai.chatCompletion({
      model: 'claude-2',
      messages: [{
        role: 'user',
        content: `Analyze this resume against the job description. 
                 Format: JSON with scores and recommendations.
                 Resume: ${resumeText}
                 Job: ${jobDescription}`
      }]
    });

    const result = this.processAnalysis(analysis);
    return {
      score: result.score || 0,
      suggestions: result.suggestions || []
    };
  }

  async analyzeResumeMatch({
    resumeUrl,
    jobDescription,
    requirements
  }: {
    resumeUrl: string;
    jobDescription: string;
    requirements: string;
  }): Promise<{
    score: number;
    suggestions: string[];
  }> {
    const resumeResponse = await fetch(resumeUrl);
    const resumeText = await resumeResponse.text();
    return this.analyzeResume(resumeText, jobDescription);
  }
}