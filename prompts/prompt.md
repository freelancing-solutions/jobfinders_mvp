# Kiro Specification Protocol - JobFinders Bug Fixes & Feature Implementation

## Mission Statement

You are tasked with completing outstanding features and fixing critical bugs in the JobFinders platform:

```
Repository: https://github.com/freelancing-solutions/jobfinders
Stack: Next.js 15 + TypeScript + Prisma + NextAuth.js + PostgreSQL + Redis
```

Your objective is to systematically implement missing features and resolve identified bugs using the Kiro specification framework, ensuring all features work cohesively within the existing architecture.

---

## Phase 1: Discovery & Analysis

### 1.1 Current System Analysis

**Technology Stack:**
- Framework: Next.js 15 (App Router)
- Language: TypeScript 5
- Database: PostgreSQL with Prisma ORM
- Authentication: NextAuth.js (credential provider, role-based)
- Styling: Tailwind CSS 4 + shadcn/ui
- State: Zustand + TanStack Query
- Forms: React Hook Form + Zod
- Real-time: Socket.IO
- AI: OpenAI GPT-4, TensorFlow.js
- Cache: Redis

**Existing Features:**
- Role-based authentication (seeker, employer, admin)
- Job posting and management
- Application tracking
- Real-time chat
- Profile management
- Advanced search
- Analytics dashboard
- AI-powered features (resume builder, ATS, candidate matching)

**User Roles:**
- Job Seekers: Search jobs, apply, manage profile
- Employers: Post jobs, review applicants, manage postings
- Admin: Platform management, user moderation

---

## Phase 2: Feature & Bug Specification

### Feature Set to Implement

#### 1. Forgot Password & Resend Email Integration
#### 2. Dashboard User Details Fix (Job Seeker)
#### 3. South African Provinces Pre-population
#### 4. Job Database Seeding
#### 5. Footer Information & Links
#### 6. Authentication Flow Improvements

---

## .kiro/specs/

### Directory Structure

```
.kiro/
├── specs/
│   ├── forgot-password-resend/
│   │   ├── requirements.md
│   │   ├── design.md
│   │   └── tasks.md
│   ├── dashboard-user-details-fix/
│   │   ├── requirements.md
│   │   ├── design.md
│   │   └── tasks.md
│   ├── provinces-seeding/
│   │   ├── requirements.md
│   │   ├── design.md
│   │   └── tasks.md
│   ├── jobs-seeding/
│   │   ├── requirements.md
│   │   ├── design.md
│   │   └── tasks.md
│   ├── footer-implementation/
│   │   ├── requirements.md
│   │   ├── design.md
│   │   └── tasks.md
│   └── auth-flow-improvements/
│       ├── requirements.md
│       ├── design.md
│       └── tasks.md
└── implementation-plan.md
```

---

# Feature 1: Forgot Password & Resend Email Integration

## .kiro/specs/forgot-password-resend/requirements.md

