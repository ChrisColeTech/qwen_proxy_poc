/**
 * WebSocket Controller
 * Handles Socket.io connection events and initial data emission
 */

import { logger } from '../utils/logger.js'
import { ProviderService, ModelService, QwenCredentialsService } from '../../../provider-router/src/database/services/index.js'
import { eventEmitter } from '../services/event-emitter.js'

/**
 * Track proxy process state (shared with proxy-control.js)
 * This is a workaround to get the current status without importing the entire proxy-control module
 */
let proxyStatusGetter = null

/**
 * Track extension connections
 * Set of socket IDs that belong to Chrome extension clients
 */
const extensionConnections = new Set()

/**
 * Socket.io server instance (for broadcasting)
 */
let ioInstance = null

/**
 * Get extension connections (used by event emitter)
 */
function getExtensionConnections() {
  return extensionConnections
}

/**
 * Set the proxy status getter function
 * This should be called from proxy-control.js to provide access to current status
 */
export function setProxyStatusGetter(getter) {
  proxyStatusGetter = getter
}

/**
 * Broadcast status update to all frontend clients (not extension)
 */
function broadcastStatus() {
  if (!ioInstance) return

  try {
    const fullStatus = getFullStatus()

    // Emit to all connected clients except extension clients
    ioInstance.sockets.sockets.forEach((socket) => {
      if (!extensionConnections.has(socket.id)) {
        socket.emit('proxy:status', {
          status: fullStatus,
          timestamp: new Date().toISOString()
        })
      }
    })

    logger.info('[WebSocket] Broadcasted status update to all clients')
  } catch (error) {
    logger.error('[WebSocket] Error broadcasting status:', error)
  }
}

/**
 * Get full proxy and dashboard status
 */
function getFullStatus() {
  // Get proxy status if available
  let proxyStatus = {
    status: 'unknown',
    providerRouter: {
      running: false,
      port: 3001,
      pid: null,
      uptime: 0
    },
    qwenProxy: {
      running: false,
      port: 3000,
      pid: null,
      uptime: 0
    }
  }

  if (proxyStatusGetter && typeof proxyStatusGetter === 'function') {
    try {
      proxyStatus = proxyStatusGetter()
    } catch (error) {
      logger.error('[WebSocket] Error getting proxy status:', error)
    }
  }

  // Query database for dashboard data
  let providers = []
  let models = []
  let credentials = { valid: false, expiresAt: null }

  try {
    providers = ProviderService.getAll()
    models = ModelService.getAll()

    // Check credentials validity
    const credData = QwenCredentialsService.getCredentials()
    if (credData) {
      const now = Math.floor(Date.now() / 1000)
      const isExpired = credData.expires_at && credData.expires_at <= now
      const hasRequiredFields = !!(credData.token && credData.cookies)
      credentials = {
        valid: hasRequiredFields && !isExpired,
        expiresAt: credData.expires_at || null,
        hasCredentials: true,
        isExpired
      }
    } else {
      credentials = {
        valid: false,
        expiresAt: null,
        hasCredentials: false,
        isExpired: false
      }
    }
  } catch (error) {
    logger.error('[WebSocket] Error fetching dashboard data:', error)
  }

  return {
    ...proxyStatus,
    providers: {
      items: providers,
      total: providers.length,
      enabled: providers.filter(p => p.enabled).length
    },
    models: {
      items: models,
      total: models.length
    },
    credentials,
    extensionConnected: extensionConnections.size > 0,
    timestamp: new Date().toISOString()
  }
}

/**
 * Initialize WebSocket connection handler
 * @param {object} io - Socket.io server instance
 */
export function initializeWebSocket(io) {
  // Store io instance for broadcasting
  ioInstance = io

  // Register extension connections getter with event emitter
  eventEmitter.setExtensionConnectionsGetter(getExtensionConnections)

  io.on('connection', (socket) => {
    logger.info(`[WebSocket] Client connected: ${socket.id}`)

    // Emit full status on initial connection
    try {
      const fullStatus = getFullStatus()
      // Wrap in 'status' key to match event-emitter format and frontend TypeScript interface
      socket.emit('proxy:status', {
        status: fullStatus,
        timestamp: new Date().toISOString()
      })
      logger.info(`[WebSocket] Sent initial status to client: ${socket.id}`)
    } catch (error) {
      logger.error('[WebSocket] Error sending initial status:', error)
    }

    // Handle extension identification
    socket.on('extension:connect', () => {
      logger.info(`[WebSocket] Extension identified: ${socket.id}`)
      extensionConnections.add(socket.id)

      // Broadcast updated status to all frontend clients
      broadcastStatus()
    })

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`[WebSocket] Client disconnected: ${socket.id}, reason: ${reason}`)

      // Check if this was an extension connection
      if (extensionConnections.has(socket.id)) {
        extensionConnections.delete(socket.id)
        logger.info(`[WebSocket] Extension disconnected: ${socket.id}`)

        // Broadcast updated status to all frontend clients
        broadcastStatus()
      }
    })

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`[WebSocket] Socket error for client ${socket.id}:`, error)
    })

    // Optional: handle client ping/pong for connection monitoring
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() })
    })
  })

  logger.info('[WebSocket] WebSocket connection handler initialized')
}

export default {
  initializeWebSocket,
  setProxyStatusGetter
}
