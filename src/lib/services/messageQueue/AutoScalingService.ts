import { QueueManager } from './QueueManager';
import { MonitoringService } from './MonitoringService';

export interface ScalingPolicy {
  id: string;
  name: string;
  description?: string;
  queueName: string;
  metric: 'queue_depth' | 'processing_rate' | 'error_rate' | 'latency' | 'cpu_usage' | 'memory_usage';
  operator: 'gt' | 'lt' | 'gte' | 'lte';
  threshold: number;
  cooldownPeriod: number; // seconds
  minConsumers: number;
  maxConsumers: number;
  scaleUpStep: number;
  scaleDownStep: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScalingEvent {
  id: string;
  policyId: string;
  queueName: string;
  action: 'scale_up' | 'scale_down';
  fromConsumers: number;
  toConsumers: number;
  triggerMetric: string;
  triggerValue: number;
  threshold: number;
  reason: string;
  timestamp: Date;
  completedAt?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  error?: string;
}

export interface ConsumerInstance {
  id: string;
  queueName: string;
  groupName: string;
  consumerName: string;
  status: 'starting' | 'active' | 'stopping' | 'stopped' | 'error';
  startTime?: Date;
  lastActivity?: Date;
  processedCount: number;
  errorCount: number;
  averageProcessingTime: number;
  hostInfo: {
    hostname: string;
    pid: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  metadata: Record<string, any>;
}

export interface LoadBalancingStrategy {
  type: 'round_robin' | 'weighted' | 'least_connections' | 'random';
  weights?: Map<string, number>;
  metadata?: Record<string, any>;
}

export interface AutoScalingStats {
  totalPolicies: number;
  activePolicies: number;
  totalEvents: number;
  successfulEvents: number;
  failedEvents: number;
  averageScalingTime: number;
  currentConsumers: number;
  lastScalingEvent?: Date;
  policiesByQueue: Record<string, number>;
  eventsByHour: Array<{
    hour: string;
    scaleUpEvents: number;
    scaleDownEvents: number;
  }>;
}

export class AutoScalingService {
  private static instance: AutoScalingService;
  private queueManager: QueueManager;
  private monitoringService: MonitoringService;
  private scalingPolicies: Map<string, ScalingPolicy> = new Map();
  private consumerInstances: Map<string, ConsumerInstance> = new Map();
  private scalingEvents: ScalingEvent[] = [];
  private loadBalancingStrategies: Map<string, LoadBalancingStrategy> = new Map();
  private scalingInterval: NodeJS.Timeout;
  private statsUpdateInterval: NodeJS.Timeout;
  private isRunning = false;
  private cooldowns: Map<string, Date> = new Map();

  static getInstance(): AutoScalingService {
    if (!AutoScalingService.instance) {
      AutoScalingService.instance = new AutoScalingService();
    }
    return AutoScalingService.instance;
  }

  constructor() {
    this.queueManager = QueueManager.getInstance();
    this.monitoringService = MonitoringService.getInstance();
    this.initializeDefaultPolicies();
    this.initializeLoadBalancingStrategies();
  }

