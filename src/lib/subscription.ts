import { PayPalClient } from '@/lib/paypal';
import { prisma } from '@/lib/prisma';

export class SubscriptionHandler {
  private paypal: PayPalClient;

  constructor() {
    this.paypal = new PayPalClient({
      clientId: process.env.PAYPAL_CLIENT_ID!,
      clientSecret: process.env.PAYPAL_SECRET!,
      environment: process.env.NODE_ENV === 'production' ? 'live' : 'sandbox',
    });
  }

  async createSubscription(userId: string, planId: string) {
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new Error('Plan not found');

    const subscription = await this.paypal.createSubscription({
      plan_id: plan.paypalPlanId,
      subscriber: { user_id: userId },
    });

    await prisma.subscription.create({
      data: {
        userId,
        planId,
        status: 'PENDING',
        paypalId: subscription.id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    return subscription;
  }
}