/**
 * Proxy Control Routes
 * Endpoints to start, stop, and get status of the provider-router proxy
 */

import express from 'express'
import { spawn, exec } from 'child_process'
import { fileURLToPath } from 'url'
import path from 'path'
import { promisify } from 'util'
import config from '../config.js'
import { ProviderService, ModelService, QwenCredentialsService } from '../../../provider-router/src/database/services/index.js'
import { eventEmitter } from '../services/event-emitter.js'
import { setProxyStatusGetter } from '../controllers/websocket-controller.js'

const execAsync = promisify(exec)

const router = express.Router()

// Get current file path and directory for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Track proxy process state
let proxyProcess = null
let proxyStartTime = null

// Track qwen-proxy process state
let qwenProxyProcess = null
let qwenProxyStartTime = null

/**
 * Helper function to get current proxy status
 * This is used by the WebSocket controller to send status on connection
 */
function getCurrentProxyStatus() {
  const providerRouterRunning = proxyProcess !== null && isProcessRunning(proxyProcess.pid)
  const qwenProxyRunning = qwenProxyProcess !== null && isProcessRunning(qwenProxyProcess.pid)

  const providerRouterUptime = proxyStartTime && providerRouterRunning ? Math.floor((Date.now() - proxyStartTime) / 1000) : 0
  const qwenProxyUptime = qwenProxyStartTime && qwenProxyRunning ? Math.floor((Date.now() - qwenProxyStartTime) / 1000) : 0

  const allRunning = providerRouterRunning && qwenProxyRunning
  const anyRunning = providerRouterRunning || qwenProxyRunning

  // Query database for dashboard data
  let providers = []
  let models = []
  let credentials = { valid: false, expiresAt: null }

  try {
    providers = ProviderService.getAll()
    models = ModelService.getAll()

    const credData = QwenCredentialsService.getCredentials()
    if (credData) {
      const now = Math.floor(Date.now() / 1000)
      const isExpired = credData.expires_at && credData.expires_at <= now
      const hasRequiredFields = !!(credData.token && credData.cookies)
      credentials = {
        valid: hasRequiredFields && !isExpired,
        expiresAt: credData.expires_at || null
      }
    }
  } catch (error) {
    console.error('[Proxy Control] Error fetching status data:', error)
  }

  return {
    status: allRunning ? 'running' : (anyRunning ? 'partial' : 'stopped'),
    providerRouter: {
      running: providerRouterRunning,
      port: config.proxy.providerRouterPort,
      pid: providerRouterRunning ? proxyProcess.pid : null,
      uptime: providerRouterUptime
    },
    qwenProxy: {
      running: qwenProxyRunning,
      port: config.proxy.qwenProxyPort,
      pid: qwenProxyRunning ? qwenProxyProcess.pid : null,
      uptime: qwenProxyUptime
    },
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
    message: allRunning ? 'All proxy servers are running' : (anyRunning ? 'Some proxy servers are running' : 'Proxy servers are not running')
  }
}

// Register the status getter with WebSocket controller
setProxyStatusGetter(getCurrentProxyStatus)

/**
 * POST /api/proxy/start
 * Start the provider-router proxy server
 */
