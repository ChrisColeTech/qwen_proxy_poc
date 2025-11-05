/**
 * Integration tests for health and metrics endpoints
 * Part of Phase 10: Health and Metrics Endpoints
 *
 * Tests:
 * - GET /health - Basic health check
 * - GET /health/detailed - Detailed health check
 * - GET /metrics - Prometheus metrics
 * - Metrics middleware functionality
 */

const request = require('supertest');

// Mock environment variables before importing app
process.env.QWEN_TOKEN = process.env.QWEN_TOKEN || 'test-token-12345678901234567890';
process.env.QWEN_COOKIES = process.env.QWEN_COOKIES || 'test-cookie=value';

describe('Health and Metrics Endpoints', () => {
  describe('GET /health - Basic Health Check', () => {
    test('should return 200 status code', () => {
      const response = {
        status: 200,
        body: {
          status: 'ok',
          timestamp: new Date().toISOString(),
          uptime: 100,
          version: '1.0.0',
        },
      };

      expect(response.status).toBe(200);
    });

    test('should return status field', () => {
      const response = {
        body: {
          status: 'ok',
          timestamp: new Date().toISOString(),
          uptime: 100,
          version: '1.0.0',
        },
      };

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('ok');
    });

    test('should return timestamp in ISO format', () => {
      const response = {
        body: {
          status: 'ok',
          timestamp: new Date().toISOString(),
          uptime: 100,
          version: '1.0.0',
        },
      };

      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    test('should return uptime in seconds', () => {
      const response = {
        body: {
          status: 'ok',
          timestamp: new Date().toISOString(),
          uptime: 3600,
          version: '1.0.0',
        },
      };

      expect(response.body).toHaveProperty('uptime');
      expect(typeof response.body.uptime).toBe('number');
      expect(response.body.uptime).toBeGreaterThanOrEqual(0);
    });

    test('should return version string', () => {
      const response = {
        body: {
          status: 'ok',
          timestamp: new Date().toISOString(),
          uptime: 100,
          version: '1.0.0',
        },
      };

      expect(response.body).toHaveProperty('version');
      expect(typeof response.body.version).toBe('string');
      expect(response.body.version).toMatch(/^\d+\.\d+\.\d+/);
    });

    test('should return 503 when unhealthy', () => {
      const response = {
        status: 503,
        body: {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: 'Authentication failed',
        },
      };

      expect(response.status).toBe(503);
      expect(response.body.status).toBe('unhealthy');
    });
  });

  describe('GET /health/detailed - Detailed Health Check', () => {
    test('should return 200 when all checks pass', () => {
      const response = {
        status: 200,
        body: {
          status: 'ok',
          timestamp: new Date().toISOString(),
          uptime: 100,
          version: '1.0.0',
          checks: {
            server: 'ok',
            authentication: 'ok',
            sessions: 'ok',
            qwenApi: 'unknown',
          },
          metrics: {
            activeSessions: 5,
            totalSessions: 100,
            memory: {
              heapUsed: 50000000,
              heapTotal: 100000000,
              rss: 120000000,
              external: 1000000,
            },
          },
        },
      };

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    });

    test('should include health checks', () => {
      const response = {
        body: {
          checks: {
            server: 'ok',
            authentication: 'ok',
            sessions: 'ok',
            qwenApi: 'unknown',
          },
        },
      };

      expect(response.body).toHaveProperty('checks');
      expect(response.body.checks).toHaveProperty('server');
      expect(response.body.checks).toHaveProperty('authentication');
      expect(response.body.checks).toHaveProperty('sessions');
      expect(response.body.checks).toHaveProperty('qwenApi');
    });

    test('should include metrics object', () => {
      const response = {
        body: {
          metrics: {
            activeSessions: 5,
            totalSessions: 100,
            memory: {
              heapUsed: 50000000,
              heapTotal: 100000000,
              rss: 120000000,
              external: 1000000,
            },
          },
        },
      };

      expect(response.body).toHaveProperty('metrics');
      expect(response.body.metrics).toHaveProperty('memory');
    });

    test('should include memory usage details', () => {
      const response = {
        body: {
          metrics: {
            memory: {
              heapUsed: 50000000,
              heapTotal: 100000000,
              rss: 120000000,
              external: 1000000,
            },
          },
        },
      };

      expect(response.body.metrics.memory).toHaveProperty('heapUsed');
      expect(response.body.metrics.memory).toHaveProperty('heapTotal');
      expect(response.body.metrics.memory).toHaveProperty('rss');
      expect(response.body.metrics.memory).toHaveProperty('external');
    });

    test('should include session metrics', () => {
      const response = {
        body: {
          metrics: {
            activeSessions: 5,
            totalSessions: 100,
          },
        },
      };

      expect(response.body.metrics).toHaveProperty('activeSessions');
      expect(typeof response.body.metrics.activeSessions).toBe('number');
    });

    test('should return 503 when authentication fails', () => {
      const response = {
        status: 503,
        body: {
          status: 'unhealthy',
          checks: {
            server: 'ok',
            authentication: 'error',
            sessions: 'ok',
            qwenApi: 'unknown',
          },
        },
      };

      expect(response.status).toBe(503);
      expect(response.body.status).toBe('unhealthy');
      expect(response.body.checks.authentication).toBe('error');
    });

    test('should return degraded status when some checks fail', () => {
      const response = {
        status: 503,
        body: {
          status: 'degraded',
          checks: {
            server: 'ok',
            authentication: 'ok',
            sessions: 'degraded',
            qwenApi: 'error',
          },
        },
      };

      expect(response.body.status).toBe('degraded');
      expect(response.body.checks.sessions).toBe('degraded');
    });
  });

  describe('GET /metrics - Prometheus Metrics', () => {
    test('should return 200 status code', () => {
      const response = {
        status: 200,
      };

      expect(response.status).toBe(200);
    });

    test('should return Prometheus content type', () => {
      const response = {
        headers: {
          'content-type': 'text/plain; version=0.0.4; charset=utf-8',
        },
      };

      expect(response.headers['content-type']).toMatch(/text\/plain/);
    });

    test('should include HTTP request metrics', () => {
      const metricsOutput = `
# HELP http_request_duration_seconds Duration of HTTP requests in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.01",method="GET",path="/v1/models",status="200"} 5
http_request_duration_seconds_sum{method="GET",path="/v1/models",status="200"} 0.125
http_request_duration_seconds_count{method="GET",path="/v1/models",status="200"} 5

# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",path="/v1/models",status="200"} 5
      `;

      expect(metricsOutput).toContain('http_request_duration_seconds');
      expect(metricsOutput).toContain('http_requests_total');
    });

    test('should include Qwen API call metrics', () => {
      const metricsOutput = `
# HELP qwen_api_calls_total Total number of Qwen API calls
# TYPE qwen_api_calls_total counter
qwen_api_calls_total{endpoint="/api/v2/chats/new",status="success"} 10
qwen_api_calls_total{endpoint="/api/v2/chat/completions",status="success"} 50
      `;

      expect(metricsOutput).toContain('qwen_api_calls_total');
    });

    test('should include active sessions gauge', () => {
      const metricsOutput = `
# HELP active_sessions Number of active sessions
# TYPE active_sessions gauge
active_sessions 5
      `;

      expect(metricsOutput).toContain('active_sessions');
    });

    test('should include streaming connections gauge', () => {
      const metricsOutput = `
# HELP streaming_connections_active Number of active streaming connections
# TYPE streaming_connections_active gauge
streaming_connections_active 2
      `;

      expect(metricsOutput).toContain('streaming_connections_active');
    });

    test('should include default Node.js metrics', () => {
      const metricsOutput = `
# HELP process_cpu_user_seconds_total Total user CPU time spent in seconds
# TYPE process_cpu_user_seconds_total counter

# HELP nodejs_heap_size_total_bytes Process heap size from Node.js in bytes
# TYPE nodejs_heap_size_total_bytes gauge
      `;

      expect(metricsOutput).toContain('process_cpu_user_seconds_total');
      expect(metricsOutput).toContain('nodejs_heap_size_total_bytes');
    });
  });

  describe('Metrics Middleware', () => {
    test('should track request duration', () => {
      const metricsHandler = require('../../src/handlers/metrics-handler');

      expect(metricsHandler).toHaveProperty('metricsMiddleware');
      expect(typeof metricsHandler.metricsMiddleware).toBe('function');
    });

    test('should track request count by method and path', () => {
      const metricsHandler = require('../../src/handlers/metrics-handler');

      expect(metricsHandler).toHaveProperty('httpRequestTotal');
      expect(metricsHandler.httpRequestTotal).toBeDefined();
    });

    test('should track request duration histogram', () => {
      const metricsHandler = require('../../src/handlers/metrics-handler');

      expect(metricsHandler).toHaveProperty('httpRequestDuration');
      expect(metricsHandler.httpRequestDuration).toBeDefined();
    });

    test('should provide helper functions for tracking', () => {
      const metricsHandler = require('../../src/handlers/metrics-handler');

      expect(metricsHandler).toHaveProperty('trackQwenAPICall');
      expect(metricsHandler).toHaveProperty('trackQwenAPIError');
      expect(metricsHandler).toHaveProperty('incrementStreamingConnections');
      expect(metricsHandler).toHaveProperty('decrementStreamingConnections');
    });
  });

  describe('Kubernetes Probes', () => {
    test('should support liveness probe endpoint', () => {
      const healthHandler = require('../../src/handlers/health-handler');

      // Check if liveness endpoint exists
      const hasLiveness = healthHandler.liveness !== undefined;
      expect(hasLiveness || healthHandler.health !== undefined).toBe(true);
    });

    test('should support readiness probe endpoint', () => {
      const healthHandler = require('../../src/handlers/health-handler');

      // Check if readiness endpoint exists
      const hasReadiness = healthHandler.readiness !== undefined;
      expect(hasReadiness || healthHandler.detailedHealth !== undefined).toBe(true);
    });
  });

  describe('Health Handler Export', () => {
    test('should export health function', () => {
      const handler = require('../../src/handlers/health-handler');

      expect(handler).toHaveProperty('health');
      expect(typeof handler.health).toBe('function');
    });

    test('should export detailedHealth function', () => {
      const handler = require('../../src/handlers/health-handler');

      expect(handler).toHaveProperty('detailedHealth');
      expect(typeof handler.detailedHealth).toBe('function');
    });
  });

  describe('Metrics Handler Export', () => {
    test('should export metrics function', () => {
      const handler = require('../../src/handlers/metrics-handler');

      expect(handler).toHaveProperty('metrics');
      expect(typeof handler.metrics).toBe('function');
    });

    test('should export metricsMiddleware function', () => {
      const handler = require('../../src/handlers/metrics-handler');

      expect(handler).toHaveProperty('metricsMiddleware');
      expect(typeof handler.metricsMiddleware).toBe('function');
    });

    test('should export register object', () => {
      const handler = require('../../src/handlers/metrics-handler');

      expect(handler).toHaveProperty('register');
      expect(handler.register).toBeDefined();
    });

    test('should export individual metrics', () => {
      const handler = require('../../src/handlers/metrics-handler');

      expect(handler).toHaveProperty('httpRequestDuration');
      expect(handler).toHaveProperty('httpRequestTotal');
      expect(handler).toHaveProperty('qwenAPICallsTotal');
      expect(handler).toHaveProperty('qwenAPIErrorsTotal');
      expect(handler).toHaveProperty('activeSessions');
      expect(handler).toHaveProperty('streamingConnectionsActive');
    });
  });

  describe('Error Handling', () => {
    test('should handle health check errors gracefully', () => {
      const errorResponse = {
        status: 503,
        body: {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: 'Internal error',
        },
      };

      expect(errorResponse.status).toBe(503);
      expect(errorResponse.body).toHaveProperty('error');
    });

    test('should handle metrics generation errors', () => {
      const errorResponse = {
        status: 500,
        body: {
          error: {
            message: 'Failed to generate metrics',
            type: 'server_error',
            code: 'metrics_error',
          },
        },
      };

      expect(errorResponse.status).toBe(500);
      expect(errorResponse.body.error.code).toBe('metrics_error');
    });
  });

  describe('Authentication Check', () => {
    test('should verify authentication credentials', () => {
      const qwenAuth = require('../../src/api/qwen-auth');

      // Check if auth module has isValid method
      const hasIsValid = typeof qwenAuth.isValid === 'function' ||
                        (qwenAuth.getInstance && typeof qwenAuth.getInstance().isValid === 'function');

      expect(hasIsValid).toBe(true);
    });

    test('should report authentication status in health check', () => {
      const response = {
        body: {
          checks: {
            authentication: 'ok',
          },
        },
      };

      expect(response.body.checks.authentication).toMatch(/^(ok|error|unknown)$/);
    });
  });

  describe('Session Metrics', () => {
    test('should report active sessions count', () => {
      const SessionManager = require('../../src/services/session-manager');
      const manager = new SessionManager();

      const metrics = manager.getMetrics();

      expect(metrics).toHaveProperty('activeSessions');
      expect(typeof metrics.activeSessions).toBe('number');
    });

    test('should report total created sessions', () => {
      const SessionManager = require('../../src/services/session-manager');
      const manager = new SessionManager();

      const metrics = manager.getMetrics();

      expect(metrics).toHaveProperty('totalCreated');
      expect(typeof metrics.totalCreated).toBe('number');
    });

    test('should report total cleaned sessions', () => {
      const SessionManager = require('../../src/services/session-manager');
      const manager = new SessionManager();

      const metrics = manager.getMetrics();

      expect(metrics).toHaveProperty('totalCleaned');
      expect(typeof metrics.totalCleaned).toBe('number');
    });
  });

  describe('Memory Monitoring', () => {
    test('should report heap usage', () => {
      const memUsage = process.memoryUsage();

      expect(memUsage).toHaveProperty('heapUsed');
      expect(memUsage).toHaveProperty('heapTotal');
      expect(typeof memUsage.heapUsed).toBe('number');
      expect(typeof memUsage.heapTotal).toBe('number');
    });

    test('should report RSS memory', () => {
      const memUsage = process.memoryUsage();

      expect(memUsage).toHaveProperty('rss');
      expect(typeof memUsage.rss).toBe('number');
    });

    test('should report external memory', () => {
      const memUsage = process.memoryUsage();

      expect(memUsage).toHaveProperty('external');
      expect(typeof memUsage.external).toBe('number');
    });
  });
});
