import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { resumeBuilder } from '@/services/resume-builder'

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
    const { resumeId, templateId, customization } = body

    if (!resumeId || !templateId) {
      return NextResponse.json(
        { success: false, error: 'Resume ID and template ID are required' },
        { status: 400 }
      )
    }

    const templateRequest = {
      resumeId,
      templateId,
      userId: session.user.id,
      customization
    }

    const updatedResume = await resumeBuilder.applyTemplate(templateRequest)

    return NextResponse.json({
      success: true,
      data: updatedResume,
      message: 'Template applied successfully'
    })

  } catch (error) {
    console.error('Error applying template:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to apply template' },
      { status: 500 }
    )
  }
}

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
    const jobTitle = searchParams.get('jobTitle') || undefined
    const industry = searchParams.get('industry') || undefined
    const experienceLevel = searchParams.get('experienceLevel') || undefined
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get template recommendations
    const recommendations = await resumeBuilder.getTemplateRecommendations({
      userId: session.user.id,
      jobTitle,
      industry,
      experienceLevel,
      limit
    })

    return NextResponse.json({
      success: true,
      data: recommendations
    })

  } catch (error) {
    console.error('Error getting template recommendations:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get template recommendations' },
      { status: 500 }
    )
  }
}