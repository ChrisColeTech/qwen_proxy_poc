/**
 * Qwen Credentials Controller
 * Business logic for Qwen credentials management
 */

import { QwenCredentialsService } from '../database/services/qwen-credentials-service.js'
import { logger } from '../utils/logger.js'

/**
 * POST /v1/qwen/credentials
 * Set or update Qwen credentials
 */
export async function setCredentials(req, res, next) {
  try {
    const { token, cookies, expiresAt } = req.body

    // Validate required fields
    if (!token || !cookies) {
      logger.warn('Failed to set credentials: missing required fields', {
        hasToken: !!token,
        hasCookies: !!cookies
      })
      return res.status(400).json({
        error: {
          message: 'Missing required fields: token and cookies are required',
          type: 'validation_error',
          code: 'missing_required_fields'
        }
      })
    }

    // Validate token format
    if (typeof token !== 'string' || token.trim().length === 0) {
      logger.warn('Failed to set credentials: invalid token format')
      return res.status(400).json({
        error: {
          message: 'Invalid token format',
          type: 'validation_error',
          code: 'invalid_token'
        }
      })
    }

    // Validate cookies format
    if (typeof cookies !== 'string' || cookies.trim().length === 0) {
      logger.warn('Failed to set credentials: invalid cookies format')
      return res.status(400).json({
        error: {
          message: 'Invalid cookies format',
          type: 'validation_error',
          code: 'invalid_cookies'
        }
      })
    }

    // Validate expiresAt if provided
    if (expiresAt !== undefined && expiresAt !== null) {
      const expiresAtNum = Number(expiresAt)
      if (isNaN(expiresAtNum) || expiresAtNum < 0) {
        logger.warn('Failed to set credentials: invalid expiresAt value', { expiresAt })
        return res.status(400).json({
          error: {
            message: 'Invalid expiresAt: must be a positive timestamp',
            type: 'validation_error',
            code: 'invalid_expires_at'
          }
        })
      }
    }

    logger.info('Setting Qwen credentials', {
      hasToken: true,
      hasCookies: true,
      expiresAt: expiresAt || 'none'
    })

    // Store credentials
    const id = QwenCredentialsService.setCredentials(token, cookies, expiresAt || null)

    res.json({
      success: true,
      message: 'Qwen credentials updated successfully',
      id,
      expiresAt: expiresAt || null
    })
  } catch (error) {
    logger.error('Failed to set Qwen credentials', error)
    res.status(500).json({
      error: {
        message: 'Failed to set credentials',
        type: 'server_error',
        code: 'credentials_set_failed'
      }
    })
  }
}

/**
 * GET /v1/qwen/credentials
 * Get credentials status (without sensitive values)
 */
export async function getCredentials(req, res, next) {
  try {
    logger.debug('Getting Qwen credentials status')

    const credentials = QwenCredentialsService.getCredentials()

    if (!credentials) {
      return res.json({
        hasCredentials: false,
        expiresAt: null,
        isValid: false
      })
    }

    const now = Math.floor(Date.now() / 1000)
    const isExpired = credentials.expires_at && credentials.expires_at <= now
    const hasRequiredFields = !!(credentials.token && credentials.cookies)
    const isValid = hasRequiredFields && !isExpired

    logger.info('Retrieved Qwen credentials status', {
      hasCredentials: true,
      isValid,
      isExpired,
      expiresAt: credentials.expires_at
    })

    res.json({
      hasCredentials: true,
      expiresAt: credentials.expires_at,
      isValid,
      createdAt: credentials.created_at,
      updatedAt: credentials.updated_at
    })
  } catch (error) {
    logger.error('Failed to get Qwen credentials status', error)
    res.status(500).json({
      error: {
        message: 'Failed to get credentials status',
        type: 'server_error',
        code: 'credentials_get_failed'
      }
    })
  }
}

/**
 * DELETE /v1/qwen/credentials
 * Delete Qwen credentials
 */
export async function deleteCredentials(req, res, next) {
  try {
    logger.info('Deleting Qwen credentials')

    const deleted = QwenCredentialsService.deleteCredentials()

    if (deleted > 0) {
      res.json({
        success: true,
        message: 'Qwen credentials deleted',
        deleted
      })
    } else {
      res.json({
        success: true,
        message: 'No credentials to delete',
        deleted: 0
      })
    }
  } catch (error) {
    logger.error('Failed to delete Qwen credentials', error)
    res.status(500).json({
      error: {
        message: 'Failed to delete credentials',
        type: 'server_error',
        code: 'credentials_delete_failed'
      }
    })
  }
}

export default {
  setCredentials,
  getCredentials,
  deleteCredentials
}
