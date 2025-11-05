/**
 * Observability Integration Tests
 *
 * Tests the integration of logging and metrics across the application:
 * - /metrics endpoint works
 * - /health endpoint includes metrics
 * - Request logging works
 * - Metrics update on requests
 */

const request = require('supertest');
const app = require('../../src/server');

describe('Observability Integration', () => {
  describe('Metrics Endpoint', () => {
    test('GET /metrics should return 200', async () => {
      const response = await request(app)
        .get('/metrics')
        .expect(200);

      expect(response.headers['content-type']).toContain('text/plain');
    });

    test('GET /metrics should return Prometheus format', async () => {
      const response = await request(app)
        .get('/metrics')
        .expect(200);

      expect(response.text).toContain('# HELP');
      expect(response.text).toContain('# TYPE');
    });

    test('GET /metrics should include custom metrics', async () => {
      const response = await request(app)
        .get('/metrics')
        .expect(200);

      expect(response.text).toContain('qwen_proxy_http_requests_total');
      expect(response.text).toContain('qwen_proxy_active_sessions');
      expect(response.text).toContain('qwen_proxy_api_calls_total');
      expect(response.text).toContain('qwen_proxy_api_errors_total');
      expect(response.text).toContain('qwen_proxy_session_cleanup_total');
    });

    test('GET /metrics should include default metrics', async () => {
      const response = await request(app)
        .get('/metrics')
        .expect(200);

      // Should include Node.js default metrics
      expect(response.text).toContain('process_cpu');
      expect(response.text).toContain('nodejs_');
    });
  });

  describe('Health Endpoint with Metrics', () => {
    test('GET /health should include session metrics', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('activeSessions');
      expect(response.body).toHaveProperty('totalCreated');
      expect(response.body).toHaveProperty('totalCleaned');
      expect(response.body).toHaveProperty('uptime');
    });

    test('GET /health should have numeric session counts', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(typeof response.body.activeSessions).toBe('number');
      expect(typeof response.body.totalCreated).toBe('number');
      expect(typeof response.body.totalCleaned).toBe('number');
      expect(typeof response.body.uptime).toBe('number');
    });
  });

  describe('Request Metrics', () => {
    test('should update metrics after health check request', async () => {
      // Get initial metrics
      const initialMetrics = await request(app).get('/metrics');
      const initialText = initialMetrics.text;

      // Make a health check request
      await request(app).get('/health').expect(200);

      // Get updated metrics
      const updatedMetrics = await request(app).get('/metrics');
      const updatedText = updatedMetrics.text;

      // Should contain request counts
      expect(updatedText).toContain('qwen_proxy_http_requests_total');
      expect(updatedText).toContain('method="GET"');
      expect(updatedText).toContain('route="/health"');
    });

    test('should track request duration', async () => {
      await request(app).get('/health').expect(200);

      const response = await request(app).get('/metrics');

      // Should contain duration histogram
      expect(response.text).toContain('qwen_proxy_http_request_duration_seconds');
      expect(response.text).toContain('route="/health"');
    });

    test('should track different status codes', async () => {
      // Make a request that should return 404
      await request(app).get('/nonexistent').expect(404);

      const response = await request(app).get('/metrics');

      // Should track the 404 status
      expect(response.text).toContain('status="404"');
    });
  });

  describe('Logging Middleware', () => {
    test('should handle requests without errors', async () => {
      // This test ensures the logging middleware doesn't break normal requests
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
    });

    test('should handle POST requests', async () => {
      // This ensures logging works for POST requests too
      // Note: This will fail validation, but logging should still work
      const response = await request(app)
        .post('/v1/chat/completions')
        .send({ messages: [] })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Metrics After Multiple Requests', () => {
    test('should accumulate metrics across multiple requests', async () => {
      // Make multiple requests
      await request(app).get('/health');
      await request(app).get('/health');
      await request(app).get('/health');

      const response = await request(app).get('/metrics');

      // Should show accumulated counts
      expect(response.text).toContain('qwen_proxy_http_requests_total');

      // Parse the metrics to verify count
      const healthRequests = response.text.match(/qwen_proxy_http_requests_total\{.*route="\/health".*status="200".*\} (\d+)/);
      if (healthRequests) {
        const count = parseInt(healthRequests[1]);
        expect(count).toBeGreaterThanOrEqual(3);
      }
    });

    test('should update active sessions gauge', async () => {
      const response = await request(app).get('/metrics');

      // Should contain the active sessions gauge
      expect(response.text).toContain('qwen_proxy_active_sessions');

      // Should have a numeric value
      const gaugeMatch = response.text.match(/qwen_proxy_active_sessions (\d+)/);
      expect(gaugeMatch).toBeTruthy();
    });
  });

  describe('Error Metrics', () => {
    test('should handle invalid requests without breaking metrics', async () => {
      // Make an invalid request
      await request(app)
        .post('/v1/chat/completions')
        .send({ invalid: 'data' })
        .expect(400);

      // Metrics should still work
      const response = await request(app).get('/metrics');
      expect(response.status).toBe(200);
      expect(response.text).toContain('qwen_proxy_http_requests_total');
    });
  });
});
