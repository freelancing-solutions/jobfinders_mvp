import { Logger } from '@/lib/logger';
import { BaseAgent } from './base-agent';
import { AgentStatus } from '@/types/agents';

export interface LifecycleEvent {
  agentId: string;
  agentType: string;
  event: 'started' | 'stopped' | 'paused' | 'resumed' | 'error' | 'shutdown';
  timestamp: Date;
  metadata?: Record<string, any>;
}

export class AgentLifecycleManager {
  private agents: Map<string, BaseAgent> = new Map();
  private eventListeners: Array<(event: LifecycleEvent) => void> = [];
  private logger: Logger;
  private shutdownTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.logger = new Logger('AgentLifecycleManager');
  }

  /**
   * Register an agent with the lifecycle manager
   */
  registerAgent(agent: BaseAgent): void {
    this.agents.set(agent.getAgentId(), agent);
    this.logger.info(`Registered agent ${agent.getAgentId()} with lifecycle manager`);

    // Set up automatic shutdown on process termination
    this.setupGracefulShutdown();
  }

  /**
   * Unregister an agent
   */
  unregisterAgent(agentId: string): void {
    this.agents.delete(agentId);
    this.logger.info(`Unregistered agent ${agentId} from lifecycle manager`);
  }

  /**
   * Start all registered agents
   */
  async startAllAgents(): Promise<void> {
    this.logger.info('Starting all registered agents...');

    const startPromises = Array.from(this.agents.values()).map(async agent => {
      try {
        await agent.start();
        this.emitEvent({
          agentId: agent.getAgentId(),
          agentType: agent.getAgentType(),
          event: 'started',
          timestamp: new Date()
        });
      } catch (error) {
        this.logger.error(`Failed to start agent ${agent.getAgentId()}:`, error);
        this.emitEvent({
          agentId: agent.getAgentId(),
          agentType: agent.getAgentType(),
          event: 'error',
          timestamp: new Date(),
          metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
        });
      }
    });

    await Promise.allSettled(startPromises);
    this.logger.info('Agent startup completed');
  }

  /**
   * Stop all registered agents
   */
  async stopAllAgents(): Promise<void> {
    this.logger.info('Stopping all registered agents...');

    const stopPromises = Array.from(this.agents.values()).map(async agent => {
      try {
        await agent.stop();
        this.emitEvent({
          agentId: agent.getAgentId(),
          agentType: agent.getAgentType(),
          event: 'stopped',
          timestamp: new Date()
        });
      } catch (error) {
        this.logger.error(`Failed to stop agent ${agent.getAgentId()}:`, error);
      }
    });

    await Promise.allSettled(stopPromises);
    this.logger.info('Agent shutdown completed');
  }

  /**
   * Pause all active agents
   */
  async pauseAllAgents(): Promise<void> {
    this.logger.info('Pausing all active agents...');

    const pausePromises = Array.from(this.agents.values())
      .filter(agent => agent.getAgentId() && agent.getAgentId().length > 0)
      .map(async agent => {
        try {
          await agent.pause();
          this.emitEvent({
            agentId: agent.getAgentId(),
            agentType: agent.getAgentType(),
            event: 'paused',
            timestamp: new Date()
          });
        } catch (error) {
          this.logger.error(`Failed to pause agent ${agent.getAgentId()}:`, error);
        }
      });

    await Promise.allSettled(pausePromises);
    this.logger.info('Agent pause completed');
  }

  /**
   * Resume all paused agents
   */
  async resumeAllAgents(): Promise<void> {
    this.logger.info('Resuming all paused agents...');

    const resumePromises = Array.from(this.agents.values()).map(async agent => {
      try {
        await agent.resume();
        this.emitEvent({
          agentId: agent.getAgentId(),
          agentType: agent.getAgentType(),
          event: 'resumed',
          timestamp: new Date()
        });
      } catch (error) {
        this.logger.error(`Failed to resume agent ${agent.getAgentId()}:`, error);
      }
    });

    await Promise.allSettled(resumePromises);
    this.logger.info('Agent resume completed');
  }

  /**
   * Restart a specific agent
   */
  async restartAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    this.logger.info(`Restarting agent ${agentId}...`);

    try {
      await agent.stop();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Brief pause
      await agent.start();

      this.emitEvent({
        agentId: agentId,
        agentType: agent.getAgentType(),
        event: 'started',
        timestamp: new Date(),
        metadata: { restarted: true }
      });

      this.logger.info(`Agent ${agentId} restarted successfully`);

    } catch (error) {
      this.logger.error(`Failed to restart agent ${agentId}:`, error);
      this.emitEvent({
        agentId: agentId,
        agentType: agent.getAgentType(),
        event: 'error',
        timestamp: new Date(),
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          restartAttempt: true
        }
      });
      throw error;
    }
  }

  /**
   * Get status of all agents
   */
  async getAllAgentStatus(): Promise<Record<string, any>> {
    const status: Record<string, any> = {};

    for (const [agentId, agent] of this.agents) {
      try {
        const health = await agent.getHealthStatus();
        const metrics = agent.getMetrics();

        status[agentId] = {
          agentType: agent.getAgentType(),
          status: health.status,
          uptime: health.uptime,
          lastActivity: agent.getLastActivity(),
          metrics: metrics,
          health: health
        };
      } catch (error) {
        status[agentId] = {
          agentType: agent.getAgentType(),
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    return status;
  }

  /**
   * Get agents by status
   */
  getAgentsByStatus(status: AgentStatus): BaseAgent[] {
    return Array.from(this.agents.values()).filter(agent => {
      // This is a simplified check - in a real implementation,
      // you'd need to get the actual status from the agent
      return true; // Placeholder
    });
  }

  /**
   * Get unhealthy agents
   */
  async getUnhealthyAgents(): Promise<Array<{ agent: BaseAgent; health: any }>> {
    const unhealthy: Array<{ agent: BaseAgent; health: any }> = [];

    for (const agent of this.agents.values()) {
      try {
        const health = await agent.getHealthStatus();
        if (health.status === AgentStatus.ERROR || !health.llmHealth?.healthy) {
          unhealthy.push({ agent, health });
        }
      } catch (error) {
        unhealthy.push({
          agent,
          health: { status: AgentStatus.ERROR, error: error instanceof Error ? error.message : 'Unknown error' }
        });
      }
    }

    return unhealthy;
  }

  /**
   * Add event listener
   */
  addEventListener(listener: (event: LifecycleEvent) => void): void {
    this.eventListeners.push(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(listener: (event: LifecycleEvent) => void): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  /**
   * Get all registered agents
   */
  getAgents(): BaseAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): BaseAgent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get agent count by type
   */
  getAgentCountByType(): Record<string, number> {
    const counts: Record<string, number> = {};

    for (const agent of this.agents.values()) {
      const type = agent.getAgentType();
      counts[type] = (counts[type] || 0) + 1;
    }

    return counts;
  }

  /**
   * Setup graceful shutdown
   */
  private setupGracefulShutdown(): void {
    const gracefulShutdown = async () => {
      this.logger.info('Initiating graceful shutdown of all agents...');

      if (this.shutdownTimeout) {
        clearTimeout(this.shutdownTimeout);
      }

      try {
        await this.stopAllAgents();

        this.emitEvent({
          agentId: 'lifecycle-manager',
          agentType: 'system',
          event: 'shutdown',
          timestamp: new Date()
        });

        this.logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        this.logger.error('Error during graceful shutdown:', error);
        process.exit(1);
      }
    };

    // Handle different termination signals
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught exception:', error);
      gracefulShutdown();
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled rejection at:', promise, 'reason:', reason);
      gracefulShutdown();
    });
  }

  /**
   * Emit lifecycle event
   */
  private emitEvent(event: LifecycleEvent): void {
    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch (error) {
        this.logger.error('Error in lifecycle event listener:', error);
      }
    }
  }

  /**
   * Shutdown the lifecycle manager
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down lifecycle manager...');

    await this.stopAllAgents();
    this.agents.clear();
    this.eventListeners.length = 0;

    if (this.shutdownTimeout) {
      clearTimeout(this.shutdownTimeout);
      this.shutdownTimeout = null;
    }

    this.logger.info('Lifecycle manager shutdown complete');
  }
}