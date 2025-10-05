import { NextRequest } from 'next/server';
import { apiHandler, APIError } from '@/lib/api-handler';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { PayPalClient } from '@/lib/paypal';

const planSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string(),
  type: z.enum(['SEEKER', 'EMPLOYER']),
  price: z.number().min(0),
  currency: z.string().length(3),
  interval: z.enum(['MONTHLY', 'YEARLY']),
  features: z.array(z.string()),
  limits: z.record(z.string(), z.number()),
  isActive: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  return apiHandler(req, async (req) => {
    const session = await getSession();
    if (!session?.user?.role !== 'ADMIN') {
      throw new APIError('Not authorized', 401);
    }

    const body = await req.json();
    const data = planSchema.parse(body);

    // Create PayPal product and plan
    const paypal = new PayPalClient({
      clientId: process.env.PAYPAL_CLIENT_ID!,
      clientSecret: process.env.PAYPAL_SECRET!,
      environment: process.env.NODE_ENV === 'production' ? 'live' : 'sandbox',
    });

    const product = await paypal.createProduct({
      name: data.name,
      description: data.description,
      type: 'SERVICE',
    });

    const paypalPlan = await paypal.createPlan({
      product_id: product.id,
      name: data.name,
      description: data.description,
      billing_cycles: [
        {
          frequency: {
            interval_unit: data.interval === 'MONTHLY' ? 'MONTH' : 'YEAR',
            interval_count: 1,
          },
          tenure_type: 'REGULAR',
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: {
            fixed_price: {
              value: data.price.toString(),
              currency_code: data.currency,
            },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: 'CONTINUE',
        payment_failure_threshold: 3,
      },
    });

    // Create plan in database
    const plan = await prisma.plan.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        price: data.price,
        currency: data.currency,
        interval: data.interval,
        features: data.features,
        limits: data.limits,
        isActive: data.isActive,
        paypalProductId: product.id,
        paypalPlanId: paypalPlan.id,
      },
    });

    return Response.json({
      success: true,
      data: plan,
    });
  }, {
    requireAuth: true,
    validateRequest: planSchema,
  });
}

export async function PUT(req: NextRequest) {
  return apiHandler(req, async (req) => {
    const session = await getSession();
    if (!session?.user?.role !== 'ADMIN') {
      throw new APIError('Not authorized', 401);
    }

    const { searchParams } = new URL(req.url);
    const planId = searchParams.get('id');
    if (!planId) {
      throw new APIError('Plan ID is required', 400);
    }

    const body = await req.json();
    const data = planSchema.parse(body);

    // Update PayPal plan if needed
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new APIError('Plan not found', 404);
    }

    const paypal = new PayPalClient({
      clientId: process.env.PAYPAL_CLIENT_ID!,
      clientSecret: process.env.PAYPAL_SECRET!,
      environment: process.env.NODE_ENV === 'production' ? 'live' : 'sandbox',
    });

    if (data.price !== plan.price || data.currency !== plan.currency) {
      await paypal.updatePlan(plan.paypalPlanId, {
        pricing_schemes: [
          {
            billing_cycle_sequence: 1,
            pricing_scheme: {
              fixed_price: {
                value: data.price.toString(),
                currency_code: data.currency,
              },
            },
          },
        ],
      });
    }

    // Update plan in database
    const updatedPlan = await prisma.plan.update({
      where: { id: planId },
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        price: data.price,
        currency: data.currency,
        interval: data.interval,
        features: data.features,
        limits: data.limits,
        isActive: data.isActive,
      },
    });

    return Response.json({
      success: true,
      data: updatedPlan,
    });
  }, {
    requireAuth: true,
    validateRequest: planSchema,
  });
}

export async function DELETE(req: NextRequest) {
  return apiHandler(req, async (req) => {
    const session = await getSession();
    if (!session?.user?.role !== 'ADMIN') {
      throw new APIError('Not authorized', 401);
    }

    const { searchParams } = new URL(req.url);
    const planId = searchParams.get('id');
    if (!planId) {
      throw new APIError('Plan ID is required', 400);
    }

    // Deactivate plan instead of deleting
    const plan = await prisma.plan.update({
      where: { id: planId },
      data: { isActive: false },
    });

    // Deactivate PayPal plan
    const paypal = new PayPalClient({
      clientId: process.env.PAYPAL_CLIENT_ID!,
      clientSecret: process.env.PAYPAL_SECRET!,
      environment: process.env.NODE_ENV === 'production' ? 'live' : 'sandbox',
    });

    await paypal.deactivatePlan(plan.paypalPlanId);

    return Response.json({
      success: true,
      message: 'Plan deactivated successfully',
    });
  }, {
    requireAuth: true,
  });
}
