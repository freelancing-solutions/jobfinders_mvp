import { withAuth } from 'next-auth/middleware';
import { RateLimiter } from '@/lib/rate-limiter';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { UserRole } from '@/types/roles';

// Define protected routes and their required subscription features
const protectedRoutes = {
  '/api/ai/': ['ai'],
  '/api/resume-builder/': ['resumeBuilder'],
  '/api/ats/': ['atsSystem'],
  '/api/matching/': ['matching'],
  '/api/employer/': [UserRole.EMPLOYER],
} as const;

// Extend the middleware configuration
export default withAuth(
  async function middleware(req: NextRequest) {
    const token = req.nextauth?.token;
    const path = req.nextUrl.pathname;
    
    // Allow public routes
    if (path.startsWith('/api/public')) {
      return NextResponse.next();
    }

    // Allow authentication routes
    if (path.startsWith('/api/auth')) {
      return NextResponse.next();
    }

    // Check for valid session
    if (!token) {
      return new NextResponse(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check subscription requirements for protected routes
    for (const [route, features] of Object.entries(protectedRoutes)) {
      if (path.startsWith(route)) {
        try {
          const subscription = await prisma.subscription.findFirst({
            where: {
              userId: token.sub as string,
              status: 'ACTIVE',
              endDate: { gt: new Date() },
            },
            include: { plan: true },
          });

          if (!subscription || !features.every(feature => 
            subscription.plan.features.includes(feature)
          )) {
            return new NextResponse(
              JSON.stringify({ 
                error: 'Subscription required',
                requiredFeatures: features 
              }),
              { status: 403, headers: { 'Content-Type': 'application/json' } }
            );
          }
        } catch (error) {
          console.error('Subscription check failed:', error);
          return new NextResponse(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/auth/signin',
      error: '/auth/error',
    }
  }
);