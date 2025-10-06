I have created the following plan after thorough exploration and analysis of the codebase. Follow the below plan verbatim. Trust the files and references. Do not re-verify what's written in the plan. Explore only when absolutely necessary. First implement all the proposed file changes and then I'll review all the changes together at the end.

### Observations

## Current State Analysis

The JobFinders MVP has a **partially implemented navigation system** with role-based components already in place:

**Existing Infrastructure:**
- Navigation config at `src/config/navigation.ts` with public, job seeker, and employer items
- `NavigationHeader` component with `NavigationDropdown` and `UserAvatarDropdown`
- `useCurrentUser` hook for authentication state
- NextAuth with Prisma adapter and session management
- Breadcrumb UI components (unused)
- Categories API endpoint at `/api/jobs/categories`

**Critical Issues Identified:**
1. **Role naming inconsistency**: Database uses `"seeker"/"employer"/"admin"`, TypeScript types use `"USER"/"EMPLOYER"/"ADMIN"`, navigation config uses `"job_seeker"/"employer"`, and API routes mix all three conventions
2. **Missing pages**: No About, Contact, Companies, Admin dashboard, or Saved Jobs pages
3. **No root middleware**: Only API middleware exists at `src/middleware/auth.ts`
4. **No category dynamic routes**: Categories link to query params instead of `/jobs/category/[categoryName]`
5. **No mobile-specific navigation**: Current dropdown serves both desktop and mobile
6. **Layout doesn't include navigation**: Root `layout.tsx` doesn't render any navigation; pages use `AppLayout` which includes `NavigationHeader`

**Missing from Requirements:**
- Admin navigation items (dashboard, users, jobs, companies, categories, analytics)
- Mobile-optimized navigation component
- Category browsing page
- Route protection middleware
- Several public pages (About, Contact, Companies)


### Approach

## Implementation Strategy

**Phase 1: Fix Role Consistency** - Standardize all role checks to use uppercase convention (`"SEEKER"`, `"EMPLOYER"`, `"ADMIN"`) matching TypeScript types.

**Phase 2: Enhance Navigation Config** - Add admin navigation items, update role checks, add missing public routes (About, Contact, Companies).

**Phase 3: Create Navigation Components** - Build `MainNav.tsx` (desktop horizontal nav), `MobileNav.tsx` (mobile sheet/drawer), and `UserMenu.tsx` (enhanced user dropdown).

**Phase 4: Implement Category Browsing** - Create dynamic route `/jobs/category/[categoryName]/page.tsx` with category filter component.

**Phase 5: Add Route Protection** - Create root `middleware.ts` for page-level authentication and role-based access control.

**Phase 6: Create Missing Pages** - Add stub pages for About, Contact, Companies, Saved Jobs, and Admin routes.

**Phase 7: Integrate Breadcrumbs** - Add breadcrumb navigation to nested pages using existing UI components.

This approach prioritizes **fixing the foundation** (role consistency) before building new features, ensuring a stable base for the navigation system.


### Reasoning

I explored the repository structure to understand the existing navigation implementation. I examined the navigation configuration file, existing header components, authentication setup with NextAuth, the Prisma schema for user roles, and the current page structure. I discovered critical role naming inconsistencies across the codebase by searching for role checks in API routes and components. I verified that no root middleware exists for page protection, identified missing pages referenced in the navigation, and confirmed that category routes use query parameters instead of dynamic segments. I also found that the breadcrumb UI components exist but are not integrated, and that the current navigation serves both mobile and desktop without mobile-specific optimizations.


## Mermaid Diagram

sequenceDiagram
    participant User
    participant Browser
    participant Middleware
    participant Layout
    participant Navigation
    participant API
    participant Database

    User->>Browser: Visit page
    Browser->>Middleware: Request page
    Middleware->>Middleware: Check authentication
    Middleware->>Middleware: Verify role access
    alt Unauthorized
        Middleware->>Browser: Redirect to /auth/signin
    else Authorized
        Middleware->>Layout: Render page
        Layout->>Navigation: Load navigation components
        Navigation->>API: GET /api/user/me
        API->>Database: Fetch user data
        Database->>API: Return user + role
        API->>Navigation: Return user data
        Navigation->>Navigation: Get role-based nav items
        alt Desktop
            Navigation->>Browser: Render MainNav (horizontal)
        else Mobile
            Navigation->>Browser: Render MobileNav (drawer)
        end
        Navigation->>Browser: Render UserMenu
        Browser->>User: Display page with navigation
    end

    User->>Browser: Click category
    Browser->>API: GET /api/jobs/categories
    API->>Database: Fetch categories
    Database->>API: Return categories
    API->>Browser: Return category data
    Browser->>Browser: Navigate to /jobs/category/[slug]
    Browser->>API: GET /api/jobs?categoryId=X
    API->>Database: Fetch jobs by category
    Database->>API: Return filtered jobs
    API->>Browser: Display category jobs
    Browser->>User: Show jobs with breadcrumbs

## Proposed File Changes

### \src\config\navigation.ts(NEW)

References: 

- src\types\next-auth.d.ts
- src\hooks\useCurrentUser.ts

**Fix role naming inconsistency and add admin navigation:**

1. Update the `getNavigationItems` function to use uppercase role values (`"SEEKER"`, `"EMPLOYER"`, `"ADMIN"`) to match the TypeScript session types in `src/types/next-auth.d.ts`

2. Update all `roles` arrays in navigation items from `['job_seeker']` to `['SEEKER']` and `['employer']` to `['EMPLOYER']`

3. Add new admin navigation items array:
   - Dashboard (`/admin/dashboard`) with LayoutDashboard icon
   - Manage Users (`/admin/users`) with Users icon
   - Manage Jobs (`/admin/jobs`) with Briefcase icon
   - Manage Companies (`/admin/companies`) with Building2 icon
   - Manage Categories (`/admin/categories`) with Tags icon
   - Analytics & Reports (`/admin/analytics`) with BarChart3 icon
   - All with `roles: ['ADMIN']`

