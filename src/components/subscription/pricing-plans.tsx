'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/types/roles';

interface PricingFeature {
  text: string;
  included: boolean;
}

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: 'month' | 'year';
  features: PricingFeature[];
  recommended?: boolean;
}

const jobSeekerPlans: PricingPlan[] = [
  {
    id: 'seeker-basic',
    name: 'Basic',
    description: 'Perfect for job seekers just starting out',
    price: 0,
    interval: 'month',
    features: [
      { text: 'Up to 10 job applications', included: true },
      { text: 'Basic resume builder', included: true },
      { text: 'Job matching', included: true },
      { text: 'AI resume analysis', included: false },
      { text: 'Priority applications', included: false },
      { text: 'Advanced analytics', included: false },
    ],
  },
  {
    id: 'seeker-pro',
    name: 'Professional',
    description: 'For serious job seekers who want to stand out',
    price: 29,
    interval: 'month',
    features: [
      { text: 'Unlimited job applications', included: true },
      { text: 'Advanced resume builder', included: true },
      { text: 'AI-powered job matching', included: true },
      { text: 'AI resume analysis', included: true },
      { text: 'Priority applications', included: true },
      { text: 'Advanced analytics', included: false },
    ],
    recommended: true,
  },
  {
    id: 'seeker-enterprise',
    name: 'Enterprise',
    description: 'Maximum features for career advancement',
    price: 99,
    interval: 'month',
    features: [
      { text: 'Unlimited job applications', included: true },
      { text: 'Advanced resume builder', included: true },
      { text: 'AI-powered job matching', included: true },
      { text: 'AI resume analysis', included: true },
      { text: 'Priority applications', included: true },
      { text: 'Advanced analytics', included: true },
    ],
  },
];

const employerPlans: PricingPlan[] = [
  {
    id: 'employer-basic',
    name: 'Startup',
    description: 'Perfect for small businesses and startups',
    price: 49,
    interval: 'month',
    features: [
      { text: 'Up to 3 active job postings', included: true },
      { text: 'Basic candidate matching', included: true },
      { text: 'Basic company profile', included: true },
      { text: 'Email support', included: true },
      { text: 'AI candidate screening', included: false },
      { text: 'Featured job postings', included: false },
      { text: 'Advanced analytics', included: false },
    ],
  },
  {
    id: 'employer-pro',
    name: 'Business',
    description: 'For growing companies with regular hiring needs',
    price: 149,
    interval: 'month',
    features: [
      { text: 'Up to 10 active job postings', included: true },
      { text: 'AI-powered candidate matching', included: true },
      { text: 'Enhanced company profile', included: true },
      { text: 'Priority support', included: true },
      { text: 'AI candidate screening', included: true },
      { text: '3 featured job postings', included: true },
      { text: 'Basic analytics', included: true },
    ],
    recommended: true,
  },
  {
    id: 'employer-enterprise',
    name: 'Enterprise',
    description: 'Custom solutions for large organizations',
    price: 499,
    interval: 'month',
    features: [
      { text: 'Unlimited job postings', included: true },
      { text: 'Advanced AI matching', included: true },
      { text: 'Premium company profile', included: true },
      { text: 'Dedicated account manager', included: true },
      { text: 'Advanced AI screening', included: true },
      { text: 'Unlimited featured postings', included: true },
      { text: 'Advanced analytics & reporting', included: true },
    ],
  },
];

export function PricingPlans() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleSelectPlan = async (planId: string) => {
    if (!session) {
      router.push('/auth/signin?callbackUrl=/pricing');
      return;
    }

    try {
      const response = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      router.push(url);
    } catch (error) {
      console.error('Error creating checkout session:', error);
      // You would typically show a toast notification here
    }
  };

  const isEmployer = session?.user?.role === UserRole.EMPLOYER;
  const plans = isEmployer ? employerPlans : jobSeekerPlans;

  return (
    <div className="space-y-8">
      {/* Plan Type Selector */}
      <div className="flex justify-center gap-4">
        <Button
          variant={!isEmployer ? 'default' : 'outline'}
          onClick={() => router.push('/auth/signin?role=seeker')}
        >
          Job Seeker Plans
        </Button>
        <Button
          variant={isEmployer ? 'default' : 'outline'}
          onClick={() => router.push('/auth/signin?role=employer')}
        >
          Employer Plans
        </Button>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
        <Card
          key={plan.id}
          className={
            'relative p-6 ' +
            (plan.recommended ? 'border-2 border-primary' : '')
          }
        >
          {plan.recommended && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-primary text-primary-foreground text-sm rounded-full px-3 py-1">
                Recommended
              </span>
            </div>
          )}

          <div className="text-center">
            <h3 className="text-2xl font-bold">{plan.name}</h3>
            <p className="text-muted-foreground mt-2">{plan.description}</p>
            <div className="mt-4">
              <span className="text-4xl font-bold">
                ${plan.price}
              </span>
              <span className="text-muted-foreground">/{plan.interval}</span>
            </div>
          </div>

          <ul className="mt-8 space-y-4">
            {plan.features.map((feature) => (
              <li
                key={feature.text}
                className={
                  'flex items-center ' +
                  (feature.included ? '' : 'text-muted-foreground')
                }
              >
                <Check
                  className={
                    'mr-3 h-4 w-4 ' +
                    (feature.included ? 'text-green-500' : 'text-muted-foreground')
                  }
                />
                {feature.text}
              </li>
            ))}
          </ul>

          <Button
            className="w-full mt-8"
            variant={plan.recommended ? 'default' : 'outline'}
            onClick={() => handleSelectPlan(plan.id)}
          >
            {plan.price === 0 ? 'Get Started' : 'Subscribe Now'}
          </Button>
        </Card>
      ))}
      </div>
    </div>
  );
}
