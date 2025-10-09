# Requirements: Dashboard User Details Fix (Job Seeker)

## Overview
Fix bug where job seeker dashboard does not load user details properly, causing navbar to display as if user is not logged in despite successful authentication.

## Current Status
- **Implementation Status:** Bug - Partially Working
- **Issue:** User details not loading in dashboard for job seekers
- **Symptom:** Navbar shows logged-out state even when authenticated
- **Root Cause:** Unknown (requires investigation)

## Functional Requirements

### FR-1: User Data Loading
- Dashboard must load authenticated user data on mount
- User data must come from database via API (not Vercel/session storage only)
- Data includes: name, email, role, profile picture, subscription tier
- Loading state shown while fetching data
- Error state shown if fetch fails

### FR-2: Navbar State Synchronization
- Navbar must reflect authenticated state correctly
- User avatar/name displayed when logged in
- Login/Register buttons hidden when authenticated
- Profile dropdown accessible when logged in
- Real-time updates when user data changes

### FR-3: Session Validation
- Verify NextAuth session exists
- Cross-check session with database user
- Handle expired sessions gracefully
- Redirect to login if session invalid

## Non-Functional Requirements

### NFR-1: Performance
- User data fetch: < 500ms
- Dashboard load: < 1s total
- No unnecessary re-fetches
- Proper caching with TanStack Query

### NFR-2: Reliability
- Graceful degradation if API fails
- Retry logic for failed requests
- Error logging for debugging
- No infinite loading states

### NFR-3: User Experience
- Smooth loading transitions
- Clear error messages
- No flickering between states
- Consistent navbar across all pages

## Integration Requirements

### Existing Features
- **NextAuth.js:** Must properly read session data
- **API Routes:** Must return complete user data
- **Navbar Component:** Must receive and display user data
- **Dashboard Layout:** Must fetch user data on mount

### State Management
- Use TanStack Query for user data fetching
- Zustand store for global user state (if needed)
- Proper cache invalidation on logout

### API Endpoints
**GET /api/user/me** - Fetch current user details
```typescript
Response: {
  id: string;
  name: string;
  email: string;
  role: UserRole.JOB_SEEKER | UserRole.EMPLOYER | UserRole.ADMIN;
  profilePicture?: string;
  subscription?: {
    tier: string;
    status: string;
  };
}
```

## Root Cause Investigation

### Potential Issues to Investigate:
1. **Session Not Properly Initialized**
   - NextAuth session not available on client
   - useSession() hook not wrapped in SessionProvider
   
2. **API Route Not Returning User Data**
   - /api/user/me endpoint missing or broken
   - Database query failing silently
   
3. **Client-Side Data Fetching Issue**
   - TanStack Query not configured correctly
   - Query key mismatch
   - Stale data being served
   
4. **Navbar Not Receiving User Data**
   - Props not passed correctly
   - State not updated
   - Component not re-rendering

5. **Role-Based Routing Issue**
   - Job seeker role not recognized
   - Middleware redirecting incorrectly

## Success Criteria
- [ ] Job seeker dashboard loads user details on mount
- [ ] Navbar displays user name and avatar
- [ ] Profile dropdown accessible
- [ ] No logged-out state when authenticated
- [ ] Works consistently across page refreshes
- [ ] Works after login redirect
- [ ] Error states handled gracefully
- [ ] Loading states smooth and brief

## Testing Requirements
- Test dashboard load after fresh login
- Test dashboard load after page refresh
- Test with different job seeker accounts
- Test with slow network (throttling)
- Test error scenarios (API down, session expired)
- Test role switching (if applicable)