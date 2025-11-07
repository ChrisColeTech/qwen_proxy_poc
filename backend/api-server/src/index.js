/**
 * API Server Entry Point
 * Initializes and starts the management API server
 */

import 'dotenv/config'
import { createServer } from 'http'
import { Server } from 'socket.io'
import app from './server.js'
import { initDatabase, closeDatabase } from '../../provider-router/src/database/connection.js'
import { logger } from './utils/logger.js'
import config from './config.js'
import { initializeWebSocket } from './controllers/websocket-controller.js'
import { eventEmitter } from './services/event-emitter.js'

/**
 * Start the server
 */
async function start() {
  try {
    logger.info('Starting API Server...')

    // Initialize database connection (using provider-router's database module)
    logger.info('Initializing database connection...')
    initDatabase()
    logger.info('Database connected')

    // Create HTTP server from Express app
    const httpServer = createServer(app)

    // Initialize Socket.io server
    const io = new Server(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    })

    logger.info('Socket.io server initialized')

    // Initialize event emitter with Socket.io instance
    eventEmitter.initialize(io)

    // Initialize WebSocket connection handler
    initializeWebSocket(io)

    // Start HTTP server (now includes both Express and Socket.io)
    const { host, port } = config.server
    httpServer.listen(port, host, () => {
      logger.info(`API Server listening on http://${host}:${port}`)
      logger.info('WebSocket server ready on same port')
      logger.info('Ready to accept management requests')
    })
  } catch (error) {
    logger.error('Failed to start API Server:', error)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...')
  closeDatabase()
  process.exit(0)
})

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...')
  closeDatabase()
  process.exit(0)
})

// Start the server
start()
