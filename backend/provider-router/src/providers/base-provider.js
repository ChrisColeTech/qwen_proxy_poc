/**
 * Base Provider Class
 * Abstract class defining the interface all providers must implement
 */

export class BaseProvider {
  constructor(name, config, type = null) {
    this.name = name
    this.config = config
    this.type = type

    if (this.constructor === BaseProvider) {
      throw new Error('BaseProvider is abstract and cannot be instantiated directly')
    }
  }

  /**
   * Send chat completion request
   * @param {Object} request - OpenAI-compatible chat completion request
   * @param {boolean} stream - Whether to stream the response
   * @returns {Promise<Object>} - Chat completion response
   */
  async chatCompletion(request, stream = false) {
    throw new Error('chatCompletion() must be implemented by provider')
  }

  /**
   * List available models
   * @returns {Promise<Array>} - Array of model objects
   */
  async listModels() {
    throw new Error('listModels() must be implemented by provider')
  }

  /**
   * Transform request to provider-specific format
   * @param {Object} request - OpenAI-compatible request
   * @returns {Object} - Provider-specific request
   */
  transformRequest(request) {
    // Default: pass through unchanged
    // Override in subclass if transformation needed
    return request
  }

  /**
   * Transform response to OpenAI-compatible format
   * @param {Object} response - Provider-specific response
   * @returns {Object} - OpenAI-compatible response
   */
  transformResponse(response) {
    // Default: pass through unchanged
    // Override in subclass if transformation needed
    return response
  }

  /**
   * Health check for provider
   * @returns {Promise<boolean>} - true if provider is healthy
   */
  async healthCheck() {
    try {
      await this.listModels()
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Get provider name
   */
  getName() {
    return this.name
  }

  /**
   * Get provider type
   */
  getType() {
    return this.type
  }

  /**
   * Get provider configuration
   */
  getConfig() {
    return this.config
  }
}
