# Design: Dashboard User Details Fix (Job Seeker)

## Root Cause Analysis

### Investigation Steps
1. Check NextAuth SessionProvider wrapper
2. Verify useSession() hook usage
3. Test /api/user/me endpoint
4. Inspect TanStack Query setup
5. Review navbar component props
6. Check role-based middleware

### Likely Causes (to verify):
- Session data not including user details
- API endpoint returning incomplete data
- Query not triggering on dashboard mount
- Navbar not subscribed to user state changes

## Component Architecture

```
┌──────────────────────────────────────────────────┐
│              App Layout                           │
│  ┌────────────────────────────────────────────┐ │
│  │   SessionProvider (NextAuth)               │ │
│  │  ┌──────────────────────────────────────┐ │ │
│  │  │    QueryClientProvider (TanStack)    │ │ │
│  │  │  ┌────────────────────────────────┐ │ │ │
│  │  │  │      Navbar Component          │ │ │ │
│  │  │  │  - useSession()                │ │ │ │
│  │  │  │  - useQuery(['user'])          │ │ │ │
│  │  │  └────────────────────────────────┘ │ │ │
│  │  │  ┌────────────────────────────────┐ │ │ │
│  │  │  │   Dashboard Page (Seeker)      │ │ │ │
│  │  │  │  - useQuery(['user'])          │ │ │ │
│  │  │  │  - Display user details        │ │ │ │
│  │  │  └────────────────────────────────┘ │ │ │
│  │  └──────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘

Data Flow:
1. User logs in → NextAuth creates session
2. Dashboard mounts → useQuery fetches user data from API
3. API reads session → Queries database → Returns user details
4. TanStack Query caches data
5. Navbar subscribes to same query → Displays user info
```

## Implementation Strategy

### Fix 1: Ensure SessionProvider Wraps App
**File:** `src/app/layout.tsx`

```typescript
import { SessionProvider } from 'next-auth/react';

export default function RootLayout({ children }: { children: React.Node }) {
  return (
    <html>
      <body>
        <SessionProvider>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
```

### Fix 2: Create/Fix User API Endpoint
**File:** `src/app/api/user/me/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch complete user data from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profilePicture: true,
        subscription: {
          select: {
            tier: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('User fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Fix 3: Create Custom Hook for User Data
**File:** `src/hooks/useCurrentUser.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'seeker' | 'employer' | 'admin';
  profilePicture?: string;
  subscription?: {
    tier: string;
    status: string;
  };
}

export function useCurrentUser() {
  const { data: session, status } = useSession();

  return useQuery({
    queryKey: ['user', 'me'],
    queryFn: async (): Promise<User> => {
      const res = await fetch('/api/user/me');
      if (!res.ok) throw new Error('Failed to fetch user');
      return res.json();
    },
    enabled: status === 'authenticated', // Only fetch if authenticated
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}
```

### Fix 4: Update Navbar to Use Hook
**File:** `src/components/layout/Navbar.tsx`

```typescript
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSession } from 'next-auth/react';

export function Navbar() {
  const { status } = useSession();
  const { data: user, isLoading, error } = useCurrentUser();

  // Loading state
  if (status === 'loading' || isLoading) {
    return <NavbarSkeleton />;
  }

  // Error state (show logged out)
  if (error) {
    console.error('Failed to load user:', error);
    return <NavbarLoggedOut />;
  }

  // Authenticated state
  if (user) {
    return (
      <nav>
        {/* Logo, navigation links */}
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarImage src={user.profilePicture} />
            <AvatarFallback>{user.name?.[0]}</AvatarFallback>
          </Avatar>
          <DropdownMenu>
            <DropdownMenuTrigger>
              {user.name}
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem onClick={() => signOut()}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    );
  }

  // Logged out state
  return <NavbarLoggedOut />;
}
```

### Fix 5: Update Dashboard to Use Hook
**File:** `src/app/dashboard/seeker/page.tsx`

```typescript
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { redirect } from 'next/navigation';

export default function SeekerDashboard() {
  const { data: user, isLoading, error } = useCurrentUser();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error || !user) {
    redirect('/auth/login');
  }

  // Verify role
  if (user.role !== 'seeker') {
    redirect('/dashboard'); // Redirect to appropriate dashboard
  }

  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      {/* Dashboard content */}
    </div>
  );
}
```

## Testing Strategy

### Unit Tests
```typescript
// __tests__/hooks/useCurrentUser.test.ts
describe('useCurrentUser', () => {
  it('fetches user when authenticated', async () => {
    // Mock session
    mockUseSession({ status: 'authenticated' });
    
    // Mock API
    mockFetch('/api/user/me', { id: '1', name: 'John Doe' });
    
    const { result } = renderHook(() => useCurrentUser());
    
    await waitFor(() => {
      expect(result.current.data).toEqual({ id: '1', name: 'John Doe' });
    });
  });

  it('does not fetch when unauthenticated', () => {
    mockUseSession({ status: 'unauthenticated' });
    
    const { result } = renderHook(() => useCurrentUser());
    
    expect(result.current.data).toBeUndefined();
  });
});
```

### Integration Tests
```typescript
// __tests__/api/user/me.test.ts
describe('/api/user/me', () => {
  it('returns user data for authenticated user', async () => {
    const session = { user: { email: 'test@example.com' } };
    mockGetServerSession(session);
    
    const response = await GET(new NextRequest('http://localhost/api/user/me'));
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('name');
  });

  it('returns 401 for unauthenticated user', async () => {
    mockGetServerSession(null);
    
    const response = await GET(new NextRequest('http://localhost/api/user/me'));
    
    expect(response.status).toBe(401);
  });
});
```