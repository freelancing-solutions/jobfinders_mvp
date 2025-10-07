import { Resend } from 'resend';
import { logger } from '../logger';
import { db } from '../db';
import { EmailTemplate, EmailStatus, EmailType } from '@prisma/client';
import { z } from 'zod';
import { rateLimit } from '../rate-limiter';
import { encrypt, decrypt } from '../encryption';
import { auditLogger } from '../audit-logger';
import { UserRole, RoleDisplayText, hasEmployerAccess } from '../../types/roles';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

export type EmailType = 
  | 'password_reset'
  | 'password_changed'
  | 'welcome'
  | 'email_verification'
  | 'job_application_confirmation'
  | 'job_application_status'
  | 'interview_invitation'
  | 'job_match_recommendation'
  | 'saved_job_reminder'
  | 'profile_completion_reminder'
  | 'new_application_received'
  | 'candidate_shortlist'
  | 'job_posting_approval'
  | 'subscription_renewal_reminder'
  | 'payment_receipt'
  | 'subscription_activation'
  | 'payment_failed'
  | 'subscription_cancellation'
  | 'invoice'
  | 'new_user_registration'
  | 'payment_failure'
  | 'system_health_alert';

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  type: EmailType;
  metadata?: Record<string, any>;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  type,
  metadata,
}: SendEmailParams) {
  try {
    const { data, error } = await resend.emails.send({
      from: `${process.env.RESEND_FROM_NAME || 'JobFinders'} <${process.env.RESEND_FROM_EMAIL || 'noreply@jobfinders.com'}>`,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      replyTo: process.env.RESEND_REPLY_TO || 'support@jobfinders.com',
    });

    if (error) {
      throw new Error(error.message);
    }

    // Log successful email
    await prisma.emailLog.create({
      data: {
        to: Array.isArray(to) ? to.join(',') : to,
        subject,
        type,
        status: 'sent',
        resendId: data?.id,
        metadata,
      },
    });

    return { success: true, id: data?.id };
  } catch (error) {
    console.error('Email send error:', error);

    // Log failed email
    try {
      await prisma.emailLog.create({
        data: {
          to: Array.isArray(to) ? to.join(',') : to,
          subject,
          type,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          metadata,
        },
      });
    } catch (logError) {
      console.error('Failed to log email error:', logError);
    }

    throw error;
  }
}

// Password Reset Email
export async function sendPasswordResetEmail({
  to,
  name,
  token,
}: {
  to: string;
  name: string;
  token: string;
}) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`;
  
  const html = generatePasswordResetTemplate({
    name,
    resetUrl,
    expiresIn: '1 hour',
  });

  return sendEmail({
    to,
    subject: 'Reset Your JobFinders Password',
    html,
    type: 'password_reset',
    metadata: { 
      userId: name,
      resetUrl,
    },
  });
}

// Password Changed Confirmation Email
export async function sendPasswordChangedEmail({
  to,
  name,
}: {
  to: string;
  name: string;
}) {
  const html = generatePasswordChangedTemplate({
    name,
  });

  return sendEmail({
    to,
    subject: 'Your JobFinders Password Was Changed',
    html,
    type: 'password_changed',
    metadata: { userId: name },
  });
}

// Welcome Email
export async function sendWelcomeEmail({
  to,
  name,
  role,
}: {
  to: string;
  name: string;
  role: string;
}) {
  const html = generateWelcomeTemplate({
    name,
    role,
    loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/login`,
  });

  return sendEmail({
    to,
    subject: 'Welcome to JobFinders!',
    html,
    type: 'welcome',
    metadata: { userId: name, role },
  });
}

// Job Application Confirmation
export async function sendJobApplicationConfirmationEmail({
  to,
  name,
  jobTitle,
  companyName,
}: {
  to: string;
  name: string;
  jobTitle: string;
  companyName: string;
}) {
  const html = generateJobApplicationConfirmationTemplate({
    name,
    jobTitle,
    companyName,
  });

  return sendEmail({
    to,
    subject: `Application Received: ${jobTitle} at ${companyName}`,
    html,
    type: 'job_application_confirmation',
    metadata: { userId: name, jobTitle, companyName },
  });
}

// Interview Invitation
export async function sendInterviewInvitationEmail({
  to,
  name,
  jobTitle,
  companyName,
  interviewDate,
  interviewTime,
  interviewType,
}: {
  to: string;
  name: string;
  jobTitle: string;
  companyName: string;
  interviewDate: string;
  interviewTime: string;
  interviewType: string;
}) {
  const html = generateInterviewInvitationTemplate({
    name,
    jobTitle,
    companyName,
    interviewDate,
    interviewTime,
    interviewType,
  });

  return sendEmail({
    to,
    subject: `Interview Invitation: ${jobTitle} at ${companyName}`,
    html,
    type: 'interview_invitation',
    metadata: { 
      userId: name, 
      jobTitle, 
      companyName,
      interviewDate,
      interviewTime,
      interviewType,
    },
  });
}

