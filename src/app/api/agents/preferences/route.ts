import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { ContextManager } from '@/services/agents/orchestration/context-manager';
import { AgentType } from '@/types/agents';

// Initialize services
const contextManager = new ContextManager();

// Request schema validation
const UpdatePreferencesSchema = z.object({
  agentPreferences: z.record(z.object({
    enabled: z.boolean(),
    frequency: z.enum(['real-time', 'daily', 'weekly', 'on-demand']),
    customizations: z.record(z.any()).optional(),
    feedbackHistory: z.array(z.object({
      rating: z.number(),
      comment: z.string().optional(),
      timestamp: z.date(),
      interactionType: z.string()
    })).optional()
  })).optional(),
  communicationStyle: z.enum(['formal', 'casual', 'friendly']).optional(),
  responseLength: z.enum(['concise', 'detailed', 'comprehensive']).optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
  notifications: z.object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    inApp: z.boolean().optional(),
    frequency: z.enum(['immediate', 'daily', 'weekly']).optional(),
    categories: z.record(z.boolean()).optional()
  }).optional(),
  privacy: z.object({
    dataSharing: z.boolean().optional(),
    analytics: z.boolean().optional(),
    personalization: z.boolean().optional(),
    thirdPartyIntegrations: z.boolean().optional(),
    dataRetention: z.enum(['30days', '90days', '1year', 'forever']).optional()
  }).optional()
});

/**
 * GET /api/agents/preferences - Get user agent preferences
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.email; // Simplified - should use actual user ID

    // Get user preferences
    const userPreferences = await contextManager.getUserPreferences(userId);

    if (!userPreferences) {
      // Return default preferences if none exist
      return NextResponse.json({
        userId,
        agentPreferences: {},
        communicationStyle: 'friendly',
        responseLength: 'detailed',
        language: 'en',
        timezone: 'UTC',
        notifications: {
          email: true,
          push: true,
          inApp: true,
          frequency: 'daily',
          categories: {}
        },
        privacy: {
          dataSharing: true,
          analytics: true,
          personalization: true,
          thirdPartyIntegrations: false,
          dataRetention: '1year'
        },
        isDefault: true
      });
    }

    return NextResponse.json(userPreferences);

  } catch (error) {
    console.error('Error getting user preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/agents/preferences - Update user agent preferences
 */
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.email; // Simplified - should use actual user ID

    // Parse and validate request body
    const body = await request.json();
    const validation = UpdatePreferencesSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: validation.error.errors
        },
        { status: 400 }
      );
    }

    const preferences = validation.data;

    // Update user preferences
    await contextManager.updateUserPreferences(userId, preferences);

    // Get updated preferences
    const updatedPreferences = await contextManager.getUserPreferences(userId);

    return NextResponse.json({
      ...updatedPreferences,
      updated: true,
      updatedAt: new Date()
    });

  } catch (error) {
    console.error('Error updating user preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agents/preferences/reset - Reset preferences to defaults
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.email; // Simplified - should use actual user ID

    // Get the action from the URL
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (pathname.endsWith('/reset')) {
      // Reset preferences to defaults
      const defaultPreferences = {
        agentPreferences: {},
        communicationStyle: 'friendly',
        responseLength: 'detailed',
        language: 'en',
        timezone: 'UTC',
        notifications: {
          email: true,
          push: true,
          inApp: true,
          frequency: 'daily',
          categories: {}
        },
        privacy: {
          dataSharing: true,
          analytics: true,
          personalization: true,
          thirdPartyIntegrations: false,
          dataRetention: '1year'
        }
      };

      await contextManager.updateUserPreferences(userId, defaultPreferences);

      return NextResponse.json({
        message: 'Preferences reset to defaults',
        preferences: defaultPreferences,
        resetAt: new Date()
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error resetting preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}