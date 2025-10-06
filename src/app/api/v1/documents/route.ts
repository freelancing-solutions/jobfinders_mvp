import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit-utils'
import { 
  getUserDocuments, 
  generateSignedUrl, 
  deleteDocument,
  DocumentType,
  DOCUMENT_TYPES 
} from '@/lib/document-storage'

/**
 * GET /api/v1/documents - Get user's documents with filtering and pagination
 */
export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const documentType = searchParams.get('documentType') as DocumentType | null
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const includeExpired = searchParams.get('includeExpired') === 'true'

    // Validate parameters
    if (documentType && !Object.keys(DOCUMENT_TYPES).includes(documentType)) {
      return NextResponse.json(
        { error: 'Invalid document type' },
        { status: 400 }
      )
    }

    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      )
    }

    // Get user documents
    const result = await getUserDocuments(session.user.id, {
      documentType,
      page,
      limit,
      includeExpired
    })

    return NextResponse.json({
      success: true,
      data: {
        documents: result.documents.map(doc => ({
          id: doc.id,
          filename: doc.originalFilename,
          documentType: doc.documentType,
          fileSize: doc.fileSize,
          uploadDate: doc.uploadDate,
          expiryDate: doc.expiryDate,
          isExpired: doc.isExpired,
          virusScanStatus: doc.virusScanStatus,
          isEncrypted: doc.isEncrypted,
          downloadCount: doc.downloadCount
        })),
        pagination: result.pagination
      }
    })

  } catch (error) {
    console.error('Get documents error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve documents' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/v1/documents - Delete a document
 */
export async function DELETE(request: NextRequest) {
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
    const { documentId } = await request.json()

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      )
    }

    // Get client information
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Delete document
    await deleteDocument(documentId, session.user.id, ipAddress, userAgent)

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    })

  } catch (error) {
    console.error('Delete document error:', error)
    
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
    }

    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    )
  }
}