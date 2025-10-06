import { PrismaClient } from '@prisma/client'
import { auditLog } from './audit-logger'
import { encrypt, decrypt, generateSecureToken } from './encryption'
import crypto from 'crypto'
import path from 'path'
import fs from 'fs/promises'
import { createReadStream, createWriteStream } from 'fs'
import { pipeline } from 'stream/promises'

const prisma = new PrismaClient()

/**
 * Secure document storage system for JobFinders
 * Provides virus scanning, encryption, signed URLs, and audit trails
 * Compliant with POPIA data protection requirements
 */

// Document types and configurations
export const DOCUMENT_TYPES = {
  CV: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedExtensions: ['.pdf', '.doc', '.docx'],
    mimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    virusScanRequired: true,
    encryptionRequired: true
  },
  COVER_LETTER: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedExtensions: ['.pdf', '.doc', '.docx', '.txt'],
    mimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
    virusScanRequired: true,
    encryptionRequired: true
  },
  PORTFOLIO: {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedExtensions: ['.pdf', '.zip', '.rar'],
    mimeTypes: ['application/pdf', 'application/zip', 'application/x-rar-compressed'],
    virusScanRequired: true,
    encryptionRequired: false
  },
  CERTIFICATE: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
    mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    virusScanRequired: true,
    encryptionRequired: true
  }
} as const

export type DocumentType = keyof typeof DOCUMENT_TYPES

// Document metadata interface
export interface DocumentMetadata {
  id: string
  userId: string
  filename: string
  originalFilename: string
  fileSize: number
  mimeType: string
  documentType: DocumentType
  isEncrypted: boolean
  virusScanStatus: 'pending' | 'clean' | 'infected' | 'failed'
  virusScanDate?: Date
  uploadDate: Date
  lastAccessDate?: Date
  expiryDate?: Date
  downloadCount: number
  isActive: boolean
  checksum: string
  storageLocation: string
}

// Virus scanning result interface
export interface VirusScanResult {
  isClean: boolean
  threats: string[]
  scanEngine: string
  scanDate: Date
  scanId: string
}

// Document upload options
export interface DocumentUploadOptions {
  userId: string
  documentType: DocumentType
  filename: string
  fileBuffer: Buffer
  mimeType: string
  ipAddress?: string
  userAgent?: string
  expiryDays?: number
}

// Signed URL options
export interface SignedUrlOptions {
  documentId: string
  userId: string
  expiryMinutes?: number
  downloadLimit?: number
  ipRestriction?: string[]
}

/**
 * Generate secure filename with timestamp and random suffix
 */
function generateSecureFilename(originalFilename: string, documentType: DocumentType): string {
  const ext = path.extname(originalFilename).toLowerCase()
  const timestamp = Date.now()
  const randomSuffix = generateSecureToken(8)
  return `${documentType.toLowerCase()}_${timestamp}_${randomSuffix}${ext}`
}

/**
 * Calculate file checksum for integrity verification
 */
