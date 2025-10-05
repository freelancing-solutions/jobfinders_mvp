import { NextRequest } from 'next/server'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ATSSystem } from '@/services/ats-system'
import { ResumeBuilder } from '@/services/resume-builder'

const prisma = new PrismaClient()

const applicationSchema = z.object({
  jobId: z.string(),
  coverLetter: z.string().optional(),
  resumeUrl: z.string().url(),
  useAIEnhancement: z.boolean().optional(),
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

    const body = await req.json()
    const validatedData = applicationSchema.parse(body)

    // Check if job exists and is still accepting applications
    const job = await prisma.job.findUnique({
      where: { id: validatedData.jobId },
      include: {
        employer: true,
      },
    })

    if (!job) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Job not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (job.status !== 'ACTIVE') {
      return new Response(JSON.stringify({
        success: false,
        error: 'This job is no longer accepting applications'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (new Date(job.applicationDeadline) < new Date()) {
      return new Response(JSON.stringify({
        success: false,
        error: 'The application deadline has passed'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Check if user has already applied
    const existingApplication = await prisma.jobApplication.findFirst({
      where: {
        jobId: validatedData.jobId,
        applicantId: session.user.id
      }
    })

    if (existingApplication) {
      return new Response(JSON.stringify({
        success: false,
        error: 'You have already applied for this job'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    let enhancedResumeUrl = validatedData.resumeUrl
    let matchScore = 0
    let aiSuggestions: string[] | null = null

    // If AI enhancement is requested, process the resume
    if (validatedData.useAIEnhancement) {
      try {
        const enhancer = new ResumeBuilder()
        enhancedResumeUrl = await enhancer.enhance({
          resumeUrl: validatedData.resumeUrl,
          jobDescription: job.description,
          requirements: job.requirements
        })

        // Analyze resume match score
        const atsSystem = new ATSSystem()
        const atsResult = await atsSystem.analyzeResumeMatch({
          resumeUrl: enhancedResumeUrl,
          jobDescription: job.description,
          requirements: job.requirements
        })

        matchScore = atsResult.score
        aiSuggestions = atsResult.suggestions
      } catch (error) {
        console.error('AI processing error:', error)
        // Continue with original resume if AI enhancement fails
      }
    }

    // Create the application
    const application = await prisma.jobApplication.create({
      data: {
        jobId: validatedData.jobId,
        applicantId: session.user.id,
        resumeUrl: enhancedResumeUrl,
        coverLetter: validatedData.coverLetter,
        status: 'PENDING',
        matchScore,
        aiSuggestions,
      },
    })

    // Send notification to employer
    await prisma.notification.create({
      data: {
        userId: job.employerId,
        type: 'NEW_APPLICATION',
        title: 'New Job Application',
        message: `You have a new application for ${job.title}`,
        metadata: {
          jobId: job.id,
          applicationId: application.id,
        },
      },
    })

    return new Response(JSON.stringify({
      success: true,
      data: {
        application,
        matchScore,
        aiSuggestions,
      }
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

    console.error('Application submission error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to submit application'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
