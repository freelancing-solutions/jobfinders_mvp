import { NextRequest, NextResponse } from 'next/server'
import { downloadDocument } from '@/lib/document-storage'

/**
 * GET /api/v1/documents/download/[token] - Download document using signed URL
 * Provides secure document access with audit trail
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params

    if (!token) {
      return NextResponse.json(
        { error: 'Download token is required' },
        { status: 400 }
      )
    }

    // Get client information
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Download document using signed URL
    const { buffer, metadata } = await downloadDocument(token, ipAddress, userAgent)

    // Set appropriate headers for file download
    const headers = new Headers()
    headers.set('Content-Type', metadata.mimeType)
    headers.set('Content-Length', buffer.length.toString())
    headers.set('Content-Disposition', `attachment; filename="${metadata.originalFilename}"`)
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    headers.set('Pragma', 'no-cache')
    headers.set('Expires', '0')

    // Security headers
    headers.set('X-Content-Type-Options', 'nosniff')
    headers.set('X-Frame-Options', 'DENY')
    headers.set('X-XSS-Protection', '1; mode=block')

    return new NextResponse(buffer, {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('Document download error:', error)
    
    // Return appropriate error message
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        return NextResponse.json(
          { error: 'Download link has expired' },
          { status: 410 }
        )
      }
      
      if (error.message.includes('no longer valid')) {
        return NextResponse.json(
          { error: 'Download link is no longer valid' },
          { status: 410 }
        )
      }
      
      if (error.message.includes('Access denied')) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }
      
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Document not found' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Document download failed' },
      { status: 500 }
    )
  }
}