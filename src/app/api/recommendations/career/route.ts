import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CareerPathRecommender } from '@/lib/recommendations/career-path-recommender'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const targetRoles = searchParams.get('targetRoles')?.split(',').map(s => s.trim()).filter(Boolean)
    const timeHorizon = searchParams.get('timeHorizon') as 'immediate' | '6months' | '1year' | '2years' | '5years' || '1year'
    const location = searchParams.get('location')
    const industry = searchParams.get('industry')
    const salaryGoal = searchParams.get('salaryGoal') ? parseInt(searchParams.get('salaryGoal')!) : undefined
    const workStyle = searchParams.get('workStyle') as 'remote' | 'hybrid' | 'onsite'
    const learningStyle = searchParams.get('learningStyle') as 'self-paced' | 'structured' | 'bootcamp' | 'mentorship'

    logger.info('Getting career path recommendations', {
      userId: session.user.id,
      targetRoles,
      timeHorizon,
      location,
      industry,
      salaryGoal,
      workStyle,
      learningStyle
    })

    const careerPathRecommender = new CareerPathRecommender()
    const recommendations = await careerPathRecommender.getCareerPathRecommendations({
      userId: session.user.id,
      targetRoles,
      timeHorizon,
      location,
      industry,
      salaryGoal,
      workStyle,
      learningStyle
    })

    return NextResponse.json({
      success: true,
      data: recommendations,
      count: recommendations.length,
      filters: {
        targetRoles,
        timeHorizon,
        location,
        industry,
        salaryGoal,
        workStyle,
        learningStyle
      }
    })
  } catch (error) {
    logger.error('Error getting career path recommendations', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: session?.user?.id
    })

    return NextResponse.json(
      { error: 'Failed to get career path recommendations' },
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

    logger.info('Processing career recommendation action', {
      userId: session.user.id,
      action,
      data
    })

    const careerPathRecommender = new CareerPathRecommender()

    switch (action) {
      case 'skill-gaps':
        const { targetRole } = data
        if (!targetRole) {
          return NextResponse.json(
            { error: 'Target role is required for skill gaps analysis' },
            { status: 400 }
          )
        }

        const skillGaps = await careerPathRecommender.getSkillGapRecommendations(
          session.user.id,
          targetRole
        )

        return NextResponse.json({
          success: true,
          data: skillGaps,
          targetRole
        })

      case 'progression':
        const progression = await careerPathRecommender.getCareerProgressionSuggestions(
          session.user.id
        )

        return NextResponse.json({
          success: true,
          data: progression
        })

      case 'track-progress':
        const { skillUpdates } = data
        if (!skillUpdates || !Array.isArray(skillUpdates)) {
          return NextResponse.json(
            { error: 'Skill updates array is required' },
            { status: 400 }
          )
        }

        const progress = await careerPathRecommender.trackSkillProgress(
          session.user.id,
          skillUpdates
        )

        return NextResponse.json({
          success: true,
          data: progress
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    logger.error('Error processing career recommendation action', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: session?.user?.id
    })

    return NextResponse.json(
      { error: 'Failed to process action' },
      { status: 500 }
    )
  }
}