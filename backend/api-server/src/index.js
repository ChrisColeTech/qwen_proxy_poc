/**
 * API Server Entry Point
 * Initializes and starts the management API server
 */

import 'dotenv/config'
import app from './server.js'
import { initDatabase, closeDatabase } from '../../provider-router/src/database/connection.js'
import { logger } from './utils/logger.js'
import config from './config.js'

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

    // Start HTTP server
    const { host, port } = config.server
    app.listen(port, host, () => {
      logger.info(`API Server listening on http://${host}:${port}`)
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
