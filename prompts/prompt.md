I have created the following plan after thorough exploration and analysis of the codebase. Follow the below plan verbatim. Trust the files and references. Do not re-verify what's written in the plan. Explore only when absolutely necessary. First implement all the proposed file changes and then I'll review all the changes together at the end.

### Observations

## Current State Analysis

The Job Finders MVP has:
- **Navigation components ready**: `NavigationHeader`, `MainNav`, `MobileNav` with role-based navigation from `src/config/navigation.ts`
- **Inconsistent layout usage**: Home and Jobs pages use `AppLayout`, but About, Companies, Contact, and Pricing pages don't
- **Import path inconsistency**: Legal pages (Terms, Privacy, Cookies, Refund) import `AppLayout` with capital 'A' but the actual file is `app-layout.tsx`
- **No footer component**: Footer doesn't exist anywhere in the codebase
- **Auth pages are standalone**: Sign in, sign up, forgot password, and reset password pages have no navigation or home button
- **Job Finders title already links home**: The logo/title in `NavigationHeader` already has `<Link href="/">` wrapping it (line 56)

The user wants:
1. Navigation bars on all major pages (Companies, About, Contact, Pricing)
2. Home/Cancel button on authentication pages
3. Footer with legal, social, and basic navigation links
4. Job Finders title linking to home (already done ✓)


### Approach

## Implementation Strategy

**Phase 1: Fix Import Path Issue**
- Correct the import path inconsistency in legal pages (Terms, Privacy, Cookies, Refund) from `AppLayout` to `app-layout`

**Phase 2: Create Footer Component**
- Build a comprehensive footer with three sections: Basic Navigation (reusing public nav items), Legal Links, and Social Media placeholders
- Design it to be responsive and match the existing design system
- Add it to `AppLayout` so all pages using AppLayout automatically get the footer

**Phase 3: Add Navigation to Marketing Pages**
- Wrap About, Companies, Contact, and Pricing pages with `AppLayout` to add navigation header and footer

**Phase 4: Add Home Button to Auth Pages**
- Add a "Back to Home" button at the top of each auth page card for easy navigation back to the main site
- Keep auth pages standalone (no full navigation) to maintain focus on the authentication flow


### Reasoning

I explored the codebase structure by listing directories and reading key files. I examined the navigation configuration, existing layout components, all major pages (home, about, companies, contact, pricing, jobs), legal pages (terms, privacy, cookies, refund), and authentication pages (signin, signup, forgot-password, reset-password). I verified there are no conflicting layout.tsx files in subdirectories and confirmed the navigation header already links the Job Finders title to home. I identified the import path inconsistency and the absence of a footer component.


## Proposed File Changes

### src\components\layout\Footer.tsx(NEW)

References: 

- src\config\navigation.ts

Create a new Footer component with three main sections:

**Structure:**
1. **Top Section** - Three columns (responsive: stack on mobile)
   - **Column 1: About & Navigation** - Company tagline and basic navigation links (Home, Jobs, Companies, About, Contact, Pricing) pulled from `publicNavigationItems` in `src/config/navigation.ts`
   - **Column 2: Legal** - Links to Terms, Privacy, Cookies, Refund policies
   - **Column 3: Connect** - Social media placeholder links (LinkedIn, Twitter, Facebook, Instagram) using lucide-react icons

2. **Bottom Section** - Copyright and company info
   - Copyright text: "© 2024 Job Finders. Operated by Custom Logic SA Pty LTD. All rights reserved."
   - Location indicator: "South Africa"

**Styling:**
- Use dark background (bg-slate-900 or similar) with light text for contrast
- Responsive grid layout (1 column mobile, 3 columns desktop)
- Consistent spacing using Tailwind utilities
- Links should have hover states (hover:text-primary or hover:underline)
- Social icons should be in a horizontal flex layout
- Use lucide-react icons: Linkedin, Twitter, Facebook, Instagram, MapPin

**Implementation Details:**
- Import `publicNavigationItems` from `@/config/navigation` and filter to show only key marketing pages (Home, Jobs, Companies, About, Contact, Pricing)
- Use Next.js `Link` component for all internal navigation
- Social links can be placeholder `#` hrefs with `target="_blank"` and `rel="noopener noreferrer"`
- Add proper semantic HTML: `<footer>` tag with sections
- Make it a client component ('use client') if needed for any interactive features

### src\components\layout\app-layout.tsx(MODIFY)

References: 

- src\components\layout\Footer.tsx(NEW)

Update the AppLayout component to include the new Footer component:

1. Import the Footer component: `import { Footer } from './Footer'`

2. Modify the JSX structure to add the Footer after the main content:
   - Keep the existing structure: `<NavigationHeader />` and `<main>{children}</main>`
   - Add `<Footer />` after the closing `</main>` tag but before the closing `</div>`

3. Ensure the layout structure is:
   ```
   <div className="min-h-screen bg-background">
     <NavigationHeader user={user} />
     <main className="flex-1">
       {children}
     </main>
     <Footer />
   </div>
   ```

