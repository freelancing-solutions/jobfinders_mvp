import { NextRequest } from 'next/server'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

const jobSchema = z.object({
  title: z.string().min(10),
  company: z.string().min(2),
  location: z.string().min(2),
  positionType: z.enum(['full-time', 'part-time', 'contract', 'internship']),
  remotePolicy: z.enum(['remote', 'hybrid', 'onsite']),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'lead', 'executive']),
  salaryMin: z.string(),
  salaryMax: z.string(),
  currency: z.string(),
  description: z.string().min(100),
  requirements: z.string().min(50),
  benefits: z.string(),
  applicationDeadline: z.string(),
  companyDescription: z.string(),
  applicationUrl: z.string().url().optional(),
  companyLogo: z.string().url().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Authentication required' 
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (session.user.role !== 'EMPLOYER' && session.user.role !== 'ADMIN') {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Only employers can post jobs' 
      }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const body = await req.json()
    const validatedData = jobSchema.parse(body)

    const salaryMin = parseInt(validatedData.salaryMin)
    const salaryMax = parseInt(validatedData.salaryMax)

    if (salaryMin > salaryMax) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Minimum salary cannot be greater than maximum salary'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const job = await prisma.job.create({
      data: {
        ...validatedData,
        salaryMin,
        salaryMax,
        employerId: session.user.id,
        status: 'ACTIVE',
        postedAt: new Date(),
        applicationDeadline: new Date(validatedData.applicationDeadline),
      },
    })

    // Optionally add to search index or trigger other integrations here

    return new Response(JSON.stringify({
      success: true,
      data: job
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({
        success: false,
        error: error.issues
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    console.error('Job posting error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to post job'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
