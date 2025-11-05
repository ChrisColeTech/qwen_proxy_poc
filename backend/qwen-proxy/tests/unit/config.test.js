/**
 * Unit Tests for Centralized Configuration
 *
 * Tests configuration loading, validation, and environment detection.
 * Note: Config is loaded once at startup, so these tests verify the actual configuration.
 */

describe('Config', () => {
  let config;

  beforeAll(() => {
    // Load config once (it's a singleton)
    config = require('../../src/config');
  });

  describe('Environment Detection', () => {
    test('should have environment set', () => {
      expect(config.env).toBeDefined();
      expect(typeof config.env).toBe('string');
    });

    test('should have environment detection methods', () => {
      expect(typeof config.isDevelopment).toBe('function');
      expect(typeof config.isProduction).toBe('function');
      expect(typeof config.isTest).toBe('function');
    });

    test('should be in test environment during tests', () => {
      // When running with NODE_ENV=test
      expect(config.isTest()).toBe(true);
    });

    test('environment detection methods should be mutually exclusive', () => {
      const envStates = [
        config.isDevelopment(),
        config.isProduction(),
        config.isTest()
      ];

      // Exactly one should be true
      const trueCount = envStates.filter(Boolean).length;
      expect(trueCount).toBe(1);
    });
  });

  describe('Configuration Loading', () => {
    test('should load server configuration', () => {
      expect(config.port).toBeDefined();
      expect(typeof config.port).toBe('number');
      expect(config.port).toBeGreaterThan(0);
    });

    test('should load Qwen API configuration', () => {
      expect(config.qwen).toBeDefined();
      expect(config.qwen.baseUrl).toBe('https://chat.qwen.ai');
      expect(config.qwen.token).toBeDefined();
      expect(config.qwen.cookies).toBeDefined();
      expect(config.qwen.timeout).toBe(120000);
    });

    test('should load session configuration', () => {
      expect(config.session).toBeDefined();
      expect(config.session.timeout).toBeDefined();
      expect(config.session.cleanupInterval).toBeDefined();
      expect(typeof config.session.timeout).toBe('number');
      expect(typeof config.session.cleanupInterval).toBe('number');
    });

    test('should load logging configuration', () => {
      expect(config.logging).toBeDefined();
      expect(config.logging.level).toBeDefined();
      expect(config.logging.directory).toBe('logs');
      expect(config.logging.maxFileSize).toBe(10485760); // 10MB
      expect(config.logging.maxFiles).toBe(5);
    });

    test('should load security configuration', () => {
      expect(config.security).toBeDefined();
      expect(config.security.rateLimitWindow).toBeDefined();
      expect(config.security.rateLimitMax).toBeDefined();
      expect(config.security.corsOrigin).toBeDefined();
      expect(typeof config.security.trustProxy).toBe('boolean');
    });

    test('should load retry configuration', () => {
      expect(config.retry).toBeDefined();
      expect(config.retry.maxRetries).toBe(3);
      expect(config.retry.baseDelay).toBe(1000);
      expect(config.retry.maxDelay).toBe(10000);
    });
  });

  describe('Validation', () => {
    test('should have validation method', () => {
      expect(typeof config.validate).toBe('function');
    });

    test('should have loaded with valid credentials', () => {
      // If config loaded successfully, validation passed
      expect(config.qwen.token).toBeDefined();
      expect(config.qwen.cookies).toBeDefined();
      expect(config.qwen.token.length).toBeGreaterThan(0);
    });

    test('should have all required fields present', () => {
      // Check that required fields exist
      expect(config.qwen).toBeDefined();
      expect(config.qwen.token).not.toBeNull();
      expect(config.qwen.cookies).not.toBeNull();
    });
  });

  describe('Type Conversions', () => {
    test('should parse PORT as integer', () => {
      expect(typeof config.port).toBe('number');
      expect(Number.isInteger(config.port)).toBe(true);
    });

    test('should parse timeout values as integers', () => {
      expect(typeof config.qwen.timeout).toBe('number');
      expect(typeof config.session.timeout).toBe('number');
      expect(Number.isInteger(config.qwen.timeout)).toBe(true);
      expect(Number.isInteger(config.session.timeout)).toBe(true);
    });

    test('should parse rate limit values as integers', () => {
      expect(typeof config.security.rateLimitWindow).toBe('number');
      expect(typeof config.security.rateLimitMax).toBe('number');
      expect(Number.isInteger(config.security.rateLimitWindow)).toBe(true);
      expect(Number.isInteger(config.security.rateLimitMax)).toBe(true);
    });

    test('should parse retry values as integers', () => {
      expect(typeof config.retry.maxRetries).toBe('number');
      expect(typeof config.retry.baseDelay).toBe('number');
      expect(typeof config.retry.maxDelay).toBe('number');
      expect(Number.isInteger(config.retry.maxRetries)).toBe(true);
    });

    test('should have sensible default values', () => {
      expect(config.retry.maxRetries).toBeGreaterThan(0);
      expect(config.retry.baseDelay).toBeGreaterThan(0);
      expect(config.session.timeout).toBeGreaterThan(0);
    });
  });

  describe('Configuration Immutability', () => {
    test('should return same config instance (singleton)', () => {
      const config1 = require('../../src/config');
      const config2 = require('../../src/config');

      expect(config1).toBe(config2);
    });

    test('should have all required sections', () => {
      expect(config).toHaveProperty('env');
      expect(config).toHaveProperty('port');
      expect(config).toHaveProperty('qwen');
      expect(config).toHaveProperty('session');
      expect(config).toHaveProperty('logging');
      expect(config).toHaveProperty('security');
      expect(config).toHaveProperty('retry');
    });
  });
});
