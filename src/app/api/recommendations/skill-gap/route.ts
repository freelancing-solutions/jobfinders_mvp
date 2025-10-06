import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SkillGapAnalyzer } from '@/services/matching/skill-gap-analyzer'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const targetRole = searchParams.get('targetRole')
    const currentRole = searchParams.get('currentRole')
    const experienceLevel = searchParams.get('experienceLevel') as 'entry' | 'mid' | 'senior' | 'expert'
    const location = searchParams.get('location')
    const industry = searchParams.get('industry')
    const salaryGoal = searchParams.get('salaryGoal') ? parseInt(searchParams.get('salaryGoal')!) : undefined
    const timeHorizon = searchParams.get('timeHorizon') as '3months' | '6months' | '1year' | '2years'
    const learningStyle = searchParams.get('learningStyle') as 'visual' | 'auditory' | 'kinesthetic' | 'reading'
    const budgetMin = searchParams.get('budgetMin') ? parseInt(searchParams.get('budgetMin')!) : undefined
    const budgetMax = searchParams.get('budgetMax') ? parseInt(searchParams.get('budgetMax')!) : undefined

    if (!targetRole) {
      return NextResponse.json(
        { error: 'Target role is required' },
        { status: 400 }
      )
    }

    logger.info('Getting skill gap analysis', {
      userId: session.user.id,
      targetRole,
      currentRole,
      experienceLevel,
      location,
      industry,
      salaryGoal,
      timeHorizon,
      learningStyle,
      hasBudget: !!(budgetMin || budgetMax)
    })

    const skillGapAnalyzer = new SkillGapAnalyzer()
    const analysis = await skillGapAnalyzer.analyzeSkillGaps({
      userId: session.user.id,
      targetRole,
      currentRole,
      experienceLevel,
      location,
      industry,
      salaryGoal,
      timeHorizon,
      learningStyle,
      budget: budgetMin && budgetMax ? {
        min: budgetMin,
        max: budgetMax,
        currency: 'USD'
      } : undefined
    })

    return NextResponse.json({
      success: true,
      data: analysis,
      filters: {
        targetRole,
        currentRole,
        experienceLevel,
        location,
        industry,
        salaryGoal,
        timeHorizon,
        learningStyle,
        budget: budgetMin && budgetMax ? {
          min: budgetMin,
          max: budgetMax,
          currency: 'USD'
        } : undefined
      }
    })
  } catch (error) {
    logger.error('Error getting skill gap analysis', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: session?.user?.id
    })

    return NextResponse.json(
      { error: 'Failed to get skill gap analysis' },
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
    const { action, data } = body

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      )
    }

    logger.info('Processing skill gap analysis action', {
      userId: session.user.id,
      action,
      data
    })

    const skillGapAnalyzer = new SkillGapAnalyzer()

    switch (action) {
      case 'compare-roles':
        const { targetRoles, options } = data
        if (!targetRoles || !Array.isArray(targetRoles) || targetRoles.length < 2) {
          return NextResponse.json(
            { error: 'At least 2 target roles are required for comparison' },
            { status: 400 }
          )
        }

        const comparison = await skillGapAnalyzer.compareSkillGapsAcrossRoles(
          session.user.id,
          targetRoles,
          options
        )

        return NextResponse.json({
          success: true,
          data: comparison
        })

      case 'track-progress':
        const { skillUpdates } = data
        if (!skillUpdates || !Array.isArray(skillUpdates)) {
          return NextResponse.json(
            { error: 'Skill updates array is required' },
            { status: 400 }
          )
        }

        const progress = await skillGapAnalyzer.trackSkillProgress(
          session.user.id,
          skillUpdates
        )

        return NextResponse.json({
          success: true,
          data: progress
        })

      case 'learning-path':
        const { targetRole, preferences } = data
        if (!targetRole) {
          return NextResponse.json(
            { error: 'Target role is required for learning path' },
            { status: 400 }
          )
        }

        const learningPath = await skillGapAnalyzer.getPersonalizedLearningPath(
          session.user.id,
          targetRole,
          preferences
        )

        return NextResponse.json({
          success: true,
          data: learningPath,
          targetRole
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    logger.error('Error processing skill gap analysis action', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: session?.user?.id
    })

    return NextResponse.json(
      { error: 'Failed to process action' },
      { status: 500 }
    )
  }
}