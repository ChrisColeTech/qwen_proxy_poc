/**
 * History Command
 * Shows recent request history from database logs
 */

import { initDatabase } from '../../database/connection.js'
import { LogsService } from '../../database/services/logs-service.js'
import { formatTable } from '../utils/table-formatter.js'
import { error as errorColor, bold, info, dim } from '../utils/colors.js'

export function historyCommand(options) {
  try {
    // Initialize database
    initDatabase()

    // Parse options
    const limit = parseInt(options.limit) || 50
    const provider = options.provider || null

    // Get logs
    let logs
    if (provider) {
      logs = LogsService.getByProvider(provider, limit)
    } else {
      logs = LogsService.getRecent(limit)
    }

    // Check if any logs exist
    if (!logs || logs.length === 0) {
      if (provider) {
        console.log('\n' + info(`No request history found for provider: ${bold(provider)}`))
      } else {
        console.log('\n' + info('No request history found. Make some API requests first.'))
      }
      console.log()
      return
    }

    // Format logs for display
    const historyData = logs.map(log => {
      // Format timestamp as human-readable date
      const date = new Date(log.created_at * 1000)
      const timestamp = date.toLocaleString()

      // Format duration
      const duration = log.duration_ms ? `${log.duration_ms}ms` : 'N/A'

      // Format status code with color
      let statusDisplay = log.status_code || 'N/A'
      if (log.error) {
        statusDisplay = errorColor(statusDisplay)
      }

      return {
        'Request ID': log.request_id.substring(0, 8) + '...',
        'Provider': log.provider,
        'Endpoint': log.endpoint,
        'Method': log.method,
        'Status': statusDisplay,
        'Duration': duration,
        'Timestamp': timestamp,
      }
    })

    // Display header
    const header = provider
      ? `Request History - ${bold(provider)} (Last ${logs.length} requests)`
      : `Request History (Last ${logs.length} requests)`

    console.log('\n' + bold(header))
    console.log(formatTable(historyData, [
      'Request ID',
      'Provider',
      'Endpoint',
      'Method',
      'Status',
      'Duration',
      'Timestamp'
    ]))
    console.log()

  } catch (err) {
    console.error(errorColor('\nError: ' + err.message))
    process.exit(1)
  }
}