4. Add missing public navigation items:
   - Companies (`/companies`) with Building2 icon - "Browse companies"
   - About (`/about`) with Info icon - "About us"
   - Contact (`/contact`) with Mail icon - "Get in touch"

5. Update job seeker navigation to include:
   - Saved Jobs route should be `/saved-jobs` (not `/saved`) to match existing API endpoint
   - Add Resume Manager (`/profile/resume`) with FileText icon

6. Update employer navigation:
   - Change "Post Job" href from `/employer/post-job` to `/employer/post` to match existing route
   - Add "Candidates" item (`/employer/candidates`) with Users icon

7. In `getNavigationItems`, add condition for `role === 'ADMIN'` to return admin navigation items

8. Import new icons: `LayoutDashboard`, `Tags`, `BarChart3`, `Info`, `Mail` from lucide-react
**Add TypeScript type exports for better type safety:**

1. Export the `NavigationItem` interface so it can be imported by other components

2. Export type for role values:
   ```
   export type UserRole = 'SEEKER' | 'EMPLOYER' | 'ADMIN'
   ```

3. Update the `getNavigationItems` function signature to use the exported type:
   ```
   getNavigationItems(role: UserRole | undefined, isAuthenticated: boolean)
   ```

4. Add JSDoc comments to the function explaining the role values and return type

5. This ensures type consistency across the navigation system

### \src\components\navigation\MainNav.tsx(NEW)

References: 

- src\hooks\useCurrentUser.ts
- src\config\navigation.ts
- src\lib\utils.ts
- src\components\ui\badge.tsx

**Create desktop horizontal navigation component:**

1. Create a client component (`'use client'`) that renders a horizontal navigation bar for desktop screens

2. Import `useCurrentUser` from `src/hooks/useCurrentUser.ts` to get authentication state and user role

3. Import `getNavigationItems` from `src/config/navigation.ts` to get role-based navigation items

4. Import `usePathname` from `next/navigation` to determine active route

5. Use `cn` utility from `src/lib/utils` for conditional styling

6. Import Link from `next/link` for client-side navigation

7. Component structure:
   - Accept optional `className` prop for styling flexibility
   - Call `useCurrentUser()` to get `user`, `isAuthenticated`, `isLoading` state
   - Call `getNavigationItems(user?.role, isAuthenticated)` to get appropriate nav items
   - Get current pathname with `usePathname()`

8. Render a `<nav>` element with:
   - Hidden on mobile (`hidden md:flex`)
   - Horizontal flex layout with gap
   - Map over navigation items
   - For each item, render a Link with:
     - Icon component from the item
     - Label text
     - Active state styling when `pathname === item.href` or `pathname.startsWith(item.href + '/')`
     - Hover effects and transitions
     - Badge if `item.badge` exists (using Badge component from `src/components/ui/badge.tsx`)

9. Show loading skeleton when `isLoading` is true

10. For unauthenticated users, show limited public navigation items

11. Add proper ARIA labels for accessibility (`aria-label`, `aria-current="page"`)

12. Style active links with accent color and bold font weight

13. Use Tailwind classes for responsive design and dark mode support

### \src\components\navigation\MobileNav.tsx(NEW)

References: 

- src\components\ui\sheet.tsx
- src\components\ui\button.tsx
- src\components\ui\scroll-area.tsx
- src\components\ui\separator.tsx
- src\components\ui\badge.tsx
- src\components\ui\avatar.tsx
- src\hooks\useCurrentUser.ts
- src\config\navigation.ts

**Create mobile-optimized navigation component using Sheet (drawer):**

1. Create a client component that renders a mobile navigation menu using the Sheet component from `src/components/ui/sheet.tsx`

2. Import necessary components:
   - `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetTrigger` from `src/components/ui/sheet.tsx`
   - `Button` from `src/components/ui/button.tsx`
   - `ScrollArea` from `src/components/ui/scroll-area.tsx`
   - `Separator` from `src/components/ui/separator.tsx`
   - `Badge` from `src/components/ui/badge.tsx`
   - `Menu` icon from lucide-react

3. Import hooks and utilities:
   - `useCurrentUser` from `src/hooks/useCurrentUser.ts`
   - `getNavigationItems` from `src/config/navigation.ts`
   - `usePathname` from `next/navigation`
   - `useState` from React for open/close state

4. Component structure:
   - Maintain `isOpen` state for controlling sheet visibility
   - Get user data and navigation items same as MainNav
   - Only visible on mobile (`md:hidden`)

5. Render Sheet with:
   - SheetTrigger as a Button with Menu icon
   - SheetContent with side="left" for left-sliding drawer
   - SheetHeader with app logo and title

6. Inside SheetContent:
   - Use ScrollArea for scrollable navigation list
   - Group navigation items by role/category with Separators
   - Render each item as a Link with:
     - Full-width button-like styling
     - Icon on the left
     - Label text
     - Badge on the right if exists
     - Active state highlighting
     - Close sheet on click (set `isOpen` to false)

7. Add user info section at the top (if authenticated):
   - Display user avatar using Avatar component from `src/components/ui/avatar.tsx`
   - Show user name and email
   - Add "View Profile" link

8. Add authentication buttons at the bottom (if not authenticated):
   - Sign In button linking to `/auth/signin`
   - Sign Up button linking to `/auth/signup`

9. Ensure proper touch targets (minimum 44px height) for mobile accessibility

10. Add smooth transitions and animations for opening/closing

11. Implement keyboard navigation support (Escape to close, Tab navigation)

### \src\components\navigation\UserMenu.tsx(NEW)

References: 

- src\components\ui\dropdown-menu.tsx
- src\components\ui\avatar.tsx
- src\components\ui\button.tsx
- src\hooks\useCurrentUser.ts
- src\components\ui\user-avatar-dropdown.tsx

**Create enhanced user menu dropdown component:**

1. This component wraps and enhances the existing `UserAvatarDropdown` from `src/components/ui/user-avatar-dropdown.tsx` with additional menu items

