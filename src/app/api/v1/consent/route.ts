import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ConsentManager, ConsentPreferences, ConsentType } from '@/lib/consent-manager'
import { rateLimit } from '@/lib/rate-limiter'
import { v4 as uuidv4 } from 'uuid'

/**
 * POST /api/v1/consent
 * Record user consent preferences
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 20 consent updates per hour per IP
    const rateLimitResult = await rateLimit(request, 'consent-update', 20, 3600)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    const session = await getServerSession(authOptions)
    const body = await request.json()
    
    const {
      preferences,
      source = 'consent_banner',
      sessionId: providedSessionId
    } = body as {
      preferences: Partial<ConsentPreferences>
      source?: string
      sessionId?: string
    }

    // Validate preferences
    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json(
        { error: 'Invalid consent preferences' },
        { status: 400 }
      )
    }

    // Get or generate session ID for anonymous users
    const sessionId = providedSessionId || uuidv4()
    
    // Get IP address and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Record consent preferences
    const consentRecords = await ConsentManager.recordConsentPreferences(
      preferences,
      {
        userId: session?.user?.id,
        sessionId: session?.user?.id ? undefined : sessionId,
        ipAddress,
        userAgent,
        source,
      }
    )

    // Get updated consent status
    const identifier = session?.user?.id 
      ? { userId: session.user.id }
      : { sessionId }
    
    const updatedPreferences = await ConsentManager.getConsentStatus(identifier)

    return NextResponse.json({
      success: true,
      message: 'Consent preferences updated successfully',
      sessionId: session?.user?.id ? undefined : sessionId,
      preferences: updatedPreferences,
      recordsCreated: consentRecords.length,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Consent recording error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/v1/consent
 * Get current consent preferences
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    // Determine identifier
    let identifier: { userId: string } | { sessionId: string }
    
    if (session?.user?.id) {
      identifier = { userId: session.user.id }
    } else if (sessionId) {
      identifier = { sessionId }
    } else {
      return NextResponse.json(
        { error: 'User session or session ID required' },
        { status: 400 }
      )
    }

    // Get consent preferences
    const preferences = await ConsentManager.getConsentStatus(identifier)
    const needsRefresh = await ConsentManager.needsConsentRefresh(identifier)

    return NextResponse.json({
      preferences,
      needsRefresh,
      consentVersion: '1.0.0',
      lastUpdated: null, // Would need to be fetched from consent history
      isAuthenticated: !!session?.user?.id,
    })

  } catch (error) {
    console.error('Consent retrieval error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/v1/consent/[consentType]
 * Update specific consent type
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { consentType: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    const { granted, sessionId } = body

    if (typeof granted !== 'boolean') {
      return NextResponse.json(
        { error: 'Granted must be a boolean value' },
        { status: 400 }
      )
    }

    // Validate consent type
    const validConsentTypes: ConsentType[] = [
      'ESSENTIAL_COOKIES',
      'ANALYTICS_COOKIES',
      'MARKETING_COOKIES',
      'FUNCTIONAL_COOKIES',
      'EMAIL_MARKETING',
      'SMS_MARKETING',
      'DATA_PROCESSING',
      'PROFILE_SHARING',
      'JOB_RECOMMENDATIONS',
      'THIRD_PARTY_INTEGRATIONS',
    ]

    const consentType = params.consentType.toUpperCase() as ConsentType
    if (!validConsentTypes.includes(consentType)) {
      return NextResponse.json(
        { error: 'Invalid consent type' },
        { status: 400 }
      )
    }

    // Essential cookies cannot be disabled
    if (consentType === 'ESSENTIAL_COOKIES' && !granted) {
      return NextResponse.json(
        { error: 'Essential cookies cannot be disabled' },
        { status: 400 }
      )
    }

    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Record consent
    await ConsentManager.recordConsent(consentType, granted, {
      userId: session?.user?.id,
      sessionId: session?.user?.id ? undefined : sessionId,
      ipAddress,
      userAgent,
      metadata: {
        source: 'api_update',
        specificUpdate: true,
      }
    })

    return NextResponse.json({
      success: true,
      message: `${consentType} consent ${granted ? 'granted' : 'revoked'} successfully`,
      consentType,
      granted,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Specific consent update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}