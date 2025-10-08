import { QueueManager, Message, MessageHandlerResult } from './QueueManager';

export interface PriorityRule {
  id: string;
  name: string;
  condition: (message: Message) => boolean;
  priority: number;
  queue: string;
  metadata?: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
}

export interface RoutingRule {
  id: string;
  name: string;
  condition: (message: Message) => boolean;
  targetQueue: string;
  transform?: (message: Message) => Message;
  metadata?: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
}

export interface FilterRule {
  id: string;
  name: string;
  condition: (message: Message) => boolean;
  action: 'accept' | 'reject' | 'transform';
  transform?: (message: Message) => Message;
  rejectionReason?: string;
  metadata?: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
}

export interface ThrottleRule {
  id: string;
  name: string;
  keyExtractor: (message: Message) => string;
  limit: number;
  windowMs: number;
  queue?: string;
  metadata?: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
}

export interface ProcessingStats {
  totalProcessed: number;
  successfulProcessed: number;
  failedProcessed: number;
  averageProcessingTime: number;
  queueDepth: number;
  consumerCount: number;
  throughputPerSecond: number;
  errorRate: number;
  lastProcessedAt: Date;
}

export class PriorityProcessor {
  private static instance: PriorityProcessor;
  private queueManager: QueueManager;
  private priorityRules: Map<string, PriorityRule> = new Map();
  private routingRules: Map<string, RoutingRule> = new Map();
  private filterRules: Map<string, FilterRule> = new Map();
  private throttleRules: Map<string, ThrottleRule> = new Map();
  private throttleCounters: Map<string, Array<{ timestamp: number; count: number }>> = new Map();
  private processingStats: Map<string, ProcessingStats> = new Map();
  private statsUpdateInterval: NodeJS.Timeout;

  static getInstance(): PriorityProcessor {
    if (!PriorityProcessor.instance) {
      PriorityProcessor.instance = new PriorityProcessor();
    }
    return PriorityProcessor.instance;
  }

  constructor() {
    this.queueManager = QueueManager.getInstance();
    this.initializeDefaultRules();
    this.startStatsCollection();
  }