function calculateChecksum(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

/**
 * Validate file against document type constraints
 */
function validateFile(
  filename: string,
  fileSize: number,
  mimeType: string,
  documentType: DocumentType
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  const config = DOCUMENT_TYPES[documentType]

  // Check file size
  if (fileSize > config.maxSize) {
    errors.push(`File size exceeds maximum allowed size of ${config.maxSize / (1024 * 1024)}MB`)
  }

  // Check file extension
  const ext = path.extname(filename).toLowerCase()
  if (!config.allowedExtensions.includes(ext)) {
    errors.push(`File extension ${ext} is not allowed. Allowed extensions: ${config.allowedExtensions.join(', ')}`)
  }

  // Check MIME type
  if (!config.mimeTypes.includes(mimeType)) {
    errors.push(`MIME type ${mimeType} is not allowed`)
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Simulate virus scanning (in production, integrate with actual antivirus service)
 * This would typically call services like ClamAV, VirusTotal, or cloud-based scanners
 */
async function performVirusScan(fileBuffer: Buffer, filename: string): Promise<VirusScanResult> {
  // Simulate scanning delay
  await new Promise(resolve => setTimeout(resolve, 1000))

  // Simple threat detection simulation (check for suspicious patterns)
  const suspiciousPatterns = [
    /virus/i,
    /malware/i,
    /trojan/i,
    /backdoor/i,
    /exploit/i
  ]

  const threats: string[] = []
  const fileContent = fileBuffer.toString('utf8', 0, Math.min(1024, fileBuffer.length))

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(filename) || pattern.test(fileContent)) {
      threats.push(`Suspicious pattern detected: ${pattern.source}`)
    }
  }

  // Check for executable file signatures
  const executableSignatures = [
    Buffer.from([0x4D, 0x5A]), // PE executable
    Buffer.from([0x7F, 0x45, 0x4C, 0x46]), // ELF executable
    Buffer.from([0xCA, 0xFE, 0xBA, 0xBE]), // Mach-O executable
  ]

  for (const signature of executableSignatures) {
    if (fileBuffer.subarray(0, signature.length).equals(signature)) {
      threats.push('Executable file detected')
      break
    }
  }

  return {
    isClean: threats.length === 0,
    threats,
    scanEngine: 'JobFinders-Scanner-v1.0',
    scanDate: new Date(),
    scanId: generateSecureToken(16)
  }
}

/**
 * Store file securely with encryption if required
 */
async function storeFile(
  fileBuffer: Buffer,
  filename: string,
  documentType: DocumentType,
  shouldEncrypt: boolean
): Promise<{ storageLocation: string; isEncrypted: boolean }> {
  const storageDir = process.env.DOCUMENT_STORAGE_PATH || './storage/documents'
  const typeDir = path.join(storageDir, documentType.toLowerCase())
  
  // Ensure directory exists
  await fs.mkdir(typeDir, { recursive: true })
  
  const storageLocation = path.join(typeDir, filename)
  let finalBuffer = fileBuffer
  let isEncrypted = false

  // Encrypt file if required
  if (shouldEncrypt) {
    const encryptionKey = process.env.DOCUMENT_ENCRYPTION_KEY
    if (!encryptionKey) {
      throw new Error('Document encryption key not configured')
    }
    
    finalBuffer = Buffer.from(encrypt(fileBuffer.toString('base64'), encryptionKey))
    isEncrypted = true
  }

  // Write file to storage
  await fs.writeFile(storageLocation, finalBuffer)

  return { storageLocation, isEncrypted }
}

/**
 * Upload and process document with security measures
 */
export async function uploadDocument(options: DocumentUploadOptions): Promise<DocumentMetadata> {
  const {
    userId,
    documentType,
    filename,
    fileBuffer,
    mimeType,
    ipAddress,
    userAgent,
    expiryDays = 365
  } = options

  try {
    // Validate file
    const validation = validateFile(filename, fileBuffer.length, mimeType, documentType)
    if (!validation.isValid) {
      throw new Error(`File validation failed: ${validation.errors.join(', ')}`)
    }

    // Generate secure filename and calculate checksum
    const secureFilename = generateSecureFilename(filename, documentType)
    const checksum = calculateChecksum(fileBuffer)

    // Check for duplicate files
    const existingDocument = await prisma.document.findFirst({
      where: {
        userId,
        checksum,
        isActive: true
      }
    })

    if (existingDocument) {
      throw new Error('Duplicate file detected. This document has already been uploaded.')
    }

    // Perform virus scan if required
    let virusScanResult: VirusScanResult | null = null
    const config = DOCUMENT_TYPES[documentType]
    
    if (config.virusScanRequired) {
      virusScanResult = await performVirusScan(fileBuffer, filename)
      
      if (!virusScanResult.isClean) {
        // Log security incident
        await auditLog({
          userId,
          action: 'VIRUS_DETECTED',
          resource: 'DOCUMENT',
          details: {
            filename,
            documentType,
            threats: virusScanResult.threats,
            scanId: virusScanResult.scanId
          },
          ipAddress,
          userAgent,
          success: false,
          errorMessage: `Virus detected: ${virusScanResult.threats.join(', ')}`
        })

        throw new Error(`File rejected: ${virusScanResult.threats.join(', ')}`)
      }
    }

    // Store file securely
    const { storageLocation, isEncrypted } = await storeFile(
      fileBuffer,
      secureFilename,
      documentType,
      config.encryptionRequired
    )

    // Calculate expiry date
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + expiryDays)

    // Save document metadata to database
    const document = await prisma.document.create({
      data: {
        userId,
        filename: secureFilename,
        originalFilename: filename,
        fileSize: fileBuffer.length,
        mimeType,
        documentType,
        isEncrypted,
        virusScanStatus: virusScanResult ? 'clean' : 'pending',
        virusScanDate: virusScanResult?.scanDate,
        uploadDate: new Date(),
        expiryDate,
        downloadCount: 0,
        isActive: true,
        checksum,
        storageLocation,
        // Store virus scan details if available
        virusScanDetails: virusScanResult ? {
          scanEngine: virusScanResult.scanEngine,
          scanId: virusScanResult.scanId,
          threats: virusScanResult.threats
        } : undefined
      }
    })

    // Log successful upload
    await auditLog({
      userId,
      action: 'DOCUMENT_UPLOADED',
      resource: 'DOCUMENT',
      resourceId: document.id,
      details: {
        filename,
        documentType,
        fileSize: fileBuffer.length,
        isEncrypted,
        virusScanStatus: document.virusScanStatus
      },
      ipAddress,
      userAgent,
      success: true
    })

    return {
      id: document.id,
      userId: document.userId,
      filename: document.filename,
      originalFilename: document.originalFilename,
      fileSize: document.fileSize,
      mimeType: document.mimeType,
      documentType: document.documentType as DocumentType,
      isEncrypted: document.isEncrypted,
      virusScanStatus: document.virusScanStatus as 'pending' | 'clean' | 'infected' | 'failed',
      virusScanDate: document.virusScanDate || undefined,
      uploadDate: document.uploadDate,
      lastAccessDate: document.lastAccessDate || undefined,
      expiryDate: document.expiryDate || undefined,
      downloadCount: document.downloadCount,
      isActive: document.isActive,
      checksum: document.checksum,
      storageLocation: document.storageLocation
    }

  } catch (error) {
    // Log failed upload
    await auditLog({
      userId,
      action: 'DOCUMENT_UPLOAD_FAILED',
      resource: 'DOCUMENT',
      details: {
        filename,
        documentType,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      ipAddress,
      userAgent,
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Document upload failed'
    })

    throw error
  }
}

/**
 * Generate signed URL for secure document access
 */
export async function generateSignedUrl(options: SignedUrlOptions): Promise<string> {
  const {
    documentId,
    userId,
    expiryMinutes = 60,
    downloadLimit = 1,
    ipRestriction
  } = options

  try {
    // Verify document exists and user has access
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        userId,
        isActive: true,
        OR: [
          { expiryDate: null },
          { expiryDate: { gt: new Date() } }
        ]
      }
    })

    if (!document) {
      throw new Error('Document not found or access denied')
    }

    // Generate signed URL token
    const expiryTime = new Date(Date.now() + expiryMinutes * 60 * 1000)
    const tokenData = {
      documentId,
      userId,
      expiryTime: expiryTime.getTime(),
      downloadLimit,
      ipRestriction,
      nonce: generateSecureToken(16)
    }

    const token = encrypt(JSON.stringify(tokenData), process.env.SIGNED_URL_SECRET!)
    
    // Store signed URL record for tracking
    await prisma.signedUrl.create({
      data: {
        token,
        documentId,
        userId,
        expiryTime,
        downloadLimit,
        remainingDownloads: downloadLimit,
        ipRestriction: ipRestriction ? ipRestriction.join(',') : null,
        isActive: true
      }
    })

    // Log signed URL generation
    await auditLog({
      userId,
      action: 'SIGNED_URL_GENERATED',
      resource: 'DOCUMENT',
      resourceId: documentId,
      details: {
        expiryMinutes,
        downloadLimit,
        ipRestriction
      },
      success: true
    })

    return `${process.env.NEXTAUTH_URL}/api/v1/documents/download/${token}`

  } catch (error) {
    await auditLog({
      userId,
      action: 'SIGNED_URL_GENERATION_FAILED',
      resource: 'DOCUMENT',
      resourceId: documentId,
      details: {
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Signed URL generation failed'
    })

    throw error
  }
}