```markdown
# Requirements: Forgot Password & Resend Email Integration

## Overview
Implement secure password reset functionality with email verification using Resend, and integrate Resend as the primary email service provider for ALL JobFinders notifications.

## Current Status
- **Implementation Status:** Not Started
- **Documentation Location:** None
- **Existing Code:** NextAuth.js authentication implemented
- **Dependencies:** NextAuth.js credential provider, Prisma User model

## Functional Requirements

### FR-1: Forgot Password Request
- User can click "Forgot Password?" link on login page
- User enters email address
- System validates email format (client + server)
- System generates secure reset token (256-bit, cryptographically random)
- Token expires in 1 hour
- System sends password reset email via Resend
- Same response for existing/non-existing emails (prevent enumeration)
- Rate limiting: 3 requests per hour per IP address

**User Actions:**
- Click "Forgot Password?" → Open dialog
- Enter email → Submit
- Receive confirmation message
- Check email → Click reset link

### FR-2: Password Reset Execution
- User clicks reset link in email
- System validates token (exists, not expired, not used)
- Display password reset form if valid
- User enters new password (with strength requirements)
- User confirms password
- System updates password with bcrypt hash (cost factor 12)
- System invalidates token (mark as used)
- System sends confirmation email
- User redirected to login page

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### FR-3: Resend Email Integration
**Email Types to Implement:**

1. **Authentication Emails:**
   - Welcome email (new user registration)
   - Email verification (if implementing email verification)
   - Password reset
   - Password change confirmation

2. **Job Seeker Notifications:**
   - Job application submitted
   - Application status update
   - Interview invitation received
   - New job matches (AI recommendations)
   - Saved job reminders

3. **Employer Notifications:**
   - New application received
   - Application status changed
   - Job posting approved/rejected
   - Subscription renewal reminder
   - Payment receipt

4. **System Notifications:**
   - Account created
   - Profile completion reminder
   - Subscription changes
   - Payment confirmations

### FR-4: Email Service Requirements
- Centralized email service layer
- Template-based email system (Handlebars/React Email)
- Error handling with retry logic (3 attempts, exponential backoff)
- Email delivery logging (success/failure)
- Async email sending (non-blocking)
- Webhook support for delivery status tracking

## Non-Functional Requirements

### NFR-1: Security
- Tokens generated with `crypto.randomBytes(32)`
- Tokens stored as SHA-256 hash in database
- HTTPS-only reset links
- CSRF protection on forms
- Rate limiting enforced on all endpoints
- No timing attacks (consistent response times)
- Secure email delivery (TLS)

### NFR-2: Performance
- Token generation: < 100ms
- Email API call: < 2s (async)
- Page load times: < 500ms
- Database queries optimized with indexes

### NFR-3: Usability
- Clear error messages (no technical jargon)
- Loading states during async operations
- Success confirmations
- Mobile-responsive design
- Accessible forms (WCAG 2.1 AA)
- Password strength indicator
- Show/hide password toggle

### NFR-4: Reliability
- 99.9% email delivery rate (Resend SLA)
- Idempotent operations
- Transaction safety for critical operations
- Comprehensive error logging

## Integration Requirements

### Existing Features
- **NextAuth.js:** Must work with credential provider
- **Prisma:** All database operations via Prisma ORM
- **UI Components:** Use existing shadcn/ui components
- **Forms:** React Hook Form + Zod validation pattern
- **State Management:** TanStack Query for API calls

### Database Schema Extensions
**New Models:**
```prisma
model PasswordResetToken {
  id          String   @id @default(cuid())
  token       String   @unique // SHA-256 hashed
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt   DateTime
  used        Boolean  @default(false)
  usedAt      DateTime?
  createdAt   DateTime @default(now())
  
  @@index([token])
  @@index([userId])
  @@index([expiresAt])
}

model EmailLog {
  id          String   @id @default(cuid())
  to          String
  subject     String
  type        String   // 'password_reset', 'welcome', etc.
  status      String   // 'sent', 'failed', 'pending', 'delivered', 'bounced'
  resendId    String?  // Resend message ID for tracking
  error       String?  // Error message if failed
  metadata    Json?    // Additional context
  createdAt   DateTime @default(now())
  deliveredAt DateTime?
  
  @@index([to])
  @@index([type])
  @@index([status])
  @@index([createdAt])
}
```

**Modified Model:**
```prisma
model User {
  // ... existing fields
  passwordResetTokens PasswordResetToken[]
  lastPasswordChange  DateTime?
}
```

### Navigation Integration
- Add "Forgot Password?" link to login page
- Create `/auth/reset-password` page
- Redirect to login after successful reset

### Environment Variables
```env
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@jobfinders.com
RESEND_FROM_NAME=JobFinders
RESEND_REPLY_TO=support@jobfinders.com
NEXT_PUBLIC_APP_URL=https://jobfinders.com
```

## Constraints
- Must use Resend for all emails
- Must work with existing NextAuth.js setup
- Must not break current authentication flow
- Must follow existing code patterns (API routes, components, etc.)
- Must use Prisma for all database operations
- Email templates must be mobile-responsive
- Must handle Resend API rate limits gracefully

## Success Criteria
- [ ] User can request password reset from login page
- [ ] Reset email delivered within 5 seconds
- [ ] Reset link opens valid reset form
- [ ] Password successfully updated
- [ ] Token invalidated after use
- [ ] Expired tokens rejected with clear message
- [ ] Rate limiting prevents abuse
- [ ] No email enumeration possible
- [ ] All 10+ email types implemented with templates
- [ ] Email delivery logging functional
- [ ] 90%+ test coverage
- [ ] Documentation complete

## Testing Requirements
- Unit tests for token generation/validation
- Integration tests for full reset flow
- Security tests for enumeration, rate limiting
- Email template rendering tests
- E2E test for complete user journey
```

---

## .kiro/specs/forgot-password-resend/design.md

