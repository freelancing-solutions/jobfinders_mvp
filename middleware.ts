import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define route patterns and their required roles
const routeProtection = {
  // Admin routes - require ADMIN role
  '/admin': ['ADMIN'],
  
  // Employer routes - require EMPLOYER role
  '/employer': ['EMPLOYER'],
  
  // Job seeker specific routes - require SEEKER role
  '/jobs/saved': ['SEEKER'],
  '/applications': ['SEEKER'],
  
  // Protected routes that require authentication but any role
  '/profile': ['SEEKER', 'EMPLOYER', 'ADMIN'],
  '/settings': ['SEEKER', 'EMPLOYER', 'ADMIN'],
  '/notifications': ['SEEKER', 'EMPLOYER', 'ADMIN'],
  
  // Public routes that don't require authentication
  '/': null,
  '/jobs': null,
  '/companies': null,
  '/about': null,
  '/contact': null,
  '/auth': null,
}

// Routes that should redirect authenticated users away
const authRoutes = ['/auth/signin', '/auth/signup', '/auth/register']

// Get the most specific matching route pattern
function getRoutePattern(pathname: string): string | null {
  // Sort routes by specificity (longer paths first)
  const sortedRoutes = Object.keys(routeProtection).sort((a, b) => b.length - a.length)
  
  for (const route of sortedRoutes) {
    if (pathname.startsWith(route)) {
      return route
    }
  }
  
  return null
}

// Check if user has required role for the route
function hasRequiredRole(userRole: string | undefined, requiredRoles: string[] | null): boolean {
  if (!requiredRoles) return true // Public route
  if (!userRole) return false // No user role but route requires authentication
  
  return requiredRoles.includes(userRole)
}

// Get redirect URL based on user role
function getRedirectUrl(userRole: string | undefined): string {
  switch (userRole) {
    case 'ADMIN':
      return '/admin/dashboard'
    case 'EMPLOYER':
      return '/employer/dashboard'
    case 'SEEKER':
      return '/jobs'
    default:
      return '/'
  }
}

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token
    const userRole = token?.role as string | undefined

    // Handle auth routes - redirect authenticated users
    if (authRoutes.some(route => pathname.startsWith(route))) {
      if (token) {
        const redirectUrl = getRedirectUrl(userRole)
        return NextResponse.redirect(new URL(redirectUrl, req.url))
      }
      return NextResponse.next()
    }

    // Get route protection requirements
    const routePattern = getRoutePattern(pathname)
    const requiredRoles = routePattern ? routeProtection[routePattern as keyof typeof routeProtection] : null

    // Check if route requires authentication
    if (requiredRoles !== null) {
      // Route requires authentication
      if (!token) {
        // Not authenticated - redirect to signin
        const signInUrl = new URL('/auth/signin', req.url)
        signInUrl.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(signInUrl)
      }

      // Check role authorization
      if (!hasRequiredRole(userRole, requiredRoles)) {
        // User doesn't have required role
        if (userRole) {
          // Authenticated but wrong role - redirect to appropriate dashboard
          const redirectUrl = getRedirectUrl(userRole)
          return NextResponse.redirect(new URL(redirectUrl, req.url))
        } else {
          // No role assigned - redirect to profile completion
          return NextResponse.redirect(new URL('/profile?setup=true', req.url))
        }
      }
    }

    // Allow the request to proceed
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Always allow access to public routes and auth routes
        if (authRoutes.some(route => pathname.startsWith(route))) {
          return true
        }
        
        const routePattern = getRoutePattern(pathname)
        const requiredRoles = routePattern ? routeProtection[routePattern as keyof typeof routeProtection] : null
        
        // Public routes don't require authentication
        if (requiredRoles === null) {
          return true
        }
        
        // Protected routes require a token
        return !!token
      },
    },
  }
)

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}