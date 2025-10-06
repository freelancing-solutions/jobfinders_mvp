import { register, Counter, Histogram, Gauge, Registry } from 'prom-client';
import { logger } from '@/lib/logger';

export class MetricsCollector {
  private registry: Registry;
  private httpRequestsTotal: Counter<string>;
  private httpRequestDuration: Histogram<string>;
  private activeConnections: Gauge<string>;
  private memoryUsage: Gauge<string>;
  private cpuUsage: Gauge<string>;
  private databaseConnections: Gauge<string>;
  private cacheHitRate: Gauge<string>;
  private jobMatchingTotal: Counter<string>;
  private jobMatchingErrors: Counter<string>;
  private userSessions: Gauge<string>;
  private fileUploadsTotal: Counter<string>;
  private aiRequestsTotal: Counter<string>;
  private aiResponseTime: Histogram<string>;

  constructor() {
    this.registry = new Registry();
    this.initializeMetrics();
  }

  private initializeMetrics() {
    // HTTP Metrics
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status'],
      registers: [this.registry]
    });

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
      registers: [this.registry]
    });

    // Connection Metrics
    this.activeConnections = new Gauge({
      name: 'websocket_connections_active',
      help: 'Number of active WebSocket connections',
      registers: [this.registry]
    });

    // System Metrics
    this.memoryUsage = new Gauge({
      name: 'memory_usage_bytes',
      help: 'Memory usage in bytes',
      labelNames: ['type'],
      registers: [this.registry]
    });

    this.cpuUsage = new Gauge({
      name: 'cpu_usage_percent',
      help: 'CPU usage percentage',
      registers: [this.registry]
    });

    // Database Metrics
    this.databaseConnections = new Gauge({
      name: 'database_connections_active',
      help: 'Number of active database connections',
      registers: [this.registry]
    });

    // Cache Metrics
    this.cacheHitRate = new Gauge({
      name: 'cache_hit_rate',
      help: 'Cache hit rate percentage',
      registers: [this.registry]
    });

    // Business Metrics
    this.jobMatchingTotal = new Counter({
      name: 'job_matching_total',
      help: 'Total number of job matching operations',
      labelNames: ['status'],
      registers: [this.registry]
    });

    this.jobMatchingErrors = new Counter({
      name: 'job_matching_errors_total',
      help: 'Total number of job matching errors',
      labelNames: ['error_type'],
      registers: [this.registry]
    });

    this.userSessions = new Gauge({
      name: 'user_sessions_active',
      help: 'Number of active user sessions',
      registers: [this.registry]
    });

    this.fileUploadsTotal = new Counter({
      name: 'file_uploads_total',
      help: 'Total number of file uploads',
      labelNames: ['status', 'file_type'],
      registers: [this.registry]
    });

    // AI Metrics
    this.aiRequestsTotal = new Counter({
      name: 'ai_requests_total',
      help: 'Total number of AI requests',
      labelNames: ['model', 'status'],
      registers: [this.registry]
    });

    this.aiResponseTime = new Histogram({
      name: 'ai_response_duration_seconds',
      help: 'AI response time in seconds',
      labelNames: ['model'],
      buckets: [0.5, 1, 2, 5, 10, 20, 30, 60],
      registers: [this.registry]
    });
  }

  // HTTP Metrics
  recordHttpRequest(method: string, route: string, status: number, duration: number) {
    this.httpRequestsTotal
      .labels(method, route, status.toString())
      .inc();

    this.httpRequestDuration
      .labels(method, route, status.toString())
      .observe(duration);
  }

  // Connection Metrics
  incrementActiveConnections() {
    this.activeConnections.inc();
  }

  decrementActiveConnections() {
    this.activeConnections.dec();
  }

  // System Metrics
  setMemoryUsage(type: string, bytes: number) {
    this.memoryUsage.labels(type).set(bytes);
  }

  setCPUUsage(percentage: number) {
    this.cpuUsage.set(percentage);
  }

  // Database Metrics
  setDatabaseConnections(count: number) {
    this.databaseConnections.set(count);
  }

  // Cache Metrics
  setCacheHitRate(percentage: number) {
    this.cacheHitRate.set(percentage);
  }

  // Business Metrics
  recordJobMatching(status: 'success' | 'failure') {
    this.jobMatchingTotal.labels(status).inc();
  }

  recordJobMatchingError(errorType: string) {
    this.jobMatchingErrors.labels(errorType).inc();
  }

  setActiveUserSessions(count: number) {
    this.userSessions.set(count);
  }

  recordFileUpload(status: 'success' | 'failure', fileType: string) {
    this.fileUploadsTotal.labels(status, fileType).inc();
  }

  // AI Metrics
  recordAIRequest(model: string, status: 'success' | 'failure', duration: number) {
    this.aiRequestsTotal.labels(model, status).inc();
    this.aiResponseTime.labels(model).observe(duration);
  }

  // Custom Metrics
  incrementCounter(name: string, labels: Record<string, string> = {}) {
    try {
      const counter = new Counter({
        name,
        help: `Custom counter metric: ${name}`,
        labelNames: Object.keys(labels),
        registers: [this.registry]
      });
      counter.labels(...Object.values(labels)).inc();
    } catch (error) {
      logger.error(`Failed to increment counter ${name}`, { error, labels });
    }
  }

  setGauge(name: string, value: number, labels: Record<string, string> = {}) {
    try {
      const gauge = new Gauge({
        name,
        help: `Custom gauge metric: ${name}`,
        labelNames: Object.keys(labels),
        registers: [this.registry]
      });
      gauge.labels(...Object.values(labels)).set(value);
    } catch (error) {
      logger.error(`Failed to set gauge ${name}`, { error, labels, value });
    }
  }

  recordHistogram(name: string, value: number, labels: Record<string, string> = {}) {
    try {
      const histogram = new Histogram({
        name,
        help: `Custom histogram metric: ${name}`,
        labelNames: Object.keys(labels),
        registers: [this.registry]
      });
      histogram.labels(...Object.values(labels)).observe(value);
    } catch (error) {
      logger.error(`Failed to record histogram ${name}`, { error, labels, value });
    }
  }

  // Get metrics for Prometheus scraping
  getMetrics() {
    return this.registry.metrics();
  }

  // Get registry for custom metrics
  getRegistry(): Registry {
    return this.registry;
  }

  // Reset all metrics (useful for testing)
  reset() {
    this.registry.clear();
    this.initializeMetrics();
  }

  // Health check for metrics collector
  isHealthy(): boolean {
    try {
      // Try to get metrics to ensure the registry is working
      this.getMetrics();
      return true;
    } catch (error) {
      logger.error('Metrics collector health check failed', { error });
      return false;
    }
  }
}

// Singleton instance
export const metricsCollector = new MetricsCollector();