2. Import necessary components:
   - `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuLabel`, `DropdownMenuSeparator`, `DropdownMenuTrigger` from `src/components/ui/dropdown-menu.tsx`
   - `Avatar`, `AvatarFallback`, `AvatarImage` from `src/components/ui/avatar.tsx`
   - `Button` from `src/components/ui/button.tsx`
   - Icons: `User`, `Settings`, `CreditCard`, `HelpCircle`, `LogOut`, `Shield` from lucide-react

3. Import hooks:
   - `useCurrentUser` from `src/hooks/useCurrentUser.ts`
   - `signOut` from `next-auth/react`

4. Component structure:
   - Get user data from `useCurrentUser()` hook
   - Return null if not authenticated
   - Show loading skeleton while `isLoading`

5. Render DropdownMenu with:
   - Trigger: Button with user avatar (similar to existing UserAvatarDropdown)
   - Avatar shows user image or initials

6. DropdownMenuContent structure:
   - **Header section**: User name and email (DropdownMenuLabel)
   - **Separator**
   - **Profile section**:
     - My Profile link (`/profile`) with User icon
     - Settings link (`/settings`) with Settings icon
   - **Separator**
   - **Role-specific section** (conditional):
     - For EMPLOYER: Subscription link (`/pricing`) with CreditCard icon
     - For ADMIN: Admin Dashboard link (`/admin/dashboard`) with Shield icon
   - **Separator**
   - **Help section**:
     - Help Center link (`/help`) with HelpCircle icon
   - **Separator**
   - **Sign out button**: onClick calls `signOut({ callbackUrl: '/auth/signin' })` with LogOut icon and red text styling

7. Add proper accessibility attributes:
   - `aria-label` on trigger button
   - Proper focus management
   - Keyboard navigation support

8. Style with Tailwind classes matching the existing design system

9. Add hover effects and transitions for better UX

10. Ensure the dropdown aligns properly on both desktop and mobile

### \src\components\layout\navigation-header.tsx(NEW)

References: 

- src\components\navigation\MainNav.tsx
- src\components\navigation\MobileNav.tsx
- src\components\navigation\UserMenu.tsx
- src\components\ui\navigation-dropdown.tsx
- src\components\ui\user-avatar-dropdown.tsx

**Update NavigationHeader to use new navigation components:**

1. Import the new navigation components:
   - `MainNav` from `src/components/navigation/MainNav.tsx`
   - `MobileNav` from `src/components/navigation/MobileNav.tsx`
   - `UserMenu` from `src/components/navigation/UserMenu.tsx`

2. Update the component structure:
   - Keep the existing header container and logo section
   - Replace the existing `NavigationDropdown` with the new `MainNav` component for desktop
   - Add the new `MobileNav` component for mobile (it will handle its own visibility)
   - Keep the location indicator

3. Update the "Navigation Controls" section:
   - Remove the old `NavigationDropdown` component
   - Add `MainNav` component in the center section (between logo and right controls)
   - Keep `MobileNav` in the left section (it has built-in responsive visibility)

4. Update the right-side controls section:
   - Keep `NotificationDropdown` for authenticated users
   - Keep the "Post Job" button for employers
   - Keep `ThemeToggle`
   - Replace `UserAvatarDropdown` with the new `UserMenu` component
   - Keep the Sign In/Sign Up buttons for unauthenticated users

5. Adjust the layout to accommodate the horizontal navigation:
   - On desktop: Logo (left) → MainNav (center-left) → Controls (right)
   - On mobile: MobileNav trigger (left) → Logo (center) → Controls (right)

6. Ensure proper spacing and alignment with Tailwind flex utilities

7. Maintain all existing functionality:
   - Loading states
   - Authentication checks
   - Role-based rendering
   - Theme toggle
   - Notifications

8. Keep the sticky positioning and backdrop blur effects

9. Ensure responsive breakpoints work correctly (mobile < md, desktop >= md)

10. The `user` prop can be removed as the new components use `useCurrentUser` hook internally

### \src\components\jobs\CategoryFilter.tsx(NEW)

References: 

- src\components\ui\button.tsx
- src\components\ui\badge.tsx
- src\components\ui\scroll-area.tsx
- src\components\ui\skeleton.tsx
- src\app\api\jobs\categories\route.ts

**Create category filter component for job browsing:**

1. Create a client component for filtering jobs by category

2. Import necessary components:
   - `Button` from `src/components/ui/button.tsx`
   - `Badge` from `src/components/ui/badge.tsx`
   - `ScrollArea` from `src/components/ui/scroll-area.tsx`
   - `Skeleton` from `src/components/ui/skeleton.tsx`
   - `Tags` icon from lucide-react

3. Import hooks:
   - `useState`, `useEffect` from React
   - `useRouter`, `useSearchParams` from `next/navigation`

4. Define TypeScript interface for Category:
   ```
   interface Category {
     id: string
     name: string
     slug: string
     description?: string
     icon?: string
     color?: string
   }
   ```

5. Component props:
   - `selectedCategory?: string` - Currently selected category slug
   - `onCategoryChange?: (slug: string | null) => void` - Callback when category changes
   - `variant?: 'horizontal' | 'vertical'` - Layout variant (default: horizontal)

6. Component logic:
   - Fetch categories from `/api/jobs/categories` on mount
   - Store categories in state
   - Handle loading and error states
   - Track selected category in local state

7. Render horizontal variant (for desktop):
   - ScrollArea with horizontal scrolling
   - Row of category buttons/chips
   - "All Categories" button to clear filter
   - Each category shows icon (if available) and name
   - Active category highlighted with accent color
   - Badge showing job count per category (optional, can be added later)

8. Render vertical variant (for mobile/sidebar):
   - Vertical list of category buttons
   - Full-width buttons with icon and name
   - Active state highlighting
   - Collapsible sections if many categories

9. Handle category selection:
   - Update local state
   - Call `onCategoryChange` callback if provided
   - Optionally update URL search params for shareable links

10. Show loading skeletons while fetching categories

11. Handle empty state (no categories available)

12. Add smooth transitions and hover effects

13. Ensure keyboard navigation support (arrow keys, Enter to select)

