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
    const { resumeId, format, options } = body

    if (!resumeId) {
      return NextResponse.json(
        { success: false, error: 'Resume ID is required' },
        { status: 400 }
      )
    }

    if (!format || !['pdf', 'docx', 'html', 'txt'].includes(format)) {
      return NextResponse.json(
        { success: false, error: 'Invalid format. Supported formats: pdf, docx, html, txt' },
        { status: 400 }
      )
    }

    const exportOptions = {
      format,
      includeAnalytics: options?.includeAnalytics || false,
      watermark: options?.watermark || false,
      ...options
    }

    const exportResult = await resumeBuilder.exportResume(resumeId, session.user.id, exportOptions)

    // Handle different export formats
    if (format === 'pdf') {
      // Return PDF as blob
      const buffer = Buffer.from(exportResult.data, 'base64')
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="resume-${Date.now()}.pdf"`
        }
      })
    } else if (format === 'docx') {
      // Return DOCX as blob
      const buffer = Buffer.from(exportResult.data, 'base64')
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="resume-${Date.now()}.docx"`
        }
      })
    } else {
      // Return JSON response for HTML/TXT
      return NextResponse.json({
        success: true,
        data: exportResult,
        message: 'Resume exported successfully'
      })
    }

  } catch (error) {
    console.error('Error exporting resume:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to export resume' },
      { status: 500 }
    )
  }
}