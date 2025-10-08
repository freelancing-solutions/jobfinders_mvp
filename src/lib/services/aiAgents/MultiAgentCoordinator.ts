import { BaseAgent } from './AIAgentFramework';
import { AgentResponse, AgentContext, AgentType } from '@/types/agents';
import {
  CareerGuidanceAgent,
  InterviewPreparationAgent,
  ApplicationAssistantAgent,
  EmployerAssistantAgent,
  NetworkingAssistantAgent
} from './index';

export interface AgentTask {
  id: string;
  type: AgentType;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  data: any;
  dependencies: string[];
  estimatedDuration: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  createdAt: Date;
  assignedAt?: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
}

export interface AgentWorkflow {
  id: string;
  name: string;
  description: string;
  userId: string;
  goal: string;
  tasks: AgentTask[];
  currentStep: number;
  status: 'planning' | 'executing' | 'completed' | 'failed' | 'paused';
  context: AgentContext;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  results: Record<string, any>;
}

export interface AgentCollaboration {
  id: string;
  primaryAgent: AgentType;
  supportingAgents: AgentType[];
  collaborationType: 'sequential' | 'parallel' | 'hierarchical';
  workflow: string;
  dataFlow: Array<{
    from: AgentType;
    to: AgentType;
    data: string;
    condition?: string;
  }>;
  status: 'active' | 'completed' | 'failed';
}

export interface CoordinationStrategy {
  type: 'pipeline' | 'orchestration' | 'consensus' | 'competition';
  agents: AgentType[];
  rules: Array<{
    condition: string;
    action: string;
    priority: number;
  }>;
  conflictResolution: 'priority' | 'consensus' | 'specialist';
  qualityGates: Array<{
    step: number;
    requirements: string[];
    approvers: AgentType[];
  }>;
}

export class MultiAgentCoordinator {
  private agents: Map<AgentType, BaseAgent>;
  private workflows: Map<string, AgentWorkflow>;
  private collaborations: Map<string, AgentCollaboration>;
  private taskQueue: AgentTask[];
  private executionHistory: Array<{
    workflowId: string;
    agent: AgentType;
    task: string;
    result: any;
    timestamp: Date;
  }>;

  constructor() {
    this.agents = new Map();
    this.workflows = new Map();
    this.collaborations = new Map();
    this.taskQueue = [];
    this.executionHistory = [];

    this.initializeAgents();
  }

  private initializeAgents(): void {
    this.agents.set(AgentType.CAREER_GUIDANCE, new CareerGuidanceAgent());
    this.agents.set(AgentType.INTERVIEW_PREPARATION, new InterviewPreparationAgent());
    this.agents.set(AgentType.APPLICATION_ASSISTANT, new ApplicationAssistantAgent());
    this.agents.set(AgentType.EMPLOYER_ASSISTANT, new EmployerAssistantAgent());
    this.agents.set(AgentType.NETWORKING_ASSISTANT, new NetworkingAssistantAgent());
  }

  async createWorkflow(
    userId: string,
    goal: string,
    context: AgentContext,
    strategy?: CoordinationStrategy
  ): Promise<AgentWorkflow> {
    const workflowId = 'workflow-' + Date.now();

    // Analyze goal and determine required agents and tasks
    const plan = await this.planExecution(goal, context, strategy);

    const workflow: AgentWorkflow = {
      id: workflowId,
      name: this.generateWorkflowName(goal),
      description: `Multi-agent workflow for: ${goal}`,
      userId,
      goal,
      tasks: plan.tasks,
      currentStep: 0,
      status: 'planning',
      context,
      createdAt: new Date(),
      updatedAt: new Date(),
      results: {}
    };

    this.workflows.set(workflowId, workflow);
    this.taskQueue.push(...plan.tasks);

    return workflow;
  }

  async executeWorkflow(workflowId: string): Promise<AgentWorkflow> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    workflow.status = 'executing';
    workflow.updatedAt = new Date();

