export interface LLMRequest {
  messages: LLMMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
  stream?: boolean;
  provider?: string;
  systemPrompt?: string;
  metadata?: Record<string, any>;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string;
  functionCall?: FunctionCall;
}

export interface FunctionCall {
  name: string;
  arguments: string;
}

export interface LLMResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: LLMChoice[];
  usage?: TokenUsage;
  metadata?: Record<string, any>;
  provider: string;
  processingTime?: number;
}

export interface LLMChoice {
  index: number;
  message: LLMMessage;
  finishReason: string | null;
  delta?: LLMMessage;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface LLMProvider {
  generateCompletion(request: LLMRequest): Promise<LLMResponse>;
  generateCompletionStream(request: LLMRequest): AsyncGenerator<string>;
  supportsStreaming(): boolean;
  getName(): string;
  getAvailableModels(): string[];
  getPrimaryModel(): string;
  getFallbackModels(): string[];
  getModelInfo(model: string): ModelInfo;
  checkHealth(): Promise<boolean>;
  isHealthy(): boolean;
  shutdown(): Promise<void>;
}

export interface ModelInfo {
  name: string;
  maxTokens: number;
  contextWindow: number;
  supportsStreaming: boolean;
  supportsFunctionCalling: boolean;
  costPer1KTokens: {
    input: number;
    output: number;
  };
  capabilities: string[];
}

export interface ModelConfiguration {
  primary: string;
  fallback: string[];
}

export interface ProviderConfig {
  apiKey: string;
  baseUrl?: string;
  models: ModelConfiguration;
  rateLimit: {
    requests: number;
    window: number;
  };
  timeout?: number;
  retryAttempts?: number;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: TemplateVariable[];
  category: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface PromptContext {
  [key: string]: any;
}

export interface PromptEngine {
  renderTemplate(template: string, context: PromptContext): string;
  validateTemplate(template: string): ValidationResult;
  getVariables(template: string): TemplateVariable[];
  compileTemplate(template: string): CompiledTemplate;
}

export interface CompiledTemplate {
  render(context: PromptContext): string;
  variables: TemplateVariable[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface FunctionDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface Tool {
  type: 'function';
  function: FunctionDefinition;
}

export interface LLMCache {
  get(key: string): Promise<LLMResponse | null>;
  set(key: string, response: LLMResponse, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
}

export interface LLMAnalytics {
  trackRequest(request: LLMRequest, response: LLMResponse, duration: number): void;
  trackError(error: Error, request: LLMRequest): void;
  getMetrics(): AnalyticsMetrics;
  exportMetrics(format: 'json' | 'csv'): string;
}

export interface AnalyticsMetrics {
  totalRequests: number;
  totalTokens: number;
  averageResponseTime: number;
  successRate: number;
  errorRate: number;
  providerUsage: Record<string, number>;
  modelUsage: Record<string, number>;
  costEstimate: number;
  errorsByType: Record<string, number>;
}

export interface SafetySettings {
  harassment: 'BLOCK_NONE' | 'BLOCK_FEW' | 'BLOCK_SOME' | 'BLOCK_MOST';
  hateSpeech: 'BLOCK_NONE' | 'BLOCK_FEW' | 'BLOCK_SOME' | 'BLOCK_MOST';
  sexuallyExplicit: 'BLOCK_NONE' | 'BLOCK_FEW' | 'BLOCK_SOME' | 'BLOCK_MOST';
  dangerousContent: 'BLOCK_NONE' | 'BLOCK_FEW' | 'BLOCK_SOME' | 'BLOCK_MOST';
}

export interface ContentFilter {
  filterContent(content: string): Promise<ContentFilterResult>;
  setSafetySettings(settings: SafetySettings): void;
  getSafetySettings(): SafetySettings;
}

export interface ContentFilterResult {
  filtered: boolean;
  categories: string[];
  confidence: number;
  originalContent: string;
  filteredContent?: string;
}