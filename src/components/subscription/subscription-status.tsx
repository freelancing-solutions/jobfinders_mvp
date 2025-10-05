import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert } from '@/components/ui/alert';
import { CreditCard, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

type SubscriptionStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED';

interface SubscriptionPlan {
  id: string;
  name: string;
}

interface SubscriptionData {
  status: SubscriptionStatus;
  plan: SubscriptionPlan;
  endDate: string;
}

interface UsageItem {
  feature: string;
  current: number;
  limit: number;
}

export function SubscriptionStatus() {
  const { data: session } = useSession();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const res = await fetch('/api/subscriptions');
      if (!res.ok) throw new Error('Failed to fetch subscription');
      return res.json() as Promise<{ data: SubscriptionData }>;
    },
    enabled: !!session,
  });

  const { data: usage } = useQuery({
    queryKey: ['usage'],
    queryFn: async () => {
      const res = await fetch('/api/subscriptions/usage');
      if (!res.ok) throw new Error('Failed to fetch usage');
      return res.json() as Promise<{ data: UsageItem[] }>;
    },
    enabled: subscription?.data?.status === 'ACTIVE',
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!subscription?.data) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-medium">No Active Subscription</h3>
        <p className="text-muted-foreground mt-2">
          Choose a plan to access premium features
        </p>
        <Button asChild className="mt-4">
          <Link href="/pricing">View Plans</Link>
        </Button>
      </Card>
    );
  }

  const { data: subData } = subscription;
  
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">{subData.plan.name}</h3>
            <p className="text-muted-foreground">
              {subData.status === 'ACTIVE' ? 'Active until' : 'Expires on'}{' '}
              {new Date(subData.endDate).toLocaleDateString()}
            </p>
          </div>
          <Badge
            variant={subData.status === 'ACTIVE' ? 'secondary' : 'outline'}
            className={
              subData.status === 'ACTIVE'
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }
          >
            {subData.status}
          </Badge>
        </div>

        {subData.status === 'PAST_DUE' && (
          <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <p>Payment is overdue. Please update your payment method.</p>
          </Alert>
        )}

        <div className="mt-6">
          <Button asChild variant="outline">
            <Link href="/settings/billing">
              <CreditCard className="mr-2 h-4 w-4" />
              Manage Billing
            </Link>
          </Button>
        </div>
      </Card>

      {usage?.data && (
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Usage</h3>
          <div className="space-y-4">
            {usage.data.map((item) => (
              <div key={item.feature}>
                <div className="flex justify-between text-sm mb-2">
                  <span>{item.feature}</span>
                  <span>
                    {item.current} / {item.limit}
                  </span>
                </div>
                <Progress
                  value={(item.current / item.limit) * 100}
                  className="h-2"
                />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
