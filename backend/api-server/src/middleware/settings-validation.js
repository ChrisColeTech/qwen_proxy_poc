/**
 * Settings Validation Middleware
 * Re-exports simplified validation from provider-router
 */

// No longer using strict validation middleware
// Settings are now validated optionally in the controller
export function validateSettingKey(req, res, next) {
  // Deprecated - keeping for backward compatibility
  next()
}

export function validateSettingValue(req, res, next) {
  // Deprecated - keeping for backward compatibility
  next()
}

export function validateBulkSettings(req, res, next) {
  // Deprecated - keeping for backward compatibility
  next()
}