4. The `flex-1` class on main ensures the footer stays at the bottom when content is short

No changes needed to props or component logic - just adding the Footer to the render output.

### src\app\about\page.tsx(MODIFY)

References: 

- src\components\layout\app-layout.tsx(MODIFY)

Wrap the entire page content with AppLayout to add navigation header and footer:

1. Import AppLayout at the top: `import { AppLayout } from '@/components/layout/app-layout'`

2. Wrap the entire return statement content (starting from the `<div className="min-h-screen bg-background">`) inside `<AppLayout>` tags

3. The structure should be:
   ```
   return (
     <AppLayout>
       <div className="min-h-screen bg-background">
         {/* All existing content remains unchanged */}
       </div>
     </AppLayout>
   )
   ```

4. Remove the `min-h-screen` class from the inner div since AppLayout handles the full-height layout

No other changes needed - all existing content, sections, and styling remain exactly as they are.

### src\app\companies\page.tsx(MODIFY)

References: 

- src\components\layout\app-layout.tsx(MODIFY)

Wrap the entire page content with AppLayout to add navigation header and footer:

1. Import AppLayout at the top: `import { AppLayout } from '@/components/layout/app-layout'`

2. Wrap the entire return statement content (starting from the `<div className="min-h-screen bg-background">`) inside `<AppLayout>` tags

3. The structure should be:
   ```
   return (
     <AppLayout>
       <div className="min-h-screen bg-background">
         {/* All existing content remains unchanged */}
       </div>
     </AppLayout>
   )
   ```

4. Remove the `min-h-screen` class from the inner div since AppLayout handles the full-height layout

No other changes needed - all existing content, sections, and styling remain exactly as they are.

### src\app\contact\page.tsx(MODIFY)

References: 

- src\components\layout\app-layout.tsx(MODIFY)

Wrap the entire page content with AppLayout to add navigation header and footer:

1. Import AppLayout at the top: `import { AppLayout } from '@/components/layout/app-layout'`

2. Wrap the entire return statement content (starting from the `<div className="min-h-screen bg-background">`) inside `<AppLayout>` tags

3. The structure should be:
   ```
   return (
     <AppLayout>
       <div className="min-h-screen bg-background">
         {/* All existing content remains unchanged */}
       </div>
     </AppLayout>
   )
   ```

4. Remove the `min-h-screen` class from the inner div since AppLayout handles the full-height layout

No other changes needed - all existing content, sections, and styling remain exactly as they are.

### src\app\pricing\page.tsx(MODIFY)

References: 

- src\components\layout\app-layout.tsx(MODIFY)

Wrap the entire page content with AppLayout to add navigation header and footer:

1. Import AppLayout at the top: `import { AppLayout } from '@/components/layout/app-layout'`

2. Wrap the entire return statement content inside `<AppLayout>` tags

3. The structure should be:
   ```
   return (
     <AppLayout>
       <div className="container max-w-7xl mx-auto py-10 space-y-10">
         {/* All existing content remains unchanged */}
       </div>
     </AppLayout>
   )
   ```

No other changes needed - all existing content remains exactly as it is.

### src\app\terms\page.tsx(MODIFY)

References: 

- src\components\layout\app-layout.tsx(MODIFY)

Fix the import path for AppLayout:

1. Change the import statement from:
   `import { AppLayout } from '@/components/layout/AppLayout'`
   
   to:
   `import { AppLayout } from '@/components/layout/app-layout'`

2. This fixes the case sensitivity issue - the actual file is named `app-layout.tsx` (lowercase) but the import was using `AppLayout` (uppercase)

No other changes needed - the component is already wrapped with AppLayout correctly.

### src\app\privacy\page.tsx(MODIFY)

References: 

- src\components\layout\app-layout.tsx(MODIFY)

Fix the import path for AppLayout:

1. Change the import statement from:
   `import { AppLayout } from '@/components/layout/AppLayout'`
   
   to:
   `import { AppLayout } from '@/components/layout/app-layout'`

2. This fixes the case sensitivity issue - the actual file is named `app-layout.tsx` (lowercase) but the import was using `AppLayout` (uppercase)

No other changes needed - the component is already wrapped with AppLayout correctly.

### src\app\cookies\page.tsx(MODIFY)

References: 

- src\components\layout\app-layout.tsx(MODIFY)

Fix the import path for AppLayout:

1. Change the import statement from:
   `import { AppLayout } from '@/components/layout/AppLayout'`
   
   to:
   `import { AppLayout } from '@/components/layout/app-layout'`

2. This fixes the case sensitivity issue - the actual file is named `app-layout.tsx` (lowercase) but the import was using `AppLayout` (uppercase)

No other changes needed - the component is already wrapped with AppLayout correctly.

### src\app\refund\page.tsx(MODIFY)

References: 

- src\components\layout\app-layout.tsx(MODIFY)

