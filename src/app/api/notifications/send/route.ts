import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NotificationIntegrationService } from '@/services/integration/notification-integration';
import { Logger } from '@/lib/logger';

const logger = new Logger('API-Notifications-Send');

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, title, message, data, channels, scheduledFor, priority } = body;

    if (!type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: type, title, message' },
        { status: 400 }
      );
    }

    const notificationService = new NotificationIntegrationService();
    const notification = await notificationService.sendNotification({
      userId: session.user.id,
      type,
      title,
      message,
      data,
      channels,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      priority
    });

    return NextResponse.json({
      success: true,
      data: notification
    });

  } catch (error) {
    logger.error('Error sending notification:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send notification' },
      { status: 500 }
    );
  }
}