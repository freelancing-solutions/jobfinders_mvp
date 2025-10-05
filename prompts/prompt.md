I have created the following plan after thorough exploration and analysis of the codebase. Follow the below plan verbatim. Trust the files and references. Do not re-verify what's written in the plan. Explore only when absolutely necessary. First implement all the proposed file changes and then I'll review all the changes together at the end.

### Observations

## Current Navigation Issues

The codebase has **three different navigation implementations** causing duplication and inconsistency:

1. **NavigationHeader** (`src/components/layout/navigation-header.tsx`) - Main header with inline desktop navigation links, mobile hamburger menu, notifications, and includes NavigationDropdown for user menu
2. **NavigationDropdown** (`src/components/ui/navigation-dropdown.tsx`) - Comprehensive dropdown with its own notifications button, user avatar dropdown, theme toggle, and menu items (duplicates functionality)
3. **Custom page headers** - Dashboard pages (`dashboard/page.tsx`, `employer/dashboard/page.tsx`, `profile/page.tsx`) embed their own headers, bypassing the shared NavigationHeader

**Key Problems:**
- Inline desktop navigation AND dropdown menu coexist in NavigationHeader
- NavigationDropdown has duplicate notifications button (NotificationDropdown already exists)
- NavigationDropdown has duplicate user avatar dropdown
- Dashboard pages don't use AppLayout, creating inconsistent navigation
- No centralized sign-out implementation
- Mobile menu uses grid layout instead of leveraging dropdown

**Pages using AppLayout correctly:** Home, Jobs listing, Job details, Applications
**Pages bypassing AppLayout:** Dashboard (seeker), Employer dashboard, Profile


### Approach

## Standardization Strategy

**Goal:** Single dropdown-based navigation with role-aware menu items, keeping notifications visible.

**Approach:**
1. **Refactor NavigationHeader** to use dropdown-only navigation (remove inline desktop links)
2. **Simplify NavigationDropdown** to be a pure menu component (remove duplicate notifications, avatar, theme toggle)
3. **Update NavigationHeader** to compose: Logo + Dropdown Menu + Notifications + User Avatar + Theme Toggle
4. **Refactor dashboard pages** to use AppLayout instead of custom headers
5. **Implement sign-out functionality** in the user avatar dropdown
6. **Consolidate mobile navigation** to use the same dropdown component
7. **Create centralized navigation configuration** for role-based menu items

This ensures a single source of truth for navigation while maintaining user context awareness and keeping the notification dropdown in its current position.


### Reasoning

I explored the project structure and identified navigation-related components. I read the main navigation files (`navigation-header.tsx`, `navigation-dropdown.tsx`, `notification-dropdown.tsx`, `subscription-nav.tsx`) and examined how they're used. I checked the layout components (`app-layout.tsx`, `subscription-layout.tsx`) and reviewed several page implementations (home, jobs, dashboard, employer dashboard, profile) to understand navigation patterns. I searched for header implementations across the codebase and found that some pages use AppLayout while others embed custom headers. I also reviewed the architecture documentation to understand the intended navigation structure and identified the duplication issues.


## Proposed File Changes

### src\config\navigation.ts(NEW)

Create a centralized navigation configuration file that exports role-based navigation items.

**Structure:**
- Define `NavigationItem` interface with properties: `href`, `label`, `icon`, `description`, `roles` (array of allowed roles), `badge` (optional)
- Export `publicNavigationItems` array for unauthenticated users (Home, Browse Jobs, Companies, Pricing)
- Export `jobSeekerNavigationItems` array with items: Dashboard, Find Jobs, My Applications, Saved Jobs, Profile & Resume
- Export `employerNavigationItems` array with items: Dashboard, My Jobs, Applications, Company Profile, Post Job, Subscription
- Export `commonNavigationItems` array for items available to all authenticated users (Settings, Help Center)
- Export helper function `getNavigationItems(role: string | undefined, isAuthenticated: boolean)` that returns the appropriate navigation items based on user role and authentication status
- Import icons from `lucide-react` (Briefcase, FileText, Users, Heart, Settings, Building2, CreditCard, Home, Search, HelpCircle, Plus)

**Purpose:** Single source of truth for all navigation items, making it easy to add/remove/modify menu items without touching component code.

### src\components\ui\navigation-dropdown.tsx(MODIFY)

References: 

- src\components\layout\navigation-header.tsx(MODIFY)
- src\config\navigation.ts(NEW)

Simplify this component to be a pure navigation menu dropdown without duplicate UI elements.

**Remove:**
- The notifications button (lines 237-244) - this duplicates `NotificationDropdown` already in NavigationHeader
- The user avatar dropdown (lines 247-301) - this will be handled separately in NavigationHeader
- The theme toggle (line 303) - this will be moved to NavigationHeader
- The `navigationItems` array (lines 46-65) - will use centralized config
- The `employerItems` array (lines 115-125) - will use centralized config

