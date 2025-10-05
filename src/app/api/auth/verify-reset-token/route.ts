import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { verifyToken, isTokenExpired } from '@/lib/auth/reset-token'

const schema = z.object({
  token: z.string().min(1, 'Reset token is required'),
})

export async function POST(req: NextRequest) {
  try {
    // Parse and validate request body
    const body = await req.json()
    const { token } = schema.parse(body)

    // Find the reset token in database
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        used: false,
      },
      select: {
        id: true,
        token: true,
        expiresAt: true,
        userId: true,
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
      // Mark token as used since it's expired
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

    // Token is valid and not expired
    return NextResponse.json({
      success: true,
      message: 'Token is valid',
    })

  } catch (error) {
    console.error('Verify reset token error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid token format' 
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