14. Style with Tailwind classes, use category colors if provided in data

### \src\app\jobs\category\[categoryName]\page.tsx(NEW)

References: 

- src\components\layout\app-layout.tsx
- src\components\jobs\job-grid.tsx
- src\components\jobs\CategoryFilter.tsx
- src\components\ui\breadcrumb.tsx
- src\app\api\jobs\categories\route.ts
- src\app\api\jobs\route.ts

**Create dynamic category browsing page:**

1. Create a server component for the category page (no 'use client' directive)

2. Import necessary components:
   - `AppLayout` from `src/components/layout/app-layout.tsx`
   - `JobGrid` from `src/components/jobs/job-grid.tsx`
   - `CategoryFilter` from `src/components/jobs/CategoryFilter.tsx`
   - `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbSeparator`, `BreadcrumbPage` from `src/components/ui/breadcrumb.tsx`
   - `notFound` from `next/navigation`

3. Define page props interface:
   ```
   interface PageProps {
     params: { categoryName: string }
     searchParams: { [key: string]: string | string[] | undefined }
   }
   ```

4. Implement async page component:
   - Extract `categoryName` from params (this is the slug)
   - Decode the slug (handle URL encoding)
   - Convert slug to lowercase and trim

5. Fetch category data:
   - Call `/api/jobs/categories` to get all categories
   - Find the category matching the slug
   - If category not found, call `notFound()` to show 404 page

6. Fetch jobs for this category:
   - Call `/api/jobs/search` or `/api/jobs` with `categoryId` filter
   - Pass the category ID from the matched category
   - Handle pagination with searchParams (page, limit)
   - Handle additional filters from searchParams (location, salary, etc.)

7. Generate page metadata:
   - Export `generateMetadata` async function
   - Set title: `{categoryName} Jobs | Job Finders`
   - Set description: `Browse {categoryName} jobs in South Africa. Find your next opportunity in {categoryName}.`
   - Add Open Graph tags for social sharing

8. Render page structure:
   - Wrap in `AppLayout` component
   - **Breadcrumb navigation** at the top:
     - Home → Jobs → {Category Name}
     - Use Breadcrumb components from `src/components/ui/breadcrumb.tsx`
   - **Page header**:
     - Category icon (if available)
     - Category name as H1
     - Category description (if available)
     - Job count
   - **CategoryFilter component** (horizontal variant) for switching categories
   - **Filters section** (optional):
     - Location filter
     - Salary range
     - Experience level
     - Employment type
   - **JobGrid component** to display jobs
   - **Pagination controls** at the bottom

9. Handle empty state:
   - Show message when no jobs found in this category
   - Suggest browsing other categories
   - Link to all jobs page

10. Add loading state:
   - Create `loading.tsx` file in the same directory
   - Show skeleton loaders for jobs

11. Implement `generateStaticParams` for static generation:
   - Fetch all active categories
   - Return array of params with categoryName (slug)
   - This enables static generation for popular categories at build time

12. Style with Tailwind classes, ensure responsive design

13. Add proper semantic HTML (main, section, article tags)

14. Ensure accessibility (proper heading hierarchy, ARIA labels)

### \src\app\jobs\category\[categoryName]\loading.tsx(NEW)

References: 

- src\components\ui\skeleton.tsx
- src\components\layout\app-layout.tsx
- src\components\jobs\job-grid.tsx

**Create loading state for category page:**

1. Create a simple loading component that shows while the category page is loading

2. Import:
   - `Skeleton` from `src/components/ui/skeleton.tsx`
   - `AppLayout` from `src/components/layout/app-layout.tsx`

3. Render loading UI:
   - Wrap in `AppLayout`
   - Breadcrumb skeleton (3 items)
   - Page header skeleton:
     - Large skeleton for category name (H1 size)
     - Medium skeleton for description
     - Small skeleton for job count
   - Category filter skeleton (horizontal row of 6-8 pill-shaped skeletons)
   - Job grid skeleton:
     - Grid layout matching JobGrid (responsive columns)
     - 6-9 job card skeletons
     - Each skeleton card should match the height and structure of actual job cards

4. Use Tailwind classes for layout and spacing matching the actual page

5. Add subtle pulse animation (built into Skeleton component)

6. Ensure responsive design (mobile, tablet, desktop layouts)

### \middleware.ts(NEW)

References: 

- src\middleware\auth.ts
- src\lib\auth.ts
- src\types\next-auth.d.ts

**Create root middleware for page-level route protection:**

1. Create middleware at the root level (not in src directory) - Next.js convention

2. Import necessary modules:
   - `withAuth` from `next-auth/middleware`
   - `NextResponse` from `next/server`
   - `NextRequest` type from `next/server`

3. Define route protection rules:
   - **Public routes** (no auth required): `/`, `/jobs`, `/jobs/*`, `/companies`, `/about`, `/contact`, `/auth/*`, `/pricing`, `/terms`, `/privacy`, `/cookies`, `/refund`, `/api/auth/*`, `/api/jobs/search`, `/api/jobs/categories`, `/api/health`
   - **Job seeker routes** (require SEEKER role): `/dashboard`, `/applications`, `/saved-jobs`, `/profile`, `/profile/*`
   - **Employer routes** (require EMPLOYER role): `/employer/*`
   - **Admin routes** (require ADMIN role): `/admin/*`

4. Implement middleware function using `withAuth`:
   - Check if the request path matches protected routes
   - Verify user has valid session token
   - Check user role matches required role for the route
   - Redirect to `/auth/signin` if not authenticated
   - Redirect to `/` with error message if wrong role (403)

5. Handle role-based access:
   - Extract user role from token: `req.nextauth.token?.role`
   - For job seeker routes: allow only if `role === 'SEEKER'` or `role === 'USER'` (handle both for backward compatibility)
   - For employer routes: allow only if `role === 'EMPLOYER'`
   - For admin routes: allow only if `role === 'ADMIN'`

6. Configure middleware matcher:
   - Use `config.matcher` to specify which paths the middleware should run on
   - Exclude static files, images, and API routes that don't need protection
   - Pattern: `['/((?!_next/static|_next/image|favicon.ico|public).*)']`

