/**
 * Settings Validation Middleware
 * Re-exports settings validation middleware from provider-router
 */

export {
  validateSettingKey,
  validateSettingValue,
  validateBulkSettings
} from '../../../provider-router/src/middleware/settings-validation.js'
