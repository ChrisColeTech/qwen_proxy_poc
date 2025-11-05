/**
 * Logger Module
 * Winston-based logging with proper levels and formatting
 * Part of Phase 12: Error Handling and Logging Infrastructure
 */

const winston = require('winston');
const config = require('../config');
const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.resolve(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}] ${message}`;

    // Add metadata if present
    const metaKeys = Object.keys(meta);
    if (metaKeys.length > 0) {
      // Filter out empty objects and internal winston props
      const filteredMeta = {};
      for (const key of metaKeys) {
        if (key !== 'level' && key !== 'message' && key !== 'timestamp') {
          filteredMeta[key] = meta[key];
        }
      }

      if (Object.keys(filteredMeta).length > 0) {
        log += ` ${JSON.stringify(filteredMeta)}`;
      }
    }

    return log;
  })
);

// Console format with colors for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  logFormat
);

// Create logger
const logger = winston.createLogger({
  level: config.logging.level || 'info',
  format: logFormat,
  transports: [
    // Console output
    new winston.transports.Console({
      format: config.logging.pretty !== false
        ? consoleFormat
        : logFormat
    }),

    // File output for errors
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: config.logging.maxSize || 5242880, // 5MB
      maxFiles: config.logging.maxFiles || 5
    }),

    // File output for all logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: config.logging.maxSize || 5242880,
      maxFiles: config.logging.maxFiles || 5
    })
  ]
});

// Add request logging helper
logger.logRequest = (req, statusCode, duration) => {
  logger.info('HTTP Request', {
    method: req.method,
    path: req.path || req.url,
    status: statusCode,
    duration: `${duration}ms`,
    ip: req.ip || req.connection?.remoteAddress
  });
};

// Add error logging helper
logger.logError = (error, context = {}) => {
  logger.error(error.message || 'Unknown error', {
    stack: error.stack,
    name: error.name,
    ...context
  });
};

// Log startup information
logger.info('Logger initialized', {
  level: config.logging.level || 'info',
  logsDir
});

module.exports = logger;