router.post('/start', async (req, res) => {
  // Check if proxy is already running
  if (proxyProcess) {
    const providerRouterRunning = isProcessRunning(proxyProcess.pid)
    const qwenProxyRunning = qwenProxyProcess && isProcessRunning(qwenProxyProcess.pid)

    const responseData = {
      success: true,
      status: 'running',
      providerRouter: {
        running: providerRouterRunning,
        port: 3001,
        uptime: proxyStartTime ? Math.floor((Date.now() - proxyStartTime) / 1000) : 0,
        pid: providerRouterRunning ? proxyProcess.pid : null
      },
      qwenProxy: {
        running: qwenProxyRunning,
        port: 3000,
        uptime: qwenProxyStartTime && qwenProxyRunning ? Math.floor((Date.now() - qwenProxyStartTime) / 1000) : 0,
        pid: qwenProxyRunning ? qwenProxyProcess.pid : null
      },
      message: 'Proxy servers are already running'
    }

    // Emit status event (even though no change, client may be out of sync)
    eventEmitter.emitProxyStatus(responseData)

    return res.json(responseData)
  }

  try {
    // Kill any processes on ports 3000 and 3001 first
    console.log('[Proxy Control] Killing any processes on ports 3000 and 3001...')
    try {
      await execAsync('npx kill-port 3000 3001')
      console.log('[Proxy Control] Ports cleared')
    } catch (err) {
      // Ignore errors if no processes are running on these ports
      console.log('[Proxy Control] No existing processes on ports (or kill-port not available)')
    }

    // Start qwen-proxy FIRST (it needs to be ready before provider-router)
    console.log('[Proxy Control] Starting qwen-proxy first...')
    await startQwenProxy()

    // Wait for qwen-proxy to be healthy before starting provider-router
    console.log('[Proxy Control] Waiting for qwen-proxy to be ready...')
    const qwenProxyReady = await waitForService('http://localhost:3000/v1/models', 15000)

    if (!qwenProxyReady) {
      console.error('[Proxy Control] Qwen-proxy failed to become ready within 15 seconds')
      // Continue anyway - provider-router will handle the error gracefully
    } else {
      console.log('[Proxy Control] Qwen-proxy is ready')
    }

    // Path to provider-router directory (backend/api-server/src/routes -> backend/provider-router)
    const providerRouterPath = path.join(__dirname, '../../../provider-router')

    console.log('[Proxy Control] Starting provider-router at:', providerRouterPath)

    // Spawn provider-router process
    // Use npm run dev to start the provider-router with nodemon
    const isWindows = process.platform === 'win32'
    const npmCmd = isWindows ? 'npm.cmd' : 'npm'

    proxyProcess = spawn(npmCmd, ['run', 'dev'], {
      cwd: providerRouterPath,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: isWindows,
      env: { ...process.env }
    })

    proxyStartTime = Date.now()

    // Log stdout from proxy
    if (proxyProcess.stdout) {
      proxyProcess.stdout.on('data', (data) => {
        console.log('[Proxy]', data.toString().trim())
      })
    }

    // Log stderr from proxy
    if (proxyProcess.stderr) {
      proxyProcess.stderr.on('data', (data) => {
        console.error('[Proxy Error]', data.toString().trim())
      })
    }

    // Handle process exit
    proxyProcess.on('exit', (code, signal) => {
      console.log(`[Proxy Control] Proxy process exited with code ${code} and signal ${signal}`)
      proxyProcess = null
      proxyStartTime = null
    })

    // Handle process errors
    proxyProcess.on('error', (error) => {
      console.error('[Proxy Control] Failed to start proxy process:', error)
      proxyProcess = null
      proxyStartTime = null
    })

    console.log('[Proxy Control] Provider-router started with PID:', proxyProcess.pid)

    // Return actual status (processes are spawned but may not be fully ready)
    const providerRouterRunning = proxyProcess !== null && isProcessRunning(proxyProcess.pid)
    const qwenProxyRunning = qwenProxyProcess !== null && isProcessRunning(qwenProxyProcess.pid)

    const responseData = {
      success: true,
      status: 'starting',
      providerRouter: {
        running: providerRouterRunning,
        port: 3001,
        pid: providerRouterRunning ? proxyProcess.pid : null,
        uptime: 0
      },
      qwenProxy: {
        running: qwenProxyRunning,
        port: 3000,
        pid: qwenProxyRunning ? qwenProxyProcess.pid : null,
        uptime: 0
      },
      message: 'Proxy servers are starting (qwen-proxy started first, provider-router starting now)'
    }

    // Emit proxy status change event
    eventEmitter.emitProxyStatus(responseData)

    res.json(responseData)
  } catch (error) {
    console.error('[Proxy Control] Error starting proxy:', error)
    proxyProcess = null
    proxyStartTime = null
    qwenProxyProcess = null
    qwenProxyStartTime = null

    res.status(500).json({
      success: false,
      status: 'error',
      error: `Failed to start proxy servers: ${error.message}`,
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
      },
      message: `Failed to start proxy servers: ${error.message}`
    })
  }
})

/**
 * POST /api/proxy/stop
 * Stop the provider-router proxy server
 */
