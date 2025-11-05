/**
 * Express Server
 * OpenAI-compatible API server with provider routing
 */

import express from 'express'
import { providerRouter } from './router/provider-router.js'
import { getAllProviders, getProviderNames } from './providers/index.js'
import corsMiddleware from './middleware/cors.js'
import requestLogger from './middleware/request-logger.js'
import responseLogger from './middleware/response-logger.js'
import databaseLogger from './middleware/database-logger.js'
import errorHandler from './middleware/error-handler.js'
import { logger } from './utils/logger.js'
import sessionsRouter from './routes/sessions.js'
import requestsRouter from './routes/requests.js'
import responsesRouter from './routes/responses.js'
import providersRouter from './routes/providers.js'
import providerConfigsRouter from './routes/provider-configs.js'
import modelsRouter from './routes/models.js'
import providerModelsRouter from './routes/provider-models.js'
import settingsRouter from './routes/settings.js'
import qwenCredentialsRoutes from './routes/qwen-credentials.js'
import activityRouter from './routes/activity.js'
import modelSyncRouter from './routes/model-sync.js'

const app = express()

// Middleware
app.use(corsMiddleware)
app.use(express.json())
app.use(requestLogger)
app.use(responseLogger)
app.use(databaseLogger)

/**
 * POST /v1/chat/completions
 * Chat completions endpoint (OpenAI-compatible)
 */
app.post('/v1/chat/completions', async (req, res, next) => {
  try {
    const request = req.body
    const stream = request.stream || false

    logger.debug('Chat completion request:', request)

    // Route request through provider router
    const response = await providerRouter.route(request, stream)

    if (stream) {
      // Set headers for streaming
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')

      // Pipe the stream to response
      response.pipe(res)
    } else {
      // Send non-streaming response
      res.json(response)
    }
  } catch (error) {
    next(error)
  }
})

/**
 * GET /v1/models
 * List available models
 */
app.get('/v1/models', async (req, res, next) => {
  try {
    const providerName = req.query.provider || null

    logger.debug('List models request:', { provider: providerName })

    const models = await providerRouter.listModels(providerName)
    res.json(models)
  } catch (error) {
    next(error)
  }
})

/**
 * Session Management Routes
 * REST API for session CRUD operations
 */
app.use('/v1/sessions', sessionsRouter)

/**
 * Request History Routes
 * REST API for request CRUD operations
 */
app.use('/v1/requests', requestsRouter)

/**
 * Response History Routes
 * REST API for response CRUD operations
 */
app.use('/v1/responses', responsesRouter)

/**
 * Provider Management Routes
 * REST API for provider CRUD operations
 */
app.use('/v1/providers', providersRouter)

/**
 * Provider Configuration Routes
 * REST API for provider configuration management
 */
app.use('/v1/providers', providerConfigsRouter)

/**
 * Model Management Routes
 * REST API for model CRUD operations
 */
app.use('/v1/models', modelsRouter)

/**
 * Model Sync Routes
 * REST API for triggering model synchronization
 */
app.use('/v1/models', modelSyncRouter)

/**
 * Provider-Model Mapping Routes
 * REST API for provider-model relationship management
 */
app.use('/v1/providers', providerModelsRouter)

/**
 * Settings Management Routes
 * REST API for server settings management
 */
app.use('/v1/settings', settingsRouter)

/**
 * Qwen Credentials Routes
 * REST API for Qwen credentials management
 */
app.use('/v1/qwen/credentials', qwenCredentialsRoutes)

/**
 * Activity Routes
 * REST API for activity logs and statistics
 */
app.use('/api/v1/activity', activityRouter)

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', async (req, res) => {
  try {
    const providers = getAllProviders()
    const providerStatuses = {}

    // Check health of all providers
    for (const provider of providers) {
      const name = provider.getName()
      try {
        const healthy = await provider.healthCheck()
        providerStatuses[name] = {
          status: healthy ? 'healthy' : 'unhealthy',
          baseURL: provider.getConfig().baseURL,
        }
      } catch (error) {
        providerStatuses[name] = {
          status: 'error',
          error: error.message,
        }
      }
    }

    res.json({
      status: 'ok',
      providers: providerStatuses,
      registeredProviders: getProviderNames(),
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
    })
  }
})

/**
 * GET /
 * Root endpoint - API info
 */
app.get('/', (req, res) => {
  res.json({
    name: 'Qwen Provider Router',
    version: '1.0.0',
    description: 'Provider abstraction router for testing multiple LLM backends',
    endpoints: {
      '/v1/chat/completions': 'Chat completions (POST)',
      '/v1/models': 'List models from database (GET, POST, PUT, DELETE)',
      '/v1/models/sync': 'Sync models from all providers (POST)',
      '/v1/models/sync/:providerId': 'Sync models from specific provider (POST)',
      '/v1/sessions': 'Session management (GET, DELETE)',
      '/v1/requests': 'Request history (GET, DELETE)',
      '/v1/responses': 'Response history (GET, DELETE)',
      '/v1/providers': 'Provider management (GET, POST, PUT, DELETE)',
      '/v1/providers/:id/config': 'Provider configuration (GET, PUT, PATCH, DELETE)',
      '/v1/providers/:id/models': 'Provider-model mappings (GET, POST, DELETE)',
      '/v1/providers/:id/enable': 'Enable provider (POST)',
      '/v1/providers/:id/disable': 'Disable provider (POST)',
      '/v1/providers/:id/test': 'Test provider connection (POST)',
      '/v1/providers/:id/reload': 'Reload provider from database (POST)',
      '/v1/settings': 'Server settings management (GET, POST)',
      '/v1/settings/:key': 'Single setting management (GET, PUT, DELETE)',
      '/v1/settings/bulk': 'Bulk settings update (POST)',
      '/v1/qwen/credentials': 'Qwen credentials management (GET, POST, DELETE)',
      '/api/v1/activity/recent': 'Recent activity logs (GET)',
      '/api/v1/activity/stats': 'Activity statistics (GET)',
      '/health': 'Health check (GET)',
    },
    registeredProviders: getProviderNames(),
  })
})

// Error handling middleware (must be last)
app.use(errorHandler)

export default app
