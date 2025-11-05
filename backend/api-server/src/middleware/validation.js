/**
 * Validation Middleware
 * Re-exports validation middleware from provider-router
 */

export {
  validateProvider,
  validateProviderId,
  validatePagination,
  validateModel,
  validateModelId,
  validateProviderConfig,
  validateConfigKeyValue,
  validateProviderModelLink
} from '../../../provider-router/src/middleware/validation.js'