/**
 * Download document using signed URL
 */
export async function downloadDocument(
  token: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ buffer: Buffer; metadata: DocumentMetadata }> {
  try {
    // Decrypt and validate token
    const tokenData = JSON.parse(decrypt(token, process.env.SIGNED_URL_SECRET!))
    const { documentId, userId, expiryTime, downloadLimit, ipRestriction } = tokenData

    // Check token expiry
    if (Date.now() > expiryTime) {
      throw new Error('Download link has expired')
    }

    // Check IP restriction
    if (ipRestriction && ipAddress && !ipRestriction.includes(ipAddress)) {
      throw new Error('Access denied from this IP address')
    }

    // Get signed URL record
    const signedUrl = await prisma.signedUrl.findFirst({
      where: {
        token,
        isActive: true,
        expiryTime: { gt: new Date() }
      }
    })

    if (!signedUrl || signedUrl.remainingDownloads <= 0) {
      throw new Error('Download link is no longer valid')
    }

    // Get document
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        userId,
        isActive: true
      }
    })

    if (!document) {
      throw new Error('Document not found')
    }

    // Read file from storage
    let fileBuffer = await fs.readFile(document.storageLocation)

    // Decrypt if necessary
    if (document.isEncrypted) {
      const decryptedData = decrypt(fileBuffer.toString(), process.env.DOCUMENT_ENCRYPTION_KEY!)
      fileBuffer = Buffer.from(decryptedData, 'base64')
    }

    // Update download tracking
    await Promise.all([
      // Update document download count and last access
      prisma.document.update({
        where: { id: documentId },
        data: {
          downloadCount: { increment: 1 },
          lastAccessDate: new Date()
        }
      }),
      // Update signed URL remaining downloads
      prisma.signedUrl.update({
        where: { id: signedUrl.id },
        data: {
          remainingDownloads: { decrement: 1 },
          isActive: signedUrl.remainingDownloads > 1
        }
      })
    ])

    // Log successful download
    await auditLog({
      userId,
      action: 'DOCUMENT_DOWNLOADED',
      resource: 'DOCUMENT',
      resourceId: documentId,
      details: {
        filename: document.originalFilename,
        downloadMethod: 'signed_url',
        remainingDownloads: signedUrl.remainingDownloads - 1
      },
      ipAddress,
      userAgent,
      success: true
    })

    return {
      buffer: fileBuffer,
      metadata: {
        id: document.id,
        userId: document.userId,
        filename: document.filename,
        originalFilename: document.originalFilename,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        documentType: document.documentType as DocumentType,
        isEncrypted: document.isEncrypted,
        virusScanStatus: document.virusScanStatus as 'pending' | 'clean' | 'infected' | 'failed',
        virusScanDate: document.virusScanDate || undefined,
        uploadDate: document.uploadDate,
        lastAccessDate: document.lastAccessDate || undefined,
        expiryDate: document.expiryDate || undefined,
        downloadCount: document.downloadCount + 1,
        isActive: document.isActive,
        checksum: document.checksum,
        storageLocation: document.storageLocation
      }
    }

  } catch (error) {
    // Log failed download attempt
    await auditLog({
      action: 'DOCUMENT_DOWNLOAD_FAILED',
      resource: 'DOCUMENT',
      details: {
        token: token.substring(0, 16) + '...', // Log partial token for debugging
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      ipAddress,
      userAgent,
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Document download failed'
    })

    throw error
  }
}

