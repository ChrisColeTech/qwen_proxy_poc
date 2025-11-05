/**
 * Qwen Credentials Routes
 * REST API endpoints for Qwen credentials management
 */

import express from 'express'
import {
  setCredentials,
  getCredentials,
  deleteCredentials
} from '../controllers/qwen-credentials-controller.js'

const router = express.Router()

/**
 * Validate credentials request body
 */
function validateCredentials(req, res, next) {
  const { token, cookies, expiresAt } = req.body

  const errors = []

  // Validate token (required)
  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    errors.push('token is required and must be a non-empty string')
  }

  // Validate cookies (required)
  if (!cookies || typeof cookies !== 'string' || cookies.trim().length === 0) {
    errors.push('cookies is required and must be a non-empty string')
  }

  // Validate expiresAt (optional)
  if (expiresAt !== undefined && expiresAt !== null) {
    if (typeof expiresAt !== 'number' || !Number.isInteger(expiresAt)) {
      errors.push('expiresAt must be an integer (Unix timestamp)')
    } else if (expiresAt < 0) {
      errors.push('expiresAt must be a positive number')
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: {
        message: 'Validation failed',
        type: 'validation_error',
        errors
      }
    })
  }

  next()
}

/**
 * POST /api/qwen/credentials
 * Set or update Qwen credentials
 * Body:
 * - token: Qwen API token (required)
 * - cookies: Qwen session cookies (required)
 * - expiresAt: Unix timestamp when credentials expire (optional)
 */
router.post('/', validateCredentials, setCredentials)

/**
 * GET /api/qwen/credentials
 * Get current Qwen credentials
 * Returns:
 * - token: Qwen API token (masked)
 * - cookies: Qwen session cookies (masked)
 * - expiresAt: Unix timestamp when credentials expire
 * - isExpired: boolean indicating if credentials have expired
 */
router.get('/', getCredentials)

/**
 * DELETE /api/qwen/credentials
 * Delete Qwen credentials
 * Returns:
 * - success: boolean indicating if deletion was successful
 */
router.delete('/', deleteCredentials)

export default router
