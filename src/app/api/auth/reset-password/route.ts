import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { verifyToken, isTokenExpired } from '@/lib/auth/reset-token'
import { sendPasswordChangedEmail } from '@/lib/email/service'
import bcrypt from 'bcryptjs'

const schema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
      'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
})

export async function POST(req: NextRequest) {
  try {
    // Parse and validate request body
    const body = await req.json()
    const { token, password } = schema.parse(body)

    // Find the reset token in database
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        used: false,
      },
      include: {
        user: {
          select: {
            uid: true,
            email: true,
            name: true,
            passwordHash: true,
          }
        }
      }
    })

    if (!resetToken) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid or expired reset token' 
        },
        { status: 400 }
      )
    }

    // Verify the token matches
    const isValidToken = await verifyToken(token, resetToken.token)
    if (!isValidToken) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid or expired reset token' 
        },
        { status: 400 }
      )
    }

    // Check if token has expired
    if (isTokenExpired(resetToken.expiresAt)) {
      // Mark token as used
      await prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { 
          used: true,
          usedAt: new Date()
        }
      })

      return NextResponse.json(
        { 
          success: false, 
          error: 'Reset token has expired. Please request a new password reset.' 
        },
        { status: 400 }
      )
    }

    // Check if new password is different from current password
    if (resetToken.user.passwordHash) {
      const isSamePassword = await bcrypt.compare(password, resetToken.user.passwordHash)
      if (isSamePassword) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'New password must be different from your current password' 
          },
          { status: 400 }
        )
      }
    }

    // Hash the new password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Update user's password and mark token as used
    await prisma.$transaction([
      // Update user password
      prisma.user.update({
        where: { uid: resetToken.userId },
        data: { 
          passwordHash: hashedPassword,
          updatedAt: new Date()
        }
      }),
      // Mark token as used
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { 
          used: true,
          usedAt: new Date()
        }
      }),
      // Invalidate all other unused tokens for this user
      prisma.passwordResetToken.updateMany({
        where: {
          userId: resetToken.userId,
          used: false,
          id: { not: resetToken.id }
        },
        data: {
          used: true,
          usedAt: new Date()
        }
      })
    ])

    // Send password changed confirmation email (async, don't wait)
    sendPasswordChangedEmail({
      to: resetToken.user.email,
      name: resetToken.user.name || 'there',
    }).catch((error) => {
      console.error('Failed to send password changed email:', error)
      // In production, you might want to log this to a monitoring service
    })

    return NextResponse.json({
      success: true,
      message: 'Password has been successfully reset. You can now sign in with your new password.',
    })

  } catch (error) {
    console.error('Reset password error:', error)

    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      return NextResponse.json(
        { 
          success: false, 
          error: firstError.message 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'An unexpected error occurred. Please try again.' 
      },
      { status: 500 }
    )
  }
}