import { prisma } from '@/lib/prisma';

export interface UsageLimit {
  feature: string;
  current: number;
  limit: number;
  resetDate: Date;
}

export class UsageTrackingService {
  private static instance: UsageTrackingService;

  private constructor() {}

  static getInstance(): UsageTrackingService {
    if (!UsageTrackingService.instance) {
      UsageTrackingService.instance = new UsageTrackingService();
    }
    return UsageTrackingService.instance;
  }

  async trackUsage(params: {
    userId: string;
    feature: string;
    amount?: number;
  }): Promise<void> {
    const { userId, feature, amount = 1 } = params;

    // Get current subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
      },
      include: {
        plan: true,
      },
    });

    if (!subscription) {
      throw new Error('No active subscription found');
    }

    // Get or create usage record
    const usage = await prisma.usage.upsert({
      where: {
        userId_feature: {
          userId,
          feature,
        },
      },
      update: {
        count: {
          increment: amount,
        },
      },
      create: {
        userId,
        feature,
        count: amount,
        resetDate: this.getNextResetDate(subscription.interval),
      },
    });

    // Check limits
    if (subscription.plan.limits[feature] && 
        usage.count > subscription.plan.limits[feature]) {
      throw new Error(`Usage limit exceeded for ${feature}`);
    }
  }

  async getUsage(userId: string): Promise<UsageLimit[]> {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
      },
      include: {
        plan: true,
      },
    });

    if (!subscription) {
      return [];
    }

    const usage = await prisma.usage.findMany({
      where: {
        userId,
      },
    });

    return Object.entries(subscription.plan.limits).map(([feature, limit]) => ({
      feature,
      current: usage.find(u => u.feature === feature)?.count || 0,
      limit,
      resetDate: usage.find(u => u.feature === feature)?.resetDate || new Date(),
    }));
  }

  async resetUsage(userId: string, feature?: string): Promise<void> {
    const where = {
      userId,
      ...(feature ? { feature } : {}),
    };

    await prisma.usage.updateMany({
      where,
      data: {
        count: 0,
        resetDate: this.getNextResetDate('MONTHLY'),
      },
    });
  }

  private getNextResetDate(interval: 'MONTHLY' | 'YEARLY'): Date {
    const date = new Date();
    if (interval === 'MONTHLY') {
      date.setMonth(date.getMonth() + 1);
    } else {
      date.setFullYear(date.getFullYear() + 1);
    }
    return date;
  }
}