7. Add callback configuration:
   - `authorized` callback: return true if token exists for protected routes
   - `pages` configuration: specify custom sign-in page (`/auth/signin`)

8. Handle redirect logic:
   - Store the original URL in a query parameter for post-login redirect
   - Example: redirect to `/auth/signin?callbackUrl=/dashboard`

9. Add special handling for API routes:
   - API routes should return JSON error responses, not redirects
   - Check if path starts with `/api/` and return appropriate JSON response

10. Log authentication failures for debugging (in development only)

11. Ensure middleware doesn't interfere with the existing API middleware at `src/middleware/auth.ts` (they serve different purposes - this is for pages, that is for API routes)

12. Add TypeScript types for better type safety

13. Handle edge cases:
   - Users trying to access sign-in page when already authenticated (redirect to dashboard)
   - Role changes during session (force re-authentication)
   - Expired sessions (redirect to sign-in)

### \src\app\about\page.tsx(NEW)

References: 

- src\components\layout\app-layout.tsx
- src\components\ui\card.tsx
- src\app\page.tsx

**Create About page:**

1. Create a simple server component for the About page

2. Import:
   - `AppLayout` from `src/components/layout/app-layout.tsx`
   - `Card`, `CardContent`, `CardHeader`, `CardTitle` from `src/components/ui/card.tsx`
   - Icons: `Target`, `Users`, `Award`, `Heart` from lucide-react

3. Export metadata:
   - Title: "About Us | Job Finders"
   - Description: "Learn about Job Finders, South Africa's leading job platform connecting talented professionals with top companies."

4. Page structure:
   - Wrap in `AppLayout`
   - Hero section with page title and subtitle
   - Mission section with Target icon
   - Vision section with Award icon
   - Values section with Heart icon
   - Team section with Users icon (placeholder for now)
   - Stats section (reuse stats from homepage)

5. Content (placeholder text):
   - Mission: "To connect talented South African professionals with opportunities that match their skills and aspirations."
   - Vision: "To be the leading job platform in South Africa, empowering careers and driving economic growth."
   - Values: "Integrity, Innovation, Inclusivity, Impact"

6. Use Card components for each section

7. Add responsive grid layout for values/stats

8. Style with Tailwind classes, ensure consistent spacing

9. Add call-to-action at the bottom:
   - "Ready to find your dream job?" with link to `/jobs`
   - "Looking to hire?" with link to `/employer/post`

### \src\app\contact\page.tsx(NEW)

References: 

- src\components\layout\app-layout.tsx
- src\components\ui\card.tsx
- src\components\ui\button.tsx
- src\components\ui\input.tsx
- src\components\ui\textarea.tsx
- src\components\ui\label.tsx

**Create Contact page:**

1. Create a client component for the Contact page (needs form handling)

2. Import:
   - `AppLayout` from `src/components/layout/app-layout.tsx`
   - `Card`, `CardContent`, `CardHeader`, `CardTitle`, `CardDescription` from `src/components/ui/card.tsx`
   - `Button` from `src/components/ui/button.tsx`
   - `Input` from `src/components/ui/input.tsx`
   - `Textarea` from `src/components/ui/textarea.tsx`
   - `Label` from `src/components/ui/label.tsx`
   - Icons: `Mail`, `Phone`, `MapPin`, `Send` from lucide-react
   - `useForm` from `react-hook-form`
   - `toast` from `sonner`

3. Define form schema with validation:
   - name (required, min 2 chars)
   - email (required, valid email)
   - subject (required)
   - message (required, min 10 chars)

4. Page structure:
   - Wrap in `AppLayout`
   - Two-column layout (desktop) / stacked (mobile)
   - Left column: Contact form
   - Right column: Contact information

5. Contact form:
   - Name input field
   - Email input field
   - Subject input field
   - Message textarea
   - Submit button with Send icon
   - Loading state during submission
   - Success/error toast notifications

6. Contact information section:
   - Email: support@jobfinders.co.za (with Mail icon)
   - Phone: +27 (placeholder) (with Phone icon)
   - Address: South Africa (with MapPin icon)
   - Business hours: Mon-Fri, 9AM-5PM SAST

7. Form submission:
   - For now, just show success toast (no backend endpoint yet)
   - TODO comment: "Implement contact form API endpoint"
   - Log form data to console in development

8. Add FAQ section below the form:
   - "How quickly will I get a response?" - "Within 24-48 hours"
   - "Can I call you directly?" - "Email is preferred for faster response"
   - "Do you offer support in multiple languages?" - "Currently English only"

9. Style with Tailwind classes, ensure responsive design

10. Add proper form validation and error messages

11. Ensure accessibility (proper labels, error announcements)

### \src\app\companies\page.tsx(NEW)

References: 

- src\components\layout\app-layout.tsx
- src\components\ui\card.tsx
- src\components\ui\button.tsx
- src\components\ui\input.tsx
- src\components\ui\badge.tsx
- src\components\ui\avatar.tsx
- src\lib\db.ts
- prisma\schema.prisma

**Create Companies browsing page:**

1. Create a server component for browsing companies

2. Import:
   - `AppLayout` from `src/components/layout/app-layout.tsx`
   - `Card`, `CardContent`, `CardHeader`, `CardTitle` from `src/components/ui/card.tsx`
   - `Button` from `src/components/ui/button.tsx`
   - `Input` from `src/components/ui/input.tsx`
   - `Badge` from `src/components/ui/badge.tsx`
   - `Avatar`, `AvatarImage`, `AvatarFallback` from `src/components/ui/avatar.tsx`
   - Icons: `Building2`, `MapPin`, `Users`, `Briefcase`, `ExternalLink`, `Search` from lucide-react
   - `db` from `src/lib/db.ts`

3. Export metadata:
   - Title: "Browse Companies | Job Finders"
   - Description: "Explore top companies hiring in South Africa. Find your next employer and discover exciting career opportunities."

