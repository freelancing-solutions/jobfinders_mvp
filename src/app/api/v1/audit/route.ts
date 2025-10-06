import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit-utils'
import { getAuditLogs } from '@/lib/audit-logger'

/**
 * GET /api/v1/audit - Retrieve audit logs with filtering and export
 * Requires admin authentication and rate limiting
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, 'api-general')
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    // Authentication check
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Admin privilege check
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const isExport = searchParams.get('export') === 'true'
    
    const filters = {
      userId: searchParams.get('userId') || undefined,
      action: searchParams.get('action') || undefined,
      resource: searchParams.get('resource') || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      ipAddress: searchParams.get('ipAddress') || undefined,
      success: searchParams.get('success') ? searchParams.get('success') === 'true' : undefined,
      page: isExport ? 1 : parseInt(searchParams.get('page') || '1'),
      limit: isExport ? 10000 : parseInt(searchParams.get('limit') || '50') // Higher limit for export
    }

    // Validate pagination parameters
    if (filters.page < 1) filters.page = 1
    if (!isExport && (filters.limit < 1 || filters.limit > 100)) filters.limit = 50

    // Get audit logs
    const result = await getAuditLogs(filters)

    // Handle CSV export
    if (isExport) {
      const csvHeaders = [
        'Timestamp',
        'User ID',
        'User Email',
        'Action',
        'Resource',
        'Resource ID',
        'IP Address',
        'User Agent',
        'Session ID',
        'Success',
        'Error Message',
        'Details'
      ]

      const csvRows = result.logs.map(log => [
        log.timestamp,
        log.userId || '',
        log.user?.email || '',
        log.action,
        log.resource,
        log.resourceId || '',
        log.ipAddress || '',
        log.userAgent || '',
        log.sessionId || '',
        log.success ? 'Yes' : 'No',
        log.errorMessage || '',
        log.details ? JSON.stringify(log.details) : ''
      ])

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => 
          row.map(field => 
            typeof field === 'string' && field.includes(',') 
              ? `"${field.replace(/"/g, '""')}"` 
              : field
          ).join(',')
        )
      ].join('\n')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        page: filters.page,
        limit: filters.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / filters.limit)
      }
    })

  } catch (error) {
    console.error('Audit logs retrieval error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve audit logs' },
      { status: 500 }
    )
  }
}