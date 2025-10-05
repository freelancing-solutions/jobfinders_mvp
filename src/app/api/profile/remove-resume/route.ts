import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { unlink } from 'fs/promises'
import path from 'path'

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'seeker') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get current profile
    const profile = await db.jobSeekerProfile.findUnique({
      where: { userUid: session.user.id }
    })

    if (!profile || !profile.resumeFileUrl) {
      return NextResponse.json(
        { success: false, error: 'No resume found' },
        { status: 404 }
      )
    }

    // Remove file from disk
    const filePath = path.join(process.cwd(), profile.resumeFileUrl)
    try {
      await unlink(filePath)
    } catch (error) {
      // File might not exist, continue with database update
      console.warn('Resume file not found on disk:', filePath)
    }

    // Update database to remove resume URL
    await db.jobSeekerProfile.update({
      where: { userUid: session.user.id },
      data: { resumeFileUrl: null }
    })

    return NextResponse.json({
      success: true,
      message: 'Resume removed successfully'
    })

  } catch (error) {
    console.error('Error removing resume:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to remove resume' },
      { status: 500 }
    )
  }
}