    try {
      // Sort tasks by priority and dependencies
      const sortedTasks = this.sortTasksByDependencies(workflow.tasks);

      for (const task of sortedTasks) {
        if (task.status === 'cancelled') continue;

        // Check if dependencies are satisfied
        if (!this.areDependenciesSatisfied(task, workflow)) {
          continue;
        }

        task.status = 'in_progress';
        task.assignedAt = new Date();

        try {
          const agent = this.agents.get(task.type);
          if (!agent) {
            throw new Error(`Agent ${task.type} not available`);
          }

          const taskContext = {
            ...workflow.context,
            workflowId,
            taskId: task.id,
            previousResults: workflow.results
          };

          const result = await agent.processMessage(task.description, taskContext);

          task.status = 'completed';
          task.completedAt = new Date();
          task.result = result;

          workflow.results[task.id] = result;
          workflow.currentStep++;
          workflow.updatedAt = new Date();

          // Record execution
          this.executionHistory.push({
            workflowId,
            agent: task.type,
            task: task.description,
            result,
            timestamp: new Date()
          });

          // Check if this result triggers other tasks
          await this.checkForTriggeredTasks(task, workflow);

        } catch (error) {
          task.status = 'failed';
          task.error = error instanceof Error ? error.message : 'Unknown error';

          // Decide whether to continue or abort workflow
          if (task.priority === 'urgent' || task.priority === 'high') {
            workflow.status = 'failed';
            break;
          }
        }
      }

      // Check if all tasks are completed
      if (workflow.tasks.every(t => t.status === 'completed' || t.status === 'cancelled')) {
        workflow.status = 'completed';
        workflow.completedAt = new Date();
      }

    } catch (error) {
      workflow.status = 'failed';
      console.error('Workflow execution failed:', error);
    }

