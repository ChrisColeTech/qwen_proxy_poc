#!/usr/bin/env node

/**
 * Performance Benchmark Script
 *
 * Measures performance metrics for the Qwen Proxy Backend:
 * - Response times
 * - Throughput
 * - Concurrent request handling
 * - Memory usage
 *
 * Prerequisites:
 * - Server running on localhost:3000 (or TEST_URL)
 *
 * Usage:
 *   node scripts/benchmark.js
 *   TEST_URL=http://production:3000 node scripts/benchmark.js
 */

const axios = require('axios');
const { performance } = require('perf_hooks');

// Configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const WARMUP_REQUESTS = 5;
const BENCHMARK_REQUESTS = 20;
const CONCURRENT_REQUESTS = [1, 5, 10, 20, 50];

// Test client
const client = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  validateStatus: () => true
});

// Colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

// Utilities
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const measureTime = async (fn) => {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  return { result, duration };
};

const calculateStats = (times) => {
  const sorted = times.sort((a, b) => a - b);
  const sum = times.reduce((a, b) => a + b, 0);

  return {
    min: Math.round(sorted[0]),
    max: Math.round(sorted[sorted.length - 1]),
    mean: Math.round(sum / times.length),
    median: Math.round(sorted[Math.floor(sorted.length / 2)]),
    p95: Math.round(sorted[Math.floor(sorted.length * 0.95)]),
    p99: Math.round(sorted[Math.floor(sorted.length * 0.99)])
  };
};

