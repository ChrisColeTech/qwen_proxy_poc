/**
 * Response Logger Middleware
 * Logs outgoing responses to console
 */

import { logger } from '../utils/logger.js'

export default function responseLogger(req, res, next) {
  const startTime = Date.now()

  // Capture original res.json
  const originalJson = res.json.bind(res)

  // Override res.json to log the response
  res.json = function(body) {
    const duration = Date.now() - startTime

    // Log response details
    logger.info('Response:', {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      responsePreview: getResponsePreview(body)
    })

    // Log full response in debug mode
    if (process.env.LOG_LEVEL === 'debug') {
      logger.debug('Full response body:', body)
    }

    return originalJson(body)
  }

  next()
}

/**
 * Get a preview of the response for logging
 * Truncates large responses to keep logs readable
 */
function getResponsePreview(body) {
  if (!body) return null

  const preview = {
    id: body.id,
    object: body.object,
    model: body.model,
    created: body.created,
  }

  // Add chat completion specific fields
  if (body.choices && Array.isArray(body.choices)) {
    preview.choices = body.choices.map(choice => ({
      index: choice.index,
      finishReason: choice.finish_reason,
      hasToolCalls: !!(choice.message?.tool_calls),
      toolCallCount: choice.message?.tool_calls?.length || 0,
      contentLength: choice.message?.content?.length || 0,
    }))
  }

  // Add usage stats
  if (body.usage) {
    preview.usage = body.usage
  }

  return preview
}
