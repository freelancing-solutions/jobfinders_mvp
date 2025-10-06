import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limiter'
import JSZip from 'jszip'

/**
 * GET /api/v1/users/me/data-export
 * Export all user data in JSON and CSV formats with POPIA compliance
 * Implements the right to data portability under data protection laws
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting: 5 exports per day per user
    const rateLimitResult = await rateLimit(request, 'data-export', 5, 86400)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again tomorrow.' },
        { status: 429 }
      )
    }

    // Authentication check
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'zip' // zip, json, csv

    // Fetch comprehensive user data
    const userData = await fetchUserData(userId)

    // Log data export request for audit purposes
    await prisma.auditLog.create({
      data: {
        userId: userId,
        action: 'DATA_EXPORT_REQUESTED',
        ipAddress: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        metadata: {
          format: format,
          dataTypes: Object.keys(userData.data),
          exportedAt: new Date().toISOString(),
        }
      }
    })

    // Handle different export formats
    switch (format) {
      case 'json':
        return new NextResponse(JSON.stringify(userData, null, 2), {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="jobfinders-data-export-${userId}-${Date.now()}.json"`,
          },
        })

      case 'csv':
        const csvData = convertToCSV(userData.data)
        return new NextResponse(csvData, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="jobfinders-data-export-${userId}-${Date.now()}.csv"`,
          },
        })

      case 'zip':
      default:
        const zipBuffer = await createZipExport(userData)
        return new NextResponse(zipBuffer, {
          headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="jobfinders-data-export-${userId}-${Date.now()}.zip"`,
          },
        })
    }

  } catch (error) {
    console.error('Data export error:', error)
    
    // Log the error for monitoring
    if (error instanceof Error) {
      await prisma.auditLog.create({
        data: {
          userId: null,
          action: 'DATA_EXPORT_ERROR',
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          metadata: {
            error: error.message,
            stack: error.stack,
          }
        }
      }).catch(() => {}) // Ignore logging errors
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Fetch comprehensive user data from all relevant tables
 */
async function fetchUserData(userId: string) {
  const [
    user,
    profile,
    applications,
    savedJobs,
    subscriptions,
    notifications,
    auditLogs,
    consentRecords,
    documents
  ] = await Promise.all([
    // User account data
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      }
    }),

    // Profile data
    prisma.profile.findUnique({
      where: { userId: userId },
      include: {
        skills: true,
        experience: true,
        education: true,
      }
    }),

    // Job applications
    prisma.jobApplication.findMany({
      where: { userId: userId },
      include: {
        job: {
          select: {
            title: true,
            company: true,
            location: true,
            type: true,
          }
        }
      }
    }),

    // Saved jobs
    prisma.savedJob.findMany({
      where: { userId: userId },
      include: {
        job: {
          select: {
            title: true,
            company: true,
            location: true,
            type: true,
            salary: true,
          }
        }
      }
    }),

    // Subscriptions
    prisma.subscription.findMany({
      where: { userId: userId },
      select: {
        id: true,
        plan: true,
        status: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        createdAt: true,
        updatedAt: true,
      }
    }),

    // Notifications
    prisma.notification.findMany({
      where: { userId: userId },
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        read: true,
        createdAt: true,
      }
    }),

    // Audit logs (last 100 entries)
    prisma.auditLog.findMany({
      where: { userId: userId },
      select: {
        id: true,
        action: true,
        ipAddress: true,
        userAgent: true,
        metadata: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),

    // Consent records
    prisma.consentRecord.findMany({
      where: { userId: userId },
      select: {
        id: true,
        consentType: true,
        granted: true,
        version: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        updatedAt: true,
      }
    }),

    // Document metadata (not actual files for security)
    prisma.document.findMany({
      where: { userId: userId },
      select: {
        id: true,
        filename: true,
        fileType: true,
        fileSize: true,
        uploadedAt: true,
        lastAccessedAt: true,
        // Note: actual file content/URLs are not included for security
      }
    })
  ])

  return {
    exportInfo: {
      exportedAt: new Date().toISOString(),
      exportedBy: userId,
      dataProtectionCompliance: 'POPIA (Protection of Personal Information Act)',
      format: 'Complete data export as requested under data portability rights',
      retentionNotice: 'This export contains all personal data we hold about you as of the export date.',
    },
    data: {
      account: user,
      profile: profile,
      jobApplications: applications,
      savedJobs: savedJobs,
      subscriptions: subscriptions,
      notifications: notifications,
      auditLogs: auditLogs,
      consentRecords: consentRecords,
      documents: documents,
    },
    summary: {
      totalJobApplications: applications?.length || 0,
      totalSavedJobs: savedJobs?.length || 0,
      totalNotifications: notifications?.length || 0,
      totalDocuments: documents?.length || 0,
      accountCreated: user?.createdAt?.toISOString(),
      lastUpdated: user?.updatedAt?.toISOString(),
    },
    dataRights: {
      rightToAccess: 'You have the right to access your personal data',
      rightToRectification: 'You have the right to correct inaccurate personal data',
      rightToErasure: 'You have the right to request deletion of your personal data',
      rightToPortability: 'You have the right to receive your data in a structured format',
      rightToObject: 'You have the right to object to processing of your personal data',
      contactForRights: 'privacy@jobfinders.site',
    }
  }
}

