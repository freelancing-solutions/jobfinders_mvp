import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { z } from 'zod'

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['seeker', 'employer'], {
    errorMap: () => ({ message: 'Role must be either seeker or employer' })
  })
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = registerSchema.parse(body)
    
    const { name, email, password, role } = validatedData

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await db.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        role,
        isActive: true
      }
    })

    // Create profile based on role
    if (role === 'SEEKER') {
      await db.jobSeekerProfile.create({
        data: {
          userUid: user.uid,
          currency: 'ZAR'
        }
      })
    } else if (role === 'EMPLOYER') {
      // Create a default company for employers
      const company = await db.company.create({
        data: {
          name: `${name}'s Company`,
          verificationStatus: 'pending'
        }
      })

      await db.employerProfile.create({
        data: {
          userUid: user.uid,
          companyId: company.companyId,
          fullName: name,
          jobTitle: 'Human Resource'
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      data: {
        userId: user.uid,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })

  } catch (error) {
    console.error('Registration error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create account' },
      { status: 500 }
    )
  }
}