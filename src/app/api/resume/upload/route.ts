import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ResumeIntegrationService } from '@/services/integration/resume-integration';
import { Logger } from '@/lib/logger';

const logger = new Logger('API-Resume-Upload');

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const resumeName = formData.get('name') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const resumeService = new ResumeIntegrationService();
    const result = await resumeService.uploadResume(
      session.user.id,
      file,
      resumeName
    );

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Error uploading resume:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload resume' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resumeService = new ResumeIntegrationService();
    const resumes = await resumeService.getUserResumes(session.user.id);

    return NextResponse.json({
      success: true,
      data: resumes
    });

  } catch (error) {
    logger.error('Error getting user resumes:', error);
    return NextResponse.json(
      { error: 'Failed to get resumes' },
      { status: 500 }
    );
  }
}