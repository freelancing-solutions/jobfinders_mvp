export enum AgentType {
  CAREER_GUIDANCE = 'career_guidance',
  INTERVIEW_PREPARATION = 'interview_preparation',
  APPLICATION_ASSISTANT = 'application_assistant',
  EMPLOYER_ASSISTANT = 'employer_assistant',
  NETWORKING_ASSISTANT = 'networking_assistant'
}

export enum AgentIntent {
  CAREER_GUIDANCE = 'career_guidance',
  SKILL_ANALYSIS = 'skill_analysis',
  MARKET_INTELLIGENCE = 'market_intelligence',
  MOCK_INTERVIEW = 'mock_interview',
  INTERVIEW_PREPARATION = 'interview_preparation',
  APPLICATION_OPTIMIZATION = 'application_optimization',
  APPLICATION_TRACKING = 'application_tracking',
  APPLICATION_ASSISTANCE = 'application_assistance',
  CANDIDATE_SCREENING = 'candidate_screening',
  JOB_POSTING_OPTIMIZATION = 'job_posting_optimization',
  EMPLOYER_ASSISTANCE = 'employer_assistance',
  CONNECTION_RECOMMENDATIONS = 'connection_recommendations',
  NETWORKING_ASSISTANCE = 'networking_assistance',
  GENERAL_ASSISTANCE = 'general_assistance'
}

export enum AgentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BUSY = 'busy',
  ERROR = 'error',
  MAINTENANCE = 'maintenance'
}

export enum MessageType {
  TEXT = 'text',
  AUDIO = 'audio',
  FILE = 'file',
  STRUCTURED_DATA = 'structured_data'
}

export interface AgentCapabilities {
  supportedIntents: AgentIntent[];
  primaryIntents: AgentIntent[];
  maxConcurrency: number;
  averageResponseTime: number;
  supportedLanguages: string[];
  supportsVoice: boolean;
  supportsFileUpload: boolean;
  features: string[];
}

export interface AgentConfiguration {
  agentId: string;
  agentType: AgentType;
  name: string;
  description: string;
  capabilities: AgentCapabilities;
  modelConfig: ModelConfiguration;
  behaviorSettings: BehaviorSettings;
  integrations: string[];
  version: string;
  isActive: boolean;
}

export interface ModelConfiguration {
  primaryModel: string;
  fallbackModels: string[];
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  responseFormat: 'text' | 'json' | 'structured';
  tools: string[];
}

export interface BehaviorSettings {
  personality: 'professional' | 'friendly' | 'casual' | 'formal';
  responseStyle: 'concise' | 'detailed' | 'comprehensive';
  proactivity: 'reactive' | 'moderate' | 'proactive';
  followUpEnabled: boolean;
  suggestionEnabled: boolean;
  learningEnabled: boolean;
  customInstructions?: string;
}

export interface AgentRequest {
  message: string;
  context: Record<string, any>;
  sessionId: string;
  userId: string;
  preferences?: Record<string, any>;
  attachments?: AgentAttachment[];
  messageType: MessageType;
}

export interface AgentResponse {
  content: string;
  suggestions?: string[];
  actions?: AgentAction[];
  metadata?: Record<string, any>;
  attachments?: AgentAttachment[];
  nextActions?: string[];
  confidence?: number;
}

export interface AgentAction {
  type: string;
  payload: Record<string, any>;
  description: string;
  confirmationRequired: boolean;
  icon?: string;
  url?: string;
}

export interface AgentAttachment {
  id: string;
  type: 'file' | 'image' | 'document' | 'link';
  name: string;
  url?: string;
  data?: string;
  metadata?: Record<string, any>;
}

export interface AgentMetrics {
  totalRequests: number;
  successfulRequests: number;
  averageResponseTime: number;
  userSatisfactionScore: number;
  errorRate: number;
  uptime: number;
  concurrentSessions: number;
  resourceUsage: {
    cpu: number;
    memory: number;
    tokens: number;
  };
}

export interface AgentHealth {
  status: AgentStatus;
  lastCheck: Date;
  responseTime: number;
  errorCount: number;
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
  activeConnections: number;
}

export interface AgentFeedback {
  agentId: string;
  userId: string;
  sessionId: string;
  rating: number;
  comment?: string;
  category: 'accuracy' | 'helpfulness' | 'response_time' | 'overall';
  timestamp: Date;
  context?: Record<string, any>;
}

