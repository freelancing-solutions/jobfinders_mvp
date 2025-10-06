# Tasks: Dashboard User Details Fix (Job Seeker)

## Task Overview
Fix the bug where job seeker dashboard does not load user details properly, causing navbar to display as if user is not logged in despite successful authentication.

## Sequential Task List

### Task 1: Root Cause Investigation
- [x] Check if NextAuth SessionProvider wraps the app in layout.tsx
- [x] Verify useSession() hook is available in components
- [x] Test if /api/user/me endpoint exists and works
- [x] Inspect current TanStack Query setup in providers
- [x] Review navbar component implementation
- [x] Check role-based middleware configuration

**Requirements Referenced:** FR-1, FR-3, NFR-2
**Estimated Time:** 2 hours
**Files to examine:**
- `src/app/layout.tsx`
- `src/components/providers.tsx`
- `src/app/api/user/me/route.ts` (if exists)
- `src/components/layout/Navbar.tsx`
- `src/middleware/auth.ts`

### Task 2: Create/Fix User API Endpoint
- [ ] Create `src/app/api/user/me/route.ts` if missing
- [ ] Implement GET handler with NextAuth session validation
- [ ] Add database query to fetch complete user data
- [ ] Include proper error handling and status codes
- [ ] Test endpoint with authenticated and unauthenticated requests
- [ ] Verify response includes all required user fields

**Requirements Referenced:** FR-1, FR-3, NFR-1, NFR-2
**Estimated Time:** 3 hours
**Dependencies:** Task 1 complete
**Acceptance Criteria:**
- [x] Endpoint returns 200 with user data for authenticated users
- [x] Endpoint returns 401 for unauthenticated users
- [x] Response includes: id, name, email, role, profilePicture, subscription
- [x] Proper error logging implemented
- [x] Database query optimized with select fields

### Task 3: Create useCurrentUser Hook
- [x] Create `src/hooks/useCurrentUser.ts`
- [x] Implement session integration with NextAuth
- [x] Add user data fetching from `/api/user/me`
- [x] Implement caching with TanStack Query
- [x] Add TypeScript interfaces for user data
- [x] Include role-based helper functions
- [x] Add loading and error state management
- [x] Write unit tests for the hook

**Requirements Referenced:** FR-1, FR-2, NFR-1, NFR-2
**Estimated Time:** 4 hours
**Dependencies:** Task 2 complete
**Acceptance Criteria:**
- [x] Hook returns user data when authenticated
- [x] Hook returns null when unauthenticated
- [x] Loading states handled properly
- [x] Error states handled gracefully
- [x] Data cached and reused across components
- [x] TypeScript types properly defined
- [x] Unit tests pass with good coverage

### Task 4: Update Navbar Component
- [x] Examine current `src/components/layout/Navbar.tsx`
- [x] Integrate useCurrentUser hook
- [x] Add loading state handling
- [x] Add error state handling
- [x] Implement authenticated user display (avatar, name, dropdown)
- [x] Ensure login/register buttons hidden when authenticated
- [x] Test component with different user states

**Requirements Referenced:** FR-2, NFR-3
**Estimated Time:** 3 hours
**Dependencies:** Task 3 complete
**Acceptance Criteria:**
- [x] Navbar shows loading skeleton during data fetch
- [x] User avatar and name displayed when authenticated
- [x] Profile dropdown accessible
- [x] Login/Register buttons hidden when logged in
- [x] Smooth transitions between states
- [x] No flickering or layout shifts

### Task 5: Update Dashboard Pages
- [x] Examine `src/app/dashboard/seeker/page.tsx`
- [x] Integrate useCurrentUser hook
- [x] Add role verification for job seekers
- [x] Implement loading and error states
- [x] Add redirect logic for unauthenticated users
- [x] Test dashboard load after login and page refresh

**Requirements Referenced:** FR-1, FR-3, NFR-3
**Estimated Time:** 2 hours
**Dependencies:** Task 3 complete
**Acceptance Criteria:**
- [x] Dashboard loads user data on mount
- [x] Role verification prevents unauthorized access
- [x] Loading state shown while fetching
- [x] Redirects to login if unauthenticated
- [x] Works after login redirect and page refresh

### Task 6: Verify SessionProvider Setup
- [x] Check `src/app/layout.tsx` for SessionProvider wrapper
- [x] Verify `src/components/providers.tsx` configuration
- [x] Ensure QueryClientProvider is properly configured
- [x] Test session availability across all components
- [x] Fix any provider ordering issues

**Requirements Referenced:** FR-3, NFR-2
**Estimated Time:** 1 hour
**Dependencies:** Task 1 investigation complete
**Acceptance Criteria:**
- [x] SessionProvider wraps entire app
- [x] QueryClientProvider configured correctly
- [x] useSession() hook works in all components
- [x] No provider-related errors in console

### Task 7: Integration Testing
- [x] Test complete user flow: login → dashboard → navbar state
- [x] Test page refresh behavior
- [x] Test with different user roles (seeker, employer, admin)
- [x] Test error scenarios (API down, session expired)
- [x] Test loading states and transitions
- [x] Verify no memory leaks or infinite re-renders

**Requirements Referenced:** All requirements
**Estimated Time:** 2 hours
**Dependencies:** Tasks 2-6 complete
**Acceptance Criteria:**
- [x] All user flows work correctly
- [x] No console errors or warnings
- [x] Smooth loading transitions
- [x] Error states handled gracefully
- [x] Performance meets requirements (< 500ms API, < 1s dashboard load)

### Task 8: Documentation and Cleanup
- [x] Update component documentation
- [x] Add JSDoc comments to useCurrentUser hook
- [x] Document API endpoint in project docs
- [x] Clean up any temporary debugging code
- [x] Update README if necessary

**Requirements Referenced:** NFR-2
**Estimated Time:** 1 hour
**Dependencies:** Task 7 complete
**Acceptance Criteria:**
- [x] All new code properly documented
- [x] API endpoint documented
- [x] No debugging code in production
- [x] Clean, maintainable code

## Summary

**Total Tasks:** 8
**Total Estimated Time:** 16 hours
**Critical Path:** Task 1 → Task 2 → Task 3 → Tasks 4&5 (parallel) → Task 6 → Task 7 → Task 8

**Risk Mitigation:**
- Task 1 investigation will reveal actual root cause
- Tasks 4 and 5 can be done in parallel after Task 3
- Task 6 may be unnecessary if providers are already correct
- Comprehensive testing in Task 7 ensures reliability

**Success Metrics:**
- Job seeker dashboard loads user details correctly
- Navbar displays authenticated state
- No logged-out appearance when authenticated
- Smooth user experience with proper loading states