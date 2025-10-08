import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getRealtimeEventService } from '@/services/integration/realtime-events';
import { Logger } from '@/lib/logger';

const logger = new Logger('API-Realtime-Events');

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, data, targetUserId } = body;

    if (!type) {
      return NextResponse.json(
        { error: 'Missing required field: type' },
        { status: 400 }
      );
    }

    const realtimeService = getRealtimeEventService();
    if (!realtimeService) {
      return NextResponse.json(
        { error: 'Real-time service not available' },
        { status: 503 }
      );
    }

    // Send event
    await realtimeService.publishEvent({
      type,
      data,
      userId: targetUserId // If not specified, it's a broadcast
    });

    return NextResponse.json({
      success: true,
      message: 'Event published successfully'
    });

  } catch (error) {
    logger.error('Error publishing event:', error);
    return NextResponse.json(
      { error: 'Failed to publish event' },
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

    const realtimeService = getRealtimeEventService();
    if (!realtimeService) {
      return NextResponse.json(
        { error: 'Real-time service not available' },
        { status: 503 }
      );
    }

    const stats = await realtimeService.getStats();

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Error getting real-time stats:', error);
    return NextResponse.json(
      { error: 'Failed to get stats' },
      { status: 500 }
    );
  }
}