Fix the import path for AppLayout:

1. Change the import statement from:
   `import { AppLayout } from '@/components/layout/AppLayout'`
   
   to:
   `import { AppLayout } from '@/components/layout/app-layout'`

2. This fixes the case sensitivity issue - the actual file is named `app-layout.tsx` (lowercase) but the import was using `AppLayout` (uppercase)

No other changes needed - the component is already wrapped with AppLayout correctly.

### src\app\auth\signin\page.tsx(MODIFY)

Add a "Back to Home" button at the top of the sign-in page for easy navigation:

1. Import the Home icon from lucide-react: `import { Loader2, Eye, EyeOff, Home } from 'lucide-react'`

2. Add a "Back to Home" button above the centered card container, inside the main wrapper div:
   - Position it at the top-left of the page using absolute positioning or as the first element in the container
   - Use the Button component with variant="ghost" or variant="outline"
   - Include the Home icon and "Back to Home" text
   - Link it to "/" using Next.js Link or router.push

3. Structure should be:
   ```
   <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
     <div className="w-full max-w-md">
       <div className="mb-4">
         <Button variant="ghost" asChild>
           <Link href="/">
             <Home className="h-4 w-4 mr-2" />
             Back to Home
           </Link>
         </Button>
       </div>
       {/* Existing content: title, card, etc. */}
     </div>
   </div>
   ```

4. Alternatively, place it as an absolute positioned element in the top-left corner of the viewport

No changes to the form logic or existing functionality - just adding navigation convenience.

### src\app\auth\signup\page.tsx(MODIFY)

Add a "Back to Home" button at the top of the sign-up page for easy navigation:

1. Import the Home icon from lucide-react: `import { Loader2, Eye, EyeOff, Home } from 'lucide-react'`

2. Add a "Back to Home" button above the centered card container, inside the main wrapper div:
   - Position it at the top-left of the page using absolute positioning or as the first element in the container
   - Use the Button component with variant="ghost" or variant="outline"
   - Include the Home icon and "Back to Home" text
   - Link it to "/" using Next.js Link or router.push

3. Structure should be:
   ```
   <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
     <div className="w-full max-w-md">
       <div className="mb-4">
         <Button variant="ghost" asChild>
           <Link href="/">
             <Home className="h-4 w-4 mr-2" />
             Back to Home
           </Link>
         </Button>
       </div>
       {/* Existing content: title, card, etc. */}
     </div>
   </div>
   ```

4. Alternatively, place it as an absolute positioned element in the top-left corner of the viewport

No changes to the form logic or existing functionality - just adding navigation convenience.

### src\app\auth\forgot-password\page.tsx(MODIFY)

Add a "Back to Home" button at the top of the forgot password page for easy navigation:

1. Import the Home icon from lucide-react: `import { Loader2, ArrowLeft, Mail, CheckCircle, Home } from 'lucide-react'`

2. Add a "Back to Home" button in both the main form view and the success view:
   - For the main form (lines 161-243): Add the button above the card container
   - For the success view (lines 94-158): Add the button above the card container
   - Use the Button component with variant="ghost" or variant="outline"
   - Include the Home icon and "Back to Home" text
   - Link it to "/" using Next.js Link or router.push

3. Structure for both views should be:
   ```
   <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
     <div className="max-w-md w-full space-y-8">
       <div className="mb-4">
         <Button variant="ghost" asChild>
           <Link href="/">
             <Home className="h-4 w-4 mr-2" />
             Back to Home
           </Link>
         </Button>
       </div>
       {/* Existing card content */}
     </div>
   </div>
   ```

4. This provides an alternative to the existing "Back to Sign In" button for users who want to return to the main site

No changes to the form logic or existing functionality - just adding navigation convenience.

### src\app\auth\reset-password\page.tsx(MODIFY)

Add a "Back to Home" button at the top of the reset password page for easy navigation:

1. Import the Home icon from lucide-react: `import { Loader2, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft, Home } from 'lucide-react'`

2. Add a "Back to Home" button in all three views (loading, invalid token, and reset form):
   - For the loading state (lines 122-136): Add the button above the card
   - For the invalid token state (lines 140-182): Add the button above the card
   - For the reset form (lines 223-367): Add the button above the card
   - For the success state (lines 186-220): Add the button above the card
   - Use the Button component with variant="ghost" or variant="outline"
   - Include the Home icon and "Back to Home" text
   - Link it to "/" using Next.js Link or router.push

3. Structure for all views should be:
   ```
   <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
     <div className="max-w-md w-full">
       <div className="mb-4">
         <Button variant="ghost" asChild>
           <Link href="/">
             <Home className="h-4 w-4 mr-2" />
             Back to Home
           </Link>
         </Button>
       </div>
       {/* Existing card content */}
     </div>
   </div>
   ```

4. This provides an alternative to the existing "Back to Sign In" button for users who want to return to the main site

No changes to the form logic or existing functionality - just adding navigation convenience.