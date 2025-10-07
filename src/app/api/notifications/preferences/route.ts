import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { logger } from '@/lib/logging/logger'
import { rateLimitMiddleware } from '@/middleware/rate-limit'
import { errorHandler } from '@/middleware/error-handler'

// Notification service configuration
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3001'

interface NotificationPreferences {
  channels: {
    email: boolean
    sms: boolean
    push: boolean
    inApp: boolean
  }
  types: {
    job_match: boolean
    application_update: boolean
    profile_view: boolean
    system: boolean
    marketing: boolean
  }
  quietHours: {
    enabled: boolean
    startTime: string // HH:mm format
    endTime: string   // HH:mm format
    timezone: string
  }
  frequency: {
    digest: 'immediate' | 'hourly' | 'daily' | 'weekly'
    maxPerDay: number
  }
}

/**
 * GET /api/notifications/preferences - Get user notification preferences
 */
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimitMiddleware(request, 'api')
    if (rateLimitResponse) return rateLimitResponse

    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Fetch preferences from notification service
    const response = await fetch(`${NOTIFICATION_SERVICE_URL}/api/notifications/preferences/${session.user.id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NOTIFICATION_SERVICE_API_KEY}`,
      },
    })

    if (!response.ok) {
      // If preferences don't exist yet, return defaults
      if (response.status === 404) {
        const defaultPreferences: NotificationPreferences = {
          channels: {
            email: true,
            sms: false,
            push: true,
            inApp: true,
          },
          types: {
            job_match: true,
            application_update: true,
            profile_view: false,
            system: true,
            marketing: false,
          },
          quietHours: {
            enabled: false,
            startTime: '22:00',
            endTime: '08:00',
            timezone: 'UTC',
          },
          frequency: {
            digest: 'immediate',
            maxPerDay: 50,
          },
        }

        return NextResponse.json({
          success: true,
          data: defaultPreferences,
        })
      }
      throw new Error(`Notification service error: ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      data: data.preferences,
    })

  } catch (error) {
    return errorHandler(error, request, 'notification-preferences-get')
  }
}

/**
 * PUT /api/notifications/preferences - Update user notification preferences
 */
export async function PUT(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimitMiddleware(request, 'api')
    if (rateLimitResponse) return rateLimitResponse

    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const preferences: NotificationPreferences = await request.json()

    // Validate preferences structure
    const validationResult = validatePreferences(preferences)
    if (!validationResult.valid) {
      return NextResponse.json(
        { error: 'Invalid preferences', details: validationResult.errors },
        { status: 400 }
      )
    }

    // Update preferences in notification service
    const response = await fetch(`${NOTIFICATION_SERVICE_URL}/api/notifications/preferences/${session.user.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NOTIFICATION_SERVICE_API_KEY}`,
      },
      body: JSON.stringify({
        preferences,
        updatedAt: new Date().toISOString(),
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Notification service error: ${errorData.error || response.status}`)
    }

    const data = await response.json()

    logger.info('Notification preferences updated successfully', {
      userId: session.user.id,
      preferences: preferences,
    })

    return NextResponse.json({
      success: true,
      data: data.preferences,
      message: 'Preferences updated successfully',
    })

  } catch (error) {
    return errorHandler(error, request, 'notification-preferences-update')
  }
}

