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

    // Fetch notes
    const notes = await db.applicationNote.findMany({
      where: {
        applicationId: id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const formattedNotes = notes.map(note => ({
      id: note.noteId,
      content: note.content,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
      createdBy: note.createdBy || 'User',
      isPrivate: note.isPrivate,
      tags: note.tags ? JSON.parse(note.tags as string) : [],
      attachments: [] // TODO: Implement note attachments
    }))

    return NextResponse.json({
      success: true,
      data: formattedNotes
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
    const body = await req.json()
    const { content, isPrivate = true, tags = [] } = body

    if (!content || content.trim().length === 0) {
      throw new APIError('Note content is required', 400)
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

    // Create note
    const note = await db.applicationNote.create({
      data: {
        applicationId: id,
        content: content.trim(),
        isPrivate,
        tags: JSON.stringify(tags),
        createdBy: session.user.email || 'User',
        createdById: session.user.id
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
        notes: `Note added: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`,
        createdBy: session.user.email || 'User',
        createdByRole: 'candidate'
      }
    })

    // TODO: Trigger real-time updates via WebSocket

    logger.info('Application note created', {
      noteId: note.noteId,
      applicationId: id,
      userId: session.user.id
    })

    return NextResponse.json({
      success: true,
      data: {
        id: note.noteId,
        content: note.content,
        createdAt: note.createdAt.toISOString(),
        updatedAt: note.updatedAt.toISOString(),
        createdBy: note.createdBy,
        isPrivate: note.isPrivate,
        tags: JSON.parse(note.tags as string)
      },
      message: 'Note added successfully'
    })
  })
}