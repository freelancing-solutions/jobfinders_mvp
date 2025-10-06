/**
 * Token Tracker Utility
 *
 * Comprehensive token usage tracking and monitoring for AI services.
 * Provides analytics, cost calculation, and quota management.
 */

import { createClient } from 'redis';

export interface TokenUsageRecord {
  id: string;
  timestamp: Date;
  service: 'openai' | 'openrouter';
  model: string;
  operation: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
}

export interface TokenUsageStats {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  averageTokensPerRequest: number;
  averageCostPerRequest: number;
  usageByService: {
    [service: string]: {
      requests: number;
      tokens: number;
      cost: number;
    };
  };
  usageByModel: {
    [model: string]: {
      requests: number;
      tokens: number;
      cost: number;
    };
  };
  usageByOperation: {
    [operation: string]: {
      requests: number;
      tokens: number;
      cost: number;
    };
  };
  usageByUser: {
    [userId: string]: {
      requests: number;
      tokens: number;
      cost: number;
    };
  };
  hourlyUsage: Array<{
    hour: string;
    tokens: number;
    cost: number;
    requests: number;
  }>;
  dailyUsage: Array<{
    date: string;
    tokens: number;
    cost: number;
    requests: number;
  }>;
}

export interface QuotaLimit {
  userId: string;
  period: 'hourly' | 'daily' | 'monthly';
  maxTokens: number;
  maxCost: number;
  maxRequests: number;
  currentTokens: number;
  currentCost: number;
  currentRequests: number;
  resetAt: Date;
}

export interface TokenTrackerConfig {
  redis?: {
    url: string;
    keyPrefix: string;
  };
  retention: {
    hourly: number; // hours
    daily: number; // days
    detailed: number; // days
  };
  pricing: {
    [service: string]: {
      [model: string]: {
        input: number; // per 1M tokens
        output: number; // per 1M tokens
      };
    };
  };
  quotas: {
    free: {
      hourly: { tokens: number; cost: number; requests: number };
      daily: { tokens: number; cost: number; requests: number };
      monthly: { tokens: number; cost: number; requests: number };
    };
    premium: {
      hourly: { tokens: number; cost: number; requests: number };
      daily: { tokens: number; cost: number; requests: number };
      monthly: { tokens: number; cost: number; requests: number };
    };
  };
}

export class TokenTracker {
  private config: TokenTrackerConfig;
  private redisClient?: any;
  private memoryStore: TokenUsageRecord[] = [];

  constructor(config?: Partial<TokenTrackerConfig>) {
    this.config = {
      redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        keyPrefix: 'token_tracker',
      },
      retention: {
        hourly: 24 * 7, // 1 week
        daily: 30, // 30 days
        detailed: 7, // 7 days
      },
      pricing: {
        openai: {
          'gpt-4-turbo-preview': { input: 10, output: 30 },
          'gpt-4': { input: 30, output: 60 },
          'gpt-3.5-turbo-16k': { input: 3, output: 4 },
          'gpt-3.5-turbo': { input: 1, output: 2 },
        },
        openrouter: {
          'anthropic/claude-3.5-sonnet': { input: 3, output: 15 },
          'openai/gpt-4-turbo': { input: 10, output: 30 },
          'openai/gpt-3.5-turbo': { input: 1, output: 2 },
        },
      },
      quotas: {
        free: {
          hourly: { tokens: 10000, cost: 0.10, requests: 20 },
          daily: { tokens: 50000, cost: 0.50, requests: 100 },
          monthly: { tokens: 500000, cost: 5.00, requests: 1000 },
        },
        premium: {
          hourly: { tokens: 100000, cost: 1.00, requests: 200 },
          daily: { tokens: 1000000, cost: 10.00, requests: 2000 },
          monthly: { tokens: 10000000, cost: 100.00, requests: 20000 },
        },
      },
      ...config,
    };