  private initializeDefaultRules(): void {
    // Default priority rules
    const defaultPriorityRules: PriorityRule[] = [
      {
        id: 'urgent-notifications',
        name: 'Urgent Notifications',
        condition: (message) => {
          const urgentTypes = ['security_alert', 'critical_failure', 'emergency'];
          return urgentTypes.includes(message.type) ||
                 (message.metadata?.priority === 'urgent' ||
                  message.metadata?.urgency === 'high');
        },
        priority: 1000,
        queue: 'notifications:high',
        metadata: { description: 'High priority urgent notifications' },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: 'user-interactions',
        name: 'User Interactions',
        condition: (message) => {
          const interactionTypes = ['user_signup', 'password_reset', 'email_verification'];
          return interactionTypes.includes(message.type) ||
                 message.type.startsWith('user_');
        },
        priority: 500,
        queue: 'notifications:high',
        metadata: { description: 'User interaction notifications' },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: 'transactional',
        name: 'Transactional Notifications',
        condition: (message) => {
          const transactionalTypes = ['payment_confirmation', 'order_status', 'booking_confirmation'];
          return transactionalTypes.includes(message.type) ||
                 message.type.startsWith('transaction_');
        },
        priority: 300,
        queue: 'notifications:normal',
        metadata: { description: 'Transactional notifications' },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: 'marketing',
        name: 'Marketing Notifications',
        condition: (message) => {
          const marketingTypes = ['newsletter', 'promotion', 'campaign'];
          return marketingTypes.includes(message.type) ||
                 message.type.startsWith('marketing_') ||
                 message.metadata?.category === 'marketing';
        },
        priority: 50,
        queue: 'notifications:low',
        metadata: { description: 'Marketing and promotional notifications' },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: 'bulk',
        name: 'Bulk Notifications',
        condition: (message) => {
          return message.metadata?.bulk === true ||
                 message.metadata?.batch === true ||
                 message.payload?.recipients?.length > 100;
        },
        priority: 10,
        queue: 'notifications:low',
        metadata: { description: 'Bulk notification processing' },
        isActive: true,
        createdAt: new Date()
      }
    ];

    // Default routing rules
    const defaultRoutingRules: RoutingRule[] = [
      {
        id: 'email-routing',
        name: 'Email Service Routing',
        condition: (message) => {
          return message.type.includes('email') ||
                 message.payload?.channel === 'email' ||
                 message.metadata?.channel === 'email';
        },
        targetQueue: 'email:processing',
        transform: (message) => ({
          ...message,
          metadata: {
            ...message.metadata,
            routedAt: Date.now(),
            routingReason: 'email_channel'
          }
        }),
        metadata: { description: 'Route to email processing queue' },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: 'sms-routing',
        name: 'SMS Service Routing',
        condition: (message) => {
          return message.type.includes('sms') ||
                 message.payload?.channel === 'sms' ||
                 message.metadata?.channel === 'sms';
        },
        targetQueue: 'sms:processing',
        transform: (message) => ({
          ...message,
          metadata: {
            ...message.metadata,
            routedAt: Date.now(),
            routingReason: 'sms_channel'
          }
        }),
        metadata: { description: 'Route to SMS processing queue' },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: 'push-routing',
        name: 'Push Notification Routing',
        condition: (message) => {
          return message.type.includes('push') ||
                 message.payload?.channel === 'push' ||
                 message.metadata?.channel === 'push';
        },
        targetQueue: 'push:processing',
        transform: (message) => ({
          ...message,
          metadata: {
            ...message.metadata,
            routedAt: Date.now(),
            routingReason: 'push_channel'
          }
        }),
        metadata: { description: 'Route to push notification processing queue' },
        isActive: true,
        createdAt: new Date()
      }
    ];

    // Default filter rules
    const defaultFilterRules: FilterRule[] = [
      {
        id: 'rate-limit-filter',
        name: 'Rate Limit Filter',
        condition: (message) => {
          const key = message.payload?.userId || message.metadata?.userId;
          return this.checkRateLimit(key, 'user_notifications', 10, 60000); // 10 per minute
        },
        action: 'reject',
        rejectionReason: 'Rate limit exceeded',
        metadata: { description: 'Prevent spam notifications' },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: 'content-filter',
        name: 'Content Filter',
        condition: (message) => {
          const prohibitedContent = ['spam', 'abuse', 'inappropriate'];
          const content = JSON.stringify(message.payload).toLowerCase();
          return !prohibitedContent.some(word => content.includes(word));
        },
        action: 'accept',
        metadata: { description: 'Filter inappropriate content' },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: 'duplicate-filter',
        name: 'Duplicate Filter',
        condition: (message) => {
          const key = `${message.type}-${message.payload?.userId}-${JSON.stringify(message.payload?.content)}`;
          return !this.isDuplicate(key, 300000); // 5 minutes deduplication window
        },
        action: 'reject',
        rejectionReason: 'Duplicate message',
        metadata: { description: 'Prevent duplicate notifications' },
        isActive: true,
        createdAt: new Date()
      }
    ];

    // Default throttle rules
    const defaultThrottleRules: ThrottleRule[] = [
      {
        id: 'user-throttle',
        name: 'User Notification Throttle',
        keyExtractor: (message) => message.payload?.userId || 'anonymous',
        limit: 20,
        windowMs: 300000, // 5 minutes
        metadata: { description: 'Limit notifications per user' },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: 'type-throttle',
        name: 'Notification Type Throttle',
        keyExtractor: (message) => `type:${message.type}`,
        limit: 100,
        windowMs: 60000, // 1 minute
        metadata: { description: 'Limit notifications by type' },
        isActive: true,
        createdAt: new Date()
      }
    ];

    // Register all default rules
    defaultPriorityRules.forEach(rule => this.priorityRules.set(rule.id, rule));
    defaultRoutingRules.forEach(rule => this.routingRules.set(rule.id, rule));
    defaultFilterRules.forEach(rule => this.filterRules.set(rule.id, rule));
    defaultThrottleRules.forEach(rule => this.throttleRules.set(rule.id, rule));
  }