// Benchmark tests
const benchmarks = {

  async warmup() {
    console.log(`\n${colors.blue}Warming up...${colors.reset}`);

    for (let i = 0; i < WARMUP_REQUESTS; i++) {
      await client.get('/health');
      process.stdout.write('.');
    }

    console.log(' done\n');
  },

  async healthCheck() {
    console.log(`${colors.magenta}1. Health Check Endpoint${colors.reset}`);
    const times = [];

    for (let i = 0; i < BENCHMARK_REQUESTS; i++) {
      const { duration } = await measureTime(() => client.get('/health'));
      times.push(duration);
    }

    const stats = calculateStats(times);
    console.log(`  Requests: ${BENCHMARK_REQUESTS}`);
    console.log(`  Min: ${stats.min}ms`);
    console.log(`  Max: ${stats.max}ms`);
    console.log(`  Mean: ${stats.mean}ms`);
    console.log(`  Median: ${stats.median}ms`);
    console.log(`  P95: ${stats.p95}ms`);
    console.log(`  P99: ${stats.p99}ms`);

    return stats;
  },

  async modelsList() {
    console.log(`\n${colors.magenta}2. Models List Endpoint${colors.reset}`);
    const times = [];

    // First request (cache miss)
    const { duration: firstReq } = await measureTime(() => client.get('/v1/models'));
    console.log(`  First request (cache miss): ${Math.round(firstReq)}ms`);

    // Subsequent requests (cached)
    for (let i = 0; i < BENCHMARK_REQUESTS; i++) {
      const { duration } = await measureTime(() => client.get('/v1/models'));
      times.push(duration);
    }

    const stats = calculateStats(times);
    console.log(`  Cached requests: ${BENCHMARK_REQUESTS}`);
    console.log(`  Min: ${stats.min}ms`);
    console.log(`  Mean: ${stats.mean}ms`);
    console.log(`  Median: ${stats.median}ms`);
    console.log(`  P95: ${stats.p95}ms`);

    return stats;
  },

  async chatCompletionNonStreaming() {
    console.log(`\n${colors.magenta}3. Chat Completion (Non-Streaming)${colors.reset}`);
    const times = [];

    for (let i = 0; i < Math.min(10, BENCHMARK_REQUESTS); i++) {
      const { duration } = await measureTime(() =>
        client.post('/v1/chat/completions', {
          model: 'qwen3-max',
          messages: [{ role: 'user', content: 'Say "OK"' }],
          stream: false
        })
      );
      times.push(duration);
      await sleep(500); // Be nice to the API
    }

    const stats = calculateStats(times);
    console.log(`  Requests: ${times.length}`);
    console.log(`  Min: ${stats.min}ms`);
    console.log(`  Max: ${stats.max}ms`);
    console.log(`  Mean: ${stats.mean}ms`);
    console.log(`  Median: ${stats.median}ms`);
    console.log(`  P95: ${stats.p95}ms`);

    return stats;
  },

  async chatCompletionStreaming() {
    console.log(`\n${colors.magenta}4. Chat Completion (Streaming)${colors.reset}`);
    const timeToFirstChunk = [];
    const totalTimes = [];

    for (let i = 0; i < Math.min(10, BENCHMARK_REQUESTS); i++) {
      const start = performance.now();
      let firstChunkTime = null;

      const response = await client.post('/v1/chat/completions', {
        model: 'qwen3-max',
        messages: [{ role: 'user', content: 'Count to 3' }],
        stream: true
      });

      // Simple check for first data
      if (response.data && !firstChunkTime) {
        firstChunkTime = performance.now() - start;
      }

      const totalTime = performance.now() - start;

      if (firstChunkTime) timeToFirstChunk.push(firstChunkTime);
      totalTimes.push(totalTime);

      await sleep(500);
    }

    const firstChunkStats = calculateStats(timeToFirstChunk);
    const totalStats = calculateStats(totalTimes);

    console.log(`  Time to first chunk:`);
    console.log(`    Mean: ${firstChunkStats.mean}ms`);
    console.log(`    Median: ${firstChunkStats.median}ms`);
    console.log(`    P95: ${firstChunkStats.p95}ms`);
    console.log(`  Total time:`);
    console.log(`    Mean: ${totalStats.mean}ms`);
    console.log(`    Median: ${totalStats.median}ms`);

    return { firstChunkStats, totalStats };
  },

  async concurrentRequests() {
    console.log(`\n${colors.magenta}5. Concurrent Request Handling${colors.reset}`);

    for (const concurrency of CONCURRENT_REQUESTS) {
      const requests = Array(concurrency).fill(null).map((_, i) =>
        client.get('/health')
      );

      const start = performance.now();
      const responses = await Promise.all(requests);
      const duration = performance.now() - start;

      const successCount = responses.filter(r => r.status === 200).length;
      const successRate = (successCount / concurrency * 100).toFixed(1);

      console.log(`  Concurrency ${concurrency}:`);
      console.log(`    Total time: ${Math.round(duration)}ms`);
      console.log(`    Success rate: ${successRate}% (${successCount}/${concurrency})`);
      console.log(`    Throughput: ${Math.round(concurrency / (duration / 1000))} req/s`);

      await sleep(1000);
    }
  },

  async throughput() {
    console.log(`\n${colors.magenta}6. Throughput Test (60 seconds)${colors.reset}`);

    const duration = 60000; // 60 seconds
    const startTime = Date.now();
    let requestCount = 0;
    let errorCount = 0;

    console.log('  Running...');

    while (Date.now() - startTime < duration) {
      try {
        const response = await client.get('/health');
        if (response.status === 200) {
          requestCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        errorCount++;
      }

      // Print progress every 10 seconds
      const elapsed = Date.now() - startTime;
      if (elapsed % 10000 < 100) {
        const reqPerSec = Math.round(requestCount / (elapsed / 1000));
        process.stdout.write(`\r  ${Math.floor(elapsed/1000)}s: ${requestCount} requests (${reqPerSec} req/s)`);
      }
    }

    const totalTime = (Date.now() - startTime) / 1000;
    const reqPerSec = Math.round(requestCount / totalTime);

    console.log(`\n  Total requests: ${requestCount}`);
    console.log(`  Errors: ${errorCount}`);
    console.log(`  Success rate: ${((requestCount / (requestCount + errorCount)) * 100).toFixed(1)}%`);
    console.log(`  Average throughput: ${reqPerSec} req/s`);

    return { requestCount, errorCount, reqPerSec };
  },

  async memoryUsage() {
    console.log(`\n${colors.magenta}7. Memory Usage${colors.reset}`);

    const response = await client.get('/health');

    if (response.status === 200 && response.data.metrics?.memoryUsage) {
      const mem = response.data.metrics.memoryUsage;
      console.log(`  Heap Used: ${Math.round(mem.heapUsed / 1024 / 1024)} MB`);
      console.log(`  Heap Total: ${Math.round(mem.heapTotal / 1024 / 1024)} MB`);
      console.log(`  RSS: ${Math.round(mem.rss / 1024 / 1024)} MB`);

      return mem;
    } else {
      console.log('  Unable to fetch memory metrics');
      return null;
    }
  }
};

// Main benchmark function
async function runBenchmarks() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 Qwen Proxy Backend - Performance Benchmark');
  console.log('='.repeat(60));
  console.log(`\nTarget: ${BASE_URL}`);
  console.log(`Date: ${new Date().toISOString()}`);

  try {
    // Check if server is running
    const healthCheck = await client.get('/health');
    if (healthCheck.status !== 200) {
      console.error('\n❌ Server is not healthy');
      process.exit(1);
    }

    console.log(`${colors.green}✓${colors.reset} Server is healthy\n`);

    // Run warmup
    await benchmarks.warmup();

    // Run benchmarks
    const results = {
      healthCheck: await benchmarks.healthCheck(),
      modelsList: await benchmarks.modelsList(),
      chatCompletion: await benchmarks.chatCompletionNonStreaming(),
      chatStreaming: await benchmarks.chatCompletionStreaming(),
      memory: await benchmarks.memoryUsage()
    };

    await benchmarks.concurrentRequests();

    // Optional: Long-running throughput test
    // Uncomment to run 60-second test
    // await benchmarks.throughput();

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log(`${colors.green}✅ Benchmark Complete${colors.reset}\n`);

    console.log('Summary:');
    console.log(`  Health Check: ${results.healthCheck.mean}ms avg`);
    console.log(`  Models List (cached): ${results.modelsList.mean}ms avg`);
    console.log(`  Chat Completion: ${results.chatCompletion.mean}ms avg`);
    console.log(`  Streaming (first chunk): ${results.chatStreaming.firstChunkStats.mean}ms avg`);

    if (results.memory) {
      console.log(`  Memory Usage: ${Math.round(results.memory.heapUsed / 1024 / 1024)} MB`);
    }

    console.log('\n');

  } catch (error) {
    console.error(`\n❌ Benchmark error: ${error.message}`);
    if (error.code === 'ECONNREFUSED') {
      console.error('Make sure the server is running on', BASE_URL);
    }
    process.exit(1);
  }
}

// Run benchmarks
if (require.main === module) {
  runBenchmarks();
}

module.exports = { benchmarks, runBenchmarks };