    this.initialize();
  }

  private async initialize() {
    try {
      if (this.config.redis?.url) {
        this.redisClient = createClient({
          url: this.config.redis.url,
        });

        this.redisClient.on('error', (err: any) => {
          console.error('[TokenTracker] Redis error:', err);
        });

        await this.redisClient.connect();
        console.log('[TokenTracker] Connected to Redis');
      }
    } catch (error) {
      console.error('[TokenTracker] Failed to connect to Redis:', error);
      console.log('[TokenTracker] Using in-memory storage only');
    }
  }

  private generateId(): string {
    return `tok_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getKey(type: string, identifier: string): string {
    return `${this.config.redis?.keyPrefix || 'token_tracker'}:${type}:${identifier}`;
  }

  calculateCost(service: string, model: string, promptTokens: number, completionTokens: number): number {
    const servicePricing = this.config.pricing[service];
    if (!servicePricing) {
      console.warn(`[TokenTracker] No pricing found for service: ${service}`);
      return 0;
    }

    const modelPricing = servicePricing[model];
    if (!modelPricing) {
      console.warn(`[TokenTracker] No pricing found for model: ${model} in service: ${service}`);
      return 0;
    }

    const inputCost = (promptTokens / 1000000) * modelPricing.input;
    const outputCost = (completionTokens / 1000000) * modelPricing.output;
    return inputCost + outputCost;
  }

  async trackUsage(record: Omit<TokenUsageRecord, 'id' | 'timestamp' | 'cost'>): Promise<void> {
    const cost = this.calculateCost(
      record.service,
      record.model,
      record.promptTokens,
      record.completionTokens
    );

    const fullRecord: TokenUsageRecord = {
      id: this.generateId(),
      timestamp: new Date(),
      cost,
      ...record,
    };

    // Store in memory for immediate access
    this.memoryStore.push(fullRecord);

    // Keep memory store bounded
    if (this.memoryStore.length > 10000) {
      this.memoryStore = this.memoryStore.slice(-5000);
    }

    // Store in Redis if available
    if (this.redisClient) {
      try {
        await this.storeInRedis(fullRecord);
      } catch (error) {
        console.error('[TokenTracker] Failed to store in Redis:', error);
      }
    }

    // Log significant usage
    if (fullRecord.totalTokens > 1000 || fullRecord.cost > 0.01) {
      console.log('[TokenTracker] Usage recorded:', {
        service: record.service,
        model: record.model,
        operation: record.operation,
        tokens: fullRecord.totalTokens,
        cost: `$${fullRecord.cost.toFixed(4)}`,
        userId: record.userId,
      });
    }
  }

  private async storeInRedis(record: TokenUsageRecord): Promise<void> {
    const timestamp = record.timestamp.getTime();

    // Store detailed record
    await this.redisClient.zadd(
      this.getKey('detailed', 'all'),
      timestamp,
      JSON.stringify(record)
    );

    // Store by user
    if (record.userId) {
      await this.redisClient.zadd(
        this.getKey('user', record.userId),
        timestamp,
        JSON.stringify(record)
      );
    }

    // Store by operation
    await this.redisClient.zadd(
      this.getKey('operation', record.operation),
      timestamp,
      JSON.stringify(record)
    );

    // Store hourly aggregates
    const hourKey = this.getKey('hourly', this.getHourKey(record.timestamp));
    await this.redisClient.hincrby(hourKey, 'tokens', record.totalTokens);
    await this.redisClient.hincrbyfloat(hourKey, 'cost', record.cost);
    await this.redisClient.hincrby(hourKey, 'requests', 1);
    await this.redisClient.expire(hourKey, this.config.retention.hourly * 3600);

    // Store daily aggregates
    const dayKey = this.getKey('daily', this.getDayKey(record.timestamp));
    await this.redisClient.hincrby(dayKey, 'tokens', record.totalTokens);
    await this.redisClient.hincrbyfloat(dayKey, 'cost', record.cost);
    await this.redisClient.hincrby(dayKey, 'requests', 1);
    await this.redisClient.expire(dayKey, this.config.retention.daily * 86400);

    // Cleanup old detailed records
    const cutoffTime = Date.now() - (this.config.retention.detailed * 86400000);
    await this.redisClient.zremrangebyscore(
      this.getKey('detailed', 'all'),
      0,
      cutoffTime
    );
  }

  private getHourKey(date: Date): string {
    return date.toISOString().slice(0, 13); // YYYY-MM-DDTHH
  }

  private getDayKey(date: Date): string {
    return date.toISOString().slice(0, 10); // YYYY-MM-DD
  }

  async getUsageStats(timeframe?: { start: Date; end: Date }, userId?: string): Promise<TokenUsageStats> {
    let records: TokenUsageRecord[] = [];

    if (this.redisClient) {
      records = await this.getRecordsFromRedis(timeframe, userId);
    } else {
      records = this.getRecordsFromMemory(timeframe, userId);
    }

    return this.calculateStats(records);
  }

  private async getRecordsFromRedis(
    timeframe?: { start: Date; end: Date },
    userId?: string
  ): Promise<TokenUsageRecord[]> {
    const key = userId ?
      this.getKey('user', userId) :
      this.getKey('detailed', 'all');

    let minScore = timeframe ? timeframe.start.getTime() : 0;
    let maxScore = timeframe ? timeframe.end.getTime() : Date.now();

    try {
      const results = await this.redisClient.zrangebyscore(
        key,
        minScore,
        maxScore,
        { LIMIT: { offset: 0, count: 10000 } }
      );

      return results.map(record => JSON.parse(record));
    } catch (error) {
      console.error('[TokenTracker] Failed to get records from Redis:', error);
      return [];
    }
  }

  private getRecordsFromMemory(
    timeframe?: { start: Date; end: Date },
    userId?: string
  ): TokenUsageRecord[] {
    let records = this.memoryStore;

    if (userId) {
      records = records.filter(record => record.userId === userId);
    }

    if (timeframe) {
      records = records.filter(record =>
        record.timestamp >= timeframe.start && record.timestamp <= timeframe.end
      );
    }

    return records;
  }

  private calculateStats(records: TokenUsageRecord[]): TokenUsageStats {
    const stats: TokenUsageStats = {
      totalRequests: records.length,
      totalTokens: 0,
      totalCost: 0,
      averageTokensPerRequest: 0,
      averageCostPerRequest: 0,
      usageByService: {},
      usageByModel: {},
      usageByOperation: {},
      usageByUser: {},
      hourlyUsage: [],
      dailyUsage: [],
    };

    // Calculate totals and breakdowns
    records.forEach(record => {
      stats.totalTokens += record.totalTokens;
      stats.totalCost += record.cost;

      // By service
      if (!stats.usageByService[record.service]) {
        stats.usageByService[record.service] = { requests: 0, tokens: 0, cost: 0 };
      }
      stats.usageByService[record.service].requests += 1;
      stats.usageByService[record.service].tokens += record.totalTokens;
      stats.usageByService[record.service].cost += record.cost;

      // By model
      if (!stats.usageByModel[record.model]) {
        stats.usageByModel[record.model] = { requests: 0, tokens: 0, cost: 0 };
      }
      stats.usageByModel[record.model].requests += 1;
      stats.usageByModel[record.model].tokens += record.totalTokens;
      stats.usageByModel[record.model].cost += record.cost;

      // By operation
      if (!stats.usageByOperation[record.operation]) {
        stats.usageByOperation[record.operation] = { requests: 0, tokens: 0, cost: 0 };
      }
      stats.usageByOperation[record.operation].requests += 1;
      stats.usageByOperation[record.operation].tokens += record.totalTokens;
      stats.usageByOperation[record.operation].cost += record.cost;

      // By user
      if (record.userId) {
        if (!stats.usageByUser[record.userId]) {
          stats.usageByUser[record.userId] = { requests: 0, tokens: 0, cost: 0 };
        }
        stats.usageByUser[record.userId].requests += 1;
        stats.usageByUser[record.userId].tokens += record.totalTokens;
        stats.usageByUser[record.userId].cost += record.cost;
      }
    });

    // Calculate averages
    if (stats.totalRequests > 0) {
      stats.averageTokensPerRequest = stats.totalTokens / stats.totalRequests;
      stats.averageCostPerRequest = stats.totalCost / stats.totalRequests;
    }

    // Calculate time-based usage
    stats.hourlyUsage = this.calculateHourlyUsage(records);
    stats.dailyUsage = this.calculateDailyUsage(records);

    return stats;
  }

  private calculateHourlyUsage(records: TokenUsageRecord[]): Array<{ hour: string; tokens: number; cost: number; requests: number }> {
    const hourlyData: { [hour: string]: { tokens: number; cost: number; requests: number } } = {};

    records.forEach(record => {
      const hour = this.getHourKey(record.timestamp);
      if (!hourlyData[hour]) {
        hourlyData[hour] = { tokens: 0, cost: 0, requests: 0 };
      }
      hourlyData[hour].tokens += record.totalTokens;
      hourlyData[hour].cost += record.cost;
      hourlyData[hour].requests += 1;
    });

    return Object.entries(hourlyData)
      .map(([hour, data]) => ({ hour, ...data }))
      .sort((a, b) => a.hour.localeCompare(b.hour))
      .slice(-24); // Last 24 hours
  }

  private calculateDailyUsage(records: TokenUsageRecord[]): Array<{ date: string; tokens: number; cost: number; requests: number }> {
    const dailyData: { [date: string]: { tokens: number; cost: number; requests: number } } = {};

    records.forEach(record => {
      const date = this.getDayKey(record.timestamp);
      if (!dailyData[date]) {
        dailyData[date] = { tokens: 0, cost: 0, requests: 0 };
      }
      dailyData[date].tokens += record.totalTokens;
      dailyData[date].cost += record.cost;
      dailyData[date].requests += 1;
    });

    return Object.entries(dailyData)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30); // Last 30 days
  }

  async checkQuotaLimit(userId: string, tier: 'free' | 'premium' = 'free'): Promise<QuotaLimit> {
    const quotaConfig = this.config.quotas[tier];
    const now = new Date();

    const periods: Array<{ type: 'hourly' | 'daily' | 'monthly'; resetAt: Date }> = [
      {
        type: 'hourly',
        resetAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0, 0),
      },
      {
        type: 'daily',
        resetAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0),
      },
      {
        type: 'monthly',
        resetAt: new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0),
      },
    ];

    // For simplicity, we'll check the most restrictive period (hourly)
    // In a production system, you'd check all periods and take the most restrictive
    const period = periods[0]; // Hourly
    const quota = quotaConfig[period.type];

    let currentTokens = 0;
    let currentCost = 0;
    let currentRequests = 0;

    if (this.redisClient) {
      try {
        const hourKey = this.getKey('hourly', this.getHourKey(now));
        const usage = await this.redisClient.hmget(hourKey, 'tokens', 'cost', 'requests');
        currentTokens = parseInt(usage[0] || '0');
        currentCost = parseFloat(usage[1] || '0');
        currentRequests = parseInt(usage[2] || '0');
      } catch (error) {
        console.error('[TokenTracker] Failed to check quota in Redis:', error);
      }
    } else {
      // Fallback to memory store
      const hourAgo = new Date(now.getTime() - 3600000);
      const recentRecords = this.memoryStore.filter(
        record => record.userId === userId && record.timestamp >= hourAgo
      );

      currentTokens = recentRecords.reduce((sum, record) => sum + record.totalTokens, 0);
      currentCost = recentRecords.reduce((sum, record) => sum + record.cost, 0);
      currentRequests = recentRecords.length;
    }

    return {
      userId,
      period: period.type,
      maxTokens: quota.tokens,
      maxCost: quota.cost,
      maxRequests: quota.requests,
      currentTokens,
      currentCost,
      currentRequests,
      resetAt: period.resetAt,
    };
  }

  async exportUsageData(
    format: 'json' | 'csv' = 'json',
    timeframe?: { start: Date; end: Date },
    userId?: string
  ): Promise<string> {
    const records = this.redisClient ?
      await this.getRecordsFromRedis(timeframe, userId) :
      this.getRecordsFromMemory(timeframe, userId);

    if (format === 'csv') {
      const headers = [
        'id', 'timestamp', 'service', 'model', 'operation',
        'promptTokens', 'completionTokens', 'totalTokens', 'cost',
        'userId', 'sessionId', 'requestId'
      ];

      const csvRows = [
        headers.join(','),
        ...records.map(record => [
          record.id,
          record.timestamp.toISOString(),
          record.service,
          record.model,
          record.operation,
          record.promptTokens,
          record.completionTokens,
          record.totalTokens,
          record.cost.toFixed(6),
          record.userId || '',
          record.sessionId || '',
          record.requestId || '',
        ].join(','))
      ];

      return csvRows.join('\n');
    }

    return JSON.stringify(records, null, 2);
  }

  async cleanup(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
    this.memoryStore = [];
  }
}

// Export singleton instance
export const tokenTracker = new TokenTracker();