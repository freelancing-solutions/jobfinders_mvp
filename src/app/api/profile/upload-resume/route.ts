import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
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

    const formData = await request.formData()
    const file = formData.get('resume') as File

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only PDF and Word documents are allowed' },
        { status: 400 }
      )
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 5MB' },
        { status: 400 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads', 'resumes')
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const fileName = `${session.user.id}_${timestamp}.${fileExtension}`
    const filePath = path.join(uploadsDir, fileName)

    // Save file to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Create resume URL
    const resumeUrl = `/uploads/resumes/${fileName}`

    // Update or create job seeker profile with resume URL
    const existingProfile = await db.jobSeekerProfile.findUnique({
      where: { userUid: session.user.id }
    })

    if (existingProfile) {
      // Update existing profile
      await db.jobSeekerProfile.update({
        where: { userUid: session.user.id },
        data: { resumeFileUrl: resumeUrl }
      })
    } else {
      // Create new profile with resume
      await db.jobSeekerProfile.create({
        data: {
          userUid: session.user.id,
          resumeFileUrl: resumeUrl,
          currency: 'ZAR'
        }
      })
    }

    return NextResponse.json({
      success: true,
      resumeUrl,
      message: 'Resume uploaded successfully'
    })

  } catch (error) {
    console.error('Error uploading resume:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload resume' },
      { status: 500 }
    )
  }
}