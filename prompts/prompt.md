Based on the repository structure you've shared, here's a concise prompt for an agentic coder:

---

## Menu Layout Implementation for JobFinders MVP (Next.js)

Create a role-based navigation menu system with the following requirements:

### Menu Structure

**Public Routes (accessible to all):**
- Home
- Companies (browse all companies)
- Jobs (browse all jobs)
- Jobs by Category (dynamic category browsing - e.g., /jobs/category/[categoryName])
- About
- Contact

**Job Seeker Routes (authenticated job seekers only):**
- Dashboard
- My Applications
- Saved Jobs
- Profile Settings
- Resume Manager

**Employer Routes (authenticated employers only):**
- Dashboard
- Post Job
- My Jobs
- Candidates
- Company Profile

**Admin Routes (administrators only):**
- Admin Dashboard
- Manage Users
- Manage Jobs
- Manage Companies
- Manage Categories
- Analytics/Reports

### Technical Requirements

1. **Create components in `/src/components/navigation/`:**
   - `MainNav.tsx` - main navigation component
   - `UserMenu.tsx` - user-specific dropdown menu
   - `MobileNav.tsx` - mobile responsive menu

2. **Implement category browsing:**
   - Create `/src/app/jobs/category/[categoryName]/page.tsx`
   - Add category filter component in `/src/components/jobs/`
   - Categories should be fetched from your database and displayed dynamically

3. **Role-based rendering:**
   - Use Next.js middleware (`/src/middleware.ts`) for route protection
   - Conditionally render menu items based on user role from session/context
   - Show login/signup buttons when unauthenticated

4. **Navigation patterns:**
   - Use Next.js `<Link>` components for client-side navigation
   - Implement active state highlighting for current route
   - Include breadcrumbs for nested pages

5. **Styling:**
   - Use Tailwind CSS (appears to be your styling solution)
   - Make responsive (mobile hamburger menu, desktop horizontal nav)
   - Include dropdown menus for nested items

### Expected File Structure
```
src/
├── components/
│   └── navigation/
│       ├── MainNav.tsx
│       ├── UserMenu.tsx
│       └── MobileNav.tsx
├── app/
│   ├── jobs/
│   │   └── category/
│   │       └── [categoryName]/
│   │           └── page.tsx
│   └── layout.tsx (update to include nav)
└── middleware.ts (add role-based guards)
```

Ensure the menu adapts dynamically based on authentication state and user role, with smooth transitions and accessible keyboard navigation.

Important 
Read design.md for important design and requirements considerations