4. Fetch companies data (server-side):
   - Query companies from database using Prisma
   - Include job count for each company
   - Filter only verified companies (`isVerified: true`)
   - Order by job count or name
   - Implement pagination (limit 20 per page)

5. Page structure:
   - Wrap in `AppLayout`
   - Page header with title and description
   - Search bar (client component for filtering - can be added later)
   - Grid of company cards (responsive: 1 col mobile, 2 cols tablet, 3 cols desktop)
   - Pagination controls at bottom

6. Company card structure:
   - Company logo (Avatar component with fallback to initials)
   - Company name (CardTitle)
   - Industry badge
   - Location (city, province) with MapPin icon
   - Employee count with Users icon (if available)
   - Active jobs count with Briefcase icon
   - Short description (truncated to 2 lines)
   - "View Jobs" button linking to `/jobs?company={companyId}`
   - "Visit Website" link with ExternalLink icon (if website available)

7. Handle empty state:
   - Show message if no companies found
   - Suggest checking back later

8. Add filters section (for future enhancement):
   - Industry filter
   - Location filter
   - Company size filter
   - TODO comment for implementation

9. Style with Tailwind classes, ensure responsive design

10. Add hover effects on company cards (scale, shadow)

11. Ensure proper semantic HTML and accessibility

12. Add loading state (create `loading.tsx` with skeleton cards)

### \src\app\saved-jobs\page.tsx(NEW)

References: 

- src\components\layout\app-layout.tsx
- src\components\jobs\job-card.tsx
- src\components\ui\button.tsx
- src\components\ui\skeleton.tsx
- src\components\ui\alert-dialog.tsx
- src\hooks\useCurrentUser.ts
- src\app\api\saved-jobs\route.ts

**Create Saved Jobs page for job seekers:**

1. Create a client component (needs interactivity for removing saved jobs)

2. Import:
   - `AppLayout` from `src/components/layout/app-layout.tsx`
   - `JobCard` from `src/components/jobs/job-card.tsx`
   - `Button` from `src/components/ui/button.tsx`
   - `Skeleton` from `src/components/ui/skeleton.tsx`
   - Icons: `Heart`, `Trash2`, `Briefcase` from lucide-react
   - `useQuery`, `useMutation` from `@tanstack/react-query`
   - `useCurrentUser` from `src/hooks/useCurrentUser.ts`
   - `toast` from `sonner`

3. Check authentication and role:
   - Use `useCurrentUser` hook
   - Redirect to sign-in if not authenticated
   - Show error if not a job seeker (role !== 'SEEKER')

4. Fetch saved jobs:
   - Use `useQuery` to fetch from `/api/saved-jobs`
   - Handle loading state with skeletons
   - Handle error state with error message

5. Implement remove saved job mutation:
   - Use `useMutation` to DELETE from `/api/saved-jobs`
   - Invalidate query cache on success
   - Show success toast
   - Show error toast on failure

6. Page structure:
   - Wrap in `AppLayout`
   - Page header:
     - Title: "Saved Jobs" with Heart icon
     - Subtitle: "Jobs you've bookmarked for later"
     - Count: "{count} saved jobs"
   - Grid of saved job cards (reuse JobCard component)
   - Each card has a "Remove" button with Trash2 icon

7. Handle empty state:
   - Show message: "You haven't saved any jobs yet"
   - Show Briefcase icon
   - Add "Browse Jobs" button linking to `/jobs`

8. Add bulk actions (optional, for future):
   - "Remove All" button with confirmation dialog
   - Select multiple jobs for bulk removal
   - TODO comment for implementation

9. Add filters/sorting:
   - Sort by: Date saved, Job title, Company
   - Filter by: Category, Location
   - TODO comment for implementation

10. Style with Tailwind classes, ensure responsive design

11. Add loading skeletons matching JobCard layout

12. Ensure proper error handling and user feedback

13. Add confirmation dialog before removing saved jobs (use AlertDialog from `src/components/ui/alert-dialog.tsx`)

### \src\app\admin\dashboard\page.tsx(NEW)

References: 

- src\components\layout\app-layout.tsx
- src\components\ui\card.tsx
- src\components\ui\alert.tsx
- src\lib\db.ts
- prisma\schema.prisma

**Create Admin Dashboard page (placeholder):**

1. Create a server component for the admin dashboard

2. Import:
   - `AppLayout` from `src/components/layout/app-layout.tsx`
   - `Card`, `CardContent`, `CardHeader`, `CardTitle`, `CardDescription` from `src/components/ui/card.tsx`
   - Icons: `Users`, `Briefcase`, `Building2`, `TrendingUp`, `AlertCircle` from lucide-react
   - `db` from `src/lib/db.ts`

3. Export metadata:
   - Title: "Admin Dashboard | Job Finders"
   - Description: "Manage users, jobs, companies, and platform settings"

4. Fetch admin statistics (server-side):
   - Total users count
   - Total jobs count
   - Total companies count
   - Recent activity (last 7 days)
   - Use Prisma aggregations

5. Page structure:
   - Wrap in `AppLayout`
   - Page header with title and description
   - Stats grid (4 cards):
     - Total Users with Users icon
     - Total Jobs with Briefcase icon
     - Total Companies with Building2 icon
     - Growth Rate with TrendingUp icon
   - Quick actions section:
     - "Manage Users" button → `/admin/users`
     - "Manage Jobs" button → `/admin/jobs`
     - "Manage Companies" button → `/admin/companies`
     - "Manage Categories" button → `/admin/categories`
     - "View Analytics" button → `/admin/analytics`
   - Recent activity section (placeholder)
   - System health section (placeholder)

6. Add alert banner at top:
   - Use Alert component from `src/components/ui/alert.tsx`
   - Show important system notifications
   - AlertCircle icon

7. Style with Tailwind classes, ensure responsive design

8. Add TODO comments for future enhancements:
   - Real-time statistics
   - Charts and graphs
   - Activity feed
   - System monitoring

9. Ensure only admins can access (middleware will handle this)

10. Add proper semantic HTML and accessibility

### \src\app\admin\users\page.tsx(NEW)

References: 