// New Application Received (Employer)
export async function sendNewApplicationReceivedEmail({
  to,
  name,
  candidateName,
  jobTitle,
  applicationCount,
}: {
  to: string;
  name: string;
  candidateName: string;
  jobTitle: string;
  applicationCount: number;
}) {
  const html = generateNewApplicationReceivedTemplate({
    name,
    candidateName,
    jobTitle,
    applicationCount,
  });

  return sendEmail({
    to,
    subject: `New Application Received: ${candidateName} for ${jobTitle}`,
    html,
    type: 'new_application_received',
    metadata: { 
      employerName: name,
      candidateName,
      jobTitle,
      applicationCount,
    },
  });
}

// Email Template Generators
function generatePasswordResetTemplate({
  name,
  resetUrl,
  expiresIn,
}: {
  name: string;
  resetUrl: string;
  expiresIn: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your JobFinders Password</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; border-bottom: 1px solid #eee; }
    .logo { font-size: 24px; font-weight: bold; color: #1f2937; text-decoration: none; }
    .content { padding: 30px 0; }
    .button { display: inline-block; background: #1f2937; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px 0; border-top: 1px solid #eee; font-size: 14px; color: #666; }
    .security-note { background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" class="logo">JobFinders</a>
    </div>
    
    <div class="content">
      <h2>Reset Your Password</h2>
      
      <p>Hi ${name || 'there'},</p>
      
      <p>We received a request to reset your JobFinders password. Click the button below to create a new password:</p>
      
      <div style="text-align: center;">
        <a href="${resetUrl}" class="button">Reset Password</a>
      </div>
      
      <p>Or copy and paste this link in your browser:</p>
      <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px;">${resetUrl}</p>
      
      <div class="security-note">
        <strong>Security Notice:</strong> This link will expire in ${expiresIn}. If you didn't request this password reset, you can safely ignore this email.
      </div>
      
      <p>If you have any trouble, contact our support team at support@jobfinders.com</p>
    </div>
    
    <div class="footer">
      <p>&copy; 2024 JobFinders. All rights reserved.</p>
      <p>JobFinders, South Africa's Premier Job Platform</p>
    </div>
  </div>
</body>
</html>
  `;
}

function generatePasswordChangedTemplate({
  name,
}: {
  name: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Changed Successfully</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; border-bottom: 1px solid #eee; }
    .logo { font-size: 24px; font-weight: bold; color: #1f2937; text-decoration: none; }
    .content { padding: 30px 0; }
    .success-box { background: #d1fae5; padding: 20px; border-radius: 6px; margin: 20px 0; text-align: center; }
    .footer { text-align: center; padding: 20px 0; border-top: 1px solid #eee; font-size: 14px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" class="logo">JobFinders</a>
    </div>
    
    <div class="content">
      <h2>Password Changed Successfully</h2>
      
      <p>Hi ${name || 'there'},</p>
      
      <div class="success-box">
        <h3>✅ Password Updated</h3>
        <p>Your JobFinders password has been successfully changed.</p>
      </div>
      
      <p>If you didn't make this change, please contact our support team immediately at support@jobfinders.com</p>
      
      <p>You can now log in with your new password:</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/login" style="color: #1f2937; font-weight: bold;">Log In to JobFinders</a></p>
    </div>
    
    <div class="footer">
      <p>&copy; 2024 JobFinders. All rights reserved.</p>
      <p>JobFinders, South Africa's Premier Job Platform</p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateWelcomeTemplate({
  name,
  role,
  loginUrl,
}: {
  name: string;
  role: UserRole | string;
  loginUrl: string;
}) {
  // Use proper role display text mapping instead of ternary operator
  const roleText = typeof role === 'string' 
    ? (role === 'EMPLOYER' ? RoleDisplayText[UserRole.EMPLOYER] : RoleDisplayText[UserRole.JOB_SEEKER])
    : RoleDisplayText[role as UserRole] || 'user';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to JobFinders</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; border-bottom: 1px solid #eee; }
    .logo { font-size: 24px; font-weight: bold; color: #1f2937; text-decoration: none; }
    .content { padding: 30px 0; }
    .button { display: inline-block; background: #1f2937; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .welcome-box { background: #fef3c7; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px 0; border-top: 1px solid #eee; font-size: 14px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" class="logo">JobFinders</a>
    </div>
    
    <div class="content">
      <h2>Welcome to JobFinders! 🎉</h2>
      
      <p>Hi ${name || 'there'},</p>
      
      <div class="welcome-box">
        <h3>Welcome to South Africa's Premier Job Platform!</h3>
        <p>Your account has been successfully created as a ${roleText}.</p>
      </div>
      
      <p>You're now ready to:</p>
      <ul>
        ${hasEmployerAccess(role) ? `
          <li>Post job openings and reach thousands of qualified candidates</li>
          <li>Manage applications and track candidate progress</li>
          <li>Build your company profile and attract top talent</li>
        ` : `
          <li>Browse thousands of job opportunities across South Africa</li>
          <li>Create a professional profile and upload your resume</li>
          <li>Apply to jobs with just one click</li>
          <li>Get AI-powered job recommendations</li>
        `}
      </ul>
      
      <div style="text-align: center;">
        <a href="${loginUrl}" class="button">Get Started</a>
      </div>
      
      <p>If you have any questions, our support team is here to help at support@jobfinders.com</p>
    </div>
    
    <div class="footer">
      <p>&copy; 2024 JobFinders. All rights reserved.</p>
      <p>JobFinders, South Africa's Premier Job Platform</p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateJobApplicationConfirmationTemplate({
  name,
  jobTitle,
  companyName,
}: {
  name: string;
  jobTitle: string;
  companyName: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Received</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; border-bottom: 1px solid #eee; }
    .logo { font-size: 24px; font-weight: bold; color: #1f2937; text-decoration: none; }
    .content { padding: 30px 0; }
    .success-box { background: #d1fae5; padding: 20px; border-radius: 6px; margin: 20px 0; text-align: center; }
    .footer { text-align: center; padding: 20px 0; border-top: 1px solid #eee; font-size: 14px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" class="logo">JobFinders</a>
    </div>
    
    <div class="content">
      <h2>Application Received! 🎯</h2>
      
      <p>Hi ${name || 'there'},</p>
      
      <div class="success-box">
        <h3>✅ Application Submitted Successfully</h3>
        <p>Your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been received.</p>
      </div>
      
      <p>What happens next?</p>
      <ul>
        <li>The hiring team will review your application</li>
        <li>You'll receive updates on your application status</li>
        <li>If selected, you'll be contacted for an interview</li>
      </ul>
      
      <p>You can track all your applications in your dashboard:</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/applications" style="color: #1f2937; font-weight: bold;">View My Applications</a></p>
      
      <p>Good luck with your application!</p>
    </div>
    
    <div class="footer">
      <p>&copy; 2024 JobFinders. All rights reserved.</p>
      <p>JobFinders, South Africa's Premier Job Platform</p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateInterviewInvitationTemplate({
  name,
  jobTitle,
  companyName,
  interviewDate,
  interviewTime,
  interviewType,
}: {
  name: string;
  jobTitle: string;
  companyName: string;
  interviewDate: string;
  interviewTime: string;
  interviewType: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interview Invitation</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; border-bottom: 1px solid #eee; }
    .logo { font-size: 24px; font-weight: bold; color: #1f2937; text-decoration: none; }
    .content { padding: 30px 0; }
    .interview-box { background: #dbeafe; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px 0; border-top: 1px solid #eee; font-size: 14px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" class="logo">JobFinders</a>
    </div>
    
    <div class="content">
      <h2>Interview Invitation! 🎉</h2>
      
      <p>Hi ${name || 'there'},</p>
      
      <p>Congratulations! ${companyName} would like to invite you for an interview for the <strong>${jobTitle}</strong> position.</p>
      
      <div class="interview-box">
        <h3>📅 Interview Details</h3>
        <p><strong>Date:</strong> ${interviewDate}</p>
        <p><strong>Time:</strong> ${interviewTime}</p>
        <p><strong>Type:</strong> ${interviewType}</p>
      </div>
      
      <p>Please confirm your availability and let us know if you need to reschedule.</p>
      
      <p>Interview preparation tips:</p>
      <ul>
        <li>Research the company and role</li>
        <li>Prepare examples of your relevant experience</li>
        <li>Have questions ready for the interviewer</li>
        <li>Test your technical setup if it's a virtual interview</li>
      </ul>
      
      <p>Good luck!</p>
    </div>
    
    <div class="footer">
      <p>&copy; 2024 JobFinders. All rights reserved.</p>
      <p>JobFinders, South Africa's Premier Job Platform</p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateNewApplicationReceivedTemplate({
  name,
  candidateName,
  jobTitle,
  applicationCount,
}: {
  name: string;
  candidateName: string;
  jobTitle: string;
  applicationCount: number;
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Application Received</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; border-bottom: 1px solid #eee; }
    .logo { font-size: 24px; font-weight: bold; color: #1f2937; text-decoration: none; }
    .content { padding: 30px 0; }
    .application-box { background: #fef3c7; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px 0; border-top: 1px solid #eee; font-size: 14px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" class="logo">JobFinders</a>
    </div>
    
    <div class="content">
      <h2>New Application Received 📋</h2>
      
      <p>Hi ${name || 'there'},</p>
      
      <div class="application-box">
        <h3>🎯 New Candidate Application</h3>
        <p><strong>Candidate:</strong> ${candidateName}</p>
        <p><strong>Position:</strong> ${jobTitle}</p>
        <p><strong>Total Applications:</strong> ${applicationCount}</p>
      </div>
      
      <p>A new candidate has applied for your job posting. You can review their application in your employer dashboard.</p>
      
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/employer/dashboard" style="color: #1f2937; font-weight: bold;">Review Applications</a></p>
      
      <p>Stay tuned for more great candidates!</p>
    </div>
    
    <div class="footer">
      <p>&copy; 2024 JobFinders. All rights reserved.</p>
      <p>JobFinders, South Africa's Premier Job Platform</p>
    </div>
  </div>
</body>
</html>
  `;
}