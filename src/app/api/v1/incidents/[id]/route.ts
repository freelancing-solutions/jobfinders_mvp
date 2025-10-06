import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { verifyAuth } from '@/lib/auth'
import { incidentResponseManager } from '@/lib/incident-response'

// Rate limiting for incident detail endpoints
const incidentDetailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
})

/**
 * GET /api/v1/incidents/[id] - Get detailed incident information
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Apply rate limiting
    const rateLimitResult = await incidentDetailLimiter(request)
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

    // Check if user has permission to view incident details
    const hasPermission = authResult.user.role === 'ADMIN' || 
                         authResult.user.role === 'security' ||
                         authResult.user.permissions?.includes('view_incidents')

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const incidentId = params.id

    // Get incident
    const incident = incidentResponseManager.getIncident(incidentId)
    if (!incident) {
      return NextResponse.json(
        { error: 'Incident not found' },
        { status: 404 }
      )
    }

    // Format incident for response (include detailed information but protect sensitive data)
    const detailedIncident = {
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
      
      // Response team details
      responseTeam: incident.responseTeam.map(member => ({
        userId: member.userId,
        role: member.role,
        contactInfo: {
          email: member.contactInfo.email,
          // Only include phone for admin users
          ...(authResult.user.role === 'ADMIN' && { phone: member.contactInfo.phone })
        },
        assignedAt: member.assignedAt,
        isActive: member.isActive
      })),

      // Timeline
      timeline: incident.timeline.map(entry => ({
        id: entry.id,
        timestamp: entry.timestamp,
        action: entry.action,
        description: entry.description,
        performedBy: entry.performedBy,
        evidence: entry.evidence
      })),

      // Containment actions
      containmentActions: incident.containmentActions.map(action => ({
        id: action.id,
        action: action.action,
        description: action.description,
        implementedAt: action.implementedAt,
        implementedBy: action.implementedBy,
        effectiveness: action.effectiveness,
        notes: action.notes
      })),

      // Communication log
      communicationLog: incident.communicationLog.map(comm => ({
        id: comm.id,
        timestamp: comm.timestamp,
        channel: comm.channel,
        recipient: comm.recipient,
        message: comm.message,
        sentBy: comm.sentBy,
        acknowledged: comm.acknowledged,
        acknowledgedAt: comm.acknowledgedAt
      })),

      // Evidence (limited details for non-admin users)
      evidence: incident.evidence.map(evidence => ({
        id: evidence.id,
        type: evidence.type,
        filename: evidence.filename,
        description: evidence.description,
        collectedAt: evidence.collectedAt,
        collectedBy: evidence.collectedBy,
        hash: evidence.hash,
        // Only include location and chain of custody for admin users
        ...(authResult.user.role === 'ADMIN' && {
          location: evidence.location,
          chainOfCustody: evidence.chainOfCustody
        })
      })),

      // Root cause and resolution
      rootCause: incident.rootCause,
      resolution: incident.resolution,
      lessonsLearned: incident.lessonsLearned,

      // Impact assessment
      estimatedImpact: incident.estimatedImpact,

      // Regulatory notifications
      regulatoryNotifications: incident.regulatoryNotifications.map(notification => ({
        authority: notification.authority,
        notifiedAt: notification.notifiedAt,
        notificationMethod: notification.notificationMethod,
        referenceNumber: notification.referenceNumber,
        status: notification.status,
        deadline: notification.deadline
      })),

      createdAt: incident.createdAt,
      updatedAt: incident.updatedAt
    }

    return NextResponse.json({
      success: true,
      incident: detailedIncident
    })

  } catch (error) {
    console.error('Error retrieving incident details:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve incident details' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/v1/incidents/[id] - Delete an incident (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Apply rate limiting
    const rateLimitResult = await incidentDetailLimiter(request)
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

    // Only admin users can delete incidents
    if (authResult.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const incidentId = params.id

    // Check if incident exists
    const incident = incidentResponseManager.getIncident(incidentId)
    if (!incident) {
      return NextResponse.json(
        { error: 'Incident not found' },
        { status: 404 }
      )
    }

    // Only allow deletion of closed incidents
    if (incident.status !== 'closed') {
      return NextResponse.json(
        { error: 'Only closed incidents can be deleted' },
        { status: 400 }
      )
    }

    // In a real implementation, this would soft-delete the incident
    // For now, we'll just return success
    console.log(`Admin ${authResult.user.id} deleted incident ${incidentId}`)

    return NextResponse.json({
      success: true,
      message: 'Incident deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting incident:', error)
    return NextResponse.json(
      { error: 'Failed to delete incident' },
      { status: 500 }
    )
  }
}