- src\components\layout\app-layout.tsx
- src\components\ui\card.tsx
- src\components\ui\button.tsx
- src\components\ui\badge.tsx
- src\components\ui\table.tsx
- src\lib\db.ts
- prisma\schema.prisma

**Create Admin Users Management page (placeholder):**

1. Create a server component for managing users

2. Import:
   - `AppLayout` from `src/components/layout/app-layout.tsx`
   - `Card`, `CardContent`, `CardHeader`, `CardTitle` from `src/components/ui/card.tsx`
   - `Button` from `src/components/ui/button.tsx`
   - `Badge` from `src/components/ui/badge.tsx`
   - `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` from `src/components/ui/table.tsx`
   - Icons: `Users`, `Search`, `Filter`, `MoreVertical` from lucide-react
   - `db` from `src/lib/db.ts`

3. Export metadata:
   - Title: "Manage Users | Admin | Job Finders"
   - Description: "View and manage all platform users"

4. Fetch users data (server-side):
   - Query users from database
   - Include profile data
   - Implement pagination
   - Order by creation date (newest first)

5. Page structure:
   - Wrap in `AppLayout`
   - Page header with title and user count
   - Search and filter bar (placeholder)
   - Users table:
     - Columns: Name, Email, Role, Status, Created Date, Actions
     - Show role badge (SEEKER/EMPLOYER/ADMIN)
     - Show active/inactive status badge
     - Actions dropdown (placeholder)
   - Pagination controls

6. Add TODO comments:
   - "Implement user search"
   - "Add role filter"
   - "Add user activation/deactivation"
   - "Add user details modal"
   - "Add bulk actions"

7. Style with Tailwind classes, ensure responsive design

8. For mobile, use card layout instead of table

9. Add empty state if no users found

10. Ensure proper semantic HTML and accessibility

### \src\app\admin\jobs\page.tsx(NEW)

References: 

- src\components\layout\app-layout.tsx
- src\components\ui\card.tsx
- src\components\ui\button.tsx
- src\components\ui\badge.tsx
- src\components\ui\table.tsx
- src\lib\db.ts
- prisma\schema.prisma

**Create Admin Jobs Management page (placeholder):**

Similar structure to the users management page, but for managing all jobs on the platform.

1. Create a server component

2. Import necessary components (same as users page, plus job-specific components)

3. Export metadata:
   - Title: "Manage Jobs | Admin | Job Finders"
   - Description: "View and manage all job postings"

4. Fetch jobs data with company and employer information

5. Page structure:
   - Page header with title and job count
   - Search and filter bar (by status, category, company)
   - Jobs table:
     - Columns: Title, Company, Status, Posted Date, Applicants, Actions
     - Status badge (DRAFT/PUBLISHED/CLOSED/PAUSED/EXPIRED)
     - Actions: View, Edit, Delete, Change Status
   - Pagination controls

6. Add TODO comments for future features:
   - Job approval workflow
   - Bulk status changes
   - Job analytics
   - Export jobs data

7. Style with Tailwind, ensure responsive design

8. Add empty state and loading states

### \src\app\admin\companies\page.tsx(NEW)

References: 

- src\components\layout\app-layout.tsx
- src\components\ui\card.tsx
- src\components\ui\button.tsx
- src\components\ui\badge.tsx
- src\components\ui\table.tsx
- src\lib\db.ts
- prisma\schema.prisma

**Create Admin Companies Management page (placeholder):**

Similar structure to users/jobs management pages, but for managing companies.

1. Create a server component

2. Import necessary components

3. Export metadata:
   - Title: "Manage Companies | Admin | Job Finders"
   - Description: "View and manage all companies on the platform"

4. Fetch companies data with job counts and employer counts

5. Page structure:
   - Page header with title and company count
   - Search and filter bar
   - Companies table:
     - Columns: Name, Industry, Location, Verified Status, Jobs Count, Employers, Actions
     - Verification badge
     - Actions: View, Edit, Verify, Delete
   - Pagination controls

6. Add TODO comments for:
   - Company verification workflow
   - Company analytics
   - Bulk verification
   - Export companies data

7. Style with Tailwind, ensure responsive design

8. Add empty state and loading states

### \src\app\admin\categories\page.tsx(NEW)

References: 

- src\components\layout\app-layout.tsx
- src\components\ui\card.tsx
- src\components\ui\button.tsx
- src\components\ui\badge.tsx
- src\components\ui\table.tsx
- src\components\ui\dialog.tsx
- src\components\ui\input.tsx
- src\components\ui\textarea.tsx
- src\app\api\jobs\categories\route.ts

**Create Admin Categories Management page (placeholder):**

1. Create a client component (needs form for adding/editing categories)

2. Import necessary components including form components

3. Export metadata:
   - Title: "Manage Categories | Admin | Job Finders"
   - Description: "Manage job categories and their properties"

4. Fetch categories data with job counts

5. Page structure:
   - Page header with "Add Category" button
   - Categories table/grid:
     - Columns: Icon, Name, Slug, Description, Jobs Count, Active Status, Actions
     - Color preview
     - Active/Inactive toggle
     - Actions: Edit, Delete
   - Add/Edit category dialog:
     - Name input
     - Description textarea
     - Slug input (auto-generated from name)
     - Icon picker (emoji or icon name)
     - Color picker
     - Active toggle

6. Implement CRUD operations:
   - Create category (POST to `/api/jobs/categories`)
   - Update category (PUT to `/api/jobs/categories`)
   - Delete category (DELETE to `/api/jobs/categories`)
   - Use mutations with React Query

7. Add validation:
   - Name required
   - Slug must be unique and URL-safe
   - Color must be valid hex code

8. Add TODO comments for:
   - Category ordering/sorting
   - Category merging
   - Category analytics

9. Style with Tailwind, ensure responsive design

10. Add confirmation dialogs for destructive actions

### \src\app\admin\analytics\page.tsx(NEW)

References: 

- src\components\layout\app-layout.tsx
- src\components\ui\card.tsx
- src\components\ui\button.tsx
- src\components\ui\chart.tsx

**Create Admin Analytics page (placeholder):**

