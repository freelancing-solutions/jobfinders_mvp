import { PricingPlans } from '@/components/subscription/pricing-plans';
import { SubscriptionStatus } from '@/components/subscription/subscription-status';
import { HeroSection, SectionLayout } from '@/components/design-system';

export default function PricingPage() {
  return (
    <div className="bg-background">
      {/* Hero Section */}
      <HeroSection
        title="Simple, Transparent Pricing"
        subtitle="Choose the Perfect Plan for Your Career"
        description="Choose the plan that best fits your needs. All plans include access to our core features and AI-powered tools."
        background="gradient"
        size="lg"
        alignment="center"
      />

      {/* Pricing Content */}
      <SectionLayout spacing="lg">
        <SubscriptionStatus />
        <PricingPlans />
      </SectionLayout>
    </div>
  );
}