router.post('/stop', (req, res) => {
  // Check if proxy is running
  if (!proxyProcess) {
    const responseData = {
      success: true,
      status: 'stopped',
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
      },
      message: 'Proxy servers are not running'
    }

    // Emit status event
    eventEmitter.emitProxyStatus(responseData)

    return res.json(responseData)
  }

  try {
    console.log('[Proxy Control] Stopping proxy server...')

    // Stop qwen-proxy first
    stopQwenProxy()

    // Kill the proxy process
    const killed = proxyProcess.kill('SIGTERM')

    if (killed) {
      // Give it a moment for graceful shutdown
      setTimeout(() => {
        // Force kill if still running
        if (proxyProcess && isProcessRunning(proxyProcess.pid)) {
          console.log('[Proxy Control] Force killing proxy process')
          proxyProcess.kill('SIGKILL')
        }
      }, 2000)

      proxyProcess = null
      proxyStartTime = null

      const responseData = {
        success: true,
        status: 'stopped',
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
        },
        message: 'Proxy servers stopped successfully'
      }

      // Emit proxy status change event
      eventEmitter.emitProxyStatus(responseData)

      res.json(responseData)
    } else {
      throw new Error('Failed to send kill signal to process')
    }
  } catch (error) {
    console.error('[Proxy Control] Error stopping proxy:', error)

    // Reset state anyway
    proxyProcess = null
    proxyStartTime = null
    qwenProxyProcess = null
    qwenProxyStartTime = null

    const responseData = {
      success: false,
      status: 'error',
      error: `Failed to stop proxy server: ${error.message}`,
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
      },
      message: `Failed to stop proxy server: ${error.message}`
    }

    // Emit status event even on error
    eventEmitter.emitProxyStatus(responseData)

    res.status(500).json(responseData)
  }
})

/**
 * GET /api/proxy/status
 * Get current status of the provider-router proxy server and qwen-proxy
 * Also includes dashboard data (providers, models, credentials)
 */
router.get('/status', (req, res) => {
  const providerRouterRunning = proxyProcess !== null && isProcessRunning(proxyProcess.pid)
  const qwenProxyRunning = qwenProxyProcess !== null && isProcessRunning(qwenProxyProcess.pid)

  // Clean up state if processes are dead
  if (proxyProcess && !providerRouterRunning) {
    proxyProcess = null
    proxyStartTime = null
  }
  if (qwenProxyProcess && !qwenProxyRunning) {
    qwenProxyProcess = null
    qwenProxyStartTime = null
  }

  const providerRouterUptime = proxyStartTime && providerRouterRunning ? Math.floor((Date.now() - proxyStartTime) / 1000) : 0
  const qwenProxyUptime = qwenProxyStartTime && qwenProxyRunning ? Math.floor((Date.now() - qwenProxyStartTime) / 1000) : 0

  const allRunning = providerRouterRunning && qwenProxyRunning
  const anyRunning = providerRouterRunning || qwenProxyRunning

  // Query database directly for dashboard data
  let providers = []
  let models = []
  let credentials = { valid: false, expiresAt: null }

  try {
    providers = ProviderService.getAll()
    models = ModelService.getAll()

    // Check credentials validity (same logic as getCredentials controller)
    const credData = QwenCredentialsService.getCredentials()
    if (credData) {
      const now = Math.floor(Date.now() / 1000)
      const isExpired = credData.expires_at && credData.expires_at <= now
      const hasRequiredFields = !!(credData.token && credData.cookies)
      credentials = {
        valid: hasRequiredFields && !isExpired,
        expiresAt: credData.expires_at || null
      }
    }
  } catch (error) {
    console.error('[Status] Error fetching dashboard data from database:', error)
  }

  res.json({
    status: allRunning ? 'running' : (anyRunning ? 'partial' : 'stopped'),
    providerRouter: {
      running: providerRouterRunning,
      port: config.proxy.providerRouterPort,
      pid: providerRouterRunning ? proxyProcess.pid : null,
      uptime: providerRouterUptime
    },
    qwenProxy: {
      running: qwenProxyRunning,
      port: config.proxy.qwenProxyPort,
      pid: qwenProxyRunning ? qwenProxyProcess.pid : null,
      uptime: qwenProxyUptime
    },
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
    message: allRunning ? 'All proxy servers are running' : (anyRunning ? 'Some proxy servers are running' : 'Proxy servers are not running')
  })
})

