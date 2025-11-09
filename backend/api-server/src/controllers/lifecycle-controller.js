/**
 * Lifecycle Controller
 * Monitors proxy process lifecycle and emits WebSocket events
 */

import { eventEmitter } from '../services/event-emitter.js'
import { logger } from '../utils/logger.js'

const SHUTDOWN_FORCE_TIMEOUT = 10000 // 10 seconds

class LifecycleController {
  constructor() {
    this.providerRouterMonitor = null
    this.qwenProxyMonitor = null
    this.statusGetter = null
    this.statusBroadcaster = null
  }

  /**
   * Set callback to get full proxy status
   * @param {Function} statusGetter - Function that returns complete proxy status object
   */
  setStatusGetter(statusGetter) {
    this.statusGetter = statusGetter
  }

  /**
   * Set callback to broadcast full proxy status
   * @param {Function} broadcaster - Function that broadcasts complete proxy status
   */
  setStatusBroadcaster(broadcaster) {
    this.statusBroadcaster = broadcaster
  }

  /**
   * Start monitoring a process lifecycle
   * @param {string} processName - 'providerRouter' or 'qwenProxy'
   * @param {ChildProcess} process - The spawned process
   * @param {number} port - The expected port
   * @param {Function} onReady - Callback when process is confirmed ready
   * @param {Function} onError - Callback on error or timeout
   */
  monitorStartup(processName, process, port, onReady, onError) {
    logger.info(`[Lifecycle] Monitoring ${processName} startup on port ${port}`)

    const monitor = {
      process,
      port,
      ready: false,
    }

    // Emit starting state immediately
    this.emitLifecycleEvent(processName, 'starting', port)

    // Listen to stdout for ready signals
    process.stdout.on('data', (data) => {
      const output = data.toString()

      // Look for server ready indicators
      if (output.includes('Server listening') ||
          output.includes(`listening on port ${port}`) ||
          output.includes('server started')) {
        logger.info(`[Lifecycle] ${processName} confirmed ready on port ${port}`)
        monitor.ready = true
        this.emitLifecycleEvent(processName, 'running', port)
        this.cleanup(processName)
        if (onReady) onReady()
      }
    })

    // Listen to stderr for errors
    process.stderr.on('data', (data) => {
      const output = data.toString()
      logger.warn(`[Lifecycle] ${processName} stderr:`, output)

      // Check for port already in use errors
      if (output.includes('EADDRINUSE') || output.includes('address already in use')) {
        const error = `Port ${port} is already in use`
        logger.error(`[Lifecycle] ${processName} ${error}`)
        this.emitLifecycleEvent(processName, 'error', port, error)
        this.cleanup(processName)
        if (onError) onError(new Error(error))
      }
    })

    // Handle process errors
    process.on('error', (error) => {
      logger.error(`[Lifecycle] ${processName} error:`, error)
      this.emitLifecycleEvent(processName, 'error', port, error.message)
      this.cleanup(processName)
      if (onError) onError(error)
    })

    // Handle unexpected exit during startup
    process.on('exit', (code) => {
      if (!monitor.ready && code !== 0) {
        const error = `Process exited with code ${code} during startup`
        logger.error(`[Lifecycle] ${processName} ${error}`)
        this.emitLifecycleEvent(processName, 'error', port, error)
        this.cleanup(processName)
        if (onError) onError(new Error(error))
      }
    })

    // Store monitor
    if (processName === 'providerRouter') {
      this.providerRouterMonitor = monitor
    } else {
      this.qwenProxyMonitor = monitor
    }
  }

  /**
   * Monitor process shutdown
   * @param {string} processName - 'providerRouter' or 'qwenProxy'
   * @param {ChildProcess} process - The process to monitor
   * @param {Function} onStopped - Callback when confirmed stopped
   */
  monitorShutdown(processName, process, onStopped) {
    logger.info(`[Lifecycle] Monitoring ${processName} shutdown`)

    // Emit stopping state immediately
    this.emitLifecycleEvent(processName, 'stopping', null)

    // Listen for exit
    const exitHandler = (code) => {
      logger.info(`[Lifecycle] ${processName} stopped (exit code: ${code})`)
      this.emitLifecycleEvent(processName, 'stopped', null)
      if (onStopped) onStopped()
    }

    process.on('exit', exitHandler)

    // Set timeout for forced kill
    setTimeout(() => {
      if (process && !process.killed) {
        logger.warn(`[Lifecycle] ${processName} shutdown timeout, forcing kill`)
        try {
          process.kill('SIGKILL')
        } catch (error) {
          logger.error(`[Lifecycle] Error killing ${processName}:`, error)
        }
      }
    }, SHUTDOWN_FORCE_TIMEOUT)
  }

  /**
   * Emit a lifecycle event via WebSocket
   * This includes both lifecycle event data AND full proxy status
   */
  emitLifecycleEvent(processName, state, port, errorMessage = null) {
    // Get full proxy status (includes extensionConnected, credentials, providers, models, etc.)
    const fullStatus = this.statusGetter ? this.statusGetter() : {}

    // Merge full proxy status with lifecycle event data
    const combinedData = {
      ...fullStatus,
      lifecycle: {
        process: processName,
        state,
        port,
        running: state === 'running',
        error: errorMessage,
      },
      timestamp: Date.now(),
    }

    logger.info(`[Lifecycle] Emitting ${processName}:${state} with full proxy status`)
    eventEmitter.emitToClients('lifecycle:update', combinedData, false)

    // Also broadcast separate proxy:status event for compatibility
    if (this.statusBroadcaster) {
      logger.info(`[Lifecycle] Broadcasting full proxy status after ${processName}:${state}`)
      this.statusBroadcaster()
    }
  }

  /**
   * Cleanup monitor resources
   */
  cleanup(processName) {
    if (processName === 'providerRouter') {
      this.providerRouterMonitor = null
    } else {
      this.qwenProxyMonitor = null
    }
  }
}

// Export singleton instance
export const lifecycleController = new LifecycleController()
export default lifecycleController
