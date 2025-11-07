/**
 * Qwen Credentials Controller
 * Wraps provider-router's qwen credentials controller with WebSocket event emission
 */

import {
  setCredentials as _setCredentials,
  getCredentials as _getCredentials,
  deleteCredentials as _deleteCredentials
} from '../../../provider-router/src/controllers/qwen-credentials-controller.js'
import { eventEmitter } from '../services/event-emitter.js'
import { QwenCredentialsService } from '../../../provider-router/src/database/services/index.js'

/**
 * Helper to get credentials status for events
 */
function getCredentialsStatus() {
  try {
    const credentials = QwenCredentialsService.getCredentials()
    if (!credentials) {
      return {
        hasCredentials: false,
        isValid: false,
        expiresAt: null
      }
    }

    const now = Math.floor(Date.now() / 1000)
    const isExpired = credentials.expires_at && credentials.expires_at <= now
    const hasRequiredFields = !!(credentials.token && credentials.cookies)
    const isValid = hasRequiredFields && !isExpired

    return {
      hasCredentials: true,
      isValid,
      isExpired,
      expiresAt: credentials.expires_at,
      createdAt: credentials.created_at,
      updatedAt: credentials.updated_at
    }
  } catch (error) {
    return {
      hasCredentials: false,
      isValid: false,
      expiresAt: null
    }
  }
}

/**
 * POST /api/qwen/credentials
 * Set or update Qwen credentials
 * Emits credentials:updated event after successful update
 */
export async function setCredentials(req, res, next) {
  // Call original controller
  await _setCredentials(req, res, next)

  // If response was successful, emit event
  if (res.statusCode >= 200 && res.statusCode < 300) {
    const credentialsStatus = getCredentialsStatus()
    // Emit with nested structure to match frontend TypeScript interface
    eventEmitter.emitCredentialsUpdated({
      action: 'updated',
      credentials: {
        valid: credentialsStatus.isValid,
        expiresAt: credentialsStatus.expiresAt
      }
    })
  }
}

/**
 * GET /api/qwen/credentials
 * Get current Qwen credentials
 */
export async function getCredentials(req, res, next) {
  // Call original controller (no event emission for GET)
  return _getCredentials(req, res, next)
}

/**
 * DELETE /api/qwen/credentials
 * Delete Qwen credentials
 * Emits credentials:updated event after successful deletion
 */
export async function deleteCredentials(req, res, next) {
  // Call original controller
  await _deleteCredentials(req, res, next)

  // If response was successful, emit event
  if (res.statusCode >= 200 && res.statusCode < 300) {
    // Emit with nested structure to match frontend TypeScript interface
    eventEmitter.emitCredentialsUpdated({
      action: 'deleted',
      credentials: {
        valid: false,
        expiresAt: null
      }
    })
  }
}