/**
 * Delete document securely
 */
export async function deleteDocument(
  documentId: string,
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    // Verify document ownership
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        userId,
        isActive: true
      }
    })

    if (!document) {
      throw new Error('Document not found or access denied')
    }

    // Delete physical file
    try {
      await fs.unlink(document.storageLocation)
    } catch (error) {
      console.warn('Failed to delete physical file:', error)
    }

    // Soft delete document record
    await prisma.document.update({
      where: { id: documentId },
      data: {
        isActive: false,
        deletedAt: new Date()
      }
    })

    // Deactivate any active signed URLs
    await prisma.signedUrl.updateMany({
      where: {
        documentId,
        isActive: true
      },
      data: {
        isActive: false
      }
    })

    // Log successful deletion
    await auditLog({
      userId,
      action: 'DOCUMENT_DELETED',
      resource: 'DOCUMENT',
      resourceId: documentId,
      details: {
        filename: document.originalFilename,
        documentType: document.documentType
      },
      ipAddress,
      userAgent,
      success: true
    })

  } catch (error) {
    await auditLog({
      userId,
      action: 'DOCUMENT_DELETION_FAILED',
      resource: 'DOCUMENT',
      resourceId: documentId,
      details: {
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      ipAddress,
      userAgent,
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Document deletion failed'
    })

    throw error
  }
}

