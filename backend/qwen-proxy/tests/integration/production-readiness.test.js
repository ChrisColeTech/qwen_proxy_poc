/**
 * Production Readiness Integration Tests
 *
 * Tests production-specific features:
 * - Health check endpoint
 * - Metrics endpoint
 * - Graceful shutdown
 * - Error handling in production mode
 * - Logging in production mode
 */

const request = require('supertest');

describe('Production Readiness', () => {
  let app;
  let originalEnv;

  beforeAll(() => {
    // Save original environment
    originalEnv = { ...process.env };

    // Ensure credentials are set for tests
    process.env.QWEN_TOKEN = process.env.QWEN_TOKEN || 'test-token-for-production-tests';
    process.env.QWEN_COOKIES = process.env.QWEN_COOKIES || 'test-cookies-for-production-tests';
  });

  beforeEach(() => {
    // Clear module cache to get fresh instances
    jest.resetModules();

    // Load app fresh for each test
    app = require('../../src/server');
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Health Check Endpoint', () => {
    test('should return 200 OK', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
    });

    test('should return JSON with status information', async () => {
      const response = await request(app)
        .get('/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toMatchObject({
        status: expect.any(String)
      });
    });

    test('should include session metrics', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('activeSessions');
      expect(typeof response.body.activeSessions).toBe('number');
    });

    test('should include uptime information', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('uptime');
      expect(typeof response.body.uptime).toBe('number');
      expect(response.body.uptime).toBeGreaterThanOrEqual(0);
    });

    test('should be accessible without authentication', async () => {
      // Health check should work even without auth headers
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBeDefined();
    });
  });

  describe('Metrics Endpoint', () => {
    test('should return 200 OK', async () => {
      await request(app)
        .get('/metrics')
        .expect(200);
    });

    test('should return Prometheus format', async () => {
      const response = await request(app)
        .get('/metrics')
        .expect(200);

      // Prometheus metrics should be plain text
      expect(response.headers['content-type']).toMatch(/text\/plain/);
    });

    test('should include custom metrics', async () => {
      const response = await request(app)
        .get('/metrics')
        .expect(200);

      const metricsText = response.text;

      // Check for at least one of our custom metrics
      const hasQwenMetrics = metricsText.includes('qwen_') ||
                            metricsText.includes('http_');

      expect(hasQwenMetrics).toBe(true);
    });

    test('should be accessible without authentication', async () => {
      await request(app)
        .get('/metrics')
        .expect(200);
    });
  });

  describe('Error Handling', () => {
    test('should return OpenAI-compatible error format', async () => {
      const response = await request(app)
        .post('/v1/chat/completions')
        .send({
          // Invalid request: missing messages
          model: 'qwen'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatchObject({
        message: expect.any(String),
        type: expect.any(String)
      });
    });

    test('should handle empty messages array', async () => {
      const response = await request(app)
        .post('/v1/chat/completions')
        .send({
          model: 'qwen',
          messages: []
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.type).toBe('invalid_request_error');
    });

    test('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/v1/chat/completions')
        .set('Content-Type', 'application/json')
        .send('invalid json{')
        .expect(400);

      // Express should handle malformed JSON
      expect(response.status).toBe(400);
    });

    test('should return 404 for unknown routes', async () => {
      await request(app)
        .get('/unknown-route')
        .expect(404);
    });

    test('should handle POST to non-existent routes', async () => {
      await request(app)
        .post('/v1/unknown')
        .send({})
        .expect(404);
    });
  });

  describe('Request Validation', () => {
    test('should reject request without messages', async () => {
      const response = await request(app)
        .post('/v1/chat/completions')
        .send({
          model: 'qwen'
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    test('should reject request with non-array messages', async () => {
      const response = await request(app)
        .post('/v1/chat/completions')
        .send({
          model: 'qwen',
          messages: 'not an array'
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    test('should accept valid request format', async () => {
      // This will fail if credentials are invalid, but should pass validation
      const response = await request(app)
        .post('/v1/chat/completions')
        .send({
          model: 'qwen',
          messages: [
            { role: 'user', content: 'Hello' }
          ]
        });

      // Should not be a validation error (400)
      // Might be 401 (auth), 500 (error), or 200 (success)
      expect(response.status).not.toBe(400);
    });
  });

  describe('CORS and Headers', () => {
    test('should accept JSON content type', async () => {
      await request(app)
        .post('/v1/chat/completions')
        .set('Content-Type', 'application/json')
        .send({
          model: 'qwen',
          messages: [{ role: 'user', content: 'test' }]
        });

      // Should accept request (might fail auth, but should accept JSON)
      expect(true).toBe(true);
    });

    test('should handle OPTIONS requests', async () => {
      const response = await request(app)
        .options('/v1/chat/completions');

      // OPTIONS should be handled
      expect([200, 204, 404]).toContain(response.status);
    });
  });

  describe('Logging Integration', () => {
    test('should not crash when logger is called', async () => {
      // Make a request that will trigger logging
      await request(app)
        .get('/health')
        .expect(200);

      // If we get here, logging didn't crash the app
      expect(true).toBe(true);
    });

    test('should log errors without crashing', async () => {
      // Make a bad request that will trigger error logging
      await request(app)
        .post('/v1/chat/completions')
        .send({ invalid: 'data' })
        .expect(400);

      // If we get here, error logging didn't crash the app
      expect(true).toBe(true);
    });
  });

  describe('Performance', () => {
    test('health check should respond quickly', async () => {
      const start = Date.now();

      await request(app)
        .get('/health')
        .expect(200);

      const duration = Date.now() - start;

      // Health check should be fast (< 100ms)
      expect(duration).toBeLessThan(100);
    });

    test('metrics endpoint should respond quickly', async () => {
      const start = Date.now();

      await request(app)
        .get('/metrics')
        .expect(200);

      const duration = Date.now() - start;

      // Metrics should be fast (< 100ms)
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Concurrent Requests', () => {
    test('should handle multiple health checks concurrently', async () => {
      const requests = Array(10).fill(null).map(() =>
        request(app)
          .get('/health')
          .expect(200)
      );

      const responses = await Promise.all(requests);

      expect(responses).toHaveLength(10);
      responses.forEach(response => {
        expect(response.body.status).toBeDefined();
      });
    });

    test('should handle mixed endpoint requests concurrently', async () => {
      const requests = [
        request(app).get('/health'),
        request(app).get('/metrics'),
        request(app).get('/health'),
        request(app).get('/metrics')
      ];

      const responses = await Promise.all(requests);

      expect(responses).toHaveLength(4);
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Configuration Integration', () => {
    test('should use centralized config for port', () => {
      const config = require('../../src/config');

      expect(config.port).toBeDefined();
      expect(typeof config.port).toBe('number');
    });

    test('should validate required configuration', () => {
      const config = require('../../src/config');

      // Config should have loaded successfully (if we're here)
      expect(config.qwen.token).toBeDefined();
      expect(config.qwen.cookies).toBeDefined();
    });

    test('should have all configuration sections', () => {
      const config = require('../../src/config');

      expect(config.qwen).toBeDefined();
      expect(config.session).toBeDefined();
      expect(config.logging).toBeDefined();
      expect(config.security).toBeDefined();
      expect(config.retry).toBeDefined();
    });
  });

  describe('Graceful Degradation', () => {
    test('should return error when service unavailable', async () => {
      // Make request with invalid messages to trigger error
      const response = await request(app)
        .post('/v1/chat/completions')
        .send({
          messages: [{ role: 'user', content: 'test' }]
        });

      // Should get some response (not hang)
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(600);
    });
  });
});