/**
 * Convert data to CSV format
 */
function convertToCSV(data: any): string {
  const csvSections: string[] = []

  // Convert each data section to CSV
  Object.entries(data).forEach(([section, items]) => {
    if (Array.isArray(items) && items.length > 0) {
      csvSections.push(`\n--- ${section.toUpperCase()} ---`)
      
      // Get headers from first item
      const headers = Object.keys(items[0])
      csvSections.push(headers.join(','))
      
      // Add data rows
      items.forEach(item => {
        const row = headers.map(header => {
          const value = item[header]
          if (value === null || value === undefined) return ''
          if (typeof value === 'object') return JSON.stringify(value)
          return `"${String(value).replace(/"/g, '""')}"`
        })
        csvSections.push(row.join(','))
      })
    } else if (items && typeof items === 'object') {
      csvSections.push(`\n--- ${section.toUpperCase()} ---`)
      csvSections.push('Field,Value')
      
      Object.entries(items).forEach(([key, value]) => {
        const csvValue = typeof value === 'object' ? JSON.stringify(value) : String(value)
        csvSections.push(`"${key}","${csvValue.replace(/"/g, '""')}"`)
      })
    }
  })

  return csvSections.join('\n')
}

/**
 * Create ZIP export with multiple formats
 */
async function createZipExport(userData: any): Promise<Buffer> {
  const zip = new JSZip()

  // Add JSON export
  zip.file('data-export.json', JSON.stringify(userData, null, 2))

  // Add CSV export
  zip.file('data-export.csv', convertToCSV(userData.data))

  // Add README with export information
  const readme = `
JobFinders.site Data Export
===========================

Export Date: ${userData.exportInfo.exportedAt}
User ID: ${userData.exportInfo.exportedBy}
Compliance: ${userData.exportInfo.dataProtectionCompliance}

Files Included:
- data-export.json: Complete data in JSON format
- data-export.csv: Data in CSV format for spreadsheet applications
- README.txt: This information file

Data Summary:
- Job Applications: ${userData.summary.totalJobApplications}
- Saved Jobs: ${userData.summary.totalSavedJobs}
- Notifications: ${userData.summary.totalNotifications}
- Documents: ${userData.summary.totalDocuments}
- Account Created: ${userData.summary.accountCreated}

Your Data Rights:
${Object.entries(userData.dataRights).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

For questions about your data or to exercise your rights, contact:
privacy@jobfinders.site

This export was generated in compliance with the Protection of Personal Information Act (POPIA)
and international data protection standards.
`

  zip.file('README.txt', readme.trim())

  // Generate ZIP buffer
  return await zip.generateAsync({ type: 'nodebuffer' })
}