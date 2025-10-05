import { NextRequest } from 'next/server';
import { apiHandler, APIError } from '@/lib/api-handler';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

const WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID!;

// Verify PayPal webhook signature
function verifyWebhookSignature(
  body: string,
  headers: { [key: string]: string }
): boolean {
  try {
    const transmission_id = headers['paypal-transmission-id'];
    const timestamp = headers['paypal-transmission-time'];
    const webhook_id = WEBHOOK_ID;
    const event_body = body;
    const cert_url = headers['paypal-cert-url'];
    const auth_algo = headers['paypal-auth-algo'];
    const actual_signature = headers['paypal-transmission-sig'];

    const expected_signature = crypto
      .createHmac('sha256', webhook_id)
      .update(transmission_id + '|' + timestamp + '|' + webhook_id + '|' + event_body)
      .digest('base64');

    return actual_signature === expected_signature;
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return false;
  }
}

export async function POST(req: NextRequest) {
  return apiHandler(req, async (req) => {
    const body = await req.text();
    const headers = Object.fromEntries(req.headers);

    // Verify webhook signature
    if (!verifyWebhookSignature(body, headers)) {
      throw new APIError('Invalid webhook signature', 401);
    }

    const event = JSON.parse(body);

    // Handle different webhook events
    switch (event.event_type) {
      case 'BILLING.SUBSCRIPTION.CREATED':
        await handleSubscriptionCreated(event);
        break;

      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await handleSubscriptionActivated(event);
        break;

      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await handleSubscriptionCancelled(event);
        break;

      case 'BILLING.SUBSCRIPTION.EXPIRED':
        await handleSubscriptionExpired(event);
        break;

      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
        await handlePaymentFailed(event);
        break;

      default:
        console.log('Unhandled webhook event:', event.event_type);
    }

    return Response.json({ received: true });
  });
}

async function handleSubscriptionCreated(event: any) {
  const subscription = await prisma.subscription.findFirst({
    where: { paypalId: event.resource.id },
  });

  if (!subscription) {
    console.error('Subscription not found:', event.resource.id);
    return;
  }

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: 'PENDING',
      metadata: {
        ...subscription.metadata,
        paypalEvent: event,
      },
    },
  });
}

async function handleSubscriptionActivated(event: any) {
  const subscription = await prisma.subscription.findFirst({
    where: { paypalId: event.resource.id },
  });

  if (!subscription) {
    console.error('Subscription not found:', event.resource.id);
    return;
  }

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: new Date(event.resource.billing_info.next_billing_time),
      metadata: {
        ...subscription.metadata,
        paypalEvent: event,
      },
    },
  });

  // Create notification
  await prisma.notification.create({
    data: {
      userId: subscription.userId,
      type: 'SUBSCRIPTION_ACTIVATED',
      title: 'Subscription Activated',
      message: 'Your subscription has been successfully activated',
      metadata: {
        subscriptionId: subscription.id,
        planId: subscription.planId,
      },
    },
  });
}

async function handleSubscriptionCancelled(event: any) {
  const subscription = await prisma.subscription.findFirst({
    where: { paypalId: event.resource.id },
  });

  if (!subscription) {
    console.error('Subscription not found:', event.resource.id);
    return;
  }

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: 'CANCELLED',
      endDate: new Date(),
      metadata: {
        ...subscription.metadata,
        paypalEvent: event,
      },
    },
  });

  // Create notification
  await prisma.notification.create({
    data: {
      userId: subscription.userId,
      type: 'SUBSCRIPTION_CANCELLED',
      title: 'Subscription Cancelled',
      message: 'Your subscription has been cancelled',
      metadata: {
        subscriptionId: subscription.id,
        planId: subscription.planId,
      },
    },
  });
}

async function handleSubscriptionExpired(event: any) {
  const subscription = await prisma.subscription.findFirst({
    where: { paypalId: event.resource.id },
  });

  if (!subscription) {
    console.error('Subscription not found:', event.resource.id);
    return;
  }

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: 'EXPIRED',
      endDate: new Date(),
      metadata: {
        ...subscription.metadata,
        paypalEvent: event,
      },
    },
  });

  // Create notification
  await prisma.notification.create({
    data: {
      userId: subscription.userId,
      type: 'SUBSCRIPTION_EXPIRED',
      title: 'Subscription Expired',
      message: 'Your subscription has expired',
      metadata: {
        subscriptionId: subscription.id,
        planId: subscription.planId,
      },
    },
  });
}

async function handlePaymentFailed(event: any) {
  const subscription = await prisma.subscription.findFirst({
    where: { paypalId: event.resource.id },
  });

  if (!subscription) {
    console.error('Subscription not found:', event.resource.id);
    return;
  }

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: 'PAST_DUE',
      metadata: {
        ...subscription.metadata,
        paypalEvent: event,
      },
    },
  });

  // Create notification
  await prisma.notification.create({
    data: {
      userId: subscription.userId,
      type: 'PAYMENT_FAILED',
      title: 'Payment Failed',
      message: 'Your subscription payment has failed. Please update your payment method.',
      metadata: {
        subscriptionId: subscription.id,
        planId: subscription.planId,
      },
    },
  });
}
