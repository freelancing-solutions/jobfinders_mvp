import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { resumeBuilder } from '@/services/resume-builder'

export async function GET(request: NextRequest) {
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
        { success: false, error: 'Access denied. Resume builder is only available to job seekers.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const resumeId = searchParams.get('resumeId')

    if (resumeId) {
      // Get specific resume
      const resume = await resumeBuilder.getResume(resumeId, session.user.id)
      return NextResponse.json({
        success: true,
        data: resume
      })
    } else {
      // Get all user resumes
      const resumes = await resumeBuilder.getUserResumes(session.user.id, limit)
      return NextResponse.json({
        success: true,
        data: resumes
      })
    }

  } catch (error) {
    console.error('Error fetching resumes:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch resumes' },
      { status: 500 }
    )
  }
}

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
        { success: false, error: 'Access denied. Resume builder is only available to job seekers.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { personalInfo, targetJobTitle, targetIndustry, experienceLevel, templateId } = body

    // Validate required fields
    if (!personalInfo || !personalInfo.fullName || !personalInfo.email || !personalInfo.phone) {
      return NextResponse.json(
        { success: false, error: 'Personal information (full name, email, phone) is required' },
        { status: 400 }
      )
    }

    const createRequest = {
      userId: session.user.id,
      personalInfo,
      targetJobTitle,
      targetIndustry,
      experienceLevel,
      templateId
    }

    const resume = await resumeBuilder.createResume(createRequest)

    return NextResponse.json({
      success: true,
      data: resume,
      message: 'Resume created successfully'
    })

  } catch (error) {
    console.error('Error creating resume:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create resume' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
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
        { success: false, error: 'Access denied. Resume builder is only available to job seekers.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { resumeId, updates } = body

    if (!resumeId) {
      return NextResponse.json(
        { success: false, error: 'Resume ID is required' },
        { status: 400 }
      )
    }

    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No updates provided' },
        { status: 400 }
      )
    }

    const updateRequest = {
      resumeId,
      userId: session.user.id,
      updates
    }

    const resume = await resumeBuilder.updateResume(updateRequest)

    return NextResponse.json({
      success: true,
      data: resume,
      message: 'Resume updated successfully'
    })

  } catch (error) {
    console.error('Error updating resume:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update resume' },
      { status: 500 }
    )
  }
}

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
        { success: false, error: 'Access denied. Resume builder is only available to job seekers.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const resumeId = searchParams.get('resumeId')

    if (!resumeId) {
      return NextResponse.json(
        { success: false, error: 'Resume ID is required' },
        { status: 400 }
      )
    }

    const success = await resumeBuilder.deleteResume(resumeId, session.user.id)

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Resume deleted successfully'
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Resume not found or cannot be deleted' },
        { status: 404 }
      )
    }

  } catch (error) {
    console.error('Error deleting resume:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete resume' },
      { status: 500 }
    )
  }
}