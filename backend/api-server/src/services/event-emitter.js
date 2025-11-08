/**
 * Event Emitter Service
 * Central event emitter for broadcasting events to WebSocket clients
 */

import { EventEmitter } from 'events'

class EventEmitterService extends EventEmitter {
  constructor() {
    super()
    this.socketIO = null
    this.extensionConnectionsGetter = null
  }

  /**
   * Initialize the event emitter with Socket.io instance
   * @param {object} io - Socket.io server instance
   */
  initialize(io) {
    this.socketIO = io
    console.log('[Event Emitter] Initialized with Socket.io instance')
  }

  /**
   * Set the getter function for extension connections
   * @param {Function} getter - Function that returns Set of extension socket IDs
   */
  setExtensionConnectionsGetter(getter) {
    this.extensionConnectionsGetter = getter
  }

  /**
   * Emit an event to all connected WebSocket clients (excluding extensions)
   * @param {string} eventName - Name of the event
   * @param {object} data - Event data
   * @param {boolean} includeExtensions - Whether to include extension clients (default: false)
   */
  emitToClients(eventName, data, includeExtensions = false) {
    if (!this.socketIO) {
      console.warn('[Event Emitter] Socket.io not initialized, event not emitted:', eventName)
      return
    }

    const eventData = {
      ...data,
      timestamp: new Date().toISOString()
    }

    console.log(`[Event Emitter] Broadcasting event: ${eventName} (includeExtensions: ${includeExtensions})`)

    // Use Socket.io rooms to exclude extensions - much cleaner and race-condition free
    if (includeExtensions) {
      // Emit to all clients including extensions
      this.socketIO.emit(eventName, eventData)
    } else {
      // Emit to all clients EXCEPT those in the 'extensions' room
      this.socketIO.except('extensions').emit(eventName, eventData)
    }
  }

  /**
   * Emit proxy status change event
   * @param {object} status - Proxy status data
   */
  emitProxyStatus(status) {
    // Wrap in 'status' key to match frontend TypeScript interface
    this.emitToClients('proxy:status', { status })
  }

  /**
   * Emit credentials updated event
   * @param {object} credentials - Credentials data (without sensitive info)
   */
  emitCredentialsUpdated(credentials) {
    this.emitToClients('credentials:updated', credentials)
  }

  /**
   * Emit providers updated event
   * @param {object} providers - Providers data
   */
  emitProvidersUpdated(providers) {
    this.emitToClients('providers:updated', providers)
  }

  /**
   * Emit models updated event
   * @param {object} models - Models data
   */
  emitModelsUpdated(models) {
    this.emitToClients('models:updated', models)
  }
}

// Export singleton instance
export const eventEmitter = new EventEmitterService()
export default eventEmitter