  async processMessage(message: Message): Promise<MessageHandlerResult> {
    const startTime = Date.now();

    try {
      // Step 1: Apply filter rules
      const filterResult = await this.applyFilterRules(message);
      if (!filterResult.passed) {
        return {
          success: false,
          error: new Error(filterResult.reason || 'Message filtered out'),
          metadata: { filterResult }
        };
      }

      // Step 2: Check throttle rules
      const throttleResult = await this.checkThrottleRules(message);
      if (!throttleResult.passed) {
        return {
          success: false,
          error: new Error(throttleResult.reason || 'Message throttled'),
          retry: true,
          metadata: { throttleResult }
        };
      }

      // Step 3: Apply priority rules to determine priority and target queue
      const priorityResult = await this.applyPriorityRules(message);
      const targetMessage = priorityResult.message;

      // Step 4: Apply routing rules
      const routingResult = await this.applyRoutingRules(targetMessage);
      const finalMessage = routingResult.message;

      // Step 5: Send to appropriate queue
      if (finalMessage.queue !== message.queue) {
        await this.queueManager.sendMessage(
          finalMessage.queue,
          finalMessage.type,
          finalMessage.payload,
          {
            priority: finalMessage.priority,
            correlationId: finalMessage.correlationId,
            metadata: {
              ...finalMessage.metadata,
              processedBy: 'PriorityProcessor',
              originalQueue: message.queue,
              processingTime: Date.now() - startTime
            }
          }
        );

        // Update processing stats
        this.updateProcessingStats(finalMessage.queue, true, Date.now() - startTime);

        return {
          success: true,
          metadata: {
            priorityResult,
            routingResult,
            processingTime: Date.now() - startTime
          }
        };
      }

      // If no routing change, return success
      this.updateProcessingStats(message.queue, true, Date.now() - startTime);

      return {
        success: true,
        metadata: {
          priorityResult,
          processingTime: Date.now() - startTime
        }
      };

    } catch (error) {
      this.updateProcessingStats(message.queue, false, Date.now() - startTime);
      return {
        success: false,
        error: error as Error,
        metadata: { processingTime: Date.now() - startTime }
      };
    }
  }

  private async applyFilterRules(message: Message): Promise<{ passed: boolean; reason?: string; appliedRules: string[] }> {
    const appliedRules: string[] = [];

    for (const rule of this.filterRules.values()) {
      if (!rule.isActive) continue;

      try {
        if (rule.condition(message)) {
          appliedRules.push(rule.id);

          if (rule.action === 'reject') {
            return {
              passed: false,
              reason: rule.rejectionReason || `Rejected by filter rule: ${rule.name}`,
              appliedRules
            };
          } else if (rule.action === 'transform' && rule.transform) {
            Object.assign(message, rule.transform(message));
          }
        }
      } catch (error) {
        console.error(`Error applying filter rule ${rule.name}:`, error);
      }
    }

    return { passed: true, appliedRules };
  }

  private async checkThrottleRules(message: Message): Promise<{ passed: boolean; reason?: string; appliedRules: string[] }> {
    const appliedRules: string[] = [];

    for (const rule of this.throttleRules.values()) {
      if (!rule.isActive) continue;

      try {
        const key = rule.keyExtractor(message);
        const throttleKey = `${rule.id}:${key}`;

        if (!this.checkRateLimit(throttleKey, rule.limit, rule.windowMs)) {
          appliedRules.push(rule.id);
          return {
            passed: false,
            reason: `Throttled by rule: ${rule.name}`,
            appliedRules
          };
        }
      } catch (error) {
        console.error(`Error checking throttle rule ${rule.name}:`, error);
      }
    }

    return { passed: true, appliedRules: [] };
  }

