import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { generateResetToken, sanitizeEmail, generateRateLimitKey } from '@/lib/auth/reset-token'
import { sendPasswordResetEmail } from '@/lib/email/service'
import { rateLimit } from '@/lib/rate-limiter'

const schema = z.object({
  email: z.string().email('Invalid email address'),
})

export async function POST(req: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = req.headers.get('x-forwarded-for') || 
               req.headers.get('x-real-ip') || 
               'unknown'

    // Rate limiting: 3 requests per hour per IP
    const rateLimitResult = await rateLimit(
      generateRateLimitKey(ip),
      3,
      60 * 60 // 1 hour in seconds
    )

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many requests. Please try again later.' 
        },
        { status: 429 }
      )
    }

    // Parse and validate request body
    const body = await req.json()
    const { email } = schema.parse(body)

    // Sanitize email
    const sanitizedEmail = sanitizeEmail(email)
    if (!sanitizedEmail) {
      // Always return success to prevent email enumeration
      await new Promise(resolve => setTimeout(resolve, 100))
      return NextResponse.json({
        success: true,
        message: "If an account exists, you'll receive a reset email shortly",
      })
    }

    // Find user (in try-catch to prevent timing attacks)
    const user = await prisma.user.findUnique({
      where: { email: sanitizedEmail },
    })

    // Always return success to prevent email enumeration
    if (!user) {
      // Still introduce artificial delay to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 100))
      return NextResponse.json({
        success: true,
        message: "If an account exists, you'll receive a reset email shortly",
      })
    }

    // Check if user has password (social login users might not)
    if (!user.passwordHash) {
      return NextResponse.json({
        success: true,
        message: "If an account exists, you'll receive a reset email shortly",
      })
    }

    // Generate secure reset token
    const { token: plainToken, hashedToken, expiresAt } = await generateResetToken()

    // Store token in database
    await prisma.passwordResetToken.create({
      data: {
        token: hashedToken,
        userId: user.uid,
        expiresAt,
      },
    })

    // Send email asynchronously (don't wait)
    sendPasswordResetEmail({
      to: user.email,
      name: user.name || 'there',
      token: plainToken,
    }).catch((error) => {
      console.error('Failed to send reset email:', error)
      // In production, you might want to log this to a monitoring service
    })

    return NextResponse.json({
      success: true,
      message: "If an account exists, you'll receive a reset email shortly",
    })

  } catch (error) {
    console.error('Forgot password error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid email address' 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}