/**
 * Matching System Load Testing
 * Tests the performance and scalability of the matching system under load
 */

import { load } from 'cheerio';
import { performance } from 'perf_hooks';
import { PrismaClient } from '@prisma/client';

// Test configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3010';
const CONCURRENT_USERS = parseInt(process.env.CONCURRENT_USERS || '50');
const TEST_DURATION = parseInt(process.env.TEST_DURATION || '60000'); // 60 seconds
const WARMUP_DURATION = 10000; // 10 seconds

interface LoadTestResult {
  totalTime: number;
  requestsPerSecond: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
  successfulRequests: number;
  failedRequests: number;
  totalRequests: number;
}

interface RequestMetrics {
  url: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: number;
  success: boolean;
  error?: string;
}

describe('Matching System Load Testing', () => {
  let prisma: PrismaClient;
  let testResults: LoadTestResult[] = [];

  beforeAll(async () => {
    prisma = new PrismaClient();

    // Setup test data
    await setupTestData();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('API Endpoint Performance', () => {
    it('should handle concurrent matching requests', async () => {
      const result = await runLoadTest({
        name: 'Concurrent Matching Requests',
        concurrentUsers: CONCURRENT_USERS,
        duration: TEST_DURATION,
        testFunction: simulateMatchingRequest,
      });

      testResults.push(result);

      // Performance assertions
      expect(result.averageResponseTime).toBeLessThan(2000); // 2 seconds
      expect(result.p95ResponseTime).toBeLessThan(5000); // 5 seconds
      expect(result.errorRate).toBeLessThan(0.05); // 5% error rate
      expect(result.requestsPerSecond).toBeGreaterThan(10);

      console.log(`Concurrent Matching Results:
        - RPS: ${result.requestsPerSecond.toFixed(2)}
        - Avg Response: ${result.averageResponseTime.toFixed(2)}ms
        - P95 Response: ${result.p95ResponseTime.toFixed(2)}ms
        - Error Rate: ${(result.errorRate * 100).toFixed(2)}%`);
    }, TEST_DURATION + 30000);

    it('should handle batch matching operations', async () => {
      const result = await runLoadTest({
        name: 'Batch Matching Operations',
        concurrentUsers: Math.min(CONCURRENT_USERS, 20), // Fewer users for batch ops
        duration: TEST_DURATION,
        testFunction: simulateBatchMatchingRequest,
      });

      testResults.push(result);

      // Batch operations can be slower but should still be reasonable
      expect(result.averageResponseTime).toBeLessThan(10000); // 10 seconds
      expect(result.errorRate).toBeLessThan(0.02); // 2% error rate

      console.log(`Batch Matching Results:
        - RPS: ${result.requestsPerSecond.toFixed(2)}
        - Avg Response: ${result.averageResponseTime.toFixed(2)}ms
        - P95 Response: ${result.p95ResponseTime.toFixed(2)}ms`);
    }, TEST_DURATION + 30000);

    it('should handle recommendation requests', async () => {
      const result = await runLoadTest({
        name: 'Recommendation Requests',
        concurrentUsers: CONCURRENT_USERS,
        duration: TEST_DURATION,
        testFunction: simulateRecommendationRequest,
      });

      testResults.push(result);

      expect(result.averageResponseTime).toBeLessThan(3000); // 3 seconds
      expect(result.p95ResponseTime).toBeLessThan(8000); // 8 seconds
      expect(result.errorRate).toBeLessThan(0.05);

      console.log(`Recommendation Results:
        - RPS: ${result.requestsPerSecond.toFixed(2)}
        - Avg Response: ${result.averageResponseTime.toFixed(2)}ms
        - P95 Response: ${result.p95ResponseTime.toFixed(2)}ms`);
    }, TEST_DURATION + 30000);

    it('should handle profile analysis requests', async () => {
      const result = await runLoadTest({
        name: 'Profile Analysis Requests',
        concurrentUsers: Math.min(CONCURRENT_USERS, 30),
        duration: TEST_DURATION,
        testFunction: simulateProfileAnalysisRequest,
      });

      testResults.push(result);

      expect(result.averageResponseTime).toBeLessThan(5000); // 5 seconds
      expect(result.errorRate).toBeLessThan(0.03);

      console.log(`Profile Analysis Results:
        - RPS: ${result.requestsPerSecond.toFixed(2)}
        - Avg Response: ${result.averageResponseTime.toFixed(2)}ms
        - P95 Response: ${result.p95ResponseTime.toFixed(2)}ms`);
    }, TEST_DURATION + 30000);
  });

  describe('Database Performance', () => {
    it('should handle concurrent database operations', async () => {
      const result = await runDatabaseLoadTest({
        name: 'Concurrent Database Operations',
        concurrentConnections: CONCURRENT_USERS,
        duration: TEST_DURATION,
        testFunction: simulateDatabaseOperations,
      });

      testResults.push(result);

      expect(result.averageResponseTime).toBeLessThan(1000); // 1 second for DB ops
      expect(result.errorRate).toBeLessThan(0.01); // 1% error rate

      console.log(`Database Performance Results:
        - RPS: ${result.requestsPerSecond.toFixed(2)}
        - Avg Response: ${result.averageResponseTime.toFixed(2)}ms
        - P95 Response: ${result.p95ResponseTime.toFixed(2)}ms`);
    }, TEST_DURATION + 30000);

    it('should handle complex query operations', async () => {
      const result = await runDatabaseLoadTest({
        name: 'Complex Query Operations',
        concurrentConnections: Math.min(CONCURRENT_USERS, 20),
        duration: TEST_DURATION,
        testFunction: simulateComplexQueries,
      });

      testResults.push(result);

      expect(result.averageResponseTime).toBeLessThan(3000); // 3 seconds for complex queries
      expect(result.errorRate).toBeLessThan(0.02);

      console.log(`Complex Query Results:
        - RPS: ${result.requestsPerSecond.toFixed(2)}
        - Avg Response: ${result.averageResponseTime.toFixed(2)}ms
        - P95 Response: ${result.p95ResponseTime.toFixed(2)}ms`);
    }, TEST_DURATION + 30000);
  });

  describe('Cache Performance', () => {
    it('should handle high cache hit rates', async () => {
      const result = await runCacheLoadTest({
        name: 'Cache Performance Test',
        concurrentUsers: CONCURRENT_USERS * 2, // More users for cache testing
        duration: TEST_DURATION,
        testFunction: simulateCacheOperations,
      });

      testResults.push(result);

      expect(result.averageResponseTime).toBeLessThan(500); // Very fast for cached data
      expect(result.errorRate).toBeLessThan(0.01);

      console.log(`Cache Performance Results:
        - RPS: ${result.requestsPerSecond.toFixed(2)}
        - Avg Response: ${result.averageResponseTime.toFixed(2)}ms
        - P95 Response: ${result.p95ResponseTime.toFixed(2)}ms`);
    }, TEST_DURATION + 30000);

    it('should handle cache misses gracefully', async () => {
      const result = await runCacheLoadTest({
        name: 'Cache Miss Performance',
        concurrentUsers: CONCURRENT_USERS,
        duration: TEST_DURATION,
        testFunction: simulateCacheMisses,
      });

      testResults.push(result);

      expect(result.averageResponseTime).toBeLessThan(2000); // Slower but still acceptable
      expect(result.errorRate).toBeLessThan(0.05);

      console.log(`Cache Miss Results:
        - RPS: ${result.requestsPerSecond.toFixed(2)}
        - Avg Response: ${result.averageResponseTime.toFixed(2)}ms
        - P95 Response: ${result.p95ResponseTime.toFixed(2)}ms`);
    }, TEST_DURATION + 30000);
  });

  describe('Memory and Resource Usage', () => {
    it('should maintain stable memory usage under load', async () => {
      const initialMemory = process.memoryUsage();
      const memorySnapshots: NodeJS.MemoryUsage[] = [];

      const monitorMemory = setInterval(() => {
        memorySnapshots.push(process.memoryUsage());
      }, 5000);

      // Run load test
      await runLoadTest({
        name: 'Memory Usage Test',
        concurrentUsers: CONCURRENT_USERS,
        duration: TEST_DURATION,
        testFunction: simulateMixedRequests,
      });

      clearInterval(monitorMemory);

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreasePercent = (memoryIncrease / initialMemory.heapUsed) * 100;

      console.log(`Memory Usage:
        - Initial: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)} MB
        - Final: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)} MB
        - Increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB (${memoryIncreasePercent.toFixed(2)}%)`);

      // Memory increase should be reasonable (< 50%)
      expect(memoryIncreasePercent).toBeLessThan(50);

      // Check for memory leaks (memory should stabilize)
      if (memorySnapshots.length > 3) {
        const recentMemory = memorySnapshots.slice(-3);
        const isStabilizing = recentMemory.every((snapshot, index) => {
          if (index === 0) return true;
          const diff = Math.abs(snapshot.heapUsed - recentMemory[index - 1].heapUsed);
          const percentDiff = (diff / recentMemory[index - 1].heapUsed) * 100;
          return percentDiff < 10; // Less than 10% variation
        });

        expect(isStabilizing).toBe(true);
      }
    }, TEST_DURATION + 40000);
  });

  describe('Scalability Tests', () => {
    it('should scale linearly with increased load', async () => {
      const userCounts = [10, 25, 50, 100];
      const scalabilityResults: Array<{ users: number; rps: number; avgResponse: number }> = [];

      for (const userCount of userCounts) {
        const result = await runLoadTest({
          name: `Scalability Test - ${userCount} users`,
          concurrentUsers: userCount,
          duration: 30000, // Shorter for scalability test
          testFunction: simulateMatchingRequest,
        });

        scalabilityResults.push({
          users: userCount,
          rps: result.requestsPerSecond,
          avgResponse: result.averageResponseTime,
        });

        console.log(`${userCount} users: ${result.requestsPerSecond.toFixed(2)} RPS, ${result.averageResponseTime.toFixed(2)}ms avg`);
      }

      // Check for linear scaling (RPS should increase proportionally with users)
      for (let i = 1; i < scalabilityResults.length; i++) {
        const prev = scalabilityResults[i - 1];
        const curr = scalabilityResults[i];
        const expectedRPS = (prev.rps * curr.users) / prev.users;
        const actualRPS = curr.rps;
        const scalingEfficiency = actualRPS / expectedRPS;

        // Should maintain at least 70% scaling efficiency
        expect(scalingEfficiency).toBeGreaterThan(0.7);
      }
    }, TEST_DURATION * 2);

    it('should handle sustained load without degradation', async () => {
      const duration = 120000; // 2 minutes
      const metrics: Array<{ timestamp: number; rps: number; avgResponse: number }> = [];

      const collectMetrics = setInterval(async () => {
        const result = await runQuickLoadTest(simulateMatchingRequest, 5000);
        metrics.push({
          timestamp: Date.now(),
          rps: result.requestsPerSecond,
          avgResponse: result.averageResponseTime,
        });
      }, 10000);

      // Run sustained load
      await runLoadTest({
        name: 'Sustained Load Test',
        concurrentUsers: CONCURRENT_USERS,
        duration,
        testFunction: simulateMatchingRequest,
      });

      clearInterval(collectMetrics);

      // Check for performance degradation over time
      const initialRPS = metrics[0]?.rps || 0;
      const finalRPS = metrics[metrics.length - 1]?.rps || 0;
      const degradation = (initialRPS - finalRPS) / initialRPS;

      console.log(`Sustained Load Performance:
        - Initial RPS: ${initialRPS.toFixed(2)}
        - Final RPS: ${finalRPS.toFixed(2)}
        - Degradation: ${(degradation * 100).toFixed(2)}%`);

      // Should maintain performance within 20% of initial performance
      expect(degradation).toBeLessThan(0.2);
    }, TEST_DURATION * 3);
  });

  // Test simulation functions

  async function simulateMatchingRequest(): Promise<RequestMetrics> {
    const startTime = performance.now();

    try {
      const response = await fetch(`${BASE_URL}/api/matching/find-matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateId: `test-candidate-${Math.floor(Math.random() * 100)}`,
          filters: {
            jobType: 'FULL_TIME',
            remoteWork: true,
          },
          limit: 10,
        }),
      });

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      return {
        url: '/api/matching/find-matches',
        method: 'POST',
        statusCode: response.status,
        responseTime,
        timestamp: Date.now(),
        success: response.ok,
      };
    } catch (error) {
      const endTime = performance.now();
      const responseTime = endTime - startTime;

      return {
        url: '/api/matching/find-matches',
        method: 'POST',
        statusCode: 0,
        responseTime,
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async function simulateBatchMatchingRequest(): Promise<RequestMetrics> {
    const startTime = performance.now();

    try {
      const response = await fetch(`${BASE_URL}/api/matching/batch-match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidates: Array(5).fill(null).map((_, i) => ({
            id: `test-candidate-${i}`,
            skills: ['JavaScript', 'React', 'Node.js'],
          })),
          jobs: Array(10).fill(null).map((_, i) => ({
            id: `test-job-${i}`,
            title: `Test Job ${i}`,
            requiredSkills: ['JavaScript'],
          })),
        }),
      });

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      return {
        url: '/api/matching/batch-match',
        method: 'POST',
        statusCode: response.status,
        responseTime,
        timestamp: Date.now(),
        success: response.ok,
      };
    } catch (error) {
      const endTime = performance.now();
      const responseTime = endTime - startTime;

      return {
        url: '/api/matching/batch-match',
        method: 'POST',
        statusCode: 0,
        responseTime,
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async function simulateRecommendationRequest(): Promise<RequestMetrics> {
    const startTime = performance.now();

    try {
      const response = await fetch(`${BASE_URL}/api/recommendations/jobs/test-candidate-1`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      return {
        url: '/api/recommendations/jobs/test-candidate-1',
        method: 'GET',
        statusCode: response.status,
        responseTime,
        timestamp: Date.now(),
        success: response.ok,
      };
    } catch (error) {
      const endTime = performance.now();
      const responseTime = endTime - startTime;

      return {
        url: '/api/recommendations/jobs/test-candidate-1',
        method: 'GET',
        statusCode: 0,
        responseTime,
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async function simulateProfileAnalysisRequest(): Promise<RequestMetrics> {
    const startTime = performance.now();

    try {
      const response = await fetch(`${BASE_URL}/api/matching/profiles/test-candidate-1/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profile: {
            skills: ['JavaScript', 'React', 'Node.js'],
            experience: [
              {
                title: 'Senior Developer',
                company: 'Test Corp',
                duration: '5 years',
              },
            ],
          },
        }),
      });

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      return {
        url: '/api/matching/profiles/test-candidate-1/analyze',
        method: 'POST',
        statusCode: response.status,
        responseTime,
        timestamp: Date.now(),
        success: response.ok,
      };
    } catch (error) {
      const endTime = performance.now();
      const responseTime = endTime - startTime;

      return {
        url: '/api/matching/profiles/test-candidate-1/analyze',
        method: 'POST',
        statusCode: 0,
        responseTime,
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async function simulateDatabaseOperations(): Promise<RequestMetrics> {
    const startTime = performance.now();

    try {
      // Simulate database operation via API
      const response = await fetch(`${BASE_URL}/api/test/db-operation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'select',
          table: 'candidates',
          limit: 10,
        }),
      });

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      return {
        url: '/api/test/db-operation',
        method: 'POST',
        statusCode: response.status,
        responseTime,
        timestamp: Date.now(),
        success: response.ok,
      };
    } catch (error) {
      const endTime = performance.now();
      const responseTime = endTime - startTime;

      return {
        url: '/api/test/db-operation',
        method: 'POST',
        statusCode: 0,
        responseTime,
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async function simulateComplexQueries(): Promise<RequestMetrics> {
    const startTime = performance.now();

    try {
      const response = await fetch(`${BASE_URL}/api/test/complex-query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'find-matches-with-complex-filters',
          filters: {
            skills: ['JavaScript', 'React', 'Node.js'],
            experience: { min: 3, max: 10 },
            location: { within: 50, unit: 'miles' },
            salary: { min: 80000, max: 150000 },
            remoteWork: true,
          },
          joins: ['skills', 'experience', 'education'],
          orderBy: 'score-desc',
          limit: 20,
        }),
      });

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      return {
        url: '/api/test/complex-query',
        method: 'POST',
        statusCode: response.status,
        responseTime,
        timestamp: Date.now(),
        success: response.ok,
      };
    } catch (error) {
      const endTime = performance.now();
      const responseTime = endTime - startTime;

      return {
        url: '/api/test/complex-query',
        method: 'POST',
        statusCode: 0,
        responseTime,
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async function simulateCacheOperations(): Promise<RequestMetrics> {
    const startTime = performance.now();

    try {
      // Simulate cache hit
      const response = await fetch(`${BASE_URL}/api/matching/find-matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateId: 'cached-candidate-1', // Should be cached
          filters: {},
          limit: 10,
        }),
      });

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      return {
        url: '/api/matching/find-matches (cached)',
        method: 'POST',
        statusCode: response.status,
        responseTime,
        timestamp: Date.now(),
        success: response.ok,
      };
    } catch (error) {
      const endTime = performance.now();
      const responseTime = endTime - startTime;

      return {
        url: '/api/matching/find-matches (cached)',
        method: 'POST',
        statusCode: 0,
        responseTime,
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async function simulateCacheMisses(): Promise<RequestMetrics> {
    const startTime = performance.now();

    try {
      // Simulate cache miss with unique candidate ID
      const uniqueId = `unique-candidate-${Date.now()}-${Math.random()}`;
      const response = await fetch(`${BASE_URL}/api/matching/find-matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateId: uniqueId, // Should not be cached
          filters: {},
          limit: 10,
        }),
      });

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      return {
        url: '/api/matching/find-matches (cache miss)',
        method: 'POST',
        statusCode: response.status,
        responseTime,
        timestamp: Date.now(),
        success: response.ok,
      };
    } catch (error) {
      const endTime = performance.now();
      const responseTime = endTime - startTime;

      return {
        url: '/api/matching/find-matches (cache miss)',
        method: 'POST',
        statusCode: 0,
        responseTime,
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async function simulateMixedRequests(): Promise<RequestMetrics> {
    const requests = [
      simulateMatchingRequest,
      simulateRecommendationRequest,
      simulateProfileAnalysisRequest,
    ];

    const randomRequest = requests[Math.floor(Math.random() * requests.length)];
    return await randomRequest();
  }

  // Load test execution functions

  async function runLoadTest(config: {
    name: string;
    concurrentUsers: number;
    duration: number;
    testFunction: () => Promise<RequestMetrics>;
  }): Promise<LoadTestResult> {
    console.log(`Starting load test: ${config.name}`);

    const metrics: RequestMetrics[] = [];
    const startTime = Date.now();
    let endTime = startTime;

    // Create concurrent workers
    const workers = Array(config.concurrentUsers).fill(null).map(async () => {
      let requestCount = 0;
      const workerStartTime = Date.now();

      while (Date.now() - workerStartTime < config.duration) {
        try {
          const metric = await config.testFunction();
          metrics.push(metric);
          requestCount++;
        } catch (error) {
          // Log error but continue
          console.error('Request error:', error);
        }

        // Small delay to prevent overwhelming
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return requestCount;
    });

    // Wait for all workers to complete
    const results = await Promise.all(workers);
    endTime = Date.now();

    // Calculate metrics
    const totalTime = endTime - startTime;
    const totalRequests = metrics.length;
    const successfulRequests = metrics.filter(m => m.success).length;
    const failedRequests = totalRequests - successfulRequests;
    const requestsPerSecond = (totalRequests / totalTime) * 1000;
    const errorRate = failedRequests / totalRequests;

    const responseTimes = metrics.map(m => m.responseTime).sort((a, b) => a - b);
    const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;

    const p95Index = Math.floor(responseTimes.length * 0.95);
    const p99Index = Math.floor(responseTimes.length * 0.99);
    const p95ResponseTime = responseTimes[p95Index] || 0;
    const p99ResponseTime = responseTimes[p99Index] || 0;

    return {
      totalTime,
      requestsPerSecond,
      averageResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      errorRate,
      successfulRequests,
      failedRequests,
      totalRequests,
    };
  }

  async function runDatabaseLoadTest(config: {
    name: string;
    concurrentConnections: number;
    duration: number;
    testFunction: () => Promise<RequestMetrics>;
  }): Promise<LoadTestResult> {
    return runLoadTest(config);
  }

  async function runCacheLoadTest(config: {
    name: string;
    concurrentUsers: number;
    duration: number;
    testFunction: () => Promise<RequestMetrics>;
  }): Promise<LoadTestResult> {
    return runLoadTest(config);
  }

  async function runQuickLoadTest(
    testFunction: () => Promise<RequestMetrics>,
    duration: number
  ): Promise<LoadTestResult> {
    return runLoadTest({
      name: 'Quick Test',
      concurrentUsers: 10,
      duration,
      testFunction,
    });
  }

  // Test data setup

  async function setupTestData() {
    try {
      // Create test candidates
      for (let i = 0; i < 100; i++) {
        await prisma.candidateProfile.create({
          data: {
            id: `test-candidate-${i}`,
            userId: `test-user-${i}`,
            personalInfo: {
              firstName: `Test${i}`,
              lastName: `Candidate${i}`,
              email: `test${i}@example.com`,
            },
            skills: [
              { name: 'JavaScript', level: 'EXPERT' },
              { name: 'React', level: 'ADVANCED' },
              { name: 'Node.js', level: 'INTERMEDIATE' },
            ],
            experience: [
              {
                title: 'Software Engineer',
                company: 'Test Corp',
                startDate: new Date('2020-01-01'),
                endDate: new Date('2023-12-31'),
                isCurrentJob: false,
                description: 'Test experience',
                skills: ['JavaScript', 'React'],
                achievements: ['Test achievement'],
              },
            ],
            completeness: 90,
            lastUpdated: new Date(),
          },
        });
      }

      // Create test jobs
      for (let i = 0; i < 200; i++) {
        await prisma.jobProfile.create({
          data: {
            id: `test-job-${i}`,
            companyId: `test-company-${i % 10}`,
            title: `Test Job ${i}`,
            description: 'Test job description',
            requirements: ['Test requirement'],
            skills: [
              { name: 'JavaScript', required: true, level: 'INTERMEDIATE' },
              { name: 'React', required: false, level: 'ADVANCED' },
            ],
            company: {
              id: `test-company-${i % 10}`,
              name: `Test Company ${i % 10}`,
              industry: 'TECHNOLOGY',
            },
            location: 'San Francisco, CA',
            jobType: 'FULL_TIME',
            remoteWork: true,
            postedDate: new Date(),
            status: 'ACTIVE',
          },
        });
      }

      console.log('Test data setup completed');
    } catch (error) {
      console.error('Error setting up test data:', error);
    }
  }
});

// Performance monitoring utilities

export class PerformanceMonitor {
  static async measureAPIThroughput(
    endpoint: string,
    method: string = 'GET',
    body?: any,
    duration: number = 60000
  ): Promise<LoadTestResult> {
    const startTime = Date.now();
    const metrics: RequestMetrics[] = [];

    const endTime = startTime + duration;

    while (Date.now() < endTime) {
      const requestStart = performance.now();

      try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: body ? JSON.stringify(body) : undefined,
        });

        const requestEnd = performance.now();
        const responseTime = requestEnd - requestStart;

        metrics.push({
          url: endpoint,
          method,
          statusCode: response.status,
          responseTime,
          timestamp: Date.now(),
          success: response.ok,
        });
      } catch (error) {
        const requestEnd = performance.now();
        const responseTime = requestEnd - requestStart;

        metrics.push({
          url: endpoint,
          method,
          statusCode: 0,
          responseTime,
          timestamp: Date.now(),
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return this.calculateMetrics(metrics);
  }

  static calculateMetrics(metrics: RequestMetrics[]): LoadTestResult {
    const totalRequests = metrics.length;
    const successfulRequests = metrics.filter(m => m.success).length;
    const failedRequests = totalRequests - successfulRequests;
    const totalTime = Math.max(...metrics.map(m => m.timestamp)) - Math.min(...metrics.map(m => m.timestamp));
    const requestsPerSecond = (totalRequests / totalTime) * 1000;
    const errorRate = failedRequests / totalRequests;

    const responseTimes = metrics.map(m => m.responseTime).sort((a, b) => a - b);
    const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;

    const p95Index = Math.floor(responseTimes.length * 0.95);
    const p99Index = Math.floor(responseTimes.length * 0.99);
    const p95ResponseTime = responseTimes[p95Index] || 0;
    const p99ResponseTime = responseTimes[p99Index] || 0;

    return {
      totalTime,
      requestsPerSecond,
      averageResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      errorRate,
      successfulRequests,
      failedRequests,
      totalRequests,
    };
  }
}