/**
 * Configuration Module
 * Loads and validates environment variables
 * Part of Phase 1: Project Structure and Configuration
 */

require('dotenv').config();

/**
 * Validate required environment variables
 * @throws {Error} If required variables are missing
 *
 * NOTE: Qwen credentials are now stored in the database, not .env
 * This validation is disabled to allow server startup without credentials
 */
function validateConfig() {
  // No longer require QWEN_TOKEN and QWEN_COOKIES in .env
  // Credentials are read from centralized database instead
  // Server will start successfully even without credentials
  // API endpoints will return appropriate errors if credentials are missing
}

// Validation disabled - server can start without credentials
// validateConfig();

/**
 * Centralized configuration object
 */
const config = {
  // Environment
  env: process.env.NODE_ENV || 'development',

  // Server configuration
  port: parseInt(process.env.PORT, 10) || 3000,

  // Qwen API configuration
  // NOTE: token and cookies are now read from database, not .env
  qwen: {
    token: process.env.QWEN_TOKEN || null, // Fallback to env if set, otherwise null
    cookies: process.env.QWEN_COOKIES || null, // Fallback to env if set, otherwise null
    baseURL: process.env.QWEN_BASE_URL || 'https://chat.qwen.ai',
    timeout: parseInt(process.env.QWEN_TIMEOUT, 10) || 120000, // 2 minutes
  },

  // Session management
  session: {
    timeout: parseInt(process.env.SESSION_TIMEOUT, 10) || 30 * 60 * 1000, // 30 minutes
    cleanupInterval: parseInt(process.env.SESSION_CLEANUP_INTERVAL, 10) || 10 * 60 * 1000, // 10 minutes
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || 'logs',
    maxSize: parseInt(process.env.LOG_MAX_SIZE, 10) || 10485760, // 10MB
    maxFiles: parseInt(process.env.LOG_MAX_FILES, 10) || 5,
  },

  // Security
  security: {
    trustProxy: process.env.TRUST_PROXY === 'true',
    corsOrigin: process.env.CORS_ORIGIN || '*',
  },

  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  },

  // Retry configuration
  retry: {
    maxRetries: parseInt(process.env.MAX_RETRIES, 10) || 3,
    baseDelay: parseInt(process.env.RETRY_BASE_DELAY, 10) || 0, // No delay
    maxDelay: parseInt(process.env.RETRY_MAX_DELAY, 10) || 0, // No delay
  },

  // Database configuration
  // NOTE: Using centralized provider-router database instead of separate qwen-proxy database
  database: {
    path: process.env.DATABASE_PATH || require('path').join(__dirname, '../../../provider-router/data/provider-router.db'),
    verbose: process.env.DATABASE_VERBOSE === 'true',
    busyTimeout: parseInt(process.env.DATABASE_BUSY_TIMEOUT, 10) || 5000,
  },
};

module.exports = config;
