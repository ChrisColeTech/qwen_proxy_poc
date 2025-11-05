/**
 * Request Logger Middleware
 * Logs incoming requests and outgoing responses with performance metrics
 */

import { logger } from '../utils/logger.js'
import config from '../config.js'

/**
 * Request logger middleware
 * Logs method, URL, response time, status, and performance metrics
 */
export function requestLogger(req, res, next) {
  const startTime = Date.now()
  const requestId = generateRequestId()

  // Add request ID to request object for tracking
  req.requestId = requestId

  // Collect request metadata
  const requestMeta = {
    requestId,
    method: req.method,
    url: req.url,
    path: req.path,
    query: req.query,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    contentLength: req.get('content-length'),
  }

  // Log incoming request with details
  logger.info(`Incoming Request: ${req.method} ${req.url}`, {
    ...requestMeta,
    timestamp: new Date().toISOString(),
  })

  // Log request body in debug mode
  if (config.logging.level === 'debug' && req.body) {
    logger.debug('Request Body:', {
      requestId,
      body: req.body,
    })
  }

  // Capture original end function
  const originalEnd = res.end
  const originalWrite = res.write

  let responseSize = 0

  // Override write to track response size
  res.write = function(chunk, ...args) {
    if (chunk) {
      responseSize += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk)
    }
    return originalWrite.apply(res, [chunk, ...args])
  }

  // Override end to log response with performance metrics
  res.end = function(chunk, ...args) {
    if (chunk) {
      responseSize += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk)
    }

    const duration = Date.now() - startTime

    // Collect response metadata
    const responseMeta = {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      responseSize: `${responseSize} bytes`,
      contentType: res.get('content-type'),
    }

    // Log response with performance metrics
    const logLevel = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info'
    logger[logLevel](`Response: ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`, {
      ...responseMeta,
      timestamp: new Date().toISOString(),
    })

    // Log performance warning for slow requests (>5s)
    if (duration > 5000) {
      logger.warn('Slow request detected', {
        requestId,
        duration: `${duration}ms`,
        url: req.url,
      })
    }

    // Call original end
    return originalEnd.apply(res, [chunk, ...args])
  }

  next()
}

/**
 * Generate a unique request ID
 */
function generateRequestId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export default requestLogger
