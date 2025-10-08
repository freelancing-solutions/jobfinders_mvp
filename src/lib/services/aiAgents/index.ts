// AI Agents Framework - Main Entry Point

export { BaseAgent, AgentCoordinator } from './AIAgentFramework';
export { CareerGuidanceAgent } from './CareerGuidanceAgent';
export { InterviewPreparationAgent } from './InterviewPreparationAgent';
export { ApplicationAssistantAgent } from './ApplicationAssistantAgent';
export { EmployerAssistantAgent } from './EmployerAssistantAgent';
export { NetworkingAssistantAgent } from './NetworkingAssistantAgent';

// Types
export type {
  AgentContext,
  AgentResponse,
  AgentCapability,
  BaseAgentConfig,
  ApplicationDocument,
  ApplicationOptimization,
  ApplicationStatus,
  ApplicationChecklist,
  JobPosting
} from '@/types/agents';

// Framework utilities
export const AgentFactory = {
  createAgent: (type: string, config?: any) => {
    switch (type) {
      case 'career-guidance':
        return new CareerGuidanceAgent();
      case 'interview-preparation':
        return new InterviewPreparationAgent();
      case 'application-assistant':
        return new ApplicationAssistantAgent();
      case 'employer-assistant':
        return new EmployerAssistantAgent();
      case 'networking-assistant':
        return new NetworkingAssistantAgent();
      default:
        throw new Error(`Unknown agent type: ${type}`);
    }
  },

  getAvailableAgents: () => [
    {
      type: 'career-guidance',
      name: 'Career Guidance Agent',
      description: 'Provides career path analysis, skill gap identification, and market intelligence',
      capabilities: ['career_analysis', 'skill_assessment', 'market_intelligence']
    },
    {
      type: 'interview-preparation',
      name: 'Interview Preparation Agent',
      description: 'Helps with mock interviews, answer optimization, and interview scheduling',
      capabilities: ['mock_interviews', 'answer_optimization', 'interview_coaching']
    },
    {
      type: 'application-assistant',
      name: 'Application Assistant Agent',
      description: 'Optimizes resumes, tracks applications, and provides application assistance',
      capabilities: ['ats_optimization', 'application_tracking', 'document_generation']
    },
    {
      type: 'employer-assistant',
      name: 'Employer Assistant Agent',
      description: 'Helps employers screen candidates, optimize job postings, and coordinate interviews',
      capabilities: ['candidate_screening', 'job_optimization', 'interview_coordination', 'talent_analysis']
    },
    {
      type: 'networking-assistant',
      name: 'Networking Assistant Agent',
      description: 'Helps with professional networking, connection building, and relationship management',
      capabilities: ['connection_recommendations', 'outreach_generation', 'networking_strategy', 'relationship_management']
    }
  ]
};

// Export constants
export const AGENT_TYPES = {
  CAREER_GUIDANCE: 'career-guidance',
  INTERVIEW_PREPARATION: 'interview-preparation',
  APPLICATION_ASSISTANT: 'application-assistant',
  EMPLOYER_ASSISTANT: 'employer-assistant',
  NETWORKING_ASSISTANT: 'networking-assistant'
} as const;

export const AGENT_CAPABILITIES = {
  CAREER_ANALYSIS: 'career_analysis',
  SKILL_ASSESSMENT: 'skill_assessment',
  MARKET_INTELLIGENCE: 'market_intelligence',
  MOCK_INTERVIEWS: 'mock_interviews',
  ANSWER_OPTIMIZATION: 'answer_optimization',
  INTERVIEW_COACHING: 'interview_coaching',
  ATS_OPTIMIZATION: 'ats_optimization',
  APPLICATION_TRACKING: 'application_tracking',
  DOCUMENT_GENERATION: 'document_generation',
  CANDIDATE_SCREENING: 'candidate_screening',
  JOB_POSTING_OPTIMIZATION: 'job_posting_optimization',
  CONNECTION_RECOMMENDATIONS: 'connection_recommendations',
  NETWORKING_STRATEGY: 'networking_strategy'
} as const;