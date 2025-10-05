import { SubscriptionNavigation } from './subscription-nav';

interface SubscriptionLayoutProps {
  children: React.ReactNode;
}

export function SubscriptionLayout({ children }: SubscriptionLayoutProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 flex-shrink-0">
          <SubscriptionNavigation />
        </aside>
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