  private initializeDefaultPolicies(): void {
    const defaultPolicies: ScalingPolicy[] = [
      {
        id: 'queue-depth-scaling',
        name: 'Queue Depth Scaling',
        description: 'Scale consumers based on queue depth',
        queueName: '*', // Applies to all queues
        metric: 'queue_depth',
        operator: 'gt',
        threshold: 100,
        cooldownPeriod: 300, // 5 minutes
        minConsumers: 1,
        maxConsumers: 10,
        scaleUpStep: 2,
        scaleDownStep: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'error-rate-scaling',
        name: 'Error Rate Scaling',
        description: 'Scale consumers based on error rate',
        queueName: '*',
        metric: 'error_rate',
        operator: 'gt',
        threshold: 0.05, // 5%
        cooldownPeriod: 600, // 10 minutes
        minConsumers: 1,
        maxConsumers: 8,
        scaleUpStep: 1,
        scaleDownStep: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'latency-scaling',
        name: 'Latency Scaling',
        description: 'Scale consumers based on processing latency',
        queueName: '*',
        metric: 'latency',
        operator: 'gt',
        threshold: 5000, // 5 seconds
        cooldownPeriod: 300, // 5 minutes
        minConsumers: 1,
        maxConsumers: 6,
        scaleUpStep: 1,
        scaleDownStep: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    defaultPolicies.forEach(policy => this.scalingPolicies.set(policy.id, policy));
  }

  private initializeLoadBalancingStrategies(): void {
    const strategies: Array<{ key: string; strategy: LoadBalancingStrategy }> = [
      {
        key: 'round_robin',
        strategy: {
          type: 'round_robin',
          metadata: { description: 'Distribute messages evenly across consumers' }
        }
      },
      {
        key: 'weighted',
        strategy: {
          type: 'weighted',
          metadata: { description: 'Weight-based distribution for heterogeneous consumers' }
        }
      },
      {
        key: 'least_connections',
        strategy: {
          type: 'least_connections',
          metadata: { description: 'Route to consumer with fewest active connections' }
        }
      },
      {
        key: 'random',
        strategy: {
          type: 'random',
          metadata: { description: 'Random distribution for testing scenarios' }
        }
      }
    ];

    strategies.forEach(({ key, strategy }) => {
      this.loadBalancingStrategies.set(key, strategy);
    });
  }

  async initialize(): Promise<void> {
    try {
      this.isRunning = true;

      // Start scaling evaluation
      this.scalingInterval = setInterval(() => {
        this.evaluateScalingPolicies();
      }, 30000); // Check every 30 seconds

      // Start stats collection
      this.statsUpdateInterval = setInterval(() => {
        this.updateStats();
      }, 60000); // Update stats every minute

      console.log('AutoScalingService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AutoScalingService:', error);
      throw error;
    }
  }

  private async evaluateScalingPolicies(): Promise<void> {
    try {
      const metrics = await this.monitoringService.getMetrics();
      const now = Date.now();

      for (const policy of this.scalingPolicies.values()) {
        if (!policy.isActive) continue;

        // Check cooldown
        const cooldownKey = `${policy.id}:${policy.queueName}`;
        const lastCooldown = this.cooldowns.get(cooldownKey);
        if (lastCooldown && (now - lastCooldown.getTime()) < policy.cooldownPeriod * 1000) {
          continue;
        }

        // Get relevant queues
        const relevantQueues = policy.queueName === '*' ?
          metrics.queues :
          metrics.queues.filter(q => q.name === policy.queueName);

        for (const queue of relevantQueues) {
          const currentValue = this.getMetricValue(queue, metrics.system, policy.metric);
          const shouldScale = this.evaluateCondition(currentValue, policy.operator, policy.threshold);

          if (shouldScale) {
            await this.triggerScaling(policy, queue, currentValue);
            this.cooldowns.set(cooldownKey, new Date());
          }
        }
      }
    } catch (error) {
      console.error('Error evaluating scaling policies:', error);
    }
  }

  private getMetricValue(queue: any, system: any, metric: string): number {
    switch (metric) {
      case 'queue_depth':
        return queue.depth;
      case 'processing_rate':
        return queue.processingRate;
      case 'error_rate':
        return queue.errorRate;
      case 'latency':
        return queue.averageLatency;
      case 'cpu_usage':
        return system.cpuUsage;
      case 'memory_usage':
        return system.memoryUsage;
      default:
        return 0;
    }
  }

  private evaluateCondition(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case 'gt': return value > threshold;
      case 'lt': return value < threshold;
      case 'gte': return value >= threshold;
      case 'lte': return value <= threshold;
      default: return false;
    }
  }

  private async triggerScaling(policy: ScalingPolicy, queue: any, currentValue: number): Promise<void> {
    const currentConsumers = this.getConsumerCount(queue.name);
    const needsMoreConsumers = currentValue > policy.threshold;

    if (needsMoreConsumers && currentConsumers < policy.maxConsumers) {
      // Scale up
      const newConsumerCount = Math.min(currentConsumers + policy.scaleUpStep, policy.maxConsumers);
      await this.scaleUp(queue.name, currentConsumers, newConsumerCount, policy, currentValue);
    } else if (!needsMoreConsumers && currentConsumers > policy.minConsumers) {
      // Scale down
      const newConsumerCount = Math.max(currentConsumers - policy.scaleDownStep, policy.minConsumers);
      await this.scaleDown(queue.name, currentConsumers, newConsumerCount, policy, currentValue);
    }
  }

  private async scaleUp(
    queueName: string,
    fromConsumers: number,
    toConsumers: number,
    policy: ScalingPolicy,
    triggerValue: number
  ): Promise<void> {
    const event: ScalingEvent = {
      id: `scale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      policyId: policy.id,
      queueName,
      action: 'scale_up',
      fromConsumers,
      toConsumers,
      triggerMetric: policy.metric,
      triggerValue,
      threshold: policy.threshold,
      reason: `${policy.metric} ${triggerValue} > ${policy.threshold}`,
      timestamp: new Date(),
      status: 'pending'
    };

    this.scalingEvents.push(event);
    console.log(`Initiating scale up for queue ${queueName}: ${fromConsumers} -> ${toConsumers}`);

    try {
      event.status = 'in_progress';

      // Start new consumer instances
      const newConsumers = toConsumers - fromConsumers;
      const startPromises = [];

      for (let i = 0; i < newConsumers; i++) {
        startPromises.push(this.startConsumerInstance(queueName));
      }

      await Promise.allSettled(startPromises);

      event.status = 'completed';
      event.completedAt = new Date();

      console.log(`Scale up completed for queue ${queueName}: ${fromConsumers} -> ${toConsumers}`);

    } catch (error) {
      event.status = 'failed';
      event.error = (error as Error).message;
      console.error(`Scale up failed for queue ${queueName}:`, error);
    }
  }

  private async scaleDown(
    queueName: string,
    fromConsumers: number,
    toConsumers: number,
    policy: ScalingPolicy,
    triggerValue: number
  ): Promise<void> {
    const event: ScalingEvent = {
      id: `scale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      policyId: policy.id,
      queueName,
      action: 'scale_down',
      fromConsumers,
      toConsumers,
      triggerMetric: policy.metric,
      triggerValue,
      threshold: policy.threshold,
      reason: `${policy.metric} ${triggerValue} <= ${policy.threshold}`,
      timestamp: new Date(),
      status: 'pending'
    };

    this.scalingEvents.push(event);
    console.log(`Initiating scale down for queue ${queueName}: ${fromConsumers} -> ${toConsumers}`);

    try {
      event.status = 'in_progress';

      // Stop consumer instances
      const consumersToRemove = fromConsumers - toConsumers;
      const stopPromises = [];

      const activeConsumers = Array.from(this.consumerInstances.values())
        .filter(c => c.queueName === queueName && c.status === 'active')
        .slice(0, consumersToRemove);

      for (const consumer of activeConsumers) {
        stopPromises.push(this.stopConsumerInstance(consumer.id));
      }

      await Promise.allSettled(stopPromises);

      event.status = 'completed';
      event.completedAt = new Date();

      console.log(`Scale down completed for queue ${queueName}: ${fromConsumers} -> ${toConsumers}`);

    } catch (error) {
      event.status = 'failed';
      event.error = (error as Error).message;
      console.error(`Scale down failed for queue ${queueName}:`, error);
    }
  }

  private async startConsumerInstance(queueName: string): Promise<ConsumerInstance> {
    const instance: ConsumerInstance = {
      id: `consumer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      queueName,
      groupName: `${queueName}-group`,
      consumerName: `consumer-${Date.now()}`,
      status: 'starting',
      processedCount: 0,
      errorCount: 0,
      averageProcessingTime: 0,
      hostInfo: {
        hostname: require('os').hostname(),
        pid: process.pid,
        memoryUsage: process.memoryUsage().heapUsed,
        cpuUsage: 0 // Would need CPU monitoring library
      },
      metadata: {
        startedAt: new Date(),
        autoScaled: true
      }
    };

    try {
      // Create consumer configuration
      const consumerConfig = {
        queueName,
        groupName: instance.groupName,
        consumerName: instance.consumerName,
        batchSize: 10,
        processingTimeout: 30000,
        concurrency: 5,
        retryPolicy: {
          maxAttempts: 3,
          backoffType: 'exponential' as const,
          initialDelay: 1000,
          maxDelay: 30000,
          multiplier: 2,
          jitter: true
        },
        handler: async (message) => {
          // Default message handler - would be customized per queue
          instance.processedCount++;
          instance.lastActivity = new Date();
          return { success: true };
        }
      };

      // Create consumer
      await this.queueManager.createConsumer(consumerConfig);

      instance.status = 'active';
      instance.startTime = new Date();

      this.consumerInstances.set(instance.id, instance);

      console.log(`Started consumer instance: ${instance.id} for queue: ${queueName}`);

    } catch (error) {
      instance.status = 'error';
      console.error(`Failed to start consumer instance ${instance.id}:`, error);
    }

    return instance;
  }

  private async stopConsumerInstance(instanceId: string): Promise<boolean> {
    const instance = this.consumerInstances.get(instanceId);
    if (!instance) return false;

    try {
      instance.status = 'stopping';

      // In a real implementation, this would gracefully stop the consumer
      // For now, we'll just mark it as stopped
      instance.status = 'stopped';

      // Remove from active instances after a delay
      setTimeout(() => {
        this.consumerInstances.delete(instanceId);
      }, 5000);

      console.log(`Stopped consumer instance: ${instanceId}`);
      return true;

    } catch (error) {
      instance.status = 'error';
      console.error(`Failed to stop consumer instance ${instanceId}:`, error);
      return false;
    }
  }

  private getConsumerCount(queueName: string): number {
    return Array.from(this.consumerInstances.values())
      .filter(c => c.queueName === queueName && c.status === 'active')
      .length;
  }

  private updateStats(): void {
    // This would update comprehensive statistics
    // For now, we'll keep basic stats
  }

  // Public API methods

  addScalingPolicy(policy: Omit<ScalingPolicy, 'id' | 'createdAt' | 'updatedAt'>): string {
    const newPolicy: ScalingPolicy = {
      ...policy,
      id: `policy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.scalingPolicies.set(newPolicy.id, newPolicy);
    console.log(`Added scaling policy: ${newPolicy.name}`);

    return newPolicy.id;
  }

  updateScalingPolicy(policyId: string, updates: Partial<ScalingPolicy>): boolean {
    const policy = this.scalingPolicies.get(policyId);
    if (!policy) return false;

    Object.assign(policy, updates, { updatedAt: new Date() });
    console.log(`Updated scaling policy: ${policy.name}`);

    return true;
  }

  removeScalingPolicy(policyId: string): boolean {
    const success = this.scalingPolicies.delete(policyId);
    if (success) {
      console.log(`Removed scaling policy: ${policyId}`);
    }
    return success;
  }

  getScalingPolicies(): ScalingPolicy[] {
    return Array.from(this.scalingPolicies.values());
  }

  getConsumerInstances(queueName?: string): ConsumerInstance[] {
    const instances = Array.from(this.consumerInstances.values());
    return queueName ? instances.filter(i => i.queueName === queueName) : instances;
  }

  getScalingEvents(limit: number = 50): ScalingEvent[] {
    return this.scalingEvents
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async manualScale(queueName: string, targetConsumers: number, reason?: string): Promise<boolean> {
    try {
      const currentConsumers = this.getConsumerCount(queueName);

      if (targetConsumers > currentConsumers) {
        // Scale up
        await this.scaleUp(queueName, currentConsumers, targetConsumers, {
          id: 'manual',
          name: 'Manual Scaling',
          queueName,
          metric: 'manual',
          operator: 'gt',
          threshold: 0,
          cooldownPeriod: 0,
          minConsumers: 0,
          maxConsumers: targetConsumers,
          scaleUpStep: targetConsumers - currentConsumers,
          scaleDownStep: 0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }, targetConsumers);
      } else if (targetConsumers < currentConsumers) {
        // Scale down
        await this.scaleDown(queueName, currentConsumers, targetConsumers, {
          id: 'manual',
          name: 'Manual Scaling',
          queueName,
          metric: 'manual',
          operator: 'lt',
          threshold: 0,
          cooldownPeriod: 0,
          minConsumers: targetConsumers,
          maxConsumers: 100,
          scaleUpStep: 0,
          scaleDownStep: currentConsumers - targetConsumers,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }, targetConsumers);
      }

      console.log(`Manual scaling for queue ${queueName}: ${currentConsumers} -> ${targetConsumers} (${reason})`);
      return true;

    } catch (error) {
      console.error(`Manual scaling failed for queue ${queueName}:`, error);
      return false;
    }
  }

  setLoadBalancingStrategy(queueName: string, strategy: LoadBalancingStrategy): void {
    this.loadBalancingStrategies.set(queueName, strategy);
    console.log(`Set load balancing strategy for queue ${queueName}: ${strategy.type}`);
  }

  getLoadBalancingStrategy(queueName: string): LoadBalancingStrategy | null {
    return this.loadBalancingStrategies.get(queueName) || null;
  }

  getStats(): AutoScalingStats {
    const events = this.scalingEvents;
    const successfulEvents = events.filter(e => e.status === 'completed');
    const failedEvents = events.filter(e => e.status === 'failed');
    const lastEvent = events[events.length - 1];

    // Group policies by queue
    const policiesByQueue: Record<string, number> = {};
    for (const policy of this.scalingPolicies.values()) {
      if (policy.queueName === '*') {
        // Count for all queues
        const queueMetrics = this.monitoringService.getMetrics();
        queueMetrics.queues.forEach(queue => {
          policiesByQueue[queue.name] = (policiesByQueue[queue.name] || 0) + 1;
        });
      } else {
        policiesByQueue[policy.queueName] = (policiesByQueue[policy.queueName] || 0) + 1;
      }
    }

    // Group events by hour
    const eventsByHour: Array<{ hour: string; scaleUpEvents: number; scaleDownEvents: number }> = [];
    const eventsByHourMap = new Map<string, { scaleUpEvents: number; scaleDownEvents: number }>();

    for (const event of events.slice(-24)) { // Last 24 events
      const hour = event.timestamp.toISOString().slice(0, 13);

      if (!eventsByHourMap.has(hour)) {
        eventsByHourMap.set(hour, { scaleUpEvents: 0, scaleDownEvents: 0 });
      }

      const hourData = eventsByHourMap.get(hour)!;
      if (event.action === 'scale_up') {
        hourData.scaleUpEvents++;
      } else {
        hourData.scaleDownEvents++;
      }
    }

    for (const [hour, data] of eventsByHourMap) {
      eventsByHour.push({ hour, ...data });
    }

    return {
      totalPolicies: this.scalingPolicies.size,
      activePolicies: Array.from(this.scalingPolicies.values()).filter(p => p.isActive).length,
      totalEvents: events.length,
      successfulEvents: successfulEvents.length,
      failedEvents: failedEvents.length,
      averageScalingTime: this.calculateAverageScalingTime(),
      currentConsumers: this.consumerInstances.size,
      lastScalingEvent: lastEvent?.timestamp,
      policiesByQueue,
      eventsByHour
    };
  }

  private calculateAverageScalingTime(): number {
    const completedEvents = this.scalingEvents.filter(e =>
      e.status === 'completed' && e.completedAt
    );

    if (completedEvents.length === 0) return 0;

    const totalTime = completedEvents.reduce((sum, event) => {
      return sum + (event.completedAt!.getTime() - event.timestamp.getTime());
    }, 0);

    return totalTime / completedEvents.length;
  }

  async cleanup(): Promise<void> {
    this.isRunning = false;

    if (this.scalingInterval) {
      clearInterval(this.scalingInterval);
    }

    if (this.statsUpdateInterval) {
      clearInterval(this.statsUpdateInterval);
    }

    // Stop all consumer instances
    for (const instance of this.consumerInstances.values()) {
      await this.stopConsumerInstance(instance.id);
    }

    this.consumerInstances.clear();
    this.scalingEvents = [];
    this.cooldowns.clear();

    console.log('AutoScalingService cleaned up');
  }
}