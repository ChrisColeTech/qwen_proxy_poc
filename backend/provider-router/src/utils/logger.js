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
  reset: '\x1b[0m',
}

class Logger {
  constructor() {
    this.level = LEVELS[config.logging.level] || LEVELS.info
  }

  timestamp() {
    return new Date().toISOString()
  }

  shouldLog(level) {
    return LEVELS[level] >= this.level
  }

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

  debug(message, data) {
    if (this.shouldLog('debug')) {
      console.log(this.format('debug', message, data))
    }
  }

  info(message, data) {
    if (this.shouldLog('info')) {
      console.log(this.format('info', message, data))
    }
  }

  warn(message, data) {
    if (this.shouldLog('warn')) {
      console.warn(this.format('warn', message, data))
    }
  }

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

  request(method, url, provider) {
    if (this.shouldLog('info') && config.logging.logRequests) {
      this.info(`${method} ${url} → ${provider}`)
    }
  }

  response(status, provider) {
    if (this.shouldLog('info') && config.logging.logResponses) {
      this.info(`← ${status} from ${provider}`)
    }
  }
}

export const logger = new Logger()
export default logger