    this.workflows.set(workflowId, workflow);
    return workflow;
  }

  async orchestrateAgents(
    userId: string,
    request: string,
    context: AgentContext
  ): Promise<{
    primaryResponse: AgentResponse;
    supportingResponses: AgentResponse[];
    coordination: AgentCollaboration;
  }> {
    // Analyze request to determine which agents should be involved
    const agentAnalysis = await this.analyzeRequestForAgents(request, context);

    const coordinationId = 'coord-' + Date.now();
    const coordination: AgentCollaboration = {
      id: coordinationId,
      primaryAgent: agentAnalysis.primaryAgent,
      supportingAgents: agentAnalysis.supportingAgents,
      collaborationType: agentAnalysis.collaborationType,
      workflow: 'ad-hoc',
      dataFlow: agentAnalysis.dataFlow,
      status: 'active'
    };

    this.collaborations.set(coordinationId, coordination);

    try {
      // Execute primary agent
      const primaryAgent = this.agents.get(agentAnalysis.primaryAgent);
      if (!primaryAgent) {
        throw new Error(`Primary agent ${agentAnalysis.primaryAgent} not available`);
      }

      const primaryResponse = await primaryAgent.processMessage(request, context);

      // Execute supporting agents in parallel or sequentially based on collaboration type
      const supportingPromises = agentAnalysis.supportingAgents.map(async (agentType) => {
        const agent = this.agents.get(agentType);
        if (!agent) return null;

        const supportingContext = {
          ...context,
          coordinationId,
          primaryResponse: primaryResponse.content,
          role: 'supporting'
        };

        return agent.processMessage(
          this.generateSupportingTask(agentType, request, primaryResponse),
          supportingContext
        );
      });

      const supportingResponses = (await Promise.all(supportingPromises))
        .filter(response => response !== null) as AgentResponse[];

      coordination.status = 'completed';
      this.collaborations.set(coordinationId, coordination);

      return {
        primaryResponse,
        supportingResponses,
        coordination
      };

    } catch (error) {
      coordination.status = 'failed';
      this.collaborations.set(coordinationId, coordination);
      throw error;
    }
  }

  async getWorkflowStatus(workflowId: string): Promise<AgentWorkflow | null> {
    return this.workflows.get(workflowId) || null;
  }

  async pauseWorkflow(workflowId: string): Promise<void> {
    const workflow = this.workflows.get(workflowId);
    if (workflow) {
      workflow.status = 'paused';
      workflow.updatedAt = new Date();
      this.workflows.set(workflowId, workflow);
    }
  }

  async resumeWorkflow(workflowId: string): Promise<void> {
    const workflow = this.workflows.get(workflowId);
    if (workflow && workflow.status === 'paused') {
      workflow.status = 'executing';
      workflow.updatedAt = new Date();
      this.workflows.set(workflowId, workflow);
      await this.executeWorkflow(workflowId);
    }
  }

  async cancelWorkflow(workflowId: string): Promise<void> {
    const workflow = this.workflows.get(workflowId);
    if (workflow) {
      workflow.status = 'cancelled';
      workflow.tasks.forEach(task => {
        if (task.status === 'pending' || task.status === 'in_progress') {
          task.status = 'cancelled';
        }
      });
      workflow.updatedAt = new Date();
      this.workflows.set(workflowId, workflow);
    }
  }

  async getExecutionHistory(userId?: string): Promise<any[]> {
    if (userId) {
      return this.executionHistory.filter(entry => {
        const workflow = this.workflows.get(entry.workflowId);
        return workflow?.userId === userId;
      });
    }
    return this.executionHistory;
  }

  async getActiveWorkflows(userId?: string): Promise<AgentWorkflow[]> {
    const workflows = Array.from(this.workflows.values());
    return userId
      ? workflows.filter(w => w.userId === userId && w.status === 'executing')
      : workflows.filter(w => w.status === 'executing');
  }

  async getCompletedWorkflows(userId?: string): Promise<AgentWorkflow[]> {
    const workflows = Array.from(this.workflows.values());
    return userId
      ? workflows.filter(w => w.userId === userId && w.status === 'completed')
      : workflows.filter(w => w.status === 'completed');
  }

  // Private helper methods

  private async planExecution(
    goal: string,
    context: AgentContext,
    strategy?: CoordinationStrategy
  ): Promise<{ tasks: AgentTask[] }> {
    const prompt = `
      Analyze this goal and create a step-by-step plan for AI agents to accomplish it:

      Goal: ${goal}
      User Context: ${JSON.stringify(context.userPreferences || {})}

      Available Agents:
      - Career Guidance Agent: Career path analysis, skill gap identification, market intelligence
      - Interview Preparation Agent: Mock interviews, answer optimization, interview coaching
      - Application Assistant Agent: Resume optimization, application tracking, document generation
      - Employer Assistant Agent: Candidate screening, job posting optimization, interview coordination
      - Networking Assistant Agent: Connection recommendations, outreach generation, relationship management

      Create a detailed plan with specific tasks for each agent. Consider dependencies between tasks.
      Return a JSON object with:
      {
        "tasks": [
          {
            "type": "agent_type",
            "description": "specific task description",
            "priority": "low|medium|high|urgent",
            "estimatedDuration": minutes,
            "dependencies": ["task_id1", "task_id2"]
          }
        ]
      }
    `;

    const response = await this.agents.get(AgentType.CAREER_GUIDANCE)?.callLLM([
      {
        role: 'system',
        content: 'You are an AI workflow planner. Create detailed, actionable plans for multi-agent coordination.'
      },
      {
        role: 'user',
        content: prompt
      }
    ]);

    const plan = JSON.parse(response?.content || '{"tasks": []}');

    // Convert to AgentTask objects
    const tasks: AgentTask[] = plan.tasks.map((task: any, index: number) => ({
      id: `task-${Date.now()}-${index}`,
      type: task.type,
      priority: task.priority,
      description: task.description,
      data: {},
      dependencies: task.dependencies || [],
      estimatedDuration: task.estimatedDuration || 5,
      status: 'pending' as const,
      createdAt: new Date()
    }));

    return { tasks };
  }

  private sortTasksByDependencies(tasks: AgentTask[]): AgentTask[] {
    const sorted: AgentTask[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (task: AgentTask) => {
      if (visiting.has(task.id)) {
        throw new Error(`Circular dependency detected involving task ${task.id}`);
      }
      if (visited.has(task.id)) return;

      visiting.add(task.id);

      // Visit dependencies first
      for (const depId of task.dependencies) {
        const depTask = tasks.find(t => t.id === depId);
        if (depTask) {
          visit(depTask);
        }
      }

      visiting.delete(task.id);
      visited.add(task.id);
      sorted.push(task);
    };

    for (const task of tasks) {
      visit(task);
    }

    return sorted.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private areDependenciesSatisfied(task: AgentTask, workflow: AgentWorkflow): boolean {
    return task.dependencies.every(depId => {
      const depTask = workflow.tasks.find(t => t.id === depId);
      return depTask?.status === 'completed';
    });
  }

  private async checkForTriggeredTasks(completedTask: AgentTask, workflow: AgentWorkflow): Promise<void> {
    // Check if completed task results should trigger additional tasks
    for (const task of workflow.tasks) {
      if (task.status === 'pending' && task.dependencies.length === 0) {
        // Check if this task should be triggered by the completed task
        const shouldTrigger = await this.evaluateTaskTrigger(completedTask, task);
        if (shouldTrigger) {
          task.dependencies.push(completedTask.id);
        }
      }
    }
  }

  private async evaluateTaskTrigger(completedTask: AgentTask, potentialTask: AgentTask): Promise<boolean> {
    // Simple heuristic - in production, this would be more sophisticated
    const completedKeywords = completedTask.description.toLowerCase().split(' ');
    const potentialKeywords = potentialTask.description.toLowerCase().split(' ');

    const intersection = completedKeywords.filter(word =>
      potentialKeywords.includes(word) && word.length > 3
    );

    return intersection.length > 2;
  }

  private async analyzeRequestForAgents(
    request: string,
    context: AgentContext
  ): Promise<{
    primaryAgent: AgentType;
    supportingAgents: AgentType[];
    collaborationType: 'sequential' | 'parallel' | 'hierarchical';
    dataFlow: Array<{ from: AgentType; to: AgentType; data: string; condition?: string }>;
  }> {
    const prompt = `
      Analyze this request and determine which AI agents should be involved:

      Request: ${request}
      Context: ${JSON.stringify(context)}

      Determine:
      1. The primary agent that should handle this request
      2. Supporting agents that could provide additional value
      3. Whether to work sequentially, in parallel, or hierarchically
      4. How data should flow between agents

      Return JSON with:
      {
        "primaryAgent": "agent_type",
        "supportingAgents": ["agent_type1", "agent_type2"],
        "collaborationType": "sequential|parallel|hierarchical",
        "dataFlow": [
          {"from": "agent_type", "to": "agent_type", "data": "description"}
        ]
      }
    `;

    const agent = this.agents.get(AgentType.CAREER_GUIDANCE);
    const response = await agent?.callLLM([
      {
        role: 'system',
        content: 'You are an AI coordinator. Analyze requests and determine optimal agent collaboration strategies.'
      },
      {
        role: 'user',
        content: prompt
      }
    ]);

    return JSON.parse(response?.content || '{}');
  }

  private generateSupportingTask(
    agentType: AgentType,
    originalRequest: string,
    primaryResponse: AgentResponse
  ): string {
    const agentTasks = {
      [AgentType.CAREER_GUIDANCE]: `Given this request: "${originalRequest}" and the primary response: "${primaryResponse.content}", provide career guidance insights that complement or enhance the response.`,
      [AgentType.INTERVIEW_PREPARATION]: `Based on this request: "${originalRequest}" and the primary response: "${primaryResponse.content}", provide interview preparation tips or coaching related to the topic.`,
      [AgentType.APPLICATION_ASSISTANT]: `With this request: "${originalRequest}" and primary response: "${primaryResponse.content}", suggest application strategies or document improvements that would support the user.`,
      [AgentType.EMPLOYER_ASSISTANT]: `Considering this request: "${originalRequest}" and primary response: "${primaryResponse.content}", provide employer perspective or hiring insights that add value.`,
      [AgentType.NETWORKING_ASSISTANT]: `Given this request: "${originalRequest}" and primary response: "${primaryResponse.content}", suggest networking strategies or connection opportunities that could help.`
    };

    return agentTasks[agentType] || `Provide your expertise related to this request: "${originalRequest}" and enhance the primary response: "${primaryResponse.content}"`;
  }

  private generateWorkflowName(goal: string): string {
    const nameMap: Record<string, string> = {
      'job search': 'Job Search Campaign',
      'career change': 'Career Transition Plan',
      'interview preparation': 'Interview Prep Program',
      'resume optimization': 'Resume Enhancement Project',
      'networking': 'Network Building Strategy',
      'salary negotiation': 'Salary Negotiation Strategy',
      'skill development': 'Skill Development Plan'
    };

    const lowerGoal = goal.toLowerCase();
    for (const [key, name] of Object.entries(nameMap)) {
      if (lowerGoal.includes(key)) {
        return name;
      }
    }

    return `AI Agent Workflow: ${goal.substring(0, 50)}${goal.length > 50 ? '...' : ''}`;
  }

  // Analytics and monitoring methods

  async getCoordinationAnalytics(): Promise<{
    totalWorkflows: number;
    activeWorkflows: number;
    completedWorkflows: number;
    averageCompletionTime: number;
    agentUsage: Record<AgentType, number>;
    successRate: number;
    commonCollaborations: Array<{
      agents: AgentType[];
      frequency: number;
    }>;
  }> {
    const workflows = Array.from(this.workflows.values());
    const completedWorkflows = workflows.filter(w => w.status === 'completed');

    const agentUsage: Record<AgentType, number> = {
      [AgentType.CAREER_GUIDANCE]: 0,
      [AgentType.INTERVIEW_PREPARATION]: 0,
      [AgentType.APPLICATION_ASSISTANT]: 0,
      [AgentType.EMPLOYER_ASSISTANT]: 0,
      [AgentType.NETWORKING_ASSISTANT]: 0
    };

    // Count agent usage
    workflows.forEach(workflow => {
      workflow.tasks.forEach(task => {
        if (agentUsage[task.type] !== undefined) {
          agentUsage[task.type]++;
        }
      });
    });

    // Calculate common collaborations
    const collaborations = new Map<string, number>();
    this.executionHistory.forEach(entry => {
      const workflow = this.workflows.get(entry.workflowId);
      if (workflow) {
        const agents = workflow.tasks.map(t => t.type).sort().join('-');
        collaborations.set(agents, (collaborations.get(agents) || 0) + 1);
      }
    });

    const commonCollaborations = Array.from(collaborations.entries())
      .map(([agents, frequency]) => ({
        agents: agents.split('-') as AgentType[],
        frequency
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);

    return {
      totalWorkflows: workflows.length,
      activeWorkflows: workflows.filter(w => w.status === 'executing').length,
      completedWorkflows: completedWorkflows.length,
      averageCompletionTime: this.calculateAverageCompletionTime(completedWorkflows),
      agentUsage,
      successRate: completedWorkflows.length / workflows.length || 0,
      commonCollaborations
    };
  }

  private calculateAverageCompletionTime(workflows: AgentWorkflow[]): number {
    if (workflows.length === 0) return 0;

    const totalTime = workflows.reduce((sum, workflow) => {
      if (workflow.completedAt && workflow.createdAt) {
        return sum + (workflow.completedAt.getTime() - workflow.createdAt.getTime());
      }
      return sum;
    }, 0);

    return totalTime / workflows.length / (1000 * 60); // Convert to minutes
  }
}