1. Create a server component for analytics dashboard

2. Import:
   - `AppLayout` from `src/components/layout/app-layout.tsx`
   - `Card`, `CardContent`, `CardHeader`, `CardTitle`, `CardDescription` from `src/components/ui/card.tsx`
   - Chart components from `src/components/ui/chart.tsx` (if available)
   - Icons: `TrendingUp`, `Users`, `Briefcase`, `DollarSign` from lucide-react

3. Export metadata:
   - Title: "Analytics & Reports | Admin | Job Finders"
   - Description: "View platform analytics and generate reports"

4. Page structure:
   - Page header with title and date range selector (placeholder)
   - Key metrics cards:
     - User growth
     - Job posting trends
     - Application rates
     - Revenue (if applicable)
   - Charts section (placeholders):
     - User registration over time (line chart)
     - Jobs by category (bar chart)
     - Applications by status (pie chart)
     - Geographic distribution (map placeholder)
   - Reports section:
     - "Generate Monthly Report" button
     - "Export Data" button
     - Recent reports list

5. Add TODO comments:
   - "Implement real-time analytics"
   - "Add chart library integration"
   - "Add custom date range selection"
   - "Add report generation"
   - "Add data export functionality"

6. For now, show placeholder charts with sample data

7. Style with Tailwind, ensure responsive design

8. Add loading states for data fetching

### \src\components\ui\breadcrumb-nav.tsx(NEW)

References: 

- src\components\ui\breadcrumb.tsx

**Create reusable breadcrumb navigation component:**

1. Create a client component that generates breadcrumbs from the current route

2. Import:
   - Breadcrumb components from `src/components/ui/breadcrumb.tsx`
   - `usePathname` from `next/navigation`
   - `Link` from `next/link`
   - `Home` icon from lucide-react

3. Define TypeScript interface:
   ```
   interface BreadcrumbItem {
     label: string
     href: string
   }
   ```

4. Component props:
   - `items?: BreadcrumbItem[]` - Optional custom breadcrumb items
   - `className?: string` - Optional styling

5. Component logic:
   - If `items` prop provided, use those
   - Otherwise, auto-generate from pathname:
     - Split pathname by `/`
     - Convert segments to readable labels (capitalize, replace hyphens with spaces)
     - Build href for each segment
     - Always start with Home

6. Render structure:
   - Use Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage from `src/components/ui/breadcrumb.tsx`
   - First item: Home icon linking to `/`
   - Middle items: Links to parent routes
   - Last item: BreadcrumbPage (current page, not a link)

7. Handle special cases:
   - Dynamic route segments (e.g., `[id]`) - fetch actual name if possible
   - Category pages - show category name instead of slug
   - Admin pages - show "Admin" as parent

8. Add route name mapping for better labels:
   ```
   const routeLabels = {
     'jobs': 'Jobs',
     'applications': 'My Applications',
     'saved-jobs': 'Saved Jobs',
     'employer': 'Employer',
     'admin': 'Admin',
     // etc.
   }
   ```

9. Style with Tailwind classes

10. Ensure accessibility (proper ARIA labels)

11. Add responsive behavior (truncate on mobile if too long)

### \src\app\jobs\page.tsx(NEW)

References: 

- src\components\ui\breadcrumb-nav.tsx
- src\components\jobs\CategoryFilter.tsx
- src\components\jobs\job-search.tsx
- src\components\jobs\job-grid.tsx

**Update jobs page to integrate breadcrumbs and category filter:**

1. Import the new components:
   - `BreadcrumbNav` from `src/components/ui/breadcrumb-nav.tsx`
   - `CategoryFilter` from `src/components/jobs/CategoryFilter.tsx`

2. Add breadcrumb navigation at the top of the page:
   - Place it above the page title
   - Use BreadcrumbNav component with items: Home → Jobs

3. Add CategoryFilter component:
   - Place it below the search bar and above the job grid
   - Use horizontal variant
   - Connect it to the existing filter state
   - When category selected, update URL search params and filter jobs

4. Update the page to handle category from search params:
   - Check for `category` in searchParams
   - If present, pre-select that category in the filter
   - Filter jobs by category

5. Ensure the existing job search functionality works with category filtering

6. Update the layout to accommodate the new components:
   - Breadcrumb at top
   - Page header
   - Search bar
   - Category filter (horizontal scrollable)
   - Active filters display
   - Job grid
   - Pagination

7. Maintain all existing functionality (search, filters, pagination)

8. Ensure responsive design works with new components

### \src\app\jobs\[id]\page.tsx(NEW)

References: 

- src\components\ui\breadcrumb-nav.tsx

**Update job details page to include breadcrumbs:**

1. Import `BreadcrumbNav` from `src/components/ui/breadcrumb-nav.tsx`

2. Add breadcrumb navigation at the top of the page:
   - Place it above the job title
   - Custom breadcrumb items:
     - Home → Jobs → {Job Title}
   - Fetch job title from the job data to use in breadcrumb

3. If the job has a category, include it in the breadcrumb:
   - Home → Jobs → {Category Name} → {Job Title}
   - Link the category to `/jobs/category/{categorySlug}`

4. Ensure the breadcrumb is responsive and truncates long job titles on mobile

5. Maintain all existing functionality of the job details page

6. Ensure proper spacing between breadcrumb and page content

### \src\app\page.tsx(NEW)

References: 

- src\app\api\jobs\categories\route.ts
- src\app\jobs\category\[categoryName]\page.tsx

**Update homepage category links to use new dynamic routes:**

1. Find the category mapping section where categories are rendered

2. Update the Link href from:
   ```
   /jobs?category={category.name.toLowerCase()}
   ```
   to:
   ```
   /jobs/category/{category.slug || category.name.toLowerCase().replace(/\s+/g, '-')}
   ```

3. This ensures categories link to the new dynamic category pages instead of query parameters

4. If categories are hardcoded, consider fetching them from the API endpoint `/api/jobs/categories` to get proper slugs

5. Maintain all existing styling and functionality

6. Ensure the links work correctly with the new category page structure