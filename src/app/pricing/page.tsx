import { PricingPlans } from '@/components/subscription/pricing-plans';
import { SubscriptionStatus } from '@/components/subscription/subscription-status';
import { AppLayout } from '@/components/layout/app-layout';

export default function PricingPage() {
  return (
    <AppLayout>
      <div className="container max-w-7xl mx-auto py-10 space-y-10">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold tracking-tight">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Choose the plan that best fits your needs. All plans include access to our
            core features.
          </p>
        </div>

        <SubscriptionStatus />
        <PricingPlans />
      </div>
    </AppLayout>
  );
}
