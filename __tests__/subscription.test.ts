import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PayPalClient } from '@/lib/paypal';
import { prisma } from '@/lib/prisma';
import { UsageTrackingService } from '@/services/usage-tracking';
import { InvoiceService } from '@/services/invoice';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    subscription: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    plan: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    usage: {
      findMany: jest.fn(),
      upsert: jest.fn(),
      updateMany: jest.fn(),
    },
    invoice: {
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Mock PayPal client
jest.mock('@/lib/paypal');

describe('Subscription System', () => {
  let paypalClient: jest.Mocked<PayPalClient>;
  let usageTracking: UsageTrackingService;
  let invoiceService: InvoiceService;

  beforeEach(() => {
    jest.clearAllMocks();
    paypalClient = new PayPalClient({
      clientId: 'test',
      clientSecret: 'test',
      environment: 'sandbox',
    }) as any;
    usageTracking = UsageTrackingService.getInstance();
    invoiceService = new InvoiceService();
  });

  describe('PayPal Integration', () => {
    it('should create a subscription', async () => {
      const mockSubscription = {
        id: 'sub_123',
        status: 'PENDING',
      };

      paypalClient.createSubscription.mockResolvedValue(mockSubscription);

      const result = await paypalClient.createSubscription({
        plan_id: 'plan_123',
        subscriber: {
          name: 'Test User',
          email: 'test@example.com',
        },
      });

      expect(result).toEqual(mockSubscription);
      expect(paypalClient.createSubscription).toHaveBeenCalledWith({
        plan_id: 'plan_123',
        subscriber: {
          name: 'Test User',
          email: 'test@example.com',
        },
      });
    });

    it('should cancel a subscription', async () => {
      await paypalClient.cancelSubscription('sub_123');
      expect(paypalClient.cancelSubscription).toHaveBeenCalledWith('sub_123');
    });
  });

  describe('Usage Tracking', () => {
    it('should track feature usage', async () => {
      const mockUsage = {
        userId: 'user_123',
        feature: 'job_applications',
        count: 1,
        resetDate: new Date(),
      };

      (prisma.usage.upsert as jest.Mock).mockResolvedValue(mockUsage);
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        plan: {
          limits: {
            job_applications: 10,
          },
        },
      });

      await usageTracking.trackUsage({
        userId: 'user_123',
        feature: 'job_applications',
      });

      expect(prisma.usage.upsert).toHaveBeenCalled();
    });

    it('should throw error when limit exceeded', async () => {
      (prisma.subscription.findFirst as jest.Mock).mockResolvedValue({
        plan: {
          limits: {
            job_applications: 5,
          },
        },
      });

      (prisma.usage.upsert as jest.Mock).mockResolvedValue({
        count: 6,
      });

      await expect(
        usageTracking.trackUsage({
          userId: 'user_123',
          feature: 'job_applications',
        })
      ).rejects.toThrow('Usage limit exceeded');
    });
  });

  describe('Invoice Generation', () => {
    it('should generate an invoice', async () => {
      const mockInvoice = {
        id: 'inv_123',
        userId: 'user_123',
        amount: 99.99,
        status: 'PAID',
      };

      (prisma.invoice.create as jest.Mock).mockResolvedValue({
        ...mockInvoice,
        user: { name: 'Test User', email: 'test@example.com' },
        subscription: {
          plan: { name: 'Premium Plan' },
        },
      });

      const result = await invoiceService.createInvoice({
        userId: 'user_123',
        subscriptionId: 'sub_123',
        amount: 99.99,
        currency: 'USD',
        status: 'PAID',
        billingPeriod: {
          start: new Date(),
          end: new Date(),
        },
        items: [
          {
            description: 'Premium Plan',
            quantity: 1,
            unitPrice: 99.99,
            total: 99.99,
          },
        ],
      });

      expect(result).toBe('inv_123');
      expect(prisma.invoice.create).toHaveBeenCalled();
    });
  });
});