/**
 * POST /api/notifications/preferences - Reset preferences to defaults
 */
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimitMiddleware(request, 'api')
    if (rateLimitResponse) return rateLimitResponse

    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { resetType } = body

    if (resetType && !['all', 'channels', 'types', 'quietHours', 'frequency'].includes(resetType)) {
      return NextResponse.json(
        { error: 'Invalid resetType. Must be one of: all, channels, types, quietHours, frequency' },
        { status: 400 }
      )
    }

    // Get current preferences first (or defaults if none exist)
    const getResponse = await fetch(`${NOTIFICATION_SERVICE_URL}/api/notifications/preferences/${session.user.id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NOTIFICATION_SERVICE_API_KEY}`,
      },
    })

    let currentPreferences: NotificationPreferences

    if (getResponse.ok) {
      const data = await getResponse.json()
      currentPreferences = data.preferences
    } else {
      // Use defaults
      currentPreferences = {
        channels: {
          email: true,
          sms: false,
          push: true,
          inApp: true,
        },
        types: {
          job_match: true,
          application_update: true,
          profile_view: false,
          system: true,
          marketing: false,
        },
        quietHours: {
          enabled: false,
          startTime: '22:00',
          endTime: '08:00',
          timezone: 'UTC',
        },
        frequency: {
          digest: 'immediate',
          maxPerDay: 50,
        },
      }
    }

    // Reset specified preferences to defaults
    const defaultPreferences = getDefaultPreferences()

    if (!resetType || resetType === 'all') {
      currentPreferences = defaultPreferences
    } else if (resetType === 'channels') {
      currentPreferences.channels = defaultPreferences.channels
    } else if (resetType === 'types') {
      currentPreferences.types = defaultPreferences.types
    } else if (resetType === 'quietHours') {
      currentPreferences.quietHours = defaultPreferences.quietHours
    } else if (resetType === 'frequency') {
      currentPreferences.frequency = defaultPreferences.frequency
    }

    // Update preferences with reset values
    const updateResponse = await fetch(`${NOTIFICATION_SERVICE_URL}/api/notifications/preferences/${session.user.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NOTIFICATION_SERVICE_API_KEY}`,
      },
      body: JSON.stringify({
        preferences: currentPreferences,
        updatedAt: new Date().toISOString(),
      }),
    })

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json().catch(() => ({}))
      throw new Error(`Notification service error: ${errorData.error || updateResponse.status}`)
    }

    const data = await updateResponse.json()

    logger.info('Notification preferences reset successfully', {
      userId: session.user.id,
      resetType: resetType || 'all',
    })

    return NextResponse.json({
      success: true,
      data: data.preferences,
      message: `Preferences reset successfully (${resetType || 'all'})`,
    })

  } catch (error) {
    return errorHandler(error, request, 'notification-preferences-reset')
  }
}

/**
 * Validate notification preferences structure
 */
function validatePreferences(preferences: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Validate channels
  if (!preferences.channels || typeof preferences.channels !== 'object') {
    errors.push('channels object is required')
  } else {
    const requiredChannels = ['email', 'sms', 'push', 'inApp']
    for (const channel of requiredChannels) {
      if (typeof preferences.channels[channel] !== 'boolean') {
        errors.push(`channels.${channel} must be a boolean`)
      }
    }
  }

  // Validate types
  if (!preferences.types || typeof preferences.types !== 'object') {
    errors.push('types object is required')
  } else {
    const requiredTypes = ['job_match', 'application_update', 'profile_view', 'system', 'marketing']
    for (const type of requiredTypes) {
      if (typeof preferences.types[type] !== 'boolean') {
        errors.push(`types.${type} must be a boolean`)
      }
    }
  }

  // Validate quietHours
  if (!preferences.quietHours || typeof preferences.quietHours !== 'object') {
    errors.push('quietHours object is required')
  } else {
    if (typeof preferences.quietHours.enabled !== 'boolean') {
      errors.push('quietHours.enabled must be a boolean')
    }
    if (typeof preferences.quietHours.startTime !== 'string' || !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(preferences.quietHours.startTime)) {
      errors.push('quietHours.startTime must be a valid time in HH:mm format')
    }
    if (typeof preferences.quietHours.endTime !== 'string' || !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(preferences.quietHours.endTime)) {
      errors.push('quietHours.endTime must be a valid time in HH:mm format')
    }
    if (typeof preferences.quietHours.timezone !== 'string') {
      errors.push('quietHours.timezone must be a string')
    }
  }

  // Validate frequency
  if (!preferences.frequency || typeof preferences.frequency !== 'object') {
    errors.push('frequency object is required')
  } else {
    if (!['immediate', 'hourly', 'daily', 'weekly'].includes(preferences.frequency.digest)) {
      errors.push('frequency.digest must be one of: immediate, hourly, daily, weekly')
    }
    if (typeof preferences.frequency.maxPerDay !== 'number' || preferences.frequency.maxPerDay < 1 || preferences.frequency.maxPerDay > 1000) {
      errors.push('frequency.maxPerDay must be a number between 1 and 1000')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Get default notification preferences
 */
function getDefaultPreferences(): NotificationPreferences {
  return {
    channels: {
      email: true,
      sms: false,
      push: true,
      inApp: true,
    },
    types: {
      job_match: true,
      application_update: true,
      profile_view: false,
      system: true,
      marketing: false,
    },
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00',
      timezone: 'UTC',
    },
    frequency: {
      digest: 'immediate',
      maxPerDay: 50,
    },
  }
}