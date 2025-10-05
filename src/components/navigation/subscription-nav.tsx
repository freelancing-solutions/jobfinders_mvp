import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  CreditCard,
  LineChart,
  FileText,
  Settings,
  Users,
  Building,
  Briefcase,
} from 'lucide-react';

interface NavigationItem {
  href: string;
  label: string;
  icon: React.ComponentType;
  roles: string[];
}

const subscriptionNavigation: NavigationItem[] = [
  {
    href: '/settings/billing',
    label: 'Billing & Subscription',
    icon: CreditCard,
    roles: ['SEEKER', 'EMPLOYER'],
  },
  {
    href: '/settings/usage',
    label: 'Usage & Limits',
    icon: LineChart,
    roles: ['SEEKER', 'EMPLOYER'],
  },
  {
    href: '/settings/invoices',
    label: 'Invoices',
    icon: FileText,
    roles: ['SEEKER', 'EMPLOYER'],
  },
  {
    href: '/admin/plans',
    label: 'Plan Management',
    icon: Settings,
    roles: ['ADMIN'],
  },
  {
    href: '/admin/subscriptions',
    label: 'User Subscriptions',
    icon: Users,
    roles: ['ADMIN'],
  },
];

export function SubscriptionNavigation() {
  const { data: session } = useSession();
  const router = useRouter();

  if (!session) return null;

  const userRole = session.user.role;
  const filteredNavigation = subscriptionNavigation.filter(item =>
    item.roles.includes(userRole)
  );

  return (
    <nav className="space-y-1">
      {filteredNavigation.map((item) => {
        const Icon = item.icon;
        const isActive = router.pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`
              flex items-center px-4 py-2 text-sm font-medium rounded-md
              ${isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
              }
            `}
          >
            <Icon className="mr-3 h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