/**
 * Get user's documents with filtering and pagination
 */
export async function getUserDocuments(
  userId: string,
  options: {
    documentType?: DocumentType
    page?: number
    limit?: number
    includeExpired?: boolean
  } = {}
): Promise<{ documents: DocumentMetadata[]; total: number; page: number; totalPages: number }> {
  const { documentType, page = 1, limit = 20, includeExpired = false } = options

  const where: any = {
    userId,
    isActive: true
  }

  if (documentType) {
    where.documentType = documentType
  }

  if (!includeExpired) {
    where.OR = [
      { expiryDate: null },
      { expiryDate: { gt: new Date() } }
    ]
  }

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      orderBy: { uploadDate: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.document.count({ where })
  ])

  return {
    documents: documents.map(doc => ({
      id: doc.id,
      userId: doc.userId,
      filename: doc.filename,
      originalFilename: doc.originalFilename,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      documentType: doc.documentType as DocumentType,
      isEncrypted: doc.isEncrypted,
      virusScanStatus: doc.virusScanStatus as 'pending' | 'clean' | 'infected' | 'failed',
      virusScanDate: doc.virusScanDate || undefined,
      uploadDate: doc.uploadDate,
      lastAccessDate: doc.lastAccessDate || undefined,
      expiryDate: doc.expiryDate || undefined,
      downloadCount: doc.downloadCount,
      isActive: doc.isActive,
      checksum: doc.checksum,
      storageLocation: doc.storageLocation
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit)
  }
}

/**
 * Clean up expired documents and signed URLs
 */
export async function cleanupExpiredDocuments(): Promise<{ deletedDocuments: number; deletedUrls: number }> {
  const now = new Date()

  // Find expired documents
  const expiredDocuments = await prisma.document.findMany({
    where: {
      isActive: true,
      expiryDate: { lt: now }
    }
  })

  // Delete physical files and mark as inactive
  let deletedDocuments = 0
  for (const document of expiredDocuments) {
    try {
      await fs.unlink(document.storageLocation)
    } catch (error) {
      console.warn(`Failed to delete expired file: ${document.storageLocation}`, error)
    }

    await prisma.document.update({
      where: { id: document.id },
      data: {
        isActive: false,
        deletedAt: now
      }
    })

    deletedDocuments++
  }

  // Clean up expired signed URLs
  const { count: deletedUrls } = await prisma.signedUrl.updateMany({
    where: {
      isActive: true,
      expiryTime: { lt: now }
    },
    data: {
      isActive: false
    }
  })

  // Log cleanup activity
  await auditLog({
    action: 'DOCUMENT_CLEANUP_COMPLETED',
    resource: 'SYSTEM',
    details: {
      deletedDocuments,
      deletedUrls,
      cleanupDate: now
    },
    success: true
  })

  return { deletedDocuments, deletedUrls }
}