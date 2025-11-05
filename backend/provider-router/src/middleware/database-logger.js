/**
 * Database Logger Middleware
 * Logs all requests and responses to database using sessions/requests/responses tables
 */

import { SessionRepository } from '../database/repositories/session-repository.js'
import { RequestRepository } from '../database/repositories/request-repository.js'
import { ResponseRepository } from '../database/repositories/response-repository.js'
import { logger } from '../utils/logger.js'
import crypto from 'crypto'

const sessionRepo = new SessionRepository()
const requestRepo = new RequestRepository()
const responseRepo = new ResponseRepository()

// Default session timeout: 30 minutes
const DEFAULT_SESSION_TIMEOUT = 30 * 60 * 1000

export default function databaseLogger(req, res, next) {
  const startTime = Date.now()

  // Track if log has been saved
  let logSaved = false
  let requestDbId = null
  let sessionId = null

  // Capture original res.json and res.send
  const originalJson = res.json.bind(res)
  const originalSend = res.send.bind(res)

  // Override res.json
  res.json = function(body) {
    if (!logSaved) {
      saveLog(req, res, body, startTime)
      logSaved = true
    }
    return originalJson(body)
  }

  // Override res.send
  res.send = function(body) {
    if (!logSaved) {
      // Parse body if it's a JSON string
      let responseBody = body
      if (typeof body === 'string') {
        try {
          responseBody = JSON.parse(body)
        } catch (e) {
          // Not JSON, use as-is
          responseBody = { data: body }
        }
      }
      saveLog(req, res, responseBody, startTime)
      logSaved = true
    }
    return originalSend(body)
  }

  // Handle cases where neither json() nor send() is called
  res.on('finish', () => {
    if (!logSaved) {
      saveLog(req, res, null, startTime)
      logSaved = true
    }
  })

  next()
}

/**
 * Save log to database
 * Errors in logging should not crash the server
 */
function saveLog(req, res, responseBody, startTime) {
  try {
    // Don't log health check endpoints to reduce noise
    if (req.path === '/health' || req.path === '/') {
      return
    }

    const durationMs = Date.now() - startTime

    // Create or get session
    const sessionId = getOrCreateSession(req)
    if (!sessionId) {
      logger.warn('Failed to create/get session for logging')
      return
    }

    // Log the request
    const requestResult = logRequest(req, sessionId)
    if (!requestResult) {
      logger.warn('Failed to log request')
      return
    }

    // Log the response
    logResponse(requestResult.id, sessionId, req, res, responseBody, durationMs)

    logger.debug(`Request/Response logged to database: ${requestResult.requestId}`)
  } catch (error) {
    // Log the error but don't throw - logging failures should not crash the server
    logger.error('Failed to save request/response log to database:', error)
  }
}

/**
 * Get or create a session for the request
 * Returns session ID or null on error
 */
function getOrCreateSession(req) {
  try {
    // Try to extract session ID from request (if using persistence middleware)
    let sessionId = req.persistence?.sessionId || req.sessionId

    // If no session ID, create a simple one based on request ID
    if (!sessionId) {
      sessionId = `simple-session-${req.requestId || crypto.randomUUID()}`

      // Check if session exists
      const existingSession = sessionRepo.getSession(sessionId)

      if (!existingSession) {
        // Create new session
        const firstMessage = extractFirstMessage(req)
        sessionRepo.createSession(
          sessionId,
          `chat-${Date.now()}`, // Simple chat ID
          firstMessage,
          DEFAULT_SESSION_TIMEOUT
        )
        logger.debug(`Created new session: ${sessionId}`)
      } else {
        // Touch existing session to extend timeout
        sessionRepo.touchSession(sessionId, DEFAULT_SESSION_TIMEOUT)
      }
    }

    return sessionId
  } catch (error) {
    logger.error('Failed to get/create session:', error)
    return null
  }
}

/**
 * Extract first user message from request for session tracking
 */
function extractFirstMessage(req) {
  try {
    // For chat completions, extract from messages
    if (req.body?.messages && Array.isArray(req.body.messages)) {
      const userMessages = req.body.messages.filter(m => m.role === 'user')
      if (userMessages.length > 0) {
        const content = userMessages[0].content
        if (typeof content === 'string') {
          return content.substring(0, 100) // Limit length
        } else if (Array.isArray(content)) {
          // Handle multi-modal content
          const textContent = content.find(c => c.type === 'text')
          if (textContent?.text) {
            return textContent.text.substring(0, 100)
          }
        }
      }
    }

    // Fallback to endpoint
    return `Request to ${req.path}`
  } catch (error) {
    return `Request to ${req.path}`
  }
}

/**
 * Log request to database
 * Returns { id, requestId } or null on error
 */
function logRequest(req, sessionId) {
  try {
    // Prepare request data
    const openaiRequest = req.body || {}
    const model = openaiRequest.model || 'unknown'
    const stream = openaiRequest.stream || false

    // Create request record
    const result = requestRepo.createRequest(
      sessionId,
      openaiRequest,
      openaiRequest, // For simple logging, qwen request = openai request
      model,
      stream
    )

    return result
  } catch (error) {
    logger.error('Failed to log request:', error)
    return null
  }
}

/**
 * Log response to database
 */
function logResponse(requestDbId, sessionId, req, res, responseBody, durationMs) {
  try {
    // Determine finish reason based on status code
    let finishReason = 'stop'
    let errorMessage = null

    if (res.statusCode >= 400) {
      finishReason = 'error'
      errorMessage = responseBody?.error?.message || `HTTP ${res.statusCode}`
    } else if (res.statusCode >= 300) {
      finishReason = 'redirect'
    }

    // Extract usage information if available
    const usage = responseBody?.usage || null

    // Extract parent_id if available (for conversation tracking)
    const parentId = responseBody?.parent_id || null

    // Create response record
    responseRepo.createResponse(
      requestDbId,
      sessionId,
      null, // qwenResponse - not available in simple logging
      responseBody || {},
      parentId,
      usage,
      durationMs,
      finishReason,
      errorMessage
    )
  } catch (error) {
    logger.error('Failed to log response:', error)
  }
}
