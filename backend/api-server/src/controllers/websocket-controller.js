/**
 * WebSocket Controller
 * Handles Socket.io connection events and initial data emission
 */

import { logger } from '../utils/logger.js'
import { ProviderService, ModelService, QwenCredentialsService } from '../../../provider-router/src/database/services/index.js'

/**
 * Track proxy process state (shared with proxy-control.js)
 * This is a workaround to get the current status without importing the entire proxy-control module
 */
let proxyStatusGetter = null

/**
 * Set the proxy status getter function
 * This should be called from proxy-control.js to provide access to current status
 */
export function setProxyStatusGetter(getter) {
  proxyStatusGetter = getter
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
    timestamp: new Date().toISOString()
  }
}

/**
 * Initialize WebSocket connection handler
 * @param {object} io - Socket.io server instance
 */
export function initializeWebSocket(io) {
  io.on('connection', (socket) => {
    logger.info(`[WebSocket] Client connected: ${socket.id}`)

    // Emit full status on initial connection
    try {
      const fullStatus = getFullStatus()
      socket.emit('proxy:status', fullStatus)
      logger.info(`[WebSocket] Sent initial status to client: ${socket.id}`)
    } catch (error) {
      logger.error('[WebSocket] Error sending initial status:', error)
    }

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`[WebSocket] Client disconnected: ${socket.id}, reason: ${reason}`)
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
