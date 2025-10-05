# Forgot Password Resend - Task List

## Task 1: Database Schema Updates
**Status**: [ ] Pending  
**Requirements**: REQ-008  
**Estimated Time**: 30 minutes  
**Dependencies**: None  

### Description
Update the Prisma schema to add password reset token fields to the User model and create the necessary database migration.

### Acceptance Criteria
- [ ] Add `resetToken` and `resetTokenExpiry` fields to User model in `prisma/schema.prisma`
- [ ] Create database migration using `npx prisma migrate dev`
- [ ] Verify fields are properly indexed for performance
- [ ] Test migration on development database

### Implementation Notes
- Fields should be nullable to maintain backward compatibility
- Add unique constraint on `resetToken` field
- Index both `resetToken` and `email` fields for query performance

---

## Task 2: Rate Limiting Setup
**Status**: [ ] Pending  
**Requirements**: REQ-005, REQ-006  
**Estimated Time**: 45 minutes  
**Dependencies**: Task 1  

### Description
Implement rate limiting functionality to prevent abuse of the password reset feature using Redis and Upstash.

### Acceptance Criteria
- [ ] Create `src/lib/rate-limiter.ts` with Upstash Redis configuration
- [ ] Implement sliding window rate limiting (3 requests per hour)
- [ ] Add environment variables for Redis configuration
- [ ] Test rate limiting functionality

### Implementation Notes
- Use `@upstash/ratelimit` package for rate limiting
- Configure sliding window: 3 requests per hour per IP/email
- Handle rate limit exceeded responses gracefully

---

## Task 3: Forgot Password API Endpoint
**Status**: [ ] Pending  
**Requirements**: REQ-001, REQ-002, REQ-011  
**Estimated Time**: 1 hour  
**Dependencies**: Task 2  

### Description
Create the API endpoint to handle password reset requests, including email validation, token generation, and email sending.

### Acceptance Criteria
- [ ] Create `src/app/api/auth/forgot-password/route.ts`
- [ ] Implement email validation and user lookup
- [ ] Generate cryptographically secure reset tokens
- [ ] Store tokens in database with expiration
- [ ] Integrate with Resend for email delivery
- [ ] Implement proper error handling and security measures

### Implementation Notes
- Always return success response to prevent email enumeration
- Use `crypto.randomBytes(32)` for secure token generation
- Set token expiration to 1 hour
- Include rate limiting middleware

---

## Task 4: Reset Password API Endpoint
**Status**: [ ] Pending  
**Requirements**: REQ-003, REQ-012  
**Estimated Time**: 45 minutes  
**Dependencies**: Task 3  

### Description
Create the API endpoint to handle password reset completion using valid tokens.

### Acceptance Criteria
- [ ] Create `src/app/api/auth/reset-password/route.ts`
- [ ] Implement token validation and expiration checking
- [ ] Validate new password requirements
- [ ] Hash new password using bcrypt
- [ ] Update user password and invalidate token
- [ ] Return appropriate success/error responses

### Implementation Notes
- Validate token exists and is not expired
- Enforce minimum password length (8 characters)
- Use bcrypt with salt rounds ≥ 12
- Clear reset token after successful password update

---

## Task 5: Token Verification API Endpoint
**Status**: [ ] Pending  
**Requirements**: REQ-013  
**Estimated Time**: 30 minutes  
**Dependencies**: Task 4  

### Description
Create an API endpoint to verify reset token validity without consuming the token.

### Acceptance Criteria
- [ ] Create `src/app/api/auth/verify-reset-token/route.ts`
- [ ] Implement token validation logic
- [ ] Return token validity status
- [ ] Handle invalid/expired tokens gracefully

### Implementation Notes
- Accept token as query parameter
- Check token existence and expiration
- Return boolean validity status
- Used by frontend reset form for validation

---

## Task 6: Forgot Password Frontend Form
**Status**: [ ] Pending  
**Requirements**: REQ-007, REQ-016  
**Estimated Time**: 1 hour  
**Dependencies**: Task 3  

### Description
Create the forgot password request form with proper validation, loading states, and user feedback.

### Acceptance Criteria
- [ ] Create `src/app/auth/forgot-password/page.tsx`
- [ ] Implement responsive form design
- [ ] Add email validation and error handling
- [ ] Include loading states and success messages
- [ ] Ensure accessibility compliance (WCAG 2.1 AA)
- [ ] Add navigation back to sign-in page

### Implementation Notes
- Use existing UI components (Card, Input, Button, Alert)
- Implement client-side email validation
- Show clear success/error messages
- Disable form during submission

---

## Task 7: Reset Password Frontend Form
**Status**: [ ] Pending  
**Requirements**: REQ-007, REQ-016  
**Estimated Time**: 1.5 hours  
**Dependencies**: Task 5, Task 6  

### Description
Create the password reset form that validates tokens and allows users to set new passwords.

### Acceptance Criteria
- [ ] Create `src/app/auth/reset-password/page.tsx`
- [ ] Implement token validation on page load
- [ ] Create password reset form with confirmation
- [ ] Add password strength validation
- [ ] Handle invalid/expired tokens gracefully
- [ ] Redirect to sign-in after successful reset

### Implementation Notes
- Validate token on component mount
- Implement password confirmation matching
- Show loading states during validation and submission
- Handle various error scenarios (invalid token, network errors)
- Auto-redirect after successful password reset

---

## Task 8: Email Template Integration
**Status**: [ ] Pending  
**Requirements**: REQ-004, REQ-009  
**Estimated Time**: 45 minutes  
**Dependencies**: Task 3  

### Description
Set up Resend integration and create professional email templates for password reset notifications.

### Acceptance Criteria
- [ ] Configure Resend API key in environment variables
- [ ] Create HTML email template with branding
- [ ] Include clear reset instructions and button
- [ ] Test email delivery in development
- [ ] Handle email delivery errors gracefully

### Implementation Notes
- Use professional email styling
- Include clear call-to-action button
- Add security notice about link expiration
- Test with various email clients

---

## Task 9: Navigation Integration
**Status**: [ ] Pending  
**Requirements**: REQ-007  
**Estimated Time**: 30 minutes  
**Dependencies**: Task 6  

### Description
Add "Forgot Password" link to the existing sign-in form and ensure proper navigation flow.

### Acceptance Criteria
- [ ] Add "Forgot Password" link to sign-in page
- [ ] Ensure consistent styling with existing auth pages
- [ ] Test navigation flow between auth pages
- [ ] Verify mobile responsiveness

### Implementation Notes
- Update existing sign-in page component
- Maintain consistent design language
- Position link appropriately in form layout

---

## Task 10: Testing and Documentation
**Status**: [ ] Pending  
**Requirements**: REQ-017, REQ-018, REQ-019  
**Estimated Time**: 1 hour  
**Dependencies**: Task 9  

### Description
Create comprehensive tests for the password reset functionality and update project documentation.

### Acceptance Criteria
- [ ] Write unit tests for API endpoints
- [ ] Create integration tests for complete flow
- [ ] Test rate limiting functionality
- [ ] Verify security measures (token generation, password hashing)
- [ ] Update project README with new features
- [ ] Document environment variable requirements

### Implementation Notes
- Use Jest/Vitest for unit testing
- Test both success and error scenarios
- Verify database state changes
- Document setup requirements for new developers

---

## Summary
- **Total Tasks**: 10
- **Estimated Total Time**: 8 hours
- **Critical Path**: Tasks 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10
- **Key Dependencies**: Database schema must be updated first, API endpoints before frontend forms