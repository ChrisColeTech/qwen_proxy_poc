/**
 * Handlers Module Exports
 * Centralized exports for all handler modules
 *
 * Phase 8: Chat Completions Handler
 * Also includes:
 * - Models handler (Phase 7)
 * - Health handler
 * - Metrics handler
 * - Completions handler (legacy)
 */

const {
  chatCompletions,
  getSessionManager,
  getQwenClient,
  shutdown: shutdownChatHandler
} = require('./chat-completions-handler');

const {
  listModels,
  retrieveModel
} = require('./models-handler');

const healthHandler = require('./health-handler');
const metricsHandler = require('./metrics-handler');
const completionsHandler = require('./completions-handler');

module.exports = {
  // Chat completions (Phase 8)
  chatCompletions,
  getSessionManager,
  getQwenClient,
  shutdownChatHandler,

  // Models (Phase 7)
  listModels,
  retrieveModel,

  // Health check
  healthHandler,

  // Metrics
  metricsHandler,

  // Legacy completions
  completionsHandler
};
