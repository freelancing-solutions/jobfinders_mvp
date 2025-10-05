import { NextRequest } from 'next/server';
import { apiHandler, APIError } from '@/lib/api-handler';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getSession } from 'next-auth/react';
import { PayPalClient } from '@/lib/paypal';

const subscriptionSchema = z.object({
  planId: z.string().cuid(),
  interval: z.enum(['MONTHLY', 'YEARLY']),
});

export async function POST(req: NextRequest) {
  return apiHandler(req, async (req) => {
    const session = await getSession();
    if (!session?.user?.id) {
      throw new APIError('Not authorized', 401);
    }

    const body = await req.json();
    const data = subscriptionSchema.parse(body);

    // Check if plan exists
    const plan = await prisma.plan.findUnique({
      where: { id: data.planId },
    });

    if (!plan) {
      throw new APIError('Plan not found', 404);
    }

    // Check for existing subscription
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ['ACTIVE', 'PENDING'] },
      },
    });

    if (existingSubscription) {
      throw new APIError('Active subscription already exists', 400);
    }

    // Initialize PayPal client
    const paypal = new PayPalClient({
      clientId: process.env.PAYPAL_CLIENT_ID!,
      clientSecret: process.env.PAYPAL_SECRET!,
      environment: process.env.NODE_ENV === 'production' ? 'live' : 'sandbox',
    });

    // Create PayPal subscription
    const paypalSubscription = await paypal.createSubscription({
      plan_id: plan.paypalPlanId,
      subscriber: {
        name: session.user.name,
        email: session.user.email,
      },
      application_context: {
        brand_name: 'JobFinders',
        return_url: `${process.env.NEXTAUTH_URL}/settings/billing?success=true`,
        cancel_url: `${process.env.NEXTAUTH_URL}/settings/billing?success=false`,
      },
    });

    // Create subscription record
    const subscription = await prisma.subscription.create({
      data: {
        userId: session.user.id,
        planId: data.planId,
        status: 'PENDING',
        paypalId: paypalSubscription.id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days initial
        interval: data.interval,
      },
    });

    return Response.json({
      success: true,
      data: {
        id: subscription.id,
        approvalUrl: paypalSubscription.links.find(
          (link: any) => link.rel === 'approve'
        )?.href,
      },
    });
  }, {
    requireAuth: true,
    validateRequest: subscriptionSchema,
  });
}

export async function GET(req: NextRequest) {
  return apiHandler(req, async (req) => {
    const session = await getSession();
    if (!session?.user?.id) {
      throw new APIError('Not authorized', 401);
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ['ACTIVE', 'PENDING'] },
      },
      include: {
        plan: true,
      },
    });

    if (!subscription) {
      throw new APIError('No active subscription found', 404);
    }

    return Response.json({
      success: true,
      data: subscription,
    });
  }, {
    requireAuth: true,
  });
}

// Cancel subscription
export async function DELETE(req: NextRequest) {
  return apiHandler(req, async (req) => {
    const session = await getSession();
    if (!session?.user?.id) {
      throw new APIError('Not authorized', 401);
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: 'ACTIVE',
      },
    });

    if (!subscription) {
      throw new APIError('No active subscription found', 404);
    }

    // Initialize PayPal client
    const paypal = new PayPalClient({
      clientId: process.env.PAYPAL_CLIENT_ID!,
      clientSecret: process.env.PAYPAL_SECRET!,
      environment: process.env.NODE_ENV === 'production' ? 'live' : 'sandbox',
    });

    // Cancel PayPal subscription
    await paypal.cancelSubscription(subscription.paypalId);

    // Update subscription record
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'CANCELLED',
        endDate: new Date(),
      },
    });

    return Response.json({
      success: true,
      message: 'Subscription cancelled successfully',
    });
  }, {
    requireAuth: true,
  });
}
