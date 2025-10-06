import { Pool } from 'pg';
import { createClient } from 'redis';
import { metricsCollector } from './metrics-collector';
import { logger } from '@/lib/logger';

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  services: ServiceHealth[];
  uptime: number;
  version: string;
  memoryUsage: NodeJS.MemoryUsage;
}

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  error?: string;
  details?: Record<string, any>;
}

export class HealthChecker {
  private startTime: number;
  private pgPool: Pool;
  private redisClient: any;

  constructor(pgPool: Pool, redisClient: any) {
    this.startTime = Date.now();
    this.pgPool = pgPool;
    this.redisClient = redisClient;
  }

  async performHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const services: ServiceHealth[] = [];

    // Check Database
    services.push(await this.checkDatabase());

    // Check Redis
    services.push(await this.checkRedis());

    // Check Memory
    services.push(await this.checkMemory());

    // Check Disk Space
    services.push(await this.checkDiskSpace());

    // Check External APIs
    services.push(await this.checkExternalAPIs());

    // Determine overall status
    const overallStatus = this.determineOverallStatus(services);

    // Record metrics
    const duration = Date.now() - startTime;
    metricsCollector.recordHttpRequest('GET', '/api/health',
      overallStatus === 'healthy' ? 200 : 503, duration / 1000);

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services,
      uptime: Date.now() - this.startTime,
      version: process.env.npm_package_version || '1.0.0',
      memoryUsage: process.memoryUsage()
    };
  }

  private async checkDatabase(): Promise<ServiceHealth> {
    const startTime = Date.now();

    try {
      const result = await this.pgPool.query('SELECT 1');
      const responseTime = Date.now() - startTime;

      // Check connection pool status
      const totalCount = this.pgPool.totalCount;
      const idleCount = this.pgPool.idleCount;
      const waitingCount = this.pgPool.waitingCount;

      if (waitingCount > 10) {
        return {
          name: 'database',
          status: 'degraded',
          responseTime,
          details: {
            totalCount,
            idleCount,
            waitingCount,
            warning: 'High number of waiting connections'
          }
        };
      }

      metricsCollector.setDatabaseConnections(totalCount);

      return {
        name: 'database',
        status: 'healthy',
        responseTime,
        details: {
          totalCount,
          idleCount,
          waitingCount
        }
      };

    } catch (error) {
      logger.error('Database health check failed', { error });
      return {
        name: 'database',
        status: 'unhealthy',
        error: error.message,
        responseTime: Date.now() - startTime
      };
    }
  }

  private async checkRedis(): Promise<ServiceHealth> {
    const startTime = Date.now();

    try {
      await this.redisClient.ping();
      const responseTime = Date.now() - startTime;

      // Get Redis info
      const info = await this.redisClient.info('memory');
      const memoryUsage = this.parseRedisMemoryInfo(info);

      if (memoryUsage.usedPercentage > 90) {
        return {
          name: 'redis',
          status: 'degraded',
          responseTime,
          details: {
            memoryUsage,
            warning: 'High memory usage'
          }
        };
      }

      return {
        name: 'redis',
        status: 'healthy',
        responseTime,
        details: { memoryUsage }
      };

    } catch (error) {
      logger.error('Redis health check failed', { error });
      return {
        name: 'redis',
        status: 'unhealthy',
        error: error.message,
        responseTime: Date.now() - startTime
      };
    }
  }

  private async checkMemory(): Promise<ServiceHealth> {
    const memUsage = process.memoryUsage();
    const totalMem = memUsage.heapTotal;
    const usedMem = memUsage.heapUsed;
    const usagePercentage = (usedMem / totalMem) * 100;

    metricsCollector.setMemoryUsage('heap', usedMem);
    metricsCollector.setMemoryUsage('external', memUsage.external);
    metricsCollector.setMemoryUsage('rss', memUsage.rss);

    if (usagePercentage > 90) {
      return {
        name: 'memory',
        status: 'unhealthy',
        details: {
          heapUsed: Math.round(usedMem / 1024 / 1024),
          heapTotal: Math.round(totalMem / 1024 / 1024),
          usagePercentage: Math.round(usagePercentage)
        }
      };
    }

    if (usagePercentage > 80) {
      return {
        name: 'memory',
        status: 'degraded',
        details: {
          heapUsed: Math.round(usedMem / 1024 / 1024),
          heapTotal: Math.round(totalMem / 1024 / 1024),
          usagePercentage: Math.round(usagePercentage)
        }
      };
    }

    return {
      name: 'memory',
      status: 'healthy',
      details: {
        heapUsed: Math.round(usedMem / 1024 / 1024),
        heapTotal: Math.round(totalMem / 1024 / 1024),
        usagePercentage: Math.round(usagePercentage)
      }
    };
  }

  private async checkDiskSpace(): Promise<ServiceHealth> {
    try {
      const fs = require('fs');
      const stats = fs.statSync('.');

      // Simple check - in production you'd want to check actual disk usage
      return {
        name: 'disk',
        status: 'healthy',
        details: {
          path: process.cwd(),
          accessible: true
        }
      };

    } catch (error) {
      return {
        name: 'disk',
        status: 'unhealthy',
        error: 'Cannot access disk'
      };
    }
  }

  private async checkExternalAPIs(): Promise<ServiceHealth> {
    const startTime = Date.now();
    const results = [];

    // Check OpenAI API
    try {
      if (process.env.OPENAI_API_KEY) {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
          },
          signal: AbortSignal.timeout(5000)
        });

        if (response.ok) {
          results.push({ name: 'openai', status: 'healthy' });
        } else {
          results.push({ name: 'openai', status: 'unhealthy', error: response.statusText });
        }
      } else {
        results.push({ name: 'openai', status: 'degraded', error: 'API key not configured' });
      }
    } catch (error) {
      results.push({ name: 'openai', status: 'unhealthy', error: error.message });
    }

    // Check email service
    try {
      // Simple health check - in production you'd check your email service
      results.push({ name: 'email', status: 'healthy' });
    } catch (error) {
      results.push({ name: 'email', status: 'unhealthy', error: error.message });
    }

    const responseTime = Date.now() - startTime;
    const unhealthyCount = results.filter(r => r.status === 'unhealthy').length;

    return {
      name: 'external_apis',
      status: unhealthyCount > 0 ? 'unhealthy' : 'healthy',
      responseTime,
      details: { services: results }
    };
  }

  private parseRedisMemoryInfo(info: string): any {
    const lines = info.split('\r\n');
    const memoryData: any = {};

    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        memoryData[key] = value;
      }
    }

    const usedMemory = parseInt(memoryData['used_memory']) || 0;
    const maxMemory = parseInt(memoryData['maxmemory']) || 0;

    return {
      used: Math.round(usedMemory / 1024 / 1024),
      max: Math.round(maxMemory / 1024 / 1024),
      usedPercentage: maxMemory > 0 ? (usedMemory / maxMemory) * 100 : 0
    };
  }

  private determineOverallStatus(services: ServiceHealth[]): 'healthy' | 'unhealthy' | 'degraded' {
    const unhealthyServices = services.filter(s => s.status === 'unhealthy');
    const degradedServices = services.filter(s => s.status === 'degraded');

    if (unhealthyServices.length > 0) {
      return 'unhealthy';
    }

    if (degradedServices.length > 0) {
      return 'degraded';
    }

    return 'healthy';
  }

  async performLivenessCheck(): Promise<{ status: string, timestamp: string }> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString()
    };
  }

  async performReadinessCheck(): Promise<{ status: string, timestamp: string, checks: any }> {
    const dbCheck = await this.checkDatabase();
    const redisCheck = await this.checkRedis();

    const checks = {
      database: dbCheck.status === 'healthy',
      redis: redisCheck.status === 'healthy'
    };

    const ready = Object.values(checks).every(check => check === true);

    return {
      status: ready ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      checks
    };
  }
}