  private async applyPriorityRules(message: Message): Promise<{ message: Message; appliedRule?: string }> {
    let bestMatch: PriorityRule | null = null;
    let highestPriority = -1;

    for (const rule of this.priorityRules.values()) {
      if (!rule.isActive) continue;

      try {
        if (rule.condition(message) && rule.priority > highestPriority) {
          bestMatch = rule;
          highestPriority = rule.priority;
        }
      } catch (error) {
        console.error(`Error applying priority rule ${rule.name}:`, error);
      }
    }

    if (bestMatch) {
      const updatedMessage = {
        ...message,
        priority: this.mapPriorityToLevel(bestMatch.priority),
        queue: bestMatch.queue,
        metadata: {
          ...message.metadata,
          priorityRuleApplied: bestMatch.id,
          priorityRuleName: bestMatch.name,
          priorityScore: bestMatch.priority
        }
      };

      return {
        message: updatedMessage,
        appliedRule: bestMatch.id
      };
    }

    return { message };
  }

  private async applyRoutingRules(message: Message): Promise<{ message: Message; appliedRule?: string }> {
    for (const rule of this.routingRules.values()) {
      if (!rule.isActive) continue;

      try {
        if (rule.condition(message)) {
          const updatedMessage = rule.transform ? rule.transform(message) : {
            ...message,
            queue: rule.targetQueue,
            metadata: {
              ...message.metadata,
              routingRuleApplied: rule.id,
              routingRuleName: rule.name,
              routedAt: Date.now()
            }
          };

          return {
            message: updatedMessage,
            appliedRule: rule.id
          };
        }
      } catch (error) {
        console.error(`Error applying routing rule ${rule.name}:`, error);
      }
    }

    return { message };
  }

  private mapPriorityToLevel(priorityScore: number): 'high' | 'normal' | 'low' {
    if (priorityScore >= 800) return 'high';
    if (priorityScore >= 200) return 'normal';
    return 'low';
  }

  private checkRateLimit(key: string, limit: number, windowMs: number): boolean {
    if (!key) return true;

    const now = Date.now();
    const windowStart = now - windowMs;

    let counter = this.throttleCounters.get(key) || [];

    // Clean old entries
    counter = counter.filter(entry => entry.timestamp > windowStart);

    // Check current count
    const currentCount = counter.reduce((sum, entry) => sum + entry.count, 0);

    if (currentCount >= limit) {
      return false;
    }

    // Add new entry
    counter.push({ timestamp: now, count: 1 });
    this.throttleCounters.set(key, counter);

    return true;
  }

  private isDuplicate(key: string, windowMs: number): boolean {
    if (!key) return false;

    const now = Date.now();
    const windowStart = now - windowMs;

    const counter = this.throttleCounters.get(key) || [];
    const recentEntries = counter.filter(entry => entry.timestamp > windowStart);

    return recentEntries.length > 0;
  }

  private updateProcessingStats(queueName: string, success: boolean, processingTime: number): void {
    let stats = this.processingStats.get(queueName);

    if (!stats) {
      stats = {
        totalProcessed: 0,
        successfulProcessed: 0,
        failedProcessed: 0,
        averageProcessingTime: 0,
        queueDepth: 0,
        consumerCount: 0,
        throughputPerSecond: 0,
        errorRate: 0,
        lastProcessedAt: new Date()
      };
      this.processingStats.set(queueName, stats);
    }

    stats.totalProcessed++;
    stats.lastProcessedAt = new Date();

    if (success) {
      stats.successfulProcessed++;
    } else {
      stats.failedProcessed++;
    }

    // Update average processing time (exponential moving average)
    stats.averageProcessingTime = stats.averageProcessingTime * 0.9 + processingTime * 0.1;

    // Update error rate
    stats.errorRate = stats.failedProcessed / stats.totalProcessed;

    // Update throughput (simplified - would use proper time window in production)
    stats.throughputPerSecond = stats.totalProcessed / Math.max(1, (Date.now() - stats.lastProcessedAt.getTime()) / 1000);
  }

  private startStatsCollection(): void {
    // Update stats every 10 seconds
    this.statsUpdateInterval = setInterval(async () => {
      await this.refreshStats();
    }, 10000);
  }

