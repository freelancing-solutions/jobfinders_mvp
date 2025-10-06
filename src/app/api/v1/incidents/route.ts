import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { verifyAuth } from '@/lib/auth'
import { 
  incidentResponseManager, 
  IncidentType, 
  IncidentSeverity, 
  IncidentStatus,
  reportDataBreach,
  reportSecurityBreach,
  reportUnauthorizedAccess
} from '@/lib/incident-response'

// Rate limiting for incident endpoints
const incidentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50 // limit each IP to 50 requests per windowMs
})

/**
 * POST /api/v1/incidents - Report a new security incident
 */
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await incidentLimiter(request)
    if (rateLimitResult) {
      return rateLimitResult
    }

    // Verify authentication
    const authResult = await verifyAuth(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      type,
      severity,
      title,
      description,
      affectedSystems = [],
      affectedUsers = [],
      useQuickReport = false
    } = body

    // Validate required fields
    if (!type || !severity || !title || !description) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          required: ['type', 'severity', 'title', 'description']
        },
        { status: 400 }
      )
    }

    // Validate incident type
    if (!Object.values(IncidentType).includes(type)) {
      return NextResponse.json(
        { 
          error: 'Invalid incident type',
          validTypes: Object.values(IncidentType)
        },
        { status: 400 }
      )
    }

    // Validate severity
    if (!Object.values(IncidentSeverity).includes(severity)) {
      return NextResponse.json(
        { 
          error: 'Invalid incident severity',
          validSeverities: Object.values(IncidentSeverity)
        },
        { status: 400 }
      )
    }

    let incident

    // Use quick report functions for common incident types
    if (useQuickReport) {
      switch (type) {
        case IncidentType.DATA_BREACH:
          incident = await reportDataBreach(
            description,
            affectedUsers,
            authResult.user.id,
            severity
          )
          break
        case IncidentType.SECURITY_BREACH:
          incident = await reportSecurityBreach(
            description,
            affectedSystems,
            authResult.user.id,
            severity
          )
          break
        case IncidentType.UNAUTHORIZED_ACCESS:
          incident = await reportUnauthorizedAccess(
            description,
            affectedUsers[0] || 'unknown',
            authResult.user.id,
            severity
          )
          break
        default:
          // Fall back to general incident reporting
          incident = await incidentResponseManager.reportIncident(
            type,
            severity,
            title,
            description,
            authResult.user.id,
            affectedSystems,
            affectedUsers
          )
      }
    } else {
      // General incident reporting
      incident = await incidentResponseManager.reportIncident(
        type,
        severity,
        title,
        description,
        authResult.user.id,
        affectedSystems,
        affectedUsers
      )
    }

    return NextResponse.json({
      success: true,
      incident: {
        id: incident.id,
        type: incident.type,
        severity: incident.severity,
        status: incident.status,
        title: incident.title,
        description: incident.description,
        affectedSystems: incident.affectedSystems,
        affectedUsers: incident.affectedUsers.length, // Don't expose user IDs
        reportedAt: incident.reportedAt,
        responseTeam: incident.responseTeam.map(member => ({
          role: member.role,
          assignedAt: member.assignedAt
        }))
      }
    })

  } catch (error) {
    console.error('Error reporting incident:', error)
    return NextResponse.json(
      { error: 'Failed to report incident' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/v1/incidents - Retrieve incidents with filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await incidentLimiter(request)
    if (rateLimitResult) {
      return rateLimitResult
    }

    // Verify authentication
    const authResult = await verifyAuth(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user has permission to view incidents (admin or security role)
    const hasPermission = authResult.user.role === 'ADMIN' || 
                         authResult.user.role === 'security' ||
                         authResult.user.permissions?.includes('view_incidents')

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const filters: any = {}
    
    const type = searchParams.get('type')
    if (type && Object.values(IncidentType).includes(type as IncidentType)) {
      filters.type = type as IncidentType
    }

    const severity = searchParams.get('severity')
    if (severity && Object.values(IncidentSeverity).includes(severity as IncidentSeverity)) {
      filters.severity = severity as IncidentSeverity
    }

    const status = searchParams.get('status')
    if (status && Object.values(IncidentStatus).includes(status as IncidentStatus)) {
      filters.status = status as IncidentStatus
    }

    const startDate = searchParams.get('startDate')
    if (startDate) {
      filters.startDate = new Date(startDate)
    }

    const endDate = searchParams.get('endDate')
    if (endDate) {
      filters.endDate = new Date(endDate)
    }

    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const offset = (page - 1) * limit

    // Get incidents
    const allIncidents = incidentResponseManager.getIncidents(filters)
    const totalIncidents = allIncidents.length
    const incidents = allIncidents.slice(offset, offset + limit)

    // Format incidents for response (remove sensitive data)
    const formattedIncidents = incidents.map(incident => ({
      id: incident.id,
      type: incident.type,
      severity: incident.severity,
      status: incident.status,
      title: incident.title,
      description: incident.description,
      affectedSystems: incident.affectedSystems,
      affectedUsersCount: incident.affectedUsers.length,
      detectedAt: incident.detectedAt,
      reportedAt: incident.reportedAt,
      reportedBy: incident.reportedBy,
      assignedTo: incident.assignedTo,
      responseTeam: incident.responseTeam.map(member => ({
        role: member.role,
        assignedAt: member.assignedAt,
        isActive: member.isActive
      })),
      timelineCount: incident.timeline.length,
      containmentActionsCount: incident.containmentActions.length,
      evidenceCount: incident.evidence.length,
      estimatedImpact: incident.estimatedImpact,
      createdAt: incident.createdAt,
      updatedAt: incident.updatedAt
    }))

    return NextResponse.json({
      success: true,
      incidents: formattedIncidents,
      pagination: {
        page,
        limit,
        total: totalIncidents,
        totalPages: Math.ceil(totalIncidents / limit)
      },
      filters: {
        availableTypes: Object.values(IncidentType),
        availableSeverities: Object.values(IncidentSeverity),
        availableStatuses: Object.values(IncidentStatus)
      }
    })

  } catch (error) {
    console.error('Error retrieving incidents:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve incidents' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/v1/incidents - Update incident status or add information
 */
export async function PUT(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await incidentLimiter(request)
    if (rateLimitResult) {
      return rateLimitResult
    }

    // Verify authentication
    const authResult = await verifyAuth(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user has permission to update incidents
    const hasPermission = authResult.user.role === 'ADMIN' || 
                         authResult.user.role === 'security' ||
                         authResult.user.permissions?.includes('update_incidents')

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      incidentId,
      action,
      status,
      notes,
      containmentAction,
      evidence
    } = body

    // Validate incident ID
    if (!incidentId) {
      return NextResponse.json(
        { error: 'Incident ID is required' },
        { status: 400 }
      )
    }

    // Validate action
    const validActions = ['update_status', 'add_containment', 'add_evidence', 'send_notifications']
    if (!action || !validActions.includes(action)) {
      return NextResponse.json(
        { 
          error: 'Invalid action',
          validActions
        },
        { status: 400 }
      )
    }

    // Check if incident exists
    const incident = incidentResponseManager.getIncident(incidentId)
    if (!incident) {
      return NextResponse.json(
        { error: 'Incident not found' },
        { status: 404 }
      )
    }

    let result: any = { success: true }

    switch (action) {
      case 'update_status':
        if (!status || !Object.values(IncidentStatus).includes(status)) {
          return NextResponse.json(
            { 
              error: 'Invalid status',
              validStatuses: Object.values(IncidentStatus)
            },
            { status: 400 }
          )
        }

        await incidentResponseManager.updateIncidentStatus(
          incidentId,
          status,
          authResult.user.id,
          notes
        )

        result.message = 'Incident status updated successfully'
        break

      case 'add_containment':
        if (!containmentAction?.action || !containmentAction?.description) {
          return NextResponse.json(
            { error: 'Containment action and description are required' },
            { status: 400 }
          )
        }

        await incidentResponseManager.addContainmentAction(
          incidentId,
          containmentAction.action,
          containmentAction.description,
          authResult.user.id
        )

        result.message = 'Containment action added successfully'
        break

      case 'add_evidence':
        if (!evidence?.type || !evidence?.filename || !evidence?.description || !evidence?.location) {
          return NextResponse.json(
            { error: 'Evidence type, filename, description, and location are required' },
            { status: 400 }
          )
        }

        await incidentResponseManager.addEvidence(
          incidentId,
          evidence.type,
          evidence.filename,
          evidence.description,
          authResult.user.id,
          evidence.location
        )

        result.message = 'Evidence added successfully'
        break

      case 'send_notifications':
        await incidentResponseManager.sendRegulatoryNotifications(incidentId)
        result.message = 'Regulatory notifications sent successfully'
        break

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        )
    }

    // Get updated incident
    const updatedIncident = incidentResponseManager.getIncident(incidentId)
    result.incident = {
      id: updatedIncident!.id,
      status: updatedIncident!.status,
      updatedAt: updatedIncident!.updatedAt,
      timelineCount: updatedIncident!.timeline.length,
      containmentActionsCount: updatedIncident!.containmentActions.length,
      evidenceCount: updatedIncident!.evidence.length
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error updating incident:', error)
    return NextResponse.json(
      { error: 'Failed to update incident' },
      { status: 500 }
    )
  }
}