```markdown
# Design: Forgot Password & Resend Email Integration

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     JobFinders Platform                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Login Page ──▶ Forgot Password Dialog ──▶ API Route            │
│                                                │                  │
│                                                ▼                  │
│                                        Token Generation           │
│                                                │                  │
│                                                ▼                  │
│                                        Prisma (Database)          │
│                                                │                  │
│                                                ▼                  │
│                                        Email Service              │
│                                                │                  │
│                                                ▼                  │
│                                        Resend API                 │
│                                                                   │
│  Email Link ──▶ Reset Password Page ──▶ API Route               │
│                                                │                  │
│                                                ▼                  │
│                                        Validate Token             │
│                                                │                  │
│                                                ▼                  │
│                                        Update Password            │
│                                                │                  │
│                                                ▼                  │
│                                        Send Confirmation          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Component Design

### 1. ForgotPasswordDialog Component
**File:** `src/components/auth/ForgotPasswordDialog.tsx`

**Purpose:** Modal for password reset request

**Props:**
```typescript
interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

**Implementation:**
```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export function ForgotPasswordDialog({ open, onOpenChange }: ForgotPasswordDialogProps) {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const mutation = useMutation({
    mutationFn: async (data: { email: string }) => {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Request failed');
      return res.json();
    },
    onSuccess: () => {
      toast.success('If an account exists, you\'ll receive a reset email shortly');
      form.reset();
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Something went wrong. Please try again.');
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Enter your email address and we'll send you a link to reset your password.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(data => mutation.mutate(data))} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <Input {...field} type="email" placeholder="you@example.com" />
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

### 2. ResetPasswordForm Component
**File:** `src/components/auth/ResetPasswordForm.tsx`

**Props:**
```typescript
interface ResetPasswordFormProps {
  token: string;
}
```

**Implementation:**
```typescript
const schema = z.object({
  password: z.string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'At least one uppercase letter')
    .regex(/[a-z]/, 'At least one lowercase letter')
    .regex(/[0-9]/, 'At least one number')
    .regex(/[^A-Za-z0-9]/, 'At least one special character'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  // Validate token on mount
  const { data: tokenValid, isLoading, error } = useQuery({
    queryKey: ['validate-reset-token', token],
    queryFn: async () => {
      const res = await fetch(`/api/auth/validate-reset-token?token=${token}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Invalid token');
      }
      return res.json();
    },
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: async (data: { password: string }) => {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: data.password }),
      });
      if (!res.ok) throw new Error('Reset failed');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Password reset successful! Redirecting to login...');
      setTimeout(() => router.push('/auth/login'), 2000);
    },
    onError: () => {
      toast.error('Failed to reset password. Please try again.');
    },
  });

  if (isLoading) {
    return <div>Validating reset link...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error.message}</AlertDescription>
        <Button onClick={() => router.push('/auth/login')} className="mt-4">
          Back to Login
        </Button>
      </Alert>
    );
  }

  // ... form implementation with PasswordStrengthIndicator
}
```

### 3. PasswordStrengthIndicator Component
**File:** `src/components/auth/PasswordStrengthIndicator.tsx`

```typescript
const calculateStrength = (password: string): number => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  return Math.min(strength - 1, 3); // 0-3 scale
};

export function PasswordStrengthIndicator({ password }: { password: string }) {
  const strength = calculateStrength(password);
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors',
              i <= strength ? colors[strength] : 'bg-gray-200'
            )}
          />
        ))}
      </div>
      {password && (
        <p className="text-xs text-gray-600">{labels[strength]}</p>
      )}
    </div>
  );
}
```

## API Routes

### 1. POST /api/auth/forgot-password
**File:** `src/app/api/auth/forgot-password/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { generateResetToken, hashToken } from '@/lib/auth/tokens';
import { sendPasswordResetEmail } from '@/lib/email';
import { rateLimit } from '@/lib/rate-limit';

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const identifier = req.headers.get('x-forwarded-for') || 'unknown';
    const { success } = await rateLimit.check(identifier, 'forgot-password', 3, 3600);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { email } = schema.parse(body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Always return success (prevent enumeration)
    const message = "If an account exists, you'll receive a reset email shortly";

    if (!user) {
      // Add artificial delay
      await new Promise(resolve => setTimeout(resolve, 100));
      return NextResponse.json({ success: true, message });
    }

    // Generate token
    const token = generateResetToken();
    const hashedToken = await hashToken(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token
    await prisma.passwordResetToken.create({
      data: {
        token: hashedToken,
        userId: user.id,
        expiresAt,
      },
    });

    // Send email (don't await)
    sendPasswordResetEmail({
      to: user.email,
      name: user.name || 'User',
      token,
    }).catch(err => console.error('Email error:', err));

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 2. GET /api/auth/validate-reset-token
**File:** `src/app/api/auth/validate-reset-token/route.ts`

```typescript
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');
    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Token missing' },
        { status: 400 }
      );
    }

    const hashedToken = await hashToken(token);

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: hashedToken },
    });

    if (!resetToken) {
      return NextResponse.json(
        { valid: false, error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    if (resetToken.used) {
      return NextResponse.json(
        { valid: false, error: 'This reset link has already been used' },
        { status: 400 }
      );
    }

    if (new Date() > resetToken.expiresAt) {
      return NextResponse.json(
        { valid: false, error: 'This reset link has expired' },
        { status: 400 }
      );
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error('Token validation error:', error);
    return NextResponse.json(
      { valid: false, error: 'Validation failed' },
      { status: 500 }
    );
  }
}
```

### 3. POST /api/auth/reset-password
**File:** `src/app/api/auth/reset-password/route.ts`

```typescript
import bcrypt from 'bcryptjs';

const schema = z.object({
  token: z.string(),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password } = schema.parse(body);

    const hashedToken = await hashToken(token);

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: hashedToken },
      include: { user: true },
    });

    if (!resetToken || resetToken.used || new Date() > resetToken.expiresAt) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update password and mark token used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: {
          password: hashedPassword,
          lastPasswordChange: new Date(),
        },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: {
          used: true,
          usedAt: new Date(),
        },
      }),
    ]);

    // Send confirmation email
    sendPasswordChangedEmail({
      to: resetToken.user.email,
      name: resetToken.user.name || 'User',
    }).catch(console.error);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}