  private async refreshStats(): Promise<void> {
    try {
      const queueMetrics = await this.queueManager.getQueueMetrics();

      for (const metric of queueMetrics) {
        const stats = this.processingStats.get(metric.queueName);
        if (stats) {
          stats.queueDepth = metric.depth;
          stats.consumerCount = metric.consumerCount;
        }
      }

      // Clean old throttle counters
      const now = Date.now();
      const fiveMinutesAgo = now - 300000;

      for (const [key, counter] of this.throttleCounters) {
        const cleaned = counter.filter(entry => entry.timestamp > fiveMinutesAgo);
        if (cleaned.length === 0) {
          this.throttleCounters.delete(key);
        } else {
          this.throttleCounters.set(key, cleaned);
        }
      }
    } catch (error) {
      console.error('Error refreshing stats:', error);
    }
  }

  // Public API methods
  addPriorityRule(rule: PriorityRule): void {
    this.priorityRules.set(rule.id, rule);
  }

  addRoutingRule(rule: RoutingRule): void {
    this.routingRules.set(rule.id, rule);
  }

  addFilterRule(rule: FilterRule): void {
    this.filterRules.set(rule.id, rule);
  }

  addThrottleRule(rule: ThrottleRule): void {
    this.throttleRules.set(rule.id, rule);
  }

  removePriorityRule(id: string): boolean {
    return this.priorityRules.delete(id);
  }

  removeRoutingRule(id: string): boolean {
    return this.routingRules.delete(id);
  }

  removeFilterRule(id: string): boolean {
    return this.filterRules.delete(id);
  }

  removeThrottleRule(id: string): boolean {
    this.throttleRules.delete(id);
    this.throttleCounters.delete(id);
    return true;
  }

  updatePriorityRule(id: string, updates: Partial<PriorityRule>): boolean {
    const rule = this.priorityRules.get(id);
    if (!rule) return false;

    Object.assign(rule, updates);
    return true;
  }

  updateRoutingRule(id: string, updates: Partial<RoutingRule>): boolean {
    const rule = this.routingRules.get(id);
    if (!rule) return false;

    Object.assign(rule, updates);
    return true;
  }

  updateFilterRule(id: string, updates: Partial<FilterRule>): boolean {
    const rule = this.filterRules.get(id);
    if (!rule) return false;

    Object.assign(rule, updates);
    return true;
  }

  updateThrottleRule(id: string, updates: Partial<ThrottleRule>): boolean {
    const rule = this.throttleRules.get(id);
    if (!rule) return false;

    Object.assign(rule, updates);
    return true;
  }

  getPriorityRules(): PriorityRule[] {
    return Array.from(this.priorityRules.values());
  }

  getRoutingRules(): RoutingRule[] {
    return Array.from(this.routingRules.values());
  }

  getFilterRules(): FilterRule[] {
    return Array.from(this.filterRules.values());
  }

  getThrottleRules(): ThrottleRule[] {
    return Array.from(this.throttleRules.values());
  }

  getProcessingStats(queueName?: string): ProcessingStats[] {
    if (queueName) {
      const stats = this.processingStats.get(queueName);
      return stats ? [stats] : [];
    }

    return Array.from(this.processingStats.values());
  }

  async testRules(message: Message): Promise<{
    priorityResult?: { message: Message; appliedRule?: string };
    routingResult?: { message: Message; appliedRule?: string };
    filterResult: { passed: boolean; reason?: string; appliedRules: string[] };
    throttleResult: { passed: boolean; reason?: string; appliedRules: string[] };
  }> {
    const filterResult = await this.applyFilterRules(message);
    const throttleResult = await this.checkThrottleRules(message);
    const priorityResult = await this.applyPriorityRules(message);
    const routingResult = await this.applyRoutingRules(priorityResult.message);

    return {
      priorityResult,
      routingResult,
      filterResult,
      throttleResult
    };
  }

  async cleanup(): Promise<void> {
    if (this.statsUpdateInterval) {
      clearInterval(this.statsUpdateInterval);
    }
    this.throttleCounters.clear();
    this.processingStats.clear();
  }
}