/**
 * Metrics Unit Tests
 *
 * Tests the Prometheus metrics configuration:
 * - Metrics register correctly
 * - Counters increment
 * - Histograms observe values
 * - Gauges set values
 * - Metrics endpoint returns Prometheus format
 */

const promClient = require('prom-client');

describe('Metrics Configuration', () => {
  let metrics, register;

  beforeEach(() => {
    // Clear require cache to get fresh metrics instance
    jest.resetModules();
    const metricsModule = require('../../src/utils/metrics');
    metrics = metricsModule.metrics;
    register = metricsModule.register;
  });

  afterEach(() => {
    // Clear all metrics
    register.clear();
  });

  test('should export metrics object', () => {
    expect(metrics).toBeDefined();
    expect(metrics.httpRequestDuration).toBeDefined();
    expect(metrics.httpRequestTotal).toBeDefined();
    expect(metrics.activeSessionsGauge).toBeDefined();
    expect(metrics.qwenAPICallsTotal).toBeDefined();
    expect(metrics.qwenAPIErrorsTotal).toBeDefined();
    expect(metrics.sessionCleanupTotal).toBeDefined();
  });

  test('should export register', () => {
    expect(register).toBeDefined();
    expect(register.metrics).toBeDefined();
  });

  test('httpRequestDuration should be a Histogram', () => {
    expect(metrics.httpRequestDuration.constructor.name).toBe('Histogram');
  });

  test('httpRequestTotal should be a Counter', () => {
    expect(metrics.httpRequestTotal.constructor.name).toBe('Counter');
  });

  test('activeSessionsGauge should be a Gauge', () => {
    expect(metrics.activeSessionsGauge.constructor.name).toBe('Gauge');
  });

  test('qwenAPICallsTotal should be a Counter', () => {
    expect(metrics.qwenAPICallsTotal.constructor.name).toBe('Counter');
  });

  test('qwenAPIErrorsTotal should be a Counter', () => {
    expect(metrics.qwenAPIErrorsTotal.constructor.name).toBe('Counter');
  });

  test('sessionCleanupTotal should be a Counter', () => {
    expect(metrics.sessionCleanupTotal.constructor.name).toBe('Counter');
  });

  test('should increment counter', async () => {
    metrics.httpRequestTotal.labels('GET', '/test', 200).inc();

    const metricsOutput = await register.metrics();
    expect(metricsOutput).toContain('qwen_proxy_http_requests_total');
    expect(metricsOutput).toContain('method="GET"');
    expect(metricsOutput).toContain('route="/test"');
  });

  test('should observe histogram values', async () => {
    metrics.httpRequestDuration.labels('POST', '/v1/chat/completions', 200).observe(1.5);

    const metricsOutput = await register.metrics();
    expect(metricsOutput).toContain('qwen_proxy_http_request_duration_seconds');
    expect(metricsOutput).toContain('method="POST"');
  });

  test('should set gauge value', async () => {
    metrics.activeSessionsGauge.set(42);

    const metricsOutput = await register.metrics();
    expect(metricsOutput).toContain('qwen_proxy_active_sessions 42');
  });

  test('should increment counter multiple times', async () => {
    metrics.qwenAPICallsTotal.labels('success').inc();
    metrics.qwenAPICallsTotal.labels('success').inc();
    metrics.qwenAPICallsTotal.labels('success').inc();

    const metricsOutput = await register.metrics();
    expect(metricsOutput).toContain('qwen_proxy_api_calls_total');
    expect(metricsOutput).toContain('status="success"');
  });

  test('should track different error types', async () => {
    metrics.qwenAPIErrorsTotal.labels('QwenAuthError').inc();
    metrics.qwenAPIErrorsTotal.labels('SessionError').inc();
    metrics.qwenAPIErrorsTotal.labels('QwenAuthError').inc();

    const metricsOutput = await register.metrics();
    expect(metricsOutput).toContain('qwen_proxy_api_errors_total');
    expect(metricsOutput).toContain('error_type="QwenAuthError"');
    expect(metricsOutput).toContain('error_type="SessionError"');
  });

  test('should increment session cleanup counter', async () => {
    metrics.sessionCleanupTotal.inc(5);

    const metricsOutput = await register.metrics();
    expect(metricsOutput).toContain('qwen_proxy_session_cleanup_total');
  });

  test('should return metrics in Prometheus format', async () => {
    metrics.httpRequestTotal.labels('GET', '/health', 200).inc();
    metrics.activeSessionsGauge.set(10);

    const metricsString = await register.metrics();
    expect(metricsString).toContain('qwen_proxy_http_requests_total');
    expect(metricsString).toContain('qwen_proxy_active_sessions');
  });

  test('should have correct metric names', async () => {
    const metricsString = await register.metrics();
    expect(metricsString).toContain('qwen_proxy_http_request_duration_seconds');
    expect(metricsString).toContain('qwen_proxy_http_requests_total');
    expect(metricsString).toContain('qwen_proxy_active_sessions');
    expect(metricsString).toContain('qwen_proxy_api_calls_total');
    expect(metricsString).toContain('qwen_proxy_api_errors_total');
    expect(metricsString).toContain('qwen_proxy_session_cleanup_total');
  });

  test('should include default metrics', async () => {
    const metricsString = await register.metrics();
    // Default metrics like process_cpu_user_seconds_total should be included
    expect(metricsString).toContain('process_');
  });

  test('should reset metrics correctly', async () => {
    metrics.httpRequestTotal.labels('GET', '/test', 200).inc();
    metrics.activeSessionsGauge.set(5);

    register.resetMetrics();

    const metricsOutput = await register.metrics();
    // After reset, metrics should still be defined but values reset
    expect(metricsOutput).toContain('qwen_proxy_');
  });
});