**Modify:**
- Update component props to accept `navigationItems` array from the new `src/config/navigation.ts`
- Remove the wrapping `<div className="flex items-center gap-2">` since this will only be the dropdown menu
- Keep the dropdown menu structure but simplify to only render the menu items passed via props
- Update the trigger button to use a hamburger icon with "Menu" text
- Group menu items by category (navigation items, user items, sign out) with separators
- Ensure the dropdown closes when a menu item is clicked
- Add proper ARIA labels for accessibility

**Keep:**
- The dropdown menu structure using Radix UI primitives
- Active state highlighting based on pathname
- Icon + label + description layout for menu items
- Badge support for special items
- Mobile-responsive behavior

### src\components\ui\user-avatar-dropdown.tsx(NEW)

References: 

- src\components\ui\navigation-dropdown.tsx(MODIFY)
- src\hooks\useCurrentUser.ts

Create a new component for the user avatar dropdown menu that was previously embedded in `NavigationDropdown`.

**Structure:**
- Accept props: `user` object with name, email, image, role properties
- Render a button with Avatar component showing user image or initials
- Use DropdownMenu from `@/components/ui/dropdown-menu` for the popover
- Display user info at the top (name and email) in the dropdown header
- Include menu items: Profile, Settings (with appropriate icons)
- Add separator before sign-out option
- Implement sign-out functionality using `signOut` from `next-auth/react` with redirect to `/auth/signin`
- Style the sign-out item with red text color to indicate destructive action
- Use `useCurrentUser` hook from `@/hooks/useCurrentUser` to get user data if not passed via props
- Handle loading state while user data is being fetched
- Import icons: User, Settings, LogOut from `lucide-react`
- Import Avatar, AvatarFallback, AvatarImage from `@/components/ui/avatar`

**Purpose:** Separate user profile actions from navigation menu for better component organization and reusability.

### src\components\layout\navigation-header.tsx(MODIFY)

References: 

- src\components\ui\navigation-dropdown.tsx(MODIFY)
- src\components\ui\user-avatar-dropdown.tsx(NEW)
- src\components\notifications\notification-dropdown.tsx
- src\config\navigation.ts(NEW)

Refactor to use dropdown-only navigation, removing inline desktop links and consolidating all navigation controls.

**Remove:**
- The desktop inline navigation section (lines 138-167) - replace with dropdown menu
- The mobile navigation menu section (lines 222-255) - will use same dropdown
- The mobile menu toggle button (lines 172-181) - dropdown will handle mobile
- The `isMenuOpen` state (line 52) - no longer needed
- The `navigationLinks` constant (line 113) - will come from centralized config
- The `employerLinks` and `jobSeekerLinks` arrays (lines 57-111) - move to config file

**Add:**
- Import `getNavigationItems` from `@/config/navigation`
- Import the new `UserAvatarDropdown` component from `@/components/ui/user-avatar-dropdown`
- Import `ThemeToggle` from `@/components/ui/theme-toggle`
- Call `getNavigationItems(user?.role, isAuthenticated)` to get appropriate menu items
- Pass navigation items to the simplified `NavigationDropdown` component

**Restructure the navigation controls section (lines 169-219):**
- For authenticated users, render in order: NavigationDropdown (menu) → NotificationDropdown → "Post Job" button (employers only) → UserAvatarDropdown → ThemeToggle
- For unauthenticated users, render: NavigationDropdown (with public items) → ThemeToggle → Sign In button → Sign Up button
- Ensure proper spacing with `gap-2` or `gap-3` classes
- Remove the conditional mobile menu toggle since dropdown handles both desktop and mobile

**Update layout:**
- Keep the sticky header with backdrop blur
- Keep the logo and brand section on the left
- Keep the location indicator for desktop
- Ensure all controls are properly aligned and responsive
- Add proper loading states using the `isLoading` flag from `useCurrentUser`

**Purpose:** Single, consistent navigation experience across all screen sizes using the dropdown menu approach.

### src\app\dashboard\page.tsx(MODIFY)

References: 

- src\components\layout\app-layout.tsx
- src\components\layout\navigation-header.tsx(MODIFY)

Remove the custom embedded header and use the shared `AppLayout` component for consistent navigation.

**Remove:**
- The entire custom header section (lines 178-196)
- The wrapping `<div className="min-h-screen bg-gray-50">` (line 177) since AppLayout provides this

**Add:**
- Import `AppLayout` from `@/components/layout/app-layout`
- Wrap the entire page content (starting from line 198 with the max-w-7xl container) in `<AppLayout>` component

**Restructure:**
- The main content should start directly with the container div (line 198: `<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">`)
- Remove the duplicate "Job Finders" branding since it's now in the shared header
- Remove the "Browse Jobs" and "Profile" buttons from the custom header - these are now in the navigation menu
- Keep all the dashboard content (welcome section, stats cards, applications, saved jobs, recommended jobs) as is

**Loading and error states:**
- Keep the existing loading state (lines 148-157) but wrap in AppLayout
- Keep the existing error state (lines 163-174) but wrap in AppLayout

**Purpose:** Ensure consistent navigation across all pages and eliminate duplicate header code.

