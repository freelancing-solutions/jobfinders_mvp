import { NextRequest, NextResponse } from 'next/server';
import { metricsCollector } from '@/lib/monitoring/metrics-collector';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    const metrics = metricsCollector.getMetrics();
    const duration = Date.now() - startTime;

    // Record the metrics request itself
    metricsCollector.recordHttpRequest(
      'GET',
      '/api/metrics',
      200,
      duration / 1000
    );

    // Set appropriate headers for Prometheus
    const headers = new Headers({
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      'Cache-Control': 'no-cache'
    });

    return new NextResponse(metrics, {
      status: 200,
      headers
    });

  } catch (error) {
    logger.error('Failed to generate metrics', { error });

    metricsCollector.recordHttpRequest(
      'GET',
      '/api/metrics',
      500,
      0
    );

    return NextResponse.json(
      { error: 'Failed to generate metrics' },
      { status: 500 }
    );
  }
}