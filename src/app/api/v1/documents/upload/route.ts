import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit-utils'
import { uploadDocument, DocumentType, DOCUMENT_TYPES } from '@/lib/document-storage'

/**
 * POST /api/v1/documents/upload - Upload document with security measures
 * Supports CV, cover letter, portfolio, and certificate uploads
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting for file uploads
    const rateLimitResult = await rateLimit(request, 'file-upload')
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Upload rate limit exceeded. Please try again later.' },
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

    // Get client information
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const documentType = formData.get('documentType') as DocumentType
    const expiryDays = parseInt(formData.get('expiryDays') as string) || 365

    // Validate required fields
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!documentType || !Object.keys(DOCUMENT_TYPES).includes(documentType)) {
      return NextResponse.json(
        { error: 'Invalid document type. Allowed types: ' + Object.keys(DOCUMENT_TYPES).join(', ') },
        { status: 400 }
      )
    }

    // Validate expiry days
    if (expiryDays < 1 || expiryDays > 1095) { // Max 3 years
      return NextResponse.json(
        { error: 'Expiry days must be between 1 and 1095 days' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    // Upload document with security measures
    const documentMetadata = await uploadDocument({
      userId: session.user.id,
      documentType,
      filename: file.name,
      fileBuffer,
      mimeType: file.type,
      ipAddress,
      userAgent,
      expiryDays
    })

    return NextResponse.json({
      success: true,
      data: {
        id: documentMetadata.id,
        filename: documentMetadata.originalFilename,
        fileSize: documentMetadata.fileSize,
        documentType: documentMetadata.documentType,
        uploadDate: documentMetadata.uploadDate,
        expiryDate: documentMetadata.expiryDate,
        virusScanStatus: documentMetadata.virusScanStatus,
        isEncrypted: documentMetadata.isEncrypted
      },
      message: 'Document uploaded successfully'
    })

  } catch (error) {
    console.error('Document upload error:', error)
    
    // Return appropriate error message
    if (error instanceof Error) {
      if (error.message.includes('File validation failed')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
      
      if (error.message.includes('Virus detected') || error.message.includes('File rejected')) {
        return NextResponse.json(
          { error: 'File rejected due to security concerns' },
          { status: 400 }
        )
      }
      
      if (error.message.includes('Duplicate file')) {
        return NextResponse.json(
          { error: 'This file has already been uploaded' },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Document upload failed. Please try again.' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/v1/documents/upload - Get upload configuration and limits
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Return document type configurations
    const configurations = Object.entries(DOCUMENT_TYPES).map(([type, config]) => ({
      type,
      maxSize: config.maxSize,
      maxSizeMB: Math.round(config.maxSize / (1024 * 1024)),
      allowedExtensions: config.allowedExtensions,
      mimeTypes: config.mimeTypes,
      virusScanRequired: config.virusScanRequired,
      encryptionRequired: config.encryptionRequired
    }))

    return NextResponse.json({
      success: true,
      data: {
        documentTypes: configurations,
        maxExpiryDays: 1095,
        defaultExpiryDays: 365
      }
    })

  } catch (error) {
    console.error('Upload configuration error:', error)
    return NextResponse.json(
      { error: 'Failed to get upload configuration' },
      { status: 500 }
    )
  }
}