import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limiter'
import { verifyAuth } from '@/lib/auth'
import { 
  securityContactManager, 
  ContactType, 
  ContactPriority, 
  ContactAvailability,
  NotificationMethod,
  SecurityContact 
} from '@/lib/security-contacts'

// Rate limiting configurations
const contactsRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many contact requests from this IP'
})

const testContactRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Limit contact testing to prevent spam
  message: 'Too many contact test requests from this IP'
})

/**
 * GET /api/v1/security/contacts
 * Retrieve security contacts with filtering options
 */
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await contactsRateLimit(request)
    if (rateLimitResult) {
      return rateLimitResult
    }

    // Verify authentication and authorization
    const authResult = await verifyAuth(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user has admin or security role
    if (!authResult.user.roles?.includes('admin') && 
        !authResult.user.roles?.includes('security') &&
        !authResult.user.permissions?.includes('view_security_contacts')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as ContactType | null
    const priority = searchParams.get('priority') as ContactPriority | null
    const availability = searchParams.get('availability') as ContactAvailability | null
    const active = searchParams.get('active')
    const emergencyOnly = searchParams.get('emergencyOnly')

    // Get all contacts
    let contacts = Array.from(securityContactManager['contacts'].values())

    // Apply filters
    if (type) {
      contacts = contacts.filter(contact => contact.type === type)
    }

    if (priority) {
      contacts = contacts.filter(contact => contact.priority === priority)
    }

    if (availability) {
      contacts = contacts.filter(contact => contact.availability === availability)
    }

    if (active !== null) {
      const isActive = active === 'true'
      contacts = contacts.filter(contact => contact.isActive === isActive)
    }

    if (emergencyOnly !== null) {
      const isEmergencyOnly = emergencyOnly === 'true'
      contacts = contacts.filter(contact => contact.emergencyOnly === isEmergencyOnly)
    }

    // Sort contacts by priority and name
    contacts.sort((a, b) => {
      const priorityOrder = {
        [ContactPriority.PRIMARY]: 0,
        [ContactPriority.SECONDARY]: 1,
        [ContactPriority.ESCALATION]: 2,
        [ContactPriority.EMERGENCY]: 3
      }
      
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (priorityDiff !== 0) return priorityDiff
      
      return a.name.localeCompare(b.name)
    })

    // Remove sensitive information for non-admin users
    if (!authResult.user.roles?.includes('admin')) {
      contacts = contacts.map(contact => ({
        ...contact,
        contactMethods: contact.contactMethods.map(method => ({
          ...method,
          value: method.value.replace(/(.{2}).*(.{2})/, '$1***$2') // Mask contact values
        }))
      }))
    }

    return NextResponse.json({
      success: true,
      data: {
        contacts,
        total: contacts.length,
        filters: {
          type,
          priority,
          availability,
          active: active === 'true',
          emergencyOnly: emergencyOnly === 'true'
        }
      }
    })

  } catch (error) {
    console.error('Error retrieving security contacts:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve security contacts' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/v1/security/contacts
 * Create a new security contact or perform contact operations
 */
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await contactsRateLimit(request)
    if (rateLimitResult) {
      return rateLimitResult
    }

    // Verify authentication and authorization
    const authResult = await verifyAuth(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user has admin role for contact management
    if (!authResult.user.roles?.includes('admin') && 
        !authResult.user.permissions?.includes('manage_security_contacts')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action, ...data } = body

    switch (action) {
      case 'create':
        return await handleCreateContact(data, authResult.user.id)
      
      case 'test':
        return await handleTestContact(data, request)
      
      case 'notify':
        return await handleNotifyContact(data, authResult.user.id)
      
      case 'bulk_notify':
        return await handleBulkNotify(data, authResult.user.id)
      
      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Error in security contacts POST:', error)
    return NextResponse.json(
      { error: 'Failed to process contact request' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/v1/security/contacts
 * Update security contact information
 */
export async function PUT(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await contactsRateLimit(request)
    if (rateLimitResult) {
      return rateLimitResult
    }

    // Verify authentication and authorization
    const authResult = await verifyAuth(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user has admin role
    if (!authResult.user.roles?.includes('admin') && 
        !authResult.user.permissions?.includes('manage_security_contacts')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { contactId, updates } = body

    if (!contactId) {
      return NextResponse.json(
        { error: 'Contact ID is required' },
        { status: 400 }
      )
    }

    // Validate updates
    const allowedUpdates = [
      'name', 'title', 'organization', 'type', 'priority', 'availability',
      'contactMethods', 'specialties', 'languages', 'timezone', 'isActive',
      'responseTimeMinutes', 'notes', 'emergencyOnly'
    ]

    const invalidUpdates = Object.keys(updates).filter(key => 
      !allowedUpdates.includes(key)
    )

    if (invalidUpdates.length > 0) {
      return NextResponse.json(
        { error: `Invalid update fields: ${invalidUpdates.join(', ')}` },
        { status: 400 }
      )
    }

    await securityContactManager.updateContact(contactId, updates, authResult.user.id)

    return NextResponse.json({
      success: true,
      message: 'Contact updated successfully',
      data: { contactId }
    })

  } catch (error) {
    console.error('Error updating security contact:', error)
    
    if (error instanceof Error && error.message === 'Contact not found') {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update contact' },
      { status: 500 }
    )
  }
}

/**
 * Handle creating a new contact
 */
async function handleCreateContact(data: any, userId: string) {
  // Validate required fields
  const requiredFields = ['name', 'title', 'organization', 'type', 'priority', 'availability', 'contactMethods']
  const missingFields = requiredFields.filter(field => !data[field])

  if (missingFields.length > 0) {
    return NextResponse.json(
      { error: `Missing required fields: ${missingFields.join(', ')}` },
      { status: 400 }
    )
  }

  // Validate contact methods
  if (!Array.isArray(data.contactMethods) || data.contactMethods.length === 0) {
    return NextResponse.json(
      { error: 'At least one contact method is required' },
      { status: 400 }
    )
  }

  // Validate that at least one contact method is primary
  const hasPrimaryMethod = data.contactMethods.some((method: any) => method.isPrimary)
  if (!hasPrimaryMethod) {
    return NextResponse.json(
      { error: 'At least one contact method must be marked as primary' },
      { status: 400 }
    )
  }

  // Set defaults
  const contactData = {
    ...data,
    specialties: data.specialties || [],
    languages: data.languages || ['English'],
    timezone: data.timezone || 'Africa/Johannesburg',
    emergencyOnly: data.emergencyOnly || false,
    contactMethods: data.contactMethods.map((method: any) => ({
      ...method,
      isVerified: method.isVerified || false,
      failureCount: 0,
      maxRetries: method.maxRetries || 3
    }))
  }

  const contact = await securityContactManager.addContact(contactData)

  return NextResponse.json({
    success: true,
    message: 'Contact created successfully',
    data: { contact }
  })
}

/**
 * Handle testing a contact
 */
async function handleTestContact(data: any, request: NextRequest) {
  // Apply additional rate limiting for testing
  const testRateLimitResult = await testContactRateLimit(request)
  if (testRateLimitResult) {
    return testRateLimitResult
  }

  const { contactId, method } = data

  if (!contactId) {
    return NextResponse.json(
      { error: 'Contact ID is required' },
      { status: 400 }
    )
  }

  try {
    const success = await securityContactManager.testContact(contactId, method)

    return NextResponse.json({
      success: true,
      message: success ? 'Contact test successful' : 'Contact test failed',
      data: { 
        contactId, 
        method: method || 'primary',
        testResult: success 
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Contact test failed' },
      { status: 400 }
    )
  }
}

/**
 * Handle notifying a single contact
 */
async function handleNotifyContact(data: any, userId: string) {
  const { contactId, message, priority, preferredMethods } = data

  if (!contactId || !message) {
    return NextResponse.json(
      { error: 'Contact ID and message are required' },
      { status: 400 }
    )
  }

  try {
    const attempts = await securityContactManager.notifyContact(
      contactId,
      message,
      priority || 'medium',
      preferredMethods
    )

    const successful = attempts.some(attempt => attempt.success)

    return NextResponse.json({
      success: true,
      message: successful ? 'Notification sent successfully' : 'Notification failed',
      data: {
        contactId,
        attempts: attempts.length,
        successful,
        details: attempts
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Notification failed' },
      { status: 400 }
    )
  }
}

/**
 * Handle bulk notification
 */
async function handleBulkNotify(data: any, userId: string) {
  const { contactIds, contactTypes, message, priority, preferredMethods } = data

  if (!message) {
    return NextResponse.json(
      { error: 'Message is required' },
      { status: 400 }
    )
  }

  let contacts: SecurityContact[] = []

  // Get contacts by IDs
  if (contactIds && Array.isArray(contactIds)) {
    for (const contactId of contactIds) {
      const contact = securityContactManager['contacts'].get(contactId)
      if (contact && contact.isActive) {
        contacts.push(contact)
      }
    }
  }

  // Get contacts by types
  if (contactTypes && Array.isArray(contactTypes)) {
    for (const contactType of contactTypes) {
      const typeContacts = securityContactManager.getContactsByType(contactType)
      contacts.push(...typeContacts)
    }
  }

  // Remove duplicates
  contacts = contacts.filter((contact, index, self) => 
    self.findIndex(c => c.id === contact.id) === index
  )

  if (contacts.length === 0) {
    return NextResponse.json(
      { error: 'No valid contacts found' },
      { status: 400 }
    )
  }

  const results = []

  for (const contact of contacts) {
    try {
      const attempts = await securityContactManager.notifyContact(
        contact.id,
        message,
        priority || 'medium',
        preferredMethods
      )

      results.push({
        contactId: contact.id,
        contactName: contact.name,
        attempts: attempts.length,
        successful: attempts.some(attempt => attempt.success)
      })
    } catch (error) {
      results.push({
        contactId: contact.id,
        contactName: contact.name,
        attempts: 0,
        successful: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  const successfulNotifications = results.filter(r => r.successful).length

  return NextResponse.json({
    success: true,
    message: `Bulk notification completed: ${successfulNotifications}/${results.length} successful`,
    data: {
      totalContacts: results.length,
      successful: successfulNotifications,
      failed: results.length - successfulNotifications,
      results
    }
  })
}