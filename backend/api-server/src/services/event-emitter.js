/**
 * Event Emitter Service
 * Central event emitter for broadcasting events to WebSocket clients
 */

import { EventEmitter } from 'events'

class EventEmitterService extends EventEmitter {
  constructor() {
    super()
    this.socketIO = null
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
   * Emit an event to all connected WebSocket clients
   * @param {string} eventName - Name of the event
   * @param {object} data - Event data
   */
  emitToClients(eventName, data) {
    if (!this.socketIO) {
      console.warn('[Event Emitter] Socket.io not initialized, event not emitted:', eventName)
      return
    }

    const eventData = {
      ...data,
      timestamp: new Date().toISOString()
    }

    console.log(`[Event Emitter] Broadcasting event: ${eventName}`)
    this.socketIO.emit(eventName, eventData)
  }

  /**
   * Emit proxy status change event
   * @param {object} status - Proxy status data
   */
  emitProxyStatus(status) {
    this.emitToClients('proxy:status', status)
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
