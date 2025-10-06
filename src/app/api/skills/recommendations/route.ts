import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId') || session.user.id
    const skillId = searchParams.get('skillId')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get user's verification history
    const verificationService = new SkillVerificationService({
      verificationMethods: {
        automatic: true,
        manual: false,
        peer: false,
        thirdParty: false
      }
    })

    const verificationResults = await verificationService.getVerificationResults(userId)

    // Filter by skill if specified
    let filteredResults = verificationResults
    if (skillId) {
      filteredResults = verificationResults.filter(result => result.skillId === skillId)
    }

    // Get top performing skills
    const skillScores = new Map<string, {
      total: number
      totalScore: number
      averageScore: number
    }>()

    filteredResults.forEach(result => {
      const current = skillScores.get(result.skillId) || { total: 0, totalScore: 0, averageScore: 0 }
      skillScores.set(result.skillId, {
        total: current.total + 1,
        totalScore: current.totalScore + result.score,
        averageScore: (current.totalScore + result.score) / (current.total + 1)
      })
    })

    const topSkills = Array.from(skillScores.entries())
      .sort((a, b) => b[1].averageScore - a[1].averageScore)
      .slice(0, limit)
      .map(([skillId, scores]) => ({
        skillId,
        totalVerifications: scores.total,
        averageScore: scores.averageScore,
        masteryLevel: this.determineMasteryLevel(scores.averageScore)
      }))

    // Get platform recommendations
    const recommendations = await verificationService.getVerificationRecommendations(userId, skillId)

    return NextResponse.json({
      success: true,
      data: {
        recommendations,
        topSkills,
        totalSkills: skillScores.size,
        filteredResults: filteredResults.length,
        summary: {
          totalVerifications: filteredResults.length,
          averageScore: filteredResults.length > 0
            ? filteredResults.reduce((sum, r) => sum + r.score, 0) / filteredResults.length
            : 0,
          passingRate: filteredResults.length > 0
            ? filteredResults.filter(r => r.status === 'passed').length / filteredResults.length
            : 0
        }
      }
    })

  } catch (error) {
      logger.error('Error getting skill recommendations', { error })
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { skillId, learningGoals, currentLevel, preferredPlatforms } = body

    if (!skillId) {
      return NextResponse.json(
        { error: 'skillId is required' },
        { status: 400 }
      )
    }

    // Initialize skill verification service
    const verificationService = new SkillVerificationService({
      verificationMethods: {
        automatic: true,
        manual: false,
        peer: false,
        thirdParty: false
      }
    })

    const recommendations = await verificationService.getVerificationRecommendations(
      session.user.id,
      skillId
    )

    // Customize recommendations based on user preferences
    if (learningGoals) {
      recommendations = this.customizeRecommendations(
        recommendations,
        learningGoals,
        currentLevel,
        preferredPlatforms
      )
    }

    return NextResponse({
      success: true,
      data: {
        recommendations
      }
    })

  } catch (error) {
      logger.error('Error generating skill recommendations', { error })
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

// Helper function to determine mastery level
function determineMasteryLevel(averageScore: number): string {
  if (averageScore >= 90) return 'expert'
  if (averageScore >= 75) return 'advanced'
  if (averageScore >= 60) return 'intermediate'
  return 'beginner'
}

// Helper function to customize recommendations
function customizeRecommendations(
  recommendations: any[],
  learningGoals: string[],
  currentLevel?: string,
  preferredPlatforms?: string[]
): any[] {
  let customized = [...recommendations]

  // Filter by preferred platforms
  if (preferredPlatforms && preferredPlatforms.length > 0) {
    customized = customized.map(rec => ({
      ...rec,
      recommendedPlatforms: rec.recommendedPlatforms.filter(platform =>
        preferredPlatforms.includes(platform.platformId)
      )
    }))
  }

  // Adjust based on learning goals
  if (learningGoals && learningGoals.length > 0) {
    learningGoals.forEach(goal => {
      if (goal.toLowerCase().includes('advanced')) {
        customized = customized.map(rec => ({
          ...rec,
          recommendedLevel: 'advanced',
          actionPlan: rec.actionPlan?.map(plan => ({
            ...plan,
            action: plan.action.replace('Intermediate', 'Advanced')
          }))
        }))
      }
    })
  }

  // Adjust based on current level
    if (currentLevel) {
      customized = customized.map(rec => ({
        ...rec,
        recommendedLevel: this.adjustRecommendedLevel(rec.recommendedLevel, currentLevel)
      }))
    }

    return customized
}

export default {}