import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CandidateRecommender } from '@/lib/recommendations/candidate-recommender'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    const limit = parseInt(searchParams.get('limit') || '20')
    const strategy = searchParams.get('strategy') || 'balanced'
    const filters = {
      experience: searchParams.get('experience') ? {
        min: searchParams.get('experienceMin') ? parseInt(searchParams.get('experienceMin')!) : undefined,
        max: searchParams.get('experienceMax') ? parseInt(searchParams.get('experienceMax')!) : undefined
      } : undefined,
      location: searchParams.get('location') ? {
        radius: searchParams.get('locationRadius') ? parseInt(searchParams.get('locationRadius')!) : undefined,
        remoteOnly: searchParams.get('remoteOnly') === 'true'
      } : undefined,
      salary: searchParams.get('salary') ? {
        min: searchParams.get('salaryMin') ? parseInt(searchParams.get('salaryMin')!) : undefined,
        max: searchParams.get('salaryMax') ? parseInt(searchParams.get('salaryMax')!) : undefined
      } : undefined,
      skills: searchParams.get('skills')?.split(',').map(s => s.trim()).filter(Boolean),
      education: searchParams.get('education') ? {
        level: searchParams.get('educationLevel'),
        field: searchParams.get('educationField')
      } : undefined
    }

    // Verify user is employer and owns the job
    const job = await prisma?.job.findUnique({
      where: { id: jobId },
      include: { company: true }
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    const employer = await prisma?.employer.findUnique({
      where: { userId: session.user.id }
    })

    if (!employer || job.companyId !== employer.companyId) {
      return NextResponse.json(
        { error: 'Unauthorized to view candidates for this job' },
        { status: 403 }
      )
    }

    logger.info('Getting candidate recommendations', {
      userId: session.user.id,
      jobId,
      limit,
      strategy,
      hasFilters: Object.keys(filters).some(key => filters[key as keyof typeof filters] !== undefined)
    })

    const candidateRecommender = new CandidateRecommender()
    const recommendations = await candidateRecommender.getCandidateRecommendations({
      jobId,
      employerId: session.user.id,
      limit,
      strategy: strategy as any,
      filters
    })

    return NextResponse.json({
      success: true,
      data: recommendations,
      count: recommendations.length,
      jobId,
      strategy,
      filters
    })
  } catch (error) {
    logger.error('Error getting candidate recommendations', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: session?.user?.id
    })

    return NextResponse.json(
      { error: 'Failed to get candidate recommendations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { candidateId, jobId, action, notes } = body

    if (!candidateId || !jobId || !action) {
      return NextResponse.json(
        { error: 'Candidate ID, job ID, and action are required' },
        { status: 400 }
      )
    }

    // Verify user is employer and owns the job
    const job = await prisma?.job.findUnique({
      where: { id: jobId },
      include: { company: true }
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    const employer = await prisma?.employer.findUnique({
      where: { userId: session.user.id }
    })

    if (!employer || job.companyId !== employer.companyId) {
      return NextResponse.json(
        { error: 'Unauthorized to perform this action' },
        { status: 403 }
      )
    }

    logger.info('Recording candidate recommendation action', {
      userId: session.user.id,
      candidateId,
      jobId,
      action,
      notes
    })

    // Record the action (e.g., shortlist, reject, interview)
    await prisma?.candidateAction.create({
      data: {
        employerId: session.user.id,
        candidateId,
        jobId,
        action,
        notes,
        timestamp: new Date()
      }
    })

    // Update recommendation algorithm feedback
    const candidateRecommender = new CandidateRecommender()
    await candidateRecommender.recordFeedback({
      userId: session.user.id,
      itemId: candidateId,
      itemType: 'candidate',
      action,
      context: { jobId },
      timestamp: new Date()
    })

    return NextResponse.json({
      success: true,
      message: 'Action recorded successfully'
    })
  } catch (error) {
    logger.error('Error recording candidate action', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: session?.user?.id
    })

    return NextResponse.json(
      { error: 'Failed to record action' },
      { status: 500 }
    )
  }
}