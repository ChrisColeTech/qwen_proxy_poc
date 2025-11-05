/**
 * API Server
 * Express server for management endpoints
 */

import express from 'express'
import corsMiddleware from './middleware/cors.js'
import errorHandler from './middleware/error-handler.js'

// Import routes
import providersRouter from './routes/providers.js'
import modelsRouter from './routes/models.js'
import sessionsRouter from './routes/sessions.js'
import requestsRouter from './routes/requests.js'
import responsesRouter from './routes/responses.js'
import activityRouter from './routes/activity.js'
import settingsRouter from './routes/settings.js'
import providerConfigsRouter from './routes/provider-configs.js'
import providerModelsRouter from './routes/provider-models.js'
import qwenCredentialsRouter from './routes/qwen-credentials.js'
import proxyControlRouter from './routes/proxy-control.js'

const app = express()

// Middleware
app.use(corsMiddleware)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'api-server',
    timestamp: new Date().toISOString()
  })
})

// Mount API routes at /api (not /api/v1)
app.use('/api/providers', providersRouter)
app.use('/api/models', modelsRouter)
app.use('/api/sessions', sessionsRouter)
app.use('/api/requests', requestsRouter)
app.use('/api/responses', responsesRouter)
app.use('/api/activity', activityRouter)
app.use('/api/settings', settingsRouter)
app.use('/api', providerConfigsRouter)
app.use('/api', providerModelsRouter)
app.use('/api/qwen/credentials', qwenCredentialsRouter)
app.use('/api/proxy', proxyControlRouter)

// Error handler (must be last)
app.use(errorHandler)

export default app