```

## Email Service

### Email Service Layer
**File:** `src/lib/email/index.ts`

```typescript
import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';
import { renderTemplate } from './templates';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  template: string;
  data: Record<string, any>;
  type: string;
}

async function sendEmail({ to, subject, template, data, type }: SendEmailOptions) {
  try {
    const html = await renderTemplate(template, data);

    const { data: result, error } = await resend.emails.send({
      from: `${process.env.RESEND_FROM_NAME} <${process.env.RESEND_FROM_EMAIL}>`,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      replyTo: process.env.RESEND_REPLY_TO,
    });

    if (error) throw error;

    // Log success
    await prisma.emailLog.create({
      data: {
        to: Array.isArray(to) ? to.join(',') : to,
        subject,
        type,
        status: 'sent',
        resendId: result?.id,
      },
    });

    return { success: true, id: result?.id };
  } catch (error) {
    console.error('Email send error:', error);

    // Log failure
    await prisma.emailLog.create({
      data: {
        to: Array.isArray(to) ? to.join(',') : to,
        subject,
        type,
        status: 'failed',
        error: error.message,
      },
    });

    throw error;
  }
}

export async function sendPasswordResetEmail({
  to,
  name,
  token,
}: {
  to: string;
  name: string;
  token: string;
}) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`;

  return sendEmail({
    to,
    subject: 'Reset Your JobFinders Password',
    template: 'password-reset',
    data: { name, resetUrl, expiresIn: '1 hour' },
    type: 'password_reset',
  });
}

export async function sendPasswordChangedEmail({
  to,
  name,
}: {
  to: string;
  name: string;
}) {
  return sendEmail({
    to,
    subject: 'Your JobFinders Password Was Changed',
    template: 'password-changed',
    data: { name },
    type: 'password_changed',
  });
}

// ... other email functions
```

### Token Utilities
**File:** `src/lib/auth/tokens.ts`

```typescript
import crypto from 'crypto';
import { createHash } from 'crypto';

export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function hashToken(token: string): Promise<string> {
  return createHash('sha256').update(token).digest('hex');
}
```

### Rate Limiting
**File:** `src/lib/rate-limit.ts`

```typescript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.REDIS_URL!,
  token: process.env.REDIS_TOKEN!,
});

export const rateLimit = {
  async check(
    identifier: string,
    action: string,
    limit: number,
    window: number
  ): Promise<{ success: boolean; remaining: number }> {
    const key = `rate-limit:${action}:${identifier}`;
    const count = await redis.incr(key);

    if (count === 1) {
      await redis.expire(key, window);
    }

    return {
      success: count <= limit,
      remaining: Math.max(0, limit - count),
    };
  },
};
```

## Database Migration

**File:** `prisma/migrations/XXX_add_password_reset/migration.sql`

```sql
-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "resendId" TEXT,
    "error" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_token_idx" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");

-- CreateIndex
CREATE INDEX "EmailLog_to_idx" ON "EmailLog"("to");

-- CreateIndex
CREATE INDEX "EmailLog_type_idx" ON "EmailLog"("type");

-- CreateIndex
CREATE INDEX "EmailLog_status_idx" ON "EmailLog"("status");

-- CreateIndex
CREATE INDEX "EmailLog_createdAt_idx" ON "EmailLog"("createdAt");

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add to User table
ALTER TABLE "User" ADD COLUMN "lastPasswordChange" TIMESTAMP(3);
```

## Testing Strategy

