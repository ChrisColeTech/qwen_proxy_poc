/**
 * Authentication Middleware
 * Part of Phase 2: Authentication Module
 *
 * Express middleware to validate Qwen credentials before proxying requests
 */

const auth = require('../api/qwen-auth');

/**
 * Middleware to validate authentication before proxy requests
 * Checks if Qwen credentials are configured in the database
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function authMiddleware(req, res, next) {
  try {
    // Check if authentication is valid
    if (!auth.isValid()) {
      return res.status(401).json({
        error: {
          message: 'Qwen credentials not configured. Please configure credentials through the Electron app Settings.',
          type: 'authentication_error',
          code: 'missing_credentials',
        },
      });
    }

    // Attach auth headers to request for use in handlers
    req.qwenAuth = {
      headers: auth.getHeaders(),
      token: auth.getToken(),
      cookies: auth.getCookies(),
      userAgent: auth.getUserAgent(),
    };

    next();
  } catch (error) {
    // Handle any authentication errors
    return res.status(401).json({
      error: {
        message: error.message || 'Authentication failed',
        type: 'authentication_error',
        code: 'auth_error',
      },
    });
  }
}

module.exports = authMiddleware;