### src\app\employer\dashboard\page.tsx(MODIFY)

References: 

- src\components\layout\app-layout.tsx
- src\components\layout\navigation-header.tsx(MODIFY)

Remove the custom embedded header and use the shared `AppLayout` component for consistent navigation.

**Remove:**
- The entire custom header section (lines 177-204)
- The wrapping `<div className="min-h-screen bg-gray-50">` (line 176) since AppLayout provides this

**Add:**
- Import `AppLayout` from `@/components/layout/app-layout`
- Wrap the entire page content (starting from line 206 with the max-w-7xl container) in `<AppLayout>` component

**Restructure:**
- The main content should start directly with the container div (line 206: `<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">`)
- Remove the duplicate "Job Finders" branding and company verification badge from the custom header - company info can be shown in the welcome section or a separate card if needed
- Remove the "Post Job" and "Company Profile" buttons from the custom header - "Post Job" is now in the navigation, and "Company Profile" is in the menu
- Consider moving the company verification status badge to the welcome section (line 208-214) or the company status card (lines 284-342) for better visibility
- Keep all the dashboard content (welcome section, stats cards, company status, applications, job postings) as is

**Loading and error states:**
- Keep the existing loading state (lines 151-160) but wrap in AppLayout
- Keep the existing error state (lines 162-173) but wrap in AppLayout

**Purpose:** Ensure consistent navigation across all pages and eliminate duplicate header code.

### src\app\profile\page.tsx(MODIFY)

References: 

- src\components\layout\app-layout.tsx
- src\components\layout\navigation-header.tsx(MODIFY)

Remove the custom embedded header and use the shared `AppLayout` component for consistent navigation.

**Remove:**
- The entire custom header section (lines 261-275)
- The wrapping `<div className="min-h-screen bg-gray-50">` (line 260) since AppLayout provides this

**Add:**
- Import `AppLayout` from `@/components/layout/app-layout`
- Wrap the entire page content (starting from line 277 with the max-w-4xl container) in `<AppLayout>` component

**Restructure:**
- The main content should start directly with the container div (line 277: `<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">`)
- Remove the duplicate "Job Finders" branding since it's now in the shared header
- Remove the "Back to Dashboard" button from the custom header - users can navigate via the menu or browser back button
- Keep all the profile form content (profile completion, basic info, skills, experience, contact, portfolio, resume, salary) as is

**Loading state:**
- Keep the existing loading state (lines 235-244) but wrap in AppLayout
- Keep the existing error state (lines 246-257) but wrap in AppLayout

**Purpose:** Ensure consistent navigation across all pages and eliminate duplicate header code.

### src\components\ui\theme-toggle.tsx(MODIFY)

References: 

- src\components\providers\theme-provider.tsx

Verify this component exists and is properly implemented. If it doesn't exist, create it.

**If the file exists:**
- Ensure it exports a `ThemeToggle` component that can be used in the navigation header
- Verify it uses the theme provider from `@/components/providers/theme-provider`
- Ensure it has proper button styling that matches the navigation design
- Check that it has appropriate icons (Sun/Moon) from `lucide-react`

**If the file doesn't exist, create it with:**
- A button component that toggles between light/dark/system themes
- Use `useTheme` hook from `next-themes` or the theme provider
- Render Sun icon for light mode, Moon icon for dark mode
- Use Button component with `variant="ghost"` and `size="icon"`
- Include proper ARIA labels for accessibility
- Add tooltip showing current theme
- Import Sun, Moon icons from `lucide-react`

**Purpose:** Ensure theme toggle is available as a standalone component that can be placed in the navigation header.

### .kiro\architecture\navigation-structure.md(MODIFY)

References: 

- src\components\layout\navigation-header.tsx(MODIFY)
- src\config\navigation.ts(NEW)
- src\components\ui\navigation-dropdown.tsx(MODIFY)

Update the navigation architecture documentation to reflect the new standardized navigation structure.

**Add a new section at the top:**
- "## Navigation Standardization (Updated)" describing the new dropdown-based approach
- Document that all pages now use `AppLayout` with consistent `NavigationHeader`
- Explain the component hierarchy: NavigationHeader → NavigationDropdown (menu) + NotificationDropdown + UserAvatarDropdown + ThemeToggle
- Note that navigation items are centralized in `src/config/navigation.ts`
- Document that mobile and desktop use the same dropdown menu component

**Update the "Current Navigation Implementation" section:**
- Mark the old inline navigation approach as deprecated
- Add note that NavigationDropdown is now simplified and no longer contains duplicate UI elements
- Document the new role-based navigation configuration approach

**Update the "Navigation Hierarchy" section:**
- Show the new component structure with NavigationHeader as the single navigation source
- Document how navigation items are loaded based on user role and authentication status
- Note that custom page headers have been removed

**Add implementation notes:**
- Document that sign-out functionality is now in UserAvatarDropdown
- Note that theme toggle is now a separate component in the header
- Explain that notifications remain in their original position

**Purpose:** Keep architecture documentation in sync with the new standardized navigation implementation.