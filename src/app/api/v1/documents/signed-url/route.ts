import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit-utils'
import { generateSignedUrl } from '@/lib/document-storage'

/**
 * POST /api/v1/documents/signed-url - Generate signed URL for document access
 * Provides secure, time-limited access to documents
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, 'api-general')
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
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

    // Parse request body
    const { 
      documentId, 
      expiryMinutes = 60, 
      maxDownloads = 5,
      allowedIpAddresses 
    } = await request.json()

    // Validate required fields
    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      )
    }

    // Validate parameters
    if (expiryMinutes < 1 || expiryMinutes > 10080) { // Max 7 days
      return NextResponse.json(
        { error: 'Expiry minutes must be between 1 and 10080 (7 days)' },
        { status: 400 }
      )
    }

    if (maxDownloads < 1 || maxDownloads > 100) {
      return NextResponse.json(
        { error: 'Max downloads must be between 1 and 100' },
        { status: 400 }
      )
    }

    // Validate IP addresses if provided
    if (allowedIpAddresses && Array.isArray(allowedIpAddresses)) {
      const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
      const invalidIps = allowedIpAddresses.filter(ip => !ipRegex.test(ip))
      
      if (invalidIps.length > 0) {
        return NextResponse.json(
          { error: `Invalid IP addresses: ${invalidIps.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Get client information
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Generate signed URL
    const signedUrlData = await generateSignedUrl({
      documentId,
      userId: session.user.id,
      expiryMinutes,
      maxDownloads,
      allowedIpAddresses,
      ipAddress,
      userAgent
    })

    return NextResponse.json({
      success: true,
      data: {
        signedUrl: signedUrlData.signedUrl,
        token: signedUrlData.token,
        expiryDate: signedUrlData.expiryDate,
        maxDownloads: signedUrlData.maxDownloads,
        allowedIpAddresses: signedUrlData.allowedIpAddresses,
        documentInfo: {
          filename: signedUrlData.document.originalFilename,
          fileSize: signedUrlData.document.fileSize,
          documentType: signedUrlData.document.documentType
        }
      },
      message: 'Signed URL generated successfully'
    })

  } catch (error) {
    console.error('Generate signed URL error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Document not found' },
          { status: 404 }
        )
      }
      
      if (error.message.includes('Access denied')) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }
      
      if (error.message.includes('expired')) {
        return NextResponse.json(
          { error: 'Document has expired' },
          { status: 410 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate signed URL' },
      { status: 500 }
    )
  }
}