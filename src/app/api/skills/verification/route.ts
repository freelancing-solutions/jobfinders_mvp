import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { SkillVerificationService } from '@/services/matching/skill-verification'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      skillId,
      platformId,
      verificationMethod = 'automatic',
      assessmentConfig,
      candidateProfile
    } = body

    if (!skillId || !platformId) {
      return NextResponse.json(
        { error: 'skillId and platformId are required' },
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
      },
      verificationLevel: 'intermediate',
      retryConfig: {
        maxRetries: 3,
        retryDelay: 5000,
        backoffMultiplier: 2
      }
    })

    // Ensure platform exists
    const platform = verificationService.getPlatform(platformId)
    if (!platform) {
      return NextResponse.json(
        { error: `Platform not found: ${platformId}` },
        { status: 404 }
      )
    }

    // Initiate verification
    const verificationRequest = await verificationService.initiateVerification(
      session.user.id,
      skillId,
      platformId,
      verificationMethod,
      assessmentConfig,
      candidateProfile
    )

    return NextResponse.json({
      success: true,
      data: {
        verificationRequest
      }
    })

  } catch (error) {
    logger.error('Error initiating skill verification', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const skillId = searchParams.get('skillId')
    const platformId = searchParams.get('platformId')
    const id = searchParams.get('id')
    const filters = {
      dateRange: searchParams.get('dateRange') ? JSON.parse(searchParams.get('dateRange') as string) : undefined,
      status: searchParams.get('status')?.split(','),
      minScore: searchParams.get('minScore') ? parseInt(searchParams.get('minScore') as string) : undefined,
      maxScore: searchParams.get('maxScore') ? parseInt(searchParams.get('maxScore') as string) : undefined
    }

    // Initialize skill verification service
    const verificationService = new SkillVerificationService({
      verificationMethods: {
        automatic: true,
        manual: false,
        peer: false,
        thirdParty: false
      },
      verificationLevel: 'intermediate',
      retryConfig: {
        maxRetries: 3,
        retryDelay: 5000,
        backoffMultiplier: 2
      }
    })

    // If ID is provided, get specific verification result
    if (id) {
      const result = await verificationService.getVerificationResult(id)
      
      if (!result) {
        return NextResponse.json(
          { error: 'Verification result not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: result
      })
    }

    // Get verification results
    const results = await verificationService.getVerificationResults(
      userId,
      skillId,
      platformId,
      filters
    )

    return NextResponse.json({
      success: true,
      data: {
        results,
        total: results.length,
        filters
      }
    })

  } catch (error) {
    logger.error('Error getting verification results', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

    const requestId = params.id
    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 })
    }

    // Initialize skill verification service
    const verificationService = new SkillVerificationService({
      verificationMethods: {
        automatic: true,
        manual: false,
        peer: false,
        thirdParty: false
      },
      verificationLevel: 'intermediate',
      retryConfig: {
        maxRetries: 3,
        retryDelay: 5000,
        backoffMultiplier: 2
      }
    })

    // Get verification status
    const verificationStatus = await verificationService.getVerificationStatus(requestId)
    if (!verificationStatus) {
      return NextResponse.json(
        { error: 'Verification request not found' },
        { status: 404 }
      )
    }

    // Get full verification result
    const results = await verificationService.getVerificationResults(
      verificationStatus.userId,
      verificationStatus.skillId
    )

    const result = results.find(r => r.requestId === requestId)
    if (!result) {
      return NextResponse.json(
        { error: 'Verification result not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        result,
        request: verificationStatus,
        relatedResults: results.slice(0, 9) // Show up to 10 related results
      }
    })

  } catch (error) {
    logger.error('Error getting verification result', { error, requestId })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requestId = params.id
    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const { feedback, comments } = body

    // Initialize skill verification service
    const verificationService = new SkillVerificationService({
      verificationMethods: {
        automatic: true,
        manual: true,
        peer: false,
        thirdParty: false
      },
      verificationLevel: 'intermediate',
      retryConfig: {
        maxRetries: 3,
        retryDelay: 5000,
        backoffMultiplier: 2
      }
    })

    // Get verification result
    const results = await verificationService.getVerificationResults(
      session.user.id
    )

    const result = results.find(r => r.requestId === requestId)
    if (!result) {
      return NextResponse.json(
        { error: 'Verification result not found' },
        { status: 404 }
      )
    }

    // Update result with feedback
    if (feedback !== undefined) {
      // In a real implementation, you would update the database
      logger.info('Updating verification result with feedback', {
        requestId,
        feedback,
        comments
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        result,
        feedback,
        comments
      }
    })

  } catch (error) {
    logger.error('Error updating verification result', { error, requestId })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requestId = params.id
    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 })
    }

    // Initialize skill verification service
    const verificationService = new SkillVerificationService({
      verificationMethods: {
        automatic: true,
        manual: true,
        peer: false,
        thirdParty: false
      }
    })

    // Get verification request
    const verificationStatus = verificationService.getVerificationStatus(requestId)
    if (!verificationStatus) {
      return NextResponse.json(
        { error: 'Verification request not found' },
        { status: 404 }
      )
    }

    // Cancel verification
    const success = await verificationService.cancelVerification(verificationStatus.platformId)

    if (success) {
      logger.info('Verification cancelled successfully', { requestId })
      return NextResponse.json({
        success: true,
        message: 'Verification cancelled'
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to cancel verification' },
        { status: 500 }
      )
    }

  } catch (error) {
    logger.error('Error cancelling verification', { error, requestId })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}