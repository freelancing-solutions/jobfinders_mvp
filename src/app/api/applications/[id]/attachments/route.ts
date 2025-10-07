import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { db } from '@/lib/db'
import { apiHandler, APIError } from '@/lib/api-handler'
import { logger } from '@/lib/logging/logger'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return apiHandler(request, async (req) => {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      throw new APIError('Authentication required', 401)
    }

    const { id } = params

    // Verify ownership
    const existingApplication = await db.jobApplication.findFirst({
      where: {
        applicationId: id,
        jobSeekerProfile: {
          userUid: session.user.id
        }
      }
    })

    if (!existingApplication) {
      throw new APIError('Application not found', 404)
    }

    // Fetch attachments
    const attachments = await db.applicationAttachment.findMany({
      where: {
        applicationId: id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const formattedAttachments = attachments.map(attachment => ({
      id: attachment.attachmentId,
      name: attachment.fileName,
      url: attachment.fileUrl,
      type: attachment.fileType,
      size: attachment.fileSize,
      uploadedAt: attachment.createdAt.toISOString(),
      uploadedBy: attachment.uploadedBy || 'User',
      description: attachment.description
    }))

    return NextResponse.json({
      success: true,
      data: formattedAttachments
    })
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return apiHandler(request, async (req) => {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      throw new APIError('Authentication required', 401)
    }

    const { id } = params
    const contentType = req.headers.get('content-type') || ''

    let file: File | null = null
    let description: string = ''
    let fileName: string = ''

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      file = formData.get('file') as File
      description = (formData.get('description') as string) || ''
    } else {
      const body = await req.json()
      fileName = body.fileName
      description = body.description || ''
      // For JSON requests, the file should already be uploaded and we just need to create the record
    }

    if (!file && !fileName) {
      throw new APIError('File or file name is required', 400)
    }

    // Verify ownership
    const existingApplication = await db.jobApplication.findFirst({
      where: {
        applicationId: id,
        jobSeekerProfile: {
          userUid: session.user.id
        }
      }
    })

    if (!existingApplication) {
      throw new APIError('Application not found', 404)
    }

    let fileUrl: string
    let fileSize: number
    let fileType: string

    if (file) {
      // Handle file upload
      const timestamp = Date.now()
      const fileExtension = file.name.split('.').pop()
      const uniqueFileName = `${id}_${timestamp}.${fileExtension}`

      // In a real application, you would upload to a cloud storage service
      // For now, we'll simulate the upload
      fileUrl = `/uploads/applications/${uniqueFileName}`
      fileSize = file.size
      fileType = file.type
      fileName = file.name

      // TODO: Actually upload the file to your storage service
      logger.info('File uploaded for application', {
        applicationId: id,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      })
    } else {
      // File already uploaded, just create the database record
      fileUrl = body.fileUrl
      fileSize = body.fileSize || 0
      fileType = body.fileType || 'application/octet-stream'
    }

    // Create attachment record
    const attachment = await db.applicationAttachment.create({
      data: {
        applicationId: id,
        fileName: fileName,
        fileUrl,
        fileType,
        fileSize,
        description: description || `Uploaded ${fileName}`,
        uploadedBy: session.user.email || 'User'
      }
    })

    // Update application's last status update
    await db.jobApplication.update({
      where: {
        applicationId: id
      },
      data: {
        lastStatusUpdate: new Date()
      }
    })

    // Add timeline event
    await db.applicationTimeline.create({
      data: {
        applicationId: id,
        status: existingApplication.status,
        notes: `Attachment added: ${fileName}`,
        createdBy: session.user.email || 'User',
        createdByRole: 'candidate'
      }
    })

    // TODO: Trigger real-time updates via WebSocket

    logger.info('Application attachment created', {
      attachmentId: attachment.attachmentId,
      applicationId: id,
      fileName,
      userId: session.user.id
    })

    return NextResponse.json({
      success: true,
      data: {
        id: attachment.attachmentId,
        name: attachment.fileName,
        url: attachment.fileUrl,
        type: attachment.fileType,
        size: attachment.fileSize,
        uploadedAt: attachment.createdAt.toISOString(),
        uploadedBy: attachment.uploadedBy,
        description: attachment.description
      },
      message: 'Attachment uploaded successfully'
    })
  })
}