/**
 * Logger Utility
 * Provides formatted logging with levels
 */

import config from '../config.js'

const LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const COLORS = {
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m',  // Green
  warn: '\x1b[33m',  // Yellow
  error: '\x1b[31m', // Red
  success: '\x1b[32m', // Green (same as info)
  reset: '\x1b[0m',
}

class Logger {
  constructor() {
    this.level = LEVELS[config.logging.level] || LEVELS.info
  }

  /**
   * Format timestamp
   */
  timestamp() {
    return new Date().toISOString()
  }

  /**
   * Check if level should be logged
   */
  shouldLog(level) {
    return LEVELS[level] >= this.level
  }

  /**
   * Format log message
   */
  format(level, message, data) {
    const color = COLORS[level]
    const reset = COLORS.reset
    const timestamp = this.timestamp()
    const prefix = `${color}[${level.toUpperCase()}] ${timestamp}${reset}`

    if (data) {
      return `${prefix} ${message}\n${JSON.stringify(data, null, 2)}`
    }
    return `${prefix} ${message}`
  }

  /**
   * Log debug message
   */
  debug(message, data) {
    if (this.shouldLog('debug')) {
      console.log(this.format('debug', message, data))
    }
  }

  /**
   * Log info message
   */
  info(message, data) {
    if (this.shouldLog('info')) {
      console.log(this.format('info', message, data))
    }
  }

  /**
   * Log warning message
   */
  warn(message, data) {
    if (this.shouldLog('warn')) {
      console.warn(this.format('warn', message, data))
    }
  }

  /**
   * Log error message
   */
  error(message, error) {
    if (this.shouldLog('error')) {
      if (error instanceof Error) {
        console.error(this.format('error', message))
        console.error(error.stack)
      } else {
        console.error(this.format('error', message, error))
      }
    }
  }

  /**
   * Log HTTP request
   */
  request(method, url, body) {
    if (this.shouldLog('debug')) {
      this.debug(`→ ${method} ${url}`, body)
    } else if (this.shouldLog('info')) {
      this.info(`→ ${method} ${url}`)
    }
  }

  /**
   * Log HTTP response
   */
  response(status, body) {
    if (this.shouldLog('debug')) {
      this.debug(`← ${status}`, body)
    } else if (this.shouldLog('info')) {
      this.info(`← ${status}`)
    }
  }

  /**
   * Log tool execution
   */
  tool(toolName, args, result) {
    if (this.shouldLog('debug')) {
      this.debug(`🔧 Tool: ${toolName}`, { args, result })
    } else if (this.shouldLog('info')) {
      this.info(`🔧 Executing tool: ${toolName}`)
    }
  }

  /**
   * Log success message
   */
  success(message, data) {
    if (this.shouldLog('info')) {
      const color = COLORS.success
      const reset = COLORS.reset
      if (data) {
        console.log(`${color}${message}${reset}`, data)
      } else {
        console.log(`${color}${message}${reset}`)
      }
    }
  }
}

// Export singleton instance
export const logger = new Logger()
export default logger
