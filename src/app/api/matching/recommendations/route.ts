import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MatchingIntegrationService } from '@/services/integration/matching-integration';
import { Logger } from '@/lib/logger';

const logger = new Logger('API-Matching-Recommendations');

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    // Parse filters from query params
    const filters: any = {};
    if (searchParams.get('location')) filters.location = searchParams.get('location');
    if (searchParams.get('salaryMin')) filters.salaryMin = parseInt(searchParams.get('salaryMin')!);
    if (searchParams.get('salaryMax')) filters.salaryMax = parseInt(searchParams.get('salaryMax')!);
    if (searchParams.get('experienceLevel')) filters.experienceLevel = searchParams.get('experienceLevel');
    if (searchParams.get('remote')) filters.remote = searchParams.get('remote') === 'true';
    if (searchParams.get('skills')) filters.skills = searchParams.get('skills')!.split(',');
    if (searchParams.get('company')) filters.company = searchParams.get('company');

    const matchingService = new MatchingIntegrationService();
    const recommendations = await matchingService.getJobRecommendations(
      session.user.id,
      Object.keys(filters).length > 0 ? filters : undefined,
      limit
    );

    return NextResponse.json({
      success: true,
      data: recommendations,
      count: recommendations.length
    });

  } catch (error) {
    logger.error('Error getting job recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to get job recommendations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { jobId, feedback, reason } = body;

    if (!jobId || !feedback) {
      return NextResponse.json(
        { error: 'Missing required fields: jobId, feedback' },
        { status: 400 }
      );
    }

    const matchingService = new MatchingIntegrationService();
    await matchingService.updateMatchFeedback(
      session.user.id,
      jobId,
      feedback,
      reason
    );

    return NextResponse.json({
      success: true,
      message: 'Feedback updated successfully'
    });

  } catch (error) {
    logger.error('Error updating match feedback:', error);
    return NextResponse.json(
      { error: 'Failed to update feedback' },
      { status: 500 }
    );
  }
}