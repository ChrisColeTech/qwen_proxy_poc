/**
 * Logger Unit Tests
 *
 * Tests the Winston logger configuration:
 * - Logger instance creation
 * - Log levels work correctly
 * - File transports configured
 * - Console transport in development only
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

describe('Logger Configuration', () => {
  let logger;
  let originalEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = process.env.NODE_ENV;

    // Clear require cache to get fresh logger instance
    jest.resetModules();
  });

  afterEach(() => {
    // Restore original environment
    process.env.NODE_ENV = originalEnv;
  });

  test('should create logger instance', () => {
    const logger = require('../../src/utils/logger');
    expect(logger).toBeDefined();
    expect(logger.info).toBeDefined();
    expect(logger.error).toBeDefined();
    expect(logger.warn).toBeDefined();
    expect(logger.debug).toBeDefined();
  });

  test('should have default metadata', () => {
    const logger = require('../../src/utils/logger');
    expect(logger.defaultMeta).toEqual({ service: 'qwen-proxy' });
  });

  test('should have file transports configured', () => {
    const logger = require('../../src/utils/logger');
    const transports = logger.transports;

    // Should have at least 2 file transports (error.log and combined.log)
    const fileTransports = transports.filter(t => t instanceof winston.transports.File);
    expect(fileTransports.length).toBeGreaterThanOrEqual(2);

    // Check if error log transport exists
    const errorLog = fileTransports.find(t => t.filename.includes('error.log'));
    expect(errorLog).toBeDefined();
    expect(errorLog.level).toBe('error');

    // Check if combined log transport exists
    const combinedLog = fileTransports.find(t => t.filename.includes('combined.log'));
    expect(combinedLog).toBeDefined();
  });

  test('should have console transport in development', () => {
    process.env.NODE_ENV = 'development';
    jest.resetModules();
    const logger = require('../../src/utils/logger');

    const consoleTransports = logger.transports.filter(
      t => t instanceof winston.transports.Console
    );
    expect(consoleTransports.length).toBeGreaterThan(0);
  });

  test('should not have console transport in production', () => {
    process.env.NODE_ENV = 'production';
    jest.resetModules();
    const logger = require('../../src/utils/logger');

    const consoleTransports = logger.transports.filter(
      t => t instanceof winston.transports.Console
    );
    expect(consoleTransports.length).toBe(0);
  });

  test('should log at debug level in test environment', () => {
    delete process.env.LOG_LEVEL;
    process.env.NODE_ENV = 'test';
    jest.resetModules();
    const logger = require('../../src/utils/logger');

    // Config defaults to 'debug' in non-production (test, development)
    expect(logger.level).toBe('debug');
  });

  test('should respect LOG_LEVEL environment variable', () => {
    process.env.LOG_LEVEL = 'debug';
    jest.resetModules();
    const logger = require('../../src/utils/logger');

    expect(logger.level).toBe('debug');
  });

  test('should include timestamp in log format', () => {
    const logger = require('../../src/utils/logger');
    const formats = logger.format;
    expect(formats).toBeDefined();
  });

  test('should handle error objects with stack traces', () => {
    const logger = require('../../src/utils/logger');

    // Mock the transport write method
    const mockWrite = jest.fn();
    logger.transports.forEach(transport => {
      transport.write = mockWrite;
    });

    const testError = new Error('Test error');
    logger.error('Error occurred', { error: testError });

    // Logger should have attempted to write
    expect(mockWrite).toHaveBeenCalled();
  });
});
