const { performance } = require('perf_hooks');
const axios = require('axios');
const WebSocket = require('ws');

class PerformanceTester {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.results = {
      loadTests: [],
      stressTests: [],
      websocketTests: [],
      memoryTests: []
    };
  }

  async runAllTests() {
    console.log('🚀 Starting comprehensive performance tests...\n');

    // Warm up
    await this.warmUp();

    // Run different test scenarios
    await this.runLoadTests();
    await this.runStressTests();
    await this.runWebSocketTests();
    await this.runMemoryTests();

    // Generate report
    this.generateReport();
  }

  async warmUp() {
    console.log('🔥 Warming up server...');
    for (let i = 0; i < 10; i++) {
      try {
        await axios.get(`${this.baseUrl}/api/health`, { timeout: 5000 });
      } catch (error) {
        console.error('Warm up failed:', error.message);
      }
    }
    console.log('✅ Warm up completed\n');
  }

  async runLoadTests() {
    console.log('📊 Running load tests...');

    const testScenarios = [
      { name: 'Light Load', concurrentUsers: 10, duration: 30000, requestsPerSecond: 5 },
      { name: 'Medium Load', concurrentUsers: 50, duration: 60000, requestsPerSecond: 20 },
      { name: 'Heavy Load', concurrentUsers: 100, duration: 120000, requestsPerSecond: 50 }
    ];

    for (const scenario of testScenarios) {
      console.log(`  Running ${scenario.name}: ${scenario.concurrentUsers} users, ${scenario.duration/1000}s`);
      const result = await this.runLoadTest(scenario);
      this.results.loadTests.push(result);
      console.log(`    ✅ ${scenario.name} completed: ${result.totalRequests} requests, avg latency: ${result.avgLatency}ms\n`);
    }
  }

  async runLoadTest(scenario) {
    const { concurrentUsers, duration, requestsPerSecond } = scenario;
    const startTime = performance.now();
    const endTime = startTime + duration;
    const requests = [];
    const errors = [];
    let totalRequests = 0;

    // Create concurrent workers
    const workers = [];
    for (let i = 0; i < concurrentUsers; i++) {
      workers.push(this.createWorker(endTime, requestsPerSecond / concurrentUsers, requests, errors));
    }

    // Wait for all workers to complete
    await Promise.all(workers);

    const totalTime = performance.now() - startTime;
    const latencies = requests.map(r => r.latency);
    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const p95Latency = this.percentile(latencies, 95);
    const p99Latency = this.percentile(latencies, 99);

    return {
      scenario: scenario.name,
      duration: totalTime,
      totalRequests: requests.length,
      totalErrors: errors.length,
      requestsPerSecond: requests.length / (totalTime / 1000),
      avgLatency: Math.round(avgLatency),
      p95Latency: Math.round(p95Latency),
      p99Latency: Math.round(p99Latency),
      errorRate: (errors.length / requests.length) * 100
    };
  }

  async createWorker(endTime, rate, requests, errors) {
    const interval = 1000 / rate; // Interval between requests in ms

    const makeRequest = async () => {
      if (performance.now() >= endTime) return;

      const startTime = performance.now();
      try {
        const endpoints = [
          '/api/health',
          '/api/jobs',
          '/api/recommendations',
          '/api/users/profile'
        ];
        const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];

        await axios.get(`${this.baseUrl}${endpoint}`, { timeout: 10000 });

        const latency = performance.now() - startTime;
        requests.push({ latency, timestamp: Date.now() });
      } catch (error) {
        errors.push({ error: error.message, timestamp: Date.now() });
      }

      // Schedule next request
      setTimeout(makeRequest, interval);
    };

    // Start the worker
    makeRequest();
  }

  async runStressTests() {
    console.log('💪 Running stress tests...');

    const stressScenarios = [
      { name: 'Spike Test', pattern: 'spike', maxUsers: 200, duration: 60000 },
      { name: 'Ramp Up Test', pattern: 'rampup', maxUsers: 150, duration: 120000 },
      { name: 'Sustained Load', pattern: 'sustained', maxUsers: 100, duration: 180000 }
    ];

    for (const scenario of stressScenarios) {
      console.log(`  Running ${scenario.name}...`);
      const result = await this.runStressTest(scenario);
      this.results.stressTests.push(result);
      console.log(`    ✅ ${scenario.name} completed: peak RPS ${result.peakRPS}, errors ${result.errorCount}\n`);
    }
  }

  async runStressTest(scenario) {
    const { pattern, maxUsers, duration } = scenario;
    const startTime = performance.now();
    const endTime = startTime + duration;
    const requests = [];
    const errors = [];
    let currentUsers = 0;

    const addUsers = async () => {
      if (performance.now() >= endTime) return;

      switch (pattern) {
        case 'spike':
          // Spike: quickly go to max users
          currentUsers = maxUsers;
          break;
        case 'rampup':
          // Ramp up gradually
          const elapsed = performance.now() - startTime;
          currentUsers = Math.floor((elapsed / duration) * maxUsers);
          break;
        case 'sustained':
          // Sustained: constant load
          currentUsers = maxUsers;
          break;
      }

      // Create requests for current users
      const promises = [];
      for (let i = 0; i < currentUsers; i++) {
        promises.push(this.makeSingleRequest(requests, errors));
      }
      await Promise.allSettled(promises);

      // Schedule next iteration
      setTimeout(addUsers, 1000);
    };

    addUsers();

    // Wait for test to complete
    return new Promise((resolve) => {
      setTimeout(() => {
        const totalTime = performance.now() - startTime;
        const rpsValues = this.calculateRPSOverTime(requests, duration);

        resolve({
          scenario: scenario.name,
          duration: totalTime,
          peakRPS: Math.max(...rpsValues),
          avgRPS: rpsValues.reduce((a, b) => a + b, 0) / rpsValues.length,
          totalRequests: requests.length,
          errorCount: errors.length
        });
      }, duration);
    });
  }

  async makeSingleRequest(requests, errors) {
    const startTime = performance.now();
    try {
      const endpoints = ['/api/health', '/api/jobs', '/api/recommendations'];
      const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];

      await axios.get(`${this.baseUrl}${endpoint}`, { timeout: 5000 });
      requests.push({ latency: performance.now() - startTime, timestamp: Date.now() });
    } catch (error) {
      errors.push({ error: error.message, timestamp: Date.now() });
    }
  }

  async runWebSocketTests() {
    console.log('🔌 Running WebSocket tests...');

    const wsScenarios = [
      { name: 'WebSocket Connections', connections: 50, duration: 30000 },
      { name: 'Message Throughput', connections: 20, messagesPerSecond: 100, duration: 30000 }
    ];

    for (const scenario of wsScenarios) {
      console.log(`  Running ${scenario.name}...`);
      const result = await this.runWebSocketTest(scenario);
      this.results.websocketTests.push(result);
      console.log(`    ✅ ${scenario.name} completed: ${result.connections} connections, ${result.messages || 0} messages\n`);
    }
  }

  async runWebSocketTest(scenario) {
    const { connections, duration, messagesPerSecond } = scenario;
    const wsConnections = [];
    const messageStats = {
      sent: 0,
      received: 0,
      errors: 0
    };

    // Create WebSocket connections
    for (let i = 0; i < connections; i++) {
      try {
        const ws = new WebSocket('ws://localhost:3000');

        ws.on('open', () => {
          if (messagesPerSecond) {
            // Send messages periodically
            const interval = setInterval(() => {
              try {
                ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
                messageStats.sent++;
              } catch (error) {
                messageStats.errors++;
              }
            }, 1000 / messagesPerSecond);

            setTimeout(() => clearInterval(interval), duration);
          }
        });

        ws.on('message', (data) => {
          messageStats.received++;
        });

        ws.on('error', (error) => {
          messageStats.errors++;
        });

        wsConnections.push(ws);
      } catch (error) {
        console.error(`Failed to create WebSocket connection ${i}:`, error.message);
      }
    }

    // Wait for test to complete
    await new Promise(resolve => setTimeout(resolve, duration));

    // Close all connections
    wsConnections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    });

    return {
      scenario: scenario.name,
      connections: wsConnections.filter(ws => ws.readyState === WebSocket.OPEN).length,
      messages: messageStats,
      duration
    };
  }

  async runMemoryTests() {
    console.log('🧠 Running memory tests...');

    const memoryScenarios = [
      { name: 'Memory Leak Test', iterations: 1000, endpoint: '/api/recommendations' },
      { name: 'Large Response Test', iterations: 100, endpoint: '/api/jobs?limit=100' }
    ];

    for (const scenario of memoryScenarios) {
      console.log(`  Running ${scenario.name}...`);
      const result = await this.runMemoryTest(scenario);
      this.results.memoryTests.push(result);
      console.log(`    ✅ ${scenario.name} completed: memory growth ${result.memoryGrowthMB}MB\n`);
    }
  }

  async runMemoryTest(scenario) {
    const { iterations, endpoint } = scenario;
    const initialMemory = process.memoryUsage();
    const memorySnapshots = [initialMemory];

    for (let i = 0; i < iterations; i++) {
      try {
        await axios.get(`${this.baseUrl}${endpoint}`, { timeout: 10000 });

        // Take memory snapshot every 100 iterations
        if (i % 100 === 0) {
          memorySnapshots.push(process.memoryUsage());
        }

        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      } catch (error) {
        console.error(`Request ${i} failed:`, error.message);
      }
    }

    const finalMemory = process.memoryUsage();
    const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;

    return {
      scenario: scenario.name,
      iterations,
      initialMemory: Math.round(initialMemory.heapUsed / 1024 / 1024),
      finalMemory: Math.round(finalMemory.heapUsed / 1024 / 1024),
      memoryGrowthMB: Math.round(memoryGrowth / 1024 / 1024),
      memorySnapshots: memorySnapshots.map(m => Math.round(m.heapUsed / 1024 / 1024))
    };
  }

  calculateRPSOverTime(requests, totalDuration) {
    const bucketSize = 5000; // 5-second buckets
    const buckets = {};

    requests.forEach(request => {
      const bucket = Math.floor((request.timestamp - requests[0].timestamp) / bucketSize);
      buckets[bucket] = (buckets[bucket] || 0) + 1;
    });

    return Object.values(buckets).map(count => count / (bucketSize / 1000));
  }

  percentile(arr, p) {
    const sorted = arr.sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index];
  }

  generateReport() {
    console.log('📋 Performance Test Report\n');
    console.log('=' .repeat(60));

    // Load Test Results
    console.log('\n📊 Load Test Results:');
    this.results.loadTests.forEach(test => {
      console.log(`  ${test.scenario}:`);
      console.log(`    Total Requests: ${test.totalRequests}`);
      console.log(`    Requests/sec: ${test.requestsPerSecond.toFixed(2)}`);
      console.log(`    Avg Latency: ${test.avgLatency}ms`);
      console.log(`    95th Percentile: ${test.p95Latency}ms`);
      console.log(`    99th Percentile: ${test.p99Latency}ms`);
      console.log(`    Error Rate: ${test.errorRate.toFixed(2)}%\n`);
    });

    // Stress Test Results
    console.log('\n💪 Stress Test Results:');
    this.results.stressTests.forEach(test => {
      console.log(`  ${test.scenario}:`);
      console.log(`    Peak RPS: ${test.peakRPS.toFixed(2)}`);
      console.log(`    Avg RPS: ${test.avgRPS.toFixed(2)}`);
      console.log(`    Total Requests: ${test.totalRequests}`);
      console.log(`    Errors: ${test.errorCount}\n`);
    });

    // WebSocket Test Results
    console.log('\n🔌 WebSocket Test Results:');
    this.results.websocketTests.forEach(test => {
      console.log(`  ${test.scenario}:`);
      console.log(`    Connections: ${test.connections}`);
      if (test.messages) {
        console.log(`    Messages Sent: ${test.messages.sent}`);
        console.log(`    Messages Received: ${test.messages.received}`);
        console.log(`    Message Errors: ${test.messages.errors}`);
      }
      console.log('');
    });

    // Memory Test Results
    console.log('\n🧠 Memory Test Results:');
    this.results.memoryTests.forEach(test => {
      console.log(`  ${test.scenario}:`);
      console.log(`    Iterations: ${test.iterations}`);
      console.log(`    Initial Memory: ${test.initialMemory}MB`);
      console.log(`    Final Memory: ${test.finalMemory}MB`);
      console.log(`    Memory Growth: ${test.memoryGrowthMB}MB\n`);
    });

    console.log('=' .repeat(60));
    console.log('✅ Performance testing completed!\n');

    // Save results to file
    const fs = require('fs');
    fs.writeFileSync(
      `performance-results-${Date.now()}.json`,
      JSON.stringify(this.results, null, 2)
    );
    console.log('📄 Results saved to performance-results.json');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const baseUrl = process.argv[2] || 'http://localhost:3000';
  const tester = new PerformanceTester(baseUrl);
  tester.runAllTests().catch(console.error);
}

module.exports = PerformanceTester;