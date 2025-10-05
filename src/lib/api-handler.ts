import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema } from 'zod';

export interface APIHandlerConfig {
  requireAuth?: boolean;
  requiredSubscription?: string[];
  validateRequest?: ZodSchema;
}

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public data?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export async function apiHandler(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<Response>,
  config: APIHandlerConfig = {}
) {
  try {
    // Validate request body if schema provided
    if (config.validateRequest && req.method !== 'GET') {
      const body = await req.json();
      config.validateRequest.parse(body);
    }

    // Execute handler
    const response = await handler(req);
    return response;

  } catch (error) {
    console.error('API Error:', error);

    if (error instanceof APIError) {
      return NextResponse.json(
        { error: error.message, data: error.data },
        { status: error.statusCode }
      );
    }

    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      const zodError = error as any;
      return NextResponse.json(
        { error: 'Validation error', issues: zodError.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