### Unit Tests
```typescript
// __tests__/lib/auth/tokens.test.ts
describe('Token utilities', () => {
  test('generates unique tokens', () => {
    const token1 = generateResetToken();
    const token2 = generateResetToken();
    expect(token1).not.toBe(token2);
    expect(token1).toHaveLength(64); // 32 bytes = 64 hex chars
  });

  test('hashes tokens consistently', async () => {
    const token = 'test-token';
    const hash1 = await hashToken(token);
    const hash2 = await hashToken(token);
    expect(hash1).toBe(hash2);
  });
});
```

---

## .kiro/specs/forgot-password-resend/tasks.md

```markdown
# Tasks: Forgot Password & Resend Email Integration

## Prerequisites
- [ ] Resend account created
- [ ] Resend API key obtained
- [ ] Redis configured for rate limiting
- [ ] Environment variables set

## Phase 1: Foundation Setup

### Task 1.1: Database Schema & Migration
- [ ] Update Prisma schema with PasswordResetToken model
- [ ] Update Prisma schema with EmailLog model
- [ ] Add lastPasswordChange to User model
- [ ] Generate migration: `npx prisma migrate dev --name add_password_reset`
- [ ] Apply migration to database
- [ ] Verify tables created with indexes

**File:** `prisma/schema.prisma`
**Estimated Time:** 1 hour
**Dependencies:** None
**Acceptance Criteria:**
- [x] Models added to schema
- [x] Migration generated and applied
- [x] All indexes created
- [x] No migration errors

### Task 1.2: Install Dependencies
- [ ] Install Resend SDK: `npm install resend`
- [ ] Install handlebars: `npm install handlebars`
- [ ] Install @types/handlebars: `npm install -D @types/handlebars`
- [ ] Verify dependencies in package.json

**Estimated Time:** 15 minutes
**Dependencies:** None
**Acceptance Criteria:**
- [x] All packages installed
- [x] No version conflicts
- [x] TypeScript types available

### Task 1.3: Environment Configuration
- [ ] Add RESEND_API_KEY to .env
- [ ] Add RESEND_FROM_EMAIL to .env
- [ ] Add RESEND_FROM_NAME to .env
- [ ] Add RESEND_REPLY_TO to .env
- [ ] Update .env.example with new variables
- [ ] Document in README

**File:** `.env`, `.env.example`
**Estimated Time:** 30 minutes
**Dependencies:** Task 1.2
**Acceptance Criteria:**
- [x] All environment variables set
- [x] Example file updated
- [x] Documentation updated

## Phase 2: Core Utilities

### Task 2.1: Token Generation & Hashing
- [ ] Create `src/lib/auth/tokens.ts`
- [ ] Implement `generateResetToken()` function
- [ ] Implement `hashToken()` function
- [ ] Write unit tests
- [ ] Verify cryptographic security

**File:** `src/lib/auth/tokens.ts`
**Estimated Time:** 2 hours
**Dependencies:** None
**Acceptance Criteria:**
- [x] Functions implemented
- [x] Unit tests pass (100% coverage)
- [x] Tokens are 64 characters (hex)
- [x] Hashing is deterministic

### Task 2.2: Rate Limiting Service
- [ ] Create `src/lib/rate-limit.ts`
- [ ] Implement Redis-based rate limiting
- [ ] Add sliding window algorithm
- [ ] Write unit tests
- [ ] Test with Redis

**File:** `src/lib/rate-limit.ts`
**Estimated Time:** 3 hours
**Dependencies:** Redis setup
**Acceptance Criteria:**
- [x] Rate limiting functional
- [x] Works with Redis
- [x] Properly expires keys
- [x] Returns remaining count
- [x] Tests pass

### Task 2.3: Email Service Core
- [ ] Create `src/lib/email/index.ts`
- [ ] Implement Resend client initialization
- [ ] Implement `sendEmail()` base function
- [ ] Add email logging to database
- [ ] Implement retry logic with exponential backoff
- [ ] Add error handling

**File:** `src/lib/email/index.ts`
**Estimated Time:** 4 hours
**Dependencies:** Task 1.2, 1.3
**Acceptance Criteria:**
- [x] Emails send successfully
- [x] Logging works
- [x] Retry logic functional
- [x] Errors handled gracefully
- [x] Integration test passes

## Phase 3: Email Templates

### Task 3.1: Template Rendering System
- [ ] Create `src/lib/email/templates/index.ts`
- [ ] Implement Handlebars template loader
- [ ] Add template caching
- [ ] Create base email layout template

**File:** `src/lib/email/templates/index.ts`
**Estimated Time:** 2 hours
**Dependencies:** Task 1.2
**Acceptance Criteria:**
- [x] Templates load correctly
- [x] Caching works
- [x] Base layout created

### Task 3.2: Password Reset Email Template
- [ ] Create `src/lib/email/templates/password-reset.hbs`
- [ ] Design mobile-responsive HTML
- [ ] Add JobFinders branding
- [ ] Include reset button with URL
- [ ] Add expiry notice
- [ ] Add security advisory
- [ ] Test rendering with sample data

**File:** `src/lib/email/templates/password-reset.hbs`
**Estimated Time:** 3 hours
**Dependencies:** Task 3.1
**Acceptance Criteria:**
- [x] Template renders correctly
- [x] Mobile responsive
- [x] All variables interpolated
- [x] CTA button prominent
- [x] Professional appearance

### Task 3.3: Password Changed Email Template
- [ ] Create `src/lib/email/templates/password-changed.hbs`
- [ ] Design confirmation email
- [ ] Include security notice
- [ ] Add contact support link
- [ ] Test rendering

**File:** `src/lib/email/templates/password-changed.hbs`
**Estimated Time:** 2 hours
**Dependencies:** Task 3.1
**Acceptance Criteria:**
- [x] Template renders correctly
- [x] Clear confirmation message
- [x] Security information included

### Task 3.4: Email Service Functions
- [ ] Implement `sendPasswordResetEmail()` in `src/lib/email/index.ts`
- [ ] Implement `sendPasswordChangedEmail()`
- [ ] Add type definitions for all email functions
- [ ] Write integration tests

**File:** `src/lib/email/index.ts`
**Estimated Time:** 2 hours
**Dependencies:** Task 3.2, 3.3
**Acceptance Criteria:**
- [x] Functions work end-to-end
- [x] Emails delivered
- [x] Logging captures events
- [x] Tests pass

## Phase 4: API Routes

### Task 4.1: Forgot Password API
- [ ] Create `src/app/api/auth/forgot-password/route.ts`
- [ ] Implement POST handler
- [ ] Add input validation (Zod)
- [ ] Add rate limiting
- [ ] Implement email enumeration prevention
- [ ] Generate and store token
- [ ] Send reset email
- [ ] Write API tests

**File:** `src/app/api/auth/forgot-password/route.ts`
**Estimated Time:** 4 hours
**Dependencies:** Task 2.1, 2.2, 2.3
**Acceptance Criteria:**
- [x] API route functional
- [x] Rate limiting enforced
- [x] No email enumeration
- [x] Token stored in database
- [x] Email sent
- [x] Tests pass (unit + integration)

### Task 4.2: Validate Reset Token API
- [ ] Create `src/app/api/auth/validate-reset-token/route.ts`
- [ ] Implement GET handler
- [ ] Validate token exists
- [ ] Check expiry
- [ ] Check if already used
- [ ] Return appropriate errors
- [ ] Write tests

**File:** `src/app/api/auth/validate-reset-token/route.ts`
**Estimated Time:** 2 hours
**Dependencies:** Task 2.1
**Acceptance Criteria:**
- [x] Validation logic correct
- [x] All edge cases handled
- [x] Clear error messages
- [x] Tests pass

### Task 4.3: Reset Password Execution API
- [ ] Create `src/app/api/auth/reset-password/route.ts`
- [ ] Implement POST handler
- [ ] Validate token
- [ ] Validate new password (Zod schema)
- [ ] Hash password with bcrypt
- [ ] Update password in transaction
- [ ] Mark token as used
- [ ] Send confirmation email
- [ ] Write tests

**File:** `src/app/api/auth/reset-password/route.ts`
**Estimated Time:** 4 hours
**Dependencies:** Task 4.2, Task 2.3
**Acceptance Criteria:**
- [x] Password updates successfully
- [x] Transaction safety maintained
- [x] Token invalidated
- [x] Confirmation email sent
- [x] Tests pass

## Phase 5: UI Components

### Task 5.1: ForgotPasswordDialog Component
- [ ] Create `src/components/auth/ForgotPasswordDialog.tsx`
- [ ] Implement dialog with shadcn/ui
- [ ] Add email input with validation
- [ ] Implement form submission with React Hook Form
- [ ] Add loading states
- [ ] Add success/error toast notifications
- [ ] Write component tests

**File:** `src/components/auth/ForgotPasswordDialog.tsx`
**Estimated Time:** 3 hours
**Dependencies:** Task 4.1
**Acceptance Criteria:**
- [x] Component renders
- [x] Form validation works
- [x] API integration functional
- [x] Loading states visible
- [x] Toast notifications work
- [x] Accessible (WCAG AA)

### Task 5.2: PasswordStrengthIndicator Component
- [ ] Create `src/components/auth/PasswordStrengthIndicator.tsx`
- [ ] Implement strength calculation algorithm
- [ ] Create visual indicator (progress bars)
- [ ] Add strength labels (Weak/Fair/Good/Strong)
- [ ] Add color coding
- [ ] Write tests

**File:** `src/components/auth/PasswordStrengthIndicator.tsx`
**Estimated Time:** 2 hours
**Dependencies:** None
**Acceptance Criteria:**
- [x] Accurate strength calculation
- [x] Visual indicator clear
- [x] Real-time updates
- [x] Tests pass

### Task 5.3: ResetPasswordForm Component
- [ ] Create `src/components/auth/ResetPasswordForm.tsx`
- [ ] Implement token validation query
- [ ] Create password input fields
- [ ] Integrate PasswordStrengthIndicator
- [ ] Add show/hide password toggle
- [ ] Add confirm password validation
- [ ] Implement form submission
- [ ] Handle errors (expired/invalid token)
- [ ] Write tests

**File:** `src/components/auth/ResetPasswordForm.tsx`
**Estimated Time:** 4 hours
**Dependencies:** Task 4.2, 4.3, 5.2
**Acceptance Criteria:**
- [x] Token validation works
- [x] Form validation complete
- [x] Password strength shown
- [x] Submission successful
- [x] Error handling robust
- [x] Tests pass

### Task 5.4: Reset Password Page
- [ ] Create `src/app/auth/reset-password/page.tsx`
- [ ] Implement page layout
- [ ] Extract token from URL params
- [ ] Integrate ResetPasswordForm
- [ ] Add error states (missing token, invalid token)
- [ ] Add success redirect to login
- [ ] Write E2E test

**File:** `src/app/auth/reset-password/page.tsx`
**Estimated Time:** 2 hours
**Dependencies:** Task 5.3
**Acceptance Criteria:**
- [x] Page renders correctly
- [x] Token extracted from URL
- [x] Form integration works
- [x] Redirects after success
- [x] E2E test passes

## Phase 6: Integration with Existing Features

### Task 6.1: Update Login Page
- [ ] Open `src/app/auth/login/page.tsx`
- [ ] Add "Forgot Password?" link below password field
- [ ] Import and add ForgotPasswordDialog
- [ ] Add state management for dialog
- [ ] Test integration
- [ ] Ensure no breaking changes

**File:** `src/app/auth/login/page.tsx`
**Estimated Time:** 1 hour
**Dependencies:** Task 5.1
**Acceptance Criteria:**
- [x] Link visible on login page
- [x] Dialog opens on click
- [x] Existing login flow unaffected
- [x] Visual consistency maintained

### Task 6.2: NextAuth Integration Test
- [ ] Test password reset with NextAuth credential provider
- [ ] Verify user can login after reset
- [ ] Ensure session management works
- [ ] Test role preservation
- [ ] Document any issues

**Estimated Time:** 2 hours
**Dependencies:** Task 6.1, Phase 4 complete
**Acceptance Criteria:**
- [x] Reset password works with NextAuth
- [x] Login successful after reset
- [x] User data intact
- [x] No session issues

## Phase 7: Additional Email Templates

### Task 7.1: Welcome Email Template
- [ ] Create `src/lib/email/templates/welcome.hbs`
- [ ] Implement `sendWelcomeEmail()` function
- [ ] Integrate with user registration flow
- [ ] Test email delivery

**Estimated Time:** 2 hours
**Acceptance Criteria:**
- [x] Template created
- [x] Function implemented
- [x] Integration complete

### Task 7.2: Job Application Email Templates
- [ ] Create application confirmation template
- [ ] Create application status update template
- [ ] Implement corresponding functions
- [ ] Integrate with application flow

**Estimated Time:** 3 hours
**Acceptance Criteria:**
- [x] Templates created
- [x] Functions implemented
- [x] Integration complete

### Task 7.3: Employer Notification Templates
- [ ] Create new application received template
- [ ] Create job posting approved template
- [ ] Implement functions
- [ ] Integrate with employer workflows

**Estimated Time:** 3 hours
**Acceptance Criteria:**
- [x] Templates created
- [x] Functions implemented
- [x] Integration complete

## Phase 8: Testing & Quality Assurance

### Task 8.1: Comprehensive Unit Testing
- [ ] Achieve 90%+ test coverage for all new code
- [ ] Test token generation and validation
- [ ] Test email service functions
- [ ] Test API route handlers
- [ ] Test React components

**Estimated Time:** 6 hours
**Dependencies:** All implementation tasks
**Acceptance Criteria:**
- [x] Coverage > 90%
- [x] All tests pass
- [x] Edge cases covered

### Task 8.2: Integration Testing
- [ ] Test complete forgot password flow
- [ ] Test email delivery end-to-end
- [ ] Test rate limiting
- [ ] Test database transactions
- [ ] Test error scenarios

**Estimated Time:** 4 hours
**Dependencies:** Phase 1-6 complete
**Acceptance Criteria:**
- [x] All integration tests pass
- [x] No race conditions
- [x] Error handling works

### Task 8.3: Security Testing
- [ ] Test email enumeration prevention
- [ ] Test rate limiting bypass attempts
- [ ] Test token reuse prevention
- [ ] Test expired token handling
- [ ] Test CSRF protection
- [ ] Run security scanner (bandit, eslint-security)

**Estimated Time:** 3 hours
**Dependencies:** All implementation complete
**Acceptance Criteria:**
- [x] No security vulnerabilities found
- [x] All security tests pass
- [x] Scanner reports clean

### Task 8.4: E2E Testing
- [ ] Write Playwright/Cypress test for full user journey
- [ ] Test forgot password request
- [ ] Test email link click
- [ ] Test password reset form
- [ ] Test login with new password
- [ ] Test error scenarios

**Estimated Time:** 4 hours
**Dependencies:** Phase 1-6 complete
**Acceptance Criteria:**
- [x] E2E tests pass
- [x] Full flow works
- [x] No UI bugs

## Phase 9: Documentation & Deployment

### Task 9.1: API Documentation
- [ ] Document forgot password API endpoint
- [ ] Document validate token endpoint
- [ ] Document reset password endpoint
- [ ] Add examples and error codes
- [ ] Update Swagger/OpenAPI spec (if exists)

**Estimated Time:** 2 hours
**Acceptance Criteria:**
- [x] Complete API docs
- [x] Examples provided
- [x] Error codes documented

### Task 9.2: Code Documentation
- [ ] Add JSDoc comments to all functions
- [ ] Document email service usage
- [ ] Create email template customization guide
- [ ] Document rate limiting configuration

**Estimated Time:** 2 hours
**Acceptance Criteria:**
- [x] All functions documented
- [x] Usage examples provided

### Task 9.3: User Documentation
- [ ] Create user guide for password reset
- [ ] Add FAQ section
- [ ] Document troubleshooting steps
- [ ] Add screenshots

**Estimated Time:** 2 hours
**Acceptance Criteria:**
- [x] User guide complete
- [x] Clear instructions
- [x] Visual aids included

### Task 9.4: Deployment Preparation
- [ ] Verify all environment variables in production
- [ ] Test Resend API key in production
- [ ] Configure DNS for email domain (SPF, DKIM, DMARC)
- [ ] Run database migration in staging
- [ ] Test complete flow in staging
- [ ] Create rollback plan

**Estimated Time:** 3 hours
**Acceptance Criteria:**
- [x] Environment configured
- [x] DNS records set
- [x] Staging tests pass
- [x] Rollback plan documented

### Task 9.5: Production Deployment
- [ ] Deploy code to production
- [ ] Run database migration
- [ ] Verify email delivery
- [ ] Monitor error logs
- [ ] Test forgot password flow
- [ ] Monitor email metrics

**Estimated Time:** 2 hours
**Dependencies:** All previous tasks
**Acceptance Criteria:**
- [x] Deployment successful
- [x] No errors in logs
- [x] Feature functional
- [x] Email delivery working

---

## Summary

**Total Tasks:** 42
**Total Estimated Time:** 85 hours
**Critical Path:** Phase 1 → Phase 2 → Phase 4 → Phase 5 → Phase 6
**Parallel Work Possible:** 
- Phase 3 (Templates) can start after Phase 2
- Phase 7 (Additional emails) can be done anytime after Phase 3

**Risk Areas:**
- Email delivery reliability (mitigation: Resend SLA)
- Rate limiting with Redis (mitigation: thorough testing)
- Token security (mitigation: crypto best practices)

**Milestones:**
1. Week 1: Foundation + Core Utilities (Phase 1-2)
2. Week 2: API Routes + Email Templates (Phase 3-4)
3. Week 3: UI Components + Integration (Phase 5-6)
4. Week 4: Additional Emails + Testing (Phase 7-8)
5. Week 5: Documentation + Deployment (Phase 9)
```

---

# Feature 2: Dashboard User Details Fix (Job Seeker)

## .kiro/specs/dashboard-user-details-fix/requirements.md

```markdown
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
  role: 'seeker' | 'employer' | 'admin';
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
```

## .kiro/specs/dashboard-user-details-fix/design.md

```markdown
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
    mockFetch('/api/user/me', { id: '1', name: '