export interface AgentConversation {
  sessionId: string;
  agentId: string;
  userId: string;
  messages: ConversationMessage[];
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'completed' | 'abandoned';
  metadata?: Record<string, any>;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  messageType: MessageType;
  attachments?: AgentAttachment[];
  metadata?: Record<string, any>;
  processingTime?: number;
  confidence?: number;
}

export interface AgentWorkflow {
  workflowId: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  triggers: WorkflowTrigger[];
  conditions: WorkflowCondition[];
  isActive: boolean;
}

export interface WorkflowStep {
  stepId: string;
  agentType: AgentType;
  order: number;
  config: Record<string, any>;
  conditions?: WorkflowCondition[];
  timeout?: number;
  retryPolicy?: RetryPolicy;
}

export interface WorkflowTrigger {
  type: 'manual' | 'schedule' | 'event' | 'intent';
  config: Record<string, any>;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffType: 'fixed' | 'exponential' | 'linear';
  initialDelay: number;
  maxDelay: number;
}

export interface AgentIntegration {
  integrationId: string;
  name: string;
  type: 'api' | 'webhook' | 'database' | 'file';
  config: Record<string, any>;
  permissions: string[];
  isActive: boolean;
}

export interface AgentTemplate {
  templateId: string;
  name: string;
  description: string;
  agentType: AgentType;
  content: string;
  variables: TemplateVariable[];
  category: string;
  isActive: boolean;
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  defaultValue?: any;
}

export interface AgentAnalytics {
  agentId: string;
  period: 'hourly' | 'daily' | 'weekly' | 'monthly';
  metrics: {
    totalRequests: number;
    averageResponseTime: number;
    userSatisfaction: number;
    errorRate: number;
    popularIntents: Array<{
      intent: AgentIntent;
      count: number;
    }>;
    userDemographics: Record<string, number>;
    featureUsage: Record<string, number>;
  };
  timestamp: Date;
}

export interface AgentAlert {
  alertId: string;
  agentId: string;
  type: 'error' | 'performance' | 'security' | 'usage';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

// Networking-specific types
export interface NetworkingRequest {
  action: 'generate_strategy' | 'generate_outreach' | 'track_networking' | 'analyze_events' |
          'get_recommendations' | 'manage_contacts' | 'plan_networking';
  data: any;
}

export interface NetworkingResponse {
  strategy?: NetworkingStrategy;
  actionPlan?: any;
  recommendations?: any[];
  message?: OutreachMessage;
  followUps?: string[];
  analysis?: any;
  insights?: any[];
  metrics?: any;
  events?: any[];
  opportunities?: any[];
  contacts?: any[];
  plan?: any;
  schedule?: any;
  trackingSystem?: any;
  milestones?: any[];
  resources?: any[];
}

export interface NetworkingStrategy {
  overview: string;
  targetNetworks: any[];
  platformStrategies: any[];
  contentStrategy: any;
  goals: NetworkingGoal[];
  actionPlan: any;
  metrics: any;
  timeline: string;
  estimatedTimeCommitment: string;
  expectedOutcomes: string[];
}

export interface NetworkingGoal {
  title: string;
  description: string;
  target: string | number;
  timeframe: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
}

export interface OutreachMessage {
  content: string;
  subjectLine?: string;
  platform: string;
  tone: string;
  purpose: string;
  personalizationElements: any[];
  callToAction: string;
  followUpTiming: string;
  effectiveness: number;
  template: string;
  tips: string[];
}

export interface NetworkingTemplate {
  id: string;
  name: string;
  category: 'outreach' | 'follow_up' | 'thank_you' | 'introduction';
  platform: string;
  purpose: string;
  content: string;
  variables: string[];
  tone: string;
  effectiveness: number;
}

export interface NetworkingContact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  role?: string;
  industry?: string;
  location?: string;
  relationshipType: 'prospect' | 'contact' | 'connection' | 'mentor' | 'mentee';
  strength: 'weak' | 'moderate' | 'strong';
  lastContact?: Date;
  notes?: string;
  tags: string[];
  source: string;
  dateAdded: Date;
}

export interface NetworkingEvent {
  id: string;
  title: string;
  description: string;
  type: 'virtual' | 'in-person' | 'hybrid';
  date: Date;
  location?: string;
  organizer: string;
  attendees: number;
  cost: number;
  tags: string[];
  relevanceScore: number;
  networkingValue: 'low' | 'medium' | 'high';
  registrationDeadline: Date;
  status: 'upcoming' | 'attended' | 'missed';
}