/**
 * Helper function to wait for a service to become available
 * @param {string} url - URL to check
 * @param {number} timeout - Maximum time to wait in milliseconds
 * @param {number} interval - Check interval in milliseconds
 * @returns {Promise<boolean>} - True if service becomes available, false if timeout
 */
async function waitForService(url, timeout = 15000, interval = 500) {
  const startTime = Date.now()

  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(1000) // 1 second timeout per request
      })

      if (response.ok) {
        return true
      }
    } catch (error) {
      // Service not ready yet, continue waiting
    }

    // Wait before next check
    await new Promise(resolve => setTimeout(resolve, interval))
  }

  return false
}

/**
 * Helper function to check if a process is running
 */
function isProcessRunning(pid) {
  if (!pid) {
    return false
  }

  try {
    // Sending signal 0 checks if process exists without actually sending a signal
    process.kill(pid, 0)
    return true
  } catch (error) {
    // ESRCH means no such process
    // EPERM means process exists but we don't have permission (still running)
    return error.code === 'EPERM'
  }
}

/**
 * Start the qwen-proxy server
 */
async function startQwenProxy() {
  // Check if qwen-proxy is already running
  if (qwenProxyProcess && isProcessRunning(qwenProxyProcess.pid)) {
    console.log('[Qwen Proxy] Already running')
    return
  }

  try {
    // Path to qwen-proxy directory (backend/api-server/src/routes -> backend/qwen-proxy)
    const qwenProxyPath = path.join(__dirname, '../../../qwen-proxy')

    console.log('[Qwen Proxy] Starting at:', qwenProxyPath)

    // Spawn qwen-proxy process
    const isWindows = process.platform === 'win32'
    const npmCmd = isWindows ? 'npm.cmd' : 'npm'

    qwenProxyProcess = spawn(npmCmd, ['run', 'dev'], {
      cwd: qwenProxyPath,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: isWindows,
      env: { ...process.env }
    })

    qwenProxyStartTime = Date.now()

    // Log stdout from qwen-proxy
    if (qwenProxyProcess.stdout) {
      qwenProxyProcess.stdout.on('data', (data) => {
        console.log('[Qwen Proxy]', data.toString().trim())
      })
    }

    // Log stderr from qwen-proxy
    if (qwenProxyProcess.stderr) {
      qwenProxyProcess.stderr.on('data', (data) => {
        console.error('[Qwen Proxy Error]', data.toString().trim())
      })
    }

    // Handle process exit
    qwenProxyProcess.on('exit', (code, signal) => {
      console.log(`[Qwen Proxy] Process exited with code ${code} and signal ${signal}`)
      qwenProxyProcess = null
      qwenProxyStartTime = null
    })

    // Handle process errors
    qwenProxyProcess.on('error', (error) => {
      console.error('[Qwen Proxy] Failed to start:', error)
      qwenProxyProcess = null
      qwenProxyStartTime = null
    })

    console.log('[Qwen Proxy] Started with PID:', qwenProxyProcess.pid)
  } catch (error) {
    console.error('[Qwen Proxy] Error starting:', error)
    qwenProxyProcess = null
    qwenProxyStartTime = null
  }
}

/**
 * Stop the qwen-proxy server
 */
function stopQwenProxy() {
  if (!qwenProxyProcess || !isProcessRunning(qwenProxyProcess.pid)) {
    console.log('[Qwen Proxy] Not running')
    return
  }

  try {
    console.log('[Qwen Proxy] Stopping...')

    // Kill the process
    qwenProxyProcess.kill('SIGTERM')

    // Give it a moment for graceful shutdown, then force kill if needed
    setTimeout(() => {
      if (qwenProxyProcess && isProcessRunning(qwenProxyProcess.pid)) {
        console.log('[Qwen Proxy] Force killing process')
        qwenProxyProcess.kill('SIGKILL')
      }
    }, 2000)

    qwenProxyProcess = null
    qwenProxyStartTime = null
  } catch (error) {
    console.error('[Qwen Proxy] Error stopping:', error)
    qwenProxyProcess = null
    qwenProxyStartTime = null
  }
}

export default router
